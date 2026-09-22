import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient, createAccount } from '../package/dist/index.js';
import { studioDevnet } from '../package/dist/chains/index.js';

console.log('--- DEPLOYING SENTINEL TO STUDIO NEXT (CHAIN ID 61997) ---');

const PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const account = createAccount(PK);
console.log('Deployer account address:', account.address);

// Ensure account has funds
try {
  const fundRes = await fetch('https://studio-dev.genlayer.com/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'sim_fundAccount',
      params: [account.address, '0x2000000000000000000'], // 2 GEN
    }),
  }).then(r => r.json());
  console.log('Fund account response:', fundRes);
} catch (e) {
  console.warn('Funding warning:', e.message);
}

const client = createClient({
  chain: studioDevnet,
  account,
});

async function main() {
  const sentinelPath = resolve('../contracts/sentinel.py');
  const sentinelCode = readFileSync(sentinelPath, 'utf-8');

  console.log('Estimating transaction fees...');
  const fees = await client.estimateTransactionFees();
  console.log('Estimated fees:', fees);

  console.log('Submitting deployment transaction to Studio Next...');
  const txHash = await client.deployContract({
    code: sentinelCode,
    args: [50],
    fees,
  });
  console.log('Deployment tx submitted! Hash:', txHash);
  console.log('Waiting for consensus finalization (decided)...');

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: 'ACCEPTED',
  });
  console.log('Status:', receipt.status_name);
  console.log('Leader result:', receipt.consensus_data?.leader_receipt?.[0]?.result);
  console.log('Recipient / Contract Address:', receipt.recipient);
  console.log('Transaction Hash:', receipt.hash || receipt.tx_id);
  
  if (receipt.recipient) {
    console.log('SUCCESS! Sentinel deployed at:', receipt.recipient);
  }
}

main().catch(console.error);
