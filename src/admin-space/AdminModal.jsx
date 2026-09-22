// src/pages/admin/AdminPayments.jsx
import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { fetchCars, selectCars, fetchMatricules, selectMatricules } from "../Redux/store";
import PaginationControls from '../components/PaginationControls';
import axios from "axios";
import { toast } from "sonner";
import {
  Plus, Edit2, Trash2, X, RefreshCw, Car, DollarSign, Calendar,
  TrendingUp, Check, AlertCircle, CreditCard, FileText, Download,
  Save, TrashIcon, Search, ChevronLeft, ChevronRight, User,
  Building2, FileCheck, Clock, Wallet, Banknote, Receipt,
  CalendarDays, Percent, Info, Tag, CreditCard as CreditCardIcon,
  AlertTriangle, CheckCircle, XCircle, Eye, Printer, Phone, Mail,
  MapPin, IdCard, Users, Gauge, Shield, Settings, EyeOff, Minus,
  Calculator, PieChart, TrendingDown, Sparkles, Star, Gem, Award,
  ArrowUpDown, ArrowUp, ArrowDown, Activity, Key, Lock, Unlock, ArrowLeft,
} from "lucide-react";

export default function AdminPayments() {
  const dispatch = useDispatch();
  const cars = useSelector(selectCars);
  const matricules = useSelector(selectMatricules);

  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');

  const [financings, setFinancings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [financingToDelete, setFinancingToDelete] = useState(null);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFinancing, setSelectedFinancing] = useState(null);
  const [paymentsModalOpen, setPaymentsModalOpen] = useState(false);
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");

  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [currentFinancingForSchedule, setCurrentFinancingForSchedule] = useState(null);
  const [interestRate, setInterestRate] = useState("5");
  const [tvaRate, setTvaRate] = useState("20");

  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [matriculeSearchTerm, setMatriculeSearchTerm] = useState("");
  const [filteredMatriculesList, setFilteredMatriculesList] = useState([]);
  const [selectedMatriculeObj, setSelectedMatriculeObj] = useState(null);

  const [formData, setFormData] = useState({
    matricule_id: "",
    dossier_number: "",
    account_number: "",
    credit_type: "vehicule_entreprise",
    contract_date: new Date().toISOString().slice(0, 10),
    credit_amount: 0,
    preti_interet_ttc_differe: 0,
    duration_months: 36,
    differed_months: 0,
    periodicity: "mensuel",
    total_installments: 36,
    first_installment_date: new Date().toISOString().slice(0, 10),
    last_installment_date: "",
    bank_name: "",
    bank_account: "",
    installment_amount: 0,
    prestation_amount: 0,
    status: "active",
    notes: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    installment_number: 1,
    paid_amount: 0,
    paid_date: new Date().toISOString().slice(0, 10),
    payment_method: "bank_transfer",
    transaction_reference: "",
    payment_notes: "",
  });

  const api = axios.create({
    baseURL: "https://oulfa-back-production.up.railway.app/api",
    headers: { "Accept": "application/json", "Content-Type": "application/json" },
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().slice(0, 10);
    } catch { return ""; }
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDirection("asc"); }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="sort-icon" />;
    return sortDirection === "asc"
      ? <ArrowUp size={12} className="sort-icon active" />
      : <ArrowDown size={12} className="sort-icon active" />;
  };

  const fetchFinancings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/payments");
      setFinancings(response.data.financings || []);
    } catch (error) {
      console.error("Error fetching financings:", error);
      toast.error("Erreur lors du chargement des données");
      setFinancings([]);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchFinancings();
    dispatch(fetchCars());
    dispatch(fetchMatricules());
  }, [dispatch]);

  const saveFinancing = async (data) => {
    try {
      if (editing) {
        const response = await api.put(`/payments/${editing.id}`, data);
        toast.success("Financement modifié avec succès");
        return response.data.financing;
      } else {
        const response = await api.post("/payments", data);
        toast.success("Financement ajouté avec succès");
        return response.data.financing;
      }
    } catch (error) {
      console.error("Error saving financing:", error);
      toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
      throw error;
    }
  };

  const deleteFinancing = async (id) => {
    try {
      await api.delete(`/payments/${id}`);
      toast.success("Financement supprimé avec succès");
      return true;
    } catch (error) {
      console.error("Error deleting financing:", error);
      toast.error("Erreur lors de la suppression");
      return false;
    }
  };

  const generateSchedule = async (financingId, data) => {
    try {
      const response = await api.post(`/payments/${financingId}/generate-schedule`, data);
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      console.error("Error generating schedule:", error);
      toast.error(error.response?.data?.message || "Erreur lors de la génération de l'échéancier");
      throw error;
    }
  };

  const recordPayment = async (financingId, data) => {
    try {
      const response = await api.post(`/payments/${financingId}/record-payment`, data);
      toast.success("Paiement enregistré avec succès");
      return response.data;
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement du paiement");
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.last_installment_date && formData.first_installment_date && formData.total_installments) {
      const startDate = new Date(formData.first_installment_date);
      const lastDate = new Date(startDate);
      lastDate.setMonth(startDate.getMonth() + formData.total_installments - 1);
      formData.last_installment_date = lastDate.toISOString().slice(0, 10);
    }

    try {
      const saved = await saveFinancing(formData);
      await fetchFinancings();
      setShowPaymentForm(false);
      setEditing(null);
      resetForm();
    } catch (error) {
      // handled
    } finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setFormData({
      matricule_id: "",
      dossier_number: "",
      account_number: "",
      credit_type: "vehicule_entreprise",
      contract_date: new Date().toISOString().slice(0, 10),
      credit_amount: 0,
      preti_interet_ttc_differe: 0,
      duration_months: 36,
      differed_months: 0,
      periodicity: "mensuel",
      total_installments: 36,
      first_installment_date: new Date().toISOString().slice(0, 10),
      last_installment_date: "",
      bank_name: "",
      bank_account: "",
      installment_amount: 0,
      prestation_amount: 0,
      status: "active",
      notes: "",
    });
    setSelectedMatriculeObj(null);
    setMatriculeSearchTerm("");
    setFilteredMatriculesList([]);
  };

  const closeForm = () => {
    if (submitting) return;
    setShowPaymentForm(false);
    setEditing(null);
    resetForm();
  };

  const handleDeleteClick = (financing) => {
    setFinancingToDelete(financing);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!financingToDelete) return;
    const success = await deleteFinancing(financingToDelete.id);
    if (success) await fetchFinancings();
    setDeleteModalOpen(false);
    setFinancingToDelete(null);
  };

  const openSchedulePrompt = (financing) => {
    setCurrentFinancingForSchedule(financing);
    setInterestRate("5");
    setTvaRate("20");
    setInterestModalOpen(true);
  };

  const loadPayments = async (financingId) => {
    try {
      const response = await api.get(`/payments/${financingId}/payments`);
      setSelectedFinancing((prev) => ({ ...prev, payments: response.data.payments }));
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Erreur lors du chargement des paiements");
    }
  };

  const confirmGenerateSchedule = async () => {
    if (!currentFinancingForSchedule) return;
    const rate = parseFloat(interestRate);
    const tva = parseFloat(tvaRate);
    if (isNaN(rate) || rate < 0) { toast.error("Veuillez entrer un taux d'intérêt valide"); return; }
    if (isNaN(tva) || tva < 0) { toast.error("Veuillez entrer un taux de TVA valide"); return; }
    try {
      await generateSchedule(currentFinancingForSchedule.id, { interest_rate: rate, tva_rate: tva });
      await fetchFinancings();
      if (selectedFinancing?.id === currentFinancingForSchedule.id) {
        setSelectedFinancing((prev) => ({ ...prev, payments: null }));
        loadPayments(currentFinancingForSchedule.id);
      }
      setInterestModalOpen(false);
      setCurrentFinancingForSchedule(null);
    } catch (error) {
      // handled
    }
  };

  const viewPayments = async (financingId) => {
    try {
      const response = await api.get(`/payments/${financingId}/payments`);
      const financing = financings.find(f => f.id === financingId);
      setSelectedFinancing({ ...financing, payments: response.data.payments });
      setPaymentsModalOpen(true);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Erreur lors du chargement des paiements");
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await recordPayment(selectedFinancing.id, paymentForm);
      await viewPayments(selectedFinancing.id);
      await fetchFinancings();
      setRecordPaymentModalOpen(false);
      setPaymentForm({
        installment_number: 1,
        paid_amount: 0,
        paid_date: new Date().toISOString().slice(0, 10),
        payment_method: "bank_transfer",
        transaction_reference: "",
        payment_notes: "",
      });
    } catch (error) {
      // handled
    } finally { setSubmitting(false); }
  };

  const handleMatriculeSearch = (term) => {
    setMatriculeSearchTerm(term);
    if (term.trim() === "") { setFilteredMatriculesList([]); return; }
    const lower = term.toLowerCase().trim();
    const filtered = matricules.filter(m => {
      if (m.status === 'sold') return false;
      const car = cars.find(c => c.id === m.car_id);
      const carStr = car ? `${car.brand} ${car.model}`.toLowerCase() : '';
      return m.matricule_code.toLowerCase().includes(lower) || carStr.includes(lower);
    });
    setFilteredMatriculesList(filtered.slice(0, 10));
  };

  const handleMatriculeSelect = (mat) => {
    setSelectedMatriculeObj(mat);
    const car = cars.find(c => c.id === mat.car_id);
    setMatriculeSearchTerm(`${mat.matricule_code} - ${car ? `${car.brand} ${car.model}` : 'N/A'}`);
    setFormData(prev => ({ ...prev, matricule_id: mat.id }));
    setFilteredMatriculesList([]);
  };

  const clearMatriculeSelection = () => {
    setSelectedMatriculeObj(null);
    setMatriculeSearchTerm("");
    setFilteredMatriculesList([]);
    setFormData(prev => ({ ...prev, matricule_id: "" }));
  };

  const handleEdit = (f) => {
    setEditing(f);
    setFormData({
      matricule_id: f.matricule_id,
      dossier_number: f.dossier_number,
      account_number: f.account_number || "",
      credit_type: f.credit_type,
      contract_date: formatDateForInput(f.contract_date),
      credit_amount: f.credit_amount,
      preti_interet_ttc_differe: f.preti_interet_ttc_differe || 0,
      duration_months: f.duration_months,
      differed_months: f.differed_months || 0,
      periodicity: f.periodicity || "mensuel",
      total_installments: f.total_installments,
      first_installment_date: formatDateForInput(f.first_installment_date),
      last_installment_date: formatDateForInput(f.last_installment_date) || "",
      bank_name: f.bank_name || "",
      bank_account: f.bank_account || "",
      installment_amount: f.installment_amount,
      prestation_amount: f.prestation_amount || 0,
      status: f.status,
      notes: f.notes || "",
    });

    if (f.matricule_id) {
      const mat = matricules.find(m => m.id === f.matricule_id);
      if (mat) {
        setSelectedMatriculeObj(mat);
        const car = cars.find(c => c.id === mat.car_id);
        setMatriculeSearchTerm(`${mat.matricule_code} - ${car ? `${car.brand} ${car.model}` : 'N/A'}`);
      }
    } else {
      setSelectedMatriculeObj(null);
      setMatriculeSearchTerm("");
    }
    setShowPaymentForm(true);
  };

  const handleViewDetails = (financing) => {
    setSelectedFinancing(financing);
    setShowPaymentDetails(true);
    loadPayments(financing.id);
  };

  const handleAddNew = () => { setEditing(null); resetForm(); setShowPaymentForm(true); };

  const refreshData = () => {
    fetchFinancings();
    dispatch(fetchCars(true));
    dispatch(fetchMatricules(true));
    toast.success("Données actualisées");
  };

  const handleExport = () => {
    const headers = ['ID', 'Dossier N°', 'Véhicule', 'Matricule', 'Montant Crédit', 'Mensualité', 'Total Échéances', 'Payé', 'Reste', 'Statut', 'Date Contrat'];
    const csvData = filteredFinancings.map(f => {
      const info = getMatriculeInfo(f.matricule_id);
      return [
        f.id,
        `"${f.dossier_number}"`,
        `"${info ? `${info.car.brand} ${info.car.model}` : '—'}"`,
        `"${info ? info.matricule_code : '—'}"`,
        f.credit_amount,
        f.installment_amount,
        f.total_installments,
        f.total_paid,
        f.total_remaining,
        f.status === 'active' ? 'Actif' : f.status === 'completed' ? 'Terminé' : 'En retard',
        f.contract_date,
      ].join(',');
    });
    const blob = new Blob([headers.join(',') + '\n' + csvData.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financements_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV effectué");
  };

  const getMatriculeInfo = (matriculeId) => {
    const matricule = matricules.find(m => m.id === matriculeId);
    if (matricule) {
      const car = cars.find(c => c.id === matricule.car_id);
      return { car, matricule_code: matricule.matricule_code };
    }
    return null;
  };

  const filteredFinancings = useMemo(() => {
    return financings.filter(f => {
      const info = getMatriculeInfo(f.matricule_id);
      const carName = info && info.car ? `${info.car.brand} ${info.car.model}`.toLowerCase() : "";
      const matchesSearch = searchTerm === "" ||
        carName.includes(searchTerm.toLowerCase()) ||
        f.dossier_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (info && info.matricule_code.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || f.status === statusFilter;

      // 🔔 Notification filter: overdue OR upcoming (≤ 7 days) payments
      let matchesNotification = true;
      if (filterParam === 'notifications') {
        let hasOverdueOrUpcoming = false;
        if (f.payments && f.payments.length > 0) {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const hasOverdue = f.payments.some(p => p.status !== 'paid' && new Date(p.due_date) < today);
          const hasUpcoming = f.payments.some(p => {
            const diff = (new Date(p.due_date) - today) / (1000 * 60 * 60 * 24);
            return p.status !== 'paid' && diff >= 0 && diff <= 7;
          });
          hasOverdueOrUpcoming = hasOverdue || hasUpcoming;
        } else {
          if (f.status === 'late' || f.status === 'defaulted') hasOverdueOrUpcoming = true;
        }
        matchesNotification = hasOverdueOrUpcoming;
      }

      return matchesSearch && matchesStatus && matchesNotification;
    }).sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case "id": aVal = a.id; bVal = b.id; break;
        case "dossier": aVal = a.dossier_number?.toLowerCase() || ""; bVal = b.dossier_number?.toLowerCase() || ""; break;
        case "vehicle": {
          const aInfo = getMatriculeInfo(a.matricule_id); const bInfo = getMatriculeInfo(b.matricule_id);
          aVal = aInfo?.car ? `${aInfo.car.brand} ${aInfo.car.model}`.toLowerCase() : "";
          bVal = bInfo?.car ? `${bInfo.car.brand} ${bInfo.car.model}`.toLowerCase() : "";
          break;
        }
        case "matricule": {
          const aMat = getMatriculeInfo(a.matricule_id); const bMat = getMatriculeInfo(b.matricule_id);
          aVal = aMat?.matricule_code || ""; bVal = bMat?.matricule_code || "";
          break;
        }
        case "amount": aVal = a.credit_amount || 0; bVal = b.credit_amount || 0; break;
        case "installment": aVal = a.installment_amount || 0; bVal = b.installment_amount || 0; break;
        case "progress":
          aVal = (a.current_installment_number || 0) / (a.total_installments || 1);
          bVal = (b.current_installment_number || 0) / (b.total_installments || 1);
          break;
        case "status": aVal = a.status || ""; bVal = b.status || ""; break;
        default: aVal = a.id; bVal = b.id;
      }
      return sortDirection === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }, [financings, searchTerm, statusFilter, sortField, sortDirection, matricules, cars, filterParam]);

  const totalPages = Math.ceil(filteredFinancings.length / itemsPerPage);
  const paginated = filteredFinancings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: financings.length,
    active: financings.filter(f => f.status === 'active').length,
    completed: financings.filter(f => f.status === 'completed').length,
    totalRemaining: financings.reduce((sum, f) => sum + (parseFloat(f.total_remaining) || 0), 0),
  };

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("fr-FR");
    } catch { return dateString; }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Chargement des financements...</p>
      </div>
    );
  }

  return (
    <>
      {/* ====================================================================
          Payment Form — full-screen overlay (AdminModal shell)
         ==================================================================== */}
      {showPaymentForm && createPortal(
        <div className="payment-fullscreen-overlay" role="dialog" aria-modal="true">
          <div className="payment-form-modal">
            <header className="payment-form-header">
              <div className="payment-form-header-icon">
                {editing ? <Sparkles size={28} /> : <DollarSign size={28} />}
              </div>
              <div className="payment-form-header-title">
                <h2>{editing ? "Modifier le financement" : "Nouveau financement"}</h2>
                <p>{editing
                  ? "Modifiez les informations du financement"
                  : "Ajoutez un nouveau financement automobile"}</p>
              </div>
              <button
                type="button"
                className="payment-form-header-close"
                onClick={closeForm}
                disabled={submitting}
                aria-label="Fermer"
              >
                <X size={24} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="payment-form">
              <div className="payment-form-body">
                <div className="payment-form-grid">
                  {/* Left Column */}
                  <div className="payment-form-col">
                    <section className="payment-section">
                      <div className="payment-section-header">
                        <Car size={18} />
                        <h3>Informations véhicule</h3>
                      </div>
                      <div className="payment-grid-2">
                        <div className="payment-field" style={{ gridColumn: "1 / -1" }}>
                          <label className="payment-label payment-required">Véhicule (matricule)</label>
                          <div className="payment-search-section">
                            <div className="payment-search-input-wrapper">
                              <Search size={18} />
                              <input
                                type="text"
                                className="payment-input"
                                value={matriculeSearchTerm}
                                onChange={(e) => handleMatriculeSearch(e.target.value)}
                                placeholder="Rechercher un matricule (plaque, marque, modèle)..."
                                required
                              />
                              {selectedMatriculeObj && (
                                <button type="button" className="payment-clear-search-btn" onClick={clearMatriculeSelection} title="Effacer la sélection">
                                  <X size={18} />
                                </button>
                              )}
                            </div>

                            {filteredMatriculesList.length > 0 && (
                              <div className="payment-results">
                                {filteredMatriculesList.map(mat => {
                                  const car = cars.find(c => c.id === mat.car_id);
                                  return (
                                    <div key={mat.id} className="payment-result-item" onClick={() => handleMatriculeSelect(mat)}>
                                      <div className="payment-result-avatar"><Car size={20} /></div>
                                      <div className="payment-result-info">
                                        <strong>{mat.matricule_code}</strong>
                                        <div className="payment-result-details">
                                          <span>{car ? `${car.brand} ${car.model} (${car.year})` : 'N/A'}</span>
                                          <span>{mat.kilometrage?.toLocaleString()} km</span>
                                          <span className={`badge ${mat.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                                            {mat.status === 'active' ? 'Actif' : 'Inactif'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {selectedMatriculeObj && (
                              <div className="payment-selected">
                                <CheckCircle size={20} />
                                <div>
                                  <strong>Matricule sélectionné</strong>
                                  <p>
                                    {selectedMatriculeObj.matricule_code} - {cars.find(c => c.id === selectedMatriculeObj.car_id)?.brand} {cars.find(c => c.id === selectedMatriculeObj.car_id)?.model}
                                    <span className={`badge ${selectedMatriculeObj.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ marginLeft: '8px' }}>
                                      {selectedMatriculeObj.status === 'active' ? 'Actif' : 'Inactif'}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            )}

                            {!selectedMatriculeObj && matriculeSearchTerm.trim() !== "" && filteredMatriculesList.length === 0 && (
                              <div className="payment-no-results">Aucun matricule trouvé.</div>
                            )}
                          </div>
                          <input type="hidden" name="matricule_id" value={formData.matricule_id} />
                        </div>
                        <div className="payment-field">
                          <label className="payment-label payment-required">N° Dossier</label>
                          <input type="text" required value={formData.dossier_number}
                            onChange={(e) => setFormData({ ...formData, dossier_number: e.target.value })}
                            className="payment-input" placeholder="Ex: FIN-2024-001" />
                        </div>
                        <div className="payment-field">
                          <label className="payment-label">N° Compte</label>
                          <input type="text" value={formData.account_number}
                            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                            className="payment-input" placeholder="Numéro de compte bancaire" />
                        </div>
                        <div className="payment-field" style={{ gridColumn: "1 / -1" }}>
                          <label className="payment-label">Type crédit</label>
                          <select value={formData.credit_type}
                            onChange={(e) => setFormData({ ...formData, credit_type: e.target.value })}
                            className="payment-input">
                            <option value="vehicule_entreprise">Véhicule Entreprise</option>
                            <option value="vehicule_personnel">Véhicule Personnel</option>
                            <option value="other">Autre</option>
                          </select>
                        </div>
                      </div>
                    </section>

                    <section className="payment-section">
                      <div className="payment-section-header">
                        <Calendar size={18} />
                        <h3>Dates et durée</h3>
                      </div>
                      <div className="payment-grid-2">
                        <div className="payment-field">
                          <label className="payment-label payment-required">Date contrat</label>
                          <input type="date" required value={formData.contract_date}
                            onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
                            className="payment-input" />
                        </div>
                        <div className="payment-field">
                          <label className="payment-label payment-required">1ère échéance</label>
                          <input type="date" required value={formData.first_installment_date}
                            onChange={(e) => setFormData({ ...formData, first_installment_date: e.target.value })}
                            className="payment-input" />
                        </div>
                        <div className="payment-field">
                          <label className="payment-label">Dernière échéance</label>
                          <input type="date" value={formData.last_installment_date}
                            onChange={(e) => setFormData({ ...formData, last_installment_date: e.target.value })}
                            className="payment-input" />
                        </div>
                        <div className="payment-field">
                          <label className="payment-label payment-required">Durée (mois)</label>
                          <input type="number" required value={formData.duration_months}
                            onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value), total_installments: parseInt(e.target.value) })}
                            className="payment-input" placeholder="36" />
                        </div>
                        <div className="payment-field">
                          <label className="payment-label">Mois différés</label>
                          <input type="number" value={formData.differed_months}
                            onChange={(e) => setFormData({ ...formData, differed_months: parseInt(e.target.value) })}
                            className="payment-input" placeholder="0" />
                        </div>
                        <div className="payment-field">
                          <label className="payment-label">Périodicité</label>
                          <select value={formData.periodicity}
                            onChange={(e) => setFormData({ ...formData, periodicity: e.target.value })}
                            className="payment-input">
                            <option value="mensuel">Mensuel</option>
                            <option value="trimestriel">Trimestriel</option>
                            <option value="semestriel">Semestriel</option>
                            <option value="annuel">Annuel</option>
                          </select>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Right Column */}
                  <div className="payment-form-col">
                    <section className="payment-section">
                      <div className="payment-section-header">
                        <DollarSign size={18} />
                        <h3>Montants</h3>
                      </div>
                      <div className="payment-grid-2">
                        <div className="payment-field">
                          <label className="payment-label payment-required">Montant crédit (DH)</label>
                          <input type="number" step="0.01" required value={formData.credit_amount}
                            onChange={(e) => setFormData({ ...formData, credit_amount: parseFloat(e.target.value) })}
                            className="payment-input" placeholder="0.00" />
                        </div>
                        <div className="payment-field">
                          <label className="payment-label payment-required">Montant mensualité (DH)</label>
                          <input type="number" step="0.01" required value={formData.installment_amount}
                            onChange={(e) => setFormData({ ...formData, installment_amount: parseFloat(e.target.value) })}
                            className="payment-input" placeholder="0.00" />
                        </div>
                        <div className="payment-field" style={{ gridColumn: "1 / -1" }}>
                          <label className="payment-label">Prestation (DH)</label>
                          <input type="number" step="0.01" value={formData.prestation_amount}
                            onChange={(e) => setFormData({ ...formData, prestation_amount: parseFloat(e.target.value) })}
                            className="payment-input" placeholder="0.00" />
                        </div>
                      </div>
                    </section>

                    <section className="payment-section">
                      <div className="payment-section-header">
                        <Building2 size={18} />
                        <h3>Informations bancaires</h3>
                      </div>
                      <div className="payment-grid-2">
                        <div className="payment-field">
                          <label className="payment-label">Banque</label>
                          <input type="text" value={formData.bank_name}
                            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                            className="payment-input" placeholder="Nom de la banque" />
                        </div>
                        <div className="payment-field">
                          <label className="payment-label">Compte bancaire</label>
                          <input type="text" value={formData.bank_account}
                            onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                            className="payment-input" placeholder="Numéro de compte" />
                        </div>
                      </div>
                    </section>

                    <section className="payment-section">
                      <div className="payment-section-header">
                        <Shield size={18} />
                        <h3>Statut et notes</h3>
                      </div>
                      <div className="payment-grid-2">
                        <div className="payment-field" style={{ gridColumn: "1 / -1" }}>
                          <label className="payment-label">Statut</label>
                          <select value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="payment-input">
                            <option value="active">Actif</option>
                            <option value="completed">Terminé</option>
                            <option value="late">En retard</option>
                            <option value="defaulted">Impayé</option>
                          </select>
                        </div>
                      </div>
                      <div className="payment-field" style={{ marginTop: "1rem" }}>
                        <label className="payment-label">Notes</label>
                        <textarea value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="payment-input payment-textarea" rows="3" placeholder="Notes supplémentaires..." />
                      </div>
                    </section>

                    {editing && (
                      <section className="payment-section">
                        <div className="payment-section-header">
                          <Activity size={18} />
                          <h3>Informations système</h3>
                        </div>
                        <div className="payment-info-grid">
                          <div className="payment-info-item">
                            <span className="payment-info-label">Date de création</span>
                            <span className="payment-info-value">{editing.created_at ? formatDate(editing.created_at) : "—"}</span>
                          </div>
                          <div className="payment-info-item">
                            <span className="payment-info-label">Dernière modification</span>
                            <span className="payment-info-value">{editing.updated_at ? formatDate(editing.updated_at) : "—"}</span>
                          </div>
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              </div>

              <div className="payment-form-footer">
                <button type="button" className="payment-btn-secondary" onClick={closeForm} disabled={submitting}>
                  Annuler
                </button>
                <button type="submit" className="payment-btn-primary" disabled={submitting}>
                  {submitting ? "Traitement…" : (editing ? "Mettre à jour" : "Créer le financement")}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ====================================================================
          Payment Details — full-screen overlay (AdminModal shell)
         ==================================================================== */}
      {showPaymentDetails && selectedFinancing && createPortal(
        <div className="payment-fullscreen-overlay" role="dialog" aria-modal="true">
          <div className="payment-details-modal">
            <header className="payment-details-header">
              <div className="payment-details-header-icon">
                <Receipt size={28} />
              </div>
              <div className="payment-details-header-title">
                <h2>Détails du financement</h2>
                <p>Dossier: {selectedFinancing.dossier_number}</p>
              </div>
              <button
                type="button"
                className="payment-details-header-close"
                onClick={() => setShowPaymentDetails(false)}
                aria-label="Fermer"
              >
                <X size={24} />
              </button>
            </header>

            <div className="payment-details-content">
              <div className="payment-details-actions-bar">
                <button onClick={() => setShowPaymentDetails(false)} className="payment-back-btn">
                  <ArrowLeft size={16} /> Retour à la liste
                </button>
                <div className="payment-details-action-buttons">
                  <button onClick={() => { setShowPaymentDetails(false); handleEdit(selectedFinancing); }} className="payment-action-edit-btn">
                    <Edit2 size={16} /> Modifier
                  </button>
                  <button onClick={() => { setShowPaymentDetails(false); handleDeleteClick(selectedFinancing); }} className="payment-action-delete-btn">
                    <Trash2 size={16} /> Supprimer
                  </button>
                </div>
              </div>

              <div className="payment-financing-header-card">
                <div className="payment-financing-stats-grid">
                  <div className="payment-stat-item-detail">
                    <div className="payment-stat-value">{formatCurrency(selectedFinancing.credit_amount)}</div>
                    <div className="payment-stat-label-detail">Montant total</div>
                  </div>
                  <div className="payment-stat-item-detail">
                    <div className="payment-stat-value">{formatCurrency(selectedFinancing.installment_amount)}</div>
                    <div className="payment-stat-label-detail">Mensualité</div>
                  </div>
                  <div className="payment-stat-item-detail">
                    <div className="payment-stat-value">{selectedFinancing.current_installment_number || 0} / {selectedFinancing.total_installments || 0}</div>
                    <div className="payment-stat-label-detail">Échéances</div>
                  </div>
                  <div className="payment-stat-item-detail">
                    <div className="payment-stat-value">{formatCurrency(selectedFinancing.total_paid || 0)}</div>
                    <div className="payment-stat-label-detail">Total payé</div>
                  </div>
                  <div className="payment-stat-item-detail">
                    <div className="payment-stat-value">{formatCurrency(selectedFinancing.total_remaining || 0)}</div>
                    <div className="payment-stat-label-detail">Reste à payer</div>
                  </div>
                </div>
              </div>

              <div className="payment-details-sections-grid">
                <div className="payment-detail-card">
                  <div className="payment-detail-card-title">
                    <Car size={16} /> Informations véhicule
                  </div>
                  <div className="payment-detail-card-content">
                    <div className="payment-info-row">
                      <span className="payment-info-label">Matricule</span>
                      <span className="payment-info-value payment-matricule-value">{getMatriculeInfo(selectedFinancing.matricule_id)?.matricule_code || "—"}</span>
                    </div>
                    <div className="payment-info-row">
                      <span className="payment-info-label">Marque</span>
                      <span className="payment-info-value">{getMatriculeInfo(selectedFinancing.matricule_id)?.car?.brand || "—"}</span>
                    </div>
                    <div className="payment-info-row">
                      <span className="payment-info-label">Modèle</span>
                      <span className="payment-info-value">{getMatriculeInfo(selectedFinancing.matricule_id)?.car?.model || "—"}</span>
                    </div>
                    <div className="payment-info-row">
                      <span className="payment-info-label">Année</span>
                      <span className="payment-info-value">{getMatriculeInfo(selectedFinancing.matricule_id)?.car?.year || "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="payment-detail-card">
                  <div className="payment-detail-card-title">
                    <FileText size={16} /> Informations financement
                  </div>
                  <div className="payment-detail-card-content">
                    <div className="payment-info-row">
                      <span className="payment-info-label">N° Dossier</span>
                      <span className="payment-info-value">{selectedFinancing.dossier_number}</span>
                    </div>
                    <div className="payment-info-row">
                      <span className="payment-info-label">N° Compte</span>
                      <span className="payment-info-value">{selectedFinancing.account_number || "—"}</span>
                    </div>
                    <div className="payment-info-row">
                      <span className="payment-info-label">Type crédit</span>
                      <span className="payment-info-value">{selectedFinancing.credit_type === 'vehicule_entreprise' ? 'Véhicule Entreprise' : selectedFinancing.credit_type === 'vehicule_personnel' ? 'Véhicule Personnel' : 'Autre'}</span>
                    </div>
                    <div className="payment-info-row">
                      <span className="payment-info-label">Date contrat</span>
                      <span className="payment-info-value">{formatDate(selectedFinancing.contract_date)}</span>
                    </div>
                  </div>
                </div>

                <div className="payment-detail-card">
                  <div className="payment-detail-card-title">
                    <Building2 size={16} /> Informations bancaires
                  </div>
                  <div className="payment-detail-card-content">
                    <div className="payment-info-row">
                      <span className="payment-info-label">Banque</span>
                      <span className="payment-info-value">{selectedFinancing.bank_name || "—"}</span>
                    </div>
                    <div className="payment-info-row">
                      <span className="payment-info-label">Compte bancaire</span>
                      <span className="payment-info-value">{selectedFinancing.bank_account || "—"}</span>
                    </div>
                    <div className="payment-info-row">
                      <span className="payment-info-label">Statut</span>
                      <span className={`payment-status-badge ${selectedFinancing.status === 'active' ? 'payment-status-active' : selectedFinancing.status === 'completed' ? 'payment-status-completed' : 'payment-status-late'}`}>
                        {selectedFinancing.status === 'active' ? 'Actif' : selectedFinancing.status === 'completed' ? 'Terminé' : 'En retard'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="payment-detail-card">
                  <div className="payment-detail-card-title">
                    <Calendar size={16} /> Échéancier
                  </div>
                  <div className="payment-detail-card-content">
                    <div className="payment-info-row">
                      <span className="payment-info-label">1ère échéance</span>
                      <span className="payment-info-value">{formatDate(selectedFinancing.first_installment_date)}</span>
                    </div>
                    <div className="payment-info-row">
                      <span className="payment-info-label">Dernière échéance</span>
                      <span className="payment-info-value">{formatDate(selectedFinancing.last_installment_date)}</span>
                    </div>
                    <div className="payment-info-row">
                      <span className="payment-info-label">Progression</span>
                      <div className="payment-progress-wrapper">
                        <div className="payment-progress-bar">
                          <div className="payment-progress-fill" style={{ width: `${Math.min(100, ((selectedFinancing.current_installment_number || 0) / (selectedFinancing.total_installments || 1)) * 100)}%` }} />
                        </div>
                        <span className="payment-progress-text">{selectedFinancing.current_installment_number || 0} / {selectedFinancing.total_installments || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedFinancing.notes && (
                <div className="payment-notes-section">
                  <div className="payment-notes-title">
                    <FileText size={16} /> Notes
                  </div>
                  <div className="payment-notes-content">
                    {selectedFinancing.notes}
                  </div>
                </div>
              )}

              <div className="payment-payments-section">
                <div className="payment-payments-section-header">
                  <Receipt size={16} /> Échéances détaillées
                  <button onClick={() => openSchedulePrompt(selectedFinancing)} className="payment-generate-schedule-btn">
                    <Calculator size={14} /> Générer échéancier
                  </button>
                </div>
                <div className="payment-payments-table-wrapper">
                  <table className="payment-payments-table">
                    <thead>
                      <tr>
                        <th>N°</th>
                        <th>Date échéance</th>
                        <th>Capital</th>
                        <th>Intérêts</th>
                        <th>TVA</th>
                        <th>Total</th>
                        <th>Statut</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFinancing.payments?.map(payment => (
                        <tr key={payment.id}>
                          <td>#{payment.installment_number}</td>
                          <td>{formatDate(payment.due_date)}</td>
                          <td>{formatCurrency(payment.capital_amount || 0)}</td>
                          <td>{formatCurrency(payment.interest_amount || 0)}</td>
                          <td>{formatCurrency(payment.tva_amount || 0)}</td>
                          <td className="font-semibold">{formatCurrency(payment.total_amount || 0)}</td>
                          <td>
                            <span className={`badge ${payment.status === 'paid' ? 'badge-paid' : 'badge-pending'}`}>
                              {payment.status === 'paid' ? <CheckCircle size={12} /> : <Clock size={12} />}
                              {payment.status === 'paid' ? 'Payé' : 'En attente'}
                            </span>
                          </td>
                          <td>
                            {payment.status !== 'paid' && (
                              <button
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setPaymentForm({
                                    installment_number: payment.installment_number,
                                    paid_amount: payment.total_amount,
                                    paid_date: new Date().toISOString().slice(0, 10),
                                    payment_method: "bank_transfer",
                                    transaction_reference: "",
                                    payment_notes: "",
                                  });
                                  setRecordPaymentModalOpen(true);
                                }}
                                className="payment-record-payment-btn"
                              >
                                <Check size={12} /> Enregistrer
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {(!selectedFinancing.payments || selectedFinancing.payments.length === 0) && (
                        <tr>
                          <td colSpan="8" className="text-center py-12">
                            Aucun échéancier généré.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="payment-details-footer">
              <button onClick={() => setShowPaymentDetails(false)} className="payment-btn-secondary">
                Fermer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ====================================================================
          Delete confirmation — polished confirmation style
         ==================================================================== */}
      {deleteModalOpen && financingToDelete && createPortal(
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <div className="confirmation-header">
              <div className="confirmation-icon delete">
                <TrashIcon size={32} />
              </div>
              <h3 className="confirmation-title">Confirmer la suppression</h3>
            </div>
            <div className="confirmation-body">
              <p className="confirmation-message">
                Êtes-vous sûr de vouloir supprimer le financement<br />
                <span className="payment-dossier-chip">"{financingToDelete.dossier_number}"</span> ?<br />
                Cette action est irréversible.
              </p>
              {financingToDelete.total_paid > 0 && (
                <div className="payment-delete-warning">
                  ⚠️ Ce financement a déjà des paiements enregistrés ({formatCurrency(financingToDelete.total_paid)}). La suppression affectera les données associées.
                </div>
              )}
            </div>
            <div className="confirmation-actions">
              <button className="btn-confirm-cancel" onClick={() => setDeleteModalOpen(false)}>
                Annuler
              </button>
              <button className="btn-confirm-delete" onClick={confirmDelete}>
                <Trash2 size={16} /> Supprimer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ====================================================================
          Interest rate prompt — small dialog
         ==================================================================== */}
      {interestModalOpen && currentFinancingForSchedule && createPortal(
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <div className="confirmation-header">
              <div className="confirmation-icon info">
                <Calculator size={32} />
              </div>
              <h3 className="confirmation-title">Générer l'échéancier</h3>
              <p className="confirmation-subtitle">
                Financement {currentFinancingForSchedule.dossier_number}
              </p>
            </div>
            <div className="confirmation-body">
              <div className="payment-prompt-field">
                <label className="payment-prompt-label"><Percent size={16} /> Taux d'intérêt annuel (%)</label>
                <div className="payment-prompt-input-wrapper">
                  <input type="number" step="0.1" value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="payment-prompt-input" placeholder="Ex: 5" />
                  <span className="payment-prompt-unit">%</span>
                </div>
              </div>
              <div className="payment-prompt-field">
                <label className="payment-prompt-label"><Percent size={16} /> Taux de TVA (%)</label>
                <div className="payment-prompt-input-wrapper">
                  <input type="number" step="0.1" value={tvaRate}
                    onChange={(e) => setTvaRate(e.target.value)}
                    className="payment-prompt-input" placeholder="Ex: 20" />
                  <span className="payment-prompt-unit">%</span>
                </div>
              </div>
              <div className="payment-prompt-note">
                <Info size={14} />
                <span>Le système va générer un échéancier détaillé avec calcul des intérêts et de la TVA pour chaque mensualité.</span>
              </div>
            </div>
            <div className="confirmation-actions">
              <button onClick={() => setInterestModalOpen(false)} className="btn-confirm-cancel">Annuler</button>
              <button onClick={confirmGenerateSchedule} className="btn-confirm-primary">
                <Calculator size={16} /> Générer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ====================================================================
          Record payment — small dialog
         ==================================================================== */}
      {recordPaymentModalOpen && selectedFinancing && selectedPayment && createPortal(
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal" style={{ maxWidth: '600px' }}>
            <div className="confirmation-header">
              <div className="confirmation-icon info">
                <Wallet size={32} />
              </div>
              <h3 className="confirmation-title">Enregistrer paiement</h3>
              <p className="confirmation-subtitle">Échéance N°{selectedPayment.installment_number}</p>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="confirmation-body">
                <div className="payment-prompt-grid-2">
                  <div className="payment-prompt-field">
                    <label className="payment-prompt-label"><DollarSign size={16} /> Montant à payer (DH) *</label>
                    <input type="number" step="0.01" required value={paymentForm.paid_amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paid_amount: parseFloat(e.target.value) })}
                      className="payment-prompt-input" />
                  </div>
                  <div className="payment-prompt-field">
                    <label className="payment-prompt-label"><Calendar size={16} /> Date paiement *</label>
                    <input type="date" required value={paymentForm.paid_date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paid_date: e.target.value })}
                      className="payment-prompt-input" />
                  </div>
                  <div className="payment-prompt-field">
                    <label className="payment-prompt-label"><CreditCard size={16} /> Mode paiement</label>
                    <select value={paymentForm.payment_method}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                      className="payment-prompt-input">
                      <option value="bank_transfer">Virement bancaire</option>
                      <option value="check">Chèque</option>
                      <option value="cash">Espèces</option>
                      <option value="card">Carte bancaire</option>
                    </select>
                  </div>
                  <div className="payment-prompt-field">
                    <label className="payment-prompt-label"><Tag size={16} /> Référence transaction</label>
                    <input type="text" value={paymentForm.transaction_reference}
                      onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                      className="payment-prompt-input" placeholder="Référence du virement" />
                  </div>
                </div>
                <div className="payment-prompt-field" style={{ marginTop: '0.75rem' }}>
                  <label className="payment-prompt-label"><Info size={16} /> Notes</label>
                  <textarea value={paymentForm.payment_notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_notes: e.target.value })}
                    className="payment-prompt-input payment-prompt-textarea" rows="2" placeholder="Notes supplémentaires..." />
                </div>
              </div>
              <div className="confirmation-actions">
                <button type="button" onClick={() => setRecordPaymentModalOpen(false)} className="btn-confirm-cancel">
                  Annuler
                </button>
                <button type="submit" className="btn-confirm-primary" disabled={submitting}>
                  {submitting ? "Traitement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Main List View */}
      {!showPaymentForm && !showPaymentDetails && (
        <div className="admin-container">
          {/* Header */}
          <div className="section-header">
            <div className="header-content">
              <h1 className="section-title">
                <CreditCardIcon size={28} /> Financements / Traites
              </h1>
              <p className="section-subtitle">Gestion des financements automobiles</p>
            </div>
            <div className="section-actions">
              <button onClick={refreshData} className="btn btn-secondary">
                <RefreshCw size={16} /> Actualiser
              </button>
              <button onClick={handleExport} className="btn btn-secondary">
                <Download size={16} /> Exporter
              </button>
              <button onClick={handleAddNew} className="btn btn-primary">
                <Plus size={16} /> Nouveau financement
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card stat-total">
              <div>
                <p className="stat-label">Total Financements</p>
                <p className="stat-number">{stats.total}</p>
              </div>
              <CreditCardIcon size={32} className="stat-icon" />
            </div>
            <div className="stat-card stat-active">
              <div>
                <p className="stat-label">Actifs</p>
                <p className="stat-number" style={{ color: '#16a34a' }}>{stats.active}</p>
              </div>
              <TrendingUp size={32} className="stat-icon" />
            </div>
            <div className="stat-card stat-vidange">
              <div>
                <p className="stat-label">Terminés</p>
                <p className="stat-number" style={{ color: '#1565c0' }}>{stats.completed}</p>
              </div>
              <Check size={32} className="stat-icon" />
            </div>
            <div className="stat-card stat-inactive">
              <div>
                <p className="stat-label">Montant restant</p>
                <p className="stat-number" style={{ color: '#dc2626', fontSize: '1.25rem' }}>{formatCurrency(stats.totalRemaining)}</p>
              </div>
              <AlertCircle size={32} className="stat-icon" />
            </div>
          </div>

          {/* Search + Status filter */}
          <div className="search-filter-section">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher par véhicule, matricule ou dossier..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="search-input"
              />
            </div>
            <div className="filter-group">
              <div className="filter-item">
                <label><AlertCircle size={14} /> Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="filter-select"
                >
                  <option value="all">Tous statuts</option>
                  <option value="active">Actif</option>
                  <option value="completed">Terminé</option>
                  <option value="late">En retard</option>
                  <option value="defaulted">Impayé</option>
                </select>
              </div>
            </div>
          </div>

          {filterParam === 'notifications' && (
            <div className="filter-indicator">
              <span className="filter-indicator-text">
                <AlertCircle size={16} /> Affichage des financements avec échéances en retard ou à venir (7 jours)
              </span>
              <button onClick={() => setSearchParams({})} className="clear-filter-btn">
                <X size={16} /> Effacer le filtre
              </button>
            </div>
          )}

          {/* Results summary */}
          <div className="results-summary">
            <span className="results-count">
              Affichage de {paginated.length} sur {filteredFinancings.length} financement(s)
              {filteredFinancings.length !== financings.length && ` (filtré sur ${financings.length} au total)`}
            </span>
            <span className="page-info">Page {currentPage} sur {totalPages || 1}</span>
          </div>

          <div className="content-container">
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("dossier")} className="sortable-header">Dossier N° {getSortIcon("dossier")}</th>
                    <th onClick={() => handleSort("vehicle")} className="sortable-header">Véhicule {getSortIcon("vehicle")}</th>
                    <th onClick={() => handleSort("matricule")} className="sortable-header">Matricule {getSortIcon("matricule")}</th>
                    <th onClick={() => handleSort("amount")} className="sortable-header">Montant {getSortIcon("amount")}</th>
                    <th onClick={() => handleSort("installment")} className="sortable-header">Mensualité {getSortIcon("installment")}</th>
                    <th onClick={() => handleSort("progress")} className="sortable-header">Progression {getSortIcon("progress")}</th>
                    <th onClick={() => handleSort("status")} className="sortable-header">Statut {getSortIcon("status")}</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-12">Aucun financement</td></tr>
                  ) : (
                    paginated.map(f => {
                      const info = getMatriculeInfo(f.matricule_id);
                      const progress = f.total_installments > 0 ? (f.current_installment_number / f.total_installments) * 100 : 0;
                      return (
                        <tr key={f.id}>
                          <td className="font-medium">{f.dossier_number}</td>
                          <td>{info && info.car ? `${info.car.brand} ${info.car.model}` : "—"}</td>
                          <td className="matricule-code">{info ? info.matricule_code : "—"}</td>
                          <td className="amount-cell">{formatCurrency(f.credit_amount)}</td>
                          <td className="installment-cell">{formatCurrency(f.installment_amount)}</td>
                          <td>
                            <div className="progress-container">
                              <div className="progress-label">{f.current_installment_number || 0} / {f.total_installments || 0} échéances</div>
                              <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${Math.min(100, progress)}%` }} />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${
                              f.status === "active" ? "badge-success" :
                              f.status === "completed" ? "badge-blue" :
                              f.status === "late" ? "badge-warning" : "badge-danger"
                            }`}>
                              {f.status === "active" ? <CheckCircle size={12} /> : f.status === "completed" ? <Check size={12} /> : <AlertTriangle size={12} />}
                              {f.status === "active" ? "Actif" : f.status === "completed" ? "Terminé" : f.status === "late" ? "En retard" : "Impayé"}
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="action-buttons-circular">
                              <button onClick={() => handleViewDetails(f)} className="icon-action-btn" title="Détails" style={{ color: "#06b6d4" }}>
                                <Eye size={16} />
                              </button>
                              <button onClick={() => openSchedulePrompt(f)} className="icon-action-btn" title="Générer échéancier" style={{ color: "#8b5cf6" }}>
                                <Calculator size={16} />
                              </button>
                              <button onClick={() => handleEdit(f)} className="icon-action-btn" title="Modifier" style={{ color: "#10b981" }}>
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDeleteClick(f)} className="icon-action-btn" title="Supprimer" style={{ color: "#ef4444" }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination-container">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={setItemsPerPage}
                  totalItems={filteredFinancings.length}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page-specific styles */}
      <style>{`
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
        .section-title svg { color: #667eea; stroke: #667eea; }
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

        /* ================= Stats ================= */
        .stats-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem; margin-bottom: 1.5rem;
        }
        .stat-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 1rem;
          padding: 1rem; transition: all 0.2s;
          display: flex; justify-content: space-between; align-items: center;
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        .stat-number { font-size: 1.875rem; font-weight: 700; color: #0f172a; line-height: 1; }
        .stat-label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0.35rem; }
        .stat-icon { opacity: 0.5; }

        /* ================= Search + filters ================= */
        .search-filter-section {
          background: #fff; padding: 1.5rem; border-radius: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 1.5rem;
          display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end;
          border: 1px solid #e2e8f0;
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
        .filter-select {
          padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0;
          border-radius: 0.5rem; font-size: 0.875rem; background: #fff;
          cursor: pointer; font-family: inherit; min-width: 12rem;
        }
        .filter-select:focus {
          outline: none; border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
        }

        /* ================= Filter indicator ================= */
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
          overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        /* ================= Table ================= */
        .data-table {
          width: 100%; font-size: 0.875rem; border-collapse: collapse; min-width: 1000px;
        }
        .data-table th {
          text-align: left; padding: 0.75rem 1rem; background: #f8fafc;
          color: #64748b; font-weight: 500; white-space: nowrap;
          border-bottom: 1px solid #e2e8f0;
        }
        .data-table td {
          padding: 0.75rem 1rem; border-top: 1px solid #e2e8f0;
          color: #334155; vertical-align: middle;
        }
        .data-table tr:hover { background: #f8fafc; }

        .sortable-header { cursor: pointer; user-select: none; transition: background-color 0.2s; }
        .sortable-header:hover { background-color: #e2e8f0; }
        .sort-icon { display: inline-block; margin-left: 4px; opacity: 0.5; vertical-align: middle; }
        .sort-icon.active { opacity: 1; color: #667eea; }

        /* ================= Action buttons ================= */
        .action-buttons-circular {
          display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center;
        }
        .icon-action-btn {
          padding: 0.5rem; background: none; border: none; cursor: pointer;
          border-radius: 0.5rem; transition: all 0.2s;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .icon-action-btn:hover:not(:disabled) { background: rgba(15, 23, 42, 0.06); }
        .icon-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ================= Pagination ================= */
        .pagination-container {
          padding: 2rem; display: flex; justify-content: center;
          border-top: 1px solid #f1f3f4;
        }

        /* ================= Badges ================= */
        .badge {
          display: inline-flex; align-items: center; gap: 0.25rem;
          padding: 0.25rem 0.625rem; border-radius: 9999px;
          font-size: 0.7rem; font-weight: 500; white-space: nowrap;
        }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-danger  { background: #fee2e2; color: #991b1b; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-blue    { background: #dbeafe; color: #1e40af; }
        .badge-paid    { background: #dcfce7; color: #166534; }
        .badge-pending { background: #fef3c7; color: #92400e; }

        /* ================= Table cells ================= */
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .matricule-code { font-family: 'Courier New', monospace; font-weight: 600; color: #667eea; }
        .amount-cell, .installment-cell { font-weight: 600; }
        .progress-container { min-width: 140px; }
        .progress-label { font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem; }
        .progress-bar { height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
        .progress-fill {
          height: 100%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 4px; transition: width 0.3s;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .py-12 { padding: 3rem 0; }

        /* ====================================================================
           Shared keyframes
           ==================================================================== */
        @keyframes amSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ====================================================================
           Full-screen overlay (form + details)
           ==================================================================== */
        .payment-fullscreen-overlay {
          position: fixed;
          top: 0; right: 0; bottom: 0; left: 0;
          background: #f8fafc;
          overflow-y: auto; overflow-x: hidden;
          z-index: 9999;
        }
        @media (min-width: 768px) {
          .payment-fullscreen-overlay { left: 18rem; }
        }

        .payment-form-modal,
        .payment-details-modal {
          background: #fff;
          border-radius: 32px;
          margin: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: amSlideIn 0.3s ease-out;
        }

        /* ============ Headers ============ */
        .payment-form-header,
        .payment-details-header {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 24px 32px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .payment-form-header-icon,
        .payment-details-header-icon {
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
        .payment-form-header-title,
        .payment-details-header-title { flex: 1; min-width: 0; padding-right: 48px; }
        .payment-form-header-title h2,
        .payment-details-header-title h2 {
          color: #fff;
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
        }
        .payment-form-header-title p,
        .payment-details-header-title p {
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.875rem;
          margin: 4px 0 0;
        }
        .payment-form-header-close,
        .payment-details-header-close {
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
        .payment-form-header-close:hover:not(:disabled),
        .payment-details-header-close:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.05);
        }
        .payment-form-header-close:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ============ Form body ============ */
        .payment-form { padding: 28px 32px; }
        .payment-form-body { display: flex; flex-direction: column; gap: 24px; }
        .payment-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          align-items: start;
        }
        .payment-form-col { display: flex; flex-direction: column; gap: 24px; }

        .payment-section {
          background: #f8fafc;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }
        .payment-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #667eea;
        }
        .payment-section-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        .payment-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .payment-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .payment-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .payment-required::after { content: " *"; color: #dc2626; }
        .payment-input {
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
        .payment-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .payment-textarea { resize: vertical; min-height: 80px; }

        .payment-info-grid { display: flex; flex-direction: column; gap: 12px; }
        .payment-info-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .payment-info-item .payment-info-label { font-size: 0.75rem; color: #64748b; }
        .payment-info-item .payment-info-value { font-size: 0.875rem; font-weight: 500; color: #1e293b; }

        .payment-form-footer {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .payment-btn-primary,
        .payment-btn-secondary {
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
        .payment-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          padding: 12px 28px;
          color: #fff;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        .payment-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        .payment-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .payment-btn-secondary {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          padding: 10px 24px;
          color: #475569;
        }
        .payment-btn-secondary:hover:not(:disabled) {
          border-color: #667eea;
          color: #667eea;
          background: #f8fafc;
        }
        .payment-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ============ Searchable matricule ============ */
        .payment-search-section {
          background: #fff;
          border-radius: 12px;
          padding: 12px;
          border: 1px solid #e2e8f0;
        }
        .payment-search-input-wrapper { position: relative; }
        .payment-search-input-wrapper svg {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%); color: #94a3b8;
        }
        .payment-search-input-wrapper .payment-input {
          padding-left: 42px;
          padding-right: 42px;
          width: 100%;
        }
        .payment-clear-search-btn {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #94a3b8; padding: 4px;
        }
        .payment-clear-search-btn:hover { color: #ef4444; }
        .payment-results {
          max-height: 250px; overflow-y: auto;
          margin-top: 8px; border-radius: 0.75rem;
          border: 1px solid #e2e8f0; background: #fff;
        }
        .payment-result-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; cursor: pointer;
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.2s;
        }
        .payment-result-item:hover { background: #f5f3ff; }
        .payment-result-avatar {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 36px; display: flex; align-items: center;
          justify-content: center; color: #fff; flex-shrink: 0;
        }
        .payment-result-info { flex: 1; }
        .payment-result-info strong { display: block; margin-bottom: 4px; font-size: 0.875rem; }
        .payment-result-details { display: flex; gap: 12px; font-size: 0.7rem; color: #64748b; flex-wrap: wrap; }
        .payment-selected {
          background: rgba(102,126,234,0.08);
          border-radius: 0.75rem; padding: 10px 14px;
          display: flex; align-items: center; gap: 10px; margin-top: 12px;
        }
        .payment-selected svg { color: #667eea; flex-shrink: 0; }
        .payment-selected strong { display: block; font-size: 0.7rem; color: #4338ca; }
        .payment-selected p { font-size: 0.8rem; font-weight: 500; margin: 0; }
        .payment-no-results {
          padding: 0.75rem; color: #64748b;
          font-size: 0.875rem; text-align: center;
        }

        /* ============ Details content ============ */
        .payment-details-content { padding: 28px 32px; }
        .payment-details-footer {
          display: flex; justify-content: flex-end; gap: 16px;
          padding: 20px 32px; border-top: 1px solid #e2e8f0; background: #f8fafc;
        }

        .payment-details-actions-bar {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
        }
        .payment-back-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 8px 16px; background: #f1f5f9; border: none;
          border-radius: 40px; font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .payment-back-btn:hover { background: #e2e8f0; }
        .payment-details-action-buttons { display: flex; gap: 0.5rem; }
        .payment-action-edit-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 8px 16px; background: #10b981; border: none;
          border-radius: 40px; font-size: 0.875rem; font-weight: 500;
          color: #fff; cursor: pointer;
        }
        .payment-action-edit-btn:hover { background: #059669; }
        .payment-action-delete-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 8px 16px; background: #ef4444; border: none;
          border-radius: 40px; font-size: 0.875rem; font-weight: 500;
          color: #fff; cursor: pointer;
        }
        .payment-action-delete-btn:hover { background: #dc2626; }

        .payment-financing-header-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem;
        }
        .payment-financing-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }
        .payment-stat-item-detail {
          background: rgba(255,255,255,0.15);
          padding: 0.75rem; border-radius: 0.75rem; text-align: center;
        }
        .payment-stat-value { font-size: 1.25rem; font-weight: 700; color: #fff; }
        .payment-stat-label-detail { font-size: 0.7rem; opacity: 0.9; margin-top: 0.25rem; color: #fff; }

        .payment-details-sections-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem; margin-bottom: 1.5rem;
        }
        .payment-detail-card {
          border: 1px solid #e2e8f0; border-radius: 1rem;
          overflow: hidden; background: #fff;
        }
        .payment-detail-card-title {
          background: #f8fafc; padding: 0.75rem 1rem;
          font-weight: 600; font-size: 0.875rem;
          display: flex; align-items: center; gap: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
        }
        .payment-detail-card-content { padding: 1rem; }
        .payment-info-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9;
        }
        .payment-info-row:last-child { border-bottom: none; }
        .payment-info-label { font-size: 0.75rem; color: #64748b; }
        .payment-info-value { font-size: 0.75rem; font-weight: 500; }
        .payment-matricule-value { font-family: 'Courier New', monospace; font-weight: 600; color: #667eea; }
        .payment-status-badge {
          padding: 0.25rem 0.625rem; border-radius: 9999px;
          font-size: 0.7rem; font-weight: 500;
        }
        .payment-status-active { background: #dcfce7; color: #166534; }
        .payment-status-completed { background: #dbeafe; color: #1e40af; }
        .payment-status-late { background: #fef3c7; color: #92400e; }
        .payment-progress-wrapper { display: flex; align-items: center; gap: 0.5rem; width: 100%; }
        .payment-progress-bar { height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden; flex: 1; }
        .payment-progress-fill {
          height: 100%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 4px; transition: width 0.3s;
        }
        .payment-progress-text { font-size: 0.7rem; color: #64748b; }

        .payment-notes-section {
          border: 1px solid #e2e8f0; border-radius: 1rem;
          overflow: hidden; margin-bottom: 1.5rem;
        }
        .payment-notes-title {
          background: #f8fafc; padding: 0.75rem 1rem;
          font-weight: 600; font-size: 0.875rem;
          display: flex; align-items: center; gap: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
        }
        .payment-notes-content { padding: 1rem; font-size: 0.875rem; line-height: 1.5; }

        .payment-payments-section {
          border: 1px solid #e2e8f0; border-radius: 1rem; overflow: hidden;
        }
        .payment-payments-section-header {
          background: #f8fafc; padding: 0.75rem 1rem;
          font-weight: 600; font-size: 0.875rem;
          display: flex; justify-content: space-between;
          align-items: center; border-bottom: 1px solid #e2e8f0;
        }
        .payment-generate-schedule-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border: none; border-radius: 20px;
          font-size: 0.7rem; font-weight: 500; color: #fff; cursor: pointer;
        }
        .payment-payments-table-wrapper { overflow-x: auto; }
        .payment-payments-table {
          width: 100%; font-size: 0.75rem;
          border-collapse: collapse; min-width: 800px;
        }
        .payment-payments-table th, .payment-payments-table td {
          padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0;
        }
        .payment-payments-table th {
          background: #f8fafc; font-weight: 600; color: #64748b;
        }
        .payment-record-payment-btn {
          display: inline-flex; align-items: center; gap: 0.25rem;
          padding: 0.25rem 0.5rem; background: #10b981;
          border: none; border-radius: 20px; font-size: 0.7rem;
          font-weight: 500; color: #fff; cursor: pointer;
        }

        /* ====================================================================
           Confirmation modals
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
          animation: fadeIn 0.2s ease;
        }
        .confirmation-modal {
          background: white; border-radius: 1.25rem;
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
          margin: 0 auto 1rem; font-size: 2rem;
        }
        .confirmation-icon.delete {
          background: rgba(220, 53, 69, 0.1); color: #dc3545;
          border: 2px solid rgba(220, 53, 69, 0.2);
        }
        .confirmation-icon.info {
          background: rgba(102, 126, 234, 0.1); color: #667eea;
          border: 2px solid rgba(102, 126, 234, 0.2);
        }
        .confirmation-title {
          font-size: 1.5rem; font-weight: 700;
          color: #0f172a; margin: 0;
        }
        .confirmation-subtitle {
          font-size: 0.75rem; color: #64748b;
          margin: 6px 0 0;
        }
        .confirmation-body { padding: 1.5rem 2rem; }
        .confirmation-message {
          color: #64748b; font-size: 1rem;
          line-height: 1.6; margin: 0; text-align: center;
        }
        .payment-dossier-chip {
          font-weight: 700; color: #0f172a;
          background: #f1f5f9; padding: 0.2rem 0.6rem;
          border-radius: 0.5rem; display: inline-block;
          margin: 0.35rem 0;
        }
        .payment-delete-warning {
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          background: rgba(220, 53, 69, 0.08);
          border: 1px solid rgba(220, 53, 69, 0.2);
          border-radius: 0.5rem;
          font-size: 0.75rem;
          color: #991b1b;
          text-align: center;
        }
        .confirmation-actions {
          padding: 1.5rem 2rem 2rem;
          display: flex; gap: 1rem; justify-content: flex-end;
        }
        .btn-confirm-cancel {
          padding: 0.75rem 1.5rem;
          border: 1px solid #cbd5e1;
          background: transparent; color: #64748b;
          border-radius: 0.75rem;
          font-size: 0.875rem; font-weight: 600;
          cursor: pointer; transition: all 0.3s ease;
          font-family: inherit;
        }
        .btn-confirm-cancel:hover { background: #f1f5f9; color: #334155; }
        .btn-confirm-delete {
          padding: 0.75rem 1.5rem; border: none;
          background: #ef4444; color: white;
          border-radius: 0.75rem; font-size: 0.875rem;
          font-weight: 600; cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-family: inherit;
        }
        .btn-confirm-delete:hover {
          background: #dc2626; transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
        }
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
        .btn-confirm-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ============ Prompt modals (interest + record payment) ============ */
        .payment-prompt-field { margin-bottom: 1rem; }
        .payment-prompt-field:last-child { margin-bottom: 0; }
        .payment-prompt-label {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.8rem; font-weight: 600;
          margin-bottom: 0.5rem; color: #0f172a;
        }
        .payment-prompt-input-wrapper { position: relative; }
        .payment-prompt-input {
          width: 100%; height: 2.75rem;
          padding: 0 0.75rem;
          border: 1.5px solid #e2e8f0; border-radius: 0.75rem;
          font-size: 0.875rem; background: #fff;
          font-family: inherit; box-sizing: border-box;
        }
        .payment-prompt-input-wrapper .payment-prompt-input { padding-right: 2.5rem; }
        .payment-prompt-input:focus {
          outline: none; border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
        }
        .payment-prompt-textarea {
          height: auto; min-height: 70px;
          resize: vertical; padding: 0.75rem;
        }
        .payment-prompt-unit {
          position: absolute; right: 0.75rem;
          top: 50%; transform: translateY(-50%);
          color: #64748b; font-size: 0.875rem; font-weight: 500;
        }
        .payment-prompt-note {
          font-size: 0.7rem; color: #64748b;
          margin-top: 0.75rem; padding: 0.5rem 0.75rem;
          background: #f1f5f9; border-radius: 0.5rem;
          display: flex; align-items: flex-start; gap: 0.5rem;
          line-height: 1.5;
        }
        .payment-prompt-note svg { flex-shrink: 0; margin-top: 2px; }
        .payment-prompt-grid-2 {
          display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
        }

        /* ================= Loading ================= */
        .loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: #64748b; }
        .spinner {
          width: 48px; height: 48px; border: 3px solid #e2e8f0;
          border-top: 3px solid #667eea; border-radius: 50%;
          animation: spin 1s linear infinite; margin-bottom: 1rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ================= Responsive ================= */
        @media (max-width: 1024px) {
          .payment-form-grid { grid-template-columns: 1fr; gap: 24px; }
          .section-header { flex-direction: column; }
          .section-actions { width: 100%; justify-content: flex-start; }
        }
        @media (max-width: 768px) {
          .search-filter-section { flex-direction: column; align-items: stretch; }
          .search-box { min-width: auto; }
          .filter-group { flex-direction: column; align-items: stretch; }
          .filter-select { width: 100%; }
          .payment-form-modal,
          .payment-details-modal { margin: 1rem; border-radius: 24px; }
          .payment-form-header,
          .payment-details-header { padding: 16px 20px; gap: 14px; }
          .payment-form-header-title h2,
          .payment-details-header-title h2 { font-size: 1.25rem; }
          .payment-form-header-title,
          .payment-details-header-title { padding-right: 40px; }
          .payment-form-header-icon,
          .payment-details-header-icon { width: 44px; height: 44px; border-radius: 22px; }
          .payment-form-header-close,
          .payment-details-header-close { top: 16px; right: 16px; width: 36px; height: 36px; }
          .payment-form,
          .payment-details-content { padding: 20px; }
          .payment-grid-2 { grid-template-columns: 1fr; }
          .payment-prompt-grid-2 { grid-template-columns: 1fr; }
          .payment-details-sections-grid { grid-template-columns: 1fr; }
          .payment-financing-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .payment-details-actions-bar { flex-direction: column; align-items: stretch; }
          .payment-details-action-buttons { justify-content: center; }
          .results-summary { flex-direction: column; gap: 0.5rem; align-items: flex-start; }
        }
      `}</style>
    </>
  );
}