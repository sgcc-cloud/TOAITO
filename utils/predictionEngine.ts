import {
  TOTO_NUMBERS_RANGE,
  TOTO_DRAW_COUNT,
  MONTE_CARLO_ITERATIONS,
  FREQUENCY_DRAW_COUNT
} from '../constants';
import {
  calculatePredictionStats,
  checkGoldenZoneFilters,
  calculateNumberFrequencies,
  selectWeightedRandomNumber
} from './helpers';
import { HistoricalResult, Prediction, PredictionStats } from '../types';

interface MonteCarloPredictionResult {
  numbers: number[];
  stats: PredictionStats;
  score: number; // For internal tracking in Monte Carlo
}

/**
 * Generates an AI-optimized TOTO prediction using Monte Carlo simulation and Golden Zone filters.
 * Returns the numbers, stats, and a confidence score based on the proportion of valid simulations.
 */
export function generateMonteCarloPrediction(
  lastDrawNumbers: number[],
  allHistoricalResults: HistoricalResult[]
): { numbers: number[]; stats: PredictionStats; confidenceScore: number } { // Updated return type

  const candidatePredictions: MonteCarloPredictionResult[] = [];
  const numbersToAnalyze = allHistoricalResults.slice(0, FREQUENCY_DRAW_COUNT);
  const frequencies = calculateNumberFrequencies(numbersToAnalyze);
  const maxFrequency = Math.max(...Array.from(frequencies.values()));

  let validPredictionCount = 0; // Track valid predictions for confidence score

  for (let i = 0; i < MONTE_CARLO_ITERATIONS; i++) {
    let candidateNumbers: number[] = [];
    const availableNumbers = Array.from({ length: TOTO_NUMBERS_RANGE[1] }, (_, i) => i + TOTO_NUMBERS_RANGE[0]);
    let tempAvailable = [...availableNumbers];

    for (let k = 0; k < TOTO_DRAW_COUNT; k++) {
        // Select a number using weighted random selection
        const selected = selectWeightedRandomNumber(tempAvailable, frequencies, maxFrequency);
        candidateNumbers.push(selected);
        // Remove the selected number from available numbers for the current draw to ensure uniqueness
        tempAvailable = tempAvailable.filter(n => n !== selected);
    }

    candidateNumbers.sort((a, b) => a - b);

    if (checkGoldenZoneFilters(candidateNumbers, lastDrawNumbers)) {
      const stats = calculatePredictionStats(candidateNumbers);
      candidatePredictions.push({ numbers: candidateNumbers, stats: stats, score: 1 }); // Score can be refined later
      validPredictionCount++; // Increment count for valid predictions
    }
  }

  // Calculate confidence score
  const confidenceScore = validPredictionCount / MONTE_CARLO_ITERATIONS;

  if (candidatePredictions.length === 0) {
    // Fallback if no predictions meet the criteria after many iterations
    // This should ideally not happen with 10k iterations and realistic filters
    console.warn("No Monte Carlo predictions met criteria. Generating a random one.");
    let fallbackNumbers: number[];
    do {
      fallbackNumbers = [];
      const availableNumbers = Array.from({ length: TOTO_NUMBERS_RANGE[1] }, (_, i) => i + TOTO_NUMBERS_RANGE[0]);
      for (let k = 0; k < TOTO_DRAW_COUNT; k++) {
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        fallbackNumbers.push(availableNumbers[randomIndex]);
        availableNumbers.splice(randomIndex, 1);
      }
      fallbackNumbers.sort((a, b) => a - b);
    } while (!checkGoldenZoneFilters(fallbackNumbers, lastDrawNumbers)); // Ensure fallback is also valid

    return {
      numbers: fallbackNumbers,
      stats: calculatePredictionStats(fallbackNumbers),
      confidenceScore: 0 // No valid predictions found, so confidence is 0
    };
  }

  // For simplicity, pick one of the valid candidates (e.g., the first one).
  // In a more sophisticated engine, you might analyze the distribution of valid candidates
  // and pick one based on further criteria or a meta-score.
  const bestPrediction = candidatePredictions[0];

  return {
    numbers: bestPrediction.numbers,
    stats: bestPrediction.stats,
    confidenceScore: confidenceScore // Return the calculated confidence score
  };
}