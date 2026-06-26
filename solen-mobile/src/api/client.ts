import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GATEWAY = 'http://localhost:8000';
const AUTH_URL      = process.env.EXPO_PUBLIC_AUTH_URL      || GATEWAY;
const PROTOCOLS_URL = process.env.EXPO_PUBLIC_PROTOCOLS_URL || GATEWAY;
const ANALYTICS_URL = process.env.EXPO_PUBLIC_ANALYTICS_URL || GATEWAY;
const NOTIFY_URL    = process.env.EXPO_PUBLIC_NOTIFY_URL    || GATEWAY;

let _onSignOut: (() => void) | null = null;
export function registerSignOutCallback(cb: () => void) { _onSignOut = cb; }

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function tryRefresh(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem('solen:user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (!user.refresh_token) return null;
    const { data } = await axios.post<{ access_token: string }>(
      `${AUTH_URL}/api/v1/auth/refresh`,
      { refresh_token: user.refresh_token },
    );
    await AsyncStorage.setItem('solen:user', JSON.stringify({ ...user, access_token: data.access_token }));
    return data.access_token;
  } catch {
    return null;
  }
}

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
    const orig = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || orig._retry) return Promise.reject(error);
    orig._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push(token => {
          if (token) {
            orig.headers.Authorization = `Bearer ${token}`;
            resolve(instance(orig));
          } else {
            reject(error);
          }
        });
      });
    }

    isRefreshing = true;
    const newToken = await tryRefresh();
    isRefreshing = false;
    refreshQueue.forEach(cb => cb(newToken));
    refreshQueue = [];

    if (newToken) {
      orig.headers.Authorization = `Bearer ${newToken}`;
      return instance(orig);
    }

    await AsyncStorage.multiRemove(['solen:user']);
    _onSignOut?.();
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
