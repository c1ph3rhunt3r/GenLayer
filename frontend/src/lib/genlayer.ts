import { createClient, createAccount } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';
import deployment from './deployment.json';

export const SENTINEL_ADDRESS =
  (import.meta.env?.VITE_SENTINEL_ADDRESS as `0x${string}`) ||
  (deployment.sentinelAddress as `0x${string}`);

export const MOCK_VAULT_ADDRESS =
  (import.meta.env?.VITE_MOCK_VAULT_ADDRESS as `0x${string}`) ||
  (deployment.mockVaultAddress as `0x${string}`);

export const EXPLORER_URL = deployment.explorerUrl;
export const RPC_URL = deployment.rpcUrl;
export const CHAIN_ID = deployment.chainId;

// Dedicated demo signer account with funded balance
const DEMO_PK =
  (import.meta.env?.VITE_PRIVATE_KEY as `0x${string}`) ||
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

export const account = createAccount(DEMO_PK);

export const client = createClient({
  chain: studioDevnet,
  account,
});

/**
 * Automatically ensures the demo account has gas/native token on Studio Next.
 */
export async function ensureFunded(): Promise<void> {
  try {
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'sim_fundAccount',
        params: [account.address, '0x2000000000000000000'], // 2 GEN
      }),
    });
    await res.json();
  } catch (e) {
    console.warn('Fund check skipped:', e);
  }
}

export interface IncidentData {
  id: number;
  target: string;
  reporter: string;
  tx_hash: string;
  network: string;
  is_exploit: boolean;
  exploit_vector: string;
  loss_estimate: string;
  reasoning: string;
  action_taken: string;
  timestamp: number;
}

export interface TargetData {
  target: string;
  owner: string;
  is_active: boolean;
  is_paused: boolean;
  bounty_balance: number;
  threshold_pct: number;
  registered_at: number;
}

export interface VaultStatus {
  vault_name: string;
  owner: string;
  guardian: string;
  total_reserves: number;
  is_paused: boolean;
}

/**
 * Reads total incident reports from Sentinel contract on Studio Next.
 */
export async function readIncidentsCount(): Promise<number> {
  const count = await client.readContract({
    address: SENTINEL_ADDRESS,
    functionName: 'get_incidents_count',
    args: [],
  });
  return Number(count);
}

/**
 * Reads on-chain incident post-mortem by ID.
 */
export async function readIncident(incidentId: number): Promise<IncidentData> {
  const res = (await client.readContract({
    address: SENTINEL_ADDRESS,
    functionName: 'get_incident',
    args: [incidentId],
  })) as any;

  return {
    id: Number(res.id),
    target: String(res.target),
    reporter: String(res.reporter),
    tx_hash: String(res.tx_hash),
    network: String(res.network),
    is_exploit: Boolean(res.is_exploit),
    exploit_vector: String(res.exploit_vector),
    loss_estimate: String(res.loss_estimate),
    reasoning: String(res.reasoning),
    action_taken: String(res.action_taken),
    timestamp: Number(res.timestamp),
  };
}

/**
 * Reads target protection configuration and state.
 */
export async function readTarget(targetAddr: string = MOCK_VAULT_ADDRESS): Promise<TargetData> {
  const res = (await client.readContract({
    address: SENTINEL_ADDRESS,
    functionName: 'get_target',
    args: [targetAddr],
  })) as any;

  return {
    target: String(res.target),
    owner: String(res.owner),
    is_active: Boolean(res.is_active),
    is_paused: Boolean(res.is_paused),
    bounty_balance: Number(res.bounty_balance),
    threshold_pct: Number(res.threshold_pct),
    registered_at: Number(res.registered_at),
  };
}

/**
 * Checks if target is currently paused by Sentinel.
 */
export async function readIsTargetPaused(targetAddr: string = MOCK_VAULT_ADDRESS): Promise<boolean> {
  const res = await client.readContract({
    address: SENTINEL_ADDRESS,
    functionName: 'is_target_paused',
    args: [targetAddr],
  });
  return Boolean(res);
}

/**
 * Reads MockVault state.
 */
export async function readVaultStatus(): Promise<VaultStatus> {
  const res = (await client.readContract({
    address: MOCK_VAULT_ADDRESS,
    functionName: 'get_status',
    args: [],
  })) as any;

  return {
    vault_name: String(res.vault_name),
    owner: String(res.owner),
    guardian: String(res.guardian),
    total_reserves: Number(res.total_reserves),
    is_paused: Boolean(res.is_paused),
  };
}

/**
 * Submits an on-chain report_exploit transaction to Sentinel.
 * Returns the transaction hash.
 */
export async function submitReportExploit(params: {
  target?: string;
  txHash: string;
  network: string;
  description: string;
  telemetryUrl: string;
}): Promise<`0x${string}`> {
  const target = params.target || MOCK_VAULT_ADDRESS;
  const fees = await client.estimateTransactionFees();

  const hash = await client.writeContract({
    address: SENTINEL_ADDRESS,
    functionName: 'report_exploit',
    args: [target, params.txHash, params.network, params.description, params.telemetryUrl],
    fees,
  });

  return hash;
}

/**
 * Polls for transaction consensus and finalization.
 */
export async function waitForConsensus(txHash: string): Promise<any> {
  const receipt = await client.waitForTransactionReceipt({
    hash: txHash as any,
    waitUntil: 'decided',
  });
  return receipt;
}

/**
 * Resumes vault operations via owner override.
 */
export async function resumeVaultOverride(targetAddr: string = MOCK_VAULT_ADDRESS): Promise<`0x${string}`> {
  const fees = await client.estimateTransactionFees();
  const hash = await client.writeContract({
    address: SENTINEL_ADDRESS,
    functionName: 'toggle_target_pause_override',
    args: [targetAddr, false],
    fees,
  });
  return hash;
}
