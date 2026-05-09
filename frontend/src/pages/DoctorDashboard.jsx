import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateNurseModal, setShowCreateNurseModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [availableNurses, setAvailableNurses] = useState({
    dayNurses: [],
    nightNurses: [],
  });

  useEffect(() => {
    fetchPatients();
    fetchAvailableNurses();

    // Refresh data when window regains focus (user comes back from another page)
    const handleFocus = () => {
      fetchPatients();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [location]); // Re-run when location changes (navigating back)

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

  const fetchAvailableNurses = async () => {
    try {
      const response = await axios.get(`${API_URL}/patients/nurses/available`);
      setAvailableNurses(response.data);
    } catch (error) {
      console.error("Error fetching nurses:", error);
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await axios.post(`${API_URL}/patients`, {
        mrn: formData.get("mrn"),
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        dateOfBirth: formData.get("dateOfBirth"),
        diagnosis: formData.get("diagnosis"),
        dayNurseId: formData.get("dayNurse") || undefined,
        nightNurseId: formData.get("nightNurse") || undefined,
      });

      setShowCreateModal(false);
      fetchPatients();
      e.target.reset();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to create patient");
    }
  };

  const handleAssignNurse = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await axios.post(
        `${API_URL}/patients/${selectedPatient._id}/assign-nurse`,
        {
          dayNurseId: formData.get("dayNurse") || undefined,
          nightNurseId: formData.get("nightNurse") || undefined,
        }
      );

      setShowAssignModal(false);
      setSelectedPatient(null);
      fetchPatients();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to assign nurses");
    }
  };

  const handleCreateNurse = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await axios.post(`${API_URL}/auth/create-nurse`, {
        email: formData.get("email"),
        password: formData.get("password"),
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        shift: formData.get("shift"),
      });

      alert("Nurse created successfully!");
      setShowCreateNurseModal(false);
      fetchAvailableNurses(); // Refresh nurse list
      e.target.reset();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to create nurse");
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
                Doctor Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome, Dr. {user?.firstName} {user?.lastName}
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
              Total Patients
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {patients.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Active Today</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {patients.length}
            </p>
          </div>
        </div>

        {/* Create Patient and Nurse Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            + Create New Patient
          </button>
          <button
            onClick={() => setShowCreateNurseModal(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
          >
            + Create New Nurse
          </button>
        </div>

        {/* Patients Table */}
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
              No patients found. Create your first patient!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      MRN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Patient Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Diagnosis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Day Nurse
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Night Nurse
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr key={patient._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {patient.mrn}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {patient.diagnosis}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {patient.dayNurse ? (
                          `${patient.dayNurse.firstName} ${patient.dayNurse.lastName}`
                        ) : (
                          <span className="text-orange-600">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {patient.nightNurse ? (
                          `${patient.nightNurse.firstName} ${patient.nightNurse.lastName}`
                        ) : (
                          <span className="text-orange-600">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setSelectedPatient(patient);
                            setShowAssignModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Assign Nurses
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/doctor/patient/${patient._id}`)
                          }
                          className="text-green-600 hover:text-green-800"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Patient Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Create New Patient</h2>
            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MRN
                  </label>
                  <input
                    name="mrn"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    name="dateOfBirth"
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    name="firstName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    name="lastName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnosis
                </label>
                <textarea
                  name="diagnosis"
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day Nurse (Optional)
                  </label>
                  <select
                    name="dayNurse"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Day Nurse</option>
                    {availableNurses.dayNurses.map((nurse) => (
                      <option key={nurse._id} value={nurse._id}>
                        {nurse.firstName} {nurse.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Night Nurse (Optional)
                  </label>
                  <select
                    name="nightNurse"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Night Nurse</option>
                    {availableNurses.nightNurses.map((nurse) => (
                      <option key={nurse._id} value={nurse._id}>
                        {nurse.firstName} {nurse.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Nurse Modal */}
      {showAssignModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              Assign Nurses to {selectedPatient.firstName}{" "}
              {selectedPatient.lastName}
            </h2>
            <form onSubmit={handleAssignNurse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day Nurse
                </label>
                <select
                  name="dayNurse"
                  defaultValue={selectedPatient.dayNurse?._id || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Day Nurse</option>
                  {availableNurses.dayNurses.map((nurse) => (
                    <option key={nurse._id} value={nurse._id}>
                      {nurse.firstName} {nurse.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Night Nurse
                </label>
                <select
                  name="nightNurse"
                  defaultValue={selectedPatient.nightNurse?._id || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Night Nurse</option>
                  {availableNurses.nightNurses.map((nurse) => (
                    <option key={nurse._id} value={nurse._id}>
                      {nurse.firstName} {nurse.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedPatient(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Assign Nurses
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Nurse Modal */}
      {showCreateNurseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Create New Nurse</h2>
            <form onSubmit={handleCreateNurse} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    name="firstName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    name="lastName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 6 characters
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shift
                </label>
                <select
                  name="shift"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="day">Day Shift</option>
                  <option value="night">Night Shift</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateNurseModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create Nurse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
