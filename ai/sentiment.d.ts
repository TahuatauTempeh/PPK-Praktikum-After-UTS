// Tipe untuk sentiment.js. Isi sentiment.js dibiarkan sama persis dengan paket model-edom.zip.

export type SentimentLabel = 'negatif' | 'netral' | 'positif';

export interface SentimentPrediction {
  label: SentimentLabel | null;
  status: 'predicted' | 'unknown_vocabulary' | 'empty_input';
  /** Skor mentah per label, urutannya sama dengan model.labels. Bukan probabilitas. */
  scores: number[] | null;
  scoreType: 'decision_margin' | 'log_score' | 'none';
  experimental: boolean;
}

export function createSentimentClassifier(model: object): (text: string) => SentimentPrediction;
