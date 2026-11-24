import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import {
    getFreshPosition,
    requestForegroundPermission,
} from '@/lib/device-location';
import { MAX_RADIUS_METERS, MIN_RADIUS_METERS } from '@/lib/geo';
import {
    createLaboratory,
    getLaboratoryById,
    setLaboratoryActive,
    updateLaboratory,
} from '@/lib/laboratory-service';
import {
    getLaboratoryFieldErrors,
    LABORATORY_LIMITS,
    parseCoordinate,
    type LaboratoryField,
    type LaboratoryFieldErrors,
} from '@/lib/laboratory-validation';
import { tokens, useTheme, useThemedStyles, type Theme } from '@/theme';

import { AssistantScreen } from '../components/assistant-screen';
import { AssistantText } from '../components/assistant-text';
import { AssistantTopBar } from '../components/assistant-top-bar';

type Props = {
    /** Kosong berarti mode tambah; terisi berarti mode ubah. */
    labId?: string;
    onBack: () => void;
    onSaved: () => void;
};

type FormState = {
    name: string;
    code: string;
    building: string;
    floor: string;
    room: string;
    latitude: string;
    longitude: string;
    radiusMeters: string;
    description: string;
    isActive: boolean;
};

/** TestID hanya untuk kontrol yang dipakai E2E critical. */
const FIELD_TEST_IDS: Partial<Record<LaboratoryField, string>> = {
    name: 'lab-nama',
    code: 'lab-kode',
    building: 'lab-gedung',
    room: 'lab-ruang',
    latitude: 'lab-latitude',
    longitude: 'lab-longitude',
    radiusMeters: 'lab-radius',
};

const EMPTY_FORM: FormState = {
    name: '',
    code: '',
    building: '',
    floor: '',
    room: '',
    latitude: '',
    longitude: '',
    radiusMeters: '100',
    description: '',
    isActive: true,
};

/** Form tambah/ubah laboratorium dengan validasi inline dan tombol "Gunakan lokasi saya". */
export default function LabFormScreen({ labId, onBack, onSaved }: Props) {
    const theme = useTheme();
    const styles = useThemedStyles(gaya);
    const isEditing = Boolean(labId);

    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [errors, setErrors] = useState<LaboratoryFieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [locating, setLocating] = useState(false);
    const [locationMessage, setLocationMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!labId) return;
        let active = true;
        getLaboratoryById(labId)
            .then(lab => {
                if (!active) return;
                if (!lab) {
                    setFormError('Laboratorium tidak ditemukan.');
                } else {
                    setForm({
                        name: lab.name,
                        code: lab.code,
                        building: lab.building,
                        floor: lab.floor,
                        room: lab.room,
                        latitude: String(lab.latitude),
                        longitude: String(lab.longitude),
                        radiusMeters: String(lab.radiusMeters),
                        description: lab.description,
                        isActive: lab.isActive,
                    });
                }
                setLoading(false);
            })
            .catch(err => {
                if (!active) return;
                setFormError(err instanceof Error ? err.message : 'Gagal memuat laboratorium.');
                setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [labId]);

    function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm(prev => ({ ...prev, [key]: value }));
        if (key in errors) setErrors(prev => ({ ...prev, [key as LaboratoryField]: undefined }));
        if (formError) setFormError(null);
    }

    function collectInput() {
        return {
            name: form.name,
            code: form.code,
            building: form.building,
            floor: form.floor,
            room: form.room,
            latitude: parseCoordinate(form.latitude),
            longitude: parseCoordinate(form.longitude),
            radiusMeters: parseCoordinate(form.radiusMeters),
            description: form.description,
        };
    }

    async function fillFromDeviceLocation() {
        if (locating) return;
        setLocating(true);
        setLocationMessage(null);
        try {
            let result = await getFreshPosition();
            if (!result.ok && (result.code === 'PERMISSION_DENIED' || result.code === 'PERMISSION_BLOCKED')) {
                const permission = await requestForegroundPermission();
                if (permission === 'granted') {
                    result = await getFreshPosition();
                } else {
                    setLocationMessage(
                        permission === 'blocked'
                            ? 'Izin lokasi diblokir. Aktifkan lewat pengaturan perangkat, atau isi koordinat manual.'
                            : 'Izin lokasi diperlukan. Izinkan akses lokasi atau isi koordinat manual.'
                    );
                    return;
                }
            }
            if (result.ok) {
                setForm(prev => ({
                    ...prev,
                    latitude: result.position.latitude.toFixed(6),
                    longitude: result.position.longitude.toFixed(6),
                }));
                setErrors(prev => ({ ...prev, latitude: undefined, longitude: undefined }));
                setLocationMessage(
                    `Koordinat diisi dari posisi perangkat (akurasi sekitar ${Math.round(result.position.accuracyMeters)} m). Kamu masih bisa mengubahnya.`
                );
            } else {
                setLocationMessage(result.message);
            }
        } finally {
            setLocating(false);
        }
    }

    async function handleSave() {
        if (saving) return;
        const input = collectInput();
        const fieldErrors = getLaboratoryFieldErrors(input);
        setErrors(fieldErrors);
        if (Object.keys(fieldErrors).length > 0) {
            setFormError('Periksa kembali isian yang ditandai.');
            return;
        }

        setSaving(true);
        setFormError(null);
        try {
            if (labId) {
                await updateLaboratory(labId, { ...input, isActive: form.isActive });
            } else {
                const created = await createLaboratory(input);
                if (!form.isActive) await setLaboratoryActive(created.id, false);
            }
            onSaved();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Gagal menyimpan laboratorium.');
            setSaving(false);
        }
    }

    function renderField(
        key: LaboratoryField,
        label: string,
        options: {
            placeholder?: string;
            required?: boolean;
            keyboardType?: 'default' | 'numbers-and-punctuation' | 'decimal-pad';
            multiline?: boolean;
            maxLength?: number;
        } = {}
    ) {
        const error = errors[key];
        const value = form[key as keyof FormState] as string;
        return (
            <View style={styles.field} key={key}>
                <AssistantText variant="label" style={styles.fieldLabel}>
                    {label}
                    {options.required ? ' *' : ''}
                </AssistantText>
                <TextInput
                    testID={FIELD_TEST_IDS[key]}
                    value={value}
                    onChangeText={text => setField(key as keyof FormState, text as never)}
                    placeholder={options.placeholder}
                    placeholderTextColor={theme.colors.textSecondary}
                    editable={!saving}
                    maxLength={options.maxLength}
                    keyboardType={options.keyboardType ?? 'default'}
                    multiline={options.multiline}
                    accessibilityLabel={label}
                    style={[styles.input, options.multiline && styles.multiline, error && styles.inputError]}
                />
                {error ? (
                    <AssistantText variant="caption" style={styles.errorText} accessibilityLiveRegion="polite">
                        {error}
                    </AssistantText>
                ) : null}
            </View>
        );
    }

    return (
        <AssistantScreen
            header={<AssistantTopBar onBack={onBack} title={isEditing ? 'Ubah laboratorium' : 'Tambah laboratorium'} />}
            edges={['top', 'bottom', 'left', 'right']}>
            <View style={styles.titleBlock}>
                <AssistantText variant="pageTitle" accessibilityRole="header" style={styles.heroTitle}>
                    {isEditing ? 'Ubah laboratorium' : 'Tambah laboratorium'}
                </AssistantText>
                <AssistantText variant="caption" style={styles.heroSubtitle}>
                    Koordinat dan radius dipakai untuk memvalidasi presensi.
                </AssistantText>
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <AssistantText variant="caption" tone="secondary">Memuat laboratorium...</AssistantText>
                </View>
            ) : (
                <View style={styles.card}>
                    {formError && (
                        <View style={styles.errorBox} accessibilityLiveRegion="polite">
                            <AssistantText variant="caption" style={styles.errorBoxText}>{formError}</AssistantText>
                        </View>
                    )}

                    {renderField('name', 'Nama', {
                        required: true,
                        placeholder: 'Contoh: Lab A201',
                        maxLength: LABORATORY_LIMITS.name,
                    })}
                    {renderField('code', 'Kode', {
                        required: true,
                        placeholder: 'Contoh: LAB-IF-01',
                        maxLength: LABORATORY_LIMITS.code,
                    })}
                    {renderField('building', 'Gedung', {
                        required: true,
                        placeholder: 'Contoh: Gedung A',
                        maxLength: LABORATORY_LIMITS.building,
                    })}
                    <View style={styles.row}>
                        <View style={styles.rowItem}>
                            {renderField('floor', 'Lantai', {
                                placeholder: 'Lantai 2',
                                maxLength: LABORATORY_LIMITS.floor,
                            })}
                        </View>
                        <View style={styles.rowItem}>
                            {renderField('room', 'Ruang', {
                                required: true,
                                placeholder: 'A201',
                                maxLength: LABORATORY_LIMITS.room,
                            })}
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.rowItem}>
                            {renderField('latitude', 'Latitude', {
                                required: true,
                                placeholder: '-7.05190',
                                keyboardType: 'numbers-and-punctuation',
                            })}
                        </View>
                        <View style={styles.rowItem}>
                            {renderField('longitude', 'Longitude', {
                                required: true,
                                placeholder: '110.43830',
                                keyboardType: 'numbers-and-punctuation',
                            })}
                        </View>
                    </View>

                    <Pressable
                        accessibilityRole="button"
                        disabled={locating || saving}
                        onPress={() => void fillFromDeviceLocation()}
                        style={({ pressed }) => [
                            styles.secondaryButton,
                            (locating || saving) && styles.disabled,
                            pressed && styles.pressed,
                        ]}>
                        {locating ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
                        <AssistantText variant="label" tone="accent">
                            {locating ? 'Mencari lokasi...' : 'Gunakan lokasi saya'}
                        </AssistantText>
                    </Pressable>
                    {locationMessage ? (
                        <AssistantText variant="caption" tone="secondary" accessibilityLiveRegion="polite">
                            {locationMessage}
                        </AssistantText>
                    ) : null}

                    {renderField('radiusMeters', `Radius presensi (${MIN_RADIUS_METERS} sampai ${MAX_RADIUS_METERS} m)`, {
                        required: true,
                        placeholder: '100',
                        keyboardType: 'numbers-and-punctuation',
                        maxLength: 3,
                    })}
                    {renderField('description', 'Deskripsi', {
                        placeholder: 'Catatan singkat lokasi laboratorium',
                        multiline: true,
                        maxLength: LABORATORY_LIMITS.description,
                    })}

                    <View style={styles.switchRow}>
                        <View style={styles.switchText}>
                            <AssistantText variant="label">Laboratorium aktif</AssistantText>
                            <AssistantText variant="caption" tone="secondary">
                                Laboratorium nonaktif tidak tampil di peta dan pilihan sesi.
                            </AssistantText>
                        </View>
                        <Switch
                            value={form.isActive}
                            onValueChange={value => setField('isActive', value)}
                            disabled={saving}
                            accessibilityLabel="Laboratorium aktif"
                        />
                    </View>

                    <View style={styles.actions}>
                        <Pressable
                            testID="lab-simpan"
                            accessibilityRole="button"
                            disabled={saving}
                            onPress={() => void handleSave()}
                            style={({ pressed }) => [
                                styles.button,
                                styles.primary,
                                saving && styles.disabled,
                                pressed && !saving && styles.pressed,
                            ]}>
                            <AssistantText variant="label" style={styles.white}>
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </AssistantText>
                        </Pressable>
                        <Pressable
                            accessibilityRole="button"
                            disabled={saving}
                            onPress={onBack}
                            style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.pressed]}>
                            <AssistantText variant="label" tone="accent">Batal</AssistantText>
                        </Pressable>
                    </View>
                </View>
            )}
        </AssistantScreen>
    );
}

