import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/')
})

test('タスクを追加できる', async ({ page }) => {
  await page.fill('input[type="text"]', 'テストタスク')
  await page.click('button[type="submit"]')
  await expect(page.getByText('テストタスク')).toBeVisible()
})

test('複数タスクを追加すると件数が増える', async ({ page }) => {
  await page.fill('input[type="text"]', 'タスク1')
  await page.click('button[type="submit"]')
  await page.fill('input[type="text"]', 'タスク2')
  await page.click('button[type="submit"]')
  await expect(page.getByText('0 / 2 件完了')).toBeVisible()
})

test('タスクを完了にできる', async ({ page }) => {
  await page.fill('input[type="text"]', '完了タスク')
  await page.click('button[type="submit"]')
  await page.check('input[type="checkbox"]')
  await expect(page.locator('span.line-through')).toBeVisible()
  await expect(page.getByText('1 / 1 件完了')).toBeVisible()
})

test('タスクを削除できる', async ({ page }) => {
  await page.fill('input[type="text"]', '削除タスク')
  await page.click('button[type="submit"]')
  await page.click('button[title="削除"]')
  await expect(page.getByText('削除タスク')).not.toBeVisible()
  await expect(page.getByText('タスクがありません')).toBeVisible()
})

test('未完了フィルタが動作する', async ({ page }) => {
  await page.fill('input[type="text"]', '未完了タスク')
  await page.click('button[type="submit"]')
  await page.fill('input[type="text"]', '完了タスク')
  await page.click('button[type="submit"]')
  await page.locator('input[type="checkbox"]').first().check()

  await page.getByRole('button', { name: '未完了' }).click()
  await expect(page.getByText('未完了タスク')).toBeVisible()
  await expect(page.getByText('完了タスク')).not.toBeVisible()
})

test('完了済みフィルタが動作する', async ({ page }) => {
  await page.fill('input[type="text"]', '未完了タスク')
  await page.click('button[type="submit"]')
  await page.fill('input[type="text"]', '完了タスク')
  await page.click('button[type="submit"]')
  await page.locator('input[type="checkbox"]').first().check()

  await page.getByRole('button', { name: '完了済み' }).click()
  await expect(page.getByText('完了タスク')).toBeVisible()
  await expect(page.getByText('未完了タスク')).not.toBeVisible()
})
