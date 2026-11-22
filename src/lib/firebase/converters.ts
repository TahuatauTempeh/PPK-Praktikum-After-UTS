import type { DocumentData, DocumentSnapshot } from 'firebase/firestore';

import type { UserProfile } from '@/types';

export function toUserProfile(snapshot: DocumentSnapshot<DocumentData>): UserProfile {
  const data = snapshot.data() ?? {};

  return {
    id: snapshot.id,
    name: typeof data.name === 'string' ? data.name : '',
    nim: typeof data.nim === 'string' ? data.nim : '',
    email: typeof data.email === 'string' ? data.email : '',
    role: data.role === 'asisten' ? 'asisten' : 'praktikan',
    isAdmin: data.isAdmin === true,
    roleUpdatedBy: typeof data.roleUpdatedBy === 'string' ? data.roleUpdatedBy : undefined,
    roleUpdatedAt: data.roleUpdatedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    expoPushToken: typeof data.expoPushToken === 'string' ? data.expoPushToken : null,
    pushPlatform: data.pushPlatform === 'android' || data.pushPlatform === 'ios' ? data.pushPlatform : null,
    pushUpdatedAt: data.pushUpdatedAt ?? null,
  };
}
