import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaPlus, FaEdit, FaTrash, FaFileExport, FaDatabase,
  FaCheck, FaTimes, FaUserCheck, FaUserSlash,
  FaList, FaTh, FaEnvelope, FaPhone, FaCalendar,
  FaKey, FaUserTag, FaUserCircle, FaExclamationTriangle,
  FaSearch, FaFilter
} from 'react-icons/fa';
import {
  fetchUtilisateurs,
  createUtilisateur,
  updateUtilisateur,
  deleteUtilisateur,
  toggleUtilisateurStatus,
  updateUtilisateurStatus,
  selectUtilisateurs,
  selectUtilisateursLoading
} from '../Redux/store';
import AdminModal from './AdminModal';

const GestionUtilisateurs = () => {
  const dispatch = useDispatch();
  const utilisateurs = useSelector(selectUtilisateurs);
  const loading = useSelector(selectUtilisateursLoading);
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'cards'
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({
    type: '', // 'delete', 'activate', 'deactivate'
    title: '',
    message: '',
    user: null,
    onConfirm: null
  });

  // États pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'admin', 'employee'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

  useEffect(() => {
    dispatch(fetchUtilisateurs());
  }, [dispatch]);

  // Filtrer les utilisateurs basé sur le terme de recherche et les filtres
  const filteredUsers = utilisateurs.filter(user => {
    const matchesSearch = user.Fullname.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreate = () => {
    setModalType('create');
    setEditingItem(null);
    setFormData({ 
      Fullname: '', 
      password: '', 
      password_confirmation: '', 
      role: 'employee',
      status: 'active' 
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setModalType('edit');
    setEditingItem(item);
    setFormData({ 
      ...item, 
      password: '',
      password_confirmation: '' 
    });
    setShowModal(true);
  };

  const showDeleteConfirmation = (user) => {
    setConfirmationConfig({
      type: 'delete',
      title: 'Supprimer l\'utilisateur',
      message: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.Fullname}" ? Cette action est irréversible.`,
      user: user,
      onConfirm: () => confirmDelete(user.id)
    });
    setShowConfirmation(true);
  };

  const showStatusConfirmation = (user, newStatus) => {
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    setConfirmationConfig({
      type: action,
      title: `${action === 'activate' ? 'Activer' : 'Désactiver'} l'utilisateur`,
      message: `Êtes-vous sûr de vouloir ${action === 'activate' ? 'activer' : 'désactiver'} l'utilisateur "${user.Fullname}" ?`,
      user: user,
      onConfirm: () => confirmToggleStatus(user)
    });
    setShowConfirmation(true);
  };

  const confirmDelete = async (id) => {
    try {
      await dispatch(deleteUtilisateur(id)).unwrap();
      setShowConfirmation(false);
      showSuccessMessage('Utilisateur supprimé avec succès !');
    } catch (error) {
      showErrorMessage('Erreur lors de la suppression : ' + error);
    }
  };

  const confirmToggleStatus = async (user) => {
    try {
      await dispatch(toggleUtilisateurStatus(user.id)).unwrap();
      setShowConfirmation(false);
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      showSuccessMessage(`Utilisateur ${newStatus === 'active' ? 'activé' : 'désactivé'} avec succès !`);
    } catch (error) {
      showErrorMessage('Erreur lors de la mise à jour du statut : ' + error);
    }
  };

  const handleUpdateStatus = async (userId, status) => {
    try {
      await dispatch(updateUtilisateurStatus({ utilisateurId: userId, status })).unwrap();
      showSuccessMessage(`Statut utilisateur mis à jour vers ${status} avec succès !`);
    } catch (error) {
      showErrorMessage('Erreur lors de la mise à jour du statut : ' + error);
    }
  };

  const showSuccessMessage = (message) => {
    // Créer l'élément de notification de succès
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <FaCheck class="notification-icon" />
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(notification);

    // Supprimer après 3 secondes
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const showErrorMessage = (message) => {
    // Créer l'élément de notification d'erreur
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <FaTimes class="notification-icon" />
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(notification);

    // Supprimer après 5 secondes
    setTimeout(() => {
      notification.remove();
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Préparer les données pour l'API - supprimer les champs de mot de passe vides et la confirmation
      const submitData = { ...formData };
      
      if (!submitData.password) {
        delete submitData.password;
        delete submitData.password_confirmation;
      }

      if (modalType === 'create') {
        await dispatch(createUtilisateur(submitData)).unwrap();
        showSuccessMessage('Utilisateur créé avec succès !');
      } else {
        await dispatch(updateUtilisateur({ id: editingItem.id, data: submitData })).unwrap();
        showSuccessMessage('Utilisateur mis à jour avec succès !');
      }
      setShowModal(false);
    } catch (error) {
      showErrorMessage('Erreur : ' + error);
    }
    finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    const usersToExport = filteredUsers.length > 0 ? filteredUsers : utilisateurs;
    
    if (!usersToExport || usersToExport.length === 0) {
      showErrorMessage('Aucune donnée à exporter !');
      return;
    }

    const headers = ['ID', 'Nom Complet', 'Rôle', 'Statut', 'Date de Création', 'Dernière Mise à Jour'];
    const csvContent = [
      headers.join(','),
      ...usersToExport.map(user => [
        user.id,
        `"${user.Fullname}"`,
        user.role,
        user.status,
        new Date(user.created_at).toLocaleDateString(),
        new Date(user.updated_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `export_utilisateurs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccessMessage('CSV exporté avec succès !');
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { class: 'role-badge admin', text: 'Administrateur', icon: FaUserTag },
      employee: { class: 'role-badge employee', text: 'Membre Équipe', icon: FaUserCircle }
    };

    const config = roleConfig[role] || { class: 'role-badge employee', text: role, icon: FaUserCircle };
    const IconComponent = config.icon;
    
    return (
      <span className={config.class}>
        <IconComponent className="badge-icon" />
        {config.text}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { class: 'status-badge active', text: 'Actif', icon: FaCheck },
      inactive: { class: 'status-badge inactive', text: 'Inactif', icon: FaTimes }
    };

    const config = statusConfig[status] || { class: 'status-badge inactive', text: status, icon: FaTimes };
    const IconComponent = config.icon;
    
    return (
      <span className={config.class}>
        <IconComponent className="badge-icon" />
        {config.text}
      </span>
    );
  };

  const getStatusStats = () => {
    const activeUsers = utilisateurs.filter(user => user.status === 'active').length;
    const inactiveUsers = utilisateurs.filter(user => user.status === 'inactive').length;
    const adminUsers = utilisateurs.filter(user => user.role === 'admin').length;
    const employeeUsers = utilisateurs.filter(user => user.role === 'employee').length;

    return { activeUsers, inactiveUsers, adminUsers, employeeUsers };
  };

  // Effacer tous les filtres
  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const stats = getStatusStats();

  // Afficher la vue en cartes
  const renderUserCards = () => (
    <div className="users-grid">
      {filteredUsers.map(user => (
        <div key={user.id} className="user-card">
          <div className="card-header">
            <div className="user-avatar">
              <div className="avatar-circle">
                {user.Fullname.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className="user-status-indicator" data-status={user.status}></div>
            </div>
            <div className="user-main-info">
              <h3 className="user-name">{user.Fullname}</h3>
              <div className="user-meta">
                {getRoleBadge(user.role)}
                {getStatusBadge(user.status)}
              </div>
            </div>
          </div>
          
          <div className="card-divider"></div>

          <div className="user-details">
            <div className="detail-item">
              <FaKey className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">ID Utilisateur</span>
                <span className="detail-value">#{user.id}</span>
              </div>
            </div>
            <div className="detail-item">
              <FaCalendar className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Membre depuis</span>
                <span className="detail-value">{new Date(user.created_at).toLocaleDateString('fr-FR', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>
            <div className="detail-item">
              <FaUserCheck className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Dernière mise à jour</span>
                <span className="detail-value">{new Date(user.updated_at).toLocaleDateString('fr-FR', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>
          </div>

          <div className="card-divider"></div>

          <div className="card-actions">
            <button 
              className="btn-action btn-edit" 
              onClick={() => handleEdit(user)}
              title="Modifier l'utilisateur"
            >
              <FaEdit className="action-icon" />
              <span>Modifier</span>
            </button>
            <button 
              className={`btn-action ${user.status === 'active' ? 'btn-suspend' : 'btn-activate'}`}
              onClick={() => showStatusConfirmation(user, user.status === 'active' ? 'inactive' : 'active')}
              title={user.status === 'active' ? 'Désactiver l\'utilisateur' : 'Activer l\'utilisateur'}
            >
              {user.status === 'active' ? <FaUserSlash className="action-icon" /> : <FaUserCheck className="action-icon" />}
              <span>{user.status === 'active' ? 'Désactiver' : 'Activer'}</span>
            </button>
            <button 
              className="btn-action btn-delete" 
              onClick={() => showDeleteConfirmation(user)}
              title="Supprimer l'utilisateur"
            >
              <FaTrash className="action-icon" />
              <span>Supprimer</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // Afficher la vue tableau
  const renderTableView = () => (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nom Complet</th>
          <th>Rôle</th>
          <th>Statut</th>
          <th>Date de Création</th>
          <th>Dernière Mise à Jour</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredUsers.map(user => (
          <tr key={user.id}>
            <td className="user-id">#{user.id}</td>
            <td className="user-name">{user.Fullname}</td>
            <td>{getRoleBadge(user.role)}</td>
            <td>{getStatusBadge(user.status)}</td>
            <td className="date-cell">{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
            <td className="date-cell">{new Date(user.updated_at).toLocaleDateString('fr-FR')}</td>
            <td>
              <div className="action-buttons">
                <button 
                  className="btn-action btn-edit" 
                  onClick={() => handleEdit(user)}
                  title="Modifier l'utilisateur"
                >
                  <FaEdit />
                </button>
                <button 
                  className={`btn-action ${user.status === 'active' ? 'btn-suspend' : 'btn-activate'}`}
                  onClick={() => showStatusConfirmation(user, user.status === 'active' ? 'inactive' : 'active')}
                  title={user.status === 'active' ? 'Désactiver l\'utilisateur' : 'Activer l\'utilisateur'}
                >
                  {user.status === 'active' ? <FaUserSlash /> : <FaUserCheck />}
                </button>
                <button 
                  className="btn-action btn-delete" 
                  onClick={() => showDeleteConfirmation(user)}
                  title="Supprimer l'utilisateur"
                >
                  <FaTrash />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (loading) {
    return (
      <div className="users-management loading-spinner">
        <div className="spinner"></div>
        <p>Chargement des utilisateurs...</p>
      </div>
    );
  }

  return (
    <div className="users-management">
      <div className="section-header">
        <div className="header-content">
          <h1 className="section-title">
            <FaUserCheck className="title-icon" />
            Gestion des Utilisateurs           
          </h1>
          <p className="section-subtitle">Gérez les accès système et les permissions des utilisateurs</p>
        </div>
        <div className="section-actions">
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vue Liste"
            >
              <FaList />
              <span>Liste</span>
            </button>
            <button 
              className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Vue Cartes"
            >
              <FaTh />
              <span>Cartes</span>
            </button>
          </div>
          <button className="btn btn-primary" onClick={handleCreate}>
            <FaPlus className="btn-icon" />
            Nouvel Utilisateur
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            <FaFileExport className="btn-icon" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Cartes de Statistiques */}
      <div className="stats-grid">
        <div className="stat-card stat-active">
          <div className="stat-content">
            <div className="stat-number">{stats.activeUsers}</div>
            <div className="stat-label">Utilisateurs Actifs</div>
          </div>
          <FaUserCheck className="stat-icon" />
        </div>
        <div className="stat-card stat-inactive">
          <div className="stat-content">
            <div className="stat-number">{stats.inactiveUsers}</div>
            <div className="stat-label">Utilisateurs Inactifs</div>
          </div>
          <FaUserSlash className="stat-icon" />
        </div>
        <div className="stat-card stat-admin">
          <div className="stat-content">
            <div className="stat-number">{stats.adminUsers}</div>
            <div className="stat-label">Administrateurs</div>
          </div>
          <FaUserTag className="stat-icon" />
        </div>
        <div className="stat-card stat-employee">
          <div className="stat-content">
            <div className="stat-number">{stats.employeeUsers}</div>
            <div className="stat-label">Membres Équipe</div>
          </div>
          <FaUserCircle className="stat-icon" />
        </div>
      </div>

      {/* Section Recherche et Filtres */}
      <div className="search-filter-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher des utilisateurs par nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search" 
              onClick={() => setSearchTerm('')}
              title="Effacer la recherche"
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <FaFilter className="filter-icon" />
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tous les Rôles</option>
              <option value="admin">Administrateurs</option>
              <option value="employee">Membres Équipe</option>
            </select>
          </div>

          <div className="filter-item">
            <FaUserCheck className="filter-icon" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tous les Statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>

          {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
            <button 
              className="btn-clear-filters"
              onClick={clearFilters}
              title="Effacer tous les filtres"
            >
              <FaTimes />
              Effacer les Filtres
            </button>
          )}
        </div>
      </div>

      <div className="content-container">
        {filteredUsers.length > 0 ? (
          <>
            {viewMode === 'list' ? renderTableView() : renderUserCards()}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <FaDatabase />
            </div>
            <h3>
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                ? 'Aucun utilisateur ne correspond à votre recherche' 
                : 'Aucun utilisateur trouvé'
              }
            </h3>
            <p>
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Essayez d\'ajuster vos critères de recherche ou effacez les filtres pour voir tous les utilisateurs.'
                : 'Commencez par ajouter votre premier utilisateur au système'
              }
            </p>
            {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
              <button className="btn btn-secondary" onClick={clearFilters}>
                Effacer les Filtres
              </button>
            )}
            <button className="btn btn-primary" onClick={handleCreate}>
              <FaPlus className="btn-icon" />
              Nouvel Utilisateur
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <AdminModal
          type="users"
          modalType={modalType}
          formData={formData}
          setFormData={setFormData}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      {/* Modal de Confirmation */}
      {showConfirmation && (
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <div className="confirmation-header">
              <div className={`confirmation-icon ${confirmationConfig.type}`}>
                <FaExclamationTriangle />
              </div>
              <h3 className="confirmation-title">{confirmationConfig.title}</h3>
            </div>
            
            <div className="confirmation-body">
              <p className="confirmation-message">{confirmationConfig.message}</p>
              
              {confirmationConfig.user && (
                <div className="user-preview">
                  <div className="user-avatar-preview">
                    <div className="avatar-circle-preview">
                      {confirmationConfig.user.Fullname.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                  </div>
                  <div className="user-info-preview">
                    <h4>{confirmationConfig.user.Fullname}</h4>
                    <div className="user-meta-preview">
                      {getRoleBadge(confirmationConfig.user.role)}
                      {getStatusBadge(confirmationConfig.user.status)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="confirmation-actions">
              <button 
                className="btn-confirm-cancel"
                onClick={() => setShowConfirmation(false)}
              >
                Annuler
              </button>
              <button 
                className={`btn-confirm-${confirmationConfig.type}`}
                onClick={confirmationConfig.onConfirm}
              >
                {confirmationConfig.type === 'delete' ? 'Supprimer l\'utilisateur' : 
                 confirmationConfig.type === 'activate' ? 'Activer l\'utilisateur' : 'Désactiver l\'utilisateur'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .users-management {
          padding: 2rem;
          min-height: 100vh;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        }

        /* Loading Spinner */
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 3px solid #e9ecef;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Section Header */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          background: white;
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
        }

        .header-content {
          flex: 1;
        }

        .section-title {
          display: flex;
          align-items: center;
          font-size: 2rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 0.5rem 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .title-icon {
          margin-right: 0.75rem;
          font-size: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .users-count {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.25rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          margin-left: 1rem;
          font-weight: 600;
        }

        .section-subtitle {
          color: #6c757d;
          font-size: 1.1rem;
          margin: 0;
          font-weight: 400;
        }

        .section-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        /* View Toggle */
        .view-toggle {
          display: flex;
          background: #f8f9fa;
          border-radius: 12px;
          padding: 0.25rem;
          margin-right: 0.5rem;
          border: 1px solid #e9ecef;
        }

        .view-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #6c757d;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .view-btn.active {
          background: white;
          color: #007bff;
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
        }

        .view-btn:hover:not(.active) {
          background: #e9ecef;
          color: #495057;
        }

        /* Buttons */
        .btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          font-family: inherit;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
          box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
        }

        .btn-secondary:hover {
          background: #545b62;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(108, 117, 125, 0.4);
        }

        .btn-icon {
          font-size: 0.875rem;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
        }

        .stat-active::before { background: linear-gradient(135deg, #4CAF50, #45a049); }
        .stat-inactive::before { background: linear-gradient(135deg, #f44336, #da190b); }
        .stat-admin::before { background: linear-gradient(135deg, #2196F3, #0b7dda); }
        .stat-employee::before { background: linear-gradient(135deg, #9C27B0, #7b1fa2); }

        .stat-content {
          flex: 1;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 0.25rem;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #6c757d;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-icon {
          font-size: 2rem;
          opacity: 0.1;
          color: #1a1a1a;
        }

        /* Search and Filter Section */
        .search-filter-section {
          background: white;
          padding: 1.5rem 2rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          margin-bottom: 2rem;
          display: flex;
          gap: 2rem;
          align-items: center;
          flex-wrap: wrap;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 300px;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          font-size: 1rem;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          font-size: 0.875rem;
          transition: all 0.3s ease;
          background: #f8f9fa;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .clear-search {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .clear-search:hover {
          background: #e9ecef;
          color: #495057;
        }

        .filter-group {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .filter-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f8f9fa;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          border: 1px solid #e9ecef;
        }

        .filter-icon {
          color: #6c757d;
          font-size: 0.875rem;
        }

        .filter-select {
          border: none;
          background: transparent;
          font-size: 0.875rem;
          color: #495057;
          cursor: pointer;
          outline: none;
        }

        .btn-clear-filters {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(108, 117, 125, 0.1);
          color: #6c757d;
          border: 1px solid rgba(108, 117, 125, 0.2);
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-clear-filters:hover {
          background: #6c757d;
          color: white;
        }

        /* Content Container */
        .content-container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.2);
        }

        /* Table Styles */
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .data-table th {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 1rem 1.25rem;
          text-align: left;
          font-weight: 600;
          color: #2c3e50;
          border-bottom: 2px solid #e9ecef;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .data-table td {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #f8f9fa;
          color: #495057;
        }

        .data-table tr:hover {
          background: #f8f9fa;
        }

        .user-id {
          font-weight: 600;
          color: #6c757d;
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .user-name {
          font-weight: 600;
          color: #2c3e50;
        }

        .date-cell {
          color: #6c757d;
          font-size: 0.8rem;
        }

        /* Users Grid (Card View) */
        .users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 1.5rem;
          padding: 2rem;
        }

        .user-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          overflow: hidden;
          transition: all 0.3s ease;
          border: 1px solid rgba(255,255,255,0.2);
          position: relative;
        }

        .user-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        }

        .card-header {
          display: flex;
          align-items: center;
          padding: 1.5rem;
          gap: 1rem;
        }

        .user-avatar {
          position: relative;
        }

        .avatar-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1.25rem;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .user-status-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid white;
        }

        .user-status-indicator[data-status="active"] {
          background: #4CAF50;
        }

        .user-status-indicator[data-status="inactive"] {
          background: #f44336;
        }

        .user-main-info {
          flex: 1;
        }

        .user-main-info h3 {
          margin: 0 0 0.5rem 0;
          color: #1a1a1a;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .user-meta {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .card-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e9ecef, transparent);
          margin: 0 1.5rem;
        }

        .user-details {
          padding: 1.5rem;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .detail-item:last-child {
          margin-bottom: 0;
        }

        .detail-icon {
          font-size: 1rem;
          color: #667eea;
          width: 20px;
          text-align: center;
        }

        .detail-content {
          flex: 1;
        }

        .detail-label {
          display: block;
          font-size: 0.75rem;
          color: #6c757d;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }

        .detail-value {
          display: block;
          font-size: 0.875rem;
          color: #1a1a1a;
          font-weight: 600;
        }

        .card-actions {
          padding: 1.5rem;
          display: flex;
          gap: 0.75rem;
        }

        .btn-action {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          flex: 1;
          justify-content: center;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn-edit {
          background: rgba(255, 193, 7, 0.1);
          color: #ffc107;
          border: 1px solid rgba(255, 193, 7, 0.2);
        }

        .btn-edit:hover {
          background: #ffc107;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
        }

        .btn-suspend {
          background: rgba(253, 126, 20, 0.1);
          color: #fd7e14;
          border: 1px solid rgba(253, 126, 20, 0.2);
        }

        .btn-suspend:hover {
          background: #fd7e14;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(253, 126, 20, 0.3);
        }

        .btn-activate {
          background: rgba(40, 167, 69, 0.1);
          color: #28a745;
          border: 1px solid rgba(40, 167, 69, 0.2);
        }

        .btn-activate:hover {
          background: #28a745;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        }

        .btn-delete {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          border: 1px solid rgba(220, 53, 69, 0.2);
        }

        .btn-delete:hover {
          background: #dc3545;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
        }

        .action-icon {
          font-size: 0.875rem;
        }

        /* Status & Role Badges */
        .status-badge, .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.active {
          background: rgba(76, 175, 80, 0.1);
          color: #2e7d32;
          border: 1px solid rgba(76, 175, 80, 0.2);
        }

        .status-badge.inactive {
          background: rgba(244, 67, 54, 0.1);
          color: #c62828;
          border: 1px solid rgba(244, 67, 54, 0.2);
        }

        .role-badge.admin {
          background: rgba(33, 150, 243, 0.1);
          color: #1565c0;
          border: 1px solid rgba(33, 150, 243, 0.2);
        }

        .role-badge.employee {
          background: rgba(156, 39, 176, 0.1);
          color: #7b1fa2;
          border: 1px solid rgba(156, 39, 176, 0.2);
        }

        .badge-icon {
          font-size: 0.75rem;
        }

        /* Action Buttons in Table */
        .action-buttons {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        .action-buttons .btn-action {
          padding: 0.5rem;
          flex: none;
          width: 36px;
          height: 36px;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #6c757d;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          opacity: 0.3;
          color: #667eea;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          color: #495057;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .empty-state p {
          margin-bottom: 2rem;
          font-size: 1rem;
          color: #6c757d;
        }

        /* Confirmation Modal */
        .confirmation-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          backdrop-filter: blur(5px);
        }

        .confirmation-modal {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 480px;
          width: 100%;
          overflow: hidden;
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .confirmation-header {
          padding: 2rem 2rem 1rem;
          text-align: center;
          border-bottom: 1px solid #f1f3f4;
        }

        .confirmation-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          font-size: 2rem;
        }

        .confirmation-icon.delete {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          border: 2px solid rgba(220, 53, 69, 0.2);
        }

        .confirmation-icon.activate {
          background: rgba(40, 167, 69, 0.1);
          color: #28a745;
          border: 2px solid rgba(40, 167, 69, 0.2);
        }

        .confirmation-icon.deactivate {
          background: rgba(253, 126, 20, 0.1);
          color: #fd7e14;
          border: 2px solid rgba(253, 126, 20, 0.2);
        }

        .confirmation-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        .confirmation-body {
          padding: 1.5rem 2rem;
        }

        .confirmation-message {
          color: #6c757d;
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .user-preview {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }

        .avatar-circle-preview {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1rem;
        }

        .user-info-preview {
          flex: 1;
        }

        .user-info-preview h4 {
          margin: 0 0 0.5rem 0;
          color: #1a1a1a;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .user-meta-preview {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .confirmation-actions {
          padding: 1.5rem 2rem 2rem;
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn-confirm-cancel {
          padding: 0.75rem 1.5rem;
          border: 1px solid #6c757d;
          background: transparent;
          color: #6c757d;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-confirm-cancel:hover {
          background: #6c757d;
          color: white;
        }

        .btn-confirm-delete {
          padding: 0.75rem 1.5rem;
          border: none;
          background: #dc3545;
          color: white;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
        }

        .btn-confirm-delete:hover {
          background: #c82333;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
        }

        .btn-confirm-activate {
          padding: 0.75rem 1.5rem;
          border: none;
          background: #28a745;
          color: white;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        }

        .btn-confirm-activate:hover {
          background: #218838;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
        }

        .btn-confirm-deactivate {
          padding: 0.75rem 1.5rem;
          border: none;
          background: #fd7e14;
          color: white;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(253, 126, 20, 0.3);
        }

        .btn-confirm-deactivate:hover {
          background: #e55a00;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(253, 126, 20, 0.4);
        }

        /* Success and Error Notifications */
        .success-notification, .error-notification {
          position: fixed;
          top: 2rem;
          right: 2rem;
          z-index: 1001;
          animation: slideInRight 0.3s ease-out;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .success-notification .notification-content {
          background: #d4edda;
          color: #155724;
          padding: 1rem 1.5rem;
          border-radius: 10px;
          border: 1px solid #c3e6cb;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        }

        .error-notification .notification-content {
          background: #f8d7da;
          color: #721c24;
          padding: 1rem 1.5rem;
          border-radius: 10px;
          border: 1px solid #f5c6cb;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
        }

        .notification-icon {
          font-size: 1.1rem;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .users-management {
            padding: 1rem;
          }

          .section-header {
            flex-direction: column;
            gap: 1rem;
            padding: 1.5rem;
          }

          .section-actions {
            width: 100%;
            justify-content: space-between;
          }

          .view-toggle {
            margin-right: 0;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .search-filter-section {
            flex-direction: column;
            gap: 1rem;
            padding: 1.5rem;
          }

          .search-box {
            min-width: 100%;
          }

          .filter-group {
            width: 100%;
            justify-content: space-between;
          }

          .content-container {
            overflow-x: auto;
          }

          .data-table {
            min-width: 800px;
          }

          .users-grid {
            grid-template-columns: 1fr;
            padding: 1.5rem;
            gap: 1rem;
          }

          .card-actions {
            flex-direction: column;
          }

          .action-buttons {
            flex-direction: row;
            gap: 0.25rem;
          }

          .action-buttons .btn-action {
            padding: 0.5rem;
          }

          .confirmation-modal {
            margin: 1rem;
          }

          .confirmation-actions {
            flex-direction: column;
          }

          .user-preview {
            flex-direction: column;
            text-align: center;
          }

          .success-notification, .error-notification {
            right: 1rem;
            left: 1rem;
            top: 1rem;
          }
        }

        @media (max-width: 480px) {
          .section-actions {
            flex-direction: column;
            gap: 1rem;
          }

          .view-toggle {
            align-self: flex-start;
          }

          .filter-group {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-item {
            justify-content: space-between;
          }

          .user-card {
            margin: 0.5rem;
          }

          .card-header {
            flex-direction: column;
            text-align: center;
          }

          .user-meta {
            justify-content: center;
          }

          .confirmation-header {
            padding: 1.5rem 1rem 1rem;
          }

          .confirmation-body {
            padding: 1rem 1rem 1.5rem;
          }

          .confirmation-actions {
            padding: 1rem 1rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default GestionUtilisateurs;