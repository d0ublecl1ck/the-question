from app.core.config import settings


def _parse_models(raw: str) -> list[str]:
    return [item.strip() for item in raw.split(',') if item.strip()]


def available_openai_models() -> list[dict[str, str]]:
    models = _parse_models(settings.OPENAI_MODELS) if settings.OPENAI_MODELS else [settings.OPENAI_MODEL]
    return [{'id': model, 'label': model} for model in models]
