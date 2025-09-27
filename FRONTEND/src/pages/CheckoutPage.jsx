import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { NotificationContext } from '../context/NotificationContext';
import { createCheckoutPreference } from '../api/checkoutApi';
import { getLastAddressAPI } from '../api/userApi'; // 1. Importar la nueva API de usuario
import { useAuthStore } from '../stores/useAuthStore'; // Para saber si el usuario está logueado
import Spinner from '../components/common/Spinner';

const CheckoutPage = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        streetAddress: '',
        comments: '',
        city: '',
        postalCode: '',
        country: 'Argentina',
        state: '',
        prefix: '+54',
        phone: ''
    });

    const [shippingMethod, setShippingMethod] = useState('express');
    const [paymentMethod, setPaymentMethod] = useState('mercadoPago');
    const [isProcessing, setIsProcessing] = useState(false);
    
    const { cart, loading: cartLoading } = useContext(CartContext);
    const { notify } = useContext(NotificationContext);
    const { isAuthenticated } = useAuthStore();
    const navigate = useNavigate();

    // 2. useEffect para autocompletar la dirección
    useEffect(() => {
        const fetchLastAddress = async () => {
            if (isAuthenticated) {
                try {
                    const lastAddress = await getLastAddressAPI();
                    if (lastAddress) {
                        // Rellenamos el formulario con los datos, asegurando que todos los campos existan
                        setFormData(prev => ({ ...prev, ...lastAddress }));
                        notify('Dirección anterior cargada.', 'success');
                    }
                } catch (error) {
                    // No hacemos nada si hay un error (ej: 404), el usuario simplemente llenará el formulario
                    console.log('No se encontró dirección anterior o hubo un error al buscarla.');
                }
            }
        };
        fetchLastAddress();
    }, [isAuthenticated, notify]);

    const isFormValid = useMemo(() => {
        const requiredFields = ['firstName', 'lastName', 'streetAddress', 'city', 'postalCode', 'country', 'state', 'phone'];
        return requiredFields.every(field => formData[field] && formData[field].trim() !== '');
    }, [formData]);

    const subtotal = cart?.items.reduce((sum, item) => sum + item.quantity * item.price, 0) || 0;
    const shippingCost = shippingMethod === 'express' ? 8000 : 0;
    const total = subtotal + shippingCost;

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        
        if (!isFormValid) {
            notify('Por favor, completa todos los campos de la dirección de envío.', 'error');
            return;
        }

        setIsProcessing(true);

        if (!cart || cart.items.length === 0) {
            notify('Tu carrito está vacío.', 'error');
            setIsProcessing(false);
            return;
        }

        if (paymentMethod === 'mercadoPago') {
            try {
                // 3. Enviar el formulario (shipping_address) junto con el carrito
                const preference = await createCheckoutPreference(cart, formData);
                if (preference.init_point) {
                    window.location.href = preference.init_point;
                } else {
                    throw new Error('No se recibió el punto de inicio de pago.');
                }
            } catch (error) {
                console.error('Error al crear la preferencia de pago:', error);
                notify(error.message || 'No se pudo iniciar el proceso de pago.', 'error');
                setIsProcessing(false);
            }
        } else if (paymentMethod === 'credit') {
            notify('El pago directo con tarjeta no está implementado en esta versión.', 'error');
            setIsProcessing(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency', currency: 'ARS',
            minimumFractionDigits: 0, maximumFractionDigits: 0,
        }).format(price).replace("ARS", "$").trim();
    };

    if (cartLoading) return <div className="checkout-page-container"><Spinner message="Cargando..." /></div>;

    return (
        <main className="checkout-page-container">
            <h1 className="checkout-title">CHECKOUT</h1>
            <div className="checkout-content">
                <form id="checkout-form" onSubmit={handlePlaceOrder} className="checkout-form-section">
                    <h2 className="section-title">SHIPPING ADDRESS</h2>
                    <div className="form-grid">
                        {/* Los inputs no cambian, su valor y onChange ya están conectados al estado formData */}
                        <div className="input-group">
                            <label htmlFor="firstName">FIRST NAME</label>
                            <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleFormChange} required />
                        </div>
                        <div className="input-group">
                            <label htmlFor="lastName">LAST NAME</label>
                            <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleFormChange} required />
                        </div>
                        <div className="input-group full-width">
                            <label htmlFor="streetAddress">STREET ADDRESS</label>
                            <input type="text" id="streetAddress" name="streetAddress" value={formData.streetAddress} onChange={handleFormChange} required />
                        </div>
                        <div className="input-group">
                            <label htmlFor="comments">COMMENTS (OPCIONAL)</label>
                            <input type="text" id="comments" name="comments" value={formData.comments} onChange={handleFormChange} />
                        </div>
                        <div className="input-group">
                            <label htmlFor="city">CITY</label>
                            <input type="text" id="city" name="city" value={formData.city} onChange={handleFormChange} required />
                        </div>
                        <div className="input-group">
                            <label htmlFor="postalCode">POSTAL CODE</label>
                            <input type="text" id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleFormChange} required />
                        </div>
                        <div className="input-group">
                            <label htmlFor="country">COUNTRY</label>
                            <input type="text" id="country" name="country" value={formData.country} onChange={handleFormChange} required />
                        </div>
                        <div className="input-group">
                            <label htmlFor="state">STATE</label>
                            <input type="text" id="state" name="state" value={formData.state} onChange={handleFormChange} required />
                        </div>
                        <div className="input-group">
                            <label htmlFor="prefix">PREFIX</label>
                            <input type="text" id="prefix" name="prefix" value={formData.prefix} onChange={handleFormChange} />
                        </div>
                        <div className="input-group">
                            <label htmlFor="phone">PHONE</label>
                            <input type="text" id="phone" name="phone" value={formData.phone} onChange={handleFormChange} required />
                        </div>
                    </div>

                    <h2 className="section-title mt-8">SHIPPING METHOD</h2>
                    {/* ... Opciones de envío ... */}

                    <h2 className="section-title mt-8">PAYMENT METHOD</h2>
                    {/* ... Opciones de pago ... */}
                </form>

                <div className="order-summary-section">
                    <h2 className="section-title">ORDER SUMMARY</h2>
                    {/* ... Resumen de la orden ... */}
                    <button 
                        type="submit" 
                        form="checkout-form" 
                        className="place-order-button" 
                        disabled={isProcessing || !isFormValid}
                    >
                        {isProcessing ? 'PROCESANDO...' : 'PLACE ORDER'}
                    </button>
                </div>
            </div>
        </main>
    );
};

export default CheckoutPage;
