import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export class RoomListController {
    constructor(db) {
        if (!db) {
            console.error("RoomListController: Firestore db não foi passado!");
        }
        this.db = db;
        this.rooms = [];
    }

    async fetchAvailableRooms() {
        try {
            if (!this.db) {
                console.error("Firestore não inicializado");
                return [];
            }

            console.log("Buscando salas com status 'waiting'...");
            
            const sessionsRef = collection(this.db, 'mega_senha_sessions');
            const q = query(sessionsRef, where("status", "==", "waiting"));
            
            const snapshot = await getDocs(q);
            this.rooms = [];

            console.log(`Total de documentos encontrados: ${snapshot.size}`);

            if (snapshot.empty) {
                console.log("Nenhuma sala disponível encontrada (snapshot vazio)");
                return this.rooms;
            }

            snapshot.forEach(doc => {
                try {
                    const data = doc.data();
                    
                    console.log(`Processando sala ${doc.id}:`, data);
                    
                    // Validar dados essenciais
                    if (!data || typeof data !== 'object') {
                        console.warn(`Sala ${doc.id} tem dados inválidos`);
                        return;
                    }

                    const players = data.players || {};
                    const playerCount = Object.keys(players).length;
                    
                    console.log(`Sala ${doc.id} tem ${playerCount} jogadores`);
                    
                    // Mostrar apenas salas com jogadores
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
                        console.log(`Sala ${doc.id} adicionada:`, room);
                    }
                } catch (docError) {
                    console.warn(`Erro ao processar sala ${doc.id}:`, docError);
                }
            });

            // Ordenar por mais recente primeiro
            this.rooms.sort((a, b) => b.createdAt - a.createdAt);
            
            console.log(`Total de salas disponíveis: ${this.rooms.length}`, this.rooms);
            return this.rooms;
        } catch (e) {
            console.error("Erro ao buscar salas disponíveis:", e);
            console.error("Código do erro:", e.code);
            console.error("Mensagem do erro:", e.message);
            
            // Retornar array vazio em caso de erro
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
