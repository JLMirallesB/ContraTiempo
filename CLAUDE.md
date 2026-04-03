# ContraTiempo

Aplicacion web para gestionar horarios de conservatorio de musica. Desplegada en GitHub Pages.

## Stack

- **Framework**: React 19 + TypeScript (strict mode)
- **Build**: Vite 8 con `@tailwindcss/vite`
- **Estado**: Zustand 5 + Immer (middleware `persist` para localStorage)
- **UI**: Tailwind CSS 4 + lucide-react (iconos) + clsx/tailwind-merge
- **Excel**: SheetJS (xlsx) para import/export
- **i18n**: react-i18next (preparado, idioma base: español)
- **Deploy**: GitHub Actions -> gh-pages branch

## Comandos

```bash
npm run dev      # Dev server (puerto 5173)
npm run build    # tsc -b && vite build
npm run preview  # Preview del build
npm run lint     # ESLint
```

## Estructura del Proyecto

```
src/
├── types/index.ts           # Todos los tipos TypeScript del dominio
├── stores/useAppStore.ts    # Store Zustand unico con slices via Immer
├── services/timeUtils.ts    # Utilidades de tiempo (horaAMinutos, seSolapan, etc)
├── services/validators/     # Motor de validaciones (conflictos, horas, huecos)
├── services/excel/          # Import/export Excel
├── lib/utils.ts             # cn() helper para clases CSS
├── components/
│   ├── layout/              # Sidebar, MainLayout
│   ├─�� views/               # VistaGeneral, VistaConfig, VistaAula, etc.
│   ├── masters/             # CRUD de datos maestros (AulasManager, etc.)
│   ├── grid/                # Cuadricula de horario (ScheduleGrid, etc.)
│   ├── tools/               # Herramientas (BuscadorHuecos, ContadorHoras, etc.)
│   └── scenarios/           # Gestion de escenarios
└── i18n/                    # Internacionalizacion
```

## Path Aliases

- `@/` -> `src/` (configurado en vite.config.ts y tsconfig.app.json)

## Modelo de Datos

El estado se gestiona con un unico store Zustand (`useAppStore`).

### Entidades maestras (compartidas entre escenarios)
- **Aula**: nombre, capacidad, descripcion, atributos[] (piano, pantalla, etc.)
- **Docente**: nombre, especialidad, horasContratadas, disponibilidad? (restricciones), departamento?
- **Asignatura**: nombre, alias (Excel), ratio, turnosSemanales (1|2|3), duracionTurno (min), atributosRequeridos[], tipo?
- **TipoOcupacion**: nombre, requiereAula (boolean)

### Escenarios
Cada escenario tiene su propia coleccion de franjas horarias y configuracion.
Los datos maestros son compartidos entre escenarios.

### Franjas horarias
- **FranjaClase**: asignatura + docente + aula + dia + hora inicio/fin
- **FranjaOcupacion**: tipoOcupacion + docente + aula? + dia + hora inicio/fin

### Configuracion por escenario
- Hora inicio/fin del dia (default 08:00-22:00)
- Franjas deshabilitadas (no usadas en este centro)
- Franjas ocultas (temporalmente invisibles)

## Convenciones de Codigo

- Componentes React: PascalCase, un componente por archivo
- Store actions: camelCase verbos (addAula, updateDocente, removeFranja)
- Tipos: PascalCase, definidos en `types/index.ts`
- Horas siempre como strings "HH:mm"
- IDs siempre UUID v4 (via `uuid` package)
- Granularidad minima: 30 minutos
- Dias de la semana: tipo `DiaSemana` ('lunes' | ... | 'viernes')

## Persistencia

- localStorage key: `contratiempo-storage`
- Versionado con `version: 1` en el middleware persist
- Backup via export/import Excel

## Reglas de Negocio (Validaciones)

### Errores (bloquean)
- Dos franjas en la misma aula + dia + hora solapadas
- Un docente en dos sitios al mismo momento
- Clase + ocupacion solapadas en misma aula + hora

### Avisos (informativos, permiten override)
- Docente con mas/menos horas de las contratadas
- Docente con huecos entre clases
- Clase en aula sin los atributos requeridos
- Clase en horario de no-disponibilidad del docente
- Asignatura con turnos faltantes

## Base URL

El proyecto se despliega en `/ContraTiempo/` (configurado en `vite.config.ts` base).
