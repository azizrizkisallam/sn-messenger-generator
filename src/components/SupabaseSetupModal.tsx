import React, { useState, useEffect } from 'react';
import { Database, Copy, Check, ExternalLink, X, RefreshCw, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA, checkSupabaseConnection, syncParticipantsToSupabase } from '../services/supabaseService';
import type { Participant } from '../types';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionSuccess: () => void;
  participants?: Participant[];
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
  onConnectionSuccess,
  participants = [],
}) => {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ synced: number; total: number } | null>(null);
  const [checkResult, setCheckResult] = useState<{ connected: boolean; tableExists: boolean; error?: string } | null>(null);

  // Auto-poll cek status tabel setiap 3 detik saat modal terbuka
  useEffect(() => {
    if (!isOpen || syncing) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      const res = await checkSupabaseConnection();
      if (!isMounted) return;

      if (res.connected && res.tableExists) {
        clearInterval(interval);
        setCheckResult(res);
        handleAutoUpload();
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, syncing, participants.length]);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCopyAndOpenSupabase = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    window.open('https://supabase.com/dashboard/project/sokjpskgbwhimkfnbzze/sql/new', '_blank');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleAutoUpload = async () => {
    if (participants.length === 0) {
      onConnectionSuccess();
      setTimeout(onClose, 1200);
      return;
    }

    setSyncing(true);
    setSyncProgress({ synced: 0, total: participants.length });

    const res = await syncParticipantsToSupabase(participants, (synced, total) => {
      setSyncProgress({ synced, total });
    });

    setSyncing(false);

    if (res.success) {
      onConnectionSuccess();
      setTimeout(onClose, 1500);
    } else {
      setCheckResult({ connected: true, tableExists: false, error: res.error });
    }
  };

  const handleCheckConnection = async () => {
    setChecking(true);
    setCheckResult(null);
    const res = await checkSupabaseConnection();
    setChecking(false);
    setCheckResult(res);

    if (res.connected && res.tableExists) {
      await handleAutoUpload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Aktivasi Database Cloud Supabase
              </h2>
              <p className="text-xs text-slate-500">
                Simpan database otomatis ke Supabase agar tim bisa memantau riwayat secara real-time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm text-slate-700">
          {/* Status Banner */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-semibold text-emerald-950 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>Koneksi Supabase Aktif: <code>sokjpskgbwhimkfnbzze</code></span>
              </div>
              {participants.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                  {participants.length} Kontak Siap Diunggah
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed">
              Supabase membutuhkan tabel <strong>participants</strong> dan <strong>activity_logs</strong> agar data otomatis tersimpan di cloud. Anda hanya perlu menjalankan kode SQL di bawah <strong>1x saja</strong> (sekitar 15 detik).
            </p>
          </div>

          {/* Action Step 1: 1-Click Copy & Open */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                Langkah Cepat (15 Detik):
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin SQL'}</span>
                </button>

                <button
                  onClick={handleCopyAndOpenSupabase}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Salin SQL &amp; Buka Supabase</span>
                </button>
              </div>
            </div>

            <ol className="text-xs text-slate-600 list-decimal list-inside space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <li>Klik tombol hijau <strong>&ldquo;Salin SQL &amp; Buka Supabase&rdquo;</strong> di atas.</li>
              <li>Di halaman Supabase SQL Editor yang terbuka, tekan <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-slate-800 font-mono text-[11px]">Ctrl+V</kbd> (Paste).</li>
              <li>Klik tombol hijau <strong>Run</strong> di kanan bawah Supabase.</li>
              <li>Selesai! Aplikasi ini akan otomatis mendeteksi dan langsung mengunggah {participants.length || 'seluruh'} kontak.</li>
            </ol>

            {/* SQL Script Box */}
            <div className="relative">
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-40 leading-relaxed border border-slate-800 select-all">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          </div>

          {/* Action Step 2: Verification & Progress */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                onClick={handleCheckConnection}
                disabled={checking || syncing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs flex-1 cursor-pointer disabled:opacity-50"
              >
                {syncing ? (
                  <>
                    <UploadCloud className="w-4 h-4 animate-bounce" />
                    <span>
                      {syncProgress
                        ? `Mengunggah ${syncProgress.synced} / ${syncProgress.total} Kontak...`
                        : 'Menyimpan ke Supabase...'}
                    </span>
                  </>
                ) : checking ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memeriksa Supabase...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Cek &amp; Upload {participants.length > 0 ? `${participants.length} Kontak` : 'Data'} Sekarang</span>
                  </>
                )}
              </button>
            </div>

            {/* Result Feedback */}
            {checkResult && (
              <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                checkResult.connected && checkResult.tableExists
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}>
                {checkResult.connected && checkResult.tableExists ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  {checkResult.connected && checkResult.tableExists ? (
                    <strong>Sukses! Tabel telah aktif di Supabase. Sinkronisasi otomatis sedang berlangsung...</strong>
                  ) : (
                    <span>{checkResult.error || 'Tabel belum ditemukan di Supabase. Pastikan Anda telah menekan tombol "Run" di tab Supabase SQL Editor.'}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Data Anda tetap 100% aman tersimpan di browser ini selagi setup cloud dilakukan.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
