# Proyecto — PWA de Tareas

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

## Build para producción

Para generar la versión final:

```bash
npm run build
```

## Licencia

Este proyecto es de uso privado. Puedes modificar esta sección si deseas publicarlo con una licencia específica, por ejemplo MIT.
