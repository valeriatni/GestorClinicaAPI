from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import action
from ..permissions import ClinicModelPermissions
from rest_framework.response import Response

from ..models.specialty import Specialty
from ..serializers.specialty_serializer import SpecialtySerializer


class SpecialtyViewSet(viewsets.ModelViewSet):

    serializer_class = SpecialtySerializer
    permission_classes = [ClinicModelPermissions]

    def get_queryset(self):

        queryset = Specialty.objects.all()

        show_inactive = (
            self.request.query_params.get('show_inactive', '').lower()
            == 'true'
        )

        show_deleted = (
            self.request.query_params.get('show_deleted', '').lower()
            == 'true'
        )

        # Por defecto no muestra eliminadas lógicamente
        if not show_deleted:
            queryset = queryset.filter(
                is_deleted=False
            )

        # Por defecto solo muestra activas
        if not show_inactive:
            queryset = queryset.filter(
                is_active=True
            )

        return queryset.order_by('name')

    def perform_destroy(self, instance):
        """
        DELETE lógico.

        No elimina realmente la especialidad.
        """

        instance.is_active = False
        instance.is_deleted = True
        instance.inactive_reason = (
            'Especialidad eliminada lógicamente.'
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
        Desactiva temporalmente una especialidad.
        """

        specialty = Specialty.objects.filter(
            pk=pk
        ).first()

        if not specialty:
            return Response(
                {
                    'detail': 'La especialidad no existe.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if specialty.is_deleted:
            return Response(
                {
                    'detail': (
                        'No puede desactivar una especialidad '
                        'eliminada. Primero debe restaurarla.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not specialty.is_active:
            return Response(
                {
                    'detail': (
                        'La especialidad ya se encuentra '
                        'desactivada.'
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

        specialty.is_active = False
        specialty.inactive_reason = reason
        specialty.deactivated_at = timezone.now()

        specialty.save(
            update_fields=[
                'is_active',
                'inactive_reason',
                'deactivated_at',
                'updated_at',
            ]
        )

        serializer = self.get_serializer(
            specialty
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
        Reactiva una especialidad desactivada.
        No restaura una especialidad eliminada.
        """

        specialty = Specialty.objects.filter(
            pk=pk
        ).first()

        if not specialty:
            return Response(
                {
                    'detail': 'La especialidad no existe.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if specialty.is_deleted:
            return Response(
                {
                    'detail': (
                        'La especialidad fue eliminada. '
                        'Debe utilizar la opción restaurar.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if specialty.is_active:
            return Response(
                {
                    'detail': (
                        'La especialidad ya se encuentra activa.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        specialty.is_active = True
        specialty.inactive_reason = None
        specialty.deactivated_at = None

        specialty.save(
            update_fields=[
                'is_active',
                'inactive_reason',
                'deactivated_at',
                'updated_at',
            ]
        )

        serializer = self.get_serializer(
            specialty
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
        Restaura una especialidad eliminada lógicamente.
        """

        specialty = Specialty.objects.filter(
            pk=pk
        ).first()

        if not specialty:
            return Response(
                {
                    'detail': 'La especialidad no existe.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if not specialty.is_deleted:
            return Response(
                {
                    'detail': (
                        'La especialidad no está eliminada.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        specialty.is_deleted = False
        specialty.is_active = True
        specialty.inactive_reason = None
        specialty.deactivated_at = None

        specialty.save(
            update_fields=[
                'is_deleted',
                'is_active',
                'inactive_reason',
                'deactivated_at',
                'updated_at',
            ]
        )

        serializer = self.get_serializer(
            specialty
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )