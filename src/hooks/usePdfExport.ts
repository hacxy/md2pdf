import type { PageSize } from '@/core/pdfExporter'
import { useCallback, useState } from 'react'
import { exportViaDirect, exportViaPrint } from '@/core/pdfExporter'

export type ExportMethod = 'print' | 'direct'

export function usePdfExport() {
  const [pageSize, setPageSize] = useState<PageSize>('A4')
  const [isExporting, setIsExporting] = useState(false)

  const exportPdf = useCallback(async (
    method: ExportMethod,
    fileName: string,
    previewElement?: HTMLElement | null,
  ) => {
    setIsExporting(true)
    try {
      if (method === 'print') {
        exportViaPrint({ pageSize, fileName })
      }
      else if (previewElement) {
        await exportViaDirect(previewElement, { pageSize, fileName })
      }
    }
    finally {
      setIsExporting(false)
    }
  }, [pageSize])

  return { pageSize, setPageSize, isExporting, exportPdf }
}
