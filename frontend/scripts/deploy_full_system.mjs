import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { createClient, createAccount } from '../package/dist/index.js';
import { studioDevnet } from '../package/dist/chains/index.js';

console.log('=== DEPLOYING FULL SENTINEL SUITE TO STUDIO NEXT (61997) ===');

const PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const account = createAccount(PK);
console.log('Account address:', account.address);

// Fund deployer account
await fetch('https://studio-dev.genlayer.com/api', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'sim_fundAccount',
    params: [account.address, '0x2000000000000000000'],
  }),
});

const client = createClient({
  chain: studioDevnet,
  account,
});

async function main() {
  // 1. Deploy Sentinel
  const sentinelPath = resolve('../contracts/sentinel.py');
  const sentinelCode = readFileSync(sentinelPath, 'utf-8');

  console.log('Estimating fees for Sentinel...');
  const feesSentinel = await client.estimateTransactionFees();

  console.log('Deploying Sentinel...');
  const sentinelTxHash = await client.deployContract({
    code: sentinelCode,
    args: [50],
    fees: feesSentinel,
  });
  console.log('Sentinel tx submitted! Hash:', sentinelTxHash);

  const sentinelReceipt = await client.waitForTransactionReceipt({
    hash: sentinelTxHash,
    status: 'ACCEPTED',
  });
  const sentinelAddress = sentinelReceipt.recipient;
  console.log('>>> SENTINEL DEPLOYED AT:', sentinelAddress);

  // 2. Deploy MockVault with Sentinel as guardian
  const mockVaultPath = resolve('../contracts/mock_vault.py');
  const mockVaultCode = readFileSync(mockVaultPath, 'utf-8');

  console.log('Estimating fees for MockVault...');
  const feesVault = await client.estimateTransactionFees();

  console.log('Deploying MockVault...');
  const vaultTxHash = await client.deployContract({
    code: mockVaultCode,
    args: [sentinelAddress, 1000000, 'Aegis Liquidity Vault'],
    fees: feesVault,
  });
  console.log('MockVault tx submitted! Hash:', vaultTxHash);

  const vaultReceipt = await client.waitForTransactionReceipt({
    hash: vaultTxHash,
    status: 'ACCEPTED',
  });
  const mockVaultAddress = vaultReceipt.recipient;
  console.log('>>> MOCKVAULT DEPLOYED AT:', mockVaultAddress);

  // 3. Register MockVault in Sentinel
  console.log('Registering MockVault in Sentinel...');
  const feesReg = await client.estimateTransactionFees();
  const regTxHash = await client.writeContract({
    address: sentinelAddress,
    functionName: 'register_target',
    args: [mockVaultAddress, 10000, 30],
    fees: feesReg,
  });
  console.log('Registration tx submitted! Hash:', regTxHash);

  const regReceipt = await client.waitForTransactionReceipt({
    hash: regTxHash,
    status: 'ACCEPTED',
  });
  console.log('Registration status:', regReceipt.status_name);
  console.log('Registration leader result:', regReceipt.consensus_data?.leader_receipt?.[0]?.result);

  // 4. Verify Reads
  console.log('Reading is_target_paused...');
  const isPaused = await client.readContract({
    address: sentinelAddress,
    functionName: 'is_target_paused',
    args: [mockVaultAddress],
  });
  console.log('Target is_paused:', isPaused);

  console.log('Reading get_target...');
  const targetInfo = await client.readContract({
    address: sentinelAddress,
    functionName: 'get_target',
    args: [mockVaultAddress],
  });
  console.log('Target info:', targetInfo);

  console.log('Reading MockVault get_status...');
  const vaultStatus = await client.readContract({
    address: mockVaultAddress,
    functionName: 'get_status',
    args: [],
  });
  console.log('MockVault status:', vaultStatus);

  // Save deployed addresses to a JSON file for frontend and scripts
  const deploymentData = {
    network: 'GenLayer Studio Next',
    chainId: 61997,
    rpcUrl: 'https://studio-dev.genlayer.com/api',
    explorerUrl: 'https://explorer-studio-dev.genlayer.com',
    sentinelAddress,
    mockVaultAddress,
    sentinelDeployTx: sentinelTxHash,
    mockVaultDeployTx: vaultTxHash,
    registrationTx: regTxHash,
    deployedAt: new Date().toISOString(),
  };

  writeFileSync(resolve('./src/lib/deployment.json'), JSON.stringify(deploymentData, null, 2));
  console.log('Saved deployment config to frontend/src/lib/deployment.json');

  console.log('\n======================================================');
  console.log('DEPLOYMENT COMPLETE:');
  console.log('Sentinel Address:   ', sentinelAddress);
  console.log('MockVault Address:  ', mockVaultAddress);
  console.log('======================================================\n');
}

main().catch(console.error);
