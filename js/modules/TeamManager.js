export class TeamManager {
    constructor() {
        this.teams = {};
        this.teamColors = ['red', 'blue', 'green', 'purple'];
    }

    /**
     * Distribui jogadores em times
     * @param {string[]} playerIds - IDs dos jogadores
     * @returns {Object} { teams: {red: [], blue: [], ...}, reserve: uid }
     */
    /**
     * Distribui jogadores em times
     * @param {string[]} playerIds - IDs dos jogadores
     * @returns {Object} { teams: {red: [], blue: [], ...}, reserve: uid }
     */
    distributePlayersToTeams(playerIds) {
        const totalPlayers = playerIds.length;

        // CORREÇÃO #2: Se apenas 2 jogadores, forçar 1 vs 1 (Red vs Blue)
        if (totalPlayers === 2) {
            const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
            const teams = {
                red: [shuffled[0]],
                blue: [shuffled[1]],
                green: [],
                purple: []
            };
            return {
                teams,
                reserve: null,
                activeTeams: ['red', 'blue']
            };
        }

        const hasReserve = totalPlayers % 2 !== 0;
        const actualPlayers = hasReserve ? totalPlayers - 1 : totalPlayers;

        // Embaralhar jogadores
        const shuffled = [...playerIds].sort(() => Math.random() - 0.5);

        // Sempre 2 times (Red/Blue) para 4 ou mais jogadores
        // Para 3 jogadores: 1 time de 2, 1 reserva (que entrará no time oposto ou rodará)
        const numTeams = totalPlayers >= 4 ? 2 : Math.max(1, Math.ceil(actualPlayers / 2));

        // Inicializar times
        const teams = {};
        for (let i = 0; i < Math.min(numTeams, this.teamColors.length); i++) {
            teams[this.teamColors[i]] = [];
        }

        // Adicionar times vazios para manter a estrutura
        for (let i = numTeams; i < this.teamColors.length; i++) {
            teams[this.teamColors[i]] = [];
        }

        // Distribuir jogadores nos times
        let reserve = null;
        if (hasReserve) {
            reserve = shuffled.pop();
        }

        let teamIndex = 0;
        const activeTeamColors = this.teamColors.slice(0, numTeams);

        // Se numTeams for 1 (ex: 3 jogadores -> Red tem 2, Blue vazio?), precisamos garantir que Red vs Blue exista?
        // Mas a lógica do jogo pede duplas.
        // Se 3 jogadores: P1+P2 (Red), P3 (Reserve).
        // Se numTeams = 1, só Red existe.

        shuffled.forEach((playerId) => {
            // Se só temos 1 time ativo mas precisamos de oposição, logicamente o jogo
            // deveria suportar apenas 1 time jogando "contra o tempo"?
            // Mas para "Megasenha", assumimos que sempre há times.
            // Vou manter a distribuição cíclica.
            teams[activeTeamColors[teamIndex]].push(playerId);
            teamIndex = (teamIndex + 1) % activeTeamColors.length;
        });

        return {
            teams,
            reserve,
            activeTeams: activeTeamColors
        };
    }

    /**
     * Forma uma dupla (par giver/guesser) e roda o reserve
     * @param {Object} state - Estado atual do jogo
     * @param {string} currentTeam - Time atual ('red', 'blue', etc)
     * @returns {Object} { giver, guesser, newReserve, rotatedOut }
     */
    formDuoAndRotateReserve(state, currentTeam) {
        let teamPlayers = [...(state.teams[currentTeam] || [])];
        let pendingReserve = state.reserve; // O reserva global esperando para entrar

        // CORREÇÃO #3 e #4: Rotação de Duplas
        // Se há um reserva global esperando, e é a vez deste time,
        // o reserva DEVE entrar neste time, e alguém deste time sai para ser reserva.

        // Nota: Isso assume que o reserva pertence ao "fluxo" do jogo global.
        // Se o time tem espaço (ex: 1 jogador), o reserva completa.
        // Se o time está cheio (2 jogadores), o reserva entra e um sai.

        let rotatedOut = null;

        if (pendingReserve) {
            // Adicionar reserva ao time
            teamPlayers.push(pendingReserve);
            // Agora o reserva foi consumido, não é mais "pending" globalmente (será substituído pelo que sair)
            pendingReserve = null;

            // Se o time ficou com mais de 2 pessoas, removemos o "mais antigo" ou "aleatório" para ser o novo reserva
            // Vamos remover o primeiro da lista (assumindo fila) que jogou a mais tempo?
            // Ou o último que entrou?
            // "IntegrateReserveNextRound" sugere que removemos alguém.

            // Estratégia: Quem acabou de jogar (ex-guesser) sai? 
            // Simples: Remove o primeiro da lista [0], assumindo que rotateInternal joga os recentes para o fim.
            if (teamPlayers.length > 2) {
                rotatedOut = teamPlayers.shift(); // Remove o primeiro
            }
        }

        // Se mesmo sem reserva o time tem > 2, rotaciona interno
        if (!rotatedOut && teamPlayers.length > 2) {
            rotatedOut = teamPlayers.shift();
        }


        if (teamPlayers.length === 0) {
            throw new Error(`Time ${currentTeam} não tem jogadores suficientes.`);
        }

        // Se só tem 1 jogador (e não tinha reserva pra entrar), não dá pra jogar normal
        // A menos que aceitemos 1 player mode (dica automatica? não implementado).
        // Se só tem 1 jogador e não tem reserve no time, procurar nos outros times (1v1 mode)
        // Isso acontece se distribute forçou 1v1.
        if (teamPlayers.length < 2) {
            console.warn(`Time ${currentTeam} só tem 1 jogador. Buscando emprestado...`);

            // Encontrar um "Oponente" para ser o Giver (Dador de dicas) ou Partner
            // Regra 1v1: O oponente dá a dica? Ou o oponente chuta?
            // Se o oponente der a dica, ele pode sabotar?
            // Em Mega Senha, o parceiro tem que ajudar.
            // Se são rivais, é estranho.
            // Mas se só tem 2 pessoas, elas TEM que jogar juntas para o jogo acontecer.
            // Vamos pegar o primeiro jogador do time adversário.

            // Achar time adversário
            let opponentId = null;
            const allTeams = state.teams || {};
            for (let c in allTeams) {
                if (c !== currentTeam && allTeams[c].length > 0) {
                    opponentId = allTeams[c][0];
                    break;
                }
            }

            if (opponentId) {
                return {
                    giver: opponentId, // Oponente ajuda dando dicas (ou vice versa)
                    guesser: teamPlayers[0], // O dono do turno tenta acertar (ganhar pontos)
                    newReserve: null,
                    rotatedOut: null
                };
            } else {
                // Realmente sozinho no mundo (1 player total loop?)
                // Precisa de pelo menos 2 players no jogo todo.
                throw new Error("Impossível formar dupla: menos de 2 jogadores em toda a sala.");
            }
        }

        // Definir Giver e Guesser (os 2 primeiros da lista atualizada)
        const giver = teamPlayers[0];
        const guesser = teamPlayers[1];

        // Atualizar quem sai (novo reserva global)
        const newReserve = rotatedOut;

        return {
            giver,
            guesser,
            newReserve,
            rotatedOut // Quem saiu do time (precisa ser removido da lista do time no updateState)
        };
    }

    /**
     * Atualiza histórico de papéis do time
     */
    updateTeamHistory(teamHistory, teamColor, giver, guesser) {
        if (!teamHistory[teamColor]) {
            teamHistory[teamColor] = {};
        }
        teamHistory[teamColor].lastGiver = giver;
        teamHistory[teamColor].lastGuesser = guesser;
        return teamHistory;
    }

    /**
     * Integra o reserve de volta ao time na próxima rodada -> DEPRECATED/REFACTORED
     * A lógica nova de formDuoAndRotateReserve já calcula quem entra e sai.
     * Mas ainda precisamos atualizar a LISTA de times persistente no GameEngine.
     */
    integrateReserveNextRound(teams, reserve, rotatedOut) {
        // Esta função auxiliava a persistência.
        // Agora precisamos de algo que receba: "Teams Atuais", "Quem Entrou (Reserve)", "Quem Saiu (RotatedOut)" e "Time Alvo"
        // Mas como formDuoAndRotateReserve é chamado DENTRO de setupRound, o GameEngine vai usar o retorno para atualizar o state.
        return teams; // Placeholder se refatorarmos o GameEngine
    }

    // Helper para atualizar o array do time no GameEngine
    updateTeamList(originalTeamList, newReserve, rotatedOut) {
        // A lista já foi modificada localmente em formDuo... mas precisamos reconstruir
        // Na verdade, formDuo... deveria retornar a NOVA lista do time também.
        // Vou simplificar alterando a formDuo para ser pura ou o GameEngine fazer a troca.
        // Vamos manter simples:
    }

    /**
     * Rotaciona internamente o time (move o primeiro par para o final)
     */
    rotateTeamInternal(teamArray) {
        if (!teamArray || teamArray.length <= 2) return teamArray;
        // Move os dois primeiros (giver/guesser) para o final
        return [...teamArray.slice(2), teamArray[0], teamArray[1]];
    }

    getTeamColor(teamIndex) {
        return this.teamColors[teamIndex];
    }
}
