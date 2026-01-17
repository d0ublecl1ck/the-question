from __future__ import annotations

from typing import Iterable, Sequence

from pydantic_ai import messages as ai_messages

from app.models.chat_message import ChatMessage
from app.models.enums import ChatRole


def _format_user_content(message: ChatMessage) -> str:
    if message.skill_id:
        return f"{message.content}\n\n[skill_id:{message.skill_id}]"
    return message.content


def build_message_history(history: Sequence[ChatMessage]) -> list[ai_messages.ModelMessage]:
    messages: list[ai_messages.ModelMessage] = []
    for item in history:
        role = item.role.value if hasattr(item.role, 'value') else item.role
        if role == ChatRole.USER.value:
            messages.append(
                ai_messages.ModelRequest(
                    parts=[ai_messages.UserPromptPart(content=_format_user_content(item))]
                )
            )
        elif role == ChatRole.ASSISTANT.value:
            messages.append(
                ai_messages.ModelResponse(
                    parts=[ai_messages.TextPart(content=item.content)],
                )
            )
        elif role == ChatRole.SYSTEM.value:
            messages.append(
                ai_messages.ModelRequest(
                    parts=[ai_messages.SystemPromptPart(content=item.content)]
                )
            )
    return messages


def trim_latest_user_message(
    history: Iterable[ChatMessage],
    *,
    latest_content: str,
    latest_skill_id: str | None,
) -> list[ChatMessage]:
    items = list(history)
    if not items:
        return items
    last = items[-1]
    last_role = last.role.value if hasattr(last.role, 'value') else last.role
    if last_role != ChatRole.USER.value:
        return items
    if last.content != latest_content:
        return items
    if latest_skill_id != last.skill_id:
        return items
    return items[:-1]
