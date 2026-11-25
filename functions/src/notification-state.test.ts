import {
  buildUpdateEvent,
  entryFromSnapshot,
  isPermissionChangeNotifiable,
  isSessionChangeNotifiable,
  normalizePermissionData,
  normalizeSessionData,
  normalizerFor,
  parseBaseline,
  removeBaselineEntry,
  serializeBaseline,
  setBaselineEntry,
  toIsoString,
} from './notification-state';

const UPDATE_TIME = {
  toDate: () => new Date('2026-11-25T01:02:03.000Z'),
};

function snapshot(data: Record<string, unknown>, updateTime = UPDATE_TIME) {
  return { data: () => data, updateTime };
}

describe('notification-state', () => {
  it('menormalkan tanggal sesi string dan Timestamp ke YYYY-MM-DD', () => {
    expect(
      normalizeSessionData({
        status: 'open',
        classId: 'class-1',
        title: 'Basis Data',
        date: '2026-11-25',
        startTime: '08:00',
        endTime: '09:40',
        room: 'Lab A201',
        laboratoryId: 'lab-a',
      })
    ).toEqual({
      status: 'open',
      classId: 'class-1',
      title: 'Basis Data',
      date: '2026-11-25',
      startTime: '08:00',
      endTime: '09:40',
      room: 'Lab A201',
      laboratoryId: 'lab-a',
    });

    expect(
      normalizeSessionData({
        date: { toDate: () => new Date('2026-11-25T17:00:00.000Z') },
      }).date
    ).toBe('2026-11-26');
  });

  it('menormalkan field izin dan reviewNote', () => {
    expect(
      normalizePermissionData({
        status: 'approved',
        userId: 'p1',
        sessionId: 'session-1',
        reviewNote: 'Disetujui',
      })
    ).toEqual({
      status: 'approved',
      userId: 'p1',
      sessionId: 'session-1',
      reviewNote: 'Disetujui',
    });

    expect(normalizePermissionData({ status: 'rejected' }).reviewNote).toBeNull();
    expect(normalizerFor('sessions')({ title: 'A' }).title).toBe('A');
    expect(normalizerFor('permissionRequests')({ status: 'pending' }).status).toBe('pending');
  });

  it('membuat baseline dari snapshot dan menyimpan updateTime', () => {
    const entry = entryFromSnapshot(
      snapshot({ status: 'scheduled', title: 'Basis Data' }),
      normalizeSessionData
    );

    expect(entry.data.status).toBe('scheduled');
    expect(entry.updateTime).toBe('2026-11-25T01:02:03.000Z');
    expect(toIsoString(undefined)).toBeNull();
    expect(toIsoString({ toDate: () => { throw new Error('rusak'); } })).toBeNull();
  });

  it('membaca baseline dan mengabaikan entri yang tidak valid', () => {
    const state = parseBaseline(
      {
        docs: {
          'session-1': {
            data: { status: 'open', title: 'Basis Data', date: '2026-11-25' },
            updateTime: '2026-11-25T01:02:03.000Z',
          },
          rusak: { data: null },
          'tanpa-data': {},
        },
      },
      normalizeSessionData
    );

    expect(Object.keys(state.docs)).toEqual(['session-1']);
    expect(state.docs['session-1'].data.status).toBe('open');
    expect(parseBaseline(null, normalizeSessionData)).toEqual({ docs: {} });
    expect(serializeBaseline(state)).toEqual({ docs: state.docs });
  });

  it('menambah dan menghapus entry baseline tanpa mengubah state lama', () => {
    const awal = { docs: {} };
    const setelahTambah = setBaselineEntry(awal, 'session-1', {
      data: { status: 'scheduled' },
      updateTime: null,
    });

    expect(awal.docs).toEqual({});
    expect(setelahTambah.docs['session-1'].data.status).toBe('scheduled');
    expect(removeBaselineEntry(setelahTambah, 'session-1')).toEqual({ docs: {} });
    expect(removeBaselineEntry(setelahTambah, 'tidak-ada')).toBe(setelahTambah);
  });

  it('membentuk event before/after dengan data yang sudah dinormalkan', () => {
    const before = {
      data: normalizeSessionData({
        status: 'scheduled',
        classId: 'class-1',
        title: 'Basis Data',
        date: '2026-11-25',
        startTime: '08:00',
        endTime: '09:40',
        room: 'A201',
      }),
      updateTime: '2026-11-25T01:00:00.000Z',
    };
    const event = buildUpdateEvent(
      before,
      snapshot({
        status: 'open',
        classId: 'class-1',
        title: 'Basis Data',
        date: '2026-11-25',
        startTime: '08:00',
        endTime: '09:40',
        room: 'A201',
      }),
      { sessionId: 'session-1' },
      normalizeSessionData
    );

    expect(event.data?.before.data()?.status).toBe('scheduled');
    expect(event.data?.after.data()?.status).toBe('open');
    expect(event.params.sessionId).toBe('session-1');
    expect(event.time).toBe('2026-11-25T01:02:03.000Z');
  });

  it('mendeteksi sesi dibuka, perubahan jadwal, dan keputusan izin', () => {
    const scheduled = normalizeSessionData({
      status: 'scheduled',
      title: 'Basis Data',
      date: '2026-11-25',
      startTime: '08:00',
      endTime: '09:40',
      room: 'A201',
    });
    const open = { ...scheduled, status: 'open' };
    const openLain = { ...open, status: 'open', room: 'A202' };
    const rescheduled = { ...open, room: 'A202' };

    expect(isSessionChangeNotifiable(scheduled, open)).toBe(true);
    expect(isSessionChangeNotifiable(open, openLain)).toBe(true);
    expect(isSessionChangeNotifiable(open, { ...open })).toBe(false);
    expect(isSessionChangeNotifiable(open, rescheduled)).toBe(true);

    expect(
      isPermissionChangeNotifiable(
        { status: 'pending' },
        { status: 'approved' }
      )
    ).toBe(true);
    expect(
      isPermissionChangeNotifiable(
        { status: 'pending' },
        { status: 'rejected' }
      )
    ).toBe(true);
    expect(
      isPermissionChangeNotifiable(
        { status: 'approved' },
        { status: 'approved' }
      )
    ).toBe(false);
  });
});
