"""
Direct In-Memory Tests for Sentinel Circuit Breaker Contract
============================================================
Uses gltest direct fixtures: direct_vm, direct_deploy, direct_alice, direct_bob.
"""
import json
import pytest

CONTRACT_PATH = "contracts/sentinel.py"


class TestSentinelRegistration:
    def test_initialization(self, direct_vm, direct_deploy, direct_alice):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT_PATH)
        assert contract.get_incidents_count() == 0

    def test_register_target_success(self, direct_vm, direct_deploy, direct_alice, direct_bob):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT_PATH)

        contract.register_target(direct_bob, 1000, 25)
        target = contract.get_target(direct_bob)

        assert target["target"] == str(direct_bob)
        assert target["owner"] == str(direct_alice)
        assert target["is_active"] is True
        assert target["is_paused"] is False
        assert target["bounty_balance"] == 1000
        assert target["threshold_pct"] == 25

    def test_register_duplicate_target_reverts(self, direct_vm, direct_deploy, direct_alice, direct_bob):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT_PATH)
        contract.register_target(direct_bob, 1000, 25)

        with direct_vm.expect_revert("TARGET_ALREADY_REGISTERED: This address is already enrolled."):
            contract.register_target(direct_bob, 500, 30)

    def test_invalid_threshold_reverts(self, direct_vm, direct_deploy, direct_alice, direct_bob):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT_PATH)

        with direct_vm.expect_revert("INVALID_THRESHOLD: Threshold must be between 1 and 100%."):
            contract.register_target(direct_bob, 1000, 0)

        with direct_vm.expect_revert("INVALID_THRESHOLD: Threshold must be between 1 and 100%."):
            contract.register_target(direct_bob, 1000, 105)

    def test_deposit_bounty(self, direct_vm, direct_deploy, direct_alice, direct_bob):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT_PATH)
        contract.register_target(direct_bob, 1000, 25)

        contract.deposit_bounty(direct_bob, 500)
        target = contract.get_target(direct_bob)
        assert target["bounty_balance"] == 1500


class TestSentinelTriage:
    def test_false_alarm_dismissed_and_not_halted(self, direct_vm, direct_deploy, direct_alice, direct_bob):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT_PATH)
        contract.register_target(direct_bob, 5000, 30)

        direct_vm.mock_web(
            r".*",
            {
                "status": 200,
                "body": '{"tx": "0xabc", "value": "10 ETH", "logs": []}',
            },
        )
        direct_vm.mock_llm(
            r".*",
            json.dumps({
                "is_exploit": False,
                "exploit_vector": "BENIGN_ACTIVITY",
                "loss_estimate": "$0",
                "confidence": 92,
                "reasoning": "Standard Uniswap v3 arbitrage swap; input and output tokens fully accounted for.",
            }),
        )

        incident_id = contract.report_exploit(
            direct_bob,
            "0x1111111111111111111111111111111111111111111111111111111111111111",
            "Ethereum Mainnet",
            "Suspicious 500 ETH swap through vault pool",
            "https://api.etherscan.io/api?module=proxy&action=eth_getTransactionReceipt",
        )

        assert incident_id == 1
        assert contract.is_target_paused(direct_bob) is False

        incident = contract.get_incident(incident_id)
        assert incident["is_exploit"] is False
        assert incident["action_taken"] == "REPORT_DISMISSED"
        assert incident["exploit_vector"] == "BENIGN_ACTIVITY"
        assert contract.get_target(direct_bob)["bounty_balance"] == 5000

    def test_confirmed_exploit_triggers_emergency_halt_and_bounty(
        self, direct_vm, direct_deploy, direct_alice, direct_bob
    ):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT_PATH)
        contract.register_target(direct_bob, 10000, 25)

        direct_vm.mock_web(
            r".*",
            {
                "status": 200,
                "body": '{"trace": "reentrant calls detected, reserve balance 1000000 -> 120000"}',
            },
        )
        direct_vm.mock_llm(
            r".*",
            json.dumps({
                "is_exploit": True,
                "exploit_vector": "FLASH_LOAN_DRAIN",
                "loss_estimate": "$3,200,000",
                "confidence": 98,
                "reasoning": "Attacker leveraged flash loan from Aave to manipulate spot oracle and drained 88% of vault pool.",
            }),
        )

        incident_id = contract.report_exploit(
            direct_bob,
            "0x2222222222222222222222222222222222222222222222222222222222222222",
            "Base",
            "Critical: Flash loan drain ongoing on Aegis Vault",
            "https://base.blockscout.com/api/v2/transactions/0x222",
        )

        assert incident_id == 1
        assert contract.is_target_paused(direct_bob) is True

        incident = contract.get_incident(incident_id)
        assert incident["is_exploit"] is True
        assert incident["action_taken"] == "EMERGENCY_HALT_TRIGGERED"
        assert incident["exploit_vector"] == "FLASH_LOAN_DRAIN"
        assert "$3,200,000" in incident["loss_estimate"]

        # Bounty awarded
        assert contract.get_target(direct_bob)["bounty_balance"] == 0

    def test_cannot_report_already_paused_target(self, direct_vm, direct_deploy, direct_alice, direct_bob):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT_PATH)
        contract.register_target(direct_bob, 5000, 30)
        contract.toggle_target_pause_override(direct_bob, True)

        with direct_vm.expect_revert("TARGET_ALREADY_PAUSED: Emergency halt is already in effect."):
            contract.report_exploit(
                direct_bob,
                "0x333",
                "Arbitrum",
                "Duplicate report",
                "https://api.test",
            )

    def test_manual_override_security(self, direct_vm, direct_deploy, direct_alice, direct_bob):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT_PATH)
        contract.register_target(direct_bob, 5000, 30)

        # Unauthorized user (Bob) cannot override
        direct_vm.sender = direct_bob
        with direct_vm.expect_revert("UNAUTHORIZED: Only the target owner or Sentinel admin can override."):
            contract.toggle_target_pause_override(direct_bob, True)

        # Alice (target owner) can override
        direct_vm.sender = direct_alice
        contract.toggle_target_pause_override(direct_bob, True)
        assert contract.is_target_paused(direct_bob) is True

        contract.toggle_target_pause_override(direct_bob, False)
        assert contract.is_target_paused(direct_bob) is False
