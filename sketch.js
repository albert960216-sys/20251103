let table;
let questions = [];
let picked = [];
let current = 0;
let total = 3;
let answered = false;
let userAnswer = null;
let score = 0;
let choiceRects = [];
let nextRect = null;
let confetti = [];
let explosions = [];
let finished = false;
let started = false; // 是否已開始測驗（顯示開始封面）
let startRect = null;

function preload() {
  // 讀取 CSV 題庫 (需與 index.html 同目錄)
  table = loadTable('questions.csv', 'csv', 'header');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('Noto Sans');
  if (!table) {
    console.error('無法載入 questions.csv');
  }

  // 轉成物件陣列
  for (let r = 0; r < table.getRowCount(); r++) {
    const row = table.getRow(r);
    questions.push({
      id: row.get('id'),
      question: row.get('question'),
      A: row.get('A'),
      B: row.get('B'),
      C: row.get('C'),
      D: row.get('D'),
      answer: row.get('answer'),
      feedback: row.get('feedback')
    });
  }

  // 隨機打散並擷取前 total 題
  shuffle(questions, true);
  picked = questions.slice(0, total);

  // 設定選項按鈕位置（使用相對寬高，方便在 windowResized 時重新計算）
  layoutRects();
}

function layoutRects() {
  choiceRects = [];
  const marginX = width * 0.12;
  const btnW = width * 0.76;
  const startY = height * 0.4;
  const h = Math.min(56, height * 0.08);
  const gap = h * 0.25;
  for (let i = 0; i < 4; i++) {
    choiceRects.push({
      x: marginX,
      y: startY + i * (h + gap),
      w: btnW,
      h: h
    });
  }

  nextRect = { x: width - Math.min(220, width * 0.22), y: height - Math.min(90, height * 0.12), w: Math.min(180, width * 0.18), h: Math.min(56, height * 0.08) };

  // start button rect (centered)
  const sw = Math.min(280, width * 0.28);
  const sh = Math.min(72, height * 0.12);
  startRect = { x: width / 2 - sw / 2, y: height * 0.45 - sh / 2, w: sw, h: sh };
}

function draw() {
  background(28, 42, 68);

  // 若尚未開始，顯示開始封面
  if (!started) {
    drawStartScreen();
    return;
  }

  // 標題與進度
  fill(255);
  noStroke();
  textSize(Math.min(24, Math.max(16, width * 0.02)));
  textAlign(LEFT, CENTER);
  text('互動小測驗', 30, 40);
  textSize(Math.min(18, Math.max(12, width * 0.015)));
  text(`題目 ${current + 1} / ${total}`, 30, 70);

  if (!picked || picked.length === 0) {
    textSize(16);
    text('題庫載入失敗或題目不足。請確認 questions.csv 在同一目錄。', 30, 120);
    return;
  }

  if (finished) {
    showResult();
    // 若全對顯示爆炸動畫，否則顯示 confetti
    if (score === total) {
      runExplosions();
      // 持續產生新的爆炸
      if (frameCount % 30 === 0 && explosions.length < 10) {
        createExplosion(random(width), random(height));
      }
    } else {
      runConfetti();
    }
    return;
  }

  const q = picked[current];

  // 題目區塊（相對位置）
  const qMargin = width * 0.05;
  const qY = height * 0.12;
  const qH = height * 0.14;
  fill(240);
  stroke(200);
  rect(qMargin, qY, width - qMargin * 2, qH, 8);
  noStroke();
  fill(20);
  textSize(Math.max(16, height * 0.025));
  textAlign(LEFT, TOP);
  text(q.question, qMargin + 20, qY + 8, width - qMargin * 2 - 40, qH + 40);

  // 選項
  const opts = ['A', 'B', 'C', 'D'];
  for (let i = 0; i < opts.length; i++) {
    const r = choiceRects[i];
    if (answered) {
      // 已回答，顯示正確或錯誤顏色
      if (opts[i] === q.answer) {
        fill(80, 200, 120);
      } else if (userAnswer === opts[i]) {
        fill(240, 80, 80);
      } else {
        fill(255);
      }
    } else {
      // hover 效果
      if (mouseX > r.x && mouseX < r.x + r.w && mouseY > r.y && mouseY < r.y + r.h) {
        fill(200);
      } else {
        fill(255);
      }
    }

    stroke(180);
    rect(r.x, r.y, r.w, r.h, 6);
    noStroke();
    fill(20);
    textSize(Math.min(20, Math.max(14, width * 0.016)));
    textAlign(LEFT, CENTER);
    text(`${opts[i]}. ${q[opts[i]]}`, r.x + 16, r.y + r.h / 2);
  }

  // 已回答顯示回饋與下一步按鈕
  if (answered) {
    fill(255);
    textSize(Math.max(14, height * 0.02));
    textAlign(LEFT, TOP);
    // 把回饋顯示在選項區塊下方，避免被下一步按鈕或畫面邊緣擋住
    let last = choiceRects[choiceRects.length - 1];
    let feedbackY = last.y + last.h + Math.max(12, height * 0.02);
    // 若回饋超出畫面底部，則把回饋置於下一題按鈕上方
    const maxFeedbackY = nextRect.y - Math.max(8, height * 0.01);
    if (feedbackY > maxFeedbackY) feedbackY = Math.max(60, maxFeedbackY - 40);
    text(q.feedback, qMargin + 20, feedbackY);

    // 下一題或結束按鈕
    drawButton(nextRect.x, nextRect.y, nextRect.w, nextRect.h, current < total - 1 ? '下一題' : '查看成績');
  }
}

