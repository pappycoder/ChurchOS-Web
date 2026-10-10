# Offline workspace

## Using it

1. Sign in online, completing authenticator verification if enabled.
2. Open **Offline workspace** from the dashboard. Load the available branches.
3. Branch accounts are pinned to their own branch. Admin HQ accounts choose a branch to prepare. This release prepares one branch at a time on each browser/device.
4. Choose a separate passphrase of at least 12 characters and enable offline access on a trusted device.
5. Open `/offline` when disconnected, including after reopening the browser, and unlock with that passphrase.
6. Create/edit member and visitor contact details, save form answer drafts or queue published form submissions. Saves only report success after committing locally.
7. Reconnect and sign in as the original account if the server session expired. Sync occurs on unlock/start, reconnect, an online save or **Sync now**. There is no idle network polling.

The backend and web must deploy together after applying migration `20261010200000_offline_receipts`. No new permission grants or reseed is needed: existing surface permissions control downloads and writes.

## Boundaries

- Offline access lasts seven days from successful preparation/refresh and locks after 15 minutes without local interaction. The local lock performs no requests.
- A new login, account switch, authenticator verification and preparing a new workspace require connectivity. Offline unlock is local access to a prepared copy, not a server session.
- The first release contains member/visitor **contact details** (name, email, phone, notes) and published forms in the chosen branch. It does not provide offline dashboard analytics, financial posting, payments, attendance, ticket bookings, attachments or form-definition editing.
- HQ accounts can prepare any permitted branch. Combined all-branch offline downloads and multiple simultaneous workspaces are deferred.
- A snapshot is limited to 2,000 members, 2,000 visitors, 500 forms and 20 MB. Oversized preparation fails explicitly rather than silently truncating records. The outbox holds up to 500 operations; uploads use sequential batches of 25.
- Passphrases cannot be reset. Browser storage can be removed by the browser, OS or device owner. Storage persistence is requested where supported. Export pending changes before clearing browser data.
- Logout locks access while preserving encrypted queued data. Other tabs receive a lock notification. A different active account cannot send those changes: both client and server verify the original profile/church.
- Removing a workspace is blocked while queued changes or form drafts remain. Pending JSON export is an explicit unencrypted download, so protect it as personal data.
- Permission revocation cannot erase a disconnected copy immediately. Permissions and branch scope are checked again for every sync request. Use trusted devices; reconnect regularly.
- PWA/service-worker support requires HTTPS or localhost and a production build. Next development mode intentionally disables the service worker.

## Storage and synchronization

IndexedDB stores an AES-GCM encrypted workspace envelope. PBKDF2-SHA256 (600,000 iterations, random salt) derives a non-extractable key from the passphrase; random IVs are used for every save. Keys live only in memory. No API token, password, member name or email is persisted in plaintext storage metadata.

The encrypted snapshot, outbox and form drafts commit in one IndexedDB transaction. A revision compare-and-swap rejects stale writes from another tab. UI overlays pending edits over the most recent server snapshot.

`GET /api/v1/offline/snapshot?branchId=<uuid>` returns a bounded permission-scoped snapshot and lease. `POST /api/v1/offline/push` accepts the original profile/church and validated mutations. Database advisory locks serialize duplicate mutation IDs. Effects, receipts and audit records commit together. Replaying an ID returns its durable acknowledgement; rebinding it to different content is rejected. These receipts do not expire with the legacy sync change feed.

Updates compare the original server `updated_at` and use an atomic conditional write. Device timestamps never resolve a conflict. Form submissions validate current fields/status, version, uniqueness and limits before acceptance. Requests return an acknowledgement for every operation. Infrastructure errors stay pending; permission/validation failures and conflicts require review.

In **Pending & review**, inspect local changes, refresh and explicitly keep them against the latest version, or discard the change. Export provides a recovery copy. Sync never silently drops a failed operation. Successful snapshots replace server rows atomically while retaining pending overlays and drafts. This release uses complete bounded snapshots, so it needs no incremental cursor and cannot advance a cursor ahead of a local commit.

Only the public shell and static assets are cached by the service worker. Authenticated HTML, RSC payloads and API responses remain network-only.

## Tests

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser tests use deterministic API fixtures and the actual production service worker. They cover offline reload/unlock, wrong passphrases, durable edits, reconnect sync, cross-tab logout, inactivity locking without polling and absence of API responses in Cache Storage. Backend PostgreSQL integration tests cover the real mutation transaction, concurrency, conflicts, scope and submissions.
