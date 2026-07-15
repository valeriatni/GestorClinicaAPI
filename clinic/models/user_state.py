from django.conf import settings
from django.db import models


class UserState(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='clinic_state',
    )

    is_deleted = models.BooleanField(
        default=False,
    )

    deletion_reason = models.CharField(
        max_length=250,
        null=True,
        blank=True,
    )

    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return (
            f'{self.user.username} - '
            f'{"Eliminado" if self.is_deleted else "Disponible"}'
        )