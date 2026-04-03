# ContraTiempo

Aplicacion web para gestionar horarios de conservatorio de musica. Desplegada en GitHub Pages.
Repo: https://github.com/JLMirallesB/ContraTiempo

## Stack

- **Framework**: React 19 + TypeScript (strict mode)
- **Build**: Vite 8 con `@tailwindcss/vite`
- **Estado**: Zustand 5 + Immer (middleware `persist` para localStorage, version: 1)
- **UI**: Tailwind CSS 4 + lucide-react (iconos) + clsx/tailwind-merge
- **Drag & Drop**: @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities
- **Excel**: SheetJS (xlsx) para import/export
- **i18n**: react-i18next (preparado, no implementado aun; UI en español hardcoded)
- **Deploy**: GitHub Actions -> GitHub Pages (workflow en `.github/workflows/deploy.yml`)

Nota: react-router-dom esta instalado pero NO se usa. La app usa view-switching via estado Zustand.

## Comandos

```bash
npm run dev      # Dev server (puerto 5173, base /ContraTiempo/)
npm run build    # tsc -b && vite build
npm run preview  # Preview del build
npm run lint     # ESLint
```

## Estructura del Proyecto

```
src/
├── types/index.ts                    # Todos los tipos TypeScript del dominio
├── stores/useAppStore.ts             # Store Zustand unico (estado + acciones + selectores)
├── lib/utils.ts                      # cn() helper para clases CSS
├── services/
│   ├── timeUtils.ts                  # Utilidades de tiempo ("HH:mm")
│   ├── validators/
│   │   ├── conflictDetector.ts       # Detectar solapamientos aula/docente
│   │   ├── hoursCalculator.ts        # Horas por docente + huecos entre clases
│   │   ├── capacityCalculator.ts     # Capacidad alumnado por asignatura
│   │   └── gapFinder.ts             # Buscar huecos libres (aula, docente+aula)
│   └── excel/
│       ├── excelExporter.ts          # 6 funciones de exportacion
│       └── excelImporter.ts          # 5 funciones de importacion
├── hooks/
│   ├── useFilteredAulas.ts           # Filtrar aulas por sede/piso/seleccion
│   └── useGridColumns.ts            # Generar columnas segun modo vista
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx               # Navegacion, selector escenario, creditos
│   │   └── MainLayout.tsx            # Layout principal: sidebar + content + panel lateral
│   ├── views/
│   │   ├── VistaGeneral.tsx          # Cuadricula principal con toolbar
│   │   ├── VistaConfig.tsx           # Tabs: Aulas/Docentes/Asignaturas/Ocupaciones/Escenarios/Comparar/Import-Export
│   │   ├── VistaAula.tsx             # Horario semanal de un aula (usa WeekGrid)
│   │   ├── VistaDocente.tsx          # Horario semanal + resumen horas (clases/ocupaciones/total/contratadas/diferencia)
│   │   ├── VistaAsignatura.tsx       # Tabla franjas + estadisticas + desglose por docente
│   │   ├── VistaValidaciones.tsx     # Lista errores/avisos con contadores
│   │   ├── VistaHerramientas.tsx     # 3 tabs: Horas Docentes, Capacidad Alumnado, Buscador Huecos
│   │   └── VistaImportExport.tsx     # Export/import individual + escenario + backup total
│   ├── masters/
│   │   ├── AulasManager.tsx          # CRUD aulas (12 campos, autocompletado sede/piso/tipo)
│   │   ├── DocentesManager.tsx       # CRUD docentes
│   │   ├── AsignaturasManager.tsx    # CRUD asignaturas
│   │   └── OcupacionesManager.tsx    # CRUD tipos ocupacion (con esLectiva)
│   ├── grid/
│   │   ├── ScheduleGrid.tsx          # Cuadricula principal con DndContext, 2 modos, 2 granularidades
│   │   ├── WeekGrid.tsx              # Cuadricula semanal reutilizable (L-V) con DnD
│   │   ├── GridToolbar.tsx           # Barra: modo vista, granularidad, filtros sede/piso, tabs dias
│   │   ├── FranjaCard.tsx            # Tarjeta de franja (draggable, colores clase/ocupacion)
│   │   ├── DroppableCell.tsx         # Celda receptora de drop (highlight en hover)
│   │   └── FranjaPanel.tsx           # Panel lateral derecho: crear/editar franjas con prellenado
│   └── scenarios/
│       ├── ScenarioManager.tsx       # CRUD escenarios (crear, renombrar, duplicar, eliminar, activar)
│       └── ScenarioComparator.tsx    # Comparar dos escenarios (diferencias por fingerprint)
└── index.css                         # Tailwind + tema colores + color-scheme: light forzado
```

