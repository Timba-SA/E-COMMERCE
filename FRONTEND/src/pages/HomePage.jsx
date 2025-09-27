import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getProducts } from '../api/productsApi'; // 1. Importar la nueva API
import ProductCard from '../components/products/ProductCard'; // 2. Importar el nuevo componente

gsap.registerPlugin(ScrollTrigger);

const HomePage = () => {
  const [products, setProducts] = useState([]); // 3. Estado simplificado

  // Efecto para buscar productos y animar la entrada de la sección
  useEffect(() => {
    const fetchAndAnimate = async () => {
      try {
        // Usamos la nueva función para traer 6 productos
        const fetchedProducts = await getProducts({ limit: 6 }); 
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error al cargar los productos:", error);
      }
    };

    fetchAndAnimate();

    // La animación de entrada de la sección no cambia
    gsap.to(".new-arrivals", {
      opacity: 1,
      y: 0,
      duration: 1.5,
      delay: 0.5
    });
  }, []);

  // Efecto para animar las tarjetas de producto cuando los datos están listos
  useEffect(() => {
    if (products.length > 0) {
      gsap.fromTo(".product-card",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".product-grid",
            start: "top 80%",
          }
        }
      );
    }
  }, [products]); // Se dispara cuando el estado de `products` cambia

  return (
    <main>
      <section className="hero-section">
        <div className="hero-image-left">
          <img src="/img/PortadaIzquierda.jpg" alt="Modelo con prenda vanguardista" />
        </div>
        <div className="hero-image-right">
          <img src="/img/PortadaDerecha.jpg" alt="Modelo con traje sastre oscuro" />
        </div>
      </section>

      <section className="new-arrivals">
        <div className="section-title-container">
            <h2 className="section-title">New Arrivals</h2>
            <div className="title-line"></div>
        </div>

        <div className="product-grid">
          {products.map(product => (
            // 4. Usar el componente reutilizable ProductCard
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
};

export default HomePage;
