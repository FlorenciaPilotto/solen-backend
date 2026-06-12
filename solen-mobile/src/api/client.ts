import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GATEWAY = 'http://localhost:8000';
const AUTH_URL      = process.env.EXPO_PUBLIC_AUTH_URL      || GATEWAY;
const PROTOCOLS_URL = process.env.EXPO_PUBLIC_PROTOCOLS_URL || GATEWAY;
const ANALYTICS_URL = process.env.EXPO_PUBLIC_ANALYTICS_URL || GATEWAY;
const NOTIFY_URL    = process.env.EXPO_PUBLIC_NOTIFY_URL    || GATEWAY;

function makeClient(baseURL: string) {
  const instance = axios.create({ baseURL, timeout: 15_000, headers: { 'Content-Type': 'application/json' } });
  instance.interceptors.request.use(async config => {
    const raw = await AsyncStorage.getItem('solen:user');
    if (raw) {
      const user = JSON.parse(raw);
      config.headers.Authorization = `Bearer ${user.access_token}`;
    }
    return config;
  });
  instance.interceptors.response.use(r => r, async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['solen:user']);
    }
    return Promise.reject(error);
  });
  return instance;
}

export const authApi      = makeClient(AUTH_URL);
export const protocolsApi = makeClient(PROTOCOLS_URL);
export const analyticsApi = makeClient(ANALYTICS_URL);
export const notifyApi    = makeClient(NOTIFY_URL);

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.error) return data.error;
    if (Array.isArray(data?.detail)) {
      return data.detail.map((d: any) => d.msg ?? JSON.stringify(d)).join(' ');
    }
    if (typeof data?.detail === 'string') return data.detail;
    return error.message ?? 'Error de conexión.';
  }
  return 'Error inesperado.';
}
