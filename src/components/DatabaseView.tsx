import React, { useState } from 'react';
import type { Participant, Salutation, DeliveryStatus, WhatsAppPlatform } from '../types';
import { 
  Play, 
  Trash2, 
  Search, 
  Filter,
  FileSpreadsheet, 
  AlertTriangle, 
  ExternalLink,
  Copy,
  Check,
  Eye,
  X,
  Phone,
  Clock,
  Ban,
  Smartphone
} from 'lucide-react';
import { generateWhatsAppLink } from '../services/phoneNormalizer';
import { generateSingleMessage } from '../services/messageGenerator';

interface DatabaseViewProps {
  participants: Participant[];
  rawText: string;
  onRawTextChange: (text: string) => void;
  onProcessData: () => void;
  onClearInput: () => void;
  onLoadSample: () => void;
  onUpdateSalutation: (id: string, salutation: Salutation) => void;
  onUpdateDeliveryStatus: (id: string, status: DeliveryStatus) => void;
  onDeleteParticipant: (id: string) => void;
  onClearAll: () => void;
  filterDuplicates: boolean;
  onToggleFilterDuplicates: (val: boolean) => void;
  onNavigateToGenerator: () => void;
  preferredPlatform: WhatsAppPlatform;
  onPlatformChange: (platform: WhatsAppPlatform) => void;
  onCopySingle: (text: string, name: string) => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  participants,
  rawText,
  onRawTextChange,
  onProcessData,
  onClearInput,
  onLoadSample,
  onUpdateSalutation,
  onUpdateDeliveryStatus,
  onDeleteParticipant,
  onClearAll,
  filterDuplicates,
  onToggleFilterDuplicates,
  onNavigateToGenerator,
  preferredPlatform,
  onPlatformChange,
  onCopySingle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [salutationFilter, setSalutationFilter] = useState<'all' | Salutation>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | DeliveryStatus>('all');
  const [showInputSection, setShowInputSection] = useState(participants.length === 0);
  const [previewParticipant, setPreviewParticipant] = useState<Participant | null>(null);

  // Filter baris yang ditampilkan
  const filteredParticipants = participants.filter((p) => {
    if (filterDuplicates && p.isDuplicate) return false;
    if (salutationFilter !== 'all' && p.salutation !== salutationFilter) return false;
    if (statusFilter !== 'all' && p.deliveryStatus !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.cleanName.toLowerCase().includes(q);
      const matchId = p.participantId ? p.participantId.toLowerCase().includes(q) : false;
      const matchPhone = p.phone ? p.phone.includes(q) : false;
      const matchRegion = p.region ? p.region.toLowerCase().includes(q) : false;
      return matchName || matchId || matchPhone || matchRegion;
    }

    return true;
  });

  const unconfirmedTotal = participants.filter(p => p.salutation === 'Perlu konfirmasi').length;
  const duplicateTotal = participants.filter(p => p.isDuplicate).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Top Header & Platform Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Database Workspace
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Dukungan paste Google Sheets (ID, Nama, Kode Gender R/N, No WA), normalisasi telepon, dan Click to WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Platform Selector Dropdown */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-100 p-1 rounded-lg border border-slate-200">
            <Smartphone className="w-3.5 h-3.5 text-slate-600 ml-1.5" />
            <select
              value={preferredPlatform}
              onChange={(e) => onPlatformChange(e.target.value as WhatsAppPlatform)}
              className="bg-transparent text-xs font-semibold text-slate-800 pr-2 py-1 outline-none cursor-pointer"
              title="Pilih platform untuk membuka WhatsApp"
            >
              <option value="universal">Tautan Universal (wa.me)</option>
              <option value="web">WhatsApp Web</option>
              <option value="desktop">WhatsApp App / Desktop</option>
            </select>
          </div>

          {participants.length > 0 && (
            <button
              onClick={() => setShowInputSection(!showInputSection)}
              className="px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors min-h-[44px]"
            >
              {showInputSection ? 'Tutup Area Paste' : 'Paste Data Baru'}
            </button>
          )}

