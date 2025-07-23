/**
 * routes.ts
 * 
 * Definição das rotas da API do backend
 * Configura endpoints HTTP para comunicação frontend-backend
 * Utiliza interface de storage para operações de dados
 * Base para expansão de funcionalidades da API
 */

import type { Express } from "express"; // Tipagem do Express
import { createServer, type Server } from "http"; // Servidor HTTP
import { storage } from "./storage"; // Interface de armazenamento
import { insertAdminUserSchema, insertSiteConfigSchema, insertTestimonialSchema, insertFaqItemSchema, insertServiceSchema, insertPhotoCarouselSchema, insertSpecialtySchema } from "@shared/schema";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export async function registerRoutes(app: Express): Promise<Server> {
  // Configuração do Multer para upload de imagens
  const storage_multer = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadType = req.params.type; // 'hero' ou 'testimonials'
      const uploadPath = path.join(process.cwd(), 'uploads', uploadType);
      
      // Cria diretório se não existir
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Gera nome único mantendo a extensão original
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
  });

  const upload = multer({ 
    storage: storage_multer,
    fileFilter: (req, file, cb) => {
      // Aceita apenas imagens
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Apenas arquivos de imagem são permitidos!'));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB máximo
    }
  });

  // Serve arquivos estáticos de upload
  const express = await import('express');
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  // Authentication routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const admin = await storage.getAdminUser(username);
      
      if (!admin || admin.password !== password) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }
      
      // In a real app, you'd use JWT or sessions
      res.json({ success: true, admin: { id: admin.id, username: admin.username } });
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Site config routes
  app.get("/api/admin/config", async (req, res) => {
    try {
      const configs = await storage.getAllSiteConfigs();
      res.json(configs);
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Endpoint público para verificar modo de manutenção (sem autenticação)
  app.get("/api/maintenance-check", async (req, res) => {
    try {
      const configs = await storage.getAllSiteConfigs();
      const maintenanceConfig = configs.find((c: any) => c.key === 'maintenance_mode');
      const generalConfig = configs.find((c: any) => c.key === 'general_info');
      
      res.json({
        maintenance: maintenanceConfig?.value || { enabled: false },
        general: generalConfig?.value || {}
      });
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/config", async (req, res) => {
    try {
      const validatedData = insertSiteConfigSchema.parse(req.body);
      const config = await storage.setSiteConfig(validatedData);
      res.json(config);
    } catch (error) {
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  app.delete("/api/admin/config/:key", async (req, res) => {
    try {
      const key = req.params.key;
      await storage.deleteSiteConfig(key);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao remover configuração" });
    }
  });

  // Upload de imagens
  app.post("/api/admin/upload/:type", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const uploadType = req.params.type;
      const imagePath = `/uploads/${uploadType}/${req.file.filename}`;
      
      // Se for upload de hero, atualiza a configuração
      if (uploadType === 'hero') {
        await storage.setSiteConfig({ key: 'hero_image', value: { path: imagePath } });
      }

      res.json({ 
        success: true, 
        imagePath: imagePath,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      res.status(500).json({ error: "Erro ao fazer upload da imagem" });
    }
  });



  // Testimonials routes
  app.get("/api/testimonials", async (req, res) => {
    try {
      const testimonials = await storage.getActiveTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error('Erro ao buscar testimonials:', error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/admin/testimonials", async (req, res) => {
    try {
      const testimonials = await storage.getAllTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error('Erro ao buscar testimonials (admin):', error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/testimonials", async (req, res) => {
    try {
      const testimonialData = insertTestimonialSchema.parse(req.body);
      const testimonial = await storage.createTestimonial(testimonialData);
      res.json(testimonial);
    } catch (error) {
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  app.put("/api/admin/testimonials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const testimonialData = req.body;
      const testimonial = await storage.updateTestimonial(id, testimonialData);
      res.json(testimonial);
    } catch (error) {
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  app.delete("/api/admin/testimonials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTestimonial(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // FAQ routes
  app.get("/api/faq", async (req, res) => {
    try {
      const faqItems = await storage.getActiveFaqItems();
      res.json(faqItems);
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/admin/faq", async (req, res) => {
    try {
      const faqItems = await storage.getAllFaqItems();
      res.json(faqItems);
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/faq", async (req, res) => {
    try {
      const faqData = insertFaqItemSchema.parse(req.body);
      const faqItem = await storage.createFaqItem(faqData);
      res.json(faqItem);
    } catch (error) {
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  app.put("/api/admin/faq/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const faqData = req.body;
      const faqItem = await storage.updateFaqItem(id, faqData);
      res.json(faqItem);
    } catch (error) {
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  app.delete("/api/admin/faq/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFaqItem(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Services routes
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getActiveServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/admin/services", async (req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/services", async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error) {
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  app.put("/api/admin/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const serviceData = req.body;
      const service = await storage.updateService(id, serviceData);
      res.json(service);
    } catch (error) {
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  app.delete("/api/admin/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteService(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Photo Carousel routes
  app.get("/api/photo-carousel", async (req, res) => {
    try {
      const photos = await storage.getActivePhotoCarousel();
      res.json(photos);
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/admin/photo-carousel", async (req, res) => {
    try {
      const photos = await storage.getAllPhotoCarousel();
      res.json(photos);
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/photo-carousel", async (req, res) => {
    try {
      const photoData = insertPhotoCarouselSchema.parse(req.body);
      const photo = await storage.createPhotoCarousel(photoData);
      res.json(photo);
    } catch (error) {
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  app.put("/api/admin/photo-carousel/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const photoData = req.body;
      const photo = await storage.updatePhotoCarousel(id, photoData);
      res.json(photo);
    } catch (error) {
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  app.delete("/api/admin/photo-carousel/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePhotoCarousel(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Specialties routes
  app.get("/api/specialties", async (req, res) => {
    try {
      const specialties = await storage.getActiveSpecialties();
      res.json(specialties);
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/admin/specialties", async (req, res) => {
    try {
      const specialties = await storage.getAllSpecialties();
      res.json(specialties);
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/admin/specialties", async (req, res) => {
    try {
      const specialtyData = insertSpecialtySchema.parse(req.body);
      const specialty = await storage.createSpecialty(specialtyData);
      res.json(specialty);
    } catch (error) {
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  app.put("/api/admin/specialties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const specialtyData = req.body;
      const specialty = await storage.updateSpecialty(id, specialtyData);
      res.json(specialty);
    } catch (error) {
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  app.delete("/api/admin/specialties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSpecialty(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Contact settings routes
  app.get("/api/contact-settings", async (req, res) => {
    try {
      const contactSettings = await storage.getContactSettings();
      res.json(contactSettings);
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/admin/contact-settings", async (req, res) => {
    try {
      const contactSettings = await storage.getContactSettings();
      res.json(contactSettings);
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.put("/api/admin/contact-settings", async (req, res) => {
    try {
      const contactSettings = await storage.updateContactSettings(req.body);
      res.json(contactSettings);
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Footer settings routes
  app.get("/api/footer-settings", async (req, res) => {
    try {
      const footerSettings = await storage.getFooterSettings();
      res.json(footerSettings);
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/admin/footer-settings", async (req, res) => {
    try {
      const footerSettings = await storage.getFooterSettings();
      res.json(footerSettings);
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.put("/api/admin/footer-settings", async (req, res) => {
    try {
      const footerSettings = await storage.updateFooterSettings(req.body);
      res.json(footerSettings);
    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Rota dinâmica para robots.txt baseada na configuração de indexação
  app.get("/robots.txt", async (req, res) => {
    try {
      const configs = await storage.getAllSiteConfigs();
      const marketingConfig = configs.find((c: any) => c.key === 'marketing_pixels');
      const marketingData = marketingConfig?.value as any || {};
      const enableGoogleIndexing = marketingData.enableGoogleIndexing ?? true;

      res.setHeader('Content-Type', 'text/plain');
      
      if (enableGoogleIndexing) {
        // Permitir indexação
        res.send(`User-agent: *
Allow: /

Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`);
      } else {
        // Bloquear indexação
        res.send(`User-agent: *
Disallow: /`);
      }
    } catch (error) {
      // Fallback para permitir indexação em caso de erro
      res.setHeader('Content-Type', 'text/plain');
      res.send(`User-agent: *
Allow: /`);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
