import type { Editor } from '@tiptap/react'
import { EditorContent } from '@tiptap/react'
import { useCallback, useEffect } from 'react'
import styles from './TiptapEditor.module.css'

interface TiptapEditorProps {
  editor: Editor | null
  themeClass: string
  editorRef: React.RefObject<HTMLDivElement | null>
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function injectResetButton(controller: HTMLElement, editor: Editor): void {
  if (controller.querySelector('[data-md2pdf-reset]'))
    return

  const btn = document.createElement('img')
  btn.dataset.md2pdfReset = ''
  btn.title = '取消浮动'
  btn.setAttribute('src', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAtOTYwIDk2MCA5NjAiPjxwYXRoIGQ9Ik0xNDQtMTQ0di03Mmg2NzJ2NzJIMTQ0Wm0xNDQtMTUwdi03MmgzODR2NzJIMjg4Wk0xNDQtNDQ0di03Mmg2NzJ2NzJIMTQ0Wm0xNDQtMTUwdi03MmgzODR2NzJIMjg4Wk0xNDQtNzQ0di03Mmg2NzJ2NzJIMTQ0WiIvPjwvc3ZnPg==')
  btn.setAttribute('style', `width: 24px; height: 24px; cursor: pointer;`)
  btn.addEventListener('mouseover', () => {
    btn.style.opacity = '0.6'
  })
  btn.addEventListener('mouseout', () => {
    btn.style.opacity = '1'
  })
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    const container = controller.parentElement
    const wrapper = container?.parentElement
    if (!container || !wrapper)
      return

    for (const el of [wrapper, container]) {
      el.style.float = ''
      el.style.paddingLeft = ''
      el.style.paddingRight = ''
    }
    container.style.margin = '0'

    const { state } = editor
    const { tr } = state
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'imageResize' || node.type.name === 'image') {
        const dom = editor.view.nodeDOM(pos)
        if (dom === wrapper || (dom instanceof Node && wrapper.contains(dom))) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            containerStyle: container.style.cssText,
            wrapperStyle: wrapper.style.cssText,
          })
        }
      }
    })
    editor.view.dispatch(tr)
  })

  controller.appendChild(btn)
}

