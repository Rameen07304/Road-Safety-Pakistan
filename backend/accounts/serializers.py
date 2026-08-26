import re

from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

CNIC_REGEX = re.compile(r"^\d{5}-\d{7}-\d{1}$")


class RegisterSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "full_name",
            "email",
            "phone",
            "id_type",
            "cnic",
            "passport_number",
            "password",
            "confirm_password",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
            "cnic": {"required": False, "allow_blank": True, "allow_null": True},
            "passport_number": {"required": False, "allow_blank": True, "allow_null": True},
        }

    def validate(self, data):
        id_type = data.get("id_type")
        cnic = data.get("cnic")
        passport_number = data.get("passport_number")
        password = data.get("password")
        confirm_password = data.get("confirm_password")

        if password != confirm_password:
            raise serializers.ValidationError({"password": "Passwords do not match."})

        if id_type == "cnic":
            if not cnic:
                raise serializers.ValidationError({"cnic": "CNIC is required for Pakistani national ID type."})
            if not CNIC_REGEX.match(cnic):
                raise serializers.ValidationError({"cnic": "CNIC must be in the format XXXXX-XXXXXXX-X."})
        elif id_type == "passport":
            if not passport_number:
                raise serializers.ValidationError({"passport_number": "Passport number is required for passport ID type."})

        if User.objects.filter(email__iexact=data.get("email")).exists():
            raise serializers.ValidationError({"email": "Email already exists."})

        if User.objects.filter(phone=data.get("phone")).exists():
            raise serializers.ValidationError({"phone": "Phone number already exists."})

        if id_type == "cnic" and cnic and User.objects.filter(cnic=cnic).exists():
            raise serializers.ValidationError({"cnic": "CNIC is already registered."})

        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password", None)
        password = validated_data.pop("password")
        
        # Set unused ID fields to None to avoid UNIQUE constraint issues
        id_type = validated_data.get("id_type")
        if id_type == "cnic":
            validated_data["passport_number"] = None
        else:
            validated_data["cnic"] = None
        
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        if not data.get("email") or not data.get("password"):
            raise serializers.ValidationError("Email or phone and password are required.")
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "full_name",
            "email",
            "phone",
            "id_type",
            "cnic",
            "passport_number",
            "role",
            "date_joined",
        ]
        read_only_fields = [
            "id",
            "email",
            "id_type",
            "cnic",
            "passport_number",
            "role",
            "date_joined",
        ]
        extra_kwargs = {
            "full_name": {"required": False},
            "phone": {"required": False},
        }


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_new_password = serializers.CharField(write_only=True)

    def validate(self, data):
        old_password = data.get("old_password")
        new_password = data.get("new_password")
        confirm_new_password = data.get("confirm_new_password")

        if new_password != confirm_new_password:
            raise serializers.ValidationError({"confirm_new_password": "The new passwords must match."})

        if old_password == new_password:
            raise serializers.ValidationError({"new_password": "The new password must be different from the old password."})

        return data
