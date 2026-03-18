import { ipcMain } from 'electron'
import { activateLicense, getLicenseStatus, getMachineCode } from '../license/service'

export function registerLicenseHandlers(): void {
  ipcMain.handle('license:getStatus', () => getLicenseStatus())
  ipcMain.handle('license:activate', (_event, key: unknown) => activateLicense(key))
  ipcMain.handle('license:getMachineCode', () => getMachineCode())
}
