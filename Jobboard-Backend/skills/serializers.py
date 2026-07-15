from rest_framework import serializers

from common.exceptions import ConflictError
from skills.models import Skill, UserSkill, JobSkill


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["id", "name", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_name(self, value):
        value = value.strip()

        if len(value) < 2:
            raise serializers.ValidationError(
                "Skill name must be at least 2 characters long."
            )

        queryset = Skill.objects.filter(
            name__iexact=value,
            deleted_at__isnull=True,
        )

        if self.instance:
            queryset = queryset.exclude(id=self.instance.id)

        if queryset.exists():
            raise ConflictError("This skill already exists.")

        return value


class UserSkillSerializer(serializers.ModelSerializer):
    skill_name = serializers.CharField(source="skill.name", read_only=True)

    class Meta:
        model = UserSkill
        fields = ["id", "skill", "skill_name", "created_at", "updated_at"]
        read_only_fields = ["id", "skill_name", "created_at", "updated_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        skill = attrs.get("skill")

        if request and skill:
            queryset = UserSkill.objects.filter(
                user=request.user,
                skill=skill,
                deleted_at__isnull=True,
            )

            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)

            if queryset.exists():
                raise ConflictError("You already have this skill added.")

        return attrs


class JobSkillSerializer(serializers.ModelSerializer):
    skill_name = serializers.CharField(source="skill.name", read_only=True)

    class Meta:
        model = JobSkill
        fields = ["id", "job", "skill", "skill_name", "created_at", "updated_at"]
        read_only_fields = ["id", "skill_name", "created_at", "updated_at"]

    def validate(self, attrs):
        job = attrs.get("job")
        skill = attrs.get("skill")

        if job and skill:
            queryset = JobSkill.objects.filter(
                job=job,
                skill=skill,
                deleted_at__isnull=True,
            )

            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)

            if queryset.exists():
                raise ConflictError("This skill is already linked to this job.")

        return attrs