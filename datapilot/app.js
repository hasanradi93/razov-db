/* DataPilot AI site: routing (#section or #section/tab), tabs with the keyboard, language and theme,
   the phone "More" sheet, sidebar tooltips, the plans from pricing.json, and the Buy buttons
   (Paddle checkout when config.js has a token and a price id, otherwise an email).
   No cookies. The only things kept are the language and theme, in localStorage, on this device. */
(function () {
  "use strict";

  var C = window.SITE_CONFIG || {};
  var CK = C.checkout || {};
  var doc = document.documentElement;
  var PADDLE_SRC = "https://cdn.paddle.com/paddle/v2/paddle.js";
  var STORE = "dp-site-";
  var MORE = ["how", "faq", "contact", "legal"];       // behind "More" on phones
  var RANK = { free: 0, pro: 1, enterprise: 2 };
  var PLAN_IDS = ["free", "pro", "enterprise"];
  var phoneMq = matchMedia("(max-width: 639px)");
  var tabletMq = matchMedia("(min-width: 640px) and (max-width: 1023px)");
  var darkMq = matchMedia("(prefers-color-scheme: dark)");

  var T = {
    en: {
      brand: "DataPilot AI, home", sections: "Sections",
      toDark: "Switch to dark theme", toLight: "Switch to light theme", toOther: "Switch to Arabic",
      homeTitle: "DataPilot AI: ask your company database in plain words",
      views: { home: "Home", features: "Features", how: "How it works", pricing: "Pricing", download: "Download",
        faq: "Questions and answers", contact: "Contact", legal: "Terms and policies" },
      period: { monthly: "monthly", yearly: "yearly" },
      per: { monthly: "per month", yearly: "per year" },
      from: "from", quoted: "Quoted for your company",
      buy: { monthly: "Buy Pro, monthly", yearly: "Buy Pro, yearly" },
      download: "Download free", contact: "Contact us for a quote",
      fine: { free: "No payment details needed.", pro: "14-day money-back guarantee on the first payment.",
        enterprise: "We reply with a quote for your company." },
      includes: "Includes", plus: "Everything in {p}, plus", soon: "Coming soon",
      included: "Included", notIncluded: "Not included", unlimited: "Unlimited",
      feature: "Feature", limits: "Limits", features: "Features", services: "Services",
      soonBadge: "Soon", plan: "Plan",
      loadFail: "The prices could not be loaded. Email us and we reply with them:",
      opening: "Opening the checkout…",
      mailPro: "Hello,\n\nWe would like to buy DataPilot AI Pro, billed {period} ({price}).\n\nCompany name:\nCountry:\nContact person:\n\nThank you.",
      mailEnt: "Hello,\n\nWe would like a quote for DataPilot AI Enterprise.\n\nCompany name:\nCountry:\nDatabase (type and rough number of tables):\nNumber of people who will use it:\n\nThank you."
    },
    ar: {
      brand: "DataPilot AI، الصفحة الرئيسية", sections: "الأقسام",
      toDark: "التبديل إلى الوضع الداكن", toLight: "التبديل إلى الوضع الفاتح", toOther: "التبديل إلى الإنجليزية",
      homeTitle: "DataPilot AI: اسأل قاعدة بيانات شركتك بكلمات بسيطة",
      views: { home: "الرئيسية", features: "الميزات", how: "كيف يعمل", pricing: "الأسعار", download: "التنزيل",
        faq: "الأسئلة الشائعة", contact: "تواصل معنا", legal: "الشروط والسياسات" },
      period: { monthly: "شهرياً", yearly: "سنوياً" },
      per: { monthly: "شهرياً", yearly: "سنوياً" },
      from: "ابتداءً من", quoted: "عرض سعر لشركتك",
      buy: { monthly: "اشترِ Pro شهرياً", yearly: "اشترِ Pro سنوياً" },
      download: "نزّله مجاناً", contact: "تواصل معنا لعرض سعر",
      fine: { free: "لا حاجة إلى بيانات دفع.", pro: "ضمان استرداد المال خلال 14 يوماً على الدفعة الأولى.",
        enterprise: "نرد عليك بعرض سعر لشركتك." },
      includes: "تتضمن", plus: "كل ما في {p}، إضافةً إلى", soon: "قريباً",
      included: "مشمولة", notIncluded: "غير مشمولة", unlimited: "بلا حد",
      feature: "الميزة", limits: "الحدود", features: "الميزات", services: "الخدمات",
      soonBadge: "قريباً", plan: "الخطة",
      loadFail: "تعذّر تحميل الأسعار. راسلنا ونرسلها إليك:",
      opening: "جارٍ فتح صفحة الدفع…",
      mailPro: "مرحباً،\n\nنرغب في شراء DataPilot AI Pro بالدفع {period} ({price}).\n\nاسم الشركة:\nالبلد:\nالشخص المسؤول:\n\nشكراً.",
      mailEnt: "مرحباً،\n\nنرغب في عرض سعر لخطة DataPilot AI Enterprise.\n\nاسم الشركة:\nالبلد:\nقاعدة البيانات (النوع والعدد التقريبي للجداول):\nعدد الأشخاص الذين سيستخدمونه:\n\nشكراً."
    }
  };

  var state = { view: "home", tab: null, period: "monthly", pricing: null };
  var views = {};      // id -> { el, h1, tabs: [{ id, hash, btn, panel }] }
  var routes = {};     // hash -> { view, tab }

  /* ---------- Small helpers ---------- */
  function lang() { return doc.lang === "ar" ? "ar" : "en"; }
  function t(key) { return T[lang()][key]; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function both(fn) { return '<span data-l="en">' + fn("en") + '</span><span data-l="ar">' + fn("ar") + "</span>"; }
  function tr(l, key) { return T[l][key]; }
  function save(k, v) { try { localStorage.setItem(STORE + k, v); } catch (e) { /* storage blocked: fine */ } }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function icon(name) { return '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>'; }
  function money(n) { return "$" + Number(n).toLocaleString("en-US"); }
  function email() { return String(C.contactEmail || "").trim(); }
  function mailto(subject, body) {
    var q = [];
    if (subject) { q.push("subject=" + encodeURIComponent(subject)); }
    if (body) { q.push("body=" + encodeURIComponent(body)); }
    return "mailto:" + email() + (q.length ? "?" + q.join("&") : "");
  }

  /* ---------- Config into the page: e-mail, download link, version ---------- */
  function applyConfig() {
    if (email()) {
      $$("[data-mail]").forEach(function (a) {
        var subject = a.getAttribute("data-subject");
        if (a.hasAttribute("data-buy")) { return; }
        a.href = a.getAttribute("data-ent") !== null ? mailto(subject, tr(lang(), "mailEnt")) : mailto(subject);
        if (a.getAttribute("data-mail") === "text") { a.textContent = email(); }
      });
    }
    if (C.downloadUrl) { $$("[data-dl]").forEach(function (a) { a.href = C.downloadUrl; }); }
    if (C.version) { $$("[data-version]").forEach(function (s) { s.textContent = C.version; }); }
  }

  /* ---------- Routes: every view and tab, read from the page ---------- */
  function indexRoutes() {
    $$(".view").forEach(function (v) {
      var id = v.getAttribute("data-view");
      var tabs = $$('[role="tab"]', v).map(function (b, i) {
        var tab = b.getAttribute("data-tab");
        var hash = b.getAttribute("data-hash") || (i === 0 ? id : id + "/" + tab);
        routes[hash] = { view: id, tab: tab };
        return { id: tab, hash: hash, btn: b, panel: document.getElementById(b.getAttribute("aria-controls")) };
      });
      views[id] = { el: v, h1: $("h1", v), tabs: tabs };
      if (!routes[id]) { routes[id] = { view: id, tab: tabs.length ? tabs[0].id : null }; }
    });
    routes.guide = routes["download/guide"];
  }

  function parseHash() {
    var h = location.hash.replace(/^#\/?/, "");
    try { h = decodeURIComponent(h); } catch (e) { h = ""; }
    return routes[h] || routes.home;
  }

  function show(viewId, tabId, focus) {
    var v = views[viewId];
    Object.keys(views).forEach(function (id) { views[id].el.classList.toggle("on", id === viewId); });
    v.tabs.forEach(function (tb) {
      var on = tb.id === tabId;
      tb.btn.setAttribute("aria-selected", on ? "true" : "false");
      tb.btn.tabIndex = on ? 0 : -1;
      tb.panel.classList.toggle("on", on);
    });
    state.view = viewId;
    state.tab = tabId;
    $$("[data-nav]").forEach(function (a) {
      if (a.getAttribute("data-nav") === viewId) { a.setAttribute("aria-current", "page"); }
      else { a.removeAttribute("aria-current"); }
    });
    updateTitles();
    if (focus && v.h1) { v.h1.focus({ preventScroll: true }); }
  }

  function route() {
    var r = parseHash();
    var changedView = r.view !== state.view;
    closeSheet(false);
    show(r.view, r.tab, changedView);
  }

  function activateTab(viewId, tabId, mode) {
    var tb = views[viewId].tabs.filter(function (x) { return x.id === tabId; })[0];
    if (!tb) { return; }
    if (location.hash !== "#" + tb.hash) {
      if (mode === "push") { history.pushState(null, "", "#" + tb.hash); }
      else { history.replaceState(null, "", "#" + tb.hash); }
    }
    show(viewId, tabId, false);
  }

  function updateTitles() {
    var name = t("views")[state.view];
    document.title = state.view === "home" ? t("homeTitle") : name + " · DataPilot AI";
    $("#hdr-title").textContent = state.view === "home" ? "DataPilot AI" : name;
    var more = $("#btn-more"), inMore = MORE.indexOf(state.view) >= 0;
    more.classList.toggle("on", inMore);
    $("#more-cur").textContent = inMore ? ", " + name : "";
  }

  /* ---------- Tabs: click and keyboard (arrows mirror in Arabic) ---------- */
  function wireTabs() {
    $$('[role="tablist"]').forEach(function (list) {
      var viewId = list.closest(".view").getAttribute("data-view");
      var tabs = $$('[role="tab"]', list);
      list.addEventListener("click", function (e) {
        var b = e.target.closest('[role="tab"]');
        if (b) { activateTab(viewId, b.getAttribute("data-tab"), "push"); }
      });
      list.addEventListener("keydown", function (e) {
        var i = tabs.indexOf(e.target), n = -1, rtl = doc.dir === "rtl";
        if (i < 0) { return; }
        if (e.key === "ArrowRight") { n = rtl ? i - 1 : i + 1; }
        else if (e.key === "ArrowLeft") { n = rtl ? i + 1 : i - 1; }
        else if (e.key === "Home") { n = 0; }
        else if (e.key === "End") { n = tabs.length - 1; }
        else { return; }
        e.preventDefault();
        n = (n + tabs.length) % tabs.length;
        tabs[n].focus();
        activateTab(viewId, tabs[n].getAttribute("data-tab"), "replace");
      });
    });
  }

  /* ---------- Language and theme ---------- */
  function effectiveTheme() {
    return doc.getAttribute("data-theme") || (darkMq.matches ? "dark" : "light");
  }
  function applyLabels() {
    var dark = effectiveTheme() === "dark";
    var tb = $("#btn-theme");
    tb.setAttribute("aria-label", dark ? t("toLight") : t("toDark"));
    $("use", tb).setAttribute("href", dark ? "#i-sun" : "#i-moon");
    $("#btn-lang").setAttribute("aria-label", t("toOther"));
    $("#brand").setAttribute("aria-label", t("brand"));
    $("#sidebar").setAttribute("aria-label", t("sections"));
    $("#tabbar").setAttribute("aria-label", t("sections"));
  }
  function setLang(l) {
    doc.lang = l;
    doc.dir = l === "ar" ? "rtl" : "ltr";
    save("lang", l);
    if (/[?&]lang=/.test(location.search)) {
      history.replaceState(null, "", location.pathname + location.hash);
    }
    applyLabels();
    applyConfig();
    setBuyLinks();
    updateTitles();
    hideTip();
  }

  /* ---------- Phone: the "More" sheet ---------- */
  function openSheet() {
    $("#scrim").hidden = false;
    $("#sheet").hidden = false;
    $("#btn-more").setAttribute("aria-expanded", "true");
    var cur = $('#sheet [aria-current="page"]') || $("#sheet a");
    cur.focus();
  }
  function closeSheet(returnFocus) {
    var sheet = $("#sheet");
    if (sheet.hidden) { return; }
    sheet.hidden = true;
    $("#scrim").hidden = true;
    $("#btn-more").setAttribute("aria-expanded", "false");
    if (returnFocus) { $("#btn-more").focus(); }
  }

  /* ---------- Tablet: names of the icon-only sidebar links ---------- */
  var tip;
  function showTip(a) {
    if (!tabletMq.matches) { return; }
    var label = $('.lbl [data-l="' + lang() + '"]', a);
    if (!label) { return; }
    tip.textContent = label.textContent;
    tip.hidden = false;
    var r = a.getBoundingClientRect();
    var left = doc.dir === "rtl" ? r.left - 8 - tip.offsetWidth : r.right + 8;
    tip.style.left = Math.max(4, left) + "px";
    tip.style.top = Math.round(r.top + r.height / 2 - tip.offsetHeight / 2) + "px";
  }
  function hideTip() { if (tip) { tip.hidden = true; } }

  /* ---------- Pricing ---------- */
  function planById(id) { return state.pricing.plans.filter(function (p) { return p.id === id; })[0]; }
  function featuresOf(planId, built) {
    return state.pricing.features.filter(function (f) { return f.plan === planId && f.built === built; });
  }
  function checks(items, soon) {
    if (!items.length) { return ""; }
    return '<ul class="checks' + (soon ? " soon" : "") + '">' + items.map(function (it) {
      return "<li>" + icon(soon ? "clock" : "check") + "<span>" + both(function (l) { return esc(it[l]); }) + "</span></li>";
    }).join("") + "</ul>";
  }
  function proPrice(period) { return planById("pro").price[period]; }

  function planCard(p) {
    var period = state.period, prev = PLAN_IDS[RANK[p.id] - 1];
    var h = '<article class="plan' + (p.highlight ? " hl" : "") + '" aria-labelledby="plan-' + p.id + '">';
    h += '<h2 id="plan-' + p.id + '">' + both(function (l) { return esc(p.name[l]); }) +
      (p.highlight ? '<span class="badge pro">' + both(function (l) { return esc(p.highlight[l]); }) + "</span>" : "") + "</h2>";
    h += '<p class="tagline">' + both(function (l) { return esc(p.tagline[l]); }) + "</p>";
    if (p.quoted) {
      h += '<div class="price"><span class="per">' + both(function (l) { return tr(l, "from"); }) + '</span><span class="amt ltr">' +
        money(p.price.monthlyFrom) + '</span><span class="per">' + both(function (l) { return tr(l, "per").monthly; }) + "</span></div>";
      h += '<div class="save" style="color:var(--muted)">' + both(function (l) { return tr(l, "quoted"); }) + "</div>";
    } else {
      h += '<div class="price"><span class="amt ltr">' + money(p.price[period]) + '</span><span class="per">' +
        both(function (l) { return tr(l, "per")[period]; }) + "</span></div>";
      h += '<div class="save">' + (period === "yearly" && p.yearlyNote ? both(function (l) { return esc(p.yearlyNote[l]); }) : "") + "</div>";
    }
    if (p.action === "download") {
      h += '<a class="btn block" data-dl href="' + esc(C.downloadUrl || "#download") + '">' + icon("download") + both(function (l) { return tr(l, "download"); }) + "</a>";
    } else if (p.action === "buy") {
      h += '<a class="btn primary block" id="buy-pro" data-buy href="#">' + both(function (l) { return tr(l, "buy")[period]; }) + "</a>";
    } else {
      h += '<a class="btn block" id="quote-ent" data-mail data-ent data-subject="DataPilot Enterprise, quote" href="#">' + icon("contact") +
        both(function (l) { return tr(l, "contact"); }) + "</a>";
    }
    h += '<p class="fine">' + both(function (l) { return tr(l, "fine")[p.id]; }) + "</p>";
    var heading = prev ? both(function (l) { return esc(tr(l, "plus").replace("{p}", planById(prev).name[l])); })
      : both(function (l) { return tr(l, "includes"); });
    var built = (p.extras || []).concat(featuresOf(p.id, true).map(function (f) { return f.label; }));
    var soon = featuresOf(p.id, false).map(function (f) { return f.label; });
    h += '<div class="grow"><h3>' + heading + "</h3>" + checks(built, false);
    if (soon.length) { h += "<h3>" + both(function (l) { return tr(l, "soon"); }) + "</h3>" + checks(soon, true); }
    h += "</div></article>";
    return h;
  }

  function cell(included, soon) {
    if (included && soon) { return '<td><span class="badge soon">' + both(function (l) { return tr(l, "soonBadge"); }) + "</span></td>"; }
    if (included) { return '<td class="yes">' + icon("check") + '<span class="sr">' + both(function (l) { return tr(l, "included"); }) + "</span></td>"; }
    return '<td class="no"><span aria-hidden="true">—</span><span class="sr">' + both(function (l) { return tr(l, "notIncluded"); }) + "</span></td>";
  }
  function limitText(v) {
    if (v === null) { return both(function (l) { return tr(l, "unlimited"); }); }
    if (v === 0) { return '<span aria-hidden="true">—</span><span class="sr">' + both(function (l) { return tr(l, "notIncluded"); }) + "</span>"; }
    return String(v);
  }
  function compareTable() {
    var d = state.pricing;
    var head = "<tr><th scope=\"col\">" + both(function (l) { return tr(l, "feature"); }) + "</th>" + d.plans.map(function (p) {
      return '<th scope="col">' + both(function (l) { return esc(p.name[l]); }) + "</th>";
    }).join("") + "</tr>";
    function group(key) { return '<tr class="grp"><td colspan="4">' + both(function (l) { return tr(l, key); }) + "</td></tr>"; }
    var rows = group("limits");
    Object.keys(d.limits).forEach(function (k) {
      var lim = d.limits[k];
      rows += '<tr><th scope="row">' + both(function (l) { return esc(lim.label[l]); }) + "</th>" +
        PLAN_IDS.map(function (id) { return "<td>" + limitText(lim.values[id]) + "</td>"; }).join("") + "</tr>";
    });
    rows += group("features");
    d.features.forEach(function (f) {
      rows += '<tr><th scope="row">' + both(function (l) { return esc(f.label[l]); }) + "<small>" + both(function (l) { return esc(f.desc[l]); }) + "</small></th>" +
        PLAN_IDS.map(function (id) { return cell(RANK[f.plan] <= RANK[id], !f.built); }).join("") + "</tr>";
    });
    rows += group("services");
    d.services.forEach(function (s) {
      rows += '<tr><th scope="row">' + both(function (l) { return esc(s.label[l]); }) + "</th>" +
        PLAN_IDS.map(function (id) { return cell(s.plans.indexOf(id) >= 0, false); }).join("") + "</tr>";
    });
    return '<div class="tablewrap" role="region" tabindex="0" aria-labelledby="t-pricing-compare"><table class="compare"><thead>' + head +
      "</thead><tbody>" + rows + "</tbody></table></div>";
  }

  function renderPlans() {
    $("#plans").innerHTML = state.pricing.plans.map(planCard).join("");
    applyConfig();
    setBuyLinks();
  }
  function loadPricing() {
    fetch("pricing.json", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) { throw new Error("pricing.json: HTTP " + r.status); }
      return r.json();
    }).then(function (data) {
      state.pricing = data;
      renderPlans();
      $("#compare").innerHTML = compareTable();
    }).catch(function () {
      var msg = '<p class="muted">' + both(function (l) { return tr(l, "loadFail"); }) +
        ' <a data-mail="text" href="' + esc(mailto("DataPilot AI prices")) + '">' + esc(email()) + "</a></p>";
      $("#plans").innerHTML = msg;
      $("#compare").innerHTML = msg;
    });
  }

  /* ---------- Buy: Paddle checkout when configured, otherwise an e-mail ---------- */
  function priceId(period) { return String(CK[period === "yearly" ? "proYearlyPriceId" : "proMonthlyPriceId"] || "").trim(); }
  function paddleReady(period) {
    return String(CK.provider || "paddle") === "paddle" && String(CK.clientToken || "").trim() !== "" && priceId(period) !== "";
  }
  function buyMailto(period) {
    var price = money(proPrice(period)) + " " + T[lang()].per[period];
    var body = T[lang()].mailPro.replace("{period}", T[lang()].period[period]).replace("{price}", price);
    return mailto("DataPilot Pro, " + period, body);
  }
  function setBuyLinks() {
    if (!state.pricing) { return; }
    $$("[data-buy]").forEach(function (a) {
      a.href = buyMailto(state.period);
      a.setAttribute("data-period", state.period);
    });
    var ent = $("#quote-ent");
    if (ent) { ent.href = mailto("DataPilot Enterprise, quote", T[lang()].mailEnt); }
  }

  var paddleLoading = null;
  function loadPaddle() {
    if (!paddleLoading) {
      paddleLoading = new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = PADDLE_SRC;
        s.async = true;
        s.onload = function () {
          try {
            if (String(CK.environment) === "sandbox") { window.Paddle.Environment.set("sandbox"); }
            window.Paddle.Initialize({ token: String(CK.clientToken).trim() });
            resolve(window.Paddle);
          } catch (err) { reject(err); }
        };
        s.onerror = function () { paddleLoading = null; reject(new Error("Paddle.js did not load")); };
        document.head.appendChild(s);
      });
    }
    return paddleLoading;
  }
  function buy(a, e) {
    var period = a.getAttribute("data-period") || state.period;
    if (!paddleReady(period)) { return; }            // the mailto link does the work
    e.preventDefault();
    if (a.getAttribute("aria-busy") === "true") { return; }
    a.setAttribute("aria-busy", "true");
    loadPaddle().then(function (Paddle) {
      Paddle.Checkout.open({ items: [{ priceId: priceId(period), quantity: 1 }] });
    }).catch(function () {
      location.href = buyMailto(period);               // checkout unavailable: write to us instead
    }).then(function () { a.removeAttribute("aria-busy"); });
  }

  /* ---------- Wiring ---------- */
  function init() {
    tip = $("#tip");
    indexRoutes();
    applyConfig();
    applyLabels();
    wireTabs();
    route();

    window.addEventListener("hashchange", route);

    $("#skip").addEventListener("click", function (e) {
      e.preventDefault();
      var h1 = views[state.view].h1;
      if (h1) { h1.focus(); }
    });
    $("#btn-theme").addEventListener("click", function () {
      var next = effectiveTheme() === "dark" ? "light" : "dark";
      doc.setAttribute("data-theme", next);
      save("theme", next);
      applyLabels();
    });
    darkMq.addEventListener("change", applyLabels);
    $("#btn-lang").addEventListener("click", function () { setLang(lang() === "ar" ? "en" : "ar"); });

    $("#btn-more").addEventListener("click", function () {
      if ($("#sheet").hidden) { openSheet(); } else { closeSheet(true); }
    });
    $("#scrim").addEventListener("click", function () { closeSheet(true); });
    $("#sheet").addEventListener("click", function (e) { if (e.target.closest("a")) { closeSheet(false); } });
    document.addEventListener("keydown", function (e) {
      var sheet = $("#sheet");
      if (sheet.hidden) { return; }
      if (e.key === "Escape") { e.preventDefault(); closeSheet(true); return; }
      if (e.key === "Tab") {                              // keep focus inside the sheet
        var links = $$("a", sheet), first = links[0], last = links[links.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    phoneMq.addEventListener("change", function () { closeSheet(false); });

    $$(".sidebar a").forEach(function (a) {
      a.addEventListener("mouseenter", function () { showTip(a); });
      a.addEventListener("focus", function () { showTip(a); });
      a.addEventListener("mouseleave", hideTip);
      a.addEventListener("blur", hideTip);
    });
    tabletMq.addEventListener("change", hideTip);
    $("#sidebar").addEventListener("scroll", hideTip);

    $$('#billing input[name="billing"]').forEach(function (r) {
      r.addEventListener("change", function () {
        if (!r.checked) { return; }
        state.period = r.value;
        if (state.pricing) { renderPlans(); }
      });
    });
    $("#plans").addEventListener("click", function (e) {
      var a = e.target.closest("[data-buy]");
      if (a) { buy(a, e); }
    });

    loadPricing();
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); } else { init(); }
})();
