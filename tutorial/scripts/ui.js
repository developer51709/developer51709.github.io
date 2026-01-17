// ------------------------------
// UI ENGINE
// ------------------------------

window.UI = {
  currentServer: "testing",
  currentChannel: null,

  init() {
    this.applyTheme();
    this.renderServers();
    this.switchServer("testing");
    this.bindChatInput();
  },

  applyTheme() {
    const root = document.documentElement;
    const theme = window.THEME;

    root.style.setProperty("--bg", theme.colors.background);
    root.style.setProperty("--sidebar", theme.colors.sidebar);
    root.style.setProperty("--channelList", theme.colors.channelList);
    root.style.setProperty("--chat", theme.colors.chat);
    root.style.setProperty("--accent", theme.colors.accent);
    root.style.setProperty("--text", theme.colors.text);
    root.style.setProperty("--muted", theme.colors.muted);
    root.style.setProperty("--voice", theme.colors.voice);
    root.style.setProperty("--radius", theme.borderRadius);
  },

  renderServers() {
    RENDER.servers();
  },

  switchServer(serverKey) {
    this.currentServer = serverKey;
    RENDER.channels(serverKey);
    RENDER.chatHeader(serverKey);
    RENDER.clearMessages();
    TUTORIAL.onServerSwitch(serverKey);
  },

  switchChannel(channelName) {
    this.currentChannel = channelName;
    RENDER.chatHeader(this.currentServer, channelName);
    RENDER.clearMessages();
    TUTORIAL.onChannelSwitch(channelName);
  },

  bindChatInput() {
    const input = document.getElementById("chat-input-field");

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const text = input.value.trim();
        if (!text) return;

        RENDER.addUserMessage(text);
        input.value = "";

        TUTORIAL.onUserMessage(text);
      }
    });
  }
};

window.addEventListener("DOMContentLoaded", () => UI.init());
