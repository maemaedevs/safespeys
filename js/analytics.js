// Turns the stored data into combined totals for the researcher view.
// Nothing here returns story text, emails, or one person's answers.

/** Counts below this are never shown, so small groups can't be singled out. */
var MIN_CELL = 3;

var DAY = 24 * 60 * 60 * 1000;
var MANILA_OFFSET = 8 * 60 * 60 * 1000; // Philippines is UTC+8 all year.

function countBy(items, key) {
  var counts = {};
  items.forEach(function (item) {
    var k = typeof key === "function" ? key(item) : item[key];
    counts[k] = (counts[k] || 0) + 1;
  });
  return counts;
}

/** Ordered table rows, with small counts hidden (null). */
function toRows(options, counts, total) {
  return options.map(function (o) {
    var n = counts[o.value] || 0;
    var hidden = n > 0 && n < MIN_CELL;
    return {
      value: o.value,
      label: o.label,
      color: o.color,
      f: hidden ? null : n,
      pct: hidden || total === 0 ? null : (n / total) * 100,
    };
  });
}

function mean(numbers) {
  return numbers.reduce(function (s, n) { return s + n; }, 0) / numbers.length;
}

/** The Monday that starts the week of this date, in Manila time, as "YYYY-MM-DD". */
function manilaWeek(date) {
  var local = new Date(date.getTime() + MANILA_OFFSET);
  var monday = new Date(local.getTime() - ((local.getUTCDay() + 6) % 7) * DAY);
  return monday.toISOString().slice(0, 10);
}

function getAnalytics() {
  var db = Store.load();

  var consentedIds = db.consents.filter(function (c) { return !c.withdrawnAt; }).map(function (c) { return c.userId; });
  var profiles = db.profiles.filter(function (p) { return consentedIds.indexOf(p.userId) !== -1; });
  var entries = db.entries;
  var n = profiles.length;
  var entryCount = entries.length;

  // Themes, with the mean weight shown only for themes with enough entries.
  var categories = toRows(CATEGORIES, countBy(entries, "category"), entryCount).map(function (row) {
    var inTheme = entries.filter(function (e) { return e.category === row.value; });
    row.avgIntensity = inTheme.length >= MIN_CELL ? mean(inTheme.map(function (e) { return e.intensity; })) : null;
    return row;
  });

  var feelingCounts = {};
  entries.forEach(function (e) {
    e.feelings.forEach(function (f) { feelingCounts[f] = (feelingCounts[f] || 0) + 1; });
  });

  // Entries per week for the last 12 weeks.
  var thisWeek = new Date(manilaWeek(new Date()) + "T00:00:00Z");
  var perWeek = countBy(entries, function (e) { return manilaWeek(new Date(e.createdAt)); });
  var weekly = [];
  for (var i = 11; i >= 0; i--) {
    var week = new Date(thisWeek.getTime() - i * 7 * DAY).toISOString().slice(0, 10);
    weekly.push({ week: week, n: perWeek[week] || 0 });
  }

  // Themes by the writer's age range.
  var ageByUser = {};
  db.profiles.forEach(function (p) { ageByUser[p.userId] = p.ageRange; });
  var crossRows = CATEGORIES.map(function (c) {
    return {
      value: c.value,
      label: c.label,
      color: c.color,
      cells: AGE_RANGES.map(function (a) {
        var v = entries.filter(function (e) { return e.category === c.value && ageByUser[e.userId] === a.value; }).length;
        return v > 0 && v < MIN_CELL ? null : v;
      }),
    };
  });

  var crisis = db.aiReplies.filter(function (r) { return r.crisisFlag; }).length;

  return {
    totals: {
      participants: n,
      entries: entryCount,
      avgIntensity: entryCount >= MIN_CELL ? mean(entries.map(function (e) { return e.intensity; })) : null,
      aiOptIn: db.users.filter(function (u) { return u.role === "user" && u.aiRepliesConsentAt; }).length,
      aiReplies: db.aiReplies.length,
      crisisFlags: crisis > 0 && crisis < MIN_CELL ? null : crisis,
    },
    profile: {
      age: toRows(AGE_RANGES, countBy(profiles, "ageRange"), n),
      gender: toRows(GENDERS, countBy(profiles, "gender"), n),
      relationship: toRows(RELATIONSHIP_STATUSES, countBy(profiles, "relationshipStatus"), n),
      occupation: toRows(OCCUPATIONS, countBy(profiles, "occupation"), n),
    },
    categories: categories,
    kinds: toRows(ENTRY_KINDS, countBy(entries, "kind"), entryCount),
    toldAnyone: toRows(TOLD_ANYONE, countBy(entries, "toldAnyone"), entryCount),
    feelings: toRows(FEELINGS, feelingCounts, entryCount).sort(function (a, b) { return (b.f || 0) - (a.f || 0); }),
    weekly: weekly,
    crossTab: { ages: AGE_RANGES.map(function (a) { return a.label; }), rows: crossRows },
  };
}
