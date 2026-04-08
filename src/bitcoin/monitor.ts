import type { NetworkType } from '../types';
import { checkPayment } from './utxo';

const POLL_INTERVAL = 15000;

export function createPaymentMonitor(
  address: string, expectedAmount: number, networkType: NetworkType,
  onDetected: () => void, onConfirmed: (txid: string) => void, onError: (error: string) => void
) {
  let timer: ReturnType<typeof setInterval> | null = null;
  let detected = false;
  const poll = async () => {
    try {
      const result = await checkPayment(address, expectedAmount, networkType);
      if (result.found && !detected) { detected = true; onDetected(); }
      if (result.found && result.confirmed && result.txid) { stop(); onConfirmed(result.txid); }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Payment check failed');
    }
  };
  const start = () => { if (timer) return; poll(); timer = setInterval(poll, POLL_INTERVAL); };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  return { start, stop };
}
