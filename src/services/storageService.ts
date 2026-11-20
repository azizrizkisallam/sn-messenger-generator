import type { CustomDictionaryEntry, Participant, ProcessingOptions } from '../types';

const STORAGE_KEYS = {
  PARTICIPANTS: 'sobatngaji_participants_v2',
  CUSTOM_DICTIONARY: 'sobatngaji_custom_dictionary_v2',
  OPTIONS: 'sobatngaji_options_v2',
};

const DEFAULT_OPTIONS: ProcessingOptions = {
  filterDuplicates: false,
  saveToDictionaryOnOverride: true,
  preferredPlatform: 'universal',
};

export function loadSavedParticipants(): Participant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Gagal memuat peserta dari localStorage:', e);
    return [];
  }
}

export function saveParticipants(participants: Participant[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(participants));
  } catch (e) {
    console.error('Gagal menyimpan peserta ke localStorage:', e);
  }
}

export function loadCustomDictionary(): CustomDictionaryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_DICTIONARY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Gagal memuat kamus kustom:', e);
    return [];
  }
}

export function saveCustomDictionary(entries: CustomDictionaryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_DICTIONARY, JSON.stringify(entries));
  } catch (e) {
    console.error('Gagal menyimpan kamus kustom:', e);
  }
}

export function addOrUpdateDictionaryEntry(
  name: string,
  gender: 'L' | 'P',
  currentEntries: CustomDictionaryEntry[]
): CustomDictionaryEntry[] {
  const cleanName = name.toLowerCase().trim();
  const filtered = currentEntries.filter(e => e.name.toLowerCase() !== cleanName);
  const updated: CustomDictionaryEntry[] = [
    ...filtered,
    {
      name: cleanName,
      gender,
      dateAdded: new Date().toISOString()
    }
  ];
  saveCustomDictionary(updated);
  return updated;
}

export function loadProcessingOptions(): ProcessingOptions {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OPTIONS);
    return raw ? { ...DEFAULT_OPTIONS, ...JSON.parse(raw) } : DEFAULT_OPTIONS;
  } catch (e) {
    return DEFAULT_OPTIONS;
  }
}

export function saveProcessingOptions(options: ProcessingOptions): void {
  try {
    localStorage.setItem(STORAGE_KEYS.OPTIONS, JSON.stringify(options));
  } catch (e) {
    console.error('Gagal menyimpan opsi:', e);
  }
}

export function clearAllStorageData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PARTICIPANTS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_DICTIONARY);
    localStorage.removeItem(STORAGE_KEYS.OPTIONS);
  } catch (e) {
    console.error('Gagal membersihkan data:', e);
  }
}
