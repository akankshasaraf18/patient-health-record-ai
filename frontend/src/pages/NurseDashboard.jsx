import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const NurseDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API_URL}/patients`);
      setPatients(response.data.patients);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching patients:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Nurse Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome, {user?.firstName} {user?.lastName} -{" "}
                {user?.shift === "day" ? "🌞 Day" : "🌙 Night"} Shift
              </p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">
              My Assigned Patients
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {patients.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Current Shift</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {user?.shift === "day" ? "Day (7AM-7PM)" : "Night (7PM-7AM)"}
            </p>
          </div>
        </div>

        {/* Patients List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">My Patients</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading patients...
            </div>
          ) : patients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No patients assigned to you yet. Contact your doctor for
              assignments.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {patients.map((patient) => (
                <div
                  key={patient._id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer"
                  onClick={() => navigate(`/nurse/patient/${patient._id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        MRN: {patient.mrn}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Active
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Diagnosis:</span>
                      <p className="text-gray-900 font-medium">
                        {patient.diagnosis}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Age:</span>
                      <span className="text-gray-900 font-medium ml-2">
                        {patient.age} years
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Admitted:</span>
                      <span className="text-gray-900 font-medium ml-2">
                        {new Date(patient.admissionDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/nurse/patient/${patient._id}`);
                    }}
                  >
                    Add Report
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NurseDashboard;
