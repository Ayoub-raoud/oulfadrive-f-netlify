// src/utils/reportSync.js  — version corrigée v2
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoImage from "../assets/logo.png";
import { updateReservation } from "../Redux/store";

const API_URL = "https://oulfa-back-production.up.railway.app/api";

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

// ============================================================
// Génère le PDF du rapport
// ============================================================
const generateReportPDF = async (rows, fileName) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let logoDataUrl = "";
  try {
    const response = await fetch(logoImage);
    const blob = await response.blob();
    logoDataUrl = await blobToBase64(blob);
  } catch (e) {
    console.warn("Logo non chargé", e);
  }

  const margin = 14;
  let y = 20;

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", margin, y - 5, 30, 20);
  }
  doc.setFontSize(22);
  doc.setTextColor(26, 26, 46);
  doc.text("Rapport", pageWidth / 2, y + 10, { align: "center" });
  y += 15;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Généré le ${new Date().toLocaleDateString("fr-FR")}`,
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 8;

  const tableHeaders = [["Date", "Client", "Prix HT (MAD)"]];
  const tableRows = rows.map((row) => [
    row.date || "",
    row.client_name || "",
    row.price ? Number(row.price).toFixed(2) : "0.00",
  ]);

  autoTable(doc, {
    head: tableHeaders,
    body: tableRows,
    startY: y + 5,
    theme: "grid",
    headStyles: {
      fillColor: [234, 179, 8],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
      fontSize: 10,
    },
    bodyStyles: { halign: "center", fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 60 },
      2: { cellWidth: 30 },
    },
    margin: {
      left: (pageWidth - pageWidth * 0.8) / 2,
      right: (pageWidth - pageWidth * 0.8) / 2,
    },
  });

  const finalY = doc.lastAutoTable.finalY + 8;
  const total = rows.reduce((sum, r) => sum + Number(r.price || 0), 0);
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total HT: ${total.toFixed(2)} DH`, pageWidth / 2, finalY, {
    align: "center",
  });

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "OULFA DRIVE — Document généré automatiquement.",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  const pdfBlob = doc.output("blob");
  return await blobToBase64(pdfBlob);
};

