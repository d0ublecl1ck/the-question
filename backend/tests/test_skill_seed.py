import json
from pathlib import Path

from sqlmodel import Session, select

from app.core.config import settings
from app.db.init_db import init_db
from app.db.session import engine
from app.models.enums import SkillVisibility, UserRole
from app.models.skill import Skill
from app.models.user import User
from app.services.skill_seed import load_presets, seed_market_skills


def test_seed_market_skills_creates_system_user_and_skill(tmp_path: Path):
    init_db(drop_all=True)
    payload = {
        "skills": [
            {
                "name": "write-paper",
                "description": "用于撰写论文与结构化梳理",
                "tags": ["论文", "写作"],
                "visibility": "public",
                "content": "## Instructions\n- Step\n\n## Examples\n- Example",
            }
        ]
    }
    preset_path = tmp_path / "presets.json"
    preset_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")

    presets = load_presets(preset_path)
    with Session(engine) as session:
        summary = seed_market_skills(session, presets, system_email="system@test.local")

    assert summary.created == 1

    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == "system@test.local")).first()
        assert user is not None
        assert user.role == UserRole.ADMIN
        skill = session.exec(select(Skill).where(Skill.name == "write-paper")).first()
        assert skill is not None
        assert skill.owner_id == user.id
        assert skill.visibility == SkillVisibility.PUBLIC
        assert skill.tags is not None
        assert len(skill.tags) > 0
