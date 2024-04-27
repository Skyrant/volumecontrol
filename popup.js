document.addEventListener('DOMContentLoaded', () => {
  function settings() {
    browser.runtime.openOptionsPage().catch((error) => {
      console.error('Error opening options page:', error);
    });
  }
  
  document.getElementById('settings').addEventListener('click', settings);
});
function listenForEvents() {
  let currentVolume = 0;

  const browserApi = (typeof browser !== 'undefined') ? browser : chrome;

  function err(error) {
    console.error(`Volume Control: Error: ${error}`);
  }

  function formatValue(dB) {
    return `${dB >= 0 ? '+' : ''}${dB} dB`;
  }

  function setVolume(dB) {
    const slider = document.querySelector("#volume-slider");
    const text = document.querySelector("#volume-text");
    slider.value = dB;
    text.value = formatValue(dB);
    currentVolume = dB;
    browserApi.tabs.query({ active: true, currentWindow: true })
      .then(tabs => {
        browserApi.tabs.sendMessage(tabs[0].id, { command: "setVolume", dB })
          .catch(err);
      })
      .catch(err);
  }

  function updateVolume() {
    const slider = document.querySelector("#volume-slider");
    const text = document.querySelector("#volume-text");
    text.value = formatValue(slider.value);
  }

  function updateVolumeFromText() {
    const text = document.querySelector("#volume-text");
    const dB = text.value.match(/-?\d+/)?.[0];
    if (dB !== undefined) {
      const slider = document.querySelector("#volume-slider");
      slider.value = dB;
      updateVolume();
      setVolume(dB);
      text.setSelectionRange(text.selectionStart, text.selectionEnd);
    }
  }

  function updateVolumeFromSlider() {
    const slider = document.querySelector("#volume-slider");
    updateVolume();
    setVolume(slider.value);
  }

  function toggleMono() {
    const monoCheckbox = document.querySelector("#mono-checkbox");
    const mono = monoCheckbox.checked;
    browserApi.tabs.query({ active: true, currentWindow: true })
      .then(tabs => {
        browserApi.tabs.sendMessage(tabs[0].id, { command: "setMono", mono })
          .catch(err);
      })
      .catch(err);
  }

  function handleInputChange(event) {
    if (event.target.id === "volume-text") {
      updateVolumeFromText();
    } else if (event.target.id === "volume-slider") {
      updateVolumeFromSlider();
    } else if (event.target.id === "mono-checkbox") {
      toggleMono();
    }
  }

  function showError(error) {
    const popupContent = document.querySelector("#popup-content");
    const errorContent = document.querySelector("#error-content");
    popupContent.classList.add("hidden");
    errorContent.classList.remove("hidden");
    console.error(`Volume Control: Error: ${error.message}`);
  }

  browserApi.tabs.query({ active: true, currentWindow: true })
    .then(tabs => {
      if (tabs.length === 0) {
        showError("No audio playing.");
        return;
      }
      const volumeSlider = document.querySelector("#volume-slider");
      const volumeText = document.querySelector("#volume-text");
      const monoCheckbox = document.querySelector("#mono-checkbox");

      volumeSlider.addEventListener("input", updateVolumeFromSlider);
      volumeSlider.addEventListener("change", updateVolumeFromSlider);
      volumeText.addEventListener("input", updateVolumeFromText);
      monoCheckbox.addEventListener("change", toggleMono);
      document.addEventListener("change", handleInputChange);

      volumeSlider.focus();
      browserApi.tabs.sendMessage(tabs[0].id, { command: "getVolume" })
        .then((response) => {
          if (response && response.response !== undefined) {
            currentVolume = response.response;
            setVolume(currentVolume);
          } else {
            showError("Failed to get volume information.");
          }
        })
        .catch(err);
      browserApi.tabs.sendMessage(tabs[0].id, { command: "getMono" })
        .then((response) => {
          if (response && response.response !== undefined) {
            monoCheckbox.checked = response.response;
          } else {
            showError("Failed to get mono information.");
          }
        })
        .catch(err);
    })
    .catch(showError);
}

// --- skyrant ---

const urlFqdnRegex = /^(https?:\/\/)?([a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?)$/i;

document.getElementById('addFqdn').addEventListener('click', function() {
    const userInput = document.getElementById('newFqdn').value;
    if (isValidURL(userInput)) {
        const fqdn = new URL('http://' + userInput).hostname; // Normalize FQDN
        addFqdn(fqdn);
    } else {
        alert('Invalid URL or FQDN');
    }
    document.getElementById('newFqdn').value = ''; // Clear input field
});

document.getElementById('removeFqdn').addEventListener('click', function() {
    const select = document.getElementById('fqdnList');
    const fqdn = select.value;
    if (fqdn) {
        removeFqdn(fqdn);
    }
});

function addFqdn(fqdn) {
    browser.storage.local.get({ fqdns: [] })
        .then(data => {
            const { fqdns } = data;
            if (!fqdns.includes(fqdn)) {
                fqdns.push(fqdn);
                browser.storage.local.set({ fqdns }).then(updateFqdnList);
            }
        });
}

function removeFqdn(fqdn) {
    browser.storage.local.get({ fqdns: [] })
        .then(data => {
            const { fqdns } = data;
            const index = fqdns.indexOf(fqdn);
            if (index > -1) {
                fqdns.splice(index, 1);
                browser.storage.local.set({ fqdns }).then(updateFqdnList);
            }
        });
}

function isValidURL(urlString) {
    return urlFqdnRegex.test(urlString);
}

function updateFqdnList() {
    browser.storage.local.get({ fqdns: [] }).then(data => {
        const select = document.getElementById('fqdnList');
        select.innerHTML = '';
        data.fqdns.forEach(fqdn => {
            const option = document.createElement('option');
            option.value = fqdn;
            option.textContent = fqdn;
            select.appendChild(option);
        });
    });
}

// Initialize the list on load
updateFqdnList();
// --- skyrant ---

document.addEventListener("DOMContentLoaded", listenForEvents);
