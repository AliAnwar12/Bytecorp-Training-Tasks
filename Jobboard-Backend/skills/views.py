from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated

from accounts.permissions import IsAdmin
from skills.models import Skill, UserSkill, JobSkill
from skills.serializers import SkillSerializer, UserSkillSerializer, JobSkillSerializer


class SkillViewSet(viewsets.ModelViewSet):
    serializer_class = SkillSerializer

    def get_queryset(self):
        return Skill.objects.filter(deleted_at__isnull=True)

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]

        return [IsAuthenticated(), IsAdmin()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)


class MyUserSkillViewSet(viewsets.ModelViewSet):
    serializer_class = UserSkillSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserSkill.objects.filter(
            user=self.request.user,
            deleted_at__isnull=True,
        )

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            created_by=self.request.user,
        )

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)


class JobSkillViewSet(viewsets.ModelViewSet):
    serializer_class = JobSkillSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JobSkill.objects.filter(deleted_at__isnull=True)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)