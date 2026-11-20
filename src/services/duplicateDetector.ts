import type { Participant } from '../types';

/**
 * Mendeteksi duplikasi dengan prioritas berjenjang:
 * 1. ID peserta (misal: SN1)
 * 2. Nomor WhatsApp (misal: 628156003943)
 * 3. Nama (hanya jika ID dan Nomor WhatsApp tidak tersedia)
 *
 * Catatan penting: Orang berbeda yang memiliki nama sama tetapi nomor WA atau ID berbeda
 * TIDAK akan dianggap sebagai duplikat.
 */
export function detectDuplicates(participants: Participant[]): Participant[] {
  const seenIds = new Map<string, string>(); // participantId -> original id
  const seenPhones = new Map<string, string>(); // normalized phone -> original id
  const seenNames = new Map<string, string>(); // cleanName -> original id (fallback)

  const idCounts = new Map<string, number>();
  const phoneCounts = new Map<string, number>();
  const nameCounts = new Map<string, number>();

  for (const p of participants) {
    if (p.participantId) {
      const idKey = p.participantId.toLowerCase().trim();
      idCounts.set(idKey, (idCounts.get(idKey) || 0) + 1);
    }
    if (p.phone && p.isPhoneValid) {
      const phoneKey = p.phone;
      phoneCounts.set(phoneKey, (phoneCounts.get(phoneKey) || 0) + 1);
    }
    if (!p.participantId && (!p.phone || !p.isPhoneValid)) {
      const nameKey = p.cleanName.toLowerCase().trim();
      nameCounts.set(nameKey, (nameCounts.get(nameKey) || 0) + 1);
    }
  }

  return participants.map((p) => {
    let isDup = false;
    let originalId: string | undefined;
    let count = 1;

    // Prioritas 1: ID Peserta
    if (p.participantId) {
      const idKey = p.participantId.toLowerCase().trim();
      const c = idCounts.get(idKey) || 1;
      if (c > count) count = c;

      if (seenIds.has(idKey)) {
        isDup = true;
        originalId = seenIds.get(idKey);
      } else {
        seenIds.set(idKey, p.id);
      }
    }

    // Prioritas 2: Nomor WhatsApp
    if (p.phone && p.isPhoneValid) {
      const phoneKey = p.phone;
      const c = phoneCounts.get(phoneKey) || 1;
      if (c > count) count = c;

      if (seenPhones.has(phoneKey)) {
        if (!isDup) {
          isDup = true;
          originalId = seenPhones.get(phoneKey);
        }
      } else {
        seenPhones.set(phoneKey, p.id);
      }
    }

    // Prioritas 3: Nama (hanya jika TANPA ID dan TANPA No WA)
    if (!p.participantId && (!p.phone || !p.isPhoneValid)) {
      const nameKey = p.cleanName.toLowerCase().trim();
      count = nameCounts.get(nameKey) || 1;

      if (seenNames.has(nameKey)) {
        isDup = true;
        originalId = seenNames.get(nameKey);
      } else {
        seenNames.set(nameKey, p.id);
      }
    }

    return {
      ...p,
      isDuplicate: isDup,
      duplicateOfId: originalId,
      duplicateCount: count,
    };
  });
}

export function applyDuplicateFilter(
  participants: Participant[],
  filterDuplicates: boolean
): Participant[] {
  if (!filterDuplicates) {
    return participants;
  }
  return participants.filter((p) => !p.isDuplicate);
}
