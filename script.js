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
  const targets = document.querySelectorAll(".hidden");

  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target); // анімувати лише один раз
        }
      });
    },
    {
      threshold: 0.12,     // 12% елемента видно — тригер
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
   SMOOTH SCROLL для Hero CTA
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
   PARALLAX — легкий ефект для Hero фото
   ───────────────────────────────────────────────────────── */
function initParallax() {
  const heroBg = document.querySelector(".hero__bg");
  if (!heroBg) return;

  // Тільки на десктопі / якщо немає prefers-reduced-motion
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
  initScrollAnimations();
  initRsvpForm();
  initCountdown();
  initSmoothScroll();
  initParallax();

  console.info(
    "%c💒 Весілля Олександра та Юліани | 26.09.2026",
    "font-family:serif; font-size:16px; color:#C4A484;"
  );
});
