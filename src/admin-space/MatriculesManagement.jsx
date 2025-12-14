import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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

  // États de recherche et filtre
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(filter || 'all');
  const [vidangeFilter, setVidangeFilter] = useState('all');
  const [carFilter, setCarFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // États de vue détaillée
  const [selectedMatricule, setSelectedMatricule] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [reservationsPage, setReservationsPage] = useState(1);
  const [accidentsPage, setAccidentsPage] = useState(1);
  const detailsItemsPerPage = 6;

  // État de création d'accident
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

  // État des raisons d'inactivité
  const [inactiveReasons, setInactiveReasons] = useState({});

  // État des alertes de maintenance
  const [maintenanceAlerts, setMaintenanceAlerts] = useState({});

  // Gérer les changements de filtre
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

  // Calculer les raisons d'inactivité et les alertes de maintenance
  useEffect(() => {
    if (matricules.length > 0 && reservations.length > 0 && accidents.length > 0) {
      const reasons = {};
      const alerts = {};
      
      matricules.forEach(matricule => {
        if (matricule.status === 'inactive') {
          reasons[matricule.id] = getInactiveReason(matricule);
        }
        
        // Vérifier les alertes de maintenance
        const maintenanceAlertsForMatricule = checkMaintenanceAlerts(matricule);
        if (maintenanceAlertsForMatricule.length > 0) {
          alerts[matricule.id] = maintenanceAlertsForMatricule;
        }
      });
      
      setInactiveReasons(reasons);
      setMaintenanceAlerts(alerts);
    }
  }, [matricules, reservations, accidents]);

  // Fonction pour vérifier les alertes de maintenance
  const checkMaintenanceAlerts = (matricule) => {
    const alerts = [];
    const currentKm = matricule.kilometrage || 0;

    // Vérifier la maintenance additionnelle
    if (matricule.additional_maintenance && Array.isArray(matricule.additional_maintenance)) {
      matricule.additional_maintenance.forEach(item => {
        if (item.needs_attention || item.requires_attention) {
          if (item.actual_km > item.recommended_km) {
            const kmOverdue = item.actual_km - item.recommended_km;
            alerts.push({
              type: 'additional_maintenance',
              severity: 'high',
              message: `${item.name}: DÉPASSÉ de ${kmOverdue} km`,
              itemName: item.name,
              overdue: kmOverdue,
              actualKm: item.actual_km,
              recommendedKm: item.recommended_km
            });
          } else if (item.actual_km >= item.recommended_km - 500) {
            const kmRemaining = item.recommended_km - item.actual_km;
            alerts.push({
              type: 'additional_maintenance',
              severity: 'medium',
              message: `${item.name}: Dans ${kmRemaining} km`,
              itemName: item.name,
              remaining: kmRemaining,
              actualKm: item.actual_km,
              recommendedKm: item.recommended_km
            });
          }
        }
      });
    }

    // Vérifier les kilométrages périodiques
    if (matricule.periodic_km_maintenance && Array.isArray(matricule.periodic_km_maintenance)) {
      matricule.periodic_km_maintenance.forEach(item => {
        if (currentKm >= item.next_change_km) {
          const kmOverdue = currentKm - item.next_change_km;
          alerts.push({
            type: 'periodic_km',
            severity: 'high',
            message: `${item.name}: DÉPASSÉ de ${kmOverdue} km`,
            itemName: item.name,
            overdue: kmOverdue,
            currentKm: currentKm,
            nextChangeKm: item.next_change_km
          });
        } else if (currentKm >= item.next_change_km - 1000) {
          const kmRemaining = item.next_change_km - currentKm;
          alerts.push({
            type: 'periodic_km',
            severity: 'medium',
            message: `${item.name}: Dans ${kmRemaining} km`,
            itemName: item.name,
            remaining: kmRemaining,
            currentKm: currentKm,
            nextChangeKm: item.next_change_km
          });
        }
      });
    }

    // Vérifier la vidange
    if (matricule.vidange_status === 'not done') {
      const maintenanceInterval = 10000;
      const kmSinceLastReset = currentKm % maintenanceInterval;
      const kmRemaining = maintenanceInterval - kmSinceLastReset;
      
      if (kmRemaining <= 0) {
        const kmOverdue = Math.abs(kmRemaining);
        alerts.push({
          type: 'vidange',
          severity: 'high',
          message: `Vidange: DÉPASSÉ de ${kmOverdue} km`,
          overdue: kmOverdue,
          currentKm: currentKm
        });
      } else if (kmRemaining <= 1000) {
        alerts.push({
          type: 'vidange',
          severity: 'medium',
          message: `Vidange: Dans ${kmRemaining} km`,
          remaining: kmRemaining,
          currentKm: currentKm
        });
      }
    }

    return alerts;
  };

  // Fonction pour obtenir la raison d'inactivité d'un matricule
  const getInactiveReason = (matricule) => {
    // Vérifier s'il y a des accidents actifs pour ce matricule
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

    // Vérifier s'il y a des réservations actives pour ce matricule
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

    // Vérifier les raisons de maintenance
    if (matricule.vidange_status === 'not done') {
      return {
        type: 'maintenance',
        message: 'Maintenance requise (Vidange non effectuée)'
      };
    }

    // Raison par défaut
    return {
      type: 'manual',
      message: 'Défini manuellement comme inactif'
    };
  };

  // Filtrer les matricules basés sur la recherche et les filtres
  const filteredMatricules = matricules.filter(matricule => {
    // Filtre de recherche
    const matchesSearch = searchTerm === '' || 
      matricule.matricule_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matricule.car?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matricule.car?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matricule.id.toString().includes(searchTerm);

    // Filtre de statut
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'reserved') {
        // Vérifier si le matricule est dans une réservation active
        const isReserved = reservations.some(reservation => 
          (reservation.status === 'confirmed' || 
           reservation.status === 'retard' || 
           reservation.status === 'pending') &&
          reservation.matricule_id === matricule.id
        );
        matchesStatus = isReserved;
      } else if (statusFilter === 'late') {
        // Vérifier si le matricule est dans une réservation en retard
        const isLate = reservations.some(reservation => 
          reservation.status === 'retard' &&
          reservation.matricule_id === matricule.id
        );
        matchesStatus = isLate;
      } else {
        matchesStatus = matricule.status === statusFilter;
      }
    }

    // Filtre vidange
    const matchesVidange = vidangeFilter === 'all' || matricule.vidange_status === vidangeFilter;

    // Filtre voiture
    const matchesCar = carFilter === 'all' || matricule.car_id == carFilter;

    return matchesSearch && matchesStatus && matchesVidange && matchesCar;
  });

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

  // Mettre à jour les clients disponibles quand la date d'accident ou le matricule change
  useEffect(() => {
    if (selectedMatriculeForAccident && accidentFormData.date_accident) {
      const clients = getAvailableClientsForAccident(
        selectedMatriculeForAccident.id, 
        accidentFormData.date_accident
      );
      setAvailableClients(clients);
      
      // Sélectionner automatiquement le premier client si un seul est disponible
      if (clients.length === 1) {
        setAccidentFormData(prev => ({ ...prev, client_id: clients[0].id }));
      } else {
        setAccidentFormData(prev => ({ ...prev, client_id: '' }));
      }
    }
  }, [selectedMatriculeForAccident, accidentFormData.date_accident, reservations]);

  // Pagination
  const totalPages = Math.ceil(filteredMatricules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMatricules = filteredMatricules.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleVidangeFilter = (e) => {
    setVidangeFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleCarFilter = (e) => {
    setCarFilter(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setVidangeFilter('all');
    setCarFilter('all');
    setCurrentPage(1);
  };

  // Fonctions de détails des matricules
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

  // Obtenir les données spécifiques au matricule
  const getMatriculeReservations = (matriculeId) => {
    return reservations.filter(r => r.matricule_id === matriculeId);
  };

  const getMatriculeAccidents = (matriculeId) => {
    return accidents.filter(a => a.matricule_id === matriculeId);
  };

  // Pagination pour les détails
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
    
    // Valider les champs requis
    if (!accidentFormData.client_id) {
      showErrorMessage('Veuillez sélectionner un client pour le rapport d\'accident');
      setSubmittingAccident(false);
      return;
    }

    try {
      // Préparer les données d'accident complètes avec tous les champs requis
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

      console.log('Envoi des données d\'accident:', completeAccidentData);

      // Créer l'accident - le statut du matricule sera mis à jour automatiquement par le backend
      await dispatch(createAccident(completeAccidentData)).unwrap();
      
      showSuccessMessage('Accident créé avec succès ! Le statut du matricule sera mis à jour en fonction du type d\'accident et du statut.');
      setShowAccidentModal(false);
      setSelectedMatriculeForAccident(null);
      setAccidentFormData({
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
    const existingNotifications = document.querySelectorAll('.success-notification, .error-notification');
    existingNotifications.forEach(notification => notification.remove());

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
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  };

  const showErrorMessage = (message) => {
    const existingNotifications = document.querySelectorAll('.success-notification, .error-notification');
    existingNotifications.forEach(notification => notification.remove());

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

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 8000);
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

  // Obtenir les statistiques des matricules
  const getMatriculeStats = () => {
    const totalMatricules = matricules.length;
    const activeMatricules = matricules.filter(m => m.status === 'active').length;
    const vidangeDone = matricules.filter(m => m.vidange_status === 'done').length;
    const inactiveMatricules = matricules.filter(m => m.status === 'inactive').length;
    
    return { totalMatricules, activeMatricules, vidangeDone, inactiveMatricules };
  };

  const stats = getMatriculeStats();

  const getStatusBadge = (status, matricule = null) => {
  // Déterminer le statut réel basé sur les réservations
  let actualStatus = status;
  if (status === 'active' && matricule) {
    const isReserved = reservations.some(r => 
      (r.status === 'confirmed' || r.status === 'pending') && 
      r.matricule_id === matricule.id
    );
    const isLate = reservations.some(r => 
      r.status === 'retard' && 
      r.matricule_id === matricule.id
    );
    
    if (isLate) {
      actualStatus = 'late';
    } else if (isReserved) {
      actualStatus = 'reserved';
    }
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
  
  return (
    <div className="status-badge-container">
      <span className={config.class}>
        {config.icon && <config.icon className="status-icon" />}
        {config.text}
      </span>
      {actualStatus === 'inactive' && matricule && matricule.id && inactiveReasons[matricule.id] && (
        <div className="inactive-reason-wrapper">
          <FaInfoCircle className="reason-icon-hover" />
          <div className="inactive-reason-tooltip">
            <div className="tooltip-content">
              <strong>Raison d'inactivité :</strong> {inactiveReasons[matricule.id].message}
              {inactiveReasons[matricule.id].type === 'accident' && (
                <div className="reason-details">
                  Type : Accident - ${inactiveReasons[matricule.id].accident?.amount_of_losses} pertes
                </div>
              )}
              {inactiveReasons[matricule.id].type === 'reservation' && (
                <div className="reason-details">
                  Type : Réservation Active
                </div>
              )}
              {inactiveReasons[matricule.id].type === 'maintenance' && (
                <div className="reason-details">
                  Type : Maintenance Requise
                </div>
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
      <span className="maintenance-badge done">
        <FaCheck className="badge-icon" />
        Effectué
      </span>
    ) : (
      <span className="maintenance-badge not-done">
        <FaTimes className="badge-icon" />
        Non Effectué
      </span>
    );
  };

  const getMaintenanceAlertBadge = (alert) => {
    return alert.severity === 'high' ? (
      <span className="alert-badge high">
        <FaExclamationCircle className="badge-icon" />
        Urgent
      </span>
    ) : (
      <span className="alert-badge medium">
        <FaExclamationTriangle className="badge-icon" />
        Attention
      </span>
    );
  };

  const refreshData = () => {
    dispatch(fetchMatricules());
    dispatch(fetchCars());
    dispatch(fetchReservations());
    dispatch(fetchAccidents());
    showSuccessMessage('Données actualisées avec succès !');
  };

  // Générer les boutons de pagination
  const renderPaginationButtons = (currentPage, totalPages, onPageChange, type = 'main') => {
    const buttons = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Bouton précédent
    buttons.push(
      <button
        key="prev"
        className={`pagination-btn ${type} ${currentPage === 1 ? 'disabled' : ''}`}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <FaChevronLeft />
      </button>
    );

    // Première page
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          className={`pagination-btn ${type} ${currentPage === 1 ? 'active' : ''}`}
          onClick={() => onPageChange(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(<span key="ellipsis1" className={`pagination-ellipsis ${type}`}>...</span>);
      }
    }

    // Numéros de page
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`pagination-btn ${type} ${currentPage === i ? 'active' : ''}`}
          onClick={() => onPageChange(i)}
        >
          {i}
        </button>
      );
    }

    // Dernière page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="ellipsis2" className={`pagination-ellipsis ${type}`}>...</span>);
      }
      buttons.push(
        <button
          key={totalPages}
          className={`pagination-btn ${type} ${currentPage === totalPages ? 'active' : ''}`}
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    // Bouton suivant
    buttons.push(
      <button
        key="next"
        className={`pagination-btn ${type} ${currentPage === totalPages ? 'disabled' : ''}`}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <FaChevronRight />
      </button>
    );

    return buttons;
  };

  // Obtenir les voitures uniques pour le filtre
  const uniqueCars = [...new Set(matricules.map(m => m.car_id).filter(Boolean))];
  const carOptions = cars.filter(car => uniqueCars.includes(car.id));

  // Obtenir l'explication du statut du matricule basé sur le type d'accident
  const getMatriculeStatusExplanation = (accidentType) => {
    if (accidentType === 'grave') {
      return "Le matricule sera inactif jusqu'à ce que le statut atteigne 'waiting' ou 'completed'";
    } else {
      return "Le matricule sera inactif seulement pendant le statut 'fixed'";
    }
  };

  // Obtenir les éléments de maintenance pour la vue détaillée
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

  // Obtenir les alertes de maintenance pour un matricule
  const getMatriculeMaintenanceAlerts = (matriculeId) => {
    return maintenanceAlerts[matriculeId] || [];
  };

  // Vérifier si un matricule a des alertes
  const hasMaintenanceAlerts = (matriculeId) => {
    return maintenanceAlerts[matriculeId] && maintenanceAlerts[matriculeId].length > 0;
  };

  // Obtenir les éléments de maintenance additionnelle
  const getAdditionalMaintenanceItems = (matricule) => {
    if (!matricule.additional_maintenance || !Array.isArray(matricule.additional_maintenance)) {
      return [];
    }
    
    return matricule.additional_maintenance.map(item => ({
      ...item,
      type: 'additional_maintenance',
      isOverdue: item.actual_km > item.recommended_km,
      kmOverdue: item.actual_km - item.recommended_km,
      kmRemaining: item.recommended_km - item.actual_km,
      needsAttention: item.needs_attention || item.requires_attention
    }));
  };

  // Obtenir les éléments de maintenance périodique
  const getPeriodicMaintenanceItems = (matricule) => {
    if (!matricule.periodic_km_maintenance || !Array.isArray(matricule.periodic_km_maintenance)) {
      return [];
    }
    
    const currentKm = matricule.kilometrage || 0;
    
    return matricule.periodic_km_maintenance.map(item => ({
      ...item,
      type: 'periodic_km',
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
            <FaRedo className="btn-icon" />
            Actualiser
          </button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
            {submitting ? <FaSpinner className="btn-icon spinning" /> : <FaPlus className="btn-icon" />}
            {submitting ? 'Traitement...' : 'Nouveau Matricule'}
          </button>
          <button className="btn btn-secondary" onClick={handleExport} disabled={submitting}>
            <FaFileExport className="btn-icon" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Cartes de Statistiques */}
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

      {/* Section Recherche et Filtres */}
      <div className="search-filter-section">
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

        <div className="filter-group">
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
              <option value="all">Tous les Statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="reserved">Réservé</option>
              <option value="late">En Retard</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="vidange-filter">
              <FaOilCan className="filter-icon" />
              Vidange
            </label>
            <select
              id="vidange-filter"
              value={vidangeFilter}
              onChange={handleVidangeFilter}
              className="filter-select"
            >
              <option value="all">Tous les Statuts</option>
              <option value="done">Effectuée</option>
              <option value="not done">Non Effectuée</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="car-filter">
              <FaCar className="filter-icon" />
              Voiture
            </label>
            <select
              id="car-filter"
              value={carFilter}
              onChange={handleCarFilter}
              className="filter-select"
            >
              <option value="all">Toutes les Voitures</option>
              {carOptions.map(car => (
                <option key={car.id} value={car.id}>
                  {car.brand} {car.model}
                </option>
              ))}
            </select>
          </div>

          {(searchTerm !== '' || statusFilter !== 'all' || vidangeFilter !== 'all' || carFilter !== 'all') && (
            <button className="btn btn-clear" onClick={clearFilters}>
              Effacer les Filtres
            </button>
          )}
        </div>
      </div>

      {/* Résumé des Résultats */}
      <div className="results-summary">
        <span className="results-count">
          Affichage de {currentMatricules.length} sur {filteredMatricules.length} matricules
          {filteredMatricules.length !== matricules.length && ` (filtrés sur ${matricules.length} au total)`}
        </span>
        <span className="page-info">
          Page {currentPage} sur {totalPages}
        </span>
      </div>

      <div className="content-container">
        {currentMatricules.length > 0 ? (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Matricule</th>
                  <th>Voiture</th>
                  <th>Kilométrage</th>
                  <th>Visite Technique</th>
                  <th>Vidange</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentMatricules.map(matricule => {
                  const hasAlerts = hasMaintenanceAlerts(matricule.id);
                  const alertsCount = getMatriculeMaintenanceAlerts(matricule.id).length;
                  
                  return (
                    <tr key={matricule.id}>
                      <td className="matricule-id">#{matricule.id}</td>
                      <td className="matricule-code">
                        <strong>{matricule.matricule_code}</strong>
                      </td>
                      <td>
                        {matricule.car ? (
                          <div className="car-info">
                            <div className="car-name">{matricule.car.brand} {matricule.car.model}</div>
                            <div className="car-details">
                              {matricule.car.year} • {matricule.car.color}
                            </div>
                          </div>
                        ) : (
                          <span className="no-car">Aucune voiture assignée</span>
                        )}
                      </td>
                      <td className="kilometrage-cell">
                        <FaTachometerAlt className="kilometrage-icon" />
                        {matricule.kilometrage?.toLocaleString()} km
                        {matricule.kilometrage_entree && (
                          <div className="last-return">
                            Dernier retour : {matricule.kilometrage_entree} km
                          </div>
                        )}
                      </td>
                      <td>{matricule.visit_tech ? new Date(matricule.visit_tech).toLocaleDateString('fr-FR') : 'Non définie'}</td>
                      <td>{getStatusBadge(matricule.vidange_status)}</td>
                      <td>{getStatusBadge(matricule.status, matricule)}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn view" 
                            onClick={() => handleViewDetails(matricule)}
                            title="Voir les Détails"
                          >
                            <FaEye />
                            {hasAlerts && (
                              <span className="action-alert-indicator">
                                {alertsCount > 0 && (
                                  <>
                                    <span className="alert-dot"></span>
                                    {alertsCount > 1 && (
                                      <span className="alert-count">{alertsCount}</span>
                                    )}
                                  </>
                                )}
                              </span>
                            )}
                          </button>
                          <button 
                            className="action-btn accident" 
                            onClick={() => handleAddToAccident(matricule)}
                            title="Ajouter à un Accident"
                          >
                            <FaCarCrash />
                          </button>
                          <button 
                            className="action-btn edit" 
                            onClick={() => handleEdit(matricule)}
                            title="Modifier"
                            disabled={submitting}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="action-btn delete" 
                            onClick={() => showDeleteConfirmation(matricule)}
                            title="Supprimer"
                            disabled={submitting}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination">
                  {renderPaginationButtons(currentPage, totalPages, handlePageChange, 'main')}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="no-data">
            <FaDatabase size={48} />
            <p>
              {matricules.length === 0 
                ? 'Aucun matricule trouvé' 
                : 'Aucun matricule ne correspond à vos critères de recherche'}
            </p>
            <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
              <FaPlus className="btn-icon" />
              Nouveau Matricule
            </button>
            {(searchTerm !== '' || statusFilter !== 'all' || vidangeFilter !== 'all' || carFilter !== 'all') && (
              <button className="btn btn-secondary" onClick={clearFilters} style={{marginTop: '1rem'}}>
                Effacer les Filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de Détails du Matricule */}
      {showDetails && selectedMatricule && (
        <div className="details-modal-overlay">
          <div className="details-modal">
            <div className="details-header">
              <div className="matricule-header-info">
                <div className="matricule-avatar-large">
                  {selectedMatricule.matricule_code.substring(0, 2)}
                </div>
                <div className="matricule-info">
                  <h2>{selectedMatricule.matricule_code}</h2>
                  <div className="matricule-contact">
                    <div><FaCar /> {selectedMatricule.car ? `${selectedMatricule.car.brand} ${selectedMatricule.car.model}` : 'Aucune voiture assignée'}</div>
                    <div><FaTachometerAlt /> {selectedMatricule.kilometrage?.toLocaleString()} km</div>
                    <div><FaCalendarAlt /> Visite Technique : {selectedMatricule.visit_tech ? new Date(selectedMatricule.visit_tech).toLocaleDateString('fr-FR') : 'Non définie'}</div>
                  </div>
                </div>
              </div>
              <button className="close-details-btn" onClick={handleCloseDetails}>
                <FaTimes />
              </button>
            </div>

            <div className="details-content">
              {/* Section Informations du Matricule */}
              <div className="details-section">
                <div className="section-title">
                  <FaIdCard />
                  <span>Informations du Matricule</span>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Statut</label>
                    <div>{getStatusBadge(selectedMatricule.status, selectedMatricule)}</div>
                  </div>
                  <div className="info-item">
                    <label>Statut Vidange</label>
                    <div>{getStatusBadge(selectedMatricule.vidange_status)}</div>
                  </div>
                  <div className="info-item">
                    <label>Kilométrage Actuel</label>
                    <div>{selectedMatricule.kilometrage?.toLocaleString()} km</div>
                  </div>
                  <div className="info-item">
                    <label>Dernier Kilométrage Entrée</label>
                    <div>{selectedMatricule.kilometrage_entree?.toLocaleString() || 'N/A'} km</div>
                  </div>
                  <div className="info-item">
                    <label>Dernier Kilométrage Sortie</label>
                    <div>{selectedMatricule.kilometrage_sortie?.toLocaleString() || 'N/A'} km</div>
                  </div>
                  <div className="info-item">
                    <label>Visite Technique</label>
                    <div>{selectedMatricule.visit_tech ? new Date(selectedMatricule.visit_tech).toLocaleDateString('fr-FR') : 'Non définie'}</div>
                  </div>
                </div>

                {/* Alertes de Maintenance */}
                {hasMaintenanceAlerts(selectedMatricule.id) && (
                  <div className="maintenance-alerts-section">
                    <h4 className="alerts-title">
                      <FaExclamationTriangle className="alerts-icon" />
                      Alertes de Maintenance
                    </h4>
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

                {/* Statut de Maintenance */}
                <div className="maintenance-section">
                  <h4 className="maintenance-title">
                    <FaTools className="maintenance-icon" />
                    Statut de Maintenance
                  </h4>
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

                {/* Maintenance Additionnelle */}
                <div className="additional-maintenance-section">
                  <h4 className="maintenance-title">
                    <FaWrench className="maintenance-icon" />
                    Maintenance Additionnelle
                  </h4>
                  {getAdditionalMaintenanceItems(selectedMatricule).length > 0 ? (
                    <div className="maintenance-details-grid">
                      {getAdditionalMaintenanceItems(selectedMatricule).map((item, index) => (
                        <div key={index} className={`maintenance-detail-item ${item.isOverdue ? 'overdue' : item.needsAttention ? 'attention' : 'normal'}`}>
                          <div className="maintenance-detail-header">
                            <span className="maintenance-detail-name">{item.name}</span>
                            {item.isOverdue ? (
                              <span className="maintenance-detail-status overdue">
                                <FaExclamationCircle /> DÉPASSÉ
                              </span>
                            ) : item.needsAttention ? (
                              <span className="maintenance-detail-status attention">
                                <FaExclamationTriangle /> ATTENTION
                              </span>
                            ) : (
                              <span className="maintenance-detail-status normal">
                                <FaCheck /> NORMAL
                              </span>
                            )}
                          </div>
                          <div className="maintenance-detail-info">
                            <div className="km-info">
                              <span>Kilométrage Actuel: <strong>{item.actual_km?.toLocaleString()} km</strong></span>
                              <span>Kilométrage Recommandé: <strong>{item.recommended_km?.toLocaleString()} km</strong></span>
                            </div>
                            {item.isOverdue ? (
                              <div className="maintenance-alert">
                                <FaExclamationCircle />
                                <span>En retard de {item.kmOverdue?.toLocaleString()} km</span>
                              </div>
                            ) : item.needsAttention ? (
                              <div className="maintenance-warning">
                                <FaExclamationTriangle />
                                <span>Dans {item.kmRemaining?.toLocaleString()} km</span>
                              </div>
                            ) : null}
                          </div>
                          {item.description && (
                            <div className="maintenance-detail-description">
                              <small>{item.description}</small>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-maintenance-data">
                      <FaWrench size={32} />
                      <p>Aucune maintenance additionnelle définie</p>
                    </div>
                  )}
                </div>

                {/* Maintenance Périodique */}
                <div className="periodic-maintenance-section">
                  <h4 className="maintenance-title">
                    <FaCalendarCheck className="maintenance-icon" />
                    Maintenance Périodique (Kilométrage)
                  </h4>
                  {getPeriodicMaintenanceItems(selectedMatricule).length > 0 ? (
                    <div className="maintenance-details-grid">
                      {getPeriodicMaintenanceItems(selectedMatricule).map((item, index) => (
                        <div key={index} className={`maintenance-detail-item ${item.isOverdue ? 'overdue' : 'normal'}`}>
                          <div className="maintenance-detail-header">
                            <span className="maintenance-detail-name">{item.name}</span>
                            {item.isOverdue ? (
                              <span className="maintenance-detail-status overdue">
                                <FaExclamationCircle /> DÉPASSÉ
                              </span>
                            ) : (
                              <span className="maintenance-detail-status normal">
                                <FaCheck /> À VENIR
                              </span>
                            )}
                          </div>
                          <div className="maintenance-detail-info">
                            <div className="km-info">
                              <span>Kilométrage Actuel: <strong>{selectedMatricule.kilometrage?.toLocaleString()} km</strong></span>
                              <span>Prochain Changement: <strong>{item.next_change_km?.toLocaleString()} km</strong></span>
                            </div>
                            {item.isOverdue ? (
                              <div className="maintenance-alert">
                                <FaExclamationCircle />
                                <span>En retard de {item.kmOverdue?.toLocaleString()} km</span>
                              </div>
                            ) : (
                              <div className="maintenance-warning">
                                <FaExclamationTriangle />
                                <span>Dans {item.kmRemaining?.toLocaleString()} km</span>
                              </div>
                            )}
                          </div>
                          {item.description && (
                            <div className="maintenance-detail-description">
                              <small>{item.description}</small>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-maintenance-data">
                      <FaCalendarCheck size={32} />
                      <p>Aucune maintenance périodique définie</p>
                    </div>
                  )}
                </div>

                {/* Affichage de la Raison d'Inactivité */}
                {selectedMatricule.status === 'inactive' && inactiveReasons[selectedMatricule.id] && (
                  <div className="inactive-reason-display">
                    <FaInfoCircle className="reason-icon" />
                    <div className="reason-content">
                      <strong>Raison d'inactivité :</strong> {inactiveReasons[selectedMatricule.id].message}
                    </div>
                  </div>
                )}
              </div>

              {/* Section Réservations */}
              <div className="details-section">
                <div className="section-title">
                  <FaCalendarAlt />
                  <span>Réservations ({matriculeReservations.length})</span>
                </div>
                {matriculeReservations.length > 0 ? (
                  <>
                    <div className="items-grid">
                      {currentReservations.map(reservation => (
                        <div key={reservation.id} className="item-card">
                          <div className="item-header">
                            <div className="item-title">
                              <FaUser className="item-icon" />
                              {reservation.client?.prenom} {reservation.client?.nom}
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
                              {reservation.total_days || reservation.rental_days} jours
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
                    <p>Aucune réservation trouvée pour ce matricule</p>
                  </div>
                )}
              </div>

              {/* Section Accidents */}
              <div className="details-section">
                <div className="section-title">
                  <FaCarCrash />
                  <span>Accidents ({matriculeAccidents.length})</span>
                </div>
                {matriculeAccidents.length > 0 ? (
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
                              <FaUser className="detail-icon" />
                              {accident.client?.prenom} {accident.client?.nom}
                            </div>
                            <div className="item-detail">
                              <FaMoneyBill className="detail-icon" />
                              Pertes : {accident.amount_of_losses} MAD
                            </div>
                            <div className="item-detail">
                              <FaShieldAlt className="detail-icon" />
                              Assurance : {accident.amount_assurance} MAD
                            </div>
                            <div className="item-detail">
                              <FaInfoCircle className="detail-icon" />
                              Statut : {accident.status}
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
                    <p>Aucun accident trouvé pour ce matricule</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Création d'Accident */}
      {showAccidentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <FaCarCrash className="modal-icon" />
                Ajouter au Rapport d'Accident
              </h3>
              <button 
                className="modal-close" 
                onClick={() => setShowAccidentModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleCreateAccident}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Matricule</label>
                  <input
                    type="text"
                    value={selectedMatriculeForAccident?.matricule_code || ''}
                    disabled
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Voiture</label>
                  <input
                    type="text"
                    value={selectedMatriculeForAccident?.car ? 
                      `${selectedMatriculeForAccident.car.brand} ${selectedMatriculeForAccident.car.model}` : 
                      'Aucune voiture assignée'}
                    disabled
                    className="form-input"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Type d'Accident *</label>
                    <select
                      value={accidentFormData.accident_type || 'grave'}
                      onChange={(e) => setAccidentFormData(prev => ({ 
                        ...prev, 
                        accident_type: e.target.value 
                      }))}
                      className="form-input"
                      required
                    >
                      <option value="grave">Accident Grave</option>
                      <option value="non_grave">Accident Non-Grave</option>
                    </select>
                    <div className="form-help-text">
                      {getMatriculeStatusExplanation(accidentFormData.accident_type)}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Type de Procédure *</label>
                    <select
                      value={accidentFormData.procedure_type || 'classic'}
                      onChange={(e) => setAccidentFormData(prev => ({ 
                        ...prev, 
                        procedure_type: e.target.value 
                      }))}
                      className="form-input"
                      required
                    >
                      <option value="classic">Procédure Classique</option>
                      <option value="forphie">Procédure Forphie</option>
                    </select>
                    <div className="form-help-text">
                      {accidentFormData.procedure_type === 'forphie' 
                        ? 'Seules les images d\'accident et d\'évaluation d\'expert sont requises' 
                        : 'Tous les types d\'images sont requis'}
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Statut de l'Accident *</label>
                  <select
                    value={accidentFormData.status || 'pending'}
                    onChange={(e) => setAccidentFormData(prev => ({ 
                      ...prev, 
                      status: e.target.value 
                    }))}
                    className="form-input"
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
                
                <div className="form-group">
                  <label>Date de l'Accident *</label>
                  <input
                    type="date"
                    value={accidentFormData.date_accident}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      setAccidentFormData(prev => ({ 
                        ...prev, 
                        date_accident: selectedDate 
                      }));
                      
                      // Mettre à jour la liste des clients disponibles
                      if (selectedMatriculeForAccident) {
                        const clients = getAvailableClientsForAccident(
                          selectedMatriculeForAccident.id, 
                          selectedDate
                        );
                        setAvailableClients(clients);
                        
                        if (clients.length === 1) {
                          setAccidentFormData(prev => ({ ...prev, client_id: clients[0].id }));
                        } else {
                          setAccidentFormData(prev => ({ ...prev, client_id: '' }));
                        }
                      }
                    }}
                    className="form-input"
                    required
                  />
                  <div className="form-help-text">
                    Les clients disponibles seront ceux avec des réservations <strong>terminées ou confirmées</strong> qui incluent cette date
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Sélectionner le Client *</label>
                  <select
                    value={accidentFormData.client_id || ''}
                    onChange={(e) => setAccidentFormData(prev => ({ 
                      ...prev, 
                      client_id: e.target.value 
                    }))}
                    className="form-input"
                    required
                  >
                    <option value="">Sélectionner un client</option>
                    {availableClients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} (Réservation #{client.reservation_id}) - Statut: {getReservationStatusText(client.status)}
                      </option>
                    ))}
                  </select>
                  {availableClients.length === 0 && accidentFormData.date_accident && (
                    <div className="form-help-text">
                      Aucune réservation terminée ou confirmée trouvée pour ce matricule le {accidentFormData.date_accident}
                    </div>
                  )}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Montant des Pertes (€) *</label>
                    <input
                      type="number"
                      value={accidentFormData.amount_of_losses || 0}
                      onChange={(e) => setAccidentFormData(prev => ({ 
                        ...prev, 
                        amount_of_losses: parseFloat(e.target.value) || 0 
                      }))}
                      className="form-input"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Montant Assurance (€) *</label>
                    <input
                      type="number"
                      value={accidentFormData.amount_assurance || 0}
                      onChange={(e) => setAccidentFormData(prev => ({ 
                        ...prev, 
                        amount_assurance: parseFloat(e.target.value) || 0 
                      }))}
                      className="form-input"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="form-notification">
                  <div className="notification-warning">
                    <FaExclamationTriangle className="notification-icon" />
                    <span>
                      <strong>Note :</strong> Le statut du matricule sera automatiquement mis à jour en fonction du type d'accident et du statut :
                      <br />
                      • <strong>Accidents graves :</strong> Matricule inactif jusqu'au statut 'waiting' ou 'completed'
                      <br />
                      • <strong>Accidents non-graves :</strong> Matricule inactif seulement pendant le statut 'fixed'
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAccidentModal(false)}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!accidentFormData.client_id || submittingAccident}
                >
                  {submittingAccident ? 'Traitement...' : 'Créer Rapport d\'Accident'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
              
              {confirmationConfig.matricule && (
                <div className="matricule-preview">
                  <div className="matricule-avatar-preview">
                    {confirmationConfig.matricule.matricule_code.substring(0, 2)}
                  </div>
                  <div className="matricule-info-preview">
                    <h4>{confirmationConfig.matricule.matricule_code}</h4>
                    <div className="matricule-meta-preview">
                      <div>{confirmationConfig.matricule.car?.brand} {confirmationConfig.matricule.car?.model}</div>
                      <div>{getStatusBadge(confirmationConfig.matricule.status, confirmationConfig.matricule.id)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="confirmation-actions">
              <button 
                className="btn-confirm-cancel"
                onClick={() => setShowConfirmation(false)}
                disabled={submitting}
              >
                Annuler
              </button>
              <button 
                className={`btn-confirm-${confirmationConfig.type}`}
                onClick={confirmationConfig.onConfirm}
                disabled={submitting}
              >
                {submitting ? <FaSpinner className="spinning" /> : 'Supprimer le Matricule'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .matricules-management {
          padding: 2rem;
          min-height: 100vh;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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

        .back-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.3s ease;
          margin-bottom: 1rem;
        }

        .back-button:hover {
          background: #5a6268;
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
          flex-wrap: wrap;
          gap: 10px;
        }

        .filter-indicator {
          font-size: 1.2rem;
          color: #6c757d;
          font-weight: 500;
          background: rgba(108, 117, 125, 0.1);
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid rgba(108, 117, 125, 0.2);
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

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
          box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
        }

        .btn-secondary:hover:not(:disabled) {
          background: #545b62;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(108, 117, 125, 0.4);
        }

        .btn-clear {
          background: #dc3545;
          color: white;
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
        }

        .btn-clear:hover:not(:disabled) {
          background: #c82333;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(220, 53, 69, 0.4);
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

        .stat-total::before { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .stat-active::before { background: linear-gradient(135deg, #4CAF50, #45a049); }
        .stat-inactive::before { background: linear-gradient(135deg, #dc3545, #c82333); }
        .stat-vidange::before { background: linear-gradient(135deg, #2196F3, #0b7dda); }

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

        /* Search and Filter Styles */
        .search-filter-section {
          background: white;
          padding: 1.5rem;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          margin-bottom: 1.5rem;
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          align-items: flex-end;
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
          border: 2px solid #e9ecef;
          border-radius: 12px;
          font-size: 0.875rem;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .filter-group {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
          flex-wrap: wrap;
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-item label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-icon {
          font-size: 0.875rem;
        }

        .filter-select {
          padding: 0.75rem 1rem;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          font-size: 0.875rem;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          min-width: 150px;
        }

        .filter-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        /* Results Summary */
        .results-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding: 0 0.5rem;
          font-size: 0.875rem;
          color: #6c757d;
        }

        .results-count {
          font-weight: 500;
        }

        .page-info {
          font-weight: 600;
          color: #495057;
        }

        /* Content Container */
        .content-container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
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

        .matricule-id {
          font-weight: 600;
          color: #6c757d;
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .matricule-code {
          font-weight: 700;
          color: #2c3e50;
          font-size: 1rem;
        }

        .car-info {
          color: #495057;
        }

        .car-name {
          font-weight: 600;
          color: #2c3e50;
        }

        .car-details {
          font-size: 0.8rem;
          color: #6c757d;
          margin-top: 0.25rem;
        }

        .no-car {
          color: #dc3545;
          font-style: italic;
        }

        .kilometrage-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: #495057;
        }

        .kilometrage-icon {
          color: #667eea;
          font-size: 0.875rem;
        }

        .last-return {
          font-size: 0.75rem;
          color: #6c757d;
          margin-top: 0.25rem;
        }

        /* Action Buttons with Alert Indicators */
        .action-buttons {
          display: flex;
          gap: 0.5rem;
          position: relative;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 36px;
          height: 36px;
          font-size: 0.875rem;
          position: relative;
        }

        .action-alert-indicator {
          position: absolute;
          top: -5px;
          right: -5px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .alert-dot {
          width: 8px;
          height: 8px;
          background: #dc3545;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 0 1px #dc3545;
          animation: pulse 2s infinite;
        }

        .alert-count {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #dc3545;
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          font-size: 0.6rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 0 0 1px #dc3545;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .action-btn.view {
          background: rgba(23, 162, 184, 0.1);
          color: #17a2b8;
          border: 1px solid rgba(23, 162, 184, 0.2);
        }

        .action-btn.view:hover:not(:disabled) {
          background: #17a2b8;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(23, 162, 184, 0.3);
        }

        .action-btn.accident {
          background: rgba(255, 152, 0, 0.1);
          color: #ff9800;
          border: 1px solid rgba(255, 152, 0, 0.2);
        }

        .action-btn.accident:hover:not(:disabled) {
          background: #ff9800;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
        }

        .action-btn.edit {
          background: rgba(255, 193, 7, 0.1);
          color: #ffc107;
          border: 1px solid rgba(255, 193, 7, 0.2);
        }

        .action-btn.edit:hover:not(:disabled) {
          background: #ffc107;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
        }

        .action-btn.delete {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          border: 1px solid rgba(220, 53, 69, 0.2);
        }

        .action-btn.delete:hover:not(:disabled) {
          background: #dc3545;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
        }

        /* Status Badges */
        .status-badge {
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .status-active, .status-completed, .status-confirmed {
          background: rgba(76, 175, 80, 0.1);
          color: #2e7d32;
          border: 1px solid rgba(76, 175, 80, 0.2);
        }

        .status-inactive, .status-cancelled {
          background: rgba(244, 67, 54, 0.1);
          color: #c62828;
          border: 1px solid rgba(244, 67, 54, 0.2);
        }

        .status-pending, .status-not-done {
          background: rgba(255, 152, 0, 0.1);
          color: #ef6c00;
          border: 1px solid rgba(255, 152, 0, 0.2);
        }

        .status-reserved {
          background: rgba(255, 193, 7, 0.1);
          color: #ffc107;
          border: 1px solid rgba(255, 193, 7, 0.2);
        }

        .status-late {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          border: 1px solid rgba(220, 53, 69, 0.2);
        }

        .status-icon {
          font-size: 0.7rem;
        }

        .maintenance-badge {
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

        .maintenance-badge.done {
          background: rgba(76, 175, 80, 0.1);
          color: #2e7d32;
          border: 1px solid rgba(76, 175, 80, 0.2);
        }

        .maintenance-badge.not-done {
          background: rgba(244, 67, 54, 0.1);
          color: #c62828;
          border: 1px solid rgba(244, 67, 54, 0.2);
        }

        .badge-icon {
          font-size: 0.75rem;
        }

        /* Alert Badges */
        .alert-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .alert-badge.high {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          border: 1px solid rgba(220, 53, 69, 0.2);
        }

        .alert-badge.medium {
          background: rgba(255, 193, 7, 0.1);
          color: #ffc107;
          border: 1px solid rgba(255, 193, 7, 0.2);
        }

        /* Empty State */
        .no-data {
          text-align: center;
          padding: 4rem 2rem;
          color: #6c757d;
        }

        .no-data svg {
          margin-bottom: 1.5rem;
          opacity: 0.3;
          color: #667eea;
        }

        .no-data p {
          font-size: 1.1rem;
          color: #495057;
          margin: 0 0 2rem 0;
        }

        /* Pagination Styles */
        .pagination-container {
          padding: 2rem;
          border-top: 1px solid #f1f3f4;
          display: flex;
          justify-content: center;
        }

        .pagination {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1rem;
          border: 2px solid #e9ecef;
          background: white;
          color: #6c757d;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 44px;
          height: 44px;
        }

        .pagination-btn.main {
          min-width: 44px;
          height: 44px;
        }

        .pagination-btn.details {
          min-width: 36px;
          height: 36px;
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
        }

        .pagination-btn:hover:not(.disabled):not(.active) {
          border-color: #667eea;
          color: #667eea;
          transform: translateY(-2px);
        }

        .pagination-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .pagination-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .pagination-ellipsis {
          padding: 0.75rem 0.5rem;
          color: #6c757d;
          font-weight: 600;
        }

        .pagination-ellipsis.details {
          padding: 0.5rem 0.25rem;
          font-size: 0.75rem;
        }

        /* Matricule Details Modal - Updated Styles */
        .details-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
          backdrop-filter: blur(5px);
        }

        .details-modal {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 1200px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
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

        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 2rem;
          border-bottom: 1px solid #f1f3f4;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .matricule-header-info {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .matricule-avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .matricule-info h2 {
          margin: 0 0 0.5rem 0;
          color: #1a1a1a;
          font-size: 1.5rem;
        }

        .matricule-contact {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          color: #6c757d;
          font-size: 0.9rem;
        }

        .matricule-contact div {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .close-details-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #6c757d;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .close-details-btn:hover {
          background: #f8f9fa;
          color: #dc3545;
        }

        .details-content {
          padding: 2rem;
        }

        .details-section {
          margin-bottom: 2rem;
        }

        .details-section .section-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.25rem;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 1.5rem;
          background: none;
          -webkit-text-fill-color: #2c3e50;
        }

        /* Information Grid */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .info-item label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-item div {
          font-size: 0.9rem;
          color: #495057;
          font-weight: 500;
        }

        /* Maintenance Alerts Section */
        .maintenance-alerts-section {
          margin-bottom: 2rem;
        }

        .alerts-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 1rem;
        }

        .alerts-icon {
          color: #dc3545;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .alert-item {
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .alert-item.high {
          background: rgba(220, 53, 69, 0.05);
          border-left: 4px solid #dc3545;
        }

        .alert-item.medium {
          background: rgba(255, 193, 7, 0.05);
          border-left: 4px solid #ffc107;
        }

        .alert-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .alert-message {
          font-weight: 500;
          color: #495057;
          flex: 1;
        }

        .alert-details {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.8rem;
          color: #6c757d;
        }

        .alert-details span {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        /* Maintenance Section */
        .maintenance-section {
          margin-bottom: 2rem;
        }

        .maintenance-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 1rem;
        }

        .maintenance-icon {
          color: #ff9800;
        }

        .maintenance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .maintenance-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .maintenance-item:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transform: translateY(-1px);
        }

        .maintenance-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #495057;
          font-weight: 500;
        }

        .maintenance-item-icon {
          color: #667eea;
          font-size: 0.875rem;
        }

        /* Additional Maintenance Section */
        .additional-maintenance-section,
        .periodic-maintenance-section {
          margin-bottom: 2rem;
        }

        .maintenance-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .maintenance-detail-item {
          padding: 1.25rem;
          border-radius: 10px;
          border: 1px solid #e9ecef;
          background: white;
          transition: all 0.3s ease;
        }

        .maintenance-detail-item.overdue {
          border-left: 4px solid #dc3545;
          background: rgba(220, 53, 69, 0.03);
        }

        .maintenance-detail-item.attention {
          border-left: 4px solid #ffc107;
          background: rgba(255, 193, 7, 0.03);
        }

        .maintenance-detail-item.normal {
          border-left: 4px solid #28a745;
          background: rgba(40, 167, 69, 0.03);
        }

        .maintenance-detail-item:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .maintenance-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .maintenance-detail-name {
          font-weight: 600;
          color: #2c3e50;
          font-size: 1rem;
        }

        .maintenance-detail-status {
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

        .maintenance-detail-status.overdue {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          border: 1px solid rgba(220, 53, 69, 0.2);
        }

        .maintenance-detail-status.attention {
          background: rgba(255, 193, 7, 0.1);
          color: #ffc107;
          border: 1px solid rgba(255, 193, 7, 0.2);
        }

        .maintenance-detail-status.normal {
          background: rgba(40, 167, 69, 0.1);
          color: #28a745;
          border: 1px solid rgba(40, 167, 69, 0.2);
        }

        .maintenance-detail-info {
          margin-bottom: 0.75rem;
        }

        .km-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6c757d;
          margin-bottom: 0.75rem;
        }

        .km-info span {
          display: flex;
          justify-content: space-between;
        }

        .km-info strong {
          color: #2c3e50;
        }

        .maintenance-alert,
        .maintenance-warning {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .maintenance-alert {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          border: 1px solid rgba(220, 53, 69, 0.2);
        }

        .maintenance-warning {
          background: rgba(255, 193, 7, 0.1);
          color: #ffc107;
          border: 1px solid rgba(255, 193, 7, 0.2);
        }

        .maintenance-detail-description {
          padding-top: 0.75rem;
          border-top: 1px dashed #e9ecef;
          font-size: 0.8rem;
          color: #6c757d;
        }

        .no-maintenance-data {
          text-align: center;
          padding: 2rem;
          color: #6c757d;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px dashed #e9ecef;
        }

        .no-maintenance-data svg {
          margin-bottom: 1rem;
          opacity: 0.3;
        }

        .no-maintenance-data p {
          margin: 0;
          font-size: 0.9rem;
        }

        /* Inactive Reason Display in Details */
        .inactive-reason-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid rgba(220, 53, 69, 0.2);
          border-radius: 8px;
          margin-top: 1rem;
          font-size: 0.875rem;
          color: #dc3545;
        }

        .inactive-reason-display .reason-icon {
          color: #dc3545;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        .reason-content {
          flex: 1;
        }

        /* Items Grid for Reservations and Accidents */
        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .item-card {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }

        .item-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }

        .accident-card {
          border-left: 4px solid #dc3545;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .item-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: #2c3e50;
          font-size: 1rem;
        }

        .item-icon {
          font-size: 1rem;
        }

        .item-icon.accident {
          color: #dc3545;
        }

        .accident-date {
          font-size: 0.875rem;
          color: #6c757d;
          font-weight: 500;
        }

        .item-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .item-detail {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6c757d;
        }

        .detail-icon {
          font-size: 0.875rem;
          color: #667eea;
          width: 16px;
        }

        .item-id {
          font-size: 0.75rem;
          color: #6c757d;
          text-align: right;
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .no-items {
          text-align: center;
          padding: 3rem 2rem;
          color: #6c757d;
        }

        .no-items svg {
          margin-bottom: 1rem;
          opacity: 0.3;
        }

        .no-items p {
          margin: 0;
          font-size: 1rem;
        }

        .details-pagination {
          display: flex;
          justify-content: center;
          margin-top: 1rem;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .matricules-management {
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

          .search-filter-section {
            flex-direction: column;
            align-items: stretch;
          }

          .search-box {
            min-width: auto;
          }

          .filter-group {
            justify-content: space-between;
          }

          .filter-item {
            flex: 1;
          }

          .filter-select {
            min-width: auto;
          }

          .results-summary {
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
          }

          .content-container {
            overflow-x: auto;
          }

          .data-table {
            min-width: 800px;
          }

          .action-buttons {
            flex-direction: row;
            gap: 0.25rem;
          }

          .pagination {
            flex-wrap: wrap;
            justify-content: center;
          }

          .details-modal {
            margin: 1rem;
            max-height: 95vh;
          }

          .details-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .matricule-header-info {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .maintenance-grid {
            grid-template-columns: 1fr;
          }

          .maintenance-details-grid {
            grid-template-columns: 1fr;
          }

          .items-grid {
            grid-template-columns: 1fr;
          }
        }
          /* Inactive Reason Tooltip - Hide by default, show on hover */
.status-badge-container {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

.inactive-reason-wrapper {
  position: relative;
  display: inline-flex;
}

.reason-icon-hover {
  color: #6c757d;
  font-size: 12px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.reason-icon-hover:hover {
  opacity: 1;
  color: #dc3545;
}

.inactive-reason-tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 250px;
  max-width: 300px;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.inactive-reason-wrapper:hover .inactive-reason-tooltip {
  opacity: 1;
  visibility: visible;
  margin-top: 4px;
}

.inactive-reason-tooltip::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 12px;
  height: 12px;
  background: white;
  border-left: 1px solid #e9ecef;
  border-top: 1px solid #e9ecef;
}

.tooltip-content {
  font-size: 0.875rem;
  line-height: 1.4;
  color: #495057;
}

.tooltip-content strong {
  color: #2c3e50;
  display: block;
  margin-bottom: 4px;
}

.reason-details {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e9ecef;
  font-size: 0.8rem;
  color: #6c757d;
}

/* For the details modal, keep the inline display */
.inactive-reason-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.2);
  border-radius: 8px;
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #dc3545;
}

.inactive-reason-display .reason-icon {
  color: #dc3545;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.reason-content {
  flex: 1;
}
  /* Modal Accident Styles - Mis à jour pour correspondre au style AdminModal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
  backdrop-filter: blur(5px);
  animation: overlayFadeIn 0.3s ease-out;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 12px 12px 0 0;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.3rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.modal-icon {
  color: #dc2626;
  font-size: 1.3rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.modal-close:hover {
  color: #dc2626;
  background: #f9fafb;
}

.modal-body {
  padding: 2rem;
}

/* Form Styles alignés avec AdminModal */
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-group label::after {
  content: ' *';
  color: #dc2626;
  font-weight: bold;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
  font-family: inherit;
  color: #495057;
}

.form-input:focus {
  outline: none;
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.form-input:disabled {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
  border-color: #e5e7eb;
}

.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
  font-family: inherit;
  color: #495057;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 12px 12px;
  padding-right: 2.5rem;
}

.form-select:focus {
  outline: none;
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23dc2626' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.form-help-text {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.5rem;
  line-height: 1.4;
  font-style: italic;
}

.form-help-text strong {
  color: #374151;
}

/* Notification Styles */
.form-notification {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  border-left: 4px solid #f97316;
}

.notification-warning {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: #ea580c;
  font-size: 0.875rem;
  line-height: 1.5;
}

.notification-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
  color: #f97316;
}

.notification-warning strong {
  color: #c2410c;
}

.notification-warning span {
  flex: 1;
}

/* Client Selector Options */
.form-select option {
  padding: 0.75rem;
  background: white;
  color: #374151;
}

.form-select option:disabled {
  color: #9ca3af;
  font-style: italic;
}

.form-select option[value=""] {
  color: #9ca3af;
  font-style: italic;
}

/* Number Input Styles */
input[type="number"].form-input {
  -moz-appearance: textfield;
}

input[type="number"].form-input::-webkit-outer-spin-button,
input[type="number"].form-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Date Input Styles */
input[type="date"].form-input {
  color: #374151;
  position: relative;
}

input[type="date"].form-input::-webkit-calendar-picker-indicator {
  position: absolute;
  right: 1rem;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.3s ease;
  width: 20px;
  height: 20px;
}

input[type="date"].form-input::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
  color: #dc2626;
}

/* Modal Actions - aligné avec AdminModal */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem 2rem 2rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}



.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
}

/* Loading Animation */
.spinning {
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-content {
    margin: 1rem;
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 1.25rem 1.5rem;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.5rem;
  }
  
  .btn {
    min-width: 100%;
    width: 100%;
  }
  
  .modal-title {
    font-size: 1.2rem;
  }
  
  .modal-icon {
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .modal-content {
    margin: 0.5rem;
  }
  
  .modal-header {
    padding: 1rem 1.25rem;
  }
  
  .modal-body {
    padding: 1.25rem;
  }
  
  .form-input,
  .form-select {
    padding: 0.625rem 0.875rem;
  }
}

/* Scrollbar Styles */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Optional: Required Field Indicator */
.required-field::before {
  content: '*';
  color: #dc2626;
  margin-right: 0.25rem;
}

/* Optional: Client info display */
.client-info-display {
  background: #f3f4f6;
  padding: 0.75rem;
  border-radius: 6px;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
}

.client-info-display strong {
  color: #1f2937;
}

/* Optional: Status preview */
.status-preview {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-left: 0.5rem;
}

.status-preview.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-preview.confirmed {
  background: #dcfce7;
  color: #166534;
}

/* Optional: Disabled state styling */
.form-input:read-only {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.form-input:read-only:focus {
  border-color: #e5e7eb;
  box-shadow: none;
}

/* Optional: Error state for empty clients */
.client-select-error {
  border-color: #dc2626;
  background: #fef2f2;
}

.client-select-error:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.client-error-message {
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
      `}</style>
    </div>
  );
};

export default MatriculesManagement;