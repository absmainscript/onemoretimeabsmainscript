/**
 * ServicesSection.tsx
 * 
 * Seção de serviços oferecidos pela psicóloga
 * Exibe cards com: Terapia Individual, Terapia de Casal, Terapia Infantil
 * Cada card contém ícone, descrição, duração e preço
 * Utiliza animações staggered para entrada sequencial dos cards
 */

import { motion } from "framer-motion"; // Animações para os cards
import { 
  Brain, Users, Baby, Heart, User, Stethoscope, Activity, Zap, Shield, Target,
  UserPlus, UserCheck, UserX, UserCog, Sun, Moon, Star, Sparkles,
  MessageCircle, MessageSquare, Mic, Volume2, TrendingUp, BarChart, PieChart, Gauge,
  Leaf, Flower, TreePine, Wind, Handshake, HelpCircle, LifeBuoy, Umbrella,
  Home, Gamepad2, Puzzle, Palette, Footprints, Waves, Mountain, Compass,
  Clock, Timer, Calendar, Hourglass
} from "lucide-react"; // Ícones dos serviços
import { useEffect, useRef, useState } from "react"; // Hooks para controle de visibilidade
import { useQuery } from "@tanstack/react-query"; // Query para dados do servidor
import type { Service } from "@shared/schema"; // Tipo dos serviços
import { processTextWithGradient } from "@/utils/textGradient"; // Processa texto com gradiente

// Mapeamento de ícones por nome
const iconMap = {
  Brain,
  Users,
  Baby,
  Heart,
  User
} as const;

export default function ServicesSection() {
  // Busca serviços do banco de dados
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/admin/services"],
  });

  // Buscar configurações da seção serviços
  const { data: configs } = useQuery({
    queryKey: ["/api/admin/config"],
    queryFn: async () => {
      const response = await fetch("/api/admin/config");
      return response.json();
    },
  });

  // Extrair configurações da seção serviços
  const servicesSection = configs?.find((c: any) => c.key === 'services_section')?.value as any || {};

  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <section id="services" className="py-4 sm:py-6 gradient-bg" ref={ref}>
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <motion.div
          className="text-center mb-8 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-display font-bold text-2xl sm:text-4xl md:text-5xl text-gray-800 mb-4 sm:mb-6">
            {processTextWithGradient(servicesSection.title || "Meus (Serviços)")}
          </h2>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
            {servicesSection.subtitle || "Cuidado personalizado e acolhedor para nutrir seu bem-estar emocional e mental"}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {services.filter(service => service.isActive).map((service, index) => {
            // Mapeamento completo de ícones
            const iconMap: Record<string, any> = {
              // Ícones Principais
              Brain, Heart, Baby, Users, User,
              // Ícones de Saúde Mental
              Stethoscope, Activity, Zap, Shield, Target,
              // Ícones de Relacionamento
              UserPlus, UserCheck, UserX, UserCog,
              // Ícones de Bem-estar
              Sun, Moon, Star, Sparkles,
              // Ícones de Comunicação
              MessageCircle, MessageSquare, Mic, Volume2,
              // Ícones de Crescimento
              TrendingUp, BarChart, PieChart, Gauge,
              // Ícones de Mindfulness
              Leaf, Flower, TreePine, Wind,
              // Ícones de Apoio
              Handshake, HelpCircle, LifeBuoy, Umbrella,
              // Ícones de Família
              Home, Gamepad2, Puzzle, Palette,
              // Ícones de Movimento
              Footprints, Waves, Mountain, Compass,
              // Ícones de Tempo
              Clock, Timer, Calendar, Hourglass
            };
            
            const IconComponent = iconMap[service.icon] || Brain;
            
            return (
              <motion.div
                key={service.id}
                className="glass-strong p-8 rounded-3xl text-center hover:scale-[1.03] transition-all duration-700 ease-out flex flex-col h-full cursor-pointer shadow-subtle"
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className={`w-20 h-20 bg-gradient-to-r ${service.gradient} rounded-full flex items-center justify-center mx-auto mb-6 shadow-subtle`}>
                  <IconComponent className="text-white" size={32} />
                </div>
                <h3 className="font-display font-semibold text-xl text-gray-800 mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6 flex-grow">
                  {service.description}
                </p>
                {(service.showDuration || service.showPrice) && (
                  <div className={`${index === 1 ? 'text-purple-600' : 'text-pink-500'} font-semibold text-lg mt-auto`}>
                    {service.showDuration && service.duration}
                    {service.showDuration && service.showPrice && " • "}
                    {service.showPrice && service.price}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
