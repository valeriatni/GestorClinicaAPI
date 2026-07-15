from django.utils import timezone

from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from ..permissions import ClinicModelPermissions
from rest_framework.response import Response

from ..models.specialist import Specialist
from ..serializers.specialist_serializer import (
    SpecialistSerializer,
    SpecialistDetailSerializer,
)


class SpecialistViewSet(viewsets.ModelViewSet):

    permission_classes = [ClinicModelPermissions]

    filter_backends = [
        filters.SearchFilter
    ]

    search_fields = [
        'first_name',
        'last_name',
        'license_number',
        'phone',
        'email',
        'specialty__name',
    ]

    def get_queryset(self):

        queryset = Specialist.objects.select_related(
            'specialty'
        ).all()

        show_inactive = (
            self.request.query_params
            .get('show_inactive', '')
            .lower()
            == 'true'
        )

        show_deleted = (
            self.request.query_params
            .get('show_deleted', '')
            .lower()
            == 'true'
        )

        specialty_id = self.request.query_params.get(
            'specialty'
        )

        if not show_deleted:
            queryset = queryset.filter(
                is_deleted=False
            )

        if not show_inactive:
            queryset = queryset.filter(
                is_active=True
            )

        if specialty_id:
            queryset = queryset.filter(
                specialty_id=specialty_id
            )

        return queryset.order_by(
            'last_name',
            'first_name'
        )

    def get_serializer_class(self):

        if self.action == 'retrieve':
            return SpecialistDetailSerializer

        return SpecialistSerializer

    def perform_destroy(self, instance):
        """
        Eliminación lógica del especialista.
        """

        instance.is_active = False
        instance.is_deleted = True
        instance.inactive_reason = (
            'Especialista eliminado lógicamente.'
        )
        instance.deactivated_at = timezone.now()

        instance.save(
            update_fields=[
                'is_active',
                'is_deleted',
                'inactive_reason',
                'deactivated_at',
                'updated_at',
            ]
        )

    @action(
        detail=True,
        methods=['patch']
    )
    def deactivate(self, request, pk=None):
        """
        Desactiva temporalmente al especialista.
        """

        specialist = Specialist.objects.filter(
            pk=pk
        ).first()

        if not specialist:
            return Response(
                {
                    'detail': 'El especialista no existe.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if specialist.is_deleted:
            return Response(
                {
                    'detail': (
                        'No puede desactivar un especialista '
                        'eliminado. Primero debe restaurarlo.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not specialist.is_active:
            return Response(
                {
                    'detail': (
                        'El especialista ya está desactivado.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get(
            'reason',
            ''
        ).strip()

        if not reason:
            return Response(
                {
                    'reason': (
                        'Debe ingresar el motivo '
                        'de desactivación.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        specialist.is_active = False
        specialist.inactive_reason = reason
        specialist.deactivated_at = timezone.now()

        specialist.save(
            update_fields=[
                'is_active',
                'inactive_reason',
                'deactivated_at',
                'updated_at',
            ]
        )

        serializer = self.get_serializer(
            specialist
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    @action(
        detail=True,
        methods=['patch']
    )
    def reactivate(self, request, pk=None):
        """
        Reactiva a un especialista desactivado.
        """

        specialist = Specialist.objects.filter(
            pk=pk
        ).select_related(
            'specialty'
        ).first()

        if not specialist:
            return Response(
                {
                    'detail': 'El especialista no existe.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if specialist.is_deleted:
            return Response(
                {
                    'detail': (
                        'El especialista fue eliminado. '
                        'Debe utilizar la opción restaurar.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if specialist.is_active:
            return Response(
                {
                    'detail': (
                        'El especialista ya está activo.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if specialist.specialty.is_deleted:
            return Response(
                {
                    'detail': (
                        'No puede reactivar al especialista porque '
                        'su especialidad está eliminada.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not specialist.specialty.is_active:
            return Response(
                {
                    'detail': (
                        'No puede reactivar al especialista porque '
                        'su especialidad está desactivada.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        specialist.is_active = True
        specialist.inactive_reason = None
        specialist.deactivated_at = None

        specialist.save(
            update_fields=[
                'is_active',
                'inactive_reason',
                'deactivated_at',
                'updated_at',
            ]
        )

        serializer = self.get_serializer(
            specialist
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    @action(
        detail=True,
        methods=['patch']
    )
    def restore(self, request, pk=None):
        """
        Restaura un especialista eliminado lógicamente.
        """

        specialist = Specialist.objects.filter(
            pk=pk
        ).select_related(
            'specialty'
        ).first()

        if not specialist:
            return Response(
                {
                    'detail': 'El especialista no existe.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if not specialist.is_deleted:
            return Response(
                {
                    'detail': (
                        'El especialista no está eliminado.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if specialist.specialty.is_deleted:
            return Response(
                {
                    'detail': (
                        'No puede restaurar al especialista porque '
                        'su especialidad está eliminada.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not specialist.specialty.is_active:
            return Response(
                {
                    'detail': (
                        'No puede restaurar al especialista porque '
                        'su especialidad está desactivada.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        specialist.is_deleted = False
        specialist.is_active = True
        specialist.inactive_reason = None
        specialist.deactivated_at = None

        specialist.save(
            update_fields=[
                'is_deleted',
                'is_active',
                'inactive_reason',
                'deactivated_at',
                'updated_at',
            ]
        )

        serializer = self.get_serializer(
            specialist
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )