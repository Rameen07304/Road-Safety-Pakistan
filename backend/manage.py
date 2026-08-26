#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

# PyTorch 2.6+ compatibility: Patch torch.load BEFORE any Django/ultralytics imports
try:
    import torch
    _torch_load_original = torch.load
    def torch_load_wrapper(*args, **kwargs):
        if 'weights_only' not in kwargs:
            kwargs['weights_only'] = False
        return _torch_load_original(*args, **kwargs)
    torch.load = torch_load_wrapper
except ImportError:
    pass


def main():
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings.dev")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
