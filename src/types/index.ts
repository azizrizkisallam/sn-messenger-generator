export type Salutation = 'Bapak' | 'Ibu' | 'Perlu konfirmasi';

export type SalutationSource =
  | 'gender_code'     // Kode R / N dari spreadsheet (prioritas tertinggi)
  | 'explicit_marker' // Penanda L/P eksplisit di teks
  | 'explicit_title'  // Gelar/sapaan eksplisit di nama (e.g. Ustadz, Hj.)
  | 'dictionary'      // Kamus nama sistem dengan keyakinan tinggi
  | 'user_override'   // Koreksi manual pengguna / kamus kustom tersimpan
  | 'unconfirmed';    // Tidak teridentifikasi secara meyakinkan

export type DeliveryStatus =
  | 'pending'   // Belum dibuka
  | 'opened'    // WhatsApp dibuka
  | 'sent'      // Sudah dikonfirmasi terkirim
  | 'skipped';  // Dilewati

export type OpenerPattern =
  | 'Pola_A' // Salam dahulu
  | 'Pola_B' // Sapaan dahulu
  | 'Pola_C' // Nama langsung
  | 'Pola_D' // Pembuka hangat
  | 'Pola_E' // Salam singkat
  | 'Pola_F'; // Sapaan personal

export type WhatsAppPlatform = 'universal' | 'web' | 'desktop';

export interface Participant {
  id: string;
  participantId?: string; // ID Peserta seperti SN1, SN2
  rawInput: string;
  cleanName: string;
  region?: string;
  detectedGender?: 'L' | 'P';
  rawGenderCode?: string; // R / N / L / P
  salutation: Salutation;
  salutationSource: SalutationSource;
  phone?: string;          // Format ternormalisasi 628xxxxxxxxxx
  rawPhone?: string;       // Nomor asli masukan
  isPhoneValid: boolean;
  deliveryStatus: DeliveryStatus;
  isDuplicate: boolean;
  duplicateOfId?: string;
  duplicateCount?: number;
  message?: string;
  isMessageEdited?: boolean;
  openerPattern?: OpenerPattern;
  flowPattern?: number;
  variationIndex?: {
    opener: number;
    benefit: number;
    ajakan: number;
    cta: number;
  };
}

export interface ProcessingOptions {
  filterDuplicates: boolean; // true = sembunyikan duplikat dari generator & workflow
  saveToDictionaryOnOverride: boolean; // true = otomatis simpan koreksi manual ke kamus kustom
  preferredPlatform: WhatsAppPlatform; // Platform WhatsApp default untuk deep link
}

export interface AppMetrics {
  totalRaw: number;
  totalUnique: number;
  duplicateCount: number;
  bapakCount: number;
  ibuCount: number;
  unconfirmedCount: number;
  generatedCount: number;
  validPhoneCount: number;
  sentCount: number;
  openedCount: number;
  pendingCount: number;
  skippedCount: number;
}

export interface CustomDictionaryEntry {
  name: string;
  gender: 'L' | 'P';
  dateAdded: string;
}

export interface MessageVariationOptions {
  openers: string[];
  benefits: string[];
  ajakans: string[];
  ctas: string[];
}
