from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinLengthValidator, RegexValidator

from .specialty import Specialty
from django.conf import settings


class Specialist(models.Model):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="specialist_profile",
    )
    
    specialty = models.ForeignKey(
        Specialty,
        on_delete=models.PROTECT,
        related_name='specialists'
    )

    first_name = models.CharField(
        max_length=100
    )

    last_name = models.CharField(
        max_length=100
    )

    license_number = models.CharField(
        max_length=50,
        unique=True,
        validators=[
            MinLengthValidator(
                5,
                'El número de colegiatura debe tener '
                'al menos 5 caracteres.'
            )
        ]
    )

    phone = models.CharField(
        max_length=9,
        null=True,
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^\d{9}$',
                message='El teléfono debe contener exactamente 9 dígitos.'
            )
        ]
    )

    email = models.EmailField(
        unique=True,
        null=True,
        blank=True
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
                    'Un especialista eliminado no puede estar activo.'
                )
            })

        # Solo exigimos una especialidad disponible cuando
        # el especialista estará activo.
        if self.is_active and not self.is_deleted:

            if self.specialty.is_deleted:
                raise ValidationError({
                    'specialty': (
                        'No puede seleccionar una especialidad eliminada.'
                    )
                })

            if not self.specialty.is_active:
                raise ValidationError({
                    'specialty': (
                        'No puede seleccionar una especialidad inactiva.'
                    )
                })

    def save(self, *args, **kwargs):

        self.first_name = self.first_name.strip().upper()
        self.last_name = self.last_name.strip().upper()
        self.license_number = self.license_number.strip().upper()

        if self.phone:
            self.phone = self.phone.strip()

        if self.email:
            self.email = self.email.strip().lower()

        self.full_clean()

        super().save(*args, **kwargs)

    class Meta:
        ordering = [
            'last_name',
            'first_name'
        ]

    def __str__(self):
        return f'{self.first_name} {self.last_name}'