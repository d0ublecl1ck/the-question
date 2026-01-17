import json

from app.api.v1.ai import _append_ai_debug_record
from app.core.config import settings


def test_append_ai_debug_record_writes_jsonl(tmp_path):
    previous = settings.AI_DEBUG_LOG_PATH
    log_path = tmp_path / 'ai-debug.jsonl'
    settings.AI_DEBUG_LOG_PATH = str(log_path)
    try:
        record = {"event": "test", "messages": [{"role": "user", "content": "hi"}]}
        _append_ai_debug_record(record)
        content = log_path.read_text(encoding='utf-8').strip()
        payload = json.loads(content)
        assert payload["event"] == "test"
        assert payload["messages"][0]["content"] == "hi"
    finally:
        settings.AI_DEBUG_LOG_PATH = previous
