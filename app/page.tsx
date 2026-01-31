import Link from "next/link";

export default function Home() {
  return (
    <div className="text-center mt-16">
      <h1 className="text-4xl md:text-6xl font-bold text-blue-600 mb-8">
        欢迎来到 Grid World
      </h1>
      <p className="text-xl md:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto">
        我们提供1亿个优质格子供你选择，每个格子都拥有唯一标识，你可以购买专属格子，展示你的个人信息、品牌内容等。
        全程支持安全合规的全球支付方式，保障你的交易安全。
      </p>

      {/* 核心按钮 */}
      <Link
        href="/upload"
        className="bg-blue-600 text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-blue-700 transition-colors"
      >
        进入格子世界
      </Link>

      {/* 业务优势展示 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
        <div className="p-6 border rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold text-blue-600 mb-4">唯一标识</h3>
          <p className="text-gray-700">每个格子拥有唯一编号，永久有效，不会重复，保障你的专属权益。</p>
        </div>
        <div className="p-6 border rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold text-blue-600 mb-4">安全支付</h3>
          <p className="text-gray-700">支持全球主流合规支付方式，交易全程加密，资金安全有保障。</p>
        </div>
        <div className="p-6 border rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-2xl font-bold text-blue-600 mb-4">灵活展示</h3>
          <p className="text-gray-700">购买后可自由编辑格子内容，展示个人、品牌信息，随时随地更新。</p>
        </div>
      </div>
    </div>
  );
}