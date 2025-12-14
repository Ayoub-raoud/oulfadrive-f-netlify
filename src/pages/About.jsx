import React from 'react';
import { FaCar, FaUsers, FaAward, FaMapMarkerAlt, FaPhone, FaEnvelope, FaShieldAlt, FaClock, FaHeart, FaStar } from 'react-icons/fa';

function AboutUs() {
    return (
        <div className="about-us-page">
            {/* Hero Section */}
            <section className="about-hero">
                <div className="hero-overlay">
                    <div className="hero-content">
                        <h1 className="hero-title">À Propos de Oulfa Drive</h1>
                        <p className="hero-subtitle">
                            Votre partenaire de confiance pour des services de location de voitures fiables et abordables. 
                            Découvrez des véhicules de qualité et un service client exceptionnel.
                        </p>
                        <div className="hero-stats">
                            <div className="stat-item">
                                <span className="stat-number">500+</span>
                                <span className="stat-label">Clients Satisfaits</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">50+</span>
                                <span className="stat-label">Véhicules</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">24/7</span>
                                <span className="stat-label">Support</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="about-content-wrapper">
                {/* Notre Histoire */}
                <section className="content-section">
                    <div className="section-header">
                        <div className="section-icon">
                            <FaCar />
                        </div>
                        <div className="section-title-content">
                            <h2 className="section-title">Notre Histoire</h2>
                            <p className="section-subtitle">Des débuts modestes à un partenaire de confiance</p>
                        </div>
                    </div>
                    <div className="section-content">
                        <p>
                            Oulfa Drive a été fondé avec une mission simple : rendre la location de voiture 
                            facile, abordable et fiable pour tous. Ce qui a commencé comme un petit service 
                            local est devenu un nom de confiance dans l'industrie de la location de voitures.
                        </p>
                        <p>
                            Nous comprenons que chaque voyage compte, qu'il s'agisse d'un voyage d'affaires, 
                            de vacances en famille ou de déplacements quotidiens. C'est pourquoi nous maintenons 
                            une flotte diversifiée de véhicules bien entretenus pour répondre à tous les besoins et budgets.
                        </p>
                    </div>
                </section>

                {/* Ce Que Nous Offrons */}
                <section className="content-section">
                    <div className="section-header">
                        <div className="section-icon">
                            <FaAward />
                        </div>
                        <div className="section-title-content">
                            <h2 className="section-title">Ce Que Nous Offrons</h2>
                            <p className="section-subtitle">Des solutions complètes pour tous vos besoins de location</p>
                        </div>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaCar />
                            </div>
                            <h3 className="feature-title">Véhicules de Qualité</h3>
                            <p className="feature-description">
                                Voitures bien entretenues régulièrement révisées pour votre sécurité et confort
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaShieldAlt />
                            </div>
                            <h3 className="feature-title">Assurance Complète</h3>
                            <p className="feature-description">
                                Options de couverture complète pour une tranquillité d'esprit totale
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaClock />
                            </div>
                            <h3 className="feature-title">Locations Flexibles</h3>
                            <p className="feature-description">
                                Options de location quotidiennes, hebdomadaires et mensuelles adaptées à votre emploi du temps
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaUsers />
                            </div>
                            <h3 className="feature-title">Client d'Abord</h3>
                            <p className="feature-description">
                                Équipe de support dédiée disponible pour vous assister 24h/24 et 7j/7
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaAward />
                            </div>
                            <h3 className="feature-title">Meilleurs Prix</h3>
                            <p className="feature-description">
                                Tarifs compétitifs sans frais cachés ni surprises
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaHeart />
                            </div>
                            <h3 className="feature-title">Programme de Fidélité</h3>
                            <p className="feature-description">
                                Avantages exclusifs et réductions pour nos clients réguliers
                            </p>
                        </div>
                    </div>
                </section>

                {/* Pourquoi Nous Choisir */}
                <section className="content-section">
                    <div className="section-header">
                        <div className="section-icon">
                            <FaUsers />
                        </div>
                        <div className="section-title-content">
                            <h2 className="section-title">Pourquoi Choisir Oulfa Drive</h2>
                            <p className="section-subtitle">La différence réside dans notre dévouement</p>
                        </div>
                    </div>
                    <div className="section-content">
                        <p>
                            Nous croyons en la construction de relations durables avec nos clients grâce à 
                            une tarification transparente, un service fiable et un engagement envers l'excellence. 
                            Notre équipe est passionnée par l'assurance que votre expérience de location est fluide 
                            et sans stress du début à la fin.
                        </p>
                        <p>
                            Avec Oulfa Drive, vous ne louez pas seulement une voiture - vous gagnez un 
                            partenaire de voyage de confiance dédié à rendre votre voyage mémorable.
                        </p>
                    </div>
                    <div className="values-grid">
                        <div className="value-item">
                            <div className="value-icon">
                                <FaStar />
                            </div>
                            <h4 className="value-title">Fiabilité</h4>
                            <p>Nos véhicules subissent des contrôles de maintenance rigoureux</p>
                        </div>
                        <div className="value-item">
                            <div className="value-icon">
                                <FaStar />
                            </div>
                            <h4 className="value-title">Transparence</h4>
                            <p>Aucun frais caché ou surprise</p>
                        </div>
                        <div className="value-item">
                            <div className="value-icon">
                                <FaStar />
                            </div>
                            <h4 className="value-title">Convenance</h4>
                            <p>Processus de réservation facile et options de retrait flexibles</p>
                        </div>
                    </div>
                </section>

                {/* Informations de Contact */}
                <section className="content-section">
                    <div className="section-header">
                        <div className="section-title-content">
                            <h2 className="section-title">Contactez-Nous</h2>
                            <p className="section-subtitle">Nous sommes là pour vous aider avec tous vos besoins de location de voiture</p>
                        </div>
                    </div>
                    <div className="contact-grid">
                        <div className="contact-card">
                            <div className="contact-icon">
                                <FaMapMarkerAlt />
                            </div>
                            <div className="contact-details">
                                <h3 className="contact-title">Visitez-Nous</h3>
                                <p className="contact-info">123 Quartier des Affaires</p>
                                <p className="contact-info">Centre-Ville, 10001</p>
                            </div>
                        </div>
                        <div className="contact-card">
                            <div className="contact-icon">
                                <FaPhone />
                            </div>
                            <div className="contact-details">
                                <h3 className="contact-title">Appelez-Nous</h3>
                                <p className="contact-info">+1 (555) 123-4567</p>
                                <p className="contact-info">Lun-Dim: 8h-22h</p>
                            </div>
                        </div>
                        <div className="contact-card">
                            <div className="contact-icon">
                                <FaEnvelope />
                            </div>
                            <div className="contact-details">
                                <h3 className="contact-title">Écrivez-Nous</h3>
                                <p className="contact-info">info@oulfadrive.com</p>
                                <p className="contact-info">support@oulfadrive.com</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <style jsx>{`
                .about-us-page {
                    min-height: 100vh;
                    background-color: #f8fafc;
                }

                /* Hero Section */
                .about-hero {
                    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
                    color: white;
                    padding: 6rem 2rem;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }

                .about-hero::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" fill="%23ffffff" opacity="0.1"><polygon points="1000,100 1000,0 0,100"></polygon></svg>');
                    background-size: cover;
                }

                .hero-overlay {
                    max-width: 1200px;
                    margin: 0 auto;
                    position: relative;
                    z-index: 1;
                }

                .hero-title {
                    font-size: 3.5rem;
                    font-weight: 800;
                    margin-bottom: 1.5rem;
                    letter-spacing: -0.5px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .hero-subtitle {
                    font-size: 1.3rem;
                    opacity: 0.95;
                    max-width: 700px;
                    margin: 0 auto 3rem;
                    line-height: 1.6;
                    font-weight: 400;
                }

                .hero-stats {
                    display: flex;
                    justify-content: center;
                    gap: 4rem;
                    flex-wrap: wrap;
                    margin-top: 3rem;
                }

                .stat-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 1.5rem;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .stat-number {
                    font-size: 2.8rem;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(135deg, #fff, #e2e8f0);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .stat-label {
                    font-size: 0.95rem;
                    opacity: 0.9;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    font-weight: 600;
                }

                /* Content Wrapper */
                .about-content-wrapper {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 5rem 2rem;
                }

                /* Content Sections */
                .content-section {
                    background: white;
                    border-radius: 20px;
                    padding: 3.5rem;
                    margin-bottom: 3rem;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    border: 1px solid #f1f5f9;
                }

                .content-section:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
                }

                .section-header {
                    display: flex;
                    align-items: flex-start;
                    margin-bottom: 2.5rem;
                    border-bottom: 2px solid #f1f5f9;
                    padding-bottom: 2rem;
                }

                .section-icon {
                    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                    color: white;
                    width: 70px;
                    height: 70px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 2rem;
                    font-size: 1.8rem;
                    flex-shrink: 0;
                }

                .section-title-content {
                    flex: 1;
                }

                .section-title {
                    font-size: 2.3rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin: 0 0 0.5rem 0;
                    line-height: 1.2;
                }

                .section-subtitle {
                    font-size: 1.2rem;
                    color: #64748b;
                    margin: 0;
                    font-weight: 500;
                }

                .section-content {
                    color: #475569;
                    line-height: 1.8;
                    font-size: 1.15rem;
                }

                .section-content p {
                    margin-bottom: 1.8rem;
                }

                /* Features Grid */
                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 2.5rem;
                    margin-top: 2.5rem;
                }

                .feature-card {
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border-radius: 16px;
                    padding: 2.5rem 2rem;
                    text-align: center;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    border: 1px solid #e2e8f0;
                    position: relative;
                    overflow: hidden;
                }

                .feature-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                    transform: scaleX(0);
                    transition: transform 0.3s ease;
                }

                .feature-card:hover {
                    background: white;
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    border-color: #3b82f6;
                }

                .feature-card:hover::before {
                    transform: scaleX(1);
                }

                .feature-icon {
                    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                    color: white;
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 2rem;
                    font-size: 2rem;
                    transition: all 0.3s ease;
                }

                .feature-card:hover .feature-icon {
                    transform: scale(1.1) rotate(5deg);
                }

                .feature-title {
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 1.2rem;
                }

                .feature-description {
                    color: #64748b;
                    line-height: 1.7;
                    font-size: 1.05rem;
                }

                /* Values Grid */
                .values-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 2.5rem;
                    margin-top: 3rem;
                }

                .value-item {
                    text-align: center;
                    padding: 2rem 1.5rem;
                    background: #f8fafc;
                    border-radius: 16px;
                    transition: all 0.3s ease;
                }

                .value-item:hover {
                    background: white;
                    transform: translateY(-5px);
                    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08);
                }

                .value-icon {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    font-size: 1.5rem;
                }

                .value-title {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: #10b981;
                    margin-bottom: 1rem;
                }

                .value-item p {
                    color: #64748b;
                    line-height: 1.7;
                    margin: 0;
                }

                /* Contact Grid */
                .contact-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2.5rem;
                    margin-top: 2.5rem;
                }

                .contact-card {
                    display: flex;
                    align-items: flex-start;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border-radius: 16px;
                    padding: 2.5rem 2rem;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    border: 1px solid #e2e8f0;
                }

                .contact-card:hover {
                    background: white;
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    border-color: #3b82f6;
                }

                .contact-icon {
                    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                    color: white;
                    width: 70px;
                    height: 70px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 2rem;
                    font-size: 1.8rem;
                    flex-shrink: 0;
                    transition: all 0.3s ease;
                }

                .contact-card:hover .contact-icon {
                    transform: scale(1.1);
                }

                .contact-title {
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 1rem;
                }

                .contact-info {
                    color: #64748b;
                    margin-bottom: 0.5rem;
                    font-size: 1.05rem;
                }

                /* Responsive Design */
                @media (max-width: 1024px) {
                    .hero-title {
                        font-size: 3rem;
                    }
                    
                    .features-grid {
                        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    }
                }

                @media (max-width: 768px) {
                    .about-hero {
                        padding: 4rem 1.5rem;
                    }
                    
                    .hero-title {
                        font-size: 2.5rem;
                    }
                    
                    .hero-subtitle {
                        font-size: 1.15rem;
                    }
                    
                    .hero-stats {
                        gap: 2rem;
                    }
                    
                    .stat-item {
                        padding: 1.2rem;
                    }
                    
                    .stat-number {
                        font-size: 2.2rem;
                    }
                    
                    .about-content-wrapper {
                        padding: 3rem 1.5rem;
                    }
                    
                    .content-section {
                        padding: 2.5rem;
                    }
                    
                    .section-header {
                        flex-direction: column;
                        text-align: center;
                    }
                    
                    .section-icon {
                        margin-right: 0;
                        margin-bottom: 1.5rem;
                    }
                    
                    .section-title {
                        font-size: 2rem;
                    }
                    
                    .features-grid {
                        grid-template-columns: 1fr;
                        gap: 2rem;
                    }
                    
                    .contact-card {
                        flex-direction: column;
                        text-align: center;
                    }
                    
                    .contact-icon {
                        margin-right: 0;
                        margin-bottom: 1.5rem;
                    }
                }

                @media (max-width: 480px) {
                    .hero-stats {
                        flex-direction: column;
                        gap: 1.5rem;
                        width: 100%;
                        max-width: 250px;
                        margin-left: auto;
                        margin-right: auto;
                    }
                    
                    .content-section {
                        padding: 2rem 1.5rem;
                    }
                    
                    .feature-card {
                        padding: 2rem 1.5rem;
                    }
                    
                    .contact-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}

export default AboutUs;