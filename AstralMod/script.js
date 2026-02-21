// Mobile menu
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");

menuBtn.addEventListener("click", () => {
  mobileMenu.classList.toggle("open");
});

// Commands Page Logic
if (document.getElementById("commandsContainer")) {
  fetch("commands.json")
    .then(res => res.json())
    .then(commands => {
      const container = document.getElementById("commandsContainer");
      const searchInput = document.getElementById("searchInput");
      const categoryFilter = document.getElementById("categoryFilter");

      function render() {
        const search = searchInput.value.toLowerCase();
        const category = categoryFilter.value;

        container.innerHTML = "";

        commands
          .filter(cmd =>
            (category === "all" || cmd.category === category) &&
            (cmd.name.toLowerCase().includes(search) ||
             cmd.description.toLowerCase().includes(search))
          )
          .forEach(cmd => {
            const card = document.createElement("div");
            card.className = "command-card";
            card.innerHTML = `
              <h2>${cmd.name}</h2>
              <p><strong>Prefix:</strong> ${cmd.prefix}</p>
              <p><strong>Aliases:</strong> ${cmd.aliases.join(", ")}</p>
              <p><strong>Slash:</strong> ${cmd.slash ? "Yes" : "No"}</p>
              <p><strong>Category:</strong> ${cmd.category}</p>
              <p>${cmd.description}</p>
              <p><strong>Usage:</strong></p>
              <pre>${cmd.usage.join("\n")}</pre>
            `;
            container.appendChild(card);
          });
      }

      searchInput.addEventListener("input", render);
      categoryFilter.addEventListener("change", render);
      render();
    });
}
