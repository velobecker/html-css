class PomodoroTimer {
    constructor() {
        this.timeLeft = 0;
        this.isWorkTime = true;
        this.isPaused = true;
        this.initializeElements();
        this.initializeWorker();
        this.initializeEventListeners();
        this.stats = {
            cycles: 0,
            totalMinutes: 0,
            date: new Date().toLocaleDateString()
        };
        console.log('PomodoroTimer initialized');
    }

    initializeElements() {
        try {
            this.elements = {
                timer: document.getElementById('timer'),
                start: document.getElementById('start'),
                startBreak: document.getElementById('startBreak'),
                pause: document.getElementById('pause'),
                reset: document.getElementById('reset'),
                workTime: document.getElementById('workTime'),
                breakTime: document.getElementById('breakTime'),
                newTask: document.getElementById('newTask'),
                addTask: document.getElementById('addTask'),
                breakTasks: document.getElementById('breakTasks'),
                downloadStats: document.getElementById('downloadStats'),
                workEndSound: document.getElementById('workEndSound'),
                breakEndSound: document.getElementById('breakEndSound')
            };

            // Verificar se todos os elementos foram encontrados
            Object.entries(this.elements).forEach(([key, element]) => {
                if (!element) {
                    throw new Error(`Element ${key} not found`);
                }
            });
            
            console.log('All elements initialized successfully');
        } catch (error) {
            console.error('Error initializing elements:', error);
        }
    }

    initializeWorker() {
        try {
            // Usar caminho relativo correto
            this.worker = new Worker('js/timerWorker.js');
            console.log('Worker initialized');
        } catch (error) {
            console.error('Error initializing worker:', error);
            alert('Erro ao inicializar o timer. Por favor, use um servidor local.');
        }
    }

    initializeEventListeners() {
        try {
            // Worker events
            this.worker.onmessage = (e) => this.handleWorkerMessage(e.data);

            // Button events
            this.elements.start.addEventListener('click', () => {
                console.log('Start button clicked');
                this.startTimer('work');
            });
            this.elements.startBreak.addEventListener('click', () => {
                console.log('Start break clicked');
                this.startTimer('break');
            });
            this.elements.pause.addEventListener('click', () => this.pauseTimer());
            this.elements.reset.addEventListener('click', () => this.resetTimer());
            this.elements.addTask.addEventListener('click', () => this.addBreakTask());
            this.elements.downloadStats.addEventListener('click', () => this.downloadStats());
            
            // Input events
            this.elements.workTime.addEventListener('change', () => this.handleTimeInputChange());
            this.elements.breakTime.addEventListener('change', () => this.handleTimeInputChange());
            
            console.log('Event listeners initialized');
        } catch (error) {
            console.error('Error initializing event listeners:', error);
        }
    }

    createFallbackWorker() {
        // Timer simples caso o Web Worker falhe
        return {
            postMessage: (msg) => {
                if (msg.command === 'start') {
                    this.fallbackTimer(msg.duration);
                }
            }
        };
    }

    fallbackTimer(duration) {
        let remaining = duration;
        setInterval(() => {
            this.handleWorkerMessage({
                type: 'tick',
                timeLeft: remaining--
            });
            if (remaining < 0) {
                this.handleWorkerMessage({ type: 'complete' });
            }
        }, 1000);
    }

    handleWorkerMessage(data) {
        switch(data.type) {
            case 'tick':
                this.timeLeft = data.timeLeft;
                this.updateDisplay();
                break;
            case 'complete':
                this.handleTimerComplete();
                break;
            case 'paused':
                this.timeLeft = data.timeLeft;
                this.updateDisplay();
                break;
            case 'reset':
                this.handleReset();
                break;
        }
    }

    startTimer(type = 'work') {
        if (this.isPaused) {
            console.log('Starting timer:', type);
            
            // Reset previous timer state
            this.worker.postMessage({ command: 'reset' });
            
            if (type === 'break') {
                this.isWorkTime = false;
                this.timeLeft = parseInt(this.elements.breakTime.value) * 60;
            } else {
                this.isWorkTime = true;
                this.timeLeft = parseInt(this.elements.workTime.value) * 60;
            }

            this.isPaused = false;
            this.updateDisplay();

            // Start new timer
            this.worker.postMessage({ 
                command: 'start', 
                duration: this.timeLeft 
            });

            // Update button states
            this.elements.start.disabled = true;
            this.elements.startBreak.disabled = true;
            this.elements.pause.disabled = false;
            this.elements.reset.disabled = false;
        }
    }

    pauseTimer() {
        if (!this.isPaused) {
            console.log('Pausing timer');
            this.worker.postMessage({ command: 'pause' });
            this.isPaused = true;
            
            // Re-enable correct start button based on current mode
            if (this.isWorkTime) {
                this.elements.start.disabled = false;
                this.elements.startBreak.disabled = true;
            } else {
                this.elements.start.disabled = true;
                this.elements.startBreak.disabled = false;
            }
            
            this.elements.pause.disabled = true;
            this.elements.reset.disabled = false;
        }
    }

    resetTimer() {
        this.worker.postMessage({ command: 'reset' });
        this.isWorkTime = true;
        this.isPaused = true;
        this.timeLeft = parseInt(this.elements.workTime.value) * 60;
        this.updateDisplay();
        
        // Resetar estado dos botões
        this.elements.start.disabled = false;
        this.elements.startBreak.disabled = true;
        this.elements.pause.disabled = true;
        this.elements.reset.disabled = false;
    }

    getCurrentDuration() {
        return (this.isWorkTime ? 
            parseInt(this.elements.workTime.value) : 
            parseInt(this.elements.breakTime.value)) * 60;
    }

    handleTimerComplete() {
        // Clear current timer
        this.worker.postMessage({ command: 'reset' });
        this.isPaused = true;

        if (this.isWorkTime) {
            // Work time finished
            this.stats.cycles++;
            this.stats.totalMinutes += parseInt(this.elements.workTime.value);
            this.updateStats();
            this.playSound(this.elements.workEndSound);
            this.showRandomBreakTask();
            
            // Setup for break time
            this.isWorkTime = false;
            this.timeLeft = parseInt(this.elements.breakTime.value) * 60;
            
            // Enable only break button
            this.elements.start.disabled = true;
            this.elements.startBreak.disabled = false;
        } else {
            // Break time finished
            this.playSound(this.elements.breakEndSound);
            
            // Setup for work time
            this.isWorkTime = true;
            this.timeLeft = parseInt(this.elements.workTime.value) * 60;
            
            // Enable only work button
            this.elements.start.disabled = false;
            this.elements.startBreak.disabled = true;
        }

        this.updateDisplay();
        this.elements.pause.disabled = true;
        this.elements.reset.disabled = false;

        console.log('Timer completed. Work time:', this.isWorkTime, 'Time left:', this.timeLeft);
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.elements.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    playSound(sound) {
        try {
            // Parar o som se já estiver tocando
            sound.pause();
            sound.currentTime = 0;
            
            // Tocar apenas uma vez
            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Som começou a tocar
                    setTimeout(() => {
                        sound.pause();
                        sound.currentTime = 0;
                    }, 3000); // Parar após 3 segundos
                }).catch(error => {
                    console.log('Erro ao tocar som:', error);
                });
            }
        } catch (error) {
            console.log('Sound not loaded yet');
        }
    }

    addBreakTask() {
        const taskText = this.elements.newTask.value.trim();
        if (taskText) {
            const li = document.createElement('li');
            li.textContent = taskText;
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '×';
            deleteButton.onclick = () => li.remove();
            li.appendChild(deleteButton);
            this.elements.breakTasks.appendChild(li);
            this.elements.newTask.value = '';
        }
    }

    showRandomBreakTask() {
        const tasks = this.elements.breakTasks.children;
        if (tasks.length > 0) {
            const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
            alert(`Sugestão de pausa: ${randomTask.textContent.slice(0, -1)}`);
        }
    }

    updateStats() {
        document.getElementById('todayCycles').textContent = this.stats.cycles;
        const hours = Math.floor(this.stats.totalMinutes / 60);
        const minutes = this.stats.totalMinutes % 60;
        document.getElementById('totalTime').textContent = `${hours}h ${minutes}m`;
    }

    handleTimeInputChange() {
        if (this.isPaused) {
            this.timeLeft = this.getCurrentDuration();
            this.updateDisplay();
        }
    }

    updateControls(isRunning) {
        if (isRunning) {
            this.elements.pause.disabled = false;
            this.elements.reset.disabled = true;
            if (this.isWorkTime) {
                this.elements.start.disabled = true;
                this.elements.startBreak.disabled = true;
            } else {
                this.elements.start.disabled = true;
                this.elements.startBreak.disabled = true;
            }
        } else {
            this.elements.pause.disabled = true;
            this.elements.reset.disabled = false;
            if (this.isWorkTime) {
                this.elements.start.disabled = false;
                this.elements.startBreak.disabled = true;
            } else {
                this.elements.start.disabled = true;
                this.elements.startBreak.disabled = false;
            }
        }
    }

    handleReset() {
        this.isWorkTime = true;
        this.isPaused = true;
        this.timeLeft = this.getCurrentDuration();
        this.updateDisplay();
        this.updateControls(false);
    }

    downloadStats() {
        const stats = `Estatísticas do Pomodoro\n
        Data: ${this.stats.date}
        Ciclos completados: ${this.stats.cycles}
        Tempo total de estudo: ${Math.floor(this.stats.totalMinutes / 60)}h ${this.stats.totalMinutes % 60}m`;

        const blob = new Blob([stats], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pomodoro-stats-${this.stats.date.replace(/\//g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}

// Esperar o DOM carregar completamente
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing PomodoroTimer');
    window.pomodoro = new PomodoroTimer();
    window.pomodoro.resetTimer();
});
