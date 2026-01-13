// -----------------------------
// Formatting Engine
// -----------------------------
function formatEmbedText(text) {
    if (!text) return "";

    // Escape HTML
    text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Blockquotes
    text = text.replace(/^> (.*)$/gm, `<blockquote>$1</blockquote>`);

    // Code blocks ```
    text = text.replace(/```([\s\S]*?)```/g, (m, code) => `<pre>${code}</pre>`);

    // Inline code `
    text = text.replace(/`([^`]+)`/g, `<code>$1</code>`);

    // Spoilers
    text = text.replace(/\|\|([^|]+)\|\|/g, `<span class="spoiler" onclick="this.classList.add('revealed')">$1</span>`);

    // Bold + italic ***
    text = text.replace(/\*\*\*([^*]+)\*\*\*/g, `<strong><em>$1</em></strong>`);

    // Bold **
    text = text.replace(/\*\*([^*]+)\*\*/g, `<strong>$1</strong>`);

    // Italic * or _
    text = text.replace(/(\*([^*]+)\*)|(_([^_]+)_)/g, (m, p1, p2, p3, p4) => `<em>${p2 || p4}</em>`);

    // Underline __
    text = text.replace(/__([^_]+)__/g, `<span style="text-decoration: underline;">$1</span>`);

    // Strikethrough ~~
    text = text.replace(/~~([^~]+)~~/g, `<span style="text-decoration: line-through;">$1</span>`);

    // Links [text](url)
    text = text.replace(/

\[([^\]

]+)\]

\((https?:\/\/[^\)]+)\)/g,
        `<a href="$2" target="_blank" style="color:#00aff4; text-decoration:none;">$1</a>`
    );

    return text;
}

// -----------------------------
// Live Preview
// -----------------------------
function updatePreview() {
    const title = document.getElementById("title").value;
    const desc = document.getElementById("description").value;
    const color = document.getElementById("color").value;
    const thumbnail = document.getElementById("thumbnail").value;
    const image = document.getElementById("image").value;
    const footer = document.getElementById("footer").value;
    const footerIcon = document.getElementById("footerIcon").value;

    document.getElementById("pTitle").textContent = title || "Your title here";
    document.getElementById("pDescription").innerHTML = formatEmbedText(desc) || "Your description here";

    document.querySelector(".embed").style.borderColor = color || "#5865F2";

    const thumbEl = document.getElementById("pThumbnail");
    thumbEl.style.display = thumbnail ? "block" : "none";
    if (thumbnail) thumbEl.src = thumbnail;

    const imgEl = document.getElementById("pImage");
    imgEl.style.display = image ? "block" : "none";
    if (image) imgEl.src = image;

    const footerEl = document.getElementById("pFooter");
    footerEl.innerHTML = "";
    if (footerIcon) {
        const icon = document.createElement("img");
        icon.src = footerIcon;
        footerEl.appendChild(icon);
    }
    if (footer) {
        const text = document.createElement("span");
        text.textContent = footer;
        footerEl.appendChild(text);
    }

    renderFieldsPreview();
}

// -----------------------------
// Fields Preview Rendering
// -----------------------------
function renderFieldsPreview() {
    const pFields = document.getElementById("pFields");
    pFields.innerHTML = "";

    const fields = [...document.querySelectorAll(".field")];

    fields.forEach(f => {
        const name = f.querySelector(".field-name").value;
        const value = f.querySelector(".field-value").value;
        const inline = f.querySelector(".field-inline").checked;

        if (!name && !value) return;

        const div = document.createElement("div");
        div.className = "embed-field";
        if (!inline) div.style.flex = "1 1 100%";

        const nameEl = document.createElement("div");
        nameEl.className = "embed-field-name";
        nameEl.textContent = name || "\u200b";

        const valueEl = document.createElement("div");
        valueEl.className = "embed-field-value";
        valueEl.innerHTML = formatEmbedText(value) || "\u200b";

        div.appendChild(nameEl);
        div.appendChild(valueEl);
        pFields.appendChild(div);
    });
}

// -----------------------------
// Field Management
// -----------------------------
let fieldCount = 0;

function addField() {
    const container = document.getElementById("fieldsContainer");

    const field = document.createElement("div");
    field.className = "field";
    field.draggable = true;
    field.dataset.index = fieldCount++;

    field.innerHTML = `
        <div class="field-row">
            <input type="text" placeholder="Field Name" class="field-name" oninput="updatePreview()">
            <input type="text" placeholder="Field Value" class="field-value" oninput="updatePreview()">
        </div>
        <label style="font-size: 13px;">
            <input type="checkbox" class="field-inline" onchange="updatePreview()" style="width:auto; margin-right:6px;">
            Inline
        </label>
        <div class="remove-btn" onclick="this.parentElement.remove(); updatePreview()">Remove Field</div>
    `;

    enableDrag(field);
    container.appendChild(field);
    updatePreview();
}

function enableDrag(field) {
    field.addEventListener("dragstart", () => field.classList.add("dragging"));
    field.addEventListener("dragend", () => {
        field.classList.remove("dragging");
        updatePreview();
    });

    const container = document.getElementById("fieldsContainer");
    if (!container.dataset.dragBound) {
        container.addEventListener("dragover", e => {
            e.preventDefault();
            const dragging = document.querySelector(".field.dragging");
            if (!dragging) return;
            const after = getDragAfterElement(container, e.clientY);
            if (after == null) container.appendChild(dragging);
            else container.insertBefore(dragging, after);
        });
        container.dataset.dragBound = "true";
    }
}

function getDragAfterElement(container, y) {
    const elements = [...container.querySelectorAll(".field:not(.dragging)")];

    return elements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        return offset < 0 && offset > closest.offset
            ? { offset, element: child }
            : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// -----------------------------
// Webhook Sending
// -----------------------------
function collectFieldsForWebhook() {
    return [...document.querySelectorAll(".field")].map(f => ({
        name: f.querySelector(".field-name").value,
        value: f.querySelector(".field-value").value,
        inline: f.querySelector(".field-inline").checked
    })).filter(f => f.name || f.value);
}

function sendEmbed() {
    const webhook = document.getElementById("webhook").value.trim();
    if (!webhook) return alert("Please enter a webhook URL.");

    const colorHex = document.getElementById("color").value.trim() || "#5865F2";
    let colorInt = parseInt(colorHex.replace("#", ""), 16);
    if (isNaN(colorInt)) colorInt = parseInt("5865F2", 16);

    const embed = {
        title: document.getElementById("title").value || null,
        description: document.getElementById("description").value || null,
        color: colorInt,
        thumbnail: { url: document.getElementById("thumbnail").value || null },
        image: { url: document.getElementById("image").value || null },
        footer: {
            text: document.getElementById("footer").value || null,
            icon_url: document.getElementById("footerIcon").value || null
        },
        fields: collectFieldsForWebhook()
    };

    if (!embed.thumbnail.url) delete embed.thumbnail;
    if (!embed.image.url) delete embed.image;
    if (!embed.footer.text && !embed.footer.icon_url) delete embed.footer;
    if (!embed.fields.length) delete embed.fields;

    fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] })
    })
    .then(res => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        alert("Announcement sent!");
    })
    .catch(err => alert("Error sending announcement: " + err.message));
}

// Initialize with one field
addField();
