import json
from collections.abc import AsyncGenerator

import httpx

from app.core.config import settings


async def stream_chat_completion(
    *,
    model: str,
    messages: list[dict[str, str]],
) -> AsyncGenerator[str, None]:
    url = f"{settings.OPENAI_BASE_URL.rstrip('/')}/chat/completions"
    headers = {
        'Authorization': f'Bearer {settings.OPENAI_API_KEY}',
        'Content-Type': 'application/json',
    }
    payload = {
        'model': model,
        'messages': messages,
        'stream': True,
    }
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream('POST', url, headers=headers, json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line:
                    continue
                if not line.startswith('data:'):
                    continue
                data = line.replace('data:', '', 1).strip()
                if data == '[DONE]':
                    break
                try:
                    event = json.loads(data)
                except json.JSONDecodeError:
                    continue
                delta = (
                    event.get('choices', [{}])[0]
                    .get('delta', {})
                    .get('content')
                )
                if delta:
                    yield delta
