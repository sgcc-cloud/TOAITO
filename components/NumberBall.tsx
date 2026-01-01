import React from 'react';
import { motion } from 'framer-motion';
import { DrawSource } from '../types';

interface NumberBallProps {
  number: number;
  delay?: number;
  source?: DrawSource; // To differentiate styling (winning, additional, prediction)
}

const NumberBall: React.FC<NumberBallProps> = ({ number, delay = 0, source = DrawSource.WINNING }) => {
  const getBallColor = (src: DrawSource) => {
    switch (src) {
      case DrawSource.ADDITIONAL:
        return 'bg-purple-500'; // Distinct color for additional number
      case DrawSource.PREDICTION:
        return 'bg-green-500'; // Distinct color for prediction numbers
      case DrawSource.WINNING:
      default:
        return 'bg-red-500'; // Default for winning numbers
    }
  };

  const ballColorClass = getBallColor(source);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: delay,
        ease: [0, 0.71, 0.2, 1.01],
      }}
      className={`relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full shadow-lg border-2 border-white/30 text-lg md:text-xl lg:text-2xl font-bold text-white ${ballColorClass}`}
    >
      {number}
    </motion.div>
  );
};

export default NumberBall;
