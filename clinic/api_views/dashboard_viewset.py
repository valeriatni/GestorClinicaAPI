from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from clinic.models import (
    Appointment,
    Budget,
    MedicalRecord,
    Patient,
    Payment,
    Specialist,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_summary(_request):
    data = {
        "patients": Patient.objects.filter(
            is_active=True
        ).count(),

        "specialists": Specialist.objects.filter(
            is_active=True
        ).count(),

        "appointments": Appointment.objects.exclude(
            appointment_status="Cancelled"
        ).count(),

        "medical_records": MedicalRecord.objects.filter(
            is_active=True
        ).count(),

        "budgets": Budget.objects.exclude(
            budget_status="Cancelled"
        ).count(),

        "payments": Payment.objects.count(),
    }

    return Response(data)