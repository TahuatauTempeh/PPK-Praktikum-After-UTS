/** Placeholder Dev 1. Dev 2 mengganti isi file ini dengan layar presensi berbasis lokasi. */

import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export default function PresensiPlaceholderRoute() {
    const theme = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.textPrimary }]}>
                Presensi
            </Text>
            <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
                Halaman presensi berbasis lokasi untuk sesi {id} akan tersedia di Sprint 3.
            </Text>
            <Pressable
                accessibilityRole="button"
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/(praktikan)'))}
                style={styles.button}>
                <Text style={{ color: theme.colors.primary }}>Kembali</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
    title: { fontSize: 22, fontWeight: '700' },
    body: { fontSize: 14, textAlign: 'center' },
    button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 },
});
