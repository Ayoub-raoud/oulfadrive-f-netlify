import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaTrash, FaDatabase, FaEnvelope,
  FaPhone, FaUser, FaExclamationTriangle, FaCheck, FaTimes
} from 'react-icons/fa';
import {
  fetchContacts,
  deleteContact,
  selectContacts,
  selectContactsLoading
} from '../Redux/store';

const ContactsManagement = () => {
  const dispatch = useDispatch();
  const contacts = useSelector(selectContacts);
  const loading = useSelector(selectContactsLoading);
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({
    type: '',
    title: '',
    message: '',
    contact: null,
    onConfirm: null
  });

  useEffect(() => {
    dispatch(fetchContacts());
  }, [dispatch]);

  const showDeleteConfirmation = (contact) => {
    setConfirmationConfig({
      type: 'delete',
      title: 'Supprimer le message de contact',
      message: `Êtes-vous sûr de vouloir supprimer le message de "${contact.fullname}" ? Cette action ne peut pas être annulée.`,
      contact: contact,
      onConfirm: () => confirmDelete(contact.id)
    });
    setShowConfirmation(true);
  };

  const confirmDelete = async (id) => {
    try {
      await dispatch(deleteContact(id)).unwrap();
      setShowConfirmation(false);
      showSuccessMessage('Message de contact supprimé avec succès !');
    } catch (error) {
      showErrorMessage('Erreur lors de la suppression du message : ' + error);
    }
  };

  const showSuccessMessage = (message) => {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <FaCheck class="notification-icon" />
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const showErrorMessage = (message) => {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <FaTimes class="notification-icon" />
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  };

  const getContactStats = () => {
    const totalContacts = contacts.length;
    const contactsWithEmail = contacts.filter(contact => contact.email && contact.email.includes('@')).length;
    const contactsWithPhone = contacts.filter(contact => contact.phone && contact.phone.length >= 8).length;
    
    return { totalContacts, contactsWithEmail, contactsWithPhone };
  };

  const stats = getContactStats();

  const getInitials = (contact) => {
    return `${contact.fullname?.[0] || ''}${contact.fullname?.split(' ')[1]?.[0] || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="contacts-management loading-spinner">
        <div className="spinner"></div>
        <p>Chargement des contacts...</p>
      </div>
    );
  }

  return (
    <div className="contacts-management">
      <div className="section-header">
        <div className="header-content">
          <h1 className="section-title">
            <FaEnvelope className="title-icon" />
            Gestion des messages de contact
          </h1>
          <p className="section-subtitle">Gérez et consultez les messages de contact des clients</p>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-content">
            <div className="stat-number">{stats.totalContacts}</div>
            <div className="stat-label">Messages totaux</div>
          </div>
          <FaEnvelope className="stat-icon" />
        </div>
        <div className="stat-card stat-email">
          <div className="stat-content">
            <div className="stat-number">{stats.contactsWithEmail}</div>
            <div className="stat-label">Avec email</div>
          </div>
          <FaUser className="stat-icon" />
        </div>
        <div className="stat-card stat-phone">
          <div className="stat-content">
            <div className="stat-number">{stats.contactsWithPhone}</div>
            <div className="stat-label">Avec téléphone</div>
          </div>
          <FaPhone className="stat-icon" />
        </div>
      </div>

      <div className="content-container">
        {contacts.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Message</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(contact => (
                <tr key={contact.id}>
                  <td className="contact-id">#{contact.id}</td>
                  <td className="contact-name">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="contact-avatar">
                        {getInitials(contact)}
                      </div>
                      <div>
                        <strong>{contact.fullname}</strong>
                      </div>
                    </div>
                  </td>
                  <td className="email-cell">{contact.email}</td>
                  <td className="phone-cell">{contact.phone}</td>
                  <td className="message-cell" title={contact.message}>
                    {contact.message.length > 50 ? `${contact.message.substring(0, 50)}...` : contact.message}
                  </td>
                  <td className="date-cell">
                    {new Date(contact.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn delete" 
                        onClick={() => showDeleteConfirmation(contact)}
                        title="Supprimer"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">
            <FaDatabase size={48} />
            <p>Aucun message de contact trouvé</p>
          </div>
        )}
      </div>

      {/* Modal de confirmation */}
      {showConfirmation && (
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <div className="confirmation-header">
              <div className={`confirmation-icon ${confirmationConfig.type}`}>
                <FaExclamationTriangle />
              </div>
              <h3 className="confirmation-title">{confirmationConfig.title}</h3>
            </div>
            
            <div className="confirmation-body">
              <p className="confirmation-message">{confirmationConfig.message}</p>
              
              {confirmationConfig.contact && (
                <div className="contact-preview">
                  <div className="contact-avatar-preview">
                    {getInitials(confirmationConfig.contact)}
                  </div>
                  <div className="contact-info-preview">
                    <h4>{confirmationConfig.contact.fullname}</h4>
                    <div className="contact-meta-preview">
                      <div><FaEnvelope /> {confirmationConfig.contact.email}</div>
                      <div><FaPhone /> {confirmationConfig.contact.phone}</div>
                      <div className="message-preview">
                        {confirmationConfig.contact.message.length > 100 
                          ? `${confirmationConfig.contact.message.substring(0, 100)}...`
                          : confirmationConfig.contact.message
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="confirmation-actions">
              <button 
                className="btn-confirm-cancel"
                onClick={() => setShowConfirmation(false)}
              >
                Annuler
              </button>
              <button 
                className={`btn-confirm-${confirmationConfig.type}`}
                onClick={confirmationConfig.onConfirm}
              >
                Supprimer le message
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .contacts-management {
          padding: 2rem;
          min-height: 100vh;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        }

        /* Loading Spinner */
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 3px solid #e9ecef;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Section Header */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          background: white;
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
        }

        .header-content {
          flex: 1;
        }

        .section-title {
          display: flex;
          align-items: center;
          font-size: 2rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 0.5rem 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .title-icon {
          margin-right: 0.75rem;
          font-size: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .section-subtitle {
          color: #6c757d;
          font-size: 1.1rem;
          margin: 0;
          font-weight: 400;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
        }

        .stat-total::before { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .stat-email::before { background: linear-gradient(135deg, #4CAF50, #45a049); }
        .stat-phone::before { background: linear-gradient(135deg, #2196F3, #0b7dda); }

        .stat-content {
          flex: 1;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 0.25rem;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #6c757d;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-icon {
          font-size: 2rem;
          opacity: 0.1;
          color: #1a1a1a;
        }

        /* Content Container */
        .content-container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.2);
        }

        /* Table Styles */
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .data-table th {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 1rem 1.25rem;
          text-align: left;
          font-weight: 600;
          color: #2c3e50;
          border-bottom: 2px solid #e9ecef;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .data-table td {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #f8f9fa;
          color: #495057;
        }

        .data-table tr:hover {
          background: #f8f9fa;
        }

        .contact-id {
          font-weight: 600;
          color: #6c757d;
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .contact-name {
          font-weight: 600;
          color: #2c3e50;
        }

        .email-cell {
          color: #007bff;
        }

        .phone-cell {
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .message-cell {
          max-width: 200px;
          cursor: help;
        }

        .date-cell {
          color: #6c757d;
          white-space: nowrap;
        }

        /* Contact Avatar */
        .contact-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn.delete {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          border: 1px solid rgba(220, 53, 69, 0.2);
          padding: 0.5rem;
          width: 36px;
          height: 36px;
          justify-content: center;
          display: flex;
          align-items: center;
          border: none;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
        }

        .action-btn.delete:hover {
          background: #dc3545;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
        }

        /* Empty State */
        .no-data {
          text-align: center;
          padding: 4rem 2rem;
          color: #6c757d;
        }

        .no-data svg {
          margin-bottom: 1.5rem;
          opacity: 0.3;
          color: #667eea;
        }

        .no-data p {
          font-size: 1.1rem;
          color: #495057;
          margin: 0 0 2rem 0;
        }

        /* Success and Error Notifications */
        .success-notification, .error-notification {
          position: fixed;
          top: 2rem;
          right: 2rem;
          z-index: 1001;
          animation: slideInRight 0.3s ease-out;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .success-notification .notification-content {
          background: #d4edda;
          color: #155724;
          padding: 1rem 1.5rem;
          border-radius: 10px;
          border: 1px solid #c3e6cb;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        }

        .error-notification .notification-content {
          background: #f8d7da;
          color: #721c24;
          padding: 1rem 1.5rem;
          border-radius: 10px;
          border: 1px solid #f5c6cb;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
        }

        .notification-icon {
          font-size: 1.1rem;
        }

        /* Confirmation Modal */
        .confirmation-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          backdrop-filter: blur(5px);
        }

        .confirmation-modal {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 480px;
          width: 100%;
          overflow: hidden;
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .confirmation-header {
          padding: 2rem 2rem 1rem;
          text-align: center;
          border-bottom: 1px solid #f1f3f4;
        }

        .confirmation-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          font-size: 2rem;
        }

        .confirmation-icon.delete {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          border: 2px solid rgba(220, 53, 69, 0.2);
        }

        .confirmation-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        .confirmation-body {
          padding: 1.5rem 2rem;
        }

        .confirmation-message {
          color: #6c757d;
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .contact-preview {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }

        .contact-avatar-preview {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .contact-info-preview {
          flex: 1;
        }

        .contact-info-preview h4 {
          margin: 0 0 0.5rem 0;
          color: #1a1a1a;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .contact-meta-preview {
          color: #6c757d;
          font-size: 0.875rem;
        }

        .contact-meta-preview div {
          margin-bottom: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .message-preview {
          margin-top: 0.5rem;
          padding: 0.75rem;
          background: white;
          border-radius: 8px;
          border-left: 4px solid #667eea;
          font-style: italic;
          color: #495057;
        }

        .confirmation-actions {
          padding: 1.5rem 2rem 2rem;
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn-confirm-cancel {
          padding: 0.75rem 1.5rem;
          border: 1px solid #6c757d;
          background: transparent;
          color: #6c757d;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-confirm-cancel:hover {
          background: #6c757d;
          color: white;
        }

        .btn-confirm-delete {
          padding: 0.75rem 1.5rem;
          border: none;
          background: #dc3545;
          color: white;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
        }

        .btn-confirm-delete:hover {
          background: #c82333;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .contacts-management {
            padding: 1rem;
          }

          .section-header {
            flex-direction: column;
            gap: 1rem;
            padding: 1.5rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .content-container {
            overflow-x: auto;
          }

          .data-table {
            min-width: 800px;
          }

          .action-buttons {
            flex-direction: row;
            gap: 0.25rem;
          }

          .confirmation-modal {
            margin: 1rem;
          }

          .confirmation-actions {
            flex-direction: column;
          }

          .contact-preview {
            flex-direction: column;
            text-align: center;
            align-items: center;
          }

          .success-notification, .error-notification {
            right: 1rem;
            left: 1rem;
            top: 1rem;
          }
        }

        @media (max-width: 480px) {
          .confirmation-header {
            padding: 1.5rem 1rem 1rem;
          }

          .confirmation-body {
            padding: 1rem 1rem 1.5rem;
          }

          .confirmation-actions {
            padding: 1rem 1rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ContactsManagement;