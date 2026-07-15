from django.utils import timezone

from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from ..permissions import ClinicModelPermissions
from rest_framework.response import Response

from ..models.medical_record import MedicalRecord
from ..serializers.medical_record_serializer import (
    MedicalRecordSerializer,
    MedicalRecordListSerializer,
    MedicalRecordDetailSerializer,
)


class MedicalRecordViewSet(viewsets.ModelViewSet):

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
        'medical_history',
        'allergies',
        'general_observations',
    ]

    def get_queryset(self):

        queryset = MedicalRecord.objects.select_related(
            'patient'
        ).all()

        show_inactive = (
            self.request.query_params
            .get('show_inactive', '')
            .lower()
            == 'true'
        )

        show_deleted_patients = (
            self.request.query_params
            .get('show_deleted_patients', '')
            .lower()
            == 'true'
        )

        patient_id = self.request.query_params.get(
            'patient'
        )

        if not show_inactive:
            queryset = queryset.filter(
                is_active=True
            )

        # Los pacientes desactivados siguen mostrando
        # su historia clínica.
        #
        # Los pacientes eliminados se ocultan por defecto.
        if not show_deleted_patients:
            queryset = queryset.filter(
                patient__is_deleted=False
            )

        if patient_id:
            queryset = queryset.filter(
                patient_id=patient_id
            )

        return queryset.order_by(
            'patient__last_name',
            'patient__first_name'
        )

    def get_serializer_class(self):

        if self.action == 'retrieve':
            return MedicalRecordDetailSerializer

        if self.action == 'list':
            return MedicalRecordListSerializer

        return MedicalRecordSerializer

    def perform_create(self, serializer):

        patient = serializer.validated_data.get(
            'patient'
        )

        if patient.is_deleted:
            raise ValidationError(
                'No puede crear una historia clínica '
                'para un paciente eliminado.'
            )

        if not patient.is_active:
            raise ValidationError(
                'No puede crear una historia clínica '
                'para un paciente desactivado.'
            )

        serializer.save()

    def perform_update(self, serializer):

        medical_record = self.get_object()

        if medical_record.patient.is_deleted:
            raise ValidationError(
                'No puede modificar la historia clínica '
                'de un paciente eliminado.'
            )

        if not medical_record.patient.is_active:
            raise ValidationError(
                'No puede modificar la historia clínica '
                'de un paciente desactivado.'
            )

        if not medical_record.is_active:
            raise ValidationError(
                'No puede modificar una historia clínica '
                'desactivada. Primero debe reactivarla.'
            )

        serializer.save()

    def destroy(self, request, *args, **kwargs):

        return Response(
            {
                'detail': (
                    'Las historias clínicas no pueden eliminarse. '
                    'Puede desactivarlas mediante la opción archivar.'
                )
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    @action(
        detail=True,
        methods=['patch']
    )
    def deactivate(self, request, pk=None):

        medical_record = MedicalRecord.objects.filter(
            pk=pk
        ).select_related(
            'patient'
        ).first()

        if not medical_record:
            return Response(
                {
                    'detail': 'La historia clínica no existe.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if not medical_record.is_active:
            return Response(
                {
                    'detail': (
                        'La historia clínica ya está desactivada.'
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
                        'Debe ingresar el motivo de desactivación.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        medical_record.is_active = False
        medical_record.inactive_reason = reason
        medical_record.deactivated_at = timezone.now()

        medical_record.save(
            update_fields=[
                'is_active',
                'inactive_reason',
                'deactivated_at',
                'updated_at',
            ]
        )

        serializer = MedicalRecordDetailSerializer(
            medical_record
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

        medical_record = MedicalRecord.objects.filter(
            pk=pk
        ).select_related(
            'patient'
        ).first()

        if not medical_record:
            return Response(
                {
                    'detail': 'La historia clínica no existe.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if medical_record.is_active:
            return Response(
                {
                    'detail': (
                        'La historia clínica ya está activa.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if medical_record.patient.is_deleted:
            return Response(
                {
                    'detail': (
                        'No puede reactivar la historia clínica '
                        'porque el paciente está eliminado.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not medical_record.patient.is_active:
            return Response(
                {
                    'detail': (
                        'No puede reactivar la historia clínica '
                        'porque el paciente está desactivado. '
                        'Primero debe reactivar al paciente.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        medical_record.is_active = True
        medical_record.inactive_reason = None
        medical_record.deactivated_at = None

        medical_record.save(
            update_fields=[
                'is_active',
                'inactive_reason',
                'deactivated_at',
                'updated_at',
            ]
        )

        serializer = MedicalRecordDetailSerializer(
            medical_record
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )