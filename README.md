# Pollería Medileny

Sistema de punto de venta (POS) y ERP para Pollería Medileny: ventas, caja, inventario con recetas, cocina en tiempo real y reportes. Diseñado primero para móvil y con la meta de poder vender sin internet.

## Stack

| Capa         | Tecnología                                                                  |
| ------------ | --------------------------------------------------------------------------- |
| Backend      | Laravel 13, PHP 8.5, Fortify (inicio de sesión y verificación en dos pasos) |
| Frontend     | React 19, Inertia 3, TypeScript, Tailwind CSS 4, shadcn/ui                  |
| Permisos     | spatie/laravel-permission (administrador, cajero, mozo, cocina)             |
| Traducciones | laravel-lang (es)                                                           |
| Pruebas      | Pest 5                                                                      |
| Calidad      | Vite+ (`vp check`: lint y formato), TypeScript estricto                     |

## Requisitos

- PHP 8.5 y Composer
- Node 22 o superior y pnpm

## Instalación

```bash
composer install
pnpm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
pnpm build
php artisan serve
```

En desarrollo, `pnpm dev` levanta Vite con recarga en caliente.

`php artisan db:seed` (y el despliegue) crea, en cualquier entorno, las tres sucursales (Cajamarca, Baños del Inca y Bambamarca), el equipo de ejemplo, las zonas y mesas, y la carta con precios de demostración. Es **idempotente y no destructivo**: solo agrega lo que falta y nunca pisa lo que ya editaste (precios, nombres, contraseñas, capacidades). Las cuentas de ejemplo usan la contraseña `Medileny2026!`, que puedes cambiar con la variable `SEED_PASSWORD` antes de sembrar:

| Persona                  | Correo                   | Rol               | Sucursal       |
| ------------------------ | ------------------------ | ----------------- | -------------- |
| Medileny Quispe Ramos    | `medileny@medileny.test` | Administrador     | Cajamarca      |
| Rosa Huamán Pariona      | `rosa@medileny.test`     | Cajero            | Cajamarca      |
| Luis Paredes Soto        | `luis@medileny.test`     | Cajero            | Cajamarca      |
| Carlos Mendoza Ríos      | `carlos@medileny.test`   | Mozo              | Cajamarca      |
| Lucía Flores Cáceres     | `lucia@medileny.test`    | Mozo              | Cajamarca      |
| Jhon Chávez Llamocca     | `jhon@medileny.test`     | Mozo              | Cajamarca      |
| Pedro Salazar Quiroz     | `pedro@medileny.test`    | Cocina            | Cajamarca      |
| Marisol Vega Tello       | `marisol@medileny.test`  | Cocina            | Cajamarca      |
| Ana Quispe Ramos         | `ana@medileny.test`      | Cajero            | Baños del Inca |
| Diego Castillo Vargas    | `diego@medileny.test`    | Mozo              | Baños del Inca |
| Elena Rojas Mamani       | `elena@medileny.test`    | Cocina            | Baños del Inca |
| Hilda Tello Cueva        | `hilda@medileny.test`    | Cajero            | Bambamarca     |
| Segundo Cueva Bustamante | `segundo@medileny.test`  | Mozo              | Bambamarca     |
| Nelly Bustamante Díaz    | `nelly@medileny.test`    | Cocina            | Bambamarca     |
| Kevin Torres Alva        | `kevin@medileny.test`    | Mozo (sin acceso) | Cajamarca      |

Los usuarios nuevos se crean desde la pantalla Equipo. Para un acceso de emergencia existe `php artisan app:create-admin`.

## Roles

| Rol           | Uso                                                      |
| ------------- | -------------------------------------------------------- |
| Administrador | Configuración, catálogo, inventario, reportes y usuarios |
| Cajero        | Cobros, apertura y cierre de caja                        |
| Mozo          | Toma de pedidos desde el celular                         |
| Cocina        | Pantalla de pedidos en preparación                       |

No hay registro público: el administrador crea a los usuarios desde **Equipo**.

Los permisos (`App\Enums\Permission`) se asignan a cada rol en `RoleSeeder` con `spatie/laravel-permission`. El código siempre pregunta por permisos (`$user->can('sales.void')`, `can('sales.void')` en React), nunca por nombres de rol.

