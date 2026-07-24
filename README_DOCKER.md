# Ejecución del Sistema de Gestión de Clínica Odontológica con Docker

## 1. Descripción

El sistema de gestión de clínica odontológica está compuesto por dos aplicaciones:

- **Backend:** Django y Django REST Framework.
- **Frontend:** React, Vite y TypeScript.
- **Base de datos:** PostgreSQL alojada en Supabase.
- **Autenticación:** JSON Web Token mediante SimpleJWT.

Docker se utiliza para ejecutar el backend y el frontend en contenedores separados, manteniendo una configuración uniforme y evitando la instalación manual de Python, Node.js y las dependencias del proyecto.

La base de datos no se ejecuta dentro de Docker. El backend se conecta directamente a Supabase mediante la variable `DATABASE_URL`.

---

## 2. Arquitectura

```text
Navegador
   │
   ├── Frontend React
   │   http://localhost:5173
   │
   └── Backend Django
       http://localhost:8000
              │
              └── PostgreSQL en Supabase
```

Docker Compose administra los dos servicios:

| Servicio | Tecnología | Puerto |
|---|---|---:|
| `frontend` | React + Vite | `5173` |
| `backend` | Django REST Framework | `8000` |

---

## 3. Estructura del proyecto

```text
GestorClinicaAPI/
├── manage.py
├── requirements.txt
├── requirements.docker.txt
├── Dockerfile
├── compose.yaml
├── .dockerignore
├── .env.docker.example
├── config/
├── clinic/
└── clinica-frontend/
    ├── package.json
    ├── package-lock.json
    ├── Dockerfile
    ├── .dockerignore
    └── src/
```

La carpeta raíz contiene el backend Django y la carpeta `clinica-frontend` contiene el frontend React.

---

## 4. Requisitos

Para ejecutar el proyecto se necesita:

- Docker Engine.
- Docker Compose versión 2.
- Git.

Verificar la instalación:

```bash
docker --version
docker compose version
```

Comprobar que Docker está funcionando:

```bash
docker run --rm hello-world
```

El resultado debe incluir:

```text
Hello from Docker!
```

En Linux, el servicio puede iniciarse con:

```bash
sudo systemctl start docker
```

Para consultar su estado:

```bash
sudo systemctl status docker
```

---

## 5. Descargar el proyecto

Clonar el repositorio:

```bash
git clone URL_DEL_REPOSITORIO
cd GestorClinicaAPI
```

También puede descargarse como archivo ZIP y descomprimirse.

---

## 6. Configuración del backend

El backend utiliza un archivo privado llamado `.env`, ubicado en la misma carpeta que `manage.py`.

Crear el archivo:

```bash
touch .env
```

Agregar las siguientes variables:

```env
SECRET_KEY=CLAVE_SECRETA_DE_DJANGO
DEBUG=False
DATABASE_URL=URL_DE_CONEXION_A_SUPABASE
```

Ejemplo de formato:

```env
DATABASE_URL=postgresql://USUARIO:CONTRASENA@HOST:5432/postgres?sslmode=require
```

### Consideraciones

- `SECRET_KEY` debe ser una clave larga y privada.
- `DATABASE_URL` debe corresponder a la base PostgreSQL de Supabase.
- No se deben utilizar comillas alrededor de los valores.
- No se debe colocar `DATABASE_URL` dentro del frontend.
- El archivo `.env` no debe publicarse en el repositorio.
- Las credenciales necesarias para la evaluación deben entregarse de manera privada.

El archivo `config/settings.py` ya está preparado para leer:

```python
SECRET_KEY = os.getenv("SECRET_KEY")
DEBUG = os.getenv("DEBUG") == "True"
DATABASE_URL = os.getenv("DATABASE_URL")
```

Por esta razón, no se requiere modificar la configuración de Django para ejecutar el proyecto con Docker.

---

## 7. Configuración de Docker Compose

Crear el archivo `.env.docker` utilizando la plantilla incluida:

```bash
cp .env.docker.example .env.docker
```

El contenido debe ser:

