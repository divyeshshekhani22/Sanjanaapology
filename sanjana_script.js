const $ = (id) => document.getElementById(id);

const garden = $("garden");
$("openGarden").addEventListener("click", () => {
  garden.classList.remove("hidden");
  garden.scrollIntoView({ behavior: "smooth", block: "start" });
  $("openGarden").textContent = "Keep reading ♡";
});

document.querySelectorAll(".reason-card").forEach((card) => {
  card.addEventListener("click", () => {
    const isOpening = !card.classList.contains("active");
    card.classList.toggle("active");
    const small = card.querySelector("small");
    const hint = card.querySelector(".tap-hint");

    if (isOpening) {
      small.textContent = card.dataset.reveal || "And I really mean it. 💗";
      if (hint) hint.textContent = "tap to close ♡";
      burstSparklesNear(card);
      playSparkleSound();
    } else {
      small.textContent = card.dataset.initial || small.textContent;
      if (hint) hint.textContent = "tap to unfold ♡";
    }
  });
});

// Gentle falling flower petals made with CSS, no libraries.
const petalBox = $("petals");
function makePetal() {
  const p = document.createElement("span");
  p.className = "petal";
  p.textContent = ["✿", "♡", "❀", "·", "✨"][Math.floor(Math.random() * 5)];
  p.style.left = Math.random() * 100 + "vw";
  p.style.fontSize = (12 + Math.random() * 17) + "px";
  const duration = 7 + Math.random() * 8;
  p.style.animationDuration = duration + "s";
  petalBox.appendChild(p);
  setTimeout(() => p.remove(), duration * 1000);
}
for (let i = 0; i < 12; i++) setTimeout(makePetal, i * 300);
setInterval(makePetal, 850);

// Romantic background music engine using Web Audio API (Low register warm romantic chords & melody)
let audioContext = null;
let soundOn = false;
let musicMasterFilter = null;
let musicMasterGain = null;
let musicLoopTimer = null;
let activeMusicOscs = [];

function initMusicEngine() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (!musicMasterFilter) {
    // Warm low-pass filter to keep notes warm, velvety and eliminate any harsh tinny highs
    musicMasterFilter = audioContext.createBiquadFilter();
    musicMasterFilter.type = "lowpass";
    musicMasterFilter.frequency.setValueAtTime(780, audioContext.currentTime);
    musicMasterFilter.Q.setValueAtTime(1.1, audioContext.currentTime);

    musicMasterGain = audioContext.createGain();
    musicMasterGain.gain.setValueAtTime(0.0001, audioContext.currentTime);

    musicMasterFilter.connect(musicMasterGain);
    musicMasterGain.connect(audioContext.destination);
  }
}

// Low romantic notes progression (Cmaj9 -> Am9 -> Fmaj7 -> G6 / Em7)
const romanticScore = [
  // Measure 1: Cmaj9 (Deep warm bass ~130Hz C3 + soft low harmonics)
  { time: 0.0, freq: 130.81, dur: 3.0, vol: 0.055, isBass: true },
  { time: 0.25, freq: 196.00, dur: 1.6, vol: 0.040 },
  { time: 0.65, freq: 246.94, dur: 1.5, vol: 0.042 },
  { time: 1.10, freq: 293.66, dur: 1.6, vol: 0.045 },
  { time: 1.60, freq: 329.63, dur: 1.8, vol: 0.045 },
  { time: 2.15, freq: 293.66, dur: 1.4, vol: 0.038 },
  { time: 2.60, freq: 246.94, dur: 1.3, vol: 0.035 },

  // Measure 2: Am9 (Deep A2 ~110Hz bass + emotional warm chords)
  { time: 3.2, freq: 110.00, dur: 3.0, vol: 0.055, isBass: true },
  { time: 3.45, freq: 164.81, dur: 1.6, vol: 0.040 },
  { time: 3.85, freq: 196.00, dur: 1.5, vol: 0.042 },
  { time: 4.30, freq: 261.63, dur: 1.6, vol: 0.045 },
  { time: 4.80, freq: 246.94, dur: 1.7, vol: 0.042 },
  { time: 5.30, freq: 220.00, dur: 1.5, vol: 0.040 },
  { time: 5.75, freq: 164.81, dur: 1.3, vol: 0.035 },

  // Measure 3: Fmaj7 (Deep F2 ~87Hz bass + heartfelt melody)
  { time: 6.4, freq: 87.31, dur: 3.0, vol: 0.058, isBass: true },
  { time: 6.65, freq: 130.81, dur: 1.6, vol: 0.040 },
  { time: 7.05, freq: 164.81, dur: 1.5, vol: 0.042 },
  { time: 7.50, freq: 220.00, dur: 1.7, vol: 0.046 },
  { time: 8.00, freq: 196.00, dur: 1.6, vol: 0.042 },
  { time: 8.50, freq: 164.81, dur: 1.4, vol: 0.038 },
  { time: 8.95, freq: 130.81, dur: 1.3, vol: 0.035 },

  // Measure 4: G6 / Em7 (Deep G2 ~98Hz bass + gentle lullaby resolution)
  { time: 9.6, freq: 98.00, dur: 3.0, vol: 0.055, isBass: true },
  { time: 9.85, freq: 146.83, dur: 1.6, vol: 0.040 },
  { time: 10.25, freq: 196.00, dur: 1.5, vol: 0.042 },
  { time: 10.70, freq: 246.94, dur: 1.6, vol: 0.045 },
  { time: 11.20, freq: 293.66, dur: 1.8, vol: 0.045 },
  { time: 11.75, freq: 261.63, dur: 1.4, vol: 0.040 },
  { time: 12.20, freq: 246.94, dur: 1.4, vol: 0.035 }
];

