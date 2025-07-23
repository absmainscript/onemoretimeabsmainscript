import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, MessageSquare, HelpCircle, Briefcase, Users, Eye, EyeOff, Edit, Trash2, Plus, LogOut, Home, Palette, Star, GripVertical, Upload, Camera, Image, TrendingUp, Globe, Search, Ban, Target, Brain, Heart, BookOpen, Award, Shield, Sun, Moon, Sparkles, Handshake, MessageCircle, Leaf, Flower, Compass } from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { SiteConfig, Testimonial, FaqItem, Service, PhotoCarousel, Specialty } from "@shared/schema";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Componente para upload de imagem do Hero
function HeroImageUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  // Busca a imagem atual do hero
  const { data: configs } = useQuery({
    queryKey: ["/api/admin/config"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/config");
      return response.json();
    },
  });

  useEffect(() => {
    const heroImage = configs?.find((c: any) => c.key === 'hero_image');
    const imagePath = heroImage?.value?.path;
    // Reseta a imagem quando não há configuração ou está vazia
    setCurrentImage(imagePath && imagePath.trim() !== '' ? imagePath : null);
  }, [configs]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verifica se é uma imagem
    if (!file.type.startsWith('image/')) {
      toast({ title: "Erro", description: "Por favor, selecione apenas arquivos de imagem.", variant: "destructive" });
      return;
    }

    // Verifica o tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erro", description: "A imagem deve ter no máximo 5MB.", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/admin/upload/hero', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro no upload');
      }

      const result = await response.json();
      setCurrentImage(result.imagePath);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      toast({ title: "Sucesso!", description: "Foto de perfil atualizada com sucesso!" });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao fazer upload da imagem.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {currentImage && (
          <div className="relative">
            <img 
              src={currentImage} 
              alt="Foto de perfil atual" 
              className="w-20 h-20 rounded-full object-cover border-2"
            />
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full flex items-center justify-center">
              <Camera className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
        <div className="flex-1">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
          />
          <p className="text-xs text-muted-foreground mt-1">
            JPG, PNG ou GIF. Máximo 5MB.
          </p>
        </div>
      </div>
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          Fazendo upload...
        </div>
      )}
      {currentImage && (
        <div className="flex justify-center">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              try {
                // Remove completamente a configuração hero_image usando fetch direto
                const response = await fetch('/api/admin/config/hero_image', {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                  }
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                // Atualiza o estado local
                setCurrentImage(null);
                
                // Invalida as queries para recarregar dados
                await queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
                
                toast({ 
                  title: "Sucesso!", 
                  description: "Avatar original restaurado com sucesso!" 
                });
              } catch (error) {
                console.error('Erro ao redefinir foto:', error);
                toast({ 
                  title: "Erro", 
                  description: "Erro ao redefinir foto.", 
                  variant: "destructive" 
                });
              }
            }}
            className="text-xs"
          >
            🔄 Voltar ao avatar original
          </Button>
        </div>
      )}
    </div>
  );
}

// Componente para upload de foto de depoimento
function TestimonialImageUpload({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Erro", description: "Por favor, selecione apenas arquivos de imagem.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erro", description: "A imagem deve ter no máximo 5MB.", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/admin/upload/testimonials', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro no upload');
      }

      const result = await response.json();
      onChange(result.imagePath);
      toast({ title: "Sucesso!", description: "Foto do depoimento enviada!" });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao fazer upload da imagem.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    onChange("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {value && (
          <div className="relative">
            <img 
              src={value} 
              alt="Foto do depoimento" 
              className="w-16 h-16 rounded-full object-cover border-2"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
              onClick={removeImage}
            >
              ×
            </Button>
          </div>
        )}
        <div className="flex-1">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Opcional: Foto personalizada do cliente
          </p>
        </div>
      </div>
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          Fazendo upload...
        </div>
      )}
    </div>
  );
}



export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
  const [activeTab, setActiveTab] = useState("general");

  // Check authentication
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("admin_logged_in");
    if (!isLoggedIn) {
      setLocation("/09806446909");
    }
  }, [setLocation]);

  const logout = () => {
    localStorage.removeItem("admin_logged_in");
    setLocation("/09806446909");
  };

  // Queries
  const { data: siteConfigs = [] } = useQuery<SiteConfig[]>({
    queryKey: ["/api/admin/config"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/config");
      return response.json();
    },
  });

  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ["/api/admin/testimonials"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/testimonials");
      return response.json();
    },
  });

  const { data: faqItems = [] } = useQuery<FaqItem[]>({
    queryKey: ["/api/admin/faq"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/faq");
      return response.json();
    },
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/admin/services"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/services");
      return response.json();
    },
  });

  const { data: photoCarousel = [] } = useQuery<PhotoCarousel[]>({
    queryKey: ["/api/admin/photo-carousel"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/photo-carousel");
      return response.json();
    },
  });

  const { data: specialties = [] } = useQuery<Specialty[]>({
    queryKey: ["/api/admin/specialties"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/specialties");
      return response.json();
    },
  });

  const { data: contactSettings } = useQuery({
    queryKey: ["/api/admin/contact-settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/contact-settings");
      return response.json();
    },
  });

  const { data: footerSettings } = useQuery({
    queryKey: ["/api/admin/footer-settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/footer-settings");
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Painel Admin
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                  Dra. Adrielle Benhossi
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Home className="w-4 h-4 mr-2" />
                  Ver Site
                </Button>
                <Button variant="outline" size="sm" className="sm:hidden">
                  <Home className="w-4 h-4" />
                </Button>
              </Link>
              <Button onClick={logout} variant="destructive" size="sm" className="hidden sm:flex">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
              <Button onClick={logout} variant="destructive" size="sm" className="sm:hidden">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Welcome Banner */}
        {showWelcomeBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.5 }}
            className="mb-4 sm:mb-6"
          >
            <div 
              className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-lg p-3 sm:p-4 relative touch-pan-x cursor-pointer select-none"
              onTouchStart={(e) => {
                const touch = e.touches[0];
                e.currentTarget.dataset.startX = touch.clientX.toString();
                e.currentTarget.dataset.startY = touch.clientY.toString();
              }}
              onTouchMove={(e) => {
                const startX = parseFloat(e.currentTarget.dataset.startX || '0');
                const startY = parseFloat(e.currentTarget.dataset.startY || '0');
                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                const deltaX = currentX - startX;
                const deltaY = currentY - startY;
                
                // Só processar swipe horizontal se for maior que vertical
                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                  e.currentTarget.style.transform = `translateX(${deltaX}px)`;
                  e.currentTarget.style.opacity = Math.max(0.3, 1 - Math.abs(deltaX) / 200).toString();
                }
              }}
              onTouchEnd={(e) => {
                const startX = parseFloat(e.currentTarget.dataset.startX || '0');
                const startY = parseFloat(e.currentTarget.dataset.startY || '0');
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const deltaX = endX - startX;
                const deltaY = endY - startY;
                
                // Reset transform primeiro
                e.currentTarget.style.transform = '';
                e.currentTarget.style.opacity = '';
                
                // Se swipe horizontal for significativo (mais de 80px) e maior que vertical, fechar
                if (Math.abs(deltaX) > 80 && Math.abs(deltaX) > Math.abs(deltaY)) {
                  setShowWelcomeBanner(false);
                }
              }}
            >
              <button
                onClick={() => setShowWelcomeBanner(false)}
                className="absolute top-2 sm:top-3 right-2 sm:right-3 text-gray-600 hover:text-gray-800 transition-colors text-xl sm:text-lg font-bold bg-white/70 hover:bg-white/90 rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shadow-sm border border-gray-200"
                aria-label="Fechar notificação"
              >
                ×
              </button>
              <div className="pr-8 sm:pr-10">
                <h3 className="font-semibold text-purple-900 mb-1 sm:mb-2 text-sm sm:text-base">
                  👋 Bem-vinda, Leleli!
                </h3>
                <p className="text-xs sm:text-sm text-purple-800 leading-relaxed">
                  Aqui você personaliza tudo do seu site! Mexe nos textos, cores, suas fotos, depoimentos dos pacientes, 
                  seus serviços, FAQ e configura os pixels pro Facebook e Google. Toda mudança já fica no ar na hora!
                </p>
                <div className="mt-2 text-xs text-purple-600/80 font-medium">
                  📱 Deslize para o lado para fechar
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Navegação Unificada - Select Dropdown para Mobile e Desktop */}
            <div className="w-full">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full bg-white border-gray-300 hover:border-purple-400 transition-colors">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {activeTab === "general" && "📋"}
                        {activeTab === "about" && "👩‍⚕️"}
                        {activeTab === "gallery" && "📸"}
                        {activeTab === "specialties" && "🎯"}
                        {activeTab === "testimonials" && "💬"}
                        {activeTab === "services" && "🔧"}
                        {activeTab === "faq" && "❓"}
                        {activeTab === "contact-schedule" && "📞"}
                        {activeTab === "footer" && "🦶"}
                        {activeTab === "visibility" && "👁️"}
                        {activeTab === "marketing" && "📊"}
                        {activeTab === "appearance" && "🎨"}
                      </span>
                      <span className="font-medium">
                        {activeTab === "general" && "Configurações Gerais"}
                        {activeTab === "about" && "Gerenciar Sobre"}
                        {activeTab === "gallery" && "Galeria de Fotos"}
                        {activeTab === "specialties" && "Minhas Especialidades"}
                        {activeTab === "testimonials" && "Gerenciar Depoimentos"}
                        {activeTab === "services" && "Gerenciar Serviços"}
                        {activeTab === "faq" && "Gerenciar FAQ"}
                        {activeTab === "contact-schedule" && "Contato e Horários"}
                        {activeTab === "footer" && "Gerenciar Rodapé"}
                        {activeTab === "visibility" && "Controlar Visibilidade"}
                        {activeTab === "marketing" && "Pixels de Marketing"}
                        {activeTab === "appearance" && "Personalizar Cores"}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full">
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                      Configurações do Site
                    </div>
                    <SelectItem value="general" className="py-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📋</span>
                        <div>
                          <div className="font-medium">Configurações Gerais</div>
                          <div className="text-xs text-gray-500">Informações básicas, textos e foto</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="about" className="py-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">👩‍⚕️</span>
                        <div>
                          <div className="font-medium">Gerenciar Sobre</div>
                          <div className="text-xs text-gray-500">Credenciais e qualificações</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="gallery" className="py-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📸</span>
                        <div>
                          <div className="font-medium">Galeria de Fotos</div>
                          <div className="text-xs text-gray-500">Carrossel do consultório</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="specialties" className="py-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🎯</span>
                        <div>
                          <div className="font-medium">Minhas Especialidades</div>
                          <div className="text-xs text-gray-500">Áreas de atuação</div>
                        </div>
                      </div>
                    </SelectItem>
                  </div>
                  
                  <div className="p-2 border-t">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                      Conteúdo
                    </div>
                    <SelectItem value="testimonials" className="py-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">💬</span>
                        <div>
                          <div className="font-medium">Gerenciar Depoimentos</div>
                          <div className="text-xs text-gray-500">Avaliações de pacientes</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="services" className="py-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🔧</span>
                        <div>
                          <div className="font-medium">Gerenciar Serviços</div>
                          <div className="text-xs text-gray-500">Tipos de atendimento e preços</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="faq" className="py-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">❓</span>
                        <div>
                          <div className="font-medium">Gerenciar FAQ</div>
                          <div className="text-xs text-gray-500">Perguntas frequentes</div>
                        </div>
                      </div>
                    </SelectItem>
                  </div>

                  <div className="p-2 border-t">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                      Contato e Layout
                    </div>
                    <SelectItem value="contact-schedule" className="py-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📞</span>
                        <div>
                          <div className="font-medium">Contato e Horários</div>
                          <div className="text-xs text-gray-500">Botões e informações de contato</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="footer" className="py-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🦶</span>
                        <div>
                          <div className="font-medium">Gerenciar Rodapé</div>
                          <div className="text-xs text-gray-500">Links e informações finais</div>
                        </div>
                      </div>
                    </SelectItem>
                  </div>

                  <div className="p-2 border-t">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                      Configurações Avançadas
                    </div>
                    <SelectItem value="visibility" className="py-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">👁️</span>
                        <div>
                          <div className="font-medium">Controlar Visibilidade</div>
                          <div className="text-xs text-gray-500">Mostrar/ocultar seções</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="marketing" className="py-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📊</span>
                        <div>
                          <div className="font-medium">Pixels de Marketing</div>
                          <div className="text-xs text-gray-500">Facebook, Google Analytics</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="appearance" className="py-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🎨</span>
                        <div>
                          <div className="font-medium">Personalizar Cores</div>
                          <div className="text-xs text-gray-500">Temas e paletas de cores</div>
                        </div>
                      </div>
                    </SelectItem>
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-6">
              <div className="grid gap-6">
                {/* Informações Básicas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-lg">👤</span>
                      Informações Básicas
                    </CardTitle>
                    <CardDescription>
                      Configure os dados principais: nome, CRP, descrição e foto de perfil
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BasicInfoForm configs={siteConfigs} />
                  </CardContent>
                </Card>

                {/* Textos das Seções */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-lg">📝</span>
                      Textos das Seções
                    </CardTitle>
                    <CardDescription>
                      Configure os textos que aparecem em cada seção do site
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SectionTextsForm configs={siteConfigs} />
                  </CardContent>
                </Card>

                {/* Navegação */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-lg">🧭</span>
                      Menu de Navegação
                    </CardTitle>
                    <CardDescription>
                      Personalize os nomes dos botões do menu (apenas os nomes, as funcionalidades permanecem)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <NavigationForm configs={siteConfigs} />
                  </CardContent>
                </Card>

                {/* Modo Manutenção */}
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                      <span className="text-lg">🚧</span>
                      Modo de Manutenção
                    </CardTitle>
                    <CardDescription className="text-orange-700">
                      Controle se o site fica público ou em manutenção
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MaintenanceForm configs={siteConfigs} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* About Tab */}
            <TabsContent value="about" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar Credenciais da Seção Sobre</CardTitle>
                  <CardDescription>
                    Configure as credenciais, qualificações e especializações exibidas na seção "Sobre". 
                    Cada item aparece como um card com gradiente personalizado na seção sobre a psicóloga.
                    Arraste e solte para reordenar a sequência de exibição.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AboutCredentialsManager configs={siteConfigs} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar Galeria de Fotos</CardTitle>
                  <CardDescription>
                    Configure o carrossel de fotos do consultório. Adicione fotos com títulos e descrições.
                    O carrossel avança automaticamente a cada 6 segundos e permite navegação manual.
                    Arraste e solte para reordenar as fotos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PhotoCarouselManager photoCarousel={photoCarousel} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Specialties Tab */}
            <TabsContent value="specialties" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar Minhas Especialidades</CardTitle>
                  <CardDescription>
                    Configure suas áreas de especialização que aparecem na seção "Sobre". 
                    Defina título, descrição, ícone e cor para cada especialidade.
                    Arraste e solte para reordenar por prioridade.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SpecialtiesManager specialties={specialties} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Testimonials Tab */}
            <TabsContent value="testimonials" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar Depoimentos</CardTitle>
                  <CardDescription>
                    Aqui você adiciona, edita ou remove depoimentos dos seus pacientes. 
                    Use avatares variados para representar diferentes perfis de clientes. 
                    Arraste e solte para reordenar a sequência de exibição no site.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TestimonialsManager testimonials={testimonials} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar Serviços</CardTitle>
                  <CardDescription>
                    Configure os serviços que você oferece: título, descrição, ícone e preços. 
                    Escolha entre 40+ ícones profissionais organizados por categorias. 
                    Ative/desative serviços e reordene usando arrastar e soltar.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ServicesManager services={services} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar FAQ</CardTitle>
                  <CardDescription>
                    Crie perguntas e respostas frequentes sobre seus serviços. 
                    Ajude seus futuros pacientes esclarecendo dúvidas comuns. 
                    Organize as perguntas arrastando para reordenar por importância.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FaqManager faqItems={faqItems} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Visibility Tab */}
            <TabsContent value="visibility" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Visibilidade das Seções</CardTitle>
                  <CardDescription>
                    Controle quais seções do site estão visíveis para os visitantes. 
                    Você pode temporariamente desativar seções durante atualizações ou manutenção.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SectionVisibilitySettings configs={siteConfigs} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Marketing Tab */}
            <TabsContent value="marketing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Marketing</CardTitle>
                  <CardDescription>
                    Configure códigos de acompanhamento para medir visitas e resultados. 
                    Google Analytics mostra estatísticas detalhadas. Facebook Pixel permite criar anúncios direcionados. 
                    Cole os códigos fornecidos por essas plataformas aqui.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MarketingSettings configs={siteConfigs} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Schedule Tab */}
            <TabsContent value="contact-schedule" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar Contato e Horários</CardTitle>
                  <CardDescription>
                    Configure informações de contato, redes sociais, horários de funcionamento e localização. 
                    Personalize botões de contato, reordene por prioridade e defina links personalizados.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContactScheduleManager contactSettings={contactSettings} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Footer Tab */}
            <TabsContent value="footer" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar Rodapé</CardTitle>
                  <CardDescription>
                    Configure todos os elementos do rodapé: textos, botões de contato, certificações, 
                    selos de confiança, informações de copyright e CNPJ. Personalize cores, ícones e ordenação.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FooterManager footerSettings={footerSettings} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personalizar Aparência</CardTitle>
                  <CardDescription>
                    Mude as cores do seu site escolhendo uma das paletas pré-definidas. 
                    Cada tema altera botões, textos destacados e elementos decorativos automaticamente. 
                    As mudanças aparecem instantaneamente em todo o site.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AppearanceSettings configs={siteConfigs} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <div className="text-center text-xs text-gray-400">
            Made with <span className="text-yellow-500">♥</span> by <span className="font-mono">∞</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Photo Carousel Image Upload
