import { useState, useCallback, useEffect } from 'react';
import { analyticsService, AnalyticsData } from '../api/protocols';

interface UseAnalyticsResult {
  data: AnalyticsData | null;
  heatmap: any[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const FALLBACK: AnalyticsData = {
  frecuencia_dominante: 0, modo_creacion_pct: 0, racha: 0, mejor_racha: 0,
  indice_voluntad: 0, biohack_level: 0, coherencia_media: 0,
  gatillo_principal: 'ninguno', protocolos_mes: 0,
};

export function useAnalytics(autoLoad = true): UseAnalyticsResult {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, heat] = await Promise.all([
        analyticsService.getDashboard(),
        analyticsService.getHeatmap(),
      ]);
      setData(dash.data);
      setHeatmap(heat.data);
    } catch {
      setData(FALLBACK);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (autoLoad) refresh(); }, [autoLoad]);

  return { data, heatmap, loading, refresh };
}
