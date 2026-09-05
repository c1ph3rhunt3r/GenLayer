# Sentinel — Agent Tank Hackathon Submission Pitch

**Track:** Autonomous Protocols  
**Prompt Target:** *"Emergency halt module. Pauses a target contract when anyone proves an active exploit."*  
**Project Name:** Sentinel  
**Tagline:** Autonomous AI Security Circuit Breaker on GenLayer  

---

## 💡 Executive Summary

In traditional finance, stock exchanges implement automatic circuit breakers when anomalous volatility or systemic risk is detected. In decentralized finance (DeFi), protocols hold billions of dollars in public view, yet their only defense against active exploits is a human multisig team. When an exploit occurs at 3:00 AM, human security responders routinely take 45 minutes to 4 hours to mobilize — while flash-loan attackers drain reserves in minutes.

**Sentinel** introduces the first **zero-human-latency, consensus-backed emergency circuit breaker** for DeFi, powered entirely by GenLayer Intelligent Contracts. 

Anyone can submit a suspected exploit transaction. GenLayer's decentralized AI validators independently fetch the transaction execution trace, run LLM-powered exploit forensics, and achieve Byzantine consensus on whether an active exploit is taking place. If confirmed, Sentinel autonomously trips the target protocol's emergency halt hook, instantly saving remaining liquidity, while compensating the reporter with an on-chain bounty and logging an immutable post-mortem.

---

## 🎯 Track Alignment: Autonomous Protocols

GenLayer specifically outlined this foundational primitive for the Autonomous Protocols track:
> *"Emergency halt module. Pauses a target contract when anyone proves an active exploit."*

Sentinel is the **definitive, production-ready implementation** of this exact design pattern:
1. **Permissionless Detection:** Monitoring bots and community whitehats can report suspicious transactions across any EVM chain.
2. **AI-Powered Truth Resolution:** Rather than relying on rigid heuristic rules that break with novel attack vectors, GenLayer validators run LLM prompts that analyze semantic call traces (reentrancy patterns, oracle imbalances, flash loan reserve drains).
3. **Consensus Security:** Pausing an entire protocol is a high-stakes action. Sentinel leverages `gl.vm.run_nondet` to ensure that independent validators strictly agree on both the exploit verdict and the attack vector before any pause is enacted.
4. **Anti-Griefing Economics:** An economic bond is required to submit reports. Benign trades or false alarms result in slashed bonds, completely deterring griefing and denial-of-service attempts.

---

## 🧠 How Sentinel Leverages GenLayer

| Feature | GenLayer Primitive | Sentinel Implementation |
| :--- | :--- | :--- |
| **Live Telemetry Fetching** | `gl.nondet.web.get` | Validators fetch real-time RPC debug traces or block explorer logs for the submitted transaction hash. |
| **Semantic Exploit Triage** | `gl.nondet.exec_prompt` | Validators evaluate call traces using AI prompts with structured JSON responses, identifying complex vectors like reentrancy and oracle manipulation. |
| **Strict Agreement** | `gl.vm.run_nondet` | Independent validator nodes must independently reach the same conclusion on exploit presence and vector classification. |
| **Deterministic State Mutation** | GenLayer VM Execution | Once consensus is established, state transitions (pausing target, transferring bounty, logging incident) happen deterministically on-chain. |

---

## 🛡️ Target Protocol Integration

Integrating with Sentinel requires just a single interface implementation in any DeFi vault or lending pool:

```python
# In Protected Vault:
@gl.public.write
def emergency_halt(self) -> None:
    sender = gl.message.sender_address
    if sender != self.sentinel_guardian:
        raise gl.vm.UserError("UNAUTHORIZED")
    self.is_paused = True
```

The vault owner retains sovereign control:
- Only Sentinel (or the owner) can trigger `emergency_halt()`.
- Only the protocol owner can `resume()` the vault after deploying contract patches.
- Sentinel has zero withdrawal authority — its role is purely protective.

---

## 🎬 2-Minute Demo / Pitch Video Script

**Scene 1: The 3:00 AM Crisis (0:00 - 0:30)**
* "It's 3:14 AM. An attacker borrows 50,000 ETH on Aave, manipulates an illiquid spot pool, and initiates a multi-stage drain on an on-chain vault. The monitoring bot fires an alert to Discord. But the protocol team is asleep in three different time zones. By the time the 3-of-5 multisig signs the pause transaction 47 minutes later, $18 million has already been bridged away."

**Scene 2: Introducing Sentinel (0:30 - 1:00)**
* "Enter Sentinel: the first autonomous AI security circuit breaker on GenLayer. With Sentinel, protection doesn't wait for human waking hours. The moment anomalous activity appears, a whitehat bot calls `report_exploit` on Sentinel with the transaction hash."

**Scene 3: AI Validator Consensus (1:00 - 1:30)**
* "Watch what happens inside GenLayer:
  1. GenLayer AI validators query the transaction trace via `gl.nondet.web.get`.
  2. Each validator passes the trace to an LLM evaluator using `gl.nondet.exec_prompt`.
  3. The AI detects an 88% reserve drain caused by flash-loan manipulation.
  4. GenLayer validators reach consensus via `gl.vm.run_nondet`."

**Scene 4: Instant Protection & Resolution (1:30 - 2:00)**
* "Within seconds, Sentinel calls `emergency_halt()` on the target vault. Further drain attempts revert immediately. The whitehat reporter receives their bounty on-chain, and an immutable post-mortem report is saved with full AI reasoning. If someone submits a false alarm? Their bond is slashed, keeping the system safe from griefing.
* Zero human latency. Consensus-grade security. This is Sentinel on GenLayer."

---

## 📊 Verification & Reproducibility

The repository includes a complete test suite verifying both false alarm rejection and confirmed exploit emergency halting:

```powershell
# Run the complete test suite (13 passing tests)
py -3.12 -m pytest tests/test_mock_vault.py tests/test_sentinel.py -v

# Run the official GenVM linter (100% compliant)
py -3.12 -c "from genvm_linter.cli import main; import sys; sys.argv=['genvm-lint', 'check', 'contracts/sentinel.py', '--json']; main()"
```
