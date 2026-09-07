import os

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a Road Safety Pakistan admin user'

    def handle(self, *args, **options):
        self.stdout.write('Creating RSP Admin User...')
        
        email    = os.environ.get('ADMIN_EMAIL', 'admin@roadsafety.pk')
        password = os.environ.get('ADMIN_PASSWORD')

        # This used to fall back to a literal password. In a public repository
        # that value is readable by anyone, so any deployment that forgot to
        # set ADMIN_PASSWORD would ship an admin account with a known password.
        # Refuse to create the account instead.
        if not password:
            raise CommandError(
                'ADMIN_PASSWORD is not set. Add it to backend/.env before '
                'running createadmin. Never rely on a default password.'
            )
        
        phone = os.environ.get('ADMIN_PHONE', '03001234567')
        cnic  = os.environ.get('ADMIN_CNIC', '35202-1234567-1')

        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(
                    f'Admin {email} already exists'
                )
            )
            return

        # email, phone and cnic are each unique. Without this check a second
        # admin under a different email died with a raw IntegrityError instead
        # of telling the operator which value to change.
        clash = (User.objects.filter(phone=phone).first()
                 or User.objects.filter(cnic=cnic).first())
        if clash:
            raise CommandError(
                f'Another account ({clash.email}) already uses phone {phone} '
                f'or CNIC {cnic}. Set ADMIN_PHONE and ADMIN_CNIC to unique '
                f'values, or drop the existing account first.'
            )

        User.objects.create_superuser(
            email        = email,
            password     = password,
            full_name    = 'RSP Admin',
            phone        = phone,
            id_type      = 'cnic',
            cnic         = cnic,
            role         = 'admin',
        )

        # The password is deliberately not echoed: command output lands in
        # terminal scrollback, CI logs and demo screenshots.
        self.stdout.write(self.style.SUCCESS(
            f'Admin created successfully!\n'
            f'   Email : {email}\n'
            f'   Phone : {phone}\n'
            f'   Role  : admin\n'
            f'   Password: taken from ADMIN_PASSWORD (not printed here).\n'
            f'   IMPORTANT: change it after first login.'
        ))
