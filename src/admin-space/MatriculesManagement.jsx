// src/components/admin/MatriculesManagement.jsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  FaPlus, FaEdit, FaTrash, FaFileExport, FaDatabase, FaCar,
  FaCalendarAlt, FaExclamationTriangle, FaArrowLeft, FaDollarSign,
  FaCheck, FaTimes, FaSearch, FaFilter, FaSort, FaSortUp, FaSortDown,
  FaTachometerAlt, FaCog, FaOilCan, FaCalendarCheck, FaIdCard,
  FaChevronLeft, FaChevronRight, FaUser, FaEye,
  FaCarCrash, FaClock, FaMoneyBill, FaBan, FaInfoCircle,
  FaPrint, FaSpinner, FaRedo, FaMapMarkerAlt, FaEnvelope, FaPhone,
  FaTools, FaWrench, FaGasPump, FaWind, FaVial, FaShieldAlt,
  FaExclamationCircle, FaBell
} from 'react-icons/fa';
import PaginationControls from '../components/PaginationControls';
import {
  fetchMatricules,
  createMatricule,
  updateMatricule,
  deleteMatricule,
  fetchReservations,
  fetchAccidents,
  fetchCars,
  createAccident,
  selectMatricules,
  selectMatriculesLoading,
  selectReservations,
  selectAccidents,
  selectCars,
  selectReservedMatricules,
  selectLateMatricules
} from '../Redux/store';
import AdminModal from './AdminModal';

