# En backend/schemas/product_schemas.py

from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import List, Optional, Annotated
from bson import ObjectId

# --- Este es el traductor mágico para que Pydantic entienda el _id de Mongo ---
PyObjectId = Annotated[str, BeforeValidator(str)]

class VarianteProducto(BaseModel):
    id: int # Asumimos que las variantes sí tienen un ID numérico simple
    producto_id: int
    tamanio: str
    color: str
    cantidad_en_stock: int

    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    sku: str
    urls_imagenes: Optional[List[str]] = []
    material: Optional[str] = None
    talle: Optional[str] = None
    color: Optional[str] = None
    stock: int = Field(..., ge=0)
    categoria_id: int
    variantes: List[VarianteProducto] = []


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    sku: Optional[str] = None
    urls_imagenes: Optional[List[str]] = None
    material: Optional[str] = None
    talle: Optional[str] = None
    color: Optional[str] = None
    stock: Optional[int] = Field(None, ge=0)
    categoria_id: Optional[int] = None


# --- ACÁ ESTÁ EL CAMBIO CLAVE ---
# Esta es la plantilla para mostrar un producto de MongoDB
class Product(ProductBase):
    # Le decimos que el campo "_id" de mongo lo mapee a "id" como un string
    id: PyObjectId = Field(alias="_id", default=None)

    model_config = ConfigDict(
        populate_by_name=True,  # Permite usar el alias "_id"
        arbitrary_types_allowed=True, # Necesario para ObjectId
        json_encoders={ObjectId: str} # Le dice cómo convertir el ObjectId a texto
    )

class Categoria(BaseModel):
    id: int
    nombre: str

    model_config = ConfigDict(from_attributes=True)