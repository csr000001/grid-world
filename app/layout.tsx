import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import GlobalErrorProtection from "./components/GlobalErrorProtection";

// 网站元数据配置（提升SEO，PayPal审核也会关注）
export const metadata: Metadata = {
  title: "1亿格子站 - 全球优质格子购买平台",
  description: "1亿格子站提供全新的格子展示与购买服务，支持全球用户合规支付，安全可靠。",
  keywords: "格子站,全球格子购买,合规支付",
  authors: [{ name: "你的站点名称" }],
  publisher: "你的站点名称",
  formatDetection: { email: true, url: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Initialize environment before any other scripts */}
        <script src="/init.js" />
      </head>
      <body className="min-h-screen flex flex-col">
        {/* Global error protection - must be first */}
        <GlobalErrorProtection />
        {/* 导航栏 */}
        <Navbar />
        {/* 页面主体 */}
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        {/* 页脚 */}
        <Footer />
      </body>
    </html>
  );
}