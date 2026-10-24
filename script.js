// Массив репозиториев (подгружается динамически с GitHub)
let projectsData = [];

let audioEnabled = false;
let audioCtx = null;

function toggleAudio() {
    audioEnabled = !audioEnabled;
    const icon = document.getElementById('audioIcon');
    const btn = document.getElementById('audioBtn');
    
    if (audioEnabled) {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        icon.className = "fa-solid fa-volume-high text-cyber-neon";
        btn.classList.add('border-cyber-neon');
    } else {
        icon.className = "fa-solid fa-volume-xmark text-cyber-muted";
        btn.classList.remove('border-cyber-neon');
    }
}

function playCyberSound(type) {
    if (!audioEnabled || !audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        
        osc.type = type === 'click' ? 'sine' : 'square';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } catch (e) { console.error(e); }
}

const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let isMatrixMode = false;
let matrixDrops = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const columns = Math.floor(canvas.width / 20);
    matrixDrops = Array(columns).fill(1);
}

function drawCanvasBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (isMatrixMode) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffe600';
        ctx.font = '14px monospace';
        for (let i = 0; i < matrixDrops.length; i++) {
            const text = String.fromCharCode(0x30A0 + Math.random() * 96);
            ctx.fillText(text, i * 20, matrixDrops[i] * 20);
            if (matrixDrops[i] * 20 > canvas.height && Math.random() > 0.975) matrixDrops[i] = 0;
            matrixDrops[i]++;
        }
    } else {
        ctx.strokeStyle = 'rgba(31, 41, 61, 0.25)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
    }
    requestAnimationFrame(drawCanvasBackground);
}

function switchView(viewName) {
    playCyberSound('click');
    document.querySelectorAll('.view-panel').forEach(panel => panel.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('text-cyber-neon');
        link.classList.add('text-cyber-muted');
    });

    const activeView = document.getElementById(`view-${viewName}`);
    const activeNav = document.getElementById(`nav-${viewName}`);
    if (activeView) activeView.classList.remove('hidden');
    if (activeNav) {
        activeNav.classList.remove('text-cyber-muted');
        activeNav.classList.add('text-cyber-neon');
    }
}

// Получение реальных данных с GitHub API
async function fetchGitHubData() {
    const username = 'b0o0q';
    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
        if (!response.ok) throw new Error('Ошибка загрузки данных с GitHub');
        
        const repos = await response.json();
        
        projectsData = repos.map(repo => ({
            id: repo.name,
            name: `${username}/${repo.name}`,
            desc: repo.description || "Описание отсутствует",
            lang: repo.language || "Plain Text",
            langColor: getLanguageColor(repo.language),
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            pinned: !repo.fork,
            tags: [repo.language].filter(Boolean),
            url: repo.html_url
        }));

        renderPinnedProjects();
        renderAllProjects();
    } catch (error) {
        console.error('Ошибка GitHub API:', error);
    }
}

function getLanguageColor(lang) {
    const colors = {
        'JavaScript': '#f1e05a',
        'TypeScript': '#3178c6',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'Python': '#3572A5',
        'Rust': '#dea584',
        'Go': '#00ADD8',
        'C++': '#f34b7d'
    };
    return colors[lang] || '#8b949e';
}

function renderPinnedProjects() {
    const container = document.getElementById('pinnedProjectsContainer');
    if (!container) return;
    const pinned = projectsData.slice(0, 4);
    if (pinned.length === 0) {
        container.innerHTML = `<p class="text-xs font-mono text-cyber-muted">Загрузка репозиториев или нет данных...</p>`;
        return;
    }
    container.innerHTML = pinned.map(repo => `
        <a href="${repo.url}" target="_blank" class="cyber-card rounded-xl p-5 flex flex-col justify-between block hover:no-underline">
            <div>
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-mono font-bold text-cyber-neon">${repo.name}</span>
                </div>
                <p class="text-xs text-cyber-muted leading-relaxed mb-4">${repo.desc}</p>
            </div>
            <div class="flex items-center justify-between text-xs font-mono text-cyber-muted pt-3 border-t border-cyber-border">
                <span style="color: ${repo.langColor}">${repo.lang}</span>
                <span>⭐ ${repo.stars}</span>
            </div>
        </a>
    `).join('');
}

function renderAllProjects(data = projectsData) {
    const container = document.getElementById('allProjectsContainer');
    if (!container) return;
    container.innerHTML = data.map(repo => `
        <a href="${repo.url}" target="_blank" class="cyber-card rounded-xl p-5 flex flex-col justify-between block hover:no-underline">
            <div>
                <span class="text-sm font-mono font-bold text-cyber-neon">${repo.name}</span>
                <p class="text-xs text-cyber-muted mt-2">${repo.desc}</p>
            </div>
            <div class="flex items-center justify-between text-xs font-mono text-cyber-muted mt-4">
                <span style="color: ${repo.langColor}">${repo.lang}</span>
                <span>⭐ ${repo.stars}</span>
            </div>
        </a>
    `).join('');
}

function filterProjects() {
    const query = document.getElementById('projectSearchInput').value.toLowerCase();
    const filtered = projectsData.filter(repo => repo.name.toLowerCase().includes(query) || repo.desc.toLowerCase().includes(query));
    renderAllProjects(filtered);
}

