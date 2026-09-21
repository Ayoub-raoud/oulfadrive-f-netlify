import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import {
  logoutUtilisateur, selectIsAuthenticated, selectUser, selectCars,
  selectReservations, selectClients, selectAccidents, selectContacts,
  selectUtilisateurs, selectMatricules, fetchCars, fetchReservations,
  fetchClients, fetchAccidents, fetchContacts, fetchUtilisateurs,
  fetchMatricules, createReservation, updateReservation, refreshMatricules,
  selectCarsLoading, selectReservationsLoading, fetchSousLocations,
  selectSousLocations, createClient, updateUtilisateur,
  addPaymentToReservation, removePaymentFromReservation,
} from '../Redux/store';
import { fetchMyPermissions } from '../Redux/permissionSlice';
import { getRolesForPage, hasAccess } from '../config/permissions';
import AdminSidebar from './AdminSidebar';
import UsersManagement from './UsersManagement';
import CarsManagement from './CarsManagement';
import ClientsManagement from './ClientsManagement';
import ReservationsManagement from './ReservationsManagement';
import ReservationStatusManagement from './ReservationStatusManagement';
import ContactsManagement from './ContactsManagement';
import AccidentsManagement from './AccidentsManagement';
import MatriculesManagement from './MatriculesManagement';
import CreditManagement from './CreditManagement';
import SousLocationsManagement from './AdminSousLocations';
import GaragesManagement from './AdminGarages';
import PaymentsManagement from './AdminPayments';

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

import {
  Car, CalendarCheck, Users, TrendingUp, AlertTriangle, DollarSign,
  CheckCircle, XCircle, Clock, UserCheck, MessageCircle, Calendar,
  ChevronLeft, ChevronRight, Filter, Plus, Check, X, Loader,
  FileText, CalendarClock, AlarmClock, Wrench, Gauge, ChevronDown,
  ChevronUp, Search, Edit, Trash2, CalendarPlus, UserCircle,
  IdCard, Phone, Mail, MapPin, Info, Shield, Settings, Eye, EyeOff,
  Save, RefreshCw, Printer, FolderOpen, Download, History, LogOut,
  Lock, LayoutDashboard, Zap,
} from 'lucide-react';

import { toast } from 'sonner';
import '../Css/AdminDashboard.css';

import logoImage from '../assets/logo.png';

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const formatMoney = (val) => `${Number(val || 0).toFixed(2)} DH`;

// ✅ FIXED: backend runs on port 8000
const API_URL = "https://oulfa-back-production.up.railway.app/api";

// ---- StatCard ----
const StatCard = ({ icon: Icon, title, value, subtitle, color, onClick }) => (
  <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <div className={`stat-icon stat-icon-${color}`}><Icon size={20} /></div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{title}</div>
    {subtitle && <div className="stat-subtitle">{subtitle}</div>}
  </div>
);

