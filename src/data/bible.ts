export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface DailyVerse {
  reference: string;
  text: string;
  theme: string;
  book: string;
  chapter: number;
  verse: number;
}

export const dailyVerses: DailyVerse[] = [
  {
    reference: "Salmos 23:1",
    text: "O Senhor é o meu pastor; nada me faltará.",
    theme: "Confiança",
    book: "Salmos",
    chapter: 23,
    verse: 1
  },
  {
    reference: "Filipenses 4:13",
    text: "Tudo posso naquele que me fortalece.",
    theme: "Força",
    book: "Filipenses",
    chapter: 4,
    verse: 13
  },
  {
    reference: "Jeremias 29:11",
    text: "Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano, planos de dar a vocês esperança e um futuro.",
    theme: "Esperança",
    book: "Jeremias",
    chapter: 29,
    verse: 11
  },
  {
    reference: "Provérbios 3:5-6",
    text: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento; reconheça o Senhor em todos os seus caminhos, e ele endireitará as suas veredas.",
    theme: "Sabedoria",
    book: "Provérbios",
    chapter: 3,
    verse: 5
  },
  {
    reference: "Isaías 41:10",
    text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.",
    theme: "Coragem",
    book: "Isaías",
    chapter: 41,
    verse: 10
  },
  {
    reference: "Romanos 8:28",
    text: "Sabemos que Deus age em todas as coisas para o bem daqueles que o amam, dos que foram chamados de acordo com o seu propósito.",
    theme: "Propósito",
    book: "Romanos",
    chapter: 8,
    verse: 28
  },
  {
    reference: "João 3:16",
    text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
    theme: "Amor",
    book: "João",
    chapter: 3,
    verse: 16
  },
];

