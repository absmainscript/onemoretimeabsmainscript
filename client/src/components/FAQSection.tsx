/**
 * FAQSection.tsx
 * 
 * Seção de Perguntas Frequentes (FAQ) sobre terapia
 * Contém accordion expansível com dúvidas comuns dos clientes
 * Animações suaves para abrir/fechar perguntas
 * Sistema de estado para controlar qual pergunta está aberta
 */

import { motion } from "framer-motion"; // Animações do accordion
import { ChevronDown } from "lucide-react"; // Ícone da seta para expandir
import { useEffect, useRef, useState } from "react"; // Gerenciamento de estado
import { useQuery } from "@tanstack/react-query"; // Query para dados do servidor
import type { FaqItem } from "@shared/schema"; // Tipo dos FAQs
import { processTextWithGradient } from "@/utils/textGradient"; // Processa texto com gradiente

export default function FAQSection() {
  // Busca FAQs do banco de dados
  const { data: faqs = [], isLoading } = useQuery<FaqItem[]>({
    queryKey: ["/api/admin/faq"],
  });

  // Buscar configurações da seção FAQ
  const { data: configs } = useQuery({
    queryKey: ["/api/admin/config"],
    queryFn: async () => {
      const response = await fetch("/api/admin/config");
      return response.json();
    },
  });

  // Extrair configurações da seção FAQ
  const faqSection = configs?.find((c: any) => c.key === 'faq_section')?.value as any || {};

  const [openFaq, setOpenFaq] = useState<number | null>(null);
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

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };



  return (
    <section className="py-4 sm:py-6 bg-gradient-to-br from-white via-gray-50/50 to-purple-50/30" ref={ref}>
      <div className="container mx-auto mobile-container max-w-7xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block mb-4">
            <span className="text-sm font-medium text-pink-600 bg-pink-100 px-4 py-2 rounded-full">
              {faqSection.badge || "DÚVIDAS FREQUENTES"}
            </span>
          </div>
          <h2 className="font-display font-medium text-3xl sm:text-4xl md:text-5xl text-gray-900 mb-6 tracking-tight">
            {processTextWithGradient(faqSection.title || "Respondemos suas (principais dúvidas)")}
          </h2>
          <p className="text-gray-600 text-lg font-light leading-relaxed max-w-2xl mx-auto">
            {faqSection.subtitle || "Esclarecimentos importantes sobre como funciona o processo de acompanhamento psicológico"}
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.filter(faq => faq.isActive).map((faq, index) => (
            <motion.div
              key={faq.id}
              className="card-aesthetic p-8 rounded-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer shadow-subtle shadow-subtle-hover"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <button
                className="w-full flex items-center justify-between text-left"
                onClick={() => toggleFaq(index)}
              >
                <h3 className="font-semibold text-lg text-gray-800 pr-4">{faq.question}</h3>
                <motion.div
                  animate={{ rotate: openFaq === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="text-coral" size={20} />
                </motion.div>
              </button>
              <motion.div
                initial={false}
                animate={{
                  height: openFaq === index ? "auto" : 0,
                  opacity: openFaq === index ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}