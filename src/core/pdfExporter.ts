export type PageSize = 'A4' | 'Letter' | 'A3'

export interface ExportOptions {
  pageSize: PageSize
  fileName: string
}

const PAGE_SIZES: Record<PageSize, string> = {
  A4: '210mm 297mm',
  Letter: '8.5in 11in',
  A3: '297mm 420mm',
}

function injectPrintStyles(pageSize: PageSize): HTMLStyleElement {
  const style = document.createElement('style')
  style.setAttribute('data-md2pdf-print', '')
  style.textContent = `
    @media print {
      @page {
        size: ${PAGE_SIZES[pageSize]};
        margin: 20mm 25mm;
      }
    }
  `
  document.head.appendChild(style)
  return style
}

export function exportViaPrint(options: ExportOptions): void {
  const style = injectPrintStyles(options.pageSize)
  const originalTitle = document.title
  document.title = options.fileName.replace(/\.pdf$/, '')
  try {
    window.print()
  }
  finally {
    style.remove()
    document.title = originalTitle
  }
}

/**
 * Image alignment in the editor (tiptap-extension-resize-image) uses
 * `float: left/right` on both the wrapper and inner container. In the live
 * editor that's fine, but html2canvas faithfully renders the float — which
 * causes subsequent paragraphs, lists, and headings to wrap around the image,
 * producing a chaotic PDF layout where (e.g.) ordered list numbers stack on
 * the left of the floated image while their text flows on the right.
 *
 * Before capture, walk every image NodeView wrapper, snapshot its inline
 * style, then rewrite float/margin into block-level margin alignment so the
 * image sits in its own row. After capture we restore the original styles so
 * the editor state is untouched.
 */
function normalizeImageAlignmentForExport(root: HTMLElement): () => void {
  const wrappers = Array.from(
    root.querySelectorAll<HTMLElement>('[contenteditable="false"][draggable="true"]'),
  ).filter(el => el.querySelector('img'))

  const saved: Array<{ el: HTMLElement, cssText: string }> = []

  for (const wrapper of wrappers) {
    const container = wrapper.firstElementChild as HTMLElement | null
    for (const el of [wrapper, container].filter(Boolean) as HTMLElement[]) {
      saved.push({ el, cssText: el.style.cssText })

      const style = el.style
      const wasFloatLeft = style.float === 'left'
      const wasFloatRight = style.float === 'right'
      const wasCentered = /margin:\s*0(?:px)?\s+auto/.test(el.style.cssText)

      style.float = 'none'
      style.display = 'block'
      style.paddingLeft = ''
      style.paddingRight = ''
      style.border = ''

      if (wasFloatLeft)
        style.margin = '0.5em auto 0.5em 0'
      else if (wasFloatRight)
        style.margin = '0.5em 0 0.5em auto'
      else if (wasCentered)
        style.margin = '0.5em auto'
    }
  }

  return () => {
    for (const { el, cssText } of saved) el.style.cssText = cssText
  }
}

export async function exportViaDirect(
  element: HTMLElement,
  options: ExportOptions,
): Promise<void> {
  element.setAttribute('data-pdf-export', '')
  const restoreImageStyles = normalizeImageAlignmentForExport(element)

  const images = Array.from(element.querySelectorAll('img'))
  if (images.length > 0) {
    await Promise.all(
      images.map(img =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>(r => img.addEventListener('load', () => r(), { once: true })),
      ),
    )
  }

  const html2pdf = (await import('html2pdf.js')).default
  try {
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: options.fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false },
        jsPDF: { unit: 'mm', format: options.pageSize.toLowerCase() },
      } as Record<string, unknown>)
      .from(element)
      .save()
  }
  finally {
    restoreImageStyles()
    element.removeAttribute('data-pdf-export')
  }
}