## Path Aliases

- `@/` -> `src/` (configurado en vite.config.ts `resolve.alias` y tsconfig.app.json `paths`)

## Modelo de Datos Completo

El estado se gestiona con un unico store Zustand (`useAppStore`). Todas las interfaces estan en `src/types/index.ts`.

### Entidades maestras (compartidas entre escenarios)

**Aula** (15 campos):
- id, codigo, nombre, tipo, capacidad, descripcion
- atributos: string[] (piano, pantalla, espejo...)
- sede, piso (texto libre con autocompletado)
- reservable: 'no' | 'directa' | 'con-aprobacion'
- gestionadaPor, observaciones
- orden (para ordenacion en UI)

**Docente** (6 campos):
- id, nombre, especialidad, horasContratadas (horas/semana)
- departamento? (opcional)
- disponibilidad?: { restricciones: { dia, inicio, fin, motivo? }[] } (soft constraint, genera aviso)

**Asignatura** (8 campos):
- id, nombre, alias (para compatibilidad Excel)
- ratio (alumnos/grupo), turnosSemanales (1|2|3), duracionTurno (minutos: 30|60|90|120|150|180)
- atributosRequeridos: string[] (atributos que debe tener el aula)
- tipo?: 'individual' | 'colectiva'

**TipoOcupacion** (4 campos):
- id, nombre, requiereAula: boolean, esLectiva: boolean

### Franjas horarias (dentro de cada Escenario)

**FranjaClase** (extends FranjaBase):
- tipo: 'clase', asignaturaId, docenteId, aulaId, dia, horaInicio, horaFin
- turnoNumero?, grupoId? (opcionales para agrupar)

**FranjaOcupacion** (extends FranjaBase):
- tipo: 'ocupacion', tipoOcupacionId, docenteId, aulaId? (opcional si no requiere aula)
- dia, horaInicio, horaFin, descripcion?

### Escenarios

Cada **Escenario** contiene:
- id, nombre, descripcion?, creadoEn, modificadoEn
- franjas: Franja[] (coleccion de FranjaClase | FranjaOcupacion)
- configuracion: { horaInicio, horaFin, franjasDeshabilitadas[], franjasOcultas[] }

Los datos maestros (aulas, docentes, asignaturas, ocupaciones) son COMPARTIDOS entre escenarios.

### Configuracion por escenario
- Hora inicio/fin del dia (default 08:00-22:00)
- Franjas deshabilitadas: no usadas en este centro (array de {dia, inicio, fin})
- Franjas ocultas: temporalmente invisibles para simplificar la vista

## Estado del Store (useAppStore)

### Estado
```
aulas[], docentes[], asignaturas[], tiposOcupacion[]  // Datos maestros
escenarios[], escenarioActivoId                        // Escenarios
vistaActual, filtros                                    // Navegacion
modoVistaCuadricula: 'dias-aulas' | 'aulas-dias'      // Modo de cuadricula
granularidadVista: 30 | 60                              // Granularidad temporal
diaSeleccionado: DiaSemana                              // Dia activo (modo dias-aulas)
panelFranjaAbierto, franjaEditandoId, panelPrellenado  // Panel lateral
```

### Acciones CRUD
- add/update/remove para: Aula, Docente, Asignatura, TipoOcupacion
- add/update/remove/duplicar para: Escenario
- add/update/remove para: Franja (opera en escenario activo)

### Acciones UI
- setVista, setFiltros, clearFiltros
- setModoVista, setGranularidad, setDiaSeleccionado
- setPanelFranjaAbierto, setFranjaEditandoId, setPanelPrellenado

### Selectores derivados
- `useEscenarioActivo()`: retorna el Escenario activo
- `useFranjasActivas()`: retorna franjas[] del escenario activo

## Hooks personalizados

- **useFilteredAulas**: filtra aulas por sede/piso/aulasSeleccionadas, retorna {filteredAulas, sedes, pisos}
- **useGridColumns**: genera columnas de la cuadricula segun modo de vista y aulas filtradas, retorna {columns, groupHeaders}

## Servicios

### timeUtils.ts
Todas las horas como strings "HH:mm":
- horaAMinutos, minutosAHora, generarFranjasHorarias
- duracionEnMinutos, duracionEnHoras, seSolapan
- sumarMinutos, formatearDuracion

### validators/conflictDetector.ts
- `detectarConflictos(franjas, aulas, docentes)` → ResultadoValidacion[] con errores de solapamiento

