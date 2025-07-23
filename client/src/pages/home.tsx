/**
 * home.tsx
 * 
 * Página principal do site da psicóloga
 * Organiza todas as seções em uma single-page application
 * Layout: Header -> Hero -> About -> Services -> Quotes -> Testimonials -> FAQ -> Contact -> Footer
 * Controla botão "voltar ao topo" baseado na posição do scroll
 */

import React, { useState, useEffect, useRef } from "react"; // Controle do botão scroll to top
import { ChevronUp } from "lucide-react"; // Ícone do botão voltar ao topo
import Navigation from "@/components/Navigation"; // Menu de navegação fixo
import HeroSection from "@/components/HeroSection"; // Seção principal com CTA
import AboutSection from "@/components/AboutSection"; // Sobre a psicóloga
import ServicesSection from "@/components/ServicesSection"; // Serviços oferecidos
import SpecialtiesSection from "@/components/SpecialtiesSection"; // Especialidades
import InspirationalQuotes from "@/components/InspirationalQuotes"; // Frases inspiracionais
import TestimonialsCarousel from "@/components/TestimonialsCarousel"; // Depoimentos
import FAQSection from "@/components/FAQSection"; // Perguntas frequentes
import ContactSection from "@/components/ContactSection"; // Informações de contato
import Footer from "@/components/Footer"; // Rodapé com links
import PhotoCarousel from "@/components/PhotoCarousel"; // Carrossel de fotos
import { useSectionVisibility } from "@/hooks/useSectionVisibility"; // Hook para controlar visibilidade das seções
import { useQuery } from "@tanstack/react-query"; // Hook para buscar dados da API
import { apiRequest } from "@/lib/queryClient";
import MaintenancePage from "@/components/MaintenancePage";
import MarketingPixels from "@/components/MarketingPixels";

// Componente principal da página home
export default function Home() {
  // Verifica modo de manutenção usando endpoint público
  const { data: maintenanceCheck } = useQuery({
    queryKey: ["/api/maintenance-check"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/maintenance-check");
      return response.json();
    },
    staleTime: 30000, // Cache por 30 segundos
  });

  const [showBackToTop, setShowBackToTop] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);

  // Hook para controlar visibilidade das seções
  const {
    isHeroVisible,
    isAboutVisible,
    isServicesVisible,
    isTestimonialsVisible,
    isFaqVisible,
    isContactVisible,
    isPhotoCarouselVisible,
    isSpecialtiesVisible
  } = useSectionVisibility();

  // Buscar ordem das seções
  const { data: configs } = useQuery({
    queryKey: ["/api/admin/config"],
    staleTime: 5 * 60 * 1000,
  });

  const orderConfig = Array.isArray(configs) ? 
    configs.find((c: any) => c.key === 'sections_order')?.value as any || {} : 
    {};

  // Definir seções ordenáveis com seus componentes
  const sections = [
    {
      key: 'hero',
      component: <HeroSection />,
      visible: isHeroVisible,
      order: orderConfig.hero ?? 0
    },
    {
      key: 'about', 
      component: <AboutSection />,
      visible: isAboutVisible,
      order: orderConfig.about ?? 1
    },
    {
      key: 'services',
      component: <ServicesSection />,
      visible: isServicesVisible, 
      order: orderConfig.services ?? 2
    },
    {
      key: 'testimonials',
      component: <TestimonialsCarousel />,
      visible: isTestimonialsVisible,
      order: orderConfig.testimonials ?? 3
    },
    {
      key: 'faq',
      component: <FAQSection />,
      visible: isFaqVisible,
      order: orderConfig.faq ?? 4
    },
    {
      key: 'contact',
      component: <ContactSection />,
      visible: isContactVisible,
      order: orderConfig.contact ?? 5
    },
    {
      key: 'photo-carousel',
      component: <PhotoCarousel />,
      visible: isPhotoCarouselVisible,
      order: orderConfig['photo-carousel'] ?? 3.5
    },
    {
      key: 'specialties',
      component: <SpecialtiesSection />,
      visible: isSpecialtiesVisible,
      order: orderConfig.specialties ?? 2.5
    },
    {
      key: 'inspirational',
      component: <InspirationalQuotes />,
      visible: true, // Make InspirationalQuotes visible by default
      order: orderConfig.inspirational ?? 6
    }
  ].sort((a, b) => a.order - b.order);

  useEffect(() => {
    const handleScroll = () => {
      if (!footerRef.current) return;

      const footerRect = footerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;

      // Botão aparece apenas quando:
      // 1. Footer começou a aparecer na tela (top < windowHeight)
      // 2. Usuário rolou significativamente (mais que 500px)
      // 3. Não está no topo da página
      const footerStartedAppearing = footerRect.top < windowHeight;
      const scrolledEnough = scrollY > 500;
      const notAtTop = scrollY > 100;

      setShowBackToTop(footerStartedAppearing && scrolledEnough && notAtTop);
    };

    // Inicialização: garantir que o botão não apareça no carregamento
    setShowBackToTop(false);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  // Verifica se o modo de manutenção está ativo
  const isMaintenanceMode = maintenanceCheck?.maintenance?.enabled || false;

  // Se o modo de manutenção estiver ativo, exibe apenas a página de manutenção
  if (isMaintenanceMode) {
    return (
      <>
        <MarketingPixels />
        <MaintenancePage />
      </>
    );
  }

  return (
    // Container principal com fonte e overflow controlado
    <div className="font-sans text-gray-800 overflow-x-hidden">
      <div className="w-full">
        {/* Navegação fixa no topo - sempre visível */}
        <Navigation />

        {/* Seções dinâmicas ordenadas pelo admin */}
        {sections.map((section) => 
          section.visible ? (
            <div key={section.key} className="w-full mb-12 sm:mb-16 lg:mb-20">
              {section.component}
            </div>
          ) : null
        )}

        {/* Rodapé - informações finais */}
        <div ref={footerRef}>
          <Footer />
        </div>

        {/* Botão voltar ao topo - aparece apenas quando footer está visível */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-24 right-6 z-50 bg-white/90 backdrop-blur-sm p-3 rounded-full text-gray-700 hover:text-purple-600 hover:scale-110 transition-all duration-300 shadow-lg animate-in fade-in slide-in-from-bottom-4 border border-gray-200/50"
            aria-label="Voltar ao topo"
          >
            <ChevronUp size={24} />
          </button>
        )}
      </div>
    </div>
  );
}