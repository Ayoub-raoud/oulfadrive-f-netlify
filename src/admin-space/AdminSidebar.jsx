import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, Car, User, CalendarCheck, Mail,
  AlertTriangle, IdCard, CreditCard, Lock, LogOut, Bell, Tag,
  Building2, Wallet, ClipboardList,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUtilisateur, selectReservations } from '../Redux/store';
import { calculateAllNotifications } from '../Redux/notificationSlice';
import { MENU_ITEMS, hasAccess } from '../config/permissions';
import SidebarNotificationsPanel from './SidebarNotificationsPanel';
import '../Css/AdminSidebar.css';

const ICONS = {
  dashboard: LayoutDashboard,
  users: Users,
  cars: Car,
  clients: User,
  reservations: CalendarCheck,
  'reservation-status': ClipboardList,
  contacts: Mail,
  accidents: AlertTriangle,
  matricules: IdCard,
  credit: CreditCard,
  'sous-locations': Tag,
  garages: Building2,
  payments: Wallet,
};

const NOTIFICATION_MENU_MAP = {
  matricules: 'matricules',
  reservations: 'reservations',
  accidents: 'accidents',
  payments: 'payments',
};

// ============================================================
// Badge color priority: critical > warning > info > success
// ============================================================
const VARIANT_PRIORITY = { critical: 4, warning: 3, info: 2, success: 1 };

const pickWorstVariant = (variants) => {
  let worst = null;
  let worstP = 0;
  variants.forEach((v) => {
    const p = VARIANT_PRIORITY[v] || 0;
    if (p > worstP) { worst = v; worstP = p; }
  });
  return worst;
};

// Given a list of notification items, return the color variant
// Rules:  expired OR <= 3 days  → critical (red)
//         <= 7 days              → warning  (yellow)
const variantFromItems = (items) => {
  if (!items || items.length === 0) return null;
  const variants = items.map((it) => {
    if (it.isExpired || it.isLate || it.isOverdue) return 'critical';
    const days =
      it.daysRemaining !== undefined ? it.daysRemaining :
      it.daysSince !== undefined ? -it.daysSince :
      null;
    if (days !== null) {
      if (days <= 3) return 'critical';
      if (days <= 7) return 'warning';
    }
    return null;
  });
  return pickWorstVariant(variants);
};

