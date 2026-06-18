import { Phase, Boss, Monster, InventoryItem, ItemRarity } from './types';
import { v4 as uuidv4 } from 'uuid';

export const CLASS_INFO: Record<string, { emoji: string; color: string; description: string }> = {
  Guerreiro: { emoji: '⚔️', color: '#ef4444', description: 'Mestre das armas, força bruta e resistência em combate' },
  Arqueiro: { emoji: '🏹', color: '#22c55e', description: 'Ágil e preciso, ataca de longa distância com arco' },
  Mago: { emoji: '🔮', color: '#8b5cf6', description: 'Domina as artes arcanas e magias poderosas' },
  Paladino: { emoji: '🛡️', color: '#3b82f6', description: 'Guerreiro sagrado, protege aliados com fé divina' },
  Assassino: { emoji: '🗡️', color: '#f59e0b', description: 'Furtivo e mortal, ataca pelas sombras sem ser visto' },
};

export const MONSTERS: Monster[] = [
  {
    name: 'Aranha Sombria',
    phase: 'Floresta das Sombras',
    emoji: '🕷️',
    description: 'Criatura das trevas que tece teias envenenadas entre as árvores mortas da floresta.',
  },
  {
    name: 'Escorpião Sombrio',
    phase: 'Cidade Abandonada',
    emoji: '🦂',
    description: 'Predador mortal que se esconde entre ruínas, seu ferrão carrega veneno das sombras.',
  },
  {
    name: 'Servo do Rei Sombrio',
    phase: 'Castelo do Rei Sombrio',
    emoji: '👻',
    description: 'Guerreiro corrompido pelo poder do Rei Sombrio, serve eternamente nos corredores do castelo.',
  },
];

export const BOSSES: Boss[] = [
  {
    name: 'Arachna, Rainha das Teias',
    phase: 'Floresta das Sombras',
    health: 10,
    maxHealth: 10,
    ability: 'Teia da Perdição — Prende um jogador por 1 rodada, causando 1 de dano',
    story: 'Nas profundezas da Floresta das Sombras, Arachna governa um exército de aranhas sombrias. Outrora uma druida que buscou poder proibido, foi transformada em uma aranha colossal pelo cristal vermelho. Seus olhos brilham com a mesma luz carmesim que corrompe a floresta.',
    reward: {
      id: uuidv4(),
      name: 'Amuleto de Arachna',
      type: 'item',
      rarity: 'Raro',
      quantity: 1,
      description: 'Um amuleto feito das teias douradas de Arachna, pulsa com energia sombria.',
      phase: 'Floresta das Sombras',
    },
    emoji: '🕷️',
  },
  {
    name: 'Skorrath, o Imperador Venenoso',
    phase: 'Cidade Abandonada',
    health: 15,
    maxHealth: 15,
    ability: 'Ferrão Sombrio — Envenena todos os jogadores, causando 1 de dano por rodada durante 2 rodadas',
    story: 'Skorrath era o general que defendia a cidade antes da queda. Quando o Rei Sombrio corrompeu a terra, Skorrath foi transformado em um escorpião gigante, condenado a guardar as ruínas para sempre. Seu veneno é tão potente que corrói até pedra.',
    reward: {
      id: uuidv4(),
      name: 'Coroa do Imperador Venenoso',
      type: 'item',
      rarity: 'Épico',
      quantity: 1,
      description: 'A coroa corrompida de Skorrath, emanando um brilho venenoso esverdeado.',
      phase: 'Cidade Abandonada',
    },
    emoji: '🦂',
  },
  {
    name: 'Rei Sombrio',
    phase: 'Castelo do Rei Sombrio',
    health: 25,
    maxHealth: 25,
    ability: 'Cristal da Ruína — Causa 2 de dano a todos os jogadores e cura 3 de vida própria',
    story: 'O Rei Sombrio governou estas terras com justiça há milênios, até encontrar o Cristal Vermelho nas profundezas do mundo. O cristal consumiu sua alma e transformou seu reino em um pesadelo eterno. Agora ele aguarda em seu trono, alimentando-se do medo dos que ousam desafiá-lo. Derrotá-lo é a única forma de libertar o reino.',
    reward: {
      id: uuidv4(),
      name: 'Cristal Vermelho do Rei Sombrio',
      type: 'item',
      rarity: 'Mítico',
      quantity: 1,
      description: 'O lendário Cristal Vermelho — fonte de todo o poder sombrio. Pulsa com energia infinita.',
      phase: 'Castelo do Rei Sombrio',
    },
    emoji: '👑',
  },
];

