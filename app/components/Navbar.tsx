"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Grid World';

  return (
    <nav className="bg-white shadow-md py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* 网站Logo/名称 */}
        <Link href="/" className="text-2xl font-bold text-blue-600">
          {siteName}
        </Link>

        {/* 桌面端导航 */}
        <div className="hidden md:flex space-x-8">
          <Link href="/" className="text-gray-700 hover:text-blue-600">
            首页
          </Link>
          <Link href="/grids" className="text-gray-700 hover:text-blue-600">
            格子列表
          </Link>
          <Link href="/about" className="text-gray-700 hover:text-blue-600">
            关于我们
          </Link>
          <Link href="/privacy" className="text-gray-700 hover:text-blue-600">
            隐私政策
          </Link>
          <Link href="/refund" className="text-gray-700 hover:text-blue-600">
            退款政策
          </Link>
        </div>

        {/* 移动端导航开关 */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      {/* 移动端导航菜单 */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg px-4 py-2 space-y-4">
          <Link href="/" className="block text-gray-700 hover:text-blue-600">
            首页
          </Link>
          <Link href="/grids" className="block text-gray-700 hover:text-blue-600">
            格子列表
          </Link>
          <Link href="/about" className="block text-gray-700 hover:text-blue-600">
            关于我们
          </Link>
          <Link href="/privacy" className="block text-gray-700 hover:text-blue-600">
            隐私政策
          </Link>
          <Link href="/refund" className="block text-gray-700 hover:text-blue-600">
            退款政策
          </Link>
        </div>
      )}
    </nav>
  );
}