## Carta

Categorías, productos y presentaciones con precio (por ejemplo, pollo entero, 1/2, 1/4 y 1/8). El seeder carga una carta de ejemplo con **precios de demostración**: edítalos desde la pantalla Carta. Los productos se pueden marcar como agotados con un toque. Mientras no haya fotos, cada producto muestra el ícono de su categoría (`products.image_path` queda listo para las imágenes reales).

## Salón, mesas y pedidos

- **Zonas y mesas** (`Salón`, solo administrador): cada sucursal tiene sus zonas (primer piso, segundo piso, terraza…) y mesas con su capacidad (2, 3, 4… hasta la familiar de 10). Las zonas y mesas se archivan, no se borran; cada mozo solo ve las de su sucursal.
- **Mesas** (`sales.create`): plano por zonas con el estado de cada mesa. Se tocan una o varias mesas libres para **unirlas** en una sola cuenta y se toma el pedido. Cada mesa ocupada muestra el tiempo desde el último pedido, con color según los umbrales de la sucursal (`warn_after_minutes` y `alert_after_minutes`, 15 y 25 por defecto; una pantalla de ajustes vendrá después).
- **Cuenta abierta**: un pedido es una cuenta que agrupa **tandas**. Se pueden agregar platos o bebidas después y cada tanda guarda su hora y su autor. Deshacer anula solo esa tanda; si era la única, la cuenta se anula y libera sus mesas.
- **Para llevar** puede ocupar una mesa (el cliente espera sentado) o ir sin mesa; **delivery** pide nombre, teléfono y dirección (costos, distancia y recargos vendrán después).
- Cada plato guarda una copia del nombre y el precio, así que cambiar la carta no altera cuentas anteriores.
- **Cambios de pedido**: los platos de cocina se pueden quitar durante la ventana de cambios de la sucursal (`change_window_minutes`, 10 minutos por defecto). Las bebidas (categorías con `needs_kitchen = false`) se pueden cambiar hasta que se entregan. El mozo marca lo **entregado**; una vez entregado, solo quien tenga `sales.void` (administrador) puede anularlo. Cualquier mozo de la sucursal puede atender un cambio.
- **Cambiar o juntar mesas**: la cuenta pasa a otras mesas libres o suma más. Un pedido para llevar puede **liberar la mesa** cuando el cliente ya recibió su pedido (la cuenta sigue abierta).
- **Cancelar la cuenta**: solo mientras todo se pueda cambiar; después, el administrador. Cancelar una cuenta libera sus mesas, y **Deshacer** la reabre si las mesas siguen libres.
- El cliente genera un `client_id` único por tanda: reenviarla no la duplica (base para vender sin internet).
- La numeración es por sucursal y por día. El autor puede anular su tanda durante 10 minutos; después solo quien tenga `sales.void` (administrador).

## Caja y cobros

- **Caja** (`cash.open`, `cash.close`): una caja abierta por sucursal. Se abre con el efectivo inicial y se cierra contando el efectivo; el sistema calcula lo esperado (inicial + cobros en efectivo) y guarda la diferencia. Mientras la caja está cerrada no se puede cobrar.
- **Cobrar** (`sales.charge`, cajero y administrador): efectivo con vuelto, Yape, Plin y tarjeta, con **pagos divididos o parciales**. Al cubrir el total la cuenta queda pagada y sus mesas se liberan. Cada cobro guarda el efectivo recibido, el vuelto y el número de operación (opcional).
- **Deshacer**: el cobro se puede anular (el autor durante 10 minutos, el administrador siempre mientras la caja siga abierta); la cuenta se reabre si sus mesas siguen libres. Abrir y cerrar la caja también se deshacen. Una cuenta con cobros no se puede cancelar ni cambiar hasta anular el cobro.
- **Comprobante**: nota de venta imprimible (no es comprobante electrónico; la facturación SUNAT llegará después).
- El cliente genera un `client_id` por cobro, así que reenviarlo no lo duplica.

## Cocina

