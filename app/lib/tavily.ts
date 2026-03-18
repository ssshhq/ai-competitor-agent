import axios from "axios"

const TAVILY_API_KEY = process.env.TAVILY_API_KEY
const TAVILY_API_URL = "https://api.tavily.com/search"

export type SearchResult = {
  title: string
  url: string
  content: string
  score: number
  raw_content?: string
}

export type SearchResponse = {
  query: string
  results: SearchResult[]
  answer?: string
  images?: string[]
}

export async function searchTavily(query: string, maxResults: number = 10): Promise<SearchResponse> {
  if (!TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY is not configured")
  }

  try {
    const response = await axios.post(
      TAVILY_API_URL,
      {
        api_key: TAVILY_API_KEY,
        query,
        search_depth: "advanced",
        include_answer: true,
        include_images: false,
        include_raw_content: true,
        max_results: maxResults,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    return response.data
  } catch (error) {
    console.error("Tavily API error:", error)
    throw error
  }
}

export async function parallelSearch(queries: string[], maxResults: number = 5): Promise<Record<string, SearchResponse>> {
  const promises = queries.map(query =>
    searchTavily(query, maxResults).catch(error => {
      console.error(`Search failed for query "${query}":`, error)
      return {
        query,
        results: [],
        answer: "",
      } as SearchResponse
    })
  )

  const results = await Promise.all(promises)
  const resultMap: Record<string, SearchResponse> = {}

  queries.forEach((query, index) => {
    resultMap[query] = results[index]
  })

  return resultMap
}

export function formatSearchResults(results: SearchResult[]): string {
  return results.map((result, index) => `
[${index + 1}] ${result.title}
URL: ${result.url}
内容: ${result.content.slice(0, 500)}${result.content.length > 500 ? "..." : ""}
相关度: ${result.score.toFixed(2)}
  `).join("\n---\n")
}

export function combineAllResults(responses: Record<string, SearchResponse>): string {
  let combined = ""

  for (const [query, response] of Object.entries(responses)) {
    combined += `\n\n## 搜索查询: "${query}"\n`
    if (response.answer) {
      combined += `AI总结: ${response.answer}\n`
    }
    combined += `找到 ${response.results.length} 个结果:\n`
    combined += formatSearchResults(response.results)
  }

  return combined
}