import React from 'react';
import {
  FaTachometerAlt, FaUsers, FaCar, FaUser, FaCalendarAlt,
  FaEnvelope, FaExclamationTriangle, FaIdCard, FaCog, FaCreditCard, FaLock
} from 'react-icons/fa';

const AdminSidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, user }) => {
  // Define all possible menu items
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt />, roles: ['admin', 'employee'] },
    { id: 'users', label: 'Utilisateurs', icon: <FaUsers />, roles: ['admin'] },
    { id: 'cars', label: 'Véhicules', icon: <FaCar />, roles: ['admin', 'employee'] },
    { id: 'clients', label: 'Clients', icon: <FaUser />, roles: ['admin', 'employee'] },
    { id: 'reservations', label: 'Réservations', icon: <FaCalendarAlt />, roles: ['admin', 'employee'] },
    { id: 'contacts', label: 'Contacts', icon: <FaEnvelope />, roles: ['admin', 'employee'] },
    { id: 'accidents', label: 'Accidents', icon: <FaExclamationTriangle />, roles: ['admin', 'employee'] },
    { id: 'matricules', label: 'Immatriculations', icon: <FaIdCard />, roles: ['admin', 'employee'] },
    { id: 'credit', label: 'Crédit', icon: <FaCreditCard />, roles: ['admin', 'employee'] }
  ];

  const userRole = user?.role?.toLowerCase() || 'employee';

  // Check if item is accessible for current user
  const isItemAccessible = (item) => {
    return item.roles.includes(userRole);
  };

  const handleItemClick = (itemId) => {
    const item = allMenuItems.find(item => item.id === itemId);
    if (item && isItemAccessible(item)) {
      setActiveTab(itemId);
      setSidebarOpen(false);
    }
    // If not accessible, do nothing (block the click)
  };

  return (
    <>
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .sidebar {
          width: 280px;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: white;
          padding: 0;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          overflow-y: auto;
          overflow-x: hidden; /* Prevent horizontal scroll */
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          transition: transform 0.3s ease;
          transform-origin: left top;
        }

        .scaled-80 .sidebar {
          transform: scale(0.8);
          width: 350px; /* Compensate for scaling */
          height: 125vh; /* Compensate for scaling */
          overflow-x: hidden; /* Prevent horizontal scroll in scaled mode */
        }

        .sidebar.open {
          transform: translateX(0);
        }

        .scaled-80 .sidebar.open {
          transform: scale(0.8) translateX(0);
        }

        .sidebar-header {
          padding: 30px 25px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.2);
        }

        .sidebar-header h1 {
          font-size: 1.8rem;
          font-weight: 700;
          color: #f8fafc;
          margin-bottom: 5px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .sidebar-header p {
          color: #cbd5e1;
          font-size: 0.9rem;
          font-weight: 400;
        }

        .user-info {
          padding: 20px 25px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.1);
        }

        .user-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #f8fafc;
          margin-bottom: 8px;
        }

        .user-role {
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 500;
          background: rgba(255, 255, 255, 0.1);
          padding: 6px 12px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .role-badge {
          text-transform: capitalize;
        }

        .nav-menu {
          padding: 25px 0;
          width: 100%;
        }

        .nav-item {
          display: flex;
          align-items: center;
          padding: 15px 25px;
          color: #cbd5e1;
          text-decoration: none;
          transition: all 0.3s ease;
          border-left: 4px solid transparent;
          cursor: pointer;
          font-weight: 500;
          position: relative;
          width: 100%;
        }

        .nav-item.accessible:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #f8fafc;
          border-left-color: #3b82f6;
        }

        .nav-item.restricted {
          cursor: not-allowed;
          opacity: 0.6;
          pointer-events: none;
          user-select: none;
        }

        .nav-item.active.accessible {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border-left-color: #3b82f6;
        }

        .nav-item.active.restricted {
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
          border-left-color: #6b7280;
        }

        .nav-icon {
          width: 20px;
          height: 20px;
          margin-right: 15px;
          opacity: 0.8;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .nav-item.accessible .nav-icon {
          opacity: 0.8;
        }

        .nav-item.active.accessible .nav-icon {
          opacity: 1;
        }

        .nav-item.restricted .nav-icon {
          opacity: 0.5;
        }

        .lock-icon {
          margin-left: auto;
          opacity: 0.7;
          font-size: 0.8rem;
          flex-shrink: 0;
        }

        .restricted-tooltip {
          position: absolute;
          left: 100%;
          top: 50%;
          margin-left: 10px;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          pointer-events: none;
          z-index: 1001;
          min-width: max-content;
        }

        .restricted-tooltip::before {
          content: '';
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border: 6px solid transparent;
          border-right-color: rgba(0, 0, 0, 0.9);
        }

        .nav-item.restricted:hover .restricted-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translateY(-50%);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
            overflow-x: hidden;
          }
          
          .sidebar.open {
            transform: translateX(0);
          }

          .scaled-80 .sidebar {
            transform: scale(0.8) translateX(-100%);
          }
          
          .scaled-80 .sidebar.open {
            transform: scale(0.8) translateX(0);
          }

          .restricted-tooltip {
            display: none; /* Hide tooltip on mobile */
          }

          .nav-item {
            padding: 12px 20px;
          }
        }

        @media (max-width: 480px) {
          .sidebar {
            width: 260px;
          }
          
          .scaled-80 .sidebar {
            width: 325px;
          }
          
          .sidebar-header {
            padding: 20px;
          }
          
          .sidebar-header h1 {
            font-size: 1.5rem;
          }
          
          .user-info {
            padding: 15px 20px;
          }
          
          .nav-item {
            padding: 12px 20px;
            font-size: 0.9rem;
          }
        }

        /* Prevent horizontal scroll globally */
        body {
          overflow-x: hidden;
        }

        .admin-dashboard {
          overflow-x: hidden;
        }

        .main-content {
          overflow-x: hidden;
        }
      `}</style>

      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>OULFA DRIVE</h1>
          <p>Admin Dashboard</p>
        </div>
        
        <div className="user-info">
          <div className="user-name">{user?.Fullname || 'Admin User'}</div>
          <div className="user-role">
            <FaCog />
            <span className="role-badge">{user?.role || 'employee'}</span>
          </div>
        </div>

        <nav className="nav-menu">
          {allMenuItems.map(item => {
            const isAccessible = isItemAccessible(item);
            const isActive = activeTab === item.id;
            
            return (
              <div 
                key={item.id}
                className={`nav-item ${isAccessible ? 'accessible' : 'restricted'} ${isActive ? 'active' : ''}`}
                onClick={() => handleItemClick(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label" style={{flex: 1}}>{item.label}</span>
                {!isAccessible && (
                  <>
                    <span className="lock-icon">
                      <FaLock />
                    </span>
                    <div className="restricted-tooltip">
                      Requires {item.roles.join(' or ')} role
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default AdminSidebar;