- **Pantalla Cocina** (`kitchen.view`, cocina y administrador): recibe cada tanda con sus platos y notas. Solo llegan los platos que pasan por cocina; las bebidas (categorías con `needs_kitchen = false`) no.
- **Pasos con control de horas**: Nuevo → **Recibido** → **Preparando** → **Listo** → **Entregado al mozo**. Cada paso guarda su hora y quién lo hizo; solo se avanza o retrocede de a un paso. Cada toque pide confirmación y se puede deshacer.
- **Pestañas** Por preparar, Preparando, Listos y Entregados (visibles una hora). Los pedidos anulados que cocina ya había recibido aparecen en rojo como «ANULADO · no preparar» durante 15 minutos. La pantalla se actualiza sola cada pocos segundos.
- **El mozo lo ve**: cada mesa muestra «Cocina: Preparando / Listo…» en el plano y cada tanda de la cuenta muestra la línea de tiempo de cocina.
- **La ventana de cambios usa la cocina real**: se cuenta desde que cocina empieza a preparar (o desde el envío si aún no empieza) y se **bloquea cuando el pedido está listo**. Si cocina retrocede el paso, vuelve a poder cambiarse.

## Tiempo real

Todo se actualiza sin recargar mediante **Laravel Reverb** (WebSockets) y **colas**. Los servicios emiten dos eventos que se difunden desde la cola, después de confirmar la transacción:

| Evento                 | Canal privado                               | Quién lo escucha                              |
| ---------------------- | ------------------------------------------- | --------------------------------------------- |
| `FloorChanged`         | `branch.{id}.floor` y `branch.{id}.cash`    | Mozos, cajeros y administrador de la sucursal |
| `KitchenTicketChanged` | `branch.{id}.kitchen` y `branch.{id}.floor` | Cocina, y los mozos para el estado «Listo»    |

Los canales solo los autoriza quien tiene el permiso y pertenece a esa sucursal. Los eventos no llevan montos.

**Avisos sonoros** (generados en el navegador, sin archivos): pedido nuevo en cocina, pedido o plato anulado, y «pedido listo» para el mozo que tomó el pedido. El botón del altavoz los silencia, y el punto de la barra superior muestra si hay conexión en vivo. Los navegadores exigen un toque en la pantalla antes de reproducir sonido; mientras falta, el altavoz muestra un punto amarillo. Si se pierde la conexión, la pantalla se actualiza igual con un sondeo lento y se recarga al reconectar.

**En local**: `composer dev` levanta el servidor, la cola, Reverb y Vite. Si tu `.env` trae `BROADCAST_CONNECTION=log`, en entorno `local` se usa Reverb igualmente. Sin cola corriendo (`queue:work`) los avisos no salen.

**Sin WebSockets** (por ejemplo, en Laravel Cloud sin el recurso _WebSockets_) el tiempo real queda apagado: la aplicación no intenta conectarse, el punto de la barra superior sale gris y las pantallas se actualizan solas cada 20–30 segundos. Se activa en cuanto el build tiene `VITE_REVERB_APP_KEY` (en desarrollo siempre está activo).

## Despliegue en Laravel Cloud

1. **Aplicación**: conecta el repositorio de GitHub. Cloud soporta PHP 8.5.
2. **Base de datos: SQLite (por ahora)**. Define `DB_CONNECTION=sqlite`. El disco de Cloud es temporal: **cada despliegue o reinicio empieza con la base vacía**. Por eso el despliegue vuelve a sembrar el equipo, las mesas y la carta, pero **lo que se opere en la app (pedidos, cobros, cambios hechos en pantalla) se pierde** al reiniciar. Es válido para mostrar el sistema; para operar de verdad hay que pasar a MySQL o Postgres (las migraciones y las pruebas de cobros, cocina y cambios se verificaron en MySQL 8.4).
3. **WebSockets**: agrega el recurso _WebSockets_; es un Reverb administrado y no hace falta correr `reverb:start`. Cloud inyecta `REVERB_*` y `VITE_REVERB_*`. Como las `VITE_` quedan dentro del build, confirma en el primer despliegue que el punto «en vivo» se pone verde.
4. **Cola**: con SQLite y una sola instancia usa `QUEUE_CONNECTION=sync`; así no hace falta un worker aparte y los avisos salen en la misma petición. Al pasar a MySQL o Postgres cambia a `QUEUE_CONNECTION=database` y crea un proceso `php artisan queue:work --tries=3`. Una cola administrada de Cloud exige `composer require aws/aws-sdk-php` y atiende un único nombre de cola (esta app usa solo `default`).
5. **Variables**: `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL`, `APP_KEY`, `DB_CONNECTION=sqlite`, `BROADCAST_CONNECTION=reverb`, `QUEUE_CONNECTION=sync`, `SESSION_DRIVER=database`, `CACHE_STORE=database`. `SEED_PASSWORD` es opcional: sin ella, las cuentas de ejemplo usan `Medileny2026!`.
6. **Comando de build** (Cloud usa npm por defecto): `composer install --no-dev --optimize-autoloader && npm install -g pnpm && pnpm install && pnpm run build`.
7. **Comando de despliegue**: `touch database/database.sqlite && php artisan migrate --force --seed && php artisan optimize`.
8. **Primer acceso**: `medileny@medileny.test` (administradora) con la contraseña `Medileny2026!` (o la de `SEED_PASSWORD`, si la definiste). Cámbiala desde Ajustes > Seguridad.

