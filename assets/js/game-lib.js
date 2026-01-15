// ================================================================
// GAME LIBRARY (game-lib.js)
// Lógica de processamento e banco de dados do Crônicas RPG
// ================================================================

// --- CONFIGURAÇÕES ---
const STORAGE_KEY_V2 = 'cronicas_saves_v2';
const NIVEL_MAX_CLASSE_BASICA = 20;

// --- RAÇAS ---
const RACAS = {
    'Humano': {
        description: "Versáteis e ambiciosos.",
        bonus: { forca: 1, habilidade: 1, resistencia: 1, armadura: 1, poderDeFogo: 1 },
        trait: { nome: "Prodígio", desc: "+10% de ganho de XP." }
    },
    'Elfo': {
        description: "Graciosos e mágicos.",
        bonus: { habilidade: 2, poderDeFogo: 2, resistencia: 0, forca: 0, armadura: 0 }, // Net +4
        trait: { nome: "Graça Élfica", desc: "+10 Mana inicial e +1 Mana por nível." }
    },
    'Anão': {
        description: "Robustos mestres da forja.",
        bonus: { forca: 1, resistencia: 2, armadura: 1, habilidade: -1, poderDeFogo: 0 }, // Net +3 (Strong Def)
        trait: { nome: "Pele de Pedra", desc: "+20 Vida Máxima." }
    },
    'Orc': {
        description: "Guerreiros brutais.",
        bonus: { forca: 3, resistencia: 1, habilidade: -1, poderDeFogo: -1, armadura: 1 }, // Net +3
        trait: { nome: "Fúria", desc: "+2 Dano físico fixo." }
    },
    'Celestial': {
        description: "Descendência divina.",
        bonus: { poderDeFogo: 2, habilidade: 1, resistencia: 1, forca: 0, armadura: 0 }, // Net +4
        trait: { nome: "Proteção Divina", desc: "+2 Armadura e +2 Resistência (Passivo)." }
    }
};

// --- CLASSES E EVOLUÇÕES ---
const CLASSES = {
    'Guerreiro': {
        description: "Combate corpo a corpo.", icon: "⚔️",
        recurso: { nome: "FÚRIA", cor: "bg-red-600" },
        bonus: { forca: 3, armadura: 2 }
    },
    'Mago': {
        description: "Artes arcanas.", icon: "🧙‍♂️",
        recurso: { nome: "MANA", cor: "bg-blue-600" },
        bonus: { poderDeFogo: 3, habilidade: 2 }
    },
    'Ladino': {
        description: "Furtividade e precisão.", icon: "🗡️",
        recurso: { nome: "ENERGIA", cor: "bg-yellow-500" },
        bonus: { habilidade: 3, forca: 2 }
    },
    'Paladino': {
        description: "Guerreiros santos.", icon: "🛡️",
        recurso: { nome: "FÉ", cor: "bg-cyan-400" },
        bonus: { resistencia: 2, forca: 2, armadura: 1 }
    },
    'Necromante': {
        description: "Magia da morte.", icon: "💀",
        recurso: { nome: "ALMAS", cor: "bg-purple-800" },
        bonus: { poderDeFogo: 3, resistencia: 2 }
    },
    'Bardo': {
        description: "Música e magia.", icon: "🎵",
        recurso: { nome: "INSPIRAÇÃO", cor: "bg-pink-500" },
        bonus: { habilidade: 2, poderDeFogo: 2, resistencia: 1 }
    },
    'Clérigo': {
        description: "Cura divina.", icon: "✨",
        recurso: { nome: "FÉ", cor: "bg-cyan-400" },
        bonus: { resistencia: 3, poderDeFogo: 2 }
    },
    'Druida': {
        description: "Força da natureza.", icon: "🌿",
        recurso: { nome: "MANA", cor: "bg-green-600" },
        bonus: { forca: 2, poderDeFogo: 2, resistencia: 1 }
    },
    'Arqueiro': {
        description: "Mestre do arco e flecha.", icon: "🏹",
        recurso: { nome: "ENERGIA", cor: "bg-yellow-500" },
        bonus: { habilidade: 3, forca: 1, poderDeFogo: 1 }
    },
    // Evoluções podem ter bonus cumulativos ou serem apenas flavor/skills no futuro
    'Cavaleiro': { description: "Mestre do combate.", icon: "🏇", recurso: { nome: "VIGOR", cor: "bg-red-700" } }, // Mantem bonus base
    'Arquimago': { description: "Mestre dos arcanos.", icon: "🔮", recurso: { nome: "MANA", cor: "bg-blue-600" } },
    'Assassino': { description: "Mestre das sombras.", icon: "🌑", recurso: { nome: "ENERGIA", cor: "bg-yellow-500" } },
    'Cruzado': { description: "Campeão divino.", icon: "✝️", recurso: { nome: "FÉ", cor: "bg-cyan-400" } },
    'Lich': { description: "Senhor dos mortos.", icon: "☠️", recurso: { nome: "ALMAS", cor: "bg-purple-800" } },
    'Trovador': { description: "Lenda musical.", icon: "🎶", recurso: { nome: "INSPIRAÇÃO", cor: "bg-pink-500" } },
    'Sumo-Sacerdote': { description: "Voz dos deuses.", icon: "🌟", recurso: { nome: "FÉ", cor: "bg-cyan-400" } },
    'Guardião': { description: "Protetor da floresta.", icon: "🌲", recurso: { nome: "MANA", cor: "bg-green-600" } },
    'Sentinela': { description: "Olhos de águia, mira perfeita.", icon: "🦅", recurso: { nome: "ENERGIA", cor: "bg-yellow-500" } }
};

