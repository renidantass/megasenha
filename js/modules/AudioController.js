export class AudioController {
    constructor() { 
        this.ctx = null; 
        const saved = localStorage.getItem('ms_sound_enabled');
        this.enabled = saved === null ? true : (saved === 'true');
    }

    init() { 
        if (!this.ctx) { 
            const AC = window.AudioContext || window.webkitAudioContext; 
            this.ctx = new AC(); 
        } 
    }

    toggle() { 
        this.enabled = !this.enabled; 
        localStorage.setItem('ms_sound_enabled', this.enabled);
        return this.enabled; 
    }

    play(type) {
        if (!this.enabled) return;
        try {
            this.init(); 
            if (this.ctx.state === 'suspended') this.ctx.resume();
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain); 
            gain.connect(this.ctx.destination);

            switch (type) {
                case 'tick':
                    osc.type = 'square'; 
                    osc.frequency.setValueAtTime(800, t);
                    gain.gain.setValueAtTime(0.05, t); 
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                    osc.start(t); 
                    osc.stop(t + 0.05); 
                    break;
                case 'correct':
                    osc.type = 'sine'; 
                    osc.frequency.setValueAtTime(800, t); 
                    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
                    gain.gain.setValueAtTime(0.3, t); 
                    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
                    osc.start(t); 
                    osc.stop(t + 0.5); 
                    break;
                case 'pass':
                    osc.type = 'sawtooth'; 
                    osc.frequency.setValueAtTime(300, t); 
                    osc.frequency.linearRampToValueAtTime(100, t + 0.3);
                    gain.gain.setValueAtTime(0.2, t); 
                    gain.gain.linearRampToValueAtTime(0.01, t + 0.3);
                    osc.start(t); 
                    osc.stop(t + 0.3); 
                    break;
                case 'win':
                    this._playChord([523.25, 659.25, 783.99, 1046.50]); 
                    break;
                case 'gameover':
                    osc.type = 'sawtooth'; 
                    osc.frequency.setValueAtTime(150, t); 
                    osc.frequency.linearRampToValueAtTime(100, t + 1);
                    gain.gain.setValueAtTime(0.3, t); 
                    gain.gain.linearRampToValueAtTime(0.01, t + 1);
                    osc.start(t); 
                    osc.stop(t + 1); 
                    break;
            }
        } catch(e) { 
            console.warn("Audio error", e); 
        }
    }

    _playChord(freqs) {
        const t = this.ctx.currentTime;
        freqs.forEach((f, i) => {
            const osc = this.ctx.createOscillator(); 
            const gain = this.ctx.createGain();
            osc.connect(gain); 
            gain.connect(this.ctx.destination);
            osc.type = 'triangle'; 
            osc.frequency.value = f;
            const delay = i * 0.1;
            gain.gain.setValueAtTime(0, t + delay);
            gain.gain.linearRampToValueAtTime(0.2, t + delay + 0.05); 
            gain.gain.linearRampToValueAtTime(0, t + delay + 1.5);
            osc.start(t + delay); 
            osc.stop(t + delay + 1.5);
        });
    }
}
