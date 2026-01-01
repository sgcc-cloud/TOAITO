import { TOTO_NUMBERS_RANGE, TOTO_DRAW_COUNT, TOTO_LOW_NUMBER_MAX, MAX_OVERLAPPING_NUMBERS } from '../constants';
import { PredictionStats, HistoricalResult } from '../types';

/**
 * Generates a unique set of random numbers within the TOTO range.
 */
export function generateRandomNumbers(count: number, min: number, max: number): number[] {
  const numbers = new Set<number>();
  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

/**
 * Calculates prediction statistics (sum, odd/even ratio, high/low ratio).
 */
export function calculatePredictionStats(numbers: number[]): PredictionStats {
  const sum = numbers.reduce((acc, num) => acc + num, 0);

  const evenCount = numbers.filter(num => num % 2 === 0).length;
  const oddCount = TOTO_DRAW_COUNT - evenCount;
  const oddEvenRatio = `${oddCount}:${evenCount}`;

  const lowCount = numbers.filter(num => num <= TOTO_LOW_NUMBER_MAX).length;
  const highCount = TOTO_DRAW_COUNT - lowCount;
  const highLowRatio = `${lowCount}:${highCount}`;

  return { sum, oddEvenRatio, highLowRatio };
}

/**
 * Formats a BigInt prize amount (in cents) into a currency string.
 */
export function formatPrizeAmount(amount: bigint): string {
  const dollars = Number(amount / 100n);
  const cents = Number(amount % 100n);
  return `$${dollars.toLocaleString('en-US')}.${cents.toString().padStart(2, '0')}`;
}

/**
 * Checks if a set of numbers adheres to the golden zone filters.
 */
export function checkGoldenZoneFilters(
  numbers: number[],
  lastDrawNumbers: number[]
): boolean {
  // Parity: 2 to 4 even numbers
  const evenCount = numbers.filter(num => num % 2 === 0).length;
  if (evenCount < 2 || evenCount > 4) return false;

  // Range: 2 to 4 low numbers (1-24)
  const lowCount = numbers.filter(num => num <= TOTO_LOW_NUMBER_MAX).length;
  if (lowCount < 2 || lowCount > 4) return false;

  // Anti-Repeat: Max 2 overlapping numbers with the most recent draw
  // Fix: Import MAX_OVERLAPPING_NUMBERS from constants
  if (lastDrawNumbers.length > 0) {
    const overlappingCount = numbers.filter(num => lastDrawNumbers.includes(num)).length;
    if (overlappingCount > MAX_OVERLAPPING_NUMBERS) return false;
  }

  return true;
}

/**
 * Calculates frequency of numbers from historical draws.
 */
export function calculateNumberFrequencies(historicalResults: HistoricalResult[]): Map<number, number> {
  const frequencies = new Map<number, number>();
  for (let i = TOTO_NUMBERS_RANGE[0]; i <= TOTO_NUMBERS_RANGE[1]; i++) {
    frequencies.set(i, 0);
  }

  historicalResults.forEach(draw => {
    draw.winning_numbers.forEach(num => {
      frequencies.set(num, (frequencies.get(num) || 0) + 1);
    });
  });
  return frequencies;
}

/**
 * Selects a random number based on weights (frequencies).
 */
export function selectWeightedRandomNumber(
  availableNumbers: number[],
  frequencies: Map<number, number>,
  maxFrequency: number
): number {
  if (availableNumbers.length === 0) {
    throw new Error("No available numbers to select from.");
  }

  let totalWeight = 0;
  const weights: { number: number; weight: number }[] = [];

  availableNumbers.forEach(num => {
    const freq = frequencies.get(num) || 0;
    // Give higher frequency numbers a proportionally higher weight.
    // Add 1 to frequency to avoid zero weight for numbers that haven't appeared.
    const weight = (freq / (maxFrequency || 1)) + 1;
    weights.push({ number: num, weight: weight });
    totalWeight += weight;
  });

  let random = Math.random() * totalWeight;
  for (const item of weights) {
    if (random < item.weight) {
      return item.number;
    }
    random -= item.weight;
  }

  // Fallback: if somehow no number was selected, pick a random one
  return availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
}