const EVOLUCOES = {
    'Guerreiro': 'Cavaleiro',
    'Mago': 'Arquimago',
    'Ladino': 'Assassino',
    'Paladino': 'Cruzado',
    'Necromante': 'Lich',
    'Bardo': 'Trovador',
    'Clérigo': 'Sumo-Sacerdote',
    'Druida': 'Guardião',
    'Arqueiro': 'Sentinela'
};

// --- HABILIDADES (Antigas Magias) ---
const HABILIDADES_LOJA = [
    // --- GUERREIRO ---
    { id: 'g_golpe', nome: "Golpe Pesado", classe: 'Guerreiro', custo: 100, mana: 5, tipo: 'Físico', poder: 6, desc: "Ataque forte com arma." },
    { id: 'g_grito', nome: "Grito de Guerra", classe: 'Guerreiro', custo: 200, mana: 8, tipo: 'Buff', poder: 3, desc: "+3 Dano temporário." },
    { id: 'g_corte', nome: "Corte Giratório", classe: 'Guerreiro', custo: 400, mana: 15, tipo: 'Físico', poder: 12, desc: "Ataque em área (focado)." },

    // --- MAGO ---
    { id: 'm_missil', nome: "Míssil Mágico", classe: 'Mago', custo: 100, mana: 4, tipo: 'Mágico', poder: 6, desc: "Dano arcano infalível." },
    { id: 'm_fogo', nome: "Bola de Fogo", classe: 'Mago', custo: 300, mana: 10, tipo: 'Mágico', poder: 10, desc: "Explosão térmica." },
    { id: 'm_escudo', nome: "Escudo de Mana", classe: 'Mago', custo: 250, mana: 8, tipo: 'Buff', poder: 5, desc: "Absorve dano." },

    // --- LADINO ---
    { id: 'l_adaga', nome: "Punhalada", classe: 'Ladino', custo: 150, mana: 5, tipo: 'Físico', poder: 8, desc: "Crítico garantido pelas costas." },
    { id: 'l_veneno', nome: "Lâmina Venenosa", classe: 'Ladino', custo: 250, mana: 8, tipo: 'DoT', poder: 4, desc: "Dano por turno." },
    { id: 'l_sombras', nome: "Passo Sombrio", classe: 'Ladino', custo: 300, mana: 12, tipo: 'Buff', poder: 0, desc: "Imune por 1 turno." },

    // --- PALADINO ---
    { id: 'p_luz', nome: "Golpe Sacro", classe: 'Paladino', custo: 200, mana: 6, tipo: 'Físico/Sagrado', poder: 7, desc: "Dano + Cura pequena." },
    { id: 'p_cura', nome: "Imposição de Mãos", classe: 'Paladino', custo: 300, mana: 10, tipo: 'Cura', poder: 15, desc: "Grande cura em si mesmo." },

    // --- CLÉRIGO ---
    { id: 'c_cura', nome: "Cura Maior", classe: 'Clérigo', custo: 200, mana: 8, tipo: 'Cura', poder: 20, desc: "Recupera muita vida." },
    { id: 'c_luz', nome: "Punição Divina", classe: 'Clérigo', custo: 250, mana: 8, tipo: 'Mágico', poder: 8, desc: "Queima inimigos com fé." },

    // --- ARQUEIRO ---
    { id: 'a_duplo', nome: "Disparo Duplo", classe: 'Arqueiro', custo: 150, mana: 6, tipo: 'Físico', poder: 7, desc: "Duas flechas rápidas." },
    { id: 'a_chuva', nome: "Chuva de Flechas", classe: 'Arqueiro', custo: 350, mana: 12, tipo: 'Físico', poder: 10, desc: "Atinge múltiplos inimigos." },

    // --- NECROMANTE ---
    { id: 'n_drenar', nome: "Drenar Vida", classe: 'Necromante', custo: 250, mana: 8, tipo: 'Mágico', poder: 6, desc: "Rouba vida do alvo." },
    { id: 'n_esqueleto', nome: "Invocar Morto", classe: 'Necromante', custo: 400, mana: 20, tipo: 'Summon', poder: 0, desc: "Invoca ajudante." },

    // --- BARDO ---
    { id: 'b_inspirar', nome: "Canção da Coragem", classe: 'Bardo', custo: 200, mana: 10, tipo: 'Buff', poder: 2, desc: "+2 em todos atributos." },
    { id: 'b_dissonante', nome: "Acorde Dissonante", classe: 'Bardo', custo: 250, mana: 8, tipo: 'Mágico', poder: 8, desc: "Dano sônico." },

    // --- DRUIDA ---
    { id: 'd_vinhas', nome: "Vinhas Esmagadoras", classe: 'Druida', custo: 200, mana: 8, tipo: 'Mágico', poder: 7, desc: "Dano de terra." },
    { id: 'd_urso', nome: "Forma de Urso", classe: 'Druida', custo: 500, mana: 20, tipo: 'Transform', poder: 10, desc: "+10 Força/Res temp." }
];

// --- ITENS À VENDA NAS LOJAS (Expandido) ---
const ITENS_LOJA = [
    // --- CONSUMÍVEIS ---
    { id: 'pocao_p', nome: "Poção de Vida (P)", preco: 50, tipo: "Consumivel", efeito: { hp: 20 }, desc: "Recupera 20 PV" },
    { id: 'pocao_g', nome: "Poção de Vida (G)", preco: 150, tipo: "Consumivel", efeito: { hp: 50 }, desc: "Recupera 50 PV" },
    { id: 'mana_p', nome: "Poção de Mana (P)", preco: 50, tipo: "Consumivel", efeito: { mana: 20 }, desc: "Recupera 20 PM" },
    { id: 'mana_g', nome: "Poção de Mana (G)", preco: 150, tipo: "Consumivel", efeito: { mana: 50 }, desc: "Recupera 50 PM" },

    // --- GUERREIRO ---
    { id: 'g_espada_aco', nome: "Espada de Aço", preco: 400, tipo: "Arma", classe: "Guerreiro", bonus: { forca: 4 }, desc: "Lâmina confiável." },
    { id: 'g_machado_duplo', nome: "Machado Duplo", preco: 1200, tipo: "Arma", classe: "Guerreiro", bonus: { forca: 8, habilidade: -1 }, desc: "Devastador." },
    { id: 'g_placas', nome: "Placas de Ferro", preco: 800, tipo: "Armadura", classe: "Guerreiro", bonus: { armadura: 5 }, desc: "Proteção pesada." },
    { id: 'g_placas_mithril', nome: "Placas de Mithril", preco: 3000, tipo: "Armadura", classe: "Guerreiro", bonus: { armadura: 10, resistencia: 2 }, desc: "Leve e impenetrável." },

    // --- MAGO / NECROMANTE ---
    { id: 'm_cajado_carvalho', nome: "Cajado de Carvalho", preco: 300, tipo: "Arma", classe: "Mago", bonus: { poderDeFogo: 3 }, desc: "Foco arcano básico." },
    { id: 'm_cajado_rubi', nome: "Cajado de Rubi", preco: 1500, tipo: "Arma", classe: "Mago", bonus: { poderDeFogo: 8, mana: 10 }, desc: "Pulsando com magia." },
    { id: 'm_robe', nome: "Robe de Aprendiz", preco: 250, tipo: "Armadura", classe: "Mago", bonus: { armadura: 1, mana: 10 }, desc: "Tecido simples." },
    { id: 'm_robe_arquimago', nome: "Robe do Arquimago", preco: 2000, tipo: "Armadura", classe: "Mago", bonus: { armadura: 3, resistencia: 5, mana: 30 }, desc: "Encantado com proteções." },

    // --- LADINO / ARQUEIRO ---
    { id: 'l_adagas', nome: "Adagas de Aço", preco: 350, tipo: "Arma", classe: "Ladino", bonus: { habilidade: 3, forca: 1 }, desc: "Rápidas." },
    { id: 'l_arco_comp', nome: "Arco Composto", preco: 600, tipo: "Arma", classe: "Arqueiro", bonus: { habilidade: 5 }, desc: "Longo alcance." },
    { id: 'l_couro', nome: "Couro Batido", preco: 400, tipo: "Armadura", classe: "Ladino", bonus: { armadura: 3, habilidade: 1 }, desc: "Não faz barulho." },
    { id: 'l_capa_sombra', nome: "Capa das Sombras", preco: 1800, tipo: "Armadura", classe: "Ladino", bonus: { armadura: 5, habilidade: 4 }, desc: "Mescla-se com o escuro." },

    // --- PALADINO / CLÉRIGO ---
    { id: 'p_martelo', nome: "Martelo de Guerra", preco: 500, tipo: "Arma", classe: "Paladino", bonus: { forca: 4, poderDeFogo: 1 }, desc: "Esmaga hereges." },
    { id: 'p_maca', nome: "Maça Consagrada", preco: 1000, tipo: "Arma", classe: "Clérigo", bonus: { poderDeFogo: 5, forca: 2 }, desc: "Brilha com luz." },
    { id: 'p_cota_malha', nome: "Cota de Malha Sagrada", preco: 900, tipo: "Armadura", classe: "Paladino", bonus: { armadura: 6, resistencia: 2 }, desc: "Abençoada." },

    // --- DRUIDA ---
    { id: 'd_foice', nome: "Foice da Natureza", preco: 450, tipo: "Arma", classe: "Druida", bonus: { forca: 2, poderDeFogo: 3 }, desc: "Ferramenta druídica." },
    { id: 'd_pelames', nome: "Manto de Peles", preco: 500, tipo: "Armadura", classe: "Druida", bonus: { armadura: 4, resistencia: 2 }, desc: "Pele de urso real." },

    // --- BARDO ---
    { id: 'b_alaude', nome: "Alaude Mágico", preco: 600, tipo: "Arma", classe: "Bardo", bonus: { poderDeFogo: 4, habilidade: 2 }, desc: "Toca sozinho." },
    { id: 'b_roupa_fina', nome: "Roupas da Corte", preco: 700, tipo: "Armadura", classe: "Bardo", bonus: { armadura: 2, habilidade: 3 }, desc: "Estilosas." }
];

