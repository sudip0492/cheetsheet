let currentTopic = null;
let currentData = null;
const cache = {};

const content = document.getElementById("content");
const titleEl = document.getElementById("title");
const searchInput = document.getElementById("searchInput");
const topicListEl = document.getElementById("topic-list");
const themeToggle = document.getElementById("themeToggle");

// Load topics on startup
async function init() {
  try {
    const response = await fetch('data/topics.json');
    if (!response.ok) throw new Error('Failed to load topics');
    const topics = await response.json();
    
    renderSidebar(topics);
    
    // Load first topic by default if available
    if (topics.length > 0) {
      loadTopic(topics[0].id, topics[0].name);
    }
  } catch (error) {
    console.error("Initialization error:", error);
    topicListEl.innerHTML = '<div class="error-text">Failed to load topics. Are you running a local server?</div>';
    titleEl.innerText = 'Error';
  }
}

function renderSidebar(topics) {
  topicListEl.innerHTML = "";
  topics.forEach(topic => {
    const btn = document.createElement("button");
    btn.className = "topic";
    btn.dataset.topic = topic.id;
    btn.innerText = topic.name;
    btn.onclick = () => loadTopic(topic.id, topic.name);
    topicListEl.appendChild(btn);
  });
}

async function loadTopic(topicId, topicName) {
  // Update UI
  currentTopic = topicId;
  titleEl.innerText = topicName || "Loading...";
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
          <span class="code">${c.cmd}</span>
          <span>${c.desc}</span>
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
init();