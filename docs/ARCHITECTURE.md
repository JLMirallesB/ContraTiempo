# Arquitectura - ContraTiempo

## Vision General

Aplicacion para gestionar horarios de conservatorios de musica. Tres targets de distribucion comparten el mismo codigo React:

| Target | Como llega al usuario | Acceso a disco | Sync con MCP |
|--------|----------------------|----------------|--------------|
| **GitHub Pages (PWA)** | URL web, instalable | No (import/export manual) | Manual |
| **Tauri** (futuro) | .dmg/.exe descargable | Si (auto-sync) | Automatico |
| **MCP Server** | Claude Desktop / Claude Code | Si (JSON directo) | Es el MCP |

## Diagrama del Sistema

```
┌─────────────────────────────────────────────────────┐
│                   Navegador / Tauri                   │
│                                                       │
│  ┌──────────┐  ┌─────────────────────┐  ┌─────────┐ │
│  │ Sidebar  │  │    Content Area     │  │ Franja  │ │
│  │          │  │                     │  │ Panel   │ │
│  │ Logo     │  │  Vista activa:      │  │         │ │
│  │ Scenario │  │  General/Aula/      │  │ Crear/  │ │
│  │ Nav (7)  │  │  Docente/Asig/      │  │ Editar  │ │
│  │ SubItems │  │  Valid/Herram/       │  │ franjas │ │
│  │ Credits  │  │  Config             │  │         │ │
│  └──────────┘  └─────────────────────┘  └─────────┘ │
│                                                       │
│  ┌─ Zustand Store ──────────────────────────────────┐ │
│  │ datos maestros + escenarios + UI state           │ │
│  └──────────────────────┬───────────────────────────┘ │
│                         │                             │
│              ┌──────────┴──────────┐                  │
│              │  localStorage       │                  │
│              │  (contratiempo-     │                  │
│              │   storage, v1)      │                  │
│              └─────────────────────┘                  │
└───────────────────────┬───────────────────────────────┘
                        │ Export/Import JSON
                        ▼
              ~/.contratiempo/data.json  (SyncData v2)
                        ▲
                        │ Lee/escribe (atomico)
┌───────────────────────┴───────────────────────────────┐
│              MCP Server (stdio)                        │
│  30 tools: CRUD + Escenarios + Consultas              │
│  Usado por: Claude Desktop, Claude Code               │
└───────────────────────────────────────────────────────┘
```

## Codigo Compartido (shared/)

Para evitar duplicar tipos y logica entre la app React y el MCP server, el directorio `shared/` contiene:

- **shared/types.ts** — Todas las interfaces de dominio (Aula, Docente, Asignatura, TipoOcupacion, Escenario, Franja, etc.). La app React re-exporta desde `src/types/index.ts` y añade tipos solo-UI.
- **shared/timeUtils.ts** — Funciones puras de tiempo (horaAMinutos, seSolapan, formatearDuracion, etc.). La app re-exporta desde `src/services/timeUtils.ts`.
- **shared/sync.ts** — SyncData interface (version 2), funciones de validacion y creacion de datos vacios.

Ambos tsconfigs (app y MCP) incluyen `shared/` en su compilacion.

## Store (Zustand + Immer + Persist)

```
useAppStore
├── Datos Maestros (compartidos entre escenarios)
│   ├── aulas: Aula[]
│   ├── docentes: Docente[]
│   ├── asignaturas: Asignatura[]
│   └── tiposOcupacion: TipoOcupacion[]
├── Escenarios
│   ├── escenarios: Escenario[]
│   └── escenarioActivoId: string
├── UI - Navegacion
│   ├── vistaActual: VistaId
│   └── filtros: { aulaId?, docenteId?, asignaturaId?, sede?, piso?, aulasSeleccionadas? }
├── UI - Cuadricula
│   ├── modoVistaCuadricula: 'dias-aulas' | 'aulas-dias'
│   ├── granularidadVista: 30 | 60
│   └── diaSeleccionado: DiaSemana
├── UI - Panel Lateral
│   ├── panelFranjaAbierto: boolean
│   ├── franjaEditandoId: string | null
│   └── panelPrellenado: { dia?, horaInicio?, aulaId? } | null
├── Acciones CRUD (add/update/remove × entidad)
├── Acciones Escenario (add/update/remove/duplicar/setActivo)
├── Acciones Franja (add/update/remove en escenario activo)
└── Acciones UI (setVista, setFiltros, setModoVista, setGranularidad, etc.)

Selectores derivados:
├── useEscenarioActivo() → Escenario
└── useFranjasActivas() → Franja[]
```