function drawButton(x, y, w, h, label) {
  if (mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h) {
    fill(255, 200, 0);
  } else {
    fill(255, 220, 80);
  }
  stroke(180);
  rect(x, y, w, h, 8);
  noStroke();
  fill(30);
  textSize(Math.min(20, Math.max(14, width * 0.016)));
  textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2);
}

function mousePressed() {
  // 如果尚未開始，檢查開始按鈕
  if (!started) {
    if (mouseX > startRect.x && mouseX < startRect.x + startRect.w && mouseY > startRect.y && mouseY < startRect.y + startRect.h) {
      // 開始測驗：重排題庫並初始化
      shuffle(questions, true);
      picked = questions.slice(0, total);
      current = 0;
      answered = false;
      userAnswer = null;
      score = 0;
      confetti = [];
      fireworks = [];
      finished = false;
      started = true;
    }
    return;
  }
  if (finished) {
    // 在成績頁面點擊可重試
    restartIfClicked(mouseX, mouseY);
    return;
  }

  if (!answered) {
    // 檢查是否點選選項
    const opts = ['A', 'B', 'C', 'D'];
    for (let i = 0; i < choiceRects.length; i++) {
      const r = choiceRects[i];
      if (mouseX > r.x && mouseX < r.x + r.w && mouseY > r.y && mouseY < r.y + r.h) {
        userAnswer = opts[i];
        answered = true;
        // 檢查對錯
        if (userAnswer === picked[current].answer) {
          score++;
        }
      }
    }
  } else {
    // 如果已回答，檢查 next 按鈕
    if (mouseX > nextRect.x && mouseX < nextRect.x + nextRect.w && mouseY > nextRect.y && mouseY < nextRect.y + nextRect.h) {
      // 移到下一題或結束
      current++;
      if (current >= total) {
          finished = true;
          // 如果全部答對就產生爆炸效果，否則 confetti
          if (score === total) {
            // 在不同位置產生多個爆炸
            for (let i = 0; i < 5; i++) {
              createExplosion(random(width), random(height));
            }
          } else {
            for (let i = 0; i < 120; i++) confetti.push(new Confetti());
          }
        } else {
        answered = false;
        userAnswer = null;
      }
    }
  }
}

