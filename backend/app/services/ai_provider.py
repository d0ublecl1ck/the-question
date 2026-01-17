from __future__ import annotations

from dataclasses import dataclass

from loguru import logger

from app.core.env import get_env_value
from app.core.providers import get_provider_registry

try:
    from openai import AsyncOpenAI
except Exception:  # pragma: no cover - optional for tests
    AsyncOpenAI = None  # type: ignore[assignment]

from pydantic_ai.models import cached_async_http_client
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers import Provider


@dataclass(frozen=True)
class ProviderInfo:
    name: str
    base_url: str
    api_key: str


class OpenAICompatProvider(Provider[AsyncOpenAI]):
    def __init__(self, *, name: str, base_url: str, api_key: str | None) -> None:
        if AsyncOpenAI is None:
            raise RuntimeError('openai SDK is not installed')
        if api_key is None:
            api_key = 'api-key-not-set'
        http_client = cached_async_http_client(provider=name)
        self._client = AsyncOpenAI(base_url=base_url, api_key=api_key, http_client=http_client)
        self._name = name
        self._base_url = base_url

    @property
    def name(self) -> str:
        return self._name

    @property
    def base_url(self) -> str:
        return self._base_url

    @property
    def client(self) -> AsyncOpenAI:
        return self._client


def resolve_provider_info(model_id: str) -> ProviderInfo:
    registry = get_provider_registry()
    provider = registry.provider_for_model(model_id)
    api_key = get_env_value(provider.api_key_env)
    if not api_key:
        raise RuntimeError(f"{provider.api_key_env} is missing in environment or .env")
    return ProviderInfo(name=provider.host, base_url=provider.base_url, api_key=api_key)


def build_openai_chat_model(model_id: str) -> OpenAIChatModel:
    info = resolve_provider_info(model_id)
    logger.debug('ai.provider.selected', provider=info.name, model=model_id)
    provider = OpenAICompatProvider(name=info.name, base_url=info.base_url, api_key=info.api_key)
    return OpenAIChatModel(model_id, provider=provider)
