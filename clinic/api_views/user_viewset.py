from django.contrib.auth.models import User

from rest_framework import (
    filters,
    status,
    viewsets,
)
from rest_framework.decorators import action
from rest_framework.permissions import (
    IsAuthenticated,
)
from rest_framework.response import Response

from ..permissions import (
    IsGerente,
    get_user_role,
)
from ..serializers.user_serializer import (
    UserSerializer,
)


class UserViewSet(viewsets.ModelViewSet):

    serializer_class = UserSerializer

    permission_classes = [
        IsAuthenticated,
        IsGerente,
    ]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        'username',
        'first_name',
        'last_name',
        'email',
        'groups__name',
        'specialist_profile__first_name',
        'specialist_profile__last_name',
    ]

    ordering_fields = [
        'username',
        'first_name',
        'last_name',
        'date_joined',
        'is_active',
    ]

    ordering = [
        'username',
    ]

    def get_queryset(self):

        queryset = (
            User.objects
            .filter(
                is_superuser=False
            )
            .prefetch_related(
                'groups'
            )
            .select_related(
                'specialist_profile',
                'specialist_profile__specialty',
            )
            .distinct()
        )

        role = self.request.query_params.get(
            'role'
        )

        is_active = (
            self.request.query_params.get(
                'is_active'
            )
        )

        if role:
            queryset = queryset.filter(
                groups__name=role
            )

        if is_active is not None:

            if is_active.lower() == 'true':
                queryset = queryset.filter(
                    is_active=True
                )

            elif is_active.lower() == 'false':
                queryset = queryset.filter(
                    is_active=False
                )

        return queryset

    def create(
        self,
        request,
        *args,
        **kwargs
    ):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        response_serializer = (
            UserSerializer(user)
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )

    def update(
        self,
        request,
        *args,
        **kwargs
    ):

        user = self.get_object()

        validation_response = (
            self._validate_current_user_role(
                request,
                user
            )
        )

        if validation_response:
            return validation_response

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

        user = self.get_object()

        validation_response = (
            self._validate_current_user_role(
                request,
                user
            )
        )

        if validation_response:
            return validation_response

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

        user = self.get_object()

        if user.id == request.user.id:
            return Response(
                {
                    'detail': (
                        'No puede desactivar '
                        'su propio usuario.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        if not user.is_active:
            return Response(
                {
                    'detail': (
                        'El usuario ya está '
                        'desactivado.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        user.is_active = False

        user.save(
            update_fields=[
                'is_active',
            ]
        )

        serializer = UserSerializer(
            user
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=['patch']
    )
    def deactivate(
        self,
        request,
        pk=None
    ):

        user = self.get_object()

        if user.id == request.user.id:
            return Response(
                {
                    'detail': (
                        'No puede desactivar '
                        'su propio usuario.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        if not user.is_active:
            return Response(
                {
                    'detail': (
                        'El usuario ya está '
                        'desactivado.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        user.is_active = False

        user.save(
            update_fields=[
                'is_active',
            ]
        )

        serializer = UserSerializer(
            user
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=['patch']
    )
    def activate(
        self,
        request,
        pk=None
    ):

        user = self.get_object()

        if user.is_active:
            return Response(
                {
                    'detail': (
                        'El usuario ya está activo.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        user.is_active = True

        user.save(
            update_fields=[
                'is_active',
            ]
        )

        serializer = UserSerializer(
            user
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=['patch'],
        url_path='set-password'
    )
    def set_password(
        self,
        request,
        pk=None
    ):

        user = self.get_object()

        password = str(
            request.data.get(
                'password',
                ''
            )
        )

        password_confirmation = str(
            request.data.get(
                'password_confirmation',
                ''
            )
        )

        if len(password) < 8:
            return Response(
                {
                    'password': (
                        'La contraseña debe tener '
                        'al menos 8 caracteres.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        if password != password_confirmation:
            return Response(
                {
                    'password_confirmation': (
                        'Las contraseñas '
                        'no coinciden.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        user.set_password(
            password
        )

        user.save(
            update_fields=[
                'password',
            ]
        )

        return Response(
            {
                'message': (
                    'La contraseña se actualizó '
                    'correctamente.'
                )
            },
            status=status.HTTP_200_OK,
        )

    def _validate_current_user_role(
        self,
        request,
        user
    ):

        if (
            user.id != request.user.id
            or 'role' not in request.data
        ):
            return None

        current_role = get_user_role(
            user
        )

        new_role = request.data.get(
            'role'
        )

        if new_role != current_role:
            return Response(
                {
                    'role': (
                        'No puede cambiar el rol '
                        'de su propio usuario.'
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                )
            )

        return None