import { createClient } from '@supabase/supabase-js';
import type { Participant, DeliveryStatus, Salutation, OpenerPattern } from '../types';

// Konfigurasi Supabase dengan fallback kredensial resmi proyek pengguna
export const SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  'https://sokjpskgbwhimkfnbzze.supabase.co';

export const SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  'sb_publishable_bYeZBop2Sr60OYdoS4sfyg_Xu_8qlj7';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export interface ActivityLog {
  id: string;
  participant_id?: string;
  clean_name?: string;
  action: string;
  status?: string;
  timestamp: string;
}

/**
 * SQL Schema lengkap untuk dibuat di Supabase SQL Editor
 * Sudah termasuk GRANT ALL untuk role anon & authenticated agar tidak error 42501 (permission denied)
 */
export const SUPABASE_SQL_SCHEMA = `-- 1. Berikan Izin Akses Schema Public
grant usage on schema public to anon, authenticated, service_role;

-- 2. Buat Tabel Peserta (Participants)
create table if not exists public.participants (
  id text primary key,
  participant_id text,
  clean_name text not null,
  raw_input text,
  region text,
  detected_gender text,
  raw_gender_code text,
  salutation text,
  salutation_source text,
  phone text,
  raw_phone text,
  is_phone_valid boolean default false,
  delivery_status text default 'pending',
  message text,
  opener_pattern text,
  flow_pattern int,
  is_duplicate boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Buat Tabel Riwayat Aktivitas Tim (Activity Logs)
create table if not exists public.activity_logs (
  id text primary key,
  participant_id text,
  clean_name text,
  action text not null,
  status text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Berikan Hak Akses Penuh (GRANT) ke Role Anon dan Authenticated
grant all on table public.participants to anon, authenticated, service_role;
grant all on table public.activity_logs to anon, authenticated, service_role;

-- 5. Buka Izin Akses Publik (Row Level Security) untuk Kolaborasi Tim
alter table public.participants enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists "Allow all on participants" on public.participants;
drop policy if exists "Allow all on activity_logs" on public.activity_logs;

create policy "Allow all on participants" on public.participants for all to anon, authenticated, service_role using (true) with check (true);
create policy "Allow all on activity_logs" on public.activity_logs for all to anon, authenticated, service_role using (true) with check (true);

-- 6. Aktifkan Supabase Realtime agar layar semua anggota tim ter-update otomatis
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'participants') then
    alter publication supabase_realtime add table public.participants;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'activity_logs') then
    alter publication supabase_realtime add table public.activity_logs;
  end if;
end $$;
`;

/**
 * Script cepat khusus perbaikan izin (GRANT & RLS) jika tabel sudah pernah dibuat
 */
export const SUPABASE_FIX_PERMISSIONS_SQL = `-- Perbaikan Hak Akses (GRANT) & RLS Supabase
grant usage on schema public to anon, authenticated, service_role;
grant all on table public.participants to anon, authenticated, service_role;
grant all on table public.activity_logs to anon, authenticated, service_role;

alter table public.participants enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists "Allow all on participants" on public.participants;
drop policy if exists "Allow all on activity_logs" on public.activity_logs;

create policy "Allow all on participants" on public.participants for all to anon, authenticated, service_role using (true) with check (true);
create policy "Allow all on activity_logs" on public.activity_logs for all to anon, authenticated, service_role using (true) with check (true);
`;

export function participantToRow(p: Participant) {
  return {
    id: p.id,
    participant_id: p.participantId || null,
    clean_name: p.cleanName,
    raw_input: p.rawInput || null,
    region: p.region || null,
    detected_gender: p.detectedGender || null,
    raw_gender_code: p.rawGenderCode || null,
    salutation: p.salutation,
    salutation_source: p.salutationSource,
    phone: p.phone || null,
    raw_phone: p.rawPhone || null,
    is_phone_valid: p.isPhoneValid,
    delivery_status: p.deliveryStatus,
    message: p.message || null,
    opener_pattern: p.openerPattern || null,
    flow_pattern: p.flowPattern || null,
    is_duplicate: p.isDuplicate || false,
    updated_at: new Date().toISOString(),
  };
}

export function rowToParticipant(row: any): Participant {
  return {
    id: row.id,
    participantId: row.participant_id || undefined,
    cleanName: row.clean_name,
    rawInput: row.raw_input || '',
    region: row.region || undefined,
    detectedGender: row.detected_gender || undefined,
    rawGenderCode: row.raw_gender_code || undefined,
    salutation: (row.salutation as Salutation) || 'Perlu konfirmasi',
    salutationSource: row.salutation_source || 'heuristic',
    phone: row.phone || undefined,
    rawPhone: row.raw_phone || undefined,
    isPhoneValid: Boolean(row.is_phone_valid),
    deliveryStatus: (row.delivery_status as DeliveryStatus) || 'pending',
    message: row.message || undefined,
    openerPattern: (row.opener_pattern as OpenerPattern) || undefined,
    flowPattern: row.flow_pattern || undefined,
    isDuplicate: Boolean(row.is_duplicate),
  };
}

/**
 * Memeriksa status koneksi ke Supabase dan ketersediaan tabel 'participants' serta izin aksesnya
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  tableExists: boolean;
  permissionDenied?: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('participants')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
        return { connected: true, tableExists: false, error: 'Tabel participants belum dibuat di Supabase.' };
      }
      if (error.code === '42501' || error.message.includes('permission denied')) {
        return {
          connected: true,
          tableExists: true,
          permissionDenied: true,
          error: 'Tabel participants sudah dibuat, namun izin akses (GRANT) belum diberikan di Supabase.',
        };
      }
      return { connected: false, tableExists: false, error: error.message };
    }

    return { connected: true, tableExists: true };
  } catch (err: any) {
    return { connected: false, tableExists: false, error: err?.message || 'Gagal terhubung ke Supabase' };
  }
}

/**
 * Mengambil seluruh data peserta dari database Supabase
 */
