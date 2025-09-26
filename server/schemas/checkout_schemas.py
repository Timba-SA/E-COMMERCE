# En schemas/checkout_schemas.py
from pydantic import BaseModel, EmailStr
from typing import List, Optional

# Importamos el schema del carrito que ya tenías
from . import cart_schemas 

# --- INICIO DE LO NUEVO ---
# Este es el molde para cuando el usuario paga con tarjeta directamente en tu web (Checkout API)
class ApiPaymentRequest(BaseModel):
    token: str                 # El card_token que te da el SDK de MP en el frontend
    payment_method_id: str     # ej: "visa", "master"
    installments: int            # Cantidad de cuotas
    payer_email: EmailStr      # El email del comprador
    cart: cart_schemas.Cart    # El carrito completo para verificar precios y stock en el backend

# Una respuesta estándar para el pago por API
class ApiResponse(BaseModel):
    status: str
    message: str
    order_id: Optional[int] = None
    payment_id: Optional[str] = None