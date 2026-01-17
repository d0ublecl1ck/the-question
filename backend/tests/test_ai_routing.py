from app.models.chat_message import ChatMessage
from app.models.enums import ChatRole
from app.services.ai_agent import (
    _ensure_clarify_marker,
    _force_clarify,
    should_use_skill_agent,
)


def _message(role: ChatRole, content: str) -> ChatMessage:
    return ChatMessage(session_id='s1', role=role, content=content, skill_id=None)


def test_force_clarify_recognizes_vague_prompt():
    assert _force_clarify('做个页面') is True
    assert _force_clarify('优化一下') is True
    assert _force_clarify('你好') is False


def test_should_use_skill_agent_with_selected_skill():
    assert (
        should_use_skill_agent(
            prompt='随便聊聊',
            history=[],
            selected_skill_id='skill-123',
        )
        is True
    )


def test_should_use_skill_agent_with_keywords():
    assert (
        should_use_skill_agent(
            prompt='帮我创建技能，并给一个模板',
            history=[],
            selected_skill_id=None,
        )
        is True
    )


def test_should_use_skill_agent_with_clarify_response_context():
    history = [
        _message(ChatRole.USER, '帮我生成一个技能，用于整理会议纪要'),
        _message(ChatRole.ASSISTANT, '<!-- Clarification chain --> {"clarify_chain": []}'),
    ]
    prompt = '```json\n{"clarify_chain_response": {"single_choice": "是"}}\n```'
    assert (
        should_use_skill_agent(
            prompt=prompt,
            history=history,
            selected_skill_id=None,
        )
        is True
    )


def test_ensure_clarify_marker_prefixes_json():
    payload = '{"clarify_chain": []}'
    result = _ensure_clarify_marker(payload)
    assert result.startswith('<!-- Clarification chain -->')