La app confía en el proxy de Cloud y fuerza HTTPS en producción.

## Arquitectura

La lógica vive en capas con una sola responsabilidad cada una:

| Capa          | Ubicación                 | Responsabilidad                                                                    |
| ------------- | ------------------------- | ---------------------------------------------------------------------------------- |
| Rutas         | `routes/`                 | Mapear URL a controlador y aplicar middleware                                      |
| Controladores | `app/Http/Controllers`    | Delgados: reciben la petición, llaman a un servicio y devuelven la respuesta       |
| Validación    | `app/Http/Requests`       | Reglas y autorización de cada formulario                                           |
| Servicios     | `app/Services`            | Reglas de negocio (ventas, caja, inventario); reutilizables desde la web o una API |
| Modelos       | `app/Models`              | Relaciones, casts y consultas; sin lógica de negocio                               |
| Enums         | `app/Enums`               | Valores cerrados del dominio (roles, estados)                                      |
| Políticas     | `app/Policies`            | Quién puede hacer qué sobre cada recurso                                           |
| Páginas       | `resources/js/pages`      | Una por ruta Inertia                                                               |
| Componentes   | `resources/js/components` | Piezas reutilizables; `ui/` es shadcn y `brand/` la identidad                      |

Convenciones de interfaz: toda acción que cambia datos pide **confirmación** (`useConfirm`), informa con un **toast de promesa** de Sonner (cargando, éxito, error) y ofrece **Deshacer** cuando se puede revertir. En formularios se usa `useConfirmedForm`; en botones sueltos, `useConfirmedAction`. Las acciones irreversibles (cambiar la contraseña, desactivar la verificación en dos pasos) lo dicen en la confirmación y no muestran Deshacer.

Convenciones: sin comentarios en el código (los nombres deben explicarse solos), dinero siempre en céntimos enteros y todo texto visible en español.

## Comandos útiles

```bash
php artisan test        # pruebas
vendor/bin/pint         # estilo de PHP
vendor/bin/phpstan analyse --memory-limit=1G
pnpm check              # lint y formato
pnpm types:check        # tipos de TypeScript
```

## Hoja de ruta

1. **Base y diseño** — roles, sucursales, tema de la marca, diseño móvil. _(en curso)_
2. **Catálogo e inventario** — productos, combos, insumos y recetas.
3. **POS sin internet** — pedidos, cobro, caja y sincronización (PWA con base local).
4. **Cocina y reportes** — pantalla en tiempo real y gráficos de ventas.
5. **Impresión y comprobantes electrónicos SUNAT.**

## Roles y ajustes

Cada rol entra directo a lo suyo al iniciar sesión: el **mozo** a Mesas, **caja** a Caja, **cocina** a Cocina y la **administración** a Inicio. El dashboard muestra a cada uno lo que necesita (la cocina ve su cola; el mozo, sus pedidos y lo que está listo; solo quien cobra ve dinero).

En **Ajustes** cada persona ve su perfil, su rol y permisos, la seguridad, el tema y los avisos sonoros. La administración tiene además la pestaña **Sucursal** (permiso `branch.manage`) para editar los datos del local y los tiempos de aviso, alerta y ventana de cambios. Los permisos de cada rol se vuelven a sincronizar en cada despliegue (`RoleSeeder`), así que un permiso nuevo llega solo.
