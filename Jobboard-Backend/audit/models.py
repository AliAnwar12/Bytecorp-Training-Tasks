from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    class Actions(models.TextChoices):
        CREATE = "create", "Create"
        UPDATE = "update", "Update"
        DELETE = "delete", "Delete"

    action = models.CharField(max_length=10, choices=Actions.choices)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=64)
    object_repr = models.CharField(max_length=255, blank=True)
    changes = models.JSONField(default=dict, blank=True)

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
    )
    actor_email = models.CharField(max_length=255, null=True, blank=True)
    request_id = models.CharField(max_length=64, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "audit_logs"
        indexes = [
            models.Index(fields=["model_name", "object_id"], name="idx_audit_model_object"),
            models.Index(fields=["actor"], name="idx_audit_actor"),
            models.Index(fields=["created_at"], name="idx_audit_created_at"),
            models.Index(fields=["request_id"], name="idx_audit_request_id"),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} {self.model_name}#{self.object_id} by {self.actor_email or 'system'}"