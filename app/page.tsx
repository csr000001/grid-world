'use client';
import { useState, useEffect, useRef } from 'react';
// 导入@tanstack/react-virtual的核心方法
import { useVirtualizer } from '@tanstack/react-virtual';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs/client';
import { createCheckoutSession } from '@/lib/stripe';
import Link from "next/link";

export default function Home() {
  return (
    <div className="text-center mt-16">
      <h1 className="text-4xl md:text-6xl font-bold text-blue-600 mb-8">
        欢迎来到 {process.env.NEXT_PUBLIC_SITE_NAME}
      </h1>
      <p className="text-xl md:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto">
        我们提供1亿个优质格子供你选择，每个格子都拥有唯一标识，你可以购买专属格子，展示你的个人信息、品牌内容等。
        全程支持安全合规的全球支付方式，保障你的交易安全。
      </p>

      {/* 核心按钮（预留支付入口，当前仅跳转格子列表） */}
      <Link
        href="/grids"
        className="bg-blue-600 text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-blue-700 transition-colors"
      >
        浏览格子列表
      </Link>

      {/* 业务优势展示（提升可信度） */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
        <div className="p-6 border rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold text-blue-600 mb-4">唯一标识</h3>
          <p className="text-gray-700">每个格子拥有唯一编号，永久有效，不会重复，保障你的专属权益。</p>
        </div>
        <div className="p-6 border rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold text-blue-600 mb-4">安全支付</h3>
          <p className="text-gray-700">支持全球主流合规支付方式，交易全程加密，资金安全有保障。</p>
        </div>
        <div className="p-6 border rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold text-blue-600 mb-4">灵活展示</h3>
          <p className="text-gray-700">购买后可自由编辑格子内容，展示个人、品牌信息，随时随地更新。</p>
        </div>
      </div>
    </div>
  );
}
// Grid配置（保持原有参数）
const GRID_SIZE = 30;
const COLS_PER_ROW = 100;
const TOTAL_GRIDS = 10000;
const TOTAL_ROWS = Math.ceil(TOTAL_GRIDS / COLS_PER_ROW);

export default function Home() {
  const supabase = createClientComponentClient();
  const [session, setSession] = useState(null);
  const [grids, setGrids] = useState<any[]>([]);
  const [userGrids, setUserGrids] = useState<number[]>([]);
  const [currentViewGrid, setCurrentViewGrid] = useState<any>(null);
  // 容器Ref（用于获取视口尺寸）
  const containerRef = useRef<HTMLDivElement>(null);

  // ========== 原有Session/Grid数据逻辑（保持不变） ==========
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, newSession) => setSession(newSession));
    getSession();
    return () => subscription?.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const fetchGrids = async () => {
      const { data } = await supabase.from('grids').select('*').order('id');
      setGrids(data || []);
    };
    fetchGrids();
  }, [supabase]);

  useEffect(() => {
    if (!session?.user) return;
    const fetchUserGrids = async () => {
      const { data } = await supabase.from('grids').select('id').eq('user_id', session.user.id);
      setUserGrids(data?.map(g => g.id) || []);
    };
    fetchUserGrids();
  }, [supabase, session]);

  // ========== 替换为@tanstack/react-virtual的虚拟滚动逻辑 ==========
  const virtualizer = useVirtualizer({
    count: TOTAL_ROWS, // 总行数
    getScrollElement: () => containerRef.current,
    // 每行高度（固定为GRID_SIZE）
    estimateSize: () => GRID_SIZE,
    // 视口尺寸：容器的宽高
    measureElement: () => ({
      width: containerRef.current?.offsetWidth || 0,
      height: containerRef.current?.offsetHeight || 0,
    }),
    overscan: 5, // 预加载前后5行，优化滚动体验
  });

  // 渲染单个Grid单元格
  const renderGridCell = (rowIndex: number, columnIndex: number) => {
    const gridIndex = rowIndex * COLS_PER_ROW + columnIndex;
    if (gridIndex >= TOTAL_GRIDS) return null;
    const gridId = gridIndex + 1;
    const grid = grids.find(g => g.id === gridId) || { curtain_color: '#FFFFFF' };
    const isUserGrid = userGrids.includes(gridId);

    return (
      <div
        key={`${rowIndex}-${columnIndex}`}
        style={{
          width: GRID_SIZE,
          height: GRID_SIZE,
          backgroundColor: grid.curtain_color,
          border: isUserGrid ? '2px solid gold' : '1px solid #eee',
          cursor: 'pointer',
        }}
        onClick={() => {
          const grid = grids.find(g => g.id === gridId);
          if (!grid) return;
          grid.user_id ? setCurrentViewGrid(grid) : handleBuyGrid(gridId);
        }}
      />
    );
  };

  // 渲染单行Grid
  const renderRow = (virtualRow: any) => {
    const rowIndex = virtualRow.index;
    return (
      <div
        key={rowIndex}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${virtualRow.start}px)`,
          height: GRID_SIZE,
          display: 'flex',
        }}
      >
        {Array.from({ length: COLS_PER_ROW }).map((_, colIndex) =>
          renderGridCell(rowIndex, colIndex)
        )}
      </div>
    );
  };

  // ========== 原有业务逻辑（保持不变） ==========
  const handleBuyGrid = async (gridId: number) => {
    if (!session) {
      await supabase.auth.signInWithOAuth({ provider: 'google' });
      return;
    }
    const grid = grids.find(g => g.id === gridId);
    if (grid?.user_id) return alert('This grid is already occupied!');
    try {
      const checkoutUrl = await createCheckoutSession(gridId, session.user.id);
      window.location.href = checkoutUrl;
    } catch (error: any) {
      alert(error.message);
    }
  };

  const focusMyGrid = () => {
    if (userGrids.length === 0) return alert('You have no grids!');
    const firstGridId = userGrids[0];
    const row = Math.floor((firstGridId - 1) / COLS_PER_ROW);
    containerRef.current?.scrollTo({ top: row * GRID_SIZE, behavior: 'smooth' });
    const grid = grids.find(g => g.id === firstGridId);
    setCurrentViewGrid(grid);
  };

  // ========== 页面渲染（替换Grid部分） ==========
  return (
    <div className="w-full h-screen overflow-hidden flex flex-col">
      <div className="p-4 bg-gray-100 flex justify-between items-center">
        <h1 className="text-xl font-bold">Grid World (10,000 Grids)</h1>
        <div>
          {session ? (
            <>
              <button onClick={focusMyGrid} className="px-4 py-2 bg-blue-500 text-white rounded mr-2">
                Focus My Grid
              </button>
              <button onClick={() => supabase.auth.signOut()} className="px-4 py-2 bg-red-500 text-white rounded">
                Logout
              </button>
            </>
          ) : (
            <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className="px-4 py-2 bg-green-500 text-white rounded">
              Login/Register
            </button>
          )}
        </div>
      </div>

      {/* 替换为@tanstack/react-virtual的Grid容器 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto relative"
        style={{ height: 'calc(100vh - 64px)' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map(renderRow)}
        </div>
      </div>

      {/* 图片预览弹窗（保持不变） */}
      {currentViewGrid && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="relative">
            {currentViewGrid.photo_url ? (
              <img src={currentViewGrid.photo_url} alt="Grid content" className="max-w-[80vw] max-h-[80vh]" />
            ) : (
              <div className="w-64 h-64 bg-gray-200 flex items-center justify-center">No photo yet</div>
            )}
            <button onClick={() => setCurrentViewGrid(null)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full">
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}