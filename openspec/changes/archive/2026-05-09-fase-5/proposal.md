# Fase 5 — Tech Debt + Angular Control Flow Migration

## Intent

Cerrar la deuda técnica reportada por el verify-report de Fase 4 y modernizar
TODOS los templates Angular al control flow nativo de Angular 17+ (`@if`, `@for`,
`@switch`). El objetivo no es agregar funcionalidad — es elevar la **calidad
estructural** del código antes de dar la prueba por terminada.

Por qué importa esto AHORA:

1. **Confiabilidad de la suite de tests**: un test JWT que falla de forma
   no-determinista contamina la señal de CI y entrena al equipo a ignorar
   fallos. Inaceptable.
2. **Compatibilidad futura**: `jest-preset-angular/setup-jest.js` está deprecado;
   romperse en una bump menor es prevenible hoy con un cambio de una línea.
3. **Contrato de seguridad coherente**: `SecurityConfig` declara una regla para
   `DELETE /api/orders/**` que ningún endpoint expone. Esto es **promesa sin
   implementación** — un olor a diseño que un revisor senior detecta de inmediato.
4. **Best practices Angular 18**: las directivas estructurales (`*ngIf`/`*ngFor`)
   siguen funcionando pero ya NO son la forma idiomática. `@if`/`@for` son más
   rápidos en runtime, no requieren imports y permiten eliminar `CommonModule` y
   los métodos `trackBy` redundantes — menos código, menos superficie, mismo
   comportamiento.

Éxito = (a) suite de tests estable al 100%, (b) endpoint DELETE implementado y
testeado, (c) cero `*ngIf`/`*ngFor`/`*ngSwitch` en todo el código fuente, (d)
cero imports muertos de `CommonModule`/`NgIf`/`NgFor`, (e) cero métodos `trackBy`
huérfanos.

## Scope

### IN-SCOPE

**Track 1 — Tech Debt**

- Estabilizar `JwtServiceTest.isTokenValid_withTamperedSignature_returnsFalse`.
  La causa raíz probable es que tamperar el último char de la firma a veces
  produce una firma válida por colisión Base64URL (1/64 de probabilidad). La fix
  correcta es alterar varios chars o regenerar hasta garantizar diferencia
  detectable, no marcar el test como flaky-tolerant.
- Migrar `frontend/setup-jest.ts` del entrypoint deprecado
  `jest-preset-angular/setup-jest` al recomendado actual
  (`jest-preset-angular/setup-jest` ya está deprecado en v14; el reemplazo es
  importar desde `setup-jest.mjs` o usar el preset declarativo en
  `jest.config`).
- Implementar `DELETE /api/orders/{id}` en `OrderController` con autorización
  ROLE_ADMIN explícita (ya cubierta por `SecurityConfig` pero el endpoint debe
  existir). Incluye:
  - Método `OrderService.deleteOrder(Long id)` (capa application).
  - Método en `OrderRepository` / `OrderJpaRepository` para borrar.
  - Tests de service (mock) + controller (`@WebMvcTest`) cubriendo: 204 admin
    OK, 403 user denied, 404 id inexistente.

**Track 2 — Angular Control Flow Migration**

Migrar las 6 plantillas restantes con sintaxis vieja (Dashboard ya está
migrado parcialmente):

| Componente | `*ngIf` | `*ngFor` | trackBy method | CommonModule import |
|---|---|---|---|---|
| `customer-list.component.ts` | 5 | 1 | `trackById` | sí |
| `customer-form.component.ts` | 3 | 0 | — | sí |
| `order-list.component.ts` | 5 | 2 | `trackById`, `trackByStatus` | sí |
| `order-form.component.ts` | 3 | 1 | `trackById` | sí |
| `order-detail.component.ts` | 3 | 0 | — | sí |
| `login-page.component.ts` | 1 | 0 | — | sí |
| `dashboard.component.ts` | 0 | 0 | — | sí (a remover) |

