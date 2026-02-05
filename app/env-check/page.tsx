'use client'

import { useEffect, useState } from 'react'

interface EnvStatus {
  name: string
  isSet: boolean
  value?: string
  isValid: boolean
}

export default function EnvCheckPage() {
  const [envStatus, setEnvStatus] = useState<EnvStatus[]>([])

  useEffect(() => {
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_PAYPAL_CLIENT_ID',
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_SITE_NAME',
    ]

    const status: EnvStatus[] = requiredEnvVars.map(name => {
      // 安全访问 process.env
      const value = typeof process !== 'undefined' && process.env ? process.env[name] : undefined
      const isSet = !!value && typeof value === 'string'
      const isValid = isSet &&
        value.length > 5 &&
        !value.includes('your-') &&
        !value.includes('你的')

      return {
        name,
        isSet,
        value: isSet && value ? `${value.substring(0, 20)}...` : undefined,
        isValid,
      }
    })

    setEnvStatus(status)
  }, [])

  const allValid = envStatus.every(env => env.isValid)

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">环境变量检查</h1>

          {allValid ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-2xl mr-3">✅</span>
                <div>
                  <h2 className="text-lg font-semibold text-green-800">配置正常</h2>
                  <p className="text-green-600">所有必需的环境变量都已正确设置</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-2xl mr-3">❌</span>
                <div>
                  <h2 className="text-lg font-semibold text-red-800">配置错误</h2>
                  <p className="text-red-600">部分环境变量未设置或配置错误</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {envStatus.map(env => (
              <div
                key={env.name}
                className={`border rounded-lg p-4 ${
                  env.isValid
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-xl mr-2">
                        {env.isValid ? '✅' : '❌'}
                      </span>
                      <code className="font-mono text-sm font-semibold">
                        {env.name}
                      </code>
                    </div>
                    {env.isSet ? (
                      <div className="ml-7">
                        <p className="text-sm text-gray-600 mb-1">当前值:</p>
                        <code className="text-xs bg-white px-2 py-1 rounded border">
                          {env.value}
                        </code>
                      </div>
                    ) : (
                      <p className="text-sm text-red-600 ml-7">未设置</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!allValid && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                如何修复
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-700">
                <li>登录 Vercel Dashboard</li>
                <li>进入你的项目设置</li>
                <li>选择 Settings → Environment Variables</li>
                <li>添加所有缺失的环境变量</li>
                <li>选择 Production 环境</li>
                <li>保存后重新部署</li>
              </ol>
              <div className="mt-4">
                <a
                  href="/VERCEL_ENV_SETUP.md"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  查看详细设置指南 →
                </a>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-3">系统信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">环境:</span>
                <span className="ml-2 font-mono">
                  {process.env.NODE_ENV || 'development'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">时间:</span>
                <span className="ml-2 font-mono">
                  {new Date().toLocaleString('zh-CN')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <a
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              返回首页
            </a>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              刷新检查
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
