import { formatPraktikumName, splitSessionTopic } from './session-format';

describe('splitSessionTopic', () => {
  it('memisahkan nomor sesi dan topik', () => {
    expect(splitSessionTopic('Sesi 03 | DOM & interaksi')).toEqual({
      number: '03',
      topic: 'DOM & interaksi',
    });
  });

  it('menerima spasi yang tidak konsisten', () => {
    expect(splitSessionTopic('Sesi 5|JOIN antartabel')).toEqual({
      number: '5',
      topic: 'JOIN antartabel',
    });
  });

  it('mempertahankan topik yang tidak memakai awalan Sesi', () => {
    expect(splitSessionTopic('Topik biasa')).toEqual({
      number: null,
      topic: 'Topik biasa',
    });
  });
});

describe('formatPraktikumName', () => {
  it('menggabungkan mata kuliah dan kode praktikum', () => {
    expect(formatPraktikumName({ course: 'Basis Data', code: 'C3' })).toBe('Basis Data C3');
  });
});
