import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { CloudService, Region } from '../types/cloud'
import { api, type DeploymentConfiguration, type DeploymentLocation, type Proposal } from '../api/client'
import { Icon } from '../components/Icon'
import { ApiError, ApiLoading } from '../components/ApiState'
import { Toast } from '../components/Toast'
import { useToast } from '../hooks/useToast'

type SolutionForm = {
  solutionName: string
  applicationType: string
  description: string
  region: string
  users: string
  availability: string
  objective: string
  selectedServices: string[]
  deploymentConfiguration: DeploymentConfiguration
}

const createLocation = (region = 'us-east-1', id = `location-${Date.now()}`): DeploymentLocation => ({
  id,
  region,
  administrativeArea: '',
  city: '',
  district: '',
  servers: 1,
  availabilityZones: 1,
  role: 'primary',
})

const createDeploymentConfiguration = (): DeploymentConfiguration => ({
  mode: 'single-region',
  trafficStrategy: 'active-passive',
  replication: 'none',
  failover: 'manual',
  locations: [],
})

const initialForm: SolutionForm = {
  solutionName: '',
  applicationType: 'Web empresarial',
  description: '',
  region: '',
  users: '',
  availability: 'Alta disponibilidad',
  objective: 'Modernización',
  selectedServices: [],
  deploymentConfiguration: createDeploymentConfiguration(),
}

const controlClasses = 'planning-control'

type SelectOption = { value: string; label: string; description?: string }

const applicationOptions: SelectOption[] = [
  { value: 'Web empresarial', label: 'Web empresarial', description: 'Aplicación para equipos y clientes' },
  { value: 'API / Backend', label: 'API / Backend', description: 'Servicios y lógica de negocio' },
  { value: 'Aplicación móvil', label: 'Aplicación móvil', description: 'Backend para dispositivos móviles' },
  { value: 'Procesamiento de datos', label: 'Procesamiento de datos', description: 'Flujos y cargas analíticas' },
]

const availabilityOptions: SelectOption[] = [
  { value: 'Estándar', label: 'Estándar', description: 'Operación regular de la solución' },
  { value: 'Alta disponibilidad', label: 'Alta disponibilidad', description: 'Redundancia y continuidad recomendadas' },
  { value: 'Crítica', label: 'Crítica', description: 'Recuperación prioritaria ante fallos' },
]

const objectiveOptions: SelectOption[] = [
  { value: 'Modernización', label: 'Modernización', description: 'Actualizar la plataforma actual' },
  { value: 'Reducción de costos', label: 'Reducción de costos', description: 'Optimizar el gasto operativo' },
  { value: 'Continuidad operativa', label: 'Continuidad operativa', description: 'Mantener el servicio disponible' },
  { value: 'Escalabilidad', label: 'Escalabilidad', description: 'Preparar el crecimiento de la demanda' },
]

const deploymentModeOptions: SelectOption[] = [
  { value: 'single-region', label: 'Una región', description: 'Todos los servidores en una ubicación' },
  { value: 'multi-region', label: 'Varias regiones', description: 'Distribución entre países y continentes' },
]

const trafficOptions: SelectOption[] = [
  { value: 'active-passive', label: 'Activo / respaldo', description: 'Una ubicación atiende y las otras esperan' },
  { value: 'active-active', label: 'Activo / activo', description: 'Varias ubicaciones atienden tráfico' },
]

const replicationOptions: SelectOption[] = [
  { value: 'none', label: 'Sin replicación', description: 'Solo se planifica la capacidad' },
  { value: 'scheduled-backup', label: 'Respaldos programados', description: 'Copias periódicas para recuperación' },
  { value: 'cross-region', label: 'Replicación entre regiones', description: 'Datos sincronizados entre ubicaciones' },
]

const failoverOptions: SelectOption[] = [
  { value: 'manual', label: 'Failover manual', description: 'Un responsable cambia el tráfico' },
  { value: 'automatic', label: 'Failover automático', description: 'La plataforma cambia al respaldo' },
]

