"""
Structured (JSON) logging support.

- Logs are JSON so they can be searched/filtered by field in whatever log
  aggregator ends up consuming stdout (CloudWatch, Datadog, ELK, ...).
- Every request gets a correlation ID (`request_id`), read from the
  `X-Request-ID` header if supplied, otherwise generated. It's stored in a
  contextvar so any log call made while handling that request picks it up
  automatically via `CorrelationIdFilter`.
- Nothing here ever logs request bodies, headers, or query params.
- `current_user_var` is the same idea applied to "who is making this
  request": accounts.authentication sets it once a JWT is verified, and
  the `audit` app reads it when writing an AuditLog row.
"""

import contextvars
import json
import logging
import uuid

request_id_var: "contextvars.ContextVar[str | None]" = contextvars.ContextVar(
    "request_id", default=None
)
current_user_var: "contextvars.ContextVar[object | None]" = contextvars.ContextVar(
    "current_user", default=None
)


def new_request_id() -> str:
    return uuid.uuid4().hex


def get_request_id() -> str | None:
    return request_id_var.get()


def get_current_user():
    return current_user_var.get()


class CorrelationIdFilter(logging.Filter):
    """Attaches the current request's correlation ID to every log record."""

    def filter(self, record):
        record.request_id = request_id_var.get() or "-"
        return True


class JSONFormatter(logging.Formatter):
    """Renders log records as single-line JSON."""

    RESERVED = {
        "name", "msg", "args", "levelname", "levelno", "pathname", "filename",
        "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName",
        "created", "msecs", "relativeCreated", "thread", "threadName",
        "processName", "process", "message", "request_id", "taskName",
    }

    def format(self, record):
        payload = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", "-"),
        }

        for key, value in record.__dict__.items():
            if key not in self.RESERVED:
                payload[key] = value

        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str)