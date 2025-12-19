import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
    FaCar, 
    FaUsers, 
    FaDoorOpen, 
    FaGasPump, 
    FaCog, 
    FaArrowLeft,
    FaCalendarAlt,
    FaUser,
    FaIdCard,
    FaTimes,
    FaSpinner,
    FaMapMarkerAlt,
    FaPalette,
    FaCheck,
    FaCogs,
    FaClock,
    FaCamera,
    FaExpand,
    FaWhatsapp,
    FaCheckCircle,
    FaExclamationTriangle,
    FaShieldAlt,
    FaTachometerAlt
} from 'react-icons/fa';
import { 
    fetchCars, 
    selectCars, 
    selectCarsLoading, 
    selectCarsError, 
    createClient, 
    createReservation, 
    fetchClients, 
    selectClients
} from '../Redux/store';

function Details() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const cars = useSelector(selectCars);
    const clients = useSelector(selectClients);
    const loading = useSelector(selectCarsLoading);
    const error = useSelector(selectCarsError);
    
    const [selectedCar, setSelectedCar] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showFullscreenImage, setShowFullscreenImage] = useState(false);
    
    // New state for prompts
    const [showPrompt, setShowPrompt] = useState(false);
    const [promptType, setPromptType] = useState(''); // 'success' or 'error'
    const [promptMessage, setPromptMessage] = useState('');

    const [reservationData, setReservationData] = useState({
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

    // Scroll to top on component mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        dispatch(fetchCars());
        dispatch(fetchClients());
    }, [dispatch]);

    useEffect(() => {
        if (cars.length > 0 && id) {
            const car = cars.find(car => car.id === parseInt(id));
            setSelectedCar(car);
        }
    }, [cars, id]);

    // ✅ Function to check car availability based on status field ONLY
    const getCarAvailability = (car) => {
        if (!car) return 'non disponible';
        // Use the car's status field directly from the database
        return car.status || 'non disponible';
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

    // Function to get image URL
    const getCarImageUrl = (car) => {
        if (!car) return null;
        
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

    // Handle image load
    const handleImageLoad = () => {
        setImageLoaded(true);
        setImageError(false);
    };

    // Handle image error
    const handleImageError = () => {
        setImageError(true);
        setImageLoaded(false);
    };

    // Handle reservation form input changes
    const handleReservationInputChange = (e) => {
        const { name, value } = e.target;
        setReservationData(prev => ({
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

    // Handle Rent Now button click
    const handleRentNow = () => {
        if (!selectedCar) return;
        
        const carAvailability = getCarAvailability(selectedCar);
        
        if (carAvailability !== 'disponible') {
            showAlertPrompt('error', 'Cette voiture n\'est pas disponible pour le moment');
            return;
        }

        // Open reservation form if car is available
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
    };

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

    // ✅ Check car availability from status field ONLY
    const carAvailability = getCarAvailability(selectedCar);
    if (carAvailability !== 'disponible') {
        showAlertPrompt('error', 'Cette voiture n\'est plus disponible. Veuillez en choisir une autre.');
        setSubmitting(false);
        return;
    }

    // ✅ MODIFIED: Only validate required client fields (nom, prenom, telephone)
    if (!reservationData.nom || !reservationData.prenom || !reservationData.telephone) {
        showAlertPrompt('error', 'Veuillez remplir le nom, prénom et téléphone');
        setSubmitting(false);
        return;
    }

    try {
        let clientId;

        // Check if client already exists by phone or email
        const existingClient = clients.find(client => 
            client.telephone === reservationData.telephone || 
            client.email === reservationData.email
        );

        if (existingClient) {
            // Use existing client
            clientId = existingClient.id;
            console.log('Using existing client ID:', clientId);
        } else {
            // ✅ MODIFIED: Send empty strings instead of null values
            const clientData = {
                nom: reservationData.nom,
                prenom: reservationData.prenom,
                telephone: reservationData.telephone,
                email: reservationData.email || '', // Send empty string instead of null
                city: reservationData.city || '',   // Send empty string instead of null
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
        
        // Refresh data to update availability
        setTimeout(() => {
            dispatch(fetchCars(true));
        }, 1000);
        setTimeout(() => {
            navigate('/our-cars');
        }, 3000);
        
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

    // Get today's date for date input min attribute
    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    // Get min end date based on start date
    const getMinEndDate = () => {
        return reservationData.start_date || getTodayDate();
    };

    if (loading) {
        return (
            <div className="details-page" style={{ paddingTop: '80px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-spinner">
                    <FaSpinner style={{ fontSize: '3rem', color: '#dc2626', animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: '1rem', color: '#6b7280' }}>Chargement des détails de la voiture...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="details-page" style={{ paddingTop: '80px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <div className="error-message" style={{ color: '#dc2626', fontSize: '1.2rem', marginBottom: '1rem' }}>
                    Erreur lors du chargement des détails de la voiture: {error}
                </div>
                <button 
                    className="retry-button"
                    onClick={() => dispatch(fetchCars())}
                    style={{ 
                        padding: '0.7rem 1.5rem', 
                        background: '#dc2626', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px', 
                        cursor: 'pointer' 
                    }}
                >
                    Réessayer
                </button>
            </div>
        );
    }

    if (!selectedCar) {
        return (
            <div className="details-page" style={{ paddingTop: '80px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <div className="not-found" style={{ textAlign: 'center' }}>
                    <FaCar style={{ fontSize: '4rem', color: '#9ca3af', marginBottom: '1rem' }} />
                    <h2 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Voiture Non Trouvée</h2>
                    <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>La voiture que vous recherchez n'existe pas.</p>
                    <button 
                        onClick={() => navigate('/our-cars')}
                        style={{ 
                            padding: '0.7rem 1.5rem', 
                            background: '#dc2626', 
                            color: 'white', 
                        border: 'none', 
                        borderRadius: '6px', 
                        cursor: 'pointer' 
                    }}
                >
                    Retour aux Voitures
                </button>
            </div>
        </div>
    );
}

const carImageUrl = getCarImageUrl(selectedCar);
const carAvailability = getCarAvailability(selectedCar);
const isAvailable = carAvailability === 'disponible';

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

                .details-page {
                    min-height: 100vh;
                    background: white;
                    padding-top: 80px;
                }

                /* Back Button */
                .back-button {
                    position: fixed;
                    top: 100px;
                    left: 2rem;
                    z-index: 100;
                    background: white;
                    border: 2px solid #dc2626;
                    color: #dc2626;
                    padding: 0.7rem 1.2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                .back-button:hover {
                    background: #dc2626;
                    color: white;
                    transform: translateX(-2px);
                }

                @media (max-width: 768px) {
                    .back-button {
                        top: 90px;
                        left: 1rem;
                        padding: 0.5rem 1rem;
                        font-size: 0.9rem;
                    }
                }

                /* Main Layout Container */
                .main-layout-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 2rem;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 3rem;
                    align-items: start;
                }

                @media (max-width: 1024px) {
                    .main-layout-container {
                        grid-template-columns: 1fr;
                        gap: 2rem;
                    }
                }

                @media (max-width: 768px) {
                    .main-layout-container {
                        padding: 1rem;
                    }
                }

                /* Left Column - Car Details */
                .car-details-column {
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #e5e7eb;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

                /* Enhanced Car Image Section */
                .car-image-section {
                    width: 100%;
                    padding: 2rem;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-bottom: 1px solid #e5e7eb;
                    position: relative;
                    overflow: hidden;
                }

                .car-image-container {
                    width: 100%;
                    max-width: 600px;
                    height: 400px;
                    border-radius: 12px;
                    overflow: hidden;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    position: relative;
                    transition: all 0.3s ease;
                    border: 1px solid #f1f5f9;
                }

                .car-image-container:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 20px 40px -4px rgba(0, 0, 0, 0.15), 0 8px 10px -4px rgba(0, 0, 0, 0.1);
                }

                .car-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: all 0.3s ease;
                    cursor: zoom-in;
                }

                .car-image:hover {
                    transform: scale(1.02);
                }

                .car-image-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #64748b;
                    flex-direction: column;
                    gap: 1rem;
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                    border: 2px dashed #cbd5e1;
                    border-radius: 12px;
                }

                .car-image-placeholder.hidden {
                    display: none;
                }

                .placeholder-icon {
                    font-size: 4rem;
                    opacity: 0.4;
                    color: #475569;
                }

                .placeholder-text {
                    font-size: 1.1rem;
                    color: #64748b;
                    font-weight: 500;
                }

                .image-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: all 0.3s ease;
                    cursor: zoom-in;
                }

                .car-image-container:hover .image-overlay {
                    opacity: 1;
                }

                .zoom-icon {
                    color: white;
                    font-size: 2rem;
                    background: rgba(220, 38, 38, 0.8);
                    padding: 1rem;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                }

                .image-overlay:hover .zoom-icon {
                    transform: scale(1.1);
                    background: rgba(220, 38, 38, 1);
                }

                /* Image Loading States */
                .image-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    gap: 1rem;
                    color: #64748b;
                }

                .loading-spinner-image {
                    animation: spin 1s linear infinite;
                    font-size: 2rem;
                    color: #dc2626;
                }

                /* Fullscreen Image Modal */
                .fullscreen-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 2rem;
                }

                .fullscreen-image-container {
                    max-width: 90%;
                    max-height: 90%;
                    position: relative;
                }

                .fullscreen-image {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    border-radius: 8px;
                }

                .close-fullscreen {
                    position: absolute;
                    top: -50px;
                    right: 0;
                    background: #dc2626;
                    color: white;
                    border: none;
                    padding: 0.75rem;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1.2rem;
                    transition: all 0.3s ease;
                }

                .close-fullscreen:hover {
                    background: #b91c1c;
                    transform: scale(1.1);
                }

                /* Car Info Content */
                .car-info-content {
                    padding: 2rem;
                }

                .car-header {
                    margin-bottom: 2rem;
                    border-bottom: 2px solid #f3f4f6;
                    padding-bottom: 1.5rem;
                }

                .car-main-title {
                    font-size: 2rem;
                    font-weight: 800;
                    color: #1f2937;
                    margin-bottom: 0.5rem;
                    line-height: 1.2;
                }

                .car-subtitle {
                    font-size: 1.1rem;
                    color: #6b7280;
                    font-weight: 500;
                    margin-bottom: 1rem;
                }

                .car-price-section {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .car-price-large {
                    font-size: 2rem;
                    font-weight: 800;
                    color: #dc2626;
                }

                .car-price-period {
                    font-size: 1rem;
                    color: #6b7280;
                    font-weight: 500;
                }

                .availability-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    margin-top: 1rem;
                }

                .available {
                    background: #dcfce7;
                    color: #166534;
                    border: 1px solid #bbf7d0;
                }

                .unavailable {
                    background: #fef2f2;
                    color: #dc2626;
                    border: 1px solid #fecaca;
                }

                .car-specs-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .spec-group {
                    background: #f8fafc;
                    padding: 1.5rem;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                }

                .spec-group-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .specs-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.8rem;
                }

                .spec-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem 0;
                    border-bottom: 1px solid #e5e7eb;
                }

                .spec-item:last-child {
                    border-bottom: none;
                }

                .spec-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #6b7280;
                    font-weight: 500;
                }

                .spec-value {
                    font-weight: 600;
                    color: #1f2937;
                }

                .car-description {
                    margin-top: 2rem;
                }

                .description-title {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 1rem;
                }

                .description-text {
                    color: #6b7280;
                    line-height: 1.6;
                    font-size: 1rem;
                }

                /* Right Column - Reservation Form */
                .reservation-column {
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #e5e7eb;
                    padding: 2rem;
                    position: sticky;
                    top: 100px;
                    box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
                }

                @media (max-width: 1024px) {
                    .reservation-column {
                        position: static;
                    }
                }

                .reservation-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 1.5rem;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .reservation-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .form-section {
                    background: #f8fafc;
                    padding: 1.5rem;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                }

                .form-section-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 1rem;
                    display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }

                    .form-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 1rem;
                    }

                    @media (max-width: 768px) {
                        .form-grid {
                            grid-template-columns: 1fr;
                            }
                    }

                    .form-group {
                        margin-bottom: 1rem;
                    }

                    .form-group-full {
                        grid-column: 1 / -1;
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

                    .date-time-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 1rem;
                    }

                    @media (max-width: 480px) {
                        .date-time-grid {
                            grid-template-columns: 1fr;
                        }
                    }

                    .car-summary {
                        background: white;
                        padding: 1.5rem;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                        margin-top: 1rem;
                    }

                    .car-summary-title {
                        font-size: 1.1rem;
                        font-weight: 700;
                        color: #1f2937;
                        margin-bottom: 1rem;
                    }

                    .car-summary-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 1rem;
                    }

                    .summary-item {
                        display: flex;
                        flex-direction: column;
                        gap: 0.5rem;
                    }

                    .summary-label {
                        font-weight: 600;
                        color: #6b7280;
                        font-size: 0.9rem;
                    }

                    .summary-value {
                        font-weight: 600;
                        color: #1f2937;
                    }

                    .price-calculation {
                        background: white;
                        padding: 1.5rem;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                        margin-top: 1rem;
                    }

                    .calculation-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0.75rem 0;
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

                    .submit-button-container {
                        display: flex;
                        gap: 1rem;
                        margin-top: 1rem;
                    }

                    .submit-button {
                        flex: 2;
                        padding: 1rem 2rem;
                        background: #dc2626;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 1.1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                    }

                    .submit-button:hover:not(:disabled) {
                        background: #b91c1c;
                        transform: translateY(-2px);
                        box-shadow: 0 8px 20px -4px rgba(220, 38, 38, 0.3);
                    }

                    .submit-button:disabled {
                        background: #9ca3af;
                        cursor: not-allowed;
                        transform: none;
                    }

                    .whatsapp-button {
                        flex: 1;
                        padding: 1rem;
                        background: #25D366;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-width: 60px;
                    }

                    .whatsapp-button:hover {
                        background: #128C7E;
                        transform: translateY(-2px);
                        box-shadow: 0 8px 20px -4px rgba(37, 211, 102, 0.3);
                    }

                    .submitting-spinner {
                        animation: spin 1s linear infinite;
                    }

                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }

                    /* Features Section */
                    .features-section {
                        background: #f8fafc;
                        padding: 2rem;
                        border-radius: 12px;
                        margin-top: 2rem;
                        border: 1px solid #e5e7eb;
                        grid-column: 1 / -1;
                    }

                    .section-title {
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: #1f2937;
                        text-align: center;
                        margin-bottom: 1.5rem;
                    }

                    .features-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 1rem;
                    }

                    .feature-item {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 1rem;
                        background: white;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                        transition: all 0.3s ease;
                    }

                    .feature-item:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        border-color: #dc2626;
                    }

                    .feature-icon {
                        font-size: 1.2rem;
                        color: #dc2626;
                        min-width: 30px;
                    }

                    .feature-content h4 {
                        font-weight: 600;
                        color: #1f2937;
                        margin-bottom: 0.25rem;
                        font-size: 0.9rem;
                    }

                    .feature-content p {
                        color: #6b7280;
                        font-size: 0.8rem;
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

                        .submit-button-container {
                            flex-direction: column;
                        }
                    }

                    /* Responsive Design */
                    @media (max-width: 480px) {
                        .main-layout-container {
                            padding: 0.5rem;
                        }
                        
                        .car-info-content, .reservation-column {
                            padding: 1.5rem;
                        }
                        
                        .car-main-title {
                            font-size: 1.5rem;
                        }
                        
                        .car-price-large {
                            font-size: 1.5rem;
                        }
                        
                        .form-section {
                            padding: 1rem;
                        }

                        .car-image-container {
                            height: 300px;
                        }

                        .placeholder-icon {
                            font-size: 3rem;
                        }
                    }
                `}
            </style>

            {/* Fullscreen Image Modal */}
            {showFullscreenImage && carImageUrl && (
                <div className="fullscreen-modal" onClick={() => setShowFullscreenImage(false)}>
                    <div className="fullscreen-image-container" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={carImageUrl} 
                            alt={`${selectedCar.brand} ${selectedCar.model}`}
                            className="fullscreen-image"
                        />
                        <button 
                            className="close-fullscreen"
                            onClick={() => setShowFullscreenImage(false)}
                        >
                            <FaTimes />
                        </button>
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

            <div className="details-page">
                {/* Back Button */}
                <button 
                    className="back-button"
                    onClick={() => navigate('/our-cars')}
                >
                    <FaArrowLeft />
                    Retour aux Voitures
                </button>

                <div className="main-layout-container">
                    {/* Left Column - Car Details */}
                    <div className="car-details-column">
                        {/* Enhanced Car Image */}
                        <div className="car-image-section">
                            <div className="car-image-container">
                                {carImageUrl && !imageError ? (
                                    <>
                                        <img 
                                            src={carImageUrl} 
                                            alt={`${selectedCar.brand} ${selectedCar.model}`}
                                            className="car-image"
                                            onLoad={handleImageLoad}
                                            onError={handleImageError}
                                            onClick={() => setShowFullscreenImage(true)}
                                        />
                                        <div 
                                            className="image-overlay"
                                            onClick={() => setShowFullscreenImage(true)}
                                        >
                                            <FaExpand className="zoom-icon" />
                                        </div>
                                        {!imageLoaded && (
                                            <div className="image-loading">
                                                <FaSpinner className="loading-spinner-image" />
                                                <p>Chargement de l'image...</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="car-image-placeholder">
                                        <FaCamera className="placeholder-icon" />
                                        <p className="placeholder-text">Aucune image disponible</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Car Information */}
                        <div className="car-info-content">
                            <div className="car-header">
                                <h1 className="car-main-title">
                                    {getSafeValue(selectedCar.brand, 'Voiture')} {getSafeValue(selectedCar.model, 'Modèle')}
                                </h1>
                                <p className="car-subtitle">
                                    {getSafeValue(selectedCar.year, '2023')} • {capitalizeFirst(getSafeValue(selectedCar.color, 'N/A'))} • {getFuelTypeDisplay(getSafeValue(selectedCar.fuel_type, 'petrol'))}
                                </p>
                                <div className="car-price-section">
                                    <div className="car-price-large">
                                        {getSafeValue(selectedCar.price_per_day, '0')} MAD
                                    </div>
                                    <div className="car-price-period">par jour</div>
                                </div>
                                <div className={`availability-badge ${
                                    isAvailable ? 'available' : 'unavailable'
                                }`}>
                                    <FaCheck />
                                    {isAvailable ? 'Disponible à la Location' : 'Actuellement Indisponible'}
                                </div>
                            </div>

                            <div className="car-specs-grid">
                                <div className="spec-group">
                                    <h3 className="spec-group-title">
                                        <FaCogs />
                                        Spécifications Techniques
                                    </h3>
                                    <div className="specs-list">
                                        <div className="spec-item">
                                            <span className="spec-label">
                                                <FaGasPump />
                                                Type de Carburant
                                            </span>
                                            <span className="spec-value">
                                                {getFuelTypeDisplay(getSafeValue(selectedCar.fuel_type, 'petrol'))}
                                            </span>
                                        </div>
                                        <div className="spec-item">
                                            <span className="spec-label">
                                                <FaCog />
                                                Transmission
                                            </span>
                                            <span className="spec-value">
                                                {getTransmissionDisplay(getSafeValue(selectedCar.transmission, 'automatic'))}
                                            </span>
                                        </div>
                                        <div className="spec-item">
                                            <span className="spec-label">
                                                <FaPalette />
                                                Couleur
                                            </span>
                                            <span className="spec-value">
                                                {capitalizeFirst(getSafeValue(selectedCar.color, 'N/A'))}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="spec-group">
                                    <h3 className="spec-group-title">
                                        <FaUsers />
                                        Capacité & Dimensions
                                    </h3>
                                    <div className="specs-list">
                                        <div className="spec-item">
                                            <span className="spec-label">
                                                <FaUsers />
                                                Places
                                            </span>
                                            <span className="spec-value">
                                                {getSafeValue(selectedCar.seats, 5)} Personnes
                                            </span>
                                        </div>
                                        <div className="spec-item">
                                            <span className="spec-label">
                                                <FaDoorOpen />
                                                Portes
                                            </span>
                                            <span className="spec-value">
                                                {getSafeValue(selectedCar.doors, 4)} Portes
                                            </span>
                                        </div>
                                        <div className="spec-item">
                                            <span className="spec-label">
                                                <FaMapMarkerAlt />
                                                Catégorie
                                            </span>
                                            <span className="spec-value">
                                                {capitalizeFirst(getSafeValue(selectedCar.category, 'Standard'))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="car-description">
                                <h3 className="description-title">À Propos de Ce Véhicule</h3>
                                <p className="description-text">
                                    Découvrez le parfait équilibre entre performance et confort avec la {getSafeValue(selectedCar.brand, 'Voiture')} {getSafeValue(selectedCar.model, 'Modèle')}. 
                                    Ce modèle {getSafeValue(selectedCar.year, '2023')} dispose d'un moteur puissant avec une efficacité {getFuelTypeDisplay(getSafeValue(selectedCar.fuel_type, 'petrol'))}. 
                                    Avec {getSafeValue(selectedCar.seats, 5)} sièges confortables et {getSafeValue(selectedCar.doors, 4)} portes, il est parfait pour les voyages en famille et les déplacements professionnels. 
                                    La transmission {getTransmissionDisplay(getSafeValue(selectedCar.transmission, 'automatic'))} garantit une expérience de conduite fluide dans toutes les conditions.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Reservation Form */}
                    <div className="reservation-column">
                        <h2 className="reservation-title">
                            <FaCar />
                            Réserver Cette Voiture
                        </h2>
                        
                        <form onSubmit={handleReservationSubmit} className="reservation-form">
                            {/* Client Information Section */}
                            <div className="form-section">
                                <h3 className="form-section-title">
                                    <FaUser />
                                    Informations Client
                                </h3>
                                <div className="form-grid">
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
                                            disabled={submitting}
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
                                            disabled={submitting}
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
                                            disabled={submitting}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={reservationData.email}
                                            onChange={handleReservationInputChange}
                                            className="form-input"
                                            placeholder="Entrez votre email"
                                            disabled={submitting}
                                        />
                                    </div>

                                    <div className="form-group form-group-full">
                                        <label className="form-label">Ville</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={reservationData.city}
                                            onChange={handleReservationInputChange}
                                            className="form-input"
                                            placeholder="Entrez votre ville"
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Reservation Dates Section */}
                            <div className="form-section">
                                <h3 className="form-section-title">
                                    <FaCalendarAlt />
                                    Dates de Réservation
                                </h3>
                                <div className="date-time-grid">
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
                                <h3 className="form-section-title">
                                    <FaCar />
                                    Informations Véhicule
                                </h3>
                                <div className="car-summary">
                                    <h4 className="car-summary-title">{selectedCar.brand} {selectedCar.model}</h4>
                                    <div className="car-summary-grid">
                                        <div className="summary-item">
                                            <span className="summary-label">Marque</span>
                                            <input
                                                type="text"
                                                value={selectedCar.brand}
                                                className="form-input"
                                                disabled
                                            />
                                        </div>
                                        <div className="summary-item">
                                            <span className="summary-label">Modèle</span>
                                            <input
                                                type="text"
                                                value={selectedCar.model}
                                                className="form-input"
                                                disabled
                                            />
                                        </div>
                                        <div className="summary-item">
                                            <span className="summary-label">Année</span>
                                            <input
                                                type="text"
                                                value={selectedCar.year}
                                                className="form-input"
                                                disabled
                                            />
                                        </div>
                                        <div className="summary-item">
                                            <span className="summary-label">Prix par Jour</span>
                                            <input
                                                type="text"
                                                value={`${selectedCar.price_per_day} MAD`}
                                                className="form-input"
                                                disabled
                                            />
                                        </div>
                                        <div className="summary-item" style={{ gridColumn: '1 / -1' }}>
                                            <span className="summary-label">Statut</span>
                                            <input
                                                type="text"
                                                value={carAvailability}
                                                className="form-input"
                                                disabled
                                                style={{
                                                    color: isAvailable ? '#10b981' : '#dc2626',
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Price Calculation Section */}
                            <div className="form-section">
                                <h3 className="form-section-title">
                                    <FaIdCard />
                                    Calcul du Prix
                                </h3>
                                <div className="price-calculation">
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

                            <div className="submit-button-container">
                                <button 
                                    type="submit" 
                                    className="submit-button"
                                    disabled={!reservationData.start_date || !reservationData.end_date || reservationData.total_days <= 0 || submitting || !isAvailable}
                                >
                                    {submitting ? (
                                        <>
                                            <FaSpinner className="submitting-spinner" />
                                            Traitement...
                                        </>
                                    ) : isAvailable ? (
                                        'Confirmer la Réservation'
                                    ) : (
                                        'Indisponible'
                                    )}
                                </button>
                                <button 
                                    type="button"
                                    className="whatsapp-button"
                                    onClick={() => handleWhatsAppClick(selectedCar)}
                                    title="Contactez-nous sur WhatsApp"
                                >
                                    <FaWhatsapp />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Features Section - Full Width */}
                    <div className="features-section">
                        <h3 className="section-title">Pourquoi Choisir Cette Voiture ?</h3>
                        <div className="features-grid">
                            <div className="feature-item">
                                <div className="feature-icon">
                                    <FaCar />
                                </div>
                                <div className="feature-content">
                                    <h4>Confort Optimal</h4>
                                    <p>Sièges ergonomiques et climatisation pour un voyage agréable</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">
                                    <FaShieldAlt />
                                </div>
                                <div className="feature-content">
                                    <h4>Sécurité Garantie</h4>
                                    <p>Systèmes de sécurité avancés et entretien régulier</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">
                                    <FaGasPump />
                                </div>
                                <div className="feature-content">
                                    <h4>Économique</h4>
                                    <p>Faible consommation de carburant et entretien abordable</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">
                                    <FaTachometerAlt />
                                </div>
                                <div className="feature-content">
                                    <h4>Performance</h4>
                                    <p>Moteur fiable et conduite fluide en toutes circonstances</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Details;