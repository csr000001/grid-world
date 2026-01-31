import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// 创建 Supabase 客户端（运行时）
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// 验证PayPal Webhook签名
async function verifyWebhookSignature(req: NextRequest, body: string) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  // 生产环境必须配置 webhook ID
  if (process.env.NODE_ENV === 'production' && !webhookId) {
    throw new Error('PAYPAL_WEBHOOK_ID must be configured in production');
  }

  // 开发环境如果没配置，跳过验证
  if (!webhookId) {
    console.warn('⚠️ PayPal webhook verification skipped (development mode)');
    return true;
  }

  const headers = {
    'auth-algo': req.headers.get('paypal-auth-algo') || '',
    'cert-url': req.headers.get('paypal-cert-url') || '',
    'transmission-id': req.headers.get('paypal-transmission-id') || '',
    'transmission-sig': req.headers.get('paypal-transmission-sig') || '',
    'transmission-time': req.headers.get('paypal-transmission-time') || '',
  };

  const verifyData = {
    auth_algo: headers['auth-algo'],
    cert_url: headers['cert-url'],
    transmission_id: headers['transmission-id'],
    transmission_sig: headers['transmission-sig'],
    transmission_time: headers['transmission-time'],
    webhook_id: webhookId,
    webhook_event: JSON.parse(body),
  };

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify(verifyData),
  });

  const result = await response.json();
  return result.verification_status === 'SUCCESS';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const event = JSON.parse(body);

    // 验证webhook签名
    const isValid = await verifyWebhookSignature(req, body);
    if (!isValid) {
      console.error('PayPal webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 处理支付完成事件
    if (event.event_type === 'CHECKOUT.ORDER.APPROVED' || event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const customId = event.resource.purchase_units?.[0]?.custom_id;
      if (!customId) {
        console.error('Missing custom_id in PayPal webhook');
        return NextResponse.json({ received: true });
      }

      const { gridId, userId, priceType, curtainColor, photoUrl } = JSON.parse(customId);

      // 获取 Supabase 客户端
      const supabase = getSupabaseClient();

      // 首次购买：绑定用户 + 初始化存储天数 + 保存照片和颜色
      if (priceType === 'initial') {
        await supabase
          .from('grids')
          .update({
            user_id: userId,
            storage_days: 30,
            curtain_color: curtainColor,
            photo_url: photoUrl,
            created_at: new Date().toISOString(),
          })
          .eq('id', gridId);
      } else if (priceType === 'modify') {
        // 修改：更新照片和颜色，记录修改时间
        await supabase
          .from('grids')
          .update({
            curtain_color: curtainColor,
            photo_url: photoUrl,
            modified_at: new Date().toISOString(),
          })
          .eq('id', gridId)
          .eq('user_id', userId);
      }

      console.log(`PayPal支付成功：${priceType} grid ${gridId} by user ${userId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('PayPal webhook处理错误:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
