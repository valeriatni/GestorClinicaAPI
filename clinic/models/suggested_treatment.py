from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

from .medical_record import MedicalRecord
from .specialist import Specialist
from .procedure import Procedure


class SuggestedTreatment(models.Model):

    STATUS_CHOICES = [
        ('Suggested', 'Sugerido'),
        ('Budgeted', 'Presupuestado'),
        ('In Progress', 'En tratamiento'),
        ('Finished', 'Finalizado'),
        ('Cancelled', 'Cancelado'),
    ]

    medical_record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.PROTECT,
        related_name='suggested_treatments'
    )

    procedure = models.ForeignKey(
        Procedure,
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )

    specialist = models.ForeignKey(
        Specialist,
        on_delete=models.PROTECT,
        related_name='suggested_treatments'
    )

    diagnosis = models.TextField()

    clinical_observations = models.TextField(
        null=True,
        blank=True
    )

    diagnosis_date = models.DateField()

    treatment_status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='Suggested'
    )

    is_active = models.BooleanField(
        default=True
    )

    is_deleted = models.BooleanField(
        default=False
    )

    cancelled_reason = models.TextField(
        null=True,
        blank=True
    )

    cancelled_at = models.DateTimeField(
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
                    'Un tratamiento eliminado no puede permanecer activo.'
                )
            })

        if not self.diagnosis or not self.diagnosis.strip():
            raise ValidationError({
                'diagnosis': 'Debe ingresar el diagnóstico.'
            })

        if self.diagnosis_date > timezone.localdate():
            raise ValidationError({
                'diagnosis_date': (
                    'La fecha del diagnóstico no puede estar en el futuro.'
                )
            })

        patient = self.medical_record.patient

        if patient.is_deleted:
            raise ValidationError({
                'medical_record': (
                    'No puede registrar tratamientos para un paciente eliminado.'
                )
            })

        if not patient.is_active:
            raise ValidationError({
                'medical_record': (
                    'No puede registrar tratamientos para un paciente desactivado.'
                )
            })

        if not self.medical_record.is_active:
            raise ValidationError({
                'medical_record': (
                    'La historia clínica está desactivada.'
                )
            })

        if self.specialist.is_deleted:
            raise ValidationError({
                'specialist': (
                    'El especialista seleccionado está eliminado.'
                )
            })

        if not self.specialist.is_active:
            raise ValidationError({
                'specialist': (
                    'El especialista seleccionado está desactivado.'
                )
            })

        if self.specialist.specialty.is_deleted:
            raise ValidationError({
                'specialist': (
                    'La especialidad del especialista está eliminada.'
                )
            })

        if not self.specialist.specialty.is_active:
            raise ValidationError({
                'specialist': (
                    'La especialidad del especialista está desactivada.'
                )
            })

        if self.procedure.is_deleted:
            raise ValidationError({
                'procedure': (
                    'El procedimiento seleccionado está eliminado.'
                )
            })

        if not self.procedure.is_active:
            raise ValidationError({
                'procedure': (
                    'El procedimiento seleccionado está desactivado.'
                )
            })

        if (
            self.treatment_status == 'Cancelled'
            and not self.cancelled_reason
        ):
            raise ValidationError({
                'cancelled_reason': (
                    'Debe registrar el motivo de cancelación.'
                )
            })

    def save(self, *args, **kwargs):

        self.diagnosis = self.diagnosis.strip()

        if self.clinical_observations:
            self.clinical_observations = (
                self.clinical_observations.strip()
            )

        if self.cancelled_reason:
            self.cancelled_reason = (
                self.cancelled_reason.strip()
            )

        self.full_clean()

        super().save(*args, **kwargs)

    class Meta:

        ordering = [
            '-diagnosis_date',
            '-created_at'
        ]

        indexes = [
            models.Index(
                fields=['medical_record']
            ),
            models.Index(
                fields=['procedure']
            ),
            models.Index(
                fields=['specialist']
            ),
            models.Index(
                fields=['treatment_status']
            ),
        ]

    def __str__(self):
        return (
            f'{self.procedure.name} - '
            f'{self.medical_record.patient}'
        )