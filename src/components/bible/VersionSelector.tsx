import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBibleVersion } from "@/hooks/useBibleVersion";

interface VersionSelectorProps {
  className?: string;
}

export const VersionSelector = ({ className }: VersionSelectorProps) => {
  const { version, changeVersion, versions, versionInfo } = useBibleVersion();

  return (
    <Select value={version} onValueChange={changeVersion}>
      <SelectTrigger className={className || "w-[80px] h-8 text-xs"}>
        <SelectValue>{versionInfo?.name || version}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {versions.map((v) => (
          <SelectItem key={v.code} value={v.code}>
            <div className="flex flex-col">
              <span className="font-medium">{v.name}</span>
              <span className="text-xs text-muted-foreground">{v.fullName}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