export const PHASES: Phase[] = [
  {
    name: 'Floresta das Sombras',
    emoji: '🌲',
    levelRange: [1, 24],
    monster: MONSTERS[0],
    boss: BOSSES[0],
    traps: [
      'Teia Grudenta — O jogador fica preso por 1 turno',
      'Raízes Vivas — Causam 1 de dano ao pisar',
      'Esporos Venenosos — Perda de 1 de vida',
      'Armadilha de Fosso — Cai em buraco, perde 1 turno',
    ],
    description: 'Uma floresta densa e sombria onde a luz do sol jamais penetra. Árvores retorcidas e teias gigantes bloqueiam o caminho. Aranhas sombrias espreitam cada sombra.',
    color: '#16a34a',
  },
  {
    name: 'Cidade Abandonada',
    emoji: '🏚️',
    levelRange: [25, 41],
    monster: MONSTERS[1],
    boss: BOSSES[1],
    traps: [
      'Emboscada de Escorpiões — 3 escorpiões atacam, -1 vida',
      'Piso Desmoronante — Jogador cai um andar, -1 vida',
      'Veneno no Ar — Todos perdem 1 de vida',
      'Armadilha de Lâminas — Lâminas surgem das paredes, -2 vida',
      'Portão Selado — Precisa resolver enigma para avançar',
    ],
    description: 'As ruínas de uma grande cidade que prosperou antes da maldição. Prédios destruídos e ruas vazias escondem escorpiões sombrios e armadilhas mortais.',
    color: '#d97706',
  },
  {
    name: 'Castelo do Rei Sombrio',
    emoji: '🏰',
    levelRange: [42, 68],
    monster: MONSTERS[2],
    boss: BOSSES[2],
    traps: [
      'Corredor de Sombras — Escuridão total, chance de perder 2 de vida',
      'Trono Amaldiçoado — Quem sentar perde 2 de vida',
      'Espelhos da Ilusão — Cria cópias inimigas do jogador',
      'Cristal Explosivo — Explode causando 2 de dano a todos',
      'Selo do Rei — Drena 1 de vida por turno enquanto na sala',
      'Armadilha Final — Último teste antes do boss, -3 vida possível',
    ],
    description: 'O castelo negro do Rei Sombrio, erguido sobre rocha vulcânica. Corredores infinitos, cristais vermelhos pulsando nas paredes e servos sombrios patrulham cada corredor.',
    color: '#dc2626',
  },
];

export function getPhaseForLevel(level: number): Phase | null {
  return PHASES.find(p => level >= p.levelRange[0] && level <= p.levelRange[1]) || null;
}

export function xpForLevel(level: number): number {
  return Math.floor(50 + (level * 25) + (level * level * 2));
}

