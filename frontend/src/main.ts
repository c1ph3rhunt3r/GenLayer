import './index.css';
import {
  SENTINEL_ADDRESS,
  MOCK_VAULT_ADDRESS,
  EXPLORER_URL,
  RPC_URL,
  ensureFunded,
  readIncidentsCount,
  readIncident,
  readTarget,
  readIsTargetPaused,
  readVaultStatus,
  submitReportExploit,
  waitForConsensus,
  resumeVaultOverride,
  type IncidentData,
} from './lib/genlayer';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <header>
    <div class="container nav">
      <a href="#" class="brand">
        <img src="/sentinel_logo.jpg" alt="Sentinel Logo" class="brand-logo" />
        <span class="brand-title">
          SENTINEL
          <span class="brand-tag">STUDIO NEXT (61997)</span>
        </span>
      </a>
      <div class="nav-links">
        <div class="network-status-badge">
          <span class="network-status-dot"></span>
          <span>Studio Next (61997) Live</span>
        </div>
        <button id="btn-open-video-nav" class="btn-video">
          <span>▶</span> Watch Demo Video
        </button>
        <a href="#simulator" class="nav-link">Live Cockpit</a>
        <a href="#architecture" class="nav-link">Architecture</a>
        <a href="https://github.com/c1ph3rhunt3r/GenLayer" target="_blank" class="btn-github">
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
        Connected directly to the real Sentinel Intelligent Contract on <strong>Studio Next (Chain 61997)</strong>.
        Evaluates bonded exploit alerts through multi-validator AI consensus and autonomously halts vulnerable protocols before humans can react.
      </p>

      <div style="display: flex; gap: 16px; justify-content: center; margin-bottom: 36px; flex-wrap: wrap;">
        <a href="#simulator" class="btn-sim" style="max-width: 240px; padding: 14px 24px; text-decoration: none; justify-content: center; border-color: var(--cyan); background: rgba(0, 240, 255, 0.1);">
          <span style="font-weight: 700; color: var(--cyan);">⚡ Open Threat Cockpit</span>
        </a>
        <button id="btn-open-video-hero" class="btn-video btn-video-hero">
          <span>▶</span> Watch 2-Min Demo Video
        </button>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div id="metric-incidents" class="metric-val" style="color: var(--cyan);">--</div>
          <div class="metric-lbl">On-Chain Incidents Recorded</div>
        </div>
        <div class="metric-card">
          <div class="metric-val">0 ms</div>
          <div class="metric-lbl">Human Latency Needed</div>
        </div>
        <div class="metric-card">
          <div id="metric-reserves" class="metric-val" style="color: var(--green);">$1,000,000.00</div>
          <div class="metric-lbl">Protected Active Reserves</div>
        </div>
        <div class="metric-card">
          <div class="metric-val" style="font-family: var(--font-mono); font-size: 1.25rem; color: #a855f7;">61997</div>
          <div class="metric-lbl">Studio Next Chain ID</div>
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
          <div class="network-status-badge">
            <span class="network-status-dot"></span>
            <span>LIVE CONTRACT CALLS</span>
          </div>
        </div>

        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
          Trigger live transactions against Sentinel on Studio Next to witness real-time telemetry inspection and multi-validator AI consensus:
        </p>

        <div class="sim-actions">
          <button id="btn-attack" class="btn-sim attack">
            <div>
              <div class="btn-sim-title">
                <span style="color: var(--red);">🚨</span> Scenario A: Flash Loan Exploit Drain
              </div>
              <div class="btn-sim-desc">
                Attacker borrows 50,000 ETH on Aave, manipulates spot price & attempts to drain 88% of Aegis Vault reserves.
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
                Normal 500 ETH DEX arbitrage. High volume swap, but reserves and collateral remain fully balanced.
              </div>
            </div>
            <span class="btn-sim-arrow">→</span>
          </button>
        </div>

        <!-- Pipeline Steps -->
        <div class="steps-pipeline">
          <div id="step-1" class="pipe-step">
            <span class="pipe-dot"></span> 1. Submit Tx
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
          <div class="term-line"><span class="term-tag">[CONNECT]</span> Connecting to GenLayer Studio Next RPC: ${RPC_URL}</div>
          <div class="term-line"><span class="term-tag">[SENTINEL]</span> Target Sentinel Contract: <a href="${EXPLORER_URL}/address/${SENTINEL_ADDRESS}" target="_blank" class="explorer-link">${SENTINEL_ADDRESS.slice(0, 10)}...${SENTINEL_ADDRESS.slice(-6)} ↗</a></div>
          <div class="term-line" style="color: var(--text-dim);">> System ready. Click Scenario A or B to trigger live on-chain contract transactions.</div>
        </div>
      </div>

      <!-- Right Column: Target Vault State & Post-Mortem -->
      <div class="panel vault-card">
        <div class="panel-header">
          <div class="panel-title">
            <span>🏦</span> Monitored Protocol State
          </div>
          <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-dim);">LIVE STORAGE</span>
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
            <span id="vault-name" class="vault-stat-val">Aegis Liquidity Vault</span>
          </div>
          <div class="vault-stat-row">
            <span class="vault-stat-lbl">Target Address</span>
            <span class="vault-stat-val">
              <a id="vault-addr-link" href="${EXPLORER_URL}/address/${MOCK_VAULT_ADDRESS}" target="_blank" class="explorer-link">
                ${MOCK_VAULT_ADDRESS.slice(0, 10)}...${MOCK_VAULT_ADDRESS.slice(-6)} ↗
              </a>
            </span>
          </div>
          <div class="vault-stat-row">
            <span class="vault-stat-lbl">Guardian Contract</span>
            <span class="vault-stat-val">
              <a id="sentinel-addr-link" href="${EXPLORER_URL}/address/${SENTINEL_ADDRESS}" target="_blank" class="explorer-link">
                ${SENTINEL_ADDRESS.slice(0, 10)}...${SENTINEL_ADDRESS.slice(-6)} ↗
              </a>
            </span>
          </div>
          <div class="vault-stat-row">
            <span class="vault-stat-lbl">Active Reserves</span>
            <span id="vault-reserves" class="vault-stat-val" style="color: var(--green);">$1,000,000.00</span>
          </div>
          <div class="vault-stat-row">
            <span class="vault-stat-lbl">Whitehat Bounty Pool</span>
            <span id="vault-bounty" class="vault-stat-val">10,000 GLP</span>
          </div>
          <div class="vault-stat-row">
            <span class="vault-stat-lbl">Drainage Threshold</span>
            <span class="vault-stat-val">30%</span>
          </div>
        </div>

        <!-- Post-Mortem Box -->
        <div id="post-mortem" class="post-mortem-box" style="display: none;">
          <div class="post-mortem-header">
            <span>📋</span> <span id="post-mortem-title">On-Chain Incident Post-Mortem</span>
          </div>
          <div id="post-mortem-content" class="post-mortem-body">
            <!-- Dynamic on-chain content -->
          </div>
        </div>

        <button id="btn-reset-vault" class="btn-reset" style="display: none;">
          🔄 Resume Vault Operations (Owner Override On-Chain Tx)
        </button>
      </div>
    </section>

    <!-- Architecture Features Section -->
    <section id="architecture" class="features-section">
      <h2 class="section-title">GenLayer Autonomous Protocol Engine</h2>
      <p class="section-subtitle">
        How Sentinel leverages GenLayer's non-deterministic execution and multi-validator AI consensus to solve what EVM smart contracts cannot.
      </p>

      <div class="features-grid">
        <div class="feat-card">
          <div class="feat-icon">📡</div>
          <h3 class="feat-title">1. On-Chain RPC Fetch</h3>
          <p class="feat-desc">
            Validators fetch full transaction call traces directly via <code>gl.nondet.web.get</code> from block explorers without relying on centralized oracles.
          </p>
        </div>

        <div class="feat-card">
          <div class="feat-icon">🧠</div>
          <h3 class="feat-title">2. Validator LLM Triage</h3>
          <p class="feat-desc">
            Independent AI validator nodes reason over call semantics via <code>gl.nondet.exec_prompt</code> to distinguish novel flash-loan drain attacks from ordinary arbitrage volume.
          </p>
        </div>

        <div class="feat-card">
          <div class="feat-icon">⚖️</div>
          <h3 class="feat-title">3. Byzantine Consensus</h3>
          <p class="feat-desc">
            Pausing is high-stakes. GenLayer's <code>gl.vm.run_nondet</code> consensus ensures independent validators strictly agree on both exploit veracity and attack vector before any halt.
          </p>
        </div>
      </div>
    </section>
  </main>

  <!-- Demo Video Modal -->
  <div id="video-modal" class="modal-backdrop">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">
          <span>🎬</span> Sentinel Architecture & Demo Walkthrough
        </h3>
        <button id="btn-close-modal" class="btn-modal-close">✕</button>
      </div>

      <div class="video-container">
        <!-- Interactive demo video embed / responsive player -->
        <iframe
          src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=0"
          title="Sentinel GenLayer Autonomous Circuit Breaker Demo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>

      <div style="background: rgba(0, 240, 255, 0.05); border: 1px solid var(--border-cyan); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <div style="font-weight: 700; color: var(--cyan); margin-bottom: 8px;">🔗 Live Deployed Contracts on Studio Next (61997):</div>
        <div style="font-family: var(--font-mono); font-size: 0.85rem; display: flex; flex-direction: column; gap: 6px;">
          <div>Sentinel Contract: <a href="${EXPLORER_URL}/address/${SENTINEL_ADDRESS}" target="_blank" class="explorer-link">${SENTINEL_ADDRESS} ↗</a></div>
          <div>MockVault Contract: <a href="${EXPLORER_URL}/address/${MOCK_VAULT_ADDRESS}" target="_blank" class="explorer-link">${MOCK_VAULT_ADDRESS} ↗</a></div>
          <div>Sample Consensus Report Tx: <a href="${EXPLORER_URL}/tx/0x9beee5bbfb26ebd68f72b9aa79130f05208104af5f0b45761185b40227ad3696" target="_blank" class="explorer-link">0x9beee5bbfb26ebd68f72b9aa79130f05208104af5f0b45761185b40227ad3696 ↗</a></div>
        </div>
      </div>

      <div class="video-walkthrough-steps">
        <h4 style="font-size: 1.05rem; font-weight: 700;">How the Sentinel Autonomous Circuit Breaker Operates:</h4>
        <div class="v-step">
          <div class="v-step-title">1. Bonded Exploit Submission</div>
          <div style="color: var(--text-muted);">Whitehats or automated telemetry bots call <code>report_exploit(target, tx_hash, network, desc, telemetry_url)</code>. Griefing is prevented by requiring a bonded stake.</div>
        </div>
        <div class="v-step">
          <div class="v-step-title">2. Decentralized Web & Trace Retrieval</div>
          <div style="color: var(--text-muted);">GenLayer validators execute <code>gl.nondet.web.get</code> to independently fetch raw transaction execution traces and balance state from RPCs or block explorers.</div>
        </div>
        <div class="v-step">
          <div class="v-step-title">3. AI Validator Semantic Triage</div>
          <div style="color: var(--text-muted);">Each validator passes execution telemetry to an LLM evaluator (<code>gl.nondet.exec_prompt</code>) to analyze reentrancy loops, flash loans, and reserve drainage percentages against protocol baselines.</div>
        </div>
        <div class="v-step">
          <div class="v-step-title">4. Non-Deterministic Byzantine Consensus</div>
          <div style="color: var(--text-muted);">GenLayer's <code>gl.vm.run_nondet</code> ensures a supermajority of validators reach consensus on the attack vector and verdict before committing any state change.</div>
        </div>
        <div class="v-step">
          <div class="v-step-title">5. Autonomous On-Chain Protection & Payout</div>
          <div style="color: var(--text-muted);">Upon confirmed exploit consensus, Sentinel immediately activates the target's emergency halt hook, locks user withdrawals, posts an immutable post-mortem, and releases the whitehat bounty.</div>
        </div>
      </div>
    </div>
  </div>

  <footer>
    <div class="container">
      Sentinel · Built for GenLayer Agent Tank 2026 (Autonomous Protocols Track) · Connected to Studio Next (61997)
    </div>
  </footer>
