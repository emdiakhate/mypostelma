import { useState, useEffect } from 'react';
import { mockAnalyticsData } from '@/data/mockAnalyticsData';

export function useAnalytics(dateRange?: { start: Date; end: Date }) {
  const [data, setData] = useState(mockAnalyticsData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler un chargement
    setLoading(true);
    setTimeout(() => {
      setData(mockAnalyticsData);
      setLoading(false);
    }, 500);
  }, [dateRange]);

  return { data, loading };
}