import type { Metadata } from "next";
import "./globals.css";

// 简化的元数据配置 - 移除可能导致问题的字段
export const metadata: Metadata = {
  title: "Grid World - 全球格子购买平台",
  description: "Grid World 提供格子展示与购买服务",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 移除 init.js - 可能导致问题 */}
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}