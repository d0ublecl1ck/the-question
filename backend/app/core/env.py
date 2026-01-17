from __future__ import annotations

import os
from pathlib import Path

from app.core.config import settings


def _iter_env_files() -> list[Path]:
    env_file = settings.model_config.get('env_file')
    if not env_file:
        return []
    if isinstance(env_file, (list, tuple)):
        return [Path(item) for item in env_file]
    return [Path(env_file)]


def _parse_env_line(line: str) -> tuple[str, str] | None:
    raw = line.strip()
    if not raw or raw.startswith('#'):
        return None
    if raw.startswith('export '):
        raw = raw[len('export ') :].lstrip()
    if '=' not in raw:
        return None
    key, value = raw.split('=', 1)
    key = key.strip()
    value = value.strip()
    if not key:
        return None
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        value = value[1:-1]
    return key, value


def get_env_value(key: str) -> str | None:
    value = os.getenv(key)
    if value:
        return value
    for path in _iter_env_files():
        if not path.exists():
            continue
        try:
            content = path.read_text(encoding='utf-8')
        except OSError:
            continue
        for line in content.splitlines():
            parsed = _parse_env_line(line)
            if not parsed:
                continue
            parsed_key, parsed_value = parsed
            if parsed_key == key and parsed_value:
                return parsed_value
    return None
