from django.utils import timezone

from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from ..permissions import ClinicModelPermissions
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from ..models.procedure import Procedure
from ..serializers.procedure_serializer import (
    ProcedureSerializer
)


class ProcedureViewSet(viewsets.ModelViewSet):

    permission_classes = [
        ClinicModelPermissions
    ]

    serializer_class = ProcedureSerializer

    filter_backends = [
        filters.SearchFilter
    ]

    search_fields = [
        'name',
        'description',
    ]

    def get_queryset(self):

        queryset = Procedure.objects.all()

        show_deleted = (
            self.request.query_params.get(
                'show_deleted'
            ) == 'true'
        )

        show_inactive = (
            self.request.query_params.get(
                'show_inactive'
            ) == 'true'
        )

        if not show_deleted:
            queryset = queryset.filter(
                is_deleted=False
            )

        if not show_inactive:
            queryset = queryset.filter(
                is_active=True
            )

        return queryset.order_by(
            'name'
        )

    def has_dependencies(self, procedure):
        return procedure.suggested_treatments.exists()

    def perform_destroy(self, instance):

        if instance.is_deleted:
            raise ValidationError(
                'Procedure already deleted.'
            )

        if self.has_dependencies(instance):
            raise ValidationError(
                'Procedure cannot be deleted because it is already in use.'
            )

        instance.is_active = False
        instance.is_deleted = True
        instance.inactive_reason = (
            'Procedure deleted logically.'
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

        procedure = self.get_object()

        if procedure.is_deleted:
            return Response(
                {
                    'detail':
                    'Cannot deactivate a deleted procedure.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not procedure.is_active:
            return Response(
                {
                    'detail':
                    'Procedure is already inactive.'
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
                    'reason':
                    'Reason is required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if self.has_dependencies(procedure):
            return Response(
                {
                    'detail':
                    'Procedure is currently being used.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        procedure.is_active = False
        procedure.inactive_reason = reason
        procedure.deactivated_at = timezone.now()

        procedure.save(
            update_fields=[
                'is_active',
                'inactive_reason',
                'deactivated_at',
                'updated_at',
            ]
        )

        serializer = self.get_serializer(
            procedure
        )

        return Response(
            serializer.data
        )

    @action(
        detail=True,
        methods=['patch']
    )
    def reactivate(self, request, pk=None):

        procedure = Procedure.objects.filter(
            pk=pk,
            is_deleted=False
        ).first()

        if not procedure:
            return Response(
                {
                    'detail':
                    'Procedure not found.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if procedure.is_active:
            return Response(
                {
                    'detail':
                    'Procedure is already active.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        procedure.is_active = True
        procedure.inactive_reason = None
        procedure.deactivated_at = None

        procedure.save(
            update_fields=[
                'is_active',
                'inactive_reason',
                'deactivated_at',
                'updated_at',
            ]
        )

        serializer = self.get_serializer(
            procedure
        )

        return Response(
            serializer.data
        )

    @action(
        detail=True,
        methods=['patch']
    )
    def restore(self, request, pk=None):

        procedure = Procedure.objects.filter(
            pk=pk,
            is_deleted=True
        ).first()

        if not procedure:
            return Response(
                {
                    'detail':
                    'Procedure not found or not deleted.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        procedure.is_deleted = False
        procedure.is_active = True
        procedure.inactive_reason = None
        procedure.deactivated_at = None

        procedure.save(
            update_fields=[
                'is_deleted',
                'is_active',
                'inactive_reason',
                'deactivated_at',
                'updated_at',
            ]
        )

        serializer = self.get_serializer(
            procedure
        )

        return Response(
            serializer.data
        )