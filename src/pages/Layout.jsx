import React, { useState, useEffect } from 'react';
import Navbar from './NavBar';
import { Outlet } from 'react-router-dom';
import Footer from './Footer';
import '../Css/Layout.css';

const Layout = () => {

  // Listen for banner visibility changes
  useEffect(() => {
    const handleBannerVisibility = (event) => {
      setBannerVisible(event.detail.isVisible);
    };

    window.addEventListener('bannerVisibilityChange', handleBannerVisibility);
    
    return () => {
      window.removeEventListener('bannerVisibilityChange', handleBannerVisibility);
    };
  }, []);

  return (
    <div className="app-layout">      
      {/* Fixed navbar container with dynamic style */}
      <div 
        
      >
        <Navbar />
      </div>
      
      <div   
      >
        <Outlet />
      </div>
      
      <div className="footer-container">
        <Footer />
      </div>
    </div>
  );
};

export default Layout;