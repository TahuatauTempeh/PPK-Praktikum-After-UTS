/**
 * User Select Screen — Pilih identitas berdasarkan peran.
 * UC-01: Pilih peran dan identitas (bagian 2)
 *
 * Menerima query param `role` dari role select screen.
 * Menampilkan daftar user sesuai role untuk dipilih.
 */

import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useSession } from '@/context/session-context';
import { asistenUsers, praktikanUsers } from '@/data/dummy';
import { useTheme } from '@/hooks/use-theme';
import { Role, User } from '@/types';

export default function SelectUserScreen() {
  const theme = useTheme();
  const { setUser } = useSession();
  const params = useLocalSearchParams<{ role: Role }>();
  const role = params.role ?? 'praktikan';

  const users = role === 'asisten' ? asistenUsers : praktikanUsers;
  const roleLabel = role === 'asisten' ? 'Asisten' : 'Praktikan';
  const roleEmoji = role === 'asisten' ? '👨‍🏫' : '🎓';

  const handleSelectUser = (user: User) => {
    setUser(user);
    if (user.role === 'praktikan') {
      router.replace('/(praktikan)');
    } else {
      router.replace('/asisten');
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <Pressable
      onPress={() => handleSelectUser(item)}
      style={({ pressed }) => [
        styles.userCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
        <Text style={styles.avatarText}>
          {item.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.userNim, { color: theme.textSecondary }]}>{item.nim}</Text>
      </View>
      <Text style={[styles.arrow, { color: theme.textSecondary }]}>›</Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.primary }]}>← Kembali</Text>
          </Pressable>
          <Text style={styles.headerEmoji}>{roleEmoji}</Text>
          <Text style={[styles.title, { color: theme.text }]}>Pilih {roleLabel}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Pilih identitas Anda untuk masuk
          </Text>
        </View>

        {/* User List */}
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: 6,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginBottom: 8,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
  },
  headerEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3B82F6',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userNim: {
    fontSize: 13,
    fontWeight: '500',
  },
  arrow: {
    fontSize: 24,
    fontWeight: '300',
  },
});
