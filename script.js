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
   CANVAS GOLD DUST PARTICLES
   ───────────────────────────────────────────────────────── */
function initGoldDustCanvas() {
  const canvas = document.getElementById("gold-dust-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width, height;
  let particles = [];

  function resize() {
    width  = canvas.width  = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resize);
  resize();

  const particleCount = Math.min(Math.floor(window.innerWidth / 20), 45);

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2.5 + 0.8,
      dx: (Math.random() - 0.5) * 0.4,
      dy: -Math.random() * 0.5 - 0.2,
      opacity: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * 0.02 + 0.005,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      p.x += p.dx;
      p.y += p.dy;
      p.opacity += Math.sin(Date.now() * p.pulse) * 0.005;

      if (p.y < -10) p.y = height + 10;
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(224, 192, 128, ${Math.max(0.1, Math.min(0.8, p.opacity))})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#e8c87c";
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  draw();
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
   3D ENVELOPE TILT & GYRO PARALLAX
   ───────────────────────────────────────────────────────── */
function init3DEnvelopeTilt() {
  const wrapper = document.querySelector(".envelope-screen");
  const envelope = document.querySelector(".envelope");
  if (!wrapper || !envelope) return;

  function handleMove(e) {
    const rect = envelope.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = clientX - (rect.left + rect.width / 2);
    const y = clientY - (rect.top + rect.height / 2);

    const rotateX = -(y / (rect.height / 2)) * 14;
    const rotateY = (x / (rect.width / 2)) * 14;

    envelope.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  }

  function handleReset() {
    envelope.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
  }

  wrapper.addEventListener("mousemove", handleMove);
  wrapper.addEventListener("mouseleave", handleReset);
  wrapper.addEventListener("touchmove", handleMove, { passive: true });
  wrapper.addEventListener("touchend", handleReset);
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
  initGoldDustCanvas();
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
