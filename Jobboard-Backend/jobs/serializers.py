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

    def validate_title(self, value):
        value = value.strip()

        if len(value) < 3:
            raise serializers.ValidationError(
                "Job title must be at least 3 characters long."
            )

        return value

    def validate_description(self, value):
        value = value.strip()

        if len(value) < 10:
            raise serializers.ValidationError(
                "Job description must be at least 10 characters long."
            )

        return value

    def validate_location(self, value):
        value = value.strip()

        if len(value) < 2:
            raise serializers.ValidationError("Location is required.")

        return value

    def validate(self, attrs):
        salary_min = attrs.get("salary_min")
        salary_max = attrs.get("salary_max")

        if self.instance:
            if salary_min is None:
                salary_min = self.instance.salary_min

            if salary_max is None:
                salary_max = self.instance.salary_max

        if salary_min is not None and salary_min < 0:
            raise serializers.ValidationError(
                {"salary_min": ["Salary minimum cannot be negative."]}
            )

        if salary_max is not None and salary_max < 0:
            raise serializers.ValidationError(
                {"salary_max": ["Salary maximum cannot be negative."]}
            )

        if salary_min is not None and salary_max is not None:
            if salary_max < salary_min:
                raise serializers.ValidationError(
                    {
                        "salary_max": [
                            "Salary maximum must be greater than or equal to salary minimum."
                        ]
                    }
                )

        return attrs