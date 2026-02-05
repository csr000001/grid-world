import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function AboutPage() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Grid World';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">关于我们</h1>

        <div className="max-w-3xl mx-auto space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold mb-4">我们的使命</h2>
            <p className="leading-relaxed">
              {siteName} 致力于为用户提供一个创意展示和互动的平台。
              通过购买和定制格子，用户可以在我们的数字画布上展示自己的创意、品牌或信息。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">我们的愿景</h2>
            <p className="leading-relaxed">
              我们希望打造一个充满创意和活力的数字社区，让每个人都能找到属于自己的空间，
              展示独特的想法和内容。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">联系我们</h2>
            <p className="leading-relaxed">
              如果您有任何问题或建议，欢迎通过以下方式联系我们：
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>邮箱：support@example.com</li>
              <li>工作时间：周一至周五 9:00-18:00</li>
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
