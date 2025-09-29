# ==========================================
#  IMPORTS ORDENADOS PARA MÁS PROLIJIDAD
# ==========================================
from typing import List, Optional

# Terceros (FastAPI, SQLAlchemy, etc.)
from fastapi import (
    APIRouter, Depends, HTTPException, Query, status, 
    File, UploadFile, Form
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

# Módulos de tu aplicación
from database.database import get_db
from database.models import VarianteProducto, Producto
from schemas import product_schemas, user_schemas
from services import auth_services, cloudinary_service


router = APIRouter(
    prefix="/api/products",
    tags=["Products"]
)

# =======================================================================
# VERSIÓN ÚNICA Y FUNCIONAL DE GET_PRODUCTS (SIN DUPLICADOS)
# =======================================================================
@router.get("/", response_model=List[product_schemas.Product], summary="Obtener una lista filtrada de productos")
async def get_products(
    db: AsyncSession = Depends(get_db), 
    q: Optional[str] = Query(None, description="Término de búsqueda para nombre"),
    precio_min: Optional[float] = Query(None, ge=0),
    precio_max: Optional[float] = Query(None, ge=0),
    categoria_id: Optional[str] = Query(None, description="IDs de categoría separados por comas (ej: 1,3,5)"), 
    talle: Optional[str] = Query(None, description="Talles separados por comas (ej: S,M,L)"), 
    color: Optional[str] = Query(None, description="Colores separados por comas (ej: Rojo,Azul)"), 
    skip: int = Query(0, ge=0), 
    limit: int = Query(12, ge=1, le=100),
    sort_by: Optional[str] = Query(None, description="Opciones: precio_asc, precio_desc, nombre_asc, nombre_desc")
):
    query = select(Producto).options(joinedload(Producto.variantes))

    if q: query = query.filter(Producto.nombre.ilike(f"%{q}%"))
    if precio_min is not None: query = query.where(Producto.precio >= precio_min)
    if precio_max is not None: query = query.where(Producto.precio <= precio_max)
    
    if categoria_id:
        try:
            id_list = [int(i.strip()) for i in categoria_id.split(',')]
            query = query.where(Producto.categoria_id.in_(id_list))
        except ValueError:
            raise HTTPException(status_code=400, detail="El formato de 'categoria_id' es inválido. Deben ser números separados por comas.")

    # Lógica mejorada para evitar joins duplicados
    needs_variant_join = False
    if talle:
        talles = [t.strip() for t in talle.split(',')]
        query = query.join(Producto.variantes).filter(VarianteProducto.tamanio.in_(talles))
        needs_variant_join = True # Marcamos que ya hicimos el join
    
    if color:
        colors = [c.strip() for c in color.split(',')]
        if not needs_variant_join:
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

# =======================================================================
# ENDPOINT QUE FALTABA PARA OBTENER UN SOLO PRODUCTO
# =======================================================================
@router.get("/{product_id}", response_model=product_schemas.Product, summary="Obtener un producto por su ID")
async def get_product_by_id(
    product_id: int, 
    db: AsyncSession = Depends(get_db)
):
    query = select(Producto).options(
        joinedload(Producto.variantes)
    ).where(Producto.id == product_id)
    
    result = await db.execute(query)
    product = result.scalars().unique().first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Producto con ID {product_id} no encontrado"
        )
    return product

# =======================================================================
# ENDPOINTS DE ADMIN (YA ESTABAN BIEN, SOLO SE AGREGAN SUMMARIES)
# =======================================================================
@router.post("/", response_model=product_schemas.Product, status_code=status.HTTP_201_CREATED, summary="Crear un nuevo producto (Solo Admins)")
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
async def update_product(
    product_id: int, 
    product_in: product_schemas.ProductUpdate, 
    db: AsyncSession = Depends(get_db), 
    current_admin: user_schemas.UserOut = Depends(auth_services.get_current_admin_user)
):
    product_db = await db.get(Producto, product_id)
    if not product_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    
    update_data = product_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product_db, key, value)
    
    db.add(product_db)
    await db.commit()
    await db.refresh(product_db) # Hacemos refresh sobre el objeto que ya tenemos
    
    return product_db


@router.delete("/{product_id}", status_code=status.HTTP_200_OK, summary="Eliminar un producto (Solo Admins)")
async def delete_product(
    product_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_admin: user_schemas.UserOut = Depends(auth_services.get_current_admin_user)
):
    product_db = await db.get(Producto, product_id)
    if not product_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    # SQLAlchemy se encarga de borrar en cascada si está bien configurado en el modelo
    await db.delete(product_db)
    await db.commit()
    
    return {"message": "Producto eliminado exitosamente"}


@router.post("/{product_id}/variants", response_model=product_schemas.VarianteProducto, status_code=status.HTTP_201_CREATED, summary="Añadir una variante a un producto (Solo Admins)")
async def create_variant_for_product(
    product_id: int,
    variant_in: product_schemas.VarianteProductoCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: user_schemas.UserOut = Depends(auth_services.get_current_admin_user)
):
    product = await db.get(Producto, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    variant_data = variant_in.model_dump()
    new_variant = VarianteProducto(producto_id=product_id, **variant_data)
    
    db.add(new_variant)
    await db.commit()
    await db.refresh(new_variant)
    
    return new_variant