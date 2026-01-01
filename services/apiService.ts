import {
  HistoricalResult,
  Prediction,
  PredictionAccuracy,
  PredictionStats,
  PaginatedResponse,
  HitRate,
} from '../types';
import {
  API_BASE_URL,
  HOME_PAGE_RECENT_DRAWS,
  HISTORY_PAGE_LIMIT,
  TOTO_NUMBERS_RANGE,
  TOTO_DRAW_COUNT,
  TOTO_LOW_NUMBER_MAX,
  MAX_OVERLAPPING_NUMBERS,
  FREQUENCY_DRAW_COUNT,
  MONTE_CARLO_ITERATIONS
} from '../constants';
import { calculatePredictionStats, generateRandomNumbers } from '../utils/helpers';
import { generateMonteCarloPrediction } from '../utils/predictionEngine';

// Utility to simulate network delay
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data - replace with actual API calls in a real application
const MOCK_HISTORICAL_RESULTS: HistoricalResult[] = [
  { "draw_no": 4143, "date": "2025-12-29", "winning_numbers": [2, 4, 22, 24, 30, 33], "additional_number": 49, "prize_amount": 12_500_00n * 100n },
  { "draw_no": 4142, "date": "2025-12-25", "winning_numbers": [3, 8, 15, 28, 37, 43], "additional_number": 49, "prize_amount": 1_000_00n * 100n },
  { "draw_no": 4141, "date": "2025-12-22", "winning_numbers": [4, 5, 13, 22, 24, 30], "additional_number": 36, "prize_amount": 500_00n * 100n },
  { "draw_no": 4140, "date": "2025-12-18", "winning_numbers": [2, 14, 15, 30, 31, 43], "additional_number": 27, "prize_amount": 2_500_00n * 100n },
  { "draw_no": 4139, "date": "2025-12-15", "winning_numbers": [17, 21, 22, 35, 37, 42], "additional_number": 26, "prize_amount": 1_000_00n * 100n },
  { "draw_no": 4138, "date": "2025-12-11", "winning_numbers": [1, 9, 10, 20, 25, 40], "additional_number": 45, "prize_amount": 750_00n * 100n },
  { "draw_no": 4137, "date": "2025-12-08", "winning_numbers": [6, 11, 19, 23, 31, 41], "additional_number": 28, "prize_amount": 900_00n * 100n },
  { "draw_no": 4136, "date": "2025-12-04", "winning_numbers": [7, 12, 18, 26, 34, 42], "additional_number": 35, "prize_amount": 1_200_00n * 100n },
  { "draw_no": 4135, "date": "2025-12-01", "winning_numbers": [5, 13, 16, 27, 30, 39], "additional_number": 44, "prize_amount": 600_00n * 100n },
  { "draw_no": 4134, "date": "2025-11-27", "winning_numbers": [8, 14, 17, 21, 33, 38], "additional_number": 46, "prize_amount": 850_00n * 100n },
  { "draw_no": 4133, "date": "2025-11-24", "winning_numbers": [9, 15, 20, 25, 32, 47], "additional_number": 29, "prize_amount": 1_100_00n * 100n },
  { "draw_no": 4132, "date": "2025-11-20", "winning_numbers": [10, 16, 21, 28, 36, 48], "additional_number": 49, "prize_amount": 950_00n * 100n },
  { "draw_no": 4131, "date": "2025-11-17", "winning_numbers": [11, 17, 22, 29, 37, 43], "additional_number": 30, "prize_amount": 700_00n * 100n },
  { "draw_no": 4130, "date": "2025-11-13", "winning_numbers": [12, 18, 23, 30, 38, 44], "additional_number": 41, "prize_amount": 1_300_00n * 100n },
  { "draw_no": 4129, "date": "2025-11-10", "winning_numbers": [13, 19, 24, 31, 39, 45], "additional_number": 32, "prize_amount": 1_050_00n * 100n },
  { "draw_no": 4128, "date": "2025-11-06", "winning_numbers": [3, 20, 24, 29, 32, 44], "additional_number": 46, "prize_amount": 800_00n * 100n },
  { "draw_no": 4127, "date": "2025-11-03", "winning_numbers": [1, 14, 25, 27, 30, 40], "additional_number": 33, "prize_amount": 1_150_00n * 100n },
  { "draw_no": 4126, "date": "2025-10-30", "winning_numbers": [2, 15, 26, 28, 31, 41], "additional_number": 34, "prize_amount": 900_00n * 100n },
  { "draw_no": 4125, "date": "2025-10-27", "winning_numbers": [4, 16, 27, 29, 32, 42], "additional_number": 35, "prize_amount": 750_00n * 100n },
  { "draw_no": 4124, "date": "2025-10-23", "winning_numbers": [7, 14, 17, 18, 31, 38], "additional_number": 46, "prize_amount": 1_000_00n * 100n },
  { "draw_no": 4123, "date": "2025-10-20", "winning_numbers": [8, 15, 18, 19, 32, 39], "additional_number": 47, "prize_amount": 850_00n * 100n },
  { "draw_no": 4122, "date": "2025-10-16", "winning_numbers": [9, 16, 19, 20, 33, 40], "additional_number": 48, "prize_amount": 1_200_00n * 100n },
  { "draw_no": 4121, "date": "2025-10-13", "winning_numbers": [10, 17, 20, 21, 34, 41], "additional_number": 49, "prize_amount": 950_00n * 100n },
  { "draw_no": 4120, "date": "2025-10-09", "winning_numbers": [11, 18, 21, 22, 35, 42], "additional_number": 1, "prize_amount": 700_00n * 100n },
  { "draw_no": 4119, "date": "2025-10-06", "winning_numbers": [12, 19, 22, 23, 36, 43], "additional_number": 2, "prize_amount": 1_300_00n * 100n },
  { "draw_no": 4118, "date": "2025-10-02", "winning_numbers": [13, 20, 23, 24, 37, 44], "additional_number": 3, "prize_amount": 1_050_00n * 100n },
  { "draw_no": 4117, "date": "2025-09-29", "winning_numbers": [15, 16, 22, 34, 35, 43], "additional_number": 26, "prize_amount": 800_00n * 100n },
  { "draw_no": 4116, "date": "2025-09-25", "winning_numbers": [15, 22, 25, 26, 38, 45], "additional_number": 4, "prize_amount": 1_150_00n * 100n },
  { "draw_no": 4115, "date": "2025-09-22", "winning_numbers": [16, 23, 26, 27, 39, 46], "additional_number": 5, "prize_amount": 900_00n * 100n },
  { "draw_no": 4114, "date": "2025-09-18", "winning_numbers": [17, 24, 27, 28, 40, 47], "additional_number": 6, "prize_amount": 750_00n * 100n },
  { "draw_no": 4113, "date": "2025-09-15", "winning_numbers": [18, 25, 28, 29, 41, 48], "additional_number": 7, "prize_amount": 1_000_00n * 100n },
  { "draw_no": 4112, "date": "2025-09-11", "winning_numbers": [19, 26, 29, 30, 42, 49], "additional_number": 8, "prize_amount": 850_00n * 100n },
  { "draw_no": 4111, "date": "2025-09-08", "winning_numbers": [20, 27, 30, 31, 43, 1], "additional_number": 9, "prize_amount": 1_200_00n * 100n },
  { "draw_no": 4110, "date": "2025-09-04", "winning_numbers": [21, 28, 31, 32, 44, 2], "additional_number": 10, "prize_amount": 950_00n * 100n },
  { "draw_no": 4109, "date": "2025-09-01", "winning_numbers": [22, 29, 32, 33, 45, 3], "additional_number": 11, "prize_amount": 700_00n * 100n },
  { "draw_no": 4108, "date": "2025-08-28", "winning_numbers": [10, 11, 16, 24, 34, 35], "additional_number": 1, "prize_amount": 1_300_00n * 100n },
  { "draw_no": 4107, "date": "2025-08-25", "winning_numbers": [24, 31, 34, 35, 47, 5], "additional_number": 13, "prize_amount": 1_050_00n * 100n },
  { "draw_no": 4106, "date": "2025-08-21", "winning_numbers": [25, 32, 35, 36, 48, 6], "additional_number": 14, "prize_amount": 800_00n * 100n },
  { "draw_no": 4105, "date": "2025-08-18", "winning_numbers": [26, 33, 36, 37, 49, 7], "additional_number": 15, "prize_amount": 1_150_00n * 100n },
  { "draw_no": 4104, "date": "2025-08-14", "winning_numbers": [27, 34, 37, 38, 1, 8], "additional_number": 16, "prize_amount": 900_00n * 100n },
  { "draw_no": 4103, "date": "2025-08-11", "winning_numbers": [28, 35, 38, 39, 2, 9], "additional_number": 17, "prize_amount": 750_00n * 100n },
  { "draw_no": 4102, "date": "2025-08-07", "winning_numbers": [29, 36, 39, 40, 3, 10], "additional_number": 18, "prize_amount": 1_000_00n * 100n },
  { "draw_no": 4101, "date": "2025-08-04", "winning_numbers": [30, 37, 40, 41, 4, 11], "additional_number": 19, "prize_amount": 850_00n * 100n },
  { "draw_no": 4100, "date": "2025-07-31", "winning_numbers": [31, 38, 41, 42, 5, 12], "additional_number": 20, "prize_amount": 1_200_00n * 100n },
  { "draw_no": 4099, "date": "2025-07-28", "winning_numbers": [2, 14, 16, 21, 36, 47], "additional_number": 39, "prize_amount": 950_00n * 100n },
  { "draw_no": 4098, "date": "2025-07-24", "winning_numbers": [33, 40, 43, 44, 7, 14], "additional_number": 22, "prize_amount": 700_00n * 100n },
  { "draw_no": 4097, "date": "2025-07-21", "winning_numbers": [34, 41, 44, 45, 8, 15], "additional_number": 23, "prize_amount": 1_300_00n * 100n },
  { "draw_no": 4096, "date": "2025-07-17", "winning_numbers": [35, 42, 45, 46, 9, 16], "additional_number": 24, "prize_amount": 1_050_00n * 100n },
  { "draw_no": 4095, "date": "2025-07-14", "winning_numbers": [36, 43, 46, 47, 10, 17], "additional_number": 25, "prize_amount": 800_00n * 100n },
  { "draw_no": 4094, "date": "2025-07-10", "winning_numbers": [37, 44, 47, 48, 11, 18], "additional_number": 26, "prize_amount": 1_150_00n * 100n },
  { "draw_no": 4093, "date": "2025-07-07", "winning_numbers": [38, 45, 48, 49, 12, 19], "additional_number": 27, "prize_amount": 900_00n * 100n },
  { "draw_no": 4092, "date": "2025-07-03", "winning_numbers": [39, 46, 49, 1, 13, 20], "additional_number": 28, "prize_amount": 750_00n * 100n },
  { "draw_no": 4091, "date": "2025-06-30", "winning_numbers": [40, 47, 1, 2, 14, 21], "additional_number": 29, "prize_amount": 1_000_00n * 100n },
  { "draw_no": 4090, "date": "2025-06-26", "winning_numbers": [41, 48, 2, 3, 15, 22], "additional_number": 30, "prize_amount": 850_00n * 100n },
  { "draw_no": 4089, "date": "2025-06-23", "winning_numbers": [42, 49, 3, 4, 16, 23], "additional_number": 31, "prize_amount": 1_200_00n * 100n },
  { "draw_no": 4088, "date": "2025-06-19", "winning_numbers": [43, 1, 4, 5, 17, 24], "additional_number": 32, "prize_amount": 950_00n * 100n },
  { "draw_no": 4087, "date": "2025-06-16", "winning_numbers": [44, 2, 5, 6, 18, 25], "additional_number": 33, "prize_amount": 700_00n * 100n },
  { "draw_no": 4086, "date": "2025-06-12", "winning_numbers": [45, 3, 6, 7, 19, 26], "additional_number": 34, "prize_amount": 1_300_00n * 100n },
  { "draw_no": 4085, "date": "2025-06-09", "winning_numbers": [46, 4, 7, 8, 20, 27], "additional_number": 35, "prize_amount": 1_050_00n * 100n },
  { "draw_no": 4084, "date": "2025-06-05", "winning_numbers": [47, 5, 8, 9, 21, 28], "additional_number": 36, "prize_amount": 800_00n * 100n },
  { "draw_no": 4083, "date": "2025-06-02", "winning_numbers": [48, 6, 9, 10, 22, 29], "additional_number": 37, "prize_amount": 1_150_00n * 100n },
  { "draw_no": 4082, "date": "2025-05-29", "winning_numbers": [49, 7, 10, 11, 23, 30], "additional_number": 38, "prize_amount": 900_00n * 100n },
  { "draw_no": 4081, "date": "2025-05-26", "winning_numbers": [1, 8, 11, 12, 24, 31], "additional_number": 39, "prize_amount": 750_00n * 100n },
  { "draw_no": 4080, "date": "2025-05-22", "winning_numbers": [2, 9, 12, 13, 25, 32], "additional_number": 40, "prize_amount": 1_000_00n * 100n },
  { "draw_no": 4079, "date": "2025-05-19", "winning_numbers": [3, 10, 13, 14, 26, 33], "additional_number": 41, "prize_amount": 850_00n * 100n },
  { "draw_no": 4078, "date": "2025-05-15", "winning_numbers": [4, 11, 14, 15, 27, 34], "additional_number": 42, "prize_amount": 1_200_00n * 100n },
  { "draw_no": 4077, "date": "2025-05-12", "winning_numbers": [5, 12, 15, 16, 28, 35], "additional_number": 43, "prize_amount": 950_00n * 100n },
  { "draw_no": 4076, "date": "2025-05-08", "winning_numbers": [6, 13, 16, 17, 29, 36], "additional_number": 44, "prize_amount": 700_00n * 100n },
  { "draw_no": 4075, "date": "2025-05-05", "winning_numbers": [7, 14, 17, 18, 30, 37], "additional_number": 45, "prize_amount": 1_300_00n * 100n },
  { "draw_no": 4074, "date": "2025-05-01", "winning_numbers": [8, 15, 18, 19, 31, 38], "additional_number": 46, "prize_amount": 1_050_00n * 100n },
  { "draw_no": 4073, "date": "2025-04-28", "winning_numbers": [9, 16, 19, 20, 32, 39], "additional_number": 47, "prize_amount": 800_00n * 100n },
  { "draw_no": 4072, "date": "2025-04-24", "winning_numbers": [10, 17, 20, 21, 33, 40], "additional_number": 48, "prize_amount": 1_150_00n * 100n },
  { "draw_no": 4071, "date": "2025-04-21", "winning_numbers": [11, 18, 21, 22, 34, 41], "additional_number": 49, "prize_amount": 900_00n * 100n },
  { "draw_no": 4070, "date": "2025-04-17", "winning_numbers": [12, 19, 22, 23, 35, 42], "additional_number": 1, "prize_amount": 750_00n * 100n },
  { "draw_no": 4069, "date": "2025-04-14", "winning_numbers": [13, 20, 23, 24, 36, 43], "additional_number": 2, "prize_amount": 1_000_00n * 100n },
  { "draw_no": 4068, "date": "2025-04-10", "winning_numbers": [14, 21, 24, 25, 37, 44], "additional_number": 3, "prize_amount": 850_00n * 100n },
  { "draw_no": 4067, "date": "2025-04-07", "winning_numbers": [15, 22, 25, 26, 38, 45], "additional_number": 4, "prize_amount": 1_200_00n * 100n },
  { "draw_no": 4066, "date": "2025-04-03", "winning_numbers": [16, 23, 26, 27, 39, 46], "additional_number": 5, "prize_amount": 950_00n * 100n },
  { "draw_no": 4065, "date": "2025-03-31", "winning_numbers": [17, 24, 27, 28, 40, 47], "additional_number": 6, "prize_amount": 700_00n * 100n },
  { "draw_no": 4064, "date": "2025-03-27", "winning_numbers": [18, 25, 28, 29, 41, 48], "additional_number": 7, "prize_amount": 1_300_00n * 100n },
  { "draw_no": 4063, "date": "2025-03-24", "winning_numbers": [19, 26, 29, 30, 42, 49], "additional_number": 8, "prize_amount": 1_050_00n * 100n },
  { "draw_no": 4062, "date": "2025-03-20", "winning_numbers": [20, 27, 30, 31, 43, 1], "additional_number": 9, "prize_amount": 800_00n * 100n },
  { "draw_no": 4061, "date": "2025-03-17", "winning_numbers": [21, 28, 31, 32, 44, 2], "additional_number": 10, "prize_amount": 1_150_00n * 100n },
  { "draw_no": 4060, "date": "2025-03-13", "winning_numbers": [22, 29, 32, 33, 45, 3], "additional_number": 11, "prize_amount": 900_00n * 100n },
  { "draw_no": 4059, "date": "2025-03-10", "winning_numbers": [23, 30, 33, 34, 46, 4], "additional_number": 12, "prize_amount": 750_00n * 100n },
  { "draw_no": 4058, "date": "2025-03-06", "winning_numbers": [24, 31, 34, 35, 47, 5], "additional_number": 13, "prize_amount": 1_000_00n * 100n },
  { "draw_no": 4057, "date": "2025-03-03", "winning_numbers": [25, 32, 35, 36, 48, 6], "additional_number": 14, "prize_amount": 850_00n * 100n },
  { "draw_no": 4056, "date": "2025-02-27", "winning_numbers": [26, 33, 36, 37, 49, 7], "additional_number": 15, "prize_amount": 1_200_00n * 100n },
  { "draw_no": 4055, "date": "2025-02-24", "winning_numbers": [27, 34, 37, 38, 1, 8], "additional_number": 16, "prize_amount": 950_00n * 100n },
  { "draw_no": 4054, "date": "2025-02-20", "winning_numbers": [28, 35, 38, 39, 2, 9], "additional_number": 17, "prize_amount": 700_00n * 100n },
  { "draw_no": 4053, "date": "2025-02-17", "winning_numbers": [29, 36, 39, 40, 3, 10], "additional_number": 18, "prize_amount": 1_300_00n * 100n },
  { "draw_no": 4052, "date": "2025-02-13", "winning_numbers": [30, 37, 40, 41, 4, 11], "additional_number": 19, "prize_amount": 1_050_00n * 100n },
  { "draw_no": 4051, "date": "2025-02-10", "winning_numbers": [31, 38, 41, 42, 5, 12], "additional_number": 20, "prize_amount": 800_00n * 100n },
  { "draw_no": 4050, "date": "2025-02-07", "winning_numbers": [16, 18, 22, 23, 28, 35], "additional_number": 32, "prize_amount": 1_150_00n * 100n },
  { "draw_no": 4049, "date": "2025-02-03", "winning_numbers": [33, 40, 43, 44, 7, 14], "additional_number": 22, "prize_amount": 900_00n * 100n },
  { "draw_no": 4048, "date": "2025-01-30", "winning_numbers": [34, 41, 44, 45, 8, 15], "additional_number": 23, "prize_amount": 750_00n * 100n },
  { "draw_no": 4047, "date": "2025-01-27", "winning_numbers": [35, 42, 45, 46, 9, 16], "additional_number": 24, "prize_amount": 1_000_00n * 100n },
  { "draw_no": 4046, "date": "2025-01-23", "winning_numbers": [36, 43, 46, 47, 10, 17], "additional_number": 25, "prize_amount": 850_00n * 100n },
  { "draw_no": 4045, "date": "2025-01-20", "winning_numbers": [37, 44, 47, 48, 11, 18], "additional_number": 26, "prize_amount": 1_200_00n * 100n },
  { "draw_no": 4044, "date": "2025-01-16", "winning_numbers": [38, 45, 48, 49, 12, 19], "additional_number": 27, "prize_amount": 950_00n * 100n },
  { "draw_no": 4043, "date": "2025-01-13", "winning_numbers": [39, 46, 49, 1, 13, 20], "additional_number": 28, "prize_amount": 700_00n * 100n },
  { "draw_no": 4042, "date": "2025-01-09", "winning_numbers": [40, 47, 1, 2, 14, 21], "additional_number": 29, "prize_amount": 1_300_00n * 100n },
  { "draw_no": 4041, "date": "2025-01-06", "winning_numbers": [41, 48, 2, 3, 15, 22], "additional_number": 30, "prize_amount": 1_050_00n * 100n },
  { "draw_no": 4040, "date": "2025-01-02", "winning_numbers": [42, 49, 3, 4, 16, 23], "additional_number": 31, "prize_amount": 800_00n * 100n },
  { "draw_no": 3950, "date": "2024-02-23", "winning_numbers": [18, 21, 26, 35, 38, 43], "additional_number": 40, "prize_amount": 5_000_00n * 100n }
].sort((a, b) => b.draw_no - a.draw_no); // Sort by draw_no descending

let mockPredictions: Prediction[] = [];
let mockPredictionAccuracies: PredictionAccuracy[] = [];

// Helper to generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

/**
 * Mocks fetching the latest TOTO draw results.
 * In a real app, this would hit `/api/results/latest`.
 */
export async function fetchLatestResults(): Promise<HistoricalResult[]> {
  await simulateDelay(500);
  return MOCK_HISTORICAL_RESULTS.slice(0, HOME_PAGE_RECENT_DRAWS);
}

/**
 * Mocks fetching historical TOTO draw results with pagination.
 * In a real app, this would hit `/api/results/history?page=${page}&limit=${limit}`.
 */
export async function fetchHistoricalResults(
  page: number,
  limit: number,
): Promise<PaginatedResponse<HistoricalResult>> {
  await simulateDelay(700);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const data = MOCK_HISTORICAL_RESULTS.slice(startIndex, endIndex);

  return {
    data,
    total: MOCK_HISTORICAL_RESULTS.length,
    page,
    limit,
  };
}

/**
 * Mocks syncing latest results from Singapore Pools.
 * In a real app, this would hit `/api/results/sync` which would then use Google Search grounding.
 */
export async function syncResults(): Promise<{ message: string; syncedCount: number }> {
  await simulateDelay(1500);
  // In a real application, this would involve a backend call to an endpoint
  // that uses the Google Gemini API with the 'googleSearch' tool to scrape/fetch
  // the latest 10000 draws from Singapore Pools.
  // Example:
  // const response = await fetch(`${API_BASE_URL}/results/sync`, { method: 'POST' });
  // const data = await response.json();
  // return data;

  // Simulate adding some new results or updating existing ones for frontend mock
  const newDrawsCount = Math.floor(Math.random() * 5) + 1; // 1 to 5 new draws
  // To keep the mock simple, we just pretend new data came in, no actual modification to MOCK_HISTORICAL_RESULTS here
  // would be visible without re-generating the mock list itself.
  console.log(`Simulating sync, adding ${newDrawsCount} new draws. (A real implementation would use Google Search via a backend proxy to update results.)`);
  return { message: `Successfully simulated sync of ${newDrawsCount} new results. (Powered by simulated Google Search)`, syncedCount: newDrawsCount };
}

