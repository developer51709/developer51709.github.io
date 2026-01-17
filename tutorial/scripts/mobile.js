// ------------------------------
// MOBILE DRAWERS
// ------------------------------

window.MOBILE = {
  init() {
    this.createButtons();
  },

  createButtons() {
    const header = document.getElementById("chat-header");

    // Prevent duplicates
    if (header.querySelector(".mobile-menu-button")) return;

    // Server drawer button
    const serverBtn = document.createElement("span");
    serverBtn.className = "mobile-menu-button";
    serverBtn.textContent = "☰";
    serverBtn.onclick = () => this.toggleDrawer("server");

    // Channel drawer button
    const channelBtn = document.createElement("span");
    channelBtn.className = "mobile-menu-button";
    channelBtn.textContent = "≡";
    channelBtn.onclick = () => this.toggleDrawer("channel");

    header.prepend(serverBtn);
    header.appendChild(channelBtn);
  },

  toggleDrawer(type) {
    const drawer = document.getElementById(
      type === "server" ? "mobile-server-drawer" : "mobile-channel-drawer"
    );

    const backdrop = document.getElementById("mobile-backdrop");
    const isOpen = drawer.classList.contains("open");

    // Close drawer
    if (isOpen) {
      drawer.classList.remove("open");
      backdrop.classList.remove("open");
      return;
    }

    // Open drawer
    drawer.classList.add("open");
    backdrop.classList.add("open");

    // Clicking backdrop closes drawer
    backdrop.onclick = () => {
      drawer.classList.remove("open");
      backdrop.classList.remove("open");
    };

    // Populate drawer content
    drawer.innerHTML = document.getElementById(
      type === "server" ? "server-list" : "channel-list"
    ).innerHTML;

    // Re-bind click events inside drawer
    this.bindDrawerEvents(drawer, type);
  },

  bindDrawerEvents(drawer, type) {
    // ------------------------------
    // SERVER DRAWER
    // ------------------------------
    if (type === "server") {
      const icons = drawer.querySelectorAll(".server-icon");

      icons.forEach((icon, index) => {
        icon.onclick = () => {
          const serverKey = index === 0 ? "testing" : "main";

          UI.switchServer(serverKey);

          drawer.classList.remove("open");
          document.getElementById("mobile-backdrop").classList.remove("open");
        };
      });
    }

    // ------------------------------
    // CHANNEL DRAWER
    // ------------------------------
    if (type === "channel") {
      const channels = drawer.querySelectorAll(".channel");

      channels.forEach((ch) => {
        const name = ch.textContent.trim();

        ch.onclick = () => {
          UI.switchChannel(name);

          drawer.classList.remove("open");
          document.getElementById("mobile-backdrop").classList.remove("open");
        };
      });
    }
  }
};

window.addEventListener("DOMContentLoaded", () => MOBILE.init());
