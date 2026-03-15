"""Performance timing utilities for service-layer instrumentation."""

import logging
import time
from collections.abc import Generator
from contextlib import contextmanager

from backend.config import settings

logger = logging.getLogger("perf")


@contextmanager
def timed_operation(label: str) -> Generator[None]:
    """Log elapsed time for a block of code when perf logging is enabled."""
    if not settings.enable_perf_logging:
        yield
        return
    start = time.perf_counter()
    yield
    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info("[PERF:DB] %s (%.1fms)", label, elapsed_ms)