const RANKS_GUILDA = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS'];

const LOCAIS_FIXOS = [
    { nome: "Vila Verdejante", tipo: "Vila", bioma: "Planície", descricao: "Uma ilha pacífica cercada pelo mar.", x: 44, y: 57 },
    { nome: "Floresta Sombria", tipo: "Sombria", bioma: "Sombria", descricao: "Árvores mortas e terras amaldiçoadas.", x: 88, y: 40 },
    { nome: "Bosque Ancestral", tipo: "Floresta", bioma: "Floresta", descricao: "Árvores gigantes e magia antiga.", x: 36, y: 42 },
    { nome: "Montanhas de Gelo", tipo: "Montanha", bioma: "Gelo", descricao: "Picos eternamente congelados e perigosos.", x: 62, y: 18 },
    { nome: "Montanhas de Ferro", tipo: "Montanha", bioma: "Montanha", descricao: "Minas antigas e picos rochosos.", x: 50, y: 17 },
    { nome: "Pântano da Perdição", tipo: "Pântano", bioma: "Pântano", descricao: "Águas tóxicas e criaturas venenosas.", x: 75, y: 70 },
    { nome: "Cidadela Real", tipo: "Cidade", bioma: "Urbano", descricao: "A capital do reino, estratégica entre os rios.", x: 50, y: 43 }
];

// --- Imagens de Bioma ---
const BIOME_IMAGES = {
    'Vila': './assets/bg_vila.png',
    'Cidade': './assets/bg_cidade.png',
    'Floresta': './assets/bg_floresta.png',
    'Sombria': './assets/bg_sombria.png',
    'Montanha': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000', // Montanha
    'Caverna': 'https://images.unsplash.com/photo-1504333638930-c8787321eee0?q=80&w=2000', // Caverna Escura
    'Ruínas': 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=2000', // Ruínas
    'Deserto': 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=2000', // Deserto
    'Gelado': 'https://images.unsplash.com/photo-1623594247514-9b2f21af5866?q=80&w=2000', // Neve/Gelo
    'Pântano': './assets/bg_pantano.png',
    'Padrão': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000' // Genérico Épico
};

