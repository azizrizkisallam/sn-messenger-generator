import { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import type { ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { DatabaseView } from './components/DatabaseView';
import { MessageGeneratorView } from './components/MessageGeneratorView';
import { SettingsView } from './components/SettingsView';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import type { 
  Participant, 
  Salutation, 
  CustomDictionaryEntry, 
  ProcessingOptions, 
  AppMetrics,
  DeliveryStatus,
  WhatsAppPlatform
} from './types';
import { parseRawDatabase } from './services/nameParser';
import { detectDuplicates, applyDuplicateFilter } from './services/duplicateDetector';
import { 
  generateAllMessages, 
  regenerateParticipantMessage, 
  generateSingleMessage 
} from './services/messageGenerator';
import { 
  exportToCSV, 
  exportToExcel, 
  copyToClipboard, 
  copyAllMessages 
} from './services/exportService';
import { 
  loadSavedParticipants, 
  saveParticipants, 
  loadCustomDictionary, 
  saveCustomDictionary, 
  loadProcessingOptions, 
  saveProcessingOptions, 
  clearAllStorageData,
  addOrUpdateDictionaryEntry
} from './services/storageService';
import { 
  checkSupabaseConnection, 
  fetchParticipantsFromSupabase, 
  syncParticipantsToSupabase, 
  updateDeliveryStatusInSupabase, 
  fetchActivityLogsFromSupabase, 
  subscribeToSupabaseRealtime,
  updateParticipantInSupabase,
  deleteParticipantFromSupabase,
  clearParticipantsFromSupabase
} from './services/supabaseService';
import type { ActivityLog } from './services/supabaseService';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';

const SAMPLE_DATABASE = `| SN1 | Ambar Susanto | L - Bandung | R | 628156003943 |
| SN2 | Eriga Bernadia - Bekasi | N | 6281234567890 |
| SN3 | Eriga Bernadia - Bekasi | N | 6281234567890 |
| SN4 | Rita SM - | N | 6281987654321 |
| SN5 | Fariz Rizky Fadillah | L - Cimahi | R | 6285712345678 |
| SN6 | Natalia Nuritasari - Bandung | N | 6281399887766 |
| SN7 | Mardiana - Medan | N | 6281211223344 |
| SN8 | Hany - Surabaya | N | 6287755667788 |
| SN9 | Iis Rosidah - Sukabumi | N | 6289600112233 |
| SN10 | Ahmad Fauzi - Jakarta | R | 081234567890 |
| SN11 | Nurul Hidayati | L - Malang | N | +62 813-4455-6677 |`;

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [rawText, setRawText] = useState<string>('');
  const [customDictionary, setCustomDictionary] = useState<CustomDictionaryEntry[]>([]);
  const [options, setOptions] = useState<ProcessingOptions>({
    filterDuplicates: false,
    saveToDictionaryOnOverride: true,
    preferredPlatform: 'universal',
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [supabaseTableReady, setSupabaseTableReady] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isSyncingToSupabase, setIsSyncingToSupabase] = useState(false);

  useEffect(() => {
    const savedP = loadSavedParticipants();
    const savedDict = loadCustomDictionary();
    const savedOpt = loadProcessingOptions();

    if (savedP.length > 0) setParticipants(savedP);
    if (savedDict.length > 0) setCustomDictionary(savedDict);
    setOptions(savedOpt);

    // Cek koneksi Supabase & ambil data realtime tim jika tabel sudah ada
    checkSupabaseConnection().then(async (status) => {
      setSupabaseConnected(status.connected);
      setSupabaseTableReady(status.tableExists);
      if (status.connected && status.tableExists) {
        const { participants: supaList } = await fetchParticipantsFromSupabase();
        if (supaList && supaList.length > 0) {
          setParticipants(supaList);
        } else if (savedP.length > 0) {
          // Supabase tabel ada tapi kosong, upload data lokal yang ada
          await syncParticipantsToSupabase(savedP);
        }
        const logs = await fetchActivityLogsFromSupabase();
        setActivityLogs(logs);
      }
    });

    // Berlangganan perubahan data realtime dari Supabase
    const unsubscribe = subscribeToSupabaseRealtime(
      (updatedP) => {
        setParticipants((prev) => {
          const idx = prev.findIndex((p) => p.id === updatedP.id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = updatedP;
            return next;
          }
          return [updatedP, ...prev];
        });
      },
      (newLog) => {
        setActivityLogs((prev) => [newLog, ...prev.slice(0, 49)]);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    saveParticipants(participants);
  }, [participants]);

  const addToast = (type: 'success' | 'warning' | 'info', text: string) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const metrics: AppMetrics = useMemo(() => {
    let totalUnique = 0;
    let duplicateCount = 0;
    let bapakCount = 0;
    let ibuCount = 0;
    let unconfirmedCount = 0;
    let generatedCount = 0;
    let validPhoneCount = 0;
    let sentCount = 0;
    let openedCount = 0;
    let pendingCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      if (!p.isDuplicate) totalUnique++;
      else duplicateCount++;

      if (p.salutation === 'Bapak') bapakCount++;
      else if (p.salutation === 'Ibu') ibuCount++;
      else if (p.salutation === 'Perlu konfirmasi') unconfirmedCount++;

      if (p.message) generatedCount++;
      if (p.isPhoneValid) validPhoneCount++;

      if (p.deliveryStatus === 'sent') sentCount++;
      else if (p.deliveryStatus === 'opened') openedCount++;
      else if (p.deliveryStatus === 'skipped') skippedCount++;
      else pendingCount++;
    }

    return {
      totalRaw: participants.length,
      totalUnique,
      duplicateCount,
      bapakCount,
      ibuCount,
      unconfirmedCount,
      generatedCount,
      validPhoneCount,
      sentCount,
      openedCount,
      pendingCount,
      skippedCount,
    };
  }, [participants]);

  // 1. Memproses Teks Mentah Database
  const handleProcessData = async () => {
    if (!rawText.trim()) return;

    const parsed = parseRawDatabase(rawText, customDictionary);
    if (parsed.length === 0) {
      addToast('warning', 'Format baris tidak sesuai atau hanya berisi header tabel.');
      return;
    }

    const withDuplicates = detectDuplicates(parsed);
    const withMessages = generateAllMessages(withDuplicates);

    setParticipants(withMessages);
    addToast('success', `${withMessages.length} baris peserta berhasil diproses dengan variasi alami!`);
    setActiveTab('database');

    // Auto-save langsung ke Supabase
    setIsSyncingToSupabase(true);
    const res = await syncParticipantsToSupabase(withMessages);
    setIsSyncingToSupabase(false);

    if (res.success) {
      setSupabaseTableReady(true);
      setSupabaseConnected(true);
      addToast('success', `☁️ ${withMessages.length} kontak berhasil tersimpan otomatis di Supabase!`);
      const logs = await fetchActivityLogsFromSupabase();
      setActivityLogs(logs);
    } else if (res.tableMissing || res.permissionDenied) {
      setSupabaseTableReady(false);
      setShowSupabaseModal(true);
      addToast('warning', res.permissionDenied
        ? 'Izin akses (GRANT) belum aktif di Supabase. Buka panduan perbaikan.'
        : 'Data tersimpan di browser. Setup tabel Supabase agar tersimpan online.');
    } else {
      addToast('warning', `Gagal simpan ke Supabase: ${res.error}`);
    }
  };

  // Muat data contoh Google Sheets
  const handleLoadSample = async () => {
    setRawText(SAMPLE_DATABASE);
    const parsed = parseRawDatabase(SAMPLE_DATABASE, customDictionary);
    const withDuplicates = detectDuplicates(parsed);
    const withMessages = generateAllMessages(withDuplicates);
    setParticipants(withMessages);

    addToast('info', 'Contoh data tabel Google Sheets berhasil dimuat.');

    // Auto-save langsung ke Supabase
    setIsSyncingToSupabase(true);
    const res = await syncParticipantsToSupabase(withMessages);
    setIsSyncingToSupabase(false);

    if (res.success) {
      setSupabaseTableReady(true);
      setSupabaseConnected(true);
      addToast('success', '☁️ Data contoh otomatis tersinkron ke Supabase!');
      const logs = await fetchActivityLogsFromSupabase();
      setActivityLogs(logs);
    } else if (res.tableMissing) {
      setSupabaseTableReady(false);
    }
  };

  const handleClearInput = () => {
    setRawText('');
  };

  // 2. Koreksi Sapaan Manual
  const handleUpdateSalutation = (id: string, newSalutation: Salutation) => {
    let updatedParticipant: Participant | undefined;

    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        const updated: Participant = {
          ...p,
          salutation: newSalutation,
          salutationSource: 'user_override',
        };

        const { message } = generateSingleMessage(updated, {
          openerPattern: updated.openerPattern,
          flowPattern: updated.flowPattern,
          benefitIndex: updated.variationIndex?.benefit,
          ajakanIndex: updated.variationIndex?.ajakan,
          ctaIndex: updated.variationIndex?.cta,
        });
        updated.message = message;
        updatedParticipant = updated;
        return updated;
      })
    );

    if (supabaseTableReady && updatedParticipant) {
      updateParticipantInSupabase(updatedParticipant);
    }

    if (options.saveToDictionaryOnOverride && newSalutation !== 'Perlu konfirmasi') {
      const targetP = participants.find((p) => p.id === id);
      if (targetP) {
        const gender: 'L' | 'P' = newSalutation === 'Bapak' ? 'L' : 'P';
        const updatedDict = addOrUpdateDictionaryEntry(targetP.cleanName, gender, customDictionary);
        setCustomDictionary(updatedDict);
        addToast('success', `Sapaan ${newSalutation} untuk "${targetP.cleanName}" disimpan ke kamus lokal.`);
      }
    }
  };

  // 3. Status Pengiriman WhatsApp
  const handleUpdateDeliveryStatus = (id: string, newStatus: DeliveryStatus) => {
    let participantName = '';
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          participantName = p.cleanName;
          return { ...p, deliveryStatus: newStatus };
        }
        return p;
      })
    );

    if (supabaseTableReady) {
      updateDeliveryStatusInSupabase(id, newStatus, participantName);
    }
  };

  const handleSyncToSupabase = async () => {
    if (participants.length === 0) {
      addToast('warning', 'Tidak ada data peserta untuk disinkronkan.');
      return;
    }
    setIsSyncingToSupabase(true);
    const res = await syncParticipantsToSupabase(participants);
    setIsSyncingToSupabase(false);
    if (res.success) {
      setSupabaseTableReady(true);
      addToast('success', `${participants.length} data disinkronkan ke database tim Supabase!`);
      const logs = await fetchActivityLogsFromSupabase();
      setActivityLogs(logs);
    } else {
      addToast('warning', `Gagal sinkron: ${res.error}`);
      setShowSupabaseModal(true);
    }
  };

  const handleDeleteParticipant = (id: string) => {
    const updated = participants.filter((p) => p.id !== id);
    const reChecked = detectDuplicates(updated);
    setParticipants(reChecked);
    addToast('info', 'Satu baris peserta dihapus.');

    if (supabaseTableReady) {
      deleteParticipantFromSupabase(id);
    }
  };

  const handleClearAll = () => {
    setParticipants([]);
    setRawText('');
    saveParticipants([]);
    addToast('info', 'Database telah dikosongkan.');

    if (supabaseTableReady) {
      clearParticipantsFromSupabase();
    }
  };

  // 4. Message Generator Actions
  const handleGenerateAll = () => {
    if (participants.length === 0) return;
    const generated = generateAllMessages(participants);
    setParticipants(generated);
    addToast('success', `Seluruh pesan (${generated.length}) berhasil digenerate dengan variasi alami!`);

    if (supabaseTableReady) {
      syncParticipantsToSupabase(generated);
    }
  };

  const handleRegenerateSingle = (id: string) => {
    let updatedItem: Participant | undefined;
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const regen = regenerateParticipantMessage(p);
        updatedItem = regen;
        return regen;
      })
    );
    addToast('info', 'Variasi struktur kalimat berhasil diperbarui.');

    if (supabaseTableReady && updatedItem) {
      updateParticipantInSupabase(updatedItem);
    }
  };

  const handleEditMessage = (id: string, newMessage: string) => {
    let updatedItem: Participant | undefined;
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const edited = {
          ...p,
          message: newMessage,
          isMessageEdited: true,
        };
        updatedItem = edited;
        return edited;
      })
    );
    addToast('success', 'Perubahan pesan disimpan.');

    if (supabaseTableReady && updatedItem) {
      updateParticipantInSupabase(updatedItem);
    }
  };

  // 5. Salin & Ekspor
  const handleCopySingle = async (text: string, name: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      addToast('success', `Pesan untuk ${name} tersalin ke clipboard!`);
    } else {
      addToast('warning', 'Gagal menyalin pesan.');
    }
  };

  const handleCopyAll = async () => {
    const activeList = applyDuplicateFilter(participants, options.filterDuplicates);
    const success = await copyAllMessages(activeList);
    if (success) {
      addToast('success', `${activeList.length} pesan berhasil disalin ke clipboard!`);
    } else {
      addToast('warning', 'Gagal menyalin seluruh pesan.');
    }
  };

  const handleExportExcel = () => {
    const activeList = applyDuplicateFilter(participants, options.filterDuplicates);
    exportToExcel(activeList, `SobatNgaji_Pesan_${new Date().toISOString().slice(0, 10)}.xlsx`);
    addToast('success', 'File Excel (.xlsx) berhasil diunduh.');
  };

  const handleExportCSV = () => {
    const activeList = applyDuplicateFilter(participants, options.filterDuplicates);
    exportToCSV(activeList, `SobatNgaji_Pesan_${new Date().toISOString().slice(0, 10)}.csv`);
    addToast('success', 'File CSV (UTF-8) berhasil diunduh.');
  };

  // 6. Settings Actions
  const handleAddDictionaryEntry = (name: string, gender: 'L' | 'P') => {
    const updated = addOrUpdateDictionaryEntry(name, gender, customDictionary);
    setCustomDictionary(updated);
    addToast('success', `Aturan sapaan untuk "${name}" ditambahkan.`);
  };

  const handleDeleteDictionaryEntry = (name: string) => {
    const updated = customDictionary.filter((e) => e.name.toLowerCase() !== name.toLowerCase());
    setCustomDictionary(updated);
    saveCustomDictionary(updated);
    addToast('info', `Aturan untuk "${name}" dihapus.`);
  };

  const handleResetDictionary = () => {
    setCustomDictionary([]);
    saveCustomDictionary([]);
    addToast('info', 'Kamus kustom telah dikosongkan.');
  };

  const handleUpdateOptions = (newOptions: ProcessingOptions) => {
    setOptions(newOptions);
    saveProcessingOptions(newOptions);
    addToast('info', 'Pengaturan disimpan.');
  };

  const handlePlatformChange = (platform: WhatsAppPlatform) => {
    handleUpdateOptions({ ...options, preferredPlatform: platform });
  };

  const handleExportBackup = () => {
    const backupData = {
      participants,
      customDictionary,
      options,
      exportedAt: new Date().toISOString(),
      version: '2.0',
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SobatNgaji_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Cadangan data berhasil diekspor.');
  };

  const handleImportBackup = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.participants)) {
        setParticipants(data.participants);
        saveParticipants(data.participants);
      }
      if (Array.isArray(data.customDictionary)) {
        setCustomDictionary(data.customDictionary);
        saveCustomDictionary(data.customDictionary);
      }
      if (data.options) {
        setOptions(data.options);
        saveProcessingOptions(data.options);
      }
      addToast('success', 'Cadangan berhasil dipulihkan!');
    } catch (err) {
      addToast('warning', 'Format file cadangan tidak valid.');
    }
  };

  const handleClearAllData = () => {
    clearAllStorageData();
    setParticipants([]);
    setRawText('');
    setCustomDictionary([]);
    setOptions({ filterDuplicates: false, saveToDictionaryOnOverride: true, preferredPlatform: 'universal' });
    addToast('info', 'Seluruh data aplikasi di browser telah dibersihkan.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa] text-slate-800">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        participantCount={participants.length}
        unconfirmedCount={metrics.unconfirmedCount}
        supabaseConnected={supabaseConnected}
        supabaseTableReady={supabaseTableReady}
        onOpenSupabaseModal={() => setShowSupabaseModal(true)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            metrics={metrics}
            onNavigate={setActiveTab}
            onLoadSampleData={handleLoadSample}
            activityLogs={activityLogs}
            supabaseConnected={supabaseConnected}
            supabaseTableReady={supabaseTableReady}
            onOpenSupabaseModal={() => setShowSupabaseModal(true)}
            onSyncToSupabase={handleSyncToSupabase}
            isSyncingToSupabase={isSyncingToSupabase}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseView
            participants={participants}
            rawText={rawText}
            onRawTextChange={setRawText}
            onProcessData={handleProcessData}
            onClearInput={handleClearInput}
            onLoadSample={handleLoadSample}
            onUpdateSalutation={handleUpdateSalutation}
            onUpdateDeliveryStatus={handleUpdateDeliveryStatus}
            onDeleteParticipant={handleDeleteParticipant}
            onClearAll={handleClearAll}
            filterDuplicates={options.filterDuplicates}
            onToggleFilterDuplicates={(val) =>
              handleUpdateOptions({ ...options, filterDuplicates: val })
            }
            onNavigateToGenerator={() => setActiveTab('generator')}
            preferredPlatform={options.preferredPlatform}
            onPlatformChange={handlePlatformChange}
            onCopySingle={handleCopySingle}
            supabaseTableReady={supabaseTableReady}
            onOpenSupabaseModal={() => setShowSupabaseModal(true)}
          />
        )}

        {activeTab === 'generator' && (
          <MessageGeneratorView
            participants={applyDuplicateFilter(participants, options.filterDuplicates)}
            onGenerateAll={handleGenerateAll}
            onRegenerateSingle={handleRegenerateSingle}
            onEditMessage={handleEditMessage}
            onCopySingle={handleCopySingle}
            onCopyAll={handleCopyAll}
            onExportExcel={handleExportExcel}
            onExportCSV={handleExportCSV}
            onNavigateToDatabase={() => setActiveTab('database')}
            onUpdateSalutation={handleUpdateSalutation}
            onUpdateDeliveryStatus={handleUpdateDeliveryStatus}
            preferredPlatform={options.preferredPlatform}
            onPlatformChange={handlePlatformChange}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            customDictionary={customDictionary}
            onAddDictionaryEntry={handleAddDictionaryEntry}
            onDeleteDictionaryEntry={handleDeleteDictionaryEntry}
            onResetDictionary={handleResetDictionary}
            options={options}
            onUpdateOptions={handleUpdateOptions}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onClearAllData={handleClearAllData}
          />
        )}
      </main>

      <footer className="mt-auto border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SobatNgaji Message Generator &copy; 2026. Aplikasi Produktivitas Internal.</span>
          <span className="text-slate-400">Komunikasi personal resmi via WhatsApp Click to Chat. 100% diproses di browser lokal.</span>
        </div>
      </footer>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <SupabaseSetupModal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
        participants={participants}
        onConnectionSuccess={async () => {
          setSupabaseTableReady(true);
          setSupabaseConnected(true);
          addToast('success', 'Database Supabase berhasil terhubung dan tersinkronisasi!');
          const logs = await fetchActivityLogsFromSupabase();
          setActivityLogs(logs);
        }}
      />
    </div>
  );
}

export default App;
