from datetime import date

from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator


dni_validator = RegexValidator(
    regex=r'^\d{8}$',
    message='El DNI debe contener exactamente 8 dígitos.'
)

phone_validator = RegexValidator(
    regex=r'^\d{9}$',
    message='El teléfono debe contener exactamente 9 dígitos.'
)


class Patient(models.Model):

    first_name = models.CharField(
        max_length=100
    )

    last_name = models.CharField(
        max_length=100
    )

    dni = models.CharField(
        max_length=8,
        unique=True,
        validators=[dni_validator]
    )

    phone = models.CharField(
        max_length=9,
        null=True,
        blank=True,
        validators=[phone_validator]
    )

    email = models.EmailField(
        unique=True,
        null=True,
        blank=True
    )

    birth_date = models.DateField(
        null=True,
        blank=True
    )

    address = models.TextField(
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
                    'Un paciente eliminado no puede permanecer activo.'
                )
            })

        if self.birth_date:

            today = date.today()

            if self.birth_date > today:
                raise ValidationError({
                    'birth_date': (
                        'La fecha de nacimiento no puede estar en el futuro.'
                    )
                })

            age = today.year - self.birth_date.year

            if (
                today.month,
                today.day
            ) < (
                self.birth_date.month,
                self.birth_date.day
            ):
                age -= 1

            if age > 120:
                raise ValidationError({
                    'birth_date': (
                        'La edad ingresada no es válida.'
                    )
                })

    def save(self, *args, **kwargs):

        self.first_name = self.first_name.strip().upper()
        self.last_name = self.last_name.strip().upper()
        self.dni = self.dni.strip()

        if self.phone:
            self.phone = self.phone.strip()

        if self.email:
            self.email = self.email.strip().lower()

        if self.address:
            self.address = self.address.strip()

        self.full_clean()

        super().save(*args, **kwargs)

    class Meta:
        ordering = [
            'last_name',
            'first_name'
        ]

    def __str__(self):
        return f'{self.first_name} {self.last_name}'