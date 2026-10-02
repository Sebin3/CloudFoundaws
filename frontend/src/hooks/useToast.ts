import { useCallback, useEffect, useRef, useState } from 'react'

export function useToast(): { toast: string | null; show: (message: string) => void; dismiss: () => void } {
  const [toast, setToast] = useState<string | null>(null)
  const timeoutRef = useRef<number | undefined>(undefined)

  const show = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setToast(null), 5000)
  }, [])

  const dismiss = useCallback(() => {
    window.clearTimeout(timeoutRef.current)
    setToast(null)
  }, [])

  useEffect(() => () => window.clearTimeout(timeoutRef.current), [])

  return { toast, show, dismiss }
}