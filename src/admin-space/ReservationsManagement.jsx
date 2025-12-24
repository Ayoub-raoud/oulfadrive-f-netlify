
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaPlus, FaEdit, FaTrash, FaFileExport, FaDatabase, FaPrint,
  FaCheck, FaTimes, FaCalendarAlt, FaCar, FaUser, FaMoneyBill,
  FaExclamationTriangle, FaSpinner, FaRedo, FaSearch, FaFilter,
  FaChevronLeft, FaChevronRight, FaClock, FaArrowLeft, FaPalette
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import {
  fetchReservations,
  createReservation,
  updateReservation,
  deleteReservation,
  fetchClients,
  fetchCars,
  fetchMatricules,
  createClient,
  updateClient,
  selectReservations,
  selectReservationsLoading,
  selectClients,
  selectCars,
  selectMatricules,
  selectUser,
  updateMatricule,
  refreshMatricules,
  checkLateReservations
} from '../Redux/store';
import AdminModal from './AdminModal';

// Import checklist image and logo
import checklistImage from '../assets/checklist.png';
import logoImage from '../assets/lo-brown.png';

// Components for contract
const FormLine = ({ label, value = '', showPrice = true }) => (
  <div className="form-line">
    <label>{label} :</label>
    <div className="dots-line">
      {showPrice ? value : '_________'}
    </div>
  </div>
);

const Checkbox = ({ checked = false }) => (
  <span className={`checkbox-square ${checked ? 'checked' : ''}`}>
    {checked && '✓'}
  </span>
);

const CarDiagram = () => (
  <div className="car-diagram-container">
    <img 
      src={checklistImage} 
      alt="Car Checklist Diagram" 
      className="checklist-image"
    />
  </div>
);

const ObservationBox = ({ title, isHalf = false, children, showPrice = true }) => (
  <div className={`observation-box ${isHalf ? 'half-width' : ''}`}>
    <label className="obs-title">{title} :</label>
    <div className="observation-content">
      {showPrice ? children : '_________'}
    </div>
  </div>
);

const SignatureBlock = ({ label, signature = '' }) => (
  <div className="signature-block">
    <div className="signature-label">{label}</div>
    <div className="signature-box">
      {signature && <div className="signature-text">{signature}</div>}
    </div>
  </div>
);

const ContractLocation = ({ reservation, showSignatures = false, currentUser, hidePrices = false }) => {
  const [paperwork, setPaperwork] = useState({
    circulation: false,
    carteGrise: false,
    assurance: false,
    vignette: false,
    visiteTechnique: false,
    autorisation: false
  });

  const [signatures, setSignatures] = useState({
    agent: '',
    locataire: '',
    secondConducteur: ''
  });

  // Initialize signatures if provided
  useEffect(() => {
    if (reservation?.signatures) {
      setSignatures(reservation.signatures);
    }
  }, [reservation]);

  // Initialize paperwork if provided
  useEffect(() => {
    if (reservation?.paperwork) {
      setPaperwork(reservation.paperwork);
    }
  }, [reservation]);

  // Helper function to extract user info from notes JSON
  const getUserInfoFromNotes = (notes) => {
    try {
      if (notes && notes.trim().startsWith('{')) {
        const notesObj = JSON.parse(notes);
        if (notesObj.user_actions) {
          return notesObj.user_actions;
        }
      }
    } catch (e) {
      console.error('Error parsing notes JSON:', e);
    }
    return {};
  };

  // Get the user who created the reservation (Livrer par)
  const getReceptionistName = () => {
  // Pour "Livrer par": Afficher l'utilisateur actuellement connecté
  let userName = '';
  
  // D'abord essayer d'obtenir l'utilisateur du contexte/Redux
  if (currentUser) {
    userName = currentUser.Fullname || currentUser.fullname || currentUser.name || currentUser.username || currentUser.email || '';
  }
  
  // Ensuite, essayer de lire depuis localStorage
  if (!userName) {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userName = userData.Fullname || userData.fullname || userData.name || userData.username || userData.email || '';
      }
    } catch (error) {
      console.error('Error reading user from localStorage:', error);
    }
  }
  
  // Final fallback
  return userName || 'Administrateur OULFA DRIVE';
};

