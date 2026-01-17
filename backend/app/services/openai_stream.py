from __future__ import annotations

from collections.abc import AsyncGenerator

from app.core.config import settings

try:
    from openai import AsyncOpenAI
except Exception:  # pragma: no cover - optional for tests
    AsyncOpenAI = None  # type: ignore[assignment]


def _build_client() -> AsyncOpenAI:
    if AsyncOpenAI is None:
        raise RuntimeError("openai SDK is not installed")
    if not settings.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is missing in environment or .env")
    return AsyncOpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)


async def stream_chat_completion(
    *,
    model: str,
    messages: list[dict[str, str]],
) -> AsyncGenerator[str, None]:
    client = _build_client()
    stream = await client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True,
    )
    async for event in stream:
        if not event.choices:
            continue
        delta = event.choices[0].delta.content
        if delta:
            yield delta
