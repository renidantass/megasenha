import { EMOJIS } from "../config.js";

export class UIController {
    constructor() {
        this.screens = {
            menu: document.getElementById('menu-screen'),
            waiting: document.getElementById('waiting-screen'),
            intro: document.getElementById('intro-screen'),
            game: document.getElementById('game-screen'),
            result: document.getElementById('result-screen'),
            rooms: document.getElementById('rooms-screen')
        };
        
        this.sidebar = document.getElementById('participants-sidebar');
        this.listRed = document.getElementById('list-red');
        this.listBlue = document.getElementById('list-blue');
        this.listLobby = document.getElementById('list-lobby');
        this.scoreRedSidebar = document.getElementById('score-red-sidebar');
        this.scoreBlueSidebar = document.getElementById('score-blue-sidebar');
        
        this.loading = document.getElementById('loading-overlay');
        this.hostStartPanel = document.getElementById('host-start-panel');
        this.waitingMsg = document.getElementById('waiting-msg');
        this.shareUrlInput = document.getElementById('share-url');
        this.rulesModal = document.getElementById('rules-modal');
        
        // Game Elements
        this.scoreRed = document.getElementById('score-red');
        this.scoreBlue = document.getElementById('score-blue');
        this.turnIndicator = document.getElementById('turn-indicator');
        this.wordCard = document.getElementById('game-word-container');
        this.elWord = document.getElementById('word-display');
        this.roleDisplay = document.getElementById('role-display');
        this.elTimer = document.getElementById('timer-display');
        this.progressContainer = document.getElementById('progress-container');
        
        // Controls
        this.hostControls = document.getElementById('host-controls');
        this.spectatorMsg = document.getElementById('spectator-msg');
        this.hostResultActions = document.getElementById('host-result-actions');
        
        // Host Swap & Pause Controls
        this.hostIntroControls = document.getElementById('host-intro-controls');
        this.btnSwapGame = document.getElementById('btn-swap-game');
        this.btnPauseGame = document.getElementById('btn-pause-game');
        this.btnResumeOverlay = document.getElementById('btn-resume-overlay');

        // Chat
        this.chatBtn = document.getElementById('btn-toggle-chat');
        this.chatWindow = document.getElementById('chat-window');
        this.chatBody = document.getElementById('chat-body');
        this.chatBadge = document.getElementById('chat-badge');
        this.chatInput = document.getElementById('chat-input');
        this.emojiPicker = document.getElementById('emoji-picker');
        this.reactionMenu = document.getElementById('reaction-menu');
        this.chatOpen = false;
        this.lastMsgCount = 0;
        this.activeMsgForReaction = null;
        
        this.roomListContainer = document.getElementById('rooms-list-container');
        
        this.initEmojiPicker();
        
        this.lastRenderedState = null;
        this.lastRenderedMessages = [];
        this.messageRenderCache = new Map();
    }
    
    initEmojiPicker() {
        this.emojiPicker.innerHTML = EMOJIS.map(e => `<button class="emoji-btn">${e}</button>`).join('');
        this.emojiPicker.onclick = (e) => {
            if (e.target.classList.contains('emoji-btn')) {
                this.chatInput.value += e.target.textContent;
                this.emojiPicker.classList.add('hidden');
            }
        };
        
        this.reactionMenu.onclick = (e) => {
             if (e.target.classList.contains('emoji-btn')) {
                 const reaction = e.target.getAttribute('data-reaction');
                 const event = new CustomEvent('add-reaction', { detail: { msgId: this.activeMsgForReaction, reaction: reaction } });
                 document.dispatchEvent(event);
                 this.reactionMenu.classList.add('hidden');
                 this.activeMsgForReaction = null;
             }
        };
    }

    toggleLoading(show) { 
        show ? this.loading.classList.remove('hidden') : this.loading.classList.add('hidden'); 
    }
    
    togglePauseOverlay(show) { 
        show ? document.getElementById('pause-overlay').classList.add('active') : document.getElementById('pause-overlay').classList.remove('active'); 
    }
    
