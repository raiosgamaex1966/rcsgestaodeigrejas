import { useState } from "react";
import { BookOpen, Star, Eye, Clock, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CourseCard } from "@/components/courses/CourseCard";
import { useCourses } from "@/hooks/useCourses";
import { cn } from "@/lib/utils";

const Courses = () => {
  const { courses, categories, progress, isLoading, getCourseProgress } = useCourses();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCourses = selectedCategory
    ? courses.filter((c) => c.category_id === selectedCategory)
    : courses;

  const featuredCourses = courses.filter((c) => c.is_featured);

  const totalCourses = courses.length;
  const totalCategories = categories.length;
  const completedLessons = progress.length;
  const totalDuration = courses.reduce((acc, c) => acc + (c.total_duration || 0), 0);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const metrics = [
    { icon: BookOpen, label: "Total de Cursos", value: totalCourses, color: "bg-secondary" },
    { icon: Star, label: "Categorias", value: totalCategories, color: "bg-primary/10" },
    { icon: Eye, label: "Aulas Concluídas", value: completedLessons, color: "bg-green-500/10" },
    { icon: Clock, label: "Tempo Total", value: formatDuration(totalDuration), color: "bg-purple-500/10" },
  ];

  if (isLoading) {
    return (
      <div className="p-4 space-y-6 pb-20 pt-safe">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24 pt-safe animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-soft">
          <GraduationCap className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Cursos</h1>
          <p className="text-sm text-muted-foreground">Treinamentos e estudos em vídeo</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", metric.color)}>
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{metric.value}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight uppercase font-bold tracking-tighter">{metric.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-serif font-bold text-foreground">Em Destaque</h2>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-4 pb-4">
              {featuredCourses.map((course) => (
                <div key={course.id} className="w-72 flex-shrink-0 animate-scale-in">
                  <CourseCard 
                    course={course} 
                    progress={getCourseProgress(course.id, course.lessons_count || 0)} 
                  />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}

      {/* Category Filter */}
      {categories.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className={cn("cursor-pointer shrink-0 rounded-full px-4 py-1.5", selectedCategory === null && "shadow-soft")}
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                className={cn("cursor-pointer shrink-0 rounded-full px-4 py-1.5", selectedCategory === cat.id && "shadow-soft")}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </Badge>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Courses Grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-serif font-bold text-foreground">
          {selectedCategory
            ? categories.find((c) => c.id === selectedCategory)?.name
            : "Todos os Cursos"}
        </h2>
        
        {filteredCourses.length === 0 ? (
          <Card className="p-12 text-center bg-card/30 backdrop-blur-sm border-dashed border-2">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum curso disponível nesta categoria</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredCourses.map((course, index) => (
              <div key={course.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <CourseCard
                  course={course}
                  progress={getCourseProgress(course.id, course.lessons_count || 0)}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Courses;