function FormatBar({ editor }: { editor: Editor }) {
  const btn = (active: boolean) =>
    `${styles.fmtBtn} ${active ? styles.active : ''}`

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const dataUrl = await readFileAsDataURL(file)
      editor.chain().focus().setImage({ src: dataUrl }).run()
    }
    e.target.value = ''
  }

  const handleMdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const text = await file.text()
      editor.commands.setContent(text)
    }
    e.target.value = ''
  }

  return (
    <div className={styles.editorBar}>
      <div className={styles.formatBtns}>
        <button type="button" className={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} title="粗体 (⌘B)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h8a4 4 0 0 1 2.8 6.8A4.5 4.5 0 0 1 15.5 20H6V4zm3 7h5a1.5 1.5 0 0 0 0-3H9v3zm0 3v4h6.5a2 2 0 0 0 0-4H9z" /></svg>
        </button>
        <button type="button" className={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} title="斜体 (⌘I)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4h8l-.5 2h-2.7l-3.6 12h2.8l-.5 2H6l.5-2h2.7l3.6-12H10l.5-2z" /></svg>
        </button>
        <button type="button" className={btn(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()} title="删除线">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 12h18v1.5H3V12zm4.5-4.5c0-1.93 1.57-3.5 3.5-3.5h2c1.93 0 3.5 1.57 3.5 3.5 0 .53-.12 1.04-.34 1.5h-2.32A1.5 1.5 0 0 0 13 6h-2a1.5 1.5 0 0 0 0 3H7.5zm2 7c0 .53.12 1.04.34 1.5H13a1.5 1.5 0 0 0 0-3h2.5c.22.46.34.97.34 1.5 0 1.93-1.57 3.5-3.5 3.5h-2c-1.93 0-3.5-1.57-3.5-3.5h2.16z" /></svg>
        </button>
        <button type="button" className={btn(editor.isActive('code'))} onClick={() => editor.chain().focus().toggleCode().run()} title="行内代码">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="16,18 22,12 16,6" />
            <polyline points="8,6 2,12 8,18" />
          </svg>
        </button>
        <span className={styles.sep} />
        <button type="button" className={btn(editor.isActive('heading', { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="标题 1">
          <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '-0.5px' }}>H1</span>
        </button>
        <button type="button" className={btn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="标题 2">
          <span style={{ fontSize: '13px', fontWeight: 700 }}>H2</span>
        </button>
        <button type="button" className={btn(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="标题 3">
          <span style={{ fontSize: '12px', fontWeight: 600 }}>H3</span>
        </button>
        <span className={styles.sep} />
        <button type="button" className={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="无序列表">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="5" cy="6" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="5" cy="18" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        </button>
        <button type="button" className={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="有序列表">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="20" y2="6" />
            <line x1="10" y1="12" x2="20" y2="12" />
            <line x1="10" y1="18" x2="20" y2="18" />
            <text x="3" y="8.5" fontSize="9" fill="currentColor" stroke="none" fontWeight="600" fontFamily="var(--ui-font)">1</text>
            <text x="3" y="14.5" fontSize="9" fill="currentColor" stroke="none" fontWeight="600" fontFamily="var(--ui-font)">2</text>
            <text x="3" y="20.5" fontSize="9" fill="currentColor" stroke="none" fontWeight="600" fontFamily="var(--ui-font)">3</text>
          </svg>
        </button>
        <button type="button" className={btn(editor.isActive('taskList'))} onClick={() => editor.chain().focus().toggleTaskList().run()} title="任务列表">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="6" height="6" rx="1" />
            <path d="M5 8l1.5 1.5L9 7" />
            <line x1="13" y1="8" x2="21" y2="8" />
            <rect x="3" y="14" width="6" height="6" rx="1" />
            <line x1="13" y1="17" x2="21" y2="17" />
          </svg>
        </button>
        <button type="button" className={btn(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="引用">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" opacity="0.8"><path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" /></svg>
        </button>
        <button type="button" className={btn(editor.isActive('codeBlock'))} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="代码块">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <polyline points="15,9 18,12 15,15" />
            <polyline points="9,9 6,12 9,15" />
          </svg>
        </button>
        <button type="button" className={styles.fmtBtn} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="分割线">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <circle cx="8" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="16" cy="12" r="1" fill="currentColor" stroke="none" />
          </svg>
        </button>
        <span className={styles.sep} />
        <label className={styles.fmtBtn} title="插入图片">
          <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21,15 16,10 5,21" />
          </svg>
        </label>
        <label className={styles.fmtBtn} title="导入 Markdown 文件">
          <input type="file" accept=".md,.txt,.markdown" onChange={handleMdUpload} hidden />
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17,8 12,3 7,8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </label>
      </div>
    </div>
  )
}

export function TiptapEditor({ editor, themeClass, editorRef }: TiptapEditorProps) {
  useEffect(() => {
    if (!editor)
      return
    const root = editor.view.dom

    const inject = () => {
      const ctrls = root.querySelectorAll('[data-resize-image-ui="position-controller"]')
      for (const ctrl of ctrls)
        injectResetButton(ctrl as HTMLElement, editor)
    }

    const observer = new MutationObserver(inject)
    observer.observe(root, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [editor])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    if (!editor)
      return
    const file = e.dataTransfer.files[0]
    if (!file)
      return
    if (file.type.startsWith('image/')) {
      e.preventDefault()
      e.stopPropagation()
      const dataUrl = await readFileAsDataURL(file)
      editor.chain().focus().setImage({ src: dataUrl }).run()
    }
    else if (/\.(?:md|txt|markdown)$/i.test(file.name)) {
      e.preventDefault()
      e.stopPropagation()
      const text = await file.text()
      editor.commands.setContent(text)
    }
  }, [editor])

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    if (!editor)
      return
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          const dataUrl = await readFileAsDataURL(file)
          editor.chain().focus().setImage({ src: dataUrl }).run()
        }
        return
      }
    }
  }, [editor])

  if (!editor)
    return null

  return (
    <div className={styles.editorWrap}>
      <FormatBar editor={editor} />
      <div
        className={`${styles.editorContent} ${themeClass}`}
        ref={editorRef}
        onDrop={handleDrop}
        onPaste={handlePaste}
      >
        <div className="markdown-body">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
