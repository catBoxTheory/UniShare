// UniShare 雙語字幕 - Content Script
// 支援 YouTube.com 和 UniShare 嵌入式影片

(function() {
  'use strict';

  // DeepSeek API Key
  const DEEPSEEK_API_KEY = 'sk-08c0456fbccd466b9b94b660bd6fbcb6';
  
  // Settings
  let settings = {
    enabled: true,
    showEnglish: true,
    showChinese: true
  };
  
  // State
  let captionContainer = null;
  let translationCache = new Map();
  let lastCaptionText = '';
  let currentTranslation = '';
  let isTranslating = false;
  let hideTimeout = null;
  let checkInterval = null;

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
    }
  });

  function init() {
    console.log('[UniShare] 初始化雙語字幕...');
    console.log('[UniShare] 當前頁面:', window.location.href);
    
    createCaptionContainer();
    startCaptionMonitor();
  }

  function cleanup() {
    if (captionContainer) {
      captionContainer.remove();
      captionContainer = null;
    }
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  }

  function createCaptionContainer() {
    // Remove existing container if any
    const existing = document.getElementById('unishare-bilingual-captions');
    if (existing) existing.remove();
    
    captionContainer = document.createElement('div');
    captionContainer.id = 'unishare-bilingual-captions';
    document.body.appendChild(captionContainer);
    
    console.log('[UniShare] 字幕容器已創建');
  }

  function startCaptionMonitor() {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    
    // Check for captions every 200ms
    checkInterval = setInterval(() => {
      if (!settings.enabled) return;
      
      const captionText = findCaptionText();
      
      if (captionText && captionText !== lastCaptionText) {
        lastCaptionText = captionText;
        handleNewCaption(captionText);
      }
    }, 200);
    
    console.log('[UniShare] 字幕監控已啟動');
  }

  function findCaptionText() {
    // Method 1: YouTube's caption segments (direct YouTube)
    let segments = document.querySelectorAll('.ytp-caption-segment');
    if (segments.length > 0) {
      return Array.from(segments).map(s => s.textContent).join(' ').trim();
    }
    
    // Method 2: Look for captions in iframes (for embedded videos)
    // Note: Due to cross-origin, we can only access same-origin iframes
    const iframes = document.querySelectorAll('iframe[src*="youtube"]');
    for (const iframe of iframes) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          segments = iframeDoc.querySelectorAll('.ytp-caption-segment');
          if (segments.length > 0) {
            return Array.from(segments).map(s => s.textContent).join(' ').trim();
          }
        }
      } catch (e) {
        // Cross-origin iframe, can't access
      }
    }
    
    // Method 3: Check for caption window container
    const captionWindow = document.querySelector('.caption-window');
    if (captionWindow) {
      return captionWindow.textContent?.trim();
    }
    
    // Method 4: Any element with caption-related class
    const captionElements = document.querySelectorAll('[class*="caption"], [class*="subtitle"]');
    for (const el of captionElements) {
      const text = el.textContent?.trim();
      if (text && text.length > 5 && text.length < 500) {
        // Looks like a caption
        return text;
      }
    }
    
    return null;
  }

  async function handleNewCaption(englishText) {
    if (!captionContainer || !settings.enabled) return;
    
    console.log('[UniShare] 新字幕:', englishText.substring(0, 50) + '...');
    
    // Check cache first
    if (translationCache.has(englishText)) {
      currentTranslation = translationCache.get(englishText);
      displayCaption(englishText, currentTranslation);
      return;
    }
    
    // Show English immediately, translation will come
    displayCaption(englishText, null);
    
    // Don't start new translation if one is in progress
    if (isTranslating) {
      return;
    }
    
    // Translate
    isTranslating = true;
    const translation = await translateText(englishText);
    isTranslating = false;
    
    if (translation) {
      translationCache.set(englishText, translation);
      currentTranslation = translation;
      
      // Only display if this is still the current caption
      if (lastCaptionText === englishText) {
        displayCaption(englishText, translation);
      }
    }
  }

  function displayCaption(englishText, chineseText) {
    if (!captionContainer) return;
    
    // Clear hide timeout
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    
    let html = '<div class="unishare-caption-box">';
    
    if (settings.showEnglish && englishText) {
      html += `<div class="unishare-caption-en">${escapeHtml(englishText)}</div>`;
    }
    
    if (settings.showChinese) {
      if (chineseText) {
        html += `<div class="unishare-caption-zh">${escapeHtml(chineseText)}</div>`;
      }
      // Don't show "翻譯中" - just show English until translation is ready
    }
    
    html += '</div>';
    
    captionContainer.innerHTML = html;
    captionContainer.classList.add('visible');
    
    // Hide after 5 seconds of no new caption
    hideTimeout = setTimeout(() => {
      if (captionContainer) {
        captionContainer.classList.remove('visible');
      }
    }, 5000);
  }

  async function translateText(text) {
    if (!text || text.length === 0) return null;
    
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
              content: '將以下英文字幕翻譯成繁體中文。只輸出翻譯結果，不要任何解釋。保持簡潔，適合字幕顯示。'
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3,
          max_tokens: 200
        })
      });
      
      if (!response.ok) {
        console.error('[UniShare] 翻譯 API 錯誤:', response.status);
        return null;
      }
      
      const data = await response.json();
      const translation = data.choices?.[0]?.message?.content?.trim();
      
      console.log('[UniShare] 翻譯完成:', translation?.substring(0, 30) + '...');
      return translation || null;
      
    } catch (error) {
      console.error('[UniShare] 翻譯錯誤:', error);
      return null;
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Also try to observe YouTube's caption container directly
  function observeYouTubeCaptions() {
    const observer = new MutationObserver(() => {
      const captionText = findCaptionText();
      if (captionText && captionText !== lastCaptionText) {
        lastCaptionText = captionText;
        handleNewCaption(captionText);
      }
    });
    
    // Try to find and observe YouTube's caption container
    const findAndObserve = () => {
      const captionContainer = document.querySelector('.ytp-caption-window-container');
      if (captionContainer) {
        observer.observe(captionContainer, {
          childList: true,
          subtree: true,
          characterData: true
        });
        console.log('[UniShare] 正在觀察 YouTube 字幕容器');
        return true;
      }
      return false;
    };
    
    // Keep trying until found
    if (!findAndObserve()) {
      const retryInterval = setInterval(() => {
        if (findAndObserve()) {
          clearInterval(retryInterval);
        }
      }, 1000);
      
      // Stop trying after 30 seconds
      setTimeout(() => clearInterval(retryInterval), 30000);
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (settings.enabled) {
        init();
        observeYouTubeCaptions();
      }
    });
  } else {
    if (settings.enabled) {
      init();
      observeYouTubeCaptions();
    }
  }

  // Re-initialize on YouTube navigation
  document.addEventListener('yt-navigate-finish', () => {
    console.log('[UniShare] YouTube 導航完成，重新初始化...');
    lastCaptionText = '';
    currentTranslation = '';
    if (settings.enabled) {
      init();
      observeYouTubeCaptions();
    }
  });

  // Also handle regular page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && settings.enabled) {
      startCaptionMonitor();
    }
  });

})();