// Генерация графика активности с реального GitHub аккаунта
function generateHeatmap() {
    const grid = document.getElementById('heatmapGrid');
    if (!grid) return;
    grid.innerHTML = `
        <img src="https://ghchart.rshah.org/ffe600/b0o0q"
             alt="График коммитов b0o0q"
             class="commit-heatmap filter drop-shadow-[0_0_8px_rgba(255,230,0,0.2)]">
    `;
}

const cliInput = document.getElementById('cliInput');
const terminalLog = document.getElementById('terminalLog');

if (cliInput) {
    cliInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') executeCommand();
    });
}

function focusTerminal() {
    if (cliInput) setTimeout(() => cliInput.focus(), 100);
}

// Вспомогательная функция для автоматического сканирования папки downloads через сервер
async function getDownloadsFiles() {
    try {
        const response = await fetch('downloads/');
        if (!response.ok) throw new Error('Не удалось прочитать папку downloads');
        const html = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = doc.querySelectorAll('a');
        
        let files = [];
        links.forEach(link => {
            let href = link.getAttribute('href');
            if (href && href !== '../' && href !== './' && !href.endsWith('/')) {
                try { href = decodeURIComponent(href); } catch(e) {}
                let fileName = href.split('/').pop();
                if (fileName) files.push(fileName);
            }
        });
        return files;
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function executeCommand() {
    const fullCmd = cliInput.value.trim();
    const cmdLower = fullCmd.toLowerCase();
    if (!fullCmd) return;
    
    playCyberSound('click');
    terminalLog.innerHTML += `<div>b0o0q@core:~$ ${escapeHtml(fullCmd)}</div>`;
    cliInput.value = '';

    if (cmdLower === 'help') {
        terminalLog.innerHTML += `<div class="text-cyber-neon">Доступно: projects, matrix, sudo install &lt;пакет&gt;, clear</div>`;
    } else if (cmdLower === 'projects') {
        terminalLog.innerHTML += `<div class="text-cyber-cyan">[+] Сканирование директории /downloads...</div>`;
        terminalLog.scrollTop = terminalLog.scrollHeight;

        const files = await getDownloadsFiles();
        
        if (files.length === 0) {
            terminalLog.innerHTML += `<div class="text-cyber-muted">Папка downloads пуста или сервер не разрешает просмотр директории.</div>`;
        } else {
            terminalLog.innerHTML += `<div class="text-cyber-cyan">[+] Доступные пакеты:</div>`;
            files.forEach(file => {
                const nameWithoutExt = file.replace(/\.[^/.]+$/, "");
                terminalLog.innerHTML += `<div class="text-cyber-neon pl-4">- ${escapeHtml(nameWithoutExt)}</div>`;
            });
        }
    } else if (cmdLower === 'matrix') {
        isMatrixMode = !isMatrixMode;
        terminalLog.innerHTML += `<div class="text-cyber-neon">Matrix Mode: ${isMatrixMode}</div>`;
    } else if (cmdLower.startsWith('sudo install')) {
        let inputName = fullCmd.replace(/^sudo\s+install\s*/i, '').trim();
        if (!inputName) {
            terminalLog.innerHTML += `<div class="text-yellow-400">Ошибка: не указано имя пакета. Пример: sudo install test</div>`;
            terminalLog.scrollTop = terminalLog.scrollHeight;
            return;
        }

        terminalLog.innerHTML += `<div class="text-cyber-cyan">[+] Запрос прав суперпользователя (sudo)...</div>`;
        terminalLog.innerHTML += `<div class="text-cyber-cyan">[+] Поиск пакета "${escapeHtml(inputName)}" в директории...</div>`;
        terminalLog.scrollTop = terminalLog.scrollHeight;

        const files = await getDownloadsFiles();

        setTimeout(() => {
            let matchedFile = files.find(f => {
                let nameOnly = f.replace(/\.[^/.]+$/, "").toLowerCase();
                return nameOnly === inputName.toLowerCase();
            });

            if (!matchedFile) {
                matchedFile = inputName.includes('.') ? inputName : inputName + '.zip';
            }

            const fileUrl = `downloads/${matchedFile}`;

            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = matchedFile;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            terminalLog.innerHTML += `<div class="text-cyber-neon">[✓] Успешно: файл "${escapeHtml(matchedFile)}" передан на скачивание!</div>`;
            terminalLog.scrollTop = terminalLog.scrollHeight;
        }, 500);

    } else if (cmdLower === 'clear') {
        terminalLog.innerHTML = '';
    } else {
        terminalLog.innerHTML += `<div class="text-yellow-400">Команда не найдена. Введите 'help' для справки.</div>`;
    }
    terminalLog.scrollTop = terminalLog.scrollHeight;
}

// Вспомогательная функция для безопасного вывода текста в терминал
function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function setTheme(themeName) {
    playCyberSound('beep');
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    if (themeName !== 'neon') document.body.classList.add(`theme-${themeName}`);
}

window.onload = function() {
    resizeCanvas();
    drawCanvasBackground();
    fetchGitHubData();
    generateHeatmap();
    window.addEventListener('resize', resizeCanvas);
};
