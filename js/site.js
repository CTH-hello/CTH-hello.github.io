/* Ortak mantık: veriyi yükler, menüyü/altbilgiyi çizer, sayfaları oluşturur,
   kaydırma animasyonlarını, sayfalar arası kayarak geçişi ve imleç noktasını çalıştırır. */
(function () {
  var Sh = window.PortfolioShared, esc = Sh.esc, fmtStyle = Sh.fmtStyle;

  function paras(text) {
    return String(text || "").split(/\n\s*\n/).filter(Boolean)
      .map(function (p) { return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>"; }).join("");
  }
  function safeUrl(u) { return /^(https?:|mailto:|images\/|files\/|\.\/|\/|#)/i.test(u || "") ? u : ""; }
  function fileUrl(u) { return safeUrl(u) || (/^data:(application|image|text)\//i.test(u || "") ? u : ""); }
  function tcls(key, base) {      // ana metinlerin class/style özniteliği (admin'deki "yazı biçimi" ayarı)
    var st = fmtStyle((data.textStyles || {})[key]), cls = (base || "") + (st ? (base ? " " : "") + "fmt" : "");
    return (cls ? ' class="' + cls + '"' : "") + (st ? ' style="' + st + '"' : "");
  }

  var draft = Sh.readDraft();
  var data = Sh.normalize(draft || window.SITE_DATA);
  var s = data.settings;

  /* ---- Tasarım ayarlarını uygula ---- */
  var root = document.documentElement.style;
  root.setProperty("--accent", s.accent);
  root.setProperty("--dark", s.dark);
  root.setProperty("--bg", s.bg);
  root.setProperty("--text", s.text);
  root.setProperty("--cursor-color", s.cursorColor);
  root.setProperty("--font", "var(--font-" + (["sans", "serif", "mono"].indexOf(s.font) > -1 ? s.font : "sans") + ")");
  (function () {
    var m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(s.accent || "");
    var l = m ? (0.299 * parseInt(m[1], 16) + 0.587 * parseInt(m[2], 16) + 0.114 * parseInt(m[3], 16)) / 255 : 0;
    root.setProperty("--on-accent", l > 0.62 ? "#111" : "#fff");
  })();

  /* ---- Sayfalar (sıra, "sonraki sayfa" geçişinin sırasıdır) ---- */
  var pages = [
    ["index.html", "Home", "home"],
    ["projects.html", "Projects", "projects"],
    ["about.html", "About Us", "about"],
    ["capabilities.html", "Capabilities", "capabilities"],
    ["products.html", "Products", "products"],
    ["apps.html", "Apps", "apps"],
    ["careers.html", "Careers", "careers"],
    ["news.html", "News & Publications", "news"],
    ["contact.html", "Contact", "contact"]
  ];
  var page = document.body.getAttribute("data-page");
  var activeKey = page === "project" ? "projects" : page;

  /* ---- Simgeler ---- */
  var ICONS = {
    chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
    cloud: '<path d="M7 18a4 4 0 010-8 5.5 5.5 0 0110.6 1.5A3.5 3.5 0 0117 18H7z"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>',
    code: '<path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>',
    cog: '<circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'
  };
  function icon(name) {
    return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.bolt) + "</svg>";
  }

  /* ---- Logo / marka ---- */
  function brand() {
    var h = Math.max(16, Math.min(96, parseInt(s.logoHeight, 10) || 32));
    var mark = s.logo
      ? '<img class="logo" src="' + esc(s.logo) + '" alt="" style="height:' + h + 'px">'
      : '<span class="logo-mark" aria-hidden="true" style="width:' + h + 'px;height:' + h + 'px;font-size:' + Math.round(h * 0.52) + 'px">' + esc((s.siteName || "?").trim().charAt(0).toUpperCase()) + "</span>";
    return '<a class="brand" href="index.html" aria-label="' + esc(s.siteName) + '">' + mark + (s.logoShowName ? "<span>" + esc(s.siteName) + "</span>" : "") + "</a>";
  }
  (function () {   /* sekme simgesi */
    var link = document.createElement("link"); link.rel = "icon";
    if (s.logo) link.href = s.logo;
    else {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="' + s.accent + '"/><text x="32" y="44" font-size="34" font-family="Arial,sans-serif" font-weight="700" text-anchor="middle" fill="#fff">' +
        esc((s.siteName || "?").trim().charAt(0).toUpperCase()) + "</text></svg>";
      link.href = "data:image/svg+xml," + encodeURIComponent(svg);
    }
    document.head.appendChild(link);
  })();

  function header() {
    var links = pages.filter(function (p) { return p[2] !== "contact"; });
    return '<div class="scroll-progress" aria-hidden="true"><span></span></div>' +
      (draft ? '<div class="draft-bar">Draft preview (visible only in this browser). <a href="admin.html">Back to editing</a></div>' : "") +
      (s.statusNote ? '<div class="status-bar">' + esc(s.statusNote) + "</div>" : "") +
      '<header class="site dark"><div class="wrap">' + brand() +
      '<nav class="main" id="main-nav">' + links.map(function (n) {
        return '<a href="' + n[0] + '"' + (n[2] === activeKey ? ' class="active"' : "") + ">" + n[1] + "</a>";
      }).join("") + "</nav>" +
      '<a class="btn nav-cta' + (activeKey === "contact" ? " light" : "") + '" href="contact.html">Contact</a>' +
      '<button class="nav-toggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="main-nav"><span></span><span></span><span></span></button>' +
      "</div></header>";
  }
  function footer() {
    var c = data.contact || {};
    var links = (c.links || []).map(function (l) {
      var u = safeUrl(l.url);
      return u ? '<li><a target="_blank" rel="noopener" href="' + esc(u) + '">' + esc(l.label) + "</a></li>" : "";
    }).join("");
    return '<footer class="site dark"><div class="wrap">' +
      "<div>" + brand() + '<p class="muted" style="margin:14px 0 0;max-width:34ch">' + esc(s.tagline) + "</p></div>" +
      "<div><h4>Pages</h4><ul>" + pages.map(function (n) { return '<li><a href="' + n[0] + '">' + n[1] + "</a></li>"; }).join("") + "</ul></div>" +
      "<div><h4>Links</h4><ul>" + (c.email ? '<li><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a></li>" : "") + links + "</ul></div>" +
      '<div class="copy"><span>© ' + new Date().getFullYear() + " " + esc(s.siteName) + "</span></div></div></footer>";
  }
  function nextPanel() {
    var i = 0; pages.forEach(function (p, k) { if (p[2] === activeKey) i = k; });
    var nx = pages[(i + 1) % pages.length], last = i === pages.length - 1;
    return '<a class="next-page dark" id="next-page" href="' + nx[0] + '"><div class="wrap">' +
      '<span class="eyebrow">' + (last ? "You reached the end" : "Keep scrolling") + "</span>" +
      '<div class="np-title">' + (last ? "Back to " : "Next: ") + esc(nx[1]) + ' <span aria-hidden="true">→</span></div>' +
      '<div class="np-bar" aria-hidden="true"><span></span></div>' +
      '<span class="np-hint">Keep scrolling down or click to continue</span></div></a>';
  }

  /* ---- Ortak parçalar ---- */
  function thumb(p, alt) {
    if (p.image) return '<img class="thumb" loading="lazy" src="' + esc(p.image) + '" alt="' + esc(alt || p.title || "") + '">';
    return '<div class="thumb ph" aria-hidden="true">' + esc(((alt || p.title || "?") + "").charAt(0).toUpperCase()) + "</div>";
  }
  function tagList(arr) {
    return (arr && arr.length) ? '<div class="tags">' + arr.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>" : "";
  }
  function card(p) {
    return '<a class="card" href="project.html?id=' + encodeURIComponent(p.id) + '">' + thumb(p) +
      '<div class="body"><h3>' + esc(p.title) + "</h3><p>" + esc(p.summary) + "</p>" + tagList(p.tags) + '<span class="more">Details</span></div></a>';
  }
  function pageHead(eyebrow, title, lead, leadKey) {
    var st = leadKey ? fmtStyle((data.textStyles || {})[leadKey]) : "";
    return '<section class="page-head dark"><div class="wrap"><span class="eyebrow">' + esc(eyebrow) + "</span><h1>" + esc(title) + "</h1>" +
      (lead ? '<p class="lead' + (st ? " fmt" : "") + '"' + (st ? ' style="' + st + '"' : "") + ">" + esc(lead) + "</p>" : "") + "</div></section>";
  }

  /* ---- İçerik blokları: metin + görsel (konumu seçilir) + indirilebilir dosyalar ---- */
  var FILE_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>';
  function fileExt(path) {
    var m = /^data:[^\/]+\/([a-z0-9.+-]+)/i.exec(path || "");
    if (m) return m[1].replace(/^vnd\..*\./, "").toUpperCase().slice(0, 5);
    m = /\.([a-z0-9]{1,5})(?:[?#].*)?$/i.exec(path || "");
    return m ? m[1].toUpperCase() : "FILE";
  }
  function block(b) {
    var f = b.fmt || {}, st = fmtStyle(f);
    var hs = fmtStyle({ font: f.font, color: f.color, align: f.align, bold: true, size: parseFloat(f.size) > 0 ? parseFloat(f.size) * 1.7 : 0 });
    var pos = ["left", "right", "above", "below", "center", "full"].indexOf(b.imagePos) > -1 ? b.imagePos : "right";
    var size = ["small", "medium", "large"].indexOf(b.imageSize) > -1 ? b.imageSize : "medium";
    var fig = b.image ? '<figure class="blk-fig sz-' + size + '"><img loading="lazy" src="' + esc(b.image) + '" alt="' + esc(b.imageAlt || "") + '">' +
      (b.imageAlt ? "<figcaption>" + esc(b.imageAlt) + "</figcaption>" : "") + "</figure>" : "";
    var files = (b.files || []).filter(function (x) { return fileUrl(x.path); });
    var filesHtml = files.length ? '<div class="files">' + files.map(function (x) {
      return '<a class="file" href="' + esc(fileUrl(x.path)) + '" download target="_blank" rel="noopener">' + FILE_ICON +
        '<span class="file-name">' + esc(x.label || "Download file") + '</span><span class="file-ext">' + esc(fileExt(x.path)) + "</span></a>";
    }).join("") + "</div>" : "";
    var main = (b.heading ? '<h2 class="blk-h"' + (hs ? ' style="' + hs + '"' : "") + ">" + esc(b.heading) + "</h2>" : "") +
      (b.body ? '<div class="prose fmt blk-body"' + (st ? ' style="' + st + '"' : "") + ">" + paras(b.body) + "</div>" : "") + filesHtml;
    if (!fig && !main) return "";
    var al = ["center", "right"].indexOf(f.align) > -1 ? " al-" + f.align : "";
    var inner = (pos === "left" || pos === "right") && fig
      ? '<div class="blk-grid pos-' + pos + " sz-" + size + '">' + fig + '<div class="blk-main' + al + '">' + main + "</div></div>"
      : '<div class="blk-col pos-' + pos + '">' + (pos === "below" ? '<div class="blk-main' + al + '">' + main + "</div>" + fig : fig + '<div class="blk-main' + al + '">' + main + "</div>") + "</div>";
    return '<section class="block light blk-sec"><div class="wrap"><div class="blk">' + inner + "</div></div></section>";
  }
  function filterBar(types) {
    return types.length > 1 ? '<div class="filters" id="filters"><button class="tag on" data-tag="">All</button>' +
      types.map(function (t) { return '<button class="tag" data-tag="' + esc(t) + '">' + esc(t) + "</button>"; }).join("") + "</div>" : "";
  }
  function wireFilter(items, key, draw, gridId) {
    setTimeout(function () {
      var grid = document.getElementById(gridId);
      function run(tag) {
        var list = items.filter(function (p) { return !tag || (key(p) || []).indexOf(tag) > -1; });
        grid.innerHTML = list.length ? list.map(draw).join("") : '<div class="empty">Nothing here yet.</div>';
        reveal(grid);
      }
      run("");
      var f = document.getElementById("filters");
      if (f) f.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        [].forEach.call(f.children, function (c) { c.classList.toggle("on", c === b); });
        run(b.getAttribute("data-tag"));
      });
    });
  }
  function uniq(arr) { var o = []; arr.forEach(function (x) { if (x && o.indexOf(x) < 0) o.push(x); }); return o; }

  /* ---- Sayfa görünümleri ---- */
  var curProject = null;
  var views = {
    notfound: function () {
      return pageHead("404", "Page not found", "The page you are looking for does not exist or has moved.") +
        '<section class="block light"><div class="wrap"><div class="btn-row" style="margin-top:0"><a class="btn" href="index.html">Back to home</a><a class="btn ghost plain" href="projects.html">View projects</a></div></div></section>';
    },

    home: function () {
      var h = data.home;
      var feat = (data.projects || []).filter(function (p) { return p.featured; });
      return '<section class="hero dark"><div class="wrap"><span class="eyebrow">' + esc(h.heroEyebrow) + "</span><h1>" + esc(h.heroTitle) + '</h1><p' + tcls("home_heroText", "lead") + ">" + esc(h.heroText) + "</p>" +
        '<div class="btn-row"><a class="btn" href="projects.html">' + esc(h.ctaText || "Projects") + '</a><a class="btn ghost plain" href="about.html">About Us</a></div></div></section>' +
        (feat.length ? '<section class="block light"><div class="wrap"><div class="section-head"><h2>' + esc(h.featuredTitle) + '</h2><a class="link-more" href="projects.html">All projects →</a></div><div class="grid">' + feat.map(card).join("") + "</div></div></section>" : "") +
        '<section class="band dark"><div class="wrap"><div><h2>' + esc(h.bandTitle) + '</h2><p class="lead">' + esc(h.bandText) + '</p></div><a class="btn light" href="contact.html">' + esc(h.bandButton) + "</a></div></section>";
    },

    projects: function () {
      var all = data.projects || [], tags = uniq([].concat.apply([], all.map(function (p) { return p.tags || []; })));
      wireFilter(all, function (p) { return p.tags; }, card, "grid");
      return pageHead("Work", "Projects", all.length + (all.length === 1 ? " project" : " projects")) +
        '<section class="block light"><div class="wrap">' + filterBar(tags) + '<div class="grid" id="grid"></div></div></section>';
    },

    project: function () {
      var id = new URLSearchParams(location.search).get("id");
      var p = (data.projects || []).filter(function (x) { return x.id === id; })[0];
      if (!p) return '<section class="page-head dark"><div class="wrap"><a class="back" href="projects.html">← Projects</a><h1>Project not found</h1></div></section>';
      document.title = p.title + " — " + s.siteName;
      curProject = p;
      var url = safeUrl(p.link), dst = fmtStyle(p.descFmt);
      return '<section class="page-head dark"><div class="wrap"><a class="back" href="projects.html">← All projects</a><h1>' + esc(p.title) + '</h1><p class="lead">' + esc(p.summary) + "</p>" +
        '<div class="meta">' + (p.year ? '<span class="tag">' + esc(p.year) + "</span>" : "") + (p.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div></div></section>" +
        '<section class="block light"><div class="wrap">' +
        (p.image ? '<img class="detail-img" src="' + esc(p.image) + '" alt="' + esc(p.title) + '">' : "") +
        '<div class="prose' + (dst ? " fmt" : "") + '"' + (dst ? ' style="' + dst + '"' : "") + ">" + paras(p.description) + "</div>" +
        (url ? '<div class="btn-row"><a class="btn" target="_blank" rel="noopener" href="' + esc(url) + '">' + esc(p.linkLabel || "View project") + "</a></div>" : "") + "</div></section>";
    },

    about: function () {
      var a = data.about;
      var refs = a.references || [], hist = a.history || [];
      return pageHead("Company", a.title, a.lead) +
        '<nav class="subnav"><div class="wrap"><a href="#about-us">About Us</a>' + (a.mission || a.vision ? '<a href="#mission-vision">Mission &amp; Vision</a>' : "") + 
        (refs.length ? '<a href="#references">Our References</a>' : "") + (hist.length ? '<a href="#history">Our History</a>' : "") + "</div></nav>" +

        '<section class="block light" id="about-us"><div class="wrap"><span class="eyebrow">Who we are</span><h2>About Us</h2><div' + tcls("about_intro", "prose") + ">" + paras(a.intro) + "</div></div></section>" +

        (a.mission || a.vision ? '<section class="block alt" id="mission-vision"><div class="wrap"><span class="eyebrow">Purpose</span><h2>Mission &amp; Vision</h2><div class="mv-grid">' +
        '<div class="mv"><span class="eyebrow">Our Mission</span><p' + tcls("about_mission") + ">" + esc(a.mission) + "</p></div>" +
        '<div class="mv"><span class="eyebrow">Our Vision</span><p' + tcls("about_vision") + ">" + esc(a.vision) + "</p></div></div></div></section>" : "") +

        (refs.length ? '<section class="block light" id="references"><div class="wrap"><span class="eyebrow">Trusted by</span><h2>Our References</h2><div class="grid ref-grid">' + refs.map(function (r) {
          var mark = r.logo ? '<img class="ref-logo" src="' + esc(r.logo) + '" alt="">' : '<span class="ref-initial" aria-hidden="true">' + esc((r.name || "?").charAt(0).toUpperCase()) + "</span>";
          return '<figure class="ref">' + (r.quote ? "<blockquote>" + esc(r.quote) + "</blockquote>" : "") +
            '<figcaption>' + mark + "<span><strong>" + esc(r.name) + "</strong><br><span class=\"muted\">" + esc(r.role) + "</span></span></figcaption></figure>";
        }).join("") + "</div></div></section>" : "") +

        (hist.length ? '<section class="block alt" id="history"><div class="wrap"><span class="eyebrow">Our story</span><h2>Our History</h2><ul class="timeline">' + hist.map(function (t) {
          return '<li><span class="yr">' + esc(t.year) + "</span><h3>" + esc(t.title) + "</h3><p>" + esc(t.text) + "</p></li>";
        }).join("") + "</ul></div></section>" : "");
    },

    capabilities: function () {
      var c = data.capabilities;
      return pageHead("What we do", c.title, c.intro, "capabilities_intro") +
        '<section class="block light"><div class="wrap">' + ((c.items || []).length ? '<div class="feat-grid">' : '<div class="empty">Details coming soon.</div><div hidden>') + (c.items || []).map(function (it) {
          return '<div class="feat"><span class="ico">' + icon(it.icon) + "</span><h3>" + esc(it.title) + "</h3><p>" + esc(it.text) + "</p>" + tagList(it.tags) + "</div>";
        }).join("") + "</div></div></section>";
    },

    products: function () {
      var c = data.products;
      return pageHead("Solutions", c.title, c.intro, "products_intro") +
        '<section class="block light"><div class="wrap">' + ((c.items || []).length ? '<div class="grid">' : '<div class="empty">Our products will be listed here soon.</div><div hidden>') + (c.items || []).map(function (p) {
          var url = safeUrl(p.link);
          return '<article class="card prod">' + thumb(p, p.name) + '<div class="body">' +
            (p.badge ? '<span class="badge">' + esc(p.badge) + "</span>" : "") +
            "<h3>" + esc(p.name) + '</h3><p class="tagline">' + esc(p.tagline) + "</p><p>" + esc(p.description) + "</p>" +
            ((p.features && p.features.length) ? '<ul class="checks">' + p.features.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" : "") +
            (url ? '<a class="btn small" target="_blank" rel="noopener" href="' + esc(url) + '">' + esc(p.linkLabel || "Learn more") + "</a>" : "") +
            "</div></article>";
        }).join("") + "</div></div></section>";
    },

    apps: function () {
      var c = data.apps, items = c.items || [];
      return pageHead("Downloads", c.title, c.intro, "apps_intro") +
        '<section class="block light"><div class="wrap">' + (items.length ? '<div class="grid">' + items.map(function (p) {
          var dl = fileUrl(p.file), url = safeUrl(p.link);
          return '<article class="card prod">' + thumb(p, p.name) + '<div class="body">' +
            (p.badge ? '<span class="badge">' + esc(p.badge) + "</span>" : "") +
            "<h3>" + esc(p.name) + '</h3><p class="tagline">' + esc(p.tagline) + "</p><p>" + esc(p.description) + "</p>" +
            ((p.features && p.features.length) ? '<ul class="checks">' + p.features.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" : "") +
            ((p.platform || p.version) ? '<div class="tags">' + [p.platform, p.version && "v" + p.version].filter(Boolean).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>" : "") +
            '<div class="btn-row" style="margin-top:8px">' + (dl ? '<a class="btn small" download href="' + esc(dl) + '">' + esc(p.downloadLabel || "Download") + "</a>" : "") +
            (url ? '<a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(url) + '">' + esc(p.linkLabel || "Learn more") + "</a>" : "") + "</div></div></article>";
        }).join("") + "</div>" : '<div class="empty">Our first apps are on the way. Check back soon.</div>') + "</div></section>";
    },

    careers: function () {
      var c = data.careers, mail = c.applyEmail || (data.contact && data.contact.email) || "";
      var jobs = c.jobs || [], perks = c.perks || [];
      return pageHead("Join us", c.title, c.intro, "careers_intro") +
        (perks.length ? '<section class="block light"><div class="wrap"><h2>Why join us</h2><div class="feat-grid">' + perks.map(function (p) {
          return '<div class="feat perk"><h3>' + esc(p.title) + "</h3><p>" + esc(p.text) + "</p></div>";
        }).join("") + "</div></div></section>" : "") +
        '<section class="block alt"><div class="wrap"><h2>Open positions</h2>' +
        (jobs.length ? '<div class="jobs">' + jobs.map(function (j) {
          var url = safeUrl(j.applyLink) || (mail ? "mailto:" + mail + "?subject=" + encodeURIComponent("Application: " + j.title) : "");
          return '<article class="job"><div class="job-main"><h3>' + esc(j.title) + '</h3><div class="tags">' +
            [j.department, j.location, j.type].filter(Boolean).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") +
            "</div><p>" + esc(j.description) + "</p></div>" +
            (url ? '<a class="btn small" ' + (/^https?:/i.test(url) ? 'target="_blank" rel="noopener" ' : "") + 'href="' + esc(url) + '">Apply</a>' : "") + "</article>";
        }).join("") + "</div>" : '<div class="empty">There are no open positions right now.' + (mail ? ' You are welcome to send an open application to <a href="mailto:' + esc(mail) + '">' + esc(mail) + "</a>." : "") + "</div>") +
        "</div></section>";
    },

    news: function () {
      var c = data.news, items = c.items || [];
      wireFilter(items, function (n) { return [n.type]; }, function (n) {
        var url = safeUrl(n.link);
        return '<article class="news-row"><div class="nd"><span class="tag">' + esc(n.type) + "</span><time>" + esc(n.date) + '</time></div><div class="nb"><h3>' + esc(n.title) + "</h3><p>" + esc(n.summary) + "</p>" +
          (url ? '<a class="link-more" target="_blank" rel="noopener" href="' + esc(url) + '">' + esc(n.linkLabel || "Read more") + " →</a>" : "") + "</div>" +
          (n.image ? '<img class="news-img" loading="lazy" src="' + esc(n.image) + '" alt="">' : "") + "</article>";
      }, "newslist");
      return pageHead("Updates", c.title, c.intro, "news_intro") +
        '<section class="block light"><div class="wrap">' + filterBar(uniq(items.map(function (n) { return n.type; }))) + '<div class="news-list" id="newslist"></div></div></section>';
    },

    contact: function () {
      var c = data.contact;
      var mail = c.email ? '<a class="btn" href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a>" : "";
      var links = (c.links || []).map(function (l) {
        var u = safeUrl(l.url);
        return u ? '<a class="btn ghost" target="_blank" rel="noopener" href="' + esc(u) + '">' + esc(l.label) + "</a>" : "";
      }).join("");
      return pageHead("Get in touch", c.title) +
        '<section class="block light"><div class="wrap"><div class="contact-box"><p' + tcls("contact_text") + ">" + esc(c.text) + "</p>" +
        (c.address ? '<p class="muted address">' + esc(c.address).replace(/\n/g, "<br>") + "</p>" : "") +
        '<div class="btn-row">' + mail + links + "</div></div></div></section>";
    }
  };

  var pageHtml = views[page] ? views[page]() : "";
  (function addBlocks() {
    var list = (page === "project" ? (curProject && curProject.blocks) : (data.pageBlocks || {})[page]) || [];
    var tops = list.filter(function (b) { return b.where === "top"; }), rest = list.filter(function (b) { return b.where !== "top"; });
    if (tops.length) {
      var k = pageHtml.indexOf("</section>");
      var t = tops.map(block).join("");
      pageHtml = k > -1 ? pageHtml.slice(0, k + 10) + t + pageHtml.slice(k + 10) : t + pageHtml;
    }
    pageHtml += rest.map(block).join("");
  })();
  document.body.innerHTML = header() + "<main>" + pageHtml + "</main>" + footer() + nextPanel();
  var titles = { home: s.siteName + " — " + s.tagline };
  pages.forEach(function (p) { if (p[2] !== "home") titles[p[2]] = p[1] + " — " + s.siteName; });
  titles.notfound = "Page not found — " + s.siteName;
  if (titles[page]) document.title = titles[page];

  /* =========================================================
     Kaydırınca beliren öğeler (fade-up) + üstte ilerleme çubuğu
     ========================================================= */
  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var RV = ".hero .wrap > *, .page-head .wrap > *, .section-head, .card, .feat, .job, .news-row, .ref, .mv, .blk-fig, .blk-main, .timeline li, .prose, .contact-box, .filters, .block .wrap > h2, .block .wrap > .eyebrow";
  var io = ("IntersectionObserver" in window && !reduceMotion) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }) : null;

  function reveal(scope) {
    [].forEach.call(scope.querySelectorAll(RV), function (el) {
      if (el.__rv) return; el.__rv = 1;
      if (!io) return;                                   // eski tarayıcı / hareket azaltma: olduğu gibi göster
      el.classList.add("reveal");
      var idx = [].indexOf.call(el.parentNode.children, el);
      el.style.setProperty("--d", Math.min(idx, 6) * 70 + "ms");
      io.observe(el);
    });
  }
  reveal(document);

  var bar = document.querySelector(".scroll-progress span"), ticking = false;
  function updateProgress() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0) + ")";
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); } }, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  /* ---- Mobil menü ---- */
  (function () {
    var hd = document.querySelector("header.site"), tg = document.querySelector(".nav-toggle");
    tg.addEventListener("click", function () { var o = hd.classList.toggle("open"); tg.setAttribute("aria-expanded", o ? "true" : "false"); });
  })();

  /* =========================================================
     Sayfalar arası kayarak geçiş
     - Sayfanın en altında kaydırmaya devam edince sıradaki sayfa açılır
     - Menü ve bağlantı tıklamaları da aynı kayma animasyonunu kullanır
     ========================================================= */
  var navigating = false;
  function slideTo(url) {
    if (navigating) return; navigating = true;
    if (reduceMotion) { location.href = url; return; }
    try { sessionStorage.setItem("pf-slide", "1"); } catch (e) {}
    var o = document.createElement("div"); o.className = "page-slide"; document.body.appendChild(o);
    void o.offsetWidth; o.classList.add("on");
    setTimeout(function () { location.href = url; }, 480);
  }
  (function arrive() {      // geldiğimiz sayfada örtü yukarı kayıp açılır
    var f = null; try { f = sessionStorage.getItem("pf-slide"); sessionStorage.removeItem("pf-slide"); } catch (e) {}
    if (!f || reduceMotion) return;
    var o = document.createElement("div"); o.className = "page-slide on"; o.style.transition = "none"; document.body.appendChild(o);
    void o.offsetWidth; o.style.transition = "";
    requestAnimationFrame(function () { requestAnimationFrame(function () { o.classList.add("leave"); }); });
    setTimeout(function () { o.remove(); }, 800);
  })();
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) { navigating = false; [].forEach.call(document.querySelectorAll(".page-slide"), function (o) { o.remove(); }); }
  });
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target) return;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|javascript:)/i.test(href)) return;
    if (a.protocol !== location.protocol || a.host !== location.host) return;
    if (a.pathname === location.pathname && a.search === location.search && a.hash) return;
    e.preventDefault(); slideTo(a.href);
  });

  /* Sayfa sonunda kaydırmaya devam etme (tekerlek / dokunmatik) */
  (function () {
    var np = document.getElementById("next-page"), fill = np.querySelector(".np-bar span");
    var TH = 650, accum = 0, lastWheel = 0, bottomSince = 0, idle = 0, y0 = null, touchD = 0;
    function atBottom() { return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2; }
    function setFill(p) { p = Math.max(0, Math.min(1, p)); fill.style.transform = "scaleX(" + p + ")"; np.classList.toggle("charging", p > 0); }
    function reset() { accum = 0; setFill(0); }

    window.addEventListener("scroll", function () { if (!atBottom()) { bottomSince = 0; if (accum) reset(); } }, { passive: true });

    window.addEventListener("wheel", function (e) {
      if (navigating) return;
      if (e.deltaY <= 0) { if (accum) reset(); return; }
      if (!atBottom()) { bottomSince = 0; return; }
      var now = Date.now();
      if (!bottomSince) { bottomSince = now; return; }
      if (now - bottomSince < 450) return;               // ivmeyle gelen kaydırma hemen sayılmasın
      if (now - lastWheel > 500) accum = 0;
      lastWheel = now; accum += Math.min(e.deltaY, 100); setFill(accum / TH);
      clearTimeout(idle); idle = setTimeout(reset, 700);
      if (accum >= TH) slideTo(np.href);
    }, { passive: true });

    window.addEventListener("touchstart", function (e) { y0 = atBottom() ? e.touches[0].clientY : null; touchD = 0; }, { passive: true });
    window.addEventListener("touchmove", function (e) {
      if (y0 === null || navigating) return;
      touchD = y0 - e.touches[0].clientY;
      if (touchD > 0 && atBottom()) setFill(touchD / 150); else if (touchD <= 0) setFill(0);
    }, { passive: true });
    window.addEventListener("touchend", function () {
      if (y0 !== null && touchD >= 150 && atBottom() && !navigating) slideTo(np.href); else reset();
      y0 = null;
    }, { passive: true });
  })();

  /* ---- Fareyi takip eden nokta ---- */
  (function () {
    if (!s.cursorEnabled) return;
    if (!window.matchMedia || !matchMedia("(pointer: fine)").matches) return;
    var size = Math.max(6, Math.min(64, parseInt(s.cursorSize, 10) || 18));
    var dot = document.createElement("div");
    dot.className = "cursor-dot";
    dot.style.width = dot.style.height = size + "px";
    dot.setAttribute("aria-hidden", "true");
    document.body.appendChild(dot);

    var ease = reduceMotion ? 1 : 0.2;
    var tx = -100, ty = -100, x = -100, y = -100, sc = 1, tsc = 1, started = false, raf = 0;
    function tick() {
      x += (tx - x) * ease; y += (ty - y) * ease; sc += (tsc - sc) * 0.2;
      dot.style.transform = "translate3d(" + (x - size / 2) + "px," + (y - size / 2) + "px,0) scale(" + sc.toFixed(3) + ")";
      raf = (Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1 || Math.abs(tsc - sc) > 0.01) ? requestAnimationFrame(tick) : 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }
    document.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!started) { started = true; x = tx; y = ty; dot.classList.add("show"); }
      var over = e.target.closest && e.target.closest("a, button, input, textarea, select, label");
      tsc = over ? 2.2 : 1; dot.classList.toggle("big", !!over);
      kick();
    }, { passive: true });
    document.addEventListener("mouseleave", function () { dot.classList.remove("show"); started = false; });
    document.addEventListener("mouseenter", function () { dot.classList.add("show"); });
  })();
})();
