import type { Participant, OpenerPattern } from '../types';

/**
 * Natural Message Structure Engine untuk SobatNgaji Message Generator.
 * Menghasilkan pesan personal natural dengan variasi pola pembuka (Pola A - F)
 * dan 4 variasi susunan alur komunikasi.
 * 
 * ATURAN MUTLAK:
 * Seluruh pesan wajib memuat:
 * *1x KONSULTASI TAHSIN GRATIS bersama Asatidz SobatNgaji.*
 */

export const MANDATORY_BENEFIT = '*1x KONSULTASI TAHSIN GRATIS bersama Asatidz SobatNgaji.*';

export const OPENER_PATTERNS: { id: OpenerPattern; name: string; template: string }[] = [
  {
    id: 'Pola_A',
    name: 'Pola A — Salam dahulu',
    template: 'Assalamu\'alaikum, {{sapaan}} {{nama}} 😊\n\nAda kabar spesial dari SobatNgaji!'
  },
  {
    id: 'Pola_B',
    name: 'Pola B — Sapaan dahulu',
    template: '{{sapaan}} {{nama}}, apa kabar? Semoga selalu dalam kebaikan. 🌿\n\nAda kabar baik dari SobatNgaji!'
  },
  {
    id: 'Pola_C',
    name: 'Pola C — Nama langsung',
    template: 'Halo, {{sapaan}} {{nama}}!\n\nSobatNgaji punya sesuatu yang ingin kami bagikan.'
  },
  {
    id: 'Pola_D',
    name: 'Pola D — Pembuka hangat',
    template: 'Semoga hari ini penuh keberkahan untuk {{sapaan}} {{nama}}.\n\nAda kabar spesial dari SobatNgaji!'
  },
  {
    id: 'Pola_E',
    name: 'Pola E — Salam singkat & doa',
    template: 'Assalamu\'alaikum, {{sapaan}} {{nama}}.\n\nSemoga senantiasa sehat dan dalam lindungan Allah.'
  },
  {
    id: 'Pola_F',
    name: 'Pola F — Sapaan personal',
    template: 'Apa kabar, {{sapaan}} {{nama}}? 😊\n\nSemoga aktivitasnya hari ini berjalan lancar.'
  }
];

export const BENEFIT_LINES = [
  '{{sapaan}} mendapatkan *1x KONSULTASI TAHSIN GRATIS bersama Asatidz SobatNgaji.*',
  'Khusus untuk {{sapaan}}, tersedia *1x KONSULTASI TAHSIN GRATIS bersama Asatidz SobatNgaji.*',
  'SobatNgaji memberikan *1x KONSULTASI TAHSIN GRATIS bersama Asatidz SobatNgaji.* untuk {{sapaan}}.'
];

export const AJAKAN_LINES = [
  'Yuk, manfaatkan sesi gratis ini untuk mengenali dan memperbaiki bacaan Al-Qur\'an {{sapaan}}. 🌿',
  'Mari mulai langkah kecil untuk memperbaiki bacaan Al-Qur\'an bersama asatidz kami. 🌿',
  'Sesi ini bisa dimanfaatkan untuk mengenali dan menyempurnakan bacaan Al-Qur\'an {{sapaan}} secara langsung.',
  'Kami siap membantu {{sapaan}} belajar membaca Al-Qur\'an dengan lebih baik.'
];

export const CTA_LINES = [
  '*{{sapaan}} mau kami bantu daftarkan?*',
  '*Mau kami bantu jadwalkan sesi konsultasinya, {{sapaan}}?*',
  '*Yuk, kami bantu proses pendaftarannya!*'
];

