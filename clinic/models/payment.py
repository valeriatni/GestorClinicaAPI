from django.db import models
from django.core.exceptions import ValidationError
from django.db.models import Sum

from .budget import Budget
from .appointment import Appointment


class Payment(models.Model):

    METHOD_CHOICES = [
        ('Cash', 'Efectivo'),
        ('Card', 'Tarjeta'),
        ('Transfer', 'Transferencia'),
        ('Insurance', 'Seguro'),
    ]

    budget = models.ForeignKey(
        Budget,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='payments'
    )

    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='payments'
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    payment_date = models.DateTimeField(
        auto_now_add=True
    )

    payment_method = models.CharField(
        max_length=20,
        choices=METHOD_CHOICES
    )

    reference_number = models.CharField(
        max_length=100,
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

        if self.amount <= 0:
            raise ValidationError({
                'amount': (
                    'El monto del pago debe ser mayor que cero.'
                )
            })

        # Debe tener presupuesto o cita, pero no ambos.
        if bool(self.budget) == bool(self.appointment):
            raise ValidationError(
                'El pago debe asociarse únicamente a un '
                'presupuesto o a una cita.'
            )

        if (
            self.payment_method in [
                'Card',
                'Transfer',
                'Insurance',
            ]
            and not self.reference_number
        ):
            raise ValidationError({
                'reference_number': (
                    'Debe ingresar el número de referencia '
                    'para este método de pago.'
                )
            })

        if self.budget:

            if self.budget.is_deleted:
                raise ValidationError({
                    'budget': (
                        'No puede registrar pagos para un '
                        'presupuesto eliminado.'
                    )
                })

            if self.budget.budget_status not in [
                'Accepted',
                'Completed',
            ]:
                raise ValidationError({
                    'budget': (
                        'Solo se pueden registrar pagos para '
                        'presupuestos aceptados.'
                    )
                })

            if self.budget.budget_status == 'Completed':
                raise ValidationError({
                    'budget': (
                        'El presupuesto ya está completamente pagado.'
                    )
                })

            if self.budget.patient.is_deleted:
                raise ValidationError({
                    'budget': (
                        'El paciente del presupuesto está eliminado.'
                    )
                })

            previous_payments = Payment.objects.filter(
                budget=self.budget
            )

            if self.pk:
                previous_payments = previous_payments.exclude(
                    pk=self.pk
                )

            total_paid = previous_payments.aggregate(
                total=Sum('amount')
            )['total'] or 0

            remaining_balance = (
                self.budget.net_total - total_paid
            )

            if remaining_balance <= 0:
                raise ValidationError({
                    'budget': (
                        'El presupuesto ya no tiene saldo pendiente.'
                    )
                })

            if self.amount > remaining_balance:
                raise ValidationError({
                    'amount': (
                        f'El monto supera el saldo pendiente. '
                        f'Saldo disponible: S/ {remaining_balance}.'
                    )
                })

        if self.appointment:

            if self.appointment.is_deleted:
                raise ValidationError({
                    'appointment': (
                        'No puede registrar pagos para una cita eliminada.'
                    )
                })

            if self.appointment.appointment_status != 'Attended':
                raise ValidationError({
                    'appointment': (
                        'Solo se puede pagar una cita que fue atendida.'
                    )
                })

            existing_payment = Payment.objects.filter(
                appointment=self.appointment
            )

            if self.pk:
                existing_payment = existing_payment.exclude(
                    pk=self.pk
                )

            if existing_payment.exists():
                raise ValidationError({
                    'appointment': (
                        'Esta cita ya tiene un pago registrado.'
                    )
                })

    def save(self, *args, **kwargs):

        if self.reference_number:
            self.reference_number = (
                self.reference_number.strip().upper()
            )

        self.full_clean()

        super().save(*args, **kwargs)

    class Meta:

        ordering = [
            '-payment_date'
        ]

        indexes = [
            models.Index(
                fields=['budget']
            ),
            models.Index(
                fields=['appointment']
            ),
            models.Index(
                fields=['payment_date']
            ),
        ]

    def __str__(self):
        return f'Pago #{self.id}'