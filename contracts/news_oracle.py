# { "Depends": "py-genlayer:1zr6nqk597d97kg0dyxg0shhrykx5v02zjgnyrajapy4wlqvfvwh" }
"""
NewsOracle – Autonomous News-Resolution Prediction Oracle
=========================================================
Validators independently fetch registered web sources and use an LLM to evaluate
whether a real-world event occurred. Consensus is reached via Optimistic Democracy
over a categorical verdict: YES | NO | UNRESOLVED | INVALID.

Equivalence strategy: custom leader/validator via gl.vm.run_nondet_unsafe.
Validators compare their independently derived categorical outcome against the
leader's proposed outcome. Stylistic differences in 'reasoning' are ignored.

Storage rules:
  - Query struct uses @dataclass + gl.storage.allow() for nested DynArray[str].
  - All persistent collections use TreeMap / DynArray (never raw dict/list).
  - Status and outcome are named string constants, not magic integers.
"""

import json
from dataclasses import dataclass

import genlayer as gl
from genlayer.storage import allow
from genlayer.types import u8, u64, Address

# ---------------------------------------------------------------------------
# Status & outcome constants (named, not magic integers)
# ---------------------------------------------------------------------------
STATUS_OPEN     = "OPEN"
STATUS_RESOLVED = "RESOLVED"
STATUS_FAILED   = "FAILED"

OUTCOME_YES        = "YES"
OUTCOME_NO         = "NO"
OUTCOME_UNRESOLVED = "UNRESOLVED"
OUTCOME_INVALID    = "INVALID"

VALID_OUTCOMES = {OUTCOME_YES, OUTCOME_NO, OUTCOME_UNRESOLVED, OUTCOME_INVALID}

# ---------------------------------------------------------------------------
# Minimum required confidence score for a verdict to be accepted (leader only).
# Validators do NOT use their own confidence to gate — they compare outcomes.
# ---------------------------------------------------------------------------
MIN_CONFIDENCE = 60


# ---------------------------------------------------------------------------
# Query dataclass — must use @allow for storage with nested DynArray
# ---------------------------------------------------------------------------
@allow
@dataclass
class Query:
    id: u64
    creator: Address
    title: str
    description: str
    source_urls: gl.storage.DynArray[str]
    resolution_timestamp: u64
    status: str
    outcome: str
    confidence: u8
    reasoning: str
    resolved_at: u64


