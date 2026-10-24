import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AssistantScreen } from './components/assistant-screen';
import { AssistantText } from './components/assistant-text';
import { ScheduleIcon } from './components/schedule-icon';
import { SessionFormField } from './components/session-form-field';
import { SessionInputPicker, type SessionPickerKind } from './components/session-input-picker';
import { useAssistantSessions } from './preview-session-provider';
import { type AssistantSession } from './schedule-data';
import { emptySessionForm, sessionChoices, type SessionForm, type SessionFormErrors, validateSessionForm } from './session-form';
import { assistantTheme as theme } from './theme';

type Props = { onCancel: () => void; onSaved: (session: AssistantSession) => void };
export default function AddSessionScreen({ onCancel, onSaved }: Props) {
  const { sessions, addSession } = useAssistantSessions();
  const choices = sessionChoices(sessions);
  const [form, setForm] = useState<SessionForm>({ ...emptySessionForm });
  const [errors, setErrors] = useState<SessionFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [picker, setPicker] = useState<SessionPickerKind | null>(null);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  function change(key: keyof SessionForm, value: string) {
    const next = { ...form, [key]: value };
    setForm(next);
    setSaveError('');
    if (submitted) setErrors(validateSessionForm(next, choices));
  }

  function save() {
    if (savingRef.current) return;
    const nextErrors = validateSessionForm(form, choices);
    setErrors(nextErrors);
    setSubmitted(true);
    if (Object.keys(nextErrors).length) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      return;
    }
    savingRef.current = true;
    setSaving(true);
    let session: AssistantSession;
    try {
      session = addSession(form);
    } catch {
      setSaveError('Sesi belum tersimpan. Periksa isian, lalu coba simpan kembali.');
      setSaving(false);
      savingRef.current = false;
      return;
    }
    onSaved(session);
  }
  const hasErrors = Object.keys(errors).length > 0;
  const dateLabel = form.date ? new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(`${form.date}T00:00:00+07:00`)) : '';

  return (
    <>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
        aria-hidden={picker !== null} importantForAccessibility={picker ? 'no-hide-descendants' : 'auto'}>
        <AssistantScreen scrollRef={scrollRef} footer={
          <View style={styles.footer}>
            <Pressable accessibilityRole="button" disabled={saving} accessibilityState={{ disabled: saving, busy: saving }} onPress={save}
              style={({ pressed }) => [styles.save, saving && styles.disabled, pressed && styles.pressed]}>
              <AssistantText variant="label" style={styles.white}>Tambahkan</AssistantText>
            </Pressable>
          </View>
        }>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Kembali" onPress={onCancel} style={styles.back}>
              <ScheduleIcon name="back" size={20} />
            </Pressable>
            <AssistantText style={styles.headerTitle} accessibilityRole="header">Tambah sesi</AssistantText>
            <Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancel}>
              <AssistantText tone="accent" style={styles.cancelText}>Batal</AssistantText>
            </Pressable>
          </View>
          <View style={styles.form}>
            <View style={styles.intro}>
              <AssistantText style={styles.title} accessibilityRole="header">Siapkan praktikum baru</AssistantText>
              {hasErrors && (
                <AssistantText variant="caption" tone="secondary" accessibilityLiveRegion="polite" style={styles.errorText}>
                  Periksa kembali kolom yang ditandai.
                </AssistantText>
              )}
            </View>
            <SessionFormField label="Mata kuliah / praktikum" value={form.course} placeholder="Pilih mata kuliah" error={errors.course}
              icon={errors.course ? 'formChevronError' : 'formChevron'} onPress={() => setPicker('course')} />
            <SessionFormField label="Sesi / topik" value={form.topic} placeholder="Contoh: Sesi 05 · Autentikasi dasar" error={errors.topic}
              onChangeText={value => change('topic', value)} />
            <SessionFormField label="Kelas" value={form.className} placeholder="Pilih kelas" error={errors.className}
              icon={errors.className ? 'formChevronError' : 'formChevron'} onPress={() => setPicker('className')} />
            <SessionFormField label="Tanggal" value={dateLabel} placeholder="Pilih tanggal" error={errors.date}
              icon="formCalendar" onPress={() => setPicker('date')} />
            <View style={styles.times}>
              <View style={styles.timeField}>
                <SessionFormField label="Jam mulai" value={form.startTime.replace(':', '.')} placeholder="Pilih jam" error={errors.startTime}
                  icon={errors.startTime ? 'formClockError' : 'formClock'} onPress={() => setPicker('startTime')} />
              </View>
              <View style={styles.timeField}>
                <SessionFormField label="Jam selesai" value={form.endTime.replace(':', '.')} placeholder="Pilih jam" error={errors.endTime}
                  icon={errors.endTime ? 'formClockError' : 'formClock'} onPress={() => setPicker('endTime')} />
              </View>
            </View>
            <SessionFormField label="Lokasi / ruangan" value={form.room} placeholder="Contoh: Lab Komputer 2" error={errors.room}
              icon="formPin" onChangeText={value => change('room', value)} />
            {saveError !== '' && <AssistantText accessibilityRole="alert" style={styles.errorText}>{saveError}</AssistantText>}
          </View>
        </AssistantScreen>
      </KeyboardAvoidingView>
      {picker && <SessionInputPicker kind={picker} value={form[picker]} choices={choices}
        onPick={value => { change(picker, value); setPicker(null); }} onCancel={() => setPicker(null)} />}
    </>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  back: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: theme.fonts.bold, fontSize: 18, lineHeight: 24 },
  cancel: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  cancelText: { fontFamily: theme.fonts.semibold },
  form: { gap: 15 },
  intro: { gap: 7 },
  title: { fontFamily: theme.fonts.bold, fontSize: 24, lineHeight: 31 },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  timeField: { flexGrow: 1, flexBasis: 140 },
  errorText: { color: theme.colors.error },
  footer: { width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface },
  save: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 14, borderRadius: theme.radius.control, backgroundColor: theme.colors.primary },
  white: { color: theme.colors.surface },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
});
