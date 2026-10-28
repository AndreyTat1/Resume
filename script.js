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
const pendingGame = document.querySelector("#pending-game");
const pendingGameTitle = document.querySelector("#pending-game-title");
const pendingGameHint = document.querySelector("#pending-game-hint");
const gameStage = document.querySelector("#game-stage");
const gameTarget = document.querySelector("#game-target");
const gameScore = document.querySelector("#game-score");
const gameResults = document.querySelector("#game-results");
const gameRoundCount = 5;
const catchesPerRound = 5;
let gameRound = 0;
let catchesThisRound = 0;
let roundTimes = [];
let roundStartedAt = 0;
let gameClock = 0;
let gameActive = false;
let emailStatus = "preview";

function moveGameTarget() {
  if (!gameStage || !gameTarget) return;
  const maxX = Math.max(0, gameStage.clientWidth - gameTarget.offsetWidth);
  const maxY = Math.max(0, gameStage.clientHeight - gameTarget.offsetHeight);
  gameTarget.style.left = `${Math.random() * maxX}px`;
  gameTarget.style.top = `${Math.random() * maxY}px`;
}

function updateGameClock() {
  if (!gameActive || !gameScore) return;
  const elapsed = (performance.now() - roundStartedAt) / 1000;
  gameScore.textContent = `Уровень ${gameRound + 1} / ${gameRoundCount} · Точки ${catchesThisRound} / ${catchesPerRound} · ${elapsed.toFixed(1)} с`;
}

function startGame(status) {
  emailStatus = status;
  gameRound = 0;
  catchesThisRound = 0;
  roundTimes = [];
  gameActive = true;
  roundStartedAt = performance.now();
  clearInterval(gameClock);
  if (gameScore) gameScore.textContent = `Уровень 1 / ${gameRoundCount} · Точки 0 / ${catchesPerRound} · 0.0 с`;
  if (gameResults) {
    gameResults.replaceChildren();
    gameResults.hidden = true;
  }
  if (gameStage) gameStage.hidden = false;
  if (gameTarget) {
    gameTarget.hidden = false;
    gameTarget.textContent = "";
    gameTarget.setAttribute("aria-label", "Поймать точку");
  }
  if (pendingGame) pendingGame.hidden = false;
  if (pendingGameTitle) pendingGameTitle.textContent = status === "sending" ? "Заявка отправляется" : "Предпросмотр мини-игры";
  if (pendingGameHint) pendingGameHint.textContent = status === "sending"
    ? "В каждом уровне поймайте пять точек. Таймер считает время уровня."
    : "Локально письмо не отправляется. В каждом уровне поймайте пять точек.";
  moveGameTarget();
  gameClock = setInterval(updateGameClock, 100);
}

function showGamePreview() {
  startGame("preview");
  if (formFeedback) {
    formFeedback.textContent = "Демо-режим: заявка не отправлена.";
    formFeedback.classList.remove("error");
  }
}

function finishGame() {
  gameActive = false;
  clearInterval(gameClock);
  if (gameStage) gameStage.hidden = true;
  if (gameScore) gameScore.textContent = `Все раунды пройдены · ${gameRoundCount} / ${gameRoundCount}`;
  if (pendingGameTitle) {
    pendingGameTitle.textContent = emailStatus === "sending"
      ? "Пять раундов пройдены"
      : emailStatus === "sent" ? "Заявка отправлена" : "Игра завершена";
  }
  if (pendingGameHint) {
    pendingGameHint.textContent = emailStatus === "sending"
      ? "Заявка всё ещё отправляется — результаты уже ниже."
      : emailStatus === "sent" ? "Время каждого раунда:" : "Время каждого раунда:";
  }
  if (!gameResults) return;
  gameResults.replaceChildren();
  roundTimes.forEach((time, index) => {
    const row = document.createElement("p");
    const label = document.createElement("span");
    const value = document.createElement("strong");
    label.textContent = `Уровень ${index + 1}`;
    value.textContent = `${time.toFixed(2)} с`;
    row.append(label, value);
    gameResults.append(row);
  });
  const total = roundTimes.reduce((sum, time) => sum + time, 0);
  const totalRow = document.createElement("p");
  totalRow.className = "game-total";
  const totalLabel = document.createElement("span");
  const totalValue = document.createElement("strong");
  totalLabel.textContent = "Общее время";
  totalValue.textContent = `${total.toFixed(2)} с`;
  totalRow.append(totalLabel, totalValue);
  gameResults.append(totalRow);
  gameResults.hidden = false;
}

if (gameTarget && gameScore) {
  gameTarget.addEventListener("click", () => {
    if (!gameActive) return;
    catchesThisRound += 1;
    if (catchesThisRound < catchesPerRound) {
      updateGameClock();
      moveGameTarget();
      return;
    }
    roundTimes.push((performance.now() - roundStartedAt) / 1000);
    gameRound += 1;
    if (gameRound >= gameRoundCount) {
      finishGame();
      return;
    }
    catchesThisRound = 0;
    roundStartedAt = performance.now();
    updateGameClock();
    moveGameTarget();
  });
}

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
      showGamePreview();
      return;
    }
    formFeedback.textContent = "Отправляю заявку…";
    formFeedback.classList.remove("error");
    startGame("sending");
    submitButton.disabled = true;
    let submissionSucceeded = false;

    try {
      const response = await fetch("https://formsubmit.co/ajax/andrey.tatark@gmail.com", {
        method: "POST",
        keepalive: true,
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
      submissionSucceeded = true;
      emailStatus = "sent";
      if (pendingGameTitle) pendingGameTitle.textContent = gameActive ? "Заявка отправлена" : "Заявка отправлена · игра завершена";
      if (pendingGameHint && gameActive) pendingGameHint.textContent = "Письмо отправлено. Можете закончить раунд и посмотреть результаты.";
    } catch (error) {
      formFeedback.textContent = error instanceof TypeError
        ? "Не удалось подключиться к сервису отправки. Проверьте интернет и откройте опубликованную версию сайта."
        : `${error.message} Попробуйте ещё раз или напишите мне на почту.`;
      formFeedback.classList.add("error");
      gameActive = false;
      clearInterval(gameClock);
    } finally {
      if (!submissionSucceeded && pendingGame) pendingGame.hidden = true;
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
