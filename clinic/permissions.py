from rest_framework.permissions import (
    BasePermission,
    DjangoModelPermissions,
)

def get_user_role(user):
    if not user or not user.is_authenticated:
        return None

    if user.is_superuser:
        return "Gerente"

    if user.groups.filter(name="Gerente").exists():
        return "Gerente"

    if user.groups.filter(name="Recepcionista").exists():
        return "Recepcionista"

    if user.groups.filter(name="Especialista").exists():
        return "Especialista"

    return None


class IsGerente(BasePermission):
    message = "Solo el gerente puede realizar esta operación."

    def has_permission(self, request, view):
        return get_user_role(request.user) == "Gerente"


class IsRecepcionista(BasePermission):
    message = "Solo recepción puede realizar esta operación."

    def has_permission(self, request, view):
        return get_user_role(request.user) == "Recepcionista"


class IsEspecialista(BasePermission):
    message = "Solo el especialista puede realizar esta operación."

    def has_permission(self, request, view):
        return get_user_role(request.user) == "Especialista"


class IsGerenteOrRecepcionista(BasePermission):
    message = "Solo gerencia o recepción pueden realizar esta operación."

    def has_permission(self, request, view):
        return get_user_role(request.user) in [
            "Gerente",
            "Recepcionista",
        ]


class IsGerenteOrEspecialista(BasePermission):
    message = "Solo gerencia o especialistas pueden realizar esta operación."

    def has_permission(self, request, view):
        return get_user_role(request.user) in [
            "Gerente",
            "Especialista",
        ]
    
class ClinicModelPermissions(DjangoModelPermissions):
    """
    Conecta los permisos asignados en Django Admin
    con las operaciones de los ViewSets.
    """

    perms_map = {
        'GET': [
            '%(app_label)s.view_%(model_name)s'
        ],

        'HEAD': [
            '%(app_label)s.view_%(model_name)s'
        ],

        'OPTIONS': [],

        'POST': [
            '%(app_label)s.add_%(model_name)s'
        ],

        'PUT': [
            '%(app_label)s.change_%(model_name)s'
        ],

        'PATCH': [
            '%(app_label)s.change_%(model_name)s'
        ],

        'DELETE': [
            '%(app_label)s.delete_%(model_name)s'
        ],
    }