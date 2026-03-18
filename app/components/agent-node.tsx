"use client"

import { CheckCircle, Clock, PlayCircle, AlertCircle, Loader2 } from "lucide-react"

type AgentNodeProps = {
  node: {
    id: string
    name: string
    description: string
    status: "pending" | "running" | "completed" | "error"
    result?: string
    progress?: number
  }
  index: number
  isActive: boolean
}

export function AgentNode({ node, index, isActive }: AgentNodeProps) {
  const getStatusIcon = () => {
    switch (node.status) {
      case "completed":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "running":
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      case "error":
        return <AlertCircle className="h-6 w-6 text-red-500" />
      default:
        return <Clock className="h-6 w-6 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (node.status) {
      case "completed":
        return "border-green-500/30 bg-green-500/10"
      case "running":
        return "border-blue-500/30 bg-blue-500/10 animate-pulse-glow"
      case "error":
        return "border-red-500/30 bg-red-500/10"
      default:
        return "border-gray-700 bg-gray-800/50"
    }
  }

  const getStatusText = () => {
    switch (node.status) {
      case "completed":
        return "已完成"
      case "running":
        return "执行中"
      case "error":
        return "出错"
      default:
        return "等待中"
    }
  }

  return (
    <div className="relative">
      {/* 节点序号 */}
      <div className="absolute -left-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 font-bold text-white shadow-lg">
        {index}
      </div>

      <div
        className={`relative rounded-xl border-2 p-5 transition-all duration-300 ${getStatusColor()} ${
          node.status === "running" ? "scale-[1.02]" : ""
        }`}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{node.name}</h3>
            <p className="mt-1 text-sm text-gray-400">{node.description}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50">
            {getStatusIcon()}
          </div>
        </div>

        {/* 进度条 */}
        {node.progress !== undefined && (
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-gray-400">进度</span>
              <span className="font-medium text-white">{node.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${node.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 状态标签 */}
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              node.status === "completed"
                ? "bg-green-500/20 text-green-400"
                : node.status === "running"
                ? "bg-blue-500/20 text-blue-400"
                : node.status === "error"
                ? "bg-red-500/20 text-red-400"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            {getStatusText()}
          </span>

          {node.result && (
            <span className="text-xs text-gray-500 truncate max-w-[120px]">
              {node.result}
            </span>
          )}
        </div>

        {/* 运行中的光晕效果 */}
        {node.status === "running" && (
          <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-xl" />
        )}
      </div>
    </div>
  )
}