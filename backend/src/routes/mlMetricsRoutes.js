/**
 * ML Model Metrics Routes
 * API endpoints for accessing trained model metrics and performance
 */

import express from 'express';
import * as mlMetricsService from '../services/mlMetricsService.js';

const router = express.Router();

/**
 * GET /api/ml-metrics/performance
 * Get overall model performance metrics
 */
router.get('/performance', (req, res) => {
  try {
    const performance = mlMetricsService.getModelPerformance();
    res.json(performance);
  } catch (error) {
    console.error('Error getting model performance:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve model performance',
      message: error.message 
    });
  }
});

/**
 * GET /api/ml-metrics/stats
 * Get detailed model statistics with formatted percentages
 */
router.get('/stats', (req, res) => {
  try {
    const stats = mlMetricsService.getModelStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting model stats:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve model statistics',
      message: error.message 
    });
  }
});

/**
 * GET /api/ml-metrics/train-accuracy
 * Get training accuracy
 */
router.get('/train-accuracy', (req, res) => {
  try {
    const trainAccuracy = mlMetricsService.getTrainingAccuracy();
    
    if (!trainAccuracy) {
      return res.status(404).json({ 
        error: 'Model not trained',
        message: 'Please train the model first using the Python training script.' 
      });
    }
    
    res.json(trainAccuracy);
  } catch (error) {
    console.error('Error getting train accuracy:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve training accuracy',
      message: error.message 
    });
  }
});

/**
 * GET /api/ml-metrics/test-accuracy
 * Get test accuracy
 */
router.get('/test-accuracy', (req, res) => {
  try {
    const testAccuracy = mlMetricsService.getTestAccuracy();
    
    if (!testAccuracy) {
      return res.status(404).json({ 
        error: 'Model not trained',
        message: 'Please train the model first using the Python training script.' 
      });
    }
    
    res.json(testAccuracy);
  } catch (error) {
    console.error('Error getting test accuracy:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve test accuracy',
      message: error.message 
    });
  }
});

/**
 * GET /api/ml-metrics/status
 * Check if model is trained
 */
router.get('/status', (req, res) => {
  try {
    const isTrained = mlMetricsService.isModelTrained();
    
    res.json({
      trained: isTrained,
      message: isTrained 
        ? 'Model is trained and ready' 
        : 'Model has not been trained yet. Run the training script in backend/ml/'
    });
  } catch (error) {
    console.error('Error checking model status:', error);
    res.status(500).json({ 
      error: 'Failed to check model status',
      message: error.message 
    });
  }
});

/**
 * GET /api/ml-metrics/all
 * Get all metrics in a single response
 */
router.get('/all', (req, res) => {
  try {
    const isTrained = mlMetricsService.isModelTrained();
    
    if (!isTrained) {
      return res.json({
        trained: false,
        message: 'Model has not been trained yet. Run: python backend/ml/train_test_model.py'
      });
    }

    const stats = mlMetricsService.getModelStats();
    const trainAccuracy = mlMetricsService.getTrainingAccuracy();
    const testAccuracy = mlMetricsService.getTestAccuracy();

    res.json({
      trained: true,
      model_info: {
        type: stats.model_type,
        last_trained: stats.last_trained,
      },
      accuracy: {
        train: parseFloat(trainAccuracy.accuracy),
        test: parseFloat(testAccuracy.accuracy),
      },
      metrics: {
        precision: parseFloat(stats.summary.precision_percentage),
        recall: parseFloat(stats.summary.recall_percentage),
        f1_score: parseFloat(stats.summary.f1_score_percentage),
      },
      dataset: stats.dataset,
    });
  } catch (error) {
    console.error('Error getting all metrics:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve metrics',
      message: error.message 
    });
  }
});

export default router;
