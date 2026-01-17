#!/usr/bin/env python3
import argparse
import json
import random
import string
from datetime import datetime
from typing import Any

import requests


def _rand_suffix(length: int = 8) -> str:
    return ''.join(random.choice(string.ascii_lowercase + string.digits) for _ in range(length))


def _safe_json(response: requests.Response) -> Any:
    try:
        return response.json()
    except Exception:
        return None


def _resolve_ref(ref: str, components: dict) -> dict:
    ref_key = ref.replace('#/components/schemas/', '')
    return components.get(ref_key, {})


def _example_from_schema(schema: dict, components: dict) -> Any:
    if not schema:
        return None
    if '$ref' in schema:
        return _example_from_schema(_resolve_ref(schema['$ref'], components), components)
    if 'enum' in schema:
        return schema['enum'][0]
    if 'default' in schema:
        return schema['default']
    schema_type = schema.get('type')
    if schema_type == 'string':
        fmt = schema.get('format')
        if fmt == 'email':
            return f"tester+{_rand_suffix()}@example.com"
        if fmt == 'date-time':
            return datetime.utcnow().isoformat() + 'Z'
        return schema.get('example', 'test')
    if schema_type == 'integer':
        return schema.get('example', 1)
    if schema_type == 'number':
        return schema.get('example', 1.0)
    if schema_type == 'boolean':
        return schema.get('example', True)
    if schema_type == 'array':
        item = _example_from_schema(schema.get('items', {}), components)
        return [item]
    if schema_type == 'object' or 'properties' in schema:
        props = schema.get('properties', {})
        required = schema.get('required', [])
        payload = {}
        for key, prop_schema in props.items():
            if required and key not in required:
                continue
            payload[key] = _example_from_schema(prop_schema, components)
        return payload
    return None


def _build_payload(operation: dict, components: dict) -> Any:
    body = operation.get('requestBody', {})
    content = body.get('content', {})
    if 'application/json' not in content:
        return None
    schema = content['application/json'].get('schema', {})
    return _example_from_schema(schema, components)


def _build_query(params: list[dict], components: dict) -> dict:
    query = {}
    for param in params:
        if param.get('in') != 'query':
            continue
        if not param.get('required', False):
            continue
        schema = param.get('schema', {})
        query[param['name']] = _example_from_schema(schema, components)
    return query


def _replace_path_params(path: str, params: list[dict], id_map: dict) -> str:
    result = path
    for param in params:
        if param.get('in') != 'path':
            continue
        name = param['name']
        replacement = id_map.get(name)
        if replacement is None:
            replacement = id_map.get(f"{name}_id")
        if replacement is None:
            if name.endswith('_id'):
                replacement = id_map.get(name)
        if replacement is None:
            if name == 'version':
                replacement = 1
            else:
                replacement = f"test-{_rand_suffix(4)}"
        result = result.replace(f"{{{name}}}", str(replacement))
    return result


def _request(session: requests.Session, method: str, url: str, query: dict, payload: Any) -> requests.Response:
    request_args = {}
    if query:
        request_args['params'] = query
    if payload is not None:
        request_args['json'] = payload
    return session.request(method.upper(), url, **request_args)


