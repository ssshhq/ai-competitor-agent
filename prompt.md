帮我创建一个Next.js全栈项目「竞品分析AI Agent」，要求：

技术栈：Next.js 14 App Router + TypeScript + Tailwind CSS

功能：
用户输入一个产品/公司名称，系统自动执行多步骤Agent工作流：
1. 研究规划Agent：分解搜索策略
2. 并行信息搜索：调用Tavily API搜索产品信息、竞品信息、行业趋势
3. 竞品识别Agent：从搜索结果中识别Top3竞品
4. 迭代搜索：对每个竞品进一步搜索详情
5. 深度分析Agent：SWOT分析、功能对比
6. 报告生成Agent：生成完整Markdown报告

核心要求：
- 后端用 Route Handler (app/api/) 实现工作流，调用DeepSeek API和Tavily API
- 使用SSE（Server-Sent Events）流式返回每个Agent节点的执行状态和结果
- 前端实时展示每个Agent节点的执行进度（节点依次亮起、展示中间结果）
- 最终报告用Markdown渲染
- 科技感深色主题UI

API信息：
- DeepSeek：base_url=https://api.deepseek.com/v1, model=deepseek-chat
- Tavily：https://api.tavily.com/search

先帮我初始化项目并安装依赖。