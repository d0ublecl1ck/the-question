from app.db.session import get_session


def test_session_dependency():
    gen = get_session()
    session = next(gen)
    assert session is not None
    session.close()
