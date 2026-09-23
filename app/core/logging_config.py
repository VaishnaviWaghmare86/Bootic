"""Logging configuration for structured and secure application logging."""

import logging
import sys
from app.core.config import settings


def setup_logging() -> logging.Logger:
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] [%(name)s:%(lineno)d] - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Avoid duplicate handlers if setup_logging is called multiple times
    if not root_logger.handlers:
        root_logger.addHandler(console_handler)
    else:
        root_logger.handlers = [console_handler]

    # Suppress verbose logs from third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("motor").setLevel(logging.INFO)
    logging.getLogger("pymongo").setLevel(logging.WARNING)

    logger = logging.getLogger("b2b_app")
    logger.setLevel(log_level)
    return logger


logger = setup_logging()
