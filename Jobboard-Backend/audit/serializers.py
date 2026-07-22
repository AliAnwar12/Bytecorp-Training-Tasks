from rest_framework import serializers

from audit.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            "id",
            "action",
            "model_name",
            "object_id",
            "object_repr",
            "changes",
            "actor",
            "actor_email",
            "request_id",
            "request_method",
            "request_path",
            "request_body",
            "response_status_code",
            "response_body",
            "created_at",
        ]
        read_only_fields = fields