"use client"

import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import {
  Send, Play, RefreshCw, Download, Copy, CheckCircle,
  Clock, AlertCircle, Loader2, Search, Target, Brain,
  BarChart3, FileText, ChevronRight, Sparkles, ChevronDown, ChevronUp, Settings
} from "lucide-react"
import remarkGfm from "remark-gfm"

type AgentNode = {
  id: string
  name: string
  description: string
  status: "pending" | "running" | "completed" | "error"
  output?: string
  progress?: number
}

const initialNodes: AgentNode[] = [
  {
    id: "1",
    name: "研究规划Agent",
    description: "分解搜索策略，制定研究计划",
    status: "pending",
  },
  {
    id: "2",
    name: "并行信息搜索",
    description: "调用Tavily API搜索产品、竞品、行业信息",
    status: "pending",
  },
  {
    id: "3",
    name: "竞品识别Agent",
    description: "从搜索结果中识别Top3竞品",
    status: "pending",
  },
  {
    id: "4",
    name: "迭代搜索",
    description: "对每个竞品进一步搜索详情",
    status: "pending",
  },
  {
    id: "5",
    name: "深度分析Agent",
    description: "SWOT分析、功能对比",
    status: "pending",
  },
  {
    id: "6",
    name: "报告生成Agent",
    description: "生成完整Markdown报告",
    status: "pending",
  },
]

