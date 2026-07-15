from rest_framework import serializers

from ..models.procedure import Procedure


class ProcedureSerializer(serializers.ModelSerializer):

    class Meta:

        model = Procedure

        fields = [
            'id',
            'name',
            'description',
            'base_price',
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

    def validate_name(self, value):

        value = value.strip().upper()

        if not value:
            raise serializers.ValidationError(
                'Procedure name is required.'
            )

        queryset = Procedure.objects.filter(
            name__iexact=value
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        existing = queryset.first()

        if existing:

            if existing.is_deleted:
                raise serializers.ValidationError(
                    'A deleted procedure with this name already exists. Restore it instead.'
                )

            if not existing.is_active:
                raise serializers.ValidationError(
                    'An inactive procedure with this name already exists. Reactivate it instead.'
                )

            raise serializers.ValidationError(
                'A procedure with this name already exists.'
            )

        return value

    def validate_base_price(self, value):

        if value <= 0:
            raise serializers.ValidationError(
                'Base price must be greater than zero.'
            )

        return value

    def validate_description(self, value):

        if value:
            value = value.strip()

        return value