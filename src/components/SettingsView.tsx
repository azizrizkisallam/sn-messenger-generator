import React, { useState } from 'react';
import type { CustomDictionaryEntry, ProcessingOptions } from '../types';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Check, 
  ShieldCheck, 
  FileCode,
  Smartphone,
  ShieldAlert
} from 'lucide-react';
import { OPENER_PATTERNS, MANDATORY_BENEFIT } from '../services/messageGenerator';

interface SettingsViewProps {
  customDictionary: CustomDictionaryEntry[];
  onAddDictionaryEntry: (name: string, gender: 'L' | 'P') => void;
  onDeleteDictionaryEntry: (name: string) => void;
  onResetDictionary: () => void;
  options: ProcessingOptions;
  onUpdateOptions: (options: ProcessingOptions) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonString: string) => void;
  onClearAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  customDictionary,
  onAddDictionaryEntry,
  onDeleteDictionaryEntry,
  onResetDictionary,
  options,
  onUpdateOptions,
  onExportBackup,
  onImportBackup,
  onClearAllData,
}) => {
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<'L' | 'P'>('L');
  const [dictSearch, setDictSearch] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddDictionaryEntry(newName.trim(), newGender);
    setNewName('');
  };

  const filteredDict = customDictionary.filter(entry =>
    entry.name.toLowerCase().includes(dictSearch.toLowerCase())
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        onImportBackup(text);
        setImportStatus('Cadangan berhasil diimpor!');
        setTimeout(() => setImportStatus(null), 3000);
      } catch (err) {
        setImportStatus('Gagal membaca file backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Top Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
          Pengaturan Aplikasi
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          Kelola kamus sapaan kustom, periksa variasi struktur pesan alami, preferensi platform WhatsApp, dan pencadangan data.
        </p>
      </div>

      {/* 1. Pengaturan Platform WhatsApp */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-700" />
          <span>Preferensi Platform Click to WhatsApp</span>
        </h2>
        <p className="text-xs text-slate-600">
          Pilih mekanisme tautan WhatsApp yang ingin dibuka saat tombol <strong>Buka WhatsApp</strong> diklik.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <label className={`p-3.5 rounded-lg border cursor-pointer select-none transition-all flex flex-col justify-between min-h-[44px] ${
            options.preferredPlatform === 'universal'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-medium'
              : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">Tautan Universal (wa.me)</span>
              <input
                type="radio"
                name="preferredPlatform"
                value="universal"
                checked={options.preferredPlatform === 'universal'}
                onChange={() => onUpdateOptions({ ...options, preferredPlatform: 'universal' })}
                className="text-emerald-600 focus:ring-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-500">
              Membuka di aplikasi ponsel jika di smartphone, atau mengarahkan ke WhatsApp Web jika di browser desktop.
            </span>
          </label>

          <label className={`p-3.5 rounded-lg border cursor-pointer select-none transition-all flex flex-col justify-between min-h-[44px] ${
            options.preferredPlatform === 'web'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-medium'
              : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">WhatsApp Web</span>
              <input
                type="radio"
                name="preferredPlatform"
                value="web"
                checked={options.preferredPlatform === 'web'}
                onChange={() => onUpdateOptions({ ...options, preferredPlatform: 'web' })}
                className="text-emerald-600 focus:ring-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-500">
              Membuka langsung di peramban web (web.whatsapp.com). Cocok untuk admin di komputer desktop.
            </span>
          </label>

          <label className={`p-3.5 rounded-lg border cursor-pointer select-none transition-all flex flex-col justify-between min-h-[44px] ${
            options.preferredPlatform === 'desktop'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-medium'
              : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">WhatsApp App / Desktop</span>
              <input
                type="radio"
                name="preferredPlatform"
                value="desktop"
                checked={options.preferredPlatform === 'desktop'}
                onChange={() => onUpdateOptions({ ...options, preferredPlatform: 'desktop' })}
                className="text-emerald-600 focus:ring-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-500">
              Protokol aplikasi sistem (whatsapp://). Membuka aplikasi WhatsApp Desktop Windows/Mac atau WhatsApp Mobile.
            </span>
          </label>
        </div>
      </div>

      {/* 2. Struktur Variasi Pesan Alami (Pola A–F & 4 Alur) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-700" />
            <span>Natural Message Structure Engine</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Menghasilkan pesan personal natural dengan 6 variasi pembuka dan 4 susunan alur pesan yang tidak monoton.
          </p>
        </div>

        {/* Konsistensi Benefit Wajib */}
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Benefit Mutlak SobatNgaji:</strong> Seluruh pesan wajib memuat kalimat penawaran resmi:
            <code className="block mt-1 font-mono font-semibold bg-white p-2 rounded border border-emerald-200 text-emerald-950">
              {MANDATORY_BENEFIT}
            </code>
            Tidak ada penyebutan acara Ahad, Zoom Meeting, atau manipulasi urgensi palsu.
          </div>
        </div>

        {/* 6 Pola Pembuka */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-slate-900 block">
            6 Pola Struktur Pembuka Alami:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {OPENER_PATTERNS.map((patt) => (
              <div key={patt.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <span className="font-semibold text-slate-900 block mb-1">{patt.name}</span>
                <p className="text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
                  {patt.template.replace(/\{\{sapaan\}\}/g, 'Bapak/Ibu').replace(/\{\{nama\}\}/g, '[Nama]')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Susunan Alur Pesan */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-900 block">
            4 Variasi Susunan Alur Komunikasi:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
              <strong>Alur 1:</strong> Pembuka → Benefit → Penjelasan singkat / Ajakan → CTA
            </div>
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
              <strong>Alur 2:</strong> Sapaan ringkas → Benefit → CTA
            </div>
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
              <strong>Alur 3:</strong> Salam &amp; Doa → Sapaan &amp; Benefit → CTA
            </div>
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
              <strong>Alur 4:</strong> Sapaan → Konteks SobatNgaji → Benefit → CTA
            </div>
          </div>
        </div>
      </div>

      {/* 3. Kamus Sapaan Kustom Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>Kamus Sapaan Kustom (Memori Browser)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Aturan nama yang Anda koreksi secara manual sebagai Bapak atau Ibu. Tersimpan di localStorage browser Anda.
            </p>
          </div>
          {customDictionary.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Yakin ingin mereset seluruh kamus kustom?')) {
                  onResetDictionary();
                }
              }}
              className="text-xs text-red-600 hover:text-red-700 font-medium py-1 px-2 rounded hover:bg-red-50 transition-colors min-h-[44px] flex items-center"
            >
              Reset Kamus Kustom
            </button>
          )}
        </div>

        {/* Form Tambah Nama Kustom */}
        <form onSubmit={handleAddRule} className="flex flex-wrap items-center gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ketik nama (contoh: Hany, Sasya, Eriga)"
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-emerald-600 min-h-[44px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={newGender}
              onChange={(e) => setNewGender(e.target.value as 'L' | 'P')}
              className="text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium min-h-[44px]"
            >
              <option value="L">L (Sapaan: Bapak)</option>
              <option value="P">P (Sapaan: Ibu)</option>
            </select>

            <button
              type="submit"
              disabled={!newName.trim()}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-xs min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan Aturan</span>
            </button>
          </div>
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-700">
              Total Entri Kustom: {customDictionary.length} nama
            </span>
            {customDictionary.length > 5 && (
              <input
                type="text"
                value={dictSearch}
                onChange={(e) => setDictSearch(e.target.value)}
                placeholder="Cari entri di kamus..."
                className="text-xs px-2.5 py-1.5 rounded border border-slate-200 max-w-xs min-h-[44px]"
              />
            )}
          </div>

          {customDictionary.length === 0 ? (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
              Belum ada entri kustom.
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
              {filteredDict.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between p-2.5 text-xs sm:text-sm hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 capitalize">{entry.name}</span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                        entry.gender === 'L'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {entry.gender === 'L' ? 'Bapak (L)' : 'Ibu (P)'}
                    </span>
                  </div>
                  <button
                    onClick={() => onDeleteDictionaryEntry(entry.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title={`Hapus aturan ${entry.name}`}
                    aria-label={`Hapus aturan ${entry.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Etika Komunikasi & Manajemen Data */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldAlert className="w-4 h-4 text-emerald-700" />
          <span>Etika Komunikasi &amp; Manajemen Data Browser</span>
        </h2>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={options.saveToDictionaryOnOverride}
            onChange={(e) =>
              onUpdateOptions({
                ...options,
                saveToDictionaryOnOverride: e.target.checked,
              })
            }
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
          />
          <div>
            <span className="text-xs sm:text-sm font-medium text-slate-900 block">
              Otomatis Simpan Koreksi Sapaan ke Kamus Kustom
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              Ketika Anda mengganti sapaan peserta di tabel database, nama depannya akan otomatis diingat untuk baris berikutnya.
            </span>
          </div>
        </label>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <button
            onClick={onExportBackup}
            className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 min-h-[44px]"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Ekspor Cadangan (JSON)</span>
          </button>

          <label className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer min-h-[44px]">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Impor Cadangan (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (window.confirm('PERINGATAN: Seluruh database, status pengiriman, kamus kustom, dan pengaturan akan dihapus dari browser. Lanjutkan?')) {
                onClearAllData();
              }
            }}
            className="px-3.5 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs sm:text-sm font-medium transition-colors ml-auto min-h-[44px]"
          >
            Bersihkan Seluruh Penyimpanan
          </button>
        </div>

        {importStatus && (
          <div className="text-xs font-medium text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{importStatus}</span>
          </div>
        )}
      </div>
    </div>
  );
};
