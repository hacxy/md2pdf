import { expect, test } from '@playwright/test'

test.describe('md2pdf smoke', () => {
  test('renders toolbar, format bar and editor', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('[class*="brandName"]')).toHaveText('md2pdf')
    await expect(page.locator('select').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Export PDF/i })).toBeVisible()
    await expect(page.locator('.ProseMirror')).toBeVisible()
  })

  test('user can type into the editor', async ({ page }) => {
    await page.goto('/')
    const editor = page.locator('.ProseMirror')
    await editor.click()
    await page.keyboard.type(' hello md2pdf smoke')
    await expect(editor).toContainText('hello md2pdf smoke')
  })

  test('theme switch updates the editor theme class', async ({ page }) => {
    await page.goto('/')
    const editorContent = page.locator('[class*="editorContent"]').first()
    await expect(editorContent).toHaveClass(/theme-github/)
    await page.locator('select').first().selectOption('newsprint')
    await expect(editorContent).toHaveClass(/theme-newsprint/)
  })
})
