"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Play, RefreshCw, Download, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { AgentNode } from "./agent-node"
import { ReportViewer } from "./report-viewer"

type AgentNodeType = {
  id: string
  name: string
  description: string
  status: "pending" | "running" | "completed" | "error"
  result?: string
  progress?: number
}

type AnalysisReport = {
  title: string
  summary: string
  competitors: Array<{
    name: string
    strengths: string[]
    weaknesses: string[]
  }>
  swotAnalysis: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  recommendations: string[]
  markdownContent: string
}

export function AnalysisDashboard() {
  const [productName, setProductName] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null)
  const [agentNodes, setAgentNodes] = useState<AgentNodeType[]>([
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
  ])
  const eventSourceRef = useRef<EventSource | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productName.trim() || isAnalyzing) return

    setIsAnalyzing(true)
    setAnalysisReport(null)
    // 重置节点状态
    setAgentNodes(nodes =>
      nodes.map(node => ({
        ...node,
        status: "pending",
        result: undefined,
        progress: 0,
      }))
    )

    // 建立SSE连接
    const eventSource = new EventSource(`/api/analyze?product=${encodeURIComponent(productName)}`)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === "node_update") {
          setAgentNodes(nodes =>
            nodes.map(node =>
              node.id === data.nodeId
                ? {
                    ...node,
                    status: data.status,
                    result: data.result,
                    progress: data.progress,
                  }
                : node
            )
          )
        } else if (data.type === "report") {
          setAnalysisReport(data.report)
          setIsAnalyzing(false)
          eventSource.close()
        } else if (data.type === "error") {
          console.error("Analysis error:", data.error)
          setIsAnalyzing(false)
          eventSource.close()
        }
      } catch (error) {
        console.error("Failed to parse SSE data:", error)
      }
    }

    eventSource.onerror = () => {
      console.error("SSE connection error")
      setIsAnalyzing(false)
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }

  const handleReset = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsAnalyzing(false)
    setAgentNodes(nodes =>
      nodes.map(node => ({
        ...node,
        status: "pending",
        result: undefined,
        progress: 0,
      }))
    )
    setAnalysisReport(null)
  }

  const handleDownload = () => {
    if (!analysisReport) return
    const blob = new Blob([analysisReport.markdownContent], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${productName}_竞品分析报告.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 清理Effect
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return (
    <div className="space-y-8">
      {/* 输入区域 */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">开始分析</h2>
          <p className="mt-2 text-gray-400">输入您要分析的产品或公司名称</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="例如: ChatGPT, Notion, Figma..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                disabled={isAnalyzing}
              />
            </div>
            <button
              type="submit"
              disabled={!productName.trim() || isAnalyzing}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
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
              className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 font-medium text-gray-300 transition-colors hover:bg-gray-700"
            >
              <RefreshCw className="h-5 w-5" />
              重置
            </button>
          </div>

          {isAnalyzing && (
            <div className="rounded-lg bg-blue-900/20 p-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                <div>
                  <p className="font-medium text-blue-300">正在分析 "{productName}"...</p>
                  <p className="text-sm text-blue-400/80">系统正在执行多步骤分析工作流，请勿关闭页面</p>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Agent工作流可视化 */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">AI Agent工作流</h2>
          <p className="mt-2 text-gray-400">6步智能分析流程，实时展示执行状态</p>
        </div>

        <div className="relative">
          {/* 连接线 */}
          <div className="absolute left-16 top-12 h-[2px] w-[calc(100%-8rem)] bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30"></div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agentNodes.map((node, index) => (
              <AgentNode
                key={node.id}
                node={node}
                index={index + 1}
                isActive={isAnalyzing}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 报告区域 */}
      {analysisReport && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">分析报告</h2>
              <p className="mt-2 text-gray-400">基于深度AI分析生成的完整竞品报告</p>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:from-green-700 hover:to-emerald-700"
            >
              <Download className="h-5 w-5" />
              下载报告
            </button>
          </div>

          <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-6">
            <h3 className="mb-3 text-xl font-bold text-white">{analysisReport.title}</h3>
            <p className="text-gray-300">{analysisReport.summary}</p>
          </div>

          <ReportViewer markdownContent={analysisReport.markdownContent} />
        </div>
      )}

      {/* 空状态提示 */}
      {!analysisReport && !isAnalyzing && (
        <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/30 p-12 text-center">
          <div className="mx-auto max-w-md">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-800 to-gray-900">
              <Send className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="mb-3 text-xl font-bold text-white">等待分析任务</h3>
            <p className="text-gray-400">
              输入产品名称后，系统将启动AI Agent工作流，自动执行竞品分析并生成完整报告
            </p>
          </div>
        </div>
      )}
    </div>
  )
}