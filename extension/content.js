// UniShare Bilingual Subtitles - Content Script
// This script runs on YouTube pages and intercepts caption data

(function() {
  'use strict';

  // DeepSeek API Key (hardcoded for convenience)
  const DEEPSEEK_API_KEY = 'sk-08c0456fbccd466b9b94b660bd6fbcb6';
  
  // Settings
  let settings = {
    enabled: true,
    showEnglish: true,
    showChinese: true
  };
  
  // State
  let captionContainer = null;
  let currentVideoId = null;
  let captionData = [];
  let translationCache = new Map();
  let isTranslating = false;
  let lastCaptionText = '';
  let observer = null;

  // Load settings
  chrome.storage.local.get({
    enabled: true,
    showEnglish: true,
    showChinese: true
  }).then(s => {
    settings = s;
    if (settings.enabled) {
      init();
    }
  });

  // Listen for settings changes
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'settingsChanged') {
      Object.assign(settings, message);
      
      if (settings.enabled) {
        init();
      } else {
        cleanup();
      }
      
      updateCaptionVisibility();
    }
  });

  function init() {
    console.log('[UniShare] Initializing bilingual subtitles...');
    
    // Create caption container
    createCaptionContainer();
    
    // Start observing for caption changes
    startCaptionObserver();
    
    // Also try to intercept caption data from page
    interceptCaptionData();
    
    // Monitor for video changes
    monitorVideoChanges();
  }

  function cleanup() {
    if (captionContainer) {
      captionContainer.remove();
      captionContainer = null;
    }
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function createCaptionContainer() {
    if (captionContainer) return;
    
    captionContainer = document.createElement('div');
    captionContainer.id = 'unishare-bilingual-captions';
    captionContainer.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 999999;
      pointer-events: none;
      text-align: center;
      max-width: 80%;
      display: none;
    `;
    
    document.body.appendChild(captionContainer);
  }

  function startCaptionObserver() {
    // Observe YouTube's caption container for changes
    const checkForCaptions = () => {
      // YouTube's caption container
      const ytCaptions = document.querySelector('.ytp-caption-window-container');
      
      if (ytCaptions && !observer) {
        console.log('[UniShare] Found YouTube caption container, starting observer...');
        
        observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
              handleCaptionChange();
            }
          }
        });
        
        observer.observe(ytCaptions, {
          childList: true,
          subtree: true,
          characterData: true
        });
        
        // Also observe the parent for visibility changes
        const captionWindow = document.querySelector('.ytp-caption-window-container');
        if (captionWindow) {
          observer.observe(captionWindow, {
            attributes: true,
            attributeFilter: ['style', 'class']
          });
        }
      }
    };
    
    // Check periodically for caption container
    const interval = setInterval(() => {
      checkForCaptions();
      
      // Also check for caption text directly
      const captionSegments = document.querySelectorAll('.ytp-caption-segment');
      if (captionSegments.length > 0) {
        handleCaptionChange();
      }
    }, 500);
    
    // Store interval for cleanup
    window._unishareInterval = interval;
  }

  function handleCaptionChange() {
    if (!settings.enabled) return;
    
    // Get current caption text from YouTube's captions
    const captionSegments = document.querySelectorAll('.ytp-caption-segment');
    let captionText = '';
    
    captionSegments.forEach(segment => {
      captionText += segment.textContent + ' ';
    });
    
    captionText = captionText.trim();
    
    if (captionText && captionText !== lastCaptionText) {
      lastCaptionText = captionText;
      displayBilingualCaption(captionText);
    }
  }

  async function displayBilingualCaption(englishText) {
    if (!captionContainer || !settings.enabled) return;
    
    // Check cache first
    let chineseText = translationCache.get(englishText);
    
    if (!chineseText && !isTranslating) {
      isTranslating = true;
      chineseText = await translateText(englishText);
      if (chineseText) {
        translationCache.set(englishText, chineseText);
      }
      isTranslating = false;
    }
    
    // Build caption HTML
    let html = '<div class="unishare-caption-box">';
    
    if (settings.showEnglish) {
      html += `<div class="unishare-caption-en">${escapeHtml(englishText)}</div>`;
    }
    
    if (settings.showChinese && chineseText) {
      html += `<div class="unishare-caption-zh">${escapeHtml(chineseText)}</div>`;
    } else if (settings.showChinese && !chineseText) {
      html += `<div class="unishare-caption-zh unishare-loading">翻譯中...</div>`;
    }
    
    html += '</div>';
    
    captionContainer.innerHTML = html;
    captionContainer.style.display = 'block';
    
    // Hide after a delay if no new caption
    clearTimeout(window._unishareHideTimeout);
    window._unishareHideTimeout = setTimeout(() => {
      if (captionContainer) {
        captionContainer.style.display = 'none';
      }
    }, 5000);
  }

  async function translateText(text) {
    if (!text || text.length === 0) return '';
    
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
            {
              role: 'system',
              content: 'Translate the following English subtitle text to Traditional Chinese (繁體中文). Only output the translation, nothing else. Keep it concise for subtitles.'
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      });
      
      if (!response.ok) {
        console.error('[UniShare] Translation API error:', response.status);
        return null;
      }
      
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || null;
      
    } catch (error) {
      console.error('[UniShare] Translation error:', error);
      return null;
    }
  }

  function interceptCaptionData() {
    // Try to intercept YouTube's internal caption data
    // This is more reliable than scraping the DOM
    
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        // Intercept XMLHttpRequest for timedtext API
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
          if (url && url.includes('timedtext')) {
            this._isTimedText = true;
            this._timedTextUrl = url;
          }
          return originalOpen.apply(this, arguments);
        };
        
        const originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function() {
          if (this._isTimedText) {
            this.addEventListener('load', function() {
              if (this.responseText) {
                window.postMessage({
                  type: 'UNISHARE_CAPTION_DATA',
                  data: this.responseText,
                  url: this._timedTextUrl
                }, '*');
              }
            });
          }
          return originalSend.apply(this, arguments);
        };
        
        // Also intercept fetch for modern YouTube
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
          const promise = originalFetch.apply(this, arguments);
          
          if (url && typeof url === 'string' && url.includes('timedtext')) {
            promise.then(response => {
              response.clone().text().then(text => {
                window.postMessage({
                  type: 'UNISHARE_CAPTION_DATA',
                  data: text,
                  url: url
                }, '*');
              });
            });
          }
          
          return promise;
        };
        
        console.log('[UniShare] Caption interceptor installed');
      })();
    `;
    
    document.documentElement.appendChild(script);
    script.remove();
    
    // Listen for intercepted caption data
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'UNISHARE_CAPTION_DATA') {
        console.log('[UniShare] Intercepted caption data');
        parseCaptionData(event.data.data);
      }
    });
  }

  function parseCaptionData(data) {
    try {
      // Try to parse as XML
      if (data.includes('<text')) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/xml');
        const textElements = doc.querySelectorAll('text');
        
        captionData = Array.from(textElements).map(el => ({
          start: parseFloat(el.getAttribute('start')) * 1000,
          duration: parseFloat(el.getAttribute('dur')) * 1000,
          text: el.textContent
        }));
        
        console.log('[UniShare] Parsed', captionData.length, 'caption segments');
        
        // Pre-translate all captions
        preTranslateCaptions();
      }
    } catch (error) {
      console.error('[UniShare] Failed to parse caption data:', error);
    }
  }

  async function preTranslateCaptions() {
    // Translate captions in batches
    const untranslated = captionData.filter(c => !translationCache.has(c.text));
    
    if (untranslated.length === 0) return;
    
    console.log('[UniShare] Pre-translating', untranslated.length, 'captions...');
    
    // Batch translate (10 at a time)
    for (let i = 0; i < untranslated.length; i += 10) {
      const batch = untranslated.slice(i, i + 10);
      const texts = batch.map((c, idx) => `${idx}|${c.text}`).join('\n');
      
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
              {
                role: 'system',
                content: 'Translate English subtitles to Traditional Chinese. Input: "index|English". Output: "index|Chinese". One per line. Keep translations concise.'
              },
              { role: 'user', content: texts }
            ],
            temperature: 0.7
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const translated = data.choices?.[0]?.message?.content || '';
          
          translated.split('\n').forEach(line => {
            const match = line.match(/^(\d+)\|(.*)$/);
            if (match) {
              const idx = parseInt(match[1]);
              if (batch[idx]) {
                translationCache.set(batch[idx].text, match[2].trim());
              }
            }
          });
        }
      } catch (error) {
        console.error('[UniShare] Batch translation error:', error);
      }
      
      // Small delay between batches
      await new Promise(r => setTimeout(r, 500));
    }
    
    console.log('[UniShare] Pre-translation complete');
  }

  function monitorVideoChanges() {
    // Watch for video ID changes
    let lastUrl = location.href;
    
    const checkUrl = () => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log('[UniShare] URL changed, resetting...');
        
        // Reset state
        captionData = [];
        lastCaptionText = '';
        
        // Re-initialize after a short delay
        setTimeout(init, 1000);
      }
    };
    
    // Check periodically
    setInterval(checkUrl, 1000);
    
    // Also listen for YouTube's navigation events
    document.addEventListener('yt-navigate-finish', () => {
      console.log('[UniShare] YouTube navigation detected');
      setTimeout(init, 500);
    });
  }

  function updateCaptionVisibility() {
    if (!captionContainer) return;
    
    if (!settings.enabled) {
      captionContainer.style.display = 'none';
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (settings.enabled) init();
    });
  } else {
    if (settings.enabled) init();
  }

})();

