/**
 * Layanan normalisasi nama peserta.
 * Menjaga keaslian nama lengkap, gelar, dan akronim (seperti S.Pd, SM, H., M.M.).
 */

const PRESERVED_ACRONYMS = new Set([
  'SM', 'SE', 'ST', 'SH', 'SKM', 'SS', 'SIKOM', 'SIP',
  'SPD', 'SAG', 'SSI', 'SP', 'SPT', 'SKOM',
  'MM', 'MSI', 'MPD', 'MH', 'MT', 'MKOM', 'MPH',
  'DR', 'DRG', 'IR', 'KH', 'HJ', 'H'
]);

export function cleanWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

export function normalizeName(rawName: string): string {
  let name = cleanWhitespace(rawName);

  // Hapus karakter pemisah tersisa di awal atau akhir nama (- | , : / \ _)
  // TIDAK menghapus titik (.) di akhir karena bisa merupakan singkatan gelar seperti S.Pd. atau M.M.
  name = name.replace(/^[-|,:/\\_]+|[-|,:/\\_]+$/g, '').trim();

  if (!name) return '';

  // Periksa apakah nama ditulis ALL CAPS
  const isAllCaps = name === name.toUpperCase() && /[A-Z]/.test(name);

  if (isAllCaps) {
    const parts = name.split(' ');
    const normalizedParts = parts.map((part) => {
      const cleanPart = part.replace(/[^A-Za-z]/g, '');
      if (PRESERVED_ACRONYMS.has(cleanPart)) {
        return part;
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    });
    name = normalizedParts.join(' ');
  }

  return cleanWhitespace(name);
}
