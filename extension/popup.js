// Load saved settings
document.addEventListener('DOMContentLoaded', async () => {
  const settings = await chrome.storage.local.get({
    enabled: true,
    showEnglish: true,
    showChinese: true
  });
  
  document.getElementById('enableToggle').checked = settings.enabled;
  document.getElementById('showEnglish').checked = settings.showEnglish;
  document.getElementById('showChinese').checked = settings.showChinese;
  
  updateStatus(settings.enabled);
});

// Save settings when changed
document.getElementById('enableToggle').addEventListener('change', async (e) => {
  const enabled = e.target.checked;
  await chrome.storage.local.set({ enabled });
  updateStatus(enabled);
  
  // Notify content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'settingsChanged', enabled });
  }
});

document.getElementById('showEnglish').addEventListener('change', async (e) => {
  await chrome.storage.local.set({ showEnglish: e.target.checked });
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'settingsChanged', showEnglish: e.target.checked });
  }
});

document.getElementById('showChinese').addEventListener('change', async (e) => {
  await chrome.storage.local.set({ showChinese: e.target.checked });
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'settingsChanged', showChinese: e.target.checked });
  }
});

function updateStatus(enabled) {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  
  if (enabled) {
    statusDot.classList.remove('inactive');
    statusText.textContent = '已啟用';
  } else {
    statusDot.classList.add('inactive');
    statusText.textContent = '已停用';
  }
}

