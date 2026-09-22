import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

const studioNext = {
  ...studionet,
  id: 61997,
  name: 'GenLayer Studio Next',
  rpcUrls: {
    default: {
      http: ['https://studio-dev.genlayer.com/api'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Studio Next Explorer',
      url: 'https://explorer-studio-dev.genlayer.com',
    },
  },
};

// Fixed private key for deployer
const PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const account = createAccount(PK);
console.log('Deployer account address:', account.address);

// Fund account via sim_fundAccount
const fundRes = await fetch('https://studio-dev.genlayer.com/api', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'sim_fundAccount',
    params: [account.address, '0x1000000000000000000'],
  }),
}).then(r => r.json());
console.log('Fund account response:', fundRes);

const client = createClient({
  chain: studioNext,
  account,
});

async function main() {
  const sentinelPath = resolve('../contracts/sentinel.py');
  const sentinelCode = readFileSync(sentinelPath, 'utf-8');
  console.log('Deploying Sentinel to Studio Next (61997)...');

  try {
    const txHash = await client.deployContract({
      code: sentinelCode,
      args: [50],
    });
    console.log('Deployment tx submitted! Hash:', txHash);
    console.log('Waiting for receipt...');
    const receipt = await client.waitForTransactionReceipt({
      hash: txHash,
      status: 'ACCEPTED',
    });
    console.log('Receipt received:', JSON.stringify(receipt, null, 2));
  } catch (err) {
    console.error('Deployment error:', err);
  }
}

main();
