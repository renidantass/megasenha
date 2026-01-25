import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export class RoomListController {
    constructor(db) {
        if (!db) {
            console.error("RoomListController: Firestore db não foi passado!");
        }
        this.db = db;
        this.rooms = [];
        this.lastFetchTime = 0;
        this.fetchCacheMs = 5000; // Cache de 5 segundos
    }

    async fetchAvailableRooms() {
        try {
            if (!this.db) {
                console.error("Firestore não inicializado");
                return [];
            }

            // ⚠️ OTIMIZADO: Cache local para reduzir queries
            const now = Date.now();
            if (now - this.lastFetchTime < this.fetchCacheMs && this.rooms.length > 0) {
                console.log("Usando cache de salas");
                return this.rooms;
            }

            console.log("Buscando salas com status 'waiting'...");
            
            const sessionsRef = collection(this.db, 'mega_senha_sessions');
            // ⚠️ OTIMIZADO: Query específica para status waiting
            const q = query(sessionsRef, where("status", "==", "waiting"));
            
            const snapshot = await getDocs(q);
            this.rooms = [];
            this.lastFetchTime = now;

            console.log(`Total de documentos encontrados: ${snapshot.size}`);

            if (snapshot.empty) {
                console.log("Nenhuma sala disponível encontrada");
                return this.rooms;
            }

            snapshot.forEach(doc => {
                try {
                    const data = doc.data();
                    
                    if (!data || typeof data !== 'object') {
                        console.warn(`Sala ${doc.id} tem dados inválidos`);
                        return;
                    }

                    const players = data.players || {};
                    const playerCount = Object.keys(players).length;
                    
                    if (playerCount > 0) {
                        const hostPlayer = Object.values(players).find(p => p && p.role === 'host');
                        
                        const room = {
                            code: doc.id,
                            hostName: hostPlayer?.nickname || 'Anônimo',
                            playerCount: playerCount,
                            createdAt: data.timestamp || 0,
                            scores: data.scores || { red: 0, blue: 0 },
                            status: data.status || 'waiting'
                        };
                        
                        this.rooms.push(room);
                    }
                } catch (docError) {
                    console.warn(`Erro ao processar sala ${doc.id}:`, docError);
                }
            });

            this.rooms.sort((a, b) => b.createdAt - a.createdAt);
            
            console.log(`Total de salas disponíveis: ${this.rooms.length}`);
            return this.rooms;
        } catch (e) {
            console.error("Erro ao buscar salas:", e);
            return [];
        }
    }

    getRooms() {
        return this.rooms;
    }

    clearRooms() {
        this.rooms = [];
    }
}
