// Bible API Service - bolls.life with multiple Portuguese versions

export interface BibleVersion {
  code: string;
  name: string;
  fullName: string;
}

export const BIBLE_VERSIONS: BibleVersion[] = [
  // Família Almeida
  { code: "ARA", name: "ARA", fullName: "Almeida Revista e Atualizada" },
  { code: "ARC", name: "ARC", fullName: "Almeida Revista e Corrigida" },
  { code: "ACF", name: "ACF", fullName: "Almeida Corrigida Fiel" },
  { code: "AS21", name: "AS21", fullName: "Almeida Século 21" },
  { code: "NAA", name: "NAA", fullName: "Nova Almeida Atualizada" },
  // Outras versões populares
  { code: "NVI", name: "NVI", fullName: "Nova Versão Internacional" },
  { code: "NVT", name: "NVT", fullName: "Nova Versão Transformadora" },
  { code: "NTLH", name: "NTLH", fullName: "Nova Tradução na Linguagem de Hoje" },
  { code: "NBV", name: "NBV", fullName: "Nova Bíblia Viva" },
  { code: "KJF", name: "KJF", fullName: "King James Fiel" },
  { code: "TB", name: "TB", fullName: "Tradução Brasileira" },
];

export const getVersionInfo = (code: string): BibleVersion | undefined => {
  return BIBLE_VERSIONS.find(v => v.code === code || v.name === code);
};

export interface BibleVerse {
  number: number;
  text: string;
}

export interface BibleChapter {
  book: {
    abbrev: { pt: string };
    name: string;
    author: string;
    group: string;
    version: string;
  };
  chapter: {
    number: number;
    verses: number;
  };
  verses: BibleVerse[];
}

export interface BibleBook {
  abbrev: { pt: string; en: string };
  name: string;
  author: string;
  group: string;
  chapters: number;
  testament: string;
}

// Mapeamento de abreviações para IDs do bolls.life
const bookIdMap: Record<string, number> = {
  "gn": 1, "ex": 2, "lv": 3, "nm": 4, "dt": 5,
  "js": 6, "jz": 7, "rt": 8, "1sm": 9, "2sm": 10,
  "1rs": 11, "2rs": 12, "1cr": 13, "2cr": 14,
  "ed": 15, "ne": 16, "et": 17, "jó": 18, "sl": 19,
  "pv": 20, "ec": 21, "ct": 22, "is": 23, "jr": 24,
  "lm": 25, "ez": 26, "dn": 27, "os": 28, "jl": 29,
  "am": 30, "ob": 31, "jn": 32, "mq": 33, "na": 34,
  "hc": 35, "sf": 36, "ag": 37, "zc": 38, "ml": 39,
  "mt": 40, "mc": 41, "lc": 42, "jo": 43, "at": 44,
  "rm": 45, "1co": 46, "2co": 47, "gl": 48, "ef": 49,
  "fp": 50, "cl": 51, "1ts": 52, "2ts": 53,
  "1tm": 54, "2tm": 55, "tt": 56, "fm": 57, "hb": 58,
  "tg": 59, "1pe": 60, "2pe": 61, "1jo": 62, "2jo": 63,
  "3jo": 64, "jd": 65, "ap": 66,
};

