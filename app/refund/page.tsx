export default function RefundPolicy() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">退款政策</h1>
      <div className="text-lg text-gray-700 space-y-4">
        <h2 className="text-2xl font-bold mt-8 mb-4">1. 退款条件</h2>
        <p>符合以下条件的订单，可申请退款：</p>
        <ul className="list-disc pl-8 space-y-2">
          <li>购买格子后，未对格子进行任何编辑操作，且申请退款时间在购买后7天内</li>
          <li>因平台技术故障导致格子无法正常展示、使用，且无法通过技术手段修复</li>
          <li>格子存在重复、虚假等问题，影响用户正常使用权益</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">2. 不予退款条件</h2>
        <p>以下情况，不予办理退款：</p>
        <ul className="list-disc pl-8 space-y-2">
          <li>购买格子后，已对格子进行编辑、展示等操作，且格子功能正常</li>
          <li>超过购买后7天申请退款，且无合理理由</li>
          <li>因用户自身操作失误（如误购、错选格子）导致的订单问题</li>
          <li>因用户违反平台规定，导致格子被封禁、删除的订单</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">3. 退款流程</h2>
        <ol className="list-decimal pl-8 space-y-2">
          <li>用户通过平台联系邮箱发送退款申请，注明订单编号、格子编号、退款理由，并提供相关证明材料</li>
          <li>平台客服在24小时内审核退款申请，审核通过后将通过邮件通知用户</li>
          <li>审核通过后，平台将在3-7个工作日内将退款金额原路返还至用户的支付账户</li>
        </ol>

        <h2 className="text-2xl font-bold mt-8 mb-4">4. 退款说明</h2>
        <p>
          退款金额仅包含格子购买的本金，不包含支付过程中产生的手续费、汇率差额等相关费用。
          平台保留对退款申请的最终审核权，如有疑问，可通过联系邮箱与我们取得联系。
        </p>
      </div>
    </div>
  );
}