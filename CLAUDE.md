# ContraTiempo

Gestor de horarios de conservatorio de musica. PWA desplegada en GitHub Pages + MCP Server para integracion con IA.
Repo: https://github.com/JLMirallesB/ContraTiempo
Web: https://jlmirallesb.github.io/ContraTiempo/

## Stack

| Capa | Tecnologia |
|------|-----------|
| Framework | React 19 + TypeScript (strict) |
| Build | Vite 8 + @tailwindcss/vite |
| Estado | Zustand 5 + Immer + persist middleware (localStorage) |
| UI | Tailwind CSS 4 + lucide-react + clsx/tailwind-merge |
| Drag & Drop | @dnd-kit/core + sortable + utilities |
| Excel | SheetJS (xlsx) |
| PWA | Service worker manual + manifest.json |
| MCP | @modelcontextprotocol/sdk (paquete separado en mcp-server/) |
| Deploy | GitHub Actions → GitHub Pages |

**No usado:** react-router-dom (instalado pero la app usa view-switching via Zustand), react-i18next (preparado, strings hardcoded en español).

## Comandos

```bash
# App web
npm run dev          # Vite dev server, puerto 5173, base /ContraTiempo/
npm run build        # tsc -b && vite build → dist/
npm run preview      # Preview del build

# Tauri (app escritorio)
npm run tauri:dev    # Abre ventana nativa (requiere npm run dev en paralelo)
npm run tauri:build  # Genera .dmg/.exe

# MCP Server
cd mcp-server
npm install          # Solo la primera vez
npm run build        # tsc → build/
npm run dev          # Ejecutar con tsx (desarrollo)
```

## Estructura del Proyecto

```
ContraTiempo/
├── shared/                           # Codigo compartido (app + MCP server)
│   ├── types.ts                      # Tipos de dominio (Aula, Docente, Franja, etc.)
│   ├── timeUtils.ts                  # Funciones puras de tiempo ("HH:mm")
│   └── sync.ts                       # SyncData interface + validacion
├── src/                              # App React
│   ├── types/index.ts                # Re-exporta shared/types + tipos solo-UI
│   ├── stores/useAppStore.ts         # Store Zustand unico
│   ├── lib/
│   │   ├── utils.ts                  # cn() helper CSS
│   │   └── environment.ts            # isTauri(), isBrowser()
│   ├── services/
│   │   ├── timeUtils.ts              # Re-exporta shared/timeUtils
│   │   ├── syncSchema.ts             # stateToSyncData(), syncDataToState()
│   │   ├── fileSync.ts               # Factory sync segun entorno
│   │   ├── fileSyncBrowser.ts        # Sync via File System Access API
│   │   ├── fileSyncTauri.ts          # Sync via Tauri filesystem (placeholder)
│   │   ├── validators/
│   │   │   ├── conflictDetector.ts   # Solapamientos aula/docente
│   │   │   ├── hoursCalculator.ts    # Horas docente + huecos entre clases
│   │   │   ├── capacityCalculator.ts # Capacidad alumnado por asignatura
│   │   │   └── gapFinder.ts          # Huecos libres (aula, docente+aula)
│   │   └── excel/
│   │       ├── excelExporter.ts      # 6 funciones exportacion
│   │       └── excelImporter.ts      # 5 funciones importacion
│   ├── hooks/
│   │   ├── useFilteredAulas.ts       # Filtrar aulas por sede/piso/seleccion
│   │   └── useGridColumns.ts         # Columnas segun modo vista
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx           # Nav + escenario + creditos (logo, ko-fi, repo)
│   │   │   └── MainLayout.tsx        # Sidebar + content + FranjaPanel condicional
│   │   ├── views/
│   │   │   ├── VistaGeneral.tsx      # Cuadricula principal + toolbar
│   │   │   ├── VistaConfig.tsx       # 7 tabs: Aulas/Docentes/Asignaturas/Ocupaciones/Escenarios/Comparar/Import-Export
│   │   │   ├── VistaAula.tsx         # WeekGrid filtrado por aula
│   │   │   ├── VistaDocente.tsx      # WeekGrid + tarjetas resumen horas
│   │   │   ├── VistaAsignatura.tsx   # Tabla franjas + capacidad + desglose docente
│   │   │   ├── VistaValidaciones.tsx # Errores/avisos con contadores
│   │   │   ├── VistaHerramientas.tsx # 3 tabs: Horas/Capacidad/Buscador huecos
│   │   │   └── VistaImportExport.tsx # Excel + JSON sync
│   │   ├── masters/                  # CRUD: AulasManager, DocentesManager, AsignaturasManager, OcupacionesManager
│   │   ├── grid/
│   │   │   ├── ScheduleGrid.tsx      # Cuadricula con DnD, 2 modos, 2 granularidades
│   │   │   ├── WeekGrid.tsx          # Cuadricula semanal reutilizable (L-V) con DnD
│   │   │   ├── GridToolbar.tsx       # Modo vista, granularidad, filtros, tabs dias
│   │   │   ├── FranjaCard.tsx        # Tarjeta draggable (clase=azul, ocupacion=ambar)
│   │   │   ├── DroppableCell.tsx     # Celda receptora de drop
│   │   │   └── FranjaPanel.tsx       # Panel lateral crear/editar franjas
│   │   ├── scenarios/
│   │   │   ├── ScenarioManager.tsx   # CRUD escenarios (crear/renombrar/duplicar/eliminar)
│   │   │   └── ScenarioComparator.tsx# Comparar diferencias entre escenarios
│   │   └── ui/
│   │       └── PWAUpdatePrompt.tsx   # Toast "Nueva version disponible"
│   └── index.css                     # Tailwind + tema + color-scheme: light
├── mcp-server/                       # MCP Server (paquete independiente)
│   ├── package.json                  # @contratiempo/mcp-server
│   ├── tsconfig.json                 # rootDir: .., incluye ../shared
│   └── src/
│       ├── index.ts                  # Entry point: McpServer + StdioTransport
│       ├── storage.ts                # Lee/escribe ~/.contratiempo/data.json (atomico)
│       ├── crudTools.ts              # 16 tools CRUD (4 x entidad)
│       ├── scenarioTools.ts          # 9 tools (escenarios + franjas)
│       └── queryTools.ts             # 5 tools consulta
├── public/
│   ├── icon.png                      # Icono app (original 1024x1024)
│   ├── pwa-192x192.png              # Icono PWA
│   ├── pwa-512x512.png              # Icono PWA
│   ├── manifest.json                 # PWA manifest
│   └── sw.js                         # Service worker
├── .github/workflows/deploy.yml      # CI/CD → GitHub Pages
├── CLAUDE.md                         # Este archivo
└── docs/ARCHITECTURE.md              # Arquitectura detallada
```

## Path Aliases

- `@/` → `src/` (vite.config.ts + tsconfig.app.json)
- `shared/` incluido en tsconfig.app.json (include) y mcp-server/tsconfig.json

## Modelo de Datos Completo

Definido en `shared/types.ts`. Compartido entre app y MCP server.

### Entidades maestras (compartidas entre escenarios)

**Aula** (15 campos): id, codigo, nombre, tipo, capacidad, descripcion, atributos[], sede, piso, reservable ('no'|'directa'|'con-aprobacion'), gestionadaPor, observaciones, orden

**Docente** (6 campos): id, nombre, especialidad, horasContratadas, disponibilidad? ({restricciones[]}), departamento?

**Asignatura** (8 campos): id, nombre, alias, ratio, turnosSemanales (1|2|3), duracionTurno (min), atributosRequeridos[], tipo? ('individual'|'colectiva')

**TipoOcupacion** (4 campos): id, nombre, requiereAula, esLectiva

### Franjas (dentro de cada Escenario)

**FranjaClase**: tipo 'clase', asignaturaId, docenteId, aulaId, dia, horaInicio, horaFin, turnoNumero?, grupoId?

**FranjaOcupacion**: tipo 'ocupacion', tipoOcupacionId, docenteId, aulaId?, dia, horaInicio, horaFin, descripcion?

### Escenario

id, nombre, descripcion?, franjas[], configuracion (horaInicio/horaFin/deshabilitadas/ocultas), creadoEn, modificadoEn

### SyncData (shared/sync.ts)

Formato JSON compartido entre app, Tauri y MCP Server:
```
{ version: 2, lastModified, escenarioActivoId, aulas[], docentes[], asignaturas[], tiposOcupacion[], escenarios[] }
```
Archivo: `~/.contratiempo/data.json`

## Estado del Store

```
// Datos maestros (compartidos entre escenarios)
aulas[], docentes[], asignaturas[], tiposOcupacion[]

// Escenarios
escenarios[], escenarioActivoId

// UI - Navegacion
vistaActual: VistaId, filtros: Filtros

// UI - Cuadricula
modoVistaCuadricula: 'dias-aulas' | 'aulas-dias'
granularidadVista: 30 | 60
diaSeleccionado: DiaSemana

// UI - Panel lateral
panelFranjaAbierto, franjaEditandoId, panelPrellenado
```

**Selectores derivados:** useEscenarioActivo(), useFranjasActivas()

**Persistencia:** localStorage key `contratiempo-storage`, version 1

## MCP Server

30 herramientas en `mcp-server/src/`:

**CRUD (crudTools.ts, 16 tools):** listar/crear/actualizar/eliminar para aulas, docentes, asignaturas, ocupaciones. Busca por nombre o ID.

**Escenarios (scenarioTools.ts, 9 tools):** listar/crear/duplicar/activar escenarios + listar/crear_clase/crear_ocupacion/eliminar franjas.

**Consultas (queryTools.ts, 5 tools):** ver_horario_docente, ver_horario_aula, validar_horario, buscar_huecos, resumen_horas_docentes.

**Storage:** Lee/escribe `~/.contratiempo/data.json` con escritura atomica (tmp+rename).

**Config Claude Desktop:**
```json
{ "mcpServers": { "contratiempo": { "command": "node", "args": ["/ruta/a/ContraTiempo/mcp-server/build/mcp-server/src/index.js"] } } }
```

## PWA

- `public/manifest.json`: standalone, theme #1e40af, scope /ContraTiempo/
- `public/sw.js`: network-first para navegacion, cache-first para assets
- `PWAUpdatePrompt.tsx`: registra SW, muestra toast al detectar update, envia SKIP_WAITING
- Iconos: pwa-192x192.png y pwa-512x512.png

## Cuadricula

- **Dos modos:** Dias>Aulas (tabs L-V, columnas=aulas) / Aulas>Dias (columnas agrupadas aula>L-V)
- **Granularidad:** 30 min (rowspan) / 1 hora (franjas compactas)
- **Drag & Drop:** useDraggable en FranjaCard, useDroppable en DroppableCell, DragOverlay
- **Panel lateral:** click celda vacia → crear con prellenado, click franja → editar

## Validaciones

**Errores:** solapamiento aula, docente duplicado
**Avisos:** exceso/faltan horas docente, huecos entre clases
**Pendientes:** atributos aula requeridos, disponibilidad docente, turnos faltantes

## Convenciones

- Componentes: PascalCase, un principal por archivo
- Acciones store: camelCase (addAula, setModoVista)
- Tipos: PascalCase, en shared/types.ts (dominio) o src/types/index.ts (UI)
- Horas: strings "HH:mm"
- IDs: UUID v4
- CSS: color-scheme: light forzado
- Ramas: main (produccion) + develop (desarrollo)

## Deploy

- Base URL: `/ContraTiempo/`
- GitHub Actions: push a main → build → deploy Pages
- URL: https://jlmirallesb.github.io/ContraTiempo/
