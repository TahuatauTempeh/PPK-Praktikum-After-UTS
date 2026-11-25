const { buildRunJson, parseSuite } = require('./seed');

describe('seed', () => {
  it('accepts --suite=full and --suite full', () => {
    expect(parseSuite(['--suite=full'])).toBe('full');
    expect(parseSuite(['--suite', 'critical'])).toBe('critical');
    expect(parseSuite([])).toBe('critical');
  });

  it('rejects an unknown suite', () => {
    expect(() => parseSuite(['--suite=uat'])).toThrow(/Suite uat/);
  });

  it('writes critical and full flow maps', () => {
    const critical = buildRunJson({ runDate: '2026-11-25', runId: 'r1', suite: 'critical' });
    expect(critical.flows['presensi-dalam-radius']).toEqual({
      sessionId: 'e2e-session-open',
      email: 'praktikan1@test.local',
    });
    expect(Object.keys(critical.flows)).toHaveLength(3);

    const full = buildRunJson({ runDate: '2026-11-25', runId: 'r1', suite: 'full' });
    expect(full.flows['izin-lokasi-ditolak'].sessionId).toBe('e2e-session-open-accuracy');
    expect(full.flows['sesi-tanpa-lab'].email).toBe('asisten@test.local');
    expect(full.flows['izin-native'].reason).toBeTruthy();
  });
});
