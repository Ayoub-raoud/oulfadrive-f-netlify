// src/components/SignContract.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../Redux/store';
import { toast } from 'sonner';
import {
  PenTool, X, Sparkles, CircleCheck, User, Car, Loader,
  ShieldCheck, FileSignature, Clock, CheckCircle2,
  Eraser, Lock, ChevronRight, AlertCircle, UserCheck,
} from 'lucide-react';
import logoImage from "../assets/logo1.png";

export default function SignContract() {
  const { token } = useParams();
  const navigate = useNavigate();

  // ---------- State ----------
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [signedRole, setSignedRole] = useState(null);
  const [countdown, setCountdown] = useState(15);

  const [tokenInfo, setTokenInfo] = useState(null);
  const [infoLoading, setInfoLoading] = useState(true);
  const [infoError, setInfoError] = useState(null);

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);

  // ---------- Fetch token info ----------
  useEffect(() => {
    const fetchTokenInfo = async () => {
      try {
        const response = await api.get(`/reservations/sign-info/${token}`);
        setTokenInfo(response.data);
        setInfoError(null);
      } catch (err) {
        console.error('Error fetching token info:', err);
        setInfoError('Le lien de signature est invalide ou a expiré.');
        toast.error("Lien invalide. Veuillez contacter l'agence.");
      } finally {
        setInfoLoading(false);
      }
    };
    fetchTokenInfo();
  }, [token]);

  // ---------- Canvas init ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    const width = parent.clientWidth || 400;
    const height = 220;
    canvas.width = width;
    canvas.height = height;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f172a';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [infoLoading, infoError]);

  // ---------- Handle resize ----------
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      const width = parent.clientWidth || 400;
      const height = 220;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#0f172a';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (signatureData) {
        const img = new Image();
        img.src = signatureData;
        img.onload = () => ctx.drawImage(img, 0, 0, width, height);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [signatureData]);

  // ---------- Countdown after success ----------
  useEffect(() => {
    if (!success) return;
    if (countdown === 0) {
      navigate('/');
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, success, navigate]);

  // ---------- Drawing ----------
  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsCanvasEmpty(false);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(false);
    const canvas = canvasRef.current;
    setSignatureData(canvas.toDataURL('image/png'));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
    setIsCanvasEmpty(true);
  };

  // ---------- Submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code) {
      toast.error('Veuillez entrer le code.');
      return;
    }
    if (!signatureData || isCanvasEmpty) {
      toast.error('Veuillez signer dans la zone prévue.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post(`/reservations/sign/${token}`, {
        code,
        signature: signatureData,
      });
      const role = response.data.role || 'locataire';
      setSignedRole(role);
      toast.success('Signature enregistrée avec succès !');
      setSuccess(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la signature.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Derived ----------
  const isSecondDriver = tokenInfo?.role === 'second';
  const title = isSecondDriver ? 'Signature du 2ème conducteur' : 'Signature du contrat';
  const subtitle = isSecondDriver
    ? 'Saisissez le code reçu pour le deuxième conducteur puis signez ci-dessous.'
    : 'Saisissez le code reçu par SMS ou email puis signez ci-dessous.';
  const successTitle = isSecondDriver
    ? 'Signature du 2ème conducteur validée'
    : 'Signature validée avec succès';
  const successMessage = isSecondDriver
    ? 'Le deuxième conducteur a bien signé le contrat.'
    : 'Votre signature a été enregistrée avec succès.';

  // ---------- Loading ----------
  if (infoLoading) {
    return (
      <div className="sp-page">
        <div className="sp-shell sp-shell-narrow">
          <div className="sp-state">
            <div className="sp-loader-ring">
              <Loader size={28} className="sp-spin" />
            </div>
            <h2>Vérification du lien</h2>
            <p>Nous vérifions la validité de votre lien de signature…</p>
          </div>
        </div>
        <style>{baseStyles}</style>
      </div>
    );
  }

  // ---------- Error ----------
  if (infoError) {
    return (
      <div className="sp-page">
        <div className="sp-shell sp-shell-narrow">
          <div className="sp-state">
            <div className="sp-state-icon error">
              <AlertCircle size={32} />
            </div>
            <h2>Lien invalide</h2>
            <p>{infoError}</p>
            <button className="sp-btn sp-btn-ghost" onClick={() => navigate('/')}>
              Retour à l'accueil
            </button>
          </div>
        </div>
        <style>{baseStyles}</style>
      </div>
    );
  }

  // ---------- Success ----------
  if (success) {
    const circumference = 2 * Math.PI * 46;
    const offset = circumference * (1 - countdown / 15);
    return (
      <div className="sp-page">
        <div className="sp-success">
          <div className="sp-success-card">
            <div className="sp-success-badge">
              <div className="sp-success-pulse" />
              <CheckCircle2 size={42} />
            </div>

            <div className="sp-sparkles">
              <Sparkles size={14} />
              <Sparkles size={18} />
              <Sparkles size={14} />
              <Sparkles size={18} />
              <Sparkles size={14} />
            </div>

            <h1>{successTitle}</h1>
            <p>{successMessage}</p>

            <div className="sp-countdown">
              <div className="sp-countdown-ring">
                <svg viewBox="0 0 100 100">
                  <circle className="sp-ring-bg" cx="50" cy="50" r="46" />
                  <circle
                    className="sp-ring-fg"
                    cx="50" cy="50" r="46"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                  />
                </svg>
                <span className="sp-countdown-num">{countdown}</span>
              </div>
              <p className="sp-countdown-text">
                Redirection automatique dans <strong>{countdown}s</strong>
              </p>
            </div>

            <button className="sp-btn sp-btn-dark" onClick={() => navigate('/')}>
              Aller à l'accueil
            </button>
          </div>
        </div>
        <style>{baseStyles}</style>
        <style>{successStyles}</style>
      </div>
    );
  }

  // ---------- Main form ----------
  return (
    <div className="sp-page">
      <div className="sp-shell">
        {/* ============ ASIDE ============ */}
        <aside className="sp-aside">
          <div className="sp-aside-glow sp-glow-1" />
          <div className="sp-aside-glow sp-glow-2" />

          <div className="sp-aside-top">
            <div className="sp-logo-badge">
              <img src={logoImage} alt="Logo" />
            </div>
            <h1>Contrat de location</h1>
            <p className="sp-aside-sub">Signature électronique sécurisée</p>
          </div>

          <div className="sp-aside-info">
            <div className="sp-info-row">
              <div className="sp-info-icon"><User size={16} /></div>
              <div className="sp-info-text">
                <span>{isSecondDriver ? 'Deuxième conducteur' : 'Locataire'}</span>
                <strong>{tokenInfo?.client_name || '—'}</strong>
              </div>
            </div>

            {tokenInfo?.car && (
              <div className="sp-info-row">
                <div className="sp-info-icon"><Car size={16} /></div>
                <div className="sp-info-text">
                  <span>Véhicule</span>
                  <strong>{tokenInfo.car}</strong>
                </div>
              </div>
            )}

            <div className="sp-info-row">
              <div className="sp-info-icon"><UserCheck size={16} /></div>
              <div className="sp-info-text">
                <span>Rôle</span>
                <strong>{isSecondDriver ? '2ème conducteur' : 'Locataire principal'}</strong>
              </div>
            </div>
          </div>

          <div className="sp-aside-steps">
            <div className="sp-step done">
              <span className="sp-step-dot"><CheckCircle2 size={12} /></span>
              <span>Lien vérifié</span>
            </div>
            <div className="sp-step active">
              <span className="sp-step-dot">2</span>
              <span>Signature</span>
            </div>
            <div className="sp-step">
              <span className="sp-step-dot">3</span>
              <span>Confirmation</span>
            </div>
          </div>

          <div className="sp-aside-footer">
            <Lock size={13} />
            <span>Connexion sécurisée · Données chiffrées</span>
          </div>
        </aside>

        {/* ============ MAIN ============ */}
        <main className="sp-main">
          <div className="sp-main-header">
            <div className="sp-main-icon">
              <FileSignature size={22} />
            </div>
            <div>
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="sp-form">
            {/* Code */}
            <div className="sp-field">
              <label htmlFor="code">
                <Lock size={13} />
                Code de validation
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Entrez le code à 5 chiffres"
                className="sp-input"
              />
              <span className="sp-hint">
                Le code vous a été communiqué par l'agence.
              </span>
            </div>

            {/* Canvas */}
            <div className="sp-field">
              <label>
                <PenTool size={13} />
                Signature manuscrite
              </label>
              <div className={`sp-canvas-wrap ${!isCanvasEmpty ? 'has-sign' : ''}`}>
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="sp-canvas"
                />
                {isCanvasEmpty && (
                  <div className="sp-canvas-hint">
                    <PenTool size={22} />
                    <span>Signez ici avec votre doigt ou la souris</span>
                  </div>
                )}
                <span className="sp-corner tl" />
                <span className="sp-corner tr" />
                <span className="sp-corner bl" />
                <span className="sp-corner br" />
              </div>
              <div className="sp-canvas-footer">
                <span className="sp-canvas-status">
                  {!isCanvasEmpty
                    ? <><CheckCircle2 size={12} /> Signature détectée</>
                    : 'En attente de votre signature…'}
                </span>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="sp-btn-clear"
                  disabled={isCanvasEmpty}
                >
                  <Eraser size={14} />
                  Effacer
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !code || isCanvasEmpty}
              className="sp-btn sp-btn-primary"
            >
              {loading ? (
                <>
                  <Loader size={18} className="sp-spin" />
                  Envoi en cours…
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Valider la signature
                  <ChevronRight size={18} />
                </>
              )}
            </button>

            <p className="sp-legal">
              En signant, vous acceptez les termes du contrat de location.
            </p>
          </form>
        </main>
      </div>

      <style>{baseStyles}</style>
      <style>{formStyles}</style>
    </div>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const baseStyles = `
  .sp-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1.25rem;
    background:
      radial-gradient(1200px 600px at 0% 0%, rgba(245,158,11,0.10), transparent 55%),
      radial-gradient(1000px 500px at 100% 100%, rgba(30,41,59,0.08), transparent 55%),
      linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .sp-shell {
    display: grid;
    grid-template-columns: 0.95fr 1.15fr;
    max-width: 1080px;
    width: 100%;
    background: #ffffff;
    border-radius: 28px;
    overflow: hidden;
    box-shadow:
      0 40px 80px -30px rgba(15,23,42,0.28),
      0 15px 35px -20px rgba(15,23,42,0.15);
    border: 1px solid rgba(255,255,255,0.8);
  }

  .sp-shell-narrow {
    grid-template-columns: 1fr;
    max-width: 480px;
  }

  .sp-spin {
    animation: sp-spin 1s linear infinite;
  }
  @keyframes sp-spin {
    to { transform: rotate(360deg); }
  }

  /* ============ STATE (loading / error) ============ */
  .sp-state {
    padding: 3rem 2.25rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.85rem;
  }
  .sp-state h2 {
    margin: 0;
    font-size: 1.35rem;
    color: #0f172a;
    font-weight: 700;
  }
  .sp-state p {
    margin: 0;
    color: #64748b;
    font-size: 0.95rem;
    line-height: 1.5;
  }
  .sp-loader-ring {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 12px 28px -8px rgba(245,158,11,0.5);
    margin-bottom: 0.5rem;
  }
  .sp-state-icon.error {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ef4444, #f87171);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 12px 28px -8px rgba(239,68,68,0.5);
    margin-bottom: 0.5rem;
  }

  /* ============================================================
     SHARED BUTTONS (used by error + success + form screens)
     ============================================================ */
  .sp-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    padding: 0.9rem 1.4rem;
    border-radius: 14px;
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    border: none;
    transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease, background 0.2s ease;
    letter-spacing: 0.2px;
  }
  .sp-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }

  .sp-btn-primary {
    background: linear-gradient(135deg, #0b1220 0%, #1e293b 100%);
    color: #ffffff;
    box-shadow: 0 14px 30px -12px rgba(15,23,42,0.55);
    margin-top: 0.35rem;
  }
  .sp-btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 20px 40px -14px rgba(15,23,42,0.6);
  }
  .sp-btn-primary:active:not(:disabled) {
    transform: translateY(0);
  }

  .sp-btn-dark {
    background: linear-gradient(135deg, #0b1220 0%, #1e293b 100%);
    color: #ffffff;
    padding: 0.8rem 2rem;
    box-shadow: 0 12px 26px -10px rgba(15,23,42,0.5);
    margin-top: 0.5rem;
    min-width: 220px;
  }
  .sp-btn-dark:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 18px 34px -12px rgba(15,23,42,0.55);
  }

  .sp-btn-ghost {
    background: #f1f5f9;
    color: #334155;
    padding: 0.7rem 1.4rem;
    margin-top: 0.75rem;
    border: 1px solid #e2e8f0;
  }
  .sp-btn-ghost:hover:not(:disabled) {
    background: #e2e8f0;
    color: #0f172a;
    transform: translateY(-1px);
  }
`;

const formStyles = `
  /* ============ ASIDE ============ */
  .sp-aside {
    background: linear-gradient(165deg, #0b1220 0%, #1e293b 100%);
    color: #e2e8f0;
    padding: 2.25rem 2rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
    min-height: 560px;
  }
  .sp-aside-glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(70px);
    pointer-events: none;
  }
  .sp-glow-1 {
    width: 320px; height: 320px;
    top: -120px; right: -100px;
    background: radial-gradient(circle, rgba(245,158,11,0.35), transparent 70%);
  }
  .sp-glow-2 {
    width: 280px; height: 280px;
    bottom: -110px; left: -90px;
    background: radial-gradient(circle, rgba(59,130,246,0.25), transparent 70%);
  }

  .sp-aside-top { position: relative; z-index: 1; }

  .sp-logo-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.96);
    padding: 0.65rem 1rem;
    border-radius: 14px;
    margin-bottom: 1.5rem;
    box-shadow: 0 8px 24px -8px rgba(0,0,0,0.35);
  }
  .sp-logo-badge img {
    max-height: 44px;
    width: auto;
    display: block;
  }

  .sp-aside h1 {
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin: 0 0 0.4rem;
    color: #ffffff;
    line-height: 1.2;
  }
  .sp-aside-sub {
    color: #94a3b8;
    font-size: 0.9rem;
    margin: 0;
  }

  .sp-aside-info {
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    position: relative;
    z-index: 1;
  }
  .sp-info-row {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.75rem 0.9rem;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    backdrop-filter: blur(6px);
  }
  .sp-info-icon {
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    color: #1e293b;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sp-info-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .sp-info-text span {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #94a3b8;
    font-weight: 600;
  }
  .sp-info-text strong {
    color: #f1f5f9;
    font-size: 0.92rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sp-aside-steps {
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    position: relative;
    z-index: 1;
  }
  .sp-step {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 500;
    transition: color 0.3s ease;
  }
  .sp-step-dot {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    color: #94a3b8;
    flex-shrink: 0;
  }
  .sp-step.done { color: #cbd5e1; }
  .sp-step.done .sp-step-dot {
    background: rgba(16,185,129,0.15);
    border-color: rgba(16,185,129,0.4);
    color: #10b981;
  }
  .sp-step.active { color: #ffffff; font-weight: 600; }
  .sp-step.active .sp-step-dot {
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    border-color: transparent;
    color: #1e293b;
    box-shadow: 0 4px 12px -2px rgba(245,158,11,0.5);
  }

  .sp-aside-footer {
    margin-top: 2rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.72rem;
    color: #64748b;
    letter-spacing: 0.2px;
    position: relative;
    z-index: 1;
    padding-top: 1.25rem;
    border-top: 1px dashed rgba(255,255,255,0.08);
  }

  /* ============ MAIN ============ */
  .sp-main {
    padding: 2.5rem 2.5rem 2.25rem;
    display: flex;
    flex-direction: column;
    background: #ffffff;
  }

  .sp-main-header {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 1.75rem;
  }
  .sp-main-icon {
    flex-shrink: 0;
    width: 46px;
    height: 46px;
    border-radius: 14px;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    color: #b45309;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 16px -6px rgba(245,158,11,0.5);
  }
  .sp-main-header h2 {
    margin: 0 0 0.25rem;
    font-size: 1.35rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.4px;
    line-height: 1.25;
  }
  .sp-main-header p {
    margin: 0;
    font-size: 0.88rem;
    color: #64748b;
    line-height: 1.5;
  }

  .sp-form { display: flex; flex-direction: column; gap: 1.4rem; }

  .sp-field { display: flex; flex-direction: column; gap: 0.55rem; }
  .sp-field label {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #334155;
  }
  .sp-field label svg { color: #94a3b8; }

  .sp-input {
    width: 100%;
    padding: 0.85rem 1rem;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    font-size: 1rem;
    font-family: inherit;
    background: #f8fafc;
    color: #0f172a;
    letter-spacing: 2px;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .sp-input::placeholder {
    color: #94a3b8;
    letter-spacing: 0.5px;
    font-size: 0.9rem;
  }
  .sp-input:focus {
    outline: none;
    background: #ffffff;
    border-color: #f59e0b;
    box-shadow: 0 0 0 4px rgba(245,158,11,0.15);
  }
  .sp-hint {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 2px;
  }

  /* Canvas */
  .sp-canvas-wrap {
    position: relative;
    border: 2px dashed #cbd5e1;
    border-radius: 16px;
    overflow: hidden;
    background:
      repeating-linear-gradient(45deg, rgba(15,23,42,0.015) 0 10px, transparent 10px 20px),
      #fbfcfe;
    transition: border-color 0.25s, background 0.25s;
  }
  .sp-canvas-wrap.has-sign {
    border-style: solid;
    border-color: #10b981;
    background: #f0fdf4;
  }
  .sp-canvas {
    width: 100%;
    height: 220px;
    display: block;
    touch-action: none;
    cursor: crosshair;
    position: relative;
    z-index: 1;
  }
  .sp-canvas-hint {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: #94a3b8;
    font-size: 0.88rem;
    pointer-events: none;
    font-weight: 500;
  }
  .sp-canvas-hint svg {
    opacity: 0.7;
    animation: sp-float 3s ease-in-out infinite;
  }
  @keyframes sp-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }

  /* Corner markers */
  .sp-corner {
    position: absolute;
    width: 14px;
    height: 14px;
    border-color: #94a3b8;
    border-style: solid;
    border-width: 0;
    pointer-events: none;
    transition: border-color 0.25s;
  }
  .sp-corner.tl { top: 8px; left: 8px; border-top-width: 2px; border-left-width: 2px; border-top-left-radius: 4px; }
  .sp-corner.tr { top: 8px; right: 8px; border-top-width: 2px; border-right-width: 2px; border-top-right-radius: 4px; }
  .sp-corner.bl { bottom: 8px; left: 8px; border-bottom-width: 2px; border-left-width: 2px; border-bottom-left-radius: 4px; }
  .sp-corner.br { bottom: 8px; right: 8px; border-bottom-width: 2px; border-right-width: 2px; border-bottom-right-radius: 4px; }
  .sp-canvas-wrap.has-sign .sp-corner { border-color: #10b981; }

  .sp-canvas-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.6rem;
    gap: 1rem;
  }
  .sp-canvas-status {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.78rem;
    color: #94a3b8;
    font-weight: 500;
  }
  .sp-canvas-status svg { color: #10b981; }

  .sp-btn-clear {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.85rem;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.78rem;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }
  .sp-btn-clear:hover:not(:disabled) {
    background: #e2e8f0;
    color: #1e293b;
  }
  .sp-btn-clear:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .sp-legal {
    text-align: center;
    font-size: 0.72rem;
    color: #94a3b8;
    margin: 0;
    line-height: 1.5;
  }

  /* ============ RESPONSIVE ============ */
  @media (max-width: 900px) {
    .sp-shell { grid-template-columns: 1fr; }
    .sp-aside {
      min-height: auto;
      padding: 1.75rem 1.5rem;
    }
    .sp-aside h1 { font-size: 1.35rem; }
    .sp-aside-info { margin-top: 1.25rem; }
    .sp-aside-steps { flex-direction: row; flex-wrap: wrap; margin-top: 1.5rem; gap: 0.5rem; }
    .sp-step { font-size: 0.78rem; }
    .sp-step span:not(.sp-step-dot) { display: none; }
    .sp-aside-footer { margin-top: 1.25rem; }
    .sp-main { padding: 1.75rem 1.5rem 1.5rem; }
  }
  @media (max-width: 480px) {
    .sp-page { padding: 1rem; }
    .sp-shell { border-radius: 20px; }
    .sp-main-header h2 { font-size: 1.15rem; }
    .sp-canvas { height: 180px; }
    .sp-main-icon { width: 40px; height: 40px; }
  }
`;

const successStyles = `
  .sp-success {
    width: 100%;
    max-width: 520px;
    display: flex;
    justify-content: center;
  }
  .sp-success-card {
    width: 100%;
    background: #ffffff;
    border-radius: 28px;
    padding: 2.5rem 2.25rem 2rem;
    box-shadow:
      0 40px 80px -30px rgba(15,23,42,0.25),
      0 15px 35px -20px rgba(15,23,42,0.12);
    border: 1px solid rgba(255,255,255,0.8);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: sp-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes sp-fade-up {
    from { opacity: 0; transform: translateY(24px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .sp-success-badge {
    position: relative;
    width: 88px;
    height: 88px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #059669);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    box-shadow: 0 18px 40px -12px rgba(16,185,129,0.55);
    margin-bottom: 1.5rem;
    animation: sp-pop 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes sp-pop {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.12); }
    100% { transform: scale(1); opacity: 1; }
  }
  .sp-success-pulse {
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 2px solid rgba(16,185,129,0.35);
    animation: sp-pulse-ring 2.4s ease-out infinite;
  }
  @keyframes sp-pulse-ring {
    0% { transform: scale(0.9); opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
  }

  .sp-sparkles {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #fbbf24;
    margin-bottom: 1.25rem;
  }
  .sp-sparkles svg {
    animation: sp-sparkle 2s ease-in-out infinite;
  }
  .sp-sparkles svg:nth-child(1) { animation-delay: 0s; }
  .sp-sparkles svg:nth-child(2) { animation-delay: 0.2s; }
  .sp-sparkles svg:nth-child(3) { animation-delay: 0.4s; }
  .sp-sparkles svg:nth-child(4) { animation-delay: 0.6s; }
  .sp-sparkles svg:nth-child(5) { animation-delay: 0.8s; }
  @keyframes sp-sparkle {
    0%, 100% { transform: scale(1) rotate(0); opacity: 0.6; }
    50% { transform: scale(1.3) rotate(15deg); opacity: 1; }
  }

  .sp-success-card h1 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.4px;
    line-height: 1.25;
  }
  .sp-success-card > p {
    margin: 0 0 1.75rem;
    color: #64748b;
    font-size: 0.95rem;
    line-height: 1.55;
  }

  .sp-countdown {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1.75rem;
  }
  .sp-countdown-ring {
    position: relative;
    width: 84px;
    height: 84px;
    margin-bottom: 0.6rem;
  }
  .sp-countdown-ring svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }
  .sp-ring-bg {
    fill: none;
    stroke: #e2e8f0;
    stroke-width: 4;
  }
  .sp-ring-fg {
    fill: none;
    stroke: #10b981;
    stroke-width: 4;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.4s ease;
  }
  .sp-countdown-num {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 800;
    color: #0f172a;
  }
  .sp-countdown-text {
    margin: 0;
    font-size: 0.85rem;
    color: #64748b;
  }
  .sp-countdown-text strong {
    color: #10b981;
    font-weight: 700;
  }

  @media (max-width: 480px) {
    .sp-success-card { padding: 2rem 1.5rem 1.75rem; border-radius: 22px; }
    .sp-success-card h1 { font-size: 1.25rem; }
    .sp-success-badge { width: 72px; height: 72px; }
  }
`;