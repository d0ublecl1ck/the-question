from scripts.api_test import _example_from_schema, _replace_path_params


def test_example_from_schema_email():
    schema = {"type": "string", "format": "email"}
    value = _example_from_schema(schema, {})
    assert isinstance(value, str)
    assert "@" in value


def test_replace_path_params_uses_ids():
    path = "/api/v1/skills/{skill_id}/versions"
    params = [{"name": "skill_id", "in": "path"}]
    result = _replace_path_params(path, params, {"skill_id": "skill-123"})
    assert result == "/api/v1/skills/skill-123/versions"
