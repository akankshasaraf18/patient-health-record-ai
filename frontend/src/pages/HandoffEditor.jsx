import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useFetchHandoffSummary,
  useHandoffEditor,
  useFinalizeHandoffSummary,
} from "../hooks/useHandoff";

const HandoffEditor = () => {
  const { summaryId } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState("situation");
  const [editableContent, setEditableContent] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch handoff summary
  const { summary, loading, error } = useFetchHandoffSummary(summaryId);

  // Editor hooks
  const { updateSummaryField } = useHandoffEditor();

  // Finalize handoff summary
  const { finalizeSummary } = useFinalizeHandoffSummary();

  // Update editable content when active section changes or summary changes
  useEffect(() => {
    if (summary && summary.summaryOutput) {
      setEditableContent(summary.summaryOutput[activeSection] || "");
    }
  }, [activeSection, summary]);

  // Handle section change
  const handleSectionChange = (section) => {
    // If editing, save changes before changing section
    if (isEditing) {
      handleSaveChanges();
    }
    setActiveSection(section);
  };

  // Handle edit button click
  const handleEditClick = () => {
    setIsEditing(true);
  };

  // Handle save changes
  const handleSaveChanges = () => {
    if (summary && summary.summaryOutput) {
      // Save changes to context
      updateSummaryField(
        activeSection,
        editableContent,
        summary.summaryOutput[activeSection]
      );
      setIsEditing(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    // Reset editable content to original
    setEditableContent(summary?.summaryOutput[activeSection] || "");
    setIsEditing(false);
  };

  // Handle finalize handoff
  const handleFinalizeHandoff = async () => {
    try {
      // In a real app, this would use the actual nurse ID
      await finalizeSummary(summaryId, "123456");
      setShowConfirmModal(false);
      // Show success message
      alert("Handoff summary finalized successfully!");
      navigate("/");
    } catch (error) {
      alert(`Error finalizing handoff summary: ${error.message}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg font-medium text-gray-500">
          Loading handoff summary...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  // No summary found
  if (!summary) {
    return (
      <div
        className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">Not Found!</strong>
        <span className="block sm:inline">
          {" "}
          No handoff summary found with ID: {summaryId}
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Handoff Summary
          </h2>
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Patient: John Doe (MRN: 12345678)
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {summary.shiftType} Shift -{" "}
              {new Date(summary.generationTimestamp).toLocaleString()}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Status:{" "}
              <span
                className={
                  summary.nurseReviewStatus === "Draft"
                    ? "text-yellow-600"
                    : "text-green-600"
                }
              >
                {summary.nurseReviewStatus}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0">
          {summary.nurseReviewStatus === "Draft" && (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="btn-success"
              disabled={isEditing}
            >
              Review & Finalize
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="btn-outline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            SBAR Summary
          </h3>
          {summary.nurseReviewStatus === "Draft" && !isEditing && (
            <button
              type="button"
              onClick={handleEditClick}
              className="btn-outline btn-sm"
            >
              Edit Current Section
            </button>
          )}
        </div>

        <div className="border-t border-gray-200">
          <div className="flex flex-col md:flex-row">
            {/* SBAR Navigation Tabs */}
            <div className="w-full md:w-1/4 bg-gray-50 p-4">
              <div className="flex md:flex-col space-y-0 md:space-y-2 space-x-2 md:space-x-0">
                <button
                  onClick={() => handleSectionChange("situation")}
                  className={`px-3 py-2 text-left rounded-md ${
                    activeSection === "situation"
                      ? "bg-primary-100 text-primary-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="font-semibold">S</span> - Situation
                </button>
                <button
                  onClick={() => handleSectionChange("background")}
                  className={`px-3 py-2 text-left rounded-md ${
                    activeSection === "background"
                      ? "bg-primary-100 text-primary-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="font-semibold">B</span> - Background
                </button>
                <button
                  onClick={() => handleSectionChange("assessment")}
                  className={`px-3 py-2 text-left rounded-md ${
                    activeSection === "assessment"
                      ? "bg-primary-100 text-primary-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="font-semibold">A</span> - Assessment
                </button>
                <button
                  onClick={() => handleSectionChange("recommendation")}
                  className={`px-3 py-2 text-left rounded-md ${
                    activeSection === "recommendation"
                      ? "bg-primary-100 text-primary-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="font-semibold">R</span> - Recommendation
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="w-full md:w-3/4 p-4">
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                {activeSection === "situation" && "Situation"}
                {activeSection === "background" && "Background"}
                {activeSection === "assessment" && "Assessment"}
                {activeSection === "recommendation" && "Recommendation"}
              </h4>

              {isEditing ? (
                <div>
                  <textarea
                    className="form-input w-full h-64 font-mono"
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                  />
                  <div className="mt-4 flex space-x-3 justify-end">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveChanges}
                      className="btn-primary"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="prose max-w-none">
                  {summary.summaryOutput[activeSection] ? (
                    <div className="whitespace-pre-wrap">
                      {summary.summaryOutput[activeSection]}
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">
                      No content available for this section.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vitals and Metrics */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Vitals and Metrics
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Objective data extracted from source notes.
          </p>
        </div>
        <div className="border-t border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Value
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summary.vitalsAndMetrics &&
              summary.vitalsAndMetrics.length > 0 ? (
                summary.vitalsAndMetrics.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.value} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                  >
                    No vitals or metrics data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg
                    className="h-6 w-6 text-yellow-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Finalize Handoff Summary
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      You are about to finalize this handoff summary. This
                      action confirms that you have reviewed the content and
                      accept clinical responsibility for the information
                      contained within. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn-success sm:ml-3"
                  onClick={handleFinalizeHandoff}
                >
                  Confirm & Finalize
                </button>
                <button
                  type="button"
                  className="btn-outline mt-3 sm:mt-0"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HandoffEditor;
