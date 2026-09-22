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

const client = createClient({
  chain: studioNext,
});

console.log('Client created successfully.');
console.log('Chain ID:', client.chain.id);
console.log('RPC URL:', client.chain.rpcUrls.default.http[0]);

try {
  const blockNum = await client.getBlockNumber();
  console.log('Current block number on Studio Next:', blockNum);
} catch (e) {
  console.error('Error getting block number:', e.message);
}
