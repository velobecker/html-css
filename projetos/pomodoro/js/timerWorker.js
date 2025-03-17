let timerId = null;
let endTime = null;

self.onmessage = function(e) {
    const { command, duration } = e.data;
    
    switch(command) {
        case 'start':
            startTimer(duration);
            break;
        case 'pause':
            pauseTimer();
            break;
        case 'reset':
            resetTimer();
            break;
    }
};

function startTimer(duration) {
    clearInterval(timerId);
    endTime = Date.now() + (duration * 1000);
    
    function tick() {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        self.postMessage({ type: 'tick', timeLeft: remaining });
        
        if (remaining <= 0) {
            clearInterval(timerId);
            self.postMessage({ type: 'complete' });
        }
    }
    
    tick();
    timerId = setInterval(tick, 100);
}

function pauseTimer() {
    if (timerId) {
        clearInterval(timerId);
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        self.postMessage({ type: 'paused', timeLeft: remaining });
    }
}

function resetTimer() {
    clearInterval(timerId);
    timerId = null;
    endTime = null;
    self.postMessage({ type: 'reset' });
}
