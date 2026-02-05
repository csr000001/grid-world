'use client'

export default function MinimalTestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
        <h1 className="text-2xl font-bold mb-4">✅ 测试页面</h1>
        <p className="text-gray-700 mb-4">
          如果你能看到这个页面，说明基本的 React 渲染是正常的。
        </p>
        <div className="space-y-2 text-sm">
          <p>✅ React 渲染正常</p>
          <p>✅ Tailwind CSS 正常</p>
          <p>✅ 客户端组件正常</p>
        </div>
        <div className="mt-6 p-4 bg-blue-50 rounded">
          <p className="text-sm text-blue-800">
            如果这个页面正常，但其他页面报错，说明问题在特定页面的代码中。
          </p>
        </div>
      </div>
    </div>
  )
}
