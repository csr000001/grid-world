import { NextRequest, NextResponse } from 'next/server';

const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// 获取PayPal访问令牌
async function getPayPalAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { gridId, userId, amount, priceType, curtainColor, photoUrl } = await req.json();

    // 验证必填参数
    if (!gridId || !userId || !amount || !priceType || !curtainColor || !photoUrl) {
      return NextResponse.json(
        { error: '缺少必填参数' },
        { status: 400 }
      );
    }

    // 获取PayPal访问令牌
    const accessToken = await getPayPalAccessToken();

    // 创建PayPal订单
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2),
          },
          description: priceType === 'initial'
            ? `Grid #${gridId} 首次购买（30天存储）`
            : `Grid #${gridId} 单次修改（未到期可用）`,
          custom_id: JSON.stringify({ gridId, userId, priceType, curtainColor, photoUrl }),
        },
      ],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success?provider=paypal&gridId=${gridId}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upload?payment=cancelled`,
        brand_name: 'Grid World',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
      },
    };

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderData),
    });

    const order = await response.json();

    if (!response.ok) {
      throw new Error(order.message || 'PayPal订单创建失败');
    }

    // 获取approval URL
    const approvalUrl = order.links.find((link: any) => link.rel === 'approve')?.href;

    return NextResponse.json({
      orderId: order.id,
      approvalUrl,
    });
  } catch (error: any) {
    console.error('PayPal订单创建错误:', error);
    return NextResponse.json(
      { error: error.message || 'PayPal订单创建失败' },
      { status: 500 }
    );
  }
}
