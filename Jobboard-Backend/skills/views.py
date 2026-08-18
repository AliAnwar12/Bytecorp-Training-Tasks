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
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return JobSkill.objects.filter(deleted_at__isnull=True)

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def _assert_can_manage(self, job):
        from rest_framework.exceptions import PermissionDenied

        from accounts.models import User
        from companies.models import CompanyMember

        user = self.request.user

        if user.role == User.Roles.ADMIN:
            return

        if user.role != User.Roles.COMPANY_REPRESENTATIVE:
            raise PermissionDenied("You do not have permission to manage job skills.")

        is_member = CompanyMember.objects.filter(
            company=job.company,
            user=user,
            deleted_at__isnull=True,
        ).exists()

        if not is_member:
            raise PermissionDenied(
                "You can manage job skills only for your own company jobs."
            )

    def perform_create(self, serializer):
        self._assert_can_manage(serializer.validated_data["job"])
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
        self._assert_can_manage(instance.job)
        instance.soft_delete(user=self.request.user)