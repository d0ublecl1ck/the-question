from enum import Enum
import sqlalchemy as sa
from sqlalchemy import Column


class UserRole(str, Enum):
    USER = 'user'
    ADMIN = 'admin'


class SkillVisibility(str, Enum):
    PUBLIC = 'public'
    PRIVATE = 'private'
    UNLISTED = 'unlisted'


class SkillSuggestionStatus(str, Enum):
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    REJECTED = 'rejected'


class ChatRole(str, Enum):
    USER = 'user'
    ASSISTANT = 'assistant'
    SYSTEM = 'system'


class ReportStatus(str, Enum):
    OPEN = 'open'
    RESOLVED = 'resolved'
    DISMISSED = 'dismissed'


def enum_column(enum_cls: type[Enum], name: str) -> Column:
    return Column(
        sa.Enum(
            enum_cls,
            values_callable=lambda enum: [item.value for item in enum],
            name=name,
        ),
        nullable=False,
    )