## Modelo de Datos

### Relaciones

```
Aula (1) ──── (N) FranjaClase (aulaId obligatorio)
Aula (1) ──── (N) FranjaOcupacion (aulaId opcional)
Docente (1) ─ (N) Franja (todas tienen docenteId)
Asignatura (1) (N) FranjaClase
TipoOcupacion (1) (N) FranjaOcupacion
Escenario (1) (N) Franja
```

### Entidades Maestras (shared/types.ts)

| Entidad | Campos clave | Notas |
|---------|-------------|-------|
| Aula | id, codigo, nombre, tipo, capacidad, sede, piso, atributos[], reservable, gestionadaPor, observaciones | 15 campos total, autocompletado sede/piso/tipo |
| Docente | id, nombre, especialidad, horasContratadas, disponibilidad?, departamento? | Disponibilidad = soft constraint (aviso) |
| Asignatura | id, nombre, alias, ratio, turnosSemanales (1-3), duracionTurno (min), atributosRequeridos[] | Alias para compatibilidad Excel |
| TipoOcupacion | id, nombre, requiereAula, esLectiva | Con/sin aula |

### SyncData (shared/sync.ts)

Formato JSON que sirve de puente entre app, Tauri y MCP:

```typescript
{ version: 2, lastModified: ISO string, escenarioActivoId, aulas[], docentes[], asignaturas[], tiposOcupacion[], escenarios[] }
```

Archivo en disco: `~/.contratiempo/data.json`. Conflicto: last-write-wins via lastModified.

## Cuadricula

### Dos modos de vista
- **Dias>Aulas**: tabs L/M/X/J/V, columnas = aulas filtradas por sede/piso
- **Aulas>Dias**: columnas agrupadas [Aula: L|M|X|J|V]

### Granularidad
- 30 min: cada fila = 30 min, franjas con rowspan
- 1 hora: cada fila = 1h, franjas de 30 min compactas

### Drag & Drop (@dnd-kit)
- FranjaCard: useDraggable + grip handle
- DroppableCell: useDroppable + highlight
- DragOverlay: preview flotante
- On drop: preserva duracion, actualiza dia/hora/aula
- PointerSensor distance: 5

### Panel lateral (FranjaPanel)
- Click celda vacia → crear con prellenado (dia, hora, aula)
- Click franja → editar
- Toggle Clase/Ocupacion
- Muestra hora fin calculada

## Validaciones y Herramientas

| Servicio | Funcion | Tipo |
|----------|---------|------|
| conflictDetector | detectarConflictos() | Errores: solapamiento aula, docente duplicado |
| hoursCalculator | calcularHorasDocentes() | Datos: horas por docente |
| hoursCalculator | generarAvisosHoras() | Avisos: exceso/faltan horas, huecos |
| capacityCalculator | calcularCapacidadAsignaturas() | Datos: franjas × ratio |
| gapFinder | buscarHuecosAulas() | Huecos libres en aulas |
| gapFinder | buscarHuecosCombinados() | Huecos docente+aula libres |

## Excel Import/Export

| Funcion | Formato | Comportamiento |
|---------|---------|---------------|
| exportar[Entidad] | .xlsx individual | Columnas legibles en español |
| importar[Entidad] | .xlsx individual | AÑADE a datos existentes |
| exportarEscenario | .xlsx multi-hoja | Franjas con nombres + metadata |
| exportarBackupTotal | .xlsx completo | Datos maestros + escenarios con IDs |
| importarBackupTotal | .xlsx completo | REEMPLAZA todo el estado |

