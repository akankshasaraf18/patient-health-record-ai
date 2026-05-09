import ModelMetrics from '../components/ModelMetrics';

/**
 * ML Model Page
 * Displays machine learning model training and test metrics
 */
const MLModelPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Machine Learning Model</h1>
          <p className="mt-2 text-gray-600">
            View training and test accuracy metrics for the SBAR summary generation model
          </p>
        </div>

        {/* Model Metrics Component */}
        <ModelMetrics />

        {/* Information Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">About the Model</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Training Dataset:</strong> 200 patient records from hospital dataset
            </p>
            <p>
              <strong>Split Ratio:</strong> 80% training (160 samples) / 20% testing (40 samples)
            </p>
            <p>
              <strong>Model Type:</strong> Logistic Regression with TF-IDF features or Sentence Transformers with Random Forest
            </p>
            <p>
              <strong>Task:</strong> SBAR summary quality classification (High/Low quality)
            </p>
            <p>
              <strong>Evaluation:</strong> Accuracy, Precision, Recall, and F1-Score on held-out test set
            </p>
          </div>
        </div>

        {/* Training Instructions */}
        <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Retrain the Model</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Navigate to the backend ML directory: <code className="bg-gray-200 px-2 py-1 rounded">cd backend/ml</code></li>
            <li>Install Python dependencies: <code className="bg-gray-200 px-2 py-1 rounded">pip install -r requirements.txt</code></li>
            <li>Run the training script: <code className="bg-gray-200 px-2 py-1 rounded">python train_test_model.py</code></li>
            <li>Refresh this page to see updated metrics</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default MLModelPage;
