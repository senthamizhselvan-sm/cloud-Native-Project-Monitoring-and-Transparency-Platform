import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import ProjectDocumentsPage from './pages/ProjectDocumentsPage';
import ProjectListPage from './pages/ProjectListPage';
import RegisterPage from './pages/RegisterPage';
import RegisterSuccessPage from './pages/RegisterSuccessPage';
import OfficerDashboard from './pages/OfficerDashboard';
import EngineerDashboard from './pages/EngineerDashboard';
import CitizenDashboard from './pages/CitizenDashboard';
import PublicPortal from './pages/PublicPortal';
import AnalyticsPage from './pages/AnalyticsPage';
import AdminDashboard from './pages/AdminDashboard';
import FeedbackForm from './pages/FeedbackForm';
import FeedbackManagement from './pages/FeedbackManagement';
import MapPage from './pages/MapPage';
import AuditLogsPage from './pages/AuditLogsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/success" element={<RegisterSuccessPage />} />
      
      {/* Public / Citizen routes wrapped in standard top navigation layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectListPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
        <Route path="/projects/:projectId/documents" element={<ProjectDocumentsPage />} />
        <Route path="/public" element={<PublicPortal />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/dashboard/citizen" element={<CitizenDashboard />} />
        <Route path="/feedback/new" element={<FeedbackForm />} />
      </Route>

      {/* Internal / Role Dashboards (They use AppLayout with sidebar themselves) */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/audit" element={<AuditLogsPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/dashboard/officer" element={<OfficerDashboard />} />
      <Route path="/dashboard/engineer" element={<EngineerDashboard />} />
      <Route path="/feedback/manage" element={<FeedbackManagement />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
