import crypto from 'crypto'
import os from 'os'

export function getMachineFingerprint(): string {
  const raw = [
    os.hostname(),
    os.platform(),
    os.arch(),
    os.cpus()[0]?.model ?? 'unknown',
  ].join('|')
  return crypto.createHash('sha256').update(raw).digest('hex')
}
