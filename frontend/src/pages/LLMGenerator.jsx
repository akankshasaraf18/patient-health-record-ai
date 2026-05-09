import { useState, useEffect } from 'react';
import { generateSBARWithLLM, getLLMModelInfo } from '../services/llmService';

const LLMGenerator = () => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'M',
    medical_condition: '',
    history: '',
    heart_rate: '',
    blood_pressure: '',
    temperature: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    current_medications: '',
    admission_type: 'Emergency'
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchModelInfo();
  }, []);

  const fetchModelInfo = async () => {
    try {
      const info = await getLLMModelInfo();
      setModelInfo(info);
    } catch (error) {
      console.error('Error fetching model info:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await generateSBARWithLLM(formData);
      setResult(response);
    } catch (error) {
      setError(error.message || 'Failed to generate SBAR');
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🤖 LLM SBAR Generator
          </h1>
          <p className="text-gray-600">
            Generate SBAR summaries using fine-tuned GPT-2 with accuracy evaluation
          </p>
          
          {/* Model Info */}
          {modelInfo && modelInfo.trained && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Model Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Model:</span>
                  <p className="font-medium">{modelInfo.model_name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Dataset Size:</span>
                  <p className="font-medium">{modelInfo.dataset_size} patients</p>
                </div>
                <div>
                  <span className="text-gray-600">Eval Loss:</span>
                  <p className="font-medium">{modelInfo.eval_loss?.toFixed(4)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Est. Accuracy:</span>
                  <p className="font-medium text-green-600">~{modelInfo.accuracy_equivalent}%</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Patient Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admission Type
                  </label>
                  <select
                    name="admission_type"
                    value={formData.admission_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Emergency">Emergency</option>
                    <option value="Routine">Routine</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Condition *
                </label>
                <input
                  type="text"
                  name="medical_condition"
                  value={formData.medical_condition}
                  onChange={handleChange}
                  placeholder="e.g., chest pain, shortness of breath"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical History
                </label>
                <input
                  type="text"
                  name="history"
                  value={formData.history}
                  onChange={handleChange}
                  placeholder="e.g., hypertension, diabetes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Vital Signs */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-700 mb-3">Vital Signs</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heart Rate (bpm)
                    </label>
                    <input
                      type="number"
                      name="heart_rate"
                      value={formData.heart_rate}
                      onChange={handleChange}
                      placeholder="e.g., 80"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Blood Pressure
                    </label>
                    <input
                      type="text"
                      name="blood_pressure"
                      value={formData.blood_pressure}
                      onChange={handleChange}
                      placeholder="e.g., 120/80"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temperature (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleChange}
                      placeholder="e.g., 37.0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Respiratory Rate
                    </label>
                    <input
                      type="number"
                      name="respiratory_rate"
                      value={formData.respiratory_rate}
                      onChange={handleChange}
                      placeholder="e.g., 18"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SpO2 (%)
                    </label>
                    <input
                      type="number"
                      name="oxygen_saturation"
                      value={formData.oxygen_saturation}
                      onChange={handleChange}
                      placeholder="e.g., 98"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Medications
                </label>
                <input
                  type="text"
                  name="current_medications"
                  value={formData.current_medications}
                  onChange={handleChange}
                  placeholder="e.g., amlodipine, metformin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '🤖 Generating SBAR...' : '🚀 Generate SBAR with LLM'}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Generated SBAR & Accuracy</h2>
            
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Generating SBAR with LLM...</p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-6">
                {/* Overall Accuracy */}
                {result.evaluation && result.evaluation.overall_accuracy !== null && (
                  <div className={`p-6 ${getAccuracyBgColor(result.evaluation.overall_accuracy)} rounded-lg border-2 border-current`}>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Overall Accuracy</p>
                      <p className={`text-5xl font-bold ${getAccuracyColor(result.evaluation.overall_accuracy)}`}>
                        {result.evaluation.overall_accuracy}%
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Sequence Match</p>
                          <p className="font-semibold">{result.evaluation.sequence_match}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Jaccard Similarity</p>
                          <p className="font-semibold">{result.evaluation.jaccard_similarity}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Generated SBAR */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">🤖 LLM Generated SBAR:</h3>
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                    <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">
                      {result.generated_sbar}
                    </pre>
                  </div>
                </div>

                {/* Ground Truth (if available) */}
                {result.ground_truth_sbar && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">📚 Ground Truth (from dataset):</h3>
                    <div className="bg-green-50 p-4 rounded-md border border-green-200">
                      <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">
                        {result.ground_truth_sbar}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Component Scores */}
                {result.evaluation && result.evaluation.component_scores && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Component-wise Accuracy:</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(result.evaluation.component_scores).map(([key, score]) => (
                        <div key={key} className={`p-3 ${getAccuracyBgColor(score)} rounded-md text-center`}>
                          <p className="text-sm font-medium text-gray-700">{key}</p>
                          <p className={`text-2xl font-bold ${getAccuracyColor(score)}`}>
                            {score}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Ground Truth Message */}
                {!result.ground_truth_sbar && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ No matching ground truth found in dataset for accuracy comparison.
                      The SBAR was generated successfully but accuracy cannot be calculated.
                    </p>
                  </div>
                )}
              </div>
            )}

            {!result && !loading && (
              <div className="text-center py-12 text-gray-400">
                <svg className="mx-auto h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Enter patient information and click "Generate SBAR with LLM"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LLMGenerator;
