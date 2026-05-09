import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DoctorDashboard from "./pages/DoctorDashboard";
import NurseDashboard from "./pages/NurseDashboard";
import PatientDetail from "./pages/PatientDetail";
import SummaryDetail from "./pages/SummaryDetail";
import MLModelPage from "./pages/MLModelPage";
import LLMGenerator from "./pages/LLMGenerator";
import NotFound from "./pages/NotFound";

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Doctor routes */}
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute requireRole="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/patient/:id"
          element={
            <ProtectedRoute requireRole="doctor">
              <PatientDetail />
            </ProtectedRoute>
          }
        />

        {/* Nurse routes */}
        <Route
          path="/nurse/dashboard"
          element={
            <ProtectedRoute requireRole="nurse">
              <NurseDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nurse/patient/:id"
          element={
            <ProtectedRoute requireRole="nurse">
              <PatientDetail />
            </ProtectedRoute>
          }
        />

        {/* Shared routes (authenticated) */}
        <Route
          path="/summary/:id"
          element={
            <ProtectedRoute>
              <SummaryDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ml-model"
          element={
            <ProtectedRoute>
              <MLModelPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/llm-generator"
          element={
            <ProtectedRoute>
              <LLMGenerator />
            </ProtectedRoute>
          }
        />

        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
