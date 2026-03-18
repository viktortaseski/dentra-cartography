import { execFileSync } from 'child_process'
import crypto from 'crypto'
import os from 'os'

function getMacAddresses(): string {
  const interfaces = os.networkInterfaces()
  const macs = Object.values(interfaces)
    .flat()
    .map((entry) => entry?.mac?.toLowerCase() ?? '')
    .filter((mac) => mac !== '' && mac !== '00:00:00:00:00:00')
    .sort()

  return Array.from(new Set(macs)).join('|')
}

function getPlatformMachineId(): string | null {
  try {
    if (process.platform === 'win32') {
      const output = execFileSync(
        'reg',
        ['query', 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid'],
        { encoding: 'utf8' }
      )
      const match = output.match(/MachineGuid\s+REG_\w+\s+([^\r\n]+)/)
      return match?.[1]?.trim() ?? null
    }

    if (process.platform === 'darwin') {
      const output = execFileSync('ioreg', ['-rd1', '-c', 'IOPlatformExpertDevice'], { encoding: 'utf8' })
      const match = output.match(/"IOPlatformUUID" = "([^"]+)"/)
      return match?.[1]?.trim() ?? null
    }
  } catch {
    return null
  }

  return null
}

export function getMachineFingerprint(): string {
  const raw = [
    getPlatformMachineId() ?? os.hostname().toLowerCase(),
    os.platform(),
    os.arch(),
    getMacAddresses(),
  ].join('|')

  return crypto.createHash('sha256').update(raw).digest('hex')
}
