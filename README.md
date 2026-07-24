# Sistema de Gestión para Clínica Odontológica

Proyecto académico desarrollado para gestionar los principales procesos internos de una clínica odontológica mediante una aplicación web con autenticación y control de acceso por roles.

El sistema integra un backend construido con Django REST Framework, un frontend desarrollado con React y TypeScript, una base de datos PostgreSQL alojada en Supabase y despliegues independientes en Vercel.

---

## 1. Datos del proyecto

**Curso:** Introducción al Desarrollo Web  
**Institución:** Universidad Nacional de San Agustín de Arequipa  
**Escuela Profesional:** Ingeniería de Sistemas  

### Integrantes

- **Integrante 1:** Ticona Nina Valeria Abigai(GRUPO A)
- **Integrante 2:** Velasquez Puma Brigitte Karolay (GRUPO A)
- **Integrante 3:** Lerma Ccopa Jhonatan Javier(GRUPO B)
---

## 2. Objetivo

Desarrollar un sistema web para apoyar la gestión de una clínica odontológica, permitiendo administrar pacientes, citas, historias clínicas, tratamientos sugeridos, presupuestos, pagos, especialistas, especialidades, procedimientos y usuarios.

El sistema utiliza roles para mostrar únicamente las funciones correspondientes a cada tipo de usuario.

---

## 3. Tecnologías utilizadas

### Backend

- Python
- Django 5.2
- Django REST Framework
- SimpleJWT
- drf-spectacular
- django-cors-headers
- dj-database-url
- python-dotenv

### Frontend

- React
- Vite
- TypeScript
- React Router DOM
- TanStack React Query
- Bootstrap
- Fetch API

### Base de datos y despliegue

- PostgreSQL en Supabase
- Vercel para el frontend
- Vercel para el backend
- Docker y Docker Compose para ejecución local

### Herramientas de prueba

- Postman
- Swagger / OpenAPI
- Navegador web
- Django Admin

---

## 4. Funcionalidades principales

### Recepcionista

La recepcionista puede:

- Buscar y registrar pacientes.
- Actualizar información de pacientes.
- Crear citas.
- Confirmar, cancelar y reprogramar citas.
- Marcar la llegada del paciente.
- Consultar tratamientos sugeridos.
- Crear presupuestos.
- Registrar pagos por presupuesto.
- Registrar pagos manuales por cita.
- Consultar el historial de pagos.

Flujo principal:

```text
Paciente → Cita → Presupuesto → Pago
```

### Doctor o especialista

El doctor puede:

- Consultar sus propias citas.
- Iniciar la atención de un paciente.
- Crear o actualizar la historia clínica.
- Registrar antecedentes médicos.
- Registrar alergias y observaciones.
- Registrar diagnóstico.
- Seleccionar un procedimiento.
- Crear un tratamiento sugerido.
- Finalizar la atención.

Flujo principal:

```text
Mis citas → Atender → Historia clínica
→ Tratamiento sugerido → Finalizar atención
```

### Gerente

El gerente puede:

- Consultar el dashboard.
- Administrar usuarios y roles.
- Administrar especialistas.
- Administrar especialidades.
- Administrar procedimientos.

---

## 5. Flujo general del sistema

```text
Recepcionista registra o busca al paciente
                    ↓
              Crea una cita
                    ↓
      El doctor realiza la atención
                    ↓
       Actualiza la historia clínica
                    ↓
       Crea un tratamiento sugerido
                    ↓
    Recepción genera un presupuesto
                    ↓
       Registra uno o varios pagos
```

El flujo financiero implementado es:

```text
Tratamiento sugerido → Presupuesto → Pago
```

---

## 6. Arquitectura

El frontend se comunica con el backend mediante solicitudes HTTP y datos JSON.

```text
Frontend React
      ↓
Fetch + React Query
      ↓
API REST de Django
      ↓
Django REST Framework
      ↓
PostgreSQL en Supabase
```

La autenticación utiliza JWT:

```text
Inicio de sesión
      ↓
POST /api/token/
      ↓
Access token + Refresh token
      ↓
Authorization: Bearer TOKEN
```

