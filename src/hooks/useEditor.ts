import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Focus from '@tiptap/extension-focus'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { common, createLowlight } from 'lowlight'
import ImageResize from 'tiptap-extension-resize-image'
import { Markdown } from 'tiptap-markdown'
import { SAMPLE_MARKDOWN } from '@/constants/sample'

const lowlight = createLowlight(common)

export function useTiptapEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Focus.configure({ className: 'has-focus', mode: 'deepest' }),
      ImageResize.configure({ inline: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: '开始输入 Markdown 内容...' }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: SAMPLE_MARKDOWN,
  })

  return editor
}