// ============================================================
// Parseurs tolérants (JSON string ou tableau)
// ============================================================
const parseRows = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const parseHistory = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// ============================================================
// Synchronise un rapport avec les paiements d'une réservation
// ============================================================
export const syncReportForReservation = async (reservation, dispatch) => {
  if (!reservation || !reservation.id) {
    console.warn("[reportSync] Aucune réservation fournie.");
    return;
  }

  const reservationId = reservation.id;
  const client = reservation.client || null;
  const client_id = reservation.client_id || client?.id;

  if (!client_id) {
    console.warn(
      `[reportSync] Réservation #${reservationId} sans client_id — abandon.`
    );
    return;
  }

  // ----- 1) Historique des paiements (peut être une string JSON)
  const history = parseHistory(reservation.payment_history);

  // ----- 2) Mois cible
  let targetDateStr = new Date().toISOString().slice(0, 10);
  if (history.length > 0 && history[0]?.date) {
    targetDateStr = String(history[0].date).slice(0, 10);
  }
  const targetDate = new Date(targetDateStr + "T00:00:00Z");
  const targetMonth = targetDate.getUTCMonth();
  const targetYear = targetDate.getUTCFullYear();

  const token = localStorage.getItem("authToken");

  // ----- 3) Récupérer les rapports du client
  let reports = [];
  try {
    const resReports = await fetch(
      `${API_URL}/reports?client_id=${client_id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (resReports.ok) {
      const dataReports = await resReports.json();
      reports =
        dataReports?.reports ||
        dataReports?.data ||
        (Array.isArray(dataReports) ? dataReports : []);
      if (!Array.isArray(reports)) reports = [];
    }
  } catch (e) {
    console.warn("[reportSync] Impossible de récupérer les rapports :", e);
  }

  // ----- 4) Chercher un rapport existant pour ce client + ce mois
  let existingReport = null;
  for (const report of reports) {
    const rows = parseRows(report.rows);
    const hasMatchingRow = rows.some((row) => {
      if (!row.date) return false;
      const d = new Date(String(row.date).slice(0, 10) + "T00:00:00Z");
      return (
        String(row.client_id) === String(client_id) &&
        d.getUTCMonth() === targetMonth &&
        d.getUTCFullYear() === targetYear
      );
    });
    if (hasMatchingRow) {
      existingReport = report;
      break;
    }
  }

  // ----- 5) Regrouper les NOUVEAUX paiements de CETTE réservation
  const newPaymentsGrouped = {};

  history.forEach((p) => {
    const pDateStr = String(
      p.date || new Date().toISOString().slice(0, 10)
    ).slice(0, 10);
    const pDate = new Date(pDateStr + "T00:00:00Z");

    if (
      pDate.getUTCMonth() !== targetMonth ||
      pDate.getUTCFullYear() !== targetYear
    ) {
      return;
    }

    const amount = parseFloat(p.amount);
    if (isNaN(amount) || amount <= 0) return;

    // Déjà synchronisé ? (marqué "Rapport auto" dans les notes)
    const notes = String(p.notes || "");
    const alreadySynced = notes.includes("Rapport auto");

    // Skip seulement si le rapport existe déjà ET que ce paiement y est déjà
    if (alreadySynced && existingReport) return;

    if (!newPaymentsGrouped[pDateStr]) newPaymentsGrouped[pDateStr] = 0;
    newPaymentsGrouped[pDateStr] += amount;
  });

  if (Object.keys(newPaymentsGrouped).length === 0) {
    // Rien de nouveau — sortie silencieuse
    return;
  }

  // ----- 6) Construire les nouvelles lignes du rapport
  let finalRows = [];

  if (existingReport) {
    const existingRows = parseRows(existingReport.rows);

    const otherRows = existingRows.filter(
      (row) => String(row.client_id) !== String(client_id)
    );
    const clientRows = existingRows.filter(
      (row) => String(row.client_id) === String(client_id)
    );

    const clientByDate = {};
    clientRows.forEach((row) => {
      const dateKey = String(row.date).slice(0, 10);
      if (!clientByDate[dateKey]) clientByDate[dateKey] = 0;
      clientByDate[dateKey] += parseFloat(row.price) || 0;
    });

    for (const [date, amount] of Object.entries(newPaymentsGrouped)) {
      if (!clientByDate[date]) clientByDate[date] = 0;
      clientByDate[date] += amount;
    }

    const mergedClientRows = Object.entries(clientByDate).map(
      ([date, total]) => ({
        date,
        client_name:
          `${client?.prenom || ""} ${client?.nom || ""}`.trim() ||
          `Client ${client_id}`,
        client_id: client_id,
        price: total,
      })
    );

    finalRows = [...otherRows, ...mergedClientRows];
  } else {
    finalRows = Object.entries(newPaymentsGrouped).map(([date, total]) => ({
      date,
      client_name:
        `${client?.prenom || ""} ${client?.nom || ""}`.trim() ||
        `Client ${client_id}`,
      client_id: client_id,
      price: total,
    }));
  }

  finalRows = finalRows.map((row) => ({
    ...row,
    price: parseFloat(row.price) || 0,
  }));

  const total_ht = finalRows.reduce((sum, r) => sum + r.price, 0);

  // ----- 7) Générer le PDF
  const fileName = `Rapport_Auto_${reservationId}_${targetYear}-${String(
    targetMonth + 1
  ).padStart(2, "0")}.pdf`;
  let pdfBase64;
  try {
    pdfBase64 = await generateReportPDF(finalRows, fileName);
  } catch (e) {
    console.error("[reportSync] PDF generation failed:", e);
    return;
  }

  // ----- 8) Sauvegarder / mettre à jour le rapport
  const payload = {
    file_name: fileName,
    pdf_data: pdfBase64,
    rows: finalRows,
    total_ht: total_ht,
  };

  try {
    let response;
    if (existingReport) {
      response = await fetch(`${API_URL}/reports/${existingReport.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[reportSync] Erreur mise à jour rapport:", errorText);
        throw new Error(
          `Erreur mise à jour du rapport (${response.status}): ${errorText}`
        );
      }
      toast.success(`Rapport mis à jour pour la réservation #${reservationId}`);
    } else {
      response = await fetch(`${API_URL}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[reportSync] Erreur création rapport:", errorText);
        throw new Error(
          `Erreur création du rapport (${response.status}): ${errorText}`
        );
      }
      toast.success(`Rapport créé pour la réservation #${reservationId}`);
    }
    await response.json();
  } catch (err) {
    console.error("[reportSync] Save error:", err);
    toast.error(`Erreur rapport: ${err.message}`);
    throw err;
  }

  // ----- 9) Marquer les paiements comme synchronisés (sans écraser les notes)
  const updatedPayments = history.map((p) => {
    const existingNotes = String(p.notes || "");
    if (existingNotes.includes(fileName)) return p;
    const newNotes = existingNotes
      ? `${existingNotes} | Rapport auto (${fileName})`
      : `Rapport auto (${fileName})`;
    return { ...p, notes: newNotes };
  });

  try {
    await dispatch(
      updateReservation({
        id: reservationId,
        data: { payment_history: updatedPayments },
      })
    ).unwrap();
  } catch (e) {
    console.warn(
      "[reportSync] Impossible de marquer les paiements comme synchronisés :",
      e
    );
  }
};