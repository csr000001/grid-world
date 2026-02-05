'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-v2';

interface GridData {
  user_id: string | null;
  photo_url: string | null;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('正在处理支付结果...');

  useEffect(() => {
    const processPayment = async () => {
      const provider = searchParams.get('provider');
      const gridId = searchParams.get('gridId');

      if (!provider || !gridId) {
        setStatus('error');
        setMessage('支付参数缺失');
        return;
      }

      try {
        // PayPal支付成功后，数据由webhook处理
        // 这里只需验证格子是否已更新
        await new Promise(resolve => setTimeout(resolve, 2000)); // 等待webhook处理

        const { data: grid } = await supabase
          .from('grids')
          .select('user_id, photo_url')
          .eq('id', gridId)
          .single<GridData>();

        if (grid?.user_id && grid?.photo_url) {
          setStatus('success');
          setMessage('支付成功！格子已更新');
        } else {
          setStatus('error');
          setMessage('支付处理中，请稍后刷新页面查看');
        }
      } catch (error: any) {
        console.error('支付处理错误:', error);
        setStatus('error');
        setMessage(`支付处理失败: ${error.message}`);
      }
    };

    processPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center max-w-md">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-xl">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h1 className="text-white text-2xl font-bold mb-4">支付成功！</h1>
            <p className="text-gray-300 mb-6">{message}</p>
            <button
              onClick={() => router.push('/upload')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              返回格子世界
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-500 text-6xl mb-4">✗</div>
            <h1 className="text-white text-2xl font-bold mb-4">支付处理失败</h1>
            <p className="text-gray-300 mb-6">{message}</p>
            <button
              onClick={() => router.push('/upload')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              返回格子世界
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">加载中...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
