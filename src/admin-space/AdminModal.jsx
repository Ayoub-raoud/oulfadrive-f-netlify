// src/components/admin/AdminModal.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X, Search, Plus, Trash2, UserPlus, CheckCircle, Car, User, Users,
  Calendar, DollarSign, Tag, Info, RefreshCw, Check, AlertTriangle,
  Wrench, Gauge, History, ChevronDown, ChevronUp, ShieldCheck, IdCard,
  Phone, Mail, MapPin, Key, Fuel, Settings2, MessageSquare, Lock,
  Save, Sparkles,
} from "lucide-react";

// ============================================================
// Shared building blocks
// ============================================================
const Field = ({ label, required, hint, children }) => (
  <div className="am-field">
    <label className={`am-label ${required ? "am-required" : ""}`}>{label}</label>
    {children}
    {hint && <span className="am-hint">{hint}</span>}
  </div>
);

const Section = ({ icon: Icon, title, action, children }) => (
  <section className="am-section">
    <div className="am-section-head">
      <span className="am-section-title">
        {Icon && <Icon size={16} />} {title}
      </span>
      {action}
    </div>
    <div className="am-section-body">{children}</div>
  </section>
);

const SearchPicker = ({
  placeholder, items, filterFn, renderResult, onSelect,
  selectedText, onCreateNew, createLabel,
}) => {
  const [term, setTerm] = useState("");
  const results = useMemo(() => {
    if (!term.trim() || !Array.isArray(items)) return [];
    const t = term.toLowerCase().trim();
    return items.filter((i) => i && filterFn(i, t)).slice(0, 8);
  }, [term, items, filterFn]);

  return (
    <div className="am-picker">
      <div className="am-search">
        <Search size={16} />
        <input
          className="am-input am-input-search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={placeholder}
        />
      </div>
      {results.length > 0 && (
        <div className="am-results">
          {results.map((r) => (
            <div
              key={r.id}
              className="am-result"
              onClick={() => { onSelect(r); setTerm(""); }}
            >
              {renderResult(r)}
            </div>
          ))}
        </div>
      )}
      {onCreateNew && (
        <button type="button" className="am-btn-ghost am-btn-block" onClick={onCreateNew}>
          <UserPlus size={14} /> {createLabel}
        </button>
      )}
      {selectedText && (
        <div className="am-selected">
          <CheckCircle size={16} />
          <span>{selectedText}</span>
        </div>
      )}
    </div>
  );
};

const InlineClientForm = ({ data, setData, onSave, onCancel, saving }) => (
  <div className="am-inline-create">
    <div className="am-grid-2">
      <Field label="Prénom" required>
        <input className="am-input" value={data.prenom}
          onChange={(e) => setData((p) => ({ ...p, prenom: e.target.value }))} />
      </Field>
      <Field label="Nom" required>
        <input className="am-input" value={data.nom}
          onChange={(e) => setData((p) => ({ ...p, nom: e.target.value }))} />
      </Field>
      <Field label="Téléphone" required>
        <input className="am-input" value={data.telephone}
          onChange={(e) => setData((p) => ({ ...p, telephone: e.target.value }))} />
      </Field>
      <Field label="Email">
        <input className="am-input" value={data.email}
          onChange={(e) => setData((p) => ({ ...p, email: e.target.value }))} />
      </Field>
      <Field label="Ville">
        <input className="am-input" value={data.city}
          onChange={(e) => setData((p) => ({ ...p, city: e.target.value }))} />
      </Field>
      <Field label="CIN">
        <input className="am-input" value={data.cin_number}
          onChange={(e) => setData((p) => ({ ...p, cin_number: e.target.value }))} />
      </Field>
      <Field label="CIN délivré le">
        <input type="date" className="am-input" value={data.cin_delivre_le}
          onChange={(e) => setData((p) => ({ ...p, cin_delivre_le: e.target.value }))} />
      </Field>
      <Field label="Permis N°">
        <input className="am-input" value={data.driver_license_number}
          onChange={(e) => setData((p) => ({ ...p, driver_license_number: e.target.value }))} />
      </Field>
      <Field label="Permis délivré le">
        <input type="date" className="am-input" value={data.permis_delivre_le}
          onChange={(e) => setData((p) => ({ ...p, permis_delivre_le: e.target.value }))} />
      </Field>
      <Field label="Date de naissance">
        <input type="date" className="am-input" value={data.date_naissance}
          onChange={(e) => setData((p) => ({ ...p, date_naissance: e.target.value }))} />
      </Field>
      <Field label="Lieu de naissance">
        <input className="am-input" value={data.lieu_naissance}
          onChange={(e) => setData((p) => ({ ...p, lieu_naissance: e.target.value }))} />
      </Field>
    </div>
    <div className="am-inline-actions">
      <button type="button" className="am-btn-secondary" onClick={onCancel}>Annuler</button>
      <button type="button" className="am-btn-primary" onClick={onSave} disabled={saving}>
        {saving ? "Création…" : "Créer"}
      </button>
    </div>
  </div>
);

const InlineSousLocationForm = ({ data, setData, onSave, onCancel, saving }) => (
  <div className="am-inline-create">
    <Field label="Nom" required>
      <input className="am-input" value={data.name}
        onChange={(e) => setData((p) => ({ ...p, name: e.target.value }))}
        placeholder="Ex: Location groupe" />
    </Field>
    <Field label="Description">
      <textarea className="am-input am-textarea" rows={2} value={data.description}
        onChange={(e) => setData((p) => ({ ...p, description: e.target.value }))}
        placeholder="Description facultative" />
    </Field>
    <div className="am-inline-actions">
      <button type="button" className="am-btn-secondary" onClick={onCancel}>Annuler</button>
      <button type="button" className="am-btn-primary" onClick={onSave}
        disabled={saving || !data.name.trim()}>
        {saving ? "Création…" : "Créer"}
      </button>
    </div>
  </div>
);

const emptyClient = {
  prenom: "", nom: "", telephone: "", email: "", city: "",
  cin_number: "", cin_delivre_le: "", driver_license_number: "",
  permis_delivre_le: "", date_naissance: "", lieu_naissance: "",
};

const emptySousLocation = { name: "", description: "" };

// Safe id comparison (handles string/number mismatch)
const sameId = (a, b) => a != null && b != null && String(a) === String(b);

