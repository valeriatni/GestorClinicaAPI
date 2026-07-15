from rest_framework import filters, status, viewsets
from ..permissions import ClinicModelPermissions
from rest_framework.response import Response

from ..models.payment import Payment
from ..serializers.payment_serializer import (
    PaymentSerializer,
    PaymentDetailSerializer,
)


class PaymentViewSet(viewsets.ModelViewSet):

    permission_classes = [
        ClinicModelPermissions
    ]

    filter_backends = [
        filters.SearchFilter
    ]

    search_fields = [
        'budget__patient__dni',
        'budget__patient__first_name',
        'budget__patient__last_name',
        'appointment__patient__dni',
        'appointment__patient__first_name',
        'appointment__patient__last_name',
        'reference_number',
        'payment_method',
    ]

    http_method_names = [
        'get',
        'post',
        'head',
        'options',
    ]

    def get_queryset(self):

        queryset = Payment.objects.select_related(
            'budget',
            'budget__patient',
            'budget__suggested_treatment',
            'budget__suggested_treatment__procedure',
            'appointment',
            'appointment__patient',
            'appointment__specialist',
            'appointment__specialist__specialty',
        ).all()

        patient_id = self.request.query_params.get(
            'patient'
        )

        budget_id = self.request.query_params.get(
            'budget'
        )

        appointment_id = self.request.query_params.get(
            'appointment'
        )

        payment_method = self.request.query_params.get(
            'method'
        )

        if patient_id:
            queryset = queryset.filter(
                models.Q(
                    budget__patient_id=patient_id
                )
                |
                models.Q(
                    appointment__patient_id=patient_id
                )
            )

        if budget_id:
            queryset = queryset.filter(
                budget_id=budget_id
            )

        if appointment_id:
            queryset = queryset.filter(
                appointment_id=appointment_id
            )

        if payment_method:
            queryset = queryset.filter(
                payment_method=payment_method
            )

        return queryset.order_by(
            '-payment_date'
        )

    def get_serializer_class(self):

        if self.action in [
            'list',
            'retrieve',
        ]:
            return PaymentDetailSerializer

        return PaymentSerializer

    def update(self, request, *args, **kwargs):

        return Response(
            {
                'detail': (
                    'Los pagos no pueden modificarse después '
                    'de ser registrados.'
                )
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def partial_update(
        self,
        request,
        *args,
        **kwargs
    ):

        return Response(
            {
                'detail': (
                    'Los pagos no pueden modificarse después '
                    'de ser registrados.'
                )
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def destroy(self, request, *args, **kwargs):

        return Response(
            {
                'detail': (
                    'Los pagos no pueden eliminarse porque '
                    'forman parte del historial financiero.'
                )
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )