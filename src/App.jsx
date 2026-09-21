import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './Redux/store';
import { Toaster } from 'sonner';

// Layout (public)
import Layout from './pages/Layout';
import Index from './pages/index';
import Contact from './pages/contact';
import Our_cars from './pages/our_cars';
import Details from './pages/Detail';
import About from './pages/About';

// Auth + admin
import Adminlogin from './pages/AdminLogin';
import ProtectedRoute from './pages/ProtectedRoute';
import AdminDashboard from './admin-space/AdminDashboard';

// Public signature page (client-facing, NO auth)
import SignContract from './components/SignContract';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Toaster position="top-right" richColors />

        <Routes>
          {/* Public routes with Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Index />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/our-cars" element={<Our_cars />} />
            <Route path="/details/:id" element={<Details />} />
            <Route path="/about" element={<About />} />
          </Route>

          {/* ===== Public signature page — no auth, no layout ===== */}
          <Route path="/sign-contract/:token" element={<SignContract />} />

          {/* Login */}
          <Route path="/admin" element={<Adminlogin />} />

          {/* Dashboard explicit */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/:section"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;