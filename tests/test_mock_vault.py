"""
Direct In-Memory Tests for MockVault Contract
==============================================
Uses gltest direct fixtures: direct_vm, direct_deploy, direct_alice, direct_bob.
"""
import pytest

CONTRACT_PATH = "contracts/mock_vault.py"


class TestMockVault:
    def test_vault_normal_operations(self, direct_vm, direct_deploy, direct_alice, direct_bob):
        direct_vm.sender = direct_alice
        vault = direct_deploy(CONTRACT_PATH, direct_bob, 500000, "Aegis Liquidity Vault")

        status = vault.get_status()
        assert status["is_paused"] is False
        assert status["total_reserves"] == 500000
        assert status["owner"] == str(direct_alice)
        assert status["guardian"] == str(direct_bob)

        # Deposit
        vault.deposit(100000)
        assert vault.get_status()["total_reserves"] == 600000

        # Withdraw
        vault.withdraw(50000)
        assert vault.get_status()["total_reserves"] == 550000

    def test_emergency_halt_blocks_withdrawals_and_exploits(
        self, direct_vm, direct_deploy, direct_alice, direct_bob
    ):
        direct_vm.sender = direct_alice
        vault = direct_deploy(CONTRACT_PATH, direct_bob, 1000000, "Aegis Liquidity Vault")

        # Sentinel guardian (Bob) triggers emergency halt
        direct_vm.sender = direct_bob
        vault.emergency_halt()
        assert vault.get_status()["is_paused"] is True

        # Withdrawals are blocked
        with direct_vm.expect_revert("VAULT_PAUSED: Emergency circuit breaker is active. Withdrawals disabled."):
            vault.withdraw(10000)

        # Deposits are blocked
        with direct_vm.expect_revert("VAULT_PAUSED: Emergency circuit breaker is active. Deposits disabled."):
            vault.deposit(5000)

        # Exploit drain is completely blocked by circuit breaker
        with direct_vm.expect_revert("CIRCUIT_BREAKER_ACTIVE: Exploit blocked by Sentinel emergency halt!"):
            vault.simulate_exploit_drain(900000)

        # Reserves remain completely safe
        assert vault.get_status()["total_reserves"] == 1000000

    def test_unauthorized_halt_reverts(self, direct_vm, direct_deploy, direct_alice, direct_bob):
        direct_vm.sender = direct_alice
        # Guardian is Alice, Bob is unauthorized
        vault = direct_deploy(CONTRACT_PATH, direct_alice, 500000, "Aegis Liquidity Vault")

        direct_vm.sender = direct_bob
        with direct_vm.expect_revert("UNAUTHORIZED: Only authorized Sentinel guardian can trigger emergency halt."):
            vault.emergency_halt()

    def test_owner_can_resume(self, direct_vm, direct_deploy, direct_alice, direct_bob):
        direct_vm.sender = direct_alice
        vault = direct_deploy(CONTRACT_PATH, direct_bob, 500000, "Aegis Liquidity Vault")

        # Guardian (Bob) halts
        direct_vm.sender = direct_bob
        vault.emergency_halt()
        assert vault.get_status()["is_paused"] is True

        # Bob cannot resume
        with direct_vm.expect_revert("UNAUTHORIZED: Only the vault owner can resume operations."):
            vault.resume()

        # Alice (Owner) resumes
        direct_vm.sender = direct_alice
        vault.resume()
        assert vault.get_status()["is_paused"] is False

        # Operations work again
        vault.deposit(20000)
        assert vault.get_status()["total_reserves"] == 520000
