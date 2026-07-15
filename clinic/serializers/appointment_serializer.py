from datetime import datetime, time

from django.utils import timezone

from rest_framework import serializers

from ..models.appointment import Appointment
from .patient_serializer import PatientSerializer
from .specialist_serializer import (
    SpecialistDetailSerializer,
)


ALLOWED_APPOINTMENT_TIMES = {
    time(8, 0),
    time(8, 30),
    time(9, 0),
    time(9, 30),
    time(10, 0),
    time(10, 30),
    time(11, 0),
    time(11, 30),

    time(14, 0),
    time(14, 30),
    time(15, 0),
    time(15, 30),
    time(16, 0),
    time(16, 30),
    time(17, 0),
    time(17, 30),
}


class AppointmentSerializer(
    serializers.ModelSerializer
):

    patient_name = serializers.SerializerMethodField()
    specialist_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment

        fields = [
            'id',
            'patient',
            'patient_name',
            'specialist',
            'specialist_name',
            'appointment_date',
            'appointment_time',
            'reason',
            'appointment_status',
            'is_active',
            'is_deleted',
            'cancelled_reason',
            'cancelled_at',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'appointment_status',
            'is_active',
            'is_deleted',
            'cancelled_reason',
            'cancelled_at',
            'created_at',
            'updated_at',
        ]

    def get_patient_name(self, appointment):

        return (
            f'{appointment.patient.first_name} '
            f'{appointment.patient.last_name}'
        ).strip()

    def get_specialist_name(self, appointment):

        return (
            f'{appointment.specialist.first_name} '
            f'{appointment.specialist.last_name}'
        ).strip()


    def validate_patient(self, patient):

        if patient.is_deleted:
            raise serializers.ValidationError(
                'El paciente seleccionado está eliminado.'
            )

        if not patient.is_active:
            raise serializers.ValidationError(
                'El paciente seleccionado está desactivado.'
            )

        return patient

    def validate_specialist(
        self,
        specialist
    ):

        if specialist.is_deleted:
            raise serializers.ValidationError(
                'El especialista seleccionado está eliminado.'
            )

        if not specialist.is_active:
            raise serializers.ValidationError(
                'El especialista seleccionado está desactivado.'
            )

        if specialist.specialty.is_deleted:
            raise serializers.ValidationError(
                'La especialidad del especialista está eliminada.'
            )

        if not specialist.specialty.is_active:
            raise serializers.ValidationError(
                'La especialidad del especialista está desactivada.'
            )

        return specialist

    def validate_reason(
        self,
        value
    ):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                'Debe ingresar el motivo de la cita.'
            )

        if len(value) < 5:
            raise serializers.ValidationError(
                'El motivo debe tener al menos 5 caracteres.'
            )

        if len(value) > 250:
            raise serializers.ValidationError(
                'El motivo no puede superar los 250 caracteres.'
            )

        return value

    def validate(
        self,
        attrs
    ):

        patient = attrs.get(
            'patient',
            getattr(
                self.instance,
                'patient',
                None
            )
        )

        specialist = attrs.get(
            'specialist',
            getattr(
                self.instance,
                'specialist',
                None
            )
        )

        appointment_date = attrs.get(
            'appointment_date',
            getattr(
                self.instance,
                'appointment_date',
                None
            )
        )

        appointment_time = attrs.get(
            'appointment_time',
            getattr(
                self.instance,
                'appointment_time',
                None
            )
        )

        if not all([
            patient,
            specialist,
            appointment_date,
            appointment_time,
        ]):
            return attrs

        normalized_time = (
            appointment_time.replace(
                second=0,
                microsecond=0,
            )
        )

        if normalized_time not in (
            ALLOWED_APPOINTMENT_TIMES
        ):
            raise serializers.ValidationError({
                'appointment_time': (
                    'Debe seleccionar un horario válido '
                    'de 30 minutos entre 08:00 y 12:00 '
                    'o entre 14:00 y 18:00.'
                )
            })

        today = timezone.localdate()

        if appointment_date < today:
            raise serializers.ValidationError({
                'appointment_date': (
                    'No puede registrar una cita '
                    'en una fecha pasada.'
                )
            })

        appointment_datetime = (
            timezone.make_aware(
                datetime.combine(
                    appointment_date,
                    normalized_time,
                ),
                timezone.get_current_timezone(),
            )
        )

        if appointment_datetime <= (
            timezone.localtime()
        ):
            raise serializers.ValidationError({
                'appointment_time': (
                    'La fecha y la hora de la cita '
                    'deben ser posteriores al momento actual.'
                )
            })

        specialist_conflict = (
            Appointment.objects.filter(
                specialist=specialist,
                appointment_date=appointment_date,
                appointment_time=normalized_time,
                is_active=True,
                is_deleted=False,
            )
        )

        patient_conflict = (
            Appointment.objects.filter(
                patient=patient,
                appointment_date=appointment_date,
                appointment_time=normalized_time,
                is_active=True,
                is_deleted=False,
            )
        )

        if self.instance:
            specialist_conflict = (
                specialist_conflict.exclude(
                    pk=self.instance.pk
                )
            )

            patient_conflict = (
                patient_conflict.exclude(
                    pk=self.instance.pk
                )
            )

        if specialist_conflict.exists():
            raise serializers.ValidationError({
                'appointment_time': (
                    'El especialista ya tiene una cita '
                    'programada en este horario.'
                )
            })

        if patient_conflict.exists():
            raise serializers.ValidationError({
                'appointment_time': (
                    'El paciente ya tiene una cita '
                    'programada en este horario.'
                )
            })

        return attrs

    def create(
        self,
        validated_data
    ):

        validated_data[
            'appointment_status'
        ] = 'Pending'

        validated_data[
            'is_active'
        ] = True

        validated_data[
            'is_deleted'
        ] = False

        return super().create(
            validated_data
        )


class AppointmentDetailSerializer(
    AppointmentSerializer
):

    patient = PatientSerializer(
        read_only=True
    )

    specialist = (
        SpecialistDetailSerializer(
            read_only=True
        )
    )

    class Meta(
        AppointmentSerializer.Meta
    ):
        fields = (
            AppointmentSerializer
            .Meta
            .fields
        )