// --- LOGICA DE GERAÇÃO E PROCESSAMENTO ---
const Gerador = {
    monstro: (nivel, local) => {
        // Pools de Monstros por Região
        const POOLS = {
            "Vila Verdejante": [
                { nome: "Ratataz", baseHp: 25, baseDano: 3, xp: 15, ouro: 5 },
                { nome: "Slime", baseHp: 30, baseDano: 4, xp: 18, ouro: 6 },
                { nome: "Bandido Pé-de-Chinelo", baseHp: 40, baseDano: 5, xp: 20, ouro: 10 }
            ],
            "Bosque Ancestral": [
                { nome: "Lobo Faminto", baseHp: 50, baseDano: 6, xp: 40, ouro: 8, drop: "Pele de Lobo" },
                { nome: "Urso Pardo", baseHp: 100, baseDano: 10, xp: 90, ouro: 15, drop: "Garra de Urso" },
                { nome: "Javali Selvagem", baseHp: 70, baseDano: 8, xp: 50, ouro: 10 },
                { nome: "Bandido da Estrada", baseHp: 60, baseDano: 7, xp: 45, ouro: 25 }
            ],
            "Floresta Sombria": [
                { nome: "Esqueleto Guerreiro", baseHp: 70, baseDano: 9, xp: 50, ouro: 12, drop: "Osso Antigo" },
                { nome: "Aranha Gigante", baseHp: 80, baseDano: 11, xp: 60, ouro: 15, drop: "Veneno de Aranha" },
                { nome: "Goblin Saqueador", baseHp: 50, baseDano: 7, xp: 35, ouro: 10 },
                { nome: "Espectro", baseHp: 120, baseDano: 15, xp: 120, ouro: 40, drop: "Ectoplasma" },
                { nome: "Dragão Jovem", baseHp: 300, baseDano: 25, xp: 400, ouro: 150, drop: "Escama de Dragão" } // Chefe Raro
            ],
            "Montanhas de Ferro": [
                { nome: "Orc Guerreiro", baseHp: 120, baseDano: 16, xp: 90, ouro: 30, drop: "Machado Velho" },
                { nome: "Troll da Montanha", baseHp: 250, baseDano: 22, xp: 200, ouro: 60, drop: "Couro de Troll" },
                { nome: "Golem de Pedra", baseHp: 350, baseDano: 18, xp: 250, ouro: 100, drop: "Minério de Ferro" }
            ],
            "Pântano da Perdição": [
                { nome: "Slime Tóxico", baseHp: 90, baseDano: 12, xp: 60, ouro: 20 },
                { nome: "Cobra Gigante", baseHp: 110, baseDano: 15, xp: 90, ouro: 25, drop: "Presa de Cobra" },
                { nome: "Crocodilo Ancião", baseHp: 200, baseDano: 20, xp: 150, ouro: 40, drop: "Couro Rígido" }
            ],
            "Montanhas de Gelo": [
                { nome: "Lobo das Neves", baseHp: 100, baseDano: 15, xp: 80, ouro: 20, drop: "Pele de Lobo Branco" },
                { nome: "Yeti", baseHp: 400, baseDano: 30, xp: 350, ouro: 90, drop: "Pele de Yeti" },
                { nome: "Elemental de Gelo", baseHp: 300, baseDano: 35, xp: 280, ouro: 70, drop: "Fragmento de Gelo" },
                { nome: "Guerreiro Nórdico", baseHp: 150, baseDano: 20, xp: 120, ouro: 50 },
                { nome: "Gigante de Gelo", baseHp: 800, baseDano: 50, xp: 800, ouro: 350, drop: "Armadura Congelada" },
                { nome: "Dragão Branco", baseHp: 2500, baseDano: 80, xp: 2000, ouro: 1500, drop: "Lâmina de Gelo" }
            ],
            "Cidadela Real": [
                { nome: "Rato de Esgoto", baseHp: 20, baseDano: 5, xp: 10, ouro: 2 },
                { nome: "Ladrão Urbano", baseHp: 50, baseDano: 8, xp: 40, ouro: 50 }
            ]
        };

        // NÍVEIS MÁXIMOS POR REGIÃO (Para evitar scaling infinito)
        const LEVEL_CAPS = {
            "Vila Verdejante": 5,
            "Floresta Sombria": 15,
            "Bosque Ancestral": 10,
            "Montanhas de Gelo": 35,
            "Montanhas de Ferro": 25,
            "Pântano da Perdição": 20,
            "Cidadela Real": 8 // Área inicial/segura
            // Locais sem cap (undefined) escalarão livremente
        };

        // Seleciona a pool baseada no local, ou usa Bosque como fallback
        let pool = POOLS[local] || POOLS["Bosque Ancestral"];

        // Escolhe um monstro aleatório
        const base = pool[Math.floor(Math.random() * pool.length)];

        // Scaling: O monstro escala com o jogador, MAS respeitando o cap da região
        const capRegiao = LEVEL_CAPS[local] || 999;
        const nivelEfetivo = Math.min(nivel, capRegiao);

        // Multiplicador de força baseado no nível efetivo
        // REBALANCEAMENTO: Aumento de Scaling (HP: 40%, Dano: 45% por nível)
        const multHp = 1 + (nivelEfetivo * 0.40);
        const multDano = 1 + (nivelEfetivo * 0.45);

        // Multiplicador de XP diferenciado (escala mais rápido para acompanhar a curva exponencial)
        let multXp = 1 + (nivelEfetivo * 0.30); // antes era 0.15
        const multOuro = 1 + (nivelEfetivo * 0.20); // Gold scala 20%

        // Bônus para monstros com drop (Elites/Chefes implícitos)
        if (base.drop) multXp *= 1.5;

        return {
            ...base,
            hp: Math.floor(base.baseHp * multHp),
            maxHp: Math.floor(base.baseHp * multHp),
            dano: Math.floor(base.baseDano * multDano),
            xp: Math.floor(base.xp * multXp),
            ouro: Math.floor(base.ouro * multOuro),
            uid: Date.now()
        };


    },
    missao: (rank) => {
        const tipos = ['Eliminar', 'Coletar'];
        const alvos = ['Goblin', 'Erva', 'Bandido', 'Relíquia', 'Lobo', 'Orc', 'Slime']; // Singulares para facilitar match
        const tipo = tipos[Math.floor(Math.random() * tipos.length)];
        const alvo = alvos[Math.floor(Math.random() * alvos.length)];
        const rankIdx = RANKS_GUILDA.indexOf(rank);
        const qtdBase = 3 + (rankIdx * 2); // F:3, E:5, D:7...
        const qtd = Math.floor(qtdBase + (Math.random() * rankIdx)); // Variação

        return {
            id: Math.random(),
            titulo: `${tipo} ${alvo}s`,
            desc: `A guilda precisa que você vá ${tipo === 'Eliminar' ? 'caçar' : 'buscar'} ${alvo}s nos arredores.`,
            rank,
            req: qtd,
            atual: 0,
            xp: 100 * (rankIdx + 1),
            ouro: 50 * (rankIdx + 1)
        };
    }
};

