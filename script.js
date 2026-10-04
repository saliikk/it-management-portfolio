(() => {
  "use strict";
  const originalData = window.PORTFOLIO_CONTENT;
  const STORAGE_KEY = "teamPortfolioDraft_v1";
  let data;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    data = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(originalData));
  } catch (_) {
    data = JSON.parse(JSON.stringify(originalData));
  }
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
  const dialog = $("#detail-dialog");
  const dialogContent = $("#dialog-content");
  const toast = $("#toast");

  $("#course-label").textContent = data.course;
  $("#term-label").textContent = data.term;
  $("#hero-description").textContent = data.heroDescription;
  $("#about-copy").textContent = data.about;

  function portrait(member, extraClass = "") {
    const image = member.photo
      ? `<img src="${escapeHTML(member.photo)}" alt="Portrait of ${escapeHTML(member.name)}" loading="lazy" onerror="this.remove();this.nextElementSibling.hidden=false">`
      : "";
    return `<div class="portrait ${extraClass}">${image}<div class="portrait-placeholder" ${member.photo ? "hidden" : ""}><span class="initials">${escapeHTML(member.initials || member.name.split(/\s+/).map(n=>n[0]).slice(0,2).join(""))}</span><small>ADD PHOTO</small></div><span class="member-number">${escapeHTML(member.number || "")}</span></div>`;
  }

  $("#work-grid").innerHTML = data.sharedWork.map((work, index) => `
    <article class="work-card reveal" tabindex="0" role="button" aria-label="Read more about ${escapeHTML(work.title)}" data-work="${index}" style="--card-glow:${escapeHTML(work.glow || "rgba(168,85,247,.16)")}">
      <div class="card-top"><span>${escapeHTML(work.number)} / ${escapeHTML(work.category)}</span><span class="card-symbol">${escapeHTML(work.symbol)}</span></div>
      <h3>${escapeHTML(work.title)}</h3><p>${escapeHTML(work.description)}</p><span class="card-link" aria-hidden="true">↗</span>
    </article>`).join("");

  $("#member-grid").innerHTML = data.members.map(member => `
    <article class="member-card reveal" tabindex="0" role="button" aria-label="Open ${escapeHTML(member.name)}'s profile" data-member="${escapeHTML(member.id)}">
      ${portrait(member)}
      <h3 class="member-name">${escapeHTML(member.name)}</h3><div class="member-role">${escapeHTML(member.role)}</div>
      <div class="member-footer"><span>VIEW PROFILE</span><span class="member-arrow" aria-hidden="true">↗</span></div>
    </article>`).join("");

  $("#social-links").innerHTML = data.socials.map(link => `
    <a href="${escapeHTML(link.url)}" ${link.url.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}>${escapeHTML(link.label)}</a>`).join("");

  function openWork(work) {
    dialogContent.innerHTML = `
      <p class="eyebrow">${escapeHTML(work.number)} / ${escapeHTML(work.category)}</p>
      <h2 id="dialog-title">${escapeHTML(work.title)}</h2>
      <p class="dialog-lead">${escapeHTML(work.description)}</p>
      <p>${escapeHTML(work.detail)}</p>
      <h3>What to include</h3><ul>${work.tasks.map(task => `<li>${escapeHTML(task)}</li>`).join("")}</ul>`;
    dialog.showModal();
  }

  function openMember(member) {
    dialogContent.innerHTML = `
      <div class="dialog-profile">${portrait(member)}
        <div><p class="eyebrow">TEAM MEMBER / ${escapeHTML(member.number)}</p>
        <h2 id="dialog-title">${escapeHTML(member.name)}</h2>
        <p class="dialog-lead">${escapeHTML(member.role)}</p><p>${escapeHTML(member.bio)}</p>
        <div class="tag-list">${(member.skills || []).map(skill => `<span class="tag">${escapeHTML(skill)}</span>`).join("")}</div></div>
      </div>
      <h3>Tasks & contributions</h3><ul>${(member.contributions || []).map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul>
      <h3>Individual takeaway</h3><p>${escapeHTML(member.takeaway || "Add a personal reflection here.")}</p>`;
    dialog.showModal();
  }

  function activateCard(card) {
    if (card.dataset.member) {
      const member = data.members.find(item => item.id === card.dataset.member);
      if (member) openMember(member);
    } else if (card.dataset.work !== undefined) {
      const work = data.sharedWork[Number(card.dataset.work)];
      if (work) openWork(work);
    }
  }
  document.addEventListener("click", event => {
    const card = event.target.closest("[data-member], [data-work]");
    if (card) activateCard(card);
  });
  document.addEventListener("keydown", event => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-member], [data-work]")) {
      event.preventDefault(); activateCard(event.target);
    }
  });

  $(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });

  const menuToggle = $(".menu-toggle");
  const nav = $(".desktop-nav");
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open"); menuToggle.setAttribute("aria-expanded", "false");
  }));

  const revealObserver = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .12 }) : null;
  document.querySelectorAll(".reveal").forEach(element => {
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add("is-visible");
  });

  // Browser-based content editor. Saves a draft locally and exports deployable content.
  const editorDialog = $("#editor-dialog");
  const editorForm = $("#editor-form");
  const sectionSelect = $("#editor-section");
  const itemSelect = $("#editor-item");
  const itemLabel = $("#editor-item-label");
  const field = (label, key, value, options = {}) => {
    const type = options.type || "input";
    const full = options.full ? " full" : "";
    const hint = options.hint ? `<small>${escapeHTML(options.hint)}</small>` : "";
    const input = type === "textarea"
      ? `<textarea name="${escapeHTML(key)}" ${options.rows ? `rows="${options.rows}"` : ""}>${escapeHTML(value ?? "")}</textarea>`
      : `<input name="${escapeHTML(key)}" type="text" value="${escapeHTML(value ?? "")}" ${options.placeholder ? `placeholder="${escapeHTML(options.placeholder)}"` : ""}>`;
    return `<div class="editor-field${full}"><label for="field-${escapeHTML(key)}">${escapeHTML(label)}</label>${input.replace(`name="${escapeHTML(key)}"`, `id="field-${escapeHTML(key)}" name="${escapeHTML(key)}"`)}${hint}</div>`;
  };
  const arrayToText = value => Array.isArray(value) ? value.join("\n") : (value || "");
  const textToArray = value => value.split("\n").map(line => line.trim()).filter(Boolean);

  function populateItemSelect() {
    const section = sectionSelect.value;
    let items = [];
    if (section === "members") items = data.members.map(item => ({ value: item.id, label: item.name }));
    if (section === "work") items = data.sharedWork.map((item, index) => ({ value: String(index), label: item.title }));
    if (section === "socials") items = data.socials.map((item, index) => ({ value: String(index), label: item.label }));
    itemSelect.innerHTML = items.map(item => `<option value="${escapeHTML(item.value)}">${escapeHTML(item.label)}</option>`).join("");
    const hasItems = items.length > 0;
    itemSelect.disabled = !hasItems;
    itemLabel.hidden = !hasItems;
    itemSelect.hidden = !hasItems;
    renderEditorForm();
  }

  function renderEditorForm() {
    const section = sectionSelect.value;
    const selected = itemSelect.value;
    let markup = "";
    if (section === "site") {
      markup = field("Course label", "course", data.course) +
        field("Term / year label", "term", data.term) +
        field("Hero description", "heroDescription", data.heroDescription, { type: "textarea", full: true }) +
        field("About section text", "about", data.about, { type: "textarea", full: true });
    } else if (section === "members") {
      const member = data.members.find(item => item.id === selected);
      if (!member) { editorForm.innerHTML = '<p class="editor-intro">No team members found.</p>'; return; }
      markup = field("Full name", "name", member.name) +
        field("Role / focus", "role", member.role) +
        field("Photo path or image URL", "photo", member.photo, { hint: 'Example: assets/salik-ahmad.jpg. Upload local photos into the assets folder.' }) +
        field("Initials shown when there is no photo", "initials", member.initials) +
        field("Short biography", "bio", member.bio, { type: "textarea", full: true }) +
        field("Tasks and contributions — one per line", "contributions", arrayToText(member.contributions), { type: "textarea", full: true, rows: 5 }) +
        field("Skills — one per line", "skills", arrayToText(member.skills), { type: "textarea", full: true, rows: 3 }) +
        field("Individual takeaway", "takeaway", member.takeaway, { type: "textarea", full: true });
    } else if (section === "work") {
      const work = data.sharedWork[Number(selected)];
      if (!work) { editorForm.innerHTML = '<p class="editor-intro">No shared work found.</p>'; return; }
      markup = field("Title", "title", work.title) +
        field("Category", "category", work.category) +
        field("Short description", "description", work.description, { type: "textarea", full: true }) +
        field("Long detail", "detail", work.detail, { type: "textarea", full: true }) +
        field("Tasks / checklist — one per line", "tasks", arrayToText(work.tasks), { type: "textarea", full: true, rows: 5 }) +
        field("Card symbol", "symbol", work.symbol) +
        field("Card number", "number", work.number);
    } else if (section === "socials") {
      const social = data.socials[Number(selected)];
      if (!social) { editorForm.innerHTML = '<p class="editor-intro">No social links found.</p>'; return; }
      markup = field("Link label", "label", social.label) +
        field("URL", "url", social.url, { full: true, hint: "Use https://... or mailto:..." });
    }
    editorForm.innerHTML = markup;
  }

  function applyEditorFields() {
    const values = Object.fromEntries(new FormData(editorForm).entries());
    const section = sectionSelect.value;
    if (section === "site") {
      Object.assign(data, values);
    } else if (section === "members") {
      const member = data.members.find(item => item.id === itemSelect.value);
      if (member) {
        Object.assign(member, values);
        member.contributions = textToArray(values.contributions || "");
        member.skills = textToArray(values.skills || "");
      }
    } else if (section === "work") {
      const work = data.sharedWork[Number(itemSelect.value)];
      if (work) {
        Object.assign(work, values);
        work.tasks = textToArray(values.tasks || "");
      }
    } else if (section === "socials") {
      const social = data.socials[Number(itemSelect.value)];
      if (social) Object.assign(social, values);
    }
  }

  function renderEverything() {
    $("#course-label").textContent = data.course;
    $("#term-label").textContent = data.term;
    $("#hero-description").textContent = data.heroDescription;
    $("#about-copy").textContent = data.about;
    $("#work-grid").innerHTML = data.sharedWork.map((work, index) => `
      <article class="work-card reveal is-visible" tabindex="0" role="button" aria-label="Read more about ${escapeHTML(work.title)}" data-work="${index}" style="--card-glow:${escapeHTML(work.glow || "rgba(168,85,247,.16)")}">
        <div class="card-top"><span>${escapeHTML(work.number)} / ${escapeHTML(work.category)}</span><span class="card-symbol">${escapeHTML(work.symbol)}</span></div>
        <h3>${escapeHTML(work.title)}</h3><p>${escapeHTML(work.description)}</p><span class="card-link" aria-hidden="true">↗</span>
      </article>`).join("");
    $("#member-grid").innerHTML = data.members.map(member => `
      <article class="member-card reveal is-visible" tabindex="0" role="button" aria-label="Open ${escapeHTML(member.name)}'s profile" data-member="${escapeHTML(member.id)}">
        ${portrait(member)}
        <h3 class="member-name">${escapeHTML(member.name)}</h3><div class="member-role">${escapeHTML(member.role)}</div>
        <div class="member-footer"><span>VIEW PROFILE</span><span class="member-arrow" aria-hidden="true">↗</span></div>
      </article>`).join("");
    $("#social-links").innerHTML = data.socials.map(link => `
      <a href="${escapeHTML(link.url)}" ${link.url.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}>${escapeHTML(link.label)}</a>`).join("");
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    window.setTimeout(() => toast.classList.remove("visible"), 2800);
  }
  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = filename; anchor.click();
    URL.revokeObjectURL(url);
  }

  $("#open-editor").addEventListener("click", () => {
    populateItemSelect();
    editorDialog.showModal();
  });
  $("#close-editor").addEventListener("click", () => editorDialog.close());
  editorDialog.addEventListener("click", event => {
    if (event.target === editorDialog) editorDialog.close();
  });
  sectionSelect.addEventListener("change", populateItemSelect);
  itemSelect.addEventListener("change", renderEditorForm);

  $("#save-editor").addEventListener("click", () => {
    applyEditorFields();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      renderEverything();
      populateItemSelect();
      showToast("Changes saved in this browser.");
    } catch (_) {
      showToast("Could not save locally. Export content.js instead.");
    }
  });
  $("#export-json").addEventListener("click", () => {
    applyEditorFields();
    downloadFile("portfolio-content.json", JSON.stringify(data, null, 2), "application/json;charset=utf-8");
    showToast("JSON content exported.");
  });
  $("#export-js").addEventListener("click", () => {
    applyEditorFields();
    const content = "/* Exported from the Team Portfolio editor. */\nwindow.PORTFOLIO_CONTENT = " + JSON.stringify(data, null, 2) + ";\n";
    downloadFile("content.js", content, "text/javascript;charset=utf-8");
    showToast("content.js exported. Replace the repository file to publish.");
  });
  $("#reset-editor").addEventListener("click", () => {
    if (!window.confirm("Discard this browser's saved draft and reload the original content?")) return;
    localStorage.removeItem(STORAGE_KEY);
    data = JSON.parse(JSON.stringify(originalData));
    renderEverything();
    populateItemSelect();
    showToast("Local draft discarded.");
  });
})();
