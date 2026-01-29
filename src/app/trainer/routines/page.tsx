"use client";

import { useState } from "react";
import Link from "next/link";
import { useRoutines } from "@/hooks/useRoutines";
import { Header } from "@/components/layout";
import {
  Card,
  Input,
  Select,
  Badge,
  Spinner,
  EmptyState,
} from "@/components/ui";
import { Search, BookOpen, ChevronRight, Dumbbell } from "lucide-react";
import { getDifficultyLabel } from "@/lib/utils/formatting";

export default function TrainerRoutinesPage() {
  const { routines, loading } = useRoutines();

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const filteredRoutines = routines.filter((routine) => {
    const matchesSearch = routine.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesDifficulty =
      difficultyFilter === "all" || routine.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const difficultyVariants: Record<string, "success" | "warning" | "danger"> = {
    beginner: "success",
    intermediate: "warning",
    advanced: "danger",
  };

  return (
    <div>
      <Header title="Plantillas de Rutinas" showSearch={false} />

      <div className="p-6">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-4">
            <div className="flex-1 max-w-md">
              <Input
                type="search"
                placeholder="Buscar rutina..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-5 w-5" />}
              />
            </div>
            <div className="w-48">
              <Select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                options={[
                  { value: "all", label: "Todas las dificultades" },
                  { value: "beginner", label: "Principiante" },
                  { value: "intermediate", label: "Intermedio" },
                  { value: "advanced", label: "Avanzado" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredRoutines.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={searchQuery ? "Sin resultados" : "Sin rutinas"}
            description={
              searchQuery
                ? "No se encontraron rutinas con esos criterios."
                : "No hay plantillas de rutinas disponibles."
            }
          />
        ) : (
          <div className="grid-tablet">
            {filteredRoutines.map((routine) => (
              <Link key={routine.id} href={`/trainer/routines/${routine.id}`}>
                <Card hoverable className="h-full group">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary mb-1">
                        {routine.name}
                      </h3>
                      {routine.description && (
                        <p className="text-sm text-text-secondary line-clamp-2">
                          {routine.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          difficultyVariants[routine.difficulty || "beginner"]
                        }
                        size="sm"
                      >
                        {getDifficultyLabel(routine.difficulty || "beginner")}
                      </Badge>
                      <Badge variant="default" size="sm">
                        <Dumbbell className="h-3 w-3 mr-1" />
                        {routine.routine_template_exercises?.length || 0}{" "}
                        ejercicios
                      </Badge>
                    </div>
                    <ChevronRight className="h-5 w-5 text-text-secondary group-hover:text-success transition-colors" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
