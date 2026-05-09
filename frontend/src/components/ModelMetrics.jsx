import { useState, useEffect } from 'react';
import { getModelMetrics } from '../services/mlMetricsService';

/**
 * ModelMetrics Component
 * Displays ML model training and test accuracy metrics
 */
const ModelMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await getModelMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError('Failed to load model metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading model metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg shadow-md p-6">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="ml-3 text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  if (!metrics?.trained) {
    return (
      <div className="bg-yellow-50 rounded-lg shadow-md p-6">
        <div className="flex items-start">
          <svg className="h-6 w-6 text-yellow-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-yellow-900">Model Not Trained</h3>
            <p className="mt-2 text-yellow-800">{metrics.message}</p>
            <div className="mt-4 bg-yellow-100 rounded p-3">
              <p className="text-sm font-mono text-yellow-900">
                cd backend/ml && python train_test_model.py
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ML Model Performance</h2>
            <p className="mt-1 text-sm text-gray-600">
              Trained on {metrics.dataset.total_samples} patient samples using {metrics.model_info.type}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">Model Active</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Last trained: {new Date(metrics.model_info.last_trained).toLocaleString()}
        </div>
      </div>

      {/* Accuracy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Training Accuracy */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Training Accuracy</p>
              <p className="mt-2 text-4xl font-bold text-blue-600">{metrics.accuracy.train}</p>
              <p className="mt-1 text-sm text-blue-700">
                Samples: {metrics.dataset.train_samples}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <div className="bg-blue-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                style={{ width: metrics.accuracy.train }}
              ></div>
            </div>
          </div>
        </div>

        {/* Test Accuracy */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-md p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">Test Accuracy</p>
              <p className="mt-2 text-4xl font-bold text-green-600">{metrics.accuracy.test}</p>
              <p className="mt-1 text-sm text-green-700">
                Samples: {metrics.dataset.test_samples}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <div className="bg-green-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-green-600 h-full rounded-full transition-all duration-1000"
                style={{ width: metrics.accuracy.test }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Precision */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-900">Precision</p>
                <p className="mt-1 text-2xl font-bold text-purple-600">{metrics.metrics.precision}</p>
              </div>
              <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>

          {/* Recall */}
          <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-pink-900">Recall</p>
                <p className="mt-1 text-2xl font-bold text-pink-600">{metrics.metrics.recall}</p>
              </div>
              <svg className="h-6 w-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          </div>

          {/* F1 Score */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-900">F1 Score</p>
                <p className="mt-1 text-2xl font-bold text-orange-600">{metrics.metrics.f1_score}</p>
              </div>
              <svg className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Info */}
      <div className="bg-gray-50 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dataset Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-600">Total Samples</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{metrics.dataset.total_samples}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Training Samples</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{metrics.dataset.train_samples}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Test Samples</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{metrics.dataset.test_samples}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Test Split</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{(metrics.dataset.test_split_ratio * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={fetchMetrics}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Metrics</span>
        </button>
      </div>
    </div>
  );
};

export default ModelMetrics;
