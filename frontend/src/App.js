import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Game from './pages/Game';
import Leaderboard from './pages/Leaderboard';
import ParentDashboard from './pages/ParentDashboard';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Child only */}
          <Route path="/game" element={
            <ProtectedRoute allowedRoles={['child']}>
              <Game />
            </ProtectedRoute>
          } />

          {/* Child + Admin can see leaderboard */}
          <Route path="/leaderboard" element={
            <ProtectedRoute allowedRoles={['child', 'parent', 'admin']}>
              <Leaderboard />
            </ProtectedRoute>
          } />

          {/* Parent only */}
          <Route path="/parent" element={
            <ProtectedRoute allowedRoles={['parent']}>
              <ParentDashboard />
            </ProtectedRoute>
          } />

          {/* Admin only */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPanel />
            </ProtectedRoute>
          } />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;