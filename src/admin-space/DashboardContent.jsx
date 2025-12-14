import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FaCar, FaUsers, FaCalendarAlt, FaEnvelope, FaFileExport,
  FaDatabase, FaDollarSign, FaMapMarkerAlt, FaBell, FaExclamationTriangle,
  FaExclamationCircle, FaIdCard, FaChartPie, FaClock, FaArrowLeft,
  FaTrophy, FaStar, FaChartLine, FaCheck, FaBan, FaWrench,
  FaMoneyBill, FaShieldAlt, FaOilCan, FaTools, FaRoad, FaSyncAlt
} from 'react-icons/fa';
import {
  fetchCars,
  fetchClients,
  fetchReservations,
  fetchContacts,
  fetchAccidents,
  fetchMatricules,
  selectCars,
  selectClients,
  selectReservations,
  selectContacts,
  selectAccidents,
  selectMatricules,
  selectCarsLoading,
  selectClientsLoading,
  selectReservationsLoading,
  selectContactsLoading,
  selectAccidentsLoading,
  selectMatriculesLoading,
  selectReservedMatricules,
  selectLateMatricules
} from '../Redux/store';

// Import des composants de gestion
import CarsManagement from './CarsManagement';
import ClientsManagement from './ClientsManagement';
import ReservationsManagement from './ReservationsManagement';
import AccidentsManagement from './AccidentsManagement';
import MatriculesManagement from './MatriculesManagement';
import ContactsManagement from './ContactsManagement';

