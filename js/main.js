import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { GameEngine } from "./modules/GameEngine.js";

// Chaves públicas apenas (seguindo padrão do Firebase)
const firebaseConfig = {
    apiKey: "AIzaSyDoaWmTN2513e5LGxOq--65ekL4PMqjUAs",
    authDomain: "megasenha-c29ba.firebaseapp.com",
    projectId: "megasenha-c29ba",
    storageBucket: "megasenha-c29ba.firebasestorage.app",
    messagingSenderId: "449328223327",
    appId: "1:449328223327:web:89ddff46caf8594be4f7ea",
    measurementId: "G-B2QYXF8ZFC"
};

if (!firebaseConfig.projectId) {
    console.error("ERRO: Configuração do Firebase ausente!");
    throw new Error("Firebase config missing");
}

const app = initializeApp(firebaseConfig);
window.game = new GameEngine(app);

// Check for Debug Mode
const params = new URLSearchParams(window.location.search);
if (params.get('debug') === 'true') {
    import("./modules/TestSuite.js").then(({ TestSuite }) => {
        const suite = new TestSuite(window.game);
        // Pequeno delay para garantir que o GameEngine inicializou
        setTimeout(() => suite.run(), 1000);
    }).catch(err => console.error("Falha ao carregar Suite de Testes:", err));
}
