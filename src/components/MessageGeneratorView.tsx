import React, { useState, useMemo, useDeferredValue } from 'react';
import type { Participant, Salutation, DeliveryStatus, WhatsAppPlatform } from '../types';
import { 
  RefreshCw, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  FileText, 
  Search, 
  Filter, 
  AlertTriangle, 
  Edit3, 
  Save, 
  ExternalLink,
  MessageSquare,
  Phone,
  Clock,
  Smartphone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { countWords, generateSingleMessage } from '../services/messageGenerator';
import { generateWhatsAppLink } from '../services/phoneNormalizer';

interface MessageGeneratorViewProps {
  participants: Participant[];
  onGenerateAll: () => void;
  onRegenerateSingle: (id: string) => void;
  onEditMessage: (id: string, newMessage: string) => void;
  onCopySingle: (text: string, name: string) => void;
  onCopyAll: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  onNavigateToDatabase: () => void;
  onUpdateSalutation: (id: string, salutation: Salutation) => void;
  onUpdateDeliveryStatus: (id: string, status: DeliveryStatus) => void;
  preferredPlatform: WhatsAppPlatform;
  onPlatformChange: (platform: WhatsAppPlatform) => void;
}

interface MessageCardProps {
  p: Participant;
  displayIndex: number;
  preferredPlatform: WhatsAppPlatform;
  onUpdateSalutation: (id: string, salutation: Salutation) => void;
  onUpdateDeliveryStatus: (id: string, status: DeliveryStatus) => void;
  onRegenerateSingle: (id: string) => void;
  onEditMessage: (id: string, newMessage: string) => void;
  onCopySingle: (text: string, name: string) => void;
}

const MessageCard = React.memo<MessageCardProps>(({
  p,
  displayIndex,
  preferredPlatform,
  onUpdateSalutation,
  onUpdateDeliveryStatus,
  onRegenerateSingle,
  onEditMessage,
  onCopySingle,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState(p.message || '');

  // Keep local editing state synced if regenerated from outside while not editing
  const currentMessage = p.message || '';
  const words = countWords(currentMessage);
  const isTargetLength = words >= 30 && words <= 50;
  const isUnconfirmed = p.salutation === 'Perlu konfirmasi';
  const isPhoneReady = Boolean(p.phone && p.isPhoneValid);
  const participantMsg = currentMessage || generateSingleMessage(p).message;
  const waLink = isPhoneReady ? generateWhatsAppLink(p.phone!, participantMsg, preferredPlatform) : '#';

  const isOpened = p.deliveryStatus === 'opened';
  const isSent = p.deliveryStatus === 'sent';
  const isSkipped = p.deliveryStatus === 'skipped';
  const isContacted = isOpened || isSent;

  const handleCopy = () => {
    onCopySingle(currentMessage, p.cleanName);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const handleStartEdit = () => {
    setEditingText(currentMessage);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onEditMessage(p.id, editingText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditingText(currentMessage);
    setIsEditing(false);
  };

  return (
    <div
      className={`rounded-xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs ${
        isSent
          ? 'bg-emerald-50/15 border-emerald-300 ring-1 ring-emerald-300/60'
          : isOpened
          ? 'bg-blue-50/15 border-blue-300 ring-1 ring-blue-300/60'
          : isSkipped
          ? 'bg-slate-50/60 border-slate-300 opacity-75'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Banner Penanda Status Jelas di Bagian Atas Kartu */}
      {isOpened && (
        <div className="bg-blue-100 text-blue-900 border-b border-blue-200 px-3.5 py-1.5 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-blue-700 stroke-[3]" />
            <span>WhatsApp Sudah Dibuka</span>
          </div>
          <span className="text-[11px] font-medium text-blue-800 bg-blue-200/70 px-2 py-0.5 rounded-full">
            Sedang Dihubungi
          </span>
        </div>
      )}
      {isSent && (
        <div className="bg-emerald-100 text-emerald-900 border-b border-emerald-200 px-3.5 py-1.5 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
            <span>Pesan Sudah Terkirim</span>
          </div>
          <span className="text-[11px] font-medium text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded-full">
            Selesai
          </span>
        </div>
      )}

      {/* Header Kartu */}
      <div className={`p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between gap-2 ${
        isContacted ? 'bg-slate-50/90' : 'bg-slate-50/70'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded flex items-center gap-1 ${
            isSent
              ? 'bg-emerald-100 text-emerald-800'
              : isOpened
              ? 'bg-blue-100 text-blue-800'
              : 'bg-slate-200/70 text-slate-600'
          }`}>
            {isContacted && <Check className="w-3 h-3 stroke-[3]" />}
            <span>{p.participantId || `#${displayIndex}`}</span>
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 text-sm truncate flex items-center gap-2">
              <span className={isContacted ? "line-through text-slate-500 decoration-slate-400 decoration-2" : ""}>
                {p.cleanName}
              </span>
              {p.region && (
                <span className="text-[11px] font-normal px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                  {p.region}
                </span>
              )}
            </div>
            {p.phone && (
              <div className={`text-[11px] font-mono flex items-center gap-1 mt-0.5 ${
                isContacted ? 'text-slate-400 line-through decoration-slate-400' : 'text-slate-500'
              }`}>
                <Phone className={`w-2.5 h-2.5 ${isContacted ? 'text-slate-400' : 'text-emerald-600'}`} />
                <span>{p.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sapaan & Pola Badge */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <select
            value={p.salutation}
            onChange={(e) => onUpdateSalutation(p.id, e.target.value as Salutation)}
            className={`text-xs font-semibold rounded-md px-2 py-0.5 border transition-colors cursor-pointer ${
              p.salutation === 'Bapak'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : p.salutation === 'Ibu'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-100 border-amber-300 text-amber-900'
            }`}
            aria-label={`Ubah sapaan ${p.cleanName}`}
          >
            <option value="Bapak">Bapak</option>
            <option value="Ibu">Ibu</option>
            <option value="Perlu konfirmasi">Perlu konfirmasi</option>
          </select>

          {p.openerPattern && (
            <span className="text-[10px] text-slate-500 font-medium bg-white px-1.5 py-0.2 rounded border border-slate-200">
              {p.openerPattern.replace('_', ' ')} · Alur {p.flowPattern || 1}
            </span>
          )}
        </div>
      </div>

      {/* WhatsApp Chat Bubble Body */}
      <div className="p-4 bg-[#f0f2f5] flex-1 flex flex-col justify-center">
        {isContacted && (
          <div className="mb-2 self-start inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/95 text-slate-700 border border-slate-200 shadow-2xs">
            {isSent ? (
              <>
                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                <span>Pesan telah terkirim</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3 text-blue-600 stroke-[3]" />
                <span>WhatsApp telah dibuka</span>
              </>
            )}
          </div>
        )}
        <div className={`relative max-w-[95%] sm:max-w-[90%] self-start rounded-lg rounded-tl-none p-3.5 shadow-xs text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans border ${
          isSent
            ? 'bg-[#d9fdd3] text-slate-900 border-[#b5eab0]'
            : isOpened
            ? 'bg-[#eaf4ff] text-slate-900 border-[#bcdbfc]'
            : 'bg-[#d9fdd3] text-slate-900 border-[#c3f0bb]'
        }`}>
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                rows={7}
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                className="w-full text-xs sm:text-sm p-2 rounded border border-emerald-400 bg-white font-sans focus:outline-emerald-600"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-2.5 py-1 text-xs rounded bg-slate-200 hover:bg-slate-300 text-slate-700 min-h-[44px] flex items-center cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 text-xs rounded bg-emerald-700 hover:bg-emerald-800 text-white font-medium flex items-center gap-1 min-h-[44px] cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {currentMessage}
              {isUnconfirmed && (
                <div className="mt-2 text-[11px] font-semibold text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                  ⚠️ Sapaan masih &ldquo;Bapak/Ibu&rdquo;. Silakan pilih Bapak atau Ibu sebelum dikirim.
                </div>
              )}
              <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400 select-none">
                <span>SobatNgaji</span>
                <span className="text-emerald-700 font-bold">✓✓</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status Bar & Actions */}
      <div className="p-3 bg-white border-t border-slate-100 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          {/* Word count target badge */}
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                isTargetLength
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {words} kata {isTargetLength && '· Ideal'}
            </span>
            {p.isMessageEdited && (
              <span className="text-[10px] text-slate-400 italic">Diedit</span>
            )}
          </div>

          {/* Delivery Status Selector */}
          <div className="flex items-center gap-1">
            <select
              value={p.deliveryStatus}
              onChange={(e) => onUpdateDeliveryStatus(p.id, e.target.value as DeliveryStatus)}
              className={`text-xs font-medium rounded px-2 py-1 border transition-colors cursor-pointer ${
                p.deliveryStatus === 'sent'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : p.deliveryStatus === 'opened'
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : p.deliveryStatus === 'skipped'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
              title="Status pengiriman pesan"
            >
              <option value="pending">Belum Dibuka</option>
              <option value="opened">WA Dibuka</option>
              <option value="sent">Terkirim</option>
              <option value="skipped">Dilewati</option>
            </select>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onRegenerateSingle(p.id)}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              title="Ganti variasi kalimat (Pola A–F & Alur)"
              aria-label="Generate ulang variasi"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => (isEditing ? handleSaveEdit() : handleStartEdit())}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              title="Edit teks pesan secara manual"
              aria-label="Edit teks pesan"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleCopy}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              title="Salin pesan"
              aria-label={`Salin pesan ${p.cleanName}`}
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

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
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 min-h-[44px] transition-colors shadow-xs cursor-pointer select-none ${
                isSent
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : isOpened
                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
              title={isContacted ? `WhatsApp sudah pernah dibuka. Klik untuk buka ulang ke ${p.phone}` : `Buka WhatsApp ke ${p.phone}`}
              aria-label={`Buka WhatsApp untuk ${p.cleanName}`}
            >
              {isSent ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5] flex-shrink-0" />
                  <span>Terkirim (Buka Lagi)</span>
                </>
              ) : isOpened ? (
                <>
                  <Check className="w-3.5 h-3.5 text-blue-700 stroke-[2.5] flex-shrink-0" />
                  <span>Buka Ulang WA</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Buka WhatsApp</span>
                </>
              )}
            </a>
          ) : (
            <button
              disabled
              className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 min-h-[44px] bg-slate-100 text-slate-400 cursor-not-allowed select-none"
              title="Nomor WhatsApp belum valid"
              aria-label="Nomor WhatsApp belum valid"
            >
              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Buka WhatsApp</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export const MessageGeneratorView: React.FC<MessageGeneratorViewProps> = ({
  participants,
  onGenerateAll,
  onRegenerateSingle,
  onEditMessage,
  onCopySingle,
  onCopyAll,
  onExportExcel,
  onExportCSV,
  onNavigateToDatabase,
  onUpdateSalutation,
  onUpdateDeliveryStatus,
  preferredPlatform,
  onPlatformChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [salutationFilter, setSalutationFilter] = useState<'all' | Salutation>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | DeliveryStatus>('all');
  const [pageSize, setPageSize] = useState<number | 'all'>(24);
  const [currentPage, setCurrentPage] = useState(1);

  // Non-blocking search typing
  const deferredSearch = useDeferredValue(searchQuery);

  // Single-pass count calculation
  const { unconfirmedCount, generatedCount, bapakCount, ibuCount } = useMemo(() => {
    let unconfirmed = 0;
    let generated = 0;
    let bapak = 0;
    let ibu = 0;
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      if (p.salutation === 'Perlu konfirmasi') unconfirmed++;
      else if (p.salutation === 'Bapak') bapak++;
      else if (p.salutation === 'Ibu') ibu++;
      if (p.message) generated++;
    }
    return { unconfirmedCount: unconfirmed, generatedCount: generated, bapakCount: bapak, ibuCount: ibu };
  }, [participants]);

  // Memoized filter calculation
  const filtered = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    return participants.filter((p) => {
      if (salutationFilter !== 'all' && p.salutation !== salutationFilter) return false;
      if (statusFilter !== 'all' && p.deliveryStatus !== statusFilter) return false;

      if (q) {
        const matchName = p.cleanName.toLowerCase().includes(q);
        const matchId = p.participantId ? p.participantId.toLowerCase().includes(q) : false;
        const matchPhone = p.phone ? p.phone.includes(q) : false;
        return matchName || matchId || matchPhone;
      }
      return true;
    });
  }, [participants, salutationFilter, statusFilter, deferredSearch]);

  // Pagination calculation
  const totalItems = filtered.length;
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedMessages = useMemo(() => {
    if (pageSize === 'all') return filtered;
    const start = (safeCurrentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safeCurrentPage, pageSize]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Message Generator
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Natural Message Structure Engine: Variasi pembuka (Pola A–F), 4 susunan alur pesan, dan Click to WhatsApp.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Platform selector */}
          <div className="flex items-center gap-1 text-xs bg-slate-100 p-1 rounded-lg border border-slate-200">
            <Smartphone className="w-3.5 h-3.5 text-slate-600 ml-1.5" />
            <select
              value={preferredPlatform}
              onChange={(e) => onPlatformChange(e.target.value as WhatsAppPlatform)}
              className="bg-transparent text-xs font-semibold text-slate-800 pr-2 py-1 outline-none cursor-pointer"
            >
              <option value="universal">Tautan wa.me</option>
              <option value="web">WhatsApp Web</option>
              <option value="desktop">WhatsApp App</option>
            </select>
          </div>

          <button
            onClick={onGenerateAll}
            className="px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-medium transition-colors shadow-xs flex items-center gap-2 min-h-[44px] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{generatedCount === 0 ? 'Generate Semua' : 'Generate Ulang Semua'}</span>
          </button>

          <button
            onClick={onCopyAll}
            disabled={generatedCount === 0}
            className="px-3.5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-medium transition-colors shadow-xs flex items-center gap-2 min-h-[44px] cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>Salin Semua Pesan</span>
          </button>

          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
            <button
              onClick={onExportExcel}
              disabled={generatedCount === 0}
              className="px-3 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 min-h-[44px] cursor-pointer"
              title="Ekspor ke format Excel .xlsx"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Excel</span>
            </button>

            <button
              onClick={onExportCSV}
              disabled={generatedCount === 0}
              className="px-3 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 min-h-[44px] cursor-pointer"
              title="Ekspor ke format CSV UTF-8"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unconfirmed Alert Banner */}
      {unconfirmedCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-amber-900 shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <strong className="font-semibold block sm:inline">Perhatian: </strong>
              Ada <strong>{unconfirmedCount} peserta</strong> yang sapaannya masih berstatus <em>Perlu konfirmasi</em>. Sapaan di pesan menggunakan fallback &ldquo;Bapak/Ibu&rdquo;.
            </div>
          </div>
          <button
            onClick={onNavigateToDatabase}
            className="px-3 py-1.5 rounded-lg bg-amber-200/70 hover:bg-amber-200 text-amber-950 font-medium text-xs transition-colors self-start sm:self-auto min-h-[44px] flex items-center cursor-pointer"
          >
            Tinjau di Database
          </button>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari ID, nama, no WA..."
            className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 min-h-[44px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium">Status WA:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:border-emerald-600 min-h-[44px] cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Belum Dibuka</option>
              <option value="opened">WA Dibuka</option>
              <option value="sent">Terkirim</option>
              <option value="skipped">Dilewati</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium">Sapaan:</span>
            <select
              value={salutationFilter}
              onChange={(e) => {
                setSalutationFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:border-emerald-600 min-h-[44px] cursor-pointer"
            >
              <option value="all">Semua ({participants.length})</option>
              <option value="Bapak">Bapak ({bapakCount})</option>
              <option value="Ibu">Ibu ({ibuCount})</option>
              <option value="Perlu konfirmasi">Perlu Konfirmasi ({unconfirmedCount})</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 border-l border-slate-200 pl-3 hidden sm:inline">
            Menampilkan <strong>{filtered.length}</strong> pesan
          </span>
        </div>
      </div>

      {/* Messages Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">Tidak ada pesan yang cocok.</p>
          <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter status.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {paginatedMessages.map((p, index) => {
              const displayIdx = pageSize === 'all' 
                ? index + 1 
                : (safeCurrentPage - 1) * pageSize + index + 1;

              return (
                <MessageCard
                  key={p.id}
                  p={p}
                  displayIndex={displayIdx}
                  preferredPlatform={preferredPlatform}
                  onUpdateSalutation={onUpdateSalutation}
                  onUpdateDeliveryStatus={onUpdateDeliveryStatus}
                  onRegenerateSingle={onRegenerateSingle}
                  onEditMessage={onEditMessage}
                  onCopySingle={onCopySingle}
                />
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>Tampilkan:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setPageSize(val);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  <option value={24}>24 per halaman</option>
                  <option value={48}>48 per halaman</option>
                  <option value={96}>96 per halaman</option>
                  <option value="all">Semua ({totalItems})</option>
                </select>
                <span className="text-slate-400">|</span>
                <span>
                  Menampilkan{' '}
                  <strong>
                    {pageSize === 'all' ? 1 : Math.min((safeCurrentPage - 1) * pageSize + 1, totalItems)}
                  </strong>
                  –
                  <strong>
                    {pageSize === 'all' ? totalItems : Math.min(safeCurrentPage * pageSize, totalItems)}
                  </strong>{' '}
                  dari <strong>{totalItems}</strong> pesan
                </span>
              </div>

              {pageSize !== 'all' && totalPages > 1 && (
                <div className="flex items-center gap-1.5">
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
          )}
        </div>
      )}
    </div>
  );
};
