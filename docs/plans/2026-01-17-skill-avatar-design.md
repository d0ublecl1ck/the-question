# Skill Avatar Design

## Goal
Add an optional `avatar` field to Skill as a data URL (base64) for MVP. The avatar should be returned by all skill list/search/market/detail responses, but must be excluded from skill import/export.

## Architecture
- Database: add nullable `skills.avatar` (TEXT).
- Models: add `avatar: Optional[str]` to `Skill` and the read/create/update schemas.
- API: include `avatar` in `SkillOut`/`SkillDetail`, search responses, and market skill responses.
- Import/Export: keep `SkillImport` and export payloads unchanged (no avatar field).
- Frontend: extend skill-related types to include optional `avatar` (no UI rendering required).

## Data Flow
- Create skill: `avatar` is optional; if provided, it is stored and returned.
- Update skill: `avatar` can be overwritten or cleared (set to null).
- List/search/market/detail: include `avatar` field in responses.
- Export/import: do not include `avatar` in payloads.

## Error Handling & Validation
- MVP scope: no strict validation beyond standard schema types.
- `avatar` is optional and may be omitted.
- Clearing uses explicit null in update payload.

## Testing
- Update a skill with `avatar`, verify it is returned; clear it and verify null.
- List/search/market responses include `avatar` field.
- Export response does not include `avatar`.
- Import payload ignores avatar (not accepted).
