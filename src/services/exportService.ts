import * as XLSX from 'xlsx';
import type { Participant } from '../types';

export interface ExportRow {
  Nomor: number;
  ID: string;
  Nama: string;
  Gender: string;
  Sapaan: string;
  WhatsApp: string;
  Status: string;
  Pesan: string;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'opened':
      return 'WhatsApp Dibuka';
    case 'sent':
      return 'Terkirim';
    case 'skipped':
      return 'Dilewati';
    case 'pending':
    default:
      return 'Belum Dibuka';
  }
}

function prepareExportRows(participants: Participant[]): ExportRow[] {
  return participants.map((p, index) => ({
    Nomor: index + 1,
    ID: p.participantId || `SN-${index + 1}`,
    Nama: p.cleanName,
    Gender: p.detectedGender === 'L' ? 'Laki-laki' : p.detectedGender === 'P' ? 'Perempuan' : '-',
    Sapaan: p.salutation,
    WhatsApp: p.phone || p.rawPhone || '',
    Status: getStatusLabel(p.deliveryStatus),
    Pesan: p.message || '',
  }));
}

export function exportToCSV(participants: Participant[], filename = 'SobatNgaji_Pesan.csv'): void {
  const rows = prepareExportRows(participants);
  const headers = ['Nomor', 'ID', 'Nama', 'Gender', 'Sapaan', 'WhatsApp', 'Status', 'Pesan'];
  const csvLines = [headers.join(',')];

  for (const row of rows) {
    const escapedPesan = `"${row.Pesan.replace(/"/g, '""')}"`;
    const escapedNama = `"${row.Nama.replace(/"/g, '""')}"`;
    const escapedSapaan = `"${row.Sapaan.replace(/"/g, '""')}"`;
    const escapedId = `"${row.ID.replace(/"/g, '""')}"`;
    const escapedGender = `"${row.Gender.replace(/"/g, '""')}"`;
    const escapedPhone = `"${row.WhatsApp.replace(/"/g, '""')}"`;
    const escapedStatus = `"${row.Status.replace(/"/g, '""')}"`;

    csvLines.push(
      `${row.Nomor},${escapedId},${escapedNama},${escapedGender},${escapedSapaan},${escapedPhone},${escapedStatus},${escapedPesan}`
    );
  }

  const csvContent = '\uFEFF' + csvLines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

export function exportToExcel(participants: Participant[], filename = 'SobatNgaji_Pesan.xlsx'): void {
  const rows = prepareExportRows(participants);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 8 },  // Nomor
    { wch: 10 }, // ID
    { wch: 28 }, // Nama
    { wch: 14 }, // Gender
    { wch: 14 }, // Sapaan
    { wch: 18 }, // WhatsApp
    { wch: 18 }, // Status
    { wch: 80 }, // Pesan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pesan SobatNgaji');
  XLSX.writeFile(workbook, filename);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.error('Gagal menyalin ke clipboard:', err);
    return false;
  }
}

export async function copyAllMessages(participants: Participant[]): Promise<boolean> {
  const messagesWithHeader = participants
    .filter(p => !!p.message)
    .map((p, idx) => {
      const idStr = p.participantId ? ` [${p.participantId}]` : '';
      const phoneStr = p.phone ? ` - WA: ${p.phone}` : '';
      return `--- [${idx + 1}]${idStr} ${p.cleanName} (${p.salutation})${phoneStr} ---\n${p.message}`;
    })
    .join('\n\n========================================\n\n');

  return copyToClipboard(messagesWithHeader);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
