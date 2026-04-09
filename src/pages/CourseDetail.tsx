import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  Play, 
  ChevronLeft, 
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { useCourse, useCourses, type Lesson } from "@/hooks/useCourses";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CourseDetail = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const navigate = useNavigate();
  const { user, getTenantPath } = useAuth();
  const { course, lessons, isLoading } = useCourse(courseId || "");
  const { getCourseProgress, isLessonCompleted, markLessonComplete } = useCourses();

  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (lessons.length > 0) {
      if (lessonId) {
        const lesson = lessons.find((l) => l.id === lessonId);
        setCurrentLesson(lesson || lessons[0]);
      } else {
        const firstIncomplete = lessons.find((l) => !isLessonCompleted(l.id));
        setCurrentLesson(firstIncomplete || lessons[0]);
      }
    }
  }, [lessons, lessonId, isLessonCompleted]);

  const currentIndex = currentLesson ? lessons.findIndex((l) => l.id === currentLesson.id) : 0;
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const progress = course ? getCourseProgress(course.id, lessons.length) : 0;

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const totalDuration = lessons.reduce((acc, l) => acc + (l.duration_minutes || 0), 0);

  const handleCompleteLesson = async () => {
    if (!user) {
      toast.error("Faça login para marcar aulas como concluídas");
      return;
    }
    if (!currentLesson || !courseId) return;

    try {
      await markLessonComplete.mutateAsync({
        courseId,
        lessonId: currentLesson.id,
      });
      toast.success("Aula concluída!");
      
      if (nextLesson) {
        setCurrentLesson(nextLesson);
      }
    } catch (error) {
      toast.error("Erro ao marcar aula como concluída");
    }
  };

  const getVideoEmbed = (url: string) => {
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return url;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 pt-safe animate-fade-in">
        <Skeleton className="h-10 w-48 mb-8 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <Skeleton className="aspect-video w-full mb-6 rounded-2xl" />
                <Skeleton className="h-8 w-2/3 mb-4 rounded-lg" />
                <Skeleton className="h-20 w-full rounded-xl" />
            </div>
            <div className="space-y-6">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
          <BookOpen className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Curso não encontrado</h2>
        <p className="text-muted-foreground mb-8 max-w-xs">Este conteúdo pode ter sido removido ou o link está incorreto.</p>
        <Button variant="outline" className="rounded-xl px-8 h-12 uppercase text-[10px] font-black tracking-widest" onClick={() => navigate(getTenantPath("/courses"))}>
          Voltar à Lista
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 pt-safe">
        <div className="px-4 py-4 flex items-center gap-4 max-w-6xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(getTenantPath("/courses"))} className="rounded-full bg-secondary/50">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-serif font-bold text-foreground truncate">{course.title}</h1>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              <span>{lessons.length} aulas</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{formatDuration(totalDuration)}</span>
            </div>
          </div>
          {course.category && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0 rounded-lg px-3">
              {course.category.name}
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Video Player & Lesson Info */}
          <div className="lg:col-span-2 space-y-6">
            {currentLesson && (
              <div className="space-y-6 animate-slide-up">
                {/* Responsive Video Container */}
                <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl-soft border border-border/10 ring-1 ring-white/10">
                  <iframe
                    src={getVideoEmbed(currentLesson.video_url)}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>

                {/* Lesson Context */}
                <Card className="border-border/40 shadow-soft bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden">
                  <CardContent className="p-6 md:p-8 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-[10px] font-black uppercase tracking-widest text-primary">Aula {currentIndex + 1}</span>
                           {isLessonCompleted(currentLesson.id) && (
                             <Badge className="bg-green-500/10 text-green-600 border-0 text-[9px] font-black uppercase tracking-tighter">
                               Concluída
                             </Badge>
                           )}
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-foreground leading-tight">{currentLesson.title}</h2>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2 md:pt-0">
                         <div className="w-2 h-2 rounded-full bg-primary/20 animate-pulse" />
                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{currentLesson.duration_minutes || 0} minutos de aula</span>
                      </div>
                    </div>

                    {currentLesson.description && (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                        {currentLesson.description}
                      </div>
                    )}

                    <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row gap-4">
                      {!isLessonCompleted(currentLesson.id) ? (
                        <Button 
                          onClick={handleCompleteLesson}
                          disabled={markLessonComplete.isPending}
                          className="flex-1 h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-soft hover:opacity-90 active:scale-95 transition-all"
                        >
                          {markLessonComplete.isPending ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5 mr-2" />
                              Marcar como Concluída
                            </>
                          )}
                        </Button>
                      ) : (
                         <Button 
                          variant="ghost"
                          className="flex-1 h-14 rounded-2xl text-green-600 bg-green-500/5 hover:bg-green-500/10 font-bold uppercase text-[10px] tracking-widest cursor-default"
                        >
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Conteúdo Concluído
                        </Button>
                      )}
                      
                      <div className="flex gap-2 flex-1">
                        <Button
                          variant="outline"
                          className="flex-1 h-14 rounded-2xl border-border/40 bg-white shadow-soft group"
                          disabled={!prevLesson}
                          onClick={() => prevLesson && setCurrentLesson(prevLesson)}
                        >
                          <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
                          <span className="uppercase text-[9px] font-black tracking-widest">Anterior</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 h-14 rounded-2xl border-border/40 bg-white shadow-soft group"
                          disabled={!nextLesson}
                          onClick={() => nextLesson && setCurrentLesson(nextLesson)}
                        >
                          <span className="uppercase text-[9px] font-black tracking-widest">Próxima</span>
                          <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar: Progress & Navigation */}
          <aside className="space-y-6">
            {/* Progress Visualization */}
            <Card className="border-border/40 shadow-soft bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden animate-slide-up" style={{ animationDelay: "100ms" }}>
              <CardHeader className="pb-3 pt-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Progresso do Curso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-3xl font-serif font-black text-primary leading-none">{progress}%</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Concluído</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground leading-none">
                      {lessons.filter((l) => isLessonCompleted(l.id)).length}/{lessons.length}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Aulas finalizadas</p>
                  </div>
                </div>
                <Progress value={progress} className="h-2 shadow-inner bg-secondary/50" />
              </CardContent>
            </Card>

            {/* Course Information Accordion/List */}
            <Card className="border-border/40 shadow-soft bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden animate-slide-up" style={{ animationDelay: "200ms" }}>
              <CardHeader className="border-b border-border/50 bg-secondary/10 py-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                   <Play className="w-4 h-4 text-primary fill-primary" />
                   Conteúdo Programático
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Accordion type="single" collapsible defaultValue="lessons-list" className="w-full">
                  <AccordionItem value="lessons-list" className="border-0">
                    <AccordionContent className="p-0">
                      <div className="flex flex-col">
                        {lessons.map((lesson, index) => {
                          const completed = isLessonCompleted(lesson.id);
                          const isCurrent = currentLesson?.id === lesson.id;
                          
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => setCurrentLesson(lesson)}
                              className={cn(
                                "group w-full flex items-center gap-4 p-4 text-left transition-all relative border-b border-border/30 last:border-0",
                                isCurrent ? "bg-primary/5" : "hover:bg-muted/50"
                              )}
                            >
                              {isCurrent && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                              )}
                              
                              <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105",
                                completed ? "bg-green-500/10 text-green-600" : 
                                isCurrent ? "bg-primary text-primary-foreground shadow-soft" : "bg-secondary/50 text-muted-foreground"
                              )}>
                                {completed ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : isCurrent ? (
                                  <Play className="w-4 h-4 fill-current" />
                                ) : (
                                  <span className="text-xs font-black">{String(index + 1).padStart(2, '0')}</span>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "text-sm font-bold truncate transition-colors",
                                  isCurrent ? "text-primary" : "text-foreground/80 group-hover:text-foreground"
                                )}>
                                  {lesson.title}
                                </p>
                                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                  <span>{lesson.duration_minutes || 0}min</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Additional Course Metadata */}
            {course.instructor && (
               <Card className="border-border/40 shadow-soft bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden p-6 space-y-4 animate-slide-up" style={{ animationDelay: "300ms" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Ministrado por</p>
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-xl font-serif">
                        {course.instructor.charAt(0)}
                     </div>
                     <span className="font-serif font-bold text-lg text-foreground">{course.instructor}</span>
                  </div>
               </Card>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
};

export default CourseDetail;
