# En routers/checkout_router.py

import mercadopago
import os
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

# --- Nuestros Módulos ---
from database.database import get_db
from database.models import Orden, DetalleOrden, VarianteProducto, Producto
from schemas import cart_schemas, checkout_schemas  # <-- Schema actualizado
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURACIÓN ---
router = APIRouter(prefix="/api/checkout", tags=["Checkout Híbrido"])
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

sdk = mercadopago.SDK(os.getenv("MERCADOPAGO_TOKEN"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

# --- FUNCIÓN HELPER CLAVE (El Cerebro) ---
async def save_order_and_update_stock(
    db: AsyncSession, 
    usuario_id: str, 
    monto_total: float, 
    payment_id: str, 
    items_comprados: list,
    metodo_pago: str
):
    """
    Crea la orden en la base de datos y descuenta el stock. Es ATÓMICA.
    O todo funciona, o nada se guarda.
    """
    try:
        new_order = Orden(
            usuario_id=usuario_id, monto_total=monto_total, estado="Completado",
            estado_pago="Aprobado", metodo_pago=metodo_pago,
            payment_id_mercadopago=payment_id
        )
        db.add(new_order)
        await db.flush()

        for item in items_comprados:
            # Normalizamos el item, ya que viene de dos fuentes distintas
            variante_id = int(item.get("id") or item.get("variante_id"))
            cantidad_comprada = int(item.get("quantity"))
            precio_unitario = float(item.get("unit_price") or item.get("price"))

            db.add(DetalleOrden(
                orden_id=new_order.id, variante_producto_id=variante_id,
                cantidad=cantidad_comprada, precio_en_momento_compra=precio_unitario
            ))

            result = await db.execute(
                select(VarianteProducto).where(VarianteProducto.id == variante_id).with_for_update()
            )
            variante_producto = result.scalars().first()
            
            if not variante_producto or variante_producto.cantidad_en_stock < cantidad_comprada:
                raise Exception(f"Stock insuficiente para la variante ID {variante_id}")
            
            variante_producto.cantidad_en_stock -= cantidad_comprada
        
        await db.commit()
        logger.info(f"Orden {new_order.id} guardada y stock actualizado exitosamente.")
        return new_order.id

    except Exception as e:
        logger.error(f"Error CRÍTICO al guardar la orden: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al procesar la orden: {str(e)}")


# --- ENDPOINT 1: CHECKOUT PRO (Botón "Pagar con Mercado Pago") ---
@router.post("/create-preference", summary="Crea preferencia para redirigir a MP")
async def create_preference(cart: cart_schemas.Cart, db: AsyncSession = Depends(get_db)):
    # ... (Esta lógica es idéntica a la que ya tenías, la dejamos igual porque es sólida)
    if not cart.items:
        raise HTTPException(status_code=400, detail="El carrito está vacío.")
    
    items_for_preference = []
    for item in cart.items:
        variant = await db.get(VarianteProducto, item.variante_id)
        if not variant or variant.cantidad_en_stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para el producto.")
        
        items_for_preference.append({
            "id": str(item.variante_id), "title": item.name,
            "quantity": item.quantity, "unit_price": item.price,
            "currency_id": "ARS"
        })

    external_reference = cart.user_id or cart.guest_session_id

    preference_data = {
        "items": items_for_preference,
        "back_urls": {"success": f"{FRONTEND_URL}/payment/success"},
        "notification_url": f"{BACKEND_URL}/api/checkout/webhook",
        "external_reference": str(external_reference)
    }
    
    try:
        preference_response = sdk.preference().create(preference_data)
        preference = preference_response["response"]
        return {"preference_id": preference.get("id"), "init_point": preference.get("init_point")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear preferencia de MP: {e}")


# --- ENDPOINT 2: CHECKOUT API (Formulario de Tarjeta en tu página) ---
@router.post("/process-payment-api", response_model=checkout_schemas.ApiResponse, summary="Procesa un pago directo vía API")
async def process_payment_api(request_data: checkout_schemas.ApiPaymentRequest, db: AsyncSession = Depends(get_db)):
    if not request_data.cart.items:
        raise HTTPException(status_code=400, detail="El carrito está vacío.")

    # 1. PARANOIA ES SEGURIDAD: NUNCA confíes en el monto del frontend. Lo recalculamos acá.
    transaction_amount = 0
    for item in request_data.cart.items:
        variant = await db.get(VarianteProducto, item.variante_id, options=[joinedload(VarianteProducto.producto)])
        if not variant or variant.cantidad_en_stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {item.name}")
        transaction_amount += float(variant.producto.precio) * item.quantity
    
    payment_data = {
        "transaction_amount": round(transaction_amount, 2), "token": request_data.token,
        "installments": request_data.installments, "payment_method_id": request_data.payment_method_id,
        "payer": {"email": request_data.payer_email},
        "external_reference": request_data.cart.user_id or request_data.cart.guest_session_id
    }

    try:
        payment_response = sdk.payment().create(payment_data)
        payment = payment_response.get("response", {})

        if payment.get("status") == "approved":
            # 2. PAGO APROBADO: Guardamos la orden INMEDIATAMENTE. No hay webhook acá.
            order_id = await save_order_and_update_stock(
                db=db, usuario_id=payment.get("external_reference"),
                monto_total=payment.get("transaction_amount"), payment_id=str(payment.get("id")),
                items_comprados=[item.model_dump() for item in request_data.cart.items],
                metodo_pago="Tarjeta (API)"
            )
            return {"status": "approved", "message": "Pago aprobado y orden creada.", "order_id": order_id, "payment_id": str(payment.get("id"))}
        else:
            error_detail = payment.get('status_detail', 'Pago no aprobado.')
            raise HTTPException(status_code=400, detail=f"Pago no aprobado: {error_detail}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el pago: {e}")


# --- ENDPOINT 3: WEBHOOK (Receptor de notificaciones de Checkout Pro) ---
@router.post("/webhook", summary="Receptor de notificaciones de Mercado Pago")
async def mercadopago_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    # ... (Esta lógica también es la que ya tenías y es sólida, la reutilizamos)
    data = await request.json()
    if data.get("type") == "payment":
        payment_id = data.get("data", {}).get("id")
        if not payment_id: return {"status": "ok"}

        existing_order = await db.execute(select(Orden).filter(Orden.payment_id_mercadopago == str(payment_id)))
        if existing_order.scalars().first():
            return {"status": "ok", "reason": "Ya fue procesado"}

        payment_info_response = sdk.payment().get(payment_id)
        payment_info = payment_info_response["response"]

        if payment_info["status"] == "approved":
            await save_order_and_update_stock(
                db=db, usuario_id=payment_info.get("external_reference"),
                monto_total=payment_info.get("transaction_amount"), payment_id=str(payment_id),
                items_comprados=payment_info.get("additional_info", {}).get("items", []),
                metodo_pago="Mercado Pago"
            )
    return {"status": "ok"}