const roleOptions: SelectOption[] = [
  { value: 'primary', label: 'Principal', description: 'Ubicación que atiende la operación' },
  { value: 'replica', label: 'Réplica', description: 'Copia operativa de otra ubicación' },
  { value: 'backup', label: 'Respaldo', description: 'Se activa ante una interrupción' },
]

type RegionLocationDefaults = Pick<DeploymentLocation, 'administrativeArea' | 'city' | 'district'>

const regionLocationDefaults: Record<string, RegionLocationDefaults> = {
  'pe-lima-1': { administrativeArea: 'Lima', city: 'Lima', district: '' },
  'pe-arequipa-1': { administrativeArea: 'Arequipa', city: 'Arequipa', district: '' },
  'pe-la-libertad-1': { administrativeArea: 'La Libertad', city: 'Trujillo', district: '' },
  'us-east-1': { administrativeArea: 'Virginia', city: 'Ashburn', district: 'Norte de Virginia' },
  'us-east-2': { administrativeArea: 'Ohio', city: 'Columbus', district: '' },
  'us-west-1': { administrativeArea: 'California', city: 'San Francisco', district: 'Norte de California' },
  'us-west-2': { administrativeArea: 'Oregón', city: 'Boardman', district: '' },
  'ca-central-1': { administrativeArea: 'Quebec', city: 'Montreal', district: '' },
  'ca-west-1': { administrativeArea: 'Alberta', city: 'Calgary', district: '' },
  'sa-east-1': { administrativeArea: 'São Paulo', city: 'São Paulo', district: '' },
  'eu-west-1': { administrativeArea: 'Leinster', city: 'Dublín', district: '' },
  'eu-west-2': { administrativeArea: 'Inglaterra', city: 'Londres', district: '' },
  'eu-west-3': { administrativeArea: 'Isla de Francia', city: 'París', district: '' },
  'eu-central-1': { administrativeArea: 'Hesse', city: 'Fráncfort', district: '' },
  'eu-central-2': { administrativeArea: 'Zúrich', city: 'Zúrich', district: '' },
  'eu-south-1': { administrativeArea: 'Lombardía', city: 'Milán', district: '' },
  'eu-south-2': { administrativeArea: 'Aragón', city: 'Zaragoza', district: '' },
  'eu-north-1': { administrativeArea: 'Condado de Estocolmo', city: 'Estocolmo', district: '' },
  'ap-southeast-1': { administrativeArea: 'Singapore', city: 'Singapore', district: '' },
  'ap-southeast-2': { administrativeArea: 'Nueva Gales del Sur', city: 'Sídney', district: '' },
  'ap-southeast-3': { administrativeArea: 'Yakarta', city: 'Yakarta', district: '' },
  'ap-southeast-4': { administrativeArea: 'Victoria', city: 'Melbourne', district: '' },
  'ap-southeast-5': { administrativeArea: 'Selangor', city: 'Kuala Lumpur', district: '' },
  'ap-southeast-6': { administrativeArea: 'Auckland', city: 'Auckland', district: '' },
  'ap-southeast-7': { administrativeArea: 'Bangkok', city: 'Bangkok', district: '' },
  'ap-northeast-1': { administrativeArea: 'Tokio', city: 'Tokio', district: '' },
  'ap-northeast-2': { administrativeArea: 'Seúl', city: 'Seúl', district: '' },
  'ap-northeast-3': { administrativeArea: 'Osaka', city: 'Osaka', district: '' },
  'ap-south-1': { administrativeArea: 'Maharashtra', city: 'Mumbai', district: '' },
  'ap-south-2': { administrativeArea: 'Telangana', city: 'Hyderabad', district: '' },
  'ap-east-1': { administrativeArea: 'Hong Kong', city: 'Hong Kong', district: '' },
  'ap-east-2': { administrativeArea: 'Taipei', city: 'Taipéi', district: '' },
  'af-south-1': { administrativeArea: 'Cabo Occidental', city: 'Ciudad del Cabo', district: '' },
  'me-south-1': { administrativeArea: 'Capital', city: 'Manama', district: '' },
  'me-central-1': { administrativeArea: 'Dubái', city: 'Dubái', district: '' },
  'il-central-1': { administrativeArea: 'Distrito de Tel Aviv', city: 'Tel Aviv', district: '' },
  'mx-central-1': { administrativeArea: 'Querétaro', city: 'Querétaro', district: '' },
}

