// src/pages/admin/CreditManagement.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchMatricules, fetchCars, fetchReservations, fetchClients, refreshMatricules,
  selectMatricules, selectCars, selectMatriculesLoading, selectReservations, selectClients,
} from "../Redux/store";
import PaginationControls from "../components/PaginationControls";
import { toast } from "sonner";
import {
  Search, RefreshCw, Tag, Car, User, Users, CalendarDays,
  DollarSign, Wallet, ArrowUpDown, ArrowUp, ArrowDown, X,
  ExternalLink, History, CheckCircle2, UserX, Receipt, Calendar,
  Fuel, Battery, Leaf, Settings, Gauge, CreditCard,
} from "lucide-react";

export default function CreditManagement() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const matricules = useSelector(selectMatricules);
  const cars = useSelector(selectCars);
  const reservations = useSelector(selectReservations);
  const clients = useSelector(selectClients);
  const loading = useSelector(selectMatriculesLoading);

  const [searchTerm, setSearchTerm] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [debtFilter, setDebtFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState("totalRemaining");
  const [sortDirection, setSortDirection] = useState("desc");
  const [historyMatricule, setHistoryMatricule] = useState(null);

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const loadData = async () => {
    await Promise.all([
      dispatch(fetchMatricules()),
      dispatch(fetchCars()),
      dispatch(fetchClients()),
      dispatch(fetchReservations()),
    ]);
  };

  const refreshData = async () => {
    await dispatch(refreshMatricules());
    await dispatch(fetchCars());
    await dispatch(fetchClients());
    await dispatch(fetchReservations());
    toast.success("Données actualisées");
  };

  // ==================== HELPERS ====================
  const getFuelLabel = (fuel) => {
    const labels = { petrol: "Essence", diesel: "Diesel", electric: "Électrique", hybrid: "Hybride" };
    return labels[fuel] || fuel;
  };

  const getFuelIcon = (fuel) => {
    switch (fuel) {
      case "petrol":
      case "diesel":
        return <Fuel size={12} />;
      case "electric":
        return <Battery size={12} />;
      case "hybrid":
        return <Leaf size={12} />;
      default:
        return <Fuel size={12} />;
    }
  };

  const getTransmissionLabel = (t) => (t === "automatic" ? "Automatique" : "Manuelle");
  const getTransmissionIcon = (t) =>
    t === "automatic" ? <Gauge size={12} /> : <Settings size={12} />;

  const getMatriculeReservations = (matId) =>
    (reservations || [])
      .filter((r) => r.matricule_id === matId)
      .filter((r) => !["pending", "cancelled", "contacted"].includes(r.status));

  const getCurrentReservation = (matId) => {
    const allRes = getMatriculeReservations(matId);
    const retard = allRes.filter((r) => r.status === "retard");
    if (retard.length > 0) {
      return retard.sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0];
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const confirmed = allRes
      .filter((r) => r.status === "confirmed" && r.end_date && new Date(r.end_date) >= today)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    return confirmed.length > 0 ? confirmed[0] : null;
  };

  const getLastReservation = (matId) => {
    const list = getMatriculeReservations(matId);
    if (!list.length) return null;
    return [...list].sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0];
  };

  const getDisplayReservation = (matId) => {
    const current = getCurrentReservation(matId);
    if (current) return { reservation: current, isCurrent: true };
    const last = getLastReservation(matId);
    return { reservation: last, isCurrent: false };
  };

  const getTotalRemainingForClient = (matId, clientId) => {
    if (!clientId) return 0;
    return getMatriculeReservations(matId)
      .filter((r) => r.client_id === clientId)
      .reduce((sum, r) => sum + (parseFloat(r.remaining_amount) || 0), 0);
  };

  const calcDurationDays = (start, end) => {
    if (!start || !end) return null;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const formatMoney = (val) => `${(parseFloat(val) || 0).toLocaleString("fr-FR")} DH`;
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

  const reservationStatusLabel = {
    pending: { label: "En attente", bg: "badge-warning" },
    confirmed: { label: "Confirmée", bg: "badge-blue" },
    completed: { label: "Terminée", bg: "badge-success" },
    retard: { label: "En retard", bg: "badge-danger" },
    contacted: { label: "Contacté", bg: "badge-warning" },
    cancelled: { label: "Annulée", bg: "badge-gray" },
  };

  // ==================== SORT ====================
  const handleSort = (field) => {
    if (sortField === field) setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="sort-icon" />;
    return sortDirection === "asc" ? (
      <ArrowUp size={12} className="sort-icon active" />
    ) : (
      <ArrowDown size={12} className="sort-icon active" />
    );
  };

  // ==================== ENRICH + FILTER + SORT ====================
  const enriched = (matricules || []).map((mat) => {
    const car = cars.find((c) => c.id === mat.car_id);
    const { reservation: dispRes, isCurrent } = getDisplayReservation(mat.id);
    const client = dispRes ? clients.find((c) => c.id === dispRes.client_id) : null;
    const duration = dispRes ? calcDurationDays(dispRes.start_date, dispRes.end_date) : null;
    const totalRestantForClient = getTotalRemainingForClient(mat.id, client?.id);
    const period = dispRes
      ? `${formatDate(dispRes.start_date)} → ${formatDate(dispRes.end_date)}`
      : "—";
    return { mat, car, dispRes, isCurrent, client, duration, totalRestantForClient, period };
  });

  const filteredList = enriched
    .filter(({ mat, car, client, isCurrent, totalRestantForClient }) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === "" ||
        mat.matricule_code?.toLowerCase().includes(term) ||
        car?.brand?.toLowerCase().includes(term) ||
        car?.model?.toLowerCase().includes(term) ||
        (client && `${client.prenom} ${client.nom}`.toLowerCase().includes(term));

      let matchesClientFilter = true;
      if (clientFilter === "current") matchesClientFilter = isCurrent;
      else if (clientFilter === "previous") matchesClientFilter = !isCurrent && !!client;
      else if (clientFilter === "none") matchesClientFilter = !client;

      let matchesDebt = true;
      if (debtFilter === "withDebt") matchesDebt = totalRestantForClient > 0;
      else if (debtFilter === "noDebt") matchesDebt = totalRestantForClient <= 0;

      return matchesSearch && matchesClientFilter && matchesDebt;
    })
    .sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case "matricule":
          aVal = a.mat.matricule_code?.toLowerCase() || "";
          bVal = b.mat.matricule_code?.toLowerCase() || "";
          break;
        case "car":
          aVal = a.car ? `${a.car.brand} ${a.car.model}`.toLowerCase() : "";
          bVal = b.car ? `${b.car.brand} ${b.car.model}`.toLowerCase() : "";
          break;
        case "client":
          aVal = a.client ? `${a.client.prenom} ${a.client.nom}`.toLowerCase() : "";
          bVal = b.client ? `${b.client.prenom} ${b.client.nom}`.toLowerCase() : "";
          break;
        case "duration":
          aVal = a.duration || 0;
          bVal = b.duration || 0;
          break;
        case "total":
          aVal = a.dispRes ? parseFloat(a.dispRes.total_price) || 0 : 0;
          bVal = b.dispRes ? parseFloat(b.dispRes.total_price) || 0 : 0;
          break;
        case "paid":
          aVal = a.dispRes ? parseFloat(a.dispRes.amount_paid) || 0 : 0;
          bVal = b.dispRes ? parseFloat(b.dispRes.amount_paid) || 0 : 0;
          break;
        case "remaining":
          aVal = a.dispRes ? parseFloat(a.dispRes.remaining_amount) || 0 : 0;
          bVal = b.dispRes ? parseFloat(b.dispRes.remaining_amount) || 0 : 0;
          break;
        case "totalRemaining":
          aVal = a.totalRestantForClient || 0;
          bVal = b.totalRestantForClient || 0;
          break;
        default:
          aVal = a.mat.id;
          bVal = b.mat.id;
      }
      if (sortDirection === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginated = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ==================== STATS ====================
  const stats = {
    total: matricules?.length || 0,
    withDebt: enriched.filter((e) => e.totalRestantForClient > 0).length,
    withoutClient: enriched.filter((e) => !e.client).length,
    totalDue: enriched.reduce(
      (sum, e) => sum + getTotalRemainingForClient(e.mat.id, e.client?.id),
      0
    ),
  };

  // ==================== ACTIONS ====================
  const handleOpenHistory = (mat) => setHistoryMatricule(mat);
  const handleCloseHistory = () => setHistoryMatricule(null);

  const handleGoToMatricule = (matriculeId) => {
    navigate(`/admin/matricules?focus=${matriculeId}`);
  };

  const handleGoToReservation = (reservationId, clientName) => {
    if (!reservationId) return;
    if (clientName) {
      navigate(`/admin/reservations?search=${encodeURIComponent(clientName)}`);
    } else {
      navigate(`/admin/reservations?focus=${reservationId}`);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Chargement des crédits...</p>
      </div>
    );
  }

  const historyReservations = historyMatricule
    ? [...getMatriculeReservations(historyMatricule.id)].sort(
        (a, b) => new Date(b.start_date) - new Date(a.start_date)
      )
    : [];
  const historyCar = historyMatricule
    ? cars.find((c) => c.id === historyMatricule.car_id)
    : null;
  const historyTotalDue = historyReservations.reduce(
    (sum, r) => sum + (parseFloat(r.remaining_amount) || 0),
    0
  );

  return (
    <>
      <div className="admin-container">
        {/* ==================== Header ==================== */}
        <div className="section-header">
          <div className="header-content">
            <h1 className="section-title">
              <CreditCard size={28} className="title-icon" /> Crédits par Matricule
            </h1>
            <p className="section-subtitle">
              Suivi des montants restants regroupés par immatriculation
            </p>
          </div>
          <div className="section-actions">
            <button onClick={refreshData} className="btn btn-secondary">
              <RefreshCw size={16} /> Actualiser
            </button>
          </div>
        </div>

        {/* ==================== Stats ==================== */}
        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div>
              <p className="stat-label">Total Immatriculations</p>
              <p className="stat-number">{stats.total}</p>
            </div>
            <Tag size={32} className="stat-icon" />
          </div>
          <div className="stat-card stat-withdebt">
            <div>
              <p className="stat-label">Avec montant dû</p>
              <p className="stat-number" style={{ color: "#dc2626" }}>
                {stats.withDebt}
              </p>
            </div>
            <Wallet size={32} className="stat-icon" style={{ color: "#dc2626" }} />
          </div>
          <div className="stat-card stat-noclient">
            <div>
              <p className="stat-label">Sans client</p>
              <p className="stat-number" style={{ color: "#94a3b8" }}>
                {stats.withoutClient}
              </p>
            </div>
            <UserX size={32} className="stat-icon" style={{ color: "#94a3b8" }} />
          </div>
          <div className="stat-card stat-totaldue">
            <div>
              <p className="stat-label">Total dû</p>
              <p className="stat-number" style={{ color: "#dc2626", fontSize: "1.35rem" }}>
                {formatMoney(stats.totalDue)}
              </p>
            </div>
            <DollarSign size={32} className="stat-icon" style={{ color: "#dc2626" }} />
          </div>
        </div>

        {/* ==================== Search + Filters ==================== */}
        <div className="search-filter-section">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par plaque, véhicule, client..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
          </div>
          <div className="filter-group">
            <div className="filter-item">
              <label>
                <User size={14} className="filter-icon" /> Client
              </label>
              <select
                value={clientFilter}
                onChange={(e) => {
                  setClientFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-select"
              >
                <option value="all">Tous les clients</option>
                <option value="current">Client actuel</option>
                <option value="previous">Client précédent</option>
                <option value="none">Sans client</option>
              </select>
            </div>
            <div className="filter-item">
              <label>
                <Wallet size={14} className="filter-icon" /> Crédit
              </label>
              <select
                value={debtFilter}
                onChange={(e) => {
                  setDebtFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-select"
              >
                <option value="all">Tous les statuts</option>
                <option value="withDebt">Avec montant dû</option>
                <option value="noDebt">Sans montant dû</option>
              </select>
            </div>
            {(searchTerm !== "" || clientFilter !== "all" || debtFilter !== "all") && (
              <button
                className="btn btn-clear"
                onClick={() => {
                  setSearchTerm("");
                  setClientFilter("all");
                  setDebtFilter("all");
                  setCurrentPage(1);
                }}
              >
                Effacer les filtres
              </button>
            )}
          </div>
        </div>

        {/* ==================== Results summary ==================== */}
        <div className="results-summary">
          <span className="results-count">
            Affichage de {paginated.length} sur {filteredList.length} matricule(s)
            {filteredList.length !== (matricules?.length || 0) &&
              ` (filtré sur ${matricules?.length || 0} au total)`}
          </span>
          <span className="page-info">
            Page {currentPage} sur {totalPages || 1}
          </span>
        </div>

        {/* ==================== Content ==================== */}
        <div className="content-container">
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("matricule")} className="sortable-header">
                    Plaque {getSortIcon("matricule")}
                  </th>
                  <th onClick={() => handleSort("car")} className="sortable-header">
                    Véhicule {getSortIcon("car")}
                  </th>
                  <th onClick={() => handleSort("client")} className="sortable-header">
                    Client {getSortIcon("client")}
                  </th>
                  <th>Période</th>
                  <th onClick={() => handleSort("duration")} className="sortable-header">
                    Durée {getSortIcon("duration")}
                  </th>
                  <th onClick={() => handleSort("total")} className="sortable-header">
                    Total {getSortIcon("total")}
                  </th>
                  <th onClick={() => handleSort("paid")} className="sortable-header">
                    Payé {getSortIcon("paid")}
                  </th>
                  <th onClick={() => handleSort("remaining")} className="sortable-header">
                    Restant {getSortIcon("remaining")}
                  </th>
                  <th onClick={() => handleSort("totalRemaining")} className="sortable-header">
                    Total dû {getSortIcon("totalRemaining")}
                  </th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-12">
                      Aucun matricule trouvé
                    </td>
                  </tr>
                ) : (
                  paginated.map(
                    ({
                      mat,
                      car,
                      dispRes,
                      isCurrent,
                      client,
                      duration,
                      totalRestantForClient,
                      period,
                    }) => (
                      <tr key={mat.id}>
                        <td className="matricule-code">{mat.matricule_code}</td>
                        <td>
                          {car ? (
                            <div className="car-info">
                              <div className="car-name">
                                {car.brand} {car.model}
                              </div>
                              <div className="car-details">
                                <span>{car.year}</span>
                                <span>•</span>
                                <span>{car.color}</span>
                                <span>•</span>
                                <span className="meta-with-icon">
                                  {getFuelIcon(car.fuel_type)} {getFuelLabel(car.fuel_type)}
                                </span>
                                <span>•</span>
                                <span className="meta-with-icon">
                                  {getTransmissionIcon(car.transmission)}{" "}
                                  {getTransmissionLabel(car.transmission)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-italic">Non assigné</span>
                          )}
                        </td>
                        <td>
                          {client ? (
                            <div className="client-cell">
                              <span
                                className={`badge ${
                                  isCurrent ? "badge-success" : "badge-warning"
                                }`}
                              >
                                {isCurrent ? "Actuel" : "Précédent"}
                              </span>
                              <span className="client-name-row">
                                <User size={12} /> {client.prenom} {client.nom}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-italic">Aucun client</span>
                          )}
                        </td>
                        <td>
                          {dispRes ? (
                            <div className="period-cell">
                              <Calendar size={12} className="period-icon" />
                              <span>{period}</span>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          {duration ? (
                            <span className="badge badge-gray">
                              <CalendarDays size={12} className="badge-icon-color" /> {duration}{" "}
                              {duration > 1 ? "jours" : "jour"}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          {dispRes ? (
                            <span className="badge badge-total">
                              <DollarSign size={12} /> {formatMoney(dispRes.total_price)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          {dispRes ? (
                            <span className="money-paid">
                              {formatMoney(dispRes.amount_paid)}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          {dispRes ? (
                            <span className="money-due">
                              {formatMoney(dispRes.remaining_amount)}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          <span
                            className="money-total"
                            style={{
                              color:
                                totalRestantForClient > 0 ? "#dc2626" : "#16a34a",
                            }}
                          >
                            {formatMoney(totalRestantForClient)}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="action-buttons-circular">
                            <button
                              className="icon-action-btn"
                              onClick={() => handleOpenHistory(mat)}
                              title="Historique des réservations"
                              style={{ color: "#3b82f6" }}
                            >
                              <History size={16} />
                            </button>
                            {dispRes && (
                              <button
                                className="icon-action-btn"
                                onClick={() =>
                                  handleGoToReservation(
                                    dispRes.id,
                                    client ? `${client.prenom} ${client.nom}` : null
                                  )
                                }
                                title="Voir la réservation"
                                style={{ color: "#eab308" }}
                              >
                                <ExternalLink size={16} />
                              </button>
                            )}
                            <button
                              className="icon-action-btn"
                              onClick={() => handleGoToMatricule(mat.id)}
                              title="Ouvrir la fiche matricule"
                              style={{ color: "#16a34a" }}
                            >
                              <Car size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )
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
                totalItems={filteredList.length}
              />
            </div>
          )}
        </div>
      </div>

      {/* ==================== HISTORY MODAL ==================== */}
      {historyMatricule && (
        <div className="confirmation-modal-overlay" onClick={handleCloseHistory}>
          <div
            className="credit-history-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="credit-history-header">
              <div className="credit-history-header-left">
                <div className="credit-history-icon">
                  <History size={22} />
                </div>
                <div>
                  <h3 className="credit-history-title">
                    {historyMatricule.matricule_code}
                  </h3>
                  <p className="credit-history-subtitle">
                    <Car size={12} />{" "}
                    {historyCar
                      ? `${historyCar.brand} ${historyCar.model}`
                      : "Véhicule non assigné"}
                  </p>
                </div>
              </div>
              <button
                className="credit-history-close"
                onClick={handleCloseHistory}
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="credit-history-body">
              <div className="credit-history-stats">
                <div className="credit-history-stat">
                  <div>
                    <p className="credit-history-stat-label">Réservations</p>
                    <p className="credit-history-stat-value">
                      {historyReservations.length}
                    </p>
                  </div>
                  <Receipt size={24} className="credit-history-stat-icon" />
                </div>
                <div className="credit-history-stat">
                  <div>
                    <p className="credit-history-stat-label">Total dû</p>
                    <p
                      className="credit-history-stat-value"
                      style={{ color: "#dc2626" }}
                    >
                      {formatMoney(historyTotalDue)}
                    </p>
                  </div>
                  <Wallet
                    size={24}
                    className="credit-history-stat-icon"
                    style={{ color: "#dc2626" }}
                  />
                </div>
                <div className="credit-history-stat">
                  <div>
                    <p className="credit-history-stat-label">Statut matricule</p>
                    <p
                      className="credit-history-stat-value"
                      style={{ fontSize: "1rem", textTransform: "capitalize" }}
                    >
                      {historyMatricule.status}
                    </p>
                  </div>
                  <CheckCircle2 size={24} className="credit-history-stat-icon" />
                </div>
              </div>

              <div className="credit-history-table-wrapper">
                <table className="credit-history-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Période</th>
                      <th>Durée</th>
                      <th>Statut</th>
                      <th>Total</th>
                      <th>Payé</th>
                      <th>Restant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyReservations.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-12">
                          Aucune réservation pour ce matricule
                        </td>
                      </tr>
                    ) : (
                      historyReservations.map((res) => {
                        const client = clients.find((c) => c.id === res.client_id);
                        const statusInfo =
                          reservationStatusLabel[res.status] || {
                            label: res.status,
                            bg: "badge-blue",
                          };
                        const duration = calcDurationDays(res.start_date, res.end_date);
                        return (
                          <tr key={res.id}>
                            <td className="font-medium">
                              {client ? `${client.prenom} ${client.nom}` : "—"}
                            </td>
                            <td>
                              {formatDate(res.start_date)} → {formatDate(res.end_date)}
                            </td>
                            <td>{duration ? `${duration} jours` : "—"}</td>
                            <td>
                              <span className={`badge ${statusInfo.bg}`}>
                                {statusInfo.label}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600 }}>
                              {formatMoney(res.total_price)}
                            </td>
                            <td style={{ color: "#16a34a", fontWeight: 600 }}>
                              {formatMoney(res.amount_paid)}
                            </td>
                            <td style={{ color: "#dc2626", fontWeight: 600 }}>
                              {formatMoney(res.remaining_amount)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="credit-history-footer">
              <button
                className="btn-confirm-cancel"
                onClick={handleCloseHistory}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== STYLES ==================== */}
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif; background: #f8fafc; }

        /* ================= Layout ================= */
        .admin-container { padding: 1.5rem; margin: 0 auto; }

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
        .btn-clear { background: #ef4444; color: #fff; }
        .btn-clear:hover { background: #dc2626; transform: translateY(-1px); }

        /* ================= Stats ================= */
        .stats-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem; margin-bottom: 1.5rem;
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
        .stat-total::before { background: linear-gradient(135deg, #667eea, #764ba2); }
        .stat-withdebt::before { background: linear-gradient(135deg, #ef4444, #dc2626); }
        .stat-noclient::before { background: linear-gradient(135deg, #94a3b8, #64748b); }
        .stat-totaldue::before { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        .stat-number { font-size: 1.875rem; font-weight: 700; color: #0f172a; line-height: 1; }
        .stat-label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0.35rem; }
        .stat-icon { opacity: 0.5; }

        /* ================= Search + Filters ================= */
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
          background: #fff;
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
          overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        /* ================= Table ================= */
        .data-table {
          width: 100%; font-size: 0.875rem;
          border-collapse: collapse; min-width: 1200px;
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

        /* ================= Cell helpers ================= */
        .matricule-code {
          font-family: 'Courier New', monospace; font-weight: 700;
          color: #667eea; font-size: 0.95rem; white-space: nowrap;
        }
        .car-info { display: flex; flex-direction: column; gap: 2px; }
        .car-name { font-weight: 600; color: #0f172a; }
        .car-details {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.7rem; color: #64748b; flex-wrap: wrap;
        }
        .meta-with-icon { display: inline-flex; align-items: center; gap: 3px; }
        .client-cell { display: flex; flex-direction: column; gap: 4px; }
        .client-name-row {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 0.8rem; font-weight: 600; color: #0f172a;
        }
        .period-cell {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 0.75rem;
        }
        .period-icon { color: #64748b; }
        .badge-icon-color { color: #eab308; }
        .money-paid { font-weight: 600; color: #16a34a; }
        .money-due { font-weight: 600; color: #dc2626; }
        .money-total { font-weight: 700; }
        .text-muted { color: #cbd5e1; }
        .text-muted-italic { color: #94a3b8; font-style: italic; font-size: 0.8rem; }
        .font-medium { font-weight: 500; }

        /* ================= Action buttons ================= */
        .action-buttons-circular {
          display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center;
        }
        .icon-action-btn {
          padding: 0.5rem; background: none; border: none; cursor: pointer;
          border-radius: 0.5rem; transition: all 0.2s;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .icon-action-btn:hover { background: rgba(15, 23, 42, 0.06); }

        /* ================= Pagination wrapper ================= */
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
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-danger  { background: #fee2e2; color: #991b1b; }
        .badge-blue    { background: #dbeafe; color: #1e40af; }
        .badge-gray    { background: #f1f5f9; color: #475569; }
        .badge-total   { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; font-weight: 700; }

        /* ================= Empty / Utility ================= */
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .py-12 { padding: 3rem 0; color: #94a3b8; }

        /* ================= Loading ================= */
        .loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: #64748b; }
        .spinner {
          width: 48px; height: 48px; border: 3px solid #e2e8f0;
          border-top: 3px solid #667eea; border-radius: 50%;
          animation: spin 1s linear infinite; margin-bottom: 1rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ================= History modal ================= */
        .confirmation-modal-overlay {
          position: fixed;
          top: 0; right: 0; bottom: 0; left: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          z-index: 10000; padding: 1rem;
          overflow-y: auto; overflow-x: hidden;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .credit-history-modal {
          background: #fff; border-radius: 1.25rem;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
          width: 100%; max-width: 900px;
          max-height: 90vh; overflow: hidden;
          display: flex; flex-direction: column;
          animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          margin: auto;
        }

        .credit-history-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1.5rem 1.75rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
        }
        .credit-history-header-left { display: flex; align-items: center; gap: 14px; }
        .credit-history-icon {
          width: 44px; height: 44px; border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
        }
        .credit-history-title { font-size: 1.25rem; font-weight: 700; margin: 0; }
        .credit-history-subtitle {
          display: flex; align-items: center; gap: 5px;
          font-size: 0.8rem; color: rgba(255, 255, 255, 0.85);
          margin: 4px 0 0;
        }
        .credit-history-close {
          background: rgba(255, 255, 255, 0.15);
          border: none; border-radius: 40px;
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #fff; transition: all 0.2s;
        }
        .credit-history-close:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.05);
        }

        .credit-history-body {
          padding: 1.5rem 1.75rem;
          overflow-y: auto;
        }

        .credit-history-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem; margin-bottom: 1.5rem;
        }
        .credit-history-stat {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1rem; background: #f8fafc;
          border: 1px solid #e2e8f0; border-radius: 0.75rem;
        }
        .credit-history-stat-label {
          font-size: 0.7rem; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.5px;
          margin-bottom: 0.35rem; font-weight: 600;
        }
        .credit-history-stat-value {
          font-size: 1.25rem; font-weight: 700; color: #0f172a;
        }
        .credit-history-stat-icon { color: #cbd5e1; flex-shrink: 0; }

        .credit-history-table-wrapper {
          border: 1px solid #e2e8f0; border-radius: 0.75rem;
          overflow-x: auto;
        }
        .credit-history-table {
          width: 100%; font-size: 0.85rem;
          border-collapse: collapse; min-width: 700px;
        }
        .credit-history-table th {
          text-align: left; padding: 0.75rem 1rem;
          background: #f8fafc; color: #64748b; font-weight: 500;
          white-space: nowrap; border-bottom: 1px solid #e2e8f0;
        }
        .credit-history-table td {
          padding: 0.75rem 1rem; border-top: 1px solid #e2e8f0;
          color: #334155; vertical-align: middle;
        }
        .credit-history-table tr:hover { background: #f8fafc; }

        .credit-history-footer {
          display: flex; justify-content: flex-end;
          padding: 1rem 1.75rem 1.5rem;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
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

        /* ================= Responsive ================= */
        @media (max-width: 1024px) {
          .section-header { flex-direction: column; }
          .section-actions { width: 100%; justify-content: flex-start; }
        }
        @media (max-width: 768px) {
          .admin-container { padding: 1rem; }
          .section-header { padding: 1.5rem; }
          .search-filter-section { flex-direction: column; align-items: stretch; }
          .search-box { min-width: auto; }
          .filter-group { flex-direction: column; align-items: stretch; }
          .filter-item { width: 100%; }
          .filter-select { width: 100%; min-width: auto; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .results-summary { flex-direction: column; gap: 0.5rem; align-items: flex-start; }
          .credit-history-stats { grid-template-columns: 1fr; }
          .credit-history-header { padding: 1rem 1.25rem; }
          .credit-history-title { font-size: 1.05rem; }
          .credit-history-body { padding: 1rem 1.25rem; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}