// Shared helpers used by every page: header, page guards, form pieces, formatting.

var UI = {
  // Make text safe to put inside HTML.
  esc: function (value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  formatDate: function (iso) {
    return new Date(iso).toLocaleDateString("en-PH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Manila" });
  },

  countWords: function (text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  },

  param: function (name) {
    return new URLSearchParams(location.search).get(name);
  },

  go: function (page) {
    location.href = page;
  },

  // ----- Where each kind of user belongs -----

  homeFor: function (user) {
    if (user.role === "admin") return "admin.html";
    return Store.hasCompletedOnboarding(user.id) ? "entries.html" : "onboarding.html";
  },

  // Signed-in people skip the login and register pages.
  requireGuest: function () {
    var user = Store.currentUser();
    if (user) UI.go(UI.homeFor(user));
    return !user;
  },

  requireUser: function () {
    var user = Store.currentUser();
    if (!user) UI.go("login.html");
    return user;
  },

  requireParticipant: function () {
    var user = UI.requireUser();
    if (!user) return null;
    if (user.role === "admin") { UI.go("admin.html"); return null; }
    if (!Store.hasCompletedOnboarding(user.id)) { UI.go("onboarding.html"); return null; }
    return user;
  },

  requireAdmin: function () {
    var user = UI.requireUser();
    if (!user) return null;
    if (user.role !== "admin") { UI.go(UI.homeFor(user)); return null; }
    return user;
  },

  // ----- Header -----

  wordmark: function (large) {
    return '<span class="wordmark' + (large ? " wordmark-large" : "") + '">SafeSpace</span>';
  },

  renderHeader: function (showNav) {
    var header = document.getElementById("site-header");
    if (!header) return;
    var user = Store.currentUser();
    var nav = user && user.role === "admin"
      ? [{ href: "admin.html", label: "Study overview" }]
      : [
          { href: "entries.html", label: "My entries" },
          { href: "write.html", label: "Write" },
          { href: "account.html", label: "Account" },
        ];
    var home = user ? UI.homeFor(user) : "index.html";

    var html = '<div class="header-inner"><a href="' + home + '" class="plain-link">' + UI.wordmark(false) + "</a>";
    if (user && showNav !== false) {
      html += '<nav aria-label="Main" class="nav">' + nav.map(function (n) {
        return '<a href="' + n.href + '">' + n.label + "</a>";
      }).join("") + "</nav>";
    }
    if (user) html += '<button type="button" id="sign-out" class="sign-out">Sign out</button>';
    html += "</div>";
    header.innerHTML = html;

    var signOut = document.getElementById("sign-out");
    if (signOut) {
      signOut.addEventListener("click", function () {
        Store.signOut();
        UI.go("index.html");
      });
    }
  },

  // ----- Form pieces -----

  /** A group of radio (pick one) or checkbox (pick many) pills. */
  choiceGroup: function (opts) {
    var selected = [].concat(opts.value || []);
    var type = opts.multiple ? "checkbox" : "radio";
    var html = "<fieldset><legend>" + UI.esc(opts.legend) + "</legend>";
    if (opts.hint) html += '<p class="hint">' + UI.esc(opts.hint) + "</p>";
    html += '<div class="pills">';
    opts.options.forEach(function (o) {
      var checked = selected.indexOf(o.value) !== -1 ? " checked" : "";
      html += '<label class="pill"><input type="' + type + '" name="' + opts.name + '" value="' + o.value + '"' + checked + ">";
      if (o.color) html += '<span class="swatch" style="background:' + o.color + '" aria-hidden="true"></span>';
      html += "<span>" + UI.esc(o.label) + "</span></label>";
    });
    html += '</div><p class="field-error" id="' + opts.name + '-error"></p></fieldset>';
    return html;
  },

  /** The four profile questions, used on onboarding and account pages. */
  profileFields: function (profile) {
    profile = profile || {};
    return [
      UI.choiceGroup({ name: "ageRange", legend: "Age range", options: AGE_RANGES, value: profile.ageRange }),
      UI.choiceGroup({ name: "gender", legend: "Gender", options: GENDERS, value: profile.gender }),
      UI.choiceGroup({ name: "relationshipStatus", legend: "Relationship status", options: RELATIONSHIP_STATUSES, value: profile.relationshipStatus }),
      UI.choiceGroup({ name: "occupation", legend: "Occupation", options: OCCUPATIONS, value: profile.occupation }),
    ].join("");
  },

  readProfile: function (form) {
    var data = new FormData(form);
    var profile = {
      ageRange: data.get("ageRange"),
      gender: data.get("gender"),
      relationshipStatus: data.get("relationshipStatus"),
      occupation: data.get("occupation"),
    };
    var errors = {};
    if (!hasValue(AGE_RANGES, profile.ageRange)) errors.ageRange = "Choose an age range.";
    if (!hasValue(GENDERS, profile.gender)) errors.gender = "Choose an option.";
    if (!hasValue(RELATIONSHIP_STATUSES, profile.relationshipStatus)) errors.relationshipStatus = "Choose an option.";
    if (!hasValue(OCCUPATIONS, profile.occupation)) errors.occupation = "Choose an option.";
    return { profile: profile, errors: errors };
  },

  /** Clear old errors, then show new ones. errors is { fieldName: "message" }. */
  showErrors: function (form, errors) {
    form.querySelectorAll(".field-error").forEach(function (p) { p.textContent = ""; });
    form.querySelectorAll("[aria-invalid]").forEach(function (el) { el.removeAttribute("aria-invalid"); });
    var first = null;
    Object.keys(errors).forEach(function (name) {
      var p = document.getElementById(name + "-error");
      if (p) p.textContent = errors[name];
      var input = form.querySelector('[name="' + name + '"]');
      if (input) {
        input.setAttribute("aria-invalid", "true");
        if (!first) first = input;
      }
    });
    if (first) first.focus();
    return Object.keys(errors).length === 0;
  },

  /** Put a show/hide eye button inside every password box in the form. */
  passwordToggles: function (form) {
    var svg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    var eye = '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>';
    var icons = { hidden: svg + eye + "</svg>", shown: svg + eye + '<path d="M3 3l18 18"/></svg>' };

    form.querySelectorAll('input[type="password"]').forEach(function (input) {
      var wrap = document.createElement("div");
      wrap.className = "password-field";
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);

      var button = document.createElement("button");
      button.type = "button";
      button.className = "password-toggle";
      button.setAttribute("aria-label", "Show password");
      button.setAttribute("aria-controls", input.id);
      wrap.appendChild(button);

      function show(visible) {
        input.type = visible ? "text" : "password";
        button.setAttribute("aria-pressed", String(visible));
        button.innerHTML = visible ? icons.shown : icons.hidden;
      }
      button.addEventListener("click", function () {
        show(input.type === "password");
        input.focus();
      });
      show(false);
    });
  },

  showMessage: function (id, text, kind) {
    var box = document.getElementById(id);
    if (!box) return;
    box.className = text ? (kind === "ok" ? "ok-message" : "alert") : "";
    box.textContent = text || "";
    box.setAttribute("role", kind === "ok" ? "status" : "alert");
  },

  /** The word counter and fill bar under the entry text box. */
  wordBudget: function (textarea, limit) {
    var fill = document.getElementById("budget-fill");
    var count = document.getElementById("budget-count");
    function update() {
      var words = UI.countWords(textarea.value);
      var over = words > limit;
      fill.style.width = Math.min(words / limit, 1) * 100 + "%";
      fill.style.background = over ? "var(--maroon)" : "var(--cloth)";
      count.className = "budget-count" + (over ? " over" : words / limit > 0.9 ? " near" : "");
      count.textContent = words.toLocaleString() + " of " + limit.toLocaleString() + " words" + (over ? " — please shorten it a little" : "");
    }
    textarea.addEventListener("input", update);
    update();
  },

  crisisLines: function (urgent) {
    var html = '<section class="crisis' + (urgent ? " urgent" : "") + '" aria-labelledby="crisis-heading">';
    html += '<h2 id="crisis-heading">' + (urgent ? "Please reach out to someone now" : "If you need to talk to someone") + "</h2>";
    html += '<p class="muted">If you are in danger or thinking about harming yourself, call one of these lines or go to the nearest emergency room. For emergencies, dial 911.</p>';
    html += '<ul class="crisis-lines">';
    CRISIS_LINES.forEach(function (line) {
      html += "<li><p><b>" + line.name + '</b></p><p class="small faint">' + line.note + "</p><ul>" +
        line.numbers.map(function (n) { return "<li>" + n + "</li>"; }).join("") + "</ul></li>";
    });
    return html + "</ul></section>";
  },
};
