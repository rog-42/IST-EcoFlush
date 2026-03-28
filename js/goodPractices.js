// Water-saving good practices + XP rewards

export const goodPractices = [
  // 🚽 TOILET / FLUSHING
  {
    id: "half_flush",
    title: "O Meio-Flush Ninja",
    description: "Usar o meio autoclismo sempre que possível, como um mestre da poupança.",
    xp: 10,
    trigger: "half_flush"
  },

  {
    id: "toilet_leak_check",
    title: "Detetive de Fugas",
    description: "Verificar fugas no autoclismo usando o truque do corante.",
    xp: 25,
    trigger: "manual"
  },

  {
    id: "no_toilet_as_trash",
    title: "A Sanita NÃO é o Caixote!",
    description: "Evitar usar a sanita como lixo para não gastar descargas desnecessárias.",
    xp: 15,
    trigger: "manual"
  },

  {
    id: "efficient_public_toilets",
    title: "Caçador de Sanitas Eficientes",
    description: "Usar sanitas públicas (mais eficientes) quando possível.",
    xp: 20,
    trigger: "manual"
  },

  {
    id: "toilet_maintenance",
    title: "Mecânico do Autoclismo",
    description: "Limpar e manter o autoclismo para evitar avarias e fugas.",
    xp: 25,
    trigger: "manual"
  },

  {
    id: "report_water_leaks",
    title: "Herói Anti-Desperdício",
    description: "Reportar fugas de água em casa ou em espaços públicos.",
    xp: 50,
    trigger: "manual"
  },

  // 🚿 SHOWER & PERSONAL HYGIENE
  {
    id: "short_shower",
    title: "Banho Relâmpago",
    description: "Tomar duches de menos de 5 minutos.",
    xp: 30,
    condition: (minutes) => minutes <= 5,
    trigger: "shower"
  },

  {
    id: "soap_with_water_off",
    title: "Modo Ninja do Sabão",
    description: "Fechar a água enquanto te ensaboas.",
    xp: 20,
    trigger: "manual"
  },

  {
    id: "save_cold_water",
    title: "Balde Salvavidas",
    description: "Guardar a água fria inicial do chuveiro num balde.",
    xp: 20,
    trigger: "manual"
  },

  {
    id: "replace_bath_with_shower",
    title: "Adeus Banheira!",
    description: "Trocar banho de imersão por duche.",
    xp: 50,
    trigger: "manual"
  },

  {
    id: "soap_hands_first",
    title: "Mãos Ninja",
    description: "Ensaboar as mãos antes de abrir a água.",
    xp: 5,
    trigger: "manual"
  },

  {
    id: "shower_conscious_timing",
    title: "Duche Zen",
    description: "Tomar banho em horários mais conscientes para reduzir pressão no sistema.",
    xp: 25,
    trigger: "manual"
  },

  // 🪥 DAILY HYGIENE
  {
    id: "close_tap_teeth",
    title: "Dentista Ecológico",
    description: "Fechar a torneira enquanto escovas os dentes.",
    xp: 10,
    trigger: "manual"
  },

  {
    id: "close_tap_shaving",
    title: "Barbeiro Sustentável",
    description: "Fechar a torneira enquanto fazes a barba.",
    xp: 10,
    trigger: "manual"
  },

  {
    id: "wash_hands_efficiently",
    title: "Mãos Eficientes",
    description: "Lavar as mãos sem deixar a água correr continuamente.",
    xp: 5,
    trigger: "manual"
  },

  // 🌍 SOCIAL IMPACT
  {
    id: "convince_someone",
    title: "Missionário da Água",
    description: "Convencer outra pessoa a poupar água (ou instalar a aplicação).",
    xp: 30,
    trigger: "manual"
  }
];

export const alwaysActiveChallenges = ["half_flush", "short_shower"];

// Get XP by ID
export function getPracticeXP(id) {
  const practice = goodPractices.find(p => p.id === id);
  return practice ? practice.xp : 0;
}

// Evaluate conditional practices (e.g., shower duration)
export function evaluateConditionalPractice(trigger, value) {
  return goodPractices.filter(
    p => p.trigger === trigger && p.condition && p.condition(value)
  );
}

