# Cloud Foundations

Para habilitar costos independientes por propuesta en una base Supabase existente,
ejecuta `backend/supabase/proposal-costs.sql` en el SQL Editor. La migración agrega
`cost_configuration` a cada propuesta y conserva las propuestas existentes.
En Costos, selecciona una tarjeta, ajusta la capacidad y pulsa **Guardar costos de esta propuesta**.
El presupuesto es el umbral general del proyecto; las tarifas son estimaciones del catálogo local.
IAM y VPC aparecen con importe cero en este modelo, que no incluye cargos de recursos asociados.
Para verificar el aislamiento de las propuestas: `cd backend`, `npm run build` y
`node --test tests/proposal-costs.test.mjs`.

Cloud Foundations es una aplicación web desarrollada con React y TypeScript para simular un panel de gestión y planificación de soluciones en Amazon Web Services (AWS). La idea principal es ofrecer una experiencia visual y funcional parecida a un centro de control Cloud donde el usuario puede evaluar costos, regiones, servicios, seguridad y arquitectura de red sin necesidad de conectarse a un entorno real de AWS.

Este proyecto está pensado como una práctica integrativa para mostrar cómo se puede diseñar una solución Cloud desde un punto de vista operativo, estratégico y técnico. Aquí no se despliega infraestructura real, sino que se trabaja con datos simulados para representar un entorno empresarial moderno y profesional.

## ¿Para qué sirve este proyecto?

El proyecto ayuda a:

- entender cómo se puede planificar una solución Cloud
- visualizar la arquitectura de una aplicación con servicios de AWS
- evaluar costos estimados por servicio y región
- revisar la seguridad de la infraestructura
- observar la conectividad entre componentes de red
- explorar el catálogo de servicios disponibles
- registrar una propuesta de arquitectura para un caso de negocio

## Descripción general

Cloud Foundations es un dashboard interactivo que ayuda a:

- definir una solución Cloud con sus objetivos y servicios
- comparar costos por recurso y perfil de uso
- revisar infraestructura global por región
- evaluar controles de seguridad y cumplimiento
- inspeccionar la topología de red y conectividad
- explorar servicios AWS con filtro, búsqueda y detalle
- persistir el estado (región, propuesta, costos) en un backend local de Express/Node

## ¿Cómo funciona la aplicación?

La aplicación se divide en varios módulos o pantallas, cada uno con una función específica:

### 1. Dashboard
La pantalla principal muestra un resumen general del proyecto. Aquí se observan indicadores clave como:

- costo mensual estimado
- costo anual estimado
- servicios en uso
- región activa
- seguridad global
- estado de la arquitectura

También incluye gráficos interactivos para visualizar el comportamiento de los costos y una vista rápida de los servicios principales.

### 2. Planificación Cloud
Este módulo permite crear una propuesta de solución. El usuario puede registrar:

- nombre de la solución
- tipo de aplicación
- descripción
- región seleccionada
- número estimado de usuarios
- nivel de disponibilidad
- servicios Cloud elegidos
- objetivo de la migración

Después de completar el formulario, la propuesta se visualiza en una tarjeta de resumen para comprender la solución que se está diseñando.

### 3. Costos y economía Cloud
Aquí se simulan los costos de la infraestructura. El usuario puede:

- seleccionar servicios
- modificar cantidades
- ajustar horas de uso mensuales
- observar costos estimados
- ver la distribución de gastos por categoría
- exportar un reporte CSV

Esto ayuda a comprender la parte financiera de una solución Cloud a nivel de estimación.

### 4. Infraestructura Global
En este módulo se muestra cómo se distribuye la infraestructura por región. Se visualiza:

- la región
- la ubicación geografica
- servicios desplegados
- el estado actual de cada componente

### 5. Seguridad
Se presenta un panel con controles de seguridad y el enfoque de responsabilidad compartida. Aquí se revisan temas como:

- IAM
- protección de cuentas
- cifrado y protección de datos
- cumplimiento
- indicadores de riesgo

Se usan estados visuales para distinguir entre lo correcto, lo que requiere revisión y lo crítico.

### 6. Arquitectura de Red
Esta sección representa la forma en que los servicios están conectados. La vista muestra un flujo visual con elementos como:

- Internet
- Route 53
- CloudFront
- VPC
- EC2
- RDS

La arquitectura se presenta dentro de la propia interfaz web para que sea fácil comprender el flujo de tráfico y la estructura de la solución.

### 7. Servicios AWS
En este módulo se publica un catálogo de servicios. Cada servicio muestra:

- nombre
- categoría
- descripción
- función principal
- estado de uso

Además, el usuario puede buscar servicios y filtrarlos por categoría para ver más detalles.

## Tecnologías utilizadas

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Recharts
- Node.js + Express + TypeScript (API backend)
- Supabase (PostgreSQL) para persistencia

## Requisitos del proyecto de hoy

Este proyecto incluye y cumple los requisitos solicitados:

