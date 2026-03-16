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

// Modal Elements
const cmdModal = document.getElementById('cmdModal');
const modalCmd = document.getElementById('modalCmd');
const modalDesc = document.getElementById('modalDesc');
const modalDetails = document.getElementById('modalDetails');
const modalExampleCode = document.getElementById('modalExampleCode');
const modalExampleSection = document.getElementById('modalExampleSection');
const modalDetailsBox = document.getElementById('modalDetailsBox');

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
    
    // Check URL path to see if we should load a specific topic
    const path = window.location.pathname.substring(1); // remove the leading '/'
    
    if (path && path !== 'index.html') {
      const topic = allTopics.find(t => t.id === path);
      if (topic) {
        loadTopic(topic.id, topic.name, topic.icon, false);
      } else {
        showHomeView(false);
      }
    } else {
      showHomeView(false);
    }

  } catch (error) {
    console.error("Initialization error:", error);
    topicListEl.innerHTML = '<div class="error-text">Failed to load topics. Are you running a local server?</div>';
  }
}

function showHomeView(updateHistory = true) {
  if (updateHistory) {
    window.history.pushState({}, '', '/');
  }
  
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

async function loadTopic(topicId, topicName, topicIcon, updateHistory = true) {
  if (updateHistory) {
    window.history.pushState({ topicId }, '', `/${topicId}`);
  }

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
    
    const h2 = document.createElement("h2");
    h2.innerText = section;
    div.appendChild(h2);

    filtered.forEach((c) => {
      const cmdRow = document.createElement("div");
      cmdRow.className = "command";
      cmdRow.onclick = () => openModal(c);
      
      cmdRow.innerHTML = `
        <span class="code">${escapeHTML(c.cmd)}</span>
        <span>${escapeHTML(c.desc)}</span>
      `;
      div.appendChild(cmdRow);
    });

    content.appendChild(div);
  });

  if (!hasResults && query !== "") {
    content.innerHTML = '<div class="loading-text">No matching shortcuts found.</div>';
  }
}

// Modal Functions
function openModal(c) {
  modalCmd.innerHTML = escapeHTML(c.cmd);
  modalDesc.innerHTML = escapeHTML(c.desc);
  
  const hasDetails = c.details || c.example;
  
  if (hasDetails) {
    modalDetailsBox.style.display = 'block';
    
    if (c.details) {
      modalDetails.innerHTML = escapeHTML(c.details);
      modalDetails.style.display = 'block';
    } else {
      modalDetails.style.display = 'none';
    }
    
    if (c.example) {
      modalExampleSection.style.display = 'block';
      modalExampleCode.innerHTML = escapeHTML(c.example);
    } else {
      modalExampleSection.style.display = 'none';
    }
  } else {
    modalDetailsBox.style.display = 'block';
    modalDetails.innerHTML = "No detailed example available for this command yet.";
    modalDetails.style.display = 'block';
    modalExampleSection.style.display = 'none';
  }
  
  cmdModal.classList.add('show');
}

function closeModal() {
  cmdModal.classList.remove('show');
}

// Close modal when clicking outside of it
window.onclick = function(event) {
  if (event.target == cmdModal) {
    closeModal();
  }
}

// Event Listeners
searchInput.addEventListener("input", (e) => {
  renderContent(e.target.value.toLowerCase());
});

themeToggle.addEventListener("change", (e) => {
  document.body.classList.toggle("dark", e.target.checked);
});

window.addEventListener('popstate', (e) => {
  const path = window.location.pathname.substring(1);
  if (path && path !== 'index.html') {
    const topic = allTopics.find(t => t.id === path);
    if (topic) {
      loadTopic(topic.id, topic.name, topic.icon, false);
    } else {
      showHomeView(false);
    }
  } else {
    showHomeView(false);
  }
});

// Initialize App
themeToggle.checked = true; // Ensure switch matches default dark theme
init();