// Lista completa dos 66 livros da Bíblia com abreviações compatíveis com a API
export const bibleBooks = [
  // Antigo Testamento (39 livros)
  { name: "Gênesis", abbrev: "gn", chapters: 50, testament: "old" },
  { name: "Êxodo", abbrev: "ex", chapters: 40, testament: "old" },
  { name: "Levítico", abbrev: "lv", chapters: 27, testament: "old" },
  { name: "Números", abbrev: "nm", chapters: 36, testament: "old" },
  { name: "Deuteronômio", abbrev: "dt", chapters: 34, testament: "old" },
  { name: "Josué", abbrev: "js", chapters: 24, testament: "old" },
  { name: "Juízes", abbrev: "jz", chapters: 21, testament: "old" },
  { name: "Rute", abbrev: "rt", chapters: 4, testament: "old" },
  { name: "1 Samuel", abbrev: "1sm", chapters: 31, testament: "old" },
  { name: "2 Samuel", abbrev: "2sm", chapters: 24, testament: "old" },
  { name: "1 Reis", abbrev: "1rs", chapters: 22, testament: "old" },
  { name: "2 Reis", abbrev: "2rs", chapters: 25, testament: "old" },
  { name: "1 Crônicas", abbrev: "1cr", chapters: 29, testament: "old" },
  { name: "2 Crônicas", abbrev: "2cr", chapters: 36, testament: "old" },
  { name: "Esdras", abbrev: "ed", chapters: 10, testament: "old" },
  { name: "Neemias", abbrev: "ne", chapters: 13, testament: "old" },
  { name: "Ester", abbrev: "et", chapters: 10, testament: "old" },
  { name: "Jó", abbrev: "jó", chapters: 42, testament: "old" },
  { name: "Salmos", abbrev: "sl", chapters: 150, testament: "old" },
  { name: "Provérbios", abbrev: "pv", chapters: 31, testament: "old" },
  { name: "Eclesiastes", abbrev: "ec", chapters: 12, testament: "old" },
  { name: "Cantares", abbrev: "ct", chapters: 8, testament: "old" },
  { name: "Isaías", abbrev: "is", chapters: 66, testament: "old" },
  { name: "Jeremias", abbrev: "jr", chapters: 52, testament: "old" },
  { name: "Lamentações", abbrev: "lm", chapters: 5, testament: "old" },
  { name: "Ezequiel", abbrev: "ez", chapters: 48, testament: "old" },
  { name: "Daniel", abbrev: "dn", chapters: 12, testament: "old" },
  { name: "Oséias", abbrev: "os", chapters: 14, testament: "old" },
  { name: "Joel", abbrev: "jl", chapters: 3, testament: "old" },
  { name: "Amós", abbrev: "am", chapters: 9, testament: "old" },
  { name: "Obadias", abbrev: "ob", chapters: 1, testament: "old" },
  { name: "Jonas", abbrev: "jn", chapters: 4, testament: "old" },
  { name: "Miquéias", abbrev: "mq", chapters: 7, testament: "old" },
  { name: "Naum", abbrev: "na", chapters: 3, testament: "old" },
  { name: "Habacuque", abbrev: "hc", chapters: 3, testament: "old" },
  { name: "Sofonias", abbrev: "sf", chapters: 3, testament: "old" },
  { name: "Ageu", abbrev: "ag", chapters: 2, testament: "old" },
  { name: "Zacarias", abbrev: "zc", chapters: 14, testament: "old" },
  { name: "Malaquias", abbrev: "ml", chapters: 4, testament: "old" },
  // Novo Testamento (27 livros)
  { name: "Mateus", abbrev: "mt", chapters: 28, testament: "new" },
  { name: "Marcos", abbrev: "mc", chapters: 16, testament: "new" },
  { name: "Lucas", abbrev: "lc", chapters: 24, testament: "new" },
  { name: "João", abbrev: "jo", chapters: 21, testament: "new" },
  { name: "Atos", abbrev: "at", chapters: 28, testament: "new" },
  { name: "Romanos", abbrev: "rm", chapters: 16, testament: "new" },
  { name: "1 Coríntios", abbrev: "1co", chapters: 16, testament: "new" },
  { name: "2 Coríntios", abbrev: "2co", chapters: 13, testament: "new" },
  { name: "Gálatas", abbrev: "gl", chapters: 6, testament: "new" },
  { name: "Efésios", abbrev: "ef", chapters: 6, testament: "new" },
  { name: "Filipenses", abbrev: "fp", chapters: 4, testament: "new" },
  { name: "Colossenses", abbrev: "cl", chapters: 4, testament: "new" },
  { name: "1 Tessalonicenses", abbrev: "1ts", chapters: 5, testament: "new" },
  { name: "2 Tessalonicenses", abbrev: "2ts", chapters: 3, testament: "new" },
  { name: "1 Timóteo", abbrev: "1tm", chapters: 6, testament: "new" },
  { name: "2 Timóteo", abbrev: "2tm", chapters: 4, testament: "new" },
  { name: "Tito", abbrev: "tt", chapters: 3, testament: "new" },
  { name: "Filemom", abbrev: "fm", chapters: 1, testament: "new" },
  { name: "Hebreus", abbrev: "hb", chapters: 13, testament: "new" },
  { name: "Tiago", abbrev: "tg", chapters: 5, testament: "new" },
  { name: "1 Pedro", abbrev: "1pe", chapters: 5, testament: "new" },
  { name: "2 Pedro", abbrev: "2pe", chapters: 3, testament: "new" },
  { name: "1 João", abbrev: "1jo", chapters: 5, testament: "new" },
  { name: "2 João", abbrev: "2jo", chapters: 1, testament: "new" },
  { name: "3 João", abbrev: "3jo", chapters: 1, testament: "new" },
  { name: "Judas", abbrev: "jd", chapters: 1, testament: "new" },
  { name: "Apocalipse", abbrev: "ap", chapters: 22, testament: "new" },
];

export const getTodayVerse = (): DailyVerse => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return dailyVerses[dayOfYear % dailyVerses.length];
};
