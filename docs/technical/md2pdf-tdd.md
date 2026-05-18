# md2pdf — 技术设计文档（TDD）

## 概述

md2pdf 是一个纯前端 Web 应用，使用 TypeScript + React 构建，核心链路为：Markdown 文本 → markdown-it 解析为 HTML → highlight.js 语法高亮 → CSS 主题渲染 → 浏览器 Print API 生成 PDF。整个应用部署为静态站点，无后端依赖。

## 背景

### 需求来源

参见 [PRD](../requirements/md2pdf-prd.md)。核心诉求是提供一个免费、无需安装的浏览器端 Markdown → PDF 转换工具，支持多主题切换。

### 技术选型理由

| 决策 | 选择 | 理由 |
|------|------|------|
| 前端框架 | React + TypeScript | 社区生态成熟，组件化开发效率高，TypeScript 保证类型安全 |
| 构建工具 | Vite | 开发服务器启动快，HMR 体验好，生产构建基于 Rollup 输出优化 |
| Markdown 解析 | markdown-it | 插件体系丰富，GFM 支持完善，性能优秀 |
| 语法高亮 | highlight.js | 语言覆盖广（180+），主题丰富，支持按需加载 |
| PDF 生成 | 浏览器 Print API + html2pdf.js 降级 | Print API 质量最高且零依赖；html2pdf.js 作为兼容性降级方案 |
| 样式方案 | CSS Modules + CSS Variables | 主题切换通过 CSS Variables 实现，零 JS 开销，切换无闪烁 |

## 目标

- 首次加载体积 < 300KB（gzip），确保 3G 网络 < 3s 可交互
- 10KB Markdown 内容渲染延迟 < 200ms
- PDF 导出延迟 < 3s（含 Print API 调用）
- 代码语法高亮支持 15+ 主流语言

## 非目标

- 不实现 Markdown 扩展语法（数学公式、Mermaid），留作后续迭代
- 不实现服务端渲染（SSR），纯 CSR 即可
- 不实现 PWA 离线功能

## 系统架构

```
┌─────────────────────────────────────────────────────┐
│                    Browser (SPA)                     │
│                                                      │
│  ┌──────────┐    ┌──────────────┐    ┌────────────┐ │
│  │  Editor   │───▶│ Markdown     │───▶│  Preview   │ │
│  │  Panel    │    │ Engine       │    │  Panel     │ │
│  │          │    │              │    │            │ │
│  │ - Input  │    │ - markdown-it│    │ - Themed   │ │
│  │ - Upload │    │ - highlight  │    │   HTML     │ │
│  │ - DnD    │    │ - sanitize   │    │ - Live     │ │
│  └──────────┘    └──────────────┘    └─────┬──────┘ │
│                                            │        │
│  ┌──────────┐    ┌──────────────┐          │        │
│  │  Theme   │───▶│ CSS Variable │──────────┘        │
│  │  Selector│    │ Engine       │                    │
│  └──────────┘    └──────────────┘                    │
│                                                      │
│  ┌──────────────────────────────────────┐            │
│  │  PDF Export Engine                    │            │
│  │  - Primary: window.print() + @media  │            │
│  │  - Fallback: html2pdf.js             │            │
│  └──────────────────────────────────────┘            │
└─────────────────────────────────────────────────────┘
```

## 详细设计

### 模块划分

| 模块 | 职责 | 核心文件 |
|------|------|----------|
| EditorPanel | Markdown 文本输入、文件上传、拖拽处理 | `src/components/EditorPanel/` |
| MarkdownEngine | Markdown 解析、语法高亮、HTML 生成 | `src/core/markdown-engine.ts` |
| PreviewPanel | 渲染后的 HTML 展示、主题样式应用 | `src/components/PreviewPanel/` |
| ThemeEngine | 主题定义、CSS 变量注入、主题切换 | `src/core/theme-engine.ts` |
| PdfExporter | PDF 生成与下载、分页控制 | `src/core/pdf-exporter.ts` |
| Toolbar | 主题选择器、导出按钮、页面设置 | `src/components/Toolbar/` |
| Layout | 分栏布局、拖拽调整、响应式适配 | `src/components/Layout/` |

### 项目结构

