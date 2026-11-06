if (UI.requireGuest()) {
  UI.renderHeader();

  var form = document.getElementById("register-form");
  UI.passwordToggles(form);

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    var email = form.email.value.trim().toLowerCase();
    var password = form.password.value;

    var errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
    else if (Store.findUserByEmail(email) || email === CONFIG.ADMIN_EMAIL.toLowerCase())
      errors.email = "An account with this email already exists. Sign in instead.";
    if (password.length < 10) errors.password = "Use at least 10 characters.";
    else if (password.length > 200) errors.password = "Use at most 200 characters.";
    if (form.confirmPassword.value !== password) errors.confirmPassword = "The passwords don't match.";
    if (!form.adult.checked) errors.adult = "You need to be 18 or older to take part.";
    if (!UI.showErrors(form, errors)) return;

    var user = await Store.createUser(email, password, "user");
    Store.signIn(user);
    UI.go("onboarding.html");
  });
}
