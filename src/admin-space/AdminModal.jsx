import React, { useState, useEffect, useMemo } from 'react'; 
import { 
  FaTimes, FaCar, FaUser, FaIdCard, FaCalendarAlt, FaClock, 
  FaMoneyBill, FaImage, FaPlus, FaGasPump, FaCog, FaChair, 
  FaDoorClosed, FaUserTie, FaExclamationTriangle, FaFileInvoice,
  FaTrash, FaReceipt, FaHistory, FaCreditCard, FaInfoCircle,
  FaCheck, FaBan, FaOilCan, FaTachometerAlt, FaCalendarCheck,
  FaTools, FaVial, FaShieldAlt, FaFilePdf, FaDownload, FaEye,
  FaEdit, FaSave, FaList, FaCalculator, FaHistory as FaHistoryIcon,
  FaRoad, FaRuler, FaSyncAlt, FaCheckCircle, FaExclamationCircle,FaEnvelope ,FaPhone ,FaSearch ,FaUserPlus,FaMapMarkerAlt
} from 'react-icons/fa';

const AdminModal = ({ type, modalType, formData, setFormData, onClose, onSubmit, clients = [], matricules = [], cars = [], submitting = false }) => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [useRentalDays, setUseRentalDays] = useState(false);
  const [carMatricules, setCarMatricules] = useState([]);
  const [isNewClient, setIsNewClient] = useState(false);
  const [blurTimeoutId, setBlurTimeoutId] = useState(null);

  const [showExpertFields, setShowExpertFields] = useState(false);
  const [showSecondDriver, setShowSecondDriver] = useState(formData.has_second_driver || false);
const [secondDriverSearch, setSecondDriverSearch] = useState('');
const [selectedSecondDriver, setSelectedSecondDriver] = useState(null);
const [carSearch, setCarSearch] = useState('');
const [matriculeSearch, setMatriculeSearch] = useState('');
const [showCarDropdown, setShowCarDropdown] = useState(false);
const [showMatriculeDropdown, setShowMatriculeDropdown] = useState(false);

useEffect(() => {
  return () => {
    if (blurTimeoutId) {
      clearTimeout(blurTimeoutId);
    }
  };
}, [blurTimeoutId]);

// ✅ FIXED: Use useMemo for filtered cars
const filteredCars = useMemo(() => {
  if (!carSearch.trim()) {
    return [];
  }
  
  const searchTerm = carSearch.toLowerCase().trim();
  
  return cars
    .filter(car => {
      if (!car || typeof car !== 'object') return false;
      
      const brand = (car.brand || '').toLowerCase();
      const model = (car.model || '').toLowerCase();
      const color = (car.color || '').toLowerCase();
      const year = (car.year || '').toString();
      const searchString = `${brand} ${model} ${color} ${year}`;
      
      return searchString.includes(searchTerm);
    })
    .slice(0, 10);
}, [carSearch, cars]);

// ✅ FIXED: Use useMemo for filtered matricules
const filteredMatricules = useMemo(() => {
  if (!matriculeSearch.trim()) {
    return [];
  }
  
  const searchTerm = matriculeSearch.toLowerCase().trim();
  
  return matricules
    .filter(matricule => {
      if (!matricule || typeof matricule !== 'object') return false;
      
      const code = (matricule.matricule_code || '').toLowerCase();
      const carId = matricule.car_id;
      const car = cars.find(c => c.id == carId);
      const carInfo = car ? `${car.brand} ${car.model} ${car.color}`.toLowerCase() : '';
      const searchString = `${code} ${carInfo}`;
      
      return searchString.includes(searchTerm);
    })
    .slice(0, 10);
}, [matriculeSearch, matricules, cars]);

// ✅ FIXED: Use useMemo for initial car search value
const initialCarSearch = useMemo(() => {
  if (modalType === 'edit' && formData.car_id) {
    const car = cars.find(c => c.id == formData.car_id);
    return car ? `${car.brand} ${car.model} ${car.year} - ${car.color}` : '';
  }
  return '';
}, [modalType, formData.car_id, cars]);

// ✅ FIXED: Use useMemo for initial matricule search value
const initialMatriculeSearch = useMemo(() => {
  if (modalType === 'edit' && type === 'reservations' && formData.matricule_id) {
    const matricule = matricules.find(m => m.id == formData.matricule_id);
    return matricule ? matricule.matricule_code : '';
  }
  return '';
}, [modalType, type, formData.matricule_id, matricules]);

// ✅ FIXED: Initialize search fields once
useEffect(() => {
  if (modalType === 'edit') {
    if (formData.car_id && !carSearch && initialCarSearch) {
      setCarSearch(initialCarSearch);
    }
    if (type === 'reservations' && formData.matricule_id && !matriculeSearch && initialMatriculeSearch) {
      setMatriculeSearch(initialMatriculeSearch);
    }
  }
}, [modalType, initialCarSearch, initialMatriculeSearch]);

// Add this function for car selection
const handleCarSelect = (car) => {
  handleChange('car_id', car.id);
  setCarSearch(`${car.brand} ${car.model} ${car.year} - ${car.color}`);
  setShowCarDropdown(false);
  
  // If we're in reservations, filter matricules for this car
  if (type === 'reservations') {
    const carMatricules = matricules.filter(m => m.car_id == car.id);
    setCarMatricules(carMatricules);
  }
};

// Add this function for matricule selection
const handleMatriculeSelect = (matricule) => {
  handleChange('matricule_id', matricule.id);
  setMatriculeSearch(matricule.matricule_code);
  setShowMatriculeDropdown(false);
  
  // Auto-fill departure kilometerage
  if (type === 'reservations') {
    const shouldAutoFill = 
      modalType === 'create' || 
      !formData.kilometrage_sortie || 
      formData.kilometrage_sortie === 0;
    
    if (shouldAutoFill) {
      handleChange('kilometrage_sortie', matricule.kilometrage);
    }
  }
  
  // Auto-select vehicle if not already selected
  if (!formData.car_id && matricule.car_id) {
    const car = cars.find(c => c.id == matricule.car_id);
    if (car) {
      handleChange('car_id', car.id);
      setCarSearch(`${car.brand} ${car.model} ${car.year} - ${car.color}`);
    }
  }
};

// Dans la section des états, ajouter :
const [isNewSecondDriver, setIsNewSecondDriver] = useState(false);
const [newSecondDriverData, setNewSecondDriverData] = useState({
  prenom: '',
  nom: '',
  telephone: '',
  email: '',
  city: '',
  cin_number: '',
  driver_license_number: '',
  cin_image: '',
  driver_license_image: '',
  date_naissance: '',
  lieu_naissance: '',
  cin_delivre_le: '',
  permis_delivre_le: ''
});

// ✅ FIXED: Single useEffect for second driver initialization
useEffect(() => {
  if (modalType === 'edit') {
    const hasSecondDriver = formData.has_second_driver || false;
    
    if (hasSecondDriver && formData.second_driver_client_id) {
      setShowSecondDriver(true);
      
      // Only update if we don't already have the same client selected
      if (!selectedSecondDriver || selectedSecondDriver.id != formData.second_driver_client_id) {
        const secondDriverClient = clients.find(c => c.id == formData.second_driver_client_id);
        if (secondDriverClient) {
          setSelectedSecondDriver(secondDriverClient);
          setSecondDriverSearch(`${secondDriverClient.prenom} ${secondDriverClient.nom}`);
        }
      }
    } else if (!hasSecondDriver) {
      setShowSecondDriver(false);
      setSelectedSecondDriver(null);
      setSecondDriverSearch('');
    }
  }
}, [modalType, formData.has_second_driver, formData.second_driver_client_id]);

// ✅ FIXED: Use useMemo for filtered second drivers
const filteredSecondDrivers = useMemo(() => {
  if (!secondDriverSearch.trim()) {
    return [];
  }
  
  const searchTerm = secondDriverSearch.toLowerCase().trim();
  
  return clients
    .filter(client => {
      if (!client || typeof client !== 'object') return false;
      if (client.id == formData.client_id) return false; // Exclude primary client
      
      const prenom = (client.prenom || '').toLowerCase();
      const nom = (client.nom || '').toLowerCase();
      const telephone = (client.telephone || '').toLowerCase();
      const fullName = `${prenom} ${nom}`;
      
      return (
        prenom.includes(searchTerm) ||
        nom.includes(searchTerm) ||
        fullName.includes(searchTerm) ||
        telephone.includes(searchTerm)
      );
    })
    .slice(0, 10);
}, [secondDriverSearch, clients, formData.client_id]);

// Handle second driver selection
const handleSecondDriverSelect = (client) => {
  setSelectedSecondDriver(client);
  setSecondDriverSearch(`${client.prenom} ${client.nom}`);
  
  // IMPORTANT: Update both fields
  handleChange('second_driver_client_id', client.id);
  handleChange('has_second_driver', true);
  
  // If it's a temporary client, store the data
  if (client.is_temp) {
    handleChange('second_driver_temp_data', {
      nom: client.nom || '',
      prenom: client.prenom || '',
      telephone: client.telephone || '',
      email: client.email || '',
      city: client.city || '',
      cin_number: client.cin_number || '',
      driver_license_number: client.driver_license_number || '',
      cin_image: client.cin_image || '',
      driver_license_image: client.driver_license_image || '',
      date_naissance: client.date_naissance || '',
      lieu_naissance: client.lieu_naissance || '',
      cin_delivre_le: client.cin_delivre_le || '',
      permis_delivre_le: client.permis_delivre_le || ''
    });
  } else {
    // Clear any temp data if selecting an existing client
    handleChange('second_driver_temp_data', null);
  }
  
  // Clear the dropdown
  setFilteredSecondDrivers([]);
};

// Clear second driver
const handleClearSecondDriver = () => {
    setSelectedSecondDriver(null);
    setSecondDriverSearch('');
    
    // IMPORTANT: Update both fields
    handleChange('second_driver_client_id', '');
    handleChange('has_second_driver', false);
};

// Handle creating new client as second driver
const handleNewSecondDriver = () => {
  setIsNewSecondDriver(true);
  setSelectedSecondDriver(null);
  setSecondDriverSearch('');
  
  // Initialize new client data
  setNewSecondDriverData({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    city: '',
    cin_number: '',
    driver_license_number: '',
    cin_image: '',
    driver_license_image: '',
    date_naissance: '',
    lieu_naissance: '',
    cin_delivre_le: '',
    permis_delivre_le: ''
  });
};

