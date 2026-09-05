"""
Direct (in-memory) tests for the NewsOracle Intelligent Contract.

Run with:
    pytest tests/direct/ -v

All web and LLM calls are mocked via direct_vm.mock_web() / direct_vm.mock_llm().
No server or consensus is required — these test state transitions and access control.
"""
import json
import time
import pytest


CONTRACT_PATH = "contracts/news_oracle.py"

TITLE = "Did the SEC approve the SOL ETF before October 15, 2026?"
DESCRIPTION = (
    "Resolves YES if the U.S. Securities and Exchange Commission officially "
    "approved a spot Solana ETF before October 15, 2026. Use official SEC.gov "
    "press releases and major financial news outlets as authoritative sources."
)
SOURCES = [
    "https://www.reuters.com/markets/sec-sol-etf",
    "https://apnews.com/article/sec-sol-etf-approval",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _future_ts(days=30):
    return int(time.time()) + days * 24 * 3600


def _past_ts(hours=1):
    return int(time.time()) - hours * 3600


def _create_query(contract, direct_vm, resolution_ts=None):
    ts = resolution_ts if resolution_ts is not None else _future_ts()
    return contract.create_query(TITLE, DESCRIPTION, SOURCES, ts)


# ---------------------------------------------------------------------------
# Phase 1: Query creation
# ---------------------------------------------------------------------------

class TestCreateQuery:
    def test_create_returns_id_zero(self, direct_vm, direct_deploy, direct_alice):
        contract = direct_deploy(CONTRACT_PATH)
        direct_vm.sender = direct_alice
        qid = _create_query(contract)
        assert qid == 0

    def test_second_query_increments_id(self, direct_vm, direct_deploy, direct_alice):
        contract = direct_deploy(CONTRACT_PATH)
        direct_vm.sender = direct_alice
        qid0 = _create_query(contract)
        qid1 = _create_query(contract)
        assert qid0 == 0
        assert qid1 == 1

    def test_query_count_increments(self, direct_vm, direct_deploy, direct_alice):
        contract = direct_deploy(CONTRACT_PATH)
        direct_vm.sender = direct_alice
        _create_query(contract)
        _create_query(contract)
        assert contract.get_query_count() == 2

    def test_query_state_persisted(self, direct_vm, direct_deploy, direct_alice):
        contract = direct_deploy(CONTRACT_PATH)
        direct_vm.sender = direct_alice
        ts = _future_ts(60)
        qid = contract.create_query(TITLE, DESCRIPTION, SOURCES, ts)
        q = contract.get_query(qid)
        assert q["title"] == TITLE
        assert q["description"] == DESCRIPTION
        assert q["source_urls"] == SOURCES
        assert q["resolution_timestamp"] == ts
        assert q["status"] == "OPEN"
        assert q["outcome"] == ""

    def test_empty_title_reverts(self, direct_vm, direct_deploy, direct_alice):
        contract = direct_deploy(CONTRACT_PATH)
        direct_vm.sender = direct_alice
        with direct_vm.expect_revert("EXPECTED: title cannot be empty"):
            contract.create_query("", DESCRIPTION, SOURCES, _future_ts())

    def test_empty_sources_reverts(self, direct_vm, direct_deploy, direct_alice):
        contract = direct_deploy(CONTRACT_PATH)
        direct_vm.sender = direct_alice
        with direct_vm.expect_revert("EXPECTED: at least one source URL required"):
            contract.create_query(TITLE, DESCRIPTION, [], _future_ts())

    def test_too_many_sources_reverts(self, direct_vm, direct_deploy, direct_alice):
        contract = direct_deploy(CONTRACT_PATH)
        direct_vm.sender = direct_alice
        too_many = [f"https://source{i}.com" for i in range(11)]
        with direct_vm.expect_revert("EXPECTED: maximum 10 source URLs allowed"):
            contract.create_query(TITLE, DESCRIPTION, too_many, _future_ts())

    def test_past_timestamp_reverts(self, direct_vm, direct_deploy, direct_alice):
        contract = direct_deploy(CONTRACT_PATH)
        direct_vm.sender = direct_alice
        with direct_vm.expect_revert("EXPECTED: resolution_timestamp must be in the future"):
            contract.create_query(TITLE, DESCRIPTION, SOURCES, _past_ts())


# ---------------------------------------------------------------------------
# Phase 2: Resolution — clear YES consensus
# ---------------------------------------------------------------------------

class TestResolveYes:
    def test_resolve_yes(self, direct_vm, direct_deploy, direct_alice):
        contract = direct_deploy(CONTRACT_PATH)
        direct_vm.sender = direct_alice

        # Create query with a resolution timestamp already in the past
        ts = _past_ts(hours=1)  # already elapsed
        qid = contract.create_query(TITLE, DESCRIPTION, SOURCES, ts)

        # Mock web fetches — both sources confirm the event
        direct_vm.mock_web(
            r"https://www\.reuters\.com/.*",
            {
                "status": 200,
                "body": (
                    "The Securities and Exchange Commission today approved the first "
                    "spot Solana ETF, marking a historic milestone for crypto markets. "
                    "The approval came on September 1, 2026, well before the October deadline."
                ),
            },
        )
        direct_vm.mock_web(
            r"https://apnews\.com/.*",
            {
                "status": 200,
                "body": (
                    "AP News: SEC grants approval for Solana-based exchange-traded fund. "
                    "The decision was announced by the SEC chairman at a press conference."
                ),
            },
        )

        # Mock LLM response
        direct_vm.mock_llm(
            r".*SEC approve.*SOL ETF.*",
            json.dumps({
                "outcome": "YES",
                "confidence": 95,
                "reasoning": "Both Reuters and AP News explicitly confirm SEC approved the SOL ETF before October 15, 2026.",
            }),
        )

        contract.resolve_query(qid)
        q = contract.get_query(qid)
        assert q["status"] == "RESOLVED"
        assert q["outcome"] == "YES"
        assert q["confidence"] >= 60
        assert q["resolved_at"] > 0


# ---------------------------------------------------------------------------
# Phase 3: Resolution — clear NO consensus
# ---------------------------------------------------------------------------

class TestResolveNo:
    def test_resolve_no(self, direct_vm, direct_deploy, direct_alice):
        contract = direct_deploy(CONTRACT_PATH)
        direct_vm.sender = direct_alice

        ts = _past_ts(hours=1)
        qid = contract.create_query(TITLE, DESCRIPTION, SOURCES, ts)

        direct_vm.mock_web(
            r"https://www\.reuters\.com/.*",
            {
                "status": 200,
                "body": (
                    "The SEC has not approved any Solana ETF. Chairman issued a statement "
                    "today rejecting the application, citing insufficient investor protections."
                ),
            },
        )
        direct_vm.mock_web(
            r"https://apnews\.com/.*",
            {
                "status": 200,
                "body": (
                    "AP News: SEC rejects Solana ETF bid. The proposal was turned down "
                    "by regulators citing market manipulation concerns."
                ),
            },
        )

        direct_vm.mock_llm(
            r".*SEC approve.*SOL ETF.*",
            json.dumps({
                "outcome": "NO",
                "confidence": 91,
                "reasoning": "Reuters and AP both report explicit SEC rejection of the SOL ETF, not approval.",
            }),
        )

        contract.resolve_query(qid)
        q = contract.get_query(qid)
        assert q["status"] == "RESOLVED"
        assert q["outcome"] == "NO"


# ---------------------------------------------------------------------------
# Phase 4: Resolution — ambiguous / UNRESOLVED
# ---------------------------------------------------------------------------

class TestResolveUnresolved:
    def test_resolve_unresolved(self, direct_vm, direct_deploy, direct_alice):
        contract = direct_deploy(CONTRACT_PATH)
        direct_vm.sender = direct_alice

        ts = _past_ts(hours=1)
        qid = contract.create_query(TITLE, DESCRIPTION, SOURCES, ts)

        direct_vm.mock_web(
            r"https://www\.reuters\.com/.*",
            {
                "status": 200,
                "body": "SEC is reviewing Solana ETF applications. No decision has been announced yet.",
            },
        )
        direct_vm.mock_web(
            r"https://apnews\.com/.*",
            {
                "status": 200,
                "body": "The SEC has yet to issue a ruling on cryptocurrency ETFs for Q4 2026.",
            },
        )

        direct_vm.mock_llm(
            r".*SEC approve.*SOL ETF.*",
            json.dumps({
                "outcome": "UNRESOLVED",
                "confidence": 48,
                "reasoning": "No sources confirm or deny approval; decision appears still pending.",
            }),
        )

        contract.resolve_query(qid)
        q = contract.get_query(qid)
        assert q["status"] == "RESOLVED"
        assert q["outcome"] == "UNRESOLVED"


# ---------------------------------------------------------------------------
# Phase 5: Access control guards
# ---------------------------------------------------------------------------

class TestResolveAccessControl:
    def test_resolve_too_early_reverts(self, direct_vm, direct_deploy, direct_alice):
        contract = direct_deploy(CONTRACT_PATH)
        direct_vm.sender = direct_alice
        # Resolution timestamp is 30 days in the future — not yet open
        ts = _future_ts(days=30)
        qid = contract.create_query(TITLE, DESCRIPTION, SOURCES, ts)
        with direct_vm.expect_revert("EXPECTED: resolution window not yet open"):
            contract.resolve_query(qid)

    def test_resolve_already_resolved_reverts(self, direct_vm, direct_deploy, direct_alice):
        contract = direct_deploy(CONTRACT_PATH)
        direct_vm.sender = direct_alice

        ts = _past_ts(hours=1)
        qid = contract.create_query(TITLE, DESCRIPTION, SOURCES, ts)

        direct_vm.mock_web(r".*reuters.*", {"status": 200, "body": "SEC approved SOL ETF."})
        direct_vm.mock_web(r".*apnews.*", {"status": 200, "body": "SEC approved SOL ETF."})
        direct_vm.mock_llm(r".*", json.dumps({"outcome": "YES", "confidence": 90, "reasoning": "confirmed"}))

        contract.resolve_query(qid)  # first resolution succeeds

        with direct_vm.expect_revert("EXPECTED: query already resolved or failed"):
            contract.resolve_query(qid)  # second call must fail

    def test_nonexistent_query_reverts(self, direct_vm, direct_deploy, direct_alice):
        contract = direct_deploy(CONTRACT_PATH)
        direct_vm.sender = direct_alice
        with direct_vm.expect_revert("EXPECTED: query does not exist"):
            contract.resolve_query(999)

    def test_get_query_nonexistent_reverts(self, direct_vm, direct_deploy, direct_alice):
        contract = direct_deploy(CONTRACT_PATH)
        direct_vm.sender = direct_alice
        with direct_vm.expect_revert("EXPECTED: query does not exist"):
            contract.get_query(999)


# ---------------------------------------------------------------------------
# Phase 6: Defensive error handling
# ---------------------------------------------------------------------------

class TestDefensiveErrorHandling:
    def test_all_sources_return_500_marks_failed(self, direct_vm, direct_deploy, direct_alice):
        contract = direct_deploy(CONTRACT_PATH)
        direct_vm.sender = direct_alice

        ts = _past_ts(hours=1)
        qid = contract.create_query(TITLE, DESCRIPTION, SOURCES, ts)

        # Both sources return server errors
        direct_vm.mock_web(r".*reuters.*", {"status": 500, "body": "Internal Server Error"})
        direct_vm.mock_web(r".*apnews.*", {"status": 503, "body": "Service Unavailable"})

        # LLM should detect all sources failed and return INVALID
        direct_vm.mock_llm(
            r".*",
            json.dumps({
                "outcome": "INVALID",
                "confidence": 0,
                "reasoning": "All sources returned HTTP errors.",
            }),
        )

        contract.resolve_query(qid)
        q = contract.get_query(qid)
        # Should end up RESOLVED/INVALID or FAILED/INVALID
        assert q["status"] in ("RESOLVED", "FAILED")
        assert q["outcome"] == "INVALID"

    def test_malformed_llm_json_marks_failed(self, direct_vm, direct_deploy, direct_alice):
        contract = direct_deploy(CONTRACT_PATH)
        direct_vm.sender = direct_alice

        ts = _past_ts(hours=1)
        qid = contract.create_query(TITLE, DESCRIPTION, SOURCES, ts)

        direct_vm.mock_web(r".*reuters.*", {"status": 200, "body": "SEC approved the ETF."})
        direct_vm.mock_web(r".*apnews.*", {"status": 200, "body": "SEC approved the ETF."})

        # LLM returns non-JSON — should trigger LLM_ERROR path
        direct_vm.mock_llm(r".*", "Sure, the answer is YES, definitely.")

        contract.resolve_query(qid)
        q = contract.get_query(qid)
        # Contract should catch LLM_ERROR and mark FAILED/INVALID
        assert q["status"] in ("RESOLVED", "FAILED")
        assert q["outcome"] == "INVALID"

    def test_get_queries_by_status(self, direct_vm, direct_deploy, direct_alice):
        contract = direct_deploy(CONTRACT_PATH)
        direct_vm.sender = direct_alice

        ts = _future_ts(days=30)
        contract.create_query("Q1", DESCRIPTION, SOURCES, ts)
        contract.create_query("Q2", DESCRIPTION, SOURCES, ts)

        results = contract.get_queries_by_status("OPEN")
        assert len(results) == 2
        assert all(r["status"] == "OPEN" for r in results)

    def test_invalid_status_filter_reverts(self, direct_vm, direct_deploy, direct_alice):
        contract = direct_deploy(CONTRACT_PATH)
        direct_vm.sender = direct_alice
        with direct_vm.expect_revert("EXPECTED: status must be OPEN"):
            contract.get_queries_by_status("PENDING")
