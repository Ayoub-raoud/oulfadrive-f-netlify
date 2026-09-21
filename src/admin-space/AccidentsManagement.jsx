// src/components/AccidentsManagement.jsx
import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { pdf, PDFViewer } from '@react-pdf/renderer';
import { AccidentReportPDF } from '../components/pdf/AccidentReportPDF';
import { AccidentEstimatePDF } from '../components/pdf/AccidentEstimatePDF';
import { AccidentInvoicePDF } from '../components/pdf/AccidentInvoicePDF';
import PaginationControls from '../components/PaginationControls';
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  fetchAccidents,
  fetchMatricules,
  fetchCars,
  fetchClients,
  fetchGarages,
  fetchReservations,
  createAccident,
  updateAccident,
  deleteAccident,
  getAccidentNextStatuses,
  selectAccidents,
  selectMatricules,
  selectCars,
  selectClients,
  selectGarages,
  selectReservations,
  selectAccidentsLoading,
  selectToken,
} from "../Redux/store";
import { toast } from "sonner";
import {
  Plus, Edit2, Trash2, X, Eye, Search, RefreshCw, AlertTriangle,
  Car, User, Calendar, FileText, CheckCircle, AlertCircle,
  Building2, Phone, Wallet, Wrench, ArrowLeft, Info, ArrowUpDown,
  ArrowUp, ArrowDown, Printer, Download, Receipt, CheckSquare, Copy,
  Scale, Clock, Sparkles, Save, FileCheck, Filter, Palette
} from "lucide-react";

