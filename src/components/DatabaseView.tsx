import React, { useState, useMemo, useDeferredValue } from 'react';
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
  Smartphone,
  ChevronLeft,
  ChevronRight
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

interface ParticipantRowProps {
  p: Participant;
  displayIndex: number;
  preferredPlatform: WhatsAppPlatform;
  onUpdateSalutation: (id: string, salutation: Salutation) => void;
  onUpdateDeliveryStatus: (id: string, status: DeliveryStatus) => void;
  onDeleteParticipant: (id: string) => void;
  onCopySingle: (text: string, name: string) => void;
  onPreview: (p: Participant) => void;
}

const ParticipantRow = React.memo<ParticipantRowProps>(({
  p,
  displayIndex,
  preferredPlatform,
  onUpdateSalutation,
  onUpdateDeliveryStatus,
  onDeleteParticipant,
  onCopySingle,
  onPreview,
}) => {
  const isUnconfirmed = p.salutation === 'Perlu konfirmasi';
  const isPhoneReady = Boolean(p.phone && p.isPhoneValid);
  const participantMsg = p.message || generateSingleMessage(p).message;
  const waLink = isPhoneReady ? generateWhatsAppLink(p.phone!, participantMsg, preferredPlatform) : '#';

  const isOpened = p.deliveryStatus === 'opened';
  const isSent = p.deliveryStatus === 'sent';
  const isSkipped = p.deliveryStatus === 'skipped';
  const isContacted = isOpened || isSent;

  return (
    <tr
      className={`hover:bg-slate-50/80 transition-colors border-b border-slate-100 ${
        isSent
          ? 'bg-emerald-50/25 border-l-4 border-l-emerald-600'
          : isOpened
          ? 'bg-blue-50/25 border-l-4 border-l-blue-600'
          : isSkipped
          ? 'bg-slate-50/60 border-l-4 border-l-slate-400 opacity-70'
          : isUnconfirmed
          ? 'bg-amber-50/30 border-l-4 border-l-amber-500'
          : p.isDuplicate
          ? 'bg-slate-50/40 text-slate-500 border-l-4 border-l-transparent'
          : 'border-l-4 border-l-transparent'
      }`}
    >
      {/* ID Peserta */}
      <td className="py-3 px-3 sm:px-4 text-center font-mono font-medium text-slate-700">
        <div className="flex items-center justify-center gap-1.5">
          {isSent && (
            <span title="Pesan Terkirim">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
            </span>
          )}
          {isOpened && (
            <span title="WhatsApp Sudah Dibuka">
              <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />
            </span>
          )}
          <span className={isContacted ? "text-slate-400" : ""}>
            {p.participantId || `#${displayIndex}`}
          </span>
        </div>
      </td>

      {/* Nama Peserta */}
      <td className="py-3 px-3 sm:px-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={isContacted ? "line-through text-slate-400 decoration-slate-400 decoration-2 font-medium" : "font-semibold text-slate-900"}>
            {p.cleanName}
          </span>
          {isSent && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              <Check className="w-2.5 h-2.5 stroke-[3]" /> Terkirim
            </span>
          )}
          {isOpened && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
              <Check className="w-2.5 h-2.5 stroke-[3]" /> WA Dibuka
            </span>
          )}
        </div>
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
          className={`text-xs font-medium rounded-lg px-2.5 py-1.5 border min-h-[44px] transition-colors cursor-pointer ${
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
            className={`font-mono text-xs inline-flex items-center gap-1.5 font-medium cursor-pointer ${
              isContacted
                ? 'text-slate-500 line-through decoration-slate-400 hover:text-slate-700'
                : 'text-emerald-700 hover:text-emerald-900 hover:underline'
            }`}
            title={isContacted ? "WhatsApp sudah pernah dibuka. Klik untuk buka lagi" : "Klik untuk langsung membuka WhatsApp"}
          >
            <Phone className={`w-3 h-3 flex-shrink-0 ${isContacted ? 'text-slate-400' : 'text-emerald-600'}`} />
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
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 min-h-[44px] transition-colors shadow-xs cursor-pointer select-none ${
                isSent
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : isOpened
                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
              title={isContacted ? `WhatsApp sudah pernah dibuka. Klik untuk buka ulang ke ${p.phone}` : `Buka WhatsApp ke ${p.phone}`}
              aria-label={`Buka WA untuk ${p.cleanName}`}
            >
              {isSent ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5] flex-shrink-0" />
                  <span>Terkirim</span>
                </>
              ) : isOpened ? (
                <>
                  <Check className="w-3.5 h-3.5 text-blue-600 stroke-[2.5] flex-shrink-0" />
                  <span>Buka Ulang</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Buka WA</span>
                </>
              )}
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
            onClick={() => onPreview(p)}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            title="Lihat preview pesan"
            aria-label="Lihat preview pesan"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Salin Pesan */}
          <button
            onClick={() => onCopySingle(participantMsg, p.cleanName)}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            title="Salin pesan ke clipboard"
            aria-label="Salin pesan"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Tandai Terkirim */}
          <button
            onClick={() => onUpdateDeliveryStatus(p.id, p.deliveryStatus === 'sent' ? 'pending' : 'sent')}
            className={`p-2 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
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
            className={`p-2 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
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
            className="p-2 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            title="Hapus baris ini"
            aria-label={`Hapus ${p.cleanName}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
});

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
  const [pageSize, setPageSize] = useState<number | 'all'>(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Non-blocking deferred search input
  const deferredSearch = useDeferredValue(searchQuery);

  // Filter dengan useMemo (Hanya hitung saat dependensi berubah)
  const filteredParticipants = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    return participants.filter((p) => {
      if (filterDuplicates && p.isDuplicate) return false;
      if (salutationFilter !== 'all' && p.salutation !== salutationFilter) return false;
      if (statusFilter !== 'all' && p.deliveryStatus !== statusFilter) return false;

      if (q) {
        return (
          p.cleanName.toLowerCase().includes(q) ||
          (p.participantId && p.participantId.toLowerCase().includes(q)) ||
          (p.phone && p.phone.includes(q)) ||
          (p.region && p.region.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [participants, filterDuplicates, salutationFilter, statusFilter, deferredSearch]);

  // Hitung metrik ringkasan dalam 1 loop
  const { duplicateTotal, statusCounts } = useMemo(() => {
    let dupCount = 0;
    const counts = { pending: 0, opened: 0, sent: 0, skipped: 0 };
    for (let i = 0; i < participants.length; i++) {
      if (participants[i].isDuplicate) dupCount++;
      const st = participants[i].deliveryStatus;
      if (st in counts) counts[st]++;
    }
    return { duplicateTotal: dupCount, statusCounts: counts };
  }, [participants]);

  // Pagination calculation
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filteredParticipants.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedParticipants = useMemo(() => {
    if (pageSize === 'all') return filteredParticipants;
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredParticipants.slice(start, start + pageSize);
  }, [filteredParticipants, safeCurrentPage, pageSize]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleSalutationFilterChange = (val: 'all' | Salutation) => {
    setSalutationFilter(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val: 'all' | DeliveryStatus) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (val: number | 'all') => {
    setPageSize(val);
    setCurrentPage(1);
  };

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
              className="px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors min-h-[44px] cursor-pointer"
            >
              {showInputSection ? 'Tutup Area Paste' : 'Paste Data Baru'}
            </button>
          )}

          {participants.length > 0 && (
            <button
              onClick={onNavigateToGenerator}
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs flex items-center gap-1.5 min-h-[44px] cursor-pointer"
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
                className="px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shadow-xs flex items-center gap-2 min-h-[44px] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Proses Database</span>
              </button>

              <button
                onClick={onLoadSample}
                className="px-3.5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors min-h-[44px] cursor-pointer"
              >
                Muat Contoh Google Sheets
              </button>
            </div>

            {rawText.trim() && (
              <button
                onClick={onClearInput}
                className="text-xs text-slate-500 hover:text-red-600 py-1.5 px-2.5 rounded hover:bg-slate-100 transition-colors min-h-[44px] flex items-center cursor-pointer"
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
                onChange={(e) => handleSearchChange(e.target.value)}
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
                  onChange={(e) => handleStatusFilterChange(e.target.value as any)}
                  className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:border-emerald-600 min-h-[44px] cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Belum Dibuka ({statusCounts.pending})</option>
                  <option value="opened">WhatsApp Dibuka ({statusCounts.opened})</option>
                  <option value="sent">Terkirim ({statusCounts.sent})</option>
                  <option value="skipped">Dilewati ({statusCounts.skipped})</option>
                </select>
              </div>

              {/* Sapaan Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-600 font-medium">Sapaan:</span>
                <select
                  value={salutationFilter}
                  onChange={(e) => handleSalutationFilterChange(e.target.value as any)}
                  className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:border-emerald-600 min-h-[44px] cursor-pointer"
                >
                  <option value="all">Semua Sapaan</option>
                  <option value="Bapak">Bapak</option>
                  <option value="Ibu">Ibu</option>
                  <option value="Perlu konfirmasi">Perlu Konfirmasi</option>
                </select>
              </div>

              {/* Toggle Sembunyikan Duplikat */}
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer min-h-[44px] select-none">
                <input
                  type="checkbox"
                  checked={filterDuplicates}
                  onChange={(e) => onToggleFilterDuplicates(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Sembunyikan Duplikat ({duplicateTotal})</span>
              </label>

              {/* Clear All Data */}
              <button
                onClick={onClearAll}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors min-h-[44px] flex items-center gap-1 cursor-pointer"
                title="Hapus seluruh data saat ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Tabel</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 sm:px-4 text-center w-14">ID</th>
                    <th className="py-3 px-3 sm:px-4">Nama Lengkap</th>
                    <th className="py-3 px-3 sm:px-4">Gender</th>
                    <th className="py-3 px-3 sm:px-4">Sapaan</th>
                    <th className="py-3 px-3 sm:px-4">WhatsApp</th>
                    <th className="py-3 px-3 sm:px-4">Status Pengiriman</th>
                    <th className="py-3 px-3 sm:px-4 text-center min-w-[200px]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {paginatedParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Tidak ada data yang cocok dengan pencarian / filter ini.
                      </td>
                    </tr>
                  ) : (
                    paginatedParticipants.map((p, index) => {
                      const displayIdx = pageSize === 'all' 
                        ? index + 1 
                        : (safeCurrentPage - 1) * pageSize + index + 1;
                      return (
                        <ParticipantRow
                          key={p.id}
                          p={p}
                          displayIndex={displayIdx}
                          preferredPlatform={preferredPlatform}
                          onUpdateSalutation={onUpdateSalutation}
                          onUpdateDeliveryStatus={onUpdateDeliveryStatus}
                          onDeleteParticipant={onDeleteParticipant}
                          onCopySingle={onCopySingle}
                          onPreview={setPreviewParticipant}
                        />
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination & Fast Page Size Controls */}
            {filteredParticipants.length > 0 && (
              <div className="bg-slate-50/90 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-3">
                <div className="flex items-center gap-2">
                  <span>
                    Menampilkan{' '}
                    <strong>
                      {pageSize === 'all'
                        ? `1–${filteredParticipants.length}`
                        : `${(safeCurrentPage - 1) * pageSize + 1}–${Math.min(
                            safeCurrentPage * pageSize,
                            filteredParticipants.length
                          )}`}
                    </strong>{' '}
                    dari <strong>{filteredParticipants.length}</strong> peserta
                    {filteredParticipants.length < participants.length && ` (disaring dari ${participants.length})`}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Tampilkan:</span>
                    <select
                      value={pageSize}
                      onChange={(e) =>
                        handlePageSizeChange(e.target.value === 'all' ? 'all' : Number(e.target.value))
                      }
                      className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-800 cursor-pointer focus:border-emerald-600"
                    >
                      <option value={25}>25 / hal</option>
                      <option value={50}>50 / hal</option>
                      <option value={100}>100 / hal</option>
                      <option value="all">Semua ({filteredParticipants.length})</option>
                    </select>
                  </div>

                  {/* Page Nav Buttons */}
                  {pageSize !== 'all' && totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safeCurrentPage <= 1}
                        className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                        title="Halaman sebelumnya"
                        aria-label="Halaman sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <span className="px-2 font-medium">
                        Hal. <strong>{safeCurrentPage}</strong> / {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safeCurrentPage >= totalPages}
                        className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                        title="Halaman berikutnya"
                        aria-label="Halaman berikutnya"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
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
                className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Tutup preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 bg-[#f0f2f5]">
              <div className="bg-[#d9fdd3] text-slate-900 rounded-lg rounded-tl-none p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans border border-[#c3f0bb] shadow-xs">
                {previewParticipant.message || generateSingleMessage(previewParticipant).message}
              </div>
            </div>

            <div className="p-3.5 bg-white border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Format: <em>{previewParticipant.openerPattern || 'Alur Standar'}</em>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onCopySingle(previewParticipant.message || generateSingleMessage(previewParticipant).message, previewParticipant.cleanName);
                    setPreviewParticipant(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 min-h-[44px] cursor-pointer"
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