    toggleRules(show) {
        show ? this.rulesModal.classList.add('active') : this.rulesModal.classList.remove('active');
    }

    showScreen(screenName) {
        if (!this.screens[screenName]) {
            console.error(`Tela '${screenName}' não encontrada no DOM`);
            console.error('Telas disponíveis:', Object.keys(this.screens));
            return;
        }

        Object.values(this.screens).forEach(el => {
            if (el) el.classList.remove('active');
        });
        
        this.screens[screenName].classList.add('active');
        
        // Mostrar/Ocultar botão de tema
        const btnTheme = document.getElementById('btn-toggle-theme');
        if (btnTheme) {
            if (screenName === 'menu') {
                btnTheme.classList.remove('hidden');
            } else {
                btnTheme.classList.add('hidden');
            }
        }
        
        if (screenName === 'menu') {
            this.sidebar.classList.add('hidden-sidebar');
            this.chatBtn.classList.add('hidden'); 
            this.chatWindow.classList.remove('open');
        } else {
            this.sidebar.classList.remove('hidden-sidebar');
            this.chatBtn.classList.remove('hidden'); 
        }
    }

    toggleChat() {
        this.chatOpen = !this.chatOpen;
        if (this.chatOpen) {
            this.chatWindow.classList.add('open');
            this.chatBadge.classList.add('hidden'); 
            this.chatBadge.textContent = '0';
            this.chatBody.scrollTop = this.chatBody.scrollHeight;
        } else {
            this.chatWindow.classList.remove('open');
            this.emojiPicker.classList.add('hidden');
        }
    }
    
    toggleEmojiPicker() {
        this.emojiPicker.classList.toggle('hidden');
    }

    renderChat(messages, myUid) {
        if (!messages) return;
        
        // ⚠️ OTIMIZADO: Comparar hash de mensagens para evitar re-render
        const messageHash = JSON.stringify(messages);
        if (messageHash === this.lastRenderedMessages && this.chatBody.children.length > 0) {
            return; // Sem mudanças, não re-renderiza
        }
        this.lastRenderedMessages = messageHash;
        
        // Badge de não lidas
        if (messages.length > this.lastMsgCount) {
            if (!this.chatOpen) {
                const unread = parseInt(this.chatBadge.textContent) + (messages.length - this.lastMsgCount);
                this.chatBadge.textContent = unread;
                this.chatBadge.classList.remove('hidden');
            }
        }
        
        // ⚠️ OTIMIZADO: Apenas renderizar últimas 50 mensagens
        const messagesToRender = messages.slice(-50);
        this.chatBody.innerHTML = '';
        
        messagesToRender.forEach(msg => {
            const el = document.createElement('div');
            const isMine = msg.uid === myUid;
            el.className = `chat-message ${isMine ? 'mine' : ''}`;
            
            let reactionsHTML = '';
            if (msg.reactions && Object.keys(msg.reactions).length > 0) {
                reactionsHTML = `<div class="chat-reactions">`;
                for (const [emoji, uids] of Object.entries(msg.reactions)) {
                    if (uids && uids.length > 0) {
                        reactionsHTML += `<span class="reaction-bubble">${emoji} ${uids.length}</span>`;
                    }
                }
                reactionsHTML += `</div>`;
            }

            el.innerHTML = `
                <span class="chat-sender">${isMine ? 'Você' : msg.sender}</span>
                ${msg.text}
                ${reactionsHTML}
            `;
            
            el.onclick = (e) => {
                this.activeMsgForReaction = msg.id;
                this.reactionMenu.style.top = (e.clientY - 50) + 'px';
                this.reactionMenu.style.left = (e.clientX - 100) + 'px'; 
                this.reactionMenu.classList.remove('hidden');
                e.stopPropagation();
            };

            this.chatBody.appendChild(el);
        });
        
        if (messages.length > this.lastMsgCount && this.chatOpen) {
            this.chatBody.scrollTop = this.chatBody.scrollHeight;
        }
        this.lastMsgCount = messages.length;
    }