const AdminSidebar = ({
  activeTab, setActiveTab, sidebarOpen, setSidebarOpen, user,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const reservations = useSelector(selectReservations);
  const myPermissions = useSelector((s) => s.permissions?.myPermissions || []);
  const notificationsState = useSelector((s) => s.notifications?.notifications);

  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // ============ Fetch notifications on mount + auto-refresh ============
  useEffect(() => {
    dispatch(calculateAllNotifications());
    const interval = setInterval(
      () => dispatch(calculateAllNotifications()),
      2 * 60 * 1000
    );
    return () => clearInterval(interval);
  }, [dispatch]);

  // ============ Date helpers ============
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  };

  // ============ Reservation-status (pending / contacted) ============
  const reservationStatusItems = reservations.filter(
    (r) => r.status === 'pending' || r.status === 'contacted'
  );
  const reservationStatusCount = reservationStatusItems.length;

  // ============ Reservations (confirmed + retard only) ============
  const reservationItems = reservations.filter(
    (r) => r.status === 'confirmed' || r.status === 'retard'
  );

  // ============ Per-menu badge (with variant) ============
  const getBadge = (pageSlug) => {
    // ---------- reservation-status (pending + contacted) ----------
    // pending/contacted → yellow
    // starting within ≤ 3 days → red
    if (pageSlug === 'reservation-status') {
      if (reservationStatusCount === 0) return null;
      const variants = reservationStatusItems.map((r) => {
        const d = daysUntil(r.start_date);
        if (d !== null && d >= 0 && d <= 3) return 'critical';
        return 'warning';
      });
      return {
        count: reservationStatusCount,
        variant: pickWorstVariant(variants) || 'warning',
      };
    }

    // ---------- matricules ----------
    // expired or ≤ 3 days → red ; ≤ 7 days → yellow
    if (pageSlug === 'matricules') {
      const items = notificationsState?.matricules?.items || [];
      if (items.length === 0) return null;
      return {
        count: items.length,
        variant: variantFromItems(items) || 'warning',
      };
    }

    // ---------- reservations ----------
    // retard → red
    // confirmed ending within ≤ 3 days → blue (NO 7-day window)
    // otherwise → no badge
    if (pageSlug === 'reservations') {
      const retardItems = reservationItems.filter((r) => r.status === 'retard');
      const confirmedEndingSoon = reservationItems.filter((r) => {
        if (r.status !== 'confirmed') return false;
        const d = daysUntil(r.end_date);
        return d !== null && d >= 0 && d <= 3;
      });
      const relevant = [...retardItems, ...confirmedEndingSoon];
      if (relevant.length === 0) return null;
      return {
        count: relevant.length,
        variant: retardItems.length > 0 ? 'critical' : 'info',
      };
    }

    // ---------- accidents ----------
    // ≤ 3 days → red ; ≤ 7 days → yellow
    if (pageSlug === 'accidents') {
      const items = notificationsState?.accidents?.items || [];
      if (items.length === 0) return null;
      return {
        count: items.length,
        variant: variantFromItems(items) || 'warning',
      };
    }

    // ---------- payments ----------
    // overdue or ≤ 3 days → red ; ≤ 7 days → yellow
    if (pageSlug === 'payments') {
      const items = notificationsState?.payments?.items || [];
      if (items.length === 0) return null;
      return {
        count: items.length,
        variant: variantFromItems(items) || 'warning',
      };
    }

    return null;
  };

  const allMenuItems = MENU_ITEMS.map((item) => ({ ...item, icon: ICONS[item.id] }));
  const userRole = user?.role?.toLowerCase() || 'employee';
  const isItemAccessible = (item) =>
    hasAccess(userRole, item.roles, myPermissions, item.id);

  const handleItemClick = (itemId) => {
    const item = allMenuItems.find((i) => i.id === itemId);
    if (item && isItemAccessible(item)) {
      setActiveTab(itemId);
      setSidebarOpen(false);
      navigate(`/admin/${itemId}`);
    }
  };

  // Badge click → navigate WITH notification filter
  const handleBadgeClick = (e, item) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isItemAccessible(item)) return;
    setActiveTab(item.id);
    setSidebarOpen(false);
    navigate(`/admin/${item.id}?filter=notifications`);
  };

  const handleLogout = async () => {
    await dispatch(logoutUtilisateur());
    setSidebarOpen(false);
    navigate('/admin');
  };

  const getUserName = () =>
    user?.Fullname || user?.full_name || user?.name || 'Administrateur';

  const totalNotifications = notificationsState?.totalCount || 0;
  const totalCritical = notificationsState?.totalCriticalCount || 0;

  const renderNavItem = (item) => {
    const accessible = isItemAccessible(item);
    const isActive = activeTab === item.id;
    const badge = getBadge(item.id);
    const Icon = item.icon;

    return (
      <div
        key={item.id}
        onClick={() => accessible && handleItemClick(item.id)}
        className={`
          nav-item
          ${isActive && accessible ? 'active' : ''}
          ${!accessible ? 'disabled' : ''}
        `}
        style={!accessible ? { cursor: 'not-allowed' } : undefined}
      >
        <Icon size={18} />
        <span className="nav-label">{item.label}</span>

        {badge && (
          <span
            className={`badge ${badge.variant || 'warning'} clickable`}
            title={`Filtrer la page par notifications (${badge.count})`}
            onClick={(e) => accessible && handleBadgeClick(e, item)}
            role="button"
            tabIndex={0}
          >
            {badge.count > 99 ? '99+' : badge.count}
          </span>
        )}

        {!accessible && <Lock size={14} className="lock-icon" />}
      </div>
    );
  };

  return (
    <>
      <aside className={`sidebar-desktop ${sidebarOpen ? 'translate-x-0' : ''}`}>
        <div className="sidebar-header">
          <div>
            <h2 className="sidebar-title">
              OulfaDrive<span>Panel</span>
            </h2>
            <p className="sidebar-user-name">{getUserName()}</p>
          </div>

          <button
            type="button"
            className="sidebar-bell-btn"
            onClick={() => setShowNotifPanel(true)}
            title="Voir toutes les notifications"
          >
            <Bell className="sidebar-bell" size={20} />
            {totalNotifications > 0 && (
              <span
                className={`sidebar-bell-badge ${
                  totalCritical > 0 ? 'critical' : 'warning'
                }`}
              >
                {totalNotifications > 99 ? '99+' : totalNotifications}
              </span>
            )}
          </button>
        </div>

        <nav className="sidebar-nav">{allMenuItems.map(renderNavItem)}</nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="sidebar-overlay visible"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`sidebar-mobile ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-mobile-header">
          <div className="logo">
            <div className="icon">A</div>
            <div>
              <p className="text">AdminPanel</p>
              <p className="sub">Console</p>
            </div>
          </div>
          <button className="close-btn" onClick={() => setSidebarOpen(false)}>
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">{allMenuItems.map(renderNavItem)}</nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </div>

      <SidebarNotificationsPanel
        isOpen={showNotifPanel}
        onClose={() => setShowNotifPanel(false)}
        onItemNavigate={(menu) => {
          setActiveTab(menu);
          setSidebarOpen(false);
          navigate(`/admin/${menu}?filter=notifications`);
        }}
      />
    </>
  );
};

export default AdminSidebar;