import type { DocumentData, DocumentSnapshot } from 'firebase/firestore';

import { toUserProfile } from './converters';

function snapshot(id: string, data: Record<string, unknown> | null): DocumentSnapshot<DocumentData> {
  return { id, data: () => data } as unknown as DocumentSnapshot<DocumentData>;
}

describe('toUserProfile', () => {
  it('menormalkan profil lengkap', () => {
    const profile = toUserProfile(
      snapshot('uid-1', {
        name: 'Bunga Maharani',
        nim: '231110002',
        email: 'bunga@example.com',
        role: 'asisten',
        isAdmin: true,
        roleUpdatedBy: 'uid-admin',
      })
    );

    expect(profile).toMatchObject({
      id: 'uid-1',
      name: 'Bunga Maharani',
      nim: '231110002',
      email: 'bunga@example.com',
      role: 'asisten',
      isAdmin: true,
      roleUpdatedBy: 'uid-admin',
    });
  });

  it('memberi nilai aman untuk dokumen yang belum lengkap', () => {
    const profile = toUserProfile(snapshot('uid-2', null));

    expect(profile).toMatchObject({
      id: 'uid-2',
      name: '',
      nim: '',
      email: '',
      role: 'praktikan',
      isAdmin: false,
      roleUpdatedBy: undefined,
    });
  });

  it('menolak role yang tidak dikenal dan isAdmin yang bukan boolean true', () => {
    const profile = toUserProfile(
      snapshot('uid-3', { role: 'admin', isAdmin: 'true', name: 'Nadia' })
    );

    expect(profile.role).toBe('praktikan');
    expect(profile.isAdmin).toBe(false);
    expect(profile.name).toBe('Nadia');
  });
});
