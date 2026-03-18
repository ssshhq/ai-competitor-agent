import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
})

const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat"

export type Message = {
  role: "system" | "user" | "assistant"
  content: string
}

export async function callDeepSeek(messages: Message[]) {
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    })

    return completion.choices[0]?.message?.content || ""
  } catch (error) {
    console.error("DeepSeek API error:", error)
    throw error
  }
}

export async function streamDeepSeek(messages: Message[]) {
  try {
    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 4000,
      stream: true,
    })

    return stream
  } catch (error) {
    console.error("DeepSeek streaming error:", error)
    throw error
  }
}

// 使用自定义配置调用DeepSeek
export async function callDeepSeekWithConfig(messages: Message[], apiKey?: string, model?: string, baseURL?: string) {
  try {
    // 使用自定义配置或默认配置
    const client = new OpenAI({
      apiKey: apiKey || process.env.DEEPSEEK_API_KEY,
      baseURL: baseURL || process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
    })

    const completion = await client.chat.completions.create({
      model: model || process.env.DEEPSEEK_MODEL || "deepseek-chat",
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    })

    return completion.choices[0]?.message?.content || ""
  } catch (error) {
    console.error("DeepSeek API error (custom config):", error)
    throw error
  }
}

// 使用限制检查（简单的内存缓存，生产环境应使用Redis或数据库）
const usageCache = new Map<string, { count: number; lastReset: number }>()
const FREE_LIMIT = 1 // 每天免费次数
const RESET_INTERVAL = 24 * 60 * 60 * 1000 // 24小时

export function checkUsageLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const userUsage = usageCache.get(identifier)

  if (!userUsage) {
    usageCache.set(identifier, { count: 1, lastReset: now })
    return { allowed: true, remaining: FREE_LIMIT - 1 }
  }

  // 检查是否需要重置
  if (now - userUsage.lastReset > RESET_INTERVAL) {
    usageCache.set(identifier, { count: 1, lastReset: now })
    return { allowed: true, remaining: FREE_LIMIT - 1 }
  }

  // 检查是否超过限制
  if (userUsage.count >= FREE_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  // 增加计数
  userUsage.count++
  usageCache.set(identifier, userUsage)
  return { allowed: true, remaining: FREE_LIMIT - userUsage.count }
}

export function getUsageInfo(identifier: string): { count: number; lastReset: number; limit: number } {
  const userUsage = usageCache.get(identifier)
  if (!userUsage) {
    return { count: 0, lastReset: Date.now(), limit: FREE_LIMIT }
  }
  return {
    count: userUsage.count,
    lastReset: userUsage.lastReset,
    limit: FREE_LIMIT
  }
}

// 特定Agent的prompt模板
export const AGENT_PROMPTS = {
  researchPlanner: (product: string) => `你是一个专业的研究规划专家。请为产品"${product}"制定竞品分析研究计划。

请输出一个JSON数组，包含以下字段的搜索策略：
[
  {
    "query": "搜索查询语句",
    "type": "product_info | competitor_info | industry_trend",
    "priority": "high | medium | low",
    "description": "搜索目的描述"
  }
]

要求：
1. 至少包含6个搜索查询
2. 覆盖产品信息、直接竞品、间接竞品、市场趋势、用户评价等维度
3. 使用中文关键词进行搜索
4. 按优先级排序`,

  competitorIdentifier: (searchResults: string) => `你是一个专业的竞品识别专家。请分析以下搜索结果，识别出Top 3竞品。

搜索结果：
${searchResults}

请输出一个JSON对象：
{
  "competitors": [
    {
      "name": "竞品名称",
      "type": "direct | indirect | substitute",
      "confidence": "0-1之间的置信度",
      "reason": "识别理由"
    }
  ],
  "summary": "竞品识别总结"
}

要求：
1. 基于搜索结果中的信息进行识别
2. 优先选择直接竞品
3. 提供详细的识别理由`,

  deepAnalyzer: (product: string, competitors: any[], searchResults: string) => `你是一个专业的商业分析专家。请对产品"${product}"及其竞品进行深度分析。

竞品列表：
${JSON.stringify(competitors, null, 2)}

搜索结果：
${searchResults}

请输出一个JSON对象，包含以下分析：
{
  "swot": {
    "strengths": ["优势1", "优势2", ...],
    "weaknesses": ["劣势1", "劣势2", ...],
    "opportunities": ["机会1", "机会2", ...],
    "threats": ["威胁1", "威胁2", ...]
  },
  "competitive_analysis": {
    "feature_comparison": {
      "features": ["功能1", "功能2", ...],
      "comparison": {
        "${product}": ["支持情况"],
        "竞品1": ["支持情况"],
        ...
      }
    },
    "market_position": "市场地位分析",
    "differentiation": "差异化分析"
  },
  "insights": ["关键洞察1", "关键洞察2", ...]
}

要求：
1. 分析要具体、可操作
2. 基于搜索结果提供数据支持
3. 使用中文输出`,

  reportGenerator: (product: string, analysisData: any) => `你是一个专业的商业报告撰写专家。请根据以下分析数据，为产品"${product}"生成一份完整的竞品分析报告。

分析数据：
${JSON.stringify(analysisData, null, 2)}

请生成一份结构完整、内容详实的Markdown格式报告。报告应包含以下章节：

# ${product}竞品分析报告

## 执行摘要
- 分析目的和方法概述
- 主要发现和结论

## 产品概述
- 产品定位和价值主张
- 目标用户和市场

## 竞品识别
- Top 3竞品列表（表格形式）
- 竞品类型和识别依据

## 深度分析

### SWOT分析
**优势**
- 列表形式

**劣势**
- 列表形式

**机会**
- 列表形式

**威胁**
- 列表形式

### 功能对比
| 功能 | ${product} | 竞品1 | 竞品2 | 竞品3 |
|------|------------|-------|-------|-------|
| 功能1 | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ |
| ... | ... | ... | ... | ... |

### 市场定位分析
- 各产品市场定位描述
- 市场份额和用户群体分析

## 关键洞察
- 重要发现列表
- 趋势和模式总结

## 建议与策略
- 产品改进建议
- 市场进入策略
- 竞争应对策略

## 附录
- 研究方法说明
- 数据来源说明

要求：
1. 报告要专业、结构化
2. 使用中文撰写
3. 包含具体的例子和数据
4. 生成完整的Markdown，确保格式正确`
}