// In AdminModal.jsx - Update the handleCreateSecondDriver function
const handleCreateSecondDriver = async () => {
  // Validate required fields
  if (!newSecondDriverData.prenom || !newSecondDriverData.nom || !newSecondDriverData.telephone) {
    alert('Veuillez remplir au moins le prénom, nom et téléphone');
    return;
  }

  try {
    console.log('Creating second driver on server...');
    
    // Create the client data for the API
    const clientData = {
      nom: newSecondDriverData.nom || '',
      prenom: newSecondDriverData.prenom || '',
      telephone: newSecondDriverData.telephone || '',
      email: newSecondDriverData.email || '',
      city: newSecondDriverData.city || '',
      cin_number: newSecondDriverData.cin_number || '',
      driver_license_number: newSecondDriverData.driver_license_number || '',
      cin_image: newSecondDriverData.cin_image || '',
      driver_license_image: newSecondDriverData.driver_license_image || '',
      date_naissance: newSecondDriverData.date_naissance || '',
      lieu_naissance: newSecondDriverData.lieu_naissance || '',
      cin_delivre_le: newSecondDriverData.cin_delivre_le || '',
      permis_delivre_le: newSecondDriverData.permis_delivre_le || '',
      image_permit: 'default_permit.jpg',
      image_cn: 'default_cn.jpg'
    };

    console.log('Client data ready for creation:', clientData);
    
    // IMPORTANT: We'll store the data and create the client in the main form submission
    // This prevents duplicate client creation issues
    
    // Store the second driver data in formData
    handleChange('second_driver_temp_data', clientData);
    
    // Create a temporary placeholder for the UI
    const tempPlaceholder = {
      id: 'temp_pending', // Temporary ID for UI display only
      ...newSecondDriverData,
      is_temp: true, // Mark as temp for UI display
      is_pending_creation: true // Mark as pending creation
    };

    // Select the temporary placeholder for UI
    setSelectedSecondDriver(tempPlaceholder);
    setSecondDriverSearch(`${newSecondDriverData.prenom} ${newSecondDriverData.nom}`);
    
    // Clear the form
    setIsNewSecondDriver(false);
    setNewSecondDriverData({
      prenom: '',
      nom: '',
      telephone: '',
      email: '',
      city: '',
      cin_number: '',
      driver_license_number: '',
      cin_image: '',
      driver_license_image: '',
      date_naissance: '',
      lieu_naissance: '',
      cin_delivre_le: '',
      permis_delivre_le: ''
    });

    console.log('Second driver data saved for later creation:', clientData);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement des données du deuxième conducteur:', error);
    alert('Erreur lors de l\'enregistrement des données du deuxième conducteur. Veuillez réessayer.');
  }
};
  
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'cash',
    notes: ''
  });

  // Maintenance fields with dates and quantities
  const [maintenanceFields, setMaintenanceFields] = useState({
    // Paquets de Voiture
    paquets_de_voiture: formData.paquets_de_voiture || 'no',
    paquets_de_voiture_date: formData.paquets_de_voiture_date || '',
    paquets_de_voiture_count: formData.paquets_de_voiture_count || 0,
    paquets_de_voiture_history: formData.paquets_de_voiture_history || [],
    
    // Paquets de Frein
    paquets_de_frein: formData.paquets_de_frein || 'no',
    paquets_de_frein_date: formData.paquets_de_frein_date || '',
    paquets_de_frein_count: formData.paquets_de_frein_count || 0,
    paquets_de_frein_history: formData.paquets_de_frein_history || [],
    
    // Filter Oil
    filter_oil: formData.filter_oil || 'no',
    filter_oil_date: formData.filter_oil_date || '',
    filter_oil_count: formData.filter_oil_count || 0,
    filter_oil_history: formData.filter_oil_history || [],
    
    // Filter Air
    filter_air: formData.filter_air || 'no',
    filter_air_date: formData.filter_air_date || '',
    filter_air_count: formData.filter_air_count || 0,
    filter_air_history: formData.filter_air_history || [],
    
    // Ad Blue
    ad_blue: formData.ad_blue || 'no',
    ad_blue_date: formData.ad_blue_date || '',
    ad_blue_quantity: formData.ad_blue_quantity || 0,
    ad_blue_history: formData.ad_blue_history || [],
    
    // Oil
    oil: formData.oil || 'no',
    oil_date: formData.oil_date || '',
    oil_quantity: formData.oil_quantity || 0,
    oil_history: formData.oil_history || [],
    
    // Quantity inputs for adding new entries
    new_oil_quantity: '',
    new_oil_date: '',
    new_ad_blue_quantity: '',
    new_ad_blue_date: '',
    new_filter_oil_date: '',
    new_filter_air_date: '',
    new_paquets_de_frein_date: '',
    new_paquets_de_voiture_date: ''
  });

  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [newMaintenanceItem, setNewMaintenanceItem] = useState({
    name: '',
    type: 'note',
    value: '',
    interval_km: '',
    notes: '',
    required_for_vidange: false,
    needs_attention: false,
    due_date: '',
    last_done_date: ''
  });
  
  const [editingMaintenanceItem, setEditingMaintenanceItem] = useState(null);
  const [additionalMaintenance, setAdditionalMaintenance] = useState(
    Array.isArray(formData.additional_maintenance) ? formData.additional_maintenance : []
  );
  
  // Periodic kilometer maintenance
  const [periodicKmMaintenance, setPeriodicKmMaintenance] = useState(
    Array.isArray(formData.periodic_km_maintenance) ? formData.periodic_km_maintenance : []
  );
  
  // History modal states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyType, setHistoryType] = useState('');
  const [historyData, setHistoryData] = useState([]);
  const [historyTitle, setHistoryTitle] = useState('');
  
  // Quantity modal states
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [quantityType, setQuantityType] = useState('');
  const [quantityData, setQuantityData] = useState({
    quantity: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  // Periodic KM change modal
  const [showPeriodicKmModal, setShowPeriodicKmModal] = useState(false);
  const [selectedPeriodicItem, setSelectedPeriodicItem] = useState(null);
  const [periodicChangeData, setPeriodicChangeData] = useState({
    date: new Date().toISOString().split('T')[0]
  });
  
  // Periodic KM history modal
  const [showPeriodicKmHistoryModal, setShowPeriodicKmHistoryModal] = useState(false);
  const [periodicHistoryData, setPeriodicHistoryData] = useState([]);
  const [periodicHistoryTitle, setPeriodicHistoryTitle] = useState('');
  
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [oldKilometerValue, setOldKilometerValue] = useState(formData.kilometrage || 0);

  const accidentStatusOptions = [
    { value: 'pending', label: 'En attente' },
    { value: 'evaluation_owner', label: 'Évaluation propriétaire' },
    { value: 'contact expert', label: 'Contact expert' },
    { value: 'evaluation_expert', label: 'Évaluation expert' },
    { value: 'fixed', label: 'Réparé' },
    { value: 'waiting', label: 'En attente' },
    { value: 'completed', label: 'Terminé' }
  ];

  const accidentTypeOptions = [
    { value: 'grave', label: 'Accident Grave' },
    { value: 'non_grave', label: 'Accident Non-Grave' }
  ];

  const procedureTypeOptions = [
    { value: 'classic', label: 'Procédure Classique' },
    { value: 'forphie', label: 'Procédure Forphie' }
  ];

  const expertDecisionOptions = [
    { value: 'pending', label: 'En attente' },
    { value: 'accepted', label: 'Accepté' },
    { value: 'rejected', label: 'Rejeté' }
  ];
  
  const maintenanceTypeOptions = [
    { value: 'note', label: 'Note', icon: FaList },
    { value: 'quantity', label: 'Quantité (L)', icon: FaOilCan },
    { value: 'periodic_km', label: 'Kilométrage Périodique', icon: FaRoad }
  ];
  
  const isPdfFile = (file) => {
    if (!file) return false;
    
    if (typeof file === 'string') {
      return file.startsWith('data:application/pdf') || 
             file.toLowerCase().includes('pdf') ||
             file.toLowerCase().endsWith('.pdf');
    }
    
    if (typeof file === 'object') {
      if (file.isPdf !== undefined) return file.isPdf;
      if (file.type) return file.type === 'application/pdf';
      if (file.name) return file.name.toLowerCase().endsWith('.pdf');
    }
    
    return false;
  };

  // ✅ FIXED: Use useMemo for filtered clients
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim() || isNewClient || !clients || !Array.isArray(clients)) {
      return [];
    }
    
    const searchTerm = clientSearch.toLowerCase().trim();
    
    return clients
      .filter(client => {
        if (!client || typeof client !== 'object') return false;
        
        const prenom = (client.prenom || '').toLowerCase();
        const nom = (client.nom || '').toLowerCase();
        const telephone = (client.telephone || '').toLowerCase();
        const fullName = `${prenom} ${nom}`;
        
        return (
          prenom.includes(searchTerm) ||
          nom.includes(searchTerm) ||
          fullName.includes(searchTerm) ||
          telephone.includes(searchTerm)
        );
      })
      .slice(0, 10);
  }, [clientSearch, isNewClient, clients]);

  useEffect(() => {
    if (type === 'reservations' && formData.car_id) {
      const carMatricules = matricules.filter(m => m.car_id == formData.car_id);
      setCarMatricules(carMatricules);
    }
  }, [formData.car_id, matricules, type]);

  // ✅ FIXED: Optimized maintenance fields effect
  useEffect(() => {
    // Only update if values have changed
    const shouldUpdate = 
      maintenanceFields.oil !== formData.oil ||
      maintenanceFields.filter_oil !== formData.filter_oil ||
      JSON.stringify(additionalMaintenance) !== JSON.stringify(formData.additional_maintenance) ||
      JSON.stringify(periodicKmMaintenance) !== JSON.stringify(formData.periodic_km_maintenance);

    if (!shouldUpdate) return;

    // Vidange now depends ONLY on oil and filter_oil
    const requiredForVidangeDone = 
      maintenanceFields.oil === 'yes' &&
      maintenanceFields.filter_oil === 'yes';
    
    // Check additional maintenance items that are required_for_vidange
    const additionalRequiredItems = additionalMaintenance.filter(item => 
      item.required_for_vidange
    );
    
    const allAdditionalRequiredDone = additionalRequiredItems.every(item => {
      if (item.type === 'quantity') {
        return item.value && parseFloat(item.value) > 0;
      } else if (item.type === 'note') {
        return !item.needs_attention;
      } else {
        return true; // periodic_km handled separately
      }
    });
    
    // Check periodic km maintenance items that are required_for_vidange
    const periodicRequiredItems = periodicKmMaintenance.filter(item => 
      item.required_for_vidange
    );
    
    const allPeriodicRequiredDone = periodicRequiredItems.every(item => {
      return !item.needs_attention;
    });
    
    const allRequiredDone = requiredForVidangeDone && allAdditionalRequiredDone && allPeriodicRequiredDone;
    const newVidangeStatus = allRequiredDone ? 'done' : 'not done';
    
    setFormData(prev => ({
      ...prev,
      vidange_status: newVidangeStatus,
      // Paquets de Voiture
      paquets_de_voiture: maintenanceFields.paquets_de_voiture,
      paquets_de_voiture_date: maintenanceFields.paquets_de_voiture_date,
      paquets_de_voiture_count: maintenanceFields.paquets_de_voiture_count,
      paquets_de_voiture_history: maintenanceFields.paquets_de_voiture_history,
      
      // Paquets de Frein
      paquets_de_frein: maintenanceFields.paquets_de_frein,
      paquets_de_frein_date: maintenanceFields.paquets_de_frein_date,
      paquets_de_frein_count: maintenanceFields.paquets_de_frein_count,
      paquets_de_frein_history: maintenanceFields.paquets_de_frein_history,
      
      // Filter Oil
      filter_oil: maintenanceFields.filter_oil,
      filter_oil_date: maintenanceFields.filter_oil_date,
      filter_oil_count: maintenanceFields.filter_oil_count,
      filter_oil_history: maintenanceFields.filter_oil_history,
      
      // Filter Air
      filter_air: maintenanceFields.filter_air,
      filter_air_date: maintenanceFields.filter_air_date,
      filter_air_count: maintenanceFields.filter_air_count,
      filter_air_history: maintenanceFields.filter_air_history,
      
      // Ad Blue
      ad_blue: maintenanceFields.ad_blue,
      ad_blue_date: maintenanceFields.ad_blue_date,
      ad_blue_quantity: maintenanceFields.ad_blue_quantity,
      ad_blue_history: maintenanceFields.ad_blue_history,
      
      // Oil
      oil: maintenanceFields.oil,
      oil_date: maintenanceFields.oil_date,
      oil_quantity: maintenanceFields.oil_quantity,
      oil_history: maintenanceFields.oil_history,
      
      // Additional maintenance
      additional_maintenance: additionalMaintenance,
      
      // Periodic km maintenance
      periodic_km_maintenance: periodicKmMaintenance
    }));
  }, [maintenanceFields, additionalMaintenance, periodicKmMaintenance, setFormData]);

  // ✅ FIXED: Optimized accident status effect
  useEffect(() => {
    if (type === 'accidents') {
      const shouldShowExpertFields = 
        formData.status === 'evaluation_expert' || 
        formData.status === 'contact expert' ||
        (formData.accident_type === 'grave' && 
         (formData.status === 'evaluation_owner' || formData.status === 'pending'));
      
      setShowExpertFields(shouldShowExpertFields);

      if (formData.status === 'evaluation_expert' && !formData.expert_decision) {
        handleChange('expert_decision', 'pending');
      }
    }
  }, [formData.status, formData.accident_type, formData.expert_decision, type]);

  // ✅ FIXED: Optimized matricule kilometer effect
  useEffect(() => {
    if (type === 'reservations' && formData.matricule_id) {
      const selectedMatricule = matricules.find(m => m.id == formData.matricule_id);
      if (selectedMatricule) {
        const shouldAutoFill = 
          modalType === 'create' || 
          !formData.kilometrage_sortie || 
          formData.kilometrage_sortie === 0;
        
        if (shouldAutoFill) {
          const startKilometer = selectedMatricule.kilometrage;
          
          if (!formData.kilometrage_sortie || formData.kilometrage_sortie !== startKilometer) {
            handleChange('kilometrage_sortie', startKilometer);
          }
        }
      }
    }
  }, [formData.matricule_id, matricules, type, modalType]);

  // ✅ FIXED: Optimized kilometer value effect
  useEffect(() => {
    if (type === 'matricules' && formData.kilometrage !== oldKilometerValue) {
      setOldKilometerValue(formData.kilometrage || 0);
    }
  }, [type, formData.kilometrage]);

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // ✅ FIXED: Combine initialization into a single optimized useEffect
  useEffect(() => {
    if (modalType === 'edit' && type === 'matricules') {
      // Format dates
      const formattedVisitTech = formatDateForInput(formData.visit_tech);
      const formattedTaxeVoiture = formatDateForInput(formData.date_taxe_voiture);
      const formattedAssurance = formatDateForInput(formData.date_assurance);
      
      // Only update if dates are different
      if (formData.visit_tech !== formattedVisitTech || 
          formData.date_taxe_voiture !== formattedTaxeVoiture ||
          formData.date_assurance !== formattedAssurance) {
        
        const updatedFormData = {
          ...formData,
          visit_tech: formattedVisitTech,
          date_taxe_voiture: formattedTaxeVoiture,
          date_assurance: formattedAssurance,
        };
        
        setFormData(updatedFormData);
      }
      
      // Initialize maintenance fields once
      setMaintenanceFields(prev => {
        const hasOilDate = formatDateForInput(formData.oil_date);
        if (prev.oil_date === hasOilDate) return prev;
        
        return {
          ...prev,
          paquets_de_voiture: formData.paquets_de_voiture || 'no',
          paquets_de_voiture_date: formatDateForInput(formData.paquets_de_voiture_date),
          paquets_de_voiture_count: formData.paquets_de_voiture_count || 0,
          paquets_de_voiture_history: formData.paquets_de_voiture_history || [],
          
          paquets_de_frein: formData.paquets_de_frein || 'no',
          paquets_de_frein_date: formatDateForInput(formData.paquets_de_frein_date),
          paquets_de_frein_count: formData.paquets_de_frein_count || 0,
          paquets_de_frein_history: formData.paquets_de_frein_history || [],
          
          filter_oil: formData.filter_oil || 'no',
          filter_oil_date: formatDateForInput(formData.filter_oil_date),
          filter_oil_count: formData.filter_oil_count || 0,
          filter_oil_history: formData.filter_oil_history || [],
          
          filter_air: formData.filter_air || 'no',
          filter_air_date: formatDateForInput(formData.filter_air_date),
          filter_air_count: formData.filter_air_count || 0,
          filter_air_history: formData.filter_air_history || [],
          
          ad_blue: formData.ad_blue || 'no',
          ad_blue_date: formatDateForInput(formData.ad_blue_date),
          ad_blue_quantity: formData.ad_blue_quantity || 0,
          ad_blue_history: formData.ad_blue_history || [],
          
          oil: formData.oil || 'no',
          oil_date: formatDateForInput(formData.oil_date),
          oil_quantity: formData.oil_quantity || 0,
          oil_history: formData.oil_history || [],
        };
      });
    }
  }, [modalType, type]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMaintenanceFieldChange = (field, value) => {
    setMaintenanceFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showStyledAlert = (message) => {
    setAlertMessage(message);
    setShowCustomAlert(true);
  };

  const CustomAlert = ({ message, onClose }) => {
    return (
      <>
        <div className="alert-overlay" onClick={onClose} />
        <div className="custom-alert">
          <div className="custom-alert-content">
            <div className="custom-alert-icon">
              <FaExclamationTriangle />
            </div>
            <h3 className="custom-alert-title">Alerte de Kilométrage</h3>
            <p className="custom-alert-message">{message}</p>
            <div className="custom-alert-details">
              <strong>Action effectuée:</strong><br />
              Les éléments de maintenance requis (Huile et Filtre à Huile) ont été réinitialisés à "Non effectué"
            </div>
            <button className="custom-alert-close" onClick={onClose}>
              Compris
            </button>
          </div>
        </div>
      </>
    );
  };

  const checkKilometerIncrease = (newKilometer) => {
    const increase = newKilometer - oldKilometerValue;
    return increase >= 10000;
  };

  const handleMatriculeKilometerChange = (value) => {
    const kmValue = parseInt(value) || 0;
    
    handleChange('kilometrage', kmValue);
    
    if (checkKilometerIncrease(kmValue) && oldKilometerValue > 0) {
      setMaintenanceFields(prev => ({
        ...prev,
        oil: 'no',
        oil_date: '',
        oil_quantity: 0,
        oil_history: [],
        filter_oil: 'no',
        filter_oil_date: '',
        filter_oil_count: 0,
        filter_oil_history: []
      }));
      
      setTimeout(() => {
        showStyledAlert(`Augmentation de kilométrage significative détectée (${kmValue - oldKilometerValue} km depuis le dernier enregistrement). Les éléments de maintenance requis (Huile et Filtre à Huile) ont été réinitialisés à "Non effectué".`);
      }, 100);
    }
    
    // Update periodic km maintenance status
    const updatedPeriodicMaintenance = periodicKmMaintenance.map(item => {
      if (kmValue >= item.next_change_km) {
        return { ...item, needs_attention: true };
      }
      return item;
    });
    setPeriodicKmMaintenance(updatedPeriodicMaintenance);
    
    const shouldSyncDeparture = 
      modalType === 'create' || 
      !formData.kilometrage_sortie || 
      formData.kilometrage_sortie === 0;
    
    if (shouldSyncDeparture) {
      handleChange('kilometrage_sortie', kmValue);
    }
  };

  const handleKilometrageEntreeChange = (value) => {
    const kmValue = parseInt(value) || 0;
    const departureKm = formData.kilometrage_sortie || 0;
    
    handleChange('kilometrage_entree', kmValue);
    
    if (departureKm > 0 && kmValue > departureKm) {
      const distanceParcourue = kmValue - departureKm;
      const departureBase10k = Math.floor(departureKm / 10000) * 10000;
      const returnBase10k = Math.floor(kmValue / 10000) * 10000;
      
      const shouldReset = distanceParcourue >= 10000 || returnBase10k > departureBase10k;
      
      if (shouldReset) {
        setTimeout(() => {
          let alertMessage = '';
          
          if (distanceParcourue >= 10000) {
            alertMessage = `Distance parcourue: ${distanceParcourue} km (≥ 10,000 km). Les éléments de maintenance requis (Huile et Filtre à Huile) seront réinitialisés à "Non effectué".`;
          } else {
            alertMessage = `Passage du bloc ${departureBase10k} km à ${returnBase10k} km. Les éléments de maintenance requis (Huile et Filtre à Huile) seront réinitialisés à "Non effectué".`;
          }
          
          showStyledAlert(alertMessage);
        }, 100);
      }
    }
    
    handleChange('matricule_current_kilometer_update', kmValue);
    handleChange('matricule_kilometrage_entree_update', kmValue);
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setIsNewClient(false);
    setFormData(prev => ({
      ...prev,
      client_id: client.id,
      nom: client.nom,
      prenom: client.prenom,
      telephone: client.telephone,
      email: client.email,
      city: client.city,
      cin_number: client.cin_number || '',
      driver_license_number: client.driver_license_number || '',
      cin_image: client.cin_image || '',
      driver_license_image: client.driver_license_image || '',
      date_naissance: client.date_naissance || '',
      lieu_naissance: client.lieu_naissance || '',
      cin_delivre_le: client.cin_delivre_le || '',
      permis_delivre_le: client.permis_delivre_le || ''
    }));
    setClientSearch(`${client.prenom} ${client.nom}`);
  };

  const handleNewClient = () => {
    setSelectedClient(null);
    setIsNewClient(true);
    
    // Also clear the client search to avoid confusion
    setClientSearch('');
    
    setFormData(prev => ({
      ...prev,
      client_id: '', // Clear any existing client ID
      nom: '',
      prenom: '',
      telephone: '',
      email: '',
      city: '',
      cin_number: '',
      driver_license_number: '',
      cin_image: '',
      driver_license_image: '',
      date_naissance: '',
      lieu_naissance: '',
      cin_delivre_le: '',
      permis_delivre_le: ''
    }));
  };

  const handleViewFile = (fileUrl, isPdf = false) => {
    if (!fileUrl) return;
    
    // If fileUrl is an object (from multiple uploads), extract the data
    if (typeof fileUrl === 'object' && fileUrl.data) {
      const actualIsPdf = isPdf || fileUrl.isPdf || isPdfFile(fileUrl);
      handleViewFile(fileUrl.data, actualIsPdf);
      return;
    }
    
    // Check if it's actually a PDF
    const actualIsPdf = isPdf || isPdfFile(fileUrl);
    
    // Handle data URLs
    if (typeof fileUrl === 'string' && fileUrl.startsWith('data:')) {
      const win = window.open();
      
      if (actualIsPdf) {
        // For PDF data URLs
        try {
          win.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>PDF Preview</title>
                <style>
                  body { 
                    margin: 0; 
                    padding: 0; 
                    height: 100vh; 
                    overflow: hidden; 
                    background: #f5f5f5;
                  }
                  .pdf-container { 
                    width: 100%; 
                    height: 100vh; 
                    display: flex; 
                    flex-direction: column;
                  }
                  .pdf-header {
                    padding: 10px;
                    background: #333;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                  }
                  .pdf-frame {
                    flex: 1;
                    border: none;
                  }
                </style>
              </head>
              <body>
                <div class="pdf-container">
                  <div class="pdf-header">
                    <span>PDF Document</span>
                    <button onclick="window.print()" style="padding: 5px 10px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">Imprimer</button>
                  </div>
                  <iframe 
                    class="pdf-frame" 
                    src="${fileUrl}"
                    title="PDF Preview"
                  ></iframe>
                </div>
              </body>
            </html>
          `);
        } catch (error) {
          console.error('Error displaying PDF:', error);
          win.close();
          alert('Erreur lors de l\'affichage du PDF. Veuillez vérifier le format du fichier.');
        }
      } else if (fileUrl.startsWith('data:image')) {
        // For image data URLs
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Image Preview</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 0; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  height: 100vh; 
                  background: #f5f5f5;
                }
                .img-container { 
                  max-width: 90vw; 
                  max-height: 90vh; 
                  padding: 20px;
                  text-align: center;
                }
                img { 
                  max-width: 100%; 
                  max-height: 100%; 
                  object-fit: contain;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                  border-radius: 8px;
                }
                .controls {
                  margin-top: 10px;
                }
                button {
                  padding: 5px 15px;
                  background: #dc2626;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  margin: 0 5px;
                }
              </style>
            </head>
            <body>
              <div class="img-container">
                <img src="${fileUrl}" alt="Preview" id="previewImage" />
                <div class="controls">
                  <button onclick="window.print()">Imprimer</button>
                  <button onclick="window.close()">Fermer</button>
                </div>
              </div>
            </body>
          </html>
        `);
      } else {
        win.close();
        alert('Ce format de fichier ne peut pas être prévisualisé directement. Veuillez télécharger le fichier.');
      }
    } else if (typeof fileUrl === 'string' && (fileUrl.startsWith('http') || fileUrl.startsWith('https') || fileUrl.startsWith('/'))) {
      // For regular URLs or file paths
      window.open(fileUrl, '_blank');
    } else {
      // For unsupported formats
      alert('Ce format de fichier ne peut pas être prévisualisé directement. Veuillez télécharger le fichier.');
    }
  };

  const handleImageUpload = (field, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      handleChange(field, e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleMultipleImageUpload = (field, files) => {
    const readers = [];
    const uploadedFiles = [];
    
    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      readers.push(reader);
      
      reader.onload = (e) => {
        const fileInfo = {
          data: e.target.result,
          name: file.name,
          type: file.type,
          isPdf: file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        };
        
        uploadedFiles.push(fileInfo);
        
        if (uploadedFiles.length === files.length) {
          const currentFiles = formData[field] || [];
          const fileDataUrls = uploadedFiles.map(fileInfo => fileInfo.data);
          
          handleChange(field, [...currentFiles, ...fileDataUrls]);
          
          const currentFileInfos = formData[`${field}_infos`] || [];
          handleChange(`${field}_infos`, [...currentFileInfos, ...uploadedFiles]);
        }
      };
      
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  };

  const handleImageDelete = (field, imageIndex) => {
    const currentImages = formData[field] || [];
    const updatedImages = currentImages.filter((_, index) => index !== imageIndex);
    handleChange(field, updatedImages);
  };

  const handleSingleImageDelete = (field) => {
    handleChange(field, '');
  };

  const calculateEndDateFromRentalDays = (startDate, rentalDays) => {
    if (!startDate || !rentalDays) return '';
    
    const start = new Date(startDate);
    const endDate = new Date(start);
    
    endDate.setDate(start.getDate() + parseInt(rentalDays));
    
    return endDate.toISOString().split('T')[0];
  };

  const calculateRentalDaysFromDates = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    start.setHours(12, 0, 0, 0);
    end.setHours(12, 0, 0, 0);
    
    const diffTime = end - start;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, diffDays);
  };

  const handleStartDateChange = (value) => {
    handleChange('start_date', value);
    
    if (value && formData.rental_days) {
      const newEndDate = calculateEndDateFromRentalDays(value, formData.rental_days);
      handleChange('end_date', newEndDate);
    }
  };

  const handleEndDateChange = (value) => {
    handleChange('end_date', value);
    
    if (formData.start_date && value) {
      const newRentalDays = calculateRentalDaysFromDates(formData.start_date, value);
      handleChange('rental_days', newRentalDays);
    }
  };

  const handleRentalDaysChange = (value) => {
    const rentalDays = parseInt(value) || 0;
    handleChange('rental_days', rentalDays);
    
    if (formData.start_date && rentalDays > 0) {
      const newEndDate = calculateEndDateFromRentalDays(formData.start_date, rentalDays);
      handleChange('end_date', newEndDate);
    }
  };

  const handleDateCalculation = () => {
    if (formData.car_id && formData.rental_days) {
      const car = cars.find(c => c.id == formData.car_id);
      if (car) {
        const days = formData.rental_days;
        const totalPrice = days * car.price_per_day;
        handleChange('total_price', totalPrice);
        handleChange('remaining_amount', totalPrice - (formData.amount_paid || 0));
      }
    }
  };

  // ✅ FIXED: Optimized rental days calculation
  useEffect(() => {
    if (type === 'reservations' && modalType === 'edit' && formData.start_date && formData.end_date) {
      const calculatedDays = calculateRentalDaysFromDates(formData.start_date, formData.end_date);
      
      if (formData.rental_days !== calculatedDays) {
        handleChange('rental_days', calculatedDays);
      }
    }
  }, [type, modalType, formData.start_date, formData.end_date]);

  // ✅ FIXED: Optimized date calculation effect
  useEffect(() => {
    handleDateCalculation();
  }, [formData.start_date, formData.end_date, formData.rental_days, formData.car_id]);

  const handleAddPayment = () => {
    if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    const payment = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: parseFloat(newPayment.amount),
      date: newPayment.date,
      method: newPayment.method,
      notes: newPayment.method === 'forgiven' 
        ? (newPayment.notes || 'Montant pardonné') 
        : newPayment.notes,
      created_at: new Date().toISOString()
    };

    const updatedPaymentHistory = [...(formData.payment_history || []), payment];
    
    const newAmountPaid = updatedPaymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
    const newRemainingAmount = (formData.total_price || 0) - newAmountPaid;

    setFormData(prev => ({
      ...prev,
      payment_history: updatedPaymentHistory,
      amount_paid: newAmountPaid,
      remaining_amount: newRemainingAmount
    }));

    setNewPayment({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      method: 'cash',
      notes: ''
    });
    setShowAddPayment(false);
  };

  const handleRemovePayment = (paymentId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement?')) {
      return;
    }

    const updatedPaymentHistory = formData.payment_history.filter(payment => payment.id !== paymentId);
    
    const newAmountPaid = updatedPaymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
    const newRemainingAmount = (formData.total_price || 0) - newAmountPaid;

    setFormData(prev => ({
      ...prev,
      payment_history: updatedPaymentHistory,
      amount_paid: newAmountPaid,
      remaining_amount: newRemainingAmount
    }));
  };

  const handleRemoveMaintenanceItem = (itemId) => {
    const item = additionalMaintenance.find(item => item.id === itemId);
    const periodicItem = periodicKmMaintenance.find(item => item.id === itemId);
    
    if (!item && !periodicItem) return;

    const itemName = item ? item.name : periodicItem.name;
    
    const alertOverlay = document.createElement('div');
    alertOverlay.className = 'alert-overlay';
    
    const alertContent = document.createElement('div');
    alertContent.className = 'custom-alert-content';
    
    alertContent.innerHTML = `
  <div class="custom-alert-icon">
    <span>⚠️</span>
  </div>
  <h3>Confirmer la suppression</h3>
  <p>Êtes-vous sûr de vouloir supprimer l'élément <strong>"${itemName}"</strong> ?</p>
  <p class="warning-text">Cette action est irréversible !</p>
  <div class="alert-actions">
    <button class="btn-cancel">Annuler</button>
    <button class="btn-confirm-delete">Supprimer</button>
  </div>
`;
    
    const customAlert = document.createElement('div');
    customAlert.className = 'custom-delete-alert';
    customAlert.appendChild(alertOverlay);
    customAlert.appendChild(alertContent);
    
    const cancelBtn = alertContent.querySelector('.btn-cancel');
    const confirmBtn = alertContent.querySelector('.btn-confirm-delete');
    
    const removeAlert = () => {
      if (document.body.contains(customAlert)) {
        document.body.removeChild(customAlert);
      }
    };
    
    const handleCancel = () => removeAlert();
    const handleConfirm = () => {
      if (item) {
        const updatedMaintenance = additionalMaintenance.filter(item => item.id !== itemId);
        setAdditionalMaintenance(updatedMaintenance);
        handleChange('additional_maintenance', updatedMaintenance);
      } else if (periodicItem) {
        const updatedMaintenance = periodicKmMaintenance.filter(item => item.id !== itemId);
        setPeriodicKmMaintenance(updatedMaintenance);
        handleChange('periodic_km_maintenance', updatedMaintenance);
      }
      
      removeAlert();
    };
    
    cancelBtn.addEventListener('click', handleCancel);
    alertOverlay.addEventListener('click', handleCancel);
    confirmBtn.addEventListener('click', handleConfirm);
    
    document.body.appendChild(customAlert);
  };

  const handleAddMaintenanceItem = () => {
    if (!newMaintenanceItem.name.trim()) {
      alert('Veuillez entrer un nom pour l\'élément de maintenance');
      return;
    }

    if (newMaintenanceItem.type === 'quantity' && (!newMaintenanceItem.value || parseFloat(newMaintenanceItem.value) <= 0)) {
      alert('Veuillez entrer une quantité valide');
      return;
    }

    if (newMaintenanceItem.type === 'periodic_km' && (!newMaintenanceItem.interval_km || parseFloat(newMaintenanceItem.interval_km) <= 0)) {
      alert('Veuillez entrer un intervalle de kilométrage valide');
      return;
    }

    const currentKm = formData.kilometrage || 0;

    if (newMaintenanceItem.type === 'periodic_km') {
      const intervalKm = parseFloat(newMaintenanceItem.interval_km);
      const currentKm = parseFloat(formData.kilometrage) || 0;
      
      const item = {
        id: `periodic_km_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newMaintenanceItem.name.trim(),
        type: newMaintenanceItem.type,
        interval_km: intervalKm,
        last_changed_km: currentKm,
        next_change_km: currentKm + intervalKm,
        notes: newMaintenanceItem.notes || '',
        required_for_vidange: newMaintenanceItem.required_for_vidange || false,
        needs_attention: false,
        change_history: [],
        change_count: 0,
        last_changed_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const updatedMaintenance = [...periodicKmMaintenance, item];
      setPeriodicKmMaintenance(updatedMaintenance);
      handleChange('periodic_km_maintenance', updatedMaintenance);
    } else {
      const item = {
        id: `maintenance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newMaintenanceItem.name.trim(),
        type: newMaintenanceItem.type,
        value: newMaintenanceItem.type === 'quantity' ? parseFloat(newMaintenanceItem.value) : newMaintenanceItem.value,
        notes: newMaintenanceItem.notes || '',
        required_for_vidange: newMaintenanceItem.required_for_vidange || false,
        needs_attention: newMaintenanceItem.needs_attention || false,
        due_date: newMaintenanceItem.due_date || null,
        last_done_date: newMaintenanceItem.last_done_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updatedMaintenance = [...additionalMaintenance, item];
      setAdditionalMaintenance(updatedMaintenance);
      handleChange('additional_maintenance', updatedMaintenance);
    }

    setNewMaintenanceItem({
      name: '',
      type: 'note',
      value: '',
      interval_km: '',
      notes: '',
      required_for_vidange: false,
      needs_attention: false,
      due_date: '',
      last_done_date: ''
    });
    setShowAddMaintenance(false);
  };

  const handleEditMaintenanceItem = (item) => {
    setEditingMaintenanceItem(item);
    setNewMaintenanceItem({
      name: item.name,
      type: item.type,
      value: item.type === 'periodic_km' ? '' : item.value,
      interval_km: item.type === 'periodic_km' ? item.interval_km : '',
      notes: item.notes || '',
      required_for_vidange: item.required_for_vidange || false,
      needs_attention: item.needs_attention || false,
      due_date: item.due_date || '',
      last_done_date: item.last_done_date || ''
    });
    setShowAddMaintenance(true);
  };

  const handleUpdateMaintenanceItem = () => {
    if (!newMaintenanceItem.name.trim()) {
        alert('Veuillez entrer un nom pour l\'élément de maintenance');
        return;
    }

    if (newMaintenanceItem.type === 'quantity' && (!newMaintenanceItem.value || parseFloat(newMaintenanceItem.value) <= 0)) {
        alert('Veuillez entrer une quantité valide');
        return;
    }

    if (newMaintenanceItem.type === 'periodic_km' && (!newMaintenanceItem.interval_km || parseFloat(newMaintenanceItem.interval_km) <= 0)) {
        alert('Veuillez entrer un intervalle de kilométrage valide');
        return;
    }

    const currentKm = formData.kilometrage || 0;

    // Determine if we're switching types
    const isSwitchingToPeriodic = editingMaintenanceItem.type !== 'periodic_km' && newMaintenanceItem.type === 'periodic_km';
    const isSwitchingFromPeriodic = editingMaintenanceItem.type === 'periodic_km' && newMaintenanceItem.type !== 'periodic_km';

    if (editingMaintenanceItem.type === 'periodic_km' || newMaintenanceItem.type === 'periodic_km') {
        if (isSwitchingFromPeriodic) {
            // Moving FROM periodic_km to another type
            // Remove from periodic maintenance and add to additional maintenance
            const updatedPeriodicMaintenance = periodicKmMaintenance.filter(item => 
                item.id !== editingMaintenanceItem.id
            );
            setPeriodicKmMaintenance(updatedPeriodicMaintenance);
            handleChange('periodic_km_maintenance', updatedPeriodicMaintenance);
            
            // Add as new additional maintenance item
            const newAdditionalItem = {
                id: editingMaintenanceItem.id, // Keep same ID
                name: newMaintenanceItem.name.trim(),
                type: newMaintenanceItem.type,
                value: newMaintenanceItem.type === 'quantity' ? parseFloat(newMaintenanceItem.value) : newMaintenanceItem.value,
                notes: newMaintenanceItem.notes || '',
                required_for_vidange: newMaintenanceItem.required_for_vidange || false,
                needs_attention: newMaintenanceItem.needs_attention || false,
                due_date: newMaintenanceItem.due_date || null,
                last_done_date: newMaintenanceItem.last_done_date || null,
                created_at: editingMaintenanceItem.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const updatedAdditionalMaintenance = [...additionalMaintenance, newAdditionalItem];
            setAdditionalMaintenance(updatedAdditionalMaintenance);
            handleChange('additional_maintenance', updatedAdditionalMaintenance);
            
        } else if (isSwitchingToPeriodic) {
            // Moving TO periodic_km from another type
            // Remove from additional maintenance and add to periodic maintenance
            const updatedAdditionalMaintenance = additionalMaintenance.filter(item => 
                item.id !== editingMaintenanceItem.id
            );
            setAdditionalMaintenance(updatedAdditionalMaintenance);
            handleChange('additional_maintenance', updatedAdditionalMaintenance);
            
            // Add as new periodic maintenance item
            const newPeriodicItem = {
                id: editingMaintenanceItem.id, // Keep same ID
                name: newMaintenanceItem.name.trim(),
                type: newMaintenanceItem.type,
                interval_km: parseFloat(newMaintenanceItem.interval_km),
                last_changed_km: currentKm,
                next_change_km: currentKm + parseFloat(newMaintenanceItem.interval_km),
                notes: newMaintenanceItem.notes || '',
                required_for_vidange: newMaintenanceItem.required_for_vidange || false,
                needs_attention: false, // Starts as not needing attention
                change_history: [],
                change_count: 0,
                last_changed_date: null,
                created_at: editingMaintenanceItem.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const updatedPeriodicMaintenance = [...periodicKmMaintenance, newPeriodicItem];
            setPeriodicKmMaintenance(updatedPeriodicMaintenance);
            handleChange('periodic_km_maintenance', updatedPeriodicMaintenance);
            
        } else {
            // Updating within same type (periodic_km)
            const updatedPeriodicMaintenance = periodicKmMaintenance.map(item => 
                item.id === editingMaintenanceItem.id
                    ? {
                        ...item,
                        name: newMaintenanceItem.name.trim(),
                        type: newMaintenanceItem.type,
                        interval_km: parseFloat(newMaintenanceItem.interval_km),
                        notes: newMaintenanceItem.notes || '',
                        required_for_vidange: newMaintenanceItem.required_for_vidange || false,
                        needs_attention: newMaintenanceItem.needs_attention || false,
                        updated_at: new Date().toISOString(),
                        // Recalculate next change km if interval changed
                        next_change_km: item.last_changed_km + parseFloat(newMaintenanceItem.interval_km)
                    }
                    : item
            );
            
            setPeriodicKmMaintenance(updatedPeriodicMaintenance);
            handleChange('periodic_km_maintenance', updatedPeriodicMaintenance);
        }
    } else {
        // Updating within same type (not periodic_km)
        const updatedAdditionalMaintenance = additionalMaintenance.map(item => 
            item.id === editingMaintenanceItem.id
                ? {
                    ...item,
                    name: newMaintenanceItem.name.trim(),
                    type: newMaintenanceItem.type,
                    value: newMaintenanceItem.type === 'quantity' ? parseFloat(newMaintenanceItem.value) : newMaintenanceItem.value,
                    notes: newMaintenanceItem.notes || '',
                    required_for_vidange: newMaintenanceItem.required_for_vidange || false,
                    needs_attention: newMaintenanceItem.needs_attention || false,
                    due_date: newMaintenanceItem.due_date || null,
                    last_done_date: newMaintenanceItem.last_done_date || null,
                    updated_at: new Date().toISOString()
                }
                : item
        );
        
        setAdditionalMaintenance(updatedAdditionalMaintenance);
        handleChange('additional_maintenance', updatedAdditionalMaintenance);
    }

    // Clear form
    setNewMaintenanceItem({
        name: '',
        type: 'note',
        value: '',
        interval_km: '',
        notes: '',
        required_for_vidange: false,
        needs_attention: false,
        due_date: '',
        last_done_date: ''
    });
    setEditingMaintenanceItem(null);
    setShowAddMaintenance(false);
};

  const handleAdditionalMaintenanceDateChange = (itemId, date) => {
    const updatedMaintenance = additionalMaintenance.map(item => 
      item.id === itemId 
        ? { ...item, last_done_date: date }
        : item
    );
    setAdditionalMaintenance(updatedMaintenance);
    handleChange('additional_maintenance', updatedMaintenance);
  };

  const handleAccidentTypeChange = (value) => {
    handleChange('accident_type', value);
    if (value === 'non_grave') {
      handleChange('procedure_type', 'classic');
    }
  };

  const [timeOverride, setTimeOverride] = useState({
  start_time: null,
  end_time: null
});
const [isTimeManuallySet, setIsTimeManuallySet] = useState(false);


// Ajoutez cet useEffect pour gérer la logique de changement d'heure basé sur le statut
// Remplacer l'effet actuel par :
// ✅ FIXED: Update the status change effect to properly handle confirmed→completed
useEffect(() => {
  if (type === 'reservations' && modalType === 'edit') {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    
    const formatTime = (hours, minutes) => {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };
    
    // Check if we're changing status from confirmed to completed
    if (formData.status === 'completed' && formData.previousStatus === 'confirmed') {
      // If the status is completed and it was previously confirmed, set end_time to current time
      // This should only happen once per status change
      if (!timeOverride.end_time || timeOverride.end_time === formData.end_time) {
        const newEndTime = formatTime(currentHour, currentMinute);
        
        // Update the time override
        setTimeOverride(prev => ({
          ...prev,
          end_time: newEndTime
        }));
        
        // Update form data
        handleChange('end_time', newEndTime);
      }
    } else if (formData.status === 'confirmed') {
      // If status becomes "confirmed" for the first time, set both times to current time
      if (!formData.start_time || formData.start_time === '08:00') {
        const newTime = formatTime(currentHour, currentMinute);
        
        handleChange('start_time', newTime);
        handleChange('end_time', newTime);
        
        // Mark that the time has been automatically set
        setTimeOverride({
          start_time: newTime,
          end_time: newTime
        });
      }
    }
    
    // Always update previousStatus for future comparisons
    if (formData.status !== formData.previousStatus) {
      handleChange('previousStatus', formData.status);
    }
  }
}, [formData.status, type, modalType]);

// ✅ FIXED: Initialize time override when editing an existing reservation
useEffect(() => {
  if (modalType === 'edit' && type === 'reservations') {
    // Initialize time override with existing values
    setTimeOverride({
      start_time: formData.start_time || '08:00',
      end_time: formData.end_time || '18:00'
    });
    
    // Initialize previousStatus if not set
    if (!formData.previousStatus) {
      handleChange('previousStatus', formData.status);
    }
  }
}, [modalType, type]);

// ✅ FIXED: Update the status change handler to preserve time override
const handleStatusChange = (value) => {
  const previousStatus = formData.status;
  
  // Special handling for confirmed→completed transition
  if (previousStatus === 'confirmed' && value === 'completed') {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const formattedTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    // Update form data with new status and end_time
    setFormData(prev => ({ 
      ...prev, 
      status: value,
      previousStatus: previousStatus,
      end_time: formattedTime
    }));
    
    // Update time override
    setTimeOverride(prev => ({
      ...prev,
      end_time: formattedTime
    }));
  } else {
    // Normal status change
    setFormData(prev => ({ 
      ...prev, 
      status: value,
      previousStatus: previousStatus
    }));
  }
};

// ✅ FIXED: Update end time change handler to respect override
const handleEndTimeChange = (value) => {
  // If time was automatically set by status change to completed,
  // allow manual override but update the override state
  if (formData.status === 'completed' && formData.previousStatus === 'confirmed') {
    // User is manually changing the automatically set time
    setTimeOverride(prev => ({ ...prev, end_time: value }));
  }
  handleChange('end_time', value);
};

  const getRequiredImagesForStatus = () => {
    const { status, procedure_type } = formData;
    
    if (procedure_type === 'forphie') {
      return ['img_accident'];
    }

    switch (status) {
      case 'pending':
      case 'evaluation_owner':
        return ['img_accident'];
      case 'contact expert':
      case 'evaluation_expert':
        return ['img_accident', 'img_evaluation_expert'];
      case 'fixed':
        return ['img_accident', 'img_fixed'];
      case 'waiting':
      case 'completed':
        return ['img_accident', 'img_fixed', 'image_facture'];
      default:
        return ['img_accident'];
    }
  };

  // NEW: Quantity handling functions
  const handleAddQuantity = (type) => {
    setQuantityType(type);
    setQuantityData({
      quantity: type === 'oil' || type === 'ad_blue' ? '' : '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowQuantityModal(true);
  };

  const handleSubmitQuantity = () => {
  if (!quantityData.date) {
    alert('Veuillez sélectionner une date');
    return;
  }

  // Check if this is a custom quantity item
  if (quantityType.startsWith('custom_')) {
    const itemId = quantityType.replace('custom_', '');
    const item = additionalMaintenance.find(item => item.id === itemId);
    
    if (item && item.type === 'quantity') {
      if (!quantityData.quantity || parseFloat(quantityData.quantity) <= 0) {
        alert('Veuillez entrer une quantité valide');
        return;
      }

      // Create a history entry
      const newEntry = {
        id: `${itemId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: quantityData.date,
        quantity: parseFloat(quantityData.quantity),
        created_at: new Date().toISOString(),
        kilometrage: formData.kilometrage || 0
      };

      // Update the item
      const updatedMaintenance = additionalMaintenance.map(mainItem => 
        mainItem.id === itemId 
          ? { 
              ...mainItem, 
              value: (parseFloat(mainItem.value) || 0) + parseFloat(quantityData.quantity),
              last_done_date: quantityData.date
            }
          : mainItem
      );
      
      setAdditionalMaintenance(updatedMaintenance);
      handleChange('additional_maintenance', updatedMaintenance);
      
      // Also update history if we decide to store it
      // For now, we'll just update the main item
      
      setShowQuantityModal(false);
      return;
    }
  }

  // Original handling for standard quantity types
  if ((quantityType === 'oil' || quantityType === 'ad_blue') && (!quantityData.quantity || parseFloat(quantityData.quantity) <= 0)) {
    alert('Veuillez entrer une quantité valide');
    return;
  }

  // Create a new history entry
  const newEntry = {
    id: `${quantityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date: quantityData.date,
    created_at: new Date().toISOString(),
    kilometrage: formData.kilometrage || 0
  };

  // Add quantity for oil and ad_blue
  if (quantityType === 'oil' || quantityType === 'ad_blue') {
    newEntry.quantity = parseFloat(quantityData.quantity);
  }

  // Update the maintenance fields
  setMaintenanceFields(prev => {
    const historyField = `${quantityType}_history`;
    const quantityField = `${quantityType}_quantity`;
    const countField = `${quantityType}_count`;
    
    const currentHistory = prev[historyField] || [];
    const updatedHistory = [...currentHistory, newEntry];
    
    const updatedFields = {
      ...prev,
      [historyField]: updatedHistory,
      [`${quantityType}_date`]: quantityData.date,
      [quantityType]: 'yes'
    };

    // Update totals
    if (quantityType === 'oil' || quantityType === 'ad_blue') {
      updatedFields[quantityField] = (prev[quantityField] || 0) + parseFloat(quantityData.quantity);
    } else {
      updatedFields[countField] = (prev[countField] || 0) + 1;
    }

    // Clear input fields
    updatedFields[`new_${quantityType}_quantity`] = '';
    updatedFields[`new_${quantityType}_date`] = '';

    return updatedFields;
  });

  setShowQuantityModal(false);
};

  const handleViewHistory = (type) => {
    setHistoryType(type);
    
    const titles = {
      oil: 'Historique des Changements d\'Huile',
      ad_blue: 'Historique des Ajouts d\'Ad Blue',
      filter_oil: 'Historique des Changements de Filtre à Huile',
      filter_air: 'Historique des Changements de Filtre à Air',
      paquets_de_frein: 'Historique des Changements de Plaquets de Frein',
      paquets_de_voiture: 'Historique des Changements de Paquets de Voiture'
    };
    
    setHistoryTitle(titles[type] || 'Historique');
    
    const history = maintenanceFields[`${type}_history`] || [];
    setHistoryData(Array.isArray(history) ? history : []);
    
    setShowHistoryModal(true);
  };

  const handleRemoveHistoryEntry = (entryId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée d\'historique?')) {
      return;
    }

    setMaintenanceFields(prev => {
      const historyField = `${historyType}_history`;
      const quantityField = `${historyType}_quantity`;
      const countField = `${historyType}_count`;
      
      const currentHistory = prev[historyField] || [];
      const entryToRemove = currentHistory.find(entry => entry.id === entryId);
      
      if (!entryToRemove) return prev;

      const updatedHistory = currentHistory.filter(entry => entry.id !== entryId);
      
      const updatedFields = {
        ...prev,
        [historyField]: updatedHistory
      };

      // Update totals
      if (historyType === 'oil' || historyType === 'ad_blue') {
        const currentQuantity = prev[quantityField] || 0;
        const entryQuantity = entryToRemove.quantity || 0;
        updatedFields[quantityField] = Math.max(0, currentQuantity - entryQuantity);
        
        // If quantity reaches 0, mark as not done
        if (updatedFields[quantityField] <= 0) {
          updatedFields[historyType] = 'no';
          updatedFields[`${historyType}_date`] = '';
        }
      } else {
        const currentCount = prev[countField] || 0;
        updatedFields[countField] = Math.max(0, currentCount - 1);
        
        // If count reaches 0, mark as not done
        if (updatedFields[countField] <= 0) {
          updatedFields[historyType] = 'no';
          updatedFields[`${historyType}_date`] = '';
        }
      }

      return updatedFields;
    });

    // Refresh history data
    const updatedHistory = maintenanceFields[`${historyType}_history`] || [];
    const filteredHistory = updatedHistory.filter(entry => entry.id !== entryId);
    setHistoryData(filteredHistory);
  };

  // NEW: Periodic kilometer maintenance functions
  const handleAddPeriodicKmChange = (item) => {
    setSelectedPeriodicItem(item);
    setPeriodicChangeData({
      date: new Date().toISOString().split('T')[0]
    });
    setShowPeriodicKmModal(true);
  };

  const handleSubmitPeriodicKmChange = () => {
    if (!periodicChangeData.date) {
      alert('Veuillez sélectionner une date');
      return;
    }

    const currentKm = formData.kilometrage || 0;
    
    const updatedMaintenance = periodicKmMaintenance.map(item => 
      item.id === selectedPeriodicItem.id
        ? {
            ...item,
            last_changed_km: currentKm,
            next_change_km: currentKm + item.interval_km,
            last_changed_date: periodicChangeData.date,
            needs_attention: false,
            change_count: (item.change_count || 0) + 1,
            change_history: [
              ...(item.change_history || []),
              {
                id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                date: periodicChangeData.date,
                changed_km: currentKm,
                created_at: new Date().toISOString()
              }
            ],
            updated_at: new Date().toISOString()
          }
        : item
    );
    
    setPeriodicKmMaintenance(updatedMaintenance);
    handleChange('periodic_km_maintenance', updatedMaintenance);
    
    setShowPeriodicKmModal(false);
    setSelectedPeriodicItem(null);
  };

  const handleViewPeriodicKmHistory = (item) => {
    setSelectedPeriodicItem(item);
    setPeriodicHistoryTitle(`Historique des Changements - ${item.name}`);
    setPeriodicHistoryData(item.change_history || []);
    setShowPeriodicKmHistoryModal(true);
  };

  const handleRemovePeriodicKmHistoryEntry = (entryId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée d\'historique?')) {
      return;
    }

    const updatedMaintenance = periodicKmMaintenance.map(item => {
      if (item.id === selectedPeriodicItem.id) {
        const history = item.change_history || [];
        const entryToRemove = history.find(entry => entry.id === entryId);
        
        if (!entryToRemove) return item;

        const updatedHistory = history.filter(entry => entry.id !== entryId);
        
        // Get the most recent change after removal
        const recentChange = updatedHistory.sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        )[0];
        
        return {
          ...item,
          change_history: updatedHistory,
          change_count: Math.max(0, (item.change_count || 0) - 1),
          last_changed_km: recentChange ? recentChange.changed_km : 0,
          next_change_km: recentChange ? recentChange.changed_km + item.interval_km : item.interval_km,
          last_changed_date: recentChange ? recentChange.date : null,
          needs_attention: recentChange ? currentKm >= (recentChange.changed_km + item.interval_km) : false
        };
      }
      return item;
    });
    
    setPeriodicKmMaintenance(updatedMaintenance);
    handleChange('periodic_km_maintenance', updatedMaintenance);
    
    // Refresh history data
    const updatedHistory = selectedPeriodicItem.change_history || [];
    const filteredHistory = updatedHistory.filter(entry => entry.id !== entryId);
    setPeriodicHistoryData(filteredHistory);
  };

  const HistoryModal = () => {
    const getDisplayText = (entry) => {
      if (historyType === 'oil' || historyType === 'ad_blue') {
        return `${entry.quantity || 0} L`;
      }
      return 'Changement effectué';
    };

    return (
      <>
        <div className="alert-overlay" onClick={() => setShowHistoryModal(false)} />
        <div className="history-modal">
          <div className="history-modal-content">
            <div className="history-modal-header">
              <h3 className="history-modal-title">
                <FaHistoryIcon /> {historyTitle}
              </h3>
              <button 
                className="history-modal-close"
                onClick={() => setShowHistoryModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="history-summary">
              {historyType === 'oil' || historyType === 'ad_blue' ? (
                <div className="quantity-summary">
                  <span className="summary-label">Quantité totale:</span>
                  <span className="summary-value">
                    {maintenanceFields[`${historyType}_quantity`] || 0} L
                  </span>
                </div>
              ) : (
                <div className="count-summary">
                  <span className="summary-label">Nombre total:</span>
                  <span className="summary-value">
                    {maintenanceFields[`${historyType}_count`] || 0}
                  </span>
                </div>
              )}
            </div>

            <div className="history-list">
              {historyData.length > 0 ? (
                <div className="history-table">
                  <div className="history-header">
                    <span>Date</span>
                    <span>Kilométrage</span>
                    {historyType === 'oil' || historyType === 'ad_blue' ? (
                      <span>Quantité (L)</span>
                    ) : null}
                    <span>Actions</span>
                  </div>
                  {historyData.map((entry) => (
                    <div key={entry.id} className="history-row">
                      <span>{new Date(entry.date).toLocaleDateString('fr-FR')}</span>
                      <span>{entry.kilometrage || 'N/A'} km</span>
                      {historyType === 'oil' || historyType === 'ad_blue' ? (
                        <span className="quantity-cell">{entry.quantity || 0} L</span>
                      ) : null}
                      <span className="history-actions">
                        <button
                          type="button"
                          className="btn-delete-history"
                          onClick={() => handleRemoveHistoryEntry(entry.id)}
                          title="Supprimer cette entrée"
                        >
                          <FaTrash />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-history">
                  <FaHistoryIcon />
                  <p>Aucun historique disponible</p>
                </div>
              )}
            </div>

            <div className="history-modal-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setShowHistoryModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const QuantityModal = () => {
  const isQuantityType = quantityType === 'oil' || quantityType === 'ad_blue' || quantityType.startsWith('custom_');
  const labels = {
    oil: 'Huile',
    ad_blue: 'Ad Blue',
    filter_oil: 'Filtre à Huile',
    filter_air: 'Filtre à Air',
    paquets_de_frein: 'Plaquets de Frein',
    paquets_de_voiture: 'Paquets de Voiture'
  };

  // Get custom item name if it's a custom quantity
  let itemName = labels[quantityType] || 'Élément';
  if (quantityType.startsWith('custom_')) {
    const itemId = quantityType.replace('custom_', '');
    const item = additionalMaintenance.find(item => item.id === itemId);
    itemName = item ? item.name : 'Élément Personnalisé';
  }

  return (
    <>
      <div className="alert-overlay" onClick={() => setShowQuantityModal(false)} />
      <div className="quantity-modal">
        <div className="quantity-modal-content">
          <div className="quantity-modal-header">
            <h3 className="quantity-modal-title">
              <FaPlus /> Ajouter {itemName}
            </h3>
            <button 
              className="quantity-modal-close"
              onClick={() => setShowQuantityModal(false)}
            >
              <FaTimes />
            </button>
          </div>

          <div className="quantity-form">
            {isQuantityType ? (
              <div className="form-group">
                <label className="form-label required-field">Quantité (L)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="form-input"
                  value={quantityData.quantity}
                  onChange={(e) => setQuantityData(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="Ex: 1.5"
                  required
                />
              </div>
            ) : null}

            <div className="form-group">
              <label className="form-label required-field">Date</label>
              <input
                type="date"
                className="form-input"
                value={quantityData.date}
                onChange={(e) => setQuantityData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div className="quantity-summary-preview">
              <h4>Résumé</h4>
              <div className="preview-details">
                <p><strong>Type:</strong> {itemName}</p>
                {isQuantityType && (
                  <p><strong>Quantité à ajouter:</strong> {quantityData.quantity || 0} L</p>
                )}
                <p><strong>Date:</strong> {new Date(quantityData.date).toLocaleDateString('fr-FR')}</p>
                <p><strong>Kilométrage actuel:</strong> {formData.kilometrage || 0} km</p>
              </div>
            </div>
          </div>

          <div className="quantity-modal-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => setShowQuantityModal(false)}
            >
              Annuler
            </button>
            <button 
              type="button" 
              className="btn-primary"
              onClick={handleSubmitQuantity}
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

  const PeriodicKmChangeModal = () => {
    if (!selectedPeriodicItem) return null;

    const currentKm = formData.kilometrage || 0;
    const kmRemaining = Math.max(0, selectedPeriodicItem.next_change_km - currentKm);

    return (
      <>
        <div className="alert-overlay" onClick={() => setShowPeriodicKmModal(false)} />
        <div className="quantity-modal">
          <div className="quantity-modal-content">
            <div className="quantity-modal-header">
              <h3 className="quantity-modal-title">
                <FaSyncAlt /> Enregistrer un Changement - {selectedPeriodicItem.name}
              </h3>
              <button 
                className="quantity-modal-close"
                onClick={() => setShowPeriodicKmModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="quantity-form">
              <div className="periodic-km-info">
                <div className="info-row">
                  <span className="info-label">Intervalle:</span>
                  <span className="info-value">{selectedPeriodicItem.interval_km} km</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Dernier changement:</span>
                  <span className="info-value">
                    {selectedPeriodicItem.last_changed_km ? `${selectedPeriodicItem.last_changed_km} km` : 'Jamais'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Prochain changement:</span>
                  <span className="info-value">{selectedPeriodicItem.next_change_km} km</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Kilométrage actuel:</span>
                  <span className="info-value highlight">{currentKm} km</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Nombre de changements:</span>
                  <span className="info-value">{selectedPeriodicItem.change_count || 0}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required-field">Date du Changement</label>
                <input
                  type="date"
                  className="form-input"
                  value={periodicChangeData.date}
                  onChange={(e) => setPeriodicChangeData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div className="quantity-summary-preview">
                <h4>Résumé</h4>
                <div className="preview-details">
                  <p><strong>Élément:</strong> {selectedPeriodicItem.name}</p>
                  <p><strong>Kilométrage après changement:</strong> {currentKm} km</p>
                  <p><strong>Prochain changement:</strong> {currentKm + selectedPeriodicItem.interval_km} km</p>
                  <p><strong>Date:</strong> {new Date(periodicChangeData.date).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>

            <div className="quantity-modal-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setShowPeriodicKmModal(false)}
              >
                Annuler
              </button>
              <button 
                type="button" 
                className="btn-primary"
                onClick={handleSubmitPeriodicKmChange}
              >
                Enregistrer le Changement
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const PeriodicKmHistoryModal = () => {
    if (!selectedPeriodicItem) return null;

    return (
      <>
        <div className="alert-overlay" onClick={() => setShowPeriodicKmHistoryModal(false)} />
        <div className="history-modal">
          <div className="history-modal-content">
            <div className="history-modal-header">
              <h3 className="history-modal-title">
                <FaHistoryIcon /> {periodicHistoryTitle}
              </h3>
              <button 
                className="history-modal-close"
                onClick={() => setShowPeriodicKmHistoryModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="history-summary">
              <div className="periodic-km-summary">
                <div className="summary-item">
                  <span className="summary-label">Nombre total de changements:</span>
                  <span className="summary-value">{selectedPeriodicItem.change_count || 0}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Intervalle:</span>
                  <span className="summary-value">{selectedPeriodicItem.interval_km} km</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Dernier changement:</span>
                  <span className="summary-value">
                    {selectedPeriodicItem.last_changed_date ? new Date(selectedPeriodicItem.last_changed_date).toLocaleDateString('fr-FR') : 'Jamais'}
                  </span>
                </div>
              </div>
            </div>

            <div className="history-list">
              {periodicHistoryData.length > 0 ? (
                <div className="history-table">
                  <div className="history-header">
                    <span>Date</span>
                    <span>Kilométrage</span>
                    <span>Actions</span>
                  </div>
                  {periodicHistoryData.map((entry) => (
                    <div key={entry.id} className="history-row">
                      <span>{new Date(entry.date).toLocaleDateString('fr-FR')}</span>
                      <span>{entry.changed_km || 'N/A'} km</span>
                      <span className="history-actions">
                        <button
                          type="button"
                          className="btn-delete-history"
                          onClick={() => handleRemovePeriodicKmHistoryEntry(entry.id)}
                          title="Supprimer cette entrée"
                        >
                          <FaTrash />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-history">
                  <FaHistoryIcon />
                  <p>Aucun historique disponible</p>
                </div>
              )}
            </div>

            <div className="history-modal-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setShowPeriodicKmHistoryModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderPaymentHistory = () => {
    const paymentHistory = formData.payment_history || [];
    const totalPaid = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);

    return (
      <div className="form-section">
        <h3 className="section-title">
          <FaHistory />
          Historique des Paiements
        </h3>

        <div className="payment-summary">
          <div className="payment-totals">
            <div className="total-item">
              <span className="total-label">Total à payer:</span>
              <span className="total-value">{formData.total_price || 0} DH</span>
            </div>
            <div className="total-item">
              <span className="total-label">Total payé:</span>
              <span className="total-value paid">{totalPaid} DH</span>
            </div>
            <div className="total-item">
              <span className="total-label">Reste à payer:</span>
              <span className="total-value remaining">{formData.remaining_amount || 0} DH</span>
            </div>
          </div>
        </div>

        <div className="payment-history-actions">
          <button 
            type="button" 
            className="btn-add-payment"
            onClick={() => setShowAddPayment(true)}
          >
            <FaPlus />
            Ajouter un Paiement
          </button>
        </div>

        {showAddPayment && (
          <div className="add-payment-form">
            <h4>Nouveau Paiement</h4>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label required-field">Montant (DH)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label required-field">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={newPayment.date}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label required-field">Méthode</label>
                <select
                  className="form-select"
                  value={newPayment.method}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, method: e.target.value }))}
                  required
                >
                  <option value="cash">Espèces</option>
                  <option value="card">Carte</option>
                  <option value="check">Chèque</option>
                  <option value="transfer">Virement</option>
                  <option value="forgiven">Pardonné</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes optionnelles..."
                />
              </div>
            </div>
            <div className="payment-form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setShowAddPayment(false)}
              >
                Annuler
              </button>
              <button 
                type="button" 
                className="btn-primary"
                onClick={handleAddPayment}
              >
                Ajouter le Paiement
              </button>
            </div>
          </div>
        )}

        {paymentHistory.length > 0 ? (
          <div className="payment-history-list">
            <h4>Historique ({paymentHistory.length} paiement(s))</h4>
            <div className="payments-table">
              <div className="payment-header">
                <span>Date</span>
                <span>Méthode</span>
                <span>Montant</span>
                <span>Notes</span>
                <span>Actions</span>
              </div>
              {paymentHistory.map((payment, index) => (
                <div key={payment.id} className="payment-row">
                  <span>{new Date(payment.date).toLocaleDateString('fr-FR')}</span>
                  <span className="payment-method">
                    {payment.method === 'cash' && '💵 Espèces'}
                    {payment.method === 'card' && '💳 Carte'}
                    {payment.method === 'check' && '📋 Chèque'}
                    {payment.method === 'transfer' && '🏦 Virement'}
                    {payment.method === 'forgiven' && '🎁 Pardonné'}
                  </span>
                  <span className="payment-amount">{payment.amount} DH</span>
                  <span className="payment-notes">{payment.notes || '-'}</span>
                  <span className="payment-actions">
                    <button
                      type="button"
                      className="btn-delete-payment"
                      onClick={() => handleRemovePayment(payment.id)}
                      title="Supprimer ce paiement"
                    >
                      <FaTrash />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-payments">
            <FaReceipt />
            <p>Aucun paiement enregistré</p>
          </div>
        )}
      </div>
    );
  };

const renderClientSection = () => {
  if (modalType === 'edit' && formData.client_id) {
    const client = clients.find(c => c.id === formData.client_id);
    return (
      <div className="form-section">
        <h3 className="section-title">
          <FaUser />
          Informations Client
        </h3>
        <div className="selected-primary-client-card">
          <div className="primary-client-header">
            <h4>Client Principal</h4>
          </div>
          <div className="primary-client-details">
            <div className="primary-client-name">
              <FaUser /> {formData.prenom} {formData.nom}
            </div>
            <div className="primary-client-contact">
              <FaPhone /> {formData.telephone}
            </div>
            {formData.email && (
              <div className="primary-client-email">
                <FaEnvelope /> {formData.email}
              </div>
            )}
            {formData.city && (
              <div className="primary-client-city">
                <FaMapMarkerAlt /> {formData.city}
              </div>
            )}
            {formData.cin_number && (
              <div className="primary-client-cin">
                <FaIdCard /> CIN: {formData.cin_number}
              </div>
            )}
            {formData.driver_license_number && (
              <div className="primary-client-license">
                <FaCar /> Permis: {formData.driver_license_number}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-section">
      <h3 className="section-title">
        <FaUser />
        Informations Client
      </h3>
      
      {!isNewClient ? (
        <>
          {/* Only show search when no client is selected */}
          {!selectedClient ? (
            <div className="form-group">
              <label className="form-label">Rechercher un Client Existant</label>
              <div className="search-container">
                <input
                  type="text"
                  className="form-input"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Rechercher par nom, email ou téléphone..."
                />
                {clientSearch && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => {
                      setClientSearch('');
                    }}
                    title="Effacer la recherche"
                  >
                    ×
                  </button>
                )}
              </div>
              
              {/* Show dropdown when searching and no client selected */}
              {filteredClients.map(client => (
  <div 
    key={client.id} 
    className="client-option"
    onClick={() => handleClientSelect(client)}
  >
    <div className="client-info">
      <strong>{client.prenom} {client.nom}</strong>
      <div className="client-details">
        {client.email && (
          <span className="client-email">{client.email}</span>
        )}
        {client.telephone && (
          <span className="client-phone">{client.telephone}</span>
        )}
        {client.city && (
          <span className="client-city">{client.city}</span>
        )}
      </div>
    </div>
  </div>
))}
              
              {clientSearch && filteredClients.length === 0 && (
                <div className="no-results">
                  Aucun client trouvé pour "{clientSearch}"
                </div>
              )}
            </div>
          ) : (
            /* Show selected client card instead of search */
            <div className="selected-primary-client-card">
              <div className="primary-client-header">
                <h4>Client Principal Sélectionné</h4>
                <button
                  type="button"
                  className="btn-change-primary-client"
                  onClick={() => {
                    setSelectedClient(null);
                    setClientSearch('');
                    handleChange('client_id', '');
                  }}
                  title="Supprimer la sélection"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="primary-client-details">
                <div className="primary-client-name">
                  <FaUser /> {selectedClient.prenom} {selectedClient.nom}
                  {selectedClient.is_temp && (
                    <span className="primary-temp-badge">(Nouveau)</span>
                  )}
                </div>
                <div className="primary-client-contact">
                  <FaPhone /> {selectedClient.telephone}
                </div>
                {selectedClient.email && (
                  <div className="primary-client-email">
                    <FaEnvelope /> {selectedClient.email}
                  </div>
                )}
                {selectedClient.city && (
                  <div className="primary-client-city">
                    <FaMapMarkerAlt /> {selectedClient.city}
                  </div>
                )}
                {selectedClient.cin_number && (
                  <div className="primary-client-cin">
                    <FaIdCard /> CIN: {selectedClient.cin_number}
                  </div>
                )}
                {selectedClient.driver_license_number && (
                  <div className="primary-client-license">
                    <FaCar /> Permis: {selectedClient.driver_license_number}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn-change-primary-driver"
                onClick={() => {
                  setSelectedClient(null);
                  setClientSearch('');
                  handleChange('client_id', '');
                }}
              >
                <FaEdit /> Changer de client
              </button>
            </div>
          )}
          
          <div className="form-group">
            <div className="mode-buttons-container">
              <div className="mode-buttons">
                <button 
                  type="button" 
                  className={`btn-mode ${!isNewClient ? 'active' : ''}`}
                  onClick={() => {
                    setIsNewClient(false);
                    setSelectedClient(null);
                    setClientSearch('');
                  }}
                >
                  <FaSearch /> Rechercher un client existant
                </button>
                <button 
                  type="button" 
                  className={`btn-mode ${isNewClient ? 'active' : ''}`}
                  onClick={handleNewClient}
                >
                  <FaUserPlus /> Nouveau Client
                </button>
              </div>
              
              {isNewClient && (
                <div className="new-client-notice">
                  <FaInfoCircle /> Mode création de nouveau client activé
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label required-field">Prénom</label>
            <input
              type="text"
              className="form-input"
              value={formData.prenom || ''}
              onChange={(e) => handleChange('prenom', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required-field">Nom</label>
            <input
              type="text"
              className="form-input"
              value={formData.nom || ''}
              onChange={(e) => handleChange('nom', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required-field">Téléphone</label>
            <input
              type="tel"
              className="form-input"
              value={formData.telephone || ''}
              onChange={(e) => handleChange('telephone', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ville</label>
            <input
              type="text"
              className="form-input"
              value={formData.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date de Naissance</label>
            <input
              type="date"
              className="form-input"
              value={formData.date_naissance || ''}
              onChange={(e) => handleChange('date_naissance', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Lieu de Naissance</label>
            <input
              type="text"
              className="form-input"
              value={formData.lieu_naissance || ''}
              onChange={(e) => handleChange('lieu_naissance', e.target.value)}
              placeholder="Ville de naissance"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Numéro CIN</label>
            <input
              type="text"
              className="form-input"
              value={formData.cin_number || ''}
              onChange={(e) => handleChange('cin_number', e.target.value)}
              placeholder="Numéro de Carte d'Identité Nationale"
            />
          </div>

          <div className="form-group">
            <label className="form-label">CIN Expire le</label>
            <input
              type="date"
              className="form-input"
              value={formData.cin_delivre_le || ''}
              onChange={(e) => handleChange('cin_delivre_le', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Numéro de Permis</label>
            <input
              type="text"
              className="form-input"
              value={formData.driver_license_number || ''}
              onChange={(e) => handleChange('driver_license_number', e.target.value)}
              placeholder="Numéro de permis de conduire"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Permis Délivré le</label>
            <input
              type="date"
              className="form-input"
              value={formData.permis_delivre_le || ''}
              onChange={(e) => handleChange('permis_delivre_le', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Image CIN</label>
            <input
              type="file"
              className="form-input"
              accept="image/*"
              onChange={(e) => handleImageUpload('cin_image', e.target.files[0])}
            />
            {formData.cin_image && (
              <div className="image-preview">
                <img src={formData.cin_image} alt="CIN" className="preview-image" />
                <button
                  type="button"
                  className="delete-image-btn"
                  onClick={() => handleSingleImageDelete('cin_image')}
                  title="Supprimer l'image"
                >
                  <FaTrash />
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Image Permis</label>
            <input
              type="file"
              className="form-input"
              accept="image/*"
              onChange={(e) => handleImageUpload('driver_license_image', e.target.files[0])}
            />
            {formData.driver_license_image && (
              <div className="image-preview">
                <img src={formData.driver_license_image} alt="Permis de conduire" className="preview-image" />
                <button
                  type="button"
                  className="delete-image-btn"
                  onClick={() => handleSingleImageDelete('driver_license_image')}
                  title="Supprimer l'image"
                >
                  <FaTrash />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

  const renderAccidentForm = () => {
    const requiredImages = getRequiredImagesForStatus();

    return (
      <>
        <div className="form-section">
          <h3 className="section-title">
            <FaExclamationTriangle />
            Classification de l'Accident
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label required-field">Type d'Accident</label>
              <select
                className="form-select"
                value={formData.accident_type || 'grave'}
                onChange={(e) => handleAccidentTypeChange(e.target.value)}
                required
              >
                {accidentTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="help-text">
                {formData.accident_type === 'grave' 
                  ? 'Matricule inactif jusqu\'au statut En attente/Terminé'
                  : 'Matricule inactif seulement pendant la réparation (statut Réparé)'
                }
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required-field">Type de Procédure</label>
              <select
                className="form-select"
                value={formData.procedure_type || 'classic'}
                onChange={(e) => handleChange('procedure_type', e.target.value)}
                required
                disabled={formData.accident_type === 'non_grave'}
              >
                {procedureTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="help-text">
                {formData.procedure_type === 'forphie' 
                  ? 'Forphie: Couverture annuelle unique, documentation minimale'
                  : 'Classique: Documentation complète et processus de réparation'
                }
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required-field">Statut</label>
              <select
                className="form-select"
                value={formData.status || 'pending'}
                onChange={(e) => handleStatusChange(e.target.value)}
                required
              >
                {accidentStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">
            <FaExclamationTriangle />
            Informations de Base sur l'Accident
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label required-field">Date de l'Accident</label>
              <input
                type="date"
                className="form-input"
                value={formData.date_accident || ''}
                onChange={(e) => handleChange('date_accident', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required-field">Montant des Pertes (dh)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.amount_of_losses || ''}
                onChange={(e) => handleChange('amount_of_losses', parseFloat(e.target.value))}
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required-field">Montant Assurance (dh)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.amount_assurance || ''}
                onChange={(e) => handleChange('amount_assurance', parseFloat(e.target.value))}
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nom de l'Expert</label>
              <input
                type="text"
                className="form-input"
                value={formData.nom_expert || ''}
                onChange={(e) => handleChange('nom_expert', e.target.value)}
                placeholder="Entrez le nom de l'expert"
              />
            </div>
          </div>
        </div>

        {showExpertFields && (
          <div className="form-section">
            <h3 className="section-title">
              <FaUserTie />
              Évaluation Expert
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Décision de l'Expert</label>
                <select
                  className="form-select"
                  value={formData.expert_decision || 'pending'}
                  onChange={(e) => handleChange('expert_decision', e.target.value)}
                >
                  {expertDecisionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Montant Expert (dh)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.expert_amount || ''}
                  onChange={(e) => handleChange('expert_amount', parseFloat(e.target.value))}
                  min="0"
                />
              </div>

              <div className="form-group" style={{gridColumn: '1 / -1'}}>
                <label className="form-label">Notes de l'Expert</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={formData.expert_notes || ''}
                  onChange={(e) => handleChange('expert_notes', e.target.value)}
                  placeholder="Notes de l'évaluation expert..."
                />
              </div>
            </div>
          </div>
        )}

        <div className="form-section">
          <h3 className="section-title">
            <FaImage />
            Documentation des Images
            {formData.procedure_type === 'forphie' && (
              <span className="forphie-badge">Procédure Forphie</span>
            )}
          </h3>
          
          {formData.procedure_type === 'forphie' && (
            <div className="procedure-notification">
              <FaInfoCircle />
              <span>
                Procédure Forphie: Seules les images de la scène d'accident sont requises. 
                Les autres images seront automatiquement masquées.
              </span>
            </div>
          )}

          <div className="form-grid">
            <div className="form-group">
              <label className={`form-label ${requiredImages.includes('img_accident') ? 'required-field' : ''}`}>
                Images de la Scène
              </label>
              <input
                type="file"
                className="form-input"
                accept="image/*,.pdf"
                multiple
                onChange={(e) => handleMultipleImageUpload('img_accident', e.target.files)}
              />
              <div className="help-text">Accepte les images (JPG, PNG) et les fichiers PDF {requiredImages.includes('img_accident') && '(Requis)'}</div>
              
              {formData.img_accident && formData.img_accident.length > 0 && (
                <div className="images-preview">
                  <h4>Fichiers téléchargés ({formData.img_accident.length})</h4>
                  <div className="preview-grid">
                    {formData.img_accident.map((file, index) => {
                      const isPdf = isPdfFile(file) || 
                                   (formData.img_accident_is_pdf && formData.img_accident_is_pdf[index]);
                      
                      return (
                        <div key={index} className="preview-item">
                          {isPdf ? (
                            <div className="pdf-preview">
                              <FaFilePdf className="pdf-icon" />
                              <span>PDF Document</span>
                              <div className="preview-actions">
                                <button
                                  type="button"
                                  className="btn-view-document"
                                  onClick={() => handleViewFile(file, true)}
                                  title="Voir le PDF"
                                >
                                  <FaEye />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <img 
                                src={file} 
                                alt={`Scène d'accident ${index + 1}`} 
                                className="preview-image" 
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/120x90?text=Image+Error';
                                  e.target.onerror = null;
                                }}
                              />
                              <div className="preview-actions">
                                <button
                                  type="button"
                                  className="btn-view-document"
                                  onClick={() => handleViewFile(file, false)}
                                  title="Voir l'image"
                                >
                                  <FaEye />
                                </button>
                              </div>
                            </>
                          )}
                          <button
                            type="button"
                            className="delete-image-btn"
                            onClick={() => handleImageDelete('img_accident', index)}
                            title="Supprimer le fichier"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {formData.procedure_type !== 'forphie' && (
              <div className="form-group">
                <label className={`form-label ${requiredImages.includes('img_evaluation_expert') ? 'required-field' : ''}`}>
                  Images d'Évaluation Expert
                </label>
                <input
                  type="file"
                  className="form-input"
                  accept="image/*,.pdf"
                  multiple
                  onChange={(e) => handleMultipleImageUpload('img_evaluation_expert', e.target.files)}
                  disabled={formData.procedure_type === 'forphie'}
                />
                <div className="help-text">
                  {requiredImages.includes('img_evaluation_expert') 
                    ? 'Images d\'évaluation expert (Requis)' 
                    : 'Images d\'évaluation expert'
                  }
                </div>
                
                {formData.img_evaluation_expert && formData.img_evaluation_expert.length > 0 && (
                  <div className="images-preview">
                    <h4>Fichiers téléchargés ({formData.img_evaluation_expert.length})</h4>
                    <div className="preview-grid">
                      {formData.img_evaluation_expert.map((file, index) => {
                        const isPdf = isPdfFile(file) || 
                                     (formData.img_evaluation_expert_is_pdf && formData.img_evaluation_expert_is_pdf[index]);
                        
                        return (
                          <div key={index} className="preview-item">
                            {isPdf ? (
                              <div className="pdf-preview">
                                <FaFilePdf className="pdf-icon" />
                                <span>PDF Document</span>
                                <div className="preview-actions">
                                  <button
                                    type="button"
                                    className="btn-view-document"
                                    onClick={() => handleViewFile(file, true)}
                                    title="Voir le PDF"
                                  >
                                    <FaEye />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <img 
                                  src={file} 
                                  alt={`Évaluation expert ${index + 1}`} 
                                  className="preview-image" 
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/120x90?text=Image+Error';
                                    e.target.onerror = null;
                                  }}
                                />
                                <div className="preview-actions">
                                  <button
                                    type="button"
                                    className="btn-view-document"
                                    onClick={() => handleViewFile(file, false)}
                                    title="Voir l'image"
                                  >
                                    <FaEye />
                                  </button>
                                </div>
                              </>
                            )}
                            <button
                              type="button"
                              className="delete-image-btn"
                              onClick={() => handleImageDelete('img_evaluation_expert', index)}
                              title="Supprimer le fichier"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {formData.procedure_type !== 'forphie' && (
              <div className="form-group">
                <label className={`form-label ${requiredImages.includes('img_fixed') ? 'required-field' : ''}`}>
                  Images Véhicule Réparé
                </label>
                <input
                  type="file"
                  className="form-input"
                  accept="image/*,.pdf"
                  multiple
                  onChange={(e) => handleMultipleImageUpload('img_fixed', e.target.files)}
                  disabled={formData.procedure_type === 'forphie'}
                />
                <div className="help-text">
                  {requiredImages.includes('img_fixed') 
                    ? 'Images du véhicule réparé (Requis)' 
                    : 'Images du véhicule réparé'
                  }
                </div>
                
                {formData.img_fixed && formData.img_fixed.length > 0 && (
                  <div className="images-preview">
                    <h4>Fichiers téléchargés ({formData.img_fixed.length})</h4>
                    <div className="preview-grid">
                      {formData.img_fixed.map((file, index) => {
                        const isPdf = isPdfFile(file) || 
                                     (formData.img_fixed_is_pdf && formData.img_fixed_is_pdf[index]);
                        
                        return (
                          <div key={index} className="preview-item">
                            {isPdf ? (
                              <div className="pdf-preview">
                                <FaFilePdf className="pdf-icon" />
                                <span>PDF Document</span>
                                <div className="preview-actions">
                                  <button
                                    type="button"
                                    className="btn-view-document"
                                    onClick={() => handleViewFile(file, true)}
                                    title="Voir le PDF"
                                  >
                                    <FaEye />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <img 
                                  src={file} 
                                  alt={`Véhicule réparé ${index + 1}`} 
                                  className="preview-image" 
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/120x90?text=Image+Error';
                                    e.target.onerror = null;
                                  }}
                                />
                                <div className="preview-actions">
                                  <button
                                    type="button"
                                    className="btn-view-document"
                                    onClick={() => handleViewFile(file, false)}
                                    title="Voir l'image"
                                  >
                                    <FaEye />
                                  </button>
                                </div>
                              </>
                            )}
                            <button
                              type="button"
                              className="delete-image-btn"
                              onClick={() => handleImageDelete('img_fixed', index)}
                              title="Supprimer le fichier"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {formData.procedure_type !== 'forphie' && (
              <div className="form-group">
                <label className={`form-label ${requiredImages.includes('image_facture') ? 'required-field' : ''}`}>
                  Images Facture
                </label>
                <input
                  type="file"
                  className="form-input"
                  accept="image/*,.pdf"
                  multiple
                  onChange={(e) => handleMultipleImageUpload('image_facture', e.target.files)}
                  disabled={formData.procedure_type === 'forphie'}
                />
                <div className="help-text">
                  {requiredImages.includes('image_facture') 
                    ? 'Images de facture (Requis)' 
                    : 'Images de facture'
                  }
                </div>
                
                {formData.image_facture && formData.image_facture.length > 0 && (
                  <div className="images-preview">
                    <h4>Fichiers téléchargés ({formData.image_facture.length})</h4>
                    <div className="preview-grid">
                      {formData.image_facture.map((file, index) => {
                        const isPdf = isPdfFile(file) || 
                                     (formData.image_facture_is_pdf && formData.image_facture_is_pdf[index]);
                        
                        return (
                          <div key={index} className="preview-item">
                            {isPdf ? (
                              <div className="pdf-preview">
                                <FaFilePdf className="pdf-icon" />
                                <span>PDF Document</span>
                                <div className="preview-actions">
                                  <button
                                    type="button"
                                    className="btn-view-document"
                                    onClick={() => handleViewFile(file, true)}
                                    title="Voir le PDF"
                                  >
                                    <FaEye />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <img 
                                  src={file} 
                                  alt={`Facture ${index + 1}`} 
                                  className="preview-image" 
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/120x90?text=Image+Error';
                                    e.target.onerror = null;
                                  }}
                                />
                                <div className="preview-actions">
                                  <button
                                    type="button"
                                    className="btn-view-document"
                                    onClick={() => handleViewFile(file, false)}
                                    title="Voir l'image"
                                  >
                                    <FaEye />
                                  </button>
                                </div>
                              </>
                            )}
                            <button
                              type="button"
                              className="delete-image-btn"
                              onClick={() => handleImageDelete('image_facture', index)}
                              title="Supprimer le fichier"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Notes Supplémentaires</h3>
          <div className="form-group">
            <textarea
              className="form-textarea"
              rows="4"
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Toutes notes supplémentaires concernant l'accident..."
            />
          </div>
        </div>

        <div className="form-section status-info">
          <h3 className="section-title">
            <FaInfoCircle />
            Informations sur le Statut
          </h3>
          <div className="status-details">
            <div className="status-item">
              <strong>Statut actuel du Matricule:</strong>
              <span className={`matricule-status ${formData.matricule_id ? 'inactive' : 'unknown'}`}>
                {formData.matricule_id ? 'INACTIF' : 'Non Sélectionné'}
              </span>
            </div>
            <div className="status-item">
              <strong>Le Matricule deviendra actif quand:</strong>
              <span>
                {formData.accident_type === 'grave' 
                  ? 'Le statut atteint En attente ou Terminé'
                  : 'La réparation est terminée (statut Réparé passé)'
                }
              </span>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderReservationForm = () => {
    return (
      <>
        {renderClientSection()}
<div className="form-section">
  <div className="form-group">
    <label className="checkbox-label">
      <input
        type="checkbox"
        checked={showSecondDriver}
        onChange={(e) => {
          const isChecked = e.target.checked;
          setShowSecondDriver(isChecked);
          
          if (!isChecked) {
            handleClearSecondDriver();
          } else {
            handleChange('has_second_driver', true);
          }
        }}
      />
      Ajouter un Deuxième Conducteur (Client)
    </label>
  </div>

  {showSecondDriver && (
    <div className="second-driver-section">
      <h3 className="section-title">
        <FaUser />
        {selectedSecondDriver ? 'Deuxième Conducteur Sélectionné' : 'Sélectionner/Créer le Deuxième Conducteur'}
      </h3>
      
      {!selectedSecondDriver ? (
        <>
          {/* Mode Recherche */}
          {!isNewSecondDriver ? (
            <div className="second-driver-mode">
              <div className="mode-buttons">
                <button 
                  type="button"
                  className="btn-mode active"
                >
                  <FaSearch /> Rechercher un client existant
                </button>
                <button 
                  type="button"
                  className="btn-mode"
                  onClick={handleNewSecondDriver}
                >
                  <FaUserPlus /> Créer un nouveau client
                </button>
              </div>
              
              <div className="form-group">
                <label className="form-label required-field">
                  Rechercher un Client
                </label>
                <div className="search-container">
                  <input
                    type="text"
                    className="form-input"
                    value={secondDriverSearch}
                    onChange={(e) => setSecondDriverSearch(e.target.value)}
                    placeholder="Rechercher un client existant..."
                  />
                  {secondDriverSearch && (
                    <button
                      type="button"
                      className="clear-search-btn"
                      onClick={() => setSecondDriverSearch('')}
                      title="Effacer la recherche"
                    >
                      ×
                    </button>
                  )}
                </div>
                
                {secondDriverSearch && (
                  <div className="client-dropdown">
                    {filteredSecondDrivers.length > 0 ? (
                      filteredSecondDrivers.map(client => (
                        <div 
                          key={client.id} 
                          className="client-option"
                          onClick={() => handleSecondDriverSelect(client)}
                        >
                          <div className="client-info">
                            <strong>{client.prenom} {client.nom}</strong>
                            <div className="client-details">
                              <span className="client-phone">
                                <FaPhone /> {client.telephone}
                              </span>
                              <span className="client-email">
                                <FaEnvelope /> {client.email || 'Pas d\'email'}
                              </span>
                              {client.cin_number && (
                                <span className="client-cin">
                                  CIN: {client.cin_number}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-results">
                        Aucun client trouvé.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Mode Création */
            <div className="second-driver-mode">
              <div className="mode-buttons">
                <button 
                  type="button"
                  className="btn-mode"
                  onClick={() => {
                    setIsNewSecondDriver(false);
                    setSecondDriverSearch('');
                  }}
                >
                  <FaSearch /> Rechercher un client existant
                </button>
                <button 
                  type="button"
                  className="btn-mode active"
                >
                  <FaUserPlus /> Créer un nouveau client
                </button>
              </div>
              
              <div className="new-client-form">
                <h4>Créer un Nouveau Client</h4>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label required-field">Prénom</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newSecondDriverData.prenom}
                      onChange={(e) => setNewSecondDriverData(prev => ({ 
                        ...prev, 
                        prenom: e.target.value 
                      }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required-field">Nom</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newSecondDriverData.nom}
                      onChange={(e) => setNewSecondDriverData(prev => ({ 
                        ...prev, 
                        nom: e.target.value 
                      }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required-field">Téléphone</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={newSecondDriverData.telephone}
                      onChange={(e) => setNewSecondDriverData(prev => ({ 
                        ...prev, 
                        telephone: e.target.value 
                      }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={newSecondDriverData.email}
                      onChange={(e) => setNewSecondDriverData(prev => ({ 
                        ...prev, 
                        email: e.target.value 
                      }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ville</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newSecondDriverData.city}
                      onChange={(e) => setNewSecondDriverData(prev => ({ 
                        ...prev, 
                        city: e.target.value 
                      }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Numéro CIN</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newSecondDriverData.cin_number}
                      onChange={(e) => setNewSecondDriverData(prev => ({ 
                        ...prev, 
                        cin_number: e.target.value 
                      }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Numéro de Permis</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newSecondDriverData.driver_license_number}
                      onChange={(e) => setNewSecondDriverData(prev => ({ 
                        ...prev, 
                        driver_license_number: e.target.value 
                      }))}
                    />
                  </div>
                </div>
                
                <div className="new-client-actions">
                  <button 
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setIsNewSecondDriver(false);
                      setSecondDriverSearch('');
                    }}
                  >
                    <FaTimes /> Annuler
                  </button>
                  <button 
                    type="button"
                    className="btn-primary"
                    onClick={handleCreateSecondDriver}
                  >
                    <FaCheck /> Créer et Sélectionner
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Affichage du conducteur sélectionné */
        <div className="selected-client-card">
          <div className="selected-client-header">
            <h4>Deuxième Conducteur Sélectionné</h4>
            <button
              type="button"
              className="btn-remove-client"
              onClick={handleClearSecondDriver}
              title="Supprimer la sélection"
            >
              <FaTimes />
            </button>
          </div>
          <div className="selected-client-details">
            <div className="client-name">
              <FaUser /> {selectedSecondDriver.prenom} {selectedSecondDriver.nom}
              {selectedSecondDriver.is_temp && (
                <span className="temp-badge">(Nouveau)</span>
              )}
            </div>
            <div className="client-contact">
              <FaPhone /> {selectedSecondDriver.telephone}
            </div>
            {selectedSecondDriver.email && (
              <div className="client-email">
                <FaEnvelope /> {selectedSecondDriver.email}
              </div>
            )}
            {selectedSecondDriver.cin_number && (
              <div className="client-cin">
                <FaIdCard /> CIN: {selectedSecondDriver.cin_number}
              </div>
            )}
            {selectedSecondDriver.driver_license_number && (
              <div className="client-license">
                <FaCar /> Permis: {selectedSecondDriver.driver_license_number}
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn-change-driver"
            onClick={() => {
              handleClearSecondDriver();
              setIsNewSecondDriver(false);
              setSecondDriverSearch('');
            }}
          >
            <FaEdit /> Changer de conducteur
          </button>
        </div>
      )}
    </div>
  )}
</div>
        <div className="form-section">
  <h3 className="section-title">
    <FaCar />
    Informations Véhicule
  </h3>
  <div className="form-group">
    <label className="form-label required-field">Sélectionner un Véhicule</label>
    
    {!formData.car_id ? (
      <>
        {/* Mode Recherche */}
        <div className="search-container">
          <input
            type="text"
            className="form-input"
            value={carSearch}
            onChange={(e) => {
              setCarSearch(e.target.value);
              setShowCarDropdown(true);
            }}
            onFocus={() => setShowCarDropdown(true)}
            onBlur={() => {
              const timeoutId = setTimeout(() => {
                setShowCarDropdown(false);
              }, 300);
              setBlurTimeoutId(timeoutId);
            }}
            placeholder="Rechercher une voiture par marque, modèle, couleur..."
            required={modalType === 'create'}
          />
          {carSearch && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => {
                setCarSearch('');
                handleChange('car_id', '');
                setShowCarDropdown(false);
              }}
              title="Effacer la recherche"
            >
              ×
            </button>
          )}
        </div>
        
        {showCarDropdown && filteredCars.length > 0 && (
          <div className="client-dropdown">
            {filteredCars.map(car => (
              <div 
                key={car.id} 
                className="client-option"
                onClick={() => handleCarSelect(car)}
              >
                <div className="client-info">
                  <strong>{car.brand} {car.model} {car.year}</strong>
                  <div className="client-details">
                    <span className="client-email">{car.color}</span>
                    <span className="client-phone">
                      {car.fuel_type === 'petrol' ? '⛽ Essence' : 
                       car.fuel_type === 'diesel' ? '⛽ Diesel' : 
                       car.fuel_type === 'electric' ? '⚡ Électrique' : '⚡⛽ Hybride'}
                    </span>
                    <span className="client-city">
                      {car.transmission === 'automatic' ? 'Automatique' : 'Manuelle'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {showCarDropdown && carSearch && filteredCars.length === 0 && (
          <div className="no-results">
            Aucun véhicule trouvé pour "{carSearch}"
          </div>
        )}
      </>
    ) : (
      /* Carte de véhicule sélectionné */
      <div className="selected-vehicle-card">
        <div className="selected-vehicle-header">
          <h4>Véhicule Sélectionné</h4>
          <button
            type="button"
            className="btn-remove-vehicle"
            onClick={() => {
              setCarSearch('');
              handleChange('car_id', '');
              // Clear matricule aussi si on change de véhicule
              handleChange('matricule_id', '');
              setMatriculeSearch('');
            }}
            title="Changer de véhicule"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="selected-vehicle-content">
          {(() => {
            const selectedCar = cars.find(c => c.id == formData.car_id);
            if (!selectedCar) return null;
            
            return (
              <>
                <div className="vehicle-main-info">
                  <div className="vehicle-model">
                    <FaCar className="vehicle-icon" />
                    <div className="vehicle-name">
                      <span className="vehicle-brand">{selectedCar.brand}</span>
                      <span className="vehicle-model-name">{selectedCar.model} {selectedCar.year}</span>
                    </div>
                    <span className="vehicle-color-badge">{selectedCar.color}</span>
                  </div>
                </div>
                
                <div className="vehicle-details-grid">
                  <div className="vehicle-detail">
                    <FaGasPump className="detail-icon fuel" />
                    <div className="detail-content">
                      <span className="detail-label">Carburant</span>
                      <span className="detail-value">
                        {selectedCar.fuel_type === 'petrol' ? 'Essence' : 
                         selectedCar.fuel_type === 'diesel' ? 'Diesel' : 
                         selectedCar.fuel_type === 'electric' ? 'Électrique' : 'Hybride'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="vehicle-detail">
                    <FaCog className="detail-icon transmission" />
                    <div className="detail-content">
                      <span className="detail-label">Transmission</span>
                      <span className="detail-value">
                        {selectedCar.transmission === 'automatic' ? 'Automatique' : 'Manuelle'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="vehicle-detail">
                    <FaChair className="detail-icon seats" />
                    <div className="detail-content">
                      <span className="detail-label">Places</span>
                      <span className="detail-value">{selectedCar.seats || 5}</span>
                    </div>
                  </div>
                  
                  <div className="vehicle-detail">
                    <FaDoorClosed className="detail-icon doors" />
                    <div className="detail-content">
                      <span className="detail-label">Portes</span>
                      <span className="detail-value">{selectedCar.doors || 4}</span>
                    </div>
                  </div>
                </div>
                
                <div className="vehicle-price-section">
                  <div className="price-badge">
                    <FaMoneyBill className="price-icon" />
                    <div className="price-info">
                      <span className="price-label">Prix par jour</span>
                      <span className="price-amount">{selectedCar.price_per_day} DH</span>
                    </div>
                  </div>
                </div>
                
                {selectedCar.image && (
                  <div className="vehicle-image-container">
                    <img 
                      src={selectedCar.image} 
                      alt={`${selectedCar.brand} ${selectedCar.model}`}
                      className="vehicle-image"
                    />
                  </div>
                )}
              </>
            );
          })()}
        </div>
        
        <button
          type="button"
          className="btn-change-vehicle"
          onClick={() => {
            setCarSearch('');
            handleChange('car_id', '');
            // Clear matricule aussi si on change de véhicule
            handleChange('matricule_id', '');
            setMatriculeSearch('');
          }}
        >
          <FaEdit /> Changer de véhicule
        </button>
      </div>
    )}
  </div>
</div>

        <div className="form-section">
          <h3 className="section-title">
            <FaCalendarAlt />
            Période de Location
          </h3>
          
          <div className="date-selection-container">
            <div className="date-method-section">
              <h4 className="date-method-title">Méthode 1: Sélection par Dates</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required-field">Date de Début</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.start_date || ''}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required-field">Date de Fin</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.end_date || ''}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    min={formData.start_date}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="date-method-divider">
              <span>OU</span>
            </div>

            <div className="date-method-section">
              <h4 className="date-method-title">Méthode 2: Sélection par Jours</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required-field">Date de Début</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.start_date || ''}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required-field">Jours de Location</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.rental_days || ''}
                    onChange={(e) => handleRentalDaysChange(e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="date-summary">
              <h4 className="summary-title">Résumé de la Location</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Date de Début:</span>
                  <span className="summary-value">
                    {formData.start_date ? new Date(formData.start_date).toLocaleDateString('fr-FR') : 'Non définie'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Date de Fin:</span>
                  <span className="summary-value">
                    {formData.end_date ? new Date(formData.end_date).toLocaleDateString('fr-FR') : 'Non définie'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Jours de Location:</span>
                  <span className="summary-value highlight">
                    {formData.rental_days || 0} jour(s)
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Période Totale:</span>
                  <span className="summary-value">
                    {formData.start_date && formData.end_date 
                      ? `${formData.rental_days || 0} jour(s) - Du ${new Date(formData.start_date).toLocaleDateString('fr-FR')} au ${new Date(formData.end_date).toLocaleDateString('fr-FR')}`
                      : 'Période non définie'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-grid">
           <div className="form-group">
  <label className="form-label required-field">Heure de Début</label>
  <input
    type="time"
    className="form-input"
    value={formData.start_time || '08:00'}
    onChange={(e) => handleStartTimeChange(e.target.value)}
    required
    disabled={formData.status === 'confirmed' || formData.status === 'completed'}
    title={formData.status === 'confirmed' || formData.status === 'completed' ? 
           "L'heure est automatiquement définie lorsque le statut est confirmé/complété" : 
           ""}
  />
  {formData.status === 'confirmed' || formData.status === 'completed' ? (
    <div className="help-text">
      ⚠️ L'heure est automatiquement définie à l'heure actuelle pour ce statut
    </div>
  ) : (
    <div className="help-text">
      Par défaut: 08:00 AM. Sera automatiquement mis à jour lors de la confirmation
    </div>
  )}
</div>

<div className="form-group">
  <label className="form-label required-field">Heure de Fin</label>
  <input
    type="time"
    className="form-input"
    value={formData.end_time || '18:00'}
    onChange={(e) => handleEndTimeChange(e.target.value)}
    required
    disabled={formData.status === 'completed' && formData.previousStatus === 'confirmed'}
    title={formData.status === 'completed' && formData.previousStatus === 'confirmed' ? 
           "L'heure de fin a été automatiquement définie lors du passage au statut 'Terminé'. Vous pouvez la modifier si nécessaire." : 
           ""}
  />
  {formData.status === 'completed' && formData.previousStatus === 'confirmed' ? (
    <div className="help-text">
      ⚠️ L'heure de fin a été automatiquement définie à {formData.end_time} lors du passage au statut 'Terminé'
      <br />
      <button
        type="button"
        className="btn-enable-edit-time"
        onClick={() => {
          // Enable editing
          const input = document.querySelector('input[type="time"][name="end_time"]');
          if (input) input.disabled = false;
        }}
      >
        Modifier manuellement
      </button>
    </div>
  ) : formData.status === 'confirmed' ? (
    <div className="help-text">
      ⚠️ L'heure de fin est automatiquement définie à l'heure actuelle pour un statut confirmé
    </div>
  ) : (
    <div className="help-text">
      Par défaut: 06:00 PM. Sera automatiquement mis à jour lors de la confirmation/complétion
    </div>
  )}
</div>
          </div>
        </div>

         <div className="form-section">
        <h3 className="section-title">
          <FaIdCard />
          Informations Matricule
        </h3>
         {!formData.matricule_id ? (
    <>
      {/* Mode Recherche */}
      <div className="form-group">
        <label className="form-label">Sélectionner un Matricule</label>
        <div className="search-container">
          <input
            type="text"
            className="form-input"
            value={matriculeSearch}
            onChange={(e) => {
              setMatriculeSearch(e.target.value);
              setShowMatriculeDropdown(true);
            }}
            onFocus={() => setShowMatriculeDropdown(true)}
            onBlur={() => {
              const timeoutId = setTimeout(() => {
                setShowMatriculeDropdown(false);
              }, 300);
              setBlurTimeoutId(timeoutId);
            }}
            placeholder="Rechercher un matricule ou voiture..."
          />
          {matriculeSearch && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => {
                setMatriculeSearch('');
                handleChange('matricule_id', '');
                setShowMatriculeDropdown(false);
              }}
              title="Effacer la recherche"
            >
              ×
            </button>
          )}
        </div>
        
        {showMatriculeDropdown && filteredMatricules.length > 0 && (
          <div className="client-dropdown">
            {filteredMatricules.map(matricule => {
              const car = cars.find(c => c.id == matricule.car_id);
              return (
                <div 
                  key={matricule.id} 
                  className="client-option"
                  onClick={() => handleMatriculeSelect(matricule)}
                >
                  <div className="client-info">
                    <strong>{matricule.matricule_code}</strong>
                    <div className="client-details">
                      {car && (
                        <>
                          <span className="client-email">{car.brand} {car.model}</span>
                          <span className="client-phone">{car.color}</span>
                        </>
                      )}
                      <span className="client-city">
                        {matricule.status === 'active' ? '✅ Actif' : '❌ Inactif'}
                      </span>
                    </div>
                    <div className="matricule-km">
                      <FaTachometerAlt /> {matricule.kilometrage} km
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {showMatriculeDropdown && matriculeSearch && filteredMatricules.length === 0 && (
          <div className="no-results">
            Aucun matricule trouvé pour "{matriculeSearch}"
          </div>
        )}
      </div>
    </>
  ) : (
    /* Carte de matricule sélectionné */
    <div className="selected-matricule-card">
      <div className="selected-matricule-header">
        <h4>Matricule Sélectionné</h4>
        <button
          type="button"
          className="btn-remove-matricule"
          onClick={() => {
            setMatriculeSearch('');
            handleChange('matricule_id', '');
          }}
          title="Changer de matricule"
        >
          <FaTimes />
        </button>
      </div>
      
      <div className="selected-matricule-content">
        {(() => {
          const selectedMatricule = matricules.find(m => m.id == formData.matricule_id);
          if (!selectedMatricule) return null;
          
          const car = cars.find(c => c.id == selectedMatricule.car_id);
          
          return (
            <>
              <div className="matricule-code-display">
                <FaIdCard className="matricule-icon" />
                <div className="matricule-code-info">
                  <span className="matricule-label">Code Matricule</span>
                  <span className="matricule-code">{selectedMatricule.matricule_code}</span>
                </div>
              </div>
              
              <div className="matricule-status-section">
                <span className="status-label">Statut:</span>
                <span className={`status-badge ${selectedMatricule.status === 'active' ? 'active' : 'inactive'}`}>
                  {selectedMatricule.status === 'active' ? '✅ Actif' : '❌ Inactif'}
                </span>
              </div>
              
              <div className="matricule-kilometer">
                <FaTachometerAlt className="km-icon" />
                <div className="km-info">
                  <span className="km-label">Kilométrage actuel</span>
                  <span className="km-value">{selectedMatricule.kilometrage} km</span>
                </div>
              </div>
              
              {car && (
                <div className="matricule-vehicle-info">
                  <div className="vehicle-association">
                    <FaCar className="association-icon" />
                    <span className="association-label">Véhicule associé</span>
                  </div>
                  <div className="associated-vehicle">
                    <div className="associated-vehicle-name">
                      {car.brand} {car.model} {car.year}
                    </div>
                    <div className="associated-vehicle-specs">
                      <span className="spec-badge color">{car.color}</span>
                      <span className="spec-badge fuel">
                        {car.fuel_type === 'petrol' ? '⛽ Essence' : 
                         car.fuel_type === 'diesel' ? '⛽ Diesel' : 
                         car.fuel_type === 'electric' ? '⚡ Électrique' : '⚡⛽ Hybride'}
                      </span>
                      <span className="spec-badge transmission">
                        {car.transmission === 'automatic' ? 'Auto' : 'Manuelle'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>
      
      <button
        type="button"
        className="btn-change-matricule"
        onClick={() => {
          setMatriculeSearch('');
          handleChange('matricule_id', '');
        }}
      >
        <FaEdit /> Changer de matricule
      </button>
    </div>
  )}

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Kilométrage de Sortie</label>
              <input
                type="number"
                className="form-input"
                value={formData.kilometrage_sortie || ''}
                onChange={(e) => handleChange('kilometrage_sortie', parseInt(e.target.value))}
                min="0"
                step="1"
                placeholder="Rempli automatiquement depuis le km actuel du matricule"
              />
              <div className="help-text">
                Défini automatiquement depuis le kilométrage actuel du matricule
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required-field">Kilométrage de Retour</label>
              <input
                type="number"
                className="form-input"
                value={formData.kilometrage_entree || ''}
                onChange={(e) => handleKilometrageEntreeChange(e.target.value)}
                min="0"
                step="1"
                required={formData.status === 'completed'}
                placeholder="Entrez le kilométrage de retour"
              />
              <div className="help-text">
                {formData.status === 'completed' 
                  ? 'Requis pour les réservations terminées - mettra à jour le kilométrage actuel du matricule'
                  : 'Sera requis lors du marquage de la réservation comme terminée'
                }
                <br />
                <strong>Note:</strong> Si l'augmentation est ≥ 10,000 km, l'Huile et le Filtre à Huile seront réinitialisés.
              </div>
            </div>

            {formData.matricule_id && (
              <div className="form-group">
                <label className="form-label">Kilométrage Actuel du Matricule</label>
                <input
                  type="number"
                  className="form-input"
                  value={carMatricules.find(m => m.id == formData.matricule_id)?.kilometrage || ''}
                  disabled
                />
                <div className="help-text">
                  Sera mis à jour pour correspondre au kilométrage de retour lorsque la réservation est terminée
                </div>
              </div>
            )}
          </div>
        </div>

        {renderPaymentHistory()}

        <div className="form-section">
          <h3 className="section-title">
            <FaMoneyBill />
            Tarification & Paiement
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label required-field">Prix Total (dh)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.total_price || ''}
                onChange={(e) => handleChange('total_price', parseFloat(e.target.value))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Montant Payé</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.amount_paid || 0}
                readOnly
                style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
              />
              <div className="help-text">
                Calculé automatiquement à partir de l'historique des paiements
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Montant Restant</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.remaining_amount || 0}
                readOnly
                style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
              />
              <div className="help-text">
                Calculé automatiquement (Total - Payé)
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Statut</label>
              <select
                className="form-select"
                value={formData.status || 'pending'}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmé</option>
                <option value="contacted">Contacté</option>
                <option value="completed">Terminé</option>
                <option value="retard">En retard</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
  <h3 className="section-title">Notes Supplémentaires</h3>
  <div className="form-group">
    <textarea
      className="form-textarea"
      rows="3"
      value={formData.notes || ''}
      onChange={(e) => handleChange('notes', e.target.value)}
      placeholder="Toutes notes supplémentaires ou exigences particulières..."
    />
  </div>
</div>
      </>
    );
  };


  const renderMatriculeForm = () => {
  const requiredItems = [
    { 
      id: 'oil', 
      name: 'Huile', 
      value: maintenanceFields.oil, 
      date: maintenanceFields.oil_date,
      quantity: maintenanceFields.oil_quantity,
      count: null,
      history: maintenanceFields.oil_history,
      required: true,
      isQuantity: true
    },
    { 
      id: 'filter_oil', 
      name: 'Filtre à Huile', 
      value: maintenanceFields.filter_oil, 
      date: maintenanceFields.filter_oil_date,
      quantity: null,
      count: maintenanceFields.filter_oil_count,
      history: maintenanceFields.filter_oil_history,
      required: true,
      isQuantity: false
    }
  ];

  const optionalItems = [
    { 
      id: 'filter_air', 
      name: 'Filtre à Air', 
      value: maintenanceFields.filter_air, 
      date: maintenanceFields.filter_air_date,
      quantity: null,
      count: maintenanceFields.filter_air_count,
      history: maintenanceFields.filter_air_history,
      required: false,
      isQuantity: false
    },
    { 
      id: 'paquets_de_frein', 
      name: 'Plaquets de Frein', 
      value: maintenanceFields.paquets_de_frein, 
      date: maintenanceFields.paquets_de_frein_date,
      quantity: null,
      count: maintenanceFields.paquets_de_frein_count,
      history: maintenanceFields.paquets_de_frein_history,
      required: false,
      isQuantity: false
    },
    { 
      id: 'ad_blue', 
      name: 'Ad Blue', 
      value: maintenanceFields.ad_blue, 
      date: maintenanceFields.ad_blue_date,
      quantity: maintenanceFields.ad_blue_quantity,
      count: null,
      history: maintenanceFields.ad_blue_history,
      required: false,
      isQuantity: true
    }
  ];

  const additionalRequiredItems = additionalMaintenance.filter(item => item.required_for_vidange);
  const additionalOptionalItems = additionalMaintenance.filter(item => !item.required_for_vidange);
  
  const periodicRequiredItems = periodicKmMaintenance.filter(item => item.required_for_vidange);
  const periodicOptionalItems = periodicKmMaintenance.filter(item => !item.required_for_vidange);

  // NEW: Separate quantity type items from other additional optional items
  const additionalQuantityItems = additionalOptionalItems.filter(item => item.type === 'quantity');
  const additionalOtherOptionalItems = additionalOptionalItems.filter(item => item.type !== 'quantity' && item.type !== 'periodic_km');
  const additionalPeriodicOptionalItems = additionalOptionalItems.filter(item => item.type === 'periodic_km');

  const requiredBaseItemsDone = requiredItems.filter(item => item.value === 'yes').length;
  const totalBaseRequired = requiredItems.length;
  
  const additionalRequiredDone = additionalRequiredItems.filter(item => {
    if (item.type === 'quantity') {
      return item.value && parseFloat(item.value) > 0;
    } else if (item.type === 'note') {
      return !item.needs_attention;
    } else {
      return true; // periodic_km handled separately
    }
  }).length;
  
  const totalAdditionalRequired = additionalRequiredItems.length;
  
  const periodicRequiredDone = periodicRequiredItems.filter(item => !item.needs_attention).length;
  const totalPeriodicRequired = periodicRequiredItems.length;
  
  const completedRequired = requiredBaseItemsDone + additionalRequiredDone + periodicRequiredDone;
  const totalRequired = totalBaseRequired + totalAdditionalRequired + totalPeriodicRequired;
  
  const completionPercentage = totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 100;

  return (
    <>
      <div className="form-group">
        <label className="form-label required-field">Code Matricule</label>
        <input
          type="text"
          className="form-input"
          value={formData.matricule_code || ''}
          onChange={(e) => handleChange('matricule_code', e.target.value)}
          required
        />
      </div>

      <div className="form-group">
    <label className="form-label required-field">Sélectionner un Véhicule</label>
    
    {!formData.car_id ? (
      <>
        {/* Mode Recherche */}
        <div className="search-container">
          <input
            type="text"
            className="form-input"
            value={carSearch}
            onChange={(e) => {
              setCarSearch(e.target.value);
              setShowCarDropdown(true);
            }}
            onFocus={() => setShowCarDropdown(true)}
            onBlur={() => {
              const timeoutId = setTimeout(() => {
                setShowCarDropdown(false);
              }, 300);
              setBlurTimeoutId(timeoutId);
            }}
            placeholder="Rechercher une voiture par marque, modèle, couleur..."
            required={modalType === 'create'}
          />
          {carSearch && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => {
                setCarSearch('');
                handleChange('car_id', '');
                setShowCarDropdown(false);
              }}
              title="Effacer la recherche"
            >
              ×
            </button>
          )}
        </div>
        
        {showCarDropdown && filteredCars.length > 0 && (
          <div className="client-dropdown">
            {filteredCars.map(car => (
              <div 
                key={car.id} 
                className="client-option"
                onClick={() => handleCarSelect(car)}
              >
                <div className="client-info">
                  <strong>{car.brand} {car.model} {car.year}</strong>
                  <div className="client-details">
                    <span className="client-email">{car.color}</span>
                    <span className="client-phone">
                      {car.fuel_type === 'petrol' ? '⛽ Essence' : 
                       car.fuel_type === 'diesel' ? '⛽ Diesel' : 
                       car.fuel_type === 'electric' ? '⚡ Électrique' : '⚡⛽ Hybride'}
                    </span>
                    <span className="client-city">
                      {car.transmission === 'automatic' ? 'Automatique' : 'Manuelle'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {showCarDropdown && carSearch && filteredCars.length === 0 && (
          <div className="no-results">
            Aucun véhicule trouvé pour "{carSearch}"
          </div>
        )}
      </>
    ) : (
      /* Carte de véhicule sélectionné */
      <div className="selected-vehicle-card">
        <div className="selected-vehicle-header">
          <h4>Véhicule Sélectionné</h4>
          <button
            type="button"
            className="btn-remove-vehicle"
            onClick={() => {
              setCarSearch('');
              handleChange('car_id', '');
              // Clear matricule aussi si on change de véhicule
              handleChange('matricule_id', '');
              setMatriculeSearch('');
            }}
            title="Changer de véhicule"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="selected-vehicle-content">
          {(() => {
            const selectedCar = cars.find(c => c.id == formData.car_id);
            if (!selectedCar) return null;
            
            return (
              <>
                <div className="vehicle-main-info">
                  <div className="vehicle-model">
                    <FaCar className="vehicle-icon" />
                    <div className="vehicle-name">
                      <span className="vehicle-brand">{selectedCar.brand}</span>
                      <span className="vehicle-model-name">{selectedCar.model} {selectedCar.year}</span>
                    </div>
                    <span className="vehicle-color-badge">{selectedCar.color}</span>
                  </div>
                </div>
                
                <div className="vehicle-details-grid">
                  <div className="vehicle-detail">
                    <FaGasPump className="detail-icon fuel" />
                    <div className="detail-content">
                      <span className="detail-label">Carburant</span>
                      <span className="detail-value">
                        {selectedCar.fuel_type === 'petrol' ? 'Essence' : 
                         selectedCar.fuel_type === 'diesel' ? 'Diesel' : 
                         selectedCar.fuel_type === 'electric' ? 'Électrique' : 'Hybride'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="vehicle-detail">
                    <FaCog className="detail-icon transmission" />
                    <div className="detail-content">
                      <span className="detail-label">Transmission</span>
                      <span className="detail-value">
                        {selectedCar.transmission === 'automatic' ? 'Automatique' : 'Manuelle'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="vehicle-detail">
                    <FaChair className="detail-icon seats" />
                    <div className="detail-content">
                      <span className="detail-label">Places</span>
                      <span className="detail-value">{selectedCar.seats || 5}</span>
                    </div>
                  </div>
                  
                  <div className="vehicle-detail">
                    <FaDoorClosed className="detail-icon doors" />
                    <div className="detail-content">
                      <span className="detail-label">Portes</span>
                      <span className="detail-value">{selectedCar.doors || 4}</span>
                    </div>
                  </div>
                </div>
                
                <div className="vehicle-price-section">
                  <div className="price-badge">
                    <FaMoneyBill className="price-icon" />
                    <div className="price-info">
                      <span className="price-label">Prix par jour</span>
                      <span className="price-amount">{selectedCar.price_per_day} DH</span>
                    </div>
                  </div>
                </div>
                
                {selectedCar.image && (
                  <div className="vehicle-image-container">
                    <img 
                      src={selectedCar.image} 
                      alt={`${selectedCar.brand} ${selectedCar.model}`}
                      className="vehicle-image"
                    />
                  </div>
                )}
              </>
            );
          })()}
        </div>
        
        <button
          type="button"
          className="btn-change-vehicle"
          onClick={() => {
            setCarSearch('');
            handleChange('car_id', '');
            // Clear matricule aussi si on change de véhicule
            handleChange('matricule_id', '');
            setMatriculeSearch('');
          }}
        >
          <FaEdit /> Changer de véhicule
        </button>
      </div>
    )}
  </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label required-field">Kilométrage Actuel</label>
          <input
            type="number"
            className="form-input"
            value={formData.kilometrage || ''}
            onChange={(e) => handleMatriculeKilometerChange(e.target.value)}
            min="0"
            step="1"
            required
          />
          <div className="help-text">
            <strong>Ancienne valeur: {oldKilometerValue} km</strong><br />
            Si augmentation de 10,000 km ou plus depuis le dernier enregistrement, 
            <strong> SEULEMENT l'Huile et le Filtre à Huile</strong> seront réinitialisés à "Non effectué"
          </div>
        </div>

        <div className="form-group">
          <label className="form-label ">Date de Visite Technique</label>
          <input
            type="date"
            className="form-input"
            value={formData.visit_tech || ''}
            onChange={(e) => handleChange('visit_tech', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Vignette</label>
          <input
            type="date"
            className="form-input"
            value={formData.date_taxe_voiture || ''}
            onChange={(e) => handleChange('date_taxe_voiture', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Date d'Assurance</label>
          <input
            type="date"
            className="form-input"
            value={formData.date_assurance || ''}
            onChange={(e) => handleChange('date_assurance', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Statut</label>
          <select
            className="form-select"
            value={formData.status || 'active'}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Vidange</label>
          <div className="vidange-status-display">
            <select
              className="form-select"
              value={formData.vidange_status || 'not done'}
              disabled
            >
              <option value="not done">Non effectuée</option>
              <option value="done">Effectuée</option>
            </select>
            <div className={`status-indicator ${completionPercentage === 100 ? 'done' : 'not-done'}`}>
              {completionPercentage === 100 ? '✓ Maintenance requise terminée' : '✗ Maintenance requise incomplète'}
            </div>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">Checklist de Maintenance Requise pour la Vidange</h3>
        <p className="maintenance-note">
          <strong>NOUVEAU:</strong> La vidange dépend UNIQUEMENT de l'Huile et du Filtre à Huile.<br />
          Le statut de la vidange sera automatiquement défini sur "Effectuée" lorsque:
          <ol>
            <li>L'Huile est marquée comme "Effectuée"</li>
            <li>Le Filtre à Huile est marquée comme "Effectuée"</li>
            <li>Tous les éléments additionnels marqués comme "Requis pour la vidange" sont complétés</li>
          </ol>
          <br />
          <strong>Note importante:</strong> Si le kilométrage augmente de 10,000 km ou plus depuis le dernier enregistrement, SEULEMENT l'Huile et le Filtre à Huile seront réinitialisés à "Non effectué".
        </p>
        
        <div className="maintenance-category">
          <h4 className="category-title">Éléments REQUIS pour la Vidange *</h4>
          <div className="maintenance-grid">
            {requiredItems.map((item) => (
              <div key={item.id} className="maintenance-item required">
                <div className="maintenance-item-header">
                  <label className="form-label">{item.name} *</label>
                  <div className="maintenance-stats">
                    {item.isQuantity ? (
                      <span className="quantity-stat">
                        Total: {item.quantity || 0} L
                      </span>
                    ) : (
                      <span className="count-stat">
                        Total: {item.count || 0}
                      </span>
                    )}
                  </div>
                </div>
                <div className="maintenance-item-controls">
                  <div className="maintenance-status-display">
                    <span className={`status-badge ${item.value === 'yes' ? 'done' : 'not-done'}`}>
                      {item.value === 'yes' ? '✓ Effectué' : '✗ Non effectué'}
                    </span>
                    {item.date && (
                      <span className="date-display">
                        Dernier: {new Date(item.date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                  
                  <div className="maintenance-actions">
                    <button
                      type="button"
                      className="btn-add-quantity"
                      onClick={() => handleAddQuantity(item.id)}
                      title={`Ajouter ${item.name.toLowerCase()}`}
                    >
                      <FaPlus /> Ajouter
                    </button>
                    
                    <button
                      type="button"
                      className="btn-view-history"
                      onClick={() => handleViewHistory(item.id)}
                      title={`Voir l'historique ${item.name.toLowerCase()}`}
                    >
                      <FaHistoryIcon /> Historique
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {additionalRequiredItems.map((item) => (
              <div key={item.id} className="maintenance-item required additional">
                <div className="maintenance-item-header">
                  <label className="form-label">{item.name} *</label>
                  <span className="additional-item-badge">Additionnel</span>
                </div>
                <div className="maintenance-item-controls">
                  {item.type === 'quantity' ? (
                    <>
                      <div className="quantity-control">
                        <label className="quantity-label">Quantité (L)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-input quantity-input"
                          value={item.value || 0}
                          onChange={(e) => {
                            const updatedMaintenance = additionalMaintenance.map(mainItem => 
                              mainItem.id === item.id 
                                ? { ...mainItem, value: parseFloat(e.target.value) || 0 }
                                : mainItem
                            );
                            setAdditionalMaintenance(updatedMaintenance);
                            handleChange('additional_maintenance', updatedMaintenance);
                          }}
                          min="0"
                        />
                      </div>
                      <div className="maintenance-date-input">
                        <label className="date-label">Date d'exécution</label>
                        <input
                          type="date"
                          className="form-input date-input"
                          value={item.last_done_date || ''}
                          onChange={(e) => handleAdditionalMaintenanceDateChange(item.id, e.target.value)}
                        />
                      </div>
                    </>
                  ) : item.type === 'note' ? (
                    <>
                      <select
                        className="form-select"
                        value={item.needs_attention ? 'no' : 'yes'}
                        onChange={(e) => {
                          const updatedMaintenance = additionalMaintenance.map(mainItem => 
                            mainItem.id === item.id 
                              ? { ...mainItem, needs_attention: e.target.value === 'no' }
                              : mainItem
                          );
                          setAdditionalMaintenance(updatedMaintenance);
                          handleChange('additional_maintenance', updatedMaintenance);
                        }}
                      >
                        <option value="no">Non effectué</option>
                        <option value="yes">Effectué</option>
                      </select>
                      <div className="maintenance-date-input">
                        <label className="date-label">Date d'exécution</label>
                        <input
                          type="date"
                          className="form-input date-input"
                          value={item.last_done_date || ''}
                          onChange={(e) => handleAdditionalMaintenanceDateChange(item.id, e.target.value)}
                          disabled={item.needs_attention}
                        />
                      </div>
                    </>
                  ) : null}
                  <div className="maintenance-item-actions">
                    <button
                      type="button"
                      className="btn-edit-maintenance"
                      onClick={() => handleEditMaintenanceItem(item)}
                      title="Modifier cet élément"
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      className="btn-remove-maintenance"
                      onClick={() => handleRemoveMaintenanceItem(item.id)}
                      title="Supprimer cet élément"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {periodicRequiredItems.map((item) => {
              const currentKm = formData.kilometrage || 0;
              const kmRemaining = Math.max(0, item.next_change_km - currentKm);
              const isOverdue = currentKm >= item.next_change_km;
              
              return (
                <div key={item.id} className="maintenance-item required periodic-km">
                  <div className="maintenance-item-header">
                    <label className="form-label">{item.name} *</label>
                    <span className="periodic-item-badge">
                      <FaRoad /> {item.interval_km} km
                    </span>
                  </div>
                  <div className="maintenance-item-controls">
                    <div className="maintenance-status-display">
                      <span className={`status-badge ${isOverdue ? 'overdue' : 'pending'}`}>
                        {isOverdue ? (
                          <>
                            <FaExclamationCircle /> {currentKm - item.next_change_km} km en retard
                          </>
                        ) : (
                          <>
                            <FaCheckCircle /> {kmRemaining} km restants
                          </>
                        )}
                      </span>
                      {item.last_changed_date && (
                        <span className="date-display">
                          Dernier: {new Date(item.last_changed_date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    
                    <div className="maintenance-actions">
                      <button
                        type="button"
                        className="btn-add-periodic-change"
                        onClick={() => handleAddPeriodicKmChange(item)}
                        title="Enregistrer un changement"
                      >
                        <FaSyncAlt /> Ajouter
                      </button>
                      
                      <button
                        type="button"
                        className="btn-view-history"
                        onClick={() => handleViewPeriodicKmHistory(item)}
                        title="Voir l'historique"
                      >
                        <FaHistoryIcon /> Historique
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="maintenance-category">
          <h4 className="category-title">Éléments Optionnels (Ne pas requis pour la vidange)</h4>
          <div className="maintenance-grid">
            {optionalItems.map((item) => (
              <div key={item.id} className="maintenance-item optional">
                <div className="maintenance-item-header">
                  <label className="form-label">{item.name}</label>
                  <div className="maintenance-stats">
                    {item.isQuantity ? (
                      <span className="quantity-stat">
                        Total: {item.quantity || 0} L
                      </span>
                    ) : (
                      <span className="count-stat">
                        Total: {item.count || 0}
                      </span>
                    )}
                  </div>
                </div>
                <div className="maintenance-item-controls">
                  <div className="maintenance-status-display">
                    <span className={`status-badge ${item.value === 'yes' ? 'done' : 'not-done'}`}>
                      {item.value === 'yes' ? '✓ Effectué' : '✗ Non effectué'}
                    </span>
                    {item.date && (
                      <span className="date-display">
                        Dernier: {new Date(item.date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                  
                  <div className="maintenance-actions">
                    <button
                      type="button"
                      className="btn-add-quantity"
                      onClick={() => handleAddQuantity(item.id)}
                      title={`Ajouter ${item.name.toLowerCase()}`}
                    >
                      <FaPlus /> Ajouter
                    </button>
                    
                    <button
                      type="button"
                      className="btn-view-history"
                      onClick={() => handleViewHistory(item.id)}
                      title={`Voir l'historique ${item.name.toLowerCase()}`}
                    >
                      <FaHistoryIcon /> Historique
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* NEW: Additional quantity items displayed like Huile */}
            {additionalQuantityItems.map((item) => (
              <div key={item.id} className="maintenance-item optional additional-quantity">
                <div className="maintenance-item-header">
                  <label className="form-label">{item.name}</label>
                  <div className="maintenance-stats">
                    <span className="quantity-stat">
                      Total: {item.value || 0} L
                    </span>
                  </div>
                </div>
                <div className="maintenance-item-controls">
                  <div className="maintenance-status-display">
                    <span className={`status-badge ${item.value > 0 ? 'done' : 'not-done'}`}>
                      {item.value > 0 ? '✓ Effectué' : '✗ Non effectué'}
                    </span>
                    {item.last_done_date && (
                      <span className="date-display">
                        Dernier: {new Date(item.last_done_date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                  
                  <div className="maintenance-actions">
                    <button
                      type="button"
                      className="btn-add-quantity"
                      onClick={() => {
                        // Create a custom quantity type for this item
                        setQuantityType(`custom_${item.id}`);
                        setQuantityData({
                          quantity: '',
                          date: new Date().toISOString().split('T')[0]
                        });
                        setShowQuantityModal(true);
                      }}
                      title={`Ajouter ${item.name.toLowerCase()}`}
                    >
                      <FaPlus /> Ajouter
                    </button>
                    
                    <button
                      type="button"
                      className="btn-view-history"
                      onClick={() => {
                        // For now, we'll show a simple alert. You can implement custom history if needed.
                        alert(`Historique pour ${item.name} - Total: ${item.value} L\nCette fonctionnalité sera implémentée prochainement.`);
                      }}
                      title={`Voir l'historique ${item.name.toLowerCase()}`}
                    >
                      <FaHistoryIcon /> Historique
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Other additional optional items (note type) */}
            {additionalOtherOptionalItems.map((item) => (
              <div key={item.id} className="maintenance-item optional additional">
                <div className="maintenance-item-header">
                  <label className="form-label">{item.name}</label>
                  <span className="additional-item-badge">Additionnel</span>
                </div>
                <div className="maintenance-item-controls">
                  <select
                    className="form-select"
                    value={item.needs_attention ? 'no' : 'yes'}
                    onChange={(e) => {
                      const updatedMaintenance = additionalMaintenance.map(mainItem => 
                        mainItem.id === item.id 
                          ? { ...mainItem, needs_attention: e.target.value === 'no' }
                          : mainItem
                      );
                      setAdditionalMaintenance(updatedMaintenance);
                      handleChange('additional_maintenance', updatedMaintenance);
                    }}
                  >
                    <option value="no">Non effectué</option>
                    <option value="yes">Effectué</option>
                  </select>
                  <div className="maintenance-date-input">
                    <label className="date-label">Date d'exécution</label>
                    <input
                      type="date"
                      className="form-input date-input"
                      value={item.last_done_date || ''}
                      onChange={(e) => handleAdditionalMaintenanceDateChange(item.id, e.target.value)}
                      disabled={item.needs_attention}
                    />
                  </div>
                  <div className="maintenance-item-actions">
                    <button
                      type="button"
                      className="btn-edit-maintenance"
                      onClick={() => handleEditMaintenanceItem(item)}
                      title="Modifier cet élément"
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      className="btn-remove-maintenance"
                      onClick={() => handleRemoveMaintenanceItem(item.id)}
                      title="Supprimer cet élément"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Additional periodic optional items */}
            {additionalPeriodicOptionalItems.map((item) => {
              const currentKm = formData.kilometrage || 0;
              const kmRemaining = Math.max(0, item.next_change_km - currentKm);
              const isOverdue = currentKm >= item.next_change_km;
              
              return (
                <div key={item.id} className="maintenance-item optional periodic-km">
                  <div className="maintenance-item-header">
                    <label className="form-label">{item.name}</label>
                    <span className="periodic-item-badge">
                      <FaRoad /> {item.interval_km} km
                    </span>
                  </div>
                  <div className="maintenance-item-controls">
                    <div className="maintenance-status-display">
                      <span className={`status-badge ${isOverdue ? 'overdue' : 'pending'}`}>
                        {isOverdue ? (
                          <>
                            <FaExclamationCircle /> {currentKm - item.next_change_km} km en retard
                          </>
                        ) : (
                          <>
                            <FaCheckCircle /> {kmRemaining} km restants
                          </>
                        )}
                      </span>
                      {item.last_changed_date && (
                        <span className="date-display">
                          Dernier: {new Date(item.last_changed_date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    
                    <div className="maintenance-actions">
                      <button
                        type="button"
                        className="btn-add-periodic-change"
                        onClick={() => handleAddPeriodicKmChange(item)}
                        title="Enregistrer un changement"
                      >
                        <FaSyncAlt /> Ajouter
                      </button>
                      
                      <button
                        type="button"
                        className="btn-view-history"
                        onClick={() => handleViewPeriodicKmHistory(item)}
                        title="Voir l'historique"
                      >
                        <FaHistoryIcon /> Historique
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Periodic optional items */}
            {periodicOptionalItems.map((item) => {
              const currentKm = formData.kilometrage || 0;
              const kmRemaining = Math.max(0, item.next_change_km - currentKm);
              const isOverdue = currentKm >= item.next_change_km;
              
              return (
                <div key={item.id} className="maintenance-item optional periodic-km">
                  <div className="maintenance-item-header">
                    <label className="form-label">{item.name}</label>
                    <span className="periodic-item-badge">
                      <FaRoad /> {item.interval_km} km
                    </span>
                  </div>
                  <div className="maintenance-item-controls">
                    <div className="maintenance-status-display">
                      <span className={`status-badge ${isOverdue ? 'overdue' : 'pending'}`}>
                        {isOverdue ? (
                          <>
                            <FaExclamationCircle /> {currentKm - item.next_change_km} km en retard
                          </>
                        ) : (
                          <>
                            <FaCheckCircle /> {kmRemaining} km restants
                          </>
                        )}
                      </span>
                      {item.last_changed_date && (
                        <span className="date-display">
                          Dernier: {new Date(item.last_changed_date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    
                    <div className="maintenance-actions">
                      <button
                        type="button"
                        className="btn-add-periodic-change"
                        onClick={() => handleAddPeriodicKmChange(item)}
                        title="Enregistrer un changement"
                      >
                        <FaSyncAlt /> Ajouter
                      </button>
                      
                      <button
                        type="button"
                        className="btn-view-history"
                        onClick={() => handleViewPeriodicKmHistory(item)}
                        title="Voir l'historique"
                      >
                        <FaHistoryIcon /> Historique
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="maintenance-summary">
          <div className={`summary-card ${completionPercentage === 100 ? 'completed' : 'pending'}`}>
            <h4>Statut de la Maintenance Requise pour la Vidange</h4>
            <p>
              {completionPercentage === 100 
                ? '✓ Toutes les tâches REQUISES pour la vidange sont terminées! La vidange peut être marquée comme "Effectuée".'
                : `✗ ${completedRequired} sur ${totalRequired} tâches REQUISES pour la vidange sont terminées.`
              }
              <br />
              <strong>Requiert:</strong> Huile ✓ + Filtre à Huile ✓ + Éléments additionnels requis ✓
            </p>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {completedRequired}/{totalRequired} tâches REQUISES terminées ({Math.round(completionPercentage)}%)
            </div>
          </div>
        </div>
      </div>
<div className="form-section full-width-maintenance full-width">
      <div className="form-section">
        <h3 className="section-title">Maintenance Additionnelle</h3>
        <p className="maintenance-note">
          Ajoutez des éléments de maintenance supplémentaires avec suivi de quantité ou notes.
          Cochez "Requis pour la vidange" pour inclure cet élément dans la checklist de maintenance requise.
          <br /><br />
          <strong>Note:</strong> Vous pouvez maintenant modifier les éléments existants en cliquant sur l'icône <FaEdit />.
        </p>

        <div className="additional-maintenance-actions">
          <button 
            type="button" 
            className="btn-add-maintenance"
            onClick={() => {
              setEditingMaintenanceItem(null);
              setNewMaintenanceItem({
                name: '',
                type: 'note',
                value: '',
                interval_km: '',
                notes: '',
                required_for_vidange: false,
                needs_attention: false,
                due_date: '',
                last_done_date: ''
              });
              setShowAddMaintenance(true);
            }}
          >
            <FaPlus />
            {editingMaintenanceItem ? 'Modifier un Élément' : 'Ajouter un Élément de Maintenance'}
          </button>
        </div>

        {showAddMaintenance && (
          <div className="add-maintenance-form ">
            <h4>{editingMaintenanceItem ? 'Modifier l\'Élément' : 'Nouvel Élément de Maintenance'}</h4>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label required-field">Nom</label>
                <input
                  type="text"
                  className="form-input"
                  value={newMaintenanceItem.name}
                  onChange={(e) => setNewMaintenanceItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Vidange moteur, Liquide de frein, Courroie distribution..."
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label required-field">Type</label>
                <select
                  className="form-select"
                  value={newMaintenanceItem.type}
                  onChange={(e) => setNewMaintenanceItem(prev => ({ 
                    ...prev, 
                    type: e.target.value,
                    value: e.target.value === 'quantity' ? '' : prev.value,
                    interval_km: e.target.value === 'periodic_km' ? '' : ''
                  }))}
                  required
                >
                  {maintenanceTypeOptions.map(option => {
                    const Icon = option.icon;
                    return (
                      <option key={option.value} value={option.value}>
                        <Icon /> {option.label}
                      </option>
                    );
                  })}
                </select>
              </div>
              {newMaintenanceItem.type === 'quantity' ? (
                <div className="form-group">
                  <label className="form-label required-field">Quantité (L)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={newMaintenanceItem.value}
                    onChange={(e) => setNewMaintenanceItem(prev => ({ ...prev, value: e.target.value }))}
                    min="0.1"
                    required
                    placeholder="Ex: 1.5"
                  />
                </div>
              ) : newMaintenanceItem.type === 'periodic_km' ? (
                <div className="form-group">
                  <label className="form-label required-field">Intervalle de Kilométrage</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newMaintenanceItem.interval_km}
                    onChange={(e) => setNewMaintenanceItem(prev => ({ ...prev, interval_km: e.target.value }))}
                    min="1"
                    required
                    placeholder="Ex: 60000 pour 60,000 km"
                  />
                  <div className="help-text">
                    Le premier intervalle commence au kilométrage actuel: {formData.kilometrage || 0} km
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Valeur/Note</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newMaintenanceItem.value}
                    onChange={(e) => setNewMaintenanceItem(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Description ou note..."
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Notes Supplémentaires</label>
                <input
                  type="text"
                  className="form-input"
                  value={newMaintenanceItem.notes}
                  onChange={(e) => setNewMaintenanceItem(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes optionnelles..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date de dernière exécution</label>
                <input
                  type="date"
                  className="form-input"
                  value={newMaintenanceItem.last_done_date || ''}
                  onChange={(e) => setNewMaintenanceItem(prev => ({ 
                    ...prev, 
                    last_done_date: e.target.value 
                  }))}
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newMaintenanceItem.required_for_vidange || false}
                    onChange={(e) => setNewMaintenanceItem(prev => ({ 
                      ...prev, 
                      required_for_vidange: e.target.checked 
                    }))}
                  />
                  Requis pour la vidange
                </label>
              </div>
              {newMaintenanceItem.type !== 'periodic_km' && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newMaintenanceItem.needs_attention || false}
                      onChange={(e) => setNewMaintenanceItem(prev => ({ 
                        ...prev, 
                        needs_attention: e.target.checked 
                      }))}
                    />
                    Nécessite une attention immédiate
                    </label>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Date d'échéance</label>
                <input
                  type="date"
                  className="form-input"
                  value={newMaintenanceItem.due_date || ''}
                  onChange={(e) => setNewMaintenanceItem(prev => ({ 
                    ...prev, 
                    due_date: e.target.value 
                  }))}
                />
              </div>
            </div>
            <div className="maintenance-form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => {
                  setShowAddMaintenance(false);
                  setEditingMaintenanceItem(null);
                }}
              >
                Annuler
              </button>
              <button 
                type="button" 
                className="btn-primary"
                onClick={editingMaintenanceItem ? handleUpdateMaintenanceItem : handleAddMaintenanceItem}
              >
                {editingMaintenanceItem ? (
                  <>
                    <FaSave /> Mettre à jour
                  </>
                ) : (
                  'Ajouter l\'Élément'
                )}
              </button>
            </div>
          </div>
        )}

        {(additionalMaintenance.length > 0 || periodicKmMaintenance.length > 0) && (
          <div className="additional-maintenance-list">
            <h4>Éléments de Maintenance Additionnelle ({additionalMaintenance.length + periodicKmMaintenance.length})</h4>
            <div className="maintenance-table">
              <div className="maintenance-header">
                <span>Nom</span>
                <span>Type</span>
                <span>Valeur</span>
                <span>Date exécution</span>
                <span>Requis pour vidange</span>
                <span>Statut</span>
                <span>Actions</span>
              </div>
              {additionalMaintenance.map((item, index) => (
                <div key={item.id} className="maintenance-row">
                  <span className="maintenance-name">{item.name}</span>
                  <span className="maintenance-type">
                    {item.type === 'quantity' ? 'Quantité (L)' : 'Note'}
                  </span>
                  <span className="maintenance-value">
                    {item.type === 'quantity' ? `${item.value} L` : item.value}
                  </span>
                  <span className="maintenance-date">
                    {item.last_done_date ? new Date(item.last_done_date).toLocaleDateString('fr-FR') : 'Non définie'}
                  </span>
                  <span className="maintenance-required">
                    {item.required_for_vidange ? (
                      <span className="required-badge">✓ Requis</span>
                    ) : (
                      <span className="optional-badge">Optionnel</span>
                    )}
                  </span>
                  <span className="maintenance-status">
                    {item.needs_attention ? (
                      <span className="status-needs-attention">⚠️ Attention requise</span>
                    ) : item.type === 'quantity' ? (
                      <span className={`status-${item.value > 0 ? 'ok' : 'warning'}`}>
                        {item.value > 0 ? '✓ OK' : '✗ Vide'}
                      </span>
                    ) : (
                      <span className="status-ok">✓ OK</span>
                    )}
                  </span>
                  <span className="maintenance-actions">
                    <button
                      type="button"
                      className="btn-edit-maintenance"
                      onClick={() => handleEditMaintenanceItem(item)}
                      title="Modifier cet élément"
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      className="btn-delete-maintenance enhanced-delete-btn"
                      onClick={() => handleRemoveMaintenanceItem(item.id)}
                      title="Supprimer cet élément"
                    >
                      <FaTrash />
                    </button>
                  </span>
                </div>
              ))}
              {periodicKmMaintenance.map((item, index) => {
                const currentKm = formData.kilometrage || 0;
                const isOverdue = currentKm >= item.next_change_km;
                
                return (
                  <div key={item.id} className="maintenance-row periodic-km-row">
                    <span className="maintenance-name">{item.name}</span>
                    <span className="maintenance-type">
                      <FaRoad /> {item.interval_km} km
                    </span>
                    <span className="maintenance-value">
                      {item.change_count || 0} changement(s)
                    </span>
                    <span className="maintenance-date">
                      {item.last_changed_date ? new Date(item.last_changed_date).toLocaleDateString('fr-FR') : 'Jamais'}
                    </span>
                    <span className="maintenance-required">
                      {item.required_for_vidange ? (
                        <span className="required-badge">✓ Requis</span>
                      ) : (
                        <span className="optional-badge">Optionnel</span>
                      )}
                    </span>
                    <span className="maintenance-status">
                      {isOverdue ? (
                        <span className="status-overdue">⚠️ {currentKm - item.next_change_km} km en retard</span>
                      ) : (
                        <span className="status-ok">✓ {item.next_change_km - currentKm} km restants</span>
                      )}
                    </span>
                    <span className="maintenance-actions">
                      <button
                        type="button"
                        className="btn-edit-maintenance"
                        onClick={() => handleEditMaintenanceItem(item)}
                        title="Modifier cet élément"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        className="btn-delete-maintenance enhanced-delete-btn"
                        onClick={() => handleRemoveMaintenanceItem(item.id)}
                        title="Supprimer cet élément"
                      >
                        <FaTrash />
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div></div>

      {/* History and Quantity Modals */}
      {showHistoryModal && <HistoryModal />}
      {showQuantityModal && <QuantityModal />}
      {showPeriodicKmModal && <PeriodicKmChangeModal />}
      {showPeriodicKmHistoryModal && <PeriodicKmHistoryModal />}
    </>
  );
};

  const renderClientForm = () => {
    const cinIsPdf = isPdfFile(formData.cin_image) || formData.cin_is_pdf;
    const driverLicenseIsPdf = isPdfFile(formData.driver_license_image) || formData.driver_license_is_pdf;
    
    const getCinFileUrl = () => {
      if (typeof formData.cin_image === 'string' && formData.cin_image.startsWith('data:')) {
        return formData.cin_image;
      }
      if (formData.cin_image_url) return formData.cin_image_url;
      if (typeof formData.cin_image === 'string' && (formData.cin_image.includes('clients/') || formData.cin_image.includes('storage/'))) {
        return `${window.location.origin}/storage/${formData.cin_image.replace('storage/', '')}`;
      }
      return formData.cin_image || '';
    };
    
    const getDriverLicenseFileUrl = () => {
      if (typeof formData.driver_license_image === 'string' && formData.driver_license_image.startsWith('data:')) {
        return formData.driver_license_image;
      }
      if (formData.driver_license_image_url) return formData.driver_license_image_url;
      if (typeof formData.driver_license_image === 'string' && (formData.driver_license_image.includes('clients/') || formData.driver_license_image.includes('storage/'))) {
        return `${window.location.origin}/storage/${formData.driver_license_image.replace('storage/', '')}`;
      }
      return formData.driver_license_image || '';
    };

    const getCinDisplayUrl = () => {
      const url = getCinFileUrl();
      if (cinIsPdf && !url.startsWith('data:')) {
        return 'https://via.placeholder.com/300x200?text=Document+PDF';
      }
      return url;
    };

    const getDriverLicenseDisplayUrl = () => {
      const url = getDriverLicenseFileUrl();
      if (driverLicenseIsPdf && !url.startsWith('data:')) {
        return 'https://via.placeholder.com/300x200?text=Document+PDF';
      }
      return url;
    };

    const handleCinDelete = () => {
      handleChange('cin_image', '');
      handleChange('cin_image_url', '');
      handleChange('cin_is_pdf', false);
      setFormData(prev => ({
        ...prev,
        cin_image: '',
        cin_image_url: '',
        cin_is_pdf: false
      }));
    };

    const handleDriverLicenseDelete = () => {
      handleChange('driver_license_image', '');
      handleChange('driver_license_image_url', '');
      handleChange('driver_license_is_pdf', false);
      setFormData(prev => ({
        ...prev,
        driver_license_image: '',
        driver_license_image_url: '',
        driver_license_is_pdf: false
      }));
    };

    return (
      <>
        <div className="form-section">
          <h3 className="section-title">
            <FaUser />
            Informations Personnelles
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label required-field">Prénom</label>
              <input
                type="text"
                className="form-input"
                value={formData.prenom || ''}
                onChange={(e) => handleChange('prenom', e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label required-field">Nom</label>
              <input
                type="text"
                className="form-input"
                value={formData.nom || ''}
                onChange={(e) => handleChange('nom', e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label required-field">Téléphone</label>
              <input
                type="tel"
                className="form-input"
                value={formData.telephone || ''}
                onChange={(e) => handleChange('telephone', e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Ville</label>
              <input
                type="text"
                className="form-input"
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">
            <FaCalendarAlt />
            Informations de Naissance
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Date de Naissance</label>
              <input
                type="date"
                className="form-input"
                value={formData.date_naissance || ''}
                onChange={(e) => handleChange('date_naissance', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lieu de Naissance</label>
              <input
                type="text"
                className="form-input"
                value={formData.lieu_naissance || ''}
                onChange={(e) => handleChange('lieu_naissance', e.target.value)}
                placeholder="Ville de naissance"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">
            <FaIdCard />
            Informations CIN
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Numéro CIN</label>
              <input
                type="text"
                className="form-input"
                value={formData.cin_number || ''}
                onChange={(e) => handleChange('cin_number', e.target.value)}
                placeholder="Numéro de Carte d'Identité Nationale"
              />
            </div>

            <div className="form-group">
              <label className="form-label">CIN Expire le</label>
              <input
                type="date"
                className="form-input"
                value={formData.cin_delivre_le || ''}
                onChange={(e) => handleChange('cin_delivre_le', e.target.value)}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Document CIN</label>
            <div className="file-upload-section">
              <input
                type="file"
                id="cin-file-input"
                className="form-input"
                accept="image/*,.pdf"
                onChange={(e) => handleImageUpload('cin_image', e.target.files[0])}
              />
              <div className="help-text">Accepte les images (JPG, PNG) et les fichiers PDF</div>
              
              {(getCinFileUrl()) && (
                <div className="document-preview">
                  {cinIsPdf ? (
                    <div className="pdf-preview">
                      <FaFilePdf className="pdf-icon" />
                      <span>
                        {typeof formData.cin_image === 'string' && formData.cin_image.startsWith('data:') 
                          ? 'Nouveau Document PDF CIN' 
                          : 'Document PDF CIN'
                        }
                      </span>
                      <div className="preview-actions">
                        <button
                          type="button"
                          className="btn-view-document"
                          onClick={() => handleViewFile(getCinFileUrl(), true)}
                          title="Voir le PDF"
                        >
                          <FaEye />
                          Voir {typeof formData.cin_image === 'string' && formData.cin_image.startsWith('data:') ? '(Nouveau)' : ''}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="image-preview-container">
                      <div className="preview-header">
                        <span>
                          {typeof formData.cin_image === 'string' && formData.cin_image.startsWith('data:') 
                            ? 'Nouvelle Image CIN' 
                            : 'Image CIN'
                          }
                        </span>
                        <button
                          type="button"
                          className="btn-view-document"
                          onClick={() => handleViewFile(getCinFileUrl(), false)}
                          title="Voir l'image en plein écran"
                        >
                          <FaEye />
                          Agrandir {typeof formData.cin_image === 'string' && formData.cin_image.startsWith('data:') ? '(Nouveau)' : ''}
                        </button>
                      </div>
                      <img 
                        src={getCinDisplayUrl()} 
                        alt="CIN" 
                        className="preview-image" 
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x200?text=Image+non+disponible';
                          e.target.onerror = null;
                        }}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    className="delete-image-btn"
                    onClick={handleCinDelete}
                    title="Supprimer le document"
                  >
                    <FaTrash />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">
            <FaCar />
            Informations Permis de Conduire
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Numéro de Permis</label>
              <input
                type="text"
                className="form-input"
                value={formData.driver_license_number || ''}
                onChange={(e) => handleChange('driver_license_number', e.target.value)}
                placeholder="Numéro de permis de conduire"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Permis Délivré le</label>
              <input
                type="date"
                className="form-input"
                value={formData.permis_delivre_le || ''}
                onChange={(e) => handleChange('permis_delivre_le', e.target.value)}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Document Permis</label>
            <div className="file-upload-section">
              <input
                type="file"
                id="license-file-input"
                className="form-input"
                accept="image/*,.pdf"
                onChange={(e) => handleImageUpload('driver_license_image', e.target.files[0])}
              />
              <div className="help-text">Accepte les images (JPG, PNG) et les fichiers PDF</div>
              
              {(getDriverLicenseFileUrl()) && (
                <div className="document-preview">
                  {driverLicenseIsPdf ? (
                    <div className="pdf-preview">
                      <FaFilePdf className="pdf-icon" />
                      <span>
                        {typeof formData.driver_license_image === 'string' && formData.driver_license_image.startsWith('data:') 
                          ? 'Nouveau Document PDF Permis' 
                          : 'Document PDF Permis'
                        }
                      </span>
                      <div className="preview-actions">
                        <button
                          type="button"
                          className="btn-view-document"
                          onClick={() => handleViewFile(getDriverLicenseFileUrl(), true)}
                          title="Voir le PDF"
                        >
                          <FaEye />
                          Voir {typeof formData.driver_license_image === 'string' && formData.driver_license_image.startsWith('data:') ? '(Nouveau)' : ''}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="image-preview-container">
                      <div className="preview-header">
                        <span>
                          {typeof formData.driver_license_image === 'string' && formData.driver_license_image.startsWith('data:') 
                            ? 'Nouvelle Image Permis' 
                            : 'Image Permis'
                          }
                        </span>
                        <button
                          type="button"
                          className="btn-view-document"
                          onClick={() => handleViewFile(getDriverLicenseFileUrl(), false)}
                          title="Voir l'image en plein écran"
                        >
                          <FaEye />
                          Agrandir {typeof formData.driver_license_image === 'string' && formData.driver_license_image.startsWith('data:') ? '(Nouveau)' : ''}
                        </button>
                      </div>
                      <img 
                        src={getDriverLicenseDisplayUrl()} 
                        alt="Permis de conduire" 
                        className="preview-image" 
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x200?text=Image+non+disponible';
                          e.target.onerror = null;
                        }}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    className="delete-image-btn"
                    onClick={handleDriverLicenseDelete}
                    title="Supprimer le document"
                  >
                    <FaTrash />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderCarsForm = () => {
    return (
      <>
        <div className="form-section">
          <h3 className="section-title">
            <FaCar />
            Informations de Base
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label required-field">Marque</label>
              <input
                type="text"
                className="form-input"
                value={formData.brand || ''}
                onChange={(e) => handleChange('brand', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required-field">Modèle</label>
              <input
                type="text"
                className="form-input"
                value={formData.model || ''}
                onChange={(e) => handleChange('model', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required-field">Année</label>
              <input
                type="number"
                className="form-input"
                value={formData.year || ''}
                onChange={(e) => handleChange('year', parseInt(e.target.value))}
                min="1900"
                max={new Date().getFullYear() + 1}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required-field">Couleur</label>
              <input
                type="text"
                className="form-input"
                value={formData.color || ''}
                onChange={(e) => handleChange('color', e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">
            <FaMoneyBill />
            Tarification & Statut
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label required-field">Prix par Jour (dh)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.price_per_day || ''}
                onChange={(e) => handleChange('price_per_day', parseFloat(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Statut</label>
              <select
                className="form-select"
                value={formData.status || 'disponible'}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="disponible">Disponible</option>
                <option value="non disponible">Non disponible</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">
            <FaCog />
            Spécifications
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label required-field">Type de Carburant</label>
              <select
                className="form-select"
                value={formData.fuel_type || 'petrol'}
                onChange={(e) => handleChange('fuel_type', e.target.value)}
                required
              >
                <option value="petrol">Essence</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Électrique</option>
                <option value="hybrid">Hybride</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label required-field">Transmission</label>
              <select
                className="form-select"
                value={formData.transmission || 'automatic'}
                onChange={(e) => handleChange('transmission', e.target.value)}
                required
              >
                <option value="manual">Manuelle</option>
                <option value="automatic">Automatique</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label required-field">Places</label>
              <input
                type="number"
                className="form-input"
                value={formData.seats || 5}
                onChange={(e) => handleChange('seats', parseInt(e.target.value))}
                min="1"
                max="20"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required-field">Portes</label>
              <input
                type="number"
                className="form-input"
                value={formData.doors || 4}
                onChange={(e) => handleChange('doors', parseInt(e.target.value))}
                min="1"
                max="6"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">
            <FaImage />
            Image du Véhicule
          </h3>
          <div className="form-group">
            <label className="form-label">Image du Véhicule</label>
            <input
              type="file"
              className="form-input"
              accept="image/*"
              onChange={(e) => handleImageUpload('image', e.target.files[0])}
            />
            {formData.image && (
              <div className="image-preview">
                <img 
                  src={formData.image} 
                  alt="Véhicule" 
                  className="preview-image" 
                  onError={(e) => {
                    if (formData.image_url) {
                      e.target.src = formData.image_url;
                    }
                  }}
                />
                <button
                  type="button"
                  className="delete-image-btn"
                  onClick={() => handleSingleImageDelete('image')}
                  title="Supprimer l'image"
                >
                  <FaTrash />
                </button>
              </div>
            )}
            {formData.image_url && !formData.image && (
              <div className="image-preview">
                <img src={formData.image_url} alt="Véhicule" className="preview-image" />
                <button
                  type="button"
                  className="delete-image-btn"
                  onClick={() => handleSingleImageDelete('image')}
                  title="Supprimer l'image"
                >
                  <FaTrash />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Informations Supplémentaires</h3>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Entrez la description du véhicule, ses caractéristiques ou notes supplémentaires..."
            />
          </div>
        </div>
      </>
    );
  };

  const renderFormFields = () => {
    switch (type) {
      case 'reservations':
        return renderReservationForm();
      
      case 'accidents':
        return renderAccidentForm();
      
      case 'users':
        return (
          <>
            <div className="form-group">
              <label className="form-label required-field">Nom Complet</label>
              <input
                type="text"
                className="form-input"
                value={formData.Fullname || ''}
                onChange={(e) => handleChange('Fullname', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                className="form-input"
                value={formData.password || ''}
                onChange={(e) => handleChange('password', e.target.value)}
                required={modalType === 'create'}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Rôle</label>
              <select
                className="form-select"
                value={formData.role || 'employee'}
                onChange={(e) => handleChange('role', e.target.value)}
              >
                <option value="employee">Employé</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          </>
        );
      
      case 'cars':
        return renderCarsForm();

      case 'clients':
        return renderClientForm();

      case 'contacts':
        return (
          <>
            <div className="form-group">
              <label className="form-label required-field">Nom Complet</label>
              <input
                type="text"
                className="form-input"
                value={formData.fullname || ''}
                onChange={(e) => handleChange('fullname', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required-field">Email</label>
              <input
                type="email"
                className="form-input"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label required-field">Message</label>
              <textarea
                className="form-textarea"
                rows="4"
                value={formData.message || ''}
                onChange={(e) => handleChange('message', e.target.value)}
                required
              />
            </div>
          </>
        );

      case 'matricules':
        return renderMatriculeForm();

      default:
        return (
          <div className="form-group">
            <p>Formulaire pour {type} n'est pas encore implémenté.</p>
          </div>
        );
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <button 
          className="close-button"
          onClick={onClose}
          disabled={submitting}
        >
          <FaTimes />
        </button>
        
        <h2 className="modal-title">
          {modalType === 'create' ? 'Ajouter un Nouveau' : 'Modifier'} {type.slice(0, -1)}
        </h2>
        
        <form onSubmit={onSubmit} className="modal-form">
          <div className="form-grid">
            {renderFormFields()}
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Traitement...' : (modalType === 'create' ? 'Créer' : 'Mettre à jour')}
            </button>
          </div>
        </form>
      </div>

      {showCustomAlert && (
        <CustomAlert 
          message={alertMessage} 
          onClose={() => setShowCustomAlert(false)} 
        />
      )}

      <style jsx>{`
        .modal-overlay {
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
          padding: 20px;
          backdrop-filter: blur(5px);
        }

        .modal-container {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .close-button {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          transition: color 0.3s ease;
          padding: 5px;
          border-radius: 4px;
        }

        .close-button:hover:not(:disabled) {
          color: #dc2626;
          background: #f9fafb;
        }

        .close-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 2rem;
          text-align: center;
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-section {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 0.7rem;
          background: #f9fafb;
        }

        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
          
          .form-group:last-child:nth-child(odd) {
            grid-column: 1 / -1;
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .required-field::after {
          content: ' *';
          color: #dc2626;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 0.75rem 0.6rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: white;
          font-family: inherit;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .form-input:disabled,
        .form-select:disabled {
          background: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }

        .form-input:read-only {
          background-color: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }

        .form-input:read-only:focus {
          border-color: #e5e7eb;
          box-shadow: none;
        }

        /* Search container styles */
        .search-container {
          position: relative;
        }

        .clear-search-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 1.5rem;
          padding: 0 5px;
        }

        .clear-search-btn:hover {
          color: #dc2626;
        }

        .client-dropdown {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          max-height: 200px;
          overflow-y: auto;
          margin-top: 0.5rem;
          background: white;
        }

        .client-option {
          padding: 0.75rem 1rem;
          cursor: pointer;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s;
        }

        .client-option:hover {
          background: #f3f4f6;
        }

        .client-option:last-child {
          border-bottom: none;
        }

        .client-info strong {
          display: block;
          color: #1f2937;
        }

        .client-details {
          display: flex;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #6b7280;
          margin-top: 0.25rem;
          flex-wrap: wrap;
        }

        .client-email,
        .client-phone,
        .client-city {
          background: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
        }

        .no-results {
          color: #6b7280;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          padding: 0.5rem;
          text-align: center;
          font-style: italic;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #4b5563;
        }

        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .image-preview {
          margin-top: 0.5rem;
          position: relative;
          display: inline-block;
        }

        .preview-image {
          max-width: 100%;
          max-height: 200px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .delete-image-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(220, 38, 38, 0.9);
          color: white;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .delete-image-btn:hover {
          background: #dc2626;
          transform: scale(1.1);
        }

        .images-preview {
          margin-top: 1rem;
        }

        .images-preview h4 {
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          color: #374151;
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.75rem;
        }

        .preview-item {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .preview-item img {
          width: 100%;
          height: 100px;
          object-fit: cover;
          border-radius: 6px;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .btn-primary,
        .btn-secondary {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          min-width: 100px;
        }

        .btn-primary {
          background: #dc2626;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #b91c1c;
          transform: translateY(-1px);
        }

        .btn-primary:disabled,
        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #4b5563;
          transform: translateY(-1px);
        }

        .help-text {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
          font-style: italic;
        }

        .vidange-status-display {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .status-indicator {
          padding: 0.5rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          text-align: center;
        }

        .status-indicator.done {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .status-indicator.not-done {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        /* Maintenance Categories */
        .maintenance-category {
          margin-bottom: 1.5rem;
        }

        .category-title {
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .maintenance-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        @media (min-width: 768px) {
          .maintenance-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .maintenance-item {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .maintenance-item.required label::after {
          content: ' *';
          color: #dc2626;
        }

        .maintenance-item.additional {
          border-left: 4px solid #3b82f6;
          padding-left: 0.75rem;
        }

        .maintenance-item.periodic-km {
          border-left: 4px solid #10b981;
          padding-left: 0.75rem;
        }

        .maintenance-item-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .maintenance-stats {
          font-size: 0.8rem;
          font-weight: 600;
        }

        .quantity-stat {
          color: #3b82f6;
        }

        .count-stat {
          color: #10b981;
        }

        .maintenance-item-controls {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        @media (min-width: 768px) {
          .maintenance-item-controls {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
          }
        }

        .maintenance-status-display {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .status-badge.done {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .status-badge.not-done {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .status-badge.pending {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }

        .status-badge.overdue {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .date-display {
          font-size: 0.7rem;
          color: #6b7280;
        }

        .maintenance-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-add-quantity,
        .btn-add-periodic-change {
          background: #10b981;
          color: white;
          border: none;
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          transition: background 0.3s ease;
        }

        .btn-add-quantity:hover,
        .btn-add-periodic-change:hover {
          background: #059669;
        }

        .btn-view-history {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          transition: background 0.3s ease;
        }

        .btn-view-history:hover {
          background: #2563eb;
        }

        .quantity-control {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
        }

        .quantity-label {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }

        .quantity-input {
          min-width: 100px;
        }

        .maintenance-date-input {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
        }

        .date-label {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }

        .date-input {
          min-width: 120px;
        }

        .maintenance-item-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-edit-maintenance {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
          transition: background 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          height: fit-content;
        }

        .btn-edit-maintenance:hover {
          background: #dbeafe;
        }

        .btn-remove-maintenance {
          background: none;
          border: none;
          color: #dc2626;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
          transition: background 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          height: fit-content;
        }

        .btn-remove-maintenance:hover {
          background: #fef2f2;
        }

        .enhanced-delete-btn {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
          border: none;
          padding: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          height: fit-content;
          box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
        }

        .enhanced-delete-btn:hover {
          background: linear-gradient(135deg, #b91c1c, #991b1b);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
        }

        .enhanced-delete-btn:active {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(220, 38, 38, 0.2);
        }

        .additional-item-badge {
          background: #3b82f6;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .periodic-item-badge {
          background: #10b981;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .maintenance-note {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: #f3f4f6;
          border-radius: 6px;
          border-left: 4px solid #dc2626;
        }

        .maintenance-summary {
          margin-top: 1rem;
        }

        .summary-card {
          padding: 1.5rem;
          border-radius: 8px;
          border: 2px solid;
        }

        .summary-card.completed {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        .summary-card.pending {
          background: #fffbeb;
          border-color: #fed7aa;
        }

        .summary-card h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          color: #1f2937;
        }

        .summary-card p {
          margin: 0 0 1rem 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: #dc2626;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 0.75rem;
          color: #6b7280;
          text-align: center;
        }

        /* Periodic KM Info Styles */
        .periodic-km-info {
          background: #f3f4f6;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          padding: 0.25rem 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .info-row:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .info-label {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .info-value {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .info-value.highlight {
          color: #dc2626;
          font-weight: 700;
        }

        /* Periodic KM row styles */
        .periodic-km-row {
          background: #f0fdf9;
        }

        .periodic-km-row:hover {
          background: #dcfce7;
        }

        .status-overdue {
          color: #dc2626;
          font-weight: 600;
          font-size: 0.8rem;
        }

        /* Payment History Styles */
        .payment-summary {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .payment-totals {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .total-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: white;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }

        .total-label {
          font-weight: 600;
          color: #495057;
        }

        .total-value {
          font-weight: 700;
          font-size: 1.1rem;
        }

        .total-value.paid {
          color: #28a745;
        }

        .total-value.remaining {
          color: #dc3545;
        }

        .payment-history-actions {
          margin-bottom: 1rem;
        }

        .btn-add-payment {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #28a745;
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background 0.3s ease;
        }

        .btn-add-payment:hover {
          background: #218838;
        }

        .add-payment-form {
          background: #e9ecef;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .add-payment-form h4 {
          margin: 0 0 1rem 0;
          color: #495057;
        }

        .payment-form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1rem;
        }

        .payment-history-list h4 {
          margin: 0 0 1rem 0;
          color: #495057;
        }

        .payments-table {
          border: 1px solid #e9ecef;
          border-radius: 8px;
          overflow: hidden;
        }

        .payment-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 2fr 0.5fr;
          gap: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          font-weight: 600;
          color: #495057;
          border-bottom: 1px solid #e9ecef;
        }

        .payment-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 2fr 0.5fr;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid #f8f9fa;
          align-items: center;
        }

        .payment-row:last-child {
          border-bottom: none;
        }

        .payment-row:hover {
          background: #f8f9fa;
        }

        .payment-method {
          text-transform: capitalize;
        }

        .payment-amount {
          font-weight: 600;
          color: #28a745;
        }

        .payment-notes {
          color: #6c757d;
          font-size: 0.875rem;
        }

        .payment-actions {
          display: flex;
          justify-content: center;
        }

        .btn-delete-payment {
          background: none;
          border: none;
          color: #dc3545;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: background 0.3s ease;
        }

        .btn-delete-payment:hover {
          background: #f8d7da;
        }

        .no-payments {
          text-align: center;
          padding: 2rem;
          color: #6c757d;
        }

        .no-payments svg {
          font-size: 2rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        /* Additional Maintenance Styles */
        .additional-maintenance-actions {
          margin-bottom: 1rem;
        }

        .btn-add-maintenance {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #28a745;
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background 0.3s ease;
        }

        .btn-add-maintenance:hover {
          background: #218838;
        }

        .add-maintenance-form {
          background: #e9ecef;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .add-maintenance-form h4 {
          margin: 0 0 1rem 0;
          color: #495057;
        }

        .maintenance-form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1rem;
        }

        .additional-maintenance-list h4 {
          margin: 0 0 1rem 0;
          color: #495057;
        }

        .maintenance-table {
          border: 1px solid #e9ecef;
          border-radius: 8px;
          overflow: hidden;
        }

        .maintenance-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 0.5fr;
          gap: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          font-weight: 600;
          color: #495057;
          border-bottom: 1px solid #e9ecef;
        }

        .maintenance-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 0.5fr;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid #f8f9fa;
          align-items: center;
        }

        .maintenance-row:last-child {
          border-bottom: none;
        }

        .maintenance-row:hover {
          background: #f8f9fa;
        }

        .maintenance-name {
          font-weight: 500;
        }

        .maintenance-type {
          text-transform: capitalize;
          font-size: 0.8rem;
          color: #6c757d;
        }

        .maintenance-value {
          font-weight: 600;
          color: #28a745;
        }

        .maintenance-date {
          font-size: 0.8rem;
          color: #6c757d;
        }

        .maintenance-required {
          text-align: center;
          font-weight: 600;
        }

        .maintenance-status {
          font-size: 0.8rem;
          font-weight: 600;
        }

        .status-ok {
          color: #28a745;
        }

        .status-warning {
          color: #dc2626;
        }

        .status-needs-attention {
          color: #dc3545;
        }

        .maintenance-actions {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-delete-maintenance {
          background: none;
          border: none;
          color: #dc3545;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: background 0.3s ease;
        }

        .btn-delete-maintenance:hover {
          background: #f8d7da;
        }

        /* Custom Alert Styles */
        .custom-alert {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, #ff6b35, #f7931e);
          color: white;
          padding: 1.5rem 2rem;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(255, 107, 53, 0.3);
          z-index: 10000;
          text-align: center;
          max-width: 400px;
          width: 90%;
          border: 2px solid #ff8c42;
          animation: alertSlideIn 0.3s ease-out;
        }

        .custom-alert-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .custom-alert-icon {
          font-size: 2rem;
          color: #fff;
        }

        .custom-alert-title {
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0;
          color: white;
        }

        .custom-alert-message {
          font-size: 0.95rem;
          margin: 0;
          line-height: 1.4;
          color: rgba(255, 255, 255, 0.95);
        }

        .custom-alert-details {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.75rem;
          border-radius: 8px;
          margin-top: 0.5rem;
          font-size: 0.85rem;
          width: 100%;
        }

        .custom-alert-close {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 0.5rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          margin-top: 0.5rem;
          transition: all 0.3s ease;
        }

        .custom-alert-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        @keyframes alertSlideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -60%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        .alert-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 9999;
          animation: overlayFadeIn 0.3s ease-out;
        }

        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* History and Quantity Modal Styles */
        .history-modal,
        .quantity-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10001;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .history-modal-content,
        .quantity-modal-content {
          position: relative;
          z-index: 10002;
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          animation: modalSlideIn 0.3s ease-out;
        }

        .history-modal-header,
        .quantity-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .history-modal-title,
        .quantity-modal-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .history-modal-close,
        .quantity-modal-close {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 1.2rem;
          padding: 0.25rem;
          border-radius: 4px;
          transition: color 0.3s ease;
        }

        .history-modal-close:hover,
        .quantity-modal-close:hover {
          color: #dc2626;
          background: #f9fafb;
        }

        .history-summary {
          background: #f3f4f6;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
        }

        .quantity-summary,
        .count-summary,
        .periodic-km-summary {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .periodic-km-summary {
          flex-direction: column;
          align-items: stretch;
          gap: 0.5rem;
        }

        .summary-label {
          font-weight: 600;
          color: #374151;
        }

        .summary-value {
          font-size: 1.2rem;
          font-weight: 700;
          color: #3b82f6;
        }

        .history-list {
          margin-bottom: 1.5rem;
        }

        .history-table {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .history-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 0.5fr;
          gap: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          font-weight: 600;
          color: #495057;
          border-bottom: 1px solid #e5e7eb;
        }

        .history-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 0.5fr;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid #f8f9fa;
          align-items: center;
        }

        .history-row:last-child {
          border-bottom: none;
        }

        .history-row:hover {
          background: #f8f9fa;
        }

        .quantity-cell {
          font-weight: 600;
          color: #3b82f6;
        }

        .history-actions {
          display: flex;
          justify-content: center;
        }

        .btn-delete-history {
          background: none;
          border: none;
          color: #dc3545;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: background 0.3s ease;
        }

        .btn-delete-history:hover {
          background: #f8d7da;
        }

        .no-history {
          text-align: center;
          padding: 2rem;
          color: #6c757d;
        }

        .no-history svg {
          font-size: 2rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .history-modal-actions,
        .quantity-modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .quantity-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .quantity-summary-preview {
          background: #f3f4f6;
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1rem;
        }

        .quantity-summary-preview h4 {
          margin: 0 0 0.5rem 0;
          color: #374151;
        }

        .preview-details p {
          margin: 0.25rem 0;
          font-size: 0.9rem;
          color: #6b7280;
        }

        .preview-details strong {
          color: #374151;
        }

        /* Badges for maintenance */
        .required-badge {
          background: #dc2626;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .optional-badge {
          background: #6b7280;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Custom Delete Alert Styles */
        .custom-delete-alert {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10001;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .custom-delete-alert .alert-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          animation: overlayFadeIn 0.3s ease-out;
        }

        .custom-delete-alert .custom-alert-content {
          position: relative;
          z-index: 10002;
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 400px;
          width: 90%;
          animation: alertSlideIn 0.3s ease-out;
          text-align: center;
          border: 2px solid #dc2626;
        }

        .custom-delete-alert .custom-alert-icon {
          font-size: 3rem;
          color: #dc2626;
          margin-bottom: 1rem;
        }

        .custom-delete-alert .custom-alert-icon span {
          font-size: 3rem;
          display: block;
        }

        .custom-delete-alert h3 {
          color: #1f2937;
          font-size: 1.3rem;
          margin: 0 0 1rem 0;
          font-weight: 700;
        }

        .custom-delete-alert p {
          color: #4b5563;
          margin: 0.5rem 0;
          line-height: 1.5;
        }

        .custom-delete-alert .warning-text {
          color: #dc2626;
          font-weight: 600;
          font-size: 0.95rem;
          margin-top: 0.75rem;
          padding: 0.5rem;
          background: #fef2f2;
          border-radius: 6px;
          border: 1px solid #fecaca;
        }

        .custom-delete-alert .alert-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          justify-content: center;
        }

        .custom-delete-alert .btn-cancel {
          background: #6b7280;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          min-width: 100px;
        }

        .custom-delete-alert .btn-cancel:hover {
          background: #4b5563;
          transform: translateY(-2px);
        }

        .custom-delete-alert .btn-confirm-delete {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          min-width: 100px;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        .custom-delete-alert .btn-confirm-delete:hover {
          background: linear-gradient(135deg, #b91c1c, #991b1b);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
        }

        .custom-delete-alert .btn-confirm-delete:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .modal-container {
            padding: 1.5rem;
            margin: 10px;
          }
          
          .modal-actions {
            flex-direction: column;
          }
          
          .btn-primary,
          .btn-secondary {
            width: 100%;
          }

          .preview-grid {
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          }

          .payment-header,
          .payment-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .payment-header span:not(:first-child),
          .payment-row span:not(:first-child) {
            display: none;
          }

          .payment-totals {
            grid-template-columns: 1fr;
          }

          .maintenance-header,
          .maintenance-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .maintenance-header span:not(:first-child),
          .maintenance-row span:not(:first-child) {
            display: none;
          }

          .maintenance-item-controls {
            flex-direction: column;
          }

          .maintenance-item-actions {
            align-self: flex-start;
          }

          .maintenance-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .history-header,
          .history-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .history-header span:not(:first-child),
          .history-row span:not(:first-child) {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .modal-container {
            padding: 1rem;
          }
          
          .modal-title {
            font-size: 1.3rem;
            margin-bottom: 1.5rem;
          }
          
          .form-section {
            padding: 1rem;
          }
        }

        @media (min-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 767px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
          .maintenance-item.additional-quantity {
    border-left: 4px solid #8b5cf6;
    padding-left: 0.75rem;
  }
    /* PDF and Image Preview Styles */
.pdf-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 8px;
  padding: 1.5rem;
  border: 2px solid #3b82f6;
  position: relative;
  text-align: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.pdf-preview.pdf-uploaded {
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-color: #3b82f6;
}

.pdf-preview.old-pdf {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-color: #f59e0b;
}

.pdf-icon {
  font-size: 3rem;
  color: #3b82f6;
}

.pdf-preview.old-pdf .pdf-icon {
  color: #f59e0b;
}

.pdf-preview span {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.95rem;
}

.pdf-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

/* Image Preview Container */
.image-preview-container {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  border: 2px solid #10b981;
  margin-top: 1rem;
}

.image-preview-container.old-image {
  border-color: #f59e0b;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.preview-header span {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.95rem;
}

.preview-header .btn-view-document {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
}

/* Document Preview Styles */
.document-preview {
  margin-top: 1rem;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.document-preview:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.document-preview .delete-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.document-preview .delete-image-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

/* File Upload Section */
.file-upload-section {
  position: relative;
}

.file-upload-section .form-input[type="file"] {
  padding: 0.5rem;
  border: 2px dashed #d1d5db;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-upload-section .form-input[type="file"]:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.file-upload-section .help-text {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
  font-style: italic;
}

/* Accident Report Button */
.btn-add-to-report {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
  margin: 0.5rem 0;
}

.btn-add-to-report:hover:not(:disabled) {
  background: linear-gradient(135deg, #b91c1c, #991b1b);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3);
}

.btn-add-to-report:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);
}

.btn-add-to-report:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-add-to-report .icon {
  font-size: 1rem;
}

/* Forphie Badge */
.forphie-badge {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

/* Procedure Notification */
.procedure-notification {
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border: 2px solid #3b82f6;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.procedure-notification svg {
  color: #3b82f6;
  font-size: 1.25rem;
  margin-top: 0.125rem;
}

.procedure-notification span {
  color: #1e40af;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
}

/* Required Field Indicator */
.required-field {
  position: relative;
}

.required-field::before {
  content: '*';
  color: #dc2626;
  margin-right: 0.25rem;
}

/* Status Information */
.status-info .status-details {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e9ecef;
}

.status-item:last-child {
  border-bottom: none;
}

.status-item strong {
  color: #495057;
  font-size: 0.9rem;
}

.status-item span {
  font-size: 0.875rem;
  color: #6c757d;
}

.matricule-status {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.matricule-status.active {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.matricule-status.inactive {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.matricule-status.unknown {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

/* Custom Delete Alert */
.custom-delete-alert {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-delete-alert .alert-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
}

.custom-delete-alert .custom-alert-content {
  position: relative;
  z-index: 10001;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  text-align: center;
  animation: modalSlideIn 0.3s ease-out;
}

.custom-delete-alert .custom-alert-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #dc2626;
}

.custom-delete-alert h3 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.custom-delete-alert p {
  color: #6b7280;
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.custom-delete-alert .warning-text {
  color: #dc2626;
  font-weight: 600;
  font-size: 0.9rem;
}

.custom-delete-alert .alert-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.custom-delete-alert .btn-cancel {
  background: #6b7280;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease;
}

.custom-delete-alert .btn-cancel:hover {
  background: #4b5563;
}

.custom-delete-alert .btn-confirm-delete {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
}

.custom-delete-alert .btn-confirm-delete:hover {
  background: linear-gradient(135deg, #b91c1c, #991b1b);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3);
}

/* Enhanced Delete Button Styles */
.btn-delete-history,
.btn-delete-payment,
.btn-delete-maintenance.enhanced-delete-btn {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
  min-width: 32px;
  min-height: 32px;
}

.btn-delete-history:hover,
.btn-delete-payment:hover,
.btn-delete-maintenance.enhanced-delete-btn:hover {
  background: linear-gradient(135deg, #b91c1c, #991b1b);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
}

.btn-delete-history:active,
.btn-delete-payment:active,
.btn-delete-maintenance.enhanced-delete-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(220, 38, 38, 0.2);
}

/* View Document Button */
.btn-view-document {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.btn-view-document:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.btn-view-document:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(59, 130, 246, 0.2);
}

/* Animation Keyframes */
@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .document-preview .delete-image-btn {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }
  
  .pdf-preview {
    padding: 1rem;
  }
  
  .pdf-icon {
    font-size: 2.5rem;
  }
  
  .btn-add-to-report {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
  
  .status-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .status-item span {
    align-self: flex-end;
  }
}

/* Print Styles */
@media print {
  .btn-add-to-report,
  .delete-image-btn,
  .btn-view-document,
  .modal-actions,
  .close-button {
    display: none !important;
  }
  
  .document-preview {
    border: 1px solid #ccc;
    break-inside: avoid;
  }
}
  /* Styles pour les modes de sélection */
.second-driver-mode {
  margin-top: 1rem;
}

.mode-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.btn-mode {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  background: white;
  color: #6b7280;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.btn-mode:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.btn-mode.active {
  border-color: #3b82f6;
  background: #3b82f6;
  color: white;
  margin:8px
}

/* Formulaire de création de client */
.new-client-form {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
  border: 2px solid #e5e7eb;
}

.new-client-form h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.new-client-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.temp-badge {
  background: #10b981;
  color: white;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}
  /* Main Client Selection Styles - Match Second Driver */
.selected-primary-client-card {
    border: 2px solid #3b82f6;
    border-radius: 12px;
    padding: 1.5rem;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    margin-top: 1rem;
    transition: all 0.3s ease;
}

.selected-primary-client-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
}

.primary-client-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #d1e7ff;
}

.primary-client-header h4 {
    margin: 0;
    color: #1e40af;
    font-size: 1.1rem;
    font-weight: 600;
}

.btn-change-primary-client {
    background: none;
    border: none;
    color: #dc2626;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.3s ease;
    font-size: 0.9rem;
}

.btn-change-primary-client:hover {
    background: #fee2e2;
    transform: scale(1.1);
}

.primary-client-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
}

.primary-client-name,
.primary-client-contact,
.primary-client-email,
.primary-client-cin,
.primary-client-license {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #374151;
    padding: 0.5rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    transition: all 0.3s ease;
}

.primary-client-name {
    font-weight: 600;
    font-size: 1rem;
    color: #1e3a8a;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid #3b82f6;
}

.primary-client-details div:hover {
    background: #f8fafc;
    transform: translateX(5px);
}

.primary-client-contact {
    color: #065f46;
}

.primary-client-email {
    color: #7c3aed;
}

.primary-client-cin {
    color: #92400e;
}

.primary-client-license {
    color: #1d4ed8;
}

.primary-temp-badge {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: 0.5rem;
    box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
}

.btn-change-primary-driver {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border: none;
    color: white;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.btn-change-primary-driver:hover {
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

/* Secondary Driver Card Enhancements */
.selected-client-card {
    border: 2px solid #10b981;
    border-radius: 12px;
    padding: 1.5rem;
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    margin-top: 1rem;
    transition: all 0.3s ease;
}

.selected-client-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.15);
}

.selected-client-header h4 {
    margin: 0;
    color: #065f46;
    font-size: 1.1rem;
    font-weight: 600;
}

.btn-remove-client {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border: 1px solid #fca5a5;
    color: #dc2626;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    transition: all 0.3s ease;
}

.btn-remove-client:hover {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    transform: scale(1.1);
}

.selected-client-details div {
    padding: 0.5rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    transition: all 0.3s ease;
}

.selected-client-details div:hover {
    background: #f8fafc;
    transform: translateX(5px);
}

.client-name {
    background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
    border: 1px solid #10b981;
    color: #065f46;
}

.client-contact {
    color: #065f46;
}

.client-email {
    color: #7c3aed;
}

.client-cin {
    color: #92400e;
}

.client-license {
    color: #1d4ed8;
}

.temp-badge {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: 0.5rem;
    box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
}

.btn-change-driver {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: none;
    color: white;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.btn-change-driver:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
}

/* Mode buttons styling for consistency */
.second-driver-mode .mode-buttons {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
}

.btn-mode {
    padding: 0.75rem 1.5rem;
    border: 2px solid #e5e7eb;
    background: white;
    color: #6b7280;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    flex: 1;
    min-width: 200px;
    justify-content: center;
}

.btn-mode:hover:not(.active) {
    border-color: #3b82f6;
    color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.btn-mode.active {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border-color: transparent;
    color: white;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

/* New client form styling */
.new-client-form {
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
    background: white;
    margin-top: 1rem;
}

.new-client-form h4 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: #1e40af;
    font-size: 1.2rem;
    text-align: center;
}

.new-client-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
    justify-content: center;
}

/* Main driver mode buttons */
.primary-client-mode .mode-buttons {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
}

/* Animation for card appearance */
@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.selected-primary-client-card,
.selected-client-card {
    animation: slideInUp 0.3s ease-out;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .selected-primary-client-card,
    .selected-client-card {
        padding: 1rem;
    }
    
    .btn-mode {
        min-width: 100%;
    }
    
    .new-client-actions {
        flex-direction: column;
    }
    
    .primary-client-details div,
    .selected-client-details div {
        font-size: 0.85rem;
    }
}
    /* Mode buttons container */
.mode-buttons-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mode-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.btn-mode {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e5e7eb;
  background: white;
  color: #6b7280;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 200px;
  justify-content: center;
  font-size: 0.875rem;
}

.btn-mode:hover:not(.active) {
  border-color: #3b82f6;
  color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.btn-mode.active {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.new-client-notice {
  background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
  border: 1px solid #93c5fd;
  color: #1e40af;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

/* Main Client Card Styles */
.selected-primary-client-card {
  border: 2px solid #3b82f6;
  border-radius: 12px;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  margin-top: 1rem;
  transition: all 0.3s ease;
  animation: slideInUp 0.3s ease-out;
}

.selected-primary-client-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
}

.primary-client-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #d1e7ff;
}

.primary-client-header h4 {
  margin: 0;
  color: #1e40af;
  font-size: 1.1rem;
  font-weight: 600;
}

.btn-change-primary-client {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.btn-change-primary-client:hover {
  background: #fee2e2;
  transform: scale(1.1);
}

.primary-client-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.primary-client-name,
.primary-client-contact,
.primary-client-email,
.primary-client-city,
.primary-client-cin,
.primary-client-license {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #374151;
  padding: 0.5rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.primary-client-name {
  font-weight: 600;
  font-size: 1rem;
  color: #1e3a8a;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #3b82f6;
}

.primary-client-details div:hover {
  background: #f8fafc;
  transform: translateX(5px);
}

.primary-client-contact {
  color: #065f46;
}

.primary-client-email {
  color: #7c3aed;
}

.primary-client-city {
  color: #059669;
}

.primary-client-cin {
  color: #92400e;
}

.primary-client-license {
  color: #1d4ed8;
}

.primary-temp-badge {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
}

.btn-change-primary-driver {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.btn-change-primary-driver:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

/* Animation */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .selected-primary-client-card {
    padding: 1rem;
  }
  
  .btn-mode {
    min-width: 100%;
  }
  
  .primary-client-details div {
    font-size: 0.85rem;
  }
}
  /* Carte Véhicule Sélectionné */
.selected-vehicle-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px;
  margin-top: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.selected-vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f3f4f6;
}

.selected-vehicle-header h4 {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}

.btn-remove-vehicle {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-remove-vehicle:hover {
  background: #dc2626;
}

.vehicle-main-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.vehicle-icon {
  color: #3b82f6;
  font-size: 24px;
}

.vehicle-model {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.vehicle-name {
  display: flex;
  flex-direction: column;
}

.vehicle-brand {
  font-weight: 700;
  color: #1f2937;
  font-size: 16px;
}

.vehicle-model-name {
  color: #6b7280;
  font-size: 14px;
}

.vehicle-color-badge {
  background: #3b82f6;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.vehicle-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.vehicle-detail {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.detail-icon {
  font-size: 20px;
}

.detail-icon.fuel {
  color: #10b981;
}

.detail-icon.transmission {
  color: #8b5cf6;
}

.detail-icon.seats {
  color: #f59e0b;
}

.detail-icon.doors {
  color: #ef4444;
}

.detail-content {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.vehicle-price-section {
  margin-bottom: 20px;
}

.price-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border-radius: 8px;
}

.price-icon {
  font-size: 22px;
}

.price-info {
  display: flex;
  flex-direction: column;
}

.price-label {
  font-size: 12px;
  opacity: 0.9;
}

.price-amount {
  font-size: 18px;
  font-weight: 700;
}

.vehicle-image-container {
  margin-bottom: 20px;
}

.vehicle-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
}

.btn-change-vehicle {
  width: 100%;
  padding: 12px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-change-vehicle:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

/* Carte Matricule Sélectionné */
.selected-matricule-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px;
  margin-top: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.selected-matricule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f3f4f6;
}

.selected-matricule-header h4 {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}

.btn-remove-matricule {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-remove-matricule:hover {
  background: #dc2626;
}

.matricule-code-display {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 15px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border-radius: 8px;
  color: white;
}

.matricule-icon {
  font-size: 24px;
}

.matricule-code-info {
  display: flex;
  flex-direction: column;
}

.matricule-label {
  font-size: 12px;
  opacity: 0.9;
}

.matricule-code {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
}

.matricule-status-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.status-label {
  font-weight: 600;
  color: #6b7280;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.matricule-kilometer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
}

.km-icon {
  color: #3b82f6;
  font-size: 20px;
}

.km-info {
  display: flex;
  flex-direction: column;
}

.km-label {
  font-size: 12px;
  color: #6b7280;
}

.km-value {
  font-weight: 700;
  color: #1f2937;
  font-size: 16px;
}

.matricule-vehicle-info {
  background: #f9fafb;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.vehicle-association {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.association-icon {
  color: #10b981;
  font-size: 18px;
}

.association-label {
  font-weight: 600;
  color: #374151;
}

.associated-vehicle-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  font-size: 15px;
}

.associated-vehicle-specs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.spec-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.spec-badge.color {
  background: #dbeafe;
  color: #1e40af;
}

.spec-badge.fuel {
  background: #dcfce7;
  color: #166534;
}

.spec-badge.transmission {
  background: #f3e8ff;
  color: #7c3aed;
}

.btn-change-matricule {
  width: 100%;
  padding: 12px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-change-matricule:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}
  /* Animation pour les cartes de véhicule et matricule */
.selected-vehicle-card,
.selected-matricule-card {
  animation: slideInUp 0.3s ease-out;
  transition: all 0.3s ease;
}

.selected-vehicle-card:hover,
.selected-matricule-card:hover {
  transform: translateY(-2px);
}

/* Animation de pulsation pour les badges */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* Animation pour les badges de couleur */
.vehicle-color-badge {
  animation: pulse 2s infinite;
}

/* Animation pour le code matricule */
.matricule-code {
  animation: codeGlow 3s infinite alternate;
}

@keyframes codeGlow {
  from {
    text-shadow: 0 0 5px rgba(139, 92, 246, 0.5);
  }
  to {
    text-shadow: 0 0 10px rgba(139, 92, 246, 0.8), 0 0 20px rgba(139, 92, 246, 0.6);
  }
}

/* Animation pour les icônes */
.vehicle-icon,
.matricule-icon {
  animation: iconFloat 3s ease-in-out infinite;
}

@keyframes iconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

/* Animation pour le badge de statut */
.status-badge.active {
  animation: statusPulse 4s infinite;
}

@keyframes statusPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
}

/* Animation pour le kilométrage */
.km-icon {
  animation: kmRotate 6s linear infinite;
}

@keyframes kmRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Animation pour les badges de spécifications */
.spec-badge {
  animation: fadeInUp 0.5s ease-out;
}

.spec-badge:nth-child(1) { animation-delay: 0.1s; }
.spec-badge:nth-child(2) { animation-delay: 0.2s; }
.spec-badge:nth-child(3) { animation-delay: 0.3s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Animation pour le prix */
.price-badge {
  animation: priceGlow 4s infinite alternate;
}

@keyframes priceGlow {
  from {
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  }
  to {
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.2);
  }
}

/* Animation pour l'image du véhicule */
.vehicle-image {
  animation: imageReveal 0.8s ease-out;
}

@keyframes imageReveal {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Animation pour les détails du véhicule */
.vehicle-detail {
  animation: slideInRight 0.5s ease-out;
}

.vehicle-detail:nth-child(1) { animation-delay: 0.1s; }
.vehicle-detail:nth-child(2) { animation-delay: 0.2s; }
.vehicle-detail:nth-child(3) { animation-delay: 0.3s; }
.vehicle-detail:nth-child(4) { animation-delay: 0.4s; }

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Animation pour l'association véhicule */
.vehicle-association {
  animation: slideInLeft 0.5s ease-out;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
  /* Full-width maintenance section */
.full-width-maintenance {
  grid-column: 1 / -1 !important;
  width: 100% !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.maintenance-full-width-container {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

/* Make maintenance grid full width */
.maintenance-grid.full-width {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  width: 100%;
}

/* Additional maintenance list full width */
.additional-maintenance-list.full-width {
  width: 100%;
  overflow-x: auto;
}

/* Maintenance table full width */
.maintenance-table.full-width {
  width: 100%;
  min-width: 1000px;
}

/* Add maintenance form full width */
.add-maintenance-form.full-width {
  width: 100%;
  grid-column: 1 / -1;
}

/* Maintenance summary full width */
.maintenance-summary.full-width {
  width: 100%;
  grid-column: 1 / -1;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .maintenance-grid.full-width {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .maintenance-grid.full-width {
    grid-template-columns: 1fr;
  }
  
  .maintenance-table.full-width {
    min-width: 800px;
  }
}
      `}</style>
    </div>
  );
};

export default AdminModal;