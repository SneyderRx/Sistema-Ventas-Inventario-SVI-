# Sistema de Ventas e Inventario (SVI)

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white) ![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)

Una aplicación web full-stack para la gestión de un inventario de productos y el registro de ventas. Esta herramienta permite a los usuarios autenticarse, gestionar un catálogo de productos (crear, leer, actualizar y eliminar), y procesar transacciones de venta de forma segura y eficiente.

---

## Tabla de Contenidos
- [Sistema de Ventas e Inventario (SVI)](#sistema-de-ventas-e-inventario-svi)
  - [Tabla de Contenidos](#tabla-de-contenidos)
  - [Descripción del Proyecto](#descripción-del-proyecto)
    - [Características Principales](#características-principales)
  - [Tecnologías Utilizadas](#tecnologías-utilizadas)
  - [Requisitos Previos](#requisitos-previos)
  - [Guía de Instalación](#guía-de-instalación)
  - [Scripts Disponibles](#scripts-disponibles)
  - [Estructura del Proyecto](#estructura-del-proyecto)

---

## Descripción del Proyecto

El SVI es una solución completa construida con el stack HTML/CSS/JavaScript en el frontend y Node.js/Express/MySQL en el backend. La aplicación cuenta con un sistema de autenticación basado en JWT, permitiendo un acceso seguro a las diferentes funcionalidades.

### Características Principales
- **Autenticación de Usuarios:** Sistema de registro y login seguro con encriptación de contraseñas (bcrypt) y tokens de sesión (JWT).
- **Gestión de Inventario (CRUD):** Funcionalidad completa para crear, leer, actualizar y eliminar productos del catálogo.
- **Sistema de Ventas Transaccional:** Interfaz modal para registrar ventas, actualizando el stock de productos de forma atómica.
- **Creación de Clientes:** Capacidad de registrar nuevos clientes "al vuelo" durante el proceso de venta.
- **Historial de Ventas:** Página de reportes para visualizar todas las transacciones realizadas, con detalles de cada venta.
- **Pruebas Automatizadas:** Una suite de pruebas robusta con Jest y Supertest que garantiza la calidad y estabilidad de la API.

---

## Tecnologías Utilizadas

- **Frontend:**
  - HTML5
  - CSS3 (Vanilla)
  - JavaScript (ES6+)
  - [SweetAlert2](https://sweetalert2.github.io/) para notificaciones y modales.
- **Backend:**
  - [Node.js](https://nodejs.org/)
  - [Express.js](https://expressjs.com/) para el servidor y enrutamiento de la API.
  - [mysql2](https://github.com/sidorares/node-mysql2) para la conexión con la base de datos.
  - [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) para la autenticación.
  - [bcrypt](https://github.com/kelektiv/node.bcrypt.js) para el hasheo de contraseñas.
  - [cors](https://github.com/expressjs/cors) para la gestión de peticiones entre dominios.
  - [dotenv](https://github.com/motdotla/dotenv) para la gestión de variables de entorno.
- **Base de Datos:**
  - MySQL
- **Pruebas:**
  - [Jest](https://jestjs.io/) como framework principal de pruebas.
  - [Supertest](https://github.com/visionmedia/supertest) para probar los endpoints de la API HTTP.

---

## Requisitos Previos

Asegúrate de tener instalado el siguiente software en tu máquina local antes de empezar:
- [Node.js](https://nodejs.org/) (versión 18.x o superior recomendada)
- npm (se instala automáticamente con Node.js)
- Un servidor de MySQL (por ejemplo, el que se incluye con [XAMPP](https://www.apachefriends.org/es/index.html))
- [Git](https://git-scm.com/)

---

## Guía de Instalación

Sigue estos pasos para configurar el proyecto en tu entorno de desarrollo local.

**1. Clonar el repositorio:**
```bash
git clone [https://github.com/tu-usuario/tu-repositorio.git](https://github.com/tu-usuario/tu-repositorio.git)
cd tu-repositorio
```

**2. Configurar el Backend:**
```bash
# Navega a la carpeta del backend
cd backend

# Instala todas las dependencias de Node.js
npm install
```

**3. Configurar la Base de Datos:**
   - Inicia tu servidor MySQL.
   - Crea una nueva base de datos llamada `svi_db` (o el nombre que prefieras).
   - Importa el esquema de la base de datos. Si tienes un archivo `.sql`, puedes importarlo usando una herramienta como phpMyAdmin. De lo contrario, ejecuta las sentencias `CREATE TABLE` necesarias.
   - **Importante:** Asegúrate de tener al menos un usuario en tu tabla `usuario` con el `Rol` de `'Administrador'` para poder probar todas las funcionalidades.

**4. Configurar las Variables de Entorno:**
   - En la carpeta `backend/`, crea un archivo llamado `.env`. Puedes copiar el contenido de `env.example` si existe, o crear uno nuevo.
   - **Contenido del archivo `.env`:**
     ```
     # Configuración del Servidor
     PORT=3000

     # Configuración de la Base de Datos MySQL
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=
     DB_NAME=svi_db

     # Secreto para JSON Web Token
     JWT_SECRET=tu_frase_secreta_muy_larga_y_dificil_de_adivinar
     ```
   - Rellena las variables con los datos de tu configuración local de MySQL y un secreto para JWT.

**5. Iniciar la aplicación:**
   - Para iniciar el servidor del backend, ejecuta desde la carpeta `backend/`:
     ```bash
     node index.js
     ```
   - Para usar el frontend, simplemente abre el archivo `frontend/login.html` en tu navegador web.

---

## Scripts Disponibles

Desde la carpeta `backend/`, puedes ejecutar los siguientes scripts definidos en `package.json`:

- **`npm start`**
  - Inicia el servidor en modo normal usando `node index.js`.

- **`npm test`**
  - Ejecuta la suite completa de pruebas automatizadas con Jest.

- **`npm run dev` (Recomendado para desarrollar)**
  - Inicia el servidor con `nodemon`, que reinicia automáticamente el servidor cada vez que detecta un cambio en los archivos.
  - *(Para usarlo, primero instálalo con: `npm install --save-dev nodemon` y añade `"dev": "nodemon index.js"` a la sección de scripts en `package.json`)*

---

## Estructura del Proyecto

El proyecto está organizado en dos carpetas principales para separar las responsabilidades:

```
SVI/
├── backend/
│   ├── __tests__/         # Contiene todas las pruebas de Jest
│   │   ├── auth.test.js
│   │   ├── clientes.test.js
│   │   ├── productos.test.js
│   │   └── ventas.test.js
│   ├── node_modules/      # Dependencias del backend
│   ├── .env               # Variables de entorno (local, no subir a Git)
│   ├── .gitignore         # Archivos y carpetas ignorados por Git
│   ├── app.js             # Definición de la aplicación Express
│   ├── index.js           # Punto de entrada que inicia el servidor
│   └── package.json       # Metadatos y dependencias del proyecto
│
└── frontend/
    ├── inventario.html
    ├── inventario.js
    ├── login.html
    ├── login.js
    ├── register.html
    ├── register.js
    ├── reportes.html
    ├── reportes.js
    └── style.css
```