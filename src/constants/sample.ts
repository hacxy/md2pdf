export const SAMPLE_MARKDOWN = `# md2pdf 示例文档

欢迎使用 **md2pdf**！这是一个在线 Markdown 转 PDF 工具，支持多种主题切换。

## 基础语法

这是一段普通文本，包含 **粗体**、*斜体* 和 ~~删除线~~。还有 [超链接](https://github.com) 和行内代码 \`console.log("hello")\`。

### 无序列表

- 支持 GFM 标准语法
- 多种内置主题可选
- 一键导出 PDF
- 纯前端运行，隐私安全

### 有序列表

1. 选择或粘贴 Markdown 内容
2. 在右侧实时预览效果
3. 选择喜欢的主题风格
4. 点击导出按钮生成 PDF

### 任务列表

- [x] Markdown 渲染
- [x] 代码语法高亮
- [x] 多主题切换
- [x] PDF 导出
- [ ] 数学公式支持 (Coming Soon)

## 代码高亮

支持多种编程语言的语法高亮：

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
\`\`\`

\`\`\`python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)
\`\`\`

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

async function fetchUser(id: number): Promise<User> {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
}
\`\`\`

## 表格

| 功能 | 状态 | 说明 |
|------|:----:|------|
| GFM 语法 | ✅ | 完整支持 GitHub Flavored Markdown |
| 代码高亮 | ✅ | 支持 20+ 种编程语言 |
| 主题切换 | ✅ | 5 种精心设计的内置主题 |
| PDF 导出 | ✅ | 支持 A4 / Letter / A3 页面 |
| 文件上传 | ✅ | 支持 .md / .txt 文件 |

## 图片

![示例图片](/sample.png)

> 点击图片可缩放，图片上方会出现左/右浮动按钮。工具栏最右侧的 ✕ 按钮可取消浮动。

## 引用

> 简单是终极的复杂。
>
> — 达·芬奇

## 分割线

---

*试试切换上方的主题，看看不同风格的渲染效果吧！*
`
