# SummSats — Testing Plan

*Pre-release testing checklist organized by severity.*

---

## Prerequisites

- macOS with Node.js installed
- `npm start` launches successfully
- Testnet mode (default)
- Testnet faucet sats available
- Valid Anthropic API key configured

---

## Catastrophic Tests (Must Pass Before Any Mainnet Use)

### C1: Entry Permanent After Payment
**What:** A paid and confirmed entry is never lost.
**Procedure:**
1. Write an entry, submit, send 1,500 sats
2. Wait for 1 confirmation
3. Verify: entry appears in Entries view
4. Close app (Cmd+Q), relaunch, unlock
5. Verify: entry still present
6. Repeat for 5 consecutive entries
7. Verify: all 5 present after restart, correct order

**Pass:** Zero entries lost across restarts.
**Fail:** Any confirmed entry missing or corrupted.

### C2: Summary Integrity
**What:** Summary is between 150 and 500 words and reflects entries accurately.
**Procedure:**
1. Commit 3 entries on a specific topic
2. Check Summary view — verify word count is between 150 and 500
3. Verify summary references content from all 3 entries
4. Commit 2 more entries on a different topic
5. Verify summary now includes both topics and word count has grown

**Pass:** Summary is between 150 and 500 words and reflects entry content.
**Fail:** Summary outside 150-500 word range, or ignores entry content.

### C3: Hash Chain Integrity
**What:** Chain is tamper-evident and computable from entries.
**Procedure:**
1. Commit 4 entries
2. Export or inspect chain hashes (via dev tools or IPC)
3. Manually verify:
   - Hash 1 = SHA-256(entry_1_text)
   - Hash 2 = SHA-256(entry_2_text + hash_1)
   - Hash 3 = SHA-256(entry_3_text + hash_2 + entropy_after_2)
   - Hash 4 = SHA-256(entry_4_text + hash_3 + entropy_after_3)

**Pass:** All hashes match manual computation.
**Fail:** Any hash mismatch.

### C4: Full Backup/Restore Cycle
**What:** Seed + encrypted data folder = complete recovery.
**Procedure:**
1. Create project, commit 5 entries
2. Record: entry count, summary text, entropy values, wallet balance
3. Close app, delete app data (not data folder)
4. Relaunch, choose "Restore Existing Project"
5. Enter seed, point to data folder
6. Verify: all entries present, summary intact, entropy history, balance

**Pass:** Everything matches pre-restore state.
**Fail:** Any entry, summary, or balance missing.

### C5: Payment Exact Amount Matching
**What:** Only exactly 1,500 sats triggers entry processing.
**Procedure:**
1. Submit entry, send 1,499 sats — verify NO entry committed
2. Submit entry, send 1,501 sats — verify NO entry committed
3. Submit entry, send 1,500 sats — verify entry committed after 1 conf
4. Verify: 1,499 and 1,501 sats received by wallet but no entries created

**Pass:** Only exact 1,500 sats commits an entry.
**Fail:** Wrong amount triggers entry processing.

### C6: Encryption Key Determinism
**What:** Same seed + same entry number always produces same key.
**Procedure:**
1. Create project, commit entries
2. Uninstall, reinstall, restore from seed + data folder
3. Verify all entries decrypt correctly

**Pass:** All entries readable after restore.
**Fail:** Any entry unreadable.

### C7: Replay Protection
**What:** Same txid cannot pay for two entries.
**Procedure:**
1. Commit entry with payment (note txid)
2. Submit new entry
3. Attempt to reuse same txid (via dev tools manipulation)

**Pass:** Second use rejected.
**Fail:** Same txid accepted for two entries.

### C8: AI Failure Does Not Break Chain
**What:** Entry is permanent even if AI call fails.
**Procedure:**
1. Set an invalid API key (or disconnect from internet after payment)
2. Commit entry — payment confirms, AI call fails
3. Verify: entry is encrypted and stored
4. Verify: hash chain includes the entry
5. Verify: Summary view shows "pending update" warning
6. Fix API key, commit another entry
7. Verify: summary catches up

**Pass:** Entry persists, chain intact, summary recovers.
**Fail:** Entry lost, chain broken, or summary permanently stuck.

---

## Security Tests

### S1: Renderer Cannot Access Keys
**What:** No seed, private key, or API key visible in renderer.
**Procedure:**
1. Open dev tools while unlocked
2. Inspect `window.summSats` — verify no seed/key getters
3. Check Zustand store — no sensitive data
4. Check Network tab — no keys in IPC
5. Check Console — no keys logged

**Pass:** Zero sensitive data in renderer.
**Fail:** Any key material visible.

### S2: Password Timing-Safe
**What:** Wrong passwords don't leak timing information.
**Procedure:**
1. Try 10 wrong passwords, measure response time
2. Try correct password, measure response time
3. Times should be similar (within noise)

