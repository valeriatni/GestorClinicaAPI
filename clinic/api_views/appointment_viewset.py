from datetime import datetime

from django.core.exceptions import (
    ObjectDoesNotExist,
)
from django.utils import timezone
from django.utils.dateparse import parse_date

from rest_framework import (
    filters,
    status,
    viewsets,
)
from rest_framework.decorators import action
from rest_framework.exceptions import (
    ValidationError,
)
from rest_framework.response import Response

from ..models.appointment import Appointment
from ..models.specialist import Specialist
from ..permissions import (
    ClinicModelPermissions,
    get_user_role,
)
from ..serializers.appointment_serializer import (
    ALLOWED_APPOINTMENT_TIMES,
    AppointmentDetailSerializer,
    AppointmentSerializer,
)


class AppointmentViewSet(
    viewsets.ModelViewSet
):

    permission_classes = [
        ClinicModelPermissions
    ]

    filter_backends = [
        filters.SearchFilter
    ]

    search_fields = [
        'patient__first_name',
        'patient__last_name',
        'patient__dni',
        'specialist__first_name',
        'specialist__last_name',
        'specialist__license_number',
        'reason',
        'appointment_status',
    ]

    def get_queryset(self):

        queryset = (
            Appointment.objects
            .select_related(
                'patient',
                'specialist',
                'specialist__specialty',
            )
            .all()
        )

        role = get_user_role(
            self.request.user
        )

        if role == 'Especialista':
            try:
                specialist = (
                    self.request
                    .user
                    .specialist_profile
                )
            except ObjectDoesNotExist:
                return queryset.none()

            queryset = queryset.filter(
                specialist=specialist
            )

        elif role not in [
            'Gerente',
            'Recepcionista',
        ]:
            return queryset.none()

        show_deleted = (
            self.request
            .query_params
            .get(
                'show_deleted',
                ''
            )
            .lower()
            == 'true'
        )

        appointment_status = (
            self.request
            .query_params
            .get('status')
        )

        appointment_date = (
            self.request
            .query_params
            .get('date')
        )

        patient_id = (
            self.request
            .query_params
            .get('patient')
        )

        specialist_id = (
            self.request
            .query_params
            .get('specialist')
        )

        if (
            role == 'Especialista'
            or not show_deleted
        ):
            queryset = queryset.filter(
                is_deleted=False
            )

        if appointment_status:
            queryset = queryset.filter(
                appointment_status=(
                    appointment_status
                )
            )

        if appointment_date:
            queryset = queryset.filter(
                appointment_date=(
                    appointment_date
                )
            )

        if patient_id:
            queryset = queryset.filter(
                patient_id=patient_id
            )

        if specialist_id:
            queryset = queryset.filter(
                specialist_id=specialist_id
            )

        return queryset.order_by(
            'appointment_date',
            'appointment_time',
        )

    def get_serializer_class(self):

        if self.action == 'retrieve':
            return (
                AppointmentDetailSerializer
            )

        return AppointmentSerializer

    def create(
        self,
        request,
        *args,
        **kwargs
    ):

        if get_user_role(
            request.user
        ) != 'Recepcionista':
            return Response(
                {
                    'detail': (
                        'Solo recepción puede '
                        'registrar citas.'
                    )
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                )
            )

        return super().create(
            request,
            *args,
            **kwargs
        )

    def update(
        self,
        request,
        *args,
        **kwargs
    ):

        if get_user_role(
            request.user
        ) != 'Recepcionista':
            return Response(
                {
                    'detail': (
                        'Solo recepción puede '
                        'editar citas.'
                    )
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                )
            )

        appointment = self.get_object()

        if appointment.appointment_status not in [
            'Pending',
            'Confirmed',
        ]:
            return Response(
                {
                    'detail': (
                        'Solo una cita pendiente '
                        'o confirmada puede editarse.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        return super().update(
            request,
            *args,
            **kwargs
        )

    def partial_update(
        self,
        request,
        *args,
        **kwargs
    ):

        if get_user_role(
            request.user
        ) != 'Recepcionista':
            return Response(
                {
                    'detail': (
                        'Solo recepción puede '
                        'editar citas.'
                    )
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                )
            )

        appointment = self.get_object()

        if appointment.appointment_status not in [
            'Pending',
            'Confirmed',
        ]:
            return Response(
                {
                    'detail': (
                        'Solo una cita pendiente '
                        'o confirmada puede editarse.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        return super().partial_update(
            request,
            *args,
            **kwargs
        )

    def destroy(
        self,
        request,
        *args,
        **kwargs
    ):

        if get_user_role(
            request.user
        ) != 'Recepcionista':
            return Response(
                {
                    'detail': (
                        'Solo recepción puede '
                        'eliminar lógicamente citas.'
                    )
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                )
            )

        return super().destroy(
            request,
            *args,
            **kwargs
        )

    @action(
        detail=False,
        methods=['get'],
        url_path='available-times'
    )
    def available_times(
        self,
        request
    ):

        role = get_user_role(
            request.user
        )

        if role not in [
            'Recepcionista',
            'Gerente',
            'Especialista',
        ]:
            return Response(
                {
                    'detail': (
                        'No tiene permiso para '
                        'consultar horarios.'
                    )
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                )
            )

        specialist_id = (
            request.query_params.get(
                'specialist'
            )
        )

        date_value = (
            request.query_params.get(
                'date'
            )
        )

        exclude_appointment_id = (
            request.query_params.get(
                'exclude_appointment'
            )
        )

        if role == 'Especialista':
            try:
                user_specialist = (
                    request.user
                    .specialist_profile
                )
            except ObjectDoesNotExist:
                return Response(
                    {
                        'detail': (
                            'El usuario especialista '
                            'no está vinculado con '
                            'un especialista.'
                        )
                    },
                    status=(
                        status
                        .HTTP_400_BAD_REQUEST
                    )
                )

            specialist_id = (
                user_specialist.id
            )

        if not specialist_id:
            return Response(
                {
                    'specialist': (
                        'Debe seleccionar '
                        'un especialista.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        if not date_value:
            return Response(
                {
                    'date': (
                        'Debe seleccionar una fecha.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        try:
            specialist_id = int(
                specialist_id
            )
        except (
            TypeError,
            ValueError,
        ):
            return Response(
                {
                    'specialist': (
                        'El especialista seleccionado '
                        'no es válido.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        specialist = (
            Specialist.objects.filter(
                pk=specialist_id,
                is_active=True,
                is_deleted=False,
            )
            .first()
        )

        if not specialist:
            return Response(
                {
                    'specialist': (
                        'El especialista no existe '
                        'o no está disponible.'
                    )
                },
                status=(
                    status.HTTP_404_NOT_FOUND
                )
            )

        selected_date = parse_date(
            date_value
        )

        if not selected_date:
            return Response(
                {
                    'date': (
                        'La fecha debe tener '
                        'el formato AAAA-MM-DD.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        today = timezone.localdate()

        if selected_date < today:
            return Response(
                {
                    'date': (
                        'No puede consultar horarios '
                        'de una fecha pasada.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        occupied_queryset = (
            Appointment.objects.filter(
                specialist_id=specialist_id,
                appointment_date=selected_date,
                is_active=True,
                is_deleted=False,
            )
        )

        if exclude_appointment_id:
            try:
                exclude_appointment_id = int(
                    exclude_appointment_id
                )

                occupied_queryset = (
                    occupied_queryset.exclude(
                        pk=exclude_appointment_id
                    )
                )
            except (
                TypeError,
                ValueError,
            ):
                return Response(
                    {
                        'exclude_appointment': (
                            'La cita excluida '
                            'no es válida.'
                        )
                    },
                    status=(
                        status
                        .HTTP_400_BAD_REQUEST
                    )
                )

        occupied_times = {
            appointment_time
            .replace(
                second=0,
                microsecond=0,
            )
            .strftime('%H:%M')

            for appointment_time in (
                occupied_queryset
                .values_list(
                    'appointment_time',
                    flat=True
                )
            )
        }

        available_times = []

        now = timezone.localtime()

        for appointment_time in sorted(
            ALLOWED_APPOINTMENT_TIMES
        ):
            formatted_time = (
                appointment_time.strftime(
                    '%H:%M'
                )
            )

            if formatted_time in (
                occupied_times
            ):
                continue

            if selected_date == today:
                appointment_datetime = (
                    timezone.make_aware(
                        datetime.combine(
                            selected_date,
                            appointment_time,
                        ),
                        timezone
                        .get_current_timezone(),
                    )
                )

                if appointment_datetime <= now:
                    continue

            available_times.append(
                formatted_time
            )

        return Response(
            {
                'specialist': specialist.id,
                'specialist_name': (
                    f'{specialist.first_name} '
                    f'{specialist.last_name}'
                ),
                'date': selected_date,
                'duration_minutes': 30,
                'available_times': (
                    available_times
                ),
                'occupied_times': sorted(
                    occupied_times
                ),
            },
            status=status.HTTP_200_OK
        )

    @action(
        detail=True,
        methods=['patch']
    )
    def confirm(
        self,
        request,
        pk=None
    ):

        if get_user_role(
            request.user
        ) != 'Recepcionista':
            return Response(
                {
                    'detail': (
                        'Solo recepción puede '
                        'confirmar citas.'
                    )
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                )
            )

        appointment = self.get_object()

        if appointment.appointment_status != (
            'Pending'
        ):
            return Response(
                {
                    'detail': (
                        'Solo una cita pendiente '
                        'puede confirmarse.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        appointment.appointment_status = (
            'Confirmed'
        )
        appointment.is_active = True

        appointment.save(
            update_fields=[
                'appointment_status',
                'is_active',
                'updated_at',
            ]
        )

        return self._detail_response(
            appointment
        )

    @action(
        detail=True,
        methods=['patch']
    )
    def arrive(
        self,
        request,
        pk=None
    ):

        if get_user_role(
            request.user
        ) != 'Recepcionista':
            return Response(
                {
                    'detail': (
                        'Solo recepción puede '
                        'marcar la llegada.'
                    )
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                )
            )

        appointment = self.get_object()

        if appointment.appointment_status != (
            'Confirmed'
        ):
            return Response(
                {
                    'detail': (
                        'Solo una cita confirmada '
                        'puede marcarse en espera.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        if (
            appointment.appointment_date
            > timezone.localdate()
        ):
            return Response(
                {
                    'detail': (
                        'No puede marcar la llegada '
                        'para una cita futura.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        appointment.appointment_status = (
            'Waiting'
        )
        appointment.is_active = True

        appointment.save(
            update_fields=[
                'appointment_status',
                'is_active',
                'updated_at',
            ]
        )

        return self._detail_response(
            appointment
        )

    @action(
        detail=True,
        methods=['patch'],
        url_path='start-consultation'
    )
    def start_consultation(
        self,
        request,
        pk=None
    ):

        if get_user_role(
            request.user
        ) != 'Especialista':
            return Response(
                {
                    'detail': (
                        'Solo el especialista puede '
                        'iniciar la consulta.'
                    )
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                )
            )

        appointment = self.get_object()

        try:
            specialist = (
                request.user
                .specialist_profile
            )
        except ObjectDoesNotExist:
            return Response(
                {
                    'detail': (
                        'El usuario no está vinculado '
                        'con un especialista.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        if appointment.specialist_id != (
            specialist.id
        ):
            return Response(
                {
                    'detail': (
                        'La cita no pertenece '
                        'a este especialista.'
                    )
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                )
            )

        if appointment.appointment_status not in [
            'Pending',
            'Confirmed',
            'Waiting',
        ]:
            return Response(
                {
                    'detail': (
                        'Solo una cita pendiente, confirmada '
                        'o en espera puede iniciar consulta.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        appointment_datetime = (
            timezone.make_aware(
                datetime.combine(
                    appointment.appointment_date,
                    appointment.appointment_time,
                ),
                timezone.get_current_timezone(),
            )
        )

        if appointment_datetime > (
            timezone.localtime()
        ):
            return Response(
                {
                    'detail': (
                        'Todavía no puede iniciar '
                        'una cita futura.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        appointment.appointment_status = (
            'In Consultation'
        )
        appointment.is_active = True

        appointment.save(
            update_fields=[
                'appointment_status',
                'is_active',
                'updated_at',
            ]
        )

        return self._detail_response(
            appointment
        )

    @action(
        detail=True,
        methods=['patch'],
        url_path='finish-consultation'
    )
    def finish_consultation(
        self,
        request,
        pk=None
    ):

        if get_user_role(
            request.user
        ) != 'Especialista':
            return Response(
                {
                    'detail': (
                        'Solo el especialista puede '
                        'finalizar la consulta.'
                    )
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                )
            )

        appointment = self.get_object()

        if appointment.appointment_status != (
            'In Consultation'
        ):
            return Response(
                {
                    'detail': (
                        'Solo una cita en consulta '
                        'puede finalizarse.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        appointment.appointment_status = (
            'Attended'
        )
        appointment.is_active = False

        appointment.save(
            update_fields=[
                'appointment_status',
                'is_active',
                'updated_at',
            ]
        )

        return self._detail_response(
            appointment
        )

    @action(
        detail=True,
        methods=['patch'],
        url_path='no-show'
    )
    def no_show(
        self,
        request,
        pk=None
    ):

        if get_user_role(
            request.user
        ) != 'Recepcionista':
            return Response(
                {
                    'detail': (
                        'Solo recepción puede '
                        'marcar una inasistencia.'
                    )
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                )
            )

        appointment = self.get_object()

        if appointment.appointment_status not in [
            'Pending',
            'Confirmed',
        ]:
            return Response(
                {
                    'detail': (
                        'Solo una cita pendiente '
                        'o confirmada puede marcarse '
                        'como no asistida.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        appointment_datetime = (
            timezone.make_aware(
                datetime.combine(
                    appointment.appointment_date,
                    appointment.appointment_time,
                ),
                timezone.get_current_timezone(),
            )
        )

        if appointment_datetime > (
            timezone.localtime()
        ):
            return Response(
                {
                    'detail': (
                        'Todavía no puede marcarse '
                        'como no asistida porque '
                        'la hora no ha llegado.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        appointment.appointment_status = (
            'No Show'
        )
        appointment.is_active = False
        appointment.cancelled_reason = None
        appointment.cancelled_at = None

        appointment.save(
            update_fields=[
                'appointment_status',
                'is_active',
                'cancelled_reason',
                'cancelled_at',
                'updated_at',
            ]
        )

        return self._detail_response(
            appointment
        )

    @action(
        detail=True,
        methods=['patch']
    )
    def cancel(
        self,
        request,
        pk=None
    ):

        if get_user_role(
            request.user
        ) != 'Recepcionista':
            return Response(
                {
                    'detail': (
                        'Solo recepción puede '
                        'cancelar citas.'
                    )
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                )
            )

        appointment = self.get_object()

        if appointment.appointment_status not in [
            'Pending',
            'Confirmed',
        ]:
            return Response(
                {
                    'detail': (
                        'Solo una cita pendiente '
                        'o confirmada puede cancelarse.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        reason = str(
            request.data.get(
                'reason',
                ''
            )
        ).strip()

        if len(reason) < 5:
            return Response(
                {
                    'reason': (
                        'Debe ingresar un motivo '
                        'de al menos 5 caracteres.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        appointment.appointment_status = (
            'Cancelled'
        )
        appointment.is_active = False
        appointment.cancelled_reason = reason
        appointment.cancelled_at = (
            timezone.now()
        )

        appointment.save(
            update_fields=[
                'appointment_status',
                'is_active',
                'cancelled_reason',
                'cancelled_at',
                'updated_at',
            ]
        )

        return self._detail_response(
            appointment
        )

    def perform_destroy(
        self,
        instance
    ):

        if instance.appointment_status in [
            'Attended',
            'In Consultation',
        ]:
            raise ValidationError(
                'No puede eliminar una cita que '
                'forma parte de una atención clínica.'
            )

        if instance.is_deleted:
            raise ValidationError(
                'La cita ya fue eliminada.'
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
    def restore(
        self,
        request,
        pk=None
    ):

        if get_user_role(
            request.user
        ) != 'Recepcionista':
            return Response(
                {
                    'detail': (
                        'Solo recepción puede '
                        'restaurar citas.'
                    )
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                )
            )

        appointment = (
            Appointment.objects
            .select_related(
                'patient',
                'specialist',
                'specialist__specialty',
            )
            .filter(pk=pk)
            .first()
        )

        if not appointment:
            return Response(
                {
                    'detail': (
                        'La cita no existe.'
                    )
                },
                status=(
                    status.HTTP_404_NOT_FOUND
                )
            )

        if not appointment.is_deleted:
            return Response(
                {
                    'detail': (
                        'La cita no está eliminada.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        if (
            appointment.patient.is_deleted
            or not appointment.patient.is_active
        ):
            return Response(
                {
                    'detail': (
                        'No puede restaurar la cita '
                        'porque el paciente no está '
                        'disponible.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        if (
            appointment.specialist.is_deleted
            or not appointment.specialist.is_active
        ):
            return Response(
                {
                    'detail': (
                        'No puede restaurar la cita '
                        'porque el especialista no '
                        'está disponible.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        active_statuses = [
            'Pending',
            'Confirmed',
            'Waiting',
            'In Consultation',
        ]

        should_be_active = (
            appointment.appointment_status
            in active_statuses
        )

        if should_be_active:
            conflict = (
                Appointment.objects.filter(
                    specialist=(
                        appointment.specialist
                    ),
                    appointment_date=(
                        appointment.appointment_date
                    ),
                    appointment_time=(
                        appointment.appointment_time
                    ),
                    is_active=True,
                    is_deleted=False,
                )
                .exclude(pk=appointment.pk)
                .exists()
            )

            if conflict:
                return Response(
                    {
                        'detail': (
                            'No puede restaurar la cita '
                            'porque el horario ya está '
                            'ocupado.'
                        )
                    },
                    status=(
                        status
                        .HTTP_400_BAD_REQUEST
                    )
                )

        appointment.is_deleted = False
        appointment.is_active = (
            should_be_active
        )

        appointment.save(
            update_fields=[
                'is_deleted',
                'is_active',
                'updated_at',
            ]
        )

        return self._detail_response(
            appointment
        )

    def _detail_response(
        self,
        appointment
    ):

        serializer = (
            AppointmentDetailSerializer(
                appointment
            )
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )