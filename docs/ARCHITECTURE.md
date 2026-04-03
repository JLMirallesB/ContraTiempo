# Arquitectura - ContraTiempo

## Vision General

Aplicacion SPA (Single Page Application) estatica desplegada en GitHub Pages para gestionar horarios de conservatorios de musica. No tiene backend; todo el estado se almacena en localStorage del navegador, con export/import a Excel como mecanismo de backup y comparticion.

## Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────────┐
│                            App                                │
│  ┌──────────┐  ┌────────────────────────┐  ┌──────────────┐ │
│  │ Sidebar  │  │     Content Area       │  │ FranjaPanel  │ │
│  │          │  │                        │  │ (condicional)│ │
│  │ Logo+    │  │  Vista activa segun    │  │              │ │
│  │ Nombre   │  │  vistaActual:          │  │ Crear/editar │ │
│  │          │  │                        │  │ franjas con  │ │
│  │ Scenario │  │  - VistaGeneral        │  │ prellenado   │ │
│  │ Selector │  │    └ GridToolbar       │  │              │ │
│  │          │  │    └ ScheduleGrid      │  │ Toggle:      │ │
│  │ Nav Menu │  │  - VistaAula           │  │ Clase/Ocup.  │ │
│  │ (7 items)│  │    └ WeekGrid          │  │              │ │
│  │          │  │  - VistaDocente         │  │ Selects:     │ │
│  │ Sub-items│  │    └ HorasCards        │  │ asig/docente │ │
│  │ (expand) │  │    └ WeekGrid          │  │ aula/dia/hora│ │
│  │          │  │  - VistaAsignatura      │  │              │ │
│  │ Credits  │  │  - VistaValidaciones    │  └──────────────┘ │
│  │ v0.1.0   │  │  - VistaHerramientas   │                    │
│  └──────────┘  │  - VistaConfig          │                    │
│                │    └ 7 tabs             │                    │
│                └────────────────────────┘                    │
└──────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

```
Usuario interactua (click, drag, formulario)
         │
         ▼
Componente React llama accion del store
         │
         ▼
Zustand Store (con Immer para mutaciones inmutables)
         │
         ├──► localStorage (persist middleware, key: contratiempo-storage)
         │
         └──► Re-render de componentes suscritos via selectores
                    │
                    └──► Validaciones se recalculan (useMemo en VistaValidaciones)
```

## Store (Zustand + Immer + Persist)

```
useAppStore
├── Datos Maestros (compartidos entre escenarios)
│   ├── aulas: Aula[]
│   ├── docentes: Docente[]
│   ├── asignaturas: Asignatura[]
│   └── tiposOcupacion: TipoOcupacion[]
├── Escenarios
│   ├── escenarios: Escenario[] (cada uno con franjas[] y configuracion)
│   └── escenarioActivoId: string
├── UI - Navegacion
│   ├── vistaActual: VistaId (7 vistas posibles)
│   └── filtros: { aulaId?, docenteId?, asignaturaId?, sede?, piso?, aulasSeleccionadas? }
├── UI - Cuadricula
│   ├── modoVistaCuadricula: 'dias-aulas' | 'aulas-dias'
│   ├── granularidadVista: 30 | 60
│   └── diaSeleccionado: DiaSemana (para modo dias-aulas)
├── UI - Panel Lateral
│   ├── panelFranjaAbierto: boolean
│   ├── franjaEditandoId: string | null
│   └── panelPrellenado: { dia?, horaInicio?, aulaId? } | null
├── Acciones CRUD (add/update/remove por entidad)
├── Acciones Escenario (add/update/remove/duplicar/setActivo)
├── Acciones Franja (add/update/remove en escenario activo)
└── Acciones UI (setVista, setFiltros, setModoVista, setGranularidad, etc.)

Selectores derivados:
├── useEscenarioActivo() → Escenario actual
└── useFranjasActivas() → Franja[] del escenario activo
```

## Modelo de Datos

### Relaciones

```
Aula (1) ──────── (N) FranjaClase (aulaId obligatorio)
Aula (1) ──────── (N) FranjaOcupacion (aulaId opcional)
Docente (1) ───── (N) Franja (clase u ocupacion)
Asignatura (1) ── (N) FranjaClase
TipoOcupacion (1) (N) FranjaOcupacion
Escenario (1) ─── (N) Franja (cada escenario tiene su coleccion)
```

### Granularidad Temporal
- Bloque minimo almacenado: 30 minutos
- Vista soporta 30 min o 1 hora (toggle en UI)
- Horas como strings "HH:mm" (nunca Date ni timestamps)
- Rango configurable por escenario (default 08:00-22:00)

### Ratio y Capacidad
- Cada asignatura define un `ratio` (alumnos por grupo)
- Capacidad total = numero de franjas colocadas × ratio
- Una franja = un grupo de alumnos

## Sistema de Cuadricula

### Modos de vista

**Modo Dias > Aulas** (`dias-aulas`):
- Tabs superiores: Lunes | Martes | Miercoles | Jueves | Viernes
- Columnas: aulas filtradas (puede haber 60-70, se filtran por sede/piso)
- Filas: franjas horarias del dia seleccionado

**Modo Aulas > Dias** (`aulas-dias`):
- Sin tabs de dia
- Columnas agrupadas: [Aula 1: L|M|X|J|V] [Aula 2: L|M|X|J|V] ...
- Filas: franjas horarias

### Granularidad
- 30 min: cada fila = 30 min, franjas usan rowspan proporcional a su duracion
- 1 hora: cada fila = 1h, franjas de 30 min se muestran compactas

### Drag & Drop (@dnd-kit)
- FranjaCard: `useDraggable` con grip handle visible en hover
- DroppableCell: `useDroppable` con highlight visual
- DragOverlay: preview flotante durante arrastre
- Al soltar: actualiza dia/hora/aula preservando duracion original
- PointerSensor con distance: 5 (evita drag accidental en click)
- Implementado tanto en ScheduleGrid (vista general) como en WeekGrid (vistas individuales)

### Panel Lateral (FranjaPanel)
- Click en celda vacia: abre con dia/hora/aula prellenados
- Click en franja existente: abre en modo edicion
- Toggle Clase/Ocupacion
- Selects encadenados para asignatura/docente/aula/dia/hora/duracion

## Validaciones

Servicios en `services/validators/`:

| Servicio | Funcion | Produce |
|----------|---------|---------|
| conflictDetector | detectarConflictos() | Errores: solapamiento aula, docente duplicado |
| hoursCalculator | calcularHorasDocentes() | Datos: horas por docente (clases, ocupaciones, total) |
| hoursCalculator | generarAvisosHoras() | Avisos: exceso/faltan horas, huecos entre clases |
| capacityCalculator | calcularCapacidadAsignaturas() | Datos: franjas, horas, capacidad por asignatura |
| gapFinder | buscarHuecosAulas() | Datos: huecos libres en aulas |
| gapFinder | buscarHuecosCombinados() | Datos: huecos donde docente + aula libres |

## Excel Import/Export

Servicios en `services/excel/`:

### Exportacion (excelExporter.ts)
- **Individual**: exportarAulas/Docentes/Asignaturas/Ocupaciones → archivos .xlsx separados con columnas legibles
- **Escenario**: exportarEscenario → hoja "Franjas" con nombres resueltos + hoja "Info" metadata
- **Backup total**: exportarBackupTotal → hojas de datos maestros (serializados con IDs) + hoja por escenario + hoja "_Escenarios" con metadata y config JSON

### Importacion (excelImporter.ts)
- **Individual**: importarAulas/Docentes/Asignaturas/Ocupaciones → AÑADE a datos existentes (genera nuevos UUIDs)
- **Backup total**: importarBackupTotal → REEMPLAZA todo el estado (preserva IDs del backup)

### Formato columnas Excel individuales
- Aulas: Codigo, Nombre, Descripcion, Tipo, Reservable, Gestionada por, Observaciones, Sede, Piso, Capacidad, Atributos
- Docentes: Nombre, Especialidad, Horas/semana, Departamento
- Asignaturas: Nombre, Alias, Ratio, Turnos, Duracion, Tipo, Requisitos Aula
- Ocupaciones: Nombre, Requiere Aula, Es Lectiva

## Decisiones de Diseno

| Decision | Alternativa | Razon |
|----------|-------------|-------|
| Zustand + Immer | Redux, Context | Menos boilerplate, persist nativo, performance |
| Un unico store | Multiples stores | Datos maestros compartidos entre escenarios |
| Horas como "HH:mm" | Timestamps, Date | Simple, sin timezone, facil de comparar |
| UUID para IDs | Autoincrement | No hay servidor, no hay colisiones |
| Datos maestros compartidos | Por escenario | Evita duplicar aulas/docentes al crear escenarios |
| Tailwind CSS 4 | CSS Modules, Styled | Rapido prototipado, consistente, ligero |
| @dnd-kit | react-beautiful-dnd | Mas moderno, mejor soporte accesibilidad, activo |
| View-switching via estado | React Router | SPA simple, no necesita URLs persistentes |
| color-scheme: light | dark mode | Simplifica UI, evita problemas de contraste |
| SheetJS (xlsx) | ExcelJS, csv | Soporta .xlsx nativo, sin servidor, amplio soporte |

## Guia para Nuevas Funcionalidades

1. **Nuevo tipo de dato**: añadir a `types/index.ts`, actualizar store si necesita CRUD
2. **Nueva accion del store**: añadir a `AppActions` interface y a la implementacion en `useAppStore.ts`
3. **Nuevo servicio de calculo**: crear en `services/` (validators/ o nuevo directorio)
4. **Nueva vista**: crear en `components/views/`, importar y conectar en `MainLayout.tsx`, añadir a NavItem en `Sidebar.tsx`
5. **Nuevo CRUD de datos maestros**: crear en `components/masters/`, añadir tab en `VistaConfig.tsx`
6. **Nuevo componente de cuadricula**: crear en `components/grid/`, si necesita DnD usar useDraggable/useDroppable
7. **Nueva herramienta**: añadir tab en `VistaHerramientas.tsx`
8. **Nueva validacion**: añadir logica en servicio de validators existente o nuevo, conectar en `VistaValidaciones.tsx`

## Estado del Proyecto

Todas las 8 fases de desarrollo completadas (v0.1.0):
- F1: Fundacion (tipos, store, layout, CRUD)
- F2: Cuadricula (2 modos, granularidad, filtros, panel)
- F3: Vistas individuales (aula, docente, asignatura)
- F4: Drag & Drop (@dnd-kit)
- F5: Validaciones y herramientas
- F6: Escenarios multiples (CRUD, duplicar, comparar)
- F7: Excel import/export
- F8: Branding ContraTiempo, fix estilos, creditos

### Pendiente para futuras versiones
- i18n completo (react-i18next preparado pero strings hardcoded en español)
- Responsive / adaptacion movil
- Undo/redo
- Validaciones adicionales: atributos de aula requeridos, disponibilidad docente, turnos faltantes
- Compatibilidad import/export con app externa de horarios (formato a definir)
