import os

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a Road Safety Pakistan admin user'

    def handle(self, *args, **options):
        self.stdout.write('Creating RSP Admin User...')
        
        email    = os.environ.get('ADMIN_EMAIL', 'admin@roadsafety.pk')
        password = os.environ.get('ADMIN_PASSWORD', 'Admin@RSP2024')
        
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(
                    f'Admin {email} already exists'
                )
            )
            return

        User.objects.create_superuser(
            email        = email,
            password     = password,
            full_name    = 'RSP Admin',
            phone        = '03001234567',
            id_type      = 'cnic',
            cnic         = '35202-1234567-1',
            role         = 'admin',
        )
        
        self.stdout.write(self.style.SUCCESS(
            f'Admin created successfully!\n'
            f'   Email   : {email}\n'
            f'   Password: {password}\n'
            f'   CNIC    : 35202-1234567-1\n'
            f'   Role    : admin\n'
            f'   IMPORTANT: Change password after login!'
        ))
