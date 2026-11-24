import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ConfirmModal } from '@/components/ConfirmModal';
import { formatDistanceMeters } from '@/lib/geo';
import { listenLaboratories, setLaboratoryActive } from '@/lib/laboratory-service';
import { tokens, useTheme, useThemedStyles, type Theme } from '@/theme';
import { type Laboratory } from '@/types';

import { AssistantScreen } from '../components/assistant-screen';
import { AssistantText } from '../components/assistant-text';
import { AssistantTopBar } from '../components/assistant-top-bar';
import { ScheduleIcon } from '../components/schedule-icon';

type Props = {
    onBack: () => void;
    onAdd: () => void;
    onEdit: (labId: string) => void;
};

/** Daftar laboratorium untuk asisten: cari nama/kode, tambah, ubah, aktif/nonaktif. */
export default function LabListScreen({ onBack, onAdd, onEdit }: Props) {
    const theme = useTheme();
    const styles = useThemedStyles(gaya);
    const [labs, setLabs] = useState<Laboratory[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [toggleTarget, setToggleTarget] = useState<Laboratory | null>(null);
    const [toggling, setToggling] = useState(false);

    useEffect(
        () =>
            listenLaboratories(
                items => {
                    setLabs(items);
                    setLoadError(null);
                    setLoading(false);
                },
                message => {
                    setLoadError(message);
                    setLoading(false);
                }
            ),
        []
    );

    const visible = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return labs;
        return labs.filter(
            item => item.name.toLowerCase().includes(keyword) || item.code.toLowerCase().includes(keyword)
        );
    }, [labs, search]);

    async function confirmToggle() {
        if (!toggleTarget || toggling) return;
        const target = toggleTarget;
        const next = !target.isActive;
        setToggling(true);
        try {
            await setLaboratoryActive(target.id, next);
            setNotice({
                type: 'success',
                text: `Laboratorium "${target.name}" ${next ? 'diaktifkan' : 'dinonaktifkan'}.`,
            });
        } catch (err) {
            setNotice({
                type: 'error',
                text: err instanceof Error ? err.message : 'Gagal mengubah status laboratorium.',
            });
        } finally {
            setToggling(false);
            setToggleTarget(null);
        }
    }

    return (
        <AssistantScreen
            header={<AssistantTopBar onBack={onBack} title="Laboratorium" />}
            edges={['top', 'bottom', 'left', 'right']}>
            <View style={styles.topRow}>
                <View style={styles.titleBlock}>
                    <AssistantText variant="pageTitle" accessibilityRole="header" style={styles.heroTitle}>
                        Laboratorium
                    </AssistantText>
                    <AssistantText variant="caption" style={styles.heroSubtitle}>
                        {labs.length} laboratorium terdaftar
                    </AssistantText>
                </View>
                <Pressable
                    testID="lab-tambah"
                    accessibilityRole="button"
                    accessibilityLabel="Tambah laboratorium"
                    onPress={onAdd}
                    style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                    <ScheduleIcon name="plus" size={16} tintColor={theme.colors.onPrimary} />
                    <AssistantText variant="label" style={styles.addLabel}>Tambah</AssistantText>
                </Pressable>
            </View>

            <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Cari nama atau kode laboratorium"
                placeholderTextColor={theme.colors.textSecondary}
                accessibilityLabel="Cari laboratorium"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.search}
            />

            {notice && (
                <View
                    accessibilityLiveRegion="polite"
                    style={[styles.notice, notice.type === 'error' ? styles.noticeError : styles.noticeSuccess]}>
                    <AssistantText
                        variant="caption"
                        style={[styles.noticeText, notice.type === 'error' ? styles.errorText : styles.successText]}>
                        {notice.text}
                    </AssistantText>
                    <Pressable accessibilityRole="button" onPress={() => setNotice(null)} style={styles.noticeClose}>
                        <AssistantText variant="caption" tone="secondary">Tutup</AssistantText>
                    </Pressable>
                </View>
            )}

            {loading && (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <AssistantText variant="caption" tone="secondary">Memuat laboratorium...</AssistantText>
                </View>
            )}

            {!loading && loadError && (
                <View style={styles.stateCard}>
                    <AssistantText style={styles.stateTitle}>Gagal memuat laboratorium</AssistantText>
                    <AssistantText tone="secondary" style={styles.centerText}>{loadError}</AssistantText>
                </View>
            )}

            {!loading && !loadError && labs.length === 0 && (
                <View style={styles.stateCard}>
                    <View style={styles.emptyIcon}>
                        <ScheduleIcon name="pin" size={32} tintColor={theme.colors.primary} />
                    </View>
                    <AssistantText style={styles.stateTitle}>Belum ada laboratorium</AssistantText>
                    <AssistantText tone="secondary" style={styles.centerText}>
                        Tambahkan laboratorium beserta koordinat dan radius agar presensi dapat divalidasi.
                    </AssistantText>
                    <Pressable
                        accessibilityRole="button"
                        onPress={onAdd}
                        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                        <AssistantText variant="label" style={styles.white}>Tambah laboratorium</AssistantText>
                    </Pressable>
                </View>
            )}

            {!loading && !loadError && labs.length > 0 && visible.length === 0 && (
                <View style={styles.stateCard}>
                    <AssistantText style={styles.stateTitle}>Tidak ditemukan</AssistantText>
                    <AssistantText tone="secondary" style={styles.centerText}>
                        Tidak ada laboratorium dengan nama atau kode tersebut.
                    </AssistantText>
                </View>
            )}

            {!loading && !loadError && visible.length > 0 && (
                <View style={styles.list}>
                    {visible.map(item => (
                        <View key={item.id} style={[styles.card, !item.isActive && styles.cardInactive]}>
                            <View style={styles.cardTopRow}>
                                <AssistantText variant="caption" tone="accent" style={styles.codeText}>
                                    {item.code}
                                </AssistantText>
                                <View style={[styles.statusBadge, item.isActive && styles.activeBadge]}>
                                    <AssistantText
                                        style={[styles.statusText, item.isActive && styles.activeStatusText]}
                                        tone={item.isActive ? 'accent' : 'secondary'}>
                                        {item.isActive ? 'Aktif' : 'Nonaktif'}
                                    </AssistantText>
                                </View>
                            </View>

                            <AssistantText style={styles.cardTitle}>{item.name}</AssistantText>

                            <View style={styles.metaList}>
                                <View style={styles.metaItem}>
                                    <ScheduleIcon name="pin" size={14} />
                                    <AssistantText variant="caption" tone="secondary">
                                        {item.building}
                                        {item.floor ? `, ${item.floor}` : ''} / {item.room}
                                    </AssistantText>
                                </View>
                                <AssistantText variant="caption" tone="secondary">
                                    Radius {formatDistanceMeters(item.radiusMeters)}
                                </AssistantText>
                            </View>
                            <AssistantText variant="caption" tone="secondary">
                                {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                            </AssistantText>

                            <View style={styles.cardActions}>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={`Ubah ${item.name}`}
                                    onPress={() => onEdit(item.id)}
                                    style={({ pressed }) => [styles.chipButton, styles.chipNeutral, pressed && styles.pressed]}>
                                    <AssistantText variant="caption" style={styles.chipNeutralText}>Ubah</AssistantText>
                                </Pressable>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={`${item.isActive ? 'Nonaktifkan' : 'Aktifkan'} ${item.name}`}
                                    onPress={() => {
                                        setNotice(null);
                                        setToggleTarget(item);
                                    }}
                                    style={({ pressed }) => [
                                        styles.chipButton,
                                        item.isActive ? styles.chipDanger : styles.chipNeutral,
                                        pressed && styles.pressed,
                                    ]}>
                                    <AssistantText
                                        variant="caption"
                                        style={item.isActive ? styles.chipDangerText : styles.chipNeutralText}>
                                        {item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                    </AssistantText>
                                </Pressable>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <ConfirmModal
                visible={toggleTarget !== null}
                title={toggleTarget?.isActive ? 'Nonaktifkan laboratorium?' : 'Aktifkan laboratorium?'}
                message={
                    toggleTarget?.isActive
                        ? `"${toggleTarget.name}" akan hilang dari peta dan pilihan sesi. Sesi yang memakainya tidak dapat menerima presensi sampai laboratorium diaktifkan kembali.`
                        : `"${toggleTarget?.name ?? ''}" akan tampil kembali di peta dan pilihan sesi.`
                }
                confirmText={toggling ? 'Memproses...' : toggleTarget?.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                confirmColor={toggleTarget?.isActive ? 'danger' : 'primary'}
                onConfirm={() => void confirmToggle()}
                onCancel={() => {
                    if (!toggling) setToggleTarget(null);
                }}
            />
        </AssistantScreen>
    );
}

const gaya = (theme: Theme) => StyleSheet.create({
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    titleBlock: { flex: 1, gap: 2 },
    heroTitle: { color: theme.colors.onHero },
    heroSubtitle: { color: theme.colors.heroSoft },
    addButton: {
        minHeight: 44,
        paddingHorizontal: 14,
        borderRadius: tokens.radius.pill,
        backgroundColor: theme.colors.primaryFill,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    addLabel: { color: theme.colors.onPrimary, fontSize: 13 },
    search: {
        minHeight: 46,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: 16,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        fontFamily: tokens.fonts.regular,
        fontSize: 14,
        color: theme.colors.textPrimary,
    },
    white: { color: theme.colors.onPrimary },
    notice: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: 16,
        borderWidth: 1,
    },
    noticeSuccess: { backgroundColor: theme.colors.successSoft, borderColor: theme.colors.success },
    noticeError: { backgroundColor: theme.colors.errorSoft, borderColor: theme.colors.error },
    noticeText: { flex: 1, fontFamily: tokens.fonts.medium },
    noticeClose: { minHeight: 44, justifyContent: 'center' },
    successText: { color: theme.colors.success },
    errorText: { color: theme.colors.error },
    centerBox: { paddingVertical: 48, alignItems: 'center', gap: 12 },
    stateCard: {
        padding: 24,
        borderRadius: tokens.radius.card,
        backgroundColor: theme.colors.glassSurface,
        borderWidth: 1,
        borderColor: theme.colors.glassBorder,
        alignItems: 'center',
        gap: 12,
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: theme.colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stateTitle: { fontSize: 19, lineHeight: 25, fontFamily: tokens.fonts.bold, textAlign: 'center' },
    centerText: { textAlign: 'center' },
    primaryButton: {
        minHeight: 48,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: tokens.radius.control,
        backgroundColor: theme.colors.primaryFill,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    list: { gap: 14 },
    card: {
        padding: 18,
        borderRadius: tokens.radius.card,
        backgroundColor: theme.colors.glassSurface,
        borderWidth: 1,
        borderColor: theme.colors.glassBorder,
        gap: 8,
    },
    cardInactive: { opacity: 0.8 },
    cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    codeText: { fontFamily: tokens.fonts.semibold },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: tokens.radius.pill,
        backgroundColor: theme.colors.neutralSoft,
    },
    activeBadge: { backgroundColor: theme.colors.lime },
    statusText: { fontSize: 11, fontFamily: tokens.fonts.semibold },
    activeStatusText: { color: theme.colors.onLime },
    cardTitle: { fontSize: 17, lineHeight: 23, fontFamily: tokens.fonts.bold },
    metaList: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: theme.colors.hairline,
    },
    chipButton: {
        minHeight: 44,
        paddingHorizontal: 14,
        borderRadius: tokens.radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipNeutral: { backgroundColor: theme.colors.neutralSoft },
    chipNeutralText: { fontFamily: tokens.fonts.semibold, color: theme.colors.textPrimary },
    chipDanger: { backgroundColor: theme.colors.errorSoft },
    chipDangerText: { fontFamily: tokens.fonts.semibold, color: theme.colors.error },
    pressed: { opacity: 0.7 },
});
