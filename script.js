/**
 * script.js — Весілля Олександра та Юліани | 26.09.2026
 * Firebase Firestore v10 (ESM CDN) + Intersection Observer анімації
 *
 * ⚠️  ПЕРЕД ЗАПУСКОМ: Замініть порожні рядки нижче на ваші
 *     дані з Firebase Console → Project Settings → Your apps
 */

import { initializeApp }              from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp }
                                       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ─────────────────────────────────────────────────────────
   🔧 FIREBASE КОНФІГУРАЦІЯ — вставте ваші дані сюди
   ───────────────────────────────────────────────────────── */
const firebaseConfig = {
  apiKey: "AIzaSyCwp1gehKFMI-4HIk1I-0VPhpPWWiqvWqc",
  authDomain: "wedding-invite-28ce7.firebaseapp.com",
  projectId: "wedding-invite-28ce7",
  storageBucket: "wedding-invite-28ce7.firebasestorage.app",
  messagingSenderId: "319019869485",
  appId: "1:319019869485:web:060f548e316a9fe617dfa4",
  measurementId: "G-BNETX83SYT"
};

/* ─────────────────────────────────────────────────────────
   ІНІЦІАЛІЗАЦІЯ FIREBASE
   ───────────────────────────────────────────────────────── */
let db = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.info("✅ Firebase ініціалізовано успішно");
} catch (err) {
  console.warn("⚠️ Firebase не ініціалізовано — перевірте конфіг:", err.message);
}

/* ─────────────────────────────────────────────────────────
   INTERSECTION OBSERVER — scroll анімації
   ───────────────────────────────────────────────────────── */
function initScrollAnimations() {
  // Всі анімаційні класи
  const targets = document.querySelectorAll(
    ".hidden, .hidden--left, .hidden--right, .hidden--scale, .section-divider"
  );

  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;

          // Stagger для timeline items
          if (el.classList.contains("timeline__item")) {
            const items = [...document.querySelectorAll(".timeline__item")];
            const idx = items.indexOf(el);
            el.style.transitionDelay = `${idx * 0.18}s`;
          }

          el.classList.add("show");
          observer.unobserve(el);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -48px 0px",
    }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ─────────────────────────────────────────────────────────
   RSVP ФОРМА
   ───────────────────────────────────────────────────────── */
function initRsvpForm() {
  const form       = document.getElementById("rsvp-form");
  const submitBtn  = document.getElementById("rsvp-submit");
  const successBox = document.getElementById("rsvp-success");
  const successMsg = successBox?.querySelector(".rsvp__success-text");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // ── Валідація ──────────────────────────────────────────
    const nameInput   = form.querySelector("#guest-name");
    const attendRadio = form.querySelector('input[name="attendance"]:checked');

    const guestName  = nameInput.value.trim();
    const attendance = attendRadio ? attendRadio.value : "";

    if (!guestName) {
      showFieldError(nameInput, "Будь ласка, введіть ваше ім'я");
      nameInput.focus();
      return;
    }

    if (!attendance) {
      const radioContainer = form.querySelector('input[name="attendance"]')?.closest('.rsvp__field');
      showFieldError(radioContainer || nameInput, "Будь ласка, оберіть відповідь");
      return;
    }

    const selectedDrinks = Array.from(
      form.querySelectorAll('input[name="drinks"]:checked')
    ).map((cb) => cb.value);

    // ── Стан loading ───────────────────────────────────────
    submitBtn.disabled = true;
    submitBtn.querySelector(".rsvp__btn-text").textContent = "Надсилаємо…";

    try {
      // ── Збереження у Firestore ─────────────────────────
      if (db) {
        await addDoc(collection(db, "guests"), {
          name:       guestName,
          attendance: attendance,          // "yes" | "no"
          drinks:     selectedDrinks,      // ["Коньяк", "Вино", ...]
          submittedAt: serverTimestamp(),
        });
      } else {
        // Fallback якщо Firebase не налаштований — просто чекаємо
        await delay(900);
      }

      // ── Успіх ──────────────────────────────────────────
      form.reset();
      showSuccess(attendance, guestName);

    } catch (error) {
      console.error("Помилка збереження:", error);
      showError("Щось пішло не так. Спробуйте ще раз або зв'яжіться з нами особисто.");
      submitBtn.disabled = false;
      submitBtn.querySelector(".rsvp__btn-text").textContent = "Підтвердити";
    }
  });

  /* ── Helpers ──────────────────────────────────────────── */

  function showSuccess(attendance, name) {
    const firstName = name.split(" ")[0];
    let message;

    if (attendance === "yes") {
      message = `Чудово, ${firstName}! 🥂\nМи так раді, що ви будете з нами!\nДо зустрічі 26 вересня!`;
    } else {
      message = `Дякуємо за відповідь, ${firstName}.\nНам дуже шкода, що ви не зможете приєднатися.\nМи обов'язково збережемо спогади для вас! 💛`;
    }

    successMsg.textContent = message;
    successMsg.style.whiteSpace = "pre-line";
    successBox.hidden = false;
    form.style.display = "none";

    // Плавний скрол до повідомлення
    successBox.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function showError(message) {
    // Видалити попереднє повідомлення про помилку, якщо є
    const existing = form.querySelector(".rsvp__error-msg");
    if (existing) existing.remove();

    const errEl = document.createElement("p");
    errEl.className = "rsvp__error-msg";
    errEl.textContent = message;
    errEl.style.cssText = `
      color: #e8a87c;
      font-size: 0.85rem;
      text-align: center;
      margin-top: 0.5rem;
      font-style: italic;
    `;
    form.appendChild(errEl);

    // Авто-видалення через 5с
    setTimeout(() => errEl.remove(), 5000);
  }

  function showFieldError(input, message) {
    clearFieldError(input);
    input.style.borderColor = "#e8a87c";

    const msg = document.createElement("span");
    msg.className = "rsvp__field-error";
    msg.textContent = message;
    msg.style.cssText = `
      font-size: 0.75rem;
      color: #e8a87c;
      margin-top: 0.2rem;
      display: block;
    `;

    input.parentElement.appendChild(msg);

    input.addEventListener("input", () => clearFieldError(input), { once: true });
    input.addEventListener("change", () => clearFieldError(input), { once: true });
  }

  function clearFieldError(input) {
    input.style.borderColor = "";
    const msg = input.parentElement.querySelector(".rsvp__field-error");
    if (msg) msg.remove();
  }

  function delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }
}

