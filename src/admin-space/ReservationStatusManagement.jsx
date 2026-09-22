// src/components/admin/ReservationStatusManagement.jsx
import React, { useEffect, useState, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaPlus, FaEdit, FaTrash, FaFileExport, FaDatabase, FaPrint,
  FaCheck, FaTimes, FaCalendarAlt, FaCar, FaUser, FaMoneyBill,
  FaExclamationTriangle, FaSpinner, FaRedo, FaSearch, FaFilter,
  FaChevronLeft, FaChevronRight, FaChevronUp, FaClock, FaPalette,
  FaUserFriends, FaUserPlus, FaPhone, FaEye, FaIdCard,
  FaTachometerAlt, FaMapMarkerAlt, FaFileSignature, FaKey,
  FaReceipt, FaCheckCircle, FaBan, FaEyeSlash, FaMinus, FaCog,
  FaShieldAlt,
} from 'react-icons/fa';
import PaginationControls from '../components/PaginationControls';
import { useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import {
  fetchReservations, updateReservation, deleteReservation,
  fetchClients, fetchCars, fetchMatricules,
  selectReservations, selectReservationsLoading, selectClients,
  selectCars, selectMatricules, selectUser, refreshMatricules,
  checkLateReservations,
} from '../Redux/store';
import { syncReportForReservation } from '../utils/reportSync'; // ✅ NEW
import AdminModal from './AdminModal';

import checklistImage from '../assets/Checklist.png';
import logoImage from '../assets/lolo.png';
import cacherImage from '../assets/cacher.png';

const STATUS_SCOPE = ['pending', 'contacted', 'cancelled'];
const STATUS_CONFIG = {
  pending:   { class: 'status-pending',   text: 'En attente',  icon: FaClock },
  contacted: { class: 'status-contacted', text: 'Contacté',    icon: FaPhone },
  cancelled: { class: 'status-cancelled', text: 'Annulé',      icon: FaTimes },
};

const DEFAULT_PAPERWORK = {
  circulation: true, carteGrise: true, assurance: true,
  vignette: true, visiteTechnique: true, autorisation: true,
};

const DEFAULT_DISPLAY_OPTIONS = {
  prices: 'dash', clientInfo: 'show', secondDriver: 'show', vehicleInfo: 'show',
  deliveryReception: 'show', rentalDates: 'show', kilometrage: 'show',
  rentalDays: 'dash', observations: 'show', insurance: 'show',
  depositGuarantee: 'show', signatures: 'show',
};

const Checkbox = ({ checked = false }) => (
  <span className={`checkbox-square ${checked ? 'checked' : ''}`}>{checked && '✓'}</span>
);
const CarDiagram = () => (
  <div className="car-diagram-container">
    <img src={checklistImage} alt="Car Checklist Diagram" className="checklist-image" />
  </div>
);
const ObservationBox = ({ title, isHalf = false, children, option = 'show' }) => {
  if (option === 'hide') return null;
  return (
    <div className={`observation-box ${isHalf ? 'half-width' : ''}`}>
      <label className="obs-title">{title} :</label>
      <div className="observation-content">{option === 'dash' ? '___________' : children}</div>
    </div>
  );
};
const SignatureBlock = ({ label, signature = '', option = 'show', cachet = false }) => {
  if (option === 'hide') {
    return (
      <div className="signature-block">
        <div className="signature-label">{label}</div>
        <div className="signature-box"></div>
      </div>
    );
  }
  const toSrc = (val) => {
    if (!val || typeof val !== 'string') return null;
    if (val.startsWith('data:image')) return val;
    if (/^https?:\/\//i.test(val)) return val;
    if (/^\/.*\.(png|jpe?g|gif|webp|svg)$/i.test(val)) return `${window.location.origin}${val}`;
    if (/^[A-Za-z0-9+/=]{200,}$/.test(val)) return `data:image/png;base64,${val}`;
    return null;
  };
  const src = toSrc(signature);
  return (
    <div className="signature-block">
      <div className="signature-label">{label}</div>
      <div className="signature-box">
        {option === 'dash' ? (<div className="signature-text">___________</div>)
         : src ? (<img src={src} alt={label} className="signature-img" crossOrigin="anonymous" />)
         : signature ? (<div className="signature-text">{signature}</div>) : null}
        {cachet && (<img src={cacherImage} alt="Cachet" className="signature-cache" crossOrigin="anonymous" />)}
      </div>
    </div>
  );
};

const ContractDisplayOptions = ({ options, onOptionChange, onResetAll }) => {
  const sections = [
    { id: 'prices', label: 'Prix et Montants', icon: FaMoneyBill },
    { id: 'clientInfo', label: 'Informations du Locataire', icon: FaUser },
    { id: 'secondDriver', label: 'Deuxième Conducteur', icon: FaUserFriends },
    { id: 'vehicleInfo', label: 'Informations du Véhicule', icon: FaCar },
    { id: 'deliveryReception', label: 'Livraison et Réception', icon: FaKey },
    { id: 'rentalDates', label: 'Dates de Location', icon: FaCalendarAlt },
    { id: 'kilometrage', label: 'Kilométrage', icon: FaTachometerAlt },
    { id: 'rentalDays', label: 'Nombre de jours', icon: FaClock },
    { id: 'observations', label: 'Observations', icon: FaMapMarkerAlt },
    { id: 'insurance', label: 'Assurance Supplémentaire', icon: FaShieldAlt },
    { id: 'depositGuarantee', label: 'Caution et Garantie', icon: FaMoneyBill },
    { id: 'signatures', label: 'Signatures', icon: FaFileSignature },
  ];
  const displayModes = [
    { value: 'show', label: 'Afficher normalement', icon: FaEye },
    { value: 'hide', label: 'Masquer les valeurs', icon: FaEyeSlash },
    { value: 'dash', label: 'Remplacer par des traits', icon: FaMinus },
  ];
  return (
    <div className="display-options-panel">
      <div className="display-options-header">
        <h3><FaCog size={16} /> Options d'affichage du contrat</h3>
        <button type="button" onClick={onResetAll} className="reset-all-btn">
          <FaRedo size={14} /> Réinitialiser toutes les options
        </button>
      </div>
      <div className="display-options-grid">
        {sections.map(section => {
          const IconComponent = section.icon;
          const currentValue = options[section.id] || 'show';
          return (
            <div key={section.id} className="display-option-item">
              <div className="display-option-label"><IconComponent size={14} /><span>{section.label}</span></div>
              <div className="display-option-buttons">
                {displayModes.map(mode => {
                  const ModeIcon = mode.icon;
                  return (
                    <button key={mode.value} type="button"
                      className={`mode-btn ${currentValue === mode.value ? 'active' : ''}`}
                      onClick={() => onOptionChange(section.id, mode.value)} title={mode.label}>
                      <ModeIcon size={12} />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ================ ContractLocation — light blue palette ================ */
const ContractLocation = ({
  reservation, showSignatures = false, currentUser, displayOptions = {},
  includeCache = false, containerId = 'contract-print-root',
}) => {
  const [signatures, setSignatures] = useState({ agent: '', locataire: '', secondConducteur: '' });

  useEffect(() => {
    if (!reservation) return;
    const nested = reservation.signatures || {};
    const pick = (...candidates) => {
      for (const c of candidates) {
        if (!c) continue;
        if (typeof c === 'string' && c.length > 20) return c;
        if (typeof c === 'object') {
          if (typeof c.image === 'string' && c.image.length > 20) return c.image;
          if (typeof c.data === 'string' && c.data.length > 20) return c.data;
          if (typeof c.signature === 'string' && c.signature.length > 20) return c.signature;
        }
      }
      return '';
    };
    const agent = pick(nested.agent, nested.agent_signature, nested.agent_image,
      reservation.signature_agent, reservation.agent_signature, reservation.agent_image);
    const locataire = pick(nested.locataire, nested.client, nested.client_signature,
      nested.locataire_signature, nested.locataire_image,
      reservation.signature_locataire, reservation.signature_client,
      reservation.locataire_signature, reservation.client_signature,
      reservation.locataire_image, typeof reservation.signature === 'string' ? reservation.signature : null);
    const secondConducteur = pick(nested.secondConducteur, nested.second_driver,
      nested.secondDriver, nested.second_conducteur, nested.secondConducteur_image,
      reservation.signature_second_conducteur, reservation.signature_second_driver,
      reservation.second_driver_signature, reservation.second_conducteur_signature,
      reservation.secondConducteur_image);
    setSignatures({ agent, locataire, secondConducteur });
  }, [reservation]);

  const paperwork = reservation?.paperwork || DEFAULT_PAPERWORK;

  const getCurrentUserName = () => {
    let userName = '';
    if (currentUser) userName = currentUser.Fullname || currentUser.fullname || currentUser.name || currentUser.username || currentUser.email || '';
    if (!userName) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) { const userData = JSON.parse(storedUser); userName = userData.Fullname || userData.fullname || userData.name || userData.username || userData.email || ''; }
      } catch (error) { console.error(error); }
    }
    return userName || 'Administrateur OULFA DRIVE';
  };

  const getReservationCreatorName = () => {
    if (reservation?.created_by) return reservation.created_by;
    if (reservation?.user?.Fullname) return reservation.user.Fullname;
    if (reservation?.user?.name) return reservation.user.name;
    return '___________';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      let date;
      if (dateString.includes('T')) date = new Date(dateString);
      else if (dateString.includes(' ')) date = new Date(dateString.split(' ')[0]);
      else date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('fr-FR');
    } catch (error) { console.error(error); return ''; }
  };

  const calculateRentalDays = () => {
    if (!reservation?.start_date || !reservation?.end_date) return 1;
    const start = new Date(reservation.start_date); const end = new Date(reservation.end_date);
    start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
  };

  const rentalDays = reservation?.rental_days || calculateRentalDays();
  const dailyPrice = (reservation?.total_price && rentalDays) ? (reservation.total_price / rentalDays).toFixed(2) : reservation?.car?.price_per_day || '—';

  const getCautionAmount = () => {
    if (!reservation?.payment_history || !Array.isArray(reservation.payment_history)) return reservation?.amount_paid ? `${reservation.amount_paid}` : '_________';
    const cautionPayments = reservation.payment_history.filter(p => p.notes && p.notes.toLowerCase().includes('caution'));
    if (cautionPayments.length > 0) return cautionPayments.reduce((s, p) => s + (p.amount || 0), 0);
    return reservation?.amount_paid ? `${reservation.amount_paid}` : '_________';
  };

  const opt = (key) => displayOptions?.[key] || 'show';
  const getDisplayValue = (option, actualValue, dashValue = '___________') => {
    if (option === 'hide') return '';
    if (option === 'dash') return dashValue;
    return actualValue;
  };

  const renderContractNumber = () => {
    if (reservation?.contract_number && reservation?.contract_year) {
      const year = reservation.contract_year; const num = String(reservation.contract_number).padStart(5, '0'); return `${year}/${num}`;
    }
    if (reservation?.id) { const year = new Date(reservation?.start_date || Date.now()).getFullYear(); const num = String(reservation.id).padStart(5, '0'); return `${year}/${num}`; }
    return '—';
  };

  const secondDriver = reservation?.has_second_driver ? reservation?.second_driver_client : null;
  const locataireSignature = signatures.locataire || '';
  const secondDriverSignature = signatures.secondConducteur || '';

  return (
    <div className="contract-container-print" id={containerId}>
      <table className="contract-header-table" cellPadding="0" cellSpacing="0">
        <tbody>
          <tr>
            <td className="header-left">
              <div className="company-name">OULFA DRIVE</div>
              <div className="company-slogan">LOCATION DE VOITURE</div>
              <div className="company-phone"><FaPhone size={10} style={{ marginRight: '4px', display: 'inline' }} /> 0665 921 921</div>
            </td>
            <td className="header-center"><img src={logoImage} alt="OULFA DRIVE" className="contract-logo-print" /></td>
            <td className="header-right">
              <div className="contract-number-box stylish">
                <div className="contract-number-label">CONTRAT N°</div>
                <div className="contract-number-value">{renderContractNumber()}</div>
              </div>
              <div className="arabic-text">كراء السيارات</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="contract-title-print">CONTRAT DE LOCATION</div>

      <table className="contract-content-table" cellPadding="0" cellSpacing="0">
        <tbody>
          <tr>
            <td className="contract-left-col">
              <div className="contract-section">
                <div className="section-title-print">LOCATAIRE</div>
                <div className="section-content">
                  {[['Nom', reservation?.client?.nom],['Prénom', reservation?.client?.prenom],['Date naissance', formatDate(reservation?.client?.date_naissance)],['Lieu naissance', reservation?.client?.lieu_naissance],['CIN', reservation?.client?.cin_number],['Expire le', formatDate(reservation?.client?.cin_delivre_le)],['Permis N°', reservation?.client?.driver_license_number],['Expire le', formatDate(reservation?.client?.permis_delivre_le)],['Adresse', reservation?.client?.city],['Téléphone', reservation?.client?.telephone],['Email', reservation?.client?.email]].map(([l, v], i) => (
                    <div className="field-row" key={i}><span className="field-label">{l} :</span><span className="field-value">{getDisplayValue(opt('clientInfo'), v || '—')}</span></div>
                  ))}
                </div>
              </div>
              <div className="contract-section">
                <div className="section-title-print">DEUXIÈME CONDUCTEUR</div>
                <div className="section-content">
                  {opt('secondDriver') === 'hide' ? (
                    ['Nom','Prénom','Date naissance','Lieu naissance','CIN','Expire le','Permis N°','Expire le','Adresse','Téléphone','Email'].map((l,i) => (
                      <div className="field-row" key={i}><span className="field-label">{l} :</span><span className="field-value"></span></div>
                    ))
                  ) : opt('secondDriver') === 'dash' ? (
                    ['Nom','Prénom','Date naissance','Lieu naissance','CIN','Expire le','Permis N°','Expire le','Adresse','Téléphone','Email'].map((l,i) => (
                      <div className="field-row" key={i}><span className="field-label">{l} :</span><span className="field-value">___________</span></div>
                    ))
                  ) : secondDriver ? (
                    [['Nom', secondDriver.nom],['Prénom', secondDriver.prenom],['Date naissance', formatDate(secondDriver.date_naissance)],['Lieu naissance', secondDriver.lieu_naissance],['CIN', secondDriver.cin_number],['Expire le', formatDate(secondDriver.cin_delivre_le)],['Permis N°', secondDriver.driver_license_number],['Expire le', formatDate(secondDriver.permis_delivre_le)],['Adresse', secondDriver.city],['Téléphone', secondDriver.telephone],['Email', secondDriver.email]].map(([l, v], i) => (
                      <div className="field-row" key={i}><span className="field-label">{l} :</span><span className="field-value">{v || '—'}</span></div>
                    ))
                  ) : (
                    ['Nom','Prénom','Date naissance','Lieu naissance','CIN','Expire le','Permis N°','Expire le','Adresse','Téléphone','Email'].map((l,i) => (
                      <div className="field-row" key={i}><span className="field-label">{l} :</span><span className="field-value">—</span></div>
                    ))
                  )}
                </div>
              </div>
            </td>

            <td className="contract-right-col">
              <div className="contract-section">
                <div className="section-title-print">VÉHICULE</div>
                <div className="section-content">
                  <div className="field-row"><span className="field-label">Immatriculation :</span><span className="field-value matricule-code">{getDisplayValue(opt('vehicleInfo'), reservation?.matricule?.matricule_code || '—')}</span></div>
                  <div className="field-row"><span className="field-label">Marque/Modèle :</span><span className="field-value">{getDisplayValue(opt('vehicleInfo'), `${reservation?.car?.brand || ''} ${reservation?.car?.model || ''}`.trim() || '—')}</span></div>
                  <div className="field-row"><span className="field-label">Couleur :</span><span className="field-value">{getDisplayValue(opt('vehicleInfo'), reservation?.car?.color || '—')}</span></div>
                  <div className="field-row"><span className="field-label">Année :</span><span className="field-value">{getDisplayValue(opt('vehicleInfo'), reservation?.car?.year || '—')}</span></div>
                  <div className="field-row"><span className="field-label">Carburant :</span><span className="field-value">{getDisplayValue(opt('vehicleInfo'), reservation?.car?.fuel_type || '—')}</span></div>
                  <div className="field-row"><span className="field-label">Transmission :</span><span className="field-value">{getDisplayValue(opt('vehicleInfo'), reservation?.car?.transmission || '—')}</span></div>
                </div>
              </div>
              <div className="contract-section">
                <div className="section-title-print">LOCATION</div>
                <div className="section-content">
                  <div className="field-row"><span className="field-label">Départ :</span><span className="field-value">{getDisplayValue(opt('rentalDates'), `${formatDate(reservation?.start_date)} à ${reservation?.start_time || '08:00'}`)}</span></div>
                  <div className="field-row"><span className="field-label">Retour :</span><span className="field-value">{getDisplayValue(opt('rentalDates'), `${formatDate(reservation?.end_date)} à ${reservation?.end_time || '18:00'}`)}</span></div>
                  <div className="field-row"><span className="field-label">Durée :</span><span className="field-value">{getDisplayValue(opt('rentalDays'), `${calculateRentalDays()} jours` + (reservation?.prolongation_days > 0 ? ` (dont prolongation: ${reservation.prolongation_days} jours)` : ''))}</span></div>
                  {reservation?.prolongation_days > 0 && (<div className="field-row"><span className="field-label">Prolongation :</span><span className="field-value">{reservation.prolongation_days} jours</span></div>)}
                  <div className="field-row"><span className="field-label">Km départ :</span><span className="field-value">{getDisplayValue(opt('kilometrage'), `${reservation?.kilometrage_sortie || '—'} km`)}</span></div>
                  <div className="field-row"><span className="field-label">Km retour :</span><span className="field-value">{getDisplayValue(opt('kilometrage'), reservation?.kilometrage_entree ? `${reservation.kilometrage_entree} km` : '—')}</span></div>
                  <div className="field-row"><span className="field-label">Livré par :</span><span className="field-value">{getDisplayValue(opt('deliveryReception'), getCurrentUserName())}</span></div>
                  <div className="field-row"><span className="field-label">Reçu par :</span><span className="field-value">{getDisplayValue(opt('deliveryReception'), getReservationCreatorName())}</span></div>
                </div>
              </div>
              <div className="contract-section pricing-section">
                <div className="section-title-print">TARIFS</div>
                <div className="section-content">
                  <div className="field-row"><span className="field-label">Prix journalier :</span><span className="field-value">{getDisplayValue(opt('prices'), `${dailyPrice} DH`)}</span></div>
                  <div className="field-row total-row"><span className="field-label">Total TTC :</span><span className="field-value total-amount">{getDisplayValue(opt('prices'), `${reservation?.total_price || '—'} DH`)}</span></div>
                  <div className="field-row"><span className="field-label">Montant payé :</span><span className="field-value">{getDisplayValue(opt('prices'), `${reservation?.amount_paid || '0'} DH`)}</span></div>
                  <div className="field-row"><span className="field-label">Reste à payer :</span><span className="field-value remaining-amount">{getDisplayValue(opt('prices'), `${reservation?.remaining_amount || reservation?.total_price || '0'} DH`)}</span></div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="contract-section checklist-section-print">
        <div className="section-title-print">CHECKLIST - ÉTAT DU VÉHICULE</div>
        <div className="checklist-content">
          <table className="checklist-table" cellPadding="0" cellSpacing="0">
            <tbody>
              <tr>
                <td className="checklist-cell"><div className="checklist-label">État de départ :</div><CarDiagram /></td>
                <td className="checklist-cell"><div className="checklist-label">État de retour :</div><CarDiagram /></td>
              </tr>
            </tbody>
          </table>
          <div className="documents-row">
            <span className="documents-label">Documents remis :</span>
            <div className="documents-items">
              <span className="doc-item"><Checkbox checked={paperwork.carteGrise} /> Carte grise</span>
              <span className="doc-item"><Checkbox checked={paperwork.assurance} /> Assurance</span>
              <span className="doc-item"><Checkbox checked={paperwork.vignette} /> Vignette</span>
              <span className="doc-item"><Checkbox checked={paperwork.visiteTechnique} /> Visite technique</span>
              <span className="doc-item"><Checkbox checked={paperwork.autorisation} /> Autorisation</span>
            </div>
          </div>
        </div>
      </div>

      <div className="kilometrage-clause-section">
        <div className="kilometrage-clause-title">⚠️ IMPORTANT - CLAUSE DE DÉPASSEMENT DE KILOMÉTRAGE</div>
        <div className="kilometrage-clause-text">
          En cas de dépassement du kilométrage mentionné (200km par jour), vous allez payer 1.5 DH pour chaque kilomètre additionnel au-delà de la limite autorisée.
        </div>
      </div>

      <div className="observations-row-print">
        <ObservationBox title="Observations" option={opt('observations')}>
          <div className="observation-text">{getDisplayValue(opt('observations'), `Véhicule loué en bon état général. Le client s'engage à retourner le véhicule dans le même état.` + (reservation?.notes ? ` Notes: ${reservation.notes}` : ''))}</div>
        </ObservationBox>
        <ObservationBox title="Assurance" option={opt('insurance')}>
          <div className="observation-text">{getDisplayValue(opt('insurance'), 'Assurance tous risques incluse. Franchise applicable en cas de sinistre.')}</div>
        </ObservationBox>
        <ObservationBox title="Caution" isHalf option={opt('depositGuarantee')}>
          <div className="observation-text">
            Caution: {getDisplayValue(opt('depositGuarantee'), `${getCautionAmount()} DH`)}<br />
            Restant: {getDisplayValue(opt('depositGuarantee'), `${reservation?.remaining_amount || '0'} DH`)}
          </div>
        </ObservationBox>
      </div>

      <div className="signatures-row-print">
        <SignatureBlock label="Signature de l'agent" signature={showSignatures ? signatures.agent : ''} option={opt('signatures')} cachet={includeCache} />
        <SignatureBlock label="Signature du locataire" signature={showSignatures ? locataireSignature : ''} option={opt('signatures')} />
        <SignatureBlock label="Signature 2ème conducteur" signature={showSignatures ? secondDriverSignature : ''} option={opt('signatures')} />
      </div>

      <div className="contract-footer-print">
        <div className="footer-line">
          OULFA DRIVE SARL AU CAPITAL DE 500 000.00 DHS BASSATINE AL OULFA GH 3 IMMEUBLE 14 N°56 AL OULFA - CASABLANCA        
        </div>
        <div className="footer-line">
          IF: 53743931 -RC:580419 -TP: 35007229 -ICE: 003274706000087 -EMAIL: oulfadrive@gmail.com -TELEPHONE :0665921921
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Main component
// ============================================================
const ReservationStatusManagement = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  const reservations = useSelector(selectReservations);
  const loading = useSelector(selectReservationsLoading);
  const clients = useSelector(selectClients);
  const cars = useSelector(selectCars);
  const matricules = useSelector(selectMatricules);
  const currentUser = useSelector(selectUser);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingReservationId, setPendingReservationId] = useState(null);
  const [availableMatricules, setAvailableMatricules] = useState([]);
  const [selectedMatriculeId, setSelectedMatriculeId] = useState('');

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReservationId, setCancelReservationId] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState(null);

  const [showContract, setShowContract] = useState(false);
  const [selectedContractReservation, setSelectedContractReservation] = useState(null);
  const [contractPaperwork, setContractPaperwork] = useState(DEFAULT_PAPERWORK);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [printTargetReservation, setPrintTargetReservation] = useState(null);
  const [includeCacheForPrint, setIncludeCacheForPrint] = useState(true);

  const [displayOptions, setDisplayOptions] = useState(DEFAULT_DISPLAY_OPTIONS);
  const [expandedRowId, setExpandedRowId] = useState(null);

  useEffect(() => {
    dispatch(fetchReservations()); dispatch(fetchClients()); dispatch(fetchCars());
    dispatch(fetchMatricules()); dispatch(checkLateReservations());
  }, [dispatch]);

  const isToday = (d) => { if (!d) return false; const dt = new Date(d), t = new Date(); return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime() === new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime(); };
  const isThisWeek = (d) => { if (!d) return false; const date = new Date(d), today = new Date(); const sw = new Date(today); sw.setDate(today.getDate() - today.getDay()); sw.setHours(0,0,0,0); const ew = new Date(sw); ew.setDate(sw.getDate() + 6); ew.setHours(23,59,59,999); return date >= sw && date <= ew; };
  const isThisMonth = (d) => { if (!d) return false; const date = new Date(d), today = new Date(); return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear(); };
  const calculateRentalDays = (s, e) => { if (!s || !e) return 0; const sd = new Date(s), ed = new Date(e); sd.setHours(0,0,0,0); ed.setHours(0,0,0,0); const diff = Math.abs(ed - sd); const days = Math.ceil(diff / (1000 * 60 * 60 * 24)); return days === 0 ? 1 : days; };

  const showSuccessMessage = (message) => {
    document.querySelectorAll('.success-notification, .error-notification').forEach(n => n.remove());
    const n = document.createElement('div'); n.className = 'success-notification';
    n.innerHTML = `<div class="notification-content"><FaCheck class="notification-icon" /><span>${message}</span></div>`;
    document.body.appendChild(n); setTimeout(() => n.parentNode && n.remove(), 5000);
  };
  const showErrorMessage = (message) => {
    document.querySelectorAll('.success-notification, .error-notification').forEach(n => n.remove());
    const n = document.createElement('div'); n.className = 'error-notification';
    n.innerHTML = `<div class="notification-content"><FaTimes class="notification-icon" /><span>${message}</span><button onclick="this.parentNode.parentNode.remove()" style="background:none;border:none;color:inherit;cursor:pointer;margin-left:10px;"><FaTimes /></button></div>`;
    document.body.appendChild(n); setTimeout(() => n.parentNode && n.remove(), 8000);
  };

  const enrichReservationWithSignatures = async (reservation) => {
    let fresh = reservation;
    try {
      const result = await dispatch(fetchReservations()).unwrap();
      const list = Array.isArray(result) ? result : Array.isArray(result?.reservations) ? result.reservations : Array.isArray(result?.data) ? result.data : null;
      if (list) { const found = list.find(r => r.id === reservation.id); if (found) fresh = found; }
    } catch (_) {}
    return fresh;
  };

  /* ============================================================
     ✅ generateContractPDF — TRUE A4 PDF, smart-fit + 5px top/bottom margin
     - Renders at 794px (A4 width @ 96dpi), captured at 3x for high DPI
     - Adds 5px (≈1.32 mm) margin at the top and bottom of each page
     - If content ≤ available height → fits directly
     - If content is slightly taller → shrinks to fit on ONE page
     - If content is much taller → paginates cleanly
     ============================================================ */
  const generateContractPDF = async (reservation) => {
    try {
      const A4_WIDTH_PX = 794; // 210mm @ 96dpi

      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
      const pageWidth  = doc.internal.pageSize.getWidth();   // 210 mm
      const pageHeight = doc.internal.pageSize.getHeight();  // 297 mm

      // ✅ 5px top/bottom padding converted to mm (5px / 96dpi * 25.4 ≈ 1.3229mm)
      const PADDING_PX = 5;
      const PADDING_MM = (PADDING_PX / 96) * 25.4; // ≈ 1.3229 mm
      const contentTop    = PADDING_MM;
      const contentHeight = pageHeight - PADDING_MM * 2; // available height per page

      const contractElement =
        document.querySelector('#contract-pdf-root .contract-container-print') ||
        document.querySelector('.contract-modal-content .contract-container-print');
      if (!contractElement) { showErrorMessage('Contract element not found'); return; }

      if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (_) {} }

      const images = contractElement.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img =>
        img.complete && img.naturalWidth > 0 ? Promise.resolve() :
        new Promise(res => { const done = () => res(); img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); setTimeout(done, 4000); })
      ));

      const contractClone = contractElement.cloneNode(true);
      contractClone.style.margin = '0';
      contractClone.style.boxShadow = 'none';
      contractClone.style.width = `${A4_WIDTH_PX}px`;
      contractClone.style.maxWidth = 'none';

      const tempContainer = document.createElement('div');
      Object.assign(tempContainer.style, {
        position: 'fixed',
        left: '-10000px',
        top: '0',
        width: `${A4_WIDTH_PX}px`,
        background: '#ffffff',
        zIndex: '-1',
        pointerEvents: 'none',
        opacity: '0',
      });
      tempContainer.appendChild(contractClone);
      document.body.appendChild(tempContainer);

      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      const html2canvas = (await import('html2canvas')).default;
      const width  = contractClone.scrollWidth;
      const height = contractClone.scrollHeight;

      const canvas = await html2canvas(contractClone, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width,
        height,
        windowWidth: width,
        windowHeight: height,
        scrollX: 0,
        scrollY: 0,
      });

      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // ── Fit to full content width (page width, no left/right padding) ─
      let imgWidth  = pageWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= contentHeight) {
        // ── Case 1: fits on ONE page as-is → place with top padding ────
        const x = (pageWidth - imgWidth) / 2; // center horizontally
        doc.addImage(imgData, 'JPEG', x, contentTop, imgWidth, imgHeight);
      } else {
        // Content is taller than 1 page → try shrinking to fit on ONE page
        const scaleToFit = contentHeight / imgHeight;

        if (scaleToFit >= 0.7) {
          // ── Case 2: slightly too tall → shrink to fit on ONE page ────
          imgWidth  = imgWidth * scaleToFit;
          imgHeight = contentHeight;
          const x = (pageWidth - imgWidth) / 2; // center horizontally
          doc.addImage(imgData, 'JPEG', x, contentTop, imgWidth, imgHeight);
        } else {
          // ── Case 3: really long → paginate cleanly with 5px top/bottom ─
          let heightLeft = imgHeight;
          let position = contentTop;

          doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= contentHeight;

          while (heightLeft > 0) {
            position = contentTop + (heightLeft - imgHeight);
            doc.addPage();
            doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= contentHeight;
          }
        }
      }

      const pdfBlob = doc.output('blob'); const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank'); doc.save(`contrat-location-${reservation.id}.pdf`);
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      showSuccessMessage('Contrat généré et ouvert !');
    } catch (error) { console.error('Error generating contract:', error); showErrorMessage('Erreur lors de la génération du contrat.'); }
  };

  const handleViewContract = async (reservation) => {
    const enriched = await enrichReservationWithSignatures(reservation);
    setSelectedContractReservation(enriched);
    if (enriched.paperwork) {
      setContractPaperwork({ circulation: enriched.paperwork.circulation || false, carteGrise: enriched.paperwork.carteGrise || false, assurance: enriched.paperwork.assurance || false, vignette: enriched.paperwork.vignette || false, visiteTechnique: enriched.paperwork.visiteTechnique || false, autorisation: enriched.paperwork.autorisation || false });
    }
    setShowContract(true);
  };

  const handlePrintContract = async (reservation) => {
    try { const enriched = await enrichReservationWithSignatures(reservation); setPrintTargetReservation(enriched); setShowPrintOptions(true); }
    catch { setPrintTargetReservation(reservation); setShowPrintOptions(true); }
  };

  const executePrintContract = async (withCache) => {
    setIncludeCacheForPrint(withCache); setShowPrintOptions(false);
    if (!printTargetReservation) return;
    setSelectedContractReservation(printTargetReservation);
    if (printTargetReservation.paperwork) {
      setContractPaperwork({ circulation: printTargetReservation.paperwork.circulation || false, carteGrise: printTargetReservation.paperwork.carteGrise || false, assurance: printTargetReservation.paperwork.assurance || false, vignette: printTargetReservation.paperwork.vignette || false, visiteTechnique: printTargetReservation.paperwork.visiteTechnique || false, autorisation: printTargetReservation.paperwork.autorisation || false });
    }
    await new Promise(r => setTimeout(r, 900));
    generateContractPDF(printTargetReservation);
  };

  const handlePrintFromModal = () => { if (!selectedContractReservation) return; setPrintTargetReservation(selectedContractReservation); setShowPrintOptions(true); };
  const handleDisplayOptionChange = (section, value) => setDisplayOptions(prev => ({ ...prev, [section]: value }));
  const handleResetDisplayOptions = () => setDisplayOptions(DEFAULT_DISPLAY_OPTIONS);
  const handlePaperworkChange = (field) => setContractPaperwork(prev => ({ ...prev, [field]: !prev[field] }));

  const filteredReservations = reservations.filter(r => {
    if (!STATUS_SCOPE.includes(r.status)) return false;
    const matchesSearch = searchTerm === '' ||
      r.client?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.client?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.second_driver_client?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.car?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.car?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.matricule?.matricule_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const s = r.start_date, e = r.end_date;
      switch (dateFilter) {
        case 'today': matchesDate = isToday(s) || isToday(e); break;
        case 'this_week': matchesDate = isThisWeek(s) || isThisWeek(e); break;
        case 'this_month': matchesDate = isThisMonth(s) || isThisMonth(e); break;
        default: matchesDate = true;
      }
    }
    let matchesNotification = true;
    if (filterParam === 'notifications') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const end = r.end_date ? new Date(r.end_date) : null;
      if (end) end.setHours(0, 0, 0, 0);
      const diffDays = end ? Math.ceil((end - today) / (1000 * 60 * 60 * 24)) : null;
      const start = r.start_date ? new Date(r.start_date) : null;
      if (start) start.setHours(0, 0, 0, 0);
      const diffStart = start ? Math.ceil((start - today) / (1000 * 60 * 60 * 24)) : null;
      matchesNotification = (diffStart !== null && diffStart >= 0 && diffStart <= 7) || (diffDays !== null && diffDays >= 0 && diffDays <= 7);
    }
    return matchesSearch && matchesStatus && matchesDate && matchesNotification;
  }).sort((a, b) => (b.id || 0) - (a.id || 0));

  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const currentReservations = filteredReservations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (p) => setCurrentPage(p);
  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };
  const handleStatusFilter = (e) => { setStatusFilter(e.target.value); setCurrentPage(1); };
  const handleDateFilter = (e) => { setDateFilter(e.target.value); setCurrentPage(1); };
  const clearFilters = () => { setSearchTerm(''); setStatusFilter('all'); setDateFilter('all'); setCurrentPage(1); };

  const openConfirmModal = (reservation) => {
    const carId = reservation.car_id;
    const reservedMatriculeIds = reservations.filter(r => r.id !== reservation.id && (r.status === 'confirmed' || r.status === 'retard')).map(r => r.matricule_id).filter(Boolean);
    const available = matricules.filter(m => m.car_id === carId && m.status !== 'sold' && !reservedMatriculeIds.includes(m.id));
    setAvailableMatricules(available); setPendingReservationId(reservation.id);
    setSelectedMatriculeId(reservation.matricule_id || (available[0]?.id ?? '')); setShowConfirmModal(true);
  };

  const confirmConfirm = async () => {
    if (!selectedMatriculeId) { showErrorMessage('Veuillez sélectionner un matricule.'); return; }
    try {
      const result = await dispatch(updateReservation({ id: pendingReservationId, data: { status: 'confirmed', matricule_id: selectedMatriculeId, start_time: new Date().toTimeString().slice(0, 5) } })).unwrap();
      const updated = result?.reservation || result?.data?.reservation || result;
      try { if (updated?.id) await syncReportForReservation(updated, dispatch); } catch (e) { console.error(e); }
      showSuccessMessage('Réservation confirmée avec succès !');
      await dispatch(fetchReservations()); await dispatch(refreshMatricules());
    } catch (error) { showErrorMessage(error.message || 'Erreur lors de la confirmation'); }
    setShowConfirmModal(false); setPendingReservationId(null); setSelectedMatriculeId('');
  };

  const openCancelModal = (reservation) => { setCancelReservationId(reservation.id); setShowCancelModal(true); };

  const confirmCancel = async () => {
    try {
      const result = await dispatch(updateReservation({ id: cancelReservationId, data: { status: 'cancelled' } })).unwrap();
      const updated = result?.reservation || result?.data?.reservation || result;
      try { if (updated?.id) await syncReportForReservation(updated, dispatch); } catch (e) { console.error(e); }
      showSuccessMessage('Réservation annulée.'); await dispatch(fetchReservations());
    } catch (error) { showErrorMessage(error.message || "Erreur lors de l'annulation"); }
    setShowCancelModal(false); setCancelReservationId(null);
  };

  const openDeleteModal = (reservation) => { setReservationToDelete(reservation); setShowDeleteModal(true); };
  const confirmDelete = async () => {
    if (!reservationToDelete) return;
    try {
      await dispatch(deleteReservation(reservationToDelete.id)).unwrap();
      showSuccessMessage('Réservation supprimée.'); await dispatch(fetchReservations());
    } catch (error) { showErrorMessage(error.message || 'Erreur lors de la suppression'); }
    setShowDeleteModal(false); setReservationToDelete(null);
  };

  const handleEdit = (reservation) => {
    setModalType('edit'); setEditingItem(reservation);
    let displayNotes = reservation.notes || '';
    try { if (displayNotes && displayNotes.trim().startsWith('{')) { const n = JSON.parse(displayNotes); if (n.original_text !== undefined) displayNotes = n.original_text || ''; } } catch {}

    // ✅ Dates are the source of truth: use calculateRentalDays(start, end)
    //    to avoid showing a stale `rental_days` from the DB.
    const totalDaysFromDates = calculateRentalDays(reservation.start_date, reservation.end_date);
    const prolongation = reservation.prolongation_days || 0;
    const baseDays = reservation.can_extend_days
      ? Math.max(totalDaysFromDates - prolongation, 1)
      : totalDaysFromDates;

    setFormData({
      ...reservation,
      start_date: reservation.start_date?.split('T')[0] || '',
      end_date: reservation.end_date?.split('T')[0] || '',
      rental_days: baseDays,
      nom: reservation.client?.nom || '',
      prenom: reservation.client?.prenom || '',
      telephone: reservation.client?.telephone || '',
      email: reservation.client?.email || '',
      city: reservation.client?.city || '',
      cin_number: reservation.client?.cin_number || '',
      driver_license_number: reservation.client?.driver_license_number || '',
      has_second_driver: reservation.has_second_driver || false,
      second_driver_client_id: reservation.second_driver_client_id || '',
      notes: displayNotes,
      can_extend_days: reservation.can_extend_days || false,
      prolongation_days: reservation.prolongation_days || 0,
      sous_location_id: reservation.sous_location_id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const baseDays = parseInt(formData.rental_days, 10) || calculateRentalDays(formData.start_date, formData.end_date) || 1;
      const prolongationDays = formData.can_extend_days ? (parseInt(formData.prolongation_days, 10) || 0) : 0;
      const totalRentalDays = baseDays + prolongationDays;
      const payload = { ...formData, rental_days: totalRentalDays, total_days: totalRentalDays, can_extend_days: !!formData.can_extend_days, prolongation_days: prolongationDays };
      const result = await dispatch(updateReservation({ id: editingItem.id, data: payload })).unwrap();

      const updated = result?.reservation || result?.data?.reservation || result;
      try {
        if (updated?.id) await syncReportForReservation(updated, dispatch);
      } catch (syncErr) {
        console.error('syncReportForReservation failed:', syncErr);
      }

      showSuccessMessage('Réservation mise à jour.');
      setShowModal(false); setEditingItem(null);
      await dispatch(fetchReservations()); await dispatch(refreshMatricules());
    } catch (error) { showErrorMessage(error.message || 'Erreur lors de la mise à jour'); }
    finally { setSubmitting(false); }
  };

  const handleWhatsApp = (reservation) => {
    const client = clients.find(c => c.id === reservation.client_id);
    if (!client || !client.telephone) { showErrorMessage('Numéro de téléphone du client introuvable.'); return; }
    let phone = client.telephone.replace(/[\s\-\(\)\.]/g, '');
    if (phone.startsWith('0') && phone.length === 10) phone = '212' + phone.substring(1);
    else if (phone.startsWith('+')) phone = phone.substring(1);
    const total = reservation.total_price || 0; const paid = reservation.amount_paid || 0;
    const remaining = reservation.remaining_amount ?? (total - paid);
    const name = client.prenom ? `${client.prenom} ${client.nom}` : client.nom || 'Client';
    let message;
    switch (reservation.status) {
      case 'contacted': message = `السلام عليكم ${name}، حاولنا نتواصلو معاك بخصوص الحجز ديالك (رقم ${reservation.id}). المجموع: ${total} DH، الباقي: ${remaining} DH. شكراً.`; break;
      case 'cancelled': message = `السلام عليكم ${name}، تم إلغاء الحجز ديالك (رقم ${reservation.id}). إذا عندك أي سؤال، اتصل بنا. شكراً.`; break;
      default: message = `السلام عليكم ${name}، وصلاتنا طلب ديال الكرية (رقم ${reservation.id}). المجموع: ${total} DH، دفعتي: ${paid} DH، الباقي: ${remaining} DH. يرجى تأكيد الحجز. شكراً.`;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleExport = () => {
    if (!filteredReservations.length) { showErrorMessage('No data to export!'); return; }
    const headers = ['ID', 'Client', 'Véhicule', 'Période', 'Total', 'Statut'];
    const csv = [headers.join(','), ...filteredReservations.map(r => [r.id, `"${r.client?.prenom} ${r.client?.nom}"`, `"${r.car?.brand} ${r.car?.model}"`, `${new Date(r.start_date).toLocaleDateString()} - ${new Date(r.end_date).toLocaleDateString()}`, r.total_price, r.status].join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); const url = URL.createObjectURL(blob);
    link.setAttribute('href', url); link.setAttribute('download', `statut_reservations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    showSuccessMessage('CSV exported!');
  };

  const refreshData = () => {
    dispatch(fetchReservations()); dispatch(fetchClients()); dispatch(fetchCars());
    dispatch(fetchMatricules()); dispatch(checkLateReservations());
    showSuccessMessage('Données actualisées.');
  };

  const getStatusBadge = (status) => {
    const c = STATUS_CONFIG[status] || STATUS_CONFIG.pending; const IconC = c.icon;
    return <span className={`status-badge ${c.class}`}><IconC className="status-icon" />{c.text}</span>;
  };

  const toggleDetailsRow = (id) => setExpandedRowId(prev => (prev === id ? null : id));

  return (
    <div className="reservation-status-management">
      {selectedContractReservation && (
        <div id="contract-pdf-root" aria-hidden="true" style={{ position: 'fixed', left: '-10000px', top: 0, width: '794px', background: '#ffffff', zIndex: -1, pointerEvents: 'none' }}>
          <ContractLocation reservation={{ ...selectedContractReservation, paperwork: contractPaperwork }} showSignatures={true} currentUser={currentUser} displayOptions={displayOptions} includeCache={includeCacheForPrint} containerId="contract-print-hidden" />
        </div>
      )}

      {showContract && createPortal(
        <div className="full-overlay full-overlay--sidebar-aware" role="dialog" aria-modal="true">
          <div className="full-modal">
            <div className="contract-modal-header">
              <h2>Contrat de Location - Réservation #{selectedContractReservation?.id}</h2>
              <div className="contract-modal-actions">
                <button className="btn btn-primary" onClick={handlePrintFromModal}><FaPrint className="btn-icon" /> Imprimer Contrat</button>
                <button className="btn btn-secondary" onClick={() => setShowContract(false)}><FaTimes className="btn-icon" /> Fermer</button>
              </div>
            </div>
            <div className="contract-modal-content">
              <ContractDisplayOptions options={displayOptions} onOptionChange={handleDisplayOptionChange} onResetAll={handleResetDisplayOptions} />
              <div className="paperwork-checkboxes">
                <h3>Documents Remis</h3>
                <div className="checkbox-group">
                  <label className="checkbox-label"><input type="checkbox" checked={contractPaperwork.carteGrise} onChange={() => handlePaperworkChange('carteGrise')} /> Carte grise</label>
                  <label className="checkbox-label"><input type="checkbox" checked={contractPaperwork.assurance} onChange={() => handlePaperworkChange('assurance')} /> Assurance</label>
                  <label className="checkbox-label"><input type="checkbox" checked={contractPaperwork.vignette} onChange={() => handlePaperworkChange('vignette')} /> Vignette</label>
                  <label className="checkbox-label"><input type="checkbox" checked={contractPaperwork.visiteTechnique} onChange={() => handlePaperworkChange('visiteTechnique')} /> Visite technique</label>
                  <label className="checkbox-label"><input type="checkbox" checked={contractPaperwork.autorisation} onChange={() => handlePaperworkChange('autorisation')} /> Autorisation</label>
                </div>
              </div>
              <ContractLocation reservation={{ ...selectedContractReservation, paperwork: contractPaperwork }} showSignatures={true} currentUser={currentUser} displayOptions={displayOptions} includeCache={includeCacheForPrint} containerId="contract-modal-view" />
            </div>
          </div>
        </div>, document.body
      )}

      {showPrintOptions && createPortal(
        <div className="full-overlay full-overlay-center full-overlay-top" role="dialog" aria-modal="true">
          <div className="confirmation-modal" style={{ maxWidth: '540px' }}>
            <div className="confirmation-header" style={{ paddingBottom: '0.5rem' }}>
              <h3 className="confirmation-title">Options d'impression</h3>
              <p style={{ color: '#6c757d', marginTop: '0.5rem', fontSize: '0.9rem' }}>Réservation #{printTargetReservation?.id} — voulez-vous appliquer le cachet de l'entreprise ?</p>
            </div>
            <div className="confirmation-body">
              <div className="print-options-preview">
                <div className={`print-option-card ${includeCacheForPrint ? 'active' : ''}`} onClick={() => setIncludeCacheForPrint(true)}>
                  <div className="print-option-img-wrap with-stamp"><img src={cacherImage} alt="Avec cachet" /></div>
                  <div className="print-option-title">Avec cachet</div>
                  <div className="print-option-sub">Le cachet est apposé sur la signature de l'agent</div>
                </div>
                <div className={`print-option-card ${!includeCacheForPrint ? 'active' : ''}`} onClick={() => setIncludeCacheForPrint(false)}>
                  <div className="print-option-img-wrap"><span className="no-stamp-icon">∅</span></div>
                  <div className="print-option-title">Sans cachet</div>
                  <div className="print-option-sub">Contrat sans cachet</div>
                </div>
              </div>
            </div>
            <div className="confirmation-actions">
              <button className="btn-confirm-cancel" onClick={() => setShowPrintOptions(false)}>Annuler</button>
              <button className="btn-confirm-delete" style={{ background: '#8b5cf6', boxShadow: '0 4px 15px rgba(139,92,246,0.3)' }} onClick={() => executePrintContract(includeCacheForPrint)}>
                <FaPrint /> Imprimer
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      <div className="section-header">
        <div className="header-content">
          <h1 className="section-title">
            <FaClock className="title-icon" />
            Statut des Réservations
            {statusFilter !== 'all' && (<span className="filter-indicator">- Filtre: {STATUS_CONFIG[statusFilter]?.text || statusFilter}</span>)}
          </h1>
          <p className="section-subtitle">Réservations en attente, contactées ou annulées — réserver, contacter ou annuler</p>
        </div>
        <div className="section-actions">
          <button className="btn btn-secondary" onClick={refreshData} disabled={submitting}><FaRedo className="btn-icon" /> Actualiser</button>
          <button className="btn btn-secondary" onClick={handleExport} disabled={submitting}><FaFileExport className="btn-icon" /> Exporter CSV</button>
        </div>
      </div>

      <div className="search-filter-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Rechercher par client, véhicule, immatriculation ou ID..." value={searchTerm} onChange={handleSearch} className="search-input" />
        </div>
        <div className="filter-group">
          <div className="filter-item">
            <label htmlFor="status-filter"><FaFilter className="filter-icon" />Statut</label>
            <select id="status-filter" value={statusFilter} onChange={handleStatusFilter} className="filter-select">
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="contacted">Contacté</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
          <div className="filter-item">
            <label htmlFor="date-filter"><FaCalendarAlt className="filter-icon" />Date</label>
            <select id="date-filter" value={dateFilter} onChange={handleDateFilter} className="filter-select">
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="this_week">Cette semaine</option>
              <option value="this_month">Ce mois</option>
            </select>
          </div>
          {(searchTerm !== '' || statusFilter !== 'all' || dateFilter !== 'all') && (
            <button className="btn btn-clear" onClick={clearFilters}>Effacer les filtres</button>
          )}
        </div>
      </div>

      {filterParam === 'notifications' && (
        <div className="filter-indicator">
          <span className="filter-indicator-text"><FaExclamationTriangle size={16} /> Affichage des réservations urgentes (≤ 7 jours)</span>
          <button onClick={() => setSearchParams({})} className="clear-filter-btn"><FaTimes size={16} /> Effacer le filtre</button>
        </div>
      )}

      <div className="results-summary">
        <span className="results-count">Affichage de {currentReservations.length} sur {filteredReservations.length} réservation(s)</span>
        <span className="page-info">Page {currentPage} sur {totalPages || 1}</span>
      </div>

      <div className="content-container">
        {loading ? (
          <div className="loading-state"><FaSpinner className="spinning" size={48} /><p>Chargement...</p></div>
        ) : currentReservations.length > 0 ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Locataire</th><th>2ème Conducteur</th><th>Véhicule</th><th>Période</th>
                    <th>Jours</th><th>Prix</th><th>Statut</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReservations.map(reservation => {
                    const totalDays = calculateRentalDays(reservation.start_date, reservation.end_date);
                    const isExpanded = expandedRowId === reservation.id;
                    const rowPaymentHistory = Array.isArray(reservation.payment_history) ? reservation.payment_history : [];
                    return (
                      <Fragment key={reservation.id}>
                        <tr id={`reservation-${reservation.id}`}>
                          <td className="client-name">
                            <div className="client-info-cell">
                              <div className="client-name-main">{reservation.client?.prenom} {reservation.client?.nom}</div>
                              <div className="client-phone"><FaPhone className="icon-small" /> {reservation.client?.telephone}</div>
                            </div>
                          </td>
                          <td>
                            {reservation.has_second_driver ? (
                              <div className="client-info-cell">
                                <div className="client-name-main"><FaUserFriends className="icon-small" />{reservation.second_driver_client?.prenom} {reservation.second_driver_client?.nom}</div>
                              </div>
                            ) : (<span className="no-second-driver"><FaUserPlus className="icon-small" /> Aucun</span>)}
                          </td>
                          <td>
                            <div className="car-info-container">
                              <div className="car-brand-model">{reservation.car?.brand} {reservation.car?.model}</div>
                              {reservation.matricule?.matricule_code && (<div className="car-matricule-text"><FaCar className="icon-small" /> {reservation.matricule.matricule_code}</div>)}
                            </div>
                          </td>
                          <td className="reservation-period">{new Date(reservation.start_date).toLocaleDateString('fr-FR')} - {new Date(reservation.end_date).toLocaleDateString('fr-FR')}</td>
                          <td className="rental-days">{totalDays} j</td>
                          <td className="price-cell">{reservation.total_price} DH</td>
                          <td>{getStatusBadge(reservation.status)}</td>
                          <td>
                            <div className="action-buttons-circular">
                              {['pending', 'contacted'].includes(reservation.status) && (
                                <button className="icon-action-btn" onClick={() => openConfirmModal(reservation)} title="Réserver (confirmer avec matricule)" disabled={submitting} style={{ color: '#10b981' }}><FaCheckCircle size={16} /></button>
                              )}
                              {['pending', 'contacted'].includes(reservation.status) && (
                                <button className="icon-action-btn" onClick={() => openCancelModal(reservation)} title="Annuler la réservation" disabled={submitting} style={{ color: '#dc3545' }}><FaBan size={16} /></button>
                              )}
                              <button className="icon-action-btn" onClick={() => toggleDetailsRow(reservation.id)} title={isExpanded ? "Masquer les détails" : "Voir les détails"} disabled={submitting} style={{ color: '#06b6d4' }}>
                                {isExpanded ? <FaChevronUp size={16} /> : <FaEye size={16} />}
                              </button>
                              <button className="icon-action-btn" onClick={() => handleViewContract(reservation)} title="Voir le contrat" disabled={submitting} style={{ color: '#06b6d4' }}><FaFileSignature size={16} /></button>
                              <button className="icon-action-btn" onClick={() => handlePrintContract(reservation)} title="Imprimer le contrat" disabled={submitting} style={{ color: '#8b5cf6' }}><FaPrint size={16} /></button>
                              <button className="icon-action-btn" onClick={() => handleWhatsApp(reservation)} title="Envoyer un message WhatsApp" disabled={submitting} style={{ color: '#25d366' }}><FaPhone size={16} /></button>
                              <button className="icon-action-btn" onClick={() => handleEdit(reservation)} title="Modifier" disabled={submitting} style={{ color: '#eab308' }}><FaEdit size={16} /></button>
                              <button className="icon-action-btn" onClick={() => openDeleteModal(reservation)} title="Supprimer" disabled={submitting} style={{ color: '#ef4444' }}><FaTrash size={16} /></button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan="9" style={{ padding: 0, background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '1px solid #e2e8f0' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '18px 24px 22px', alignItems: 'stretch' }}>
                                <div style={{ minWidth: '230px', flex: '1 1 230px', background: '#ffffff', borderRadius: '12px', borderLeft: '4px solid #06b6d4', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)', padding: '14px 16px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.75rem', color: '#0891b2', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}><FaMoneyBill size={14} /> Paiement</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span style={{ color: '#64748b' }}>Total</span><span style={{ fontWeight: 700, color: '#0f172a' }}>{reservation.total_price || 0} DH</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span style={{ color: '#64748b' }}>Payé</span><span style={{ fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '1px 8px', borderRadius: '10px' }}>{reservation.amount_paid || 0} DH</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span style={{ color: '#64748b' }}>Restant</span><span style={{ fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '1px 8px', borderRadius: '10px' }}>{reservation.remaining_amount ?? ((reservation.total_price || 0) - (reservation.amount_paid || 0))} DH</span></div>
                                  </div>
                                </div>
                                {rowPaymentHistory.length > 0 && (
                                  <div style={{ minWidth: '260px', flex: '1 1 260px', background: '#ffffff', borderRadius: '12px', borderLeft: '4px solid #8b5cf6', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)', padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.75rem', color: '#7c3aed', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}><FaReceipt size={14} /> Historique des paiements ({rowPaymentHistory.length})</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      {rowPaymentHistory.map((p, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', fontSize: '0.8rem', color: '#334155', padding: '4px 0', borderBottom: idx < rowPaymentHistory.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{new Date(p.date).toLocaleDateString('fr-FR')}</span>
                                          <span style={{ fontWeight: 600, color: '#16a34a' }}>{p.amount} DH</span>
                                          <span style={{ fontSize: '0.7rem', color: '#7c3aed', background: '#f5f3ff', padding: '1px 8px', borderRadius: '10px', textTransform: 'capitalize' }}>{p.method}</span>
                                          {p.notes && <span style={{ color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic' }}>{p.notes}</span>}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div style={{ minWidth: '230px', flex: '1 1 230px', background: '#ffffff', borderRadius: '12px', borderLeft: (reservation.can_extend_days && reservation.prolongation_days > 0) ? '4px solid #f59e0b' : '4px solid #cbd5e1', boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)', padding: '14px 16px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.75rem', color: '#b45309', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}><FaClock size={14} /> Prolongation</div>
                                  {reservation.can_extend_days && reservation.prolongation_days > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span style={{ color: '#64748b' }}>Jours ajoutés</span><span style={{ fontWeight: 700, color: '#b45309', background: '#fffbeb', padding: '1px 8px', borderRadius: '10px' }}>+{reservation.prolongation_days} jours</span></div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span style={{ color: '#64748b' }}>Ajoutée le</span><span style={{ fontWeight: 600, color: '#0f172a' }}>{reservation.updated_at ? new Date(reservation.updated_at).toLocaleDateString('fr-FR') : '—'}</span></div>
                                    </div>
                                  ) : (<span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Aucune prolongation</span>)}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="pagination-container">
              <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={filteredReservations.length} />
            </div>
          </>
        ) : (
          <div className="no-data">
            <FaDatabase size={48} />
            <p>{reservations.length === 0 ? 'Aucune réservation' : 'Aucune réservation ne correspond à vos critères'}</p>
            {(searchTerm !== '' || statusFilter !== 'all' || dateFilter !== 'all') && (
              <button className="btn btn-secondary" onClick={clearFilters} style={{ marginTop: '1rem' }}>Effacer les filtres</button>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <AdminModal type="reservations" modalType={modalType} formData={formData} setFormData={setFormData}
          onClose={() => !submitting && setShowModal(false)} onSubmit={handleSubmit}
          clients={clients} cars={cars} matricules={matricules} submitting={submitting} currentUser={currentUser} />
      )}

      {showConfirmModal && createPortal(
        <div className="full-overlay full-overlay-center" role="dialog" aria-modal="true">
          <div className="confirmation-modal" style={{ maxWidth: '500px' }}>
            <div className="confirmation-header" style={{ paddingBottom: '0.5rem' }}>
              <div className="confirmation-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '2px solid rgba(16,185,129,0.2)' }}><FaCheckCircle /></div>
              <h3 className="confirmation-title">Réserver la réservation</h3>
            </div>
            <div className="confirmation-body">
              <p style={{ marginBottom: '1rem', textAlign: 'center', color: '#6c757d' }}>Sélectionnez le matricule à attribuer :</p>
              {availableMatricules.length === 0 ? (<p style={{ color: '#dc3545', textAlign: 'center' }}>Aucun matricule disponible pour ce véhicule.</p>) : (
                <div className="form-group">
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Matricule</label>
                  <select value={selectedMatriculeId} onChange={(e) => setSelectedMatriculeId(e.target.value)} className="filter-select" style={{ width: '100%', padding: '0.75rem' }}>
                    <option value="">Sélectionner un matricule</option>
                    {availableMatricules.map(m => (<option key={m.id} value={m.id}>{m.matricule_code} — {m.kilometrage} km</option>))}
                  </select>
                </div>
              )}
            </div>
            <div className="confirmation-actions">
              <button className="btn-confirm-cancel" onClick={() => setShowConfirmModal(false)}>Annuler</button>
              <button className="btn-confirm-delete" style={{ background: '#10b981', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }} onClick={confirmConfirm} disabled={availableMatricules.length === 0 || !selectedMatriculeId}>Réserver</button>
            </div>
          </div>
        </div>, document.body
      )}

      {showCancelModal && createPortal(
        <div className="full-overlay full-overlay-center" role="dialog" aria-modal="true">
          <div className="confirmation-modal">
            <div className="confirmation-header">
              <div className="confirmation-icon" style={{ background: 'rgba(220,53,69,0.1)', color: '#dc3545', border: '2px solid rgba(220,53,69,0.2)' }}><FaBan /></div>
              <h3 className="confirmation-title">Annuler la réservation</h3>
            </div>
            <div className="confirmation-body">
              <p className="confirmation-message">Êtes-vous sûr de vouloir annuler la réservation ?</p>
            </div>
            <div className="confirmation-actions">
              <button className="btn-confirm-cancel" onClick={() => setShowCancelModal(false)}>Retour</button>
              <button className="btn-confirm-delete" onClick={confirmCancel}>Confirmer l'annulation</button>
            </div>
          </div>
        </div>, document.body
      )}

      {showDeleteModal && reservationToDelete && createPortal(
        <div className="full-overlay full-overlay-center" role="dialog" aria-modal="true">
          <div className="confirmation-modal">
            <div className="confirmation-header">
              <div className="confirmation-icon delete"><FaExclamationTriangle /></div>
              <h3 className="confirmation-title">Supprimer la réservation</h3>
            </div>
            <div className="confirmation-body">
              <p className="confirmation-message">Êtes-vous sûr de vouloir supprimer la réservation <strong>#{reservationToDelete.id}</strong> ? Cette action est irréversible.</p>
            </div>
            <div className="confirmation-actions">
              <button className="btn-confirm-cancel" onClick={() => setShowDeleteModal(false)}>Annuler</button>
              <button className="btn-confirm-delete" onClick={confirmDelete}>Supprimer</button>
            </div>
          </div>
        </div>, document.body
      )}

      <style>{`
        .reservation-status-management { padding: 2rem; min-height: 100vh; font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; background: #f8fafc; color: #334155; }
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .full-overlay { position: fixed; top: 0; right: 0; bottom: 0; left: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); overflow-y: auto; overflow-x: hidden; z-index: 9999; padding: 1.5rem; }
        .full-overlay-center { display: flex; align-items: center; justify-content: center; }
        @media (min-width: 768px) { .full-overlay.full-overlay--sidebar-aware { left: 18rem; } }
        @media (max-width: 1024px) { .full-overlay.full-overlay--sidebar-aware { left: 0; } }
        .full-modal { background: #fff; border-radius: 32px; margin: 0 auto; max-width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; animation: amSlideIn 0.3s ease-out; }
        @keyframes amSlideIn { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .section-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 2rem; background: #fff; padding: 2rem; border-radius: 1.25rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; flex-wrap: wrap; }
        .header-content { flex: 1; }
        .section-title { display: flex; align-items: center; gap: 10px; font-size: 2rem; font-weight: 700; margin: 0 0 0.5rem 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; flex-wrap: wrap; }
        .filter-indicator { font-size: 1.2rem; color: #64748b; font-weight: 500; background: rgba(108, 117, 125, 0.1); padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(108, 117, 125, 0.2); }
        .title-icon { color: #667eea; }
        .section-subtitle { color: #64748b; font-size: 1rem; margin: 0; font-weight: 400; }
        .section-actions { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
        .btn { display: inline-flex; align-items: center; gap: 0.5rem; height: 2.5rem; padding: 0 1rem; border-radius: 9999px; border: none; cursor: pointer; font-size: 0.875rem; font-weight: 500; transition: all 0.2s; font-family: inherit; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(102,126,234,0.4); }
        .btn-secondary { background: #f1f5f9; color: #1e293b; }
        .btn-secondary:hover:not(:disabled) { background: #e2e8f0; transform: translateY(-1px); }
        .btn-clear { background: #ef4444; color: #fff; }
        .btn-clear:hover:not(:disabled) { background: #dc2626; }
        .btn-icon { font-size: 0.875rem; }
        .search-filter-section { background: #fff; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1rem; margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .search-box { position: relative; flex: 1; min-width: 240px; }
        .search-box .search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #64748b; }
        .search-box .search-input { width: 100%; padding: 0.5rem 1rem 0.5rem 2.5rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.875rem; font-family: inherit; transition: all 0.2s; }
        .search-box .search-input:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15); }
        .filter-group { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
        .filter-item { display: flex; flex-direction: column; gap: 0.5rem; }
        .filter-item label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .filter-icon { font-size: 0.875rem; }
        .filter-select { padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.875rem; background: #fff; cursor: pointer; font-family: inherit; min-width: 12rem; }
        .filter-select:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15); }
        .results-summary { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 0 0.25rem; font-size: 0.875rem; color: #64748b; flex-wrap: wrap; gap: 0.5rem; }
        .results-count { font-weight: 500; }
        .page-info { font-weight: 600; color: #334155; }
        .content-container { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); }
        .data-table { width: 100%; font-size: 0.875rem; border-collapse: collapse; min-width: 1100px; }
        .data-table th { text-align: left; padding: 0.75rem 1rem; background: #f8fafc; color: #64748b; font-weight: 500; white-space: nowrap; border-bottom: 1px solid #e2e8f0; }
        .data-table td { padding: 0.75rem 1rem; border-top: 1px solid #e2e8f0; color: #334155; vertical-align: middle; }
        .data-table tr:hover { background: #f8fafc; }
        .client-name { font-weight: 500; color: #0f172a; }
        .client-info-cell { display: flex; flex-direction: column; gap: 2px; }
        .client-name-main { font-weight: 500; }
        .client-phone { font-size: 0.75rem; color: #64748b; display: flex; align-items: center; gap: 4px; }
        .no-second-driver { font-size: 0.75rem; color: #94a3b8; display: flex; align-items: center; gap: 4px; }
        .car-info-container { display: flex; flex-direction: column; gap: 2px; }
        .car-brand-model { font-weight: 500; color: #0f172a; }
        .car-matricule-text { font-size: 0.75rem; color: #64748b; font-family: monospace; }
        .reservation-period { color: #64748b; font-size: 0.8rem; }
        .rental-days { text-align: center; font-weight: 500; color: #334155; }
        .price-cell { font-weight: 500; color: #16a34a; }
        .icon-small { font-size: 0.7rem; }
        .status-badge { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; white-space: nowrap; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-contacted { background: #e0e7ff; color: #3730a3; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        .status-icon { font-size: 0.7rem; }
        .action-buttons-circular { display: grid; grid-template-columns: repeat(4, 32px); gap: 0.5rem; justify-content: flex-end; justify-items: center; align-items: center; }
        .icon-action-btn { padding: 0.5rem; background: none; border: none; cursor: pointer; border-radius: 0.5rem; transition: all 0.2s; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; }
        .icon-action-btn:hover:not(:disabled) { background: rgba(15, 23, 42, 0.06); }
        .icon-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .no-data { text-align: center; padding: 4rem 2rem; color: #64748b; }
        .no-data svg { margin-bottom: 1.5rem; opacity: 0.3; color: #667eea; }
        .no-data p { font-size: 1.05rem; color: #495057; margin: 0 0 2rem 0; }
        .pagination-container { padding: 2rem; border-top: 1px solid #f1f3f4; display: flex; justify-content: center; }
        .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; color: #64748b; }
        .loading-state p { margin-top: 1rem; }
        .contract-modal-header { padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; flex-wrap: wrap; gap: 1rem; }
        .contract-modal-header h2 { margin: 0; color: #fff; font-size: 1.5rem; font-weight: 700; }
        .contract-modal-actions { display: flex; gap: 1rem; }
        .contract-modal-content { padding: 1.5rem 2rem; }
        .print-options-preview { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 0.5rem 0 1rem; }
        .print-option-card { border: 2px solid #e2e8f0; border-radius: 1rem; padding: 1.25rem 1rem; text-align: center; cursor: pointer; transition: all 0.2s ease; background: #fff; }
        .print-option-card:hover { border-color: #c7d2fe; transform: translateY(-2px); }
        .print-option-card.active { border-color: #8b5cf6; background: #f5f3ff; box-shadow: 0 6px 18px rgba(139, 92, 246, 0.18); }
        .print-option-img-wrap { height: 90px; display: flex; align-items: center; justify-content: center; margin-bottom: 0.75rem; border: 1px dashed #cbd5e1; border-radius: 0.75rem; background: #f8fafc; overflow: hidden; }
        .print-option-img-wrap.with-stamp { background: #fff; }
        .print-option-img-wrap img { max-width: 80%; max-height: 80%; object-fit: contain; opacity: 0.9; transform: rotate(-10deg); }
        .no-stamp-icon { font-size: 2rem; color: #94a3b8; font-weight: 700; }
        .print-option-title { font-weight: 700; color: #0f172a; font-size: 0.95rem; margin-bottom: 0.25rem; }
        .print-option-sub { font-size: 0.75rem; color: #64748b; }
        .confirmation-modal { background: white; border-radius: 1.25rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); max-width: 480px; width: 100%; overflow: hidden; animation: amSlideIn 0.3s ease-out; }
        .confirmation-header { padding: 2rem 2rem 1rem; text-align: center; border-bottom: 1px solid #f1f3f4; }
        .confirmation-icon { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 2rem; }
        .confirmation-icon.delete { background: rgba(220, 53, 69, 0.1); color: #dc3545; border: 2px solid rgba(220, 53, 69, 0.2); }
        .confirmation-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
        .confirmation-body { padding: 1.5rem 2rem; }
        .confirmation-message { color: #64748b; font-size: 1rem; line-height: 1.6; margin-bottom: 1rem; text-align: center; }
        .confirmation-actions { padding: 1.5rem 2rem 2rem; display: flex; gap: 1rem; justify-content: flex-end; flex-wrap: wrap; }
        .btn-confirm-cancel { padding: 0.75rem 1.5rem; border: 1px solid #6c757d; background: transparent; color: #6c757d; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; }
        .btn-confirm-cancel:hover:not(:disabled) { background: #6c757d; color: white; }
        .btn-confirm-delete { padding: 0.75rem 1.5rem; border: none; background: #dc3545; color: white; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3); display: flex; align-items: center; gap: 0.5rem; }
        .btn-confirm-delete:hover:not(:disabled) { background: #c82333; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4); }
        .btn-confirm-delete:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .display-options-panel { background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid #e2e8f0; }
        .display-options-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem; }
        .display-options-header h3 { font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; margin: 0; color: #0f172a; }
        .reset-all-btn { background: none; border: 1px solid #e2e8f0; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem; transition: all 0.2s; font-family: inherit; color: #334155; }
        .reset-all-btn:hover { background: #f1f5f9; }
        .display-options-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.75rem; }
        .display-option-item { background: #f8fafc; border-radius: 8px; padding: 0.5rem 0.75rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
        .display-option-label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; font-weight: 500; color: #1e293b; min-width: 0; }
        .display-option-label span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .display-option-buttons { display: flex; gap: 0.25rem; flex-shrink: 0; }
        .mode-btn { background: white; border: 1px solid #e2e8f0; border-radius: 4px; padding: 0.25rem 0.45rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; color: #64748b; font-family: inherit; }
        .mode-btn.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-color: transparent; color: #fff; box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3); }
        .mode-btn:hover:not(.active) { background: #f1f5f9; }
        .paperwork-checkboxes { background: #f8fafc; padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 1.5rem; border: 1px solid #e2e8f0; }
        .paperwork-checkboxes h3 { margin: 0 0 1rem 0; color: #0f172a; font-size: 1.2rem; }
        .checkbox-group { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #334155; cursor: pointer; }
        .checkbox-label input { width: 18px; height: 18px; cursor: pointer; }
        .success-notification, .error-notification { position: fixed; top: 2rem; right: 2rem; z-index: 10500; animation: slideInRight 0.3s ease-out; }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
        .success-notification .notification-content { background: #dcfce7; color: #166534; padding: 1rem 1.5rem; border-radius: 0.75rem; border: 1px solid #bbf7d0; display: flex; align-items: center; gap: 0.75rem; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3); }
        .error-notification .notification-content { background: #fee2e2; color: #991b1b; padding: 1rem 1.5rem; border-radius: 0.75rem; border: 1px solid #fecaca; display: flex; align-items: center; gap: 0.75rem; box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3); }
        .notification-icon { font-size: 1.1rem; }

        /* CONTRACT */
        .contract-container-print { width: 794px; max-width: 100%; margin: 0 auto; background: white; font-family: 'Inter', 'Segoe UI', sans-serif; font-size: 11px; color: #0c4a6e; line-height: 1.5; padding: 0 6px; }
        .contract-header-table { width: 100%; border-bottom: 2px solid #d4af37; margin-bottom: 10px; padding-bottom: 6px; }
        .header-left { width: 30%; vertical-align: top; }
        .header-center { width: 40%; text-align: center; vertical-align: middle; }
        .header-right { width: 30%; text-align: right; vertical-align: top; }
        .company-name { font-size: 20px; font-weight: 800; letter-spacing: 1.5px; color: #1a1a2e; }
        .company-slogan { font-size: 10px; font-weight: 600; margin-top: 2px; color: #b8860b; }
        .company-phone { font-size: 9px; margin-top: 4px; color: #0369a1; }
        .contract-logo-print { height: 75px; width: auto; object-fit: contain; }
        .contract-number-box { border: 1px solid #7dd3fc; padding: 6px 12px; text-align: center; font-size: 10px; background: #f0f9ff; border-radius: 8px; }
        .arabic-text { margin-top: 6px; font-size: 12px; font-weight: 500; color: #0369a1; }
        .contract-title-print { text-align: center; font-size: 17px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; border-bottom: 1px solid #7dd3fc; padding-bottom: 6px; color: #075985; }
        .contract-content-table { width: 100%; }
        .contract-left-col { width: 50%; vertical-align: top; padding-right: 12px; }
        .contract-right-col { width: 50%; vertical-align: top; padding-left: 12px; }
        .contract-section { margin-bottom: 8px; border: 1px solid #7dd3fc; border-radius: 8px; overflow: hidden; background: white; }
        .section-title-print { background: #e0f2fe; padding: 6px 12px; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #0284c7; color: #075985; }
        .checklist-section-print .checklist-table, .checklist-section-print .doc-item, .observation-box, .signature-box, .kilometrage-clause-section { border-color: #7dd3fc !important; }
        .checklist-section-print .section-title-print { background: #e0f2fe !important; }
        .obs-title { background: #e0f2fe !important; border-bottom: 1px solid #0284c7; color: #075985; }
        .section-content { padding: 8px 12px; }
        .field-row { display: flex; margin-bottom: 4px; font-size: 10px; align-items: baseline; }
        .field-label { width: 100px; font-weight: 600; color: #0369a1; flex-shrink: 0; }
        .field-value { flex: 1; border-bottom: 1px dotted #bae6fd; padding-left: 4px; color: #0f172a; }
        .matricule-code { font-family: 'Courier New', monospace; font-weight: 700; color: #b8860b; letter-spacing: 0.5px; }
        .total-row .total-amount { font-weight: 800; font-size: 12px; color: #b8860b; }
        .remaining-amount { font-weight: 700; color: #dc2626; }
        .pricing-section { border-left: 4px solid #d4af37; }
        .checklist-section-print { margin: 8px 0; }
        .checklist-table { width: 100%; margin-bottom: 8px; }
        .checklist-cell { width: 50%; text-align: center; vertical-align: top; padding: 0 6px; }
        .checklist-label { font-weight: 700; margin-bottom: 4px; font-size: 10px; color: #075985; }
        .documents-row { display: flex; flex-wrap: wrap; align-items: center; padding: 8px 12px; background: #f0f9ff; border-radius: 8px; margin-top: 6px; gap: 10px; }
        .documents-label { font-weight: 700; margin-right: 4px; font-size: 10px; color: #075985; }
        .documents-items { display: flex; flex-wrap: wrap; gap: 10px; }
        .doc-item { display: inline-flex; align-items: center; gap: 4px; font-size: 9px; background: white; padding: 3px 8px; border-radius: 12px; border: 1px solid #7dd3fc; }
        .checkbox-square { display: inline-flex; align-items: center; justify-content: center; width: 13px; height: 13px; border: 1.5px solid #0369a1; background: white; font-size: 9px; font-weight: bold; margin-right: 2px; border-radius: 2px; }
        .checkbox-square.checked { background: #d4af37 !important; border-color: #d4af37 !important; color: #0f172a !important; }
        .car-diagram-container { display: flex; justify-content: center; align-items: center; }
        .car-diagram-container img { width: 100%; max-width: 130px; height: auto; border: 1px solid #7dd3fc; border-radius: 6px; background: #fafafa; padding: 4px; }
        .checklist-image { width: 120px; height: 80px; object-fit: contain; }
        .kilometrage-clause-section { margin: 10px 0; padding: 10px 16px; border: 2px solid #d4af37; border-radius: 10px; background: #fefce8; box-shadow: 0 1px 4px rgba(212, 175, 55, 0.15); }
        .kilometrage-clause-title { font-size: 11px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; align-items: center; gap: 4px; }
        .kilometrage-clause-text { font-size: 10.5px; color: #0c4a6e; line-height: 1.5; font-weight: 500; }
        .observations-row-print { display: flex; flex-wrap: wrap; gap: 12px; margin: 8px 0; }
        .observation-box { flex: 1; border: 1px solid #7dd3fc; border-radius: 10px; overflow: hidden; background: white; }
        .observation-box.half-width { flex: 0 0 calc(33.33% - 8px); }
        .obs-title { display: block; padding: 6px 12px; background: #e0f2fe; font-weight: 700; font-size: 10px; border-bottom: 1px solid #7dd3fc; color: #075985; }
        .observation-content { padding: 8px 12px; font-size: 9.5px; min-height: 50px; color: #0c4a6e; }
        .observation-text { white-space: pre-line; }
        .signatures-row-print { display: flex; gap: 20px; margin: 10px 0; }
        .signature-block { flex: 1; text-align: center; position: relative; }
        .signature-label { font-size: 9px; font-weight: 700; margin-bottom: 6px; color: #075985; }
        .signature-box { border: 1px solid #7dd3fc; height: 50px; display: flex; align-items: center; justify-content: center; background: #f0f9ff; border-radius: 6px; overflow: hidden; position: relative; }
        .signature-box img.signature-img { max-height: 45px; max-width: 90%; object-fit: contain; }
        .signature-box img.signature-cache { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; opacity: 0.9; pointer-events: none; z-index: 5; }
        .signature-text { font-size: 9px; font-style: italic; color: #0369a1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
        .contract-footer-print { margin-top: 8px; padding-top: 6px; border-top: 1px solid #d4af37; text-align: center; font-size: 8px; color: #0369a1; }
        .footer-line { margin-bottom: 2px; line-height: 1.3; }
        .contract-number-box.stylish { border: none; background: #eff6ff; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); padding: 4px 14px; }
        .contract-number-box.stylish .contract-number-label { font-size: 9px; color: #0369a1; letter-spacing: 1px; }
        .contract-number-box.stylish .contract-number-value { font-size: 20px; font-weight: 800; color: #1a1a2e; }

        @media (max-width: 768px) {
          .reservation-status-management { padding: 1rem; }
          .section-header { flex-direction: column; align-items: flex-start; }
          .search-filter-section { flex-direction: column; align-items: stretch; }
          .search-box { min-width: auto; }
          .filter-group { justify-content: space-between; }
          .filter-item { flex: 1; }
          .filter-select { min-width: auto; }
          .results-summary { flex-direction: column; gap: 0.5rem; align-items: flex-start; }
          .confirmation-actions { flex-direction: column; }
          .full-modal { margin: 0.5rem; border-radius: 20px; }
          .contract-modal-header { flex-direction: column; gap: 1rem; }
          .observations-row-print { flex-direction: column; }
          .observation-box.half-width { flex: 1; }
          .signatures-row-print { flex-direction: column; gap: 10px; }
          .print-options-preview { grid-template-columns: 1fr; }
          .display-options-grid { grid-template-columns: 1fr; }
        }
        .filter-indicator { font-size: 1.2rem; color: #64748b; font-weight: 500; background: rgba(108, 117, 125, 0.1); padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(108, 117, 125, 0.2); }
        span.filter-indicator { -webkit-text-fill-color: #64748b; }
        .filter-indicator-text { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; font-weight: 500; color: #92400e; }
        .clear-filter-btn { display: inline-flex; align-items: center; gap: 0.25rem; background: none; border: 1px solid #92400e; padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 500; color: #92400e; cursor: pointer; }
        .clear-filter-btn:hover { background: #92400e; color: #fff; }
      `}</style>
    </div>
  );
};

export default ReservationStatusManagement;