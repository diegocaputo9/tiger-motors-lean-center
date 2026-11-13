// Flow lesson: one-piece flow against batches, in 3D.
// Plain ES module for the Tiger Motors Lean Education Center site (no build step).
//
// Uses the site's own import map:  "three" -> ./lab3d/vendor/three.module.js
//                                  "three/addons/" -> ./lab3d/vendor/jsm/
// Colors come from the --fls-* custom properties in flow-lesson.css, which
// point at the site's palette (--orange, --bg-2, --text ...), so the model
// follows dark and light mode on its own.
//
// Usage:  <div class="fls" data-flow-lesson></div>
//         <script type="module" src="flow-lesson.js"></script>
// Every [data-flow-lesson] element on the page becomes a banner that opens
// the lesson. Add data-open to start opened.
//
// The model is the classroom exercise with no transport time: ten parts,
// three stations, one minute per part per station.
//   one-piece flow: first part out at minute 3, all ten at minute 12
//   batches of ten: first part out at minute 21, all ten at minute 30
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ----------------------------------------------------------------- text
// All visible wording in one place (for the site's i18n, translate these).
const STR = {
  title: "A lean lesson you can run",
  teaser: "One-piece flow against batches, in 3D",
  open: "Open the 3D lesson",
  close: "Close",
  text: "Ten parts, three stations, one minute per step. The two lines differ in one thing only: how many parts move at a time. Watch when the first part comes out, and when the whole order is done.",
  hint: "Drag to turn the model. Change the batch size to run it again.",
  back: "Back line",
  front: "Front line",
  flow: "One-piece flow",
  batches: (n) => `Batches of ${n}`,
  minute: "Minute",
  first: "First part out",
  all: (n) => `All ${n} out`,
  batchSize: "Batch size",
  again: "Run again",
  min: (v) => `${v} min`,
  stations: ["Cut", "Weld", "Paint"],
  noWebgl: "The 3D view needs WebGL, which is turned off in this browser.",
  aria: (b, f, l) =>
    `3D model of two production lines making ten parts through three stations. One-piece flow finishes its first part at minute ${f.first} and all ten at minute ${f.all}; batches of ${b} finish the first part at minute ${l.first} and all ten at minute ${l.all}. Drag to rotate.`,
};

// ----------------------------------------------------------------- model
const PARTS = 10;
const N = 3; // stations
const SIZES = [2, 5, 10];
const MIN = 0.55; // seconds of animation per simulated minute
const MOVE = 0.45; // minutes a part takes to hop to its next place (visual only)

/** When each part starts and finishes at each station, for a transfer batch of size b. */
function schedule(b) {
  const start = [];
  const finish = [];
  for (let k = 0; k < N; k++) {
    start.push([]);
    finish.push([]);
    for (let i = 0; i < PARTS; i++) {
      // a part reaches station k once the last part of its batch leaves station k-1
      const lastOfBatch = Math.min((Math.floor(i / b) + 1) * b, PARTS) - 1;
      const arrives = k === 0 ? 0 : finish[k - 1][lastOfBatch];
      const s = Math.max(arrives, i === 0 ? 0 : finish[k][i - 1]);
      start[k].push(s);
      finish[k].push(s + 1);
    }
  }
  return { start, finish };
}
function milestones(b) {
  const { finish } = schedule(b);
  return { first: finish[N - 1][0], all: finish[N - 1][PARTS - 1] };
}

// layout
const PITCH = 2.7; // station spacing along the line
const X0 = -PITCH; // first station
const LANE = 1.8; // each line sits this far from the middle
const TOP = 0.52; // top of a machine bed
const PART = 0.34;
const stationX = (k) => X0 + k * PITCH;
// pads: 0 = raw stock, 1..N-1 = between stations, N = finished goods
const padX = (p) => (p === 0 ? X0 - 1.75 : p === N ? stationX(N - 1) + 1.75 : stationX(p - 1) + PITCH / 2);
// ten places on a pad, two across and five deep
const slot = (j, p, z) => new THREE.Vector3(padX(p) + (j % 2 ? 0.21 : -0.21), PART / 2 + 0.03, z + (Math.floor(j / 2) - 2) * 0.42);