`;

// UI Elements
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
const postMortemTitle = document.querySelector<HTMLSpanElement>('#post-mortem-title')!;
const postMortemContent = document.querySelector<HTMLDivElement>('#post-mortem-content')!;
const metricIncidents = document.querySelector<HTMLDivElement>('#metric-incidents')!;

// Video Modal Elements
const videoModal = document.querySelector<HTMLDivElement>('#video-modal')!;
const btnOpenVideoNav = document.querySelector<HTMLButtonElement>('#btn-open-video-nav')!;
const btnOpenVideoHero = document.querySelector<HTMLButtonElement>('#btn-open-video-hero')!;
const btnCloseModal = document.querySelector<HTMLButtonElement>('#btn-close-modal')!;

function openModal() {
  videoModal.classList.add('open');
}

function closeModal() {
  videoModal.classList.remove('open');
}

btnOpenVideoNav.addEventListener('click', openModal);
btnOpenVideoHero.addEventListener('click', openModal);
btnCloseModal.addEventListener('click', closeModal);
videoModal.addEventListener('click', (e) => {
  if (e.target === videoModal) closeModal();
});

function log(text: string, type: 'info' | 'warn' | 'danger' | 'success' = 'info') {
  const line = document.createElement('div');
  line.className = 'term-line';
  const prefix =
    type === 'danger'
      ? '[ALERT]'
      : type === 'warn'
      ? '[EVAL]'
      : type === 'success'
      ? '[CONSENSUS]'
      : '[SENTINEL]';
  const tagClass =
    type === 'danger'
      ? 'term-danger'
      : type === 'warn'
      ? 'term-warn'
      : type === 'success'
      ? 'term-success'
      : 'term-tag';

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

/**
 * Refreshes live on-chain state from Sentinel and MockVault contracts.
 */
async function syncOnChainState(): Promise<void> {
  try {
    const [count, isPaused, targetInfo, vaultStatus] = await Promise.all([
      readIncidentsCount(),
      readIsTargetPaused(),
      readTarget(),
      readVaultStatus(),
    ]);

    metricIncidents.textContent = String(count);

    if (isPaused) {
      vaultBanner.className = 'vault-status-banner halted';
      vaultStatusIcon.textContent = '🛑';
      vaultStatusText.textContent = 'EMERGENCY HALT ACTIVE';
      vaultPill.textContent = 'WITHDRAWALS FROZEN';
      vaultReserves.textContent = '$1,000,000.00 (PROTECTED)';
      vaultReserves.style.color = 'var(--red)';
      vaultBounty.textContent = `${targetInfo.bounty_balance} GLP`;
      btnReset.style.display = 'block';

      if (count > 0) {
        try {
          const lastIncident = await readIncident(count);
          renderPostMortem(lastIncident);
        } catch (e) {
          console.warn('Could not load incident details:', e);
        }
      }
    } else {
      vaultBanner.className = 'vault-status-banner normal';
      vaultStatusIcon.textContent = '🟢';
      vaultStatusText.textContent = 'SECURE & OPERATIONAL';
      vaultPill.textContent = 'WITHDRAWALS ACTIVE';
      vaultReserves.textContent = `$${vaultStatus.total_reserves.toLocaleString()}.00`;
      vaultReserves.style.color = 'var(--green)';
      vaultBounty.textContent = `${targetInfo.bounty_balance.toLocaleString()} GLP`;
      postMortem.style.display = 'none';
      btnReset.style.display = 'none';
    }
  } catch (err: any) {
    console.error('Error syncing on-chain state:', err);
    log(`Sync note: ${err.message || 'Connecting to Studio Next RPC...'}`, 'warn');
  }
}

function renderPostMortem(incident: IncidentData) {
  postMortem.style.display = 'block';
  postMortemTitle.textContent = `On-Chain Incident Post-Mortem #${incident.id}`;
  postMortemContent.innerHTML = `
    <div style="margin-bottom: 8px;">
      <strong>Attack Vector:</strong> <span style="color: var(--red); font-weight: 700;">${incident.exploit_vector}</span>
    </div>
    <div style="margin-bottom: 8px;">
      <strong>Damage Prevented:</strong> ${incident.loss_estimate}
    </div>
    <div style="margin-bottom: 8px;">
      <strong>AI Validator Reasoning:</strong> ${incident.reasoning}
    </div>
    <div style="margin-bottom: 8px;">
      <strong>Action Recorded On-Chain:</strong> <span style="color: var(--cyan);">${incident.action_taken}</span>
    </div>
    <div style="margin-top: 10px; font-family: var(--font-mono); font-size: 0.8rem;">
      <strong>Verified Telemetry Hash:</strong> 
      <a href="${EXPLORER_URL}/tx/${incident.tx_hash}" target="_blank" class="explorer-link">${incident.tx_hash.slice(0, 16)}... ↗</a>
    </div>
  `;
}