```
md2pdf/
├── public/
│   └── sample.md              # 默认示例 Markdown
├── src/
│   ├── main.tsx               # 应用入口
│   ├── App.tsx                # 根组件
│   ├── components/
│   │   ├── EditorPanel/
│   │   │   ├── EditorPanel.tsx
│   │   │   ├── EditorPanel.module.css
│   │   │   └── FileUploader.tsx
│   │   ├── PreviewPanel/
│   │   │   ├── PreviewPanel.tsx
│   │   │   └── PreviewPanel.module.css
│   │   ├── Toolbar/
│   │   │   ├── Toolbar.tsx
│   │   │   ├── ThemeSelector.tsx
│   │   │   └── ExportButton.tsx
│   │   └── Layout/
│   │       ├── SplitLayout.tsx
│   │       └── SplitLayout.module.css
│   ├── core/
│   │   ├── markdown-engine.ts
│   │   ├── theme-engine.ts
│   │   └── pdf-exporter.ts
│   ├── themes/
│   │   ├── index.ts           # 主题注册表
│   │   ├── github.css
│   │   ├── academic.css
│   │   ├── minimal.css
│   │   ├── business.css
│   │   └── dark.css
│   ├── hooks/
│   │   ├── useMarkdown.ts
│   │   ├── useTheme.ts
│   │   └── usePdfExport.ts
│   └── types/
│       └── index.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 核心模块设计

#### 1. MarkdownEngine（`src/core/markdown-engine.ts`）

```typescript
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

interface RenderOptions {
  html?: boolean;
  linkify?: boolean;
  typographer?: boolean;
}

interface RenderResult {
  html: string;
  title: string | null;  // 提取第一个 h1 作为文件名
}

const defaultOptions: RenderOptions = {
  html: false,      // 安全：禁止原始 HTML 输入
  linkify: true,
  typographer: true,
};

function createEngine(options?: RenderOptions): MarkdownIt {
  const md = new MarkdownIt({
    ...defaultOptions,
    ...options,
    highlight(str: string, lang: string): string {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(str, { language: lang }).value;
      }
      return '';  // 无语言标记时不高亮
    },
  });

  // 启用 GFM 扩展
  md.enable(['table', 'strikethrough']);

  return md;
}

function render(markdown: string, engine: MarkdownIt): RenderResult {
  const html = engine.render(markdown);
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  return {
    html,
    title: titleMatch ? titleMatch[1].trim() : null,
  };
}
```

**安全策略**：`html: false` 防止 XSS 攻击——用户输入的原始 HTML 标签不会被渲染。

#### 2. ThemeEngine（`src/core/theme-engine.ts`）

每个主题是一个独立的 CSS 文件，通过 CSS 自定义属性（CSS Variables）定义排版参数：

```typescript
interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  cssPath: string;
  codeTheme: string;  // highlight.js 主题名
}

const themes: ThemeConfig[] = [
  {
    id: 'github',
    name: 'GitHub',
    description: '模拟 GitHub 的 Markdown 渲染风格',
    cssPath: '/themes/github.css',
    codeTheme: 'github',
  },
  {
    id: 'academic',
    name: '学术',
    description: '类 LaTeX 衬线字体风格',
    cssPath: '/themes/academic.css',
    codeTheme: 'default',
  },
  // ...
];
```

**主题 CSS 结构示例**（`themes/github.css`）：

```css
.theme-github {
  --md-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  --md-font-size: 16px;
  --md-line-height: 1.6;
  --md-color-text: #24292e;
  --md-color-bg: #ffffff;
  --md-color-heading: #24292e;
  --md-color-link: #0366d6;
  --md-color-code-bg: #f6f8fa;
  --md-color-blockquote-border: #dfe2e5;
  --md-color-table-border: #dfe2e5;
  --md-heading-font-weight: 600;
  --md-code-font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  --md-code-font-size: 85%;
  --md-page-padding: 40px;
}
```

**切换机制**：通过在预览容器上切换 CSS class（如 `.theme-github` → `.theme-academic`），CSS Variables 级联生效，无需重新渲染 HTML。

#### 3. PdfExporter（`src/core/pdf-exporter.ts`）

```typescript
type PageSize = 'A4' | 'Letter' | 'A3';

interface ExportOptions {
  pageSize: PageSize;
  fileName: string;
}

const PAGE_SIZES: Record<PageSize, string> = {
  A4: '210mm 297mm',
  Letter: '8.5in 11in',
  A3: '297mm 420mm',
};

async function exportPdf(options: ExportOptions): Promise<void> {
  // 方案一：浏览器 Print API（首选）
  // 动态注入 @page CSS 规则设置页面尺寸
  const styleEl = injectPrintStyles(options.pageSize);

  try {
    window.print();
  } finally {
    styleEl.remove();
  }
}

