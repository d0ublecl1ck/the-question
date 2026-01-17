import anyio

from app.core.config import settings
from app.db.init_db import init_db
from app.db.session import engine
from app.models.chat_message import ChatMessage
from app.models.enums import ChatRole, SkillVisibility
from app.schemas.skill import SkillCreate
from app.services.ai_skill_suggestion import SkillMatchResult, maybe_create_skill_suggestion
from app.services.ai_types import AiDeps
from app.services.auth_service import create_user
from app.services.chat_service import list_suggestions
from app.services.skill_service import create_skill
from sqlmodel import Session


def _make_user(email: str):
    with Session(engine) as session:
        user = create_user(session, email, 'secret123')
        session.refresh(user)
        return user


def _make_skill(owner_id: str, visibility: SkillVisibility = SkillVisibility.PRIVATE) -> str:
    with Session(engine) as session:
        skill, _version = create_skill(
            session,
            SkillCreate(
                name='write-paper',
                description='用于撰写论文与结构化梳理',
                visibility=visibility,
                tags=['论文', '写作', '结构化'],
                content='## Instructions\n- Step\n\n## Examples\n- Example',
            ),
            owner_id,
        )
        return skill.id


def _make_skill_named(owner_id: str, name: str, tags: list[str], visibility: SkillVisibility) -> str:
    with Session(engine) as session:
        skill, _version = create_skill(
            session,
            SkillCreate(
                name=name,
                description=f'{name} skill',
                visibility=visibility,
                tags=tags,
                content='## Instructions\n- Step\n\n## Examples\n- Example',
            ),
            owner_id,
        )
        return skill.id


class _StubResult:
    def __init__(self, data):
        self.data = data
        self.output = data


class _StubAgent:
    def __init__(self, data):
        self._data = data

    async def run(self, _prompt, *, model=None, deps=None, instructions=None):  # noqa: ARG002
        return _StubResult(self._data)


def _run_async(func, *args, **kwargs):
    return anyio.run(lambda: func(*args, **kwargs))


def test_maybe_create_skill_suggestion_creates_record(monkeypatch):
    init_db(drop_all=True)
    user = _make_user('suggest@example.com')
    skill_id = _make_skill(user.id)
    deps = AiDeps(
        user=user,
        session_id='session-1',
        model_id='gpt-5.2-2025-12-11',
        selected_skill_id=None,
        skill_content_max_len=settings.SKILL_CONTENT_MAX_LEN,
    )

    stub_agent = _StubAgent(SkillMatchResult(matched=True, skill_id=skill_id, reason='论文写作'))
    monkeypatch.setattr('app.services.ai_skill_suggestion._get_skill_match_agent', lambda: stub_agent)
    monkeypatch.setattr('app.services.ai_skill_suggestion.build_openai_chat_model', lambda _model: None)

    history = [ChatMessage(session_id=deps.session_id, role=ChatRole.USER, content='我要写论文', skill_id=None)]
    _run_async(
        maybe_create_skill_suggestion,
        deps=deps,
        prompt='我要写论文',
        history=history,
        assistant_message_id='assistant-1',
        assistant_content='好的，我来帮你规划论文结构。',
    )

    with Session(engine) as session:
        suggestions = list_suggestions(session, deps.session_id)
        assert len(suggestions) == 1
        assert suggestions[0].skill_id == skill_id
        assert suggestions[0].reason == '论文写作'


def test_maybe_create_skill_suggestion_allows_public_skills(monkeypatch):
    init_db(drop_all=True)
    owner = _make_user('system@example.com')
    user = _make_user('viewer@example.com')
    skill_id = _make_skill(owner.id, visibility=SkillVisibility.PUBLIC)
    deps = AiDeps(
        user=user,
        session_id='session-2',
        model_id='gpt-5.2-2025-12-11',
        selected_skill_id=None,
        skill_content_max_len=settings.SKILL_CONTENT_MAX_LEN,
    )

    stub_agent = _StubAgent(SkillMatchResult(matched=True, skill_id=skill_id, reason='论文写作'))
    monkeypatch.setattr('app.services.ai_skill_suggestion._get_skill_match_agent', lambda: stub_agent)
    monkeypatch.setattr('app.services.ai_skill_suggestion.build_openai_chat_model', lambda _model: None)

    history = [ChatMessage(session_id=deps.session_id, role=ChatRole.USER, content='我要写论文', skill_id=None)]
    _run_async(
        maybe_create_skill_suggestion,
        deps=deps,
        prompt='我要写论文',
        history=history,
        assistant_message_id='assistant-2',
        assistant_content='好的，我来帮你规划论文结构。',
    )

    with Session(engine) as session:
        suggestions = list_suggestions(session, deps.session_id)
        assert len(suggestions) == 1
        assert suggestions[0].skill_id == skill_id


def test_maybe_create_skill_suggestion_fallback_market_sizing(monkeypatch):
    init_db(drop_all=True)
    owner = _make_user('system2@example.com')
    user = _make_user('viewer2@example.com')
    skill_id = _make_skill_named(owner.id, 'market-sizing-analysis', ['市场规模', 'TAM', 'SAM'], SkillVisibility.PUBLIC)
    deps = AiDeps(
        user=user,
        session_id='session-3',
        model_id='gpt-5.2-2025-12-11',
        selected_skill_id=None,
        skill_content_max_len=settings.SKILL_CONTENT_MAX_LEN,
    )

    stub_agent = _StubAgent(SkillMatchResult(matched=False, skill_id=None, reason=None))
    monkeypatch.setattr('app.services.ai_skill_suggestion._get_skill_match_agent', lambda: stub_agent)
    monkeypatch.setattr('app.services.ai_skill_suggestion.build_openai_chat_model', lambda _model: None)

    history = [ChatMessage(session_id=deps.session_id, role=ChatRole.USER, content='我要做市场规模分析', skill_id=None)]
    _run_async(
        maybe_create_skill_suggestion,
        deps=deps,
        prompt='请给我TAM/SAM/SOM测算',
        history=history,
        assistant_message_id='assistant-3',
        assistant_content='好的，我可以给出市场规模分析框架。',
    )

    with Session(engine) as session:
        suggestions = list_suggestions(session, deps.session_id)
        assert len(suggestions) == 1
        assert suggestions[0].skill_id == skill_id
