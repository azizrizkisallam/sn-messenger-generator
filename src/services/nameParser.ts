import type { Participant, CustomDictionaryEntry } from '../types';
import { normalizeName } from './nameNormalizer';
import { detectSalutation } from './salutationDetector';
import { normalizePhoneNumber } from './phoneNormalizer';

function generateId(): string {
  return 'p_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}

function extractGenderToken(token: string): 'L' | 'P' | undefined {
  const clean = token.replace(/[^A-Za-z]/g, '').toUpperCase();
  if (clean === 'L' || clean === 'LAKI' || clean === 'PRIA' || clean === 'IKHWAN' || clean === 'R') {
    return 'L';
  }
  if (clean === 'P' || clean === 'PEREMPUAN' || clean === 'WANITA' || clean === 'AKHWAT' || clean === 'N') {
    return 'P';
  }
  return undefined;
}

/**
 * Memeriksa apakah suatu baris adalah baris header tabel spreadsheet
 */
function isHeaderLine(line: string): boolean {
  const lower = line.toLowerCase();
  const hasIdHeader = lower.includes('id') || lower.includes('no');
  const hasNameHeader = lower.includes('nama') || lower.includes('peserta');
  const hasGenderHeader = lower.includes('gender') || lower.includes('sapaan') || lower.includes('kode');
  const hasPhoneHeader = lower.includes('wa') || lower.includes('whatsapp') || lower.includes('nomor') || lower.includes('telepon');

  return (hasNameHeader && (hasPhoneHeader || hasGenderHeader || hasIdHeader));
}

/**
 * Mem-parsing satu baris input peserta.
 * Mendukung format tabel Google Sheets (TSV / Pipe) seperti:
 * | SN1 | Ambar Susanto | L - Bandung | R | 628156003943 |
 * SN1 \t Ambar Susanto - Bandung \t R \t 628156003943
 * serta format teks sederhana legacy:
 * Ambar Susanto | L - Bandung
 */
export function parseParticipantLine(
  rawLine: string,
  customDictionary: CustomDictionaryEntry[] = []
): Participant | null {
  const trimmedLine = rawLine.trim();
  if (!trimmedLine) return null;

  // Lewati baris jika terdeteksi sebagai header spreadsheet
  if (isHeaderLine(trimmedLine)) return null;

  let participantId: string | undefined;
  let rawPhone: string | undefined;
  let rawGenderCode: string | undefined;
  let detectedGender: 'L' | 'P' | undefined;
  let region: string | undefined;
  let nameCandidate = '';

  // 1. Periksa format multi-kolom (Tab Google Sheets atau Pipe table)
  let columns: string[] = [];
  if (trimmedLine.includes('\t')) {
    columns = trimmedLine.split('\t').map(c => c.trim()).filter(Boolean);
  } else if (trimmedLine.includes('|')) {
    // Tangani kemungkinan pipe di awal dan akhir: | SN1 | Nama | ... |
    columns = trimmedLine
      .split('|')
      .map(c => c.trim())
      .filter(Boolean);
  }

  // Jika terdeteksi minimal 3 kolom (misal: ID, Nama, Gender/No)
  if (columns.length >= 3) {
    // Identifikasi kolom berdasarkan struktur SobatNgaji:
    // Contoh 5 kolom: [ 'SN1', 'Ambar Susanto', 'L - Bandung', 'R', '628156003943' ]
    // Contoh 4 kolom: [ 'SN1', 'Ambar Susanto - Bandung', 'R', '628156003943' ]
    
    // Cek kolom pertama apakah ID peserta (contoh SN1, SN01, atau format kode)
    if (/^[A-Za-z0-9_-]{1,10}$/.test(columns[0]) && !/^\d{9,}$/.test(columns[0])) {
      participantId = columns[0];
    }

    // Cari kolom nomor WhatsApp (angka minimal 9 digit)
    const phoneColIndex = columns.findIndex(c => /^[+]?[\d\s-]{9,18}$/.test(c.replace(/[^\d+]/g, '')) && c.replace(/[^\d]/g, '').length >= 9);
    if (phoneColIndex !== -1) {
      rawPhone = columns[phoneColIndex];
    }

    // Cari kolom kode gender (R / N atau L / P)
    const genderColIndex = columns.findIndex(c => /^[RNLP]$/i.test(c.trim()));
    if (genderColIndex !== -1) {
      rawGenderCode = columns[genderColIndex].trim().toUpperCase();
      if (rawGenderCode === 'R') detectedGender = 'L';
      else if (rawGenderCode === 'N') detectedGender = 'P';
      else if (rawGenderCode === 'L') detectedGender = 'L';
      else if (rawGenderCode === 'P') detectedGender = 'P';
    }

    // Kumpulkan sisa kolom sebagai nama & daerah
    const nameCols = columns.filter((_, idx) => {
      if (participantId && idx === 0) return false;
      if (phoneColIndex !== -1 && idx === phoneColIndex) return false;
      if (genderColIndex !== -1 && idx === genderColIndex) return false;
      return true;
    });

    if (nameCols.length > 0) {
      nameCandidate = nameCols.join(' - ');
    } else {
      nameCandidate = columns[1] || columns[0];
    }
  } else {
    // Format teks legacy 1-2 kolom
    let workingLine = trimmedLine;

    // Cek nomor HP di akhir baris
    const phoneMatch = workingLine.match(/([+]?628[\d\s-]{7,15}|08[\d\s-]{8,14})$/);
    if (phoneMatch) {
      rawPhone = phoneMatch[0];
      workingLine = workingLine.replace(phoneMatch[0], ' ').trim();
    }

    // Cek kode ID di awal baris (contoh: SN1 | ... atau SN1 - ...)
    const idMatch = workingLine.match(/^([A-Za-z]{2,}\d+)\s*[-|]\s*/);
    if (idMatch) {
      participantId = idMatch[1];
      workingLine = workingLine.replace(idMatch[0], '').trim();
    }

    // Cek kode R/N eksplisit
    const rnMatch = workingLine.match(/\b([RN])\b/i);
    if (rnMatch) {
      rawGenderCode = rnMatch[1].toUpperCase();
      if (rawGenderCode === 'R') detectedGender = 'L';
      else if (rawGenderCode === 'N') detectedGender = 'P';
      workingLine = workingLine.replace(rnMatch[0], ' ');
    }

    nameCandidate = workingLine;
  }

  // 2. Pembersihan nama, penanda L/P, dan daerah dari nameCandidate
  let workingName = nameCandidate;

  // Cek penanda kurung (L) atau [P]
  const parenthesizedGender = workingName.match(/[\(\[]\s*([LP]|Laki-laki|Perempuan|Pria|Wanita)\s*[\)\]]/i);
  if (parenthesizedGender) {
    if (!detectedGender) {
      detectedGender = extractGenderToken(parenthesizedGender[1]);
    }
    workingName = workingName.replace(parenthesizedGender[0], ' ');
  }

  // Cek separator pipe di nama: e.g. "Ambar Susanto | L - Bandung"
  if (workingName.includes('|')) {
    const pipeParts = workingName.split('|').map(s => s.trim()).filter(Boolean);
    if (pipeParts.length > 0) {
      workingName = pipeParts[0];
      const afterPipe = pipeParts.slice(1).join(' ').trim();
      if (afterPipe) {
        const subParts = afterPipe.split(/[-–—,/]+/).map(s => s.trim()).filter(Boolean);
        for (const sp of subParts) {
          const g = extractGenderToken(sp);
          if (g) {
            if (!detectedGender) {
              detectedGender = g;
            }
          } else if (!region && sp.length > 1) {
            region = sp;
          }
        }
      }
    }
  }

  // Cek separator tanda hubung (dash): e.g. "Eriga Bernadia - Bekasi" atau "Ambar Susanto - L - Bandung"
  if (workingName.includes('-') || workingName.includes('–')) {
    const dashParts = workingName.split(/[-–]+/).map(s => s.trim()).filter(Boolean);
    if (dashParts.length >= 2) {
      workingName = dashParts[0];
      const remainingParts = dashParts.slice(1);
      for (const part of remainingParts) {
        const g = extractGenderToken(part);
        if (g) {
          if (!detectedGender) {
            detectedGender = g;
          }
        } else if (!region && part.length > 1) {
          region = part;
        }
      }
    }
  }

  // Bersihkan nama akhir menggunakan normalizer
  const cleanName = normalizeName(workingName);
  if (!cleanName) return null;

  if (region) {
    region = region.replace(/^[-|,:/\\.]+|[-|,:/\\.]+$/g, '').trim();
    if (!region) region = undefined;
  }

  // 3. Normalisasi nomor telepon jika ada
  let phone: string | undefined;
  let isPhoneValid = false;

  if (rawPhone) {
    const phoneRes = normalizePhoneNumber(rawPhone);
    phone = phoneRes.normalized;
    isPhoneValid = phoneRes.isValid;
  }

  // 4. Deteksi sapaan dengan prioritas kode R/N dari spreadsheet
  const { salutation, source: salutationSource } = detectSalutation(
    cleanName,
    detectedGender,
    customDictionary,
    rawGenderCode
  );

  return {
    id: generateId(),
    participantId,
    rawInput: trimmedLine,
    cleanName,
    region,
    detectedGender,
    rawGenderCode,
    salutation,
    salutationSource,
    phone,
    rawPhone,
    isPhoneValid,
    deliveryStatus: 'pending',
    isDuplicate: false,
  };
}

export function parseRawDatabase(
  rawText: string,
  customDictionary: CustomDictionaryEntry[] = []
): Participant[] {
  if (!rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/);
  const result: Participant[] = [];

  for (const line of lines) {
    const parsed = parseParticipantLine(line, customDictionary);
    if (parsed) {
      result.push(parsed);
    }
  }

  return result;
}
