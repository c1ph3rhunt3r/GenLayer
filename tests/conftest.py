"""
Shared pytest fixtures and environment setup for GenLayer Intelligent Contracts.
Provides direct-mode compatibility adapters for GenLayer SDK v0.3.0.
"""
import sys
import os
import glob
from pathlib import Path
import pytest

# 1. Ensure GenVM SDK is in sys.path
sdk_pattern = os.path.expanduser(r"~/.cache/genvm-linter/extracted/*/py-lib-genlayer-std/*")
sdk_matches = glob.glob(sdk_pattern)
if sdk_matches:
    sdk_path = sdk_matches[0]
    if sdk_path not in sys.path:
        sys.path.insert(0, sdk_path)
else:
    fallback = r"C:\Users\USER\.cache\genvm-linter\extracted\v0.3.0-rc7.tar\py-lib-genlayer-std\10pqy9vk4a8w8pg25py83s23k3mjjy7dwpdqjvqggb9ms7ycipvh"
    if os.path.exists(fallback) and fallback not in sys.path:
        sys.path.insert(0, fallback)

# Ensure project root is in sys.path
project_root = str(Path(__file__).parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# 2. Setup module aliases for gltest backward-compatibility
import genlayer
import genlayer.types
import genlayer.calldata
import genlayer.storage
import genlayer.storage._internal.generate
import genlayer.message
import genlayer.contract

sys.modules['genlayer.py'] = genlayer
sys.modules['genlayer.py.types'] = genlayer.types
sys.modules['genlayer.py.calldata'] = genlayer.calldata
sys.modules['genlayer.py.storage'] = genlayer.storage
sys.modules['genlayer.py.storage._internal'] = genlayer.storage._internal
sys.modules['genlayer.py.storage._internal.generate'] = genlayer.storage._internal.generate
sys.modules['genlayer.gl'] = genlayer
sys.modules['genlayer.gl.vm'] = genlayer.vm

# Connect direct wasi mock gl_call to GenLayer SDK gl_call
import genlayer._internal.on_chain.gl_call as gl_call_mod
import gltest.direct.wasi_mock as wm
import json as _json

gl_call_mod._imp_raw = wm.gl_call

_orig_handle_llm = wm._handle_llm_request
def _patched_handle_llm_request(vm, data):
    prompt = data.get("prompt", "")
    response = vm._match_llm_mock(prompt)
    if response is not None:
        if isinstance(response, dict):
            response = _json.dumps(response)
        return {"ok": response}
    return _orig_handle_llm(vm, data)

wm._handle_llm_request = _patched_handle_llm_request

# 3. Patch gltest VMContext._refresh_gl_message to sync genlayer.message
from gltest.direct.vm import VMContext

def _patched_refresh_gl_message(self) -> None:
    try:
        import genlayer.message as gm
        from genlayer.types import Address, u256

        sender = self.sender
        if sender is not None:
            if isinstance(sender, bytes):
                sender = Address(sender)
            elif hasattr(sender, 'as_bytes'):
                sender = Address(sender.as_bytes)
            gm.sender_address = sender

        origin = self.origin
        if origin is not None:
            if isinstance(origin, bytes):
                origin = Address(origin)
            elif hasattr(origin, 'as_bytes'):
                origin = Address(origin.as_bytes)
            gm.origin_address = origin

        if self._contract_address is not None:
            c = self._contract_address
            if isinstance(c, bytes):
                c = Address(c)
            gm.contract_address = c

        if hasattr(self, '_value') and self._value is not None:
            gm.value = u256(self._value)

        if hasattr(self, '_chain_id') and self._chain_id is not None:
            gm.chain_id = u256(self._chain_id)
    except Exception:
        pass

VMContext._refresh_gl_message = _patched_refresh_gl_message

# 4. Patch gltest loader to support GenLayer SDK v0.3.0 storage and multi-test execution
import gltest.direct.loader as gl_loader

# On Windows, duplicating fd to stdin and unlinking immediately fails with WinError 32.
# In SDK v0.3.0, message context is injected directly into genlayer.message anyway.
gl_loader._inject_message_to_fd0 = lambda vm: None

_orig_load_module = gl_loader._load_module

def _patched_load_module(contract_path: Path):
    # Reset known contract before compiling/executing a new contract class
    if 'genlayer.contract' in sys.modules:
        sys.modules['genlayer.contract'].__known_contract__ = None
    return _orig_load_module(contract_path)

gl_loader._load_module = _patched_load_module

def _patched_allocate_contract(contract_cls, vm, *args, **kwargs):
    from genlayer.storage._internal.generate import (
        _known_descs,
        ROOT_SLOT_ID,
        ORIGINAL_INIT_ATTR,
        generate_storage,
    )

    desc = _known_descs.get(contract_cls)
    if desc is None:
        generate_storage(contract_cls)
        desc = _known_descs[contract_cls]

    slot = vm._storage.get_store_slot(ROOT_SLOT_ID)
    instance = desc.get(slot, 0)

    # Sync message context before calling constructor
    vm._refresh_gl_message()

    init = getattr(contract_cls, '__init__', None)
    if init is not None:
        if hasattr(init, ORIGINAL_INIT_ATTR):
            init = getattr(init, ORIGINAL_INIT_ATTR)
        init(instance, *args, **kwargs)

    return instance

gl_loader._allocate_contract = _patched_allocate_contract

# 5. Reset contract state between test functions
@pytest.fixture(autouse=True)
def reset_genvm_state():
    if 'genlayer.contract' in sys.modules:
        sys.modules['genlayer.contract'].__known_contract__ = None
    yield
    if 'genlayer.contract' in sys.modules:
        sys.modules['genlayer.contract'].__known_contract__ = None
