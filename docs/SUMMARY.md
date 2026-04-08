# SummSats — Project Summary

**Pay to think. Read for free.**

SummSats is an experimental macOS desktop app that combines Bitcoin micropayments with AI-assisted thinking. You write entries about a project — ideas, research, observations, decisions — and pay 1,000 sats per entry. Each entry is encrypted, hashed into a tamper-evident chain, and stored locally. An AI (Claude Haiku) silently processes each entry and maintains an evolving 500-word summary that captures patterns, connections, contradictions, and conclusions across everything you have written.

This is not a product pitch. This is an experiment in what happens when you add real economic friction to the act of recording thoughts, and let AI find the threads between them. I have not researched whether similar projects exist.

## How It Works

**Write.** Open the app. Type anything relevant to your project. Click Submit.

**Pay.** A QR code appears with a Bitcoin address. Send exactly 1,000 sats from any wallet. Wait for one on-chain confirmation (~10 minutes).

**Process.** Once confirmed, your entry is compressed, encrypted with AES-256-GCM, and stored locally. The AI reads the current summary, your last 10 entries, and the new entry, then produces an updated 500-word summary. The summary is always exactly 500 words — no more, no less.

**Chain.** Each entry is hashed (SHA-256) with the previous entry's hash and the current Shannon entropy of the summary. This creates a tamper-evident chain where changing any entry breaks the chain from that point forward. Your entries are immutable — paid for and permanent.

## Core Features

### The 500-Word Summary
A single page that distills everything you have written. It updates after every entry (minimum 2 required). Early summaries are sparse. Late summaries are dense and refined — the AI compresses older patterns to make room for new ones. The summary reflects only your thinking, never outside knowledge.

### The Entropy Index
Shannon entropy calculated on the binary (UTF-8) representation of the 500-word summary. Returns a number between 0 and 8 (English text typically 4.0-5.0). It measures the informational diversity of your summary.

- **Rising entropy** — thinking is diverging, pulling in new threads
- **Falling entropy** — thinking is converging toward conclusions
- **Plateau** — circling similar territory

The entropy value is hashed into the chain at each step, making it a permanent record of how your thinking evolved.

### The Hash Chain
Each entry hashed with the previous hash and current entropy using SHA-256. Creates a tamper-evident chain — if any entry were changed, the chain breaks from that point forward. Proves your entries existed in a specific order and were never altered.

### Immutable Entries
Once paid, entries cannot be edited or deleted. Wrong turns and contradictions are preserved. The AI sees your full arc of thinking, including mistakes, and surfaces how your understanding changed. Process, not just conclusions.

### Summary Tone Selection
Choose how the AI writes your summary: **Educational** (structured, analytical), **Reflective** (introspective, personal), or **Philosophical** (abstract, probing). Switch anytime in Settings — the tone applies to the next summary update. Previous summaries are not regenerated.

### Bitcoin Wallet
The app accumulates sats from entry payments in its own HD wallet. When balance reaches 25,000 sats (25 entries), you can send to an external address with full transaction detail displayed before broadcast.

### Optional Tor Routing
Route all Bitcoin queries (mempool.space) through Tor for IP-level privacy. Toggle in Settings — requires Tor running on localhost:9050. Falls back to direct connection if Tor is unavailable.

## Why It Was Made

**Economic friction as a filter.** The 1,000 sat payment creates real cost that a "confirm" dialog cannot replicate. You can click past a dialog. You cannot ignore spending sats. Over time, the cost makes you ask "is this worth preserving?" — the context becomes curated and high-signal.

**AI as a side effect, not the product.** The user pays for the act of committing a thought. The AI processing (~20 sats cost per entry) is a side effect. This inverts the economics: Bitcoin gates the input, AI is cheap.

**Sovereignty-first.** No cloud. No accounts. No subscriptions. One 12-word seed backs up everything — your wallet and your encrypted entries. The app connects only to mempool.space (Bitcoin) and api.anthropic.com (AI). No analytics, no telemetry.

## Honest Assessment

**Where Bitcoin adds genuine value:**
- Real economic friction that filters signal from noise
- Self-funding model (1,000 sats per entry, ~20 sats AI cost — ~50x margin)
- Fresh address per entry — no on-chain pattern linking entries

**Where Bitcoin might be redundant:**
- The hash chain works without Bitcoin (SHA-256 is pure cryptography)
- A "confirm" dialog would achieve 90% of the friction
- The wallet adds complexity for what is essentially a piggy bank

**The honest conclusion:** Bitcoin is not redundant, but its value is more philosophical than purely practical. What Bitcoin transforms is the app's identity — without it, this is a nice encrypted journal with AI. With it, every thought costs something and accumulates value.

## Tech Stack