// Funções Utilitárias Globais
const getMonsterIcon = (nome) => {
    if (nome.includes("Lobo")) return "🐺";
    if (nome.includes("Urso")) return "🐻";
    if (nome.includes("Javali")) return "🐗";
    if (nome.includes("Esqueleto")) return "💀";
    if (nome.includes("Aranha")) return "🕷️";
    if (nome.includes("Goblin")) return "👺";
    if (nome.includes("Espectro")) return "👻";
    if (nome.includes("Dragão")) return "🐉";
    if (nome.includes("Orc")) return "👹";
    if (nome.includes("Troll")) return "👹";
    if (nome.includes("Slime")) return "🦠";
    if (nome.includes("Rato")) return "🐀";
    if (nome.includes("Bandido") || nome.includes("Ladrão")) return "🦹";
    if (nome.includes("Vampiro") || nome.includes("Dracula")) return "🧛";
    if (nome.includes("Elemental de Gelo")) return "❄️";
    if (nome.includes("Yeti")) return "🦍";
    if (nome.includes("Gigante")) return "🗿";
    if (nome.includes("Cobra")) return "🐍";
    if (nome.includes("Crocodilo")) return "🐊"; // Ou jacaré
    return "👾";
};

// Log para confirmar carregamento
console.log("Game Library v1.2 carregada com sucesso.");
