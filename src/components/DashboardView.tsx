import React from 'react';
import type { ActiveTab } from './Navbar';
import type { AppMetrics } from '../types';
import { 
  Users, 
  UserCheck, 
  HelpCircle, 
  ArrowRight, 
  Sparkles, 
  FileSpreadsheet, 
  MessageSquare,
  Phone,
  CheckCircle2,
  Clock,
  ShieldAlert
} from 'lucide-react';

interface DashboardViewProps {
  metrics: AppMetrics;
  onNavigate: (tab: ActiveTab) => void;
  onLoadSampleData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  onNavigate,
  onLoadSampleData,
}) => {
  const hasData = metrics.totalRaw > 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Editorial Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
          SobatNgaji Message Generator
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
          Platform produktivitas internal untuk membersihkan database peserta Google Sheets, menghasilkan variasi struktur pesan WhatsApp personal penawaran <em>1x Konsultasi Tahsin Gratis</em>, dan integrasi Click to WhatsApp.
        </p>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Kontak */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total Kontak</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalRaw}</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">Baris input terproses</span>
          </div>
        </div>

        {/* Data Unik */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Data Unik</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalUnique}</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">Berdasarkan ID / No WA</span>
          </div>
        </div>

        {/* Nomor Valid */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">WA Valid</span>
            <Phone className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-900">{metrics.validPhoneCount}</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">Format 628...</span>
          </div>
        </div>

        {/* Bapak */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Bapak</span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">L</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-blue-900">{metrics.bapakCount}</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">Kode R / L</span>
          </div>
        </div>

        {/* Ibu */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Ibu</span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">P</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-900">{metrics.ibuCount}</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">Kode N / P</span>
          </div>
        </div>

        {/* Perlu Konfirmasi */}
        <div className={`p-4 rounded-xl border shadow-xs flex flex-col justify-between transition-colors ${
          metrics.unconfirmedCount > 0 ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-800">Perlu Review</span>
            <HelpCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold ${metrics.unconfirmedCount > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
              {metrics.unconfirmedCount}
            </span>
            <span className="block text-[11px] text-amber-700 mt-0.5">Tanpa penanda pasti</span>
          </div>
        </div>
      </div>

      {/* Progress & Delivery Status Tracker */}
      {hasData && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Progres Pengiriman Manual WhatsApp</span>
            </h2>
            <span className="text-xs text-slate-500">
              {metrics.sentCount} dari {metrics.totalUnique} terkirim ({metrics.totalUnique > 0 ? Math.round((metrics.sentCount / metrics.totalUnique) * 100) : 0}%)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="block text-xl font-bold text-slate-800">{metrics.pendingCount}</span>
              <span className="text-xs text-slate-500">Belum Dibuka</span>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100">
              <span className="block text-xl font-bold text-blue-900">{metrics.openedCount}</span>
              <span className="text-xs text-blue-700">WhatsApp Dibuka</span>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100">
              <span className="block text-xl font-bold text-emerald-900">{metrics.sentCount}</span>
              <span className="text-xs text-emerald-700">Dikonfirmasi Terkirim</span>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-100">
              <span className="block text-xl font-bold text-amber-900">{metrics.skippedCount}</span>
              <span className="text-xs text-amber-700">Dilewati</span>
            </div>
          </div>
        </div>
      )}

      {/* Communication Safety & Privacy Standards */}
      <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
          <ShieldAlert className="w-4 h-4 text-emerald-700" />
          <span>Panduan Etika &amp; Keamanan Komunikasi WhatsApp</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Aplikasi ini dirancang khusus untuk mempermudah komunikasi personal yang relevan kepada kontak yang telah memberikan izin atau terdaftar di SobatNgaji.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span><strong>Izin Kontak:</strong> Pastikan penerima telah bersedia dihubungi.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span><strong>Hormati Opt-Out:</strong> Segera tandai dilewati jika penerima meminta berhenti.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span><strong>Tanpa Pengiriman Otomatis:</strong> Admin menekan Send manual di WhatsApp resmi.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span><strong>Privasi Terjamin:</strong> Data kontak tidak disimpan di server pihak ketiga.</span>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      {!hasData ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Database Belum Dimuat</h2>
          <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
            Salin data tabel dari Google Sheets (ID, Nama, Kode Gender R/N, No WA), lalu paste ke workspace database untuk diproses secara otomatis.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('database')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition-colors shadow-xs min-h-[44px]"
            >
              <span>Buka Database Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLoadSampleData}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors min-h-[44px]"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Muat Contoh Google Sheets</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">Database Peserta</span>
              <h3 className="mt-3 text-base font-semibold text-slate-900">Kelola Tabel &amp; Buka WhatsApp</h3>
              <p className="mt-1 text-sm text-slate-600">
                Lihat daftar tabel lengkap ID, Nama, Gender, Sapaan, No WhatsApp, dan tombol Click to WhatsApp per baris.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={() => onNavigate('database')}
                className="w-full inline-flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-900 text-sm font-medium transition-colors min-h-[44px]"
              >
                <span>Buka Tabel Database ({metrics.totalRaw} peserta)</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Message Generator</span>
              <h3 className="mt-3 text-base font-semibold text-slate-900">Review Bubble Pesan WhatsApp</h3>
              <p className="mt-1 text-sm text-slate-600">
                Tinjau variasi pembuka Pola A–F, cek panjang 30–50 kata, edit pesan, dan buka WhatsApp dengan pesan terisi.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={() => onNavigate('generator')}
                className="w-full inline-flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Lihat Seluruh Pesan</span>
                </div>
                <ArrowRight className="w-4 h-4 text-white/80" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
