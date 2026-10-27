import { router } from 'expo-router';

export function bukaDetailSesi(id: string) {
  router.push({ pathname: '/praktikan/sesi/[id]', params: { id } });
}

export function bukaRiwayat() {
  router.navigate('/(praktikan)/riwayat');
}

export function bukaJadwal() {
  router.navigate('/(praktikan)');
}