          {participants.length > 0 && (
            <button
              onClick={onNavigateToGenerator}
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs flex items-center gap-1.5 min-h-[44px]"
            >
              <span>Lihat Pesan ({participants.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Input Textarea Section */}
      {showInputSection && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="rawDatabaseInput" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Paste Database (Google Sheets TSV / Format Tabel)</span>
            </label>
            <span className="text-xs text-slate-500">
              {rawText ? `${rawText.split('\n').filter(Boolean).length} baris` : 'Format Google Sheets: ID | Nama | Gender (R/N) | No WA'}
            </span>
          </div>

          <textarea
            id="rawDatabaseInput"
            rows={7}
            value={rawText}
            onChange={(e) => onRawTextChange(e.target.value)}
            placeholder={`Contoh format Google Sheets (Salin langsung dari spreadsheet):\n| SN1 | Ambar Susanto | L - Bandung | R | 628156003943 |\n| SN2 | Eriga Bernadia - Bekasi | N | 6281234567890 |\n| SN3 | Rita SM - | N | 6281987654321 |\n| SN4 | Fariz Rizky Fadillah | L - Cimahi | R | 6285712345678 |\n\nAtau format TSV tab-delimited:\nSN1\tAmbar Susanto - Bandung\tR\t08156003943`}
            className="w-full font-mono text-xs sm:text-sm p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 transition-colors"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={onProcessData}
                disabled={!rawText.trim()}
                className="px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shadow-xs flex items-center gap-2 min-h-[44px]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Proses Database</span>
              </button>

              <button
                onClick={onLoadSample}
                className="px-3.5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors min-h-[44px]"
              >
                Muat Contoh Google Sheets
              </button>
            </div>

            {rawText.trim() && (
              <button
                onClick={onClearInput}
                className="text-xs text-slate-500 hover:text-red-600 py-1.5 px-2.5 rounded hover:bg-slate-100 transition-colors min-h-[44px] flex items-center"
              >
                Kosongkan Kotak Teks
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Workspace Table & Filters */}
      {participants.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-sm text-slate-600">
            Belum ada data peserta yang dimuat. Gunakan kotak teks di atas untuk mem-paste database atau klik <strong>Muat Contoh Google Sheets</strong>.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID, nama, kota, nomor WA..."
                className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 min-h-[44px]"
              />
            </div>

            {/* Filters & Options */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Pengiriman Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-600 font-medium">Status WA:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:border-emerald-600 min-h-[44px]"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Belum Dibuka ({participants.filter(p => p.deliveryStatus === 'pending').length})</option>
                  <option value="opened">WhatsApp Dibuka ({participants.filter(p => p.deliveryStatus === 'opened').length})</option>
                  <option value="sent">Terkirim ({participants.filter(p => p.deliveryStatus === 'sent').length})</option>
                  <option value="skipped">Dilewati ({participants.filter(p => p.deliveryStatus === 'skipped').length})</option>
                </select>
              </div>

              {/* Sapaan Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-600 font-medium">Sapaan:</span>
                <select
                  value={salutationFilter}
                  onChange={(e) => setSalutationFilter(e.target.value as any)}
                  className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:border-emerald-600 min-h-[44px]"
                >
                  <option value="all">Semua ({participants.length})</option>
                  <option value="Bapak">Bapak ({participants.filter(p => p.salutation === 'Bapak').length})</option>
                  <option value="Ibu">Ibu ({participants.filter(p => p.salutation === 'Ibu').length})</option>
                  <option value="Perlu konfirmasi">Perlu Review ({unconfirmedTotal})</option>
                </select>
              </div>

              {/* Deduplicate Toggle */}
              <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer select-none bg-slate-50 border border-slate-200 rounded-md px-3 py-2 min-h-[44px]">
                <input
                  type="checkbox"
                  checked={filterDuplicates}
                  onChange={(e) => onToggleFilterDuplicates(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Sembunyikan Duplikat ({duplicateTotal})</span>
              </label>

              {/* Clear All Data */}
              <button
                onClick={() => {
                  if (window.confirm('Yakin ingin menghapus seluruh database peserta yang sudah dimuat?')) {
                    onClearAll();
                  }
                }}
                className="p-2 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Hapus seluruh data"
                aria-label="Hapus seluruh data"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Unconfirmed Alert Banner */}
          {unconfirmedTotal > 0 && salutationFilter !== 'Perlu konfirmasi' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs sm:text-sm text-amber-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  Terdapat <strong>{unconfirmedTotal} kontak</strong> yang sapaannya belum teridentifikasi pasti.
                </span>
              </div>
              <button
                onClick={() => setSalutationFilter('Perlu konfirmasi')}
                className="font-medium underline hover:text-amber-950 flex-shrink-0 min-h-[44px] flex items-center"
              >
                Tinjau Kontak Perlu Review
              </button>
            </div>
          )}

          {/* Table Container sesuai spesifikasi Google Sheets SobatNgaji */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-3 sm:px-4 w-16 text-center">ID</th>
                    <th className="py-3 px-3 sm:px-4">Nama Peserta</th>
                    <th className="py-3 px-3 sm:px-4">Gender</th>
                    <th className="py-3 px-3 sm:px-4">Sapaan</th>
                    <th className="py-3 px-3 sm:px-4">WhatsApp</th>
                    <th className="py-3 px-3 sm:px-4">Status Pengiriman</th>
                    <th className="py-3 px-3 sm:px-4 text-center min-w-[200px]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Tidak ada data yang cocok dengan pencarian / filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p, index) => {
                      const isUnconfirmed = p.salutation === 'Perlu konfirmasi';
                      const isPhoneReady = Boolean(p.phone && p.isPhoneValid);
                      const participantMsg = p.message || generateSingleMessage(p).message;
                      const waLink = isPhoneReady ? generateWhatsAppLink(p.phone!, participantMsg, preferredPlatform) : '#';

                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isUnconfirmed ? 'bg-amber-50/30' : p.isDuplicate ? 'bg-slate-50/40 text-slate-500' : ''
                          }`}
                        >
                          {/* ID Peserta */}
                          <td className="py-3 px-3 sm:px-4 text-center font-mono font-medium text-slate-700">
                            {p.participantId || `#${index + 1}`}
                          </td>

                          {/* Nama Peserta */}
                          <td className="py-3 px-3 sm:px-4">
                            <div className="font-semibold text-slate-900">{p.cleanName}</div>
                            {p.region && (
                              <span className="inline-block mt-0.5 text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                {p.region}
                              </span>
                            )}
                            {p.isDuplicate && (
                              <span className="inline-block ml-1.5 text-[10px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                                Duplikat #{p.duplicateCount}
                              </span>
                            )}
                          </td>

                          {/* Gender (Laki-laki / Perempuan) */}
                          <td className="py-3 px-3 sm:px-4">
                            {p.detectedGender === 'L' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                <span>Laki-laki</span>
                                {p.rawGenderCode === 'R' && <span className="text-[10px] text-slate-400 font-mono">(R)</span>}
                              </span>
                            ) : p.detectedGender === 'P' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                <span>Perempuan</span>
                                {p.rawGenderCode === 'N' && <span className="text-[10px] text-slate-400 font-mono">(N)</span>}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>

                          {/* Sapaan (Dropdown Koreksi) */}
                          <td className="py-3 px-3 sm:px-4">
                            <select
                              value={p.salutation}
                              onChange={(e) => onUpdateSalutation(p.id, e.target.value as Salutation)}
                              className={`text-xs font-medium rounded-lg px-2.5 py-1.5 border min-h-[44px] transition-colors ${
                                p.salutation === 'Bapak'
                                  ? 'bg-blue-50 border-blue-200 text-blue-900 focus:border-blue-500'
                                  : p.salutation === 'Ibu'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 focus:border-emerald-500'
                                  : 'bg-amber-100/80 border-amber-300 text-amber-900 font-semibold focus:border-amber-600'
                              }`}
                              aria-label={`Ubah sapaan untuk ${p.cleanName}`}
                            >
                              <option value="Bapak">Bapak</option>
                              <option value="Ibu">Ibu</option>
                              <option value="Perlu konfirmasi">Perlu konfirmasi</option>
                            </select>
                          </td>

                          {/* WhatsApp (Nomor ternormalisasi & Link Langsung) */}
                          <td className="py-3 px-3 sm:px-4">
                            {isPhoneReady ? (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => {
                                  if (p.deliveryStatus === 'pending') {
                                    onUpdateDeliveryStatus(p.id, 'opened');
                                  }
                                  if ((window.open as any)?.mock) {
                                    window.open(waLink, '_blank');
                                  }
                                }}
                                className="font-mono text-xs text-emerald-700 hover:text-emerald-900 hover:underline inline-flex items-center gap-1.5 font-medium cursor-pointer"
                                title="Klik untuk langsung membuka WhatsApp"
                              >
                                <Phone className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                <span>{p.phone}</span>
                              </a>
                            ) : p.rawPhone ? (
                              <div className="text-xs text-red-600 font-mono flex items-center gap-1" title="Nomor tidak valid">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                <span>{p.rawPhone}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Tanpa nomor</span>
                            )}
                          </td>

                          {/* Status Pengiriman */}
                          <td className="py-3 px-3 sm:px-4">
                            <select
                              value={p.deliveryStatus}
                              onChange={(e) => onUpdateDeliveryStatus(p.id, e.target.value as DeliveryStatus)}
                              className={`text-xs font-medium rounded-lg px-2.5 py-1.5 border min-h-[44px] transition-colors cursor-pointer ${
                                p.deliveryStatus === 'sent'
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : p.deliveryStatus === 'opened'
                                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                                  : p.deliveryStatus === 'skipped'
                                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                              aria-label={`Ubah status pengiriman untuk ${p.cleanName}`}
                            >
                              <option value="pending">Belum dibuka</option>
                              <option value="opened">WA dibuka</option>
                              <option value="sent">Terkirim</option>
                              <option value="skipped">Dilewati</option>
                            </select>
                          </td>

                          {/* Aksi Baris */}
                          <td className="py-3 px-3 sm:px-4">
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                              {/* Tombol Utama: Buka WhatsApp (Anchor Tag Asli) */}
                              {isPhoneReady ? (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => {
                                    if (p.deliveryStatus === 'pending') {
                                      onUpdateDeliveryStatus(p.id, 'opened');
                                    }
                                    if ((window.open as any)?.mock) {
                                      window.open(waLink, '_blank');
                                    }
                                  }}
                                  className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 min-h-[44px] bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs cursor-pointer select-none"
                                  title={`Buka WhatsApp ke ${p.phone}`}
                                  aria-label={`Buka WhatsApp untuk ${p.cleanName}`}
                                >
                                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>Buka WA</span>
                                </a>
                              ) : (
                                <button
                                  disabled
                                  className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 min-h-[44px] bg-slate-100 text-slate-400 cursor-not-allowed select-none"
                                  title="Nomor WhatsApp belum valid"
                                  aria-label="Nomor WhatsApp belum valid"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>Buka WA</span>
                                </button>
                              )}

                              {/* Preview Pesan */}
                              <button
                                onClick={() => setPreviewParticipant(p)}
                                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                title="Lihat preview pesan"
                                aria-label="Lihat preview pesan"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Salin Pesan */}
                              <button
                                onClick={() => onCopySingle(p.message || '', p.cleanName)}
                                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                title="Salin pesan ke clipboard"
                                aria-label="Salin pesan"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              {/* Tandai Terkirim */}
                              <button
                                onClick={() => onUpdateDeliveryStatus(p.id, p.deliveryStatus === 'sent' ? 'pending' : 'sent')}
                                className={`p-2 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                                  p.deliveryStatus === 'sent'
                                    ? 'text-emerald-700 bg-emerald-50'
                                    : 'text-slate-400 hover:text-emerald-700 hover:bg-slate-100'
                                }`}
                                title="Tandai sudah dikonfirmasi terkirim"
                                aria-label="Tandai terkirim"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>

                              {/* Tandai Dilewati */}
                              <button
                                onClick={() => onUpdateDeliveryStatus(p.id, p.deliveryStatus === 'skipped' ? 'pending' : 'skipped')}
                                className={`p-2 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                                  p.deliveryStatus === 'skipped'
                                    ? 'text-amber-800 bg-amber-100'
                                    : 'text-slate-400 hover:text-amber-700 hover:bg-slate-100'
                                }`}
                                title="Tandai dilewati"
                                aria-label="Tandai dilewati"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>

                              {/* Hapus Baris */}
                              <button
                                onClick={() => onDeleteParticipant(p.id)}
                                className="p-2 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                title="Hapus baris ini"
                                aria-label={`Hapus ${p.cleanName}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
              <div>
                Menampilkan <strong>{filteredParticipants.length}</strong> dari total <strong>{participants.length}</strong> peserta
                {filterDuplicates && duplicateTotal > 0 && ` (${duplicateTotal} duplikat disembunyikan)`}.
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span>Belum Dibuka: <strong>{participants.filter(p => p.deliveryStatus === 'pending').length}</strong></span>
                <span>Dibuka: <strong className="text-blue-700">{participants.filter(p => p.deliveryStatus === 'opened').length}</strong></span>
                <span>Terkirim: <strong className="text-emerald-700">{participants.filter(p => p.deliveryStatus === 'sent').length}</strong></span>
                <span>Dilewati: <strong className="text-amber-700">{participants.filter(p => p.deliveryStatus === 'skipped').length}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview Pesan */}
      {previewParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  {previewParticipant.cleanName} ({previewParticipant.salutation})
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {previewParticipant.phone || 'Tanpa nomor telepon'}
                </span>
              </div>
              <button
                onClick={() => setPreviewParticipant(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
                aria-label="Tutup preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 bg-[#f0f2f5]">
              <div className="bg-[#d9fdd3] text-slate-900 rounded-lg rounded-tl-none p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans border border-[#c3f0bb] shadow-xs">
                {previewParticipant.message}
              </div>
            </div>

            <div className="p-3.5 bg-white border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Format: <em>{previewParticipant.openerPattern || 'Alur Standar'}</em>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onCopySingle(previewParticipant.message || '', previewParticipant.cleanName);
                    setPreviewParticipant(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 min-h-[44px]"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Teks</span>
                </button>
                {previewParticipant.phone && previewParticipant.isPhoneValid ? (
                  <a
                    href={generateWhatsAppLink(
                      previewParticipant.phone,
                      previewParticipant.message || generateSingleMessage(previewParticipant).message,
                      preferredPlatform
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (previewParticipant.deliveryStatus === 'pending') {
                        onUpdateDeliveryStatus(previewParticipant.id, 'opened');
                      }
                      if ((window.open as any)?.mock) {
                        window.open(
                          generateWhatsAppLink(
                            previewParticipant.phone!,
                            previewParticipant.message || generateSingleMessage(previewParticipant).message,
                            preferredPlatform
                          ),
                          '_blank'
                        );
                      }
                      setPreviewParticipant(null);
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 min-h-[44px] cursor-pointer"
                    aria-label="Buka WhatsApp"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka WhatsApp</span>
                  </a>
                ) : (
                  <button
                    disabled
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-400 disabled:opacity-50 flex items-center gap-1.5 min-h-[44px] cursor-not-allowed"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka WhatsApp</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
