(function () {
  var user = UI.requireParticipant();
  if (!user) return;
  UI.renderHeader();

  // With ?id=... this page edits an existing entry.
  var editId = UI.param("id");
  var entry = editId ? Store.getEntry(user.id, editId) : null;
  if (editId && !entry) return UI.go("entries.html");

  if (entry) {
    document.title = "Edit entry · SafeSpace";
    document.getElementById("page-title").textContent = "Edit entry";
    document.getElementById("page-intro").textContent = "Saving your changes replaces the AI reply, if you have one, with a new one.";
    document.getElementById("submit-button").textContent = "Save changes";
  }
  entry = entry || {};

  var kindOptions = ENTRY_KINDS.map(function (k) { return { value: k.value, label: k.label + ": " + k.hint.toLowerCase() }; });
  var intensityOptions = INTENSITY_LABELS.map(function (label, i) { return { value: String(i + 1), label: i + 1 + " · " + label }; });

  document.getElementById("kind-field").innerHTML = UI.choiceGroup({ name: "kind", legend: "What are you sharing?", options: kindOptions, value: entry.kind });
  document.getElementById("category-field").innerHTML = UI.choiceGroup({ name: "category", legend: "What is it mostly about?", options: CATEGORIES, value: entry.category });
  document.getElementById("intensity-field").innerHTML = UI.choiceGroup({ name: "intensity", legend: "How heavy does this feel right now?", options: intensityOptions, value: entry.intensity ? String(entry.intensity) : null });
  document.getElementById("feelings-field").innerHTML = UI.choiceGroup({ name: "feelings", legend: "Which feelings fit? (optional)", hint: "Choose up to four.", options: FEELINGS, multiple: true, value: entry.feelings });
  document.getElementById("told-field").innerHTML = UI.choiceGroup({ name: "toldAnyone", legend: "Have you told anyone about this?", options: TOLD_ANYONE, value: entry.toldAnyone });

  var form = document.getElementById("entry-form");
  var titleInput = document.getElementById("title");
  var bodyInput = document.getElementById("body");
  titleInput.value = entry.title || "";
  bodyInput.value = entry.body || "";
  UI.wordBudget(bodyInput, ENTRY_WORD_LIMIT);

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(form);
    var values = {
      kind: data.get("kind"),
      category: data.get("category"),
      title: titleInput.value.trim(),
      body: bodyInput.value.trim(),
      intensity: Number(data.get("intensity")),
      feelings: data.getAll("feelings"),
      toldAnyone: data.get("toldAnyone"),
    };

    var errors = {};
    if (!hasValue(ENTRY_KINDS, values.kind)) errors.kind = "Choose story or dilemma.";
    if (!hasValue(CATEGORIES, values.category)) errors.category = "Choose what this is mostly about.";
    if (!values.title) errors.title = "Give it a short title.";
    else if (values.title.length > 120) errors.title = "Keep the title under 120 characters.";
    if (!values.body) errors.body = "Write a few words first.";
    else if (UI.countWords(values.body) > ENTRY_WORD_LIMIT) errors.body = "Keep it within " + ENTRY_WORD_LIMIT + " words.";
    if (!(values.intensity >= 1 && values.intensity <= 5)) errors.intensity = "Choose how heavy this feels.";
    if (values.feelings.length > 4) errors.feelings = "Choose up to four feelings.";
    if (!hasValue(TOLD_ANYONE, values.toldAnyone)) errors.toldAnyone = "Choose an option.";
    if (!UI.showErrors(form, errors)) return;

    var saved = entry.id ? Store.updateEntry(user.id, entry.id, values) : Store.createEntry(user.id, values);
    if (!saved) return UI.showMessage("form-message", "That entry no longer exists.");
    UI.go("entry.html?id=" + encodeURIComponent(saved.id));
  });
})();
