const LIMIT = 10;
let catalog = {};
const currentPage = document.body.dataset.page || "classics";

async function init() {
  catalog = await fetch("data/catalog.json").then(r => r.json());
  renderActiveNav();
  renderPage();
  bindEvents();
}

function renderActiveNav() {
  document.querySelectorAll(".nav a").forEach(a => {
    if (a.dataset.page === currentPage) a.classList.add("active");
  });
}

function renderPage() {
  const group = catalog[currentPage];
  if (!group) return;

  document.querySelector("#pageTitle").textContent = group.name;
  
  const pageDescription = document.querySelector("#pageDescription");
  const bannerText = document.querySelector("#bannerText");
  if (group.description && group.description.trim()) {
    pageDescription.textContent = group.description;
    pageDescription.classList.remove("hidden");
    bannerText.textContent = group.description;
    bannerText.classList.remove("hidden");
  } else {
    pageDescription.textContent = "";
    pageDescription.classList.add("hidden");
    bannerText.textContent = "";
    bannerText.classList.add("hidden");
  }

  document.querySelector("#bannerTitle").textContent = group.name;
  

  const box = document.querySelector("#mainList");
  box.innerHTML = group.items.slice(0, LIMIT).map(item => itemHTML(item, group.itemLabel)).join("");

  const moreBtn = document.querySelector("#moreBtn");
  if (group.items.length <= LIMIT) {
    moreBtn.classList.add("hidden");
  } else {
    moreBtn.classList.remove("hidden");
  }
}

function itemHTML(item, label = "打开") {
  return `
    <a class="list-item" href="${encodeURI(item.url)}" target="_blank" rel="noopener">
      <div>
        <div class="item-title">${escapeHTML(item.title)}</div>
        <div class="item-meta">${escapeHTML(item.meta || "")}</div>
      </div>
      <span class="item-action">${escapeHTML(label)}</span>
    </a>
  `;
}

function openModal(title, html) {
  document.querySelector("#modalTitle").textContent = title;
  document.querySelector("#modalBody").innerHTML = html;
  document.querySelector("#modal").classList.remove("hidden");
  document.querySelector("#modal").setAttribute("aria-hidden", "false");
}

function closeModal() {
  document.querySelector("#modal").classList.add("hidden");
  document.querySelector("#modal").setAttribute("aria-hidden", "true");
}

function showMore() {
  const group = catalog[currentPage];
  openModal(`全部目录：${group.name}`, `<div class="list-panel">${group.items.map(item => itemHTML(item, group.itemLabel)).join("")}</div>`);
}

function searchAll(keyword) {
  const q = keyword.trim().toLowerCase();
  const searchSection = document.querySelector("#searchResults");
  const box = document.querySelector("#searchResultList");

  if (!q) {
    searchSection.classList.add("hidden");
    box.innerHTML = "";
    return;
  }

  const results = Object.entries(catalog).flatMap(([key, group]) =>
    group.items
      .filter(item => [item.title, item.meta, group.name].join(" ").toLowerCase().includes(q))
      .map(item => ({ ...item, groupName: group.name, label: group.itemLabel }))
  );

  box.innerHTML = results.length ? results.map(item => `
    <article class="result-card">
      <div class="card-type">${escapeHTML(item.groupName)}</div>
      <h3>${escapeHTML(item.title)}</h3>
      <p class="item-meta">${escapeHTML(item.meta || "")}</p>
      <a class="item-action" href="${encodeURI(item.url)}" target="_blank" rel="noopener">打开</a>
    </article>
  `).join("") : `<p>没有找到相关内容。</p>`;

  searchSection.classList.remove("hidden");
}

function bindEvents() {
  document.querySelector("#moreBtn").addEventListener("click", showMore);
  document.querySelector("#modalClose").addEventListener("click", closeModal);
  document.querySelector("#modalBackdrop").addEventListener("click", closeModal);

  document.querySelector("#searchInput").addEventListener("input", event => {
    searchAll(event.target.value);
  });

  document.querySelector("#clearSearchBtn").addEventListener("click", () => {
    document.querySelector("#searchInput").value = "";
    document.querySelector("#searchResults").classList.add("hidden");
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
  });
}

function escapeHTML(str = "") {
  return String(str).replace(/[&<>"']/g, s => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[s]);
}

init().catch(error => {
  console.error(error);
  document.body.insertAdjacentHTML("afterbegin", "<p style='padding:12px;background:#fee'>数据加载失败，请检查 data/catalog.json。</p>");
});
