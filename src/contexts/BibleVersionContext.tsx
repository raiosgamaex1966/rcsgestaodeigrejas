import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { BIBLE_VERSIONS, getVersionInfo, BibleVersion } from "@/services/bibleApi";

const STORAGE_KEY = "bible_version";

interface BibleVersionContextType {
  version: string;
  changeVersion: (newVersion: string) => void;
  versionInfo: BibleVersion | undefined;
  versions: BibleVersion[];
}

const BibleVersionContext = createContext<BibleVersionContextType | undefined>(undefined);

export const BibleVersionProvider = ({ children }: { children: ReactNode }) => {
  const [version, setVersion] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) || "ARA";
    }
    return "ARA";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, version);
  }, [version]);

  const changeVersion = (newVersion: string) => {
    setVersion(newVersion);
  };

  const versionInfo = getVersionInfo(version);

  return (
    <BibleVersionContext.Provider
      value={{
        version,
        changeVersion,
        versionInfo,
        versions: BIBLE_VERSIONS,
      }}
    >
      {children}
    </BibleVersionContext.Provider>
  );
};

export const useBibleVersion = () => {
  const context = useContext(BibleVersionContext);
  if (!context) {
    throw new Error("useBibleVersion must be used within a BibleVersionProvider");
  }
  return context;
};

export type { BibleVersion };
