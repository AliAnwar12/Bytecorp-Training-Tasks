import contextvars
import json
import logging


request_id_var = contextvars.ContextVar("request_id", default=None)
current_user_var = contextvars.ContextVar("current_user", default=None)
request_data_var = contextvars.ContextVar("request_data", default=None)
response_data_var = contextvars.ContextVar("response_data", default=None)


SENSITIVE_FIELDS = {
    "password",
    "password_hash",
    "old_password",
    "new_password",
    "confirm_password",
    "token",
    "access",
    "refresh",
    "authorization",
}


def redact_sensitive_data(data):
    if data is None:
        return None

    if isinstance(data, dict):
        redacted = {}

        for key, value in data.items():
            if key.lower() in SENSITIVE_FIELDS:
                redacted[key] = "[REDACTED]"
            else:
                redacted[key] = redact_sensitive_data(value)

        return redacted

    if isinstance(data, list):
        return [redact_sensitive_data(item) for item in data]

    return data


class CorrelationIdFilter(logging.Filter):
    def filter(self, record):
        record.request_id = request_id_var.get()
        return True


class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "request_id": getattr(record, "request_id", None),
        }

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)