const getRegionLocationDefaults = (region?: Region): RegionLocationDefaults => {
  if (!region) return { administrativeArea: '', city: '', district: '' }
  return regionLocationDefaults[region.code] ?? { administrativeArea: region.location, city: '', district: '' }
}

function PlanningCard({ title, subtitle, action, children, className = '' }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`planning-card w-full max-w-full min-w-0 p-5 sm:p-6 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold tracking-[-0.02em] text-slate-800">{title}</h3>
          {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function FormField({ label, id, hint, children }: { label: string; id: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="planning-form-label text-sm font-bold text-slate-700">{label}<span className="planning-required ml-1">*</span></label>
        {hint && <span className="planning-form-hint text-[11px] text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function PlanningSelect({ id, value, options, onChange }: { id: string; value: string; options: SelectOption[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    const closeOnPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnPointerDown)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnPointerDown)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`planning-select ${open ? 'is-open' : ''}`}>
      <button id={id} type="button" className="planning-select-trigger" aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-options`} onClick={() => setOpen((current) => !current)}>
        <span className="planning-select-value"><strong>{selected?.label}</strong>{selected?.description && <small>{selected.description}</small>}</span>
        <Icon name="expand_more" className="planning-select-arrow text-[19px]" />
      </button>
      {open && <div id={`${id}-options`} className="planning-select-menu" role="listbox" aria-labelledby={id}>{options.map((option) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} className={`planning-select-option ${option.value === value ? 'is-selected' : ''}`} onClick={() => { onChange(option.value); setOpen(false) }}><span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span></button>)}</div>}
    </div>
  )
}