```env
FRONTEND_PATH=./clinica-frontend
VITE_API_BASE_URL=http://localhost:8000
```

### Significado de las variables

- `FRONTEND_PATH`: ubicación del frontend respecto al archivo `compose.yaml`.
- `VITE_API_BASE_URL`: dirección utilizada por React para consumir la API de Django.

En este proyecto, el frontend está dentro de la carpeta:

```text
clinica-frontend
```

Por ello, la configuración correcta es:

```env
FRONTEND_PATH=./clinica-frontend
```

---

## 8. Construcción e inicio del sistema

Desde la raíz del proyecto, donde se encuentra `compose.yaml`, ejecutar:

```bash
docker compose --env-file .env.docker up --build
```

La primera ejecución puede tardar porque Docker debe:

1. Descargar las imágenes base de Python y Node.js.
2. Instalar las dependencias del backend.
3. Instalar las dependencias del frontend.
4. Aplicar las migraciones de Django.
5. Iniciar ambos servicios.

Cuando el proceso finalice, deben aparecer mensajes indicando que:

- Django está disponible en el puerto `8000`.
- Vite está disponible en el puerto `5173`.

---

## 9. Direcciones del sistema

Abrir en el navegador:

| Recurso | Dirección |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:8000` |
| Swagger | `http://localhost:8000/api/schema/swagger-ui/` |
| Django Admin | `http://localhost:8000/admin/` |

La raíz del backend muestra una respuesta JSON similar a:

```json
{
  "message": "API de la Clínica Odontológica",
  "status": "online",
  "documentation": "/api/schema/swagger-ui/"
}
```

---

## 10. Funcionamiento de los contenedores

### Backend

El contenedor del backend ejecuta:

```bash
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Las migraciones se aplican sobre la base PostgreSQL indicada en `DATABASE_URL`.

### Frontend

El contenedor del frontend ejecuta:

```bash
npm ci
npm run dev -- --host 0.0.0.0
```

React utiliza:

```env
VITE_API_BASE_URL=http://localhost:8000
```

para enviar las solicitudes al backend.

---

## 11. Verificación de los servicios

En otra terminal, ejecutar:

```bash
docker compose --env-file .env.docker ps
```

Los servicios `backend` y `frontend` deben aparecer activos.

Para revisar los registros del backend:

```bash
docker compose --env-file .env.docker logs -f backend
```

Para revisar los registros del frontend:

```bash
docker compose --env-file .env.docker logs -f frontend
```

Salir de los registros con:

```text
Ctrl + C
```

---

## 12. Prueba del sistema

### Desde el frontend

1. Abrir `http://localhost:5173`.
2. Iniciar sesión con una cuenta de demostración.
3. Probar los módulos según el rol asignado.

Flujos principales:

```text
Recepcionista:
Paciente → Cita → Presupuesto → Pago
```

```text
Doctor:
Mis citas → Atender → Historia clínica
→ Tratamiento sugerido → Finalizar atención
```

```text
Gerente:
Dashboard → Usuarios → Especialistas
→ Especialidades → Procedimientos
```

### Desde Swagger

1. Abrir `http://localhost:8000/api/schema/swagger-ui/`.
2. Ejecutar `POST /api/token/`.
3. Ingresar un usuario y contraseña de demostración.
4. Copiar el valor `access`.
5. Presionar `Authorize`.
6. Ingresar el token JWT.
7. Probar los endpoints protegidos.

Ejemplo:

```json
{
  "username": "USUARIO_DE_PRUEBA",
  "password": "CONTRASENA_DE_PRUEBA"
}
```

---

## 13. Usuarios de demostración

Las credenciales se proporcionan únicamente para la evaluación.

| Rol | Usuario | Contraseña |
|---|---|---|
| Recepcionista | `recepcionista_prueba_01` | `r@58NxgMCWG8DWi` |
| Doctor | `Doctor2` | `1234rewq` |
| Gerente | `gerente_prueba` | `FJ3qgLA@UPLr8Tk` |

Las cuentas son datos ficticios.

---

## 14. Detener el sistema

