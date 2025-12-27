// UniShare Bilingual Subtitles - Content Script (Active Fetch Mode)
// Solves: Blinking, CC-off support, Fullscreen

(function() {
  'use strict';

  const DEEPSEEK_API_KEY = 'sk-08c0456fbccd466b9b94b660bd6fbcb6';
  
  let settings = {
    enabled: true,
    showEnglish: true,
    showChinese: true
  };
  
  let player = null;
  let videoElement = null;
  let subtitleContainer = null;
  
  // Data State
  let currentVideoId = null;
  let transcriptData = []; // [{start, duration, text, textZh}]
  let translationCache = new Map();
  
  // UI State
  let currentSubtitleIndex = -1;
  let lastRenderedText = '';
  let isTranslating = false;
  
  // Initialize
  chrome.storage.local.get(settings).then(s => {
    settings = s;
    if (settings.enabled) init();
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'settingsChanged') {
      Object.assign(settings, message);
      if (settings.enabled) {
        if (!player) init();
        else updateDisplay(true);
      } else {
        if (subtitleContainer) subtitleContainer.style.display = 'none';
      }
    }
  });

  function init() {
    console.log('[UniShare] Initializing Active Fetch Mode...');
    findPlayer();
    monitorUrl();
  }

  function monitorUrl() {
    let lastUrl = location.href;
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        checkVideoChange();
      }
    }, 1000);
  }

  function checkVideoChange() {
    const urlParams = new URLSearchParams(window.location.search);
    const newVideoId = urlParams.get('v');
    
    if (newVideoId && newVideoId !== currentVideoId) {
      console.log(`[UniShare] New video detected: ${newVideoId}`);
      currentVideoId = newVideoId;
      transcriptData = [];
      currentSubtitleIndex = -1;
      lastRenderedText = '';
      if (subtitleContainer) subtitleContainer.innerHTML = '';
      
      // Active Fetch: Don't wait for YouTube, fetch it ourselves
      fetchCaptionTrack(newVideoId);
    }
  }

  function findPlayer() {
    const i = setInterval(() => {
      player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
      videoElement = document.querySelector('video');
      
      if (player && videoElement) {
        clearInterval(i);
        setupContainer();
        videoElement.addEventListener('timeupdate', handleTimeUpdate);
        checkVideoChange(); // Check immediately
      }
    }, 500);
  }

  function setupContainer() {
    if (subtitleContainer) return;
    subtitleContainer = document.createElement('div');
    subtitleContainer.id = 'unishare-tracy-captions';
    player.appendChild(subtitleContainer);
  }

  // --- Active Fetch Logic (The "Tracy" Secret) ---

  async function fetchCaptionTrack(videoId) {
    try {
      // 1. Get the video page content to find caption tracks
      // This works even if CC is off because ytInitialPlayerResponse is always there
      const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
      const html = await response.text();
      
      // Extract ytInitialPlayerResponse
      const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/);
      if (!match) {
        console.log('[UniShare] Could not find player response.');
        return;
      }

      const data = JSON.parse(match[1]);
      const tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;

      if (!tracks || tracks.length === 0) {
        console.log('[UniShare] No captions available.');
        return;
      }

      // Find English track (Prioritize manual over auto-generated)
      const track = tracks.find(t => t.languageCode === 'en' && !t.kind) || 
                    tracks.find(t => t.languageCode === 'en') ||
                    tracks.find(t => t.languageCode?.startsWith('en'));

      if (!track) {
        console.log('[UniShare] No English track found.');
        return;
      }

      console.log(`[UniShare] Fetching transcript from: ${track.baseUrl}`);
      
      // 2. Fetch the XML transcript directly
      const xmlResponse = await fetch(track.baseUrl);
      const xml = await xmlResponse.text();
      
      parseTranscriptXML(xml);

    } catch (e) {
      console.error('[UniShare] Fetch error:', e);
    }
  }

  function parseTranscriptXML(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const textNodes = doc.querySelectorAll('text');
    
    transcriptData = Array.from(textNodes).map(node => ({
      start: parseFloat(node.getAttribute('start')),
      duration: parseFloat(node.getAttribute('dur') || 0),
      text: decodeHTML(node.textContent),
      textZh: null // Placeholder
    }));

    console.log(`[UniShare] Loaded ${transcriptData.length} lines.`);
    
    // Start translation immediately
    startBackgroundTranslation();
  }

  // --- Display Logic (Anti-Blink) ---

  function handleTimeUpdate() {
    if (!transcriptData.length || !settings.enabled) return;
    
    const time = videoElement.currentTime;
    
    // Efficient search: start from current index
    let index = -1;
    if (currentSubtitleIndex !== -1 && isInside(currentSubtitleIndex, time)) {
      index = currentSubtitleIndex;
    } else {
      // Look forward
      for (let i = Math.max(0, currentSubtitleIndex); i < transcriptData.length; i++) {
        if (isInside(i, time)) {
          index = i;
          break;
        }
        if (transcriptData[i].start > time) break; // Gone past
      }
      // If not found forward, look from beginning (seek backward case)
      if (index === -1) {
        index = transcriptData.findIndex(s => isInsideSegment(s, time));
      }
    }

    if (index !== currentSubtitleIndex) {
      currentSubtitleIndex = index;
      updateDisplay();
    }
  }

  function isInside(index, time) {
    const s = transcriptData[index];
    return s && time >= s.start && time < (s.start + s.duration);
  }
  
  function isInsideSegment(s, time) {
    return time >= s.start && time < (s.start + s.duration);
  }

  function updateDisplay(force = false) {
    if (!subtitleContainer) return;

    if (currentSubtitleIndex === -1) {
      if (subtitleContainer.innerHTML !== '') subtitleContainer.innerHTML = '';
      lastRenderedText = '';
      return;
    }

    const item = transcriptData[currentSubtitleIndex];
    
    // Construct HTML signature to check for changes
    // Important: We do NOT show "Translating..." text. We show nothing or just English.
    // This prevents the blinking/flashing of "Translating..."
    
    const zhText = item.textZh || translationCache.get(item.text) || '';
    const uniqueKey = `${item.text}_${zhText}_${settings.showEnglish}_${settings.showChinese}`;
    
    if (!force && uniqueKey === lastRenderedText) return; // Anti-blink: Do nothing if same
    
    lastRenderedText = uniqueKey;
    
    let html = `<div class="unishare-tracy-box">`;
    if (settings.showEnglish) {
      html += `<div class="unishare-tracy-en">${item.text}</div>`;
    }
    if (settings.showChinese && zhText) {
      html += `<div class="unishare-tracy-zh">${zhText}</div>`;
    }
    html += `</div>`;
    
    subtitleContainer.innerHTML = html;
    subtitleContainer.style.display = 'block';
  }

  // --- Robust Translation Queue ---

  async function startBackgroundTranslation() {
    // Translate in chunks of 15
    const BATCH_SIZE = 15;
    
    for (let i = 0; i < transcriptData.length; i += BATCH_SIZE) {
      if (!settings.enabled) break;
      
      const batch = transcriptData.slice(i, i + BATCH_SIZE);
      const toTranslate = batch.filter(x => !x.textZh && !translationCache.has(x.text));
      
      if (toTranslate.length === 0) {
        // Fill from cache
        batch.forEach(x => { 
          if (!x.textZh && translationCache.has(x.text)) {
            x.textZh = translationCache.get(x.text);
          }
        });
        continue;
      }

      // Prepare text block
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
        
        if (res.ok) {
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
          
          // If the current subtitle is in this batch, update display immediately
          if (currentSubtitleIndex >= i && currentSubtitleIndex < i + BATCH_SIZE) {
            updateDisplay(true);
          }
        }
      } catch (e) {
        console.error('Translation failed', e);
      }
      
      // Small delay to be nice to API
      await new Promise(r => setTimeout(r, 200));
    }
  }

  function decodeHTML(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value.replace(/\n/g, ' ');
  }

})();