function injectPrintStyles(pageSize: PageSize): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      @page {
        size: ${PAGE_SIZES[pageSize]};
        margin: 20mm;
      }
      body > *:not(.preview-panel) {
        display: none !important;
      }
      .preview-panel {
        width: 100% !important;
        position: static !important;
        overflow: visible !important;
      }
      /* 分页控制 */
      h1, h2, h3, h4, h5, h6 {
        break-after: avoid;
      }
      pre, table, img {
        break-inside: avoid;
      }
      /* 链接显示 URL */
      a[href^="http"]::after {
        content: " (" attr(href) ")";
        font-size: 0.85em;
        color: #666;
      }
    }
  `;
  document.head.appendChild(style);
  return style;
}
```

**降级方案**：当检测到浏览器 Print API 不可用或用户偏好直接下载时，使用 html2pdf.js：

```typescript
async function exportPdfFallback(
  element: HTMLElement,
  options: ExportOptions
): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default;
  await html2pdf()
    .set({
      margin: 20,
      filename: options.fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: options.pageSize.toLowerCase() },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    })
    .from(element)
    .save();
}
```

### 数据流

```
用户输入 Markdown
       │
       ▼
  ┌─────────────┐     防抖 300ms
  │ EditorPanel  │────────────────┐
  └─────────────┘                │
                                  ▼
                          ┌──────────────┐
                          │ MarkdownEngine│
                          │              │
                          │ markdown-it  │
                          │ + hljs       │
                          └──────┬───────┘
                                 │ HTML string + title
                                 ▼
  ┌──────────┐          ┌──────────────┐
  │  Theme   │─────────▶│ PreviewPanel │
  │  Engine  │ CSS vars │              │
  └──────────┘          └──────┬───────┘
                               │ 用户点击导出
                               ▼
                        ┌──────────────┐
                        │ PdfExporter  │
                        │              │
                        │ window.print │
                        │ or html2pdf  │
                        └──────┬───────┘
                               │
                               ▼
                         PDF 文件下载
```

### 状态管理

应用状态简单，使用 React 内置 hooks（useState + useContext）即可，无需引入 Redux/Zustand 等外部状态管理库。

```typescript
interface AppState {
  markdown: string;      // 当前 Markdown 文本
  themeId: string;       // 当前主题 ID
  pageSize: PageSize;    // PDF 页面尺寸
  isExporting: boolean;  // 导出中状态
  uiMode: 'light' | 'dark';  // 界面模式
}
```

通过 `AppContext` 共享状态，各组件通过自定义 hooks 访问：

```typescript
// useMarkdown.ts — 封装 Markdown 输入和渲染逻辑
function useMarkdown() {
  const [markdown, setMarkdown] = useState(DEFAULT_SAMPLE);
  const [rendered, setRendered] = useState<RenderResult>({ html: '', title: null });

  useEffect(() => {
    const timer = setTimeout(() => {
      setRendered(render(markdown, engine));
    }, 300);  // 防抖
    return () => clearTimeout(timer);
  }, [markdown]);

  return { markdown, setMarkdown, rendered };
}
```

## 主题系统设计

### CSS 结构

```
themes/
├── base.css          # 基础排版规则（使用 CSS Variables）
├── github.css        # GitHub 主题变量
├── academic.css      # 学术主题变量
├── minimal.css       # 简约主题变量
├── business.css      # 商务主题变量
├── dark.css          # 暗夜主题变量
└── print.css         # 打印专用样式
```

**base.css** 定义所有排版规则，引用 CSS Variables：

```css
.markdown-body {
  font-family: var(--md-font-family);
  font-size: var(--md-font-size);
  line-height: var(--md-line-height);
  color: var(--md-color-text);
  background: var(--md-color-bg);
  max-width: var(--md-max-width, 800px);
  margin: 0 auto;
  padding: var(--md-page-padding);
}

.markdown-body h1 {
  font-size: 2em;
  font-weight: var(--md-heading-font-weight);
  color: var(--md-color-heading);
  border-bottom: 1px solid var(--md-color-table-border);
  padding-bottom: 0.3em;
}

.markdown-body pre {
  background: var(--md-color-code-bg);
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  font-family: var(--md-code-font-family);
  font-size: var(--md-code-font-size);
}

/* ... 其他元素样式 */
```

各主题文件只需定义变量值，覆盖默认值即可。

### Print CSS 设计要点