- **Runtime:** Electron (latest stable)
- **Frontend:** React 19, TypeScript, Tailwind CSS 4
- **State:** Zustand 5
- **Bitcoin:** bitcoinjs-lib 7, bip32, bip39, tiny-secp256k1
- **AI:** @anthropic-ai/sdk, Claude Haiku (claude-haiku-4-5-20251001)
- **Encryption:** Node.js crypto (AES-256-GCM, HKDF), zlib compression
- **Key Storage:** Electron safeStorage (macOS Keychain)
- **External APIs:** mempool.space (Bitcoin), api.anthropic.com (AI)

## What This Is Not

- **Not a chat app.** The AI is silent — it processes in the background. You never talk to it.
- **Not a note-taking app.** Entries are immutable. You cannot edit or organize them.
- **Not audited software.** This is experimental. Use on testnet first.
- **Not a wallet replacement.** The wallet is incidental — it accumulates entry payments.

## Status

V2 — core app functional with tone selection and Tor routing. Testnet ready. Open source planned after testing and review.

Similar projects may exist — I have not researched the space. This was built to explore the concept.

## Built With

This project was built using Claude Code on a 2025 MacBook Air. It is an experiment in AI-assisted development applied to a sovereignty-first idea.

## Links

- **Repository:** [github.com/Evapotrack/summsats](https://github.com/Evapotrack/summsats)
- **Author:** Andrew Brown

---

## Privacy & Security Summary

*Last updated: April 8, 2026*

### What the app protects

- **Entries at rest.** AES-256-GCM encryption with per-entry keys derived via HKDF from your HD seed. Each entry encrypted individually — compromising one does not expose others. On disk, entries are sequential numbered files (001.enc, 002.enc) — no content leaked via filenames.
- **Summary, entropy, and hash chain.** All encrypted at rest with HKDF-derived keys.
- **Three independent security layers.** Password gates app access. Seed protects encryption. Bitcoin payment (1,000 sats, 1 confirmation) gates each new entry.
- **Replay protection.** Each transaction ID logged. Same txid cannot pay for two entries. Fresh BIP84 address per entry — no address reuse.
- **Key material.** Private keys in memory only during signing, zeroed immediately after. Seed stored encrypted in macOS Keychain via safeStorage. Renderer never accesses key material.
- **Password.** Hashed with scrypt (random salt, timing-safe comparison). Never stored in plaintext.
- **Clipboard.** Auto-clears 60 seconds after copying. Also cleared on app lock.

### What leaves the device

**Connection 1 — Anthropic API:**
- Sent: current summary + last 10 entries + new entry text + system prompt
- NOT sent: seed, wallet data, timestamps, entry numbers, hash chain, entropy, passwords, API key content, any metadata
- Frequency: once per new entry
- Risk: if Anthropic is breached, an attacker could read recent entry content (not full history, not keys)

**Connection 2 — mempool.space:**
- Sent: Bitcoin address queries, UTXO queries, fee estimates, transaction broadcasts
- NOT sent: entry text, summaries, app metadata
- Fresh address per entry prevents single-address tracking

**No other connections.** No analytics. No telemetry. No crash reporting.

### What the app does NOT protect against

- **Anthropic processes your entry text.** This is inherent to the app's core function. Each entry's content is sent for AI processing. If this is unacceptable, do not use the app. Local LLM support is a deferred feature.
- **This is a hot wallet.** Private keys exist on a general-purpose computer. Keep amounts small.
- **Physical access to an unlocked Mac.** If someone has your login and the app is running, they may access entries or extract the seed from Keychain.
- **mempool.space is a trusted dependency.** IP-level correlation of entry frequency is possible. Tor routing (Settings toggle) mitigates this if Tor is running locally.
- **API key compromise.** If your Anthropic API key is stolen (from Keychain extraction or memory), the attacker could run up API charges. They cannot access your entries — the key authenticates API requests, not decrypt data.

### Electron hardening

- `contextIsolation: true`, `nodeIntegration: false`
- Preload script exposes only safe IPC methods
- External navigation and new windows blocked
- CSP: `connect-src 'self' https://mempool.space https://api.anthropic.com`
- Electron fuses: RunAsNode disabled, CookieEncryption enabled
- Single instance lock
- No remote content in renderer — API calls from main process only

### Single point of failure

One 12-word seed controls both your Bitcoin wallet and all entry encryption keys. If compromised, both are exposed. If lost, both are lost. This is an intentional trade-off: one backup instead of two.

### AI failure resilience

If the AI call fails (network error, rate limit, malformed response), the entry is still permanent — it was already paid for, encrypted, and hashed into the chain. Only the summary does not update. The app queues the summary update for retry on the next successful entry. The hash chain is never affected by AI failure.
