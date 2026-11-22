/**
 * laboratory-service.ts: CRUD laboratorium (Dev 1).
 * Laboratorium tidak dihapus permanen; `setLaboratoryActive` adalah soft delete.
 * Setiap tulis dicatat ke auditLogs lewat logActionInBatch.
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    where,
    writeBatch,
    type DocumentData,
    type DocumentSnapshot,
} from 'firebase/firestore';

import { getFirebaseAuth } from '@/lib/firebase/auth';
import { logActionInBatch } from '@/lib/firebase/audit';
import { COLLECTIONS, getDb } from '@/lib/firebase/firestore';
import { mapFirebaseError } from '@/lib/firebase/errors';
import { toMillis } from '@/lib/praktikum-helpers';
import { CreateLaboratoryInput, Laboratory, UpdateLaboratoryInput } from '@/types';

import { validateLaboratoryInput } from './laboratory-validation';

const DEFAULT_RADIUS_METERS = 100;

function str(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function num(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function toLaboratory(snapshot: DocumentSnapshot<DocumentData>): Laboratory {
    const data = snapshot.data() ?? {};
    return {
        id: snapshot.id,
        name: str(data.name),
        code: str(data.code),
        building: str(data.building),
        floor: str(data.floor),
        room: str(data.room),
        latitude: num(data.latitude, 0),
        longitude: num(data.longitude, 0),
        radiusMeters: num(data.radiusMeters, DEFAULT_RADIUS_METERS),
        description: str(data.description),
        isActive: data.isActive !== false,
        createdAt: data.createdAt ?? '',
        updatedAt: data.updatedAt ?? '',
        updatedBy: str(data.updatedBy),
    };
}

function sortByCode(items: Laboratory[]): Laboratory[] {
    return [...items].sort(
        (a, b) => a.code.localeCompare(b.code) || toMillis(a.createdAt) - toMillis(b.createdAt)
    );
}

function currentUid(): string {
    const uid = getFirebaseAuth().currentUser?.uid;
    if (!uid) throw new Error('Sesi login berakhir. Masuk kembali untuk mengubah laboratorium.');
    return uid;
}

function auditSnapshot(lab: Omit<Laboratory, 'id' | 'createdAt' | 'updatedAt'>) {
    const { name, code, building, floor, room, latitude, longitude, radiusMeters, description, isActive } = lab;
    return { name, code, building, floor, room, latitude, longitude, radiusMeters, description, isActive };
}

function rethrow(error: unknown): never {
    if (typeof error === 'object' && error !== null && 'code' in error) {
        throw new Error(mapFirebaseError(error).message);
    }
    if (error instanceof Error) throw error;
    throw new Error('Terjadi kesalahan. Coba lagi.');
}

/** Listener realtime semua laboratorium (aktif dan nonaktif), urut kode. */
export function listenLaboratories(
    onData: (items: Laboratory[]) => void,
    onError?: (message: string) => void
): () => void {
    return onSnapshot(
        collection(getDb(), COLLECTIONS.laboratories),
        snapshot => onData(sortByCode(snapshot.docs.map(toLaboratory))),
        error => onError?.(mapFirebaseError(error).message)
    );
}

export async function getLaboratoryById(id: string): Promise<Laboratory | null> {
    try {
        const snapshot = await getDoc(doc(getDb(), COLLECTIONS.laboratories, id));
        return snapshot.exists() ? toLaboratory(snapshot) : null;
    } catch (error) {
        rethrow(error);
    }
}

export async function getActiveLaboratories(): Promise<Laboratory[]> {
    try {
        const snapshot = await getDocs(
            query(collection(getDb(), COLLECTIONS.laboratories), where('isActive', '==', true))
        );
        return sortByCode(snapshot.docs.map(toLaboratory));
    } catch (error) {
        rethrow(error);
    }
}

export async function createLaboratory(input: CreateLaboratoryInput): Promise<Laboratory> {
    const clean = validateLaboratoryInput(input);
    const uid = currentUid();

    try {
        const db = getDb();
        const labRef = doc(collection(db, COLLECTIONS.laboratories));
        const batch = writeBatch(db);
        batch.set(labRef, {
            ...clean,
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            updatedBy: uid,
        });
        logActionInBatch(batch, 'CREATE', COLLECTIONS.laboratories, labRef.id, null, {
            ...clean,
            isActive: true,
        });
        await batch.commit();

        const created = await getDoc(labRef);
        if (created.exists()) return toLaboratory(created);
        const now = new Date().toISOString();
        return { id: labRef.id, ...clean, isActive: true, createdAt: now, updatedAt: now, updatedBy: uid };
    } catch (error) {
        rethrow(error);
    }
}

export async function updateLaboratory(
    id: string,
    input: UpdateLaboratoryInput
): Promise<Laboratory> {
    const uid = currentUid();

    try {
        const db = getDb();
        const labRef = doc(db, COLLECTIONS.laboratories, id);
        const currentSnap = await getDoc(labRef);
        if (!currentSnap.exists()) throw new Error('Laboratorium tidak ditemukan.');

        const current = toLaboratory(currentSnap);
        const merged = validateLaboratoryInput({
            name: input.name ?? current.name,
            code: input.code ?? current.code,
            building: input.building ?? current.building,
            floor: input.floor ?? current.floor,
            room: input.room ?? current.room,
            latitude: input.latitude ?? current.latitude,
            longitude: input.longitude ?? current.longitude,
            radiusMeters: input.radiusMeters ?? current.radiusMeters,
            description: input.description ?? current.description,
        });
        const isActive = input.isActive ?? current.isActive;

        const batch = writeBatch(db);
        batch.update(labRef, {
            ...merged,
            isActive,
            updatedAt: serverTimestamp(),
            updatedBy: uid,
        });
        logActionInBatch(
            batch,
            'UPDATE',
            COLLECTIONS.laboratories,
            id,
            auditSnapshot(current),
            { ...merged, isActive }
        );
        await batch.commit();

        return { ...current, ...merged, isActive, updatedBy: uid };
    } catch (error) {
        rethrow(error);
    }
}

/** Soft delete: laboratorium tetap ada agar sesi lama masih punya referensi. */
export async function setLaboratoryActive(id: string, isActive: boolean): Promise<void> {
    const uid = currentUid();

    try {
        const db = getDb();
        const labRef = doc(db, COLLECTIONS.laboratories, id);
        const currentSnap = await getDoc(labRef);
        if (!currentSnap.exists()) throw new Error('Laboratorium tidak ditemukan.');

        const current = toLaboratory(currentSnap);
        if (current.isActive === isActive) return;

        const batch = writeBatch(db);
        batch.update(labRef, { isActive, updatedAt: serverTimestamp(), updatedBy: uid });
        logActionInBatch(
            batch,
            isActive ? 'ACTIVATE' : 'DEACTIVATE',
            COLLECTIONS.laboratories,
            id,
            { isActive: current.isActive },
            { isActive }
        );
        await batch.commit();
    } catch (error) {
        rethrow(error);
    }
}
