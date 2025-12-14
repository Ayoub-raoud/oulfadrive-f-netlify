import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaCar, FaMapMarkerAlt, FaDollarSign, FaShieldAlt, FaUsers, FaGasPump, FaCog, FaDoorOpen, FaCalendarAlt, FaUser, FaIdCard, FaTimes, FaSpinner, FaSearch, FaClock, FaWhatsapp, FaChevronLeft, FaChevronRight, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCars, selectCars, selectCarsLoading, selectCarsError, createClient, createReservation, fetchClients, selectClients } from '../Redux/store';
import { useNavigate } from 'react-router-dom';

function Index() {
    const dispatch = useDispatch();
    const cars = useSelector(selectCars);
    const clients = useSelector(selectClients);
    const loading = useSelector(selectCarsLoading);
    const error = useSelector(selectCarsError);
    const navigate = useNavigate();

    // ✅ MODIFIED: Function to check car availability based on status field
    const getCarAvailability = (car) => {
        // Use the car's status field directly from the database
        return car.status || 'disponible'; // Default to 'disponible' if status is not set
    };

    // ✅ REMOVED: Matricule checking functions

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

    // Carousel state
    const [currentCarIndex, setCurrentCarIndex] = useState(0);
    
    // ✅ MODIFIED: Filter available cars for featured section using status field
    const availableCars = cars.filter(car => {
        return getCarAvailability(car) === 'disponible';
    });
    const featuredCars = availableCars.slice(0, 8); // Get first 8 available cars for featured section

    // Get random 20 cars for showcase
    const randomCars = useMemo(() => {
        if (!cars.length) return [];
        
        // Create a copy of the cars array to avoid mutating the original
        const carsCopy = [...cars];
        
        // Shuffle the array using Fisher-Yates algorithm
        for (let i = carsCopy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [carsCopy[i], carsCopy[j]] = [carsCopy[j], carsCopy[i]];
        }
        
        // Return first 20 cars after shuffling
        return carsCopy.slice(0, 21);
    }, [cars]);

    useEffect(() => {
        dispatch(fetchCars());
        dispatch(fetchClients());
        // ✅ REMOVED: fetchMatricules dispatch
    }, [dispatch]);

    // Carousel navigation
    const nextCar = () => {
        setCurrentCarIndex((prevIndex) => 
            prevIndex === featuredCars.length - 1 ? 0 : prevIndex + 1
        );
    };

    const prevCar = () => {
        setCurrentCarIndex((prevIndex) => 
            prevIndex === 0 ? featuredCars.length - 1 : prevIndex - 1
        );
    };

    // Auto-advance carousel
    useEffect(() => {
        if (featuredCars.length > 1) {
            const interval = setInterval(nextCar, 5000); // Change car every 5 seconds
            return () => clearInterval(interval);
        }
    }, [featuredCars.length]);

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

        // ✅ REMOVED: Matricule checking logic

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

        // ✅ REMOVED: Matricule checking logic

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

            // ✅ REMOVED: Matricule selection logic
            // We don't need to check or assign matricules anymore

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
                status: 'pending' // Auto-confirm the reservation
            };

            console.log('Creating reservation with data:', reservationPayload);
            
            // Create reservation using Redux action
            const reservationResult = await dispatch(createReservation(reservationPayload)).unwrap();
            console.log('Reservation created:', reservationResult);

            showAlertPrompt('success', 'Réservation confirmée avec succès !');
            setShowReservationForm(false);
            
            // ✅ MODIFIED: Don't refresh data to keep car as "disponible"
            // We don't want to change the car's status
            
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
            'hybrid': 'Hybride'
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

    // Get today's date for date input min attribute
    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    // Get min end date based on start date
    const getMinEndDate = () => {
        return reservationData.start_date || getTodayDate();
    };

    // Function to get image URL
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

    const currentCar = featuredCars[currentCarIndex];

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

                    .hero-section {
                        min-height: 70vh;
                        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        color: #1f2937;
                        padding: 0 2rem;
                        position: relative;
                        overflow: hidden;
                    }

                    .hero-section::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: 
                            radial-gradient(circle at 20% 80%, rgba(220, 38, 38, 0.08) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(220, 38, 38, 0.05) 0%, transparent 50%),
                            radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.05) 0%, transparent 50%);
                        pointer-events: none;
                    }

                    .hero-content {
                        max-width: 800px;
                        animation: fadeInUp 1s ease-out;
                        position: relative;
                        z-index: 2;
                        padding: 2rem;
                    }

                    @keyframes fadeInUp {
                        from {
                            opacity: 0;
                            transform: translateY(50px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    .hero-title {
                        font-size: 3rem;
                        font-weight: 800;
                        margin-bottom: 1rem;
                        font-family: 'Inter', sans-serif;
                        background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        line-height: 1.1;
                    }

                    @media (max-width: 768px) {
                        .hero-title {
                            font-size: 2.2rem;
                        }
                    }

                    .hero-subtitle {
                        font-size: 1.2rem;
                        margin-bottom: 2rem;
                        font-weight: 300;
                        line-height: 1.6;
                        color: #6b7280;
                        max-width: 600px;
                        margin-left: auto;
                        margin-right: auto;
                    }

                    @media (max-width: 768px) {
                        .hero-subtitle {
                            font-size: 1.1rem;
                            padding: 0 1rem;
                            margin-bottom: 1.5rem;
                            line-height: 1.5;
                            max-width: 90%;
                            margin-left: auto;
                            margin-right: auto;
                            text-align: center;
                            display: block;
                            width: 100%;
                            box-sizing: border-box;
                        }
                    }

                    .hero-buttons {
                        display: flex;
                        gap: 1.5rem;
                        justify-content: center;
                        flex-wrap: wrap;
                        margin-top: 1.5rem;
                    }

                    @media (max-width: 768px) {
                        .hero-buttons {
                            gap: 1rem;
                            flex-direction: column;
                            align-items: center;
                            width: 100%;
                            max-width: 300px;
                            margin-left: auto;
                            margin-right: auto;
                        }
                    }

                    .hero-button {
                        padding: 0.875rem 2rem;
                        font-size: 1rem;
                        font-weight: 600;
                        text-decoration: none;
                        border-radius: 50px;
                        transition: all 0.3s ease;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        border: 2px solid transparent;
                        display: inline-block;
                        min-width: 180px;
                        text-align: center;
                    }

                    @media (max-width: 768px) {
                        .hero-button {
                            width: 100%;
                            max-width: 280px;
                            padding: 0.75rem 1.5rem;
                            font-size: 0.9rem;
                            margin: 0 auto;
                            display: block;
                        }
                    }

                    .primary-button {
                        background: #dc2626;
                        color: white;
                        border-color: #dc2626;
                        box-shadow: 0 4px 15px rgba(220, 38, 38, 0.2);
                    }

                    .primary-button:hover {
                        background: #b91c1c;
                        border-color: #b91c1c;
                        transform: translateY(-3px);
                        box-shadow: 0 10px 25px rgba(220, 38, 38, 0.3);
                    }

                    .secondary-button {
                        background: transparent;
                        color: #374151;
                        border-color: #374151;
                        box-shadow: 0 4px 15px rgba(55, 65, 81, 0.1);
                    }

                    .secondary-button:hover {
                        background: #374151;
                        color: white;
                        transform: translateY(-3px);
                        box-shadow: 0 10px 25px rgba(55, 65, 81, 0.3);
                    }

                    /* Featured Cars Carousel Section */
                    .featured-cars-section {
                        padding: 4rem 0;
                        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                        position: relative;
                        overflow: hidden;
                    }

                    .featured-cars-container {
                        max-width: 1400px;
                        margin: 0 auto;
                        position: relative;
                    }

                    .section-title {
                        text-align: center;
                        font-size: 2.2rem;
                        font-weight: 700;
                        margin-bottom: 3rem;
                        color: #1f2937;
                        position: relative;
                    }

                    .section-title::after {
                        content: '';
                        position: absolute;
                        bottom: -1rem;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 80px;
                        height: 4px;
                        background: linear-gradient(135deg, #dc2626, #ef4444);
                        border-radius: 2px;
                    }

                    .carousel-container {
                        position: relative;
                        width: 100%;
                        max-width: 1200px;
                        margin: 0 auto;
                        overflow: hidden;
                        border-radius: 20px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                    }

                    .carousel-track {
                        display: flex;
                        transition: transform 0.5s ease-in-out;
                    }

                    .carousel-slide {
                        min-width: 100%;
                        display: flex;
                        align-items: center;
                        background: white;
                        border-radius: 20px;
                        overflow: hidden;
                    }

                    @media (max-width: 768px) {
                        .carousel-slide {
                            flex-direction: column;
                        }
                    }

                    .carousel-image {
                        flex: 1;
                        min-height: 500px;
                        position: relative;
                        overflow: hidden;
                    }

                    .carousel-image img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }

                    .car-image-placeholder {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
                        color: #94a3b8;
                    }

                    .placeholder-icon {
                        font-size: 4rem;
                        opacity: 0.5;
                    }

                    .carousel-content {
                        flex: 1;
                        padding: 3rem;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    }

                    @media (max-width: 768px) {
                        .carousel-content {
                            padding: 2rem;
                            text-align: center;
                        }
                    }

                    .car-status {
                        position: absolute;
                        top: 1.5rem;
                        right: 1.5rem;
                        padding: 0.5rem 1rem;
                        border-radius: 20px;
                        font-size: 0.8rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        z-index: 2;
                    }

                    .status-available {
                        background: #10b981;
                        color: white;
                    }

                    .status-unavailable {
                        background: #ef4444;
                        color: white;
                    }

                    .status-loading {
                        background: #f59e0b;
                        color: white;
                    }

                    .car-title-large {
                        font-size: 2.5rem;
                        font-weight: 800;
                        color: #1f2937;
                        margin-bottom: 0.5rem;
                        line-height: 1.1;
                    }

                    @media (max-width: 768px) {
                        .car-title-large {
                            font-size: 2rem;
                        }
                    }

                    .car-subtitle {
                        font-size: 1.2rem;
                        color: #6b7280;
                        margin-bottom: 2rem;
                        font-weight: 400;
                    }

                    .car-price-large {
                        font-size: 3rem;
                        font-weight: 800;
                        color: #dc2626;
                        margin-bottom: 1rem;
                    }

                    .car-price-period {
                        font-size: 1rem;
                        color: #6b7280;
                        font-weight: 500;
                        margin-left: 0.5rem;
                    }

                    .car-specs-large {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 1rem;
                        margin-bottom: 2rem;
                    }

                    @media (max-width: 480px) {
                        .car-specs-large {
                            grid-template-columns: 1fr;
                        }
                    }

                    .car-spec-large {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        font-size: 1rem;
                        color: #475569;
                    }

                    .car-spec-icon-large {
                        color: #dc2626;
                        font-size: 1.2rem;
                        min-width: 24px;
                    }

                    .car-spec-text-large {
                        font-weight: 500;
                    }

                    .car-action-buttons {
                        display: flex;
                        gap: 1rem;
                        flex-wrap: wrap;
                    }

                    @media (max-width: 480px) {
                        .car-action-buttons {
                            flex-direction: column;
                        }
                    }

                    .car-button-large {
                        padding: 1rem 2rem;
                        border: none;
                        border-radius: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                        font-size: 1rem;
                        text-decoration: none;
                    }

                    .rent-now-button {
                        background: #dc2626;
                        color: white;
                        flex: 2;
                    }

                    .rent-now-button:hover {
                        background: #b91c1c;
                        transform: translateY(-2px);
                        box-shadow: 0 8px 25px rgba(220, 38, 69, 0.3);
                    }

                    .rent-now-button:disabled {
                        background: #9ca3af;
                        cursor: not-allowed;
                        transform: none;
                    }

                    .whatsapp-button {
                        background: #25D366;
                        color: white;
                        flex: 1;
                        min-width: 60px;
                        padding: 1rem;
                    }

                    .whatsapp-button:hover {
                        background: #128C7E;
                        transform: translateY(-2px);
                        box-shadow: 0 8px 25px rgba(37, 211, 102, 0.3);
                    }

                    .carousel-nav {
                        position: absolute;
                        top: 50%;
                        transform: translateY(-50%);
                        background: rgba(255, 255, 255, 0.9);
                        border: none;
                        width: 50px;
                        height: 50px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        z-index: 3;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                    }

                    .carousel-nav:hover {
                        background: white;
                        transform: translateY(-50%) scale(1.1);
                        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
                    }

                    .carousel-nav.prev {
                        left: 2rem;
                    }

                    .carousel-nav.next {
                        right: 2rem;
                    }

                    .carousel-dots {
                        display: flex;
                        justify-content: center;
                        gap: 0.5rem;
                        margin-top: 2rem;
                    }

                    .carousel-dot {
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        background: #cbd5e1;
                        border: none;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    }

                    .carousel-dot.active {
                        background: #dc2626;
                        transform: scale(1.2);
                    }

                    /* Features Section */
                    .features-section {
                        padding: 4rem 2rem;
                        background: #ffffff;
                        position: relative;
                    }

                    .features-container {
                        max-width: 1200px;
                        margin: 0 auto;
                        position: relative;
                    }

                    .features-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 2rem;
                        margin-top: 2rem;
                    }

                    @media (max-width: 768px) {
                        .features-grid {
                            grid-template-columns: 1fr;
                            gap: 1.5rem;
                            padding: 0 1rem;
                        }
                    }

                    .feature-card {
                        padding: 1.5rem 1rem;
                        text-align: center;
                        transition: all 0.3s ease;
                        position: relative;
                        border-radius: 12px;
                        background: transparent;
                        border: none;
                    }

                    .feature-card:hover {
                        transform: translateY(-5px);
                    }

                    .feature-icon {
                        font-size: 2.2rem;
                        margin-bottom: 1rem;
                        color: #dc2626;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }

                    .feature-title {
                        font-size: 1.2rem;
                        font-weight: 600;
                        margin-bottom: 0.8rem;
                        color: #1f2937;
                    }

                    .feature-description {
                        color: #6b7280;
                        line-height: 1.6;
                        font-size: 0.9rem;
                    }

                    /* Cars Showcase Section */
                    .cars-section {
                        padding: 4rem 2rem;
                        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                        position: relative;
                    }

                    .cars-container {
                        max-width: 1400px;
                        margin: 0 auto;
                    }

                    .cars-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 1.5rem;
                        margin-top: 2rem;
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
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                        transition: all 0.3s ease;
                        position: relative;
                    }

                    .car-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
                    }

                    .car-image {
                        width: 100%;
                        height: 380px;
                        background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        position: relative;
                        overflow: hidden;
                    }

                    .car-image img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }

                    .car-image-placeholder.hidden {
                        display: none;
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
                        color: #1f2937;
                        line-height: 1.3;
                    }

                    .car-year {
                        color: #6b7280;
                        font-size: 0.8rem;
                        font-weight: 500;
                        margin-top: 0.2rem;
                    }

                    .car-price {
                        font-size: 1.3rem;
                        font-weight: 800;
                        color: #dc2626;
                        text-align: right;
                    }

                    .car-price-period {
                        font-size: 0.7rem;
                        color: #6b7280;
                        font-weight: 500;
                    }

                    .car-specs {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 0.5rem;
                        margin-bottom: 1rem;
                        padding: 0.8rem;
                        background: #f8fafc;
                        border-radius: 8px;
                    }

                    .car-spec {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        font-size: 0.75rem;
                        color: #475569;
                    }

                    .car-spec-icon {
                        color: #dc2626;
                        font-size: 0.8rem;
                        min-width: 16px;
                    }

                    .car-spec-text {
                        font-weight: 500;
                    }

                    .car-features {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.4rem;
                        margin-bottom: 1.2rem;
                    }

                    .car-feature {
                        background: #f1f5f9;
                        padding: 0.25rem 0.6rem;
                        border-radius: 10px;
                        font-size: 0.7rem;
                        font-weight: 500;
                        color: #475569;
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
                        border-radius: 8px;
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
                        transform: translateY(-2px);
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
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-width: 50px;
                    }

                    .whatsapp-card-button:hover {
                        background: #128C7E;
                        transform: translateY(-2px);
                    }

                    .loading-section {
                        padding: 3rem 2rem;
                        text-align: center;
                        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                    }

                    .loading-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 1.5rem;
                        margin-top: 2rem;
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
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                        animation: pulse 2s infinite;
                    }

                    .skeleton-image {
                        width: 100%;
                        height: 180px;
                        background: #e2e8f0;
                    }

                    .skeleton-content {
                        padding: 1.2rem;
                    }

                    .skeleton-line {
                        height: 0.8rem;
                        background: #e2e8f0;
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

                    .error-section {
                        padding: 3rem 2rem;
                        text-align: center;
                        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
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
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: background 0.3s ease;
                        font-size: 0.9rem;
                    }

                    .retry-button:hover {
                        background: #b91c1c;
                    }

                    /* Stats Section */
                    .stats-section {
                        padding: 4rem 2rem;
                        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                        position: relative;
                    }

                    .stats-container {
                        max-width: 1200px;
                        margin: 0 auto;
                    }

                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 2rem;
                    }

                    @media (max-width: 768px) {
                        .stats-grid {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 1.5rem;
                            padding: 0 1rem;
                        }
                    }

                    .stat-card {
                        text-align: center;
                        padding: 1.5rem;
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
                        transition: transform 0.3s ease;
                    }

                    .stat-card:hover {
                        transform: translateY(-3px);
                    }

                    .stat-number {
                        font-size: 2.5rem;
                        font-weight: 800;
                        color: #dc2626;
                        margin-bottom: 0.5rem;
                        background: linear-gradient(135deg, #dc2626, #ef4444);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }

                    .stat-label {
                        font-size: 1rem;
                        color: #6b7280;
                        font-weight: 500;
                    }

                    /* CTA Section */
                    .cta-section {
                        padding: 4rem 2rem;
                        background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
                        color: white;
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                    }

                    .cta-section::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: 
                            radial-gradient(circle at 30% 70%, rgba(220, 38, 38, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 70% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
                        pointer-events: none;
                    }

                    .cta-container {
                        max-width: 700px;
                        margin: 0 auto;
                        position: relative;
                        z-index: 2;
                    }

                    .cta-title {
                        font-size: 2rem;
                        font-weight: 700;
                        margin-bottom: 1rem;
                        line-height: 1.2;
                    }

                    .cta-subtitle {
                        font-size: 1.1rem;
                        margin-bottom: 2rem;
                        color: #d1d5db;
                        line-height: 1.6;
                        max-width: 500px;
                        margin-left: auto;
                        margin-right: auto;
                    }

                    .cta-button {
                        display: inline-block;
                        padding: 1rem 2.5rem;
                        background: #dc2626;
                        color: white;
                        text-decoration: none;
                        border-radius: 50px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        transition: all 0.3s ease;
                        border: 2px solid #dc2626;
                        box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
                        position: relative;
                        overflow: hidden;
                        font-size: 0.9rem;
                    }

                    .cta-button::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                        transition: left 0.5s;
                    }

                    .cta-button:hover::before {
                        left: 100%;
                    }

                    .cta-button:hover {
                        background: transparent;
                        color: #dc2626;
                        transform: translateY(-2px);
                        box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
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

                        .alert-actions {
                            flex-direction: column;
                        }

                        .alert-button {
                            width: 100%;
                        }
                    }

                    /* Responsive Design Improvements */
                    @media (max-width: 480px) {
                        .hero-section {
                            padding: 0 1rem;
                            min-height: 60vh;
                        }
                        
                        .hero-content {
                            padding: 1rem;
                        }
                        
                        .features-section,
                        .stats-section,
                        .cta-section,
                        .cars-section {
                            padding: 3rem 1rem;
                        }
                        
                        .section-title {
                            font-size: 1.8rem;
                            margin-bottom: 2rem;
                        }
                        
                        .stats-grid {
                            grid-template-columns: 1fr;
                            gap: 1.2rem;
                        }
                        
                        .cta-title {
                            font-size: 1.7rem;
                        }
                        
                        .cta-subtitle {
                            font-size: 1rem;
                        }
                        
                        .reservation-form-container {
                            padding: 1.5rem;
                            margin: 10px;
                        }

                        .search-inputs {
                            grid-template-columns: 1fr;
                        }

                        .carousel-nav {
                            width: 40px;
                            height: 40px;
                        }

                        .carousel-nav.prev {
                            left: 1rem;
                        }

                        .carousel-nav.next {
                            right: 1rem;
                        }

                        .carousel-image {
                            min-height: 300px;
                        }

                        .car-title-large {
                            font-size: 1.8rem;
                        }

                        .car-price-large {
                            font-size: 2.2rem;
                        }

                        .car-buttons {
                            flex-direction: column;
                        }

                        .toast-notification {
                            top: 70px;
                            right: 10px;
                            left: 10px;
                        }
                    }

                    /* Loading animation for elements */
                    @keyframes slideInFromLeft {
                        from {
                            opacity: 0;
                            transform: translateX(-50px);
                        }
                        to {
                            opacity: 1;
                            transform: translateX(0);
                        }
                    }

                    @keyframes slideInFromRight {
                        from {
                            opacity: 0;
                            transform: translateX(50px);
                        }
                        to {
                            opacity: 1;
                            transform: translateX(0);
                        }
                    }

                    /* Apply animations to feature cards */
                    .feature-card:nth-child(odd) {
                        animation: slideInFromLeft 0.6s ease-out;
                    }

                    .feature-card:nth-child(even) {
                        animation: slideInFromRight 0.6s ease-out;
                    }
                `}
            </style>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Explorez le Maroc en Toute Liberté
                    </h1>
                    <p className="hero-subtitle">
                        Service de location de voitures premium dans toutes les grandes villes du Maroc. 
                        Découvrez la beauté du Maroc avec nos véhicules fiables et confortables.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/our-cars" className="hero-button primary-button">
                            Voir Nos Voitures
                        </Link>
                        <Link to="/contact" className="hero-button secondary-button">
                            Nous Contacter
                        </Link>
                    </div>
                </div>
            </section>

            {/* Featured Cars Carousel Section */}
            {!loading && !error && featuredCars.length > 0 && (
                <section className="featured-cars-section">
                    <div className="featured-cars-container">
                        <h2 className="section-title">Véhicules en Vedette</h2>
                        
                        <div className="carousel-container">
                            <div className="carousel-track" style={{ transform: `translateX(-${currentCarIndex * 100}%)` }}>
                                {featuredCars.map((car, index) => {
                                    const imageUrl = getCarImageUrl(car);
                                    const carAvailability = getCarAvailability(car);
                                    const isAvailable = carAvailability === 'disponible';
                                    
                                    return (
                                        <div key={car.id} className="carousel-slide">
                                            <div className="carousel-image">
                                                {imageUrl ? (
                                                    <img 
                                                        src={imageUrl} 
                                                        alt={`${car.brand} ${car.model}`}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextElementSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={`car-image-placeholder ${imageUrl ? 'hidden' : ''}`}>
                                                    <FaCar className="placeholder-icon" />
                                                </div>
                                                <div className={`car-status ${
                                                    isAvailable ? 'status-available' : 'status-unavailable'
                                                }`}>
                                                    {isAvailable ? 'Disponible' : 'Indisponible'}
                                                </div>
                                            </div>
                                            
                                            <div className="carousel-content">
                                                <h3 className="car-title-large">
                                                    {getSafeValue(car.brand, 'Voiture')} {getSafeValue(car.model, 'Modèle')}
                                                </h3>
                                                <p className="car-subtitle">
                                                    {getSafeValue(car.year, '2023')} • {capitalizeFirst(getSafeValue(car.color, 'N/A'))}
                                                </p>
                                                
                                                <div className="car-price-large">
                                                    {getSafeValue(car.price_per_day, '0')} MAD
                                                    <span className="car-price-period">/jour</span>
                                                </div>
                                                
                                                <div className="car-specs-large">
                                                    <div className="car-spec-large">
                                                        <FaUsers className="car-spec-icon-large" />
                                                        <span className="car-spec-text-large">{getSafeValue(car.seats, 5)} Places</span>
                                                    </div>
                                                    <div className="car-spec-large">
                                                        <FaDoorOpen className="car-spec-icon-large" />
                                                        <span className="car-spec-text-large">{getSafeValue(car.doors, 4)} Portes</span>
                                                    </div>
                                                    <div className="car-spec-large">
                                                        <FaGasPump className="car-spec-icon-large" />
                                                        <span className="car-spec-text-large">{getFuelTypeDisplay(getSafeValue(car.fuel_type, 'petrol'))}</span>
                                                    </div>
                                                    <div className="car-spec-large">
                                                        <FaCog className="car-spec-icon-large" />
                                                        <span className="car-spec-text-large">{getTransmissionDisplay(getSafeValue(car.transmission, 'automatic'))}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="car-action-buttons">
                                                    <button 
                                                        className="car-button-large rent-now-button"
                                                        onClick={() => handleRentNow(car)}
                                                        disabled={!isAvailable}
                                                    >
                                                        <FaCar />
                                                        {isAvailable ? 'Réserver' : 'Indisponible'}
                                                    </button>
                                                    <button 
                                                        className="car-button-large whatsapp-button"
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
                            
                            {/* Navigation Arrows */}
                            {featuredCars.length > 1 && (
                                <>
                                    <button className="carousel-nav prev" onClick={prevCar}>
                                        <FaChevronLeft />
                                    </button>
                                    <button className="carousel-nav next" onClick={nextCar}>
                                        <FaChevronRight />
                                    </button>
                                </>
                            )}
                        </div>
                        
                        {/* Dots Indicator */}
                        {featuredCars.length > 1 && (
                            <div className="carousel-dots">
                                {featuredCars.map((_, index) => (
                                    <button
                                        key={index}
                                        className={`carousel-dot ${index === currentCarIndex ? 'active' : ''}`}
                                        onClick={() => setCurrentCarIndex(index)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Features Section */}
            <section className="features-section">
                <div className="features-container">
                    <h2 className="section-title">Pourquoi Choisir Oulfa Drive ?</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaCar size={35} />
                            </div>
                            <h3 className="feature-title">Flotte Premium</h3>
                            <p className="feature-description">
                                Choisissez parmi notre vaste collection de véhicules de luxe et économiques, 
                                tous entretenus selon les normes les plus élevées avec des inspections régulières.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaMapMarkerAlt size={35} />
                            </div>
                            <h3 className="feature-title">Couverture Nationale</h3>
                            <p className="feature-description">
                                Disponible dans toutes les grandes villes marocaines dont Casablanca, Marrakech, 
                                Rabat, Tanger et Agadir avec des points de retrait pratiques.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaDollarSign size={35} />
                            </div>
                            <h3 className="feature-title">Meilleurs Prix</h3>
                            <p className="feature-description">
                                Tarification compétitive sans frais cachés. Obtenez le meilleur rapport 
                                qualité-prix avec notre tarification transparente et nos forfaits de location flexibles.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <FaShieldAlt size={35} />
                            </div>
                            <h3 className="feature-title">Assurance Complète</h3>
                            <p className="feature-description">
                                Couverture d'assurance complète incluse avec chaque location pour 
                                une tranquillité d'esprit totale pendant votre voyage à travers le Maroc.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Cars Showcase Section */}
            <section className="cars-section">
                <div className="cars-container">
                    <h2 className="section-title">Notre Collection de Véhicules</h2>
                    
                    {loading && (
                        <div className="loading-grid">
                            {[...Array(8)].map((_, index) => (
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

                    {!loading && !error && randomCars.length > 0 && (
                        <div className="cars-grid">
                            {randomCars.map((car) => {
                                const imageUrl = getCarImageUrl(car);
                                const carAvailability = getCarAvailability(car);
                                const isAvailable = carAvailability === 'disponible';
                                
                                return (
                                    <div key={car.id} className="car-card">
                                        <div 
                                            className="car-image"
                                            onClick={() => navigate(`/details/${car.id}`)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {imageUrl ? (
                                                <img 
                                                    src={imageUrl} 
                                                    alt={`${car.brand} ${car.model}`}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextElementSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div className={`car-image-placeholder ${imageUrl ? 'hidden' : ''}`}>
                                                <FaCar className="placeholder-icon" />
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
                                                    <h3 className="car-title">{getSafeValue(car.brand, 'Voiture')} {getSafeValue(car.model, 'Modèle')}</h3>
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
                    )}
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="stats-container">
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-number">500+</div>
                            <div className="stat-label">Clients Satisfaits</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">50+</div>
                            <div className="stat-label">Véhicules Premium</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">15+</div>
                            <div className="stat-label">Villes Desservies</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">24/7</div>
                            <div className="stat-label">Support Client</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-container">
                    <h2 className="cta-title">Prêt à Explorer le Maroc ?</h2>
                    <p className="cta-subtitle">
                        Réservez votre voiture parfaite dès aujourd'hui et commencez votre voyage inoubliable avec Oulfa Drive. 
                        Vivez la liberté de la route ouverte.
                    </p>
                    <Link to="/our-cars" className="cta-button">
                        Réserver Maintenant
                    </Link>
                </div>
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
                                        <span className="calculation-value">{selectedCar.price_per_day} MAD/jour</span>
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
    );
}

export default Index;