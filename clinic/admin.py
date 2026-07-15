from django.contrib import admin

# Register your models here.
from django.contrib import admin

from .models.specialty import Specialty
from .models.specialist import Specialist
from .models.patient import Patient
from .models.medical_record import MedicalRecord
from .models.appointment import Appointment
from .models.suggested_treatment import SuggestedTreatment
from .models.procedure import Procedure
from .models.budget import Budget
from .models.payment import Payment

admin.site.register(Specialty)
admin.site.register(Specialist)
admin.site.register(Patient)
admin.site.register(MedicalRecord)
admin.site.register(Appointment)
admin.site.register(SuggestedTreatment)
admin.site.register(Procedure)
admin.site.register(Budget)
admin.site.register(Payment)