import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventCountdownProps {
  targetDate: Date;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const EventCountdown = ({ targetDate, className }: EventCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isExpired) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <Clock className="w-4 h-4" />
        <span className="text-sm">Evento em andamento</span>
      </div>
    );
  }

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-primary/10 text-primary font-bold text-lg md:text-xl px-2 md:px-3 py-1 rounded-lg min-w-[40px] text-center">
        {value.toString().padStart(2, "0")}
      </div>
      <span className="text-[10px] text-muted-foreground mt-1">{label}</span>
    </div>
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <TimeBlock value={timeLeft.days} label="dias" />
      <span className="text-muted-foreground font-bold">:</span>
      <TimeBlock value={timeLeft.hours} label="horas" />
      <span className="text-muted-foreground font-bold">:</span>
      <TimeBlock value={timeLeft.minutes} label="min" />
      <span className="text-muted-foreground font-bold hidden md:block">:</span>
      <div className="hidden md:block">
        <TimeBlock value={timeLeft.seconds} label="seg" />
      </div>
    </div>
  );
};
