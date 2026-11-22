/**
 * lab-list-mode.tsx: tampilan daftar laboratorium aksesibel untuk mode web,
 * tombol "Daftar" di native, dan fallback saat peta gagal dimuat.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatusLabel } from '@/screens/praktikan/components/status-label';
import { useTheme, useThemedStyles, type Theme } from '@/theme';

import type { LaboratoryMapItem } from '../selectors';
import { LabActivityCard } from './lab-activity-card';

export interface LabListModeProps {
  items: LaboratoryMapItem[];
  selectedLabId: string | null;
  onSelectLab: (labId: string | null) => void;
  bottomInset?: number;
  headerSlot?: React.ReactNode;
  onFocusOnMap?: (labId: string) => void;
}

export function LabListMode({
  items,
  selectedLabId,
  onSelectLab,
  bottomInset = 0,
  headerSlot,
  onFocusOnMap,
}: LabListModeProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  if (items.length === 0) {
    return (
      <View style={[styles.emptyWrapper, { paddingBottom: bottomInset }]}>
        {headerSlot}
        <View style={styles.emptyCard}>
          <Text accessibilityRole="header" style={styles.emptyTitle}>
            Belum ada laboratorium
          </Text>
          <Text style={styles.emptyBody}>
            Laboratorium aktif yang ditambahkan asisten akan tampil di sini beserta jadwal praktikumnya.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: bottomInset + theme.spacing.page },
      ]}
    >
      {headerSlot ? <View style={styles.listHeader}>{headerSlot}</View> : null}

      {items.map((item) => {
        const isExpanded = item.lab.id === selectedLabId;
        const summary = item.current ?? item.next;

        if (isExpanded) {
          return (
            <View key={item.lab.id} style={styles.expandedDetail}>
              <LabActivityCard item={item} onClose={() => onSelectLab(null)} />
              {onFocusOnMap ? (
                <Pressable
                  onPress={() => onFocusOnMap(item.lab.id)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.focusMapButton, pressed && styles.pressed]}
                >
                  <Text style={styles.focusMapText}>Lihat di peta</Text>
                </Pressable>
              ) : null}
            </View>
          );
        }

        return (
          <View key={item.lab.id} style={styles.itemWrapper}>
            <Pressable
              onPress={() => onSelectLab(item.lab.id)}
              accessibilityRole="button"
              accessibilityState={{ expanded: false }}
              accessibilityLabel={`${item.lab.name}, ${item.locationLabel}, radius ${item.radiusLabel}`}
              style={({ pressed }) => [styles.rowCard, pressed && styles.pressed]}
            >
              <View style={styles.rowTop}>
                <View style={styles.rowIdentity}>
                  <Text style={styles.labName}>{item.lab.name}</Text>
                  <Text style={styles.labLocation}>
                    {item.lab.code} · {item.locationLabel} · Radius {item.radiusLabel}
                  </Text>
                </View>

                <Text style={styles.toggleHint}>Detail</Text>
              </View>

              {summary ? (
                <View style={styles.summaryRow}>
                  <View style={styles.summaryTextWrap}>
                    <Text style={styles.summaryPrefix}>
                      {item.current ? 'Sekarang: ' : 'Berikutnya: '}
                      <Text style={styles.summaryTitle}>{summary.title}</Text>
                    </Text>
                    <Text style={styles.summaryMeta}>
                      {summary.className} · {summary.dateLabel} · {summary.timeRangeWib}
                    </Text>
                  </View>
                  <StatusLabel status={summary.status} />
                </View>
              ) : (
                <Text style={styles.noSchedule}>Belum ada praktikum terjadwal</Text>
              )}
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    listHeader: {
      marginBottom: theme.spacing.md,
    },
    listContent: {
      paddingHorizontal: theme.spacing.base,
      paddingTop: theme.spacing.sm,
      gap: theme.spacing.md,
      width: '100%',
      maxWidth: theme.contentWidth,
      alignSelf: 'center',
    },
    emptyWrapper: {
      flex: 1,
      paddingHorizontal: theme.spacing.base,
      paddingTop: theme.spacing.sm,
      gap: theme.spacing.md,
      width: '100%',
      maxWidth: theme.contentWidth,
      alignSelf: 'center',
    },
    emptyCard: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.page,
      gap: theme.spacing.sm,
    },
    emptyTitle: {
      ...theme.typography.sectionHeading,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    emptyBody: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    itemWrapper: {
      gap: theme.spacing.sm,
    },
    rowCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.base,
      gap: theme.spacing.sm,
      minHeight: 44,
    },
    rowTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    rowIdentity: {
      flex: 1,
      gap: theme.spacing.xxs,
    },
    labName: {
      ...theme.typography.label,
      color: theme.colors.textPrimary,
    },
    labLocation: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    toggleHint: {
      ...theme.typography.caption,
      fontFamily: theme.fonts.semibold,
      color: theme.colors.primary,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.panel,
      borderRadius: theme.radius.control,
      padding: theme.spacing.md,
    },
    summaryTextWrap: {
      flex: 1,
      gap: theme.spacing.xxs,
    },
    summaryPrefix: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    summaryTitle: {
      fontFamily: theme.fonts.semibold,
      color: theme.colors.textPrimary,
    },
    summaryMeta: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    noSchedule: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    expandedDetail: {
      gap: theme.spacing.sm,
    },
    focusMapButton: {
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.button,
      backgroundColor: theme.colors.primaryFill,
      paddingHorizontal: theme.spacing.base,
    },
    focusMapText: {
      ...theme.typography.label,
      color: theme.colors.onPrimary,
    },
    pressed: {
      opacity: 0.8,
    },
  });
