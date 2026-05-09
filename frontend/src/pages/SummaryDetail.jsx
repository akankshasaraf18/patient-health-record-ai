import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authGet, authPost, authPut } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { getModelMetrics } from "../services/mlMetricsService";
import { getDetailedSbarAnalysis } from "../services/debugService";

// Simple toast notification system
const toast = {
  success: (message) => {
    console.log(`Success: ${message}`);
    // In a real app, this would show a toast notification
  },
  error: (message) => {
    console.error(`Error: ${message}`);
    // In a real app, this would show a toast notification
  },
  info: (message) => {
    console.info(`Info: ${message}`);
    // In a real app, this would show a toast notification
  },
};

// API URL is managed by our api utility

const SummaryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDoctor } = useAuth();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    situation: "",
    background: "",
    assessment: "",
    recommendation: "",
  });
  const [accuracyScores, setAccuracyScores] = useState({
    trainAccuracy: null,
    testAccuracy: null,
    precision: null,
    recall: null,
    f1Score: null,
    loading: false,
    error: null,
  });

  const [debugInfo, setDebugInfo] = useState({
    visible: false,
    loading: false,
    data: null,
    error: null,
  });

  useEffect(() => {
    fetchSummary();
  }, [id]);

  // Fetch LLM accuracy from summary metadata
  useEffect(() => {
    if (summary && !isEditing) {
      loadAccuracyFromSummary();
    }
  }, [summary, isEditing]);

  // Function to load accuracy from summary metadata (LLM accuracy)
  const loadAccuracyFromSummary = () => {
    try {
      console.log("🔍 Loading accuracy from summary metadata:", summary.metadata);
      console.log("🔍 LLM Accuracy value:", summary.metadata?.llm_accuracy);
      console.log("🔍 Evaluation data:", summary.metadata?.evaluation);
      
      setAccuracyScores((prev) => ({
        ...prev,
        loading: true,
      }));

      // Check if summary has LLM accuracy data
      if (summary.metadata && summary.metadata.llm_accuracy !== null && summary.metadata.llm_accuracy !== undefined) {
        const llmAccuracy = summary.metadata.llm_accuracy;
        const evaluation = summary.metadata.evaluation || {};

        setAccuracyScores({
          trainAccuracy: null,
          testAccuracy: llmAccuracy,
          precision: evaluation.component_scores?.S || null,
          recall: evaluation.component_scores?.B || null,
          f1Score: evaluation.component_scores?.A || null,
          loading: false,
          error: null,
          modelInfo: {
            algorithm: "Fine-tuned GPT-2",
            description: "LLM-generated SBAR"
          },
          dataset: {
            total_samples: 200,
            test_samples: 40
          },
          llmEvaluation: evaluation,
          isLLM: true
        });
      } else {
        // No LLM accuracy, show placeholder
        setAccuracyScores({
          trainAccuracy: null,
          testAccuracy: null,
          precision: null,
          recall: null,
          f1Score: null,
          loading: false,
          error: "Generate SBAR to see accuracy",
          isLLM: false
        });
      }
    } catch (error) {
      console.error("Error loading accuracy:", error);
      setAccuracyScores({
        trainAccuracy: null,
        testAccuracy: null,
        precision: null,
        recall: null,
        f1Score: null,
        loading: false,
        error: error.message,
      });
    }
  };

  // Function to load debug analysis data
  const fetchDebugAnalysis = async () => {
    try {
      setDebugInfo({
        ...debugInfo,
        loading: true,
        error: null,
      });

      const analysisData = await getDetailedSbarAnalysis(id);

      setDebugInfo({
        visible: true,
        loading: false,
        data: analysisData,
        error: null,
      });

      toast.info("Debug analysis loaded");
    } catch (error) {
      console.error("Error fetching debug analysis:", error);
      setDebugInfo({
        ...debugInfo,
        loading: false,
        error: error.message || "Failed to fetch debug analysis",
      });
      toast.error("Failed to load debug analysis");
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await authGet(`/summaries/${id}`);
      const summaryData = response.data.summary;
      setSummary(summaryData);

      // Extract SBAR data from summaryOutput structure
      const situation =
        summaryData.summaryOutput?.situation?.hpi ||
        summaryData.summaryOutput?.situation?.chief_complaint ||
        "";
      const background = summaryData.summaryOutput?.background?.diagnosis || "";
      const assessment = summaryData.summaryOutput?.assessment?.events || "";
      const recommendation =
        summaryData.summaryOutput?.recommendation?.disposition || "";

      setEditData({
        situation,
        background,
        assessment,
        recommendation,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching summary:", error);
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await authPut(`/summaries/${id}`, editData);
      setIsEditing(false);
      fetchSummary();
      // Reset accuracy scores when summary is updated
      setAccuracyScores((prev) => ({
        ...prev,
        situation: null,
        background: null,
        assessment: null,
        recommendation: null,
        overall: null,
      }));
      alert("Summary updated successfully!");
    } catch (error) {
      alert(error.response?.data?.error || "Failed to update summary");
    }
  };

  // Fetch ML model metrics from trained model
  const fetchMLMetrics = async () => {
    try {
      setAccuracyScores((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      toast.info("Loading ML model metrics...");

      // Get ML model metrics from backend
      const metricsData = await getModelMetrics();

      if (!metricsData.trained) {
        setAccuracyScores({
          trainAccuracy: null,
          testAccuracy: null,
          precision: null,
          recall: null,
          f1Score: null,
          loading: false,
          error: "Model not trained yet",
        });
        toast.error("ML model has not been trained yet");
        return;
      }

      setAccuracyScores({
        trainAccuracy: parseFloat(metricsData.accuracy.train),
        testAccuracy: parseFloat(metricsData.accuracy.test),
        precision: parseFloat(metricsData.metrics.precision),
        recall: parseFloat(metricsData.metrics.recall),
        f1Score: parseFloat(metricsData.metrics.f1_score),
        loading: false,
        error: null,
        modelInfo: metricsData.model_info,
        dataset: metricsData.dataset,
      });

      toast.success("ML metrics loaded successfully");
    } catch (error) {
      console.error("Error fetching ML metrics:", error);
      setAccuracyScores({
        trainAccuracy: null,
        testAccuracy: null,
        precision: null,
        recall: null,
        f1Score: null,
        loading: false,
        error: error.message || "Failed to fetch ML metrics",
      });
      toast.error("Failed to load ML model metrics");
    }
  };

  const handleApprove = async () => {
    if (
      !confirm(
        "Approve and sign off this summary? This action cannot be undone."
      )
    )
      return;

    try {
      // Attempt to approve the summary
      const response = await authPost(`/summaries/${id}/approve`, {});

      // Simple success alert
      alert("Summary approved and signed off successfully!");
      console.log("Summary approved:", response.data);

      // Refresh the summary to show updated status
      fetchSummary();
    } catch (error) {
      console.error("Error approving summary:", error);
      alert(error.response?.data?.error || "Failed to approve summary");
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading summary...</div>;
  }

  if (!summary) {
    return (
      <div className="p-8 text-center text-red-600">Summary not found</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Patient Summary
              </h1>
              <p className="text-gray-600">
                {summary.patientId?.firstName} {summary.patientId?.lastName}{" "}
                (MRN: {summary.patientId?.mrn})
              </p>
            </div>

            <div className="flex gap-3">
              {!isEditing ? (
                <>
                  {/* Button to recalculate ML metrics */}
                  <button
                    onClick={fetchMLMetrics}
                    disabled={accuracyScores.loading}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                    title="Refresh ML model metrics"
                  >
                    {accuracyScores.loading ? (
                      <span>Calculating...</span>
                    ) : (
                      <>
                        <span className="text-sm">🎯</span>
                        <span>ML Model Metrics</span>
                      </>
                    )}
                  </button>

                  {/* Debug analysis button */}
                  <button
                    onClick={fetchDebugAnalysis}
                    disabled={debugInfo.loading}
                    className="px-3 py-1 text-sm border border-indigo-300 text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 flex items-center gap-1"
                    title="Debug SBAR analysis"
                  >
                    {debugInfo.loading ? (
                      <span>Loading...</span>
                    ) : (
                      <>
                        <span className="text-sm">🔍</span>
                        <span>Debug Analysis</span>
                      </>
                    )}
                  </button>

                  {isDoctor && summary.status === "draft" && (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Edit Summary
                      </button>
                      <button
                        onClick={handleApprove}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        ✓ Approve & Sign Off
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({
                        situation: summary.situation,
                        background: summary.background,
                        assessment: summary.assessment,
                        recommendation: summary.recommendation,
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Badge */}
        <div className="mb-6">
          <span
            className={`inline-block px-4 py-2 rounded-lg font-medium ${
              summary.status === "final"
                ? "bg-green-100 text-green-800"
                : summary.status === "reviewed"
                ? "bg-blue-100 text-blue-800"
                : "bg-orange-100 text-orange-800"
            }`}
          >
            {summary.status === "final"
              ? "✓ Approved"
              : summary.status === "reviewed"
              ? "👁 Reviewed"
              : "⏳ Draft"}
          </span>
        </div>

        {/* Summary Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Generated At</p>
              <p className="font-medium">
                {new Date(summary.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Time Period</p>
              <p className="font-medium">
                {new Date(summary.periodStart).toLocaleDateString()} -{" "}
                {new Date(summary.periodEnd).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Confidence</p>
              <p className="font-medium">
                {((summary.confidence || 0.7) * 100).toFixed(0)}%
              </p>
            </div>

            {/* LLM Accuracy */}
            <div>
              <p className="text-sm text-gray-600">
                {accuracyScores.isLLM ? "LLM Accuracy" : "Model Test Accuracy"}
              </p>
              {accuracyScores.loading ? (
                <p className="font-medium text-gray-500">Loading...</p>
              ) : accuracyScores.error ? (
                <p className="font-medium text-yellow-600 text-xs">
                  {accuracyScores.error}
                </p>
              ) : accuracyScores.testAccuracy !== null ? (
                <div className="flex items-center gap-2">
                  <div
                    className={`px-2 py-1 rounded-md text-sm font-medium
                    ${
                      accuracyScores.testAccuracy > 80
                        ? "bg-green-100 text-green-800"
                        : accuracyScores.testAccuracy > 60
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {accuracyScores.testAccuracy.toFixed(1)}%
                  </div>
                  <span className="text-xs text-gray-500">
                    {accuracyScores.isLLM ? "(LLM)" : "(sklearn)"}
                  </span>
                </div>
              ) : (
                <p className="font-medium text-gray-500">Not available</p>
              )}
            </div>
          </div>

          {/* Additional ML Metrics Row - Only show for non-LLM summaries */}
          {!accuracyScores.isLLM && accuracyScores.trainAccuracy !== null && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">ML Model Metrics (Train/Test Split)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Train Accuracy</p>
                  <p className="text-sm font-semibold text-blue-600">{accuracyScores.trainAccuracy.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Precision</p>
                  <p className="text-sm font-semibold text-purple-600">{accuracyScores.precision.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Recall</p>
                  <p className="text-sm font-semibold text-pink-600">{accuracyScores.recall.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">F1 Score</p>
                  <p className="text-sm font-semibold text-orange-600">{accuracyScores.f1Score.toFixed(1)}%</p>
                </div>
              </div>
              {accuracyScores.dataset && (
                <p className="text-xs text-gray-500 mt-2">
                  Trained on {accuracyScores.dataset.train_samples} samples, tested on {accuracyScores.dataset.test_samples} samples
                </p>
              )}
            </div>
          )}
        </div>

        {/* LLM Accuracy Analysis - NEW PROMINENT SECTION */}
        {accuracyScores.isLLM && accuracyScores.llmEvaluation && (
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-lg shadow-lg p-6 mb-6 border-2 border-indigo-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                LLM Model Performance Analysis
              </h3>
              <div className="bg-white rounded-lg px-4 py-2 shadow">
                <p className="text-xs text-gray-600">Model</p>
                <p className="font-semibold text-indigo-900">GPT-2 Fine-tuned</p>
              </div>
            </div>

            {/* Overall Accuracy - Big Display */}
            <div className="bg-white rounded-lg p-6 mb-4 shadow-md">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Overall LLM Accuracy vs Ground Truth</p>
                <div className={`inline-block text-6xl font-bold mb-2
                  ${accuracyScores.testAccuracy > 80 ? 'text-green-600' : 
                    accuracyScores.testAccuracy > 60 ? 'text-yellow-600' : 
                    accuracyScores.testAccuracy > 40 ? 'text-orange-600' : 'text-red-600'}`}>
                  {accuracyScores.testAccuracy.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-500">
                  Compared against similar patient record from training dataset (200 patients)
                </p>
              </div>
            </div>

            {/* Component Breakdown */}
            {accuracyScores.llmEvaluation.component_scores && (
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <span>📊</span>
                  SBAR Component-wise Accuracy
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Situation</p>
                    <p className={`text-3xl font-bold ${
                      accuracyScores.llmEvaluation.component_scores.S > 80 ? 'text-green-600' : 
                      accuracyScores.llmEvaluation.component_scores.S > 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {accuracyScores.llmEvaluation.component_scores.S.toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Background</p>
                    <p className={`text-3xl font-bold ${
                      accuracyScores.llmEvaluation.component_scores.B > 80 ? 'text-green-600' : 
                      accuracyScores.llmEvaluation.component_scores.B > 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {accuracyScores.llmEvaluation.component_scores.B.toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Assessment</p>
                    <p className={`text-3xl font-bold ${
                      accuracyScores.llmEvaluation.component_scores.A > 80 ? 'text-green-600' : 
                      accuracyScores.llmEvaluation.component_scores.A > 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {accuracyScores.llmEvaluation.component_scores.A.toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Recommendation</p>
                    <p className={`text-3xl font-bold ${
                      accuracyScores.llmEvaluation.component_scores.R > 80 ? 'text-green-600' : 
                      accuracyScores.llmEvaluation.component_scores.R > 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {accuracyScores.llmEvaluation.component_scores.R.toFixed(0)}%
                    </p>
                  </div>
                </div>
                
                {/* Additional Metrics */}
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Sequence Match Score</p>
                    <p className="text-lg font-semibold text-indigo-600">
                      {accuracyScores.llmEvaluation.sequence_match?.toFixed(1) || 'N/A'}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Jaccard Similarity</p>
                    <p className="text-lg font-semibold text-purple-600">
                      {accuracyScores.llmEvaluation.jaccard_similarity?.toFixed(1) || 'N/A'}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Explanation */}
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-sm text-gray-700">
                <strong>ℹ️ How it works:</strong> The LLM generates a SBAR summary based on patient data, 
                then compares it with similar patient records from the training dataset. 
                The accuracy shows how well the LLM's output matches the expected clinical summary.
              </p>
            </div>
          </div>
        )}

        {/* SBAR Summary */}
        <div className="space-y-6">
          {/* Situation */}
          <div className="bg-gradient-to-r from-blue-50 to-white rounded-lg shadow-md border-l-4 border-blue-500 p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">📍</span>
              <span>Situation</span>
            </h2>

            {isEditing ? (
              <textarea
                value={editData.situation}
                onChange={(e) =>
                  setEditData({ ...editData, situation: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the current patient situation..."
              />
            ) : (
              <p className="text-gray-800 leading-relaxed text-lg whitespace-pre-line">
                {editData.situation || "No situation data available"}
              </p>
            )}
          </div>

          {/* Background */}
          <div className="bg-gradient-to-r from-purple-50 to-white rounded-lg shadow-md border-l-4 border-purple-500 p-6">
            <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <span>Background</span>
            </h2>

            {isEditing ? (
              <textarea
                value={editData.background}
                onChange={(e) =>
                  setEditData({ ...editData, background: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Provide patient background and history..."
              />
            ) : (
              <p className="text-gray-800 leading-relaxed text-lg whitespace-pre-line">
                {editData.background || "No background data available"}
              </p>
            )}
          </div>

          {/* Assessment */}
          <div className="bg-gradient-to-r from-green-50 to-white rounded-lg shadow-md border-l-4 border-green-500 p-6">
            <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">🔍</span>
              <span>Assessment</span>
            </h2>

            {isEditing ? (
              <textarea
                value={editData.assessment}
                onChange={(e) =>
                  setEditData({ ...editData, assessment: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Provide clinical assessment..."
              />
            ) : (
              <p className="text-gray-800 leading-relaxed text-lg whitespace-pre-line">
                {editData.assessment || "No assessment data available"}
              </p>
            )}
          </div>

          {/* Recommendation */}
          <div className="bg-gradient-to-r from-amber-50 to-white rounded-lg shadow-md border-l-4 border-amber-500 p-6">
            <h2 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              <span>Recommendation</span>
            </h2>

            {isEditing ? (
              <textarea
                value={editData.recommendation}
                onChange={(e) =>
                  setEditData({ ...editData, recommendation: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Provide care recommendations..."
              />
            ) : (
              <p className="text-gray-800 leading-relaxed text-lg whitespace-pre-line">
                {editData.recommendation || "No recommendation data available"}
              </p>
            )}
          </div>

          {/* Vitals Section */}
          {summary.summaryOutput?.assessment?.vitals?.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                📊 Vital Signs Trends
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        HR
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        BP
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Temp
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        RR
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        SpO2
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summary.summaryOutput.assessment.vitals
                      .slice(0, 5)
                      .map((vital, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(vital.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {vital.HR || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {vital.BP || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {vital.Temp ? `${vital.Temp}°F` : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {vital.RR || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {vital.O2Sat ? `${vital.O2Sat}%` : "-"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Medications Section */}
          {summary.summaryOutput?.assessment?.medications?.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                💊 Medications Administered
              </h3>
              <div className="space-y-3">
                {summary.summaryOutput.assessment.medications.map(
                  (med, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-2xl">💊</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{med.name}</p>
                        <p className="text-sm text-gray-600">
                          {med.dose} • {med.route} •{" "}
                          {new Date(med.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Old Jaccard Accuracy Info section removed - now using ML Model Metrics above */}

        {/* Debug Analysis Panel */}
        {debugInfo.visible && debugInfo.data && (
          <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-indigo-900">
                🔍 SBAR Component Analysis
              </h3>
              <button
                onClick={() => setDebugInfo({ ...debugInfo, visible: false })}
                className="text-indigo-700 hover:text-indigo-900"
                title="Close debug panel"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Situation Analysis */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="text-md font-bold text-indigo-800 mb-2">
                  Situation
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-bold text-gray-600 mb-1">
                      Reference Content:
                    </h5>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {debugInfo.data.groundTruth.situation.text}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Word count:{" "}
                      {debugInfo.data.groundTruth.situation.wordCount}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-gray-600 mb-1">
                      Generated Content:
                    </h5>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {debugInfo.data.generated.situation.text}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Word count: {debugInfo.data.generated.situation.wordCount}
                    </p>
                    <p className="text-xs text-gray-400">
                      Source: {debugInfo.data.generated.situation.source}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <h5 className="text-sm font-bold text-gray-600 mb-1">
                      Common Words:
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {debugInfo.data.commonWords.situation.map((word, idx) => (
                        <span
                          key={idx}
                          className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                        >
                          {word}
                        </span>
                      ))}
                      {!debugInfo.data.commonWords.situation.length && (
                        <span className="text-sm text-gray-500">
                          No common significant words found
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Analysis */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="text-md font-bold text-indigo-800 mb-2">
                  Background
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-bold text-gray-600 mb-1">
                      Reference Content:
                    </h5>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {debugInfo.data.groundTruth.background.text}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Word count:{" "}
                      {debugInfo.data.groundTruth.background.wordCount}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-gray-600 mb-1">
                      Generated Content:
                    </h5>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {debugInfo.data.generated.background.text}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Word count:{" "}
                      {debugInfo.data.generated.background.wordCount}
                    </p>
                    <p className="text-xs text-gray-400">
                      Source: {debugInfo.data.generated.background.source}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <h5 className="text-sm font-bold text-gray-600 mb-1">
                      Common Words:
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {debugInfo.data.commonWords.background.map(
                        (word, idx) => (
                          <span
                            key={idx}
                            className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                          >
                            {word}
                          </span>
                        )
                      )}
                      {!debugInfo.data.commonWords.background.length && (
                        <span className="text-sm text-gray-500">
                          No common significant words found
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Summary */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="text-md font-bold text-indigo-800 mb-2">
                  Score Summary
                </h4>
                
                {/* Overall Accuracy - Big Display */}
                {debugInfo.data.evaluation?.overall_accuracy && (
                  <div className="mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-600 mb-1">Overall LLM Accuracy</p>
                    <p className={`text-5xl font-bold ${
                      debugInfo.data.evaluation.overall_accuracy > 80 ? 'text-green-600' : 
                      debugInfo.data.evaluation.overall_accuracy > 60 ? 'text-yellow-600' : 
                      debugInfo.data.evaluation.overall_accuracy > 40 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {debugInfo.data.evaluation.overall_accuracy.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">vs Ground Truth from Training Dataset</p>
                  </div>
                )}
                
                {/* Component Scores */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="bg-blue-50 p-2 rounded text-center">
                    <p className="text-xs text-blue-700">Situation</p>
                    <p className="font-bold text-blue-800">
                      {debugInfo.data.scores.situation}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded text-center">
                    <p className="text-xs text-purple-700">Background</p>
                    <p className="font-bold text-purple-800">
                      {debugInfo.data.scores.background}
                    </p>
                  </div>
                  <div className="bg-green-50 p-2 rounded text-center">
                    <p className="text-xs text-green-700">Assessment</p>
                    <p className="font-bold text-green-800">
                      {debugInfo.data.scores.assessment}
                    </p>
                  </div>
                  <div className="bg-amber-50 p-2 rounded text-center">
                    <p className="text-xs text-amber-700">Recommendation</p>
                    <p className="font-bold text-amber-800">
                      {debugInfo.data.scores.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approval Info */}
        {summary.status === "final" && summary.signedOffBy && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-green-900 mb-2">
              ✓ Approved & Signed Off
            </h3>
            <p className="text-green-800">
              Signed off at: {new Date(summary.signedOffAt).toLocaleString()}
            </p>
          </div>
        )}

        {/* Edit History */}
        {summary.editHistory && summary.editHistory.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Edit History
            </h3>
            <div className="space-y-3">
              {summary.editHistory.map((edit, index) => (
                <div
                  key={index}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <p className="text-sm text-gray-600">
                    {edit.field} edited on{" "}
                    {new Date(edit.timestamp).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Previous: {edit.oldValue.substring(0, 100)}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryDetail;