export function countWords(text: string): number {
  if (!text) return 0;
  const clean = text
    .replace(/[*_~`]/g, '')
    .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF-]/g, ' ')
    .trim();
  const words = clean.split(/\s+/).filter(Boolean);
  return words.length;
}

function substituteTokens(template: string, sapaan: string, nama: string): string {
  const effectiveSapaan = sapaan === 'Perlu konfirmasi' ? 'Bapak/Ibu' : sapaan;
  return template
    .replace(/\{\{sapaan\}\}/g, effectiveSapaan)
    .replace(/\{\{nama\}\}/g, nama);
}

export interface MessageGenerationParams {
  openerPattern?: OpenerPattern;
  flowPattern?: number; // 1, 2, 3, atau 4
  benefitIndex?: number;
  ajakanIndex?: number;
  ctaIndex?: number;
}

/**
 * Menghasilkan pesan personal untuk satu peserta dengan variasi alur dan pola pembuka.
 */
export function generateSingleMessage(
  participant: Participant,
  params?: MessageGenerationParams
): { message: string; openerPattern: OpenerPattern; flowPattern: number } {
  const { cleanName, salutation } = participant;
  const effectiveSapaan = salutation === 'Perlu konfirmasi' ? 'Bapak/Ibu' : salutation;

  // Tentukan Pola Pembuka (A - F)
  const patternList = OPENER_PATTERNS;
  const selectedPattern = params?.openerPattern 
    ? (patternList.find(p => p.id === params.openerPattern) || patternList[0])
    : patternList[Math.floor(Math.random() * patternList.length)];

  // Tentukan Alur Pesan (1: Lengkap, 2: Sapaan ringkas, 3: Salam doa, 4: Konteks SobatNgaji)
  const flow = params?.flowPattern ?? (Math.floor(Math.random() * 4) + 1);

  const bIdx = params?.benefitIndex ?? Math.floor(Math.random() * BENEFIT_LINES.length);
  const aIdx = params?.ajakanIndex ?? Math.floor(Math.random() * AJAKAN_LINES.length);
  const cIdx = params?.ctaIndex ?? Math.floor(Math.random() * CTA_LINES.length);

  const benefitRaw = BENEFIT_LINES[bIdx % BENEFIT_LINES.length];
  const ajakanRaw = AJAKAN_LINES[aIdx % AJAKAN_LINES.length];
  const ctaRaw = CTA_LINES[cIdx % CTA_LINES.length];

  const openerText = substituteTokens(selectedPattern.template, effectiveSapaan, cleanName);
  const benefitText = substituteTokens(benefitRaw, effectiveSapaan, cleanName);
  const ajakanText = substituteTokens(ajakanRaw, effectiveSapaan, cleanName);
  const ctaText = substituteTokens(ctaRaw, effectiveSapaan, cleanName);

  let message = '';

  switch (flow) {
    case 1:
      // Alur 1: Pembuka → Benefit → Penjelasan singkat / Ajakan → CTA
      message = `${openerText}\n\n${benefitText}\n\n${ajakanText}\n\n${ctaText}`;
      break;

    case 2:
      // Alur 2: Sapaan → Benefit → CTA (lebih ringkas & to-the-point)
      if (selectedPattern.id === 'Pola_B' || selectedPattern.id === 'Pola_F') {
        message = `${openerText}\n\n${benefitText}\n\n${ctaText}`;
      } else {
        message = `${effectiveSapaan} ${cleanName}, apa kabar? Semoga sehat selalu. 😊\n\nAda kabar baik dari SobatNgaji:\n${benefitText}\n\n${ctaText}`;
      }
      break;

    case 3:
      // Alur 3: Salam & Doa → Sapaan & Benefit → CTA
      message = `Assalamu'alaikum, ${effectiveSapaan} ${cleanName}.\nSemoga senantiasa dalam lindungan Allah.\n\nAda kabar spesial, ${benefitText}\n\n${ctaText}`;
      break;

    case 4:
    default:
      // Alur 4: Sapaan → Konteks SobatNgaji → Benefit → CTA
      message = `Halo, ${effectiveSapaan} ${cleanName}!\n\nSobatNgaji punya kabar gembira yang ingin kami bagikan.\n\n${benefitText}\n\n${ajakanText}\n\n${ctaText}`;
      break;
  }

  return {
    message,
    openerPattern: selectedPattern.id,
    flowPattern: flow,
  };
}

/**
 * Menghasilkan pesan untuk seluruh daftar peserta secara merata dan natural.
 * Kontak bersebelahan akan bergantian mendapatkan Pola A-F dan Alur 1-4.
 */
export function generateAllMessages(participants: Participant[]): Participant[] {
  const patternKeys: OpenerPattern[] = ['Pola_A', 'Pola_B', 'Pola_C', 'Pola_D', 'Pola_E', 'Pola_F'];

  return participants.map((p, index) => {
    const openerPattern = patternKeys[index % patternKeys.length];
    const flowPattern = (index % 4) + 1;
    const benefitIndex = (index + Math.floor(index / 2)) % BENEFIT_LINES.length;
    const ajakanIndex = (index * 2) % AJAKAN_LINES.length;
    const ctaIndex = (index + 1) % CTA_LINES.length;

    const { message } = generateSingleMessage(p, {
      openerPattern,
      flowPattern,
      benefitIndex,
      ajakanIndex,
      ctaIndex,
    });

    return {
      ...p,
      message,
      isMessageEdited: false,
      openerPattern,
      flowPattern,
      variationIndex: {
        opener: index % patternKeys.length,
        benefit: benefitIndex,
        ajakan: ajakanIndex,
        cta: ctaIndex,
      },
    };
  });
}

/**
 * Menghasilkan ulang satu pesan dengan pola dan kombinasi yang baru
 */
export function regenerateParticipantMessage(participant: Participant): Participant {
  const patternKeys: OpenerPattern[] = ['Pola_A', 'Pola_B', 'Pola_C', 'Pola_D', 'Pola_E', 'Pola_F'];
  
  // Pilih pola yang berbeda dari saat ini
  const currentPattIdx = participant.openerPattern ? patternKeys.indexOf(participant.openerPattern) : -1;
  const nextPattIdx = (currentPattIdx + 1) % patternKeys.length;
  const nextOpener = patternKeys[nextPattIdx];

  const nextFlow = participant.flowPattern ? ((participant.flowPattern % 4) + 1) : 1;

  const { message, openerPattern, flowPattern } = generateSingleMessage(participant, {
    openerPattern: nextOpener,
    flowPattern: nextFlow,
    benefitIndex: Math.floor(Math.random() * BENEFIT_LINES.length),
    ajakanIndex: Math.floor(Math.random() * AJAKAN_LINES.length),
    ctaIndex: Math.floor(Math.random() * CTA_LINES.length),
  });

  return {
    ...participant,
    message,
    isMessageEdited: false,
    openerPattern,
    flowPattern,
  };
}