// Mapeamento para nomes em inglês (fallback bible-api.com)
const bookEnglishMap: Record<string, string> = {
  "gn": "genesis", "ex": "exodus", "lv": "leviticus", "nm": "numbers", "dt": "deuteronomy",
  "js": "joshua", "jz": "judges", "rt": "ruth", "1sm": "1samuel", "2sm": "2samuel",
  "1rs": "1kings", "2rs": "2kings", "1cr": "1chronicles", "2cr": "2chronicles",
  "ed": "ezra", "ne": "nehemiah", "et": "esther", "jó": "job", "sl": "psalms",
  "pv": "proverbs", "ec": "ecclesiastes", "ct": "songofsolomon", "is": "isaiah", "jr": "jeremiah",
  "lm": "lamentations", "ez": "ezekiel", "dn": "daniel", "os": "hosea", "jl": "joel",
  "am": "amos", "ob": "obadiah", "jn": "jonah", "mq": "micah", "na": "nahum",
  "hc": "habakkuk", "sf": "zephaniah", "ag": "haggai", "zc": "zechariah", "ml": "malachi",
  "mt": "matthew", "mc": "mark", "lc": "luke", "jo": "john", "at": "acts",
  "rm": "romans", "1co": "1corinthians", "2co": "2corinthians", "gl": "galatians", "ef": "ephesians",
  "fp": "philippians", "cl": "colossians", "1ts": "1thessalonians", "2ts": "2thessalonians",
  "1tm": "1timothy", "2tm": "2timothy", "tt": "titus", "fm": "philemon", "hb": "hebrews",
  "tg": "james", "1pe": "1peter", "2pe": "2peter", "1jo": "1john", "2jo": "2john",
  "3jo": "3john", "jd": "jude", "ap": "revelation",
};

// Nomes dos livros em português
const bookNamesMap: Record<string, string> = {
  "gn": "Gênesis", "ex": "Êxodo", "lv": "Levítico", "nm": "Números", "dt": "Deuteronômio",
  "js": "Josué", "jz": "Juízes", "rt": "Rute", "1sm": "1 Samuel", "2sm": "2 Samuel",
  "1rs": "1 Reis", "2rs": "2 Reis", "1cr": "1 Crônicas", "2cr": "2 Crônicas",
  "ed": "Esdras", "ne": "Neemias", "et": "Ester", "jó": "Jó", "sl": "Salmos",
  "pv": "Provérbios", "ec": "Eclesiastes", "ct": "Cantares", "is": "Isaías", "jr": "Jeremias",
  "lm": "Lamentações", "ez": "Ezequiel", "dn": "Daniel", "os": "Oséias", "jl": "Joel",
  "am": "Amós", "ob": "Obadias", "jn": "Jonas", "mq": "Miquéias", "na": "Naum",
  "hc": "Habacuque", "sf": "Sofonias", "ag": "Ageu", "zc": "Zacarias", "ml": "Malaquias",
  "mt": "Mateus", "mc": "Marcos", "lc": "Lucas", "jo": "João", "at": "Atos",
  "rm": "Romanos", "1co": "1 Coríntios", "2co": "2 Coríntios", "gl": "Gálatas", "ef": "Efésios",
  "fp": "Filipenses", "cl": "Colossenses", "1ts": "1 Tessalonicenses", "2ts": "2 Tessalonicenses",
  "1tm": "1 Timóteo", "2tm": "2 Timóteo", "tt": "Tito", "fm": "Filemom", "hb": "Hebreus",
  "tg": "Tiago", "1pe": "1 Pedro", "2pe": "2 Pedro", "1jo": "1 João", "2jo": "2 João",
  "3jo": "3 João", "jd": "Judas", "ap": "Apocalipse",
};

// Mapeamento de códigos internos para códigos da API bolls.life
const displayToApiCode: Record<string, string> = {
  "NVI": "NVIPT",
  "ARC": "ARC09",
  "ACF": "ACF11",
  "AS21": "ALM21",
  "NBV": "NBV07",
  "KJF": "KJA",
  "TB": "TB10",
};

