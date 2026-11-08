import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import useAppStore from '../store/useAppStore.js'

/**
 * Custom hook that fetches the harmonized calendar data from /api/calendar.
 * Falls back to the Zustand store's mock-data fetch on failure.
 */
export function useHarmonize() {
  const { bbox, dateRange, sensor, fetchHarmonized, harmonizedData, loading, error } =
    useAppStore()

  const refetch = useCallback(() => {
    fetchHarmonized()
  }, [fetchHarmonized])

  return {
    data:    harmonizedData,
    loading,
    error,
    refetch,
  }
}

export default useHarmonize
