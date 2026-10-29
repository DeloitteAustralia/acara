/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/carousel-side-caption.js
  function isEmptyNode(el) {
    if (!el) return true;
    if (el.querySelector && el.querySelector("img, picture, video, iframe")) return false;
    return !(el.textContent || "").replace(/ /g, " ").trim();
  }
  function parse(element, { document }) {
    const cells = [];
    let slides = [...element.querySelectorAll(":scope > .carousel-inner > .item")];
    if (!slides.length) slides = [...element.querySelectorAll(".item")];
    slides.forEach((slide) => {
      const imageCol = slide.querySelector('[class*="col-md-9"]') || slide;
      const img = imageCol.querySelector("img");
      let imageCell = "";
      if (img) {
        const pic = document.createElement("img");
        pic.src = img.getAttribute("src") || img.src;
        pic.alt = img.getAttribute("alt") || img.getAttribute("title") || "";
        const link = img.closest("a");
        if (link && link.getAttribute("href")) {
          const a = document.createElement("a");
          a.href = link.getAttribute("href").trim();
          a.append(pic);
          imageCell = a;
        } else {
          imageCell = pic;
        }
      }
      const captionRoot = slide.querySelector(".carousel-caption .sfContentBlock") || slide.querySelector(".carousel-caption");
      const captionCell = [];
      if (captionRoot) {
        [...captionRoot.children].forEach((child) => {
          if (child.tagName === "BR" || isEmptyNode(child)) return;
          if (child.tagName === "DIV") {
            const p = document.createElement("p");
            p.innerHTML = child.innerHTML;
            captionCell.push(p);
          } else {
            captionCell.push(child);
          }
        });
      }
      if (!imageCell && !captionCell.length) return;
      cells.push([imageCell, captionCell.length ? captionCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-side-caption", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-article.js
  function parse2(element, { document }) {
    if (!element.parentNode || element.isConnected === false) return;
    const scope = element.closest("#content1, .bottom-section") || document;
    let articles = [...scope.querySelectorAll(".divarticle")];
    if (!articles.includes(element)) articles = [element, ...articles];
    const cells = [];
    articles.forEach((article) => {
      const img = article.querySelector(".divArticleImage img, img");
      let imageCell = "";
      if (img) {
        const pic = document.createElement("img");
        pic.src = img.getAttribute("src") || img.src;
        pic.alt = img.getAttribute("alt") || img.getAttribute("title") || "";
        imageCell = pic;
      }
      const content = article.querySelector(".divArticleContent .sfContentBlock") || article.querySelector(".divArticleContent") || article;
      const bodyCell = [];
      [...content.children].forEach((child) => {
        if (child.tagName === "BR") return;
        if (!child.textContent.trim() && !child.querySelector("img, a")) return;
        if (child.tagName === "P") {
          const link = child.querySelector(":scope > a:last-of-type");
          if (link && child.lastElementChild === link) {
            link.remove();
            while (child.lastChild && (child.lastChild.nodeName === "BR" || child.lastChild.nodeType === 3 && !child.lastChild.textContent.trim())) {
              child.lastChild.remove();
            }
            if (child.textContent.trim()) bodyCell.push(child);
            const p = document.createElement("p");
            p.append(link);
            bodyCell.push(p);
            return;
          }
        }
        bodyCell.push(child);
      });
      if (!imageCell && !bodyCell.length) return;
      cells.push([imageCell, bodyCell.length ? bodyCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-article", cells });
    element.replaceWith(block);
    articles.forEach((article) => {
      if (article !== element && article.parentNode) article.remove();
    });
  }

  // tools/importer/parsers/cards-news.js
  function parse3(element, { document }) {
    if (!element.parentNode || element.isConnected === false) return;
    let items = [...element.parentNode.querySelectorAll(":scope > .whatsnew")];
    if (!items.includes(element)) items = [element, ...items];
    const cells = [];
    items.forEach((item) => {
      const contentCell = [];
      const title = item.querySelector("h1, h2, h3, h4, h5, h6");
      if (title) {
        const h4 = document.createElement("h4");
        h4.innerHTML = title.innerHTML.trim();
        contentCell.push(h4);
      }
      const dateEl = item.querySelector(":scope > div strong, :scope > div b, :scope > div");
      if (dateEl && dateEl.textContent.trim()) {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = dateEl.textContent.trim();
        p.append(strong);
        contentCell.push(p);
      }
      item.querySelectorAll(":scope > p").forEach((p) => {
        if (p.textContent.trim()) contentCell.push(p);
      });
      const link = item.querySelector(":scope > a[href]");
      if (link) {
        const a = document.createElement("a");
        a.href = link.getAttribute("href");
        if (link.getAttribute("title")) a.title = link.getAttribute("title");
        a.textContent = link.textContent.trim() || "read more";
        const p = document.createElement("p");
        p.append(a);
        contentCell.push(p);
      }
      if (contentCell.length) cells.push([contentCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-news", cells });
    element.replaceWith(block);
    items.forEach((item) => {
      if (item !== element && item.parentNode) item.remove();
    });
  }

  // tools/importer/transformers/nap-cleanup.js
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      WebImporter.DOMUtils.remove(element, [
        "div.container.logo-header",
        "section.navigation-top"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "#footer1",
        "div.footer",
        "div.bottom-bar"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "div.aspNetHidden",
        "input",
        "button",
        "select",
        "textarea"
      ]);
      WebImporter.DOMUtils.remove(element, ["article.hideCtrl", ".hidectrl"]);
      WebImporter.DOMUtils.remove(element, [
        "ol.carousel-indicators",
        ".carousel-control"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "script",
        "style",
        "noscript",
        "link",
        "iframe"
      ]);
      element.querySelectorAll("form#form1").forEach((form) => {
        form.replaceWith(...form.childNodes);
      });
    }
    if (hookName === "afterTransform") {
      WebImporter.DOMUtils.remove(element, [
        "script",
        "style",
        "noscript",
        "link",
        "iframe",
        "input",
        "form"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach((attr) => {
          const n = attr.name;
          if (n.startsWith("data-") && !n.startsWith("data-excat-")) el.removeAttribute(n);
          if (n.startsWith("on")) el.removeAttribute(n);
        });
      });
    }
  }

  // tools/importer/transformers/nap-sections.js
  var MARKER_ATTR = "data-excat-section-id";
  function findSectionElement(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const template = payload && payload.template;
    const sections = template && Array.isArray(template.sections) ? template.sections : [];
    if (sections.length < 2) return;
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const sectionEl = findSectionElement(element, section);
        if (!sectionEl) continue;
        if (i > 0 || section.style) {
          const hr = document.createElement("hr");
          if (section.style) hr.setAttribute(MARKER_ATTR, section.id);
          if (i === 0) hr.setAttribute("data-excat-first-section", "true");
          sectionEl.parentNode.insertBefore(hr, sectionEl);
        }
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const marker = element.querySelector(`hr[${MARKER_ATTR}="${section.id}"]`);
        if (section.style) {
          const metadata = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          const sectionEl = findSectionElement(element, section);
          if (sectionEl && sectionEl.parentNode) {
            sectionEl.after(metadata);
          } else if (marker && marker.nextElementSibling) {
            marker.nextElementSibling.after(metadata);
          } else if (marker) {
            marker.after(metadata);
          }
        }
        if (marker) {
          if (marker.hasAttribute("data-excat-first-section")) {
            marker.remove();
          } else {
            marker.removeAttribute(MARKER_ATTR);
          }
        }
      }
      element.querySelectorAll("hr[data-excat-first-section]").forEach((hr) => hr.remove());
    }
  }

  // tools/importer/import-home.js
  var PAGE_TEMPLATE = {
    "name": "home",
    "urls": [
      "https://www.nap.edu.au/home"
    ],
    "representativeUrl": "https://www.nap.edu.au/home",
    "description": "NAP home page: banner carousel with side caption, three article cards and a What's New news panel",
    "urlPattern": "/*",
    "blocks": [
      {
        "name": "carousel-side-caption",
        "instances": [
          "#home-carousel",
          "section.banner .carousel"
        ]
      },
      {
        "name": "cards-article",
        "instances": [
          "#content1 .divarticle",
          ".bottom-section .divarticle"
        ]
      },
      {
        "name": "cards-news",
        "instances": [
          "#content1 .whatsnew",
          "article.divNewsContent .whatsnew"
        ]
      }
    ],
    "sections": [
      {
        "id": "rc4",
        "name": "Banner carousel",
        "selector": [
          "section.banner",
          "#form1 > section.banner"
        ],
        "style": "blue",
        "blocks": [
          "carousel-side-caption"
        ],
        "defaultContent": []
      },
      {
        "id": "rc5",
        "name": "Featured articles and What's New",
        "selector": [
          "#content1",
          ".bottom-section"
        ],
        "style": "split",
        "blocks": [
          "cards-article",
          "cards-news"
        ],
        "defaultContent": [
          "article.divNewsContent > h3"
        ]
      }
    ]
  };
  var parsers = {
    "carousel-side-caption": parse,
    "cards-article": parse2,
    "cards-news": parse3
  };
  var transformers = [transform, transform2];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element) => {
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    return pageBlocks;
  }
  var import_home_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
