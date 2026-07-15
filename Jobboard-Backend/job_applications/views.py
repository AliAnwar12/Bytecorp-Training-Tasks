from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from common.exceptions import ConflictError
from accounts.models import User
from accounts.permissions import IsJobSeeker
from companies.models import CompanyMember
from jobs.models import Job
from job_applications.models import JobApplication
from job_applications.permissions import CanManageApplicationForCompanyJob
from job_applications.serializers import (
    JobApplicationSerializer,
    JobApplicationStatusSerializer,
)


class ApplyToJobView(generics.CreateAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated, IsJobSeeker]

    def perform_create(self, serializer):
        job = get_object_or_404(
            Job,
            id=self.kwargs["job_id"],
            status=Job.Statuses.OPEN,
            deleted_at__isnull=True,
        )

        already_applied = JobApplication.objects.filter(
            user=self.request.user,
            job=job,
            deleted_at__isnull=True,
        ).exists()

        if already_applied:
            raise ConflictError("You have already applied to this job.")

        serializer.save(
            user=self.request.user,
            job=job,
            created_by=self.request.user,
        )


class MyApplicationsView(generics.ListAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated, IsJobSeeker]

    def get_queryset(self):
        return JobApplication.objects.select_related("job", "user").filter(
            user=self.request.user,
            deleted_at__isnull=True,
        )


class JobApplicationsForJobView(generics.ListAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        job = get_object_or_404(
            Job,
            id=self.kwargs["job_id"],
            deleted_at__isnull=True,
        )

        user = self.request.user

        if user.role == User.Roles.ADMIN:
            pass
        elif user.role == User.Roles.COMPANY_REPRESENTATIVE:
            is_member = CompanyMember.objects.filter(
                company=job.company,
                user=user,
                deleted_at__isnull=True,
            ).exists()

            if not is_member:
                raise PermissionDenied("You can view applications only for your own company jobs.")
        else:
            raise PermissionDenied("You do not have permission to view these applications.")

        return JobApplication.objects.select_related("job", "user").filter(
            job=job,
            deleted_at__isnull=True,
        )


class JobApplicationStatusUpdateView(generics.UpdateAPIView):
    serializer_class = JobApplicationStatusSerializer
    permission_classes = [IsAuthenticated, CanManageApplicationForCompanyJob]

    def get_queryset(self):
        return JobApplication.objects.filter(deleted_at__isnull=True)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class JobApplicationDeleteView(generics.DestroyAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JobApplication.objects.filter(deleted_at__isnull=True)

    def delete(self, request, *args, **kwargs):
        application = self.get_object()

        if request.user.role == User.Roles.ADMIN:
            pass
        elif application.user_id == request.user.id:
            pass
        else:
            raise PermissionDenied("You can delete only your own application.")

        application.soft_delete(user=request.user)

        return Response(status=status.HTTP_204_NO_CONTENT)