def main() -> int:
    parser = argparse.ArgumentParser(description='API coverage tester for /api/v1/* endpoints')
    parser.add_argument('--base-url', default='http://127.0.0.1:8000')
    parser.add_argument('--output', default='reports/api_test.json')
    parser.add_argument('--token', default=None)
    args = parser.parse_args()

    base_url = args.base_url.rstrip('/')
    session = requests.Session()

    openapi = session.get(f"{base_url}/openapi.json")
    if openapi.status_code != 200:
        print(f"Failed to load openapi.json: {openapi.status_code}")
        return 1
    spec = openapi.json()
    components = spec.get('components', {}).get('schemas', {})

    id_map: dict[str, Any] = {}

    auth_email = None
    auth_password = None
    refresh_token = None

    pre_results = []

    if args.token:
        session.headers['Authorization'] = f"Bearer {args.token}"
    else:
        auth_email = f"tester+{_rand_suffix()}@example.com"
        auth_password = 'secret123'
        register = session.post(f"{base_url}/api/v1/auth/register", json={'email': auth_email, 'password': auth_password})
        pre_results.append(
            {
                'method': 'POST',
                'path': '/api/v1/auth/register',
                'status': register.status_code,
                'ok': register.status_code < 400,
                'error': (register.text or '')[:500] if register.status_code >= 400 else None,
            }
        )
        login = session.post(f"{base_url}/api/v1/auth/login", json={'email': auth_email, 'password': auth_password})
        if login.status_code == 200:
            payload = login.json()
            token = payload.get('access_token')
            refresh_token = payload.get('refresh_token')
            if token:
                session.headers['Authorization'] = f"Bearer {token}"
        pre_results.append(
            {
                'method': 'POST',
                'path': '/api/v1/auth/login',
                'status': login.status_code,
                'ok': login.status_code < 400,
                'error': (login.text or '')[:500] if login.status_code >= 400 else None,
            }
        )
        if refresh_token:
            refresh = session.post(f"{base_url}/api/v1/auth/refresh", json={'refresh_token': refresh_token})
            if refresh.status_code == 200:
                refresh_payload = refresh.json()
                refresh_token = refresh_payload.get('refresh_token', refresh_token)
            pre_results.append(
                {
                    'method': 'POST',
                    'path': '/api/v1/auth/refresh',
                    'status': refresh.status_code,
                    'ok': refresh.status_code < 400,
                    'error': (refresh.text or '')[:500] if refresh.status_code >= 400 else None,
                }
            )

    # Seed required resources
    skill_payload = {
        'name': f"skill-{_rand_suffix(4)}",
        'description': 'seed skill',
        'visibility': 'public',
        'tags': ['seed'],
        'content': 'seed content',
    }
    skill = session.post(f"{base_url}/api/v1/skills", json=skill_payload)
    if skill.status_code in (200, 201):
        data = _safe_json(skill) or {}
        id_map['skill_id'] = data.get('id')

    chat_session = session.post(f"{base_url}/api/v1/chats", json={'title': 'seed chat'})
    if chat_session.status_code in (200, 201):
        data = _safe_json(chat_session) or {}
        id_map['session_id'] = data.get('id')

    chat_alias_session = session.post(f"{base_url}/api/v1/chat/sessions", json={'title': 'seed chat'})
    if chat_alias_session.status_code in (200, 201):
        data = _safe_json(chat_alias_session) or {}
        id_map.setdefault('session_id', data.get('id'))

    if id_map.get('session_id'):
        message_payload = {'role': 'user', 'content': 'seed message', 'skill_id': id_map.get('skill_id')}
        message = session.post(
            f"{base_url}/api/v1/chats/{id_map['session_id']}/messages", json=message_payload
        )
        if message.status_code in (200, 201):
            data = _safe_json(message) or {}
            id_map['message_id'] = data.get('id')

        suggestion_payload = {
            'skill_id': id_map.get('skill_id') or 'unknown',
            'message_id': id_map.get('message_id'),
        }
        suggestion = session.post(
            f"{base_url}/api/v1/chats/{id_map['session_id']}/suggestions", json=suggestion_payload
        )
        if suggestion.status_code in (200, 201):
            data = _safe_json(suggestion) or {}
            id_map['suggestion_id'] = data.get('id')

    report_payload = {
        'target_type': 'skill',
        'target_id': id_map.get('skill_id') or 'unknown',
        'title': 'seed report',
        'content': 'seed content',
    }
    report = session.post(f"{base_url}/api/v1/reports", json=report_payload)
    if report.status_code in (200, 201):
        data = _safe_json(report) or {}
        id_map['report_id'] = data.get('id')

    memory_payload = {'key': f"seed-{_rand_suffix(4)}", 'value': 'seed', 'scope': 'user'}
    memory = session.post(f"{base_url}/api/v1/memory", json=memory_payload)
    if memory.status_code in (200, 201):
        data = _safe_json(memory) or {}
        id_map['memory_id'] = data.get('id')

    notification_payload = {'type': 'info', 'content': 'seed notification'}
    notification = session.post(f"{base_url}/api/v1/notifications", json=notification_payload)
    if notification.status_code in (200, 201):
        data = _safe_json(notification) or {}
        id_map['notification_id'] = data.get('id')

    if id_map.get('skill_id'):
        comment_payload = {'skill_id': id_map['skill_id'], 'content': 'seed comment'}
        comment = session.post(f"{base_url}/api/v1/market/comments", json=comment_payload)
        if comment.status_code in (200, 201):
            data = _safe_json(comment) or {}
            id_map['comment_id'] = data.get('id')

    # Run tests against every /api/v1/* endpoint
    operations = []
    for path, methods in spec.get('paths', {}).items():
        if not path.startswith('/api/v1/'):
            continue
        for method, operation in methods.items():
            if method.lower() not in {'get', 'post', 'put', 'patch', 'delete'}:
                continue
            if path in {'/api/v1/auth/register', '/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/auth/logout'}:
                continue
            operations.append((path, method.lower(), operation))

    def _op_priority(item):
        path, method, _operation = item
        if path == '/api/v1/auth/logout':
            return (3, path)
        if method == 'delete':
            return (2, path)
        if path == '/api/v1/auth/refresh':
            return (1, path)
        if path == '/api/v1/auth/login':
            return (0, path)
        return (0, path)

    operations.sort(key=_op_priority)

    results = pre_results[:]
    for path, method, operation in operations:
        params = operation.get('parameters', [])
        query = _build_query(params, components)
        url = base_url + _replace_path_params(path, params, id_map)
        payload = _build_payload(operation, components)
        # override payloads for auth endpoints
        if path == '/api/v1/auth/register' and method == 'post':
            payload = {'email': f"tester+{_rand_suffix()}@example.com", 'password': 'secret123'}
        if path == '/api/v1/auth/login' and method == 'post':
            if auth_email and auth_password:
                payload = {'email': auth_email, 'password': auth_password}
        if path == '/api/v1/auth/refresh' and method == 'post':
            if refresh_token:
                payload = {'refresh_token': refresh_token}
        if path == '/api/v1/auth/logout' and method == 'post':
            if refresh_token:
                payload = {'refresh_token': refresh_token}
        if path == '/api/v1/skills/{skill_id}' and method == 'patch':
            payload = {'name': f"skill-{_rand_suffix(4)}", 'description': 'updated'}
        if path == '/api/v1/market/favorites' and method == 'post' and id_map.get('skill_id'):
            payload = {'skill_id': id_map['skill_id']}
        if path == '/api/v1/market/ratings' and method == 'post' and id_map.get('skill_id'):
            payload = {'skill_id': id_map['skill_id'], 'rating': 5}
        if path == '/api/v1/market/comments' and method == 'post' and id_map.get('skill_id'):
            payload = {'skill_id': id_map['skill_id'], 'content': 'seed comment'}
        if path == '/api/v1/chats/{session_id}/messages' and method == 'post':
            payload = {'role': 'user', 'content': 'seed message', 'skill_id': id_map.get('skill_id')}
        if path == '/api/v1/chats/{session_id}/suggestions' and method == 'post':
            payload = {'skill_id': id_map.get('skill_id'), 'message_id': id_map.get('message_id')}
        if path == '/api/v1/skill-suggestions' and method == 'post':
            payload = {
                'session_id': id_map.get('session_id'),
                'skill_id': id_map.get('skill_id'),
                'message_id': id_map.get('message_id'),
            }

        try:
            response = _request(session, method, url, query, payload)
            ok = response.status_code < 400
            if path == '/api/v1/ai/chat/stream' and response.status_code == 500:
                detail = _safe_json(response)
                if isinstance(detail, dict) and detail.get('detail') == 'OpenAI API key not configured':
                    results.append(
                        {
                            'method': method.upper(),
                            'path': path,
                            'status': response.status_code,
                            'ok': True,
                            'skipped': True,
                        }
                    )
                    continue
            entry = {
                'method': method.upper(),
                'path': path,
                'status': response.status_code,
                'ok': ok,
            }
            if not ok:
                entry['error'] = (response.text or '')[:500]
            results.append(entry)
        except requests.RequestException as exc:
            results.append(
                {
                    'method': method.upper(),
                    'path': path,
                    'status': 0,
                    'ok': False,
                    'error': str(exc),
                }
            )

    if refresh_token:
        logout = session.post(f"{base_url}/api/v1/auth/logout", json={'refresh_token': refresh_token})
        results.append(
            {
                'method': 'POST',
                'path': '/api/v1/auth/logout',
                'status': logout.status_code,
                'ok': logout.status_code < 400,
                'error': (logout.text or '')[:500] if logout.status_code >= 400 else None,
            }
        )

    total = len(results)
    passed = len([item for item in results if item['ok']])
    failed = total - passed

    summary = {
        'base_url': base_url,
        'total': total,
        'passed': passed,
        'failed': failed,
        'results': results,
    }

    if args.output:
        output_path = args.output
        if not output_path.startswith('/'):
            output_path = str((__import__('pathlib').Path(__file__).resolve().parents[1] / output_path))
        __import__('pathlib').Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"Total: {total}, Passed: {passed}, Failed: {failed}")
    return 0 if failed == 0 else 2


if __name__ == '__main__':
    raise SystemExit(main())
