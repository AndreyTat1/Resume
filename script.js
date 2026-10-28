const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");

if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Открыть меню");
    });
  });
}

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

const contactForm = document.querySelector("#contact-form");
const messageField = document.querySelector("#contact-message");
const messageCount = document.querySelector("#message-count");
const formFeedback = document.querySelector("#form-feedback");

if (messageField && messageCount) {
  messageField.addEventListener("input", () => {
    messageCount.textContent = `${messageField.value.length} / 300`;
  });
}

if (contactForm && formFeedback) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const buttonLabel = submitButton.innerHTML;
    if (window.location.protocol === "file:") {
      formFeedback.textContent = "Форма не работает при открытии файла напрямую. Запустите сайт через локальный сервер или откройте опубликованную версию.";
      formFeedback.classList.add("error");
      return;
    }
    formFeedback.textContent = "Отправляю заявку…";
    formFeedback.classList.remove("error");
    submitButton.disabled = true;

    try {
      const response = await fetch("https://formsubmit.co/ajax/andrey.tatark@gmail.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(Object.fromEntries(new FormData(contactForm))),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) {
        throw new Error(result.message || `Сервис вернул ошибку ${response.status}.`);
      }
      contactForm.reset();
      if (messageCount) messageCount.textContent = "0 / 300";
      formFeedback.textContent = "Заявка отправлена! Спасибо за предложение.";
    } catch (error) {
      formFeedback.textContent = error instanceof TypeError
        ? "Не удалось подключиться к сервису отправки. Проверьте интернет и откройте опубликованную версию сайта."
        : `${error.message} Попробуйте ещё раз или напишите мне на почту.`;
      formFeedback.classList.add("error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = buttonLabel;
    }
  });
}

const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".nav a[href^='#']")];
if ("IntersectionObserver" in window && sections.length && navLinks.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: "-30% 0px -60% 0px" });
  sections.forEach((section) => observer.observe(section));
}
