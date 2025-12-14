import { Link } from "react-router-dom";
import { IoCarSportOutline } from 'react-icons/io5';

const Footer = () => {
  return (
    <footer className="footer">
      <style>
        {`
          .footer {
            background: #ffffff;
            border-top: 2px solid #e5e7eb;
            margin-top: auto;
          }
          
          .footer-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 2rem;
          }
          
          .footer-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 3rem;
            padding: 3rem 0 2rem;
          }
          
          @media (min-width: 768px) {
            .footer-grid {
              grid-template-columns: 2fr 1fr 1fr;
              gap: 4rem;
            }
          }
          
          .footer-brand {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
          
          .footer-logo-section {
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          
          .footer-logo-icon {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .footer-car-icon {
            color: #dc2626;
            width: 100%;
            height: 100%;
            transition: all 0.3s ease;
          }
          
          .footer-logo-section:hover .footer-car-icon {
            color: #ef4444;
            transform: scale(1.1);
          }
          
          .footer-logo-text {
            background: linear-gradient(135deg, #dc2626, #991b1b);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-size: 1.8rem;
            font-weight: 800;
            letter-spacing: -0.5px;
            font-family: 'Inter', 'Arial', sans-serif;
          }
          
          .footer-description {
            color: #6b7280;
            font-size: 1rem;
            line-height: 1.6;
            max-width: 400px;
          }
          
          .footer-column {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          
          .footer-title {
            color: #000000;
            font-size: 1.1rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.5rem;
          }
          
          .footer-links {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .footer-link {
            color: #6b7280;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
            font-size: 1rem;
          }
          
          .footer-link:hover {
            color: #dc2626;
            transform: translateX(5px);
          }
          
          .footer-bottom {
            border-top: 1px solid #e5e7eb;
            padding: 2rem 0;
          }
          
          .footer-bottom-content {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            align-items: center;
            text-align: center;
          }
          
          @media (min-width: 768px) {
            .footer-bottom-content {
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
              text-align: left;
            }
          }
          
          .copyright {
            color: #6b7280;
            font-size: 0.9rem;
          }
          
          .footer-energy-badge {
            display: flex;
            justify-content: center;
          }
          
          .energy-badge {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 25px;
            position: relative;
          }
          
          .energy-pulse {
            width: 8px;
            height: 8px;
            background: #dc2626;
            border-radius: 50%;
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0% {
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
            }
            70% {
              transform: scale(1);
              box-shadow: 0 0 0 6px rgba(220, 38, 38, 0);
            }
            100% {
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
            }
          }
          
          .energy-text {
            color: #dc2626;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .legal-links {
            display: flex;
            gap: 1.5rem;
          }
          
          .legal-link {
            color: #6b7280;
            text-decoration: none;
            font-size: 0.9rem;
            transition: color 0.3s ease;
          }
          
          .legal-link:hover {
            color: #dc2626;
          }
          
          @media (max-width: 767px) {
            .legal-links {
              justify-content: center;
            }
          }
        `}
      </style>
      
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <div className="footer-logo-section">
              <div className="footer-logo-icon">
                <IoCarSportOutline className="footer-car-icon" size={40} />
              </div>
              <div className="footer-logo-text">Oulfa Drive</div>
            </div>
            <p className="footer-description">
              Premium car rental service offering the finest vehicles for your travel needs. 
              Experience luxury, comfort, and reliability with every journey.
            </p>
          </div>
          
          {/* Quick Links Column */}
          <div className="footer-column">
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/" className="footer-link">Home</Link></li>
              <li><Link to="/our-cars" className="footer-link">Our Cars</Link></li>
              <li><Link to="/about" className="footer-link">About Us</Link></li>
              <li><Link to="/contact" className="footer-link">Contact</Link></li>
            </ul>
          </div>
          
          {/* Support Column */}
          <div className="footer-column">
            <h3 className="footer-title">Support</h3>
            <ul className="footer-links">
              <li><Link to="/faq" className="footer-link">FAQ</Link></li>
              <li><Link to="/terms" className="footer-link">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="footer-link">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="copyright">
              <span>©2025 Oulfa Drive. All rights reserved.</span>
            </div>
            
            <div className="footer-energy-badge">
              <div className="energy-badge">
                <div className="energy-pulse"></div>
                <span className="energy-text">Premium Car Rental</span>
              </div>
            </div>
            
            <div className="legal-links">
              <Link to="/privacy" className="legal-link">Privacy Policy</Link>
              <Link to="/terms" className="legal-link">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;