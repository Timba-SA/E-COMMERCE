# En backend/routers/products_router.py

from fastapi import (
    APIRouter, Depends, HTTPException, Query, status, 
    File, UploadFile, Form
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import joinedload
from typing import List, Optional

from database.models import VarianteProducto, Producto, Categoria
from services import auth_services, cloudinary_service
from schemas import product_schemas, user_schemas
from database.database import get_db


router = APIRouter(
    prefix="/api/products",
    tags=["Products"]
)

@router.get("/", response_model=List[product_schemas.Product])
async def get_products(
    db: AsyncSession = Depends(get_db), 
    q: Optional[str] = Query(None, description="Término de búsqueda general para nombre y descripción"),
    material: Optional[str] = Query(None), 
    precio_min: Optional[float] = Query(None),
    precio_max: Optional[float] = Query(None),
    # ===================== CAMBIO 1: ACÁ ESTÁ LA MAGIA =====================
    # Le decimos que categoria_id puede ser una LISTA de enteros (List[int])
    categoria_id: Optional[List[int]] = Query(None), 
    # ======================================================================
    talle: Optional[str] = Query(None), 
    color: Optional[str] = Query(None), 
    skip: int = Query(0, ge=0), 
    limit: int = Query(12, ge=1, le=100), # Cambiado a 12 para que coincida con el frontend
    sort_by: Optional[str] = Query(None)
):
    query = select(Producto).options(joinedload(Producto.variantes))

    if q:
        search_term = f"%{q}%"
        query = query.filter(Producto.nombre.ilike(search_term))
    
    if material: query = query.where(Producto.material.ilike(f"%{material}%"))
    if precio_min is not None: query = query.where(Producto.precio >= precio_min)
    if precio_max is not None: query = query.where(Producto.precio <= precio_max)
    
    # ===================== CAMBIO 2: Y ACÁ LA APLICAMOS =====================
    # Usamos '.in_' para que SQLAlchemy busque productos cuya categoría esté EN LA LISTA de IDs
    if categoria_id: query = query.where(Producto.categoria_id.in_(categoria_id))
    # =======================================================================
    
    if talle: 
        talles = [t.strip() for t in talle.split(',')]
        query = query.join(Producto.variantes).filter(VarianteProducto.tamanio.in_(talles))

    if color:
        colors = [c.strip() for c in color.split(',')]
        if not talle: # Evita hacer el join dos veces si ya se hizo por talle
              query = query.join(Producto.variantes)
        query = query.filter(VarianteProducto.color.in_(colors))

    if sort_by:
        if sort_by == "precio_asc": query = query.order_by(Producto.precio.asc())
        elif sort_by == "precio_desc": query = query.order_by(Producto.precio.desc())
        elif sort_by == "nombre_asc": query = query.order_by(Producto.nombre.asc())
        elif sort_by == "nombre_desc": query = query.order_by(Producto.nombre.desc())
        
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    products = result.scalars().unique().all()
    return products

# ... (el resto de tus endpoints quedan exactamente igual, no hace falta tocarlos) ...

@router.get("/", response_model=List[product_schemas.Product])
async def get_products(
    db: AsyncSession = Depends(get_db), 
    q: Optional[str] = Query(None),
    material: Optional[str] = Query(None), 
    precio_min: Optional[float] = Query(None),
    precio_max: Optional[float] = Query(None),
    # ===================== ARREGLO A LO RAMBO =====================
    # 1. Recibimos la categoría como un simple string de texto (str)
    categoria_id: Optional[str] = Query(None), 
    # ==============================================================
    talle: Optional[str] = Query(None), 
    color: Optional[str] = Query(None), 
    skip: int = Query(0, ge=0), 
    limit: int = Query(12, ge=1, le=100),
    sort_by: Optional[str] = Query(None)
):
    query = select(Producto).options(joinedload(Producto.variantes))

    # ... (los otros filtros de q, material, precio, etc. quedan igual) ...
    if q: query = query.filter(Producto.nombre.ilike(f"%{q}%"))
    if material: query = query.where(Producto.material.ilike(f"%{material}%"))
    if precio_min is not None: query = query.where(Producto.precio >= precio_min)
    if precio_max is not None: query = query.where(Producto.precio <= precio_max)
    
    # ===================== ARREGLO A LO RAMBO =====================
    # 2. Si recibimos el string, lo convertimos a mano en una lista de números
    if categoria_id:
        try:
            # Partimos el string por las comas y convertimos cada pedazo a int
            id_list = [int(i.strip()) for i in categoria_id.split(',')]
            query = query.where(Producto.categoria_id.in_(id_list))
        except ValueError:
            # Si la conversión falla, tiramos un error claro
            raise HTTPException(status_code=400, detail="El formato de categoria_id es inválido.")
    # ===============================================================
    
    # ... (el resto de los filtros de talle, color, etc. quedan igual) ...
    if talle: 
        talles = [t.strip() for t in talle.split(',')]
        query = query.join(Producto.variantes).filter(VarianteProducto.tamanio.in_(talles))

    if color:
        colors = [c.strip() for c in color.split(',')]
        if not talle:
              query = query.join(Producto.variantes)
        query = query.filter(VarianteProducto.color.in_(colors))

    if sort_by:
        if sort_by == "precio_asc": query = query.order_by(Producto.precio.asc())
        elif sort_by == "precio_desc": query = query.order_by(Producto.precio.desc())
        elif sort_by == "nombre_asc": query = query.order_by(Producto.nombre.asc())
        elif sort_by == "nombre_desc": query = query.order_by(Producto.nombre.desc())
        
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    products = result.scalars().unique().all()
    return products

@router.post(
    "/{product_id}/variants", 
    response_model=product_schemas.VarianteProducto, 
    status_code=status.HTTP_201_CREATED,
    summary="Añadir una nueva variante a un producto (Solo Admins)"
)
async def create_variant_for_product(
    product_id: int,
    variant_in: product_schemas.VarianteProducto,
    db: AsyncSession = Depends(get_db),
    current_admin: user_schemas.UserOut = Depends(auth_services.get_current_admin_user)
):
    product = await db.get(Producto, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    variant_data = variant_in.model_dump()
    variant_data['producto_id'] = product_id

    new_variant = VarianteProducto(**variant_data)
    db.add(new_variant)
    await db.commit()
    await db.refresh(new_variant)
    return new_variant

@router.post("/", response_model=product_schemas.Product, status_code=status.HTTP_201_CREATED, summary="Crear un nuevo producto con imágenes (Solo Admins)")
async def create_product(
    nombre: str = Form(...),
    descripcion: Optional[str] = Form(None),
    precio: float = Form(...),
    sku: str = Form(...),
    stock: int = Form(...),
    categoria_id: int = Form(...),
    material: Optional[str] = Form(None),
    talle: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    images: List[UploadFile] = File(..., description="Hasta 3 imágenes del producto"),
    db: AsyncSession = Depends(get_db),
    current_admin: user_schemas.UserOut = Depends(auth_services.get_current_admin_user)
):
    existing_product_sku = await db.execute(select(Producto).filter(Producto.sku == sku))
    if existing_product_sku.scalars().first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Ya existe un producto con el SKU: {sku}")

    if len(images) > 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Se pueden subir como máximo 3 imágenes.")

    image_urls = []
    if images and images[0].filename:
        image_urls = await cloudinary_service.upload_images(images)

    product_data = product_schemas.ProductCreate(
        nombre=nombre, descripcion=descripcion, precio=precio, sku=sku,
        stock=stock, categoria_id=categoria_id, material=material,
        talle=talle, color=color, urls_imagenes=image_urls
    )

    new_product = Producto(**product_data.model_dump())
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)

    if talle and stock > 0:
        default_variant = VarianteProducto(
            producto_id=new_product.id, tamanio=talle,
            color=color or "default", cantidad_en_stock=stock
        )
        db.add(default_variant)
        await db.commit()

    query = select(Producto).options(joinedload(Producto.variantes)).filter(Producto.id == new_product.id)
    result = await db.execute(query)
    created_product = result.scalars().unique().first()
    return created_product

@router.put("/{product_id}", response_model=product_schemas.Product, summary="Actualizar un producto (Solo Admins)")
async def update_product(product_id: int, product_in: product_schemas.ProductUpdate, db: AsyncSession = Depends(get_db), current_admin: user_schemas.UserOut = Depends(auth_services.get_current_admin_user)):
    product_db = await db.get(Producto, product_id)
    if not product_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    
    update_data = product_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product_db, key, value)
    
    db.add(product_db)
    await db.commit()

    query = select(Producto).options(joinedload(Producto.variantes)).filter(Producto.id == product_id)
    result = await db.execute(query)
    updated_product = result.scalars().unique().first()
    return updated_product

@router.delete("/{product_id}", status_code=status.HTTP_200_OK, summary="Eliminar un producto y sus variantes (Solo Admins)")
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db), current_admin: user_schemas.UserOut = Depends(auth_services.get_current_admin_user)):
    result = await db.execute(
        select(Producto).options(joinedload(Producto.variantes)).where(Producto.id == product_id)
    )
    product_db = result.scalars().first()

    if not product_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    for variant in product_db.variantes:
        await db.delete(variant)
    
    await db.delete(product_db)
    await db.commit()
    
    return {"message": "Producto y sus variantes eliminados exitosamente"}