/** The places one part visits, with the minute it leaves for each. */
function path(i, b, z) {
  const { start, finish } = schedule(b);
  const keys = [{ t: -1, pos: slot(i, 0, z) }];
  for (let k = 0; k < N; k++) {
    keys.push({ t: start[k][i], pos: new THREE.Vector3(stationX(k), TOP + PART / 2, z) });
    const next = k === N - 1 ? Infinity : start[k + 1][i];
    // with no wait ahead, the part goes straight to the next station
    if (next > finish[k][i]) keys.push({ t: finish[k][i], pos: slot(k === N - 1 ? i : i % b, k + 1, z) });
  }
  return { keys, start: start.map((s) => s[i]) };
}

// Any CSS color (hex, rgb(), var() result) -> THREE.Color, through the browser's own parser.
function cssColor(host, name, fallback) {
  const probe = document.createElement("span");
  probe.style.color = getComputedStyle(host).getPropertyValue(name).trim() || fallback;
  host.appendChild(probe);
  const m = getComputedStyle(probe).color.match(/[\d.]+/g) || [0, 0, 0];
  probe.remove();
  return new THREE.Color().setRGB(m[0] / 255, m[1] / 255, m[2] / 255, THREE.SRGBColorSpace);
}

function createScene(canvas, host, opts) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  const target = new THREE.Vector3(0, 0.35, 0);

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.rotateSpeed = 0.6;
  controls.minPolarAngle = 0.7;
  controls.maxPolarAngle = 1.25;
  canvas.style.touchAction = "pan-y"; // vertical swipes scroll the page; horizontal drags rotate

  const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1.9);
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(4, 9, 6);
  scene.add(hemi, sun);

  const bodyMat = new THREE.MeshLambertMaterial();
  const floorMat = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.55 });
  const headMat = new THREE.MeshLambertMaterial();
  const edgeMat = new THREE.LineBasicMaterial();
  const railMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.7 });
  const partEdgeMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55 });

  const box = (w, h, d, mat, edges = true) => {
    const g = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(g, mat);
    if (edges) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), edgeMat));
    return m;
  };

  // the two lines: floor plate, pad outlines, rails, three stations each
  const heads = [[], []];
  const lanes = [-LANE, LANE]; // back = one-piece flow, front = batches
  const lines = [];
  const rect = (cx, cz, w, d) => {
    const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, y = 0.012;
    lines.push(x0, y, z0, x1, y, z0, x1, y, z0, x1, y, z1, x1, y, z1, x0, y, z1, x0, y, z1, x0, y, z0);
  };
  const length = padX(N) - padX(0);
  lanes.forEach((z, li) => {
    const plate = box(length + 1.5, 0.04, 2.8, floorMat, false);
    plate.position.set(0, -0.02, z);
    scene.add(plate);
    rect(0, z, length + 1.5, 2.8);
    for (let p = 0; p <= N; p++) rect(padX(p), z, 0.96, 2.3);
    lines.push(padX(0) + 0.48, 0.012, z - 0.14, padX(N) - 0.48, 0.012, z - 0.14);
    lines.push(padX(0) + 0.48, 0.012, z + 0.14, padX(N) - 0.48, 0.012, z + 0.14);
    for (let k = 0; k < N; k++) {
      const x = stationX(k);
      const bed = box(1.05, TOP, 1.15, bodyMat);
      bed.position.set(x, TOP / 2, z);
      const postA = box(0.09, 1.05, 0.09, bodyMat);
      postA.position.set(x, TOP + 0.525, z - 0.5);
      const postB = box(0.09, 1.05, 0.09, bodyMat);
      postB.position.set(x, TOP + 0.525, z + 0.5);
      const beam = box(0.13, 0.11, 1.09, bodyMat);
      beam.position.set(x, TOP + 1.1, z);
      const head = box(0.42, 0.16, 0.42, headMat);
      head.position.set(x, TOP + 0.95, z);
      heads[li].push(head);
      scene.add(bed, postA, postB, beam, head);
    }
  });
  const railGeo = new THREE.BufferGeometry();
  railGeo.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
  scene.add(new THREE.LineSegments(railGeo, railMat));

  // parts
  const partGeo = new THREE.BoxGeometry(PART, PART, PART);
  const partEdges = new THREE.EdgesGeometry(partGeo);
  const parts = [[], []];
  for (let li = 0; li < 2; li++)
    for (let i = 0; i < PARTS; i++) {
      const mat = new THREE.MeshLambertMaterial();
      const mesh = new THREE.Mesh(partGeo, mat);
      mesh.add(new THREE.LineSegments(partEdges, partEdgeMat));
      scene.add(mesh);
      parts[li].push({ mesh, mat, keys: [], start: [] });
    }

  let batch = opts.batch;
  let end = 0;
  function plan() {
    [1, batch].forEach((b, li) =>
      parts[li].forEach((p, i) => {
        const r = path(i, b, lanes[li]);
        p.keys = r.keys;
        p.start = r.start;
      }),
    );
    end = milestones(batch).all;
  }
  plan();

  // labels pinned to points in the scene
  const labels = [];
  const pin = (text, x, y, z, cls = "") => {
    const el = document.createElement("span");
    el.className = `fls-pin ${cls}`;
    el.textContent = text;
    canvas.parentElement.appendChild(el);
    labels.push({ el, at: new THREE.Vector3(x, y, z) });
    return el;
  };
  STR.stations.forEach((s, k) => pin(s, stationX(k), 0, LANE + 1.8));
  const counters = lanes.map((z) => pin("", padX(N) + 1.2, 0, z, "fls-pin-count"));

  // theme: read the --fls-* properties (they point at the site's palette)
  const cRaw = new THREE.Color();
  const cAccent = new THREE.Color();
  function applyTheme() {
    bodyMat.color.copy(cssColor(host, "--fls-body", "#0f2236"));
    floorMat.color.copy(cssColor(host, "--fls-floor", "#0a1828"));
    headMat.color.copy(cssColor(host, "--fls-head", "#e9eef4"));
    edgeMat.color.copy(cssColor(host, "--fls-edge", "#6f8299"));
    railMat.color.copy(edgeMat.color);
    partEdgeMat.color.copy(cssColor(host, "--fls-part-edge", "#07121f"));
    cRaw.copy(cssColor(host, "--fls-raw", "#5b6b80"));
    cAccent.copy(cssColor(host, "--fls-accent", "#e87722"));
    const light = getComputedStyle(host).getPropertyValue("--fls-light").trim() === "1";
    hemi.color.set(light ? 0xffffff : 0xb9c6d6);
    hemi.groundColor.set(light ? 0xd0d6de : 0x0a1422);
    hemi.intensity = light ? 1.9 : 2.6;
  }
  applyTheme();
  const themeWatch = new MutationObserver(applyTheme);
  themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode", "class", "data-theme"] });
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", applyTheme);

  // framing: keep the whole floor centred and as large as the canvas allows, at any angle
  const corners = [];
  const hx = length / 2 + 1.5;
  const hz = LANE + 1.9;
  for (const x of [-hx, hx]) for (const z of [-hz, hz]) corners.push(new THREE.Vector3(x, 0, z));
  for (const x of [stationX(0), stationX(N - 1)]) for (const z of [-LANE, LANE]) corners.push(new THREE.Vector3(x, 1.75, z));
  const tmp = new THREE.Vector3();
  let w = 0;
  let h = 0;
  function fit() {
    if (!w || !h) return;
    const aspect = w / h;
    camera.updateMatrixWorld();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const c of corners) {
      tmp.copy(c).applyMatrix4(camera.matrixWorldInverse);
      x0 = Math.min(x0, tmp.x); x1 = Math.max(x1, tmp.x);
      y0 = Math.min(y0, tmp.y); y1 = Math.max(y1, tmp.y);
    }
    const half = (Math.max(y1 - y0, (x1 - x0) / aspect) / 2) * 1.03;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    camera.left = cx - half * aspect;
    camera.right = cx + half * aspect;
    camera.top = cy + half;
    camera.bottom = cy - half;
    camera.updateProjectionMatrix();
  }
  function frame() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    // long, low view on wide canvases; turned further along the line on narrow ones
    const az = w / h < 1.4 ? 0.95 : 0.6;
    const el = 0.56;
    camera.position.set(target.x + Math.sin(az) * Math.cos(el) * 40, target.y + Math.sin(el) * 40, target.z + Math.cos(az) * Math.cos(el) * 40);
    controls.minAzimuthAngle = az - 0.6;
    controls.maxAzimuthAngle = az + 0.6;
    camera.lookAt(target);
    fit();
  }
  const ro = new ResizeObserver(frame);
  ro.observe(canvas);
  frame();

  // simulation
  const startT = () => (opts.reduceMotion ? 1e6 : -0.6); // a short pause before the first part moves
  let t = startT();
  let playing = false;
  let lastKey = "";
  const ease = (u) => u * u * (3 - 2 * u);
  const col = new THREE.Color();
  function place(now) {
    const outs = [0, 0];
    for (let li = 0; li < 2; li++) {
      const press = [0, 0, 0];
      for (const p of parts[li]) {
        let k = 0;
        while (k + 1 < p.keys.length && p.keys[k + 1].t <= now) k++;
        const a = p.keys[Math.max(0, k - 1)];
        const b = p.keys[k];
        const u = k === 0 ? 1 : ease(Math.min(1, (now - b.t) / MOVE));
        p.mesh.position.lerpVectors(a.pos, b.pos, u);
        p.mesh.position.y += Math.sin(Math.PI * u) * 0.42; // small hop between places
        // value added so far: one third per finished station, plus the one in progress
        let stage = 0;
        for (let s = 0; s < N; s++) stage += Math.min(1, Math.max(0, now - p.start[s]));
        p.mat.color.copy(col.copy(cRaw).lerp(cAccent, stage / N));
        for (let s = 0; s < N; s++) {
          const q = now - p.start[s];
          if (q > MOVE && q < 1) press[s] = Math.sin((Math.PI * (q - MOVE)) / (1 - MOVE));
        }
        if (now >= p.start[N - 1] + 1) outs[li]++;
      }
      heads[li].forEach((hd, s) => (hd.position.y = TOP + 0.95 - press[s] * 0.38));
    }
    return outs;
  }
  function report(outs) {
    const minute = Math.min(end, Math.max(0, Math.floor(t)));
    const key = `${minute}|${outs[0]}|${outs[1]}`;
    if (key === lastKey) return;
    lastKey = key;
    counters[0].textContent = `${outs[0]}/${PARTS}`;
    counters[1].textContent = `${outs[1]}/${PARTS}`;
    opts.onState({ minute, flowOut: outs[0], batchOut: outs[1] });
  }

  const clock = new THREE.Clock();
  const proj = new THREE.Vector3();
  const loop = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (playing && t < end + 0.5) t += dt / MIN;
    report(place(t));
    controls.update(dt);
    fit();
    renderer.render(scene, camera);
    for (const l of labels) {
      proj.copy(l.at).project(camera);
      l.el.style.transform = `translate3d(${((proj.x + 1) / 2) * w}px, ${((1 - proj.y) / 2) * h}px, 0) translate(-50%, -50%)`;
    }
  };
  let running = false;
  const setRunning = (on) => {
    if (on === running) return;
    running = on;
    if (on) clock.getDelta();
    renderer.setAnimationLoop(on ? loop : null);
  };
  const io = new IntersectionObserver(([e]) => setRunning(e.isIntersecting && !document.hidden));
  io.observe(canvas);
  const onVis = () => setRunning(!document.hidden && canvas.getBoundingClientRect().bottom > 0);
  document.addEventListener("visibilitychange", onVis);
  setRunning(true);

  const restart = () => {
    t = startT();
    lastKey = "";
    playing = true;
  };
  return {
    restart,
    play: () => (playing = true),
    setBatch(b) {
      if (b === batch) return;
      batch = b;
      plan();
      restart();
    },
  };
}