export default function AccidentsManagement() {
  const dispatch = useDispatch();
  const accidents = useSelector(selectAccidents);
  const matricules = useSelector(selectMatricules);
  const cars = useSelector(selectCars);
  const clients = useSelector(selectClients);
  const garages = useSelector(selectGarages);
  const reservations = useSelector(selectReservations);
  const loading = useSelector(selectAccidentsLoading);
  const token = useSelector(selectToken);

  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');

  // UI state
  const [showAccidentForm, setShowAccidentForm] = useState(false);
  const [showAccidentDetails, setShowAccidentDetails] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [accidentToDelete, setAccidentToDelete] = useState(null);
  const [selectedAccident, setSelectedAccident] = useState(null);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeStep, setActiveStep] = useState(0);
  const [nextStatuses, setNextStatuses] = useState([]);

  // Document preview state
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [documentPreviewType, setDocumentPreviewType] = useState(null);
  const [documentPreviewAccident, setDocumentPreviewAccident] = useState(null);

  // Sorting
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");

  // Searchable select states
  const [matriculeSearchTerm, setMatriculeSearchTerm] = useState('');
  const [filteredMatriculesList, setFilteredMatriculesList] = useState([]);
  const [selectedMatriculeObj, setSelectedMatriculeObj] = useState(null);

  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [filteredClientsList, setFilteredClientsList] = useState([]);
  const [selectedClientObj, setSelectedClientObj] = useState(null);

  const [reservationSearchTerm, setReservationSearchTerm] = useState('');
  const [selectedReservationObj, setSelectedReservationObj] = useState(null);

  const [garageSearchTerm, setGarageSearchTerm] = useState('');
  const [filteredGaragesList, setFilteredGaragesList] = useState([]);
  const [selectedGarageObj, setSelectedGarageObj] = useState(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payer: 'client',
    method: 'cash',
    reference: '',
    notes: ''
  });

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedRowId, setExpandedRowId] = useState(null);

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().slice(0, 10);
    } catch {
      return "";
    }
  };

  // Form data
  const [formData, setFormData] = useState({
    matricule_id: "",
    car_id: "",
    client_id: "",
    reservation_id: "",
    date_accident: new Date().toISOString().slice(0, 10),
    time_accident: "",
    location: "",
    description: "",
    police_report_number: "",
    amount_of_losses: 0,
    amount_assurance: 0,
    nom_expert: "",
    status: "open",
    accident_type: "grave",
    procedure_type: "classic",
    expert_decision: "pending",
    expert_amount: 0,
    expert_notes: "",
    notes: "",
    garage_id: "",
    inspection_notes: "",
    estimated_cost: 0,
    total_repair_cost: 0,
    franchise_amount: 0,
    insurance_paid: 0,
    client_paid: 0,
    total_paid: 0,
    remaining_amount: 0,
    internal_notes: "",
    closed_at: null,
    estimate_items: [],
    estimate_total_ht: 0,
    estimate_tva: 0,
    estimate_total_ttc: 0,
    estimate_status: "draft",
    estimate_number: "",
    repair_start_date: "",
    repair_end_date: "",
    repair_notes: "",
    invoice_number: "",
    invoice_items: [],
    invoice_total_ht: 0,
    invoice_tva: 0,
    invoice_total_ttc: 0,
    payments: [],
    img_accident: [],
    img_evaluation_expert: [],
    img_fixed: [],
    image_facture: [],
  });

  // Load initial data
  useEffect(() => {
    const load = async () => {
      await Promise.all([
        dispatch(fetchAccidents()),
        dispatch(fetchMatricules()),
        dispatch(fetchCars()),
        dispatch(fetchClients()),
        dispatch(fetchGarages()),
        dispatch(fetchReservations()),
      ]);
    };
    load();
  }, [dispatch]);

  useEffect(() => {
    if (editing && editing.id) {
      const loadNextStatuses = async () => {
        const result = await dispatch(getAccidentNextStatuses(editing.id));
        if (!result.error && result.payload) setNextStatuses(result.payload);
      };
      loadNextStatuses();
    }
  }, [editing, dispatch]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="sort-icon" />;
    return sortDirection === "asc"
      ? <ArrowUp size={12} className="sort-icon active" />
      : <ArrowDown size={12} className="sort-icon active" />;
  };

  // ✅ New statusConfig using reservation-style status-badge classes
  const statusConfig = {
    open: { label: "Ouvert", badge: "status-badge status-pending", icon: AlertCircle },
    under_review: { label: "En cours d'examen", badge: "status-badge status-contacted", icon: Eye },
    waiting_estimate: { label: "En attente de devis", badge: "status-badge status-pending", icon: Clock },
    estimate_approved: { label: "Devis approuvé", badge: "status-badge status-confirmed", icon: CheckCircle },
    under_repair: { label: "En réparation", badge: "status-badge status-retard", icon: Wrench },
    invoice_received: { label: "Facture reçue", badge: "status-badge status-contacted", icon: FileText },
    waiting_payment: { label: "En attente de paiement", badge: "status-badge status-pending", icon: Wallet },
    closed: { label: "Clos", badge: "status-badge status-completed", icon: CheckSquare },
    pending: { label: "Signalé", badge: "status-badge status-pending", icon: AlertCircle },
    evaluation_owner: { label: "Évaluation propriétaire", badge: "status-badge status-contacted", icon: User },
    "contact expert": { label: "Contact expert", badge: "status-badge status-contacted", icon: Phone },
    evaluation_expert: { label: "Évaluation expert", badge: "status-badge status-contacted", icon: Scale },
    fixed: { label: "Réparé", badge: "status-badge status-retard", icon: Wrench },
    waiting: { label: "En attente paiement", badge: "status-badge status-pending", icon: Clock },
    completed: { label: "Terminé", badge: "status-badge status-completed", icon: CheckCircle }
  };

  const filteredAccidents = useMemo(() => {
    return accidents.filter(acc => {
      const mat = matricules.find(m => m.id === acc.matricule_id);
      const client = clients.find(c => c.id === acc.client_id);
      const matchesSearch = searchTerm === '' ||
        (acc.notes && acc.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (acc.id && acc.id.toString().includes(searchTerm)) ||
        (mat?.matricule_code?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client && `${client.prenom} ${client.nom}`.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || acc.status === statusFilter;

      let matchesNotification = true;
      if (filterParam === 'notifications') {
        const daysSince = (new Date() - new Date(acc.date_accident)) / (1000 * 60 * 60 * 24);
        matchesNotification = daysSince <= 7 && acc.status !== 'completed' && acc.status !== 'closed';
      }

      return matchesSearch && matchesStatus && matchesNotification;
    }).sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case "id": aVal = a.id; bVal = b.id; break;
        case "date": aVal = new Date(a.date_accident); bVal = new Date(b.date_accident); break;
        case "matricule":
          aVal = matricules.find(m => m.id === a.matricule_id)?.matricule_code || "";
          bVal = matricules.find(m => m.id === b.matricule_id)?.matricule_code || "";
          break;
        case "client":
          const aClient = clients.find(c => c.id === a.client_id);
          const bClient = clients.find(c => c.id === b.client_id);
          aVal = aClient ? `${aClient.prenom} ${aClient.nom}` : "";
          bVal = bClient ? `${bClient.prenom} ${bClient.nom}` : "";
          break;
        case "losses": aVal = a.amount_of_losses || 0; bVal = b.amount_of_losses || 0; break;
        case "assurance": aVal = a.amount_assurance || 0; bVal = b.amount_assurance || 0; break;
        case "status": aVal = a.status || ""; bVal = b.status || ""; break;
        default: aVal = a.id; bVal = b.id;
      }
      return sortDirection === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }, [accidents, searchTerm, statusFilter, sortField, sortDirection, matricules, clients, filterParam]);

  const totalPages = Math.ceil(filteredAccidents.length / itemsPerPage);
  const paginatedAccidents = filteredAccidents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Estimate items
  const addEstimateItem = () => setFormData(prev => ({
    ...prev, estimate_items: [...prev.estimate_items, { name: '', quantity: 1, unit_price: 0 }]
  }));
  const removeEstimateItem = (index) => setFormData(prev => ({
    ...prev, estimate_items: prev.estimate_items.filter((_, i) => i !== index)
  }));
  const updateEstimateItem = (index, field, value) => setFormData(prev => {
    const items = [...prev.estimate_items];
    items[index] = { ...items[index], [field]: value };
    return { ...prev, estimate_items: items };
  });

  // Invoice items
  const addInvoiceItem = () => setFormData(prev => ({
    ...prev, invoice_items: [...prev.invoice_items, { name: '', quantity: 1, unit_price: 0 }]
  }));
  const removeInvoiceItem = (index) => setFormData(prev => ({
    ...prev, invoice_items: prev.invoice_items.filter((_, i) => i !== index)
  }));
  const updateInvoiceItem = (index, field, value) => setFormData(prev => {
    const items = [...prev.invoice_items];
    items[index] = { ...items[index], [field]: value };
    return { ...prev, invoice_items: items };
  });

  const copyEstimateToInvoice = () => {
    setFormData(prev => ({
      ...prev,
      invoice_items: JSON.parse(JSON.stringify(prev.estimate_items || [])),
    }));
    toast.info("Articles du devis copiés vers la facture");
  };

  useEffect(() => {
    const estItems = formData.estimate_items || [];
    const estHT = estItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0), 0);
    setFormData(prev => ({ ...prev, estimate_total_ht: estHT, estimate_tva: 0, estimate_total_ttc: estHT }));
  }, [formData.estimate_items]);

  useEffect(() => {
    const invItems = formData.invoice_items || [];
    const invHT = invItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0), 0);
    setFormData(prev => ({ ...prev, invoice_total_ht: invHT, invoice_tva: 0, invoice_total_ttc: invHT }));
  }, [formData.invoice_items]);

  const filteredReservationsList = useMemo(() => {
    if (!reservationSearchTerm && !formData.matricule_id && !formData.date_accident && !formData.time_accident) {
      return [];
    }
    let base = reservations;
    if (formData.matricule_id) {
      base = base.filter(r => r.matricule_id === parseInt(formData.matricule_id));
    }
    if (formData.date_accident) {
      const accidentDate = new Date(formData.date_accident);
      base = base.filter(r => {
        const start = new Date(r.start_date);
        const end = new Date(r.end_date);
        accidentDate.setHours(0,0,0,0);
        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);
        return accidentDate >= start && accidentDate <= end;
      });
    }
    if (formData.time_accident) {
      const accidentTime = formData.time_accident;
      base = base.filter(r => {
        if (r.start_time && r.end_time) {
          return accidentTime >= r.start_time && accidentTime <= r.end_time;
        }
        return true;
      });
    }
    const lower = reservationSearchTerm.toLowerCase().trim();
    if (lower) {
      base = base.filter(res => {
        const client = clients.find(c => c.id === res.client_id);
        const clientName = client ? `${client.prenom} ${client.nom}`.toLowerCase() : '';
        const startDate = new Date(res.start_date).toLocaleDateString("fr-FR");
        const endDate = new Date(res.end_date).toLocaleDateString("fr-FR");
        return (
          res.id.toString().includes(lower) ||
          clientName.includes(lower) ||
          startDate.includes(lower) ||
          endDate.includes(lower)
        );
      });
    }
    return base.slice(0, 10);
  }, [reservations, formData.matricule_id, formData.date_accident, formData.time_accident, reservationSearchTerm, clients]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let result;
      if (editing) {
        result = await dispatch(updateAccident({ id: editing.id, data: formData }));
      } else {
        result = await dispatch(createAccident(formData));
      }
      if (result.error) toast.error(result.payload);
      else {
        toast.success(editing ? "Accident modifié" : "Accident créé");
        setShowAccidentForm(false);
        setEditing(null);
        resetForm();
        await Promise.all([
          dispatch(fetchAccidents(true)),
          dispatch(fetchMatricules(true)),
          dispatch(fetchCars(true)),
          dispatch(fetchClients(true)),
          dispatch(fetchGarages(true)),
          dispatch(fetchReservations(true))
        ]);
      }
    } catch (error) {
      toast.error("Erreur lors de l'opération");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      matricule_id: "", car_id: "", client_id: "", reservation_id: "",
      date_accident: new Date().toISOString().slice(0, 10),
      time_accident: "", location: "", description: "", police_report_number: "",
      amount_of_losses: 0, amount_assurance: 0, nom_expert: "",
      status: "open", accident_type: "grave", procedure_type: "classic",
      expert_decision: "pending", expert_amount: 0, expert_notes: "",
      notes: "", garage_id: "", inspection_notes: "",
      estimated_cost: 0, total_repair_cost: 0, franchise_amount: 0,
      insurance_paid: 0, client_paid: 0, total_paid: 0, remaining_amount: 0,
      internal_notes: "", closed_at: null,
      estimate_items: [], estimate_total_ht: 0, estimate_tva: 0, estimate_total_ttc: 0,
      estimate_status: "draft", estimate_number: "",
      repair_start_date: "", repair_end_date: "", repair_notes: "",
      invoice_number: "", invoice_items: [], invoice_total_ht: 0, invoice_tva: 0, invoice_total_ttc: 0,
      payments: [],
      img_accident: [], img_evaluation_expert: [], img_fixed: [], image_facture: [],
    });
    setSelectedMatriculeObj(null);
    setMatriculeSearchTerm('');
    setFilteredMatriculesList([]);
    setSelectedClientObj(null);
    setClientSearchTerm('');
    setFilteredClientsList([]);
    setSelectedReservationObj(null);
    setReservationSearchTerm('');
    setSelectedGarageObj(null);
    setGarageSearchTerm('');
    setFilteredGaragesList([]);
    setActiveStep(0);
  };

  const handleEdit = (acc) => {
    setEditing(acc);
    setFormData({
      ...acc,
      date_accident: formatDateForInput(acc.date_accident),
      repair_start_date: formatDateForInput(acc.repair_start_date),
      repair_end_date: formatDateForInput(acc.repair_end_date),
      closed_at: acc.closed_at ? formatDateForInput(acc.closed_at) : null,
      img_accident: acc.img_accident || [],
      img_evaluation_expert: acc.img_evaluation_expert || [],
      img_fixed: acc.img_fixed || [],
      image_facture: acc.image_facture || [],
      estimate_items: acc.estimate_items || [],
      invoice_items: acc.invoice_items || [],
      payments: acc.payments || [],
      status: acc.status || "open",
      estimate_number: acc.estimate_number || "",
    });

    if (acc.matricule_id) {
      const mat = matricules.find(m => m.id === acc.matricule_id);
      if (mat) {
        setSelectedMatriculeObj(mat);
        const car = cars.find(c => c.id === mat.car_id);
        setMatriculeSearchTerm(`${mat.matricule_code} - ${car ? `${car.brand} ${car.model}` : 'N/A'}`);
      }
    }
    if (acc.client_id) {
      const client = clients.find(c => c.id === acc.client_id);
      if (client) {
        setSelectedClientObj(client);
        setClientSearchTerm(`${client.prenom} ${client.nom} - ${client.telephone}`);
      }
    }
    if (acc.reservation_id) {
      const res = reservations.find(r => r.id === acc.reservation_id);
      if (res) {
        setSelectedReservationObj(res);
        const client = clients.find(c => c.id === res.client_id);
        setReservationSearchTerm(
          `#${res.id} - ${new Date(res.start_date).toLocaleDateString("fr-FR")} → ${new Date(res.end_date).toLocaleDateString("fr-FR")} - Client: ${client ? `${client.prenom} ${client.nom}` : 'N/A'}`
        );
      }
    }
    if (acc.garage_id) {
      const garage = garages.find(g => g.id === acc.garage_id);
      if (garage) {
        setSelectedGarageObj(garage);
        setGarageSearchTerm(`${garage.name} - ${garage.address || garage.phone || ''}`);
      }
    }

    setShowAccidentForm(true);
    setActiveStep(0);
  };

  const handleViewDetails = (accident) => {
    setSelectedAccident(accident);
    setShowAccidentDetails(true);
  };

  const handleAddNew = () => {
    setEditing(null);
    resetForm();
    setShowAccidentForm(true);
  };

  const handleDeleteClick = (accident) => {
    setAccidentToDelete(accident);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!accidentToDelete) return;
    const result = await dispatch(deleteAccident(accidentToDelete.id));
    if (result.error) toast.error(result.payload);
    else toast.success("Accident supprimé");
    setDeleteModalOpen(false);
    setAccidentToDelete(null);
  };

  const refreshData = async () => {
    await Promise.all([
      dispatch(fetchAccidents(true)),
      dispatch(fetchMatricules(true)),
      dispatch(fetchCars(true)),
      dispatch(fetchClients(true)),
      dispatch(fetchGarages(true)),
      dispatch(fetchReservations(true))
    ]);
    toast.success("Données actualisées");
  };

  const openDocumentPreview = (type, accident) => {
    setDocumentPreviewType(type);
    setDocumentPreviewAccident(accident);
    setShowDocumentPreview(true);
  };

  const closeDocumentPreview = () => {
    setShowDocumentPreview(false);
    setDocumentPreviewType(null);
    setDocumentPreviewAccident(null);
  };

  const downloadDocument = async (accidentId, type) => {
    const accident = accidents.find(a => a.id === accidentId);
    if (!accident) {
      toast.error("Données de l'accident introuvables");
      return;
    }
    let PdfComponent, fileName;
    switch (type) {
      case 'report':
        PdfComponent = AccidentReportPDF;
        fileName = `Rapport_Accident_${accident.accident_number || accident.id}.pdf`;
        break;
      case 'estimate':
        PdfComponent = AccidentEstimatePDF;
        fileName = `Devis_${accident.estimate_number || accident.accident_number || accident.id}.pdf`;
        break;
      case 'invoice':
        PdfComponent = AccidentInvoicePDF;
        fileName = `Facture_${accident.invoice_number || accident.accident_number || accident.id}.pdf`;
        break;
      default:
        toast.error('Type de document invalide');
        return;
    }
    try {
      const blob = await pdf(<PdfComponent accident={accident} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Document téléchargé');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const openPaymentModal = () => {
    setPaymentForm({ amount: '', payer: 'client', method: 'cash', reference: '', notes: '' });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = () => {
    const amount = parseFloat(paymentForm.amount);
    if (!paymentForm.amount || isNaN(amount) || amount <= 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }
    const newPayment = {
      amount,
      payer: paymentForm.payer,
      date: new Date().toISOString().slice(0, 10),
      method: paymentForm.method,
      reference: paymentForm.reference || "",
      notes: paymentForm.notes || "",
    };

    setFormData(prev => {
      const updatedPayments = [...(prev.payments || []), newPayment];
      let clientTotal = 0, insuranceTotal = 0;
      updatedPayments.forEach(p => {
        if (p.payer === 'client') clientTotal += p.amount;
        else if (p.payer === 'insurance') insuranceTotal += p.amount;
      });
      return {
        ...prev,
        payments: updatedPayments,
        client_paid: clientTotal,
        insurance_paid: insuranceTotal,
        total_paid: clientTotal + insuranceTotal,
        remaining_amount: (prev.total_repair_cost || 0) - (clientTotal + insuranceTotal)
      };
    });
    toast.success("Paiement ajouté");
    setShowPaymentModal(false);
  };

  const openCloseModal = () => setShowCloseModal(true);
  const handleCloseConfirm = async () => {
    if (editing) {
      const result = await dispatch(updateAccident({
        id: editing.id,
        data: { ...formData, status: 'closed', closed_at: new Date().toISOString() }
      }));
      if (result.error) toast.error(result.payload);
      else {
        toast.success("Accident clôturé");
        dispatch(fetchAccidents(true));
        setShowAccidentForm(false);
        setEditing(null);
        resetForm();
      }
    }
    setShowCloseModal(false);
  };

  const handleMatriculeSearch = (term) => {
    setMatriculeSearchTerm(term);
    if (term.trim() === '') { setFilteredMatriculesList([]); return; }
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
    setFormData(prev => ({
      ...prev,
      matricule_id: mat.id,
      car_id: mat.car_id || '',
      reservation_id: '',
    }));
    setFilteredMatriculesList([]);
    setSelectedReservationObj(null);
    setReservationSearchTerm('');
  };

  const clearMatriculeSelection = () => {
    setSelectedMatriculeObj(null);
    setMatriculeSearchTerm('');
    setFilteredMatriculesList([]);
    setSelectedReservationObj(null);
    setReservationSearchTerm('');
    setFormData(prev => ({ ...prev, matricule_id: '', car_id: '', reservation_id: '' }));
  };

  const handleClientSearch = (term) => {
    setClientSearchTerm(term);
    if (term.trim() === '') { setFilteredClientsList([]); return; }
    const lower = term.toLowerCase().trim();
    const filtered = clients.filter(c =>
      `${c.prenom} ${c.nom} ${c.telephone} ${c.email}`.toLowerCase().includes(lower)
    );
    setFilteredClientsList(filtered.slice(0, 10));
  };

  const handleClientSelect = (client) => {
    setSelectedClientObj(client);
    setClientSearchTerm(`${client.prenom} ${client.nom} - ${client.telephone}`);
    setFormData(prev => ({ ...prev, client_id: client.id }));
    setFilteredClientsList([]);
  };

  const clearClientSelection = () => {
    setSelectedClientObj(null);
    setClientSearchTerm('');
    setFilteredClientsList([]);
    setFormData(prev => ({ ...prev, client_id: '' }));
  };

  const handleReservationSearch = (term) => setReservationSearchTerm(term);

  const handleReservationSelect = (res) => {
    setSelectedReservationObj(res);
    const client = clients.find(c => c.id === res.client_id);
    const mat = matricules.find(m => m.id === res.matricule_id);
    const car = mat ? cars.find(c => c.id === mat.car_id) : null;

    setReservationSearchTerm(
      `#${res.id} - ${new Date(res.start_date).toLocaleDateString("fr-FR")} → ${new Date(res.end_date).toLocaleDateString("fr-FR")} - Client: ${client ? `${client.prenom} ${client.nom}` : 'N/A'}`
    );

    setFormData(prev => ({
      ...prev,
      reservation_id: res.id,
      client_id: res.client_id,
      matricule_id: mat ? mat.id : '',
      car_id: car ? car.id : '',
    }));

    if (client) {
      setSelectedClientObj(client);
      setClientSearchTerm(`${client.prenom} ${client.nom} - ${client.telephone}`);
    }
    if (mat) {
      setSelectedMatriculeObj(mat);
      setMatriculeSearchTerm(`${mat.matricule_code} - ${car ? `${car.brand} ${car.model}` : 'N/A'}`);
    } else {
      setSelectedMatriculeObj(null);
      setMatriculeSearchTerm('');
    }
  };

  const clearReservationSelection = () => {
    setSelectedReservationObj(null);
    setReservationSearchTerm('');
    setFormData(prev => ({ ...prev, reservation_id: '' }));
  };

  const handleGarageSearch = (term) => {
    setGarageSearchTerm(term);
    if (term.trim() === '') { setFilteredGaragesList([]); return; }
    const lower = term.toLowerCase().trim();
    const filtered = garages.filter(g =>
      `${g.name} ${g.address} ${g.phone}`.toLowerCase().includes(lower)
    );
    setFilteredGaragesList(filtered.slice(0, 10));
  };

  const handleGarageSelect = (garage) => {
    setSelectedGarageObj(garage);
    setGarageSearchTerm(`${garage.name} - ${garage.address || garage.phone || ''}`);
    setFormData(prev => ({ ...prev, garage_id: garage.id }));
    setFilteredGaragesList([]);
  };

  const clearGarageSelection = () => {
    setSelectedGarageObj(null);
    setGarageSearchTerm('');
    setFilteredGaragesList([]);
    setFormData(prev => ({ ...prev, garage_id: '' }));
  };

  // ==================== STEP RENDERERS ====================
  const renderAccidentDetails = () => (
    <div className="step-content">
      <div className="inline-grid-2">
        <div className="inline-field">
          <label>Date de l'accident *</label>
          <input type="date" required value={formData.date_accident}
            onChange={(e) => setFormData({...formData, date_accident: e.target.value})} className="inline-input" />
        </div>
        <div className="inline-field">
          <label>Heure</label>
          <input type="time" value={formData.time_accident}
            onChange={(e) => setFormData({...formData, time_accident: e.target.value})} className="inline-input" />
        </div>
        <div className="inline-field">
          <label>Lieu</label>
          <input type="text" value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            className="inline-input" placeholder="Ex: Autoroute Casablanca" />
        </div>
        <div className="inline-field">
          <label>Rapport de police (n°)</label>
          <input type="text" value={formData.police_report_number}
            onChange={(e) => setFormData({...formData, police_report_number: e.target.value})} className="inline-input" />
        </div>
        <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
          <label>Description de l'accident</label>
          <textarea rows="3" value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="inline-textarea" placeholder="Décrivez les circonstances de l'accident..." />
        </div>

        {/* Matricule */}
        <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
          <label>Véhicule (Matricule) *</label>
          <div className="inline-search-section">
            <div className="inline-search-input-wrapper">
              <Search size={18} />
              <input type="text" className="inline-input" value={matriculeSearchTerm}
                onChange={(e) => handleMatriculeSearch(e.target.value)}
                placeholder="Rechercher un matricule (plaque, marque, modèle)..." required />
              {selectedMatriculeObj && (
                <button type="button" className="clear-search-btn" onClick={clearMatriculeSelection} title="Effacer">
                  <X size={18} />
                </button>
              )}
            </div>
            {filteredMatriculesList.length > 0 && (
              <div className="inline-results">
                {filteredMatriculesList.map(mat => {
                  const car = cars.find(c => c.id === mat.car_id);
                  return (
                    <div key={mat.id} className="inline-result-item" onClick={() => handleMatriculeSelect(mat)}>
                      <div className="inline-result-avatar"><Car size={20} /></div>
                      <div className="inline-result-info">
                        <strong>{mat.matricule_code}</strong>
                        <div className="inline-result-details">
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
              <div className="inline-selected">
                <CheckCircle size={20} />
                <div>
                  <strong>Matricule sélectionné</strong>
                  <p>
                    {selectedMatriculeObj.matricule_code} - {cars.find(c => c.id === selectedMatriculeObj.car_id)?.brand} {cars.find(c => c.id === selectedMatriculeObj.car_id)?.model} ({selectedMatriculeObj.kilometrage?.toLocaleString()} km)
                  </p>
                </div>
              </div>
            )}
            {!selectedMatriculeObj && matriculeSearchTerm.trim() !== "" && filteredMatriculesList.length === 0 && (
              <div className="inline-no-results">Aucun matricule trouvé.</div>
            )}
          </div>
        </div>

        {/* Client */}
        <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
          <label>Client *</label>
          <div className="inline-search-section">
            <div className="inline-search-input-wrapper">
              <Search size={18} />
              <input type="text" className="inline-input" value={clientSearchTerm}
                onChange={(e) => handleClientSearch(e.target.value)}
                placeholder="Rechercher un client (nom, prénom, téléphone)..." required />
              {selectedClientObj && (
                <button type="button" className="clear-search-btn" onClick={clearClientSelection} title="Effacer">
                  <X size={18} />
                </button>
              )}
            </div>
            {filteredClientsList.length > 0 && (
              <div className="inline-results">
                {filteredClientsList.map(client => (
                  <div key={client.id} className="inline-result-item" onClick={() => handleClientSelect(client)}>
                    <div className="inline-result-avatar"><User size={20} /></div>
                    <div className="inline-result-info">
                      <strong>{client.prenom} {client.nom}</strong>
                      <div className="inline-result-details">
                        <span>{client.telephone}</span>
                        <span>{client.email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedClientObj && (
              <div className="inline-selected">
                <CheckCircle size={20} />
                <div>
                  <strong>Client sélectionné</strong>
                  <p>{selectedClientObj.prenom} {selectedClientObj.nom} - {selectedClientObj.telephone}</p>
                </div>
              </div>
            )}
            {!selectedClientObj && clientSearchTerm.trim() !== "" && filteredClientsList.length === 0 && (
              <div className="inline-no-results">Aucun client trouvé.</div>
            )}
          </div>
        </div>

        {/* Réservation */}
        <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
          <label>Réservation (optionnel)</label>
          <div className="inline-search-section">
            <div className="inline-search-input-wrapper">
              <Search size={18} />
              <input type="text" className="inline-input" value={reservationSearchTerm}
                onChange={(e) => handleReservationSearch(e.target.value)}
                placeholder="Rechercher une réservation (ID, client, dates)..." />
              {selectedReservationObj && (
                <button type="button" className="clear-search-btn" onClick={clearReservationSelection} title="Effacer">
                  <X size={18} />
                </button>
              )}
            </div>
            {filteredReservationsList.length > 0 && (
              <div className="inline-results">
                {filteredReservationsList.map(res => {
                  const client = clients.find(c => c.id === res.client_id);
                  return (
                    <div key={res.id} className="inline-result-item" onClick={() => handleReservationSelect(res)}>
                      <div className="inline-result-avatar"><Calendar size={20} /></div>
                      <div className="inline-result-info">
                        <strong>#{res.id}</strong>
                        <div className="inline-result-details">
                          <span>{new Date(res.start_date).toLocaleDateString("fr-FR")} → {new Date(res.end_date).toLocaleDateString("fr-FR")}</span>
                          <span>Client: {client ? `${client.prenom} ${client.nom}` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedReservationObj && (
              <div className="inline-selected">
                <CheckCircle size={20} />
                <div>
                  <strong>Réservation sélectionnée</strong>
                  <p>#{selectedReservationObj.id} - {new Date(selectedReservationObj.start_date).toLocaleDateString("fr-FR")} → {new Date(selectedReservationObj.end_date).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="inline-field">
          <label>Type d'accident</label>
          <select value={formData.accident_type}
            onChange={(e) => setFormData({...formData, accident_type: e.target.value})} className="inline-select">
            <option value="grave">Grave</option>
            <option value="non_grave">Non-grave</option>
          </select>
        </div>
        <div className="inline-field">
          <label>Montant des pertes (DH) *</label>
          <input type="number" step="0.01" required value={formData.amount_of_losses}
            onChange={(e) => setFormData({...formData, amount_of_losses: parseFloat(e.target.value) || 0})} className="inline-input" />
        </div>
        <div className="inline-field">
          <label>Montant assurance (DH)</label>
          <input type="number" step="0.01" value={formData.amount_assurance}
            onChange={(e) => setFormData({...formData, amount_assurance: parseFloat(e.target.value) || 0})} className="inline-input" />
        </div>
        <div className="inline-field">
          <label>Statut initial</label>
          <select value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})} className="inline-select">
            {Object.entries(statusConfig).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
        <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
          <label>Notes</label>
          <textarea rows="2" value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})} className="inline-textarea" />
        </div>
      </div>
    </div>
  );

  const renderGarageInspection = () => (
    <div className="step-content">
      <div className="inline-grid-2">
        <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
          <label>Garage</label>
          <div className="inline-search-section">
            <div className="inline-search-input-wrapper">
              <Search size={18} />
              <input type="text" className="inline-input" value={garageSearchTerm}
                onChange={(e) => handleGarageSearch(e.target.value)}
                placeholder="Rechercher un garage (nom, adresse, téléphone)..." />
              {selectedGarageObj && (
                <button type="button" className="clear-search-btn" onClick={clearGarageSelection} title="Effacer">
                  <X size={18} />
                </button>
              )}
            </div>
            {filteredGaragesList.length > 0 && (
              <div className="inline-results">
                {filteredGaragesList.map(garage => (
                  <div key={garage.id} className="inline-result-item" onClick={() => handleGarageSelect(garage)}>
                    <div className="inline-result-avatar"><Building2 size={20} /></div>
                    <div className="inline-result-info">
                      <strong>{garage.name}</strong>
                      <div className="inline-result-details">
                        <span>{garage.address || 'N/A'}</span>
                        <span>{garage.phone}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedGarageObj && (
              <div className="inline-selected">
                <CheckCircle size={20} />
                <div>
                  <strong>Garage sélectionné</strong>
                  <p>{selectedGarageObj.name} - {selectedGarageObj.address || selectedGarageObj.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="inline-field">
          <label>Coût estimé (DH)</label>
          <input type="number" step="0.01" value={formData.estimated_cost}
            onChange={(e) => setFormData({...formData, estimated_cost: parseFloat(e.target.value) || 0})} className="inline-input" />
        </div>
        <div className="inline-field">
          <label>Expert</label>
          <input type="text" value={formData.nom_expert}
            onChange={(e) => setFormData({...formData, nom_expert: e.target.value})} className="inline-input" placeholder="Nom de l'expert" />
        </div>
        <div className="inline-field">
          <label>Décision expert</label>
          <select value={formData.expert_decision}
            onChange={(e) => setFormData({...formData, expert_decision: e.target.value})} className="inline-select">
            <option value="pending">En attente</option>
            <option value="accepted">Accepté</option>
            <option value="rejected">Rejeté</option>
          </select>
        </div>
        <div className="inline-field">
          <label>Montant expert (DH)</label>
          <input type="number" step="0.01" value={formData.expert_amount}
            onChange={(e) => setFormData({...formData, expert_amount: parseFloat(e.target.value) || 0})} className="inline-input" />
        </div>
        <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
          <label>Notes d'inspection</label>
          <textarea rows="3" value={formData.inspection_notes}
            onChange={(e) => setFormData({...formData, inspection_notes: e.target.value})}
            className="inline-textarea" placeholder="Résultat de l'inspection par le garage..." />
        </div>
        <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
          <label>Notes expert</label>
          <textarea rows="2" value={formData.expert_notes}
            onChange={(e) => setFormData({...formData, expert_notes: e.target.value})} className="inline-textarea" />
        </div>
      </div>
    </div>
  );

  const renderEstimate = () => (
    <div className="step-content">
      <div className="inline-grid-2">
        <div className="inline-field">
          <label>Statut devis</label>
          <select value={formData.estimate_status}
            onChange={(e) => setFormData({...formData, estimate_status: e.target.value})} className="inline-select">
            <option value="draft">Brouillon</option>
            <option value="sent">Envoyé</option>
            <option value="approved">Approuvé</option>
            <option value="rejected">Rejeté</option>
          </select>
        </div>
        <div className="inline-field">
          <label>Numéro de devis</label>
          <input type="text" value={formData.estimate_number}
            onChange={(e) => setFormData({...formData, estimate_number: e.target.value})}
            className="inline-input" placeholder="DEV-2026-001" />
        </div>
        <div className="inline-field">
          <label>Franchise (DH)</label>
          <input type="number" step="0.01" value={formData.franchise_amount}
            onChange={(e) => setFormData({...formData, franchise_amount: parseFloat(e.target.value) || 0})} className="inline-input" />
        </div>
        <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
          <label>Articles du devis</label>
          <div className="items-table-wrapper">
            {formData.estimate_items.length === 0 ? (
              <div className="items-empty">Aucun article</div>
            ) : (
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th style={{ width: '80px' }}>Qté</th>
                    <th style={{ width: '100px' }}>Prix unit.</th>
                    <th style={{ width: '100px' }}>Total</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.estimate_items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <input type="text" value={item.name || ''}
                          onChange={(e) => updateEstimateItem(idx, 'name', e.target.value)}
                          placeholder="Nom de l'article" className="item-input" />
                      </td>
                      <td>
                        <input type="number" min="0" step="1" value={item.quantity || 1}
                          onChange={(e) => updateEstimateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="item-input item-input-sm" />
                      </td>
                      <td>
                        <input type="number" min="0" step="0.01" value={item.unit_price || 0}
                          onChange={(e) => updateEstimateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="item-input item-input-sm" />
                      </td>
                      <td className="item-total">
                        {((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)} DH
                      </td>
                      <td>
                        <button type="button" onClick={() => removeEstimateItem(idx)} className="item-remove-btn">
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="items-total-row">
                    <td colSpan="3" style={{ textAlign: 'right' }}>Total HT</td>
                    <td>{Number(formData.estimate_total_ht || 0).toFixed(2)} DH</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
            <button type="button" onClick={addEstimateItem} className="item-add-btn">
              <Plus size={16} /> Ajouter un article
            </button>
          </div>
        </div>
        <div className="inline-field" style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", flexWrap: 'wrap' }}>
          <button type="button" className="inline-secondary-btn"
            onClick={() => { if (editing) openDocumentPreview('estimate', editing); }}>
            <Printer size={16} /> Aperçu Devis
          </button>
          <button type="button" className="inline-primary-btn"
            onClick={() => {
              setFormData({...formData, estimate_status: 'approved'});
              toast.success("Devis approuvé");
            }}>
            <CheckCircle size={16} /> Approuver le devis
          </button>
        </div>
      </div>
    </div>
  );

  const renderRepair = () => (
    <div className="step-content">
      <div className="inline-grid-2">
        <div className="inline-field">
          <label>Date début réparation</label>
          <input type="date" value={formData.repair_start_date}
            onChange={(e) => setFormData({...formData, repair_start_date: e.target.value})} className="inline-input" />
        </div>
        <div className="inline-field">
          <label>Date fin réparation</label>
          <input type="date" value={formData.repair_end_date}
            onChange={(e) => setFormData({...formData, repair_end_date: e.target.value})} className="inline-input" />
        </div>
        <div className="inline-field">
          <label>Coût total réparation (DH)</label>
          <input type="number" step="0.01" value={formData.total_repair_cost}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              setFormData(prev => ({ ...prev, total_repair_cost: val, remaining_amount: val - prev.total_paid }));
            }} className="inline-input" />
        </div>
        <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
          <label>Notes réparation</label>
          <textarea rows="3" value={formData.repair_notes}
            onChange={(e) => setFormData({...formData, repair_notes: e.target.value})}
            className="inline-textarea" placeholder="Suivi des réparations..." />
        </div>
        <div className="inline-field" style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", flexWrap: 'wrap' }}>
          <button type="button" className="inline-secondary-btn"
            onClick={() => { setFormData({...formData, status: 'under_repair'}); toast.success("Statut mis à jour: En réparation"); }}>
            <Wrench size={16} /> Démarrer la réparation
          </button>
          <button type="button" className="inline-primary-btn"
            onClick={() => {
              setFormData({...formData, status: 'invoice_received', repair_end_date: new Date().toISOString().slice(0, 10)});
              toast.success("Réparation terminée");
            }}>
            <CheckCircle size={16} /> Terminer la réparation
          </button>
        </div>
      </div>
    </div>
  );

  const renderInvoice = () => (
    <div className="step-content">
      <div className="inline-grid-2">
        <div className="inline-field">
          <label>Numéro facture</label>
          <input type="text" value={formData.invoice_number}
            onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
            className="inline-input" placeholder="FACT-2026-001" />
        </div>
        <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button type="button" className="inline-secondary-btn" onClick={copyEstimateToInvoice}>
              <Copy size={16} /> Copier le devis
            </button>
          </div>
          <label>Articles de la facture</label>
          <div className="items-table-wrapper">
            {formData.invoice_items.length === 0 ? (
              <div className="items-empty">Aucun article</div>
            ) : (
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th style={{ width: '80px' }}>Qté</th>
                    <th style={{ width: '100px' }}>Prix unit.</th>
                    <th style={{ width: '100px' }}>Total</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.invoice_items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <input type="text" value={item.name || ''}
                          onChange={(e) => updateInvoiceItem(idx, 'name', e.target.value)}
                          placeholder="Nom de l'article" className="item-input" />
                      </td>
                      <td>
                        <input type="number" min="0" step="1" value={item.quantity || 1}
                          onChange={(e) => updateInvoiceItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="item-input item-input-sm" />
                      </td>
                      <td>
                        <input type="number" min="0" step="0.01" value={item.unit_price || 0}
                          onChange={(e) => updateInvoiceItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="item-input item-input-sm" />
                      </td>
                      <td className="item-total">
                        {((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)} DH
                      </td>
                      <td>
                        <button type="button" onClick={() => removeInvoiceItem(idx)} className="item-remove-btn">
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="items-total-row">
                    <td colSpan="3" style={{ textAlign: 'right' }}>Total HT</td>
                    <td>{Number(formData.invoice_total_ht || 0).toFixed(2)} DH</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
            <button type="button" onClick={addInvoiceItem} className="item-add-btn">
              <Plus size={16} /> Ajouter un article
            </button>
          </div>
        </div>
        <div className="inline-field" style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", flexWrap: 'wrap' }}>
          <button type="button" className="inline-secondary-btn"
            onClick={() => { if (editing) openDocumentPreview('invoice', editing); }}>
            <Printer size={16} /> Aperçu Facture
          </button>
          <button type="button" className="inline-primary-btn"
            onClick={() => { setFormData({...formData, status: 'waiting_payment'}); toast.success("Facture générée - En attente de paiement"); }}>
            <FileText size={16} /> Générer la facture
          </button>
        </div>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="step-content">
      <div className="inline-grid-2">
        <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <label style={{ fontWeight: "bold" }}>Paiements enregistrés</label>
            <button type="button" className="inline-secondary-btn" onClick={openPaymentModal}>
              <Plus size={16} /> Ajouter un paiement
            </button>
          </div>
          {formData.payments && formData.payments.length > 0 ? (
            <div className="payments-table-wrapper">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Payeur</th>
                    <th>Méthode</th>
                    <th style={{ textAlign: 'right' }}>Montant</th>
                    <th>Référence</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.payments.map((payment, idx) => (
                    <tr key={idx}>
                      <td>{payment.date}</td>
                      <td>
                        <span className={`payer-chip ${payment.payer === 'client' ? 'payer-chip-client' : 'payer-chip-insurance'}`}>
                          {payment.payer === 'client' ? 'Client' : 'Assurance'}
                        </span>
                      </td>
                      <td>{payment.method}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{payment.amount.toFixed(2)} DH</td>
                      <td>{payment.reference || '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="items-total-row">
                    <td colSpan="3" style={{ textAlign: 'right' }}>Total payé:</td>
                    <td style={{ textAlign: 'right' }}>{(Number(formData.total_paid) || 0).toFixed(2)} DH</td>
                    <td></td>
                  </tr>
                  <tr className="items-total-row">
                    <td colSpan="3" style={{ textAlign: 'right' }}>Reste à payer:</td>
                    <td style={{ textAlign: 'right', color: "#dc2626" }}>
                      {(Number(formData.remaining_amount) || 0).toFixed(2)} DH
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="items-empty">Aucun paiement enregistré</div>
          )}
        </div>
        <div className="inline-field">
          <label>Payé par client (DH)</label>
          <input type="number" step="0.01" value={formData.client_paid} readOnly className="inline-input inline-input-readonly" />
        </div>
        <div className="inline-field">
          <label>Payé par assurance (DH)</label>
          <input type="number" step="0.01" value={formData.insurance_paid} readOnly className="inline-input inline-input-readonly" />
        </div>
      </div>
    </div>
  );

  const renderClose = () => {
    const totalRepairCost = Number(formData.total_repair_cost) || 0;
    const totalPaid = Number(formData.total_paid) || 0;
    const remaining = totalRepairCost - totalPaid;

    return (
      <div className="step-content">
        <div className="close-check-card">
          <h3 style={{ marginBottom: "15px" }}>Vérification avant clôture</h3>
          <div className="inline-grid-2">
            <div className="inline-field">
              <label>Coût total réparation</label>
              <input type="text" value={`${totalRepairCost.toFixed(2)} DH`} readOnly className="inline-input inline-input-readonly" />
            </div>
            <div className="inline-field">
              <label>Total payé</label>
              <input type="text" value={`${totalPaid.toFixed(2)} DH`} readOnly className="inline-input inline-input-readonly" />
            </div>
            <div className="inline-field">
              <label>Reste à payer</label>
              <input type="text" value={`${remaining.toFixed(2)} DH`} readOnly
                className="inline-input inline-input-readonly"
                style={{ color: remaining > 0 ? "#dc2626" : "#16a34a", fontWeight: "bold" }} />
            </div>
            <div className="inline-field">
              <label>Statut actuel</label>
              <input type="text" value={statusConfig[formData.status]?.label || formData.status}
                readOnly className="inline-input inline-input-readonly" />
            </div>
          </div>
          {remaining > 0 && (
            <div className="close-alert close-alert-warning">
              ⚠️ Attention : Il reste {remaining.toFixed(2)} DH à payer. L'accident ne peut pas être clôturé tant que tous les paiements ne sont pas effectués.
            </div>
          )}
          {remaining <= 0 && formData.status !== 'closed' && (
            <div className="close-alert close-alert-success">
              ✅ Tous les paiements sont effectués. Vous pouvez clôturer l'accident.
            </div>
          )}
          {formData.status === 'closed' && (
            <div className="close-alert close-alert-info">
              ✅ Cet accident est déjà clôturé.
            </div>
          )}
          <div style={{ marginTop: "20px", display: "flex", gap: "10px", flexWrap: 'wrap' }}>
            <button type="button" className="inline-secondary-btn"
              onClick={() => { if (editing) openDocumentPreview('report', editing); }}>
              <Printer size={16} /> Aperçu Rapport
            </button>
            {remaining <= 0 && formData.status !== 'closed' && (
              <button type="button" className="inline-primary-btn" onClick={openCloseModal}>
                <CheckSquare size={16} /> Clôturer l'accident
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: return renderAccidentDetails();
      case 1: return renderGarageInspection();
      case 2: return renderEstimate();
      case 3: return renderRepair();
      case 4: return renderInvoice();
      case 5: return renderPayments();
      case 6: return renderClose();
      default: return null;
    }
  };

  const getStats = () => ({
    total: accidents.length,
    open: accidents.filter(a => a.status === 'open' || a.status === 'under_review' || a.status === 'waiting_estimate').length,
    under_repair: accidents.filter(a => a.status === 'under_repair').length,
    closed: accidents.filter(a => a.status === 'closed').length
  });
  const stats = getStats();

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("fr-FR");
    } catch {
      return dateString;
    }
  };

  if (loading) return (
    <div className="loading">
      <div className="spinner"></div>
      <p>Chargement des accidents...</p>
    </div>
  );

  return (
    <>
      {/* ================ FORM — full-screen overlay ================ */}
      {showAccidentForm && createPortal(
        <div className="acc-fullscreen-overlay">
          <div className="inline-form-container">
            <div className="inline-form-header">
              <div className="inline-form-icon">
                {editing ? <Sparkles size={28} /> : <AlertTriangle size={28} />}
              </div>
              <div className="inline-form-title">
                <h2>{editing ? "Modifier l'accident" : "Signaler un accident"}</h2>
                <p>{editing ? "Modifiez les informations" : "Ajoutez un nouvel accident"}</p>
              </div>
              <button onClick={() => { setShowAccidentForm(false); setEditing(null); resetForm(); }} className="inline-form-close">
                <X size={24} />
              </button>
            </div>

            <div className="steps-progress">
              {["Détails", "Garage", "Devis", "Réparation", "Facture", "Paiements", "Clôture"].map((label, idx) => (
                <div key={idx}
                  className={`step-indicator ${idx === activeStep ? 'active' : ''} ${idx < activeStep ? 'completed' : ''}`}
                  onClick={() => setActiveStep(idx)}>
                  <span className="step-number">{idx + 1}</span>
                  <span className="step-label">{label}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="inline-form">
              {renderStepContent()}

              <div className="inline-form-footer">
                <button type="button" className="inline-secondary-btn"
                  onClick={() => { setShowAccidentForm(false); setEditing(null); resetForm(); }}>
                  Annuler
                </button>
                {activeStep > 0 && (
                  <button type="button" className="inline-secondary-btn" onClick={() => setActiveStep(activeStep - 1)}>
                    Précédent
                  </button>
                )}
                {activeStep < 6 && (
                  <button type="button" className="inline-secondary-btn" onClick={() => setActiveStep(activeStep + 1)}>
                    Suivant
                  </button>
                )}
                <button type="submit" className="inline-primary-btn" disabled={submitting}>
                  {submitting ? "Traitement..." : (editing ? "Mettre à jour" : "Créer")}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ================ DETAILS — full-screen overlay ================ */}
      {showAccidentDetails && selectedAccident && createPortal(
        <div className="acc-fullscreen-overlay">
          <div className="inline-details-container">
            <div className="inline-details-header">
              <div className="inline-details-icon"><AlertTriangle size={28} /></div>
              <div className="inline-details-title">
                <h2>Détails de l'accident</h2>
                <p>Accident #{selectedAccident.id} - {selectedAccident.date_accident}</p>
              </div>
              <button onClick={() => setShowAccidentDetails(false)} className="inline-details-close"><X size={24} /></button>
            </div>
            <div className="inline-details-content">
              <div className="details-actions-bar">
                <button onClick={() => setShowAccidentDetails(false)} className="back-btn"><ArrowLeft size={16} /> Retour</button>
                <div className="details-action-buttons">
                  <button onClick={() => { setShowAccidentDetails(false); handleEdit(selectedAccident); }} className="action-edit-btn">
                    <Edit2 size={16} /> Modifier
                  </button>
                  <button onClick={() => { setShowAccidentDetails(false); handleDeleteClick(selectedAccident); }} className="action-delete-btn">
                    <Trash2 size={16} /> Supprimer
                  </button>
                  {selectedAccident.status !== 'closed' && (
                    <button onClick={() => { setShowAccidentDetails(false); handleEdit(selectedAccident); setActiveStep(6); }} className="action-edit-btn">
                      <CheckSquare size={16} /> Clôturer
                    </button>
                  )}
                  <button onClick={() => openDocumentPreview('report', selectedAccident)} className="action-edit-btn">
                    <Printer size={16} /> Rapport
                  </button>
                  <button onClick={() => openDocumentPreview('estimate', selectedAccident)} className="action-edit-btn">
                    <FileText size={16} /> Devis
                  </button>
                  <button onClick={() => openDocumentPreview('invoice', selectedAccident)} className="action-edit-btn">
                    <Receipt size={16} /> Facture
                  </button>
                </div>
              </div>

              <div className="accident-header-card">
                <div className="accident-stats-grid">
                  <div className="stat-item-detail">
                    <div className="stat-value">{statusConfig[selectedAccident.status]?.label || selectedAccident.status}</div>
                    <div className="stat-label-detail">Statut</div>
                  </div>
                  <div className="stat-item-detail">
                    <div className="stat-value">{selectedAccident.total_repair_cost || 0} DH</div>
                    <div className="stat-label-detail">Coût total</div>
                  </div>
                  <div className="stat-item-detail">
                    <div className="stat-value">{selectedAccident.total_paid || 0} DH</div>
                    <div className="stat-label-detail">Payé</div>
                  </div>
                  <div className="stat-item-detail">
                    <div className="stat-value" style={{ color: selectedAccident.remaining_amount > 0 ? '#fca5a5' : '#86efac' }}>
                      {selectedAccident.remaining_amount || 0} DH
                    </div>
                    <div className="stat-label-detail">Reste à payer</div>
                  </div>
                </div>
              </div>

              <div className="details-sections-grid">
                <div className="detail-card">
                  <div className="detail-card-title"><Car size={16} /> Véhicule</div>
                  <div className="detail-card-content">
                    <div className="info-row"><span className="info-label">Matricule</span><span className="info-value matricule-value">{selectedAccident.matricule?.matricule_code || "—"}</span></div>
                    <div className="info-row"><span className="info-label">Marque</span><span className="info-value">{selectedAccident.car?.brand || "—"}</span></div>
                    <div className="info-row"><span className="info-label">Modèle</span><span className="info-value">{selectedAccident.car?.model || "—"}</span></div>
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-card-title"><User size={16} /> Client</div>
                  <div className="detail-card-content">
                    <div className="info-row"><span className="info-label">Nom</span><span className="info-value">{selectedAccident.client?.prenom} {selectedAccident.client?.nom}</span></div>
                    <div className="info-row"><span className="info-label">Téléphone</span><span className="info-value">{selectedAccident.client?.telephone || "—"}</span></div>
                    <div className="info-row"><span className="info-label">Email</span><span className="info-value">{selectedAccident.client?.email || "—"}</span></div>
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-card-title"><Building2 size={16} /> Garage</div>
                  <div className="detail-card-content">
                    <div className="info-row"><span className="info-label">Nom</span><span className="info-value">{selectedAccident.garage?.name || "Non assigné"}</span></div>
                    <div className="info-row"><span className="info-label">Adresse</span><span className="info-value">{selectedAccident.garage?.address || "—"}</span></div>
                    <div className="info-row"><span className="info-label">Téléphone</span><span className="info-value">{selectedAccident.garage?.phone || "—"}</span></div>
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-card-title"><Info size={16} /> Informations</div>
                  <div className="detail-card-content">
                    <div className="info-row"><span className="info-label">Date accident</span><span className="info-value">{selectedAccident.date_accident}</span></div>
                    <div className="info-row"><span className="info-label">Lieu</span><span className="info-value">{selectedAccident.location || "—"}</span></div>
                    <div className="info-row"><span className="info-label">Type</span><span className="info-value">{selectedAccident.accident_type === 'grave' ? 'Grave' : 'Non-grave'}</span></div>
                    <div className="info-row"><span className="info-label">Procédure</span><span className="info-value">{selectedAccident.procedure_type === 'classic' ? 'Classique' : 'Forphie'}</span></div>
                  </div>
                </div>
              </div>

              {selectedAccident.notes && (
                <div className="notes-section">
                  <div className="notes-title"><FileText size={16} /> Notes</div>
                  <div className="notes-content">{selectedAccident.notes}</div>
                </div>
              )}
            </div>
            <div className="inline-details-footer">
              <button onClick={() => setShowAccidentDetails(false)} className="btn-secondary-full">Fermer</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================ DOCUMENT PREVIEW ================ */}
      {showDocumentPreview && documentPreviewAccident && documentPreviewType && createPortal(
        <div className="acc-fullscreen-overlay">
          <div className="document-preview-container">
            <header className="document-preview-header">
              <div className="document-preview-icon">
                <FileText size={28} />
              </div>
              <div className="document-preview-title">
                <h2>
                  {documentPreviewType === 'report' && "Rapport d'accident"}
                  {documentPreviewType === 'estimate' && 'Devis de réparation'}
                  {documentPreviewType === 'invoice' && 'Facture de réparation'}
                </h2>
                <p>Aperçu du document · Accident #{documentPreviewAccident.id}</p>
              </div>
              <button className="document-preview-close-btn" onClick={closeDocumentPreview} aria-label="Fermer">
                <X size={24} />
              </button>
            </header>

            <div className="document-preview-body">
              <PDFViewer width="100%" height="100%" style={{ border: 'none', borderRadius: '12px', height: 'auto' }}>
                {documentPreviewType === 'report' && <AccidentReportPDF accident={documentPreviewAccident} />}
                {documentPreviewType === 'estimate' && <AccidentEstimatePDF accident={documentPreviewAccident} />}
                {documentPreviewType === 'invoice' && <AccidentInvoicePDF accident={documentPreviewAccident} />}
              </PDFViewer>
            </div>

            <div className="document-preview-footer">
              <button className="inline-secondary-btn" onClick={closeDocumentPreview}>
                Fermer
              </button>
              <button
                className="inline-primary-btn"
                onClick={() => downloadDocument(documentPreviewAccident.id, documentPreviewType)}
              >
                <Download size={16} /> Télécharger
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================ PAYMENT MODAL ================ */}
      {showPaymentModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal-header">
              <h3><Wallet size={20} /> Ajouter un paiement</h3>
              <button className="payment-modal-close" onClick={() => setShowPaymentModal(false)}><X size={20} /></button>
            </div>
            <div className="payment-modal-body">
              <div className="payment-form-group">
                <label>Montant (DH) *</label>
                <input type="number" step="0.01" min="0.01" value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  placeholder="0.00" className="payment-input" />
              </div>
              <div className="payment-form-group">
                <label>Payeur *</label>
                <div className="payment-radio-group">
                  <label className="payment-radio-label">
                    <input type="radio" value="client" checked={paymentForm.payer === 'client'}
                      onChange={() => setPaymentForm({...paymentForm, payer: 'client'})} /> Client
                  </label>
                  <label className="payment-radio-label">
                    <input type="radio" value="insurance" checked={paymentForm.payer === 'insurance'}
                      onChange={() => setPaymentForm({...paymentForm, payer: 'insurance'})} /> Assurance
                  </label>
                </div>
              </div>
              <div className="payment-form-group">
                <label>Méthode *</label>
                <select value={paymentForm.method}
                  onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})} className="payment-select">
                  <option value="cash">Espèces</option>
                  <option value="check">Chèque</option>
                  <option value="bank_transfer">Virement</option>
                </select>
              </div>
              <div className="payment-form-group">
                <label>Référence (optionnel)</label>
                <input type="text" value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})}
                  placeholder="N° chèque, virement..." className="payment-input" />
              </div>
              <div className="payment-form-group">
                <label>Notes (optionnel)</label>
                <textarea value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  placeholder="Commentaires..." className="payment-textarea" rows="2" />
              </div>
            </div>
            <div className="payment-modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={() => setShowPaymentModal(false)}>Annuler</button>
              <button className="modal-btn btn-primary" onClick={handlePaymentSubmit}>Enregistrer</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================ CLOSE MODAL ================ */}
      {showCloseModal && createPortal(
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <div className="confirmation-header">
              <div className="confirmation-icon close">
                <CheckSquare size={32} />
              </div>
              <h3 className="confirmation-title">Confirmer la clôture</h3>
            </div>
            <div className="confirmation-body">
              <p className="confirmation-message">
                Êtes-vous sûr de vouloir clôturer cet accident ?<br />
                Une fois clôturé, vous ne pourrez plus modifier les informations.
              </p>
            </div>
            <div className="confirmation-actions">
              <button className="btn-confirm-cancel" onClick={() => setShowCloseModal(false)}>
                Annuler
              </button>
              <button className="btn-confirm-close" onClick={handleCloseConfirm}>
                <CheckSquare size={16} /> Clôturer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================ MAIN LIST ================ */}
      {!showAccidentForm && !showAccidentDetails && !showDocumentPreview && (
        <div className="accidents-management">
          <div className="section-header">
            <div className="header-content">
              <h1 className="section-title">
                <AlertTriangle className="title-icon" />
                Gestion des Accidents
                {statusFilter !== 'all' && (
                  <span className="filter-indicator">
                    - Filtre: {statusConfig[statusFilter]?.label || statusFilter}
                  </span>
                )}
              </h1>
              <p className="section-subtitle">Suivi complet des sinistres et réparations</p>
            </div>
            <div className="section-actions">
              <button onClick={refreshData} className="btn btn-secondary">
                <RefreshCw className="btn-icon" /> Actualiser
              </button>
              <button onClick={handleAddNew} className="btn btn-primary">
                <Plus className="btn-icon" /> Nouvel accident
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div>
                <p className="stat-label">Total</p>
                <p className="stat-number">{stats.total}</p>
              </div>
              <AlertTriangle size={32} className="stat-icon" />
            </div>
            <div className="stat-card">
              <div>
                <p className="stat-label">Ouverts</p>
                <p className="stat-number text-yellow">{stats.open}</p>
              </div>
              <AlertCircle size={32} className="stat-icon" style={{ color: '#ca8a04' }} />
            </div>
            <div className="stat-card">
              <div>
                <p className="stat-label">En réparation</p>
                <p className="stat-number text-orange">{stats.under_repair}</p>
              </div>
              <Wrench size={32} className="stat-icon" style={{ color: '#ea580c' }} />
            </div>
            <div className="stat-card">
              <div>
                <p className="stat-label">Clôturés</p>
                <p className="stat-number text-green">{stats.closed}</p>
              </div>
              <CheckCircle size={32} className="stat-icon" style={{ color: '#16a34a' }} />
            </div>
          </div>

          {/* Search + Filters */}
          <div className="search-filter-section">
            <div className="search-box">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Rechercher par ID, client, immatriculation, notes..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="search-input"
              />
            </div>
            <div className="filter-group">
              <div className="filter-item">
                <label htmlFor="status-filter">
                  <Filter size={14} className="filter-icon" /> Statut
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="filter-select"
                >
                  <option value="all">Tous statuts</option>
                  {Object.entries(statusConfig).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
              {(searchTerm !== '' || statusFilter !== 'all') && (
                <button
                  className="btn btn-clear"
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCurrentPage(1); }}
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          </div>

          {filterParam === 'notifications' && (
            <div className="filter-indicator">
              <span className="filter-indicator-text">
                <AlertCircle size={16} /> Affichage des accidents récents (7 derniers jours) non clôturés
              </span>
              <button onClick={() => setSearchParams({})} className="clear-filter-btn">
                <X size={16} /> Effacer le filtre
              </button>
            </div>
          )}

          <div className="results-summary">
            <span className="results-count">
              Affichage de {paginatedAccidents.length} sur {filteredAccidents.length} accident(s)
              {filteredAccidents.length !== accidents.length && ` (filtré sur ${accidents.length} au total)`}
            </span>
            <span className="page-info">Page {currentPage} sur {totalPages || 1}</span>
          </div>

          <div className="content-container">
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("date")} className="sortable-header">
                      Date {getSortIcon("date")}
                    </th>
                    <th onClick={() => handleSort("matricule")} className="sortable-header">
                      Véhicule {getSortIcon("matricule")}
                    </th>
                    <th onClick={() => handleSort("client")} className="sortable-header">
                      Client {getSortIcon("client")}
                    </th>
                    <th>Coût total</th>
                    <th>Payé</th>
                    <th onClick={() => handleSort("status")} className="sortable-header">
                      Statut {getSortIcon("status")}
                    </th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAccidents.length === 0 ? (
                    <tr>
                      <td colSpan="7">
                        <div className="no-data">
                          <AlertTriangle size={48} />
                          <p>
                            {accidents.length === 0
                              ? 'Aucun accident trouvé'
                              : 'Aucun accident ne correspond à vos critères de recherche'}
                          </p>
                          <button className="btn btn-primary" onClick={handleAddNew}>
                            <Plus className="btn-icon" /> Signaler un nouvel accident
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedAccidents.map(acc => {
                      const mat = matricules.find(m => m.id === acc.matricule_id);
                      const car = cars.find(c => c.id === acc.car_id);
                      const client = clients.find(c => c.id === acc.client_id);
                      const status = statusConfig[acc.status] || statusConfig.open;
                      const StatusIcon = status.icon;
                      return (
                        <tr key={acc.id}>
                          <td className="reservation-period">{formatDate(acc.date_accident)}</td>
                          <td className="car-info">
                            <div className="car-info-container">
                              <div className="car-brand-model">
                                {car ? `${car.brand} ${car.model}` : '—'}
                              </div>
                              <div className="car-details">
                                {mat?.matricule_code && (
                                  <span className="car-matricule">
                                    <Car className="icon-small" /> {mat.matricule_code}
                                  </span>
                                )}
                                <span className="car-color-year">
                                  <Palette className="icon-small" />
                                  {car?.color || 'N/A'} | {car?.year || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="client-name">
                            <div className="client-info-cell">
                              <div className="client-name-main">
                                {client ? `${client.prenom} ${client.nom}` : '—'}
                              </div>
                              {client?.telephone && (
                                <div className="client-phone">
                                  <Phone className="icon-small" /> {client.telephone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="price-cell">{acc.total_repair_cost || 0} DH</td>
                          <td className="price-cell">{acc.total_paid || 0} DH</td>
                          <td>
                            <span className={status.badge}>
                              <StatusIcon size={12} className="status-icon" /> {status.label}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons-circular">
                              <button
                                className="icon-action-btn"
                                onClick={() => handleViewDetails(acc)}
                                title="Voir détails"
                                style={{ color: '#3b82f6' }}
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                className="icon-action-btn"
                                onClick={() => handleEdit(acc)}
                                title="Modifier"
                                style={{ color: '#10b981' }}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                className="icon-action-btn"
                                onClick={() => openDocumentPreview('report', acc)}
                                title="Rapport"
                                style={{ color: '#8b5cf6' }}
                              >
                                <FileText size={16} />
                              </button>
                              <button
                                className="icon-action-btn"
                                onClick={() => openDocumentPreview('estimate', acc)}
                                title="Devis"
                                style={{ color: '#06b6d4' }}
                              >
                                <FileCheck size={16} />
                              </button>
                              <button
                                className="icon-action-btn"
                                onClick={() => openDocumentPreview('invoice', acc)}
                                title="Facture"
                                style={{ color: '#667eea' }}
                              >
                                <Receipt size={16} />
                              </button>
                              <button
                                className="icon-action-btn"
                                onClick={() => handleDeleteClick(acc)}
                                title="Supprimer"
                                style={{ color: '#ef4444' }}
                              >
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
                  totalItems={filteredAccidents.length}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================ DELETE MODAL ================ */}
      {deleteModalOpen && accidentToDelete && createPortal(
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
                Êtes-vous sûr de vouloir supprimer l'accident <span className="accident-id">#{accidentToDelete.id}</span> ?<br />
                Cette action est irréversible.
              </p>
              {accidentToDelete.status === "under_repair" && (
                <div className="confirmation-warning">
                  ⚠️ Cet accident est en cours de réparation. La suppression affectera les données associées.
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

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif; background: #f8fafc; }

        /* ============ MAIN LIST (reservations-style) ============ */
        .accidents-management {
          padding: 2rem;
          min-height: 100vh;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          background: #f8fafc;
          color: #334155;
        }

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
        .title-icon { color: #667eea; -webkit-text-fill-color: #667eea; }
        .section-subtitle { color: #64748b; font-size: 1rem; margin: 0; font-weight: 400; }
        .section-actions { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }

        .btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          height: 2.5rem; padding: 0 1rem; border-radius: 9999px;
          border: none; cursor: pointer; font-size: 0.875rem; font-weight: 500;
          transition: all 0.2s; font-family: inherit;
        }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px); box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        .btn-secondary { background: #f1f5f9; color: #1e293b; }
        .btn-secondary:hover:not(:disabled) { background: #e2e8f0; transform: translateY(-1px); }
        .btn-clear { background: #ef4444; color: #fff; }
        .btn-clear:hover:not(:disabled) { background: #dc2626; transform: translateY(-1px); }
        .btn-icon { font-size: 0.875rem; }

        .filter-indicator {
          font-size: 1rem;
          color: #64748b;
          font-weight: 500;
          background: rgba(108, 117, 125, 0.1);
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid rgba(108, 117, 125, 0.2);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .stat-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1rem;
          transition: all 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08);
        }
        .stat-number { font-size: 1.875rem; font-weight: 700; }
        .stat-label {
          font-size: 0.7rem; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .stat-icon { opacity: 0.5; }
        .text-yellow { color: #ca8a04; }
        .text-orange { color: #ea580c; }
        .text-green { color: #16a34a; }

        .search-filter-section {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 1rem;
          padding: 1rem; margin-bottom: 1.5rem;
          display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
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
          background: white;
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
        .filter-icon { font-size: 0.875rem; }
        .filter-select {
          padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0;
          border-radius: 0.5rem; font-size: 0.875rem;
          background: #fff; cursor: pointer; font-family: inherit; min-width: 12rem;
        }
        .filter-select:focus {
          outline: none; border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
        }

        .results-summary {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1rem; padding: 0 0.25rem;
          font-size: 0.875rem; color: #64748b; flex-wrap: wrap; gap: 0.5rem;
        }
        .results-count { font-weight: 500; }
        .page-info { font-weight: 600; color: #334155; }

        .content-container {
          background: white; border: 1px solid #e2e8f0; border-radius: 1rem;
          overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .data-table {
          width: 100%; border-collapse: collapse; font-size: 0.875rem;
          min-width: 1000px;
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

        .sortable-header { cursor: pointer; user-select: none; transition: background-color 0.2s; }
        .sortable-header:hover { background-color: #e2e8f0; }
        .sort-icon { display: inline-block; margin-left: 4px; opacity: 0.5; vertical-align: middle; }
        .sort-icon.active { opacity: 1; color: #667eea; }

        .client-info-cell { display: flex; flex-direction: column; gap: 2px; }
        .client-name-main { font-weight: 500; color: #0f172a; }
        .client-phone {
          font-size: 0.75rem; color: #64748b;
          display: flex; align-items: center; gap: 4px;
        }
        .car-info-container { display: flex; flex-direction: column; gap: 4px; }
        .car-brand-model { font-weight: 600; color: #0f172a; }
        .car-details { display: flex; gap: 10px; flex-wrap: wrap; font-size: 0.75rem; color: #64748b; }
        .car-color-year {
          display: flex; align-items: center; gap: 4px; padding: 4px 12px;
          background: linear-gradient(135deg, #ffcc00 0%, #ff9900 100%);
          border-radius: 10px; border: 2px solid #ff6600;
          font-size: 0.75rem; font-weight: 700; color: #ffffff;
          white-space: nowrap; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
          box-shadow: 0 3px 6px rgba(255, 102, 0, 0.3);
        }
        .car-matricule {
          display: flex; align-items: center; gap: 4px; padding: 4px 12px;
          background: linear-gradient(135deg, #00cc66 0%, #009933 100%);
          border-radius: 10px; border: 2px solid #006633;
          font-size: 0.75rem; font-weight: 700; color: #ffffff;
          white-space: nowrap; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
          box-shadow: 0 3px 6px rgba(0, 102, 51, 0.3);
        }
        .icon-small { font-size: 0.7rem; }
        .reservation-period { color: #64748b; font-size: 0.8rem; }
        .price-cell { font-weight: 600; color: #16a34a; }

        .status-badge {
          padding: 0.25rem 0.625rem; border-radius: 9999px;
          font-size: 0.7rem; font-weight: 500;
          display: inline-flex; align-items: center; gap: 0.25rem;
          white-space: nowrap;
        }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-confirmed { background: #dcfce7; color: #166534; }
        .status-retard { background: #ffedd5; color: #9a3412; }
        .status-contacted { background: #e0e7ff; color: #3730a3; }
        .status-completed { background: #dcfce7; color: #166534; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        .status-icon { font-size: 0.7rem; }

        .action-buttons-circular {
          display: grid; grid-template-columns: repeat(6, 32px);
          gap: 0.5rem; justify-content: flex-end;
          justify-items: center; align-items: center;
        }
        .icon-action-btn {
          width: 32px; height: 32px; border-radius: 0.5rem;
          display: inline-flex; align-items: center; justify-content: center;
          border: none; background: none; cursor: pointer;
          transition: all 0.2s ease; padding: 0;
        }
        .icon-action-btn:hover:not(:disabled) { background: rgba(15, 23, 42, 0.06); }
        .icon-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .no-data {
          text-align: center; padding: 4rem 2rem; color: #64748b;
          display: flex; flex-direction: column; align-items: center; gap: 1rem;
        }
        .no-data p { margin: 0; font-size: 1.05rem; }

        .pagination-container {
          padding: 2rem; border-top: 1px solid #f1f3f4;
          display: flex; justify-content: center;
        }

        .text-right { text-align: right; }

        .badge { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-danger { background: #fee2e2; color: #991b1b; }

        /* ====================================================================
           Full-screen overlay for form / details / document preview
           ==================================================================== */
        .acc-fullscreen-overlay {
          position: fixed;
          top: 0; right: 0; bottom: 0; left: 0;
          background: #f8fafc;
          overflow-y: auto;
          overflow-x: hidden;
          z-index: 9999;
        }
        @media (min-width: 768px) {
          .acc-fullscreen-overlay { left: 18rem; }
        }

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

        /* ============ FORM CARD ============ */
        .inline-form-container {
          background: white;
          border-radius: 32px;
          margin: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          overflow: hidden;
          animation: amSlideIn 0.3s ease-out;
        }
        .inline-form-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px 32px; display: flex; align-items: center; gap: 20px; position: relative; }
        .inline-form-icon { width: 56px; height: 56px; background: #ffffff; border-radius: 28px; display: flex; align-items: center; justify-content: center; color: #667eea; }
        .inline-form-title h2 { color: #ffffff; font-size: 1.75rem; font-weight: 700; margin: 0; }
        .inline-form-title p { color: rgba(255,255,255,0.85); font-size: 0.875rem; margin: 4px 0 0 0; }
        .inline-form-close { position: absolute; top: 24px; right: 28px; background: rgba(255,255,255,0.15); border: none; border-radius: 40px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; transition: all 0.2s; }
        .inline-form-close:hover { background: rgba(255,255,255,0.25); transform: scale(1.05); }

        .steps-progress { display: flex; justify-content: space-between; padding: 1.5rem 2rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; gap: 0.5rem; }
        .step-indicator { display: flex; flex-direction: column; align-items: center; cursor: pointer; flex: 1; position: relative; min-width: 60px; }
        .step-indicator:not(:last-child)::after { content: ''; position: absolute; top: 15px; left: 50%; width: 100%; height: 2px; background: #e2e8f0; z-index: 0; }
        .step-indicator.completed:not(:last-child)::after { background: #10b981; }
        .step-number { width: 30px; height: 30px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; margin-bottom: 4px; transition: 0.2s; z-index: 1; position: relative; }
        .step-indicator.active .step-number { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; transform: scale(1.1); }
        .step-indicator.completed .step-number { background: #10b981; color: white; }
        .step-label { font-size: 0.65rem; color: #64748b; text-align: center; white-space: nowrap; }
        .step-indicator.active .step-label { color: #4338ca; font-weight: 600; }

        .inline-form { padding: 28px 32px; }
        .inline-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .inline-field { display: flex; flex-direction: column; gap: 6px; }
        .inline-field label { font-size: 0.7rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
        .inline-input, .inline-select, .inline-textarea { padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 0.875rem; transition: all 0.2s; background: white; font-family: inherit; }
        .inline-input:focus, .inline-select:focus, .inline-textarea:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.15); }
        .inline-textarea { resize: vertical; min-height: 80px; }
        .inline-input-readonly { background: #f8fafc; color: #475569; }
        .step-content { padding: 1rem 0; }

        .inline-form-footer { display: flex; justify-content: flex-end; gap: 16px; padding-top: 24px; border-top: 1px solid #e2e8f0; margin-top: 24px; flex-wrap: wrap; }
        .inline-secondary-btn { background: white; border: 1.5px solid #e2e8f0; padding: 10px 24px; border-radius: 40px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; color: #475569; font-family: inherit; }
        .inline-secondary-btn:hover { border-color: #667eea; color: #667eea; background: #f5f3ff; }
        .inline-primary-btn { background: linear-gradient(135deg, #667eea, #764ba2); border: none; padding: 12px 28px; border-radius: 40px; font-size: 0.875rem; font-weight: 600; color: white; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(102,126,234,0.3); font-family: inherit; }
        .inline-primary-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(102,126,234,0.4); }
        .inline-primary-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        /* Searchable selects */
        .inline-search-section { background: #f8fafc; border-radius: 16px; padding: 12px; border: 1px solid #e2e8f0; }
        .inline-search-input-wrapper { position: relative; }
        .inline-search-input-wrapper > svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .inline-search-input-wrapper .inline-input { padding-left: 42px; padding-right: 42px; width: 100%; }
        .clear-search-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94a3b8; padding: 4px; }
        .clear-search-btn:hover { color: #ef4444; }
        .inline-results { max-height: 250px; overflow-y: auto; margin-top: 8px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; }
        .inline-result-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #f1f5f9; transition: background 0.2s; }
        .inline-result-item:hover { background: #f5f3ff; }
        .inline-result-avatar { width: 36px; height: 36px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 36px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
        .inline-result-info { flex: 1; }
        .inline-result-info strong { display: block; margin-bottom: 4px; font-size: 0.875rem; }
        .inline-result-details { display: flex; gap: 12px; font-size: 0.7rem; color: #64748b; flex-wrap: wrap; }
        .inline-selected { background: rgba(102,126,234,0.08); border: 1px solid rgba(102,126,234,0.2); border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; margin-top: 12px; }
        .inline-selected svg { color: #667eea; flex-shrink: 0; }
        .inline-selected strong { display: block; font-size: 0.7rem; color: #4338ca; }
        .inline-selected p { font-size: 0.8rem; font-weight: 500; margin: 0; color: #4338ca; }
        .inline-no-results { padding: 0.75rem; color: #64748b; font-size: 0.875rem; text-align: center; }

        /* Items tables */
        .items-table-wrapper { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
        .items-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
        .items-table thead tr { border-bottom: 1px solid #e2e8f0; }
        .items-table th { padding: 6px; text-align: left; font-weight: 600; color: #475569; }
        .items-table tbody tr { border-bottom: 1px solid #e2e8f0; }
        .items-table tbody td { padding: 6px; }
        .items-total-row { border-top: 2px solid #667eea; font-weight: bold; }
        .items-total-row td { padding: 6px; }
        .item-input { width: 100%; padding: 4px 6px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.8rem; }
        .item-input-sm { width: 80px; text-align: center; }
        .item-total { text-align: center; font-weight: bold; }
        .item-remove-btn { background: none; border: none; color: #ef4444; cursor: pointer; }
        .item-add-btn { margin-top: 8px; padding: 6px 12px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 40px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600; }
        .item-add-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(102,126,234,0.35); }
        .items-empty { text-align: center; color: #64748b; padding: 20px; }

        .payments-table-wrapper { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: white; }
        .payer-chip { padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
        .payer-chip-client { background: #dcfce7; color: #166534; }
        .payer-chip-insurance { background: #dbeafe; color: #1e40af; }

        .close-check-card { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .close-alert { padding: 10px; border-radius: 8px; margin-top: 15px; font-size: 0.875rem; }
        .close-alert-warning { background: #fee2e2; color: #991b1b; }
        .close-alert-success { background: #dcfce7; color: #166534; }
        .close-alert-info { background: #dbeafe; color: #1e40af; }

        /* ============ DETAILS VIEW ============ */
        .inline-details-container {
          background: white;
          border-radius: 32px;
          margin: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          overflow: hidden;
          animation: amSlideIn 0.3s ease-out;
        }
        .inline-details-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px 32px; display: flex; align-items: center; gap: 20px; position: relative; }
        .inline-details-icon { width: 56px; height: 56px; background: #ffffff; border-radius: 28px; display: flex; align-items: center; justify-content: center; color: #667eea; }
        .inline-details-title h2 { color: #ffffff; font-size: 1.75rem; font-weight: 700; margin: 0; }
        .inline-details-title p { color: rgba(255,255,255,0.85); font-size: 0.875rem; margin: 4px 0 0 0; }
        .inline-details-close { position: absolute; top: 24px; right: 28px; background: rgba(255,255,255,0.15); border: none; border-radius: 40px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; transition: all 0.2s; }
        .inline-details-close:hover { background: rgba(255,255,255,0.25); transform: scale(1.05); }
        .inline-details-content { padding: 28px 32px; }
        .inline-details-footer { display: flex; justify-content: flex-end; gap: 16px; padding: 20px 32px; border-top: 1px solid #e2e8f0; background: #f8fafc; }
        .btn-secondary-full { background: white; border: 1.5px solid #e2e8f0; padding: 10px 24px; border-radius: 40px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .btn-secondary-full:hover { border-color: #667eea; color: #667eea; }

        .details-actions-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .back-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 8px 16px; background: #f1f5f9; border: none; border-radius: 40px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .back-btn:hover { background: #e2e8f0; }
        .details-action-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .action-edit-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 8px 16px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 40px; font-size: 0.8rem; font-weight: 500; color: white; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .action-edit-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(102,126,234,0.35); }
        .action-delete-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 8px 16px; background: #ef4444; border: none; border-radius: 40px; font-size: 0.8rem; font-weight: 500; color: white; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .action-delete-btn:hover { background: #dc2626; }

        .accident-header-card { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; }
        .accident-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; }
        .stat-item-detail { background: rgba(255,255,255,0.15); padding: 0.75rem; border-radius: 0.75rem; text-align: center; }
        .stat-value { font-size: 1.25rem; font-weight: 700; }
        .stat-label-detail { font-size: 0.65rem; opacity: 0.85; margin-top: 0.25rem; }

        .details-sections-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .detail-card { border: 1px solid #e2e8f0; border-radius: 1rem; overflow: hidden; }
        .detail-card-title { background: #f8fafc; padding: 0.75rem 1rem; font-weight: 600; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid #e2e8f0; color: #4338ca; }
        .detail-card-content { padding: 1rem; }
        .info-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-size: 0.75rem; color: #64748b; }
        .info-value { font-size: 0.75rem; font-weight: 500; }
        .matricule-value { font-family: 'Courier New', monospace; font-weight: 600; color: #667eea; }

        .notes-section { border: 1px solid #e2e8f0; border-radius: 1rem; overflow: hidden; margin-top: 1rem; }
        .notes-title { background: #f8fafc; padding: 0.75rem 1rem; font-weight: 600; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid #e2e8f0; color: #4338ca; }
        .notes-content { padding: 1rem; font-size: 0.875rem; line-height: 1.5; }

        /* ============ DOCUMENT PREVIEW ============ */
        .document-preview-container {
          background: white;
          border-radius: 32px;
          margin: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: amSlideIn 0.3s ease-out;
          min-height: calc(100vh - 3rem);
        }
        .document-preview-header {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 24px 32px;
          display: flex;
          align-items: center;
          gap: 20px;
          flex-shrink: 0;
        }
        .document-preview-icon {
          width: 56px; height: 56px; background: #ffffff;
          border-radius: 28px; display: flex; align-items: center;
          justify-content: center; color: #667eea; flex-shrink: 0;
        }
        .document-preview-title { flex: 1; min-width: 0; padding-right: 48px; }
        .document-preview-title h2 { color: #fff; font-size: 1.75rem; font-weight: 700; margin: 0; line-height: 1.2; }
        .document-preview-title p { color: rgba(255, 255, 255, 0.85); font-size: 0.875rem; margin: 4px 0 0; }
        .document-preview-close-btn {
          position: absolute; top: 24px; right: 28px;
          background: rgba(255, 255, 255, 0.15); border: none;
          border-radius: 40px; width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #fff; transition: all 0.2s;
        }
        .document-preview-close-btn:hover { background: rgba(255, 255, 255, 0.25); transform: scale(1.05); }
        .document-preview-body {
          flex: 1; padding: 1rem; background: #f1f5f9;
          min-height: 600px; display: flex;
        }
        .document-preview-body > * { flex: 1; }
        .document-preview-footer {
          display: flex; justify-content: flex-end; gap: 16px;
          padding: 20px 32px; border-top: 1px solid #e2e8f0;
          background: #fff; flex-shrink: 0;
        }

        /* ============ PAYMENT MODAL ============ */
        .modal-overlay {
          position: fixed; top: 0; right: 0; bottom: 0; left: 0;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 10000; padding: 1rem;
          animation: fadeIn 0.2s ease;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .payment-modal { background: white; border-radius: 24px; max-width: 480px; width: 100%; padding: 1.5rem; animation: slideUp 0.3s ease; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
        .payment-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .payment-modal-header h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; font-weight: 600; }
        .payment-modal-close { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; }
        .payment-modal-close:hover { color: #0f172a; }
        .payment-form-group { margin-bottom: 1rem; }
        .payment-form-group label { display: block; font-size: 0.75rem; font-weight: 600; color: #475569; margin-bottom: 0.25rem; }
        .payment-input, .payment-select, .payment-textarea { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; font-family: inherit; }
        .payment-input:focus, .payment-select:focus, .payment-textarea:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); }
        .payment-radio-group { display: flex; gap: 1rem; }
        .payment-radio-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer; }
        .payment-modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; }

        .modal-btn { flex: 1; height: 2.75rem; border-radius: 0.75rem; border: none; cursor: pointer; font-size: 0.875rem; font-weight: 500; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; font-family: inherit; }
        .modal-btn-cancel { border: 1px solid #e2e8f0; background: white; }
        .modal-btn-cancel:hover { background: #f8fafc; }
        .btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }

        /* ============ CONFIRMATION MODALS ============ */
        .confirmation-modal-overlay {
          position: fixed; top: 0; right: 0; bottom: 0; left: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          z-index: 10000; padding: 1rem;
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
          padding: 2rem 2rem 1rem; text-align: center;
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
        .confirmation-icon.close {
          background: rgba(102, 126, 234, 0.1); color: #667eea;
          border: 2px solid rgba(102, 126, 234, 0.2);
        }
        .confirmation-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
        .confirmation-body { padding: 1.5rem 2rem; }
        .confirmation-message {
          color: #64748b; font-size: 1rem;
          line-height: 1.6; margin: 0; text-align: center;
        }
        .confirmation-warning {
          margin-top: 1rem; padding: 0.75rem 1rem;
          background: rgba(220, 53, 69, 0.08);
          border: 1px solid rgba(220, 53, 69, 0.2);
          border-radius: 0.5rem; font-size: 0.8rem;
          color: #991b1b; text-align: center;
        }
        .accident-id {
          font-weight: 700; color: #0f172a;
          background: #f1f5f9; padding: 0.15rem 0.5rem;
          border-radius: 0.5rem; display: inline-block;
          margin: 0 0.15rem;
        }
        .confirmation-actions {
          padding: 1.5rem 2rem 2rem;
          display: flex; gap: 1rem; justify-content: flex-end;
        }
        .btn-confirm-cancel {
          padding: 0.75rem 1.5rem; border: 1px solid #cbd5e1;
          background: transparent; color: #64748b; border-radius: 0.75rem;
          font-size: 0.875rem; font-weight: 600; cursor: pointer;
          transition: all 0.3s ease; font-family: inherit;
        }
        .btn-confirm-cancel:hover { background: #f1f5f9; color: #334155; }
        .btn-confirm-delete {
          padding: 0.75rem 1.5rem; border: none; background: #ef4444;
          color: white; border-radius: 0.75rem; font-size: 0.875rem;
          font-weight: 600; cursor: pointer; transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-family: inherit;
        }
        .btn-confirm-delete:hover {
          background: #dc2626; transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
        }
        .btn-confirm-close {
          padding: 0.75rem 1.5rem; border: none;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white; border-radius: 0.75rem; font-size: 0.875rem;
          font-weight: 600; cursor: pointer; transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-family: inherit;
        }
        .btn-confirm-close:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .loading { text-align: center; padding: 3rem; }
        .spinner { display: inline-block; width: 2rem; height: 2rem; border-radius: 50%; border: 2px solid #e2e8f0; border-top-color: #667eea; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Responsive */
        @media (max-width: 1024px) {
          .inline-grid-2 { grid-template-columns: 1fr; }
          .acc-fullscreen-overlay { left: 0; }
        }
        @media (max-width: 768px) {
          .accidents-management { padding: 1rem; }
          .section-header { flex-direction: column; gap: 1rem; }
          .section-actions { width: 100%; justify-content: space-between; }
          .search-filter-section { flex-direction: column; align-items: stretch; }
          .search-box { min-width: auto; }
          .filter-group { justify-content: space-between; }
          .filter-item { flex: 1; }
          .filter-select { min-width: auto; }
          .results-summary { flex-direction: column; gap: 0.5rem; align-items: flex-start; }
          .inline-form-container,
          .inline-details-container,
          .document-preview-container { margin: 1rem; border-radius: 24px; }
          .inline-form-header,
          .inline-details-header,
          .document-preview-header { padding: 16px 20px; gap: 14px; }
          .inline-form-title h2,
          .inline-details-title h2,
          .document-preview-title h2 { font-size: 1.25rem; }
          .inline-form-icon,
          .inline-details-icon,
          .document-preview-icon { width: 44px; height: 44px; border-radius: 22px; }
          .inline-form-close,
          .inline-details-close,
          .document-preview-close-btn { top: 16px; right: 16px; width: 36px; height: 36px; }
          .inline-form,
          .inline-details-content { padding: 20px; }
          .document-preview-footer { padding: 16px 20px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .details-sections-grid { grid-template-columns: 1fr; }
          .accident-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .details-actions-bar { flex-direction: column; align-items: stretch; }
          .details-action-buttons { justify-content: center; }
          .steps-progress { overflow-x: auto; padding: 1rem; gap: 0.5rem; flex-wrap: nowrap; }
          .step-label { font-size: 0.55rem; }
          .payment-modal { max-width: 95vw; margin: 1rem; }
          .document-preview-container { min-height: calc(100vh - 2rem); }
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          body { background: #0f172a; }
          .accidents-management { background: #0f172a; color: #e2e8f0; }
          .section-header,
          .stat-card,
          .search-filter-section,
          .content-container,
          .inline-form-container,
          .inline-details-container,
          .document-preview-container,
          .payment-modal,
          .confirmation-modal { background: #1e293b; border-color: #334155; }
          .section-subtitle, .stat-label, .results-summary, .info-label,
          .confirmation-message, .no-data { color: #94a3b8; }
          .section-title { background: linear-gradient(135deg, #a5b4fc, #c4b5fd); background-clip: text; -webkit-background-clip: text; }
          .title-icon { color: #a5b4fc; -webkit-text-fill-color: #a5b4fc; }
          .btn-secondary, .btn-secondary-full, .back-btn { background: #334155; color: #e2e8f0; }
          .btn-secondary:hover, .btn-secondary-full:hover, .back-btn:hover { background: #475569; }
          .search-input, .filter-select, .inline-input, .inline-select, .inline-textarea, .payment-input, .payment-select, .payment-textarea { background: #0f172a; border-color: #334155; color: #f1f5f9; }
          .inline-search-section { background: #0f172a; border-color: #334155; }
          .inline-results { background: #0f172a; border-color: #334155; }
          .inline-result-item { border-bottom-color: #334155; }
          .inline-result-item:hover { background: #1e1b4b; }
          .inline-selected { background: rgba(102,126,234,0.15); border-color: rgba(102,126,234,0.35); color: #c7d2fe; }
          .inline-selected strong, .inline-selected p { color: #c7d2fe; }
          .inline-no-results { color: #94a3b8; }
          .data-table th { background: #0f172a; color: #94a3b8; border-bottom-color: #334155; }
          .data-table td { border-top-color: #334155; color: #e2e8f0; }
          .data-table tr:hover { background: #334155; }
          .sortable-header:hover { background-color: #334155; }
          .detail-card { border-color: #334155; }
          .detail-card-title { background: #0f172a; color: #a5b4fc; }
          .info-row { border-bottom-color: #334155; }
          .notes-section { border-color: #334155; }
          .notes-title { background: #0f172a; color: #a5b4fc; }
          .action-btn-view:hover { background: #1e3a5f; }
          .action-btn-edit:hover { background: #064e3b; }
          .action-btn-delete:hover { background: #7f1d1d; }
          .steps-progress { background: #0f172a; border-bottom-color: #334155; }
          .step-indicator:not(:last-child)::after { background: #334155; }
          .step-indicator.completed:not(:last-child)::after { background: #059669; }
          .step-number { background: #334155; color: #94a3b8; }
          .step-indicator.active .step-number { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
          .step-indicator.completed .step-number { background: #059669; color: white; }
          .step-label { color: #94a3b8; }
          .step-indicator.active .step-label { color: #c7d2fe; }
          .document-preview-body { background: #0f172a; }
          .document-preview-footer { background: #1e293b; border-top-color: #334155; }
          .filter-indicator { background: #1e1b4b; border-color: #4338ca; }
          .filter-indicator-text { color: #c7d2fe; }
          .clear-filter-btn { border-color: #c7d2fe; color: #c7d2fe; }
          .clear-filter-btn:hover { background: #c7d2fe; color: #1e293b; }
          .payment-modal-header h3 { color: #f1f5f9; }
          .payment-form-group label { color: #94a3b8; }
          .payment-modal-footer { border-top-color: #334155; }
          .modal-btn-cancel { border-color: #475569; background: #1e293b; color: #e2e8f0; }
          .modal-btn-cancel:hover { background: #334155; }
          .inline-input-readonly { background: #0f172a; color: #94a3b8; }
          .items-table-wrapper { background: #0f172a; border-color: #334155; }
          .item-input { background: #1e293b; border-color: #334155; color: #f1f5f9; }
          .payments-table-wrapper { background: #0f172a; border-color: #334155; }
          .close-check-card { background: #0f172a; border-color: #334155; }
          .close-alert-warning { background: #7f1d1d; color: #fecaca; }
          .close-alert-success { background: #14532d; color: #86efac; }
          .close-alert-info { background: #1e3a5f; color: #bfdbfe; }
          .items-empty { color: #94a3b8; }
          .confirmation-header { border-bottom-color: #334155; }
          .confirmation-title { color: #f1f5f9; }
          .accident-id { background: #0f172a; color: #f1f5f9; }
          .btn-confirm-cancel { border-color: #475569; color: #94a3b8; }
          .btn-confirm-cancel:hover { background: #334155; color: #e2e8f0; }
        }
      `}</style>
    </>
  );
}