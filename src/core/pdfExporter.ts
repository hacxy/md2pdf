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

const FLOAT_CONTAINER_TAGS = new Set(['P', 'LI', 'BLOCKQUOTE', 'TD', 'TH', 'FIGURE'])

/**
 * For each floated image, find the nearest block-level ancestor (paragraph,
 * list item, blockquote, table cell, …) and turn it into a block formatting
 * context with `display: flow-root`. This contains the float to its natural
 * paragraph: text wraps around the image as expected, but the float does NOT
 * bleed into subsequent blocks (which previously caused following lists or
 * headings to wrap around the image).
 *
 * We deliberately do NOT strip the float itself — preserving it is what makes
 * the PDF match the editor preview when the user has aligned an image left
 * or right.
 */
function containFloatedImagesForExport(root: HTMLElement): () => void {
  const wrappers = Array.from(
    root.querySelectorAll<HTMLElement>('[contenteditable="false"][draggable="true"]'),
  ).filter(el => el.querySelector('img'))

  const saved: Array<{ el: HTMLElement, cssText: string }> = []

  for (const wrapper of wrappers) {
    if (getComputedStyle(wrapper).float === 'none')
      continue

    let container: HTMLElement | null = wrapper.parentElement
    while (container && container !== root) {
      if (FLOAT_CONTAINER_TAGS.has(container.tagName))
        break
      container = container.parentElement
    }
    if (!container || container === root)
      continue

    saved.push({ el: container, cssText: container.style.cssText })
    container.style.display = 'flow-root'
  }

  return () => {
    for (const { el, cssText } of saved) el.style.cssText = cssText
  }
}

export async function exportViaDirect(
  element: HTMLElement,
  options: ExportOptions,
): Promise<void> {
  // html2canvas captures starting from the element's current scroll position.
  // If the user scrolled to find an image (or anything else), the exported PDF
  // skips the content above the scroll and emits blank pages below it. Reset
  // scroll to top during capture and restore after.
  const savedScrollTop = element.scrollTop
  element.scrollTop = 0

  element.setAttribute('data-pdf-export', '')
  const restoreImageStyles = containFloatedImagesForExport(element)

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
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
          // Inherit the active theme's background instead of html2canvas's
          // default #ffffff. Themes (e.g. Night) set --md-color-bg to a dark
          // color; without this, the PDF page area below the markdown content
          // would still come out white.
          backgroundColor: getComputedStyle(element).backgroundColor,
        },
        jsPDF: { unit: 'mm', format: options.pageSize.toLowerCase() },
      } as Record<string, unknown>)
      .from(element)
      .save()
  }
  finally {
    restoreImageStyles()
    element.removeAttribute('data-pdf-export')
    element.scrollTop = savedScrollTop
  }
}
