from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from schemas import checkout_schemas # Reutilizamos el schema de ShippingAddress
from database.database import get_db
from database.models import Orden
from services.auth_services import get_current_user
from schemas.user_schemas import UserOut

router = APIRouter(
    prefix="/api/user",
    tags=["User"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/address", response_model=checkout_schemas.ShippingAddress, summary="Obtener la última dirección de envío del usuario")
async def get_last_shipping_address(db: AsyncSession = Depends(get_db), current_user: UserOut = Depends(get_current_user)):
    """
    Busca la orden más reciente del usuario que tenga una dirección de envío guardada y la devuelve.
    """
    result = await db.execute(
        select(Orden.direccion_envio)
        .where(Orden.usuario_id == str(current_user.id))
        .where(Orden.direccion_envio.isnot(None))
        .order_by(Orden.creado_en.desc())
        .limit(1)
    )
    last_address = result.scalar_one_or_none()

    if not last_address:
        raise HTTPException(status_code=404, detail="No se encontraron direcciones de envío anteriores.")

    return last_address