const MatriculesManagement = ({ onBack, filter }) => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
const filterParam = searchParams.get('filter');
  const matricules = useSelector(selectMatricules);
  const reservations = useSelector(selectReservations);
  const accidents = useSelector(selectAccidents);
  const cars = useSelector(selectCars);
  const loading = useSelector(selectMatriculesLoading);
  const reservedMatricules = useSelector(selectReservedMatricules);
  const lateMatricules = useSelector(selectLateMatricules);
  const [submittingAccident, setSubmittingAccident] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({
    type: '',
    title: '',
    message: '',
    matricule: null,
    onConfirm: null
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(filter || 'all');
  const [vidangeFilter, setVidangeFilter] = useState('all');
  const [carFilter, setCarFilter] = useState('all');
  const [fuelTypeFilter, setFuelTypeFilter] = useState('all');
  const [transmissionFilter, setTransmissionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

  const [selectedMatricule, setSelectedMatricule] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [reservationsPage, setReservationsPage] = useState(1);
  const [accidentsPage, setAccidentsPage] = useState(1);
  const detailsItemsPerPage = 6;

  const [showAccidentModal, setShowAccidentModal] = useState(false);
  const [selectedMatriculeForAccident, setSelectedMatriculeForAccident] = useState(null);
  const [accidentFormData, setAccidentFormData] = useState({
    date_accident: new Date().toISOString().split('T')[0],
    amount_of_losses: 0,
    amount_assurance: 0,
    matricule_id: '',
    car_id: '',
    client_id: '',
    status: 'pending',
    accident_type: 'grave',
    procedure_type: 'classic',
    expert_decision: 'pending',
    img_accident: [],
    img_evaluation_expert: [],
    img_fixed: [],
    image_facture: []
  });
  const [availableClients, setAvailableClients] = useState([]);

  const [inactiveReasons, setInactiveReasons] = useState({});
  const [maintenanceAlerts, setMaintenanceAlerts] = useState({});

  useEffect(() => {
    if (filter) {
      setStatusFilter(filter);
      setCurrentPage(1);
    }
  }, [filter]);

  useEffect(() => {
    dispatch(fetchMatricules());
    dispatch(fetchReservations());
    dispatch(fetchAccidents());
    dispatch(fetchCars());
  }, [dispatch]);

  useEffect(() => {
    if (matricules.length > 0 && reservations.length > 0 && accidents.length > 0) {
      const reasons = {};
      const alerts = {};

      matricules.forEach(matricule => {
        if (matricule.status === 'inactive') {
          reasons[matricule.id] = getInactiveReason(matricule);
        }
        const maintenanceAlertsForMatricule = checkMaintenanceAlerts(matricule);
        if (maintenanceAlertsForMatricule.length > 0) {
          alerts[matricule.id] = maintenanceAlertsForMatricule;
        }
      });

      setInactiveReasons(reasons);
      setMaintenanceAlerts(alerts);
    }
  }, [matricules, reservations, accidents]);

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

  const checkMaintenanceAlerts = (matricule) => {
    const alerts = [];
    const currentKm = matricule.kilometrage || 0;

    if (matricule.additional_maintenance && Array.isArray(matricule.additional_maintenance)) {
      matricule.additional_maintenance.forEach(item => {
        if (item.needs_attention || item.requires_attention) {
          if (item.actual_km > item.recommended_km) {
            const kmOverdue = item.actual_km - item.recommended_km;
            alerts.push({
              type: 'additional_maintenance', severity: 'high',
              message: `${item.name}: DÉPASSÉ de ${kmOverdue} km`,
              itemName: item.name, overdue: kmOverdue,
              actualKm: item.actual_km, recommendedKm: item.recommended_km
            });
          } else if (item.actual_km >= item.recommended_km - 500) {
            const kmRemaining = item.recommended_km - item.actual_km;
            alerts.push({
              type: 'additional_maintenance', severity: 'medium',
              message: `${item.name}: Dans ${kmRemaining} km`,
              itemName: item.name, remaining: kmRemaining,
              actualKm: item.actual_km, recommendedKm: item.recommended_km
            });
          }
        }
      });
    }

    if (matricule.periodic_km_maintenance && Array.isArray(matricule.periodic_km_maintenance)) {
      matricule.periodic_km_maintenance.forEach(item => {
        if (currentKm >= item.next_change_km) {
          const kmOverdue = currentKm - item.next_change_km;
          alerts.push({
            type: 'periodic_km', severity: 'high',
            message: `${item.name}: DÉPASSÉ de ${kmOverdue} km`,
            itemName: item.name, overdue: kmOverdue,
            currentKm: currentKm, nextChangeKm: item.next_change_km
          });
        } else if (currentKm >= item.next_change_km - 1000) {
          const kmRemaining = item.next_change_km - currentKm;
          alerts.push({
            type: 'periodic_km', severity: 'medium',
            message: `${item.name}: Dans ${kmRemaining} km`,
            itemName: item.name, remaining: kmRemaining,
            currentKm: currentKm, nextChangeKm: item.next_change_km
          });
        }
      });
    }

    if (matricule.vidange_status === 'not done') {
      const maintenanceInterval = 10000;
      const kmSinceLastReset = currentKm % maintenanceInterval;
      const kmRemaining = maintenanceInterval - kmSinceLastReset;

      if (kmRemaining <= 0) {
        const kmOverdue = Math.abs(kmRemaining);
        alerts.push({
          type: 'vidange', severity: 'high',
          message: `Vidange: DÉPASSÉ de ${kmOverdue} km`,
          overdue: kmOverdue, currentKm: currentKm
        });
      } else if (kmRemaining <= 1000) {
        alerts.push({
          type: 'vidange', severity: 'medium',
          message: `Vidange: Dans ${kmRemaining} km`,
          remaining: kmRemaining, currentKm: currentKm
        });
      }
    }

    return alerts;
  };

  const getInactiveReason = (matricule) => {
    const matriculeAccidents = accidents.filter(accident =>
      accident.matricule_id === matricule.id &&
      accident.status !== 'completed' &&
      accident.status !== 'fixed'
    );

    if (matriculeAccidents.length > 0) {
      const latestAccident = matriculeAccidents[0];
      return {
        type: 'accident',
        message: `Accident le ${new Date(latestAccident.date_accident).toLocaleDateString('fr-FR')}`,
        accident: latestAccident
      };
    }

    const activeReservations = reservations.filter(reservation =>
      reservation.matricule_id === matricule.id &&
      ['pending', 'confirmed', 'contacted'].includes(reservation.status)
    );

    if (activeReservations.length > 0) {
      const latestReservation = activeReservations[0];
      return {
        type: 'reservation',
        message: `Réservation active du ${new Date(latestReservation.start_date).toLocaleDateString('fr-FR')}`,
        reservation: latestReservation
      };
    }

    if (matricule.vidange_status === 'not done') {
      return { type: 'maintenance', message: 'Maintenance requise (Vidange non effectuée)' };
    }

    return { type: 'manual', message: 'Défini manuellement comme inactif' };
  };

  const filteredMatricules = matricules.filter(matricule => {
  const matchesSearch = searchTerm === '' ||
    matricule.matricule_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    matricule.car?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    matricule.car?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    matricule.id.toString().includes(searchTerm);

  let matchesStatus = true;
  if (statusFilter !== 'all') {
    if (statusFilter === 'reserved') {
      const isReserved = reservations.some(reservation =>
        (reservation.status === 'confirmed' ||
          reservation.status === 'retard' ||
          reservation.status === 'pending') &&
        reservation.matricule_id === matricule.id
      );
      matchesStatus = isReserved;
    } else if (statusFilter === 'late') {
      const isLate = reservations.some(reservation =>
        reservation.status === 'retard' &&
        reservation.matricule_id === matricule.id
      );
      matchesStatus = isLate;
    } else {
      matchesStatus = matricule.status === statusFilter;
    }
  }

  const matchesVidange = vidangeFilter === 'all' || matricule.vidange_status === vidangeFilter;
  const matchesCar = carFilter === 'all' || matricule.car_id == carFilter;
  const matchesFuelType = fuelTypeFilter === 'all' ||
    (matricule.car && matricule.car.fuel_type === fuelTypeFilter);
  const matchesTransmission = transmissionFilter === 'all' ||
    (matricule.car && matricule.car.transmission === transmissionFilter);

  // 🔔 Notification filter: matricules with expiring/expired visit tech OR insurance
  let matchesNotification = true;
  if (filterParam === 'notifications') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isExpiringOrExpired = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 7; // expired OR expiring within 7 days
    };
    matchesNotification =
      isExpiringOrExpired(matricule.visit_tech) ||
      isExpiringOrExpired(matricule.date_assurance);
  }

  return matchesSearch && matchesStatus && matchesVidange &&
    matchesCar && matchesFuelType && matchesTransmission && matchesNotification;
});

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'none';
    setSortConfig({ key, direction });
  };

  const getSortedMatricules = () => {
    if (!sortConfig.key || sortConfig.direction === 'none') return filteredMatricules;

    const sorted = [...filteredMatricules].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'car') {
        aValue = a.car ? `${a.car.brand} ${a.car.model}`.toLowerCase() : '';
        bValue = b.car ? `${b.car.brand} ${b.car.model}`.toLowerCase() : '';
      } else if (sortConfig.key === 'matricule_code') {
        aValue = a.matricule_code ? a.matricule_code.toLowerCase() : '';
        bValue = b.matricule_code ? b.matricule_code.toLowerCase() : '';
      } else if (sortConfig.key === 'kilometrage') {
        aValue = a.kilometrage || 0;
        bValue = b.kilometrage || 0;
      } else if (sortConfig.key === 'visit_tech') {
        aValue = a.visit_tech ? new Date(a.visit_tech).getTime() : 0;
        bValue = b.visit_tech ? new Date(b.visit_tech).getTime() : 0;
      } else if (sortConfig.key === 'vidange_status') {
        const statusOrder = { 'done': 1, 'not done': 2 };
        aValue = statusOrder[a.vidange_status] || 3;
        bValue = statusOrder[b.vidange_status] || 3;
      } else if (sortConfig.key === 'status') {
        const statusOrder = { 'active': 1, 'reserved': 2, 'late': 3, 'inactive': 4 };
        aValue = statusOrder[a.status] || 5;
        bValue = statusOrder[b.status] || 5;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="sort-icon" />;
    if (sortConfig.direction === 'asc') return <FaSortUp className="sort-icon active" />;
    if (sortConfig.direction === 'desc') return <FaSortDown className="sort-icon active" />;
    return <FaSort className="sort-icon" />;
  };

  const getAvailableClientsForAccident = (matriculeId, accidentDate) => {
    if (!matriculeId || !accidentDate) return [];
    const accidentDateObj = new Date(accidentDate);
    return reservations.filter(reservation =>
      reservation.matricule_id === matriculeId &&
      (reservation.status === 'completed' || reservation.status === 'confirmed') &&
      new Date(reservation.start_date) <= accidentDateObj &&
      new Date(reservation.end_date) >= accidentDateObj
    ).map(reservation => ({
      id: reservation.client_id,
      name: `${reservation.client?.prenom} ${reservation.client?.nom}`,
      reservation_id: reservation.id,
      start_date: reservation.start_date,
      end_date: reservation.end_date,
      status: reservation.status
    }));
  };

  const getReservationStatusText = (status) => {
    const statusMap = {
      'pending': 'En Attente',
      'confirmed': 'Confirmée',
      'completed': 'Terminée',
      'retard': 'En Retard',
      'cancelled': 'Annulée',
      'contacted': 'Contactée'
    };
    return statusMap[status] || status;
  };

  useEffect(() => {
    if (selectedMatriculeForAccident && accidentFormData.date_accident) {
      const clients = getAvailableClientsForAccident(
        selectedMatriculeForAccident.id,
        accidentFormData.date_accident
      );
      setAvailableClients(clients);

      if (clients.length === 1) {
        setAccidentFormData(prev => ({ ...prev, client_id: clients[0].id }));
      } else {
        setAccidentFormData(prev => ({ ...prev, client_id: '' }));
      }
    }
  }, [selectedMatriculeForAccident, accidentFormData.date_accident, reservations]);

  const sortedMatricules = getSortedMatricules();
  const totalPages = Math.ceil(sortedMatricules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMatricules = sortedMatricules.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };
  const handleStatusFilter = (e) => { setStatusFilter(e.target.value); setCurrentPage(1); };
  const handleVidangeFilter = (e) => { setVidangeFilter(e.target.value); setCurrentPage(1); };
  const handleCarFilter = (e) => { setCarFilter(e.target.value); setCurrentPage(1); };
  const handleFuelTypeFilter = (e) => { setFuelTypeFilter(e.target.value); setCurrentPage(1); };
  const handleTransmissionFilter = (e) => { setTransmissionFilter(e.target.value); setCurrentPage(1); };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setVidangeFilter('all');
    setCarFilter('all');
    setFuelTypeFilter('all');
    setTransmissionFilter('all');
    setCurrentPage(1);
    setSortConfig({ key: null, direction: 'asc' });
  };

  const handleViewDetails = (matricule) => {
    setSelectedMatricule(matricule);
    setReservationsPage(1);
    setAccidentsPage(1);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedMatricule(null);
  };

  const getMatriculeReservations = (matriculeId) => reservations.filter(r => r.matricule_id === matriculeId);
  const getMatriculeAccidents = (matriculeId) => accidents.filter(a => a.matricule_id === matriculeId);

  const matriculeReservations = selectedMatricule ? getMatriculeReservations(selectedMatricule.id) : [];
  const matriculeAccidents = selectedMatricule ? getMatriculeAccidents(selectedMatricule.id) : [];

  const totalReservationsPages = Math.ceil(matriculeReservations.length / detailsItemsPerPage);
  const totalAccidentsPages = Math.ceil(matriculeAccidents.length / detailsItemsPerPage);

  const currentReservations = matriculeReservations.slice(
    (reservationsPage - 1) * detailsItemsPerPage,
    reservationsPage * detailsItemsPerPage
  );
  const currentAccidents = matriculeAccidents.slice(
    (accidentsPage - 1) * detailsItemsPerPage,
    accidentsPage * detailsItemsPerPage
  );

  const handleReservationsPageChange = (page) => setReservationsPage(page);
  const handleAccidentsPageChange = (page) => setAccidentsPage(page);

  const handleCreate = () => {
    setModalType('create');
    setEditingItem(null);
    setFormData({
      matricule_code: '',
      kilometrage: 0,
      kilometrage_sortie: 0,
      kilometrage_entree: 0,
      status: 'active',
      visit_tech: new Date().toISOString().split('T')[0],
      vidange_status: 'not done',
      car_id: '',
      paquets_de_voiture: 'no',
      paquets_de_frein: 'no',
      filter_oil: 'no',
      filter_air: 'no',
      ad_blue: 'no',
      oil: 'no'
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setModalType('edit');
    setEditingItem(item);
    setFormData({
      ...item,
      car_id: item.car_id || '',
      visit_tech: item.visit_tech ? new Date(item.visit_tech).toISOString().split('T')[0] : '',
      paquets_de_voiture: item.paquets_de_voiture || 'no',
      paquets_de_frein: item.paquets_de_frein || 'no',
      filter_oil: item.filter_oil || 'no',
      filter_air: item.filter_air || 'no',
      ad_blue: item.ad_blue || 'no',
      oil: item.oil || 'no'
    });
    setShowModal(true);
  };

  const handleAddToAccident = (matricule) => {
    setSelectedMatriculeForAccident(matricule);
    const clients = getAvailableClientsForAccident(
      matricule.id,
      new Date().toISOString().split('T')[0]
    );

    setAvailableClients(clients);
    setAccidentFormData({
      date_accident: new Date().toISOString().split('T')[0],
      amount_of_losses: 0,
      amount_assurance: 0,
      matricule_id: matricule.id,
      car_id: matricule.car_id || '',
      client_id: clients.length === 1 ? clients[0].id : '',
      status: 'pending',
      accident_type: 'grave',
      procedure_type: 'classic',
      expert_decision: 'pending',
      expert_amount: null,
      expert_notes: '',
      notes: '',
      img_accident: [],
      img_evaluation_expert: [],
      img_fixed: [],
      image_facture: []
    });
    setShowAccidentModal(true);
  };

  const handleCreateAccident = async (e) => {
    e.preventDefault();
    setSubmittingAccident(true);

    if (!accidentFormData.client_id) {
      showErrorMessage('Veuillez sélectionner un client pour le rapport d\'accident');
      setSubmittingAccident(false);
      return;
    }

    try {
      const completeAccidentData = {
        date_accident: accidentFormData.date_accident,
        amount_of_losses: accidentFormData.amount_of_losses || 0,
        amount_assurance: accidentFormData.amount_assurance || 0,
        nom_expert: accidentFormData.nom_expert || '',
        status: accidentFormData.status || 'pending',
        accident_type: accidentFormData.accident_type || 'grave',
        procedure_type: accidentFormData.procedure_type || 'classic',
        expert_decision: accidentFormData.expert_decision || 'pending',
        expert_amount: accidentFormData.expert_amount || null,
        expert_notes: accidentFormData.expert_notes || '',
        notes: accidentFormData.notes || '',
        matricule_id: accidentFormData.matricule_id,
        car_id: accidentFormData.car_id,
        client_id: accidentFormData.client_id,
        img_accident: accidentFormData.img_accident || [],
        img_evaluation_expert: accidentFormData.img_evaluation_expert || [],
        img_fixed: accidentFormData.img_fixed || [],
        image_facture: accidentFormData.image_facture || []
      };

      await dispatch(createAccident(completeAccidentData)).unwrap();
      showSuccessMessage('Accident créé avec succès ! Le statut du matricule sera mis à jour.');
      setShowAccidentModal(false);
      setSelectedMatriculeForAccident(null);
      setAccidentFormData({
        date_accident: new Date().toISOString().split('T')[0],
        amount_of_losses: 0, amount_assurance: 0,
        matricule_id: '', car_id: '', client_id: '',
        status: 'pending', accident_type: 'grave', procedure_type: 'classic',
        expert_decision: 'pending', img_accident: [], img_evaluation_expert: [],
        img_fixed: [], image_facture: []
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'accident:', error);
      showErrorMessage('Erreur lors de la création de l\'accident: ' + error);
    } finally {
      setSubmittingAccident(false);
    }
  };

  const showDeleteConfirmation = (matricule) => {
    setConfirmationConfig({
      type: 'delete',
      title: 'Supprimer le Matricule',
      message: `Êtes-vous sûr de vouloir supprimer le matricule "${matricule.matricule_code}" ? Cette action ne peut pas être annulée.`,
      matricule: matricule,
      onConfirm: () => confirmDelete(matricule.id)
    });
    setShowConfirmation(true);
  };

  const confirmDelete = async (id) => {
    try {
      await dispatch(deleteMatricule(id)).unwrap();
      setShowConfirmation(false);
      showSuccessMessage('Matricule supprimé avec succès !');
      dispatch(fetchMatricules());
    } catch (error) {
      showErrorMessage('Erreur lors de la suppression du matricule: ' + error);
    }
  };

  const showSuccessMessage = (message) => {
    document.querySelectorAll('.success-notification, .error-notification').forEach(n => n.remove());
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <FaCheck class="notification-icon" />
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => { if (notification.parentNode) notification.remove(); }, 5000);
  };

  const showErrorMessage = (message) => {
    document.querySelectorAll('.success-notification, .error-notification').forEach(n => n.remove());
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <FaTimes class="notification-icon" />
        <span>${message}</span>
        <button onclick="this.parentNode.parentNode.remove()" style="background: none; border: none; color: inherit; cursor: pointer; margin-left: 10px;">
          <FaTimes />
        </button>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => { if (notification.parentNode) notification.remove(); }, 8000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modalType === 'create') {
        await dispatch(createMatricule(formData)).unwrap();
        showSuccessMessage('Matricule créé avec succès !');
      } else {
        await dispatch(updateMatricule({ id: editingItem.id, data: formData })).unwrap();
        showSuccessMessage('Matricule mis à jour avec succès !');
      }
      setShowModal(false);
      dispatch(fetchMatricules());
    } catch (error) {
      showErrorMessage('Erreur lors de la sauvegarde du matricule: ' + error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    if (!matricules || matricules.length === 0) {
      showErrorMessage('Aucune donnée à exporter !');
      return;
    }

    const headers = ['ID', 'Code Matricule', 'Voiture', 'Kilométrage', 'Visite Technique', 'Vidange', 'Statut', 'Raison Inactivité'];
    const csvContent = [
      headers.join(','),
      ...matricules.map(matricule => [
        matricule.id,
        `"${matricule.matricule_code}"`,
        `"${matricule.car?.brand} ${matricule.car?.model}"`,
        matricule.kilometrage,
        matricule.visit_tech,
        matricule.vidange_status,
        matricule.status,
        `"${matricule.status === 'inactive' ? (inactiveReasons[matricule.id]?.message || 'Inconnue') : 'N/A'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `export_matricules_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccessMessage('CSV exporté avec succès !');
  };

  const getMatriculeStats = () => {
    const totalMatricules = matricules.length;
    const activeMatricules = matricules.filter(m => m.status === 'active').length;
    const vidangeDone = matricules.filter(m => m.vidange_status === 'done').length;
    const inactiveMatricules = matricules.filter(m => m.status === 'inactive').length;
    return { totalMatricules, activeMatricules, vidangeDone, inactiveMatricules };
  };

  const stats = getMatriculeStats();

  const getStatusBadge = (status, matricule = null) => {
    let actualStatus = status;
    if (status === 'active' && matricule) {
      const isReserved = reservations.some(r =>
        (r.status === 'confirmed' || r.status === 'pending') && r.matricule_id === matricule.id);
      const isLate = reservations.some(r =>
        r.status === 'retard' && r.matricule_id === matricule.id);

      if (isLate) actualStatus = 'late';
      else if (isReserved) actualStatus = 'reserved';
    }

    const statusConfig = {
      active: { class: 'status-badge status-active', text: 'Actif', icon: FaCheck },
      inactive: { class: 'status-badge status-inactive', text: 'Inactif', icon: FaTimes },
      reserved: { class: 'status-badge status-reserved', text: 'Réservé', icon: FaCalendarAlt },
      late: { class: 'status-badge status-late', text: 'En Retard', icon: FaExclamationTriangle },
      done: { class: 'status-badge status-completed', text: 'Effectué' },
      'not done': { class: 'status-badge status-pending', text: 'Non Effectué' },
      pending: { class: 'status-badge status-pending', text: 'En Attente' },
      confirmed: { class: 'status-badge status-confirmed', text: 'Confirmé' },
      completed: { class: 'status-badge status-completed', text: 'Terminé' },
      cancelled: { class: 'status-badge status-cancelled', text: 'Annulé' }
    };

    const config = statusConfig[actualStatus] || { class: 'status-badge status-pending', text: status };
    const IconComponent = config.icon;

    return (
      <div className="status-badge-container">
        <span className={config.class}>
          {IconComponent && <IconComponent className="status-icon" />}
          {config.text}
        </span>
        {actualStatus === 'inactive' && matricule && matricule.id && inactiveReasons[matricule.id] && (
          <div className="inactive-reason-wrapper">
            <FaInfoCircle className="reason-icon-hover" />
            <div className="inactive-reason-tooltip">
              <div className="tooltip-content">
                <strong>Raison d'inactivité :</strong> {inactiveReasons[matricule.id].message}
                {inactiveReasons[matricule.id].type === 'accident' && (
                  <div className="reason-details">Type : Accident - {inactiveReasons[matricule.id].accident?.amount_of_losses} pertes</div>
                )}
                {inactiveReasons[matricule.id].type === 'reservation' && (
                  <div className="reason-details">Type : Réservation Active</div>
                )}
                {inactiveReasons[matricule.id].type === 'maintenance' && (
                  <div className="reason-details">Type : Maintenance Requise</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getMaintenanceBadge = (status) => {
    return status === 'yes' ? (
      <span className="maintenance-badge done"><FaCheck className="badge-icon" /> Effectué</span>
    ) : (
      <span className="maintenance-badge not-done"><FaTimes className="badge-icon" /> Non Effectué</span>
    );
  };

  const getMaintenanceAlertBadge = (alert) => {
    return alert.severity === 'high' ? (
      <span className="alert-badge high"><FaExclamationCircle className="badge-icon" /> Urgent</span>
    ) : (
      <span className="alert-badge medium"><FaExclamationTriangle className="badge-icon" /> Attention</span>
    );
  };

  const refreshData = () => {
    dispatch(fetchMatricules());
    dispatch(fetchCars());
    dispatch(fetchReservations());
    dispatch(fetchAccidents());
    showSuccessMessage('Données actualisées avec succès !');
  };

  const renderPaginationButtons = (currentPage, totalPages, onPageChange, type = 'main') => {
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

  const uniqueCars = [...new Set(matricules.map(m => m.car_id).filter(Boolean))];
  const carOptions = cars.filter(car => uniqueCars.includes(car.id));

  const getMatriculeStatusExplanation = (accidentType) => {
    if (accidentType === 'grave') {
      return "Le matricule sera inactif jusqu'à ce que le statut atteigne 'waiting' ou 'completed'";
    } else {
      return "Le matricule sera inactif seulement pendant le statut 'fixed'";
    }
  };

  const getMaintenanceItems = (matricule) => {
    return [
      { label: 'Paquets Voiture', value: matricule.paquets_de_voiture, icon: FaCar },
      { label: 'Paquets Frein', value: matricule.paquets_de_frein, icon: FaTools },
      { label: 'Filtre Huile', value: matricule.filter_oil, icon: FaOilCan },
      { label: 'Filtre Air', value: matricule.filter_air, icon: FaWind },
      { label: 'Ad Blue', value: matricule.ad_blue, icon: FaVial },
      { label: 'Huile', value: matricule.oil, icon: FaOilCan }
    ];
  };

  const getMatriculeMaintenanceAlerts = (matriculeId) => maintenanceAlerts[matriculeId] || [];
  const hasMaintenanceAlerts = (matriculeId) => maintenanceAlerts[matriculeId] && maintenanceAlerts[matriculeId].length > 0;

  const getAdditionalMaintenanceItems = (matricule) => {
    if (!matricule.additional_maintenance || !Array.isArray(matricule.additional_maintenance)) return [];
    return matricule.additional_maintenance.map(item => ({
      ...item, type: 'additional_maintenance',
      isOverdue: item.actual_km > item.recommended_km,
      kmOverdue: item.actual_km - item.recommended_km,
      kmRemaining: item.recommended_km - item.actual_km,
      needsAttention: item.needs_attention || item.requires_attention
    }));
  };

  const getPeriodicMaintenanceItems = (matricule) => {
    if (!matricule.periodic_km_maintenance || !Array.isArray(matricule.periodic_km_maintenance)) return [];
    const currentKm = matricule.kilometrage || 0;
    return matricule.periodic_km_maintenance.map(item => ({
      ...item, type: 'periodic_km',
      isOverdue: currentKm >= item.next_change_km,
      kmOverdue: currentKm - item.next_change_km,
      kmRemaining: item.next_change_km - currentKm
    }));
  };

  if (loading) {
    return (
      <div className="matricules-management loading-spinner">
        <div className="spinner"></div>
        <p>Chargement des matricules...</p>
      </div>
    );
  }

  return (
    <div className="matricules-management">
      <div className="section-header">
        <div className="header-content">
          <h1 className="section-title">
            <FaIdCard className="title-icon" />
            Gestion des Matricules
            {statusFilter !== 'all' && (
              <span className="filter-indicator">
                - Filtre : {statusFilter === 'reserved' ? 'Réservé' :
                  statusFilter === 'late' ? 'En Retard' :
                    statusFilter === 'active' ? 'Actif' :
                      statusFilter === 'inactive' ? 'Inactif' : statusFilter}
              </span>
            )}
          </h1>
          <p className="section-subtitle">Gérez les plaques d'immatriculation des véhicules et leur statut de maintenance</p>
        </div>
        <div className="section-actions">
          <button className="btn btn-secondary" onClick={refreshData} disabled={submitting}>
            <FaRedo className="btn-icon" /> Actualiser
          </button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
            {submitting ? <FaSpinner className="btn-icon spinning" /> : <FaPlus className="btn-icon" />}
            {submitting ? 'Traitement...' : 'Nouveau Matricule'}
          </button>
          <button className="btn btn-secondary" onClick={handleExport} disabled={submitting}>
            <FaFileExport className="btn-icon" /> Exporter CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-content">
            <div className="stat-number">{stats.totalMatricules}</div>
            <div className="stat-label">Total Matricules</div>
          </div>
          <FaIdCard className="stat-icon" />
        </div>
        <div className="stat-card stat-active">
          <div className="stat-content">
            <div className="stat-number">{stats.activeMatricules}</div>
            <div className="stat-label">Matricules Actifs</div>
          </div>
          <FaCheck className="stat-icon" />
        </div>
        <div className="stat-card stat-inactive">
          <div className="stat-content">
            <div className="stat-number">{stats.inactiveMatricules}</div>
            <div className="stat-label">Matricules Inactifs</div>
          </div>
          <FaBan className="stat-icon" />
        </div>
        <div className="stat-card stat-vidange">
          <div className="stat-content">
            <div className="stat-number">{stats.vidangeDone}</div>
            <div className="stat-label">Vidanges Effectuées</div>
          </div>
          <FaOilCan className="stat-icon" />
        </div>
      </div>

      {/* Search + Filters */}
      <div className="search-filter-section">
        <div className="search-container">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par code matricule, marque, modèle, ou ID..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>

          <div className="filters-row">
            <div className="filter-group">
              <div className="filter-item">
                <label htmlFor="status-filter"><FaFilter className="filter-icon" />Statut</label>
                <select id="status-filter" value={statusFilter} onChange={handleStatusFilter} className="filter-select">
                  <option value="all">Tous les Statuts</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="reserved">Réservé</option>
                  <option value="late">En Retard</option>
                </select>
              </div>

              <div className="filter-item">
                <label htmlFor="vidange-filter"><FaOilCan className="filter-icon" />Vidange</label>
                <select id="vidange-filter" value={vidangeFilter} onChange={handleVidangeFilter} className="filter-select">
                  <option value="all">Tous les Statuts</option>
                  <option value="done">Effectuée</option>
                  <option value="not done">Non Effectuée</option>
                </select>
              </div>

              <div className="filter-item">
                <label htmlFor="car-filter"><FaCar className="filter-icon" />Voiture</label>
                <select id="car-filter" value={carFilter} onChange={handleCarFilter} className="filter-select">
                  <option value="all">Toutes les Voitures</option>
                  {carOptions.map(car => (
                    <option key={car.id} value={car.id}>{car.brand} {car.model}</option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <label htmlFor="fuel-filter"><FaGasPump className="filter-icon" />Carburant</label>
                <select id="fuel-filter" value={fuelTypeFilter} onChange={handleFuelTypeFilter} className="filter-select">
                  <option value="all">Tous les carburants</option>
                  <option value="petrol">Essence</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Électrique</option>
                </select>
              </div>

              <div className="filter-item">
                <label htmlFor="transmission-filter"><FaCog className="filter-icon" />Transmission</label>
                <select id="transmission-filter" value={transmissionFilter} onChange={handleTransmissionFilter} className="filter-select">
                  <option value="all">Toutes les transmissions</option>
                  <option value="manual">Manuelle</option>
                  <option value="automatic">Automatique</option>
                </select>
              </div>
            </div>

            <div className="filter-actions">
              {(searchTerm !== '' || statusFilter !== 'all' || vidangeFilter !== 'all' ||
                carFilter !== 'all' || fuelTypeFilter !== 'all' || transmissionFilter !== 'all') && (
                <button className="btn btn-clear" onClick={clearFilters}>Effacer les Filtres</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results summary */}
      {filterParam === 'notifications' && (
  <div className="filter-indicator">
    <span className="filter-indicator-text">
      <FaBell size={16} /> Affichage des matricules avec visite technique ou assurance à renouveler (≤ 7 jours)
    </span>
    <button
      onClick={() => setSearchParams({})}
      className="clear-filter-btn"
    >
      <FaTimes size={16} /> Effacer le filtre
    </button>
  </div>
)}
      <div className="results-summary">
        <div className="summary-left">
          <span className="results-count">
            Affichage de {currentMatricules.length} sur {sortedMatricules.length} matricules
            {sortedMatricules.length !== matricules.length && ` (filtrés sur ${matricules.length} au total)`}
          </span>
          {sortConfig.key && sortConfig.direction !== 'none' && (
            <span className="sort-indicator">
              <FaSort className="sort-indicator-icon" />
              Trié par: {sortConfig.key === 'car' ? 'Voiture' :
                sortConfig.key === 'matricule_code' ? 'Matricule' :
                  sortConfig.key === 'kilometrage' ? 'Kilométrage' :
                    sortConfig.key === 'visit_tech' ? 'Visite Technique' :
                      sortConfig.key === 'vidange_status' ? 'Vidange' :
                        sortConfig.key === 'status' ? 'Statut' : 'ID'}
              ({sortConfig.direction === 'asc' ? 'Croissant' : 'Décroissant'})
              <button className="btn-clear-sort" onClick={() => setSortConfig({ key: null, direction: 'asc' })}>
                <FaTimes />
              </button>
            </span>
          )}
        </div>
        <span className="page-info">Page {currentPage} sur {totalPages}</span>
      </div>

      <div className="content-container">
        {currentMatricules.length > 0 ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('matricule_code')} className="sortable-header">
                      <div className="header-content">Matricule {getSortIcon('matricule_code')}</div>
                    </th>
                    <th onClick={() => handleSort('car')} className="sortable-header">
                      <div className="header-content">Voiture {getSortIcon('car')}</div>
                    </th>
                    <th onClick={() => handleSort('kilometrage')} className="sortable-header">
                      <div className="header-content">Kilométrage {getSortIcon('kilometrage')}</div>
                    </th>
                    <th onClick={() => handleSort('visit_tech')} className="sortable-header">
                      <div className="header-content">Visite Technique {getSortIcon('visit_tech')}</div>
                    </th>
                    <th onClick={() => handleSort('vidange_status')} className="sortable-header">
                      <div className="header-content">Vidange {getSortIcon('vidange_status')}</div>
                    </th>
                    <th onClick={() => handleSort('status')} className="sortable-header">
                      <div className="header-content">Statut {getSortIcon('status')}</div>
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMatricules.map(matricule => {
                    const hasAlerts = hasMaintenanceAlerts(matricule.id);
                    const alertsCount = getMatriculeMaintenanceAlerts(matricule.id).length;

                    return (
                      <tr key={matricule.id}>
                        <td className="matricule-code"><strong>{matricule.matricule_code}</strong></td>
                        <td>
                          {matricule.car ? (
                            <div className="car-info">
                              <div className="car-name">{matricule.car.brand} {matricule.car.model}</div>
                              <div className="car-details">{matricule.car.year} • {matricule.car.color}</div>
                            </div>
                          ) : (
                            <span className="no-car">Aucune voiture assignée</span>
                          )}
                        </td>
                        <td className="kilometrage-cell">
                          <FaTachometerAlt className="kilometrage-icon" />
                          {matricule.kilometrage?.toLocaleString()} km
                          {matricule.kilometrage_entree && (
                            <div className="last-return">Dernier retour : {matricule.kilometrage_entree} km</div>
                          )}
                        </td>
                        <td>{matricule.visit_tech ? new Date(matricule.visit_tech).toLocaleDateString('fr-FR') : 'Non définie'}</td>
                        <td>{getStatusBadge(matricule.vidange_status)}</td>
                        <td>{getStatusBadge(matricule.status, matricule)}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="action-btn view" onClick={() => handleViewDetails(matricule)} title="Voir les Détails">
                              <FaEye />
                              {hasAlerts && (
                                <span className="action-alert-indicator">
                                  {alertsCount > 0 && (
                                    <>
                                      <span className="alert-dot"></span>
                                      {alertsCount > 1 && <span className="alert-count">{alertsCount}</span>}
                                    </>
                                  )}
                                </span>
                              )}
                            </button>
                            <button className="action-btn accident" onClick={() => handleAddToAccident(matricule)} title="Ajouter à un Accident">
                              <FaCarCrash />
                            </button>
                            <button className="action-btn edit" onClick={() => handleEdit(matricule)} title="Modifier" disabled={submitting}>
                              <FaEdit />
                            </button>
                            <button className="action-btn delete" onClick={() => showDeleteConfirmation(matricule)} title="Supprimer" disabled={submitting}>
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

            <div className="pagination-container">
  <PaginationControls
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={handlePageChange}
    itemsPerPage={itemsPerPage}
    onItemsPerPageChange={setItemsPerPage}
    totalItems={sortedMatricules.length}
  />
</div>
          </>
        ) : (
          <div className="no-data">
            <FaDatabase size={48} />
            <p>{matricules.length === 0 ? 'Aucun matricule trouvé' : 'Aucun matricule ne correspond à vos critères de recherche'}</p>
            <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
              <FaPlus className="btn-icon" /> Nouveau Matricule
            </button>
            {(searchTerm !== '' || statusFilter !== 'all' || vidangeFilter !== 'all' || carFilter !== 'all') && (
              <button className="btn btn-secondary" onClick={clearFilters} style={{ marginTop: '1rem' }}>Effacer les Filtres</button>
            )}
          </div>
        )}
      </div>

      {/* Details Modal — same shell as AdminModal */}
      {showDetails && selectedMatricule && createPortal(
        <div className="details-modal-overlay">
          <div className="details-modal">
            <div className="details-header">
              <div className="matricule-header-info">
                <div className="matricule-avatar-large">{selectedMatricule.matricule_code.substring(0, 2)}</div>
                <div className="matricule-info">
                  <h2>{selectedMatricule.matricule_code}</h2>
                  <div className="matricule-contact">
                    <div><FaCar /> {selectedMatricule.car ? `${selectedMatricule.car.brand} ${selectedMatricule.car.model}` : 'Aucune voiture assignée'}</div>
                    <div><FaTachometerAlt /> {selectedMatricule.kilometrage?.toLocaleString()} km</div>
                    <div><FaCalendarAlt /> Visite Technique : {selectedMatricule.visit_tech ? new Date(selectedMatricule.visit_tech).toLocaleDateString('fr-FR') : 'Non définie'}</div>
                  </div>
                </div>
              </div>
              <button className="close-details-btn" onClick={handleCloseDetails}><FaTimes /></button>
            </div>

            <div className="details-content">
              <div className="details-section">
                <div className="section-title"><FaIdCard /><span>Informations du Matricule</span></div>
                <div className="info-grid">
                  <div className="info-item"><label>Statut</label><div>{getStatusBadge(selectedMatricule.status, selectedMatricule)}</div></div>
                  <div className="info-item"><label>Statut Vidange</label><div>{getStatusBadge(selectedMatricule.vidange_status)}</div></div>
                  <div className="info-item"><label>Kilométrage Actuel</label><div>{selectedMatricule.kilometrage?.toLocaleString()} km</div></div>
                  <div className="info-item"><label>Dernier Kilométrage Entrée</label><div>{selectedMatricule.kilometrage_entree?.toLocaleString() || 'N/A'} km</div></div>
                  <div className="info-item"><label>Dernier Kilométrage Sortie</label><div>{selectedMatricule.kilometrage_sortie?.toLocaleString() || 'N/A'} km</div></div>
                  <div className="info-item"><label>Visite Technique</label><div>{selectedMatricule.visit_tech ? new Date(selectedMatricule.visit_tech).toLocaleDateString('fr-FR') : 'Non définie'}</div></div>
                </div>

                {hasMaintenanceAlerts(selectedMatricule.id) && (
                  <div className="maintenance-alerts-section">
                    <h4 className="alerts-title"><FaExclamationTriangle className="alerts-icon" />Alertes de Maintenance</h4>
                    <div className="alerts-list">
                      {getMatriculeMaintenanceAlerts(selectedMatricule.id).map((alert, index) => (
                        <div key={index} className={`alert-item ${alert.severity}`}>
                          <div className="alert-header">
                            {getMaintenanceAlertBadge(alert)}
                            <span className="alert-message">{alert.message}</span>
                          </div>
                          <div className="alert-details">
                            {alert.type === 'additional_maintenance' && (
                              <>
                                <span>Actuel: {alert.actualKm?.toLocaleString()} km</span>
                                <span>Recommandé: {alert.recommendedKm?.toLocaleString()} km</span>
                              </>
                            )}
                            {alert.type === 'periodic_km' && (
                              <>
                                <span>Actuel: {alert.currentKm?.toLocaleString()} km</span>
                                <span>Prochain: {alert.nextChangeKm?.toLocaleString()} km</span>
                              </>
                            )}
                            {alert.type === 'vidange' && (
                              <span>Kilométrage actuel: {alert.currentKm?.toLocaleString()} km</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="maintenance-section">
                  <h4 className="maintenance-title"><FaTools className="maintenance-icon" />Statut de Maintenance</h4>
                  <div className="maintenance-grid">
                    {getMaintenanceItems(selectedMatricule).map((item, index) => (
                      <div key={index} className="maintenance-item">
                        <div className="maintenance-label">
                          <item.icon className="maintenance-item-icon" />
                          {item.label}
                        </div>
                        {getMaintenanceBadge(item.value)}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedMatricule.status === 'inactive' && inactiveReasons[selectedMatricule.id] && (
                  <div className="inactive-reason-display">
                    <FaInfoCircle className="reason-icon" />
                    <div className="reason-content">
                      <strong>Raison d'inactivité :</strong> {inactiveReasons[selectedMatricule.id].message}
                    </div>
                  </div>
                )}
              </div>

              <div className="details-section">
                <div className="section-title"><FaCalendarAlt /><span>Réservations ({matriculeReservations.length})</span></div>
                {matriculeReservations.length > 0 ? (
                  <>
                    <div className="items-grid">
                      {currentReservations.map(reservation => (
                        <div key={reservation.id} className="item-card">
                          <div className="item-header">
                            <div className="item-title"><FaUser className="item-icon" />{reservation.client?.prenom} {reservation.client?.nom}</div>
                            {getStatusBadge(reservation.status)}
                          </div>
                          <div className="item-details">
                            <div className="item-detail"><FaCalendarAlt className="detail-icon" />{new Date(reservation.start_date).toLocaleDateString('fr-FR')} - {new Date(reservation.end_date).toLocaleDateString('fr-FR')}</div>
                            <div className="item-detail"><FaClock className="detail-icon" />{calculateRentalDays(reservation.start_date, reservation.end_date)} jours</div>
                            <div className="item-detail"><FaMoneyBill className="detail-icon" />{reservation.total_price} MAD</div>
                          </div>
                          <div className="item-id">Réservation #{reservation.id}</div>
                        </div>
                      ))}
                    </div>
                    {totalReservationsPages > 1 && (
  <div className="details-pagination">
    <PaginationControls
      currentPage={reservationsPage}
      totalPages={totalReservationsPages}
      onPageChange={handleReservationsPageChange}
      itemsPerPage={detailsItemsPerPage}
      onItemsPerPageChange={() => {}}
      totalItems={matriculeReservations.length}
      pageSizeOptions={[detailsItemsPerPage]}
    />
  </div>
)}
                  </>
                ) : (
                  <div className="no-items"><FaCalendarAlt size={32} /><p>Aucune réservation trouvée pour ce matricule</p></div>
                )}
              </div>

              <div className="details-section">
                <div className="section-title"><FaCarCrash /><span>Accidents ({matriculeAccidents.length})</span></div>
                {matriculeAccidents.length > 0 ? (
                  <>
                    <div className="items-grid">
                      {currentAccidents.map(accident => (
                        <div key={accident.id} className="item-card accident-card">
                          <div className="item-header">
                            <div className="item-title"><FaCarCrash className="item-icon accident" />Rapport d'Accident</div>
                            <div className="accident-date">{new Date(accident.date_accident).toLocaleDateString('fr-FR')}</div>
                          </div>
                          <div className="item-details">
                            <div className="item-detail"><FaUser className="detail-icon" />{accident.client?.prenom} {accident.client?.nom}</div>
                            <div className="item-detail"><FaMoneyBill className="detail-icon" />Pertes : {accident.amount_of_losses} MAD</div>
                            <div className="item-detail"><FaShieldAlt className="detail-icon" />Assurance : {accident.amount_assurance} MAD</div>
                            <div className="item-detail"><FaInfoCircle className="detail-icon" />Statut : {accident.status}</div>
                          </div>
                          <div className="item-id">Accident #{accident.id}</div>
                        </div>
                      ))}
                    </div>
                    {totalAccidentsPages > 1 && (
  <div className="details-pagination">
    <PaginationControls
      currentPage={accidentsPage}
      totalPages={totalAccidentsPages}
      onPageChange={handleAccidentsPageChange}
      itemsPerPage={detailsItemsPerPage}
      onItemsPerPageChange={() => {}}
      totalItems={matriculeAccidents.length}
      pageSizeOptions={[detailsItemsPerPage]}
    />
  </div>
)}
                  </>
                ) : (
                  <div className="no-items"><FaCarCrash size={32} /><p>Aucun accident trouvé pour ce matricule</p></div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ============================================================
          Accident Modal — SAME shell as AdminModal
          (gradient header + icon circle + subtitle + absolute close,
           padded form body, bordered footer with pill buttons)
          ============================================================ */}
      {showAccidentModal && createPortal(
        <div className="acc-overlay" role="dialog" aria-modal="true">
          <div className="acc-modal">
            <header className="acc-header">
              <div className="acc-header-icon">
                <FaCarCrash size={28} />
              </div>
              <div className="acc-header-title">
                <h2>Ajouter au Rapport d'Accident</h2>
                <p>Renseignez les informations de l'accident ci-dessous</p>
              </div>
              <button
                type="button"
                className="acc-header-close"
                onClick={() => setShowAccidentModal(false)}
                disabled={submittingAccident}
                aria-label="Fermer"
              >
                <FaTimes size={20} />
              </button>
            </header>

            <form onSubmit={handleCreateAccident} className="acc-form">
              <div className="acc-body">
                <div className="acc-grid-2">
                  <div className="acc-field">
                    <label className="acc-label">Matricule</label>
                    <input
                      type="text"
                      value={selectedMatriculeForAccident?.matricule_code || ''}
                      disabled
                      className="acc-input"
                    />
                  </div>

                  <div className="acc-field">
                    <label className="acc-label">Voiture</label>
                    <input
                      type="text"
                      value={selectedMatriculeForAccident?.car
                        ? `${selectedMatriculeForAccident.car.brand} ${selectedMatriculeForAccident.car.model}`
                        : 'Aucune voiture assignée'}
                      disabled
                      className="acc-input"
                    />
                  </div>
                </div>

                <div className="acc-grid-2">
                  <div className="acc-field">
                    <label className="acc-label acc-required">Type d'Accident</label>
                    <select
                      value={accidentFormData.accident_type || 'grave'}
                      onChange={(e) => setAccidentFormData(prev => ({ ...prev, accident_type: e.target.value }))}
                      className="acc-input"
                      required
                    >
                      <option value="grave">Accident Grave</option>
                      <option value="non_grave">Accident Non-Grave</option>
                    </select>
                    <span className="acc-hint">{getMatriculeStatusExplanation(accidentFormData.accident_type)}</span>
                  </div>

                  <div className="acc-field">
                    <label className="acc-label acc-required">Type de Procédure</label>
                    <select
                      value={accidentFormData.procedure_type || 'classic'}
                      onChange={(e) => setAccidentFormData(prev => ({ ...prev, procedure_type: e.target.value }))}
                      className="acc-input"
                      required
                    >
                      <option value="classic">Procédure Classique</option>
                      <option value="forphie">Procédure Forphie</option>
                    </select>
                  </div>
                </div>

                <div className="acc-grid-2">
                  <div className="acc-field">
                    <label className="acc-label acc-required">Statut de l'Accident</label>
                    <select
                      value={accidentFormData.status || 'pending'}
                      onChange={(e) => setAccidentFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="acc-input"
                      required
                    >
                      <option value="pending">En Attente</option>
                      <option value="evaluation_owner">Évaluation Propriétaire</option>
                      <option value="contact expert">Contact Expert</option>
                      <option value="evaluation_expert">Évaluation Expert</option>
                      <option value="fixed">Réparé</option>
                      <option value="waiting">En Attente</option>
                      <option value="completed">Terminé</option>
                    </select>
                  </div>

                  <div className="acc-field">
                    <label className="acc-label acc-required">Date de l'Accident</label>
                    <input
                      type="date"
                      value={accidentFormData.date_accident}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        setAccidentFormData(prev => ({ ...prev, date_accident: selectedDate }));
                        if (selectedMatriculeForAccident) {
                          const clients = getAvailableClientsForAccident(selectedMatriculeForAccident.id, selectedDate);
                          setAvailableClients(clients);
                          setAccidentFormData(prev => ({
                            ...prev,
                            client_id: clients.length === 1 ? clients[0].id : ''
                          }));
                        }
                      }}
                      className="acc-input"
                      required
                    />
                  </div>
                </div>

                <div className="acc-field">
                  <label className="acc-label acc-required">Sélectionner le Client</label>
                  <select
                    value={accidentFormData.client_id || ''}
                    onChange={(e) => setAccidentFormData(prev => ({ ...prev, client_id: e.target.value }))}
                    className="acc-input"
                    required
                  >
                    <option value="">Sélectionner un client</option>
                    {availableClients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} (Réservation #{client.reservation_id}) - Statut: {getReservationStatusText(client.status)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="acc-grid-2">
                  <div className="acc-field">
                    <label className="acc-label acc-required">Montant des Pertes (€)</label>
                    <input
                      type="number"
                      value={accidentFormData.amount_of_losses || 0}
                      onChange={(e) => setAccidentFormData(prev => ({ ...prev, amount_of_losses: parseFloat(e.target.value) || 0 }))}
                      className="acc-input"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="acc-field">
                    <label className="acc-label acc-required">Montant Assurance (€)</label>
                    <input
                      type="number"
                      value={accidentFormData.amount_assurance || 0}
                      onChange={(e) => setAccidentFormData(prev => ({ ...prev, amount_assurance: parseFloat(e.target.value) || 0 }))}
                      className="acc-input"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="acc-footer">
                <button
                  type="button"
                  className="acc-btn-secondary"
                  onClick={() => setShowAccidentModal(false)}
                  disabled={submittingAccident}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="acc-btn-primary"
                  disabled={!accidentFormData.client_id || submittingAccident}
                >
                  {submittingAccident ? 'Traitement…' : "Créer Rapport d'Accident"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {showModal && (
        <AdminModal
          type="matricules"
          modalType={modalType}
          formData={formData}
          setFormData={setFormData}
          onClose={() => !submitting && setShowModal(false)}
          onSubmit={handleSubmit}
          cars={cars}
          submitting={submitting}
        />
      )}

      {/* Confirmation Modal — full-screen overlay (no sidebar offset) */}
      {showConfirmation && createPortal(
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <div className="confirmation-header">
              <div className={`confirmation-icon ${confirmationConfig.type}`}><FaExclamationTriangle /></div>
              <h3 className="confirmation-title">{confirmationConfig.title}</h3>
            </div>

            <div className="confirmation-body">
              <p className="confirmation-message">{confirmationConfig.message}</p>
              {confirmationConfig.matricule && (
                <div className="matricule-preview" style={{ display: 'flex', alignItems: 'center' }}>
                  <div className="matricule-avatar-preview">{confirmationConfig.matricule.matricule_code.substring(0, 2)}</div>
                  <div className="matricule-info-preview">
                    <h4>{confirmationConfig.matricule.matricule_code}</h4>
                    <div className="matricule-meta-preview">
                      <div>{confirmationConfig.matricule.car?.brand} {confirmationConfig.matricule.car?.model}</div>
                      <div>{getStatusBadge(confirmationConfig.matricule.status, confirmationConfig.matricule)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="confirmation-actions">
              <button className="btn-confirm-cancel" onClick={() => setShowConfirmation(false)} disabled={submitting}>Annuler</button>
              <button className={`btn-confirm-${confirmationConfig.type}`} onClick={confirmationConfig.onConfirm} disabled={submitting}>
                {submitting ? <FaSpinner className="spinning" /> : 'Supprimer le Matricule'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        /* ================= Layout ================= */
        .matricules-management {
          padding: 2rem; min-height: 100vh;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          background: #f8fafc; color: #334155;
          overflow-x: hidden; width: 100%;
        }
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

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

        /* ================= Header ================= */
        .section-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 1rem; margin-bottom: 2rem; background: #fff; padding: 2rem;
          border-radius: 1.25rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0; flex-wrap: wrap;
          max-width: 100%; box-sizing: border-box;
        }
        .header-content { flex: 1; }
        .section-title {
          display: flex; align-items: center; gap: 10px;
          font-size: 2rem; font-weight: 700; margin: 0 0 0.5rem 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; flex-wrap: wrap;
        }
        .filter-indicator {
          font-size: 1.2rem; color: #64748b; font-weight: 500;
          background: rgba(108, 117, 125, 0.1); padding: 4px 12px;
          border-radius: 20px; border: 1px solid rgba(108, 117, 125, 0.2);
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
        .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2); color: white;
          box-shadow: 0 4px 15px rgba(102,126,234,0.3);
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(102,126,234,0.4); }
        .btn-secondary { background: #f1f5f9; color: #1e293b; }
        .btn-secondary:hover:not(:disabled) { background: #e2e8f0; transform: translateY(-1px); }
        .btn-clear { background: #ef4444; color: #fff; padding: 0 1.25rem; font-size: 0.8rem; }
        .btn-clear:hover:not(:disabled) { background: #dc2626; transform: translateY(-1px); }
        .btn-icon { font-size: 0.875rem; }

        /* ================= Stats ================= */
        .stats-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem; margin-bottom: 1.5rem;
          max-width: 100%; box-sizing: border-box;
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
        .stat-total::before { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .stat-active::before { background: linear-gradient(135deg, #10b981, #059669); }
        .stat-inactive::before { background: linear-gradient(135deg, #ef4444, #dc2626); }
        .stat-vidange::before { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        .stat-number { font-size: 1.875rem; font-weight: 700; color: #0f172a; line-height: 1; }
        .stat-label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0.35rem; }
        .stat-icon { opacity: 0.5; font-size: 2rem; }

        /* ================= Search + filters ================= */
        .search-filter-section {
          background: white; padding: 1.5rem; border-radius: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 1.5rem;
          width: 100%; overflow: hidden; max-width: 100%; box-sizing: border-box;
          border: 1px solid #e2e8f0;
        }
        .search-container { display: flex; flex-direction: column; gap: 1.5rem; width: 100%; }
        .search-box { position: relative; width: 100%; flex-shrink: 0; }
        .search-icon {
          position: absolute; left: 1rem; top: 50%;
          transform: translateY(-50%); color: #64748b; font-size: 1rem;
        }
        .search-input {
          width: 100%; padding: 0.5rem 1rem 0.5rem 2.5rem;
          border: 1px solid #e2e8f0; border-radius: 0.5rem;
          font-size: 0.875rem; transition: all 0.2s;
          font-family: inherit; box-sizing: border-box; background: #fff;
        }
        .search-input:focus {
          outline: none; border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
        }
        .filters-row {
          display: flex; flex-direction: column; gap: 1rem; width: 100%;
        }
        .filter-group {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem; width: 100%;
        }
        .filter-item { display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; }
        .filter-item label {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.7rem; font-weight: 600; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.5px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .filter-icon { font-size: 0.875rem; flex-shrink: 0; }
        .filter-select {
          width: 100%; padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0; border-radius: 0.5rem;
          font-size: 0.875rem; background: white;
          cursor: pointer; transition: all 0.2s;
          font-family: inherit; min-width: 0; box-sizing: border-box;
        }
        .filter-select:focus {
          outline: none; border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
        }
        .filter-actions {
          display: flex; justify-content: flex-end;
          width: 100%; margin-top: 0.5rem;
        }

        /* ================= Results summary ================= */
        .results-summary {
          display: flex; justify-content: space-between; align-items: flex-start;
          flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;
          padding: 0 0.25rem; font-size: 0.875rem; color: #64748b;
          width: 100%; max-width: 100%; box-sizing: border-box;
        }
        .summary-left { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; min-width: 0; }
        .results-count {
          font-weight: 500; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .sort-indicator {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: rgba(102, 126, 234, 0.1);
          border: 1px solid rgba(102, 126, 234, 0.2);
          border-radius: 9999px; font-size: 0.75rem;
          color: #667eea; font-weight: 500;
          width: fit-content; max-width: 100%; flex-wrap: wrap;
        }
        .sort-indicator-icon { font-size: 0.7rem; flex-shrink: 0; }
        .btn-clear-sort {
          background: none; border: none; color: #667eea;
          cursor: pointer; padding: 0.125rem; border-radius: 4px;
          font-size: 0.7rem; margin-left: 0.25rem;
          display: flex; align-items: center; justify-content: center;
          transition: background-color 0.2s ease; flex-shrink: 0;
        }
        .btn-clear-sort:hover { background: rgba(102, 126, 234, 0.2); }
        .page-info { font-weight: 600; color: #334155; white-space: nowrap; flex-shrink: 0; }

        /* ================= Content container ================= */
        .content-container {
          background: white; border: 1px solid #e2e8f0; border-radius: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          width: 100%; overflow: hidden; max-width: 100%; box-sizing: border-box;
        }

        /* ================= Table ================= */
        .data-table { width: 100%; font-size: 0.875rem; border-collapse: collapse; }
        .data-table th {
          text-align: left; padding: 0.75rem 1rem;
          background: #f8fafc; color: #64748b; font-weight: 500;
          white-space: nowrap; border-bottom: 1px solid #e2e8f0;
          font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .data-table td {
          padding: 0.75rem 1rem; border-top: 1px solid #e2e8f0;
          color: #334155; vertical-align: middle;
        }
        .data-table tr:hover { background: #f8fafc; }

        .sortable-header { cursor: pointer; user-select: none; transition: background-color 0.3s ease; position: relative; }
        .sortable-header:hover { background-color: #f8fafc; }
        .header-content { display: flex; align-items: center; gap: 0.5rem; justify-content: space-between; }
        .sort-icon { font-size: 0.75rem; color: #94a3b8; opacity: 0.5; transition: all 0.3s ease; }
        .sort-icon.active { color: #667eea; opacity: 1; }
        .sortable-header:hover .sort-icon:not(.active) { opacity: 0.8; }

        /* ================= Table cells ================= */
        .matricule-code { font-weight: 700; color: #667eea; font-size: 1rem; white-space: nowrap; font-family: 'Courier New', monospace; }
        .car-info { color: #334155; }
        .car-name { font-weight: 600; color: #0f172a; white-space: nowrap; }
        .car-details { font-size: 0.75rem; color: #64748b; margin-top: 2px; }
        .no-car { color: #94a3b8; font-style: italic; font-size: 0.8rem; }
        .kilometrage-cell { display: flex; align-items: center; gap: 0.5rem; font-weight: 500; color: #334155; white-space: nowrap; }
        .kilometrage-icon { color: #667eea; font-size: 0.875rem; }
        .last-return { font-size: 0.7rem; color: #94a3b8; margin-top: 2px; }

        /* ================= Action buttons ================= */
        .action-buttons { display: flex; gap: 0.5rem; position: relative; flex-wrap: nowrap; }
        .action-btn {
          display: flex; align-items: center; justify-content: center;
          padding: 0.5rem; background: none; border: none; cursor: pointer;
          border-radius: 0.5rem; transition: all 0.2s;
          width: 32px; height: 32px; font-size: 0.875rem;
          position: relative; flex-shrink: 0;
        }
        .action-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .action-btn.view     { color: #3b82f6; }  .action-btn.view:hover:not(:disabled)     { background: #eff6ff; }
        .action-btn.accident { color: #f97316; }  .action-btn.accident:hover:not(:disabled) { background: #fff7ed; }
        .action-btn.edit     { color: #10b981; }  .action-btn.edit:hover:not(:disabled)     { background: #ecfdf5; }
        .action-btn.delete   { color: #ef4444; }  .action-btn.delete:hover:not(:disabled)   { background: #fef2f2; }

        .action-alert-indicator {
          position: absolute; top: -5px; right: -5px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .alert-dot {
          width: 8px; height: 8px; background: #dc3545; border-radius: 50%;
          border: 2px solid white; box-shadow: 0 0 0 1px #dc3545;
          animation: pulse 2s infinite; flex-shrink: 0;
        }
        .alert-count {
          position: absolute; top: -8px; right: -8px;
          background: #dc3545; color: white; border-radius: 50%;
          width: 16px; height: 16px; font-size: 0.6rem;
          display: flex; align-items: center; justify-content: center;
          font-weight: bold; border: 2px solid white;
          box-shadow: 0 0 0 1px #dc3545; flex-shrink: 0;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* ================= Badges ================= */
        .status-badge {
          display: inline-flex; align-items: center; gap: 0.25rem;
          padding: 0.25rem 0.625rem; border-radius: 9999px;
          font-size: 0.7rem; font-weight: 500; white-space: nowrap;
        }
        .status-active, .status-completed, .status-confirmed { background: #dcfce7; color: #166534; }
        .status-inactive, .status-cancelled { background: #fee2e2; color: #991b1b; }
        .status-pending, .status-not-done { background: #fef3c7; color: #92400e; }
        .status-reserved { background: #fef3c7; color: #92400e; }
        .status-late { background: #ffedd5; color: #9a3412; }
        .status-icon { font-size: 0.7rem; }

        .maintenance-badge {
          display: inline-flex; align-items: center; gap: 0.375rem;
          padding: 0.25rem 0.625rem; border-radius: 9999px;
          font-size: 0.7rem; font-weight: 500; white-space: nowrap;
        }
        .maintenance-badge.done { background: #dcfce7; color: #166534; }
        .maintenance-badge.not-done { background: #fee2e2; color: #991b1b; }

        .alert-badge {
          display: inline-flex; align-items: center; gap: 0.375rem;
          padding: 0.25rem 0.625rem; border-radius: 9999px;
          font-size: 0.7rem; font-weight: 500; white-space: nowrap;
        }
        .alert-badge.high { background: #fee2e2; color: #991b1b; }
        .alert-badge.medium { background: #fef3c7; color: #92400e; }
        .badge-icon { font-size: 0.75rem; }

        /* ================= Status badge container / tooltip ================= */
        .status-badge-container { display: flex; align-items: center; gap: 4px; position: relative; }
        .inactive-reason-wrapper { position: relative; display: inline-flex; }
        .reason-icon-hover {
          color: #94a3b8; font-size: 12px; cursor: pointer;
          opacity: 0.7; transition: opacity 0.2s ease;
        }
        .reason-icon-hover:hover { opacity: 1; color: #dc3545; }
        .inactive-reason-tooltip {
          position: absolute; top: 100%; left: 50%;
          transform: translateX(-50%); background: white;
          border: 1px solid #e2e8f0; border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          min-width: 250px; max-width: 300px; z-index: 1000;
          opacity: 0; visibility: hidden; transition: all 0.3s ease;
          margin-top: 8px;
        }
        .inactive-reason-wrapper:hover .inactive-reason-tooltip {
          opacity: 1; visibility: visible; margin-top: 4px;
        }
        .inactive-reason-tooltip::before {
          content: ''; position: absolute; top: -6px; left: 50%;
          transform: translateX(-50%) rotate(45deg);
          width: 12px; height: 12px; background: white;
          border-left: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0;
        }
        .tooltip-content { font-size: 0.8rem; line-height: 1.4; color: #334155; }
        .tooltip-content strong { color: #0f172a; display: block; margin-bottom: 4px; }
        .reason-details {
          margin-top: 8px; padding-top: 8px;
          border-top: 1px dashed #e2e8f0;
          font-size: 0.75rem; color: #64748b;
        }
        .inactive-reason-display {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid rgba(220, 53, 69, 0.2);
          border-radius: 0.5rem; margin-top: 1rem;
          font-size: 0.875rem; color: #dc3545;
        }
        .inactive-reason-display .reason-icon { color: #dc3545; font-size: 0.875rem; flex-shrink: 0; }
        .reason-content { flex: 1; }

        /* ================= Empty state ================= */
        .no-data { text-align: center; padding: 4rem 2rem; color: #64748b; width: 100%; }
        .no-data svg { margin-bottom: 1.5rem; opacity: 0.3; color: #667eea; }
        .no-data p { font-size: 1.05rem; color: #495057; margin: 0 0 2rem 0; }

        /* ================= Pagination ================= */
        .pagination-container {
          padding: 2rem; border-top: 1px solid #f1f3f4;
          display: flex; justify-content: center;
          width: 100%; max-width: 100%; box-sizing: border-box;
        }

        /* ====================================================================
           Shared keyframes
           ==================================================================== */
        @keyframes amSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(-50px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ====================================================================
           Details modal — SAME shell as AdminModal
           ==================================================================== */
        .details-modal-overlay {
          position: fixed;
          top: 0; right: 0; bottom: 0; left: 0;
          background: #f8fafc;
          overflow-y: auto; overflow-x: hidden;
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
          animation: amSlideIn 0.3s ease-out;
        }
        .details-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 2rem; border-bottom: 1px solid #f1f3f4;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }
        .matricule-header-info { display: flex; align-items: center; gap: 1.5rem; }
        .matricule-avatar-large {
          width: 80px; height: 80px; border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 1.5rem; flex-shrink: 0;
        }
        .matricule-info h2 { margin: 0 0 0.5rem 0; color: #0f172a; font-size: 1.5rem; }
        .matricule-contact { display: flex; flex-direction: column; gap: 0.5rem; color: #64748b; font-size: 0.9rem; }
        .matricule-contact div { display: flex; align-items: center; gap: 0.5rem; }
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
        .info-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem; margin-bottom: 1.5rem;
        }
        .info-item {
          display: flex; flex-direction: column; gap: 0.5rem;
          padding: 1rem; background: #f8fafc;
          border-radius: 0.5rem; border: 1px solid #e2e8f0;
        }
        .info-item label {
          font-size: 0.75rem; font-weight: 600; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .info-item div { font-size: 0.9rem; color: #334155; font-weight: 500; }

        /* ================= Maintenance sections ================= */
        .maintenance-alerts-section { margin-bottom: 2rem; }
        .alerts-title {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 1.1rem; font-weight: 600;
          color: #0f172a; margin-bottom: 1rem;
        }
        .alerts-icon { color: #dc3545; }
        .alerts-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .alert-item { padding: 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; }
        .alert-item.high { background: rgba(220, 53, 69, 0.05); border-left: 4px solid #dc3545; }
        .alert-item.medium { background: rgba(255, 193, 7, 0.05); border-left: 4px solid #f59e0b; }
        .alert-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
        .alert-message { font-weight: 500; color: #334155; flex: 1; }
        .alert-details {
          display: flex; flex-wrap: wrap; gap: 1rem;
          font-size: 0.8rem; color: #64748b;
        }

        .maintenance-section { margin-bottom: 2rem; }
        .maintenance-title {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 1.1rem; font-weight: 600;
          color: #0f172a; margin-bottom: 1rem;
        }
        .maintenance-icon { color: #f59e0b; }
        .maintenance-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        .maintenance-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1rem; background: white;
          border: 1px solid #e2e8f0; border-radius: 0.5rem;
          transition: all 0.3s ease;
        }
        .maintenance-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); transform: translateY(-1px); }
        .maintenance-label {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.875rem; color: #334155; font-weight: 500;
        }
        .maintenance-item-icon { color: #667eea; font-size: 0.875rem; }

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

        /* ====================================================================
           ACCIDENT MODAL — exact AdminModal shell
           (gradient header, white icon circle, subtitle, absolute close,
            padded body, bordered footer with pill buttons)
           ==================================================================== */
        .acc-overlay {
          position: fixed;
          top: 0; right: 0; bottom: 0; left: 0;
          background: #f8fafc;
          overflow-y: auto; overflow-x: hidden;
          z-index: 9999;
        }
        @media (min-width: 768px) {
          .acc-overlay { left: 18rem; }
        }

        .acc-modal {
          background: #fff;
          border-radius: 32px;
          margin: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: amSlideIn 0.3s ease-out;
        }

        .acc-header {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 24px 32px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .acc-header-icon {
          width: 56px;
          height: 56px;
          background: #ffffff;
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #667eea;
          flex-shrink: 0;
        }
        .acc-header-title { flex: 1; min-width: 0; padding-right: 48px; }
        .acc-header-title h2 {
          color: #fff;
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
        }
        .acc-header-title p {
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.875rem;
          margin: 4px 0 0;
        }
        .acc-header-close {
          position: absolute;
          top: 24px;
          right: 28px;
          background: rgba(255, 255, 255, 0.15);
          border: none;
          border-radius: 40px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #fff;
          transition: all 0.2s;
        }
        .acc-header-close:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.05);
        }
        .acc-header-close:disabled { opacity: 0.5; cursor: not-allowed; }

        .acc-form { padding: 28px 32px; }

        .acc-body {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .acc-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .acc-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }
        .acc-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .acc-required::after { content: " *"; color: #dc2626; }
        .acc-hint {
          font-size: 0.7rem;
          color: #b45309;
          font-style: italic;
          line-height: 1.4;
        }

        .acc-input {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.875rem;
          font-family: inherit;
          background: #fff;
          color: #1e293b;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .acc-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .acc-input:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .acc-footer {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .acc-btn-primary,
        .acc-btn-secondary {
          font-family: inherit;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 40px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .acc-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          padding: 12px 28px;
          color: #fff;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        .acc-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        .acc-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .acc-btn-secondary {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          padding: 10px 24px;
          color: #475569;
        }
        .acc-btn-secondary:hover:not(:disabled) {
          border-color: #667eea;
          color: #667eea;
          background: #f8fafc;
        }
        .acc-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ================= Confirmation modal — full-screen overlay ================= */
        .confirmation-modal-overlay {
          position: fixed;
          top: 0; right: 0; bottom: 0; left: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; padding: 1rem;
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
          background: rgba(220, 53, 69, 0.1); color: #dc3545;
          border: 2px solid rgba(220, 53, 69, 0.2);
        }
        .confirmation-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
        .confirmation-body { padding: 1.5rem 2rem; }
        .confirmation-message {
          color: #64748b; font-size: 1rem;
          line-height: 1.6; margin-bottom: 1.5rem; text-align: center;
        }
        .matricule-preview {
          padding: 1.5rem; background: #f8fafc;
          border-radius: 0.75rem; border: 1px solid #e2e8f0; margin-top: 1rem;
        }
        .matricule-avatar-preview {
          width: 60px; height: 60px; border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 1.2rem; margin-right: 1rem;
        }
        .matricule-info-preview { flex: 1; }
        .matricule-info-preview h4 { margin: 0 0 0.5rem 0; color: #0f172a; font-size: 1.1rem; font-weight: 600; }
        .matricule-meta-preview {
          display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.9rem;
        }
        .matricule-meta-preview > div {
          color: #64748b; display: flex; align-items: center; gap: 0.5rem;
        }
        .confirmation-actions {
          padding: 1.5rem 2rem 2rem;
          display: flex; gap: 1rem; justify-content: flex-end;
        }
        .btn-confirm-cancel {
          padding: 0.75rem 1.5rem; border: 1px solid #6c757d;
          background: transparent; color: #6c757d; border-radius: 0.75rem;
          font-size: 0.875rem; font-weight: 600; cursor: pointer;
          transition: all 0.3s ease; font-family: inherit;
        }
        .btn-confirm-cancel:hover:not(:disabled) { background: #6c757d; color: white; }
        .btn-confirm-cancel:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-confirm-delete {
          padding: 0.75rem 1.5rem; border: none; background: #ef4444;
          color: white; border-radius: 0.75rem; font-size: 0.875rem;
          font-weight: 600; cursor: pointer; transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
          display: flex; align-items: center; gap: 0.5rem; font-family: inherit;
        }
        .btn-confirm-delete:hover:not(:disabled) {
          background: #dc2626; transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
        }
        .btn-confirm-delete:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

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

        /* ================= Responsive ================= */
        @media (max-width: 1400px) { .filter-group { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); } }
        @media (max-width: 1200px) { .filter-group { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); } }
        @media (max-width: 1024px) {
          .section-header { flex-direction: column; gap: 1.5rem; }
          .section-actions { width: 100%; justify-content: flex-start; flex-wrap: wrap; }
          .search-filter-section { padding: 1.25rem; }
          .filter-group { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem; }
          .filter-select { font-size: 0.8rem; padding: 0.5rem 0.75rem; }
        }
        @media (max-width: 768px) {
          .matricules-management { padding: 1rem; }
          .section-header { padding: 1.5rem; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
          .stat-card { padding: 1.25rem; }
          .stat-number { font-size: 1.75rem; }
          .search-filter-section { padding: 1rem; }
          .filter-group { grid-template-columns: 1fr; gap: 0.75rem; }
          .filter-item { width: 100%; }
          .filter-select { width: 100%; min-width: 100%; }
          .filter-actions { justify-content: center; }
          .results-summary { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
          .page-info { align-self: flex-end; }
          .action-buttons { flex-direction: row; flex-wrap: nowrap; }
          .action-btn { width: 32px; height: 32px; font-size: 0.75rem; }
          .pagination { flex-wrap: wrap; justify-content: center; }
          .pagination-btn { min-width: 36px; height: 36px; padding: 0.5rem 0.75rem; font-size: 0.8rem; }

          /* Details & Accident modals shrink on mobile */
          .details-modal,
          .acc-modal {
            margin: 1rem;
            border-radius: 24px;
          }
          .acc-header { padding: 16px 20px; gap: 14px; }
          .acc-header-title h2 { font-size: 1.25rem; }
          .acc-header-title { padding-right: 40px; }
          .acc-header-icon { width: 44px; height: 44px; border-radius: 22px; }
          .acc-header-close { top: 16px; right: 16px; width: 36px; height: 36px; }
          .acc-form { padding: 20px; }
          .acc-grid-2 { grid-template-columns: 1fr; }

          .details-header { flex-direction: column; gap: 1rem; align-items: flex-start; }
          .matricule-header-info { flex-direction: column; text-align: center; gap: 1rem; }
          .info-grid { grid-template-columns: 1fr; }
          .maintenance-grid { grid-template-columns: 1fr; }
          .items-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
          .section-actions { flex-direction: column; align-items: stretch; }
          .btn { width: 100%; justify-content: center; }
          .search-input { font-size: 0.8rem; padding: 0.5rem 1rem 0.5rem 2.5rem; }
          .search-icon { left: 0.75rem; }
        }
          .filter-indicator {
  display: flex; align-items: center; justify-content: space-between;
  background: #fef3c7; border: 1px solid #f59e0b;
  border-radius: 0.75rem; padding: 0.75rem 1rem;
  margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;
}
.filter-indicator-text {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.875rem; font-weight: 500; color: #92400e;
}
.clear-filter-btn {
  display: inline-flex; align-items: center; gap: 0.25rem;
  background: none; border: 1px solid #92400e;
  padding: 0.25rem 0.75rem; border-radius: 2rem;
  font-size: 0.75rem; font-weight: 500;
  color: #92400e; cursor: pointer;
}
.clear-filter-btn:hover { background: #92400e; color: #fff; }
      `}</style>
    </div>
  );
};

export default MatriculesManagement;