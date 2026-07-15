from django.db import transaction
from django.db.models import Sum

from rest_framework import serializers

from ..models.payment import Payment
from .budget_serializer import BudgetNestedSerializer
from .appointment_serializer import AppointmentDetailSerializer


class PaymentSerializer(serializers.ModelSerializer):

    remaining_balance = serializers.SerializerMethodField(
        read_only=True
    )

    class Meta:
        model = Payment

        fields = [
            'id',
            'budget',
            'appointment',
            'amount',
            'payment_date',
            'payment_method',
            'reference_number',
            'remaining_balance',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'payment_date',
            'remaining_balance',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):

        budget = attrs.get('budget')
        appointment = attrs.get('appointment')
        amount = attrs.get('amount')
        payment_method = attrs.get('payment_method')
        reference_number = attrs.get('reference_number')

        if bool(budget) == bool(appointment):
            raise serializers.ValidationError(
                'Debe seleccionar únicamente un presupuesto '
                'o una cita.'
            )

        if amount is not None and amount <= 0:
            raise serializers.ValidationError({
                'amount': (
                    'El monto debe ser mayor que cero.'
                )
            })

        if (
            payment_method in [
                'Card',
                'Transfer',
                'Insurance',
            ]
            and not reference_number
        ):
            raise serializers.ValidationError({
                'reference_number': (
                    'Debe ingresar el número de referencia.'
                )
            })

        if budget:

            if budget.is_deleted:
                raise serializers.ValidationError({
                    'budget': (
                        'El presupuesto está eliminado.'
                    )
                })

            if budget.patient.is_deleted:
                raise serializers.ValidationError({
                    'budget': (
                        'El paciente del presupuesto está eliminado.'
                    )
                })

            if budget.budget_status == 'Rejected':
                raise serializers.ValidationError({
                    'budget': (
                        'No puede registrar pagos para '
                        'un presupuesto rechazado.'
                    )
                })

            if budget.budget_status == 'Completed':
                raise serializers.ValidationError({
                    'budget': (
                        'El presupuesto ya está '
                        'completamente pagado.'
                    )
                })

            total_paid = Payment.objects.filter(
                budget=budget
            ).aggregate(
                total=Sum('amount')
            )['total'] or 0

            remaining_balance = (
                budget.net_total - total_paid
            )

            if remaining_balance <= 0:
                raise serializers.ValidationError({
                    'budget': (
                        'El presupuesto ya está '
                        'completamente pagado.'
                    )
                })

            if (
                amount is not None
                and amount > remaining_balance
            ):
                raise serializers.ValidationError({
                    'amount': (
                        f'El monto supera el saldo pendiente. '
                        f'Saldo: S/ {remaining_balance}.'
                    )
                })

        if appointment:

            if appointment.is_deleted:
                raise serializers.ValidationError({
                    'appointment': (
                        'La cita está eliminada.'
                    )
                })

            if appointment.appointment_status in [
                'Cancelled',
                'No Show',
            ]:
                raise serializers.ValidationError({
                    'appointment': (
                        'No puede registrar un pago para una cita '
                        'cancelada o no asistida.'
                    )
                })

            if Payment.objects.filter(
                appointment=appointment
            ).exists():
                raise serializers.ValidationError({
                    'appointment': (
                        'Esta cita ya tiene un pago registrado.'
                    )
                })

        return attrs

    @transaction.atomic
    def create(self, validated_data):

        payment = Payment.objects.create(
            **validated_data
        )

        if payment.budget:

            total_paid = Payment.objects.filter(
                budget=payment.budget
            ).aggregate(
                total=Sum('amount')
            )['total'] or 0

            if total_paid >= payment.budget.net_total:

                payment.budget.budget_status = 'Completed'
                payment.budget.is_active = False

                payment.budget.save(
                    update_fields=[
                        'budget_status',
                        'is_active',
                        'updated_at',
                    ]
                )

        return payment

    def get_remaining_balance(self, obj):

        if not obj.budget:
            return None

        total_paid = Payment.objects.filter(
            budget=obj.budget
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0

        remaining = (
            obj.budget.net_total - total_paid
        )

        return max(remaining, 0)


class PaymentDetailSerializer(serializers.ModelSerializer):

    budget = BudgetNestedSerializer(
        read_only=True
    )

    appointment = AppointmentDetailSerializer(
        read_only=True
    )

    remaining_balance = serializers.SerializerMethodField()

    class Meta:
        model = Payment

        fields = [
            'id',
            'budget',
            'appointment',
            'amount',
            'payment_date',
            'payment_method',
            'reference_number',
            'remaining_balance',
            'created_at',
            'updated_at',
        ]

    def get_remaining_balance(self, obj):

        if not obj.budget:
            return None

        total_paid = Payment.objects.filter(
            budget=obj.budget
        ).aggregate(
                total=Sum('amount')
            )['total'] or 0

        remaining = (
            obj.budget.net_total - total_paid
        )

        return max(remaining, 0)