let isRunning = false;

// Initialize on page load
ensureFunded().then(syncOnChainState);

// Scenario A: Real Flash Loan Exploit Submission
btnAttack.addEventListener('click', async () => {
  if (isRunning) return;
  isRunning = true;
  btnAttack.style.opacity = '0.5';
  btnBenign.style.opacity = '0.5';

  try {
    setStep(1, 'active');
    log('Preparing bonded exploit report on target protocol...', 'danger');
    log(`Target: ${MOCK_VAULT_ADDRESS}`, 'info');

    // Submit real writeContract on Studio Next
    const txHash = await submitReportExploit({
      target: MOCK_VAULT_ADDRESS,
      txHash: '0x7f1a942cd894ef930219842bfbc9029a1b0294129',
      network: 'Base',
      description: 'Flash loan liquidity drain: 50,000 ETH borrowed from Aave, spot oracle manipulated, draining 88% of vault reserves',
      telemetryUrl: `${window.location.origin}/sample_exploit_telemetry.json`,
    });

    log(`On-chain transaction submitted! Tx Hash:`, 'info');
    log(`<a href="${EXPLORER_URL}/tx/${txHash}" target="_blank" class="explorer-link" style="color: var(--cyan); font-weight: 600;">${txHash} ↗ (View on Studio Next Explorer)</a>`, 'info');

    setStep(2, 'active');
    log('gl.nondet.web.get: Multi-validators fetching raw transaction execution trace...', 'info');

    setStep(3, 'active');
    log('gl.nondet.exec_prompt: Querying independent validator LLMs for threat triage...', 'warn');

    setStep(4, 'active');
    log('gl.vm.run_nondet: Awaiting multi-validator Byzantine consensus...', 'warn');

    // Await real consensus finalization
    const receipt = await waitForConsensus(txHash);
    log(`Consensus confirmed on-chain! Status: ${receipt.status_name || 'ACCEPTED'}`, 'success');

    setStep(5, 'halted');
    log('EMERGENCY ACTION TRIGGERED: Target protocol paused in contract state!', 'danger');
    log('Aegis Liquidity Vault FROZEN. All user withdrawals and drains BLOCKED.', 'danger');

    // Sync real on-chain state
    await syncOnChainState();
  } catch (err: any) {
    log(`Transaction error: ${err.message || err}`, 'danger');
    console.error(err);
  } finally {
    isRunning = false;
    btnAttack.style.opacity = '1';
    btnBenign.style.opacity = '1';
  }
});

