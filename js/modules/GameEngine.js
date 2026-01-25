import { GameData, NICK_DATA } from "../config.js";
import { NetworkController } from "./NetworkController.js";
import { AudioController } from "./AudioController.js";
import { UIController } from "./UIController.js";
import { ThemeController } from "./ThemeController.js";
import { RoomListController } from "./RoomListController.js";
import { TeamManager } from "./TeamManager.js";

export class GameEngine {
    constructor(app) {
        this.theme = new ThemeController();
        this.audio = new AudioController();
        this.ui = new UIController();
        this.net = new NetworkController(app);
        this.roomList = new RoomListController(this.net.db);
        this.teamManager = new TeamManager();
        this.net.onStateChange = (s) => this.handleState(s);
        this.localTimer = null;
        this.transitionTimer = null;
        this.lastProcessedEvent = 0;
        this.serverState = null;
        this.localLastTick = 0;
        
        this.bindEvents();
        this.initNick();
        this.checkUrlParams();
        
        document.getElementById('btn-sound').textContent = this.audio.enabled ? '🔊 Sons Ligados' : '🔇 Sons Desligados';
        
        document.addEventListener('add-reaction', (e) => {
            this.addReaction(e.detail.msgId, e.detail.reaction);
        });

        this.net.cleanupOldRooms().catch(err => console.warn("Ocorreu um erro ao limpar as salas!"));
        window.addEventListener('beforeunload', () => this.net.leaveRoom());
    }

    checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
            document.getElementById('input-room-code').value = code.toUpperCase();
        }
    }

    bindEvents() {
        document.getElementById('btn-create').onclick = () => this.createGame();
        document.getElementById('btn-join').onclick = () => this.joinGame();
        document.getElementById('btn-start-match').onclick = () => this.startMatch();
        document.getElementById('btn-pass').onclick = () => this.actionPass();
        document.getElementById('btn-correct').onclick = () => this.actionCorrect();
        document.getElementById('btn-quit').onclick = () => this.quit();
        document.getElementById('btn-menu-return').onclick = () => this.quit();
        
        // BROWSE ROOMS
        document.getElementById('btn-browse-rooms').onclick = () => this.showRoomList();
        document.getElementById('btn-back-from-rooms').onclick = () => this.ui.showScreen('menu');
        document.getElementById('btn-refresh-rooms').onclick = () => this.showRoomList();
        
        document.getElementById('btn-sound').onclick = (e) => {
            const en = this.audio.toggle();
            e.target.textContent = en ? '🔊 Sons Ligados' : '🔇 Sons Desligados';
        };

        // THEME TOGGLE
        document.getElementById('btn-toggle-theme').onclick = () => {
            this.theme.toggle();
        };
        
        document.getElementById('btn-force-reset').onclick = () => this.net.forceNewIdentity();
        
        document.getElementById('btn-refresh-nick').onclick = () => {
            const newNick = this.generateRandomNick();
            document.getElementById('input-nickname').value = newNick;
        };

        document.getElementById('btn-copy-url').onclick = () => {
            const input = document.getElementById('share-url');
            input.select();
            input.setSelectionRange(0, 99999); 
            navigator.clipboard.writeText(input.value).then(() => {
                const originalText = document.getElementById('btn-copy-url').textContent;
                document.getElementById('btn-copy-url').textContent = "✅";
                setTimeout(() => document.getElementById('btn-copy-url').textContent = originalText, 2000);
            });
        };
        
        // RULES
        document.getElementById('btn-open-rules').onclick = () => this.ui.toggleRules(true);
        document.getElementById('btn-close-rules').onclick = () => this.ui.toggleRules(false);

        // HOST CONTROLS
        document.getElementById('btn-swap-intro').onclick = () => this.hostSwapRoles();
        document.getElementById('btn-swap-game').onclick = () => this.hostSwapRoles();
        document.getElementById('btn-pause-game').onclick = () => this.hostTogglePause(); 
        document.getElementById('btn-resume-overlay').onclick = () => this.hostTogglePause();

        // CHAT EVENTS
        document.getElementById('btn-toggle-chat').onclick = () => this.ui.toggleChat();
        document.getElementById('btn-close-chat').onclick = () => this.ui.toggleChat();
        document.getElementById('btn-send-chat').onclick = () => this.sendChat();
        document.getElementById('chat-input').onkeypress = (e) => {
            if (e.key === 'Enter') this.sendChat();
        };
        document.getElementById('btn-emoji-picker').onclick = () => this.ui.toggleEmojiPicker();
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.reaction-menu') && !e.target.closest('.chat-message')) {
                document.getElementById('reaction-menu').classList.add('hidden');
            }
            if (!e.target.closest('.emoji-picker') && !e.target.closest('#btn-emoji-picker')) {
                 document.getElementById('emoji-picker').classList.add('hidden');
            }
        });

        // SIDEBAR DELEGATION
        document.getElementById('participants-sidebar').onclick = (e) => {
            const btn = e.target.closest('.action-icon-btn, .btn-move-team');
            if (btn && this.net.isHost) {
                const uid = btn.dataset.uid;
                if (btn.classList.contains('btn-kick')) {
                    if(confirm("Expulsar jogador?")) this.net.kickPlayer(uid);
                } else {
                    const target = btn.dataset.target;
                    this.net.switchPlayerTeam(uid, target);
                }
            }
        };

        // ROOM LIST DELEGATION
        document.getElementById('rooms-list-container').addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-join-room');
            if (btn) {
                const code = btn.dataset.code;
                document.getElementById('input-room-code').value = code;
                this.ui.showScreen('menu');
                setTimeout(() => this.joinGame(), 100);
            }
        });
    }

    initNick() {
        const savedNick = localStorage.getItem('ms_nickname');
        const inputNick = document.getElementById('input-nickname');
        if (savedNick) {
            inputNick.value = savedNick;
        } else {
            inputNick.value = this.generateRandomNick();
        }
    }

    generateRandomNick() {
        const adj = NICK_DATA.adj[Math.floor(Math.random() * NICK_DATA.adj.length)];
        const noun = NICK_DATA.noun[Math.floor(Math.random() * NICK_DATA.noun.length)];
        const num = Math.floor(Math.random() * 99) + 1;
        return `${noun}${adj}${num}`;
    }

    getNick() {
        const n = document.getElementById('input-nickname').value.trim();
        if (!n) { alert("Digite um apelido"); return null; }
        localStorage.setItem('ms_nickname', n);
        return n;
    }

    sendChat() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if(!text) return;
        
        const nick = document.getElementById('input-nickname').value || 'Anônimo';
        this.net.sendChatMessage(text, nick);
        input.value = '';
    }
    
    async addReaction(msgId, emoji) {
        if(!msgId) return;
        const msgs = this.serverState.messages || [];
        const updatedMsgs = msgs.map(m => {
            if(m.id === msgId) {
                if(!m.reactions) m.reactions = {};
                if(!m.reactions[emoji]) m.reactions[emoji] = [];
                
                const uid = this.net.user.uid;
                if(m.reactions[emoji].includes(uid)) {
                    m.reactions[emoji] = m.reactions[emoji].filter(u => u !== uid);
                } else {
                    m.reactions[emoji].push(uid);
                }
            }
            return m;
        });
        await this.net.updateMessages(updatedMsgs);
    }

    async createGame() {
        this.net.reset();
        this.serverState = null;
        const nick = this.getNick();
        if (!nick) return;
        this.ui.toggleLoading(true);
        try {
            await this.net.createRoom(nick);
            this.ui.updateLobby(true, this.net.roomId);
        } catch(e) { alert(e.message); }
        this.ui.toggleLoading(false);
    }

    async joinGame() {
        this.net.reset();
        this.serverState = null;
        const nick = this.getNick();
        if (!nick) return;
        const code = document.getElementById('input-room-code').value.trim().toUpperCase();
        if (code.length !== 4) return alert("Código inválido");
        
        this.ui.toggleLoading(true);
        try {
            const ok = await this.net.joinRoom(code, nick);
            if (!ok) alert("Sala não encontrada");
            else this.ui.updateLobby(false, code);
        } catch(e) {
            alert("Erro ao entrar: " + e.message);
        } finally {
            this.ui.toggleLoading(false);
        }
    }

    async showRoomList() {
        this.ui.toggleLoading(true);
        try {
            console.log("Iniciando busca de salas...");
            const rooms = await this.roomList.fetchAvailableRooms();
            console.log("Salas retornadas:", rooms);
            this.ui.renderRoomsList(rooms);
            this.ui.showScreen('rooms');
        } catch (e) {
            console.error("Erro ao listar salas:", e);
            this.ui.renderRoomsList([]);
            this.ui.showScreen('rooms');
        } finally {
            this.ui.toggleLoading(false);
        }
    }

    showResult(teamColor, score) {
        const teamName = teamColor === 'red' ? 'VERMELHO' : 'AZUL';
        const resultEl = document.getElementById('result-title');
        const msgEl = document.getElementById('result-msg');
        
        resultEl.textContent = `FIM DA RODADA`;
        msgEl.textContent = `Time ${teamName} terminou com ${score} ponto${score !== 1 ? 's' : ''}!`;
        
        this.ui.showScreen('result');
        
        let countdown = 5;
        const timer = setInterval(() => {
            countdown--;
            document.getElementById('transition-timer').textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(timer);
                this.nextRound();
            }
        }, 1000);
    }

    async startMatch() {
        if (!this.serverState || !this.serverState.players) return;
        const players = Object.keys(this.serverState.players);
        if (players.length < 2) return alert("Precisa de pelo menos 2 jogadores!");

        // Distribuir jogadores em times
        const distribution = this.teamManager.distributePlayersToTeams(players);

        console.log("Distribuição de times:", distribution);

        this.setupRound(
            distribution.activeTeams[0],
            distribution.teams,
            distribution.reserve,
            distribution.activeTeams,
            0
        );
    }

    setupRound(
        currentTeamColor,
        teams,
        reserve,
        activeTeams,
        roundNum
    ) {
        try {
            // Validar que os times têm jogadores
            const validTeams = {};
            const validActiveTeams = [];
            
            for (const team of activeTeams) {
                if (teams[team] && teams[team].length > 0) {
                    validTeams[team] = teams[team];
                    validActiveTeams.push(team);
                } else {
                    validTeams[team] = [];
                }
            }

            // Se não há times válidos, abortar
            if (validActiveTeams.length === 0) {
                alert("Não há times válidos com jogadores!");
                return;
            }

            // Se o time atual não é válido, usar o primeiro válido
            let actualTeam = validActiveTeams.includes(currentTeamColor) 
                ? currentTeamColor 
                : validActiveTeams[0];

            // Preparar estado para a dupla
            const duoInfo = this.teamManager.formDuoAndRotateReserve(
                {
                    currentTurn: actualTeam,
                    teams: validTeams,
                    reserve: reserve,
                    teamHistory: this.serverState?.teamHistory || {}
                },
                actualTeam
            );

            console.log(`Rodada ${roundNum}:`, {
                time: actualTeam,
                giver: duoInfo.giver,
                guesser: duoInfo.guesser,
                reserve: duoInfo.newReserve,
                activeTeams: validActiveTeams
            });

            // Atualizar histórico de papéis
            let teamHistory = this.serverState?.teamHistory || {};
            teamHistory = this.teamManager.updateTeamHistory(
                teamHistory,
                actualTeam,
                duoInfo.giver,
                duoInfo.guesser
            );

            // Preparar palavras
            const usedWords = this.serverState?.usedWords || [];
            const availableWords = GameData.WORDS.filter(w => !usedWords.includes(w));
            let pool = availableWords;
            if (pool.length < GameData.WORDS_PER_ROUND) {
                pool = GameData.WORDS;
            }

            const shuffledWords = [...pool]
                .sort(() => 0.5 - Math.random())
                .slice(0, GameData.WORDS_PER_ROUND);
            const newUsedWords = [...usedWords, ...shuffledWords];

            // Integrar reserve de volta ao time se rotacionou
            let updatedTeams = validTeams;
            if (duoInfo.rotatedOut) {
                updatedTeams = this.teamManager.integrateReserveNextRound(
                    validTeams,
                    reserve,
                    duoInfo.rotatedOut
                );
            }

            this.net.updateState({
                teams: updatedTeams,
                activeTeams: validActiveTeams,
                status: 'intro',
                currentTurn: actualTeam,
                reserve: duoInfo.newReserve,
                rotatedOut: duoInfo.rotatedOut,
                activePair: { giver: duoInfo.giver, guesser: duoInfo.guesser },
                words: shuffledWords,
                usedWords: newUsedWords,
                currentWordIndex: 0,
                correctCount: 0,
                roundNumber: roundNum,
                isPaused: false,
                teamHistory: teamHistory,
                lastEvent: 'intro_' + Date.now()
            });

            setTimeout(() => {
                this.net.updateState({
                    status: 'playing',
                    roundStartTime: Date.now(),
                    lastEvent: 'start_' + Date.now()
                });
            }, 3000);
        } catch (e) {
            console.error("Erro ao configurar rodada:", e);
            alert("Erro ao configurar rodada: " + e.message);
        }
    }

    nextRound() {
        const currentTeams = this.serverState.activeTeams || ['red', 'blue'];
        const currentIndex = currentTeams.indexOf(this.serverState.currentTurn);
        const nextIndex = (currentIndex + 1) % currentTeams.length;
        const nextTeam = currentTeams[nextIndex];

        const nextRoundNum = this.serverState.roundNumber + 1;

        this.setupRound(
            nextTeam,
            this.serverState.teams,
            this.serverState.reserve,
            currentTeams,
            nextRoundNum
        );
    }

    async hostSwapRoles() {
        if (!this.net.isHost) return;
        const s = this.serverState;
        if (!s || !s.activePair) return;

        const newPair = {
            giver: s.activePair.guesser,
            guesser: s.activePair.giver
        };

        try {
            await this.net.updateState({ activePair: newPair });
        } catch(e) {
            console.error("Swap Error", e);
        }
    }

    async hostTogglePause() {
        if (!this.net.isHost) return;
        const s = this.serverState;
        
        if (s.isPaused) {
            const remaining = s.timeRemainingWhenPaused || GameData.ROUND_TIME;
            const newStartTime = Date.now() - ((GameData.ROUND_TIME - remaining) * 1000);
            
            try {
                await this.net.updateState({
                    isPaused: false,
                    roundStartTime: newStartTime
                });
            } catch(e) { console.error("Resume Error", e); }
            
        } else {
            const elapsed = (Date.now() - s.roundStartTime) / 1000;
            const remaining = Math.max(0, GameData.ROUND_TIME - elapsed);
            
            try {
                await this.net.updateState({
                    isPaused: true,
                    timeRemainingWhenPaused: remaining
                });
            } catch(e) { console.error("Pause Error", e); }
        }
    }

    async actionCorrect() {
        if (!this.serverState) return;
        
        const currentTeam = this.serverState.currentTurn;
        const newScore = (this.serverState.scores[currentTeam] || 0) + 1;
        const nextWordIndex = this.serverState.currentWordIndex + 1;
        const correctCount = this.serverState.correctCount + 1;

        // Preparar dados para atualizar
        const updateData = {
            correctCount: correctCount,
            currentWordIndex: nextWordIndex
        };

        // Atualizar score usando spread para preservar a ordem
        const scores = { ...this.serverState.scores };
        scores[currentTeam] = newScore;
        updateData.scores = scores;

        // Verificar se terminou a rodada
        if (nextWordIndex >= (this.serverState.words || []).length) {
            // Fim da rodada
            updateData.status = 'result';
            updateData.lastEvent = 'round_end_' + Date.now();
            this.net.updateState(updateData);
            this.showResult(currentTeam, newScore);
        } else {
            // Continuar com próxima palavra
            updateData.lastEvent = 'correct_' + Date.now();
            this.net.updateState(updateData);
        }
    }

    async actionPass() {
        if (!this.serverState) return;
        
        const nextWordIndex = this.serverState.currentWordIndex + 1;

        // Preparar dados para atualizar
        const updateData = {
            currentWordIndex: nextWordIndex
        };

        // Verificar se terminou a rodada
        if (nextWordIndex >= (this.serverState.words || []).length) {
            // Fim da rodada
            updateData.status = 'result';
            updateData.lastEvent = 'round_end_' + Date.now();
            this.net.updateState(updateData);
            this.showResult(this.serverState.currentTurn, this.serverState.scores[this.serverState.currentTurn]);
        } else {
            // Continuar com próxima palavra
            updateData.lastEvent = 'pass_' + Date.now();
            this.net.updateState(updateData);
        }
    }

    async quit() {
        if(this.localTimer) clearInterval(this.localTimer);
        if(this.transitionTimer) clearInterval(this.transitionTimer);
        await this.net.leaveRoom();
        this.ui.showScreen('menu');
    }

    handleState(data) {
        if (!data) return;
        this.serverState = data;
        const uid = this.net.user?.uid;

        // Se o jogador foi removido da sala, voltar ao menu
        if (uid && !data.players[uid] && this.net.roomId) {
             alert("Você foi removido da sala.");
             this.quit();
             return;
        }

        this.net.isHost = (data.hostId === uid);

        // Verificar se o host desconectou e promover novo host
        if (data.players && !data.players[data.hostId]) {
            console.warn("Host desconectado. Elegendo novo host...");
            const remainingPlayers = Object.keys(data.players).sort();
            if (remainingPlayers.length > 0) {
                const newHostId = remainingPlayers[0];
                if (uid === newHostId) {
                    this.net.promoteNewHost(newHostId);
                }
            }
        }

        // Se em jogo e ficou com menos de 2 jogadores, voltar para waiting
        if (data.status === 'playing' || data.status === 'intro') {
            const totalPlayers = Object.keys(data.players || {}).length;
            if (totalPlayers < 2) {
                console.log("Jogo retornado para waiting - menos de 2 jogadores");
                this.ui.showScreen('waiting');
                return;
            }

            // Validar que giver e guesser ainda existem
            if (!data.players[data.activePair?.giver] || !data.players[data.activePair?.guesser]) {
                console.warn("Giver ou Guesser não encontrado. Reiniciando rodada...");
                if (this.net.isHost) {
                    this.setupRound(
                        data.currentTurn,
                        data.teams,
                        data.reserve,
                        data.activeTeams,
                        data.roundNumber
                    );
                }
                return;
            }
        }

        if (data.lastEvent !== this.lastProcessedEvent) {
            const evt = data.lastEvent.split('_')[0];
            if(['intro','start','correct','pass','win','gameover'].includes(evt)) this.audio.play(evt);
            this.lastProcessedEvent = data.lastEvent;
        }

        this.ui.updateSidebar(data, uid, this.net.isHost);
        this.ui.renderChat(data.messages || [], uid);

        document.getElementById('waiting-room-code').textContent = this.net.roomId;
        this.ui.togglePauseOverlay(data.isPaused && data.status === 'playing');

        if(this.transitionTimer) clearInterval(this.transitionTimer);

        if (data.status === 'waiting') {
            if(this.net.isHost) this.ui.updateLobby(true, this.net.roomId);
            else this.ui.updateLobby(false, this.net.roomId);
            this.ui.showScreen('waiting');
            return;
        }

        if (data.status === 'intro') {
            this.ui.updateIntro(data, this.net.isHost);
            this.ui.showScreen('intro');
            return;
        }

        if (data.status === 'playing') {
            this.ui.updateGameUI(data, uid, this.net.isHost, GameData);
            this.ui.showScreen('game');
            
            if(this.localTimer) clearInterval(this.localTimer);
            
            const tick = () => {
                if (data.isPaused) {
                    this.ui.updateTimer(Math.ceil(data.timeRemainingWhenPaused));
                    return; 
                }

                const elapsed = (Date.now() - data.roundStartTime) / 1000;
                const rem = Math.ceil(GameData.ROUND_TIME - elapsed);
                this.ui.updateTimer(rem);
                
                if (rem <= 10 && rem > 0 && Math.floor(elapsed) !== this.localLastTick) {
                    this.audio.play('tick');
                    this.localLastTick = Math.floor(elapsed);
                }

                if (rem <= 0) {
                    clearInterval(this.localTimer);
                    if (this.net.isHost) {
                        this.net.updateState({ status: 'result', lastEvent: 'gameover_' + Date.now() });
                    }
                }
            };
            tick();
            this.localTimer = setInterval(tick, 200);
            return;
        }

        if (data.status === 'result') {
            if(this.localTimer) clearInterval(this.localTimer);
            this.ui.togglePauseOverlay(false);
            const title = document.getElementById('result-title');
            const msg = document.getElementById('result-msg');
            const isRed = data.currentTurn === 'red';
            
            title.textContent = `TIME ${isRed ? 'VERMELHO' : 'AZUL'} TERMINOU`;
            title.style.color = isRed ? 'var(--team-red)' : 'var(--team-blue)';
            msg.textContent = `Acertaram ${data.correctCount} palavras.`;

            const transitionDisplay = document.getElementById('transition-timer');
            let countdown = 5;
            transitionDisplay.textContent = countdown;
            
            this.transitionTimer = setInterval(() => {
                countdown--;
                transitionDisplay.textContent = countdown;
                if (countdown <= 0) {
                    clearInterval(this.transitionTimer);
                    if (this.net.isHost) {
                        this.nextRound();
                    }
                }
            }, 1000);
            
            this.ui.showScreen('result');
        }
    }
}