    renderRoomsList(rooms) {
        if (!this.roomListContainer) {
            console.error("roomListContainer não encontrado no DOM");
            return;
        }
        
        console.log("Renderizando salas:", rooms);
        this.roomListContainer.innerHTML = '';

        if (!rooms || rooms.length === 0) {
            console.log("Nenhuma sala para exibir");
            this.roomListContainer.innerHTML = `
                <div class="no-rooms-message">
                    <div style="font-size: 3rem; margin-bottom: 15px;">📭</div>
                    <p style="font-size: 1.1rem; margin-bottom: 10px;">Nenhuma sala disponível</p>
                    <p style="font-size: 0.9rem; color: var(--text-secondary);">
                        Crie uma sala ou aguarde que alguém crie uma
                    </p>
                </div>
            `;
            return;
        }

        const roomsHTML = rooms.map(room => {
            const statusLabel = room.status === 'waiting' ? '⏳ Aguardando' : '▶️ Jogando';
            const statusClass = room.status === 'waiting' ? 'status-waiting' : 'status-playing';
            const statusColor = room.status === 'waiting' ? '#fbbf24' : '#4ade80';
            
            return `
                <div class="room-card">
                    <div class="room-card-header">
                        <span class="room-code">${room.code}</span>
                        <span class="room-status ${statusClass}" style="color: ${statusColor};">
                            ${statusLabel}
                        </span>
                    </div>
                    <div class="room-card-body">
                        <span class="room-host" title="Host: ${room.hostName}">Host: ${room.hostName}</span>
                    </div>
                    <div class="room-card-info">
                        <span class="room-players">👥 ${room.playerCount} jogador${room.playerCount !== 1 ? 'es' : ''}</span>
                        <span class="room-score">
                            <span style="color: var(--team-red);">●</span> ${room.scores.red} 
                            <span style="color: var(--team-blue);">●</span> ${room.scores.blue}
                        </span>
                    </div>
                    <button class="btn btn-join-room" data-code="${room.code}">
                        Entrar
                    </button>
                </div>
            `;
        }).join('');

        this.roomListContainer.innerHTML = roomsHTML;
        console.log("Salas renderizadas com sucesso");
    }

