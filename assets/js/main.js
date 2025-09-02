// YAHIMDI CAR LUXURY — Interactions
(function () {
  // Configure your inbox to receive booking requests
  const COMPANY_EMAIL = "luxryyahamadi@gmail.com"; // booking recipient inbox
  const $ = (q, s = document) => s.querySelector(q);
  const $$ = (q, s = document) => Array.from(s.querySelectorAll(q));

  // Mobile navigation
  const navToggle = $(".nav-toggle");
  const nav = $("#nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    // Close on link click
    $$("#nav a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));
  }

  // Smooth anchor scroll
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id.length <= 1) return;
    const el = $(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  // Reveal on scroll
  const toReveal = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    toReveal.forEach((el) => io.observe(el));
  } else {
    // Fallback
    toReveal.forEach((el) => el.classList.add("visible"));
  }

  // Image skeletons: mark containers loaded when images are ready
  const skeletons = $$(".skeleton");
  skeletons.forEach((wrap) => {
    const img = wrap.querySelector("img");
    if (!img) return;
    const done = () => wrap.classList.add("loaded");
    if (img.complete && img.naturalWidth > 0) {
      done();
    } else {
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
      if (img.decode) { img.decode().then(done).catch(() => {}); }
    }
  });

  // Booking form (front-end validation only)
  const form = $(".booking-form");
  if (form) {
    // Date picker enhancements
    const startInput = form.querySelector('input[name="start"]');
    const endInput = form.querySelector('input[name="end"]');
    const durationHint = document.getElementById('duration-hint');

    const toISO = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    const today = new Date();
    today.setHours(0,0,0,0);
    const todayISO = toISO(today);
    if (startInput) startInput.min = todayISO;
    if (endInput) endInput.min = todayISO;

    const updateEndMin = () => {
      if (!startInput || !endInput) return;
      const s = startInput.value || todayISO;
      endInput.min = s;
      if (endInput.value && endInput.value < s) {
        endInput.value = s;
      }
      updateDuration();
    };

    const updateDuration = () => {
      if (!durationHint || !startInput || !endInput) return;
      const sv = startInput.value;
      const ev = endInput.value;
      if (sv && ev) {
        const sd = new Date(sv);
        const ed = new Date(ev);
        const ms = ed - sd;
        if (ms >= 0) {
          const days = Math.floor(ms / 86400000) + 1; // inclusive
          durationHint.textContent = days === 1 ? 'Total: 1 day' : `Total: ${days} days`;
        } else {
          durationHint.textContent = 'Please choose a return date on or after pickup.';
        }
      } else {
        durationHint.textContent = '';
      }
    };

    if (startInput) startInput.addEventListener('change', updateEndMin);
    if (endInput) endInput.addEventListener('change', updateDuration);
    // Initialize
    updateEndMin();

    const status = $(".form-status", form);
    const setStatus = (msg, type = "") => {
      if (!status) return;
      status.className = `form-status ${type}`.trim();
      status.textContent = msg;
    };
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      setStatus("");
      // clear invalids
      $$("input, select", form).forEach((el) => el.classList.remove("is-invalid"));

      const data = Object.fromEntries(new FormData(form).entries());
      const required = ["name", "email", "start", "end", "car"];
      const missing = required.filter((k) => !String(data[k] || "").trim());
      const invalid = [];
      // rudimentary email check
      if (data.email && !/^\S+@\S+\.\S+$/.test(String(data.email))) invalid.push("email");
      // mark fields
      [...missing, ...invalid].forEach((k) => {
        const el = form.querySelector(`[name="${k}"]`);
        if (el) el.classList.add("is-invalid");
      });
      if (missing.length || invalid.length) {
        setStatus("Please correct highlighted fields.", "error");
        return;
      }

      // Build email message
      const subject = `Booking Request — ${data.car || "Car"}`;
      const bodyLines = [
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Phone: ${data.phone || "-"}`,
        `Pickup date: ${data.start}`,
        `Return date: ${data.end}`,
        `Car type: ${data.car}`,
        `Notes: ${data.notes || "-"}`,
        "",
        "Please confirm availability.",
        "Sent from website booking form."
      ];
      const body = bodyLines.join("\n");

      if (!COMPANY_EMAIL || COMPANY_EMAIL.startsWith("REPLACE_")) {
        alert("Please set your email in assets/js/main.js (COMPANY_EMAIL) to receive booking requests.");
        setStatus("Owner action required: set COMPANY_EMAIL in JS.", "error");
        return;
      }

      const mailto = `mailto:${encodeURIComponent(COMPANY_EMAIL)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      // Open default email client with prefilled message
      window.location.href = mailto;
      setStatus("Opening your email app to send the request...", "ok");
    });
  }

  // Footer year
  const year = new Date().getFullYear();
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(year);

  // Privacy Policy date (if present)
  const pp = document.getElementById("pp-date");
  if (pp && (!pp.textContent || /^\d{4}-\d{2}-\d{2}$/.test(pp.textContent.trim()))) {
    try {
      const now = new Date();
      const fmt = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: '2-digit' });
      pp.textContent = fmt.format(now);
    } catch {
      pp.textContent = new Date().toISOString().slice(0, 10);
    }
  }

  // Scroll progress + back-to-top + header state + active nav link
  const progress = $(".scroll-progress");
  const toTop = $(".to-top");
  const sections = ["home", "fleet", "services", "booking", "contact"].map((id) => document.getElementById(id)).filter(Boolean);
  const navLinks = $$(".site-nav a");

  const updateScrollUI = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (progress) progress.style.width = pct + "%";
    document.body.classList.toggle("scrolled", scrollTop > 8);
    if (toTop) toTop.classList.toggle("show", scrollTop > 400);

    // Active nav section
    let activeId = "home";
    for (const sec of sections) {
      const rect = sec.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      if (scrollTop >= top - 120) activeId = sec.id;
    }
    navLinks.forEach((a) => {
      const href = a.getAttribute("href") || "";
      const id = href.startsWith("#") ? href.slice(1) : href.replace(/^.*#/, "");
      if (id && id === activeId) a.classList.add("active"); else a.classList.remove("active");
    });
  };

  window.addEventListener("scroll", updateScrollUI, { passive: true });
  window.addEventListener("resize", updateScrollUI);
  updateScrollUI();

  if (toTop) {
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  // Reviews: generate Moroccan client reviews into marquee rows
  const row1 = document.getElementById("reviews-row-1");
  const row2 = document.getElementById("reviews-row-2");
  if (row1 && row2) {
    const reviews = [
      { n: "Youssef", c: "Casablanca", r: 5, t: "Service impeccable et voiture très propre." },
      { n: "Amina", c: "Rabat", r: 5, t: "Réservation facile, tout s’est bien passé." },
      { n: "Hicham", c: "Marrakech", r: 4, t: "Pickup à l’heure, personnel professionnel." },
      { n: "Khadija", c: "Fès", r: 5, t: "Très bonne expérience, je recommande!" },
      { n: "Othmane", c: "Tanger", r: 5, t: "SUV confortable pour la famille." },
      { n: "Imane", c: "Agadir", r: 4, t: "Bon rapport qualité‑prix." },
      { n: "Anas", c: "Meknès", r: 5, t: "Processus rapide et transparent." },
      { n: "Salma", c: "Tétouan", r: 5, t: "Voiture en excellent état, merci!" },
      { n: "Rachid", c: "Oujda", r: 4, t: "Assistance réactive, rien à dire." },
      { n: "Sara", c: "Kénitra", r: 5, t: "Parfait pour mon déplacement pro." },
      { n: "Hamza", c: "Safi", r: 5, t: "Très ponctuels, je relouerai." },
      { n: "Aya", c: "Nador", r: 4, t: "Simple et efficace." },
      { n: "Ilyas", c: "Laâyoune", r: 5, t: "Accueil chaleureux et véhicule premium." },
      { n: "Rania", c: "Mohammédia", r: 5, t: "Top service du début à la fin." },
      { n: "Bilal", c: "Beni Mellal", r: 4, t: "Bon choix de modèles." },
      { n: "Soukaina", c: "El Jadida", r: 5, t: "Très bonne communication, merci." },
      { n: "Yassine", c: "Settat", r: 5, t: "Prix corrects et véhicule propre." },
      { n: "Fatima", c: "Ouarzazate", r: 5, t: "Expérience fluide et agréable." },
      { n: "Najib", c: "Taza", r: 4, t: "Bonne prise en charge à l’aéroport." },
      { n: "Nadia", c: "Chefchaouen", r: 5, t: "Voiture parfaite pour le week‑end." }
    ];

    // shuffle for randomness each load
    const shuffled = reviews.sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);
    const rows = [shuffled.slice(0, mid), shuffled.slice(mid)];

    const starStr = (n) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
    const makeCard = (r) => {
      const card = document.createElement("div");
      card.className = "review-card";
      card.innerHTML = `
        <div class="review-top">
          <span class="review-name">${r.n}</span>
          <span class="review-city">${r.c}</span>
        </div>
        <div class="stars" aria-label="${r.r} out of 5">${starStr(r.r)}</div>
        <p class="review-text">${r.t}</p>
      `;
      return card;
    };

    const fillRow = (el, data) => {
      const frag = document.createDocumentFragment();
      data.forEach((r) => frag.appendChild(makeCard(r)));
      // Duplicate to make seamless carousel (50% shift in keyframes)
      data.forEach((r) => frag.appendChild(makeCard(r)));
      el.appendChild(frag);
    };

    fillRow(row1, rows[0]);
    fillRow(row2, rows[1].length ? rows[1] : rows[0]);
  }
})();