Reemplazos:

- `*ngIf="x"` → `@if (x) { … }`
- `*ngIf="x; else y"` → `@if (x) { … } @else { … }`
- `*ngIf="x as v"` → `@if (x; as v) { … }`
- `*ngFor="let it of list; trackBy: fn"` → `@for (it of list; track it.id) { … }`
- `*ngFor` sobre array de strings → `@for (s of list; track s) { … }`

Limpieza obligatoria post-migración:

- Remover `CommonModule`, `NgIf`, `NgFor`, `NgSwitch`, `AsyncPipe`, etc. de
  `imports: []` cuando ya no se usen pipes.
- Mantener `CommonModule` SOLO si el template usa pipes como `| date`,
  `| number`, `| currency`. Verificar caso por caso (Dashboard usa `| number` →
  importar solo `DecimalPipe`).
- Eliminar todos los métodos `trackById` / `trackByStatus` de las clases
  componente — la nueva sintaxis `track expr` los hace dead code.
- Actualizar tests si rompen por cambios de árbol de DOM (no deberían — el
  output renderizado es idéntico).

### OUT-OF-SCOPE

- Cambios de comportamiento en endpoints existentes (sólo se agrega DELETE).
- Refactor del layout shell o de los stores (no toca lógica de Signals/RxJS).
- Migración a `@let` o `@defer` (Angular 18) — no es objetivo de esta fase.
- Tests de E2E (no existen en el proyecto y no se introducen acá).
- Bump de versiones de dependencias más allá de lo necesario para fixear el
  entrypoint de Jest.
- Reescritura de `CommonModule` en componentes que SÍ usan pipes válidos.

## Approach

### Track 1 — Tech Debt

**1. Flaky JWT test**

```java
// Antes (flaky — 1/64 chance de colisión Base64URL):
String tamperedSignature = parts[2].substring(0, parts[2].length() - 1) + "X";

// Después (determinista — alterar 8 chars + verificar diferencia):
String original = parts[2];
String tampered = "AAAAAAAA" + original.substring(8);  // o XOR de bytes decodificados
// Garantizar tampered != original antes de assert.
```

Razón: cambiar UN char puede producir una firma equivalente cuando la base64
re-codifica al mismo byte. Cambiar 8 chars al inicio vuelve la colisión
imposible en la práctica.

**2. setup-jest entrypoint**

`jest-preset-angular@14` deprecó el setup imperativo `setup-jest.js`. La
solución recomendada es usar el preset en `jest.config` (ya configurado) y
cambiar el setup file a `setup-jest.mjs`:

```ts
// frontend/setup-jest.ts
import 'jest-preset-angular/setup-jest';  // antes
// →
import 'jest-preset-angular/setup-jest.mjs';  // o equivalente recomendado por v14
```

Verificar la doc oficial de la versión 14.2.4 instalada antes de elegir el path
exacto — la propuesta confirma la dirección, el spec confirmará el string.

**3. DELETE /api/orders/{id}**

```java
@DeleteMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")  // defensa en profundidad además de SecurityConfig
public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
    orderService.deleteOrder(id);
    return ResponseEntity.noContent().build();
}
```

Decisión: usar `204 No Content` (idiomático para DELETE exitoso). 404 lo emite
el service vía `OrderNotFoundException` ya existente. 403 lo emite Spring
Security automáticamente.

### Track 2 — Control Flow Migration

Estrategia: migrar **un componente a la vez**, correr Jest sobre ese
componente, commitear, siguiente. Esto evita perder un fix por un cambio
sintáctico mal copiado en otro archivo.

Orden propuesto (de más simple a más complejo):

