import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  fetchLatestResults,
  generatePrediction,
  fetchAccuracyStats,
  syncResults,
} from '../services/apiService';
import NumberBall from '../components/NumberBall';
import LoadingSpinner from '../components/LoadingSpinner';
import { HistoricalResult, Prediction, DrawSource } from '../types';
import { formatPrizeAmount } from '../utils/helpers';
import {
  FADE_IN_ANIMATION_DURATION,
  BALL_ANIMATION_DELAY_STEP,
  MONTE_CARLO_ITERATIONS,
  MAX_OVERLAPPING_NUMBERS,
  FREQUENCY_DRAW_COUNT,
  TOTO_LOW_NUMBER_MAX
} from '../constants';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const HomePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [latestPrediction, setLatestPrediction] = useState<Prediction | null>(null);

  const {
    data: latestDraws,
    isLoading: isLoadingLatestDraws,
    error: latestDrawsError,
    refetch: refetchLatestDraws,
  } = useQuery<HistoricalResult[], Error>({
    queryKey: ['latestDraws'],
    queryFn: fetchLatestResults,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const {
    data: accuracyStats,
    isLoading: isLoadingAccuracyStats,
    error: accuracyStatsError,
  } = useQuery({
    queryKey: ['accuracyStats'],
    queryFn: fetchAccuracyStats,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const generatePredictionMutation = useMutation<Prediction, Error>({
    mutationFn: generatePrediction,
    onSuccess: (data) => {
      setLatestPrediction(data);
      queryClient.invalidateQueries({ queryKey: ['accuracyStats'] }); // Invalidate accuracy stats after new prediction
      queryClient.invalidateQueries({ queryKey: ['latestDraws'] }); // Also invalidate draws as new predictions might rely on the "latest"
    },
    onError: (error) => {
      console.error('Error generating prediction:', error);
      alert(`Failed to generate prediction: ${error.message}`);
    },
  });

  const syncResultsMutation = useMutation<
    { message: string; syncedCount: number },
    Error
  >({
    mutationFn: syncResults,
    onSuccess: (data) => {
      alert(data.message);
      queryClient.invalidateQueries({ queryKey: ['latestDraws'] });
      queryClient.invalidateQueries({ queryKey: ['historicalResults'] }); // Invalidate history page data too
    },
    onError: (error) => {
      console.error('Error syncing results:', error);
      alert(`Failed to sync results: ${error.message}`);
    },
  });

  const currentLatestDraw = latestDraws && latestDraws.length > 0 ? latestDraws[0] : null;

  const handleGeneratePrediction = useCallback(() => {
    generatePredictionMutation.mutate();
  }, [generatePredictionMutation]);

  const handleSyncResults = useCallback(() => {
    syncResultsMutation.mutate();
  }, [syncResultsMutation]);


  const getAccuracyChartData = () => {
    if (!accuracyStats || accuracyStats.length === 0) {
      return {
        labels: [],
        datasets: [{ data: [], backgroundColor: [], hoverOffset: 4 }],
      };
    }

    const labels = accuracyStats.map(stat => stat.label);
    const data = accuracyStats.map(stat => stat.count);
    const backgroundColors = [
      'rgba(75, 192, 192, 0.6)', // Hit 3+ (Teal)
      'rgba(54, 162, 235, 0.6)', // Hit 4+ (Blue)
      'rgba(153, 102, 255, 0.6)',// Hit 5+ (Purple)
      'rgba(255, 99, 132, 0.6)', // Hit 6 (Red)
    ];

    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          hoverOffset: 4,
          borderColor: '#ffffff',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#e0e0e0', // Light grey for legend text
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              const total = context.dataset.data.reduce((sum: number, value: number) => sum + value, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1) + '%';
              label += `${context.parsed} (${percentage})`;
            }
            return label;
          }
        }
      }
    },
  };


  if (isLoadingLatestDraws) {
    return <LoadingSpinner message="Fetching latest draw results..." className="mt-20" />;
  }

  if (latestDrawsError) {
    return (
      <div className="text-red-400 text-center mt-20 p-4 bg-red-900/30 rounded-lg">
        Error loading latest draws: {latestDrawsError.message}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20"> {/* Add padding-bottom for fixed action bar */}
      {/* Hero Section: Latest Results */}
      {currentLatestDraw && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: FADE_IN_ANIMATION_DURATION }}
          className="bg-gradient-to-br from-indigo-800 to-blue-700 p-6 md:p-8 rounded-3xl shadow-2xl text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10 bg-[url('https://picsum.photos/1200/400')] bg-cover bg-center mix-blend-overlay"></div>
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-lg">
              Latest TOTO Draw Results
            </h1>
            <p className="text-xl md:text-2xl text-indigo-200 mb-6">
              Draw No. {currentLatestDraw.draw_no} - {format(new Date(currentLatestDraw.date), 'dd MMMM yyyy')}
            </p>
            <div className="flex justify-center flex-wrap gap-3 md:gap-4 mb-6">
              {currentLatestDraw.winning_numbers.map((num, index) => (
                <NumberBall key={num} number={num} delay={index * BALL_ANIMATION_DELAY_STEP} source={DrawSource.WINNING} />
              ))}
              <span className="flex items-center text-3xl font-bold mx-2 md:mx-4 text-white">+</span>
              <NumberBall
                key={currentLatestDraw.additional_number}
                number={currentLatestDraw.additional_number}
                delay={currentLatestDraw.winning_numbers.length * BALL_ANIMATION_DELAY_STEP}
                source={DrawSource.ADDITIONAL}
              />
            </div>
            <p className="text-3xl md:text-4xl font-bold text-yellow-200 drop-shadow-md">
              Estimated Prize: {formatPrizeAmount(currentLatestDraw.prize_amount)}
            </p>
          </div>
        </motion.section>
      )}

      {/* Middle Section: Latest Prediction & Accuracy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Latest Prediction Display */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: FADE_IN_ANIMATION_DURATION, delay: 0.2 }}
          className="bg-gray-800/70 p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center"
        >
          <h2 className="text-2xl font-bold mb-4 text-indigo-300">Your Latest Smart Prediction</h2>
          {generatePredictionMutation.isLoading ? (
            <LoadingSpinner message="Generating smart prediction..." className="py-10" />
          ) : latestPrediction ? (
            <div className="flex flex-col items-center">
              <div className="flex flex-wrap gap-3 md:gap-4 mb-4">
                {latestPrediction.numbers.map((num, index) => (
                  <NumberBall key={num} number={num} delay={index * BALL_ANIMATION_DELAY_STEP} source={DrawSource.PREDICTION} />
                ))}
              </div>
              <div className="bg-gray-700/50 p-4 rounded-xl text-left text-gray-200 space-y-2 w-full max-w-sm">
                <p><strong>Sum:</strong> {latestPrediction.stats.sum}</p>
                <p><strong>Odd/Even:</strong> {latestPrediction.stats.oddEvenRatio}</p>
                <p><strong>Low (1-{TOTO_LOW_NUMBER_MAX})/High:</strong> {latestPrediction.stats.highLowRatio}</p>
                {latestPrediction.confidenceScore !== undefined && (
                  <p className="text-indigo-200 font-bold">
                    <strong>Confidence:</strong> {(latestPrediction.confidenceScore * 100).toFixed(1)}%
                  </p>
                )}
                <p className="text-sm text-gray-400 mt-2">Generated: {format(new Date(latestPrediction.timestamp), 'dd MMM yyyy HH:mm')}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-lg py-10">
              Click "Generate Smart Prediction" to get your AI-powered numbers!
            </p>
          )}
        </motion.section>

        {/* Accuracy Tracking Widget */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: FADE_IN_ANIMATION_DURATION, delay: 0.4 }}
          className="bg-gray-800/70 p-6 rounded-3xl shadow-xl flex flex-col items-center"
        >
          <h2 className="text-2xl font-bold mb-4 text-indigo-300">Prediction Accuracy Hit Rates</h2>
          {isLoadingAccuracyStats ? (
            <LoadingSpinner message="Calculating accuracy..." />
          ) : accuracyStatsError ? (
            <p className="text-red-400">Error: {accuracyStatsError.message}</p>
          ) : (
            <div className="w-full h-64 md:h-80 lg:h-96 flex justify-center items-center">
              <Doughnut data={getAccuracyChartData()} options={chartOptions} />
            </div>
          )}
          <div className="mt-4 w-full grid grid-cols-2 gap-4 text-sm md:text-base">
            {accuracyStats?.map((stat, index) => (
              <div key={stat.label} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-xl">
                <span className="text-gray-200">{stat.label}</span>
                <span className="font-semibold text-white">{stat.percentage} ({stat.count})</span>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      {/* Bottom Section: Recent Draws & AI Model Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Draws List */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: FADE_IN_ANIMATION_DURATION, delay: 0.6 }}
          className="bg-gray-800/70 p-6 rounded-3xl shadow-xl"
        >
          <h2 className="text-2xl font-bold mb-4 text-indigo-300">Recent Draws</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
            {latestDraws && latestDraws.slice(1).map((draw, idx) => ( // Exclude the very latest draw already shown in hero
              <div
                key={draw.draw_no}
                className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-700/50 p-3 rounded-xl shadow-md"
              >
                <div className="flex-shrink-0 mb-2 sm:mb-0">
                  <p className="font-semibold text-lg text-white">Draw No. {draw.draw_no}</p>
                  <p className="text-sm text-gray-300">{format(new Date(draw.date), 'dd MMM yyyy')}</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end sm:ml-4">
                  {draw.winning_numbers.map((num) => (
                    <span
                      key={`${draw.draw_no}-${num}`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white text-sm font-medium"
                    >
                      {num}
                    </span>
                  ))}
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-medium">
                    {draw.additional_number}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* AI Analysis Panel */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: FADE_IN_ANIMATION_DURATION, delay: 0.8 }}
          className="bg-gray-800/70 p-6 rounded-3xl shadow-xl"
        >
          <h2 className="text-2xl font-bold mb-4 text-indigo-300">AI Prediction Model Insights</h2>
          <p className="text-gray-300 mb-4">
            Our "TOAITO" prediction engine leverages a sophisticated Monte Carlo simulation with <strong>{MONTE_CARLO_ITERATIONS.toLocaleString()} iterations</strong> to generate optimal TOTO number combinations. It incorporates several "Golden Zone" filters for enhanced accuracy:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>
              <strong>Parity Filter:</strong> Ensures predictions have between 2 to 4 even numbers (out of 6).
            </li>
            <li>
              <strong>Range Filter:</strong> Guarantees 2 to 4 low numbers (1-24) within the selection.
            </li>
            <li>
              <strong>Anti-Repeat Mechanism:</strong> Limits overlapping numbers with the most recent draw to a maximum of {MAX_OVERLAPPING_NUMBERS}, preventing "hot streak" fallacy.
            </li>
            <li>
              <strong>Weighted Selection:</strong> Numbers that have appeared more frequently in the last {FREQUENCY_DRAW_COUNT} draws are prioritized, considering them "hot" for the next selection.
            </li>
          </ul>
          <p className="text-gray-400 mt-4 italic text-sm">
            This analytical approach aims to identify patterns and statistical tendencies, offering a data-driven edge to your TOTO choices.
          </p>
        </motion.section>
      </div>


      {/* Fixed bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md p-4 shadow-2xl border-t border-gray-700 z-50">
        <div className="container mx-auto flex flex-col sm:flex-row justify-around items-center gap-4">
          <button
            onClick={handleGeneratePrediction}
            disabled={generatePredictionMutation.isLoading}
            className="flex-1 w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-green-600 to-teal-700 text-white font-bold rounded-2xl shadow-lg hover:from-green-700 hover:to-teal-800 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatePredictionMutation.isLoading ? 'Generating...' : 'Generate Smart Prediction'}
          </button>
          <button
            onClick={handleSyncResults}
            disabled={syncResultsMutation.isLoading}
            className="flex-1 w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncResultsMutation.isLoading ? 'Syncing...' : 'Sync Latest Results'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;