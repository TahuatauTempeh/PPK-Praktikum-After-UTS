/// <reference types="node" />
/**
 * Callable `submitAttendance` memakai salinan fungsi murni klien (PRD Lampiran C 3.3).
 * Test ini gagal bila salah satu salinan diubah tanpa yang lain, supaya hasil
 * hitung jarak dan keputusan presensi di layar selalu sama dengan di server.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');

describe.each(['geo.ts', 'geo.test.ts', 'attendance-rules.ts', 'attendance-rules.test.ts'])(
  'salinan %s',
  (nama) => {
    it('identik antara src/lib dan functions/src', () => {
      const klien = readFileSync(join(ROOT, 'src', 'lib', nama), 'utf8');
      const server = readFileSync(join(ROOT, 'functions', 'src', nama), 'utf8');
      expect(server).toBe(klien);
    });
  }
);
