import { 
    getAuth, signInAnonymously, signInWithCustomToken, signOut 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, setDoc, onSnapshot, updateDoc, deleteField, 
    arrayRemove, arrayUnion, deleteDoc, getDocs, query, where, or, and, collection 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export class NetworkController {
    constructor(app) {
        this.auth = getAuth(app);
        this.db = getFirestore(app);
        this.user = null;
        this.roomId = null;
        this.isHost = false;
        this.unsubscribe = null;
        this.onStateChange = null;
        this.updateQueue = [];
        this.isUpdating = false;
        this.lastUpdateTime = 0;
        this.updateDebounceMs = 200; // Aguarda 200ms antes de enviar atualizações
    }

    async forceNewIdentity() {
        if (this.auth.currentUser) {
            await signOut(this.auth);
            this.user = null;
            alert("Identidade resetada. Agora você pode entrar como um novo jogador.");
        }
    }

    async cleanupOldRooms() {
        const now = Date.now();
        const twoHoursAgo = now - (2 * 60 * 60 * 1000);

        try {
            // ⚠️ OTIMIZADO: Usar query com where para reduzir documentos lidos
            const sessionsRef = collection(this.db, 'mega_senha_sessions');
            const q = query(sessionsRef, where("timestamp", "<", twoHoursAgo));
            
            const snapshot = await getDocs(q);
            
            // Deletar apenas salas antigas
            snapshot.forEach(async (roomDoc) => {
                try {
                    await deleteDoc(doc(this.db, 'mega_senha_sessions', roomDoc.id));
                    console.log(`Sala expirada ${roomDoc.id} deletada`);
                } catch (docError) {
                    console.warn(`Erro ao deletar ${roomDoc.id}:`, docError);
                }
            });
        } catch (e) {
            console.warn("Falha no cleanup:", e);
        }
    }

    async init() {
        if (this.auth.currentUser) {
            this.user = this.auth.currentUser;
            return;
        }
        
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            try {
                const cred = await signInWithCustomToken(this.auth, __initial_auth_token);
                this.user = cred.user;
                return;
            } catch (e) { console.warn("Fallback anonymous", e); }
        }
        
        try {
            const cred = await signInAnonymously(this.auth);
            this.user = cred.user;
        } catch (e) { 
            console.error("Falha Auth:", e); 
            alert("Erro de autenticação. Verifique o console.");
        }
    }

    reset() {
        if (this.unsubscribe) { this.unsubscribe(); this.unsubscribe = null; }
        this.roomId = null;
        this.isHost = false;
    }

    async createRoom(nickname) {
        await this.init();
        if (!this.user) throw new Error("Não autenticado");
        
        const code = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.roomId = code;
        this.isHost = true;

        const roomRef = doc(this.db, 'mega_senha_sessions', code);
        
        const initialState = {
            hostId: this.user.uid,
            status: 'waiting', 
            scores: { red: 0, blue: 0, green: 0, purple: 0 },
            currentTurn: 'red', 
            teams: { red: [], blue: [], green: [], purple: [] },
            activeTeams: ['red', 'blue'], // Apenas times ativos
            reserve: null,
            rotatedOut: null,
            activePair: { giver: null, guesser: null },
            correctCount: 0,
            words: [],
            currentWordIndex: 0,
            roundStartTime: null,
            roundNumber: 0, 
            isPaused: false,
            timeRemainingWhenPaused: 0,
            
            teamHistory: {}, // Histórico de papéis por time
            
            lastEvent: 'created',
            timestamp: Date.now(),
            
            usedWords: [],
            
            messages: [], 
            players: {
                [this.user.uid]: { nickname: nickname, role: 'host', team: null }
            }
        };

        await setDoc(roomRef, initialState);
        this.subscribeToRoom(code);
        return code;
    }

    async joinRoom(code, nickname) {
        await this.init();
        if (!this.user) throw new Error("Não autenticado");

        const roomRef = doc(this.db, 'mega_senha_sessions', code);
        const snap = await getDoc(roomRef);

        if (snap.exists()) {
            const data = snap.data();
            const isTooOld = (Date.now() - (data.timestamp || 0)) > (2 * 60 * 60 * 1000);
            const isEmpty = !data.players || Object.keys(data.players).length === 0;

            if (isTooOld || isEmpty) {
                await deleteDoc(roomRef);
                alert("Sala não existe mais, crie outra");
                return false;
            }

            this.roomId = code;
            this.isHost = false;
            const updateData = {};
            updateData[`players.${this.user.uid}`] = { nickname: nickname, role: 'player', team: null };
            await updateDoc(roomRef, updateData);
            this.subscribeToRoom(code);
            return true;
        }
        return false;
    }

    async leaveRoom() {
        if (!this.roomId || !this.user) {
            this.reset();
            return;
        }
        const roomRef = doc(this.db, 'mega_senha_sessions', this.roomId);
        const uid = this.user.uid;
        try {
            // Se o host está saindo, deleta a sala inteira
            if (this.isHost) {
                console.log(`Host ${uid} saindo. Deletando sala ${this.roomId}`);
                await deleteDoc(roomRef);
            } else {
                // Se é um jogador normal, apenas remove ele da sala
                const snap = await getDoc(roomRef);
                if (snap.exists()) {
                    const data = snap.data();
                    const updatedPlayers = { ...data.players };
                    delete updatedPlayers[uid];

                    // Remover do teams também
                    const updatedTeams = { ...data.teams };
                    updatedTeams.red = (updatedTeams.red || []).filter(id => id !== uid);
                    updatedTeams.blue = (updatedTeams.blue || []).filter(id => id !== uid);
                    updatedTeams.green = (updatedTeams.green || []).filter(id => id !== uid);
                    updatedTeams.purple = (updatedTeams.purple || []).filter(id => id !== uid);

                    // Se é reserve, remove também
                    let newReserve = data.reserve === uid ? null : data.reserve;

                    // Se está em status de jogo e fica com menos de 2 jogadores, volta para waiting
                    const totalPlayers = Object.keys(updatedPlayers).length;
                    let newStatus = data.status;
                    
                    if ((data.status === 'playing' || data.status === 'intro') && totalPlayers < 2) {
                        newStatus = 'waiting';
                        console.log(`Sala retornou para waiting pois ficou com ${totalPlayers} jogador(es)`);
                    }

                    await updateDoc(roomRef, {
                        players: updatedPlayers,
                        teams: updatedTeams,
                        reserve: newReserve,
                        status: newStatus,
                        activePair: newStatus === 'waiting' ? { giver: null, guesser: null } : data.activePair
                    });

                    // Se ficou vazio, deleta a sala
                    if (Object.keys(updatedPlayers).length === 0) {
                        console.log(`Sala ${this.roomId} ficou vazia. Deletando.`);
                        await deleteDoc(roomRef);
                    }
                }
            }
        } catch (e) { 
            console.error("Erro ao sair da sala:", e); 
        } finally {
            this.reset();
        }
    }

    async promoteNewHost(newHostId) {
        if (!this.roomId) return;
        const roomRef = doc(this.db, 'mega_senha_sessions', this.roomId);
        try {
            await updateDoc(roomRef, {
                hostId: newHostId,
                [`players.${newHostId}.role`]: 'host'
            });
        } catch (e) { console.error("Erro ao promover host:", e); }
    }

    async switchPlayerTeam(targetUid, targetTeam) {
        if (!this.roomId) return;
        const roomRef = doc(this.db, 'mega_senha_sessions', this.roomId);
        try {
            const batch = {};
            batch["teams.red"] = arrayRemove(targetUid);
            batch["teams.blue"] = arrayRemove(targetUid);
            await updateDoc(roomRef, batch);
            if (targetTeam === 'red') {
                await updateDoc(roomRef, { "teams.red": arrayUnion(targetUid) });
            } else if (targetTeam === 'blue') {
                await updateDoc(roomRef, { "teams.blue": arrayUnion(targetUid) });
            }
        } catch(e) { console.error("Erro ao trocar time", e); }
    }

    async kickPlayer(targetUid) {
        if (!this.roomId) return;
        const roomRef = doc(this.db, 'mega_senha_sessions', this.roomId);
        try {
            await updateDoc(roomRef, {
                [`players.${targetUid}`]: deleteField(),
                "teams.red": arrayRemove(targetUid),
                "teams.blue": arrayRemove(targetUid)
            });
        } catch(e) { console.error("Erro ao kickar", e); }
    }

    subscribeToRoom(code) {
        if (this.unsubscribe) this.unsubscribe();
        const roomRef = doc(this.db, 'mega_senha_sessions', code);
        
        // ⚠️ OTIMIZADO: Usar onSnapshotListener com options para reduzir updates
        this.unsubscribe = onSnapshot(
            roomRef,
            { includeMetadataChanges: false }, // Ignora mudanças de metadata
            (doc) => {
                if (doc.exists() && this.onStateChange) {
                    this.onStateChange(doc.data());
                }
            },
            (error) => {
                console.error("Erro no listener:", error);
            }
        );
    }

    async updateState(newData) {
        if (!this.roomId) return;
        
        // Fila de atualizações para debouncing
        this.updateQueue.push(newData);
        
        if (this.isUpdating) return;
        
        const now = Date.now();
        const timeSinceLastUpdate = now - this.lastUpdateTime;
        const waitTime = Math.max(0, this.updateDebounceMs - timeSinceLastUpdate);
        
        this.isUpdating = true;
        
        setTimeout(async () => {
            if (this.updateQueue.length === 0) {
                this.isUpdating = false;
                return;
            }
            
            // Mesclar todas as atualizações da fila
            const mergedData = this.updateQueue.reduce((acc, update) => {
                return { ...acc, ...update };
            }, {});
            
            this.updateQueue = [];
            
            const roomRef = doc(this.db, 'mega_senha_sessions', this.roomId);
            try {
                await updateDoc(roomRef, { ...mergedData, timestamp: Date.now() });
                this.lastUpdateTime = Date.now();
            } catch (e) {
                console.error("ERRO UPDATE:", e);
                if (e.code === 'permission-denied') alert("Erro de permissão no banco.");
            } finally {
                this.isUpdating = false;
            }
        }, waitTime);
    }
    
    async updateMessages(messages) {
        if (!this.roomId) return;
        const roomRef = doc(this.db, 'mega_senha_sessions', this.roomId);
        try {
            await updateDoc(roomRef, { messages: messages });
        } catch(e) { console.error("Chat Reaction Error:", e); }
    }

    async sendChatMessage(text, nickname) {
        if (!this.roomId) return;
        const roomRef = doc(this.db, 'mega_senha_sessions', this.roomId);
        const msg = {
            id: Date.now() + Math.random().toString(), 
            sender: nickname,
            text: text,
            uid: this.user.uid,
            timestamp: Date.now(),
            reactions: {} 
        };
        try {
            await updateDoc(roomRef, {
                messages: arrayUnion(msg)
            });
        } catch(e) { console.error("Chat Error:", e); }
    }
}