// Get the user who entered the return kilometer (Receptionner par) - RESTE INCHANGÉ
const getKilometerReceiverName = () => {
  const userInfo = getUserInfoFromNotes(reservation?.notes || '');
  
  // If reservation is completed, show who completed it
  if (reservation?.status === 'completed') {
    if (userInfo.completed_by) {
      return userInfo.completed_by;
    }
    
    if (reservation?.completed_by_user) {
      return reservation.completed_by_user;
    }
    
    if (userInfo.updated_by) {
      return userInfo.updated_by;
    }
    
    if (reservation?.updated_by_user) {
      return reservation.updated_by_user;
    }
  }
  
  return '________';
};

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      let date;
      
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else if (dateString.includes(' ')) {
        date = new Date(dateString.split(' ')[0]);
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return '';
    }
  };

  // Calculate rental days correctly (exclusive calculation)
  const calculateRentalDays = () => {
    if (!reservation?.start_date || !reservation?.end_date) return '';
    
    const start = new Date(reservation.start_date);
    const end = new Date(reservation.end_date);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays === 0 ? 1 : diffDays;
  };

  return (
    <div className="contract-container" id="contract-print">
      <header className="contract-header">
        <div className="header-left">
          <div className="location-text">LOCATION DE VOITURE</div>
          <div className="phone-number">0665 921 921</div>
        </div>
        <div className="header-center">
          <img src={logoImage} alt="OULFA DRIVE Logo" className="company-logo" />
        </div>
        <div className="header-right">
          <div className="arabic-text">كراء السيارات</div>
          <div className="contract-number-red">{reservation?.id ? reservation.id.toString().padStart(7, '0') : '0000955'}</div>
        </div>
      </header>

      <h1 className="contract-title">CONTRAT DE LOCATION</h1>

      <section className="two-columns-layout">
        {/* LEFT COLUMN - Locataire and Deuxieme Conducteur */}
        <div className="left-column">
          {/* LOCATAIRE SECTION - Top Left */}
          <div className="section-block">
            <h2 className="section-header-contract">LOCATAIRE</h2>
            <FormLine label="Nom" value={reservation?.client?.nom || ''} />
            <FormLine label="Prénom" value={reservation?.client?.prenom || ''} />
            <FormLine label="Date de Naissance" value={formatDate(reservation?.client?.date_naissance) || ''} />
            <FormLine label="Lieu de Naissance" value={reservation?.client?.lieu_naissance || ''} />
            <FormLine label="Pièce d'identité (CIN / Passeport)" value={reservation?.client?.cin_number || ''} />
            <FormLine label="Expire le" value={formatDate(reservation?.client?.cin_delivre_le) || ''} />
            <FormLine label="Permis de Conduire N°" value={reservation?.client?.driver_license_number || ''} />
            <FormLine label="Expire le" value={formatDate(reservation?.client?.permis_delivre_le) || ''} />
            <FormLine label="Adresse" value={reservation?.client?.city || ''} />
            <FormLine label="Tél." value={reservation?.client?.telephone || ''} />
            <FormLine label="Email" value={reservation?.client?.email || ''} />
            <FormLine label="Fax" value="" />
          </div>

          {/* DEUXIEME CONDUCTEUR SECTION - Bottom Left */}
          <div className="section-block">
            <h2 className="section-header-contract">DEUXIEME CONDUCTEUR</h2>
            <FormLine label="Nom" value="" />
            <FormLine label="Prénom" value="" />
            <FormLine label="Date de Naissance" value="" />
            <FormLine label="Lieu de Naissance" value="" />
            <FormLine label="Pièce d'identité (CIN / Passeport)" value="" />
            <FormLine label="Délivré le" value="" />
            <FormLine label="Permis de Conduire N°" value="" />
            <FormLine label="Délivré le" value="" />
            <FormLine label="Adresse" value="" />
            <FormLine label="Tél." value="" />
            <FormLine label="Fax" value="" />
          </div>
        </div>

        {/* RIGHT COLUMN - Vehicle Information taking full height */}
        <div className="right-column">
          <div className="section-block full-height">
            <h2 className="section-header-contract">INFORMATION SUR LE VÉHICULE</h2>
            <FormLine label="Immatriculation" value={reservation?.matricule?.matricule_code || ''} />
            <FormLine label="Marque" value={reservation?.car?.brand || ''} />
            <FormLine label="Modèle" value={reservation?.car?.model || ''} />
            <FormLine label="Couleur" value={reservation?.car?.color || ''} />
            <FormLine label="Année" value={reservation?.car?.year || ''} />
            <FormLine label="Type de carburant" value={reservation?.car?.fuel_type || ''} />
            <FormLine label="Transmission" value={reservation?.car?.transmission || ''} />
            <FormLine label="Nombre de places" value={reservation?.car?.seats || ''} />
            <FormLine label="Nombre de portes" value={reservation?.car?.doors || ''} />
            <FormLine label="Livrer par" value={getReceptionistName()} /> {/* CHANGÉ */}
            <FormLine label="Receptionner par" value={getKilometerReceiverName()} /> {/* CHANGÉ */}
            <FormLine label="Date de départ" value={formatDate(reservation?.start_date)} />
            <FormLine label="Heure" value={reservation?.start_time || '08:00'} />
            <FormLine label="Date de retour" value={formatDate(reservation?.end_date)} />
            <FormLine label="Heure" value={reservation?.end_time || '18:00'} />
            <FormLine label="Carburant" value="" />
            <FormLine label="Km départ" value={reservation?.kilometrage_sortie || ''} />
            {reservation?.status === 'completed' ? (
              <FormLine label="Km retour" value={reservation?.kilometrage_entree || ''} />
            ) : (
              <FormLine label="Km retour" value="" />
            )}
            <FormLine
              label="Kilométrage actuel"
              value={
                reservation?.status === 'completed'
                  ? reservation?.matricule_kilometrage_at_end
                  : reservation?.status === 'confirmed'
                    ? reservation?.kilometrage_sortie
                    : reservation?.matricule_kilometrage_at_start || ''
              }
            />
            <FormLine label="Nombre de jours" value={calculateRentalDays()} />
            <FormLine label="Prix unitaire" value={`${reservation?.car?.price_per_day || ''} DH`} showPrice={!hidePrices} />
            <FormLine label="Montant T.T.C" value={`${reservation?.total_price || ''} DH`} showPrice={!hidePrices} />
            <FormLine label="Montant payé" value={`${reservation?.amount_paid || ''} DH`} showPrice={!hidePrices} />
            <FormLine label="Montant restant" value={`${reservation?.remaining_amount || ''} DH`} showPrice={!hidePrices} />
            <FormLine label="Montant de la franchise" value="" />
          </div>
        </div>
      </section>

      <section className="checklist-section">
        <h2 className="section-header-contract checklist-title">CHECK LIST Etat du Véhicule</h2>
        <div className="etat-vehicule">
          <div>
            <div className="etat-label">Etat de Départ :</div>
            <CarDiagram />
          </div>
          <div>
            <div className="etat-label">Etat de Retour :</div>
            <CarDiagram />
          </div>
        </div>

        <div className="paperwork-bar">
          <div className="paperwork-item">
            Papier de circulation :
          </div>
          <div className="paperwork-item">
            Carte grise <Checkbox checked={paperwork.carteGrise} />
          </div>
          <div className="paperwork-item">
            Assurance <Checkbox checked={paperwork.assurance} />
          </div>
          <div className="paperwork-item">
            Vignette <Checkbox checked={paperwork.vignette} />
          </div>
          <div className="paperwork-item">
            Autorisation <Checkbox checked={paperwork.autorisation} />
          </div>
          <div className="paperwork-item">
            Visite technique <Checkbox checked={paperwork.visiteTechnique} />
          </div>
        </div>
      </section>

      <section className="observations-section">
        <ObservationBox title="Observation">
          <div className="observation-text">
            Véhicule loué en bon état général. Le client s'engage à retourner le véhicule dans le même état.
            {reservation?.notes && ` Notes: ${reservation.notes}`}
          </div>
        </ObservationBox>
        <ObservationBox title="Assurance Supplémentaire">
          <div className="observation-text">
            Assurance tous risques incluse. Franchise applicable en cas de sinistre.
          </div>
        </ObservationBox>
        <ObservationBox title="Caution & Garantie" isHalf showPrice={!hidePrices}>
          <div className="observation-text">
            Caution: {reservation?.amount_paid ? `${reservation.amount_paid} DH` : '_________'} DH<br/>
            Montant restant: {reservation?.remaining_amount ? `${reservation.remaining_amount} DH` : '_________'} DH
          </div>
        </ObservationBox>
      </section>
      
      <section className="kilometer-excess-clause">
        <div className="kilometer-excess-content">
          <strong>IMPORTANT - CLAUSE DE DÉPASSEMENT DE KILOMÉTRAGE :</strong>
          <br/>
          En cas de dépassement du kilométrage mentionné (200km par jour), 
          vous allez payer 1.5 DH pour chaque kilomètre additionnel au-delà de la limite autorisée.
        </div>
      </section>
      
      <section className="signature-section">
        <SignatureBlock 
          label="Signature Agent" 
          signature={showSignatures ? signatures.agent : ''}
        />
        <SignatureBlock 
          label="Signature du locataire" 
          signature={showSignatures ? signatures.locataire : ''}
        />
        <SignatureBlock 
          label="Deuxieme conducteur" 
          signature={showSignatures ? signatures.secondConducteur : ''}
        />
      </section>

      <footer className="contract-footer">
        SMAITI LUXE CAR SARL AU CAPITAL DE 500 000.00 DHS SIEGE SOCIAL:43 OP KASBAT AL AMINE CASABLANCA<br />
        IF: 68792347 -RC:702167 -TP: 36208941 -CNSS: 6515943 -ICE: 003818317000048 -EMAIL: smaitiluxecar@gmail.com -TELEPHONE :0665921921
      </footer>
    </div>
  );
};