export default function Home() {
  const [productName, setProductName] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [agentNodes, setAgentNodes] = useState<AgentNode[]>(initialNodes)
  const [currentStepId, setCurrentStepId] = useState<string>("")
  const [currentOutput, setCurrentOutput] = useState("")
  const [reportContent, setReportContent] = useState("")
  const [isReportReady, setIsReportReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [customModel, setCustomModel] = useState("")
  const [customApiKey, setCustomApiKey] = useState("")

  const eventSourceRef = useRef<{ abort: () => void } | null>(null)

  const getNodeIcon = (node: AgentNode) => {
    switch (node.id) {
      case "1": return <Brain className="h-5 w-5" />
      case "2": return <Search className="h-5 w-5" />
      case "3": return <Target className="h-5 w-5" />
      case "4": return <Search className="h-5 w-5" />
      case "5": return <BarChart3 className="h-5 w-5" />
      case "6": return <FileText className="h-5 w-5" />
      default: return <ChevronRight className="h-5 w-5" />
    }
  }

  const getStatusIcon = (status: AgentNode["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "running":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productName.trim() || isAnalyzing) return

    // 重置状态
    setIsAnalyzing(true)
    setIsReportReady(false)
    setReportContent("")
    setCurrentOutput("")
    setAgentNodes(initialNodes.map(node => ({ ...node, status: "pending", output: "", progress: 0 })))

    // 使用fetch API建立SSE连接，支持自定义请求头
    const abortController = new AbortController()
    const headers: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }

    // 添加自定义API Key和Model请求头（如果提供）
    if (customApiKey.trim()) {
      headers['x-api-key'] = customApiKey.trim()
    }
    if (customModel.trim()) {
      headers['x-model'] = customModel.trim()
    }

    try {
      const response = await fetch(`/api/analyze?product=${encodeURIComponent(productName)}`, {
        method: 'GET',
        headers,
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `请求失败: ${response.status}`)
      }

      // 保存abortController以便后续取消
      eventSourceRef.current = { abort: () => abortController.abort() } as any

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === "node_update") {
                // 更新节点状态
                setAgentNodes(prev => prev.map(node =>
                  node.id === data.nodeId
                    ? {
                      ...node,
                      status: data.status,
                      output: data.result || node.output,
                      progress: data.progress || node.progress
                    }
                    : node
                ))

                // 设置当前步骤和输出
                if (data.status === "running" || data.status === "completed") {
                  setCurrentStepId(data.nodeId)
                  if (data.result) {
                    setCurrentOutput(prev => prev + (prev ? "\n\n" : "") + data.result)
                  }
                }
              }
              else if (data.type === "report") {
                setReportContent(data.report.markdownContent)
                setIsReportReady(true)
                setIsAnalyzing(false)
                setCurrentOutput("分析完成！正在生成最终报告...")
                abortController.abort()
              }
              else if (data.type === "error") {
                console.error("Analysis error:", data.error)
                setIsAnalyzing(false)
                setCurrentOutput(`错误: ${data.error}`)
                abortController.abort()
              }
            } catch (error) {
              console.error("Failed to parse SSE data:", error)
            }
          }
        }
      }
    } catch (error: any) {
      console.error("SSE connection error:", error)
      setIsAnalyzing(false)
      setCurrentOutput(`连接错误: ${error.message}`)
    }
  }

  const handleReset = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.abort()
      eventSourceRef.current = null
    }
    setIsAnalyzing(false)
    setIsReportReady(false)
    setProductName("")
    setAgentNodes(initialNodes)
    setCurrentStepId("")
    setCurrentOutput("")
    setReportContent("")
    setCustomModel("")
    setCustomApiKey("")
    setIsSettingsOpen(false)
  }

  const handleCopyReport = () => {
    if (!reportContent) return
    navigator.clipboard.writeText(reportContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadReport = () => {
    if (!reportContent) return
    const blob = new Blob([reportContent], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${productName}_竞品分析报告.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 获取当前步骤
  const currentStep = agentNodes.find(node => node.id === currentStepId) || agentNodes[0]

  // 清理Effect
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.abort()
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <header className="mb-12">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl rounded-full"></div>
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 p-1.5">
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-gray-900">
                  <Sparkles className="h-8 w-8 text-blue-400" />
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-bold tracking-tight text-white">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  🔍 竞品分析AI Agent
                </span>
              </h1>
              <p className="mt-2 text-lg text-gray-400">
                智能多步骤竞品分析工作流 • 实时进度追踪 • 深度报告生成
              </p>
            </div>
          </div>

          {/* 输入区域 */}
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-6 backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="输入产品/公司名称，例如：ChatGPT, Notion, Figma..."
                      className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-5 py-3.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      disabled={isAnalyzing}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!productName.trim() || isAnalyzing}
                    className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3.5 font-semibold text-white transition-all hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        分析中...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5" />
                        开始分析
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 px-5 py-3.5 font-medium text-gray-300 transition-colors hover:bg-gray-800"
                  >
                    <RefreshCw className="h-5 w-5" />
                    重置
                  </button>
                </div>

                {/* 自定义API设置区域 */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {isSettingsOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <Settings className="h-4 w-4" />
                    使用自己的Model 和API Key（可选）
                  </button>

                  {isSettingsOpen && (
                    <div className="mt-4 p-4 rounded-xl border border-gray-700 bg-gray-800/30 space-y-4 animate-slide-in">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1.5">
                            API Key
                          </label>
                          <input
                            type="password"
                            value={customApiKey}
                            onChange={(e) => setCustomApiKey(e.target.value)}
                            placeholder="输入您的API Key"
                            className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            disabled={isAnalyzing}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1.5">
                            Model (可选)
                          </label>
                          <input
                            type="text"
                            value={customModel}
                            onChange={(e) => setCustomModel(e.target.value)}
                            placeholder="例如：deepseek-chat, gpt-4-turbo"
                            className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            disabled={isAnalyzing}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 pt-2 border-t border-gray-800">
                        <p>Key仅用于本次请求，不会被存储。免费额度：1次</p>
                      </div>
                    </div>
                  )}
                </div>

                {isAnalyzing && (
                  <div className="rounded-xl bg-blue-900/20 p-4 border border-blue-800/30">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                      <div>
                        <p className="font-medium text-blue-300">
                          正在分析 "<span className="text-white">{productName}</span>"...
                        </p>
                        <p className="text-sm text-blue-400/80">AI Agent正在执行6步分析工作流，请稍候</p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="mx-auto max-w-7xl">
          {isAnalyzing || isReportReady ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 左栏 - 工作流进度 (30%) */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/80 to-gray-900/40 p-6 backdrop-blur-sm">
                    <h2 className="mb-6 text-xl font-bold text-white flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      AI Agent工作流
                    </h2>

                    <div className="relative">
                      {/* 连接竖线 */}
                      <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/30 via-purple-500/30 to-pink-500/30"></div>

                      <div className="space-y-8">
                        {agentNodes.map((node, index) => (
                          <div
                            key={node.id}
                            className={`relative pl-14 transition-all duration-300 ${node.status === "running" ? "scale-[1.02]" : ""
                              }`}
                          >
                            {/* 节点序号 */}
                            <div className={`absolute left-0 top-0 flex h-14 w-14 items-center justify-center rounded-full border-2 backdrop-blur-sm transition-all duration-300 ${node.status === "pending"
                                ? "border-dashed border-gray-700 bg-gray-800/30"
                                : node.status === "running"
                                  ? "border-blue-500 bg-blue-500/10 animate-pulse shadow-lg shadow-blue-500/20"
                                  : node.status === "completed"
                                    ? "border-green-500 bg-green-500/10"
                                    : "border-red-500 bg-red-500/10"
                              }`}>
                              <div className="flex items-center justify-center">
                                {getNodeIcon(node)}
                              </div>
                              <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-bold">
                                {index + 1}
                              </div>
                            </div>

                            <div className="pt-1.5">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-semibold ${node.status === "running"
                                    ? "text-blue-300"
                                    : node.status === "completed"
                                      ? "text-green-300"
                                      : node.status === "error"
                                        ? "text-red-300"
                                        : "text-gray-300"
                                  }`}>
                                  {node.name}
                                </h3>
                                <div className="scale-90">
                                  {getStatusIcon(node.status)}
                                </div>
                              </div>
                              <p className="text-sm text-gray-400 mb-2">{node.description}</p>

                              {node.progress !== undefined && node.progress > 0 && (
                                <div className="mb-2">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500">进度</span>
                                    <span className="font-medium text-gray-300">{node.progress}%</span>
                                  </div>
                                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                      style={{ width: `${node.progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {node.output && node.status !== "pending" && (
                                <button
                                  onClick={() => {
                                    setCurrentStepId(node.id)
                                    setCurrentOutput(node.output || "")
                                  }}
                                  className={`text-xs px-3 py-1 rounded-lg transition-colors ${currentStepId === node.id
                                      ? "bg-blue-500/20 text-blue-400"
                                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                    }`}
                                >
                                  查看输出
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右栏 - 实时输出区 (70%) */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/80 to-gray-900/40 p-6 backdrop-blur-sm h-full">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                      {isReportReady ? "📊 分析报告" : "📈 实时输出"}
                    </h2>

                    {isReportReady && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleCopyReport}
                          className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
                        >
                          {copied ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              复制报告
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleDownloadReport}
                          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:from-green-700 hover:to-emerald-700"
                        >
                          <Download className="h-4 w-4" />
                          下载报告
                        </button>
                      </div>
                    )}
                  </div>

                  {isReportReady ? (
                    <div className="animate-slide-in">
                      <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-em:text-gray-300 prose-blockquote:border-l-blue-500 prose-blockquote:text-gray-400 prose-ul:text-gray-300 prose-ol:text-gray-300 prose-li:text-gray-300 prose-table:text-gray-300 prose-th:border-gray-700 prose-td:border-gray-700 prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-code:text-gray-300 prose-pre:bg-gray-900">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {reportContent}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* 当前步骤信息 */}
                      <div className="rounded-xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-5 border border-blue-800/30">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${currentStep.status === "running"
                              ? "bg-blue-500/20 animate-pulse"
                              : currentStep.status === "completed"
                                ? "bg-green-500/20"
                                : "bg-gray-800"
                            }`}>
                            {getNodeIcon(currentStep)}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-lg">{currentStep.name}</h3>
                            <p className="text-sm text-gray-400">{currentStep.description}</p>
                          </div>
                          <div className="ml-auto">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${currentStep.status === "running"
                                ? "bg-blue-500/20 text-blue-400"
                                : currentStep.status === "completed"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-gray-800 text-gray-400"
                              }`}>
                              {currentStep.status === "running" ? "执行中" :
                                currentStep.status === "completed" ? "已完成" :
                                  currentStep.status === "error" ? "出错" : "等待中"}
                            </div>
                          </div>
                        </div>

                        {currentStep.progress !== undefined && currentStep.progress > 0 && (
                          <div className="mt-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-400">进度</span>
                              <span className="font-medium text-white">{currentStep.progress}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                style={{ width: `${currentStep.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 输出内容 */}
                      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                          <h4 className="font-medium text-gray-300">实时输出</h4>
                        </div>
                        <div className="font-mono text-sm text-gray-300 whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                          {currentOutput || "等待步骤开始执行..."}
                        </div>
                      </div>

                      {/* 操作提示 */}
                      <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/30 p-5">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <Send className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-300 mb-2">💡 提示</h4>
                            <ul className="text-sm text-gray-500 space-y-1">
                              <li>• 每个AI Agent将按顺序执行，实时输出结果</li>
                              <li>• 点击左侧已完成节点可查看中间输出</li>
                              <li>• 最终报告将以Markdown格式展示，支持表格和emoji</li>
                              <li>• 分析完成后可复制或下载完整报告</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* 空状态 - 等待分析 */
            <div className="mx-auto max-w-4xl">
              <div className="rounded-2xl border border-dashed border-gray-700 bg-gradient-to-b from-gray-900/30 to-gray-900/10 p-16 text-center">
                <div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-gray-900 to-gray-800">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-xl rounded-full"></div>
                    <Brain className="relative h-16 w-16 text-gray-600" />
                  </div>
                </div>
                <h3 className="mb-4 text-2xl font-bold text-white">等待分析任务</h3>
                <p className="mx-auto max-w-lg text-lg text-gray-400 mb-8">
                  输入产品名称，启动6步AI Agent工作流，系统将自动执行竞品识别、深度分析和报告生成
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-gray-300">研究规划</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                      <span className="text-sm text-gray-300">并行搜索</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-300">竞品识别</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                      <span className="text-sm text-gray-300">深度分析</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-pink-500"></div>
                      <span className="text-sm text-gray-300">报告生成</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* 页脚 */}
        <footer className="mt-16 border-t border-gray-800 pt-8 text-center text-gray-500">
          <p className="text-sm">
            Powered by DeepSeek AI & Tavily Search • 基于Next.js 14全栈开发 •
            专为产品经理和创业者打造
          </p>
          <p className="mt-2 text-xs">
            输入产品/公司名称，系统将自动执行6步分析工作流，生成完整竞品分析报告
          </p>
        </footer>
      </div>
    </div>
  )
}
