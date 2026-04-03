# Arquitectura - ContraTiempo

## Vision General

Aplicacion SPA (Single Page Application) estatica desplegada en GitHub Pages para gestionar horarios de conservatorios de musica. No tiene backend; todo el estado se almacena en localStorage del navegador, con export/import a Excel como mecanismo de backup y comparticion.

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────┐
│                     App                          │
│  ┌──────────┐  ┌──────────────────────────────┐ │
│  │ Sidebar  │  │        MainContent            │ │
│  │          │  │                                │ │
│  │ Scenario │  │  ┌──────────────────────────┐ │ │
│  │ Selector │  │  │    Vista Activa           │ │ │
│  │          │  │  │ (General/Aula/Docente/    │ │ │
│  │ Nav Menu │  │  │  Asignatura/Validaciones/ │ │ │
│  │  - Vistas│  │  │  Herramientas/Config)     │ │ │
│  │  - Tools │  │  └──────────────────────────┘ │ │
│  │  - Config│  │                                │ │
│  │          │  └──────────────────────────────┘ │
│  │ Status   │                                    │
│  └──────────┘                                    │
└─────────────────────────────────────────────────┘
```

## Flujo de Datos

```
Usuario -> Componente -> Zustand Store -> Re-render
                              │
                              ├── localStorage (persist middleware)
                              └── Validaciones (derivadas reactivamente)
```

1. El usuario interactua con un componente (crear aula, mover franja, etc.)
2. El componente llama a una accion del store Zustand
3. Immer middleware permite mutaciones inmutables
4. Persist middleware guarda en localStorage
5. Los selectores/componentes se re-renderizan

## Store (Zustand)

Un unico store con todas las entidades:

```
useAppStore
├── Datos Maestros (compartidos entre escenarios)
│   ├── aulas[]
│   ├── docentes[]
│   ├── asignaturas[]
│   └── tiposOcupacion[]
├── Escenarios
│   ├── escenarios[] (cada uno con franjas[] y configuracion)
│   └── escenarioActivoId
├── UI
│   ├── vistaActual
│   └── filtros
└── Actions (CRUD para cada entidad)
```

## Modelo de Datos

### Relaciones

```
Aula (1) ──── (N) FranjaClase
Docente (1) ──── (N) Franja (clase u ocupacion)
Asignatura (1) ──── (N) FranjaClase
TipoOcupacion (1) ──── (N) FranjaOcupacion
Escenario (1) ──── (N) Franja
```

### Granularidad Temporal
- Bloque minimo: 30 minutos
- Horas como strings "HH:mm"
- Rango configurable (default 08:00-22:00)

### Ratio y Capacidad
- Cada asignatura define un `ratio` (alumnos por grupo)
- Capacidad total = numero de grupos colocados * ratio
- Un grupo = una franja de clase de esa asignatura

## Validaciones

El motor de validaciones opera sobre el escenario activo y produce:
- **Errores**: problemas que impiden un horario valido
- **Avisos**: situaciones que requieren atencion pero no bloquean

Las validaciones se recalculan cada vez que cambian las franjas del escenario activo.

## Fases de Desarrollo

1. **Fundacion**: tipos, store, layout, CRUD datos maestros
2. **Cuadricula**: ScheduleGrid con formulario para colocar franjas
3. **Vistas individuales**: por aula, docente, asignatura
4. **Drag & Drop**: arrastrar y redimensionar franjas en la cuadricula
5. **Validaciones y herramientas**: conflictos, contadores, buscador
6. **Escenarios**: multiples borradores, duplicar, comparar
7. **Excel**: import/export con formato imprimible
8. **Pulido**: i18n, responsive, undo/redo

## Decisiones de Diseno

| Decision | Alternativa | Razon |
|----------|-------------|-------|
| Zustand + Immer | Redux, Context | Menos boilerplate, persist nativo, performance |
| Un unico store | Multiples stores | Datos maestros compartidos entre escenarios |
| Horas como "HH:mm" | Timestamps, Date | Simple, sin timezone, facil de comparar |
| UUID para IDs | Autoincrement | No hay servidor, no hay colisiones |
| Datos maestros compartidos | Por escenario | Evita duplicar aulas/docentes al crear escenarios |
| Tailwind CSS 4 | CSS Modules, Styled | Rapido prototipado, consistente, ligero |

## Guia para Nuevas Funcionalidades

1. Si necesitas un nuevo tipo de dato: añadelo a `types/index.ts`
2. Si necesitas nuevas acciones del store: añadelas a `useAppStore.ts`
3. Si es un nuevo servicio de calculo: crealo en `services/`
4. Si es una nueva vista: creala en `components/views/` y conectala en `MainLayout.tsx`
5. Si es un nuevo CRUD de datos maestros: crealo en `components/masters/` y añadelo a `VistaConfig.tsx`

## Export Excel (futuro)

El Excel tendra:
- Hojas de datos maestros (aulas, docentes, asignaturas, ocupaciones)
- Hojas de horario por aula (formato imprimible)
- Hojas de horario por docente (formato imprimible)
- Compatibilidad con formato de aplicacion externa (a definir)