const gaya = (theme: Theme) => StyleSheet.create({
    titleBlock: { gap: 2 },
    heroTitle: { color: theme.colors.onHero },
    heroSubtitle: { color: theme.colors.heroSoft },
    centerBox: { paddingVertical: 48, alignItems: 'center', gap: 12 },
    card: {
        padding: 18,
        borderRadius: tokens.radius.card,
        backgroundColor: theme.colors.glassSurface,
        borderWidth: 1,
        borderColor: theme.colors.glassBorder,
        gap: 12,
    },
    errorBox: {
        padding: 12,
        borderRadius: 14,
        backgroundColor: theme.colors.errorSoft,
        borderWidth: 1,
        borderColor: theme.colors.error,
    },
    errorBoxText: { color: theme.colors.error, fontFamily: tokens.fonts.medium },
    field: { gap: 6 },
    fieldLabel: { fontSize: 13, lineHeight: 18 },
    row: { flexDirection: 'row', gap: 10 },
    rowItem: { flex: 1 },
    input: {
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
    multiline: { minHeight: 80, textAlignVertical: 'top' },
    inputError: { borderColor: theme.colors.error },
    errorText: { color: theme.colors.error, fontFamily: tokens.fonts.medium },
    secondaryButton: {
        minHeight: 48,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: tokens.radius.control,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primarySoft,
        paddingHorizontal: 18,
    },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    switchText: { flex: 1, gap: 2 },
    actions: { gap: 10, marginTop: 4 },
    button: {
        minHeight: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: tokens.radius.control,
        borderWidth: 1,
        paddingHorizontal: 18,
        paddingVertical: 14,
    },
    primary: { backgroundColor: theme.colors.primaryFill, borderColor: theme.colors.primaryFill },
    cancel: { backgroundColor: theme.colors.glassSurface, borderColor: theme.colors.glassBorder },
    disabled: { opacity: 0.6 },
    white: { color: theme.colors.onPrimary },
    pressed: { opacity: 0.7 },
});
