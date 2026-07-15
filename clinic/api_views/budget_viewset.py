from django.utils import timezone

from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from ..permissions import ClinicModelPermissions
from rest_framework.response import Response

from ..models.budget import Budget
from ..serializers.budget_serializer import (
    BudgetSerializer,
    BudgetNestedSerializer,
)


class BudgetViewSet(viewsets.ModelViewSet):

    permission_classes = [
        ClinicModelPermissions
    ]

    filter_backends = [
        filters.SearchFilter
    ]

    search_fields = [
        'patient__dni',
        'patient__first_name',
        'patient__last_name',
        'suggested_treatment__diagnosis',
        'suggested_treatment__procedure__name',
        'budget_status',
    ]

    def get_queryset(self):

        queryset = Budget.objects.select_related(
            'patient',
            'suggested_treatment',
            'suggested_treatment__procedure',
            'suggested_treatment__medical_record',
            'suggested_treatment__medical_record__patient',
            'suggested_treatment__specialist',
            'suggested_treatment__specialist__specialty',
        ).all()

        show_deleted = (
            self.request.query_params
            .get('show_deleted', '')
            .lower()
            == 'true'
        )

        patient_id = self.request.query_params.get(
            'patient'
        )

        treatment_id = self.request.query_params.get(
            'suggested_treatment'
        )

        budget_status = self.request.query_params.get(
            'status'
        )

        if not show_deleted:
            queryset = queryset.filter(
                is_deleted=False
            )

        if patient_id:
            queryset = queryset.filter(
                patient_id=patient_id
            )

        if treatment_id:
            queryset = queryset.filter(
                suggested_treatment_id=treatment_id
            )

        if budget_status:
            queryset = queryset.filter(
                budget_status=budget_status
            )

        return queryset.order_by(
            '-issue_date',
            '-created_at'
        )

    def get_serializer_class(self):

        if self.action in [
            'list',
            'retrieve',
        ]:
            return BudgetNestedSerializer

        return BudgetSerializer

    def perform_create(self, serializer):

        treatment = serializer.validated_data[
            'suggested_treatment'
        ]

        if treatment.treatment_status not in [
            'Suggested',
            'Budgeted',
        ]:
            raise ValidationError(
                'Este tratamiento no está disponible '
                'para generar un presupuesto.'
            )

        budget = serializer.save()

        if treatment.treatment_status == 'Suggested':

            treatment.treatment_status = 'Budgeted'

            treatment.save(
                update_fields=[
                    'treatment_status',
                    'updated_at',
                ]
            )

        return budget

    def perform_update(self, serializer):

        budget = self.get_object()

        if budget.is_deleted:
            raise ValidationError(
                'No puede editar un presupuesto eliminado.'
            )

        if budget.budget_status != 'Draft':
            raise ValidationError(
                'Solo puede editar presupuestos en estado borrador.'
            )

        serializer.save()

    def perform_destroy(self, instance):

        if instance.is_deleted:
            raise ValidationError(
                'El presupuesto ya fue eliminado.'
            )

        if instance.budget_status in [
            'Accepted',
            'Completed',
        ]:
            raise ValidationError(
                'No puede eliminar un presupuesto aceptado '
                'o completado.'
            )

        if instance.payment_set.exists():
            raise ValidationError(
                'No puede eliminar un presupuesto que tiene '
                'pagos registrados.'
            )

        instance.is_active = False
        instance.is_deleted = True

        instance.save(
            update_fields=[
                'is_active',
                'is_deleted',
                'updated_at',
            ]
        )

    @action(
        detail=True,
        methods=['patch']
    )
    def send(self, request, pk=None):

        budget = Budget.objects.filter(
            pk=pk
        ).first()

        if not budget:
            return Response(
                {
                    'detail': 'El presupuesto no existe.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if budget.is_deleted:
            return Response(
                {
                    'detail': (
                        'No puede enviar un presupuesto eliminado.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if budget.budget_status != 'Draft':
            return Response(
                {
                    'detail': (
                        'Solo un presupuesto en borrador '
                        'puede enviarse.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        budget.budget_status = 'Sent'

        budget.save(
            update_fields=[
                'budget_status',
                'updated_at',
            ]
        )

        serializer = BudgetNestedSerializer(
            budget
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    @action(
        detail=True,
        methods=['patch']
    )
    def accept(self, request, pk=None):

        budget = Budget.objects.filter(
            pk=pk
        ).select_related(
            'patient',
            'suggested_treatment',
            'suggested_treatment__medical_record',
            'suggested_treatment__procedure',
        ).first()

        if not budget:
            return Response(
                {
                    'detail': 'El presupuesto no existe.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if budget.is_deleted:
            return Response(
                {
                    'detail': (
                        'No puede aceptar un presupuesto eliminado.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if budget.budget_status != 'Sent':
            return Response(
                {
                    'detail': (
                        'Solo un presupuesto enviado puede aceptarse.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if budget.patient.is_deleted:
            return Response(
                {
                    'detail': (
                        'No puede aceptar el presupuesto porque '
                        'el paciente está eliminado.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not budget.patient.is_active:
            return Response(
                {
                    'detail': (
                        'No puede aceptar el presupuesto porque '
                        'el paciente está desactivado.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        treatment = budget.suggested_treatment

        if treatment.is_deleted or not treatment.is_active:
            return Response(
                {
                    'detail': (
                        'No puede aceptar el presupuesto porque '
                        'el tratamiento no está disponible.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not treatment.medical_record.is_active:
            return Response(
                {
                    'detail': (
                        'No puede aceptar el presupuesto porque '
                        'la historia clínica está desactivada.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        budget.budget_status = 'Accepted'
        budget.rejected_reason = None
        budget.rejected_at = None

        budget.save(
            update_fields=[
                'budget_status',
                'rejected_reason',
                'rejected_at',
                'updated_at',
            ]
        )

        serializer = BudgetNestedSerializer(
            budget
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    @action(
        detail=True,
        methods=['patch']
    )
    def reject(self, request, pk=None):

        budget = Budget.objects.filter(
            pk=pk
        ).first()

        if not budget:
            return Response(
                {
                    'detail': 'El presupuesto no existe.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if budget.is_deleted:
            return Response(
                {
                    'detail': (
                        'No puede rechazar un presupuesto eliminado.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if budget.budget_status != 'Sent':
            return Response(
                {
                    'detail': (
                        'Solo un presupuesto enviado puede rechazarse.'
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
                        'Debe ingresar el motivo de rechazo.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        budget.budget_status = 'Rejected'
        budget.is_active = False
        budget.rejected_reason = reason
        budget.rejected_at = timezone.now()

        budget.save(
            update_fields=[
                'budget_status',
                'is_active',
                'rejected_reason',
                'rejected_at',
                'updated_at',
            ]
        )

        serializer = BudgetNestedSerializer(
            budget
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

        budget = Budget.objects.filter(
            pk=pk
        ).select_related(
            'patient',
            'suggested_treatment',
            'suggested_treatment__medical_record',
            'suggested_treatment__procedure',
        ).first()

        if not budget:
            return Response(
                {
                    'detail': 'El presupuesto no existe.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if not budget.is_deleted:
            return Response(
                {
                    'detail': (
                        'El presupuesto no está eliminado.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        patient = budget.patient
        treatment = budget.suggested_treatment

        if patient.is_deleted or not patient.is_active:
            return Response(
                {
                    'detail': (
                        'No puede restaurar el presupuesto porque '
                        'el paciente no está activo.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if treatment.is_deleted or not treatment.is_active:
            return Response(
                {
                    'detail': (
                        'No puede restaurar el presupuesto porque '
                        'el tratamiento no está disponible.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not treatment.medical_record.is_active:
            return Response(
                {
                    'detail': (
                        'No puede restaurar el presupuesto porque '
                        'la historia clínica está desactivada.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if treatment.procedure.is_deleted:
            return Response(
                {
                    'detail': (
                        'No puede restaurar el presupuesto porque '
                        'el procedimiento está eliminado.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        budget.is_deleted = False
        budget.is_active = True
        budget.budget_status = 'Draft'
        budget.rejected_reason = None
        budget.rejected_at = None

        budget.save(
            update_fields=[
                'is_deleted',
                'is_active',
                'budget_status',
                'rejected_reason',
                'rejected_at',
                'updated_at',
            ]
        )

        serializer = BudgetNestedSerializer(
            budget
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )