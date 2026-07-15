from django.db import models
from django.core.exceptions import ValidationError

from .patient import Patient


class MedicalRecord(models.Model):

    patient = models.OneToOneField(
        Patient,
        on_delete=models.PROTECT,
        related_name='medical_record'
    )

    medical_history = models.TextField(
        null=True,
        blank=True
    )

    allergies = models.TextField(
        null=True,
        blank=True
    )

    general_observations = models.TextField(
        null=True,
        blank=True
    )

    is_active = models.BooleanField(
        default=True
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

        patient_changed = True

        if self.pk:
            previous = MedicalRecord.objects.filter(
                pk=self.pk
            ).only(
                'patient_id'
            ).first()

            if previous:
                patient_changed = (
                    previous.patient_id != self.patient_id
                )

        if patient_changed:

            if self.patient.is_deleted:
                raise ValidationError({
                    'patient': (
                        'No puede crear una historia clínica '
                        'para un paciente eliminado.'
                    )
                })

            if not self.patient.is_active:
                raise ValidationError({
                    'patient': (
                        'No puede crear una historia clínica '
                        'para un paciente desactivado.'
                    )
                })

    def save(self, *args, **kwargs):

        if self.medical_history:
            self.medical_history = self.medical_history.strip()

        if self.allergies:
            self.allergies = self.allergies.strip()

        if self.general_observations:
            self.general_observations = (
                self.general_observations.strip()
            )

        if self.inactive_reason:
            self.inactive_reason = self.inactive_reason.strip()

        self.full_clean()

        super().save(*args, **kwargs)

    class Meta:
        ordering = [
            'patient__last_name',
            'patient__first_name',
        ]

    def __str__(self):
        return str(self.patient)