# Data Layer Migration Criteria

## Remote deploy hardening (Phase 3)

### Runtime/deploy assumptions
- `@astrojs/db` sigue configurado desde `astro.config.mjs` con `db()`; en esta fase NO cambiamos el runtime adapter ni el esquema.
- La conexión remota la resuelve Astro cuando el proceso corre con `--remote` y recibe `ASTRO_DB_REMOTE_URL` + `ASTRO_DB_APP_TOKEN`.
- El script de deploy queda endurecido usando `npm run build` -> `astro build --remote` para evitar builds que dependan de una DB local.
- Para desarrollo local sigue existiendo `npm run dev:local`; para pruebas contra entorno remoto existe `npm run dev:remote`.

### Staging assumptions
- Staging debe inyectar `ASTRO_DB_REMOTE_URL` y `ASTRO_DB_APP_TOKEN` en el entorno de build/runtime.
- `npm run dev:remote` y cualquier smoke con `--remote` persisten cambios en la base remota apuntada por esas variables.
- Por eso, staging debería usar una instancia remota separada de producción o una réplica/libSQL dedicada para validaciones.
- Esta fase NO introduce migraciones ni bootstrap de esquema: se asume que la base remota ya está provisionada y sincronizada.

### Minimal remote validation checklist
- Confirmar que el entorno de staging expone ambas variables requeridas.
- Confirmar que el comando de deploy usa `npm run build` (ahora remoto) o `npm run build:remote`.
- Verificar lectura/escritura básica en staging sin depender de archivos locales SQLite.
- Verificar que no haya scripts CI/CD que sigan invocando `astro build` directo por fuera de `package.json`.

## Initial migration criteria (no DB migration yet)

### Keep Astro DB / libSQL if
- El deploy remoto con `--remote` cubre lecturas y writes operativos sin inconsistencias.
- Las transacciones `BEGIN/COMMIT/ROLLBACK` siguen comportándose igual en staging remoto.
- El volumen y concurrencia del backoffice siguen dentro de límites cómodos de SQLite/libSQL.

### Evaluate Postgres if
- Se necesitan consultas relacionales más complejas, locking/concurrency más robusto o tooling SQL estándar de equipo.
- Aparecen límites prácticos de SQLite/libSQL para analytics, throughput de pedidos o debugging operacional.

### Current known gaps to track
- Falta validar explícitamente en staging remoto el comportamiento transaccional ya introducido en Phase 2.
- `dev:remote` puede impactar datos reales si apunta a producción; requiere disciplina de entorno.
- No hay todavía evidencia documentada de smoke remoto end-to-end en CI/CD.

## Phase 5 verification prep

### Unit coverage added in code
- `src/services/orders/cart-cookie.test.ts`: cubre parsing defensivo de la cookie del carrito para evitar basura/JSON inválido.
- `src/services/orders/payment-proof-compensation.test.ts`: cubre la selección de `resourceType` y qué assets deben compensarse o ignorarse (`inline*`).
- `src/services/analytics/analytics-range.test.ts`: cubre resolución de rango opcional y conversión a ventana UTC del huso horario de negocio.

### Manual integration checklist for transactional flows
> Esta parte requiere smoke manual contra un entorno con DB real. No quedó automatizada en este batch para no introducir tooling nuevo de alto riesgo.

1. Crear pedido nuevo y confirmar que existen `Order`, `OrderItem` y `Payment` consistentes para el mismo `orderId`.
2. Subir comprobante válido y verificar que:
   - se crea exactamente un `PaymentProof`,
   - `Payment.status` pasa a `under_review`,
   - `Order.status` pasa a `under_review`.
3. Aprobar pago y verificar commit atómico de `Order.status=approved` + `Payment.status=approved` + `reviewedAt/reviewerUid`.
4. Rechazar pago en otro pedido y verificar commit atómico de `Order.status=rejected` + `Payment.status=rejected` + `rejectionReason`.
5. Eliminar pedido con comprobante remoto y verificar que:
   - primero desaparecen `PaymentProof`, `Payment`, `OrderItem`, `NotificationLog` y `Order` en DB,
   - luego el cleanup remoto de assets corre fuera de la transacción,
   - si el cleanup remoto falla, el pedido ya NO reaparece en DB.
6. Para un rollback controlado, forzar una falla después del primer write de cada flujo (staging/local instrumentado) y confirmar ausencia de writes parciales.

### Remote deploy and analytics smoke checklist
1. Confirmar variables `ASTRO_DB_REMOTE_URL` y `ASTRO_DB_APP_TOKEN` en staging antes de correr cualquier smoke.
2. Abrir `/admin/analytics` autenticado y verificar que el shell SSR aparece antes de cargar datasets pesados.
3. Confirmar que el dashboard pasa por estados `loading -> success` y que el botón de reintento recupera ante error temporal.
4. Probar un rango válido (`from < to`) y otro inválido (`from >= to`) para confirmar que el fallback no rompe el fetch autenticado.
5. Ejecutar smoke remoto usando el comando de la plataforma equivalente a `npm run build`/`astro build --remote` SIN build local de SQLite.

### Turso vs Postgres decision criteria

#### Keep libSQL / Turso path if
- El smoke remoto confirma transacciones consistentes y sin writes parciales en create/review/upload/delete.
- `/admin/analytics` mantiene shell inmediata y datasets diferidos sin timeouts operativos.
- El equipo acepta seguir operando con gaps SQLite/libSQL conocidos (locking, SQL dialect, tooling limitado) porque el throughput actual lo tolera.

#### Escalate to Postgres evaluation if
- Aparecen rollbacks inconsistentes o diferencias reales entre local/staging remoto.
- El backoffice necesita debugging SQL, observabilidad o concurrencia que SQLite/libSQL no resuelve cómodamente.
- Los queries analíticos o flujos administrativos empiezan a exigir joins/reporting/locking más sofisticados.

### SQLite/libSQL gaps to keep visible
- `BEGIN/COMMIT/ROLLBACK` ya están encapsulados, pero todavía falta evidencia manual documentada en remoto.
- Cloudinary cleanup post-commit sigue siendo compensación best-effort: protege integridad DB, no garantiza cleanup remoto perfecto.
- El proyecto tiene tests unitarios en archivos `*.test.ts`, pero todavía no hay comando de test oficialmente cableado en `package.json` para ejecutarlos de forma estándar en todos los entornos.
