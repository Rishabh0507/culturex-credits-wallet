import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Nav from '../components/Nav';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Wallet from '../pages/Wallet';
import Campaigns from '../pages/Campaigns';

export default function AppRoutes() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/campaigns"
          element={
            <ProtectedRoute>
              <Campaigns />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/wallet" replace />} />
      </Routes>
    </>
  );
}
