'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { Grid } from 'react-window';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import AuthModal from '@/components/AuthModal';
import { useRouter, useSearchParams } from 'next/navigation';

// ======================== 类型定义 ========================
interface GridData {
  id: number;
  user_id: string | null;
  ad_grid: boolean;
  storage_days: number;
  like_count: number;
  curtain_color: string;
  photo_url: string | null;
  created_at: string;
  modified_at: string | null;
  youtube_url?: string | null;
  ad_link?: string | null;
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
const AD_GRID_COLOR = '#87CEEB'; // 广告格子天蓝色背景
const AD_TEXT_COLOR = '#FFFFFF'; // 广告格子白色文字

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
  // 当前预览的格子（照片/广告浏览）
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
  // YouTube播放器Ref（用于广告播放）
  const youtubePlayerRef = useRef<any>(null);
  // 加载状态
  const [loading, setLoading] = useState(true);
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ======================== 初始化逻辑 ========================
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);

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
          (_, newSession) => setSession(newSession)
        );

        // 2. 拉取所有格子数据
        const { data: gridsData } = await supabase.from('grids').select('*').order('id') as { data: GridData[] | null };
        setGrids(gridsData || []);

        // 3. 动态扩展格子（填充率超50%时）
        const filledCount = (gridsData || []).filter(g => g.user_id).length;
        const fillRate = filledCount / totalGrids;
        if (fillRate >= FILL_THRESHOLD && totalGrids + EXPAND_STEP <= MAX_GRIDS) {
          const newTotal = Math.min(totalGrids + EXPAND_STEP, MAX_GRIDS);
          setTotalGrids(newTotal);
          // 批量新增扩展的空白格子
          const newGrids = Array.from({ length: EXPAND_STEP }, (_, i) => ({
            id: totalGrids + i + 1,
            user_id: null,
            ad_grid: false,
            storage_days: 30, // 初始存储30天
            like_count: 0,
            curtain_color: '#80808080',
            photo_url: null,
            created_at: new Date(),
            modified_at: null,
          }));
          await supabase.from('grids').insert(newGrids);
        }

        // 4. 拉取用户点赞记录（防重复点赞）
        if (sessionData.session?.user) {
          const { data: likesData } = await supabase
            .from('grid_likes')
            .select('grid_id')
            .eq('user_id', sessionData.session.user.id);
          setUserLikedGrids(likesData?.map(l => l.grid_id) || []);
        }

        // 5. 拉取用户拥有的格子
        if (sessionData.session?.user) {
          const { data: userGridsData } = await supabase
            .from('grids')
            .select('id, storage_days')
            .eq('user_id', sessionData.session.user.id);
          setUserGrids(userGridsData?.map(g => g.id) || []);
        }

        return () => {
          subscription.unsubscribe();
          // 销毁YouTube播放器
          if (youtubePlayerRef.current) {
            youtubePlayerRef.current.destroy();
          }
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

  // ======================== 广告播放完成处理逻辑 ========================
  const handleAdPlaybackComplete = async (gridId: number) => {
    try {
      // 1. 更新Supabase：将广告格恢复为空白格
      await supabase
        .from('grids')
        .update({
          ad_grid: false,
          curtain_color: '#80808080', // 恢复为默认灰色
        })
        .eq('id', gridId);

      // 2. 更新本地状态：同步格子数据
      setGrids(prev => prev.map(grid => 
        grid.id === gridId 
          ? { ...grid, ad_grid: false, curtain_color: '#80808080' } 
          : grid
      ));

      // 3. 关闭预览弹窗
      setCurrentViewGrid(null);
      alert(`广告播放完成！格子 ${gridId} 已恢复为空白格，可正常购买`);
    } catch (error) {
      console.error('恢复空白格失败:', error);
      alert('广告播放完成，但格子恢复失败，请刷新重试');
    }
  };

  // ======================== YouTube播放器初始化（广告播放） ========================
  useEffect(() => {
    if (!currentViewGrid?.ad_grid || !(window as any).YT) return;

    // 销毁原有播放器
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.destroy();
    }

    // 初始化新播放器
    const player = new (window as any).YT.Player('youtube-ad-player', {
      videoId: 'dQw4w9WgXcQ', // 广告视频ID（可替换为实际广告）
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0, // 不显示相关视频
      },
      events: {
        onStateChange: (event: any) => {
          // 状态0 = 播放结束
          if (event.data === (window as any).YT?.PlayerState.ENDED) {
            handleAdPlaybackComplete(currentViewGrid.id);
          }
        },
        onError: (error: any) => {
          console.error('广告播放错误:', error);
          alert('广告播放出错，格子已恢复为空白格');
          handleAdPlaybackComplete(currentViewGrid.id);
        }
      }
    });

    youtubePlayerRef.current = player;

    // 清理函数
    return () => {
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.destroy();
      }
    };
  }, [currentViewGrid]);

  // ======================== 选中格子时的状态更新 ========================
  useEffect(() => {
    if (!selectedGrid || !session) return;

    const updateEditState = () => {
      const grid = grids.find(g => g.id === selectedGrid);
      if (!grid) return;

      // 广告格：不可编辑，但允许点击播放广告
      if (grid.ad_grid) {
        setEditGrid({
          id: null,
          color: '#80808080',
          photo: null,
          photoUrl: null,
          priceType: 'initial',
          isExpired: true,
        });
        return;
      }

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

      if (uploadError) throw new Error(`照片上传失败: ${uploadError.message}`);

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

    // 广告格不可支付（即使误触发）
    const grid = grids.find(g => g.id === selectedGrid);
    if (grid?.ad_grid) {
      return alert('请先播放广告，广告播放完成后格子将恢复为可购买状态！');
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

    // 广告格不可点赞
    const grid = grids.find(g => g.id === gridId);
    if (grid?.ad_grid) {
      return alert('请先播放广告，广告播放完成后可正常点赞！');
    }

    try {
      setLoading(true);
      // 1. 记录点赞（防重复）
      await supabase.from('grid_likes').insert({
        grid_id: gridId,
        user_id: session.user.id,
      });

      // 2. 更新点赞数 + 延长存储时间（+1天，上限366天）
      const newStorageDays = Math.min((grid?.storage_days || 30) + 1, 366);
      await supabase.from('grids').update({
        likes_count: (grid?.likes_count || 0) + 1,
        storage_days: newStorageDays,
      }).eq('id', gridId);

      // 3. 更新本地状态
      setUserLikedGrids(prev => [...prev, gridId]);
      setGrids(prev => prev.map(g =>
        g.id === gridId
          ? { ...g, likes_count: (g.likes_count || 0) + 1, storage_days: newStorageDays }
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
      ad_grid: false,
      photo_url: 'https://via.placeholder.com/400x400/FFFFFF/FFFFFF', // 纯白占位图
      curtain_color: '#80808080',
      like_count: 0,
      storage_days: 30,
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
      ad_grid: false,
      photo_url: null,
      curtain_color: '#80808080',
      like_count: 0,
      storage_days: 30,
    };
    setCurrentViewGrid(grid);
  };

  // ======================== 单个格子渲染逻辑 ========================
  const renderGridCell = ({ columnIndex, rowIndex, style, data }: any) => {
    const gridIndex = rowIndex * COLS_PER_ROW + columnIndex;
    if (gridIndex >= totalGrids) return null; // 超出总格子数不渲染
    const gridId = gridIndex + 1;
    const grid = grids.find(g => g.id === gridId) || {
      ad_grid: false,
      curtain_color: '#80808080',
      user_id: null,
      like_count: 0,
      storage_days: 30,
    };
    const isUserGrid = userGrids.includes(gridId);
    const isAdGrid = grid.ad_grid;

    // 广告格强制使用天蓝色背景
    const gridBgColor = isAdGrid ? AD_GRID_COLOR : grid.curtain_color;
    // 广告格边框特殊样式
    const gridBorder = isAdGrid 
      ? '2px solid #4682B4' // 深天蓝色边框，突出广告格
      : isUserGrid ? '2px solid gold' : '1px solid #333';

    return (
      <div
        style={{
          ...style,
          backgroundColor: gridBgColor,
          border: gridBorder,
          cursor: isAdGrid ? 'pointer' : 'pointer', // 广告格允许点击
          position: 'relative',
          transition: 'background-color 0.2s',
        }}
        onClick={() => {
          // Check if user is logged in before allowing purchase
          if (!grid.user_id && !isAdGrid && !session) {
            setShowAuthModal(true);
            return;
          }

          setSelectedGrid(gridId);
          // 广告格/已购买格子直接预览
          if (isAdGrid || grid.user_id) {
            setCurrentViewGrid(grid);
          }
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isAdGrid 
            ? '#87CEEB90' // 广告格hover加深天蓝色
            : gridBgColor.replace('80808080', '90909080');
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = gridBgColor;
        }}
      >
        {/* 广告格专属：居中显示AD字母 */}
        {isAdGrid && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{
              color: AD_TEXT_COLOR,
              fontSize: '12px',
              fontWeight: 900, // 加粗
              letterSpacing: '1px', // 字母间距
              textShadow: '0 0 2px #ffffff', // 文字阴影，提升可读性
            }}
          >
            <div>AD</div>
            <div style={{ fontSize: '8px', marginTop: '2px' }}>点击播放广告</div>
          </div>
        )}

        {/* 非广告格：显示点赞数 + 剩余天数 */}
        {!isAdGrid && (
          <div className="absolute bottom-1 right-1 text-xs flex flex-col gap-0.5">
            <span className="text-pink-500 bg-black/50 px-1 rounded">
              ❤️ {grid.likes_count}
            </span>
            {isUserGrid && (
              <span className={`bg-black/50 px-1 rounded ${grid.storage_days <= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {grid.storage_days}天
              </span>
            )}
          </div>
        )}
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
            描述xxxxxxxxxxxx：首次购买格子价格1美元（含30天存储），已购买且未到期的格子可随时修改（99美元/次），每收到1个点赞可延长1天存储时间（上限9999天），到期后不可修改。【广告格子点击播放广告，播放完成后恢复为空白格可购买】
          </p>

          {/* 广告格提示 */}
          {grids.find(g => g.id === selectedGrid)?.ad_grid && (
            <div className="mb-3 text-sm text-blue-400">
              ⚡ 该格子为广告格，点击预览弹窗播放广告，播放完成后即可正常购买！
            </div>
          )}

          {/* 到期提示（仅修改场景） */}
          {!grids.find(g => g.id === selectedGrid)?.ad_grid && editGrid.priceType === 'modify' && (
            <div className="mb-3 text-sm">
              {editGrid.isExpired ? (
                <span className="text-red-500">⚠️ 该格子已到期，无法修改（可通过点赞延长有效期）</span>
              ) : (
                <span className="text-green-500">✅ 该格子未到期，可付费修改（99美元/次）</span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-4 items-center">
            {/* 颜色选择器（广告格隐藏） */}
            {!grids.find(g => g.id === selectedGrid)?.ad_grid && (
              <div className="flex items-center gap-2">
                <label className="text-sm">格子颜色：</label>
                <input
                  type="color"
                  value={editGrid.color.replace('80808080', '808080')} // 兼容半透明值
                  onChange={(e) => setEditGrid(prev => ({ ...prev, color: e.target.value + '80' }))}
                  className="w-8 h-8 border-0 rounded-full cursor-pointer"
                />
              </div>
            )}

            {/* 照片上传（广告格隐藏） */}
            {!grids.find(g => g.id === selectedGrid)?.ad_grid && (
              <div className="flex items-center gap-2">
                <label className="text-sm">上传照片：</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="text-sm text-gray-300"
                />
              </div>
            )}

            {/* 付费按钮（广告格隐藏，PayPal支付） */}
            {!grids.find(g => g.id === selectedGrid)?.ad_grid && (
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
            )}
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

      {/* 照片/广告预览弹窗 */}
      {currentViewGrid && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-[90vh]">
            {/* 导航按钮（非广告格显示） */}
            {!currentViewGrid.ad_grid && (
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
            )}

            {/* 内容展示 */}
            {currentViewGrid.ad_grid ? (
              // 广告格：YouTube播放器容器
              <div 
                id="youtube-ad-player" 
                className="max-w-full max-h-[80vh] object-contain"
                style={{ width: '100%', height: '100%' }}
              ></div>
            ) : (
              // 普通格子：照片/纯白占位图
              <img
                src={currentViewGrid.photo_url || 'https://via.placeholder.com/800x600/FFFFFF/FFFFFF'}
                alt={`格子 ${currentViewGrid.id} 内容`}
                className="max-w-full max-h-[80vh] object-contain rounded"
              />
            )}

            {/* 点赞按钮 + 剩余天数（非广告格显示） */}
            {session && !currentViewGrid.ad_grid && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={() => handleLikeGrid(currentViewGrid.id)}
                  className="bg-pink-600 text-white p-3 rounded-full hover:bg-pink-700 transition flex items-center gap-2"
                >
                  ❤️ {currentViewGrid.likes_count || 0}
                </button>
                <span className="bg-gray-700 text-white p-3 rounded-full text-sm">
                  剩余 {currentViewGrid.storage_days} 天
                </span>
              </div>
            )}

            {/* 广告格提示（播放中） */}
            {currentViewGrid.ad_grid && (
              <div className="absolute top-4 left-4 bg-blue-600 text-white p-2 rounded text-sm">
                广告播放中...播放完成后格子将恢复为空白格
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
