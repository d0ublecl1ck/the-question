from __future__ import annotations

from collections.abc import AsyncGenerator

from app.core.env import get_env_value
from app.core.providers import ProviderConfig, get_provider_registry

try:
    from openai import AsyncOpenAI
except Exception:  # pragma: no cover - optional for tests
    AsyncOpenAI = None  # type: ignore[assignment]


class LLMGateway:
    def __init__(self) -> None:
        self._registry = get_provider_registry()

    def _build_client(self, provider: ProviderConfig) -> AsyncOpenAI:
        if AsyncOpenAI is None:
            raise RuntimeError("openai SDK is not installed")
        api_key = get_env_value(provider.api_key_env)
        if not api_key:
            raise RuntimeError(f"{provider.api_key_env} is missing in environment or .env")
        return AsyncOpenAI(api_key=api_key, base_url=provider.base_url)

    async def stream_chat_completion(
        self,
        *,
        model: str,
        messages: list[dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        provider = self._registry.provider_for_model(model)
        client = self._build_client(provider)
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


async def stream_chat_completion(
    *,
    model: str,
    messages: list[dict[str, str]],
) -> AsyncGenerator[str, None]:
    gateway = LLMGateway()
    async for chunk in gateway.stream_chat_completion(model=model, messages=messages):
        yield chunk
