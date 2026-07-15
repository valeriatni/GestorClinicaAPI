from datetime import date

from rest_framework import serializers

from ..models.patient import Patient


class PatientSerializer(serializers.ModelSerializer):

    class Meta:
        model = Patient

        fields = [
            'id',
            'first_name',
            'last_name',
            'dni',
            'phone',
            'email',
            'birth_date',
            'address',
            'is_active',
            'is_deleted',
            'inactive_reason',
            'deactivated_at',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'is_active',
            'is_deleted',
            'inactive_reason',
            'deactivated_at',
            'created_at',
            'updated_at',
        ]

    def validate_first_name(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                'Debe ingresar el nombre del paciente.'
            )

        return value

    def validate_last_name(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                'Debe ingresar el apellido del paciente.'
            )

        return value

    def validate_dni(self, value):

        value = value.strip()

        if not value.isdigit() or len(value) != 8:
            raise serializers.ValidationError(
                'El DNI debe contener exactamente 8 dígitos.'
            )

        queryset = Patient.objects.filter(
            dni=value
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        existing = queryset.first()

        if existing:

            if existing.is_deleted:
                raise serializers.ValidationError(
                    'Ya existe un paciente eliminado con este DNI. '
                    'Debe restaurarlo.'
                )

            if not existing.is_active:
                raise serializers.ValidationError(
                    'Ya existe un paciente desactivado con este DNI. '
                    'Debe reactivarlo.'
                )

            raise serializers.ValidationError(
                'Ya existe un paciente registrado con este DNI.'
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

        queryset = Patient.objects.filter(
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
                    'Ya existe un paciente eliminado con este correo. '
                    'Debe restaurarlo.'
                )

            if not existing.is_active:
                raise serializers.ValidationError(
                    'Ya existe un paciente desactivado con este correo. '
                    'Debe reactivarlo.'
                )

            raise serializers.ValidationError(
                'Ya existe un paciente registrado con este correo.'
            )

        return value

    def validate_birth_date(self, value):

        if not value:
            return value

        today = date.today()

        if value > today:
            raise serializers.ValidationError(
                'La fecha de nacimiento no puede estar en el futuro.'
            )

        age = today.year - value.year

        if (
            today.month,
            today.day
        ) < (
            value.month,
            value.day
        ):
            age -= 1

        if age > 120:
            raise serializers.ValidationError(
                'La edad ingresada no es válida.'
            )

        return value


class PatientDetailSerializer(PatientSerializer):

    class Meta(PatientSerializer.Meta):
        fields = PatientSerializer.Meta.fields