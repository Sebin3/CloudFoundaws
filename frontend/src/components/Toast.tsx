import { Icon } from './Icon'

export function Toast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  if (!message) {
    return null
  }

  return (
    <div role="status" className="toast-notification fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-2xl p-4">
      <div className="toast-notification-icon flex size-9 shrink-0 items-center justify-center rounded-xl"><Icon name="check_circle" className="text-[19px]" /></div>
      <div className="min-w-0 flex-1"><strong className="toast-notification-title block text-sm">Completado</strong><span className="toast-notification-message mt-0.5 block text-xs leading-5">{message}</span></div>
      <button type="button" onClick={onDismiss} aria-label="Cerrar aviso" className="toast-notification-close flex size-6 shrink-0 items-center justify-center rounded-md transition"><Icon name="close" className="text-[16px]" /></button>
    </div>
  )
}
