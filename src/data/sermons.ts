export interface Sermon {
  id: string;
  title: string;
  preacher: string;
  date: string;
  duration: string;
  theme: string;
  description: string;
  audioUrl?: string;
  videoUrl?: string;
  thumbnail?: string;
  views: number;
  featured?: boolean;
}

export const sermons: Sermon[] = [
  {
    id: "1",
    title: "A Fé que Move Montanhas",
    preacher: "Pr. Anderson Silva",
    date: "2024-01-28",
    duration: "45:30",
    theme: "Fé",
    description: "Uma mensagem poderosa sobre como a fé genuína pode transformar impossibilidades em realidade.",
    views: 1250,
    featured: true,
  },
  {
    id: "2",
    title: "Restauração Familiar",
    preacher: "Pra. Mariana Costa",
    date: "2024-01-21",
    duration: "38:15",
    theme: "Família",
    description: "Princípios bíblicos para restaurar e fortalecer os laços familiares.",
    views: 980,
    featured: true,
  },
  {
    id: "3",
    title: "O Poder da Gratidão",
    preacher: "Pr. Anderson Silva",
    date: "2024-01-14",
    duration: "42:00",
    theme: "Gratidão",
    description: "Descubra como uma vida de gratidão abre portas para bênçãos abundantes.",
    views: 756,
  },
  {
    id: "4",
    title: "Vencendo a Ansiedade",
    preacher: "Pr. Lucas Mendes",
    date: "2024-01-07",
    duration: "35:45",
    theme: "Paz",
    description: "Estratégias bíblicas para vencer a ansiedade e viver em paz.",
    views: 1450,
    featured: true,
  },
  {
    id: "5",
    title: "Chamados para Servir",
    preacher: "Pra. Mariana Costa",
    date: "2023-12-31",
    duration: "40:20",
    theme: "Serviço",
    description: "O chamado de Deus para uma vida de serviço e propósito.",
    views: 620,
  },
  {
    id: "6",
    title: "A Cura Interior",
    preacher: "Pr. Anderson Silva",
    date: "2023-12-24",
    duration: "50:10",
    theme: "Cura",
    description: "O processo de cura das feridas emocionais através do amor de Deus.",
    views: 890,
  },
];

export const themes = [
  "Todos",
  "Fé",
  "Família",
  "Gratidão",
  "Paz",
  "Serviço",
  "Cura",
  "Espírito Santo",
  "Prosperidade",
];
