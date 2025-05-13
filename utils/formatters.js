/**
 * Format time in seconds to MM:SS format
 * @param {number} time - Time in seconds
 * @returns {string} Formatted time string (e.g., "2:30")
 */
export const formatTime = (time) => {
  if (isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

/**
 * Calculate the percentage position of a value within a range
 * @param {number} value - Current value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Percentage (0-100)
 */
export const calculatePercentage = (value, min, max) => {
  return ((value - min) / (max - min)) * 100;
};

/**
 * Calculate a value from a percentage within a range
 * @param {number} percentage - Percentage (0-100)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Calculated value
 */
export const calculateValueFromPercentage = (percentage, min, max) => {
  return Math.round(min + (percentage / 100) * (max - min));
};
