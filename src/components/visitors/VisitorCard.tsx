import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisitorCardProps {
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  title: string;
  description: string;
  buttonText: string;
  buttonVariant: "primary" | "accent" | "burgundy" | "gold";
  onClick: () => void;
}

const buttonStyles = {
  primary: "bg-primary hover:bg-primary/90 text-primary-foreground",
  accent: "bg-accent hover:bg-accent/90 text-accent-foreground",
  burgundy: "bg-burgundy hover:bg-burgundy/90 text-white",
  gold: "bg-gold hover:bg-gold/90 text-white",
};

export const VisitorCard = ({
  icon: Icon,
  iconBgColor,
  iconColor,
  title,
  description,
  buttonText,
  buttonVariant,
  onClick,
}: VisitorCardProps) => {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-soft flex flex-col h-full animate-fade-in">
      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-3", iconBgColor)}>
        <Icon className={cn("w-6 h-6", iconColor)} />
      </div>
      <h3 className="text-foreground font-semibold text-base mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm flex-1 mb-4">{description}</p>
      <button
        onClick={onClick}
        className={cn(
          "w-full py-2.5 px-4 font-medium rounded-xl transition-all duration-200 text-sm",
          buttonStyles[buttonVariant]
        )}
      >
        {buttonText}
      </button>
    </div>
  );
};
