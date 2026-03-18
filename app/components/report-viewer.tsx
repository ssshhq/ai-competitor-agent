"use client"

import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"
import remarkGfm from "remark-gfm"
import { Copy, Check, ExternalLink } from "lucide-react"
import { useState } from "react"

type ReportViewerProps = {
  markdownContent: string
}

export function ReportViewer({ markdownContent }: ReportViewerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      {/* 工具栏 */}
      <div className="sticky top-0 z-10 mb-4 flex items-center justify-between rounded-t-lg border-b border-gray-800 bg-gray-900/90 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <span className="ml-2 text-sm font-medium text-gray-300">竞品分析报告.md</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                已复制
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                复制全文
              </>
            )}
          </button>
          <a
            href={`data:text/markdown;charset=utf-8,${encodeURIComponent(markdownContent)}`}
            download="竞品分析报告.md"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:from-blue-700 hover:to-purple-700"
          >
            <ExternalLink className="h-4 w-4" />
            原始文件
          </a>
        </div>
      </div>

      {/* Markdown内容 */}
      <div className="rounded-b-lg bg-gray-900/50 p-6">
        <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-em:text-gray-300 prose-blockquote:border-l-blue-500 prose-blockquote:text-gray-400 prose-ul:text-gray-300 prose-ol:text-gray-300 prose-li:text-gray-300 prose-table:text-gray-300 prose-th:border-gray-700 prose-td:border-gray-700 prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-code:text-gray-300 prose-pre:bg-gray-900">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, className, children, inline, ...props }) {
                const match = /language-(\w+)/.exec(className || "")
                return !inline && match ? (
                  <div className="relative">
                    <div className="absolute right-2 top-2 flex gap-2">
                      <span className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-400">
                        {match[1]}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(String(children))
                        }}
                        className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-400 hover:bg-gray-700"
                      >
                        复制
                      </button>
                    </div>
                    <SyntaxHighlighter
                      style={vscDarkPlus as any}
                      language={match[1]}
                      PreTag="div"
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code
                    className="rounded bg-gray-800 px-2 py-1 font-mono text-sm"
                  >
                    {children}
                  </code>
                )
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">{children}</table>
                  </div>
                )
              },
            }}
          >
            {markdownContent}
          </ReactMarkdown>
        </div>
      </div>

      {/* 水印 */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5">
        <div className="rotate-12 text-center">
          <div className="text-6xl font-bold text-white">AI竞品分析</div>
          <div className="mt-2 text-3xl font-semibold text-white">Confidential</div>
        </div>
      </div>
    </div>
  )
}