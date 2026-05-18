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

export async function exportViaDirect(
  element: HTMLElement,
  options: ExportOptions,
): Promise<void> {
  element.setAttribute('data-pdf-export', '')

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
    element.removeAttribute('data-pdf-export')
  }
}
