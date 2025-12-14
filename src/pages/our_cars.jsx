import React, { useState, useEffect } from 'react';
import { FaCar, FaUsers, FaDoorOpen, FaGasPump, FaCog, FaChevronLeft, FaChevronRight, FaFilter, FaCalendarAlt, FaUser, FaIdCard, FaTimes, FaSpinner, FaSearch, FaClock, FaCheckCircle, FaExclamationTriangle, FaWhatsapp } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCars, selectCars, selectCarsLoading, selectCarsError, createClient, createReservation, fetchClients, selectClients, fetchMatricules, selectMatricules, selectMatriculesLoading } from '../Redux/store';
import { useNavigate } from 'react-router-dom';

function OurCars() {
    const dispatch = useDispatch();
    const cars = useSelector(selectCars);
    const clients = useSelector(selectClients);
    const matricules = useSelector(selectMatricules);
    const matriculesLoading = useSelector(selectMatriculesLoading);
    const loading = useSelector(selectCarsLoading);
    const error = useSelector(selectCarsError);
    const navigate = useNavigate();
    
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        brand: '',
        fuel_type: '',
        price_range: ''
    });
    const [showReservationForm, setShowReservationForm] = useState(false);
    const [selectedCar, setSelectedCar] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [searchingClient, setSearchingClient] = useState(false);
    const [clientSearch, setClientSearch] = useState({
        phone: '',
        email: ''
    });
    const [foundClient, setFoundClient] = useState(null);
    const [reservationData, setReservationData] = useState({
        // Client Information
        nom: '',
        prenom: '',
        telephone: '',
        email: '',
        city: '',
        
        // Reservation Information
        start_date: '',
        end_date: '',
        start_time: '08:00',
        end_time: '18:00',
        total_days: 0,
        total_price: 0,
    });

    // Scroll to top on component mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // New state for prompts
    const [showPrompt, setShowPrompt] = useState(false);
    const [promptType, setPromptType] = useState(''); // 'success' or 'error'
    const [promptMessage, setPromptMessage] = useState('');

    const carsPerPage = 16;

    useEffect(() => {
        dispatch(fetchCars());
        dispatch(fetchClients());
        dispatch(fetchMatricules());
    }, [dispatch]);

    // ✅ UPDATED: Function to check if a car has active matricules (for reservation purposes)
    const hasActiveMatricules = (carId) => {
        if (!matricules || !matricules.length) {
            return false;
        }
        
        const carMatricules = matricules.filter(matricule => matricule.car_id === carId);
        return carMatricules.some(matricule => matricule.status === 'active');
    };

    // ✅ UPDATED: Function to get car availability status based on status field from AdminModal
    const getCarAvailability = (car) => {
        // Use the car's status field directly from the database
        return car.status || 'non disponible';
    };

    // ✅ UPDATED: Function to get available matricules for a car
    const getAvailableMatricules = (carId) => {
        if (!matricules || !matricules.length) return [];
        return matricules.filter(matricule => 
            matricule.car_id === carId && matricule.status === 'active'
        );
    };

    // WhatsApp integration
    const handleWhatsAppClick = (car = null) => {
        const phoneNumber = "212665921921";
        let message = "Bonjour, je suis intéressé pour réserver une voiture";
        
        if (car) {
            message += ` - ${car.brand} ${car.model}`;
        }
        
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    };

    // Add the getCarImageUrl function
    const getCarImageUrl = (car) => {
        if (car.image_url) {
            return car.image_url;
        }
        if (car.image && typeof car.image === 'string') {
            // If it's a full URL, use it directly
            if (car.image.startsWith('http')) {
                return car.image;
            }
            // If it's a relative path, construct the full URL
            return `https://oulfa-back-production.up.railway.app/storage/${car.image}`;
        }
        return null;
    };

    // Show prompt function
    const showAlertPrompt = (type, message) => {
        setPromptType(type);
        setPromptMessage(message);
        setShowPrompt(true);
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            setShowPrompt(false);
        }, 5000);
    };

    // Get unique brands, fuel types, and price ranges from cars data
    const uniqueBrands = [...new Set(cars.map(car => car.brand).filter(Boolean))].sort();
    const uniqueFuelTypes = [...new Set(cars.map(car => car.fuel_type).filter(Boolean))].sort();
    
    // Filter cars based on selected filters
    const filteredCars = cars.filter(car => {
        // Brand filter
        if (filters.brand && car.brand !== filters.brand) {
            return false;
        }
        
        // Fuel type filter
        if (filters.fuel_type && car.fuel_type !== filters.fuel_type) {
            return false;
        }
        
        // Price range filter
        if (filters.price_range) {
            const price = car.price_per_day || 0;
            switch (filters.price_range) {
                case '0-50':
                    if (price > 50) return false;
                    break;
                case '50-100':
                    if (price <= 50 || price > 100) return false;
                    break;
                case '100-200':
                    if (price <= 100 || price > 200) return false;
                    break;
                case '200+':
                    if (price <= 200) return false;
                    break;
                default:
                    break;
            }
        }
        
        return true;
    });

    // Calculate pagination based on filtered cars
    const totalPages = Math.ceil(filteredCars.length / carsPerPage);
    const indexOfLastCar = currentPage * carsPerPage;
    const indexOfFirstCar = indexOfLastCar - carsPerPage;
    const currentCars = filteredCars.slice(indexOfFirstCar, indexOfLastCar);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    // Handle filter changes
    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            brand: '',
            fuel_type: '',
            price_range: ''
        });
    };

    // Search for existing client
    const searchClient = () => {
        setSearchingClient(true);
        
        // Search by phone or email
        const existingClient = clients.find(client => 
            client.telephone === clientSearch.phone || 
            client.email === clientSearch.email
        );

        if (existingClient) {
            setFoundClient(existingClient);
            // Pre-fill the form with client data
            setReservationData(prev => ({
                ...prev,
                nom: existingClient.nom || '',
                prenom: existingClient.prenom || '',
                telephone: existingClient.telephone || '',
                email: existingClient.email || '',
                city: existingClient.city || ''
            }));
        } else {
            setFoundClient(null);
            // Clear client data if not found
            setReservationData(prev => ({
                ...prev,
                nom: '',
                prenom: '',
                telephone: clientSearch.phone,
                email: clientSearch.email,
                city: ''
            }));
        }
        
        setSearchingClient(false);
    };

    // Handle Rent Now button click
    const handleRentNow = (car) => {
        const carAvailability = getCarAvailability(car);
        
        if (carAvailability !== 'disponible') {
            showAlertPrompt('error', 'Cette voiture n\'est pas disponible pour le moment');
            return;
        }

        // Additional check for active matricules
        if (!hasActiveMatricules(car.id)) {
            showAlertPrompt('error', 'Cette voiture n\'a pas de matricule actif disponible');
            return;
        }

        setSelectedCar(car);
        setReservationData({
            nom: '',
            prenom: '',
            telephone: '',
            email: '',
            city: '',
            start_date: '',
            end_date: '',
            start_time: '08:00',
            end_time: '18:00',
            total_days: 0,
            total_price: 0,
        });
        setClientSearch({ phone: '', email: '' });
        setFoundClient(null);
        setShowReservationForm(true);
    };

    // Handle reservation form input changes
    const handleReservationInputChange = (e) => {
        const { name, value } = e.target;
        setReservationData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle client search input changes
    const handleClientSearchChange = (e) => {
        const { name, value } = e.target;
        setClientSearch(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Calculate total days and price when dates change
    useEffect(() => {
        if (reservationData.start_date && reservationData.end_date && selectedCar) {
            const start = new Date(reservationData.start_date);
            const end = new Date(reservationData.end_date);
            const timeDiff = end.getTime() - start.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            if (daysDiff > 0) {
                const totalPrice = daysDiff * selectedCar.price_per_day;
                setReservationData(prev => ({
                    ...prev,
                    total_days: daysDiff,
                    total_price: totalPrice
                }));
            } else {
                setReservationData(prev => ({
                    ...prev,
                    total_days: 0,
                    total_price: 0
                }));
            }
        }
    }, [reservationData.start_date, reservationData.end_date, selectedCar]);

    // Handle reservation form submit
    const handleReservationSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        // Validate form
        if (!reservationData.start_date || !reservationData.end_date) {
            showAlertPrompt('error', 'Veuillez sélectionner les dates de début et de fin');
            setSubmitting(false);
            return;
        }

        if (reservationData.total_days <= 0) {
            showAlertPrompt('error', 'La date de fin doit être après la date de début');
            setSubmitting(false);
            return;
        }

        // ✅ Check car availability from status field
        const carAvailability = getCarAvailability(selectedCar);
        if (carAvailability !== 'disponible') {
            showAlertPrompt('error', 'Cette voiture n\'est plus disponible. Veuillez en choisir une autre.');
            setSubmitting(false);
            return;
        }

        // ✅ Check for active matricules
        if (!hasActiveMatricules(selectedCar.id)) {
            showAlertPrompt('error', 'Cette voiture n\'a pas de matricule actif disponible');
            setSubmitting(false);
            return;
        }

        try {
            let clientId;

            // If client was found in search, use existing client ID
            if (foundClient) {
                clientId = foundClient.id;
                console.log('Using existing client ID:', clientId);
            } else {
                // Validate required client fields
                if (!reservationData.nom || !reservationData.prenom || !reservationData.telephone || !reservationData.email || !reservationData.city) {
                    showAlertPrompt('error', 'Veuillez remplir tous les champs d\'information client');
                    setSubmitting(false);
                    return;
                }

                // Check if client already exists (in case they weren't found in initial search)
                const existingClient = clients.find(client => 
                    client.telephone === reservationData.telephone || 
                    client.email === reservationData.email
                );

                if (existingClient) {
                    // Use existing client
                    clientId = existingClient.id;
                    console.log('Found existing client during submission:', clientId);
                } else {
                    // Create new client with proper image fields
                    const clientData = {
                        nom: reservationData.nom,
                        prenom: reservationData.prenom,
                        telephone: reservationData.telephone,
                        email: reservationData.email,
                        city: reservationData.city,
                        cin_number: '',
                        driver_license_number: '',
                        cin_image: '',
                        driver_license_image: ''
                    };

                    console.log('Creating new client with data:', clientData);
                    
                    // Create client using Redux action
                    const clientResult = await dispatch(createClient(clientData)).unwrap();
                    console.log('Client created:', clientResult);

                    // Extract client ID from the response
                    clientId = clientResult.client?.id || clientResult.id;
                    
                    if (!clientId) {
                        throw new Error('Failed to get client ID from response');
                    }
                }
            }

            // ✅ Get available matricules for the car
            const availableMatricules = getAvailableMatricules(selectedCar.id);
            if (availableMatricules.length === 0) {
                throw new Error('Aucun matricule disponible pour cette voiture');
            }

            // Use the first available matricule
            const selectedMatriculeId = availableMatricules[0].id;

            // Then create the reservation with time fields
            const reservationPayload = {
                start_date: reservationData.start_date,
                end_date: reservationData.end_date,
                start_time: reservationData.start_time,
                end_time: reservationData.end_time,
                total_days: reservationData.total_days,
                total_price: reservationData.total_price,
                amount_paid: 0,
                remaining_amount: reservationData.total_price,
                car_id: selectedCar.id,
                client_id: clientId,
                matricule_id: selectedMatriculeId,
                status: 'pending' // Auto-confirm the reservation
            };

            console.log('Creating reservation with data:', reservationPayload);
            
            // Create reservation using Redux action
            const reservationResult = await dispatch(createReservation(reservationPayload)).unwrap();
            console.log('Reservation created:', reservationResult);

            showAlertPrompt('success', 'Réservation confirmée avec succès !');
            setShowReservationForm(false);
            
            // Refresh data to update availability
            setTimeout(() => {
                dispatch(fetchCars(true));
                dispatch(fetchMatricules(true));
            }, 1000);
            
        } catch (error) {
            console.error('Error creating reservation:', error);
            showAlertPrompt('error', `Erreur lors de la création de la réservation: ${error.message || error}`);
        } finally {
            setSubmitting(false);
        }
    };

    // Safe function to capitalize first letter
    const capitalizeFirst = (str) => {
        if (!str || typeof str !== 'string') return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Safe function to get fuel type display
    const getFuelTypeDisplay = (fuelType) => {
        if (!fuelType) return 'Essence';
        const fuelMap = {
            'petrol': 'Essence',
            'diesel': 'Diesel',
            'electric': 'Électrique',
            'hybrid': 'Hybride',
            'gasoline': 'Essence'
        };
        return fuelMap[fuelType] || capitalizeFirst(fuelType);
    };

    // Safe function to get transmission display
    const getTransmissionDisplay = (transmission) => {
        if (!transmission) return 'Auto';
        const transmissionMap = {
            'automatic': 'Auto',
            'manual': 'Manuelle'
        };
        return transmissionMap[transmission] || capitalizeFirst(transmission);
    };

    // Safe function to get default values
    const getSafeValue = (value, defaultValue) => {
        return value !== undefined && value !== null ? value : defaultValue;
    };

    // Handle page change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;
        
        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
            const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
            
            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
            }
        }
        
        return pageNumbers;
    };

    // Check if any filter is active
    const isAnyFilterActive = filters.brand || filters.fuel_type || filters.price_range;

    // Get today's date for date input min attribute
    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    // Get min end date based on start date
    const getMinEndDate = () => {
        return reservationData.start_date || getTodayDate();
    };

    return (
        <div>
            <style>
                {`
                    /* Global Styles */
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }

                    .cars-page {
                        min-height: 100vh;
                        background: white;
                        padding-top: 80px;
                        position: relative;
                    }

                    /* Header Section */
                    .page-header {
                        background: white;
                        color: black;
                        padding: 3rem 2rem;
                        text-align: center;
                        border-bottom: 2px solid #dc2626;
                    }

                    .header-content {
                        max-width: 800px;
                        margin: 0 auto;
                    }

                    .page-title {
                        font-size: 3rem;
                        font-weight: 800;
                        margin-bottom: 1rem;
                        font-family: 'Inter', sans-serif;
                        color: black;
                    }

                    @media (max-width: 768px) {
                        .page-title {
                            font-size: 2.2rem;
                        }
                    }

                    .page-subtitle {
                        font-size: 1.2rem;
                        color: black;
                        font-weight: 300;
                        line-height: 1.6;
                        max-width: 600px;
                        margin: 0 auto;
                        opacity: 0.8;
                    }

                    /* Filters Section */
                    .filters-section {
                        padding: 2rem;
                        background: white;
                        border-bottom: 1px solid #e5e7eb;
                    }

                    .filters-container {
                        max-width: 1200px;
                        margin: 0 auto;
                        display: flex;
                        gap: 1rem;
                        align-items: center;
                        justify-content: space-between;
                        flex-wrap: wrap;
                    }

                    @media (max-width: 768px) {
                        .filters-container {
                            flex-direction: column;
                            gap: 1rem;
                        }
                    }

                    .results-count {
                        font-size: 1.1rem;
                        color: black;
                        font-weight: 600;
                    }

                    .filters-group {
                        display: flex;
                        gap: 1rem;
                        align-items: center;
                        flex-wrap: wrap;
                    }

                    .filter-select {
                        padding: 0.5rem 1rem;
                        border: 1px solid black;
                        border-radius: 8px;
                        background: white;
                        color: black;
                        font-size: 0.9rem;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        min-width: 140px;
                    }

                    .filter-select:hover {
                        border-color: #dc2626;
                    }

                    .filter-select:focus {
                        outline: none;
                        border-color: #dc2626;
                    }

                    .clear-filters-button {
                        padding: 0.5rem 1rem;
                        border: 1px solid #dc2626;
                        background: white;
                        color: #dc2626;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        font-size: 0.9rem;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }

                    .clear-filters-button:hover {
                        background: #dc2626;
                        color: white;
                    }

                    /* Cars Grid Section */
                    .cars-grid-section {
                        padding: 3rem 2rem;
                        max-width: 1400px;
                        margin: 0 auto;
                    }

                    .cars-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 1.5rem;
                        margin-bottom: 3rem;
                    }

                    @media (max-width: 1200px) {
                        .cars-grid {
                            grid-template-columns: repeat(3, 1fr);
                            gap: 1.5rem;
                        }
                    }

                    @media (max-width: 768px) {
                        .cars-grid {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 1.5rem;
                            padding: 0 1rem;
                        }
                    }

                    @media (max-width: 480px) {
                        .cars-grid {
                            grid-template-columns: 1fr;
                            gap: 1.5rem;
                            padding: 0 0.5rem;
                        }
                    }

                    .car-card {
                        background: white;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        transition: all 0.3s ease;
                        position: relative;
                        border: 1px solid #e5e7eb;
                    }

                    .car-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        border-color: #dc2626;
                    }

                    .car-image {
                        width: 100%;
                        height: 380px;
                        background: #f8fafc;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        position: relative;
                        overflow: hidden;
                        border-bottom: 1px solid #e5e7eb;
                    }

                    .car-image img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }

                    .car-image-placeholder {
                        font-size: 2.5rem;
                        color: #9ca3af;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .car-image-placeholder.hidden {
                        display: none;
                    }

                    .car-status {
                        position: absolute;
                        top: 0.8rem;
                        right: 0.8rem;
                        padding: 0.3rem 0.8rem;
                        border-radius: 15px;
                        font-size: 0.7rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    .status-available {
                        background: #10b981;
                        color: white;
                    }

                    .status-unavailable {
                        background: #ef4444;
                        color: white;
                    }

                    .car-content {
                        padding: 1.2rem;
                    }

                    .car-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 0.8rem;
                    }

                    .car-title {
                        font-size: 1.1rem;
                        font-weight: 700;
                        color: black;
                        line-height: 1.3;
                    }

                    .car-year {
                        color: black;
                        font-size: 0.8rem;
                        font-weight: 500;
                        margin-top: 0.2rem;
                        opacity: 0.7;
                    }

                    .car-price {
                        font-size: 1.3rem;
                        font-weight: 800;
                        color: #dc2626;
                        text-align: right;
                    }

                    .car-price-period {
                        font-size: 0.7rem;
                        color: black;
                        font-weight: 500;
                        opacity: 0.7;
                    }

                    .car-specs {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 0.5rem;
                        margin-bottom: 1rem;
                        padding: 0.8rem;
                        background: #f8fafc;
                        border-radius: 6px;
                        border: 1px solid #e5e7eb;
                    }

                    .car-spec {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        font-size: 0.75rem;
                        color: black;
                    }

                    .car-spec-icon {
                        color: #dc2626;
                        font-size: 0.8rem;
                        min-width: 16px;
                    }

                    .car-spec-text {
                        font-weight: 500;
                    }

                    .car-buttons {
                        display: flex;
                        gap: 0.5rem;
                        margin-top: 1rem;
                    }

                    .car-button {
                        flex: 2;
                        padding: 0.7rem 1.2rem;
                        background: #dc2626;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                        text-decoration: none;
                        text-align: center;
                        font-size: 0.85rem;
                    }

                    .car-button:hover {
                        background: #b91c1c;
                        transform: translateY(-1px);
                    }

                    .car-button:disabled {
                        background: #9ca3af;
                        cursor: not-allowed;
                        transform: none;
                    }

                    .whatsapp-card-button {
                        flex: 1;
                        padding: 0.7rem;
                        background: #25D366;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-width: 50px;
                    }

                    .whatsapp-card-button:hover {
                        background: #128C7E;
                        transform: translateY(-1px);
                    }

                    /* Pagination Section */
                    .pagination-section {
                        padding: 2rem;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }

                    .pagination-container {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }

                    .pagination-button {
                        padding: 0.5rem 1rem;
                        border: 1px solid black;
                        background: white;
                        color: black;
                        border-radius: 6px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        font-weight: 500;
                    }

                    .pagination-button:hover:not(:disabled) {
                        border-color: #dc2626;
                        color: #dc2626;
                    }

                    .pagination-button:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }

                    .page-numbers {
                        display: flex;
                        gap: 0.25rem;
                    }

                    .page-number {
                        padding: 0.5rem 0.75rem;
                        border: 1px solid black;
                        background: white;
                        color: black;
                        border-radius: 4px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        font-weight: 500;
                        min-width: 40px;
                        text-align: center;
                    }

                    .page-number:hover {
                        border-color: #dc2626;
                        color: #dc2626;
                    }

                    .page-number.active {
                        background: #dc2626;
                        border-color: #dc2626;
                        color: white;
                    }

                    .page-ellipsis {
                        padding: 0.5rem 0.25rem;
                        color: black;
                        opacity: 0.7;
                    }

                    /* Loading States */
                    .loading-section {
                        padding: 3rem 2rem;
                        text-align: center;
                    }

                    .loading-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 1.5rem;
                        margin-bottom: 3rem;
                    }

                    @media (max-width: 1200px) {
                        .loading-grid {
                            grid-template-columns: repeat(3, 1fr);
                            gap: 1.5rem;
                            padding: 0 1rem;
                        }
                    }

                    @media (max-width: 768px) {
                        .loading-grid {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 1.5rem;
                        }
                    }

                    @media (max-width: 480px) {
                        .loading-grid {
                            grid-template-columns: 1fr;
                            gap: 1.5rem;
                        }
                    }

                    .car-skeleton {
                        background: white;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        animation: pulse 2s infinite;
                        border: 1px solid #e5e7eb;
                    }

                    .skeleton-image {
                        width: 100%;
                        height: 180px;
                        background: #f8fafc;
                    }

                    .skeleton-content {
                        padding: 1.2rem;
                    }

                    .skeleton-line {
                        height: 0.8rem;
                        background: #f8fafc;
                        border-radius: 4px;
                        margin-bottom: 0.8rem;
                    }

                    .skeleton-line.short {
                        width: 60%;
                    }

                    .skeleton-line.medium {
                        width: 80%;
                    }

                    @keyframes pulse {
                        0% {
                            opacity: 1;
                        }
                        50% {
                            opacity: 0.7;
                        }
                        100% {
                            opacity: 1;
                        }
                    }

                    /* Error States */
                    .error-section {
                        padding: 3rem 2rem;
                        text-align: center;
                    }

                    .error-message {
                        color: #dc2626;
                        font-size: 1.1rem;
                        margin-bottom: 1.5rem;
                    }

                    .retry-button {
                        padding: 0.7rem 1.5rem;
                        background: #dc2626;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: background 0.3s ease;
                        font-size: 0.9rem;
                    }

                    .retry-button:hover {
                        background: #b91c1c;
                    }

                    /* No Results */
                    .no-results {
                        text-align: center;
                        padding: 4rem 2rem;
                        color: black;
                    }

                    .no-results-icon {
                        font-size: 4rem;
                        color: #9ca3af;
                        margin-bottom: 1rem;
                    }

                    .no-results-title {
                        font-size: 1.5rem;
                        margin-bottom: 0.5rem;
                        color: black;
                    }

                    /* Reservation Form Overlay */
                    .reservation-overlay {
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
                    }

                    .reservation-form-container {
                        background: white;
                        border-radius: 12px;
                        padding: 2rem;
                        max-width: 800px;
                        width: 100%;
                        max-height: 90vh;
                        overflow-y: auto;
                        position: relative;
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
                    }

                    .close-button:hover {
                        color: #dc2626;
                    }

                    .reservation-form {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 1.5rem;
                    }

                    @media (max-width: 768px) {
                        .reservation-form {
                            grid-template-columns: 1fr;
                            }
                    }

                    .form-section {
                        grid-column: 1 / -1;
                    }

                    .section-title {
                        font-size: 1.3rem;
                        font-weight: 700;
                        color: #1f2937;
                        margin-bottom: 1rem;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }

                    .form-group {
                        margin-bottom: 1rem;
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

                    .form-input {
                        width: 100%;
                        padding: 0.75rem 1rem;
                        border: 2px solid #e5e7eb;
                        border-radius: 8px;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                        background: white;
                    }

                    .form-input:focus {
                        outline: none;
                        border-color: #dc2626;
                        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
                    }

                    .form-input:disabled {
                        background: #f9fafb;
                        color: #6b7280;
                        cursor: not-allowed;
                    }

                    .date-inputs {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 1rem;
                        margin-bottom: 1.5rem;
                    }

                    .time-inputs {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 1rem;
                        margin-bottom: 1.5rem;
                    }

                    @media (max-width: 480px) {
                        .date-inputs,
                        .time-inputs {
                            grid-template-columns: 1fr;
                        }
                    }

                    .calculation-section {
                        background: #f8fafc;
                        padding: 1.5rem;
                        border-radius: 8px;
                        margin: 1.5rem 0;
                        border: 1px solid #e5e7eb;
                    }

                    .calculation-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0.5rem 0;
                        border-bottom: 1px solid #e5e7eb;
                    }

                    .calculation-row:last-child {
                        border-bottom: none;
                        font-weight: 700;
                        font-size: 1.1rem;
                        color: #dc2626;
                    }

                    .calculation-label {
                        color: #6b7280;
                    }

                    .calculation-value {
                        font-weight: 600;
                        color: #1f2937;
                    }

                    .car-summary {
                        background: #f8fafc;
                        padding: 1.5rem;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                    }

                    .car-summary-title {
                        font-size: 1.2rem;
                        font-weight: 700;
                        color: #1f2937;
                        margin-bottom: 1rem;
                    }

                    .car-summary-details {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 0.5rem;
                        margin-bottom: 1rem;
                    }

                    .submit-button {
                        width: 100%;
                        padding: 1rem 2rem;
                        background: #dc2626;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 1.1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        margin-top: 1rem;
                        grid-column: 1 / -1;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                    }

                    .submit-button:hover:not(:disabled) {
                        background: #b91c1c;
                        transform: translateY(-2px);
                    }

                    .submit-button:disabled {
                        background: #9ca3af;
                        cursor: not-allowed;
                        transform: none;
                    }

                    .submitting-spinner {
                        animation: spin 1s linear infinite;
                    }

                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }

                    /* Client Search Section */
                    .client-search-section {
                        background: #f0f9ff;
                        padding: 1.5rem;
                        border-radius: 8px;
                        border: 1px solid #bae6fd;
                        margin-bottom: 1.5rem;
                    }

                    .search-title {
                        font-size: 1.1rem;
                        font-weight: 600;
                        color: #0369a1;
                        margin-bottom: 1rem;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }

                    .search-inputs {
                        display: grid;
                        grid-template-columns: 1fr 1fr auto;
                        gap: 1rem;
                        align-items: end;
                    }

                    @media (max-width: 768px) {
                        .search-inputs {
                            grid-template-columns: 1fr;
                            gap: 1rem;
                            align-items: stretch;
                            }
                    }

                    .search-button {
                        padding: 0.75rem 1.5rem;
                        background: #0369a1;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        white-space: nowrap;
                    }

                    .search-button:hover:not(:disabled) {
                        background: #0284c7;
                    }

                    .search-button:disabled {
                        background: #9ca3af;
                        cursor: not-allowed;
                    }

                    .client-found-message {
                        background: #d1fae5;
                        color: #065f46;
                        padding: 1rem;
                        border-radius: 6px;
                        border: 1px solid #a7f3d0;
                        margin-top: 1rem;
                        font-weight: 500;
                    }

                    .client-not-found-message {
                        background: #fef3c7;
                        color: #92400e;
                        padding: 1rem;
                        border-radius: 6px;
                        border: 1px solid #fcd34d;
                        margin-top: 1rem;
                        font-weight: 500;
                    }

                    /* Alert Prompt Styles */
                    .alert-prompt-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.6);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 2000;
                        padding: 20px;
                    }

                    .alert-prompt {
                        background: white;
                        border-radius: 16px;
                        padding: 2.5rem;
                        max-width: 500px;
                        width: 100%;
                        text-align: center;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                        animation: slideInUp 0.4s ease-out;
                        position: relative;
                        overflow: hidden;
                    }

                    .alert-prompt::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 4px;
                        background: linear-gradient(90deg, #dc2626, #b91c1c);
                    }

                    .alert-prompt.success::before {
                        background: linear-gradient(90deg, #10b981, #059669);
                    }

                    .alert-prompt.error::before {
                        background: linear-gradient(90deg, #dc2626, #b91c1c);
                    }

                    .alert-icon {
                        font-size: 4rem;
                        margin-bottom: 1.5rem;
                        animation: scaleIn 0.5s ease-out;
                    }

                    .alert-icon.success {
                        color: #10b981;
                    }

                    .alert-icon.error {
                        color: #dc2626;
                    }

                    .alert-title {
                        font-size: 1.8rem;
                        font-weight: 700;
                        margin-bottom: 1rem;
                        color: #1f2937;
                    }

                    .alert-message {
                        font-size: 1.1rem;
                        color: #6b7280;
                        margin-bottom: 2rem;
                        line-height: 1.6;
                    }

                    .alert-actions {
                        display: flex;
                        gap: 1rem;
                        justify-content: center;
                    }

                    .alert-button {
                        padding: 0.75rem 2rem;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        font-size: 1rem;
                        min-width: 120px;
                    }

                    .alert-button.primary {
                        background: #dc2626;
                        color: white;
                    }

                    .alert-button.primary:hover {
                        background: #b91c1c;
                        transform: translateY(-2px);
                    }

                    .alert-button.success {
                        background: #10b981;
                        color: white;
                    }

                    .alert-button.success:hover {
                        background: #059669;
                        transform: translateY(-2px);
                    }

                    .alert-button.secondary {
                        background: #f3f4f6;
                        color: #374151;
                        border: 1px solid #d1d5db;
                    }

                    .alert-button.secondary:hover {
                        background: #e5e7eb;
                        transform: translateY(-2px);
                    }

                    .progress-bar {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        height: 4px;
                        background: #10b981;
                        animation: progressBar 5s linear forwards;
                    }

                    .alert-prompt.error .progress-bar {
                        background: #dc2626;
                    }

                    @keyframes slideInUp {
                        from {
                            opacity: 0;
                            transform: translateY(30px) scale(0.95);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }

                    @keyframes scaleIn {
                        from {
                            opacity: 0;
                            transform: scale(0.5);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }

                    @keyframes progressBar {
                        from {
                            width: 100%;
                        }
                        to {
                            width: 0%;
                        }
                    }

                    /* Toast Notification Styles */
                    .toast-notification {
                        position: fixed;
                        top: 100px;
                        right: 30px;
                        background: white;
                        border-radius: 12px;
                        padding: 1.5rem;
                        max-width: 400px;
                        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                        border-left: 4px solid #dc2626;
                        z-index: 2000;
                        animation: slideInRight 0.4s ease-out;
                        display: flex;
                        align-items: flex-start;
                        gap: 1rem;
                    }

                    .toast-notification.success {
                        border-left-color: #10b981;
                    }

                    .toast-notification.error {
                        border-left-color: #dc2626;
                    }

                    .toast-icon {
                        font-size: 1.5rem;
                        flex-shrink: 0;
                    }

                    .toast-icon.success {
                        color: #10b981;
                    }

                    .toast-icon.error {
                        color: #dc2626;
                    }

                    .toast-content {
                        flex: 1;
                        text-align: left;
                        }

                    .toast-title {
                        font-weight: 700;
                        color: #1f2937;
                        margin-bottom: 0.5rem;
                        font-size: 1.1rem;
                    }

                    .toast-message {
                        color: #6b7280;
                        line-height: 1.5;
                        font-size: 0.95rem;
                    }

                    .toast-close {
                        background: none;
                        border: none;
                        font-size: 1.2rem;
                        color: #9ca3af;
                        cursor: pointer;
                        transition: color 0.3s ease;
                        flex-shrink: 0;
                        padding: 0;
                        width: 24px;
                        height: 24px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .toast-close:hover {
                        color: #dc2626;
                    }

                    .toast-progress {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        height: 3px;
                        background: #10b981;
                        animation: toastProgress 5s linear forwards;
                        border-radius: 0 0 0 8px;
                    }

                    .toast-notification.error .toast-progress {
                        background: #dc2626;
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

                    @keyframes toastProgress {
                        from {
                            width: 100%;
                        }
                        to {
                            width: 0%;
                        }
                    }

                    @media (max-width: 768px) {
                        .toast-notification {
                            top: 80px;
                            right: 20px;
                            left: 20px;
                            max-width: none;
                        }

                        .alert-prompt {
                            padding: 2rem 1.5rem;
                        }

                        .alert-title {
                            font-size: 1.5rem;
                        }

                        .alert-message {
                            font-size: 1rem;
                        }
                    }

                    /* Responsive Design */
                    @media (max-width: 480px) {
                        .page-header {
                            padding: 2rem 1rem;
                        }
                        
                        .cars-grid-section {
                            padding: 2rem 1rem;
                        }
                        
                        .filters-section {
                            padding: 1.5rem 1rem;
                        }
                        
                        .pagination-section {
                            padding: 1.5rem 1rem;
                        }

                        .filters-group {
                            justify-content: center;
                        }

                        .filter-select {
                            min-width: 120px;
                        }

                        .reservation-form-container {
                            padding: 1.5rem;
                            margin: 10px;
                        }

                        .search-inputs {
                            grid-template-columns: 1fr;
                        }

                        .toast-notification {
                            top: 70px;
                            right: 10px;
                            left: 10px;
                        }
                    }
                `}
            </style>

            <div className="cars-page">
                {/* Header Section */}
                <section className="page-header">
                    <div className="header-content">
                        <h1 className="page-title">Notre Flotte de Voitures</h1>
                        <p className="page-subtitle">
                            Découvrez notre collection premium de véhicules. De l'économique au luxe, 
                            trouvez la voiture parfaite pour votre voyage.
                        </p>
                    </div>
                </section>

                {/* Filters Section */}
                <section className="filters-section">
                    <div className="filters-container">
                        <div className="results-count">
                            Affichage de {currentCars.length} voitures sur {filteredCars.length}
                            {cars.length !== filteredCars.length && ` (filtré sur ${cars.length} au total)`}
                            {currentPage > 1 && ` - Page ${currentPage} sur ${totalPages}`}
                        </div>
                        <div className="filters-group">
                            {/* Brand Filter */}
                            <select 
                                className="filter-select"
                                value={filters.brand}
                                onChange={(e) => handleFilterChange('brand', e.target.value)}
                            >
                                <option value="">Toutes les marques</option>
                                {uniqueBrands.map(brand => (
                                    <option key={brand} value={brand}>
                                        {capitalizeFirst(brand)}
                                    </option>
                                ))}
                            </select>

                            {/* Fuel Type Filter */}
                            <select 
                                className="filter-select"
                                value={filters.fuel_type}
                                onChange={(e) => handleFilterChange('fuel_type', e.target.value)}
                            >
                                <option value="">Tous les carburants</option>
                                {uniqueFuelTypes.map(fuelType => (
                                    <option key={fuelType} value={fuelType}>
                                        {getFuelTypeDisplay(fuelType)}
                                    </option>
                                ))}
                            </select>

                            {/* Price Range Filter */}
                            <select 
                                className="filter-select"
                                value={filters.price_range}
                                onChange={(e) => handleFilterChange('price_range', e.target.value)}
                            >
                                <option value="">Tous les prix</option>
                                <option value="0-50">0 MAD - 50 MAD</option>
                                <option value="50-100">50 MAD - 100 MAD</option>
                                <option value="100-200">100 MAD - 200 MAD</option>
                                <option value="200+">200+ MAD</option>
                            </select>

                            {/* Clear Filters Button */}
                            {isAnyFilterActive && (
                                <button 
                                    className="clear-filters-button"
                                    onClick={clearFilters}
                                >
                                    <FaFilter />
                                    Effacer les filtres
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* Cars Grid Section */}
                <section className="cars-grid-section">
                    {loading && (
                        <div className="loading-grid">
                            {[...Array(16)].map((_, index) => (
                                <div key={index} className="car-skeleton">
                                    <div className="skeleton-image"></div>
                                    <div className="skeleton-content">
                                        <div className="skeleton-line short"></div>
                                        <div className="skeleton-line medium"></div>
                                        <div className="skeleton-line" style={{width: '40%'}}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="error-section">
                            <div className="error-message">
                                Erreur lors du chargement des voitures: {error}
                            </div>
                            <button 
                                className="retry-button"
                                onClick={() => dispatch(fetchCars())}
                            >
                                Réessayer
                            </button>
                        </div>
                    )}

                    {!loading && !error && currentCars.length === 0 && (
                        <div className="no-results">
                            <div className="no-results-icon">
                                <FaCar />
                            </div>
                            <h3 className="no-results-title">
                                {filteredCars.length === 0 && cars.length > 0 
                                    ? "Aucune voiture ne correspond à vos filtres" 
                                    : "Aucune voiture trouvée"
                                }
                            </h3>
                            <p>
                                {filteredCars.length === 0 && cars.length > 0 
                                    ? "Essayez d'ajuster vos filtres pour voir plus de résultats." 
                                    : "Aucune voiture disponible correspondant à vos critères."
                                }
                            </p>
                            {isAnyFilterActive && (
                                <button 
                                    className="clear-filters-button"
                                    onClick={clearFilters}
                                    style={{ marginTop: '1rem' }}
                                >
                                    <FaFilter />
                                    Effacer tous les filtres
                                </button>
                            )}
                        </div>
                    )}

                    {!loading && !error && currentCars.length > 0 && (
                        <>
                            <div className="cars-grid">
                                {currentCars.map((car) => {
                                    const carAvailability = getCarAvailability(car);
                                    const isAvailable = carAvailability === 'disponible';
                                    
                                    return (
                                        <div key={car.id} className="car-card">
                                            <div 
                                                className="car-image"
                                                onClick={() => navigate(`/details/${car.id}`)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {getCarImageUrl(car) ? (
                                                    <img 
                                                        src={getCarImageUrl(car)} 
                                                        alt={`${car.brand} ${car.model}`}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextElementSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div 
                                                    className={`car-image-placeholder ${getCarImageUrl(car) ? 'hidden' : ''}`}
                                                >
                                                    <FaCar />
                                                </div>
                                                <div className={`car-status ${
                                                    isAvailable ? 'status-available' : 'status-unavailable'
                                                }`}>
                                                    {isAvailable ? 'Disponible' : 'Indisponible'}
                                                </div>
                                            </div>
                                            
                                            <div className="car-content">
                                                <div className="car-header">
                                                    <div>
                                                        <h3 className="car-title">
                                                            {getSafeValue(car.brand, 'Voiture')} {getSafeValue(car.model, 'Modèle')}
                                                        </h3>
                                                        <div className="car-year">
                                                            {getSafeValue(car.year, '2023')} • {capitalizeFirst(getSafeValue(car.color, 'N/A'))}
                                                        </div>
                                                    </div>
                                                    <div className="car-price">
                                                        {getSafeValue(car.price_per_day, '0')} MAD
                                                        <div className="car-price-period">/jour</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="car-specs">
                                                    <div className="car-spec">
                                                        <FaUsers className="car-spec-icon" />
                                                        <span className="car-spec-text">{getSafeValue(car.seats, 5)} Places</span>
                                                    </div>
                                                    <div className="car-spec">
                                                        <FaDoorOpen className="car-spec-icon" />
                                                        <span className="car-spec-text">{getSafeValue(car.doors, 4)} Portes</span>
                                                    </div>
                                                    <div className="car-spec">
                                                        <FaGasPump className="car-spec-icon" />
                                                        <span className="car-spec-text">{getFuelTypeDisplay(getSafeValue(car.fuel_type, 'petrol'))}</span>
                                                    </div>
                                                    <div className="car-spec">
                                                        <FaCog className="car-spec-icon" />
                                                        <span className="car-spec-text">{getTransmissionDisplay(getSafeValue(car.transmission, 'automatic'))}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="car-buttons">
                                                    <button 
                                                        className="car-button"
                                                        onClick={() => handleRentNow(car)}
                                                        disabled={!isAvailable}
                                                    >
                                                        <FaCar />
                                                        {isAvailable ? 'Louer' : 'Indisponible'}
                                                    </button>
                                                    <button 
                                                        className="whatsapp-card-button"
                                                        onClick={() => handleWhatsAppClick(car)}
                                                        title="Contactez-nous sur WhatsApp"
                                                    >
                                                        <FaWhatsapp />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination Section */}
                            {totalPages > 1 && (
                                <section className="pagination-section">
                                    <div className="pagination-container">
                                        <button
                                            className="pagination-button"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            <FaChevronLeft />
                                            Précédent
                                        </button>

                                        <div className="page-numbers">
                                            {getPageNumbers().map((pageNumber, index) => (
                                                <React.Fragment key={pageNumber}>
                                                    {index > 0 && pageNumber !== getPageNumbers()[index - 1] + 1 && (
                                                        <span className="page-ellipsis">...</span>
                                                    )}
                                                    <button
                                                        className={`page-number ${pageNumber === currentPage ? 'active' : ''}`}
                                                        onClick={() => handlePageChange(pageNumber)}
                                                    >
                                                        {pageNumber}
                                                    </button>
                                                </React.Fragment>
                                            ))}
                                        </div>

                                        <button
                                            className="pagination-button"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                        >
                                            Suivant
                                            <FaChevronRight />
                                        </button>
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </section>

                {/* Reservation Form Overlay */}
                {showReservationForm && selectedCar && (
                    <div className="reservation-overlay">
                        <div className="reservation-form-container">
                            <button 
                                className="close-button"
                                onClick={() => setShowReservationForm(false)}
                                disabled={submitting}
                            >
                                <FaTimes />
                            </button>
                            
                            <h2 style={{ marginBottom: '2rem', color: '#1f2937', fontSize: '1.5rem' }}>
                                Réserver {selectedCar.brand} {selectedCar.model}
                            </h2>
                            
                            <form onSubmit={handleReservationSubmit} className="reservation-form">
                                {/* Client Information Section */}
                                <div className="form-section">
                                    <h3 className="section-title">
                                        <FaUser />
                                        Informations Client
                                        {foundClient && <span style={{ color: '#10b981', fontSize: '0.9rem', marginLeft: '1rem' }}>(Pré-rempli depuis client existant)</span>}
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label className="form-label required-field">Nom</label>
                                            <input
                                                type="text"
                                                name="nom"
                                                value={reservationData.nom}
                                                onChange={handleReservationInputChange}
                                                className="form-input"
                                                placeholder="Entrez votre nom de famille"
                                                required
                                                disabled={submitting || foundClient}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label required-field">Prénom</label>
                                            <input
                                                type="text"
                                                name="prenom"
                                                value={reservationData.prenom}
                                                onChange={handleReservationInputChange}
                                                className="form-input"
                                                placeholder="Entrez votre prénom"
                                                required
                                                disabled={submitting || foundClient}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label required-field">Téléphone</label>
                                            <input
                                                type="tel"
                                                name="telephone"
                                                value={reservationData.telephone}
                                                onChange={handleReservationInputChange}
                                                className="form-input"
                                                placeholder="Entrez votre numéro de téléphone"
                                                required
                                                disabled={submitting || foundClient}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label required-field">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={reservationData.email}
                                                onChange={handleReservationInputChange}
                                                className="form-input"
                                                placeholder="Entrez votre email"
                                                required
                                                disabled={submitting || foundClient}
                                            />
                                        </div>

                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label required-field">Ville</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={reservationData.city}
                                                onChange={handleReservationInputChange}
                                                className="form-input"
                                                placeholder="Entrez votre ville"
                                                required
                                                disabled={submitting || foundClient}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Reservation Dates Section */}
                                <div className="form-section">
                                    <h3 className="section-title">
                                        <FaCalendarAlt />
                                        Dates de Réservation
                                    </h3>
                                    <div className="date-inputs">
                                        <div className="form-group">
                                            <label className="form-label required-field">Date de Début</label>
                                            <input
                                                type="date"
                                                name="start_date"
                                                value={reservationData.start_date}
                                                onChange={handleReservationInputChange}
                                                className="form-input"
                                                min={getTodayDate()}
                                                required
                                                disabled={submitting}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label required-field">Date de Fin</label>
                                            <input
                                                type="date"
                                                name="end_date"
                                                value={reservationData.end_date}
                                                onChange={handleReservationInputChange}
                                                className="form-input"
                                                min={getMinEndDate()}
                                                required
                                                disabled={submitting}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Time Inputs Section */}
                                <div className="form-section">
                                    <h3 className="section-title">
                                        <FaClock />
                                        Heures de Location
                                    </h3>
                                    <div className="time-inputs">
                                        <div className="form-group">
                                            <label className="form-label required-field">Heure de Début</label>
                                            <input
                                                type="time"
                                                name="start_time"
                                                value={reservationData.start_time}
                                                onChange={handleReservationInputChange}
                                                className="form-input"
                                                required
                                                disabled={submitting}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label required-field">Heure de Fin</label>
                                            <input
                                                type="time"
                                                name="end_time"
                                                value={reservationData.end_time}
                                                onChange={handleReservationInputChange}
                                                className="form-input"
                                                required
                                                disabled={submitting}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Car Information Section */}
                                <div className="form-section">
                                    <h3 className="section-title">
                                        <FaCar />
                                        Informations Véhicule
                                    </h3>
                                    <div className="car-summary">
                                        <h4 className="car-summary-title">{selectedCar.brand} {selectedCar.model}</h4>
                                        <div className="car-summary-details">
                                            <div>
                                                <strong>Marque:</strong> 
                                                <input
                                                    type="text"
                                                    value={selectedCar.brand}
                                                    className="form-input"
                                                    disabled
                                                    style={{ marginTop: '0.5rem' }}
                                                />
                                            </div>
                                            <div>
                                                <strong>Modèle:</strong>
                                                <input
                                                    type="text"
                                                    value={selectedCar.model}
                                                    className="form-input"
                                                    disabled
                                                    style={{ marginTop: '0.5rem' }}
                                                />
                                            </div>
                                            <div>
                                                <strong>Année:</strong>
                                                <input
                                                    type="text"
                                                    value={selectedCar.year}
                                                    className="form-input"
                                                    disabled
                                                    style={{ marginTop: '0.5rem' }}
                                                />
                                            </div>
                                            <div>
                                                <strong>Prix par Jour:</strong>
                                                <input
                                                    type="text"
                                                    value={`${selectedCar.price_per_day} MAD`}
                                                    className="form-input"
                                                    disabled
                                                    style={{ marginTop: '0.5rem' }}
                                                />
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <strong>Statut:</strong>
                                                <input
                                                    type="text"
                                                    value={getCarAvailability(selectedCar)}
                                                    className="form-input"
                                                    disabled
                                                    style={{ 
                                                        marginTop: '0.5rem',
                                                        color: getCarAvailability(selectedCar) === 'disponible' ? '#10b981' : '#dc2626',
                                                        fontWeight: 'bold'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Price Calculation Section */}
                                <div className="form-section">
                                    <h3 className="section-title">
                                        <FaIdCard />
                                        Calcul du Prix
                                    </h3>
                                    <div className="calculation-section">
                                        <div className="calculation-row">
                                            <span className="calculation-label">Tarif Journalier:</span>
                                            <span className="calculation-value">{selectedCar.price_per_day} MAD /jour</span>
                                        </div>
                                        
                                        <div className="calculation-row">
                                            <span className="calculation-label">Jours de Location:</span>
                                            <span className="calculation-value">{reservationData.total_days} jours</span>
                                        </div>
                                        
                                        <div className="calculation-row">
                                            <span className="calculation-label">Prix Total:</span>
                                            <span className="calculation-value">{reservationData.total_price} MAD</span>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    className="submit-button"
                                    disabled={!reservationData.start_date || !reservationData.end_date || reservationData.total_days <= 0 || submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <FaSpinner className="submitting-spinner" />
                                            Traitement...
                                        </>
                                    ) : (
                                        'Confirmer la Réservation'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Alert Prompt Overlay */}
                {showPrompt && (
                    <div className="alert-prompt-overlay">
                        <div className={`alert-prompt ${promptType}`}>
                            <div className={`alert-icon ${promptType}`}>
                                {promptType === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                            </div>
                            <h2 className="alert-title">
                                {promptType === 'success' ? 'Succès !' : 'Erreur !'}
                            </h2>
                            <p className="alert-message">{promptMessage}</p>
                            <div className="alert-actions">
                                <button 
                                    className={`alert-button ${promptType}`}
                                    onClick={() => setShowPrompt(false)}
                                >
                                    {promptType === 'success' ? 'Continuer' : 'Réessayer'}
                                </button>
                                {promptType === 'error' && (
                                    <button 
                                        className="alert-button secondary"
                                        onClick={() => setShowPrompt(false)}
                                    >
                                        Annuler
                                    </button>
                                )}
                            </div>
                            <div className="progress-bar"></div>
                        </div>
                    </div>
                )}

                {/* Toast Notification */}
                {showPrompt && (
                    <div className={`toast-notification ${promptType}`}>
                        <div className={`toast-icon ${promptType}`}>
                            {promptType === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                        </div>
                        <div className="toast-content">
                            <div className="toast-title">
                                {promptType === 'success' ? 'Réservation Réussie' : 'Échec de Réservation'}
                            </div>
                            <div className="toast-message">{promptMessage}</div>
                        </div>
                        <button 
                            className="toast-close"
                            onClick={() => setShowPrompt(false)}
                        >
                            <FaTimes />
                        </button>
                        <div className="toast-progress"></div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OurCars;