const DashboardContent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentTitle, setCurrentTitle] = useState('Aperçu du Tableau de Bord');
  const [reservationFilter, setReservationFilter] = useState(null);
  
  const cars = useSelector(selectCars);
  const clients = useSelector(selectClients);
  const reservations = useSelector(selectReservations);
  const contacts = useSelector(selectContacts);
  const accidents = useSelector(selectAccidents);
  const matricules = useSelector(selectMatricules);
  const reservedMatricules = useSelector(selectReservedMatricules);
  const lateMatricules = useSelector(selectLateMatricules);
  
  const carsLoading = useSelector(selectCarsLoading);
  const clientsLoading = useSelector(selectClientsLoading);
  const reservationsLoading = useSelector(selectReservationsLoading);
  const contactsLoading = useSelector(selectContactsLoading);
  const accidentsLoading = useSelector(selectAccidentsLoading);
  const matriculesLoading = useSelector(selectMatriculesLoading);

  const [periodicKmNotifications, setPeriodicKmNotifications] = useState([]);

  // Gestionnaires de navigation pour les cartes cliquables
  const handleNavigation = (view, title, filter = null) => {
    setCurrentView(view);
    setCurrentTitle(title);
    setReservationFilter(filter);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentTitle('Aperçu du Tableau de Bord');
    setReservationFilter(null);
  };

  // Fonction pour vérifier les kilométrages périodiques nécessitant attention
  const checkPeriodicKmMaintenance = () => {
    if (!matricules || matricules.length === 0) return [];

    const periodicNotifications = [];

    matricules.forEach(matricule => {
      if (!matricule.periodic_km_maintenance || !Array.isArray(matricule.periodic_km_maintenance)) return;

      const currentKm = matricule.kilometrage || 0;
      
      matricule.periodic_km_maintenance.forEach(item => {
        if (item.needs_attention && currentKm >= item.next_change_km) {
          const kmOverdue = currentKm - item.next_change_km;
          
          periodicNotifications.push({
            id: `periodic_km_${matricule.id}_${item.id}`,
            type: 'periodic_km',
            subType: 'urgent',
            message: `Maintenance Kilométrique Périodique: ${item.name} pour ${matricule.matricule_code} est en retard de ${kmOverdue} km`,
            matriculeCode: matricule.matricule_code,
            itemName: item.name,
            kmOverdue: kmOverdue,
            currentKm: currentKm,
            nextChangeKm: item.next_change_km,
            timestamp: new Date().toISOString(),
            matriculeId: matricule.id,
            itemId: item.id
          });
        } else if (currentKm >= item.next_change_km - 1000 && currentKm < item.next_change_km) {
          // Notifications préventives (dans les 1000 km avant)
          const kmRemaining = item.next_change_km - currentKm;
          
          periodicNotifications.push({
            id: `periodic_km_warning_${matricule.id}_${item.id}`,
            type: 'periodic_km',
            subType: 'warning',
            message: `Maintenance Kilométrique Périodique: ${item.name} pour ${matricule.matricule_code} dans ${kmRemaining} km`,
            matriculeCode: matricule.matricule_code,
            itemName: item.name,
            kmRemaining: kmRemaining,
            currentKm: currentKm,
            nextChangeKm: item.next_change_km,
            timestamp: new Date().toISOString(),
            matriculeId: matricule.id,
            itemId: item.id
          });
        }
      });
    });

    return periodicNotifications;
  };

  // Fonction pour vérifier les vidanges nécessaires basées sur le kilométrage
  const checkMaintenanceNeeded = () => {
    if (!matricules || matricules.length === 0) return [];

    const maintenanceNotifications = [];

    matricules.forEach(matricule => {
      const currentKm = matricule.kilometrage || 0;
      
      // Vérifier la vidange (basé sur le kilométrage)
      const maintenanceInterval = 10000; // 10,000 km pour la vidange
      const kmSinceLastReset = currentKm % maintenanceInterval;
      const kmRemaining = maintenanceInterval - kmSinceLastReset;

      // Vérifier si la vidange est nécessaire (dans les 1000 km ou dépassé)
      if (kmRemaining <= 1000) {
        const carInfo = matricule.car 
          ? `${matricule.car.brand} ${matricule.car.model}`
          : 'Voiture Inconnue';

        let message = '';
        let type = 'warning';

        if (kmRemaining <= 0) {
          const kmOverdue = Math.abs(kmRemaining);
          message = `Vidange nécessaire pour ${matricule.matricule_code} (${carInfo}) : DÉPASSÉ de ${kmOverdue} km`;
          type = 'urgent';
        } else if (kmRemaining <= 500) {
          message = `Vidange nécessaire pour ${matricule.matricule_code} (${carInfo}) : dans ${kmRemaining} km (URGENT)`;
          type = 'urgent';
        } else {
          message = `Vidange nécessaire pour ${matricule.matricule_code} (${carInfo}) : dans ${kmRemaining} km`;
        }

        // Vérifier aussi le statut de vidange actuel
        if (matricule.vidange_status === 'not done') {
          maintenanceNotifications.push({
            id: `maintenance_${matricule.id}_${kmRemaining}`,
            type: 'maintenance',
            subType: type,
            message: message,
            kmRemaining: kmRemaining,
            currentKm: currentKm,
            timestamp: new Date().toISOString(),
            matriculeId: matricule.id,
            matriculeCode: matricule.matricule_code,
            vidangeStatus: matricule.vidange_status
          });
        }
      }

      // Vérifier les éléments de maintenance additionnelle nécessitant attention
      if (matricule.additional_maintenance && Array.isArray(matricule.additional_maintenance)) {
        matricule.additional_maintenance.forEach(item => {
          if (item.needs_attention) {
            maintenanceNotifications.push({
              id: `additional_${matricule.id}_${item.id}`,
              type: 'additional_maintenance',
              subType: 'warning',
              message: `Maintenance Additionnelle: ${item.name} pour ${matricule.matricule_code} nécessite attention`,
              matriculeCode: matricule.matricule_code,
              itemName: item.name,
              timestamp: new Date().toISOString(),
              matriculeId: matricule.id,
              itemId: item.id
            });
          }
        });
      }
    });

    return maintenanceNotifications;
  };

  // Fonction pour vérifier les fins de réservation à venir
  const checkUpcomingReservations = () => {
    if (!reservations || reservations.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingNotifications = [];

    reservations.forEach(reservation => {
      if (reservation.status !== 'confirmed' && reservation.status !== 'pending') return;

      const endDate = new Date(reservation.end_date);
      endDate.setHours(0, 0, 0, 0);
      
      const timeDiff = endDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysDiff <= 2) { // Afficher pour les 2 jours à venir ET les dates passées
        const clientName = reservation.client?.nom 
          ? `${reservation.client.nom} ${reservation.client.prenom || ''}`
          : reservation.client?.fullname || 'Client Inconnu';
        
        const carInfo = reservation.car 
          ? `${reservation.car.brand} ${reservation.car.model}`
          : 'Voiture Inconnue';

        let message = '';
        let type = 'warning';

        if (daysDiff === 0) {
          message = `se termine AUJOURD'HUI`;
          type = 'urgent';
        } else if (daysDiff === 1) {
          message = `se termine dans 1 jour`;
        } else if (daysDiff === 2) {
          message = `se termine dans 2 jours`;
        } else if (daysDiff < 0) {
          message = `en retard de ${Math.abs(daysDiff)} jour${Math.abs(daysDiff) !== 1 ? 's' : ''}`;
          type = 'urgent';
        }

        upcomingNotifications.push({
          id: `reservation-${reservation.id}-${daysDiff}`,
          type: 'reservation',
          subType: type,
          message: `Réservation #${reservation.id} (${carInfo} - ${clientName}) ${message}`,
          daysRemaining: daysDiff,
          endDate: reservation.end_date,
          timestamp: new Date().toISOString(),
          reservationId: reservation.id
        });
      }
    });

    return upcomingNotifications;
  };

  // Fonction pour vérifier les accidents avec statut d'attente
  const checkWaitingAccidents = () => {
    if (!accidents || accidents.length === 0) return [];

    const waitingNotifications = [];

    accidents.forEach(accident => {
      if (accident.status === 'waiting') {
        const carInfo = accident.car 
          ? `${accident.car.brand} ${accident.car.model}`
          : 'Voiture Inconnue';

        const clientName = accident.client?.nom 
          ? `${accident.client.nom} ${accident.client.prenom || ''}`
          : accident.client?.fullname || 'Client Inconnue';

        waitingNotifications.push({
          id: `accident-${accident.id}`,
          type: 'accident',
          subType: 'waiting',
          message: `Accident #${accident.id} (${carInfo} - ${clientName}) En attente de paiement`,
          accidentDate: accident.date_accident,
          timestamp: new Date().toISOString(),
          accidentId: accident.id
        });
      }
    });

    return waitingNotifications;
  };

  // Fonction pour vérifier les visites techniques à venir
  const checkUpcomingTechnicalVisits = () => {
    if (!matricules || matricules.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const visitNotifications = [];

    matricules.forEach(matricule => {
      if (!matricule.visit_tech) return;

      const visitDate = new Date(matricule.visit_tech);
      visitDate.setHours(0, 0, 0, 0);
      
      const timeDiff = visitDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // Afficher une notification si la visite technique est dans les 30 jours ou est passée
      if (daysDiff <= 30) {
        const carInfo = matricule.car 
          ? `${matricule.car.brand} ${matricule.car.model}`
          : 'Voiture Inconnue';

        let message = '';
        let type = 'warning';

        if (daysDiff === 0) {
          message = `AUJOURD'HUI`;
          type = 'urgent';
        } else if (daysDiff < 0) {
          message = `EN RETARD de ${Math.abs(daysDiff)} jour${Math.abs(daysDiff) !== 1 ? 's' : ''}`;
          type = 'urgent';
        } else if (daysDiff <= 7) {
          message = `dans ${daysDiff} jour${daysDiff !== 1 ? 's' : ''}`;
          type = 'urgent';
        } else if (daysDiff <= 14) {
          message = `dans ${daysDiff} jours`;
          type = 'warning';
        } else {
          message = `dans ${daysDiff} jours`;
        }

        visitNotifications.push({
          id: `visit-${matricule.id}-${daysDiff}`,
          type: 'technical_visit',
          subType: type,
          message: `Visite technique pour ${matricule.matricule_code} (${carInfo}) ${message}`,
          daysRemaining: daysDiff,
          visitDate: matricule.visit_tech,
          timestamp: new Date().toISOString(),
          matriculeId: matricule.id,
          matriculeCode: matricule.matricule_code
        });
      }
    });

    return visitNotifications;
  };

  // Fonction pour vérifier les dates de taxe de voiture à venir
  const checkUpcomingCarTax = () => {
    if (!matricules || matricules.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const taxNotifications = [];

    matricules.forEach(matricule => {
      if (!matricule.date_taxe_voiture) return;

      const taxDate = new Date(matricule.date_taxe_voiture);
      taxDate.setHours(0, 0, 0, 0);
      
      const timeDiff = taxDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // Afficher une notification si la taxe est dans les 30 jours ou est passée
      if (daysDiff <= 30) {
        const carInfo = matricule.car 
          ? `${matricule.car.brand} ${matricule.car.model}`
          : 'Voiture Inconnue';

        let message = '';
        let type = 'warning';

        if (daysDiff === 0) {
          message = `AUJOURD'HUI`;
          type = 'urgent';
        } else if (daysDiff < 0) {
          message = `EN RETARD de ${Math.abs(daysDiff)} jour${Math.abs(daysDiff) !== 1 ? 's' : ''}`;
          type = 'urgent';
        } else if (daysDiff <= 7) {
          message = `dans ${daysDiff} jour${daysDiff !== 1 ? 's' : ''}`;
          type = 'urgent';
        } else if (daysDiff <= 14) {
          message = `dans ${daysDiff} jours`;
          type = 'warning';
        } else {
          message = `dans ${daysDiff} jours`;
        }

        taxNotifications.push({
          id: `tax-${matricule.id}-${daysDiff}`,
          type: 'car_tax',
          subType: type,
          message: `Taxe de voiture pour ${matricule.matricule_code} (${carInfo}) ${message}`,
          daysRemaining: daysDiff,
          taxDate: matricule.date_taxe_voiture,
          timestamp: new Date().toISOString(),
          matriculeId: matricule.id,
          matriculeCode: matricule.matricule_code
        });
      }
    });

    return taxNotifications;
  };

  // Fonction pour vérifier les dates d'assurance à venir
  const checkUpcomingInsurance = () => {
    if (!matricules || matricules.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const insuranceNotifications = [];

    matricules.forEach(matricule => {
      if (!matricule.date_assurance) return;

      const insuranceDate = new Date(matricule.date_assurance);
      insuranceDate.setHours(0, 0, 0, 0);
      
      const timeDiff = insuranceDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // Afficher une notification si l'assurance est dans les 30 jours ou est passée
      if (daysDiff <= 30) {
        const carInfo = matricule.car 
          ? `${matricule.car.brand} ${matricule.car.model}`
          : 'Voiture Inconnue';

        let message = '';
        let type = 'warning';

        if (daysDiff === 0) {
          message = `AUJOURD'HUI`;
          type = 'urgent';
        } else if (daysDiff < 0) {
          message = `EN RETARD de ${Math.abs(daysDiff)} jour${Math.abs(daysDiff) !== 1 ? 's' : ''}`;
          type = 'urgent';
        } else if (daysDiff <= 7) {
          message = `dans ${daysDiff} jour${daysDiff !== 1 ? 's' : ''}`;
          type = 'urgent';
        } else if (daysDiff <= 14) {
          message = `dans ${daysDiff} jours`;
          type = 'warning';
        } else {
          message = `dans ${daysDiff} jours`;
        }

        insuranceNotifications.push({
          id: `insurance-${matricule.id}-${daysDiff}`,
          type: 'insurance',
          subType: type,
          message: `Assurance pour ${matricule.matricule_code} (${carInfo}) ${message}`,
          daysRemaining: daysDiff,
          insuranceDate: matricule.date_assurance,
          timestamp: new Date().toISOString(),
          matriculeId: matricule.id,
          matriculeCode: matricule.matricule_code
        });
      }
    });

    return insuranceNotifications;
  };

  // Calculer les réservations en retard
  const calculateOverdueReservations = () => {
    if (!reservations || reservations.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return reservations.filter(reservation => {
      if (reservation.status !== 'confirmed' && reservation.status !== 'retard') return false;
      
      const endDate = new Date(reservation.end_date);
      endDate.setHours(0, 0, 0, 0);
      
      return endDate < today;
    });
  };

  // Fonction pour obtenir les voitures les plus louées
  const getMostRentedCars = () => {
    if (!reservations.length || !cars.length) return [];

    // Compter les réservations pour chaque voiture (seulement les statuts confirmé, terminé et retard)
    const carReservationCount = {};
    
    reservations.forEach(reservation => {
      if (['confirmed', 'completed', 'retard'].includes(reservation.status)) {
        const carId = reservation.car_id;
        carReservationCount[carId] = (carReservationCount[carId] || 0) + 1;
      }
    });

    // Créer un tableau de voitures avec le nombre de réservations
    const carsWithCounts = cars.map(car => ({
      ...car,
      reservationCount: carReservationCount[car.id] || 0
    }));

    // Trier par nombre de réservations (décroissant) et prendre les 5 premiers
    return carsWithCounts
      .sort((a, b) => b.reservationCount - a.reservationCount)
      .slice(0, 5);
  };

  useEffect(() => {
    dispatch(fetchCars());
    dispatch(fetchClients());
    dispatch(fetchReservations());
    dispatch(fetchContacts());
    dispatch(fetchAccidents());
    dispatch(fetchMatricules());
  }, [dispatch]);

  // Mettre à jour les notifications quand les réservations, accidents ou matricules changent
  useEffect(() => {
    const reservationNotifications = checkUpcomingReservations();
    const accidentNotifications = checkWaitingAccidents();
    const visitNotifications = checkUpcomingTechnicalVisits();
    const taxNotifications = checkUpcomingCarTax();
    const insuranceNotifications = checkUpcomingInsurance();
    const maintenanceNotifications = checkMaintenanceNeeded();
    const periodicKmNotifications = checkPeriodicKmMaintenance();
    
    const allNotifications = [
      ...reservationNotifications, 
      ...accidentNotifications, 
      ...visitNotifications,
      ...taxNotifications,
      ...insuranceNotifications,
      ...maintenanceNotifications,
      ...periodicKmNotifications
    ];
    
    const sortedNotifications = allNotifications.sort((a, b) => {
      // Prioriser les notifications urgentes en premier
      if (a.subType === 'urgent' && b.subType !== 'urgent') return -1;
      if (b.subType === 'urgent' && a.subType !== 'urgent') return 1;
      
      // Puis trier par jours restants (négatifs d'abord, puis croissant)
      if (a.daysRemaining !== undefined && b.daysRemaining !== undefined) {
        // Les valeurs négatives (retard) viennent en premier
        if (a.daysRemaining < 0 && b.daysRemaining >= 0) return -1;
        if (b.daysRemaining < 0 && a.daysRemaining >= 0) return 1;
        // Puis trier par valeur absolue croissante
        return Math.abs(a.daysRemaining) - Math.abs(b.daysRemaining);
      }
      // Pour les km restants (maintenance)
      if (a.kmRemaining !== undefined && b.kmRemaining !== undefined) {
        // Les valeurs négatives (dépassé) viennent en premier
        if (a.kmRemaining < 0 && b.kmRemaining >= 0) return -1;
        if (b.kmRemaining < 0 && a.kmRemaining >= 0) return 1;
        // Puis trier par valeur absolue croissante
        return Math.abs(a.kmRemaining) - Math.abs(b.kmRemaining);
      }
      
      return 0;
    });

    setNotifications(sortedNotifications);
  }, [reservations, accidents, matricules]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      disponible: { class: 'status-available', text: 'Disponible' },
      'non disponible': { class: 'status-unavailable', text: 'Indisponible' },
      pending: { class: 'status-pending', text: 'En Attente' },
      confirmed: { class: 'status-confirmed', text: 'Confirmée' },
      completed: { class: 'status-completed', text: 'Terminée' },
      cancelled: { class: 'status-cancelled', text: 'Annulée' },
      contacted: { class: 'status-contacted', text: 'Contacté' },
      waiting: { class: 'status-waiting', text: 'En Attente' },
      evaluation_owner: { class: 'status-evaluation-owner', text: 'Évaluation Propriétaire' },
      'contact expert': { class: 'status-contact-expert', text: 'Contact Expert' },
      evaluation_expert: { class: 'status-evaluation-expert', text: 'Évaluation Expert' },
      fixed: { class: 'status-fixed', text: 'Réparé' },
      retard: { class: 'status-retard', text: 'En Retard' }
    };

    const config = statusConfig[status] || { class: 'status-pending', text: status };
    
    return (
      <span className={`status-badge ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const getNotificationIcon = (type, subType) => {
    switch (type) {
      case 'accident':
        return <FaExclamationCircle />;
      case 'technical_visit':
        return <FaWrench />;
      case 'car_tax':
        return <FaMoneyBill />;
      case 'insurance':
        return <FaShieldAlt />;
      case 'maintenance':
        return <FaOilCan />;
      case 'additional_maintenance':
        return <FaTools />;
      case 'periodic_km':
        return <FaRoad />;
      case 'reservation':
        if (subType === 'urgent') {
          return <FaExclamationTriangle />;
        }
        return <FaCalendarAlt />;
      default:
        return <FaBell />;
    }
  };

  const handleExport = (type, data, filename) => {
    if (!data || data.length === 0) {
      alert('Aucune donnée à exporter !');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
          }
          return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const calculateDaysLeft = (endDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    const timeDiff = end.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  // Calcul des statistiques
  const overdueReservations = calculateOverdueReservations();
  const pendingReservations = reservations.filter(r => r.status === 'pending');
  const confirmedReservations = reservations.filter(r => r.status === 'confirmed');
  const completedReservations = reservations.filter(r => r.status === 'completed');
  const cancelledReservations = reservations.filter(r => r.status === 'cancelled');
  const contactedReservations = reservations.filter(r => r.status === 'contacted');

  const availableCars = cars.filter(c => c.status === 'disponible');
  const unavailableCars = cars.filter(c => c.status === 'non disponible');

  const activeMatricules = matricules.filter(m => m.status === 'active');
  const inactiveMatricules = matricules.filter(m => m.status === 'inactive');

  // Compter les notifications par type pour la carte de statistiques
  const reservationNotificationsCount = notifications.filter(n => n.type === 'reservation').length;
  const accidentNotificationsCount = notifications.filter(n => n.type === 'accident').length;
  const visitNotificationsCount = notifications.filter(n => n.type === 'technical_visit').length;
  const taxNotificationsCount = notifications.filter(n => n.type === 'car_tax').length;
  const insuranceNotificationsCount = notifications.filter(n => n.type === 'insurance').length;
  const maintenanceNotificationsCount = notifications.filter(n => n.type === 'maintenance').length;
  const additionalMaintenanceNotificationsCount = notifications.filter(n => n.type === 'additional_maintenance').length;
  const periodicKmNotificationsCount = notifications.filter(n => n.type === 'periodic_km').length;
  const totalNotificationsCount = notifications.length;

  const isLoading = carsLoading || clientsLoading || reservationsLoading || 
                   contactsLoading || accidentsLoading || matriculesLoading;

  // Rendu des composants de gestion basés sur la vue actuelle
  const renderCurrentView = () => {
    switch (currentView) {
      case 'cars':
        return <CarsManagement onBack={handleBackToDashboard} />;
      case 'clients':
        return <ClientsManagement onBack={handleBackToDashboard} />;
      case 'reservations':
        return <ReservationsManagement onBack={handleBackToDashboard} filter={reservationFilter} />;
      case 'accidents':
        return <AccidentsManagement onBack={handleBackToDashboard} />;
      case 'matricules':
        return <MatriculesManagement onBack={handleBackToDashboard} filter={reservationFilter} />;
      case 'contacts':
        return <ContactsManagement onBack={handleBackToDashboard} />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => {
    if (isLoading) {
      return (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement des données du tableau de bord...</p>
        </div>
      );
    }

    const mostRentedCars = getMostRentedCars();

    return (
      <>
        {/* Cloche de notifications */}
        <div className="notifications-container">
          <button 
            className={`notifications-bell ${totalNotificationsCount > 0 ? 'has-notifications' : ''}`}
            onClick={toggleNotifications}
          >
            <FaBell />
            {totalNotificationsCount > 0 && (
              <span className="notification-count">{totalNotificationsCount}</span>
            )}
          </button>

          {/* Menu déroulant des notifications */}
          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h4>Notifications</h4>
                {totalNotificationsCount > 0 && (
                  <button 
                    className="clear-all-btn"
                    onClick={clearAllNotifications}
                  >
                    Tout effacer
                  </button>
                )}
              </div>
              
              <div className="notifications-list">
                {totalNotificationsCount > 0 ? (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${notification.subType} ${notification.type}`}
                    >
                      <div className="notification-icon">
                        {getNotificationIcon(notification.type, notification.subType)}
                      </div>
                      <div className="notification-content">
                        <p className="notification-message">{notification.message}</p>
                        <small className="notification-date">
                          {notification.type === 'reservation' && (
                            <>Date de fin : {new Date(notification.endDate).toLocaleDateString('fr-FR')}</>
                          )}
                          {notification.type === 'accident' && (
                            <>Date de l'accident : {new Date(notification.accidentDate).toLocaleDateString('fr-FR')}</>
                          )}
                          {notification.type === 'technical_visit' && (
                            <>Date de visite : {new Date(notification.visitDate).toLocaleDateString('fr-FR')} | {notification.daysRemaining < 0 ? 'EN RETARD' : 'Échéance'}</>
                          )}
                          {notification.type === 'car_tax' && (
                            <>Date d'échéance : {new Date(notification.taxDate).toLocaleDateString('fr-FR')} | {notification.daysRemaining < 0 ? 'EN RETARD' : 'Échéance'}</>
                          )}
                          {notification.type === 'insurance' && (
                            <>Date d'échéance : {new Date(notification.insuranceDate).toLocaleDateString('fr-FR')} | {notification.daysRemaining < 0 ? 'EN RETARD' : 'Échéance'}</>
                          )}
                          {notification.type === 'maintenance' && (
                            <>Km actuel: {notification.currentKm} km | Statut: {notification.vidangeStatus === 'not done' ? 'Non effectuée' : 'Effectuée'}</>
                          )}
                          {notification.type === 'additional_maintenance' && (
                            <>Maintenance additionnelle nécessitant attention</>
                          )}
                          {notification.type === 'periodic_km' && (
                            notification.kmOverdue ? 
                              <>En retard de {notification.kmOverdue} km | Prochain changement: {notification.nextChangeKm} km</> :
                              <>Dans {notification.kmRemaining} km | Prochain changement: {notification.nextChangeKm} km</>
                          )}
                        </small>
                      </div>
                      <button 
                        className="notification-close"
                        onClick={() => clearNotification(notification.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="no-notifications">
                    <FaBell />
                    <p>Aucune notification</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Grille de statistiques améliorée */}
        <div className="stats-grid">
          {/* Carte Voitures */}
          <div 
            className="stat-card clickable" 
            onClick={() => handleNavigation('cars', 'Gestion des Voitures')}
          >
            <div className="stat-header">
              <div className="stat-icon">
                <FaCar className="car-icon" />
              </div>
              {totalNotificationsCount > 0 && (
                <div className="stat-alert">
                  <FaExclamationTriangle />
                </div>
              )}
            </div>
            <div className="stat-content">
              <div className="stat-title">Total Voitures</div>
              <div className="stat-value">{cars.length}</div>
              <div className="stat-details">
                <span className="stat-detail positive">{availableCars.length} disponibles</span>
                <span className="stat-detail negative">{unavailableCars.length} indisponibles</span>
              </div>
              {totalNotificationsCount > 0 && (
                <div className="stat-notification">
                  {reservationNotificationsCount > 0 && `${reservationNotificationsCount} réservation${reservationNotificationsCount !== 1 ? 's' : ''}`}
                  {reservationNotificationsCount > 0 && accidentNotificationsCount > 0 && ', '}
                  {accidentNotificationsCount > 0 && `${accidentNotificationsCount} accident${accidentNotificationsCount !== 1 ? 's' : ''}`}
                  {visitNotificationsCount > 0 && `${visitNotificationsCount} visite${visitNotificationsCount !== 1 ? 's' : ''} technique${visitNotificationsCount !== 1 ? 's' : ''}`}
                  {taxNotificationsCount > 0 && `${taxNotificationsCount} taxe${taxNotificationsCount !== 1 ? 's' : ''}`}
                  {insuranceNotificationsCount > 0 && `${insuranceNotificationsCount} assurance${insuranceNotificationsCount !== 1 ? 's' : ''}`}
                  {maintenanceNotificationsCount > 0 && `${maintenanceNotificationsCount} vidange${maintenanceNotificationsCount !== 1 ? 's' : ''}`}
                  {additionalMaintenanceNotificationsCount > 0 && `${additionalMaintenanceNotificationsCount} maintenance additionnelle${additionalMaintenanceNotificationsCount !== 1 ? 's' : ''}`}
                  {periodicKmNotificationsCount > 0 && `${periodicKmNotificationsCount} kilométrage périodique${periodicKmNotificationsCount !== 1 ? 's' : ''}`}
                </div>
              )}
            </div>
          </div>

          {/* Carte Clients */}
          <div 
            className="stat-card clickable" 
            onClick={() => handleNavigation('clients', 'Gestion des Clients')}
          >
            <div className="stat-header">
              <div className="stat-icon">
                <FaUsers className="client-icon" />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Total Clients</div>
              <div className="stat-value">{clients.length}</div>
              <div className="stat-change positive">Utilisateurs actifs</div>
            </div>
          </div>
          
          {/* Carte Immatriculations Actives */}
          <div 
            className="stat-card clickable active" 
            onClick={() => handleNavigation('matricules', 'Immatriculations Actives', 'active')}
          >
            <div className="stat-header">
              <div className="stat-icon">
                <FaCheck className="active-icon" />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Immatriculations Actives</div>
              <div className="stat-value">{activeMatricules.length}</div>
              <div className="stat-details">
                <span className="stat-detail positive">
                  Prêtes à la location
                </span>
              </div>
              <div className="stat-change positive">Disponibles</div>
            </div>
          </div>

          {/* Carte Immatriculations Inactives */}
          <div 
            className="stat-card clickable inactive" 
            onClick={() => handleNavigation('matricules', 'Immatriculations Inactives', 'inactive')}
          >
            <div className="stat-header">
              <div className="stat-icon">
                <FaBan className="inactive-icon" />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Immatriculations Inactives</div>
              <div className="stat-value">{inactiveMatricules.length}</div>
              <div className="stat-details">
                <span className="stat-detail negative">
                  Maintenance ou accidents
                </span>
              </div>
              <div className="stat-change negative">Indisponibles</div>
            </div>
          </div>

          {/* Carte Immatriculations Réservées */}
          <div 
            className="stat-card clickable reserved" 
            onClick={() => handleNavigation('matricules', 'Immatriculations Réservées', 'reserved')}
          >
            <div className="stat-header">
              <div className="stat-icon">
                <FaCalendarAlt className="reserved-icon" />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Immatriculations Réservées</div>
              <div className="stat-value">{reservedMatricules.length}</div>
              <div className="stat-details">
                <span className="stat-detail warning">
                  Actuellement louées
                </span>
              </div>
              <div className="stat-change reserved">En cours d'utilisation</div>
            </div>
          </div>

          {/* Carte Immatriculations en Retard */}
          <div 
            className="stat-card clickable urgent" 
            onClick={() => handleNavigation('matricules', 'Immatriculations en Retard', 'late')}
          >
            <div className="stat-header">
              <div className="stat-icon">
                <FaExclamationTriangle className="late-icon" />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Immatriculations en Retard</div>
              <div className="stat-value">{lateMatricules.length}</div>
              <div className="stat-details">
                <span className="stat-detail urgent">
                  Retour en retard
                </span>
              </div>
              <div className="stat-change urgent">Attention requise</div>
            </div>
          </div>

          {/* Carte Total Réservations */}
          <div 
            className="stat-card clickable" 
            onClick={() => handleNavigation('reservations', 'Toutes les Réservations')}
          >
            <div className="stat-header">
              <div className="stat-icon">
                <FaCalendarAlt className="reservation-icon" />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Total Réservations</div>
              <div className="stat-value">{reservations.length}</div>
              <div className="stat-change positive">Tous statuts</div>
            </div>
          </div>

          {/* Carte Accidents */}
          <div 
            className="stat-card clickable" 
            onClick={() => handleNavigation('accidents', 'Gestion des Accidents')}
          >
            <div className="stat-header">
              <div className="stat-icon">
                <FaExclamationTriangle className="accident-icon" />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Total Accidents</div>
              <div className="stat-value">{accidents.length}</div>
              <div className="stat-details">
                <span className="stat-detail warning">
                  {accidents.filter(a => a.status === 'waiting').length} en attente
                </span>
              </div>
            </div>
          </div>

          {/* Carte Réservations en Attente */}
          <div 
            className="stat-card clickable pending" 
            onClick={() => handleNavigation('reservations', 'Réservations en Attente', 'pending')}
          >
            <div className="stat-header">
              <div className="stat-icon">
                <FaClock className="pending-icon" />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Réservations en Attente</div>
              <div className="stat-value">{pendingReservations.length}</div>
              <div className="stat-change pending">En attente de confirmation</div>
            </div>
          </div>

          {/* Carte Réservations Confirmées */}
          <div 
            className="stat-card clickable confirmed" 
            onClick={() => handleNavigation('reservations', 'Réservations Confirmées', 'confirmed')}
          >
            <div className="stat-header">
              <div className="stat-icon">
                <FaCalendarAlt className="confirmed-icon" />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Réservations Confirmées</div>
              <div className="stat-value">{confirmedReservations.length}</div>
              <div className="stat-change confirmed">Locations actives</div>
            </div>
          </div>

          {/* Carte Réservations Terminées */}
          <div 
            className="stat-card clickable completed" 
            onClick={() => handleNavigation('reservations', 'Réservations Terminées', 'completed')}
          >
            <div className="stat-header">
              <div className="stat-icon">
                <FaCalendarAlt className="completed-icon" />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Réservations Terminées</div>
              <div className="stat-value">{completedReservations.length}</div>
              <div className="stat-change completed">Locations terminées</div>
            </div>
          </div>

          {/* Carte Réservations Contactées */}
          <div 
            className="stat-card clickable contacted" 
            onClick={() => handleNavigation('reservations', 'Réservations Contactées', 'contacted')}
          >
            <div className="stat-header">
              <div className="stat-icon">
                <FaEnvelope className="contacted-icon" />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Réservations Contactées</div>
              <div className="stat-value">{contactedReservations.length}</div>
              <div className="stat-change contacted">Client contacté</div>
            </div>
          </div>

          {/* Carte Réservations Annulées */}
          <div 
            className="stat-card clickable cancelled" 
            onClick={() => handleNavigation('reservations', 'Réservations Annulées', 'cancelled')}
          >
            <div className="stat-header">
              <div className="stat-icon">
                <FaCalendarAlt className="cancelled-icon" />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Réservations Annulées</div>
              <div className="stat-value">{cancelledReservations.length}</div>
              <div className="stat-change cancelled">Réservations annulées</div>
            </div>
          </div>

          {/* Carte Réservations en Retard */}
          <div 
            className="stat-card clickable urgent" 
            onClick={() => handleNavigation('reservations', 'Réservations en Retard', 'overdue')}
          >
            <div className="stat-header">
              <div className="stat-icon">
                <FaExclamationTriangle className="overdue-icon" />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Réservations en Retard</div>
              <div className="stat-value">{overdueReservations.length}</div>
              <div className="stat-change urgent">Attention requise</div>
            </div>
          </div>

          {/* Carte Contacts */}
          <div 
            className="stat-card clickable" 
            onClick={() => handleNavigation('contacts', 'Gestion des Contacts')}
          >
            <div className="stat-header">
              <div className="stat-icon">
                <FaEnvelope className="contact-icon" />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Messages de Contact</div>
              <div className="stat-value">{contacts.length}</div>
              <div className="stat-change positive">Nouvelles demandes</div>
            </div>
          </div>
        </div>

        {/* Section Voitures les Plus Louées - Mise à jour en vue liste */}
        <div className="most-rented-section">
          <div className="section-header">
            <h3 className="section-title">
              <FaTrophy /> Voitures les Plus Louées
            </h3>
            <div className="section-actions">
              <button 
                className="action-btn" 
                onClick={() => handleExport('popular-cars', mostRentedCars, 'voitures_populaires.csv')}
              >
                <FaFileExport /> Exporter
              </button>
            </div>
          </div>
          <div className="most-rented-list">
            {mostRentedCars.length > 0 ? (
              mostRentedCars.map((car, index) => (
                <div key={car.id} className="most-rented-item">
                  <div className="car-rank">
                    <div className={`rank-badge rank-${index + 1}`}>
                      #{index + 1}
                    </div>
                    {index === 0 && <FaTrophy className="trophy-icon" />}
                  </div>
                  <div className="car-image">
                    {car.image ? (
                      <img src={`https://oulfa-back-production.up.railway.app/storage/${car.image}`} alt={car.brand} />
                    ) : (
                      <div className="car-image-placeholder">
                        <FaCar />
                      </div>
                    )}
                  </div>
                  <div className="car-info">
                    <h4 className="car-name">{car.brand} {car.model}</h4>
                    <div className="car-details">
                      <span className="car-year">{car.year}</span>
                      <span className="car-seats">{car.seats} places</span>
                      <span className="car-transmission">{car.transmission}</span>
                    </div>
                    <div className="car-price">
                      <span className="currency-symbol">MAD</span>{car.price_per_day}/jour
                    </div>
                  </div>
                  <div className="car-stats">
                    <div className="reservation-count">
                      <span className="count">{car.reservationCount}</span>
                      <span className="label">réservations</span>
                    </div>
                    <div className="car-status">
                      {getStatusBadge(car.status)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">
                <FaCar size={48} />
                <p>Aucune donnée de location disponible</p>
              </div>
            )}
          </div>
        </div>

        {/* Grille Récente */}
        <div className="recent-grid">
          <div className="data-section">
            <div className="section-header">
              <h3 className="section-title">
                <FaCalendarAlt /> Réservations Récentes
              </h3>
              <div className="section-actions">
                <button 
                  className="action-btn" 
                  onClick={() => handleExport('reservations', reservations, 'reservations.csv')}
                >
                  <FaFileExport /> Exporter
                </button>
              </div>
            </div>
            <div className="table-container">
              {reservations.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Client</th>
                      <th>Voiture</th>
                      <th>Dates</th>
                      <th>Jours Restants</th>
                      <th>Prix Total</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...reservations].slice(-5).reverse().map(reservation => {
                      const daysLeft = calculateDaysLeft(reservation.end_date);
                      const isOverdue = daysLeft < 0 && reservation.status === 'confirmed';
                      
                      return (
                        <tr 
                          key={reservation.id}
                          className={
                            isOverdue ? 'overdue' : 
                            daysLeft <= 2 && (reservation.status === 'confirmed' || reservation.status === 'pending') ? 'ending-soon' : ''
                          }
                        >
                          <td>#{reservation.id}</td>
                          <td>
                            {reservation.client?.nom} {reservation.client?.prenom}
                          </td>
                          <td>
                            {reservation.car?.brand} {reservation.car?.model}
                          </td>
                          <td>
                            {new Date(reservation.start_date).toLocaleDateString('fr-FR')} - {' '}
                            {new Date(reservation.end_date).toLocaleDateString('fr-FR')}
                          </td>
                          <td>
                            {daysLeft >= 0 ? (
                              <span className={`days-left ${daysLeft <= 2 ? 'warning' : ''}`}>
                                {daysLeft} jour{daysLeft !== 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="days-left expired">En retard ({Math.abs(daysLeft)} jours)</span>
                            )}
                          </td>
                          <td>
                            <span className="currency-symbol">MAD</span>{reservation.total_price}
                          </td>
                          <td>
                            {isOverdue ? getStatusBadge('retard') : getStatusBadge(reservation.status)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="no-data">
                  <FaDatabase />
                  <p>Aucune réservation trouvée</p>
                </div>
              )}
            </div>
          </div>

          <div className="data-section">
            <div className="section-header">
              <h3 className="section-title">
                <FaEnvelope /> Contacts Récents
              </h3>
              <div className="section-actions">
                <button 
                  className="action-btn" 
                  onClick={() => handleExport('contacts', contacts, 'contacts.csv')}
                >
                  <FaFileExport /> Exporter
                </button>
              </div>
            </div>
            <div className="table-container">
              {contacts.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Téléphone</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...contacts].slice(-5).reverse().map(contact => (
                      <tr key={contact.id}>
                        <td>{contact.fullname}</td>
                        <td>{contact.email}</td>
                        <td>{contact.phone}</td>
                        <td>{new Date(contact.created_at).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data">
                  <FaDatabase />
                  <p>Aucun message de contact trouvé</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="dashboard-container">
      {/* En-tête avec bouton retour quand pas sur le tableau de bord */}
      {currentView !== 'dashboard' && (
        <div className="dashboard-header">
          <button className="back-button" onClick={handleBackToDashboard}>
            <FaArrowLeft /> Retour au Tableau de Bord
          </button>
          <h1 className="dashboard-title">{currentTitle}</h1>
        </div>
      )}
      
      {renderCurrentView()}

      <style jsx>{`
        .dashboard-container {
          padding: 20px;
        }

        .dashboard-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e9ecef;
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
        }

        .back-button:hover {
          background: #5a6268;
        }

        .dashboard-title {
          color: #343a40;
          margin: 0;
          font-size: 1.8rem;
        }

        .notifications-container {
          position: relative;
          display: inline-block;
          margin-bottom: 20px;
        }

        .notifications-bell {
          position: relative;
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.2rem;
          color: #6c757d;
          transition: all 0.3s ease;
        }

        .notifications-bell:hover {
          background: #e9ecef;
          color: #495057;
        }

        .notifications-bell.has-notifications {
          color: #dc3545;
          border-color: #dc3545;
          animation: pulse 2s infinite;
        }

        .notification-count {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #dc3545;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 0.7rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .notifications-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          width: 400px;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 1000;
          margin-top: 10px;
        }

        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border-bottom: 1px solid #dee2e6;
          background: #f8f9fa;
        }

        .notifications-header h4 {
          margin: 0;
          color: #495057;
        }

        .clear-all-btn {
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .clear-all-btn:hover {
          color: #dc3545;
        }

        .notifications-list {
          max-height: 500px;
          overflow-y: auto;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          padding: 12px 15px;
          border-bottom: 1px solid #f1f3f4;
          transition: background-color 0.2s;
        }

        .notification-item:hover {
          background: #f8f9fa;
        }

        .notification-item.urgent {
          background: #fff5f5;
          border-left: 3px solid #dc3545;
        }

        .notification-item.warning {
          background: #fff9db;
          border-left: 3px solid #ffc107;
        }

        .notification-item.waiting {
          background: #fff0f0;
          border-left: 3px solid #ff6b6b;
        }

        .notification-item.accident {
          background: #fff0f0;
          border-left: 3px solid #ff6b6b;
        }

        .notification-item.technical_visit {
          background: #e7f3ff;
          border-left: 3px solid #007bff;
        }

        .notification-item.car_tax {
          background: #fff0e6;
          border-left: 3px solid #fd7e14;
        }

        .notification-item.insurance {
          background: #e6f3ff;
          border-left: 3px solid #17a2b8;
        }

        .notification-item.maintenance {
          background: #fff9e6;
          border-left: 3px solid #ffc107;
        }

        .notification-item.additional_maintenance {
          background: #e6ffe6;
          border-left: 3px solid #28a745;
        }

        .notification-item.periodic_km {
          background: #f0f8ff;
          border-left: 3px solid #007bff;
        }

        .notification-icon {
          margin-right: 10px;
          color: #6c757d;
          margin-top: 2px;
          font-size: 0.9rem;
          min-width: 20px;
        }

        .notification-item.urgent .notification-icon {
          color: #dc3545;
        }

        .notification-item.warning .notification-icon {
          color: #ffc107;
        }

        .notification-item.waiting .notification-icon,
        .notification-item.accident .notification-icon {
          color: #ff6b6b;
        }

        .notification-item.technical_visit .notification-icon {
          color: #007bff;
        }

        .notification-item.car_tax .notification-icon {
          color: #fd7e14;
        }

        .notification-item.insurance .notification-icon {
          color: #17a2b8;
        }

        .notification-item.maintenance .notification-icon {
          color: #ffc107;
        }

        .notification-item.additional_maintenance .notification-icon {
          color: #28a745;
        }

        .notification-item.periodic_km .notification-icon {
          color: #007bff;
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-message {
          margin: 0 0 5px 0;
          font-size: 0.85rem;
          color: #495057;
          word-wrap: break-word;
        }

        .notification-date {
          color: #6c757d;
          font-size: 0.75rem;
          display: block;
          line-height: 1.3;
        }

        .notification-close {
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          font-size: 1.2rem;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-left: 5px;
        }

        .notification-close:hover {
          color: #dc3545;
        }

        .no-notifications {
          padding: 30px 20px;
          text-align: center;
          color: #6c757d;
        }

        .no-notifications svg {
          font-size: 2rem;
          margin-bottom: 10px;
          opacity: 0.5;
        }

        /* Grille de statistiques améliorée */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          border: 1px solid #e9ecef;
          transition: all 0.3s ease;
          position: relative;
        }

        .stat-card.clickable {
          cursor: pointer;
        }

        .stat-card.clickable:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        }

        .stat-card.active {
          border-color: #28a745;
          background: #e6ffe6;
        }

        .stat-card.active:hover {
          border-color: #218838;
        }

        .stat-card.inactive {
          border-color: #dc3545;
          background: #fff5f5;
        }

        .stat-card.inactive:hover {
          border-color: #c82333;
        }

        .stat-card.pending {
          border-color: #ffc107;
          background: #fff9db;
        }

        .stat-card.pending:hover {
          border-color: #e0a800;
        }

        .stat-card.confirmed {
          border-color: #007bff;
          background: #e7f3ff;
        }

        .stat-card.confirmed:hover {
          border-color: #0069d9;
        }

        .stat-card.completed {
          border-color: #28a745;
          background: #e6ffe6;
        }

        .stat-card.completed:hover {
          border-color: #218838;
        }

        .stat-card.contacted {
          border-color: #6c757d;
          background: #f8f9fa;
        }

        .stat-card.contacted:hover {
          border-color: #5a6268;
        }

        .stat-card.cancelled {
          border-color: #dc3545;
          background: #fff5f5;
        }

        .stat-card.cancelled:hover {
          border-color: #c82333;
        }

        .stat-card.urgent {
          border-color: #dc3545;
          background: #fff5f5;
        }

        .stat-card.urgent:hover {
          border-color: #c82333;
        }

        .stat-card.reserved {
          border-color: #ffc107;
          background: #fff9db;
        }

        .stat-card.reserved:hover {
          border-color: #e0a800;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          background: transparent !important;
        }

        .car-icon { color: #007bff; }
        .client-icon { color: #28a745; }
        .accident-icon { color: #dc3545; }
        .active-icon { color: #28a745; }
        .inactive-icon { color: #dc3545; }
        .reserved-icon { color: #ffc107; }
        .late-icon { color: #dc3545; }
        .reservation-icon { color: #fd7e14; }
        .pending-icon { color: #ffc107; }
        .confirmed-icon { color: #007bff; }
        .completed-icon { color: #28a745; }
        .contacted-icon { color: #6c757d; }
        .cancelled-icon { color: #dc3545; }
        .overdue-icon { color: #dc3545; }
        .contact-icon { color: #17a2b8; }

        .stat-alert {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #dc3545;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
        }

        .stat-content {
          text-align: left;
        }

        .stat-title {
          font-size: 0.9rem;
          color: #6c757d;
          margin-bottom: 5px;
          font-weight: 600;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #343a40;
          margin-bottom: 10px;
        }

        .stat-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-detail {
          font-size: 0.8rem;
          padding: 2px 8px;
          border-radius: 12px;
          display: inline-block;
          width: fit-content;
        }

        .stat-detail.positive {
          background: #d4edda;
          color: #155724;
        }

        .stat-detail.negative {
          background: #f8d7da;
          color: #721c24;
        }

        .stat-detail.warning {
          background: #fff3cd;
          color: #856404;
        }

        .stat-detail.pending {
          background: #fff3cd;
          color: #856404;
        }

        .stat-detail.confirmed {
          background: #cce7ff;
          color: #004085;
        }

        .stat-detail.urgent {
          background: #f8d7da;
          color: #721c24;
        }

        .stat-change {
          font-size: 0.8rem;
          font-weight: 600;
          margin-top: 8px;
        }

        .stat-change.positive {
          color: #28a745;
        }

        .stat-change.negative {
          color: #dc3545;
        }

        .stat-change.pending {
          color: #ffc107;
        }

        .stat-change.confirmed {
          color: #007bff;
        }

        .stat-change.completed {
          color: #28a745;
        }

        .stat-change.contacted {
          color: #6c757d;
        }

        .stat-change.cancelled {
          color: #dc3545;
        }

        .stat-change.urgent {
          color: #dc3545;
        }

        .stat-change.reserved {
          color: #ffc107;
        }

        .stat-notification {
          margin-top: 8px;
          padding: 6px 10px;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          font-size: 0.75rem;
          color: #856404;
          line-height: 1.3;
        }

        /* Section Voitures les Plus Louées - Vue Liste */
        .most-rented-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-top: 30px;
        }

        .most-rented-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 20px;
        }

        .most-rented-item {
          display: flex;
          align-items: center;
          background: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
          border: 1px solid #e9ecef;
          transition: all 0.3s ease;
          position: relative;
        }

        .most-rented-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          background: white;
        }

        .car-rank {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-right: 15px;
          min-width: 60px;
        }

        .rank-badge {
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: bold;
          color: white;
          min-width: 40px;
          text-align: center;
        }

        .rank-1 {
          background: linear-gradient(135deg, #FFD700, #FFA500);
        }

        .rank-2 {
          background: linear-gradient(135deg, #C0C0C0, #A9A9A9);
        }

        .rank-3 {
          background: linear-gradient(135deg, #CD7F32, #8B4513);
        }

        .rank-4, .rank-5 {
          background: #6c757d;
        }

        .trophy-icon {
          color: #FFD700;
          font-size: 1.2rem;
        }

        .car-image {
          width: 80px;
          height: 60px;
          border-radius: 6px;
          overflow: hidden;
          margin-right: 15px;
          background: #e9ecef;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .car-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .car-image-placeholder {
          font-size: 1.5rem;
          color: #6c757d;
        }

        .car-info {
          flex: 1;
          margin-right: 15px;
        }

        .car-name {
          font-size: 1.1rem;
          font-weight: bold;
          color: #343a40;
          margin: 0 0 8px 0;
        }

        .car-details {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .car-details span {
          padding: 2px 8px;
          background: white;
          border-radius: 12px;
          font-size: 0.8rem;
          color: #6c757d;
          border: 1px solid #dee2e6;
        }

        .car-price {
          font-weight: bold;
          color: #28a745;
          font-size: 1rem;
        }

        .car-stats {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          min-width: 120px;
        }

        .reservation-count {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .count {
          font-size: 1.3rem;
          font-weight: bold;
          color: #343a40;
        }

        .label {
          font-size: 0.8rem;
          color: #6c757d;
        }

        .days-left.warning {
          color: #dc3545;
          font-weight: bold;
        }

        .days-left.expired {
          color: #dc3545;
          font-weight: bold;
          font-style: italic;
        }

        tr.ending-soon {
          background: #fff9db !important;
        }

        tr.overdue {
          background: #fff5f5 !important;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .status-available {
          background: #d4edda;
          color: #155724;
        }

        .status-unavailable {
          background: #f8d7da;
          color: #721c24;
        }

        .status-pending {
          background: #fff3cd;
          color: #856404;
        }

        .status-confirmed {
          background: #cce7ff;
          color: #004085;
        }

        .status-completed {
          background: #d1ecf1;
          color: #0c5460;
        }

        .status-cancelled {
          background: #f8d7da;
          color: #721c24;
        }

        .status-contacted {
          background: #e2e3e5;
          color: #383d41;
        }

        .status-waiting {
          background: #fff0f0;
          color: #dc3545;
        }

        .status-evaluation-owner {
          background: #e7f3ff;
          color: #0066cc;
        }

        .status-contact-expert {
          background: #fff0e6;
          color: #cc6600;
        }

        .status-evaluation-expert {
          background: #f0e6ff;
          color: #6600cc;
        }

        .status-fixed {
          background: #e6ffe6;
          color: #006600;
        }

        .status-retard {
          background: #fff5f5;
          color: #dc3545;
          border: 1px solid #f5c6cb;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

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

        .recent-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 30px;
        }

        .data-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.2rem;
          font-weight: 600;
          color: #343a40;
          margin: 0;
        }

        .section-actions {
          display: flex;
          gap: 10px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .action-btn:hover {
          background: #545b62;
        }

        .table-container {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .data-table th {
          background: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 2px solid #dee2e6;
        }

        .data-table td {
          padding: 12px;
          border-bottom: 1px solid #dee2e6;
          color: #6c757d;
        }

        .data-table tr:hover {
          background: #f8f9fa;
        }

        .no-data {
          text-align: center;
          padding: 40px 20px;
          color: #6c757d;
        }

        .no-data svg {
          margin-bottom: 15px;
          opacity: 0.5;
        }

        /* Design responsive */
        @media (max-width: 768px) {
          .notifications-dropdown {
            width: 300px;
            left: -50px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .most-rented-item {
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
          }

          .car-rank {
            margin-right: 0;
            margin-bottom: 10px;
          }

          .car-image {
            margin-right: 0;
            margin-bottom: 10px;
          }

          .car-info {
            margin-right: 0;
            margin-bottom: 10px;
          }

          .car-stats {
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
            align-items: center;
          }

          .recent-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-container {
            padding: 10px;
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

export default DashboardContent;