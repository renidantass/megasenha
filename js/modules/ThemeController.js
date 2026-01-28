export class ThemeController {
    constructor() {
        this.currentTheme = this.getSystemTheme();
        this.init();
    }

    getSystemTheme() {
        const saved = localStorage.getItem('ms_theme');
        if (saved) return saved;

        // Detecta tema do sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.updateThemeButton();

        // Detecta mudança no tema do sistema
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                const newTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(newTheme);
                this.updateThemeButton();
            });
        }
    }

    applyTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('ms_theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }

    toggle() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.updateThemeButton();
        return newTheme;
    }

    updateThemeButton() {
        const btn = document.getElementById('btn-toggle-theme');
        if (btn) {
            btn.innerHTML = this.currentTheme === 'dark' ? '<i class="las la-sun"></i>' : '<i class="las la-moon"></i>';
            btn.setAttribute('aria-label', `Tema: ${this.currentTheme === 'dark' ? 'Escuro' : 'Claro'}`);
        }
    }

    isDark() {
        return this.currentTheme === 'dark';
    }
}
