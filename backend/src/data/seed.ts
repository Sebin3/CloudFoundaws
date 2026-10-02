import type {
  CloudService,
  CostItem,
  InfrastructureResource,
  MonitoringSample,
  NotificationItem,
  Region,
  SecurityCheck,
  SecurityDetail,
} from '../types.js'

export const services: CloudService[] = [
  {
    id: 'ec2',
    name: 'Amazon EC2',
    shortName: 'EC2',
    category: 'Compute',
    description: 'Servidores virtuales escalables para ejecutar aplicaciones.',
    purpose: 'Capa de aplicación y procesamiento',
    status: 'En uso',
    icon: 'dns',
    iconTone: 'info',
  },
  {
    id: 's3',
    name: 'Amazon S3',
    shortName: 'S3',
    category: 'Storage',
    description: 'Almacenamiento de objetos con alta durabilidad.',
    purpose: 'Archivos, respaldos y contenido estático',
    status: 'En uso',
    icon: 'database',
    iconTone: 'success',
  },
  {
    id: 'rds',
    name: 'Amazon RDS',
    shortName: 'RDS',
    category: 'Database',
    description: 'Base de datos relacional administrada y segura.',
    purpose: 'Persistencia de datos transaccionales',
    status: 'En uso',
    icon: 'storage',
    iconTone: 'warning',
  },
  {
    id: 'iam',
    name: 'AWS IAM',
    shortName: 'IAM',
    category: 'Security',
    description: 'Control de identidades, roles y permisos de acceso.',
    purpose: 'Gobierno de acceso y cuentas',
    status: 'En uso',
    icon: 'admin_panel_settings',
    iconTone: 'success',
  },
  {
    id: 'vpc',
    name: 'Amazon VPC',
    shortName: 'VPC',
    category: 'Networking',
    description: 'Red virtual aislada para controlar el tráfico Cloud.',
    purpose: 'Segmentación y conectividad privada',
    status: 'En uso',
    icon: 'hub',
    iconTone: 'info',
  },
  {
    id: 'route53',
    name: 'Amazon Route 53',
    shortName: 'Route 53',
    category: 'Networking',
    description: 'Servicio DNS administrado con alta disponibilidad.',
    purpose: 'Resolución de dominios y routing',
    status: 'Disponible',
    icon: 'language',
    iconTone: 'neutral',
  },
  {
    id: 'cloudfront',
    name: 'Amazon CloudFront',
    shortName: 'CloudFront',
    category: 'Delivery',
    description: 'Red de distribución de contenido de baja latencia.',
    purpose: 'Entrega global de contenido',
    status: 'En uso',
    icon: 'public',
    iconTone: 'info',
  },
]

export const costItems: CostItem[] = [
  { service: 'Amazon EC2', category: 'Compute', quantity: 3, hours: 720, monthly: 184, annual: 2208, icon: 'dns', iconTone: 'info' },
  { service: 'Amazon RDS', category: 'Database', quantity: 1, hours: 720, monthly: 96, annual: 1152, icon: 'storage', iconTone: 'warning' },
  { service: 'Amazon S3', category: 'Storage', quantity: 2, hours: 720, monthly: 42, annual: 504, icon: 'database', iconTone: 'success' },
  { service: 'CloudFront', category: 'Delivery', quantity: 1, hours: 720, monthly: 31, annual: 372, icon: 'public', iconTone: 'info' },
  { service: 'Route 53', category: 'Networking', quantity: 1, hours: 720, monthly: 16, annual: 192, icon: 'language', iconTone: 'neutral' },
]

export const costTrend = [
  { month: 'Abr', cost: 286 },
  { month: 'May', cost: 302 },
  { month: 'Jun', cost: 318 },
  { month: 'Jul', cost: 341 },
  { month: 'Ago', cost: 352 },
  { month: 'Sep', cost: 369 },
]

export const costDistributionTemplate = [
  { name: 'Compute', value: 184, fill: '#2563eb' },
  { name: 'Database', value: 96, fill: '#f59e0b' },
  { name: 'Storage', value: 42, fill: '#16a34a' },
  { name: 'Delivery', value: 31, fill: '#7c3aed' },
  { name: 'Networking', value: 16, fill: '#64748b' },
]

export const usageProfiles = [
  { hours: 720, label: 'Operación continua', detail: '24/7 · 720 h/mes' },
  { hours: 176, label: 'Horario laboral', detail: '8×5 · 176 h/mes' },
  { hours: 80, label: 'Desarrollo', detail: 'Uso parcial · 80 h/mes' },
]

export const budget = 450

export const securityChecks: SecurityCheck[] = [
  { label: 'Modelo de responsabilidad compartida', detail: 'Controles Cloud configurados', status: 'Correcto', tone: 'success', icon: 'verified_user' },
  { label: 'Identidades y accesos IAM', detail: 'Roles con mínimo privilegio', status: 'Correcto', tone: 'success', icon: 'manage_accounts' },
  { label: 'Protección de cuentas', detail: 'MFA pendiente en 1 usuario', status: 'Revisión', tone: 'warning', icon: 'lock_person' },
  { label: 'Protección de datos', detail: 'Cifrado activo en recursos', status: 'Correcto', tone: 'success', icon: 'encrypted' },
  { label: 'Cumplimiento', detail: '2 políticas requieren atención', status: 'Atención', tone: 'danger', icon: 'policy' },
]