const LOOP_DURATION = 12.8;

function playRomanticNote(note, cycleStart) {
  if (!soundOn || !audioContext) return;
  const startTime = cycleStart + note.time;
  const dur = note.dur;

  const osc1 = audioContext.createOscillator();
  const osc2 = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc1.type = note.isBass ? "sine" : "triangle";
  osc1.frequency.setValueAtTime(note.freq, startTime);

  osc2.type = "sine";
  osc2.frequency.setValueAtTime(note.isBass ? note.freq * 0.5 : note.freq, startTime);

  const attack = note.isBass ? 0.22 : 0.09;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(note.vol, startTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(musicMasterFilter);

  osc1.start(startTime);
  osc2.start(startTime);
  osc1.stop(startTime + dur + 0.1);
  osc2.stop(startTime + dur + 0.1);

  activeMusicOscs.push(osc1, osc2);
  setTimeout(() => {
    activeMusicOscs = activeMusicOscs.filter(o => o !== osc1 && o !== osc2);
  }, (startTime - audioContext.currentTime + dur + 0.2) * 1000);
}

function scheduleRomanticCycle() {
  if (!soundOn || !audioContext) return;
  const now = audioContext.currentTime;
  romanticScore.forEach(note => playRomanticNote(note, now));
  musicLoopTimer = setTimeout(scheduleRomanticCycle, LOOP_DURATION * 1000);
}

function startRomanticMusic() {
  initMusicEngine();
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  musicMasterGain.gain.cancelScheduledValues(audioContext.currentTime);
  musicMasterGain.gain.setValueAtTime(musicMasterGain.gain.value, audioContext.currentTime);
  musicMasterGain.gain.linearRampToValueAtTime(1.0, audioContext.currentTime + 1.2);
  scheduleRomanticCycle();
}

function stopRomanticMusic() {
  clearTimeout(musicLoopTimer);
  if (audioContext && musicMasterGain) {
    musicMasterGain.gain.cancelScheduledValues(audioContext.currentTime);
    musicMasterGain.gain.setValueAtTime(musicMasterGain.gain.value, audioContext.currentTime);
    musicMasterGain.gain.linearRampToValueAtTime(0.0001, audioContext.currentTime + 0.5);
  }
  setTimeout(() => {
    activeMusicOscs.forEach(osc => {
      try { osc.stop(); } catch (_) { }
    });
    activeMusicOscs = [];
  }, 550);
}

$("musicToggle").addEventListener("click", () => {
  soundOn = !soundOn;
  $("musicToggle").textContent = soundOn ? "♪ Soft Sound: on 💖" : "♪ Soft Sound: off";
  $("musicToggle").setAttribute("aria-pressed", String(soundOn));
  if (soundOn) {
    try {
      startRomanticMusic();
    } catch (_) {
      $("musicToggle").textContent = "♪ Music unavailable";
    }
  } else {
    stopRomanticMusic();
  }
});

function playSparkleSound() {
  if (!soundOn || !audioContext) return;
  const freqs = [659.25, 783.99, 1046.50];
  freqs.forEach((freq, idx) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = audioContext.currentTime + idx * 0.07;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.035, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

// Sparkle particle burst around clicked element
function burstSparklesNear(element) {
  const rect = element.getBoundingClientRect();
  for (let i = 0; i < 6; i++) {
    const s = document.createElement("span");
    s.textContent = ["✨", "♡", "🌸", "✦"][i % 4];
    s.style.cssText = `position:fixed;left:${rect.left + rect.width / 2 + (Math.random() - 0.5) * rect.width * 0.8}px;top:${rect.top + rect.height / 2 + (Math.random() - 0.5) * rect.height * 0.8}px;z-index:99;pointer-events:none;font-size:${12 + Math.random() * 12}px;transition:all 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);opacity:1;`;
    document.body.appendChild(s);
    requestAnimationFrame(() => {
      s.style.transform = `translate(${(Math.random() - 0.5) * 80}px, -${30 + Math.random() * 60}px) scale(1.2)`;
      s.style.opacity = "0";
    });
    setTimeout(() => s.remove(), 950);
  }
}

// Moh Maaya: Interactive Whispers Box
const whispers = {
  exhausted: {
    text: "We talked for 1-2 days, I texted too much, and that was my mistake.",
    author: "— Divyesh ♡"
  },
  sharing: {
    text: "I'm sorry for making you uncomfortable.",
    author: "— Divyesh ♡"
  },
  reminder: {
    text: "Give space and not overdo messages.",
    author: "— Divyesh ♡"
  },
  promise: {
    text: "I hope your days are good and stress-free.",
    author: "— Divyesh ♡"
  }
};

const whisperText = $("whisperText");
const whisperDisplay = $("whisperDisplay");
document.querySelectorAll(".mood-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mood-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const moodKey = btn.dataset.mood;
    const moodData = whispers[moodKey];
    if (moodData && whisperText) {
      whisperDisplay.style.opacity = "0.2";
      whisperDisplay.style.transform = "translateY(4px)";
      setTimeout(() => {
        whisperText.textContent = moodData.text;
        const authorEl = whisperDisplay.querySelector(".whisper-author");
        if (authorEl) authorEl.textContent = moodData.author;
        whisperDisplay.style.opacity = "1";
        whisperDisplay.style.transform = "translateY(0)";
        burstSparklesNear(btn);
        playSparkleSound();
      }, 180);
    }
  });
});

