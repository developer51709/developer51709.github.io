// ------------------------------
// RENDERER
// ------------------------------

window.RENDER = {
  servers() {
    const list = document.getElementById("server-list");
    list.innerHTML = "";

    const serverKeys = ["testing", "main"];

    serverKeys.forEach((key) => {
      const div = document.createElement("div");
      div.className = "server-icon";
      div.textContent = key === "testing" ? "T" : "M";

      div.onclick = () => UI.switchServer(key);

      list.appendChild(div);
    });
  },

  channels(serverKey) {
    const container = document.getElementById("channel-list");
    container.innerHTML = "";

    const server = window.SERVERS[serverKey];

    // Testing server (no categories)
    if (server.channels) {
      server.channels.forEach((ch) => {
        container.appendChild(this.channelElement(ch));
      });
      return;
    }

    // Main server (with categories)
    server.categories.forEach((cat) => {
      const label = document.createElement("div");
      label.className = "category-label";
      label.textContent = cat.name;
      container.appendChild(label);

      cat.channels.forEach((ch) => {
        container.appendChild(this.channelElement(ch));
      });
    });
  },

  channelElement(channel) {
    const div = document.createElement("div");
    div.className = "channel";

    const icon = document.createElement("span");
    icon.className = `channel-icon ${channel.type}`;
    div.appendChild(icon);

    const name = document.createElement("span");
    name.textContent = channel.name;
    div.appendChild(name);

    div.onclick = () => UI.switchChannel(channel.name);

    return div;
  },

  chatHeader(serverKey, channelName = null) {
    const header = document.getElementById("chat-header");

    if (!channelName) {
      header.textContent = window.SERVERS[serverKey].name;
    } else {
      header.textContent = `# ${channelName}`;
    }
  },

  clearMessages() {
    document.getElementById("messages").innerHTML = "";
  },

  addBotMessage(text) {
    const container = document.getElementById("messages");

    const msg = document.createElement("div");
    msg.className = "message";

    msg.innerHTML = `
      <span class="message-author">${CONFIG.botName}</span>
      <span class="message-text">${text}</span>
    `;

    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  },

  addUserMessage(text) {
    const container = document.getElementById("messages");

    const msg = document.createElement("div");
    msg.className = "message";

    msg.innerHTML = `
      <span class="message-author">You</span>
      <span class="message-text">${text}</span>
    `;

    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }
};
