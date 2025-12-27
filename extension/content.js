// UniShare Bilingual Subtitles - Content Script (Tracy-like implementation)
// Independent of YouTube's native CC, supports Fullscreen, Robust Translation

(function() {
  'use strict';

  const DEEPSEEK_API_KEY = 'sk-08c0456fbccd466b9b94b660bd6fbcb6';
  
  // State
  let settings = {
    enabled: true,
    showEnglish: true,
    showChinese: true
  };
  
  let player = null;
  let videoElement = null;
  let subtitleContainer = null;
  let currentVideoId = null;
  let transcriptData = []; // [{start, duration, text, textZh}]
  let translationCache = new Map(); // text -> textZh
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
      if (settings.enabled) init(); else cleanup();
      updateDisplay();
    }
  });

  function init() {
    console.log('[UniShare] Initializing Tracy-like mode...');
    
    // Find player and video element
    findPlayer();
    
    // Monitor URL changes
    monitorUrl();
  }

  function cleanup() {
    if (subtitleContainer) subtitleContainer.remove();
    // Remove listeners if needed
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
      fetchTranscript(newVideoId);
    }
  }

  function resetState() {
    transcriptData = [];
    currentSubtitleIndex = -1;
    if (subtitleContainer) subtitleContainer.innerHTML = '';
  }

  function findPlayer() {
    // Retry until player is found
    const interval = setInterval(() => {
      player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
      videoElement = document.querySelector('video');
      
      if (player && videoElement) {
        clearInterval(interval);
        console.log('[UniShare] Player found, injecting container...');
        createSubtitleContainer();
        
        // Add time update listener
        videoElement.addEventListener('timeupdate', handleTimeUpdate);
        
        // Initial fetch
        handleVideoChange();
      }
    }, 500);
  }

  function createSubtitleContainer() {
    if (subtitleContainer) return;
    
    subtitleContainer = document.createElement('div');
    subtitleContainer.id = 'unishare-tracy-captions';
    
    // Inject INSIDE the player to support fullscreen
    player.appendChild(subtitleContainer);
  }

  // --- Core Logic: Fetch Transcript Independently ---
  
  async function fetchTranscript(videoId) {
    try {
      // 1. Get player response to find caption tracks
      // We can fetch the video page or use YouTube's internal API
      // Let's try fetching the video page HTML first as it's robust
      const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
      const html = await response.text();
      
      // Extract caption tracks from ytInitialPlayerResponse
      const playerResponseMatch = html.match(/var\s+ytInitialPlayerResponse\s*=\s*(\{.+?\});/);
      if (!playerResponseMatch) return;
      
      const playerResponse = JSON.parse(playerResponseMatch[1]);
      const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      
      if (!tracks || tracks.length === 0) {
        console.log('[UniShare] No captions found for this video.');
        return;
      }
      
      // Find English track (manual > auto-generated)
      const englishTrack = tracks.find(t => t.languageCode === 'en' && !t.kind) || 
                           tracks.find(t => t.languageCode === 'en') ||
                           tracks.find(t => t.languageCode?.startsWith('en'));
                           
      if (!englishTrack) {
        console.log('[UniShare] No English captions found.');
        return;
      }
      
      console.log(`[UniShare] Fetching transcript from: ${englishTrack.baseUrl}`);
      
      // 2. Fetch the XML transcript
      const xmlResponse = await fetch(englishTrack.baseUrl);
      const xml = await xmlResponse.text();
      
      // 3. Parse XML
      parseTranscript(xml);
      
    } catch (e) {
      console.error('[UniShare] Failed to fetch transcript:', e);
    }
  }

  function parseTranscript(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const textNodes = doc.querySelectorAll('text');
    
    transcriptData = Array.from(textNodes).map(node => ({
      start: parseFloat(node.getAttribute('start')),
      duration: parseFloat(node.getAttribute('dur') || '0'),
      text: decodeHTML(node.textContent),
      textZh: null // To be filled by translation
    }));
    
    console.log(`[UniShare] Parsed ${transcriptData.length} subtitle segments.`);
    
    // Start background translation immediately
    startBackgroundTranslation();
  }

  function decodeHTML(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value.replace(/\n/g, ' ');
  }

  // --- Core Logic: Time Sync & Display ---

  function handleTimeUpdate() {
    if (!transcriptData.length || !settings.enabled) return;
    
    const currentTime = videoElement.currentTime;
    
    // Find active subtitle
    // Optimize: search around current index first
    let activeIndex = -1;
    
    // Check current
    if (currentSubtitleIndex !== -1 && isInside(currentSubtitleIndex, currentTime)) {
      activeIndex = currentSubtitleIndex;
    } else {
      // Linear search (can be binary search for optimization, but linear is fine for < 2000 items)
      activeIndex = transcriptData.findIndex(s => isInsideSegment(s, currentTime));
    }
    
    if (activeIndex !== -1 && activeIndex !== currentSubtitleIndex) {
      currentSubtitleIndex = activeIndex;
      updateDisplay();
      
      // Trigger urgent translation if not ready
      if (!transcriptData[activeIndex].textZh) {
        translateSingle(activeIndex);
      }
    } else if (activeIndex === -1) {
      // No active subtitle
      if (subtitleContainer.innerHTML !== '') {
        subtitleContainer.innerHTML = '';
        currentSubtitleIndex = -1;
      }
    }
  }

  function isInside(index, time) {
    const s = transcriptData[index];
    return s && time >= s.start && time < (s.start + s.duration);
  }
  
  function isInsideSegment(s, time) {
    return time >= s.start && time < (s.start + s.duration);
  }

  function updateDisplay() {
    if (!subtitleContainer || currentSubtitleIndex === -1) return;
    
    const segment = transcriptData[currentSubtitleIndex];
    let html = '<div class="unishare-tracy-box">';
    
    if (settings.showEnglish) {
      html += `<div class="unishare-tracy-en">${segment.text}</div>`;
    }
    
    if (settings.showChinese) {
      if (segment.textZh) {
        html += `<div class="unishare-tracy-zh">${segment.textZh}</div>`;
      } else {
        // Option A: Show loading dots
        // Option B: Show nothing until ready (Tracy style often just waits)
        // Let's show a subtle indicator or nothing
        html += `<div class="unishare-tracy-zh loading">...</div>`;
      }
    }
    
    html += '</div>';
    subtitleContainer.innerHTML = html;
  }

  // --- Core Logic: Robust Translation Queue ---

  async function startBackgroundTranslation() {
    // Translate in chunks
    // Prioritize segments around current time, but here we just do sequential for simplicity
    // A better approach: Translate visible range + lookahead
    
    // For MVP: Translate all in batches of 10
    const batchSize = 10;
    
    for (let i = 0; i < transcriptData.length; i += batchSize) {
      if (!settings.enabled) break;
      
      const batch = transcriptData.slice(i, i + batchSize);
      // Skip if already translated
      if (batch.every(s => s.textZh)) continue;
      
      await translateBatch(batch, i);
      
      // Update display if the current subtitle was in this batch
      if (currentSubtitleIndex >= i && currentSubtitleIndex < i + batchSize) {
        updateDisplay();
      }
      
      // Rate limit protection
      await new Promise(r => setTimeout(r, 200));
    }
  }

  async function translateBatch(batch, startIndex) {
    // Filter needs translation
    const needsTranslation = batch.map((s, idx) => ({ ...s, originalIndex: startIndex + idx }))
                                  .filter(s => !s.textZh && !translationCache.has(s.text));
    
    if (needsTranslation.length === 0) {
      // Fill from cache
      batch.forEach((s, idx) => {
        if (!s.textZh && translationCache.has(s.text)) {
          transcriptData[startIndex + idx].textZh = translationCache.get(s.text);
        }
      });
      return;
    }

    const textBlock = needsTranslation.map((s, i) => `${i}|${s.text}`).join('\n');
    
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Translate to Traditional Chinese (zh-TW). Format: index|text' },
            { role: 'user', content: textBlock }
          ],
          temperature: 0.3
        })
      });
      
      const data = await response.json();
      const result = data.choices?.[0]?.message?.content || '';
      
      // Parse result
      result.split('\n').forEach(line => {
        const match = line.match(/^(\d+)\|(.*)$/);
        if (match) {
          const localIndex = parseInt(match[1]);
          const translatedText = match[2].trim();
          
          if (needsTranslation[localIndex]) {
            const globalIndex = needsTranslation[localIndex].originalIndex;
            transcriptData[globalIndex].textZh = translatedText;
            translationCache.set(transcriptData[globalIndex].text, translatedText);
          }
        }
      });
      
    } catch (e) {
      console.error('[UniShare] Translation error:', e);
    }
  }

  async function translateSingle(index) {
    // Urgent translation for single segment
    const segment = transcriptData[index];
    if (segment.textZh || isTranslating) return;
    
    if (translationCache.has(segment.text)) {
      segment.textZh = translationCache.get(segment.text);
      updateDisplay();
      return;
    }

    // This is a fallback if the batch processor hasn't reached it yet
    // We rely on the batch processor mostly
  }

})();
