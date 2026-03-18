---
name: License system architecture
description: Offline Ed25519 license key validation — files, key format, IPC channels, and DB table
type: project
---

Migration 003 adds `license_activations` table (id, license_key UNIQUE, licensee, email, issued_at, expires_at, activated_at).

**Why:** Offline-first app needs tamper-resistant license validation without a server call.

**How to apply:** When touching license code, keep validation pure in `electron/license/validator.ts` and keep IPC thin in `electron/ipc/license.ts`. Never move crypto logic into the IPC handler.

Key details:
- Ed25519 public key is hardcoded in `electron/license/validator.ts`; private key lives in `keys/private.pem` (gitignored, never read by app).
- License key format: `<base64url(JSON payload)>.<base64url(Ed25519 signature)>`
- Validation uses `crypto.verify(null, ...)` — NOT `createVerify` — because Ed25519 does not accept a hash algorithm parameter.
- IPC channels: `license:getStatus` (returns `LicenseStatus`) and `license:activate` (returns `ActivateResult`).
- Shared types `LicenseStatus` and `ActivateResult` are in `shared/types.ts`.
- Developer tools: `scripts/generate-keypair.mjs` (key rotation), `scripts/issue-license.mjs` (per-customer key issuance).
- `INSERT OR IGNORE` is used on activation so re-submitting the same key is idempotent.