---

## 7. Diagrama UML

El diagrama UML presenta las entidades principales y sus relaciones.

> Colocar la imagen en la carpeta `img` y verificar que el nombre coincida con la siguiente ruta.

![Diagrama UML del sistema](./img/UML.png)

Entidades principales:

- Specialty
- Specialist
- Patient
- Appointment
- MedicalRecord
- Procedure
- SuggestedTreatment
- Budget
- Payment
- User y Group de Django

---

## 8. Estructura del proyecto

```text
GestorClinicaAPI/
├── clinic/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── permissions.py
│   ├── tests.py
│   ├── api_urls.py
│   ├── migrations/
│   ├── serializers/
│   ├── api_views/
│   └── models/
│
├── clinica-frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── types/
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
│
├── config/
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── img/
│   └── diagrama-uml.png
│
├── .dockerignore
├── .env.docker.example
├── .gitignore
├── compose.yaml
├── Dockerfile
├── manage.py
├── README.md
├── README_DOCKER.md
├── requirements.docker.txt
└── requirements.txt
```

---

## 9. Requisitos para ejecución manual

### Requisitos generales

- Git
- Python 3.10 o superior
- pip
- Node.js 20 o superior
- npm
- Acceso a la base PostgreSQL de Supabase

Verificar las versiones:

```bash
git --version
python --version
node --version
npm --version
```

En algunas distribuciones Linux debe utilizarse:

```bash
python3 --version
```

---

## 10. Descargar el proyecto

Clonar el repositorio:

```bash
git clone https://github.com/valeriatni/GestorClinicaAPI.git
cd GestorClinicaAPI
```

También puede descargarse desde GitHub como archivo ZIP.

Si el repositorio es privado, el propietario debe otorgar acceso previamente a la cuenta de GitHub del evaluador.

---

## 11. Configuración del backend

El backend se encuentra en la raíz del proyecto, donde está `manage.py`.

### 11.1. Crear el entorno virtual

#### Windows PowerShell

```powershell
python -m venv myvenv
```

Activar:

```powershell
.\myvenv\Scripts\Activate.ps1
```

#### Linux

```bash
python3 -m venv myvenv
```

Activar:

```bash
source myvenv/bin/activate
```

### 11.2. Instalar dependencias

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 11.3. Crear el archivo `.env`

Crear un archivo llamado `.env` en la misma carpeta que `manage.py`.

Contenido:

```env
SECRET_KEY=CLAVE_SECRETA_DE_DJANGO
DEBUG=True
DATABASE_URL=URL_DE_CONEXION_A_SUPABASE
```

Ejemplo de estructura:

```env
DATABASE_URL=postgresql://USUARIO:CONTRASENA@HOST:5432/postgres?sslmode=require
```

Consideraciones:

- No utilizar comillas alrededor de los valores.
- No agregar espacios antes o después de `=`.
- `DATABASE_URL` debe corresponder al proyecto de Supabase.
- Se recomienda utilizar la conexión Session Pooler de Supabase.
- El archivo `.env` contiene información privada y no debe publicarse.

### 11.4. Verificar Django

```bash
python manage.py check
```

### 11.5. Aplicar migraciones

```bash
python manage.py migrate
```

No es necesario ejecutar `makemigrations` para probar el proyecto, porque las migraciones ya se encuentran incluidas.

### 11.6. Crear un superusuario

Solo es necesario cuando no existe un administrador de prueba:

```bash
python manage.py createsuperuser
```

### 11.7. Ejecutar el backend

```bash
python manage.py runserver
```

Direcciones:

```text
Backend:
http://127.0.0.1:8000
```

```text
Django Admin:
http://127.0.0.1:8000/admin/
```

```text
Swagger:
http://127.0.0.1:8000/api/schema/swagger-ui/
```

---

## 12. Configuración del frontend

Abrir otra terminal.

Ingresar a la carpeta:

```bash
cd clinica-frontend
```

### 12.1. Instalar dependencias

Cuando existe `package-lock.json`:

```bash
npm ci
```