1. `dashboard.component.ts` — sólo limpiar `CommonModule` → `DecimalPipe`.
2. `login-page.component.ts` — 1 `*ngIf`.
3. `customer-detail` (si tiene templates reales — actualmente es placeholder).
4. `order-detail.component.ts` — 3 `*ngIf`.
5. `customer-form.component.ts` — 3 `*ngIf`.
6. `order-form.component.ts` — 3 `*ngIf` + 1 `*ngFor` + trackBy.
7. `customer-list.component.ts` — 5 `*ngIf` + 1 `*ngFor` + trackBy.
8. `order-list.component.ts` — 5 `*ngIf` + 2 `*ngFor` + 2 trackBy methods.

Cada migración sigue el patrón:

```html
<!-- antes -->
<div *ngIf="store.loading()">Loading…</div>
<tr *ngFor="let order of store.orders(); trackBy: trackById">…</tr>

<!-- después -->
@if (store.loading()) {
  <div>Loading…</div>
}
@for (order of store.orders(); track order.id) {
  <tr>…</tr>
}
```

Nota sobre `track`: para arrays de strings (e.g. `statuses` en order-list)
usar `track $index` o `track s` directamente — no requiere id.

### Tests

- Backend: agregar `OrderControllerTest` (DELETE happy path + RBAC) y
  `OrderServiceTest.deleteOrder_*`. Estabilizar el test JWT existente sin
  agregar/quitar tests.
- Frontend: los tests existentes deberían seguir pasando porque el DOM
  renderizado es equivalente. Si `getByText`/queries fallan, ajustar selectors —
  NO ajustar la migración para complacer el test viejo.

## Risks / Tradeoffs

1. **Riesgo: imports rotos tras migración**. Quitar `CommonModule` puede romper
   componentes que usen pipes (`date`, `number`, `currency`) que vienen de
   ese módulo. Mitigación: grep por `| date`, `| number`, `| currency`,
   `| async`, `| json`, `| slice` en cada template ANTES de remover el import,
   y reemplazar por imports puntuales (`DatePipe`, `DecimalPipe`, `AsyncPipe`).

2. **Riesgo: tests rotos por cambios de DOM tree**. Aunque el HTML renderizado
   es idéntico, los selectors basados en estructura (`querySelector('div >
   div:nth-child(2)')`) pueden romperse si el bloque `@if` introduce comments
   distintos a `<ng-template>`. Mitigación: usar `getByRole`/`getByText` y
   evitar selectors estructurales — los tests actuales ya siguen este patrón.

3. **Riesgo: track expression incorrecta**. Usar `track $index` cuando hay
   identidad real (id) degrada el rendimiento OnPush por re-renders innecesarios.
   Mitigación: regla — siempre `track item.id` cuando exista, `track item`
   cuando sea primitivo, `track $index` solo como último recurso.

4. **Tradeoff: `@PreAuthorize` vs `SecurityConfig`-only**. Agregar
   `@PreAuthorize("hasRole('ADMIN')")` en el controller es redundante porque
   `SecurityConfig` ya bloquea la ruta. Decisión: **incluirla** como defensa en
   profundidad y para que el contrato sea legible desde el endpoint sin tener
   que abrir SecurityConfig. Costo: un anotación más por endpoint admin.

5. **Riesgo bajo: el fix del JWT test podría enmascarar un bug real de la
   librería**. Mitigación: documentar el cambio con un comentario explicando
   por qué se altera más de un char; dejar el assert sobre `false` intacto.

6. **Tradeoff: orden batch único vs batch incremental para la migración**.
   Hacer todos los componentes en un único PR genera un diff grande pero
   atómico. Recomendación: medir en sdd-tasks; si supera ~400 líneas
   cambiadas, partir en chained PRs por feature (auth → orders → customers →
   shared cleanup).

## Template Migration Inventory

- 7 componentes con templates inline a tocar (1 ya parcialmente migrado).
- 20 ocurrencias de `*ngIf` a reemplazar.
- 4 ocurrencias de `*ngFor` a reemplazar.
- 0 ocurrencias de `*ngSwitch`.
- 4 métodos `trackBy*` a eliminar.
- 7 imports de `CommonModule` a auditar (al menos 6 a remover, 1 a estrechar).
