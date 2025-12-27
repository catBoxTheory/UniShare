// UniShare Bilingual Subtitles - Content Script
// Robust "Tracy-like" implementation with network interception

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
  let transcriptData = []; // [{start, duration, text, textZh}]
  let translationCache = new Map();
  let currentSubtitleIndex = -1;
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
        init();
      } else {
        if (subtitleContainer) subtitleContainer.style.display = 'none';
      }
      updateDisplay();
    }
  });

  function init() {
    console.log('[UniShare] Initializing robust mode...');
    injectInterceptor(); // Step 1: Hook into network
    findPlayer();        // Step 2: Hook into DOM
    
    // Listen for intercepted data
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'UNISHARE_TIMEDTEXT') {
        console.log('[UniShare] Received intercepted transcript!');
        parseTranscript(event.data.text);
      }
    });
  }

  // --- Network Interception (The "Tracy" Secret) ---
  function injectInterceptor() {
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        const XHR = XMLHttpRequest.prototype;
        const open = XHR.open;
        const send = XHR.send;
        const originalFetch = window.fetch;

        // Hook Fetch (YouTube uses this mostly now)
        window.fetch = async function(input, init) {
          const url = typeof input === 'string' ? input : input?.url;
          if (url && url.includes('api/timedtext')) {
            // Clone the request to read it without consuming
            return originalFetch.apply(this, arguments).then(response => {
              const clone = response.clone();
              clone.text().then(text => {
                window.postMessage({ type: 'UNISHARE_TIMEDTEXT', text: text }, '*');
              });
              return response;
            });
          }
          return originalFetch.apply(this, arguments);
        };

        // Hook XHR (Legacy fallback)
        XHR.open = function(method, url) {
          this._url = url;
          return open.apply(this, arguments);
        };
        XHR.send = function(body) {
          if (this._url && this._url.includes('api/timedtext')) {
            this.addEventListener('load', function() {
              window.postMessage({ type: 'UNISHARE_TIMEDTEXT', text: this.responseText }, '*');
            });
          }
          return send.apply(this, arguments);
        };
      })();
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }

  // --- Core Logic ---

  function parseTranscript(xmlOrJson) {
    transcriptData = [];
    
    try {
      // Handle JSON format (some responses are JSON)
      if (xmlOrJson.startsWith('{')) {
        const json = JSON.parse(xmlOrJson);
        if (json.events) {
          transcriptData = json.events
            .filter(e => e.segs && e.segs[0]?.utf8)
            .map(e => ({
              start: e.tStartMs / 1000,
              duration: e.dDurationMs / 1000,
              text: e.segs.map(s => s.utf8).join('').replace(/\n/g, ' '),
              textZh: null
            }));
        }
      } 
      // Handle XML format (classic timedtext)
      else if (xmlOrJson.includes('<text')) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlOrJson, 'text/xml');
        const nodes = doc.querySelectorAll('text');
        transcriptData = Array.from(nodes).map(n => ({
          start: parseFloat(n.getAttribute('start')),
          duration: parseFloat(n.getAttribute('dur') || 0),
          text: decodeHTML(n.textContent),
          textZh: null
        }));
      }

      console.log(`[UniShare] Loaded ${transcriptData.length} lines. Starting translation...`);
      startBackgroundTranslation();
      
    } catch (e) {
      console.error('[UniShare] Parse error:', e);
    }
  }

  function findPlayer() {
    const i = setInterval(() => {
      player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
      videoElement = document.querySelector('video');
      
      if (player && videoElement) {
        clearInterval(i);
        setupContainer();
        videoElement.addEventListener('timeupdate', syncSubtitle);
        // Force a reload of captions by toggling if needed, but interception should catch init load
        console.log('[UniShare] Player hooked.');
      }
    }, 500);
  }

  function setupContainer() {
    if (subtitleContainer) return;
    subtitleContainer = document.createElement('div');
    subtitleContainer.id = 'unishare-tracy-captions';
    player.appendChild(subtitleContainer);
  }

  // --- Sync & Display ---

  function syncSubtitle() {
    if (!transcriptData.length || !settings.enabled) return;
    
    const time = videoElement.currentTime;
    // Simple linear scan is fast enough for <2000 items, and we usually move forward
    const index = transcriptData.findIndex(s => time >= s.start && time < (s.start + s.duration));
    
    if (index !== -1 && index !== currentSubtitleIndex) {
      currentSubtitleIndex = index;
      render();
    } else if (index === -1) {
      subtitleContainer.innerHTML = ''; // Clear if silence
    }
  }

  function render() {
    const item = transcriptData[currentSubtitleIndex];
    if (!item) return;

    let html = `<div class="unishare-tracy-box">`;
    if (settings.showEnglish) html += `<div class="unishare-tracy-en">${item.text}</div>`;
    
    // Logic for Chinese:
    // If ready -> Show it
    // If not ready -> Show nothing (don't block view with "Translating...")
    // Translation queue will update this automatically when done
    if (settings.showChinese && item.textZh) {
      html += `<div class="unishare-tracy-zh">${item.textZh}</div>`;
    }
    
    html += `</div>`;
    subtitleContainer.innerHTML = html;
  }

  // --- Translation Queue (Batched) ---

  async function startBackgroundTranslation() {
    // Translate in batches of 10 to respect API rate limits but be fast
    const batchSize = 10;
    
    for (let i = 0; i < transcriptData.length; i += batchSize) {
      if (!settings.enabled) return;
      
      const batch = transcriptData.slice(i, i + batchSize);
      const toTranslate = batch.filter(x => !x.textZh && !translationCache.has(x.text));
      
      if (toTranslate.length === 0) {
        // Just fill from cache
        batch.forEach(x => { if (!x.textZh) x.textZh = translationCache.get(x.text); });
        continue;
      }

      // Prepare payload
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
            temperature: 0.1 // Low temp for consistency
          })
        });
        
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || '';
        
        raw.split('\n').forEach(line => {
          const [idxStr, ...rest] = line.split('|');
          const idx = parseInt(idxStr);
          const trans = rest.join('|').trim();
          
          if (!isNaN(idx) && toTranslate[idx]) {
            toTranslate[idx].textZh = trans;
            translationCache.set(toTranslate[idx].text, trans);
          }
        });
        
        // Re-render if the current subtitle was just translated
        if (currentSubtitleIndex >= i && currentSubtitleIndex < i + batchSize) {
          render();
        }

      } catch (e) {
        console.error('Translation failed', e);
      }
      
      // Small breathing room for API
      await new Promise(r => setTimeout(r, 100));
    }
  }

  function decodeHTML(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

})();
