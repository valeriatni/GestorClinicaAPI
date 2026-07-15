from datetime import datetime

from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

from .patient import Patient
from .specialist import Specialist


class Appointment(models.Model):

    STATUS_CHOICES = [
        ('Pending', 'Pendiente'),
        ('Attended', 'Atendida'),
        ('Cancelled', 'Cancelada'),
        ('No Show', 'No asistió'),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.PROTECT,
        related_name='appointments'
    )

    specialist = models.ForeignKey(
        Specialist,
        on_delete=models.PROTECT,
        related_name='appointments'
    )

    appointment_date = models.DateField()

    appointment_time = models.TimeField()

    reason = models.TextField()

    appointment_status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='Pending'
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
                    'Una cita eliminada no puede permanecer activa.'
                )
            })

        if not self.reason or not self.reason.strip():
            raise ValidationError({
                'reason': 'Debe ingresar el motivo de la cita.'
            })

        schedule_changed = True

        if self.pk:
            previous = Appointment.objects.filter(
                pk=self.pk
            ).only(
                'appointment_date',
                'appointment_time'
            ).first()

            if previous:
                schedule_changed = (
                    previous.appointment_date != self.appointment_date
                    or previous.appointment_time != self.appointment_time
                )

        # Solo validar pasado al crear o reprogramar.
        if schedule_changed:

            appointment_datetime = datetime.combine(
                self.appointment_date,
                self.appointment_time
            )

            appointment_datetime = timezone.make_aware(
                appointment_datetime,
                timezone.get_current_timezone()
            )

            if appointment_datetime <= timezone.now():
                raise ValidationError({
                    'appointment_date': (
                        'La cita debe programarse para una fecha '
                        'y hora futuras.'
                    )
                })

        if self.appointment_time.hour < 8:
            raise ValidationError({
                'appointment_time': (
                    'La clínica atiende desde las 08:00.'
                )
            })

        if self.appointment_time.hour >= 18:
            raise ValidationError({
                'appointment_time': (
                    'La clínica atiende hasta las 18:00.'
                )
            })

        # Solo se exige disponibilidad para una cita pendiente.
        if (
            self.appointment_status == 'Pending'
            and not self.is_deleted
        ):

            if self.patient.is_deleted:
                raise ValidationError({
                    'patient': (
                        'No puede crear una cita para un paciente eliminado.'
                    )
                })

            if not self.patient.is_active:
                raise ValidationError({
                    'patient': (
                        'No puede crear una cita para un paciente desactivado.'
                    )
                })

            if self.specialist.is_deleted:
                raise ValidationError({
                    'specialist': (
                        'No puede seleccionar un especialista eliminado.'
                    )
                })

            if not self.specialist.is_active:
                raise ValidationError({
                    'specialist': (
                        'No puede seleccionar un especialista desactivado.'
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

        if (
            self.appointment_status == 'Cancelled'
            and not self.cancelled_reason
        ):
            raise ValidationError({
                'cancelled_reason': (
                    'Debe registrar el motivo de cancelación.'
                )
            })

    def save(self, *args, **kwargs):

        self.reason = self.reason.strip()

        if self.cancelled_reason:
            self.cancelled_reason = self.cancelled_reason.strip()

        self.full_clean()

        super().save(*args, **kwargs)

    class Meta:

        ordering = [
            'appointment_date',
            'appointment_time'
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    'specialist',
                    'appointment_date',
                    'appointment_time',
                ],
                condition=models.Q(
                    is_active=True,
                    is_deleted=False
                ),
                name='unique_active_specialist_appointment'
            ),

            models.UniqueConstraint(
                fields=[
                    'patient',
                    'appointment_date',
                    'appointment_time',
                ],
                condition=models.Q(
                    is_active=True,
                    is_deleted=False
                ),
                name='unique_active_patient_appointment'
            ),
        ]

    def __str__(self):
        return (
            f'{self.patient} - '
            f'{self.appointment_date} '
            f'{self.appointment_time}'
        )