- Proyecto React con código fuente completo
- README con nombre, descripción, tecnologías, instalación, ejecución, funcionalidades y evidencia visual
- Dashboard principal
- Planificación Cloud
- Costos con gráfico interactivo
- Infraestructura y selector de regiones
- Seguridad
- Arquitectura de red
- Servicios AWS con buscador y filtros
- Vista detallada de cada servicio
- Exportación de reporte CSV
- Notificaciones de la UI
- Animaciones y transiciones
- Persistencia del estado mediante Supabase (PostgreSQL)
- Vista responsive

## Estructura del proyecto

```bash
backend/
├── .env.example
├── package.json
├── tsconfig.json
└── src/
    ├── server.ts
    ├── types.ts
    ├── data/
    │   └── seed.ts
    ├── db/
    │   ├── samples.ts
    │   └── supabase.ts
    ├── lib/
    │   ├── asyncHandler.ts
    │   └── costs.ts
    └── routes/
        ├── costs.ts
        ├── dashboard.ts
        ├── infrastructure.ts
        ├── network.ts
        ├── notifications.ts
        ├── planning.ts
        ├── regions.ts
        ├── security.ts
        ├── services.ts
        └── state.ts

frontend/
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vercel.json
├── vite.config.ts
├── public/
│   └── favicon.svg
├── src/
│   ├── App.css
│   ├── App.tsx
│   ├── api/
│   │   └── client.ts
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── components/
│   │   ├── ApiState.tsx
│   │   ├── CostCard.tsx
│   │   ├── Header.tsx
│   │   ├── Icon.tsx
│   │   ├── NetworkDiagram.tsx
│   │   ├── Panel.tsx
│   │   ├── RegionCard.tsx
│   │   ├── SectionHeader.tsx
│   │   ├── SecurityCard.tsx
│   │   ├── ServiceCard.tsx
│   │   ├── Sidebar.tsx
│   │   ├── StatCard.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── Toast.tsx
│   │   └── WorldMap.tsx
│   ├── hooks/
│   │   ├── useApiData.ts
│   │   └── useToast.ts
│   ├── layout/
│   │   └── DashboardLayout.tsx
│   ├── lib/
│   │   └── theme.ts
│   ├── pages/
│   │   ├── Costs.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Infrastructure.tsx
│   │   ├── Network.tsx
│   │   ├── Planning.tsx
│   │   ├── Security.tsx
│   │   └── Services.tsx
│   ├── types/
│   │   └── cloud.ts
│   ├── index.css
│   └── main.tsx
```

## Funcionalidades principales

### Dashboard

La pantalla principal muestra un conjunto de tarjetas de indicadores para ofrecer una vista general del estado del proyecto. Se destacan:

- costo mensual estimado
- costo anual
- recursos activos
- seguridad del entorno
- estado de la arquitectura

La sección también presenta gráficos y resúmenes para que el usuario pueda evaluar rápidamente el estado general de la solución Cloud.

### Planificación Cloud

El formulario permite definir una solución tecnológica de manera estructurada. Entre los datos principales están:

- nombre de la solución
- tipo de aplicación
- región
- usuarios estimados
- disponibilidad requerida
- servicios seleccionados
- objetivo de la migración
- descripción del caso de uso

La información se guarda en el backend local, por lo que no se pierde al recargar la página. Esto es útil porque simula un entorno de trabajo real donde el usuario puede seguir editando la propuesta.

### Costos

La sección de costos tiene un enfoque práctico de simulación de gasto. Permite:

- modificar cantidad de recursos por servicio
- ajustar horas de uso mensual
- visualizar un gráfico interactivo con Recharts
- exportar un reporte CSV
- evaluar si el consumo está dentro del presupuesto

Es útil para entender cómo cambian los costos cuando se agregan o eliminan servicios de la arquitectura.

### Infraestructura

Incluye una vista general de la infraestructura global para comparar la disponibilidad, los servicios activos y la distribución por región. El usuario puede:

- cambiar la región activa
- mirar servicios desplegados
- revisar métricas y estado operativo
- evaluar la distribución regional de la plataforma

### Seguridad

Muestra un enfoque de seguridad basado en la responsabilidad compartida. Se revisan los principales aspectos de protección, control de acceso y cumplimiento.

También se destaca:

- controles activos
- revisión de riesgos
- prioridad de atención
- resumen de protección de la solución

### Arquitectura de red

La arquitectura de red se representa visualmente para mostrar cómo se conectan los componentes de la solución. El flujo principal simula la ruta:

Internet → Route 53 → CloudFront → VPC → EC2/RDS

Esto permite comprender cómo el tráfico entra a la infraestructura y cómo están conectados los recursos internos.

### Servicios AWS

La sección de servicios funciona como un catálogo. Aquí el usuario puede:

- buscar por nombre o descripción
- filtrar por categoría
- seleccionar un servicio para ver más información
- revisar su función y estado de uso

Incluye servicios clave como EC2, S3, RDS, IAM, VPC, Route 53 y CloudFront.

## Backend y API

