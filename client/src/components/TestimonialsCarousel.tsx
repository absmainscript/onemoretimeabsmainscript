/**
 * TestimonialsCarousel.tsx
 * 
 * Carrossel de depoimentos dos clientes da psicóloga
 * Funcionalidades: autoplay, navegação manual, animações suaves
 * Contém avatares personalizados para cada tipo de terapia
 */

import { motion } from "framer-motion"; // Animações suaves
import { ChevronLeft, ChevronRight, Star } from "lucide-react"; // Ícones
import { useEffect, useRef, useState } from "react"; // Hooks do React
import { TestimonialAvatar } from "./Avatar"; // Avatar dos depoimentos
import { useQuery } from "@tanstack/react-query"; // Query para dados do servidor
import type { Testimonial } from "@shared/schema"; // Tipo dos depoimentos
import { processTextWithGradient } from "@/utils/textGradient"; // Processa texto com gradiente

// Busca depoimentos do banco de dados



export default function TestimonialsCarousel() {
  // Sempre chamar hooks na mesma ordem
  // busca depoimentos do banco de dados
  const { data: testimonials = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
  });

  // Buscar configurações da seção depoimentos
  const { data: configs } = useQuery({
    queryKey: ["/api/admin/config"],
    queryFn: async () => {
      const response = await fetch("/api/admin/config");
      return response.json();
    },
  });

  // Extrair configurações da seção depoimentos
  const testimonialsSection = configs?.find((c: any) => c.key === 'testimonials_section')?.value as any || {};

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isAutoPlaying && testimonials.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % testimonials.length);
      }, 4000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, testimonials.length]);

  // Initialize autoplay when testimonials load
  useEffect(() => {
    if (testimonials.length > 1) {
      setIsAutoPlaying(true);
    }
  }, [testimonials]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  // Touch handlers for swipe functionality
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  // Conditional returns after all hooks
  if (isLoading) {
    return (
      <section className="section-spacing bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100">
        <div className="mobile-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-800 mb-4">
              Carregando depoimentos...
            </h2>
          </div>
        </div>
      </section>
    );
  }

  if (!testimonials.length) {
    return null;
  }

  return (
    <section id="testimonials" className="py-4 sm:py-6 bg-white" ref={ref}>
      <div className="container mx-auto mobile-container max-w-7xl">
        {/* Título e descrição da seção */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-sm font-medium text-purple-600 bg-purple-100 px-4 py-2 rounded-full">
              {testimonialsSection.badge || "DEPOIMENTOS"}
            </span>
          </div>
          <h2 className="font-display font-medium text-3xl sm:text-4xl md:text-5xl text-gray-900 mb-6 tracking-tight">
            {processTextWithGradient(testimonialsSection.title || "Histórias de (transformação)")}
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed font-light">
            {testimonialsSection.subtitle || "Experiências reais de pessoas que encontraram equilíbrio e bem-estar através do acompanhamento psicológico"}
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto px-2 sm:px-4 md:px-8">
          <div
            className="overflow-hidden"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <motion.div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={index} className="w-full flex-shrink-0">
                  <div className="bg-white p-6 sm:p-8 rounded-2xl text-center mx-2 sm:mx-4 border border-gray-200 hover:-translate-y-1 transition-all duration-300 shadow-subtle shadow-subtle-hover">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 flex items-center justify-center">
                      {testimonial.photo ? (
                        <img 
                          src={testimonial.photo} 
                          alt={testimonial.name} 
                          className="w-full h-full rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <TestimonialAvatar gender={testimonial.gender as "maria" | "male" | "couple" | "childtherapy" | "darthvader"} />
                      )}
                    </div>
                    <div className="flex justify-center mb-4">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="fill-current" size={16} />
                        ))}
                      </div>
                    </div>
                    <blockquote className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 font-normal">
                      "{testimonial.testimonial}"
                    </blockquote>
                    <cite className="text-gray-800 font-semibold text-sm sm:text-base">{testimonial.name}</cite>
                    <div className="text-xs sm:text-sm text-gray-500 mt-1">{testimonial.service}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={prevSlide}
            className="absolute -left-2 sm:left-0 md:-left-12 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-pink-500 transition-colors border border-gray-200 shadow-subtle shadow-subtle-hover z-10"
          >
            <ChevronLeft size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute -right-2 sm:right-0 md:-right-12 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-pink-500 transition-colors border border-gray-200 shadow-subtle shadow-subtle-hover z-10"
          >
            <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
          </button>

          {/* Dot indicators */}
          <div className="flex justify-center space-x-3 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? "bg-pink-500 scale-125 shadow-lg" 
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Ir para depoimento ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}