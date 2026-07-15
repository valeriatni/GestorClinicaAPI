from django.db import models
from django.core.exceptions import ValidationError


class Procedure(models.Model):

    name = models.CharField(
        max_length=100,
        unique=True
    )

    description = models.TextField(
        null=True,
        blank=True
    )

    base_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    is_active = models.BooleanField(
        default=True
    )

    is_deleted = models.BooleanField(
        default=False
    )

    inactive_reason = models.TextField(
        null=True,
        blank=True
    )

    deactivated_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def clean(self):

        super().clean()

        if self.is_active and self.is_deleted:
            raise ValidationError({
                'is_active': (
                    'Un procedimiento eliminado no puede permanecer activo.'
                )
            })

        if not self.name or not self.name.strip():
            raise ValidationError({
                'name': (
                    'Debe ingresar el nombre del procedimiento.'
                )
            })

        if self.base_price <= 0:
            raise ValidationError({
                'base_price': (
                    'El precio base debe ser mayor que cero.'
                )
            })

    def save(self, *args, **kwargs):

        self.name = self.name.strip().upper()

        if self.description:
            self.description = self.description.strip()

        if self.inactive_reason:
            self.inactive_reason = self.inactive_reason.strip()

        self.full_clean()

        super().save(*args, **kwargs)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name