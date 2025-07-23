import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Specialty } from "@shared/schema";
import { processTextWithGradient } from "@/utils/textGradient";

export default function SpecialtiesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: specialties = [], isLoading } = useQuery<Specialty[]>({
    queryKey: ["/api/specialties"],
  });

  const { data: configs } = useQuery({
    queryKey: ["/api/admin/config"],
    queryFn: async () => {
      const response = await fetch("/api/admin/config");
      return response.json();
    },
  });

  const specialtiesSection = configs?.find((c: any) => c.key === 'specialties_section')?.value as any || {};

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const activeSpecialties = specialties.filter(specialty => specialty.isActive);

  // Se não há especialidades ativas ou está carregando, não renderiza nada
  if (isLoading || !specialties || specialties.length === 0 || activeSpecialties.length === 0) {
    return null;
  }

  return (
    <section id="specialties" className="py-4 sm:py-6 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" ref={ref}>
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <motion.div
          className="text-center mb-8 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-display font-bold text-2xl sm:text-4xl md:text-5xl text-gray-800 mb-4 sm:mb-6">
            {processTextWithGradient(specialtiesSection.title || "Minhas (Especialidades)")}
          </h2>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
            {specialtiesSection.subtitle || "Áreas especializadas onde posso te ajudar a encontrar equilíbrio e bem-estar emocional"}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {activeSpecialties.map((specialty, index) => (
            <motion.div
              key={specialty.id}
              className="glass-strong p-6 sm:p-8 rounded-3xl text-center hover:scale-105 transition-all duration-500 flex flex-col h-full"
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">
                  {specialty.title.charAt(0)}
                </span>
              </div>
              <h3 className="font-display font-semibold text-xl text-gray-800 mb-4">
                {specialty.title}
              </h3>
              <p className="text-gray-600 leading-relaxed flex-grow">
                {specialty.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}