// ---- FilterDropdown ----
const FilterDropdown = ({ options, value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const selected = options.find(opt => opt.value === value)?.label || label;
  return (
    <div className="filter-dropdown-wrapper" ref={ref}>
      <button className="filter-dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span>{selected}</span>
        <ChevronRight size={14} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>
      {isOpen && (
        <div className="filter-dropdown-menu">
          {options.map(opt => (
            <button key={opt.value} className={`filter-dropdown-item ${opt.value === value ? 'active' : ''}`}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---- MatriculeCategoryCard ----
const MatriculeCategoryCard = ({
  title, icon: Icon, color, matricules, onReserve, onConfirm, onCancel,
  onConfirmDirect, expanded, onToggleExpand, badge, onComplete, onToggleExtend,
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded || false);
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTodayOnly, setShowTodayOnly] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (onToggleExpand) onToggleExpand(!isExpanded);
    if (isExpanded) { setShowAll(false); setSearchTerm(''); setShowTodayOnly(false); }
  };

  const filtered = useMemo(() => {
    let list = Array.isArray(matricules) ? matricules : [];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(m =>
        m.matricule_code?.toLowerCase().includes(lower) ||
        m.car?.brand?.toLowerCase().includes(lower) ||
        m.car?.model?.toLowerCase().includes(lower) ||
        m.currentReservation?.client?.prenom?.toLowerCase().includes(lower) ||
        m.currentReservation?.client?.nom?.toLowerCase().includes(lower)
      );
    }
    if (showTodayOnly && title === 'Retour imminent') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      list = list.filter(m => {
        const end = m.currentReservation?.end_date;
        if (!end) return false;
        const d = new Date(end); d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
    }
    return list;
  }, [matricules, searchTerm, showTodayOnly, title]);

  const display = showAll ? filtered : filtered.slice(0, 5);
  const hasMore = filtered.length > 5;
  const isPending = title === 'En attente de confirmation';
  const isRetour = title === 'Retour imminent';

  const getDaysLeft = (endDate) => {
    if (!endDate) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(0, 0, 0, 0);
    return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  };

  if (matricules.length === 0) {
    return (
      <div className={`matricule-category-card ${color}`}>
        <div className="card-header" onClick={toggleExpand}>
          <div className="card-title"><Icon size={18} /><span>{title}</span><span className="card-badge">0</span></div>
          <div className="card-actions"><span className="card-count">0</span>{isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
        </div>
        {isExpanded && (
          <div className="card-dropdown">
            <div className="dropdown-empty">Aucun matricule dans cette catégorie</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`matricule-category-card ${color}`}>
      <div className="card-header" onClick={toggleExpand}>
        <div className="card-title"><Icon size={18} /><span>{title}</span>{badge && <span className="card-badge">{badge}</span>}</div>
        <div className="card-actions"><span className="card-count">{matricules.length}</span>{isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
      </div>
      {isExpanded && (
        <div className="card-dropdown">
          <div className="dropdown-search">
            <Search size={14} className="search-icon" />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {searchTerm && <X size={14} className="clear-search" onClick={() => setSearchTerm('')} />}
            {isRetour && (
              <button className={`today-filter-btn ${showTodayOnly ? 'active' : ''}`} onClick={() => setShowTodayOnly(!showTodayOnly)}>
                📅 Aujourd'hui
              </button>
            )}
          </div>
          <div className="dropdown-list">
            {display.map(mat => {
              const res = mat.currentReservation;
              const canExtend = res?.can_extend_days;
              let daysLeft = null;
              if (isRetour && res?.end_date) daysLeft = getDaysLeft(res.end_date);
              return (
                <div key={mat.id} className={`dropdown-item ${canExtend ? 'extendable' : ''}`}>
                  <div className="item-info">
                    <span className="item-code">{mat.matricule_code}</span>
                    <span className="item-car">{mat.car?.brand} {mat.car?.model}</span>
                    <span className="item-km">{mat.kilometrage?.toLocaleString()} km</span>
                    {res && (
                      <span className="item-client">
                        {res.client?.prenom} {res.client?.nom}
                        {res.end_date && <span className="item-end-date">(retour: {new Date(res.end_date).toLocaleDateString('fr-FR')})</span>}
                      </span>
                    )}
                    {isRetour && daysLeft !== null && (
                      <span className="days-left-badge" style={{ background: daysLeft < 0 ? '#fee2e2' : daysLeft === 0 ? '#fef2f2' : '#fef3c7', color: daysLeft < 0 ? '#dc2626' : daysLeft === 0 ? '#dc2626' : '#d97706' }}>
                        {daysLeft < 0 ? `Retard de ${Math.abs(daysLeft)}j` : daysLeft === 0 ? 'Retour aujourd\'hui' : `${daysLeft}j restants`}
                      </span>
                    )}
                  </div>
                  <div className="item-actions">
                    {title === 'Disponibles' && (
                      <>
                        <button className="btn-reserve" onClick={(e) => { e.stopPropagation(); onReserve(mat); }}><Plus size={12} /> Réserver</button>
                        <button className="btn-confirm" onClick={(e) => { e.stopPropagation(); onConfirmDirect(mat); }}><Check size={12} /> Confirmer</button>
                      </>
                    )}
                    {isPending && res && (
                      <>
                        <button className="btn-confirm" onClick={(e) => { e.stopPropagation(); onConfirm(res); }}><Check size={12} /> Confirmer</button>
                        <button className="btn-cancel" onClick={(e) => { e.stopPropagation(); onCancel(res); }}><X size={12} /> Annuler</button>
                      </>
                    )}
                    {(title === 'Retour imminent' || title === 'En retard') && onComplete && res && (res.status === 'confirmed' || res.status === 'retard') && (
                      <>
                        {isRetour && res && (
                          <>
                            {canExtend ? (
                              <span className="extend-badge"><CheckCircle size={12} /> Prolongation activée</span>
                            ) : (
                              <button className="btn-extend" onClick={(e) => { e.stopPropagation(); onToggleExtend(res); }}>Activer prolongation</button>
                            )}
                          </>
                        )}
                        <button className="btn-complete" onClick={(e) => { e.stopPropagation(); onComplete(res); }}><CheckCircle size={12} /> Terminer</button>
                      </>
                    )}
                    {title === 'En panne (Accident)' && <span className="return-badge">⛔ En réparation</span>}
                  </div>
                </div>
              );
            })}
          </div>
          {hasMore && (
            <div className="dropdown-footer">
              <button className="btn-show-more" onClick={() => setShowAll(!showAll)}>
                {showAll ? 'Voir moins' : `Voir tout (${filtered.length})`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ---- SecondDriverSearch ----
const SecondDriverSearch = ({ clients, selectedClientId, selectedSecondDriverId, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewDriver, setIsNewDriver] = useState(false);
  const dispatch = useDispatch();
  const [newDriverData, setNewDriverData] = useState({ prenom: "", nom: "", telephone: "", email: "", city: "", cin_number: "", driver_license_number: "" });
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    if (!searchTerm.trim() || isNewDriver) return [];
    const term = searchTerm.toLowerCase().trim();
    return clients.filter(c => {
      if (selectedClientId && c.id === selectedClientId) return false;
      const full = `${c.prenom || ""} ${c.nom || ""}`.toLowerCase();
      const email = (c.email || "").toLowerCase();
      const phone = (c.telephone || "").toLowerCase();
      return full.includes(term) || email.includes(term) || phone.includes(term);
    }).slice(0, 10);
  }, [searchTerm, isNewDriver, clients, selectedClientId]);

  const handleSelect = (client) => { onSelect(client); setSearchTerm(""); setIsNewDriver(false); };
  const handleCreate = async () => {
    if (!newDriverData.prenom || !newDriverData.nom || !newDriverData.telephone) {
      toast.error("Veuillez remplir Prénom, Nom, Téléphone");
      return;
    }
    setCreating(true);
    try {
      const result = await dispatch(createClient(newDriverData)).unwrap();
      const client = result.client || result;
      toast.success("Conducteur créé");
      onSelect(client);
      setIsNewDriver(false);
      setSearchTerm("");
      setNewDriverData({ prenom: "", nom: "", telephone: "", email: "", city: "", cin_number: "", driver_license_number: "" });
    } catch (e) { toast.error("Erreur création"); } finally { setCreating(false); }
  };

  if (isNewDriver) {
    return (
      <div className="new-driver-form" style={{ marginTop: "0.5rem", padding: "0.5rem", background: "#f8fafc", borderRadius: "0.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <input className="form-control" placeholder="Prénom *" value={newDriverData.prenom} onChange={(e) => setNewDriverData({ ...newDriverData, prenom: e.target.value })} />
          <input className="form-control" placeholder="Nom *" value={newDriverData.nom} onChange={(e) => setNewDriverData({ ...newDriverData, nom: e.target.value })} />
          <input className="form-control" placeholder="Téléphone *" value={newDriverData.telephone} onChange={(e) => setNewDriverData({ ...newDriverData, telephone: e.target.value })} />
          <input className="form-control" placeholder="Email" value={newDriverData.email} onChange={(e) => setNewDriverData({ ...newDriverData, email: e.target.value })} />
          <input className="form-control" placeholder="Ville" value={newDriverData.city} onChange={(e) => setNewDriverData({ ...newDriverData, city: e.target.value })} />
          <input className="form-control" placeholder="CIN" value={newDriverData.cin_number} onChange={(e) => setNewDriverData({ ...newDriverData, cin_number: e.target.value })} />
          <input className="form-control" placeholder="Permis" value={newDriverData.driver_license_number} onChange={(e) => setNewDriverData({ ...newDriverData, driver_license_number: e.target.value })} style={{ gridColumn: "span 2" }} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
          <button className="btn btn-outline" onClick={() => setIsNewDriver(false)}>Annuler</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>{creating ? "Création..." : "Créer"}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <input className="form-control" placeholder="Rechercher un conducteur..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      {filtered.length > 0 && (
        <div className="client-list-container" style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "0.5rem", marginTop: "0.25rem" }}>
          {filtered.map(d => (
            <div key={d.id} className={`client-list-item ${selectedSecondDriverId === d.id ? "selected" : ""}`} onClick={() => handleSelect(d)} style={{ padding: "0.5rem 0.75rem", cursor: "pointer", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
              <span>{d.prenom} {d.nom}</span>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{d.telephone}</span>
            </div>
          ))}
        </div>
      )}
      <button className="btn btn-outline" onClick={() => setIsNewDriver(true)} style={{ width: "100%", marginTop: "0.25rem", justifyContent: "center" }}><Plus size={14} /> Créer un nouveau conducteur</button>
    </div>
  );
};

// ---- ReserveModal (full-screen AdminModal-style) ----
const ReserveModal = ({ isOpen, onClose, matricule, clients, cars, onConfirm }) => {
  const dispatch = useDispatch();
  const sousLocations = useSelector(selectSousLocations);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClientName, setSelectedClientName] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasSecondDriver, setHasSecondDriver] = useState(false);
  const [secondDriverClientId, setSecondDriverClientId] = useState('');
  const [showCreateClientForm, setShowCreateClientForm] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClientData, setNewClientData] = useState({ nom: '', prenom: '', telephone: '', email: '', city: '', cin_number: '', driver_license_number: '' });
  const [sousLocationSearch, setSousLocationSearch] = useState('');
  const [selectedSousLocationId, setSelectedSousLocationId] = useState('');
  const [showSousDropdown, setShowSousDropdown] = useState(false);
  const sousRef = useRef(null);

  useEffect(() => { if (isOpen) dispatch(fetchSousLocations()); }, [isOpen, dispatch]);
  useEffect(() => { const h = (e) => { if (sousRef.current && !sousRef.current.contains(e.target)) setShowSousDropdown(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);

  const rentalDays = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate); const end = new Date(endDate);
    start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff === 0 ? 1 : diff;
  }, [startDate, endDate]);

  const totalPrice = useMemo(() => {
    if (!matricule || !startDate || !endDate) return 0;
    const car = cars.find(c => c.id === matricule.car_id);
    if (!car) return 0;
    return (car.price_per_day || 0) * rentalDays;
  }, [matricule, startDate, endDate, cars, rentalDays]);

  const filteredClients = clients.filter(c =>
    `${c.prenom} ${c.nom} ${c.telephone} ${c.email || ''}`.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleCreateClient = async () => {
    if (!newClientData.nom || !newClientData.prenom || !newClientData.telephone) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    setCreatingClient(true);
    try {
      const result = await dispatch(createClient(newClientData)).unwrap();
      const client = result?.data || result?.client || result;
      const id = client.id || result.id;
      const fullName = `${client.prenom || ''} ${client.nom || ''}`.trim() || 'Nouveau client';
      setSelectedClientId(id);
      setSelectedClientName(fullName);
      setClientSearch(fullName);
      setShowCreateClientForm(false);
      setNewClientData({ nom: '', prenom: '', telephone: '', email: '', city: '', cin_number: '', driver_license_number: '' });
      await dispatch(fetchClients());
      toast.success(`Client "${fullName}" créé`);
    } catch (e) { toast.error('Erreur création client'); } finally { setCreatingClient(false); }
  };

  if (!isOpen || !matricule) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClientId) { toast.error('Veuillez sélectionner un client'); return; }
    const data = {
      client_id: selectedClientId, matricule_id: matricule.id, car_id: matricule.car_id,
      start_date: startDate, end_date: endDate, start_time: startTime, end_time: endTime,
      total_price: totalPrice, amount_paid: 0, remaining_amount: totalPrice, status,
      notes, sous_location_id: selectedSousLocationId || null, rental_days: rentalDays,
      has_second_driver: hasSecondDriver, second_driver_client_id: hasSecondDriver ? secondDriverClientId : null,
    };
    setSubmitting(true);
    try { await onConfirm(data); onClose(); } catch (e) { } finally { setSubmitting(false); }
  };

  return createPortal(
    <div className="dash-full-overlay" role="dialog" aria-modal="true">
      <div className="dash-modal-card" style={{ maxWidth: '760px' }}>
        <header className="dash-header">
          <div className="dash-header-icon"><CalendarPlus size={28} /></div>
          <div className="dash-header-title">
            <h2>Réserver {matricule.matricule_code}</h2>
            <p>Créez une nouvelle réservation</p>
          </div>
          <button type="button" className="dash-header-close" onClick={onClose} aria-label="Fermer">
            <X size={24} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="dash-form">
          <div className="dash-body">
            <div className="dash-grid-2">
              <div className="dash-field" style={{ gridColumn: '1 / -1' }}>
                <label className="dash-label dash-required">Client</label>
                <input className="dash-input" placeholder="Rechercher un client..." value={clientSearch} onChange={(e) => { const v = e.target.value; setClientSearch(v); if (!v) { setSelectedClientId(''); setSelectedClientName(''); } }} />
                <div className="client-list-container">
                  {filteredClients.map(c => (
                    <div key={c.id} className={`client-list-item ${selectedClientId === c.id ? 'selected' : ''}`} onClick={() => { setSelectedClientId(c.id); setSelectedClientName(`${c.prenom} ${c.nom}`); setClientSearch(`${c.prenom} ${c.nom}`); }}>
                      <span>{c.prenom} {c.nom}</span><span className="client-phone">{c.telephone}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  {!showCreateClientForm ? (
                    <button type="button" className="dash-btn-ghost" style={{ width: '100%' }} onClick={() => setShowCreateClientForm(true)}><Plus size={14} /> Créer un nouveau client</button>
                  ) : (
                    <div className="dash-inline-create">
                      <div className="dash-grid-2">
                        <input className="dash-input" placeholder="Nom *" value={newClientData.nom} onChange={(e) => setNewClientData({ ...newClientData, nom: e.target.value })} />
                        <input className="dash-input" placeholder="Prénom *" value={newClientData.prenom} onChange={(e) => setNewClientData({ ...newClientData, prenom: e.target.value })} />
                        <input className="dash-input" placeholder="Téléphone *" value={newClientData.telephone} onChange={(e) => setNewClientData({ ...newClientData, telephone: e.target.value })} />
                        <input className="dash-input" placeholder="Email" value={newClientData.email} onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })} />
                        <input className="dash-input" placeholder="Ville" value={newClientData.city} onChange={(e) => setNewClientData({ ...newClientData, city: e.target.value })} />
                        <input className="dash-input" placeholder="CIN" value={newClientData.cin_number} onChange={(e) => setNewClientData({ ...newClientData, cin_number: e.target.value })} />
                        <input className="dash-input" placeholder="Permis" value={newClientData.driver_license_number} onChange={(e) => setNewClientData({ ...newClientData, driver_license_number: e.target.value })} style={{ gridColumn: '1 / -1' }} />
                      </div>
                      <div className="dash-inline-actions">
                        <button type="button" className="dash-btn-secondary" onClick={() => setShowCreateClientForm(false)}>Annuler</button>
                        <button type="button" className="dash-btn-primary" onClick={handleCreateClient} disabled={creatingClient}>
                          {creatingClient ? <Loader size={16} className="spinning" /> : 'Créer'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {selectedClientId && <div className="dash-selected-hint">✅ Client sélectionné : {selectedClientName}</div>}
              </div>

              <div className="dash-field" style={{ gridColumn: '1 / -1' }}>
                <label className="dash-toggle">
                  <input type="checkbox" checked={hasSecondDriver} onChange={(e) => { setHasSecondDriver(e.target.checked); if (!e.target.checked) setSecondDriverClientId(''); }} />
                  <span>Ajouter un deuxième conducteur</span>
                </label>
                {hasSecondDriver && <SecondDriverSearch clients={clients} selectedClientId={selectedClientId} selectedSecondDriverId={secondDriverClientId} onSelect={(c) => setSecondDriverClientId(c.id)} />}
                {secondDriverClientId && <div className="dash-selected-hint">✅ Deuxième conducteur sélectionné</div>}
              </div>

              <div className="dash-field">
                <label className="dash-label dash-required">Date de début</label>
                <input type="date" className="dash-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="dash-field">
                <label className="dash-label dash-required">Heure de début</label>
                <input type="time" className="dash-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div className="dash-field">
                <label className="dash-label dash-required">Date de fin</label>
                <input type="date" className="dash-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>
              <div className="dash-field">
                <label className="dash-label dash-required">Heure de fin</label>
                <input type="time" className="dash-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
              <div className="dash-field">
                <label className="dash-label">Prix total estimé</label>
                <input type="text" className="dash-input dash-input-readonly" value={`${totalPrice} DH`} disabled />
              </div>
              <div className="dash-field">
                <label className="dash-label">Statut</label>
                <select className="dash-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="pending">En attente</option><option value="confirmed">Confirmé</option><option value="contacted">Contacté</option>
                </select>
              </div>

              <div className="dash-field" style={{ gridColumn: '1 / -1' }} ref={sousRef}>
                <label className="dash-label">Sous-location (optionnel)</label>
                <input className="dash-input" placeholder="Rechercher..." value={sousLocationSearch} onChange={(e) => { setSousLocationSearch(e.target.value); setShowSousDropdown(true); if (!e.target.value) setSelectedSousLocationId(''); }} onFocus={() => setShowSousDropdown(true)} />
                {showSousDropdown && (
                  <div className="client-list-container">
                    {sousLocations.filter(sl => sl.name.toLowerCase().includes(sousLocationSearch.toLowerCase())).map(sl => (
                      <div key={sl.id} className="client-list-item" onClick={() => { setSelectedSousLocationId(sl.id); setSousLocationSearch(sl.name); setShowSousDropdown(false); }}>
                        <span>{sl.name}</span><span className="client-phone">{sl.status}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedSousLocationId && <div className="dash-selected-hint">✅ Sous-location sélectionnée</div>}
              </div>

              <div className="dash-field" style={{ gridColumn: '1 / -1' }}>
                <label className="dash-label">Notes</label>
                <textarea className="dash-input dash-textarea" rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="dash-footer">
            <button type="button" className="dash-btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="dash-btn-primary" disabled={submitting}>
              {submitting ? <Loader size={16} className="spinning" /> : 'Réserver'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// ---- DirectConfirmModal (full-screen AdminModal-style) ----
const DirectConfirmModal = ({ isOpen, onClose, matricule, clients, cars, onConfirm }) => {
  const dispatch = useDispatch();
  const sousLocations = useSelector(selectSousLocations);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClientName, setSelectedClientName] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(new Date().toTimeString().slice(0, 5));
  const [endTime, setEndTime] = useState('18:00');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasSecondDriver, setHasSecondDriver] = useState(false);
  const [secondDriverClientId, setSecondDriverClientId] = useState('');
  const [showCreateClientForm, setShowCreateClientForm] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClientData, setNewClientData] = useState({ nom: '', prenom: '', telephone: '', email: '', city: '', cin_number: '', driver_license_number: '' });

  const [sousLocationSearch, setSousLocationSearch] = useState('');
  const [selectedSousLocationId, setSelectedSousLocationId] = useState('');
  const [showSousDropdown, setShowSousDropdown] = useState(false);
  const sousRef = useRef(null);

  const [canExtendDays, setCanExtendDays] = useState(false);
  const [prolongationDays, setProlongationDays] = useState(1);

  useEffect(() => { if (isOpen) setStartTime(new Date().toTimeString().slice(0, 5)); }, [isOpen]);
  useEffect(() => { if (isOpen) dispatch(fetchSousLocations()); }, [isOpen, dispatch]);

  useEffect(() => {
    const h = (e) => { if (sousRef.current && !sousRef.current.contains(e.target)) setShowSousDropdown(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const rentalDays = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate); const end = new Date(endDate);
    start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff === 0 ? 1 : diff;
  }, [startDate, endDate]);

  const totalPrice = useMemo(() => {
    if (!matricule || !startDate || !endDate) return 0;
    const car = cars.find(c => c.id === matricule.car_id);
    if (!car) return 0;
    return (car.price_per_day || 0) * rentalDays;
  }, [matricule, startDate, endDate, cars, rentalDays]);

  const filteredClients = clients.filter(c =>
    `${c.prenom} ${c.nom} ${c.telephone} ${c.email || ''}`.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleCreateClient = async () => {
    if (!newClientData.nom || !newClientData.prenom || !newClientData.telephone) { toast.error('Veuillez remplir les champs obligatoires'); return; }
    setCreatingClient(true);
    try {
      const result = await dispatch(createClient(newClientData)).unwrap();
      const client = result?.data || result?.client || result;
      const id = client.id || result.id;
      const fullName = `${client.prenom || ''} ${client.nom || ''}`.trim() || 'Nouveau client';
      setSelectedClientId(id); setSelectedClientName(fullName); setClientSearch(fullName);
      setShowCreateClientForm(false);
      setNewClientData({ nom: '', prenom: '', telephone: '', email: '', city: '', cin_number: '', driver_license_number: '' });
      await dispatch(fetchClients());
      toast.success(`Client "${fullName}" créé`);
    } catch (e) { toast.error('Erreur création client'); } finally { setCreatingClient(false); }
  };

  if (!isOpen || !matricule) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClientId) { toast.error('Veuillez sélectionner un client'); return; }
    const data = {
      client_id: selectedClientId, matricule_id: matricule.id, car_id: matricule.car_id,
      start_date: startDate, end_date: endDate, start_time: startTime, end_time: endTime,
      total_price: totalPrice, amount_paid: 0, remaining_amount: totalPrice,
      status: 'confirmed', notes, rental_days: rentalDays,
      has_second_driver: hasSecondDriver, second_driver_client_id: hasSecondDriver ? secondDriverClientId : null,
      sous_location_id: selectedSousLocationId || null,
      can_extend_days: !!canExtendDays,
      prolongation_days: canExtendDays ? (parseInt(prolongationDays, 10) || 0) : 0,
    };
    setSubmitting(true);
    try { await onConfirm(data); onClose(); } catch (e) { } finally { setSubmitting(false); }
  };

  return createPortal(
    <div className="dash-full-overlay" role="dialog" aria-modal="true">
      <div className="dash-modal-card" style={{ maxWidth: '760px' }}>
        <header className="dash-header">
          <div className="dash-header-icon"><CheckCircle size={28} /></div>
          <div className="dash-header-title">
            <h2>Confirmer {matricule.matricule_code}</h2>
            <p>Confirmez directement la location et générez le contrat</p>
          </div>
          <button type="button" className="dash-header-close" onClick={onClose} aria-label="Fermer">
            <X size={24} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="dash-form">
          <div className="dash-body">
            <div className="dash-grid-2">
              <div className="dash-field" style={{ gridColumn: '1 / -1' }}>
                <label className="dash-label dash-required">Client</label>
                <input className="dash-input" placeholder="Rechercher un client..." value={clientSearch} onChange={(e) => { const v = e.target.value; setClientSearch(v); if (!v) { setSelectedClientId(''); setSelectedClientName(''); } }} />
                <div className="client-list-container">
                  {filteredClients.map(c => (
                    <div key={c.id} className={`client-list-item ${selectedClientId === c.id ? 'selected' : ''}`} onClick={() => { setSelectedClientId(c.id); setSelectedClientName(`${c.prenom} ${c.nom}`); setClientSearch(`${c.prenom} ${c.nom}`); }}>
                      <span>{c.prenom} {c.nom}</span><span className="client-phone">{c.telephone}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  {!showCreateClientForm ? (
                    <button type="button" className="dash-btn-ghost" style={{ width: '100%' }} onClick={() => setShowCreateClientForm(true)}><Plus size={14} /> Créer un nouveau client</button>
                  ) : (
                    <div className="dash-inline-create">
                      <div className="dash-grid-2">
                        <input className="dash-input" placeholder="Nom *" value={newClientData.nom} onChange={(e) => setNewClientData({ ...newClientData, nom: e.target.value })} />
                        <input className="dash-input" placeholder="Prénom *" value={newClientData.prenom} onChange={(e) => setNewClientData({ ...newClientData, prenom: e.target.value })} />
                        <input className="dash-input" placeholder="Téléphone *" value={newClientData.telephone} onChange={(e) => setNewClientData({ ...newClientData, telephone: e.target.value })} />
                        <input className="dash-input" placeholder="Email" value={newClientData.email} onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })} />
                        <input className="dash-input" placeholder="Ville" value={newClientData.city} onChange={(e) => setNewClientData({ ...newClientData, city: e.target.value })} />
                        <input className="dash-input" placeholder="CIN" value={newClientData.cin_number} onChange={(e) => setNewClientData({ ...newClientData, cin_number: e.target.value })} />
                        <input className="dash-input" placeholder="Permis" value={newClientData.driver_license_number} onChange={(e) => setNewClientData({ ...newClientData, driver_license_number: e.target.value })} style={{ gridColumn: '1 / -1' }} />
                      </div>
                      <div className="dash-inline-actions">
                        <button type="button" className="dash-btn-secondary" onClick={() => setShowCreateClientForm(false)}>Annuler</button>
                        <button type="button" className="dash-btn-primary" onClick={handleCreateClient} disabled={creatingClient}>
                          {creatingClient ? <Loader size={16} className="spinning" /> : 'Créer'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {selectedClientId && <div className="dash-selected-hint">✅ Client sélectionné : {selectedClientName}</div>}
              </div>

              <div className="dash-field" style={{ gridColumn: '1 / -1' }}>
                <label className="dash-toggle">
                  <input type="checkbox" checked={hasSecondDriver} onChange={(e) => { setHasSecondDriver(e.target.checked); if (!e.target.checked) setSecondDriverClientId(''); }} />
                  <span>Ajouter un deuxième conducteur</span>
                </label>
                {hasSecondDriver && <SecondDriverSearch clients={clients} selectedClientId={selectedClientId} selectedSecondDriverId={secondDriverClientId} onSelect={(c) => setSecondDriverClientId(c.id)} />}
                {secondDriverClientId && <div className="dash-selected-hint">✅ Deuxième conducteur sélectionné</div>}
              </div>

              <div className="dash-field">
                <label className="dash-label dash-required">Date de début</label>
                <input type="date" className="dash-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="dash-field">
                <label className="dash-label dash-required">Heure de début</label>
                <input type="time" className="dash-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div className="dash-field">
                <label className="dash-label dash-required">Date de fin</label>
                <input type="date" className="dash-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>
              <div className="dash-field">
                <label className="dash-label dash-required">Heure de fin</label>
                <input type="time" className="dash-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
              <div className="dash-field" style={{ gridColumn: '1 / -1' }}>
                <label className="dash-label">Prix total</label>
                <input type="text" className="dash-input dash-input-readonly" value={`${totalPrice} DH`} disabled />
              </div>

              <div className="dash-field" style={{ gridColumn: '1 / -1' }} ref={sousRef}>
                <label className="dash-label">Sous-location (optionnel)</label>
                <input className="dash-input" placeholder="Rechercher..." value={sousLocationSearch} onChange={(e) => { setSousLocationSearch(e.target.value); setShowSousDropdown(true); if (!e.target.value) setSelectedSousLocationId(''); }} onFocus={() => setShowSousDropdown(true)} />
                {showSousDropdown && (
                  <div className="client-list-container">
                    {sousLocations.filter(sl => sl.name.toLowerCase().includes(sousLocationSearch.toLowerCase())).map(sl => (
                      <div key={sl.id} className="client-list-item" onClick={() => { setSelectedSousLocationId(sl.id); setSousLocationSearch(sl.name); setShowSousDropdown(false); }}>
                        <span>{sl.name}</span><span className="client-phone">{sl.status}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedSousLocationId && <div className="dash-selected-hint">✅ Sous-location sélectionnée</div>}
              </div>

              <div className="dash-field" style={{ gridColumn: '1 / -1' }}>
                <label className="dash-toggle">
                  <input type="checkbox" checked={canExtendDays} onChange={(e) => setCanExtendDays(e.target.checked)} />
                  <span>Activer la prolongation</span>
                </label>
                {canExtendDays && (
                  <div className="dash-inline-row">
                    <span className="dash-label-inline">Jours à ajouter :</span>
                    <input type="number" min="1" className="dash-input" style={{ width: '120px' }} value={prolongationDays} onChange={(e) => setProlongationDays(parseInt(e.target.value, 10) || 1)} />
                    <span className="dash-hint-inline">jour(s)</span>
                  </div>
                )}
              </div>

              <div className="dash-field" style={{ gridColumn: '1 / -1' }}>
                <label className="dash-label">Notes</label>
                <textarea className="dash-input dash-textarea" rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="dash-footer">
            <button type="button" className="dash-btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="dash-btn-primary" disabled={submitting}>
              {submitting ? <Loader size={16} className="spinning" /> : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// ==================== MultiRowReportModal (full-screen) ====================
const MultiRowReportModal = ({ isOpen, onClose, onReportSaved }) => {
  const dispatch = useDispatch();
  const clients = useSelector(selectClients);
  const reservations = useSelector(selectReservations);

  const getClientRemaining = (clientId) => {
    if (!clientId) return 0;
    const allowedStatuses = ['completed', 'confirmed', 'retard'];
    return reservations
      .filter(r => r.client_id === clientId && allowedStatuses.includes(r.status))
      .reduce((sum, r) => sum + (parseFloat(r.remaining_amount) || 0), 0);
  };

  const [rows, setRows] = useState([
    { id: Date.now(), date: new Date().toISOString().slice(0, 10), client_id: "", client_name: "", price: 0 },
  ]);
  const [generating, setGenerating] = useState(false);
  const [numberOfLines, setNumberOfLines] = useState(1);
  const paperRef = useRef(null);
  const pdfPaperRef = useRef(null);

  const [searchValues, setSearchValues] = useState({});
  const [activeRowId, setActiveRowId] = useState(null);
  const [dropdownPositions, setDropdownPositions] = useState({});

  const getFilteredClients = (searchTerm) => {
    if (!searchTerm || searchTerm.length < 1) return [];
    const lower = searchTerm.toLowerCase().trim();
    return clients.filter(c => {
      const fullName = `${c.prenom} ${c.nom}`.toLowerCase();
      const email = (c.email || "").toLowerCase();
      const phone = (c.telephone || "").toLowerCase();
      return fullName.includes(lower) || email.includes(lower) || phone.includes(lower);
    }).slice(0, 10);
  };

  const addRow = () => {
    setRows([...rows, { id: Date.now(), date: new Date().toISOString().slice(0, 10), client_id: "", client_name: "", price: 0 }]);
  };

  const createMultipleRows = () => {
    const num = parseInt(numberOfLines);
    if (isNaN(num) || num <= 0) { toast.warning("Entrez un nombre valide (1 ou plus)"); return; }
    const newRows = [];
    for (let i = 0; i < num; i++) {
      newRows.push({ id: Date.now() + i, date: new Date().toISOString().slice(0, 10), client_id: "", client_name: "", price: 0 });
    }
    setRows(prev => [...prev, ...newRows]);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
      setSearchValues(prev => { const n = { ...prev }; delete n[id]; return n; });
      setDropdownPositions(prev => { const n = { ...prev }; delete n[id]; return n; });
      if (activeRowId === id) setActiveRowId(null);
    }
  };

  const resetForm = () => {
    setRows([{ id: Date.now(), date: new Date().toISOString().slice(0, 10), client_id: "", client_name: "", price: 0 }]);
    setNumberOfLines(1);
    setSearchValues({});
    setDropdownPositions({});
    setActiveRowId(null);
  };

  const handleSelectClient = (rowId, client) => {
    updateRow(rowId, 'client_id', client.id);
    updateRow(rowId, 'client_name', `${client.prenom} ${client.nom}`);
    setSearchValues(prev => ({ ...prev, [rowId]: `${client.prenom} ${client.nom}` }));
    setActiveRowId(null);
    setDropdownPositions(prev => { const n = { ...prev }; delete n[rowId]; return n; });
  };

  const updateDropdownPosition = (rowId, inputElement) => {
    if (!inputElement) return;
    const rect = inputElement.getBoundingClientRect();
    setDropdownPositions(prev => ({
      ...prev,
      [rowId]: {
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      }
    }));
  };

  const generatePDF = async () => {
    const updatedRows = rows.map(row => {
      if (!row.client_id && row.client_name) {
        const trimmed = row.client_name.trim();
        const found = clients.find(c => `${c.prenom} ${c.nom}`.toLowerCase() === trimmed.toLowerCase());
        if (found) return { ...row, client_id: found.id };
      }
      return row;
    });
    setRows(updatedRows);

    const validRows = updatedRows.filter(row => row.client_id && parseFloat(row.price) > 0);
    if (validRows.length === 0) {
      toast.warning("Veuillez sélectionner un client existant (utilisez la recherche) et saisir un prix supérieur à 0.");
      return;
    }
    for (const row of validRows) {
      const totalRemaining = getClientRemaining(row.client_id);
      if (row.price > totalRemaining) {
        const clientName = row.client_name || `Client ${row.client_id}`;
        toast.error(`❌ Le montant (${row.price} DH) pour ${clientName} dépasse le solde restant (${totalRemaining} DH).`);
        setGenerating(false);
        return;
      }
    }
    setGenerating(true);

    try {
      const paperElement = pdfPaperRef.current;
      if (!paperElement) { toast.error("Impossible de capturer le rapport"); return; }

      const canvas = await html2canvas(paperElement, {
        scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

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

      const fileName = `Rapport_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.pdf`;
      const pdfBlob = doc.output('blob');
      const pdfBase64 = await blobToBase64(pdfBlob);

      const token = localStorage.getItem("authToken");
      const saveReportResponse = await fetch(`${API_URL}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          file_name: fileName,
          pdf_data: pdfBase64,
          rows: validRows.map(r => ({ date: r.date, client_name: r.client_name, client_id: r.client_id, price: r.price })),
          total_ht: validRows.reduce((sum, row) => sum + Number(row.price), 0),
        }),
      });

      if (!saveReportResponse.ok) {
        const err = await saveReportResponse.json();
        toast.error(err.message || "Erreur lors de la sauvegarde du rapport");
        return;
      }

      let paymentErrors = 0;
      for (const row of validRows) {
        try {
          const priorityOrder = ['completed', 'retard', 'confirmed'];
          const clientReservations = reservations.filter(r =>
            r.client_id === row.client_id &&
            priorityOrder.includes(r.status)
          );
          const sortedReservations = clientReservations
            .filter(r => r.remaining_amount > 0)
            .sort((a, b) => {
              const ia = priorityOrder.indexOf(a.status);
              const ib = priorityOrder.indexOf(b.status);
              if (ia !== ib) return ia - ib;
              return new Date(a.start_date) - new Date(b.start_date);
            });

          let remainingAmount = row.price;
          for (const res of sortedReservations) {
            if (remainingAmount <= 0) break;
            const amountToPay = Math.min(remainingAmount, res.remaining_amount);
            if (amountToPay > 0) {
              await dispatch(addPaymentToReservation({
                reservationId: res.id,
                paymentData: { amount: amountToPay, date: row.date, method: 'cash', notes: `Rapport manuel (${fileName})` }
              })).unwrap();
              remainingAmount -= amountToPay;
            }
          }
        } catch (err) {
          console.error(`Échec de l'ajout de paiement pour ${row.client_name} :`, err);
          paymentErrors++;
        }
      }

      const now = new Date().toISOString();
      for (const row of validRows) {
        const date = new Date(row.date + 'T00:00:00Z');
        const storageKey = `report_last_sync_${row.client_id}_${date.getUTCFullYear()}_${date.getUTCMonth()}`;
        localStorage.setItem(storageKey, now);
      }

      if (paymentErrors > 0) {
        toast.warning(`Rapport sauvegardé, mais ${paymentErrors} paiement(s) n'ont pas pu être appliqués.`);
      } else {
        toast.success("Rapport sauvegardé et paiements enregistrés avec succès");
      }

      resetForm();
      onClose();
      if (onReportSaved) onReportSaved();

    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  const firstClientName = rows.find(r => r.client_id)?.client_name || "";

  const renderReportPaper = (withRemoveColumn) => (
    <div className="report-paper">
      <div className="contract-header-table" style={{ width: "100%", borderBottom: "2px solid #d4af37", paddingBottom: "8px", marginBottom: "12px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "30%", verticalAlign: "top" }}>
                <div className="company-name" style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "2px", color: "#1e293b" }}>OULFA DRIVE</div>
                <div className="company-slogan" style={{ fontSize: "10px", fontWeight: 600, marginTop: "4px", color: "#b8860b" }}>LOCATION DE VOITURE</div>
                <div className="company-phone" style={{ fontSize: "9px", marginTop: "6px", color: "#475569" }}>📞 0665 921 921</div>
              </td>
              <td style={{ width: "40%", textAlign: "center", verticalAlign: "middle" }}>
                <img src={logoImage} alt="Logo" style={{ height: "70px", width: "auto", objectFit: "contain" }} onError={(e) => e.target.style.display = "none"} />
              </td>
              <td style={{ width: "30%", textAlign: "right", verticalAlign: "top" }}>
                <div className="contract-number-box" style={{ border: "1px solid #e2e8f0", padding: "6px 14px", textAlign: "center", fontSize: "10px", display: "inline-block", background: "#fefce857", borderRadius: "10px" }}>
                  <div className="contract-number-label" style={{ fontSize: "9px", color: "#92400e", letterSpacing: "1.5px" }}>RAPPORT</div>
                  <div className="contract-number-value" style={{ fontSize: "18px", fontWeight: 800, color: "#1a1a2e" }}>
                    {firstClientName ? `${new Date().getFullYear()}-${firstClientName.slice(0, 4)}` : `${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`}
                  </div>
                </div>
                <div className="arabic-text" style={{ marginTop: "8px", fontSize: "12px", fontWeight: 500, color: "#475569" }}>تقرير</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="contract-title-print" style={{ textAlign: "center", fontSize: "17px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "3px", marginBottom: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", color: "#0f172a" }}>
        RAPPORT MANUEL
      </div>

      <div className="report-table-container">
        <table className="report-table">
          <thead>
            <tr>
              <th style={{ width: withRemoveColumn ? "20%" : "25%" }}>Date</th>
              <th style={{ width: withRemoveColumn ? "45%" : "45%" }}>Client</th>
              <th style={{ width: withRemoveColumn ? "25%" : "30%" }}>Prix HT (MAD)</th>
              {withRemoveColumn && <th style={{ width: "10%" }}></th>}
            </tr>
          </thead>
          <tbody>
            {withRemoveColumn ? (
              rows.map((row) => {
                const searchTerm = searchValues[row.id] || "";
                const filteredClients = getFilteredClients(searchTerm);
                const isActive = activeRowId === row.id;
                const dropdownPos = dropdownPositions[row.id];
                return (
                  <tr key={row.id}>
                    <td>
                      <input type="date" className="report-input" value={row.date} onChange={(e) => updateRow(row.id, "date", e.target.value)} />
                    </td>
                    <td style={{ position: "relative" }}>
                      <input
                        type="text"
                        className="report-input"
                        value={searchTerm}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSearchValues(prev => ({ ...prev, [row.id]: val }));
                          setActiveRowId(row.id);
                          if (val === "") {
                            updateRow(row.id, "client_id", "");
                            updateRow(row.id, "client_name", "");
                          }
                          updateDropdownPosition(row.id, e.target);
                        }}
                        onFocus={(e) => { setActiveRowId(row.id); updateDropdownPosition(row.id, e.target); }}
                        onBlur={() => setTimeout(() => setActiveRowId(null), 200)}
                        onKeyDown={(e) => { if (e.key === "Escape") { setActiveRowId(null); e.target.blur(); } }}
                        placeholder="Rechercher un client..."
                        autoComplete="off"
                      />
                      {isActive && searchTerm.length >= 1 && dropdownPos && createPortal(
                        <div className="client-dropdown-fixed" style={{
                          position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width,
                          background: "white", border: "1px solid #e2e8f0", borderRadius: "8px",
                          maxHeight: "200px", overflowY: "auto", zIndex: 10001,
                          boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                        }}>
                          {filteredClients.length === 0 ? (
                            <div style={{ padding: "8px", color: "#94a3b8" }}>Aucun client trouvé</div>
                          ) : (
                            filteredClients.map(client => (
                              <div key={client.id}
                                style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleSelectClient(row.id, client)}
                              >
                                <span>{client.prenom} {client.nom}</span>
                                <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{client.telephone}</span>
                              </div>
                            ))
                          )}
                        </div>,
                        document.body
                      )}
                    </td>
                    <td>
                      <input type="number" step="0.01" className="report-input" value={row.price || ""}
                        onChange={(e) => updateRow(row.id, "price", parseFloat(e.target.value) || 0)}
                        placeholder="0.00" style={{ textAlign: "right" }} />
                    </td>
                    <td>
                      <button onClick={() => removeRow(row.id)} disabled={rows.length === 1} style={{ color: "#ef4444" }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              rows.filter(r => r.client_id && r.price > 0).map((row) => (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td>{row.client_name}</td>
                  <td style={{ textAlign: "right" }}>{Number(row.price).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.filter(r => r.price > 0).length > 0 && (
        <div className="report-summary">
          <div className="report-summary-label">Total HT</div>
          <div className="report-summary-value">{formatMoney(rows.filter(r => r.price > 0).reduce((sum, r) => sum + Number(r.price), 0))}</div>
        </div>
      )}

      <div className="report-paper-footer">
        <span>OULFA DRIVE — Document généré informatiquement.</span>
      </div>
    </div>
  );

  return createPortal(
    <div className="dash-full-overlay" role="dialog" aria-modal="true">
      <div className="dash-modal-card">
        <header className="dash-header">
          <div className="dash-header-icon"><FileText size={28} /></div>
          <div className="dash-header-title">
            <h2>Rapport manuel</h2>
            <p>Créez un rapport avec plusieurs lignes et enregistrez les paiements</p>
          </div>
          <button type="button" className="dash-header-close" onClick={onClose} aria-label="Fermer">
            <X size={24} />
          </button>
        </header>

        <div className="dash-body">
          <div className="report-controls">
            <span>📝 Nombre de lignes :</span>
            <input type="number" min="1" max="50" value={numberOfLines} onChange={(e) => setNumberOfLines(e.target.value)} />
            <button onClick={createMultipleRows} className="dash-btn-primary">
              <Zap size={14} /> Créer {numberOfLines} ligne{parseInt(numberOfLines) > 1 ? "s" : ""}
            </button>
            <button onClick={addRow} className="dash-btn-ghost">
              <Plus size={14} /> Ajouter 1 ligne
            </button>
            <span className="report-line-count">📋 {rows.length} ligne(s)</span>
          </div>

          <div className="report-paper" ref={paperRef}>
            {renderReportPaper(true)}
          </div>

          <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '794px', zIndex: -1, background: 'white' }} ref={pdfPaperRef}>
            {renderReportPaper(false)}
          </div>
        </div>

        <div className="dash-footer">
          <button onClick={onClose} className="dash-btn-secondary" disabled={generating}>Annuler</button>
          <button onClick={generatePDF} className="dash-btn-primary" disabled={generating}>
            {generating ? <Loader size={16} className="spinning" /> : <Printer size={16} />}
            {generating ? "Génération..." : "Générer PDF"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ==================== EditReportModal (full-screen) ====================
const EditReportModal = ({ isOpen, onClose, report, onReportSaved, reservations }) => {
  const dispatch = useDispatch();
  const store = useStore();
  const clients = useSelector(selectClients);
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [numberOfLines, setNumberOfLines] = useState(1);
  const paperRef = useRef(null);
  const pdfPaperRef = useRef(null);
  const [searchTerms, setSearchTerms] = useState({});
  const [activeRowId, setActiveRowId] = useState(null);

  useEffect(() => {
    if (report && report.rows) {
      const parsed = typeof report.rows === "string" ? JSON.parse(report.rows) : report.rows;
      const newRows = parsed.map((row) => ({
        id: Date.now() + Math.random(),
        date: row.date || new Date().toISOString().slice(0, 10),
        client_id: row.client_id || "",
        client_name: row.client_name || row.nom || "",
        price: row.price || 0,
        isOriginal: true,
      }));
      setRows(newRows);
      const initialSearchTerms = {};
      newRows.forEach((row) => { initialSearchTerms[row.id] = row.client_name; });
      setSearchTerms(initialSearchTerms);
    } else {
      setRows([]);
      setSearchTerms({});
    }
  }, [report]);

  const handleSelectClient = (rowId, client) => {
    const fullName = `${client.prenom} ${client.nom}`;
    setRows((prevRows) => prevRows.map((row) => row.id === rowId ? { ...row, client_id: client.id, client_name: fullName } : row));
    setSearchTerms((prev) => ({ ...prev, [rowId]: fullName }));
    setActiveRowId(null);
  };

  const getFilteredClients = (searchTerm) => {
    if (!searchTerm || searchTerm.length < 1) return [];
    const lower = searchTerm.toLowerCase().trim();
    return clients.filter(c => {
      const fullName = `${c.prenom} ${c.nom}`.toLowerCase();
      const email = (c.email || "").toLowerCase();
      const phone = (c.telephone || "").toLowerCase();
      return fullName.includes(lower) || email.includes(lower) || phone.includes(lower);
    }).slice(0, 10);
  };

  const addRow = () => {
    setRows([...rows, { id: Date.now(), date: new Date().toISOString().slice(0, 10), client_id: "", client_name: "", price: 0, isOriginal: false }]);
  };

  const createMultipleRows = () => {
    const num = parseInt(numberOfLines);
    if (isNaN(num) || num <= 0) { toast.warning("Entrez un nombre valide"); return; }
    const newRows = [];
    for (let i = 0; i < num; i++) {
      newRows.push({ id: Date.now() + i, date: new Date().toISOString().slice(0, 10), client_id: "", client_name: "", price: 0 });
    }
    setRows([...rows, ...newRows]);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id));
      setSearchTerms(prev => { const n = { ...prev }; delete n[id]; return n; });
      if (activeRowId === id) setActiveRowId(null);
    }
  };

  const calculateTotal = () => rows.reduce((sum, row) => sum + Number(row.price), 0);

  const handleSave = async () => {
    const updatedRows = rows.map(row => {
      if (!row.client_id && row.client_name) {
        const trimmed = row.client_name.trim();
        const found = clients.find(c => `${c.prenom} ${c.nom}`.toLowerCase() === trimmed.toLowerCase());
        if (found) return { ...row, client_id: found.id };
      }
      return row;
    });
    setRows(updatedRows);

    const validRows = updatedRows.filter((row) => row.client_id && parseFloat(row.price) > 0);
    if (validRows.length === 0) { toast.warning("Ajoutez au moins une ligne valide"); return; }

    setSaving(true);
    let unallocatedCount = 0;

    try {
      const reportFileName = report.file_name;

      let oldRows = [];
      if (report.rows) {
        try { oldRows = typeof report.rows === 'string' ? JSON.parse(report.rows) : report.rows; } catch { oldRows = []; }
      }
      if (!Array.isArray(oldRows)) oldRows = [];

      const oldTotals = {};
      oldRows.forEach(row => {
        const clientId = row.client_id;
        if (!clientId) return;
        oldTotals[clientId] = (oldTotals[clientId] || 0) + Number(row.price);
      });

      const newTotals = {};
      validRows.forEach(row => {
        const clientId = row.client_id;
        if (!clientId) return;
        newTotals[clientId] = (newTotals[clientId] || 0) + Number(row.price);
      });

      const freshReservations = store.getState().reservations.list || [];
      const remainingMap = {};
      freshReservations.forEach(r => { remainingMap[r.id] = r.remaining_amount || 0; });

      const priorityOrder = ['completed', 'retard', 'confirmed'];

      for (const clientId of Object.keys(newTotals)) {
        const oldTotal = oldTotals[clientId] || 0;
        const newTotal = newTotals[clientId];
        const diff = newTotal - oldTotal;

        if (Math.abs(diff) < 0.01) continue;

        const clientReservations = freshReservations.filter(r =>
          r.client_id == clientId &&
          priorityOrder.includes(r.status)
        );

        if (diff > 0) {
          let amountToAdd = diff;
          const sortedPositive = clientReservations
            .filter(r => (remainingMap[r.id] || 0) > 0)
            .sort((a, b) => {
              const ia = priorityOrder.indexOf(a.status);
              const ib = priorityOrder.indexOf(b.status);
              if (ia !== ib) return ia - ib;
              return new Date(a.start_date) - new Date(b.start_date);
            });

          for (const res of sortedPositive) {
            if (amountToAdd <= 0) break;
            const available = remainingMap[res.id] || 0;
            const amountToPay = Math.min(amountToAdd, available);
            if (amountToPay > 0) {
              await dispatch(addPaymentToReservation({
                reservationId: res.id,
                paymentData: { amount: amountToPay, date: new Date().toISOString().slice(0, 10), method: 'cash', notes: `Rapport modifié (${reportFileName})` }
              })).unwrap();
              remainingMap[res.id] -= amountToPay;
              amountToAdd -= amountToPay;
            }
          }

          if (amountToAdd > 0) {
            const sortedAll = clientReservations.sort((a, b) => {
              const ia = priorityOrder.indexOf(a.status);
              const ib = priorityOrder.indexOf(b.status);
              if (ia !== ib) return ia - ib;
              return new Date(a.start_date) - new Date(b.start_date);
            });
            if (sortedAll.length > 0) {
              const topRes = sortedAll[0];
              await dispatch(addPaymentToReservation({
                reservationId: topRes.id,
                paymentData: { amount: amountToAdd, date: new Date().toISOString().slice(0, 10), method: 'cash', notes: `Rapport modifié (${reportFileName})` }
              })).unwrap();
              remainingMap[topRes.id] -= amountToAdd;
              amountToAdd = 0;
            } else {
              unallocatedCount += amountToAdd;
            }
          }
        }

        if (diff < 0) {
          const amountToRemove = -diff;
          let removed = 0;
          const paymentsToConsider = [];
          for (const res of clientReservations) {
            if (res.payment_history && Array.isArray(res.payment_history)) {
              res.payment_history.forEach(p => {
                if (p.notes && p.notes.includes(reportFileName)) {
                  paymentsToConsider.push({ ...p, reservationId: res.id });
                }
              });
            }
          }
          paymentsToConsider.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));

          for (const payment of paymentsToConsider) {
            if (removed >= amountToRemove) break;
            const remainingToRemove = amountToRemove - removed;
            const amountToDelete = Math.min(payment.amount, remainingToRemove);
            if (amountToDelete > 0) {
              await dispatch(removePaymentFromReservation({
                reservationId: payment.reservationId,
                paymentId: payment.id
              })).unwrap();
              removed += payment.amount;
            }
          }

          if (removed < amountToRemove) {
            unallocatedCount += (amountToRemove - removed);
          }
        }
      }

      const paperElement = pdfPaperRef.current;
      if (!paperElement) { toast.error("Impossible de capturer le rapport"); return; }

      const canvas = await html2canvas(paperElement, {
        scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

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

      const fileName = report.file_name || `Rapport_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.pdf`;
      const pdfBlob = doc.output('blob');
      const pdfBase64 = await blobToBase64(pdfBlob);

      const token = localStorage.getItem("authToken");
      const newTotal = validRows.reduce((sum, row) => sum + Number(row.price), 0);
      const response = await fetch(`${API_URL}/reports/${report.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          file_name: fileName,
          pdf_data: pdfBase64,
          rows: validRows.map(r => ({ date: r.date, client_name: r.client_name, client_id: r.client_id, price: r.price })),
          total_ht: newTotal,
        }),
      });

      if (!response.ok) { toast.error("Erreur lors de la modification"); return; }

      const now = new Date().toISOString();
      for (const row of validRows) {
        const date = new Date(row.date + 'T00:00:00Z');
        const storageKey = `report_last_sync_${row.client_id}_${date.getUTCFullYear()}_${date.getUTCMonth()}`;
        localStorage.setItem(storageKey, now);
      }

      if (unallocatedCount > 0) {
        toast.warning(`Rapport modifié, mais ${unallocatedCount} DH non affectés.`);
      } else {
        toast.success("Rapport modifié avec succès");
      }

      onClose();
      if (onReportSaved) onReportSaved();

    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la modification du rapport");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !report) return null;

  const renderReportPaper = (withInputs) => (
    <div className="report-paper">
      <div className="contract-header-table" style={{ width: "100%", borderBottom: "2px solid #d4af37", paddingBottom: "8px", marginBottom: "12px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "30%", verticalAlign: "top" }}>
                <div className="company-name" style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "2px", color: "#1e293b" }}>OULFA DRIVE</div>
                <div className="company-slogan" style={{ fontSize: "10px", fontWeight: 600, marginTop: "4px", color: "#b8860b" }}>LOCATION DE VOITURE</div>
                <div className="company-phone" style={{ fontSize: "9px", marginTop: "6px", color: "#475569" }}>📞 0665 921 921</div>
              </td>
              <td style={{ width: "40%", textAlign: "center", verticalAlign: "middle" }}>
                <img src={logoImage} alt="Logo" style={{ height: "70px", width: "auto", objectFit: "contain" }} onError={(e) => e.target.style.display = "none"} />
              </td>
              <td style={{ width: "30%", textAlign: "right", verticalAlign: "top" }}>
                <div className="contract-number-box" style={{ border: "1px solid #e2e8f0", padding: "6px 14px", textAlign: "center", fontSize: "10px", display: "inline-block", background: "#fefce857", borderRadius: "10px" }}>
                  <div className="contract-number-label" style={{ fontSize: "9px", color: "#92400e", letterSpacing: "1.5px" }}>RAPPORT</div>
                  <div className="contract-number-value" style={{ fontSize: "18px", fontWeight: 800, color: "#1a1a2e" }}>
                    {new Date().getFullYear()}-{Math.floor(Math.random() * 10000).toString().padStart(4, "0")}
                  </div>
                </div>
                <div className="arabic-text" style={{ marginTop: "8px", fontSize: "12px", fontWeight: 500, color: "#475569" }}>تقرير</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="contract-title-print" style={{ textAlign: "center", fontSize: "17px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "3px", marginBottom: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", color: "#0f172a" }}>
        MODIFIER LE RAPPORT
      </div>

      <div className="report-table-container">
        <table className="report-table">
          <thead>
            <tr>
              <th style={{ width: withInputs ? "20%" : "25%" }}>Date</th>
              <th style={{ width: "45%" }}>Client</th>
              <th style={{ width: withInputs ? "25%" : "30%" }}>Prix HT (MAD)</th>
              {withInputs && <th style={{ width: "10%" }}></th>}
            </tr>
          </thead>
          <tbody>
            {withInputs ? (
              rows.map((row) => {
                const searchTerm = searchTerms[row.id] || "";
                const filteredClients = getFilteredClients(searchTerm);
                const isActive = activeRowId === row.id;

                return (
                  <tr key={row.id}>
                    <td>
                      <input type="date" className="report-input" value={row.date}
                        onChange={(e) => updateRow(row.id, "date", e.target.value)}
                        disabled={row.isOriginal}
                        style={row.isOriginal ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}} />
                    </td>
                    <td style={{ position: "relative" }}>
                      <input type="text" className="report-input"
                        value={searchTerms[row.id] ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSearchTerms((prev) => ({ ...prev, [row.id]: val }));
                          setRows((prevRows) => prevRows.map((r) => r.id === row.id ? { ...r, client_name: val, client_id: val === "" ? "" : r.client_id } : r));
                          setActiveRowId(row.id);
                        }}
                        disabled={row.isOriginal}
                        style={row.isOriginal ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                        onFocus={() => setActiveRowId(row.id)}
                        placeholder="Rechercher un client..."
                        autoComplete="off" />
                      {isActive && searchTerm.length >= 1 && (
                        <div className="client-dropdown" style={{
                          position: "absolute", bottom: "100%", left: 0, right: 0,
                          background: "white", border: "1px solid #e2e8f0", borderRadius: "8px",
                          maxHeight: "200px", overflowY: "auto", zIndex: 1000,
                          boxShadow: "0 8px 16px rgba(0,0,0,0.1)", marginBottom: "4px"
                        }}>
                          {filteredClients.length === 0 ? (
                            <div style={{ padding: "8px", color: "#94a3b8" }}>Aucun client trouvé</div>
                          ) : (
                            filteredClients.map(client => (
                              <div key={client.id}
                                style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleSelectClient(row.id, client)}>
                                <span>{client.prenom} {client.nom}</span>
                                <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{client.telephone}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <input type="number" step="0.01" className="report-input"
                        value={row.price || ""}
                        onChange={(e) => updateRow(row.id, "price", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        style={{ textAlign: "right", ...(row.isOriginal ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}) }}
                        disabled={row.isOriginal} />
                    </td>
                    <td>
                      <button onClick={() => removeRow(row.id)} disabled={rows.length === 1} style={{ color: "#ef4444" }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              rows.filter(r => r.client_id && r.price > 0).map((row) => (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td>{row.client_name}</td>
                  <td style={{ textAlign: "right" }}>{Number(row.price).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.filter((r) => r.price > 0).length > 0 && (
        <div className="report-summary">
          <div className="report-summary-label">Total HT</div>
          <div className="report-summary-value">{formatMoney(calculateTotal())}</div>
        </div>
      )}

      <div className="report-paper-footer">
        <span>OULFA DRIVE — Document généré informatiquement.</span>
      </div>
    </div>
  );

  return createPortal(
    <div className="dash-full-overlay" role="dialog" aria-modal="true">
      <div className="dash-modal-card">
        <header className="dash-header">
          <div className="dash-header-icon"><Edit size={28} /></div>
          <div className="dash-header-title">
            <h2>Modifier le rapport</h2>
            <p>{report.file_name}</p>
          </div>
          <button type="button" className="dash-header-close" onClick={onClose} aria-label="Fermer">
            <X size={24} />
          </button>
        </header>

        <div className="dash-body">
          <div className="report-controls">
            <span>📝 Nombre de lignes :</span>
            <input type="number" min="1" max="50" value={numberOfLines} onChange={(e) => setNumberOfLines(e.target.value)} />
            <button onClick={createMultipleRows} className="dash-btn-primary">
              <Zap size={14} /> Créer {numberOfLines} ligne{parseInt(numberOfLines) > 1 ? "s" : ""}
            </button>
            <button onClick={addRow} className="dash-btn-ghost">
              <Plus size={14} /> Ajouter 1 ligne
            </button>
            <span className="report-line-count">📋 {rows.length} ligne(s)</span>
          </div>

          <div className="report-paper" ref={paperRef}>
            {renderReportPaper(true)}
          </div>

          <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '794px', zIndex: -1, background: 'white' }} ref={pdfPaperRef}>
            {renderReportPaper(false)}
          </div>
        </div>

        <div className="dash-footer">
          <button onClick={onClose} className="dash-btn-secondary" disabled={saving}>Annuler</button>
          <button onClick={handleSave} className="dash-btn-primary" disabled={saving}>
            {saving ? <Loader size={16} className="spinning" /> : <Save size={16} />}
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ==================== SavedReportsSection ====================
const SavedReportsSection = ({ onEditReport, refreshTrigger }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, reportId: null, reportName: "" });
  const [deleting, setDeleting] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/reports`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports, refreshTrigger]);

  const totalPages = Math.ceil(reports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReports = reports.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleDelete = async () => {
    const { reportId } = deleteModal;
    if (!reportId) return;
    setDeleting(reportId);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/reports/${reportId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Rapport supprimé");
        loadReports();
      } else {
        toast.error("Erreur de suppression");
      }
    } catch (err) {
      toast.error("Erreur");
    } finally {
      setDeleting(null);
      setDeleteModal({ isOpen: false, reportId: null, reportName: "" });
    }
  };

  const downloadReport = async (report, e) => {
    e.stopPropagation();
    try {
      const rows = report.rows || [];
      const total = Number(report.total_ht) || 0;

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      let logoDataUrl = '';
      try {
        const response = await fetch(logoImage);
        const blob = await response.blob();
        logoDataUrl = await blobToBase64(blob);
      } catch (e) { console.warn('Logo non chargé', e); }

      const margin = 14;
      let y = 20;

      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', margin, y - 5, 30, 20);
      }
      doc.setFontSize(22);
      doc.setTextColor(26, 26, 46);
      doc.text('Rapport', pageWidth / 2, y + 10, { align: 'center' });

      y += 15;
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, y, { align: 'center' });
      y += 8;

      const tableHeaders = [['Date', 'Client', 'Prix HT (MAD)']];
      const tableRows = rows.map(row => [
        row.date || '',
        row.client_name || '',
        row.price ? Number(row.price).toFixed(2) : '0.00'
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: y + 5,
        theme: 'grid',
        headStyles: { fillColor: [234, 179, 8], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 10 },
        bodyStyles: { halign: 'center', fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 60 }, 2: { cellWidth: 30 } },
        margin: { left: (pageWidth - (pageWidth * 0.8)) / 2, right: (pageWidth - (pageWidth * 0.8)) / 2 },
        tableWidth: 'auto',
      });

      const finalY = doc.lastAutoTable.finalY + 8;
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total HT: ${total.toFixed(2)} DH`, pageWidth / 2, finalY, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('OULFA DRIVE — Document généré informatiquement.', pageWidth / 2, pageHeight - 10, { align: 'center' });

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = report.file_name || `Rapport_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("PDF téléchargé");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du téléchargement");
    }
  };

  if (loading) {
    return <div style={{ padding: "1rem", textAlign: "center" }}>Chargement des rapports...</div>;
  }

  return (
    <div className="saved-reports-section">
      <div className="section-title">
        <FolderOpen size={18} /> Rapports sauvegardés
        <span style={{ marginLeft: "auto", fontSize: "0.7rem", background: "#e2e8f0", padding: "0.25rem 0.5rem", borderRadius: "1rem" }}>
          {reports.length}
        </span>
      </div>
      {reports.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
          <FileText size={32} />
          <p>Aucun rapport sauvegardé</p>
        </div>
      ) : (
        <>
          <div className="saved-reports-grid">
            {currentReports.map((report) => (
              <div key={report.id} className="saved-report-card">
                <div className="saved-report-title">
                  <span>
                    <FileText size={14} />{" "}
                    {report.file_name.length > 30 ? report.file_name.slice(0, 27) + "..." : report.file_name}
                  </span>
                  <div>
                    <button className="action-btn edit" onClick={() => onEditReport(report)}>
                      <Edit size={14} />
                    </button>
                    <button className="action-btn" onClick={(e) => downloadReport(report, e)}>
                      <Download size={14} />
                    </button>
                    <button className="action-btn"
                      onClick={(e) => setDeleteModal({ isOpen: true, reportId: report.id, reportName: report.file_name })}
                      style={{ color: "#ef4444" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: "0.7rem", color: "#475569" }}>
                  <div>Total HT: <strong>{formatMoney(report.total_ht || 0)}</strong></div>
                  <div>{report.rows?.length || 0} ligne(s)</div>
                </div>
                <div className="saved-report-meta">
                  <span><Calendar size={10} /> {new Date(report.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0", flexWrap: "wrap" }}>
              <button className="btn btn-outline" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} style={{ padding: "0.25rem 0.75rem" }}>
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} className={`btn ${page === currentPage ? "btn-primary" : "btn-outline"}`} onClick={() => handlePageChange(page)} style={{ padding: "0.25rem 0.75rem", minWidth: "2rem", fontWeight: page === currentPage ? "bold" : "normal" }}>
                  {page}
                </button>
              ))}
              <button className="btn btn-outline" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} style={{ padding: "0.25rem 0.75rem" }}>
                <ChevronRight size={16} />
              </button>
              <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "0.5rem" }}>
                Page {currentPage} sur {totalPages}
              </span>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation — polished confirmation style */}
      {deleteModal.isOpen && createPortal(
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <div className="confirmation-header">
              <div className="confirmation-icon delete">
                <Trash2 size={32} />
              </div>
              <h3 className="confirmation-title">Confirmer la suppression</h3>
            </div>
            <div className="confirmation-body">
              <p className="confirmation-message">
                Êtes-vous sûr de vouloir supprimer le rapport<br />
                <span className="dash-name-chip">"{deleteModal.reportName}"</span> ?<br />
                Cette action est irréversible.
              </p>
            </div>
            <div className="confirmation-actions">
              <button className="btn-confirm-cancel" onClick={() => setDeleteModal({ isOpen: false, reportId: null, reportName: "" })}>
                Annuler
              </button>
              <button className="btn-confirm-delete" onClick={handleDelete} disabled={deleting === deleteModal.reportId}>
                {deleting === deleteModal.reportId ? <Loader size={16} className="spinning" /> : <><Trash2 size={16} /> Supprimer</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ==================== Main AdminDashboard ====================
const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { section } = useParams();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const myPermissions = useSelector((state) => state.permissions?.myPermissions || []);

  const cars = useSelector(selectCars);
  const reservations = useSelector(selectReservations);
  const clients = useSelector(selectClients);
  const accidents = useSelector(selectAccidents);
  const contacts = useSelector(selectContacts);
  const utilisateurs = useSelector(selectUtilisateurs);
  const matricules = useSelector(selectMatricules);
  const carsLoading = useSelector(selectCarsLoading);
  const reservationsLoading = useSelector(selectReservationsLoading);

  const activeTab = section || 'dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    Fullname: '', email: '', current_password: '', new_password: '', new_password_confirmation: '',
  });
  const profileMenuRef = useRef(null);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [editReport, setEditReport] = useState(null);
  const [refreshReports, setRefreshReports] = useState(0);

  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const [expandedCategories, setExpandedCategories] = useState({
    disponibles: true, enAttente: false, retourImminent: false, enRetard: false, enPanne: false,
  });
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [selectedMatriculeForReserve, setSelectedMatriculeForReserve] = useState(null);
  const [confirmDirectModalOpen, setConfirmDirectModalOpen] = useState(false);
  const [selectedMatriculeForDirectConfirm, setSelectedMatriculeForDirectConfirm] = useState(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeReservationId, setCompleteReservationId] = useState(null);
  const [kilometrageRetour, setKilometrageRetour] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [completing, setCompleting] = useState(false);
  const [originalRentalDays, setOriginalRentalDays] = useState(null);
  const [prolongationModal, setProlongationModal] = useState({ isOpen: false, reservation: null, days: 1 });

  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin'); return; }
    dispatch(fetchCars());
    dispatch(fetchReservations());
    dispatch(fetchClients());
    dispatch(fetchAccidents());
    dispatch(fetchContacts());
    dispatch(fetchUtilisateurs());
    dispatch(fetchMatricules());
    dispatch(fetchMyPermissions());
  }, [dispatch, isAuthenticated, navigate]);

  useEffect(() => {
    const contentArea = document.querySelector(".content-area");
    if (contentArea) contentArea.scrollTop = 0;
    document.querySelector(".main-content")?.scrollTo({ top: 0, behavior: "instant" });
    window.scrollTo({ top: 0, behavior: "instant" });
    document.querySelector(".sidebar-mobile")?.scrollTo({ top: 0, behavior: "instant" });
  }, [activeTab]);

  // ✅ FIX: close every AdminDashboard-owned modal whenever the active tab changes.
  // This prevents a portal overlay from staying on screen after navigating away.
  useEffect(() => {
    setProfileMenuOpen(false);
    setShowProfileModal(false);
    setReportModalOpen(false);
    setEditReport(null);
    setReserveModalOpen(false);
    setSelectedMatriculeForReserve(null);
    setConfirmDirectModalOpen(false);
    setSelectedMatriculeForDirectConfirm(null);
    setCompleteModalOpen(false);
    setCompleteReservationId(null);
    setOriginalRentalDays(null);
    setKilometrageRetour('');
    setReturnDate('');
    setReturnTime('');
    setProlongationModal({ isOpen: false, reservation: null, days: 1 });
  }, [activeTab]);

  useEffect(() => {
    const OVERLAY_SELECTORS = [
      ".am-overlay", ".acc-fullscreen-overlay", ".acc-overlay",
      ".garage-overlay", ".sl-overlay", ".payment-fullscreen-overlay",
      ".perm-overlay", ".dash-full-overlay", ".full-overlay",
      ".details-modal-overlay", ".modal-overlay", ".confirmation-modal-overlay",
    ].join(",");

    const resetOverlayScroll = (node) => {
      if (!node || node.nodeType !== 1) return;
      if (node.matches?.(OVERLAY_SELECTORS)) {
        node.scrollTop = 0;
        node.querySelectorAll?.(OVERLAY_SELECTORS).forEach((el) => { el.scrollTop = 0; });
      }
      node.querySelectorAll?.(OVERLAY_SELECTORS).forEach((el) => { el.scrollTop = 0; });
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => { m.addedNodes.forEach(resetOverlayScroll); });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isTabAccessible = (tabId) => {
    if (!tabId) return false;
    const role = user?.role?.toLowerCase() || 'employee';
    const allowedRoles = getRolesForPage(tabId);
    if (!allowedRoles || allowedRoles.length === 0) {
      return role === 'superadmin';
    }
    return hasAccess(role, allowedRoles, myPermissions, tabId);
  };

  const canViewReports = useMemo(() => {
    const role = user?.role?.toLowerCase() || 'employee';
    const allowedRoles = getRolesForPage('reports');
    return hasAccess(role, allowedRoles, myPermissions, 'reports');
  }, [user?.role, myPermissions]);

  const handleLogout = async () => {
    try { await dispatch(logoutUtilisateur()).unwrap(); navigate('/admin'); } catch (e) { console.error(e); }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getRoleLabel = (role) => {
    const labels = { superadmin: 'Super Admin', admin: 'Administrateur', employee: 'Employé', employe: 'Employé' };
    return labels[(role || '').toLowerCase()] || role || 'Utilisateur';
  };

  const openProfileModal = () => {
    setProfileForm({
      Fullname: user?.Fullname || user?.full_name || user?.name || '',
      email: user?.email || '',
      current_password: '',
      new_password: '',
      new_password_confirmation: '',
    });
    setProfileMenuOpen(false);
    setShowProfileModal(true);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!profileForm.Fullname.trim()) {
      toast.error('Le nom complet est obligatoire');
      return;
    }

    if (profileForm.new_password || profileForm.new_password_confirmation) {
      if (profileForm.new_password !== profileForm.new_password_confirmation) {
        toast.error('Les mots de passe ne correspondent pas');
        return;
      }
      if (profileForm.new_password.length < 6) {
        toast.error('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
    }

    setUpdatingProfile(true);
    try {
      const data = { Fullname: profileForm.Fullname.trim() };
      if (profileForm.email.trim()) data.email = profileForm.email.trim();
      if (profileForm.new_password) {
        data.password = profileForm.new_password;
        data.password_confirmation = profileForm.new_password_confirmation;
        data.current_password = profileForm.current_password;
      }

      await dispatch(updateUtilisateur({ id: user.id, data })).unwrap();
      toast.success('Profil mis à jour avec succès');
      setShowProfileModal(false);
      dispatch(fetchUtilisateurs(true));
    } catch (err) {
      toast.error(err?.message || err || 'Erreur lors de la mise à jour');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const setActiveTab = (tabId) => {
    if (!isTabAccessible(tabId)) {
      toast.error("Accès refusé pour cette section.");
      return;
    }
    if (tabId === 'dashboard') navigate('/admin/dashboard');
    else navigate(`/admin/${tabId}`);
  };

  const totalCars = cars.length;
  const disponibles = cars.filter(c => c.status === 'disponible').length;
  const indisponibles = cars.filter(c => c.status === 'non disponible').length;
  const totalReservations = reservations.length;
  const confirmedReservations = reservations.filter(r => r.status === 'confirmed').length;
  const completedReservations = reservations.filter(r => r.status === 'completed').length;
  const pendingReservations = reservations.filter(r => r.status === 'pending').length;
  const cancelledReservations = reservations.filter(r => r.status === 'cancelled').length;
  const retards = reservations.filter(r => r.status === 'retard').length;
  const revenue = reservations.filter(r => r.status === 'confirmed' || r.status === 'completed')
    .reduce((sum, r) => sum + (r.total_price || 0), 0);
  const totalClients = clients.length;
  const totalAccidents = accidents.length;
  const totalContacts = contacts.length;
  const activeUsers = utilisateurs.filter(u => u.status === 'active').length;

  const statusData = useMemo(() => {
    const map = { pending: { label: 'En attente', value: pendingReservations }, confirmed: { label: 'Confirmée', value: confirmedReservations }, completed: { label: 'Terminée', value: completedReservations }, cancelled: { label: 'Annulée', value: cancelledReservations }, retard: { label: 'En retard', value: retards } };
    return Object.keys(map).filter(k => map[k].value > 0).map(k => ({ name: map[k].label, value: map[k].value }));
  }, [pendingReservations, confirmedReservations, completedReservations, cancelledReservations, retards]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.toLocaleDateString('fr-FR', { month: 'short' }), year: d.getFullYear(), monthIndex: d.getMonth() });
    }
    return months.map(m => {
      const count = reservations.filter(r => { const d = new Date(r.start_date); return d.getMonth() === m.monthIndex && d.getFullYear() === m.year; }).length;
      const rev = reservations.filter(r => { const d = new Date(r.start_date); return d.getMonth() === m.monthIndex && d.getFullYear() === m.year && (r.status === 'confirmed' || r.status === 'completed'); }).reduce((s, r) => s + (r.total_price || 0), 0);
      return { month: m.month, reservations: count, revenue: rev };
    });
  }, [reservations]);

  const topCars = useMemo(() => {
    const map = {};
    reservations.forEach(r => {
      const name = r.cars?.brand && r.cars?.model ? `${r.cars.brand} ${r.cars.model}` : r.car_name || 'Voiture';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [reservations]);

  const recentReservations = useMemo(() => {
    return [...reservations].sort((a, b) => new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date)).slice(0, 6);
  }, [reservations]);

  const toggleCategory = (cat) => setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));

  const handleReserveClick = (mat) => { setSelectedMatriculeForReserve(mat); setReserveModalOpen(true); };
  const handleDirectConfirm = (mat) => { setSelectedMatriculeForDirectConfirm(mat); setConfirmDirectModalOpen(true); };

  const handleConfirmReservation = async (data) => {
    try { await dispatch(createReservation(data)).unwrap(); toast.success('Réservation créée'); dispatch(refreshMatricules()); dispatch(fetchReservations(true)); setReserveModalOpen(false); } catch (e) { toast.error('Erreur création'); }
  };

  const handleDirectConfirmReservation = async (data) => {
    try {
      const result = await dispatch(createReservation(data)).unwrap();
      toast.success('Réservation confirmée');
      dispatch(refreshMatricules());
      dispatch(fetchReservations(true));
      setConfirmDirectModalOpen(false);
      navigate('/admin/reservations', { state: { contractReservation: result.reservation || result } });
    } catch (e) { toast.error('Erreur'); }
  };

  const handleConfirmPending = async (reservation) => {
    try {
      const result = await dispatch(updateReservation({ id: reservation.id, data: { status: 'confirmed' } })).unwrap();
      toast.success(`Réservation #${reservation.id} confirmée`);
      dispatch(refreshMatricules());
      dispatch(fetchReservations(true));
      navigate('/admin/reservations', { state: { contractReservation: result.reservation || result } });
    } catch (error) {
      toast.error('Erreur lors de la confirmation');
      console.error(error);
    }
  };

  const handleCancelPending = async (res) => {
    try { await dispatch(updateReservation({ id: res.id, data: { status: 'cancelled' } })).unwrap(); toast.success(`Réservation #${res.id} annulée`); dispatch(refreshMatricules()); dispatch(fetchReservations(true)); } catch (e) { toast.error('Erreur'); }
  };

  const handleComplete = (res) => {
    setCompleteReservationId(res.id);
    setOriginalRentalDays(res.rental_days);
    const km = res.kilometrage_entree || res.matricule?.kilometrage || '';
    setKilometrageRetour(km);
    const now = new Date();
    setReturnDate(now.toISOString().split('T')[0]);
    setReturnTime(now.toTimeString().slice(0, 5));
    setCompleteModalOpen(true);
  };

  const confirmComplete = async () => {
    if (!kilometrageRetour || isNaN(kilometrageRetour) || parseFloat(kilometrageRetour) < 0) {
      toast.error("Veuillez entrer un kilométrage retour valide.");
      return;
    }
    setCompleting(true);
    try {
      await dispatch(updateReservation({
        id: completeReservationId,
        data: { status: 'completed', end_date: returnDate, end_time: returnTime, kilometrage_entree: parseFloat(kilometrageRetour), rental_days: originalRentalDays }
      })).unwrap();
      toast.success("Réservation terminée");
      dispatch(refreshMatricules());
      dispatch(fetchReservations(true));
    } catch (e) { toast.error(e.message || "Erreur"); } finally { setCompleting(false); setCompleteModalOpen(false); setCompleteReservationId(null); setOriginalRentalDays(null); setKilometrageRetour(''); setReturnDate(''); setReturnTime(''); }
  };

  const handleToggleExtend = (res) => {
    setProlongationModal({ isOpen: true, reservation: res, days: 1 });
  };

  const confirmProlongation = async () => {
    const { reservation, days } = prolongationModal;
    if (!reservation || days < 1) { toast.error('Nombre de jours invalide'); return; }
    try {
      await dispatch(updateReservation({ id: reservation.id, data: { can_extend_days: true, prolongation_days: days } })).unwrap();
      toast.success(`Prolongation de ${days} jour(s) ajoutée.`);
      dispatch(refreshMatricules());
      dispatch(fetchReservations(true));
      setProlongationModal({ isOpen: false, reservation: null, days: 1 });
    } catch (e) { toast.error(e.message || 'Erreur'); }
  };

  const activeReservationIds = reservations.filter(r => ['pending', 'confirmed', 'retard'].includes(r.status)).map(r => r.matricule_id).filter(Boolean);
  const openAccidentIds = accidents.filter(a => a.status !== 'closed').map(a => a.matricule_id).filter(Boolean);

  const disponiblesMat = Array.isArray(matricules) ? matricules.filter(m => m.status === 'active' && !activeReservationIds.includes(m.id) && !openAccidentIds.includes(m.id)) : [];
  const pendingIds = reservations.filter(r => r.status === 'pending').map(r => r.matricule_id).filter(Boolean);
  const enAttenteMat = Array.isArray(matricules) ? matricules.filter(m => pendingIds.includes(m.id)) : [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const threeDaysLater = new Date(today); threeDaysLater.setDate(today.getDate() + 3);
  const retourImminentIds = reservations.filter(r => {
    if (r.status !== 'confirmed') return false;
    const end = new Date(r.end_date); end.setHours(0, 0, 0, 0);
    return end >= today && end <= threeDaysLater;
  }).map(r => r.matricule_id).filter(Boolean);
  const retourImminentMat = Array.isArray(matricules) ? matricules.filter(m => retourImminentIds.includes(m.id)) : [];
  const retardIds = reservations.filter(r => r.status === 'retard').map(r => r.matricule_id).filter(Boolean);
  const enRetardMat = Array.isArray(matricules) ? matricules.filter(m => retardIds.includes(m.id)) : [];
  const enPanneMat = Array.isArray(matricules) ? matricules.filter(m => openAccidentIds.includes(m.id)) : [];

  const enrich = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map(m => {
      const res = reservations.find(r => r.matricule_id === m.id && ['confirmed', 'retard', 'pending'].includes(r.status));
      return { ...m, currentReservation: res || null };
    });
  };

  const disponiblesWithRes = enrich(disponiblesMat);
  const enAttenteWithRes = enrich(enAttenteMat);
  const retourImminentWithRes = enrich(retourImminentMat);
  const enRetardWithRes = enrich(enRetardMat);
  const enPanneWithRes = enrich(enPanneMat);

  const renderDashboardContent = () => {
    const monthOptions = [
      { value: 'all', label: 'Tous' },
      ...['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'].map(m => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) }))
    ];
    const currentYear = new Date().getFullYear();
    const yearOptions = [{ value: 'all', label: 'Tous' }, ...Array.from({ length: 11 }, (_, i) => ({ value: String(currentYear - 5 + i), label: String(currentYear - 5 + i) }))];
    const periodOptions = [
      { value: 'all', label: 'Tous les jours' },
      { value: 'today', label: "Aujourd'hui" },
      { value: 'week', label: 'Cette semaine' },
      { value: 'month', label: 'Ce mois' },
    ];

    return (
      <div className="dashboard-content-wrapper">
        <div className="filter-toolbar">
          <div className="filter-nav">
            <button className="filter-nav-btn"><ChevronLeft size={18} /></button>
            <button className="filter-nav-btn"><ChevronRight size={18} /></button>
          </div>
          <div className="filter-main">
            <Calendar size={16} className="calendar-icon" />
            <FilterDropdown options={monthOptions} value={selectedMonth} onChange={setSelectedMonth} label="Mois" />
            <FilterDropdown options={yearOptions} value={selectedYear} onChange={setSelectedYear} label="Année" />
            <FilterDropdown options={periodOptions} value={selectedPeriod} onChange={setSelectedPeriod} label="Période" />
          </div>
          <div style={{ width: '2.2rem' }}></div>
        </div>

        <div className="stats-grid">
          <StatCard icon={Car} title="Parc total" value={totalCars} subtitle={`${disponibles} disponibles`} color="blue" onClick={() => setActiveTab('cars')} />
          <StatCard icon={CheckCircle} title="Disponibles" value={disponibles} subtitle={`${indisponibles} indisponibles`} color="emerald" onClick={() => setActiveTab('cars')} />
          <StatCard icon={CalendarCheck} title="Réservations" value={totalReservations} subtitle={`${confirmedReservations} confirmées`} color="amber" onClick={() => setActiveTab('reservations')} />
          <StatCard icon={DollarSign} title="Revenu (confirmé)" value={`${revenue.toLocaleString()} DH`} subtitle="Locations actives + terminées" color="yellow" />
          <StatCard icon={Users} title="Clients" value={totalClients} subtitle="Base de données" color="indigo" onClick={() => setActiveTab('clients')} />
          <StatCard icon={AlertTriangle} title="Accidents" value={totalAccidents} subtitle="Sinistres" color="red" onClick={() => setActiveTab('accidents')} />
          <StatCard icon={MessageCircle} title="Messages" value={totalContacts} subtitle="Nouvelles demandes" color="pink" onClick={() => setActiveTab('contacts')} />
          <StatCard icon={UserCheck} title="Utilisateurs actifs" value={activeUsers} subtitle="Personnel" color="cyan" onClick={() => setActiveTab('users')} />
        </div>

        <div className="matricule-section">
          <div className="section-header">
            <h3><Gauge size={18} style={{ marginRight: '0.5rem' }} /> Gestion des Immatriculations</h3>
            <button className="refresh-btn" onClick={() => { dispatch(fetchMatricules()); toast.info('Actualisation des matricules...'); }} title="Actualiser la liste">
              <RefreshCw size={18} />
            </button>
          </div>
          <div className="matricule-cards-grid">
            <MatriculeCategoryCard
              title="Disponibles" icon={CheckCircle} color="blue"
              matricules={disponiblesWithRes} onReserve={handleReserveClick} onConfirmDirect={handleDirectConfirm}
              expanded={expandedCategories.disponibles} onToggleExpand={() => toggleCategory('disponibles')} badge={disponiblesWithRes.length}
            />
            <MatriculeCategoryCard
              title="En attente de confirmation" icon={Clock} color="yellow"
              matricules={enAttenteWithRes} onConfirm={handleConfirmPending} onCancel={handleCancelPending}
              expanded={expandedCategories.enAttente} onToggleExpand={() => toggleCategory('enAttente')} badge={enAttenteWithRes.length}
            />
            <MatriculeCategoryCard
              title="Retour imminent" icon={CalendarClock} color="green"
              matricules={retourImminentWithRes} onComplete={handleComplete} onToggleExtend={handleToggleExtend}
              expanded={expandedCategories.retourImminent} onToggleExpand={() => toggleCategory('retourImminent')} badge={retourImminentWithRes.length}
            />
            <MatriculeCategoryCard
              title="En retard" icon={AlarmClock} color="red"
              matricules={enRetardWithRes} onComplete={handleComplete}
              expanded={expandedCategories.enRetard} onToggleExpand={() => toggleCategory('enRetard')} badge={enRetardWithRes.length}
            />
            <MatriculeCategoryCard
              title="En panne (Accident)" icon={Wrench} color="purple"
              matricules={enPanneWithRes}
              expanded={expandedCategories.enPanne} onToggleExpand={() => toggleCategory('enPanne')} badge={enPanneWithRes.length}
            />
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-card chart-card-wide">
            <h3 className="chart-title">Tendance mensuelle</h3>
            <p className="chart-subtitle">Réservations et revenus des 6 derniers mois</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                  <linearGradient id="resGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={12} />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Legend />
                <Area yAxisId="right" type="monotone" dataKey="revenue" name="Revenu (DH)" stroke="#f59e0b" fill="url(#revGrad)" strokeWidth={2} />
                <Area yAxisId="left" type="monotone" dataKey="reservations" name="Réservations" stroke="#3b82f6" fill="url(#resGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <h3 className="chart-title">Répartition des statuts</h3>
            <p className="chart-subtitle">Distribution des réservations</p>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statusData.map((_, idx) => <Cell key={`cell-${idx}`} fill={['#eab308', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'][idx % 5]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: 11, marginTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-card chart-card-wide">
            <h3 className="chart-title">Top véhicules</h3>
            <p className="chart-subtitle">Les voitures les plus réservées</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topCars} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={100} />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Bar dataKey="count" name="Nombre de réservations" fill="#f59e0b" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <h3 className="chart-title">Résumé rapide</h3>
            <p className="chart-subtitle">Indicateurs clés</p>
            <div style={{ padding: '0.5rem 0' }}>
              <div className="summary-row"><span>Taux d'occupation</span><span className="summary-value">{totalCars ? Math.round((confirmedReservations / totalCars) * 100) : 0}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${totalCars ? (confirmedReservations / totalCars) * 100 : 0}%` }} /></div>
              <div className="summary-row"><span>Taux de conversion</span><span className="summary-value">{totalReservations ? Math.round(((confirmedReservations + completedReservations) / totalReservations) * 100) : 0}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${totalReservations ? ((confirmedReservations + completedReservations) / totalReservations) * 100 : 0}%`, background: '#3b82f6' }} /></div>
              <div className="summary-row"><span>Revenu moyen / réservation</span><span className="summary-value">{confirmedReservations + completedReservations ? Math.round(revenue / (confirmedReservations + completedReservations)).toLocaleString() : 0} DH</span></div>
            </div>
          </div>
        </div>

        <div className="recent-card">
          <h3 className="recent-title">Réservations récentes</h3>
          <p className="recent-subtitle">Les 6 dernières réservations enregistrées</p>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Client</th><th>Véhicule</th><th>Période</th><th>Total</th><th>Statut</th></tr></thead>
              <tbody>
                {recentReservations.map(r => {
                  const map = { pending: { label: 'En attente', class: 'badge-pending' }, confirmed: { label: 'Confirmée', class: 'badge-confirmed' }, completed: { label: 'Terminée', class: 'badge-completed' }, cancelled: { label: 'Annulée', class: 'badge-cancelled' }, retard: { label: 'En retard', class: 'badge-retard' } };
                  const s = map[r.status] || { label: r.status, class: '' };
                  return (
                    <tr key={r.id}>
                      <td className="client-name">{r.client?.prenom} {r.client?.nom}</td>
                      <td>{r.cars?.brand} {r.cars?.model}</td>
                      <td>{r.start_date} → {r.end_date}</td>
                      <td>{r.total_price} DH</td>
                      <td><span className={`badge ${s.class}`}>{s.label}</span></td>
                    </tr>
                  );
                })}
                {recentReservations.length === 0 && <tr><td colSpan="5" className="text-center">Aucune réservation récente</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {canViewReports && (
          <SavedReportsSection
            onEditReport={(report) => setEditReport(report)}
            refreshTrigger={refreshReports}
          />
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (!isTabAccessible(activeTab)) {
      return (
        <div className="access-denied">
          <div className="access-denied-icon">🔒</div>
          <h3>Accès Restreint</h3>
          <p>Vous n'avez pas la permission d'accéder à la section <strong>{activeTab}</strong>.</p>
          <button className="back-to-dashboard-btn" onClick={() => setActiveTab('dashboard')}>Retour au Tableau de Bord</button>
        </div>
      );
    }
    switch (activeTab) {
      case 'dashboard': return renderDashboardContent();
      case 'users': return <UsersManagement />;
      case 'cars': return <CarsManagement />;
      case 'clients': return <ClientsManagement />;
      case 'reservations': return <ReservationsManagement />;
      case 'reservation-status': return <ReservationStatusManagement />;
      case 'contacts': return <ContactsManagement />;
      case 'accidents': return <AccidentsManagement />;
      case 'matricules': return <MatriculesManagement />;
      case 'credit': return <CreditManagement />;
      case 'sous-locations': return <SousLocationsManagement />;
      case 'garages': return <GaragesManagement />;
      case 'payments': return <PaymentsManagement />;
      default: return <div>Section inconnue</div>;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="admin-dashboard scaled-80">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
      />
      <div className="main-content">
        <div className="top-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <h2 className="header-title">
            {activeTab === 'dashboard' && 'Tableau de Bord'}
            {activeTab === 'users' && 'Gestion des Utilisateurs'}
            {activeTab === 'cars' && 'Gestion des Véhicules'}
            {activeTab === 'clients' && 'Gestion des Clients'}
            {activeTab === 'reservations' && 'Gestion des Réservations'}
            {activeTab === 'contacts' && 'Messages de Contact'}
            {activeTab === 'accidents' && "Rapports d'Accidents"}
            {activeTab === 'matricules' && 'Gestion des Immatriculations'}
            {activeTab === 'credit' && 'Gestion du Crédit'}
            {activeTab === 'sous-locations' && 'Sous-locations'}
            {activeTab === 'garages' && 'Garages'}
            {activeTab === 'payments' && 'Financements'}
          </h2>
          <div className="header-actions">
            {activeTab === 'dashboard' && canViewReports && (
              <button
                className="contract-manual-btn"
                onClick={() => setReportModalOpen(true)}
                title="Créer un rapport manuel"
              >
                <FileText size={16} /> Rapport manuel
              </button>
            )}

            <div className="profile-dropdown-wrapper" ref={profileMenuRef}>
              <button
                type="button"
                className={`profile-trigger ${profileMenuOpen ? 'open' : ''}`}
                onClick={() => setProfileMenuOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={profileMenuOpen}
              >
                <div className="profile-avatar">{getInitials(user?.Fullname || user?.full_name)}</div>
                <div className="profile-info">
                  <span className="profile-name">
                    {user?.Fullname || user?.full_name || 'Utilisateur'}
                  </span>
                  <span className="profile-role">{getRoleLabel(user?.role)}</span>
                </div>
                <ChevronDown size={16} className={`profile-chevron ${profileMenuOpen ? 'open' : ''}`} />
              </button>

              {profileMenuOpen && (
                <div className="profile-dropdown-menu">
                  <div className="profile-dropdown-header">
                    <div className="profile-avatar-large">
                      {getInitials(user?.Fullname || user?.full_name)}
                    </div>
                    <div className="profile-dropdown-header-text">
                      <div className="profile-dropdown-name">
                        {user?.Fullname || user?.full_name || 'Utilisateur'}
                      </div>
                      <div className="profile-dropdown-role">{getRoleLabel(user?.role)}</div>
                      {user?.email && (
                        <div className="profile-dropdown-email">{user.email}</div>
                      )}
                    </div>
                  </div>

                  <div className="profile-dropdown-divider" />

                  <button type="button" className="profile-dropdown-item" onClick={openProfileModal}>
                    <UserCircle size={16} />
                    <span>Mon profil</span>
                  </button>

                  <button type="button" className="profile-dropdown-item" onClick={openProfileModal}>
                    <Edit size={16} />
                    <span>Modifier mes informations</span>
                  </button>

                  <button
                    type="button"
                    className="profile-dropdown-item"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setActiveTab('dashboard');
                    }}
                  >
                    <LayoutDashboard size={16} />
                    <span>Tableau de bord</span>
                  </button>

                  <div className="profile-dropdown-divider" />

                  <button type="button" className="profile-dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="content-area">
          {renderContent()}
        </div>
      </div>

      {/* ===== MODALS ===== */}
      <ReserveModal
        isOpen={reserveModalOpen}
        onClose={() => setReserveModalOpen(false)}
        matricule={selectedMatriculeForReserve}
        clients={clients}
        cars={cars}
        onConfirm={handleConfirmReservation}
      />
      <DirectConfirmModal
        isOpen={confirmDirectModalOpen}
        onClose={() => setConfirmDirectModalOpen(false)}
        matricule={selectedMatriculeForDirectConfirm}
        clients={clients}
        cars={cars}
        onConfirm={handleDirectConfirmReservation}
      />

      {/* Complete reservation modal (full-screen AdminModal-style) */}
      {completeModalOpen && createPortal(
        <div className="dash-full-overlay" role="dialog" aria-modal="true">
          <div className="dash-modal-card" style={{ maxWidth: '720px' }}>
            <header className="dash-header">
              <div className="dash-header-icon"><CheckCircle size={28} /></div>
              <div className="dash-header-title">
                <h2>Terminer la réservation</h2>
                <p>Confirmez le retour du véhicule</p>
              </div>
              <button type="button" className="dash-header-close" onClick={() => { setCompleteModalOpen(false); setOriginalRentalDays(null); }} aria-label="Fermer">
                <X size={24} />
              </button>
            </header>

            <div className="dash-body">
              <div className="dash-grid-2">
                <div className="dash-field">
                  <label className="dash-label">Date de retour</label>
                  <input type="date" className="dash-input" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                </div>
                <div className="dash-field">
                  <label className="dash-label">Heure de retour</label>
                  <input type="time" className="dash-input" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} />
                </div>
                <div className="dash-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="dash-label dash-required">Kilométrage retour</label>
                  <input type="number" className="dash-input" value={kilometrageRetour} onChange={(e) => setKilometrageRetour(e.target.value)} placeholder="Ex: 12345" step="0.01" />
                </div>
              </div>
            </div>

            <div className="dash-footer">
              <button onClick={() => { setCompleteModalOpen(false); setOriginalRentalDays(null); }} className="dash-btn-secondary">Annuler</button>
              <button onClick={confirmComplete} className="dash-btn-primary" disabled={!kilometrageRetour || isNaN(kilometrageRetour) || parseFloat(kilometrageRetour) < 0 || completing}>
                {completing ? <Loader size={16} className="spinning" /> : <CheckCircle size={16} />}
                {completing ? "Traitement..." : "Terminer"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Prolongation modal (polished confirmation style) */}
      {prolongationModal.isOpen && createPortal(
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <div className="confirmation-header">
              <div className="confirmation-icon info">
                <CalendarPlus size={32} />
              </div>
              <h3 className="confirmation-title">Prolongation</h3>
              <p className="confirmation-subtitle">Combien de jours souhaitez-vous ajouter ?</p>
            </div>
            <div className="confirmation-body">
              <div className="dash-prompt-field">
                <label className="dash-prompt-label">Nombre de jours</label>
                <div className="dash-prompt-input-wrapper">
                  <input
                    type="number"
                    min="1"
                    className="dash-prompt-input"
                    value={prolongationModal.days}
                    onChange={(e) => setProlongationModal(prev => ({ ...prev, days: parseInt(e.target.value) || '' }))}
                  />
                  <span className="dash-prompt-unit">jour(s)</span>
                </div>
              </div>
            </div>
            <div className="confirmation-actions">
              <button onClick={() => setProlongationModal({ isOpen: false, reservation: null, days: 1 })} className="btn-confirm-cancel">Annuler</button>
              <button onClick={confirmProlongation} className="btn-confirm-primary">
                <CheckCircle size={16} /> Confirmer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* REPORT MODALS */}
      {canViewReports && (
        <>
          <MultiRowReportModal
            isOpen={reportModalOpen}
            onClose={() => setReportModalOpen(false)}
            onReportSaved={() => setRefreshReports(prev => prev + 1)}
          />
          <EditReportModal
            isOpen={!!editReport}
            onClose={() => setEditReport(null)}
            report={editReport}
            onReportSaved={() => { setRefreshReports(prev => prev + 1); setEditReport(null); }}
            reservations={reservations}
          />
        </>
      )}

      {/* PROFILE MODAL (full-screen AdminModal-style) */}
      {showProfileModal && createPortal(
        <div className="dash-full-overlay" role="dialog" aria-modal="true" onClick={() => !updatingProfile && setShowProfileModal(false)}>
          <div className="dash-modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <header className="dash-header">
              <div className="dash-header-icon"><UserCircle size={28} /></div>
              <div className="dash-header-title">
                <h2>Mon profil</h2>
                <p>Modifiez vos informations personnelles</p>
              </div>
              <button type="button" className="dash-header-close" onClick={() => !updatingProfile && setShowProfileModal(false)} aria-label="Fermer">
                <X size={24} />
              </button>
            </header>

            <form onSubmit={handleProfileSubmit} className="dash-form">
              <div className="dash-body">
                <div className="dash-avatar-section">
                  <div className="dash-avatar-xl">{getInitials(profileForm.Fullname || user?.Fullname)}</div>
                  <div>
                    <div className="dash-avatar-name">{profileForm.Fullname || user?.Fullname || 'Utilisateur'}</div>
                    <div className="dash-avatar-role">{getRoleLabel(user?.role)}</div>
                  </div>
                </div>

                <section className="dash-section">
                  <div className="dash-section-header">
                    <UserCircle size={16} />
                    <h3>Informations générales</h3>
                  </div>
                  <div className="dash-field" style={{ marginBottom: '12px' }}>
                    <label className="dash-label dash-required">Nom complet</label>
                    <input type="text" className="dash-input" value={profileForm.Fullname} onChange={(e) => setProfileForm((p) => ({ ...p, Fullname: e.target.value }))} required />
                  </div>
                </section>

                <section className="dash-section">
                  <div className="dash-section-header">
                    <Lock size={16} />
                    <h3>Sécurité (optionnel)</h3>
                  </div>
                  <p className="dash-hint">
                    Laissez les champs vides pour conserver votre mot de passe actuel.
                  </p>
                  <div className="dash-field" style={{ marginBottom: '12px' }}>
                    <label className="dash-label">Mot de passe actuel</label>
                    <input type="password" className="dash-input" value={profileForm.current_password} onChange={(e) => setProfileForm((p) => ({ ...p, current_password: e.target.value }))} autoComplete="current-password" />
                  </div>
                  <div className="dash-grid-2">
                    <div className="dash-field">
                      <label className="dash-label">Nouveau mot de passe</label>
                      <input type="password" className="dash-input" value={profileForm.new_password} onChange={(e) => setProfileForm((p) => ({ ...p, new_password: e.target.value }))} autoComplete="new-password" />
                    </div>
                    <div className="dash-field">
                      <label className="dash-label">Confirmer</label>
                      <input type="password" className="dash-input" value={profileForm.new_password_confirmation} onChange={(e) => setProfileForm((p) => ({ ...p, new_password_confirmation: e.target.value }))} autoComplete="new-password" />
                    </div>
                  </div>
                </section>
              </div>

              <div className="dash-footer">
                <button type="button" className="dash-btn-secondary" onClick={() => setShowProfileModal(false)} disabled={updatingProfile}>Annuler</button>
                <button type="submit" className="dash-btn-primary" disabled={updatingProfile}>
                  {updatingProfile ? (
                    <><Loader size={16} className="spinning" /> Enregistrement...</>
                  ) : (
                    <><Save size={16} /> Enregistrer</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ===== STYLES ===== */}
      <style>{`
        .dashboard-content-wrapper { padding: 0.5rem 0; }
        .filter-toolbar { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1rem; background: #f1f5f9; border-radius: 2rem; border: 1px solid #e2e8f0; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .filter-nav { display: flex; gap: 0.25rem; }
        .filter-nav-btn { width: 2.2rem; height: 2.2rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .filter-main { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .filter-dropdown-wrapper { position: relative; display: inline-block; }
        .filter-dropdown-trigger { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.75rem; background: white; border: 1px solid #e2e8f0; border-radius: 2rem; font-size: 0.8rem; font-weight: 500; color: #1e293b; cursor: pointer; height: 2.2rem; white-space: nowrap; }
        .filter-dropdown-trigger .chevron { transition: transform 0.2s; }
        .filter-dropdown-trigger .chevron.open { transform: rotate(90deg); }
        .filter-dropdown-menu { position: absolute; top: calc(100% + 0.5rem); left: 0; min-width: 140px; background: white; border-radius: 0.75rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; overflow: hidden; z-index: 1000; }
        .filter-dropdown-item { display: block; width: 100%; padding: 0.5rem 0.875rem; background: transparent; border: none; cursor: pointer; font-size: 0.8rem; color: #334155; text-align: left; }
        .filter-dropdown-item:hover { background: #f8fafc; }
        .filter-dropdown-item.active { background: #fef3c7; color: #d97706; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .stat-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1rem; transition: all 0.2s; position: relative; overflow: hidden; cursor: pointer; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -8px rgba(0,0,0,0.08); }
        .stat-icon { width: 2.8rem; height: 2.8rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; color: white; margin-bottom: 0.5rem; }
        .stat-icon-blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .stat-icon-emerald { background: linear-gradient(135deg, #10b981, #059669); }
        .stat-icon-amber { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .stat-icon-yellow { background: linear-gradient(135deg, #eab308, #ca8a04); }
        .stat-icon-indigo { background: linear-gradient(135deg, #6366f1, #4f46e5); }
        .stat-icon-red { background: linear-gradient(135deg, #ef4444, #dc2626); }
        .stat-icon-pink { background: linear-gradient(135deg, #ec4899, #db2777); }
        .stat-icon-cyan { background: linear-gradient(135deg, #06b6d4, #0891b2); }
        .stat-value { font-size: 1.6rem; font-weight: 700; color: #0f172a; }
        .stat-label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.1rem; }
        .stat-subtitle { font-size: 0.7rem; color: #94a3b8; margin-top: 0.2rem; }
        .charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
        .chart-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.25rem; }
        .chart-card-wide { grid-column: span 1; }
        .chart-title { font-size: 1rem; font-weight: 600; margin-bottom: 0.25rem; }
        .chart-subtitle { font-size: 0.75rem; color: #64748b; margin-bottom: 1rem; }
        .recent-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.25rem; margin-top: 1.5rem; }
        .recent-title { font-size: 1rem; font-weight: 600; margin-bottom: 0.25rem; }
        .recent-subtitle { font-size: 0.75rem; color: #64748b; margin-bottom: 1rem; }
        .table-wrapper { overflow-x: auto; }
        .table { width: 100%; font-size: 0.875rem; border-collapse: collapse; }
        .table th { text-align: left; padding: 0.75rem 0; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0; }
        .table td { padding: 0.75rem 0; border-bottom: 1px solid #e2e8f0; }
        .table tr:last-child td { border-bottom: none; }
        .client-name { font-weight: 600; }
        .badge { display: inline-flex; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; }
        .badge-pending { background: #fef3c7; color: #92400e; }
        .badge-confirmed { background: #d1fae5; color: #065f46; }
        .badge-completed { background: #dbeafe; color: #1e40af; }
        .badge-cancelled { background: #f1f5f9; color: #475569; }
        .badge-retard { background: #fee2e2; color: #991b1b; }
        .summary-row { display: flex; justify-content: space-between; margin: 0.75rem 0 0.25rem; font-size: 0.8rem; }
        .summary-value { font-weight: 600; color: #0f172a; }
        .progress-bar { height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem; }
        .progress-fill { height: 100%; background: #f59e0b; border-radius: 4px; }
        .text-center { text-align: center; padding: 1rem; color: #94a3b8; }

        .contract-manual-btn { background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #eab308; color: #eab308; border-radius: 2rem; padding: 0.5rem 1rem; display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 500; font-size: 0.75rem; transition: all 0.2s; }
        .contract-manual-btn:hover { background: linear-gradient(135deg, #334155, #1e293b); transform: translateY(-1px); }

        .matricule-section { margin: 2rem 0; padding: 1rem; background: #f8fafc; border-radius: 1.5rem; }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
        .section-header h3 { font-size: 1.2rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; }
        .refresh-btn { background: none; border: none; cursor: pointer; color: #475569; padding: 0.25rem; border-radius: 50%; transition: transform 0.3s; }
        .refresh-btn:hover { transform: rotate(180deg); background: #e2e8f0; }
        .matricule-cards-grid { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: flex-start; }
        .matricule-category-card { background: white; border-radius: 16px; border: 1px solid #e9edf2; overflow: hidden; flex: 1 1 300px; min-width: 280px; max-width: 100%; box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: all 0.2s; }
        .matricule-category-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .matricule-category-card .card-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; cursor: pointer; transition: background 0.15s; background: #fcfcfd; border-radius: 16px 16px 0 0; }
        .matricule-category-card .card-header:hover { background: #f1f5f9; }
        .matricule-category-card .card-title { display: flex; align-items: center; gap: 0.6rem; font-weight: 600; color: #1e293b; font-size: 0.9rem; }
        .matricule-category-card .card-badge { background: #eab308; color: white; font-size: 0.7rem; font-weight: 700; padding: 0.1rem 0.7rem; border-radius: 1rem; margin-left: 0.3rem; }
        .matricule-category-card .card-actions { display: flex; align-items: center; gap: 0.75rem; }
        .matricule-category-card .card-count { background: #e2e8f0; padding: 0.1rem 0.7rem; border-radius: 1rem; font-size: 0.8rem; font-weight: 600; color: #475569; }
        .matricule-category-card .card-dropdown { padding: 4px 16px 16px 16px; border-top: 1px solid #e9edf2; background: white; }
        .matricule-category-card .dropdown-search { display: flex; align-items: center; gap: 0.5rem; background: #f8fafc; border: 1px solid #e9edf2; border-radius: 2rem; padding: 0.25rem 0.75rem; margin-bottom: 1rem; }
        .matricule-category-card .dropdown-search input { flex: 1; border: none; outline: none; font-size: 0.8rem; padding: 0.4rem 0; background: transparent; color: #1e293b; min-width: 120px; }
        .matricule-category-card .dropdown-list { display: flex; flex-direction: column; gap: 0.5rem; max-height: 320px; overflow-y: auto; }
        .matricule-category-card .dropdown-item { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem; background: #f8fafc; border-radius: 10px; border: 1px solid #f1f5f9; flex-wrap: wrap; gap: 0.5rem; }
        .matricule-category-card .dropdown-item:hover { background: #f1f5f9; border-color: #e2e8f0; }
        .matricule-category-card .item-info { display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap; font-size: 0.8rem; }
        .matricule-category-card .item-code { font-weight: 700; color: #0f172a; font-family: monospace; background: #e9edf2; padding: 0.1rem 0.5rem; border-radius: 0.5rem; }
        .matricule-category-card .item-car { color: #475569; }
        .matricule-category-card .item-km { color: #64748b; font-size: 0.7rem; background: #e9edf2; padding: 0.1rem 0.4rem; border-radius: 0.5rem; }
        .matricule-category-card .item-client { background: #dbeafe; padding: 0.1rem 0.6rem; border-radius: 1rem; font-size: 0.65rem; color: #1d4ed8; display: inline-flex; align-items: center; gap: 0.25rem; }
        .matricule-category-card .item-end-date { font-size: 0.6rem; color: #3b82f6; margin-left: 0.25rem; font-weight: 500; }
        .matricule-category-card .item-actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .matricule-category-card .btn-reserve { background: #eab308; border: none; color: white; padding: 0.25rem 0.8rem; border-radius: 1.5rem; font-size: 0.65rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem; }
        .matricule-category-card .btn-reserve:hover { background: #ca8a04; }
        .matricule-category-card .btn-confirm { background: #22c55e; border: none; color: white; padding: 0.25rem 0.8rem; border-radius: 1.5rem; font-size: 0.65rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem; }
        .matricule-category-card .btn-confirm:hover { background: #16a34a; }
        .matricule-category-card .btn-cancel { background: #ef4444; border: none; color: white; padding: 0.25rem 0.8rem; border-radius: 1.5rem; font-size: 0.65rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem; }
        .matricule-category-card .btn-cancel:hover { background: #dc2626; }
        .matricule-category-card .btn-complete { background: #3b82f6; border: none; color: white; padding: 0.25rem 0.8rem; border-radius: 1.5rem; font-size: 0.65rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem; }
        .matricule-category-card .btn-complete:hover { background: #2563eb; }
        .matricule-category-card .btn-extend { background: #f59e0b; border: none; color: white; padding: 0.15rem 0.6rem; border-radius: 1rem; font-size: 0.6rem; font-weight: 600; cursor: pointer; white-space: nowrap; margin-left: 0.3rem; }
        .matricule-category-card .btn-extend:hover { background: #d97706; }
        .matricule-category-card .extend-badge { background: #15803d; color: white; padding: 0.1rem 0.6rem; border-radius: 1rem; font-size: 0.6rem; font-weight: 600; display: inline-block; margin-left: 0.3rem; }
        .matricule-category-card .dropdown-item.extendable { background-color: #fef3c7 !important; border-left: 4px solid #f59e0b; }
        .matricule-category-card .dropdown-item.extendable:hover { background-color: #fde68a !important; }
        .matricule-category-card .return-badge { background: #fef3c7; color: #92400e; padding: 0.15rem 0.6rem; border-radius: 1rem; font-size: 0.65rem; font-weight: 600; }
        .matricule-category-card .dropdown-footer { margin-top: 0.75rem; text-align: center; }
        .matricule-category-card .btn-show-more { background: transparent; border: none; color: #3b82f6; font-weight: 500; font-size: 0.8rem; cursor: pointer; padding: 0.3rem 1rem; border-radius: 1.5rem; }
        .matricule-category-card .btn-show-more:hover { background: #eff6ff; }
        .matricule-category-card .dropdown-empty { padding: 2rem; text-align: center; color: #94a3b8; font-style: italic; }
        .matricule-category-card.blue .card-header { border-left: 4px solid #3b82f6; }
        .matricule-category-card.yellow .card-header { border-left: 4px solid #eab308; }
        .matricule-category-card.green .card-header { border-left: 4px solid #22c55e; }
        .matricule-category-card.red .card-header { border-left: 4px solid #ef4444; }
        .matricule-category-card.purple .card-header { border-left: 4px solid #8b5cf6; }

        /* ====== shared form controls (used inside modals) ====== */
        .form-control { width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 0.875rem; font-family: inherit; transition: all 0.2s; background: #fff; box-sizing: border-box; }
        .form-control:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); }
        .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none; font-family: inherit; }
        .btn-outline { background: white; border: 1px solid #e2e8f0; color: #1e293b; }
        .btn-outline:hover { background: #f8fafc; border-color: #94a3b8; }
        .btn-primary { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; box-shadow: 0 2px 4px rgba(59,130,246,0.2); }
        .btn-primary:hover { background: linear-gradient(135deg, #2563eb, #1d4ed8); transform: translateY(-1px); box-shadow: 0 4px 8px rgba(59,130,246,0.3); }
        .spinning { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .client-list-container { max-height: 200px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 0.75rem; margin-top: 0.5rem; background: #fff; }
        .client-list-item { padding: 0.6rem 0.9rem; cursor: pointer; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; transition: background 0.15s; }
        .client-list-item:last-child { border-bottom: none; }
        .client-list-item:hover { background: #f8fafc; }
        .client-list-item.selected { background: #fef3c7; }
        .client-phone { font-size: 0.75rem; color: #64748b; }

        /* ====== Report Modal ====== */
        .report-controls { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 16px; }
        .report-controls input[type="number"] { width: 80px; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; }
        .report-line-count { margin-left: auto; font-size: 12px; color: #64748b; }
        .report-paper { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); font-size: 13px; color: #1a2c3e; }
        .report-table-container { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 0.75rem; margin-top: 1rem; }
        .report-table { width: 100%; border-collapse: collapse; font-size: 0.813rem; }
        .report-table th { background: #f1f5f9; padding: 0.75rem; text-align: left; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
        .report-table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #f1f5f9; }
        .report-input { width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; font-size: 0.813rem; transition: all 0.2s; }
        .report-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
        .report-summary { display: flex; justify-content: flex-end; align-items: baseline; gap: 16px; padding: 12px 16px; background: #f8fafc; border-radius: 8px; margin-top: 16px; }
        .report-summary-label { font-weight: 600; color: #475569; font-size: 14px; }
        .report-summary-value { font-size: 18px; font-weight: 700; color: #059669; }
        .report-paper-footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; }

        /* ====== Saved Reports ====== */
        .saved-reports-section { margin-top: 2rem; padding: 1.25rem; background: white; border-radius: 1.25rem; border: 1px solid #e2e8f0; }
        .saved-reports-section .section-title { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #eab308; }
        .saved-reports-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; margin-top: 1rem; }
        .saved-report-card { background: #f8fafc; border-radius: 1rem; padding: 1rem; border: 1px solid #e2e8f0; transition: all 0.2s; cursor: default; }
        .saved-report-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-color: #3b82f6; }
        .saved-report-title { font-weight: 700; color: #1e293b; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; }
        .saved-report-meta { font-size: 0.7rem; color: #64748b; display: flex; gap: 0.75rem; margin-top: 0.5rem; flex-wrap: wrap; }
        .action-btn { background: transparent; border: none; padding: 0.25rem; border-radius: 0.5rem; cursor: pointer; color: #64748b; transition: all 0.2s; }
        .action-btn:hover { background: #e2e8f0; }
        .action-btn.edit:hover { color: #8b5cf6; }

        /* ====================================================================
           Full-screen overlay (AdminModal-style) — shared by all dash modals
           ==================================================================== */
        @keyframes amSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .dash-full-overlay {
          position: fixed;
          top: 0; right: 0; bottom: 0; left: 0;
          background: #f8fafc;
          overflow-y: auto;
          overflow-x: hidden;
          z-index: 9999;
        }
        @media (min-width: 768px) {
          .dash-full-overlay { left: 18rem; }
        }

        .dash-modal-card {
  background: #fff;
  border-radius: 32px;
  margin: 1.5rem auto;      /* ← centers horizontally */
  width: 100%;              /* needed so max-width + auto margins center */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: amSlideIn 0.3s ease-out;
}

        .dash-header {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 24px 32px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .dash-header-icon {
          width: 56px; height: 56px; background: #fff;
          border-radius: 28px; display: flex; align-items: center;
          justify-content: center; color: #667eea; flex-shrink: 0;
        }
        .dash-header-title { flex: 1; min-width: 0; padding-right: 48px; }
        .dash-header-title h2 {
          color: #fff; font-size: 1.75rem; font-weight: 700;
          margin: 0; line-height: 1.2;
        }
        .dash-header-title p {
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.875rem; margin: 4px 0 0;
        }
        .dash-header-close {
          position: absolute; top: 24px; right: 28px;
          background: rgba(255, 255, 255, 0.15);
          border: none; border-radius: 40px;
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #fff; transition: all 0.2s;
        }
        .dash-header-close:hover { background: rgba(255, 255, 255, 0.25); transform: scale(1.05); }

        .dash-form { padding: 28px 32px; }
        .dash-body {
          padding: 28px 32px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .dash-form .dash-body { padding: 0; }

        .dash-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .dash-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .dash-label {
          font-size: 0.7rem; font-weight: 600; color: #475569;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .dash-required::after { content: " *"; color: #dc2626; }
        .dash-input {
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
        .dash-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .dash-input:disabled, .dash-input-readonly {
          background: #f1f5f9; color: #94a3b8; cursor: not-allowed;
        }
        .dash-textarea { resize: vertical; min-height: 80px; }
        .dash-hint { font-size: 0.72rem; color: #64748b; font-style: italic; margin: 0 0 8px; }
        .dash-selected-hint {
          margin-top: 0.5rem; font-size: 0.75rem; color: #16a34a;
          background: #f0fdf4; padding: 6px 12px; border-radius: 8px;
          border: 1px solid #bbf7d0;
        }
        .dash-toggle {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 0.85rem; font-weight: 500; color: #475569;
          cursor: pointer; user-select: none;
        }
        .dash-toggle input { cursor: pointer; accent-color: #667eea; }
        .dash-inline-row { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
        .dash-label-inline { font-size: 0.8rem; color: #475569; font-weight: 500; }
        .dash-hint-inline { font-size: 0.8rem; color: #64748b; }

        .dash-inline-create {
          background: #f8fafc; border: 1.5px solid #e2e8f0;
          border-radius: 12px; padding: 16px; margin-top: 12px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .dash-inline-actions { display: flex; justify-content: flex-end; gap: 10px; }

        .dash-avatar-section {
          display: flex; align-items: center; gap: 14px;
          padding: 14px; background: #f8fafc;
          border: 1px solid #e2e8f0; border-radius: 14px;
        }
        .dash-avatar-xl {
          width: 56px; height: 56px; border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff; display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 1.1rem; flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(102, 126, 234, 0.35);
        }
        .dash-avatar-name { font-weight: 700; color: #0f172a; font-size: 0.95rem; }
        .dash-avatar-role { font-size: 0.75rem; color: #667eea; font-weight: 600; margin-top: 2px; }

        .dash-section {
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 16px; padding: 20px;
        }
        .dash-section-header {
          display: flex; align-items: center; gap: 8px;
          padding-bottom: 12px; margin-bottom: 16px;
          border-bottom: 2px solid #667eea;
        }
        .dash-section-header h3 { font-size: 0.95rem; font-weight: 700; color: #1e293b; margin: 0; }

        .dash-footer {
          display: flex; justify-content: flex-end; gap: 16px;
          padding: 20px 32px; border-top: 1px solid #e2e8f0;
          background: #f8fafc; flex-wrap: wrap;
        }
        .dash-form .dash-footer {
          padding: 24px 32px; margin-top: 24px;
          background: #fff;
        }

        .dash-btn-primary, .dash-btn-secondary, .dash-btn-ghost {
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
        .dash-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none; padding: 12px 28px; color: #fff;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        .dash-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        .dash-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .dash-btn-secondary {
          background: #fff; border: 1.5px solid #e2e8f0;
          padding: 10px 24px; color: #475569;
        }
        .dash-btn-secondary:hover:not(:disabled) {
          border-color: #667eea; color: #667eea; background: #f8fafc;
        }
        .dash-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

        .dash-btn-ghost {
          background: transparent; border: 1.5px dashed #cbd5e1;
          padding: 10px 20px; color: #475569;
        }
        .dash-btn-ghost:hover:not(:disabled) {
          border-style: solid; border-color: #667eea;
          color: #667eea; background: #f5f3ff;
        }

        /* ====================================================================
           Confirmation modals (dark blur backdrop)
           ==================================================================== */
        .confirmation-modal-overlay {
          position: fixed;
          top: 0; right: 0; bottom: 0; left: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          z-index: 10001; padding: 1rem;
          overflow-y: auto; overflow-x: hidden;
          animation: fadeIn 0.2s ease;
        }
        .confirmation-modal {
          background: #fff; border-radius: 1.25rem;
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
        .confirmation-icon.info {
          background: rgba(102, 126, 234, 0.1); color: #667eea;
          border: 2px solid rgba(102, 126, 234, 0.2);
        }
        .confirmation-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
        .confirmation-subtitle { font-size: 0.8rem; color: #64748b; margin: 6px 0 0; }
        .confirmation-body { padding: 1.5rem 2rem; }
        .confirmation-message { color: #64748b; font-size: 1rem; line-height: 1.6; margin: 0; text-align: center; }
        .dash-name-chip {
          font-weight: 700; color: #0f172a;
          background: #f1f5f9; padding: 0.2rem 0.6rem;
          border-radius: 0.5rem; display: inline-block;
          margin: 0.35rem 0;
        }
        .confirmation-actions {
          padding: 1.5rem 2rem 2rem;
          display: flex; gap: 1rem; justify-content: flex-end;
        }
        .btn-confirm-cancel {
          padding: 0.75rem 1.5rem; border: 1px solid #cbd5e1;
          background: transparent; color: #64748b;
          border-radius: 0.75rem; font-size: 0.875rem; font-weight: 600;
          cursor: pointer; transition: all 0.3s ease; font-family: inherit;
        }
        .btn-confirm-cancel:hover { background: #f1f5f9; color: #334155; }
        .btn-confirm-delete {
          padding: 0.75rem 1.5rem; border: none;
          background: #ef4444; color: white;
          border-radius: 0.75rem; font-size: 0.875rem; font-weight: 600;
          cursor: pointer; transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-family: inherit;
        }
        .btn-confirm-delete:hover:not(:disabled) {
          background: #dc2626; transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
        }
        .btn-confirm-delete:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-confirm-primary {
          padding: 0.75rem 1.5rem; border: none;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white; border-radius: 0.75rem;
          font-size: 0.875rem; font-weight: 600;
          cursor: pointer; transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-family: inherit;
        }
        .btn-confirm-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        /* prompt fields inside confirmation modals */
        .dash-prompt-field { margin-bottom: 1rem; }
        .dash-prompt-field:last-child { margin-bottom: 0; }
        .dash-prompt-label {
          display: block; font-size: 0.8rem; font-weight: 600;
          margin-bottom: 0.5rem; color: #0f172a;
        }
        .dash-prompt-input-wrapper { position: relative; }
        .dash-prompt-input {
          width: 100%; height: 2.75rem;
          padding: 0 3rem 0 0.75rem;
          border: 1.5px solid #e2e8f0; border-radius: 0.75rem;
          font-size: 0.875rem; background: #fff;
          font-family: inherit; box-sizing: border-box;
        }
        .dash-prompt-input:focus {
          outline: none; border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
        }
        .dash-prompt-unit {
          position: absolute; right: 0.75rem;
          top: 50%; transform: translateY(-50%);
          color: #64748b; font-size: 0.875rem; font-weight: 500;
        }

        /* ================= Profile dropdown ================= */
        .profile-dropdown-wrapper { position: relative; display: inline-block; }
        .profile-trigger {
          display: flex; align-items: center; gap: 10px;
          padding: 6px 12px 6px 6px; background: #ffffff;
          border: 1px solid #e2e8f0; border-radius: 9999px;
          cursor: pointer; transition: all 0.2s ease;
          font-family: inherit; color: #1e293b;
        }
        .profile-trigger:hover {
          border-color: #c7d2fe; background: #f8fafc;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.12);
        }
        .profile-trigger.open {
          border-color: #667eea; background: #f5f3ff;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
        }
        .profile-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff; display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.8rem; letter-spacing: 0.5px;
          flex-shrink: 0; box-shadow: 0 2px 6px rgba(102, 126, 234, 0.35);
        }
        .profile-info { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.15; }
        .profile-name {
          font-size: 0.825rem; font-weight: 600; color: #0f172a;
          white-space: nowrap; max-width: 140px;
          overflow: hidden; text-overflow: ellipsis;
        }
        .profile-role { font-size: 0.7rem; color: #64748b; font-weight: 500; }
        .profile-chevron { color: #64748b; transition: transform 0.2s ease; }
        .profile-chevron.open { transform: rotate(180deg); color: #667eea; }
        .profile-dropdown-menu {
          position: absolute; top: calc(100% + 10px); right: 0;
          min-width: 260px; background: #ffffff;
          border: 1px solid #e2e8f0; border-radius: 16px;
          box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.22);
          padding: 8px; z-index: 2000;
          animation: profileMenuIn 0.18s ease-out;
        }
        @keyframes profileMenuIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .profile-dropdown-header { display: flex; align-items: center; gap: 12px; padding: 10px 12px; }
        .profile-avatar-large {
          width: 44px; height: 44px; border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff; display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.9rem; flex-shrink: 0;
          box-shadow: 0 3px 8px rgba(102, 126, 234, 0.3);
        }
        .profile-dropdown-header-text { min-width: 0; flex: 1; }
        .profile-dropdown-name {
          font-weight: 700; color: #0f172a; font-size: 0.9rem;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .profile-dropdown-role { font-size: 0.72rem; color: #667eea; font-weight: 600; margin-top: 1px; }
        .profile-dropdown-email {
          font-size: 0.7rem; color: #64748b; margin-top: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .profile-dropdown-divider { height: 1px; background: #f1f5f9; margin: 6px 4px; }
        .profile-dropdown-item {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 10px 12px; background: transparent;
          border: none; border-radius: 10px; cursor: pointer;
          color: #334155; font-size: 0.85rem; font-weight: 500;
          font-family: inherit; text-align: left; transition: all 0.15s ease;
        }
        .profile-dropdown-item:hover { background: #f5f3ff; color: #667eea; }
        .profile-dropdown-item:hover svg { color: #667eea; }
        .profile-dropdown-item.danger { color: #ef4444; }
        .profile-dropdown-item.danger:hover { background: #fef2f2; color: #dc2626; }
        .profile-dropdown-item.danger:hover svg { color: #dc2626; }

        @media (max-width: 1024px) {
          .charts-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .charts-row { grid-template-columns: 1fr; }
          .filter-toolbar { flex-direction: column; align-items: stretch; }
          .filter-main { justify-content: center; }
          .matricule-category-card { flex: 1 1 100%; min-width: unset; }
          .matricule-section { padding: 0.5rem; }
          .saved-reports-grid { grid-template-columns: 1fr; }

          .dash-modal-card { margin: 1rem auto; border-radius: 24px; }
          .dash-header { padding: 16px 20px; gap: 14px; }
          .dash-header-title h2 { font-size: 1.25rem; }
          .dash-header-title { padding-right: 40px; }
          .dash-header-icon { width: 44px; height: 44px; border-radius: 22px; }
          .dash-header-close { top: 16px; right: 16px; width: 36px; height: 36px; }
          .dash-form, .dash-body { padding: 20px; }
          .dash-grid-2 { grid-template-columns: 1fr; }
          .dash-footer { padding: 16px 20px; }
        }
        @media (max-width: 640px) {
          .profile-info { display: none; }
          .profile-trigger { padding: 4px; }
          .profile-dropdown-menu { min-width: 220px; right: -10px; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;