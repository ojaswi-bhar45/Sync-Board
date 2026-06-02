import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomeLayout from './components/HomeLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Feed from './pages/Feed';
import MyFeed from './pages/MyFeed';
import CreateProject from './pages/CreateProject';
import Profile from './components/Profile';
import ProjectsList from './components/ProjectsList';
import Workspace from './components/Workspace';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute><HomeLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="feed" replace />} />
          <Route path="feed" element={<Feed />} />
          <Route path="my-feed" element={<MyFeed />} />
          <Route path="create" element={<CreateProject />} />
          <Route path="profile" element={<Profile />} />
          <Route path="projects" element={<ProjectsList />} />
          <Route path="workspace/:projectId" element={<Workspace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
