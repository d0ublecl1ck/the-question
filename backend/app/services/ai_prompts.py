from __future__ import annotations

from pathlib import Path


def strip_frontmatter(raw: str) -> str:
    if not raw.lstrip().startswith('---'):
        return raw.strip()
    lines = raw.splitlines()
    end_index = None
    for idx in range(1, len(lines)):
        if lines[idx].strip() == '---':
            end_index = idx
            break
    if end_index is None:
        return raw.strip()
    return '\n'.join(lines[end_index + 1 :]).strip()


def read_prompt_file(path: Path) -> str:
    try:
        content = path.read_text(encoding='utf-8', errors='replace').strip()
    except OSError:
        return ''
    if not content:
        return ''
    return strip_frontmatter(content)