# ---------------------------------------------------------------------------
# Intelligent Contract
# ---------------------------------------------------------------------------
class NewsOracle(gl.contract.Contract):
    """
    Autonomous News Oracle — stores resolution questions, fetches live web
    evidence inside GenVM non-deterministic blocks, and reaches on-chain
    consensus on categorical outcomes.
    """

    queries: gl.storage.TreeMap[u64, Query]
    query_count: u64
    admin: Address

    def __init__(self) -> None:
        self.query_count = 0
        self.admin = gl.message.sender_address

    # -----------------------------------------------------------------------
    # Public write: Create a new resolution query
    # -----------------------------------------------------------------------
    @gl.public.write
    def create_query(
        self,
        title: str,
        description: str,
        source_urls: list[str],
        resolution_timestamp: u64,
    ) -> u64:
        """
        Register a new yes/no resolution question with trusted news sources.

        Args:
            title: Short question label, e.g. "Did the SEC approve the SOL ETF?"
            description: Detailed resolution criteria for the LLM evaluator.
            source_urls: List of authoritative URLs validators must consult.
            resolution_timestamp: Unix timestamp (seconds) after which resolve_query is callable.

        Returns:
            The new query ID.
        """
        if not title or len(title.strip()) == 0:
            raise gl.vm.UserError("EXPECTED: title cannot be empty")
        if not source_urls or len(source_urls) == 0:
            raise gl.vm.UserError("EXPECTED: at least one source URL required")
        if len(source_urls) > 10:
            raise gl.vm.UserError("EXPECTED: maximum 10 source URLs allowed")

        current_ts = int(gl.message.datetime.timestamp())
        if resolution_timestamp <= current_ts:
            raise gl.vm.UserError("EXPECTED: resolution_timestamp must be in the future")

        query_id = self.query_count
        query = Query(
            id=query_id,
            creator=gl.message.sender_address,
            title=title,
            description=description,
            source_urls=gl.storage.DynArray[str](),
            resolution_timestamp=resolution_timestamp,
            status=STATUS_OPEN,
            outcome="",
            confidence=0,
            reasoning="",
            resolved_at=0,
        )
        for url in source_urls:
            query.source_urls.append(url)

        self.queries[query_id] = query
        self.query_count += 1
        return query_id

    # -----------------------------------------------------------------------
    # Public write: Resolve a query via AI-validator consensus
    # -----------------------------------------------------------------------
    @gl.public.write
    def resolve_query(self, query_id: u64) -> None:
        """
        Trigger resolution of a registered query.

        The non-deterministic block fetches each registered source URL, assembles
        the text, and calls an LLM to extract a structured verdict. Validators
        independently repeat this process and compare their categorical outcome
        against the leader's proposal. If the majority agrees, the outcome is
        committed on-chain; otherwise, the leader rotates.

        Raises UserError if:
          - query_id does not exist
          - query is not in OPEN status
          - resolution_timestamp has not yet passed
        """
        if query_id not in self.queries:
            raise gl.vm.UserError("EXPECTED: query does not exist")

        query = self.queries[query_id]

        if query.status != STATUS_OPEN:
            raise gl.vm.UserError("EXPECTED: query already resolved or failed")

        current_ts = int(gl.message.datetime.timestamp())
        if current_ts < query.resolution_timestamp:
            raise gl.vm.UserError("EXPECTED: resolution window not yet open")

        # Snapshot immutable values for use inside the nondet closure
        query_title = query.title
        query_description = query.description
        source_urls = [url for url in query.source_urls]

        # -----------------------------------------------------------------------
        # Non-deterministic leader function
        # All gl.nondet.* calls MUST be inside this function.
        # Storage writes MUST NOT happen here.
        # -----------------------------------------------------------------------
        def leader_fn() -> dict:
            fetched_content = []
            for url in source_urls:
                try:
                    resp = gl.nondet.web.get(url)
                    if resp.status == 200:
                        body_text = resp.body.decode("utf-8", errors="replace")
                        # Truncate to avoid enormous prompts — keep first 3000 chars
                        fetched_content.append(
                            f"[SOURCE: {url}]\n{body_text[:3000]}"
                        )
                    else:
                        fetched_content.append(
                            f"[SOURCE: {url}] HTTP {resp.status} — unavailable"
                        )
                except Exception as e:
                    fetched_content.append(
                        f"[SOURCE: {url}] FETCH_ERROR: {str(e)[:200]}"
                    )

            all_sources = "\n\n".join(fetched_content)
            if not any("[SOURCE:" in s and "HTTP" not in s and "FETCH_ERROR" not in s
                       for s in fetched_content):
                # All sources failed — return INVALID immediately
                return {
                    "outcome": OUTCOME_INVALID,
                    "confidence": 0,
                    "reasoning": "EXTERNAL: all registered sources were unreachable or returned errors",
                }

            prompt = f"""You are a fact-checking AI for a decentralized prediction oracle.

Your task:
Determine whether the following event/question can be confirmed as YES, NO, UNRESOLVED, or INVALID
based strictly on the provided web source content. Do NOT use prior training knowledge — base your
decision only on the source text below.

Question: {query_title}
Resolution criteria: {query_description}

Web source content:
---
{all_sources}
---

Respond ONLY with a valid JSON object in this exact format — no markdown, no preamble:
{{
  "outcome": "YES" | "NO" | "UNRESOLVED" | "INVALID",
  "confidence": <integer 0-100>,
  "reasoning": "<one concise sentence explaining the verdict based on source evidence>"
}}

Rules:
- Use "YES" if sources clearly confirm the event occurred.
- Use "NO" if sources clearly deny or refute the event.
- Use "UNRESOLVED" if sources are inconclusive, contradictory, or lack sufficient evidence.
- Use "INVALID" if sources are all inaccessible, off-topic, or the question is malformed.
- confidence should reflect how clearly the sources support the verdict (0=no evidence, 100=certain).
"""
            raw = gl.nondet.exec_prompt(prompt, response_format="json")

            # Defensive JSON parsing
            try:
                if isinstance(raw, dict):
                    result = raw
                elif isinstance(raw, str):
                    result = json.loads(raw.strip())
                else:
                    raise ValueError(f"Unexpected exec_prompt return type: {type(raw)}")
            except (json.JSONDecodeError, ValueError) as e:
                raise gl.vm.UserError(
                    f"LLM_ERROR: could not parse LLM response as JSON: {str(e)[:200]}"
                )

            # Validate structure
            outcome = result.get("outcome", "").strip().upper()
            confidence = result.get("confidence", 0)
            reasoning = result.get("reasoning", "").strip()

            if outcome not in VALID_OUTCOMES:
                raise gl.vm.UserError(
                    f"LLM_ERROR: invalid outcome '{outcome}' — must be one of {VALID_OUTCOMES}"
                )
            if not isinstance(confidence, int) or not (0 <= confidence <= 100):
                raise gl.vm.UserError(
                    f"LLM_ERROR: confidence must be integer 0-100, got {confidence!r}"
                )
            if confidence < MIN_CONFIDENCE and outcome not in (OUTCOME_UNRESOLVED, OUTCOME_INVALID):
                # Low-confidence non-null result → downgrade to UNRESOLVED
                outcome = OUTCOME_UNRESOLVED
                reasoning = f"[Downgraded: confidence {confidence} < {MIN_CONFIDENCE}] " + reasoning

            return {
                "outcome": outcome,
                "confidence": confidence,
                "reasoning": reasoning[:500],
            }

        # -----------------------------------------------------------------------
        # Non-deterministic validator function
        # Receives the leader's proposed result and independently checks it.
        # DO NOT gate on own confidence — compare categorical outcome only.
        # -----------------------------------------------------------------------
        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                # Leader errored — run same logic to see if we'd also error
                try:
                    leader_fn()
                    # We succeeded but leader errored → disagree
                    return False
                except gl.vm.UserError as e:
                    msg = str(e)
                    # Both hit a structural/LLM error with same prefix → agree to rotate
                    if msg.startswith("LLM_ERROR:") or msg.startswith("EXTERNAL:"):
                        return True
                    return False
                except Exception:
                    # Unknown error on both sides → agree to rotate
                    return True

            leader_data = leader_result.calldata

            # Structural rejection: leader returned unknown outcome
            leader_outcome = leader_data.get("outcome", "")
            if leader_outcome not in VALID_OUTCOMES:
                return False

            # Run our own independent analysis
            try:
                own_result = leader_fn()
            except gl.vm.UserError:
                # We errored but leader succeeded → disagree
                return False
            except Exception:
                return False

            own_outcome = own_result.get("outcome", "")

            # Core equivalence: categorical outcome must match
            return own_outcome == leader_outcome

        # -----------------------------------------------------------------------
        # Run consensus — storage writes happen AFTER this call returns
        # -----------------------------------------------------------------------
        try:
            result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        except gl.vm.UserError as e:
            # Deterministic UserError propagated out of nondet block → mark FAILED
            self.queries[query_id].status = STATUS_FAILED
            self.queries[query_id].outcome = OUTCOME_INVALID
            self.queries[query_id].reasoning = str(e)[:500]
            self.queries[query_id].resolved_at = int(gl.message.datetime.timestamp())
            return

        # -----------------------------------------------------------------------
        # Commit agreed result deterministically — AFTER consensus
        # -----------------------------------------------------------------------
        self.queries[query_id].status = STATUS_RESOLVED
        self.queries[query_id].outcome = result["outcome"]
        self.queries[query_id].confidence = result["confidence"]
        self.queries[query_id].reasoning = result["reasoning"]
        self.queries[query_id].resolved_at = int(gl.message.datetime.timestamp())

    # -----------------------------------------------------------------------
    # Public view: Get a single query by ID
    # -----------------------------------------------------------------------
    @gl.public.view
    def get_query(self, query_id: u64) -> dict:
        """Return a query's full state as a dict, or raise if not found."""
        if query_id not in self.queries:
            raise gl.vm.UserError("EXPECTED: query does not exist")
        q = self.queries[query_id]
        return {
            "id": q.id,
            "creator": str(q.creator),
            "title": q.title,
            "description": q.description,
            "source_urls": [url for url in q.source_urls],
            "resolution_timestamp": q.resolution_timestamp,
            "status": q.status,
            "outcome": q.outcome,
            "confidence": q.confidence,
            "reasoning": q.reasoning,
            "resolved_at": q.resolved_at,
        }

    # -----------------------------------------------------------------------
    # Public view: Total number of queries registered
    # -----------------------------------------------------------------------
    @gl.public.view
    def get_query_count(self) -> u64:
        """Return total number of queries ever created."""
        return self.query_count

    # -----------------------------------------------------------------------
    # Public view: Get queries filtered by status
    # -----------------------------------------------------------------------
    @gl.public.view
    def get_queries_by_status(self, status: str) -> list:
        """Return all query dicts matching the given status string."""
        if status not in (STATUS_OPEN, STATUS_RESOLVED, STATUS_FAILED):
            raise gl.vm.UserError(
                f"EXPECTED: status must be OPEN, RESOLVED, or FAILED — got '{status}'"
            )
        results = []
        for qid in self.queries:
            q = self.queries[qid]
            if q.status == status:
                results.append({
                    "id": q.id,
                    "title": q.title,
                    "status": q.status,
                    "outcome": q.outcome,
                    "confidence": q.confidence,
                    "resolved_at": q.resolved_at,
                })
        return results
