// Initialize variables
let timer;
let timeLeft;
let isWorkTime = true;
let isPaused = true;
let cyclesCompleted = 0;
let dailyStats = {
    cycles: 0,
    totalMinutes: 0,
    date: new Date().toLocaleDateString()
};

// DOM Elements
const timerDisplay = document.getElementById('timer');
const startButton = document.getElementById('start');
const pauseButton = document.getElementById('pause');
const resetButton = document.getElementById('reset');
const workTimeInput = document.getElementById('workTime');
const breakTimeInput = document.getElementById('breakTime');
const newTaskInput = document.getElementById('newTask');
const addTaskButton = document.getElementById('addTask');
const breakTasksList = document.getElementById('breakTasks');
const downloadStatsButton = document.getElementById('downloadStats');
const workEndSound = document.getElementById('workEndSound');
const breakEndSound = document.getElementById('breakEndSound');

// Event Listeners
startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);
addTaskButton.addEventListener('click', addBreakTask);
downloadStatsButton.addEventListener('click', downloadStats);

// Input change listeners to update timer immediately
workTimeInput.addEventListener('change', () => {
    if (isPaused && isWorkTime) {
        timeLeft = workTimeInput.value * 60;
        updateTimerDisplay();
    }
});

breakTimeInput.addEventListener('change', () => {
    if (isPaused && !isWorkTime) {
        timeLeft = breakTimeInput.value * 60;
        updateTimerDisplay();
    }
});

function startTimer() {
    if (isPaused) {
        isPaused = false;
        if (timeLeft === undefined) {
            timeLeft = workTimeInput.value * 60;
        }
        timer = setInterval(updateTimer, 1000);
        startButton.disabled = true;
        pauseButton.disabled = false;
    }
}

function pauseTimer() {
    clearInterval(timer);
    isPaused = true;
    startButton.disabled = false;
    pauseButton.disabled = true;
}

function resetTimer() {
    clearInterval(timer);
    isPaused = true;
    isWorkTime = true;
    timeLeft = workTimeInput.value * 60;
    updateTimerDisplay();
    startButton.disabled = false;
    pauseButton.disabled = false;
}

function updateTimer() {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
        handleTimerEnd();
    }
}

function handleTimerEnd() {
    clearInterval(timer);
    if (isWorkTime) {
        cyclesCompleted++;
        dailyStats.cycles++;
        dailyStats.totalMinutes += parseInt(workTimeInput.value);
        updateStats();
        playSound(workEndSound);
        showRandomBreakTask();
        timeLeft = breakTimeInput.value * 60;
        isWorkTime = false;
    } else {
        playSound(breakEndSound);
        timeLeft = workTimeInput.value * 60;
        isWorkTime = true;
    }
    updateTimerDisplay();
    isPaused = true;
    startButton.disabled = false;
}

function playSound(sound) {
    try {
        sound.currentTime = 0;
        sound.play();
    } catch (error) {
        console.log('Sound not loaded yet');
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function addBreakTask() {
    const taskText = newTaskInput.value.trim();
    if (taskText) {
        const li = document.createElement('li');
        li.textContent = taskText;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '×';
        deleteButton.onclick = () => li.remove();
        li.appendChild(deleteButton);
        breakTasksList.appendChild(li);
        newTaskInput.value = '';
    }
}

function showRandomBreakTask() {
    const tasks = breakTasksList.children;
    if (tasks.length > 0) {
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
        alert(`Sugestão de pausa: ${randomTask.textContent.slice(0, -1)}`);
    }
}

function updateStats() {
    document.getElementById('todayCycles').textContent = dailyStats.cycles;
    const hours = Math.floor(dailyStats.totalMinutes / 60);
    const minutes = dailyStats.totalMinutes % 60;
    document.getElementById('totalTime').textContent = `${hours}h ${minutes}m`;
}

function downloadStats() {
    const stats = `Estatísticas do Pomodoro\n
Data: ${dailyStats.date}
Ciclos completados: ${dailyStats.cycles}
Tempo total de estudo: ${Math.floor(dailyStats.totalMinutes / 60)}h ${dailyStats.totalMinutes % 60}m`;

    const blob = new Blob([stats], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pomodoro-stats-${dailyStats.date.replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Initialize
resetTimer();
