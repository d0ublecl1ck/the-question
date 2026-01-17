import anyio

from app.core.config import settings
from app.db.init_db import init_db
from app.db.session import engine
from app.models.chat_message import ChatMessage
from app.models.enums import ChatRole
from app.services.ai_skill_draft_suggestion import SkillDraftSuggestionResult, maybe_create_skill_draft_suggestion
from app.services.ai_types import AiDeps
from app.services.auth_service import create_user
from app.services.skill_draft_suggestion_service import list_skill_draft_suggestions
from sqlmodel import Session


class _StubResult:
    def __init__(self, data):
        self.data = data
        self.output = data


class _StubAgent:
    def __init__(self, data):
        self._data = data

    async def run(self, _prompt, *, model=None, deps=None):  # noqa: ARG002
        return _StubResult(self._data)


def _run_async(func, *args, **kwargs):
    return anyio.run(lambda: func(*args, **kwargs))


def _make_user(email: str):
    with Session(engine) as session:
        user = create_user(session, email, 'secret123')
        session.refresh(user)
        return user


def test_maybe_create_skill_draft_suggestion_creates_record(monkeypatch):
    init_db(drop_all=True)
    user = _make_user('draft@example.com')
    deps = AiDeps(
        user=user,
        session_id='session-draft',
        model_id='gpt-5.2-2025-12-11',
        selected_skill_id=None,
        skill_content_max_len=settings.SKILL_CONTENT_MAX_LEN,
    )

    stub_agent = _StubAgent(
        SkillDraftSuggestionResult(
            should_suggest=True,
            goal='市场规模分析流程',
            constraints='中国/B2C/未来3年',
            reason='流程可复用',
        )
    )
    monkeypatch.setattr('app.services.ai_skill_draft_suggestion._get_skill_draft_agent', lambda: stub_agent)
    monkeypatch.setattr('app.services.ai_skill_draft_suggestion.build_openai_chat_model', lambda _model: None)

    history = [
        ChatMessage(session_id=deps.session_id, role=ChatRole.USER, content='请帮我做市场规模分析', skill_id=None),
        ChatMessage(session_id=deps.session_id, role=ChatRole.ASSISTANT, content='这里是分析步骤...', skill_id=None),
    ]
    _run_async(
        maybe_create_skill_draft_suggestion,
        deps=deps,
        prompt='请帮我做市场规模分析',
        history=history,
        assistant_message_id='assistant-1',
        assistant_content='步骤一...\n步骤二...\n步骤三...\n' * 20,
    )

    with Session(engine) as session:
        suggestions = list_skill_draft_suggestions(session, deps.session_id)
        assert len(suggestions) == 1
        assert suggestions[0].goal == '市场规模分析流程'
        assert suggestions[0].constraints == '中国/B2C/未来3年'
        assert suggestions[0].reason == '流程可复用'
