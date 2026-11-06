(function () {
  var user = UI.requireParticipant();
  if (!user) return;
  UI.renderHeader();

  var consent = Store.getConsent(user.id);
  var entryCount = Store.entriesFor(user.id).length;

  document.getElementById("intro").textContent =
    "Signed in as " + user.email + ". Taking part since " + UI.formatDate(user.createdAt) + ".";

  // ----- Profile -----

  var profileForm = document.getElementById("profile-form");
  document.getElementById("profile-fields").innerHTML = UI.profileFields(Store.getProfile(user.id));

  profileForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var result = UI.readProfile(profileForm);
    UI.showMessage("profile-message", "");
    if (!UI.showErrors(profileForm, result.errors)) return;
    Store.saveProfile(user.id, result.profile);
    UI.showMessage("profile-message", "Profile saved.", "ok");
  });

  // ----- AI replies -----

  function renderAi() {
    var current = Store.getUser(user.id);
    var on = Boolean(current.aiRepliesConsentAt);
    document.getElementById("ai-status").textContent = on
      ? "On since " + UI.formatDate(current.aiRepliesConsentAt) + ". Each entry you open gets a short, supportive reply written by Claude, an AI from Anthropic. Your entry text is sent to Anthropic to write it."
      : "Off. Turn this on to get a short, supportive reply to each entry, written by Claude, an AI from Anthropic. Your entry text would be sent to Anthropic to write it.";
    var button = document.getElementById("ai-toggle");
    button.textContent = on ? "Turn off AI replies" : "Turn on AI replies";
    button.className = "btn mt-2 " + (on ? "btn-plain" : "btn-cloth");
    button.onclick = function () {
      Store.setAiReplies(user.id, !on);
      renderAi();
    };
  }

  if (AI.available()) {
    document.getElementById("ai-section").hidden = false;
    renderAi();
  }

  // ----- Consent and erasing -----

  document.getElementById("consent-status").innerHTML =
    "You consented on " + UI.formatDate(consent.grantedAt) + " to privacy notice version " + UI.esc(consent.policyVersion) +
    '. <a href="privacy.html">Read it again</a>.';
  document.getElementById("erase-explain").textContent =
    "Withdrawing your consent erases your account, your profile, and all " + entryCount + " " +
    (entryCount === 1 ? "entry" : "entries") +
    " you wrote. It can’t be undone. Combined results already published stay published, but can’t be traced back to you.";

  var eraseForm = document.getElementById("erase-form");
  eraseForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    var ok = await Store.checkPassword(user, eraseForm.password.value);
    if (!UI.showErrors(eraseForm, ok ? {} : { password: "That password is not correct." })) return;
    Store.eraseUser(user.id);
    UI.go("index.html?erased=1");
  });
})();
