import React from 'react';

export function HowTo() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold text-white mb-6" style={{ fontFamily: 'Georgia, serif' }}>How To</h2>
      <div className="space-y-8 text-sm">
        <Section title="What is SummSats?">
          SummSats is a thinking tool. You write entries about a project — ideas, research,
          observations, decisions, anything — and pay 1,500 sats per entry. An AI silently
          processes each entry and maintains a 500-word summary that captures the patterns,
          connections, and contradictions across everything you have written. Your entries are
          encrypted, immutable, and linked in a tamper-evident hash chain.
        </Section>

        <Section title="How to write an entry">
          Open the Write view. Type anything relevant to your project. Click Submit. The app
          shows a payment screen with a QR code and address. Send 1,500 sats from any Bitcoin
          wallet. Wait for 1 confirmation (~10 minutes). Your entry is encrypted, added to
          the hash chain, and the AI updates your summary.
        </Section>

        <Section title="What is the summary?">
          A single page of exactly 500 words that distills everything you have written into
          the most important patterns, connections, and conclusions. It updates after every
          new entry. Early summaries are sparse. As you add more entries, the summary becomes
          denser and more refined — the AI compresses older context to make room for new
          patterns. The summary reflects only your thinking, never outside knowledge.
          Minimum 2 entries needed before the first summary is generated.
        </Section>

        <Section title="What is the entropy index?">
          A number between 0 and 8 that measures the informational diversity of your summary.
          It is calculated from the binary (UTF-8) representation of the summary text using
          Shannon entropy — a fundamental measure from information theory.{'\n\n'}
          Higher entropy (toward 8) means your summary contains diverse topics, varied
          vocabulary, and more tension between different ideas. Your thinking is broad.{'\n\n'}
          Lower entropy (toward 0) means your summary is focused, repetitive, and narrow.
          Your thinking is converging.{'\n\n'}
          Watch the trajectory over time:{'\n'}
          Rising — thinking is diverging, pulling in new threads{'\n'}
          Falling — thinking is converging toward conclusions{'\n'}
          Plateau — circling similar territory{'\n\n'}
          The entropy value is hashed into your entry chain at each step, making it a
          permanent, tamper-evident record of how your thinking evolved.{'\n\n'}
          Note: changing the summary tone in Settings will affect entropy. Educational
          tone uses structured, predictable vocabulary (lower entropy). Philosophical
          tone uses abstract, varied vocabulary (higher entropy). If you switch tones
          mid-project, expect a visible shift in entropy that reflects the writing style
          change, not necessarily a change in your thinking.
        </Section>

        <Section title="What is the hash chain?">
          Every entry is hashed with the previous entry hash and the current entropy index
          using SHA-256. This creates a chain where each entry depends on every entry before
          it. If any entry were changed, the chain would break from that point forward. Your
          entries are immutable — paid for and permanent. The hash chain proves they existed
          in a specific order and were never altered.
        </Section>

        <Section title="Why are entries immutable?">
          Each entry costs 1,500 sats. That payment makes it permanent. You cannot edit or
          delete entries. This preserves your full arc of thinking — including wrong turns,
          contradictions, and changed minds. The AI uses this complete record to show how
          your understanding evolved.
        </Section>

        <Section title="How to send sats from your wallet">
          Open the Wallet view. Your accumulated sats from entry payments are shown. When
          your balance reaches 25,000 sats (~17 entries), the send function becomes available.
          Enter a destination address and amount, review the fee, and confirm.
        </Section>

        <Section title="How to back up your project">
          Two things to protect:{'\n\n'}
          YOUR SEED — write it on paper during setup, then stamp each word into a stainless
          steel plate. Store separately from your computer.{'\n\n'}
          YOUR DATA — your encrypted data folder is safe to back up to iCloud, Time Machine,
          or an external drive. The files are encrypted at rest.{'\n\n'}
          Seed + data folder = full recovery.{'\n'}
          Seed alone = wallet recovery (sats accessible, entries not).{'\n'}
          Data alone = nothing (encrypted, unreadable without seed).
        </Section>

        <Section title="How to set up your API key">
          SummSats uses Claude AI to process your entries into a summary. This requires an
          Anthropic API key.{'\n\n'}
          1. Visit console.anthropic.com and create a free account{'\n'}
          2. Go to API Keys in your account settings{'\n'}
          3. Click Create Key — it starts with sk-ant-{'\n'}
          4. Copy the key and paste it during SummSats setup{'\n\n'}
          Your API key is stored encrypted in your macOS Keychain. It is sent only to
          Anthropic when processing entries — never stored in plaintext, never in code,
          never shared elsewhere. The AI cost per entry is approximately 20 sats worth
          of API usage.
        </Section>

        <Section title="How to use Tor">
          SummSats can route all Bitcoin network requests through Tor for IP-level privacy.{'\n\n'}
          1. Install Tor on your Mac (e.g., via Homebrew: brew install tor){'\n'}
          2. Start Tor: run &quot;tor&quot; in Terminal (it listens on localhost:9050){'\n'}
          3. Open SummSats Settings and enable &quot;Route through Tor&quot;{'\n\n'}
          When enabled, all mempool.space queries (payment verification, balance checks,
          fee estimates, transaction broadcasts) are routed through the Tor SOCKS5 proxy.
          This prevents your ISP or network observer from seeing which Bitcoin addresses
          you query.{'\n\n'}
          If Tor is enabled but not running, the app falls back to a direct connection
          and logs a warning. Your entry data sent to Anthropic is NOT routed through
          Tor — only Bitcoin network traffic is affected.{'\n\n'}
          To verify Tor is working: check that the Tor process is running (Activity Monitor
          or &quot;ps aux | grep tor&quot; in Terminal) before enabling the toggle.
        </Section>

        <Section title="Privacy">
          Each entry text is sent to Anthropic for AI processing. Only the current summary,
          last 10 entries, and new entry are sent. No wallet data, no seed, no timestamps,
          no entry numbers, no hash chain data. The app also connects to mempool.space for
          payment verification (optionally through Tor). No analytics, no telemetry, no
          crash reporting.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-amber-700 font-semibold text-base mb-2">{title}</h3>
      <div className="text-gray-300 leading-relaxed whitespace-pre-line">{children}</div>
    </div>
  );
}
