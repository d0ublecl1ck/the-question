import json

from app.core.config import settings


def _parse_models(raw: str) -> list[dict[str, str]]:
    models: list[dict[str, str]] = []
    if not raw:
        return models
    if raw.lstrip().startswith('['):
        try:
            items = json.loads(raw)
        except json.JSONDecodeError:
            return models
        if not isinstance(items, list):
            return models
        for item in items:
            if not isinstance(item, dict):
                continue
            name = str(item.get('name', '')).strip()
            code = str(item.get('code', '')).strip()
            if not name or not code:
                continue
            models.append({'id': code, 'name': name})
        return models
    for item in raw.split(','):
        entry = item.strip()
        if not entry:
            continue
        if '|' not in entry:
            continue
        name, code = (part.strip() for part in entry.split('|', 1))
        if not name or not code:
            continue
        models.append({'id': code, 'name': name})
    return models


def available_openai_models() -> list[dict[str, str]]:
    models = (
        _parse_models(settings.OPENAI_MODELS)
        if settings.OPENAI_MODELS
        else [{'id': settings.OPENAI_MODEL, 'name': settings.OPENAI_MODEL}]
    )
    return models
