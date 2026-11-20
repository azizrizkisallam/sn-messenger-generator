import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, X, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA, checkSupabaseConnection } from '../services/supabaseService';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionSuccess: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
  onConnectionSuccess,
}) => {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ connected: boolean; tableExists: boolean; error?: string } | null>(null);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCheckConnection = async () => {
    setChecking(true);
    setCheckResult(null);
    const res = await checkSupabaseConnection();
    setChecking(false);
    setCheckResult(res);

    if (res.connected && res.tableExists) {
      setTimeout(() => {
        onConnectionSuccess();
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Setup Kolaborasi Tim Supabase
              </h2>
              <p className="text-xs text-slate-500">
                Hubungkan database agar seluruh tim bisa memantau riwayat pengiriman secara realtime
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm text-slate-700">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-950 text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span>Proyek Supabase Berhasil Dihubungkan!</span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed">
              Kredensial URL &amp; Publishable Key dari proyek <code>sokjpskgbwhimkfnbzze</code> telah aktif di aplikasi.
              Tinggal 1 langkah mudah: buat tabel <strong>participants</strong> dan <strong>activity_logs</strong> di Supabase.
            </p>
          </div>

          <div className="space-y-3">
            <div className="font-semibold text-slate-900 flex items-center justify-between text-xs sm:text-sm">
              <span>Langkah 1: Salin Kode SQL Schema</span>
              <button
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin SQL Schema'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-48 leading-relaxed border border-slate-800 select-all">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          </div>

          <div className="space-y-3">
            <span className="font-semibold text-slate-900 text-xs sm:text-sm block">
              Langkah 2: Jalankan di Supabase SQL Editor
            </span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <a
                href="https://supabase.com/dashboard/project/sokjpskgbwhimkfnbzze/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs flex-1 text-center"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka Supabase SQL Editor Baru</span>
              </a>

              <button
                onClick={handleCheckConnection}
                disabled={checking}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                <span>{checking ? 'Memeriksa...' : 'Cek Status Tabel'}</span>
              </button>
            </div>

            {checkResult && (
              <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
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
                    <strong>Sukses! Tabel participants dan realtime sudah aktif. Data tim langsung tersinkron!</strong>
                  ) : (
                    <span>{checkResult.error || 'Tabel belum ditemukan. Silakan paste SQL di atas lalu tekan Run di Supabase.'}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Aplikasi tetap bekerja normal dengan penyimpanan lokal jika SQL belum dijalankan.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
