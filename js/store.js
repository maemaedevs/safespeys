// The "database": everything is saved in the browser's localStorage.
// Data stays on this computer and in this browser only.

var DB_KEY = "safespace_db";
var SESSION_KEY = "safespace_session";

var Store = {
  load: function () {
    var empty = { users: [], profiles: [], consents: [], entries: [], aiReplies: [] };
    try {
      var saved = JSON.parse(localStorage.getItem(DB_KEY));
      return saved ? Object.assign(empty, saved) : empty;
    } catch (e) {
      return empty;
    }
  },

  save: function (db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  },

  newId: function () {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  },

  now: function () {
    return new Date().toISOString();
  },

  // ----- Passwords -----

  hashPassword: async function (password, salt) {
    var text = salt + ":" + password;
    if (window.crypto && crypto.subtle) {
      var bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(bytes)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    }
    // Fallback for browsers without Web Crypto (not secure, demo only).
    var h = 5381;
    for (var i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
    return "weak-" + (h >>> 0).toString(16);
  },

  checkPassword: async function (user, password) {
    return user.passwordHash === (await Store.hashPassword(password, user.salt));
  },

  // ----- Users and sessions -----

  findUserByEmail: function (email) {
    return Store.load().users.find(function (u) { return u.email === email; });
  },

  getUser: function (id) {
    return Store.load().users.find(function (u) { return u.id === id; });
  },

  createUser: async function (email, password, role) {
    var db = Store.load();
    var salt = Store.newId();
    var user = {
      id: Store.newId(),
      email: email,
      salt: salt,
      passwordHash: await Store.hashPassword(password, salt),
      role: role || "user",
      adultConfirmedAt: role === "admin" ? null : Store.now(),
      aiRepliesConsentAt: null,
      createdAt: Store.now(),
    };
    db.users.push(user);
    Store.save(db);
    return user;
  },

  currentUser: function () {
    var id = localStorage.getItem(SESSION_KEY);
    return id ? Store.getUser(id) || null : null;
  },

  signIn: function (user) {
    localStorage.setItem(SESSION_KEY, user.id);
  },

  signOut: function () {
    localStorage.removeItem(SESSION_KEY);
  },

  // ----- Profile and consent -----

  getProfile: function (userId) {
    return Store.load().profiles.find(function (p) { return p.userId === userId; });
  },

  getConsent: function (userId) {
    return Store.load().consents.find(function (c) { return c.userId === userId && !c.withdrawnAt; });
  },

  hasCompletedOnboarding: function (userId) {
    return Boolean(Store.getProfile(userId) && Store.getConsent(userId));
  },

  saveProfile: function (userId, profile) {
    var db = Store.load();
    db.profiles = db.profiles.filter(function (p) { return p.userId !== userId; });
    db.profiles.push(Object.assign({ userId: userId, updatedAt: Store.now() }, profile));
    Store.save(db);
  },

  completeOnboarding: function (userId, profile, aiConsent) {
    Store.saveProfile(userId, profile);
    var db = Store.load();
    db.consents.push({ id: Store.newId(), userId: userId, policyVersion: PRIVACY_POLICY_VERSION, grantedAt: Store.now(), withdrawnAt: null });
    var user = db.users.find(function (u) { return u.id === userId; });
    user.aiRepliesConsentAt = aiConsent ? Store.now() : null;
    Store.save(db);
  },

  setAiReplies: function (userId, enabled) {
    var db = Store.load();
    var user = db.users.find(function (u) { return u.id === userId; });
    user.aiRepliesConsentAt = enabled ? Store.now() : null;
    Store.save(db);
  },

  // Withdrawing consent erases the account and everything linked to it.
  eraseUser: function (userId) {
    var db = Store.load();
    var myEntryIds = db.entries.filter(function (e) { return e.userId === userId; }).map(function (e) { return e.id; });
    db.users = db.users.filter(function (u) { return u.id !== userId; });
    db.profiles = db.profiles.filter(function (p) { return p.userId !== userId; });
    db.consents = db.consents.filter(function (c) { return c.userId !== userId; });
    db.entries = db.entries.filter(function (e) { return e.userId !== userId; });
    db.aiReplies = db.aiReplies.filter(function (r) { return myEntryIds.indexOf(r.entryId) === -1; });
    Store.save(db);
    Store.signOut();
  },

  // ----- Entries -----

  entriesFor: function (userId) {
    return Store.load().entries
      .filter(function (e) { return e.userId === userId; })
      .sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
  },

  getEntry: function (userId, id) {
    return Store.load().entries.find(function (e) { return e.id === id && e.userId === userId; });
  },

  createEntry: function (userId, data) {
    var db = Store.load();
    var entry = Object.assign({ id: Store.newId(), userId: userId, createdAt: Store.now(), updatedAt: Store.now() }, data);
    db.entries.push(entry);
    Store.save(db);
    return entry;
  },

  updateEntry: function (userId, id, data) {
    var db = Store.load();
    var entry = db.entries.find(function (e) { return e.id === id && e.userId === userId; });
    if (!entry) return null;
    Object.assign(entry, data, { updatedAt: Store.now() });
    // The old reply answered the old text, so remove it.
    db.aiReplies = db.aiReplies.filter(function (r) { return r.entryId !== id; });
    Store.save(db);
    return entry;
  },

  deleteEntry: function (userId, id) {
    var db = Store.load();
    db.entries = db.entries.filter(function (e) { return !(e.id === id && e.userId === userId); });
    db.aiReplies = db.aiReplies.filter(function (r) { return r.entryId !== id; });
    Store.save(db);
  },

  // ----- AI replies -----

  getReply: function (entryId) {
    return Store.load().aiReplies.find(function (r) { return r.entryId === entryId; });
  },

  saveReply: function (entryId, reply) {
    var db = Store.load();
    if (!db.entries.some(function (e) { return e.id === entryId; })) return;
    db.aiReplies = db.aiReplies.filter(function (r) { return r.entryId !== entryId; });
    db.aiReplies.push(Object.assign({ entryId: entryId, createdAt: Store.now() }, reply));
    Store.save(db);
  },
};