export const REWARD_TEMPLATES: Record<string, Omit<InventoryItem, 'id'>[]> = {
  'Floresta das Sombras': [
    { name: 'Ouro Sombrio', type: 'ouro', rarity: 'Comum', quantity: 10, description: 'Moedas escurecidas pela maldição da floresta.', phase: 'Floresta das Sombras' },
    { name: 'Cristal Vermelho (Pequeno)', type: 'cristal', rarity: 'Comum', quantity: 1, description: 'Um pequeno cristal pulsando com energia carmesim.', phase: 'Floresta das Sombras' },
    { name: 'Carta da Aranha', type: 'carta', rarity: 'Comum', quantity: 1, description: 'Carta mágica com o espírito de uma aranha sombria.', phase: 'Floresta das Sombras' },
    { name: 'Carta do Arqueiro Sombrio', type: 'carta', rarity: 'Raro', quantity: 1, description: 'Carta rara de um antigo arqueiro corrompido.', phase: 'Floresta das Sombras' },
    { name: 'Poção de Cura Menor', type: 'item', rarity: 'Comum', quantity: 1, description: 'Restaura 1 de vida.', phase: 'Floresta das Sombras' },
    { name: 'Teia de Prata', type: 'item', rarity: 'Raro', quantity: 1, description: 'Material raro das teias de Arachna. Muito valioso.', phase: 'Floresta das Sombras' },
  ],
  'Cidade Abandonada': [
    { name: 'Ouro Sombrio', type: 'ouro', rarity: 'Comum', quantity: 25, description: 'Grande quantidade de moedas sombrias encontradas nas ruínas.', phase: 'Cidade Abandonada' },
    { name: 'Cristal Vermelho (Médio)', type: 'cristal', rarity: 'Raro', quantity: 2, description: 'Cristais médios com considerável energia sombria.', phase: 'Cidade Abandonada' },
    { name: 'Carta do Escorpião', type: 'carta', rarity: 'Raro', quantity: 1, description: 'Carta com o poder venenoso do escorpião sombrio.', phase: 'Cidade Abandonada' },
    { name: 'Carta do General Caído', type: 'carta', rarity: 'Épico', quantity: 1, description: 'Carta épica do general que protegia a cidade.', phase: 'Cidade Abandonada' },
    { name: 'Poção de Cura', type: 'item', rarity: 'Raro', quantity: 1, description: 'Restaura 2 de vida.', phase: 'Cidade Abandonada' },
    { name: 'Antídoto de Skorrath', type: 'item', rarity: 'Épico', quantity: 1, description: 'Cura qualquer veneno. Feito da essência do próprio Skorrath.', phase: 'Cidade Abandonada' },
  ],
  'Castelo do Rei Sombrio': [
    { name: 'Ouro Sombrio', type: 'ouro', rarity: 'Raro', quantity: 50, description: 'Tesouro do próprio Rei Sombrio. Moedas negras como a noite.', phase: 'Castelo do Rei Sombrio' },
    { name: 'Cristal Vermelho (Grande)', type: 'cristal', rarity: 'Épico', quantity: 5, description: 'Cristais grandes pulsando com poder imenso.', phase: 'Castelo do Rei Sombrio' },
    { name: 'Carta do Rei Sombrio', type: 'carta', rarity: 'Mítico', quantity: 1, description: 'A carta mais poderosa do reino. Contém a essência do Rei.', phase: 'Castelo do Rei Sombrio' },
    { name: 'Carta da Sombra Eterna', type: 'carta', rarity: 'Lendário', quantity: 1, description: 'Carta lendária que invoca a escuridão absoluta.', phase: 'Castelo do Rei Sombrio' },
    { name: 'Poção de Cura Suprema', type: 'item', rarity: 'Épico', quantity: 1, description: 'Restaura toda a vida do jogador.', phase: 'Castelo do Rei Sombrio' },
    { name: 'Fragmento do Trono', type: 'item', rarity: 'Lendário', quantity: 1, description: 'Pedaço do trono do Rei Sombrio. Emana poder indescritível.', phase: 'Castelo do Rei Sombrio' },
    { name: 'Manto da Escuridão', type: 'item', rarity: 'Mítico', quantity: 1, description: 'O manto usado pelo próprio Rei Sombrio. Torna o portador invisível nas sombras.', phase: 'Castelo do Rei Sombrio' },
  ],
};

export function getRarityColor(rarity: ItemRarity): string {
  switch (rarity) {
    case 'Comum': return '#9ca3af';
    case 'Raro': return '#3b82f6';
    case 'Épico': return '#8b5cf6';
    case 'Lendário': return '#f59e0b';
    case 'Mítico': return '#ef4444';
    default: return '#9ca3af';
  }
}

export function getRarityBg(rarity: ItemRarity): string {
  switch (rarity) {
    case 'Comum': return 'rgba(156, 163, 175, 0.1)';
    case 'Raro': return 'rgba(59, 130, 246, 0.1)';
    case 'Épico': return 'rgba(139, 92, 246, 0.1)';
    case 'Lendário': return 'rgba(245, 158, 11, 0.1)';
    case 'Mítico': return 'rgba(239, 68, 68, 0.1)';
    default: return 'rgba(156, 163, 175, 0.1)';
  }
}

export function getItemEmoji(type: string): string {
  switch (type) {
    case 'ouro': return '💰';
    case 'cristal': return '💎';
    case 'carta': return '🃏';
    case 'item': return '✨';
    default: return '📦';
  }
}
