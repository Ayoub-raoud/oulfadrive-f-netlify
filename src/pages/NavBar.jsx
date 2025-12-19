import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiMenu, FiX } from 'react-icons/fi';
import logo from '../assets/logo1.png';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeLink, setActiveLink] = useState('home');
  const [showAdmin, setShowAdmin] = useState(false);
  const [keySequence, setKeySequence] = useState([]);
  const dispatch = useDispatch();

  // Secret code: OULFA (79-85-76-70-65)
  const secretCode = [79, 85, 76, 70, 65]; // O U L F A

  

  // Secret key sequence detection with toggle functionality
  useEffect(() => {
    const handleKeyPress = (e) => {
      const newSequence = [...keySequence, e.keyCode];
      
      // Keep only the last 5 key presses
      if (newSequence.length > secretCode.length) {
        newSequence.shift();
      }
      setKeySequence(newSequence);

      // Check if sequence matches secret code
      if (JSON.stringify(newSequence) === JSON.stringify(secretCode)) {
        const newAdminState = !showAdmin;
        setShowAdmin(newAdminState);
        
        // Show appropriate notification
        const originalTitle = document.title;
        const message = newAdminState ? "🔓 Admin Access Granted - OULFA" : "🔒 Admin Access Hidden - OULFA";
        const notificationText = newAdminState ? '🔓 Admin Access Unlocked' : '🔒 Admin Access Hidden';
        
        document.title = message;
        
        // Create notification
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: ${newAdminState ? '#000' : '#666'};
          color: #fff;
          padding: 10px 15px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: bold;
          z-index: 10000;
          animation: fadeInOut 3s ease-in-out;
        `;
        notification.textContent = notificationText;
        document.body.appendChild(notification);
        
        // Add animation styles if not already present
        if (!document.querySelector('#notification-styles')) {
          const style = document.createElement('style');
          style.id = 'notification-styles';
          style.textContent = `
            @keyframes fadeInOut {
              0% { opacity: 0; transform: translateY(-10px); }
              10% { opacity: 1; transform: translateY(0); }
              90% { opacity: 1; transform: translateY(0); }
              100% { opacity: 0; transform: translateY(-10px); }
            }
          `;
          document.head.appendChild(style);
        }
        
        // Clean up
        setTimeout(() => {
          document.title = originalTitle;
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 2000);

        // Reset key sequence after successful activation/deactivation
        setKeySequence([]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [keySequence, showAdmin]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsNavbarVisible(false);
      } else {
        setIsNavbarVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLinkClick = (link) => {
    setActiveLink(link);
    setIsMenuOpen(false);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.mobile-nav') && !event.target.closest('.mobile-menu-button')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <>
      <style>
        {`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }

          .navbar-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 50;
            background: #ffffff;
            transition: transform 0.3s ease-in-out;
            border-bottom: 1px solid #e5e5e5;
          }
          
          .navbar-header.hidden {
            transform: translateY(-100%);
          }
          
          .navbar-header.scrolled {
            background: rgba(255, 255, 255, 0.98);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border-bottom: 1px solid rgba(229, 231, 235, 0.8);
          }
          
          .navbar-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 1rem;
          }
          
          @media (min-width: 768px) {
            .navbar-container {
              padding: 0 2rem;
            }
          }
          
          .navbar-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 80px;
          }
          
          .logo-section {
            display: flex;
            align-items: center;
            transition: transform 0.3s ease;
          }
          
          .logo-section:hover {
            transform: translateY(-1px);
          }
          
          .logo-wrapper {
            display: flex;
            align-items: center;
            text-decoration: none;
          }
          
          .logo-image-container {
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            transition: all 0.3s ease;
          }
          
          .logo-image {
            height: 50px;
            width: auto;
            object-fit: contain;
            transition: transform 0.3s ease;
          }
          
          @media (min-width: 768px) {
            .logo-image {
              height: 60px;
            }
          }
          
          @media (min-width: 1024px) {
            .logo-image {
              height: 70px;
            }
          }
          
          .logo-wrapper:hover .logo-image {
            transform: scale(1.05);
          }
          
          .desktop-nav {
            display: none;
          }
          
          @media (min-width: 1024px) {
            .desktop-nav {
              display: flex;
              align-items: center;
              gap: 3rem;
            }
          }
          
          .nav-link {
            color: #374151;
            font-weight: 600;
            transition: all 0.3s ease;
            text-decoration: none;
            font-size: 1rem;
            padding: 0.75rem 0;
            position: relative;
            font-family: 'Inter', sans-serif;
          }
          
          .nav-link::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 0;
            height: 3px;
            background: linear-gradient(90deg, #dc2626, #ef4444);
            border-radius: 2px;
            transition: width 0.3s ease;
          }
          
          .nav-link:hover {
            color: #dc2626;
            transform: translateY(-1px);
          }
          
          .nav-link:hover::before {
            width: 100%;
          }
          
          .nav-link.active {
            color: #dc2626;
          }
          
          .nav-link.active::before {
            width: 100%;
          }
          
          .admin-section {
            display: flex;
            align-items: center;
            gap: 2rem;
          }
          
          .admin-link {
            color: #dc2626;
            font-weight: 600;
            text-decoration: none;
            font-size: 0.95rem;
            padding: 0.6rem 1.2rem;
            border: 2px solid #dc2626;
            border-radius: 10px;
            transition: all 0.3s ease;
            background: transparent;
            font-family: 'Inter', sans-serif;
          }
          
          .admin-link:hover {
            background: #dc2626;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(220, 38, 38, 0.3);
          }
          
          .mobile-menu-button {
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: 2px solid #f3f4f6;
            border-radius: 10px;
            cursor: pointer;
            padding: 0.6rem;
            transition: all 0.3s ease;
            width: 44px;
            height: 44px;
          }
          
          .mobile-menu-button:hover {
            border-color: #dc2626;
            background: #fef2f2;
            transform: scale(1.05);
          }
          
          @media (min-width: 1024px) {
            .mobile-menu-button {
              display: none;
            }
          }
          
          .menu-icon, .close-icon {
            color: #374151;
            transition: color 0.3s ease;
            width: 20px;
            height: 20px;
          }
          
          .mobile-menu-button:hover .menu-icon,
          .mobile-menu-button:hover .close-icon {
            color: #dc2626;
          }
          
          /* Mobile Navigation */
          .mobile-nav {
            border-top: 1px solid #e5e5e5;
            background: #ffffff;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          
          @media (min-width: 768px) {
            .mobile-nav {
              display: none;
            }
          }
          
          .mobile-nav-inner {
            padding-top: 1rem;
            padding-bottom: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .mobile-nav-link {
            display: block;
            color: #374151;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s ease;
            padding: 0.75rem 1rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 0.9rem;
            border-radius: 6px;
            margin: 0 0.5rem;
            font-family: 'Inter', sans-serif;
          }
          
          .mobile-nav-link:hover {
            color: #dc2626;
            background-color: #f8f9fa;
            transform: translateX(4px);
          }
          
          .mobile-admin-link {
            display: block;
            color: #6b7280;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s ease;
            padding: 0.75rem 1rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 0.9rem;
            border-radius: 6px;
            margin: 0 0.5rem;
            animation: pulse 2s infinite;
            font-family: 'Inter', sans-serif;
          }
          
          .mobile-admin-link:hover {
            color: #dc2626;
            background-color: #f8f9fa;
            transform: translateX(4px);
            animation: none;
          }
          
          @keyframes pulse {
            0% { opacity: 0.7; }
            50% { opacity: 1; }
            100% { opacity: 0.7; }
          }
        `}
      </style>
      
      <header className={`navbar-header ${!isNavbarVisible ? 'hidden' : ''} ${lastScrollY > 50 ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <div className="navbar-inner">
            {/* Logo Section - Only the logo image */}
            <div className="logo-section">
              <Link to="/" className="logo-wrapper" onClick={() => handleLinkClick('home')}>
                <div className="logo-image-container">
                  <img 
                    src={logo} 
                    alt="Oulfa Drive Logo" 
                    className="logo-image"
                  />
                </div>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="desktop-nav">
              <Link 
                to="/" 
                className={`nav-link ${activeLink === '/home' ? 'active' : ''}`}
                onClick={() => handleLinkClick('home')}
              >
                Home
              </Link>
              <Link 
                to="/our-cars" 
                className={`nav-link ${activeLink === '/cars' ? 'active' : ''}`}
                onClick={() => handleLinkClick('cars')}
              >
                Our Cars
              </Link>
              <Link 
                to="/about" 
                className={`nav-link ${activeLink === '/about' ? 'active' : ''}`}
                onClick={() => handleLinkClick('about')}
              >
                About Us
              </Link>
              <Link 
                to="/contact" 
                className={`nav-link ${activeLink === '/contact' ? 'active' : ''}`}
                onClick={() => handleLinkClick('contact')}
              >
                Contact
              </Link>
              
              {showAdmin && (
                <div className="admin-section">
                  <Link 
                    to="/admin" 
                    className="admin-link"
                    onClick={() => handleLinkClick('admin')}
                  >
                    Admin Dashboard
                  </Link>
                </div>
              )}
            </nav>
            
            {/* Modern Mobile Menu Button */}
            <button className="mobile-menu-button" onClick={toggleMenu}>
              {isMenuOpen ? (
                <FiX className="close-icon" />
              ) : (
                <FiMenu className="menu-icon" />
              )}
            </button>
          </div>
          
          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="mobile-nav">
              <nav className="mobile-nav-inner">
                <Link 
                  to="/" 
                  className="mobile-nav-link" 
                  onClick={() => handleLinkClick('home')}
                >
                  Home
                </Link>
                <Link 
                  to="/our-cars" 
                  className="mobile-nav-link" 
                  onClick={() => handleLinkClick('cars')}
                >
                  Our Cars
                </Link>
                <Link 
                  to="/about" 
                  className="mobile-nav-link" 
                  onClick={() => handleLinkClick('about')}
                >
                  About Us
                </Link>
                <Link 
                  to="/contact" 
                  className="mobile-nav-link" 
                  onClick={() => handleLinkClick('contact')}
                >
                  Contact
                </Link>
                {showAdmin && (
                  <Link 
                    to="/admin" 
                    className="mobile-admin-link" 
                    onClick={() => handleLinkClick('admin')}
                  >
                    Admin Dashboard
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Navbar;