// ----------------------------------------------------------------- interface
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
let uid = 0;

export function mountFlowLesson(root) {
  if (root.dataset.flsReady) return;
  root.dataset.flsReady = "1";
  root.classList.add("fls");
  const id = `fls-${++uid}`;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let batch = 10;
  let handle = null;
  let state = { minute: 0, flowOut: 0, batchOut: 0 };

  // banner
  const banner = el("button", "fls-banner");
  banner.type = "button";
  banner.setAttribute("aria-expanded", "false");
  banner.setAttribute("aria-controls", id);
  banner.innerHTML = `<span class="fls-mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/></svg></span>`;
  const words = el("span", "fls-words");
  words.append(el("span", "fls-title", STR.title), el("span", "fls-teaser", STR.teaser));
  const action = el("span", "fls-action", STR.open);
  const plus = el("span", "fls-plus");
  plus.setAttribute("aria-hidden", "true");
  banner.append(words, action, plus);

  // panel
  const panel = el("div", "fls-panel");
  panel.id = id;
  panel.inert = true;
  const inner = el("div", "fls-inner");
  const body = el("div", "fls-body");
  const copy = el("div", "fls-copy");
  copy.append(el("p", "fls-text", STR.text), el("p", "fls-hint", STR.hint));
  const card = el("div", "fls-card");
  const stage = el("div", "fls-stage");
  const canvas = el("canvas", "fls-canvas");
  canvas.setAttribute("role", "img");
  const legend = el("ul", "fls-legend");
  const legFlow = el("li");
  const legBatch = el("li");
  legend.append(legFlow, legBatch);
  const clockBox = el("div", "fls-clock");
  const minute = el("span", "fls-num", "00");
  clockBox.append(el("span", "fls-label", STR.minute), minute);
  stage.append(canvas, legend, clockBox);

  const table = el("table", "fls-table");
  table.innerHTML = `<thead><tr><td></td><th scope="col">${STR.first}</th><th scope="col">${STR.all(PARTS)}</th></tr></thead>`;
  const tbody = el("tbody");
  const mkRow = (cls) => {
    const tr = el("tr");
    const th = el("th");
    th.scope = "row";
    const name = el("span");
    th.append(el("i", cls), name);
    const a = el("td", "fls-num");
    const b = el("td", "fls-num");
    tr.append(th, a, b);
    tbody.append(tr);
    return { name, a, b };
  };
  const rowFlow = mkRow("fls-key-flow");
  const rowBatch = mkRow("fls-key-batch");
  table.append(tbody);

  const bar = el("div", "fls-bar");
  const sizeWrap = el("div", "fls-sizes");
  const sizeLabel = el("span", "fls-size-label", STR.batchSize);
  sizeLabel.id = `${id}-size`;
  const group = el("div", "fls-seg");
  group.setAttribute("role", "radiogroup");
  group.setAttribute("aria-labelledby", sizeLabel.id);
  const sizeBtns = SIZES.map((b) => {
    const btn = el("button", "fls-seg-btn fls-num", String(b));
    btn.type = "button";
    btn.setAttribute("role", "radio");
    btn.addEventListener("click", () => {
      batch = b;
      handle?.setBatch(b);
      state = { minute: 0, flowOut: 0, batchOut: 0 };
      render();
    });
    group.append(btn);
    return btn;
  });
  sizeWrap.append(sizeLabel, group);
  const again = el("button", "fls-again");
  again.type = "button";
  again.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg><span></span>`;
  again.lastChild.textContent = STR.again;
  again.addEventListener("click", () => handle?.restart());
  bar.append(sizeWrap, again);

  card.append(stage, table, bar);
  body.append(copy, card);
  inner.append(body);
  panel.append(inner);
  root.append(banner, panel);

  function render() {
    const f = milestones(1);
    const l = milestones(batch);
    legFlow.innerHTML = `<b>${STR.back}</b> · ${STR.flow}`;
    legBatch.innerHTML = `<b>${STR.front}</b> · ${STR.batches(batch)}`;
    rowFlow.name.textContent = STR.flow;
    rowBatch.name.textContent = STR.batches(batch);
    const cell = (td, reached, v) => {
      td.textContent = reached ? STR.min(v) : "–";
      td.classList.toggle("fls-reached", reached);
    };
    cell(rowFlow.a, state.flowOut >= 1, f.first);
    cell(rowFlow.b, state.flowOut >= PARTS, f.all);
    cell(rowBatch.a, state.batchOut >= 1, l.first);
    cell(rowBatch.b, state.batchOut >= PARTS, l.all);
    minute.textContent = String(state.minute).padStart(2, "0");
    sizeBtns.forEach((b, i) => b.setAttribute("aria-checked", String(SIZES[i] === batch)));
    canvas.setAttribute("aria-label", STR.aria(batch, f, l));
  }
  render();

  function start() {
    if (handle) return;
    try {
      handle = createScene(canvas, root, {
        batch,
        reduceMotion,
        onState: (s) => {
          state = s;
          render();
        },
      });
    } catch (e) {
      stage.append(el("p", "fls-error", STR.noWebgl));
      return;
    }
    // run once the model is mostly on screen
    const seen = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        seen.disconnect();
        handle.play();
      },
      { threshold: 0.55 },
    );
    seen.observe(stage);
  }

  function setOpen(open) {
    root.classList.toggle("fls-open", open);
    banner.setAttribute("aria-expanded", String(open));
    action.textContent = open ? STR.close : STR.open;
    panel.inert = !open;
    if (open) {
      start();
      setTimeout(() => panel.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" }), 420);
    }
  }
  banner.addEventListener("click", () => setOpen(!root.classList.contains("fls-open")));
  if (root.hasAttribute("data-open")) setOpen(true);
}

document.querySelectorAll("[data-flow-lesson]").forEach(mountFlowLesson);
