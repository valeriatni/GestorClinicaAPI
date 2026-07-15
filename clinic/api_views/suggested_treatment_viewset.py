from django.utils import timezone

from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from ..permissions import ClinicModelPermissions
from rest_framework.response import Response

from ..models.suggested_treatment import SuggestedTreatment
from ..serializers.suggested_treatment_serializer import (
    SuggestedTreatmentSerializer,
    SuggestedTreatmentDetailSerializer,
)


class SuggestedTreatmentViewSet(viewsets.ModelViewSet):

    permission_classes = [
        ClinicModelPermissions
    ]

    filter_backends = [
        filters.SearchFilter
    ]

    search_fields = [
        'medical_record__patient__dni',
        'medical_record__patient__first_name',
        'medical_record__patient__last_name',
        'specialist__first_name',
        'specialist__last_name',
        'procedure__name',
        'diagnosis',
        'clinical_observations',
        'treatment_status',
    ]

    def get_queryset(self):

        queryset = SuggestedTreatment.objects.select_related(
            'medical_record',
            'medical_record__patient',
            'specialist',
            'specialist__specialty',
            'procedure',
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

        medical_record_id = self.request.query_params.get(
            'medical_record'
        )

        patient_id = self.request.query_params.get(
            'patient'
        )

        specialist_id = self.request.query_params.get(
            'specialist'
        )

        procedure_id = self.request.query_params.get(
            'procedure'
        )

        treatment_status = self.request.query_params.get(
            'status'
        )

        if not show_deleted:
            queryset = queryset.filter(
                is_deleted=False
            )

        if not show_inactive:
            queryset = queryset.filter(
                is_active=True
            )

        if medical_record_id:
            queryset = queryset.filter(
                medical_record_id=medical_record_id
            )

        if patient_id:
            queryset = queryset.filter(
                medical_record__patient_id=patient_id
            )

        if specialist_id:
            queryset = queryset.filter(
                specialist_id=specialist_id
            )

        if procedure_id:
            queryset = queryset.filter(
                procedure_id=procedure_id
            )

        if treatment_status:
            queryset = queryset.filter(
                treatment_status=treatment_status
            )

        return queryset.order_by(
            '-diagnosis_date',
            '-created_at'
        )

    def get_serializer_class(self):

        if self.action in [
            'list',
            'retrieve',
        ]:
            return SuggestedTreatmentDetailSerializer

        return SuggestedTreatmentSerializer

    def perform_update(self, serializer):

        treatment = self.get_object()
        patient = treatment.medical_record.patient

        if patient.is_deleted:
            raise ValidationError(
                'No puede modificar tratamientos de un paciente eliminado.'
            )

        if not patient.is_active:
            raise ValidationError(
                'No puede modificar tratamientos de un paciente desactivado.'
            )

        if not treatment.medical_record.is_active:
            raise ValidationError(
                'No puede modificar tratamientos de una historia clínica desactivada.'
            )

        if treatment.treatment_status in [
            'Finished',
            'Cancelled',
        ]:
            raise ValidationError(
                'No puede editar un tratamiento finalizado o cancelado.'
            )

        serializer.save()

    def perform_destroy(self, instance):

        if instance.is_deleted:
            raise ValidationError(
                'El tratamiento ya fue eliminado.'
            )

        if instance.treatment_status in [
            'Budgeted',
            'In Progress',
            'Finished',
        ]:
            raise ValidationError(
                'No puede eliminar un tratamiento que ya tiene '
                'presupuesto, está en proceso o fue finalizado.'
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
    def mark_budgeted(self, request, pk=None):

        treatment = self.get_object()

        if treatment.treatment_status != 'Suggested':
            return Response(
                {
                    'detail': (
                        'Solo un tratamiento sugerido puede '
                        'marcarse como presupuestado.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        treatment.treatment_status = 'Budgeted'

        treatment.save(
            update_fields=[
                'treatment_status',
                'updated_at',
            ]
        )

        serializer = self.get_serializer(
            treatment
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    @action(
        detail=True,
        methods=['patch'],
        url_path='start-treatment'
    )
    def start_treatment(self, request, pk=None):

        treatment = self.get_object()

        if treatment.treatment_status != 'Budgeted':
            return Response(
                {
                    'detail': (
                        'Solo un tratamiento presupuestado '
                        'puede pasar a en tratamiento.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        treatment.treatment_status = 'In Progress'

        treatment.save(
            update_fields=[
                'treatment_status',
                'updated_at',
            ]
        )

        serializer = self.get_serializer(
            treatment
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    @action(
        detail=True,
        methods=['patch']
    )
    def finish(self, request, pk=None):

        treatment = self.get_object()

        if treatment.treatment_status != 'In Progress':
            return Response(
                {
                    'detail': (
                        'Solo un tratamiento en proceso '
                        'puede finalizarse.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        treatment.treatment_status = 'Finished'
        treatment.is_active = False

        treatment.save(
            update_fields=[
                'treatment_status',
                'is_active',
                'updated_at',
            ]
        )

        serializer = self.get_serializer(
            treatment
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    @action(
        detail=True,
        methods=['patch']
    )
    def cancel(self, request, pk=None):

        treatment = SuggestedTreatment.objects.filter(
            pk=pk
        ).first()

        if not treatment:
            return Response(
                {
                    'detail': 'El tratamiento no existe.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if treatment.is_deleted:
            return Response(
                {
                    'detail': (
                        'No puede cancelar un tratamiento eliminado.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if treatment.treatment_status in [
            'Finished',
            'Cancelled',
        ]:
            return Response(
                {
                    'detail': (
                        'El tratamiento ya está finalizado o cancelado.'
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
                        'Debe ingresar el motivo de cancelación.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        treatment.treatment_status = 'Cancelled'
        treatment.is_active = False
        treatment.cancelled_reason = reason
        treatment.cancelled_at = timezone.now()

        treatment.save(
            update_fields=[
                'treatment_status',
                'is_active',
                'cancelled_reason',
                'cancelled_at',
                'updated_at',
            ]
        )

        serializer = SuggestedTreatmentDetailSerializer(
            treatment
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

        treatment = SuggestedTreatment.objects.filter(
            pk=pk
        ).select_related(
            'medical_record',
            'medical_record__patient',
            'specialist',
            'procedure',
        ).first()

        if not treatment:
            return Response(
                {
                    'detail': 'El tratamiento no existe.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if not treatment.is_deleted:
            return Response(
                {
                    'detail': (
                        'El tratamiento no está eliminado.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        patient = treatment.medical_record.patient

        if patient.is_deleted or not patient.is_active:
            return Response(
                {
                    'detail': (
                        'No puede restaurar el tratamiento porque '
                        'el paciente no está activo.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not treatment.medical_record.is_active:
            return Response(
                {
                    'detail': (
                        'No puede restaurar el tratamiento porque '
                        'la historia clínica está desactivada.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if (
            treatment.specialist.is_deleted
            or not treatment.specialist.is_active
        ):
            return Response(
                {
                    'detail': (
                        'No puede restaurar el tratamiento porque '
                        'el especialista no está disponible.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if (
            treatment.procedure.is_deleted
            or not treatment.procedure.is_active
        ):
            return Response(
                {
                    'detail': (
                        'No puede restaurar el tratamiento porque '
                        'el procedimiento no está disponible.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        treatment.is_deleted = False
        treatment.is_active = True

        treatment.save(
            update_fields=[
                'is_deleted',
                'is_active',
                'updated_at',
            ]
        )

        serializer = SuggestedTreatmentDetailSerializer(
            treatment
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )