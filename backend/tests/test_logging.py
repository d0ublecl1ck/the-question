import logging

from app.core.logging import configure_logging


def test_configure_logging_sets_intercept_handler():
    configure_logging("INFO")
    assert logging.root.handlers, "expected root handlers to be configured"
    handler = logging.root.handlers[0]
    assert handler.__class__.__name__ == "_InterceptHandler"
    assert logging.root.level == logging.INFO
