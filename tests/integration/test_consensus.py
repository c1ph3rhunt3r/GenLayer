"""
Integration tests for NewsOracle — runs against GenLayer Studio or GLSim.

Prerequisites:
  - GenLayer Studio running at localhost:4000, OR
  - GLSim configured in gltest.config.yaml, OR
  - genlayer network set studionet / genlayer network set bradbury

Run with:
    gltest tests/integration/ -v -s

These tests submit real transactions and wait for consensus. They exercise
the full Optimistic Democracy cycle and actual LLM / web calls.
Skip specific tests with: gltest tests/integration/ -v -s -k "not test_resolve"
"""
import pytest
from pathlib import Path
from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded

CONTRACTS_DIR = Path(__file__).parent.parent.parent / "contracts"

import time

TITLE   = "Did the SEC approve the SOL ETF before October 15, 2026?"
DESC    = (
    "Resolves YES if the U.S. Securities and Exchange Commission officially "
    "approved a spot Solana ETF before October 15, 2026. Use official SEC.gov "
    "press releases and major financial news outlets as authoritative sources."
)
SOURCES = [
    "https://www.reuters.com/markets/sec-sol-etf",
    "https://apnews.com/article/sec-sol-etf-approval",
]


@pytest.fixture(scope="module")
def oracle_contract():
    factory = get_contract_factory(
        contract_file_path=CONTRACTS_DIR / "news_oracle.py"
    )
    return factory.deploy(args=[])


def test_deploy_and_initial_state(oracle_contract):
    count = oracle_contract.get_query_count(args=[]).call()
    assert count == 0


def test_create_query_returns_id(oracle_contract):
    future_ts = int(time.time()) + 30 * 24 * 3600
    tx = oracle_contract.create_query(args=[TITLE, DESC, SOURCES, future_ts]).transact()
    assert tx_execution_succeeded(tx)
    count = oracle_contract.get_query_count(args=[]).call()
    assert count >= 1


def test_resolve_query_consensus(oracle_contract):
    """
    End-to-end resolution test. Uses a resolution timestamp 5 seconds ago
    so the query is immediately eligible. Consensus requires validators
    independently reaching the same categorical verdict.

    NOTE: This test makes real web and LLM calls — outcome depends on current
    news state. The test asserts consensus was reached (any valid outcome),
    not a specific YES/NO verdict.
    """
    past_ts = int(time.time()) - 5
    # Create a fresh query eligible for immediate resolution
    tx = oracle_contract.create_query(
        args=[TITLE, DESC, SOURCES, past_ts]
    ).transact()
    assert tx_execution_succeeded(tx)

    count = oracle_contract.get_query_count(args=[]).call()
    qid = count - 1

    # Trigger resolution — consensus may take up to ~60s on StudioNet
    tx = oracle_contract.resolve_query(args=[qid]).transact()
    assert tx_execution_succeeded(tx)

    q = oracle_contract.get_query(args=[qid]).call()
    assert q["status"] in ("RESOLVED", "FAILED")
    assert q["outcome"] in ("YES", "NO", "UNRESOLVED", "INVALID")
    assert q["resolved_at"] > 0
