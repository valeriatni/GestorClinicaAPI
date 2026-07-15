from decimal import Decimal

from rest_framework import serializers

from ..models.budget import Budget
from .patient_serializer import PatientSerializer
from .suggested_treatment_serializer import (
    SuggestedTreatmentDetailSerializer,
)


class BudgetSerializer(serializers.ModelSerializer):

    class Meta:
        model = Budget

        fields = [
            'id',
            'suggested_treatment',
            'patient',
            'issue_date',
            'gross_total',
            'discount',
            'net_total',
            'budget_status',
            'is_active',
            'is_deleted',
            'rejected_reason',
            'rejected_at',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'patient',
            'gross_total',
            'net_total',
            'budget_status',
            'is_active',
            'is_deleted',
            'rejected_reason',
            'rejected_at',
            'created_at',
            'updated_at',
        ]

    def validate_suggested_treatment(self, treatment):

        medical_record = treatment.medical_record
        patient = medical_record.patient
        procedure = treatment.procedure

        if treatment.is_deleted:
            raise serializers.ValidationError(
                'El tratamiento sugerido está eliminado.'
            )

        if not treatment.is_active:
            raise serializers.ValidationError(
                'El tratamiento sugerido no está activo.'
            )

        if treatment.treatment_status in [
            'Finished',
            'Cancelled',
        ]:
            raise serializers.ValidationError(
                'No puede presupuestar un tratamiento '
                'finalizado o cancelado.'
            )

        if patient.is_deleted:
            raise serializers.ValidationError(
                'El paciente del tratamiento está eliminado.'
            )

        if not patient.is_active:
            raise serializers.ValidationError(
                'El paciente del tratamiento está desactivado.'
            )

        if not medical_record.is_active:
            raise serializers.ValidationError(
                'La historia clínica está desactivada.'
            )

        if procedure.is_deleted:
            raise serializers.ValidationError(
                'El procedimiento está eliminado.'
            )

        if not procedure.is_active:
            raise serializers.ValidationError(
                'El procedimiento está desactivado.'
            )

        return treatment

    def validate_discount(self, value):

        if value < 0:
            raise serializers.ValidationError(
                'El descuento no puede ser negativo.'
            )

        return value

    def validate(self, attrs):

        treatment = attrs.get(
            'suggested_treatment',
            getattr(
                self.instance,
                'suggested_treatment',
                None
            )
        )

        discount = attrs.get(
            'discount',
            getattr(
                self.instance,
                'discount',
                Decimal('0.00')
            )
        )

        if not treatment:
            return attrs

        gross_total = treatment.procedure.base_price

        if discount > gross_total:
            raise serializers.ValidationError({
                'discount': (
                    'El descuento no puede superar el precio '
                    'base del procedimiento.'
                )
            })

        if self.instance:

            if self.instance.is_deleted:
                raise serializers.ValidationError(
                    'No puede modificar un presupuesto eliminado.'
                )

            if self.instance.budget_status != 'Draft':
                raise serializers.ValidationError(
                    'Solo puede editar presupuestos en estado borrador.'
                )

            if (
                'suggested_treatment' in attrs
                and treatment.id
                != self.instance.suggested_treatment_id
            ):
                raise serializers.ValidationError({
                    'suggested_treatment': (
                        'No puede cambiar el tratamiento de '
                        'un presupuesto existente.'
                    )
                })

        return attrs

    def create(self, validated_data):

        treatment = validated_data[
            'suggested_treatment'
        ]

        patient = treatment.medical_record.patient
        gross_total = treatment.procedure.base_price

        discount = validated_data.get(
            'discount',
            Decimal('0.00')
        )

        net_total = gross_total - discount

        return Budget.objects.create(
            patient=patient,
            gross_total=gross_total,
            net_total=net_total,
            **validated_data
        )

    def update(self, instance, validated_data):

        discount = validated_data.get(
            'discount',
            instance.discount
        )

        instance.issue_date = validated_data.get(
            'issue_date',
            instance.issue_date
        )

        instance.discount = discount
        instance.net_total = (
            instance.gross_total - discount
        )

        instance.save()

        return instance


class BudgetNestedSerializer(serializers.ModelSerializer):

    patient = PatientSerializer(
        read_only=True
    )

    suggested_treatment = (
        SuggestedTreatmentDetailSerializer(
            read_only=True
        )
    )

    class Meta:
        model = Budget

        fields = [
            'id',
            'suggested_treatment',
            'patient',
            'issue_date',
            'gross_total',
            'discount',
            'net_total',
            'budget_status',
            'is_active',
            'is_deleted',
            'rejected_reason',
            'rejected_at',
            'created_at',
            'updated_at',
        ]