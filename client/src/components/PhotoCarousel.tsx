import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { PhotoCarousel as PhotoCarouselType } from "@shared/schema";
import { processTextWithGradient } from "@/utils/textGradient";

export default function PhotoCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Buscar fotos do carrossel
  const { data: photos = [], isLoading } = useQuery<PhotoCarouselType[]>({
    queryKey: ["/api/photo-carousel"],
    queryFn: async () => {
      const response = await fetch("/api/photo-carousel");
      return response.json();
    },
  });

  // Buscar configurações da seção
  const { data: configs } = useQuery({
    queryKey: ["/api/admin/config"],
    queryFn: async () => {
      const response = await fetch("/api/admin/config");
      return response.json();
    },
  });

  const carouselSection = configs?.find((c: any) => c.key === 'gallery_section')?.value as any || {};

  const activePhotos = photos.filter(photo => photo.isActive);

  // Auto play do carrossel
  useEffect(() => {
    if (isAutoPlaying && activePhotos.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % activePhotos.length);
      }, 6000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, activePhotos.length]);

  // Pausar auto play quando mouse está sobre o carrossel
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  // Navegação manual
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activePhotos.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + activePhotos.length) % activePhotos.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  // Touch/swipe para mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;

    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  if (isLoading || activePhotos.length === 0) {
    return null;
  }

  return (
    <section 
      id="photo-carousel" 
      className="py-4 sm:py-6 bg-gradient-to-br from-gray-50 to-white"
      ref={sectionRef}
    >
      <div className="container mx-auto mobile-container max-w-7xl">
        {/* Título da seção */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span className="text-sm font-medium text-purple-600 bg-purple-100 px-4 py-2 rounded-full">
              {carouselSection.badge || "GALERIA"}
            </span>
          </div>
          <h2 className="font-display font-medium text-2xl sm:text-3xl md:text-4xl text-gray-900 mb-6 tracking-tight">
            {processTextWithGradient(carouselSection.title || "Galeria")}
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed font-light">
            {carouselSection.subtitle || "Um espaço pensado especialmente para seu bem-estar e conforto durante as consultas"}
          </p>
        </div>

        {/* Carrossel */}
        <div 
          className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl bg-white"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative h-96 md:h-[500px] lg:h-[600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.25, 0.1, 0.25, 1],
                  opacity: { duration: 0.3 }
                }}
                className="absolute inset-0"
              >
                <img
                  src={activePhotos[currentSlide]?.imageUrl}
                  alt={activePhotos[currentSlide]?.title}
                  className="w-full h-full object-cover"
                />

                {/* Overlay de texto */}
                {activePhotos[currentSlide]?.showText && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          delay: 0.15, 
                          duration: 0.4,
                          ease: [0.25, 0.1, 0.25, 1]
                        }}
                        className="text-white"
                      >
                        <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
                          {activePhotos[currentSlide]?.title}
                        </h3>
                        {activePhotos[currentSlide]?.description && (
                          <p className="text-lg md:text-xl text-gray-200 max-w-2xl leading-relaxed">
                            {activePhotos[currentSlide]?.description}
                          </p>
                        )}
                      </motion.div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Setas de navegação */}
          {activePhotos.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-10"
                aria-label="Foto anterior"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-10"
                aria-label="Próxima foto"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Indicadores (bolinhas) */}
          {activePhotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
              {activePhotos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "bg-white scale-125"
                      : "bg-white/50 hover:bg-white/75"
                  }`}
                  aria-label={`Ir para foto ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}