// Interactive Talk Cards
document.querySelectorAll(".talk-card").forEach((card) => {
  card.addEventListener("click", () => {
    card.classList.toggle("glowing");
    burstSparklesNear(card);
    playSparkleSound();
  });
});

// Send a starlight into our sky
const sendStarlightBtn = $("sendStarlightBtn");
const starlightFeedback = $("starlightFeedback");
const starlightQuotes = [
  "✨ A starlight rose into the sky. Thank you for reading.",
  "💫 Starlight sent. I hope your day is a good one.",
  "🌟 Lit up the sky a little. I'm really sorry.",
  "♡ One more starlight, for you."
];
let starlightIndex = 0;

if (sendStarlightBtn) {
  sendStarlightBtn.addEventListener("click", (e) => {
    const rect = sendStarlightBtn.getBoundingClientRect();
    spawnRisingStarlight(rect.left + rect.width / 2, rect.top);
    starlightFeedback.textContent = starlightQuotes[starlightIndex % starlightQuotes.length];
    starlightFeedback.classList.add("highlight");
    setTimeout(() => starlightFeedback.classList.remove("highlight"), 1200);
    starlightIndex++;
    playSparkleSound();
  });
}

function spawnRisingStarlight(originX, originY) {
  for (let i = 0; i < 8; i++) {
    const star = document.createElement("span");
    star.className = "rising-star";
    star.textContent = ["✨", "💫", "⭐", "♡", "🌌", "🌸"][i % 6];
    const offsetX = (Math.random() - 0.5) * 140;
    const startX = Math.min(Math.max(originX + offsetX, 15), window.innerWidth - 30);
    star.style.left = startX + "px";
    star.style.top = originY + "px";
    star.style.fontSize = (15 + Math.random() * 16) + "px";
    star.style.animationDuration = (2.2 + Math.random() * 1.4) + "s";
    document.body.appendChild(star);
    setTimeout(() => star.remove(), 3600);
  }
}

function playPoutSound() {
  if (!soundOn || !audioContext) return;
  const notes = [440, 392, 349.23];
  notes.forEach((freq, idx) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audioContext.currentTime + idx * 0.12);
    const t = audioContext.currentTime + idx * 0.12;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.035, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  });
}

function burstDramaticEmojis(element) {
  const rect = element.getBoundingClientRect();
  const emojis = ["🥺", "💔", "🌧️", "😭", "🙈", "🍫", "🩹", "🥀", "👀", "🧸"];
  for (let i = 0; i < 9; i++) {
    const p = document.createElement("span");
    p.className = "dramatic-particle";
    p.textContent = emojis[i % emojis.length];

    const originX = rect.left + rect.width / 2 + (Math.random() - 0.5) * rect.width;
    const originY = rect.top + rect.height / 2;
    p.style.left = `${originX}px`;
    p.style.top = `${originY}px`;

    const txMid = (Math.random() - 0.5) * 90;
    const txEnd = txMid + (Math.random() - 0.5) * 110;
    const rotMid = (Math.random() - 0.5) * 45;
    const rotEnd = (Math.random() - 0.5) * 90;

    p.style.setProperty("--tx-mid", `${txMid}px`);
    p.style.setProperty("--tx-end", `${txEnd}px`);
    p.style.setProperty("--rot-mid", `${rotMid}deg`);
    p.style.setProperty("--rot-end", `${rotEnd}deg`);
    p.style.fontSize = `${18 + Math.random() * 12}px`;

    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2000);
  }
}

