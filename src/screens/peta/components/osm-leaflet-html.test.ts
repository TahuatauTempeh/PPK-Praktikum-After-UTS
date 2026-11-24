import {
  buildOsmLeafletHtml,
  parseOsmMessage,
  toOsmLabMarkers,
  type OsmMapStatePayload,
} from './osm-leaflet-html';
import type { LaboratoryMapItem } from '../selectors';

const sampleItem: LaboratoryMapItem = {
  lab: {
    id: 'lab-a',
    name: 'Lab A201',
    code: 'LAB-A',
    building: 'Gedung A',
    floor: 'Lantai 2',
    room: 'A201',
    latitude: -7.0519,
    longitude: 110.4383,
    radiusMeters: 100,
    description: '',
    isActive: true,
    createdAt: '2026-11-20T00:00:00Z',
    updatedAt: '2026-11-20T00:00:00Z',
    updatedBy: 'asisten-1',
  },
  locationLabel: 'Gedung A · Lantai 2 · A201',
  radiusLabel: '100 m',
  current: {
    id: 's1',
    title: 'Basis Data',
    className: 'IF-3A',
    date: '2026-11-23',
    dateLabel: 'Hari ini',
    startTime: '08:00',
    endTime: '09:40',
    timeRangeWib: '08.00–09.40 WIB',
    room: 'A201',
    status: 'open',
    statusLabel: 'Dibuka',
  },
  next: null,
  hasAnyActivity: true,
};

describe('toOsmLabMarkers', () => {
  it('mengonversi LaboratoryMapItem menjadi marker OpenStreetMap dengan status teks', () => {
    const markers = toOsmLabMarkers([sampleItem]);
    expect(markers).toHaveLength(1);
    expect(markers[0]).toMatchObject({
      id: 'lab-a',
      name: 'Lab A201',
      code: 'LAB-A',
      isOpen: true,
      statusText: 'Basis Data (Dibuka)',
      radiusMeters: 100,
    });
  });
});

describe('parseOsmMessage', () => {
  it('memparsing pesan ready, error, dan selectLab dengan aman', () => {
    expect(parseOsmMessage('{"type":"ready"}')).toEqual({ type: 'ready' });
    expect(parseOsmMessage('{"type":"error"}')).toEqual({ type: 'error' });
    expect(parseOsmMessage('{"type":"selectLab","labId":"lab-a"}')).toEqual({
      type: 'selectLab',
      labId: 'lab-a',
    });
    expect(parseOsmMessage({ type: 'selectLab', labId: null })).toEqual({
      type: 'selectLab',
      labId: null,
    });
  });

  it('mengembalikan null untuk payload tidak valid', () => {
    expect(parseOsmMessage('bukan json')).toBeNull();
    expect(parseOsmMessage({ type: 'unknown' })).toBeNull();
    expect(parseOsmMessage(null)).toBeNull();
  });
});

describe('buildOsmLeafletHtml', () => {
  it('menyertakan tile OpenStreetMap dan mengamankan karakter < dalam JSON', () => {
    const state: OsmMapStatePayload = {
      labs: toOsmLabMarkers([
        {
          ...sampleItem,
          lab: { ...sampleItem.lab, name: '<script>alert(1)</script>' },
        },
      ]),
      selectedLabId: 'lab-a',
      userPosition: null,
      colors: {
        primary: '#204CAC',
        success: '#23765B',
        surface: '#FFFFFF',
        text: '#192138',
        accent: '#204CAC',
      },
    };

    const html = buildOsmLeafletHtml(
      {
        latitude: -7.0519,
        longitude: 110.4383,
        latitudeDelta: 0.006,
        longitudeDelta: 0.006,
      },
      state
    );

    expect(html).toContain('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(html).not.toContain('"<script>alert(1)</script>"');
    expect(html).toContain('\\u003cscript>alert(1)\\u003c/script>');
  });

  it('memusatkan peta ke lab terpilih pada applyState pertama', () => {
    const state: OsmMapStatePayload = {
      labs: toOsmLabMarkers([sampleItem]),
      selectedLabId: 'lab-a',
      userPosition: null,
      colors: {
        primary: '#204CAC',
        success: '#23765B',
        surface: '#FFFFFF',
        text: '#192138',
        accent: '#204CAC',
      },
    };

    const html = buildOsmLeafletHtml(
      {
        latitude: -7.0519,
        longitude: 110.4383,
        latitudeDelta: 0.006,
        longitudeDelta: 0.006,
      },
      state
    );

    expect(html).toContain('var lastSelectedId = null;');
    expect(html).not.toContain('var lastSelectedId = "lab-a";');
  });
});