En la terminal donde se ejecuta Docker Compose:

```text
Ctrl + C
```

Después ejecutar:

```bash
docker compose --env-file .env.docker down
```

Este comando detiene y elimina los contenedores, pero no elimina la información almacenada en Supabase.

---

## 15. Volver a iniciar

Cuando no se modificaron dependencias:

```bash
docker compose --env-file .env.docker up
```

Cuando se modificaron archivos, dependencias o configuraciones de Docker:

```bash
docker compose --env-file .env.docker up --build
```

Para reconstruir sin utilizar caché:

```bash
docker compose --env-file .env.docker build --no-cache
docker compose --env-file .env.docker up
```

---

## 16. Comandos útiles

### Crear un superusuario

```bash
docker compose --env-file .env.docker exec backend \
python manage.py createsuperuser
```

El usuario se almacena en Supabase.

### Ejecutar comprobaciones de Django

```bash
docker compose --env-file .env.docker exec backend \
python manage.py check
```

### Aplicar migraciones manualmente

```bash
docker compose --env-file .env.docker exec backend \
python manage.py migrate
```

### Abrir una terminal dentro del backend

```bash
docker compose --env-file .env.docker exec backend sh
```

---

## 17. Archivos privados y archivos versionados

No deben incluirse en el repositorio:

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
requirements.docker.txt
.dockerignore
clinica-frontend/Dockerfile
clinica-frontend/.dockerignore
```

El archivo `.env.docker.example` no contiene información privada y sirve como plantilla.

---

## 18. Solución de problemas

### Docker no puede conectarse al motor

```text
Cannot connect to the Docker daemon
```

En Linux:

```bash
sudo systemctl start docker
```

Luego:

```bash
docker run --rm hello-world
```

### Permiso denegado al utilizar Docker

Ejecutar temporalmente con `sudo`:

```bash
sudo docker compose --env-file .env.docker up --build
```

También puede agregarse el usuario al grupo Docker:

```bash
sudo usermod -aG docker $USER
```

Después debe cerrarse la sesión y volver a ingresar.

### El frontend no inicia

Revisar:

```bash
docker compose --env-file .env.docker logs frontend
```

Confirmar que exista:

```text
clinica-frontend/package.json
```

y que `.env.docker` contenga:

```env
FRONTEND_PATH=./clinica-frontend
```

### El backend no inicia

Revisar:

```bash
docker compose --env-file .env.docker logs backend
```

Confirmar que `.env` contenga:

```env
SECRET_KEY=...
DEBUG=False
DATABASE_URL=...
```

### Error de conexión con Supabase

Verificar:

- Usuario y contraseña.
- Host y puerto.
- Parámetro `sslmode=require`.
- Estado activo del proyecto de Supabase.
- Ausencia de espacios o comillas en `DATABASE_URL`.

### Error 401

El usuario no está autenticado o el token expiró.

### Error 403

La cuenta no tiene permisos suficientes para el recurso solicitado.

### Error 400

La solicitud contiene datos inválidos. Revisar la respuesta del backend en Swagger o en la pestaña `Network` del navegador.

---

## 19. Despliegue en la nube

Docker se utiliza para ejecutar el proyecto localmente y no modifica los despliegues públicos.

### Frontend

```text
https://gestor-clinica-web.vercel.app
```

### Backend y Swagger

```text
https://gestor-clinica-api-mu.vercel.app/api/schema/swagger-ui/
```

Los despliegues de Vercel utilizan sus propias variables de entorno.

---

## 20. Seguridad

- No publicar `SECRET_KEY`.
- No publicar `DATABASE_URL`.
- No compartir la contraseña principal de Supabase.
- Utilizar únicamente datos ficticios.
- Utilizar cuentas de demostración.
- Cambiar o eliminar las credenciales de evaluación después de la revisión.

---

## 21. Resumen de ejecución

```bash
git clone URL_DEL_REPOSITORIO
cd GestorClinicaAPI

touch .env
cp .env.docker.example .env.docker

docker compose --env-file .env.docker up --build
```

Después abrir:

```text
http://localhost:5173
```