Alternativamente:

```bash
npm install
```

### 12.2. Crear el archivo `.env`

Crear:

```text
clinica-frontend/.env
```

Contenido:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

La variable contiene únicamente la URL pública o local del backend. No deben colocarse contraseñas ni datos de Supabase dentro de variables `VITE_`.

### 12.3. Ejecutar el frontend

```bash
npm run dev
```

Abrir:

```text
http://localhost:5173
```

---

## 13. Ejecución manual completa

Deben mantenerse abiertas dos terminales.

### Terminal 1: backend

```bash
cd GestorClinicaAPI
```

Windows:

```powershell
.\myvenv\Scripts\Activate.ps1
python manage.py runserver
```

Linux:

```bash
source myvenv/bin/activate
python manage.py runserver
```

### Terminal 2: frontend

```bash
cd GestorClinicaAPI/clinica-frontend
npm run dev
```

Después abrir:

```text
http://localhost:5173
```

---

## 14. Ejecución mediante Docker

Docker permite iniciar el backend y el frontend sin instalar manualmente sus dependencias dentro del sistema operativo.

El proyecto incluye:

- `Dockerfile`
- `compose.yaml`
- `requirements.docker.txt`
- `.env.docker.example`
- Archivos Docker del frontend

La explicación completa se encuentra en:

```text
README_DOCKER.md
```

Ejecución básica:

```bash
cp .env.docker.example .env.docker
```

El archivo `.env.docker` debe contener:

```env
FRONTEND_PATH=./clinica-frontend
VITE_API_BASE_URL=http://localhost:8000
```

Después:

```bash
docker compose --env-file .env.docker up --build
```

Abrir:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8000
Swagger:  http://localhost:8000/api/schema/swagger-ui/
```

Docker continúa utilizando Supabase mediante el archivo privado `.env` del backend.

---

## 15. Usuarios y grupos

El sistema utiliza los grupos:

```text
Recepcionista
Doctor
Gerente
```

Los grupos y permisos pueden revisarse desde Django Admin:

```text
http://127.0.0.1:8000/admin/
```

Ruta:

```text
Autenticación y autorización → Grupos
```

### Credenciales de demostración

Completar antes de la entrega:

| Rol | Usuario | Contraseña |
|---|---|---|
| Recepcionista | `recepcionista_prueba_01` | `r@58NxgMCWG8DWi` |
| Doctor | `Doctor2` | `1234rewq` |
| Gerente | `gerente_prueba` | `FJ3qgLA@UPLr8Tk` |

Las credenciales solo corresponden únicamente a cuentas de prueba.

---

## 16. Pruebas realizadas

Las pruebas de la API se realizaron mediante Postman y Swagger.

### Obtener token JWT

Endpoint:

```text
POST /api/token/
```

Cuerpo:

```json
{
  "username": "USUARIO",
  "password": "CONTRASENA"
}
```

Respuesta esperada:

```json
{
  "refresh": "TOKEN_REFRESH",
  "access": "TOKEN_ACCESS"
}
```

### Autorización

En Swagger:

1. Ejecutar `POST /api/token/`.
2. Copiar el valor `access`.
3. Presionar `Authorize`.
4. Ingresar el token.
5. Probar los endpoints protegidos.

En Postman debe agregarse:

```http
Authorization: Bearer TOKEN_ACCESS
```

### Endpoints principales probados

```text
POST   /api/token/
POST   /api/token/refresh/
GET    /api/me/

GET    /api/patients/
POST   /api/patients/
PATCH  /api/patients/{id}/

GET    /api/appointments/
POST   /api/appointments/
PATCH  /api/appointments/{id}/

GET    /api/medical-records/
POST   /api/medical-records/
PATCH  /api/medical-records/{id}/

GET    /api/suggested-treatments/
POST   /api/suggested-treatments/
PATCH  /api/suggested-treatments/{id}/

GET    /api/budgets/
POST   /api/budgets/
PATCH  /api/budgets/{id}/

