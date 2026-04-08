import type { NetworkType } from '../types';

const FEE_CEILING = 100;

function getBaseUrl(networkType: NetworkType): string {
  return networkType === 'testnet'
    ? 'https://mempool.space/testnet/api'
    : 'https://mempool.space/api';
}

export async function fetchFeeEstimates(networkType: NetworkType): Promise<{ fast: number; medium: number; slow: number }> {
  const url = `${getBaseUrl(networkType)}/v1/fees/recommended`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch fees: ${res.status}`);
  const data: { fastestFee: number; halfHourFee: number; hourFee: number } = await res.json();
  return {
    fast: Math.min(data.fastestFee, FEE_CEILING),
    medium: Math.min(data.halfHourFee, FEE_CEILING),
    slow: Math.min(data.hourFee, FEE_CEILING),
  };
}
