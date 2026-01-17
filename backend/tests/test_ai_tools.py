import anyio

from app.core.config import settings
from app.db.init_db import init_db
from app.db.session import engine
from app.models.enums import SkillVisibility
from app.services.ai_tools import create_skill_data, generate_skill_data, read_skill_data
from app.services.ai_types import AiDeps
from app.services.auth_service import create_user
from app.services.skill_service import get_latest_version, get_skill
from sqlmodel import Session


def _make_user(email: str):
    with Session(engine) as session:
        user = create_user(session, email, 'secret123')
        session.refresh(user)
        return user


def _run_async(func, *args, **kwargs):
    return anyio.run(lambda: func(*args, **kwargs))


def test_create_skill_data_creates_skill():
    init_db(drop_all=True)
    user = _make_user('creator@example.com')
    deps = AiDeps(
        user=user,
        session_id='s1',
        model_id='gpt-5.2-2025-12-11',
        selected_skill_id=None,
        skill_content_max_len=settings.SKILL_CONTENT_MAX_LEN,
    )

    payload = {
        'name': 'My Skill',
        'description': '用于测试创建技能',
        'tags': ['测试', '技能', 'AI'],
        'content': '## Instructions\n- Do A\n\n## Examples\n- Example',
    }

    result = _run_async(create_skill_data, deps, **payload)
    assert result['skill_id']
    assert result['version'] == 1

    with Session(engine) as session:
        skill = get_skill(session, result['skill_id'])
        assert skill is not None
        assert skill.owner_id == user.id
        assert skill.visibility == SkillVisibility.PRIVATE
        version = get_latest_version(session, skill.id)
        assert version is not None
        assert 'name: my-skill' in version.content
        assert 'description: 用于测试创建技能' in version.content


def test_read_skill_data_blocks_private_for_other_user():
    init_db(drop_all=True)
    owner = _make_user('owner@example.com')
    other = _make_user('other@example.com')
    owner_deps = AiDeps(
        user=owner,
        session_id='s1',
        model_id='gpt-5.2-2025-12-11',
        selected_skill_id=None,
        skill_content_max_len=settings.SKILL_CONTENT_MAX_LEN,
    )
    create_result = _run_async(
        create_skill_data,
        owner_deps,
        name='private-skill',
        description='仅自己可见',
        tags=['私有', '技能', '测试'],
        content='## Instructions\n- Do A\n\n## Examples\n- Example',
    )

    other_deps = AiDeps(
        user=other,
        session_id='s2',
        model_id='gpt-5.2-2025-12-11',
        selected_skill_id=None,
        skill_content_max_len=settings.SKILL_CONTENT_MAX_LEN,
    )

    try:
        _run_async(read_skill_data, other_deps, skill_id=create_result['skill_id'])
        assert False, 'expected error'
    except ValueError as exc:
        assert 'not accessible' in str(exc)


class _StubResult:
    def __init__(self, data):
        self.data = data


class _StubAgent:
    def __init__(self, data):
        self._data = data

    async def run(self, _prompt, *, model=None):
        return _StubResult(self._data)


def test_generate_skill_data_normalizes_name(monkeypatch):
    init_db(drop_all=True)
    user = _make_user('gen@example.com')
    deps = AiDeps(
        user=user,
        session_id='s1',
        model_id='gpt-5.2-2025-12-11',
        selected_skill_id=None,
        skill_content_max_len=settings.SKILL_CONTENT_MAX_LEN,
    )

    from app.services.ai_tools import GeneratedSkill

    stub = _StubAgent(
        GeneratedSkill(
            name='My Skill',
            description='生成描述',
            tags=['a', 'b', 'c'],
            visibility=SkillVisibility.PRIVATE,
            content='## Instructions\n- Step\n\n## Examples\n- Ex',
        )
    )

    monkeypatch.setattr('app.services.ai_tools._get_skill_generator_agent', lambda: stub)

    result = _run_async(generate_skill_data, deps, goal='生成一个技能')
    assert result['name'] == 'my-skill'
    assert result['visibility'] == 'private'
    assert result['content'].startswith('---')
    assert 'name: my-skill' in result['content']
    assert 'description: 生成描述' in result['content']
