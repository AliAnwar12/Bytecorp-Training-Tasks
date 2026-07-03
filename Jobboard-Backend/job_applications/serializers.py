from rest_framework import serializers

from job_applications.models import JobApplication


class JobApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source="job.title", read_only=True)
    applicant_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = JobApplication
        fields = [
            "id",
            "job",
            "job_title",
            "user",
            "applicant_email",
            "cover_letter",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "job",
            "user",
            "job_title",
            "applicant_email",
            "status",
            "created_at",
            "updated_at",
        ]


class JobApplicationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = ["status"]