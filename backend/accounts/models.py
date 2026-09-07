import re
import uuid

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.core.exceptions import ValidationError
from django.db import models


class UserManager(BaseUserManager):
    """Manager for custom User model."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must provide an email address.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            raise ValueError("A password is required.")
        user.full_clean()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra):
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        extra.setdefault('role', 'admin')
        # Create user directly without clean()
        user = self.model(
            email=self.normalize_email(email),
            **extra
        )
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model for Road Safety Pakistan."""

    ID_TYPE_CHOICES = [
        ("cnic", "CNIC (Pakistani National)"),
        ("passport", "Passport (Foreign National)"),
    ]
    ROLE_CHOICES = [
        ("citizen", "Citizen"),
        ("admin", "Government Admin"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, unique=True)
    id_type = models.CharField(max_length=20, choices=ID_TYPE_CHOICES, default="cnic")
    cnic = models.CharField(max_length=15, unique=True, blank=True, null=True)
    passport_number = models.CharField(max_length=20, unique=True, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="citizen")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(blank=True, null=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name", "phone"]

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def clean(self):
        super().clean()
        if self.id_type == "cnic":
            if not self.cnic:
                raise ValidationError({"cnic": "CNIC is required when id_type is cnic."})
            if not re.match(r"^\d{5}-\d{7}-\d{1}$", self.cnic):
                raise ValidationError({"cnic": "CNIC must be in the format XXXXX-XXXXXXX-X."})
        elif self.id_type == "passport":
            if not self.passport_number:
                raise ValidationError({"passport_number": "Passport number is required when id_type is passport."})

    def __str__(self):
        return f"{self.full_name} <{self.email}>"
