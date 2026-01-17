// ------------------------------
// MOBILE DRAWERS
// ------------------------------

window.MOBILE = {
  init() {
    this.createButtons();
  },

  createButtons() {
    const header = document.getElementById("chat-header");

    const serverBtn = document.createElement("span");
    serverBtn.className = "mobile-menu-button";
    serverBtn.textContent = "☰";
    serverBtn.onclick = () => this.toggleDrawer("server");

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

    drawer.classList.toggle("open");

    if (type === "server") {
      drawer.innerHTML = document.getElementById("server-list").innerHTML;
    } else {
      drawer.innerHTML = document.getElementById("channel-list").innerHTML;
    }
  }
};

window.addEventListener("DOMContentLoaded", () => MOBILE.init());
