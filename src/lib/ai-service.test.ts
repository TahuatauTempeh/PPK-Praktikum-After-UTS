import { createSentimentClassifier, type SentimentPrediction } from '../../ai/sentiment';

import { analisisSentimen } from './ai-service';

jest.mock('../../ai/sentiment', () => ({
  createSentimentClassifier: jest.fn(),
}));

jest.mock('../../ai/model-edom.json', () => ({ schema_version: 1 }));

const createClassifierMock = jest.mocked(createSentimentClassifier);

const hasilPositif: SentimentPrediction = {
  label: 'positif',
  status: 'predicted',
  scores: [2, 1, 0],
  scoreType: 'decision_margin',
  experimental: true,
};

describe('analisisSentimen', () => {
  beforeAll(() => {
    createClassifierMock.mockReturnValue((text: string): SentimentPrediction => {
      if (text === 'tanpa-hasil') {
        return {
          label: null,
          status: 'unknown_vocabulary',
          scores: null,
          scoreType: 'none',
          experimental: true,
        };
      }
      if (text === 'melempar') {
        throw new Error('model gagal');
      }
      return hasilPositif;
    });
  });

  it('mengembalikan label dan confidence dari skor model', async () => {
    const hasil = await analisisSentimen('teks yang jelas');

    expect(hasil.label).toBe('positif');
    expect(hasil.confidence).toBeCloseTo(0.67, 2);
  });

  it('mengembalikan null saat model tidak menemukan kata yang dikenal', async () => {
    await expect(analisisSentimen('tanpa-hasil')).resolves.toEqual({
      label: null,
      confidence: null,
    });
  });

  it('mengembalikan null dan tidak melempar saat model gagal', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(analisisSentimen('melempar')).resolves.toEqual({
      label: null,
      confidence: null,
    });
  });

  it('mengembalikan null saat batas waktu habis', async () => {
    await expect(analisisSentimen('teks yang jelas', 0)).resolves.toEqual({
      label: null,
      confidence: null,
    });
  });
});
