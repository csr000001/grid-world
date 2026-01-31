// PayPal SDK 集成工具
// 用于在客户端加载PayPal SDK并创建支付按钮

export interface PayPalConfig {
  clientId: string;
  currency?: string;
  intent?: 'capture' | 'authorize';
}

// 动态加载PayPal SDK脚本
export function loadPayPalScript(config: PayPalConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    // 检查是否已加载
    if (window.paypal) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${config.clientId}&currency=${config.currency || 'USD'}&intent=${config.intent || 'capture'}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('PayPal SDK加载失败'));
    document.body.appendChild(script);
  });
}

// 创建PayPal订单（调用后端API）
export async function createPayPalOrder(
  gridId: number,
  userId: string,
  amount: number,
  priceType: 'initial' | 'modify',
  curtainColor: string,
  photoUrl: string
): Promise<{ orderId: string; approvalUrl: string }> {
  const response = await fetch('/api/paypal/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gridId,
      userId,
      amount,
      priceType,
      curtainColor,
      photoUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'PayPal订单创建失败');
  }

  return response.json();
}

// 扩展Window类型以支持PayPal SDK
declare global {
  interface Window {
    paypal?: any;
  }
}
