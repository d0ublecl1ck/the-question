import pytest

from app.services.ai_stream_registry import stream_registry


@pytest.mark.anyio
async def test_stream_registry_snapshot_and_delta():
    session_id = "session-1"
    message_id = "message-1"
    await stream_registry.start(session_id, message_id)
    subscription = await stream_registry.subscribe(session_id)
    assert subscription is not None
    state, queue, snapshot = subscription
    assert state.session_id == session_id
    assert snapshot == ""

    await stream_registry.append(session_id, "hello")
    item = await queue.get()
    assert item is not None
    assert item["type"] == "delta"
    assert item["message_id"] == message_id
    assert item["content"] == "hello"

    await stream_registry.finish(session_id)
    done = await queue.get()
    assert done is None
