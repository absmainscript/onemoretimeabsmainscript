/**
 * AboutSection.tsx
 * 
 * Seção "Sobre a Psicóloga" do site
 * Apresenta informações profissionais, qualificações e abordagem terapêutica
 * Contém cards com especialidades e animações de entrada suave
 * Utiliza Intersection Observer para ativar animações ao rolar a página
 */

import { motion } from "framer-motion";
import { 
  Brain, 
  Heart, 
  BookOpen, 
  Users, 
  Award, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Star,
  CheckCircle,
  Camera,
  Stethoscope, Activity, Zap, Shield, Target,
  UserPlus, UserCheck, UserX, UserCog, Sun, Moon, Sparkles,
  MessageCircle, MessageSquare, Mic, Volume2, TrendingUp, BarChart, PieChart, Gauge,
  Leaf, Flower, TreePine, Wind, Handshake, HelpCircle, LifeBuoy, Umbrella,
  Home, Gamepad2, Puzzle, Palette, Footprints, Waves, Mountain, Compass,
  Timer, Calendar, Hourglass
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { processTextWithGradient } from "@/utils/textGradient";
import Avatar from "./Avatar";
import type { Specialty } from "@shared/schema";

export default function AboutSection() {
  const { data: configs } = useQuery({
    queryKey: ["/api/admin/config"],
    queryFn: async () => {
      const response = await fetch("/api/admin/config");
      return response.json();
    },
  });

  const { data: specialties = [] } = useQuery({
    queryKey: ["/api/admin/specialties"],
    queryFn: async () => {
      const response = await fetch("/api/admin/specialties");
      return response.json();
    },
  });

  const heroImage = configs?.find((c: any) => c.key === "hero_image");
  const customImage = heroImage?.value?.path || null;

  const generalInfo = configs?.find((c: any) => c.key === "general_info")?.value as any || {};
  const aboutSection = configs?.find((c: any) => c.key === "about_section")?.value as any || {};
  const currentCrp = generalInfo.crp || "08/123456";
  const aboutText = aboutSection.description || "";

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
    <section 
      id="about" 
      className="py-4 sm:py-6 bg-gradient-to-br from-gray-50 to-white relative"
      ref={ref}
    >
      <div className="container mx-auto mobile-container max-w-7xl">
        <div className="grid lg:grid-cols-12 gap-4 sm:gap-8 lg:gap-16 lg:items-stretch">
          <div className="lg:col-span-5 flex">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="card-aesthetic p-8 flex flex-col w-full h-full"
            >
              <div className="text-left h-full flex flex-col">
                <div className="flex-1">
                  <h3 className="font-display font-medium text-2xl md:text-3xl text-gray-800 mb-2">
                    <span className="text-gradient">{generalInfo.name || "Dra. Adrielle Benhossi"}</span>
                  </h3>
                  <p className="text-pink-500 text-sm mb-6 font-medium">Psicóloga Clínica • CRP: {currentCrp}</p>

                  <p className="text-gray-600 leading-relaxed mb-6 text-base">
                    {aboutText || "Este é o espaço para escrever sobre você no painel administrativo."}
                  </p>

                  <div className="flex flex-col items-center justify-end pt-4">
                    <div className="grid grid-cols-1 gap-3 text-center w-full max-w-xs">
                      {(() => {
                        const aboutCredentials = configs?.find((c: any) => c.key === "about_credentials")?.value as any[] || [];
                        const activeCredentials = aboutCredentials
                          .filter(cred => cred.isActive !== false)
                          .sort((a, b) => (a.order || 0) - (b.order || 0));

                        if (activeCredentials.length === 0) {
                          // Fallback para dados padrão se não houver credenciais configuradas
                          return (
                            <>
                              <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-4 rounded-2xl">
                                <div className="text-sm font-semibold text-gray-700">Centro Universitário Integrado</div>
                                <div className="text-xs text-gray-500 mt-1">Formação Acadêmica</div>
                              </div>
                              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-2xl">
                                <div className="text-sm font-semibold text-gray-700">Terapia Cognitivo-Comportamental</div>
                                <div className="text-xs text-gray-500 mt-1">Abordagem Terapêutica</div>
                              </div>
                              <div className="bg-gradient-to-br from-green-50 to-teal-50 p-4 rounded-2xl">
                                <div className="text-sm font-semibold text-gray-700">Mais de 5 anos de experiência</div>
                                <div className="text-xs text-gray-500 mt-1">Experiência Profissional</div>
                              </div>
                            </>
                          );
                        }

                        return activeCredentials.map((credential: any) => (
                          <div key={credential.id} className={`bg-gradient-to-br ${credential.gradient} p-4 rounded-2xl`}>
                            <div className="text-sm font-semibold text-gray-700">{credential.title}</div>
                            <div className="text-xs text-gray-500 mt-1">{credential.subtitle}</div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="hidden lg:block lg:col-span-2">
            <div className="h-full flex items-center justify-center">
              <div className="h-[800px] w-px bg-gradient-to-b from-transparent via-pink-200 to-transparent"></div>
            </div>
          </div>

          <div className="lg:col-span-5 flex">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="card-aesthetic p-8 flex flex-col w-full h-full"
            >
              <div className="mb-8">
                <h2 className="font-display font-medium text-2xl sm:text-3xl mb-4">
                  {processTextWithGradient(aboutSection.title || "Minhas (especialidades)")}
                </h2>
                <p className="text-gray-500 text-base leading-relaxed">
                  {aboutSection.subtitle || "Áreas especializadas onde posso te ajudar a encontrar equilíbrio e bem-estar emocional"}
                </p>
              </div>

              {/* Specialty Cards - Dinâmicas do banco */}
              <motion.div
                className="grid grid-cols-1 gap-6"
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {specialties
                  .filter(specialty => specialty.isActive)
                  .sort((a, b) => a.order - b.order)
                  .map((specialty, index) => {
                    // Mapeamento completo de ícones
                    const iconMap: Record<string, any> = {
                      // Ícones Principais
                      Brain, Heart, BookOpen, Users, Award, Clock, MapPin, Phone, Mail, Star,
                      CheckCircle, Camera,
                      // Ícones de Saúde Mental
                      Stethoscope, Activity, Zap, Shield, Target,
                      // Ícones de Relacionamento
                      UserPlus, UserCheck, UserX, UserCog,
                      // Ícones de Bem-estar
                      Sun, Moon, Sparkles,
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
                      Timer, Calendar, Hourglass
                    };

                    const IconComponent = iconMap[specialty.icon] || Brain;

                    // Função para converter cor hex em RGB e depois em tom mais suave
                    const getSoftColor = (hexColor: string) => {
                      const hex = hexColor.replace('#', '');
                      const r = parseInt(hex.substr(0, 2), 16);
                      const g = parseInt(hex.substr(2, 2), 16);
                      const b = parseInt(hex.substr(4, 2), 16);
                      const softR = Math.round(r * 0.2 + 255 * 0.8);
                      const softG = Math.round(g * 0.2 + 255 * 0.8);
                      const softB = Math.round(b * 0.2 + 255 * 0.8);
                      return `rgb(${softR}, ${softG}, ${softB})`;
                    };

                    return (
                      <motion.div
                        key={specialty.id}
                        className="card-aesthetic p-6 hover:scale-105 transition-all duration-300 cursor-pointer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={isVisible ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                      >
                        <div className="flex items-start space-x-4">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: getSoftColor(specialty.iconColor) }}
                          >
                            <IconComponent 
                              className="w-5 h-5" 
                              style={{ color: specialty.iconColor }}
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800 mb-2 text-lg">{specialty.title}</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              {specialty.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}