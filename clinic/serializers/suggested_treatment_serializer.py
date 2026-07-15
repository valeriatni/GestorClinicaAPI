from rest_framework import serializers

from ..models.suggested_treatment import SuggestedTreatment
from .medical_record_serializer import MedicalRecordListSerializer
from .specialist_serializer import SpecialistDetailSerializer
from .procedure_serializer import ProcedureSerializer


class SuggestedTreatmentSerializer(serializers.ModelSerializer):

    class Meta:
        model = SuggestedTreatment

        fields = [
            'id',
            'medical_record',
            'procedure',
            'specialist',
            'diagnosis',
            'clinical_observations',
            'diagnosis_date',
            'treatment_status',
            'is_active',
            'is_deleted',
            'cancelled_reason',
            'cancelled_at',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'treatment_status',
            'is_active',
            'is_deleted',
            'cancelled_reason',
            'cancelled_at',
            'created_at',
            'updated_at',
        ]

    def validate_medical_record(self, medical_record):

        patient = medical_record.patient

        if patient.is_deleted:
            raise serializers.ValidationError(
                'El paciente de esta historia clínica está eliminado.'
            )

        if not patient.is_active:
            raise serializers.ValidationError(
                'El paciente de esta historia clínica está desactivado.'
            )

        if not medical_record.is_active:
            raise serializers.ValidationError(
                'La historia clínica está desactivada.'
            )

        return medical_record

    def validate_specialist(self, specialist):

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

    def validate_procedure(self, procedure):

        if procedure.is_deleted:
            raise serializers.ValidationError(
                'El procedimiento seleccionado está eliminado.'
            )

        if not procedure.is_active:
            raise serializers.ValidationError(
                'El procedimiento seleccionado está desactivado.'
            )

        return procedure

    def validate_diagnosis(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                'Debe ingresar el diagnóstico.'
            )

        return value

    def validate(self, attrs):

        if self.instance:

            if 'medical_record' in attrs:
                if (
                    attrs['medical_record'].pk
                    != self.instance.medical_record_id
                ):
                    raise serializers.ValidationError({
                        'medical_record': (
                            'No puede cambiar la historia clínica '
                            'de un tratamiento existente.'
                        )
                    })

            if self.instance.is_deleted:
                raise serializers.ValidationError(
                    'No puede modificar un tratamiento eliminado.'
                )

            if not self.instance.is_active:
                raise serializers.ValidationError(
                    'No puede modificar un tratamiento inactivo.'
                )

        return attrs


class SuggestedTreatmentDetailSerializer(serializers.ModelSerializer):

    medical_record = MedicalRecordListSerializer(
        read_only=True
    )

    specialist = SpecialistDetailSerializer(
        read_only=True
    )

    procedure = ProcedureSerializer(
        read_only=True
    )

    class Meta:
        model = SuggestedTreatment

        fields = [
            'id',
            'medical_record',
            'procedure',
            'specialist',
            'diagnosis',
            'clinical_observations',
            'diagnosis_date',
            'treatment_status',
            'is_active',
            'is_deleted',
            'cancelled_reason',
            'cancelled_at',
            'created_at',
            'updated_at',
        ]