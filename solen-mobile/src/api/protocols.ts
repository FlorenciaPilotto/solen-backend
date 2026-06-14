import { protocolsApi, analyticsApi } from './client';

export interface EstadoInput { energy: number; stress: number; focus: number; available_minutes?: number; }
export interface ProtocolResponse { user_id: string; protocol_type: string; variant: number; total_minutes: number; insight: string; mental: any; physical: any; nutritional: any; strategic_focus: any; adaptation: any; selection: any; }
export interface ProtocolSummary { id: number; protocol_type: string; energy: number; stress: number; focus: number; total_minutes: number; created_at: string; }
export interface AnalyticsData { frecuencia_dominante: number; modo_creacion_pct: number; racha: number; mejor_racha: number; indice_voluntad: number; biohack_level: number; coherencia_media: number; gatillo_principal: string; protocolos_mes: number; }
export interface CoachMessage { id: number; role: 'user' | 'assistant'; content: string; created_at: string; }

export const protocolsService = {
  registrarEstado: (estado: EstadoInput) => protocolsApi.post('/api/v1/estado', estado),
  generar: (estado: EstadoInput) => protocolsApi.post<ProtocolResponse>('/api/v1/protocolo', estado),
  obtener: () => protocolsApi.get<ProtocolResponse>('/api/v1/protocolo'),
  historial: (limit = 10) => protocolsApi.get<ProtocolSummary[]>(`/api/v1/protocolo/historial?limit=${limit}`),
};

export const analyticsService = {
  getDashboard: () => analyticsApi.get<AnalyticsData>('/api/v1/analytics/dashboard'),
  getHeatmap: () => analyticsApi.get<any[]>('/api/v1/analytics/heatmap'),
  registrarEvento: (tipo: string, datos: Record<string, unknown>) =>
    analyticsApi.post('/api/v1/events/track', { tipo, datos }),
};

export const coachService = {
  historial: () => protocolsApi.get<CoachMessage[]>('/api/v1/coach/history'),
  enviarMensaje: (message: string) => protocolsApi.post<CoachMessage>('/api/v1/coach/message', { message }),
};
