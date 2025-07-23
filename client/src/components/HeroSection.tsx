/**
 * HeroSection.tsx
 * 
 * Seção principal da homepage do site da Dra. Olizete Maciolo
 * Contém: título principal, subtítulo, botões de ação e avatar da psicóloga
 * Utiliza animações em Framer Motion para entrada suave dos elementos
 */

import { motion } from "framer-motion"; // Biblioteca para animações suaves
import { Calendar } from "lucide-react"; // Ícone de calendário para botão de agendamento
import { Avatar } from "./Avatar"; // Componente do avatar da psicóloga
import { useQuery } from "@tanstack/react-query"; // Para buscar configurações do site
import { processTextWithGradient } from "@/utils/textGradient"; // Utilitário para processar texto com gradiente

export default function HeroSection() {
  // Buscar configurações do site incluindo a imagem do hero
  const { data: configs } = useQuery({
    queryKey: ["/api/admin/config"],
    queryFn: async () => {
      const response = await fetch("/api/admin/config");
      return response.json();
    },
  });

  // Extrair configurações dinâmicas
  const heroImage = configs?.find((c: any) => c.key === 'hero_image');
  const customImage = heroImage?.value?.path || null;

  // Extrair informações gerais e da seção hero
  const generalInfo = configs?.find((c: any) => c.key === 'general_info')?.value as any || {};
  const heroSection = configs?.find((c: any) => c.key === 'hero_section')?.value as any || {};

  // Valores dinâmicos com fallbacks
  const psychologistName = generalInfo.name || "Dra. Adrielle Benhossi";
  const heroTitle = heroSection.title || "Cuidando da sua saúde mental com carinho";
  const heroSubtitle = heroSection.subtitle || "Psicóloga especializada em terapia cognitivo-comportamental, oferecendo um espaço seguro e acolhedor para seu bem-estar emocional.";

  // Função para rolar suavemente até a seção de contato
  const scrollToContact = () => {
    const element = document.getElementById("contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Função para rolar suavemente até a seção sobre
  const scrollToAbout = () => {
    const element = document.getElementById("about");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const buttonText1 = heroSection.buttonText1 || "Agendar consulta";
  const buttonText2 = heroSection.buttonText2 || "Saiba mais";

  return (
    <section id="home" className="min-h-screen gradient-bg flex items-center relative overflow-hidden pt-16 sm:pt-0">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10"></div>

      {/* Dynamic floating elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 left-10 w-24 h-24 bg-white/30 rounded-full blur-xl"
          animate={{ 
            y: [0, -30, 0],
            x: [0, 10, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-40 right-20 w-20 h-20 bg-pink-300/40 rounded-full blur-lg"
          animate={{ 
            y: [0, -25, 0],
            x: [0, -15, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute bottom-40 left-20 w-16 h-16 bg-yellow-300/30 rounded-full blur-md"
          animate={{ 
            y: [0, -20, 0],
            x: [0, 20, 0],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
        <motion.div
          className="absolute top-60 left-1/3 w-12 h-12 bg-purple-300/25 rounded-full blur-sm"
          animate={{ 
            y: [0, -15, 0],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <div className="container mx-auto mobile-container py-12 sm:py-20 relative z-10 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          <motion.div
            className="text-center md:text-left max-w-2xl mx-auto md:mx-0"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="card-aesthetic p-8 mb-8">
              <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-gray-800 mb-6 leading-tight">
                {processTextWithGradient(heroTitle)}
              </h1>

              <p className="text-lg md:text-xl text-gray-600 mb-6 font-light leading-relaxed">
                {heroSubtitle}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:max-w-lg">
              <button
                onClick={scrollToContact}
                className="card-aesthetic px-6 py-4 rounded-full text-gray-700 font-semibold hover:scale-105 transition-all duration-300 inline-flex items-center justify-center text-base flex-1"
              >
                <Calendar className="mr-2" size={20} />
                {buttonText1}
              </button>
              <button
                onClick={scrollToAbout}
                className="border-2 border-gray-300 bg-white/50 px-6 py-4 rounded-full text-gray-600 font-medium hover:bg-white/80 hover:scale-105 transition-all duration-300 inline-flex items-center justify-center text-base flex-1"
              >
                {buttonText2}
              </button>
            </div>
          </motion.div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Desktop layout - mantém o formato atual */}
            <div className="hidden md:block glass-strong p-4 sm:p-8 rounded-3xl inline-block hover:scale-105 transition-all duration-300 max-w-full">
              <div className="w-64 h-80 sm:w-80 sm:h-96 bg-gradient-to-br from-rose-50 to-pink-100 rounded-2xl mx-auto flex items-center justify-center relative overflow-hidden border border-pink-200">
                {/* Background decorative elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-100/30 to-purple-200/30"></div>
                <div className="absolute top-10 right-10 w-20 h-20 bg-white/20 rounded-full"></div>
                <div className="absolute bottom-20 left-8 w-16 h-16 bg-white/15 rounded-full"></div>
                <div className="absolute top-1/3 left-10 w-12 h-12 bg-pink-300/20 rounded-full"></div>
                <div className="absolute bottom-1/3 right-12 w-8 h-8 bg-purple-300/20 rounded-full"></div>

                {customImage ? (
                  <img 
                    src={customImage} 
                    alt="Dra. Adrielle Benhossi" 
                    className="w-full h-full object-cover rounded-2xl relative z-10"
                  />
                ) : (
                  <div className="relative z-10">
                    <Avatar size="lg" />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile layout - foto com largura total e efeito de transição */}
            <div className="md:hidden relative w-full">
              <div className="relative h-80 w-full bg-gradient-to-br from-rose-50 to-pink-100 rounded-2xl overflow-hidden border border-pink-200">
                {/* Background decorative elements para mobile */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-100/30 to-purple-200/30"></div>

                {customImage ? (
                  <div className="relative h-full w-full">
                    <img 
                      src={customImage} 
                      alt="Dra. Adrielle Benhossi" 
                      className="w-full h-full object-cover relative z-10"
                    />
                    {/* Efeito de transição suave na parte inferior */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/80 via-white/40 to-transparent z-20"></div>
                  </div>
                ) : (
                  <div className="relative z-10 h-full flex items-center justify-center">
                    <Avatar size="lg" />
                    {/* Efeito de transição suave na parte inferior para avatar */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/60 via-white/30 to-transparent z-20"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Fallback para desktop sem o wrapper glass-strong se necessário */}
            <div className="hidden">
              <div className="w-64 h-80 sm:w-80 sm:h-96 bg-gradient-to-br from-rose-50 to-pink-100 rounded-2xl mx-auto flex items-center justify-center relative overflow-hidden border border-pink-200">
                {/* Background decorative elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-100/30 to-purple-200/30"></div>
                <div className="absolute top-10 right-10 w-20 h-20 bg-white/20 rounded-full"></div>
                <div className="absolute bottom-20 left-8 w-16 h-16 bg-white/15 rounded-full"></div>
                <div className="absolute top-1/3 left-10 w-12 h-12 bg-pink-300/20 rounded-full"></div>
                <div className="absolute bottom-1/3 right-12 w-8 h-8 bg-purple-300/20 rounded-full"></div>

                {/* 
                  SUBSTITUIÇÃO POR PNG:
                  Para substituir por uma foto PNG, remova todo o <Avatar> e substitua por:
                  <img 
                    src="/caminho-para-sua-foto.png" 
                    alt="Dra. Olizete Maciolo" 
                    className="w-full h-full object-cover rounded-2xl"
                  />
                */}
                <div className="relative z-10 text-center">
                  <Avatar size="md" customImage={customImage} />
                  {!customImage && (
                    <p className="text-xs text-gray-500 mt-3 font-light italic opacity-75">
                      Sua foto de perfil profissional aqui
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}