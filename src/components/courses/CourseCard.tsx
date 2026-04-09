import { Link } from "react-router-dom";
import { Clock, BookOpen, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Course } from "@/hooks/useCourses";

interface CourseCardProps {
  course: Course;
  progress?: number;
}

export const CourseCard = ({ course, progress = 0 }: CourseCardProps) => {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const difficultyLabel = {
    easy: "Iniciante",
    medium: "Intermediário",
    hard: "Avançado",
  }[course.difficulty || "medium"] || "Intermediário";

  return (
    <Link to={`/courses/${course.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group h-full">
        {/* Cover Image */}
        <div className="relative aspect-video bg-gradient-to-br from-primary to-primary/80 overflow-hidden">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-primary-foreground/50" />
            </div>
          )}
          
          {/* Category Badge */}
          {course.category && (
            <Badge 
              className="absolute top-2 left-2 bg-secondary/90 text-secondary-foreground backdrop-blur-sm"
            >
              {course.category.name}
            </Badge>
          )}
          
          {/* Difficulty Badge */}
          <Badge 
            variant="outline" 
            className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-xs"
          >
            {difficultyLabel}
          </Badge>
        </div>

        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          
          {course.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {course.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {course.lessons_count || 0} aulas
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(course.total_duration || 0)}
            </span>
          </div>

          {/* Progress Bar */}
          {progress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center justify-between pt-2">
            {course.instructor && (
              <span className="text-xs text-muted-foreground">
                {course.instructor}
              </span>
            )}
            <span className="text-sm font-medium text-primary flex items-center gap-1 ml-auto group-hover:gap-2 transition-all">
              {progress > 0 ? "Continuar" : "Começar"}
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
