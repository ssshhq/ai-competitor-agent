# 🔍 竞品分析AI Agent - 智能竞品分析

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

一个基于AI Agent的竞品分析工具，通过多步骤工作流自动执行竞品识别、深度分析和报告生成，专为产品经理、创业者和市场分析师设计。

**🚀 立即开始你的智能竞品分析之旅！**

输入你的产品名称，让AI Agent为你完成复杂的竞品分析工作，快速获得专业洞察和战略建议。

## ✨ 在线体验

🔗 **[点击访问](https://ai-competitor-agent.vercel.app)**


## 📸 产品截图
![竞品分析-加key](https://github.com/user-attachments/assets/b103a76d-30fc-4eea-9c96-3d6d4825a2c6)

![竞品分析-测试图](https://github.com/user-attachments/assets/b86e3bda-c5ef-4088-ae2d-bde074253f7f)


## 🌟 核心功能

### 🤖 六步AI Agent工作流
- **研究规划Agent** - 智能分解搜索策略，制定研究计划
- **并行信息搜索** - 调用Tavily API并行搜索产品、竞品、行业信息
- **竞品识别Agent** - 从搜索结果中智能识别Top 3竞品
- **迭代搜索Agent** - 对每个竞品进行深度详情搜索
- **深度分析Agent** - 执行SWOT分析和功能对比
- **报告生成Agent** - 生成完整Markdown格式分析报告

### 🚀 实时交互体验
- **SSE实时流** - 服务器端事件实时推送分析进度
- **可视化工作流** - 直观展示每个Agent的执行状态和进度
- **实时输出面板** - 显示当前步骤的详细输出内容
- **进度追踪** - 每个步骤的百分比进度和状态指示

### 📊 专业报告生成
- **结构化Markdown报告** - 包含执行摘要、SWOT分析、功能对比等完整章节
- **一键复制/下载** - 支持复制到剪贴板或下载为Markdown文件
- **表格和可视化** - 自动生成功能对比表格和格式化内容

### ⚙️ 灵活的API配置
- **自定义API支持** - 可配置自己的API Key和模型
- **免费额度限制** - 内置使用频率限制（每天1次免费分析）
- **多用户隔离** - 基于IP地址和API Key的用户标识系统

## 🛠️ 技术栈

### 前端
- **Next.js 14** - React全栈框架，App Router架构
- **React 19** - 最新React版本，使用Hooks和状态管理
- **TypeScript** - 类型安全的JavaScript超集
- **Tailwind CSS 4** - 原子化CSS框架，暗黑主题设计
- **Lucide React** - 现代化图标库

### 后端
- **Next.js API Routes** - 服务端API端点
- **Server-Sent Events (SSE)** - 实时数据流传输
- **DeepSeek API** - 国产优秀大模型API，支持deepseek-chat等模型
- **Tavily Search API** - 专为AI优化的搜索API

### 工具与库
- **OpenAI SDK** - DeepSeek API客户端（兼容OpenAI格式）
- **React Markdown** - Markdown渲染组件
- **Zustand** - 轻量级状态管理（备用）
- **Axios** - HTTP客户端库

## 📁 项目结构

```
ai-competitor-agent/
├── app/                          # Next.js App Router
│   ├── api/analyze/route.ts      # 竞品分析API端点（SSE流）
│   ├── lib/                      # 工具函数和配置
│   │   ├── deepseek.ts           # DeepSeek API封装和提示词模板
│   │   └── tavily.ts             # Tavily搜索API封装
│   ├── page.tsx                  # 主页面组件（工作流UI）
│   ├── globals.css               # 全局Tailwind样式
│   └── layout.tsx                # 根布局
├── public/                       # 静态资源
├── .env.example                  # 环境变量示例
├── .env.local                    # 本地环境变量（不提交到Git）
├── package.json                  # 依赖包配置
├── tailwind.config.ts            # Tailwind配置
├── tsconfig.json                 # TypeScript配置
└── README.md                     # 项目说明文档
```

## 🚀 快速开始

打开 [在线地址] (https://ai-competitor-agent.vercel.app)

### 环境要求
- **Node.js** 18+ 或更高版本
- **npm**、**yarn** 或 **pnpm** 包管理器
- **DeepSeek API Key**（[申请地址](https://platform.deepseek.com/api_keys)）,或其它模型
- **Tavily API Key**（[申请地址](https://app.tavily.com/)）

### 1. 克隆项目
```bash
git clone https://github.com/your-username/ai-competitor-agent.git
cd ai-competitor-agent
```

### 2. 安装依赖
```bash
npm install
# 或
yarn install
# 或
pnpm install
# 或
bun install
```

### 3. 配置环境变量
复制 `.env.example` 为 `.env.local` 并填写你的API密钥：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：
```env
# DeepSeek API配置或其它模型
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

# Tavily搜索API配置
TAVILY_API_KEY=your_tavily_api_key_here

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. 启动开发服务器
```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
# 或
bun dev
```

应用将在 [http://localhost:3001](http://localhost:3001) 启动。

### 5. 开始分析
1. 在输入框中输入产品/公司名称（如：ChatGPT, Notion, Figma）
2. 点击"开始分析"按钮
3. 观察6步AI Agent工作流的实时执行进度
4. 查看最终生成的竞品分析报告
5. 复制或下载Markdown报告

## 🔧 配置说明

### API密钥配置
- **免费使用**：无需配置，每天有1次免费分析额度（基于IP限制）
- **自定义配置**：点击"使用自己的Model和API Key"展开设置面板
  - 输入 API Key
  - 输入Model名称
  - 支持任意兼容OpenAI API格式的模型

### 部署配置
#### Vercel部署（推荐）
1. 将项目推送到GitHub仓库
2. 在Vercel中导入项目
3. 配置环境变量：
   - `DEEPSEEK_API_KEY`
   - `TAVILY_API_KEY`
   - `DEEPSEEK_MODEL`（可选）
   - `DEEPSEEK_BASE_URL`（可选）
4. 部署完成

#### 本地生产构建
```bash
npm run build
npm start
```

### 自定义模型
支持任何兼容OpenAI API格式的模型：
- **DeepSeek系列**：deepseek-chat, deepseek-coder
- **OpenAI系列**：gpt-4-turbo, gpt-3.5-turbo（需修改base_url）
- **其他兼容API**：本地部署的Ollama、LM Studio等

## 📈 使用示例

### 分析ChatGPT竞品
1. 输入"ChatGPT"并点击开始分析
2. 观察工作流执行：
   - 步骤1：研究规划Agent制定搜索策略
   - 步骤2：并行搜索ChatGPT相关信息
   - 步骤3：识别竞品（如Claude、Gemini、文心一言）
   - 步骤4：深度搜索每个竞品详情
   - 步骤5：执行SWOT分析和功能对比
   - 步骤6：生成完整分析报告
3. 查看包含以下内容的报告：
   - 执行摘要和主要发现
   - Top 3竞品识别表格
   - ChatGPT的SWOT分析
   - 功能对比矩阵
   - 市场定位分析
   - 战略建议

### 报告示例片段
```markdown
# ChatGPT竞品分析报告

## 执行摘要
- **分析目的**：识别ChatGPT的主要竞品，分析市场竞争格局
- **主要发现**：发现3个直接竞品，AI助手市场竞争激烈
- **结论**：ChatGPT在功能完整性上领先，但面临多维度竞争

## 竞品识别
| 竞品名称 | 类型 | 置信度 | 识别理由 |
|----------|------|--------|----------|
| Claude | 直接竞品 | 0.9 | 同为通用AI助手，功能高度重叠 |
| Gemini | 直接竞品 | 0.85 | Google推出的竞品，技术实力强 |
| 文心一言 | 直接竞品 | 0.8 | 百度中文AI助手，本土化优势 |

## SWOT分析
**优势**
- 先发优势和品牌认知度高
- 强大的GPT-4技术基础
- 丰富的插件生态系统
...
```

## 🧩 技术实现细节

### SSE实时流架构
```typescript
// 创建SSE流
function createSSEStream() {
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const send = (data: any) => {
    const message = `data: ${JSON.stringify(data)}\n\n`
    writer.write(encoder.encode(message))
  }
  // ... 返回send、close、error方法和stream
}

// API路由中使用
export async function GET(request: NextRequest) {
  const { send, close, error, stream } = createSSEStream()

  // 异步执行分析流程
  ;(async () => {
    try {
      // 步骤1: 研究规划Agent
      send({ type: "node_update", nodeId: "1", status: "running" })
      // ... 执行每个步骤
      send({ type: "report", report: { ... } })
      close()
    } catch (err) {
      error(err)
    }
  })()

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" }
  })
}
```

### AI Agent提示词工程
每个Agent都有专门的提示词模板：

```typescript
export const AGENT_PROMPTS = {
  researchPlanner: (product: string) => `你是一个专业的研究规划专家。请为产品"${product}"制定竞品分析研究计划。
请输出一个JSON数组，包含以下字段的搜索策略...`,

  competitorIdentifier: (searchResults: string) => `你是一个专业的竞品识别专家。请分析以下搜索结果，识别出Top 3竞品...`,

  deepAnalyzer: (product: string, competitors: any[], searchResults: string) => `你是一个专业的商业分析专家...`,

  reportGenerator: (product: string, analysisData: any) => `你是一个专业的商业报告撰写专家...`
}
```

### 并行搜索优化
```typescript
// 并行执行多个搜索查询
export async function parallelSearch(queries: string[], maxResults: number = 5) {
  const searchPromises = queries.map(query =>
    tavilySearch(query, maxResults).catch(err => {
      console.error(`搜索失败: ${query}`, err)
      return { query, results: [] }
    })
  )

  return await Promise.all(searchPromises)
}
```

## 🔒 使用限制与安全性

### 免费额度管理
- **限制机制**：每个IP地址每天1次免费分析
- **缓存实现**：内存缓存记录用户使用情况（生产环境建议使用Redis）
- **重置时间**：24小时自动重置计数器

### 自定义API安全
- **临时使用**：用户输入的API Key仅用于当前请求，不会被存储
- **请求头传递**：通过`x-api-key`和`x-model`请求头传递自定义配置
- **标识隔离**：使用API Key前8位作为用户标识，避免冲突

### 错误处理
- **网络错误**：自动重试和优雅降级
- **API限制**：清晰的错误提示和解决方案建议
- **数据解析**：JSON解析失败时使用备用数据

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 开发流程
1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

### 开发注意事项
- 使用TypeScript确保类型安全
- 遵循现有的代码风格和目录结构
- 添加必要的注释和文档
- 更新相关测试（如有）

### 待实现功能
- [ ] 用户认证和持久化存储
- [ ] 报告模板自定义
- [ ] 更多数据可视化图表
- [ ] 批量分析功能
- [ ] 导出为PDF/Word格式
- [ ] 多语言支持
- [ ] 移动端优化

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。


## 📞 支持与反馈

如有问题或建议，可在GitHub Discussions中讨论

---
