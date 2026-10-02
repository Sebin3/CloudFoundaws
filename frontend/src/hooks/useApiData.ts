import { useEffect, useState } from 'react'

export function useApiData<T>(loader: () => Promise<T>, deps: readonly unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refetch = () => {
    setLoading(true)
    setError(null)
    setRefreshKey((key) => key + 1)
  }

  useEffect(() => {
    let active = true
    loader()
      .then((result) => {
        if (!active) return
        setData(result)
        setError(null)
        setLoading(false)
      })
      .catch((reason: unknown) => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : 'No se pudo conectar con el backend')
        setLoading(false)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, ...deps])

  return { data, loading, error, refetch }
}