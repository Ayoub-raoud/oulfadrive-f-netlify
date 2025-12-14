import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaPlus, FaEdit, FaTrash, FaFileExport, FaDatabase,
  FaCheck, FaTimes, FaCar, FaGasPump, FaCog,
  FaList, FaTh, FaCalendar, FaTachometerAlt, FaIdCard,
  FaExclamationTriangle, FaEuroSign, FaPalette, FaChair, FaDoorClosed,
  FaSearch, FaFilter, FaSort, FaSortUp, FaSortDown,
  FaChevronLeft, FaChevronRight, FaStepBackward, FaStepForward
} from 'react-icons/fa';
import {
  fetchCars,
  createCar,
  updateCar,
  deleteCar,
  fetchMatricules,
  selectCars,
  selectCarsLoading,
  selectMatricules
} from '../Redux/store';
import AdminModal from './AdminModal';

const CarsManagement = () => {
  const dispatch = useDispatch();
  const cars = useSelector(selectCars);
  const matricules = useSelector(selectMatricules);
  const loading = useSelector(selectCarsLoading);
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({
    type: '',
    title: '',
    message: '',
    car: null,
    onConfirm: null
  });

  // États pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    fuelType: 'all',
    transmission: 'all',
    minPrice: '',
    maxPrice: '',
    minYear: '',
    maxYear: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'brand',
    direction: 'ascending'
  });
  const [showFilters, setShowFilters] = useState(false);

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  useEffect(() => {
    dispatch(fetchCars());
    dispatch(fetchMatricules());
  }, [dispatch]);

  // Fonction pour obtenir le statut réel de la voiture basé sur les matricules
  const getCarStatus = (car) => {
    // If car has explicit status, use it (for backward compatibility)
    if (car.status && (car.status === 'disponible' || car.status === 'non disponible')) {
      return car.status;
    }
    
    // Get matricules for this car
    const carMatricules = getCarMatricules(car);
    
    // Check if car has any active matricules
    if (carMatricules.length > 0) {
      const hasActiveMatricules = carMatricules.some(m => m.status === 'active');
      return hasActiveMatricules ? 'disponible' : 'non disponible';
    }
    
    // If no matricules are assigned, consider the car as unavailable
    return 'non disponible';
  };

  // Get matricules for a specific car
  const getCarMatricules = (car) => {
    if (!matricules || !Array.isArray(matricules)) return [];
    
    return matricules.filter(m => m.car_id === car.id);
  };

  // Helper function to get detailed matricule status for a car
  const getCarMatriculeStatus = (car) => {
    const carMatricules = getCarMatricules(car);
    
    if (carMatricules.length === 0) {
      return {
        status: 'non disponible',
        activeCount: 0,
        totalCount: 0,
        inactiveCount: 0,
        message: 'Aucune immatriculation assignée'
      };
    }
    
    const activeMatricules = carMatricules.filter(m => m.status === 'active');
    const inactiveMatricules = carMatricules.filter(m => m.status === 'inactive');
    
    return {
      status: activeMatricules.length > 0 ? 'disponible' : 'non disponible',
      activeCount: activeMatricules.length,
      totalCount: carMatricules.length,
      inactiveCount: inactiveMatricules.length,
      message: activeMatricules.length > 0 
        ? `${activeMatricules.length} immatriculation(s) active(s)` 
        : 'Toutes les immatriculations sont inactives'
    };
  };

  // Logique de filtrage et de recherche
  const filteredAndSearchedCars = React.useMemo(() => {
    if (!cars || !Array.isArray(cars)) return [];

    let filtered = cars.filter(car => {
      // Filtre par terme de recherche (marque, modèle, couleur)
      const matchesSearch = searchTerm === '' || 
        (car.brand && car.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (car.model && car.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (car.color && car.color.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filtre par statut (basé sur les matricules)
      const carStatus = getCarStatus(car);
      const matchesStatus = filters.status === 'all' || carStatus === filters.status;

      // Filtre par type de carburant
      const matchesFuelType = filters.fuelType === 'all' || car.fuel_type === filters.fuelType;

      // Filtre par transmission
      const matchesTransmission = filters.transmission === 'all' || car.transmission === filters.transmission;

      // Filtre par plage de prix
      const price = car.price_per_day || 0;
      const matchesMinPrice = !filters.minPrice || price >= parseFloat(filters.minPrice);
      const matchesMaxPrice = !filters.maxPrice || price <= parseFloat(filters.maxPrice);

      // Filtre par plage d'année
      const year = car.year || new Date().getFullYear();
      const matchesMinYear = !filters.minYear || year >= parseInt(filters.minYear);
      const matchesMaxYear = !filters.maxYear || year <= parseInt(filters.maxYear);

      return matchesSearch && matchesStatus && matchesFuelType && 
             matchesTransmission && matchesMinPrice && matchesMaxPrice &&
             matchesMinYear && matchesMaxYear;
    });

    // Tri
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Gérer les propriétés imbriquées ou les cas spéciaux
        if (sortConfig.key === 'status') {
          aValue = getCarStatus(a);
          bValue = getCarStatus(b);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [cars, searchTerm, filters, sortConfig, matricules]);

  // Logique de pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSearchedCars.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSearchedCars.length / itemsPerPage);

  // Réinitialiser à la première page lorsque les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort />;
    return sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />;
  };

  const handleCreate = () => {
    setModalType('create');
    setEditingItem(null);
    setFormData({ 
      brand: '', 
      model: '', 
      year: new Date().getFullYear(), 
      color: '', 
      price_per_day: 0, 
      status: 'disponible',
      seats: 5, 
      doors: 4, 
      fuel_type: 'petrol', 
      transmission: 'automatic'
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setModalType('edit');
    setEditingItem(item);
    setFormData({
      ...item,
      // Ensure status is properly set
      status: item.status || getCarStatus(item)
    });
    setShowModal(true);
  };

  const showDeleteConfirmation = (car) => {
    setConfirmationConfig({
      type: 'delete',
      title: 'Supprimer la Voiture',
      message: `Êtes-vous sûr de vouloir supprimer "${car.brand} ${car.model}" ? Cette action ne peut pas être annulée.`,
      car: car,
      onConfirm: () => confirmDelete(car.id)
    });
    setShowConfirmation(true);
  };

  const confirmDelete = async (id) => {
    try {
      await dispatch(deleteCar(id)).unwrap();
      setShowConfirmation(false);
      showSuccessMessage('Voiture supprimée avec succès !');
      // Refresh the cars list after deletion
      dispatch(fetchCars());
    } catch (error) {
      showErrorMessage('Erreur lors de la suppression : ' + error);
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
        await dispatch(createCar(formData)).unwrap();
        showSuccessMessage('Voiture créée avec succès !');
      } else {
        await dispatch(updateCar({ id: editingItem.id, data: formData })).unwrap();
        showSuccessMessage('Voiture mise à jour avec succès !');
      }
      setShowModal(false);
      // Refresh the cars list to get updated data
      dispatch(fetchCars());
    } catch (error) {
      showErrorMessage('Erreur : ' + error);
    }
    finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    const dataToExport = filteredAndSearchedCars.length > 0 ? filteredAndSearchedCars : cars;
    
    if (!dataToExport || dataToExport.length === 0) {
      showErrorMessage('Aucune donnée à exporter !');
      return;
    }

    const headers = ['ID', 'Marque', 'Modèle', 'Année', 'Couleur', 'Prix/Jour', 'Statut', 'Type Carburant', 'Transmission', 'Sièges', 'Portes', 'Immatriculations Actives', 'Immatriculations Totales'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(car => {
        const matriculeStatus = getCarMatriculeStatus(car);
        return [
          car.id,
          `"${car.brand}"`,
          `"${car.model}"`,
          car.year,
          `"${car.color}"`,
          car.price_per_day,
          getCarStatus(car),
          car.fuel_type,
          car.transmission,
          car.seats,
          car.doors,
          matriculeStatus.activeCount,
          matriculeStatus.totalCount
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `voitures_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccessMessage('CSV exporté avec succès !');
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      fuelType: 'all',
      transmission: 'all',
      minPrice: '',
      maxPrice: '',
      minYear: '',
      maxYear: ''
    });
    setSearchTerm('');
  };

  // Fonctions de pagination
  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  const getStatusBadge = (car) => {
    const matriculeStatus = getCarMatriculeStatus(car);
    const status = matriculeStatus.status;

    const statusConfig = {
      disponible: { class: 'status-badge active', text: 'Disponible', icon: FaCheck },
      'non disponible': { class: 'status-badge inactive', text: 'Indisponible', icon: FaTimes }
    };

    const config = statusConfig[status] || { class: 'status-badge inactive', text: status, icon: FaTimes };
    const IconComponent = config.icon;
    
    return (
      <div className="enhanced-status-badge">
        <span className={config.class}>
          <IconComponent className="badge-icon" />
          {config.text}
        </span>
        {matriculeStatus.totalCount > 0 && (
          <div className="matricule-count">
            {matriculeStatus.activeCount}/{matriculeStatus.totalCount} actives
          </div>
        )}
      </div>
    );
  };

  const getFuelTypeBadge = (fuelType) => {
    const fuelConfig = {
      petrol: { class: 'fuel-badge petrol', text: 'Essence' },
      diesel: { class: 'fuel-badge diesel', text: 'Diesel' },
      electric: { class: 'fuel-badge electric', text: 'Électrique' }
    };

    const config = fuelConfig[fuelType] || { class: 'fuel-badge petrol', text: fuelType };
    
    return (
      <span className={config.class}>
        <FaGasPump className="badge-icon" />
        {config.text}
      </span>
    );
  };

  const getTransmissionBadge = (transmission) => {
    const transmissionConfig = {
      manual: { class: 'transmission-badge manual', text: 'Manuelle' },
      automatic: { class: 'transmission-badge automatic', text: 'Automatique' }
    };

    const config = transmissionConfig[transmission] || { class: 'transmission-badge automatic', text: transmission };
    
    return (
      <span className={config.class}>
        <FaCog className="badge-icon" />
        {config.text}
      </span>
    );
  };

  const getCarStats = () => {
    const availableCars = cars?.filter(car => getCarStatus(car) === 'disponible').length || 0;
    const unavailableCars = cars?.filter(car => getCarStatus(car) === 'non disponible').length || 0;
    const petrolCars = cars?.filter(car => car.fuel_type === 'petrol').length || 0;
    const dieselCars = cars?.filter(car => car.fuel_type === 'diesel').length || 0;
    const electricCars = cars?.filter(car => car.fuel_type === 'electric').length || 0;

    // Additional matricule statistics
    const totalMatricules = matricules?.length || 0;
    const activeMatricules = matricules?.filter(m => m.status === 'active').length || 0;

    return { 
      availableCars, 
      unavailableCars, 
      petrolCars, 
      dieselCars, 
      electricCars,
      totalMatricules,
      activeMatricules
    };
  };

  const stats = getCarStats();

  // Fonction pour obtenir l'URL de l'image
  const getCarImageUrl = (car) => {
    if (car.image_url) {
      return car.image_url;
    }
    if (car.image && typeof car.image === 'string') {
      // Si c'est une URL complète, l'utiliser directement
      if (car.image.startsWith('http')) {
        return car.image;
      }
      // Si c'est un chemin relatif, construire l'URL complète
      return `https://oulfa-back-production.up.railway.app/storage/${car.image}`;
    }
    return null;
  };

  const renderCarCards = () => (
    <div className="cars-grid">
      {currentItems.map(car => {
        const imageUrl = getCarImageUrl(car);
        const matriculeStatus = getCarMatriculeStatus(car);
        
        return (
          <div key={car.id} className="car-card">
            <div className="card-header">
              <div className="car-image">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={`${car.brand} ${car.model}`} 
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`car-image-placeholder ${imageUrl ? 'hidden' : ''}`}
                >
                  <FaCar className="placeholder-icon" />
                </div>
                <div className="car-status-indicator" data-status={getCarStatus(car)}></div>
              </div>
              <div className="car-main-info">
                <h3 className="car-name">{car.brand} {car.model}</h3>
                <div className="car-year">{car.year}</div>
                <div className="car-meta">
                  {getStatusBadge(car)}
                  <div className="car-price">
                    <span className="currency-symbol">MAD</span>
                    {car.price_per_day}/jour
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card-divider"></div>

            <div className="car-details">
              <div className="detail-item">
                <FaPalette className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Couleur</span>
                  <span className="detail-value">{car.color}</span>
                </div>
              </div>
              <div className="detail-item">
                <FaGasPump className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Carburant</span>
                  <span className="detail-value">{getFuelTypeBadge(car.fuel_type)}</span>
                </div>
              </div>
              <div className="detail-item">
                <FaCog className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Transmission</span>
                  <span className="detail-value">{getTransmissionBadge(car.transmission)}</span>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-item compact">
                  <FaChair className="detail-icon" />
                  <div className="detail-content">
                    <span className="detail-label">Sièges</span>
                    <span className="detail-value">{car.seats}</span>
                  </div>
                </div>
                <div className="detail-item compact">
                  <FaDoorClosed className="detail-icon" />
                  <div className="detail-content">
                    <span className="detail-label">Portes</span>
                    <span className="detail-value">{car.doors}</span>
                  </div>
                </div>
              </div>
              <div className="detail-item">
                <FaIdCard className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Immatriculations</span>
                  <span className="detail-value">
                    {matriculeStatus.activeCount} active(s) sur {matriculeStatus.totalCount}
                  </span>
                </div>
              </div>
              {matriculeStatus.message && (
                <div className="detail-item">
                  <div className="detail-content full-width">
                    <span className="matricule-status-message">{matriculeStatus.message}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="card-divider"></div>

            <div className="card-actions">
              <button 
                className="btn-action btn-edit" 
                onClick={() => handleEdit(car)}
                title="Modifier la voiture"
              >
                <FaEdit className="action-icon" />
                <span>Modifier</span>
              </button>
              <button 
                className="btn-action btn-delete" 
                onClick={() => showDeleteConfirmation(car)}
                title="Supprimer la voiture"
              >
                <FaTrash className="action-icon" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTableView = () => (
    <table className="data-table">
      <thead>
        <tr>
          <th className="sortable" onClick={() => handleSort('brand')}>
            <div className="sort-header">
              <span>Voiture</span>
              {getSortIcon('brand')}
            </div>
          </th>
          <th className="sortable" onClick={() => handleSort('year')}>
            <div className="sort-header">
              <span>Année</span>
              {getSortIcon('year')}
            </div>
          </th>
          <th>Couleur</th>
          <th className="sortable" onClick={() => handleSort('price_per_day')}>
            <div className="sort-header">
              <span>Prix/Jour</span>
              {getSortIcon('price_per_day')}
            </div>
          </th>
          <th className="sortable" onClick={() => handleSort('status')}>
            <div className="sort-header">
              <span>Statut</span>
              {getSortIcon('status')}
            </div>
          </th>
          <th>Immatriculations</th>
          <th>Carburant</th>
          <th>Transmission</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {currentItems.map(car => {
          const matriculeStatus = getCarMatriculeStatus(car);
          return (
            <tr key={car.id}>
              <td className="car-name">
                <div className="car-info-with-image">
                  <div className="table-car-image">
                    {getCarImageUrl(car) ? (
                      <img 
                        src={getCarImageUrl(car)} 
                        alt={`${car.brand} ${car.model}`}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`table-car-image-placeholder ${getCarImageUrl(car) ? 'hidden' : ''}`}>
                      <FaCar />
                    </div>
                  </div>
                  <div className="car-text-info">
                    <strong>{car.brand} {car.model}</strong>
                    <div className="car-id">#{car.id}</div>
                  </div>
                </div>
              </td>
              <td>{car.year}</td>
              <td>{car.color}</td>
              <td className="price-cell">{car.price_per_day} MAD</td>
              <td>{getStatusBadge(car)}</td>
              <td className="matricule-info-cell">
                <div className="matricule-stats">
                  <div className="matricule-count-table">
                    {matriculeStatus.activeCount}/{matriculeStatus.totalCount}
                  </div>
                  <div className="matricule-message-table">
                    {matriculeStatus.message}
                  </div>
                </div>
              </td>
              <td>{getFuelTypeBadge(car.fuel_type)}</td>
              <td>{getTransmissionBadge(car.transmission)}</td>
              <td>
                <div className="action-buttons">
                  <button 
                    className="btn-action btn-edit" 
                    onClick={() => handleEdit(car)}
                    title="Modifier la voiture"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="btn-action btn-delete" 
                    onClick={() => showDeleteConfirmation(car)}
                    title="Supprimer la voiture"
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
  );

  // Contrôles de pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Affichage de {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredAndSearchedCars.length)} sur {filteredAndSearchedCars.length} voitures
        </div>
        
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            title="Page précédente"
          >
            <FaChevronLeft />
          </button>

          {startPage > 1 && (
            <>
              <button
                className={`pagination-btn ${1 === currentPage ? 'active' : ''}`}
                onClick={() => goToPage(1)}
              >
                1
              </button>
              {startPage > 2 && <span className="pagination-ellipsis">...</span>}
            </>
          )}

          {pageNumbers.map(pageNumber => (
            <button
              key={pageNumber}
              className={`pagination-btn ${pageNumber === currentPage ? 'active' : ''}`}
              onClick={() => goToPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
              <button
                className={`pagination-btn ${totalPages === currentPage ? 'active' : ''}`}
                onClick={() => goToPage(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            className="pagination-btn"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            title="Page suivante"
          >
            <FaChevronRight />
          </button>
        </div>

        <div className="pagination-size">
          <span>Afficher :</span>
          <select className="page-size-select" disabled>
            <option>12 par page</option>
          </select>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="cars-management loading-spinner">
        <div className="spinner"></div>
        <p>Chargement des voitures...</p>
      </div>
    );
  }

  return (
    <div className="cars-management">
      <div className="section-header">
        <div className="header-content">
          <h1 className="section-title">
            <FaCar className="title-icon" />
            Gestion du Parc Automobile
          </h1>
          <p className="section-subtitle">Gérez votre inventaire de voitures de location et leur disponibilité basée sur les immatriculations</p>
        </div>
        <div className="section-actions">
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vue liste"
            >
              <FaList />
              <span>Liste</span>
            </button>
            <button 
              className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Vue cartes"
            >
              <FaTh />
              <span>Cartes</span>
            </button>
          </div>
          <button className="btn btn-primary" onClick={handleCreate}>
            <FaPlus className="btn-icon" />
            Ajouter une Voiture
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            <FaFileExport className="btn-icon" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Section Recherche et Filtres */}
      <div className="search-filter-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par marque, modèle ou couleur..."
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

        <div className="filter-controls">
          <button 
            className={`btn btn-filter ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter className="btn-icon" />
            Filtres
            {(filters.status !== 'all' || filters.fuelType !== 'all' || filters.transmission !== 'all' || filters.minPrice || filters.maxPrice || filters.minYear || filters.maxYear) && (
              <span className="filter-badge"></span>
            )}
          </button>

          {(searchTerm || filters.status !== 'all' || filters.fuelType !== 'all' || filters.transmission !== 'all' || filters.minPrice || filters.maxPrice || filters.minYear || filters.maxYear) && (
            <div className="results-count">
              {filteredAndSearchedCars.length} voiture(s) trouvée(s)
            </div>
          )}

          {(searchTerm || filters.status !== 'all' || filters.fuelType !== 'all' || filters.transmission !== 'all' || filters.minPrice || filters.maxPrice || filters.minYear || filters.maxYear) && (
            <button className="btn btn-clear" onClick={clearFilters}>
              Tout Effacer
            </button>
          )}
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Statut</label>
              <select 
                value={filters.status} 
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">Tous les statuts</option>
                <option value="disponible">Disponible</option>
                <option value="non disponible">Indisponible</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Type de Carburant</label>
              <select 
                value={filters.fuelType} 
                onChange={(e) => setFilters(prev => ({ ...prev, fuelType: e.target.value }))}
              >
                <option value="all">Tous les carburants</option>
                <option value="petrol">Essence</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Électrique</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Transmission</label>
              <select 
                value={filters.transmission} 
                onChange={(e) => setFilters(prev => ({ ...prev, transmission: e.target.value }))}
              >
                <option value="all">Toutes les transmissions</option>
                <option value="manual">Manuelle</option>
                <option value="automatic">Automatique</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Plage de Prix (par jour)</label>
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                />
                <span>à</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Plage d'Année</label>
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minYear}
                  onChange={(e) => setFilters(prev => ({ ...prev, minYear: e.target.value }))}
                  min="1990"
                  max={new Date().getFullYear()}
                />
                <span>à</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxYear}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxYear: e.target.value }))}
                  min="1990"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cartes de Statistiques */}
      <div className="stats-grid">
        <div className="stat-card stat-available">
          <div className="stat-content">
            <div className="stat-number">{stats.availableCars}</div>
            <div className="stat-label">Voitures Disponibles</div>
          </div>
          <FaCheck className="stat-icon" />
        </div>
        <div className="stat-card stat-unavailable">
          <div className="stat-content">
            <div className="stat-number">{stats.unavailableCars}</div>
            <div className="stat-label">Voitures Indisponibles</div>
          </div>
          <FaTimes className="stat-icon" />
        </div>
        <div className="stat-card stat-petrol">
          <div className="stat-content">
            <div className="stat-number">{stats.petrolCars}</div>
            <div className="stat-label">Voitures Essence</div>
          </div>
          <FaGasPump className="stat-icon" />
        </div>
        <div className="stat-card stat-diesel">
          <div className="stat-content">
            <div className="stat-number">{stats.dieselCars}</div>
            <div className="stat-label">Voitures Diesel</div>
          </div>
          <FaGasPump className="stat-icon" />
        </div>
        <div className="stat-card stat-electric">
          <div className="stat-content">
            <div className="stat-number">{stats.electricCars}</div>
            <div className="stat-label">Voitures Électriques</div>
          </div>
          <FaCar className="stat-icon" />
        </div>
        <div className="stat-card stat-matricules">
          <div className="stat-content">
            <div className="stat-number">{stats.activeMatricules}/{stats.totalMatricules}</div>
            <div className="stat-label">Immatriculations Actives/Total</div>
          </div>
          <FaIdCard className="stat-icon" />
        </div>
      </div>

      <div className="content-container">
        {filteredAndSearchedCars.length > 0 ? (
          <>
            {viewMode === 'list' ? renderTableView() : renderCarCards()}
            {renderPagination()}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <FaDatabase />
            </div>
            <h3>Aucune Voiture Trouvée</h3>
            <p>
              {cars?.length === 0 
                ? "Commencez par ajouter votre première voiture au parc" 
                : "Aucune voiture ne correspond à vos critères de recherche. Essayez d'ajuster vos filtres."}
            </p>
            <button className="btn btn-primary" onClick={handleCreate}>
              <FaPlus className="btn-icon" />
              Ajouter une Voiture
            </button>
            {(searchTerm || filters.status !== 'all' || filters.fuelType !== 'all' || filters.transmission !== 'all') && (
              <button className="btn btn-secondary" onClick={clearFilters} style={{marginLeft: '10px'}}>
                Effacer les Filtres
              </button>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <AdminModal
          type="cars"
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
              
              {confirmationConfig.car && (
                <div className="car-preview">
                  <div className="car-image-preview">
                    {getCarImageUrl(confirmationConfig.car) ? (
                      <img 
                        src={getCarImageUrl(confirmationConfig.car)} 
                        alt={`${confirmationConfig.car.brand} ${confirmationConfig.car.model}`} 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`car-image-placeholder-preview ${getCarImageUrl(confirmationConfig.car) ? 'hidden' : ''}`}>
                      <FaCar className="placeholder-icon" />
                    </div>
                  </div>
                  <div className="car-info-preview">
                    <h4>{confirmationConfig.car.brand} {confirmationConfig.car.model}</h4>
                    <div className="car-meta-preview">
                      {getStatusBadge(confirmationConfig.car)}
                      <div className="car-price-preview">
                        ${confirmationConfig.car.price_per_day}/jour
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
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .cars-management {
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

        /* Enhanced Status Badge */
        .enhanced-status-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .matricule-count {
          font-size: 0.7rem;
          color: #6c757d;
          font-weight: 500;
        }

        .matricule-status-message {
          font-size: 0.75rem;
          color: #6c757d;
          font-style: italic;
          background: #f8f9fa;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          border-left: 3px solid #667eea;
        }

        .matricule-info-cell {
          min-width: 120px;
        }

        .matricule-stats {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .matricule-count-table {
          font-weight: 600;
          color: #495057;
        }

        .matricule-message-table {
          font-size: 0.75rem;
          color: #6c757d;
          font-style: italic;
        }

        .detail-content.full-width {
          width: 100%;
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

        /* Search and Filter Section */
        .search-filter-section {
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          margin-bottom: 2rem;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .search-box {
          position: relative;
          margin-bottom: 1rem;
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
          border: 2px solid #e9ecef;
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

        .filter-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .btn-filter {
          position: relative;
          background: #6c757d;
          color: white;
          box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
        }

        .btn-filter.active {
          background: #495057;
        }

        .filter-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 10px;
          height: 10px;
          background: #dc3545;
          border-radius: 50%;
          border: 2px solid white;
        }

        .results-count {
          color: #6c757d;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .btn-clear {
          background: transparent;
          color: #6c757d;
          border: 1px solid #6c757d;
          padding: 0.5rem 1rem;
        }

        .btn-clear:hover {
          background: #6c757d;
          color: white;
        }

        .filters-panel {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e9ecef;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #495057;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-group select,
        .filter-group input {
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 0.875rem;
          transition: all 0.3s ease;
          background: #f8f9fa;
        }

        .filter-group select:focus,
        .filter-group input:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .range-inputs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .range-inputs input {
          flex: 1;
        }

        .range-inputs span {
          color: #6c757d;
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* Sortable Headers */
        .sortable {
          cursor: pointer;
          user-select: none;
        }

        .sort-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sort-header:hover {
          color: #667eea;
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
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

        .stat-available::before { background: linear-gradient(135deg, #4CAF50, #45a049); }
        .stat-unavailable::before { background: linear-gradient(135deg, #f44336, #da190b); }
        .stat-petrol::before { background: linear-gradient(135deg, #FF9800, #f57c00); }
        .stat-diesel::before { background: linear-gradient(135deg, #795548, #5d4037); }
        .stat-electric::before { background: linear-gradient(135deg, #2196F3, #0b7dda); }
        .stat-matricules::before { background: linear-gradient(135deg, #667eea, #764ba2); }

        .stat-content {
          flex: 1;
        }

        .stat-number {
          font-size: 2rem;
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

        .car-info-with-image {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .table-car-image {
          width: 60px;
          height: 40px;
          border-radius: 6px;
          overflow: hidden;
          position: relative;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .table-car-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .table-car-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6c757d;
          font-size: 0.875rem;
        }

        .table-car-image-placeholder.hidden {
          display: none;
        }

        .car-text-info {
          flex: 1;
        }

        .car-id {
          font-weight: 600;
          color: #6c757d;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        .car-name {
          font-weight: 600;
          color: #2c3e50;
        }

        .price-cell {
          font-weight: 600;
          color: #28a745;
        }

        /* Cars Grid (Card View) */
        .cars-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 1.5rem;
          padding: 2rem;
        }

        .car-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          overflow: hidden;
          transition: all 0.3s ease;
          border: 1px solid rgba(255,255,255,0.2);
          position: relative;
        }

        .car-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        }

        .card-header {
          padding: 1.5rem;
        }

        .car-image {
          position: relative;
          margin-bottom: 1rem;
          height: 160px;
          border-radius: 12px;
          overflow: hidden;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .car-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .car-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6c757d;
        }

        .car-image-placeholder.hidden {
          display: none;
        }

        .placeholder-icon {
          font-size: 3rem;
          opacity: 0.5;
        }

        .car-status-indicator {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
        }

        .car-status-indicator[data-status="disponible"] {
          background: #4CAF50;
        }

        .car-status-indicator[data-status="non disponible"] {
          background: #f44336;
        }

        .car-main-info h3 {
          margin: 0 0 0.25rem 0;
          color: #1a1a1a;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .car-year {
          color: #6c757d;
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
        }

        .car-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .car-price {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 700;
          color: #28a745;
          font-size: 1.1rem;
        }

        .price-icon {
          font-size: 0.875rem;
        }

        .card-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e9ecef, transparent);
          margin: 0 1.5rem;
        }

        .car-details {
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

        .detail-row {
          display: flex;
          gap: 1rem;
        }

        .detail-item.compact {
          flex: 1;
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

        /* Status & Badges */
        .status-badge, .fuel-badge, .transmission-badge {
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

        .fuel-badge.petrol {
          background: rgba(255, 152, 0, 0.1);
          color: #ef6c00;
          border: 1px solid rgba(255, 152, 0, 0.2);
        }

        .fuel-badge.diesel {
          background: rgba(121, 85, 72, 0.1);
          color: #4e342e;
          border: 1px solid rgba(121, 85, 72, 0.2);
        }

        .fuel-badge.electric {
          background: rgba(33, 150, 243, 0.1);
          color: #1565c0;
          border: 1px solid rgba(33, 150, 243, 0.2);
        }

        .transmission-badge.manual {
          background: rgba(156, 39, 176, 0.1);
          color: #7b1fa2;
          border: 1px solid rgba(156, 39, 176, 0.2);
        }

        .transmission-badge.automatic {
          background: rgba(0, 150, 136, 0.1);
          color: #00796b;
          border: 1px solid rgba(0, 150, 136, 0.2);
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

        /* Pagination Styles */
        .pagination-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-top: 1px solid #e9ecef;
          background: #f8f9fa;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .pagination-info {
          color: #6c757d;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 40px;
          height: 40px;
          padding: 0.5rem;
          border: 1px solid #e9ecef;
          background: white;
          color: #495057;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #007bff;
          color: white;
          border-color: #007bff;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
        }

        .pagination-btn.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
        }

        .pagination-btn:disabled {
          background: #f8f9fa;
          color: #6c757d;
          cursor: not-allowed;
          opacity: 0.6;
          transform: none;
        }

        .pagination-ellipsis {
          padding: 0.5rem;
          color: #6c757d;
          font-weight: 500;
        }

        .pagination-size {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6c757d;
          font-size: 0.875rem;
        }

        .page-size-select {
          padding: 0.5rem;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          background: white;
          color: #495057;
          font-size: 0.875rem;
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

        .car-preview {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }

        .car-image-preview {
          flex-shrink: 0;
          width: 80px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .car-image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .car-image-placeholder-preview {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6c757d;
        }

        .car-image-placeholder-preview.hidden {
          display: none;
        }

        .car-info-preview {
          flex: 1;
        }

        .car-info-preview h4 {
          margin: 0 0 0.5rem 0;
          color: #1a1a1a;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .car-meta-preview {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .car-price-preview {
          font-weight: 600;
          color: #28a745;
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
          .cars-management {
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

          .search-filter-section {
            padding: 1rem;
          }

          .filter-controls {
            flex-direction: column;
            align-items: flex-start;
          }

          .filters-panel {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .content-container {
            overflow-x: auto;
          }

          .data-table {
            min-width: 800px;
          }

          .cars-grid {
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

          .pagination-container {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .pagination-controls {
            flex-wrap: wrap;
            justify-content: center;
          }

          .confirmation-modal {
            margin: 1rem;
          }

          .confirmation-actions {
            flex-direction: column;
          }

          .car-preview {
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

          .car-card {
            margin: 0.5rem;
          }

          .pagination-btn {
            min-width: 36px;
            height: 36px;
            padding: 0.25rem;
            font-size: 0.75rem;
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

          .range-inputs {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
          .currency-symbol {
  font-weight: bold;
  color: #28a745;
  margin-right: 2px;
}
      `}</style>
    </div>
  );
};

export default CarsManagement;