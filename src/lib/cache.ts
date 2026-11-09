import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "cache:";

export type Cached<T> = { data: T; savedAt: number };

export async function saveCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(
      PREFIX + key,
      JSON.stringify({ data, savedAt: Date.now() }),
    );
  } catch {
    // caching is best-effort; never break the app because of it
  }
}

export async function loadCache<T>(key: string): Promise<Cached<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as Cached<T>) : null;
  } catch {
    return null;
  }
}

export async function clearCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith(PREFIX)));
  } catch {
    // ignore
  }
}