// Fetch from bolls.life (supports multiple versions)
const fetchFromBolls = async (bookAbbrev: string, chapter: number, version: string = "ARA"): Promise<BibleChapter> => {
  const bookId = bookIdMap[bookAbbrev.toLowerCase()];
  
  if (!bookId) {
    throw new Error(`Livro não encontrado: ${bookAbbrev}`);
  }

  // Map display names to API codes
  const versionCode = displayToApiCode[version] || version;
  
  const response = await fetch(
    `https://bolls.life/get-chapter/${versionCode}/${bookId}/${chapter}/`
  );
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar capítulo: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Capítulo não encontrado");
  }
  
  const verses: BibleVerse[] = data.map((v: { verse: number; text: string }) => ({
    number: v.verse,
    text: v.text,
  }));

  const versionInfo = getVersionInfo(version);
  
  return {
    book: {
      abbrev: { pt: bookAbbrev },
      name: bookNamesMap[bookAbbrev.toLowerCase()] || bookAbbrev,
      author: "",
      group: "",
      version: versionInfo?.name || version,
    },
    chapter: {
      number: chapter,
      verses: verses.length,
    },
    verses,
  };
};

// Fallback to bible-api.com (KJV English)
const fetchFromBibleApi = async (bookAbbrev: string, chapter: number): Promise<BibleChapter> => {
  const bookEnglish = bookEnglishMap[bookAbbrev.toLowerCase()];
  
  if (!bookEnglish) {
    throw new Error(`Livro não encontrado: ${bookAbbrev}`);
  }
  
  const response = await fetch(
    `https://bible-api.com/${bookEnglish}+${chapter}`
  );
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar capítulo: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.verses || data.verses.length === 0) {
    throw new Error("Capítulo não encontrado");
  }
  
  const verses: BibleVerse[] = data.verses.map((v: { verse: number; text: string }) => ({
    number: v.verse,
    text: v.text,
  }));
  
  return {
    book: {
      abbrev: { pt: bookAbbrev },
      name: bookNamesMap[bookAbbrev.toLowerCase()] || data.verses[0]?.book_name || bookAbbrev,
      author: "",
      group: "",
      version: "KJV",
    },
    chapter: {
      number: chapter,
      verses: verses.length,
    },
    verses,
  };
};

export const fetchChapter = async (
  bookAbbrev: string,
  chapter: number,
  version: string = "ARA"
): Promise<BibleChapter> => {
  try {
    // Try bolls.life first with selected version
    return await fetchFromBolls(bookAbbrev, chapter, version);
  } catch (error) {
    console.warn(`bolls.life failed for ${version}, trying fallback:`, error);
    
    // If non-ARA version fails, try ARA as fallback
    if (version !== "ARA") {
      try {
        console.warn("Trying ARA version as fallback");
        return await fetchFromBolls(bookAbbrev, chapter, "ARA");
      } catch {
        // Continue to bible-api fallback
      }
    }
    
    try {
      // Final fallback to bible-api.com (English KJV)
      return await fetchFromBibleApi(bookAbbrev, chapter);
    } catch (fallbackError) {
      console.error("All APIs failed:", fallbackError);
      throw new Error("Erro ao carregar capítulo. Verifique sua conexão.");
    }
  }
};

export const fetchVerse = async (
  bookAbbrev: string,
  chapter: number,
  verse: number,
  version: string = "ARA"
): Promise<{ book: BibleBook; chapter: number; number: number; text: string }> => {
  const chapterData = await fetchChapter(bookAbbrev, chapter, version);
  const verseData = chapterData.verses.find(v => v.number === verse);
  
  if (!verseData) {
    throw new Error("Versículo não encontrado");
  }
  
  return {
    book: {
      abbrev: { pt: bookAbbrev, en: bookEnglishMap[bookAbbrev.toLowerCase()] || bookAbbrev },
      name: chapterData.book.name,
      author: "",
      group: "",
      chapters: 0,
      testament: "",
    },
    chapter,
    number: verse,
    text: verseData.text,
  };
};

export const searchBible = async (
  _query: string,
  _version: string = "ARA"
): Promise<{ verses: Array<{ book: { name: string }; chapter: number; number: number; text: string }> }> => {
  // Search not available with these APIs
  console.warn("Search not available with current API");
  return { verses: [] };
};

export const fetchBooks = async (): Promise<BibleBook[]> => {
  // Return empty array since we use local data for books
  return [];
};
