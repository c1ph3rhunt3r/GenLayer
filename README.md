# Sentinel: Autonomous AI Security Circuit Breaker

[![GenLayer Agent Tank](https://img.shields.io/badge/GenLayer-Agent_Tank_2026-blueviolet?style=for-the-badge)](https://portal.genlayer.foundation/agent-tank/hackathon)
[![Track](https://img.shields.io/badge/Track-Autonomous_Protocols-emerald?style=for-the-badge)](https://portal.genlayer.foundation/agent-tank/hackathon)
[![GenVM Tested](https://img.shields.io/badge/GenVM_Lint-100%25_Passing-success?style=for-the-badge)](https://github.com/genlayerlabs/genvm)
[![Pytest](https://img.shields.io/badge/Tests-13%2F13_Passing-brightgreen?style=for-the-badge)](#testing--verification)

> **Zero-human-latency, consensus-backed emergency circuit breaker for DeFi protocols — powered by GenLayer Intelligent Contracts.**

---

## 🚨 The Problem: The 3:00 AM DeFi Latency Gap

Over **$3.8 Billion** in user assets have been lost to on-chain DeFi exploits. In almost every major hack (Euler, Curve pools, Radiant, Mango Markets), the exploit unfolded across multiple transactions over **20 to 180 minutes**:

1. **Flash Loan Inflow & Spot Manipulation**
2. **Oracle Arbitrage & Reserve Depletion**
3. **Liquidity Extraction & Bridge Egress**

Current DeFi protocols rely on **human multisig teams** or centralized alerting services (PagerDuty, Telegram alerts) to manually sign pause transactions. At 3:00 AM, the human response time is **45 minutes to 4 hours** — long after the vault has been completely drained.

Traditional oracles (like Chainlink) only feed numeric spot prices — they **cannot reason about exploit semantics, transaction execution traces, or abnormal reserve depletion**.

---

## 🛡️ The Solution: Sentinel

**Sentinel** is an autonomous security circuit breaker deployed as a **GenLayer Intelligent Contract**. It bridges the gap between on-chain execution and real-time AI security audits:

- **Permissionless Threat Reporting:** Anyone (whitehat, monitoring bot, community member) can submit a suspicious transaction hash with an RPC telemetry link.
- **Autonomous Validator Trace Analysis:** GenLayer AI Validators independently fetch execution traces via `gl.nondet.web.get`.
- **LLM Threat Triage:** Validators run AI-powered prompt analysis via `gl.nondet.exec_prompt` with structured JSON output, assessing reentrancy patterns, flash-loan reserve drainage, and flash-manipulations.
- **Consensus-Backed Verification:** GenLayer validators reach strict consensus on exploit veracity (`gl.vm.run_nondet`).
- **Instant Circuit Breaker Activation:** If an exploit is confirmed by consensus:
  1. Sentinel immediately trips the protocol's emergency halt hook (`emergency_halt()`), freezing further drains.
  2. The whitehat reporter is paid from the protocol's deposited bounty reserve.
  3. A full AI post-mortem report is immutably logged on-chain.
- **Anti-Griefing Mechanism:** If validators agree a submission is a false alarm (routine arbitrage or high-volume liquidation), the report is dismissed and the reporter's bond is slashed.

---

## 🏛️ Architecture

```mermaid
flowchart TD
    Reporter([🕵️ Whitehat / Monitor Bot]) -->|1. report_exploit(tx_hash, url, bond)| Sentinel[⚡ Sentinel Intelligent Contract]
    
    subgraph GenLayer Validator Consensus
        Sentinel -->|2. gl.nondet.web.get| RPC[📡 Block Explorer / Trace RPC]
        RPC -->|3. Transaction Trace & Logs| LLM[🧠 Validator AI LLM Evaluator]
        LLM -->|4. Structured Threat JSON| Consensus{⚖️ gl.vm.run_nondet Consensus}
    end

    Consensus -->|Verdict: Confirmed Exploit| HaltFlow[🚨 Exploit Confirmed]
    HaltFlow -->|5. emergency_halt| Vault[🏦 Protected Target Vault]
    HaltFlow -->|6. Award Bounty| Reporter
    HaltFlow -->|7. Record Incident Log| OnChainLog[📜 On-Chain Post-Mortem]

    Consensus -->|Verdict: Benign Market Activity| FalseAlarm[🛡️ False Alarm Dismissed]
    FalseAlarm -->|Slash Reporter Bond| Sentinel
```

---

## 📂 Project Structure

```
GenLayer/
├── contracts/
│   ├── sentinel.py         # Sentinel Autonomous Circuit Breaker (GenLayer Intelligent Contract)
│   └── mock_vault.py       # Representative DeFi Vault with emergency halt integration
├── tests/
│   ├── conftest.py         # GenLayer v0.3.0 direct test harness & WASI adapters
│   ├── test_sentinel.py    # Unit & integration tests for Sentinel triage & consensus
│   └── test_mock_vault.py  # Unit & security tests for MockVault under emergency halts
├── submission/
│   └── PITCH.md            # Hackathon pitch, threat model, and Agent Tank metadata
├── gltest.config.yaml      # GenLayer test runner configuration
└── README.md               # Project documentation and specifications
```

---

## ⚙️ Contract Specifications

### 1. `Sentinel` (`contracts/sentinel.py`)

| Method | Type | Description |
| :--- | :--- | :--- |
| `register_target(target, bounty_deposit, threshold_pct)` | `@gl.public.write` | Enrolls a DeFi contract under Sentinel protection with initial bounty reserves and drainage threshold. |
| `deposit_bounty(target, amount)` | `@gl.public.write` | Top-up whitehat bounty reward pool for a target protocol. |
| `report_exploit(target, tx_hash, network, description, url)` | `@gl.public.write` | Permissionless exploit submission triggering validator web fetch and AI consensus triage. |
| `toggle_target_pause_override(target, paused)` | `@gl.public.write` | Governance safety override callable only by protocol owner or Sentinel admin. |
| `get_incident(incident_id)` | `@gl.public.view` | Retrieves full on-chain post-mortem report (AI reasoning, loss estimate, exploit vector). |
| `get_target(target)` | `@gl.public.view` | Returns protection config, pause status, and bounty balance for a target contract. |
| `is_target_paused(target)` | `@gl.public.view` | Quick boolean view for other contracts to query circuit breaker state. |
| `get_incidents_count()` | `@gl.public.view` | Total recorded security incidents across all protected protocols. |

### 2. `MockVault` (`contracts/mock_vault.py`)

| Method | Type | Description |
| :--- | :--- | :--- |
| `emergency_halt()` | `@gl.public.write` | Circuit breaker hook callable only by authorized Sentinel contract or vault owner. |
| `resume()` | `@gl.public.write` | Unpauses vault after remediation. Callable strictly by vault owner. |
| `deposit(amount)` | `@gl.public.write` | Standard user deposit. Reverts if circuit breaker is tripped. |
| `withdraw(amount)` | `@gl.public.write` | Standard user withdrawal. Reverts if circuit breaker is tripped. |
| `simulate_exploit_drain(amount)` | `@gl.public.write` | Test utility to simulate attack drain. Blocked if Sentinel has paused the vault! |
| `get_status()` | `@gl.public.view` | Returns current total reserves, pause state, and guardian address. |

---

## 🧪 Testing & Verification

Sentinel includes a comprehensive test suite testing both normal operations, anti-griefing false alarm dismissal, and active exploit emergency halts.

### 1. Run Automated Test Suite

```powershell
# Run the complete test suite (13/13 tests)
py -3.12 -m pytest tests/test_mock_vault.py tests/test_sentinel.py -v
```

#### Test Results:
```
============================= test session starts =============================
collected 13 items

tests/test_mock_vault.py::TestMockVault::test_vault_normal_operations PASSED [  7%]
tests/test_mock_vault.py::TestMockVault::test_emergency_halt_blocks_withdrawals_and_exploits PASSED [ 15%]
tests/test_mock_vault.py::TestMockVault::test_unauthorized_halt_reverts PASSED [ 23%]
tests/test_mock_vault.py::TestMockVault::test_owner_can_resume PASSED    [ 30%]
tests/test_sentinel.py::TestSentinelRegistration::test_initialization PASSED [ 38%]
tests/test_sentinel.py::TestSentinelRegistration::test_register_target_success PASSED [ 46%]
tests/test_sentinel.py::TestSentinelRegistration::test_register_duplicate_target_reverts PASSED [ 53%]
tests/test_sentinel.py::TestSentinelRegistration::test_invalid_threshold_reverts PASSED [ 61%]
tests/test_sentinel.py::TestSentinelRegistration::test_deposit_bounty PASSED [ 69%]
tests/test_sentinel.py::TestSentinelTriage::test_false_alarm_dismissed_and_not_halted PASSED [ 76%]
tests/test_sentinel.py::TestSentinelTriage::test_confirmed_exploit_triggers_emergency_halt_and_bounty PASSED [ 84%]
tests/test_sentinel.py::TestSentinelTriage::test_cannot_report_already_paused_target PASSED [ 92%]
tests/test_sentinel.py::TestSentinelTriage::test_manual_override_security PASSED [100%]

============================= 13 passed in 1.28s ==============================
```

### 2. GenVM Linter & Schema Verification

Both contracts are verified against the official `genvm-lint` suite:

```powershell
# Verify Sentinel contract
py -3.12 -c "from genvm_linter.cli import main; import sys; sys.argv=['genvm-lint', 'check', 'contracts/sentinel.py', '--json']; main()"

# Verify MockVault contract
py -3.12 -c "from genvm_linter.cli import main; import sys; sys.argv=['genvm-lint', 'check', 'contracts/mock_vault.py', '--json']; main()"
```

Both contracts pass validation with zero errors (`"ok": true`).

---

## 🔒 Security & Threat Model

1. **Anti-Griefing (Cost to Attack):**
   - Reporters must post a bond (`min_bond`).
   - If consensus deems the alert benign, the bond is slashed.
   - High-volume legitimate trades (e.g. 500 ETH DEX arbitrage) are correctly classified as `BENIGN_ACTIVITY` by the multi-validator prompt consensus.
2. **Deterministic State Transition:**
   - External web requests (`gl.nondet.web.get`) and AI evaluations (`gl.nondet.exec_prompt`) occur strictly inside non-deterministic blocks.
   - State mutation (pausing, bounty payouts, post-mortem logging) executes deterministically only after validator consensus has agreed.
3. **Fail-Safe Confidence Threshold:**
   - Sentinel mandates a minimum AI confidence score (≥ 80%). If LLM confidence is low or ambiguous, the alert is safely downgraded to prevent accidental protocol halts.
4. **Owner Governance Retained:**
   - Protocol owners retain full authority to unpause (`resume()`) once fixes are deployed. Sentinel only holds permission to pause, never to withdraw funds.

---

## 🏆 Hackathon Details

- **Hackathon:** GenLayer Agent Tank
- **Track:** Autonomous Protocols
- **Submission Date:** September 2026
- **License:** MIT
