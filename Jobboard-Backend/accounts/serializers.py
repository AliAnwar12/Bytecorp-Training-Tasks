from rest_framework import serializers

from accounts.models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "password",
            "role",
            "bio",
            "years_of_experience",
        ]
        read_only_fields = ["id"]

    def validate_role(self, value):
        if value == User.Roles.ADMIN:
            raise serializers.ValidationError(
                "Admin users cannot be created through public registration."
            )

        return value

    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        return user


class UserMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "role",
            "bio",
            "years_of_experience",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "email",
            "role",
            "created_at",
            "updated_at",
        ]