El proyecto incluye una API REST desarrollada con Node.js, Express y TypeScript que entrega los datos de todos los módulos al frontend. Ya no se usan datos fijos en el navegador: cada pantalla consume recursos del backend, incluidas las mutaciones (guardar propuesta, activar propuesta, ajustar configuración de costos, cambiar región activa, ejecutar revisión de seguridad y validar conectividad de red).

Puntos clave:

- el servidor expone las rutas bajo el prefijo `/api` en el puerto `4000` (variable de entorno `PORT`)
- los datos viven en una base PostgreSQL de **Supabase**; las credenciales se configuran en `backend/.env` (usa `backend/.env.example` de guía; `.env` está excluido de git)
- el esquema (tablas + datos iniciales) se crea ejecutando el SQL de `SUPABASE.md` en el **SQL Editor** del proyecto Supabase
- el frontend usa el proxy de Vite (`/api` → `http://localhost:4000`), por lo que solo necesita servirse junto con el backend
- se puede apuntar a otra URL de API con la variable `VITE_API_URL` del frontend
- la topología de red (nodos, traza y métricas) es estática de referencia en `backend/src/data/seed.ts`; lo mutable (propuestas, región activa, costos, revisiones) está en Supabase

Endpoints principales:

```text
GET  /api/health
GET  /api/dashboard
GET  /api/planning
POST /api/planning          (crear propuesta)
POST /api/planning/active   (activar propuesta)
DELETE /api/planning/:id    (eliminar propuesta)
GET  /api/costs
PUT  /api/costs/configuration
GET  /api/regions
GET  /api/infrastructure/resources?region=<code>
GET  /api/infrastructure/monitoring/:code
GET  /api/security
POST /api/security/review
GET  /api/network
POST /api/network/validate
GET  /api/services
GET  /api/notifications
GET  /api/state
PUT  /api/state/region
```

## Instalación

1. Clona este repositorio.
2. Instala las dependencias del frontend:

```bash
cd frontend && npm install
```

3. Instala las dependencias del backend:

```bash
cd backend && npm install
```

## Ejecución

Inicia el backend (puerto 4000):

```bash
cd backend && npm run dev
```

En otra terminal, inicia la aplicación frontend en modo desarrollo:

```bash
cd frontend && npm run dev
```

Abre la dirección que te indique Vite en el navegador. El frontend consume la API a través del proxy de Vite, por lo que no es necesario configurar CORS en desarrollo.

## Construcción para producción

```bash
cd frontend && npm run build
```

## Scripts disponibles

```bash
# frontend
cd frontend
npm run dev
npm run build
npm run preview
npm run lint

# backend
cd backend
npm run dev
npm run build
```

## Despliegue

### Backend en Railway

1. Crea tu base de datos en Supabase y ejecuta el SQL de `SUPABASE.md` en el SQL Editor.
2. Crea un servicio desde este repositorio y configura **Root Directory = `backend`**.
3. Usa `pnpm install --frozen-lockfile && pnpm run build` como build command y `pnpm start` como start command. Railway inyecta `PORT` automáticamente.
4. Configura `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. Como las tablas usan RLS, no expongas la service role key en el frontend.
5. Agrega un health check para `/api/health` y copia la URL pública del servicio (ejemplo: `https://tu-backend.up.railway.app`).

### Frontend en Vercel

1. Importa este repositorio en Vercel.
2. En la configuración del proyecto, define **Root Directory = `frontend`**. Ahí vive `frontend/vercel.json` (`buildCommand: npm run build`, `outputDirectory: dist`, rewrites SPA).
3. Añade `VITE_API_URL` con la URL pública de Railway, sin `/api`, además de `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Se inyectan durante el build; después de cambiarlas debes hacer redeploy.
4. Haz el deploy. El frontend llamará a Railway mediante `/api` y el backend ya tiene CORS habilitado.

## Evidencias / capturas del proyecto

La aplicación incluye vistas completas para cada módulo del dashboard, con diseño responsive y navegación por secciones:

- Dashboard
- Planificación Cloud
- Costos
- Infraestructura
- Seguridad
- Arquitectura de Red
- Servicios AWS
- Vista responsive móvil y desktop

La estructura visual se compone de paneles, tarjetas, gráficas y filtros interactivos que hacen referencia a cada una de estas pantallas principales.

## Experiencia de usuario

La interfaz fue diseñada con un enfoque profesional y empresarial. Se incorporaron elementos como:

- transiciones suaves
- estados hover
- notificaciones visuales
- selector de regiones
- búsqueda y filtros
- tarjetas de resultados
- diseño adaptativo para dispositivos móviles y escritorio

Todo esto ayuda a que la interfaz se perciba como una consola real de administración Cloud, y no como una maqueta estática.

## Objetivo del proyecto

Cloud Foundations busca servir como una herramienta de demostración para entender cómo se presenta una solución Cloud desde una perspectiva técnica, financiera y operativa. Es ideal para presentar conceptos de arquitectura, costos, seguridad, servicios y diseño de infraestructura de manera visual y clara.

## Autor

Proyecto desarrollado como dashboard de arquitectura Cloud para visión estratégica, operativa y de costos.
