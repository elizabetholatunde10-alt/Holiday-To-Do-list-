// ==========================================
// 1. APP CONFIGURATION & STATE (With Storage)
// ==========================================
// Load saved numbers from memory, or start fresh at 0/1 if empty
let xp = Number(localStorage.getItem('todo_xp')) || 0;
let points = Number(localStorage.getItem('todo_points')) || 0;
let completedCount = Number(localStorage.getItem('todo_completedCount')) || 0;
let currentLevel = Number(localStorage.getItem('todo_currentLevel')) || 1;
let currentStreak = Number(localStorage.getItem('todo_currentStreak')) || 0;

const strictMessages = [
  "Climb higher. No excuses.",
  "Progress or regret. Choose.",
  "Climb or fall behind.",
  "Weakness is optional.",
  "The clock is ticking. Get it done.",
  "Yesterday you said tomorrow. Act now."
];

// Array to hold active task objects
let activeTasksArray = JSON.parse(localStorage.getItem('todo_tasksArray')) || [];

let leaderboardData = [
  { name: "Alex (You)", score: 0, level: 1, isUser: true },
  { name: "Sola_Climber", score: 180, level: 2, isUser: false },
  { name: "Dev_Olu", score: 90, level: 1, isUser: false },
  { name: "Ruth_Gym", score: 240, level: 3, isUser: false }
];

// ==========================================
// 2. CORE UTILITY & SAVE FUNCTIONS
// ==========================================

function getRequiredXP(level) {
  return 100 + (level - 1) * 50; 
}

function getCurrentTimeString() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Saves all core numerical stats to phone memory
function saveStatsToMemory() {
  localStorage.setItem('todo_xp', xp);
  localStorage.setItem('todo_points', points);
  localStorage.setItem('todo_completedCount', completedCount);
  localStorage.setItem('todo_currentLevel', currentLevel);
  localStorage.setItem('todo_currentStreak', currentStreak);
}

// Saves the array of active tasks to phone memory
function saveTasksToMemory() {
  localStorage.setItem('todo_tasksArray', JSON.stringify(activeTasksArray));
}

// ==========================================
// 3. UI RENDERING LOGIC
// ==========================================

function updateUI() {
  const neededXP = getRequiredXP(currentLevel);
  
  if(document.getElementById('levelText')) document.getElementById('levelText').textContent = `Level ${currentLevel}`;
  if(document.getElementById('xpText')) document.getElementById('xpText').textContent = `${xp} / ${neededXP} XP`;
  if(document.getElementById('points')) document.getElementById('points').textContent = points;
  if(document.getElementById('completed')) document.getElementById('completed').textContent = completedCount;

  const percentage = (xp / neededXP) * 100;
  const progressFill = document.getElementById('progressFill');
  if (progressFill) progressFill.style.width = `${percentage}%`;

  const motivationEl = document.getElementById('motivation');
  if (motivationEl) {
    const randomIndex = Math.floor(Math.random() * strictMessages.length);
    motivationEl.textContent = strictMessages[randomIndex];
  }

  renderLeaderboard();
}

function renderLeaderboard() {
  const userRow = leaderboardData.find(player => player.isUser);
  if (userRow) {
    userRow.score = points;
    userRow.level = currentLevel;
  }

  leaderboardData.sort((a, b) => b.score - a.score);

  const leaderboardContainer = document.getElementById('leaderboardList');
  if (!leaderboardContainer) return;

  leaderboardContainer.innerHTML = '';
  leaderboardData.forEach((player, index) => {
    const item = document.createElement('div');
    item.className = `leaderboard-item ${player.isUser ? 'user-highlight' : ''}`;
    item.innerHTML = `
      <span>#${index + 1} ${player.name} (Lvl ${player.level})</span>
      <strong>${player.score} pts</strong>
    `;
    leaderboardContainer.appendChild(item);
  });
}

// Renders tasks out of memory arrays back onto your screen layout
function renderTasksFromMemory() {
  const taskList = document.getElementById('taskList');
  if (!taskList) return;
  taskList.innerHTML = '';

  activeTasksArray.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = `task-item ${task.isDone ? 'task-done' : ''}`;
    li.dataset.index = index;
    
    li.innerHTML = `
      <span>${task.text}</span>
      <button class="done-btn" style="${task.isDone ? 'background-color: #ef4444;' : ''}" onclick="completeTask(this)">
        ${task.isDone ? '🗑️' : '✓'}
      </button>
    `;
    taskList.appendChild(li);
  });
}

function logActivity(message, type) {
  const logContainer = document.getElementById('activityLogList');
  if (!logContainer) return;

  const logItem = document.createElement('div');
  logItem.className = `log-item ${type}`;
  logItem.innerHTML = `<small>[${getCurrentTimeString()}]</small> ${message}`;
  
  logContainer.insertBefore(logItem, logContainer.firstChild);
}

function triggerStrictNotification() {
  const randomMsg = strictMessages[Math.floor(Math.random() * strictMessages.length)];
  logActivity(`⚠️ STRICT SYSTEM: ${randomMsg}`, 'system-warning');
}

// ==========================================
// 4. ACTION FUNCTIONS (USER INTERACTION)
// ==========================================

function addTask() {
  const taskInput = document.getElementById('taskInput');
  if (!taskInput) return;

  const taskText = taskInput.value.trim();
  if (taskText === "") return;

  // Push new task object into data array structure
  activeTasksArray.push({
    text: taskText,
    isDone: false,
    timeAdded: getCurrentTimeString()
  });

  saveTasksToMemory();
  renderTasksFromMemory();
  
  logActivity(`Added task: "${taskText}"`, 'add-action');
  taskInput.value = "";
}

function completeTask(buttonElement) {
  const taskItem = buttonElement.parentElement;
  const index = taskItem.dataset.index;
  const task = activeTasksArray[index];

  // If already checked off, clear permanently out of array registry
  if (task.isDone) {
    logActivity(`Permanently deleted: "${task.text}"`, 'delete-action');
    activeTasksArray.splice(index, 1); // remove from array
    saveTasksToMemory();
    renderTasksFromMemory();
    return;
  }

  // Otherwise change structural values to complete flags
  task.isDone = true;
  const timeCompleted = getCurrentTimeString();

  logActivity(`Completed: "${task.text}" (Added: ${task.timeAdded} ➔ Done: ${timeCompleted})`, 'complete-action');

  saveTasksToMemory();
  renderTasksFromMemory();
  handleRewards(30); 
}

function handleRewards(xpGained) {
  xp += xpGained;
  points += xpGained;
  completedCount += 1;
  currentStreak += 1;

  logActivity(`🔥 Streak incremented to ${currentStreak}! Keep moving.`, 'streak-action');

  const neededXP = getRequiredXP(currentLevel);
  if (xp >= neededXP) {
    xp -= neededXP;
    currentLevel += 1;
    logActivity(`🎉 LEVELED UP to Level ${currentLevel}!`, 'level-action');
    alert(`🎉 LEVEL UP! You reached Level ${currentLevel}. Keep climbing!`);
  }

  saveStatsToMemory();
  updateUI();
}

// ==========================================
// 5. INITIALIZATION & TIMERS
// ==========================================
updateUI();
renderTasksFromMemory(); // Pull items back on screen when opening app
setInterval(triggerStrictNotification, 45000);


