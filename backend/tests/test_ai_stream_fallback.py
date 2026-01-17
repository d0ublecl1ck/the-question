import pytest

from app.models.user import User
from app.services.ai_agent import ClarifyDecision, stream_agent_text
from app.services.ai_types import AiDeps


class FakeStream:
    def __init__(self, deltas: list[str], output: str) -> None:
        self._deltas = deltas
        self._output = output

    async def __aenter__(self):  # noqa: D401
        return self

    async def __aexit__(self, exc_type, exc, tb):  # noqa: D401
        return False

    async def stream_text(self, *, delta: bool = False, debounce_by=None):  # noqa: ANN001,D401
        for item in self._deltas:
            yield item

    async def get_output(self):  # noqa: D401
        return self._output


class FakeAgent:
    def __init__(self, stream: FakeStream) -> None:
        self._stream = stream

    def run_stream(self, *args, **kwargs):  # noqa: ANN001,D401
        return self._stream


@pytest.mark.anyio
async def test_stream_agent_text_fallback_when_no_deltas(monkeypatch):
    fake_stream = FakeStream([], "fallback reply")
    fake_agent = FakeAgent(fake_stream)

    async def fake_should_trigger_clarify(*args, **kwargs):
        return ClarifyDecision(should_clarify=False, reason="test")

    monkeypatch.setattr("app.services.ai_agent.get_general_agent", lambda: fake_agent)
    monkeypatch.setattr("app.services.ai_agent._should_trigger_clarify", fake_should_trigger_clarify)
    monkeypatch.setattr("app.services.ai_agent.build_openai_chat_model", lambda _: None)

    deps = AiDeps(
        user=User(email="user@example.com", hashed_password="x"),
        session_id="s1",
        model_id="gpt-test",
        selected_skill_id=None,
        skill_content_max_len=2000,
    )

    output = ""
    async for delta in stream_agent_text(
        deps=deps,
        prompt="请给个计划",
        message_history=[],
        raw_history=[],
    ):
        output += delta

    assert output == "fallback reply"
