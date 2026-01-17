// ------------------------------
// TUTORIAL ENGINE
// ------------------------------

window.TUTORIAL = {
  stepIndex: 0,

  start() {
    this.showStep(0);
    RENDER.addBotMessage(MESSAGES.bot.welcome);
  },

  showStep(index) {
    this.stepIndex = index;
    const step = TUTORIAL_STEPS[index];

    if (!step) return;

    RENDER.addBotMessage(step.message);

    if (step.button) {
      this.renderButton(step.button.text, step.button.action);
    }

    if (step.highlightCommand) {
      RENDER.addBotMessage(`Required command: **${CONFIG.requiredCommand}**`);
    }
  },

  renderButton(text, action) {
    const container = document.getElementById("messages");

    const btn = document.createElement("div");
    btn.className = "message-text";
    btn.style.marginTop = "8px";
    btn.style.padding = "8px 12px";
    btn.style.background = "var(--accent)";
    btn.style.borderRadius = "6px";
    btn.style.display = "inline-block";
    btn.style.cursor = "pointer";
    btn.textContent = text;

    btn.onclick = () => this[action]();

    container.appendChild(btn);
  },

  // ------------------------------
  // Step Actions
  // ------------------------------

  openExternalAppLink() {
    window.open(CONFIG.externalAppLink, "_blank");
    this.nextStep();
  },

  highlightTestingServer() {
    this.nextStep();
  },

  highlightMainServer() {
    this.nextStep();
  },

  // ------------------------------
  // Event Handlers
  // ------------------------------

  onServerSwitch(serverKey) {
    const step = TUTORIAL_STEPS[this.stepIndex];

    if (step && step.action === "highlightTestingServer" && serverKey === "testing") {
      this.nextStep();
    }

    if (step && step.action === "highlightMainServer" && serverKey === "main") {
      this.nextStep();
    }
  },

  onChannelSwitch(channelName) {
    // No special logic yet
  },

  onUserMessage(text) {
    const step = TUTORIAL_STEPS[this.stepIndex];

    if (step && step.highlightCommand) {
      if (text === CONFIG.requiredCommand) {
        RENDER.addBotMessage(MESSAGES.bot.success);
        this.nextStep();
      } else {
        RENDER.addBotMessage(MESSAGES.bot.wrongCommand);
      }
    }
  },

  nextStep() {
    this.showStep(this.stepIndex + 1);
  }
};

window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => TUTORIAL.start(), 300);
});
