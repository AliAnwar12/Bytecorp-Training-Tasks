from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsAdmin
from audit.models import AuditLog
from audit.serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    """
    GET /api/v1/audit-logs/?model_name=companies.Company&object_id=3
    GET /api/v1/audit-logs/?actor=12
    GET /api/v1/audit-logs/?action=delete

    Admin-only, read-only.
    """

    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["action", "model_name", "object_id", "actor", "request_id"]
    queryset = AuditLog.objects.all()