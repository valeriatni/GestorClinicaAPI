import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  ClinicUser,
  UserPayload,
  UserRole,
  UserSpecialist,
} from "../../types/user";


interface UserModalProps {
  selectedUser: ClinicUser | null;
  authenticatedUserId:
    number | undefined;
  users: ClinicUser[];
  specialists: UserSpecialist[];
  isSaving: boolean;
  onClose: () => void;

  onSave: (
    user: UserPayload,
  ) => Promise<void>;
}


interface UserForm {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole | "";
  specialist: string;
  password: string;
  password_confirmation: string;
}


interface UserFormErrors {
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  specialist?: string;
  password?: string;
  password_confirmation?: string;
  general?: string;
}


const emptyForm: UserForm = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  role: "",
  specialist: "",
  password: "",
  password_confirmation: "",
};


export default function UserModal({
  selectedUser,
  authenticatedUserId,
  users,
  specialists,
  isSaving,
  onClose,
  onSave,
}: UserModalProps) {
  const [form, setForm] =
    useState<UserForm>(
      emptyForm,
    );

  const [errors, setErrors] =
    useState<UserFormErrors>({});


  const isEditingOwnUser =
    selectedUser?.id ===
    authenticatedUserId;


  useEffect(() => {
    if (selectedUser) {
      setForm({
        username:
          selectedUser.username,

        first_name:
          selectedUser.first_name,

        last_name:
          selectedUser.last_name,

        email:
          selectedUser.email ?? "",

        role:
          selectedUser.role ?? "",

        specialist:
          selectedUser.specialist
            ? String(
                selectedUser.specialist,
              )
            : "",

        password: "",

        password_confirmation:
          "",
      });
    } else {
      setForm(emptyForm);
    }

    setErrors({});
  }, [selectedUser]);


  const availableSpecialists =
    useMemo(() => {
      const linkedSpecialistIds =
        new Set(
          users
            .filter(
              (user) =>
                user.id !==
                  selectedUser?.id &&
                user.specialist !==
                  null,
            )
            .map(
              (user) =>
                user.specialist as number,
            ),
        );

      return specialists.filter(
        (specialist) => {
          const isCurrent =
            selectedUser?.specialist ===
            specialist.id;

          const isAvailable =
            !linkedSpecialistIds.has(
              specialist.id,
            );

          const isUsable =
            specialist.is_active &&
            !specialist.is_deleted;

          return (
            isCurrent ||
            (
              isAvailable &&
              isUsable
            )
          );
        },
      );
    }, [
      users,
      specialists,
      selectedUser,
    ]);


  function changeField(
    field: keyof UserForm,
    value: string,
  ) {
    setForm(
      (currentForm) => {
        const updatedForm = {
          ...currentForm,
          [field]: value,
        };

        if (
          field === "role" &&
          value !== "Especialista"
        ) {
          updatedForm.specialist =
            "";
        }

        return updatedForm;
      },
    );

    setErrors(
      (currentErrors) => ({
        ...currentErrors,
        [field]: undefined,
        general: undefined,
      }),
    );
  }


  function validateForm():
  boolean {
    const newErrors:
      UserFormErrors = {};

    const username =
      form.username.trim();

    const firstName =
      form.first_name.trim();

    const lastName =
      form.last_name.trim();

    const email =
      form.email.trim();

    if (!username) {
      newErrors.username =
        "Debe ingresar el nombre de usuario.";
    }

    if (!firstName) {
      newErrors.first_name =
        "Debe ingresar los nombres.";
    }

    if (!lastName) {
      newErrors.last_name =
        "Debe ingresar los apellidos.";
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email,
      )
    ) {
      newErrors.email =
        "Debe ingresar un correo válido.";
    }

    if (!form.role) {
      newErrors.role =
        "Debe seleccionar un rol.";
    }

    if (
      form.role ===
        "Especialista" &&
      !form.specialist
    ) {
      newErrors.specialist =
        "Debe seleccionar el especialista relacionado.";
    }

    if (!selectedUser) {
      if (!form.password) {
        newErrors.password =
          "Debe ingresar una contraseña.";
      } else if (
        form.password.length < 8
      ) {
        newErrors.password =
          "La contraseña debe tener al menos 8 caracteres.";
      }

      if (
        form.password !==
        form.password_confirmation
      ) {
        newErrors
          .password_confirmation =
          "Las contraseñas no coinciden.";
      }
    } else if (
      form.password ||
      form.password_confirmation
    ) {
      if (
        form.password.length < 8
      ) {
        newErrors.password =
          "La contraseña debe tener al menos 8 caracteres.";
      }

      if (
        form.password !==
        form.password_confirmation
      ) {
        newErrors
          .password_confirmation =
          "Las contraseñas no coinciden.";
      }
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors)
        .length === 0
    );
  }


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrors({});

    if (!validateForm()) {
      return;
    }

    if (!form.role) {
      return;
    }

    const payload:
      UserPayload = {
        username:
          form.username.trim(),

        first_name:
          form.first_name.trim(),

        last_name:
          form.last_name.trim(),

        email:
          form.email
            .trim()
            .toLowerCase(),

        role: form.role,

        specialist:
          form.role ===
            "Especialista"
            ? Number(
                form.specialist,
              )
            : null,
      };

    if (form.password) {
      payload.password =
        form.password;
    }

    try {
      await onSave(payload);
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el usuario.",
      });
    }
  }


  function inputClass(
    field:
      keyof UserFormErrors,
  ) {
    return (
      `form-control ${
        errors[field]
          ? "is-invalid"
          : ""
      }`
    );
  }


  function selectClass(
    field:
      keyof UserFormErrors,
  ) {
    return (
      `form-select ${
        errors[field]
          ? "is-invalid"
          : ""
      }`
    );
  }


  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <form
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedUser
                    ? "Editar usuario"
                    : "Crear usuario"}
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  disabled={isSaving}
                />
              </div>

              <div className="modal-body">
                {errors.general && (
                  <div className="alert alert-danger">
                    {errors.general}
                  </div>
                )}

                <p className="text-muted">
                  Los campos con * son
                  obligatorios.
                </p>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Nombre de usuario *
                    </label>

                    <input
                      type="text"
                      className={inputClass(
                        "username",
                      )}
                      value={form.username}
                      onChange={(event) =>
                        changeField(
                          "username",
                          event.target.value,
                        )
                      }
                      autoComplete="off"
                      disabled={isSaving}
                    />

                    {errors.username && (
                      <div className="invalid-feedback">
                        {errors.username}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Rol *
                    </label>

                    <select
                      className={selectClass(
                        "role",
                      )}
                      value={form.role}
                      onChange={(event) =>
                        changeField(
                          "role",
                          event.target.value,
                        )
                      }
                      disabled={
                        isSaving ||
                        isEditingOwnUser
                      }
                    >
                      <option value="">
                        Seleccione un rol
                      </option>

                      <option value="Gerente">
                        Gerente
                      </option>

                      <option value="Recepcionista">
                        Recepcionista
                      </option>

                      <option value="Especialista">
                        Especialista
                      </option>
                    </select>

                    {errors.role && (
                      <div className="invalid-feedback">
                        {errors.role}
                      </div>
                    )}

                    {isEditingOwnUser && (
                      <small className="text-muted">
                        No puede cambiar el rol
                        de su propio usuario.
                      </small>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Nombres *
                    </label>

                    <input
                      type="text"
                      className={inputClass(
                        "first_name",
                      )}
                      value={form.first_name}
                      onChange={(event) =>
                        changeField(
                          "first_name",
                          event.target.value,
                        )
                      }
                      disabled={isSaving}
                    />

                    {errors.first_name && (
                      <div className="invalid-feedback">
                        {errors.first_name}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Apellidos *
                    </label>

                    <input
                      type="text"
                      className={inputClass(
                        "last_name",
                      )}
                      value={form.last_name}
                      onChange={(event) =>
                        changeField(
                          "last_name",
                          event.target.value,
                        )
                      }
                      disabled={isSaving}
                    />

                    {errors.last_name && (
                      <div className="invalid-feedback">
                        {errors.last_name}
                      </div>
                    )}
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label">
                      Correo electrónico
                    </label>

                    <input
                      type="email"
                      className={inputClass(
                        "email",
                      )}
                      value={form.email}
                      onChange={(event) =>
                        changeField(
                          "email",
                          event.target.value,
                        )
                      }
                      disabled={isSaving}
                    />

                    {errors.email && (
                      <div className="invalid-feedback">
                        {errors.email}
                      </div>
                    )}
                  </div>

                  {form.role ===
                    "Especialista" && (
                    <div className="col-12 mb-3">
                      <label className="form-label">
                        Especialista relacionado *
                      </label>

                      <select
                        className={selectClass(
                          "specialist",
                        )}
                        value={
                          form.specialist
                        }
                        onChange={(event) =>
                          changeField(
                            "specialist",
                            event.target.value,
                          )
                        }
                        disabled={isSaving}
                      >
                        <option value="">
                          Seleccione un especialista
                        </option>

                        {availableSpecialists.map(
                          (specialist) => (
                            <option
                              key={specialist.id}
                              value={specialist.id}
                            >
                              Dr(a).{" "}
                              {specialist.first_name}{" "}
                              {specialist.last_name}
                              {" - CMP/COP: "}
                              {specialist.license_number}
                            </option>
                          ),
                        )}
                      </select>

                      {errors.specialist && (
                        <div className="invalid-feedback">
                          {errors.specialist}
                        </div>
                      )}

                      {!errors.specialist &&
                        availableSpecialists
                          .length === 0 && (
                          <small className="text-danger">
                            No existen especialistas
                            disponibles para vincular.
                          </small>
                        )}
                    </div>
                  )}

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      {selectedUser
                        ? "Nueva contraseña"
                        : "Contraseña *"}
                    </label>

                    <input
                      type="password"
                      className={inputClass(
                        "password",
                      )}
                      value={form.password}
                      onChange={(event) =>
                        changeField(
                          "password",
                          event.target.value,
                        )
                      }
                      autoComplete="new-password"
                      disabled={isSaving}
                    />

                    {errors.password && (
                      <div className="invalid-feedback">
                        {errors.password}
                      </div>
                    )}

                    {selectedUser &&
                      !errors.password && (
                        <small className="text-muted">
                          Déjela vacía para conservar
                          la contraseña actual.
                        </small>
                      )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      {selectedUser
                        ? "Confirmar nueva contraseña"
                        : "Confirmar contraseña *"}
                    </label>

                    <input
                      type="password"
                      className={inputClass(
                        "password_confirmation",
                      )}
                      value={
                        form.password_confirmation
                      }
                      onChange={(event) =>
                        changeField(
                          "password_confirmation",
                          event.target.value,
                        )
                      }
                      autoComplete="new-password"
                      disabled={isSaving}
                    />

                    {errors
                      .password_confirmation && (
                      <div className="invalid-feedback">
                        {
                          errors
                            .password_confirmation
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isSaving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Guardando..."
                    : selectedUser
                      ? "Guardar cambios"
                      : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" />
    </>
  );
}