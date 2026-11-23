/**
 * analisisSentimen dengan model EDOM asli (tanpa mock), untuk memastikan model dan wrapper
 * bekerja pada teks kesan pesan berbahasa Indonesia. Kelas netral pada model ini lemah
 * (lihat ai/README.md), jadi test hanya memakai contoh yang jelas positif atau negatif.
 */

import { analisisSentimen } from './ai-service';

describe('analisisSentimen dengan model EDOM asli', () => {
  it('menilai kesan pesan yang jelas positif', async () => {
    const hasil = await analisisSentimen('Asisten menjelaskan materi dengan jelas dan sabar, praktikumnya sangat membantu.');
    expect(hasil.label).toBe('positif');
    expect(hasil.confidence).toBeGreaterThan(0);
    expect(hasil.confidence).toBeLessThanOrEqual(1);
  });

  it('menilai kesan pesan yang jelas negatif', async () => {
    const hasil = await analisisSentimen('Penjelasannya membingungkan dan waktunya kurang, asisten sering terlambat.');
    expect(hasil.label).toBe('negatif');
  });

  it('mengembalikan null untuk teks kosong atau kata yang tidak dikenal, bukan netral', async () => {
    await expect(analisisSentimen('')).resolves.toEqual({ label: null, confidence: null });
    await expect(analisisSentimen('qwerty zxcvb asdfg')).resolves.toEqual({ label: null, confidence: null });
  });
});
