import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaPlus, FaEdit, FaTrash, FaFileExport, FaDatabase, FaSpinner,
  FaSearch, FaFilter, FaChevronLeft, FaChevronRight, FaExclamationTriangle,
  FaCalendarAlt, FaCar, FaUser, FaMoneyBill, FaRedo, FaUserTie, FaCircle, 
  FaInfoCircle, FaFilePdf, FaDownload, FaEye, FaChevronDown, FaChevronUp,
  FaInfo, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCarCrash, FaClock,
  FaCalendarDay, FaArrowLeft, FaCheck, FaTimes
} from 'react-icons/fa';
import {
  fetchAccidents,
  createAccident,
  updateAccident,
  deleteAccident,
  selectAccidents,
  selectAccidentsLoading,
  fetchMatricules,
  updateMatriculeStatus,
  selectClients,
  selectCars
} from '../Redux/store';
import AdminModal from './AdminModal';

const AccidentsManagement = () => {
  const dispatch = useDispatch();
  const accidents = useSelector(selectAccidents);
  const loading = useSelector(selectAccidentsLoading);
  const matricules = useSelector(state => state.matricules.list);
  const clients = useSelector(selectClients);
  const cars = useSelector(selectCars);
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingType, setDownloadingType] = useState('');
  const [downloadingIndex, setDownloadingIndex] = useState(0);

  // États de recherche et filtre
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // États pour la vue détaillée
  const [selectedAccident, setSelectedAccident] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [documentsExpanded, setDocumentsExpanded] = useState(true);

  useEffect(() => {
    dispatch(fetchAccidents());
    dispatch(fetchMatricules());
  }, [dispatch]);

  // Fonction pour télécharger un document d'accident
  const handleDownloadAccidentDocument = async (accidentId, documentType, documentName, fileIndex = 0) => {
    if (!accidentId || !documentType) {
      showErrorMessage('Informations de téléchargement incomplètes');
      return;
    }

    setDownloading(true);
    setDownloadingType(documentType);
    setDownloadingIndex(fileIndex);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Non autorisé. Veuillez vous reconnecter.');
      }

      // Récupérer l'accident pour obtenir l'URL du fichier
      const accident = accidents.find(a => a.id === accidentId);
      if (!accident) {
        throw new Error('Accident non trouvé');
      }

      const files = accident[documentType];
      if (!files || !Array.isArray(files) || files.length <= fileIndex) {
        throw new Error('Document non trouvé');
      }

      const fileUrl = files[fileIndex];
      
      // Vérifier si c'est une URL base64
      if (fileUrl && fileUrl.startsWith('data:')) {
        // Télécharger directement le base64
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // Extraire l'extension du fichier
        const mimeType = fileUrl.split(';')[0].split(':')[1];
        let extension = 'png';
        if (mimeType.includes('pdf')) extension = 'pdf';
        else if (mimeType.includes('jpeg')) extension = 'jpg';
        else if (mimeType.includes('gif')) extension = 'gif';
        
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = `${documentName}_${accidentId}_${fileIndex + 1}.${extension}`;
        downloadLink.style.display = 'none';
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Nettoyer après un certain temps
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 100);
        
        // Ouvrir dans un nouvel onglet
        setTimeout(() => {
          const viewBlobUrl = URL.createObjectURL(blob);
          window.open(viewBlobUrl, '_blank');
          
          setTimeout(() => {
            URL.revokeObjectURL(viewBlobUrl);
          }, 5000);
        }, 500);
        
        showSuccessMessage('Document téléchargé avec succès !');
      } else {
        // Télécharger depuis l'API Laravel
        const apiUrl = `https://oulfa-back-production.up.railway.app/accidents/${accidentId}/download/${documentType}?index=${fileIndex}`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }

        const blob = await response.blob();
        
        if (!blob || blob.size === 0) {
          throw new Error('Document vide ou non disponible');
        }

        // Récupérer le nom de fichier
        let filename = `${documentName}_${accidentId}_${fileIndex + 1}.pdf`;
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const matches = contentDisposition.match(/filename="?([^"]+)"?/);
          if (matches && matches[1]) {
            filename = matches[1];
          }
        }

        // Créer blob URL pour téléchargement
        const blobUrl = URL.createObjectURL(blob);
        
        // Créer lien de téléchargement
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = filename;
        downloadLink.style.display = 'none';
        
        // Déclencher le téléchargement
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Nettoyer blob URL
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 100);

        // Ouvrir dans un nouvel onglet
        setTimeout(() => {
          const viewBlobUrl = URL.createObjectURL(blob);
          window.open(viewBlobUrl, '_blank');
          
          setTimeout(() => {
            URL.revokeObjectURL(viewBlobUrl);
          }, 5000);
        }, 500);

        showSuccessMessage(`${filename} téléchargé avec succès !`);
      }

    } catch (error) {
      console.error('Download error:', error);
      showErrorMessage('Erreur de téléchargement: ' + error.message);
    } finally {
      setTimeout(() => {
        setDownloading(false);
        setDownloadingType('');
        setDownloadingIndex(0);
      }, 500);
    }
  };

  // Fonction pour visualiser un document
  const handleViewAccidentDocument = async (accidentId, documentType, documentName, fileIndex = 0, fileUrl = null) => {
    if (!fileUrl) {
      // If no direct URL, get it from accident data
      const accident = accidents.find(a => a.id === accidentId);
      if (!accident) {
        showErrorMessage('Accident non trouvé');
        return;
      }
      
      const files = accident[documentType];
      if (!files || !Array.isArray(files) || files.length <= fileIndex) {
        showErrorMessage('Document non trouvé');
        return;
      }
      
      fileUrl = files[fileIndex];
    }

    if (!fileUrl) {
      showErrorMessage('Aucun document disponible');
      return;
    }

    try {
      if (fileUrl.startsWith('data:')) {
        // For base64 data URLs, open directly
        const newWindow = window.open('', '_blank');
        if (!newWindow) {
          throw new Error('Popup bloquée. Veuillez autoriser les popups pour ce site.');
        }
        
        if (fileUrl.includes('pdf')) {
          newWindow.document.write(`
            <html>
              <head>
                <title>Document PDF</title>
                <style>
                  body { margin: 0; padding: 0; background: #f0f0f0; }
                  iframe { width: 100%; height: 100vh; border: none; }
                </style>
              </head>
              <body>
                <iframe src="${fileUrl}"></iframe>
              </body>
            </html>
          `);
        } else {
          newWindow.document.write(`
            <html>
              <head>
                <title>Document Image</title>
                <style>
                  body { 
                    margin: 0; 
                    padding: 20px; 
                    background: #f0f0f0; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    min-height: 100vh;
                  }
                  img { 
                    max-width: 90%; 
                    max-height: 90vh; 
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                  }
                </style>
              </head>
              <body>
                <img src="${fileUrl}" alt="Document" />
              </body>
            </html>
          `);
        }
        newWindow.document.close();
      } else {
        // For stored files, use the API endpoint
        const token = localStorage.getItem('authToken');
        const apiUrl = `https://oulfa-back-production.up.railway.app/accidents/${accidentId}/download/${documentType}?index=${fileIndex}`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 5000);
      }
      
      showSuccessMessage('Document ouvert dans un nouvel onglet');
    } catch (error) {
      console.error('Error opening document:', error);
      showErrorMessage('Impossible d\'ouvrir le document: ' + error.message);
    }
  };

  // Fonction alternative pour visualiser les images (version modale)
  const handleViewImageModal = (url, isPdf = false) => {
    if (!url) {
      showErrorMessage('Aucune image disponible');
      return;
    }
    
    // Nettoyer les anciennes modales
    const existingModals = document.querySelectorAll('.image-modal-overlay');
    existingModals.forEach(modal => modal.remove());
    
    // Créer une modale
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'image-modal-overlay';
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      cursor: pointer;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      position: relative;
      max-width: 95%;
      max-height: 95%;
      background: white;
      border-radius: 12px;
      padding: 10px;
    `;
    
    let contentElement;
    
    if (isPdf) {
      // Pour les PDF
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.cssText = `
        width: 800px;
        height: 600px;
        border: none;
        border-radius: 8px;
      `;
      contentElement = iframe;
    } else {
      // Pour les images
      const img = document.createElement('img');
      img.src = url;
      img.style.cssText = `
        max-width: 100%;
        max-height: 85vh;
        object-fit: contain;
        border-radius: 8px;
        display: block;
        margin: 0 auto;
      `;
      
      // Gérer les erreurs de chargement d'image
      img.onerror = () => {
        img.src = 'https://via.placeholder.com/800x600?text=Image+Non+Disponible';
        img.onerror = null;
      };
      
      contentElement = img;
    }
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.3s;
      z-index: 10000;
    `;
    
    closeBtn.onmouseover = () => closeBtn.style.background = '#c82333';
    closeBtn.onmouseout = () => closeBtn.style.background = '#dc3545';
    
    const closeModal = () => {
      modalOverlay.remove();
    };
    
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeModal();
    };
    
    modalOverlay.onclick = (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    };
    
    modalContent.appendChild(contentElement);
    modalContent.appendChild(closeBtn);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    // Ajouter un écouteur pour la touche Échap
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscKey);
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    
    modalOverlay.addEventListener('click', () => {
      document.removeEventListener('keydown', handleEscKey);
    }, { once: true });
  };

  // Fonctions pour la vue détaillée
  const handleViewDetails = (accident) => {
    setSelectedAccident(accident);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedAccident(null);
    setDocumentsExpanded(true);
  };

  // Fonctions d'aide pour les dates
  const isToday = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isThisWeek = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    return date >= startOfWeek && date <= endOfWeek;
  };

  const isThisMonth = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  // Configuration des statuts
  const statusConfig = {
    pending: { color: '#ffc107', label: 'En Attente', description: 'Déclaration initiale d\'accident' },
    evaluation_owner: { color: '#17a2b8', label: 'Évaluation Propriétaire', description: 'En cours d\'évaluation par le propriétaire' },
    'contact expert': { color: '#6f42c1', label: 'Contact Expert', description: 'Consultation d\'expert requise' },
    evaluation_expert: { color: '#fd7e14', label: 'Évaluation Expert', description: 'En cours d\'évaluation par l\'expert' },
    fixed: { color: '#28a745', label: 'Réparé', description: 'Véhicule réparé' },
    waiting: { color: '#6c757d', label: 'En Attente', description: 'En attente de finalisation' },
    completed: { color: '#20c997', label: 'Terminé', description: 'Dossier d\'accident clôturé' }
  };

  // Badges pour le type d'accident et le type de procédure
  const getAccidentTypeBadge = (accident) => {
    const typeConfig = {
      grave: { class: 'accident-type-badge grave', text: 'Grave', icon: FaExclamationTriangle },
      non_grave: { class: 'accident-type-badge non-grave', text: 'Non-Grave', icon: FaInfoCircle }
    };

    const procedureConfig = {
      classic: { class: 'procedure-badge classic', text: 'Classique' },
      forphie: { class: 'procedure-badge forphie', text: 'Forphie' }
    };

    const type = typeConfig[accident.accident_type] || typeConfig.grave;
    const procedure = procedureConfig[accident.procedure_type] || procedureConfig.classic;

    return (
      <div className="accident-classification">
        <span className={type.class}>
          <type.icon className="type-icon" />
          {type.text}
        </span>
        <span className={procedure.class}>
          {procedure.text}
        </span>
      </div>
    );
  };

  // Fonction pour afficher les documents d'un accident
  const renderAccidentDocuments = (accident) => {
    const documentTypes = [
      { key: 'img_accident', label: 'Scène d\'Accident', icon: FaExclamationTriangle },
      { key: 'img_evaluation_expert', label: 'Évaluation Expert', icon: FaUserTie },
      { key: 'img_fixed', label: 'Véhicule Réparé', icon: FaCar },
      { key: 'image_facture', label: 'Facture', icon: FaMoneyBill }
    ];

    return (
      <div className="accident-documents-preview">
        <div className="documents-header">
          <h4>Documents de l'Accident</h4>
          <button 
            className="btn-toggle-documents"
            onClick={() => setDocumentsExpanded(!documentsExpanded)}
          >
            {documentsExpanded ? <FaChevronUp /> : <FaChevronDown />}
            {documentsExpanded ? 'Réduire' : 'Développer'}
          </button>
        </div>
        
        {documentsExpanded && (
          <div className="document-grid">
            {documentTypes.map(docType => {
              const files = accident[docType.key];
              const isPdfArray = accident[`${docType.key}_is_pdf`] || [];
              const fileUrls = accident[`${docType.key}_urls`] || [];
              
              if (!files || !Array.isArray(files) || files.length === 0) {
                return (
                  <div key={docType.key} className="document-preview-item empty">
                    <div className="document-header">
                      <docType.icon className="document-icon" />
                      <span className="document-label">
                        {docType.label}
                      </span>
                    </div>
                    <div className="document-content empty">
                      <div className="no-document">
                        <p>Aucun document disponible</p>
                      </div>
                    </div>
                  </div>
                );
              }

              return files.map((file, index) => {
                const isPdf = isPdfArray[index] || false;
                const fileUrl = fileUrls[index] || file;
                
                return (
                  <div key={`${docType.key}_${index}`} className="document-preview-item">
                    <div className="document-header">
                      <docType.icon className="document-icon" />
                      <span className="document-label">
                        {docType.label} #{index + 1}
                        {isPdf && <FaFilePdf className="pdf-indicator" />}
                      </span>
                    </div>
                    <div className="document-content">
                      {isPdf ? (
                        <div className="pdf-document-preview">
                          <FaFilePdf className="pdf-icon-large" />
                          <span>Document PDF</span>
                          <div className="document-actions">
                            <button 
                              className="btn-view-document"
                              onClick={() => handleViewAccidentDocument(
                                accident.id,
                                docType.key,
                                docType.label,
                                index,
                                fileUrl
                              )}
                            >
                              <FaEye /> Voir le PDF
                            </button>
                            <button 
                              className="btn-download-document"
                              onClick={() => handleDownloadAccidentDocument(
                                accident.id,
                                docType.key,
                                `${docType.label}_${accident.id}_${index + 1}`,
                                index
                              )}
                              disabled={downloading && downloadingType === docType.key && downloadingIndex === index}
                            >
                              {downloading && downloadingType === docType.key && downloadingIndex === index ? (
                                <>
                                  <div className="spinner-small" /> Téléchargement...
                                </>
                              ) : (
                                <>
                                  <FaDownload /> Télécharger
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="image-document-preview">
                          {fileUrl ? (
                            <>
                              <img 
                                src={fileUrl} 
                                alt={`${docType.label} ${index + 1}`} 
                                className="document-image" 
                                onError={(e) => {
                                  console.error('Image load error:', fileUrl);
                                  e.target.src = 'https://via.placeholder.com/200x150?text=Image+Non+Disponible';
                                  e.target.onerror = null;
                                }}
                                loading="lazy"
                                onClick={() => handleViewImageModal(fileUrl, false)}
                                style={{ cursor: 'pointer' }}
                              />
                              <div className="document-actions">
                                <button 
                                  className="btn-view-document"
                                  onClick={() => handleViewAccidentDocument(
                                    accident.id,
                                    docType.key,
                                    docType.label,
                                    index,
                                    fileUrl
                                  )}
                                >
                                  <FaEye /> Agrandir
                                </button>
                                <button 
                                  className="btn-download-document"
                                  onClick={() => handleDownloadAccidentDocument(
                                    accident.id,
                                    docType.key,
                                    `${docType.label}_${accident.id}_${index + 1}`,
                                    index
                                  )}
                                  disabled={downloading && downloadingType === docType.key && downloadingIndex === index}
                                >
                                  {downloading && downloadingType === docType.key && downloadingIndex === index ? (
                                    <>
                                      <div className="spinner-small" /> Téléchargement...
                                    </>
                                  ) : (
                                    <>
                                      <FaDownload /> Télécharger
                                    </>
                                  )}
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="no-document">
                              <p>Document non disponible</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })}
          </div>
        )}
      </div>
    );
  };

  // Filtrage et recherche des accidents
  const filteredAccidents = accidents.filter(accident => {
    // Filtre de recherche
    const matchesSearch = searchTerm === '' || 
      accident.client?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accident.client?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accident.car?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accident.car?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accident.matricule?.matricule_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accident.nom_expert?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accident.id.toString().includes(searchTerm);

    // Filtre de date
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const accidentDate = accident.date_accident;
      switch (dateFilter) {
        case 'today':
          matchesDate = isToday(accidentDate);
          break;
        case 'this_week':
          matchesDate = isThisWeek(accidentDate);
          break;
        case 'this_month':
          matchesDate = isThisMonth(accidentDate);
          break;
        default:
          matchesDate = true;
      }
    }

    // Filtre de montant
    let matchesAmount = true;
    if (amountFilter !== 'all') {
      const losses = accident.amount_of_losses;
      switch (amountFilter) {
        case 'low':
          matchesAmount = losses < 1000;
          break;
        case 'medium':
          matchesAmount = losses >= 1000 && losses < 5000;
          break;
        case 'high':
          matchesAmount = losses >= 5000;
          break;
        default:
          matchesAmount = true;
      }
    }

    // Filtre de statut
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = accident.status === statusFilter;
    }

    return matchesSearch && matchesDate && matchesAmount && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAccidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAccidents = filteredAccidents.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDateFilter = (e) => {
    setDateFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleAmountFilter = (e) => {
    setAmountFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('all');
    setAmountFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const handleCreate = () => {
    setModalType('create');
    setEditingItem(null);
    setFormData({
      date_accident: new Date().toISOString().split('T')[0],
      amount_of_losses: 0,
      amount_assurance: 0,
      nom_expert: '',
      status: 'pending',
      accident_type: 'grave',
      procedure_type: 'classic',
      expert_decision: 'pending',
      matricule_id: '',
      car_id: '',
      client_id: '',
      img_accident: [],
      img_evaluation_expert: [],
      img_fixed: [],
      image_facture: []
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setModalType('edit');
    setEditingItem(item);
    
    setFormData({
      ...item,
      date_accident: item.date_accident ? new Date(item.date_accident).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      matricule_id: item.matricule_id || '',
      car_id: item.car_id || '',
      client_id: item.client_id || '',
      status: item.status || 'pending',
      accident_type: item.accident_type || 'grave',
      procedure_type: item.procedure_type || 'classic',
      expert_decision: item.expert_decision || 'pending',
      // Conserver les tableaux de fichiers existants
      img_accident: item.img_accident || [],
      img_evaluation_expert: item.img_evaluation_expert || [],
      img_fixed: item.img_fixed || [],
      image_facture: item.image_facture || [],
      // Conserver les URLs et informations PDF
      img_accident_urls: item.img_accident_urls || [],
      img_evaluation_expert_urls: item.img_evaluation_expert_urls || [],
      img_fixed_urls: item.img_fixed_urls || [],
      image_facture_urls: item.image_facture_urls || [],
      img_accident_is_pdf: item.img_accident_is_pdf || [],
      img_evaluation_expert_is_pdf: item.img_evaluation_expert_is_pdf || [],
      img_fixed_is_pdf: item.img_fixed_is_pdf || [],
      image_facture_is_pdf: item.image_facture_is_pdf || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette déclaration d\'accident ?')) return;

    try {
      await dispatch(deleteAccident(id)).unwrap();
      showSuccessMessage('Déclaration d\'accident supprimée avec succès !');
    } catch (error) {
      showErrorMessage('Erreur lors de la suppression de la déclaration d\'accident : ' + error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (modalType === 'create') {
        await dispatch(createAccident(formData)).unwrap();
      } else {
        await dispatch(updateAccident({ id: editingItem.id, data: formData })).unwrap();
      }
      setShowModal(false);
      showSuccessMessage(`Déclaration d'accident ${modalType === 'create' ? 'créée' : 'modifiée'} avec succès !`);
    } catch (error) {
      showErrorMessage('Erreur : ' + error);
    } finally {
      setSubmitting(false);
    }
  };

  const showSuccessMessage = (message) => {
    const existingNotifications = document.querySelectorAll('.success-notification, .error-notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <FaCheck style="margin-right: 0.5rem;" />
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  };

  const showErrorMessage = (message) => {
    const existingNotifications = document.querySelectorAll('.success-notification, .error-notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <FaTimes style="margin-right: 0.5rem;" />
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 8000);
  };

  const handleExport = () => {
    if (!filteredAccidents || filteredAccidents.length === 0) {
      showErrorMessage('Aucune donnée à exporter !');
      return;
    }

    const headers = ['ID', 'Date', 'Client', 'Voiture', 'Immatriculation', 'Montant Pertes', 'Montant Assurance', 'Statut', 'Nom Expert'];
    const csvContent = [
      headers.join(','),
      ...filteredAccidents.map(accident => [
        accident.id,
        accident.date_accident,
        `"${accident.client?.prenom} ${accident.client?.nom}"`,
        `"${accident.car?.brand} ${accident.car?.model}"`,
        accident.matricule?.matricule_code,
        accident.amount_of_losses,
        accident.amount_assurance,
        accident.status,
        `"${accident.nom_expert || 'N/A'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `export_accidents_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccessMessage('CSV exporté avec succès !');
  };

  const refreshData = () => {
    dispatch(fetchAccidents());
    dispatch(fetchMatricules());
    showSuccessMessage('Données actualisées avec succès !');
  };

  // Générer les boutons de pagination
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Bouton précédent
    buttons.push(
      <button
        key="prev"
        className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <FaChevronLeft />
      </button>
    );

    // Première page
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          className={`pagination-btn ${currentPage === 1 ? 'active' : ''}`}
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(<span key="ellipsis1" className="pagination-ellipsis">...</span>);
      }
    }

    // Numéros de page
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    // Dernière page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="ellipsis2" className="pagination-ellipsis">...</span>);
      }
      buttons.push(
        <button
          key={totalPages}
          className={`pagination-btn ${currentPage === totalPages ? 'active' : ''}`}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    // Bouton suivant
    buttons.push(
      <button
        key="next"
        className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <FaChevronRight />
      </button>
    );

    return buttons;
  };

  // Get client info
  const getClientInfo = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client || null;
  };

  // Get car info
  const getCarInfo = (carId) => {
    const car = cars.find(c => c.id === carId);
    return car || null;
  };

  // Get document count for an accident
  const getDocumentCount = (accident) => {
    let count = 0;
    const docTypes = ['img_accident', 'img_evaluation_expert', 'img_fixed', 'image_facture'];
    
    docTypes.forEach(type => {
      if (accident[type] && Array.isArray(accident[type])) {
        count += accident[type].length;
      }
    });
    
    return count;
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Chargement des accidents...</p>
      </div>
    );
  }

  return (
    <div className="accidents-management">
      <div className="section-header">
        <div className="header-content">
          <h1 className="section-title">
            <FaExclamationTriangle className="title-icon" />
            Gestion des Déclarations d'Accidents
          </h1>
          <p className="section-subtitle">Gérez les déclarations d'accidents de véhicules et les réclamations d'assurance</p>
        </div>
        <div className="section-actions">
          <button className="btn btn-secondary" onClick={refreshData} disabled={submitting}>
            <FaRedo className="btn-icon" />
            Actualiser
          </button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
            {submitting ? <FaSpinner className="btn-icon spinning" /> : <FaPlus className="btn-icon" />}
            {submitting ? 'Traitement...' : 'Nouvelle Déclaration'}
          </button>
          <button className="btn btn-secondary" onClick={handleExport} disabled={submitting}>
            <FaFileExport className="btn-icon" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Section Recherche et Filtres */}
      <div className="search-filter-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par nom client, voiture, immatriculation, expert, ou ID..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <label htmlFor="date-filter">
              <FaCalendarAlt className="filter-icon" />
              Date
            </label>
            <select
              id="date-filter"
              value={dateFilter}
              onChange={handleDateFilter}
              className="filter-select"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="this_week">Cette semaine</option>
              <option value="this_month">Ce mois</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="amount-filter">
              <FaMoneyBill className="filter-icon" />
              Montant Pertes
            </label>
            <select
              id="amount-filter"
              value={amountFilter}
              onChange={handleAmountFilter}
              className="filter-select"
            >
              <option value="all">Tous les montants</option>
              <option value="low">Faible (&lt; 1 000 MAD)</option>
              <option value="medium">Moyen (1 000 MAD - 5 000 MAD)</option>
              <option value="high">Élevé (&gt; 5 000 MAD)</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="status-filter">
              <FaCircle className="filter-icon" />
              Statut
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={handleStatusFilter}
              className="filter-select"
            >
              <option value="all">Tous les statuts</option>
              {Object.entries(statusConfig).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>
          </div>

          {(searchTerm !== '' || dateFilter !== 'all' || amountFilter !== 'all' || statusFilter !== 'all') && (
            <button className="btn btn-clear" onClick={clearFilters}>
              Effacer les filtres
            </button>
          )}
        </div>
      </div>

      {/* Résumé des résultats */}
      <div className="results-summary">
        <span className="results-count">
          Affichage de {currentAccidents.length} sur {filteredAccidents.length} déclarations d'accidents
          {filteredAccidents.length !== accidents.length && ` (filtrées sur ${accidents.length} au total)`}
        </span>
        <span className="page-info">
          Page {currentPage} sur {totalPages}
        </span>
      </div>

      <div className="content-container">
        {currentAccidents.length > 0 ? (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Voiture</th>
                  <th>Immatriculation</th>
                  <th>Statut</th>
                  <th>Expert</th>
                  <th>Classification</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentAccidents.map(accident => (
                  <tr key={accident.id}>
                    <td className="accident-id">#{accident.id}</td>
                    <td className="accident-date">
                      {new Date(accident.date_accident).toLocaleDateString()}
                    </td>
                    <td className="client-name">
                      {accident.client?.prenom} {accident.client?.nom}
                    </td>
                    <td className="car-info">
                      {accident.car?.brand} {accident.car?.model}
                    </td>
                    <td className="matricule-code">
                      {accident.matricule?.matricule_code}
                      {accident.matricule && (
                        <span className={`matricule-status ${accident.matricule.status === 'active' ? 'active' : 'inactive'}`}>
                          {accident.matricule.status === 'active' ? ' ✅' : ' ❌'}
                        </span>
                      )}
                    </td>
                    <td className="status-cell">
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: statusConfig[accident.status]?.color || '#6c757d',
                          color: 'white'
                        }}
                      >
                        {statusConfig[accident.status]?.label || accident.status}
                      </span>
                    </td>
                    <td className="expert-name">
                      {accident.nom_expert ? (
                        <div className="expert-info">
                          <FaUserTie className="expert-icon" />
                          {accident.nom_expert}
                        </div>
                      ) : (
                        <span className="no-expert">Non assigné</span>
                      )}
                    </td>
                    <td className="accident-classification-cell">
                      {getAccidentTypeBadge(accident)}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-action btn-view" 
                          onClick={() => handleViewDetails(accident)}
                          title="Voir les détails"
                          disabled={submitting}
                        >
                          <FaInfo />
                        </button>
                        <button 
                          className="btn-action btn-edit" 
                          onClick={() => handleEdit(accident)}
                          title="Modifier"
                          disabled={submitting}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="btn-action btn-delete" 
                          onClick={() => handleDelete(accident.id)}
                          title="Supprimer"
                          disabled={submitting}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination">
                  {renderPaginationButtons()}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="no-data">
            <FaDatabase size={48} />
            <p>
              {accidents.length === 0 
                ? 'Aucune déclaration d\'accident trouvée' 
                : 'Aucune déclaration d\'accident ne correspond à vos critères de recherche'}
            </p>
            <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
              <FaPlus className="btn-icon" />
              Créer une Nouvelle Déclaration
            </button>
            {(searchTerm !== '' || dateFilter !== 'all' || amountFilter !== 'all' || statusFilter !== 'all') && (
              <button className="btn btn-secondary" onClick={clearFilters} style={{marginTop: '1rem'}}>
                Effacer les Filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de Détails de l'Accident */}
      {showDetails && selectedAccident && (
        <div className="details-modal-overlay">
          <div className="details-modal">
            <div className="details-header">
              <div className="accident-header-info">
                <button className="back-btn" onClick={handleCloseDetails}>
                  <FaArrowLeft />
                </button>
                <div className="accident-info">
                  <h2>Accident #{selectedAccident.id}</h2>
                  <div className="accident-meta">
                    <div>
                      <FaCalendarAlt /> 
                      {new Date(selectedAccident.date_accident).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </div>
                    <div className={`status-badge-details ${selectedAccident.status}`}>
                      {statusConfig[selectedAccident.status]?.label || selectedAccident.status}
                    </div>
                  </div>
                </div>
              </div>
              <button className="close-details-btn" onClick={handleCloseDetails}>
                <FaTimes />
              </button>
            </div>

            <div className="details-content">
              {/* Informations Générales */}
              <div className="details-section">
                <div className="section-title">
                  <FaInfo />
                  <span>Informations Générales</span>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Type d'Accident</div>
                    <div className="info-value">
                      <span className={`accident-type-badge ${selectedAccident.accident_type}`}>
                        {selectedAccident.accident_type === 'grave' ? 'Grave' : 'Non-Grave'}
                      </span>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Type de Procédure</div>
                    <div className="info-value">
                      <span className={`procedure-badge ${selectedAccident.procedure_type}`}>
                        {selectedAccident.procedure_type === 'classic' ? 'Classique' : 'Forphie'}
                      </span>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Montant des Pertes</div>
                    <div className="info-value loss-amount">{selectedAccident.amount_of_losses} MAD</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Montant Assurance</div>
                    <div className="info-value insurance-amount">{selectedAccident.amount_assurance} MAD</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Nom de l'Expert</div>
                    <div className="info-value expert-name">{selectedAccident.nom_expert || 'Non assigné'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Décision Expert</div>
                    <div className="info-value">{selectedAccident.expert_decision || 'En attente'}</div>
                  </div>
                </div>
              </div>

              {/* Informations Client */}
              <div className="details-section">
                <div className="section-title">
                  <FaUser />
                  <span>Informations Client</span>
                </div>
                {selectedAccident.client ? (
                  <div className="client-info-card">
                    <div className="client-header">
                      <div className="client-name-large">
                        <FaUser className="client-icon" />
                        {selectedAccident.client.prenom} {selectedAccident.client.nom}
                      </div>
                      <div className="client-id">Client #{selectedAccident.client.id}</div>
                    </div>
                    <div className="client-details">
                      <div className="client-detail">
                        <FaEnvelope className="detail-icon" />
                        {selectedAccident.client.email || 'Non spécifié'}
                      </div>
                      <div className="client-detail">
                        <FaPhone className="detail-icon" />
                        {selectedAccident.client.telephone || 'Non spécifié'}
                      </div>
                      <div className="client-detail">
                        <FaMapMarkerAlt className="detail-icon" />
                        {selectedAccident.client.city || 'Non spécifié'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-client-info">
                    <FaUser size={32} />
                    <p>Informations client non disponibles</p>
                  </div>
                )}
              </div>

              {/* Informations Véhicule */}
              <div className="details-section">
                <div className="section-title">
                  <FaCar />
                  <span>Informations Véhicule</span>
                </div>
                {selectedAccident.car ? (
                  <div className="car-info-card">
                    <div className="car-header">
                      <div className="car-name-large">
                        <FaCar className="car-icon" />
                        {selectedAccident.car.brand} {selectedAccident.car.model}
                      </div>
                      <div className="car-id">Voiture #{selectedAccident.car.id}</div>
                    </div>
                    <div className="car-details">
                      <div className="car-detail">
                        <FaCalendarDay className="detail-icon" />
                        Année: {selectedAccident.car.year || 'Non spécifié'}
                      </div>
                      <div className="car-detail">
                        <FaCarCrash className="detail-icon" />
                        Type: {selectedAccident.car.type || 'Non spécifié'}
                      </div>
                      <div className="car-detail">
                        <FaClock className="detail-icon" />
                        Kilométrage: {selectedAccident.car.kilometrage || '0'} km
                      </div>
                    </div>
                    {selectedAccident.matricule && (
                      <div className="matricule-info">
                        <div className="matricule-code-large">
                          Immatriculation: {selectedAccident.matricule.matricule_code}
                          <span className={`matricule-status ${selectedAccident.matricule.status === 'active' ? 'active' : 'inactive'}`}>
                            {selectedAccident.matricule.status === 'active' ? ' (Active)' : ' (Inactive)'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-car-info">
                    <FaCar size={32} />
                    <p>Informations véhicule non disponibles</p>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="details-section">
                <div className="section-title">
                  <FaFilePdf />
                  <span>Documents ({getDocumentCount(selectedAccident)})</span>
                </div>
                {renderAccidentDocuments(selectedAccident)}
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <AdminModal
          type="accidents"
          modalType={modalType}
          formData={formData}
          setFormData={setFormData}
          onClose={() => !submitting && setShowModal(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
          clients={clients}
          matricules={matricules}
          cars={cars}
        />
      )}

      <style jsx>{`
        .accidents-management {
          padding: 2rem;
          min-height: 100vh;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          background: #f8f9fa;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

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

        .section-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          font-family: inherit;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
          box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
        }

        .btn-secondary:hover:not(:disabled) {
          background: #545b62;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(108, 117, 125, 0.4);
        }

        .btn-clear {
          background: #dc3545;
          color: white;
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
        }

        .btn-clear:hover:not(:disabled) {
          background: #c82333;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(220, 53, 69, 0.4);
        }

        .btn-icon {
          font-size: 0.875rem;
        }

        /* Styles de recherche et filtres */
        .search-filter-section {
          background: white;
          padding: 1.5rem;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          margin-bottom: 1.5rem;
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          align-items: flex-end;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 300px;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          font-size: 1rem;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          font-size: 0.875rem;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .filter-group {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
          flex-wrap: wrap;
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-item label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-icon {
          font-size: 0.875rem;
        }

        .filter-select {
          padding: 0.75rem 1rem;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          font-size: 0.875rem;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          min-width: 150px;
        }

        .filter-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        /* Résumé des résultats */
        .results-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding: 0 0.5rem;
          font-size: 0.875rem;
          color: #6c757d;
        }

        .results-count {
          font-weight: 500;
        }

        .page-info {
          font-weight: 600;
          color: #495057;
        }

        .content-container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.2);
        }

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
    height: 90px;
    vertical-align: middle;
        }

        .data-table tr:hover {
          background: #f8f9fa;
        }

        .accident-id {
          font-weight: 600;
          color: #6c757d;
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .client-name {
          font-weight: 600;
          color: #2c3e50;
        }

        .car-info {
          color: #495057;
        }

        .matricule-code {
          font-family: 'Monaco', 'Consolas', monospace;
          color: #6c757d;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .matricule-status.active {
          color: #28a745;
        }

        .matricule-status.inactive {
          color: #dc3545;
        }

        .losses-amount {
          font-weight: 600;
          color: #dc3545;
        }

        .insurance-amount {
          font-weight: 600;
          color: #28a745;
        }

        /* Styles de statut */
        .status-cell {
          text-align: center;
        }

        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-block;
          min-width: 120px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        /* Styles expert */
        .expert-name {
          text-align: center;
        }

        .expert-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
          font-weight: 500;
          color: #495057;
        }

        .expert-icon {
          color: #6c757d;
          font-size: 0.875rem;
        }

        .no-expert {
          color: #6c757d;
          font-style: italic;
          font-size: 0.8rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        .btn-action {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 36px;
          height: 36px;
          font-size: 0.875rem;
        }

        .btn-action:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-view {
          background: rgba(23, 162, 184, 0.1);
          color: #17a2b8;
          border: 1px solid rgba(23, 162, 184, 0.2);
        }

        .btn-view:hover:not(:disabled) {
          background: #17a2b8;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(23, 162, 184, 0.3);
        }

        .btn-edit {
          background: rgba(255, 193, 7, 0.1);
          color: #ffc107;
          border: 1px solid rgba(255, 193, 7, 0.2);
        }

        .btn-edit:hover:not(:disabled) {
          background: #ffc107;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
        }

        .btn-delete {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          border: 1px solid rgba(220, 53, 69, 0.2);
        }

        .btn-delete:hover:not(:disabled) {
          background: #dc3545;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
        }

        .no-data {
          text-align: center;
          padding: 4rem 2rem;
          color: #6c757d;
        }

        .no-data p {
          margin: 1rem 0 2rem;
          font-size: 1.1rem;
        }

        /* Styles de pagination */
        .pagination-container {
          padding: 2rem;
          border-top: 1px solid #f1f3f4;
          display: flex;
          justify-content: center;
        }

        .pagination {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1rem;
          border: 2px solid #e9ecef;
          background: white;
          color: #6c757d;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 44px;
          height: 44px;
        }

        .pagination-btn:hover:not(.disabled):not(.active) {
          border-color: #667eea;
          color: #667eea;
          transform: translateY(-2px);
        }

        .pagination-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .pagination-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .pagination-ellipsis {
          padding: 0.75rem 0.5rem;
          color: #6c757d;
          font-weight: 600;
        }

        /* Accident classification */
        .accident-classification {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .accident-type-badge, .procedure-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .accident-type-badge.grave {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          border: 1px solid rgba(220, 53, 69, 0.2);
        }

        .accident-type-badge.non-grave {
          background: rgba(40, 167, 69, 0.1);
          color: #28a745;
          border: 1px solid rgba(40, 167, 69, 0.2);
        }

        .procedure-badge.classic {
          background: rgba(0, 123, 255, 0.1);
          color: #007bff;
          border: 1px solid rgba(0, 123, 255, 0.2);
        }

        .procedure-badge.forphie {
          background: rgba(111, 66, 193, 0.1);
          color: #6f42c1;
          border: 1px solid rgba(111, 66, 193, 0.2);
        }

        .type-icon {
          font-size: 0.6rem;
        }

        /* Details Modal */
        .details-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
          backdrop-filter: blur(5px);
        }

        .details-modal {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 1200px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
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

        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 2rem;
          border-bottom: 1px solid #f1f3f4;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .accident-header-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .back-btn {
          background: none;
          border: none;
          font-size: 1.2rem;
          color: #6c757d;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: #f8f9fa;
          color: #667eea;
        }

        .accident-info h2 {
          margin: 0 0 0.5rem 0;
          color: #1a1a1a;
          font-size: 1.5rem;
        }

        .accident-meta {
          display: flex;
          gap: 1rem;
          align-items: center;
          color: #6c757d;
          font-size: 0.9rem;
        }

        .status-badge-details {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge-details.pending { background: #ffc107; color: #000; }
        .status-badge-details.evaluation_owner { background: #17a2b8; color: white; }
        .status-badge-details['contact expert'] { background: #6f42c1; color: white; }
        .status-badge-details.evaluation_expert { background: #fd7e14; color: white; }
        .status-badge-details.fixed { background: #28a745; color: white; }
        .status-badge-details.waiting { background: #6c757d; color: white; }
        .status-badge-details.completed { background: #20c997; color: white; }

        .close-details-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #6c757d;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .close-details-btn:hover {
          background: #f8f9fa;
          color: #dc3545;
        }

        .details-content {
          padding: 2rem;
        }

        .details-section {
          margin-bottom: 2.5rem;
        }

        .details-section .section-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.25rem;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 1.5rem;
          background: none;
          -webkit-text-fill-color: #2c3e50;
        }

        /* Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .info-item {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .info-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #6c757d;
          margin-bottom: 0.25rem;
        }

        .info-value {
          font-size: 1rem;
          font-weight: 500;
          color: #1a1a1a;
        }

        .loss-amount {
          color: #dc3545;
          font-weight: 600;
        }

        .insurance-amount {
          color: #28a745;
          font-weight: 600;
        }

        .expert-name {
          color: #6f42c1;
          font-weight: 600;
        }

        /* Client Info Card */
        .client-info-card, .car-info-card {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .client-header, .car-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .client-name-large, .car-name-large {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: #2c3e50;
          font-size: 1.1rem;
        }

        .client-icon, .car-icon {
          color: #667eea;
        }

        .client-id, .car-id {
          font-size: 0.75rem;
          color: #6c757d;
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .client-details, .car-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .client-detail, .car-detail {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #6c757d;
        }

        .detail-icon {
          font-size: 0.875rem;
          color: #667eea;
          width: 16px;
        }

        .matricule-info {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e9ecef;
        }

        .matricule-code-large {
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 0.9rem;
          color: #6c757d;
        }

        .matricule-status.active {
          color: #28a745;
          font-weight: 600;
        }

        .matricule-status.inactive {
          color: #dc3545;
          font-weight: 600;
        }

        .no-client-info, .no-car-info {
          text-align: center;
          padding: 2rem;
          color: #6c757d;
          background: #f8f9fa;
          border-radius: 12px;
          border: 2px dashed #dee2e6;
        }

        .no-client-info svg, .no-car-info svg {
          margin-bottom: 1rem;
          opacity: 0.3;
        }

        /* Documents Section */
        .documents-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .documents-header h4 {
          margin: 0;
          font-size: 1rem;
          color: #495057;
        }

        .btn-toggle-documents {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-toggle-documents:hover {
          background: #545b62;
        }

        .document-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .document-grid {
            grid-template-columns: 1fr;
          }
        }

        .document-preview-item {
          border: 1px solid #e9ecef;
          border-radius: 8px;
          overflow: hidden;
          background: white;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .document-preview-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }

        .document-preview-item.empty {
          border: 2px dashed #dee2e6;
          background: #f8f9fa;
        }

        .document-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .document-icon {
          font-size: 0.875rem;
          color: #6c757d;
        }

        .document-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #495057;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pdf-indicator {
          color: #dc2626;
          font-size: 0.875rem;
          margin-left: 0.5rem;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }

        .document-content {
          padding: 1rem;
        }

        .document-content.empty {
          padding: 2rem;
          text-align: center;
        }

        .pdf-document-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 8px;
          border: 2px solid #dee2e6;
          text-align: center;
          min-height: 180px;
        }

        .pdf-icon-large {
          font-size: 3rem;
          color: #dc2626;
          margin-bottom: 0.75rem;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }

        .pdf-document-preview span {
          font-size: 0.9rem;
          color: #495057;
          margin-bottom: 1rem;
          font-weight: 500;
        }

        .image-document-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .document-image {
          max-width: 100%;
          max-height: 180px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          object-fit: contain;
          background: white;
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .document-image:hover {
          transform: scale(1.02);
        }

        .document-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
          width: 100%;
        }

        .btn-view-document {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #007bff;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          font-weight: 500;
        }

        .btn-view-document:hover {
          background: #0056b3;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,123,255,0.3);
        }

        .btn-download-document {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #28a745;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          font-weight: 500;
        }

        .btn-download-document:hover:not(:disabled) {
          background: #1e7e34;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(40,167,69,0.3);
        }

        .btn-download-document:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .no-document {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: #6c757d;
        }

        .no-document p {
          margin: 0;
        }

        /* Spinner */
        .spinner-small {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
          margin-right: 0.5rem;
        }

        /* Notifications de succès et d'erreur */
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

        /* Loading Spinner */
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
        }

        .loading-spinner .spinner {
          width: 48px;
          height: 48px;
          border: 3px solid #e9ecef;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @media (max-width: 768px) {
          .accidents-management {
            padding: 1rem;
          }

          .section-header {
            flex-direction: column;
            gap: 1rem;
            padding: 1.5rem;
          }

          .section-actions {
            width: 100%;
            justify-content: space-between;
          }

          .search-filter-section {
            flex-direction: column;
            align-items: stretch;
          }

          .search-box {
            min-width: auto;
          }

          .filter-group {
            justify-content: space-between;
          }

          .filter-item {
            flex: 1;
          }

          .filter-select {
            min-width: auto;
          }

          .results-summary {
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
          }

          .content-container {
            overflow-x: auto;
          }

          .data-table {
            min-width: 1000px;
          }

          .action-buttons {
            flex-direction: column;
            gap: 0.25rem;
          }

          .action-buttons .btn-action {
            padding: 0.5rem;
          }

          .pagination {
            flex-wrap: wrap;
            justify-content: center;
          }

          .details-modal {
            margin: 1rem;
            max-height: 95vh;
          }

          .details-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .accident-header-info {
            flex-direction: row;
            align-items: center;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .document-grid {
            grid-template-columns: 1fr;
          }

          .document-actions {
            flex-direction: column;
          }

          .btn-view-document,
          .btn-download-document {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default AccidentsManagement;