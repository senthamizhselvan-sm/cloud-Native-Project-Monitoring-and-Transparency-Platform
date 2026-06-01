import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import ProjectListPage from './pages/ProjectListPage';
import RegisterPage from './pages/RegisterPage';
import OfficerDashboard from './pages/OfficerDashboard';
import EngineerDashboard from './pages/EngineerDashboard';
import CitizenDashboard from './pages/CitizenDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectListPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
        <Route path="/dashboard/officer" element={<OfficerDashboard />} />
        <Route path="/dashboard/engineer" element={<EngineerDashboard />} />
        <Route path="/dashboard/citizen" element={<CitizenDashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
