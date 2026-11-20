import type { CustomDictionaryEntry, Salutation, SalutationSource } from '../types';

export const HIGH_CONFIDENCE_MALE_NAMES = new Set([
  'muhammad', 'mohammad', 'mohamad', 'muhamad', 'ahmad', 'achmad', 'akhmad',
  'fariz', 'rizky', 'rizki', 'fadillah', 'fadhillah', 'fadli', 'bambang', 'budi',
  'hendra', 'agus', 'eko', 'wahyu', 'dimas', 'bagus', 'arif', 'arief', 'faisal',
  'faisol', 'yusuf', 'ilham', 'fajar', 'ridwan', 'pratama', 'hadi', 'santoso',
  'susanto', 'saputra', 'putra', 'kurniawan', 'gunawan', 'setiawan', 'wibowo',
  'firmansyah', 'firman', 'taufiq', 'taufik', 'aditya', 'bayu', 'dian', 'indra',
  'danang', 'galih', 'alif', 'anwar', 'syahrul', 'zainal', 'abidin', 'hasan',
  'husen', 'husein', 'ali', 'umar', 'utsman', 'hamzah', 'bilal', 'tariq', 'irfan',
  'lukman', 'luqman', 'fauzan', 'ghani', 'habib', 'zaky', 'dzaki', 'ihsan', 'ikhsan',
  'reza', 'rendy', 'randy', 'dwi', 'tri', 'arya', 'haidar', 'wildan', 'naufal'
]);

export const HIGH_CONFIDENCE_FEMALE_NAMES = new Set([
  'siti', 'nur', 'dewi', 'putri', 'ayu', 'fitri', 'annisa', 'anisa', 'aisyah',
  'fatimah', 'zahra', 'natalia', 'mardiana', 'iis', 'rosidah', 'eriga', 'bernadia',
  'ratna', 'maya', 'mega', 'wulandari', 'lestari', 'rahayu', 'khadijah', 'maryam',
  'safitri', 'safira', 'kartika', 'indah', 'anggraeni', 'anggi', 'desi', 'dini',
  'rara', 'mutiara', 'nabila', 'nadhira', 'salma', 'syifa', 'zahrah', 'amelia',
  'nurul', 'hafizah', 'karina', 'nadia', 'triana', 'sukma', 'yuliana', 'yanti',
  'nita', 'winda', 'novita', 'rini', 'rina', 'marlina', 'puspita', 'widya',
  'susanti', 'handayani', 'pertiwi', 'hidayati', 'mufidah', 'fadhilah', 'marwah'
]);

const MALE_TITLES = new Set([
  'ustadz', 'ust', 'kyai', 'kh', 'habib', 'pak', 'bapak', 'bp', 'sdr', 'gus'
]);

const FEMALE_TITLES = new Set([
  'ustadzah', 'ustzh', 'ustz', 'hj', 'hajjah', 'bu', 'ibu', 'sdri', 'ning', 'nyai'
]);

export function checkExplicitTitle(cleanName: string): { salutation?: Salutation; source?: SalutationSource } {
  const lower = cleanName.toLowerCase();
  const tokens = lower.split(/[\s,]+/).map(t => t.replace(/[^a-z]/g, '')).filter(Boolean);

  for (const token of tokens) {
    if (MALE_TITLES.has(token)) {
      return { salutation: 'Bapak', source: 'explicit_title' };
    }
    if (FEMALE_TITLES.has(token)) {
      return { salutation: 'Ibu', source: 'explicit_title' };
    }
  }

  return {};
}

/**
 * Mendeteksi sapaan dengan prioritas ketat:
 * 1. Kode Gender R / N dari spreadsheet (Prioritas Utama: R = Laki-laki = Bapak, N = Perempuan = Ibu).
 *    Jika R / N ada, DILARANG menebak berdasarkan nama.
 * 2. Penanda L/P eksplisit.
 * 3. Gelar sapaan eksplisit di nama (Ustadz, Hj., dll).
 * 4. Kamus kustom pengguna (localStorage user override).
 * 5. Kamus sistem nama Indonesia keyakinan tinggi.
 * 6. Jika ambigu / tidak dikenal -> WAJIB 'Perlu konfirmasi'.
 */
export function detectSalutation(
  cleanName: string,
  explicitGender?: 'L' | 'P',
  customDictionary: CustomDictionaryEntry[] = [],
  rawGenderCode?: string
): { salutation: Salutation; source: SalutationSource } {
  // 1. Kode gender R/N dari spreadsheet
  if (rawGenderCode) {
    const code = rawGenderCode.trim().toUpperCase();
    if (code === 'R') {
      return { salutation: 'Bapak', source: 'gender_code' };
    }
    if (code === 'N') {
      return { salutation: 'Ibu', source: 'gender_code' };
    }
  }

  // 2. Prioritaskan penanda L/P eksplisit
  if (explicitGender === 'L') {
    return { salutation: 'Bapak', source: 'explicit_marker' };
  }
  if (explicitGender === 'P') {
    return { salutation: 'Ibu', source: 'explicit_marker' };
  }

  // 3. Gelar eksplisit di nama (e.g. Ustadz, Hj., Bp., Bu)
  const titleResult = checkExplicitTitle(cleanName);
  if (titleResult.salutation && titleResult.source) {
    return { salutation: titleResult.salutation, source: titleResult.source };
  }

  // 4. Cek kamus kustom pengguna (memori localStorage dari koreksi sebelumnya)
  const lowerName = cleanName.toLowerCase().trim();
  const nameParts = lowerName.split(/[\s,.]+/).filter(Boolean);

  const exactCustom = customDictionary.find((entry) => entry.name.toLowerCase() === lowerName);
  if (exactCustom) {
    return {
      salutation: exactCustom.gender === 'L' ? 'Bapak' : 'Ibu',
      source: 'user_override'
    };
  }

  if (nameParts.length > 0) {
    const firstNameCustom = customDictionary.find(
      (entry) => entry.name.toLowerCase() === nameParts[0]
    );
    if (firstNameCustom) {
      return {
        salutation: firstNameCustom.gender === 'L' ? 'Bapak' : 'Ibu',
        source: 'user_override'
      };
    }
  }

  // 5. Cek kamus sistem dengan keyakinan tinggi
  let malePoints = 0;
  let femalePoints = 0;

  for (const part of nameParts) {
    if (HIGH_CONFIDENCE_MALE_NAMES.has(part)) {
      malePoints += 1;
    }
    if (HIGH_CONFIDENCE_FEMALE_NAMES.has(part)) {
      femalePoints += 1;
    }
  }

  const firstWord = nameParts[0] || '';
  if (HIGH_CONFIDENCE_MALE_NAMES.has(firstWord) && femalePoints === 0) {
    return { salutation: 'Bapak', source: 'dictionary' };
  }
  if (HIGH_CONFIDENCE_FEMALE_NAMES.has(firstWord) && malePoints === 0) {
    return { salutation: 'Ibu', source: 'dictionary' };
  }

  if (malePoints > 0 && femalePoints === 0) {
    return { salutation: 'Bapak', source: 'dictionary' };
  }
  if (femalePoints > 0 && malePoints === 0) {
    return { salutation: 'Ibu', source: 'dictionary' };
  }

  // 6. Default ketat jika ambigu
  return { salutation: 'Perlu konfirmasi', source: 'unconfirmed' };
}
