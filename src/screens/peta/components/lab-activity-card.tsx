/**
 * lab-activity-card.tsx: kartu/panel detail laboratorium yang menampilkan
 * identitas lab, radius, serta praktikum "Sekarang" dan "Berikutnya"
 * dengan label status berbasis teks.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusLabel } from '@/screens/praktikan/components/status-label';
import { useThemedStyles, type Theme } from '@/theme';

import type { LaboratoryMapItem, MapSessionSummary } from '../selectors';

interface LabActivityCardProps {
  item: LaboratoryMapItem;
  onClose?: () => void;
}

function SessionSlot({
  eyebrow,
  session,
  emptyText,
}: {
  eyebrow: string;
  session: MapSessionSummary | null;
  emptyText: string;
}) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.slot}>
      <View style={styles.slotHeader}>
        <Text style={styles.slotEyebrow}>{eyebrow}</Text>
        {session ? <StatusLabel status={session.status} /> : null}
      </View>

      {session ? (
        <View style={styles.slotBody}>
          <Text style={styles.sessionTitle}>{session.title}</Text>
          <Text style={styles.sessionMeta}>
            {session.className} · {session.dateLabel} · {session.timeRangeWib}
          </Text>
          {session.room ? (
            <Text style={styles.sessionRoom}>Ruang {session.room}</Text>
          ) : null}
        </View>
      ) : (
        <Text style={styles.emptySlotText}>{emptyText}</Text>
      )}
    </View>
  );
}

export function LabActivityCard({ item, onClose }: LabActivityCardProps) {
  const styles = useThemedStyles(createStyles);
  const { lab, locationLabel, radiusLabel, current, next, hasAnyActivity } = item;

  return (
    <View style={styles.card} accessibilityLabel={`Detail ${lab.name}`}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={styles.labName}>{lab.name}</Text>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{lab.code}</Text>
            </View>
          </View>
          <Text style={styles.labMeta}>
            {locationLabel} · Radius {radiusLabel}
          </Text>
        </View>

        {onClose ? (
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Tutup detail laboratorium"
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Text style={styles.closeButtonText}>Tutup</Text>
          </Pressable>
        ) : null}
      </View>

      {lab.description ? (
        <Text style={styles.description}>{lab.description}</Text>
      ) : null}

      {!hasAnyActivity ? (
        <View style={styles.noActivityBox}>
          <Text style={styles.noActivityText}>Belum ada praktikum terjadwal</Text>
        </View>
      ) : (
        <View style={styles.slotsContainer}>
          <SessionSlot
            eyebrow="SEKARANG"
            session={current}
            emptyText="Tidak ada praktikum yang sedang berlangsung"
          />
          <SessionSlot
            eyebrow="BERIKUTNYA"
            session={next}
            emptyText="Belum ada praktikum terjadwal"
          />
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.base,
      gap: theme.spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    headerText: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    labName: {
      ...theme.typography.cardTitle,
      color: theme.colors.textPrimary,
    },
    codeBadge: {
      backgroundColor: theme.colors.primarySoft,
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xxs,
    },
    codeText: {
      ...theme.typography.tiny,
      fontFamily: theme.fonts.semibold,
      color: theme.colors.primary,
    },
    labMeta: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    description: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    closeButton: {
      minHeight: 44,
      minWidth: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.button,
      backgroundColor: theme.colors.neutralSoft,
    },
    closeButtonText: {
      ...theme.typography.caption,
      fontFamily: theme.fonts.semibold,
      color: theme.colors.textPrimary,
    },
    pressed: {
      opacity: 0.78,
    },
    noActivityBox: {
      backgroundColor: theme.colors.panel,
      borderRadius: theme.radius.control,
      padding: theme.spacing.base,
      alignItems: 'center',
    },
    noActivityText: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
    },
    slotsContainer: {
      gap: theme.spacing.sm,
    },
    slot: {
      backgroundColor: theme.colors.panel,
      borderRadius: theme.radius.control,
      padding: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    slotHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    slotEyebrow: {
      ...theme.typography.eyebrow,
      color: theme.colors.primary,
    },
    slotBody: {
      gap: theme.spacing.xxs,
    },
    sessionTitle: {
      ...theme.typography.label,
      color: theme.colors.textPrimary,
    },
    sessionMeta: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    sessionRoom: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    emptySlotText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
  });
