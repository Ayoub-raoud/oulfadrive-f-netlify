// src/components/admin/UsersManagement.jsx  (or wherever your file lives)
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaPlus, FaEdit, FaTrash, FaFileExport, FaDatabase,
  FaCheck, FaTimes, FaUserCheck, FaUserSlash,
  FaList, FaTh, FaEnvelope, FaPhone, FaCalendar,
  FaKey, FaUserTag, FaUserCircle, FaExclamationTriangle,
  FaSearch, FaFilter, FaSync, FaLock, FaUnlock, FaCrown, FaStar, FaBell,
  FaArrowUp, FaArrowDown, FaSort
} from 'react-icons/fa';
import {
  fetchUtilisateurs,
  createUtilisateur,
  updateUtilisateur,
  deleteUtilisateur,
  toggleUtilisateurStatus,
  updateUtilisateurStatus,
  selectUtilisateurs,
  selectUtilisateursLoading,
  selectUser,
} from '../Redux/store';
import {
  fetchPages,
  fetchUserPermissions,
  assignPermission,
  revokePermission,
} from '../Redux/permissionSlice';
import AdminModal from './AdminModal';
import PaginationControls from '../components/PaginationControls';

// ---------- Countdown Component ----------
const RemainingTime = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [percentage, setPercentage] = useState(100);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft('Permanent');
      setPercentage(100);
      setIsExpired(false);
      return;
    }

    let interval;
    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expiré');
        setPercentage(0);
        setIsExpired(true);
        return;
      }

      setIsExpired(false);
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      let formatted = '';
      if (days > 0) formatted = `${days}j ${hours}h ${minutes}m ${seconds}s`;
      else if (hours > 0) formatted = `${hours}h ${minutes}m ${seconds}s`;
      else formatted = `${minutes}m ${seconds}s`;
      setTimeLeft(formatted);

      const createdAt = new Date(expiry.getTime() - 1000 * 60 * 60 * 24 * 30);
      const total = expiry - createdAt;
      const remaining = diff;
      let percent = (remaining / total) * 100;
      percent = Math.min(100, Math.max(0, percent));
      setPercentage(percent);
    };

    updateTimer();
    interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) return <span className="permanent-badge">Permanente</span>;

  return (
    <div className="countdown-container">
      <div className="countdown-time">{timeLeft}</div>
      <div className="progress-bar-container">
        <div className={`progress-bar-fill ${isExpired ? 'expired' : ''}`} style={{ width: `${percentage}%` }} />
      </div>
      {isExpired && <span className="expired-badge">Expiré</span>}
    </div>
  );
};

