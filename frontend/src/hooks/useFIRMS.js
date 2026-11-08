import { useCallback } from 'react'
import useAppStore from '../store/useAppStore.js'

/**
 * Custom hook that fetches FIRMS fire hotspot points from /api/hotspots.
 * Falls back to mock data on failure.
 */
export function useFIRMS() {
  const { hotspots, hotspotLoading, fetchHotspots } = useAppStore()

  const refetch = useCallback(() => {
    fetchHotspots()
  }, [fetchHotspots])

  return {
    hotspots,
    loading: hotspotLoading,
    refetch,
  }
}

export default useFIRMS
