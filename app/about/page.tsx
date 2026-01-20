export default function About() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">关于我们</h1>
      <div className="text-lg text-gray-700 space-y-4">
        <p>
          {process.env.NEXT_PUBLIC_SITE_NAME} 是一家专注于格子展示与交易的平台，我们致力于为全球用户提供优质、安全、合规的格子购买服务。
        </p>
        <p>
          我们的平台拥有1亿个优质格子，每个格子都拥有唯一标识，用户购买后可自由编辑格子内容，展示个人信息、品牌内容、产品推广等，打造专属的线上展示空间。
        </p>
        <p>
          平台严格遵守全球各地的相关法律法规，采用安全加密技术保障用户数据安全，同时支持全球主流合规支付方式，保障用户的交易安全与资金安全。
        </p>
        <p>
          我们的团队拥有丰富的互联网平台运营经验，始终以用户需求为核心，不断优化平台功能与用户体验，为用户提供更优质的服务。
        </p>
        <p>
          如果你对我们的平台有任何疑问或建议，欢迎通过页面底部的联系邮箱与我们取得联系，我们将在24小时内给予回复。
        </p>
      </div>
    </div>
  );
}