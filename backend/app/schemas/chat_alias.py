from typing import Optional
from pydantic import BaseModel


class SkillSuggestionAliasCreate(BaseModel):
    session_id: str
    skill_id: str
    message_id: Optional[str] = None
