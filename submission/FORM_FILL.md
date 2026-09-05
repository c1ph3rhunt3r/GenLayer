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
https://github.com/<YOUR_GITHUB_USERNAME>/GenLayer-Sentinel
```
*(Make sure this repo is public and pushed to your linked GitHub account)*

---

### Field 01: Identity

#### Choose logo
Upload the generated logo file located at:
`c:\Users\USER\Documents\DEV\GenLayer\submission\sentinel_logo.jpg`
- Dimensions: 1024 x 1024 px
- File size: 705 KB (within 128–2048 px · max 2 MB limit)
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
*(Optional — you can add your YouTube link or leave blank)*

---

### Field 05: How-to (Write the exact path)

#### Step 1:
- **Heading:** `Environment Setup`
- **Instruction:**
```
Clone the repository and install dependencies with Python 3.12: pip install -r requirements.txt. Ensure Node.js 18+ is installed for the frontend dashboard.
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
Run the full 13-test direct execution suite: py -3.12 -m pytest tests/test_mock_vault.py tests/test_sentinel.py -v. All 13 tests pass in ~1.3s covering false-alarm anti-griefing, exploit triage, and emergency halts.
```

#### Step 4:
- **Heading:** `Launch Interactive Dashboard`
- **Instruction:**
```
Navigate to the frontend directory: cd frontend && npm install && npm run dev. Open http://localhost:5173 to test live threat triage simulations (flash loan drains vs benign arbitrage).
```

---

### Field 06: Review verification
**Character Limit:** 500 chars  
**Current Length:** 397 chars  

```
Running pytest executes all 13 direct tests with 100% pass rate in ~1.3s. This verifies: target registration, bounty deposits, anti-griefing false alarm dismissal (vault stays unpaused), active flash loan exploit confirmation via validator LLM consensus, autonomous emergency halt invocation, bounty disbursement, and immutable post-mortem generation. Both contracts pass genvm-lint with ok: true.
```

#### Contract link 1 (optional):
*(Optional — GenLayer Studio/Bradbury/Asimov contract address if deployed on StudioNet or Asimov, or leave blank for local tests)*

---

### Field 07: Project links

#### Website (required):
```
https://<your-username>.github.io/GenLayer-Sentinel/
```
*(or your Vercel deployment link, or `http://localhost:5173` / deployed preview link)*

#### GitHub:
```
https://github.com/<YOUR_GITHUB_USERNAME>/GenLayer-Sentinel
```
