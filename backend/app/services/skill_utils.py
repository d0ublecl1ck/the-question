from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterable

from app.models.enums import SkillVisibility

SKILL_NAME_REGEX = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')


@dataclass(frozen=True)
class SkillNameResult:
    name: str
    normalized: bool


def normalize_skill_name(value: str) -> SkillNameResult:
    raw = value.strip().lower()
    raw = re.sub(r'\s+', '-', raw)
    raw = re.sub(r'[^a-z0-9-]', '-', raw)
    raw = re.sub(r'-{2,}', '-', raw).strip('-')
    if not raw:
        raise ValueError('skill name is required')
    normalized = raw != value
    return SkillNameResult(name=raw, normalized=normalized)


def ensure_skill_name(value: str) -> SkillNameResult:
    result = normalize_skill_name(value)
    if not SKILL_NAME_REGEX.match(result.name):
        raise ValueError('skill name must use lowercase letters, numbers, and hyphens only')
    return result


def clean_tags(tags: Iterable[str]) -> list[str]:
    cleaned: list[str] = []
    seen = set()
    for item in tags:
        tag = str(item).strip()
        if not tag:
            continue
        if tag in seen:
            continue
        cleaned.append(tag)
        seen.add(tag)
    return cleaned


def upsert_frontmatter(content: str, *, name: str, description: str) -> str:
    stripped = content.lstrip()
    if not stripped.startswith('---'):
        frontmatter = [
            '---',
            f'name: {name}',
            f'description: {description}',
            '---',
            '',
        ]
        return '\n'.join(frontmatter) + stripped

    lines = stripped.splitlines()
    end_index = None
    for idx in range(1, len(lines)):
        if lines[idx].strip() == '---':
            end_index = idx
            break
    if end_index is None:
        frontmatter = [
            '---',
            f'name: {name}',
            f'description: {description}',
            '---',
            '',
        ]
        return '\n'.join(frontmatter) + stripped

    frontmatter_lines = lines[1:end_index]

    def _replace_or_insert(key: str, value: str) -> None:
        for i, line in enumerate(frontmatter_lines):
            if line.strip().startswith(f'{key}:'):
                frontmatter_lines[i] = f'{key}: {value}'
                return
        frontmatter_lines.insert(0, f'{key}: {value}')

    _replace_or_insert('name', name)
    _replace_or_insert('description', description)

    merged = ['---', *frontmatter_lines, '---']
    body = '\n'.join(lines[end_index + 1 :]).lstrip('\n')
    if body:
        merged.append('')
        merged.append(body)
    return '\n'.join(merged)


def ensure_skill_content(content: str, *, name: str, description: str, max_len: int) -> str:
    updated = upsert_frontmatter(content.strip(), name=name, description=description)
    if len(updated) > max_len:
        raise ValueError('skill content exceeds max length')
    return updated


def ensure_visibility(value: SkillVisibility | None) -> SkillVisibility:
    return value or SkillVisibility.PRIVATE
