import { expandRangeForSession, initialRecapRange } from './recap-range';

it('memakai bulan berjalan dan melebar sekali per sesi', () => {
  const range = initialRecapRange('2026-11-24');
  const first = expandRangeForSession(range, '2026-10-19', 's1', undefined);
  expect(first.range).toEqual({ start: '2026-10-19', end: '2026-11-30' });
  const second = expandRangeForSession(
    first.range,
    '2026-10-19',
    's1',
    first.seenSessionId,
  );
  expect(second.range).toBe(first.range);
});

it('tidak menimpa reset pengguna', () => {
  expect(expandRangeForSession(null, '2026-10-19', 's1', undefined).range).toBeNull();
});
