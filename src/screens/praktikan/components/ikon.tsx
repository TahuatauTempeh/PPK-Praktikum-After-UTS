/**
 * Ikon: SVG garis tunggal warna dari assets/praktikan, diwarnai lewat tintColor.
 * Gaya garis sama dengan ikon sisi asisten supaya kedua sisi terlihat satu keluarga.
 */

import { Image } from 'expo-image';
import React from 'react';

const aset = {
  jadwal: require('@/assets/praktikan/jadwal.svg'),
  riwayat: require('@/assets/praktikan/riwayat.svg'),
  profil: require('@/assets/praktikan/profil.svg'),
  jam: require('@/assets/praktikan/jam.svg'),
  lokasi: require('@/assets/praktikan/lokasi.svg'),
  panah: require('@/assets/praktikan/panah.svg'),
  kembali: require('@/assets/praktikan/kembali.svg'),
};

export type IkonNama = keyof typeof aset;

export function Ikon({ nama, ukuran, warna }: { nama: IkonNama; ukuran: number; warna: string }) {
  return (
    <Image
      source={aset[nama]}
      tintColor={warna}
      contentFit="contain"
      style={{ width: ukuran, height: ukuran }}
      accessible={false}
    />
  );
}
