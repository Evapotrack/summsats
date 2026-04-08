# SummSats — Concept Document
# Bitcoin-Gated AI Context Builder
# Creator: Andrew Brown
# Date: April 5, 2026 | Status: Concept refined, pre-design

===============================================================================
CONCEPT
===============================================================================

A macOS desktop app where the user creates a project, types thoughts into a
simple text input, and pays 1,000 sats per entry. Each entry is encrypted,
hashed into a tamper-evident chain, and stored locally. An AI (Claude Haiku)
silently processes each input against the current summary and recent entries,
maintaining an evolving 500-word project summary — a single page that captures the patterns,
connections, contradictions, and conclusions from everything the user has written.

The app is a thinking tool. The user pours in diverse inputs — research,
observations, ideas, decisions, creative fragments — and the AI finds threads
between them. The 500-word summary gets denser and more refined with every
entry, forcing the AI to prioritize what matters most.

One project per app in V1. Pay to think. Read for free.

===============================================================================
WHAT'S DECIDED
===============================================================================

Purpose: personal project development + creative work. Helps users see
  connections and patterns between diverse ranges of information.

Platform: Electron, macOS.
  React, Tailwind, Zustand, bitcoinjs-lib, safeStorage.

AI: Claude Haiku for processing. Silent — not conversational. The user
  doesn't chat with the AI. They write into their project. The AI
  processes in the background and updates the summary.
  CRITICAL CONSTRAINT: the AI builds the summary ONLY from the user's
  entries. No general knowledge. No outside information. The summary
  reflects the user's thinking, not the AI's.

Economics: 1,000 sats per entry. AI cost ~1-3 sats per entry (Haiku).
  App collects sats in its own HD wallet. Developer pays Anthropic API
  bill separately. No exchange integration. The sats collected exceed
  the API cost by 300-500x.

Bitcoin: HD wallet, fresh address per entry payment. 1 confirmation
  required. Strict exact amount matching (1,000 sats).

Seed: 12-word BIP39 mnemonic, unique to this app. Same backup pattern —
  stamp into metal plate, store separately.

Encryption: AES-256-GCM, keys derived via HKDF from HD seed. Each entry
  encrypted individually. All entries and project context encrypted at rest.

Hash chain: each entry hashed (SHA-256) with the previous entry's hash
  AND the Shannon entropy of the current summary as inputs. Creates a
  tamper-evident chain where the informational tension of the summary is
  cryptographically committed at each step.

  Entry 1: hash(entry_1_text) — no previous hash, no entropy yet
  Entry 2: hash(entry_2_text + entry_1_hash) — no entropy yet (summary
    just generated for the first time, entropy not yet committed)
  Entry 3: hash(entry_3_text + entry_2_hash + summary_entropy_after_2)
    — first entry to include entropy in the chain
  Entry 4+: hash(entry_N_text + entry_N-1_hash + summary_entropy_after_N-1)

  The entropy value cannot be retroactively changed without breaking the
  chain. The numeric tension of the summary at each point in time is
  permanently recorded and verifiable.

  Optional: anchor latest hash to Bitcoin via OP_RETURN (32 bytes, deferred).

Entropy index: Shannon entropy calculated on the binary (UTF-8) representation
  of the current 500-word summary after each update. Returns a single number
  between 0 and 8. English text typically falls between 4.0-5.0.

  What it measures: informational density and diversity of the summary.
  Higher entropy = more diverse topics, varied vocabulary, more tension
  between different concepts coexisting in 500 words. Lower entropy =
  more focused, repetitive, narrow.

  What the trajectory tells you:
    Rising entropy — thinking is diverging, incorporating diverse inputs
    Falling entropy — thinking is converging toward resolution
    Plateau — circling the same territory

  Displayed on the Summary view as a single number: "Entropy: 4.73"
  with a subtle copper bar filling proportionally (0-8 scale).

  Implementation: pure math on a string. ~10 lines of code. No AI, no
  Bitcoin, no external dependency. But the value is hashed into the chain,
  making it a structural element, not just a display metric.

Summary: 500 words. One full page. Tight and distilled. Forces the AI to
  prioritize. Fits on one screen. Updated after every new entry. Early
  summaries are sparse. Late summaries are dense and refined.

Entries: immutable. Once submitted and paid for, cannot be edited or deleted.
  The 1,000 sats made it permanent. Wrong turns and contradictions preserved.
  The AI surfaces how thinking evolved because nothing is erased. Hash chain
  depends on immutability.

