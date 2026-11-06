if (UI.requireGuest()) {
  UI.renderHeader();

  var form = document.getElementById("login-form");
  var WRONG = "That email and password don't match an account.";

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    var email = form.email.value.trim().toLowerCase();
    var password = form.password.value;
    UI.showMessage("form-message", "");

    var errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Enter your password.";
    if (!UI.showErrors(form, errors)) return;

    // The researcher account comes from js/config.js.
    if (email === CONFIG.ADMIN_EMAIL.toLowerCase()) {
      if (password !== CONFIG.ADMIN_PASSWORD) return UI.showMessage("form-message", WRONG);
      var admin = Store.findUserByEmail(email) || (await Store.createUser(email, password, "admin"));
      Store.signIn(admin);
      return UI.go("admin.html");
    }

    var user = Store.findUserByEmail(email);
    if (!user || !(await Store.checkPassword(user, password))) return UI.showMessage("form-message", WRONG);

    Store.signIn(user);
    UI.go(UI.homeFor(user));
  });
}
