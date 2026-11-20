import { describe, it, expect } from 'vitest';
import { parseParticipantLine, parseRawDatabase } from '../nameParser';
import { detectDuplicates } from '../duplicateDetector';
import { normalizePhoneNumber, generateWhatsAppLink } from '../phoneNormalizer';
import {
  generateSingleMessage,
  countWords,
  OPENER_PATTERNS,
  MANDATORY_BENEFIT
} from '../messageGenerator';

describe('SobatNgaji Core Logic & WhatsApp Engine Suite', () => {
  const googleSheetsSample = `| SN1 | Ambar Susanto | L - Bandung | R | 628156003943 |
| SN2 | Eriga Bernadia - Bekasi | N | 6281234567890 |
| SN3 | Eriga Bernadia - Bekasi | N | 6281234567890 |
| SN4 | Rita SM - | N | 6281987654321 |
| SN5 | Fariz Rizky Fadillah | L - Cimahi | R | 6285712345678 |
| SN6 | Natalia Nuritasari - Bandung | N | 6281399887766 |
| SN7 | Mardiana - Medan | N | 6281211223344 |
| SN8 | Hany - Surabaya | N | 6287755667788 |
| SN9 | Iis Rosidah - Sukabumi | N | 6289600112233 |`;

  it('1. Normalisasi dan validasi nomor telepon Indonesia (08..., 628..., +62...)', () => {
    // 08156003943 -> 628156003943
    const res1 = normalizePhoneNumber('08156003943');
    expect(res1.isValid).toBe(true);
    expect(res1.normalized).toBe('628156003943');

    // +62 812-3456-7890 -> 6281234567890
    const res2 = normalizePhoneNumber('+62 812-3456-7890');
    expect(res2.isValid).toBe(true);
    expect(res2.normalized).toBe('6281234567890');

    // 6281987654321 -> 6281987654321
    const res3 = normalizePhoneNumber('6281987654321');
    expect(res3.isValid).toBe(true);
    expect(res3.normalized).toBe('6281987654321');

    // Nomor tidak valid (terlalu pendek atau bukan seluler)
    const res4 = normalizePhoneNumber('021500123');
    expect(res4.isValid).toBe(false);
  });

  it('2. Mem-parsing format Google Sheets dengan ID, Nama, Kode Gender R/N, dan No WA', () => {
    const p1 = parseParticipantLine('| SN1 | Ambar Susanto | L - Bandung | R | 628156003943 |');
    expect(p1?.participantId).toBe('SN1');
    expect(p1?.cleanName).toBe('Ambar Susanto');
    expect(p1?.region).toBe('Bandung');
    expect(p1?.rawGenderCode).toBe('R');
    expect(p1?.salutation).toBe('Bapak'); // R = Laki-laki = Bapak
    expect(p1?.phone).toBe('628156003943');
    expect(p1?.isPhoneValid).toBe(true);

    const p2 = parseParticipantLine('| SN2 | Eriga Bernadia - Bekasi | N | 6281234567890 |');
    expect(p2?.participantId).toBe('SN2');
    expect(p2?.cleanName).toBe('Eriga Bernadia');
    expect(p2?.region).toBe('Bekasi');
    expect(p2?.rawGenderCode).toBe('N');
    expect(p2?.salutation).toBe('Ibu'); // N = Perempuan = Ibu
    expect(p2?.phone).toBe('6281234567890');

    // Rita SM tidak terpotong
    const p4 = parseParticipantLine('| SN4 | Rita SM - | N | 6281987654321 |');
    expect(p4?.cleanName).toBe('Rita SM');
    expect(p4?.salutation).toBe('Ibu');
  });

  it('3. Gender mapping: Kode R/N mengalahkan deteksi tebakan nama', () => {
    // "Hany" biasanya ambigu (Perlu konfirmasi), tapi dengan kode N -> langsung Ibu
    const pHany = parseParticipantLine('| SN8 | Hany - Surabaya | N | 6287755667788 |');
    expect(pHany?.salutation).toBe('Ibu');
    expect(pHany?.salutationSource).toBe('gender_code');

    // "Nurul" biasanya wanita, tapi jika kode R -> Bapak
    const pNurul = parseParticipantLine('| SN99 | Nurul Hidayat | R | 628111222333 |');
    expect(pNurul?.salutation).toBe('Bapak');
    expect(pNurul?.salutationSource).toBe('gender_code');
  });

  it('4. Deteksi duplikasi berjenjang: ID > No WA > Nama', () => {
    const parsed = parseRawDatabase(googleSheetsSample);
    const withDuplicates = detectDuplicates(parsed);

    // SN3 memiliki nomor WA dan nama sama dengan SN2
    const sn3 = withDuplicates.find(p => p.participantId === 'SN3');
    expect(sn3?.isDuplicate).toBe(true);

    // Uji dua orang dengan nama sama persis tapi nomor WA berbeda (bukan duplikat)
    const testDifferentPeople = [
      parseParticipantLine('| SN10 | Ahmad Fauzi | R | 628111111111 |')!,
      parseParticipantLine('| SN11 | Ahmad Fauzi | R | 628222222222 |')!
    ];
    const dupCheck = detectDuplicates(testDifferentPeople);
    expect(dupCheck[0].isDuplicate).toBe(false);
    expect(dupCheck[1].isDuplicate).toBe(false); // ID & No WA berbeda -> BUKAN duplikat
  });

  it('5. Natural Message Structure Engine: 6 Pola Pembuka (Pola A–F) dan benefit mutlak', () => {
    const participant = parseParticipantLine('| SN1 | Ambar Susanto | L - Bandung | R | 628156003943 |')!;

    // Uji setiap pola pembuka A s/d F
    OPENER_PATTERNS.forEach((patt, idx) => {
      const { message, openerPattern } = generateSingleMessage(participant, {
        openerPattern: patt.id,
        flowPattern: (idx % 4) + 1,
      });

      expect(openerPattern).toBe(patt.id);

      // Benefit wajib mutlak tidak boleh berubah
      expect(message).toContain(MANDATORY_BENEFIT);

      // Tidak ada salam formal monoton berulang
      expect(message).not.toContain("Assalamu'alaikum warahmatullahi wabarakatuh");

      // Larangan mutlak
      expect(message.toLowerCase()).not.toContain('zoom');
      expect(message.toLowerCase()).not.toContain('ahad');
      expect(message.toLowerCase()).not.toContain('kesempatan mendapatkan');

      // Hitung kata (target 30-50 kata)
      const words = countWords(message);
      expect(words).toBeGreaterThanOrEqual(25);
      expect(words).toBeLessThanOrEqual(55);
    });
  });

  it('6. WhatsApp Click to Chat URL Generator dengan encoding yang presisi', () => {
    const phone = '628156003943';
    const message = `Halo, Bapak Ambar!\n\nSobatNgaji punya kabar gembira:\n*1x KONSULTASI TAHSIN GRATIS bersama Asatidz SobatNgaji.* 🌿\n\n*Bapak mau kami bantu daftarkan?*`;

    // Universal wa.me link
    const universalLink = generateWhatsAppLink(phone, message, 'universal');
    expect(universalLink).toContain(`https://wa.me/${phone}?text=`);
    expect(universalLink).toContain(encodeURIComponent('*1x KONSULTASI TAHSIN GRATIS bersama Asatidz SobatNgaji.*'));

    // Web link
    const webLink = generateWhatsAppLink(phone, message, 'web');
    expect(webLink).toContain(`https://web.whatsapp.com/send?phone=${phone}&text=`);

    // Desktop link
    const desktopLink = generateWhatsAppLink(phone, message, 'desktop');
    expect(desktopLink).toContain(`whatsapp://send?phone=${phone}&text=`);
  });
});
