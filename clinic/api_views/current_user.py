from django.core.exceptions import ObjectDoesNotExist

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from clinic.permissions import get_user_role


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = get_user_role(user)

        if role is None:
            return Response(
                {
                    "detail": (
                        "El usuario no tiene un grupo asignado. "
                        "Debe pertenecer a Gerente, Recepcionista "
                        "o Especialista."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        specialist_id = None
        specialist_name = None

        if role == "Especialista":
            try:
                specialist = user.specialist_profile
            except ObjectDoesNotExist:
                return Response(
                    {
                        "detail": (
                            "El usuario pertenece al grupo Especialista, "
                            "pero no está vinculado con un especialista."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not specialist.is_active:
                return Response(
                    {
                        "detail": (
                            "El especialista relacionado con este "
                            "usuario está inactivo."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            specialist_id = specialist.id

            specialist_name = (
                f"{specialist.first_name} "
                f"{specialist.last_name}"
            )

        full_name = (
            f"{user.first_name} {user.last_name}"
        ).strip()

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "full_name": full_name or user.username,
                "email": user.email,
                "role": role,
                "specialist_id": specialist_id,
                "specialist_name": specialist_name,
            },
            status=status.HTTP_200_OK,
        )