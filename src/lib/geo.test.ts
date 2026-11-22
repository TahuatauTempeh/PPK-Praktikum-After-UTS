import {
    EARTH_RADIUS_M,
    formatDistanceMeters,
    haversineMeters,
    isValidLatitude,
    isValidLongitude,
    isValidRadius,
    isWithinRadius,
} from './geo';

const LAB_A = { latitude: -7.0519, longitude: 110.4383 };
const LAB_B = { latitude: -7.0508, longitude: 110.439 };

describe('haversineMeters', () => {
    it('mengembalikan 0 untuk titik yang sama', () => {
        expect(haversineMeters(LAB_A, LAB_A)).toBe(0);
    });

    it('selisih 1 derajat lintang sekitar 111.195 m', () => {
        const distance = haversineMeters({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 });
        expect(distance).toBeCloseTo((Math.PI * EARTH_RADIUS_M) / 180, 3);
        expect(Math.abs(distance - 111_195)).toBeLessThan(1);
    });

    it('simetris: jarak A ke B sama dengan B ke A', () => {
        expect(haversineMeters(LAB_A, LAB_B)).toBeCloseTo(haversineMeters(LAB_B, LAB_A), 6);
    });

    it('LAB-A ke LAB-B sekitar 140 m (nilai acuan test vector)', () => {
        const distance = haversineMeters(LAB_A, LAB_B);
        expect(distance).toBeGreaterThan(135);
        expect(distance).toBeLessThan(150);
    });

    it('titik luar radius A sekitar 233 m dari LAB-A', () => {
        const distance = haversineMeters(LAB_A, { latitude: -7.054, longitude: 110.4383 });
        expect(Math.round(distance)).toBeGreaterThanOrEqual(232);
        expect(Math.round(distance)).toBeLessThanOrEqual(234);
    });
});

describe('isWithinRadius', () => {
    it('menerima jarak sama dengan radius', () => {
        expect(isWithinRadius(100, 100)).toBe(true);
    });
    it('menolak jarak lebih besar dari radius', () => {
        expect(isWithinRadius(100.1, 100)).toBe(false);
    });
    it('menolak nilai tidak valid', () => {
        expect(isWithinRadius(NaN, 100)).toBe(false);
        expect(isWithinRadius(-1, 100)).toBe(false);
    });
});

describe('validasi koordinat dan radius', () => {
    it('latitude', () => {
        expect(isValidLatitude(-90)).toBe(true);
        expect(isValidLatitude(90)).toBe(true);
        expect(isValidLatitude(-120)).toBe(false);
        expect(isValidLatitude(NaN)).toBe(false);
    });
    it('longitude', () => {
        expect(isValidLongitude(180)).toBe(true);
        expect(isValidLongitude(200)).toBe(false);
    });
    it('radius 10 sampai 500', () => {
        expect(isValidRadius(10)).toBe(true);
        expect(isValidRadius(500)).toBe(true);
        expect(isValidRadius(5)).toBe(false);
        expect(isValidRadius(501)).toBe(false);
    });
});

describe('formatDistanceMeters', () => {
    it('meter untuk jarak dekat', () => {
        expect(formatDistanceMeters(84.6)).toBe('85 m');
    });
    it('kilometer untuk jarak jauh', () => {
        expect(formatDistanceMeters(1250)).toBe('1,3 km');
    });
    it('tanda minus untuk nilai tidak valid', () => {
        expect(formatDistanceMeters(NaN)).toBe('-');
    });
});