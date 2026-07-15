from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from .patient import Patient
from .suggested_treatment import SuggestedTreatment


class Budget(models.Model):

    STATUS_CHOICES = [
        ('Draft', 'Borrador'),
        ('Sent', 'Enviado'),
        ('Accepted', 'Aceptado'),
        ('Rejected', 'Rechazado'),
        ('Completed', 'Completado'),
    ]

    suggested_treatment = models.ForeignKey(
        SuggestedTreatment,
        on_delete=models.PROTECT,
        related_name='budgets'
    )

    patient = models.ForeignKey(
        Patient,
        on_delete=models.PROTECT,
        related_name='budgets'
    )

    issue_date = models.DateField(
        default=timezone.localdate
    )

    gross_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    net_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    budget_status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='Draft'
    )

    is_active = models.BooleanField(
        default=True
    )

    is_deleted = models.BooleanField(
        default=False
    )

    rejected_reason = models.TextField(
        null=True,
        blank=True
    )

    rejected_at = models.DateTimeField(
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
                    'Un presupuesto eliminado no puede permanecer activo.'
                )
            })

        if self.gross_total <= 0:
            raise ValidationError({
                'gross_total': (
                    'El total bruto debe ser mayor que cero.'
                )
            })

        if self.discount < 0:
            raise ValidationError({
                'discount': (
                    'El descuento no puede ser negativo.'
                )
            })

        if self.discount > self.gross_total:
            raise ValidationError({
                'discount': (
                    'El descuento no puede superar el total bruto.'
                )
            })

        expected_net_total = (
            self.gross_total - self.discount
        )

        if self.net_total != expected_net_total:
            raise ValidationError({
                'net_total': (
                    'El total neto debe ser igual al total bruto '
                    'menos el descuento.'
                )
            })

        treatment = self.suggested_treatment
        medical_record = treatment.medical_record
        treatment_patient = medical_record.patient

        if self.patient_id != treatment_patient.id:
            raise ValidationError({
                'patient': (
                    'El paciente del presupuesto no coincide con '
                    'el paciente del tratamiento sugerido.'
                )
            })

        if treatment_patient.is_deleted:
            raise ValidationError({
                'patient': (
                    'No puede crear un presupuesto para un '
                    'paciente eliminado.'
                )
            })

        if not treatment_patient.is_active:
            raise ValidationError({
                'patient': (
                    'No puede crear un presupuesto para un '
                    'paciente desactivado.'
                )
            })

        if not medical_record.is_active:
            raise ValidationError({
                'suggested_treatment': (
                    'La historia clínica del tratamiento está desactivada.'
                )
            })

        if treatment.is_deleted:
            raise ValidationError({
                'suggested_treatment': (
                    'El tratamiento sugerido está eliminado.'
                )
            })

        if not treatment.is_active:
            raise ValidationError({
                'suggested_treatment': (
                    'El tratamiento sugerido no está activo.'
                )
            })

        if treatment.treatment_status in [
            'Finished',
            'Cancelled',
        ]:
            raise ValidationError({
                'suggested_treatment': (
                    'No puede crear o modificar un presupuesto '
                    'para un tratamiento finalizado o cancelado.'
                )
            })

        if treatment.procedure.is_deleted:
            raise ValidationError({
                'suggested_treatment': (
                    'El procedimiento del tratamiento está eliminado.'
                )
            })

        if (
            self.budget_status == 'Rejected'
            and not self.rejected_reason
        ):
            raise ValidationError({
                'rejected_reason': (
                    'Debe registrar el motivo de rechazo.'
                )
            })

    def save(self, *args, **kwargs):

        if self.rejected_reason:
            self.rejected_reason = (
                self.rejected_reason.strip()
            )

        self.full_clean()

        super().save(*args, **kwargs)

    class Meta:

        ordering = [
            '-issue_date',
            '-created_at',
        ]

        indexes = [
            models.Index(
                fields=['patient']
            ),
            models.Index(
                fields=['suggested_treatment']
            ),
            models.Index(
                fields=['budget_status']
            ),
        ]

    def __str__(self):
        return f'Presupuesto #{self.id}'