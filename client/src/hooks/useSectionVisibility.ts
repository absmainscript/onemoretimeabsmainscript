/**
 * useSectionVisibility.ts
 * 
 * Hook personalizado para controlar a visibilidade das seções do site
 * Verifica configurações do admin e retorna se cada seção deve ser exibida
 * Permite ativar/desativar seções inteiras através do painel administrativo
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { SiteConfig } from "@shared/schema";

interface SectionVisibilityConfig {
  hero?: boolean;
  about?: boolean;
  services?: boolean;
  testimonials?: boolean;
  faq?: boolean;
  contact?: boolean;
}

export const useSectionVisibility = () => {
  const { data: configs } = useQuery({
    queryKey: ["/api/admin/config"],
    staleTime: 5 * 60 * 1000,
  });

  const visibilityConfig = Array.isArray(configs) ? 
    configs.find((c: any) => c.key === 'sections_visibility')?.value as any || {} : 
    {};

  return {
    isHeroVisible: visibilityConfig.hero ?? true,
    isAboutVisible: visibilityConfig.about ?? true,
    isServicesVisible: visibilityConfig.services ?? true,
    isTestimonialsVisible: visibilityConfig.testimonials ?? true,
    isFaqVisible: visibilityConfig.faq ?? true,
    isContactVisible: visibilityConfig.contact ?? true,
    isPhotoCarouselVisible: visibilityConfig['photo-carousel'] ?? true,
    isSpecialtiesVisible: visibilityConfig?.specialties !== false && visibilityConfig?.specialties !== undefined
  };
};