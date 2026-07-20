"""
Automatic audit trail. audit.apps.AuditConfig.ready() connects these
handlers to every model that extends common.models.AuditModel - auditing a
new model is then free, nothing to add per-view.
"""

import logging

from django.db.models.signals import post_delete, post_save, pre_save

from common.logging import get_current_user, get_request_id

logger = logging.getLogger(__name__)

EXCLUDED_FIELDS = {"password", "password_hash"}
NOISY_FIELDS = {"updated_at"}


def _serialize(value):
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    return str(value)


def _field_values(instance):
    values = {}
    for field in instance._meta.concrete_fields:
        name = field.attname
        if field.name in EXCLUDED_FIELDS or name in EXCLUDED_FIELDS:
            continue
        values[name] = _serialize(getattr(instance, name))
    return values


def _write_log(action, instance, changes):
    from audit.models import AuditLog

    if not changes:
        return

    user = get_current_user()
    is_authenticated = bool(user and getattr(user, "is_authenticated", False))

    AuditLog.objects.create(
        action=action,
        model_name=f"{instance._meta.app_label}.{instance._meta.object_name}",
        object_id=str(instance.pk),
        object_repr=str(instance)[:255],
        changes=changes,
        actor=user if is_authenticated else None,
        actor_email=getattr(user, "email", None) if is_authenticated else None,
        request_id=get_request_id(),
    )


def _pre_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            instance._audit_previous = sender.objects.get(pk=instance.pk)
        except sender.DoesNotExist:
            instance._audit_previous = None
    else:
        instance._audit_previous = None


def _post_save(sender, instance, created, **kwargs):
    from audit.models import AuditLog

    try:
        if created:
            changes = {
                field: {"new": value}
                for field, value in _field_values(instance).items()
                if field not in NOISY_FIELDS
            }
            _write_log(AuditLog.Actions.CREATE, instance, changes)
            return

        previous = getattr(instance, "_audit_previous", None)
        if previous is None:
            return

        old_values = _field_values(previous)
        new_values = _field_values(instance)

        changes = {
            field: {"old": old_values.get(field), "new": new_value}
            for field, new_value in new_values.items()
            if field not in NOISY_FIELDS and old_values.get(field) != new_value
        }

        action = AuditLog.Actions.UPDATE
        if changes.get("deleted_at") and old_values.get("deleted_at") is None:
            action = AuditLog.Actions.DELETE

        _write_log(action, instance, changes)
    except Exception:
        logger.exception("Failed to write audit log for %s", sender.__name__)


def _post_delete(sender, instance, **kwargs):
    from audit.models import AuditLog

    try:
        _write_log(
            AuditLog.Actions.DELETE,
            instance,
            {"deleted_at": {"old": None, "new": "hard-deleted"}},
        )
    except Exception:
        logger.exception("Failed to write audit log for hard delete of %s", sender.__name__)


def register_audit_signals(model):
    pre_save.connect(_pre_save, sender=model, weak=False, dispatch_uid=f"audit-pre-save-{model.__name__}")
    post_save.connect(_post_save, sender=model, weak=False, dispatch_uid=f"audit-post-save-{model.__name__}")
    post_delete.connect(_post_delete, sender=model, weak=False, dispatch_uid=f"audit-post-delete-{model.__name__}")