export const securityDetails: Record<string, SecurityDetail> = {
  'Modelo de responsabilidad compartida': { scope: 'Seguridad de la nube y seguridad en la nube', coverage: 'Responsabilidades documentadas para la arquitectura actual.', action: 'Mantener la matriz de responsabilidades actualizada.' },
  'Identidades y accesos IAM': { scope: 'Roles, políticas y mínimo privilegio', coverage: 'Los accesos principales están asignados mediante roles.', action: 'Revisar permisos amplios durante la próxima auditoría.' },
  'Protección de cuentas': { scope: 'MFA, credenciales y acceso raíz', coverage: '1 usuario todavía requiere activar MFA.', action: 'Activar MFA y validar el acceso de emergencia.' },
  'Protección de datos': { scope: 'Cifrado, respaldos y exposición', coverage: 'El cifrado está activo en los recursos evaluados.', action: 'Conservar las llaves y políticas de respaldo vigentes.' },
  Cumplimiento: { scope: 'Políticas, evidencias y controles', coverage: '2 políticas necesitan revisión antes del cierre.', action: 'Asignar responsable y fecha a cada hallazgo.' },
}

export const regions: Region[] = [
  { name: 'US East (N. Virginia)', location: 'Estados Unidos', flag: '🇺🇸', code: 'us-east-1', services: ['EC2', 'S3', 'RDS', 'VPC'], resources: 48, availability: 'No calculada', status: 'Operativa', tone: 'success', lat: 38.5, lng: -78.44 },
  { name: 'EU (Ireland)', location: 'Irlanda', flag: '🇮🇪', code: 'eu-west-1', services: ['EC2', 'S3', 'CloudFront'], resources: 21, availability: 'No calculada', status: 'Operativa', tone: 'success', lat: 53.35, lng: -6.27 },
  { name: 'South America (São Paulo)', location: 'Brasil', flag: '🇧🇷', code: 'sa-east-1', services: ['S3', 'CloudFront'], resources: 9, availability: 'No calculada', status: 'Revisión', tone: 'warning', lat: -23.55, lng: -46.63 },
]

export const serviceNames: Record<string, string> = {
  EC2: 'Amazon EC2', S3: 'Amazon S3', RDS: 'Amazon RDS', VPC: 'Amazon VPC', CloudFront: 'Amazon CloudFront',
}

export function buildResources(region: Region): InfrastructureResource[] {
  const suffix = region.code.replaceAll('-', '').slice(-5)
  const all: InfrastructureResource[] = [
    { id: `i-${suffix}01`, name: 'app-server-01', service: 'EC2', zone: `${region.code}a`, state: 'En ejecución', metric: 'CPU 38%', icon: 'dns' },
    { id: `i-${suffix}02`, name: 'app-server-02', service: 'EC2', zone: `${region.code}b`, state: 'En ejecución', metric: 'CPU 24%', icon: 'dns' },
    { id: `db-${suffix}01`, name: 'cloudops-production', service: 'RDS', zone: `${region.code}a`, state: 'Disponible', metric: '64 conexiones', icon: 'storage' },
    { id: `bucket-${suffix}`, name: 'cloudops-assets', service: 'S3', zone: 'Regional', state: 'Activo', metric: '18.4 GB', icon: 'database' },
    { id: `vpc-${suffix}`, name: 'production-vpc', service: 'VPC', zone: region.code, state: 'Disponible', metric: '2 subredes', icon: 'hub' },
    { id: `dist-${suffix}`, name: 'web-distribution', service: 'CloudFront', zone: 'Global', state: 'Desplegado', metric: '42 ms', icon: 'public' },
  ]
  return all.filter((resource) => region.services.includes(resource.service))
}

export const networkNodes: Record<string, { title: string; layer: string; icon: string; endpoint: string; purpose: string; latency: string; address: string }> = {
  internet: { title: 'Internet', layer: 'Origen', icon: 'language', endpoint: 'Usuarios globales', purpose: 'Punto de origen del tráfico HTTPS de la aplicación.', latency: '—', address: '0.0.0.0/0' },
  route53: { title: 'Amazon Route 53', layer: 'DNS', icon: 'travel_explore', endpoint: 'app.cloudops.com', purpose: 'Resuelve el dominio público y dirige las solicitudes al CDN.', latency: '24 ms', address: 'Alias A/AAAA' },
  cloudfront: { title: 'Amazon CloudFront', layer: 'Edge', icon: 'public', endpoint: 'd2x-cloudfront.net', purpose: 'Entrega contenido desde ubicaciones de borde y protege el origen.', latency: '11 ms', address: 'HTTPS · TLS 1.3' },
  vpc: { title: 'Amazon VPC', layer: 'Red', icon: 'hub', endpoint: 'production-vpc', purpose: 'Aísla los recursos de aplicación y datos en subredes controladas.', latency: '2 ms', address: '10.0.0.0/16' },
  ec2: { title: 'Amazon EC2', layer: 'Aplicación', icon: 'dns', endpoint: 'app-server-asg', purpose: 'Procesa las solicitudes y ejecuta la aplicación.', latency: '4 ms', address: '10.0.1.0/24' },
  rds: { title: 'Amazon RDS', layer: 'Datos', icon: 'storage', endpoint: 'cloudops-production', purpose: 'Mantiene los datos transaccionales en una subred privada.', latency: '7 ms', address: '10.0.2.0/24' },
}

