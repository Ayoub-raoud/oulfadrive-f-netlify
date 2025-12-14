import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createContact, selectContactsLoading, selectContactsError } from '../Redux/store';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaCheckCircle, FaPaperPlane } from 'react-icons/fa';

function Contact() {
    const dispatch = useDispatch();
    const loading = useSelector(selectContactsLoading);
    const error = useSelector(selectContactsError);

    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        phone: '',
        message: ''
    });

    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await dispatch(createContact(formData)).unwrap();
            setSubmitted(true);
            setFormData({
                fullname: '',
                email: '',
                phone: '',
                message: ''
            });
            setTimeout(() => setSubmitted(false), 5000);
        } catch (error) {
            console.error('Failed to submit contact form:', error);
        }
    };

    return (
        <div>
            <style>
                {`
                    .contact-section {
                        min-height: calc(100vh - 120px);
                        padding: 5rem 1rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .contact-container {
                        max-width: 1200px;
                        margin: 0 auto;
                        width: 100%;
                    }

                    .contact-content {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 2rem;
                        background: white;
                        border-radius: 16px;
                        
                        overflow: hidden;
                    }

                    @media (max-width: 968px) {
                        .contact-content {
                            grid-template-columns: 1fr;
                            gap: 0;
                        }
                    }

                    .contact-form-section {
                        padding: 3rem;
                    }

                    .contact-info-section {
                        padding: 3rem;
                        position: relative;
                    }

                    .section-title {
                        font-size: 2.25rem;
                        font-weight: 700;
                        margin-bottom: 0.75rem;
                        color: #1f2937;
                    }

                    .section-subtitle {
                        font-size: 1.1rem;
                        color: #6b7280;
                        margin-bottom: 2.5rem;
                        line-height: 1.6;
                    }

                    .info-title {
                        font-size: 1.75rem;
                        font-weight: 700;
                        margin-bottom: 1rem;
                        color: #1f2937;
                    }

                    .info-subtitle {
                        font-size: 1.1rem;
                        margin-bottom: 2.5rem;
                        color: #6b7280;
                        line-height: 1.6;
                    }

                    .form-group {
                        margin-bottom: 1.5rem;
                    }

                    .form-label {
                        display: block;
                        font-size: 0.9rem;
                        font-weight: 600;
                        color: #374151;
                        margin-bottom: 0.5rem;
                    }

                    .form-input {
                        width: 100%;
                        padding: 0.875rem 1rem;
                        border: 2px solid #e5e7eb;
                        border-radius: 10px;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                        background: #f9fafb;
                        font-family: inherit;
                    }

                    .form-input:focus {
                        outline: none;
                        border-color: #dc2626;
                        background: white;
                        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
                    }

                    .form-textarea {
                        resize: vertical;
                        min-height: 120px;
                    }

                    .submit-button {
                        width: 100%;
                        padding: 1rem 2rem;
                        background: #dc2626;
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                        margin-top: 1rem;
                    }

                    .submit-button:hover:not(:disabled) {
                        background: #b91c1c;
                        transform: translateY(-1px);
                        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
                    }

                    .submit-button:disabled {
                        background: #9ca3af;
                        cursor: not-allowed;
                        transform: none;
                    }

                    .success-message {
                        background: #10b981;
                        color: white;
                        padding: 1rem;
                        border-radius: 10px;
                        margin-bottom: 1.5rem;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        animation: slideIn 0.3s ease;
                    }

                    .error-message {
                        background: #ef4444;
                        color: white;
                        padding: 1rem;
                        border-radius: 10px;
                        margin-bottom: 1.5rem;
                        animation: slideIn 0.3s ease;
                    }

                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translateY(-10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    .contact-info-list {
                        display: flex;
                        flex-direction: column;
                        gap: 2rem;
                    }

                    .contact-info-item {
                        display: flex;
                        align-items: flex-start;
                        gap: 1rem;
                    }

                    .contact-info-icon {
                        font-size: 1.25rem;
                        color: #dc2626;
                        margin-top: 0.2rem;
                        flex-shrink: 0;
                    }

                    .contact-info-content {
                        flex: 1;
                    }

                    .contact-info-title {
                        font-size: 1.1rem;
                        font-weight: 600;
                        margin-bottom: 0.5rem;
                        color: #1f2937;
                    }

                    .contact-info-text {
                        color: #6b7280;
                        line-height: 1.5;
                    }

                    .contact-info-link {
                        color: #6b7280;
                        text-decoration: none;
                        transition: color 0.3s ease;
                    }

                    .contact-info-link:hover {
                        color: #dc2626;
                    }

                    .business-hours {
                        margin-top: 2rem;
                        padding-top: 2rem;
                        border-top: 1px solid #e5e7eb;
                    }

                    .hours-list {
                        display: flex;
                        flex-direction: column;
                        gap: 0.5rem;
                    }

                    .hour-item {
                        display: flex;
                        justify-content: space-between;
                        color: #6b7280;
                    }

                    .hour-day {
                        font-weight: 500;
                    color: #374151;
                    }

                    .hour-time {
                        font-weight: 600;
                        color: #1f2937;
                    }

                    .map-placeholder {
                        margin-top: 2rem;
                        background: #f1f5f9;
                        border-radius: 10px;
                        padding: 2rem;
                        text-align: center;
                        border: 2px dashed #cbd5e1;
                    }

                    .map-text {
                        color: #64748b;
                        font-size: 0.9rem;
                        margin-top: 0.5rem;
                    }

                    .loading-spinner {
                        display: inline-block;
                        width: 20px;
                        height: 20px;
                        border: 2px solid transparent;
                        border-top: 2px solid white;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }

                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }

                    @media (max-width: 768px) {
                        .contact-section {
                            padding-top: 4rem;
                            min-height: calc(100vh - 100px);
                        }

                        .contact-form-section,
                        .contact-info-section {
                            padding: 2rem 1.5rem;
                        }

                        .section-title {
                            font-size: 1.875rem;
                        }

                        .info-title {
                            font-size: 1.5rem;
                        }
                    }

                    @media (max-width: 480px) {
                        .contact-form-section,
                        .contact-info-section {
                            padding: 1.5rem 1rem;
                        }

                        .section-title {
                            font-size: 1.625rem;
                            margin-bottom: 0.5rem;
                        }

                        .info-title {
                            font-size: 1.375rem;
                        }

                        .section-subtitle,
                        .info-subtitle {
                            font-size: 1rem;
                            margin-bottom: 2rem;
                        }
                    }
                `}
            </style>

            <section className="contact-section">
                <div className="contact-container">
                    <div className="contact-content">
                        {/* Contact Form Section */}
                        <div className="contact-form-section">
                            <h2 className="section-title">Contactez-Nous</h2>
                            <p className="section-subtitle">
                                Des questions sur nos services de location de voitures ? Nous sommes là pour vous aider ! 
                                Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
                            </p>

                            {submitted && (
                                <div className="success-message">
                                    <FaCheckCircle />
                                    Merci pour votre message ! Nous vous répondrons dans les 24 heures.
                                </div>
                            )}

                            {error && (
                                <div className="error-message">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="fullname" className="form-label">
                                        Nom Complet *
                                    </label>
                                    <input
                                        type="text"
                                        id="fullname"
                                        name="fullname"
                                        value={formData.fullname}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="Entrez votre nom complet"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email" className="form-label">
                                        Adresse Email *
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="Entrez votre adresse email"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone" className="form-label">
                                        Numéro de Téléphone *
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="Entrez votre numéro de téléphone"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="message" className="form-label">
                                        Message *
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="form-input form-textarea"
                                        placeholder="Parlez-nous de vos besoins en location de voiture, questions ou préoccupations..."
                                        required
                                        minLength="10"
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="submit-button"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className="loading-spinner"></div>
                                            Envoi en cours...
                                        </>
                                    ) : (
                                        <>
                                            <FaPaperPlane />
                                            Envoyer le Message
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Contact Information Section */}
                        <div className="contact-info-section">
                            <h3 className="info-title">Informations de Contact</h3>
                            <p className="info-subtitle">
                                Contactez-nous par l'un des canaux suivants. 
                                Nous sommes toujours heureux de vous aider avec vos besoins de location de voiture.
                            </p>

                            <div className="contact-info-list">
                                <div className="contact-info-item">
                                    <FaPhone className="contact-info-icon" />
                                    <div className="contact-info-content">
                                        <h4 className="contact-info-title">Téléphone</h4>
                                        <p className="contact-info-text">
                                            <a href="tel:+212522123456" className="contact-info-link">
                                                +212 522 123 456
                                            </a>
                                            <br />
                                            <a href="tel:+212522123457" className="contact-info-link">
                                                +212 522 123 457
                                            </a>
                                        </p>
                                    </div>
                                </div>

                                <div className="contact-info-item">
                                    <FaEnvelope className="contact-info-icon" />
                                    <div className="contact-info-content">
                                        <h4 className="contact-info-title">Email</h4>
                                        <p className="contact-info-text">
                                            <a href="mailto:info@oulfadrive.com" className="contact-info-link">
                                                info@oulfadrive.com
                                            </a>
                                            <br />
                                            <a href="mailto:support@oulfadrive.com" className="contact-info-link">
                                                support@oulfadrive.com
                                            </a>
                                        </p>
                                    </div>
                                </div>

                                <div className="contact-info-item">
                                    <FaMapMarkerAlt className="contact-info-icon" />
                                    <div className="contact-info-content">
                                        <h4 className="contact-info-title">Adresse</h4>
                                        <p className="contact-info-text">
                                            123 Avenue Hassan II<br />
                                            Casablanca 20000, Maroc
                                        </p>
                                    </div>
                                </div>

                                <div className="contact-info-item">
                                    <FaClock className="contact-info-icon" />
                                    <div className="contact-info-content">
                                        <h4 className="contact-info-title">Heures d'Ouverture</h4>
                                        <div className="business-hours">
                                            <div className="hours-list">
                                                <div className="hour-item">
                                                    <span className="hour-day">Lundi - Vendredi</span>
                                                    <span className="hour-time">8h00 - 20h00</span>
                                                </div>
                                                <div className="hour-item">
                                                    <span className="hour-day">Samedi</span>
                                                    <span className="hour-time">9h00 - 18h00</span>
                                                </div>
                                                <div className="hour-item">
                                                    <span className="hour-day">Dimanche</span>
                                                    <span className="hour-time">10h00 - 16h00</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="map-placeholder">
                                <FaMapMarkerAlt size={32} color="#dc2626" />
                                <p className="map-text">
                                    Notre bureau principal est situé au cœur de Casablanca, 
                                    facilement accessible depuis tous les principaux pôles de transport.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Contact;