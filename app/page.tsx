'use client';
import { useState, useEffect, useRef } from 'react';
import { FixedSizeGrid } from 'react-window';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { createCheckoutSession } from '@/lib/stripe';

// Grid config
const GRID_SIZE = 30; // Grid size (smaller = better performance)
const COLS_PER_ROW = 100; // 100 grids per row → 100 rows = 10,000 grids
const TOTAL_GRIDS = 10000;

export default function Home() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const [grids, setGrids] = useState<any[]>([]);
  const [selectedGrid, setSelectedGrid] = useState<number | null>(null);
  const [userGrids, setUserGrids] = useState<number[]>([]);
  const [currentViewGrid, setCurrentViewGrid] = useState<any>(null);
  const gridRef = useRef<FixedSizeGrid>(null);

  // 1. Load all grid data
  useEffect(() => {
    const fetchGrids = async () => {
      const { data } = await supabase.from('grids').select('*').order('id');
      setGrids(data || []);
    };
    fetchGrids();
  }, [supabase]);

  // 2. Load current user's grids (for focus)
  useEffect(() => {
    if (!session) return;
    const fetchUserGrids = async () => {
      const { data } = await supabase
        .from('grids')
        .select('id')
        .eq('user_id', session.user.id);
      setUserGrids(data?.map(g => g.id) || []);
    };
    fetchUserGrids();
  }, [supabase, session]);

  // 3. Buy grid: Redirect to Stripe payment
  const handleBuyGrid = async (gridId: number) => {
    if (!session) {
      // Not logged in: Redirect to login (Supabase built-in)
      await supabase.auth.signInWithOAuth({ provider: 'google' }); // Simplified: Google login
      return;
    }
    // Check if grid is occupied
    const grid = grids.find(g => g.id === gridId);
    if (grid?.user_id) return alert('This grid is already occupied!');

    // Create Stripe checkout session
    const { error } = await createCheckoutSession(gridId);
    if (error) alert(error.message);
  };

  // 4. Click grid: Empty = buy, Occupied = view photo
  const handleGridClick = async (gridId: number) => {
    const grid = grids.find(g => g.id === gridId);
    if (!grid) return;

    if (grid.user_id) {
      // Occupied: Show photo
      setCurrentViewGrid(grid);
    } else {
      // Empty: Select and buy
      setSelectedGrid(gridId);
      handleBuyGrid(gridId);
    }
  };

  // 5. Focus on my grid
  const focusMyGrid = () => {
    if (userGrids.length === 0) return alert('You have no grids!');
    const firstGridId = userGrids[0];
    const row = Math.floor((firstGridId - 1) / COLS_PER_ROW);
    const col = (firstGridId - 1) % COLS_PER_ROW;
    gridRef.current?.scrollToItem({ row, column: col }, 'center');
    // Show the grid's photo
    const grid = grids.find(g => g.id === firstGridId);
    setCurrentViewGrid(grid);
  };

  // 6. Render single grid cell
  const renderGridCell = ({ columnIndex, rowIndex, style }: any) => {
    const gridIndex = rowIndex * COLS_PER_ROW + columnIndex;
    if (gridIndex >= TOTAL_GRIDS) return null;
    const gridId = gridIndex + 1;
    const grid = grids.find(g => g.id === gridId) || { curtain_color: '#FFFFFF' };
    const isUserGrid = userGrids.includes(gridId);

    return (
      <div
        style={{
          ...style,
          backgroundColor: grid.curtain_color,
          border: isUserGrid ? '2px solid gold' : '1px solid #eee',
          cursor: grid.user_id ? 'pointer' : 'pointer',
          position: 'relative',
        }}
        onClick={() => handleGridClick(gridId)}
      />
    );
  };

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="p-4 bg-gray-100 flex justify-between items-center">
        <h1 className="text-xl font-bold">Grid World (10,000 Grids)</h1>
        <div>
          {session ? (
            <>
              <button
                onClick={focusMyGrid}
                className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
              >
                Focus My Grid
              </button>
              <button
                onClick={() => supabase.auth.signOut()}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Login/Register
            </button>
          )}
        </div>
      </div>

      {/* Grid container (virtual scroll) */}
      <div className="flex-1 overflow-hidden">
        <FixedSizeGrid
          ref={gridRef}
          columnCount={COLS_PER_ROW}
          columnWidth={GRID_SIZE}
          rowCount={Math.ceil(TOTAL_GRIDS / COLS_PER_ROW)}
          rowHeight={GRID_SIZE}
          width="100%"
          height="100%"
        >
          {renderGridCell}
        </FixedSizeGrid>
      </div>

      {/* Photo preview modal */}
      {currentViewGrid && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="relative">
            {currentViewGrid.photo_url ? (
              <img
                src={currentViewGrid.photo_url}
                alt="Grid content"
                className="max-w-[80vw] max-h-[80vh]"
              />
            ) : (
              <div className="w-64 h-64 bg-gray-200 flex items-center justify-center">
                No photo yet
              </div>
            )}
            <button
              onClick={() => setCurrentViewGrid(null)}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}