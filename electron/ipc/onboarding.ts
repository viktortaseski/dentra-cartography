import { ipcMain } from 'electron'
import { getDb } from '../db/connection'

export function registerOnboardingHandlers(): void {
  ipcMain.handle('onboarding:getStatus', (): boolean => {
    const db = getDb()
    const row = db
      .prepare("SELECT value FROM meta WHERE key = 'onboarding_completed'")
      .get() as { value: string } | undefined
    return row?.value === '1'
  })

  ipcMain.handle('onboarding:complete', (): void => {
    const db = getDb()
    db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('onboarding_completed', '1')").run()
  })
}
