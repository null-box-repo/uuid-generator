// منطق تطبيق توليد المعرّفات: إنشاء UUID عشوائي آمن مع دعم إصدارات متعددة.
(() => {
  "use strict";

  const state = {
    quantity: 1,
    uppercase: false,
    version: "4",
    values: []
  };

  const resultStack = document.getElementById("resultStack");
  const resultStage = document.getElementById("resultStage");
  const generateButton = document.getElementById("generateButton");
  const copyAllButton = document.getElementById("copyAllButton");
  const uppercaseToggle = document.getElementById("uppercaseToggle");
  const themeToggle = document.getElementById("themeToggle");
  const themeLabel = document.getElementById("themeLabel");
  const versionBadge = document.getElementById("versionBadge");
  const versionTrigger = document.getElementById("versionTrigger");
  const versionTriggerLabel = document.getElementById("versionTriggerLabel");
  const versionDialog = document.getElementById("versionDialog");
  const dialogClose = document.getElementById("dialogClose");
  const quantityInput = document.getElementById("quantityInput");
  const toast = document.getElementById("toast");

  function createUUID(version = state.version) {
    if (version === "4" && window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | (version === "7" ? 0x70 : version === "1" ? 0x10 : 0x40);
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex[4].slice(0, 4)}-${hex[4].slice(4)}${hex[5].slice(0, 2)}-${hex[5].slice(2)}${hex[6].slice(0, 2)}-${hex.slice(6).join("")}`;
  }

  function display(value) {
    return state.uppercase ? value.toUpperCase() : value;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function renderResults() {
    resultStack.classList.toggle("is-list", state.values.length > 1);
    resultStack.innerHTML = state.values.map((value, index) => `
      <div class="result-row">
        <code>${display(value)}</code>
        <button class="copy-button" type="button" data-copy="${value}" aria-label="Copy UUID ${index + 1}">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>
      </div>
    `).join("");

    copyAllButton.classList.toggle("hidden", state.values.length < 2);
    copyAllButton.textContent = `Copy all (${state.values.length})`;
    const copyIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    copyIcon.setAttribute("class", "icon");
    copyIcon.setAttribute("viewBox", "0 0 24 24");
    copyIcon.innerHTML = '<rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>';
    copyAllButton.prepend(copyIcon);
  }

  function generate() {
    state.values = Array.from({ length: state.quantity }, () => createUUID(state.version));
    renderResults();
    resultStage.classList.remove("flash");
    void resultStage.offsetWidth;
    resultStage.classList.add("flash");
  }

  async function copyValue(value, label = "UUID") {
    try {
      await navigator.clipboard.writeText(display(value));
      showToast(`${label} copied to clipboard`);
    } catch {
      const helper = document.createElement("textarea");
      helper.value = display(value);
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
      showToast(`${label} copied to clipboard`);
    }
  }

  function updateTheme() {
    const light = document.documentElement.classList.contains("light");
    themeLabel.textContent = light ? "Dark" : "Light";
    themeToggle.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
  }

  function selectVersion(version) {
    state.version = version;
    const labels = { "1": "UUID v1 - Timestamp", "4": "UUID v4 - Random", "7": "UUID v7 - Time-ordered" };
    const shortLabels = { "1": "v1 / Timestamp", "4": "v4 / Random", "7": "v7 / Time-ordered" };
    versionTriggerLabel.textContent = labels[version];
    versionBadge.textContent = shortLabels[version];
    document.querySelectorAll(".version-option").forEach((opt) => {
      opt.classList.toggle("selected", opt.dataset.version === version);
    });
    generate();
  }

  versionTrigger.addEventListener("click", () => {
    versionDialog.showModal();
  });

  dialogClose.addEventListener("click", () => {
    versionDialog.close();
  });

  versionDialog.addEventListener("click", (event) => {
    if (event.target === versionDialog) {
      versionDialog.close();
    }
  });

  document.querySelectorAll(".version-option").forEach((option) => {
    option.addEventListener("click", () => {
      selectVersion(option.dataset.version);
      versionDialog.close();
    });
  });

  quantityInput.addEventListener("input", () => {
    let val = parseInt(quantityInput.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 100) val = 100;
    state.quantity = val;
  });

  quantityInput.addEventListener("blur", () => {
    quantityInput.value = state.quantity;
  });

  resultStack.addEventListener("click", (event) => {
    const button = event.target.closest("[data-copy]");
    if (!button) return;
    button.classList.add("copied");
    copyValue(button.dataset.copy);
    window.setTimeout(() => button.classList.remove("copied"), 1800);
  });

  generateButton.addEventListener("click", generate);
  copyAllButton.addEventListener("click", () => copyValue(state.values.join("\n"), "UUIDs"));

  uppercaseToggle.addEventListener("click", () => {
    state.uppercase = !state.uppercase;
    uppercaseToggle.classList.toggle("on", state.uppercase);
    uppercaseToggle.setAttribute("aria-checked", String(state.uppercase));
    renderResults();
  });

  themeToggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("light");
    const mode = document.documentElement.classList.contains("light") ? "light" : "dark";
    window.localStorage.setItem("uuid-forge-theme", mode);
    updateTheme();
  });

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      generate();
    }
  });

  try {
    const savedTheme = window.localStorage.getItem("uuid-forge-theme");
    if (savedTheme === "light") document.documentElement.classList.add("light");
  } catch {}

  updateTheme();
  state.values = [createUUID(state.version)];
  renderResults();
})();
