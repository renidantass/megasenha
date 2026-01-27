export class TestSuite {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.originalNet = gameEngine.net;
        this.mockState = null;
        this.testLogs = [];
    }

    log(msg, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const formatted = `[TEST][${timestamp}] ${msg}`;
        console.log(`%c${formatted}`, type === 'error' ? 'color:red;font-weight:bold' : 'color:#4ade80');
        this.testLogs.push(formatted);
    }

    assert(condition, message) {
        if (!condition) {
            this.log(`❌ FAIL: ${message}`, 'error');
            throw new Error(message);
        } else {
            this.log(`✅ PASS: ${message}`);
        }
    }

    async run() {
        this.log("=== INICIANDO SUÍTE DE TESTES (DEBUG) ===");
        this.log("=== INICIANDO SUÍTE DE TESTES (DEBUG) ===");
        if (this.game.ui && this.game.ui.showToast) {
            this.game.ui.showToast('info', 'Debug', "Rodando testes automatizados...");
        } else {
            console.log("MODO DEBUG ATIVADO: Rodando testes automatizados.");
        }

        try {
            await this.setupMockNetwork();
            await this.testCreateGame();
            await this.testPlayerJoins();
            await this.testStartMatch();
            await this.testRotationLogic();
            await this.testHintConstraints();
            await this.testGameplayFlow();
            await this.testHostControls();
            await this.testWinCondition(); // Runs last as it ends the game

            this.log("=== TODOS OS TESTES PASSARAM COM SUCESSO! ===");

            // Clean up visual
            setTimeout(() => {
                if (this.game.ui && this.game.ui.showToast) {
                    this.game.ui.showToast('success', 'Sucesso', "Testes concluídos! Reiniciando...");
                }
                console.log("TESTES CONCLUÍDOS COM SUCESSO! Reiniciando...");
                setTimeout(() => {
                    window.location.href = window.location.href.split('?')[0];
                }, 2000);
            }, 3000);

        } catch (e) {
            this.log(`⛔ SUÍTE ABORTADA: ${e.message}`, 'error');
            console.error(e);
            this.log(`⛔ SUÍTE ABORTADA: ${e.message}`, 'error');
            console.error(e);
            if (this.game.ui && this.game.ui.showToast) {
                this.game.ui.showToast('error', 'Falha', `Testes falharam: ${e.message}`);
            }
        }
    }

    async setupMockNetwork() {
        this.log("Configurando Mock Network...");

        // Mock State Container
        this.mockState = {
            players: {},
            teams: { red: [], blue: [], green: [], purple: [] },
            scores: { red: 0, blue: 0 },
            activeTeams: ['red', 'blue'],
            status: 'menu',
            words: ["TESTE", "DEBUG", "CODIGO", "GATO", "MESA"],
            usedWords: [],
            currentWordIndex: 0,
            correctCount: 0,
            roundNumber: 0,
            roundNumber: 0,
            currentTurn: 'red',
            lastEvent: 'init_' + Date.now() // FIX: Avoid split of undefined crash
        };

        // Monkey Patch Game Network Controller
        const mockNet = {
            user: { uid: 'test-host-uid', displayName: 'Tester Host' },
            isHost: true,
            roomId: 'TEST',

            // Mock Methods
            createRoom: async (nick) => {
                this.mockState.players['test-host-uid'] = { nickname: nick, score: 0 };
                this.mockState.hostId = 'test-host-uid';
                this.mockState.status = 'waiting';
                this.updateGameLocal('createRoom');
                return 'TEST';
            },

            joinRoom: async (code, nick) => { return true; }, // Not used by host test

            updateState: async (newState) => {
                // Merge state mock
                this.mockState = { ...this.mockState, ...newState };
                // Simulate server echo and WAIT for it
                await new Promise(resolve => {
                    setTimeout(() => {
                        this.updateGameLocal('updateState');
                        resolve();
                    }, 10);
                });
            },

            // Utils
            getServerTimestamp: () => Date.now(),
            reset: () => { },
            cleanupOldRooms: async () => { },
            leaveRoom: async () => { },
            sendChatMessage: (msg) => { this.log(`[Chat Mock] ${msg}`); },
            updateMessages: async () => { }
        };

        // Replace real net controller
        this.game.net = mockNet;

        // Helper to trigger handleState on GameEngine
        this.updateGameLocal = (trigger) => {
            // Deep clone to simulate network serialization
            const cloned = JSON.parse(JSON.stringify(this.mockState));
            this.game.handleState(cloned);
        };

        this.log("Mock Network configurado.");
    }

    async testCreateGame() {
        this.log(">> Testando Create Game");
        const nick = "Tester Host";
        document.getElementById('input-nickname').value = nick;

        await this.game.createGame();

        this.assert(this.game.net.isHost, "Usuário deve ser Host");
        this.assert(this.mockState.players['test-host-uid'].nickname === nick, "Nickname deve estar no state");
        this.assert(this.mockState.status === 'waiting', "Status deve ser waiting");
    }

    async testPlayerJoins() {
        this.log(">> Testando Entrada de Jogadores (Simulação)");

        // Simulate other players joining
        const playersToAdd = [
            { uid: 'p2', nick: 'Player 2' },
            { uid: 'p3', nick: 'Player 3' }, // 3 players to test rotation with odd numbers/reserve logic if needed
            { uid: 'p4', nick: 'Player 4' }  // 4 players for full 2v2
        ];

        playersToAdd.forEach(p => {
            this.mockState.players[p.uid] = { nickname: p.nick, score: 0 };
        });

        this.updateGameLocal('playerJoin');

        const total = Object.keys(this.mockState.players).length;
        this.assert(total === 4, `Deve haver 4 jogadores (Tem: ${total})`);
    }

    async testStartMatch() {
        this.log(">> Testando Start Match");

        // Host clica em start
        await this.game.startMatch();

        this.assert(this.mockState.status === 'intro' || this.mockState.status === 'playing', "Status deve mudar para intro/playing");
        this.assert(this.mockState.teams.red.length > 0, "Time Red deve ter jogadores");
        this.assert(this.mockState.teams.blue.length > 0, "Time Blue deve ter jogadores");
        this.assert(this.mockState.activePair.giver, "Deve haver um Giver definido");
        this.assert(this.mockState.activePair.guesser, "Deve haver um Guesser definido");

        this.log(`Time Red: ${JSON.stringify(this.mockState.teams.red)}`);
        this.log(`Pair: G=${this.mockState.activePair.giver}, Gs=${this.mockState.activePair.guesser}`);
    }

    async testRotationLogic() {
        this.log(">> Testando Lógica de Rotação (Regra 1)");

        // Current state: Round 0
        const initialGiver = this.mockState.activePair.giver;
        const initialGuesser = this.mockState.activePair.guesser;
        const currentTurn = this.mockState.currentTurn; // Should be Red likely

        this.log(`Rodada Inicial (${currentTurn}): Giver=${initialGiver}, Guesser=${initialGuesser}`);

        // Force Next Round (verify logic called by nextRound or setupRound)
        // Simulate Correct/Pass until end of round
        this.mockState.currentWordIndex = 5; // End of words
        this.mockState.status = 'result';
        this.updateGameLocal();

        // Trigger Next Round (Host Logic)
        // Usually triggered by UI or Timer. 
        // GameEngine doesn't auto-trigger next round from result screen without user or timer interaction usually?
        // Let's call game.nextRound() manually as if "Next Round" button was clicked or auto-timer fired.
        // NOTE: nextRound switches TEAM turn.

        this.log("Simulando Próxima Rodada (Time Oposto)...");
        this.log("Simulando Próxima Rodada (Time Oposto)...");
        this.game.nextRound(); // Should switch to Blue
        await new Promise(r => setTimeout(r, 50)); // Wait for mock update echo


        const turn2 = this.mockState.currentTurn;
        this.assert(turn2 !== currentTurn, "Turno deve mudar de time");
        this.assert(this.mockState.roundNumber === 1, "RoundNumber deve incrementar");

        // Force Another Round (Back to Original Team)
        this.log("Simulando Volta para Primeiro Time (Teste de Rotação Interna)...");
        this.mockState.currentWordIndex = 5;
        this.mockState.currentWordIndex = 5;
        this.game.nextRound(); // Back to Red (or original team)
        await new Promise(r => setTimeout(r, 50)); // Wait for mock update echo

        const turn3 = this.mockState.currentTurn;
        this.assert(turn3 === currentTurn, "Turno deve voltar ao time original");

        const newGiver = this.mockState.activePair.giver;
        const newGuesser = this.mockState.activePair.guesser;

        this.log(`Nova Rodada (${turn3}): Giver=${newGiver}, Guesser=${newGuesser}`);

        // VERIFICATION OF RULE 1:
        // Previous Giver should NOT be Giver again immediately if there are others.
        // In 2v2 (2 per team), roles MUST swap.
        // If Red Team has [P1, P2]. R1: Giver=P1, Guesser=P2.
        // R2 (Red): Should be Giver=P2, Guesser=P1.

        if (this.mockState.teams[turn3].length === 2) {
            this.assert(newGiver !== initialGiver, "Giver DEVE mudar em time de 2 jogadores (Swap)");
            this.assert(newGiver === initialGuesser, "Novo Giver deve ser o antigo Guesser (Swap)");
        } else {
            this.assert(newGiver !== initialGiver, "Giver não deve repetir imediatamente em times > 1");
        }
    }

    async testHintConstraints() {
        this.log(">> Testando Restrições de Dica (Regra 2)");

        // Setup State for Hinting
        this.mockState.status = 'playing';
        this.mockState.currentWordIndex = 0;
        this.updateGameLocal();

        // Mock Alert to catch errors
        let lastAlert = "";
        const originalAlert = window.alert;
        window.alert = (msg) => { lastAlert = msg; };

        // Test 1: Short Hint
        this.log("Tentando enviar dica curta 'A'...");
        await this.game.actionSendHint("A");
        this.assert(lastAlert.includes("pelo menos 2"), "Deve bloquear dica de 1 letra");
        this.assert(this.mockState.currentHint == null, "Hint não deve ser persistida");

        // Test 2: Forbidden Word
        const targetWord = this.mockState.words[0];
        this.log(`Tentando enviar dica proibida (Palavra Alvo: ${targetWord})...`);
        await this.game.actionSendHint(targetWord);
        this.assert(lastAlert.includes("não pode conter"), "Deve bloquear dica igual a palavra alvo");
        this.assert(this.mockState.currentHint == null, "Hint não deve ser persistida");

        // Test 3: Valid Hint
        this.log("Tentando enviar dica válida 'TESTANDO'...");
        await this.game.actionSendHint("TESTANDO");
        this.assert(this.mockState.currentHint === "TESTANDO", "Dica válida deve ser salva no state");

        // Restore Alert
        window.alert = originalAlert;
    }
    async testGameplayFlow() {
        this.log(">> Testando Fluxo de Gameplay (Score/Pass)");

        // Setup
        this.mockState.status = 'playing';
        this.mockState.scores.red = 0;
        this.mockState.currentTurn = 'red';
        this.mockState.currentWordIndex = 0;
        this.updateGameLocal();

        // Test Correct
        this.log("Simulando 'Acertou'...");
        await this.game.actionCorrect();

        this.assert(this.mockState.scores.red === 1, "Pontuação deve incrementar para 1");
        this.assert(this.mockState.currentWordIndex === 1, "Índice da palavra deve avançar");

        // Test Pass
        this.log("Simulando 'Pular'...");
        const wordBefore = this.mockState.words[1]; // Current word after increment
        await this.game.actionPass();

        this.assert(this.mockState.scores.red === 1, "Pontuação NÃO deve incrementar ao pular");
        // Pass moves word to end, so index stays same (logic: array mutation) 
        // OR index stays same and array shifts?
        // Let's check actionPass logic in GameEngine: 
        // words.splice(currentWordIndex, 1); words.push(currentWord); 
        // So currentWordIndex (1) now points to what was at (2).
        // Effectively, the word changed.
        const wordAfter = this.mockState.words[1];
        this.assert(wordBefore !== wordAfter, "A palavra atual deve mudar após pular");
    }

    async testHostControls() {
        this.log(">> Testando Controles de Host (Pausa)");

        this.assert(this.mockState.isPaused !== true, "Jogo deve começar despausado");

        this.log("Host pausando jogo...");
        await this.game.hostTogglePause();
        this.assert(this.mockState.isPaused === true, "Jogo deve estar pausado");

        this.log("Host resumindo jogo...");
        await this.game.hostTogglePause();
        this.assert(this.mockState.isPaused === false, "Jogo deve voltar a rodar");
    }

    async testWinCondition() {
        this.log(">> Testando Condição de Vitória");

        // Setup: Score is 1 point away from winning
        const WIN_SCORE = 20; // Default in config
        this.mockState.scores.red = WIN_SCORE - 1;
        this.mockState.currentTurn = 'red';
        this.updateGameLocal();

        this.log(`Score ajustado para ${this.mockState.scores.red}. Acertando para vencer...`);
        await this.game.actionCorrect();

        this.assert(this.mockState.scores.red === WIN_SCORE, "Score deve atingir meta de vitória");
        this.assert(this.mockState.status === 'win', "Status deve mudar para 'win'");
        this.assert(this.mockState.winner === 'red', "Vencedor deve ser 'red'");
    }
}
