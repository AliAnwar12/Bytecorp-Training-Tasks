from rest_framework import serializers

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