```css
@media print {
  @page {
    margin: 20mm 25mm;
  }

  /* 中文字体栈 */
  .markdown-body {
    font-family: var(--md-font-family),
      'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei',
      'WenQuanYi Micro Hei', sans-serif;
  }

  /* 分页控制 */
  h1, h2, h3, h4, h5, h6 {
    break-after: avoid;
    page-break-after: avoid;  /* 兼容旧浏览器 */
  }

  pre, code, table, figure, img {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* 长代码块允许跨页但保持可读性 */
  pre {
    max-height: none;
    overflow: visible;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  /* 隐藏非内容元素 */
  .editor-panel, .toolbar, .split-handle {
    display: none !important;
  }
}
```

## 性能优化

| 优化项 | 策略 |
|--------|------|
| 首次加载体积 | highlight.js 按需加载语言包，仅打包常用 15 种语言 |
| 渲染性能 | 输入防抖 300ms；markdown-it 解析结果缓存（内容未变时跳过渲染） |
| 主题切换 | 纯 CSS Variables 切换，不触发 JS 重渲染 |
| 代码分割 | html2pdf.js 作为降级方案动态导入（`import()`），不计入首屏体积 |
| 字体加载 | 系统字体优先，避免加载 Web 字体延迟 |

### highlight.js 按需加载

```typescript
// 仅注册常用语言，减少打包体积
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import rust from 'highlight.js/lib/languages/rust';
import html from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import diff from 'highlight.js/lib/languages/diff';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
// ... 其他语言注册
```

## 安全考量

| 威胁 | 防护措施 |
|------|----------|
| XSS 攻击（通过 Markdown 注入恶意脚本） | `markdown-it` 配置 `html: false` 禁止原始 HTML 渲染 |
| 外部图片追踪 | 仅在用户主动输入时加载外部图片，不自动预取 |
| 数据泄漏 | 纯前端应用，不发送任何数据到服务器 |

## 测试策略

| 测试类型 | 覆盖目标 | 工具 |
|----------|----------|------|
| 单元测试 | MarkdownEngine（解析、高亮、标题提取）、ThemeEngine（主题切换） | Vitest |
| 组件测试 | EditorPanel（输入、上传、拖拽）、PreviewPanel（渲染输出）、Toolbar（交互） | Vitest + React Testing Library |
| E2E 测试 | 完整用户流程：输入 → 预览 → 切换主题 → 导出 | Playwright |
| 视觉回归 | 各主题渲染截图对比 | Playwright screenshot |

### 关键测试用例

- 空输入时导出按钮禁用
- 包含 XSS payload 的 Markdown 输入不执行脚本
- 每种内置主题渲染相同 Markdown 后视觉效果符合预期
- 超长代码块在 PDF 中正确分页
- 上传非 Markdown 文件时显示错误提示
- 中英文混排在各主题下排版正常

## 备选方案对比

| 方案 | 优点 | 缺点 | 为何未选 |
|------|------|------|----------|
| **Puppeteer 后端渲染** | PDF 质量最高，完全可控 | 需要 Node.js 后端和无头浏览器，运维复杂，有数据上传隐私顾虑 | 用户明确要求纯前端，无后端 |
| **jsPDF 直接生成** | 纯前端，不依赖浏览器 Print | 对复杂 HTML 排版支持差，中文处理困难，需要嵌入字体文件导致体积大 | 排版质量无法满足要求 |
| **wkhtmltopdf (WASM)** | 渲染引擎成熟 | WASM 体积大（>10MB），加载慢，浏览器兼容性问题 | 首次加载体验差 |
| **react-pdf** | React 生态内，声明式 API | 需要手动定义 PDF 布局，无法直接从 HTML 转换 | 开发工作量大，不适合 Markdown 场景 |

## 部署方案

纯静态站点，推荐部署选项：

- **Vercel / Netlify**：零配置部署，自动 HTTPS，全球 CDN
- **GitHub Pages**：免费托管，适合开源项目
- **自有 VPS + Nginx**：完全可控

构建命令：`vite build`，输出 `dist/` 目录，直接部署即可。

## 开放问题与决策

| 问题 | 决策 | 理由 |
|------|------|------|
| 是否使用 Monaco Editor 替代纯文本框 | 暂不使用 | Monaco 体积大（~5MB），且产品定位不是编辑器，简单 textarea 足够 |
| 是否支持暗色主题代码高亮 | 是 | 暗夜主题需要配套的暗色代码高亮，使用 highlight.js 对应主题 |
| 是否支持页眉页脚 | 后续迭代 | Print API 对页眉页脚控制有限，可在后续版本中通过 CSS `@page` margin boxes 实现 |
