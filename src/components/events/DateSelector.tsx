import { useRef, useEffect } from "react";
import { format, addDays, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  daysToShow?: number;
}

export const DateSelector = ({ 
  selectedDate, 
  onDateSelect, 
  daysToShow = 14 
}: DateSelectorProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  
  const dates = Array.from({ length: daysToShow }, (_, i) => addDays(today, i));

  useEffect(() => {
    if (selectedDate && scrollRef.current) {
      const selectedIndex = dates.findIndex(d => isSameDay(d, selectedDate));
      if (selectedIndex > 0) {
        const scrollAmount = selectedIndex * 56;
        scrollRef.current.scrollTo({ left: scrollAmount - 80, behavior: 'smooth' });
      }
    }
  }, [selectedDate]);

  const handleDateClick = (date: Date) => {
    if (selectedDate && isSameDay(date, selectedDate)) {
      onDateSelect(null);
    } else {
      onDateSelect(date);
    }
  };

  return (
    <div className="w-full max-w-[100vw] overflow-hidden box-border">
      <div ref={scrollRef} className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-2 pb-2 w-max min-w-0">
          {dates.map((date) => {
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isTodayDate = isToday(date);
            
            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[52px] h-[68px] rounded-xl transition-all",
                  "border",
                  isSelected 
                    ? "bg-primary text-primary-foreground border-primary shadow-md" 
                    : isTodayDate
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-card text-foreground border-border hover:border-primary/50"
                )}
              >
                <span className={cn(
                  "text-[10px] font-semibold uppercase tracking-wide",
                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {isTodayDate ? "Hoje" : format(date, "EEE", { locale: ptBR })}
                </span>
                <span className={cn(
                  "text-lg font-bold leading-tight",
                  isSelected ? "text-primary-foreground" : ""
                )}>
                  {format(date, "d")}
                </span>
                <span className={cn(
                  "text-[10px] font-medium uppercase",
                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {format(date, "MMM", { locale: ptBR })}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
