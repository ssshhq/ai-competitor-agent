export type AgentNode = {
  id: string
  name: string
  description: string
  status: "pending" | "running" | "completed" | "error"
  result?: string
  progress?: number
}

export type AnalysisReport = {
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

export type SSEEvent =
  | {
      type: "node_update"
      nodeId: string
      status: AgentNode["status"]
      result?: string
      progress?: number
    }
  | {
      type: "report"
      report: AnalysisReport
    }
  | {
      type: "error"
      error: string
    }

export type SearchQuery = {
  query: string
  type: "product_info" | "competitor_info" | "industry_trend"
  priority: "high" | "medium" | "low"
  description: string
}

export type Competitor = {
  name: string
  type: "direct" | "indirect" | "substitute"
  confidence: number
  reason: string
}

export type SWOTAnalysis = {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
}

export type FeatureComparison = {
  features: string[]
  comparison: Record<string, string[]>
}

export type CompetitiveAnalysis = {
  feature_comparison: FeatureComparison
  market_position: string
  differentiation: string
}

export type DeepAnalysis = {
  swot: SWOTAnalysis
  competitive_analysis: CompetitiveAnalysis
  insights: string[]
}