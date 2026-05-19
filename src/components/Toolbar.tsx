import type { PageSize } from '@/core/pdfExporter'
import type { ExportMethod } from '@/hooks/usePdfExport'
import { themes } from '@/core/themeEngine'
import styles from './Toolbar.module.css'

interface ToolbarProps {
  themeId: string
  onThemeChange: (id: string) => void
  pageSize: PageSize
  onPageSizeChange: (size: PageSize) => void
  onExport: (method: ExportMethod) => void
  onExportMarkdown: () => void
  isExporting: boolean
  hasContent: boolean
}

const PAGE_SIZES: PageSize[] = ['A4', 'Letter', 'A3']

export function Toolbar({
  themeId,
  onThemeChange,
  pageSize,
  onPageSizeChange,
  onExport,
  onExportMarkdown,
  isExporting,
  hasContent,
}: ToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.brand}>
        <span className={styles.brandMark} aria-hidden>M</span>
        <span className={styles.brandName}>md2pdf</span>
        <span className={styles.brandTag}>v0</span>
      </div>

      <div className={styles.controls}>
        <div className={styles.group}>
          <label className={styles.label}>Theme</label>
          <select className={styles.select} value={themeId} onChange={e => onThemeChange(e.target.value)}>
            {themes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.group}>
          <label className={styles.label}>Page</label>
          <select className={styles.select} value={pageSize} onChange={e => onPageSizeChange(e.target.value as PageSize)}>
            {PAGE_SIZES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className={styles.divider} />

        <button
          className={styles.exportBtn}
          onClick={() => onExport('direct')}
          disabled={isExporting || !hasContent}
          title="导出 PDF"
        >
          {isExporting
            ? <span className={styles.spinner} />
            : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
          Export PDF
          <span className={styles.kbd}>⌘P</span>
        </button>

        <button
          className={`${styles.secondaryBtn} ${styles.withLabel}`}
          onClick={onExportMarkdown}
          disabled={!hasContent}
          title="导出 Markdown"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
          </svg>
          .md
        </button>

        <button className={styles.secondaryBtn} onClick={() => onExport('print')} disabled={!hasContent} title="打印 (⌘P)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6,9 6,2 18,2 18,9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
        </button>
      </div>
    </div>
  )
}
