import { router } from 'expo-router';

export function bukaDetailSesi(id: string) {
  router.push({ pathname: '/praktikan/sesi/[id]', params: { id } });
}
