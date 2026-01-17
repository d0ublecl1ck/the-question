from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from app.models.user import User


@dataclass(frozen=True)
class AiDeps:
    user: User
    session_id: str
    model_id: str
    selected_skill_id: Optional[str]
    skill_content_max_len: int