/* ─────────────────────────────────────────────────────────
   COUNTDOWN (додаткова фішка — не в ТЗ, але круто)
   ───────────────────────────────────────────────────────── */
function initCountdown() {
  // Знаходимо Hero і вставляємо лічильник після дати
  const heroDate = document.querySelector(".hero__date");
  if (!heroDate) return;

  const weddingDate = new Date("2026-09-26T14:00:00");
  const countEl = document.createElement("p");
  countEl.className = "hero__countdown";
  countEl.style.cssText = `
    font-family: 'Montserrat', sans-serif;
    font-size: clamp(0.7rem, 2.2vw, 0.85rem);
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #FFFFFF;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9);
    margin-top: 0.75rem;
    margin-bottom: 0;
  `;

  heroDate.insertAdjacentElement("afterend", countEl);

  function tick() {
    const now  = new Date();
    const diff = weddingDate - now;

    if (diff <= 0) {
      countEl.textContent = "🎉 Сьогодні наше весілля!";
      return;
    }

    const days    = Math.floor(diff / 864e5);
    const hours   = Math.floor((diff % 864e5) / 36e5);
    const minutes = Math.floor((diff % 36e5) / 6e4);
    const seconds = Math.floor((diff % 6e4) / 1e3);

    countEl.textContent =
      `До весілля: ${days}д ${pad(hours)}г ${pad(minutes)}хв ${pad(seconds)}с`;
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  tick();
  setInterval(tick, 1000);
}

/* ─────────────────────────────────────────────────────────
   ENVELOPE SCREEN & WAX SEAL (TIKTOK REF)
   ───────────────────────────────────────────────────────── */
function initEnvelopeScreen() {
  const envelopeScreen = document.getElementById("envelope-screen");
  const openBtn        = document.getElementById("open-envelope-btn");
  const musicAudio     = document.getElementById("bg-music");
  const musicBtn       = document.getElementById("music-toggle");

  if (!envelopeScreen || !openBtn) return;

  openBtn.addEventListener("click", () => {
    // 1. Анімація відкриття
    envelopeScreen.classList.add("opened");

    // 2. Спроба автозапуску фонової музики після жесту користувача
    if (musicAudio) {
      musicAudio.volume = 0.7;
      musicAudio.load();
      const playPromise = musicAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (musicBtn) musicBtn.classList.add("playing");
        }).catch((err) => {
          console.warn("Audio autoplay error:", err);
        });
      }
    }

    // 3. Видалення з DOM через 1с після анімації
    setTimeout(() => {
      envelopeScreen.style.display = "none";
    }, 1000);
  });
}

/* ─────────────────────────────────────────────────────────
   MUSIC PLAYER
   ───────────────────────────────────────────────────────── */
function initMusicPlayer() {
  const musicBtn   = document.getElementById("music-toggle");
  const musicAudio = document.getElementById("bg-music");

  if (!musicBtn || !musicAudio) return;

  musicBtn.addEventListener("click", () => {
    if (musicAudio.paused) {
      musicAudio.volume = 0.7;
      const playPromise = musicAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          musicBtn.classList.add("playing");
        }).catch((err) => {
          console.error("Audio play failed:", err);
        });
      }
    } else {
      musicAudio.pause();
      musicBtn.classList.remove("playing");
    }
  });
}

/* ─────────────────────────────────────────────────────────
   CONSTELLATION CANVAS (cover screen stars)
   ───────────────────────────────────────────────────────── */
