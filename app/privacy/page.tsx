import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">隐私政策</h1>

        <div className="max-w-3xl mx-auto space-y-6 text-gray-700">
          <p className="text-sm text-gray-500">最后更新日期：2026年2月1日</p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. 信息收集</h2>
            <p className="leading-relaxed">
              我们收集您在使用我们服务时提供的信息，包括但不限于：
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>账户信息（邮箱地址）</li>
              <li>支付信息（通过第三方支付处理器处理）</li>
              <li>上传的图片和内容</li>
              <li>使用数据和日志信息</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. 信息使用</h2>
            <p className="leading-relaxed">
              我们使用收集的信息用于：
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>提供和改进我们的服务</li>
              <li>处理交易和发送通知</li>
              <li>防止欺诈和滥用</li>
              <li>遵守法律要求</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. 信息共享</h2>
            <p className="leading-relaxed">
              我们不会出售您的个人信息。我们可能与以下方共享信息：
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>服务提供商（如支付处理器、云存储）</li>
              <li>法律要求的情况下</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. 数据安全</h2>
            <p className="leading-relaxed">
              我们采取合理的技术和组织措施来保护您的个人信息安全。
              然而，没有任何互联网传输或电子存储方法是100%安全的。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. 您的权利</h2>
            <p className="leading-relaxed">
              您有权访问、更正或删除您的个人信息。如需行使这些权利，请联系我们。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Cookie使用</h2>
            <p className="leading-relaxed">
              我们使用Cookie和类似技术来改善用户体验、分析使用情况和提供个性化内容。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. 政策更新</h2>
            <p className="leading-relaxed">
              我们可能会不时更新本隐私政策。重大变更将通过网站通知或邮件通知您。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. 联系我们</h2>
            <p className="leading-relaxed">
              如对本隐私政策有任何疑问，请通过 support@example.com 联系我们。
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
