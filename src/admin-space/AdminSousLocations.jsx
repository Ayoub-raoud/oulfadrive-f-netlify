// src/pages/admin/AdminSousLocations.jsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSousLocations,
  selectSousLocations,
  selectSousLocationsLoading,
  fetchSousLocationDetails,
  selectSelectedSousLocation,
  clearSelectedSousLocation,
  deleteSousLocation,
  createSousLocation,
  updateSousLocation,
} from '../Redux/store';
import {
  ChevronRight, Trash2, Edit, Plus, X, RefreshCw, Download,
  List, LayoutGrid, Search, Eye, Calendar, Users, Tag, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import PaginationControls from '../components/PaginationControls';

export default function AdminSousLocations() {
  const dispatch = useDispatch();
  const sousLocations = useSelector(selectSousLocations);
  const loading = useSelector(selectSousLocationsLoading);
  const selected = useSelector(selectSelectedSousLocation);
  const [expandedId, setExpandedId] = useState(null);

  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [listItemsPerPage, setListItemsPerPage] = useState(10);
  const [cardsItemsPerPage, setCardsItemsPerPage] = useState(12);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
  const [submitting, setSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => { dispatch(fetchSousLocations()); }, [dispatch]);

  const handleViewDetails = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      dispatch(clearSelectedSousLocation());
    } else {
      setExpandedId(id);
      dispatch(fetchSousLocationDetails(id));
    }
  };

  const handleDeleteClick = (id, name) => {
    setItemToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await dispatch(deleteSousLocation(itemToDelete.id)).unwrap();
      toast.success('Supprimée');
      if (expandedId === itemToDelete.id) {
        setExpandedId(null);
        dispatch(clearSelectedSousLocation());
      }
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      toast.error(err.message || 'Erreur');
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({ name: '', description: '', status: 'active' });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name, description: item.description || '', status: item.status || 'active' });
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Le nom est obligatoire'); return; }
    setSubmitting(true);
    try {
      if (editingItem) {
        await dispatch(updateSousLocation({ id: editingItem.id, data: formData })).unwrap();
        toast.success('Sous-location modifiée');
      } else {
        await dispatch(createSousLocation(formData)).unwrap();
        toast.success('Sous-location créée');
      }
      setShowModal(false);
      dispatch(fetchSousLocations());
    } catch (err) {
      toast.error(err.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = () => { dispatch(fetchSousLocations()); toast.success('Liste actualisée'); };

  const handleExport = () => {
    if (sousLocations.length === 0) { toast.warning('Aucune sous-location à exporter'); return; }
    const headers = ['ID', 'Nom', 'Description', 'Statut', 'Réservations', 'Créé le'];
    const rows = sousLocations.map(sl => [
      sl.id, `"${sl.name}"`, `"${(sl.description || '').replace(/"/g, '""')}"`,
      sl.status === 'active' ? 'Actif' : 'Inactif',
      sl.reservations_count || 0,
      new Date(sl.created_at).toLocaleDateString('fr-FR'),
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sous_locations_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link);
    toast.success('Export CSV effectué');
  };

  const filteredItems = sousLocations.filter(sl =>
    sl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sl.description && sl.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => (b.id || 0) - (a.id || 0));

  const itemsPerPage = viewMode === 'list' ? listItemsPerPage : cardsItemsPerPage;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status) =>
    status === 'active'
      ? <span className="badge badge-success">● Actif</span>
      : <span className="badge badge-danger">● Inactif</span>;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Chargement des sous-locations...</p>
      </div>
    );
  }

  return (
    <div className="admin-container sous-locations-page">
      {/* Header */}
      <div className="section-header">
        <div className="header-content">
          <h1 className="section-title">
            <Tag size={28} /> Sous-locations
          </h1>
          <p className="section-subtitle">Gestion des sous-locations et réservations associées</p>
        </div>
        <div className="section-actions">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => { setViewMode('list'); setCurrentPage(1); }}
            >
              <List size={16} /> Liste
            </button>
            <button
              className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => { setViewMode('cards'); setCurrentPage(1); }}
            >
              <LayoutGrid size={16} /> Cartes
            </button>
          </div>
          <button className="btn btn-secondary" onClick={handleRefresh}>
            <RefreshCw size={16} /> Actualiser
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={16} /> Exporter
          </button>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Nouvelle sous-location
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="search-filter-section">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par nom ou description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Results summary */}
      <div className="results-summary">
        <span className="results-count">
          Affichage de {paginatedItems.length} sur {filteredItems.length} sous-location(s)
          {filteredItems.length !== sousLocations.length && ` (filtré sur ${sousLocations.length} au total)`}
        </span>
        <span className="page-info">Page {currentPage} sur {totalPages || 1}</span>
      </div>

      <div className="content-container">
        {viewMode === 'list' ? (
          <div className="sous-locations-list">
            {paginatedItems.length === 0 ? (
              <div className="no-data"><Tag size={48} /><p>Aucune sous-location</p></div>
            ) : (
              paginatedItems.map(sl => (
                <div key={sl.id} className="sous-location-item">
                  <div className="sous-location-header" onClick={() => handleViewDetails(sl.id)}>
                    <div className="sous-location-name">
                      <div className="name-wrapper"><Tag size={18} className="name-icon" /><strong>{sl.name}</strong></div>
                      <div className="badge-group">
                        <span className="badge badge-gray">{sl.reservations_count || 0} réservation(s)</span>
                        {getStatusBadge(sl.status)}
                      </div>
                    </div>
                    <div className="sous-location-actions">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(sl); }}
                        className="icon-action-btn"
                        title="Modifier"
                        style={{ color: "#10b981" }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(sl.id, sl.name); }}
                        className="icon-action-btn"
                        title="Supprimer"
                        style={{ color: "#ef4444" }}
                      >
                        <Trash2 size={16} />
                      </button>
                      <ChevronRight size={20} className={`expand-icon ${expandedId === sl.id ? 'rotated' : ''}`} />
                    </div>
                  </div>
                  {expandedId === sl.id && selected && (
                    <div className="sous-location-details">
                      <p><strong>Description :</strong> {selected.description || 'Aucune description'}</p>
                      <div className="reservations-list">
                        <h4>Réservations associées</h4>
                        {selected.reservations && selected.reservations.length > 0 ? (
                          <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                              <thead>
                                <tr><th>ID</th><th>Client</th><th>Véhicule</th><th>Période</th><th>Statut</th></tr>
                              </thead>
                              <tbody>
                                {selected.reservations.map(res => (
                                  <tr key={res.id}>
                                    <td>#{res.id}</td>
                                    <td>{res.client?.prenom} {res.client?.nom}</td>
                                    <td>{res.car?.brand} {res.car?.model}</td>
                                    <td>{res.start_date} → {res.end_date}</td>
                                    <td><span className={`badge badge-${res.status}`}>{res.status}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-muted">Aucune réservation</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="cards-grid-inner">
            {paginatedItems.length === 0 ? (
              <div className="no-data"><Tag size={48} /><p>Aucune sous-location</p></div>
            ) : (
              paginatedItems.map(sl => (
                <div key={sl.id} className="sous-location-card">
                  <div className="card-header">
                    <div className="card-title"><Tag size={20} className="card-icon" /><span>{sl.name}</span></div>
                    <div className="card-status-badge">{getStatusBadge(sl.status)}</div>
                  </div>
                  <div className="card-body">
                    <p className="card-description">{sl.description || 'Aucune description'}</p>
                    <div className="card-stats">
                      <div className="stat-item"><Users size={14} /><span>{sl.reservations_count || 0} réservation(s)</span></div>
                      <div className="stat-item"><Calendar size={14} /><span>Créé le {new Date(sl.created_at).toLocaleDateString('fr-FR')}</span></div>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button onClick={() => openEditModal(sl)} className="card-action-btn edit">
                      <Edit size={14} /> Modifier
                    </button>
                    <button onClick={() => handleDeleteClick(sl.id, sl.name)} className="card-action-btn delete">
                      <Trash2 size={14} /> Supprimer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination-container">
            <PaginationControls
              currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={viewMode === 'list' ? setListItemsPerPage : setCardsItemsPerPage}
              totalItems={filteredItems.length}
            />
          </div>
        )}
      </div>

      {/* ====================================================================
          Create / Edit Modal — AdminModal-style full-screen overlay
          (light background, sidebar offset on desktop, rounded 32px card,
           gradient header with white icon circle, slide-in animation,
           bordered footer with pill buttons)
         ==================================================================== */}
      {showModal && createPortal(
        <div className="sl-overlay" role="dialog" aria-modal="true">
          <div className="sl-modal">
            <header className="sl-header">
              <div className="sl-header-icon">
                <Tag size={28} />
              </div>
              <div className="sl-header-title">
                <h2>{editingItem ? 'Modifier la sous-location' : 'Nouvelle sous-location'}</h2>
                <p>{editingItem
                  ? 'Modifiez les informations puis enregistrez'
                  : 'Renseignez les informations ci-dessous'}</p>
              </div>
              <button
                type="button"
                className="sl-header-close"
                onClick={closeModal}
                disabled={submitting}
                aria-label="Fermer"
              >
                <X size={24} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="sl-form">
              <div className="sl-body">
                <div className="sl-field">
                  <label className="sl-label sl-required">Nom</label>
                  <input
                    type="text"
                    className="sl-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Location groupe"
                    required
                  />
                </div>

                <div className="sl-field">
                  <label className="sl-label">Description</label>
                  <textarea
                    className="sl-input sl-textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description facultative"
                  />
                </div>

                <div className="sl-field">
                  <label className="sl-label">Statut</label>
                  <select
                    className="sl-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>
              </div>

              <div className="sl-footer">
                <button
                  type="button"
                  className="sl-btn-secondary"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="sl-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Traitement…' : editingItem ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ====================================================================
          Delete Confirmation — polished confirmation style
          (full-screen dark blur, centered card, round red icon)
         ==================================================================== */}
      {deleteModalOpen && itemToDelete && createPortal(
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <div className="confirmation-header">
              <div className="confirmation-icon delete">
                <AlertTriangle size={32} />
              </div>
              <h3 className="confirmation-title">Confirmer la suppression</h3>
            </div>

            <div className="confirmation-body">
              <p className="confirmation-message">
                Êtes-vous sûr de vouloir supprimer la sous-location<br />
                <span className="sl-name-chip">"{itemToDelete.name}"</span> ?<br />
                Cette action est irréversible.
              </p>
            </div>

            <div className="confirmation-actions">
              <button
                className="btn-confirm-cancel"
                onClick={() => setDeleteModalOpen(false)}
              >
                Annuler
              </button>
              <button
                className="btn-confirm-delete"
                onClick={confirmDelete}
              >
                <Trash2 size={16} /> Supprimer
              </button>
            </div>
          </div>
        </div>,
        document.body
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
          background: white; border: 1px solid #e2e8f0; border-radius: 1rem;
          overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          padding: 1.5rem;
        }

        /* ================= View toggle ================= */
        .view-toggle { display: flex; gap: 0.25rem; background: #f1f5f9; padding: 0.25rem; border-radius: 0.75rem; }
        .view-btn {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 0.875rem; border: none; background: transparent;
          border-radius: 0.5rem; cursor: pointer; font-size: 0.75rem;
          font-weight: 600; color: #64748b; transition: all 0.2s;
        }
        .view-btn.active { background: #fff; color: #667eea; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .view-btn:hover:not(.active) { background: #e2e8f0; }

        /* ================= List ================= */
        .sous-locations-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .sous-location-item {
          border: 1px solid #e2e8f0; border-radius: 1rem; background: #fff;
          overflow: hidden; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .sous-location-item:hover {
          border-color: #cbd5e1; box-shadow: 0 6px 18px rgba(102,126,234,0.12);
        }
        .sous-location-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1rem 1.5rem; cursor: pointer; transition: background 0.15s;
        }
        .sous-location-header:hover { background: #fafafa; }
        .sous-location-name { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; flex: 1; }
        .name-wrapper { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; }
        .name-icon { color: #667eea; }
        .badge-group { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .sous-location-actions { display: flex; align-items: center; gap: 0.5rem; }
        .expand-icon { transition: transform 0.25s ease; color: #94a3b8; }
        .expand-icon.rotated { transform: rotate(90deg); }
        .sous-location-details {
          padding: 1rem 1.5rem 1.5rem;
          border-top: 1px solid #e2e8f0; background: #fafafa;
        }
        .sous-location-details .data-table {
          background: #fff; border-radius: 0.75rem; overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .text-muted { color: #94a3b8; }

        /* ================= Cards ================= */
        .cards-grid-inner {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .sous-location-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 1rem;
          padding: 1.25rem; transition: all 0.3s ease;
          display: flex; flex-direction: column; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .sous-location-card:hover {
          transform: translateY(-4px); box-shadow: 0 20px 25px -12px rgba(102,126,234,0.18);
        }
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; gap: 0.5rem; }
        .card-title { display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; font-weight: 700; color: #1e293b; }
        .card-icon { color: #667eea; }
        .card-status-badge { flex-shrink: 0; }
        .card-body { flex: 1; }
        .card-description { font-size: 0.875rem; color: #475569; margin-bottom: 0.75rem; min-height: 2.5rem; }
        .card-stats { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.75rem; color: #64748b; }
        .stat-item { display: flex; align-items: center; gap: 0.5rem; }
        .card-actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e2e8f0; }
        .card-action-btn {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 0.5rem; padding: 0.5rem; border-radius: 0.5rem;
          border: 1px solid #e2e8f0; background: #fff; cursor: pointer;
          transition: all 0.2s; font-size: 0.75rem; font-weight: 600;
        }
        .card-action-btn:hover { background: #f8fafc; }
        .card-action-btn.edit:hover { border-color: #10b981; color: #10b981; background: #ecfdf5; }
        .card-action-btn.delete:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }

        /* ================= Data table ================= */
        .data-table {
          width: 100%;
          font-size: 0.875rem;
          border-collapse: collapse;
          min-width: 600px;
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

        /* ================= Icon action buttons ================= */
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

        /* ================= Pagination wrapper ================= */
        .pagination-container {
          padding: 2rem 0 0 0; border-top: 1px solid #f1f3f4;
          margin-top: 1.5rem;
          display: flex; justify-content: center;
        }

        /* ================= Badges ================= */
        .badge {
          display: inline-flex; align-items: center; gap: 0.25rem;
          padding: 0.25rem 0.625rem; border-radius: 9999px;
          font-size: 0.7rem; font-weight: 500; white-space: nowrap;
        }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-danger  { background: #fee2e2; color: #991b1b; }
        .badge-gray    { background: #f1f5f9; color: #475569; }

        /* ====================================================================
           Shared slide-in keyframes
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
           Create / Edit modal — full-screen overlay (AdminModal shell)
           ==================================================================== */
        .sl-overlay {
          position: fixed;
          top: 0; right: 0; bottom: 0; left: 0;
          background: #f8fafc;
          overflow-y: auto; overflow-x: hidden;
          z-index: 9999;
        }
        @media (min-width: 768px) {
          .sl-overlay { left: 18rem; }
        }

        .sl-modal {
          background: #fff;
          border-radius: 32px;
          margin: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: amSlideIn 0.3s ease-out;
          max-width: auto;
        }

        .sl-header {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 24px 32px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .sl-header-icon {
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
        .sl-header-title { flex: 1; min-width: 0; padding-right: 48px; }
        .sl-header-title h2 {
          color: #fff;
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
        }
        .sl-header-title p {
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.875rem;
          margin: 4px 0 0;
        }
        .sl-header-close {
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
        .sl-header-close:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.05);
        }
        .sl-header-close:disabled { opacity: 0.5; cursor: not-allowed; }

        .sl-form { padding: 28px 32px; }

        .sl-body {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .sl-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }

        .sl-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .sl-required::after { content: " *"; color: #dc2626; }

        .sl-input {
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
        .sl-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .sl-textarea { resize: vertical; min-height: 90px; }

        .sl-footer {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .sl-btn-primary,
        .sl-btn-secondary {
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
        .sl-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          padding: 12px 28px;
          color: #fff;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        .sl-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        .sl-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .sl-btn-secondary {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          padding: 10px 24px;
          color: #475569;
        }
        .sl-btn-secondary:hover:not(:disabled) {
          border-color: #667eea;
          color: #667eea;
          background: #f8fafc;
        }
        .sl-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

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
        .sl-name-chip {
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

        /* ================= Empty state ================= */
        .no-data { text-align: center; padding: 4rem 2rem; color: #64748b; }
        .no-data svg { margin-bottom: 1.5rem; opacity: 0.3; color: #667eea; }
        .no-data p { font-size: 1.05rem; color: #495057; margin: 0 0 2rem 0; }

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
          .section-header { flex-direction: column; }
          .section-actions { width: 100%; justify-content: flex-start; }
        }
        @media (max-width: 768px) {
          .search-filter-section { flex-direction: column; align-items: stretch; }
          .search-box { min-width: auto; }
          .cards-grid-inner { grid-template-columns: 1fr; }
          .results-summary { flex-direction: column; gap: 0.5rem; align-items: flex-start; }
          .content-container { padding: 1rem; }

          /* Modals shrink on mobile */
          .sl-modal { margin: 1rem; border-radius: 24px; max-width: 100%; }
          .sl-header { padding: 16px 20px; gap: 14px; }
          .sl-header-title h2 { font-size: 1.25rem; }
          .sl-header-title { padding-right: 40px; }
          .sl-header-icon { width: 44px; height: 44px; border-radius: 22px; }
          .sl-header-close { top: 16px; right: 16px; width: 36px; height: 36px; }
          .sl-form { padding: 20px; }
        }
      `}</style>
    </div>
  );
}