// ---------- Main Component ----------
const GestionUtilisateurs = () => {
  const dispatch = useDispatch();
  const utilisateurs = useSelector(selectUtilisateurs);
  const loading = useSelector(selectUtilisateursLoading);
  const pages = useSelector((state) => state.permissions.pages);
  const currentUser = useSelector(selectUser);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [viewMode, setViewMode] = useState('list');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({
    type: '', title: '', message: '', user: null, onConfirm: null
  });

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resetFilter, setResetFilter] = useState('all');

  // Sorting & Pagination
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Permissions
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);
  const [selectedPage, setSelectedPage] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [userPermissionsList, setUserPermissionsList] = useState([]);
  const [refreshingPermissions, setRefreshingPermissions] = useState(false);

  useEffect(() => {
    dispatch(fetchUtilisateurs());
  }, [dispatch]);

  useEffect(() => {
    if (permissionModalOpen && selectedUserForPermissions) {
      dispatch(fetchPages());
      refreshUserPermissions();
    }
  }, [permissionModalOpen, selectedUserForPermissions, dispatch]);

  const refreshUserPermissions = async () => {
    setRefreshingPermissions(true);
    const res = await dispatch(fetchUserPermissions(selectedUserForPermissions.id));
    setUserPermissionsList(res.payload.permissions);
    setRefreshingPermissions(false);
  };

  // ---------- Sorting ----------
  const handleSort = (field) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="sort-icon" />;
    return sortDirection === 'asc' ? <FaArrowUp className="sort-icon active" /> : <FaArrowDown className="sort-icon active" />;
  };

  // ---------- Filtering & Sorting ----------
  const filteredUsers = utilisateurs
    .filter(user => {
      const fullName = (user.Fullname || user.full_name || '').toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesReset = resetFilter === 'all' || (resetFilter === 'pending' && user.remember_token === 'reset_requested');
      return matchesSearch && matchesRole && matchesStatus && matchesReset;
    })
    .sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'id': aVal = a.id; bVal = b.id; break;
        case 'name':
          aVal = (a.Fullname || a.full_name || '').toLowerCase();
          bVal = (b.Fullname || b.full_name || '').toLowerCase();
          break;
        case 'role': aVal = a.role || ''; bVal = b.role || ''; break;
        case 'status': aVal = a.status || ''; bVal = b.status || ''; break;
        default: aVal = a.id; bVal = b.id;
      }
      if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginated = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const pendingResetCount = utilisateurs.filter(u => u.remember_token === 'reset_requested').length;

  // ---------- Handlers ----------
  const handleCreate = () => {
    setModalType('create');
    setEditingItem(null);
    setFormData({ Fullname: '', password: '', password_confirmation: '', role: 'employee', status: 'active' });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setModalType('edit');
    setEditingItem(item);
    setFormData({ ...item, password: '', password_confirmation: '' });
    setShowModal(true);
  };

  const showDeleteConfirmation = (user) => {
    setConfirmationConfig({
      type: 'delete',
      title: "Supprimer l'utilisateur",
      message: `Êtes-vous sûr de vouloir supprimer "${user.Fullname}" ? Cette action est irréversible.`,
      user,
      onConfirm: () => confirmDelete(user.id)
    });
    setShowConfirmation(true);
  };

  const showStatusConfirmation = (user, newStatus) => {
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    setConfirmationConfig({
      type: action,
      title: `${action === 'activate' ? 'Activer' : 'Désactiver'} l'utilisateur`,
      message: `Êtes-vous sûr de vouloir ${action === 'activate' ? 'activer' : 'désactiver'} "${user.Fullname}" ?`,
      user,
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
      showErrorMessage('Erreur : ' + error);
    }
  };

  const confirmToggleStatus = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await dispatch(updateUtilisateurStatus({ utilisateurId: user.id, status: newStatus })).unwrap();
      setShowConfirmation(false);
      showSuccessMessage(`Utilisateur ${newStatus === 'active' ? 'activé' : 'désactivé'} avec succès !`);
    } catch (error) {
      showErrorMessage('Erreur : ' + error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignPermission = async () => {
    if (!selectedPage) { showErrorMessage('Veuillez sélectionner une page.'); return; }
    const duration = durationMinutes ? parseInt(durationMinutes) : null;
    await dispatch(assignPermission({
      userId: selectedUserForPermissions.id,
      pageSlug: selectedPage,
      durationMinutes: duration,
    }));
    showSuccessMessage('Permission attribuée.');
    await refreshUserPermissions();
    setSelectedPage('');
    setDurationMinutes('');
  };

  const handleRevokePermission = async (pageSlug) => {
    await dispatch(revokePermission({ userId: selectedUserForPermissions.id, pageSlug }));
    showSuccessMessage('Permission révoquée.');
    setUserPermissionsList(prev => prev.filter(p => p.page_slug !== pageSlug));
  };

  const handleExport = () => {
    const usersToExport = filteredUsers.length > 0 ? filteredUsers : utilisateurs;
    if (!usersToExport?.length) { showErrorMessage('Aucune donnée à exporter !'); return; }

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
    link.href = URL.createObjectURL(blob);
    link.download = `export_utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showSuccessMessage('CSV exporté avec succès !');
  };

  const showSuccessMessage = (message) => {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `<div class="notification-content"><span>✓ ${message}</span></div>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const showErrorMessage = (message) => {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `<div class="notification-content"><span>✗ ${message}</span></div>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setResetFilter('all');
    setCurrentPage(1);
  };

  // ---------- Badges ----------
  const getRoleBadge = (role) => {
    if (role === 'superadmin') return <span className="role-badge superadmin"><FaStar /> Super Admin</span>;
    if (role === 'admin') return <span className="role-badge admin"><FaCrown /> Administrateur</span>;
    return <span className="role-badge employee"><FaUserCircle /> Membre Équipe</span>;
  };

  const getStatusBadge = (status) => {
    return status === 'active'
      ? <span className="status-badge active"><FaCheck /> Actif</span>
      : <span className="status-badge inactive"><FaTimes /> Inactif</span>;
  };

  // ---------- Stats ----------
  const stats = {
    total: utilisateurs.length,
    active: utilisateurs.filter(u => u.status === 'active').length,
    inactive: utilisateurs.filter(u => u.status === 'inactive').length,
    admins: utilisateurs.filter(u => u.role === 'admin').length,
    superadmins: utilisateurs.filter(u => u.role === 'superadmin').length,
    employees: utilisateurs.filter(u => u.role === 'employee').length,
  };

  // ---------- Confirmation icon per type ----------
  const confirmIconByType = {
    delete: <FaTrash size={28} />,
    activate: <FaUserCheck size={28} />,
    deactivate: <FaUserSlash size={28} />,
  };

  const confirmIconClassByType = {
    delete: 'delete',
    activate: 'activate',
    deactivate: 'deactivate',
  };

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
      {/* Reset banner */}
      {pendingResetCount > 0 && (
        <div className="reset-banner">
          <FaBell size={20} />
          <span>
            <strong>{pendingResetCount}</strong> utilisateur(s) ont demandé une réinitialisation de mot de passe.
            <button className="banner-filter-btn" onClick={() => { setResetFilter('pending'); setCurrentPage(1); }}>
              Voir les demandes
            </button>
            <button className="banner-dismiss-btn" onClick={() => setResetFilter('all')}>Masquer</button>
          </span>
        </div>
      )}

      <div className="section-header">
        <div className="header-content">
          <h1 className="section-title"><FaUserCheck className="title-icon" /> Gestion des Utilisateurs</h1>
          <p className="section-subtitle">Gérez les accès système et les permissions des utilisateurs</p>
        </div>
        <div className="section-actions">
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
              <FaList /><span>Liste</span>
            </button>
            <button className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => setViewMode('cards')}>
              <FaTh /><span>Cartes</span>
            </button>
          </div>
          <button className="btn btn-secondary" onClick={() => dispatch(fetchUtilisateurs(true))}>
            <FaSync className="btn-icon" /> Actualiser
          </button>
          <button className="btn btn-primary" onClick={handleCreate}>
            <FaPlus className="btn-icon" /> Nouvel Utilisateur
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            <FaFileExport className="btn-icon" /> Exporter CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-content"><div className="stat-number">{stats.total}</div><div className="stat-label">Total</div></div><FaDatabase className="stat-icon" /></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-number">{stats.active}</div><div className="stat-label">Actifs</div></div><FaUserCheck className="stat-icon" /></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-number">{stats.inactive}</div><div className="stat-label">Inactifs</div></div><FaUserSlash className="stat-icon" /></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-number">{stats.admins}</div><div className="stat-label">Administrateurs</div></div><FaCrown className="stat-icon" /></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-number">{stats.superadmins}</div><div className="stat-label">Super Admins</div></div><FaStar className="stat-icon" /></div>
        <div className="stat-card"><div className="stat-content"><div className="stat-number">{stats.employees}</div><div className="stat-label">Employés</div></div><FaUserCircle className="stat-icon" /></div>
      </div>

      {/* Search & Filters */}
      <div className="search-filter-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Rechercher par nom..." value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="search-input" />
          {searchTerm && <button className="clear-search" onClick={() => setSearchTerm('')}><FaTimes /></button>}
        </div>
        <div className="filter-group">
          <div className="filter-item">
            <FaFilter className="filter-icon" />
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }} className="filter-select">
              <option value="all">Tous les Rôles</option>
              <option value="superadmin">Super Admins</option>
              <option value="admin">Administrateurs</option>
              <option value="employee">Employés</option>
            </select>
          </div>
          <div className="filter-item">
            <FaUserCheck className="filter-icon" />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="filter-select">
              <option value="all">Tous les Statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
          <div className="filter-item">
            <FaKey className="filter-icon" />
            <select value={resetFilter} onChange={(e) => { setResetFilter(e.target.value); setCurrentPage(1); }} className="filter-select">
              <option value="all">Tous</option>
              <option value="pending">Demandes de réinitialisation</option>
            </select>
          </div>
          {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || resetFilter !== 'all') && (
            <button className="btn-clear-filters" onClick={clearFilters}>
              <FaTimes /> Effacer les Filtres
            </button>
          )}
        </div>
      </div>

      <div className="content-container">
        {filteredUsers.length > 0 ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('id')} className="sortable">ID {getSortIcon('id')}</th>
                    <th onClick={() => handleSort('name')} className="sortable">Nom Complet {getSortIcon('name')}</th>
                    <th onClick={() => handleSort('role')} className="sortable">Rôle {getSortIcon('role')}</th>
                    <th onClick={() => handleSort('status')} className="sortable">Statut {getSortIcon('status')}</th>
                    <th>Date de Création</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(user => (
                    <tr key={user.id}>
                      <td>#{user.id}</td>
                      <td>
                        {user.Fullname}
                        {user.remember_token === 'reset_requested' && (
                          <span className="reset-badge" title="Demande de réinitialisation">
                            <FaSync /> Reset
                          </span>
                        )}
                      </td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>{getStatusBadge(user.status)}</td>
                      <td>{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-action btn-edit" onClick={() => handleEdit(user)} title="Modifier"><FaEdit /></button>
                          <button className={`btn-action ${user.status === 'active' ? 'btn-suspend' : 'btn-activate'}`}
                            onClick={() => showStatusConfirmation(user, user.status === 'active' ? 'inactive' : 'active')}>
                            {user.status === 'active' ? <FaLock /> : <FaUnlock />}
                          </button>
                          {currentUser?.role === 'superadmin' && (
                            <button className="btn-action btn-permission" title="Permissions"
                              onClick={() => { setSelectedUserForPermissions(user); setPermissionModalOpen(true); }}>
                              <FaKey />
                            </button>
                          )}
                          <button className="btn-action btn-delete" onClick={() => showDeleteConfirmation(user)}><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                totalItems={filteredUsers.length}
              />
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon"><FaDatabase /></div>
            <h3>Aucun utilisateur trouvé</h3>
            <p>Essayez d'ajuster vos critères de recherche.</p>
            <button className="btn btn-primary" onClick={handleCreate}><FaPlus /> Nouvel Utilisateur</button>
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

      {/* ====================================================================
          Permission Modal — full-screen overlay (AdminModal shell)
         ==================================================================== */}
      {permissionModalOpen && selectedUserForPermissions && currentUser?.role === 'superadmin' && createPortal(
        <div className="perm-overlay" role="dialog" aria-modal="true">
          <div className="perm-modal">
            <header className="perm-header">
              <div className="perm-header-icon">
                <FaKey size={28} />
              </div>
              <div className="perm-header-title">
                <h2>Gestion des permissions</h2>
                <p>{selectedUserForPermissions.Fullname}</p>
              </div>
              <button
                type="button"
                className="perm-header-close"
                onClick={() => setPermissionModalOpen(false)}
                aria-label="Fermer"
              >
                <FaTimes size={20} />
              </button>
            </header>

            <div className="perm-body">
              <section className="perm-section">
                <div className="perm-section-header">
                  <FaPlus size={16} />
                  <h3>Ajouter une permission</h3>
                  <button
                    type="button"
                    className="perm-refresh-btn"
                    onClick={refreshUserPermissions}
                    disabled={refreshingPermissions}
                    title="Actualiser les permissions"
                  >
                    <FaSync className={refreshingPermissions ? 'spin' : ''} />
                  </button>
                </div>

                <div className="perm-grid-2">
                  <div className="perm-field">
                    <label className="perm-label">Page</label>
                    <select
                      className="perm-input"
                      value={selectedPage}
                      onChange={(e) => setSelectedPage(e.target.value)}
                    >
                      <option value="">-- Choisir une page --</option>
                      {Object.entries(pages).map(([slug, label]) => (
                        <option key={slug} value={slug}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="perm-field">
                    <label className="perm-label">Durée (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      className="perm-input"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      placeholder="Vide = permanente"
                    />
                    <span className="perm-hint">Laisser vide pour une permission permanente</span>
                  </div>
                </div>

                <div className="perm-assign-row">
                  <button
                    type="button"
                    className="perm-btn-primary"
                    onClick={handleAssignPermission}
                    disabled={!selectedPage}
                  >
                    <FaPlus size={14} /> Attribuer
                  </button>
                </div>
              </section>

              <section className="perm-section">
                <div className="perm-section-header">
                  <FaKey size={16} />
                  <h3>Permissions actuelles ({userPermissionsList.length})</h3>
                </div>

                {userPermissionsList.length === 0 ? (
                  <div className="perm-empty">Aucune permission spéciale attribuée.</div>
                ) : (
                  <ul className="perm-list">
                    {userPermissionsList.map(perm => (
                      <li key={perm.page_slug} className="perm-item">
                        <div className="perm-item-info">
                          <strong>{pages[perm.page_slug] || perm.page_slug}</strong>
                          <RemainingTime expiresAt={perm.expires_at} />
                        </div>
                        <button
                          className="perm-revoke-btn"
                          onClick={() => handleRevokePermission(perm.page_slug)}
                          title="Révoquer"
                        >
                          <FaTrash size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <div className="perm-footer">
              <button
                type="button"
                className="perm-btn-secondary"
                onClick={() => setPermissionModalOpen(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ====================================================================
          Confirmation Modal — polished confirmation style
         ==================================================================== */}
      {showConfirmation && createPortal(
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <div className="confirmation-header">
              <div className={`confirmation-icon ${confirmIconClassByType[confirmationConfig.type] || 'delete'}`}>
                {confirmIconByType[confirmationConfig.type] || <FaExclamationTriangle size={28} />}
              </div>
              <h3 className="confirmation-title">{confirmationConfig.title}</h3>
            </div>
            <div className="confirmation-body">
              <p className="confirmation-message">{confirmationConfig.message}</p>
            </div>
            <div className="confirmation-actions">
              <button className="btn-confirm-cancel" onClick={() => setShowConfirmation(false)}>
                Annuler
              </button>
              <button
                className={`btn-confirm-${confirmationConfig.type}`}
                onClick={confirmationConfig.onConfirm}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        /* ================= Layout ================= */
        .users-management {
          padding: 2rem; min-height: 100vh;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          background: #f8fafc; color: #334155;
        }

        /* ================= Reset banner ================= */
        .reset-banner {
          display: flex; align-items: center; gap: 12px;
          background: #fef3c7; border: 1px solid #f59e0b;
          border-radius: 0.75rem; padding: 12px 20px; margin-bottom: 1.5rem;
          color: #92400e; font-size: 0.95rem;
        }
        .banner-filter-btn {
          margin-left: 12px; padding: 4px 12px;
          background: #f59e0b; color: white; border: none;
          border-radius: 6px; cursor: pointer; font-weight: 600;
        }
        .banner-dismiss-btn {
          margin-left: 8px; background: transparent; border: none;
          color: #92400e; text-decoration: underline; cursor: pointer;
        }

        /* ================= Header ================= */
        .section-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 1rem; margin-bottom: 2rem; background: #fff; padding: 2rem;
          border-radius: 1.25rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0; flex-wrap: wrap;
        }
        .header-content { flex: 1; }
        .section-title {
          display: flex; align-items: center; gap: 10px;
          font-size: 2rem; font-weight: 700; margin: 0 0 0.5rem 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; flex-wrap: wrap;
        }
        .title-icon { color: #667eea; }
        .section-subtitle { color: #64748b; font-size: 1rem; margin: 0; font-weight: 400; }
        .section-actions { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }

        /* ================= Buttons ================= */
        .btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          height: 2.5rem; padding: 0 1rem; border-radius: 9999px;
          border: none; cursor: pointer; font-size: 0.875rem; font-weight: 500;
          transition: all 0.2s; font-family: inherit;
        }
        .btn-secondary { background: #f1f5f9; color: #1e293b; }
        .btn-secondary:hover { background: #e2e8f0; transform: translateY(-1px); }
        .btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2); color: white;
          box-shadow: 0 4px 15px rgba(102,126,234,0.3);
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(102,126,234,0.4); }

        .view-toggle { display: flex; background: #f1f5f9; border-radius: 0.75rem; padding: 0.25rem; }
        .view-btn {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 1rem; border: none; background: transparent;
          border-radius: 0.5rem; cursor: pointer; color: #64748b;
          font-size: 0.8rem; font-weight: 600;
        }
        .view-btn.active { background: white; color: #667eea; }

        /* ================= Stats ================= */
        .stats-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem; margin-bottom: 1.5rem;
        }
        .stat-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 1rem;
          padding: 1rem; transition: all 0.2s;
          display: flex; justify-content: space-between; align-items: center;
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        .stat-number { font-size: 1.875rem; font-weight: 700; color: #0f172a; line-height: 1; }
        .stat-label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0.35rem; }
        .stat-icon { opacity: 0.5; }

        /* ================= Search + filters ================= */
        .search-filter-section {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 1rem;
          padding: 1rem; margin-bottom: 1.5rem;
          display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .search-box { position: relative; flex: 1; min-width: 240px; }
        .search-box .search-icon {
          position: absolute; left: 0.75rem; top: 50%;
          transform: translateY(-50%); color: #64748b;
        }
        .search-box .search-input {
          width: 100%; padding: 0.5rem 2.5rem 0.5rem 2.5rem;
          border: 1px solid #e2e8f0; border-radius: 0.5rem;
          font-size: 0.875rem; font-family: inherit; transition: all 0.2s;
          background: #fff;
        }
        .search-box .search-input:focus {
          outline: none; border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
        }
        .clear-search {
          position: absolute; right: 0.75rem; top: 50%;
          transform: translateY(-50%); background: none; border: none;
          color: #94a3b8; cursor: pointer;
        }
        .filter-group { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
        .filter-item {
          display: flex; align-items: center; gap: 0.5rem;
          background: #f1f5f9; padding: 0.5rem 1rem;
          border-radius: 0.5rem;
        }
        .filter-icon { color: #64748b; font-size: 0.8rem; }
        .filter-select {
          border: none; background: transparent; outline: none;
          cursor: pointer; font-family: inherit; font-size: 0.85rem;
          color: #1e293b; font-weight: 500;
        }
        .btn-clear-filters {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 1rem; background: #fee2e2;
          border-radius: 0.5rem; border: none; cursor: pointer;
          color: #991b1b; font-size: 0.85rem; font-weight: 600;
        }
        .btn-clear-filters:hover { background: #fecaca; }

        /* ================= Content container ================= */
        .content-container {
          background: white; border: 1px solid #e2e8f0; border-radius: 1rem;
          overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        /* ================= Table ================= */
        .data-table {
          width: 100%;
          font-size: 0.875rem;
          border-collapse: collapse;
          min-width: 800px;
        }
        .data-table th {
          text-align: left;
          padding: 0.75rem 1rem;
          background: #f8fafc;
          color: #64748b;
          font-weight: 500;
          white-space: nowrap;
          border-bottom: 1px solid #e2e8f0;
        }
        .data-table td {
          padding: 0.75rem 1rem;
          border-top: 1px solid #e2e8f0;
          color: #334155;
          vertical-align: middle;
        }
        .data-table tr:hover { background: #f8fafc; }

        .sortable { cursor: pointer; user-select: none; }
        .sortable:hover { background: #e2e8f0; }
        .sort-icon { font-size: 0.7rem; margin-left: 0.25rem; opacity: 0.5; }
        .sort-icon.active { opacity: 1; color: #667eea; }

        /* ================= Badges ================= */
        .role-badge, .status-badge, .reset-badge {
          display: inline-flex; align-items: center; gap: 0.25rem;
          padding: 0.25rem 0.625rem; border-radius: 9999px;
          font-size: 0.7rem; font-weight: 500; white-space: nowrap;
        }
        .role-badge.superadmin { background: #fef3c7; color: #92400e; }
        .role-badge.admin      { background: #dbeafe; color: #1e40af; }
        .role-badge.employee   { background: #f3e8ff; color: #6b21a5; }
        .status-badge.active   { background: #dcfce7; color: #166534; }
        .status-badge.inactive { background: #fee2e2; color: #991b1b; }
        .reset-badge           { background: #fef3c7; color: #92400e; margin-left: 0.5rem; }

        /* ================= Action buttons ================= */
        .action-buttons { display: flex; gap: 0.5rem; justify-content: flex-end; }
        .btn-action {
          padding: 0.5rem; background: none; border: none; cursor: pointer;
          border-radius: 0.5rem; transition: all 0.2s; width: 32px; height: 32px;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .btn-edit       { color: #10b981; } .btn-edit:hover       { background: #ecfdf5; }
        .btn-suspend    { color: #f59e0b; } .btn-suspend:hover    { background: #fffbeb; }
        .btn-activate   { color: #10b981; } .btn-activate:hover   { background: #ecfdf5; }
        .btn-permission { color: #8b5cf6; } .btn-permission:hover { background: #f5f3ff; }
        .btn-delete     { color: #ef4444; } .btn-delete:hover     { background: #fef2f2; }

        /* ================= Empty state ================= */
        .empty-state { text-align: center; padding: 4rem 2rem; }
        .empty-icon { font-size: 4rem; color: #667eea; opacity: 0.3; margin-bottom: 1.5rem; }
        .empty-state h3 { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem; }
        .empty-state p { color: #64748b; margin: 0 0 1.5rem; }

        /* ================= Loading ================= */
        .loading-spinner {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; height: 400px; color: #64748b;
        }
        .spinner {
          width: 48px; height: 48px; border: 3px solid #e2e8f0;
          border-top: 3px solid #667eea; border-radius: 50%;
          animation: spin 1s linear infinite; margin-bottom: 1rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.6s linear infinite; }

        /* ====================================================================
           Shared keyframes
           ==================================================================== */
        @keyframes amSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ====================================================================
           Permission modal — full-screen overlay (AdminModal shell)
           ==================================================================== */
        .perm-overlay {
          position: fixed;
          top: 0; right: 0; bottom: 0; left: 0;
          background: #f8fafc;
          overflow-y: auto; overflow-x: hidden;
          z-index: 9999;
        }
        @media (min-width: 768px) {
          .perm-overlay { left: 18rem; }
        }

        .perm-modal {
          background: #fff;
          border-radius: 32px;
          margin: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: amSlideIn 0.3s ease-out;
        }

        .perm-header {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 24px 32px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .perm-header-icon {
          width: 56px; height: 56px; background: #fff;
          border-radius: 28px; display: flex; align-items: center;
          justify-content: center; color: #667eea; flex-shrink: 0;
        }
        .perm-header-title { flex: 1; min-width: 0; padding-right: 48px; }
        .perm-header-title h2 {
          color: #fff; font-size: 1.75rem; font-weight: 700;
          margin: 0; line-height: 1.2;
        }
        .perm-header-title p {
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.875rem; margin: 4px 0 0;
        }
        .perm-header-close {
          position: absolute; top: 24px; right: 28px;
          background: rgba(255, 255, 255, 0.15);
          border: none; border-radius: 40px;
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #fff; transition: all 0.2s;
        }
        .perm-header-close:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.05);
        }

        .perm-body {
          padding: 28px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .perm-section {
          background: #f8fafc;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }
        .perm-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #667eea;
        }
        .perm-section-header h3 {
          font-size: 1rem; font-weight: 600;
          color: #1e293b; margin: 0; flex: 1;
        }
        .perm-refresh-btn {
          background: #fff; border: 1px solid #e2e8f0;
          padding: 6px 10px; border-radius: 0.5rem;
          color: #64748b; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .perm-refresh-btn:hover { border-color: #667eea; color: #667eea; }
        .perm-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .perm-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .perm-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .perm-label {
          font-size: 0.7rem; font-weight: 600; color: #475569;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .perm-hint { font-size: 0.7rem; color: #94a3b8; font-style: italic; }
        .perm-input {
          width: 100%; padding: 10px 14px;
          border: 1.5px solid #e2e8f0; border-radius: 12px;
          font-size: 0.875rem; font-family: inherit;
          background: #fff; color: #1e293b;
          transition: all 0.2s; box-sizing: border-box;
        }
        .perm-input:focus {
          outline: none; border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .perm-assign-row {
          display: flex; justify-content: flex-end;
          margin-top: 16px;
        }

        .perm-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 10px;
        }
        .perm-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px; background: #fff;
          border: 1.5px solid #e2e8f0; border-radius: 12px;
          transition: border-color 0.2s;
        }
        .perm-item:hover { border-color: #cbd5e1; }
        .perm-item-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
        .perm-item-info strong { font-size: 0.875rem; color: #1e293b; }
        .perm-revoke-btn {
          background: none; border: none; cursor: pointer;
          color: #ef4444; padding: 6px; border-radius: 6px;
          display: inline-flex; align-items: center; justify-content: center;
          transition: background 0.15s; flex-shrink: 0;
        }
        .perm-revoke-btn:hover { background: #fee2e2; }

        .perm-empty {
          text-align: center; padding: 2rem 1rem;
          color: #94a3b8; font-size: 0.875rem;
          background: #fff; border-radius: 12px;
          border: 1px dashed #e2e8f0;
        }

        .perm-footer {
          display: flex; justify-content: flex-end;
          gap: 16px; padding: 20px 32px;
          border-top: 1px solid #e2e8f0;
          background: #fff;
        }

        .perm-btn-primary,
        .perm-btn-secondary {
          font-family: inherit; font-size: 0.875rem;
          font-weight: 600; border-radius: 40px;
          cursor: pointer; display: inline-flex;
          align-items: center; justify-content: center;
          gap: 8px; transition: all 0.2s; white-space: nowrap;
        }
        .perm-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none; padding: 12px 28px; color: #fff;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        .perm-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        .perm-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .perm-btn-secondary {
          background: #fff; border: 1.5px solid #e2e8f0;
          padding: 10px 24px; color: #475569;
        }
        .perm-btn-secondary:hover {
          border-color: #667eea; color: #667eea; background: #f8fafc;
        }

        /* ====================================================================
           Countdown
           ==================================================================== */
        .countdown-container { display: flex; flex-direction: column; gap: 0.25rem; max-width: 220px; margin-top: 0.25rem; }
        .countdown-time {
          font-size: 0.75rem; font-weight: 600; color: #b45309;
          background: #fef3c7; padding: 0.125rem 0.5rem; border-radius: 1rem;
          width: fit-content; font-family: monospace;
        }
        .progress-bar-container { background: #e2e8f0; border-radius: 9999px; height: 4px; overflow: hidden; }
        .progress-bar-fill { background: #eab308; height: 100%; transition: width 0.5s linear; }
        .progress-bar-fill.expired { background: #ef4444; }
        .permanent-badge {
          background: #dcfce7; color: #166534;
          padding: 0.125rem 0.5rem; border-radius: 1rem; font-size: 0.7rem;
        }
        .text-muted { color: #64748b; font-size: 0.875rem; }

        /* ====================================================================
           Confirmation modal
           ==================================================================== */
        .confirmation-modal-overlay {
          position: fixed;
          top: 0; right: 0; bottom: 0; left: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          z-index: 10000; padding: 1rem;
          overflow-y: auto; overflow-x: hidden;
          animation: fadeIn 0.2s ease;
        }
        .confirmation-modal {
          background: white; border-radius: 1.25rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 480px; width: 100%; overflow: hidden;
          animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          margin: auto;
        }
        .confirmation-header {
          padding: 2rem 2rem 1rem;
          text-align: center;
          border-bottom: 1px solid #f1f3f4;
        }
        .confirmation-icon {
          width: 80px; height: 80px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem;
        }
        .confirmation-icon.delete {
          background: rgba(220, 53, 69, 0.1); color: #dc3545;
          border: 2px solid rgba(220, 53, 69, 0.2);
        }
        .confirmation-icon.activate {
          background: rgba(40, 167, 69, 0.1); color: #16a34a;
          border: 2px solid rgba(40, 167, 69, 0.2);
        }
        .confirmation-icon.deactivate {
          background: rgba(253, 126, 20, 0.1); color: #f59e0b;
          border: 2px solid rgba(253, 126, 20, 0.2);
        }
        .confirmation-title {
          font-size: 1.5rem; font-weight: 700;
          color: #0f172a; margin: 0;
        }
        .confirmation-body { padding: 1.5rem 2rem; }
        .confirmation-message {
          color: #64748b; font-size: 1rem;
          line-height: 1.6; margin: 0; text-align: center;
        }
        .confirmation-actions {
          padding: 1.5rem 2rem 2rem;
          display: flex; gap: 1rem; justify-content: flex-end;
        }
        .btn-confirm-cancel {
          padding: 0.75rem 1.5rem;
          border: 1px solid #cbd5e1;
          background: transparent; color: #64748b;
          border-radius: 0.75rem;
          font-size: 0.875rem; font-weight: 600;
          cursor: pointer; transition: all 0.3s ease;
          font-family: inherit;
        }
        .btn-confirm-cancel:hover { background: #f1f5f9; color: #334155; }
        .btn-confirm-delete {
          padding: 0.75rem 1.5rem; border: none;
          background: #ef4444; color: white;
          border-radius: 0.75rem; font-size: 0.875rem;
          font-weight: 600; cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
          font-family: inherit;
        }
        .btn-confirm-delete:hover {
          background: #dc2626; transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
        }
        .btn-confirm-activate {
          padding: 0.75rem 1.5rem; border: none;
          background: #10b981; color: white;
          border-radius: 0.75rem; font-size: 0.875rem;
          font-weight: 600; cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
          font-family: inherit;
        }
        .btn-confirm-activate:hover {
          background: #059669; transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }
        .btn-confirm-deactivate {
          padding: 0.75rem 1.5rem; border: none;
          background: #f59e0b; color: white;
          border-radius: 0.75rem; font-size: 0.875rem;
          font-weight: 600; cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
          font-family: inherit;
        }
        .btn-confirm-deactivate:hover {
          background: #d97706; transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
        }

        /* ================= Notifications ================= */
        .success-notification, .error-notification {
          position: fixed; top: 2rem; right: 2rem; z-index: 10500;
        }
        .notification-content {
          padding: 1rem 1.5rem; border-radius: 0.75rem;
          font-weight: 600; box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }
        .success-notification .notification-content { background: #dcfce7; color: #166534; }
        .error-notification .notification-content { background: #fee2e2; color: #991b1b; }

        /* ================= Responsive ================= */
        @media (max-width: 768px) {
          .users-management { padding: 1rem; }
          .section-header { flex-direction: column; }
          .section-actions { width: 100%; justify-content: flex-start; }
          .search-filter-section { flex-direction: column; align-items: stretch; }
          .filter-group { flex-direction: column; align-items: stretch; }
          .filter-item { width: 100%; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }

          /* Permission modal shrinks on mobile */
          .perm-modal { margin: 1rem; border-radius: 24px; max-width: 100%; }
          .perm-header { padding: 16px 20px; gap: 14px; }
          .perm-header-title h2 { font-size: 1.25rem; }
          .perm-header-title { padding-right: 40px; }
          .perm-header-icon { width: 44px; height: 44px; border-radius: 22px; }
          .perm-header-close { top: 16px; right: 16px; width: 36px; height: 36px; }
          .perm-body { padding: 20px; }
          .perm-grid-2 { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default GestionUtilisateurs;