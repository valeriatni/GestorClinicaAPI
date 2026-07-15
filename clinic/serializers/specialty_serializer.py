from rest_framework import serializers

from ..models.specialty import Specialty


class SpecialtySerializer(serializers.ModelSerializer):

    class Meta:
        model = Specialty

        fields = [
            'id',
            'name',
            'description',
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

    def validate_name(self, value):

        value = value.strip()

        specialty = Specialty.objects.filter(
            name__iexact=value
        )

        if self.instance:
            specialty = specialty.exclude(
                pk=self.instance.pk
            )

        existing_specialty = specialty.first()

        if existing_specialty:

            if existing_specialty.is_deleted:
                raise serializers.ValidationError(
                    'Ya existe una especialidad eliminada '
                    'con este nombre. Debe restaurarla.'
                )

            if not existing_specialty.is_active:
                raise serializers.ValidationError(
                    'Ya existe una especialidad desactivada '
                    'con este nombre. Debe reactivarla.'
                )

            raise serializers.ValidationError(
                'Ya existe una especialidad con este nombre.'
            )

        return value