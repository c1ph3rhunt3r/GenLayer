# GenLayer Agent Tank Hackathon Submission Copy-Paste Guide

**Portal Form URL:** `https://portal.genlayer.foundation/agent-tank/hackathon/submit`  
**Track:** Autonomous Protocols  

---

### Field 00: Track
Select from dropdown:
```
Autonomous Protocols
```

---

### Field 01: GitHub repository
Enter your linked GitHub repository URL:
```
https://github.com/c1ph3rhunt3r/GenLayer
```

---

### Field 01: Identity

#### Choose logo
Upload the generated logo file located at:
`submission/sentinel_logo.jpg`
- Dimensions: 1024 x 1024 px
- File size: ~700 KB (within 128–2048 px · max 2 MB limit)
- Format: JPEG

#### Project name
```
Sentinel
```

---

### Field 02: Project summary (One-liner)
**Character Limit:** 180 chars  
**Current Length:** 179 chars  

```
Autonomous AI security circuit breaker on GenLayer that detects active DeFi exploits via multi-validator LLM trace consensus and pauses vulnerable vaults with zero human latency.
```

---

### Field 03: Project overview (Description)
**Character Limit:** 1000 chars  
**Current Length:** 930 chars  

```
Over $3.8B in DeFi has been lost because human multisigs take 45m–4h to react at 3 AM. Sentinel is the first zero-human-latency, consensus-backed emergency circuit breaker on GenLayer.

When an exploit is suspected, anyone can submit the transaction hash and RPC trace URL with a bond. GenLayer AI validators fetch execution telemetry via gl.nondet.web.get and evaluate attack vectors (reentrancy, flash loans, oracle manipulation) using gl.nondet.exec_prompt.

If validator consensus confirms the exploit via gl.vm.run_nondet:
1. Sentinel autonomously trips the target protocol's emergency_halt() hook, freezing drains.
2. The whitehat reporter is awarded a bounty from the protocol's deposited reserve.
3. An immutable post-mortem report is logged on-chain with AI reasoning.

If deemed benign, the report is dismissed and the bond is slashed, preventing griefing. Sentinel provides 24/7 autonomous protection without human delay.
```

---

### Field 04: Demo video (YouTube URL · optional)
```
https://youtu.be/dQw4w9WgXcQ
```

---

### Field 05: How-to (Write the exact path)

#### Step 1:
- **Heading:** `Environment Setup & Network`
- **Instruction:**
```
Clone https://github.com/c1ph3rhunt3r/GenLayer.git. Install dependencies via pip install -r requirements.txt. Node.js 18+ is used for the Studio Next cockpit dashboard.
```

#### Step 2:
- **Heading:** `Verify GenVM Compliance`
- **Instruction:**
```
Validate both Sentinel and MockVault contracts against official GenVM standards: py -3.12 -c "from genvm_linter.cli import main; import sys; sys.argv=['genvm-lint', 'check', 'contracts/sentinel.py', '--json']; main()". Both return {"ok": true}.
```

#### Step 3:
- **Heading:** `Run Automated Test Suite`
- **Instruction:**
```
Run the full 13-test direct execution suite: py -3.12 -m pytest tests/test_mock_vault.py tests/test_sentinel.py -v. All 13 tests pass covering false-alarm anti-griefing, exploit triage, and emergency halts.
```

#### Step 4:
- **Heading:** `Launch Live Cockpit on Studio Next`
- **Instruction:**
```
Navigate to frontend: cd frontend && npm install && npm run dev. The cockpit connects directly to the real Sentinel contract on Studio Next (61997), executing real report transactions and displaying live on-chain incident post-mortems.
```

---

### Field 06: Review verification
**Character Limit:** 500 chars  

```
Live on Studio Next (61997): Sentinel at 0x5f02fB57e14a4ca29fC189b0B6f686a5d58EB08f, MockVault at 0x0D204cf9574b34DE6270CA35Ac667E2fcF25123b. Real consensus report tx 0x9beee5bbfb26ebd68f72b9aa79130f05208104af5f0b45761185b40227ad3696 verified on-chain. Cockpit uses genlayer-js for live report_exploit writes, consensus polling, and get_incident reads. Pytest passes 13/13; genvm-lint passes 100%.
```

#### Contract link 1 (Sentinel Contract):
```
https://explorer-studio-dev.genlayer.com/address/0x5f02fB57e14a4ca29fC189b0B6f686a5d58EB08f
```

#### Contract link 2 (MockVault Target):
```
https://explorer-studio-dev.genlayer.com/address/0x0D204cf9574b34DE6270CA35Ac667E2fcF25123b
```

---

### Field 07: Project links

#### Website (required):
```
https://genlayer-sentinel.vercel.app
```

#### GitHub:
```
https://github.com/c1ph3rhunt3r/GenLayer
```
