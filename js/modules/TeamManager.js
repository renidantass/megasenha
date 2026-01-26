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
    distributePlayersToTeams(playerIds) {
        const totalPlayers = playerIds.length;
        const hasReserve = totalPlayers % 2 !== 0;
        const actualPlayers = hasReserve ? totalPlayers - 1 : totalPlayers;

        // Embaralhar jogadores
        const shuffled = [...playerIds].sort(() => Math.random() - 0.5);

        // Sempre 2 times (Red/Blue) para 4 ou mais jogadores
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

        shuffled.forEach((playerId) => {
            teams[activeTeamColors[teamIndex]].push(playerId);
            teamIndex = (teamIndex + 1) % numTeams;
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
        const teamPlayers = state.teams[currentTeam];

        if (!teamPlayers || teamPlayers.length === 0) {
            throw new Error(`Time ${currentTeam} não tem jogadores`);
        }

        // Se apenas 1 jogador no time, usar o reserve como parceiro
        if (teamPlayers.length === 1 && state.reserve) {
            const giver = teamPlayers[0];
            const guesser = state.reserve;

            return {
                giver,
                guesser,
                newReserve: null,
                rotatedOut: null
            };
        }

        if (teamPlayers.length < 2) {
            throw new Error(`Time ${currentTeam} tem menos de 2 jogadores e não há reserve`);
        }

        // Obter histórico de papéis deste time para intercalar
        const teamHistory = state.teamHistory?.[currentTeam] || {};

        // Encontrar quem foi giver e quem foi guesser na última vez
        const lastGiver = teamHistory.lastGiver;
        const lastGuesser = teamHistory.lastGuesser;

        let giver, guesser;

        // Lógica para alternar papéis
        // Lógica para alternar papéis
        // Se temos apenas 2 jogadores, invertemos os papéis
        // Se temos mais de 2, seguimos a ordem da lista (que já é rotacionada externamente)
        if (teamPlayers.length === 2 && lastGiver && lastGuesser && teamPlayers.includes(lastGiver) && teamPlayers.includes(lastGuesser)) {
            // Inverter os papéis se ambos ainda estão no time
            giver = lastGuesser;
            guesser = lastGiver;
        } else {
            // Seleção sequencial para times > 2 ou primeira rodada
            giver = teamPlayers[0];
            guesser = teamPlayers[1];
        }

        // Rotacionar reserve se existe
        let newReserve = state.reserve;
        let rotatedOut = null;

        if (state.reserve && teamPlayers.length > 2) {
            // Remove um jogador do time para ser o novo reserve (o terceiro)
            rotatedOut = teamPlayers[2];
            newReserve = rotatedOut;
        }

        return {
            giver,
            guesser,
            newReserve,
            rotatedOut
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
     * Integra o reserve de volta ao time na próxima rodada
     */
    integrateReserveNextRound(teams, reserve, rotatedOut) {
        if (!reserve || !rotatedOut) return teams;

        // Encontrar qual time tinha o rotatedOut
        const updatedTeams = { ...teams };
        for (const teamColor in updatedTeams) {
            const teamPlayers = updatedTeams[teamColor];
            const index = teamPlayers.indexOf(rotatedOut);
            if (index !== -1) {
                updatedTeams[teamColor] = [
                    ...teamPlayers.slice(0, index),
                    reserve,
                    ...teamPlayers.slice(index + 1)
                ];
                break;
            }
        }

        return updatedTeams;
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
