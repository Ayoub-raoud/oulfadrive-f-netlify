import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FaCar, FaUsers, FaCalendarAlt, FaEnvelope, FaFileExport,
  FaDatabase, FaDollarSign, FaMapMarkerAlt, FaBell, FaExclamationTriangle,
  FaExclamationCircle, FaIdCard, FaChartPie, FaClock, FaArrowLeft,
  FaTrophy, FaStar, FaChartLine, FaCheck, FaBan, FaWrench,
  FaMoneyBill, FaShieldAlt, FaOilCan, FaTools, FaRoad, FaSyncAlt, FaDownload
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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

      const maintenanceInterval = 10000;
      const kmSinceLastReset = currentKm % maintenanceInterval;
      const kmRemaining = maintenanceInterval - kmSinceLastReset;

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

      if (daysDiff <= 2) {
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
          message: `Vignette pour ${matricule.matricule_code} (${carInfo}) ${message}`,
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

  const generateNotificationsPDF = async () => {
    try {
      if (notifications.length === 0) {
        alert('Aucune notification à exporter !');
        return;
      }

      const notificationsByType = {};
      notifications.forEach(notif => {
        if (!notificationsByType[notif.type]) {
          notificationsByType[notif.type] = [];
        }
        notificationsByType[notif.type].push(notif);
      });

      const totalNotifications = notifications.length;
      const urgentCount = notifications.filter(n => n.subType === 'urgent').length;
      const warningCount = notifications.filter(n => n.subType === 'warning').length;

      let totalDaysOverdue = 0;
      let totalKmOverdue = 0;

      notifications.forEach(notif => {
        if (notif.daysRemaining && notif.daysRemaining < 0) {
          totalDaysOverdue += Math.abs(notif.daysRemaining);
        }
        if (notif.kmOverdue) {
          totalKmOverdue += notif.kmOverdue;
        }
      });

      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: white; }
            .notifications-pdf-container { max-width: 800px; margin: 0 auto; padding: 10px; font-family: Arial, sans-serif; font-size: 8px; color: #000; background: #fff; border: 1px solid #000; line-height: 1.1; }
            .notifications-pdf-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 2px solid #000; padding-bottom: 6px; }
            .header-left { display: flex; flex-direction: column; align-items: flex-start; flex: 1; }
            .location-text { font-weight: bold; font-size: 12px; margin-bottom: 3px; }
            .phone-number { font-size: 9px; color: #000; font-weight: bold; }
            .header-center { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .company-name { font-weight: 900; font-size: 14px; color: #354191; text-transform: uppercase; letter-spacing: 1px; }
            .company-subtitle { font-size: 9px; color: #666; font-weight: bold; }
            .header-right { display: flex; flex-direction: column; align-items: flex-end; flex: 1; }
            .arabic-text { font-weight: bold; font-size: 12px; margin-bottom: 3px; font-family: 'Arial', sans-serif; direction: rtl; }
            .report-number-red { font-weight: 900; font-size: 10px; color: #ff0000; font-family: monospace; background: #fff; padding: 2px 4px; border: 1px solid #ff0000; border-radius: 2px; }
            .notifications-pdf-title { text-align: center; font-weight: 700; font-size: 10px; margin: 0 0 8px 0; text-transform: uppercase; }
            .section-header-pdf { background: #354191; color: white; padding: 4px 15px; border-radius: 20px; font-weight: 700; font-size: 12px; margin: 10px 0 6px 0; text-transform: uppercase; border-bottom: 1px solid #000; }
            .section-header-pdf h2 { margin: 0; font-size: 12px; }
            .summary-section { margin-bottom: 10px; }
            .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 10px; }
            .summary-item { display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; border: 1px solid #ddd; border-radius: 5px; background: #f8f9fa; }
            .summary-item label { font-weight: bold; font-size: 9px; color: #354191; }
            .summary-value { font-weight: bold; font-size: 10px; color: #000; }
            .summary-value.urgent { color: #ff0000; }
            .summary-value.warning { color: #ff8c00; }
            .notifications-section { margin-bottom: 10px; }
            .type-section { margin-bottom: 15px; break-inside: avoid; }
            .type-title { background: #e9ecef; padding: 6px 10px; border-radius: 6px; font-weight: bold; font-size: 10px; margin-bottom: 8px; border-left: 3px solid #354191; }
            table { width: 100%; border-collapse: collapse; font-size: 7px; margin-bottom: 8px; }
            table th { background: #354191; color: white; font-weight: bold; padding: 4px 6px; text-align: center; border: 1px solid #354191; font-size: 8px; }
            table td { padding: 3px 5px; border: 1px solid #ddd; vertical-align: top; }
            .center-text { text-align: center; }
            .right-text { text-align: right; }
            .urgent-text { color: #ff0000; font-weight: bold; }
            .warning-text { color: #ff8c00; font-weight: bold; }
            .status-label { padding: 2px 4px; border-radius: 3px; font-size: 6px; font-weight: bold; text-transform: uppercase; }
            .status-label.urgent { background: #ffcccc; color: #ff0000; }
            .status-label.warning { background: #fff3cd; color: #856404; }
            .status-label.waiting { background: #f0e6ff; color: #6600cc; }
            .total-section { display: flex; justify-content: flex-end; align-items: center; padding: 6px 10px; background: #354191; border: 2px solid #000; border-radius: 5px; margin-top: 5px; }
            .total-label { font-weight: bold; font-size: 10px; color: white; margin-right: 10px; }
            .total-value { font-weight: bold; font-size: 12px; color: white; }
            .notes-section { margin-bottom: 10px; }
            .notes-content { padding: 8px; border: 1px solid #000; border-radius: 5px; font-size: 9px; line-height: 1.3; background: #f8f9fa; }
            .warning-note { color: #ff0000; font-weight: bold; margin-top: 5px; font-size: 10px; }
            .notifications-pdf-footer { font-size: 10px; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 0.1px; line-height: 1.1; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="notifications-pdf-container" id="pdf-content">
            <header class="notifications-pdf-header">
              <div class="header-left">
                <div class="location-text">RAPPORT DES NOTIFICATIONS</div>
                <div class="phone-number">0665 921 921</div>
              </div>
              <div class="header-center">
                <div class="company-name">OULFA DRIVE</div>
                <div class="company-subtitle">Gestion des Notifications</div>
              </div>
              <div class="header-right">
                <div class="arabic-text">تقرير الإشعارات</div>
                <div class="report-number-red">#${new Date().getTime().toString().slice(-7)}</div>
              </div>
            </header>

            <h1 class="notifications-pdf-title">RAPPORT COMPLET DES NOTIFICATIONS</h1>

            <section class="summary-section">
              <div class="section-header-pdf"><h2>SOMMAIRE DES NOTIFICATIONS</h2></div>
              <div class="summary-grid">
                <div class="summary-item"><label>Total Notifications :</label><div class="summary-value">${totalNotifications}</div></div>
                <div class="summary-item"><label>Notifications Urgentes :</label><div class="summary-value urgent">${urgentCount}</div></div>
                <div class="summary-item"><label>Notifications Avertissement :</label><div class="summary-value warning">${warningCount}</div></div>
                <div class="summary-item"><label>Date du rapport :</label><div class="summary-value">${new Date().toLocaleDateString('fr-FR')}</div></div>
                <div class="summary-item"><label>Heure du rapport :</label><div class="summary-value">${new Date().toLocaleTimeString('fr-FR')}</div></div>
                ${totalDaysOverdue > 0 ? `<div class="summary-item"><label>Total Jours Retard :</label><div class="summary-value urgent">${totalDaysOverdue} jours</div></div>` : ''}
                ${totalKmOverdue > 0 ? `<div class="summary-item"><label>Total Km Retard :</label><div class="summary-value urgent">${totalKmOverdue} km</div></div>` : ''}
              </div>
            </section>

            <section class="notifications-section">
              <div class="section-header-pdf"><h2>DÉTAIL DES NOTIFICATIONS</h2></div>
              ${Object.entries(notificationsByType).map(([type, typeNotifications]) => {
                const typeName = getTypeFrenchName(type);
                return `
                  <div class="type-section">
                    <div class="type-title">${typeName} (${typeNotifications.length})</div>
                    <table class="notifications-table">
                      <thead>
                        <tr><th>N°</th><th>Message</th><th>Type</th><th>Détails</th><th>Date</th></tr>
                      </thead>
                      <tbody>
                        ${typeNotifications.map((notif, index) => `
                          <tr>
                            <td class="center-text">${index + 1}</td>
                            <td>${escapeHtml(notif.message)}</td>
                            <td class="center-text"><span class="status-label ${notif.subType}">${getSubTypeFrenchText(notif.subType)}</span></td>
                            <td>${getNotificationDetailsHTML(notif)}</td>
                            <td>${formatDateForPDF(new Date(notif.timestamp))}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                `;
              }).join('')}
              <div class="total-section">
                <div class="total-label">TOTAL NOTIFICATIONS :</div>
                <div class="total-value">${totalNotifications}</div>
              </div>
            </section>

            <section class="notes-section">
              <div class="section-header-pdf"><h2>NOTES ET OBSERVATIONS</h2></div>
              <div class="notes-content">
                Ce rapport contient un total de <strong>${totalNotifications}</strong> notification(s) actives dont :
                <br><br>
                • <strong>${urgentCount}</strong> notification(s) urgentes nécessitant une attention immédiate<br>
                • <strong>${warningCount}</strong> notification(s) d'avertissement à surveiller
                ${totalDaysOverdue > 0 ? `<br>• <strong>${totalDaysOverdue}</strong> jour(s) de retard total sur toutes les notifications` : ''}
                ${totalKmOverdue > 0 ? `<br>• <strong>${totalKmOverdue}</strong> km de retard total sur les maintenances` : ''}
                <br><br>
                <strong>Recommandations :</strong><br>
                ${urgentCount > 0 ? '• Traiter immédiatement les notifications urgentes<br>' : ''}
                • Suivre régulièrement les notifications d'avertissement<br>
                • Mettre à jour les dates d'échéance et les kilométrages<br>
                • Planifier les maintenances préventives
              </div>
            </section>

            <footer class="notifications-pdf-footer">
              OULFA DRIVE SARL AU CAPITAL 100 000.00 DH SIEGE SOCIAL: BASSATINE AL OULFA GH 3 IMMEUBLE 14 N°56 AL OULFA – CASABLANCA<br />
              RC: 580419-IF: 53743931 -TP: 35007229 ICE: 003274706000087 -TEL: 0665 92 19 21 / 0660 47 28 40 - EMAIL: OULFADRIVE@GMAIL.COM
            </footer>
          </div>
        </body>
        </html>
      `;

      function getTypeFrenchName(type) {
        const typeMap = {
          'reservation': 'RÉSERVATION',
          'accident': 'ACCIDENT',
          'technical_visit': 'VISITE TECHNIQUE',
          'car_tax': 'TAXE VOITURE',
          'insurance': 'ASSURANCE',
          'maintenance': 'MAINTENANCE',
          'additional_maintenance': 'MAINTENANCE ADDITIONNELLE',
          'periodic_km': 'KILOMÉTRAGE PÉRIODIQUE'
        };
        return typeMap[type] || type.toUpperCase();
      }

      function getSubTypeFrenchText(subType) {
        const subTypeMap = { 'urgent': 'URGENT', 'warning': 'AVERTISSEMENT', 'waiting': 'EN ATTENTE' };
        return subTypeMap[subType] || subType.toUpperCase();
      }

      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      function formatDateForPDF(date) {
        return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }

      function getNotificationDetailsHTML(notification) {
        let details = '';
        if (notification.daysRemaining !== undefined) {
          if (notification.daysRemaining < 0) details += `En retard de ${Math.abs(notification.daysRemaining)} jours<br>`;
          else details += `Dans ${notification.daysRemaining} jours<br>`;
        }
        if (notification.kmRemaining !== undefined) {
          if (notification.kmRemaining < 0) details += `Dépassé de ${Math.abs(notification.kmRemaining)} km<br>`;
          else details += `Dans ${notification.kmRemaining} km<br>`;
        }
        if (notification.kmOverdue !== undefined) details += `En retard de ${notification.kmOverdue} km<br>`;
        if (notification.currentKm !== undefined) details += `Km actuel: ${notification.currentKm} km<br>`;
        if (notification.vidangeStatus) details += `Vidange: ${notification.vidangeStatus === 'not done' ? 'Non effectuée' : 'Effectuée'}<br>`;
        if (notification.matriculeCode) details += `Immatriculation: ${notification.matriculeCode}<br>`;
        return details || 'Aucun détail supplémentaire';
      }

      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm';
      tempContainer.style.height = 'auto';
      tempContainer.style.padding = '10px';
      tempContainer.style.boxSizing = 'border-box';
      tempContainer.style.backgroundColor = '#ffffff';

      tempContainer.innerHTML = pdfContent;
      document.body.appendChild(tempContainer);

      const canvas = await html2canvas(tempContainer.querySelector('#pdf-content'), {
        scale: 2, useCORS: true, allowTaint: true,
        width: 794, height: 1123, scrollX: 0, scrollY: 0,
        windowWidth: 794, windowHeight: 1123, backgroundColor: '#ffffff'
      });

      document.body.removeChild(tempContainer);

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > pageHeight) {
        const scale = pageHeight / imgHeight;
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        doc.addImage(imgData, 'PNG', (pageWidth - scaledWidth) / 2, 0, scaledWidth, scaledHeight);
      } else {
        const verticalOffset = (pageHeight - imgHeight) / 2;
        doc.addImage(imgData, 'PNG', 0, verticalOffset, imgWidth, imgHeight);
      }

      const fileName = `notifications-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Rapport Notifications - ${new Date().toLocaleDateString('fr-FR')}</title></head>
            <body style="margin: 0; padding: 0;">
              <embed src="${pdfUrl}" type="application/pdf" width="100%" height="100%" style="position: absolute; top: 0; left: 0;" />
            </body>
          </html>
        `);
      }

      setTimeout(() => { URL.revokeObjectURL(pdfUrl); }, 1000);

      showNotificationSuccessMessage('PDF des notifications généré et téléchargé avec succès!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showNotificationErrorMessage('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
  };

  const showNotificationSuccessMessage = (message) => {
    const existingNotifications = document.querySelectorAll('.notification-success, .notification-error');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = 'notification-success';
    notification.innerHTML = `<div class="notification-content"><span>${message}</span></div>`;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) notification.remove();
    }, 5000);
  };

  const showNotificationErrorMessage = (message) => {
    const existingNotifications = document.querySelectorAll('.notification-success, .notification-error');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = 'notification-error';
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button onclick="this.parentNode.parentNode.remove()" style="background: none; border: none; color: inherit; cursor: pointer; margin-left: 10px;">×</button>
      </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) notification.remove();
    }, 8000);
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
      if (reservation.status === 'retard') return true;

      if (reservation.status === 'confirmed') {
        const endDate = new Date(reservation.end_date);
        endDate.setHours(0, 0, 0, 0);
        return endDate < today;
      }

      return false;
    });
  };

  // Fonction pour obtenir les voitures les plus louées
  const getMostRentedCars = () => {
    if (!reservations.length || !cars.length) return [];

    const carReservationCount = {};

    reservations.forEach(reservation => {
      if (['confirmed', 'completed', 'retard'].includes(reservation.status)) {
        const carId = reservation.car_id;
        carReservationCount[carId] = (carReservationCount[carId] || 0) + 1;
      }
    });

    const carsWithCounts = cars.map(car => ({
      ...car,
      reservationCount: carReservationCount[car.id] || 0
    }));

    return carsWithCounts
      .sort((a, b) => b.reservationCount - a.reservationCount)
      .slice(0, 5);
  };

  // Fonction pour obtenir les réservations les plus récemment modifiées
  const getRecentReservations = () => {
    if (!reservations || reservations.length === 0) return [];

    return [...reservations]
      .filter(reservation => reservation.status === 'completed' || reservation.status === 'confirmed' || reservation.status === 'overdue')
      .sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at || a.start_date);
        const dateB = new Date(b.updated_at || b.created_at || b.start_date);
        return dateB - dateA;
      })
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
      if (a.subType === 'urgent' && b.subType !== 'urgent') return -1;
      if (b.subType === 'urgent' && a.subType !== 'urgent') return 1;

      if (a.daysRemaining !== undefined && b.daysRemaining !== undefined) {
        if (a.daysRemaining < 0 && b.daysRemaining >= 0) return -1;
        if (b.daysRemaining < 0 && a.daysRemaining >= 0) return 1;
        return Math.abs(a.daysRemaining) - Math.abs(b.daysRemaining);
      }
      if (a.kmRemaining !== undefined && b.kmRemaining !== undefined) {
        if (a.kmRemaining < 0 && b.kmRemaining >= 0) return -1;
        if (b.kmRemaining < 0 && a.kmRemaining >= 0) return 1;
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
      case 'accident': return <FaExclamationCircle />;
      case 'technical_visit': return <FaWrench />;
      case 'car_tax': return <FaMoneyBill />;
      case 'insurance': return <FaShieldAlt />;
      case 'maintenance': return <FaOilCan />;
      case 'additional_maintenance': return <FaTools />;
      case 'periodic_km': return <FaRoad />;
      case 'reservation':
        if (subType === 'urgent') return <FaExclamationTriangle />;
        return <FaCalendarAlt />;
      default: return <FaBell />;
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
          if (typeof value === 'object' && value !== null) return JSON.stringify(value);
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

  const toggleNotifications = () => setShowNotifications(!showNotifications);
  const clearNotification = (notificationId) => setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  const clearAllNotifications = () => setNotifications([]);

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

  const renderCurrentView = () => {
    switch (currentView) {
      case 'cars': return <CarsManagement onBack={handleBackToDashboard} />;
      case 'clients': return <ClientsManagement onBack={handleBackToDashboard} />;
      case 'reservations': return <ReservationsManagement onBack={handleBackToDashboard} filter={reservationFilter} />;
      case 'accidents': return <AccidentsManagement onBack={handleBackToDashboard} />;
      case 'matricules': return <MatriculesManagement onBack={handleBackToDashboard} filter={reservationFilter} />;
      case 'contacts': return <ContactsManagement onBack={handleBackToDashboard} />;
      default: return renderDashboard();
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
    const recentReservations = getRecentReservations();

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

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <div className="notifications-header-left">
                  <h4>Notifications</h4>
                  {totalNotificationsCount > 0 && (
                    <span className="notification-count-badge">{totalNotificationsCount}</span>
                  )}
                </div>
                <div className="notifications-header-actions">
                  {totalNotificationsCount > 0 && (
                    <>
                      <button
                        className="notification-action-btn download"
                        onClick={generateNotificationsPDF}
                        title="Télécharger PDF"
                      >
                        <FaDownload />
                      </button>
                      <button className="clear-all-btn" onClick={clearAllNotifications}>
                        Tout effacer
                      </button>
                    </>
                  )}
                </div>
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
                      <button className="notification-close" onClick={() => clearNotification(notification.id)}>
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
          <div className="stat-card clickable" onClick={() => handleNavigation('cars', 'Gestion des Voitures')}>
            <div className="stat-header">
              <div className="stat-icon"><FaCar className="car-icon" /></div>
              {totalNotificationsCount > 0 && (
                <div className="stat-alert"><FaExclamationTriangle /></div>
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

          <div className="stat-card clickable" onClick={() => handleNavigation('clients', 'Gestion des Clients')}>
            <div className="stat-header">
              <div className="stat-icon"><FaUsers className="client-icon" /></div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Total Clients</div>
              <div className="stat-value">{clients.length}</div>
              <div className="stat-change positive">Utilisateurs actifs</div>
            </div>
          </div>

          <div className="stat-card clickable active" onClick={() => handleNavigation('matricules', 'Immatriculations Actives', 'active')}>
            <div className="stat-header">
              <div className="stat-icon"><FaCheck className="active-icon" /></div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Immatriculations Actives</div>
              <div className="stat-value">{activeMatricules.length}</div>
              <div className="stat-details">
                <span className="stat-detail positive">Prêtes à la location</span>
              </div>
              <div className="stat-change positive">Disponibles</div>
            </div>
          </div>

          <div className="stat-card clickable inactive" onClick={() => handleNavigation('matricules', 'Immatriculations Inactives', 'inactive')}>
            <div className="stat-header">
              <div className="stat-icon"><FaBan className="inactive-icon" /></div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Immatriculations Inactives</div>
              <div className="stat-value">{inactiveMatricules.length}</div>
              <div className="stat-details">
                <span className="stat-detail negative">Maintenance ou accidents</span>
              </div>
              <div className="stat-change negative">Indisponibles</div>
            </div>
          </div>

          <div className="stat-card clickable reserved" onClick={() => handleNavigation('matricules', 'Immatriculations Réservées', 'reserved')}>
            <div className="stat-header">
              <div className="stat-icon"><FaCalendarAlt className="reserved-icon" /></div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Immatriculations Réservées</div>
              <div className="stat-value">{reservedMatricules.length}</div>
              <div className="stat-details">
                <span className="stat-detail warning">Actuellement louées</span>
              </div>
              <div className="stat-change reserved">En cours d'utilisation</div>
            </div>
          </div>

          <div className="stat-card clickable urgent" onClick={() => handleNavigation('matricules', 'Immatriculations en Retard', 'late')}>
            <div className="stat-header">
              <div className="stat-icon"><FaExclamationTriangle className="late-icon" /></div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Immatriculations en Retard</div>
              <div className="stat-value">{lateMatricules.length}</div>
              <div className="stat-details">
                <span className="stat-detail urgent">Retour en retard</span>
              </div>
              <div className="stat-change urgent">Attention requise</div>
            </div>
          </div>

          <div className="stat-card clickable" onClick={() => handleNavigation('reservations', 'Toutes les Réservations')}>
            <div className="stat-header">
              <div className="stat-icon"><FaCalendarAlt className="reservation-icon" /></div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Total Réservations</div>
              <div className="stat-value">{reservations.length}</div>
              <div className="stat-change positive">Tous statuts</div>
            </div>
          </div>

          <div className="stat-card clickable" onClick={() => handleNavigation('accidents', 'Gestion des Accidents')}>
            <div className="stat-header">
              <div className="stat-icon"><FaExclamationTriangle className="accident-icon" /></div>
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

          <div className="stat-card clickable pending" onClick={() => handleNavigation('reservations', 'Réservations en Attente', 'pending')}>
            <div className="stat-header">
              <div className="stat-icon"><FaClock className="pending-icon" /></div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Réservations en Attente</div>
              <div className="stat-value">{pendingReservations.length}</div>
              <div className="stat-change pending">En attente de confirmation</div>
            </div>
          </div>

          <div className="stat-card clickable confirmed" onClick={() => handleNavigation('reservations', 'Réservations Confirmées', 'confirmed')}>
            <div className="stat-header">
              <div className="stat-icon"><FaCalendarAlt className="confirmed-icon" /></div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Réservations Confirmées</div>
              <div className="stat-value">{confirmedReservations.length}</div>
              <div className="stat-change confirmed">Locations actives</div>
            </div>
          </div>

          <div className="stat-card clickable completed" onClick={() => handleNavigation('reservations', 'Réservations Terminées', 'completed')}>
            <div className="stat-header">
              <div className="stat-icon"><FaCalendarAlt className="completed-icon" /></div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Réservations Terminées</div>
              <div className="stat-value">{completedReservations.length}</div>
              <div className="stat-change completed">Locations terminées</div>
            </div>
          </div>

          <div className="stat-card clickable contacted" onClick={() => handleNavigation('reservations', 'Réservations Contactées', 'contacted')}>
            <div className="stat-header">
              <div className="stat-icon"><FaEnvelope className="contacted-icon" /></div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Réservations Contactées</div>
              <div className="stat-value">{contactedReservations.length}</div>
              <div className="stat-change contacted">Client contacté</div>
            </div>
          </div>

          <div className="stat-card clickable cancelled" onClick={() => handleNavigation('reservations', 'Réservations Annulées', 'cancelled')}>
            <div className="stat-header">
              <div className="stat-icon"><FaCalendarAlt className="cancelled-icon" /></div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Réservations Annulées</div>
              <div className="stat-value">{cancelledReservations.length}</div>
              <div className="stat-change cancelled">Réservations annulées</div>
            </div>
          </div>

          <div className="stat-card clickable urgent" onClick={() => handleNavigation('reservations', 'Réservations en Retard', 'retard')}>
            <div className="stat-header">
              <div className="stat-icon"><FaExclamationTriangle className="overdue-icon" /></div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Réservations en Retard</div>
              <div className="stat-value">{overdueReservations.length}</div>
              <div className="stat-change urgent">Attention requise</div>
            </div>
          </div>

          <div className="stat-card clickable" onClick={() => handleNavigation('contacts', 'Gestion des Contacts')}>
            <div className="stat-header">
              <div className="stat-icon"><FaEnvelope className="contact-icon" /></div>
            </div>
            <div className="stat-content">
              <div className="stat-title">Messages de Contact</div>
              <div className="stat-value">{contacts.length}</div>
              <div className="stat-change positive">Nouvelles demandes</div>
            </div>
          </div>
        </div>

        {/* Section Voitures les Plus Louées */}
        <div className="most-rented-section">
          <div className="section-header">
            <h3 className="section-title"><FaTrophy /> Voitures les Plus Louées</h3>
            <div className="section-actions">
              <button className="action-btn" onClick={() => handleExport('popular-cars', mostRentedCars, 'voitures_populaires.csv')}>
                <FaFileExport /> Exporter
              </button>
            </div>
          </div>
          <div className="most-rented-list">
            {mostRentedCars.length > 0 ? (
              mostRentedCars.map((car, index) => (
                <div key={car.id} className="most-rented-item">
                  <div className="car-rank">
                    <div className={`rank-badge rank-${index + 1}`}>#{index + 1}</div>
                    {index === 0 && <FaTrophy className="trophy-icon" />}
                  </div>
                  <div className="car-image">
                    {car.image ? (
                      <img src={`https://oulfa-back-production.up.railway.app/storage/${car.image}`} alt={car.brand} />
                    ) : (
                      <div className="car-image-placeholder"><FaCar /></div>
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
                    <div className="car-status">{getStatusBadge(car.status)}</div>
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
              <h3 className="section-title"><FaCalendarAlt /> Réservations Récentes</h3>
              <div className="section-actions">
                <button className="action-btn" onClick={() => dispatch(fetchReservations())} title="Rafraîchir">
                  <FaSyncAlt />
                </button>
                <button className="action-btn" onClick={() => handleExport('reservations', reservations, 'reservations.csv')}>
                  <FaFileExport /> Exporter
                </button>
              </div>
            </div>
            <div className="table-container">
              {recentReservations.length > 0 ? (
                /* ✅ Horizontal scroll wrapper added */
                <div style={{ overflowX: 'auto' }}>
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
                      {recentReservations.map(reservation => {
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
                            <td>{reservation.client?.nom} {reservation.client?.prenom}</td>
                            <td>{reservation.car?.brand} {reservation.car?.model}</td>
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
                            <td><span className="currency-symbol">MAD</span>{reservation.total_price}</td>
                            <td>{isOverdue ? getStatusBadge('retard') : getStatusBadge(reservation.status)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
              <h3 className="section-title"><FaEnvelope /> Contacts Récents</h3>
              <div className="section-actions">
                <button className="action-btn" onClick={() => handleExport('contacts', contacts, 'contacts.csv')}>
                  <FaFileExport /> Exporter
                </button>
              </div>
            </div>
            <div className="table-container">
              {contacts.length > 0 ? (
                /* ✅ Horizontal scroll wrapper added */
                <div style={{ overflowX: 'auto' }}>
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
                </div>
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
      {currentView !== 'dashboard' && (
        <div className="dashboard-header">
          <button className="back-button" onClick={handleBackToDashboard}>
            <FaArrowLeft /> Retour au Tableau de Bord
          </button>
          <h1 className="dashboard-title">{currentTitle}</h1>
        </div>
      )}

      {renderCurrentView()}

      <style>{`
        /* ================= Container ================= */
        .dashboard-container { padding: 20px; background: #f8fafc; color: #334155; }

        .dashboard-header {
          display: flex; align-items: center; gap: 15px;
          margin-bottom: 30px; padding-bottom: 15px;
          border-bottom: 2px solid #e2e8f0;
        }
        .back-button {
          display: flex; align-items: center; gap: 8px;
          background: #6c757d; color: white; border: none;
          padding: 10px 15px; border-radius: 0.5rem;
          cursor: pointer; transition: background 0.3s ease;
          font-family: inherit;
        }
        .back-button:hover { background: #5a6268; }
        .dashboard-title { color: #0f172a; margin: 0; font-size: 1.8rem; }

        /* ================= Notifications ================= */
        .notifications-container { position: relative; display: inline-block; margin-bottom: 20px; }
        .notifications-bell {
          position: relative;
          background: #f8f9fa; border: 2px solid #e2e8f0;
          border-radius: 50%; width: 50px; height: 50px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 1.2rem; color: #64748b;
          transition: all 0.3s ease;
        }
        .notifications-bell:hover { background: #e2e8f0; color: #334155; }
        .notifications-bell.has-notifications {
          color: #dc3545; border-color: #dc3545; animation: pulse 2s infinite;
        }
        .notification-count {
          position: absolute; top: -5px; right: -5px;
          background: #dc3545; color: white; border-radius: 50%;
          width: 20px; height: 20px; font-size: 0.7rem;
          display: flex; align-items: center; justify-content: center;
          font-weight: bold;
        }
        .notifications-dropdown {
          position: absolute; top: 100%; left: 0; width: 400px;
          background: white; border: 1px solid #e2e8f0;
          border-radius: 0.75rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 1000; margin-top: 10px;
        }
        .notifications-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 15px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;
        }
        .notifications-header-left { display: flex; align-items: center; gap: 10px; }
        .notifications-header h4 { margin: 0; color: #334155; }
        .notifications-header-actions { display: flex; align-items: center; gap: 10px; }
        .notification-count-badge {
          background: #dc3545; color: white; border-radius: 12px;
          padding: 2px 8px; font-size: 0.75rem; font-weight: bold;
          min-width: 24px; text-align: center;
        }
        .notification-action-btn {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border: none; border-radius: 0.5rem;
          background: #3b82f6; color: white; cursor: pointer;
          transition: all 0.3s ease; font-size: 0.9rem;
        }
        .notification-action-btn.download { background: #10b981; }
        .notification-action-btn.download:hover { background: #059669; }
        .clear-all-btn {
          background: none; border: none; color: #64748b; cursor: pointer;
          font-size: 0.8rem; padding: 8px 12px; border-radius: 0.5rem;
          transition: all 0.3s ease;
        }
        .clear-all-btn:hover { background: #e9ecef; color: #dc3545; }
        .notifications-list { max-height: 500px; overflow-y: auto; }
        .notification-item {
          display: flex; align-items: flex-start; padding: 12px 15px;
          border-bottom: 1px solid #f1f3f4; transition: background-color 0.2s;
        }
        .notification-item:hover { background: #f8fafc; }
        .notification-item.urgent { background: #fff5f5; border-left: 3px solid #dc3545; }
        .notification-item.warning { background: #fff9db; border-left: 3px solid #f59e0b; }
        .notification-item.waiting { background: #fff0f0; border-left: 3px solid #ef4444; }
        .notification-item.accident { background: #fff0f0; border-left: 3px solid #ef4444; }
        .notification-item.technical_visit { background: #e7f3ff; border-left: 3px solid #3b82f6; }
        .notification-item.car_tax { background: #fff0e6; border-left: 3px solid #f97316; }
        .notification-item.insurance { background: #e6f3ff; border-left: 3px solid #06b6d4; }
        .notification-item.maintenance { background: #fff9e6; border-left: 3px solid #f59e0b; }
        .notification-item.additional_maintenance { background: #e6ffe6; border-left: 3px solid #10b981; }
        .notification-item.periodic_km { background: #f0f8ff; border-left: 3px solid #3b82f6; }
        .notification-icon {
          margin-right: 10px; color: #64748b; margin-top: 2px;
          font-size: 0.9rem; min-width: 20px;
        }
        .notification-item.urgent .notification-icon { color: #dc3545; }
        .notification-item.warning .notification-icon { color: #f59e0b; }
        .notification-item.waiting .notification-icon,
        .notification-item.accident .notification-icon { color: #ef4444; }
        .notification-item.technical_visit .notification-icon { color: #3b82f6; }
        .notification-item.car_tax .notification-icon { color: #f97316; }
        .notification-item.insurance .notification-icon { color: #06b6d4; }
        .notification-item.maintenance .notification-icon { color: #f59e0b; }
        .notification-item.additional_maintenance .notification-icon { color: #10b981; }
        .notification-item.periodic_km .notification-icon { color: #3b82f6; }
        .notification-content { flex: 1; min-width: 0; }
        .notification-message {
          margin: 0 0 5px 0; font-size: 0.85rem;
          color: #334155; word-wrap: break-word;
        }
        .notification-date {
          color: #64748b; font-size: 0.75rem;
          display: block; line-height: 1.3;
        }
        .notification-close {
          background: none; border: none; color: #64748b;
          cursor: pointer; font-size: 1.2rem; padding: 0;
          width: 20px; height: 20px; display: flex;
          align-items: center; justify-content: center;
          flex-shrink: 0; margin-left: 5px;
        }
        .notification-close:hover { color: #dc3545; }
        .no-notifications { padding: 30px 20px; text-align: center; color: #64748b; }
        .no-notifications svg { font-size: 2rem; margin-bottom: 10px; opacity: 0.5; }

        /* ================= Stats ================= */
        .stats-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px; margin-bottom: 30px;
        }
        .stat-card {
          background: white; border: 1px solid #e2e8f0;
          border-radius: 0.75rem; padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: all 0.3s ease; position: relative;
        }
        .stat-card.clickable { cursor: pointer; }
        .stat-card.clickable:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        .stat-card.active { border-color: #10b981; background: #e6ffe6; }
        .stat-card.inactive { border-color: #ef4444; background: #fff5f5; }
        .stat-card.pending { border-color: #f59e0b; background: #fff9db; }
        .stat-card.confirmed { border-color: #3b82f6; background: #e7f3ff; }
        .stat-card.completed { border-color: #10b981; background: #e6ffe6; }
        .stat-card.contacted { border-color: #64748b; background: #f8f9fa; }
        .stat-card.cancelled { border-color: #ef4444; background: #fff5f5; }
        .stat-card.urgent { border-color: #ef4444; background: #fff5f5; }
        .stat-card.reserved { border-color: #f59e0b; background: #fff9db; }
        .stat-header {
          display: flex; justify-content: space-between;
          align-items: flex-start; margin-bottom: 15px;
        }
        .stat-icon {
          width: 50px; height: 50px; border-radius: 0.75rem;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; background: transparent !important;
        }
        .car-icon { color: #3b82f6; }
        .client-icon { color: #10b981; }
        .accident-icon { color: #ef4444; }
        .active-icon { color: #10b981; }
        .inactive-icon { color: #ef4444; }
        .reserved-icon { color: #f59e0b; }
        .late-icon { color: #ef4444; }
        .reservation-icon { color: #f97316; }
        .pending-icon { color: #f59e0b; }
        .confirmed-icon { color: #3b82f6; }
        .completed-icon { color: #10b981; }
        .contacted-icon { color: #64748b; }
        .cancelled-icon { color: #ef4444; }
        .overdue-icon { color: #ef4444; }
        .contact-icon { color: #06b6d4; }
        .stat-alert {
          position: absolute; top: -5px; right: -5px;
          background: #dc3545; color: white; border-radius: 50%;
          width: 20px; height: 20px; display: flex;
          align-items: center; justify-content: center; font-size: 0.7rem;
        }
        .stat-content { text-align: left; }
        .stat-title {
          font-size: 0.9rem; color: #64748b;
          margin-bottom: 5px; font-weight: 600;
        }
        .stat-value {
          font-size: 2rem; font-weight: bold;
          color: #0f172a; margin-bottom: 10px;
        }
        .stat-details { display: flex; flex-direction: column; gap: 4px; }
        .stat-detail {
          font-size: 0.8rem; padding: 2px 8px;
          border-radius: 12px; display: inline-block; width: fit-content;
        }
        .stat-detail.positive { background: #dcfce7; color: #166534; }
        .stat-detail.negative { background: #fee2e2; color: #991b1b; }
        .stat-detail.warning { background: #fef3c7; color: #92400e; }
        .stat-detail.pending { background: #fef3c7; color: #92400e; }
        .stat-detail.confirmed { background: #dbeafe; color: #1e40af; }
        .stat-detail.urgent { background: #fee2e2; color: #991b1b; }
        .stat-change { font-size: 0.8rem; font-weight: 600; margin-top: 8px; }
        .stat-change.positive { color: #10b981; }
        .stat-change.negative { color: #ef4444; }
        .stat-change.pending { color: #f59e0b; }
        .stat-change.confirmed { color: #3b82f6; }
        .stat-change.completed { color: #10b981; }
        .stat-change.contacted { color: #64748b; }
        .stat-change.cancelled { color: #ef4444; }
        .stat-change.urgent { color: #ef4444; }
        .stat-change.reserved { color: #f59e0b; }
        .stat-notification {
          margin-top: 8px; padding: 6px 10px;
          background: #fef3c7; border: 1px solid #fde68a;
          border-radius: 0.375rem; font-size: 0.75rem;
          color: #92400e; line-height: 1.3;
        }

        /* ================= Sections ================= */
        .most-rented-section,
        .data-section {
          background: white; border: 1px solid #e2e8f0;
          border-radius: 0.75rem; padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          margin-top: 30px;
        }
        .recent-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 20px; margin-top: 30px;
        }
        .recent-grid .data-section { margin-top: 0; }
        .section-header {
          display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 15px;
        }
        .section-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 1.2rem; font-weight: 600;
          color: #0f172a; margin: 0;
        }
        .section-actions { display: flex; gap: 10px; }
        .action-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: #6c757d; color: white; border: none;
          padding: 8px 12px; border-radius: 0.375rem;
          cursor: pointer; font-size: 0.8rem;
          transition: all 0.2s; font-family: inherit;
        }
        .action-btn:hover { background: #545b62; }

        /* ================= Most rented list ================= */
        .most-rented-list { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
        .most-rented-item {
          display: flex; align-items: center; background: #f8fafc;
          border-radius: 0.5rem; padding: 15px;
          border: 1px solid #e2e8f0; transition: all 0.3s ease;
          position: relative;
        }
        .most-rented-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          background: white;
        }
        .car-rank { display: flex; align-items: center; gap: 10px; margin-right: 15px; min-width: 60px; }
        .rank-badge {
          padding: 6px 10px; border-radius: 20px;
          font-size: 0.8rem; font-weight: bold; color: white;
          min-width: 40px; text-align: center;
        }
        .rank-1 { background: linear-gradient(135deg, #FFD700, #FFA500); }
        .rank-2 { background: linear-gradient(135deg, #C0C0C0, #A9A9A9); }
        .rank-3 { background: linear-gradient(135deg, #CD7F32, #8B4513); }
        .rank-4, .rank-5 { background: #6c757d; }
        .trophy-icon { color: #FFD700; font-size: 1.2rem; }
        .car-image {
          width: 80px; height: 60px; border-radius: 0.375rem;
          overflow: hidden; margin-right: 15px;
          background: #e2e8f0; display: flex;
          align-items: center; justify-content: center; flex-shrink: 0;
        }
        .car-image img { width: 100%; height: 100%; object-fit: cover; }
        .car-image-placeholder { font-size: 1.5rem; color: #64748b; }
        .car-info { flex: 1; margin-right: 15px; }
        .car-info .car-name { font-size: 1.1rem; font-weight: bold; color: #0f172a; margin: 0 0 8px 0; }
        .car-info .car-details { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
        .car-info .car-details span {
          padding: 2px 8px; background: white; border-radius: 12px;
          font-size: 0.8rem; color: #64748b; border: 1px solid #e2e8f0;
        }
        .car-price { font-weight: bold; color: #10b981; font-size: 1rem; }
        .car-stats {
          display: flex; flex-direction: column;
          align-items: flex-end; gap: 8px; min-width: 120px;
        }
        .reservation-count {
          display: flex; flex-direction: column;
          align-items: center; gap: 2px;
        }
        .reservation-count .count { font-size: 1.3rem; font-weight: bold; color: #0f172a; }
        .reservation-count .label { font-size: 0.8rem; color: #64748b; }

        /* ================= Tables (match AccidentsManagement) ================= */
        .table-container { overflow-x: auto; }

        .data-table {
          width: 100%; font-size: 0.875rem;
          border-collapse: collapse; min-width: 700px;
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

        .days-left.warning { color: #ef4444; font-weight: 600; }
        .days-left.expired { color: #ef4444; font-weight: 600; font-style: italic; }
        tr.ending-soon { background: #fff9db !important; }
        tr.overdue { background: #fff5f5 !important; }
        .currency-symbol { font-weight: 600; color: #10b981; margin-right: 2px; }

        /* ================= Status badges ================= */
        .status-badge {
          display: inline-flex; align-items: center; gap: 0.25rem;
          padding: 0.25rem 0.625rem; border-radius: 9999px;
          font-size: 0.7rem; font-weight: 500; white-space: nowrap;
        }
        .status-available { background: #dcfce7; color: #166534; }
        .status-unavailable { background: #fee2e2; color: #991b1b; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-confirmed { background: #dcfce7; color: #166534; }
        .status-completed { background: #dcfce7; color: #166534; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        .status-contacted { background: #e0e7ff; color: #3730a3; }
        .status-waiting { background: #ffedd5; color: #9a3412; }
        .status-retard { background: #ffedd5; color: #9a3412; }
        .status-evaluation-owner { background: #e0e7ff; color: #3730a3; }
        .status-contact-expert { background: #fce7f3; color: #9d174d; }
        .status-evaluation-expert { background: #f3e8ff; color: #6b21a5; }
        .status-fixed { background: #ffedd5; color: #9a3412; }

        /* ================= Loading / Empty ================= */
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

        .no-data { text-align: center; padding: 40px 20px; color: #64748b; }
        .no-data svg { margin-bottom: 15px; opacity: 0.5; }

        /* ================= Notifications messages ================= */
        .notification-success, .notification-error {
          position: fixed; top: 20px; right: 20px; z-index: 10000;
          animation: slideInRight 0.3s ease-out;
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .notification-success .notification-content {
          background: #dcfce7; color: #166534;
          padding: 12px 20px; border-radius: 0.5rem;
          border: 1px solid #bbf7d0; display: flex;
          align-items: center; gap: 10px;
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        }
        .notification-error .notification-content {
          background: #fee2e2; color: #991b1b;
          padding: 12px 20px; border-radius: 0.5rem;
          border: 1px solid #fecaca; display: flex;
          align-items: center; gap: 10px;
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        /* ================= Responsive ================= */
        @media (max-width: 768px) {
          .notifications-dropdown { width: 300px; left: -50px; }
          .stats-grid { grid-template-columns: 1fr; }
          .most-rented-item {
            flex-direction: column; align-items: flex-start; text-align: left;
          }
          .car-rank { margin-right: 0; margin-bottom: 10px; }
          .car-image { margin-right: 0; margin-bottom: 10px; }
          .car-info { margin-right: 0; margin-bottom: 10px; }
          .car-stats {
            flex-direction: row; justify-content: space-between;
            width: 100%; align-items: center;
          }
          .recent-grid { grid-template-columns: 1fr; }
          .dashboard-container { padding: 10px; }
        }
      `}</style>
    </div>
  );
};

export default DashboardContent;