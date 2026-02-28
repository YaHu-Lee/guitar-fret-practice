// 吉他指板数据：6弦（索引0是最粗的6弦，索引5是最细的1弦），每根弦空弦到12品的音
const stringNotes = [
    // 6弦 E
    ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E'],
    // 5弦 A
    ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A'],
    // 4弦 D
    ['D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D'],
    // 3弦 G
    ['G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G'],
    // 2弦 B
    ['B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    // 1弦 E
    ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E']
];

// 各大调音阶（自然大调，全全半全全全半）
const keyScales = {
    'C': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    'G': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
    'D': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
    'A': ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
    'E': ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
    'F': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
    'Bb': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
    'Eb': ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D']
};

// 转换升号为对应降号（比如A# = Bb）
const sharpToFlat = {
    'A#': 'Bb',
    'C#': 'Db',
    'D#': 'Eb',
    'F#': 'Gb',
    'G#': 'Ab'
};

// 全局状态
let currentKey = 'C';
let targetNote = 'C';
let totalCount = 0;
let correctCount = 0;
let isAnswering = true;

// DOM元素
const fretboardEl = document.getElementById('guitar-fretboard');
const keySelectEl = document.getElementById('key-select');
const targetNoteEl = document.getElementById('target-note');
const feedbackEl = document.getElementById('feedback');
const totalCountEl = document.getElementById('total-count');
const accuracyEl = document.getElementById('accuracy');
const resetBtnEl = document.getElementById('reset-btn');

// 初始化
function init() {
    renderFretboard();
    generateNewQuestion();
    bindEvents();
}

// 渲染吉他指板
function renderFretboard() {
    fretboardEl.innerHTML = '';
    
    // 添加品记
    const markerFrets = [3, 5, 7, 9, 12];
    markerFrets.forEach(fret => {
        const marker = document.createElement('div');
        marker.className = 'fret-marker' + (fret === 12 ? ' double' : '');
        const fretWidth = 100 / 13; // 12品 + 空弦
        marker.style.left = `${(fret + 0.5) * fretWidth}%`;
        fretboardEl.appendChild(marker);
        if (fret === 12) {
            const marker2 = document.createElement('div');
            marker2.className = 'fret-marker double';
            marker2.style.left = `${(fret + 0.5) * fretWidth}%`;
            fretboardEl.appendChild(marker2);
        }
    });
    
    // 渲染6根弦（从上到下依次是1弦到6弦）
    for (let stringIndex = 5; stringIndex >= 0; stringIndex--) {
        const stringEl = document.createElement('div');
        stringEl.className = 'string';
        
        // 弦线
        const stringLine = document.createElement('div');
        stringLine.className = 'string-line';
        stringEl.appendChild(stringLine);
        
        // 渲染13个品格（0品=空弦到12品）
        for (let fretIndex = 0; fretIndex <= 12; fretIndex++) {
            const fretEl = document.createElement('div');
            fretEl.className = 'fret';
            fretEl.dataset.string = stringIndex;
            fretEl.dataset.fret = fretIndex;
            
            // 点击事件
            fretEl.addEventListener('click', () => handleFretClick(stringIndex, fretIndex));
            
            stringEl.appendChild(fretEl);
        }
        
        fretboardEl.appendChild(stringEl);
    }
}

// 处理品格点击
function handleFretClick(stringIndex, fretIndex) {
    if (!isAnswering) return;
    
    isAnswering = false;
    totalCount++;
    
    const clickedNote = stringNotes[stringIndex][fretIndex];
    // 统一音符格式（升号转降号，匹配调式里的写法）
    const normalizedClickedNote = sharpToFlat[clickedNote] || clickedNote;
    const normalizedTarget = sharpToFlat[targetNote] || targetNote;
    
    if (normalizedClickedNote === normalizedTarget) {
        // 答对了
        correctCount++;
        feedbackEl.textContent = '✅ 正确！';
        feedbackEl.className = 'feedback correct';
        document.querySelector(`.fret[data-string="${stringIndex}"][data-fret="${fretIndex}"]`).classList.add('correct');
    } else {
        // 答错了，显示正确位置
        feedbackEl.textContent = `❌ 错误，正确的${targetNote}音位置已经标出`;
        feedbackEl.className = 'feedback incorrect';
        document.querySelector(`.fret[data-string="${stringIndex}"][data-fret="${fretIndex}"]`).classList.add('incorrect');
        showCorrectNotePositions();
    }
    
    // 更新统计
    updateStats();
    
    // 1.5秒后出新题
    setTimeout(() => {
        clearHighlights();
        generateNewQuestion();
        isAnswering = true;
    }, 1500);
}

// 显示所有正确的音的位置
function showCorrectNotePositions() {
    const normalizedTarget = sharpToFlat[targetNote] || targetNote;
    for (let stringIndex = 0; stringIndex < 6; stringIndex++) {
        for (let fretIndex = 0; fretIndex <= 12; fretIndex++) {
            const note = stringNotes[stringIndex][fretIndex];
            const normalizedNote = sharpToFlat[note] || note;
            if (normalizedNote === normalizedTarget) {
                const fretEl = document.querySelector(`.fret[data-string="${stringIndex}"][data-fret="${fretIndex}"]`);
                const label = document.createElement('div');
                label.className = 'note-label';
                label.textContent = targetNote;
                fretEl.appendChild(label);
            }
        }
    }
}

// 清除高亮和标签
function clearHighlights() {
    document.querySelectorAll('.fret.correct, .fret.incorrect').forEach(el => {
        el.classList.remove('correct', 'incorrect');
    });
    document.querySelectorAll('.note-label').forEach(el => el.remove());
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
}

// 生成新题目
function generateNewQuestion() {
    const scale = keyScales[currentKey];
    // 随机选一个调内音
    targetNote = scale[Math.floor(Math.random() * scale.length)];
    targetNoteEl.textContent = targetNote;
}

// 更新统计
function updateStats() {
    totalCountEl.textContent = totalCount;
    const accuracy = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);
    accuracyEl.textContent = `${accuracy}%`;
}

// 绑定事件
function bindEvents() {
    // 调式切换
    keySelectEl.addEventListener('change', (e) => {
        currentKey = e.target.value;
        clearHighlights();
        generateNewQuestion();
    });
    
    // 重置统计
    resetBtnEl.addEventListener('click', () => {
        totalCount = 0;
        correctCount = 0;
        updateStats();
        clearHighlights();
        generateNewQuestion();
        isAnswering = true;
    });
}

// 启动
init();