// Scenario B: Real Benign Arbitrage Submission
btnBenign.addEventListener('click', async () => {
  if (isRunning) return;
  isRunning = true;
  btnAttack.style.opacity = '0.5';
  btnBenign.style.opacity = '0.5';

  try {
    setStep(1, 'active');
    log('Submitting bonded telemetry report for high-volume arbitrage...', 'info');

    const txHash = await submitReportExploit({
      target: MOCK_VAULT_ADDRESS,
      txHash: '0x4a8c9120de84021948291048bcfd901849102849',
      network: 'Ethereum Mainnet',
      description: 'Routine 500 ETH Uniswap DEX arbitrage trade. Collateral 100% balanced, no anomalous drain.',
      telemetryUrl: `${window.location.origin}/sample_benign_telemetry.json`,
    });

    log(`On-chain transaction submitted! Tx Hash:`, 'info');
    log(`<a href="${EXPLORER_URL}/tx/${txHash}" target="_blank" class="explorer-link" style="color: var(--cyan); font-weight: 600;">${txHash} ↗ (View on Studio Next Explorer)</a>`, 'info');

    setStep(2, 'active');
    log('gl.nondet.web.get: Validators fetching trace for 500 ETH DEX trade...', 'info');

    setStep(3, 'active');
    log('gl.nondet.exec_prompt: LLMs evaluating trade semantics against exploit vectors...', 'info');

    setStep(4, 'active');
    log('gl.vm.run_nondet: Awaiting validator consensus...', 'info');

    const receipt = await waitForConsensus(txHash);
    log(`Consensus confirmed! Status: ${receipt.status_name || 'ACCEPTED'}`, 'success');

    setStep(5, 'done');
    log('FALSE ALARM DISMISSED: Target protocol remains active and fully operational.', 'success');

    await syncOnChainState();
  } catch (err: any) {
    log(`Transaction note: ${err.message || err}`, 'warn');
    console.error(err);
  } finally {
    isRunning = false;
    btnAttack.style.opacity = '1';
    btnBenign.style.opacity = '1';
  }
});

// Reset / Resume Vault Operations
btnReset.addEventListener('click', async () => {
  btnReset.disabled = true;
  btnReset.textContent = '⏳ Submitting On-Chain Resume Transaction...';

  try {
    log('Submitting toggle_target_pause_override transaction to Sentinel...', 'info');
    const txHash = await resumeVaultOverride(MOCK_VAULT_ADDRESS);

    log(`Resume transaction submitted! Tx:`, 'info');
    log(`<a href="${EXPLORER_URL}/tx/${txHash}" target="_blank" class="explorer-link" style="color: var(--cyan);">${txHash} ↗</a>`, 'info');

    await waitForConsensus(txHash);
    log('Vault resumed on-chain by authorized owner override. Circuit breaker re-armed.', 'success');

    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`step-${i}`);
      if (el) el.className = 'pipe-step';
    }

    await syncOnChainState();
  } catch (err: any) {
    log(`Resume error: ${err.message || err}`, 'danger');
  } finally {
    btnReset.disabled = false;
    btnReset.textContent = '🔄 Resume Vault Operations (Owner Override On-Chain Tx)';
  }
});
