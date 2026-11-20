import type { WhatsAppPlatform } from '../types';

/**
 * Layanan normalisasi dan validasi nomor WhatsApp Indonesia.
 * Mendukung format: 08xxxxxxxx, 628xxxxxxxx, +628xxxxxxxx, dengan spasi atau tanda hubung.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized?: string;
  formatted?: string; // Format tampilan yang nyaman dibaca, e.g. +62 815-6003-943
  error?: string;
}

/**
 * Menormalkan nomor telepon ke format standar internasional Indonesia (diawali 62).
 */
export function normalizePhoneNumber(rawPhone: string): PhoneValidationResult {
  if (!rawPhone || !rawPhone.trim()) {
    return { isValid: false, error: 'Nomor telepon kosong' };
  }

  // Hilangkan semua karakter non-angka kecuali tanda +
  let cleaned = rawPhone.trim().replace(/[^\d+]/g, '');

  // Hilangkan tanda + jika ada di awal
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  // Aturan awalan nomor Indonesia:
  // 1. Jika diawali 08..., ubah menjadi 628...
  if (cleaned.startsWith('08')) {
    cleaned = '628' + cleaned.slice(2);
  }
  // 2. Jika diawali 8... (tanpa 0 atau 62), tambahkan 62
  else if (cleaned.startsWith('8') && cleaned.length >= 9) {
    cleaned = '62' + cleaned;
  }
  // 3. Jika sudah diawali 628..., pertahankan

  // Validasi nomor WhatsApp seluler Indonesia:
  // Harus diawali 628, digit berikutnya 1-9, total panjang antara 10 hingga 15 digit.
  const isValid = /^628[1-9][0-9]{6,11}$/.test(cleaned);

  if (!isValid) {
    return {
      isValid: false,
      normalized: cleaned,
      error: 'Nomor tidak valid (harus nomor seluler Indonesia diawali 628... / 08...)',
    };
  }

  // Format tampilan yang mudah dibaca (misal: +62 815-6003-943)
  const formatted = `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9)}`;

  return {
    isValid: true,
    normalized: cleaned,
    formatted,
  };
}

/**
 * Menghasilkan tautan Click to Chat resmi WhatsApp dengan pesan yang di-encode secara aman.
 * Menjaga baris baru (\n), format *bold*, _italic_, dan emoji.
 */
export function generateWhatsAppLink(
  normalizedPhone: string,
  message: string,
  platform: WhatsAppPlatform = 'universal'
): string {
  const encodedMessage = encodeURIComponent(message);

  switch (platform) {
    case 'web':
      return `https://web.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedMessage}`;
    case 'desktop':
      return `whatsapp://send?phone=${normalizedPhone}&text=${encodedMessage}`;
    case 'universal':
    default:
      return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
  }
}
