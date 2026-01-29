"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { Dumbbell, Shield, Users } from "lucide-react";
import { cn } from "@/lib/utils/formatting";

interface PanelSelectorProps {
  staffName: string;
}

export function PanelSelector({ staffName }: PanelSelectorProps) {
  const router = useRouter();

  const handleSelectPanel = (panel: "admin" | "trainer") => {
    // Save preference in cookie (will be read server-side on next visit)
    document.cookie = `bunker_current_panel=${panel}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.push(panel === "admin" ? "/admin" : "/trainer");
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
          <Dumbbell className="h-8 w-8 text-background" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Bienvenido, {staffName.split(" ")[0]}
        </h1>
        <p className="text-text-secondary">
          Selecciona el panel con el que deseas trabajar
        </p>
      </div>

      {/* Panel Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Admin Panel */}
        <button
          onClick={() => handleSelectPanel("admin")}
          className="text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-xl"
        >
          <Card
            hoverable
            className={cn(
              "p-6 border-2 transition-all duration-200",
              "hover:border-primary hover:bg-primary/5"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-1">
                  Panel Administrador
                </h2>
                <p className="text-sm text-text-secondary mb-3">
                  Gestión completa del gimnasio
                </p>
                <ul className="text-xs text-text-secondary space-y-1">
                  <li>• Gestión de miembros</li>
                  <li>• Control de membresías y pagos</li>
                  <li>• Administrar ejercicios y rutinas</li>
                  <li>• Configuración del sistema</li>
                </ul>
              </div>
            </div>
          </Card>
        </button>

        {/* Trainer Panel */}
        <button
          onClick={() => handleSelectPanel("trainer")}
          className="text-left focus:outline-none focus:ring-2 focus:ring-success focus:ring-offset-2 focus:ring-offset-background rounded-xl"
        >
          <Card
            hoverable
            className={cn(
              "p-6 border-2 transition-all duration-200",
              "hover:border-success hover:bg-success/5"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-1">
                  Panel Entrenador
                </h2>
                <p className="text-sm text-text-secondary mb-3">
                  Enfocado en entrenamientos
                </p>
                <ul className="text-xs text-text-secondary space-y-1">
                  <li>• Gestión de sesiones de entrenamiento</li>
                  <li>• Ver información de miembros</li>
                  <li>• Consultar ejercicios y rutinas</li>
                  <li>• Historial de entrenamientos</li>
                </ul>
              </div>
            </div>
          </Card>
        </button>
      </div>

      {/* Footer hint */}
      <p className="text-center text-xs text-text-secondary mt-6">
        Puedes cambiar de panel en cualquier momento desde el menú lateral
      </p>
    </div>
  );
}
