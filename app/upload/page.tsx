'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { Grid } from 'react-window';
import { supabase, SUPABASE_CONFIGURED } from '@/lib/supabase-v2';
import { v4 as uuidv4 } from 'uuid';
import AuthModal from '@/components/AuthModal';
import { useRouter, useSearchParams } from 'next/navigation';

// ======================== 类型定义 ========================
interface GridData {
  id: number;
  user_id: string | null;
  storage_days: number;
  like_count: number;
  curtain_color: string;
  photo_url: string | null;
  created_at: string;
  modified_at: string | null;
}

// ======================== 基础配置常量 ========================
const GRID_SIZE = 30; // 单个格子尺寸（px）
const COLS_PER_ROW = 100; // 每行格子数
const INITIAL_GRIDS = 10000; // 初始格子总数
const EXPAND_STEP = 10000; // 每次扩展格子数
const MAX_GRIDS = 100000000; // 格子总数上限（1亿）
const FILL_THRESHOLD = 0.5; // 填充率超过50%自动扩展
const INITIAL_PRICE = 1; // 首次购买价格（美元）
const MODIFY_PRICE = 99; // 单次修改价格（美元）

function UploadPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ======================== 核心状态管理 ========================
  // 用户会话（登录状态）
  const [session, setSession] = useState<any>(null);
  // 所有格子数据
  const [grids, setGrids] = useState<GridData[]>([]);
  // 当前总格子数（动态扩展）
  const [totalGrids, setTotalGrids] = useState(INITIAL_GRIDS);
  // 用户拥有的格子ID列表
  const [userGrids, setUserGrids] = useState<number[]>([]);
  // 当前预览的格子（照片浏览）
  const [currentViewGrid, setCurrentViewGrid] = useState<GridData | null>(null);
  // 选中的格子（编辑/付费）
  const [selectedGrid, setSelectedGrid] = useState<number | null>(null);
  // 编辑格子状态
  const [editGrid, setEditGrid] = useState<{
    id: number | null;
    color: string;
    photo: File | null;
    photoUrl: string | null;
    priceType: 'initial' | 'modify';
    isExpired: boolean; // 是否到期（storage_days ≤ 0）
  }>({
    id: null,
    color: '#80808080', // 半透明灰色（空白格默认）
    photo: null,
    photoUrl: null,
    priceType: 'initial',
    isExpired: false,
  });
  // 用户已点赞的格子ID列表（防重复点赞）
  const [userLikedGrids, setUserLikedGrids] = useState<number[]>([]);
  // 格子容器Ref（用于滚动定位）
  const gridRef = useRef<any>(null);
  // 加载状态
  const [loading, setLoading] = useState(true);
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ======================== 初始化逻辑 ========================
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);

        // Check if Supabase is configured
        if (!SUPABASE_CONFIGURED) {
          console.warn('⚠️ Supabase not configured. App will run in demo mode.');
          setLoading(false);
          return;
        }

        // 1. 获取用户登录会话
        const { data: sessionData } = await supabase.auth.getSession();
        setSession(sessionData.session);

        // Check if user came from grids page with position parameter
        const position = searchParams?.get('position')
        if (position && !sessionData.session) {
          // User not logged in but trying to purchase - show auth modal
          setShowAuthModal(true)
        }

        // 监听会话变化（登录/登出）
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event: any, newSession: any) => setSession(newSession)
        );

        // 2. 拉取所有格子数据
        const queryResult = await supabase.from('grids').select('*').order('id', { ascending: true });
        const gridsArray: GridData[] = queryResult?.data || [];
        setGrids(gridsArray);

        // 3. 动态扩展格子（填充率超50%时）
        const filledCount = gridsArray.filter((g: GridData) => g.user_id).length;
        const fillRate = filledCount / totalGrids;
        if (fillRate >= FILL_THRESHOLD && totalGrids + EXPAND_STEP <= MAX_GRIDS) {
          const newTotal = Math.min(totalGrids + EXPAND_STEP, MAX_GRIDS);
          setTotalGrids(newTotal);
          // 批量新增扩展的空白格子
          const newGrids: GridData[] = Array.from({ length: EXPAND_STEP }, (_, i) => ({
            id: totalGrids + i + 1,
            user_id: null,
            storage_days: 30, // 初始存储30天
            like_count: 0,
            curtain_color: '#80808080',
            photo_url: null,
            created_at: new Date().toISOString(),
            modified_at: null,
          }));
          await supabase.from('grids').insert(newGrids);
        }

        // 4. 拉取用户点赞记录（防重复点赞）
        if (sessionData.session?.user) {
          const likesResult = await supabase
            .from('grid_likes')
            .select('grid_id')
            .eq('user_id', sessionData.session.user.id);
          setUserLikedGrids((likesResult?.data as any)?.map((l: any) => l.grid_id) || []);
        }

        // 5. 拉取用户拥有的格子
        if (sessionData.session?.user) {
          const userGridsResult = await supabase
            .from('grids')
            .select('id, storage_days')
            .eq('user_id', sessionData.session.user.id);
          setUserGrids((userGridsResult?.data as any)?.map((g: any) => g.id) || []);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('初始化失败:', error);
        alert('系统初始化失败，请刷新重试');
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [supabase, totalGrids]);

  // ======================== 选中格子时的状态更新 ========================
  useEffect(() => {
    if (!selectedGrid || !session) return;

    const updateEditState = () => {
      const grid = grids.find(g => g.id === selectedGrid);
      if (!grid) return;

      // 已购买的格子：判断是否到期
      if (grid.user_id === session.user.id) {
        const isExpired = (grid.storage_days || 0) <= 0;
        setEditGrid({
          id: selectedGrid,
          color: grid.curtain_color || '#80808080',
          photo: null,
          photoUrl: grid.photo_url || null,
          priceType: 'modify',
          isExpired,
        });
      } else {
        // 空白格子：首次购买
        setEditGrid({
          id: selectedGrid,
          color: '#80808080',
          photo: null,
          photoUrl: null,
          priceType: 'initial',
          isExpired: false,
        });
      }
    };

    updateEditState();
  }, [selectedGrid, session, grids]);

  // ======================== 照片上传逻辑 ========================
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedGrid) return;
    const file = e.target.files[0];

    try {
      // 上传到Supabase Storage
      const fileName = `${uuidv4()}-${file.name}`;
      const { error: uploadError } = await supabase
        .storage
        .from('grid-photos')
        .upload(fileName, file);

      if (uploadError) throw new Error(`照片上传失败: ${String(uploadError)}`);

      // 获取照片公共URL
      const { data: urlData } = await supabase
        .storage
        .from('grid-photos')
        .getPublicUrl(fileName);

      setEditGrid(prev => ({
        ...prev,
        photo: file,
        photoUrl: urlData.publicUrl,
      }));
    } catch (error: any) {
      alert(error.message);
    }
  };

  // ======================== 支付逻辑（PayPal） ========================
  const handlePayment = async () => {
    if (!session || !selectedGrid || !editGrid.photoUrl) {
      return alert('请先上传照片并选择格子颜色！');
    }

    // 修改场景：判断是否到期
    if (editGrid.priceType === 'modify' && editGrid.isExpired) {
      return alert('该格子已到期，无法修改（可通过点赞延长存储时间）');
    }

    try {
      setLoading(true);
      // 确定支付金额（首次1美元，修改99美元）
      const amount = editGrid.priceType === 'initial' ? INITIAL_PRICE : MODIFY_PRICE;

      // PayPal支付流程
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gridId: selectedGrid,
          userId: session.user.id,
          amount,
          priceType: editGrid.priceType,
          curtainColor: editGrid.color,
          photoUrl: editGrid.photoUrl,
        }),
      });

      const { approvalUrl } = await response.json();
      if (!approvalUrl) throw new Error('PayPal订单创建失败');

      // 跳转至PayPal支付页
      window.location.href = approvalUrl;
    } catch (error: any) {
      alert(`支付创建失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ======================== 点赞功能逻辑 ========================
  const handleLikeGrid = async (gridId: number) => {
    if (!session) return alert('请先登录后点赞！');
    if (userLikedGrids.includes(gridId)) return alert('你已为该格子点赞过！');

    const grid = grids.find(g => g.id === gridId);

    try {
      setLoading(true);
      // 1. 记录点赞（防重复）
      await supabase.from('grid_likes').insert({
        grid_id: gridId,
        user_id: session.user.id,
      } as any);

      // 2. 更新点赞数 + 延长存储时间（+1天，上限366天）
      const newStorageDays = Math.min((grid?.storage_days || 30) + 1, 366);
      await (supabase.from('grids') as any).update({
        like_count: (grid?.like_count || 0) + 1,
        storage_days: newStorageDays,
      }).eq('id', gridId);

      // 3. 更新本地状态
      setUserLikedGrids(prev => [...prev, gridId]);
      setGrids(prev => prev.map(g =>
        g.id === gridId
          ? { ...g, like_count: (g.like_count || 0) + 1, storage_days: newStorageDays }
          : g
      ));

      // 4. 若当前编辑的是该格子，更新到期状态
      if (selectedGrid === gridId) {
        setEditGrid(prev => ({ ...prev, isExpired: newStorageDays <= 0 }));
      }
    } catch (error: any) {
      alert(`点赞失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ======================== 照片浏览导航逻辑 ========================
  const navigateGrid = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!currentViewGrid) return;
    const currentId = currentViewGrid.id;
    let newId = currentId;

    // 计算相邻格子ID
    switch (direction) {
      case 'up':
        newId = currentId - COLS_PER_ROW;
        break;
      case 'down':
        newId = currentId + COLS_PER_ROW;
        break;
      case 'left':
        newId = currentId % COLS_PER_ROW === 1 ? currentId : currentId - 1;
        break;
      case 'right':
        newId = currentId % COLS_PER_ROW === 0 ? currentId : currentId + 1;
        break;
    }

    // 边缘判断（不能超出总格子数）
    if (newId < 1 || newId > totalGrids) return;

    // 加载新格子内容（空白格显示纯白图片）
    const newGrid = grids.find(g => g.id === newId) || {
      id: newId,
      user_id: null,
      photo_url: 'https://via.placeholder.com/400x400/FFFFFF/FFFFFF', // 纯白占位图
      curtain_color: '#80808080',
      like_count: 0,
      storage_days: 30,
      created_at: new Date().toISOString(),
      modified_at: null,
    };
    setCurrentViewGrid(newGrid);
  };

  // ======================== 探索功能：随机聚焦格子 ========================
  const exploreRandomGrid = () => {
    const randomGridId = Math.floor(Math.random() * totalGrids) + 1;
    const row = Math.floor((randomGridId - 1) / COLS_PER_ROW);
    const col = (randomGridId - 1) % COLS_PER_ROW;
    gridRef.current?.scrollToItem({ row, column: col }, 'center');

    // 自动打开该格子预览
    const grid = grids.find(g => g.id === randomGridId) || {
      id: randomGridId,
      user_id: null,
      photo_url: null,
      curtain_color: '#80808080',
      like_count: 0,
      storage_days: 30,
      created_at: new Date().toISOString(),
      modified_at: null,
    };
    setCurrentViewGrid(grid);
  };

  // ======================== 单个格子渲染逻辑 ========================
  const renderGridCell = ({ columnIndex, rowIndex, style, data }: any) => {
    const gridIndex = rowIndex * COLS_PER_ROW + columnIndex;
    if (gridIndex >= totalGrids) return null; // 超出总格子数不渲染
    const gridId = gridIndex + 1;
    const grid = grids.find(g => g.id === gridId) || {
      id: gridId,
      curtain_color: '#80808080',
      user_id: null,
      like_count: 0,
      storage_days: 30,
      photo_url: null,
      created_at: new Date().toISOString(),
      modified_at: null,
    };
    const isUserGrid = userGrids.includes(gridId);

    const gridBgColor = grid.curtain_color;
    const gridBorder = isUserGrid ? '2px solid gold' : '1px solid #333';

    return (
      <div
        style={{
          ...style,
          backgroundColor: gridBgColor,
          border: gridBorder,
          cursor: 'pointer',
          position: 'relative',
          transition: 'background-color 0.2s',
        }}
        onClick={() => {
          // Check if user is logged in before allowing purchase
          if (!grid.user_id && !session) {
            setShowAuthModal(true);
            return;
          }

          setSelectedGrid(gridId);
          // 已购买格子直接预览
          if (grid.user_id) {
            setCurrentViewGrid(grid);
          }
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = gridBgColor.replace('80808080', '90909080');
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = gridBgColor;
        }}
      >
        {/* 显示点赞数 + 剩余天数 */}
        <div className="absolute bottom-1 right-1 text-xs flex flex-col gap-0.5">
          <span className="text-pink-500 bg-black/50 px-1 rounded">
            ❤️ {grid.like_count || 0}
          </span>
          {isUserGrid && (
            <span className={`bg-black/50 px-1 rounded ${(grid.storage_days || 0) <= 0 ? 'text-red-500' : 'text-green-500'}`}>
              {grid.storage_days || 0}天
            </span>
          )}
        </div>
      </div>
    );
  };

  // ======================== 页面渲染 ========================
  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col bg-black text-white">
      {/* 顶部导航栏 */}
      <header className="p-4 bg-gray-900 flex justify-between items-center border-b border-gray-700">
        <h1 className="text-xl font-bold">
          Grid World | 总格子数: {totalGrids.toLocaleString()}
        </h1>
        <div className="flex gap-3">
          {session ? (
            <>
              <button
                onClick={exploreRandomGrid}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
              >
                探索随机格子
              </button>
              <button
                onClick={() => {
                  if (userGrids.length === 0) return alert('你还没有购买任何格子！');
                  const firstGridId = userGrids[0];
                  const row = Math.floor((firstGridId - 1) / COLS_PER_ROW);
                  const col = (firstGridId - 1) % COLS_PER_ROW;
                  gridRef.current?.scrollToItem({ row, column: col }, 'center');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                我的格子
              </button>
              <button
                onClick={() => supabase.auth.signOut()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                退出登录
              </button>
            </>
          ) : (
            <button
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              登录（Google）
            </button>
          )}
        </div>
      </header>

      {/* 编辑/付费区域（选中格子后显示） */}
      {selectedGrid && (
        <section className="p-4 bg-gray-800 border-b border-gray-700">
          {/* 自定义描述文字 */}
          <p className="text-sm mb-3 text-gray-300">
            描述xxxxxxxxxxxx：首次购买格子价格1美元（含30天存储），已购买且未到期的格子可随时修改（99美元/次），每收到1个点赞可延长1天存储时间（上限9999天），到期后不可修改。
          </p>

          {/* 到期提示（仅修改场景） */}
          {editGrid.priceType === 'modify' && (
            <div className="mb-3 text-sm">
              {editGrid.isExpired ? (
                <span className="text-red-500">⚠️ 该格子已到期，无法修改（可通过点赞延长有效期）</span>
              ) : (
                <span className="text-green-500">✅ 该格子未到期，可付费修改（99美元/次）</span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-4 items-center">
            {/* 颜色选择器 */}
            <div className="flex items-center gap-2">
              <label className="text-sm">格子颜色：</label>
              <input
                type="color"
                value={editGrid.color.replace('80808080', '808080')} // 兼容半透明值
                onChange={(e) => setEditGrid(prev => ({ ...prev, color: e.target.value + '80' }))}
                className="w-8 h-8 border-0 rounded-full cursor-pointer"
              />
            </div>

            {/* 照片上传 */}
            <div className="flex items-center gap-2">
              <label className="text-sm">上传照片：</label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="text-sm text-gray-300"
              />
            </div>

            {/* 付费按钮（PayPal支付） */}
            <button
              onClick={handlePayment}
              disabled={!session || !editGrid.photoUrl || (editGrid.priceType === 'modify' && editGrid.isExpired)}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {editGrid.priceType === 'initial'
                ? `PayPal支付 $${INITIAL_PRICE}`
                : `PayPal支付 $${MODIFY_PRICE}`
              }
            </button>
          </div>
        </section>
      )}

      {/* 格子容器 */}
      <main className="flex-1 overflow-hidden">
        {/* @ts-ignore */}
        <Grid
          columnCount={COLS_PER_ROW}
          columnWidth={GRID_SIZE}
          rowCount={Math.ceil(totalGrids / COLS_PER_ROW)}
          rowHeight={GRID_SIZE}
          width={typeof window !== 'undefined' ? window.innerWidth : 1000}
          height={typeof window !== 'undefined' ? window.innerHeight - 200 : 600}
          style={{ backgroundColor: 'black' }}
          itemData={{ grids: grids || {}, userGrids: userGrids || {}, totalGrids: totalGrids || INITIAL_GRIDS }}
          ref={gridRef}
        >
          {/* @ts-ignore */}
          {renderGridCell}
        </Grid>
      </main>

      {/* 照片预览弹窗 */}
      {currentViewGrid && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-[90vh]">
            {/* 导航按钮 */}
            <>
              <button
                onClick={() => navigateGrid('up')}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full mb-4 bg-gray-700 p-3 rounded-full hover:bg-gray-600 transition z-10"
                aria-label="上一个格子"
              >
                ↑
              </button>
              <button
                onClick={() => navigateGrid('down')}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-full mt-4 bg-gray-700 p-3 rounded-full hover:bg-gray-600 transition z-10"
                aria-label="下一个格子"
              >
                ↓
              </button>
              <button
                onClick={() => navigateGrid('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 mr-4 bg-gray-700 p-3 rounded-full hover:bg-gray-600 transition z-10"
                aria-label="左边格子"
              >
                ←
              </button>
              <button
                onClick={() => navigateGrid('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 ml-4 bg-gray-700 p-3 rounded-full hover:bg-gray-600 transition z-10"
                aria-label="右边格子"
              >
                →
              </button>
            </>

            {/* 内容展示 */}
            <img
              src={currentViewGrid.photo_url || 'https://via.placeholder.com/800x600/FFFFFF/FFFFFF'}
              alt={`格子 ${currentViewGrid.id} 内容`}
              className="max-w-full max-h-[80vh] object-contain rounded"
            />

            {/* 点赞按钮 + 剩余天数 */}
            {session && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={() => handleLikeGrid(currentViewGrid.id)}
                  className="bg-pink-600 text-white p-3 rounded-full hover:bg-pink-700 transition flex items-center gap-2"
                >
                  ❤️ {currentViewGrid.like_count || 0}
                </button>
                <span className="bg-gray-700 text-white p-3 rounded-full text-sm">
                  剩余 {currentViewGrid.storage_days || 0} 天
                </span>
              </div>
            )}

            {/* 关闭按钮 */}
            <button
              onClick={() => setCurrentViewGrid(null)}
              className="absolute top-0 right-0 -mt-8 -mr-8 bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition"
              aria-label="关闭预览"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          // Refresh session after login
          supabase.auth.getSession().then(({ data: sessionData }) => {
            setSession(sessionData.session);
          });
        }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">加载中...</div>}>
      <UploadPageContent />
    </Suspense>
  );
}
