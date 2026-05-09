import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isNurse, isDoctor } = useAuth();

  const [patient, setPatient] = useState(null);
  const [entries, setEntries] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [entryType, setEntryType] = useState("vital");
  const [entryTime, setEntryTime] = useState(""); // New: specific time for entry

  // Vital signs form state
  const [vitalData, setVitalData] = useState({
    heartRate: "",
    bloodPressure: "",
    temperature: "",
    respiratoryRate: "",
    oxygenSaturation: "",
  });

  // Medication form state
  const [medicationData, setMedicationData] = useState({
    name: "",
    dose: "",
    route: "",
  });

  // General note
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    fetchPatientDetails();
    fetchEntries();
    if (isDoctor) {
      fetchSummaries();
    }
  }, [id]);

  const fetchPatientDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/patients/${id}`);
      setPatient(response.data.patient);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching patient:", error);
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    try {
      const response = await axios.get(`${API_URL}/patients/${id}/entries`);
      console.log("📋 Fetched entries:", response.data.entries);
      // Log first entry to check notes field
      if (response.data.entries.length > 0) {
        console.log(
          "📝 First entry notes field:",
          response.data.entries[0].notes
        );
      }
      setEntries(response.data.entries);
    } catch (error) {
      console.error("Error fetching entries:", error);
    }
  };

  const fetchSummaries = async () => {
    try {
      const response = await axios.get(`${API_URL}/patients/${id}/summaries`);
      setSummaries(response.data.summaries);
    } catch (error) {
      console.error("Error fetching summaries:", error);
    }
  };

  const handleCreateEntry = async (e) => {
    e.preventDefault();

    let payload = {};

    switch (entryType) {
      case "vital":
        // Transform field names to match backend model
        payload = {
          HR: vitalData.heartRate,
          BP: vitalData.bloodPressure,
          Temp: vitalData.temperature,
          RR: vitalData.respiratoryRate,
          O2Sat: vitalData.oxygenSaturation,
        };
        break;
      case "medication":
        // Transform field names to match backend model
        payload = {
          medication_name: medicationData.name,
          dose: medicationData.dose,
          route: medicationData.route,
        };
        break;
      case "note":
      case "assessment":
      case "event":
        payload = { text: noteText };
        break;
    }

    try {
      const requestData = {
        type: entryType,
        payload,
        notes: noteText,
        timestamp: entryTime ? new Date(entryTime).toISOString() : undefined,
      };

      console.log("📤 Sending entry data:", requestData);
      console.log("📝 Notes field value:", noteText);

      await axios.post(`${API_URL}/patients/${id}/entries`, requestData);

      // Reset form
      setVitalData({
        heartRate: "",
        bloodPressure: "",
        temperature: "",
        respiratoryRate: "",
        oxygenSaturation: "",
      });
      setMedicationData({
        name: "",
        dose: "",
        route: "",
      });
      setNoteText("");
      setEntryTime(""); // Reset time
      setShowEntryForm(false);

      // Refresh entries
      fetchEntries();

      alert("Entry added successfully!");
    } catch (error) {
      alert(error.response?.data?.error || "Failed to create entry");
    }
  };

  const handleGenerateSummary = async () => {
    if (!confirm("Generate a comprehensive summary for this patient?")) return;

    setGeneratingSummary(true);
    try {
      const response = await axios.post(
        `${API_URL}/patients/${id}/summaries/generate`
      );
      alert("Summary generated successfully!");

      // Refresh summaries if doctor
      if (isDoctor) {
        fetchSummaries();
      }

      // Navigate to summary
      navigate(`/summary/${response.data.summary._id}`);
    } catch (error) {
      alert(error.response?.data?.error || "Failed to generate summary");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  };

  if (loading) {
    return <div className="p-8 text-center">Loading patient details...</div>;
  }

  if (!patient) {
    return (
      <div className="p-8 text-center text-red-600">Patient not found</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={() =>
                  navigate(isNurse ? "/nurse/dashboard" : "/doctor/dashboard")
                }
                className="text-blue-600 hover:text-blue-800 mb-2"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h1>
              <p className="text-gray-600">MRN: {patient.mrn}</p>
            </div>

            <div className="flex gap-3">
              {isNurse && (
                <button
                  onClick={() => setShowEntryForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + Add Report
                </button>
              )}

              <button
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingSummary ? "Generating..." : "📊 Summarize Patient"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Patient Information
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Age</p>
              <p className="text-lg font-medium">{patient.age} years</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Admission Date</p>
              <p className="text-lg font-medium">
                {new Date(patient.admissionDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Diagnosis</p>
              <p className="text-lg font-medium">{patient.diagnosis}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-medium capitalize">{patient.status}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-600">Day Nurse</p>
              <p className="text-lg font-medium">
                {patient.dayNurse
                  ? `${patient.dayNurse.firstName} ${patient.dayNurse.lastName}`
                  : "Not assigned"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Night Nurse</p>
              <p className="text-lg font-medium">
                {patient.nightNurse
                  ? `${patient.nightNurse.firstName} ${patient.nightNurse.lastName}`
                  : "Not assigned"}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline of Entries */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              Patient Timeline
            </h2>
          </div>

          {entries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No entries yet.{" "}
              {isNurse && 'Click "Add Report" to create the first entry!'}
            </div>
          ) : (
            <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
              {entries.map((entry) => (
                <div
                  key={entry._id}
                  className="border-l-4 border-blue-500 bg-gray-50 p-4 rounded-r-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {entry.type.toUpperCase()}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {entry.shift === "day" ? "🌞 Day" : "🌙 Night"} Shift
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>

                  {entry.type === "vital" && entry.payload && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
                      <div>
                        <p className="text-xs text-gray-600">Heart Rate</p>
                        <p className="text-sm font-medium">
                          {entry.payload.HR || "N/A"} bpm
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">BP</p>
                        <p className="text-sm font-medium">
                          {entry.payload.BP || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Temp</p>
                        <p className="text-sm font-medium">
                          {entry.payload.Temp || "N/A"}°F
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">RR</p>
                        <p className="text-sm font-medium">
                          {entry.payload.RR || "N/A"} /min
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">SpO2</p>
                        <p className="text-sm font-medium">
                          {entry.payload.O2Sat || "N/A"}%
                        </p>
                      </div>
                    </div>
                  )}

                  {entry.type === "medication" && entry.payload && (
                    <div className="mt-3">
                      <p className="text-sm font-medium">
                        {entry.payload.medication_name || "N/A"} -{" "}
                        {entry.payload.dose || "N/A"} (
                        {entry.payload.route || "N/A"})
                      </p>
                    </div>
                  )}

                  {(entry.type === "note" ||
                    entry.type === "assessment" ||
                    entry.type === "event") &&
                    entry.payload?.text && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-800 italic">
                          "{entry.payload.text}"
                        </p>
                      </div>
                    )}

                  {/* Display optional notes field for all entry types */}
                  {entry.notes && (
                    <div className="mt-3 bg-yellow-50 border-l-2 border-yellow-400 p-3 rounded">
                      <p className="text-xs font-semibold text-yellow-800 mb-1">
                        📝 Additional Notes:
                      </p>
                      <p className="text-sm text-gray-700">{entry.notes}</p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    By: {entry.authorId?.firstName} {entry.authorId?.lastName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Entry Modal */}
      {showEntryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Add Patient Report</h2>

            <form onSubmit={handleCreateEntry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="vital">Vital Signs</option>
                  <option value="medication">Medication</option>
                  <option value="note">General Note</option>
                  <option value="assessment">Assessment</option>
                  <option value="event">Event</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time of Report (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Leave empty for current time"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to use current time, or select a specific time
                  (e.g., 8:00 AM - 10:00 AM report)
                </p>
              </div>

              {entryType === "vital" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heart Rate (bpm)
                    </label>
                    <input
                      type="number"
                      value={vitalData.heartRate}
                      onChange={(e) =>
                        setVitalData({
                          ...vitalData,
                          heartRate: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Blood Pressure
                    </label>
                    <input
                      type="text"
                      placeholder="120/80"
                      value={vitalData.bloodPressure}
                      onChange={(e) =>
                        setVitalData({
                          ...vitalData,
                          bloodPressure: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temperature (°F)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={vitalData.temperature}
                      onChange={(e) =>
                        setVitalData({
                          ...vitalData,
                          temperature: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Respiratory Rate (/min)
                    </label>
                    <input
                      type="number"
                      value={vitalData.respiratoryRate}
                      onChange={(e) =>
                        setVitalData({
                          ...vitalData,
                          respiratoryRate: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Oxygen Saturation (%)
                    </label>
                    <input
                      type="number"
                      value={vitalData.oxygenSaturation}
                      onChange={(e) =>
                        setVitalData({
                          ...vitalData,
                          oxygenSaturation: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {entryType === "medication" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medication Name
                    </label>
                    <input
                      type="text"
                      value={medicationData.name}
                      onChange={(e) =>
                        setMedicationData({
                          ...medicationData,
                          name: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dose
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 500mg"
                      value={medicationData.dose}
                      onChange={(e) =>
                        setMedicationData({
                          ...medicationData,
                          dose: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Route
                    </label>
                    <select
                      value={medicationData.route}
                      onChange={(e) =>
                        setMedicationData({
                          ...medicationData,
                          route: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select route</option>
                      <option value="oral">Oral</option>
                      <option value="IV">IV</option>
                      <option value="IM">IM</option>
                      <option value="subcutaneous">Subcutaneous</option>
                      <option value="topical">Topical</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                  placeholder={
                    entryType === "vital"
                      ? "Additional observations..."
                      : "Enter your notes..."
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEntryForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetail;
