from django.utils import timezone

from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from ..permissions import ClinicModelPermissions
from rest_framework.response import Response

from ..models.patient import Patient
from ..models.appointment import Appointment
from ..serializers.patient_serializer import (
    PatientSerializer,
    PatientDetailSerializer,
)


class PatientViewSet(viewsets.ModelViewSet):

    permission_classes = [
        ClinicModelPermissions
    ]

    filter_backends = [
        filters.SearchFilter
    ]

    search_fields = [
        'dni',
        'first_name',
        'last_name',
        'phone',
        'email',
    ]

    def get_queryset(self):

        queryset = Patient.objects.all()

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

        if not show_deleted:
            queryset = queryset.filter(
                is_deleted=False
            )

        if not show_inactive:
            queryset = queryset.filter(
                is_active=True
            )

        return queryset.order_by(
            'last_name',
            'first_name'
        )

    def get_serializer_class(self):

        if self.action == 'retrieve':
            return PatientDetailSerializer

        return PatientSerializer

    def has_blocking_appointments(self, patient):
        """
        Esta lista es provisional.

        La corregiremos utilizando exactamente los estados
        reales cuando revisemos el modelo Appointment.
        """

        return Appointment.objects.filter(
            patient=patient,
            appointment_status__in=[
                'Pending',
                'Confirmed',
                'Waiting',
                'In Consultation',
            ]
        ).exists()

    def perform_destroy(self, instance):
        """
        Eliminación lógica del paciente.
        """

        if instance.is_deleted:
            raise ValidationError(
                'El paciente ya fue eliminado.'
            )

        if self.has_blocking_appointments(instance):
            raise ValidationError(
                'No puede eliminar al paciente porque tiene '
                'citas pendientes o en proceso.'
            )

        instance.is_active = False
        instance.is_deleted = True
        instance.inactive_reason = (
            'Paciente eliminado lógicamente del sistema.'
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
        Desactiva temporalmente al paciente.
        """

        patient = Patient.objects.filter(
            pk=pk
        ).first()

        if not patient:
            return Response(
                {
                    'detail': 'El paciente no existe.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if patient.is_deleted:
            return Response(
                {
                    'detail': (
                        'No puede desactivar un paciente eliminado. '
                        'Primero debe restaurarlo.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not patient.is_active:
            return Response(
                {
                    'detail': (
                        'El paciente ya se encuentra desactivado.'
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

        if self.has_blocking_appointments(patient):
            return Response(
                {
                    'detail': (
                        'No puede desactivar al paciente porque '
                        'tiene citas pendientes o en proceso.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        patient.is_active = False
        patient.is_deleted = False
        patient.inactive_reason = reason
        patient.deactivated_at = timezone.now()

        patient.save(
            update_fields=[
                'is_active',
                'is_deleted',
                'inactive_reason',
                'deactivated_at',
                'updated_at',
            ]
        )

        serializer = self.get_serializer(
            patient
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
        Reactiva a un paciente desactivado.
        """

        patient = Patient.objects.filter(
            pk=pk
        ).first()

        if not patient:
            return Response(
                {
                    'detail': 'El paciente no existe.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if patient.is_deleted:
            return Response(
                {
                    'detail': (
                        'El paciente fue eliminado. '
                        'Debe utilizar la opción restaurar.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if patient.is_active:
            return Response(
                {
                    'detail': (
                        'El paciente ya se encuentra activo.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        patient.is_active = True
        patient.inactive_reason = None
        patient.deactivated_at = None

        patient.save(
            update_fields=[
                'is_active',
                'inactive_reason',
                'deactivated_at',
                'updated_at',
            ]
        )

        serializer = self.get_serializer(
            patient
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
        Restaura a un paciente eliminado lógicamente.
        """

        patient = Patient.objects.filter(
            pk=pk
        ).first()

        if not patient:
            return Response(
                {
                    'detail': 'El paciente no existe.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if not patient.is_deleted:
            return Response(
                {
                    'detail': (
                        'El paciente no está eliminado.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        patient.is_deleted = False
        patient.is_active = True
        patient.inactive_reason = None
        patient.deactivated_at = None

        patient.save(
            update_fields=[
                'is_deleted',
                'is_active',
                'inactive_reason',
                'deactivated_at',
                'updated_at',
            ]
        )

        serializer = self.get_serializer(
            patient
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    @action(
        detail=False,
        methods=['get']
    )
    def inactive(self, request):
        """
        Lista solamente pacientes desactivados,
        sin incluir eliminados.
        """

        patients = Patient.objects.filter(
            is_active=False,
            is_deleted=False
        ).order_by(
            'last_name',
            'first_name'
        )

        patients = self.filter_queryset(
            patients
        )

        serializer = self.get_serializer(
            patients,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    @action(
        detail=False,
        methods=['get']
    )
    def deleted(self, request):
        """
        Lista pacientes eliminados lógicamente.
        Se utiliza para poder restaurarlos.
        """

        patients = Patient.objects.filter(
            is_deleted=True
        ).order_by(
            'last_name',
            'first_name'
        )

        patients = self.filter_queryset(
            patients
        )

        serializer = self.get_serializer(
            patients,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )