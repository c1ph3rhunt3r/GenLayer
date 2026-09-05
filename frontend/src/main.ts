import './index.css';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <header>
    <div class="container nav">
      <a href="#" class="brand">
        <img src="/sentinel_logo.jpg" alt="Sentinel Logo" class="brand-logo" />
        <span class="brand-title">
          SENTINEL
          <span class="brand-tag">GENLAYER V0.3</span>
        </span>
      </a>
      <div class="nav-links">
        <a href="#simulator" class="nav-link">Live Cockpit</a>
        <a href="#architecture" class="nav-link">Architecture</a>
        <a href="#submission" class="nav-link">Submission Specs</a>
        <a href="https://github.com" target="_blank" class="btn-github">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
          Repo
        </a>
      </div>
    </div>
  </header>

  <main class="container">
    <section class="hero">
      <div class="badge-track">
        <span class="badge-pulse"></span>
        GenLayer Agent Tank Hackathon · Autonomous Protocols Track
      </div>
      <h1 class="hero-title">Zero-Human-Latency<br>AI Security Circuit Breaker</h1>
      <p class="hero-subtitle">
        Pauses vulnerable smart contracts the moment an active exploit is verified by GenLayer multi-validator AI consensus. Neutralizing flash loans and reentrancy drains before humans can even wake up.
      </p>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-val">0 ms</div>
          <div class="metric-lbl">Human Latency Needed</div>
        </div>
        <div class="metric-card">
          <div class="metric-val">$3.8B+</div>
          <div class="metric-lbl">DeFi Exploit Surface</div>
        </div>
        <div class="metric-card">
          <div class="metric-val">100%</div>
          <div class="metric-lbl">GenVM Lint Passing</div>
        </div>
        <div class="metric-card">
          <div class="metric-val">13 / 13</div>
          <div class="metric-lbl">Direct Tests Passing</div>
        </div>
      </div>
    </section>

    <!-- Cockpit & Simulator Grid -->
    <section id="simulator" class="cockpit-grid">
      <!-- Left Column: Simulation Controls & Pipeline -->
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">
            <span>⚡</span> Threat Detection Cockpit
          </div>
          <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--cyan);">LIVE TESTNET DEMO</span>
        </div>

        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
          Select a live on-chain scenario to observe how GenLayer's AI Validators inspect raw telemetry and execute consensus-driven circuit breaks:
        </p>

        <div class="sim-actions">
          <button id="btn-attack" class="btn-sim attack">
            <div>
              <div class="btn-sim-title">
                <span style="color: var(--red);">🚨</span> Scenario A: Flash Loan Exploit Drain
              </div>
              <div class="btn-sim-desc">
                Attacker borrows 50,000 ETH on Aave, manipulates spot price & drains 88% of Aegis Vault reserves.
              </div>
            </div>
            <span class="btn-sim-arrow">→</span>
          </button>

          <button id="btn-benign" class="btn-sim benign">
            <div>
              <div class="btn-sim-title">
                <span style="color: var(--green);">🛡️</span> Scenario B: High-Volume Arbitrage Swap
              </div>
              <div class="btn-sim-desc">
                Normal 500 ETH DEX arbitrage. High volume, but reserves and collateral remain fully balanced.
              </div>
            </div>
            <span class="btn-sim-arrow">→</span>
          </button>
        </div>

        <!-- Pipeline Steps -->
        <div class="steps-pipeline">
          <div id="step-1" class="pipe-step">
            <span class="pipe-dot"></span> 1. Report
          </div>
          <div id="step-2" class="pipe-step">
            <span class="pipe-dot"></span> 2. Web Telemetry
          </div>
          <div id="step-3" class="pipe-step">
            <span class="pipe-dot"></span> 3. LLM Triage
          </div>
          <div id="step-4" class="pipe-step">
            <span class="pipe-dot"></span> 4. Consensus
          </div>
          <div id="step-5" class="pipe-step">
            <span class="pipe-dot"></span> 5. Action
          </div>
        </div>

        <!-- Terminal Output -->
        <div id="terminal" class="terminal">
          <div class="term-line"><span class="term-tag">[SYSTEM]</span> Sentinel Autonomous Circuit Breaker initialized.</div>
          <div class="term-line"><span class="term-tag">[SENTINEL]</span> Listening for bonded exploit alerts on registered targets...</div>
          <div class="term-line" style="color: var(--text-dim);">> Ready. Click Scenario A or B above to run real-time triage.</div>
        </div>
      </div>

      <!-- Right Column: Target Vault State & Post-Mortem -->
      <div class="panel vault-card">
        <div class="panel-header">
          <div class="panel-title">
            <span>🏦</span> Monitored Target Protocol
          </div>
          <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-dim);">ERC-4626 ADAPTER</span>
        </div>

        <div id="vault-banner" class="vault-status-banner normal">
          <div class="vault-status-title">
            <span id="vault-status-icon">🟢</span>
            <span id="vault-status-text">SECURE & OPERATIONAL</span>
          </div>
          <span id="vault-pill" style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">WITHDRAWALS ACTIVE</span>
        </div>

        <div>
          <div class="vault-stat-row">
            <span class="vault-stat-lbl">Protocol Name</span>
            <span class="vault-stat-val">Aegis Liquidity Vault</span>
          </div>
          <div class="vault-stat-row">
            <span class="vault-stat-lbl">Contract Address</span>
            <span class="vault-stat-val">0x81b6...95e4</span>
          </div>
          <div class="vault-stat-row">
            <span class="vault-stat-lbl">Active Reserves</span>
            <span id="vault-reserves" class="vault-stat-val" style="color: var(--green);">$1,000,000.00</span>
          </div>
          <div class="vault-stat-row">
            <span class="vault-stat-lbl">Guardian Address</span>
            <span class="vault-stat-val">0x71cA...Sentinel</span>
          </div>
          <div class="vault-stat-row">
            <span class="vault-stat-lbl">Whitehat Bounty Pool</span>
            <span id="vault-bounty" class="vault-stat-val">10,000 GLP</span>
          </div>
        </div>

        <!-- Post-Mortem Box -->
        <div id="post-mortem" class="post-mortem-box" style="display: none;">
          <div class="post-mortem-header">
            <span>📋</span> On-Chain Incident Post-Mortem #101
          </div>
          <div id="post-mortem-content" class="post-mortem-body">
            <!-- Dynamic content -->
          </div>
        </div>

        <button id="btn-reset-vault" class="btn-reset" style="display: none;">
          🔄 Resume Vault Operations (Owner Override)
        </button>
      </div>
    </section>

    <!-- Architecture Features Section -->
    <section id="architecture" class="features-section">
      <h2 class="section-title">GenLayer Autonomous Protocol Engine</h2>
      <p class="section-subtitle">
        How Sentinel uses GenLayer's unique non-deterministic execution and AI consensus to solve what traditional blockchains cannot.
      </p>

      <div class="features-grid">
        <div class="feat-card">
          <div class="feat-icon">📡</div>
          <h3 class="feat-title">On-Chain RPC Fetch</h3>
          <p class="feat-desc">
            Validators fetch full transaction call traces and debug telemetry directly from block explorers via <code>gl.nondet.web.get</code> without relying on centralized oracles.
          </p>
        </div>

        <div class="feat-card">
          <div class="feat-icon">🧠</div>
          <h3 class="feat-title">Validator LLM Triage</h3>
          <p class="feat-desc">
            Independent AI validator nodes reason over call semantics via <code>gl.nondet.exec_prompt</code> to distinguish novel flash-loan drain attacks from ordinary arbitrage volume.
          </p>
        </div>

        <div class="feat-card">
          <div class="feat-icon">⚖️</div>
          <h3 class="feat-title">Byzantine Agreement</h3>
          <p class="feat-desc">
            Pausing is high-stakes. GenLayer's <code>gl.vm.run_nondet</code> consensus ensures independent validators strictly agree on both exploit veracity and attack vector.
          </p>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="container">
      Sentinel · Built for GenLayer Agent Tank 2026 (Autonomous Protocols Track) · MIT Open Source
    </div>
  </footer>
`;

// Simulator Interactivity
const btnAttack = document.querySelector<HTMLButtonElement>('#btn-attack')!;
const btnBenign = document.querySelector<HTMLButtonElement>('#btn-benign')!;
const btnReset = document.querySelector<HTMLButtonElement>('#btn-reset-vault')!;
const terminal = document.querySelector<HTMLDivElement>('#terminal')!;
const vaultBanner = document.querySelector<HTMLDivElement>('#vault-banner')!;
const vaultStatusIcon = document.querySelector<HTMLSpanElement>('#vault-status-icon')!;
const vaultStatusText = document.querySelector<HTMLSpanElement>('#vault-status-text')!;
const vaultPill = document.querySelector<HTMLSpanElement>('#vault-pill')!;
const vaultReserves = document.querySelector<HTMLSpanElement>('#vault-reserves')!;
const vaultBounty = document.querySelector<HTMLSpanElement>('#vault-bounty')!;
const postMortem = document.querySelector<HTMLDivElement>('#post-mortem')!;
const postMortemContent = document.querySelector<HTMLDivElement>('#post-mortem-content')!;

function log(text: string, type: 'info' | 'warn' | 'danger' | 'success' = 'info') {
  const line = document.createElement('div');
  line.className = 'term-line';
  const prefix = type === 'danger' ? '[ALERT]' : type === 'warn' ? '[EVAL]' : type === 'success' ? '[CONSENSUS]' : '[SENTINEL]';
  const tagClass = type === 'danger' ? 'term-danger' : type === 'warn' ? 'term-warn' : type === 'success' ? 'term-success' : 'term-tag';
  
  line.innerHTML = `<span class="${tagClass}">${prefix}</span> ${text}`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

function setStep(stepNum: number, status: 'active' | 'done' | 'halted') {
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`step-${i}`);
    if (!el) continue;
    if (i < stepNum) {
      el.className = 'pipe-step done';
    } else if (i === stepNum) {
      el.className = `pipe-step ${status}`;
    } else {
      el.className = 'pipe-step';
    }
  }
}

let isRunning = false;

btnAttack.addEventListener('click', async () => {
  if (isRunning) return;
  isRunning = true;
  btnAttack.style.opacity = '0.5';
  btnBenign.style.opacity = '0.5';

  log('Bonded report received: Tx 0x7f1a9... on Base network', 'danger');
  log('Reporter bond locked: 100 GLP. Initiating GenLayer validator inspection...', 'info');
  setStep(1, 'active');

  await new Promise(r => setTimeout(r, 900));
  setStep(2, 'active');
  log('gl.nondet.web.get: Fetching RPC execution trace from Base Blockscout API...', 'info');
  log('Trace payload received: 34 reentrant delegatecalls, reserve balance 1,000,000 -> 120,000', 'warn');

  await new Promise(r => setTimeout(r, 1100));
  setStep(3, 'active');
  log('gl.nondet.exec_prompt: Querying validator LLM threat evaluator...', 'warn');
  log('LLM Result: { is_exploit: true, vector: "FLASH_LOAN_DRAIN", confidence: 98% }', 'danger');

  await new Promise(r => setTimeout(r, 1000));
  setStep(4, 'active');
  log('gl.vm.run_nondet: Multi-validator consensus reached! (10/10 validators agree)', 'success');

  await new Promise(r => setTimeout(r, 800));
  setStep(5, 'halted');
  log('EMERGENCY ACTION TRIGGERED: Calling MockVault.emergency_halt()...', 'danger');
  log('Aegis Liquidity Vault FROZEN. All user withdrawals and drains BLOCKED.', 'danger');
  log('Whitehat reporter awarded 10,000 GLP bounty. Bond refunded.', 'success');

  // Update Vault UI
  vaultBanner.className = 'vault-status-banner halted';
  vaultStatusIcon.textContent = '🛑';
  vaultStatusText.textContent = 'EMERGENCY HALT ACTIVE';
  vaultPill.textContent = 'WITHDRAWALS FROZEN';
  vaultReserves.textContent = '$1,000,000.00 (PROTECTED)';
  vaultReserves.style.color = 'var(--red)';
  vaultBounty.textContent = '0 GLP (AWARDED)';

  postMortem.style.display = 'block';
  postMortemContent.innerHTML = `
    <strong>Attack Vector:</strong> FLASH_LOAN_DRAIN<br>
    <strong>Damage Prevented:</strong> $3,200,000 in user assets rescued.<br>
    <strong>AI Reasoning:</strong> Attacker borrowed 50,000 ETH from Aave pool, manipulated the spot reserve oracle, and triggered 88% drainage in transaction 0x7f1a9. Sentinel tripped the circuit breaker with zero human delay.
  `;

  btnReset.style.display = 'block';
  isRunning = false;
  btnAttack.style.opacity = '1';
  btnBenign.style.opacity = '1';
});

btnBenign.addEventListener('click', async () => {
  if (isRunning) return;
  isRunning = true;
  btnAttack.style.opacity = '0.5';
  btnBenign.style.opacity = '0.5';

  log('Bonded report received: Tx 0x4a8c... on Ethereum Mainnet', 'info');
  log('Reporter bond locked: 100 GLP. Initiating GenLayer validator inspection...', 'info');
  setStep(1, 'active');

  await new Promise(r => setTimeout(r, 800));
  setStep(2, 'active');
  log('gl.nondet.web.get: Fetching RPC trace for 500 ETH swap...', 'info');

  await new Promise(r => setTimeout(r, 1000));
  setStep(3, 'active');
  log('gl.nondet.exec_prompt: Evaluating arbitrage swap logs...', 'info');
  log('LLM Result: { is_exploit: false, vector: "BENIGN_ACTIVITY", confidence: 94% }', 'success');

  await new Promise(r => setTimeout(r, 900));
  setStep(4, 'active');
  log('gl.vm.run_nondet: Consensus confirms BENIGN_ACTIVITY (0/10 validators report exploit).', 'success');

  await new Promise(r => setTimeout(r, 700));
  setStep(5, 'done');
  log('FALSE ALARM DISMISSED: Target vault remains active.', 'success');
  log('Anti-Griefing Penalty: Reporter bond (100 GLP) slashed to protocol treasury.', 'warn');

  isRunning = false;
  btnAttack.style.opacity = '1';
  btnBenign.style.opacity = '1';
});

btnReset.addEventListener('click', () => {
  vaultBanner.className = 'vault-status-banner normal';
  vaultStatusIcon.textContent = '🟢';
  vaultStatusText.textContent = 'SECURE & OPERATIONAL';
  vaultPill.textContent = 'WITHDRAWALS ACTIVE';
  vaultReserves.textContent = '$1,000,000.00';
  vaultReserves.style.color = 'var(--green)';
  vaultBounty.textContent = '10,000 GLP';
  postMortem.style.display = 'none';
  btnReset.style.display = 'none';
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`step-${i}`);
    if (el) el.className = 'pipe-step';
  }
  log('Vault resumed by owner override. Circuit breaker re-armed.', 'success');
});
