import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './Redux/store';

// Layout
import Layout from './pages/Layout';
import Index from './pages/index';
import Contact from './pages/contact';
import Our_cars from './pages/our_cars';
import Adminlogin from './pages/AdminLogin';
import Details from './pages/Detail';
import About from './pages/About';
import AdminDashboard from './admin-space/AdminDashboard';
import ProtectedRoute from './pages/ProtectedRoute';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {/* Public Routes with Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Index />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/our-cars" element={<Our_cars />} />
            <Route path="/details/:id" element={<Details />} />
            <Route path="/about" element={<About />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin" element={<Adminlogin />} />
          
          {/* Protected Admin Dashboard with cleaner URLs */}
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
          
          {/* Redirect to home for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;