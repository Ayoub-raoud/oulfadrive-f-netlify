// src/config/permissions.js

export const MENU_ITEMS = [
  { id: 'dashboard',          label: 'Dashboard',           roles: ['superadmin', 'admin', 'employee'] },
  { id: 'users',              label: 'Utilisateurs',        roles: ['superadmin', 'admin'] },
  { id: 'cars',               label: 'Véhicules',           roles: ['superadmin', 'admin', 'employee'] },
  { id: 'clients',            label: 'Clients',             roles: ['superadmin', 'admin'] },              // 🔒 locked
  { id: 'reservations',       label: 'Réservations',        roles: ['superadmin', 'admin', 'employee'] },
  { id: 'reservation-status', label: 'Statut Réservations', roles: ['superadmin', 'admin', 'employee'] },
  { id: 'contacts',           label: 'Contacts',            roles: ['superadmin', 'admin', 'employee'] },
  { id: 'accidents',          label: 'Accidents',           roles: ['superadmin', 'admin'] },              // 🔒 locked
  { id: 'matricules',         label: 'Immatriculations',    roles: ['superadmin', 'admin', 'employee'] },
  { id: 'credit',             label: 'Crédit',              roles: ['superadmin'] },
  { id: 'sous-locations',     label: 'Sous-locations',      roles: ['superadmin', 'admin'] },              // 🔒 locked
  { id: 'garages',            label: 'Garages',             roles: ['superadmin', 'admin'] },              // 🔒 locked
  { id: 'payments',           label: 'Financements',        roles: ['superadmin'] },
];

export const NON_MENU_PAGES = {
  reports: { label: 'Rapports', roles: ['superadmin', 'admin'] },
};

export const getRolesForPage = (pageId) => {
  if (!pageId) return [];
  const menuItem = MENU_ITEMS.find((i) => i.id === pageId);
  if (menuItem) return menuItem.roles;
  const extra = NON_MENU_PAGES[pageId];
  return extra ? extra.roles : [];
};

export const getLabelForPage = (pageId) => {
  if (!pageId) return '';
  const menuItem = MENU_ITEMS.find((i) => i.id === pageId);
  if (menuItem) return menuItem.label;
  const extra = NON_MENU_PAGES[pageId];
  return extra ? extra.label : pageId;
};

export const ALL_GRANTABLE_PAGES = {
  ...Object.fromEntries(MENU_ITEMS.map((i) => [i.id, i.label])),
  ...Object.fromEntries(Object.entries(NON_MENU_PAGES).map(([k, v]) => [k, v.label])),
};

export const hasAccess = (userRole, allowedRoles = [], myPermissions = [], pageSlug = null) => {
  const role = (userRole || '').toLowerCase();

  const now = Date.now();
  const hasPermission = !!pageSlug && (myPermissions || []).some((p) => {
    const slug = typeof p === 'string' ? p : (p?.page_slug || '');
    if (slug.toLowerCase() !== String(pageSlug).toLowerCase()) return false;
    if (typeof p === 'string' || !p?.expires_at) return true;
    return new Date(p.expires_at).getTime() > now;
  });
  if (hasPermission) return true;

  if (!allowedRoles || allowedRoles.length === 0) return true;

  return allowedRoles.map((r) => r.toLowerCase()).includes(role);
};