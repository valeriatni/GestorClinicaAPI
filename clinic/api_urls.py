from django.core.exceptions import (
    ObjectDoesNotExist,
)
from django.urls import include, path

from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import (
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.routers import (
    DefaultRouter,
)

from .api_views.appointment_viewset import (
    AppointmentViewSet,
)
from .api_views.budget_viewset import (
    BudgetViewSet,
)
from .api_views.dashboard_viewset import (
    dashboard_summary,
)
from .api_views.medical_record_viewset import (
    MedicalRecordViewSet,
)
from .api_views.patient_viewset import (
    PatientViewSet,
)
from .api_views.payment_viewset import (
    PaymentViewSet,
)
from .api_views.procedure_viewset import (
    ProcedureViewSet,
)
from .api_views.specialist_viewset import (
    SpecialistViewSet,
)
from .api_views.specialty_viewset import (
    SpecialtyViewSet,
)
from .api_views.suggested_treatment_viewset import (
    SuggestedTreatmentViewSet,
)
from .api_views.user_viewset import (
    UserViewSet,
)
from .permissions import get_user_role


router = DefaultRouter()

router.register(
    r'specialties',
    SpecialtyViewSet,
    basename='specialty',
)

router.register(
    r'specialists',
    SpecialistViewSet,
    basename='specialist',
)

router.register(
    r'patients',
    PatientViewSet,
    basename='patient',
)

router.register(
    r'medical-records',
    MedicalRecordViewSet,
    basename='medical-record',
)

router.register(
    r'appointments',
    AppointmentViewSet,
    basename='appointment',
)

router.register(
    r'suggested-treatments',
    SuggestedTreatmentViewSet,
    basename='suggested-treatment',
)

router.register(
    r'procedures',
    ProcedureViewSet,
    basename='procedure',
)

router.register(
    r'budgets',
    BudgetViewSet,
    basename='budget',
)

router.register(
    r'payments',
    PaymentViewSet,
    basename='payment',
)

router.register(
    r'users',
    UserViewSet,
    basename='user',
)


@api_view([
    'GET',
])
@permission_classes([
    IsAuthenticated,
])
def current_user(request):

    user = request.user

    role = get_user_role(
        user
    )

    specialist_id = None
    specialist_name = None

    try:
        specialist = (
            user.specialist_profile
        )

        specialist_id = specialist.id

        specialist_name = (
            f'{specialist.first_name} '
            f'{specialist.last_name}'
        )

    except ObjectDoesNotExist:
        pass

    full_name = (
        user.get_full_name().strip()
        or user.username
    )

    return Response({
        'id': user.id,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'full_name': full_name,
        'email': user.email,
        'role': role,
        'specialist_id': specialist_id,
        'specialist_name': specialist_name,
        'is_active': user.is_active,
    })


urlpatterns = [
    path(
        'me/',
        current_user,
        name='current-user',
    ),

    path(
        'dashboard/',
        dashboard_summary,
        name='dashboard-summary',
    ),

    path(
        '',
        include(router.urls),
    ),
]