    updateSidebar(state, currentUserId, isHost) {
        // ⚠️ OTIMIZADO: Comparar estado anterior para evitar re-render desnecessário
        if (JSON.stringify(this.lastRenderedState) === JSON.stringify({
            players: state.players,
            teams: state.teams,
            scores: state.scores,
            activePair: state.activePair,
            reserve: state.reserve
        })) {
            return; // Sem mudanças relevantes
        }
        
        // Limpar listas
        this.listRed.innerHTML = '';
        this.listBlue.innerHTML = '';
        this.listLobby.innerHTML = '';

        if (!state || !state.players) return;

        const scores = state.scores || { red: 0, blue: 0, green: 0, purple: 0 };
        const teams = state.teams || { red: [], blue: [], green: [], purple: [] };
        const players = state.players || {};
        const activeTeams = state.activeTeams || ['red', 'blue'];

        this.scoreRedSidebar.textContent = scores.red;
        this.scoreBlueSidebar.textContent = scores.blue;

        const giverId = state.activePair?.giver;
        const guesserId = state.activePair?.guesser;
        const reserve = state.reserve;

        const playerIds = Object.keys(players);

        playerIds.forEach(uid => {
            const p = players[uid];
            const isMe = uid === currentUserId;
            
            let roleLabel = '';
            let isActive = false;
            
            if (uid === giverId) {
                roleLabel = 'Dica';
                isActive = true;
            } else if (uid === guesserId) {
                roleLabel = 'Chute';
                isActive = true;
            } else if (uid === reserve) {
                roleLabel = 'Reserva';
                isActive = false;
            } else {
                roleLabel = 'Participante';
            }

            const el = document.createElement('div');
            el.className = `participant-item ${isMe ? 'is-me' : ''} ${isActive ? 'active-turn' : ''}`;
            
            let badgeClass = 'role-badge';
            if (roleLabel === 'Dica') badgeClass += ' giver';
            else if (roleLabel === 'Chute') badgeClass += ' guesser';
            else if (roleLabel === 'Reserva') badgeClass += ' reserve';
            
            let actions = '';
            if (isHost && uid !== currentUserId) {
                actions += `<button class="action-icon-btn btn-kick" data-uid="${uid}" title="Expulsar">👢</button>`;
                
                // Mostrar botões de mover para times ativos apenas
                const userTeam = activeTeams.find(team => teams[team]?.includes(uid));
                if (userTeam && activeTeams.length > 1) {
                    const otherTeam = activeTeams.find(t => t !== userTeam);
                    if (otherTeam) {
                        actions += `<button class="btn-move-team" data-uid="${uid}" data-target="${otherTeam}" title="Mover para ${otherTeam}">⇄</button>`;
                    }
                }
            }

            el.innerHTML = `<span>${p.nickname || '???'}</span><div style="display:flex; align-items:center; gap:5px;">${roleLabel ? `<span class="${badgeClass}">${roleLabel}</span>` : ''}${actions}</div>`;

            // Determinar em qual lista adicionar - mantendo ordem
            let added = false;
            for (const team of activeTeams) {
                if (teams[team] && teams[team].includes(uid)) {
                    if (team === 'red') {
                        this.listRed.appendChild(el);
                    } else if (team === 'blue') {
                        this.listBlue.appendChild(el);
                    }
                    added = true;
                    break;
                }
            }

            // Se é reserve, mostrar na seção de lobby
            if (uid === reserve || !added) {
                this.listLobby.appendChild(el);
            }
        });
        
        // Cachear o estado renderizado
        this.lastRenderedState = {
            players: state.players,
            teams: state.teams,
            scores: state.scores,
            activePair: state.activePair,
            reserve: state.reserve
        };
    }

    updateLobby(isHost, roomId) {
        if (isHost) {
            this.hostStartPanel.classList.remove('hidden');
            this.waitingMsg.classList.add('hidden');
        } else {
            this.hostStartPanel.classList.add('hidden');
            this.waitingMsg.classList.remove('hidden');
        }
        const baseUrl = window.location.href.split('?')[0];
        this.shareUrlInput.value = `${baseUrl}?code=${roomId}`;
    }

    updateGameUI(state, currentUserId, isHost, GameData) {
        if (!state.scores) return;

        const activeTeams = state.activeTeams || ['red', 'blue'];
        const teamColorMap = {
            'red': 'var(--team-red)',
            'blue': 'var(--team-blue)',
            'green': '#10b981',
            'purple': '#a855f7'
        };

        const teamNameMap = {
            'red': 'VERMELHO',
            'blue': 'AZUL',
            'green': 'VERDE',
            'purple': 'ROXO'
        };

        // Atualizar placar
        activeTeams.forEach(team => {
            const scoreEl = document.getElementById(`score-${team}`);
            if (scoreEl) {
                scoreEl.textContent = state.scores[team] || 0;
                scoreEl.closest('.score-box')?.classList.remove('active');
            }
        });

        const currentTeamEl = document.getElementById(`score-${state.currentTurn}`);
        if (currentTeamEl) {
            currentTeamEl.closest('.score-box')?.classList.add('active');
        }

        // Atualizar indicador de turno
        this.turnIndicator.textContent = `VEZ DO TIME ${teamNameMap[state.currentTurn]}`;
        this.turnIndicator.style.color = teamColorMap[state.currentTurn];
        this.wordCard.className = "word-card turn-" + state.currentTurn;
        this.wordCard.style.borderTopColor = teamColorMap[state.currentTurn];

        if (isHost) {
            this.btnSwapGame.classList.remove('hidden');
            this.btnPauseGame.classList.remove('hidden');
            this.btnPauseGame.textContent = state.isPaused ? "▶" : "⏸";
            this.btnResumeOverlay.classList.remove('hidden');
        } else {
            this.btnSwapGame.classList.add('hidden');
            this.btnPauseGame.classList.add('hidden');
            this.btnResumeOverlay.classList.add('hidden');
        }

        const isGiver = state.activePair.giver === currentUserId;
        const isGuesser = state.activePair.guesser === currentUserId;

        console.log("Atualizar Interface do Jogo:", {
            isGiver,
            isGuesser,
            giverId: state.activePair.giver,
            guesserId: state.activePair.guesser,
            currentUserId
        });

        // Limpar classes anteriores
        this.wordCard.classList.remove('giver-mode', 'guesser-mode');
        this.roleDisplay.classList.remove('giver', 'guesser', 'spectator');

        // Determinar o time do usuário
        const activeTeams = state.activeTeams || ['red', 'blue'];
        const teams = state.teams || { red: [], blue: [], green: [], purple: [] };
        const userTeam = activeTeams.find(team => teams[team]?.includes(currentUserId));
        const guesserTeam = activeTeams.find(team => teams[team]?.includes(state.activePair.guesser));

        if (isGiver) {
            // Mostrar a palavra para quem dá dicas
            this.elWord.textContent = state.words[state.currentWordIndex] || '...';
            this.elWord.style.color = "#4ade80";
            this.roleDisplay.textContent = "🎤 Você está dando as dicas!";
            this.roleDisplay.classList.add('giver');
            this.wordCard.classList.add('giver-mode');
            this.hostControls.classList.remove('hidden');
            this.spectatorMsg.classList.add('hidden');
        } else if (isGuesser) {
            // Ocultar a palavra para quem tenta adivinhar
            this.elWord.textContent = "???";
            this.elWord.style.color = "#60a5fa";
            this.roleDisplay.textContent = "🎯 Tente adivinhar a palavra!";
            this.roleDisplay.classList.add('guesser');
            this.wordCard.classList.add('guesser-mode');
            this.hostControls.classList.add('hidden');
            this.spectatorMsg.classList.add('hidden');
        } else {
            // Espectador - pode ver a palavra
            this.elWord.textContent = state.words[state.currentWordIndex] || '...';
            this.elWord.style.color = "#fbbf24";
            this.roleDisplay.textContent = state.reserve === currentUserId ? "👀 Você é a reserva" : "👀 Você está assistindo";
            this.roleDisplay.classList.add('spectator');
            this.hostControls.classList.add('hidden');
            this.spectatorMsg.classList.add('hidden');
        }

        // Atualizar pontos de progresso
        this.progressContainer.innerHTML = '';
        for (let i = 0; i < GameData.WORDS_PER_ROUND; i++) {
            const d = document.createElement('div');
            d.className = 'dot ' + (i < state.correctCount ? 'active' : '');
            this.progressContainer.appendChild(d);
        }
    }
    
    updateIntro(state, isHost) {
        if (!state.activePair) return;
        
        const isRed = state.currentTurn === 'red';
        const color = isRed ? "var(--team-red)" : "var(--team-blue)";
        const teamName = isRed ? "VERMELHO" : "AZUL";
        
        document.getElementById('intro-team-text').textContent = teamName;
        document.getElementById('intro-team-text').style.color = color;
        
        const giverName = state.players[state.activePair.giver]?.nickname || '???';
        const guesserName = state.players[state.activePair.guesser]?.nickname || '???';
        
        document.getElementById('intro-giver').textContent = giverName;
        document.getElementById('intro-guesser').textContent = guesserName;

        if (isHost) this.hostIntroControls.classList.remove('hidden');
        else this.hostIntroControls.classList.add('hidden');
    }

    updateTimer(seconds) {
        this.elTimer.childNodes[0].nodeValue = Math.max(0, seconds) + ' '; 
        if (seconds <= 10) this.elTimer.classList.add('danger'); else this.elTimer.classList.remove('danger');
    }
}
