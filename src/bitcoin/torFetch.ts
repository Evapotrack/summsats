import { SocksProxyAgent } from 'socks-proxy-agent';
import * as https from 'https';
import * as net from 'net';

const TOR_PROXY = 'socks5h://127.0.0.1:9050';
let torAvailable: boolean | null = null;
let useTorEnabled = false;

export function setUseTor(enabled: boolean): void {
  useTorEnabled = enabled;
  torAvailable = null;
}

export function isTorEnabled(): boolean {
  return useTorEnabled;
}

export async function getTorStatus(): Promise<{ enabled: boolean; available: boolean }> {
  if (!useTorEnabled) return { enabled: false, available: false };
  if (torAvailable === null) torAvailable = await checkTorAvailable();
  return { enabled: true, available: torAvailable };
}

async function checkTorAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port: 9050 }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.setTimeout(2000, () => { socket.destroy(); resolve(false); });
  });
}

// Simple HTTPS GET through Tor
function httpsGetViaTor(url: string): Promise<string> {
  const agent = new SocksProxyAgent(TOR_PROXY);
  return new Promise((resolve, reject) => {
    https.get(url, { agent }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function httpsPostViaTor(url: string, body: string, contentType: string): Promise<string> {
  const agent = new SocksProxyAgent(TOR_PROXY);
  const parsed = new URL(url);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname,
      method: 'POST',
      agent,
      headers: { 'Content-Type': contentType, 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        else resolve(data);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Drop-in replacement for fetch that routes through Tor when enabled
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function torFetch(url: string, options?: { method?: string; body?: string; headers?: Record<string, string> }): Promise<{ ok: boolean; status: number; text: () => Promise<string>; json: () => Promise<any> }> {
  if (!useTorEnabled) {
    const res = await fetch(url, options);
    return { ok: res.ok, status: res.status, text: () => res.text(), json: () => res.json() };
  }

  if (torAvailable === null) {
    torAvailable = await checkTorAvailable();
  }

  if (!torAvailable) {
    // Tor enabled but not running — fall back with console warning
    console.warn('[SummSats] Tor enabled but not available on localhost:9050. Falling back to direct connection.');
    const res = await fetch(url, options);
    return { ok: res.ok, status: res.status, text: () => res.text(), json: () => res.json() };
  }

  try {
    let data: string;
    if (options?.method === 'POST' && options.body) {
      data = await httpsPostViaTor(url, options.body, options.headers?.['Content-Type'] ?? 'text/plain');
    } else {
      data = await httpsGetViaTor(url);
    }
    return {
      ok: true,
      status: 200,
      text: async () => data,
      json: async () => JSON.parse(data),
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      text: async () => (err instanceof Error ? err.message : 'Tor request failed'),
      json: async () => ({}),
    };
  }
}
