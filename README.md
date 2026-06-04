# Proyecto Rocío García — PWA de Tareas

Aplicación web progresiva desarrollada con **React + TypeScript + Vite**, pensada para gestionar tareas con soporte **offline**, almacenamiento local en **IndexedDB**, caché mediante **Service Worker** y base preparada para sincronización con una API local y notificaciones push con Firebase Cloud Messaging.

## Descripción

Esta PWA permite registrar, visualizar y completar tareas desde el navegador. La aplicación puede instalarse como app en dispositivos compatibles y seguir funcionando aun cuando no haya conexión a internet.

Cuando el usuario está offline, las tareas se guardan localmente y pueden enviarse a una cola de sincronización para procesarse cuando vuelva la conexión.

## Características principales

- Crear tareas con título, descripción, prioridad y fecha de vencimiento.
- Marcar tareas como completadas.
- Visualizar porcentaje de progreso según tareas completadas.
- Indicador visual de estado de conexión: online/offline.
- Funcionamiento como PWA instalable.
- Soporte offline mediante Service Worker.
- Almacenamiento local con IndexedDB usando la librería `idb`.
- Cola `outbox` para sincronización posterior.
- Preparación para Background Sync.
- Integración base con Firebase.
- Preparación para notificaciones push con FCM.
- API local de prueba con Express.
- Configuración de ESLint, Prettier, Husky y CI con GitHub Actions.

## Tecnologías utilizadas

- React 19
- TypeScript
- Vite 7
- IndexedDB
- idb
- Service Worker
- Workbox CLI
- Firebase
- Firebase Cloud Messaging
- Express
- CORS
- ESLint
- Prettier
- Husky

## Estructura del proyecto

```txt
proyect-rocio-master/
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── firebase-messaging-sw.js
│   ├── manifest.json
│   ├── offline.html
│   └── sw.js
├── src/
│   ├── App.css
│   ├── App.tsx
│   ├── db.ts
│   ├── firebase.ts
│   ├── index.css
│   ├── main.tsx
│   ├── push-fcm.ts
│   └── vite-env.d.ts
├── server.js
├── package.json
├── vite.config.ts
├── workbox-config.cjs
└── README.md
```

## Requisitos previos

Antes de ejecutar el proyecto necesitas tener instalado:

- Node.js 18 o superior
- npm
- Un navegador compatible con Service Workers
- Una cuenta/proyecto de Firebase si se usarán notificaciones push o Firestore

## Instalación

Clona el repositorio:

```bash
git clone https://github.com/USUARIO/NOMBRE-DEL-REPOSITORIO.git
```

Entra a la carpeta del proyecto:

```bash
cd proyect-rocio-master
```

Instala las dependencias:

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las variables necesarias para Firebase y Web Push.

```env
VITE_FB_API_KEY=tu_api_key
VITE_FB_AUTH_DOMAIN=tu_auth_domain
VITE_FB_PROJECT_ID=tu_project_id
VITE_FB_SENDER_ID=tu_sender_id
VITE_FB_APP_ID=tu_app_id
VITE_FB_MEASUREMENT_ID=tu_measurement_id
VITE_FCM_VAPID=tu_clave_publica_vapid
VITE_API_BASE=http://localhost:4000
```

> Importante: no subas tus claves reales al repositorio. Agrega `.env` al archivo `.gitignore`.

## Ejecutar en desarrollo

Para iniciar la aplicación en modo desarrollo:

```bash
npm run dev
```

La app normalmente estará disponible en:

```txt
http://localhost:5173
```

## Ejecutar API local de prueba

El proyecto incluye un servidor básico con Express para recibir entradas sincronizadas y tokens push.

```bash
node server.js
```

La API local se ejecuta en:

```txt
http://localhost:4000
```

Endpoints disponibles:

```txt
POST /api/entries
POST /api/push/register
```

## Scripts disponibles

```bash
npm run dev
```

Ejecuta el proyecto en modo desarrollo.

```bash
npm run build
```

Compila TypeScript y genera la versión de producción con Vite.

```bash
npm run preview
```

Sirve localmente la versión compilada.

