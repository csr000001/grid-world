"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// 初始化Supabase客户端（仅前端查询，无修改权限）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GridsList() {
  const [grids, setGrids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载格子数据（仅展示未被购买的格子，预留后续筛选）
  useEffect(() => {
    const fetchGrids = async () => {
      try {
        const { data, error } = await supabase
          .from("grids")
          .select("id, grid_number, price, cover_image")
          .eq("status", "unpaid")
          .limit(20); // 初期展示20条，避免数据过多加载缓慢

        if (!error && data) {
          setGrids(data);
        }
      } catch (error) {
        console.error("加载格子数据失败：", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrids();
  }, []);

  if (loading) {
    return <div className="text-center mt-16 text-xl">加载格子列表中...</div>;
  }

  if (grids.length === 0) {
    return <div className="text-center mt-16 text-xl">暂无可用格子</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-center">格子列表</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {grids.map((grid) => (
          <div
            key={grid.id}
            className="border rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
          >
            {/* 格子封面图（可选，无图显示默认占位） */}
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              {grid.cover_image ? (
                <img
                  src={grid.cover_image}
                  alt={`格子 ${grid.grid_number}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500">格子 {grid.grid_number}</span>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-xl font-bold mb-2">
                格子编号：{grid.grid_number}
              </h3>
              <p className="text-gray-700 mb-4">单价：${grid.price.toFixed(2)}</p>
              <Link
                href={`/grids/${grid.id}`}
                className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                查看详情
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}