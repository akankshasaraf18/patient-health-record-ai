import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGenerateHandoffSummary } from "../hooks/useHandoff";

// Placeholder for demonstration - in a real app, this would be fetched from the backend
const MOCK_PATIENTS = [
  { id: "1", name: "John Doe", mrn: "12345678", room: "101-A" },
  { id: "2", name: "Jane Smith", mrn: "23456789", room: "102-B" },
  { id: "3", name: "Robert Johnson", mrn: "34567890", room: "103-C" },
];

// Placeholder for demonstration - in a real app, this would be fetched from the backend
const MOCK_SOURCE_NOTES = [
  {
    id: "101",
    type: "EM Clinician",
    author: "Dr. Adams",
    timestamp: "2023-10-09T14:30:00Z",
  },
  {
    id: "102",
    type: "Progress",
    author: "Dr. Baker",
    timestamp: "2023-10-09T15:45:00Z",
  },
  {
    id: "103",
    type: "Consult",
    author: "Dr. Chen",
    timestamp: "2023-10-09T16:20:00Z",
  },
];

const Dashboard = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedShift, setSelectedShift] = useState("Day");
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { generateSummary } = useGenerateHandoffSummary();
  const navigate = useNavigate();

  const handleGenerateHandoff = async () => {
    if (!selectedPatient || !selectedShift || selectedNotes.length === 0) {
      alert(
        "Please select a patient, shift type, and at least one source note."
      );
      return;
    }

    setIsGenerating(true);

    try {
      // In a real app, this would use actual IDs
      const summary = await generateSummary(
        selectedPatient.id,
        selectedShift,
        selectedNotes
      );

      // Navigate to the editor page for the new summary
      navigate(`/handoff/${summary._id}`);
    } catch (error) {
      alert(`Error generating handoff summary: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setIsModalOpen(false);
    }
  };

  const toggleNoteSelection = (noteId) => {
    if (selectedNotes.includes(noteId)) {
      setSelectedNotes(selectedNotes.filter((id) => id !== noteId));
    } else {
      setSelectedNotes([...selectedNotes, noteId]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Nurse Dashboard
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
          >
            Generate New Handoff
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Handoff Summaries
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            View and manage patient handoff summaries.
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
                  Patient
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Shift
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Generated
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    John Doe
                  </div>
                  <div className="text-sm text-gray-500">MRN: 12345678</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    Day
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Oct 9, 2023 - 3:45 PM
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Draft
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => navigate("/handoff/123")}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    View/Edit
                  </button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    Jane Smith
                  </div>
                  <div className="text-sm text-gray-500">MRN: 23456789</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                    Night
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Oct 8, 2023 - 7:30 PM
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Finalized
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => navigate("/handoff/456")}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Handoff Modal */}
      {isModalOpen && (
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
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3
                    className="text-lg leading-6 font-medium text-gray-900"
                    id="modal-headline"
                  >
                    Generate New Handoff Summary
                  </h3>
                  <div className="mt-4 text-left">
                    <div className="mb-4">
                      <label className="form-label">Patient</label>
                      <select
                        className="form-input"
                        value={selectedPatient?.id || ""}
                        onChange={(e) => {
                          const patient = MOCK_PATIENTS.find(
                            (p) => p.id === e.target.value
                          );
                          setSelectedPatient(patient || null);
                        }}
                      >
                        <option value="">Select Patient</option>
                        {MOCK_PATIENTS.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.name} - Room {patient.room}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="form-label">Shift Type</label>
                      <div className="mt-1 flex space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            className="form-input h-4 w-4"
                            value="Day"
                            checked={selectedShift === "Day"}
                            onChange={() => setSelectedShift("Day")}
                          />
                          <span className="ml-2">Day</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            className="form-input h-4 w-4"
                            value="Night"
                            checked={selectedShift === "Night"}
                            onChange={() => setSelectedShift("Night")}
                          />
                          <span className="ml-2">Night</span>
                        </label>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label">Source Notes</label>
                      <div className="mt-1 max-h-40 overflow-y-auto border border-gray-300 rounded-md">
                        {MOCK_SOURCE_NOTES.map((note) => (
                          <div
                            key={note.id}
                            className="flex items-center p-2 border-b border-gray-200"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-primary-600"
                              checked={selectedNotes.includes(note.id)}
                              onChange={() => toggleNoteSelection(note.id)}
                            />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {note.type}
                              </div>
                              <div className="text-xs text-gray-500">
                                {note.author} -{" "}
                                {new Date(note.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="btn-primary sm:col-start-2"
                  onClick={handleGenerateHandoff}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generating..." : "Generate Handoff"}
                </button>
                <button
                  type="button"
                  className="btn-outline mt-3 sm:mt-0"
                  onClick={() => setIsModalOpen(false)}
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

export default Dashboard;
