(function () {
  var user = UI.requireParticipant();
  if (!user) return;
  UI.renderHeader();

  var entries = Store.entriesFor(user.id);

  if (entries.length === 0) {
    document.getElementById("empty").hidden = false;
    return;
  }

  var intro = document.getElementById("intro");
  intro.textContent = entries.length + " " + (entries.length === 1 ? "entry" : "entries") + ", newest first. Only you can read them.";
  intro.hidden = false;
  document.getElementById("write-button").hidden = false;

  var list = document.getElementById("entry-list");
  list.hidden = false;
  list.innerHTML = entries.map(function (e) {
    var category = CATEGORIES.find(function (c) { return c.value === e.category; });
    return (
      '<li><a class="entry-link" href="entry.html?id=' + encodeURIComponent(e.id) + '">' +
        "<span>" +
          '<span class="title">' + UI.esc(e.title) + "</span>" +
          '<span class="meta">' +
            '<span class="swatch" style="background:' + category.color + '" aria-hidden="true"></span>' +
            category.label + ' <span aria-hidden="true">·</span> ' +
            labelOf(ENTRY_KINDS, e.kind) + ' <span aria-hidden="true">·</span> ' +
            "Feels " + INTENSITY_LABELS[e.intensity - 1].toLowerCase() +
          "</span>" +
        "</span>" +
        '<time class="date" datetime="' + e.createdAt + '">' + UI.formatDate(e.createdAt) + "</time>" +
      "</a></li>"
    );
  }).join("");
})();
