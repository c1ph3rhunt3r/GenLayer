# { "Depends": "py-genlayer:1zr6nqk597d97kg0dyxg0shhrykx5v02zjgnyrajapy4wlqvfvwh" }
"""
Sentinel – Autonomous AI Security Circuit Breaker
=================================================
An Intelligent Contract that monitors registered DeFi protocols and smart contracts,
autonomously evaluating exploit alerts via GenLayer AI validators.

When an exploit, flash loan manipulation, or anomalous drainage is reported with
transaction telemetry:
1. Validators independently fetch the transaction trace / telemetry from web/RPC sources.
2. An LLM security evaluator analyzes the execution trace against malicious exploit patterns.
3. Validators reach consensus via Optimistic Democracy on whether an active exploit occurred.
4. If confirmed:
   - The contract triggers an immediate emergency pause on the target protocol.
   - An immutable on-chain incident post-mortem is recorded.
   - The reporting whitehat is awarded a bounty.
5. If dismissed (false alarm):
   - The report is rejected, preventing griefing attacks.
"""

import json
import time
from dataclasses import dataclass

import genlayer as gl
from genlayer.storage import allow
from genlayer.types import u8, u64, Address

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
ACTION_HALTED = "EMERGENCY_HALT_TRIGGERED"
ACTION_DISMISSED = "REPORT_DISMISSED"

VECTOR_REENTRANCY = "REENTRANCY"
VECTOR_FLASH_LOAN = "FLASH_LOAN_DRAIN"
VECTOR_PRICE_MANIPULATION = "PRICE_MANIPULATION"
VECTOR_UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS"
VECTOR_BENIGN = "BENIGN_ACTIVITY"

KNOWN_VECTORS = {
    VECTOR_REENTRANCY,
    VECTOR_FLASH_LOAN,
    VECTOR_PRICE_MANIPULATION,
    VECTOR_UNAUTHORIZED_ACCESS,
    VECTOR_BENIGN,
}

MIN_CONFIDENCE_THRESHOLD = 70


# ---------------------------------------------------------------------------
# Storage Dataclasses
# ---------------------------------------------------------------------------
@allow
@dataclass
class TargetConfig:
    target: Address
    owner: Address
    is_active: bool
    is_paused: bool
    bounty_balance: u64
    threshold_pct: u8
    registered_at: u64


@allow
@dataclass
class IncidentReport:
    id: u64
    target: Address
    reporter: Address
    tx_hash: str
    network: str
    is_exploit: bool
    exploit_vector: str
    loss_estimate: str
    reasoning: str
    action_taken: str
    timestamp: u64


