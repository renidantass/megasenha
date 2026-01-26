import { EXTRA_WORDS } from "./wordList.js";

export const GameData = {
    WORDS: [
        // Originais
        "BANANA", "COMPUTADOR", "BRASIL", "FUTEBOL", "AMOR", "DINHEIRO", "PRAIA", "SOL", "LUA", "CARRO",
        "CASA", "ESCOLA", "TRABALHO", "MÚSICA", "FILME", "INTERNET", "CACHORRO", "GATO", "CAFÉ", "CHOCOLATE",
        "ELEFANTE", "GIRASSOL", "AVIÃO", "TELEFONE", "RELÓGIO", "LIVRO", "CANETA", "MESA", "CADEIRA", "SAPATO",
        "CAMISA", "CALÇA", "VESTIDO", "ÁGUA", "FOGO", "TERRA", "AR", "CORAÇÃO", "CÉREBRO", "MÃO",
        "PÉ", "OLHO", "BOCA", "NARIZ", "ORELHA", "CABELO", "DENTE", "LÍNGUA", "UNHA", "DEDO",
        "FACA", "GARFO", "COLHER", "PRATO", "COPO", "XÍCARA", "PANELA", "FOGÃO", "GELADEIRA", "MICROONDAS",
        "PIZZA", "HAMBURGUER", "BATATA", "SALADA", "FRUTA", "SUCO", "CERVEJA", "VINHO", "FESTA", "BOLO",
        "VELA", "PRESENTE", "NATAL", "PÁSCOA", "CARNAVAL", "IGREJA", "SHOPPING", "MERCADO", "FARMÁCIA", "HOSPITAL",
        // ...restante das palavras
        "CHAVE", "CARTEIRA", "BOLSA", "MOCHILA", "ESPELHO", "PENTE", "ESCOVA", "TOALHA", "SABONETE", "SHAMPOO",
        "PERFUME", "BATOM", "ANEL", "BRINCO", "COLAR", "PULSEIRA", "RELÓGIO", "ÓCULOS", "CHAPÉU", "BONÉ",
        "GUARDA-CHUVA", "CAPA", "MEIA", "LUVA", "CACHECOL", "CINTO", "GRAVATA", "TERNO", "SAIA", "BLUSA",
        "CASACO", "JAQUETA", "PIJAMA", "CHINELO", "TÊNIS", "BOTA", "SANDÁLIA", "SALTO", "CADARÇO", "ZÍPER",
        "BOTÃO", "AGULHA", "LINHA", "TESOURA", "COLA", "FITA", "PAPEL", "LÁPIS", "BORRACHA", "RÉGUA",
        "APONTADOR", "ESTOJO", "CADERNO", "AGENDA", "DIÁRIO", "CARTA", "ENVELOPE", "SELO", "CAIXA", "PACOTE",
        "PRESENTE", "LAÇO", "BALÃO", "BEXIGA", "VELA", "FÓSFORO", "ISQUEIRO", "CINZEIRO", "LIXEIRA", "VASSOURA",
        "RODO", "PANO", "BALDE", "MANGUEIRA", "TORNEIRA", "PIA", "RALO", "CHUVEIRO", "PRIVADA", "PAPEL HIGIÊNICO",
        "SABÃO", "DETERGENTE", "ESPONJA", "BOMBRIL", "ÁLCOOL", "CLORO", "AMACIANTE", "FERRO", "TÁBUA", "PREGADOR",
        "VARAL", "CESTO", "GAVETA", "ARMÁRIO", "GUARDA-ROUPA", "CÔMODA", "ESTANTE", "PRATELEIRA", "RACK", "SOFÁ",
        "POLTRONA", "PUFF", "ALMOFADA", "LENÇOL", "COBERTOR", "EDREDOM", "TRAVESSEIRO", "FRONHA", "COLCHÃO", "CAMA",
        "BERÇO", "CARRINHO", "MAMADEIRA", "CHUPETA", "FRALDA", "BRINQUEDO", "BONECA", "CARRINHO", "BOLA", "PIPA",
        "LEÃO", "TIGRE", "ONÇA", "LEOPARDO", "GUEPARDO", "LOBO", "RAPOSA", "URSO", "PANDA", "COALA",
        "CANGURU", "MACACO", "GORILA", "CHIMPANZÉ", "SAGUI", "MICO", "PREGUIÇA", "TATU", "TAMANDUÁ", "ANTA",
        "CAPIVARA", "PORCO", "JAVALI", "HIPOPÓTAMO", "RINOCERONTE", "ELEFANTE", "GIRAFA", "ZEBRA", "CAVALO", "ÉGUA",
        "POTRO", "PÔNEI", "JUMENTO", "BURRO", "MULA", "VACA", "BOI", "BEZERRO", "TOURO", "BÚFALO",
        "OVELHA", "CARNEIRO", "CORDEIRO", "CABRA", "BODE", "CABRITO", "CAMELO", "DROMEDÁRIO", "LHAMA", "ALPACA",
        "COELHO", "LEBRE", "HAMSTER", "PORQUINHO", "RATO", "CAMUNDONGO", "ESQUILO", "CASTOR", "FURÃO", "GAMBÁ",
        "MORCEGO", "GOLFINHO", "BALEIA", "TUBARÃO", "RAIA", "PEIXE", "SALMÃO", "ATUM", "SARDINHA", "BACALHAU",
        "CAMARÃO", "LAGOSTA", "CARANGUEJO", "SIRI", "OSTRA", "MEXILHÃO", "POLVO", "LULA", "ÁGUA-VIVA", "ESTRELA",
        "CAVALO-MARINHO", "TARTARUGA", "JABUTI", "CÁGADO", "JACARÉ", "CROCODILO", "COBRA", "SERPENTE", "VÍBORA", "SUCURI",
        "JIBOIA", "CASCAVEL", "CORAL", "LAGARTO", "LAGARTIXA", "IGUANA", "CAMALEÃO", "DINOSSAURO", "DRAGÃO", "SAPO",
        "RÃ", "PERERECA", "SALAMANDRA", "PINGUIM", "GAIVOTA", "PELICANO", "ALBATROZ", "GARÇA", "FLAMINGO", "PATO",
        "GANSO", "CISNE", "MARRECO", "GALINHA", "GALO", "PINTO", "PERU", "PAVÃO", "FAISÃO", "CODORNA",
        "AVESTRUZ", "EMA", "ÁGUIA", "GAVIÃO", "FALCÃO", "CORUJA", "URUBU", "ABUTRE", "CONDOR", "PAPAGAIO",
        "ARARA", "PERIQUITO", "TUCANO", "BEIJA-FLOR", "CANÁRIO", "SABIÁ", "BEM-TE-VI", "JOÃO-DE-BARRO", "PICA-PAU", "POMBA",
        "CIDADE", "CAMPO", "FAZENDA", "SÍTIO", "CHÁCARA", "PRAIA", "ILHA", "MONTANHA", "SERRA", "VALE",
        "DESERTO", "FLORESTA", "MATA", "SELVA", "BOSQUE", "JARDIM", "PARQUE", "PRAÇA", "RUA", "AVENIDA",
        "ESTRADA", "RODOVIA", "VIADUTO", "PONTE", "TÚNEL", "CALÇADA", "CICLOVIA", "ESTACIONAMENTO", "GARAGEM", "PRÉDIO",
        "EDIFÍCIO", "ARRANHA-CÉU", "CASA", "SOBRADO", "MANSÃO", "CASTELO", "PALÁCIO", "CABANA", "OCA", "IGLU",
        "TENTA", "ACAMPAMENTO", "HOTEL", "POUSADA", "RESORT", "MOTEL", "HOSTEL", "ALBERGUE", "RESTAURANTE", "LANCHONETE",
        "BAR", "BOTECO", "PUB", "CAFETERIA", "PADARIA", "CONFEITARIA", "SORVETERIA", "PIZZARIA", "CHURRASCARIA", "MERCADO",
        "SUPERMERCADO", "HIPERMERCADO", "FEIRA", "SACOLÃO", "AÇOUGUE", "PEIXARIA", "QUITANDA", "EMPÓRIO", "LOJA", "SHOPPING",
        "GALERIA", "BOUTIQUE", "LIVRARIA", "PAPELARIA", "FARMÁCIA", "DROGARIA", "PERFUMARIA", "JOALHERIA", "ÓTICA", "FLORICULTURA",
        "BANCO", "CAIXA", "LOTÉRICA", "CORREIO", "CARTÓRIO", "PREFEITURA", "FÓRUM", "DELEGACIA", "PRISÃO", "CADEIA",
        "QUARTEL", "BOMBEIRO", "HOSPITAL", "CLÍNICA", "CONSULTÓRIO", "LABORATÓRIO", "POSTO", "ESCOLA", "COLÉGIO", "FACULDADE",
        "UNIVERSIDADE", "CRECHE", "BERÇÁRIO", "CURSINHO", "BIBLIOTECA", "MUSEU", "TEATRO", "CINEMA", "CIRCO", "ESTÁDIO",
        "ARROZ", "FEIJÃO", "MACARRÃO", "LASANHA", "NHOQUE", "PIZZA", "HAMBÚRGUER", "SANDUÍCHE", "HOT-DOG", "PASTEL",
        "COXINHA", "KIBE", "ESFIHA", "EMPADA", "TORTA", "QUICHE", "SOPA", "CALDO", "CREME", "MINGAU",
        "CANJA", "MOQUECA", "VATAPÁ", "ACARAJÉ", "FEIJOADA", "CHURRASCO", "BIFE", "CARNE", "FRANGO", "PEIXE",
        "OVO", "OMELETE", "PANQUECA", "TAPIOCA", "CUSCUZ", "POLENTA", "PURÊ", "FAROFA", "SALADA", "LEGUME",
        "VERDURA", "FRUTA", "DOCE", "BOLO", "PUDIM", "MOUSSE", "GELATINA", "SORVETE", "AÇAÍ", "CHOCOLATE",
        "BOMBOM", "TRUFA", "BALA", "CHICLETE", "PIRULITO", "BISCOITO", "BOLACHA", "PÃO", "TORRADA", "CROISSANT",
        "SONHO", "BRIGADEIRO", "BEIJINHO", "CAJUZINHO", "PAÇOCA", "PÉ-DE-MOLEQUE", "COCADA", "QUINDIM", "BEM-CASADO", "ALFAJOR",
        "MÉDICO", "ENFERMEIRO", "DENTISTA", "VETERINÁRIO", "PSICÓLOGO", "ADVOGADO", "JUIZ", "PROMOTOR", "DELEGADO", "POLICIAL",
        "BOMBEIRO", "SEGURANÇA", "PORTEIRO", "FAXINEIRO", "EMPREGADA", "COZINHEIRO", "CHEF", "GARÇOM", "PADEIRO", "CONFEITEIRO",
        "AÇOUGUEIRO", "PEIXEIRO", "FEIRANTE", "VENDEDOR", "CAIXA", "GERENTE", "DIRETOR", "PRESIDENTE", "SECRETÁRIA", "RECEPCIONISTA",
        "TELEFONISTA", "ATENDENTE", "MOTORISTA", "TAXISTA", "UBER", "CAMINHONEIRO", "MOTOBOY", "PILOTO", "AEROMOÇA", "COMISSÁRIO",
        "MAQUINISTA", "FERROVIÁRIO", "MARINHEIRO", "CAPITÃO", "PESCADOR", "AGRICULTOR", "FAZENDEIRO", "JARDINEIRO", "PEDREIRO", "MESTRE",
        "ENCANADOR", "ELETRICISTA", "MARCENEIRO", "CARPINTEIRO", "SERRALHEIRO", "PINTOR", "MECÂNICO", "BORRACHEIRO", "LATOEIRO", "FUNILEIRO",
        "ENGENHEIRO", "ARQUITETO", "DECORADOR", "DESIGNER", "PROGRAMADOR", "ANALISTA", "TÉCNICO", "CIENTISTA", "PESQUISADOR", "PROFESSOR",
        "CORRER", "ANDAR", "PULAR", "SALTAR", "DANÇAR", "CANTAR", "GRITAR", "FALAR", "OUVIR", "VER",
        "OLHAR", "ASSISTIR", "COMER", "BEBER", "DORMIR", "ACORDAR", "SONHAR", "PENSAR", "ESTUDAR", "LER",
        "ESCREVER", "DESENHAR", "PINTAR", "TOCAR", "BRINCAR", "JOGAR", "GANHAR", "PERDER", "CHORAR", "RIR",
        "SORRIR", "AMAR", "ODIAR", "GOSTAR", "QUERER", "PRECISAR", "COMPRAR", "VENDER", "PAGAR", "GASTAR",
        "TRABALHAR", "DESCANSAR", "VIAJAR", "PASSEAR", "DIRIGIR", "PILOTAR", "NAVEGAR", "VOAR", "NADAR", "MERGULHAR",
        "BOIAR", "AFUNDAR", "CAIR", "LEVANTAR", "SUBIR", "DESCER", "ENTRAR", "SAIR", "ABRIR", "FECHAR",
        "LIGAR", "DESLIGAR", "ACENDER", "APAGAR", "QUEBRAR", "CONSERTAR", "ARRUMAR", "LIMPAR", "SUJAR", "LAVAR",
        // Novas Palavras adicionadas
        "FANTASMA", "ESQUELETO", "BRUXA", "ZUMBI", "VAMPIRO", "LOBISOMEM", "MÚMIA", "ALIENÍGENA", "ROBÔ", "MONSTRO",
        "ESPADA", "ESCUDO", "CAPACETE", "ARMADURA", "LANÇA", "ARCO", "FLECHA", "MACHADO", "MARTELO", "CANHÃO",
        "NAVIO", "BARCO", "SUBMARINO", "CANOA", "JANGADA", "LANCHA", "IATE", "BALSAS", "TRANSATLÂNTICO", "VIKING",
        "PLANETA", "ESTRELA", "GALÁXIA", "UNIVERSO", "COMETA", "METEORO", "ASTEROIDE", "BURACO NEGRO", "ECLIPSE", "ASTRONAUTA",
        "MICROFONE", "CÂMERA", "FILMADORA", "TELA", "MONITOR", "TECLADO", "MOUSE", "IMPRESSORA", "SCANNER", "PROJETOR",
        "CELULAR", "TABLET", "NOTEBOOK", "COMPUTADOR", "RÁDIO", "TV", "ANTENA", "SATÉLITE", "FIO", "CABO",
        "PILHA", "BATERIA", "TOMADA", "INTERRUPTOR", "LÂMPADA", "ABAJUR", "LANTERNA", "FAROL", "VELA", "FOGUEIRA",
        "GUITARRA", "VIOLÃO", "BAIXO", "BATERIA", "PIANO", "TECLADO", "SAXOFONE", "TROMPETE", "FLAUTA", "VIOLINO",
        "TAMBOR", "PANDEIRO", "BERIMBAU", "CURIOSIDADE", "SAUDADE", "AMIZADE", "FELICIDADE", "TRISTEZA", "RAIVA", "MEDO",
        "CORAGEM", "ESPERANÇA", "FÉ", "AMOR", "PAIXÃO", "ÓDIO", "INVEJA", "ORGULHO", "PREGUIÇA", "GULA",
        ...EXTRA_WORDS
    ],
    WORDS_PER_ROUND: 5,
    ROUND_TIME: 90,
    WIN_SCORE: 50,
    MAX_TEAMS: 4,
    TEAM_COLORS: ['red', 'blue', 'green', 'purple']
};

export const NICK_DATA = {
    // Nomes em português-brasileiro
    firstNames: ['Tigre', 'Leão', 'Cobra', 'Falcão', 'Dragão', 'Lobo', 'Urso', 'Raio', 'Trovão', 'Fogo', 'Gelo', 'Vento', 'Oceano', 'Montanha', 'Tempestade'],
    lastNames: ['Forte', 'Rápido', 'Sábio', 'Bravo', 'Corajoso', 'Furioso', 'Sombra', 'Selvagem', 'Lendário', 'Épico', 'Supremo', 'Divino', 'Místico', 'Eterno', 'Imortal']
};

export const EMOJIS = ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "☺️", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"];

export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDoaWmTN2513e5LGxOq--65ekL4PMqjUAs",
    authDomain: "megasenha-c29ba.firebaseapp.com",
    projectId: "megasenha-c29ba",
    storageBucket: "megasenha-c29ba.firebasestorage.app",
    messagingSenderId: "449328223327",
    appId: "1:449328223327:web:89ddff46caf8594be4f7ea",
    measurementId: "G-B2QYXF8ZFC"
};
