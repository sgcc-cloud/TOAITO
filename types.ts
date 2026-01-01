export interface HistoricalResult {
  draw_no: number;
  date: string; // YYYY-MM-DD
  winning_numbers: number[];
  additional_number: number;
  prize_amount: bigint; // Stored in cents, e.g., 1_000_000_00 for $10,000.00
}

export interface PredictionStats {
  sum: number;
  oddEvenRatio: string; // e.g., "3:3"
  highLowRatio: string; // e.g., "3:3" (1-24 are low, 25-49 are high)
}

export interface Prediction {
  id: string; // Unique ID for prediction
  numbers: number[];
  stats: PredictionStats;
  timestamp: string; // ISO string
  confidenceScore?: number; // Added confidence score
}

export interface PredictionAccuracy {
  prediction_id: string;
  draw_number: number;
  match_count: number; // How many numbers matched (0-6)
  additional_match: boolean;
  accuracyLabel: string; // e.g., "Hit 3", "Hit 4 + Add"
}

export interface HitRate {
  label: string;
  count: number;
  percentage: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export enum DrawSource {
  WINNING = 'winning',
  ADDITIONAL = 'additional',
  PREDICTION = 'prediction'
}