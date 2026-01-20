import axios from 'axios';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs/client';

// 环境配置（替换为你的 Airwallex 信息）
const AIRWALLEX_CONFIG = {
  clientId: process.env.AIRWALLEX_CLIENT_ID!,
  apiKey: process.env.AIRWALLEX_API_KEY!,
  apiSecret: process.env.AIRWALLEX_API_SECRET!,
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api.airwallex.com' 
    : 'https://api-demo.airwallex.com',
  appUrl: process.env.NEXT_PUBLIC_APP_URL!,
};

// 获取 Airwallex 访问令牌（24小时有效期，建议缓存）
const getAccessToken = async () => {
  const { data } = await axios.post(`${AIRWALLEX_CONFIG.baseUrl}/api/v1/authentication/login`, {
    client_id: AIRWALLEX_CONFIG.clientId,
    api_key: AIRWALLEX_CONFIG.apiKey,
    api_secret: AIRWALLEX_CONFIG.apiSecret,
  });
  return data.token;
};

// 创建支付会话（适配首次1美元/修改99美元）
export async function createAirwallexSession(
  gridId: number,
  userId: string,
  amount: number,  // 1 或 99 美元
  priceType: 'initial' | 'modify'
) {
  const supabase = createClientComponentClient();
  const token = await getAccessToken();

  // 1. 校验格子状态（未到期 + 归属正确）
  const { data: grid, error } = await supabase
    .from('grids')
    .select('user_id, storage_days')
    .eq('id', gridId)
    .single();
  if (error) throw new Error(`格子查询失败: ${error.message}`);

  if (priceType === 'initial' && grid.user_id) {
    throw new Error(`格子 ${gridId} 已被占用`);
  }
  if (priceType === 'modify') {
    if (grid.user_id !== userId) throw new Error(`无格子 ${gridId} 修改权限`);
    if (grid.storage_days <= 0) throw new Error(`格子 ${gridId} 已到期，无法修改`);
  }

  // 2. 创建 Payment Intent（Airwallex 核心支付对象）
  const intentData = {
    amount: amount.toFixed(2),
    currency: 'USD',
    description: priceType === 'initial' 
      ? `Grid #${gridId} 首次购买（30天存储）` 
      : `Grid #${gridId} 单次修改（未到期可用）`,
    metadata: { gridId: gridId.toString(), userId, priceType },
    capture_method: 'automatic',
    confirm: true,
    return_url: `${AIRWALLEX_CONFIG.appUrl}/payment-result?gridId=${gridId}`,
  };

  const { data: intent } = await axios.post(
    `${AIRWALLEX_CONFIG.baseUrl}/api/v1/pa/payment_intents/create`,
    intentData,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return {
    paymentIntentId: intent.id,
    checkoutUrl: intent.next_action.redirect.url,  // 托管支付页面 URL
  };
}

// 处理支付回调（Webhook 接收）
export async function handleAirwallexWebhook(req: Request) {
  const supabase = createClientComponentClient();
  const event = await req.json();

  if (event.type === 'payment_intent.succeeded') {
    const { gridId, userId, priceType } = event.data.object.metadata;
    const gridIdNum = parseInt(gridId);

    // 首次购买：绑定用户 + 初始化存储天数
    if (priceType === 'initial') {
      await supabase
        .from('grids')
        .update({ user_id: userId, storage_days: 30 })
        .eq('id', gridIdNum);
    }
    // 修改：仅记录日志，不重置存储天数（点赞延长逻辑不变）
    console.log(`支付成功：${priceType} grid ${gridIdNum} by user ${userId}`);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}