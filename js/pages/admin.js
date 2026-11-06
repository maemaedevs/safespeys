(function () {
  if (!UI.requireAdmin()) return;
  UI.renderHeader();

  var a = getAnalytics();
  var t = a.totals;

  // ----- Small pieces -----

  function suppressed(text) {
    return '<span class="suppressed" title="Fewer than 3 — hidden to protect privacy">' + (text || "&lt;3") + "</span>";
  }

  function bar(pct, color) {
    return '<span class="bar-track"><span class="bar-fill" style="width:' + (pct || 0) + "%;background:" + (color || "var(--cloth)") + '"></span></span>';
  }

  function labelCell(row, indent) {
    var label = row.color
      ? '<span class="label-swatch"><span class="swatch" style="background:' + row.color + '" aria-hidden="true"></span>' + row.label + "</span>"
      : row.label;
    return '<th scope="row"' + (indent ? ' class="indent"' : "") + ">" + label + "</th>";
  }

  function rowCells(row) {
    return (
      '<td class="num">' + (row.f === null ? suppressed() : row.f) + "</td>" +
      '<td class="num">' + (row.pct === null ? suppressed("–") : row.pct.toFixed(1)) + "</td>" +
      '<td class="bar-col">' + bar(row.pct, row.color) + "</td>"
    );
  }

  // ----- Tables -----

  function frequencyTable(number, title, n, unit, firstColumn, groups, note) {
    var body = groups.map(function (g) {
      var html = g.heading ? '<tr class="group"><th scope="colgroup" colspan="4">' + g.heading + "</th></tr>" : "";
      return html + g.rows.map(function (r) { return "<tr>" + labelCell(r, Boolean(g.heading)) + rowCells(r) + "</tr>"; }).join("");
    }).join("");
    return (
      '<figure><table class="thesis-table">' +
      "<caption><b>Table " + number + ".</b> " + title + " (n = " + n.toLocaleString() + " " + unit + ")</caption>" +
      '<thead><tr><th scope="col">' + firstColumn + '</th><th scope="col" class="num">f</th><th scope="col" class="num">%</th><th scope="col"><span class="sr-only">Share</span></th></tr></thead>' +
      "<tbody>" + body + "</tbody></table>" +
      (note ? '<figcaption class="note">' + note + "</figcaption>" : "") +
      "</figure>"
    );
  }

  function themeTable(number) {
    var body = a.categories.map(function (r) {
      return "<tr>" + labelCell(r) + rowCells(r) +
        '<td class="num">' + (r.avgIntensity === null ? suppressed("–") : r.avgIntensity.toFixed(2)) + "</td></tr>";
    }).join("");
    return (
      '<figure><table class="thesis-table">' +
      "<caption><b>Table " + number + ".</b> Entries by theme, with mean weight (n = " + t.entries.toLocaleString() + " entries)</caption>" +
      '<thead><tr><th scope="col">Theme</th><th scope="col" class="num">f</th><th scope="col" class="num">%</th><th scope="col"><span class="sr-only">Share</span></th><th scope="col" class="num" title="Mean of 1 (light) to 5 (overwhelming)">Weight</th></tr></thead>' +
      "<tbody>" + body + "</tbody></table>" +
      '<figcaption class="note">Weight is the mean of 1 (light) to 5 (overwhelming).</figcaption></figure>'
    );
  }

  function aiTable(number) {
    var rows = [
      { label: "Respondents with AI replies switched on", value: t.aiOptIn },
      { label: "Entries that received an AI reply", value: t.aiReplies },
      { label: "Replies flagged as a possible crisis", value: t.crisisFlags },
    ];
    return (
      '<figure><table class="thesis-table">' +
      "<caption><b>Table " + number + ".</b> Use of optional AI replies</caption>" +
      '<thead><tr><th scope="col">Measure</th><th scope="col" class="num">f</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><th scope="row">' + r.label + '</th><td class="num">' + (r.value === null ? suppressed() : r.value.toLocaleString()) + "</td></tr>";
      }).join("") +
      "</tbody></table>" +
      '<figcaption class="note">Flagged replies showed the participant crisis hotlines. Reply text is never shown to researchers.</figcaption></figure>'
    );
  }

  function crossTable(number) {
    var rows = a.crossTab.rows;
    var max = Math.max.apply(null, [1].concat(rows.flatMap(function (r) { return r.cells.map(function (c) { return c || 0; }); })));
    var body = rows.map(function (r) {
      return "<tr>" + labelCell(r) + r.cells.map(function (c) {
        // Darker green means more entries.
        var shade = c ? ' style="background: rgb(29 68 52 / ' + (0.05 + (c / max) * 0.3) + ')"' : "";
        var text = c === null ? suppressed() : c === 0 ? '<span class="faint">0</span>' : c;
        return '<td class="num"' + shade + ">" + text + "</td>";
      }).join("") + "</tr>";
    }).join("");
    return (
      '<figure><table class="thesis-table cross">' +
      "<caption><b>Table " + number + ".</b> Themes by age range of the writer (number of entries)</caption>" +
      '<thead><tr><th scope="col">Theme</th>' + a.crossTab.ages.map(function (age) { return '<th scope="col" class="num">' + age + "</th>"; }).join("") + "</tr></thead>" +
      "<tbody>" + body + "</tbody></table>" +
      '<figcaption class="note">Darker cells hold more entries.</figcaption></figure>'
    );
  }

  // ----- Weekly bar chart (SVG) -----

  var W = 640, H = 220, PAD = { top: 16, right: 8, bottom: 28, left: 36 };

  function shortDate(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  }

  function weeklyChart(number) {
    var data = a.weekly;
    var top = Math.ceil(Math.max.apply(null, [4].concat(data.map(function (d) { return d.n; }))) / 4) * 4;
    var step = top / 4;
    var plotW = W - PAD.left - PAD.right;
    var plotH = H - PAD.top - PAD.bottom;
    var slot = plotW / data.length;
    var barW = Math.min(28, slot - 6);
    var y = function (v) { return PAD.top + plotH - (v / top) * plotH; };
    var total = data.reduce(function (s, d) { return s + d.n; }, 0);

    var svg = "";
    for (var i = 0; i <= 4; i++) {
      svg += '<line x1="' + PAD.left + '" x2="' + (W - PAD.right) + '" y1="' + y(i * step) + '" y2="' + y(i * step) + '" stroke="' + (i === 0 ? "#18241d" : "#e3e8e4") + '" stroke-width="' + (i === 0 ? 1.5 : 1) + '"/>';
      svg += '<text x="' + (PAD.left - 8) + '" y="' + y(i * step) + '" dy="0.32em" text-anchor="end" font-size="11" fill="#5f6e65">' + i * step + "</text>";
    }
    data.forEach(function (d, i) {
      var cx = PAD.left + slot * i + slot / 2;
      var h = Math.max(0, y(0) - y(d.n));
      svg += '<g class="bar-group" data-i="' + i + '">';
      svg += '<rect x="' + (PAD.left + slot * i) + '" y="' + PAD.top + '" width="' + slot + '" height="' + plotH + '" fill="transparent"/>';
      if (h > 0) {
        var r = Math.min(4, h);
        svg += '<path class="bar" fill="#1d4434" d="M' + (cx - barW / 2) + "," + y(0) + " V" + (y(d.n) + r) + " q0,-" + r + " " + r + ",-" + r + " H" + (cx + barW / 2 - r) + " q" + r + ",0 " + r + "," + r + " V" + y(0) + ' Z"/>';
      }
      if (i % 2 === 0 || i === data.length - 1) {
        svg += '<text x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="#5f6e65">' + shortDate(d.week) + "</text>";
      }
      svg += "</g>";
    });

    var aria = "Entries per week. " + data.map(function (d) { return shortDate(d.week) + ": " + d.n; }).join("; ") + ".";
    return (
      '<figure><figcaption class="serif" style="font-size:1.05rem"><b>Figure ' + number + ".</b> Entries written per week, last 12 weeks (n = " + total.toLocaleString() + " entries)</figcaption>" +
      '<div class="chart-wrap" id="chart"><svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + aria + '">' + svg + "</svg>" +
      '<div class="chart-tip" id="chart-tip" hidden></div></div></figure>'
    );
  }

  function wireChart() {
    var tip = document.getElementById("chart-tip");
    document.querySelectorAll("#chart .bar-group").forEach(function (g) {
      var i = Number(g.dataset.i);
      var d = a.weekly[i];
      var bar = g.querySelector(".bar");
      g.addEventListener("mouseenter", function () {
        if (bar) bar.setAttribute("fill", "#143126");
        var top = Math.ceil(Math.max.apply(null, [4].concat(a.weekly.map(function (w) { return w.n; }))) / 4) * 4;
        var plotH = H - PAD.top - PAD.bottom;
        var slot = (W - PAD.left - PAD.right) / a.weekly.length;
        tip.style.left = ((PAD.left + slot * i + slot / 2) / W) * 100 + "%";
        tip.style.top = ((PAD.top + plotH - (d.n / top) * plotH) / H) * 100 + "%";
        tip.innerHTML = "Week of " + shortDate(d.week) + ": <b>" + d.n + "</b>";
        tip.hidden = false;
      });
      g.addEventListener("mouseleave", function () {
        if (bar) bar.setAttribute("fill", "#1d4434");
        tip.hidden = true;
      });
    });
  }

  // ----- Put the page together -----

  var stories = a.kinds.find(function (k) { return k.value === "story"; }).f;
  var dilemmas = a.kinds.find(function (k) { return k.value === "dilemma"; }).f;
  var facts = [
    { label: "Respondents", value: t.participants.toLocaleString() },
    { label: "Entries", value: t.entries.toLocaleString() },
    { label: "Stories / dilemmas", value: (stories === null ? "&lt;3" : stories) + " / " + (dilemmas === null ? "&lt;3" : dilemmas) },
    { label: "Mean weight", value: t.avgIntensity === null ? "–" : t.avgIntensity.toFixed(2) + " of 5" },
  ];
  document.getElementById("stats").innerHTML = facts.map(function (f) {
    return "<div><dt>" + f.label + "</dt><dd>" + f.value + "</dd></div>";
  }).join("");

  if (t.participants === 0) {
    document.getElementById("no-respondents").hidden = false;
    return;
  }

  var tables = document.getElementById("tables");
  tables.hidden = false;
  tables.innerHTML =
    frequencyTable(1, "Profile of the respondents", t.participants, "respondents", "Characteristic", [
      { heading: "Age range", rows: a.profile.age },
      { heading: "Gender", rows: a.profile.gender },
      { heading: "Relationship status", rows: a.profile.relationship },
      { heading: "Occupation", rows: a.profile.occupation },
    ]) +
    '<div class="stack-xl">' + themeTable(2) + weeklyChart(1) + "</div>" +
    frequencyTable(3, "Feelings named in entries", t.entries, "entries", "Feeling", [{ rows: a.feelings }],
      "Multiple responses: an entry can name up to four feelings, so percentages do not add up to 100.") +
    '<div class="stack-xl">' +
      frequencyTable(4, "Whom respondents had told", t.entries, "entries", "Told", [{ rows: a.toldAnyone }]) +
      aiTable(5) +
    "</div>" +
    '<div class="span-2">' + crossTable(6) + "</div>";

  wireChart();
})();
