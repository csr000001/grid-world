export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">隐私政策</h1>
      <div className="text-lg text-gray-700 space-y-4">
        <h2 className="text-2xl font-bold mt-8 mb-4">1. 数据收集</h2>
        <p>
          当你访问我们的平台、注册账号、购买格子时，我们可能会收集你的以下信息：
        </p>
        <ul className="list-disc pl-8 space-y-2">
          <li>个人身份信息（如姓名、邮箱地址、联系电话）</li>
          <li>交易信息（如购买的格子编号、支付金额、支付方式）</li>
          <li>设备信息（如IP地址、浏览器类型、访问时间）</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">2. 数据使用</h2>
        <p>我们收集的用户数据仅用于以下目的：</p>
        <ul className="list-disc pl-8 space-y-2">
          <li>为你提供格子购买、编辑、展示等核心服务</li>
          <li>处理你的支付请求，完成交易闭环</li>
          <li>向你发送平台更新、订单通知等相关信息</li>
          <li>优化平台功能与用户体验，提升服务质量</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">3. 数据保护</h2>
        <p>
          我们采用先进的安全加密技术保障用户数据的安全，防止数据被未授权访问、泄露、篡改或销毁。
          我们不会向任何第三方出售、出租你的个人信息，除非得到你的明确授权或遵守相关法律法规要求。
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">4. 隐私政策变更</h2>
        <p>
          我们可能会根据平台发展与法律法规变化更新本隐私政策，更新后的政策将在平台上公示，
          继续使用我们的平台即表示你同意更新后的隐私政策。
        </p>
      </div>
    </div>
  );
}