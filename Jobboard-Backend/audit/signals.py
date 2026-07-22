from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from audit.models import AuditLog
from common.logging import (
    current_user_var,
    request_data_var,
    request_id_var,
    response_data_var,
)
from common.models import AuditModel


SENSITIVE_FIELDS = {"password", "password_hash"}


def get_actor():
    user = current_user_var.get()

    if user and getattr(user, "is_authenticated", False):
        return user

    return None


def get_request_context():
    request_data = request_data_var.get() or {}
    response_data = response_data_var.get() or {}

    return {
        "request_method": request_data.get("method"),
        "request_path": request_data.get("path"),
        "request_body": request_data.get("body"),
        "response_status_code": response_data.get("status_code"),
        "response_body": response_data.get("body"),
    }


def serialize_instance(instance):
    data = {}

    for field in instance._meta.fields:
        field_name = field.name

        if field_name in SENSITIVE_FIELDS:
            data[field_name] = "[REDACTED]"
            continue

        value = getattr(instance, field_name, None)

        try:
            json_value = value
            if hasattr(value, "isoformat"):
                json_value = value.isoformat()
            elif hasattr(value, "pk"):
                json_value = value.pk

            data[field_name] = json_value
        except Exception:
            data[field_name] = str(value)

    return data


def create_audit_log(instance, action, changes=None):
    if isinstance(instance, AuditLog):
        return

    actor = get_actor()
    context = get_request_context()

    AuditLog.objects.create(
        action=action,
        model_name=instance._meta.label,
        object_id=str(instance.pk),
        object_repr=str(instance),
        changes=changes or {},
        actor=actor,
        actor_email=getattr(actor, "email", None) if actor else None,
        request_id=request_id_var.get(),
        **context,
    )


def register_audit_signals(model):
    if not issubclass(model, AuditModel):
        return

    @receiver(pre_save, sender=model, weak=False)
    def audit_pre_save(sender, instance, **kwargs):
        if not instance.pk:
            instance._audit_old_data = None
            return

        try:
            old_instance = sender.objects.get(pk=instance.pk)
            instance._audit_old_data = serialize_instance(old_instance)
        except sender.DoesNotExist:
            instance._audit_old_data = None

    @receiver(post_save, sender=model, weak=False)
    def audit_post_save(sender, instance, created, **kwargs):
        new_data = serialize_instance(instance)

        if created:
            create_audit_log(
                instance=instance,
                action=AuditLog.Actions.CREATE,
                changes={"new": new_data},
            )
            return

        old_data = getattr(instance, "_audit_old_data", None)

        changes = {}

        if old_data:
            for key, old_value in old_data.items():
                new_value = new_data.get(key)

                if old_value != new_value:
                    changes[key] = {
                        "old": old_value,
                        "new": new_value,
                    }

        create_audit_log(
            instance=instance,
            action=AuditLog.Actions.UPDATE,
            changes=changes,
        )

    @receiver(post_delete, sender=model, weak=False)
    def audit_post_delete(sender, instance, **kwargs):
        create_audit_log(
            instance=instance,
            action=AuditLog.Actions.DELETE,
            changes={"deleted": serialize_instance(instance)},
        )