### validators/hoursCalculator.ts
- `calcularHorasDocentes(franjas, docentes)` → ResumenHorasDocente[] (clases, ocupaciones, total, contratadas, diferencia, huecos)
- `generarAvisosHoras(resumenes)` → ResultadoValidacion[] con avisos de horas exceso/faltan + huecos entre clases

### validators/capacityCalculator.ts
- `calcularCapacidadAsignaturas(franjas, asignaturas)` → ResumenCapacidadAsignatura[] (franjas, horas, capacidad = franjas × ratio)

### validators/gapFinder.ts
- `buscarHuecosAulas(franjas, aulas, config, duracionMinima)` → HuecoDisponible[] (huecos libres en aulas)
- `buscarHuecosCombinados(franjas, docenteId, aulas, config, duracionMinima)` → HuecoDisponible[] (docente libre + aula libre)

### excel/excelExporter.ts
- exportarAulas, exportarDocentes, exportarAsignaturas, exportarOcupaciones (archivos .xlsx individuales)
- exportarEscenario (franjas con nombres resueltos + metadata)
- exportarBackupTotal (datos maestros serializados + escenarios con IDs)

### excel/excelImporter.ts
- importarAulas, importarDocentes, importarAsignaturas, importarOcupaciones (AÑADE a datos existentes)
- importarBackupTotal (REEMPLAZA todo el estado)

## Cuadricula (Grid)

### Dos modos de vista
- **Dias > Aulas** (`dias-aulas`): tabs L/M/X/J/V arriba, columnas = aulas filtradas del dia seleccionado
- **Aulas > Dias** (`aulas-dias`): columnas agrupadas por aula, cada una con 5 subcolumnas L-V

### Granularidad
- **30 min**: cada fila = 30 min, franjas con rowspan proporcional a duracion
- **1 hora**: cada fila = 1h, franjas de 30 min se muestran compactas dentro de la celda

### Drag & Drop
- FranjaCard es draggable (grip handle izquierdo, visible en hover)
- DroppableCell recibe drops (highlight azul al pasar por encima)
- DragOverlay muestra preview flotante durante el arrastre
- Al soltar: actualiza dia/hora/aula de la franja preservando duracion
- PointerSensor con distance: 5 para evitar drags accidentales en click

### Panel lateral (FranjaPanel)
- Se abre al click en celda vacia (con dia/hora/aula prellenados) o al click en franja existente (modo edicion)
- Toggle Clase/Ocupacion, selects para asignatura/docente/aula/dia/hora/duracion
- Muestra hora fin calculada, boton eliminar en modo edicion

## Convenciones de Codigo

- Componentes React: PascalCase, un componente por archivo principal
- Componentes auxiliares (HorasCard, StatCard, etc.): pueden estar en el mismo archivo que su padre
- Store actions: camelCase verbos (addAula, updateDocente, removeFranja, setModoVista)
- Tipos: PascalCase, todos definidos en `types/index.ts`
- Horas: siempre strings "HH:mm"
- IDs: UUID v4 (via `uuid` package)
- Granularidad: 30 minutos (minima) o 60 minutos (vista simplificada)
- Dias de la semana: tipo DiaSemana ('lunes'|'martes'|'miercoles'|'jueves'|'viernes')
- Constantes: DIAS_SEMANA (array), DIAS_SEMANA_LABEL (display), DIAS_SEMANA_ABREV (L/M/X/J/V)
- CSS: color-scheme: light forzado (no dark mode)

## Persistencia

- localStorage key: `contratiempo-storage`
- Versionado con `version: 1` en el middleware persist de Zustand
- Backup via export/import Excel (backup total reemplaza todo, import individual añade)

## Reglas de Negocio (Validaciones)

Implementadas en `services/validators/`. Se ejecutan reactivamente al cambiar franjas.

### Errores (severidad 'error')
- Aula ocupada: dos franjas en la misma aula + dia + hora solapadas
- Docente duplicado: un docente en dos sitios al mismo momento

### Avisos (severidad 'aviso')
- Docente con mas horas de las contratadas (exceso)
- Docente con menos horas de las contratadas (faltan)
- Docente con huecos entre clases (tiempo muerto)

### Pendientes de implementar
- Clase en aula sin los atributos requeridos
- Clase en horario de no-disponibilidad del docente
- Asignatura con turnos faltantes

## Base URL / Deploy

- Base URL: `/ContraTiempo/` (configurado en `vite.config.ts`)
- Deploy: GitHub Actions workflow en `.github/workflows/deploy.yml`
- Trigger: push a rama `main`
- Ramas: `main` (produccion) + `develop` (desarrollo)
- GitHub Pages URL: https://jlmirallesb.github.io/ContraTiempo/
