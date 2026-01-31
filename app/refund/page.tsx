import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function RefundPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">退款政策</h1>

        <div className="max-w-3xl mx-auto space-y-6 text-gray-700">
          <p className="text-sm text-gray-500">最后更新日期：2026年2月1日</p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. 退款资格</h2>
            <p className="leading-relaxed">
              我们理解有时您可能需要退款。以下情况符合退款条件：
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>技术问题导致无法使用服务</li>
              <li>重复扣费</li>
              <li>未经授权的交易</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. 不可退款情况</h2>
            <p className="leading-relaxed">
              以下情况不符合退款条件：
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>已成功购买并使用的格子</li>
              <li>因违反服务条款而被暂停的账户</li>
              <li>购买后改变主意</li>
              <li>已上传内容的格子</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. 退款流程</h2>
            <p className="leading-relaxed">
              如需申请退款，请按以下步骤操作：
            </p>
            <ol className="list-decimal list-inside mt-4 space-y-2">
              <li>发送邮件至 support@example.com</li>
              <li>提供订单号和退款原因</li>
              <li>我们将在3-5个工作日内审核您的申请</li>
              <li>如果批准，退款将在7-14个工作日内处理</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. 退款方式</h2>
            <p className="leading-relaxed">
              退款将通过原支付方式返还。根据您的银行或支付提供商，
              退款可能需要额外的时间才能显示在您的账户中。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. 部分退款</h2>
            <p className="leading-relaxed">
              在某些情况下，我们可能会提供部分退款，例如：
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>服务中断导致的使用时间损失</li>
              <li>质量问题但仍可部分使用</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. 争议解决</h2>
            <p className="leading-relaxed">
              如果您对退款决定有异议，可以通过邮件联系我们的客服团队进行进一步沟通。
              我们致力于公平合理地解决所有争议。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. 政策变更</h2>
            <p className="leading-relaxed">
              我们保留随时修改本退款政策的权利。任何变更将在网站上公布，
              并在发布后立即生效。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. 联系我们</h2>
            <p className="leading-relaxed">
              如对本退款政策有任何疑问，请通过 support@example.com 联系我们。
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
