import { readFileSync } from 'fs';
import { resolve } from 'path';

async function postRpc(method, params, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch('https://studio-dev.genlayer.com/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'GenLayer-Client/2.0',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params,
        }),
      });
      return await res.json();
    } catch (e) {
      console.warn(`Attempt ${i + 1} failed: ${e.message}. Retrying in 1s...`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error(`Failed after ${retries} attempts`);
}

async function checkCode(label, code) {
  console.log('Testing: ' + label);
  const res = await postRpc('gen_getContractSchemaForCode', [code]);
  console.log('=== ' + label + ' ===');
  if (res.error) {
    console.log('Error END: ' + res.error.message.slice(-400));
    return false;
  } else {
    console.log('SUCCESS SCHEMA methods:', Object.keys(res.result.methods));
    return true;
  }
}

const RUNNER = 'py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng';

let sentinelCode = readFileSync(resolve('../contracts/sentinel.py'), 'utf-8');
sentinelCode = sentinelCode.replace(/#\s*\{\s*"Depends":\s*"[^"]+"\s*\}/, `# { "Depends": "${RUNNER}" }`);

let mockVaultCode = readFileSync(resolve('../contracts/mock_vault.py'), 'utf-8');
mockVaultCode = mockVaultCode.replace(/#\s*\{\s*"Depends":\s*"[^"]+"\s*\}/, `# { "Depends": "${RUNNER}" }`);

await checkCode('Sentinel Contract', sentinelCode);
await checkCode('MockVault Contract', mockVaultCode);
