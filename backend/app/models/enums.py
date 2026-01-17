from enum import StrEnum
import sqlalchemy as sa
from sqlalchemy import Column


class UserRole(StrEnum):
    USER = 'user'
    ADMIN = 'admin'


class SkillVisibility(StrEnum):
    PUBLIC = 'public'
    PRIVATE = 'private'
    UNLISTED = 'unlisted'


class SkillSuggestionStatus(StrEnum):
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    REJECTED = 'rejected'


class ChatRole(StrEnum):
    USER = 'user'
    ASSISTANT = 'assistant'
    SYSTEM = 'system'


class ReportStatus(StrEnum):
    OPEN = 'open'
    RESOLVED = 'resolved'
    DISMISSED = 'dismissed'


def enum_column(enum_cls: type[StrEnum], name: str) -> Column:
    return Column(
        sa.Enum(
            enum_cls,
            values_callable=lambda enum: [item.value for item in enum],
            name=name,
        ),
        nullable=False,
    )
