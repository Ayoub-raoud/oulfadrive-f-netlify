import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { logoutUtilisateur, selectIsAuthenticated, selectUser } from '../Redux/store';
import AdminSidebar from './AdminSidebar';
import DashboardContent from './DashboardContent';
import UsersManagement from './UsersManagement';
import CarsManagement from './CarsManagement';
import ClientsManagement from './ClientsManagement';
import ReservationsManagement from './ReservationsManagement';
import ContactsManagement from './ContactsManagement';
import AccidentsManagement from './AccidentsManagement';
import MatriculesManagement from './MatriculesManagement';
import CreditManagement from './CreditManagement';
import '../Css/AdminDashboard.css';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { section } = useParams();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  // Use URL param or default to 'dashboard'
  const activeTab = section || 'dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin');
      return;
    }

    // Vérifier si l'onglet actuel est accessible pour le rôle de l'utilisateur
    const userRole = user?.role?.toLowerCase() || 'employe';
    const restrictedTabs = ['users'];
    
    if (userRole === 'employe' && restrictedTabs.includes(activeTab)) {
      // Ne pas changer l'onglet actif, mais afficher le contenu d'accès refusé
    }
  }, [isAuthenticated, navigate, user, activeTab]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUtilisateur()).unwrap();
      navigate('/admin');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  // Update active tab based on URL changes
  const setActiveTab = (tabId) => {
    if (tabId === 'dashboard') {
      navigate('/admin/dashboard');
    } else {
      navigate(`/admin/${tabId}`);
    }
  };

  // Fonction pour vérifier si un onglet est accessible
  const isTabAccessible = (tabId) => {
    const userRole = user?.role?.toLowerCase() || 'employe';
    const restrictedTabs = ['users'];
    
    if (userRole === 'employe' && restrictedTabs.includes(tabId)) {
      return false;
    }
    return true;
  };

  const renderContent = () => {
    const userRole = user?.role?.toLowerCase() || 'employe';
    
    // Afficher l'accès refusé pour les onglets restreints
    if (!isTabAccessible(activeTab)) {
      return (
        <div className="access-denied">
          <div className="access-denied-icon">🔒</div>
          <h3>Accès Restreint</h3>
          <p>Vous n'avez pas la permission d'accéder à la section <strong>{activeTab}</strong>.</p>
          <p className="access-denied-role">
            Disponible pour: <strong>{userRole === 'employe' ? 'Administrateurs uniquement' : 'Tous les rôles'}</strong>
          </p>
          <button 
            className="back-to-dashboard-btn"
            onClick={() => setActiveTab('dashboard')}
          >
            Retour au Tableau de Bord
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'users':
        return <UsersManagement />;
      case 'cars':
        return <CarsManagement />;
      case 'clients':
        return <ClientsManagement />;
      case 'reservations':
        return <ReservationsManagement />;
      case 'contacts':
        return <ContactsManagement />;
      case 'accidents':
        return <AccidentsManagement />;
      case 'matricules':
        return <MatriculesManagement />;
      case 'credit':
        return <CreditManagement />;
      default:
        return <DashboardContent />;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="admin-dashboard scaled-80">
      <AdminSidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
      />
      
      <div className="main-content">
        <div className="top-header">
          <button 
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h2 className="header-title">
            {activeTab === 'dashboard' && 'Aperçu du Tableau de Bord'}
            {activeTab === 'users' && 'Gestion des Utilisateurs'}
            {activeTab === 'cars' && 'Gestion des Véhicules'}
            {activeTab === 'clients' && 'Gestion des Clients'}
            {activeTab === 'reservations' && 'Gestion des Réservations'}
            {activeTab === 'contacts' && 'Messages de Contact'}
            {activeTab === 'accidents' && 'Rapports d\'Accidents'}
            {activeTab === 'matricules' && 'Gestion des Immatriculations'}
            {activeTab === 'credit' && 'Gestion du Crédit'}
            {!isTabAccessible(activeTab) && 'Accès Restreint'}
          </h2>
          <div className="header-actions">
            <div className="user-welcome">
              Bienvenue, {user?.Fullname} ({user?.role || 'employe'})
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Déconnexion
            </button>
          </div>
        </div>

        <div className="content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;