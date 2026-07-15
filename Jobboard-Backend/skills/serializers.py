from rest_framework import serializers

from skills.models import Skill, UserSkill, JobSkill


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["id", "name", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class UserSkillSerializer(serializers.ModelSerializer):
    skill = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.filter(deleted_at__isnull=True)
    )
    skill_name = serializers.CharField(source="skill.name", read_only=True)

    class Meta:
        model = UserSkill
        fields = ["id", "skill", "skill_name", "created_at", "updated_at"]
        read_only_fields = ["id", "skill_name", "created_at", "updated_at"]


class JobSkillSerializer(serializers.ModelSerializer):
    skill_name = serializers.CharField(source="skill.name", read_only=True)

    class Meta:
        model = JobSkill
        fields = ["id", "job", "skill", "skill_name", "created_at", "updated_at"]
        read_only_fields = ["id", "skill_name", "created_at", "updated_at"]