/**
 * Mocks generating an AI-optimized prediction using Monte Carlo simulation.
 * In a real app, this would hit `/api/predictions/generate`.
 */
export async function generatePrediction(): Promise<Prediction> {
  await simulateDelay(2000); // Simulate longer processing time for AI

  const recentDraws = MOCK_HISTORICAL_RESULTS.slice(0, FREQUENCY_DRAW_COUNT);
  const lastDrawNumbers = MOCK_HISTORICAL_RESULTS[0]?.winning_numbers || [];

  const { numbers, stats, confidenceScore } = generateMonteCarloPrediction(lastDrawNumbers, recentDraws);

  const newPrediction: Prediction = {
    id: generateId(),
    numbers: numbers,
    stats: stats,
    confidenceScore: confidenceScore, // Include the new confidence score
    timestamp: new Date().toISOString(),
  };

  mockPredictions.unshift(newPrediction); // Add to the beginning

  // Simulate tracking accuracy for this prediction against some recent draws
  const randomDrawIndex = Math.floor(Math.random() * 5); // Pick a recent draw to 'match' against
  const matchedDraw = MOCK_HISTORICAL_RESULTS[randomDrawIndex];

  let matchCount = 0;
  newPrediction.numbers.forEach(num => {
    if (matchedDraw.winning_numbers.includes(num)) {
      matchCount++;
    }
  });
  const additionalMatch = newPrediction.numbers.includes(matchedDraw.additional_number);

  let accuracyLabel = `Hit ${matchCount}`;
  if (additionalMatch) {
    accuracyLabel += ' + Add';
  } else if (matchCount === 0) {
    accuracyLabel = 'No Match';
  }

  mockPredictionAccuracies.unshift({
    prediction_id: newPrediction.id,
    draw_number: matchedDraw.draw_no,
    match_count: matchCount,
    additional_match: additionalMatch,
    accuracyLabel: accuracyLabel,
  });

  // Keep only a reasonable number of mock predictions/accuracies
  mockPredictions = mockPredictions.slice(0, 10);
  mockPredictionAccuracies = mockPredictionAccuracies.slice(0, 20); // Keep more accuracies for better stats

  return newPrediction;
}