function PhotoCarouselImageUpload({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Erro", description: "Por favor, selecione apenas arquivos de imagem.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erro", description: "A imagem deve ter no máximo 5MB.", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/admin/upload/carousel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro no upload');
      }

      const result = await response.json();
      onChange(result.imagePath);
      toast({ title: "Sucesso!", description: "Foto do carrossel enviada!" });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao fazer upload da imagem.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    onChange("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {value && (
          <div className="relative">
            <img 
              src={value} 
              alt="Foto do carrossel" 
              className="w-20 h-16 rounded object-cover border-2"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
              onClick={removeImage}
            >
              ×
            </Button>
          </div>
        )}
        <div className="flex-1">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Foto para o carrossel (recomendado: 1200x600px)
          </p>
        </div>
      </div>
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          Fazendo upload...
        </div>
      )}
    </div>
  );
}

function PhotoCarouselManager({ photoCarousel }: { photoCarousel: PhotoCarousel[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<PhotoCarousel | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const photoSchema = z.object({
    title: z.string().min(1, "Título é obrigatório"),
    description: z.string().optional(),
    imageUrl: z.string().min(1, "Imagem é obrigatória"),
    showText: z.boolean(),
    isActive: z.boolean(),
    order: z.number().min(0),
  });

  type PhotoForm = z.infer<typeof photoSchema>;

  const form = useForm<PhotoForm>({
    resolver: zodResolver(photoSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      showText: true,
      isActive: true,
      order: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PhotoForm) => {
      const response = await apiRequest("POST", "/api/admin/photo-carousel", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/photo-carousel"] });
      toast({ title: "Foto adicionada com sucesso!" });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PhotoForm> }) => {
      const response = await apiRequest("PUT", `/api/admin/photo-carousel/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/photo-carousel"] });
      toast({ title: "Foto atualizada com sucesso!" });
      setEditingItem(null);
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/photo-carousel/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/photo-carousel"] });
      toast({ title: "Foto excluída com sucesso!" });
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = photoCarousel.findIndex((item) => item.id === active.id);
      const newIndex = photoCarousel.findIndex((item) => item.id === over.id);
      
      const newOrder = arrayMove(photoCarousel, oldIndex, newIndex);
      
      const updatePromises = newOrder.map((item, index) => 
        apiRequest("PUT", `/api/admin/photo-carousel/${item.id}`, { 
          order: index
        })
      );
      
      Promise.all(updatePromises).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/photo-carousel"] });
        toast({ title: "Ordem das fotos atualizada!" });
      }).catch(() => {
        toast({ title: "Erro ao atualizar ordem", variant: "destructive" });
      });
    }
  };

  const onSubmit = (data: PhotoForm) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (photo: PhotoCarousel) => {
    setEditingItem(photo);
    
    setTimeout(() => {
      form.setValue("title", photo.title || "");
      form.setValue("description", photo.description || "");
      form.setValue("imageUrl", photo.imageUrl || "");
      form.setValue("showText", photo.showText ?? true);
      form.setValue("isActive", photo.isActive ?? true);
      form.setValue("order", photo.order || 0);
    }, 100);
    
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    form.reset();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Fotos do Carrossel</h3>
          <p className="text-sm text-muted-foreground">
            Carrossel automático com navegação manual e touch support
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Foto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Foto" : "Nova Foto"}
              </DialogTitle>
              <DialogDescription>
                Configure a foto e os textos do carrossel
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imagem</FormLabel>
                      <FormControl>
                        <PhotoCarouselImageUpload 
                          value={field.value} 
                          onChange={field.onChange} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Ambiente Acolhedor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrição da foto..." rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="showText"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Mostrar Texto</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Exibir título e descrição
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Ativo</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Exibir no carrossel
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordem</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingItem ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 <strong>Dica:</strong> Arraste e solte as fotos para reordenar. O carrossel avança automaticamente a cada 6 segundos.
        </p>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={photoCarousel.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {photoCarousel
              .sort((a, b) => a.order - b.order)
              .map((photo) => (
              <SortablePhotoItem 
                key={photo.id} 
                photo={photo}
                onEdit={() => openEditDialog(photo)}
                onDelete={() => deleteMutation.mutate(photo.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {photoCarousel.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Image className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhuma foto cadastrada ainda.</p>
          <p className="text-sm">Clique em "Nova Foto" para começar.</p>
        </div>
      )}
    </div>
  );
}

function SortablePhotoItem({ photo, onEdit, onDelete }: { 
  photo: PhotoCarousel; 
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4 cursor-move">
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1 flex-shrink-0">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          {photo.imageUrl && (
            <img 
              src={photo.imageUrl} 
              alt={photo.title}
              className="w-16 h-12 sm:w-20 sm:h-16 rounded object-cover border flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h4 className="font-semibold text-sm sm:text-base truncate">{photo.title}</h4>
              <Badge variant={photo.isActive ? "default" : "secondary"} className="text-xs flex-shrink-0">
                {photo.isActive ? "Ativo" : "Inativo"}
              </Badge>
              {photo.showText && (
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  Com Texto
                </Badge>
              )}
            </div>
            {photo.description && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{photo.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">Ordem: {photo.order}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={onEdit} className="h-8 w-8 sm:w-auto p-0 sm:px-3">
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Editar</span>
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete} className="h-8 w-8 sm:w-auto p-0 sm:px-3">
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Excluir</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Componente para controlar visibilidade das seções
function SectionVisibilitySettings({ configs }: { configs: SiteConfig[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const visibilityConfig = configs?.find(c => c.key === 'sections_visibility')?.value as any || {};
  const orderConfig = configs?.find(c => c.key === 'sections_order')?.value as any || {};

  const defaultSections = [
    {
      key: 'hero',
      name: 'Seção Inicial (Hero)',
      description: 'Primeira seção com foto, título principal e botões de ação',
      icon: '🏠',
      defaultVisible: true,
      order: 0
    },
    {
      key: 'about',
      name: 'Seção Sobre',
      description: 'Informações sobre a psicóloga, formação e experiência',
      icon: '👤',
      defaultVisible: true,
      order: 1
    },
    {
      key: 'services',
      name: 'Seção Serviços',
      description: 'Lista dos serviços oferecidos com preços e descrições',
      icon: '🔧',
      defaultVisible: true,
      order: 2
    },
    {
      key: 'testimonials',
      name: 'Seção Depoimentos',
      description: 'Depoimentos e avaliações de pacientes',
      icon: '💬',
      defaultVisible: true,
      order: 3
    },
    {
      key: 'faq',
      name: 'Seção FAQ',
      description: 'Perguntas e respostas frequentes',
      icon: '❓',
      defaultVisible: true,
      order: 4
    },
    {
      key: 'inspirational',
      name: 'Seção Citação Inspiracional',
      description: 'Frase motivacional e autor da citação',
      icon: '💭',
      defaultVisible: true,
      order: 5
    },
    {
      key: 'photo-carousel',
      name: 'Seção Galeria de Fotos',
      description: 'Carrossel de fotos do consultório e ambiente',
      icon: '📸',
      defaultVisible: true,
      order: 3.5
    },
    {
      key: 'contact',
      name: 'Seção Contato',
      description: 'Informações de contato e formulário',
      icon: '📞',
      defaultVisible: true,
      order: 6
    }
  ];

  // Ordena seções baseado na configuração salva
  const sections = defaultSections
    .map(section => ({
      ...section,
      order: orderConfig[section.key] ?? section.order
    }))
    .sort((a, b) => a.order - b.order);

  const [localSections, setLocalSections] = useState(sections);

  // Sensores otimizados para mobile e desktop
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Atualiza seções locais quando dados mudam
  useEffect(() => {
    const updatedSections = defaultSections
      .map(section => ({
        ...section,
        order: orderConfig[section.key] ?? section.order
      }))
      .sort((a, b) => a.order - b.order);
    setLocalSections(updatedSections);
  }, [configs]);

  const handleToggleSection = async (sectionKey: string, isVisible: boolean) => {
    try {
      const newVisibilityConfig = {
        ...visibilityConfig,
        [sectionKey]: isVisible
      };

      await apiRequest("POST", "/api/admin/config", {
        key: "sections_visibility",
        value: newVisibilityConfig
      });

      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      
      toast({
        title: "Visibilidade atualizada!",
        description: `Seção ${sections.find(s => s.key === sectionKey)?.name} ${isVisible ? 'ativada' : 'desativada'} com sucesso.`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar visibilidade da seção.",
        variant: "destructive"
      });
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = localSections.findIndex(s => s.key === active.id);
    const newIndex = localSections.findIndex(s => s.key === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const newSections = arrayMove(localSections, oldIndex, newIndex);
    setLocalSections(newSections);

    try {
      // Cria novo objeto de ordem
      const newOrderConfig: Record<string, number> = {};
      newSections.forEach((section, index) => {
        newOrderConfig[section.key] = index;
      });

      await apiRequest("POST", "/api/admin/config", {
        key: "sections_order",
        value: newOrderConfig
      });

      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      
      toast({
        title: "Ordem atualizada!",
        description: "A nova ordem das seções foi salva com sucesso."
      });
    } catch (error) {
      // Reverte em caso de erro
      setLocalSections(sections);
      toast({
        title: "Erro",
        description: "Erro ao salvar nova ordem das seções.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 text-lg">ℹ️</div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Como funciona</h4>
            <p className="text-sm text-blue-800">
              Use os controles abaixo para mostrar ou esconder seções inteiras do seu site. 
              Seções desativadas ficam completamente invisíveis para os visitantes, mas você pode reativá-las a qualquer momento.
              Ideal para quando você está atualizando conteúdo ou quer temporariamente remover uma seção.
            </p>
          </div>
        </div>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={localSections.map(s => s.key)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-4">
            {localSections.map((section) => (
              <SortableSectionItem 
                key={section.key} 
                section={section}
                isVisible={visibilityConfig[section.key] ?? section.defaultVisible}
                onToggleVisibility={handleToggleSection}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-yellow-600 text-lg">⚠️</div>
          <div>
            <h4 className="font-semibold text-yellow-900 mb-1">Importante</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Seções desativadas não aparecem para visitantes, mas seus dados são preservados</li>
              <li>• Você pode reativar seções a qualquer momento sem perder conteúdo</li>
              <li>• A seção de navegação (menu) sempre fica visível independentemente dessas configurações</li>
              <li>• Mudanças têm efeito imediato no site público</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente arrastável para item de seção
function SortableSectionItem({ section, isVisible, onToggleVisibility }: {
  section: any;
  isVisible: boolean;
  onToggleVisibility: (key: string, visible: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`sortable-item flex items-center justify-between p-4 border rounded-lg bg-white ${isDragging ? 'dragging' : ''}`}
    >
      <div className="flex items-start gap-3 flex-1">
        <div 
          {...attributes} 
          {...listeners}
          className="drag-handle p-2 -ml-2"
        >
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>
        <div className="text-2xl">{section.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{section.name}</h3>
            <Badge variant={isVisible ? "default" : "secondary"} className="text-xs">
              {isVisible ? "Visível" : "Oculta"}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{section.description}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Switch
          checked={isVisible}
          onCheckedChange={(checked) => onToggleVisibility(section.key, checked)}
        />
        {isVisible ? (
          <Eye className="w-5 h-5 text-green-600" />
        ) : (
          <EyeOff className="w-5 h-5 text-gray-400" />
        )}
      </div>
    </div>
  );
}

// Componente para informações básicas
function BasicInfoForm({ configs }: { configs: SiteConfig[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const basicSchema = z.object({
    name: z.string().min(1, "Nome da psicóloga é obrigatório"),
    crp: z.string().min(1, "CRP é obrigatório"),
    siteName: z.string().min(1, "Nome do site é obrigatório"),
    description: z.string().min(1, "Descrição é obrigatória"),
    location: z.string().min(1, "Localização é obrigatória"),
    phone: z.string().min(1, "Telefone é obrigatório"),
    email: z.string().email("Email inválido"),
    whatsapp: z.string().min(1, "WhatsApp é obrigatório"),
    instagram: z.string().min(1, "Instagram é obrigatório"),
    linkedin: z.string().min(1, "LinkedIn é obrigatório"),
  });

  type BasicForm = z.infer<typeof basicSchema>;

  const getBasicData = () => {
    const generalInfo = configs?.find(c => c.key === 'general_info')?.value as any || {};
    const contactInfo = configs?.find(c => c.key === 'contact_info')?.value as any || {};
    
    return {
      name: generalInfo.name || "Dra. Adrielle Benhossi",
      crp: generalInfo.crp || "08/123456",
      siteName: generalInfo.siteName || "Dra. Adrielle Benhossi - Psicóloga",
      description: generalInfo.description || "Psicóloga CRP 08/123456",
      location: generalInfo.location || "Campo Mourão, Paraná",
      phone: contactInfo.phone || "(44) 998-362-704",
      email: contactInfo.email || "escutapsi@adrielle.com.br",
      whatsapp: contactInfo.whatsapp || "5544998362704",
      instagram: contactInfo.instagram || "@adriellebenhossi",
      linkedin: contactInfo.linkedin || "linkedin.com/in/adrielle-benhossi-75510034a",
    };
  };

  const form = useForm<BasicForm>({
    resolver: zodResolver(basicSchema),
    defaultValues: getBasicData(),
  });

  React.useEffect(() => {
    if (configs && configs.length > 0) {
      const newData = getBasicData();
      form.reset(newData);
    }
  }, [configs, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: BasicForm) => {
      const promises = [
        apiRequest("POST", "/api/admin/config", {
          key: "general_info",
          value: {
            name: data.name,
            crp: data.crp,
            siteName: data.siteName,
            description: data.description,
            location: data.location,
          }
        }),
        apiRequest("POST", "/api/admin/config", {
          key: "contact_info",
          value: {
            phone: data.phone,
            email: data.email,
            whatsapp: data.whatsapp,
            instagram: data.instagram,
            linkedin: data.linkedin,
          }
        }),
      ];
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      toast({ title: "Informações básicas atualizadas com sucesso!" });
    },
  });

  const onSubmit = (data: BasicForm) => {
    updateMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Upload de Foto de Perfil Hero */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Foto de Perfil Principal
        </h4>
        <p className="text-sm text-muted-foreground">
          Esta foto aparecerá automaticamente em todas as seções do site: Header, Hero, Footer e Seção Sobre.
        </p>
        <HeroImageUpload />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Psicóloga</FormLabel>
                  <FormControl>
                    <Input placeholder="Dra. Adrielle Benhossi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="crp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CRP</FormLabel>
                  <FormControl>
                    <Input placeholder="08/123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="siteName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Site</FormLabel>
                  <FormControl>
                    <Input placeholder="Dra. Adrielle Benhossi - Psicóloga" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Psicóloga CRP 08/123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localização</FormLabel>
                  <FormControl>
                    <Input placeholder="Campo Mourão, Paraná" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Informações de Contato</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(44) 998-362-704" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="escutapsi@adrielle.com.br" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="5544998362704" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input placeholder="@adriellebenhossi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn</FormLabel>
                    <FormControl>
                      <Input placeholder="linkedin.com/in/adrielle-benhossi-75510034a" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Salvando..." : "Salvar Informações Básicas"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

// Componente para textos das seções
function SectionTextsForm({ configs }: { configs: SiteConfig[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sectionsSchema = z.object({
    heroTitle: z.string().min(1, "Título do hero é obrigatório"),
    heroSubtitle: z.string().min(1, "Subtítulo do hero é obrigatório"),
    buttonText1: z.string().min(1, "Texto do botão 1 é obrigatório"),
    buttonText2: z.string().min(1, "Texto do botão 2 é obrigatório"),
    aboutTitle: z.string().min(1, "Título da seção Sobre é obrigatório"),
    aboutSubtitle: z.string().min(1, "Subtítulo da seção Sobre é obrigatório"),
    aboutDescription: z.string().min(1, "Descrição da seção Sobre é obrigatória"),
    schedulingCardTitle: z.string().min(1, "Título do card de agendamento é obrigatório"),
    schedulingCardDescription: z.string().min(1, "Descrição do card é obrigatória"),
    schedulingCardButton: z.string().min(1, "Texto do botão é obrigatório"),
    servicesTitle: z.string().min(1, "Título da seção Serviços é obrigatório"),
    servicesSubtitle: z.string().min(1, "Subtítulo da seção Serviços é obrigatório"),
    servicesDescription: z.string().min(1, "Descrição da seção Serviços é obrigatória"),
    testimonialsBadge: z.string().min(1, "Badge da seção Depoimentos é obrigatório"),
    testimonialsTitle: z.string().min(1, "Título da seção Depoimentos é obrigatório"),
    testimonialsSubtitle: z.string().min(1, "Descrição da seção Depoimentos é obrigatória"),
    faqBadge: z.string().min(1, "Badge da seção FAQ é obrigatório"),
    faqTitle: z.string().min(1, "Título da seção FAQ é obrigatório"),
    faqSubtitle: z.string().min(1, "Descrição da seção FAQ é obrigatória"),
    inspirationalQuote: z.string().min(1, "Citação inspiracional é obrigatória"),
    inspirationalAuthor: z.string().min(1, "Autor da citação é obrigatório"),
  });

  type SectionsForm = z.infer<typeof sectionsSchema>;

  const getSectionsData = () => {
    const heroSection = configs?.find(c => c.key === 'hero_section')?.value as any || {};
    const aboutSection = configs?.find(c => c.key === 'about_section')?.value as any || {};
    const servicesSection = configs?.find(c => c.key === 'services_section')?.value as any || {};
    const testimonialsSection = configs?.find(c => c.key === 'testimonials_section')?.value as any || {};
    const faqSection = configs?.find(c => c.key === 'faq_section')?.value as any || {};
    const contactSection = configs?.find(c => c.key === 'contact_section')?.value as any || {};
    const inspirationalSection = configs?.find(c => c.key === 'inspirational_section')?.value as any || {};
    
    return {
      heroTitle: heroSection.title || "Cuidando da sua saúde mental com carinho",
      heroSubtitle: heroSection.subtitle || "Psicóloga especializada em terapia cognitivo-comportamental",
      buttonText1: heroSection.buttonText1 || "Agendar consulta",
      buttonText2: heroSection.buttonText2 || "Saiba mais",
      aboutTitle: aboutSection.title || "Sobre Mim",
      aboutSubtitle: aboutSection.subtitle || "Psicóloga dedicada ao seu bem-estar",
      aboutDescription: aboutSection.description || "Com experiência em terapia cognitivo-comportamental, ofereço um espaço seguro e acolhedor para você trabalhar suas questões emocionais e desenvolver ferramentas para uma vida mais equilibrada.",
      schedulingCardTitle: contactSection.schedulingCardTitle || "Vamos conversar?",
      schedulingCardDescription: contactSection.schedulingCardDescription || "Juntas, vamos caminhar em direção ao seu bem-estar e crescimento pessoal, em um espaço de acolhimento e cuidado",
      schedulingCardButton: contactSection.schedulingCardButton || "AGENDAMENTO",
      servicesTitle: servicesSection.title || "Serviços",
      servicesSubtitle: servicesSection.subtitle || "Cuidado especializado para cada necessidade",
      servicesDescription: servicesSection.description || "Cuidado personalizado e acolhedor para nutrir seu bem-estar emocional e mental",
      testimonialsBadge: testimonialsSection.badge || "DEPOIMENTOS",
      testimonialsTitle: testimonialsSection.title || "Histórias de transformação",
      testimonialsSubtitle: testimonialsSection.subtitle || "Experiências reais de pessoas que encontraram equilíbrio e bem-estar através do acompanhamento psicológico",
      faqBadge: faqSection.badge || "DÚVIDAS FREQUENTES",
      faqTitle: faqSection.title || "Respondemos suas principais dúvidas",
      faqSubtitle: faqSection.subtitle || "Esclarecimentos importantes sobre como funciona o processo de acompanhamento psicológico",
      inspirationalQuote: inspirationalSection.quote || "A cura acontece quando permitimos que nossa vulnerabilidade se transforme em força, e nossos medos em oportunidades de crescimento.",
      inspirationalAuthor: inspirationalSection.author || "Adrielle Benhossi",
    };
  };

  const form = useForm<SectionsForm>({
    resolver: zodResolver(sectionsSchema),
    defaultValues: getSectionsData(),
  });

  React.useEffect(() => {
    if (configs && configs.length > 0) {
      const newData = getSectionsData();
      form.reset(newData);
    }
  }, [configs, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: SectionsForm) => {
      const promises = [
        apiRequest("POST", "/api/admin/config", {
          key: "hero_section",
          value: {
            title: data.heroTitle,
            subtitle: data.heroSubtitle,
            buttonText1: data.buttonText1,
            buttonText2: data.buttonText2,
          }
        }),
        apiRequest("POST", "/api/admin/config", {
          key: "about_section",
          value: {
            title: data.aboutTitle,
            subtitle: data.aboutSubtitle,
            description: data.aboutDescription,
          }
        }),
        apiRequest("POST", "/api/admin/config", {
          key: "services_section",
          value: {
            title: data.servicesTitle,
            subtitle: data.servicesSubtitle,
            description: data.servicesDescription,
          }
        }),
        apiRequest("POST", "/api/admin/config", {
          key: "testimonials_section",
          value: {
            badge: data.testimonialsBadge,
            title: data.testimonialsTitle,
            subtitle: data.testimonialsSubtitle,
          }
        }),
        apiRequest("POST", "/api/admin/config", {
          key: "faq_section",
          value: {
            badge: data.faqBadge,
            title: data.faqTitle,
            subtitle: data.faqSubtitle,
          }
        }),
        apiRequest("POST", "/api/admin/config", {
          key: "contact_section",
          value: {
            schedulingCardTitle: data.schedulingCardTitle,
            schedulingCardDescription: data.schedulingCardDescription,
            schedulingCardButton: data.schedulingCardButton,
          }
        }),
        apiRequest("POST", "/api/admin/config", {
          key: "inspirational_section",
          value: {
            quote: data.inspirationalQuote,
            author: data.inspirationalAuthor,
          }
        })
      ];
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      toast({ title: "Textos das seções atualizados com sucesso!" });
    },
  });

  const onSubmit = (data: SectionsForm) => {
    updateMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Seção Hero */}
        <div className="space-y-4">
          <h4 className="font-medium text-purple-900 border-b pb-2">🏠 Seção Principal (Hero)</h4>
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-800">
              🎨 Use (palavra) para aplicar cores degradê automáticas nos títulos. Exemplo: "Cuidando da sua (saúde mental)"
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="heroTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título Principal ()</FormLabel>
                  <FormControl>
                    <Input placeholder="Cuidando da sua saúde mental com carinho" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="heroSubtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtítulo</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Psicóloga especializada em terapia cognitivo-comportamental..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="buttonText1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto Botão 1 (Principal)</FormLabel>
                    <FormControl>
                      <Input placeholder="Agendar consulta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="buttonText2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto Botão 2 (Secundário)</FormLabel>
                    <FormControl>
                      <Input placeholder="Saiba mais" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Seção Sobre */}
        <div className="space-y-4">
          <h4 className="font-medium text-purple-900 border-b pb-2">👩‍⚕️ Seção Sobre</h4>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="aboutTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da Seção Sobre ()</FormLabel>
                  <FormControl>
                    <Input placeholder="Sobre Dra. Adrielle Benhossi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aboutSubtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtítulo da Seção Sobre</FormLabel>
                  <FormControl>
                    <Input placeholder="Psicóloga CRP 08/123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aboutDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição Principal</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Formada em Psicologia pelo Centro Universitário Integrado..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Outras seções... */}
        <div className="space-y-4">
          <h4 className="font-medium text-purple-900 border-b pb-2">💬 Card de Agendamento</h4>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="schedulingCardTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Card ()</FormLabel>
                  <FormControl>
                    <Input placeholder="Vamos conversar?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="schedulingCardDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição do Card</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Juntas, vamos caminhar em direção ao seu bem-estar..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="schedulingCardButton"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Badge do Card</FormLabel>
                  <FormControl>
                    <Input placeholder="AGENDAMENTO" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Salvando..." : "Salvar Textos das Seções"}
        </Button>
      </form>
    </Form>
  );
}

// Componente para navegação
function NavigationForm({ configs }: { configs: SiteConfig[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const navSchema = z.object({
    navHome: z.string().min(1, "Menu: Início é obrigatório"),
    navAbout: z.string().min(1, "Menu: Sobre é obrigatório"),
    navServices: z.string().min(1, "Menu: Serviços é obrigatório"),
    navTestimonials: z.string().min(1, "Menu: Depoimentos é obrigatório"),
    navFaq: z.string().min(1, "Menu: FAQ é obrigatório"),
    navContact: z.string().min(1, "Menu: Contato é obrigatório"),
  });

  type NavForm = z.infer<typeof navSchema>;

  const getNavData = () => {
    const generalInfo = configs?.find(c => c.key === 'general_info')?.value as any || {};
    
    return {
      navHome: generalInfo.navHome || "Início",
      navAbout: generalInfo.navAbout || "Sobre",
      navServices: generalInfo.navServices || "Serviços",
      navTestimonials: generalInfo.navTestimonials || "Depoimentos",
      navFaq: generalInfo.navFaq || "FAQ",
      navContact: generalInfo.navContact || "Contato",
    };
  };

  const form = useForm<NavForm>({
    resolver: zodResolver(navSchema),
    defaultValues: getNavData(),
  });

  React.useEffect(() => {
    if (configs && configs.length > 0) {
      const newData = getNavData();
      form.reset(newData);
    }
  }, [configs, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: NavForm) => {
      const generalInfo = configs?.find(c => c.key === 'general_info')?.value as any || {};
      
      await apiRequest("POST", "/api/admin/config", {
        key: "general_info",
        value: {
          ...generalInfo,
          navHome: data.navHome,
          navAbout: data.navAbout,
          navServices: data.navServices,
          navTestimonials: data.navTestimonials,
          navFaq: data.navFaq,
          navContact: data.navContact,
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      toast({ title: "Menu de navegação atualizado com sucesso!" });
    },
  });

  const onSubmit = (data: NavForm) => {
    updateMutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          ⚠️ <strong>Importante:</strong> Estes campos alteram apenas os nomes dos botões do menu. As funcionalidades permanecem as mesmas.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="navHome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu: Início</FormLabel>
                  <FormControl>
                    <Input placeholder="Início" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="navAbout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu: Sobre</FormLabel>
                  <FormControl>
                    <Input placeholder="Sobre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="navServices"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu: Serviços</FormLabel>
                  <FormControl>
                    <Input placeholder="Serviços" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="navTestimonials"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu: Depoimentos</FormLabel>
                  <FormControl>
                    <Input placeholder="Depoimentos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="navFaq"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu: FAQ</FormLabel>
                  <FormControl>
                    <Input placeholder="FAQ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="navContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu: Contato</FormLabel>
                  <FormControl>
                    <Input placeholder="Contato" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Salvando..." : "Salvar Menu de Navegação"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

// Componente para modo manutenção
function MaintenanceForm({ configs }: { configs: SiteConfig[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const maintenanceSchema = z.object({
    maintenanceMode: z.boolean(),
    maintenanceTitle: z.string().min(1, "Título da manutenção é obrigatório"),
    maintenanceMessage: z.string().min(1, "Mensagem de manutenção é obrigatória"),
  });

  type MaintenanceForm = z.infer<typeof maintenanceSchema>;

  const getMaintenanceData = () => {
    const maintenanceInfo = configs?.find(c => c.key === 'maintenance_mode')?.value as any || {};
    
    return {
      maintenanceMode: maintenanceInfo.enabled || false,
      maintenanceTitle: maintenanceInfo.title || "Site em Manutenção",
      maintenanceMessage: maintenanceInfo.message || "Estamos fazendo algumas melhorias. Voltaremos em breve!",
    };
  };

  const form = useForm<MaintenanceForm>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: getMaintenanceData(),
  });

  React.useEffect(() => {
    if (configs && configs.length > 0) {
      const newData = getMaintenanceData();
      form.reset(newData);
    }
  }, [configs, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: MaintenanceForm) => {
      await apiRequest("POST", "/api/admin/config", {
        key: "maintenance_mode",
        value: {
          enabled: data.maintenanceMode,
          title: data.maintenanceTitle,
          message: data.maintenanceMessage,
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      toast({ title: "Configurações de manutenção atualizadas com sucesso!" });
    },
  });

  const onSubmit = (data: MaintenanceForm) => {
    updateMutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <p className="text-sm text-orange-800">
          ⚠️ <strong>Importante:</strong> Ao ativar o modo de manutenção, o site não será exibido publicamente. 
          Apenas uma página de manutenção será mostrada aos visitantes.
        </p>
      </div>
      
      {/* Status atual */}
      <div className="mb-4">
        {form.watch("maintenanceMode") ? (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-sm text-red-800">
              🚨 <strong>MODO DE MANUTENÇÃO ATIVO</strong> - O site não está sendo exibido publicamente.
            </div>
          </div>
        ) : (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm text-green-800">
              ✅ <strong>Site Público Ativo</strong> - Seu site está sendo exibido normalmente para os visitantes.
            </div>
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="maintenanceMode"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-medium">🔧 Modo de Manutenção</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Ativa/desativa o modo de manutenção do site
                  </div>
                </div>
                <FormControl>
                  <Switch 
                    checked={field.value} 
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const confirmed = window.confirm(
                          "⚠️ ATENÇÃO!\n\nAo ativar o modo de manutenção:\n" +
                          "• O site ficará INVISÍVEL para todos os visitantes\n" +
                          "• Apenas uma página de manutenção será exibida\n" +
                          "• O painel administrativo continuará funcionando\n\n" +
                          "Tem certeza que deseja continuar?"
                        );
                        if (confirmed) {
                          field.onChange(checked);
                          setTimeout(() => {
                            form.handleSubmit(onSubmit)();
                          }, 100);
                        }
                      } else {
                        const confirmed = window.confirm(
                          "✅ REATIVAR SITE\n\nDeseja reativar o site?\n" +
                          "• O site voltará a ser exibido publicamente\n" +
                          "• Visitantes poderão acessar normalmente\n\n" +
                          "Confirma a reativação?"
                        );
                        if (confirmed) {
                          field.onChange(checked);
                          setTimeout(() => {
                            form.handleSubmit(onSubmit)();
                          }, 100);
                        }
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {form.watch("maintenanceMode") && (
            <div className="grid grid-cols-1 gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-red-800 mb-2">
                🚨 <strong>Configure a mensagem de manutenção:</strong>
              </div>
              <FormField
                control={form.control}
                name="maintenanceTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título da Página de Manutenção</FormLabel>
                    <FormControl>
                      <Input placeholder="Site em Manutenção" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maintenanceMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem de Manutenção</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Estamos fazendo algumas melhorias. Voltaremos em breve!" 
                        rows={3} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Salvando..." : "Salvar Configurações de Manutenção"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

// Component placeholder original - removido pois foi reorganizado
function GeneralSettingsForm({ configs }: { configs: SiteConfig[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generalSchema = z.object({
    // Informações básicas
    name: z.string().min(1, "Nome da psicóloga é obrigatório"),
    crp: z.string().min(1, "CRP é obrigatório"),
    siteName: z.string().min(1, "Nome do site é obrigatório"),
    description: z.string().min(1, "Descrição é obrigatória"),
    location: z.string().min(1, "Localização é obrigatória"),
    phone: z.string().min(1, "Telefone é obrigatório"),
    email: z.string().email("Email inválido"),
    whatsapp: z.string().min(1, "WhatsApp é obrigatório"),
    instagram: z.string().min(1, "Instagram é obrigatório"),
    linkedin: z.string().min(1, "LinkedIn é obrigatório"),
    
    // Controle de Manutenção
    maintenanceMode: z.boolean(),
    maintenanceTitle: z.string().min(1, "Título da manutenção é obrigatório"),
    maintenanceMessage: z.string().min(1, "Mensagem de manutenção é obrigatória"),
    
    // Seção Hero
    heroTitle: z.string().min(1, "Título do hero é obrigatório"),
    heroSubtitle: z.string().min(1, "Subtítulo do hero é obrigatório"),
    buttonText1: z.string().min(1, "Texto do botão 1 é obrigatório"),
    buttonText2: z.string().min(1, "Texto do botão 2 é obrigatório"),
    
    // Seção Sobre
    aboutTitle: z.string().min(1, "Título da seção Sobre é obrigatório"),
    aboutSubtitle: z.string().min(1, "Subtítulo da seção Sobre é obrigatório"),
    aboutDescription: z.string().min(1, "Descrição da seção Sobre é obrigatória"),
    aboutCredentials: z.string().min(1, "Credenciais são obrigatórias"),
    // Card de Agendamento
    schedulingCardTitle: z.string().min(1, "Título do card de agendamento é obrigatório"),
    schedulingCardDescription: z.string().min(1, "Descrição do card é obrigatória"),
    schedulingCardButton: z.string().min(1, "Texto do botão é obrigatório"),
    
    // Seção Serviços
    servicesTitle: z.string().min(1, "Título da seção Serviços é obrigatório"),
    servicesSubtitle: z.string().min(1, "Subtítulo da seção Serviços é obrigatório"),
    servicesDescription: z.string().min(1, "Descrição da seção Serviços é obrigatória"),
    
    // Seção Depoimentos
    testimonialsBadge: z.string().min(1, "Badge da seção Depoimentos é obrigatório"),
    testimonialsTitle: z.string().min(1, "Título da seção Depoimentos é obrigatório"),
    testimonialsSubtitle: z.string().min(1, "Descrição da seção Depoimentos é obrigatória"),
    
    // Seção FAQ
    faqBadge: z.string().min(1, "Badge da seção FAQ é obrigatório"),
    faqTitle: z.string().min(1, "Título da seção FAQ é obrigatório"),
    faqSubtitle: z.string().min(1, "Descrição da seção FAQ é obrigatória"),
    
    // Seção Citação Inspiracional
    inspirationalQuote: z.string().min(1, "Citação inspiracional é obrigatória"),
    inspirationalAuthor: z.string().min(1, "Autor da citação é obrigatório"),
    
    // Navegação
    navHome: z.string().min(1, "Texto do menu Início é obrigatório"),
    navAbout: z.string().min(1, "Texto do menu Sobre é obrigatório"),
    navServices: z.string().min(1, "Texto do menu Serviços é obrigatório"),
    navTestimonials: z.string().min(1, "Texto do menu Depoimentos é obrigatório"),
    navFaq: z.string().min(1, "Texto do menu FAQ é obrigatório"),
    navContact: z.string().min(1, "Texto do menu Contato é obrigatório"),
  });

  type GeneralForm = z.infer<typeof generalSchema>;

  // Extrair valores das configurações de forma segura
  const getConfigData = () => {
    const generalInfo = configs?.find(c => c.key === 'general_info')?.value as any || {};
    const contactInfo = configs?.find(c => c.key === 'contact_info')?.value as any || {};
    const maintenanceInfo = configs?.find(c => c.key === 'maintenance_mode')?.value as any || {};
    const heroSection = configs?.find(c => c.key === 'hero_section')?.value as any || {};
    const aboutSection = configs?.find(c => c.key === 'about_section')?.value as any || {};
    const servicesSection = configs?.find(c => c.key === 'services_section')?.value as any || {};
    const testimonialsSection = configs?.find(c => c.key === 'testimonials_section')?.value as any || {};
    const faqSection = configs?.find(c => c.key === 'faq_section')?.value as any || {};
    const contactSection = configs?.find(c => c.key === 'contact_section')?.value as any || {};
    const inspirationalSection = configs?.find(c => c.key === 'inspirational_section')?.value as any || {};

    return {
      // Informações básicas
      name: generalInfo.name || "Dra. Adrielle Benhossi",
      crp: generalInfo.crp || "08/123456",
      siteName: generalInfo.siteName || "Dra. Adrielle Benhossi - Psicóloga",
      description: generalInfo.description || "Psicóloga CRP 08/123456",
      location: generalInfo.location || "Campo Mourão, Paraná",
      phone: contactInfo.phone || "(44) 998-362-704",
      email: contactInfo.email || "escutapsi@adrielle.com.br",
      whatsapp: contactInfo.whatsapp || "5544998362704",
      instagram: contactInfo.instagram || "@adriellebenhossi",
      linkedin: contactInfo.linkedin || "linkedin.com/in/adrielle-benhossi-75510034a",
      
      // Controle de Manutenção
      maintenanceMode: maintenanceInfo.enabled || false,
      maintenanceTitle: maintenanceInfo.title || "Site em Manutenção",
      maintenanceMessage: maintenanceInfo.message || "Estamos fazendo algumas melhorias. Voltaremos em breve!",
      
      // Seção Hero
      heroTitle: heroSection.title || "Cuidando da sua saúde mental com carinho",
      heroSubtitle: heroSection.subtitle || "Psicóloga especializada em terapia cognitivo-comportamental",
      buttonText1: heroSection.buttonText1 || "Agendar consulta",
      buttonText2: heroSection.buttonText2 || "Saiba mais",
      
      // Seção Sobre
      aboutTitle: aboutSection.title || "Sobre Mim",
      aboutSubtitle: aboutSection.subtitle || "Psicóloga dedicada ao seu bem-estar",
      aboutDescription: aboutSection.description || "Com experiência em terapia cognitivo-comportamental, ofereço um espaço seguro e acolhedor para você trabalhar suas questões emocionais e desenvolver ferramentas para uma vida mais equilibrada.",
      aboutCredentials: aboutSection.credentials || "CRP 08/123456 • Centro Universitário Integrado",
      // Card de Agendamento
      schedulingCardTitle: contactSection.schedulingCardTitle || "Vamos conversar?",
      schedulingCardDescription: contactSection.schedulingCardDescription || "Juntas, vamos caminhar em direção ao seu bem-estar e crescimento pessoal, em um espaço de acolhimento e cuidado",
      schedulingCardButton: contactSection.schedulingCardButton || "AGENDAMENTO",
      
      // Seção Serviços
      servicesTitle: servicesSection.title || "Serviços",
      servicesSubtitle: servicesSection.subtitle || "Cuidado especializado para cada necessidade",
      servicesDescription: servicesSection.description || "Cuidado personalizado e acolhedor para nutrir seu bem-estar emocional e mental",
      
      // Seção Depoimentos
      testimonialsBadge: testimonialsSection.badge || "DEPOIMENTOS",
      testimonialsTitle: testimonialsSection.title || "Histórias de transformação",
      testimonialsSubtitle: testimonialsSection.subtitle || "Experiências reais de pessoas que encontraram equilíbrio e bem-estar através do acompanhamento psicológico",
      
      // Seção FAQ
      faqBadge: faqSection.badge || "DÚVIDAS FREQUENTES",
      faqTitle: faqSection.title || "Respondemos suas principais dúvidas",
      faqSubtitle: faqSection.subtitle || "Esclarecimentos importantes sobre como funciona o processo de acompanhamento psicológico",
      
      // Seção Citação Inspiracional
      inspirationalQuote: inspirationalSection.quote || "A cura acontece quando permitimos que nossa vulnerabilidade se transforme em força, e nossos medos em oportunidades de crescimento.",
      inspirationalAuthor: inspirationalSection.author || "Adrielle Benhossi",
      
      // Navegação
      navHome: generalInfo.navHome || "Início",
      navAbout: generalInfo.navAbout || "Sobre",
      navServices: generalInfo.navServices || "Serviços",
      navTestimonials: generalInfo.navTestimonials || "Depoimentos",
      navFaq: generalInfo.navFaq || "FAQ",
      navContact: generalInfo.navContact || "Contato",
    };
  };

  const form = useForm<GeneralForm>({
    resolver: zodResolver(generalSchema),
    defaultValues: getConfigData(),
  });

  // Atualiza o formulário quando as configurações mudam
  React.useEffect(() => {
    if (configs && configs.length > 0) {
      const newData = getConfigData();
      form.reset(newData);
    }
  }, [configs, form]);



  const updateMutation = useMutation({
    mutationFn: async (data: GeneralForm) => {
      const promises = [
        // Informações básicas
        apiRequest("POST", "/api/admin/config", {
          key: "general_info",
          value: {
            name: data.name,
            crp: data.crp,
            siteName: data.siteName,
            description: data.description,
            location: data.location,
            navHome: data.navHome,
            navAbout: data.navAbout,
            navServices: data.navServices,
            navTestimonials: data.navTestimonials,
            navFaq: data.navFaq,
            navContact: data.navContact,
          }
        }),
        apiRequest("POST", "/api/admin/config", {
          key: "contact_info",
          value: {
            phone: data.phone,
            email: data.email,
            whatsapp: data.whatsapp,
            instagram: data.instagram,
            linkedin: data.linkedin,
          }
        }),
        // Controle de manutenção
        apiRequest("POST", "/api/admin/config", {
          key: "maintenance_mode",
          value: {
            enabled: data.maintenanceMode,
            title: data.maintenanceTitle,
            message: data.maintenanceMessage,
          }
        }),
        // Seções do site
        apiRequest("POST", "/api/admin/config", {
          key: "hero_section",
          value: {
            title: data.heroTitle,
            subtitle: data.heroSubtitle,
            buttonText1: data.buttonText1,
            buttonText2: data.buttonText2,
          }
        }),
        apiRequest("POST", "/api/admin/config", {
          key: "about_section",
          value: {
            title: data.aboutTitle,
            subtitle: data.aboutSubtitle,
            description: data.aboutDescription,
            credentials: data.aboutCredentials,
          }
        }),
        apiRequest("POST", "/api/admin/config", {
          key: "services_section",
          value: {
            title: data.servicesTitle,
            subtitle: data.servicesSubtitle,
            description: data.servicesDescription,
          }
        }),
        apiRequest("POST", "/api/admin/config", {
          key: "testimonials_section",
          value: {
            badge: data.testimonialsBadge,
            title: data.testimonialsTitle,
            subtitle: data.testimonialsSubtitle,
          }
        }),
        apiRequest("POST", "/api/admin/config", {
          key: "faq_section",
          value: {
            badge: data.faqBadge,
            title: data.faqTitle,
            subtitle: data.faqSubtitle,
          }
        }),
        apiRequest("POST", "/api/admin/config", {
          key: "contact_section",
          value: {
            schedulingCardTitle: data.schedulingCardTitle,
            schedulingCardDescription: data.schedulingCardDescription,
            schedulingCardButton: data.schedulingCardButton,
          }
        }),
        apiRequest("POST", "/api/admin/config", {
          key: "inspirational_section",
          value: {
            quote: data.inspirationalQuote,
            author: data.inspirationalAuthor,
          }
        })
      ];
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      toast({ title: "Configurações atualizadas com sucesso!" });
    },
  });

  const onSubmit = (data: GeneralForm) => {
    updateMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Controle de Manutenção */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">🚧 Controle de Manutenção</h3>
          <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800">
              ⚠️ <strong>Importante:</strong> Ao ativar o modo de manutenção, o site não será exibido publicamente. 
              Apenas uma página de manutenção será mostrada aos visitantes. O painel administrativo continuará funcionando normalmente.
            </p>
          </div>
          
          {/* Status atual do modo de manutenção */}
          <div className="mb-4">
            {form.watch("maintenanceMode") ? (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-sm text-red-800">
                  🚨 <strong>MODO DE MANUTENÇÃO ATIVO</strong> - O site não está sendo exibido publicamente.
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm text-green-800">
                  ✅ <strong>Site Público Ativo</strong> - Seu site está sendo exibido normalmente para os visitantes.
                </div>
              </div>
            )}
          </div>

          <FormField
            control={form.control}
            name="maintenanceMode"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-medium">🔧 Modo de Manutenção</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Ativa/desativa o modo de manutenção do site
                  </div>
                </div>
                <FormControl>
                  <Switch 
                    checked={field.value} 
                    onCheckedChange={(checked) => {
                      if (checked) {
                        // Confirma antes de ativar
                        const confirmed = window.confirm(
                          "⚠️ ATENÇÃO!\n\nAo ativar o modo de manutenção:\n" +
                          "• O site ficará INVISÍVEL para todos os visitantes\n" +
                          "• Apenas uma página de manutenção será exibida\n" +
                          "• O painel administrativo continuará funcionando\n" +
                          "• Você pode desativar a qualquer momento\n\n" +
                          "Tem certeza que deseja continuar?"
                        );
                        if (confirmed) {
                          field.onChange(checked);
                          // Submete o formulário automaticamente quando altera o modo de manutenção
                          setTimeout(() => {
                            form.handleSubmit(onSubmit)();
                          }, 100);
                        }
                      } else {
                        // Confirma antes de desativar também
                        const confirmed = window.confirm(
                          "✅ REATIVAR SITE\n\nDeseja reativar o site?\n" +
                          "• O site voltará a ser exibido publicamente\n" +
                          "• Visitantes poderão acessar normalmente\n" +
                          "• O modo de manutenção será desativado\n\n" +
                          "Confirma a reativação?"
                        );
                        if (confirmed) {
                          field.onChange(checked);
                          // Submete o formulário automaticamente quando altera o modo de manutenção
                          setTimeout(() => {
                            form.handleSubmit(onSubmit)();
                          }, 100);
                        }
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {form.watch("maintenanceMode") && (
            <div className="grid grid-cols-1 gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-red-800 mb-2">
                🚨 <strong>Configure a mensagem de manutenção:</strong>
              </div>
              <FormField
                control={form.control}
                name="maintenanceTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título da Página de Manutenção</FormLabel>
                    <FormControl>
                      <Input placeholder="Site em Manutenção" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maintenanceMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem de Manutenção</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Estamos fazendo algumas melhorias. Voltaremos em breve!" 
                        rows={3} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* Informações Básicas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">📋 Informações Básicas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Psicóloga</FormLabel>
                  <FormControl>
                    <Input placeholder="Dra. Adrielle Benhossi" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nome completo que aparece no cabeçalho e navegação do site
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="crp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CRP (Campo Prioritário)</FormLabel>
                  <FormControl>
                    <Input placeholder="08/123456" {...field} />
                  </FormControl>
                  <FormDescription>
                    Número do CRP que aparece automaticamente em navegação, sobre e footer
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="siteName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Site</FormLabel>
                  <FormControl>
                    <Input placeholder="Dra. Adrielle Benhossi - Psicóloga" {...field} />
                  </FormControl>
                  <FormDescription>
                    Título principal usado para SEO, compartilhamentos e identificação geral
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Psicóloga CRP 08/123456" {...field} />
                  </FormControl>
                  <FormDescription>
                    Descrição breve para buscadores e redes sociais quando compartilharem o site
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localização</FormLabel>
                  <FormControl>
                    <Input placeholder="Campo Mourão, Paraná" {...field} />
                  </FormControl>
                  <FormDescription>
                    Cidade onde você atende - aparece na seção sobre e contato
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Informações de Contato */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">📞 Informações de Contato</h3>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>Dica:</strong> Estes contatos aparecem em várias seções do site: botões de agendamento, 
              seção de contato, footer e links de redes sociais. Mantenha sempre atualizados.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(44) 998-362-704" {...field} />
                  </FormControl>
                  <FormDescription>
                    Número principal de contato - aparece na seção contato e footer
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="escutapsi@adrielle.com.br" {...field} />
                  </FormControl>
                  <FormDescription>
                    Email profissional - usado em contatos e botão "enviar email"
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <Input placeholder="5544998362704" {...field} />
                  </FormControl>
                  <FormDescription>
                    Número com código do país (55) - para botões "Agendar consulta"
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <Input placeholder="@adriellebenhossi" {...field} />
                  </FormControl>
                  <FormDescription>
                    Handle do Instagram com @ - cria link direto no footer e contato
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                    <Input placeholder="linkedin.com/in/adrielle-benhossi-75510034a" {...field} />
                  </FormControl>
                  <FormDescription>
                    URL completo do perfil LinkedIn - aparece como link no footer
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Textos da Seção Hero */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">🏠 Seção Hero (Principal)</h3>
          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              🎯 <strong>Primeira Impressão:</strong> Esta é a primeira seção que os visitantes veem. 
              Use linguagem acolhedora e transmita confiança. Os botões direcionam para WhatsApp e seção "Sobre".
            </p>
          </div>
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-800">
              🎨 <strong>Efeito Degradê:</strong> Use (palavra) para aplicar cores degradê automáticas nos títulos. 
              Exemplo: "Cuidando da sua (saúde mental)" → "saúde mental" fica colorido.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="heroTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título Principal ()</FormLabel>
                  <FormControl>
                    <Input placeholder="Cuidando da sua saúde mental com carinho" {...field} />
                  </FormControl>
                  <FormDescription>
                    Frase de impacto que define sua abordagem profissional. Use (texto) para aplicar efeito degradê colorido nas palavras entre parênteses.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="heroSubtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtítulo</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Psicóloga especializada em terapia cognitivo-comportamental..." rows={3} {...field} />
                  </FormControl>
                  <FormDescription>
                    Descrição mais detalhada sobre sua especialização e abordagem terapêutica
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="buttonText1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto Botão 1 (WhatsApp)</FormLabel>
                    <FormControl>
                      <Input placeholder="Agendar consulta" {...field} />
                    </FormControl>
                    <FormDescription>
                      Botão principal que leva para a seção de contato com todas as formas de agendamento
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="buttonText2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto Botão 2 (Navegação)</FormLabel>
                    <FormControl>
                      <Input placeholder="Saiba mais" {...field} />
                    </FormControl>
                    <FormDescription>
                      Botão que rola a página para a seção "Sobre"
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Textos da Seção Sobre */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">👩‍⚕️ Seção Sobre</h3>
          <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-800">
              👤 <strong>Credibilidade:</strong> Esta seção constrói confiança mostrando formação, experiência e abordagem. 
              Use linguagem profissional mas acessível para conectar com os pacientes.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="aboutTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da Seção Sobre ()</FormLabel>
                  <FormControl>
                    <Input placeholder="Sobre Dra. Adrielle Benhossi" {...field} />
                  </FormControl>
                  <FormDescription>
                    Cabeçalho da seção sobre você. Use (palavra) para efeito degradê colorido. Ex: "Sobre (Dra. Adrielle)"
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aboutSubtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtítulo da Seção Sobre</FormLabel>
                  <FormControl>
                    <Input placeholder="Psicóloga CRP 08/123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aboutDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição Principal</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Formada em Psicologia pelo Centro Universitário Integrado..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
          </div>
        </div>

        {/* Textos da Seção Serviços */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">💼 Seção Serviços</h3>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="servicesTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da Seção Serviços ()</FormLabel>
                  <FormControl>
                    <Input placeholder="Serviços Oferecidos" {...field} />
                  </FormControl>
                  <FormDescription>
                    Cabeçalho da seção de serviços. Use (palavra) para efeito degradê. Ex: "Meus (Serviços)"
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="servicesSubtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtítulo da Seção Serviços</FormLabel>
                  <FormControl>
                    <Input placeholder="Cuidado personalizado para cada necessidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="servicesDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição da Seção Serviços</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ofereço diversos tipos de atendimento psicológico..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Textos da Seção Depoimentos */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">💬 Seção Depoimentos</h3>
          <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-800">
              💭 <strong>Estrutura:</strong> Badge (pequeno texto) + Título principal + Descrição.
              Use (palavra) no título para efeito degradê colorido.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="testimonialsBadge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Badge da Seção</FormLabel>
                  <FormControl>
                    <Input placeholder="DEPOIMENTOS" {...field} />
                  </FormControl>
                  <FormDescription>
                    Pequeno texto em destaque acima do título principal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="testimonialsTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da Seção Depoimentos ()</FormLabel>
                  <FormControl>
                    <Input placeholder="Histórias de transformação" {...field} />
                  </FormControl>
                  <FormDescription>
                    Título principal dos depoimentos. Use (palavra) para degradê. Ex: "Histórias de (transformação)"
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="testimonialsSubtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição da Seção</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Experiências reais de pessoas que encontraram equilíbrio e bem-estar através do acompanhamento psicológico" rows={3} {...field} />
                  </FormControl>
                  <FormDescription>
                    Descrição explicativa sobre os depoimentos apresentados
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Textos da Seção FAQ */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">❓ Seção FAQ</h3>
          <div className="mb-4 p-4 bg-pink-50 rounded-lg border border-pink-200">
            <p className="text-sm text-pink-800">
              ❓ <strong>Estrutura:</strong> Badge (pequeno texto) + Título principal + Descrição.
              Use (palavra) no título para efeito degradê colorido.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="faqBadge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Badge da Seção</FormLabel>
                  <FormControl>
                    <Input placeholder="DÚVIDAS FREQUENTES" {...field} />
                  </FormControl>
                  <FormDescription>
                    Pequeno texto em destaque acima do título principal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="faqTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da Seção FAQ ()</FormLabel>
                  <FormControl>
                    <Input placeholder="Respondemos suas principais dúvidas" {...field} />
                  </FormControl>
                  <FormDescription>
                    Título principal das perguntas frequentes. Use (palavra) para degradê. Ex: "Respondemos suas (principais dúvidas)"
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="faqSubtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição da Seção</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Esclarecimentos importantes sobre como funciona o processo de acompanhamento psicológico" rows={3} {...field} />
                  </FormControl>
                  <FormDescription>
                    Descrição explicativa sobre as perguntas frequentes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Card de Agendamento */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">💬 Card de Agendamento</h3>
          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              💡 <strong>Card "Vamos conversar?":</strong> Estes textos aparecem no card de agendamento na seção de contato. 
              Use (palavra) no título para efeito degradê colorido.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="schedulingCardTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Card de Agendamento ()</FormLabel>
                  <FormControl>
                    <Input placeholder="Vamos conversar?" {...field} />
                  </FormControl>
                  <FormDescription>
                    Título principal do card. Use (palavra) para efeito degradê. Ex: "Vamos (conversar)?"
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="schedulingCardDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição do Card</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Juntas, vamos caminhar em direção ao seu bem-estar..." rows={3} {...field} />
                  </FormControl>
                  <FormDescription>
                    Texto explicativo que aparece abaixo do título
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="schedulingCardButton"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto do Botão de Agendamento</FormLabel>
                  <FormControl>
                    <Input placeholder="AGENDAMENTO" {...field} />
                  </FormControl>
                  <FormDescription>
                    Texto que aparece no pequeno badge acima do título
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        

        {/* Seção Citação Inspiracional */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">💭 Seção Citação Inspiracional</h3>
          <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-800">
              💡 <strong>Citação Motivacional:</strong> Esta seção aparece no final do site com uma frase inspiracional. 
              Use citações próprias ou de referências que transmitam esperança e motivação aos visitantes.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="inspirationalQuote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Citação Inspiracional</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A cura acontece quando permitimos que nossa vulnerabilidade se transforme em força..." rows={3} {...field} />
                  </FormControl>
                  <FormDescription>
                    Frase motivacional que aparece destacada na seção de citações
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="inspirationalAuthor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Autor da Citação</FormLabel>
                  <FormControl>
                    <Input placeholder="Adrielle Benhossi" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nome do autor que aparece abaixo da citação
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        

        {/* Textos da Navegação */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">🧭 Menu de Navegação</h3>
          <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              ⚠️ <strong>Importante:</strong> Estes campos alteram apenas os <strong>nomes dos botões</strong> do menu de navegação. 
              As funções e seções do site permanecem as mesmas. Por exemplo, se você mudar "Serviços" para "Atendimentos", 
              o botão mostrará "Atendimentos" mas ainda levará para a seção de serviços.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="navHome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu: Início</FormLabel>
                  <FormControl>
                    <Input placeholder="Início" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="navAbout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu: Sobre</FormLabel>
                  <FormControl>
                    <Input placeholder="Sobre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="navServices"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu: Serviços</FormLabel>
                  <FormControl>
                    <Input placeholder="Serviços" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="navTestimonials"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu: Depoimentos</FormLabel>
                  <FormControl>
                    <Input placeholder="Depoimentos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="navFaq"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu: FAQ</FormLabel>
                  <FormControl>
                    <Input placeholder="FAQ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="navContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu: Contato</FormLabel>
                  <FormControl>
                    <Input placeholder="Contato" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>



        {/* Upload de Foto de Perfil Hero */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">📸 Foto de Perfil</h3>
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Foto de Perfil Principal
            </h4>
            <p className="text-sm text-muted-foreground">
              <strong>📸 Foto Unificada:</strong> Esta foto aparecerá automaticamente em <strong>todas as seções</strong> do site:
              <br />• <strong>Header</strong> (navegação superior)
              <br />• <strong>Hero</strong> (seção principal da página)
              <br />• <strong>Footer</strong> (rodapé do site)
              <br />• <strong>Seção Sobre</strong> (apresentação profissional)
              <br /><br />
              No mobile, a foto ocupará toda a largura com efeito de transição suave.
              Use o botão "Voltar ao avatar original" para restaurar o avatar padrão.
            </p>
            <HeroImageUpload />
          </div>
        </div>

        <Button type="submit" disabled={updateMutation.isPending} className="w-full">
          {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </form>
    </Form>
  );
}

// Componente para gerenciar credenciais da seção Sobre
function AboutCredentialsManager({ configs }: { configs: SiteConfig[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localCredentials, setLocalCredentials] = useState<any[]>([]);

  // Sensores otimizados para mobile e desktop
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Buscar credenciais das configurações
  const aboutCredentials = configs?.find(c => c.key === 'about_credentials')?.value as any[] || [];

  // Atualiza credenciais locais quando dados mudam
  useEffect(() => {
    const sortedCredentials = [...aboutCredentials].sort((a, b) => a.order - b.order);
    setLocalCredentials(sortedCredentials);
  }, [aboutCredentials]);

  const credentialSchema = z.object({
    title: z.string().min(1, "Título é obrigatório"),
    subtitle: z.string().min(1, "Subtítulo é obrigatório"),
    gradient: z.string().min(1, "Gradiente é obrigatório"),
    isActive: z.boolean(),
    order: z.number().min(0),
  });

  type CredentialForm = z.infer<typeof credentialSchema>;

  const form = useForm<CredentialForm>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      gradient: "from-pink-50 to-purple-50",
      isActive: true,
      order: 0,
    },
  });

  const updateCredentialsMutation = useMutation({
    mutationFn: async (newCredentials: any[]) => {
      const response = await apiRequest("POST", "/api/admin/config", {
        key: "about_credentials",
        value: newCredentials
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      toast({ title: "Credenciais atualizadas com sucesso!" });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = localCredentials.findIndex((item) => item.id === active.id);
      const newIndex = localCredentials.findIndex((item) => item.id === over.id);
      
      const newCredentials = arrayMove(localCredentials, oldIndex, newIndex).map((item, index) => ({
        ...item,
        order: index
      }));
      
      setLocalCredentials(newCredentials);
      updateCredentialsMutation.mutate(newCredentials);
    }
  };

  const onSubmit = (data: CredentialForm) => {
    let newCredentials;
    
    if (editingItem) {
      // Editando item existente
      newCredentials = localCredentials.map(item => 
        item.id === editingItem.id ? { ...item, ...data } : item
      );
    } else {
      // Criando novo item
      const newId = Math.max(...localCredentials.map(c => c.id), 0) + 1;
      const newItem = {
        id: newId,
        ...data,
        order: localCredentials.length
      };
      newCredentials = [...localCredentials, newItem];
    }
    
    updateCredentialsMutation.mutate(newCredentials);
  };

  const openEditDialog = (credential: any) => {
    setEditingItem(credential);
    
    setTimeout(() => {
      form.setValue("title", credential.title || "");
      form.setValue("subtitle", credential.subtitle || "");
      form.setValue("gradient", credential.gradient || "from-pink-50 to-purple-50");
      form.setValue("isActive", credential.isActive ?? true);
      form.setValue("order", credential.order || 0);
    }, 100);
    
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    form.reset({
      title: "",
      subtitle: "",
      gradient: "from-pink-50 to-purple-50",
      isActive: true,
      order: localCredentials.length,
    });
    setIsDialogOpen(true);
  };

  const deleteCredential = (id: number) => {
    const newCredentials = localCredentials
      .filter(item => item.id !== id)
      .map((item, index) => ({ ...item, order: index }));
    updateCredentialsMutation.mutate(newCredentials);
  };

  const gradientOptions = [
    { name: "Rosa para Roxo", value: "from-pink-50 to-purple-50" },
    { name: "Roxo para Índigo", value: "from-purple-50 to-indigo-50" },
    { name: "Verde para Teal", value: "from-green-50 to-teal-50" },
    { name: "Azul para Cyan", value: "from-blue-50 to-cyan-50" },
    { name: "Laranja para Vermelho", value: "from-orange-50 to-red-50" },
    { name: "Amarelo para Laranja", value: "from-yellow-50 to-orange-50" },
    { name: "Teal para Verde", value: "from-teal-50 to-green-50" },
    { name: "Índigo para Roxo", value: "from-indigo-50 to-purple-50" },
    { name: "Cinza para Slate", value: "from-gray-50 to-slate-50" },
    { name: "Rosa para Rosa Escuro", value: "from-pink-50 to-pink-100" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Credenciais da Seção Sobre</h3>
          <p className="text-sm text-muted-foreground">
            Cards que aparecem na seção sobre a psicóloga com formação, especializações, etc.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Credencial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Credencial" : "Nova Credencial"}
              </DialogTitle>
              <DialogDescription>
                Configure as informações da credencial
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título Principal</FormLabel>
                      <FormControl>
                        <Input placeholder="Centro Universitário Integrado" {...field} />
                      </FormControl>
                      <FormDescription>
                        Texto principal que aparece em destaque no card
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtítulo/Categoria</FormLabel>
                      <FormControl>
                        <Input placeholder="Formação Acadêmica" {...field} />
                      </FormControl>
                      <FormDescription>
                        Categoria ou tipo da credencial (aparece menor abaixo do título)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gradient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gradiente de Fundo</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha um gradiente" />
                          </SelectTrigger>
                          <SelectContent>
                            {gradientOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className={`w-4 h-4 rounded border bg-gradient-to-br ${option.value}`}
                                  />
                                  {option.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Cor de fundo do card da credencial
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordem</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Ativo</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Exibir esta credencial
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateCredentialsMutation.isPending}>
                    {editingItem ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 <strong>Dica:</strong> Você pode arrastar e soltar as credenciais para reordenar sua exibição no site
        </p>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={localCredentials.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {localCredentials.map((credential) => (
              <SortableCredentialItem 
                key={credential.id} 
                credential={credential}
                onEdit={() => openEditDialog(credential)}
                onDelete={() => deleteCredential(credential.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {localCredentials.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhuma credencial cadastrada ainda.</p>
          <p className="text-sm">Clique em "Nova Credencial" para começar.</p>
        </div>
      )}
    </div>
  );
}

// Componente para item arrastável de credencial
function SortableCredentialItem({ credential, onEdit, onDelete }: { 
  credential: any; 
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: credential.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4 cursor-move">
      <div className="flex justify-between items-start">
        <div className="flex-1 flex items-start gap-4">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className={`w-6 h-6 rounded bg-gradient-to-br ${credential.gradient} border`}
              />
              <h4 className="font-semibold">{credential.title}</h4>
              <Badge variant={credential.isActive ? "default" : "secondary"} className="text-xs">
                {credential.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{credential.subtitle}</p>
            <p className="text-xs text-gray-400 mt-1">Ordem: {credential.order}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function TestimonialsManager({ testimonials }: { testimonials: Testimonial[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Sensores otimizados para mobile e desktop
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = testimonials.findIndex((item) => item.id === active.id);
      const newIndex = testimonials.findIndex((item) => item.id === over.id);
      
      const newOrder = arrayMove(testimonials, oldIndex, newIndex);
      
      // Atualiza as ordens no backend
      const updatePromises = newOrder.map((item, index) => 
        apiRequest("PUT", `/api/admin/testimonials/${item.id}`, { 
          order: index
        })
      );
      
      Promise.all(updatePromises).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
        toast({ title: "Ordem dos depoimentos atualizada!" });
      }).catch(() => {
        toast({ title: "Erro ao atualizar ordem", variant: "destructive" });
      });
    }
  };

  const testimonialSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    service: z.string().min(1, "Serviço é obrigatório"),
    testimonial: z.string().min(1, "Depoimento é obrigatório"),
    rating: z.number().min(1).max(5),
    gender: z.string().min(1, "Gênero é obrigatório"),
    photo: z.string().optional(),
    isActive: z.boolean(),
    order: z.number().min(0),
  });

  type TestimonialForm = z.infer<typeof testimonialSchema>;

  const form = useForm<TestimonialForm>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      name: "",
      service: "",
      testimonial: "",
      rating: 5,
      gender: "maria",
      photo: "",
      isActive: true,
      order: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TestimonialForm) => apiRequest("/api/admin/testimonials", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      toast({ title: "Depoimento criado com sucesso!" });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TestimonialForm> }) => 
      apiRequest(`/api/admin/testimonials/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      toast({ title: "Depoimento atualizado com sucesso!" });
      setEditingItem(null);
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/testimonials/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      toast({ title: "Depoimento excluído com sucesso!" });
    },
  });

  const onSubmit = (data: TestimonialForm) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (testimonial: Testimonial) => {
    setEditingItem(testimonial);
    
    // Log para debug
    console.log("Editando depoimento:", testimonial);
    
    // Popula o formulário campo por campo
    setTimeout(() => {
      form.setValue("name", testimonial.name || "");
      form.setValue("service", testimonial.service || "");
      form.setValue("testimonial", testimonial.testimonial || "");
      form.setValue("rating", testimonial.rating || 5);
      form.setValue("gender", testimonial.gender || "maria");
      form.setValue("photo", testimonial.photo || "");
      form.setValue("isActive", testimonial.isActive ?? true);
      form.setValue("order", testimonial.order || 0);
    }, 100);
    
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    form.reset();
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Depoimentos
            </CardTitle>
            <CardDescription>
              Gerencie os depoimentos exibidos no site
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Depoimento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Editar Depoimento" : "Novo Depoimento"}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações do depoimento
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do cliente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="service"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Serviço</FormLabel>
                          <FormControl>
                            <Input placeholder="Tipo de serviço" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="testimonial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Depoimento</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Texto do depoimento" rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avaliação</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1 estrela</SelectItem>
                              <SelectItem value="2">2 estrelas</SelectItem>
                              <SelectItem value="3">3 estrelas</SelectItem>
                              <SelectItem value="4">4 estrelas</SelectItem>
                              <SelectItem value="5">5 estrelas</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avatar</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-80">
                              {/* Mulheres */}
                              <SelectItem value="maria">👩 Maria (Mulher Jovem)</SelectItem>
                              <SelectItem value="woman-adult">👩‍💼 Mulher Adulta</SelectItem>
                              <SelectItem value="woman-mature">👩‍🦳 Mulher Madura</SelectItem>
                              <SelectItem value="woman-elderly">👵 Idosa</SelectItem>
                              <SelectItem value="woman-professional">👩‍⚕️ Mulher Profissional</SelectItem>
                              <SelectItem value="woman-student">👩‍🎓 Universitária</SelectItem>
                              
                              {/* Homens */}
                              <SelectItem value="male">👨 Homem Jovem</SelectItem>
                              <SelectItem value="man-adult">👨‍💼 Homem Adulto</SelectItem>
                              <SelectItem value="man-mature">👨‍🦳 Homem Maduro</SelectItem>
                              <SelectItem value="man-elderly">👴 Idoso</SelectItem>
                              <SelectItem value="man-professional">👨‍⚕️ Homem Profissional</SelectItem>
                              <SelectItem value="man-student">👨‍🎓 Universitário</SelectItem>
                              <SelectItem value="man-beard">🧔 Homem com Barba</SelectItem>
                              
                              {/* Crianças e Adolescentes */}
                              <SelectItem value="girl-child">👧 Menina (6-12 anos)</SelectItem>
                              <SelectItem value="boy-child">👦 Menino (6-12 anos)</SelectItem>
                              <SelectItem value="girl-teen">👧‍🦱 Adolescente Menina</SelectItem>
                              <SelectItem value="boy-teen">👦‍🦱 Adolescente Menino</SelectItem>
                              <SelectItem value="childtherapy">👨‍👧‍👦 Terapia Infantil (Pai e Filhos)</SelectItem>
                              
                              {/* Bebês e Primeira Infância */}
                              <SelectItem value="baby-girl">👶 Bebê Menina</SelectItem>
                              <SelectItem value="baby-boy">👶 Bebê Menino</SelectItem>
                              <SelectItem value="toddler-girl">🧒 Criança Pequena (Menina)</SelectItem>
                              <SelectItem value="toddler-boy">🧒 Criança Pequena (Menino)</SelectItem>
                              
                              {/* Casais e Famílias */}
                              <SelectItem value="couple">👫 Casal Jovem</SelectItem>
                              <SelectItem value="couple-mature">👫 Casal Maduro</SelectItem>
                              <SelectItem value="couple-elderly">👴👵 Casal Idoso</SelectItem>
                              <SelectItem value="family-nuclear">👨‍👩‍👧‍👦 Família Nuclear</SelectItem>
                              <SelectItem value="family-single-mom">👩‍👧‍👦 Mãe Solo</SelectItem>
                              <SelectItem value="family-single-dad">👨‍👧‍👦 Pai Solo</SelectItem>
                              <SelectItem value="family-grandparents">👴👵👶 Avós e Neto</SelectItem>
                              
                              {/* Diversidade */}
                              <SelectItem value="person-wheelchair">🧑‍🦽 Pessoa com Deficiência</SelectItem>
                              <SelectItem value="person-guide-dog">🧑‍🦮 Pessoa com Cão-Guia</SelectItem>
                              <SelectItem value="person-mixed">🧑‍🤝‍🧑 Pessoa de Etnia Mista</SelectItem>
                              <SelectItem value="transgender">🏳️‍⚧️ Pessoa Transgênero</SelectItem>
                              
                              {/* Profissões e Situações */}
                              <SelectItem value="healthcare-worker">👩‍⚕️ Profissional de Saúde</SelectItem>
                              <SelectItem value="teacher">👩‍🏫 Professor(a)</SelectItem>
                              <SelectItem value="executive">👨‍💼 Executivo(a)</SelectItem>
                              <SelectItem value="artist">👩‍🎨 Artista</SelectItem>
                              <SelectItem value="athlete">🏃‍♀️ Atleta</SelectItem>
                              <SelectItem value="entrepreneur">👩‍💻 Empreendedor(a)</SelectItem>
                              
                              {/* Situações Específicas */}
                              <SelectItem value="new-parent">👶👨‍👩 Pais de Primeira Viagem</SelectItem>
                              <SelectItem value="divorce-recovery">💔 Pessoa em Divórcio</SelectItem>
                              <SelectItem value="grief-support">😢 Luto e Perda</SelectItem>
                              <SelectItem value="anxiety-support">😰 Ansiedade</SelectItem>
                              <SelectItem value="depression-support">😔 Depressão</SelectItem>
                              <SelectItem value="ptsd-support">🛡️ Trauma/PTSD</SelectItem>
                              
                              {/* Grupos Especiais */}
                              <SelectItem value="lgbtq">🏳️‍🌈 Comunidade LGBTQ+</SelectItem>
                              <SelectItem value="immigrants">🌍 Imigrantes</SelectItem>
                              <SelectItem value="veterans">🎖️ Veteranos</SelectItem>
                              <SelectItem value="first-responders">🚑 Primeiros Socorros</SelectItem>
                              
                              {/* Diversão/Únicos */}
                              <SelectItem value="darthvader">🤖 Robô/Darth Vader</SelectItem>
                              <SelectItem value="superhero">🦸‍♀️ Super-Herói</SelectItem>
                              <SelectItem value="anonymous">👤 Anônimo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="order"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ordem</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Campo de Upload de Foto Personalizada */}
                  <FormField
                    control={form.control}
                    name="photo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Image className="w-4 h-4" />
                          Foto Personalizada (Opcional)
                        </FormLabel>
                        <FormControl>
                          <TestimonialImageUpload 
                            value={field.value} 
                            onChange={field.onChange} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Ativo</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Exibir este depoimento no site
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingItem ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>Dica:</strong> Você pode arrastar e soltar os depoimentos para reordenar sua exibição no site
          </p>
        </div>
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={testimonials.map(item => item.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {testimonials
                .sort((a, b) => a.order - b.order)
                .map((testimonial) => (
                <SortableTestimonialItem 
                  key={testimonial.id} 
                  testimonial={testimonial}
                  onEdit={() => {
                    setEditingItem(testimonial);
                    form.reset({
                      name: testimonial.name,
                      service: testimonial.service,
                      testimonial: testimonial.testimonial,
                      rating: testimonial.rating,
                      gender: testimonial.gender,
                      photo: testimonial.photo || "",
                      isActive: testimonial.isActive,
                      order: testimonial.order,
                    });
                    setIsDialogOpen(true);
                  }}
                  onDelete={() => deleteMutation.mutate(testimonial.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}



// Componente de item arrastável para Depoimentos
function SortableTestimonialItem({ testimonial, onEdit, onDelete }: { 
  testimonial: Testimonial; 
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: testimonial.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4 cursor-move">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
            <h4 className="font-semibold">{testimonial.name}</h4>
            <Badge variant={testimonial.isActive ? "default" : "secondary"} className="text-xs">
              {testimonial.isActive ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{testimonial.service}</p>
          <p className="mt-2 text-sm">{testimonial.testimonial}</p>
          <div className="flex items-center mt-2">
            <div className="flex">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="ml-2 text-sm text-muted-foreground">({testimonial.rating}/5)</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Componente de item arrastável para FAQ
function SortableFaqItem({ faq, onEdit, onDelete }: { 
  faq: FaqItem; 
  onEdit: (faq: FaqItem) => void;
  onDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: faq.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? "opacity-50" : ""}>
      <TableCell>
        <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing p-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      </TableCell>
      <TableCell className="font-medium max-w-xs truncate">{faq.question}</TableCell>
      <TableCell className="max-w-xs truncate">{faq.answer}</TableCell>
      <TableCell>
        <Badge variant={faq.isActive ? "default" : "secondary"}>
          {faq.isActive ? (
            <>
              <Eye className="w-3 h-3 mr-1" />
              Ativo
            </>
          ) : (
            <>
              <EyeOff className="w-3 h-3 mr-1" />
              Inativo
            </>
          )}
        </Badge>
      </TableCell>
      <TableCell>{faq.order}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(faq)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onDelete(faq.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function FaqManager({ faqItems }: { faqItems: FaqItem[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [items, setItems] = useState<FaqItem[]>([]);

  // Sensores otimizados para mobile e desktop
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Atualiza lista local quando recebe dados
  useEffect(() => {
    setItems([...faqItems].sort((a, b) => a.order - b.order));
  }, [faqItems]);

  const faqSchema = z.object({
    question: z.string().min(1, "Pergunta é obrigatória"),
    answer: z.string().min(1, "Resposta é obrigatória"),
    isActive: z.boolean(),
    order: z.number().min(0),
  });

  type FaqForm = z.infer<typeof faqSchema>;

  const form = useForm<FaqForm>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: "",
      answer: "",
      isActive: true,
      order: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FaqForm) => {
      const response = await apiRequest("POST", "/api/admin/faq", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faq"] });
      toast({ title: "FAQ criado com sucesso!" });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FaqForm> }) => {
      const response = await apiRequest("PUT", `/api/admin/faq/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faq"] });
      toast({ title: "FAQ atualizado com sucesso!" });
      setEditingItem(null);
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/faq/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faq"] });
      toast({ title: "FAQ excluído com sucesso!" });
    },
  });

  // Função para lidar com o final do arrastar
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      
      // Atualiza a ordem local imediatamente
      setItems(newItems);
      
      // Atualiza as ordens no backend
      const updatePromises = newItems.map((item, index) => 
        apiRequest("PUT", `/api/admin/faq/${item.id}`, { 
          order: index
        })
      );
      
      Promise.all(updatePromises).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/faq"] });
        toast({ title: "Ordem das perguntas atualizada!" });
      }).catch(() => {
        toast({ title: "Erro ao atualizar ordem", variant: "destructive" });
        // Reverte em caso de erro
        setItems([...faqItems].sort((a, b) => a.order - b.order));
      });
    }
  };

  const onSubmit = (data: FaqForm) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (faq: FaqItem) => {
    setEditingItem(faq);
    
    // Log para debug
    console.log("Editando FAQ:", faq);
    
    // Popula o formulário campo por campo
    setTimeout(() => {
      form.setValue("question", faq.question || "");
      form.setValue("answer", faq.answer || "");
      form.setValue("isActive", faq.isActive ?? true);
      form.setValue("order", faq.order || 0);
    }, 100);
    
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    form.reset();
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              FAQ - Perguntas Frequentes
            </CardTitle>
            <CardDescription>
              Gerencie as perguntas e respostas exibidas no site
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Nova FAQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Editar FAQ" : "Nova FAQ"}
                </DialogTitle>
                <DialogDescription>
                  Preencha a pergunta e resposta
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="question"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pergunta</FormLabel>
                        <FormControl>
                          <Input placeholder="Como funciona a primeira consulta?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="answer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resposta</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Na primeira consulta..." rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="order"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ordem</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Ativo</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Exibir esta FAQ no site
                            </div>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingItem ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Dica:</strong> Arraste e solte as perguntas para reordenar a exibição no site.
          </p>
        </div>
        
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Pergunta</TableHead>
                <TableHead>Resposta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext 
                items={items.map(item => item.id)} 
                strategy={verticalListSortingStrategy}
              >
                {items.map((faq) => (
                  <SortableFaqItem
                    key={faq.id}
                    faq={faq}
                    onEdit={openEditDialog}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </CardContent>
    </Card>
  );
}

// Componente de item arrastável para serviços
function SortableServiceItem({ service, onEdit, onDelete }: { 
  service: Service; 
  onEdit: (service: Service) => void; 
  onDelete: (id: number) => void; 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: service.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        <span className="font-medium">{service.title}</span>
      </TableCell>
      <TableCell>{service.duration}</TableCell>
      <TableCell>{service.price}</TableCell>
      <TableCell>
        <Badge variant={service.isActive ? "default" : "secondary"}>
          {service.isActive ? (
            <>
              <Eye className="w-3 h-3 mr-1" />
              Ativo
            </>
          ) : (
            <>
              <EyeOff className="w-3 h-3 mr-1" />
              Inativo
            </>
          )}
        </Badge>
      </TableCell>
      <TableCell>{service.order}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(service)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onDelete(service.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function ServicesManager({ services }: { services: Service[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Sensores otimizados para mobile e desktop
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const serviceSchema = z.object({
    title: z.string().min(1, "Título é obrigatório"),
    description: z.string().min(1, "Descrição é obrigatória"),
    duration: z.string().optional(),
    price: z.string().optional(),
    icon: z.string().min(1, "Ícone é obrigatório"),
    gradient: z.string().min(1, "Gradiente é obrigatório"),
    showPrice: z.boolean(),
    showDuration: z.boolean(),
    isActive: z.boolean(),
    order: z.number().min(0),
  });

  type ServiceForm = z.infer<typeof serviceSchema>;

  const form = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: "",
      price: "",
      icon: "Brain",
      gradient: "from-pink-500 to-purple-600",
      showPrice: true,
      showDuration: true,
      isActive: true,
      order: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ServiceForm) => {
      const response = await apiRequest("POST", "/api/admin/services", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      toast({ title: "Serviço criado com sucesso!" });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ServiceForm> }) => {
      const response = await apiRequest("PUT", `/api/admin/services/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      toast({ title: "Serviço atualizado com sucesso!" });
      setEditingService(null);
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/services/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      toast({ title: "Serviço excluído com sucesso!" });
    },
  });
  
  // Função para lidar com o drag end dos serviços
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = services.findIndex((item) => item.id === active.id);
      const newIndex = services.findIndex((item) => item.id === over.id);
      
      const reorderedServices = arrayMove(services, oldIndex, newIndex);
      
      // Atualiza as ordens no backend
      const updatePromises = reorderedServices.map((item, index) => 
        apiRequest("PUT", `/api/admin/services/${item.id}`, { 
          order: index
        })
      );
      
      Promise.all(updatePromises).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
        toast({ title: "Ordem dos serviços atualizada!" });
      }).catch(() => {
        toast({ title: "Erro ao atualizar ordem", variant: "destructive" });
      });
    }
  };



  const onSubmit = (data: ServiceForm) => {
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    
    // Log para debug
    console.log("Editando serviço:", service);
    
    // Popula o formulário campo por campo
    setTimeout(() => {
      form.setValue("title", service.title || "");
      form.setValue("description", service.description || "");
      form.setValue("duration", service.duration || "");
      form.setValue("price", service.price || "");
      form.setValue("icon", service.icon || "Brain");
      form.setValue("gradient", service.gradient || "from-pink-500 to-purple-600");
      form.setValue("showPrice", service.showPrice ?? true);
      form.setValue("showDuration", service.showDuration ?? true);
      form.setValue("isActive", service.isActive ?? true);
      form.setValue("order", service.order || 0);
    }, 100);
    
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingService(null);
    form.reset({
      title: "",
      description: "",
      duration: "",
      price: "",
      icon: "Brain",
      gradient: "from-pink-500 to-purple-600",
      showPrice: true,
      showDuration: true,
      isActive: true,
      order: 0,
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Gerenciar Serviços
            </CardTitle>
            <CardDescription>
              Gerencie os serviços oferecidos exibidos no site
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? "Editar Serviço" : "Novo Serviço"}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações do serviço
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Terapia Individual" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Atendimento psicológico individual..." rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duração</FormLabel>
                          <FormControl>
                            <Input placeholder="50 minutos" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço</FormLabel>
                          <FormControl>
                            <Input placeholder="R$ 150,00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ícone</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um ícone" />
                              </SelectTrigger>
                              <SelectContent className="max-h-80">
                                {/* Ícones Principais */}
                                <SelectItem value="Brain">🧠 Cérebro (Terapia Individual)</SelectItem>
                                <SelectItem value="Heart">❤️ Coração (Terapia de Casal)</SelectItem>
                                <SelectItem value="Baby">👶 Bebê (Terapia Infantil)</SelectItem>
                                <SelectItem value="Users">👥 Usuários (Terapia de Grupo)</SelectItem>
                                <SelectItem value="User">👤 Usuário (Atendimento Individual)</SelectItem>
                                
                                {/* Ícones de Saúde Mental */}
                                <SelectItem value="Stethoscope">🩺 Estetoscópio (Avaliação Psicológica)</SelectItem>
                                <SelectItem value="Activity">📊 Atividade (Terapia Comportamental)</SelectItem>
                                <SelectItem value="Zap">⚡ Energia (Terapia Energética)</SelectItem>
                                <SelectItem value="Shield">🛡️ Escudo (Terapia de Proteção)</SelectItem>
                                <SelectItem value="Target">🎯 Alvo (Terapia Focada)</SelectItem>
                                
                                {/* Ícones de Relacionamento */}
                                <SelectItem value="UserPlus">👤+ Adicionar Usuário (Terapia Social)</SelectItem>
                                <SelectItem value="UserCheck">👤✓ Usuário Verificado (Terapia de Autoestima)</SelectItem>
                                <SelectItem value="UserX">👤✗ Usuário X (Terapia de Conflitos)</SelectItem>
                                <SelectItem value="UserCog">👤⚙️ Usuário Config (Terapia Personalizada)</SelectItem>
                                
                                {/* Ícones de Bem-estar */}
                                <SelectItem value="Sun">☀️ Sol (Terapia de Humor)</SelectItem>
                                <SelectItem value="Moon">🌙 Lua (Terapia do Sono)</SelectItem>
                                <SelectItem value="Star">⭐ Estrela (Terapia de Objetivos)</SelectItem>
                                <SelectItem value="Sparkles">✨ Brilhos (Terapia de Autoconfiança)</SelectItem>
                                
                                {/* Ícones de Comunicação */}
                                <SelectItem value="MessageCircle">💬 Conversa (Terapia Dialógica)</SelectItem>
                                <SelectItem value="MessageSquare">📧 Mensagem (Terapia Online)</SelectItem>
                                <SelectItem value="Mic">🎤 Microfone (Terapia da Fala)</SelectItem>
                                <SelectItem value="Volume2">🔊 Volume (Terapia Auditiva)</SelectItem>
                                
                                {/* Ícones de Crescimento */}
                                <SelectItem value="TrendingUp">📈 Crescimento (Desenvolvimento Pessoal)</SelectItem>
                                <SelectItem value="BarChart">📊 Gráfico (Análise Comportamental)</SelectItem>
                                <SelectItem value="PieChart">🥧 Pizza (Terapia Holística)</SelectItem>
                                <SelectItem value="Gauge">🌡️ Medidor (Avaliação de Progresso)</SelectItem>
                                
                                {/* Ícones de Mindfulness */}
                                <SelectItem value="Leaf">🍃 Folha (Terapia Natural)</SelectItem>
                                <SelectItem value="Flower">🌸 Flor (Terapia Floral)</SelectItem>
                                <SelectItem value="TreePine">🌲 Pinheiro (Terapia na Natureza)</SelectItem>
                                <SelectItem value="Wind">🌬️ Vento (Terapia Respiratória)</SelectItem>
                                
                                {/* Ícones de Apoio */}
                                <SelectItem value="Handshake">🤝 Aperto de Mão (Terapia de Apoio)</SelectItem>
                                <SelectItem value="HelpCircle">❓ Ajuda (Orientação Psicológica)</SelectItem>
                                <SelectItem value="LifeBuoy">🛟 Boia (Terapia de Emergência)</SelectItem>
                                <SelectItem value="Umbrella">☂️ Guarda-chuva (Terapia Preventiva)</SelectItem>
                                
                                {/* Ícones de Família */}
                                <SelectItem value="Home">🏠 Casa (Terapia Familiar)</SelectItem>
                                <SelectItem value="Gamepad2">🎮 Game (Ludoterapia)</SelectItem>
                                <SelectItem value="Puzzle">🧩 Quebra-cabeça (Terapia Cognitiva)</SelectItem>
                                <SelectItem value="Palette">🎨 Paleta (Arteterapia)</SelectItem>
                                
                                {/* Ícones de Movimento */}
                                <SelectItem value="Footprints">👣 Pegadas (Terapia do Movimento)</SelectItem>
                                <SelectItem value="Waves">🌊 Ondas (Terapia Aquática)</SelectItem>
                                <SelectItem value="Mountain">⛰️ Montanha (Terapia de Superação)</SelectItem>
                                <SelectItem value="Compass">🧭 Bússola (Orientação de Vida)</SelectItem>
                                
                                {/* Ícones de Tempo */}
                                <SelectItem value="Clock">🕐 Relógio (Terapia Breve)</SelectItem>
                                <SelectItem value="Timer">⏲️ Cronômetro (Sessões Programadas)</SelectItem>
                                <SelectItem value="Calendar">📅 Calendário (Terapia Agendada)</SelectItem>
                                <SelectItem value="Hourglass">⏳ Ampulheta (Terapia de Paciência)</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gradient"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gradiente de Cor</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um gradiente" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="from-pink-500 to-purple-600">Rosa para Roxo</SelectItem>
                                <SelectItem value="from-purple-600 to-pink-500">Roxo para Rosa</SelectItem>
                                <SelectItem value="from-blue-500 to-indigo-600">Azul para Índigo</SelectItem>
                                <SelectItem value="from-green-500 to-teal-600">Verde para Teal</SelectItem>
                                <SelectItem value="from-orange-500 to-red-600">Laranja para Vermelho</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="showPrice"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Exibir Preço</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Mostrar o preço no site
                            </div>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="showDuration"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Exibir Duração</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Mostrar a duração no site
                            </div>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="order"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ordem</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Ativo</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Exibir este serviço no site
                            </div>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingService ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Dica:</strong> Arraste e solte os serviços para reordenar a exibição no site.
          </p>
        </div>
        
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext 
                items={services.map(s => s.id)} 
                strategy={verticalListSortingStrategy}
              >
                {services
                  .sort((a, b) => a.order - b.order)
                  .map((service) => (
                    <SortableServiceItem
                      key={service.id}
                      service={service}
                      onEdit={openEditDialog}
                      onDelete={(id) => deleteMutation.mutate(id)}
                    />
                  ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </CardContent>
    </Card>
  );
}

function SpecialtiesManager({ specialties }: { specialties: Specialty[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<Specialty | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Sensores otimizados para mobile e desktop
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const specialtySchema = z.object({
    title: z.string().min(1, "Título é obrigatório"),
    description: z.string().min(1, "Descrição é obrigatória"),
    icon: z.string().min(1, "Ícone é obrigatório"),
    iconColor: z.string().min(1, "Cor é obrigatória"),
    isActive: z.boolean(),
    order: z.number().min(0),
  });

  type SpecialtyForm = z.infer<typeof specialtySchema>;

  const form = useForm<SpecialtyForm>({
    resolver: zodResolver(specialtySchema),
    defaultValues: {
      title: "",
      description: "",
      icon: "Brain",
      iconColor: "#ec4899",
      isActive: true,
      order: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SpecialtyForm) => {
      const response = await apiRequest("POST", "/api/admin/specialties", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/specialties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/specialties"] });
      toast({ title: "Especialidade criada com sucesso!" });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SpecialtyForm> }) => {
      const response = await apiRequest("PUT", `/api/admin/specialties/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/specialties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/specialties"] });
      toast({ title: "Especialidade atualizada com sucesso!" });
      setEditingItem(null);
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/specialties/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/specialties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/specialties"] });
      toast({ title: "Especialidade excluída com sucesso!" });
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = specialties.findIndex((item) => item.id === active.id);
      const newIndex = specialties.findIndex((item) => item.id === over.id);
      
      const newOrder = arrayMove(specialties, oldIndex, newIndex);
      
      const updatePromises = newOrder.map((item, index) => 
        apiRequest("PUT", `/api/admin/specialties/${item.id}`, { 
          order: index
        })
      );
      
      Promise.all(updatePromises).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/specialties"] });
        queryClient.invalidateQueries({ queryKey: ["/api/specialties"] });
        toast({ title: "Ordem das especialidades atualizada!" });
      }).catch(() => {
        toast({ title: "Erro ao atualizar ordem", variant: "destructive" });
      });
    }
  };

  const onSubmit = (data: SpecialtyForm) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (specialty: Specialty) => {
    setEditingItem(specialty);
    
    setTimeout(() => {
      form.setValue("title", specialty.title || "");
      form.setValue("description", specialty.description || "");
      form.setValue("icon", specialty.icon || "Brain");
      form.setValue("iconColor", specialty.iconColor || "#ec4899");
      form.setValue("isActive", specialty.isActive ?? true);
      form.setValue("order", specialty.order || 0);
    }, 100);
    
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    form.reset();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Minhas Especialidades</h3>
          <p className="text-sm text-muted-foreground">
            Configure suas áreas de expertise exibidas na seção "Sobre"
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Especialidade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Especialidade" : "Nova Especialidade"}
              </DialogTitle>
              <DialogDescription>
                Configure as informações da sua especialidade
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Ansiedade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Técnicas para controlar preocupações excessivas..." rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ícone</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um ícone" />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                              <SelectItem value="Brain">🧠 Cérebro</SelectItem>
                              <SelectItem value="Heart">❤️ Coração</SelectItem>
                              <SelectItem value="Users">👥 Pessoas</SelectItem>
                              <SelectItem value="Star">⭐ Estrela</SelectItem>
                              <SelectItem value="BookOpen">📖 Livro</SelectItem>
                              <SelectItem value="Award">🏆 Prêmio</SelectItem>
                              <SelectItem value="Shield">🛡️ Escudo</SelectItem>
                              <SelectItem value="Sun">☀️ Sol</SelectItem>
                              <SelectItem value="Moon">🌙 Lua</SelectItem>
                              <SelectItem value="Sparkles">✨ Brilhos</SelectItem>
                              <SelectItem value="Target">🎯 Alvo</SelectItem>
                              <SelectItem value="Handshake">🤝 Aperto de Mão</SelectItem>
                              <SelectItem value="HelpCircle">❓ Ajuda</SelectItem>
                              <SelectItem value="MessageCircle">💬 Conversa</SelectItem>
                              <SelectItem value="Leaf">🍃 Folha</SelectItem>
                              <SelectItem value="Flower">🌸 Flor</SelectItem>
                              <SelectItem value="Compass">🧭 Bússola</SelectItem>
                              <SelectItem value="TrendingUp">📈 Crescimento</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="iconColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor do Ícone</FormLabel>
                        <div className="flex items-center space-x-2">
                          <FormControl>
                            <Input type="color" className="w-12 h-10" {...field} />
                          </FormControl>
                          <FormControl>
                            <Input placeholder="#ec4899" {...field} />
                          </FormControl>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          O fundo será automaticamente 20% mais suave
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordem</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Ativo</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Exibir esta especialidade
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingItem ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 <strong>Dica:</strong> Arraste e solte as especialidades para reordenar. A cor do fundo será automaticamente mais suave (20% da cor do ícone).
        </p>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={specialties.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {specialties
              .sort((a, b) => a.order - b.order)
              .map((specialty) => (
              <SortableSpecialtyItem 
                key={specialty.id} 
                specialty={specialty}
                onEdit={() => openEditDialog(specialty)}
                onDelete={() => deleteMutation.mutate(specialty.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {specialties.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhuma especialidade cadastrada ainda.</p>
          <p className="text-sm">Clique em "Nova Especialidade" para começar.</p>
        </div>
      )}
    </div>
  );
}

function SortableSpecialtyItem({ specialty, onEdit, onDelete }: { 
  specialty: Specialty; 
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: specialty.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

  // Mapeamento de ícones
  const iconMap: Record<string, any> = {
    Brain, Heart, Users, Star, BookOpen, Award, Shield, Sun, Moon, Sparkles, Target,
    Handshake, HelpCircle, MessageCircle, Leaf, Flower, Compass, TrendingUp
  };

  const IconComponent = iconMap[specialty.icon] || Brain;
  const softBgColor = getSoftColor(specialty.iconColor);

  return (
    <Card ref={setNodeRef} style={style} className="p-4 cursor-move">
      <div className="flex justify-between items-start">
        <div className="flex-1 flex items-start gap-4">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: softBgColor }}
          >
            <IconComponent className="w-5 h-5" style={{ color: specialty.iconColor }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">{specialty.title}</h4>
              <Badge variant={specialty.isActive ? "default" : "secondary"} className="text-xs">
                {specialty.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{specialty.description}</p>
            <p className="text-xs text-gray-400 mt-1">Ordem: {specialty.order}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function AppearanceSettings({ configs }: { configs: SiteConfig[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getConfigValue = (key: string) => {
    const config = configs.find(c => c.key === key);
    return config ? config.value : {};
  };

  const colorsConfig = getConfigValue('colors') as any;

  const appearanceSchema = z.object({
    primary: z.string().min(1, "Cor primária é obrigatória"),
    secondary: z.string().min(1, "Cor secundária é obrigatória"),
    accent: z.string().min(1, "Cor de destaque é obrigatória"),
    background: z.string().min(1, "Background é obrigatório"),
  });

  // Presets de cores pastéis femininas
  const colorPresets = {
    primary: [
      { name: "Rosa Vibrante", value: "#ec4899" },
      { name: "Coral Suave", value: "#fb7185" },
      { name: "Pêssego", value: "#fb923c" },
      { name: "Lavanda", value: "#a855f7" },
      { name: "Rosa Bebê", value: "#f472b6" },
      { name: "Salmão", value: "#f87171" }
    ],
    secondary: [
      { name: "Roxo Suave", value: "#8b5cf6" },
      { name: "Lilás", value: "#a78bfa" },
      { name: "Rosa Claro", value: "#f9a8d4" },
      { name: "Azul Pastel", value: "#7dd3fc" },
      { name: "Verde Mint", value: "#6ee7b7" },
      { name: "Amarelo Suave", value: "#fde047" }
    ],
    accent: [
      { name: "Índigo", value: "#6366f1" },
      { name: "Violeta", value: "#8b5cf6" },
      { name: "Rosa Escuro", value: "#e11d48" },
      { name: "Azul Royal", value: "#3b82f6" },
      { name: "Verde Esmeralda", value: "#10b981" },
      { name: "Laranja Vibrante", value: "#f97316" }
    ]
  };

  type AppearanceForm = z.infer<typeof appearanceSchema>;

  const form = useForm<AppearanceForm>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      primary: "#ec4899",
      secondary: "#8b5cf6", 
      accent: "#6366f1",
      background: "linear-gradient(135deg, hsl(276, 100%, 95%) 0%, hsl(339, 100%, 95%) 50%, hsl(276, 100%, 95%) 100%)",
    },
  });

  // Popula o formulário com as cores atuais quando os dados chegam
  React.useEffect(() => {
    if (colorsConfig && Object.keys(colorsConfig).length > 0) {
      console.log("Carregando configurações de cores:", colorsConfig);
      form.setValue("primary", colorsConfig.primary || "#ec4899");
      form.setValue("secondary", colorsConfig.secondary || "#8b5cf6");
      form.setValue("accent", colorsConfig.accent || "#6366f1");
      form.setValue("background", colorsConfig.background || "linear-gradient(135deg, hsl(276, 100%, 95%) 0%, hsl(339, 100%, 95%) 50%, hsl(276, 100%, 95%) 100%)");
    }
  }, [colorsConfig, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: AppearanceForm) => {
      const response = await apiRequest("POST", "/api/admin/config", {
        key: "colors",
        value: data
      });
      return response.json();
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      
      // Aplica as cores dinamicamente ao site
      applyColorsToSite(variables);
      
      toast({ title: "Configurações de aparência atualizadas com sucesso!" });
    },
  });

  // Função para aplicar cores dinamicamente ao site
  const applyColorsToSite = (colors: AppearanceForm) => {
    const root = document.documentElement;
    
    // Converte hex para HSL para compatibilidade
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      
      return `${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
    };
    
    // Aplica as cores personalizadas
    root.style.setProperty('--coral', colors.primary);
    root.style.setProperty('--purple-soft', colors.secondary);
    root.style.setProperty('--primary', `hsl(${hexToHsl(colors.primary)})`);
    
    // Atualiza background gradient se especificado
    if (colors.background.includes('gradient')) {
      const style = document.createElement('style');
      style.innerHTML = `.gradient-bg { background: ${colors.background} !important; }`;
      document.head.appendChild(style);
    }
  };

  const onSubmit = (data: AppearanceForm) => {
    updateMutation.mutate(data);
  };

  const presetBackgrounds = [
    {
      name: "Rosa para Roxo (Atual)",
      value: "linear-gradient(135deg, hsl(276, 100%, 95%) 0%, hsl(339, 100%, 95%) 50%, hsl(276, 100%, 95%) 100%)"
    },
    {
      name: "Roxo para Rosa",
      value: "linear-gradient(135deg, hsl(339, 100%, 95%) 0%, hsl(276, 100%, 95%) 50%, hsl(339, 100%, 95%) 100%)"
    },
    {
      name: "Pêssego Suave",
      value: "linear-gradient(135deg, hsl(20, 100%, 94%) 0%, hsl(35, 100%, 92%) 50%, hsl(20, 100%, 94%) 100%)"
    },
    {
      name: "Lavanda Dreamy",
      value: "linear-gradient(135deg, hsl(260, 60%, 92%) 0%, hsl(280, 70%, 95%) 50%, hsl(260, 60%, 92%) 100%)"
    },
    {
      name: "Rosa Coral",
      value: "linear-gradient(135deg, hsl(350, 80%, 92%) 0%, hsl(15, 85%, 90%) 50%, hsl(350, 80%, 92%) 100%)"
    },
    {
      name: "Mint Fresh",
      value: "linear-gradient(135deg, hsl(160, 70%, 90%) 0%, hsl(180, 65%, 92%) 50%, hsl(160, 70%, 90%) 100%)"
    },
    {
      name: "Céu Pastel",
      value: "linear-gradient(135deg, hsl(200, 80%, 92%) 0%, hsl(220, 75%, 94%) 50%, hsl(200, 80%, 92%) 100%)"
    },
    {
      name: "Sunset Warm",
      value: "linear-gradient(135deg, hsl(45, 90%, 88%) 0%, hsl(25, 85%, 85%) 50%, hsl(45, 90%, 88%) 100%)"
    },
    {
      name: "Lilás Soft",
      value: "linear-gradient(135deg, hsl(290, 50%, 90%) 0%, hsl(310, 55%, 92%) 50%, hsl(290, 50%, 90%) 100%)"
    },
    {
      name: "Gradiente Animado - Aurora",
      value: "linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)",
      animated: true,
      css: `
        background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
        background-size: 400% 400%;
        animation: aurora-gradient 15s ease infinite;
      `
    },
    {
      name: "Gradiente Animado - Sunset",
      value: "linear-gradient(-45deg, #ff9a9e, #fecfef, #fecfef, #ff9a9e)",
      animated: true,
      css: `
        background: linear-gradient(-45deg, #ff9a9e, #fecfef, #fecfef, #ff9a9e);
        background-size: 400% 400%;
        animation: sunset-gradient 12s ease infinite;
      `
    },
    {
      name: "Gradiente Animado - Ocean",
      value: "linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c)",
      animated: true,
      css: `
        background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c);
        background-size: 400% 400%;
        animation: ocean-gradient 18s ease infinite;
      `
    },
    {
      name: "Gradiente Animado - Primavera",
      value: "linear-gradient(-45deg, #a8edea, #fed6e3, #d299c2, #fef9d7)",
      animated: true,
      css: `
        background: linear-gradient(-45deg, #a8edea, #fed6e3, #d299c2, #fef9d7);
        background-size: 400% 400%;
        animation: spring-gradient 20s ease infinite;
      `
    },
    {
      name: "Neutro Elegante",
      value: "linear-gradient(135deg, hsl(0, 0%, 98%) 0%, hsl(0, 0%, 96%) 50%, hsl(0, 0%, 98%) 100%)"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Configurações de Aparência
        </CardTitle>
        <CardDescription>
          Personalize as cores e o visual do site
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="primary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor Primária</FormLabel>
                    <div className="text-sm text-muted-foreground mb-2">
                      Cor principal dos botões, títulos em destaque e elementos interativos (botão "Saiba mais", título principal)
                    </div>
                    <FormControl>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Input type="color" className="w-12 h-10" {...field} />
                          <Input placeholder="#ec4899" {...field} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {colorPresets.primary.map((preset) => (
                            <Button
                              key={preset.name}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 p-1 flex items-center space-x-1"
                              onClick={() => form.setValue("primary", preset.value)}
                            >
                              <div 
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: preset.value }}
                              />
                              <span className="text-xs">{preset.name}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secondary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor Secundária</FormLabel>
                    <div className="text-sm text-muted-foreground mb-2">
                      Cor dos gradientes, fundos de cartões e elementos secundários (cards de serviços, fundos suaves)
                    </div>
                    <FormControl>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Input type="color" className="w-12 h-10" {...field} />
                          <Input placeholder="#8b5cf6" {...field} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {colorPresets.secondary.map((preset) => (
                            <Button
                              key={preset.name}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 p-1 flex items-center space-x-1"
                              onClick={() => form.setValue("secondary", preset.value)}
                            >
                              <div 
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: preset.value }}
                              />
                              <span className="text-xs">{preset.name}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor de Destaque</FormLabel>
                    <div className="text-sm text-muted-foreground mb-2">
                      Cor para hover nos botões, bordas ao passar o mouse e sombras de destaque (efeitos visuais especiais)
                    </div>
                    <FormControl>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Input type="color" className="w-12 h-10" {...field} />
                          <Input placeholder="#6366f1" {...field} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {colorPresets.accent.map((preset) => (
                            <Button
                              key={preset.name}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 p-1 flex items-center space-x-1"
                              onClick={() => form.setValue("accent", preset.value)}
                            >
                              <div 
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: preset.value }}
                              />
                              <span className="text-xs">{preset.name}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="background"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background Gradiente</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="linear-gradient(...)" 
                      rows={3} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <label className="text-sm font-medium">Presets de Background ✨</label>
              <div className="text-sm text-muted-foreground">
                Inclui gradientes animados que trocam de cor automaticamente!
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {presetBackgrounds.map((preset) => (
                  <Button
                    key={preset.name}
                    type="button"
                    variant="outline"
                    className="h-auto p-3 flex flex-col items-start space-y-2"
                    onClick={() => form.setValue("background", preset.value)}
                  >
                    <div 
                      className="w-full h-8 rounded border"
                      style={{ 
                        background: preset.value,
                        backgroundSize: preset.animated ? "400% 400%" : "100% 100%"
                      }}
                    />
                    <div className="flex flex-col items-start w-full">
                      <span className="text-xs font-medium">{preset.name}</span>
                      {preset.animated && (
                        <span className="text-xs text-purple-600">🌈 Gradiente Animado</span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-sm font-medium mb-3">Prévia das Cores</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div 
                    className="w-full h-12 rounded border"
                    style={{ backgroundColor: form.watch("primary") }}
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Primária</span>
                </div>
                <div className="text-center">
                  <div 
                    className="w-full h-12 rounded border"
                    style={{ backgroundColor: form.watch("secondary") }}
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Secundária</span>
                </div>
                <div className="text-center">
                  <div 
                    className="w-full h-12 rounded border"
                    style={{ backgroundColor: form.watch("accent") }}
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Destaque</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Salvando..." : "Salvar Aparência"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function ContactScheduleManager({ contactSettings }: { contactSettings: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [contactItems, setContactItems] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (contactSettings) {
      setContactItems(contactSettings.contact_items || []);
    }
  }, [contactSettings]);

  const contactSchema = z.object({
    title: z.string().min(1, "Título é obrigatório"),
    description: z.string().optional(),
    icon: z.string().min(1, "Ícone é obrigatório"),
    color: z.string().min(1, "Cor é obrigatória"),
    link: z.string().min(1, "Link é obrigatório"),
    isActive: z.boolean(),
    order: z.number().min(0),
  });

  const scheduleSchema = z.object({
    weekdays: z.string().min(1, "Horário dos dias úteis é obrigatório"),
    saturday: z.string().min(1, "Horário do sábado é obrigatório"),
    sunday: z.string().min(1, "Horário do domingo é obrigatório"),
    additional_info: z.string().optional(),
  });

  const locationSchema = z.object({
    city: z.string().min(1, "Cidade é obrigatória"),
    maps_link: z.string().min(1, "Link do Google Maps é obrigatório"),
  });

  type ContactForm = z.infer<typeof contactSchema>;
  type ScheduleForm = z.infer<typeof scheduleSchema>;
  type LocationForm = z.infer<typeof locationSchema>;

  const contactForm = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      title: "",
      description: "",
      icon: "FaWhatsapp",
      color: "#25D366",
      link: "",
      isActive: true,
      order: 0,
    },
  });

  const scheduleForm = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      weekdays: contactSettings?.schedule_info?.weekdays || "Segunda à Sexta: 8h às 18h",
      saturday: contactSettings?.schedule_info?.saturday || "Sábado: 8h às 12h",
      sunday: contactSettings?.schedule_info?.sunday || "Domingo: Fechado",
      additional_info: contactSettings?.schedule_info?.additional_info || "",
    },
  });

  const locationForm = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      city: contactSettings?.location_info?.city || "Campo Mourão, Paraná",
      maps_link: contactSettings?.location_info?.maps_link || "https://maps.google.com/search/Campo+Mourão+Paraná",
    },
  });

  useEffect(() => {
    if (contactSettings) {
      scheduleForm.reset({
        weekdays: contactSettings.schedule_info?.weekdays || "Segunda à Sexta: 8h às 18h",
        saturday: contactSettings.schedule_info?.saturday || "Sábado: 8h às 12h",
        sunday: contactSettings.schedule_info?.sunday || "Domingo: Fechado",
        additional_info: contactSettings.schedule_info?.additional_info || "",
      });
      locationForm.reset({
        city: contactSettings.location_info?.city || "Campo Mourão, Paraná",
        maps_link: contactSettings.location_info?.maps_link || "https://maps.google.com/search/Campo+Mourão+Paraná",
      });
    }
  }, [contactSettings, scheduleForm, locationForm]);

  const updateContactSettings = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/admin/contact-settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contact-settings"] });
      toast({ title: "Configurações atualizadas com sucesso!" });
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = contactItems.findIndex((item) => item.id === active.id);
      const newIndex = contactItems.findIndex((item) => item.id === over.id);
      
      const newItems = arrayMove(contactItems, oldIndex, newIndex).map((item, index) => ({
        ...item,
        order: index
      }));
      
      setContactItems(newItems);
      updateContactSettings.mutate({ contact_items: newItems });
    }
  };

  const onSubmitContact = (data: ContactForm) => {
    let newItems;
    
    if (editingContact) {
      newItems = contactItems.map(item => 
        item.id === editingContact.id ? { ...item, ...data } : item
      );
    } else {
      const newId = Math.max(...contactItems.map(c => c.id), 0) + 1;
      const newItem = {
        id: newId,
        type: data.title.toLowerCase(),
        ...data,
        order: contactItems.length
      };
      newItems = [...contactItems, newItem];
    }
    
    setContactItems(newItems);
    updateContactSettings.mutate({ contact_items: newItems });
    setIsContactDialogOpen(false);
    contactForm.reset();
  };

  const onSubmitSchedule = (data: ScheduleForm) => {
    updateContactSettings.mutate({ schedule_info: data });
  };

  const onSubmitLocation = (data: LocationForm) => {
    updateContactSettings.mutate({ location_info: data });
  };

  const openEditContact = (contact: any) => {
    setEditingContact(contact);
    contactForm.reset({
      title: contact.title,
      description: contact.description || "",
      icon: contact.icon,
      color: contact.color,
      link: contact.link,
      isActive: contact.isActive,
      order: contact.order,
    });
    setIsContactDialogOpen(true);
  };

  const deleteContact = (id: number) => {
    const newItems = contactItems.filter(item => item.id !== id);
    setContactItems(newItems);
    updateContactSettings.mutate({ contact_items: newItems });
  };

  const iconOptions = [
    { value: "FaWhatsapp", label: "WhatsApp", icon: "💬" },
    { value: "FaInstagram", label: "Instagram", icon: "📷" },
    { value: "Mail", label: "Email", icon: "📧" },
    { value: "FaLinkedin", label: "LinkedIn", icon: "💼" },
    { value: "FaFacebook", label: "Facebook", icon: "👥" },
    { value: "FaTwitter", label: "Twitter", icon: "🐦" },
    { value: "FaTelegram", label: "Telegram", icon: "✈️" },
    { value: "Phone", label: "Telefone", icon: "📞" },
    { value: "MapPin", label: "Localização", icon: "📍" },
    { value: "Globe", label: "Website", icon: "🌐" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Botões de Contato</CardTitle>
                <CardDescription>
                  Configure os botões de contato exibidos na seção de agendamento
                </CardDescription>
              </div>
              <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingContact(null);
                    contactForm.reset();
                    setIsContactDialogOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Contato
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingContact ? "Editar Contato" : "Novo Contato"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...contactForm}>
                    <form onSubmit={contactForm.handleSubmit(onSubmitContact)} className="space-y-4">
                      <FormField
                        control={contactForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input placeholder="WhatsApp" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={contactForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição (Opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="(44) 998-362-704" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={contactForm.control}
                          name="icon"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ícone</FormLabel>
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {iconOptions.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.icon} {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={contactForm.control}
                          name="color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cor</FormLabel>
                              <div className="flex items-center space-x-2">
                                <FormControl>
                                  <Input type="color" className="w-12 h-10" {...field} />
                                </FormControl>
                                <FormControl>
                                  <Input placeholder="#25D366" {...field} />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={contactForm.control}
                        name="link"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Link</FormLabel>
                            <FormControl>
                              <Input placeholder="https://wa.me/5544998362704" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={contactForm.control}
                          name="order"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ordem</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={contactForm.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Ativo</FormLabel>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">
                          {editingContact ? "Atualizar" : "Criar"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={contactItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {contactItems
                    .sort((a, b) => a.order - b.order)
                    .map((contact) => (
                    <SortableContactItem 
                      key={contact.id} 
                      contact={contact}
                      onEdit={() => openEditContact(contact)}
                      onDelete={() => deleteContact(contact.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Horários de Funcionamento</CardTitle>
              <CardDescription>
                Configure os horários de atendimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...scheduleForm}>
                <form onSubmit={scheduleForm.handleSubmit(onSubmitSchedule)} className="space-y-4">
                  <FormField
                    control={scheduleForm.control}
                    name="weekdays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Segunda à Sexta</FormLabel>
                        <FormControl>
                          <Input placeholder="8h às 18h" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={scheduleForm.control}
                    name="saturday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sábado</FormLabel>
                        <FormControl>
                          <Input placeholder="8h às 12h" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={scheduleForm.control}
                    name="sunday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domingo</FormLabel>
                        <FormControl>
                          <Input placeholder="Fechado" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={scheduleForm.control}
                    name="additional_info"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Informações Adicionais</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Horários flexíveis disponíveis" rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Salvar Horários
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Localização</CardTitle>
              <CardDescription>
                Configure cidade e link do Google Maps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...locationForm}>
                <form onSubmit={locationForm.handleSubmit(onSubmitLocation)} className="space-y-4">
                  <FormField
                    control={locationForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Campo Mourão, Paraná" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={locationForm.control}
                    name="maps_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link do Google Maps</FormLabel>
                        <FormControl>
                          <Input placeholder="https://maps.google.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Salvar Localização
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SortableContactItem({ contact, onEdit, onDelete }: { 
  contact: any; 
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contact.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4 cursor-move">
      <div className="flex justify-between items-start">
        <div className="flex-1 flex items-start gap-4">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: contact.color }}
          >
            <span className="text-white text-sm">
              {contact.icon === 'FaWhatsapp' ? '💬' :
               contact.icon === 'FaInstagram' ? '📷' :
               contact.icon === 'Mail' ? '📧' :
               contact.icon === 'FaLinkedin' ? '💼' : '📞'}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{contact.title}</h4>
              <Badge variant={contact.isActive ? "default" : "secondary"} className="text-xs">
                {contact.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            {contact.description && (
              <p className="text-sm text-muted-foreground">{contact.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">Ordem: {contact.order}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function FooterManager({ footerSettings }: { footerSettings: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [editingCertification, setEditingCertification] = useState<any | null>(null);
  const [editingSeal, setEditingSeal] = useState<any | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isCertificationDialogOpen, setIsCertificationDialogOpen] = useState(false);
  const [isSealDialogOpen, setIsSealDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const footerData = footerSettings || {};
  const generalInfo = footerData.general_info || {};
  const contactButtons = footerData.contact_buttons || [];
  const certificationItems = footerData.certification_items || [];
  const trustSeals = footerData.trust_seals || [];
  const bottomInfo = footerData.bottom_info || {};

  const updateFooterSettings = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/admin/footer-settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/footer-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/footer-settings"] });
      toast({ title: "Configurações do rodapé atualizadas com sucesso!" });
    },
  });

  const generalSchema = z.object({
    description: z.string().min(1, "Descrição é obrigatória"),
    cnpj: z.string().min(1, "CNPJ é obrigatório"),
    showCnpj: z.boolean(),
    copyright: z.string().min(1, "Copyright é obrigatório"),
    certificationText: z.string().min(1, "Texto de certificações é obrigatório"),
  });

  const generalForm = useForm({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      description: generalInfo.description || "Cuidando da sua saúde mental com carinho e dedicação",
      cnpj: generalInfo.cnpj || "12.345.678/0001-90",
      showCnpj: generalInfo.showCnpj ?? true,
      copyright: bottomInfo.copyright || "© 2024 Dra. Adrielle Benhossi • Todos os direitos reservados",
      certificationText: bottomInfo.certificationText || "Registrada no Conselho Federal de Psicologia<br/>Sigilo e ética profissional",
    },
  });

  const onSubmitGeneral = (data: any) => {
    const updates = {
      general_info: {
        description: data.description,
        cnpj: data.cnpj,
        showCnpj: data.showCnpj,
      },
      bottom_info: {
        copyright: data.copyright,
        certificationText: data.certificationText,
      }
    };
    updateFooterSettings.mutate(updates);
  };

  const iconOptions = [
    { value: "FaWhatsapp", label: "WhatsApp", icon: "💬" },
    { value: "FaInstagram", label: "Instagram", icon: "📷" },
    { value: "FaLinkedin", label: "LinkedIn", icon: "💼" },
    { value: "FaFacebook", label: "Facebook", icon: "👥" },
    { value: "FaTwitter", label: "Twitter", icon: "🐦" },
  ];

  const gradientOptions = [
    { name: "Verde WhatsApp", value: "from-green-400 to-green-500" },
    { name: "Rosa Instagram", value: "from-purple-400 to-pink-500" },
    { name: "Azul LinkedIn", value: "from-blue-500 to-blue-600" },
    { name: "Azul Facebook", value: "from-blue-600 to-blue-700" },
    { name: "Azul Twitter", value: "from-blue-400 to-blue-500" },
    { name: "Roxo Personalizado", value: "from-purple-500 to-purple-600" },
    { name: "Rosa Personalizado", value: "from-pink-500 to-pink-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Informações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais do Rodapé</CardTitle>
          <CardDescription>
            Configure os textos principais, CNPJ e informações de copyright
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...generalForm}>
            <form onSubmit={generalForm.handleSubmit(onSubmitGeneral)} className="space-y-4">
              <FormField
                control={generalForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição Principal</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrição que aparece abaixo do nome da psicóloga" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={generalForm.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="12.345.678/0001-90" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={generalForm.control}
                  name="showCnpj"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Exibir CNPJ</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Mostrar CNPJ no rodapé
                        </div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={generalForm.control}
                name="copyright"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto de Copyright</FormLabel>
                    <FormControl>
                      <Input placeholder="© 2024 Dra. Adrielle Benhossi..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={generalForm.control}
                name="certificationText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto de Certificações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Registrada no Conselho Federal de Psicologia..." 
                        rows={3} 
                        {...field} 
                      />
                    </FormControl>
                    <div className="text-xs text-muted-foreground">
                      Use &lt;br/&gt; para quebrar linhas. Aparece abaixo dos ícones de certificação.
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Salvar Informações Gerais</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Botões de Contato */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Botões de Contato</CardTitle>
              <CardDescription>
                Configure os botões de redes sociais e contato do rodapé
              </CardDescription>
            </div>
            <Button onClick={() => setIsContactDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Botão
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contactButtons
              .sort((a: any, b: any) => a.order - b.order)
              .map((button: any) => (
                <Card key={button.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 bg-gradient-to-r ${button.gradient} rounded-lg flex items-center justify-center`}>
                        <span className="text-white text-sm">
                          {iconOptions.find(icon => icon.value === button.icon)?.icon || "📧"}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{button.label}</h4>
                        <p className="text-sm text-muted-foreground">{button.link}</p>
                      </div>
                      <Badge variant={button.isActive ? "default" : "secondary"}>
                        {button.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingContact(button);
                        setIsContactDialogOpen(true);
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => {
                        const newButtons = contactButtons.filter((b: any) => b.id !== button.id);
                        updateFooterSettings.mutate({ contact_buttons: newButtons });
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Outros componentes continuam... */}

      {/* Dialog para editar botões de contato */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Editar Botão de Contato" : "Novo Botão de Contato"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Label</label>
              <Input placeholder="WhatsApp" />
            </div>
            <div>
              <label className="text-sm font-medium">Link</label>
              <Input placeholder="https://wa.me/..." />
            </div>
            <div>
              <label className="text-sm font-medium">Ícone</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ícone" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Gradiente</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um gradiente" />
                </SelectTrigger>
                <SelectContent>
                  {gradientOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsContactDialogOpen(false);
                setEditingContact(null);
              }}>
                Cancelar
              </Button>
              <Button onClick={() => {
                setIsContactDialogOpen(false);
                setEditingContact(null);
                toast({ title: "Botão salvo com sucesso!" });
              }}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MarketingSettings({ configs }: { configs: SiteConfig[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const marketingSchema = z.object({
    facebookPixel1: z.string().optional(),
    facebookPixel2: z.string().optional(),
    googlePixel: z.string().optional(),
    enableGoogleIndexing: z.boolean().default(true),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    metaKeywords: z.string().optional(),
  });

  type MarketingForm = z.infer<typeof marketingSchema>;

  // Extrair valores das configurações de forma segura
  const getMarketingData = () => {
    const marketingInfo = configs?.find(c => c.key === 'marketing_pixels')?.value as any || {};
    const seoInfo = configs?.find(c => c.key === 'seo_meta')?.value as any || {};
    
    return {
      facebookPixel1: marketingInfo.facebookPixel1 || "",
      facebookPixel2: marketingInfo.facebookPixel2 || "",
      googlePixel: marketingInfo.googlePixel || "",
      enableGoogleIndexing: marketingInfo.enableGoogleIndexing ?? true,
      metaTitle: seoInfo.metaTitle || "Dra. Adrielle Benhossi - Psicóloga em Campo Mourão | Terapia Online e Presencial",
      metaDescription: seoInfo.metaDescription || "Psicóloga CRP 08/123456 em Campo Mourão. Atendimento presencial e online. Especialista em terapia cognitivo-comportamental para seu bem-estar emocional.",
      metaKeywords: seoInfo.metaKeywords || "psicóloga, Campo Mourão, terapia online, consulta psicológica, saúde mental, CRP, terapia cognitivo-comportamental",
    };
  };

  const form = useForm<MarketingForm>({
    resolver: zodResolver(marketingSchema),
    defaultValues: getMarketingData(),
  });

  // Atualiza o formulário quando as configurações mudam
  React.useEffect(() => {
    if (configs && configs.length > 0) {
      const newData = getMarketingData();
      form.reset(newData);
    }
  }, [configs, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: MarketingForm) => {
      const promises = [
        // Atualiza as configurações de marketing
        apiRequest("POST", "/api/admin/config", {
          key: 'marketing_pixels',
          value: {
            facebookPixel1: data.facebookPixel1,
            facebookPixel2: data.facebookPixel2,
            googlePixel: data.googlePixel,
            enableGoogleIndexing: data.enableGoogleIndexing,
          }
        }),
        // Atualiza as configurações de SEO
        apiRequest("POST", "/api/admin/config", {
          key: 'seo_meta',
          value: {
            metaTitle: data.metaTitle,
            metaDescription: data.metaDescription,
            metaKeywords: data.metaKeywords,
          }
        })
      ];
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      toast({ title: "Configurações de marketing salvas com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar configurações", variant: "destructive" });
    },
  });

  const onSubmit = (data: MarketingForm) => {
    updateMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Configurações de Marketing
        </CardTitle>
        <CardDescription>
          Configure os pixels de rastreamento para Facebook e Google Ads
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Informações sobre pixels */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">📊 O que são Pixels de Rastreamento?</h4>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              Os pixels são códigos que permitem rastrear visitantes do seu site para criar campanhas publicitárias mais eficazes.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-3">
              <div className="bg-white p-3 rounded border border-blue-100">
                <h5 className="font-medium text-blue-900">🔵 Facebook Pixel</h5>
                <p className="text-xs mt-1">
                  Rastreia visitantes para criar públicos personalizados e anúncios direcionados no Facebook e Instagram.
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-blue-100">
                <h5 className="font-medium text-blue-900">🟢 Google Pixel</h5>
                <p className="text-xs mt-1">
                  Coleta dados para otimizar campanhas no Google Ads usando inteligência artificial para encontrar clientes ideais.
                </p>
              </div>
            </div>
            <p className="text-xs mt-3 font-medium">
              💡 <strong>Dica:</strong> Com estes pixels configurados, seu gestor de tráfego pode usar IA para otimizar anúncios automaticamente e encontrar pessoas similares aos seus melhores clientes.
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Facebook Pixels */}
            <div className="space-y-4">
              <h4 className="font-medium text-blue-900 flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">f</span>
                </div>
                Facebook Pixels (até 2)
              </h4>
              
              <FormField
                control={form.control}
                name="facebookPixel1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook Pixel #1 (Principal)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 1234567890123456" 
                        {...field} 
                        className="font-mono"
                      />
                    </FormControl>
                    <div className="text-xs text-muted-foreground">
                      Encontre seu Pixel ID no Facebook Business Manager → Eventos → Pixels
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="facebookPixel2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook Pixel #2 (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 9876543210987654" 
                        {...field} 
                        className="font-mono"
                      />
                    </FormControl>
                    <div className="text-xs text-muted-foreground">
                      Segundo pixel para campanhas específicas ou backup
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="googlePixel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">G</span>
                    </div>
                    Google Analytics / Google Ads ID
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: G-XXXXXXXXXX ou AW-XXXXXXXXX" 
                      {...field} 
                      className="font-mono"
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground">
                    Use G-XXXXXXXXXX para Google Analytics ou AW-XXXXXXXXX para Google Ads
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Controle de Indexação Google */}
            <FormField
              control={form.control}
              name="enableGoogleIndexing"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-2">
                      <FormLabel className="text-base flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Permitir Indexação no Google
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Controla se o site aparece nos resultados de busca do Google
                      </div>
                    </div>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                      />
                    </FormControl>
                  </div>
                  
                  {!field.value && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Ban className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-red-900">⚠️ Indexação Desabilitada</h5>
                          <p className="text-sm text-red-800 mt-1">
                            Com esta opção desativada, o arquivo robots.txt impedirá que o Google e outros mecanismos de busca indexem seu site. 
                            Isso significa que seu site <strong>NÃO aparecerá</strong> nos resultados de pesquisa orgânica.
                          </p>
                          <p className="text-xs text-red-700 mt-2">
                            💡 Use apenas durante desenvolvimento ou se desejar manter o site privado para buscadores.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {field.value && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Search className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-green-900">✅ Indexação Habilitada</h5>
                          <p className="text-sm text-green-800 mt-1">
                            Seu site será indexado pelo Google e aparecerá nos resultados de busca. 
                            Isso é essencial para SEO e visibilidade online.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seção de SEO */}
            <div className="border-t pt-6 mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🔍 SEO e Meta Informações
              </h4>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="metaTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da Página (SEO)</FormLabel>
                      <FormControl>
                        <Input placeholder="Dra. Adrielle Benhossi - Psicóloga em Campo Mourão | Terapia Online e Presencial" {...field} />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Aparece na aba do navegador e nos resultados do Google (recomendado: até 60 caracteres)
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição da Página (SEO)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Psicóloga CRP 08/123456 em Campo Mourão. Atendimento presencial e online. Especialista em terapia cognitivo-comportamental para seu bem-estar emocional." rows={3} {...field} />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Aparece nos resultados do Google abaixo do título (recomendado: até 160 caracteres)
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metaKeywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Palavras-chave (SEO)</FormLabel>
                      <FormControl>
                        <Input placeholder="psicóloga, Campo Mourão, terapia online, consulta psicológica, saúde mental, CRP" {...field} />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Palavras separadas por vírgula que descrevem seu conteúdo
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}