**Pass:** No measurable timing difference.
**Fail:** Correct password consistently faster/slower.

### S3: API Key Only Sent to Anthropic
**What:** API key never sent anywhere except api.anthropic.com.
**Procedure:**
1. Monitor network requests (dev tools Network tab)
2. Commit an entry
3. Verify: API key appears only in requests to api.anthropic.com
4. Verify: no other outbound connections contain the key

**Pass:** Key only in Anthropic requests.
**Fail:** Key leaked to other endpoints.

### S4: Anthropic Receives Minimum Data
**What:** Only summary + last 10 entries + new entry sent to API.
**Procedure:**
1. Commit 15 entries
2. On entry 16, inspect the API request payload (dev tools)
3. Verify: contains current summary, entries 7-15, and entry 16
4. Verify: does NOT contain entries 1-6, wallet data, seed, timestamps, hash chain, entropy

**Pass:** Minimum data sent per spec.
**Fail:** Extra data included in API call.

---

## Moderate Tests

### M1: mempool.space Unavailable
**What:** App handles Bitcoin API downtime gracefully.
**Procedure:**
1. Disconnect internet
2. Submit entry — payment screen shows, but polling fails gracefully
3. Reconnect — polling resumes
4. Balance and UTXO views show error or stale data, no crash

**Pass:** No crash, graceful degradation.
**Fail:** App crashes or corrupts data.

### M2: Anthropic API Unavailable
**What:** Entry committed even when AI is down.
**Procedure:**
1. Use invalid API key or disconnect after payment
2. Confirm payment
3. Verify entry stored and chain updated
4. Summary shows "pending update"

**Pass:** Entry safe, summary queued.
**Fail:** Entry lost or chain broken.

### M3: Long Entry Performance
**What:** Very long entries (50k+ characters) process without hanging.
**Procedure:**
1. Paste a 50,000 character entry
2. Submit and pay
3. Verify entry encrypts and AI processes (may be slow)

**Pass:** Entry committed (slow acceptable).
**Fail:** App hangs or crashes.

### M4: Tone Switching
**What:** Changing summary tone produces different output character.
**Procedure:**
1. Set tone to Educational, commit 3 entries
2. Note summary style
3. Switch to Philosophical in Settings
4. Commit another entry
5. Verify summary style shifts

**Pass:** Summary tone noticeably different.
**Fail:** No change in summary character.

### M5: Settings Persistence
**What:** Changed settings survive lock/unlock.
**Procedure:**
1. Change denomination to BTC, tone to Reflective, auto-lock to 30 min
2. Lock, unlock
3. Verify all settings retained

**Pass:** Settings match.
**Fail:** Settings reverted.

### M6: Tor Toggle
**What:** Enabling Tor routes Bitcoin queries through SOCKS5.
**Procedure:**
1. Start Tor on localhost:9050
2. Enable Tor in Settings
3. Submit entry — verify payment polling works through Tor
4. Disable Tor — verify direct connection resumes

**Pass:** Both modes functional.
**Fail:** Tor mode fails or doesn't actually route through proxy.

---

## Minor Tests

### U1: Entry Number Display
**What:** Write view shows correct next entry number.
**Procedure:** After 5 entries, Write view shows "Entry #6".
**Pass:** Correct number.

### U2: Entropy Range
**What:** Entropy index between 0 and 8.
**Procedure:** After 3+ entries, check Summary view entropy value.
**Pass:** Number between 0-8 with copper bar proportional.

### U3: Export Summary
**What:** Export saves summary as .txt file.
**Procedure:** Click Export in Summary view, save file, open it.
**Pass:** File contains the summary text (150-500 words).

### U4: QR Code Scannability
**What:** Payment QR scans with phone wallet.
**Procedure:** Scan QR with Strike, Muun, or BlueWallet.
**Pass:** Wallet shows correct address and 1,500 sat amount.

### U5: Clipboard Auto-Clear
**What:** Copied address clears after 60 seconds.
**Procedure:** Copy address from payment screen, wait 65 seconds, paste.
**Pass:** Clipboard cleared.

### U6: Immutable Entries
**What:** No edit or delete option exists for committed entries.
**Procedure:** Browse entries — verify no edit/delete buttons.
**Pass:** Entries are read-only.

---

## Pre-Mainnet Gate

All must pass before real sats:

- [ ] C1-C8: All catastrophic tests pass
- [ ] S1-S4: All security tests pass
- [ ] M1-M6: All moderate tests pass
- [ ] `npx tsc --noEmit` — zero type errors
- [ ] `npm audit` — no critical vulnerabilities
- [ ] Seed backup → full restore cycle verified
- [ ] Testnet full entry flow completed (submit → pay → summary → chain)
- [ ] AI summary produces valid output (150-500 words)
- [ ] Hash chain verified against manual computation