export const networkTrace: Array<{ key: string; step: string; destination: string; policy: string }> = [
  { key: 'internet', step: '01', destination: 'Entrada pública', policy: 'HTTPS :443' },
  { key: 'route53', step: '02', destination: 'Hosted Zone', policy: 'Alias routing' },
  { key: 'cloudfront', step: '03', destination: 'Distribución global', policy: 'WAF + TLS' },
  { key: 'vpc', step: '04', destination: 'VPC Producción', policy: 'IGW + Routes' },
  { key: 'ec2', step: '05A', destination: 'Subred aplicación', policy: 'SG web-app' },
  { key: 'rds', step: '05B', destination: 'Subred de datos', policy: 'SG database' },
]

export const networkMetrics = [
  { label: 'Estado del flujo', value: 'Operativo', detail: 'Validado hace 2 minutos', icon: 'check_circle', tone: 'bg-emerald-50 text-emerald-600' },
  { label: 'Latencia total', value: '42 ms', detail: 'Objetivo menor a 80 ms', icon: 'speed', tone: 'bg-blue-50 text-blue-600' },
  { label: 'Disponibilidad', value: 'Por definir', detail: 'Depende de la arquitectura', icon: 'monitor_heart', tone: 'bg-violet-50 text-violet-600' },
  { label: 'Controles', value: '8/9', detail: '1 ACL requiere revisión', icon: 'shield', tone: 'bg-amber-50 text-amber-600' },
]

export const networkVpc = {
  name: 'production-vpc',
  cidr: '10.0.0.0/16',
  region: 'us-east-1',
  zonesLabel: '2 Availability Zones',
  badges: [
    { label: 'Route Table asociada', tone: 'neutral' },
    { label: 'Security Groups activos', tone: 'success' },
  ],
  zones: [
    {
      id: 'az-a',
      label: 'Zona de disponibilidad A',
      code: 'us-east-1a',
      type: 'PÚBLICA',
      tone: 'blue',
      resourceKey: 'ec2',
      resourceIcon: 'dns',
      resourceTone: 'bg-orange-50 text-orange-600',
      resourceTitle: 'EC2 Auto Scaling Group',
      resourceSub: '3 instancias · 10.0.1.0/24',
      resourceState: 'Healthy',
      instances: ['i-0a31', 'i-0b72', 'i-0c18'],
    },
    {
      id: 'az-b',
      label: 'Zona de disponibilidad B',
      code: 'us-east-1b',
      type: 'PRIVADA',
      tone: 'emerald',
      resourceKey: 'rds',
      resourceIcon: 'storage',
      resourceTone: 'bg-emerald-50 text-emerald-600',
      resourceTitle: 'RDS PostgreSQL',
      resourceSub: 'Multi-AZ · 10.0.2.0/24',
      resourceState: 'Available',
      detail: {
        label: 'Acceso desde aplicación',
        value: 'Permitido :5432',
        progress: 64,
        caption: '64 conexiones activas de 100',
      },
    },
  ],
  warning: {
    title: '1 Network ACL requiere revisión',
    detail: 'La regla de salida temporal debe expirar antes del siguiente despliegue.',
  },
}

export const notifications: NotificationItem[] = [
  { id: 'n1', title: 'Propuesta guardada', detail: 'La solución quedó persistida en el backend.', tone: 'success' },
  { id: 'n2', title: 'Costos actualizados', detail: 'El presupuesto se recalculó con los últimos cambios.', tone: 'info' },
  { id: 'n3', title: 'Riesgos revisados', detail: '1 control requiere atención en seguridad.', tone: 'warning' },
]

export function nextMonitoringSample(previous: MonitoringSample): MonitoringSample {
  const jitter = Math.round(Math.random() * 12) - 6
  return {
    sample: previous.sample + 1,
    inbound: Math.max(8, Math.min(72, previous.inbound + jitter)),
    outbound: Math.max(4, Math.min(38, previous.outbound + Math.round(jitter / 2))),
    latency: Math.max(20, Math.min(75, 38 + Math.round(Math.random() * 18))),
  }
}

export function initialMonitoringSamples(count = 22): MonitoringSample[] {
  return Array.from({ length: count }, (_, index) => ({
    sample: index + 1,
    inbound: 18 + ((index * 7) % 26),
    outbound: 8 + ((index * 5) % 14),
    latency: 32 + ((index * 3) % 16),
  }))
}
