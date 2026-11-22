import { Stack } from 'expo-router';

/** Route lab berada di bawah Stack.Protected asisten di root layout, jadi praktikan dialihkan keluar. */
export default function LabLayout() {
    return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}