const ReservationsManagement = ({ onBack, filter }) => {
  const dispatch = useDispatch();
  const reservations = useSelector(selectReservations);
  const loading = useSelector(selectReservationsLoading);
  const clients = useSelector(selectClients);
  const cars = useSelector(selectCars);
  const matricules = useSelector(selectMatricules);
  const currentUser = useSelector(selectUser);
  
  // Debug user data
  useEffect(() => {
    console.log('=== DEBUG USER DATA ===');
    console.log('Current User from Redux:', currentUser);
    console.log('User from localStorage:', localStorage.getItem('user'));
    console.log('Auth token:', localStorage.getItem('authToken'));
    
    // Make the currentUser available globally for debugging
    window.__DEBUG_CURRENT_USER = currentUser;
  }, [currentUser]);

  const [showModal, setShowModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [modalType, setModalType] = useState('create');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({
    type: '',
    title: '',
    message: '',
    reservation: null,
    onConfirm: null
  });
  const [showContract, setShowContract] = useState(false);
  const [selectedContractReservation, setSelectedContractReservation] = useState(null);
  const [contractSignatures, setContractSignatures] = useState({
    agent: '',
    locataire: '',
    secondConducteur: ''
  });
  const [contractPaperwork, setContractPaperwork] = useState({
    circulation: false,
    carteGrise: false,
    assurance: false,
    vignette: false,
    visiteTechnique: false,
    autorisation: false
  });
  
  // NEW: State for hiding prices in contract - PERSISTENT throughout component lifecycle
  const [hideContractPrices, setHideContractPrices] = useState(false);

  // Search and Filter states - UPDATED: Initialize with filter prop
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(filter || 'all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // NEW: Handle filter prop changes
  useEffect(() => {
    if (filter) {
      setStatusFilter(filter);
      setCurrentPage(1); // Reset to first page when filter changes
    }
  }, [filter]);

  useEffect(() => {
    dispatch(fetchReservations());
    dispatch(fetchClients());
    dispatch(fetchCars());
    dispatch(fetchMatricules());
    
    // Check for late reservations on component mount
    dispatch(checkLateReservations());
  }, [dispatch]);

  // Auto-check for late reservations every minute
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(checkLateReservations());
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [dispatch]);

  // Fixed Date helper functions
  const isToday = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return dateOnly.getTime() === todayOnly.getTime();
  };

  const isUpcoming = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return dateOnly > todayOnly;
  };

  const isPast = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return dateOnly < todayOnly;
  };

  const isThisWeek = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return date >= startOfWeek && date <= endOfWeek;
  };

  const isThisMonth = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    
    return date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const isActiveNow = (reservation) => {
    if (!reservation.start_date || !reservation.end_date) return false;
    
    const today = new Date();
    const startDate = new Date(reservation.start_date);
    const endDate = new Date(reservation.end_date);
    
    return today >= startDate && today <= endDate;
  };

  // ✅ FIXED: Calculate rental days correctly (same day = 1, next day = 1)
  const calculateRentalDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Reset times to compare only dates for day calculation
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    // Calculate difference in days (exclusive - same day = 0, next day = 1)
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Same day counts as 1 day rental, next day also counts as 1 day
    return diffDays === 0 ? 1 : diffDays;
  };

  // ✅ NEW: Calculate days remaining with late days included
  const calculateDaysRemaining = (reservation) => {
    if (!reservation.end_date) return '';
    
    const today = new Date();
    const end = new Date(reservation.end_date);
    
    // Reset times to compare only dates
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // If reservation is late, show positive number of late days
    if ((reservation.status === 'retard' || reservation.status === 'confirmed') && diffDays < 0) {
      const lateDays = Math.abs(diffDays);
      if (lateDays === 1) return '+1 jour de retard';
      return `+${lateDays} jours de retard`;
    }
    
    // Normal remaining days calculation
    if (diffDays < 0) return 'Terminé';
    if (diffDays === 0) return 'Dernier jour';
    if (diffDays === 1) return '1 jour restant';
    return `${diffDays} jours restants`;
  };

  // Enhanced client creation with retry logic
  const createClientWithRetry = async (clientData, maxRetries = 3) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Creating client attempt ${attempt}...`);
        
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
        
        const result = await dispatch(createClient(clientData)).unwrap();
        console.log(`Client creation attempt ${attempt} successful:`, result);
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`Client creation attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }
    
    throw lastError;
  };

  // Helper function to get current user name
  const getCurrentUserName = () => {
    let userName = '';
    
    if (currentUser) {
      userName = currentUser.Fullname || currentUser.fullname || currentUser.name || currentUser.username || currentUser.email || '';
    }
    
    if (!userName) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          userName = userData.Fullname || userData.fullname || userData.name || userData.username || userData.email || '';
        }
      } catch (error) {
        console.error('Error reading user from localStorage:', error);
      }
    }
    
    return userName || 'Administrateur';
  };

  // Generate Detailed French Contract PDF - OPTIMIZED FOR ONE PAGE
  const generateContractPDF = async (reservation) => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Add contract content as HTML image
      const contractElement = document.getElementById('contract-print');
      
      if (!contractElement) {
        console.error('Contract element not found');
        return;
      }

      // Create a clone of the contract element for printing
      const contractClone = contractElement.cloneNode(true);
      
      // Apply optimized styles for PDF printing
      contractClone.style.width = '210mm';
      contractClone.style.height = 'auto';
      contractClone.style.padding = '10px';
      contractClone.style.boxSizing = 'border-box';
      contractClone.style.fontSize = '8px';
      contractClone.style.lineHeight = '1.1';
      
      // Create a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm';
      tempContainer.style.height = 'auto';
      tempContainer.style.padding = '10px';
      tempContainer.style.boxSizing = 'border-box';
      tempContainer.appendChild(contractClone);
      document.body.appendChild(tempContainer);

      // Use html2canvas to capture the contract as image
      const html2canvas = await import('html2canvas');
      
      const canvas = await html2canvas.default(contractClone, {
        scale: 1.2, // Reduced scale to fit everything
        useCORS: true,
        allowTaint: true,
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: 1123
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Check if content fits on one page
      if (imgHeight > pageHeight) {
        console.log('Scaling contract to fit one page...');
        // Scale to fit one page
        const scale = pageHeight / imgHeight;
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        
        doc.addImage(imgData, 'PNG', (pageWidth - scaledWidth) / 2, 0, scaledWidth, scaledHeight);
      } else {
        // Center the content vertically if it's smaller than the page
        const verticalOffset = (pageHeight - imgHeight) / 2;
        doc.addImage(imgData, 'PNG', 0, verticalOffset, imgWidth, imgHeight);
      }
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      // Save and open PDF
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Open in new window and download
      window.open(pdfUrl, '_blank');
      doc.save(`contrat-location-${reservation.id}${hideContractPrices ? '-sans-prix' : ''}.pdf`);
      
      // Clean up URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 1000);
      
      showSuccessMessage('Contract generated and opened!');
    } catch (error) {
      console.error('Error generating contract:', error);
      showErrorMessage('Error generating contract. Please try again.');
    }
  };

  const handlePrintContract = (reservation) => {
    try {
      setSelectedContractReservation(reservation);
      // Small delay to ensure the contract is rendered
      setTimeout(() => {
        generateContractPDF(reservation);
      }, 500);
    } catch (error) {
      console.error('Error generating contract:', error);
      showErrorMessage('Error generating contract. Please try again.');
    }
  };

  const handleViewContract = (reservation) => {
    setSelectedContractReservation(reservation);
    // DO NOT reset hideContractPrices here - keep the checkbox state
    setShowContract(true);
  };

  // Handle hide prices checkbox change - UPDATED: simple toggle
  const handleHidePricesChange = () => {
    setHideContractPrices(!hideContractPrices);
  };

  // Filter and search reservations with fixed date filtering
  const filteredReservations = reservations.filter(reservation => {
  const matchesSearch = searchTerm === '' || 
    reservation.client?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.client?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.car?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.car?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.matricule?.matricule_code?.toLowerCase().includes(searchTerm.toLowerCase()) || // ADDED: Search by matricule
    reservation.id.toString().includes(searchTerm);

  const matchesStatus = statusFilter === 'all' || 
    (statusFilter === 'overdue' ? reservation.status === 'retard' : reservation.status === statusFilter);

  let matchesDate = true;
  
  if (dateFilter !== 'all') {
    const startDate = reservation.start_date;
    const endDate = reservation.end_date;
    
    switch (dateFilter) {
      case 'today':
        matchesDate = isToday(startDate) || isToday(endDate);
        break;
      case 'this_week':
        matchesDate = isThisWeek(startDate) || isThisWeek(endDate);
        break;
      case 'this_month':
        matchesDate = isThisMonth(startDate) || isThisMonth(endDate);
        break;
      case 'upcoming':
        matchesDate = isUpcoming(startDate);
        break;
      case 'past':
        matchesDate = isPast(endDate);
        break;
      case 'active':
        matchesDate = isActiveNow(reservation);
        break;
      case 'late':
        matchesDate = reservation.status === 'retard';
        break;
      default:
        matchesDate = true;
    }
  }

  return matchesSearch && matchesStatus && matchesDate;
});

  // Pagination
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReservations = filteredReservations.slice(startIndex, startIndex + itemsPerPage);

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

  const handleDateFilter = (e) => {
    setDateFilter(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setCurrentPage(1);
  };

  const handleCreate = () => {
    setModalType('create');
    setEditingItem(null);
    setFormData({
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      start_time: '08:00',
      end_time: '18:00',
      rental_days: 1,
      total_price: 0,
      amount_paid: 0,
      remaining_amount: 0,
      status: 'pending',
      car_id: '',
      client_id: '',
      matricule_id: '',
      cin_number: '',
      driver_license_number: '',
      cin_image: '',
      driver_license_image: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleEdit = (reservation) => {
    setModalType('edit');
    setEditingItem(reservation);
    setFormData({
      ...reservation,
      start_date: reservation.start_date.split('T')[0],
      end_date: reservation.end_date.split('T')[0],
      nom: reservation.client?.nom || '',
      prenom: reservation.client?.prenom || '',
      telephone: reservation.client?.telephone || '',
      email: reservation.client?.email || '',
      city: reservation.client?.city || '',
      cin_number: reservation.client?.cin_number || '',
      driver_license_number: reservation.client?.driver_license_number || '',
      cin_image: reservation.client?.cin_image || '',
      driver_license_image: reservation.client?.driver_license_image || ''
    });
    setShowModal(true);
  };

  const showDeleteConfirmation = (reservation) => {
    setConfirmationConfig({
      type: 'delete',
      title: 'Delete Reservation',
      message: `Are you sure you want to delete reservation #${reservation.id}? This action cannot be undone.`,
      reservation: reservation,
      onConfirm: () => confirmDelete(reservation.id)
    });
    setShowConfirmation(true);
  };

  const confirmDelete = async (id) => {
    try {
      await dispatch(deleteReservation(id)).unwrap();
      setShowConfirmation(false);
      showSuccessMessage('Reservation deleted successfully!');
      dispatch(fetchReservations());
    } catch (error) {
      showErrorMessage('Error deleting reservation: ' + error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      let clientId = formData.client_id;

      // Client creation logic
      if (!clientId && formData.nom && formData.prenom) {
        console.log('Creating new client...');
        
        const existingClient = clients.find(client => 
          client.telephone === formData.telephone || 
          client.email === formData.email
        );

        if (existingClient) {
          clientId = existingClient.id;
          console.log('Using existing client ID:', clientId);
          
          if (formData.cin_number || formData.driver_license_number) {
            console.log('Updating existing client with CIN/driver license info');
            const updateData = {};
            if (formData.cin_number) updateData.cin_number = formData.cin_number;
            if (formData.driver_license_number) updateData.driver_license_number = formData.driver_license_number;
            if (formData.cin_image) updateData.cin_image = formData.cin_image;
            if (formData.driver_license_image) updateData.driver_license_image = formData.driver_license_image;
            
            try {
              await dispatch(updateClient({ id: clientId, data: updateData })).unwrap();
              console.log('Client updated with CIN/driver license info');
            } catch (updateError) {
              console.warn('Failed to update client with CIN/driver license info:', updateError);
            }
          }
        } else {
          const clientData = {
            nom: formData.nom,
            prenom: formData.prenom,
            telephone: formData.telephone,
            email: formData.email,
            city: formData.city,
            cin_number: formData.cin_number || '',
            driver_license_number: formData.driver_license_number || '',
            cin_image: formData.cin_image || '',
            driver_license_image: formData.driver_license_image || '',
            image_permit: 'default_permit.jpg',
            image_cn: 'default_cn.jpg'
          };

          console.log('Client data to create:', clientData);
          
          try {
            const clientResult = await createClientWithRetry(clientData);
            console.log('Client creation result:', clientResult);

            if (clientResult.client && clientResult.client.id) {
              clientId = clientResult.client.id;
            } else if (clientResult.id) {
              clientId = clientResult.id;
            } else if (clientResult.data && clientResult.data.id) {
              clientId = clientResult.data.id;
            } else {
              await new Promise(resolve => setTimeout(resolve, 1500));
              await dispatch(fetchClients());
              
              const newClient = clients.find(c => 
                c.telephone === formData.telephone && 
                c.email === formData.email
              );
              
              if (newClient) {
                clientId = newClient.id;
              } else {
                throw new Error('Client created but ID not found after refresh');
              }
            }

            console.log('Using client ID:', clientId);
          } catch (clientError) {
            console.error('Error creating client:', clientError);
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            await dispatch(fetchClients());
            
            const fallbackClient = clients.find(c => 
              c.telephone === formData.telephone || 
              c.email === formData.email
            );
            
            if (fallbackClient) {
              clientId = fallbackClient.id;
              console.log('Using fallback client ID after error:', clientId);
              showSuccessMessage('Client found after creation error - proceeding with reservation');
            } else {
              console.log('Trying with minimal client data...');
              const minimalClientData = {
                nom: formData.nom,
                prenom: formData.prenom,
                telephone: formData.telephone,
                email: formData.email,
                city: formData.city,
                image_permit: 'default_permit.jpg',
                image_cn: 'default_cn.jpg'
              };
              
              try {
                const minimalResult = await dispatch(createClient(minimalClientData)).unwrap();
                if (minimalResult.client && minimalResult.client.id) {
                  clientId = minimalResult.client.id;
                } else if (minimalResult.id) {
                  clientId = minimalResult.id;
                } else {
                  throw new Error('Could not extract client ID from minimal creation');
                }
                console.log('Minimal client creation successful, ID:', clientId);
                showSuccessMessage('Client created with basic info (CIN/driver license skipped)');
              } catch (minimalError) {
                throw new Error(`Unable to create client even with minimal data: ${minimalError.message || minimalError}`);
              }
            }
          }
        }
      }

      if (!clientId) {
        throw new Error('No client available for reservation. Please check client information and try again.');
      }

      // Calculate rental days
      const rentalDays = formData.rental_days || calculateRentalDays(formData.start_date, formData.end_date);

      // Get current user name for tracking
      const currentUserName = getCurrentUserName();
      
      // Parse existing notes or create new object
      let notesObj = {};
      const existingNotes = formData.notes || '';
      
      try {
        if (existingNotes && existingNotes.trim().startsWith('{')) {
          notesObj = JSON.parse(existingNotes);
        } else if (existingNotes) {
          // If notes is plain text, preserve it
          notesObj.original_text = existingNotes;
        }
      } catch (e) {
        // If JSON parsing fails, treat as plain text
        notesObj.original_text = existingNotes;
      }
      
      // Prepare user actions tracking
      const userActions = notesObj.user_actions || {};
      
      // Track user actions based on reservation status and operation type
      if (modalType === 'create') {
        userActions.created_by = currentUserName;
        userActions.created_at = new Date().toISOString();
      } else {
        userActions.updated_by = currentUserName;
        userActions.updated_at = new Date().toISOString();
      }
      
      // Track completion if reservation is being marked as completed with return kilometer
      if (formData.status === 'completed' && formData.kilometrage_entree) {
        userActions.completed_by = currentUserName;
        userActions.completed_at = new Date().toISOString();
      }
      
      // Update notes object
      notesObj.user_actions = userActions;
      
      // Convert back to string for storage
      const notesString = JSON.stringify(notesObj);

      const reservationData = {
        start_date: formData.start_date,
        end_date: formData.end_date,
        start_time: formData.start_time || '08:00',
        end_time: formData.end_time || '18:00',
        total_days: formData.total_days || rentalDays,
        total_price: formData.total_price || 0,
        amount_paid: formData.amount_paid || 0,
        remaining_amount: formData.remaining_amount || (formData.total_price - (formData.amount_paid || 0)),
        payment_history: formData.payment_history || [],
        status: formData.status || 'pending',
        car_id: formData.car_id,
        client_id: clientId,
        matricule_id: formData.matricule_id || null,
        notes: notesString, // Use the JSON string
        kilometrage_sortie: formData.kilometrage_sortie || null,
        kilometrage_entree: formData.kilometrage_entree || null
      };

      console.log('Reservation data to submit:', reservationData);

      let result;
      if (modalType === 'create') {
        result = await dispatch(createReservation(reservationData)).unwrap();
        showSuccessMessage('Reservation created successfully!');
      } else {
        result = await dispatch(updateReservation({ id: editingItem.id, data: reservationData })).unwrap();
        showSuccessMessage('Reservation updated successfully!');
      }
      
      // 🔄 Force refresh matricules to sync status changes
      setTimeout(() => {
        dispatch(refreshMatricules());
      }, 500);
      
      // 🔧 SIMPLE MATRICULE UPDATE LOGIC - ONLY FOR COMPLETED RESERVATIONS
      if (formData.status === 'completed' && formData.matricule_id && formData.kilometrage_entree) {
        try {
          console.group('🚗 Matricule Update Process');
          console.log('Starting matricule update...');
          console.log('Matricule ID:', formData.matricule_id);
          console.log('Return Kilometer to set:', formData.kilometrage_entree);
          
          // Find the current matricule from Redux store
          const currentMatricule = matricules.find(m => m.id == formData.matricule_id);
          
          if (!currentMatricule) {
            console.error('❌ Matricule not found with ID:', formData.matricule_id);
            throw new Error('Matricule not found');
          }
          
          console.log('📋 Found matricule:', currentMatricule.matricule_code);
          console.log('📊 Current kilometrage:', currentMatricule.kilometrage);
          
          // ✅ CORRECT: Update matricule's CURRENT kilometer to the return kilometer
          const matriculeUpdateData = {
            kilometrage: formData.kilometrage_entree // Km actuel = Km retour
          };
          
          console.log('🔄 Matricule update data:', matriculeUpdateData);
          
          // Use updateMatricule thunk
          console.log('🔄 Using updateMatricule thunk');
          const updateResult = await dispatch(updateMatricule({ 
            id: formData.matricule_id, 
            data: matriculeUpdateData 
          })).unwrap();
          
          console.log('✅ Matricule update successful:', updateResult);
          console.groupEnd();
          
          showSuccessMessage('Reservation updated and matricule return kilometer saved successfully!');
          
        } catch (matriculeError) {
          console.groupEnd();
          console.error('❌ Matricule update failed:', matriculeError);
          
          // More specific error messages
          if (matriculeError.message?.includes('Network Error')) {
            showErrorMessage('Network error: Could not update matricule. Please check your connection.');
          } else if (matriculeError.message?.includes('404')) {
            showErrorMessage('Matricule not found on server. Please refresh the page.');
          } else if (matriculeError.message?.includes('401') || matriculeError.message?.includes('403')) {
            showErrorMessage('Permission denied: You cannot update matricule information.');
          } else {
            showErrorMessage('Reservation updated but failed to update matricule return kilometer: ' + matriculeError.message);
          }
          
          // Don't fail the entire reservation update if matricule update fails
          console.warn('⚠️ Reservation was updated successfully, but matricule update failed');
        }
      } else if (formData.status === 'completed' && formData.matricule_id && !formData.kilometrage_entree) {
        console.warn('⚠️ Reservation completed but no return kilometer provided for matricule update');
      } else if (formData.status === 'completed' && !formData.matricule_id) {
        console.warn('⚠️ Reservation completed but no matricule assigned');
      }
      
      // Show specific message for status changes that affect matricule status
      if (formData.matricule_id) {
        if (formData.status === 'confirmed' || formData.status === 'retard') {
          showSuccessMessage(`Reservation ${modalType === 'create' ? 'created' : 'updated'}! Matricule status changed to inactive.`);
        } else if (formData.status === 'completed') {
          showSuccessMessage(`Reservation ${modalType === 'create' ? 'created' : 'updated'}! Matricule status changed to active.`);
        }
      }
      
      // Refresh all data
      setShowModal(false);
      dispatch(fetchReservations());
      dispatch(fetchClients());
      dispatch(fetchCars());
      dispatch(fetchMatricules());
      
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      const errorMsg = error.message || error;
      
      if (errorMsg.includes('MySQL') || errorMsg.includes('database') || errorMsg.includes('connection')) {
        showErrorMessage('Database connection issue. Please try again in a moment.');
      } else if (errorMsg.includes('Validation failed')) {
        showErrorMessage('Please check your input data and try again.');
      } else if (errorMsg.includes('Client already exists')) {
        showErrorMessage('A client with this email or phone already exists. Please use the existing client.');
      } else {
        showErrorMessage('Error: ' + errorMsg);
      }
    } finally {
      setSubmitting(false);
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

  // ✅ UPDATED: Add the new "retard" status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-badge status-pending', text: 'En attente', icon: FaClock },
      confirmed: { class: 'status-badge status-confirmed', text: 'Confirmé', icon: FaCheck },
      contacted: { class: 'status-badge status-contacted', text: 'Contacté', icon: FaUser },
      completed: { class: 'status-badge status-completed', text: 'Terminé', icon: FaCheck },
      cancelled: { class: 'status-badge status-cancelled', text: 'Annulé', icon: FaTimes },
      retard: { class: 'status-badge status-retard', text: 'En retard', icon: FaExclamationTriangle }
    };

    const config = statusConfig[status] || { class: 'status-badge status-pending', text: status, icon: FaClock };
    const IconComponent = config.icon;
    
    return (
      <span className={config.class}>
        <IconComponent className="status-icon" />
        {config.text}
      </span>
    );
  };

  const handleExport = () => {
    if (!filteredReservations || filteredReservations.length === 0) {
      showErrorMessage('No data to export!');
      return;
    }

    const headers = ['ID', 'Client', 'Car', 'Start Date', 'End Date', 'Total Days', 'Total Price', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredReservations.map(reservation => [
        reservation.id,
        `"${reservation.client?.prenom} ${reservation.client?.nom}"`,
        `"${reservation.car?.brand} ${reservation.car?.model}"`,
        new Date(reservation.start_date).toLocaleDateString(),
        new Date(reservation.end_date).toLocaleDateString(),
        reservation.total_days || reservation.rental_days,
        reservation.total_price,
        reservation.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `reservations_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccessMessage('CSV exported successfully!');
  };

  const refreshData = () => {
    dispatch(fetchReservations());
    dispatch(fetchClients());
    dispatch(fetchCars());
    dispatch(fetchMatricules());
    dispatch(checkLateReservations()); // Also check for late reservations
    showSuccessMessage('Data refreshed successfully!');
  };

  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    buttons.push(
      <button
        key="prev"
        className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <FaChevronLeft />
      </button>
    );

    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          className={`pagination-btn ${currentPage === 1 ? 'active' : ''}`}
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(<span key="ellipsis1" className="pagination-ellipsis">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="ellipsis2" className="pagination-ellipsis">...</span>);
      }
      buttons.push(
        <button
          key={totalPages}
          className={`pagination-btn ${currentPage === totalPages ? 'active' : ''}`}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    buttons.push(
      <button
        key="next"
        className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <FaChevronRight />
      </button>
    );

    return buttons;
  };

  // Handle signature changes
  const handleSignatureChange = (field, value) => {
    setContractSignatures(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle paperwork checkbox changes
  const handlePaperworkChange = (field) => {
    setContractPaperwork(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="reservations-management">
      {/* Hidden contract for printing - OPTIMIZED FOR ONE PAGE */}
      {selectedContractReservation && (
        <div style={{ display: 'none' }}>
          <ContractLocation 
            reservation={{
              ...selectedContractReservation,
              signatures: contractSignatures,
              paperwork: contractPaperwork
            }}
            currentUser={currentUser}
            hidePrices={hideContractPrices}
          />
        </div>
      )}

      {/* Contract Modal */}
      {showContract && (
        <div className="contract-modal-overlay">
          <div className="contract-modal">
            <div className="contract-modal-header">
              <h2>Contrat de Location - Réservation #{selectedContractReservation?.id}</h2>
              <div className="contract-modal-actions">
                <button 
                  className="btn btn-primary" 
                  onClick={() => handlePrintContract(selectedContractReservation)}
                >
                  <FaPrint className="btn-icon" />
                  Imprimer Contrat
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowContract(false)} // Just close, don't reset checkbox
                >
                  <FaTimes className="btn-icon" />
                  Fermer
                </button>
              </div>
            </div>
            <div className="contract-modal-content">
              {/* Price Visibility Control */}
              <div className="price-visibility-control">
                <h3>Options d'affichage</h3>
                <div className="price-checkbox-group">
                  <label className="price-checkbox-label">
                    <input
                      type="checkbox"
                      checked={hideContractPrices}
                      onChange={handleHidePricesChange}
                    />
                    Masquer les prix dans le contrat
                  </label>
                  <div className="price-checkbox-description">
                    Si coché, tous les montants (prix unitaire, montant TTC, montant payé, montant restant) seront remplacés par des traits dans le contrat.
                  </div>
                </div>
              </div>

              {/* Signature Input Section */}
              <div className="signature-input-section">
                <h3>Signatures</h3>
                <div className="signature-inputs">
                  <div className="signature-input-group">
                    <label>Signature Agent:</label>
                    <input
                      type="text"
                      value={contractSignatures.agent}
                      onChange={(e) => handleSignatureChange('agent', e.target.value)}
                      placeholder="Nom de l'agent"
                      className="signature-input"
                    />
                  </div>
                  <div className="signature-input-group">
                    <label>Signature Locataire:</label>
                    <input
                      type="text"
                      value={contractSignatures.locataire}
                      onChange={(e) => handleSignatureChange('locataire', e.target.value)}
                      placeholder="Nom du locataire"
                      className="signature-input"
                    />
                  </div>
                  <div className="signature-input-group">
                    <label>Deuxième Conducteur:</label>
                    <input
                      type="text"
                      value={contractSignatures.secondConducteur}
                      onChange={(e) => handleSignatureChange('secondConducteur', e.target.value)}
                      placeholder="Nom du conducteur"
                      className="signature-input"
                    />
                  </div>
                </div>
              </div>

              {/* Paperwork Checkboxes */}
              <div className="paperwork-checkboxes">
                <h3>Documents Remis</h3>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={contractPaperwork.carteGrise}
                      onChange={() => handlePaperworkChange('carteGrise')}
                    />
                    Carte grise
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={contractPaperwork.assurance}
                      onChange={() => handlePaperworkChange('assurance')}
                    />
                    Assurance
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={contractPaperwork.vignette}
                      onChange={() => handlePaperworkChange('vignette')}
                    />
                    Vignette
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={contractPaperwork.visiteTechnique}
                      onChange={() => handlePaperworkChange('visiteTechnique')}
                    />
                    Visite technique
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={contractPaperwork.autorisation}
                      onChange={() => handlePaperworkChange('autorisation')}
                    />
                    Autorisation
                  </label>
                </div>
              </div>

              <ContractLocation 
                reservation={{
                  ...selectedContractReservation,
                  signatures: contractSignatures,
                  paperwork: contractPaperwork
                }}
                showSignatures={true}
                currentUser={currentUser}
                hidePrices={hideContractPrices}
              />
            </div>
          </div>
        </div>
      )}

      <div className="section-header">
        <div className="header-content">
          <h1 className="section-title">
            <FaCalendarAlt className="title-icon" />
            Gestion des Réservations
            {statusFilter !== 'all' && (
              <span className="filter-indicator">
                - Filtre: {statusFilter === 'overdue' ? 'En retard' : 
                          statusFilter === 'pending' ? 'En attente' :
                          statusFilter === 'confirmed' ? 'Confirmé' :
                          statusFilter === 'completed' ? 'Terminé' :
                          statusFilter === 'contacted' ? 'Contacté' :
                          statusFilter === 'cancelled' ? 'Annulé' : statusFilter}
              </span>
            )}
          </h1>
          <p className="section-subtitle">Gérez les réservations de véhicules et les contrats</p>
        </div>
        <div className="section-actions">
          <button className="btn btn-secondary" onClick={refreshData} disabled={submitting}>
            <FaRedo className="btn-icon" />
            Actualiser
          </button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
            {submitting ? <FaSpinner className="btn-icon spinning" /> : <FaPlus className="btn-icon" />}
            {submitting ? 'Traitement...' : 'Nouvelle Réservation'}
          </button>
          <button className="btn btn-secondary" onClick={handleExport} disabled={submitting}>
            <FaFileExport className="btn-icon" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-box">
  <FaSearch className="search-icon" />
  <input
    type="text"
    placeholder="Rechercher par client, véhicule, immatriculation ou ID..."
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
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmé</option>
              <option value="retard">En retard</option>
              <option value="contacted">Contacté</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="date-filter">
              <FaCalendarAlt className="filter-icon" />
              Date
            </label>
            <select
              id="date-filter"
              value={dateFilter}
              onChange={handleDateFilter}
              className="filter-select"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="this_week">Cette semaine</option>
              <option value="this_month">Ce mois</option>
              <option value="upcoming">À venir</option>
              <option value="past">Passé</option>
              <option value="active">En cours</option>
              <option value="late">En retard</option>
            </select>
          </div>

          {(searchTerm !== '' || statusFilter !== 'all' || dateFilter !== 'all') && (
            <button className="btn btn-clear" onClick={clearFilters}>
              Effacer les filtres
            </button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <span className="results-count">
          Affichage de {currentReservations.length} sur {filteredReservations.length} réservations
          {filteredReservations.length !== reservations.length && ` (filtré sur ${reservations.length} au total)`}
        </span>
        <span className="page-info">
          Page {currentPage} sur {totalPages}
        </span>
      </div>

      <div className="content-container">
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinning" size={48} />
            <p>Chargement des réservations...</p>
          </div>
        ) : currentReservations.length > 0 ? (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Véhicule</th>
                  <th>Période</th>
                  <th>Jours</th>
                  <th>Jours Restants</th>
                  <th>Prix</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentReservations.map(reservation => {
                  // ✅ FIXED: Use the corrected calculateRentalDays function
                  const totalDays = calculateRentalDays(reservation.start_date, reservation.end_date);
                  // ✅ UPDATED: Pass the entire reservation to calculate days remaining
                  const daysRemaining = calculateDaysRemaining(reservation);
                  
                  return (
                    <tr key={reservation.id}>
                      <td className="reservation-id">#{reservation.id}</td>
                      <td className="client-name">
                        {reservation.client?.prenom} {reservation.client?.nom}
                      </td>
                      <td className="car-info">
                        <div className="car-info-container">
                          <div className="car-brand-model">
                            {reservation.car?.brand} {reservation.car?.model}
                          </div>
                          <div className="car-details">
                            <span className="car-color">
                              <FaPalette className="icon-small" />
                              {reservation.car?.color || 'N/A'}
                            </span>
                            {reservation.matricule?.matricule_code && (
                              <span className="car-matricule">
                                <FaCar className="icon-small" />
                                {reservation.matricule.matricule_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="reservation-period">
                        {new Date(reservation.start_date).toLocaleDateString('fr-FR')} - {' '}
                        {new Date(reservation.end_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="rental-days">
                        {totalDays} jours
                      </td>
                      <td className={`days-remaining ${reservation.status === 'retard' ? 'late' : ''}`}>
                        {daysRemaining}
                      </td>
                      <td className="price-cell">{reservation.total_price} DH</td>
                      <td>
                        {getStatusBadge(reservation.status)}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-action btn-edit" 
                            onClick={() => handleEdit(reservation)}
                            title="Modifier la réservation"
                            disabled={submitting}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="btn-action btn-view" 
                            onClick={() => handleViewContract(reservation)}
                            title="Voir le contrat"
                            disabled={submitting}
                          >
                            <FaUser />
                          </button>
                          <button 
                            className="btn-action btn-print" 
                            onClick={() => handlePrintContract(reservation)}
                            title="Imprimer le contrat"
                            disabled={submitting}
                          >
                            <FaPrint />
                          </button>
                          <button 
                            className="btn-action btn-delete" 
                            onClick={() => showDeleteConfirmation(reservation)}
                            title="Supprimer la réservation"
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
                  {renderPaginationButtons()}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="no-data">
            <FaDatabase size={48} />
            <p>
              {reservations.length === 0 
                ? 'Aucune réservation trouvée' 
                : 'Aucune réservation ne correspond à vos critères de recherche'}
            </p>
            <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
              <FaPlus className="btn-icon" />
              Créer une nouvelle réservation
            </button>
            {(searchTerm !== '' || statusFilter !== 'all' || dateFilter !== 'all') && (
              <button className="btn btn-secondary" onClick={clearFilters} style={{marginTop: '1rem'}}>
                Effacer les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <AdminModal
          type="reservations"
          modalType={modalType}
          formData={formData}
          setFormData={setFormData}
          onClose={() => !submitting && setShowModal(false)}
          onSubmit={handleSubmit}
          clients={clients}
          cars={cars}
          matricules={matricules}
          submitting={submitting}
        />
      )}

      {/* Confirmation Modal */}
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
              
              {confirmationConfig.reservation && (
                <div className="reservation-preview">
                  <div className="reservation-info-preview">
                    <h4>Réservation #{confirmationConfig.reservation.id}</h4>
                    <div className="reservation-meta-preview">
                      <div className="reservation-client">
                        <strong>Client:</strong> {confirmationConfig.reservation.client?.prenom} {confirmationConfig.reservation.client?.nom}
                      </div>
                      <div className="reservation-car">
                        <strong>Véhicule:</strong> {confirmationConfig.reservation.car?.brand} {confirmationConfig.reservation.car?.model}
                        {confirmationConfig.reservation.car?.color && (
                          <span style={{marginLeft: '10px', color: '#6c757d'}}>
                            ({confirmationConfig.reservation.car.color})
                          </span>
                        )}
                        {confirmationConfig.reservation.matricule?.matricule_code && (
                          <div style={{marginTop: '5px', color: '#495057'}}>
                            <strong>Immatriculation:</strong> {confirmationConfig.reservation.matricule.matricule_code}
                          </div>
                        )}
                      </div>
                      <div className="reservation-period">
                        <strong>Période:</strong> {new Date(confirmationConfig.reservation.start_date).toLocaleDateString('fr-FR')} - {new Date(confirmationConfig.reservation.end_date).toLocaleDateString('fr-FR')}
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
                disabled={submitting}
              >
                Annuler
              </button>
              <button 
                className={`btn-confirm-${confirmationConfig.type}`}
                onClick={confirmationConfig.onConfirm}
                disabled={submitting}
              >
                {submitting ? <FaSpinner className="spinning" /> : 'Supprimer la réservation'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .reservations-management {
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

        .section-header-contract {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          background: #354191;
          color:white;
          padding: 4px 15px;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
          font-weight: 700;
          font-size: 12px;
          margin: 0 0 6px 0;
          text-transform: uppercase;
          border-bottom: 1px solid #000;
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

        .content-container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          color: #6c757d;
        }

        .loading-state p {
          margin-top: 1rem;
        }

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

        .reservation-id {
          font-weight: 600;
          color: #6c757d;
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .client-name {
          font-weight: 600;
          color: #2c3e50;
        }

        /* Updated Car Info Styles */
        .car-info-container {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .car-brand-model {
          font-weight: 600;
          color: #2c3e50;
        }

        .car-details {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          font-size: 0.75rem;
          color: #6c757d;
        }

        .car-color, .car-matricule {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          background: #f8f9fa;
          border-radius: 4px;
          border: 1px solid #e9ecef;
        }

        .icon-small {
          font-size: 0.7rem;
        }

        .reservation-period {
          color: #6c757d;
          font-size: 0.8rem;
        }

        .rental-days {
          text-align: center;
          font-weight: 600;
          color: #495057;
        }

        .days-remaining {
          text-align: center;
          font-weight: 500;
          color: #28a745;
          font-size: 0.8rem;
        }

        .days-remaining.late {
          color: #ff8c00;
          font-weight: 600;
        }

        .price-cell {
          font-weight: 600;
          color: #28a745;
        }

        .status-badge {
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 0.25rem;
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

        .status-icon {
          font-size: 0.7rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        .btn-action {
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

        .btn-action:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-edit {
          background: rgba(255, 193, 7, 0.1);
          color: #ffc107;
          border: 1px solid rgba(255, 193, 7, 0.2);
        }

        .btn-edit:hover:not(:disabled) {
          background: #ffc107;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
        }

        .btn-view {
          background: rgba(23, 162, 184, 0.1);
          color: #17a2b8;
          border: 1px solid rgba(23, 162, 184, 0.2);
        }

        .btn-view:hover:not(:disabled) {
          background: #17a2b8;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(23, 162, 184, 0.3);
        }

        .btn-print {
          background: rgba(108, 117, 125, 0.1);
          color: #6c757d;
          border: 1px solid rgba(108, 117, 125, 0.2);
        }

        .btn-print:hover:not(:disabled) {
          background: #6c757d;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
        }

        .btn-delete {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          border: 1px solid rgba(220, 53, 69, 0.2);
        }

        .btn-delete:hover:not(:disabled) {
          background: #dc3545;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
        }

        .no-data {
          text-align: center;
          padding: 4rem 2rem;
          color: #6c757d;
        }

        .no-data p {
          margin: 1rem 0 2rem;
          font-size: 1.1rem;
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

        /* Contract Modal Styles */
        .contract-modal-overlay {
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
          padding: 1rem;
          backdrop-filter: blur(5px);
        }

        .contract-modal {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          max-width: 95%;
          max-height: 95vh;
          width: 1200px;
          overflow: hidden;
          animation: modalSlideIn 0.3s ease-out;
          display: flex;
          flex-direction: column;
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

        .contract-modal-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8f9fa;
        }

        .contract-modal-header h2 {
          margin: 0;
          color: #1a1a1a;
          font-size: 1.5rem;
        }

        .contract-modal-actions {
          display: flex;
          gap: 1rem;
        }

        .contract-modal-content {
          overflow-y: auto;
          padding: 1rem;
          max-height: calc(95vh - 100px);
        }

        /* Price Visibility Control */
        .price-visibility-control {
          background: #f0f8ff;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          border: 1px solid #d1e7ff;
        }

        .price-visibility-control h3 {
          margin: 0 0 1rem 0;
          color: #1a1a1a;
          font-size: 1.2rem;
        }

        .price-checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .price-checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1rem;
          font-weight: 600;
          color: #495057;
          cursor: pointer;
        }

        .price-checkbox-label input {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .price-checkbox-description {
          font-size: 0.875rem;
          color: #6c757d;
          margin-left: 2rem;
          font-style: italic;
        }

        /* Signature Input Section */
        .signature-input-section {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          border: 1px solid #e9ecef;
        }

        .signature-input-section h3 {
          margin: 0 0 1rem 0;
          color: #1a1a1a;
          font-size: 1.2rem;
        }

        .signature-inputs {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .signature-input-group {
          flex: 1;
          min-width: 200px;
        }

        .signature-input-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #495057;
          font-size: 0.875rem;
        }

        .signature-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 0.875rem;
          transition: all 0.3s ease;
        }

        .signature-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        /* Paperwork Checkboxes */
        .paperwork-checkboxes {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          border: 1px solid #e9ecef;
        }

        .paperwork-checkboxes h3 {
          margin: 0 0 1rem 0;
          color: #1a1a1a;
          font-size: 1.2rem;
        }

        .checkbox-group {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #495057;
          cursor: pointer;
        }

        .checkbox-label input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        /* Contract Styles - OPTIMIZED FOR ONE PAGE */
        .contract-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 10px;
          font-family: Arial, sans-serif;
          font-size: 8px;
          color: #000;
          background: #fff;
          border: 1px solid #000;
          user-select: none;
          line-height: 1.1;
          height: auto;
          min-height: auto;
          page-break-inside: avoid;
        }

        .contract-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2px;
          border-bottom: 2px solid #000;
          padding-bottom: 6px;
          min-height: 60px;
        }

        .header-left {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: space-between;
          flex: 1;
          height: 100%;
        }

        .location-text {
          font-weight: bold;
          font-size: 18px;
          margin-top: 32px;
        }

        .phone-number {
          font-size: 12px;
          color: #000;
          font-weight: bold;
          margin-top: 30px;
        }

        .header-center {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .company-logo {
          width: 300px;
          height: auto;
          object-fit: contain;
        }

        .header-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-between;
          flex: 1;
          height: 100%;
        }

        .arabic-text {
          font-weight: bold;
          font-size: 25px;
          margin-top: 30px;
          font-family: 'Arial', sans-serif;
          direction: rtl;
        }

        .contract-number-red {
          font-weight: 900;
          font-size: 12px;
          color: #ff0000;
          font-family: monospace;
          background: #fff;
          padding: 2px 4px;
          border: 1px solid #ff0000;
          border-radius: 2px;
          margin-top: 20px;
        }

        .contract-title {
          text-align: center;
          font-weight: 700;
          font-size: 10px;
          margin: 0 0 8px 0;
          text-transform: uppercase;
        }

        .two-columns-layout {
          display: flex;
          gap: 15px;
          margin-bottom: 10px;
          align-items: stretch;
        }

        .left-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .right-column {
          flex: 1;
        }

        .section-block {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .full-height {
          height: 100%;
          display: flex;
          flex-direction: column;
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
          background-color:#ffffaa;
          color:#354191;
          border-radius:12px;
          padding:2px 4px;
          margin-right: 5px;
        }

        .dots-line {
          flex-grow: 1;
          border-bottom: 1px dotted #000;
          height: 1px;
          position: relative;
          top: 1px;
          user-select: none;
          min-height: 8px;
          display: flex;
          align-items: center;
          padding: 0 2px;
          font-size:12px;
        }

        /* Checklist */
        .checklist-section {
          margin-top: 10px;
          margin-bottom: 10px;
        }

        .checklist-title {
          margin-bottom: 8px;
        }

        .etat-vehicule {
          display: flex;
          justify-content: space-around;
          gap: 10px;
          margin-bottom: 8px;
        }

        .etat-label {
          font-weight: 700;
          font-size: 7px;
          text-align: center;
          margin-bottom: 2px;
        }

        .car-diagram-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .checklist-image {
          width: 120px;
          height: 80px;
          object-fit: contain;
          border: 1px solid #ddd;
          border-radius: 3px;
        }

        /* Paperwork black bar */
        .paperwork-bar {
          background-color: #354191;
          color: #fff;
          font-size: 12px;
          border-radius: 15px;
          padding: 3px 10px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          user-select: none;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          background: #354191;
          color: white;
          padding: 4px 15px;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          font-weight: 700;
          font-size: 12px;
          margin: 0 0 6px 0;
          border-bottom: 1px solid #000;
        }

        .paperwork-item {
          display: flex;
          align-items: center;
          gap: 3px;
          white-space: nowrap;
        }

        /* Checkbox box */
        .checkbox-square {
          width: 10px;
          height: 10px;
          border: 1px solid #fff;
          background-color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 7px;
          font-weight: bold;
        }

        .checkbox-square.checked {
          background-color: #000;
          color: #fff;
        }

        /* Observation and Assurance */
        .observations-section {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .observation-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          font-size: 7px;
        }

        .observation-box.half-width {
          flex: 0 0 48%;
        }

        .obs-title {
          font-weight: 700;
          margin-bottom: 3px;
          margin-left: 2px;
          font-size:9px;
        }

        .observation-content {
          border: 1px solid #000;
          padding: 2px 4px;
          font-family: Arial, sans-serif;
          font-size: 10px;
          line-height: 1.1;
          user-select: none;
          min-height: 40px;
          background: #fff;
        }

        .observation-text {
          white-space: pre-line;
        }

        /* Signature area */
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          gap: 6px;
          user-select: none;
        }

        .signature-block {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .signature-label {
          font-weight: 700;
          font-size: 7px;
          margin-bottom: 3px;
          font-size:9px;
        }

        .signature-box {
          border: 1px solid #000;
          width: 100%;
          min-height: 60px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .signature-text {
          font-size: 9px;
          font-weight: bold;
          color: #000;
          text-align: center;
        }

        /* Footer */
        .contract-footer {
          font-size: 8px;
          font-weight: 700;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.1px;
          line-height: 1.1;
          user-select: none;
          margin-top: 8px;
        }

        /* Confirmation Modal Styles */
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

        .reservation-preview {
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }

        .reservation-info-preview {
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }

        .reservation-info-preview h4 {
          margin: 0 0 1rem 0;
          color: #1a1a1a;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .reservation-meta-preview {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .reservation-client,
        .reservation-car,
        .reservation-period {
          color: #6c757d;
        }

        .reservation-client strong,
        .reservation-car strong,
        .reservation-period strong {
          color: #495057;
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

        .btn-confirm-cancel:hover:not(:disabled) {
          background: #6c757d;
          color: white;
        }

        .btn-confirm-cancel:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-confirm-delete:hover:not(:disabled) {
          background: #c82333;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
        }

        .btn-confirm-delete:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
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

        /* Kilometer Excess Clause */
        .kilometer-excess-clause {
          margin: 8px 0;
          padding: 6px 10px;
          background: rgba(255, 0, 0, 0.05);
          border: 1px solid #dc3545;
          border-radius: 6px;
          font-size: 9px;
          line-height: 1.2;
          text-align: center;
          user-select: none;
          page-break-inside: avoid;
        }

        .kilometer-excess-content {
          font-family: Arial, sans-serif;
        }

        .kilometer-excess-content strong {
          color: #dc3545;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .reservations-management {
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
            flex-direction: column;
            gap: 0.25rem;
          }

          .action-buttons .btn-action {
            padding: 0.5rem;
          }

          .pagination {
            flex-wrap: wrap;
            justify-content: center;
          }

          .contract-modal {
            margin: 0.5rem;
            max-width: 100%;
          }

          .contract-modal-header {
            flex-direction: column;
            gap: 1rem;
          }

          .contract-modal-actions {
            width: 100%;
            justify-content: center;
          }

          .signature-inputs {
            flex-direction: column;
          }

          .checkbox-group {
            grid-template-columns: 1fr;
          }

          .two-columns-layout {
            flex-direction: column;
            gap: 10px;
          }
          
          .observations-section {
            flex-direction: column;
          }
          
          .observation-box.half-width {
            flex: 1;
          }
          
          .signature-section {
            flex-direction: column;
            gap: 10px;
          }

          .confirmation-modal {
            margin: 1rem;
          }

          .confirmation-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ReservationsManagement;
