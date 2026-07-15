from django.contrib.auth.models import Group, User
from django.db import transaction

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action 
from clinic.models.user_state import UserState
from django.utils import timezone

from rest_framework import serializers

from ..models.specialist import Specialist


ROLE_NAMES = [
    'Gerente',
    'Recepcionista',
    'Especialista',
]


class UserSerializer(serializers.ModelSerializer):

    is_deleted = serializers.SerializerMethodField()
    deletion_reason = serializers.SerializerMethodField()
    deleted_at = serializers.SerializerMethodField()

    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=False,
        min_length=8,
        trim_whitespace=False,
    )

    role = serializers.CharField(
        required=False,
        allow_blank=False,
    )

    specialist = serializers.PrimaryKeyRelatedField(
        queryset=Specialist.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )

    full_name = serializers.SerializerMethodField()

    specialist_name = serializers.SerializerMethodField()

    class Meta:
        model = User

        fields = [
            'id',
            'username',
            'password',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'role',
            'specialist',
            'specialist_name',
            'is_active',
            'date_joined',
            'is_deleted',
            'deletion_reason',
            'deleted_at',
        ]

        read_only_fields = [
            'id',
            'full_name',
            'specialist_name',
            'is_active',
            'date_joined',
        ]

        extra_kwargs = {
            'username': {
                'required': True,
            },

            'first_name': {
                'required': True,
            },

            'last_name': {
                'required': True,
            },

            'email': {
                'required': False,
                'allow_blank': True,
            },
        }

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()

        if user.id == request.user.id:
            return Response(
                {
                    'detail': (
                        'No puede eliminar su '
                        'propio usuario.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = str(
            request.data.get(
                'reason',
                '',
            )
        ).strip()

        if not reason:
            return Response(
                {
                    'detail': (
                        'Debe ingresar el motivo '
                        'de eliminación.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_state, _ = (
            UserState.objects.get_or_create(
                user=user,
            )
        )

        if user_state.is_deleted:
            return Response(
                {
                    'detail': (
                        'El usuario ya está '
                        'eliminado.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = False
        user.save(
            update_fields=['is_active'],
        )

        user_state.is_deleted = True
        user_state.deletion_reason = reason
        user_state.deleted_at = timezone.now()

        user_state.save(
            update_fields=[
                'is_deleted',
                'deletion_reason',
                'deleted_at',
                'updated_at',
            ]
        )

        return Response(
            {
                'detail': (
                    'Usuario eliminado '
                    'lógicamente.'
                )
            },
            status=status.HTTP_200_OK,
        )


    def get_full_name(self, user):

        full_name = user.get_full_name().strip()

        return full_name or user.username

    def get_specialist_name(self, user):

        try:
            specialist = user.specialist_profile
        except Specialist.DoesNotExist:
            return None

        return (
            f'{specialist.first_name} '
            f'{specialist.last_name}'
        )

    def get_user_role(self, user):

        if user.is_superuser:
            return 'Gerente'

        group = user.groups.filter(
            name__in=ROLE_NAMES
        ).first()

        return group.name if group else None

    def get_is_deleted(self, user):
        state = getattr(
            user,
            'clinic_state',
            None,
        )

        return (
            state.is_deleted
            if state
            else False
        )

    def get_deletion_reason(self, user):
        state = getattr(
            user,
            'clinic_state',
            None,
        )

        return (
            state.deletion_reason
            if state
            else None
        )

    def get_deleted_at(self, user):
        state = getattr(
            user,
            'clinic_state',
            None,
        )

        return (
            state.deleted_at
            if state
            else None
        )


    def to_representation(self, instance):

        data = super().to_representation(
            instance
        )

        data['role'] = self.get_user_role(
            instance
        )

        try:
            data['specialist'] = (
                instance.specialist_profile.id
            )
        except Specialist.DoesNotExist:
            data['specialist'] = None

        return data

    def validate_username(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                'Debe ingresar un nombre de usuario.'
            )

        queryset = User.objects.filter(
            username__iexact=value
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                'Ya existe un usuario con este '
                'nombre de usuario.'
            )

        return value

    def validate_first_name(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                'Debe ingresar los nombres.'
            )

        return value

    def validate_last_name(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                'Debe ingresar los apellidos.'
            )

        return value

    def validate_email(self, value):

        value = value.strip().lower()

        if not value:
            return ''

        queryset = User.objects.filter(
            email__iexact=value
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                'Ya existe un usuario con este correo.'
            )

        return value

    def validate_role(self, value):

        value = value.strip()

        if value not in ROLE_NAMES:
            raise serializers.ValidationError(
                'El rol debe ser Gerente, '
                'Recepcionista o Especialista.'
            )

        if not Group.objects.filter(
            name=value
        ).exists():
            raise serializers.ValidationError(
                f'El grupo {value} no existe en Django.'
            )

        return value

    def validate(self, attrs):

        current_role = None
        current_specialist = None

        if self.instance:
            current_role = self.get_user_role(
                self.instance
            )

            try:
                current_specialist = (
                    self.instance
                    .specialist_profile
                )
            except Specialist.DoesNotExist:
                current_specialist = None

        role = attrs.get(
            'role',
            current_role
        )

        if not self.instance and not role:
            raise serializers.ValidationError({
                'role': (
                    'Debe seleccionar un rol.'
                )
            })

        if (
            not self.instance
            and not attrs.get('password')
        ):
            raise serializers.ValidationError({
                'password': (
                    'Debe ingresar una contraseña.'
                )
            })

        if 'specialist' in attrs:
            specialist = attrs.get(
                'specialist'
            )
        else:
            specialist = current_specialist

        if role == 'Especialista':

            if specialist is None:
                raise serializers.ValidationError({
                    'specialist': (
                        'Debe seleccionar el '
                        'especialista relacionado.'
                    )
                })

            if specialist.is_deleted:
                raise serializers.ValidationError({
                    'specialist': (
                        'El especialista seleccionado '
                        'está eliminado.'
                    )
                })

            if not specialist.is_active:
                raise serializers.ValidationError({
                    'specialist': (
                        'El especialista seleccionado '
                        'está desactivado.'
                    )
                })

            if (
                specialist.user_id
                and (
                    not self.instance
                    or specialist.user_id
                    != self.instance.id
                )
            ):
                raise serializers.ValidationError({
                    'specialist': (
                        'Este especialista ya está '
                        'vinculado con otro usuario.'
                    )
                })

        elif (
            'specialist' in attrs
            and attrs.get('specialist') is not None
        ):
            raise serializers.ValidationError({
                'specialist': (
                    'Solo los usuarios con rol '
                    'Especialista pueden vincularse '
                    'con un especialista.'
                )
            })

        return attrs
#los usuarios eliminados ya no aparecen en el queryset normal.
    def get_object_from_all_users(
        self,
        user_id,
    ):
        try:
            return (
                User.objects
                .select_related('clinic_state')
                .prefetch_related('groups')
                .get(id=user_id)
            )

        except User.DoesNotExist:
            from rest_framework.exceptions import NotFound

            raise NotFound(
                'Usuario no encontrado.'
            )


    @action(
        detail=True,
        methods=['patch'],
        url_path='restore',
    )
    def restore(self, request, pk=None):
        user = self.get_object_from_all_users(
            pk,
        )

        user_state, _ = (
            UserState.objects.get_or_create(
                user=user,
            )
        )

        if not user_state.is_deleted:
            return Response(
                {
                    'detail': (
                        'El usuario no está '
                        'eliminado.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_state.is_deleted = False
        user_state.deletion_reason = None
        user_state.deleted_at = None

        user_state.save(
            update_fields=[
                'is_deleted',
                'deletion_reason',
                'deleted_at',
                'updated_at',
            ]
        )

        user_state, _ = (
            UserState.objects.get_or_create(
                user=user,
            )
        )

        if user_state.is_deleted:
            return Response(
                {
                    'detail': (
                        'Primero debe restaurar '
                        'el usuario eliminado.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = False
        user.save(
            update_fields=['is_active'],
        )

        serializer = self.get_serializer(
            user,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @transaction.atomic
    def create(self, validated_data):

        password = validated_data.pop(
            'password'
        )

        role = validated_data.pop(
            'role'
        )

        specialist = validated_data.pop(
            'specialist',
            None
        )

        user = User.objects.create_user(
            password=password,
            **validated_data,
        )

        group = Group.objects.get(
            name=role
        )

        user.groups.set([
            group
        ])

        if (
            role == 'Especialista'
            and specialist
        ):
            specialist.user = user

            specialist.save(
                update_fields=[
                    'user',
                ]
            )

        return user

    @transaction.atomic
    def update(
        self,
        instance,
        validated_data
    ):

        password = validated_data.pop(
            'password',
            None
        )

        current_role = self.get_user_role(
            instance
        )

        role = validated_data.pop(
            'role',
            current_role
        )

        specialist_was_sent = (
            'specialist' in validated_data
        )

        specialist = validated_data.pop(
            'specialist',
            None
        )

        for field, value in (
            validated_data.items()
        ):
            setattr(
                instance,
                field,
                value
            )

        if password:
            instance.set_password(
                password
            )

        instance.save()

        group = Group.objects.get(
            name=role
        )

        instance.groups.set([
            group
        ])

        try:
            current_specialist = (
                instance.specialist_profile
            )
        except Specialist.DoesNotExist:
            current_specialist = None

        if role != 'Especialista':

            if current_specialist:
                current_specialist.user = None

                current_specialist.save(
                    update_fields=[
                        'user',
                    ]
                )

            return instance

        if not specialist_was_sent:
            specialist = current_specialist

        if (
            current_specialist
            and specialist
            and current_specialist.id
            != specialist.id
        ):
            current_specialist.user = None

            current_specialist.save(
                update_fields=[
                    'user',
                ]
            )

        if specialist:
            specialist.user = instance

            specialist.save(
                update_fields=[
                    'user',
                ]
            )

        return instance