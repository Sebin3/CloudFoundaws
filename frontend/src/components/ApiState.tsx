import { Icon } from './Icon'
import { AsyncEmptyState } from './AsyncEmptyState'

export function ApiLoading({ label = 'Cargando datos del backend' }: { label?: string }) {
  return (
    <div role="status" className="api-loading">
      <Icon name="cloud_sync" className="api-loading-icon animate-spin text-[20px]" />
      <span>{label}…</span>
    </div>
  )
}

export function ApiError({ message: _message, title = 'No hay datos disponibles todavía', description = 'No hay información disponible para mostrar en este momento.', onRetry }: { message: string; title?: string; description?: string; onRetry?: () => void }) {
  return (
    <AsyncEmptyState
      title={title}
      description={description}
      action={onRetry && <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 rounded-xl border border-[#e8e3eb] bg-transparent px-3 py-2 text-xs font-bold text-[#777] transition hover:bg-white hover:text-[#5f5858] dark:border-[#2d2a2a] dark:text-[#bdb6b6] dark:hover:bg-[#252222]"><Icon name="refresh" className="text-[15px]" />Reintentar</button>}
    />
  )
}
