'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase-v2'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import * as PIXI from 'pixi.js'
import AuthModal from '@/components/AuthModal'

interface Grid {
  id: number
  owner_id: string | null
  photo_url: string
  color: string
  created_at: string
  updated_at: string
  expires_at: string
  likes_count: number
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  is_visible: boolean
  moderation_notes: string | null
}

interface Chunk {
  id: string
  startRow: number
  startCol: number
  grids: Map<number, Grid>
  texture: PIXI.RenderTexture | null
  needsUpdate: boolean
  lastAccessTime: number
  dataLoaded: boolean
}

export default function GridsPage() {
  const router = useRouter()
  const [gridsMap, setGridsMap] = useState<Map<number, Grid>>(new Map())
  const [selectedGrid, setSelectedGrid] = useState<Grid | null>(null)
  const [totalCapacity, setTotalCapacity] = useState(10000)
  const [currentPosition, setCurrentPosition] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [scale, setScale] = useState(1)
  const [cachedChunks, setCachedChunks] = useState(0)
  const [loadedGrids, setLoadedGrids] = useState(0)
  const [isLoadingChunks, setIsLoadingChunks] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingPosition, setPendingPosition] = useState<number | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)
  const pixiAppRef = useRef<PIXI.Application | null>(null)
  const containerRef = useRef<PIXI.Container | null>(null)
  const chunksRef = useRef<Map<string, Chunk>>(new Map())
  const chunkSpritesRef = useRef<Map<string, PIXI.Sprite>>(new Map())
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const lastPosRef = useRef({ x: 0, y: 0 })
  const lastRenderBoundsRef = useRef({ startRow: -1, endRow: -1, startCol: -1, endCol: -1 })

  // Grid configuration
  const GRID_SIZE = 100
  const COLS = 100
  const CHUNK_SIZE = 10 // 10x10 grids per chunk = 100 grids per chunk
  const MIN_SCALE = 0.01 // Support extreme zoom out for 100M grids
  const MAX_SCALE = 3
  const LOD_THRESHOLD_1 = 0.1 // Below this, render as single color
  const LOD_THRESHOLD_2 = 0.5 // Below this, render simplified
  const MAX_CACHED_CHUNKS = 1000 // LRU cache limit for chunks
  const GRIDS_PER_CHUNK = CHUNK_SIZE * CHUNK_SIZE // 100 grids per chunk

  const rows = Math.ceil(totalCapacity / COLS)
  const chunkRows = Math.ceil(rows / CHUNK_SIZE)
  const chunkCols = Math.ceil(COLS / CHUNK_SIZE)

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCachedChunks(chunksRef.current.size)
      setLoadedGrids(gridsMap.size)
    }, 1000)

    return () => clearInterval(interval)
  }, [gridsMap])

  // Get current user
  useEffect(() => {
    async function getCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getCurrentUser()
  }, [])

  // Fetch grid capacity
  useEffect(() => {
    async function fetchCapacity() {
      const { data, error } = await supabase
        .from('grid_capacity')
        .select('total_capacity, occupied_count')
        .single()

      if (!error && data) {
        setTotalCapacity((data as any).total_capacity)
      }
      setLoading(false)
    }
    fetchCapacity()
  }, [])

  // Fetch grids data for a specific chunk (pagination)
  const fetchChunkData = useCallback(async (chunk: Chunk) => {
    if (chunk.dataLoaded) return

    setIsLoadingChunks(true)
    const startPosition = chunk.startRow * COLS + chunk.startCol
    const endPosition = startPosition + (CHUNK_SIZE * COLS) + CHUNK_SIZE

    try {
      const { data } = await supabase
        .from('grids')
        .select('*')
        .eq('is_visible', true)
        .gte('id', startPosition)
        .lt('id', endPosition)

      if (data) {
        data.forEach((grid: any) => {
          gridsMap.set(grid.id, grid)
          chunk.grids.set(grid.id, grid)
        })
        chunk.dataLoaded = true
        chunk.needsUpdate = true
        setLoadedGrids(gridsMap.size)
      }
    } finally {
      setIsLoadingChunks(false)
    }
  }, [gridsMap])

  // LRU cache eviction for chunks
  const evictOldChunks = useCallback(() => {
    if (chunksRef.current.size <= MAX_CACHED_CHUNKS) return

    // Sort chunks by last access time
    const sortedChunks = Array.from(chunksRef.current.entries())
      .sort((a, b) => a[1].lastAccessTime - b[1].lastAccessTime)

    // Remove oldest chunks until we're under the limit
    const chunksToRemove = sortedChunks.slice(0, chunksRef.current.size - MAX_CACHED_CHUNKS)

    chunksToRemove.forEach(([chunkId, chunk]) => {
      // Destroy texture
      if (chunk.texture) {
        chunk.texture.destroy(true)
      }

      // Remove sprite
      const sprite = chunkSpritesRef.current.get(chunkId)
      if (sprite && containerRef.current) {
        containerRef.current.removeChild(sprite)
        sprite.destroy()
        chunkSpritesRef.current.delete(chunkId)
      }

      // Remove chunk data
      chunksRef.current.delete(chunkId)
    })
  }, [])

  // Get chunk ID from position
  const getChunkId = (row: number, col: number): string => {
    const chunkRow = Math.floor(row / CHUNK_SIZE)
    const chunkCol = Math.floor(col / CHUNK_SIZE)
    return `${chunkRow}_${chunkCol}`
  }

  // Create or get chunk
  const getOrCreateChunk = (chunkRow: number, chunkCol: number): Chunk => {
    const chunkId = `${chunkRow}_${chunkCol}`
    let chunk = chunksRef.current.get(chunkId)

    if (!chunk) {
      chunk = {
        id: chunkId,
        startRow: chunkRow * CHUNK_SIZE,
        startCol: chunkCol * CHUNK_SIZE,
        grids: new Map(),
        texture: null,
        needsUpdate: true,
        lastAccessTime: Date.now(),
        dataLoaded: false,
      }
      chunksRef.current.set(chunkId, chunk)
    } else {
      // Update last access time for LRU
      chunk.lastAccessTime = Date.now()
    }

    return chunk
  }

  // Render a single chunk to texture (cached rendering)
  const renderChunkToTexture = useCallback((chunk: Chunk, app: PIXI.Application): PIXI.RenderTexture => {
    const chunkPixelSize = CHUNK_SIZE * GRID_SIZE

    // Create or reuse render texture
    if (!chunk.texture) {
      chunk.texture = PIXI.RenderTexture.create({
        width: chunkPixelSize,
        height: chunkPixelSize,
      })
    }

    const graphics = new PIXI.Graphics()

    // Render all grids in this chunk
    for (let localRow = 0; localRow < CHUNK_SIZE; localRow++) {
      for (let localCol = 0; localCol < CHUNK_SIZE; localCol++) {
        const globalRow = chunk.startRow + localRow
        const globalCol = chunk.startCol + localCol
        const position = globalRow * COLS + globalCol

        if (position >= totalCapacity) continue

        const x = localCol * GRID_SIZE
        const y = localRow * GRID_SIZE

        const grid = chunk.grids.get(position) || gridsMap.get(position)
        const isOccupied = !!grid

        // Draw grid cell based on LOD
        if (scale < LOD_THRESHOLD_1) {
          // Extreme zoom out - render as single pixel
          if (isOccupied && grid) {
            const color = parseInt(grid.color.replace('#', ''), 16)
            graphics.rect(x, y, GRID_SIZE, GRID_SIZE)
            graphics.fill({ color, alpha: 0.9 })
          } else {
            graphics.rect(x, y, GRID_SIZE, GRID_SIZE)
            graphics.fill({ color: 0x808080, alpha: 0.05 })
          }
        } else if (scale < LOD_THRESHOLD_2) {
          // Medium zoom - simplified rendering
          if (isOccupied && grid) {
            const color = parseInt(grid.color.replace('#', ''), 16)
            graphics.rect(x, y, GRID_SIZE, GRID_SIZE)
            graphics.fill({ color, alpha: 0.7 })
          } else {
            graphics.rect(x, y, GRID_SIZE, GRID_SIZE)
            graphics.fill({ color: 0x808080, alpha: 0.1 })
          }
          // Simplified border
          graphics.rect(x, y, GRID_SIZE, GRID_SIZE)
          graphics.stroke({ width: 0.5, color: 0x333333 })
        } else {
          // Full detail rendering
          if (isOccupied && grid) {
            const color = parseInt(grid.color.replace('#', ''), 16)
            graphics.rect(x, y, GRID_SIZE, GRID_SIZE)
            graphics.fill({ color, alpha: 0.7 })
          } else {
            graphics.rect(x, y, GRID_SIZE, GRID_SIZE)
            graphics.fill({ color: 0x808080, alpha: 0.1 })
          }

          // Draw border
          graphics.rect(x, y, GRID_SIZE, GRID_SIZE)
          graphics.stroke({ width: 1, color: 0x333333 })

          // Add likes count text (only at high zoom)
          if (isOccupied && grid && grid.likes_count > 0 && scale > 0.8) {
            const text = new PIXI.Text({
              text: `❤️ ${grid.likes_count}`,
              style: {
                fontSize: 12,
                fill: 0xFFFFFF,
              }
            })
            text.alpha = 0.5
            text.x = x + GRID_SIZE / 2 - text.width / 2
            text.y = y + GRID_SIZE / 2 - text.height / 2
            graphics.addChild(text)
          }
        }
      }
    }

    // Render graphics to texture
    app.renderer.render({
      container: graphics,
      target: chunk.texture,
    })

    graphics.destroy()
    chunk.needsUpdate = false

    return chunk.texture
  }, [totalCapacity, scale])

  // Render visible chunks with LOD
  const renderVisibleChunks = useCallback(async () => {
    if (!containerRef.current || !pixiAppRef.current) return

    const container = containerRef.current
    const app = pixiAppRef.current

    // Calculate visible chunk range
    const viewportBounds = {
      x: -container.x / scale,
      y: -container.y / scale,
      width: app.screen.width / scale,
      height: app.screen.height / scale,
    }

    const buffer = CHUNK_SIZE * GRID_SIZE * 2
    const startChunkCol = Math.max(0, Math.floor((viewportBounds.x - buffer) / (CHUNK_SIZE * GRID_SIZE)))
    const endChunkCol = Math.min(chunkCols, Math.ceil((viewportBounds.x + viewportBounds.width + buffer) / (CHUNK_SIZE * GRID_SIZE)))
    const startChunkRow = Math.max(0, Math.floor((viewportBounds.y - buffer) / (CHUNK_SIZE * GRID_SIZE)))
    const endChunkRow = Math.min(chunkRows, Math.ceil((viewportBounds.y + viewportBounds.height + buffer) / (CHUNK_SIZE * GRID_SIZE)))

    // Check if we need to update (viewport changed significantly)
    const boundsChanged =
      lastRenderBoundsRef.current.startRow !== startChunkRow ||
      lastRenderBoundsRef.current.endRow !== endChunkRow ||
      lastRenderBoundsRef.current.startCol !== startChunkCol ||
      lastRenderBoundsRef.current.endCol !== endChunkCol

    if (!boundsChanged) return

    lastRenderBoundsRef.current = { startRow: startChunkRow, endRow: endChunkRow, startCol: startChunkCol, endCol: endChunkCol }

    // Remove sprites outside viewport
    const visibleChunkIds = new Set<string>()
    for (let chunkRow = startChunkRow; chunkRow < endChunkRow; chunkRow++) {
      for (let chunkCol = startChunkCol; chunkCol < endChunkCol; chunkCol++) {
        visibleChunkIds.add(`${chunkRow}_${chunkCol}`)
      }
    }

    // Remove old sprites
    chunkSpritesRef.current.forEach((sprite, chunkId) => {
      if (!visibleChunkIds.has(chunkId)) {
        container.removeChild(sprite)
        sprite.destroy()
        chunkSpritesRef.current.delete(chunkId)
      }
    })

    // Load data for visible chunks (async, non-blocking)
    const chunksToLoad: Chunk[] = []
    for (let chunkRow = startChunkRow; chunkRow < endChunkRow; chunkRow++) {
      for (let chunkCol = startChunkCol; chunkCol < endChunkCol; chunkCol++) {
        const chunk = getOrCreateChunk(chunkRow, chunkCol)
        if (!chunk.dataLoaded) {
          chunksToLoad.push(chunk)
        }
      }
    }

    // Load chunk data in parallel (non-blocking)
    if (chunksToLoad.length > 0) {
      Promise.all(chunksToLoad.map(chunk => fetchChunkData(chunk))).then(() => {
        // Re-render after data loads
        renderVisibleChunksSync()
      })
    }

    // Render visible chunks (sync)
    renderVisibleChunksSync()

    // Evict old chunks from LRU cache
    evictOldChunks()

    // Render current position highlight
    renderCurrentPositionHighlight()
  }, [scale, totalCapacity, currentPosition, fetchChunkData, evictOldChunks, chunkRows, chunkCols])

  // Synchronous rendering of visible chunks
  const renderVisibleChunksSync = useCallback(() => {
    if (!containerRef.current || !pixiAppRef.current) return

    const container = containerRef.current
    const app = pixiAppRef.current

    const viewportBounds = {
      x: -container.x / scale,
      y: -container.y / scale,
      width: app.screen.width / scale,
      height: app.screen.height / scale,
    }

    const buffer = CHUNK_SIZE * GRID_SIZE * 2
    const startChunkCol = Math.max(0, Math.floor((viewportBounds.x - buffer) / (CHUNK_SIZE * GRID_SIZE)))
    const endChunkCol = Math.min(chunkCols, Math.ceil((viewportBounds.x + viewportBounds.width + buffer) / (CHUNK_SIZE * GRID_SIZE)))
    const startChunkRow = Math.max(0, Math.floor((viewportBounds.y - buffer) / (CHUNK_SIZE * GRID_SIZE)))
    const endChunkRow = Math.min(chunkRows, Math.ceil((viewportBounds.y + viewportBounds.height + buffer) / (CHUNK_SIZE * GRID_SIZE)))

    for (let chunkRow = startChunkRow; chunkRow < endChunkRow; chunkRow++) {
      for (let chunkCol = startChunkCol; chunkCol < endChunkCol; chunkCol++) {
        const chunk = getOrCreateChunk(chunkRow, chunkCol)
        const chunkId = chunk.id

        // Get or create sprite for this chunk
        let sprite = chunkSpritesRef.current.get(chunkId)

        if (!sprite) {
          const texture = renderChunkToTexture(chunk, app)
          sprite = new PIXI.Sprite(texture)
          sprite.x = chunk.startCol * GRID_SIZE
          sprite.y = chunk.startRow * GRID_SIZE
          container.addChild(sprite)
          chunkSpritesRef.current.set(chunkId, sprite)
        } else if (chunk.needsUpdate) {
          // Update texture if chunk data changed
          const texture = renderChunkToTexture(chunk, app)
          sprite.texture = texture
        }
      }
    }
  }, [scale, renderChunkToTexture, chunkRows, chunkCols])

  // Render current position highlight (separate layer)
  const renderCurrentPositionHighlight = useCallback(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Remove old highlight
    const oldHighlight = container.getChildByName('highlight')
    if (oldHighlight) container.removeChild(oldHighlight)

    // Add new highlight
    const col = currentPosition % COLS
    const row = Math.floor(currentPosition / COLS)
    const x = col * GRID_SIZE
    const y = row * GRID_SIZE

    const highlight = new PIXI.Graphics()
    highlight.name = 'highlight'
    highlight.rect(x - 2, y - 2, GRID_SIZE + 4, GRID_SIZE + 4)
    highlight.stroke({ width: 3, color: 0xFFD700 })
    container.addChild(highlight)
  }, [currentPosition])

  // Initialize PixiJS
  useEffect(() => {
    if (!canvasRef.current || pixiAppRef.current) return

    const app = new PIXI.Application()

    app.init({
      width: window.innerWidth,
      height: window.innerHeight - 128,
      backgroundColor: 0x000000,
      antialias: false,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      preference: 'webgl',
    }).then(() => {
      if (canvasRef.current && app.canvas) {
        canvasRef.current.appendChild(app.canvas as HTMLCanvasElement)
        pixiAppRef.current = app

        const container = new PIXI.Container()
        container.sortableChildren = true
        app.stage.addChild(container)
        containerRef.current = container

        renderVisibleChunks()
      }
    })

    return () => {
      if (pixiAppRef.current) {
        chunksRef.current.forEach(chunk => {
          if (chunk.texture) chunk.texture.destroy(true)
        })
        chunksRef.current.clear()
        chunkSpritesRef.current.forEach(sprite => sprite.destroy())
        chunkSpritesRef.current.clear()
        pixiAppRef.current.destroy(true, { children: true })
        pixiAppRef.current = null
      }
    }
  }, [])

  // Update rendering when scale changes
  useEffect(() => {
    if (pixiAppRef.current && containerRef.current) {
      // Mark all chunks as needing update
      chunksRef.current.forEach(chunk => { chunk.needsUpdate = true })
      renderVisibleChunks()
    }
  }, [scale, renderVisibleChunks])

  // Handle mouse wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * delta))

      if (containerRef.current) {
        const container = containerRef.current
        const mouseX = e.clientX
        const mouseY = e.clientY - 128

        const worldX = (mouseX - container.x) / scale
        const worldY = (mouseY - container.y) / scale

        container.scale.set(newScale)
        container.x = mouseX - worldX * newScale
        container.y = mouseY - worldY * newScale

        setScale(newScale)
      }
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [scale])

  // Handle mouse interactions
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !containerRef.current) return

    const container = containerRef.current

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true
      dragStartRef.current = { x: e.clientX, y: e.clientY }
      lastPosRef.current = { x: container.x, y: container.y }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const deltaX = e.clientX - dragStartRef.current.x
        const deltaY = e.clientY - dragStartRef.current.y

        container.x = lastPosRef.current.x + deltaX
        container.y = lastPosRef.current.y + deltaY

        // Throttled render update
        requestAnimationFrame(() => renderVisibleChunks())
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      const wasDragging = isDraggingRef.current
      const deltaX = Math.abs(e.clientX - dragStartRef.current.x)
      const deltaY = Math.abs(e.clientY - dragStartRef.current.y)

      isDraggingRef.current = false

      if (!wasDragging || (deltaX < 5 && deltaY < 5)) {
        const mouseX = e.clientX
        const mouseY = e.clientY - 128

        const worldX = (mouseX - container.x) / scale
        const worldY = (mouseY - container.y) / scale

        const col = Math.floor(worldX / GRID_SIZE)
        const row = Math.floor(worldY / GRID_SIZE)
        const position = row * COLS + col

        if (position >= 0 && position < totalCapacity) {
          setCurrentPosition(position)

          // Load chunk data if not loaded
          const chunkRow = Math.floor(row / CHUNK_SIZE)
          const chunkCol = Math.floor(col / CHUNK_SIZE)
          const chunk = getOrCreateChunk(chunkRow, chunkCol)

          if (!chunk.dataLoaded) {
            fetchChunkData(chunk).then(() => {
              const grid = chunk.grids.get(position)
              if (grid) {
                setSelectedGrid(grid)
              } else {
                // Empty grid - check if user is logged in before allowing purchase
                if (currentUser) {
                  router.push(`/upload?position=${position}`)
                } else {
                  setPendingPosition(position)
                  setShowAuthModal(true)
                }
              }
            })
          } else {
            const grid = chunk.grids.get(position) || gridsMap.get(position)
            if (grid) {
              setSelectedGrid(grid)
            } else {
              // Empty grid - check if user is logged in before allowing purchase
              if (currentUser) {
                router.push(`/upload?position=${position}`)
              } else {
                setPendingPosition(position)
                setShowAuthModal(true)
              }
            }
          }
        }
      }
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', () => { isDraggingRef.current = false })

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
    }
  }, [gridsMap, scale, totalCapacity, router, renderVisibleChunks, currentUser])

  const handleAuthSuccess = () => {
    // Refresh current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user)
      // Navigate to pending position if exists
      if (pendingPosition !== null) {
        router.push(`/upload?position=${pendingPosition}`)
        setPendingPosition(null)
      }
    })
  }

  const navigateToPosition = (position: number) => {
    if (position < 0 || position >= totalCapacity) return
    setCurrentPosition(position)

    if (containerRef.current && pixiAppRef.current) {
      const col = position % COLS
      const row = Math.floor(position / COLS)

      const targetX = col * GRID_SIZE * scale
      const targetY = row * GRID_SIZE * scale

      containerRef.current.x = pixiAppRef.current.screen.width / 2 - targetX
      containerRef.current.y = pixiAppRef.current.screen.height / 2 - targetY

      renderVisibleChunks()
    }
  }

  const navigateToRandom = () => {
    const randomPos = Math.floor(Math.random() * totalCapacity)
    navigateToPosition(randomPos)
  }

  const navigateToMyGrids = async () => {
    if (!currentUser) {
      setShowAuthModal(true)
      return
    }

    // Query database directly for user's grids
    const { data } = await supabase
      .from('grids')
      .select('id')
      .eq('owner_id', currentUser.id)
      .eq('is_visible', true)
      .limit(1)

    if (data && data.length > 0) {
      navigateToPosition((data[0] as any).id)
    } else {
      alert('You don\'t own any grids yet')
    }
  }

  const navigate = (direction: 'up' | 'down' | 'left' | 'right') => {
    let newPos = currentPosition
    switch (direction) {
      case 'up': newPos = currentPosition - COLS; break
      case 'down': newPos = currentPosition + COLS; break
      case 'left': newPos = currentPosition - 1; break
      case 'right': newPos = currentPosition + 1; break
    }
    navigateToPosition(newPos)
  }

  const handleModifyGrid = () => {
    if (selectedGrid && currentUser && selectedGrid.owner_id === currentUser.id) {
      router.push(`/upload?position=${selectedGrid.id}&modify=true`)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed top-20 left-0 right-0 z-10 bg-black/80 backdrop-blur-sm p-4">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button onClick={navigateToMyGrids} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">
              My Grids
            </button>
            <button onClick={navigateToRandom} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded">
              Random Explore
            </button>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button onClick={() => navigate('up')} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded">↑</button>
            <div className="flex gap-1">
              <button onClick={() => navigate('left')} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded">←</button>
              <button onClick={() => navigate('down')} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded">↓</button>
              <button onClick={() => navigate('right')} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded">→</button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm">Zoom: {(scale * 100).toFixed(0)}%</div>
            <div className="text-sm">Position: {currentPosition.toLocaleString()} / {totalCapacity.toLocaleString()}</div>
            <div className="text-sm text-gray-400">LOD: {scale < LOD_THRESHOLD_1 ? 'Ultra Low' : scale < LOD_THRESHOLD_2 ? 'Low' : 'High'}</div>
            <div className="text-sm text-green-400">Chunks: {cachedChunks} / {MAX_CACHED_CHUNKS}</div>
            <div className="text-sm text-blue-400">Grids: {loadedGrids.toLocaleString()}</div>
            {isLoadingChunks && <div className="text-sm text-yellow-400 animate-pulse">Loading...</div>}
          </div>
        </div>
      </div>

      <div ref={canvasRef} className="fixed top-32 left-0 right-0 bottom-0" style={{ cursor: isDraggingRef.current ? 'grabbing' : 'grab' }} />

      {selectedGrid && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedGrid(null)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-gray-900 rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {selectedGrid.photo_url ? (
              <Image src={selectedGrid.photo_url} alt="Grid photo" width={800} height={800} className="w-full h-auto" />
            ) : (
              <div className="w-full h-96 flex items-center justify-center text-gray-500">No photo uploaded</div>
            )}

            <div className="p-4 bg-gray-800">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-400">Position: {selectedGrid.id.toLocaleString()}</p>
                  <p className="text-sm text-gray-400">Likes: {selectedGrid.likes_count}</p>
                  {selectedGrid.expires_at && (
                    <p className="text-sm text-gray-400">Expires: {new Date(selectedGrid.expires_at).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {currentUser && selectedGrid.owner_id === currentUser.id && (
                    <button onClick={handleModifyGrid} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded">
                      Modify ($99)
                    </button>
                  )}
                  <button onClick={() => setSelectedGrid(null)} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="text-white text-xl">Loading grids...</div>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}
