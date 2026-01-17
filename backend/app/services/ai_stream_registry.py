from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Optional


StreamPayload = dict[str, str]


@dataclass
class StreamState:
    session_id: str
    message_id: str
    content: str = ''
    done: bool = False
    subscribers: set[asyncio.Queue[Optional[StreamPayload]]] = field(default_factory=set)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)


class AiStreamRegistry:
    def __init__(self) -> None:
        self._streams: dict[str, StreamState] = {}
        self._lock = asyncio.Lock()

    async def start(self, session_id: str, message_id: str) -> StreamState:
        existing = None
        async with self._lock:
            existing = self._streams.get(session_id)
        if existing and not existing.done:
            await self.finish(session_id)
        async with self._lock:
            state = StreamState(session_id=session_id, message_id=message_id)
            self._streams[session_id] = state
            return state

    async def get(self, session_id: str) -> Optional[StreamState]:
        return self._streams.get(session_id)

    async def append(self, session_id: str, delta: str) -> None:
        state = self._streams.get(session_id)
        if not state or state.done:
            return
        payload: StreamPayload = {'type': 'delta', 'message_id': state.message_id, 'content': delta}
        async with state.lock:
            state.content += delta
            subscribers = list(state.subscribers)
        for queue in subscribers:
            queue.put_nowait(payload)

    async def error(self, session_id: str, message: str) -> None:
        state = self._streams.get(session_id)
        if not state or state.done:
            return
        payload: StreamPayload = {'type': 'error', 'message_id': state.message_id, 'message': message}
        async with state.lock:
            subscribers = list(state.subscribers)
        for queue in subscribers:
            queue.put_nowait(payload)

    async def finish(self, session_id: str) -> None:
        state = self._streams.get(session_id)
        if not state or state.done:
            return
        async with state.lock:
            state.done = True
            subscribers = list(state.subscribers)
            state.subscribers.clear()
        for queue in subscribers:
            queue.put_nowait(None)
        async with self._lock:
            current = self._streams.get(session_id)
            if current is state:
                self._streams.pop(session_id, None)

    async def subscribe(self, session_id: str) -> Optional[tuple[StreamState, asyncio.Queue[Optional[StreamPayload]], str]]:
        state = self._streams.get(session_id)
        if not state or state.done:
            return None
        queue: asyncio.Queue[Optional[StreamPayload]] = asyncio.Queue()
        async with state.lock:
            snapshot = state.content
            state.subscribers.add(queue)
        return state, queue, snapshot

    async def unsubscribe(self, state: StreamState, queue: asyncio.Queue[Optional[StreamPayload]]) -> None:
        async with state.lock:
            state.subscribers.discard(queue)


stream_registry = AiStreamRegistry()