Wallet: sweep threshold 100,000 sats (100 entries). Below threshold, send
  is disabled. Above threshold, user can send to external address with
  standard validation, fee display, and confirmation.

App access: password on launch (hashed in safeStorage, not plaintext).
  Auto-lock timer re-locks after inactivity. Password protects app access.
  Seed protects encryption. Payment protects each entry. Three layers.

Design aesthetic: dark background with warmer grays. Muted copper accent
  color (Tailwind amber-700 or custom ~#B87333).
  The feeling: a well-used leather journal. Inviting to write in, not
  intimidating. A creative thinking space, not a security tool.

Layout: sidebar navigation:
  - Write (default view)
  - Summary
  - Entries
  - Wallet
  - Settings

WRITE VIEW (default):
  A large multi-line text area filling most of the screen. No character
  limit. The user writes as much or as little as they want per entry.
  "Entry #48" displayed in the top corner of the text area — no
  placeholder text, no prompt, no guidance. The entry number tells the
  user where they are in the chain. Submit button below the text area
  (copper accent, primary action). Nothing else on screen. The Write
  view is a blank page with a number and a button.

SUMMARY VIEW:
  Four elements only:
  - The 500-word summary text (warm off-white, comfortable line height,
    readable typography, fills the view)
  - Total entries committed: "48 entries" (text-gray-500, bottom)
  - Entropy index: "Entropy: 4.73" with a subtle copper bar filling
    proportionally on a 0-8 scale (bottom)
  - "Export" button — saves summary as plain .txt file
  Nothing else. No dates, no sparklines, no metadata clutter.

ENTRIES VIEW:
  Chronological list (oldest first). Each row shows:
  - Entry number + timestamp
  Click a row → expands to show first 25 characters as preview.
  Only one entry expandable at a time (accordion — clicking another
  collapses the previous). Expanded preview shows a small "Read Full
  Entry" link that opens the complete text in a read-only panel
  alongside the list.

WALLET VIEW:
  Same structure as vault wallet:
  - Balance at top (font-mono, copper accent, follows denomination setting)
  - UTXO list below (each shows amount, address truncated, confirmations)
  - Send section at bottom: address input, amount, fee display, confirm
  - Send disabled below 100,000 sat threshold with explanation:
    "Minimum 100,000 sats to send (currently [balance] sats)"
  - Full transaction detail displayed before broadcast (inputs, outputs,
    fee in sats and sat/vB, total in vs out)

SETTINGS VIEW:
  - Entry cost: 1,000 sats (display only, not configurable)
  - Auto-lock timer: user sets duration (set at initial setup)
  - Data folder location: folder picker
  - Denomination toggle: sats (default) or BTC
  - Network: testnet or mainnet (set at setup, testnet as separate
    isolated window from mainnet Settings, same pattern as vault)
  - About: version, repo link, license

PAYMENT SCREEN (appears after Submit):
  Dedicated full view (navigates away from Write):
  - QR code (large, scannable, centered)
  - Address in text-gray-300 font-mono text-xs (click to copy,
    clipboard auto-clears after 60 seconds)
  - "Send 1,000 sats" in warm white text-lg
  - Status line:
    "Waiting for payment..."
    → "Transaction detected. Waiting for confirmation..." (copper accent)
    → "Confirmed" (text-green-400, brief)
    → returns to Write view with input cleared
  - Brief confirmation on Write view: "Entry #48 added to your project"
    (copper accent, fades after 3 seconds)

No lock screen for vault access. Password gate only. No session-based
  payments. The app opens freely after password. Only new entries cost sats.

One project per app in V1. Multiple projects deferred.
License: TBD.
Repo: github.com/Evapotrack/summsats

===============================================================================
AI PROCESSING DETAIL
===============================================================================

On each new entry:
  1. Read new entry text
  2. Read existing 500-word summary + last 10 full entries
  3. Produce:
     - Updated 500-word summary (compress, refine, prioritize)
     - Updated entropy index (Shannon entropy of summary binary)
  4. Entropy value hashed into the chain with the new entry
  5. Store updated context encrypted alongside raw entry

  The AI never reads the full entry history. The summary carries long-term
  context. The last 10 entries give recent granular detail. Input per call:
  ~6,000 words (~8,000 tokens). Cost stays flat forever.

===============================================================================
HOW THIS APP IS USEFUL
===============================================================================

The core utility is forced structured thinking through economic friction
combined with AI-assisted pattern recognition across accumulated thoughts.

Without the app: project ideas live in scattered notes, text files, chat
histories, and memory. Connections between an idea from three months ago
and today are invisible unless you manually re-read everything.

With the app: the AI processes each new thought against the accumulated
summary and recent entries, surfacing patterns, contradictions, and
evolutions. The 500-word summary distills the most important patterns
into one page that gets denser with every entry.

The 1,000 sat payment filters signal from noise. If recording a thought
cost nothing, you'd dump everything. The cost makes you ask "is this worth
preserving?" Over time, the context becomes curated and high-signal.

The hash chain provides integrity. In a world where AI generates text
freely, a tamper-evident chain of dated entries proves your thinking
evolved in a specific order over a specific timeline.

The immutability enforces honesty. You can't edit out the wrong turns.
The AI sees your full arc of thinking, including mistakes, and surfaces
how your understanding changed. Process, not just conclusions.

===============================================================================
WHAT CAN BE LEARNED FROM BUILDING THIS
===============================================================================

First project combining Bitcoin AND AI in an economically viable model.
This app's AI cost is <1% of the payment. Lesson: AI becomes viable when
the user pays for something they value (a thought) and AI processing is
a side effect, not the cost.

Hash chain construction teaches tamper-evident data structures — a
foundational cryptography concept applied to personal data.

The 500-word summary constraint is a non-trivial prompt engineering problem:
maintaining a fixed-length evolving summary across unlimited inputs requires
careful design around what to preserve, compress, and drop.

Economic friction as UX is a novel, testable pattern. Whether paying sats
to write improves the quality of recorded thoughts is a hypothesis that
real usage will validate or disprove.

===============================================================================
HONEST ASSESSMENT: IS BITCOIN REDUNDANT HERE?
===============================================================================

Where Bitcoin adds genuine value:

  Economic friction. The 1,000 sat payment creates real cost that a
  "confirm" dialog cannot replicate. You can click past a dialog. You
  cannot ignore spending sats. No other system creates genuine economic
  friction without a centralized intermediary.

  On-chain integrity (deferred). The optional OP_RETURN timestamp anchors
  the hash chain to Bitcoin's proof of work. A local hash can be forged.
  A hash on the blockchain cannot.

  Self-funding model. Sats collected exceed AI cost by 500x. This only
  works because Bitcoin enables micropayments to a self-custodied wallet
  with no payment processor and no intermediary.

Where Bitcoin might be redundant:

  Payment-per-entry could be replaced with a "confirm" button and achieve
  90% of the friction. The remaining 10% (real economic cost) is genuine
  but marginal.

  The hash chain works without Bitcoin. SHA-256 is pure cryptography.
  Only the OP_RETURN anchoring needs the blockchain, and that's deferred.

  The wallet adds complexity for what is essentially a piggy bank of
  payments to yourself.

The honest conclusion:

  Bitcoin is not redundant but its value is more philosophical than
  practical. The economic friction is real and novel. The on-chain
  timestamping is genuinely useful. But the core functionality (encrypted
  entries, AI summaries, hash chain) would work without Bitcoin.

  What Bitcoin transforms is the app's identity. Without it: a nice
  encrypted journal with AI — a category with competitors. With it: a
  sovereignty tool where every thought costs something, proves it existed,
  and accumulates value. The Bitcoin layer makes it interesting and
  different, even if the core features could technically work without it.

  The economics work: Bitcoin gates the input (1,000 sats) and AI is
  cheap (2 sats). The model is sustainable.

===============================================================================
OPERATIONAL DETAILS
===============================================================================

API key: Anthropic API key stored in safeStorage (macOS Keychain).
  Entered during setup wizard (Step 4). Never stored in plaintext, never
  in .env files, never in code.

Polling: the app polls mempool.space every 15 seconds when waiting for a
  payment on the payment screen. Polling stops when payment confirms or
  user navigates away. Same cadence as vault.

Address validity: the payment address stays valid until the app is closed
  or the user cancels the submission. On app restart, a pending entry is
  not resumed — the user must resubmit and pay again. The entry text is
  preserved in a draft state (not encrypted, not hashed) so the user
  doesn't lose what they wrote.

App closed during payment wait: if the user closes the app after submitting
  but before payment confirms, the entry is NOT committed. The draft text
  is preserved locally. On next launch, the Write view shows the draft
  with a message: "You have an unsaved draft. Submit to continue."
  The user resubmits, gets a new address, pays again. No sats are lost
  from the previous attempt — if sats were sent to the old address, they
  are received by the wallet but do not trigger entry processing.

Compression: entries compressed with zlib before encryption. Text entries
  compress well (40-60% reduction typical). Decompress after decryption
  for display. Same pattern as vault. Always on, no user setting.

Single instance lock: app.requestSingleInstanceLock(). Two instances
  accessing the same data folder would corrupt the encrypted index files.

Electron hardening (same as vault):
  - contextIsolation: true
  - nodeIntegration: false
  - Preload script for all IPC
  - Block navigation to external URLs
  - Block new window creation
  - Content Security Policy: default-src 'self'; script-src 'self';
    connect-src 'self' https://mempool.space https://api.anthropic.com
  - No remote content loaded in renderer
  - No webviews, no iframes
  - Electron fuses hardened
  - npm audit before each release

Privacy approach: minimum data sent to Anthropic API. Only the 500-word
  summary + last 10 entries + new entry text. No wallet data, no seed, no
  metadata, no entry numbers, no timestamps, no hash chain data. Document
  exactly what leaves the device. Anthropic's data retention policy applies.
  Local LLM as a deferred future option.

Export: summary exportable as plain .txt file. One "Export Summary" button
  on the Summary view. Free, no sats required.

Auto-lock: user sets duration at setup. No default — user chooses
  intentionally during initial configuration.

===============================================================================
INITIAL STATE — FIRST TWO ENTRIES
===============================================================================

The summary requires a minimum of 2 entries before it is generated. The AI
needs at least two inputs to find patterns, connections, or tensions between
ideas. A single entry has nothing to compare against.

Entry 1: user writes, pays 1,000 sats, entry encrypted and stored. Hash
  chain begins: hash(entry_1_text). No summary exists yet. Summary view
  shows: "1 of 2 entries needed. Write one more to generate your summary."
  Entropy index: not yet calculated.

Entry 2: user writes, pays 1,000 sats, entry encrypted and stored. Hash
  chain: hash(entry_2_text + entry_1_hash). No entropy in this hash — the
  summary is just being generated for the first time. AI processes both
  entries and produces the first 500-word summary. Entropy index calculated
  for the first time. Summary view populates. The project context is born.

Entry 3+: normal flow. AI reads summary + last 10 entries + new entry.
  Summary updated. Entropy recalculated and hashed into chain alongside
  the entry text and previous hash.

===============================================================================
AI SYSTEM PROMPT
===============================================================================

The system prompt shapes everything the AI produces. It must be consistent
across every entry — the same prompt for entry #2 and entry #500.

  SYSTEM PROMPT:
  "You are a silent context processor for a personal project. You receive
  a current 500-word project summary, the last 10 entries, and one new
  entry. Your job is to produce an updated 500-word summary that captures
  the most important patterns, connections, contradictions, and conclusions
  across all the material.

  Rules:
  - Respond with ONLY the updated summary. No preamble, no commentary.
  - Exactly 500 words. Not 499, not 501.
  - Draw ONLY from the entries and existing summary. Never add outside
    knowledge, general facts, or your own opinions.
  - Prioritize: connections between entries > recurring themes > recent
    developments > contradictions > older context that hasn't evolved.
  - When the summary is full and new material arrives, compress older
    patterns to make room for new ones. Nothing is deleted — it is
    distilled into fewer words.
  - If the user's thinking has evolved or reversed on a topic, reflect
    both the original position and the change.
  - Write in third person: 'The project explores...' not 'You said...'
  - Neutral tone. The summary observes the thinking, it does not evaluate it."

  For the first summary (entry 2 — only two entries, no prior summary):
  Same prompt but without the existing summary input. The AI reads both
  entries and produces the initial 500-word summary from scratch.

===============================================================================
AI API FAILURE HANDLING
===============================================================================

The entry payment is confirmed. The entry is encrypted, hashed, and stored.
Then the AI call fails. Three scenarios:

  Network error / API timeout: the entry is permanent (paid, encrypted,
  hashed). The summary is NOT updated. The app queues the summary update
  and retries on the next app launch or next successful entry. The Summary
  view shows the last successful summary with a warning: "Summary pending
  update — AI processing will retry." The entry count increments normally.

  Rate limit: same as network error. Queue and retry.

  Malformed AI response (summary not 500 words, contains preamble, etc.):
  the app rejects the response and retries once. If the retry also fails,
  treat as a failed call — queue for later. Never store a bad summary.

  The hash chain is never affected by AI failure. The entry's hash is
  computed from the entry text + previous hash + last known entropy. The
  chain is about the entries, not the summary. The summary can lag behind
  the chain without breaking integrity.

===============================================================================
DATA STORAGE STRUCTURE
===============================================================================

All data stored in user-chosen data folder, encrypted at rest:

  summsats-data/
    seed.enc           — HD seed, encrypted via safeStorage (macOS Keychain)
    config.enc         — project settings (auto-lock, denomination, network,
                         folder path), encrypted via safeStorage
    summary.enc        — current 500-word summary, encrypted with HKDF key
    entropy.enc        — entropy history (array of values, one per entry),
                         encrypted with HKDF key
    chain.enc          — hash chain data (array of hashes, one per entry),
                         encrypted with HKDF key
    entries/
      001.enc          — entry #1, individually encrypted with HKDF key
      002.enc          — entry #2, individually encrypted
      ...

  Each entry encrypted individually so the app can decrypt specific entries
  (for the Entries view "Read Full Entry" panel) without decrypting all.
  Summary, entropy, and chain files are small and always fully loaded.

  On-disk filenames are sequential numbers — no content leaked via filenames.
  The data folder is safe to back up to iCloud or Time Machine.

===============================================================================
SETUP WIZARD
===============================================================================

Two paths on first launch:

  "Create New Project"                "Restore Existing Project"

  CREATE NEW:
  Step 1 — Welcome: one paragraph explaining SummSats. "Create Project."
  Step 2 — Seed display: 12 words in numbered grid. Warning: "Write these
    words down. This is the only time they will be shown."
  Step 3 — Seed verify: re-enter 3 random words. Wrong → return to Step 2.
  Step 4 — Config: set password (hashed), Anthropic API key, auto-lock
    timer, network (testnet/mainnet), data folder location.
  Step 5 — Done: "Your project is ready. Write your first entry."
    → opens to Write view showing "Entry #1"

  RESTORE EXISTING:
  - Enter 12-word seed (validated against BIP39 checksum)
  - Select folder containing backed-up encrypted data
  - App derives keys, decrypts summary + entries + chain
  - If successful: project restored, wallet scanned for UTXOs
  - If failed: "Could not decrypt with this seed. Verify and try again."
  - If seed valid but no data found: "Wallet restored. No project data
    found. Your wallet balance is available but entries cannot be recovered
    without the encrypted data folder."

===============================================================================
SIDEBAR
===============================================================================

Persistent when app is unlocked.

  Navigation:
  - Write (default, highlighted)
  - Summary
  - Entries
  - Wallet
  - Settings

  Bottom section:
  - Entry count: "48 entries" (text-gray-500, font-mono)
  - Balance: follows denomination setting (font-mono, copper accent)
  - Lock button (manual re-lock)

  Top section (testnet only):
  - Testnet badge (bg-yellow-600/20 text-yellow-400)

  No hot wallet warning (unlike vault). The wallet in SummSats is
  incidental — it accumulates payments, not holdings. The user is not
  storing significant value here deliberately.

===============================================================================
HOW TO (in-app reference)
===============================================================================

Full sidebar view. Dark warm background, off-white body text, copper
section headers. Sections:

  "What is SummSats?"
    SummSats is a thinking tool. You write entries about a project —
    ideas, research, observations, decisions, anything — and pay 1,000
    sats per entry. An AI silently processes each entry and maintains a
    500-word summary that captures the patterns, connections, and
    contradictions across everything you've written. Your entries are
    encrypted, immutable, and linked in a tamper-evident hash chain.

  "How to write an entry"
    Open the Write view. Type anything relevant to your project. Click
    Submit. The app shows a payment screen with a QR code and address.
    Send 1,000 sats from any Bitcoin wallet. Wait for 1 confirmation
    (~10 minutes). Your entry is encrypted, added to the hash chain,
    and the AI updates your summary.

  "What is the summary?"
    The summary is a single page of 500 words that distills everything
    you've written into the most important patterns, connections, and
    conclusions. It updates after every new entry. Early summaries are
    sparse. As you add more entries, the summary becomes denser and more
    refined — the AI compresses older context to make room for new
    patterns. The summary reflects only your thinking, never outside
    knowledge.

  "What is the entropy index?"
    The entropy index is a number between 0 and 8 that measures the
    informational diversity of your summary. It is calculated from the
    binary representation of the summary text using Shannon entropy.

    Higher entropy (toward 8) means your summary contains diverse topics,
    varied vocabulary, and more tension between different ideas coexisting
    in 500 words. Your thinking is broad and divergent.

    Lower entropy (toward 0) means your summary is focused, repetitive,
    and narrow. Your thinking is converging on fewer ideas.

    Watch the trajectory over time:
      Rising — your thinking is diverging, pulling in new threads
      Falling — your thinking is converging toward conclusions
      Plateau — you're circling similar territory

    The entropy value is hashed into your entry chain at each step,
    making it a permanent, tamper-evident record of how your project's
    informational density evolved over time.

  "What is the hash chain?"
    Every entry is hashed with the previous entry's hash and the current
    entropy index using SHA-256. This creates a chain where each entry's
    integrity depends on every entry before it. If any entry were changed,
    the chain would break from that point forward. Your entries are
    immutable — paid for and permanent. The hash chain proves they
    existed in a specific order and were never altered.

  "Why are entries immutable?"
    Each entry costs 1,000 sats. That payment makes it permanent. You
    cannot edit or delete entries. This preserves your full arc of
    thinking — including wrong turns, contradictions, and changed minds.
    The AI uses this complete record to show how your understanding
    evolved. The hash chain depends on immutability to maintain integrity.

  "How to read your entries"
    Open the Entries view. Entries are listed chronologically with
    timestamps. Click an entry to see a 25-character preview. Click
    "Read Full Entry" to open the complete text in a reading panel.

  "How to export your summary"
    Open the Summary view. Click Export. The summary is saved as a plain
    .txt file that opens on any device. Export is free — no sats required.

  "How to send sats from your wallet"
    Open the Wallet view. Your accumulated sats from entry payments are
    shown at the top. When your balance reaches 100,000 sats (100 entries),
    the send function becomes available. Enter a destination address and
    amount, review the fee, and confirm.

  "How to back up your project"
    Two things to protect: your 12-word seed and your encrypted data folder.

    YOUR SEED — write it on paper during setup, then stamp each word into
    a stainless steel plate using a center punch and letter stamps. Store
    the metal plate separately from your computer — a home safe, bank
    safe deposit box, or with a trusted family member. Never photograph
    it or store it digitally.

    YOUR DATA — your encrypted data folder is safe to back up to iCloud,
    Time Machine, or an external drive. The files are encrypted at rest.

    Seed + data folder = full recovery.
    Seed alone = wallet recovery (sats accessible, entries not).
    Data alone = nothing (encrypted, unreadable without seed).

  "When do I need my seed?"
    Only during recovery. You do NOT need your seed for normal use.
    The app stores it securely in your macOS Keychain.

    You need your seed if: your Mac is lost or destroyed, your macOS
    Keychain is corrupted, or you're moving to a different Mac.

    You do NOT need your seed to: write entries, read your summary,
    browse entries, send sats, or change settings.

  "Privacy"
    Each entry's text is sent to Anthropic's API for AI processing.
    Only the current summary, last 10 entries, and new entry text are
    sent. No wallet data, no seed, no timestamps, no entry numbers,
    no hash chain data. The app makes zero other network connections
    except to mempool.space for payment verification. No analytics,
    no telemetry, no crash reporting.

  "Security"
    Your password protects app access. Your seed protects encryption.
    Your Bitcoin payment protects each entry. Three independent layers.
    This is a hot wallet for small accumulated amounts, not cold storage.
    All data encrypted at rest with AES-256-GCM.

===============================================================================
DOCUMENTATION
===============================================================================

All open questions have been resolved. Full documentation in docs/:

  - docs/SUMMARY.md — Community-facing project summary with privacy/security section
  - docs/AI_BEHAVIOR_SPECIFICATION.txt — AI edge cases, validation rules, failure handling
  - docs/SECURITY_AND_PRIVACY_PLAN.txt — 8 security measures, 10 privacy protections
  - docs/TESTING_PLAN.md — Pre-release testing checklist organized by severity
  - docs/HASH_CHAIN_VERIFICATION_GUIDE.txt — Hash chain algorithm with code examples
  - docs/ECONOMIC_MODEL_SENSITIVITY.txt — Margin stress tests across scenarios
  - docs/SUMMSATS_NOTEBOOK.txt — Educational overview for study/review
  - docs/CRITICAL_REVIEW.md — Honest critical review from a Bitcoin researcher perspective
