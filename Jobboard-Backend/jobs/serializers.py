from rest_framework import serializers

from companies.models import Company
from jobs.models import Job


class JobSerializer(serializers.ModelSerializer):
    company_id = serializers.PrimaryKeyRelatedField(
        source="company",
        queryset=Company.objects.filter(deleted_at__isnull=True),
        write_only=True,
    )
    company_name = serializers.CharField(source="company.name", read_only=True)

    class Meta:
        model = Job
        fields = [
            "id",
            "company_id",
            "company_name",
            "title",
            "description",
            "location",
            "salary_min",
            "salary_max",
            "employment_type",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def update(self, instance, validated_data):
        # Prevent changing job ownership via updates.
        validated_data.pop("company", None)
        return super().update(instance, validated_data)