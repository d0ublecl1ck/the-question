from __future__ import annotations

import json
from functools import lru_cache

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.core.config import settings


class ProviderModelConfig(BaseModel):
    model_config = ConfigDict(extra='forbid')

    id: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)


class ProviderConfig(BaseModel):
    model_config = ConfigDict(extra='forbid')

    host: str = Field(..., min_length=1)
    base_url: str = Field(..., min_length=1)
    api_key_env: str = Field(..., min_length=1)
    models: list[ProviderModelConfig] = Field(..., min_length=1)


class ProviderRegistry:
    def __init__(self, providers: list[ProviderConfig]) -> None:
        if not providers:
            raise RuntimeError("PROVIDERS must include at least one provider")
        self._providers = providers
        self._model_index: dict[str, ProviderConfig] = {}
        seen_hosts: set[str] = set()
        for provider in providers:
            host = provider.host.strip()
            if not host:
                raise RuntimeError("PROVIDERS contains an empty host value")
            if host in seen_hosts:
                raise RuntimeError(f"Duplicate provider host: {host}")
            seen_hosts.add(host)
            for model in provider.models:
                model_id = model.id.strip()
                if not model_id:
                    raise RuntimeError("PROVIDERS contains an empty model id")
                if model_id in self._model_index:
                    raise RuntimeError(f"Duplicate model id: {model_id}")
                self._model_index[model_id] = provider

    def list_models(self) -> list[dict[str, str]]:
        models: list[dict[str, str]] = []
        for provider in self._providers:
            for model in provider.models:
                models.append({'id': model.id, 'name': model.name, 'host': provider.host})
        return models

    def has_model(self, model_id: str) -> bool:
        return model_id in self._model_index

    def provider_for_model(self, model_id: str) -> ProviderConfig:
        provider = self._model_index.get(model_id)
        if not provider:
            raise RuntimeError(f"Model not available: {model_id}")
        return provider


def _parse_providers(raw: str) -> list[ProviderConfig]:
    if not raw or not raw.strip():
        raise RuntimeError("PROVIDERS is missing in environment or .env")
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:  # pragma: no cover - guardrail
        raise RuntimeError("PROVIDERS must be valid JSON") from exc
    if not isinstance(payload, list):
        raise RuntimeError("PROVIDERS must be a JSON array")
    try:
        providers = [ProviderConfig.model_validate(item) for item in payload]
    except ValidationError as exc:
        raise RuntimeError(f"PROVIDERS validation error: {exc}") from exc
    if not providers:
        raise RuntimeError("PROVIDERS must include at least one provider")
    return providers


@lru_cache
def get_provider_registry() -> ProviderRegistry:
    providers = _parse_providers(settings.PROVIDERS)
    return ProviderRegistry(providers)


def reset_provider_registry() -> None:
    get_provider_registry.cache_clear()


def available_models() -> list[dict[str, str]]:
    return get_provider_registry().list_models()


def is_model_available(model_id: str) -> bool:
    return get_provider_registry().has_model(model_id)
