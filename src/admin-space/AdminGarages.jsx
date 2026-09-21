// src/pages/admin/AdminGarages.jsx
import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchGarages, selectGarages, selectGaragesLoading,
  createGarage, updateGarage, deleteGarage,
} from "../Redux/store";
import PaginationControls from '../components/PaginationControls';
import { toast } from "sonner";
import {
  Plus, Edit2, Trash2, X, Search, RefreshCw, Building2, Phone, Mail,
  MapPin, IdCard, Activity, CheckCircle, XCircle, Save, TrashIcon,
  ArrowUpDown, ArrowUp, ArrowDown, Sparkles, Star, Download,
} from "lucide-react";

export default function AdminGarages() {
  const dispatch = useDispatch();
  const garages = useSelector(selectGarages);
  const loading = useSelector(selectGaragesLoading);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [garageToDelete, setGarageToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");

  const [formData, setFormData] = useState({
    name: "", address: "", phone: "", email: "",
    rc: "", if: "", ice: "", tp: "", notes: "", is_active: true,
  });

  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => { dispatch(fetchGarages()); }, [dispatch]);

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

  const filteredGarages = useMemo(() => {
    return garages
      .filter((g) => {
        if (searchTerm === "") return true;
        const t = searchTerm.toLowerCase();
        return g.name.toLowerCase().includes(t)
          || (g.address || "").toLowerCase().includes(t)
          || (g.phone || "").includes(searchTerm);
      })
      .sort((a, b) => {
        let aVal, bVal;
        switch (sortField) {
          case "id": aVal = a.id; bVal = b.id; break;
          case "name": aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
          case "phone": aVal = a.phone || ""; bVal = b.phone || ""; break;
          case "email": aVal = a.email || ""; bVal = b.email || ""; break;
          case "is_active": aVal = a.is_active ? 1 : 0; bVal = b.is_active ? 1 : 0; break;
          default: aVal = a.id; bVal = b.id;
        }
        return sortDirection === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });
  }, [garages, searchTerm, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredGarages.length / itemsPerPage);
  const paginated = filteredGarages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: garages.length,
    active: garages.filter((g) => g.is_active).length,
    inactive: garages.filter((g) => !g.is_active).length,
  };

  const resetForm = () => {
    setFormData({ name: "", address: "", phone: "", email: "", rc: "", if: "", ice: "", tp: "", notes: "", is_active: true });
    setEditing(null);
  };

  const handleAddNew = () => { resetForm(); setShowForm(true); };

  const handleEdit = (garage) => {
    setEditing(garage);
    setFormData({
      name: garage.name || "", address: garage.address || "", phone: garage.phone || "",
      email: garage.email || "", rc: garage.rc || "", if: garage.if || "", ice: garage.ice || "",
      tp: garage.tp || "", notes: garage.notes || "",
      is_active: garage.is_active !== undefined ? garage.is_active : true,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    if (submitting) return;
    setShowForm(false);
    resetForm();
  };

  const handleDeleteClick = (garage) => { setGarageToDelete(garage); setDeleteModalOpen(true); };

  const confirmDelete = async () => {
    if (!garageToDelete) return;
    const result = await dispatch(deleteGarage(garageToDelete.id));
    if (result.error) toast.error(result.payload);
    else { toast.success("Garage supprimé"); dispatch(fetchGarages(true)); }
    setDeleteModalOpen(false);
    setGarageToDelete(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let result;
      if (editing) result = await dispatch(updateGarage({ id: editing.id, data: formData }));
      else result = await dispatch(createGarage(formData));
      if (result.error) toast.error(result.payload);
      else {
        toast.success(editing ? "Garage modifié" : "Garage créé");
        setShowForm(false);
        resetForm();
        dispatch(fetchGarages(true));
      }
    } catch { toast.error("Erreur lors de l'opération"); }
    finally { setSubmitting(false); }
  };

  const refreshData = async () => { await dispatch(fetchGarages(true)); toast.success("Données actualisées"); };

  const handleExport = () => {
    const headers = ["ID", "Nom", "Adresse", "Téléphone", "Email", "RC", "IF", "ICE", "TP", "Actif"];
    const csvData = filteredGarages.map((g) => [
      g.id, `"${g.name}"`, `"${g.address || ""}"`, `"${g.phone || ""}"`, `"${g.email || ""}"`,
      `"${g.rc || ""}"`, `"${g.if || ""}"`, `"${g.ice || ""}"`, `"${g.tp || ""}"`,
      g.is_active ? "Oui" : "Non",
    ].join(","));
    const blob = new Blob([headers.join(",") + "\n" + csvData.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `garages_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV effectué");
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Chargement des garages...</p>
      </div>
    );
  }

  return (
    <>
      {/* ====================================================================
          Create / Edit form — AdminModal-style full-screen overlay
         ==================================================================== */}
      {showForm && createPortal(
        <div className="garage-overlay" role="dialog" aria-modal="true">
          <div className="garage-modal">
            <header className="garage-header">
              <div className="garage-header-icon">
                {editing ? <Sparkles size={28} /> : <Building2 size={28} />}
              </div>
              <div className="garage-header-title">
                <h2>{editing ? "Modifier le garage" : "Nouveau garage"}</h2>
                <p>{editing
                  ? "Modifiez les informations du garage"
                  : "Renseignez les informations du nouveau garage"}</p>
              </div>
              <button
                type="button"
                className="garage-header-close"
                onClick={closeForm}
                disabled={submitting}
                aria-label="Fermer"
              >
                <X size={24} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="garage-form">
              <div className="garage-body">
                <div className="garage-form-grid">
                  <div className="garage-form-col">
                    <section className="garage-section">
                      <div className="garage-section-header">
                        <Building2 size={18} />
                        <h3>Informations générales</h3>
                      </div>
                      <div className="garage-grid-2">
                        <div className="garage-field">
                          <label className="garage-label garage-required">Nom</label>
                          <input type="text" className="garage-input" value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required placeholder="Garage Oulfa" />
                        </div>
                        <div className="garage-field">
                          <label className="garage-label">Téléphone</label>
                          <input type="text" className="garage-input" value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="06 12 34 56 78" />
                        </div>
                        <div className="garage-field" style={{ gridColumn: "1 / -1" }}>
                          <label className="garage-label">Adresse</label>
                          <input type="text" className="garage-input" value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="123 Rue des Garages, Casablanca" />
                        </div>
                        <div className="garage-field" style={{ gridColumn: "1 / -1" }}>
                          <label className="garage-label">Email</label>
                          <input type="email" className="garage-input" value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="contact@garage.com" />
                        </div>
                      </div>
                    </section>

                    <section className="garage-section">
                      <div className="garage-section-header">
                        <IdCard size={18} />
                        <h3>Identifiants légaux</h3>
                      </div>
                      <div className="garage-grid-2">
                        <div className="garage-field">
                          <label className="garage-label">RC</label>
                          <input type="text" className="garage-input" value={formData.rc}
                            onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
                            placeholder="580419" />
                        </div>
                        <div className="garage-field">
                          <label className="garage-label">IF</label>
                          <input type="text" className="garage-input" value={formData.if}
                            onChange={(e) => setFormData({ ...formData, if: e.target.value })}
                            placeholder="53743931" />
                        </div>
                        <div className="garage-field">
                          <label className="garage-label">ICE</label>
                          <input type="text" className="garage-input" value={formData.ice}
                            onChange={(e) => setFormData({ ...formData, ice: e.target.value })}
                            placeholder="003274706000087" />
                        </div>
                        <div className="garage-field">
                          <label className="garage-label">TP</label>
                          <input type="text" className="garage-input" value={formData.tp}
                            onChange={(e) => setFormData({ ...formData, tp: e.target.value })}
                            placeholder="35007229" />
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="garage-form-col">
                    <section className="garage-section">
                      <div className="garage-section-header">
                        <Activity size={18} />
                        <h3>Statut et notes</h3>
                      </div>
                      <div className="garage-grid-2">
                        <div className="garage-field">
                          <label className="garage-label">Actif</label>
                          <select className="garage-input" value={formData.is_active ? "1" : "0"}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "1" })}>
                            <option value="1">Oui</option>
                            <option value="0">Non</option>
                          </select>
                        </div>
                      </div>
                      <div className="garage-field" style={{ marginTop: "1rem" }}>
                        <label className="garage-label">Notes</label>
                        <textarea rows="6" className="garage-input garage-textarea" value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Informations supplémentaires..." />
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              <div className="garage-footer">
                <button type="button" className="garage-btn-secondary"
                  onClick={closeForm} disabled={submitting}>
                  Annuler
                </button>
                <button type="submit" className="garage-btn-primary" disabled={submitting}>
                  {submitting ? "Traitement…" : editing ? "Mettre à jour" : "Créer le garage"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ====================================================================
          Delete confirmation — polished confirmation style
         ==================================================================== */}
      {deleteModalOpen && garageToDelete && createPortal(
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
                Êtes-vous sûr de vouloir supprimer le garage<br />
                <span className="garage-name-chip">"{garageToDelete.name}"</span> ?<br />
                Cette action est irréversible.
              </p>
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

      {/* LIST */}
      {!showForm && (
        <div className="admin-container">
          {/* Header */}
          <div className="section-header">
            <div className="header-content">
              <h1 className="section-title">
                <Building2 size={28} /> Gestion des Garages
              </h1>
              <p className="section-subtitle">Liste des garages partenaires</p>
            </div>
            <div className="section-actions">
              <button onClick={refreshData} className="btn btn-secondary">
                <RefreshCw size={16} /> Actualiser
              </button>
              <button onClick={handleExport} className="btn btn-secondary">
                <Download size={16} /> Exporter
              </button>
              <button onClick={handleAddNew} className="btn btn-primary">
                <Plus size={16} /> Nouveau garage
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card stat-total">
              <div><p className="stat-label">Total</p><p className="stat-number">{stats.total}</p></div>
              <Building2 size={32} className="stat-icon" />
            </div>
            <div className="stat-card stat-active">
              <div><p className="stat-label">Actifs</p><p className="stat-number" style={{ color: '#16a34a' }}>{stats.active}</p></div>
              <CheckCircle size={32} className="stat-icon" />
            </div>
            <div className="stat-card stat-inactive">
              <div><p className="stat-label">Inactifs</p><p className="stat-number" style={{ color: '#dc2626' }}>{stats.inactive}</p></div>
              <XCircle size={32} className="stat-icon" />
            </div>
          </div>

          {/* Search */}
          <div className="search-filter-section">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher par nom, adresse, téléphone..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="search-input"
              />
            </div>
          </div>

          {/* Results summary */}
          <div className="results-summary">
            <span className="results-count">
              Affichage de {paginated.length} sur {filteredGarages.length} garage(s)
              {filteredGarages.length !== garages.length && ` (filtré sur ${garages.length} au total)`}
            </span>
            <span className="page-info">Page {currentPage} sur {totalPages || 1}</span>
          </div>

          <div className="content-container">
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("id")} className="sortable-header">ID {getSortIcon("id")}</th>
                    <th onClick={() => handleSort("name")} className="sortable-header">Nom {getSortIcon("name")}</th>
                    <th>Adresse</th>
                    <th onClick={() => handleSort("phone")} className="sortable-header">Téléphone {getSortIcon("phone")}</th>
                    <th onClick={() => handleSort("email")} className="sortable-header">Email {getSortIcon("email")}</th>
                    <th onClick={() => handleSort("is_active")} className="sortable-header">Statut {getSortIcon("is_active")}</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-12">Aucun garage trouvé</td></tr>
                  ) : (
                    paginated.map((g) => (
                      <tr key={g.id}>
                        <td className="font-medium">#{g.id}</td>
                        <td><div className="flex items-center gap-2"><Building2 size={14} />{g.name}</div></td>
                        <td><div className="flex items-center gap-2"><MapPin size={14} />{g.address || "—"}</div></td>
                        <td><div className="flex items-center gap-2"><Phone size={14} />{g.phone || "—"}</div></td>
                        <td><div className="flex items-center gap-2"><Mail size={14} />{g.email || "—"}</div></td>
                        <td>
                          {g.is_active
                            ? <span className="badge badge-success"><CheckCircle size={12} /> Actif</span>
                            : <span className="badge badge-danger"><XCircle size={12} /> Inactif</span>}
                        </td>
                        <td className="text-right">
                          <div className="action-buttons-circular">
                            <button
                              onClick={() => handleEdit(g)}
                              className="icon-action-btn"
                              title="Modifier"
                              style={{ color: "#10b981" }}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(g)}
                              className="icon-action-btn"
                              title="Supprimer"
                              style={{ color: "#ef4444" }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination-container">
                <PaginationControls
                  currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={filteredGarages.length}
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
        .btn-clear { background: #ef4444; color: #fff; }
        .btn-clear:hover { background: #dc2626; }

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

        /* ================= Search ================= */
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
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        /* ================= Table ================= */
        .data-table {
          width: 100%;
          font-size: 0.875rem;
          border-collapse: collapse;
          min-width: 800px;
        }
        .data-table th {
          text-align: left;
          padding: 0.75rem 1rem;
          background: #f8fafc;
          color: #64748b;
          font-weight: 500;
          white-space: nowrap;
          border-bottom: 1px solid #e2e8f0;
        }
        .data-table td {
          padding: 0.75rem 1rem;
          border-top: 1px solid #e2e8f0;
          color: #334155;
          vertical-align: middle;
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
          padding: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          border-radius: 0.5rem;
          transition: all 0.2s;
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
           Create / Edit form — full-screen overlay (AdminModal shell)
           ==================================================================== */
        .garage-overlay {
          position: fixed;
          top: 0; right: 0; bottom: 0; left: 0;
          background: #f8fafc;
          overflow-y: auto; overflow-x: hidden;
          z-index: 9999;
        }
        @media (min-width: 768px) {
          .garage-overlay { left: 18rem; }
        }

        .garage-modal {
          background: #fff;
          border-radius: 32px;
          margin: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: amSlideIn 0.3s ease-out;
        }

        .garage-header {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 24px 32px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .garage-header-icon {
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
        .garage-header-title { flex: 1; min-width: 0; padding-right: 48px; }
        .garage-header-title h2 {
          color: #fff;
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
        }
        .garage-header-title p {
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.875rem;
          margin: 4px 0 0;
        }
        .garage-header-close {
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
        .garage-header-close:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.05);
        }
        .garage-header-close:disabled { opacity: 0.5; cursor: not-allowed; }

        .garage-form { padding: 28px 32px; }

        .garage-body {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .garage-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          align-items: start;
        }
        .garage-form-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .garage-section {
          background: #f8fafc;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }
        .garage-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #667eea;
        }
        .garage-section-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .garage-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .garage-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }
        .garage-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .garage-required::after { content: " *"; color: #dc2626; }

        .garage-input {
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
        .garage-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .garage-textarea { resize: vertical; min-height: 120px; }

        .garage-footer {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .garage-btn-primary,
        .garage-btn-secondary {
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
        .garage-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          padding: 12px 28px;
          color: #fff;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        .garage-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        .garage-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .garage-btn-secondary {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          padding: 10px 24px;
          color: #475569;
        }
        .garage-btn-secondary:hover:not(:disabled) {
          border-color: #667eea;
          color: #667eea;
          background: #f8fafc;
        }
        .garage-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ====================================================================
           Delete confirmation — polished confirmation style
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
        .confirmation-title {
          font-size: 1.5rem; font-weight: 700;
          color: #0f172a; margin: 0;
        }
        .confirmation-body { padding: 1.5rem 2rem; }
        .confirmation-message {
          color: #64748b; font-size: 1rem;
          line-height: 1.6; margin: 0; text-align: center;
        }
        .garage-name-chip {
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

        /* ================= Loading ================= */
        .loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: #64748b; }
        .spinner {
          width: 48px; height: 48px; border: 3px solid #e2e8f0;
          border-top: 3px solid #667eea; border-radius: 50%;
          animation: spin 1s linear infinite; margin-bottom: 1rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ================= Utility ================= */
        .font-medium { font-weight: 500; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .py-12 { padding: 3rem 0; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .gap-2 { gap: 0.5rem; }

        /* ================= Responsive ================= */
        @media (max-width: 1024px) {
          .garage-form-grid { grid-template-columns: 1fr; gap: 24px; }
          .section-header { flex-direction: column; }
          .section-actions { width: 100%; justify-content: flex-start; }
        }
        @media (max-width: 768px) {
          .garage-modal { margin: 1rem; border-radius: 24px; }
          .garage-header { padding: 16px 20px; gap: 14px; }
          .garage-header-title h2 { font-size: 1.25rem; }
          .garage-header-title { padding-right: 40px; }
          .garage-header-icon { width: 44px; height: 44px; border-radius: 22px; }
          .garage-header-close { top: 16px; right: 16px; width: 36px; height: 36px; }
          .garage-form { padding: 20px; }
          .garage-grid-2 { grid-template-columns: 1fr; }

          .search-filter-section { flex-direction: column; align-items: stretch; }
          .search-box { min-width: auto; }
          .results-summary { flex-direction: column; gap: 0.5rem; align-items: flex-start; }
          .content-container { overflow-x: auto; }
          .data-table { min-width: 700px; }
        }
      `}</style>
    </>
  );
}