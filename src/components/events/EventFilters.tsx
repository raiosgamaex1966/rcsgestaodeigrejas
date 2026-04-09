import { eventTypeConfig } from "./EventTypeBadge";
import { cn } from "@/lib/utils";
import { LayoutGrid } from "lucide-react";

interface EventFiltersProps {
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  className?: string;
}

export const EventFilters = ({ selectedTypes, onTypesChange, className }: EventFiltersProps) => {
  const eventTypes = Object.entries(eventTypeConfig);
  const isAllSelected = selectedTypes.length === 0;

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const selectAll = () => {
    onTypesChange([]);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:overflow-visible md:mx-0 md:px-0">
        <div className="flex gap-2 pb-2 w-max min-w-0 pr-12 md:w-full md:flex-wrap md:pr-0">
          {/* "Todos" chip */}
          <button
            onClick={selectAll}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              isAllSelected
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Todos
          </button>

          {/* Event type chips */}
          {eventTypes.map(([type, config]) => {
            const Icon = config.icon;
            const isSelected = selectedTypes.includes(type);

            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon className="w-4 h-4" />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
