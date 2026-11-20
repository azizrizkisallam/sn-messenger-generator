import React, { useState } from 'react';
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
  Smartphone
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const filtered = participants.filter((p) => {
    if (salutationFilter !== 'all' && p.salutation !== salutationFilter) return false;
    if (statusFilter !== 'all' && p.deliveryStatus !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.cleanName.toLowerCase().includes(q);
      const matchId = p.participantId ? p.participantId.toLowerCase().includes(q) : false;
      const matchPhone = p.phone ? p.phone.includes(q) : false;
      return matchName || matchId || matchPhone;
    }
    return true;
  });

  const unconfirmedCount = participants.filter(p => p.salutation === 'Perlu konfirmasi').length;
  const generatedCount = participants.filter(p => !!p.message).length;

  const handleCopy = (id: string, text: string, name: string) => {
    onCopySingle(text, name);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  const startEditing = (p: Participant) => {
    setEditingId(p.id);
    setEditingText(p.message || '');
  };

  const saveEditing = (id: string) => {
    onEditMessage(id, editingText);
    setEditingId(null);
  };

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
            className="px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-medium transition-colors shadow-xs flex items-center gap-2 min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{generatedCount === 0 ? 'Generate Semua' : 'Generate Ulang Semua'}</span>
          </button>

          <button
            onClick={onCopyAll}
            disabled={generatedCount === 0}
            className="px-3.5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-medium transition-colors shadow-xs flex items-center gap-2 min-h-[44px]"
          >
            <Copy className="w-4 h-4" />
            <span>Salin Semua Pesan</span>
          </button>

          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
            <button
              onClick={onExportExcel}
              disabled={generatedCount === 0}
              className="px-3 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 min-h-[44px]"
              title="Ekspor ke format Excel .xlsx"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Excel</span>
            </button>

            <button
              onClick={onExportCSV}
              disabled={generatedCount === 0}
              className="px-3 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 min-h-[44px]"
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
            className="px-3 py-1.5 rounded-lg bg-amber-200/70 hover:bg-amber-200 text-amber-950 font-medium text-xs transition-colors self-start sm:self-auto min-h-[44px] flex items-center"
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
            onChange={(e) => setSearchQuery(e.target.value)}
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
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:border-emerald-600 min-h-[44px]"
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
              onChange={(e) => setSalutationFilter(e.target.value as any)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:border-emerald-600 min-h-[44px]"
            >
              <option value="all">Semua ({participants.length})</option>
              <option value="Bapak">Bapak ({participants.filter(p => p.salutation === 'Bapak').length})</option>
              <option value="Ibu">Ibu ({participants.filter(p => p.salutation === 'Ibu').length})</option>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((p, index) => {
            const words = countWords(p.message || '');
            const isTargetLength = words >= 30 && words <= 50;
            const isCopied = copiedId === p.id;
            const isEditing = editingId === p.id;
            const isUnconfirmed = p.salutation === 'Perlu konfirmasi';
            const isPhoneReady = Boolean(p.phone && p.isPhoneValid);
            const participantMsg = p.message || generateSingleMessage(p).message;
            const waLink = isPhoneReady ? generateWhatsAppLink(p.phone!, participantMsg, preferredPlatform) : '#';

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Header Kartu */}
                <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono font-medium text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                      {p.participantId || `#${index + 1}`}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 text-sm truncate flex items-center gap-2">
                        <span>{p.cleanName}</span>
                        {p.region && (
                          <span className="text-[11px] font-normal px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                            {p.region}
                          </span>
                        )}
                      </div>
                      {p.phone && (
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-emerald-600" />
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
                      className={`text-xs font-semibold rounded-md px-2 py-0.5 border transition-colors ${
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
                  <div className="relative max-w-[95%] sm:max-w-[90%] self-start bg-[#d9fdd3] text-slate-900 rounded-lg rounded-tl-none p-3.5 shadow-xs text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans border border-[#c3f0bb]">
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
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 text-xs rounded bg-slate-200 hover:bg-slate-300 text-slate-700 min-h-[44px] flex items-center"
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => saveEditing(p.id)}
                            className="px-3 py-1 text-xs rounded bg-emerald-700 hover:bg-emerald-800 text-white font-medium flex items-center gap-1 min-h-[44px]"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Simpan</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {p.message}
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
                        className={`text-xs font-medium rounded px-2 py-1 border transition-colors ${
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
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Ganti variasi kalimat (Pola A–F & Alur)"
                        aria-label="Generate ulang variasi"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => (isEditing ? saveEditing(p.id) : startEditing(p))}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Edit teks pesan secara manual"
                        aria-label="Edit teks pesan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleCopy(p.id, p.message || '', p.cleanName)}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                        className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 min-h-[44px] bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs cursor-pointer select-none"
                        title={`Buka WhatsApp ke ${p.phone}`}
                        aria-label={`Buka WhatsApp untuk ${p.cleanName}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Buka WhatsApp</span>
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
          })}
        </div>
      )}
    </div>
  );
};
