/**
 * Entry point Firebase Cloud Functions (Sprint 3).
 * Menginisialisasi Firebase Admin dan mengekspor Cloud Functions triggers.
 */

import { initializeApp } from 'firebase-admin/app';

// Inisialisasi Firebase Admin SDK singleton
initializeApp();

export { onSessionUpdated, onPermissionReviewed } from './notifications';