```bash
npm run lint
```

Ejecuta ESLint para revisar el código.

```bash
npm run build:pwa
```

Compila el proyecto y genera el Service Worker con Workbox.

## Funcionamiento offline

La aplicación utiliza un Service Worker ubicado en:

```txt
public/sw.js
```

Este archivo maneja:

- Caché del App Shell.
- Página offline.
- Estrategia network-first para navegación.
- Estrategia cache-first para recursos esenciales.
- Estrategia stale-while-revalidate para imágenes.
- Estrategia network-first para rutas `/api/`.
- Cola de sincronización mediante IndexedDB.

Cuando no hay conexión, la aplicación conserva datos localmente y puede mostrar la página `offline.html` cuando sea necesario.

## IndexedDB

El archivo principal de base de datos local está en:

```txt
src/db.ts
```

La base local se llama:

```txt
TasksDB
```

Contiene dos almacenes principales:

```txt
entries
outbox
```

`entries` guarda las tareas o entradas locales.

`outbox` guarda datos pendientes de sincronización cuando la aplicación no tiene conexión.

## PWA

La configuración principal de la PWA está en:

```txt
public/manifest.json
```

Incluye:

- Nombre de la aplicación.
- Nombre corto.
- URL de inicio.
- Modo standalone.
- Color de tema.
- Color de fondo.
- Íconos de 192x192 y 512x512.

Para probar correctamente la instalación como PWA, primero genera la versión de producción:

```bash
npm run build
```

Después ejecútala con:

```bash
npm run preview
```

## Notificaciones push

El proyecto contiene una integración base con Firebase Cloud Messaging en:

```txt
src/firebase.ts
src/push-fcm.ts
public/firebase-messaging-sw.js
```

Para habilitar notificaciones push necesitas:

1. Crear un proyecto en Firebase.
2. Activar Cloud Messaging.
3. Generar una Web Push certificate key.
4. Agregar la clave pública VAPID en `.env`.
5. Solicitar permiso de notificaciones desde la app.
6. Registrar el token en tu backend.

## Revisión importante del código actual

Antes de entregar o desplegar el proyecto, conviene revisar estos puntos:

1. En `src/App.tsx` se importan funciones llamadas:

```ts
saveTask, getAllTasks, queueToOutbox
```

pero en `src/db.ts` actualmente existen funciones llamadas:

```ts
saveLocalEntry, listLocalEntries, queueOutbox
```

Por lo tanto, debes unificar los nombres para evitar errores de compilación.

2. En `src/App.tsx` se importa:

```ts
import { askNotify, subscribePush } from "./push";
```

pero el archivo existente se llama:

```txt
src/push-fcm.ts
```

Debes crear `src/push.ts`, renombrar el archivo o cambiar el import según la función que realmente vayas a usar.

3. El tipo `Task` usado en `App.tsx` contiene propiedades como:

```ts
completed
synced
dueDate
```

pero el tipo declarado en `db.ts` todavía no las incluye. Es recomendable actualizar la interfaz para que coincida con el uso real de la app.

## Posible corrección rápida para `Task`

Puedes ajustar el tipo en `src/db.ts` así:

```ts
export type Task = {
  id?: number;
  title: string;
  description?: string;
  completed: boolean;
  priority?: "Baja" | "Media" | "Alta";
  dueDate?: string;
  synced?: boolean;
  createdAt?: number;
};
```

También puedes renombrar las funciones de `db.ts` o cambiar los imports en `App.tsx`.

## Build para producción

Para generar la versión final:

```bash
npm run build
```

Los archivos se generarán en:

```txt
dist/
```

Para previsualizar el build:

```bash
npm run preview
```

## Despliegue

Puedes desplegar esta PWA en plataformas como:

- Vercel
- Netlify
- Firebase Hosting
- GitHub Pages
- Render

Para producción, asegúrate de configurar correctamente las variables de entorno en la plataforma donde publiques el proyecto.

## Autor

Proyecto desarrollado para **Rocío García**.

## Licencia

Este proyecto es de uso privado. Puedes modificar esta sección si deseas publicarlo con una licencia específica, por ejemplo MIT.
