from django.db.models import Q

from rest_framework import serializers

from ..models.medical_record import MedicalRecord
from ..models.appointment import Appointment
from ..models.suggested_treatment import SuggestedTreatment
from ..models.budget import Budget
from ..models.payment import Payment

from .patient_serializer import PatientSerializer


class MedicalRecordSerializer(serializers.ModelSerializer):

    class Meta:
        model = MedicalRecord

        fields = [
            'id',
            'patient',
            'medical_history',
            'allergies',
            'general_observations',
            'is_active',
            'inactive_reason',
            'deactivated_at',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'is_active',
            'inactive_reason',
            'deactivated_at',
            'created_at',
            'updated_at',
        ]

    def validate_patient(self, patient):

        if patient.is_deleted:
            raise serializers.ValidationError(
                'El paciente seleccionado está eliminado.'
            )

        if not patient.is_active:
            raise serializers.ValidationError(
                'El paciente seleccionado está desactivado.'
            )

        queryset = MedicalRecord.objects.filter(
            patient=patient
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        existing = queryset.first()

        if existing:

            if existing.is_active:
                raise serializers.ValidationError(
                    'Este paciente ya tiene una historia clínica.'
                )

            raise serializers.ValidationError(
                'Este paciente ya tiene una historia clínica '
                'desactivada. Debe reactivarla.'
            )

        return patient

    def validate(self, attrs):

        if self.instance and 'patient' in attrs:

            if attrs['patient'].pk != self.instance.patient_id:
                raise serializers.ValidationError({
                    'patient': (
                        'No puede cambiar el paciente de una '
                        'historia clínica existente.'
                    )
                })

        return attrs


class MedicalRecordListSerializer(serializers.ModelSerializer):

    patient = PatientSerializer(
        read_only=True
    )

    class Meta:
        model = MedicalRecord

        fields = [
            'id',
            'patient',
            'medical_history',
            'allergies',
            'general_observations',
            'is_active',
            'inactive_reason',
            'deactivated_at',
            'created_at',
            'updated_at',
        ]


class MedicalRecordDetailSerializer(serializers.ModelSerializer):

    patient = PatientSerializer(
        read_only=True
    )

    appointments = serializers.SerializerMethodField()
    suggested_treatments = serializers.SerializerMethodField()
    budgets = serializers.SerializerMethodField()
    payments = serializers.SerializerMethodField()

    class Meta:
        model = MedicalRecord

        fields = [
            'id',
            'patient',
            'medical_history',
            'allergies',
            'general_observations',
            'is_active',
            'inactive_reason',
            'deactivated_at',
            'created_at',
            'updated_at',
            'appointments',
            'suggested_treatments',
            'budgets',
            'payments',
        ]

    def get_appointments(self, obj):

        appointments = Appointment.objects.filter(
            patient=obj.patient,
            is_deleted=False,
        ).select_related(
            'specialist'
        ).order_by(
            '-appointment_date',
            '-appointment_time'
        )

        return [
            {
                'id': appointment.id,
                'appointment_date': appointment.appointment_date,
                'appointment_time': appointment.appointment_time,
                'reason': appointment.reason,
                'appointment_status': (
                    appointment.appointment_status
                ),
                'specialist': str(
                    appointment.specialist
                ),
            }
            for appointment in appointments
        ]

    def get_suggested_treatments(self, obj):

        treatments = SuggestedTreatment.objects.filter(
            medical_record=obj
        ).select_related(
            'specialist'
        ).order_by(
            '-diagnosis_date'
        )

        return [
            {
                'id': treatment.id,
                'specialist': str(
                    treatment.specialist
                ),
                'diagnosis': treatment.diagnosis,
                'treatment_description': (
                    treatment.treatment_description
                ),
                'diagnosis_date': treatment.diagnosis_date,
                'treatment_status': treatment.treatment_status,
                'created_at': treatment.created_at,
                'updated_at': treatment.updated_at,
            }
            for treatment in treatments
        ]

    def get_budgets(self, obj):

        budgets = Budget.objects.filter(
            suggested_treatment__medical_record=obj
        ).order_by(
            '-created_at'
        )

        return [
            {
                'id': budget.id,
                'gross_total': budget.gross_total,
                'discount': budget.discount,
                'net_total': budget.net_total,
                'budget_status': budget.budget_status,
                'issue_date': budget.issue_date,
            }
            for budget in budgets
        ]

    def get_payments(self, obj):

        payments = Payment.objects.filter(
            Q(
                budget__patient=obj.patient
            )
            |
            Q(
                appointment__patient=obj.patient
            )
        ).distinct().order_by(
            '-payment_date'
        )

        return [
            {
                'id': payment.id,
                'amount': payment.amount,
                'payment_date': payment.payment_date,
                'payment_method': payment.payment_method,
                'reference_number': payment.reference_number,
                'budget': (
                    payment.budget_id
                    if payment.budget_id
                    else None
                ),
                'appointment': (
                    payment.appointment_id
                    if payment.appointment_id
                    else None
                ),
            }
            for payment in payments
        ]