"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GridDetail() {
  const params = useParams();
  const gridId = params.gridId as string;
  const [grid, setGrid] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 加载单个格子数据
  useEffect(() => {
    const fetchGridDetail = async () => {
      if (!gridId) return;

      try {
        const { data, error } = await supabase
          .from("grids")
          .select("*")
          .eq("id", gridId)
          .single();

        if (!error && data) {
          setGrid(data);
        }
      } catch (error) {
        console.error("加载格子详情失败：", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGridDetail();
  }, [gridId]);

  if (loading) {
    return <div className="text-center mt-16 text-xl">加载格子详情中...</div>;
  }

  if (!grid) {
    return <div className="text-center mt-16 text-xl">该格子不存在或已被删除</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">
        格子详情 - {grid.grid_number}
      </h1>

      <div className="border rounded-lg shadow-md p-6 mb-8">
        <div className="h-64 bg-gray-200 flex items-center justify-center mb-6">
          {grid.cover_image ? (
            <img
              src={grid.cover_image}
              alt={`格子 ${grid.grid_number}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-500 text-2xl">格子 {grid.grid_number}</span>
          )}
        </div>

        <p className="text-xl mb-2">
          <span className="font-bold">格子ID：</span> {grid.id}
        </p>
        <p className="text-xl mb-2">
          <span className="font-bold">格子编号：</span> {grid.grid_number}
        </p>
        <p className="text-xl mb-2">
          <span className="font-bold">单价：</span> ${grid.price.toFixed(2)}
        </p>
        <p className="text-xl mb-2">
          <span className="font-bold">当前状态：</span>{" "}
          <span className="text-green-600">待购买</span>
        </p>
        {grid.description && (
          <p className="text-xl mb-2">
            <span className="font-bold">格子描述：</span> {grid.description}
          </p>
        )}
      </div>

      {/* 预留PayPal支付按钮位置（当前仅展示提示，后续接入收款时替换） */}
      <div className="text-center">
        <button
          className="bg-blue-600 text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-blue-700 transition-colors opacity-75 cursor-not-allowed"
          disabled
        >
          即将上线PayPal支付，敬请期待
        </button>
      </div>
    </div>
  );
}