export async function fetchParticipantsFromSupabase(): Promise<{
  participants: Participant[] | null;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      return { participants: null, error: error.message };
    }

    const participants = (data || []).map(rowToParticipant);
    return { participants };
  } catch (err: any) {
    return { participants: null, error: err?.message || 'Gagal mengambil data' };
  }
}

/**
 * Menyimpan / menyinkronkan seluruh daftar peserta ke Supabase (Batch Upsert dalam potongan 100 baris)
 */
export async function syncParticipantsToSupabase(
  participants: Participant[],
  onProgress?: (synced: number, total: number) => void
): Promise<{
  success: boolean;
  tableMissing?: boolean;
  permissionDenied?: boolean;
  error?: string;
  syncedCount?: number;
}> {
  if (participants.length === 0) return { success: true, syncedCount: 0 };

  try {
    const rows = participants.map(participantToRow);
    const CHUNK_SIZE = 100;
    let synced = 0;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase
        .from('participants')
        .upsert(chunk, { onConflict: 'id' });

      if (error) {
        const isMissing = error.code === 'PGRST205' || error.message.includes('not find the table');
        const isPermissionDenied = error.code === '42501' || error.message.includes('permission denied');
        return {
          success: false,
          tableMissing: isMissing,
          permissionDenied: isPermissionDenied,
          error: isPermissionDenied
            ? 'Izin akses (GRANT) belum aktif di Supabase. Jalankan SQL perbaikan izin di Supabase.'
            : isMissing
            ? 'Tabel participants belum dibuat di Supabase.'
            : error.message,
        };
      }

      synced += chunk.length;
      if (onProgress) {
        onProgress(synced, rows.length);
      }
    }

    // Catat log aktivitas impor data
    await recordActivityLog({
      action: 'Sinkronisasi Otomatis Database',
      status: `${participants.length} data tersimpan ke Supabase`,
    });

    return { success: true, syncedCount: participants.length };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menyimpan ke Supabase' };
  }
}

/**
 * Memperbarui data satu peserta di Supabase
 */
export async function updateParticipantInSupabase(
  p: Participant
): Promise<{ success: boolean; error?: string }> {
  try {
    const row = participantToRow(p);
    const { error } = await supabase
      .from('participants')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal update Supabase' };
  }
}

/**
 * Memperbarui status pengiriman satu peserta di Supabase secara real-time
 */
export async function updateDeliveryStatusInSupabase(
  id: string,
  deliveryStatus: DeliveryStatus,
  cleanName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('participants')
      .update({
        delivery_status: deliveryStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Catat riwayat log agar tim bisa memantau
    const statusLabels: Record<DeliveryStatus, string> = {
      pending: 'Belum dibuka',
      opened: 'WhatsApp dibuka',
      sent: 'Dikonfirmasi Terkirim',
      skipped: 'Dilewati',
    };

    await recordActivityLog({
      participant_id: id,
      clean_name: cleanName,
      action: `Status diubah: ${statusLabels[deliveryStatus]}`,
      status: deliveryStatus,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal memperbarui status di Supabase' };
  }
}

/**
 * Menghapus satu peserta dari Supabase
 */
export async function deleteParticipantFromSupabase(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Mengosongkan seluruh peserta dari Supabase
 */
export async function clearParticipantsFromSupabase(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('participants')
      .delete()
      .neq('id', '___empty_all_participants___');

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Mencatat riwayat log aktivitas tim
 */
export async function recordActivityLog(log: {
  participant_id?: string;
  clean_name?: string;
  action: string;
  status?: string;
}): Promise<void> {
  try {
    const entry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      participant_id: log.participant_id || null,
      clean_name: log.clean_name || null,
      action: log.action,
      status: log.status || null,
      timestamp: new Date().toISOString(),
    };

    await supabase.from('activity_logs').insert([entry]);
  } catch {
    // Ignore log recording errors if table not ready
  }
}

/**
 * Mengambil 50 riwayat aktivitas tim terbaru
 */
export async function fetchActivityLogsFromSupabase(): Promise<ActivityLog[]> {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      participant_id: d.participant_id || undefined,
      clean_name: d.clean_name || undefined,
      action: d.action,
      status: d.status || undefined,
      timestamp: d.timestamp,
    }));
  } catch {
    return [];
  }
}

/**
 * Berlangganan (Subscribe) perubahan real-time dari Supabase
 * Memungkinkan layar tim ter-update otomatis seketika saat ada rekan yang mengubah status!
 */
export function subscribeToSupabaseRealtime(
  onParticipantChange: (participant: Participant) => void,
  onNewActivityLog?: (log: ActivityLog) => void
): () => void {
  const channel = supabase
    .channel('sn_realtime_collab')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'participants' },
      (payload) => {
        if (payload.new && (payload.new as any).id) {
          const updated = rowToParticipant(payload.new);
          onParticipantChange(updated);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'activity_logs' },
      (payload) => {
        if (onNewActivityLog && payload.new) {
          const logItem: ActivityLog = {
            id: (payload.new as any).id,
            participant_id: (payload.new as any).participant_id || undefined,
            clean_name: (payload.new as any).clean_name || undefined,
            action: (payload.new as any).action,
            status: (payload.new as any).status || undefined,
            timestamp: (payload.new as any).timestamp,
          };
          onNewActivityLog(logItem);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
