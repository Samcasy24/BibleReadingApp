import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/member/DashboardPage';
import TodayReadingPage from './pages/member/TodayReadingPage';
import PlanPage from './pages/member/PlanPage';
import ProgressPage from './pages/member/ProgressPage';
import GroupPage from './pages/member/GroupPage';
import AdminPage from './pages/admin/AdminPage';
import GroupProgressPage from './pages/admin/GroupProgressPage';
import CreatePlanPage from './pages/admin/CreatePlanPage';
import ManageGroupPage from './pages/admin/ManageGroupPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/reading/today" element={<TodayReadingPage />} />
            <Route path="/plan/:planId" element={<PlanPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/group/:groupId" element={<GroupPage />} />
          </Route>
          <Route element={<ProtectedRoute adminOnly><Layout /></ProtectedRoute>}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/plans/new" element={<CreatePlanPage />} />
            <Route path="/admin/groups/new" element={<ManageGroupPage />} />
            <Route path="/admin/groups/:groupId/edit" element={<ManageGroupPage />} />
            <Route path="/group/:groupId/progress" element={<GroupProgressPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