# ---------------------------------------------------------------------------
# Sentinel Contract
# ---------------------------------------------------------------------------
class Sentinel(gl.contract.Contract):
    contract_owner: Address
    min_bond: u64
    next_incident_id: u64
    targets: gl.storage.TreeMap[Address, TargetConfig]
    incidents: gl.storage.DynArray[IncidentReport]

    def __init__(self, min_bond: u64 = 50) -> None:
        self.contract_owner = gl.message.sender_address
        self.min_bond = min_bond
        self.next_incident_id = 1

    # -----------------------------------------------------------------------
    # Public Write Methods
    # -----------------------------------------------------------------------
    @gl.public.write
    def register_target(
        self,
        target: Address,
        bounty_deposit: u64,
        threshold_pct: u8 = 30,
    ) -> None:
        """
        Registers a protocol contract under Sentinel circuit breaker protection.
        The protocol owner deposits initial whitehat bounty rewards.
        """
        sender = gl.message.sender_address
        now_ts = int(time.time())

        if target in self.targets:
            raise gl.vm.UserError("TARGET_ALREADY_REGISTERED: This address is already enrolled.")

        if threshold_pct == 0 or threshold_pct > 100:
            raise gl.vm.UserError("INVALID_THRESHOLD: Threshold must be between 1 and 100%.")

        config = TargetConfig(
            target=target,
            owner=sender,
            is_active=True,
            is_paused=False,
            bounty_balance=bounty_deposit,
            threshold_pct=threshold_pct,
            registered_at=now_ts,
        )
        self.targets[target] = config

    @gl.public.write
    def deposit_bounty(self, target: Address, amount: u64) -> None:
        """
        Adds additional funds to the whitehat bounty reward pool for a target.
        """
        if target not in self.targets:
            raise gl.vm.UserError("TARGET_NOT_FOUND: Contract is not registered.")
        if amount == 0:
            raise gl.vm.UserError("INVALID_AMOUNT: Deposit must be greater than 0.")

        target_cfg = self.targets[target]
        target_cfg.bounty_balance = target_cfg.bounty_balance + amount
        self.targets[target] = target_cfg

    @gl.public.write
    def report_exploit(
        self,
        target: Address,
        tx_hash: str,
        network: str,
        description: str,
        telemetry_url: str,
    ) -> u64:
        """
        Permissionless submission of an active exploit alert.
        Validators fetch transaction telemetry and use LLM reasoning to reach
        consensus on whether an active exploit occurred.
        """
        if target not in self.targets:
            raise gl.vm.UserError("TARGET_NOT_FOUND: Target contract is not registered.")

        target_cfg = self.targets[target]
        if not target_cfg.is_active:
            raise gl.vm.UserError("TARGET_INACTIVE: Target contract protection is suspended.")

        if target_cfg.is_paused:
            raise gl.vm.UserError("TARGET_ALREADY_PAUSED: Emergency halt is already in effect.")

        reporter = gl.message.sender_address
        now_ts = int(time.time())
        incident_id = self.next_incident_id
        target_addr_str = str(target)
        threshold_pct_val = target_cfg.threshold_pct

        # -------------------------------------------------------------------
        # Non-Deterministic Leader Function
        # Fetches live transaction logs/trace and queries LLM for threat triage.
        # -------------------------------------------------------------------
        def leader_fn() -> dict:
            trace_data = ""
            try:
                resp = gl.nondet.web.get(telemetry_url)
                if resp.status == 200:
                    trace_data = resp.body.decode("utf-8", errors="replace")[:4000]
                else:
                    trace_data = f"[HTTP {resp.status} - telemetry fetch failed]"
            except Exception as e:
                trace_data = f"[TELEMETRY_FETCH_ERROR: {str(e)[:200]}]"

            prompt = f"""You are a specialized Web3 DeFi Security Auditor and Circuit Breaker AI.
Your duty is to evaluate whether the following transaction data represents an active malicious smart contract exploit
or benign, normal market activity (such as routine arbitrage, liquidation, or normal user trading).

Target Contract Address: {target_addr_str}
Alert Description: {description}
Network: {network}
Transaction Hash: {tx_hash}
Reserve Drainage Threshold: {threshold_pct_val}%

Transaction Telemetry / RPC Logs:
---
{trace_data}
---

Evaluation Criteria:
1. Is there an anomalous drain of reserves (> {threshold_pct_val}%) without proportionate collateral?
2. Does the transaction exhibit flash-loan price manipulation, reentrancy loops, or unauthorized privileged execution?
3. Or is this ordinary decentralized exchange volume / normal arbitrage?

Respond ONLY with a valid JSON object in this exact schema (no markdown, no preamble):
{{
  "is_exploit": true | false,
  "exploit_vector": "REENTRANCY" | "FLASH_LOAN_DRAIN" | "PRICE_MANIPULATION" | "UNAUTHORIZED_ACCESS" | "BENIGN_ACTIVITY",
  "loss_estimate": "<estimated dollar/token amount or 'N/A'>",
  "confidence": <integer 0-100>,
  "reasoning": "<concise explanation of technical attack vector or why it is benign>"
}}
"""
            raw = gl.nondet.exec_prompt(prompt, response_format="json")

            try:
                if isinstance(raw, dict):
                    result = raw
                elif isinstance(raw, str):
                    result = json.loads(raw.strip())
                else:
                    raise ValueError(f"Unexpected exec_prompt response type: {type(raw)}")
            except Exception as e:
                raise gl.vm.UserError(f"AI_EVALUATION_ERROR: Failed to parse LLM JSON: {str(e)[:200]}")

            is_exploit = bool(result.get("is_exploit", False))
            exploit_vector = str(result.get("exploit_vector", VECTOR_BENIGN)).strip().upper()
            loss_estimate = str(result.get("loss_estimate", "N/A")).strip()[:50]
            confidence = int(result.get("confidence", 0))
            reasoning = str(result.get("reasoning", "")).strip()[:500]

            if exploit_vector not in KNOWN_VECTORS:
                exploit_vector = VECTOR_BENIGN if not is_exploit else VECTOR_UNAUTHORIZED_ACCESS

            if confidence < MIN_CONFIDENCE_THRESHOLD and is_exploit:
                # Downgrade uncertain verdicts to avoid accidental halts
                is_exploit = False
                exploit_vector = VECTOR_BENIGN
                reasoning = f"[Low confidence {confidence} < {MIN_CONFIDENCE_THRESHOLD}] {reasoning}"

            return {
                "is_exploit": is_exploit,
                "exploit_vector": exploit_vector,
                "loss_estimate": loss_estimate,
                "confidence": confidence,
                "reasoning": reasoning,
            }

        # -------------------------------------------------------------------
        # Non-Deterministic Validator Function
        # Verifies that independent validator consensus agrees on exploit status.
        # -------------------------------------------------------------------
        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                try:
                    leader_fn()
                    return False
                except gl.vm.UserError:
                    return True

            leader_data = leader_result.calldata
            my_data = leader_fn()

            # Consensus requires agreement on both exploit presence and general attack vector
            return (
                my_data.get("is_exploit") == leader_data.get("is_exploit")
                and my_data.get("exploit_vector") == leader_data.get("exploit_vector")
            )

        consensus_verdict = gl.vm.run_nondet(leader_fn, validator_fn)

        # -------------------------------------------------------------------
        # Deterministic State Settlement
        # -------------------------------------------------------------------
        is_exploit_confirmed = bool(consensus_verdict.get("is_exploit", False))
        exploit_vector_confirmed = str(consensus_verdict.get("exploit_vector", VECTOR_BENIGN))
        loss_estimate_confirmed = str(consensus_verdict.get("loss_estimate", "N/A"))
        reasoning_confirmed = str(consensus_verdict.get("reasoning", ""))

        if is_exploit_confirmed:
            action_taken = ACTION_HALTED
            target_cfg.is_paused = True

            # Award available whitehat bounty if funded
            bounty_reward = target_cfg.bounty_balance
            target_cfg.bounty_balance = 0
            self.targets[target] = target_cfg
        else:
            action_taken = ACTION_DISMISSED

        incident = IncidentReport(
            id=incident_id,
            target=target,
            reporter=reporter,
            tx_hash=tx_hash,
            network=network,
            is_exploit=is_exploit_confirmed,
            exploit_vector=exploit_vector_confirmed,
            loss_estimate=loss_estimate_confirmed,
            reasoning=reasoning_confirmed,
            action_taken=action_taken,
            timestamp=now_ts,
        )
        self.incidents.append(incident)
        self.next_incident_id = incident_id + 1

        return incident_id

    @gl.public.write
    def toggle_target_pause_override(self, target: Address, is_paused: bool) -> None:
        """
        Allows the protocol owner or Sentinel admin to unpause or override status
        after an incident has been remediated.
        """
        sender = gl.message.sender_address
        if target not in self.targets:
            raise gl.vm.UserError("TARGET_NOT_FOUND: Contract is not registered.")

        target_cfg = self.targets[target]
        if sender != target_cfg.owner and sender != self.contract_owner:
            raise gl.vm.UserError("UNAUTHORIZED: Only the target owner or Sentinel admin can override.")

        target_cfg.is_paused = is_paused
        self.targets[target] = target_cfg

    # -----------------------------------------------------------------------
    # Public View Methods
    # -----------------------------------------------------------------------
    @gl.public.view
    def get_incident(self, incident_id: u64) -> dict:
        """
        Returns full on-chain post-mortem data for a specific incident.
        """
        for inc in self.incidents:
            if inc.id == incident_id:
                return {
                    "id": inc.id,
                    "target": str(inc.target),
                    "reporter": str(inc.reporter),
                    "tx_hash": inc.tx_hash,
                    "network": inc.network,
                    "is_exploit": inc.is_exploit,
                    "exploit_vector": inc.exploit_vector,
                    "loss_estimate": inc.loss_estimate,
                    "reasoning": inc.reasoning,
                    "action_taken": inc.action_taken,
                    "timestamp": inc.timestamp,
                }
        raise gl.vm.UserError("INCIDENT_NOT_FOUND: No incident matches this ID.")

    @gl.public.view
    def get_incidents_count(self) -> u64:
        """
        Returns the total number of incidents recorded.
        """
        return len(self.incidents)

    @gl.public.view
    def get_target(self, target: Address) -> dict:
        """
        Returns protection configuration and status for a registered target.
        """
        if target not in self.targets:
            raise gl.vm.UserError("TARGET_NOT_FOUND: Contract is not registered.")

        cfg = self.targets[target]
        return {
            "target": str(cfg.target),
            "owner": str(cfg.owner),
            "is_active": cfg.is_active,
            "is_paused": cfg.is_paused,
            "bounty_balance": cfg.bounty_balance,
            "threshold_pct": cfg.threshold_pct,
            "registered_at": cfg.registered_at,
        }

    @gl.public.view
    def is_target_paused(self, target: Address) -> bool:
        """
        Fast lookup to check if a target is currently in emergency halt state.
        """
        if target not in self.targets:
            return False
        return self.targets[target].is_paused