// ============================================================
// RESERVATIONS
// ============================================================
const ReservationFields = ({
  formData, handleChange, clients, cars, matricules, createClient, submitting,
  sousLocations = [], createSousLocation, canCreateSousLocation = true,
}) => {
  const [selectedClient, setSelectedClient] = useState(
    () => clients.find((c) => sameId(c.id, formData.client_id)) || null
  );
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientData, setNewClientData] = useState(emptyClient);
  const [creatingClient, setCreatingClient] = useState(false);

  const [selectedMatricule, setSelectedMatricule] = useState(
    () => matricules.find((m) => sameId(m.id, formData.matricule_id)) || null
  );
  const [carMatricules, setCarMatricules] = useState(
    () => matricules.filter((m) => sameId(m.car_id, formData.car_id))
  );

  const [showSecondDriver, setShowSecondDriver] = useState(!!formData.has_second_driver);
  const [isNewSecondDriver, setIsNewSecondDriver] = useState(false);
  const [newSecondDriverData, setNewSecondDriverData] = useState(emptyClient);
  const [creatingSecondDriver, setCreatingSecondDriver] = useState(false);

  const [isNewSousLocation, setIsNewSousLocation] = useState(false);
  const [newSousLocationData, setNewSousLocationData] = useState(emptySousLocation);
  const [creatingSousLocation, setCreatingSousLocation] = useState(false);

  const [newPayment, setNewPayment] = useState({
    amount: "", date: new Date().toISOString().split("T")[0], method: "cash", notes: "",
  });
  const [showAddPayment, setShowAddPayment] = useState(false);
  const paymentHistory = Array.isArray(formData.payment_history) ? formData.payment_history : [];

  const [manualDailyPrice, setManualDailyPrice] = useState("");

  // 💰 Remember the current daily rate
  const [dailyRate, setDailyRate] = useState(() => {
    const base = parseInt(formData.rental_days, 10) || 0;
    const prolong = formData.can_extend_days
      ? parseInt(formData.prolongation_days, 10) || 0
      : 0;
    const days = base + prolong;
    if (formData.total_price && days > 0) return Number(formData.total_price) / days;
    const car = cars.find((c) => sameId(c.id, formData.car_id));
    if (car?.price_per_day) return parseFloat(car.price_per_day);
    return null;
  });

  useEffect(() => {
    setCarMatricules(
      formData.car_id ? matricules.filter((m) => sameId(m.car_id, formData.car_id)) : []
    );
  }, [formData.car_id, matricules]);

  // ===== Auto-fill Heure début / fin on status change =====
  const prevStatusRef = useRef(formData.status);
  useEffect(() => {
    if (prevStatusRef.current === formData.status) return;
    prevStatusRef.current = formData.status;

    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 5);

    if (formData.status === "confirmed") {
      handleChange("start_time", currentTime);
    }
    if (formData.status === "completed") {
      handleChange("end_date", currentDate);
      handleChange("end_time", currentTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.status]);

  const totalDays = useMemo(() => {
    const base = parseInt(formData.rental_days, 10) || 0;
    const prolongation = formData.can_extend_days
      ? parseInt(formData.prolongation_days, 10) || 0
      : 0;
    return base + prolongation;
  }, [formData.rental_days, formData.prolongation_days, formData.can_extend_days]);

  // 🔄 Auto-update total_price whenever the number of days changes
  const prevTotalDaysRef = useRef(totalDays);
  useEffect(() => {
    if (prevTotalDaysRef.current === totalDays) return;
    prevTotalDaysRef.current = totalDays;
    if (totalDays <= 0) return;

    let rate = dailyRate;
    if (rate == null) {
      const car = cars.find((c) => sameId(c.id, formData.car_id));
      if (car?.price_per_day) {
        rate = parseFloat(car.price_per_day);
        setDailyRate(rate);
      }
    }
    if (rate == null) return;

    const newTotal = Math.round(rate * totalDays * 100) / 100;
    handleChange("total_price", newTotal);
    handleChange("remaining_amount", newTotal - (Number(formData.amount_paid) || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalDays, dailyRate, formData.car_id]);

  const recalcEndDate = (startDate, days) => {
    if (!startDate || days <= 0) return null;
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + days);
    return end.toISOString().split("T")[0];
  };

  // ✅ Compute number of days between two dates (difference-based, min 1)
  const daysBetween = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    const diff = Math.abs(e - s);
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days === 0 ? 1 : days;
  };

  const applyManualDailyPrice = () => {
    const price = parseFloat(manualDailyPrice);
    if (isNaN(price) || price <= 0 || totalDays <= 0) return;
    setDailyRate(price);
    const newTotal = Math.round(price * totalDays * 100) / 100;
    handleChange("total_price", newTotal);
    handleChange("remaining_amount", newTotal - (Number(formData.amount_paid) || 0));
  };

  const recalcFromCar = () => {
    const car = cars.find((c) => sameId(c.id, formData.car_id));
    if (!car || totalDays <= 0) return;
    const rate = parseFloat(car.price_per_day);
    setDailyRate(rate);
    const newTotal = Math.round(rate * totalDays * 100) / 100;
    handleChange("total_price", newTotal);
    handleChange("remaining_amount", newTotal - (Number(formData.amount_paid) || 0));
  };

  const applyMatriculePricing = (matricule, days) => {
    if (!matricule || days <= 0) return;
    const car = cars.find((c) => sameId(c.id, matricule.car_id));
    if (!car) return;
    const rate = parseFloat(car.price_per_day);
    setDailyRate(rate);
    const newTotal = Math.round(rate * days * 100) / 100;
    handleChange("total_price", newTotal);
    handleChange("remaining_amount", newTotal - (Number(formData.amount_paid) || 0));
  };

  // ✅ Payment shape matches AdminReservations (id prefix `payment_`, created_at, notes)
  const addPayment = () => {
    const amount = parseFloat(newPayment.amount);
    if (!amount || amount <= 0) return;

    const paid = paymentHistory.reduce((s, p) => s + (p.amount || 0), 0);
    const remaining = (formData.total_price || 0) - paid;
    const actual = Math.min(amount, Math.max(remaining, 0));

    const entry = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: actual,
      date: newPayment.date,
      method: newPayment.method,
      notes: newPayment.notes || "",
      created_at: new Date().toISOString(),
    };

    const updated = [...paymentHistory, entry];
    const newPaid = updated.reduce((s, p) => s + (p.amount || 0), 0);

    handleChange("payment_history", updated);
    handleChange("amount_paid", newPaid);
    handleChange("remaining_amount", (formData.total_price || 0) - newPaid);

    setNewPayment({
      amount: "",
      date: new Date().toISOString().split("T")[0],
      method: "cash",
      notes: "",
    });
    setShowAddPayment(false);
  };

  const removePayment = (id) => {
    const updated = paymentHistory.filter((p) => p.id !== id);
    const newPaid = updated.reduce((s, p) => s + (p.amount || 0), 0);
    handleChange("payment_history", updated);
    handleChange("amount_paid", newPaid);
    handleChange("remaining_amount", (formData.total_price || 0) - newPaid);
  };

  const secondDriver = clients.find((c) => sameId(c.id, formData.second_driver_client_id));
  const selectedSousLocation = sousLocations.find((sl) => sameId(sl.id, formData.sous_location_id));

  const saveNewSousLocation = async () => {
    if (!newSousLocationData.name.trim() || !createSousLocation) return;
    setCreatingSousLocation(true);
    try {
      const result = await createSousLocation(newSousLocationData);
      const created = result?.sousLocation || result;
      handleChange("sous_location_id", created.id);
      setIsNewSousLocation(false);
      setNewSousLocationData(emptySousLocation);
    } finally {
      setCreatingSousLocation(false);
    }
  };

  const handleProlongationToggle = (checked) => {
    handleChange("can_extend_days", checked);
    const nextProlong = checked ? (parseInt(formData.prolongation_days, 10) || 1) : 0;
    if (checked && !formData.prolongation_days) {
      handleChange("prolongation_days", 1);
    } else if (!checked) {
      handleChange("prolongation_days", 0);
    }
    const base = parseInt(formData.rental_days, 10) || 0;
    const end = recalcEndDate(formData.start_date, base + nextProlong);
    if (end) handleChange("end_date", end);
  };

  const handleProlongationDaysChange = (value) => {
    const val = parseInt(value, 10) || 1;
    handleChange("prolongation_days", val);
    const base = parseInt(formData.rental_days, 10) || 0;
    const end = recalcEndDate(formData.start_date, base + val);
    if (end) handleChange("end_date", end);
  };

  return (
    <div className="am-columns">
      <div className="am-col">
        <Section icon={User} title="Client">
          {!isNewClient ? (
            <SearchPicker
              placeholder="Rechercher un client…"
              items={clients}
              filterFn={(c, t) =>
                `${c.prenom} ${c.nom}`.toLowerCase().includes(t) ||
                (c.email || "").toLowerCase().includes(t) ||
                (c.telephone || "").includes(t)
              }
              renderResult={(c) => (
                <>
                  <strong>{c.prenom} {c.nom}</strong>
                  <span className="am-result-meta">{c.telephone}</span>
                </>
              )}
              onSelect={(c) => { setSelectedClient(c); handleChange("client_id", c.id); }}
              onCreateNew={() => setIsNewClient(true)}
              createLabel="Nouveau client"
              selectedText={selectedClient ? `${selectedClient.prenom} ${selectedClient.nom} — ${selectedClient.telephone}` : null}
            />
          ) : (
            <InlineClientForm
              data={newClientData}
              setData={setNewClientData}
              saving={creatingClient}
              onCancel={() => setIsNewClient(false)}
              onSave={async () => {
                if (!newClientData.prenom || !newClientData.nom || !newClientData.telephone) return;
                setCreatingClient(true);
                try {
                  const result = await createClient(newClientData);
                  setSelectedClient(result);
                  handleChange("client_id", result.id);
                  setIsNewClient(false);
                } finally { setCreatingClient(false); }
              }}
            />
          )}
        </Section>

        <Section
          icon={Users}
          title="Deuxième conducteur"
          action={
            <label className="am-toggle">
              <input
                type="checkbox"
                checked={showSecondDriver}
                onChange={(e) => {
                  setShowSecondDriver(e.target.checked);
                  handleChange("has_second_driver", e.target.checked);
                  if (!e.target.checked) handleChange("second_driver_client_id", "");
                }}
              />
              <span>Activer</span>
            </label>
          }
        >
          {showSecondDriver && (!isNewSecondDriver ? (
            <SearchPicker
              placeholder="Rechercher un conducteur…"
              items={clients.filter((c) => !sameId(c.id, formData.client_id))}
              filterFn={(c, t) =>
                `${c.prenom} ${c.nom}`.toLowerCase().includes(t) ||
                (c.telephone || "").includes(t)
              }
              renderResult={(c) => (
                <>
                  <strong>{c.prenom} {c.nom}</strong>
                  <span className="am-result-meta">{c.telephone}</span>
                </>
              )}
              onSelect={(c) => handleChange("second_driver_client_id", c.id)}
              onCreateNew={() => setIsNewSecondDriver(true)}
              createLabel="Nouveau conducteur"
              selectedText={secondDriver ? `${secondDriver.prenom} ${secondDriver.nom} — ${secondDriver.telephone}` : null}
            />
          ) : (
            <InlineClientForm
              data={newSecondDriverData}
              setData={setNewSecondDriverData}
              saving={creatingSecondDriver}
              onCancel={() => setIsNewSecondDriver(false)}
              onSave={async () => {
                if (!newSecondDriverData.prenom || !newSecondDriverData.nom || !newSecondDriverData.telephone) return;
                setCreatingSecondDriver(true);
                try {
                  const result = await createClient(newSecondDriverData);
                  handleChange("second_driver_client_id", result.id);
                  setIsNewSecondDriver(false);
                } finally { setCreatingSecondDriver(false); }
              }}
            />
          ))}
        </Section>

        <Section icon={Calendar} title="Dates et durée">
          <div className="am-grid-2">
            <Field label="Date de début" required>
              <input type="date" className="am-input" value={formData.start_date || ""}
                onChange={(e) => {
                  handleChange("start_date", e.target.value);
                  const end = recalcEndDate(e.target.value, totalDays);
                  if (end) handleChange("end_date", end);
                }} required />
            </Field>
            <Field label="Heure de début">
              <input type="time" className="am-input" value={formData.start_time || "08:00"}
                onChange={(e) => handleChange("start_time", e.target.value)} />
            </Field>
            <Field label="Date de fin" required>
              <input type="date" className="am-input" value={formData.end_date || ""}
                onChange={(e) => {
                  const newEnd = e.target.value;
                  handleChange("end_date", newEnd);
                  if (formData.start_date && newEnd) {
                    const computed = daysBetween(formData.start_date, newEnd);
                    const prolongation = formData.can_extend_days
                      ? (parseInt(formData.prolongation_days, 10) || 0)
                      : 0;
                    handleChange("rental_days", Math.max(computed - prolongation, 1));
                  }
                }} required />
            </Field>
            <Field label="Heure de fin">
              <input type="time" className="am-input" value={formData.end_time || "18:00"}
                onChange={(e) => handleChange("end_time", e.target.value)} />
            </Field>
            <Field label="Nombre de jours (base)">
              <input type="number" min="1" className="am-input"
                value={formData.rental_days ?? ""}
                onChange={(e) => {
                  const d = parseInt(e.target.value, 10) || "";
                  handleChange("rental_days", d);
                  const end = recalcEndDate(
                    formData.start_date,
                    (d || 0) + (formData.can_extend_days ? (parseInt(formData.prolongation_days, 10) || 0) : 0)
                  );
                  if (end) handleChange("end_date", end);
                }} />
            </Field>
            <Field label="Total jours (calculé)">
              <input className="am-input am-input-readonly" readOnly value={totalDays} />
            </Field>
          </div>
        </Section>

        <Section icon={Tag} title="Sous-location & Prolongation">
          <div className="am-grid-2">
            <Field label="Sous-location" hint={formData.sous_location_id ? null : "Aucune — location propre"}>
              {!isNewSousLocation ? (
                <>
                  <SearchPicker
                    placeholder="Rechercher une sous-location…"
                    items={sousLocations}
                    filterFn={(sl, t) => (sl.name || "").toLowerCase().includes(t)}
                    renderResult={(sl) => (
                      <>
                        <strong>{sl.name}</strong>
                        {sl.description && <span className="am-result-meta">{sl.description}</span>}
                      </>
                    )}
                    onSelect={(sl) => handleChange("sous_location_id", sl.id)}
                    onCreateNew={canCreateSousLocation ? () => setIsNewSousLocation(true) : undefined}
                    createLabel="Créer une sous-location"
                    selectedText={selectedSousLocation ? selectedSousLocation.name : null}
                  />
                  {formData.sous_location_id && (
                    <button type="button" className="am-btn-ghost"
                      style={{ marginTop: 8 }}
                      onClick={() => handleChange("sous_location_id", "")}>
                      <X size={14} /> Retirer la sous-location
                    </button>
                  )}
                </>
              ) : (
                <InlineSousLocationForm
                  data={newSousLocationData}
                  setData={setNewSousLocationData}
                  saving={creatingSousLocation}
                  onCancel={() => setIsNewSousLocation(false)}
                  onSave={saveNewSousLocation}
                />
              )}
            </Field>
            <Field label="Prolongation autorisée">
              <label className="am-toggle" style={{ marginBottom: formData.can_extend_days ? 8 : 0 }}>
                <input
                  type="checkbox"
                  checked={formData.can_extend_days || false}
                  onChange={(e) => handleProlongationToggle(e.target.checked)}
                />
                <span>Le client pourra prolonger la location</span>
              </label>
              {formData.can_extend_days && (
                <input type="number" min="1" className="am-input" style={{ maxWidth: 140 }}
                  value={formData.prolongation_days || 1}
                  onChange={(e) => handleProlongationDaysChange(e.target.value)} />
              )}
            </Field>
          </div>
        </Section>
      </div>

      <div className="am-col">
        <Section icon={Car} title="Véhicule">
          <SearchPicker
            placeholder="Rechercher par immatriculation…"
            items={matricules.filter((m) => m.status !== "sold")}
            filterFn={(m, t) => (m.matricule_code || "").toLowerCase().includes(t)}
            renderResult={(m) => {
              const car = cars.find((c) => sameId(c.id, m.car_id));
              const isActive = m.status === "active";
              return (
                <>
                  <strong>{m.matricule_code}</strong>
                  <span
                    className="am-result-meta"
                    style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
                  >
                    {car && (
                      <span>
                        {car.brand} {car.model} · {car.price_per_day} DH/j
                      </span>
                    )}
                    <span className={`am-chip ${isActive ? "am-chip-success" : "am-chip-danger"}`}>
                      {isActive ? "Actif" : "Inactif"}
                    </span>
                  </span>
                </>
              );
            }}
            onSelect={(m) => {
              setSelectedMatricule(m);
              handleChange("matricule_id", m.id);
              handleChange("car_id", m.car_id);
              handleChange("kilometrage_sortie", m.kilometrage || "");
              applyMatriculePricing(m, totalDays);
            }}
            selectedText={selectedMatricule ? `${selectedMatricule.matricule_code} — ${selectedMatricule.kilometrage} km` : null}
          />
          <div className="am-grid-2" style={{ marginTop: 12 }}>
            <Field label="Véhicule" required>
              <select className="am-input" value={formData.car_id || ""} disabled={!!selectedMatricule}
                onChange={(e) => {
                  const cid = e.target.value;
                  handleChange("car_id", cid);
                  handleChange("matricule_id", "");
                  const car = cars.find((c) => sameId(c.id, cid));
                  if (car?.price_per_day && totalDays > 0) {
                    const rate = parseFloat(car.price_per_day);
                    setDailyRate(rate);
                    const newTotal = Math.round(rate * totalDays * 100) / 100;
                    handleChange("total_price", newTotal);
                    handleChange("remaining_amount", newTotal - (Number(formData.amount_paid) || 0));
                  }
                }} required>
                <option value="">Choisir…</option>
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>{c.brand} {c.model} — {c.price_per_day} DH/j</option>
                ))}
              </select>
            </Field>
            <Field label="Matricule">
              <select className="am-input" value={formData.matricule_id || ""} disabled={!!selectedMatricule}
                onChange={(e) => {
                  const id = e.target.value;
                  handleChange("matricule_id", id);
                  const m = matricules.find((x) => String(x.id) === String(id));
                  if (m) {
                    applyMatriculePricing(m, totalDays);
                    if (!formData.kilometrage_sortie) {
                      handleChange("kilometrage_sortie", m.kilometrage || "");
                    }
                  }
                }}>
                <option value="">Choisir…</option>
                {carMatricules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.matricule_code} {m.status === "active" ? "· Actif" : "· Inactif"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Km départ">
              <input type="number" className="am-input" value={formData.kilometrage_sortie || ""}
                onChange={(e) => handleChange("kilometrage_sortie", e.target.value)} />
            </Field>
            <Field label="Km retour">
              <input type="number" className="am-input" value={formData.kilometrage_entree || ""}
                onChange={(e) => handleChange("kilometrage_entree", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section icon={DollarSign} title="Paiement et statut">
          <div className="am-grid-2">
            <Field label="Prix / jour personnalisé (DH)">
              <div className="am-inline-input-btn">
                <input type="number" step="0.01" className="am-input"
                  value={manualDailyPrice}
                  onChange={(e) => setManualDailyPrice(e.target.value)} />
                <button type="button" className="am-btn-icon" onClick={applyManualDailyPrice}>
                  <Check size={16} />
                </button>
              </div>
            </Field>
            <Field label="Prix total (DH)" required>
              <div className="am-inline-input-btn">
                <input type="number" step="0.01" className="am-input"
                  value={formData.total_price || ""}
                  onChange={(e) => handleChange("total_price", parseFloat(e.target.value) || 0)}
                  required />
                <button type="button" className="am-btn-icon" onClick={recalcFromCar}
                  disabled={!formData.car_id}>
                  <RefreshCw size={16} />
                </button>
              </div>
            </Field>
            <Field label="Montant payé (DH)">
              <input className="am-input am-input-readonly" readOnly value={formData.amount_paid || 0} />
            </Field>
            <Field label="Reste à payer (DH)">
              <input className="am-input am-input-readonly" readOnly
                value={formData.remaining_amount ?? formData.total_price ?? 0} />
            </Field>
            <Field label="Statut">
              <select className="am-input" value={formData.status || "pending"}
                onChange={(e) => handleChange("status", e.target.value)}>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmée</option>
                <option value="contacted">Contacté</option>
                <option value="completed">Terminée</option>
                <option value="retard">En retard</option>
                <option value="cancelled">Annulée</option>
              </select>
            </Field>
          </div>

          <button type="button" className="am-btn-ghost am-btn-block"
            style={{ marginTop: 12 }}
            onClick={() => setShowAddPayment(!showAddPayment)}>
            <Plus size={14} /> Ajouter un paiement
          </button>

          {showAddPayment && (
            <div className="am-inline-create" style={{ marginTop: 12 }}>
              <div className="am-grid-2">
                <Field label="Montant">
                  <input type="number" className="am-input" value={newPayment.amount}
                    onChange={(e) => setNewPayment((p) => ({ ...p, amount: e.target.value }))} />
                </Field>
                <Field label="Date">
                  <input type="date" className="am-input" value={newPayment.date}
                    onChange={(e) => setNewPayment((p) => ({ ...p, date: e.target.value }))} />
                </Field>
                <Field label="Méthode">
                  <select className="am-input" value={newPayment.method}
                    onChange={(e) => setNewPayment((p) => ({ ...p, method: e.target.value }))}>
                    <option value="cash">Espèces</option>
                    <option value="card">Carte</option>
                    <option value="check">Chèque</option>
                    <option value="transfer">Virement</option>
                    <option value="forgiven">Pardonné</option>
                  </select>
                </Field>
                <Field label="Notes">
                  <input className="am-input" value={newPayment.notes}
                    onChange={(e) => setNewPayment((p) => ({ ...p, notes: e.target.value }))} />
                </Field>
              </div>
              <div className="am-inline-actions">
                <button type="button" className="am-btn-secondary" onClick={() => setShowAddPayment(false)}>Annuler</button>
                <button type="button" className="am-btn-primary" onClick={addPayment}>Ajouter</button>
              </div>
            </div>
          )}

          {paymentHistory.length > 0 && (
            <div className="am-history" style={{ marginTop: 12 }}>
              <div className="am-history-head">
                <History size={14} /> Historique ({paymentHistory.length})
              </div>
              {paymentHistory.map((p) => (
                <div key={p.id} className="am-history-row">
                  <span>{new Date(p.date).toLocaleDateString("fr-FR")}</span>
                  <span className="am-chip">{p.method}</span>
                  <span className="am-history-amount">{p.amount} DH</span>
                  <button type="button" className="am-icon-btn" onClick={() => removePayment(p.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section icon={Info} title="Notes">
          <textarea className="am-input am-textarea" rows={4}
            value={formData.notes || ""}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Notes supplémentaires…" />
        </Section>
      </div>
    </div>
  );
};

// ============================================================
// MATRICULES
// ============================================================
const REQUIRED_MAINTENANCE = [
  { key: "oil", label: "Huile", unit: "quantity", suffix: "L" },
  { key: "filter_oil", label: "Filtre à huile", unit: "count", suffix: "×" },
  { key: "filter_air", label: "Filtre à air", unit: "count", suffix: "×" },
  { key: "paquets_de_frein", label: "Plaquettes de frein", unit: "count", suffix: "×" },
  { key: "paquets_de_voiture", label: "Entretien général", unit: "count", suffix: "×" },
];
const OPTIONAL_MAINTENANCE = [
  { key: "ad_blue", label: "AdBlue", unit: "quantity", suffix: "L" },
];

const MaintenanceRow = ({ item, formData, handleChange, required }) => {
  const [logOpen, setLogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logQty, setLogQty] = useState("");

  const status = formData[item.key] || "no";
  const lastDate = formData[`${item.key}_date`] || "";
  const countField = item.unit === "quantity" ? `${item.key}_quantity` : `${item.key}_count`;
  const count = formData[countField] || 0;
  const history = Array.isArray(formData[`${item.key}_history`]) ? formData[`${item.key}_history`] : [];

  const logEntry = () => {
    const entry = { date: logDate, ...(item.unit === "quantity" ? { quantity: parseFloat(logQty) || 0 } : {}) };
    const updatedHistory = [...history, entry];
    handleChange(`${item.key}_history`, updatedHistory);
    handleChange(`${item.key}_date`, logDate);
    handleChange(item.key, "yes");
    if (item.unit === "quantity") handleChange(countField, (parseFloat(count) || 0) + (parseFloat(logQty) || 0));
    else handleChange(countField, (parseInt(count, 10) || 0) + 1);
    setLogQty("");
    setLogOpen(false);
  };

  return (
    <div className={`am-maint-row ${required ? "am-maint-required" : ""}`}>
      <div className="am-maint-top">
        <span className="am-maint-name">
          {item.label}
          {required && <span className="am-required-dot" />}
        </span>
        <span className={`am-status-badge ${status === "yes" ? "am-status-done" : "am-status-pending"}`}>
          {status === "yes" ? "Effectué" : "Non effectué"}
        </span>
      </div>
      <div className="am-maint-meta">
        {lastDate && <span>Dernier : {new Date(lastDate).toLocaleDateString("fr-FR")}</span>}
        <span>Total : {count} {item.suffix}</span>
      </div>
      <div className="am-maint-actions">
        <button type="button" className="am-btn-ghost" onClick={() => setLogOpen(!logOpen)}>
          <Plus size={13} /> Ajouter
        </button>
        {history.length > 0 && (
          <button type="button" className="am-btn-ghost" onClick={() => setHistoryOpen(!historyOpen)}>
            <History size={13} /> Historique {historyOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>
      {logOpen && (
        <div className="am-maint-log">
          <input type="date" className="am-input" value={logDate}
            onChange={(e) => setLogDate(e.target.value)} />
          {item.unit === "quantity" && (
            <input type="number" step="0.1" className="am-input" placeholder="Litres"
              value={logQty} onChange={(e) => setLogQty(e.target.value)} />
          )}
          <button type="button" className="am-btn-primary" onClick={logEntry}>Enregistrer</button>
        </div>
      )}
      {historyOpen && (
        <div className="am-maint-history">
          {history.slice().reverse().map((h, i) => (
            <div key={i} className="am-maint-history-row">
              <span>{new Date(h.date).toLocaleDateString("fr-FR")}</span>
              {h.quantity !== undefined && <span>{h.quantity} L</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MatriculeFields = ({ formData, handleChange, cars }) => {
  const [selectedCar, setSelectedCar] = useState(
    () => cars.find((c) => sameId(c.id, formData.car_id)) || null
  );
  const initialKm = useRef(formData.kilometrage || 0);
  const [kmAlert, setKmAlert] = useState("");

  const additional = Array.isArray(formData.additional_maintenance) ? formData.additional_maintenance : [];
  const periodic = Array.isArray(formData.periodic_km_maintenance) ? formData.periodic_km_maintenance : [];
  const [newExtra, setNewExtra] = useState({ name: "", due_date: "", required_for_vidange: false });
  const [newPeriodic, setNewPeriodic] = useState({ name: "", interval_km: "" });

  useEffect(() => {
    const coreDone = formData.oil === "yes" && formData.filter_oil === "yes";
    const extrasDone = additional.filter((a) => a.required_for_vidange).every((a) => !a.needs_attention);
    handleChange("vidange_status", coreDone && extrasDone ? "done" : "not done");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.oil, formData.filter_oil, JSON.stringify(additional)]);

  const handleKilometrageChange = (value) => {
    const km = parseInt(value, 10) || 0;
    handleChange("kilometrage", km);
    if (km - initialKm.current >= 10000) {
      handleChange("oil", "no");
      handleChange("filter_oil", "no");
      setKmAlert("Augmentation de 10 000 km ou plus : Huile et Filtre à huile remis à « Non effectué ».");
    }
  };

  return (
    <div className="am-columns">
      <div className="am-col">
        <Section icon={Car} title="Véhicule associé">
          <SearchPicker
            placeholder="Rechercher un véhicule…"
            items={cars}
            filterFn={(c, t) => `${c.brand} ${c.model} ${c.color || ""} ${c.year || ""}`.toLowerCase().includes(t)}
            renderResult={(c) => (
              <>
                <strong>{c.brand} {c.model}</strong>
                <span className="am-result-meta">{c.year} · {c.color} · {c.price_per_day} DH/j</span>
              </>
            )}
            onSelect={(c) => { setSelectedCar(c); handleChange("car_id", c.id); }}
            selectedText={selectedCar ? `${selectedCar.brand} ${selectedCar.model} — ${selectedCar.year}` : null}
          />
        </Section>

        <Section icon={Gauge} title="Identification & suivi">
          <div className="am-grid-2">
            <Field label="Matricule" required>
              <input className="am-input" value={formData.matricule_code || ""}
                onChange={(e) => handleChange("matricule_code", e.target.value)} required />
            </Field>
            <Field label="Statut">
              <select className="am-input" value={formData.status || "active"}
                onChange={(e) => handleChange("status", e.target.value)}>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </Field>
            <Field label="Kilométrage actuel" required hint={kmAlert}>
              <input type="number" min="0" className="am-input"
                value={formData.kilometrage || ""}
                onChange={(e) => handleKilometrageChange(e.target.value)} required />
            </Field>
            <Field label="Vidange">
              <span className={`am-status-badge ${formData.vidange_status === "done" ? "am-status-done" : "am-status-pending"}`}>
                {formData.vidange_status === "done" ? "Effectuée" : "Non effectuée"}
              </span>
            </Field>
            <Field label="Visite technique">
              <input type="date" className="am-input" value={formData.visit_tech || ""}
                onChange={(e) => handleChange("visit_tech", e.target.value)} />
            </Field>
            <Field label="Vignette">
              <input type="date" className="am-input" value={formData.date_taxe_voiture || ""}
                onChange={(e) => handleChange("date_taxe_voiture", e.target.value)} />
            </Field>
            <Field label="Assurance">
              <input type="date" className="am-input" value={formData.date_assurance || ""}
                onChange={(e) => handleChange("date_assurance", e.target.value)} />
            </Field>
          </div>
        </Section>
      </div>

      <div className="am-col">
        <Section icon={Wrench} title="Maintenance requise pour la vidange">
          <div className="am-maint-grid">
            {REQUIRED_MAINTENANCE.map((item) => (
              <MaintenanceRow key={item.key} item={item} formData={formData}
                handleChange={handleChange} required />
            ))}
          </div>
        </Section>

        <Section icon={Settings2} title="Maintenance optionnelle">
          <div className="am-maint-grid">
            {OPTIONAL_MAINTENANCE.map((item) => (
              <MaintenanceRow key={item.key} item={item} formData={formData}
                handleChange={handleChange} />
            ))}
          </div>
        </Section>

        <Section icon={Plus} title="Entretiens additionnels">
          {additional.length > 0 && (
            <div className="am-history" style={{ marginBottom: 12 }}>
              {additional.map((a, i) => (
                <div key={i} className="am-history-row">
                  <span>{a.name}</span>
                  {a.due_date && <span className="am-chip">{new Date(a.due_date).toLocaleDateString("fr-FR")}</span>}
                  {a.required_for_vidange && <span className="am-chip am-chip-primary">requis</span>}
                  <button type="button" className="am-icon-btn"
                    onClick={() => handleChange("additional_maintenance", additional.filter((_, idx) => idx !== i))}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="am-inline-input-btn">
            <input className="am-input" placeholder="Nom de l'entretien" value={newExtra.name}
              onChange={(e) => setNewExtra((p) => ({ ...p, name: e.target.value }))} />
            <input type="date" className="am-input" value={newExtra.due_date}
              onChange={(e) => setNewExtra((p) => ({ ...p, due_date: e.target.value }))} />
          </div>
          <label className="am-toggle" style={{ marginTop: 8 }}>
            <input type="checkbox" checked={newExtra.required_for_vidange}
              onChange={(e) => setNewExtra((p) => ({ ...p, required_for_vidange: e.target.checked }))} />
            <span>Requis pour la vidange</span>
          </label>
          <button type="button" className="am-btn-ghost" style={{ marginTop: 8 }}
            onClick={() => {
              if (!newExtra.name.trim()) return;
              handleChange("additional_maintenance", [...additional, { ...newExtra, needs_attention: true }]);
              setNewExtra({ name: "", due_date: "", required_for_vidange: false });
            }}>
            <Plus size={14} /> Ajouter
          </button>
        </Section>

        <Section icon={Gauge} title="Maintenance périodique (par kilométrage)">
          {periodic.length > 0 && (
            <div className="am-history" style={{ marginBottom: 12 }}>
              {periodic.map((p, i) => (
                <div key={i} className="am-history-row">
                  <span>{p.name}</span>
                  <span className="am-chip">chaque {p.interval_km} km</span>
                  <button type="button" className="am-icon-btn"
                    onClick={() => handleChange("periodic_km_maintenance", periodic.filter((_, idx) => idx !== i))}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="am-inline-input-btn">
            <input className="am-input" placeholder="Nom" value={newPeriodic.name}
              onChange={(e) => setNewPeriodic((p) => ({ ...p, name: e.target.value }))} />
            <input type="number" className="am-input" placeholder="Intervalle (km)" value={newPeriodic.interval_km}
              onChange={(e) => setNewPeriodic((p) => ({ ...p, interval_km: e.target.value }))} />
            <button type="button" className="am-btn-icon"
              onClick={() => {
                if (!newPeriodic.name.trim() || !newPeriodic.interval_km) return;
                handleChange("periodic_km_maintenance", [...periodic, { ...newPeriodic, needs_attention: false }]);
                setNewPeriodic({ name: "", interval_km: "" });
              }}>
              <Plus size={16} />
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
};

// ============================================================
// CLIENTS
// ============================================================
const ClientFields = ({ formData, handleChange }) => (
  <div className="am-columns">
    <div className="am-col">
      <Section icon={User} title="Identité">
        <div className="am-grid-2">
          <Field label="Prénom" required>
            <input className="am-input" value={formData.prenom || ""}
              onChange={(e) => handleChange("prenom", e.target.value)} required />
          </Field>
          <Field label="Nom" required>
            <input className="am-input" value={formData.nom || ""}
              onChange={(e) => handleChange("nom", e.target.value)} required />
          </Field>
          <Field label="Date de naissance">
            <input type="date" className="am-input" value={formData.date_naissance || ""}
              onChange={(e) => handleChange("date_naissance", e.target.value)} />
          </Field>
          <Field label="Lieu de naissance">
            <input className="am-input" value={formData.lieu_naissance || ""}
              onChange={(e) => handleChange("lieu_naissance", e.target.value)} />
          </Field>
        </div>
      </Section>
      <Section icon={Phone} title="Coordonnées">
        <div className="am-grid-2">
          <Field label="Téléphone" required>
            <input className="am-input" value={formData.telephone || ""}
              onChange={(e) => handleChange("telephone", e.target.value)} required />
          </Field>
          <Field label="Email">
            <input type="email" className="am-input" value={formData.email || ""}
              onChange={(e) => handleChange("email", e.target.value)} />
          </Field>
          <Field label="Ville">
            <input className="am-input" value={formData.city || ""}
              onChange={(e) => handleChange("city", e.target.value)} />
          </Field>
        </div>
      </Section>
    </div>
    <div className="am-col">
      <Section icon={IdCard} title="Carte d'identité">
        <div className="am-grid-2">
          <Field label="Numéro CIN">
            <input className="am-input" value={formData.cin_number || ""}
              onChange={(e) => handleChange("cin_number", e.target.value)} />
          </Field>
          <Field label="Délivrée le">
            <input type="date" className="am-input" value={formData.cin_delivre_le || ""}
              onChange={(e) => handleChange("cin_delivre_le", e.target.value)} />
          </Field>
        </div>
      </Section>
      <Section icon={Key} title="Permis de conduire">
        <div className="am-grid-2">
          <Field label="Numéro de permis">
            <input className="am-input" value={formData.driver_license_number || ""}
              onChange={(e) => handleChange("driver_license_number", e.target.value)} />
          </Field>
          <Field label="Délivré le">
            <input type="date" className="am-input" value={formData.permis_delivre_le || ""}
              onChange={(e) => handleChange("permis_delivre_le", e.target.value)} />
          </Field>
        </div>
      </Section>
    </div>
  </div>
);

// ============================================================
// CARS
// ============================================================
const CarFields = ({ formData, handleChange }) => (
  <div className="am-columns">
    <div className="am-col">
      <Section icon={Car} title="Identité du véhicule">
        <div className="am-grid-2">
          <Field label="Marque" required>
            <input className="am-input" value={formData.brand || ""}
              onChange={(e) => handleChange("brand", e.target.value)} required />
          </Field>
          <Field label="Modèle" required>
            <input className="am-input" value={formData.model || ""}
              onChange={(e) => handleChange("model", e.target.value)} required />
          </Field>
          <Field label="Année">
            <input type="number" className="am-input" value={formData.year || ""}
              onChange={(e) => handleChange("year", e.target.value)} />
          </Field>
          <Field label="Couleur">
            <input className="am-input" value={formData.color || ""}
              onChange={(e) => handleChange("color", e.target.value)} />
          </Field>
        </div>
      </Section>
      <Section icon={Fuel} title="Spécifications">
        <div className="am-grid-2">
          <Field label="Carburant">
            <select className="am-input" value={formData.fuel_type || "essence"}
              onChange={(e) => handleChange("fuel_type", e.target.value)}>
              <option value="essence">Essence</option>
              <option value="diesel">Diesel</option>
              <option value="hybride">Hybride</option>
              <option value="electrique">Électrique</option>
            </select>
          </Field>
          <Field label="Transmission">
            <select className="am-input" value={formData.transmission || "manuelle"}
              onChange={(e) => handleChange("transmission", e.target.value)}>
              <option value="manuelle">Manuelle</option>
              <option value="automatique">Automatique</option>
            </select>
          </Field>
          <Field label="Places">
            <input type="number" className="am-input" value={formData.seats || 5}
              onChange={(e) => handleChange("seats", e.target.value)} />
          </Field>
          <Field label="Portes">
            <input type="number" className="am-input" value={formData.doors || 4}
              onChange={(e) => handleChange("doors", e.target.value)} />
          </Field>
        </div>
      </Section>
    </div>
    <div className="am-col">
      <Section icon={DollarSign} title="Tarif et statut">
        <div className="am-grid-2">
          <Field label="Prix / jour (DH)" required>
            <input type="number" className="am-input" value={formData.price_per_day || ""}
              onChange={(e) => handleChange("price_per_day", e.target.value)} required />
          </Field>
          <Field label="Statut">
            <select className="am-input" value={formData.status || "available"}
              onChange={(e) => handleChange("status", e.target.value)}>
              <option value="available">Disponible</option>
              <option value="unavailable">Indisponible</option>
            </select>
          </Field>
        </div>
      </Section>
      <Section icon={Info} title="Description">
        <textarea className="am-input am-textarea" rows={6}
          value={formData.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Détails, équipements, remarques…" />
      </Section>
    </div>
  </div>
);

// ============================================================
// USERS
// ============================================================
const UserFields = ({ formData, handleChange, modalType }) => (
  <div className="am-columns">
    <div className="am-col">
      <Section icon={User} title="Compte utilisateur">
        <Field label="Nom complet" required>
          <input className="am-input" value={formData.Fullname || ""}
            onChange={(e) => handleChange("Fullname", e.target.value)} required />
        </Field>
        <Field
          label="Mot de passe"
          required={modalType === "create"}
          hint={modalType === "edit" ? "Laisser vide pour ne pas changer" : ""}
        >
          <input type="password" className="am-input" value={formData.password || ""}
            onChange={(e) => handleChange("password", e.target.value)}
            required={modalType === "create"} />
        </Field>
        <Field label="Rôle">
          <select className="am-input" value={formData.role || "employee"}
            onChange={(e) => handleChange("role", e.target.value)}>
            <option value="employee">Employé</option>
            <option value="admin">Administrateur</option>
          </select>
        </Field>
      </Section>
    </div>
    <div className="am-col">
      <Section icon={Lock} title="Accès">
        <p className="am-note">
          Les permissions détaillées se gèrent depuis la fiche de l'utilisateur une fois créé.
        </p>
      </Section>
    </div>
  </div>
);

// ============================================================
// CONTACTS
// ============================================================
const ContactFields = ({ formData, handleChange }) => (
  <div className="am-columns">
    <div className="am-col">
      <Section icon={User} title="Expéditeur">
        <Field label="Nom complet" required>
          <input className="am-input" value={formData.fullname || ""}
            onChange={(e) => handleChange("fullname", e.target.value)} required />
        </Field>
        <Field label="Email" required>
          <input type="email" className="am-input" value={formData.email || ""}
            onChange={(e) => handleChange("email", e.target.value)} required />
        </Field>
        <Field label="Téléphone">
          <input className="am-input" value={formData.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)} />
        </Field>
      </Section>
    </div>
    <div className="am-col">
      <Section icon={MessageSquare} title="Message">
        <textarea className="am-input am-textarea" rows={10}
          value={formData.message || ""}
          onChange={(e) => handleChange("message", e.target.value)}
          required />
      </Section>
    </div>
  </div>
);

// ============================================================
// ACCIDENTS
// ============================================================
const ACCIDENT_STATUS = [
  { value: "pending", label: "En attente" },
  { value: "evaluation_owner", label: "Évaluation propriétaire" },
  { value: "contact expert", label: "Contact expert" },
  { value: "evaluation_expert", label: "Évaluation expert" },
  { value: "fixed", label: "Réparé" },
  { value: "completed", label: "Terminé" },
];
const ACCIDENT_TYPE = [
  { value: "grave", label: "Accident grave" },
  { value: "non_grave", label: "Accident non grave" },
];
const PROCEDURE_TYPE = [
  { value: "classic", label: "Procédure classique" },
  { value: "forphie", label: "Procédure forphie" },
];
const EXPERT_DECISION = [
  { value: "pending", label: "En attente" },
  { value: "accepted", label: "Accepté" },
  { value: "rejected", label: "Rejeté" },
];

const AccidentFields = ({ formData, handleChange, matricules, cars }) => {
  const [selectedMatricule, setSelectedMatricule] = useState(
    () => matricules.find((m) => sameId(m.id, formData.matricule_id)) || null
  );
  const needsExpert =
    formData.status === "evaluation_expert" ||
    formData.status === "contact expert" ||
    (formData.accident_type === "grave" && ["evaluation_owner", "pending"].includes(formData.status));

  return (
    <div className="am-columns">
      <div className="am-col">
        <Section icon={Car} title="Véhicule concerné">
          <SearchPicker
            placeholder="Rechercher une immatriculation…"
            items={matricules}
            filterFn={(m, t) => (m.matricule_code || "").toLowerCase().includes(t)}
            renderResult={(m) => {
              const car = cars.find((c) => sameId(c.id, m.car_id));
              return (
                <>
                  <strong>{m.matricule_code}</strong>
                  {car && <span className="am-result-meta">{car.brand} {car.model}</span>}
                </>
              );
            }}
            onSelect={(m) => { setSelectedMatricule(m); handleChange("matricule_id", m.id); }}
            selectedText={selectedMatricule ? selectedMatricule.matricule_code : null}
          />
        </Section>

        <Section icon={AlertTriangle} title="Classification">
          <div className="am-grid-2">
            <Field label="Type d'accident" required>
              <select className="am-input" value={formData.accident_type || "grave"}
                onChange={(e) => handleChange("accident_type", e.target.value)} required>
                {ACCIDENT_TYPE.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Type de procédure" required>
              <select className="am-input" value={formData.procedure_type || "classic"}
                disabled={formData.accident_type === "non_grave"}
                onChange={(e) => handleChange("procedure_type", e.target.value)} required>
                {PROCEDURE_TYPE.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Statut" required>
              <select className="am-input" value={formData.status || "pending"}
                onChange={(e) => handleChange("status", e.target.value)} required>
                {ACCIDENT_STATUS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Date de l'accident" required>
              <input type="date" className="am-input" value={formData.date_accident || ""}
                onChange={(e) => handleChange("date_accident", e.target.value)} required />
            </Field>
          </div>
        </Section>
      </div>

      <div className="am-col">
        <Section icon={DollarSign} title="Montants">
          <div className="am-grid-2">
            <Field label="Montant des dégâts (DH)">
              <input type="number" className="am-input" value={formData.amount_of_losses || ""}
                onChange={(e) => handleChange("amount_of_losses", e.target.value)} />
            </Field>
            <Field label="Pris en charge assurance (DH)">
              <input type="number" className="am-input" value={formData.amount_assurance || ""}
                onChange={(e) => handleChange("amount_assurance", e.target.value)} />
            </Field>
          </div>
        </Section>

        {needsExpert && (
          <Section icon={ShieldCheck} title="Expertise">
            <div className="am-grid-2">
              <Field label="Nom de l'expert">
                <input className="am-input" value={formData.nom_expert || ""}
                  onChange={(e) => handleChange("nom_expert", e.target.value)} />
              </Field>
              <Field label="Montant expert (DH)">
                <input type="number" className="am-input" value={formData.expert_amount || ""}
                  onChange={(e) => handleChange("expert_amount", e.target.value)} />
              </Field>
              <Field label="Décision">
                <select className="am-input" value={formData.expert_decision || "pending"}
                  onChange={(e) => handleChange("expert_decision", e.target.value)}>
                  {EXPERT_DECISION.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Notes de l'expert">
              <textarea className="am-input am-textarea" rows={3} value={formData.expert_notes || ""}
                onChange={(e) => handleChange("expert_notes", e.target.value)} />
            </Field>
          </Section>
        )}

        <Section icon={Info} title="Notes générales">
          <textarea className="am-input am-textarea" rows={5} value={formData.notes || ""}
            onChange={(e) => handleChange("notes", e.target.value)} />
        </Section>
      </div>
    </div>
  );
};

// ============================================================
// MAIN MODAL
// ============================================================
const TYPE_META = {
  reservations: { label: "une Réservation", icon: Calendar },
  matricules: { label: "un Matricule", icon: Gauge },
  clients: { label: "un Client", icon: User },
  cars: { label: "un Véhicule", icon: Car },
  users: { label: "un Utilisateur", icon: User },
  contacts: { label: "un Contact", icon: MessageSquare },
  accidents: { label: "un Accident", icon: AlertTriangle },
};

const AdminModal = ({
  type, modalType, formData, setFormData, onClose, onSubmit, onSubmitAndNavigate,
  clients = [], matricules = [], cars = [], submitting = false, createClient,
  sousLocations = [], createSousLocation, canCreateSousLocation = true,
}) => {
  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const meta = TYPE_META[type] || { label: type, icon: Info };
  const Icon = meta.icon;

  const createClientFn = createClient || (async (data) => ({ id: `temp_${Date.now()}`, ...data }));
  const createSousLocationFn = createSousLocation || (async (data) => ({ id: `temp_${Date.now()}`, ...data }));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  useEffect(() => {
    const scrollEl = document.querySelector(".content-area");
    const prevBodyOverflow = document.body.style.overflow;
    const prevAreaOverflow = scrollEl?.style.overflow;

    document.body.style.overflow = "hidden";
    if (scrollEl) scrollEl.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      if (scrollEl) scrollEl.style.overflow = prevAreaOverflow || "";
    };
  }, []);

  const renderFields = () => {
    switch (type) {
      case "reservations":
        return (
          <ReservationFields
            formData={formData}
            handleChange={handleChange}
            clients={clients}
            cars={cars}
            matricules={matricules}
            createClient={createClientFn}
            submitting={submitting}
            sousLocations={sousLocations}
            createSousLocation={createSousLocationFn}
            canCreateSousLocation={canCreateSousLocation}
          />
        );
      case "matricules":
        return <MatriculeFields formData={formData} handleChange={handleChange} cars={cars} />;
      case "clients":
        return <ClientFields formData={formData} handleChange={handleChange} />;
      case "cars":
        return <CarFields formData={formData} handleChange={handleChange} />;
      case "users":
        return <UserFields formData={formData} handleChange={handleChange} modalType={modalType} />;
      case "contacts":
        return <ContactFields formData={formData} handleChange={handleChange} />;
      case "accidents":
        return <AccidentFields formData={formData} handleChange={handleChange}
          matricules={matricules} cars={cars} />;
      default:
        return <p className="am-note">Formulaire pour « {type} » non disponible.</p>;
    }
  };

  return createPortal(
    <div className="am-overlay" role="dialog" aria-modal="true">
      <div className="am-modal">
        <header className="am-header">
          <div className="am-header-icon">
            <Icon size={28} />
          </div>
          <div className="am-header-title">
            <h2>{modalType === "create" ? "Ajouter" : "Modifier"} {meta.label}</h2>
            <p>{modalType === "create"
              ? "Renseignez les informations ci-dessous"
              : "Modifiez les informations puis enregistrez"}</p>
          </div>
          <button type="button" className="am-header-close" onClick={onClose}
            disabled={submitting} aria-label="Fermer">
            <X size={24} />
          </button>
        </header>

        <form onSubmit={onSubmit} className="am-form">
          <div className="am-body">{renderFields()}</div>

          <div className="am-footer">
            <button type="button" className="am-btn-secondary" onClick={onClose} disabled={submitting}>
              Annuler
            </button>
            {type === "reservations" && onSubmitAndNavigate && (
              <button type="button" className="am-btn-secondary"
                onClick={onSubmitAndNavigate} disabled={submitting}>
                <Save size={16} />
                {submitting ? "Traitement…" : modalType === "create" ? "Créer & Contrat" : "Mettre à jour & Contrat"}
              </button>
            )}
            <button type="submit" className="am-btn-primary" disabled={submitting}>
              {submitting ? "Traitement…" : modalType === "create" ? "Créer" : "Mettre à jour"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .am-overlay {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background: #f8fafc;
          overflow-y: auto;
          overflow-x: hidden;
          z-index: 9999;
        }

        @media (min-width: 768px) {
          .am-overlay {
            left: 18rem;
          }
        }

        .am-modal {
          background: #fff;
          border-radius: 32px;
          margin: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: amSlideIn 0.3s ease-out;
        }
        @keyframes amSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }

        .am-header {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 24px 32px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .am-header-icon {
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
        .am-header-title { flex: 1; min-width: 0; padding-right: 48px; }
        .am-header-title h2 {
          color: #fff;
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
        }
        .am-header-title p {
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.875rem;
          margin: 4px 0 0;
        }
        .am-header-close {
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
        .am-header-close:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.05);
        }
        .am-header-close:disabled { opacity: 0.5; cursor: not-allowed; }

        .am-form { padding: 28px 32px; }

        .am-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          align-items: start;
        }
        .am-col { display: flex; flex-direction: column; gap: 24px; }

        .am-section {
          background: #f8fafc;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }
        .am-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #667eea;
        }
        .am-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }
        .am-section-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .am-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .am-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .am-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .am-required::after { content: " *"; color: #dc2626; }
        .am-hint { font-size: 0.7rem; color: #b45309; font-style: italic; }
        .am-note { font-size: 0.875rem; color: #64748b; margin: 0; }

        .am-input {
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
        .am-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .am-input:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }
        .am-input-readonly {
          background: #f8fafc;
          color: #475569;
        }
        .am-textarea { resize: vertical; min-height: 80px; }

        .am-picker { display: flex; flex-direction: column; gap: 8px; }
        .am-search { position: relative; }
        .am-search > svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }
        .am-input-search { padding-left: 42px; }

        .am-results {
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          max-height: 220px;
          overflow-y: auto;
          background: #fff;
        }
        .am-result {
          padding: 10px 14px;
          cursor: pointer;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 2px;
          transition: background 0.15s;
        }
        .am-result:last-child { border-bottom: none; }
        .am-result:hover { background: #f5f3ff; }
        .am-result strong { font-size: 0.875rem; color: #1e293b; font-weight: 600; }
        .am-result-meta { font-size: 0.75rem; color: #64748b; }

        .am-selected {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(102, 126, 234, 0.08);
          color: #4338ca;
          font-size: 0.85rem;
          font-weight: 500;
          border: 1px solid rgba(102, 126, 234, 0.2);
        }
        .am-selected svg { color: #667eea; flex-shrink: 0; }

        .am-toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          user-select: none;
        }
        .am-toggle input { cursor: pointer; accent-color: #667eea; }

        .am-chip {
          display: inline-block;
          background: #e0e7ff;
          color: #4338ca;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 999px;
        }
        .am-chip-primary {
          background: #667eea;
          color: #fff;
        }
        .am-chip-success {
          background: #dcfce7;
          color: #166534;
        }
        .am-chip-danger {
          background: #fee2e2;
          color: #991b1b;
        }

        .am-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 999px;
          width: fit-content;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .am-status-done { background: #dcfce7; color: #166534; }
        .am-status-pending { background: #fee2e2; color: #991b1b; }

        .am-inline-create {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .am-inline-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 4px;
        }

        .am-btn-primary,
        .am-btn-secondary,
        .am-btn-ghost,
        .am-btn-icon {
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

        .am-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          padding: 12px 28px;
          color: #fff;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        .am-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        .am-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .am-btn-secondary {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          padding: 10px 24px;
          color: #475569;
        }
        .am-btn-secondary:hover:not(:disabled) {
          border-color: #667eea;
          color: #667eea;
          background: #f8fafc;
        }
        .am-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

        .am-btn-ghost {
          background: transparent;
          border: 1.5px dashed #cbd5e1;
          padding: 8px 16px;
          color: #475569;
          font-size: 0.8rem;
        }
        .am-btn-ghost:hover {
          border-color: #667eea;
          color: #667eea;
          background: #f5f3ff;
          border-style: solid;
        }

        .am-btn-block { width: 100%; }

        .am-btn-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          width: 42px;
          height: 42px;
          padding: 0;
          color: #fff;
          border-radius: 12px;
          flex-shrink: 0;
        }
        .am-btn-icon:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
        }
        .am-btn-icon:disabled { opacity: 0.5; cursor: not-allowed; }

        .am-icon-btn {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          transition: background 0.15s;
        }
        .am-icon-btn:hover { background: #fee2e2; }

        .am-inline-input-btn {
          display: flex;
          gap: 8px;
          align-items: stretch;
        }
        .am-inline-input-btn .am-input { flex: 1; min-width: 0; }

        .am-history {
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
        }
        .am-history-head {
          padding: 10px 14px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.75rem;
          font-weight: 700;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 6px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .am-history-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          font-size: 0.8rem;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
        }
        .am-history-row:last-child { border-bottom: none; }
        .am-history-amount {
          font-weight: 700;
          color: #667eea;
          margin-left: auto;
        }

        .am-maint-grid { display: flex; flex-direction: column; gap: 12px; }
        .am-maint-row {
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px;
          background: #fff;
          transition: border-color 0.15s;
        }
        .am-maint-row:hover { border-color: #cbd5e1; }
        .am-maint-row.am-maint-required { border-left: 4px solid #667eea; }
        .am-maint-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .am-maint-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .am-required-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #667eea;
          display: inline-block;
        }
        .am-maint-meta {
          display: flex;
          gap: 14px;
          font-size: 0.72rem;
          color: #64748b;
          margin-top: 6px;
        }
        .am-maint-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        .am-maint-log {
          display: flex;
          gap: 8px;
          margin-top: 10px;
          align-items: stretch;
        }
        .am-maint-log .am-input { flex: 1; min-width: 0; }
        .am-maint-history {
          margin-top: 10px;
          border-top: 1px dashed #e2e8f0;
          padding-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .am-maint-history-row {
          display: flex;
          gap: 14px;
          font-size: 0.75rem;
          color: #64748b;
        }

        .am-footer {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        @media (max-width: 1024px) {
          .am-columns { grid-template-columns: 1fr; gap: 24px; }
        }

        @media (max-width: 768px) {
          .am-grid-2 { grid-template-columns: 1fr; }
          .am-modal { margin: 1rem; border-radius: 24px; }
          .am-header { padding: 16px 20px; gap: 14px; }
          .am-header-title h2 { font-size: 1.25rem; }
          .am-header-title { padding-right: 40px; }
          .am-header-icon { width: 44px; height: 44px; border-radius: 22px; }
          .am-header-close { top: 16px; right: 16px; width: 36px; height: 36px; }
          .am-form { padding: 20px; }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default AdminModal;