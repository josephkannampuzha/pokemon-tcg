const API_BASE = 'https://api.pokemontcg.io/v2/cards';

function showSection(sectionId) {
  const sections = ['home', 'help', 'about', 'core'];
  sections.forEach(id => {
    const section = document.getElementById(id);
    if (section) {
      section.classList.add('hidden');
      section.style.opacity = '0';
    }
  });

  const section = document.getElementById(sectionId);
  section.classList.remove('hidden');
  setTimeout(() => (section.style.opacity = '1'), 10);

  if (sectionId === 'core') loadDeckStats();
}

async function searchCards() {
  const search = document.getElementById('searchInput').value;
  const rarity = document.getElementById('rarityFilter').value;
  let query = `${API_BASE}?q=name:${search}`;
  if (rarity) query += ` rarity:${rarity}`;

  try {
    // 🔹 Log search to Supabase
    await fetch('/api/log-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ term: search })
    });
  } catch (e) {
    console.warn('Search log failed:', e);
  }

  try {
    const res = await fetch(query);
    const data = await res.json();
    displayCards(data.data.slice(0, 12), 'cardContainer');
  } catch (err) {
    console.error('Search error:', err);
    alert('Failed to fetch cards.');
  }
}

function displayCards(cards, containerId = 'cardContainer') {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  cards.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.innerHTML = `
      <img src="${card.images.small}" alt="${card.name}" />
      <h3>${card.name}</h3>
      <p>${card.rarity || 'Unknown Rarity'}</p>
    `;
    container.appendChild(cardEl);
  });
}

async function loadFeaturedCards() {
  const SUPABASE_URL = 'https://neijeivqdkqdhfkxjqyu.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5laWplaXZxZGtxZGhma3hqcXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MjExMTYsImV4cCI6MjA2MzE5NzExNn0.rb49nFDQgsn3Lji5_gT6eJM3VC3s9U9iI8Ps6UeNFtU';
  const { createClient } = supabase; // use if you're importing via CDN

  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data, error } = await supabaseClient
    .from('featured_cards')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Supabase fetch error:', error);
    alert('Could not load featured cards.');
    return;
  }

  const formattedCards = data.map(card => ({
    id: card.id,
    name: card.name,
    rarity: card.rarity,
    images: { small: card.image_url }
  }));

  displayCards(formattedCards, 'cardContainer');
}


async function loadDeckStats() {
  try {
    const res = await fetch(`${API_BASE}?q=supertype:pokemon&pageSize=50`);
    const data = await res.json();

    const typeCounts = {};
    data.data.forEach(card => {
      if (card.types) {
        card.types.forEach(type => {
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
      }
    });

    const ctx = document.getElementById('typeChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(typeCounts),
        datasets: [{
          label: 'Card Type Count',
          data: Object.values(typeCounts),
          backgroundColor: 'rgba(255, 99, 132, 0.5)'
        }]
      }
    });
  } catch (err) {
    console.error('Deck stats error:', err);
    alert('Failed to load deck stats.');
  }
}

// === Voice Commands ===
const voiceBtn = document.getElementById('voiceBtn');
const voiceStatus = document.getElementById('voiceStatus');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';

  recognition.onstart = () => { voiceStatus.textContent = 'Listening...'; };
  recognition.onend = () => { voiceStatus.textContent = ''; };
  recognition.onerror = (e) => { voiceStatus.textContent = 'Error: ' + e.error; };

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript.toLowerCase().trim();
    if (transcript.includes('home')) showSection('home');
    else if (transcript.includes('help')) showSection('help');
    else if (transcript.includes('about')) showSection('about');
    else if (transcript.includes('stats')) showSection('core');
    else if (transcript.startsWith('search')) {
      const query = transcript.replace('search', '').trim();
      document.getElementById('searchInput').value = query;
      searchCards();
    } else {
      voiceStatus.textContent = `Unrecognized command: "${transcript}"`;
    }
  };

  voiceBtn.addEventListener('click', () => recognition.start());
} else {
  voiceStatus.textContent = 'Voice commands not supported in this browser.';
  voiceBtn.disabled = true;
}

window.addEventListener('DOMContentLoaded', () => {
  loadFeaturedCards();

  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      showSection(link.getAttribute('data-section'));
    });
  });

  document.getElementById('searchBtn').addEventListener('click', searchCards);
});
