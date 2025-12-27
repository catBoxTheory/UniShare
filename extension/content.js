// UniShare Bilingual Subtitles - Content Script
// Final Robust "Tracy-like" implementation: Active Fetching + No Flickering

(function() {
  'use strict';

  const DEEPSEEK_API_KEY = 'sk-08c0456fbccd466b9b94b660bd6fbcb6';
  
  let settings = {
    enabled: true,
    showEnglish: true,
    showChinese: true
  };
  
  // State
  let player = null;
  let videoElement = null;
  let subtitleContainer = null;
  let currentVideoId = null;
  let transcriptData = []; // [{start, duration, text, textZh}]
  let translationCache = new Map(); // text -> textZh
  let currentSubtitleIndex = -1;
  let isTranslating = false;
  let hasFetchedForCurrentVideo = false;
  
  // Initialize
  chrome.storage.local.get(settings).then(s => {
    settings = s;
    if (settings.enabled) init();
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'settingsChanged') {
      Object.assign(settings, message);
      if (settings.enabled) {
        init();
      } else {
        if (subtitleContainer) subtitleContainer.style.display = 'none';
      }
      // Force update to show/hide languages
      updateDisplay(true);
    }
  });

  function init() {
    console.log('[UniShare] Initializing Active Fetch mode...');
    
    // 1. Hook into the player
    findPlayer();
    
    // 2. Monitor URL changes (SPA navigation)
    monitorUrl();
  }

  function monitorUrl() {
    let lastUrl = location.href;
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        handleVideoChange();
      }
    }, 1000);
  }

  function handleVideoChange() {
    const urlParams = new URLSearchParams(window.location.search);
    const newVideoId = urlParams.get('v');
    
    if (newVideoId && newVideoId !== currentVideoId) {
      console.log(`[UniShare] Video changed: ${newVideoId}`);
      currentVideoId = newVideoId;
      resetState();
      
      // Delay slightly to let page load
      setTimeout(() => fetchTranscript(newVideoId), 1000);
    }
  }

  function resetState() {
    transcriptData = [];
    currentSubtitleIndex = -1;
    hasFetchedForCurrentVideo = false;
    if (subtitleContainer) subtitleContainer.innerHTML = '';
  }

  function findPlayer() {
    const interval = setInterval(() => {
      player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
      videoElement = document.querySelector('video');
      
      if (player && videoElement) {
        clearInterval(interval);
        console.log('[UniShare] Player found.');
        createSubtitleContainer();
        
        // Use 'timeupdate' for sync
        videoElement.addEventListener('timeupdate', handleTimeUpdate);
        
        // Initial fetch if we have a video ID
        const urlParams = new URLSearchParams(window.location.search);
        const vid = urlParams.get('v');
        if (vid) {
          currentVideoId = vid;
          fetchTranscript(vid);
        }
      }
    }, 500);
  }

  function createSubtitleContainer() {
    if (document.getElementById('unishare-tracy-captions')) return;
    
    subtitleContainer = document.createElement('div');
    subtitleContainer.id = 'unishare-tracy-captions';
    player.appendChild(subtitleContainer);
  }

  // --- Active Fetching Logic ---

  async function fetchTranscript(videoId) {
    if (hasFetchedForCurrentVideo) return;
    hasFetchedForCurrentVideo = true;
    
    console.log(`[UniShare] Active fetching for ${videoId}...`);
    
    try {
      // 1. Try to get ytInitialPlayerResponse from the page
      // This works even if CC is off because the data is in the page source
      let playerResponse = window.ytInitialPlayerResponse;
      
      // If variable not available (SPA navigation), fetch the page HTML
      if (!playerResponse || !playerResponse.captions) {
        console.log('[UniShare] Fetching page source for captions...');
        const pageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
        const html = await pageResponse.text();
        const match = html.match(/var\s+ytInitialPlayerResponse\s*=\s*(\{.+?\});/);
        if (match) {
          playerResponse = JSON.parse(match[1]);
        }
      }

      if (!playerResponse || !playerResponse.captions) {
        console.log('[UniShare] No captions found in player response.');
        return;
      }

      const tracks = playerResponse.captions.playerCaptionsTracklistRenderer?.captionTracks;
      if (!tracks || tracks.length === 0) return;

      // Prioritize English
      const englishTrack = tracks.find(t => t.languageCode === 'en' && !t.kind) || 
                           tracks.find(t => t.languageCode === 'en') || 
                           tracks.find(t => t.languageCode?.startsWith('en'));

      if (!englishTrack) {
        console.log('[UniShare] No English track found.');
        return;
      }

      console.log(`[UniShare] Found track: ${englishTrack.baseUrl}`);
      
      // 2. Fetch the XML transcript
      const xmlResponse = await fetch(englishTrack.baseUrl);
      const xml = await xmlResponse.text();
      
      parseTranscript(xml);

    } catch (e) {
      console.error('[UniShare] Fetch error:', e);
    }
  }

  function parseTranscript(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const nodes = doc.querySelectorAll('text');
    
    transcriptData = Array.from(nodes).map(node => ({
      start: parseFloat(node.getAttribute('start')),
      duration: parseFloat(node.getAttribute('dur') || 0),
      text: decodeHTML(node.textContent),
      textZh: null
    }));

    console.log(`[UniShare] Parsed ${transcriptData.length} lines.`);
    
    // Start background translation
    startBackgroundTranslation();
  }

  function decodeHTML(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value.replace(/\n/g, ' ');
  }

  // --- Sync & Display (No Blinking) ---

  function handleTimeUpdate() {
    if (!transcriptData.length || !settings.enabled) return;
    
    const time = videoElement.currentTime;
    
    // Find active subtitle
    let activeIndex = -1;
    
    // Optimization: Check current or next
    if (currentSubtitleIndex !== -1 && isInside(currentSubtitleIndex, time)) {
      activeIndex = currentSubtitleIndex;
    } else if (currentSubtitleIndex + 1 < transcriptData.length && isInside(currentSubtitleIndex + 1, time)) {
      activeIndex = currentSubtitleIndex + 1;
    } else {
      // Binary search could be better, but linear is fine
      activeIndex = transcriptData.findIndex(s => time >= s.start && time < (s.start + s.duration));
    }
    
    // Only update if index CHANGED
    if (activeIndex !== currentSubtitleIndex) {
      currentSubtitleIndex = activeIndex;
      updateDisplay();
    }
  }

  function isInside(index, time) {
    const s = transcriptData[index];
    return s && time >= s.start && time < (s.start + s.duration);
  }

  function updateDisplay(force = false) {
    if (!subtitleContainer) return;
    
    if (currentSubtitleIndex === -1) {
      subtitleContainer.innerHTML = ''; // Clear
      return;
    }

    const item = transcriptData[currentSubtitleIndex];
    if (!item) return;

    // Check if we need to re-render (prevent blinking)
    // We only re-render if the text content actually changed
    // or if we are forcing an update (settings change)
    
    // Construct HTML string
    let html = `<div class="unishare-tracy-box">`;
    if (settings.showEnglish) html += `<div class="unishare-tracy-en">${item.text}</div>`;
    
    // Only show Chinese if available. No placeholders.
    if (settings.showChinese && item.textZh) {
      html += `<div class="unishare-tracy-zh">${item.textZh}</div>`;
    }
    html += `</div>`;

    // Simple diff
    if (force || subtitleContainer.innerHTML !== html) {
      subtitleContainer.innerHTML = html;
    }
  }

  // --- Translation Queue (No "Translating..." state) ---

  async function startBackgroundTranslation() {
    // Process in batches
    const BATCH_SIZE = 15;
    
    for (let i = 0; i < transcriptData.length; i += BATCH_SIZE) {
      if (!settings.enabled) break;
      
      const batch = transcriptData.slice(i, i + BATCH_SIZE);
      const toTranslate = batch.filter(x => !x.textZh && !translationCache.has(x.text));
      
      if (toTranslate.length === 0) {
        // Hydrate from cache
        batch.forEach(x => { if (!x.textZh) x.textZh = translationCache.get(x.text); });
        
        // If current subtitle is in this batch, update display immediately
        if (currentSubtitleIndex >= i && currentSubtitleIndex < i + BATCH_SIZE) {
          updateDisplay();
        }
        continue;
      }

      // Prepare API payload
      const textBlock = toTranslate.map((x, idx) => `${idx}|${x.text}`).join('\n');
      
      try {
        const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'Translate to Traditional Chinese. Format: index|text' },
              { role: 'user', content: textBlock }
            ],
            temperature: 0.1
          })
        });
        
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || '';
        
        raw.split('\n').forEach(line => {
          const match = line.match(/^(\d+)\|(.*)$/);
          if (match) {
            const idx = parseInt(match[1]);
            const trans = match[2].trim();
            if (toTranslate[idx]) {
              toTranslate[idx].textZh = trans;
              translationCache.set(toTranslate[idx].text, trans);
            }
          }
        });
        
        // Update display if needed
        if (currentSubtitleIndex >= i && currentSubtitleIndex < i + BATCH_SIZE) {
          updateDisplay();
        }

      } catch (e) {
        console.error('Translation failed', e);
      }
      
      // Delay to respect API limits
      await new Promise(r => setTimeout(r, 200));
    }
  }

})();

