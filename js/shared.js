/* Hem site hem admin tarafından kullanılan ortak yardımcılar. */
(function () {
  var DRAFT_KEY = "portfolio-draft-v1";

  var DESIGN_DEFAULTS = {
    accent: "#7b42bc",       // vurgu rengi (butonlar, bağlantılar)
    dark: "#15181e",         // koyu bölümler: menü, hero, alt bilgi
    bg: "#ffffff",           // açık bölümlerin arka planı
    text: "#15181e",         // açık bölümlerdeki yazı rengi
    font: "sans",
    cursorEnabled: true,     // fareyi takip eden nokta
    cursorColor: "#4a3b63",  // koyu, doygunluğu düşük mor
    cursorSize: 18,
    logo: "",                // boşsa site adının ilk harfinden otomatik logo çıkar
    logoShowName: true,      // logonun yanında site adı görünsün
    logoHeight: 32
  };
  var HOME_DEFAULTS = {
    heroEyebrow: "Portfolio",
    bandTitle: "Let's work together.",
    bandText: "Have a project, a piece of research or a collaboration in mind? Get in touch.",
    bandButton: "Contact"
  };

  /* Yeni sayfaların varsayılan içeriği. Eski bir site-data.js'te bu bölümler yoksa buradan doldurulur. */
  var CONTENT_DEFAULTS = {
    about: {
      title: "About Us",
      lead: "Who we are, what drives us and how we got here.",
      intro: "",
      mission: "",
      vision: "",
      references: [],
      history: []
    },
    capabilities: { title: "Capabilities", intro: "What we do and the technologies we use to do it.", items: [] },
    products: { title: "Products", intro: "Solutions we build for our customers.", items: [] },
    apps: { title: "Apps", intro: "Free tools and applications built by us, available to download.", items: [] },
    careers: { title: "Careers", intro: "We are always looking for curious people who enjoy solving hard problems.", applyEmail: "", perks: [], jobs: [] },
    news: { title: "News & Publications", intro: "Company news, press coverage and research publications.", items: [] }
  };

  var FONTS = { sans: "var(--font-sans)", serif: "var(--font-serif)", mono: "var(--font-mono)" };
  /* Yazı biçimi nesnesini ({font,size,color,align,bold,italic}) style özniteliğine çevirir */
  function fmtStyle(f) {
    if (!f) return "";
    var o = [], sz = parseFloat(f.size);
    if (f.font && FONTS[f.font]) o.push("font-family:" + FONTS[f.font]);
    if (sz > 0) o.push("font-size:" + Math.min(96, Math.max(10, sz)) + "px");
    if (f.color && /^#[0-9a-f]{3,8}$/i.test(f.color)) o.push("color:" + f.color);
    if (["left", "center", "right", "justify"].indexOf(f.align) > -1) { o.push("text-align:" + f.align); if (f.align === "justify") o.push("hyphens:auto"); }
    if (f.bold) o.push("font-weight:700");
    if (f.italic) o.push("font-style:italic");
    return o.join(";");
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function readDraft() {
    try { var d = localStorage.getItem(DRAFT_KEY); return d ? JSON.parse(d) : null; } catch (e) { return null; }
  }

  /* Eksik alanları tamamlar. Eski tasarıma ait (designVersion yok) renk ayarlarını yeni tasarımın varsayılanlarıyla değiştirir. */
  function normalize(d) {
    d = JSON.parse(JSON.stringify(d || {}));
    d.settings = d.settings || {};
    var s = d.settings, k;
    if (s.designVersion !== 2) {
      ["accent", "dark", "bg", "text", "cursorEnabled", "cursorColor", "cursorSize"].forEach(function (key) { s[key] = DESIGN_DEFAULTS[key]; });
      s.designVersion = 2;
    }
    for (k in DESIGN_DEFAULTS) if (s[k] === undefined) s[k] = DESIGN_DEFAULTS[k];
    d.home = d.home || {};
    for (k in HOME_DEFAULTS) if (d.home[k] === undefined) d.home[k] = HOME_DEFAULTS[k];
    var c = JSON.parse(JSON.stringify(CONTENT_DEFAULTS));
    if (!d.about || d.about.mission === undefined) d.about = c.about;        // eski "About me" yapısı yeni About Us ile değişir
    ["capabilities", "products", "apps", "careers", "news"].forEach(function (key) { if (d[key] === undefined) d[key] = c[key]; });
    d.contact = d.contact || {};
    if (d.contact.address === undefined) d.contact.address = "";
    d.pageBlocks = d.pageBlocks || {};      // sayfalara eklenen metin/görsel/dosya blokları
    d.textStyles = d.textStyles || {};      // ana metinlerin yazı biçimi
    (d.projects || []).forEach(function (p) { if (!Array.isArray(p.blocks)) p.blocks = []; });
    return d;
  }

  window.PortfolioShared = { DRAFT_KEY: DRAFT_KEY, esc: esc, readDraft: readDraft, normalize: normalize, fmtStyle: fmtStyle };
})();