function showResult() {
  background(12, 24, 44);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(Math.min(36, Math.max(22, Math.min(width * 0.035, height * 0.05))));
  text('測驗結果', width / 2, height * 0.16);

  // 回饋語
  let msg = '';
  if (score === total) {
    msg = '太棒了！你全對了！';
  } else if (score >= Math.ceil(total * 0.6)) {
    msg = '不錯，繼續加油！';
  } else {
    msg = '再接再厲，多練習會更好！';
  }
  textSize(Math.min(28, Math.max(18, Math.min(width * 0.025, height * 0.035))));
  text(msg, width / 2, height * 0.22);

  textSize(Math.min(28, Math.max(18, Math.min(width * 0.025, height * 0.035))));
  text(`成績： ${score} / ${total}`, width / 2, height * 0.28);

  // 顯示重試按鈕
  const rx = width / 2 - Math.min(100, width * 0.12);
  const ry = height * 0.32;
  drawButton(rx, ry, Math.min(200, width * 0.24), Math.min(64, height * 0.1), '再做一次');

  // 顯示答題摘要（簡短）
  textSize(Math.min(20, Math.max(12, Math.min(width * 0.016, height * 0.025))));
  textAlign(LEFT, TOP);
  let y = height * 0.48;
  const left = width * 0.1;
  for (let i = 0; i < picked.length; i++) {
    const p = picked[i];
    text(`${i + 1}. ${p.question} -> 答案：${p.answer}`, left, y);
    y += Math.min(28, height * 0.05);
  }
}

function restartIfClicked(mx, my) {
  const rx = width / 2 - Math.min(100, width * 0.12);
  const ry = height * 0.32;
  const rw = Math.min(200, width * 0.24);
  const rh = Math.min(64, height * 0.1);
  if (mx > rx && mx < rx + rw && my > ry && my < ry + rh) {
    // 重設狀態
    shuffle(questions, true);
    picked = questions.slice(0, total);
    current = 0;
    answered = false;
    userAnswer = null;
    score = 0;
    confetti = [];
    finished = false;
    // 回到開始畫面，需要點選開始才能進入
    started = false;
  }
}

function drawStartScreen() {
  background(18, 30, 56);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(Math.min(40, Math.max(24, Math.min(width * 0.04, height * 0.06))));
  text('歡迎來到互動小測驗', width / 2, height * 0.22);

  textSize(Math.min(24, Math.max(14, Math.min(width * 0.02, height * 0.03))));
  text('點選下面的「開始測驗」按鈕來進行三題隨機出題的測驗。', width / 2, height * 0.32);

  // draw start button
  drawButton(startRect.x, startRect.y, startRect.w, startRect.h, '開始測驗');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  layoutRects();
}

function runConfetti() {
  for (let i = confetti.length - 1; i >= 0; i--) {
    const c = confetti[i];
    c.update();
    c.draw();
    if (c.done) confetti.splice(i, 1);
  }
}

class Confetti {
  constructor() {
    this.x = random(width);
    this.y = random(-200, -10);
    this.size = random(4, 10);
    this.col = color(random(50, 255), random(50, 255), random(50, 255));
    this.speed = random(1, 4);
    this.angle = random(TWO_PI);
    this.spin = random(-0.1, 0.1);
    this.done = false;
  }

  update() {
    this.y += this.speed;
    this.angle += this.spin;
    if (this.y > height + 50) this.done = true;
  }

  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    noStroke();
    fill(this.col);
    rect(-this.size / 2, -this.size / 2, this.size, this.size / 2);
    pop();
  }
}

// 爆炸效果
class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.particles = [];
    this.age = 0;
    this.done = false;
    this.color = color(random(150, 255), random(150, 255), random(100, 255));
    
    // 產生爆炸粒子
    const particleCount = floor(random(40, 80));
    for (let i = 0; i < particleCount; i++) {
      const angle = random(TWO_PI);
      const speed = random(2, 8);
      const size = random(2, 6);
      this.particles.push({
        x: 0,
        y: 0,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed,
        size: size,
        alpha: 255,
        decay: random(0.02, 0.04)
      });
    }
  }

  update() {
    // 更新所有粒子
    let allDone = true;
    for (const p of this.particles) {
      // 加入重力效果
      p.vy += 0.1;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha = max(0, p.alpha - p.decay * 255);
      if (p.alpha > 0) {
        allDone = false;
      }
    }
    this.age++;
    this.done = allDone;
  } 

  draw() {
    push();
    translate(this.x, this.y);
    noStroke();
    for (const p of this.particles) {
      const c = color(red(this.color), green(this.color), blue(this.color), p.alpha);
      fill(c);
      circle(p.x, p.y, p.size);
    }
    pop();
  }
}

function createExplosion(x, y) {
  if (explosions.length < 20) { // 限制最大同時存在的爆炸數
    explosions.push(new Explosion(x, y));
  }
}

function runExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const e = explosions[i];
    e.update();
    e.draw();
    if (e.done) explosions.splice(i, 1);
  }
}

