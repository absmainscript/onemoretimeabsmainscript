/**
 * not-found.tsx
 * 
 * Página 404 - Página não encontrada
 * Exibida quando usuário acessa rota inexistente
 * Contém interface amigável com ícone de alerta
 * Design consistente com sistema de UI shadcn
 */

import { Card, CardContent } from "@/components/ui/card"; // Componentes de UI
import { AlertCircle } from "lucide-react"; // Ícone de alerta

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
