import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import type { NetworkType, UTXO, TransactionDetail } from '../types';
import { deriveKeyPair } from './wallet';

bitcoin.initEccLib(ecc);

function getNetwork(networkType: NetworkType): bitcoin.Network {
  return networkType === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
}

function selectCoins(utxos: UTXO[], targetAmount: number, feeRate: number): { selected: UTXO[]; fee: number } | null {
  const sorted = [...utxos].sort((a, b) => b.value - a.value);
  const selected: UTXO[] = [];
  let total = 0;
  for (const utxo of sorted) {
    selected.push(utxo);
    total += utxo.value;
    const estimatedVsize = selected.length * 68 + 2 * 31 + 11;
    const fee = Math.ceil(estimatedVsize * feeRate);
    if (total >= targetAmount + fee) return { selected, fee };
  }
  return null;
}

export function validateAddress(address: string, networkType: NetworkType): boolean {
  try {
    bitcoin.address.toOutputScript(address, getNetwork(networkType));
    return true;
  } catch {
    return false;
  }
}

export function buildTransactionDetail(
  utxos: UTXO[], toAddress: string, amountSats: number, feeRate: number, changeAddress: string, networkType: NetworkType
): TransactionDetail | null {
  const result = selectCoins(utxos, amountSats, feeRate);
  if (!result) return null;
  const { selected, fee } = result;
  const totalIn = selected.reduce((s, u) => s + u.value, 0);
  const change = totalIn - amountSats - fee;
  const outputs: Array<{ address: string; value: number }> = [{ address: toAddress, value: amountSats }];
  if (change > 546) outputs.push({ address: changeAddress, value: change });
  const estimatedVsize = selected.length * 68 + outputs.length * 31 + 11;
  return {
    inputs: selected.map(u => ({ txid: u.txid, vout: u.vout, value: u.value })),
    outputs, fee, feeRate: Math.ceil(fee / estimatedVsize), totalIn,
    totalOut: outputs.reduce((s, o) => s + o.value, 0),
  };
}

export async function signAndBroadcast(
  utxos: UTXO[], toAddress: string, amountSats: number, feeRate: number,
  changeAddress: string, seed: Buffer, networkType: NetworkType
): Promise<string> {
  const network = getNetwork(networkType);
  const detail = buildTransactionDetail(utxos, toAddress, amountSats, feeRate, changeAddress, networkType);
  if (!detail) throw new Error('Insufficient funds');
  const coinType = networkType === 'mainnet' ? 0 : 1;
  const psbt = new bitcoin.Psbt({ network });
  for (const input of detail.inputs) {
    const utxo = utxos.find(u => u.txid === input.txid && u.vout === input.vout)!;
    psbt.addInput({
      hash: input.txid, index: input.vout,
      witnessUtxo: { script: bitcoin.address.toOutputScript(utxo.address, network), value: BigInt(input.value) },
    });
  }
  for (const output of detail.outputs) {
    psbt.addOutput({ address: output.address, value: BigInt(output.value) });
  }
  for (let i = 0; i < detail.inputs.length; i++) {
    const utxo = utxos.find(u => u.txid === detail.inputs[i].txid && u.vout === detail.inputs[i].vout)!;
    const keyPair = deriveKeyPair(seed, `m/84'/${coinType}'/0'/0/${utxo.derivationIndex}`, networkType);
    try {
      psbt.signInput(i, {
        publicKey: keyPair.publicKey,
        sign: (hash: Buffer) => Buffer.from(ecc.sign(hash, keyPair.privateKey)),
      });
    } finally {
      keyPair.privateKey.fill(0);
    }
  }
  psbt.finalizeAllInputs();
  const txHex = psbt.extractTransaction().toHex();
  const baseUrl = networkType === 'testnet' ? 'https://mempool.space/testnet/api' : 'https://mempool.space/api';
  const res = await fetch(`${baseUrl}/tx`, { method: 'POST', body: txHex, headers: { 'Content-Type': 'text/plain' } });
  if (!res.ok) throw new Error(`Broadcast failed: ${await res.text()}`);
  seed.fill(0);
  return await res.text();
}
