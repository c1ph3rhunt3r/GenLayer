import { createClient, TransactionHashVariant } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

/**
 * NewsOracle genlayer-js client configuration.
 *
 * The CONTRACT_ADDRESS should be set via environment variable after deployment:
 *   VITE_CONTRACT_ADDRESS=0x... npm run dev
 *
 * For StudioNet, this is gasless — no wallet/signer needed for reads.
 * For write operations we use a private key from VITE_PRIVATE_KEY.
 */

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || null;

export const client = createClient({
  chain: studionet,
});

/**
 * Read a single query by ID.
 * Uses LATEST_FINAL for durable state after finalization.
 */
export async function readQuery(queryId) {
  if (!CONTRACT_ADDRESS) throw new Error('CONTRACT_ADDRESS not set');
  return client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_query',
    args: [queryId],
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
}

/**
 * Read total query count.
 */
export async function readQueryCount() {
  if (!CONTRACT_ADDRESS) throw new Error('CONTRACT_ADDRESS not set');
  return client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_query_count',
    args: [],
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
}

/**
 * Read all queries with a given status.
 * Uses LATEST_NONFINAL for a more responsive UI — may still be in appeal window.
 */
export async function readQueriesByStatus(status) {
  if (!CONTRACT_ADDRESS) throw new Error('CONTRACT_ADDRESS not set');
  return client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_queries_by_status',
    args: [status],
    transactionHashVariant: TransactionHashVariant.LATEST_NON_FINAL,
  });
}

/**
 * Submit a create_query transaction.
 * Returns the transaction hash immediately — use waitForTransaction to poll finality.
 */
export async function createQuery({ title, description, sourceUrls, resolutionTimestamp }) {
  if (!CONTRACT_ADDRESS) throw new Error('CONTRACT_ADDRESS not set');
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'create_query',
    args: [title, description, sourceUrls, resolutionTimestamp],
  });
  return hash;
}

/**
 * Submit a resolve_query transaction.
 * Returns the transaction hash — consensus may take 30–90s on StudioNet.
 */
export async function resolveQuery(queryId) {
  if (!CONTRACT_ADDRESS) throw new Error('CONTRACT_ADDRESS not set');
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'resolve_query',
    args: [queryId],
  });
  return hash;
}

/**
 * Poll transaction status until finalized or failed.
 * Returns the final transaction receipt.
 */
export async function waitForTransaction(txHash, { onStatus } = {}) {
  return client.waitForTransactionReceipt({
    hash: txHash,
    onReplaced: (receipt) => onStatus?.('replaced', receipt),
  });
}
