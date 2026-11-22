/** Placeholder Dev 1. Dev 3 mengganti isi file ini dengan layar peta laboratorium. */

import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export default function PetaAsistenPlaceholderRoute() {
    const theme = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.textPrimary }]}>
                Peta laboratorium
            </Text>
            <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
                Peta dan aktivitas laboratorium akan tersedia di Sprint 3.
            </Text>
            <Pressable
                accessibilityRole="button"
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/asisten'))}
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
