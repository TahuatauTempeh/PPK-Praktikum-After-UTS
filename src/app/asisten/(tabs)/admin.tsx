import { Redirect } from 'expo-router';

import { useAuth } from '@/context/auth-context';
import { AdminScreen } from '@/screens/asisten/admin-screen';

export default function AdminTabRoute() {
  const { profile } = useAuth();
  if (!profile?.isAdmin) return <Redirect href="/asisten" />;
  return <AdminScreen />;
}
