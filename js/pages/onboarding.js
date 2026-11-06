(function () {
  var user = UI.requireUser();
  if (!user) return;
  if (user.role === "admin") return UI.go("admin.html");
  if (Store.hasCompletedOnboarding(user.id)) return UI.go("entries.html");

  UI.renderHeader(false);

  var form = document.getElementById("onboarding-form");
  document.getElementById("profile-fields").innerHTML = UI.profileFields();
  document.getElementById("ai-choice").hidden = !AI.available();

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var result = UI.readProfile(form);
    if (!form.consent.checked) result.errors.consent = "Your consent is needed before you can share an entry.";
    if (!UI.showErrors(form, result.errors)) return;

    Store.completeOnboarding(user.id, result.profile, AI.available() && form.aiConsent.checked);
    UI.go("write.html");
  });
})();