Sync JSON: exportJSON/importJSON via File System Access API o Tauri filesystem.

## MCP Server

Paquete independiente en `mcp-server/`. Usa @modelcontextprotocol/sdk con StdioServerTransport.

### 30 Tools

**CRUD (crudTools.ts, 16):** listar/crear/actualizar/eliminar × {aulas, docentes, asignaturas, ocupaciones}. Todas buscan por nombre o ID.

**Escenarios (scenarioTools.ts, 9):** listar_escenarios, crear_escenario, duplicar_escenario, activar_escenario, listar_franjas (filtros: dia, docente, aula), crear_franja_clase, crear_franja_ocupacion, eliminar_franja.

**Consultas (queryTools.ts, 5):** ver_horario_docente, ver_horario_aula, validar_horario (errores+avisos), buscar_huecos (aula/docente/duracion), resumen_horas_docentes (tabla).

### Storage
Lee/escribe `~/.contratiempo/data.json`. Escritura atomica (tmp → rename). Crea directorio si no existe.

## PWA

- **manifest.json**: standalone, theme #1e40af, scope /ContraTiempo/, iconos 192+512
- **sw.js**: network-first para navegacion, cache-first para assets, limpieza de caches antiguos
- **PWAUpdatePrompt.tsx**: registra SW, detecta nuevas versiones, toast "Nueva version disponible" con boton Actualizar, recarga al activar nuevo worker
- Solo activo en navegador (isBrowser()), no en Tauri

## Deteccion de Entorno

`src/lib/environment.ts` detecta si la app corre en Tauri o navegador:
- `isTauri()`: busca `__TAURI__` o `__TAURI_INTERNALS__` en window
- `isBrowser()`: negacion de isTauri
- Usado por: fileSync factory, PWAUpdatePrompt, sidebar badge

## Decisiones de Diseno

| Decision | Alternativa | Razon |
|----------|-------------|-------|
| Zustand + Immer | Redux, Context | Menos boilerplate, persist nativo |
| Store unico | Multiples stores | Datos maestros compartidos entre escenarios |
| shared/ directory | Copiar tipos | Unica fuente de verdad app + MCP |
| "HH:mm" strings | Date, timestamp | Simple, sin timezone |
| UUID v4 | Autoincrement | Sin servidor, sin colisiones |
| @dnd-kit | react-beautiful-dnd | Moderno, accesible, activo |
| SW manual | vite-plugin-pwa | Plugin no soporta Vite 8 |
| SyncData v2 | localStorage directo | Formato compartible MCP/Tauri/browser |
| Escritura atomica | writeFile directo | Previene lecturas parciales por file watcher |
| color-scheme: light | Dark mode | Simplifica UI |

## Guia para Nuevas Funcionalidades

1. **Nuevo tipo de dato**: añadir a `shared/types.ts`, actualizar store, actualizar SyncData si persiste
2. **Nueva accion store**: añadir a AppActions + implementacion en useAppStore.ts
3. **Nuevo servicio**: crear en `src/services/` (o `shared/` si lo usa el MCP)
4. **Nueva vista**: crear en `components/views/`, conectar en MainLayout.tsx, añadir a Sidebar NavItems
5. **Nuevo CRUD**: crear en `components/masters/`, añadir tab en VistaConfig.tsx
6. **Nueva herramienta**: añadir tab en VistaHerramientas.tsx
7. **Nueva validacion**: añadir en validators/, conectar en VistaValidaciones.tsx
8. **Nueva tool MCP**: añadir en mcp-server/src/ (crudTools, scenarioTools o queryTools), registrar en index.ts

## Pendiente

- **Tauri**: wrapper desktop con filesystem access + file watcher (requiere Rust toolchain)
- **i18n**: react-i18next preparado, falta implementar strings
- **Responsive**: adaptacion movil
- **Undo/redo**
- **Validaciones**: atributos aula requeridos, disponibilidad docente, turnos faltantes
- **Import/export app externa**: formato a definir por usuario
