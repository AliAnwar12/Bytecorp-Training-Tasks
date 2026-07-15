from rest_framework import serializers

from common.exceptions import ConflictError
from companies.models import Company, CompanyMember


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "description",
            "website",
            "location",
            "is_verified",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_verified", "created_at", "updated_at"]

    def validate_name(self, value):
        value = value.strip()

        if len(value) < 2:
            raise serializers.ValidationError(
                "Company name must be at least 2 characters long."
            )

        return value

    def validate_location(self, value):
        value = value.strip()

        if len(value) < 2:
            raise serializers.ValidationError("Location is required.")

        return value


class CompanyMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyMember
        fields = [
            "id",
            "company",
            "user",
            "role",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        company = attrs.get("company")
        user = attrs.get("user")

        if company and user:
            queryset = CompanyMember.objects.filter(
                company=company,
                user=user,
                deleted_at__isnull=True,
            )

            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)

            if queryset.exists():
                raise ConflictError(
                    "This user is already an active member of this company."
                )

        return attrs