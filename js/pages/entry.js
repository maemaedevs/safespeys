(function () {
  var user = UI.requireParticipant();
  if (!user) return;

  var entry = Store.getEntry(user.id, UI.param("id"));
  if (!entry) return UI.go("entries.html");
  UI.renderHeader();

  var category = CATEGORIES.find(function (c) { return c.value === entry.category; });
  var edited = new Date(entry.updatedAt) - new Date(entry.createdAt) > 60000;

  document.title = entry.title + " · SafeSpace";
  document.getElementById("entry-title").textContent = entry.title;
  document.getElementById("entry-meta").innerHTML =
    '<span class="swatch" style="background:' + category.color + '" aria-hidden="true"></span>' +
    category.label + ' <span aria-hidden="true">·</span> ' +
    labelOf(ENTRY_KINDS, entry.kind) + ' <span aria-hidden="true">·</span> ' +
    '<time datetime="' + entry.createdAt + '">' + UI.formatDate(entry.createdAt) + "</time>" +
    (edited ? ' <span class="faint">(edited)</span>' : "");
  document.getElementById("entry-body").textContent = entry.body;

  document.getElementById("fact-intensity").textContent = entry.intensity + " of 5 · " + INTENSITY_LABELS[entry.intensity - 1];
  document.getElementById("fact-feelings").textContent = entry.feelings.length
    ? entry.feelings.map(function (f) { return labelOf(FEELINGS, f); }).join(", ")
    : "None chosen";
  document.getElementById("fact-told").textContent = labelOf(TOLD_ANYONE, entry.toldAnyone);

  document.getElementById("edit-link").href = "write.html?id=" + encodeURIComponent(entry.id);
  document.getElementById("delete-button").addEventListener("click", function () {
    Store.deleteEntry(user.id, entry.id);
    UI.go("entries.html");
  });

  // ----- The AI reply -----

  var LABEL = "Written by an AI (Claude), not a counselor or doctor. It can be wrong.";
  var box = document.getElementById("reply");

  function showReply(reply) {
    box.innerHTML =
      '<div class="mt-1"><p class="smallcaps faint">' + LABEL + "</p>" +
      '<div class="prose-entry reply-text mt-2">' + UI.esc(reply.body) + "</div>" +
      '<div class="mt-4">' + UI.crisisLines(reply.crisisFlag) + "</div></div>";
  }

  if (!AI.available()) {
    box.innerHTML = '<p class="muted mt-1">AI replies are not available in this study right now.</p>';
    return;
  }
  if (!user.aiRepliesConsentAt) {
    box.innerHTML =
      '<p class="muted mt-1 measure">AI replies are off. You can switch them on in your <a href="account.html">account</a> ' +
      "if you would like a short, supportive reflection on what you write.</p>";
    return;
  }

  var saved = Store.getReply(entry.id);
  if (saved) return showReply(saved);

  box.innerHTML =
    '<div class="mt-1" role="status" aria-live="polite"><p class="smallcaps faint">' + LABEL + "</p>" +
    '<p class="muted mt-2">Writing a reply to what you shared. This usually takes a few seconds. Please keep this page open.</p>' +
    '<div class="skeleton measure mt-2" aria-hidden="true">' +
    '<span style="width:100%"></span><span style="width:94%"></span><span style="width:97%"></span><span style="width:62%"></span>' +
    "</div></div>";

  AI.generateReply(entry)
    .then(function (reply) {
      if (!reply) throw new Error("No reply was returned.");
      Store.saveReply(entry.id, reply);
      showReply(reply);
    })
    .catch(function (err) {
      console.error("AI reply failed", err);
      box.innerHTML =
        '<div class="mt-1 measure"><p class="muted">A reply couldn’t be written just now. Reload this page in a moment to try again.</p>' +
        '<div class="mt-3">' + UI.crisisLines(false) + "</div></div>";
    });
})();
