# Guacamole Shop

Tienda online construida con Astro para vender productos de catálogo, gestionar pedidos con flujo de pago manual y operar un backoffice autenticado para catálogo, pedidos, medios de pago y analytics.

## Propuesta del proyecto

`guacamole-shop` combina storefront + checkout + panel admin en una sola aplicación SSR:

- catálogo público con home, tienda y detalle de producto,
- flujo de compra en dos pasos (`/checkout` → `/pagos/[token]`),
- revisión manual de pagos con comprobante,
- administración de productos, categorías, pedidos, medios de pago y analytics.

## Stack real

### Frontend / app

- [Astro 5](https://astro.build/) con `astro:actions` y middleware
- TypeScript
- Tailwind CSS
- Preact + Nanostores para componentes interactivos puntuales

### Datos e integraciones

- `@astrojs/db` / libSQL (Astro DB)
- Firebase Web SDK para autenticación del admin
- Cloudinary para subida de imágenes
- Resend para notificaciones por email
- WhatsApp Cloud API para notificaciones opcionales
- Chart.js + ExcelJS para analytics/exportes del panel admin

## Características principales

- Home comercial y catálogo completo con filtros y búsqueda
- Detalle de producto con imágenes, tamaños y CTA de compra
- Carrito persistido en cookies
- Checkout con validaciones y sanitización del carrito
- Generación de pedido persistido con token público
- Página pública de pago por pedido: `/pagos/[token]`
- Carga de comprobante y revisión manual desde backoffice
- Admin con login, dashboard, CRUD de productos/categorías, pedidos y analytics
- Configuración de medios de pago (Bancolombia, Nequi y QR) desde admin
- Notificaciones operativas por email y WhatsApp

## Requisitos previos

- Node.js LTS
- npm
- Firebase configurado para auth por email/password
- Base remota de Astro DB/libSQL si vas a usar `dev:remote` o deploy remoto
- Cuenta/configuración de Cloudinary si vas a subir imágenes
- Resend y/o WhatsApp Cloud API si vas a usar notificaciones reales

## Instalación

1. Cloná el repositorio.
2. Instalá dependencias:

```bash
npm install
```

3. Creá tu archivo `.env` a partir de `.env.example`.
4. Completá las variables necesarias según el entorno.

## Variables de entorno

Tomá `.env.example` como base. Además del ejemplo actual, el código también contempla algunas variables opcionales extra.

### App

| Variable | Requerida | Uso |
| --- | --- | --- |
| `PUBLIC_URL` | Sí | URL pública base para links, SEO e imágenes resueltas en SSR. |

### Base de datos remota (Astro DB / libSQL)

| Variable | Requerida | Uso |
| --- | --- | --- |
| `ASTRO_DB_REMOTE_URL` | Para remoto/deploy | Conexión libSQL remota. |
| `ASTRO_DB_APP_TOKEN` | Para remoto/deploy | Token de acceso a la DB remota. |

> `dev:remote` y builds remotos escriben contra la base apuntada por estas variables. Usá staging, no producción, para pruebas.

### Firebase Web SDK (admin)

| Variable | Requerida | Uso |
| --- | --- | --- |
| `PUBLIC_FIREBASE_API_KEY` | Sí para admin | Config Firebase web. |
| `PUBLIC_FIREBASE_AUTH_DOMAIN` | Sí para admin | Config Firebase web. |
| `PUBLIC_FIREBASE_PROJECT_ID` | Sí para admin | Middleware y validación de tokens. |
| `PUBLIC_FIREBASE_STORAGE_BUCKET` | Sí para admin | Config Firebase web. |
| `PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sí para admin | Config Firebase web. |
| `PUBLIC_FIREBASE_APP_ID` | Sí para admin | Config Firebase web. |
| `PUBLIC_FIREBASE_MEASUREMENT_ID` | Opcional | Analytics de Firebase si aplica. |
| `ADMIN_ALLOWED_EMAILS` | Sí para operar admin real | Lista separada por comas de emails autorizados para el panel/acciones sensibles. |

### Pedidos / seguridad

| Variable | Requerida | Uso |
| --- | --- | --- |
| `ORDER_PUBLIC_TOKEN_SECRET` | Sí | Se usa para hashear el token público del pedido. |

### Cloudinary

| Variable | Requerida | Uso |
| --- | --- | --- |
| `CLOUDINARY_CLOUD_NAME` | Si subís imágenes | Upload de assets. |
| `CLOUDINARY_API_KEY` | Si subís imágenes | Upload de assets. |
| `CLOUDINARY_API_SECRET` | Si subís imágenes | Upload de assets. |

### Email (Resend)

| Variable | Requerida | Uso |
| --- | --- | --- |
| `RESEND_API_KEY` | Opcional | Envío de emails operativos. |
| `RESEND_FROM_EMAIL` | Opcional | Remitente base. |
| `RESEND_FROM_NAME` | Opcional | Nombre visible del remitente. |
| `RESEND_DEV_TO_OVERRIDE` | Opcional | Redirige todos los correos a una casilla de testing. |

### WhatsApp Cloud API

| Variable | Requerida | Uso |
| --- | --- | --- |
| `WHATSAPP_CLOUD_API_TOKEN` | Opcional | Envío de mensajes. |
| `WHATSAPP_CLOUD_PHONE_NUMBER_ID` | Opcional | Envío de mensajes. |
| `ORDER_NOTIFICATIONS_ADMIN_WHATSAPP` | Opcional | Destino admin para alertas operativas. |
| `ORDER_NOTIFICATIONS_WHATSAPP_ENABLED` | Opcional | `true`/`false` para activar envíos reales. |

### Notificaciones operativas

| Variable | Requerida | Uso |
| --- | --- | --- |
| `ORDER_NOTIFICATIONS_ADMIN_EMAIL` | Opcional | Casilla admin para eventos de pedidos. |

## Desarrollo

### Desarrollo local

```bash
npm run dev
```

Alias equivalente:

```bash
npm run dev:local
```

### Desarrollo contra base remota

```bash
npm run dev:remote
```

Usalo solo cuando realmente quieras probar contra la DB remota configurada.

## Scripts útiles

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Levanta Astro en desarrollo. |
| `npm run dev:local` | Alias de desarrollo local. |
| `npm run dev:remote` | Desarrollo usando la DB remota configurada. |
| `npm run build` | Build remoto (`astro build --remote`). |
| `npm run build:local` | Build local. |
| `npm run build:remote` | Build remoto explícito. |
| `npm run preview` | Preview del build. |
| `npm run astro` | Ejecuta CLI de Astro. |

> Nota: el repo tiene varios `*.test.ts`, pero hoy **no** hay un script `test` oficial cableado en `package.json`.

## Admin y autenticación (alto nivel)

El admin vive bajo `/admin/*`.

### Cómo funciona

1. El login usa Firebase Auth (email/password) mediante el Web SDK.
2. Si la autenticación es válida, el servidor guarda el `idToken` en una cookie `httpOnly` llamada `__session`.
3. El middleware de Astro protege `/admin/*` y también acciones sensibles bajo `/_actions/*`.
4. En cada request protegida se verifica localmente la firma del token de Firebase.
5. Además de estar autenticado, el email debe estar incluido en `ADMIN_ALLOWED_EMAILS`.

### Qué cubre hoy el panel

- `/admin/login`
- `/admin/dashboard`
- `/admin/products/[...slug]`
- `/admin/categories`
- `/admin/orders`
- `/admin/analytics`
- configuración de QR, Bancolombia y Nequi desde el dashboard/admin

### Consideraciones operativas

- Si `PUBLIC_FIREBASE_PROJECT_ID` no está configurada, el área admin queda bloqueada.
- Si `ADMIN_ALLOWED_EMAILS` está vacío o no incluye tu correo, el usuario puede autenticarse pero no operar el panel sensible.
- Las páginas admin fuerzan headers `no-store` para evitar caché de contenido sensible.

## Flujo funcional de pedidos

1. El usuario arma carrito en la tienda.
2. En `/checkout` confirma datos de cliente y entrega.
3. Se crea un pedido persistido con token público.
4. El usuario continúa a `/pagos/[token]`.
5. Elige/verifica medio de pago disponible y sube comprobante.
6. El pedido pasa a revisión manual en `/admin/orders`.
7. El admin aprueba o rechaza el pago, y el sistema dispara notificaciones según configuración.

## Despliegue

### Recomendación actual

**Railway** es una opción lógica para este proyecto porque resuelve bien un runtime Node + variables de entorno + conexión a servicios externos.

### Pero ojo con esto

El proyecto tiene muchas rutas con `export const prerender = false`, o sea que usa SSR/on-demand rendering. Según la documentación actual de Astro v5, **cualquier proyecto con páginas server-rendered necesita un adapter para deploy de producción**. Hoy este repo **no trae un adapter de Astro instalado/configurado**.

En otras palabras: para desplegarlo prolijo en Railway primero hay que definir el adapter de runtime (por ejemplo, Node), y recién después cerrar el pipeline de deploy.

### Checklist breve para dejarlo deployable

1. Agregar y configurar un adapter SSR de Astro compatible con Railway.
2. Cargar variables de entorno del entorno objetivo.
3. Usar base remota con `ASTRO_DB_REMOTE_URL` y `ASTRO_DB_APP_TOKEN`.
4. Validar login admin, checkout, `/pagos/[token]` y `/admin/analytics` en staging.
5. Evitar usar una DB remota productiva para smoke tests de `dev:remote`.

## Estructura principal del proyecto

```text
.
├── db/                  # esquema y seed de Astro DB
├── docs/                # notas técnicas y criterios operativos
├── public/              # assets públicos
├── src/
│   ├── actions/         # Astro Actions (auth, productos, pedidos, analytics, settings)
│   ├── components/      # UI de storefront y admin
│   ├── firebase/        # auth, guards y acceso admin
│   ├── layouts/         # layout base
│   ├── pages/           # rutas públicas, checkout, pagos y admin
│   ├── scripts/         # scripts cliente para interactividad puntual
│   ├── services/        # lógica de dominio: pedidos, analytics, notificaciones, data
│   ├── store/           # estado cliente (carrito)
│   ├── styles/          # estilos globales
│   └── utils/           # utilidades transversales
├── astro.config.mjs     # integraciones Astro + aliases
└── package.json         # scripts y dependencias
```

## Notas operativas / troubleshooting

### El admin no abre o redirige raro

- Verificá `PUBLIC_FIREBASE_PROJECT_ID`.
- Verificá que Firebase Auth tenga habilitado email/password.
- Confirmá que el usuario exista en Firebase.
- Confirmá que el correo esté incluido en `ADMIN_ALLOWED_EMAILS`.

### Puedo loguearme pero no ejecutar acciones sensibles

Eso normalmente significa whitelist incompleta en `ADMIN_ALLOWED_EMAILS`.

### No salen emails

- Revisá `RESEND_API_KEY` y `RESEND_FROM_EMAIL`.
- Si usás `RESEND_DEV_TO_OVERRIDE`, todos los correos se redirigen a esa casilla a propósito.

### No salen mensajes de WhatsApp

- Revisá `WHATSAPP_CLOUD_API_TOKEN` y `WHATSAPP_CLOUD_PHONE_NUMBER_ID`.
- Confirmá que `ORDER_NOTIFICATIONS_WHATSAPP_ENABLED=true` si querés envíos reales.

### `dev:remote` toca datos reales

Sí, puede pasar. El repo ya advierte que `dev:remote` escribe contra la base remota configurada. Usá staging o una base separada.

### El deploy SSR no queda listo

No es humo: hoy falta configurar un adapter de Astro para producción. Sin eso, un proyecto con `prerender = false` no queda correctamente desplegable.

## Documentación relacionada

- `docs/data-layer-migration-criteria.md` — criterios actuales para DB remota, staging y validaciones operativas.
