import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaPlus, FaEdit, FaTrash, FaFileExport, FaDatabase, FaMapMarkerAlt,
  FaCheck, FaTimes, FaUser, FaEnvelope, FaPhone, FaIdCard,
  FaExclamationTriangle, FaSearch, FaFilter, FaCalendarAlt, FaCarCrash,
  FaChevronLeft, FaChevronRight, FaCar, FaMoneyBill, FaClock, FaFilePdf, FaDownload, FaEye, FaCalendarDay, FaMapMarker
} from 'react-icons/fa';
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
  selectClients,
  selectClientsLoading,
  selectReservations,
  selectAccidents
} from '../Redux/store';
import PaginationControls from '../components/PaginationControls';
import AdminModal from './AdminModal';

const GestionClients = () => {
  const dispatch = useDispatch();
  const clients = useSelector(selectClients);
  const reservations = useSelector(selectReservations);
  const accidents = useSelector(selectAccidents);
  const loading = useSelector(selectClientsLoading);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({
    type: '',
    title: '',
    message: '',
    client: null,
    onConfirm: null
  });

  // États pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // États pour la vue détaillée
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [reservationsPage, setReservationsPage] = useState(1);
  const [accidentsPage, setAccidentsPage] = useState(1);
  const detailsItemsPerPage = 6;

  // État pour le téléchargement
  const [downloading, setDownloading] = useState(false);
  const [downloadingType, setDownloadingType] = useState('');

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  // Fonction pour télécharger un document
  const handleDownloadDocument = async (clientId, documentType, documentName) => {
    if (!clientId || !documentType) {
      showErrorMessage('Informations de téléchargement incomplètes');
      return;
    }

    setDownloading(true);
    setDownloadingType(documentType);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Non autorisé. Veuillez vous reconnecter.');
      }

      const apiUrl = `https://oulfa-back-production.up.railway.app/api/clients/${clientId}/download/${documentType}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const blob = await response.blob();

      if (!blob || blob.size === 0) {
        throw new Error('Document vide ou non disponible');
      }

      let filename = documentName;
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="?([^"]+)"?/);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      const blobUrl = window.URL.createObjectURL(blob);

      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = filename;
      downloadLink.style.display = 'none';

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);

      showSuccessMessage(`${filename} téléchargé avec succès !`);

      setTimeout(() => {
        const viewBlobUrl = window.URL.createObjectURL(blob);
        window.open(viewBlobUrl, '_blank');

        setTimeout(() => {
          window.URL.revokeObjectURL(viewBlobUrl);
        }, 5000);
      }, 500);

    } catch (error) {
      console.error('Download error:', error);
      showErrorMessage('Erreur de téléchargement: ' + error.message);
    } finally {
      setTimeout(() => {
        setDownloading(false);
        setDownloadingType('');
      }, 500);
    }
  };

  // Fonction pour ouvrir un document dans un nouvel onglet
  const handleViewDocument = (url) => {
    if (!url) {
      showErrorMessage('Aucun document disponible');
      return;
    }

    try {
      window.open(url, '_blank', 'noopener,noreferrer');
      showSuccessMessage('Document ouvert dans un nouvel onglet');
    } catch (error) {
      showErrorMessage('Impossible d\'ouvrir le document: ' + error.message);
    }
  };

  // Obtenir les villes uniques pour le filtre
  const uniqueCities = [...new Set(clients.map(client => client.city).filter(Boolean))];

  // Filtrer les clients basé sur la recherche et les filtres
  const filteredClients = clients.filter(client => {
    const matchesSearch = searchTerm === '' ||
      client.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telephone?.includes(searchTerm);

    const matchesCity = cityFilter === 'all' || client.city === cityFilter;

    const clientReservations = reservations.filter(r => r.client_id === client.id);
    const clientAccidents = accidents.filter(a => a.client_id === client.id);

    let matchesStatus = true;
    switch (statusFilter) {
      case 'with_reservations':
        matchesStatus = clientReservations.length > 0;
        break;
      case 'no_reservations':
        matchesStatus = clientReservations.length === 0;
        break;
      case 'with_accidents':
        matchesStatus = clientAccidents.length > 0;
        break;
      case 'no_accidents':
        matchesStatus = clientAccidents.length === 0;
        break;
      case 'active':
        matchesStatus = clientReservations.length > 0;
        break;
      default:
        matchesStatus = true;
    }

    return matchesSearch && matchesCity && matchesStatus;
  }).sort((a, b) => (b.id || 0) - (a.id || 0));

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCityFilter = (e) => {
    setCityFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCityFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // Fonctions pour les détails du client
  const handleViewDetails = (client) => {
    setSelectedClient(client);
    setReservationsPage(1);
    setAccidentsPage(1);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedClient(null);
  };

  // Obtenir les données spécifiques au client
  const getClientReservations = (clientId) => {
    return reservations.filter(r => r.client_id === clientId);
  };

  const getClientAccidents = (clientId) => {
    return accidents.filter(a => a.client_id === clientId);
  };

  const calculateRentalDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays === 0 ? 1 : diffDays;
  };

  // Pagination pour les détails
  const clientReservations = selectedClient ? getClientReservations(selectedClient.id) : [];
  const clientAccidents = selectedClient ? getClientAccidents(selectedClient.id) : [];

  const totalReservationsPages = Math.ceil(clientReservations.length / detailsItemsPerPage);
  const totalAccidentsPages = Math.ceil(clientAccidents.length / detailsItemsPerPage);

  const currentReservations = clientReservations.slice(
    (reservationsPage - 1) * detailsItemsPerPage,
    reservationsPage * detailsItemsPerPage
  );

  const currentAccidents = clientAccidents.slice(
    (accidentsPage - 1) * detailsItemsPerPage,
    accidentsPage * detailsItemsPerPage
  );

  const handleReservationsPageChange = (page) => {
    setReservationsPage(page);
  };

  const handleAccidentsPageChange = (page) => {
    setAccidentsPage(page);
  };

  const handleCreate = () => {
    setModalType('create');
    setEditingItem(null);
    setFormData({
      nom: '',
      prenom: '',
      telephone: '',
      email: '',
      city: '',
      cin_number: '',
      driver_license_number: '',
      cin_image: '',
      driver_license_image: '',
      date_naissance: '',
      lieu_naissance: '',
      cin_delivre_le: '',
      permis_delivre_le: ''
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setModalType('edit');
    setEditingItem(item);

    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    setFormData({
      ...item,
      date_naissance: formatDateForInput(item.date_naissance),
      cin_delivre_le: formatDateForInput(item.cin_delivre_le),
      permis_delivre_le: formatDateForInput(item.permis_delivre_le)
    });
    setShowModal(true);
  };

  const showDeleteConfirmation = (client) => {
    setConfirmationConfig({
      type: 'delete',
      title: 'Supprimer le Client',
      message: `Êtes-vous sûr de vouloir supprimer "${client.prenom} ${client.nom}" ? Cette action est irréversible.`,
      client: client,
      onConfirm: () => confirmDelete(client.id)
    });
    setShowConfirmation(true);
  };

  const confirmDelete = async (id) => {
    try {
      await dispatch(deleteClient(id)).unwrap();
      setShowConfirmation(false);
      showSuccessMessage('Client supprimé avec succès !');
    } catch (error) {
      showErrorMessage('Erreur lors de la suppression du client : ' + error);
    }
  };

  const showSuccessMessage = (message) => {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <FaCheck class="notification-icon" />
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const showErrorMessage = (message) => {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <FaTimes class="notification-icon" />
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modalType === 'create') {
        await dispatch(createClient(formData)).unwrap();
        showSuccessMessage('Client créé avec succès !');
      } else {
        await dispatch(updateClient({ id: editingItem.id, data: formData })).unwrap();
        showSuccessMessage('Client mis à jour avec succès !');
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
    if (!clients || clients.length === 0) {
      showErrorMessage('Aucune donnée à exporter !');
      return;
    }

    const headers = ['ID', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Ville', 'Réservations', 'Accidents'];
    const csvContent = [
      headers.join(','),
      ...clients.map(client => {
        const clientReservations = reservations.filter(r => r.client_id === client.id).length;
        const clientAccidents = accidents.filter(a => a.client_id === client.id).length;

        return [
          client.id,
          `"${client.prenom}"`,
          `"${client.nom}"`,
          `"${client.email}"`,
          `"${client.telephone}"`,
          `"${client.city}"`,
          clientReservations,
          clientAccidents
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `export_clients_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccessMessage('CSV exporté avec succès !');
  };

  const getClientStats = () => {
    const totalClients = clients.length;
    const totalReservations = reservations.length;
    const totalAccidents = accidents.length;

    return { totalClients, totalReservations, totalAccidents };
  };

  const stats = getClientStats();

  const getInitials = (client) => {
    return `${client.prenom?.[0] || ''}${client.nom?.[0] || ''}`.toUpperCase();
  };

  const getClientReservationsCount = (clientId) => {
    return reservations.filter(r => r.client_id === clientId).length;
  };

  const getClientAccidentsCount = (clientId) => {
    return accidents.filter(a => a.client_id === clientId).length;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-badge status-pending', text: 'En attente' },
      confirmed: { class: 'status-badge status-confirmed', text: 'Confirmée' },
      contacted: { class: 'status-badge status-contacted', text: 'Contacté' },
      completed: { class: 'status-badge status-completed', text: 'Terminée' },
      cancelled: { class: 'status-badge status-cancelled', text: 'Annulée' }
    };

    const config = statusConfig[status] || { class: 'status-badge status-pending', text: status };

    return (
      <span className={config.class}>
        {config.text}
      </span>
    );
  };

  const renderPaginationButtons = (currentPage, totalPages, onPageChange, type = 'details') => {
    const buttons = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    buttons.push(
      <button key="prev" className={`pagination-btn ${type} ${currentPage === 1 ? 'disabled' : ''}`}
        onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        <FaChevronLeft />
      </button>
    );

    if (startPage > 1) {
      buttons.push(<button key={1} className={`pagination-btn ${type} ${currentPage === 1 ? 'active' : ''}`}
        onClick={() => onPageChange(1)}>1</button>);
      if (startPage > 2) buttons.push(<span key="e1" className={`pagination-ellipsis ${type}`}>...</span>);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(<button key={i} className={`pagination-btn ${type} ${currentPage === i ? 'active' : ''}`}
        onClick={() => onPageChange(i)}>{i}</button>);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) buttons.push(<span key="e2" className={`pagination-ellipsis ${type}`}>...</span>);
      buttons.push(<button key={totalPages}
        className={`pagination-btn ${type} ${currentPage === totalPages ? 'active' : ''}`}
        onClick={() => onPageChange(totalPages)}>{totalPages}</button>);
    }

    buttons.push(
      <button key="next" className={`pagination-btn ${type} ${currentPage === totalPages ? 'disabled' : ''}`}
        onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        <FaChevronRight />
      </button>
    );

    return buttons;
  };

  if (loading) {
    return (
      <div className="clients-management loading-spinner">
        <div className="spinner"></div>
        <p>Chargement des clients...</p>
      </div>
    );
  }

  return (
    <div className="clients-management">
      <div className="section-header">
        <div className="header-content">
          <h1 className="section-title">
            <FaUser className="title-icon" />
            Gestion des Clients
          </h1>
          <p className="section-subtitle">Gérez votre base de données clients et leurs informations</p>
        </div>
        <div className="section-actions">
          <button className="btn btn-primary" onClick={handleCreate}>
            <FaPlus className="btn-icon" />
            Nouveau Client
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            <FaFileExport className="btn-icon" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Cartes de Statistiques */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-content">
            <div className="stat-number">{stats.totalClients}</div>
            <div className="stat-label">Clients Totaux</div>
          </div>
          <FaUser className="stat-icon" />
        </div>
        <div className="stat-card stat-reservations">
          <div className="stat-content">
            <div className="stat-number">{stats.totalReservations}</div>
            <div className="stat-label">Réservations Totales</div>
          </div>
          <FaCalendarAlt className="stat-icon" />
        </div>
        <div className="stat-card stat-accidents">
          <div className="stat-content">
            <div className="stat-number">{stats.totalAccidents}</div>
            <div className="stat-label">Accidents Totaux</div>
          </div>
          <FaCarCrash className="stat-icon" />
        </div>
      </div>

      {/* Section Recherche et Filtres */}
      <div className="search-filter-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <label htmlFor="city-filter">
              <FaMapMarkerAlt className="filter-icon" />
              Ville
            </label>
            <select
              id="city-filter"
              value={cityFilter}
              onChange={handleCityFilter}
              className="filter-select"
            >
              <option value="all">Toutes les Villes</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="status-filter">
              <FaFilter className="filter-icon" />
              Statut
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={handleStatusFilter}
              className="filter-select"
            >
              <option value="all">Tous les Clients</option>
              <option value="with_reservations">Avec Réservations</option>
              <option value="no_reservations">Sans Réservations</option>
              <option value="with_accidents">Avec Accidents</option>
              <option value="no_accidents">Sans Accidents</option>
              <option value="active">Clients Actifs</option>
            </select>
          </div>

          {(searchTerm !== '' || cityFilter !== 'all' || statusFilter !== 'all') && (
            <button className="btn btn-clear" onClick={clearFilters}>
              Effacer les Filtres
            </button>
          )}
        </div>
      </div>

      {/* Résumé des Résultats */}
      <div className="results-summary">
        <span className="results-count">
          Affichage de {currentClients.length} sur {filteredClients.length} clients
          {filteredClients.length !== clients.length && ` (filtré sur ${clients.length} au total)`}
        </span>
        <span className="page-info">
          Page {currentPage} sur {totalPages}
        </span>
      </div>

      <div className="content-container">
        {currentClients.length > 0 ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Ville</th>
                    <th>Réservations</th>
                    <th>Accidents</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentClients.map(client => {
                    const reservationsCount = getClientReservationsCount(client.id);
                    const accidentsCount = getClientAccidentsCount(client.id);

                    return (
                      <tr key={client.id}>
                        <td className="client-name">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="client-avatar">
                              {getInitials(client)}
                            </div>
                            <div>
                              <strong>{client.prenom} {client.nom}</strong>
                              <div className="client-id">#{client.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="email-cell">{client.email}</td>
                        <td className="phone-cell">{client.telephone}</td>
                        <td className="city-cell">
                          <FaMapMarkerAlt className="city-icon" />
                          {client.city}
                        </td>
                        <td className="reservations-cell">
                          <div
                            className={`count-badge ${reservationsCount > 0 ? 'has-items' : ''}`}
                            onClick={() => handleViewDetails(client)}
                            style={{ cursor: 'pointer' }}
                          >
                            <FaCalendarAlt className="count-icon" />
                            {reservationsCount}
                          </div>
                        </td>
                        <td className="accidents-cell">
                          <div
                            className={`count-badge ${accidentsCount > 0 ? 'has-items' : ''}`}
                            onClick={() => handleViewDetails(client)}
                            style={{ cursor: 'pointer' }}
                          >
                            <FaCarCrash className="count-icon" />
                            {accidentsCount}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn view"
                              onClick={() => handleViewDetails(client)}
                              title="Voir les détails"
                            >
                              <FaUser />
                            </button>
                            <button
                              className="action-btn edit"
                              onClick={() => handleEdit(client)}
                              title="Modifier"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => showDeleteConfirmation(client)}
                              title="Supprimer"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination-container">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                totalItems={filteredClients.length}
              />
            </div>
          </>
        ) : (
          <div className="no-data">
            <FaDatabase size={48} />
            <p>
              {clients.length === 0
                ? 'Aucun client trouvé'
                : 'Aucun client ne correspond à vos critères de recherche'}
            </p>
            <button className="btn btn-primary" onClick={handleCreate}>
              <FaPlus className="btn-icon" />
              Nouveau Client
            </button>
            {(searchTerm !== '' || cityFilter !== 'all' || statusFilter !== 'all') && (
              <button className="btn btn-secondary" onClick={clearFilters} style={{ marginTop: '1rem' }}>
                Effacer les Filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de Détails du Client — FULL PAGE via portal (matches MatriculesManagement) */}
      {showDetails && selectedClient && createPortal(
        <div className="details-modal-overlay">
          <div className="details-modal">
            <div className="details-header">
              <div className="client-header-info">
                <div className="client-avatar-large">
                  {getInitials(selectedClient)}
                </div>
                <div className="client-info">
                  <h2>{selectedClient.prenom} {selectedClient.nom}</h2>
                  <div className="client-contact">
                    <div><FaEnvelope /> {selectedClient.email}</div>
                    <div><FaPhone /> {selectedClient.telephone}</div>
                    <div><FaMapMarkerAlt /> {selectedClient.city}</div>
                  </div>
                </div>
              </div>
              <button className="close-details-btn" onClick={handleCloseDetails}>
                <FaTimes />
              </button>
            </div>

            <div className="details-content">
              {/* Section Informations Personnelles */}
              <div className="details-section">
                <div className="section-title">
                  <FaUser />
                  <span>Informations Personnelles</span>
                </div>
                <div className="personal-info-grid">
                  <div className="info-item">
                    <div className="info-label">
                      <FaCalendarDay /> Date de Naissance
                    </div>
                    <div className="info-value">
                      {selectedClient.date_naissance ?
                        new Date(selectedClient.date_naissance).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) :
                        'Non spécifiée'}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">
                      <FaMapMarker /> Lieu de Naissance
                    </div>
                    <div className="info-value">
                      {selectedClient.lieu_naissance || 'Non spécifié'}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">
                      <FaIdCard /> Numéro CIN
                    </div>
                    <div className="info-value">
                      {selectedClient.cin_number || 'Non spécifié'}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">
                      <FaCalendarDay /> CIN Expire le
                    </div>
                    <div className="info-value">
                      {selectedClient.cin_delivre_le ?
                        new Date(selectedClient.cin_delivre_le).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) :
                        'Non spécifié'}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">
                      <FaCar /> Numéro de Permis
                    </div>
                    <div className="info-value">
                      {selectedClient.driver_license_number || 'Non spécifié'}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">
                      <FaCalendarDay /> Permis Délivré le
                    </div>
                    <div className="info-value">
                      {selectedClient.permis_delivre_le ?
                        new Date(selectedClient.permis_delivre_le).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) :
                        'Non spécifié'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Documents */}
              <div className="details-section">
                <div className="section-title">
                  <FaIdCard />
                  <span>Documents</span>
                </div>
                <div className="documents-grid">
                  {/* CIN Document */}
                  <div className="document-card">
                    <div className="document-header">
                      <h4>Carte d'Identité Nationale (CIN)</h4>
                      {selectedClient.cin_is_pdf && <FaFilePdf className="pdf-indicator" />}
                    </div>
                    <div className="document-content">
                      {selectedClient.cin_image_url ? (
                        selectedClient.cin_is_pdf ? (
                          <div className="pdf-document">
                            <FaFilePdf className="pdf-icon-large" />
                            <span>Document PDF</span>
                            <div className="document-actions">
                              <button
                                className="btn-view-document"
                                onClick={() => handleViewDocument(selectedClient.cin_image_url)}
                              >
                                <FaEye /> Voir le PDF
                              </button>
                              <button
                                className="btn-download-document"
                                onClick={() => handleDownloadDocument(
                                  selectedClient.id,
                                  'cin_image',
                                  `CIN_${selectedClient.nom}_${selectedClient.prenom}.pdf`
                                )}
                                disabled={downloading && downloadingType === 'cin_image'}
                              >
                                {downloading && downloadingType === 'cin_image' ? (
                                  <>
                                    <div className="spinner-small" /> Téléchargement...
                                  </>
                                ) : (
                                  <>
                                    <FaDownload /> Télécharger
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="image-document">
                            <img
                              src={selectedClient.cin_image_url}
                              alt="CIN"
                              className="document-image"
                            />
                            <div className="document-actions">
                              <button
                                className="btn-view-document"
                                onClick={() => handleViewDocument(selectedClient.cin_image_url)}
                              >
                                <FaEye /> Agrandir
                              </button>
                              <button
                                className="btn-download-document"
                                onClick={() => handleDownloadDocument(
                                  selectedClient.id,
                                  'cin_image',
                                  `CIN_${selectedClient.nom}_${selectedClient.prenom}.jpg`
                                )}
                                disabled={downloading && downloadingType === 'cin_image'}
                              >
                                {downloading && downloadingType === 'cin_image' ? (
                                  <>
                                    <div className="spinner-small" /> Téléchargement...
                                  </>
                                ) : (
                                  <>
                                    <FaDownload /> Télécharger
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="no-document">
                          <p>Aucun document téléchargé</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Driver License Document */}
                  <div className="document-card">
                    <div className="document-header">
                      <h4>Permis de Conduire</h4>
                      {selectedClient.driver_license_is_pdf && <FaFilePdf className="pdf-indicator" />}
                    </div>
                    <div className="document-content">
                      {selectedClient.driver_license_image_url ? (
                        selectedClient.driver_license_is_pdf ? (
                          <div className="pdf-document">
                            <FaFilePdf className="pdf-icon-large" />
                            <span>Document PDF</span>
                            <div className="document-actions">
                              <button
                                className="btn-view-document"
                                onClick={() => handleViewDocument(selectedClient.driver_license_image_url)}
                              >
                                <FaEye /> Voir le PDF
                              </button>
                              <button
                                className="btn-download-document"
                                onClick={() => handleDownloadDocument(
                                  selectedClient.id,
                                  'driver_license_image',
                                  `Permis_${selectedClient.nom}_${selectedClient.prenom}.pdf`
                                )}
                                disabled={downloading && downloadingType === 'driver_license_image'}
                              >
                                {downloading && downloadingType === 'driver_license_image' ? (
                                  <>
                                    <div className="spinner-small" /> Téléchargement...
                                  </>
                                ) : (
                                  <>
                                    <FaDownload /> Télécharger
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="image-document">
                            <img
                              src={selectedClient.driver_license_image_url}
                              alt="Permis de conduire"
                              className="document-image"
                            />
                            <div className="document-actions">
                              <button
                                className="btn-view-document"
                                onClick={() => handleViewDocument(selectedClient.driver_license_image_url)}
                              >
                                <FaEye /> Agrandir
                              </button>
                              <button
                                className="btn-download-document"
                                onClick={() => handleDownloadDocument(
                                  selectedClient.id,
                                  'driver_license_image',
                                  `Permis_${selectedClient.nom}_${selectedClient.prenom}.jpg`
                                )}
                                disabled={downloading && downloadingType === 'driver_license_image'}
                              >
                                {downloading && downloadingType === 'driver_license_image' ? (
                                  <>
                                    <div className="spinner-small" /> Téléchargement...
                                  </>
                                ) : (
                                  <>
                                    <FaDownload /> Télécharger
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="no-document">
                          <p>Aucun document téléchargé</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Réservations */}
              <div className="details-section">
                <div className="section-title">
                  <FaCalendarAlt />
                  <span>Réservations ({clientReservations.length})</span>
                </div>
                {clientReservations.length > 0 ? (
                  <>
                    <div className="items-grid">
                      {currentReservations.map(reservation => (
                        <div key={reservation.id} className="item-card">
                          <div className="item-header">
                            <div className="item-title">
                              <FaCar className="item-icon" />
                              {reservation.car?.brand} {reservation.car?.model}
                            </div>
                            {getStatusBadge(reservation.status)}
                          </div>
                          <div className="item-details">
                            <div className="item-detail">
                              <FaCalendarAlt className="detail-icon" />
                              {new Date(reservation.start_date).toLocaleDateString('fr-FR')} - {new Date(reservation.end_date).toLocaleDateString('fr-FR')}
                            </div>
                            <div className="item-detail">
                              <FaClock className="detail-icon" />
                              {calculateRentalDays(reservation.start_date, reservation.end_date)} jours
                            </div>
                            <div className="item-detail">
                              <FaMoneyBill className="detail-icon" />
                              {reservation.total_price} MAD
                            </div>
                          </div>
                          <div className="item-id">Réservation #{reservation.id}</div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination des Réservations */}
                    {totalReservationsPages > 1 && (
                      <div className="details-pagination">
                        <div className="pagination">
                          {renderPaginationButtons(reservationsPage, totalReservationsPages, handleReservationsPageChange, 'details')}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-items">
                    <FaCalendarAlt size={32} />
                    <p>Aucune réservation trouvée pour ce client</p>
                  </div>
                )}
              </div>

              {/* Section Accidents */}
              <div className="details-section">
                <div className="section-title">
                  <FaCarCrash />
                  <span>Accidents ({clientAccidents.length})</span>
                </div>
                {clientAccidents.length > 0 ? (
                  <>
                    <div className="items-grid">
                      {currentAccidents.map(accident => (
                        <div key={accident.id} className="item-card accident-card">
                          <div className="item-header">
                            <div className="item-title">
                              <FaCarCrash className="item-icon accident" />
                              Rapport d'Accident
                            </div>
                            <div className="accident-date">
                              {new Date(accident.date_accident).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                          <div className="item-details">
                            <div className="item-detail">
                              <FaCar className="detail-icon" />
                              {accident.car?.brand} {accident.car?.model}
                            </div>
                            <div className="item-detail">
                              <FaMoneyBill className="detail-icon" />
                              Pertes : {accident.amount_of_losses} MAD
                            </div>
                            <div className="item-detail">
                              <FaMoneyBill className="detail-icon" />
                              Assurance : {accident.amount_assurance} MAD
                            </div>
                          </div>
                          <div className="item-id">Accident #{accident.id}</div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination des Accidents */}
                    {totalAccidentsPages > 1 && (
                      <div className="details-pagination">
                        <div className="pagination">
                          {renderPaginationButtons(accidentsPage, totalAccidentsPages, handleAccidentsPageChange, 'details')}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-items">
                    <FaCarCrash size={32} />
                    <p>Aucun accident trouvé pour ce client</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Création / Édition — FULL-SCREEN via AdminModal */}
      {showModal && (
        <AdminModal
          type="clients"
          modalType={modalType}
          formData={formData}
          setFormData={setFormData}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
          fullScreen={true}
        />
      )}

      {/* Modal de Confirmation — FULL-SCREEN via portal (matches MatriculesManagement delete) */}
      {showConfirmation && createPortal(
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

              {confirmationConfig.client && (
                <div className="client-preview">
                  <div className="client-avatar-preview">
                    {getInitials(confirmationConfig.client)}
                  </div>
                  <div className="client-info-preview">
                    <h4>{confirmationConfig.client.prenom} {confirmationConfig.client.nom}</h4>
                    <div className="client-meta-preview">
                      <div>{confirmationConfig.client.email}</div>
                      <div>{confirmationConfig.client.telephone}</div>
                      <div>
                        <FaMapMarkerAlt /> {confirmationConfig.client.city}
                      </div>
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
                Supprimer le Client
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        /* ================= Layout ================= */
        .clients-management {
          padding: 2rem; min-height: 100vh;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          background: #f8fafc; color: #334155;
        }

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
        .spinner-small {
          width: 16px; height: 16px;
          border: 2px solid #ffffff;
          border-top: 2px solid transparent;
          border-radius: 50%; animation: spin 1s linear infinite;
          display: inline-block; margin-right: 8px; vertical-align: middle;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

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
        .btn-clear { background: #ef4444; color: #fff; }
        .btn-clear:hover { background: #dc2626; }
        .btn-icon { font-size: 0.875rem; }

        /* ================= Stats ================= */
        .stats-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem; margin-bottom: 1.5rem;
        }
        .stat-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 1rem;
          padding: 1rem; transition: all 0.2s;
          display: flex; justify-content: space-between; align-items: center;
          position: relative; overflow: hidden;
        }
        .stat-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0;
          height: 4px; border-radius: 1rem 1rem 0 0;
        }
        .stat-total::before { background: linear-gradient(135deg, #667eea, #764ba2); }
        .stat-reservations::before { background: linear-gradient(135deg, #10b981, #059669); }
        .stat-accidents::before { background: linear-gradient(135deg, #f97316, #ea580c); }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        .stat-number { font-size: 1.875rem; font-weight: 700; color: #0f172a; line-height: 1; }
        .stat-label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0.35rem; }
        .stat-icon { opacity: 0.5; font-size: 2rem; }

        /* ================= Search + filters ================= */
        .search-filter-section {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 1rem;
          padding: 1rem; margin-bottom: 1.5rem;
          display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .search-box { position: relative; flex: 1; min-width: 240px; }
        .search-box .search-icon {
          position: absolute; left: 0.75rem; top: 50%;
          transform: translateY(-50%); color: #64748b;
        }
        .search-box .search-input {
          width: 100%; padding: 0.5rem 1rem 0.5rem 2.5rem;
          border: 1px solid #e2e8f0; border-radius: 0.5rem;
          font-size: 0.875rem; font-family: inherit; transition: all 0.2s;
        }
        .search-box .search-input:focus {
          outline: none; border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
        }
        .filter-group { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
        .filter-item { display: flex; flex-direction: column; gap: 0.5rem; }
        .filter-item label {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.7rem; font-weight: 600; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .filter-icon { font-size: 0.875rem; }
        .filter-select {
          padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0;
          border-radius: 0.5rem; font-size: 0.875rem;
          background: #fff; cursor: pointer; font-family: inherit; min-width: 12rem;
        }
        .filter-select:focus {
          outline: none; border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
        }

        /* ================= Results summary ================= */
        .results-summary {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1rem; padding: 0 0.25rem;
          font-size: 0.875rem; color: #64748b; flex-wrap: wrap; gap: 0.5rem;
        }
        .results-count { font-weight: 500; }
        .page-info { font-weight: 600; color: #334155; }

        /* ================= Content container ================= */
        .content-container {
          background: white; border: 1px solid #e2e8f0; border-radius: 1rem;
          overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        /* ================= Table ================= */
        .data-table {
          width: 100%; font-size: 0.875rem;
          border-collapse: collapse; min-width: 900px;
        }
        .data-table th {
          text-align: left; padding: 0.75rem 1rem;
          background: #f8fafc; color: #64748b; font-weight: 500;
          white-space: nowrap; border-bottom: 1px solid #e2e8f0;
        }
        .data-table td {
          padding: 0.75rem 1rem; border-top: 1px solid #e2e8f0;
          color: #334155; vertical-align: middle;
        }
        .data-table tr:hover { background: #f8fafc; }

        /* ================= Table cells ================= */
        .client-name { font-weight: 500; color: #0f172a; }
        .client-id { font-size: 0.7rem; color: #94a3b8; margin-top: 2px; }
        .email-cell { color: #3b82f6; }
        .phone-cell { font-family: 'Monaco', 'Consolas', monospace; }
        .city-cell { display: flex; align-items: center; gap: 0.5rem; color: #64748b; }
        .city-icon { color: #ef4444; font-size: 0.875rem; }
        .reservations-cell, .accidents-cell { text-align: center; }

        /* ================= Client avatar ================= */
        .client-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 600; font-size: 0.875rem; flex-shrink: 0;
        }

        /* ================= Count badge ================= */
        .count-badge {
          display: inline-flex; align-items: center; gap: 0.35rem;
          padding: 0.25rem 0.625rem; border-radius: 9999px;
          background: #f1f5f9; color: #475569;
          font-size: 0.7rem; font-weight: 600;
          transition: all 0.2s;
        }
        .count-badge.has-items { background: #dcfce7; color: #166534; }
        .count-badge.has-items:hover { transform: translateY(-1px); }
        .count-icon { font-size: 0.75rem; }

        /* ================= Action buttons ================= */
        .action-buttons { display: flex; gap: 0.5rem; justify-content: flex-end; }
        .action-btn {
          padding: 0.5rem; background: none; border: none; cursor: pointer;
          border-radius: 0.5rem; transition: all 0.2s;
          width: 32px; height: 32px;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .action-btn.view   { color: #06b6d4; } .action-btn.view:hover   { background: #ecfeff; }
        .action-btn.edit   { color: #10b981; } .action-btn.edit:hover   { background: #ecfdf5; }
        .action-btn.delete { color: #ef4444; } .action-btn.delete:hover { background: #fef2f2; }

        /* ================= Pagination ================= */
        .pagination-container {
          padding: 2rem; border-top: 1px solid #f1f3f4;
          display: flex; justify-content: center;
        }
        .pagination { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; justify-content: center; }
        .pagination-btn {
          display: flex; align-items: center; justify-content: center;
          padding: 0.5rem 0.75rem; min-width: 38px; height: 38px;
          border: 1px solid #e2e8f0; background: #fff; color: #64748b;
          border-radius: 0.5rem; font-size: 0.8rem; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .pagination-btn:hover:not(.disabled):not(.active) { border-color: #667eea; color: #667eea; }
        .pagination-btn.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #fff; border-color: transparent;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        .pagination-btn.disabled { opacity: 0.5; cursor: not-allowed; }
        .pagination-ellipsis { padding: 0.5rem; color: #64748b; }

        /* ================= Status badges ================= */
        .status-badge {
          display: inline-flex; align-items: center; gap: 0.25rem;
          padding: 0.25rem 0.625rem; border-radius: 9999px;
          font-size: 0.7rem; font-weight: 500; white-space: nowrap;
        }
        .status-pending   { background: #fef3c7; color: #92400e; }
        .status-confirmed { background: #dcfce7; color: #166534; }
        .status-contacted { background: #e0e7ff; color: #3730a3; }
        .status-completed { background: #dcfce7; color: #166534; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }

        /* ================= Empty state ================= */
        .no-data { text-align: center; padding: 4rem 2rem; color: #64748b; }
        .no-data svg { margin-bottom: 1.5rem; opacity: 0.3; color: #667eea; }
        .no-data p { font-size: 1.05rem; color: #495057; margin: 0 0 2rem 0; }

        /* ====================================================================
           Details modal — FULL PAGE (matches MatriculesManagement)
           ==================================================================== */
        .details-modal-overlay {
          position: fixed;
          top: 0; right: 0; bottom: 0; left: 0;
          background: #f8fafc;
          overflow-y: auto;
          overflow-x: hidden;
          z-index: 9999;
        }
        @media (min-width: 768px) {
          .details-modal-overlay { left: 18rem; }
        }
        .details-modal {
          background: #fff;
          border-radius: 32px;
          margin: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: modalSlideIn 0.3s ease-out;
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .details-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 2rem; border-bottom: 1px solid #f1f3f4;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }
        .client-header-info { display: flex; align-items: center; gap: 1.5rem; }
        .client-avatar-large {
          width: 80px; height: 80px; border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 1.5rem; flex-shrink: 0;
        }
        .client-info h2 { margin: 0 0 0.5rem 0; color: #0f172a; font-size: 1.5rem; }
        .client-contact {
          display: flex; flex-direction: column; gap: 0.5rem;
          color: #64748b; font-size: 0.9rem;
        }
        .client-contact div { display: flex; align-items: center; gap: 0.5rem; }
        .close-details-btn {
          background: none; border: none; font-size: 1.5rem;
          color: #64748b; cursor: pointer; padding: 0.5rem;
          border-radius: 0.5rem; transition: all 0.3s ease;
        }
        .close-details-btn:hover { background: #f8f9fa; color: #dc3545; }

        .details-content { padding: 2rem; }
        .details-section { margin-bottom: 2rem; }
        .details-section .section-title {
          display: flex; align-items: center; gap: 0.75rem;
          font-size: 1.25rem; font-weight: 600; color: #0f172a;
          margin-bottom: 1.5rem; background: none;
          -webkit-text-fill-color: #0f172a;
        }

        /* ================= Personal info grid ================= */
        .personal-info-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem; margin-bottom: 2rem;
        }
        .info-item {
          background: white; padding: 1rem; border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
        }
        .info-label {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.75rem; font-weight: 600; color: #64748b;
          margin-bottom: 0.25rem;
        }
        .info-value { font-size: 1rem; font-weight: 500; color: #0f172a; }

        /* ================= Documents grid ================= */
        .documents-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem; margin-bottom: 2rem;
        }
        .document-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 0.75rem;
          overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .document-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1rem; background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .document-header h4 { margin: 0; font-size: 1rem; color: #0f172a; }
        .pdf-indicator { color: #dc2626; font-size: 1.25rem; }
        .document-content { padding: 1.5rem; }
        .pdf-document {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 2rem; background: #f8f9fa;
          border-radius: 0.5rem; border: 2px dashed #cbd5e1; text-align: center;
        }
        .pdf-icon-large { font-size: 3rem; color: #dc2626; margin-bottom: 1rem; }
        .pdf-document span { font-size: 1rem; color: #64748b; margin-bottom: 1.5rem; }
        .image-document { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .document-image {
          max-width: 100%; max-height: 200px;
          border-radius: 0.5rem; border: 1px solid #e2e8f0;
        }
        .no-document { text-align: center; padding: 2rem; color: #64748b; }
        .document-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; }
        .btn-view-document {
          display: flex; align-items: center; gap: 0.5rem;
          background: #3b82f6; color: white; border: none;
          padding: 0.5rem 1rem; border-radius: 0.5rem;
          font-size: 0.875rem; cursor: pointer; transition: all 0.3s ease;
        }
        .btn-view-document:hover { background: #2563eb; transform: translateY(-1px); }
        .btn-download-document {
          display: flex; align-items: center; gap: 0.5rem;
          background: #10b981; color: white; border: none;
          padding: 0.5rem 1rem; border-radius: 0.5rem;
          font-size: 0.875rem; cursor: pointer; transition: all 0.3s ease;
        }
        .btn-download-document:hover:not(:disabled) { background: #059669; transform: translateY(-1px); }
        .btn-download-document:disabled { opacity: 0.7; cursor: not-allowed; }

        /* ================= Item cards ================= */
        .items-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem; margin-bottom: 1.5rem;
        }
        .item-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 0.75rem;
          padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }
        .item-card:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .accident-card { border-left: 4px solid #ef4444; }
        .item-header {
          display: flex; justify-content: space-between;
          align-items: flex-start; margin-bottom: 1rem;
        }
        .item-title {
          display: flex; align-items: center; gap: 0.5rem;
          font-weight: 600; color: #0f172a; font-size: 1rem;
        }
        .item-icon { font-size: 1rem; }
        .item-icon.accident { color: #ef4444; }
        .accident-date { font-size: 0.8rem; color: #64748b; font-weight: 500; }
        .item-details { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
        .item-detail {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.875rem; color: #64748b;
        }
        .detail-icon { font-size: 0.875rem; color: #667eea; width: 16px; }
        .item-id {
          font-size: 0.7rem; color: #94a3b8; text-align: right;
          font-family: 'Monaco', 'Consolas', monospace;
        }
        .no-items { text-align: center; padding: 3rem 2rem; color: #64748b; }
        .no-items svg { margin-bottom: 1rem; opacity: 0.3; }
        .no-items p { margin: 0; font-size: 1rem; }
        .details-pagination { display: flex; justify-content: center; margin-top: 1rem; }

        /* ================= Notifications ================= */
        .success-notification, .error-notification {
          position: fixed; top: 2rem; right: 2rem; z-index: 10500;
          animation: slideInRight 0.3s ease-out;
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .success-notification .notification-content {
          background: #dcfce7; color: #166534;
          padding: 1rem 1.5rem; border-radius: 0.75rem;
          display: flex; align-items: center; gap: 0.75rem;
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        }
        .error-notification .notification-content {
          background: #fee2e2; color: #991b1b;
          padding: 1rem 1.5rem; border-radius: 0.75rem;
          display: flex; align-items: center; gap: 0.75rem;
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
        }
        .notification-icon { font-size: 1.1rem; }

        /* ====================================================================
           Confirmation modal — FULL-SCREEN via portal (matches MatriculesManagement)
           ==================================================================== */
        .confirmation-modal-overlay {
          position: fixed;
          top: 0; right: 0; bottom: 0; left: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          z-index: 10000;
          padding: 1rem;
          overflow-y: auto; overflow-x: hidden;
        }
        .confirmation-modal {
          background: white; border-radius: 1.25rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 480px; width: 100%; overflow: hidden;
          animation: modalSlideIn 0.3s ease-out;
          margin: auto;
        }
        .confirmation-header { padding: 2rem 2rem 1rem; text-align: center; border-bottom: 1px solid #f1f3f4; }
        .confirmation-icon {
          width: 80px; height: 80px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem; font-size: 2rem;
        }
        .confirmation-icon.delete {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          border: 2px solid rgba(220, 53, 69, 0.2);
        }
        .confirmation-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
        .confirmation-body { padding: 1.5rem 2rem; }
        .confirmation-message {
          color: #64748b; font-size: 1rem; line-height: 1.6;
          margin-bottom: 1.5rem; text-align: center;
        }
        .client-preview {
          display: flex; align-items: center; gap: 1rem;
          padding: 1.5rem; background: #f8fafc;
          border-radius: 0.75rem; border: 1px solid #e2e8f0;
        }
        .client-avatar-preview {
          width: 60px; height: 60px; border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 600; font-size: 1.25rem; flex-shrink: 0;
        }
        .client-info-preview { flex: 1; }
        .client-info-preview h4 { margin: 0 0 0.5rem 0; color: #0f172a; font-size: 1.1rem; font-weight: 600; }
        .client-meta-preview { color: #64748b; font-size: 0.875rem; }
        .client-meta-preview div { margin-bottom: 0.25rem; }
        .confirmation-actions { padding: 1.5rem 2rem 2rem; display: flex; gap: 1rem; justify-content: flex-end; }
        .btn-confirm-cancel {
          padding: 0.75rem 1.5rem; border: 1px solid #6c757d;
          background: transparent; color: #6c757d; border-radius: 0.75rem;
          font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease;
          font-family: inherit;
        }
        .btn-confirm-cancel:hover { background: #6c757d; color: white; }
        .btn-confirm-delete {
          padding: 0.75rem 1.5rem; border: none; background: #ef4444;
          color: white; border-radius: 0.75rem; font-size: 0.875rem;
          font-weight: 600; cursor: pointer; transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
          font-family: inherit;
        }
        .btn-confirm-delete:hover {
          background: #dc2626; transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
        }

        /* ================= Responsive ================= */
        @media (max-width: 768px) {
          .clients-management { padding: 1rem; }
          .section-header { flex-direction: column; gap: 1rem; padding: 1.5rem; }
          .section-actions { width: 100%; justify-content: space-between; }
          .stats-grid { grid-template-columns: 1fr; }
          .search-filter-section { flex-direction: column; align-items: stretch; }
          .search-box { min-width: auto; }
          .filter-group { justify-content: space-between; }
          .filter-item { flex: 1; }
          .filter-select { min-width: auto; }
          .results-summary { flex-direction: column; gap: 0.5rem; align-items: flex-start; }
          .details-modal { margin: 1rem; border-radius: 24px; }
          .details-header { flex-direction: column; gap: 1rem; align-items: flex-start; }
          .client-header-info { flex-direction: column; text-align: center; gap: 1rem; }
          .items-grid { grid-template-columns: 1fr; }
          .confirmation-modal { margin: 1rem; }
          .confirmation-actions { flex-direction: column; }
          .client-preview { flex-direction: column; text-align: center; }
          .success-notification, .error-notification { right: 1rem; left: 1rem; top: 1rem; }
          .personal-info-grid { grid-template-columns: 1fr; }
          .documents-grid { grid-template-columns: 1fr; }
          .document-actions { flex-direction: column; }
          .btn-view-document, .btn-download-document { width: 100%; justify-content: center; }
        }
        @media (max-width: 480px) {
          .section-actions { flex-direction: column; gap: 1rem; }
          .confirmation-header { padding: 1.5rem 1rem 1rem; }
          .confirmation-body { padding: 1rem 1rem 1.5rem; }
          .confirmation-actions { padding: 1rem 1rem 1.5rem; }
          .details-content { padding: 1rem; }
        }
      `}</style>
    </div>
  );
};

export default GestionClients;