# { "Depends": "py-genlayer:1zr6nqk597d97kg0dyxg0shhrykx5v02zjgnyrajapy4wlqvfvwh" }
"""
MockVault – Representative Protected DeFi Vault
===============================================
A simulated liquidity pool and lending vault that delegates emergency pause
authority to the Sentinel Autonomous Security Circuit Breaker contract.

Demonstrates how protocols integrate with Sentinel:
- Normal deposits and withdrawals function when unpaused.
- When an exploit is confirmed by GenLayer validators, Sentinel invokes emergency_halt.
- Once paused, all withdrawals and drains are completely blocked, saving user funds.
"""

import genlayer as gl
from genlayer.types import u64, Address


class MockVault(gl.contract.Contract):
    owner: Address
    guardian: Address
    total_reserves: u64
    is_paused: bool
    vault_name: str

    def __init__(
        self,
        guardian: Address,
        initial_reserves: u64 = 1000000,
        vault_name: str = "Aegis Liquidity Vault",
    ) -> None:
        self.owner = gl.message.sender_address
        self.guardian = guardian
        self.total_reserves = initial_reserves
        self.is_paused = False
        self.vault_name = vault_name

    @gl.public.write
    def emergency_halt(self) -> None:
        """
        Emergency circuit breaker hook.
        Callable only by the authorized Sentinel guardian contract or protocol owner.
        """
        sender = gl.message.sender_address
        if sender != self.guardian and sender != self.owner:
            raise gl.vm.UserError("UNAUTHORIZED: Only authorized Sentinel guardian can trigger emergency halt.")

        self.is_paused = True

    @gl.public.write
    def resume(self) -> None:
        """
        Unpauses the vault after remediation. Callable only by vault owner.
        """
        sender = gl.message.sender_address
        if sender != self.owner:
            raise gl.vm.UserError("UNAUTHORIZED: Only the vault owner can resume operations.")

        self.is_paused = False

    @gl.public.write
    def deposit(self, amount: u64) -> None:
        """
        Standard deposit. Blocked if vault is paused.
        """
        if self.is_paused:
            raise gl.vm.UserError("VAULT_PAUSED: Emergency circuit breaker is active. Deposits disabled.")
        if amount == 0:
            raise gl.vm.UserError("INVALID_AMOUNT: Deposit must be positive.")

        self.total_reserves = self.total_reserves + amount

    @gl.public.write
    def withdraw(self, amount: u64) -> None:
        """
        Standard withdrawal. Blocked if vault is paused.
        """
        if self.is_paused:
            raise gl.vm.UserError("VAULT_PAUSED: Emergency circuit breaker is active. Withdrawals disabled.")
        if amount > self.total_reserves:
            raise gl.vm.UserError("INSUFFICIENT_LIQUIDITY: Requested withdrawal exceeds available reserves.")

        self.total_reserves = self.total_reserves - amount

    @gl.public.write
    def simulate_exploit_drain(self, drain_amount: u64) -> None:
        """
        Test utility to simulate an unauthorized drain attempt.
        Fails immediately if Sentinel has triggered the emergency pause!
        """
        if self.is_paused:
            raise gl.vm.UserError("CIRCUIT_BREAKER_ACTIVE: Exploit blocked by Sentinel emergency halt!")

        if drain_amount > self.total_reserves:
            self.total_reserves = 0
        else:
            self.total_reserves = self.total_reserves - drain_amount

    @gl.public.view
    def get_status(self) -> dict:
        """
        Returns the current state and reserve balance of the vault.
        """
        return {
            "vault_name": self.vault_name,
            "owner": str(self.owner),
            "guardian": str(self.guardian),
            "total_reserves": self.total_reserves,
            "is_paused": self.is_paused,
        }
