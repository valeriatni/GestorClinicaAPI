from rest_framework import serializers

from ..models.specialist import Specialist
from .specialty_serializer import SpecialtySerializer


class SpecialistSerializer(serializers.ModelSerializer):

    class Meta:
        model = Specialist

        fields = [
            'id',
            'specialty',
            'first_name',
            'last_name',
            'license_number',
            'phone',
            'email',
            'is_active',
            'is_deleted',
            'inactive_reason',
            'deactivated_at',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'is_deleted',
            'inactive_reason',
            'deactivated_at',
            'created_at',
            'updated_at',
        ]

    def validate_specialty(self, specialty):

        if specialty.is_deleted:
            raise serializers.ValidationError(
                'La especialidad seleccionada está eliminada.'
            )

        if not specialty.is_active:
            raise serializers.ValidationError(
                'La especialidad seleccionada está desactivada.'
            )

        return specialty

    def validate_first_name(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                'Debe ingresar el nombre del especialista.'
            )

        return value

    def validate_last_name(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                'Debe ingresar el apellido del especialista.'
            )

        return value

    def validate_license_number(self, value):

        value = value.strip().upper()

        if len(value) < 5:
            raise serializers.ValidationError(
                'El número de colegiatura debe tener '
                'al menos 5 caracteres.'
            )

        queryset = Specialist.objects.filter(
            license_number__iexact=value
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        existing = queryset.first()

        if existing:

            if existing.is_deleted:
                raise serializers.ValidationError(
                    'Ya existe un especialista eliminado con '
                    'esta colegiatura. Debe restaurarlo.'
                )

            if not existing.is_active:
                raise serializers.ValidationError(
                    'Ya existe un especialista desactivado con '
                    'esta colegiatura. Debe reactivarlo.'
                )

            raise serializers.ValidationError(
                'Ya existe un especialista con esta colegiatura.'
            )

        return value

    def validate_phone(self, value):

        if not value:
            return None

        value = value.strip()

        if not value.isdigit() or len(value) != 9:
            raise serializers.ValidationError(
                'El teléfono debe contener exactamente 9 dígitos.'
            )

        return value

    def validate_email(self, value):

        if not value:
            return None

        value = value.strip().lower()

        queryset = Specialist.objects.filter(
            email__iexact=value
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        existing = queryset.first()

        if existing:

            if existing.is_deleted:
                raise serializers.ValidationError(
                    'Ya existe un especialista eliminado con '
                    'este correo. Debe restaurarlo.'
                )

            if not existing.is_active:
                raise serializers.ValidationError(
                    'Ya existe un especialista desactivado con '
                    'este correo. Debe reactivarlo.'
                )

            raise serializers.ValidationError(
                'Ya existe un especialista con este correo.'
            )

        return value


class SpecialistDetailSerializer(SpecialistSerializer):

    specialty = SpecialtySerializer(
        read_only=True
    )

    class Meta(SpecialistSerializer.Meta):
        fields = SpecialistSerializer.Meta.fields