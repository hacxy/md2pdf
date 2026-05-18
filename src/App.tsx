import type { ExportMethod } from '@/hooks/usePdfExport'
import { useCallback, useRef } from 'react'
import { TiptapEditor } from '@/components/TiptapEditor'
import { Toolbar } from '@/components/Toolbar'
import { useTiptapEditor } from '@/hooks/useEditor'
import { usePdfExport } from '@/hooks/usePdfExport'
import { useTheme } from '@/hooks/useTheme'
import '@/themes'

export default function App() {
  const editor = useTiptapEditor()
  const { themeId, themeClass, switchTheme } = useTheme()
  const { pageSize, setPageSize, isExporting, exportPdf } = usePdfExport()
  const editorRef = useRef<HTMLDivElement>(null)

  const getFileName = useCallback(() => {
    if (!editor)
      return 'document.pdf'
    const json = editor.getJSON()
    const firstHeading = json.content?.find(
      (n: Record<string, unknown>) => n.type === 'heading',
    ) as Record<string, unknown> | undefined
    const headingContent = firstHeading?.content as Array<Record<string, unknown>> | undefined
    const title = (headingContent?.[0]?.text as string) || 'document'
    return `${title.replace(/[<>:"/\\|?*]/g, '_')}.pdf`
  }, [editor])

  const handleExport = useCallback((method: ExportMethod) => {
    exportPdf(method, getFileName(), editorRef.current)
  }, [exportPdf, getFileName])

  const handleExportMarkdown = useCallback(() => {
    if (!editor)
      return
    const md = (editor.storage as Record<string, any>).markdown.getMarkdown() as string
    const name = getFileName().replace(/\.pdf$/, '.md')
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }, [editor, getFileName])

  const hasContent = !!editor && !editor.isEmpty

  return (
    <div className="app">
      <Toolbar
        themeId={themeId}
        onThemeChange={switchTheme}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        onExport={handleExport}
        onExportMarkdown={handleExportMarkdown}
        isExporting={isExporting}
        hasContent={hasContent}
      />
      <TiptapEditor
        editor={editor}
        themeClass={themeClass}
        editorRef={editorRef}
      />
    </div>
  )
}
