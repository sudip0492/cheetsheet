let currentTopic = null;
let currentData = null;
let allTopics = [];
const cache = {};

const content = document.getElementById("content");
const titleEl = document.getElementById("title");
const searchInput = document.getElementById("searchInput");
const topicListEl = document.getElementById("topic-list");
const themeToggle = document.getElementById("themeToggle");
const homeView = document.getElementById("homeView");
const cheatsheetView = document.getElementById("cheatsheetView");
const homeTopicGrid = document.getElementById("home-topic-grid");
const sidebar = document.querySelector(".sidebar");

// Set current year in footer
document.getElementById('year').innerText = new Date().getFullYear();

// Load topics on startup
async function init() {
  try {
    const response = await fetch('data/topics.json');
    if (!response.ok) throw new Error('Failed to load topics');
    allTopics = await response.json();
    
    renderSidebar(allTopics);
    renderHomeGrid(allTopics);
    
    // Load home view by default
    showHomeView();

  } catch (error) {
    console.error("Initialization error:", error);
    topicListEl.innerHTML = '<div class="error-text">Failed to load topics. Are you running a local server?</div>';
  }
}

function showHomeView() {
  currentTopic = null;
  titleEl.style.display = 'none';
  homeView.style.display = 'block';
  cheatsheetView.style.display = 'none';
  sidebar.style.display = 'none';
  
  document.querySelectorAll(".sidebar button.topic").forEach((btn) => {
    btn.classList.remove("active");
  });
}

function renderHomeGrid(topics) {
  homeTopicGrid.innerHTML = "";
  topics.forEach(topic => {
    const card = document.createElement("div");
    card.className = "home-card";
    card.innerHTML = `
      <i class="ph ${topic.icon} card-icon"></i>
      <h3>${topic.name}</h3>
    `;
    card.onclick = () => loadTopic(topic.id, topic.name, topic.icon);
    homeTopicGrid.appendChild(card);
  });
}

function renderSidebar(topics) {
  topicListEl.innerHTML = "";
  topics.forEach(topic => {
    const btn = document.createElement("button");
    btn.className = "topic";
    btn.dataset.topic = topic.id;
    btn.innerHTML = `<i class="ph ${topic.icon}"></i> ${topic.name}`;
    btn.onclick = () => loadTopic(topic.id, topic.name, topic.icon);
    topicListEl.appendChild(btn);
  });
}

async function loadTopic(topicId, topicName, topicIcon) {
  // Show cheatsheet view and sidebar
  homeView.style.display = 'none';
  cheatsheetView.style.display = 'block';
  titleEl.style.display = '';
  
  // Responsive sidebar display
  if (window.innerWidth <= 900) {
    sidebar.style.display = 'block';
  } else {
    sidebar.style.display = 'flex';
  }

  // Update UI
  currentTopic = topicId;
  const iconHtml = topicIcon ? `<i class="ph ${topicIcon}"></i> ` : '';
  titleEl.innerHTML = iconHtml + (topicName || "Loading...");
  searchInput.value = "";
  searchInput.disabled = true;
  content.innerHTML = '<div class="loading-text">Loading data...</div>';

  document.querySelectorAll(".topic").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.topic === topicId);
  });

  // Fetch or get from cache
  if (!cache[topicId]) {
    try {
      const response = await fetch(`data/${topicId}.json`);
      if (!response.ok) throw new Error(`Failed to load data for ${topicId}`);
      cache[topicId] = await response.json();
    } catch (error) {
      console.error(error);
      content.innerHTML = `<div class="error-text">Failed to load ${topicName} data.</div>`;
      return;
    }
  }

  currentData = cache[topicId];
  searchInput.disabled = false;
  renderContent();
}

function escapeHTML(str) {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderContent(query = "") {
  content.innerHTML = "";
  
  if (!currentData) return;

  let hasResults = false;

  Object.entries(currentData).forEach(([section, commands]) => {
    const filtered = commands.filter(
      (c) =>
        c.cmd.toLowerCase().includes(query) ||
        c.desc.toLowerCase().includes(query)
    );

    if (filtered.length === 0) return;
    hasResults = true;

    const div = document.createElement("div");
    div.className = "section";
    div.innerHTML = `<h2>${section}</h2>`;

    filtered.forEach((c) => {
      div.innerHTML += `
        <div class="command">
          <span class="code">${escapeHTML(c.cmd)}</span>
          <span>${escapeHTML(c.desc)}</span>
        </div>`;
    });

    content.appendChild(div);
  });

  if (!hasResults && query !== "") {
    content.innerHTML = '<div class="loading-text">No matching shortcuts found.</div>';
  }
}

// Event Listeners
searchInput.addEventListener("input", (e) => {
  renderContent(e.target.value.toLowerCase());
});

themeToggle.addEventListener("change", (e) => {
  document.body.classList.toggle("dark", e.target.checked);
});

// Initialize App
themeToggle.checked = false; // Ensure switch matches default light theme
init();