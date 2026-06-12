import AsyncStorage from '@react-native-async-storage/async-storage';
import { IdentityLevel, PowerEvent } from '../../domain/entities';
import { IIdentityRepository } from '../../domain/usecases/IdentityManager';

const KEYS = {
  LEVEL:  'solen:identity_level',
  EVENTS: 'solen:power_events',
  RACHA:  'solen:racha_data',
} as const;

const DEFAULT_LEVEL: IdentityLevel = {
  puntos: 0, nivel: 'Inercia', racha: 0, mejorRacha: 0,
};

export class AsyncStorageIdentityRepository implements IIdentityRepository {

  async getIdentityLevel(): Promise<IdentityLevel> {
    const raw = await AsyncStorage.getItem(KEYS.LEVEL);
    return raw ? JSON.parse(raw) : DEFAULT_LEVEL;
  }

  async saveIdentityLevel(level: IdentityLevel): Promise<void> {
    await AsyncStorage.setItem(KEYS.LEVEL, JSON.stringify(level));
  }

  async getHistory(): Promise<PowerEvent[]> {
    const raw = await AsyncStorage.getItem(KEYS.EVENTS);
    return raw ? JSON.parse(raw) : [];
  }

  async addEvent(event: PowerEvent): Promise<void> {
    const history = await this.getHistory();
    const updated = [event, ...history].slice(0, 200); // máximo 200 eventos
    await AsyncStorage.setItem(KEYS.EVENTS, JSON.stringify(updated));
  }

  async getRachaData(): Promise<{ racha: number; mejorRacha: number; lastDate: string | null }> {
    const raw = await AsyncStorage.getItem(KEYS.RACHA);
    return raw ? JSON.parse(raw) : { racha: 0, mejorRacha: 0, lastDate: null };
  }

  async setRachaData(racha: number, mejorRacha: number, lastDate: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.RACHA, JSON.stringify({ racha, mejorRacha, lastDate }));
  }
}
