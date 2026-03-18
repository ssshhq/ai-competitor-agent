import { NextRequest } from "next/server"
import { callDeepSeek, callDeepSeekWithConfig, AGENT_PROMPTS } from "../../lib/deepseek"
import { parallelSearch, combineAllResults } from "../../lib/tavily"

// SSE流帮助函数
function createSSEStream() {
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const send = (data: any) => {
    const message = `data: ${JSON.stringify(data)}\n\n`
    writer.write(encoder.encode(message))
  }

  const close = () => {
    writer.close()
  }

  const error = (error: any) => {
    send({ type: "error", error: error.message })
    close()
  }

  return { send, close, error, stream: stream.readable }
}

// 模拟进度更新
function simulateProgress(nodeId: string, send: (data: any) => void) {
  let progress = 0
  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 10) + 5
    if (progress >= 100) {
      progress = 100
      clearInterval(interval)
    }
    send({
      type: "node_update",
      nodeId,
      status: progress === 100 ? "completed" : "running",
      progress,
    })
  }, 500)

  return () => clearInterval(interval)
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const product = searchParams.get("product")

  if (!product) {
    return new Response(
      JSON.stringify({ error: "缺少产品名称参数" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  // 读取自定义API配置
  const customApiKey = request.headers.get('x-api-key')
  const customModel = request.headers.get('x-model')

  // 获取用户标识（IP地址或自定义标识）
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous'
  const identifier = customApiKey ? `custom-${customApiKey.substring(0, 8)}` : `free-${ip}`

  // 检查使用限制（仅对免费用户）
  if (!customApiKey) {
    const { checkUsageLimit } = await import('../../lib/deepseek')
    const usageCheck = checkUsageLimit(identifier)

    if (!usageCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: "免费额度已用完，请添加自己的API Key或明天再试",
          type: "rate_limit",
          remaining: usageCheck.remaining
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      )
    }
  }

  // 创建SSE流
  const { send, close, error, stream } = createSSEStream()

  // 异步执行分析流程
  ;(async () => {
    try {
      // 辅助函数：根据是否有自定义API密钥调用适当的AI函数
      const callAI = async (messages: any[]) => {
        if (customApiKey) {
          return await callDeepSeekWithConfig(
            messages,
            customApiKey,
            customModel || undefined,
            process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1"
          )
        } else {
          return await callDeepSeek(messages)
        }
      }

      // 步骤1: 研究规划Agent
      send({
        type: "node_update",
        nodeId: "1",
        status: "running",
        progress: 0,
        result: "正在制定研究计划...",
      })
      const stopProgress1 = simulateProgress("1", send)

      const researchPlanPrompt = AGENT_PROMPTS.researchPlanner(product)
      const researchPlan = await callAI([
        { role: "system", content: "你是一个专业的研究规划专家。" },
        { role: "user", content: researchPlanPrompt },
      ])

      stopProgress1()
      send({
        type: "node_update",
        nodeId: "1",
        status: "completed",
        progress: 100,
        result: "研究计划已生成",
      })

      // 解析研究计划中的搜索查询
      let searchQueries: Array<{ query: string; type: string }> = []
      try {
        const planMatch = researchPlan.match(/\[[\s\S]*?\]/)
        if (planMatch) {
          searchQueries = JSON.parse(planMatch[0])
        } else {
          // 备用方案：生成一些默认查询
          searchQueries = [
            { query: `${product} 产品介绍 功能`, type: "product_info" },
            { query: `${product} 竞品 竞争对手`, type: "competitor_info" },
            { query: `${product} 行业趋势 2024`, type: "industry_trend" },
            { query: `${product} vs 比较 对比`, type: "competitor_info" },
            { query: `${product} 用户评价 评测`, type: "product_info" },
            { query: `${product} 市场分析 份额`, type: "industry_trend" },
          ]
        }
      } catch (e) {
        console.error("Failed to parse research plan:", e)
        searchQueries = [
          { query: `${product} 产品介绍`, type: "product_info" },
          { query: `${product} 竞争对手`, type: "competitor_info" },
          { query: `${product} 行业趋势`, type: "industry_trend" },
        ]
      }

      // 步骤2: 并行信息搜索
      send({
        type: "node_update",
        nodeId: "2",
        status: "running",
        progress: 0,
        result: "开始并行搜索...",
      })
      const stopProgress2 = simulateProgress("2", send)

      const queries = searchQueries.map(item => item.query).slice(0, 6) // 最多6个查询
      const searchResults = await parallelSearch(queries, 5)
      const combinedResults = combineAllResults(searchResults)

      stopProgress2()
      send({
        type: "node_update",
        nodeId: "2",
        status: "completed",
        progress: 100,
        result: `完成${queries.length}个搜索查询`,
      })

      // 步骤3: 竞品识别Agent
      send({
        type: "node_update",
        nodeId: "3",
        status: "running",
        progress: 0,
        result: "识别竞品中...",
      })
      const stopProgress3 = simulateProgress("3", send)

      const competitorPrompt = AGENT_PROMPTS.competitorIdentifier(combinedResults)
      const competitorAnalysis = await callAI([
        { role: "system", content: "你是一个专业的竞品识别专家。" },
        { role: "user", content: competitorPrompt },
      ])

      let competitors = []
      try {
        const competitorMatch = competitorAnalysis.match(/\{[\s\S]*?\}/)
        if (competitorMatch) {
          const parsed = JSON.parse(competitorMatch[0])
          competitors = parsed.competitors || []
        }
      } catch (e) {
        console.error("Failed to parse competitor analysis:", e)
        competitors = [
          { name: "竞品A", type: "direct", confidence: 0.8 },
          { name: "竞品B", type: "direct", confidence: 0.7 },
          { name: "竞品C", type: "indirect", confidence: 0.6 },
        ]
      }

      stopProgress3()
      send({
        type: "node_update",
        nodeId: "3",
        status: "completed",
        progress: 100,
        result: `识别到${competitors.length}个竞品`,
      })

      // 步骤4: 迭代搜索
      send({
        type: "node_update",
        nodeId: "4",
        status: "running",
        progress: 0,
        result: "对竞品进行深度搜索...",
      })
      const stopProgress4 = simulateProgress("4", send)

      // 对每个竞品进行进一步搜索
      const competitorQueries = competitors
        .slice(0, 3)
        .map((comp: any) => `${comp.name} 产品 功能 优缺点 市场`)
      const competitorDetails = await parallelSearch(competitorQueries, 3)
      const combinedCompetitorDetails = combineAllResults(competitorDetails)

      stopProgress4()
      send({
        type: "node_update",
        nodeId: "4",
        status: "completed",
        progress: 100,
        result: `完成${competitorQueries.length}个竞品深度搜索`,
      })

      // 步骤5: 深度分析Agent
      send({
        type: "node_update",
        nodeId: "5",
        status: "running",
        progress: 0,
        result: "进行深度SWOT分析...",
      })
      const stopProgress5 = simulateProgress("5", send)

      const allSearchData = combinedResults + "\n\n竞品详情:\n" + combinedCompetitorDetails
      const deepAnalysisPrompt = AGENT_PROMPTS.deepAnalyzer(product, competitors, allSearchData)
      const deepAnalysis = await callAI([
        { role: "system", content: "你是一个专业的商业分析专家。" },
        { role: "user", content: deepAnalysisPrompt },
      ])

      let analysisData = {}
      try {
        const analysisMatch = deepAnalysis.match(/\{[\s\S]*?\}/)
        if (analysisMatch) {
          analysisData = JSON.parse(analysisMatch[0])
        }
      } catch (e) {
        console.error("Failed to parse deep analysis:", e)
        analysisData = {
          swot: {
            strengths: ["产品功能完善", "用户体验良好"],
            weaknesses: ["市场认知度不足", "价格较高"],
            opportunities: ["市场增长迅速", "技术迭代带来新机会"],
            threats: ["竞争激烈", "政策变化风险"],
          },
          competitive_analysis: {
            feature_comparison: {
              features: ["核心功能", "用户体验", "价格"],
              comparison: {
                [product]: ["优秀", "良好", "中等"],
                "竞品A": ["良好", "优秀", "低"],
                "竞品B": ["中等", "中等", "低"],
              },
            },
          },
        }
      }

      stopProgress5()
      send({
        type: "node_update",
        nodeId: "5",
        status: "completed",
        progress: 100,
        result: "深度分析完成",
      })

      // 步骤6: 报告生成Agent
      send({
        type: "node_update",
        nodeId: "6",
        status: "running",
        progress: 0,
        result: "生成分析报告...",
      })
      const stopProgress6 = simulateProgress("6", send)

      const reportPrompt = AGENT_PROMPTS.reportGenerator(product, {
        researchPlan,
        competitors,
        analysisData,
        searchSummary: `基于${queries.length}个搜索查询和${competitorQueries.length}个竞品查询`,
      })

      const markdownReport = await callAI([
        { role: "system", content: "你是一个专业的商业报告撰写专家。" },
        { role: "user", content: reportPrompt },
      ])

      stopProgress6()
      send({
        type: "node_update",
        nodeId: "6",
        status: "completed",
        progress: 100,
        result: "报告生成完成",
      })

      // 发送最终报告
      send({
        type: "report",
        report: {
          title: `${product}竞品分析报告`,
          summary: `基于AI分析生成的深度竞品报告，涵盖${competitors.length}个竞品的SWOT分析和功能对比。`,
          competitors: competitors.map((comp: any) => ({
            name: comp.name,
            strengths: (analysisData as any).swot?.strengths?.slice(0, 3) || [],
            weaknesses: (analysisData as any).swot?.weaknesses?.slice(0, 3) || [],
          })),
          swotAnalysis: (analysisData as any).swot || {
            strengths: [],
            weaknesses: [],
            opportunities: [],
            threats: [],
          },
          recommendations: (analysisData as any).insights || ["持续优化产品功能", "加强市场推广", "关注竞品动态"],
          markdownContent: markdownReport || `# ${product}竞品分析报告\n\n报告生成失败，请重试。`,
        },
      })

      close()
    } catch (err: any) {
      console.error("Analysis workflow error:", err)
      error(err)
    }
  })()

  // 返回SSE流响应
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}