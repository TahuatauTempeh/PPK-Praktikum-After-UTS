import {
    getLaboratoryFieldErrors,
    parseCoordinate,
    validateLaboratoryInput,
} from './laboratory-validation';

const VALID = {
    name: 'Lab A201',
    code: 'LAB-A',
    building: 'Gedung A',
    floor: 'Lantai 2',
    room: 'A201',
    latitude: -7.0519,
    longitude: 110.4383,
    radiusMeters: 100,
    description: 'Lab utama',
};

describe('getLaboratoryFieldErrors', () => {
    it('menerima input valid', () => {
        expect(getLaboratoryFieldErrors(VALID)).toEqual({});
    });

    it('UAT-LAB-02: menolak latitude -120, longitude 200, dan radius 5', () => {
        const errors = getLaboratoryFieldErrors({
            ...VALID,
            latitude: -120,
            longitude: 200,
            radiusMeters: 5,
        });
        expect(Object.keys(errors).sort()).toEqual(['latitude', 'longitude', 'radiusMeters']);
    });

    it('menolak field wajib yang kosong dan teks terlalu panjang', () => {
        const errors = getLaboratoryFieldErrors({
            ...VALID,
            name: '   ',
            code: 'X'.repeat(21),
            description: 'D'.repeat(201),
        });
        expect(errors.name).toBe('Nama wajib diisi.');
        expect(errors.code).toBe('Kode maksimal 20 karakter.');
        expect(errors.description).toBe('Deskripsi maksimal 200 karakter.');
    });

    it('lantai dan deskripsi boleh kosong', () => {
        expect(getLaboratoryFieldErrors({ ...VALID, floor: '', description: '' })).toEqual({});
    });

    it('menolak koordinat NaN dari teks kosong', () => {
        const errors = getLaboratoryFieldErrors({ ...VALID, latitude: parseCoordinate('') });
        expect(errors.latitude).toBeDefined();
    });
});

describe('validateLaboratoryInput', () => {
    it('melempar pesan field pertama yang gagal', () => {
        expect(() => validateLaboratoryInput({ ...VALID, name: '' })).toThrow('Nama wajib diisi.');
    });

    it('mengembalikan input yang sudah di-trim', () => {
        expect(validateLaboratoryInput({ ...VALID, name: '  Lab A201  ' }).name).toBe('Lab A201');
    });
});

describe('parseCoordinate', () => {
    it('menerima koma desimal', () => {
        expect(parseCoordinate('-7,0519')).toBeCloseTo(-7.0519, 6);
    });
    it('teks kosong menjadi NaN', () => {
        expect(parseCoordinate('  ')).toBeNaN();
    });
    it('teks bukan angka menjadi NaN', () => {
        expect(parseCoordinate('abc')).toBeNaN();
    });
});
