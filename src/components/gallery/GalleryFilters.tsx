import { useState } from "react";
import { Search, Calendar, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GalleryFiltersProps {
  onSearchChange: (search: string) => void;
  onYearChange: (year: string | null) => void;
  years: number[];
  selectedYear: string | null;
}

export const GalleryFilters = ({
  onSearchChange,
  onYearChange,
  years,
  selectedYear,
}: GalleryFiltersProps) => {
  const [search, setSearch] = useState("");

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearchChange(value);
  };

  const clearFilters = () => {
    setSearch("");
    onSearchChange("");
    onYearChange(null);
  };

  const hasFilters = search || selectedYear;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar álbum..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Year filter */}
      <Select
        value={selectedYear || "all"}
        onValueChange={(v) => onYearChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os anos</SelectItem>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={clearFilters}>
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
