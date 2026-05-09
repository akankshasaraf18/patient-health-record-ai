/**
 * ML Model Metrics Service
 * Frontend service for fetching ML model training/test metrics
 */

import { authGet } from '../utils/api';

/**
 * Get all ML model metrics
 */
export const getModelMetrics = async () => {
  try {
    const response = await authGet('/ml-metrics/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching model metrics:', error);
    throw error;
  }
};

/**
 * Get model performance details
 */
export const getModelPerformance = async () => {
  try {
    const response = await authGet('/ml-metrics/performance');
    return response.data;
  } catch (error) {
    console.error('Error fetching model performance:', error);
    throw error;
  }
};

/**
 * Get model statistics with formatted percentages
 */
export const getModelStats = async () => {
  try {
    const response = await authGet('/ml-metrics/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching model stats:', error);
    throw error;
  }
};

/**
 * Get training accuracy
 */
export const getTrainingAccuracy = async () => {
  try {
    const response = await authGet('/ml-metrics/train-accuracy');
    return response.data;
  } catch (error) {
    console.error('Error fetching training accuracy:', error);
    throw error;
  }
};

/**
 * Get test accuracy
 */
export const getTestAccuracy = async () => {
  try {
    const response = await authGet('/ml-metrics/test-accuracy');
    return response.data;
  } catch (error) {
    console.error('Error fetching test accuracy:', error);
    throw error;
  }
};

/**
 * Check if model is trained
 */
export const checkModelStatus = async () => {
  try {
    const response = await authGet('/ml-metrics/status');
    return response.data;
  } catch (error) {
    console.error('Error checking model status:', error);
    throw error;
  }
};

export default {
  getModelMetrics,
  getModelPerformance,
  getModelStats,
  getTrainingAccuracy,
  getTestAccuracy,
  checkModelStatus,
};
