import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  X, Search, Bell, AlertTriangle, Calendar, Car, CreditCard,
  RefreshCw, Filter, ChevronDown, FileText, FileSpreadsheet,
  Download, ChevronRight, ShieldCheck, Wrench, Clock, Banknote,
  CalendarClock, CircleAlert, Star,
} from 'lucide-react';
import { calculateAllNotifications } from '../Redux/notificationSlice';
import { toast } from 'sonner';

export default function SidebarNotificationsPanel({ isOpen, onClose, onItemNavigate }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const notifications = useSelector(s => s.notifications?.notifications);
  const loading = useSelector(s => s.notifications?.loading);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all'); // all | critical | warning
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority'); // priority | recent | amount

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Flatten all notifications with category info
  const allItems = useMemo(() => {
    if (!notifications) return [];
    const items = [];

    (notifications.matricules?.items || []).forEach(it => {
      items.push({
        ...it,
        _category: 'matricules',
        _menu: 'matricules',
        _title: it.title || 'Matricule',
      });
    });
    (notifications.reservations?.items || []).forEach(it => {
      items.push({
        ...it,
        _category: 'reservations',
        _menu: 'reservations',
        _title: it.title || 'Réservation',
      });
    });
    (notifications.accidents?.items || []).forEach(it => {
      items.push({
        ...it,
        _category: 'accidents',
        _menu: 'accidents',
        _title: it.title || 'Accident',
      });
    });
    (notifications.payments?.items || []).forEach(it => {
      items.push({
        ...it,
        _category: 'payments',
        _menu: 'payments',
        _title: it.title || 'Paiement',
      });
    });

    return items;
  }, [notifications]);

  // Determine critical/severity
  const isCritical = (item) =>
    item.isExpired ||
    item.isLate ||
    item.isOverdue ||
    (item.daysRemaining !== undefined && item.daysRemaining <= 3) ||
    (item.daysSince !== undefined && item.daysSince <= 3);

  // Filtered list
  const filtered = useMemo(() => {
    return allItems.filter(item => {
      // Category
      if (categoryFilter !== 'all' && item._category !== categoryFilter) return false;

      // Severity
      if (severityFilter === 'critical' && !isCritical(item)) return false;
      if (severityFilter === 'warning' && isCritical(item)) return false;

      // Type (specific)
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;

      // Search
      if (searchTerm.trim()) {
        const t = searchTerm.toLowerCase();
        const hay = [
          item._title,
          item.description,
          item.matriculeCode,
          item.dossierNumber,
          item.clientName,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(t)) return false;
      }

      return true;
    });
  }, [allItems, categoryFilter, severityFilter, typeFilter, searchTerm]);

  // Sorted
  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === 'priority') {
      arr.sort((a, b) => {
        const aC = isCritical(a) ? 1 : 0;
        const bC = isCritical(b) ? 1 : 0;
        if (aC !== bC) return bC - aC;
        const aD = a.daysRemaining ?? a.daysSince ?? 999;
        const bD = b.daysRemaining ?? b.daysSince ?? 999;
        return aD - bD;
      });
    } else if (sortBy === 'recent') {
      arr.sort((a, b) => {
        const aD = new Date(a.date || a.endDate || a.dueDate || 0).getTime();
        const bD = new Date(b.date || b.endDate || b.dueDate || 0).getTime();
        return bD - aD;
      });
    }
    return arr;
  }, [filtered, sortBy]);

  // Counts per category
  const counts = useMemo(() => ({
    all: allItems.length,
    matricules: allItems.filter(i => i._category === 'matricules').length,
    reservations: allItems.filter(i => i._category === 'reservations').length,
    accidents: allItems.filter(i => i._category === 'accidents').length,
    payments: allItems.filter(i => i._category === 'payments').length,
  }), [allItems]);

  // Type options (all unique types present)
  const typeOptions = useMemo(() => {
    const set = new Set(allItems.map(i => i.type).filter(Boolean));
    return Array.from(set);
  }, [allItems]);

  const typeLabels = {
    technical_visit: 'Visite technique',
    insurance: 'Assurance',
    reservation: 'Réservation',
    accident: 'Accident',
    payment_overdue: 'Paiement en retard',
    payment_upcoming: 'Paiement à venir',
  };

  const getIcon = (type) => {
    switch (type) {
      case 'technical_visit': return <Wrench size={16} />;
      case 'insurance': return <ShieldCheck size={16} />;
      case 'reservation': return <Calendar size={16} />;
      case 'accident': return <AlertTriangle size={16} />;
      case 'payment_overdue':
      case 'payment_upcoming': return <CreditCard size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const handleClickItem = (item) => {
    const menu = item._menu;
    if (!menu) return;
    // Navigate with notification filter
    if (onItemNavigate) onItemNavigate(menu);
    else navigate(`/admin/${menu}?filter=notifications`);
    onClose();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setSeverityFilter('all');
    setTypeFilter('all');
    setSortBy('priority');
  };

  const handleExportCSV = () => {
    if (!sorted.length) { toast.warning('Aucune notification à exporter'); return; }
    const headers = ['Catégorie', 'Type', 'Titre', 'Description', 'Sévérité', 'Date', 'Montant'];
    const rows = sorted.map(i => [
      i._category,
      i.type || '',
      `"${(i._title || '').replace(/"/g, '""')}"`,
      `"${(i.description || '').replace(/"/g, '""')}"`,
      isCritical(i) ? 'Critique' : 'Avertissement',
      i.date || i.endDate || i.dueDate || '',
      i.amount ?? '',
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Export CSV effectué');
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="sb-notif-overlay" onClick={onClose}>
      <div className="sb-notif-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="sb-notif-header">
          <div className="sb-notif-header-left">
            <div className="sb-notif-header-icon">
              <Bell size={24} />
            </div>
            <div>
              <h2>Notifications</h2>
              <p>
                {counts.all} au total
                {notifications?.totalCriticalCount > 0 && (
                  <span className="sb-notif-header-critical">
                    {' '}· {notifications.totalCriticalCount} critiques
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="sb-notif-header-actions">
            <button
              className="sb-notif-icon-btn"
              onClick={() => dispatch(calculateAllNotifications())}
              disabled={loading}
              title="Actualiser"
            >
              <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            </button>
            <button
              className="sb-notif-icon-btn"
              onClick={onClose}
              title="Fermer"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="sb-notif-tabs">
          {[
            { key: 'all', label: 'Toutes', icon: Bell },
            { key: 'matricules', label: 'Matricules', icon: Car },
            { key: 'reservations', label: 'Réservations', icon: Calendar },
            { key: 'accidents', label: 'Accidents', icon: AlertTriangle },
            { key: 'payments', label: 'Paiements', icon: CreditCard },
          ].map(tab => {
            const Icon = tab.icon;
            const count = counts[tab.key] || 0;
            return (
              <button
                key={tab.key}
                className={`sb-notif-tab ${categoryFilter === tab.key ? 'active' : ''}`}
                onClick={() => setCategoryFilter(tab.key)}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {count > 0 && <span className="sb-notif-tab-count">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Filters row */}
        <div className="sb-notif-filters">
          <div className="sb-notif-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Rechercher (plaque, dossier, description...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="sb-notif-clear">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="sb-notif-selects">
            <div className="sb-notif-select">
              <Filter size={14} />
              <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                <option value="all">Toutes sévérités</option>
                <option value="critical">Critiques uniquement</option>
                <option value="warning">Avertissements uniquement</option>
              </select>
            </div>

            <div className="sb-notif-select">
              <ChevronDown size={14} />
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">Tous les types</option>
                {typeOptions.map(t => (
                  <option key={t} value={t}>{typeLabels[t] || t}</option>
                ))}
              </select>
            </div>

            <div className="sb-notif-select">
              <Clock size={14} />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="priority">Priorité</option>
                <option value="recent">Plus récent</option>
              </select>
            </div>

            <button className="sb-notif-reset" onClick={handleResetFilters} title="Réinitialiser les filtres">
              Réinitialiser
            </button>
          </div>
        </div>

        {/* List */}
        <div className="sb-notif-list">
          {loading && allItems.length === 0 ? (
            <div className="sb-notif-empty">
              <div className="sb-notif-spinner" />
              <p>Chargement des notifications…</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className="sb-notif-empty">
              <Bell size={40} />
              <p>Aucune notification</p>
              <span>Essayez d'ajuster vos filtres</span>
            </div>
          ) : (
            sorted.map((item, idx) => {
              const critical = isCritical(item);
              return (
                <button
                  key={item.id || idx}
                  className={`sb-notif-item ${critical ? 'critical' : 'warning'}`}
                  onClick={() => handleClickItem(item)}
                >
                  <div className={`sb-notif-item-icon ${critical ? 'critical' : 'warning'}`}>
                    {getIcon(item.type)}
                  </div>
                  <div className="sb-notif-item-body">
                    <div className="sb-notif-item-title">
                      <span>{item._title}</span>
                      {item.matriculeCode && (
                        <span className="sb-notif-tag">{item.matriculeCode}</span>
                      )}
                      {item.dossierNumber && (
                        <span className="sb-notif-tag dossier">{item.dossierNumber}</span>
                      )}
                    </div>
                    <div className="sb-notif-item-desc">
                      {item.description}
                    </div>
                    <div className="sb-notif-item-meta">
                      <span className={`sb-notif-severity ${critical ? 'critical' : 'warning'}`}>
                        {critical ? (
                          <><CircleAlert size={11} /> Critique</>
                        ) : (
                          <><Clock size={11} /> Avertissement</>
                        )}
                      </span>
                      {item.daysRemaining !== undefined && item.daysRemaining >= 0 && (
                        <span className="sb-notif-badge">
                          dans {item.daysRemaining} j
                        </span>
                      )}
                      {item.daysSince !== undefined && (
                        <span className="sb-notif-badge">
                          il y a {item.daysSince} j
                        </span>
                      )}
                      {item.amount && (
                        <span className="sb-notif-badge amount">
                          {Number(item.amount).toFixed(2)} DH
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="sb-notif-item-arrow" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <footer className="sb-notif-footer">
          <span className="sb-notif-footer-count">
            {sorted.length} affichée{sorted.length > 1 ? 's' : ''} sur {counts.all}
          </span>
          <div className="sb-notif-footer-actions">
            <button className="sb-notif-btn-ghost" onClick={handleExportCSV}>
              <FileSpreadsheet size={14} /> Exporter CSV
            </button>
          </div>
        </footer>
      </div>

      <style>{`
        .sb-notif-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 10050;
          display: flex;
          justify-content: flex-start;
          animation: sbNotifFadeIn 0.2s ease;
        }
        @keyframes sbNotifFadeIn { from { opacity: 0; } to { opacity: 1; } }

        .sb-notif-panel {
          width: 640px;
          max-width: calc(100vw - 40px);
          background: #fff;
          margin: 1.5rem;
          border-radius: 20px;
          box-shadow: 0 25px 60px -20px rgba(0,0,0,0.45);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: sbNotifSlideIn 0.25s ease-out;
        }
        @media (min-width: 768px) {
          .sb-notif-panel { margin-left: 19rem; }
        }
        @keyframes sbNotifSlideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* ============ Header ============ */
        .sb-notif-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: #fff;
        }
        .sb-notif-header-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
        .sb-notif-header-icon {
          width: 44px; height: 44px; border-radius: 14px;
          background: linear-gradient(135deg, #eab308, #f59e0b);
          display: flex; align-items: center; justify-content: center;
          color: #0f172a; flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(234,179,8,0.35);
        }
        .sb-notif-header h2 {
          margin: 0; font-size: 1.15rem; font-weight: 700;
          color: #fff; letter-spacing: 0.2px;
        }
        .sb-notif-header p {
          margin: 2px 0 0; font-size: 0.78rem; color: #94a3b8;
        }
        .sb-notif-header-critical { color: #fca5a5; font-weight: 600; }
        .sb-notif-header-actions { display: flex; gap: 8px; }
        .sb-notif-icon-btn {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(255,255,255,0.08);
          border: none; color: #cbd5e1;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .sb-notif-icon-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.18);
          color: #fff; transform: translateY(-1px);
        }
        .sb-notif-icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .spinning { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ============ Tabs ============ */
        .sb-notif-tabs {
          display: flex; gap: 4px; padding: 12px 20px 0;
          background: #f8fafc; overflow-x: auto; border-bottom: 1px solid #e2e8f0;
        }
        .sb-notif-tabs::-webkit-scrollbar { height: 0; }
        .sb-notif-tab {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 14px; border: none; background: transparent;
          border-bottom: 2px solid transparent;
          cursor: pointer; font-size: 0.82rem; font-weight: 500;
          color: #64748b; white-space: nowrap; transition: all 0.2s;
          font-family: inherit;
        }
        .sb-notif-tab:hover { color: #1e293b; }
        .sb-notif-tab.active {
          color: #7c3aed; border-bottom-color: #7c3aed;
          font-weight: 700;
        }
        .sb-notif-tab-count {
          background: #e2e8f0; color: #475569;
          font-size: 0.65rem; font-weight: 700;
          padding: 2px 7px; border-radius: 9999px;
        }
        .sb-notif-tab.active .sb-notif-tab-count {
          background: #7c3aed; color: #fff;
        }

        /* ============ Filters ============ */
        .sb-notif-filters {
          padding: 12px 20px;
          background: #fff; border-bottom: 1px solid #e2e8f0;
          display: flex; flex-direction: column; gap: 10px;
        }
        .sb-notif-search {
          position: relative; display: flex; align-items: center;
          background: #f1f5f9; border-radius: 10px;
          padding: 8px 12px; gap: 8px;
        }
        .sb-notif-search svg { color: #64748b; flex-shrink: 0; }
        .sb-notif-search input {
          flex: 1; background: transparent; border: none; outline: none;
          font-size: 0.82rem; color: #1e293b;
          font-family: inherit;
        }
        .sb-notif-search input::placeholder { color: #94a3b8; }
        .sb-notif-clear {
          background: transparent; border: none; cursor: pointer;
          color: #94a3b8; display: flex; align-items: center;
        }
        .sb-notif-clear:hover { color: #ef4444; }

        .sb-notif-selects {
          display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
        }
        .sb-notif-select {
          display: flex; align-items: center; gap: 4px;
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 8px; padding: 6px 10px;
        }
        .sb-notif-select svg { color: #64748b; flex-shrink: 0; }
        .sb-notif-select select {
          border: none; background: transparent; outline: none;
          font-size: 0.78rem; color: #334155;
          font-family: inherit; cursor: pointer;
          padding-right: 4px;
        }
        .sb-notif-reset {
          margin-left: auto;
          background: transparent; border: none; cursor: pointer;
          color: #7c3aed; font-size: 0.75rem; font-weight: 600;
          padding: 6px 10px; border-radius: 8px;
          font-family: inherit;
        }
        .sb-notif-reset:hover { background: #f5f3ff; }

        /* ============ List ============ */
        .sb-notif-list {
          flex: 1; overflow-y: auto;
          padding: 8px 12px 12px;
          background: #f8fafc;
          min-height: 200px;
        }
        .sb-notif-list::-webkit-scrollbar { width: 6px; }
        .sb-notif-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .sb-notif-list::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .sb-notif-item {
          display: flex; align-items: flex-start; gap: 12px;
          width: 100%; text-align: left;
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 12px; padding: 12px 14px;
          margin-bottom: 8px; cursor: pointer;
          transition: all 0.2s ease; font-family: inherit;
          position: relative;
        }
        .sb-notif-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
          border-color: #c7d2fe;
        }
        .sb-notif-item.critical {
          border-left: 4px solid #ef4444;
          background: #fff5f5;
        }
        .sb-notif-item.warning {
          border-left: 4px solid #f59e0b;
          background: #fffbeb;
        }

        .sb-notif-item-icon {
          width: 38px; height: 38px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .sb-notif-item-icon.critical { background: #fee2e2; color: #dc2626; }
        .sb-notif-item-icon.warning { background: #fef3c7; color: #d97706; }

        .sb-notif-item-body { flex: 1; min-width: 0; }
        .sb-notif-item-title {
          display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
          font-size: 0.85rem; font-weight: 700; color: #0f172a;
          margin-bottom: 3px;
        }
        .sb-notif-tag {
          font-family: 'Courier New', monospace;
          font-size: 0.65rem; font-weight: 700;
          background: #e0e7ff; color: #4338ca;
          padding: 2px 6px; border-radius: 6px;
          letter-spacing: 0.3px;
        }
        .sb-notif-tag.dossier {
          font-family: inherit;
          background: #f1f5f9; color: #475569;
        }
        .sb-notif-item-desc {
          font-size: 0.78rem; color: #64748b;
          margin-bottom: 6px; line-height: 1.4;
        }
        .sb-notif-item-meta {
          display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
        }
        .sb-notif-severity {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 0.65rem; font-weight: 700;
          padding: 2px 8px; border-radius: 9999px;
          text-transform: uppercase; letter-spacing: 0.4px;
        }
        .sb-notif-severity.critical { background: #fee2e2; color: #b91c1c; }
        .sb-notif-severity.warning  { background: #fef3c7; color: #92400e; }
        .sb-notif-badge {
          font-size: 0.65rem; font-weight: 600;
          background: #f1f5f9; color: #475569;
          padding: 2px 8px; border-radius: 9999px;
        }
        .sb-notif-badge.amount {
          background: #dcfce7; color: #166534;
          font-variant-numeric: tabular-nums;
        }
        .sb-notif-item-arrow {
          color: #cbd5e1; flex-shrink: 0;
          align-self: center;
          transition: transform 0.2s;
        }
        .sb-notif-item:hover .sb-notif-item-arrow {
          color: #7c3aed; transform: translateX(3px);
        }

        /* ============ Empty ============ */
        .sb-notif-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 3rem 2rem; color: #94a3b8;
          text-align: center; min-height: 240px;
        }
        .sb-notif-empty svg { opacity: 0.35; margin-bottom: 12px; }
        .sb-notif-empty p {
          margin: 0 0 4px; font-size: 0.95rem;
          font-weight: 600; color: #64748b;
        }
        .sb-notif-empty span {
          font-size: 0.78rem; color: #94a3b8;
        }
        .sb-notif-spinner {
          width: 32px; height: 32px;
          border: 3px solid #e2e8f0;
          border-top-color: #7c3aed;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
          margin-bottom: 12px;
        }

        /* ============ Footer ============ */
        .sb-notif-footer {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 20px; background: #fff;
          border-top: 1px solid #e2e8f0;
          flex-wrap: wrap; gap: 8px;
        }
        .sb-notif-footer-count {
          font-size: 0.78rem; color: #64748b;
          font-weight: 500;
        }
        .sb-notif-footer-actions { display: flex; gap: 8px; }
        .sb-notif-btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 9999px;
          background: #f1f5f9; border: none; cursor: pointer;
          color: #475569; font-size: 0.78rem; font-weight: 600;
          font-family: inherit; transition: all 0.2s;
        }
        .sb-notif-btn-ghost:hover {
          background: #e2e8f0; color: #1e293b;
        }

        @media (max-width: 767px) {
          .sb-notif-panel {
            margin: 0; border-radius: 0;
            width: 100vw; max-width: 100vw;
            height: 100vh; max-height: 100vh;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}