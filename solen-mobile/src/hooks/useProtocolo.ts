import { useState, useCallback } from 'react';
import { protocolsService, ProtocolResponse, EstadoInput } from '../api/protocols';
import { analyticsService } from '../api/protocols';
import { addPuntos } from '../store/storage';
import { getApiError } from '../api/client';

interface UseProtocoloResult {
  protocolo: ProtocolResponse | null;
  loading: boolean;
  error: string | null;
  generar: (estado: EstadoInput) => Promise<ProtocolResponse | null>;
  limpiar: () => void;
}

export function useProtocolo(): UseProtocoloResult {
  const [protocolo, setProtocolo] = useState<ProtocolResponse | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const generar = useCallback(async (estado: EstadoInput): Promise<ProtocolResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      // 1. Guardar estado en el backend
      await protocolsService.registrarEstado(estado);

      // 2. Generar protocolo
      const { data } = await protocolsService.generar(estado);
      setProtocolo(data);

      // 3. Registrar evento en analytics (fire & forget)
      analyticsService.registrarEvento('protocol_generated', {
        protocol_type: data.protocol_type,
        energy: estado.energy,
        stress: estado.stress,
        focus: estado.focus,
      }).catch(() => {});

      return data;
    } catch (e) {
      const msg = getApiError(e);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const limpiar = useCallback(() => {
    setProtocolo(null);
    setError(null);
  }, []);

  return { protocolo, loading, error, generar, limpiar };
}
