import type { Proposal, SecurityCheck, SecurityDetail, StatusTone } from '../types.js'

export type SecurityEvaluation = {
  checks: SecurityCheck[]
  details: Record<string, SecurityDetail>
  score: number
  target: number
  proposal: Proposal | null
}

type EvaluatedCheck = {
  label: string
  detail: string
  status: string
  tone: StatusTone
  icon: string
  scope: string
  coverage: string
  action: string
  points: number
}

const labels = {
  shared: 'Modelo de responsabilidad compartida',
  iam: 'Identidades y accesos IAM',
  accounts: 'Protección de cuentas',
  data: 'Protección de datos',
  compliance: 'Cumplimiento',
  continuity: 'Continuidad y disponibilidad',
} as const

function serviceSet(proposal: Proposal) {
  return new Set(proposal.selectedServices.map((service) => service.toLowerCase()))
}

function isHighAvailability(value: string) {
  const normalized = value.toLowerCase()
  return normalized.includes('alta') || normalized.includes('crítica') || normalized.includes('critica')
}

function createCheck(check: EvaluatedCheck): EvaluatedCheck {
  return check
}

export function evaluateSecurity(proposal: Proposal | null): SecurityEvaluation {
  if (!proposal) {
    return { checks: [], details: {}, score: 0, target: 90, proposal: null }
  }

  const services = serviceSet(proposal)
  const hasDataService = services.has('s3') || services.has('rds')
  const highAvailability = isHighAvailability(proposal.availability)
  const users = Number.parseInt(proposal.users, 10) || 0

  const evaluated: EvaluatedCheck[] = [
    createCheck({
      label: labels.shared,
      detail: 'La propuesta tiene responsabilidades identificables',
      status: 'Correcto',
      tone: 'success',
      icon: 'verified_user',
      scope: 'Seguridad de la nube y seguridad en la nube',
      coverage: `La solución ${proposal.solutionName} separa lo que debe cubrir la plataforma de lo que debe configurar el equipo del proyecto.`,
      action: 'Documentar responsables para identidad, red, datos y continuidad antes de implementar.',
      points: 20,
    }),
    createCheck({
      label: labels.iam,
      detail: services.has('iam') ? 'IAM fue incluido en la arquitectura' : 'IAM todavía no fue incluido',
      status: services.has('iam') ? 'Correcto' : 'Pendiente',
      tone: services.has('iam') ? 'success' : 'neutral',
      icon: 'manage_accounts',
      scope: 'Roles, políticas y mínimo privilegio',
      coverage: services.has('iam')
        ? 'La propuesta contempla IAM como componente de control de acceso.'
        : 'La propuesta no contempla todavía un servicio de identidades y accesos.',
      action: services.has('iam')
        ? 'Definir roles separados y conceder únicamente los permisos necesarios.'
        : 'Agregar IAM para administrar identidades, roles y permisos de la solución.',
      points: services.has('iam') ? 20 : 0,
    }),
    createCheck({
      label: labels.accounts,
      detail: users > 0 ? 'MFA y protección de cuentas no definidos' : 'No se definieron usuarios para evaluar',
      status: users > 0 ? 'Revisión' : 'Pendiente',
      tone: users > 0 ? 'warning' : 'neutral',
      icon: 'lock_person',
      scope: 'MFA, credenciales y acceso raíz',
      coverage: users > 0
        ? `La propuesta considera aproximadamente ${users.toLocaleString('es-PE')} usuarios, pero aún no define MFA ni el acceso de emergencia.`
        : 'La propuesta todavía no tiene una cantidad de usuarios que permita revisar la protección de cuentas.',
      action: 'Definir MFA, política de credenciales y un procedimiento para el acceso de emergencia.',
      points: 0,
    }),
    createCheck({
      label: labels.data,
      detail: hasDataService ? 'Cifrado y respaldos requieren definición' : 'No hay servicios de datos seleccionados',
      status: hasDataService ? 'Revisión' : 'Informativo',
      tone: hasDataService ? 'warning' : 'info',
      icon: 'encrypted',
      scope: 'Cifrado, respaldos y exposición',
      coverage: hasDataService
        ? 'La propuesta incluye almacenamiento o base de datos, pero el formulario aún no registra cifrado ni política de respaldos.'
        : 'No se han seleccionado S3 ni RDS; este control queda como referencia para una futura ampliación.',
      action: hasDataService
        ? 'Definir cifrado en reposo, cifrado en tránsito y frecuencia de respaldos.'
        : 'Revisar este control si la solución incorpora datos persistentes.',
      points: hasDataService ? 0 : 10,
    }),
    createCheck({
      label: labels.compliance,
      detail: 'Requisitos de cumplimiento pendientes de definir',
      status: 'Revisión',
      tone: 'warning',
      icon: 'policy',
      scope: 'Políticas, evidencias y controles',
      coverage: `La propuesta está ubicada en ${proposal.region}, pero aún no especifica requisitos normativos o políticas de retención.`,
      action: 'Definir el marco de cumplimiento, la retención de datos y las evidencias que deberán conservarse.',
      points: 0,
    }),
    createCheck({
      label: labels.continuity,
      detail: highAvailability ? 'La redundancia de la propuesta requiere revisión' : 'Disponibilidad estándar planificada',
      status: highAvailability ? 'Revisión' : 'Informativo',
      tone: highAvailability ? 'warning' : 'info',
      icon: 'sync_lock',
      scope: 'Región, redundancia y recuperación ante fallos',
      coverage: highAvailability
        ? `La solución solicita ${proposal.availability}, pero actualmente solo registra una región: ${proposal.region}.`
        : `La propuesta solicita ${proposal.availability} en ${proposal.region}; no se ha definido una estrategia de redundancia adicional.`,
      action: highAvailability
        ? 'Definir una segunda zona o región, respaldos y procedimiento de recuperación ante fallos.'
        : 'Documentar el tiempo de recuperación esperado y el respaldo mínimo de la solución.',
      points: highAvailability ? 0 : 10,
    }),
  ]

  const checks = evaluated.map(({ scope, coverage, action, points: _points, ...check }) => check)
  const details = Object.fromEntries(evaluated.map(({ label, scope, coverage, action }) => [label, { scope, coverage, action }]))
  const score = evaluated.reduce((total, check) => total + check.points, 0)

  return { checks, details, score, target: 90, proposal }
}
