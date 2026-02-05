import Link from "next/link";

export default function Footer() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Grid World';
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@gridworld.com';

  return (
    <footer className="bg-gray-800 text-white py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 网站信息 */}
          <div>
            <h3 className="text-xl font-bold mb-4">{siteName}</h3>
            <p className="text-gray-300">
              提供优质的格子展示与购买服务，全球用户可合规支付，安全可靠。
            </p>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="text-xl font-bold mb-4">快速链接</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/about" className="hover:text-blue-400">
                  关于我们
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-400">
                  隐私政策
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-blue-400">
                  退款政策
                </Link>
              </li>
            </ul>
          </div>

          {/* 联系信息（PayPal认证必备） */}
          <div>
            <h3 className="text-xl font-bold mb-4">联系我们</h3>
            <ul className="space-y-2 text-gray-300">
              <li>邮箱：{contactEmail}</li>
              <li>地址：你的办公地址（可选，提升可信度）</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>© {new Date().getFullYear()} {siteName}. 保留所有权利。</p>
        </div>
      </div>
    </footer>
  );
}