function initConstellationCanvas() {
  const canvas = document.getElementById("constellation-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  // Stars
  const starCount = Math.min(Math.floor(W / 8), 140);
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.4 + 0.3,
    baseOpacity: Math.random() * 0.5 + 0.15,
    opacity: 0,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.0008 + 0.0004,
    dx: (Math.random() - 0.5) * 0.06,
    dy: (Math.random() - 0.5) * 0.04,
  }));

  // Connection lines between nearby stars
  const MAX_DIST = 120;

  let running = true;

  function draw(now) {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);

    // Update & draw stars
    stars.forEach((s) => {
      s.x += s.dx;
      s.y += s.dy;
      if (s.x < 0) s.x = W;
      if (s.x > W) s.x = 0;
      if (s.y < 0) s.y = H;
      if (s.y > H) s.y = 0;

      s.opacity = s.baseOpacity * (0.5 + 0.5 * Math.sin(now * s.speed + s.phase));

      const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2.5);
      grd.addColorStop(0, `rgba(255, 240, 180, ${s.opacity})`);
      grd.addColorStop(1, `rgba(201, 168, 76, 0)`);

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.shadowBlur = 6;
      ctx.shadowColor = `rgba(220, 180, 80, ${s.opacity * 0.8})`;
      ctx.fill();
    });

    // Constellation lines
    ctx.shadowBlur = 0;
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const dx = stars[i].x - stars[j].x;
        const dy = stars[i].y - stars[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.06;
          ctx.beginPath();
          ctx.moveTo(stars[i].x, stars[i].y);
          ctx.lineTo(stars[j].x, stars[j].y);
          ctx.strokeStyle = `rgba(201, 168, 76, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  // Stop rendering once cover screen is dismissed
  document.getElementById("open-envelope-btn")?.addEventListener("click", () => {
    setTimeout(() => { running = false; }, 1500);
  }, { once: true });

  requestAnimationFrame(draw);
}

/* ─────────────────────────────────────────────────────────
   SMOOTH SCROLL
   ───────────────────────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

/* ─────────────────────────────────────────────────────────
   ADD TO CALENDAR (.ICS / GOOGLE CALENDAR)
   ───────────────────────────────────────────────────────── */
function initCalendarButton() {
  const calBtn = document.getElementById("add-to-calendar-btn");
  if (!calBtn) return;

  calBtn.addEventListener("click", () => {
    const title       = "Весілля Олександра та Юліани 💒";
    const details     = "Святкування весілля Олександра та Юліани у ресторані «ФАЗАН»!";
    const location    = "Ресторан «ФАЗАН», Балаклея, вул. Миру, 291";
    const startDate   = "20260926T140000";
    const endDate     = "20260926T230000";

    // Google Calendar URL
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;

    window.open(googleUrl, "_blank");
  });
}

/* ─────────────────────────────────────────────────────────
   3D CARD TILT (mouse parallax)
   ───────────────────────────────────────────────────────── */
function init3DEnvelopeTilt() {
  const wrapper = document.querySelector(".envelope-screen");
  const card    = document.querySelector(".envelope");
  if (!wrapper || !card) return;

  let animFrame;
  let targetRX = 0, targetRY = 0;
  let currentRX = 0, currentRY = 0;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animate() {
    currentRX = lerp(currentRX, targetRX, 0.08);
    currentRY = lerp(currentRY, targetRY, 0.08);
    card.style.transform = `rotateX(${currentRX}deg) rotateY(${currentRY}deg) scale(1.015)`;
    animFrame = requestAnimationFrame(animate);
  }

  function handleMove(e) {
    const rect = card.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - (rect.left + rect.width  / 2);
    const y = clientY - (rect.top  + rect.height / 2);
    targetRX = -(y / (rect.height / 2)) * 10;
    targetRY =  (x / (rect.width  / 2)) * 10;
  }

  function handleReset() {
    targetRX = 0;
    targetRY = 0;
  }

  // Start smooth loop
  animate();

  wrapper.addEventListener("mousemove",  handleMove);
  wrapper.addEventListener("mouseleave", handleReset);
  wrapper.addEventListener("touchmove",  handleMove, { passive: true });
  wrapper.addEventListener("touchend",   handleReset);

  // Cancel on close
  document.getElementById("open-envelope-btn")?.addEventListener("click", () => {
    cancelAnimationFrame(animFrame);
  }, { once: true });
}

/* ─────────────────────────────────────────────────────────
   PARALLAX
   ───────────────────────────────────────────────────────── */
function initParallax() {
  const heroBg = document.querySelector(".hero__bg");
  if (!heroBg) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(max-width: 768px)").matches) return;

  let ticking = false;

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const heroH   = heroBg.closest(".hero")?.offsetHeight ?? window.innerHeight;

        if (scrollY <= heroH) {
          heroBg.style.transform = `translateY(${scrollY * 0.25}px) scale(1.04)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ─────────────────────────────────────────────────────────
   ІНІЦІАЛІЗАЦІЯ
   ───────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  initEnvelopeScreen();
  initMusicPlayer();
  initConstellationCanvas();
  initCalendarButton();
  init3DEnvelopeTilt();

  initScrollAnimations();
  initRsvpForm();
  initCountdown();
  initSmoothScroll();
  initParallax();

  console.info(
    "%c💒 Весілля Олександра та Юліани | 26.09.2026 — MAX LUXE EDITION",
    "font-family:serif; font-size:16px; color:#C4A484;"
  );
});
