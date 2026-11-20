import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../../App';

describe('SobatNgaji App End-to-End Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('1. Alur Lengkap: Google Sheets import, Phone normalizer, Click to WhatsApp, dan Status Tracking', async () => {
    render(<App />);

    // 1. Tampilan Awal: Dashboard
    expect(screen.getByRole('heading', { level: 1, name: /SobatNgaji Message Generator/i })).toBeInTheDocument();
    expect(screen.getByText(/Database Belum Dimuat/i)).toBeInTheDocument();

    // 2. Klik "Muat Contoh Google Sheets"
    const loadSampleBtns = screen.getAllByRole('button', { name: /Muat Contoh Google Sheets/i });
    fireEvent.click(loadSampleBtns[0]);

    // Verifikasi metrik terupdate
    await waitFor(() => {
      const counts11 = screen.getAllByText('11');
      expect(counts11.length).toBeGreaterThan(0); // Total baris contoh
    });

    // 3. Pindah ke tab Database Peserta
    const dbTabBtns = screen.getAllByRole('button', { name: /Database Peserta/i });
    fireEvent.click(dbTabBtns[0]);

    // Verifikasi kolom tabel: ID, Nama, Gender, Sapaan, WhatsApp, Status
    expect(screen.getByText('SN1')).toBeInTheDocument();
    expect(screen.getByText('Ambar Susanto')).toBeInTheDocument();
    expect(screen.getByText('628156003943')).toBeInTheDocument();
    expect(screen.getByText('Rita SM')).toBeInTheDocument();
    expect(screen.getByText('Fariz Rizky Fadillah')).toBeInTheDocument();

    // Verifikasi gender mapping R -> Laki-laki / Bapak
    expect(screen.getAllByText('Laki-laki').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Perempuan').length).toBeGreaterThan(0);

    // 4. Uji link "Buka WA"
    const openWaLinks = screen.getAllByRole('link', { name: /Buka WA|Buka WhatsApp/i });
    expect(openWaLinks.length).toBeGreaterThan(0);
    expect(openWaLinks[0]).toHaveAttribute('href', expect.stringContaining('https://wa.me/628156003943?text='));
    expect(openWaLinks[0]).toHaveAttribute('target', '_blank');
    fireEvent.click(openWaLinks[0]);

    // Verifikasi window.open dipanggil dengan tautan wa.me
    expect(window.open).toHaveBeenCalled();
    const calledUrl = (window.open as any).mock.calls[0][0];
    expect(calledUrl).toContain('https://wa.me/628156003943?text=');
    expect(calledUrl).toContain(encodeURIComponent('*1x KONSULTASI TAHSIN GRATIS bersama Asatidz SobatNgaji.*'));

    // Verifikasi status baris berubah menjadi 'WA dibuka'
    await waitFor(() => {
      expect(screen.getAllByText('WA dibuka').length).toBeGreaterThan(0);
    });

    // 5. Uji tombol Tandai Terkirim
    const markSentBtns = screen.getAllByRole('button', { name: /Tandai terkirim/i });
    fireEvent.click(markSentBtns[0]);

    await waitFor(() => {
      expect(screen.getAllByText('Terkirim').length).toBeGreaterThan(0);
    });

    // 6. Pindah ke tab Message Generator
    const genTabBtns = screen.getAllByRole('button', { name: /Message Generator/i });
    fireEvent.click(genTabBtns[0]);

    // Verifikasi kartu pesan dan tombol Buka WhatsApp di Message Generator
    await waitFor(() => {
      expect(screen.getByText('Ambar Susanto')).toBeInTheDocument();
      const cardWaLinks = screen.getAllByRole('link', { name: /Buka WhatsApp/i });
      expect(cardWaLinks.length).toBeGreaterThan(0);
    });

    // 7. Pindah ke tab Pengaturan
    const settingsTabBtns = screen.getAllByRole('button', { name: /Pengaturan/i });
    fireEvent.click(settingsTabBtns[0]);

    // Verifikasi opsi platform WhatsApp dan preview 6 pola pembuka
    expect(screen.getByText(/Preferensi Platform Click to WhatsApp/i)).toBeInTheDocument();
    expect(screen.getByText(/Pola A — Salam dahulu/i)).toBeInTheDocument();
    expect(screen.getByText(/Pola B — Sapaan dahulu/i)).toBeInTheDocument();
    expect(screen.getByText(/Pola C — Nama langsung/i)).toBeInTheDocument();
  });
});