GET    /api/payments/
POST   /api/payments/
```

---

## 17. Despliegue en Vercel

El frontend y el backend se desplegaron como proyectos independientes, aunque ambos pertenecen al mismo repositorio.

### Frontend en la nube

```text
https://gestor-clinica-web.vercel.app
```

### Backend y documentación Swagger

```text
https://gestor-clinica-api-mu.vercel.app/api/schema/swagger-ui/
```

La raíz del backend también permite verificar el estado de la API:

```text
https://gestor-clinica-api-mu.vercel.app
```

Respuesta esperada:

```json
{
  "message": "API de la Clínica Odontológica",
  "status": "online",
  "documentation": "/api/schema/swagger-ui/"
}
```

### Variables del backend en Vercel

```env
SECRET_KEY=...
DEBUG=False
DATABASE_URL=...
```

### Variable del frontend en Vercel

```env
VITE_API_BASE_URL=https://gestor-clinica-api-mu.vercel.app
```

El backend permite solicitudes desde el dominio público del frontend mediante la configuración de CORS.

---

## 18. Base de datos

La aplicación utiliza PostgreSQL en Supabase.

Docker no crea una base de datos adicional. Tanto la ejecución manual como la ejecución con Docker utilizan:

```env
DATABASE_URL=...
```

La base almacena:

- Usuarios y grupos.
- Pacientes.
- Especialistas.
- Especialidades.
- Citas.
- Historias clínicas.
- Procedimientos.
- Tratamientos sugeridos.
- Presupuestos.
- Pagos.

Los datos utilizados para la demostración deben ser ficticios.

---

## 19. Archivos privados

No deben publicarse:

```text
.env
.env.docker
myvenv/
node_modules/
dist/
__pycache__/
```

Sí deben incluirse:

```text
.env.docker.example
Dockerfile
compose.yaml
requirements.txt
requirements.docker.txt
README.md
README_DOCKER.md
```

El archivo `.env` real puede entregarse por un medio privado únicamente cuando el evaluador necesita ejecutar el proyecto contra la base de Supabase.

---

## 20. Solución de problemas

### Error `No module named django`

El entorno virtual no está activo o faltan dependencias:

```bash
pip install -r requirements.txt
```

### Error `npm: command not found`

Instalar Node.js y npm.

### Error de conexión con Supabase

Verificar:

- Usuario.
- Contraseña.
- Host.
- Puerto.
- `sslmode=require`.
- Estado del proyecto de Supabase.

### Error 401

El usuario no está autenticado o el token expiró.

### Error 403

El usuario inició sesión, pero su grupo no tiene el permiso requerido.

### Error 400

La información enviada no cumple las validaciones del backend. Revisar la respuesta de la solicitud.

### Error 500

Revisar los registros del backend o los logs del despliegue en Vercel.

### Error de CORS

Confirmar que el dominio del frontend esté incluido en `CORS_ALLOWED_ORIGINS`.

### Linux no encuentra un archivo importado

Linux distingue mayúsculas y minúsculas. Los nombres de carpetas e imports deben coincidir exactamente.

---

## 21. Conclusiones

El proyecto permitió integrar los conocimientos principales del desarrollo web mediante una arquitectura cliente-servidor.

Django REST Framework se utilizó para implementar la lógica del negocio, las validaciones, los permisos y los endpoints de la API. React permitió construir una interfaz organizada por módulos y roles, mientras que React Query facilitó la consulta y actualización de información.

La autenticación JWT protege los recursos del sistema y permite restringir las funciones según el usuario. PostgreSQL en Supabase proporciona una base de datos remota y centralizada.

Finalmente, Vercel permite acceder públicamente al frontend y al backend, mientras que Docker ofrece una alternativa reproducible para ejecutar el proyecto localmente.

---

## 22. Referencias

1. Django Software Foundation. (2026). *Django documentation, version 5.2*. https://docs.djangoproject.com/en/5.2/

2. Docker Inc. (2026). *Docker Compose documentation*. https://docs.docker.com/compose/

3. Vercel Inc. (2026). *Using the Python Runtime with Vercel Functions*. https://vercel.com/docs/functions/runtimes/python