let poutClickCount = 0;
const poutReplies = [
  "Haww! 🥺 Aise kaise accha nahi laga? Ab toh double mehnat karunga tumhe khush karne  ke liye! 😤💗",
  "Jhooth bol rahi ho! Thoda sa toh muskurayi na tum screen dekh ke? Pakda gaya! 🙈✨",
  "Chalo koi nahi, kal chocolate khila ke aur lunch break me pura dimaag khake manana padega! 😭🍫",
  "Arey re... Moh Maaya se bach ke kahan jaogi Sanjana? Haar maan lo aur 'Of course' daba do! 😂💗",
  "Ab toh main haar nahi maan raha... jab tak tum 'Of course' na bol do tab tak roz bore karunga! 🌷✨"
];

const poutButtonTexts = [
  "Sach me nahi laga? 🥺",
  "Jhooth mat bolo 🙈",
  "Accha ab maan bhi jao 😭💗",
  "Haaye meri kismat 💔🤣",
  "Ek baar fir soch lo 🥺"
];

const finalCard = $("finalCard");
const finalBouquet = $("finalBouquet");
const yesButton = $("yesButton");
const noButton = $("noButton");
const shyButton = $("shyButton");
const finalReply = $("finalReply");

if (noButton) {
  noButton.addEventListener("click", () => {
    playPoutSound();

    noButton.classList.remove("pout-wobble");
    void noButton.offsetWidth;
    noButton.classList.add("pout-wobble");

    if (finalCard) {
      finalCard.classList.remove("card-pout-shake");
      void finalCard.offsetWidth;
      finalCard.classList.add("card-pout-shake");
    }

    if (finalBouquet) {
      finalBouquet.textContent = poutClickCount % 2 === 0 ? "🥺" : "🥀";
      finalBouquet.classList.remove("bounce");
      void finalBouquet.offsetWidth;
      finalBouquet.classList.add("bounce");
      setTimeout(() => {
        if (finalBouquet.textContent === "🥺" || finalBouquet.textContent === "🥀") {
          finalBouquet.textContent = "🍫💐";
        }
      }, 1600);
    }

    burstDramaticEmojis(noButton);

    if (yesButton) {
      yesButton.classList.add("pulse-attention");
    }

    const replyText = poutReplies[poutClickCount % poutReplies.length];
    const buttonText = poutButtonTexts[poutClickCount % poutButtonTexts.length];

    finalReply.textContent = replyText;
    finalReply.className = "final-reply highlight-pout";
    noButton.textContent = buttonText;

    poutClickCount++;
  });
}

yesButton.addEventListener("click", () => {
  if (poutClickCount > 0) {
    finalReply.textContent = "Thank you, that means a lot. 💗";
  } else {
    finalReply.textContent = "Thank you, that means a lot. 💗";
  }
  finalReply.className = "final-reply highlight-love";
  if (finalBouquet) {
    finalBouquet.textContent = "💐✨";
    finalBouquet.classList.remove("bounce");
    void finalBouquet.offsetWidth;
    finalBouquet.classList.add("bounce");
  }
  if (yesButton) {
    yesButton.classList.remove("pulse-attention");
  }
  if (noButton) {
    noButton.textContent = "Nahi mujhe aacha nahi laga 😤";
  }
  burstHearts();
  playSparkleSound();
});

shyButton.addEventListener("click", () => {
  finalReply.textContent = "Please forgive me 🥺🙏";
  finalReply.className = "final-reply highlight-love";
  if (finalBouquet) {
    finalBouquet.textContent = "💐";
  }
  if (yesButton) {
    yesButton.classList.remove("pulse-attention");
  }
  burstHearts();
  playSparkleSound();
});

function burstHearts() {
  for (let i = 0; i < 22; i++) {
    const h = document.createElement("span");
    h.textContent = ["♡", "💗", "✿", "✨"][i % 4];
    h.style.cssText = `position:fixed;left:${Math.random() * 100}vw;top:${50 + Math.random() * 40}vh;z-index:99;pointer-events:none;font-size:${16 + Math.random() * 22}px;transition:transform 1.4s cubic-bezier(0.2, 0.8, 0.2, 1),opacity 1.4s;`;
    document.body.appendChild(h);
    requestAnimationFrame(() => {
      h.style.transform = `translateY(-${110 + Math.random() * 190}px) rotate(${Math.random() * 120 - 60}deg)`;
      h.style.opacity = "0";
    });
    setTimeout(() => h.remove(), 1500);
  }
}