function ServiceIcon({ tone, icon }: { tone: string; icon: string }) {
  const classes = tone === 'warning' ? 'bg-amber-50 text-amber-600' : tone === 'success' ? 'bg-emerald-50 text-emerald-600' : tone === 'neutral' ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'
  return <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${classes}`}><Icon name={icon} className="text-[19px]" /></div>
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return <div className="planning-summary-item"><dt>{label}</dt><dd>{value}</dd></div>
}

function LocationRow({
  location,
  regions,
  canRemove,
  onChange,
  onRemove,
}: {
  location: DeploymentLocation
  regions: Region[]
  canRemove: boolean
  onChange: (patch: Partial<DeploymentLocation>) => void
  onRemove: () => void
}) {
  const regionOptions = regions.map((region) => ({ value: region.code, label: region.code, description: `${region.location} · ${region.name}` }))
  const handleRegionChange = (value: string) => {
    const region = regions.find((item) => item.code === value)
    onChange({ region: value, ...getRegionLocationDefaults(region) })
  }
  return (
    <article className="planning-location-row">
      <div className="planning-location-heading">
        <div>
          <span className="planning-preview-kicker">Ubicación {location.role === 'primary' ? 'principal' : 'adicional'}</span>
          <strong>{regions.find((region) => region.code === location.region)?.location ?? location.region}</strong>
        </div>
        {canRemove && <button type="button" className="planning-icon-button" aria-label="Quitar ubicación" onClick={onRemove}><Icon name="delete" className="text-[18px]" /></button>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Región cloud" id={`${location.id}-region`}>
          <PlanningSelect id={`${location.id}-region`} value={location.region} options={regionOptions} onChange={handleRegionChange} />
        </FormField>
        <FormField label="Rol de la ubicación" id={`${location.id}-role`}>
          <PlanningSelect id={`${location.id}-role`} value={location.role} options={roleOptions} onChange={(value) => onChange({ role: value as DeploymentLocation['role'] })} />
        </FormField>
        <FormField label="Departamento / estado" id={`${location.id}-area`} hint="Propio de la simulación">
          <input id={`${location.id}-area`} value={location.administrativeArea} onChange={(event) => onChange({ administrativeArea: event.target.value })} placeholder="Ej. Lima o Virginia" className={controlClasses} />
        </FormField>
        <FormField label="Ciudad" id={`${location.id}-city`}>
          <input id={`${location.id}-city`} value={location.city} onChange={(event) => onChange({ city: event.target.value })} placeholder="Ej. Lima o Ashburn" className={controlClasses} />
        </FormField>
        <FormField label="Distrito / zona" id={`${location.id}-district`} hint="Opcional">
          <input id={`${location.id}-district`} value={location.district} onChange={(event) => onChange({ district: event.target.value })} placeholder="Ej. San Isidro o Norte de Virginia" className={controlClasses} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Servidores" id={`${location.id}-servers`}>
            <input id={`${location.id}-servers`} min="1" max="99" type="number" value={location.servers} onChange={(event) => onChange({ servers: Math.max(1, Number(event.target.value) || 1) })} className={controlClasses} />
          </FormField>
          <FormField label="Zonas / sitios" id={`${location.id}-zones`}>
            <input id={`${location.id}-zones`} min="1" max="9" type="number" value={location.availabilityZones} onChange={(event) => onChange({ availabilityZones: Math.max(1, Number(event.target.value) || 1) })} className={controlClasses} />
          </FormField>
        </div>
      </div>
    </article>
  )
}

export function Planning() {
  const [isCompactViewport, setIsCompactViewport] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1180)
  const [services, setServices] = useState<CloudService[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [form, setForm] = useState<SolutionForm>(initialForm)
  const [activeProposal, setActiveProposal] = useState<Proposal | null>(null)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [planningLoading, setPlanningLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [stepError, setStepError] = useState<string | null>(null)
  const { toast, show, dismiss } = useToast()

  const refreshPlanning = useCallback(async () => {
    try {
      await api.getPlanning()
      setError(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo conectar con el backend')
    } finally {
      setPlanningLoading(false)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const [servicesResult, regionsResult] = await Promise.all([api.getServices(), api.getRegions()])
        setServices(servicesResult.services)
        setRegions(regionsResult.regions)
        // Planificación siempre inicia como un borrador nuevo. Las propuestas
        // guardadas se consultan desde Dashboard, Costos, Seguridad y Red.
        setActiveProposal(null)
        setError(null)
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'No se pudo conectar con el backend')
      } finally {
        setCatalogLoading(false)
        setPlanningLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const syncViewport = () => setIsCompactViewport(window.innerWidth < 1180)
    window.addEventListener('resize', syncViewport)
    syncViewport()
    return () => window.removeEventListener('resize', syncViewport)
  }, [])

  const selectedServices = useMemo(() => services.filter((service) => form.selectedServices.includes(service.id)), [form.selectedServices, services])
  const proposalPreview = activeProposal ?? form
  const proposalServices = useMemo(
    () => services.filter((service) => proposalPreview.selectedServices.includes(service.id)),
    [proposalPreview.selectedServices, services],
  )
  const deploymentLocations = proposalPreview.deploymentConfiguration.locations
  const primaryDeploymentLocation = deploymentLocations.find((location) => location.role === 'primary') ?? deploymentLocations[0]
  const primaryRegionCode = primaryDeploymentLocation?.region ?? form.region
  const selectedRegion = regions.find((region) => region.code === primaryRegionCode)
  const savedRegion = regions.find((region) => region.code === proposalPreview.region) ?? regions[0]
  const activeRegion = regions.find((region) => region.code === primaryDeploymentLocation?.region) ?? (activeProposal ? savedRegion : selectedRegion)
  const totalServers = deploymentLocations.reduce((total, location) => total + location.servers, 0)

  const clearActive = () => {
    setActiveProposal(null)
    // Limpiar el borrador no debe desactivar la última propuesta guardada.
    // Dashboard, Costos, Seguridad e Infraestructura siguen trabajando con
    // esa propuesta hasta que el usuario seleccione otra o la elimine.
  }

  const updateField = <K extends keyof SolutionForm>(field: K, value: SolutionForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
    setStepError(null)
    if (activeProposal) clearActive()
  }

  const updateDeployment = (patch: Partial<DeploymentConfiguration>) => {
    setForm((current) => ({ ...current, deploymentConfiguration: { ...current.deploymentConfiguration, ...patch } }))
    setStepError(null)
    if (activeProposal) clearActive()
  }

  const updateLocation = (id: string, patch: Partial<DeploymentLocation>) => {
    setForm((current) => ({
      ...current,
      deploymentConfiguration: {
        ...current.deploymentConfiguration,
        locations: current.deploymentConfiguration.locations.map((location) => location.id === id ? { ...location, ...patch } : location),
      },
    }))
    setStepError(null)
    if (activeProposal) clearActive()
  }

  const addLocation = () => {
    const nextRegion = regions.find((region) => region.code !== primaryRegionCode) ?? regions[0]
    const location = createLocation(nextRegion?.code ?? 'us-east-1')
    updateDeployment({ mode: 'multi-region', locations: [...form.deploymentConfiguration.locations, { ...location, ...getRegionLocationDefaults(nextRegion) }] })
  }

  const removeLocation = (id: string) => {
    if (form.deploymentConfiguration.locations.length <= 1) return
    updateDeployment({ locations: form.deploymentConfiguration.locations.filter((location) => location.id !== id) })
  }

  const goToNextStep = () => {
    if (currentStep === 1) {
      if (!form.solutionName.trim() || !form.users || !form.description.trim()) {
        setStepError('Completa el nombre, los usuarios y la descripción antes de continuar.')
        return
      }
      setStepError(null)
      setCurrentStep(2)
      return
    }
    if (currentStep === 2) {
      if (form.deploymentConfiguration.locations.length === 0) {
        setStepError('Agrega al menos una ubicación para continuar.')
        return
      }
      setStepError(null)
      setCurrentStep(3)
    }
  }

  const goToPreviousStep = () => {
    setStepError(null)
    setCurrentStep((step) => (step === 3 ? 2 : 1))
  }

  const toggleService = (id: string) => {
    const nextServices = form.selectedServices.includes(id)
      ? form.selectedServices.filter((serviceId) => serviceId !== id)
      : [...form.selectedServices, id]
    updateField('selectedServices', nextServices)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    try {
      const result = await api.createProposal({ ...form, region: primaryRegionCode, selectedServices: [...form.selectedServices] })
      setActiveProposal(result.proposal)
      setError(null)
      show('La propuesta se creó correctamente.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar la propuesta')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setForm({ ...initialForm, deploymentConfiguration: createDeploymentConfiguration() })
    setCurrentStep(1)
    setStepError(null)
    if (activeProposal) clearActive()
  }

  if (catalogLoading || planningLoading) {
    return <ApiLoading label="Cargando propuestas y catálogo" />
  }

  if (error && (services.length === 0 || regions.length === 0)) {
    return <ApiError message={error} title="No hay datos de planificación todavía" description="La planificación aparecerá cuando el catálogo esté disponible." onRetry={() => { setCatalogLoading(true); setPlanningLoading(true); setError(null); refreshPlanning() }} />
  }

  return (
    <div className="planning-page flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-blue-600">Planificación Cloud</p>
        <h2 className="text-3xl font-bold tracking-[-0.045em] text-slate-800 sm:text-[32px]">Diseña tu propuesta cloud</h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-500">Define dónde se alojará la solución, qué servicios necesita y cómo debería mantenerse.</p>
      </header>

      {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">{error}</div>}

      <div className={`grid min-w-0 items-start gap-5 ${isCompactViewport ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <PlanningCard title="Crear propuesta cloud" subtitle="Completa los datos para definir la arquitectura que quieres planificar.">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="planning-form-overview" aria-label="Pasos de la planificación">
              <div className="planning-form-overview-title"><Icon name="edit_note" className="text-[19px]" /><span>Ruta de planificación</span></div>
              <div className="planning-step-list"><span className={`planning-step ${currentStep === 1 ? 'is-current' : ''} ${currentStep > 1 ? 'is-complete' : ''}`}><b>01</b><span>Contexto</span></span><span className="planning-step-divider" /><span className={`planning-step ${currentStep === 2 ? 'is-current' : ''} ${currentStep > 2 ? 'is-complete' : ''}`}><b>02</b><span>Distribución</span></span><span className="planning-step-divider" /><span className={`planning-step ${currentStep === 3 ? 'is-current' : ''}`}><b>03</b><span>Servicios</span></span></div>
            </div>
            {stepError && <div role="alert" className="planning-step-error"><Icon name="info" className="text-[17px]" /><span>{stepError}</span></div>}
            {currentStep === 1 && <>
              <div className="planning-form-section-heading"><span className="planning-form-section-number">01</span><div><h4>Datos de la solución</h4><p>Identifica qué vas a construir y para quién.</p></div></div>
              <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2"><FormField label="Nombre de la solución" id="solution-name"><input id="solution-name" required value={form.solutionName} onChange={(event) => updateField('solutionName', event.target.value)} placeholder="Ej. Plataforma e-commerce Nova" className={controlClasses} /></FormField></div>
              <FormField label="Tipo de aplicación" id="application-type"><PlanningSelect id="application-type" value={form.applicationType} options={applicationOptions} onChange={(value) => updateField('applicationType', value)} /></FormField>
              <FormField label="Usuarios previstos" id="users" hint="Usuarios activos al mes"><input id="users" required min="1" type="number" value={form.users} onChange={(event) => updateField('users', event.target.value)} className={controlClasses} /></FormField>
              <FormField label="Disponibilidad requerida" id="availability"><PlanningSelect id="availability" value={form.availability} options={availabilityOptions} onChange={(value) => updateField('availability', value)} /></FormField>
              <div className="md:col-span-2"><FormField label="Descripción" id="description"><textarea id="description" required value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Describe el contexto, las necesidades y el alcance de la solución." className={`${controlClasses} min-h-32 resize-y leading-6`} /></FormField></div>
              <div className="md:col-span-2"><FormField label="Objetivo de la migración" id="objective"><PlanningSelect id="objective" value={form.objective} options={objectiveOptions} onChange={(value) => updateField('objective', value)} /></FormField></div>
              </div>
              <div className="planning-step-actions planning-step-actions-end"><button type="button" onClick={goToNextStep} className="planning-step-button planning-step-button-primary">Continuar<Icon name="arrow_forward" className="text-[17px]" /></button></div>
            </>}

            {currentStep === 2 && <section className="planning-deployment-section" aria-labelledby="deployment-title">
              <div className="planning-section-heading">
                <div>
                  <span className="planning-preview-kicker">Arquitectura global</span>
                  <h4 id="deployment-title">Distribución de infraestructura</h4>
                  <p>Define en qué regiones y sedes se planificarán los servidores.</p>
                </div>
                <span className="planning-section-count"><Icon name="public" className="text-[16px]" />{form.deploymentConfiguration.locations.length} ubicaciones</span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Alcance geográfico" id="deployment-mode"><PlanningSelect id="deployment-mode" value={form.deploymentConfiguration.mode} options={deploymentModeOptions} onChange={(value) => updateDeployment({ mode: value as DeploymentConfiguration['mode'] })} /></FormField>
                <FormField label="Distribución del tráfico" id="traffic-strategy"><PlanningSelect id="traffic-strategy" value={form.deploymentConfiguration.trafficStrategy} options={trafficOptions} onChange={(value) => updateDeployment({ trafficStrategy: value as DeploymentConfiguration['trafficStrategy'] })} /></FormField>
                <FormField label="Replicación de datos" id="replication"><PlanningSelect id="replication" value={form.deploymentConfiguration.replication} options={replicationOptions} onChange={(value) => updateDeployment({ replication: value as DeploymentConfiguration['replication'] })} /></FormField>
                <FormField label="Cambio ante fallos" id="failover"><PlanningSelect id="failover" value={form.deploymentConfiguration.failover} options={failoverOptions} onChange={(value) => updateDeployment({ failover: value as DeploymentConfiguration['failover'] })} /></FormField>
              </div>

              <div className="planning-location-list">
                {form.deploymentConfiguration.locations.map((location) => <LocationRow key={location.id} location={location} regions={regions} canRemove={form.deploymentConfiguration.locations.length > 1} onChange={(patch) => updateLocation(location.id, patch)} onRemove={() => removeLocation(location.id)} />)}
              </div>
              <button type="button" className="planning-add-location" onClick={addLocation}><Icon name="add" className="text-[18px]" />Agregar ubicación</button>
              <div className="planning-step-actions"><button type="button" onClick={goToPreviousStep} className="planning-step-button planning-step-button-secondary"><Icon name="arrow_back" className="text-[17px]" />Atrás</button><button type="button" onClick={goToNextStep} className="planning-step-button planning-step-button-primary">Continuar<Icon name="arrow_forward" className="text-[17px]" /></button></div>
            </section>}

            {currentStep === 3 && <div className="planning-services-section border-t border-slate-100 pt-6">
              <div className="planning-form-section-heading"><span className="planning-form-section-number">03</span><div><h4>Servicios Cloud</h4><p>Selecciona los componentes que formarán parte de la arquitectura.</p></div><span className="planning-section-count">{selectedServices.length} seleccionados</span></div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {services.map((service) => {
                  const isSelected = form.selectedServices.includes(service.id)
                  return <button type="button" aria-pressed={isSelected} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 ${isSelected ? 'border-blue-200 bg-blue-50/70 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'}`} key={service.id} onClick={() => toggleService(service.id)}><ServiceIcon tone={service.iconTone} icon={service.icon} /><span className="min-w-0 flex-1"><strong className="block truncate text-sm font-bold text-slate-800">{service.name}</strong><span className="mt-0.5 block text-xs text-slate-400">{service.category}</span>{isSelected && <span className="mt-1.5 block text-[11px] leading-5 text-slate-600">{service.description}</span>}</span><Icon name={isSelected ? 'check_circle' : 'add_circle_outline'} className={`text-[20px] ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} /></button>
                })}
              </div>
              <div className="planning-step-actions"><button type="button" onClick={goToPreviousStep} className="planning-step-button planning-step-button-secondary"><Icon name="arrow_back" className="text-[17px]" />Atrás</button><button type="submit" disabled={selectedServices.length === 0 || saving} className="planning-step-button planning-step-button-primary"><Icon name={saving ? 'cloud_sync' : 'save'} className={`text-[18px] ${saving ? 'animate-spin' : ''}`} />{saving ? 'Guardando...' : 'Guardar propuesta'}</button></div>
            </div>}

            <div className="planning-form-footer"><span>La propuesta quedará guardada para revisar costos y distribución.</span><button type="button" onClick={handleReset} className="planning-reset-button">Limpiar formulario</button></div>
          </form>
        </PlanningCard>

        <div className={`flex w-full min-w-0 max-w-full flex-col gap-5 ${isCompactViewport ? '' : 'sticky top-24'}`}>
          <PlanningCard title={activeProposal ? 'Propuesta guardada' : 'Vista previa'} subtitle={activeProposal ? 'La configuración está lista para revisar.' : 'Resumen de la configuración actual.'} action={<span className={`planning-status-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${activeProposal ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><Icon name={activeProposal ? 'check_circle' : 'edit_note'} className="text-[14px]" />{activeProposal ? 'Guardada' : 'Borrador'}</span>}>
            <div className="planning-preview-hero">
              <div className="planning-preview-heading"><div className="planning-preview-icon"><Icon name="cloud_queue" className="text-[23px]" /></div><div className="min-w-0"><span className="planning-preview-kicker">{activeProposal ? 'Propuesta activa' : 'Borrador actual'}</span><strong className="planning-preview-name">{proposalPreview.solutionName || 'Nueva propuesta cloud'}</strong><span className="planning-preview-context">{proposalPreview.applicationType} · {activeRegion?.name ?? 'Región sin definir'}</span></div></div>
              <dl className="planning-summary-grid"><SummaryItem label="Región principal" value={primaryRegionCode || 'Sin definir'} /><SummaryItem label="Ubicaciones" value={`${deploymentLocations.length}`} /><SummaryItem label="Servidores" value={`${totalServers}`} /><SummaryItem label="Estrategia" value={deploymentLocations.length > 0 ? (proposalPreview.deploymentConfiguration.trafficStrategy === 'active-active' ? 'Activo / activo' : 'Activo / respaldo') : 'Sin definir'} /></dl>
              <div className="planning-preview-description"><span>Descripción</span><p>{proposalPreview.description || 'Añade una descripción para completar la propuesta.'}</p></div>
            </div>

            <div className="planning-preview-distribution">
              <div className="flex items-center justify-between gap-3"><div><p className="planning-preview-kicker">Distribución</p><h4 className="mt-1 text-base font-bold text-slate-800">Ubicaciones planificadas</h4></div><span className="planning-services-count">{totalServers}</span></div>
              <div className="planning-distribution-list">{deploymentLocations.length > 0 ? deploymentLocations.map((location) => { const region = regions.find((item) => item.code === location.region); return <div className="planning-distribution-item" key={location.id}><span className="planning-distribution-marker"><Icon name={location.role === 'primary' ? 'star' : location.role === 'backup' ? 'backup' : 'sync'} className="text-[16px]" /></span><div className="min-w-0 flex-1"><strong>{region?.location ?? location.region}</strong><span>{region?.name ?? 'Región seleccionada'}{location.city ? ` · ${location.city}` : ''}</span></div><em>{location.servers} {location.servers === 1 ? 'servidor' : 'servidores'}</em></div> }) : <p className="planning-preview-empty">Agrega una ubicación para definir la región y los servidores.</p>}</div>
            </div>

            <div className="planning-preview-services"><div className="flex items-center justify-between gap-3"><div><p className="planning-preview-kicker">Arquitectura</p><h4 className="mt-1 text-base font-bold text-slate-800">Servicios incluidos</h4></div><span className="planning-services-count">{proposalServices.length}</span></div><div className="planning-preview-service-list">{proposalServices.length > 0 ? proposalServices.map((service) => <div className="planning-preview-service" key={service.id}><ServiceIcon tone={service.iconTone} icon={service.icon} /><div className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-700">{service.name}</span><span className="mt-1 block text-[11px] leading-5 text-slate-500">{service.purpose}</span></div><Icon name="check_circle" className="planning-preview-check mt-1 text-[19px]" /></div>) : <p className="planning-preview-empty">Selecciona al menos un servicio para completar la propuesta.</p>}</div></div>
          </PlanningCard>
        </div>
      </div>
      <Toast message={toast} onDismiss={dismiss} />
    </div>
  )
}