/**
 * Mocks fetching prediction accuracy statistics.
 * In a real app, this would hit `/api/predictions/accuracy`.
 */
export async function fetchAccuracyStats(): Promise<HitRate[]> {
  await simulateDelay(600);

  const totalPredictions = mockPredictionAccuracies.length;
  if (totalPredictions === 0) {
    return [
      { label: 'Hit 3+', count: 0, percentage: '0%' },
      { label: 'Hit 4+', count: 0, percentage: '0%' },
      { label: 'Hit 5+', count: 0, percentage: '0%' },
      { label: 'Hit 6', count: 0, percentage: '0%' },
    ];
  }

  const hit3Plus = mockPredictionAccuracies.filter(p => p.match_count >= 3).length;
  const hit4Plus = mockPredictionAccuracies.filter(p => p.match_count >= 4).length;
  const hit5Plus = mockPredictionAccuracies.filter(p => p.match_count >= 5).length;
  const hit6 = mockPredictionAccuracies.filter(p => p.match_count === 6).length;

  const calculatePercentage = (count: number) =>
    ((count / totalPredictions) * 100).toFixed(1) + '%';

  return [
    { label: 'Hit 3+', count: hit3Plus, percentage: calculatePercentage(hit3Plus) },
    { label: 'Hit 4+', count: hit4Plus, percentage: calculatePercentage(hit4Plus) },
    { label: 'Hit 5+', count: hit5Plus, percentage: calculatePercentage(hit5Plus) },
    { label: 'Hit 6', count: hit6, percentage: calculatePercentage(hit6) },
  ];
}