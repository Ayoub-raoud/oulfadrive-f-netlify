import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt,
  FaCarCrash, FaCar, FaMoneyBill, FaClock, FaChevronLeft,
  FaChevronRight, FaSearch, FaFilter, FaTimes, FaExclamationTriangle,
  FaPrint, FaReceipt, FaHistory, FaCalendarDay, FaBusinessTime
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  fetchClients,
  selectClients,
  selectClientsLoading,
  selectReservations,
  selectAccidents
} from '../Redux/store';

const GestionClients = () => {
  const dispatch = useDispatch();
  const clients = useSelector(selectClients);
  const reservations = useSelector(selectReservations);
  const accidents = useSelector(selectAccidents);
  const loading = useSelector(selectClientsLoading);
  
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [reservationsPage, setReservationsPage] = useState(1);
  const [accidentsPage, setAccidentsPage] = useState(1);
  const [paymentHistoryPage, setPaymentHistoryPage] = useState(1);
  const detailsItemsPerPage = 6;

  // États pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  // Helper function to safely get values
  const getSafeValue = (value, defaultValue = '') => {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    return value;
  };

  // Helper function to format dates safely
  const formatDateSafe = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('fr-FR');
    } catch {
      return '';
    }
  };

  // Filtrer les réservations avec remaining_amount > 0
  const getReservationsWithRemainingAmount = () => {
    return reservations.filter(reservation => 
      parseFloat(getSafeValue(reservation.remaining_amount, 0)) > 0
    );
  };

  // Obtenir les clients qui ont des réservations avec remaining_amount > 0
  const getClientsWithPendingPayments = () => {
    const reservationsWithRemaining = getReservationsWithRemainingAmount();
    const clientIdsWithPendingPayments = [...new Set(reservationsWithRemaining.map(r => r.client_id))];
    
    return clients.filter(client => 
      clientIdsWithPendingPayments.includes(client.id)
    );
  };

  const clientsWithPendingPayments = getClientsWithPendingPayments();
  const reservationsWithRemaining = getReservationsWithRemainingAmount();

  // Obtenir les villes uniques pour le filtre
  const uniqueCities = [...new Set(clientsWithPendingPayments.map(client => getSafeValue(client.city)).filter(Boolean))];

  // Filtrer les clients basé sur la recherche et les filtres
  const filteredClients = clientsWithPendingPayments.filter(client => {
    // Filtre de recherche
    const matchesSearch = searchTerm === '' || 
      getSafeValue(client.nom, '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSafeValue(client.prenom, '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSafeValue(client.email, '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSafeValue(client.telephone, '').includes(searchTerm);

    // Filtre de ville
    const matchesCity = cityFilter === 'all' || getSafeValue(client.city) === cityFilter;

    return matchesSearch && matchesCity;
  });

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

  const clearFilters = () => {
    setSearchTerm('');
    setCityFilter('all');
    setCurrentPage(1);
  };

  // Fonctions pour les détails du client
  const handleViewDetails = (client) => {
    setSelectedClient(client);
    setReservationsPage(1);
    setAccidentsPage(1);
    setPaymentHistoryPage(1);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedClient(null);
  };

  // Obtenir les réservations du client avec remaining_amount > 0
  const getClientReservationsWithPendingPayments = (clientId) => {
    return reservationsWithRemaining.filter(r => r.client_id === clientId);
  };

  const getClientAccidents = (clientId) => {
    return accidents.filter(a => a.client_id === clientId);
  };

  // Obtenir l'historique des paiements pour un client
  const getClientPaymentHistory = (clientId) => {
    const clientReservations = reservations.filter(r => r.client_id === clientId);
    let paymentHistory = [];
    
    clientReservations.forEach(reservation => {
      if (reservation.payment_history && Array.isArray(reservation.payment_history)) {
        reservation.payment_history.forEach(payment => {
          paymentHistory.push({
            ...payment,
            reservation_id: reservation.id,
            car_info: `${getSafeValue(reservation.car?.brand)} ${getSafeValue(reservation.car?.model)}`,
            reservation_period: `${formatDateSafe(reservation.start_date)} - ${formatDateSafe(reservation.end_date)}`,
            car_matricule: getSafeValue(reservation.matricule?.matricule_code)
          });
        });
      }
    });
    
    return paymentHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Pagination pour les détails
  const clientReservations = selectedClient ? getClientReservationsWithPendingPayments(selectedClient.id) : [];
  const clientAccidents = selectedClient ? getClientAccidents(selectedClient.id) : [];
  const clientPaymentHistory = selectedClient ? getClientPaymentHistory(selectedClient.id) : [];

  const totalReservationsPages = Math.ceil(clientReservations.length / detailsItemsPerPage);
  const totalAccidentsPages = Math.ceil(clientAccidents.length / detailsItemsPerPage);
  const totalPaymentHistoryPages = Math.ceil(clientPaymentHistory.length / detailsItemsPerPage);

  const currentReservations = clientReservations.slice(
    (reservationsPage - 1) * detailsItemsPerPage,
    reservationsPage * detailsItemsPerPage
  );

  const currentAccidents = clientAccidents.slice(
    (accidentsPage - 1) * detailsItemsPerPage,
    accidentsPage * detailsItemsPerPage
  );

  const currentPaymentHistory = clientPaymentHistory.slice(
    (paymentHistoryPage - 1) * detailsItemsPerPage,
    paymentHistoryPage * detailsItemsPerPage
  );

  const handleReservationsPageChange = (page) => {
    setReservationsPage(page);
  };

  const handleAccidentsPageChange = (page) => {
    setAccidentsPage(page);
  };

  const handlePaymentHistoryPageChange = (page) => {
    setPaymentHistoryPage(page);
  };

  // Obtenir les statistiques des clients
  const getClientStats = () => {
    const totalClients = clientsWithPendingPayments.length;
    const totalPendingReservations = reservationsWithRemaining.length;
    const totalAmountPending = reservationsWithRemaining.reduce((total, reservation) => 
      total + parseFloat(getSafeValue(reservation.remaining_amount, 0)), 0
    );
    
    return { totalClients, totalPendingReservations, totalAmountPending };
  };

  const stats = getClientStats();

  const getInitials = (client) => {
    return `${getSafeValue(client.prenom?.[0], '')}${getSafeValue(client.nom?.[0], '')}`.toUpperCase();
  };

  // Obtenir les compteurs pour chaque client
  const getClientReservationsCount = (clientId) => {
    return getClientReservationsWithPendingPayments(clientId).length;
  };

  const getClientAccidentsCount = (clientId) => {
    return getClientAccidents(clientId).length;
  };

  // Obtenir le montant total en attente pour un client
  const getClientTotalPendingAmount = (clientId) => {
    const clientReservations = getClientReservationsWithPendingPayments(clientId);
    return clientReservations.reduce((total, reservation) => 
      total + parseFloat(getSafeValue(reservation.remaining_amount, 0)), 0
    );
  };

  // ✅ FIXED: Calculate rental days correctly (same as reservations component)
  const calculateRentalDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Reset times to compare only dates
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays === 0 ? 1 : diffDays;
  };

  // ✅ NEW: Calculate days overdue
  const calculateDaysOverdue = (reservation) => {
    if (!reservation.end_date) return 0;
    
    const today = new Date();
    const end = new Date(reservation.end_date);
    
    // Reset times to compare only dates
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = today - end;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  // Badge de statut pour les réservations
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-badge status-pending', text: 'En attente' },
      confirmed: { class: 'status-badge status-confirmed', text: 'Confirmée' },
      contacted: { class: 'status-badge status-contacted', text: 'Contacté' },
      completed: { class: 'status-badge status-completed', text: 'Terminée' },
      cancelled: { class: 'status-badge status-cancelled', text: 'Annulée' },
      retard: { class: 'status-badge status-retard', text: 'En retard' }
    };

    const config = statusConfig[status] || { class: 'status-badge status-pending', text: status };
    
    return (
      <span className={config.class}>
        {config.text}
      </span>
    );
  };

  // Fonction pour générer le PDF des détails du client
  const generateClientDetailsPDF = async (client) => {
    try {
      // Get client data with safe defaults
      const clientId = getSafeValue(client?.id, 'N/A');
      const clientFirstName = getSafeValue(client?.prenom, '');
      const clientLastName = getSafeValue(client?.nom, '');
      const clientFullName = `${clientFirstName} ${clientLastName}`.trim() || 'Non spécifié';
      const clientEmail = getSafeValue(client?.email, 'Non spécifié');
      const clientPhone = getSafeValue(client?.telephone, 'Non spécifié');
      const clientCity = getSafeValue(client?.city, 'Non spécifié');
      const clientCIN = getSafeValue(client?.cin_number, 'Non spécifié');
      const clientLicense = getSafeValue(client?.driver_license_number, 'Non spécifié');
      const clientBirthDate = formatDateSafe(client?.date_naissance);
      
      // Get client reservations
      const clientReservations = getClientReservationsWithPendingPayments(clientId);
      const totalPendingAmount = getClientTotalPendingAmount(clientId);
      const reservationsCount = getClientReservationsCount(clientId);
      
      // Calculate overdue days for all reservations
      let totalOverdueDays = 0;
      let hasOverdueReservations = false;
      
      clientReservations.forEach(reservation => {
        const overdueDays = calculateDaysOverdue(reservation);
        if (overdueDays > 0) {
          totalOverdueDays += overdueDays;
          hasOverdueReservations = true;
        }
      });

      // Create PDF content HTML
      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              background: white;
            }
            
            .credit-pdf-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 10px;
              font-family: Arial, sans-serif;
              font-size: 8px;
              color: #000;
              background: #fff;
              border: 1px solid #000;
              line-height: 1.1;
              height: auto;
              min-height: auto;
            }
            
            .credit-pdf-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
              border-bottom: 2px solid #000;
              padding-bottom: 6px;
            }
            
            .header-left {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              flex: 1;
            }
            
            .location-text {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 3px;
            }
            
            .phone-number {
              font-size: 9px;
              color: #000;
              font-weight: bold;
            }
            
            .header-center {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            
            .company-name {
              font-weight: 900;
              font-size: 14px;
              color: #354191;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .company-subtitle {
              font-size: 9px;
              color: #666;
              font-weight: bold;
            }
            
            .header-right {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              flex: 1;
            }
            
            .arabic-text {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 3px;
              font-family: 'Arial', sans-serif;
              direction: rtl;
            }
            
            .report-number-red {
              font-weight: 900;
              font-size: 10px;
              color: #ff0000;
              font-family: monospace;
              background: #fff;
              padding: 2px 4px;
              border: 1px solid #ff0000;
              border-radius: 2px;
            }
            
            .credit-pdf-title {
              text-align: center;
              font-weight: 700;
              font-size: 10px;
              margin: 0 0 8px 0;
              text-transform: uppercase;
            }
            
            .section-header-pdf {
              background: #354191;
              color: white;
              padding: 4px 15px;
              border-radius: 20px;
              font-weight: 700;
              font-size: 12px;
              margin: 10px 0 6px 0;
              text-transform: uppercase;
              border-bottom: 1px solid #000;
            }
            
            .section-header-pdf h2 {
              margin: 0;
              font-size: 12px;
            }
            
            .info-grid {
              display: flex;
              gap: 20px;
              margin-bottom: 10px;
            }
            
            .info-column {
              flex: 1;
            }
            
            .form-line {
              display: flex;
              align-items: center;
              margin: 2px 0;
            }
            
            .form-line label {
              width: 180px;
              font-size: 12px;
              white-space: nowrap;
              background-color: #ffffaa;
              color: #354191;
              border-radius: 12px;
              padding: 2px 4px;
              margin-right: 5px;
            }
            
            .dots-line {
              flex-grow: 1;
              border-bottom: 1px dotted #000;
              height: 1px;
              position: relative;
              top: 1px;
              min-height: 8px;
              display: flex;
              align-items: center;
              padding: 0 2px;
              font-size: 12px;
            }
            
            .summary-section {
              margin-bottom: 10px;
            }
            
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
              margin-bottom: 10px;
            }
            
            .summary-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 4px 8px;
              border: 1px solid #ddd;
              border-radius: 5px;
              background: #f8f9fa;
            }
            
            .summary-item label {
              font-weight: bold;
              font-size: 9px;
              color: #354191;
            }
            
            .summary-value {
              font-weight: bold;
              font-size: 10px;
              color: #000;
            }
            
            .reservations-section {
              margin-bottom: 10px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 7px;
              margin-bottom: 8px;
            }
            
            table th {
              background: #354191;
              color: white;
              font-weight: bold;
              padding: 4px 6px;
              text-align: center;
              border: 1px solid #354191;
              font-size: 8px;
            }
            
            table td {
              padding: 3px 5px;
              border: 1px solid #ddd;
              vertical-align: top;
            }
            
            .center-text {
              text-align: center;
            }
            
            .right-text {
              text-align: right;
            }
            
            .overdue-text {
              color: #ff0000;
              font-weight: bold;
            }
            
            .overdue-amount {
              color: #ff0000;
              font-weight: bold;
            }
            
            .status-label {
              padding: 2px 4px;
              border-radius: 3px;
              font-size: 6px;
              font-weight: bold;
              text-transform: uppercase;
            }
            
            .status-label.retard {
              background: #ffcccc;
              color: #ff0000;
            }
            
            .status-label.pending {
              background: #fff3cd;
              color: #856404;
            }
            
            .status-label.confirmed {
              background: #d4edda;
              color: #155724;
            }
            
            .status-label.completed {
              background: #d4edda;
              color: #155724;
            }
            
            .reservation-total {
              display: flex;
              justify-content: flex-end;
              align-items: center;
              padding: 6px 10px;
              background: #ffcccc;
              border: 2px solid #ff0000;
              border-radius: 5px;
              margin-top: 5px;
            }
            
            .total-label {
              font-weight: bold;
              font-size: 10px;
              color: #ff0000;
              margin-right: 10px;
            }
            
            .total-amount {
              font-weight: bold;
              font-size: 12px;
              color: #ff0000;
            }
            
            .notes-section {
              margin-bottom: 10px;
            }
            
            .notes-content {
              padding: 8px;
              border: 1px solid #000;
              border-radius: 5px;
              font-size: 9px;
              line-height: 1.3;
              background: #f8f9fa;
            }
            
            .warning-note {
              color: #ff0000;
              font-weight: bold;
              margin-top: 5px;
              font-size: 10px;
            }
            
            .credit-pdf-footer {
              font-size: 10px;
              font-weight: 700;
              text-align: center;
              text-transform: uppercase;
              letter-spacing: 0.1px;
              line-height: 1.1;
              margin-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="credit-pdf-container" id="pdf-content">
            <header class="credit-pdf-header">
              <div class="header-left">
                <div class="location-text">RAPPORT CRÉDIT CLIENT</div>
                <div class="phone-number">0665 921 921</div>
              </div>
              <div class="header-center">
                <div class="company-name">OULFA DRIVE</div>
                <div class="company-subtitle">Gestion des Crédits</div>
              </div>
              <div class="header-right">
                <div class="arabic-text">تقرير ائتمان العميل</div>
                <div class="report-number-red">#${clientId.toString().padStart(7, '0')}</div>
              </div>
            </header>

            <h1 class="credit-pdf-title">RAPPORT DÉTAILLÉ DES CRÉDITS</h1>

            <section class="client-info-section">
              <div class="section-header-pdf">
                <h2>INFORMATIONS CLIENT</h2>
              </div>
              <div class="info-grid">
                <div class="info-column">
                  <div class="form-line">
                    <label>Nom Complet :</label>
                    <div class="dots-line">${clientFullName}</div>
                  </div>
                  <div class="form-line">
                    <label>Email :</label>
                    <div class="dots-line">${clientEmail}</div>
                  </div>
                  <div class="form-line">
                    <label>Téléphone :</label>
                    <div class="dots-line">${clientPhone}</div>
                  </div>
                  <div class="form-line">
                    <label>Date de Naissance :</label>
                    <div class="dots-line">${clientBirthDate || 'Non spécifié'}</div>
                  </div>
                </div>
                <div class="info-column">
                  <div class="form-line">
                    <label>Ville :</label>
                    <div class="dots-line">${clientCity}</div>
                  </div>
                  <div class="form-line">
                    <label>CIN/Passeport :</label>
                    <div class="dots-line">${clientCIN}</div>
                  </div>
                  <div class="form-line">
                    <label>Permis N° :</label>
                    <div class="dots-line">${clientLicense}</div>
                  </div>
                  <div class="form-line">
                    <label>Client ID :</label>
                    <div class="dots-line">#${clientId}</div>
                  </div>
                </div>
              </div>
            </section>

            <section class="summary-section">
              <div class="section-header-pdf">
                <h2>SOMMAIRE DES CRÉDITS</h2>
              </div>
              <div class="summary-grid">
                <div class="summary-item">
                  <label>Réservations en attente :</label>
                  <div class="summary-value">${reservationsCount}</div>
                </div>
                <div class="summary-item">
                  <label>Montant total en attente :</label>
                  <div class="summary-value">${totalPendingAmount.toFixed(2)} DH</div>
                </div>
                <div class="summary-item">
                  <label>Date du rapport :</label>
                  <div class="summary-value">${new Date().toLocaleDateString('fr-FR')}</div>
                </div>
                <div class="summary-item">
                  <label>Heure du rapport :</label>
                  <div class="summary-value">${new Date().toLocaleTimeString('fr-FR')}</div>
                </div>
              </div>
            </section>

            ${clientReservations.length > 0 ? `
            <section class="reservations-section">
              <div class="section-header-pdf">
                <h2>RÉSERVATIONS AVEC PAIEMENTS EN ATTENTE</h2>
              </div>
              
              <table class="reservations-table">
                <thead>
                  <tr>
                    <th>N° Réservation</th>
                    <th>Véhicule</th>
                    <th>Immatriculation</th>
                    <th>Période</th>
                    <th>Jours</th>
                    <th>Jours Retard</th>
                    <th>Prix Total</th>
                    <th>Payé</th>
                    <th>Reste à Payer</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  ${clientReservations.map((reservation) => {
                    const rentalDays = calculateRentalDays(reservation.start_date, reservation.end_date);
                    const daysOverdue = calculateDaysOverdue(reservation);
                    const carBrand = getSafeValue(reservation.car?.brand, 'N/A');
                    const carModel = getSafeValue(reservation.car?.model, 'N/A');
                    const matricule = getSafeValue(reservation.matricule?.matricule_code, 'N/A');
                    const totalPrice = parseFloat(getSafeValue(reservation.total_price, 0)).toFixed(2);
                    const amountPaid = parseFloat(getSafeValue(reservation.amount_paid, 0)).toFixed(2);
                    const remainingAmount = parseFloat(getSafeValue(reservation.remaining_amount, 0)).toFixed(2);
                    const status = getSafeValue(reservation.status, 'pending');
                    
                    return `
                      <tr>
                        <td class="center-text">#${getSafeValue(reservation.id, 'N/A')}</td>
                        <td>${carBrand} ${carModel}</td>
                        <td class="center-text">${matricule}</td>
                        <td>${formatDateSafe(reservation.start_date)} - ${formatDateSafe(reservation.end_date)}</td>
                        <td class="center-text">${rentalDays}</td>
                        <td class="center-text ${daysOverdue > 0 ? 'overdue-text' : ''}">
                          ${daysOverdue > 0 ? `+${daysOverdue} jours` : '-'}
                        </td>
                        <td class="right-text">${totalPrice} DH</td>
                        <td class="right-text">${amountPaid} DH</td>
                        <td class="right-text overdue-amount">${remainingAmount} DH</td>
                        <td class="center-text">
                          <span class="status-label ${status}">
                            ${status === 'retard' ? 'EN RETARD' : 
                             status === 'pending' ? 'EN ATTENTE' : 
                             status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
              
              <div class="reservation-total">
                <div class="total-label">TOTAL EN ATTENTE :</div>
                <div class="total-amount">${totalPendingAmount.toFixed(2)} DH</div>
              </div>
            </section>
            ` : ''}

            <section class="notes-section">
              <div class="section-header-pdf">
                <h2>NOTES ET OBSERVATIONS</h2>
              </div>
              <div class="notes-content">
                Le client <strong>${clientFullName}</strong> a un total de ${reservationsCount} réservation(s) avec paiement(s) en attente pour un montant total de <strong>${totalPendingAmount.toFixed(2)} DH</strong>.
                ${hasOverdueReservations ? `
                <div class="warning-note">
                  ⚠️ Attention : Ce client a des réservations en retard de paiement (${totalOverdueDays} jour(s) de retard total).
                </div>
                ` : ''}
                <br><br>
                <strong>Recommandations :</strong><br>
                ${hasOverdueReservations ? 
                  '• Contacter immédiatement le client pour régulariser les paiements en retard<br>' : 
                  '• Suivi régulier des échéances de paiement<br>'
                }
                • Vérifier la solvabilité du client avant toute nouvelle réservation<br>
                • Mettre à jour les coordonnées si nécessaire
              </div>
            </section>

            <footer class="credit-pdf-footer">
              OULFA DRIVE SARL AU CAPITAL 100 000.00 DH SIEGE SOCIAL: BASSATINE AL OULFA GH 3 IMMEUBLE 14 N°56 AL OULFA – CASABLANCA<br />
              RC: 580419-IF: 53743931 -TP: 35007229 ICE: 003274706000087 -TEL: 0665 92 19 21 / 0660 47 28 40 - EMAIL: OULFADRIVE@GMAIL.COM
            </footer>
          </div>
        </body>
        </html>
      `;

      // Create temporary container for PDF content
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm';
      tempContainer.style.height = 'auto';
      tempContainer.style.padding = '10px';
      tempContainer.style.boxSizing = 'border-box';
      tempContainer.style.backgroundColor = '#ffffff';
      
      // Set the HTML content
      tempContainer.innerHTML = pdfContent;
      document.body.appendChild(tempContainer);

      // Use html2canvas to capture the content
      const canvas = await html2canvas(tempContainer.querySelector('#pdf-content'), {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: 794,
        height: 1123,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: 1123,
        backgroundColor: '#ffffff'
      });

      // Clean up
      document.body.removeChild(tempContainer);

      // Create PDF
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Check if content fits on one page
      if (imgHeight > pageHeight) {
        const scale = pageHeight / imgHeight;
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        
        doc.addImage(imgData, 'PNG', (pageWidth - scaledWidth) / 2, 0, scaledWidth, scaledHeight);
      } else {
        const verticalOffset = (pageHeight - imgHeight) / 2;
        doc.addImage(imgData, 'PNG', 0, verticalOffset, imgWidth, imgHeight);
      }

      // Save and download PDF
      const fileName = `credit-client-${clientId}-${clientFirstName}-${clientLastName}.pdf`.replace(/\s+/g, '-');
      doc.save(fileName);
      
      // Also open in new window
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Crédit Client - ${clientFullName}</title></head>
            <body style="margin: 0; padding: 0;">
              <embed 
                src="${pdfUrl}" 
                type="application/pdf" 
                width="100%" 
                height="100%" 
                style="position: absolute; top: 0; left: 0;"
              />
            </body>
          </html>
        `);
      }

      // Clean up URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 1000);

      showSuccessMessage('PDF généré et téléchargé avec succès!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showErrorMessage('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
  };

  const handlePrintDetails = () => {
    if (selectedClient) {
      generateClientDetailsPDF(selectedClient);
    }
  };

  // Success and Error Messages
  const showSuccessMessage = (message) => {
    const existingNotifications = document.querySelectorAll('.success-notification, .error-notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
      <div class="notification-content">
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
        <span>${message}</span>
        <button onclick="this.parentNode.parentNode.remove()" style="background: none; border: none; color: inherit; cursor: pointer; margin-left: 10px;">
          ×
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
            <FaBusinessTime className="title-icon" />
            Clients avec Paiements en Attente
          </h1>
          <p className="section-subtitle">Gérez les clients ayant des montants restants à payer sur leurs réservations</p>
        </div>
      </div>

      {/* Cartes de Statistiques */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-content">
            <div className="stat-number">{stats.totalClients}</div>
            <div className="stat-label">Clients avec Crédits</div>
          </div>
          <FaUser className="stat-icon" />
        </div>
        <div className="stat-card stat-reservations">
          <div className="stat-content">
            <div className="stat-number">{stats.totalPendingReservations}</div>
            <div className="stat-label">Réservations en Attente</div>
          </div>
          <FaCalendarDay className="stat-icon" />
        </div>
        <div className="stat-card stat-accidents">
          <div className="stat-content">
            <div className="stat-number">{stats.totalAmountPending.toFixed(2)} MAD</div>
            <div className="stat-label">Montant Total en Attente</div>
          </div>
          <FaMoneyBill className="stat-icon" />
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

          {(searchTerm !== '' || cityFilter !== 'all') && (
            <button className="btn btn-clear" onClick={clearFilters}>
              Effacer les Filtres
            </button>
          )}
        </div>
      </div>

      {/* Résumé des Résultats */}
      <div className="results-summary">
        <span className="results-count">
          Affichage de {currentClients.length} sur {filteredClients.length} clients avec paiements en attente
        </span>
        <span className="page-info">
          Page {currentPage} sur {totalPages}
        </span>
      </div>

      <div className="content-container">
        {currentClients.length > 0 ? (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Ville</th>
                  <th>Réservations en Attente</th>
                  <th>Montant en Attente</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentClients.map(client => {
                  const reservationsCount = getClientReservationsCount(client.id);
                  const pendingAmount = getClientTotalPendingAmount(client.id);
                  const clientFirstName = getSafeValue(client.prenom, '');
                  const clientLastName = getSafeValue(client.nom, '');
                  
                  return (
                    <tr key={client.id}>
                      <td className="client-name">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="client-avatar">
                            {getInitials(client)}
                          </div>
                          <div>
                            <strong>{clientFirstName} {clientLastName}</strong>
                            <div className="client-id">#{client.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="email-cell">{getSafeValue(client.email)}</td>
                      <td className="phone-cell">{getSafeValue(client.telephone)}</td>
                      <td className="city-cell">
                        <FaMapMarkerAlt className="city-icon" />
                        {getSafeValue(client.city)}
                      </td>
                      <td className="reservations-cell">
                        <div 
                          className={`count-badge ${reservationsCount > 0 ? 'has-items' : ''}`}
                          onClick={() => handleViewDetails(client)}
                          style={{cursor: 'pointer'}}
                        >
                          <FaCalendarDay className="count-icon" />
                          {reservationsCount}
                        </div>
                      </td>
                      <td className="amount-cell">
                        <div className="amount-badge">
                          <FaMoneyBill className="amount-icon" />
                          {pendingAmount.toFixed(2)} MAD
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
                            className="action-btn print" 
                            onClick={() => generateClientDetailsPDF(client)}
                            title="Générer PDF"
                          >
                            <FaPrint />
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
            <FaUser size={48} />
            <p>
              {clientsWithPendingPayments.length === 0 
                ? 'Aucun client avec des paiements en attente' 
                : 'Aucun client ne correspond à vos critères de recherche'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de Détails du Client */}
      {showDetails && selectedClient && (
        <div className="details-modal-overlay">
          <div className="details-modal">
            <div className="details-header">
              <div className="client-header-info">
                <div className="client-avatar-large">
                  {getInitials(selectedClient)}
                </div>
                <div className="client-info">
                  <h2>{getSafeValue(selectedClient.prenom)} {getSafeValue(selectedClient.nom)}</h2>
                  <div className="client-contact">
                    <div><FaEnvelope /> {getSafeValue(selectedClient.email)}</div>
                    <div><FaPhone /> {getSafeValue(selectedClient.telephone)}</div>
                    <div><FaMapMarkerAlt /> {getSafeValue(selectedClient.city)}</div>
                  </div>
                  <div className="client-stats">
                    <div className="client-stat">
                      <span className="stat-label">Réservations en attente:</span>
                      <span className="stat-value">{getClientReservationsCount(selectedClient.id)}</span>
                    </div>
                    <div className="client-stat">
                      <span className="stat-label">Montant total en attente:</span>
                      <span className="stat-value">{getClientTotalPendingAmount(selectedClient.id).toFixed(2)} MAD</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="details-header-actions">
                <button className="btn btn-print" onClick={handlePrintDetails}>
                  <FaPrint className="btn-icon" />
                  Générer PDF
                </button>
                <button className="close-details-btn" onClick={handleCloseDetails}>
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="details-content">
              {/* Section Réservations en Attente */}
              <div className="details-section">
                <div className="section-title">
                  <FaCalendarDay />
                  <span>Réservations avec Paiements en Attente ({clientReservations.length})</span>
                </div>
                {clientReservations.length > 0 ? (
                  <>
                    <div className="items-grid">
                      {currentReservations.map(reservation => {
                        const rentalDays = calculateRentalDays(reservation.start_date, reservation.end_date);
                        const daysOverdue = calculateDaysOverdue(reservation);
                        
                        return (
                          <div key={reservation.id} className="item-card pending-payment-card">
                            <div className="item-header">
                              <div className="item-title">
                                <FaCar className="item-icon" />
                                {getSafeValue(reservation.car?.brand)} {getSafeValue(reservation.car?.model)}
                              </div>
                              {getStatusBadge(reservation.status)}
                            </div>
                            <div className="item-details">
                              <div className="item-detail">
                                <FaCalendarAlt className="detail-icon" />
                                {formatDateSafe(reservation.start_date)} - {formatDateSafe(reservation.end_date)}
                              </div>
                              <div className="item-detail">
                                <FaClock className="detail-icon" />
                                {rentalDays} jours
                              </div>
                              {daysOverdue > 0 && (
                                <div className="item-detail warning">
                                  <FaExclamationTriangle className="detail-icon warning" />
                                  {daysOverdue} jour(s) de retard
                                </div>
                              )}
                              <div className="item-detail">
                                <FaMoneyBill className="detail-icon" />
                                Prix total: {parseFloat(getSafeValue(reservation.total_price, 0)).toFixed(2)} MAD
                              </div>
                              <div className="item-detail highlight">
                                <FaExclamationTriangle className="detail-icon warning" />
                                Montant restant: <strong>{parseFloat(getSafeValue(reservation.remaining_amount, 0)).toFixed(2)} MAD</strong>
                              </div>
                              <div className="item-detail">
                                <FaMoneyBill className="detail-icon" />
                                Déjà payé: {parseFloat(getSafeValue(reservation.amount_paid, 0)).toFixed(2)} MAD
                              </div>
                            </div>
                            <div className="item-id">Réservation #{reservation.id}</div>
                          </div>
                        );
                      })}
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
                    <p>Aucune réservation avec paiement en attente pour ce client</p>
                  </div>
                )}
              </div>

              {/* Section Historique des Paiements */}
              <div className="details-section">
                <div className="section-title">
                  <FaHistory />
                  <span>Historique des Paiements ({clientPaymentHistory.length})</span>
                </div>
                {clientPaymentHistory.length > 0 ? (
                  <>
                    <div className="payment-history-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Montant</th>
                            <th>Méthode</th>
                            <th>Réservation</th>
                            <th>Véhicule</th>
                            <th>Période</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentPaymentHistory.map((payment, index) => (
                            <tr key={index}>
                              <td className="payment-date">
                                {formatDateSafe(payment.date)}
                              </td>
                              <td className="payment-amount">
                                <FaMoneyBill className="payment-icon" />
                                {parseFloat(getSafeValue(payment.amount, 0)).toFixed(2)} MAD
                              </td>
                              <td className="payment-method">
                                <span className={`method-badge ${getSafeValue(payment.method, '').toLowerCase()}`}>
                                  {getSafeValue(payment.method, 'Non spécifié')}
                                </span>
                              </td>
                              <td className="payment-reservation">
                                #{payment.reservation_id}
                              </td>
                              <td className="payment-car">
                                {getSafeValue(payment.car_info)}
                              </td>
                              <td className="payment-period">
                                {getSafeValue(payment.reservation_period)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination de l'historique des paiements */}
                    {totalPaymentHistoryPages > 1 && (
                      <div className="details-pagination">
                        <div className="pagination">
                          {renderPaginationButtons(paymentHistoryPage, totalPaymentHistoryPages, handlePaymentHistoryPageChange, 'details')}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-items">
                    <FaReceipt size={32} />
                    <p>Aucun historique de paiement pour ce client</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .clients-management {
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

        .section-subtitle {
          color: #6c757d;
          font-size: 1.1rem;
          margin: 0;
          font-weight: 400;
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

        .btn-clear {
          background: #dc3545;
          color: white;
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
        }

        .btn-clear:hover {
          background: #c82333;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(220, 53, 69, 0.4);
        }

        .btn-print {
          background: #28a745;
          color: white;
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        }

        .btn-print:hover {
          background: #218838;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(40, 167, 69, 0.4);
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
        .stat-reservations::before { background: linear-gradient(135deg, #4CAF50, #45a049); }
        .stat-accidents::before { background: linear-gradient(135deg, #ff6b6b, #ee5a52); }

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
  height: 90px; /* Add this line for consistent height */
  vertical-align: middle; /* Add this line for vertical centering */
}

        .data-table tr:hover {
          background: #f8f9fa;
        }

        .client-name {
          font-weight: 600;
          color: #2c3e50;
        }

        .client-id {
          font-size: 0.75rem;
          color: #6c757d;
          margin-top: 0.25rem;
        }

        .email-cell {
          color: #007bff;
        }

        .phone-cell {
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .city-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6c757d;
        }

        .city-icon {
          color: #dc3545;
          font-size: 0.875rem;
        }

        .reservations-cell {
          text-align: center;
        }

        .amount-cell {
          text-align: center;
        }

        .count-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: #f8f9fa;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #495057;
          transition: all 0.3s ease;
        }

        .count-badge.has-items {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .count-badge.has-items:hover {
          background: #c3e6cb;
          transform: translateY(-1px);
        }

        .amount-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #fff3cd;
          color: #856404;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          border: 1px solid #ffeaa7;
        }

        .count-icon, .amount-icon {
          font-size: 0.875rem;
        }

        /* Client Avatar */
        .client-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 0.5rem;
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
        }

        .action-btn.view {
          background: rgba(23, 162, 184, 0.1);
          color: #17a2b8;
          border: 1px solid rgba(23, 162, 184, 0.2);
        }

        .action-btn.view:hover {
          background: #17a2b8;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(23, 162, 184, 0.3);
        }

        .action-btn.print {
          background: rgba(40, 167, 69, 0.1);
          color: #28a745;
          border: 1px solid rgba(40, 167, 69, 0.2);
        }

        .action-btn.print:hover {
          background: #28a745;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
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

        /* Status Badges */
        .status-badge {
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-pending {
          background: rgba(255, 193, 7, 0.1);
          color: #ffc107;
          border: 1px solid rgba(255, 193, 7, 0.2);
        }

        .status-confirmed {
          background: rgba(40, 167, 69, 0.1);
          color: #28a745;
          border: 1px solid rgba(40, 167, 69, 0.2);
        }

        .status-retard {
          background: rgba(255, 165, 0, 0.1);
          color: #ff8c00;
          border: 1px solid rgba(255, 165, 0, 0.2);
        }

        .status-contacted {
          background: rgba(23, 162, 184, 0.1);
          color: #17a2b8;
          border: 1px solid rgba(23, 162, 184, 0.2);
        }

        .status-completed {
          background: rgba(108, 117, 125, 0.1);
          color: #6c757d;
          border: 1px solid rgba(108, 117, 125, 0.2);
        }

        .status-cancelled {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          border: 1px solid rgba(220, 53, 69, 0.2);
        }

        /* Client Details Modal */
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

        .client-header-info {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .client-avatar-large {
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

        .client-info h2 {
          margin: 0 0 0.5rem 0;
          color: #1a1a1a;
          font-size: 1.5rem;
        }

        .client-contact {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          color: #6c757d;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .client-contact div {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .client-stats {
          display: flex;
          gap: 2rem;
        }

        .client-stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .client-stat .stat-label {
          font-size: 0.75rem;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .client-stat .stat-value {
          font-size: 1rem;
          font-weight: 600;
          color: #1a1a1a;
        }

        .details-header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
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

        .pending-payment-card {
          border-left: 4px solid #ffc107;
          background: #fffdf6;
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

        .item-detail.warning {
          color: #ff8c00;
          font-weight: 600;
        }

        .item-detail.highlight {
          background: #fff3cd;
          padding: 0.5rem;
          border-radius: 6px;
          border: 1px solid #ffeaa7;
          color: #856404;
          font-weight: 600;
        }

        .detail-icon {
          font-size: 0.875rem;
          color: #667eea;
          width: 16px;
        }

        .detail-icon.warning {
          color: #ffc107;
        }

        .item-id {
          font-size: 0.75rem;
          color: #6c757d;
          text-align: right;
          font-family: 'Monaco', 'Consolas', monospace;
        }

        /* Payment History Table */
        .payment-history-table {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 1.5rem;
        }

        .payment-history-table table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .payment-history-table th {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #2c3e50;
          border-bottom: 2px solid #e9ecef;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .payment-history-table td {
          padding: 1rem;
          border-bottom: 1px solid #f8f9fa;
          color: #495057;
        }

        .payment-history-table tr:hover {
          background: #f8f9fa;
        }

        .payment-date {
          font-weight: 600;
          color: #2c3e50;
        }

        .payment-amount {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: #28a745;
        }

        .payment-icon {
          font-size: 0.875rem;
        }

        .payment-method {
          text-align: center;
        }

        .method-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .method-badge.cash {
          background: rgba(40, 167, 69, 0.1);
          color: #28a745;
          border: 1px solid rgba(40, 167, 69, 0.2);
        }

        .method-badge.card {
          background: rgba(0, 123, 255, 0.1);
          color: #007bff;
          border: 1px solid rgba(0, 123, 255, 0.2);
        }

        .method-badge.transfer {
          background: rgba(108, 117, 125, 0.1);
          color: #6c757d;
          border: 1px solid rgba(108, 117, 125, 0.2);
        }

        .payment-reservation {
          font-family: 'Monaco', 'Consolas', monospace;
          color: #6c757d;
        }

        .payment-car {
          color: #495057;
        }

        .payment-period {
          font-size: 0.8rem;
          color: #6c757d;
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

        /* Responsive Design */
        @media (max-width: 768px) {
          .clients-management {
            padding: 1rem;
          }

          .section-header {
            flex-direction: column;
            gap: 1rem;
            padding: 1.5rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
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

          .client-header-info {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          .client-stats {
            flex-direction: column;
            gap: 1rem;
          }

          .items-grid {
            grid-template-columns: 1fr;
          }

          .payment-history-table {
            overflow-x: auto;
          }

          .payment-history-table table {
            min-width: 800px;
          }
        }

        @media (max-width: 480px) {
          .details-content {
            padding: 1rem;
          }

          .client-contact {
            font-size: 0.8rem;
          }

          .details-header-actions {
            flex-direction: column;
            width: 100%;
          }

          .btn-print {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default GestionClients;