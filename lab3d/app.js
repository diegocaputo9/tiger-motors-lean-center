/* Tiger Motors lab in 3D.
   The building and equipment come from lab.glb (built in Blender by "6 Lab 3D model/build_lab.py").
   Positions come from layout.json, the same file the Blender script reads, so the model and the logic stay in step.
   This file adds what moves and what you can do: the cars, the pull system, the two scenarios, the cameras.
   Lab coordinates are metres with X east, Y north, Z up; three.js is Y up, so lab (x, y, z) becomes (x, z, -y). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const $ = s => document.querySelector(s);
const V = (x, y, z = 0) => new THREE.Vector3(x, z, -y);
const OPA = { '-y': 0, '+x': Math.PI / 2, '+y': Math.PI, '-x': -Math.PI / 2 };
const local = (pos, op, lx, ly, z = 0) => { const a = OPA[op], c = Math.cos(a), s = Math.sin(a); return V(pos[0] + lx * c - ly * s, pos[1] + lx * s + ly * c, z); };
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ renderer and scene */
const canvas = $('#view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x07121F);
const camera = new THREE.PerspectiveCamera(50, 1, 0.08, 200);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture; scene.environmentIntensity = 0.32;
scene.add(new THREE.HemisphereLight(0xF2F6FF, 0x6F757C, 0.42));
const sun = new THREE.DirectionalLight(0xFFFFFF, 2.5);               // stands in for the rows of ceiling lights
sun.position.set(11.7, 24, 5); sun.target.position.set(11.7, 0, -1.15); sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 9, bottom: -9, near: 1, far: 60 });
sun.shadow.camera.updateProjectionMatrix(); sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
scene.add(sun, sun.target);

function resize() { const w = innerWidth, h = innerHeight, side = w > 900 && !document.body.classList.contains('nopanel') ? 396 : 0;      // keep the lab centred in the space left of the side panel
  renderer.setSize(w, h, false); camera.aspect = (w + side) / h; if (side) camera.setViewOffset(w + side, h, side, 0, w, h); else camera.clearViewOffset(); camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

/* ------------------------------------------------------------------ painted surfaces (numbers, posters, labels, screens) */
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData = { c, g, w, h };
  return t;
}
const FONT_D = "'Archivo','Arial Narrow',sans-serif", FONT_B = "'IBM Plex Sans',system-ui,sans-serif", FONT_M = "'IBM Plex Mono',monospace";
function paintNumber(mesh, n) {
  mesh.material = new THREE.MeshStandardMaterial({ roughness: .6, map: canvasTex(200, 270, (g, w, h) => {
    g.fillStyle = '#FBFBF8'; g.fillRect(0, 0, w, h); g.fillStyle = '#0C2340'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `800 ${n > 9 ? 170 : 210}px ${FONT_D}`; g.fillText(String(n), w / 2, h / 2 + 10);
  }) });
}
function paintPoster(mesh, seed) {
  mesh.material = new THREE.MeshStandardMaterial({ roughness: .7, map: canvasTex(360, 252, (g, w, h) => {
    let r = seed * 9301 + 49297; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    g.fillStyle = '#FCFCFA'; g.fillRect(0, 0, w, h); g.fillStyle = '#26313F'; g.font = `600 13px ${FONT_B}`; g.fillText('Standard Work Sheet', 12, 20);
    g.fillStyle = '#9AA6B4'; g.fillRect(12, 27, w - 24, 1.5);
    const cols = ['#D9D3EE', '#C9CCD6', '#D42A2A', '#2E6FC2', '#E8E0C8'];
    for (let i = 0; i < 6; i++) {                                        // little exploded-view steps joined by blue arrows
      const x = 18 + (i % 3) * 114, y = 44 + Math.floor(i / 3) * 96;
      g.fillStyle = cols[Math.floor(rnd() * cols.length)]; g.fillRect(x + 8, y + 14, 60, 24);
      g.fillStyle = cols[Math.floor(rnd() * cols.length)]; g.fillRect(x + 20, y + 4, 34, 14);
      g.fillStyle = '#1F2226'; g.beginPath(); g.arc(x + 20, y + 42, 7, 0, 7); g.arc(x + 56, y + 42, 7, 0, 7); g.fill();
      g.fillStyle = '#2E86D6'; if (i % 3 < 2) { g.fillRect(x + 78, y + 24, 22, 6); g.beginPath(); g.moveTo(x + 100, y + 18); g.lineTo(x + 110, y + 27); g.lineTo(x + 100, y + 36); g.fill(); }
      g.fillStyle = '#5B6675'; g.font = `500 9px ${FONT_M}`; g.fillText('STEP ' + (i + 1), x + 8, y + 64);
    }
  }) });
}
function paintLabel(mesh, text, o = {}) {
  const w = o.w || 720, h = o.h || 128;
  mesh.material = new THREE.MeshStandardMaterial({ roughness: .6, map: canvasTex(w, h, g => {
    g.fillStyle = o.bg || '#F4D21F'; g.fillRect(0, 0, w, h); g.fillStyle = o.fg || '#141414'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 ${o.size || 78}px ${FONT_D}`; g.fillText(text, w / 2, h / 2 + 4);
  }) });
}
function paintBoard(mesh, title, cols) {                                // the sustainment board: one column per area
  mesh.material = new THREE.MeshStandardMaterial({ roughness: .35, map: canvasTex(900, 600, (g, w, h) => {
    g.fillStyle = '#F6F7F5'; g.fillRect(0, 0, w, h); g.fillStyle = '#0C2340'; g.textAlign = 'center'; g.font = `800 34px ${FONT_D}`; g.fillText(title, w / 2, 54);
    g.strokeStyle = '#1A2530'; g.lineWidth = 2; g.strokeRect(30, 80, w - 60, h - 110); const cw = (w - 60) / cols.length;
    cols.forEach((c, i) => { const x = 30 + i * cw; g.beginPath(); g.moveTo(x, 80); g.lineTo(x, h - 30); g.stroke(); g.font = `700 20px ${FONT_B}`; g.fillStyle = '#0C2340'; g.fillText(c, x + cw / 2, 112);
      g.fillStyle = i === 2 ? '#C9302C' : '#2E8B57'; g.fillRect(x + cw / 2 - 26, 150, 52, 76); g.fillStyle = '#5B6675'; g.font = `500 15px ${FONT_B}`; g.fillText('NOTES', x + cw / 2, 270); });
    g.beginPath(); g.moveTo(30, 126); g.lineTo(w - 30, 126); g.moveTo(30, 284); g.lineTo(w - 30, 284); g.stroke();
  }) });
}
const CI_IDEAS = [['Parts bin 4 is a long reach', 'Move it to the front row', 'TA', 'g'], ['Red and green trays get mixed up', 'Label each tray position', 'Op 2', 'g'], ['Scanner cable catches the fixture', 'Clip the cable to the upright', 'Op 4', 'y'],
  ['Waiting on the kanban card', 'Card holder at eye level', 'TA', 'y'], ['Standard work sheet is hard to read', 'Reprint with larger steps', 'Lead', 'r']];
function paintCI(mesh, cell) {                                           // a table: title, subtitle, 9 rows for improvement ideas
  mesh.material = new THREE.MeshStandardMaterial({ roughness: .35, map: canvasTex(1200, 800, (g, w, h) => {
    g.fillStyle = '#F7F8F6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#0C2340'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = `800 58px ${FONT_D}`; g.fillText('Cell ' + cell, w / 2, 70);
    g.font = `600 28px ${FONT_B}`; g.fillText('Continuous Improvement Board', w / 2, 112);
    g.fillStyle = '#E87722'; g.font = `600 19px ${FONT_B}`; g.fillText('TIGER MOTORS LEAN EDUCATION CENTER · AUBURN UNIVERSITY', w / 2, 144);
    const x0 = 36, x1 = w - 36, y0 = 168, hh = 46, rh = (h - 30 - y0 - hh) / 9, cols = [['#', 56], ['Improvement idea', 400], ['Corrective action', 372], ['Owner', 130], ['Date', 100], ['Status', 70]];
    g.fillStyle = '#0C2340'; g.fillRect(x0, y0, x1 - x0, hh); g.fillStyle = '#FFFFFF'; g.font = `600 21px ${FONT_B}`; g.textAlign = 'left';
    let x = x0; const xs = []; cols.forEach(c => { xs.push(x); g.fillText(c[0], x + 10, y0 + 31); x += c[1]; });
    g.strokeStyle = '#1A2530'; g.lineWidth = 2; g.strokeRect(x0, y0, x1 - x0, hh + rh * 9);
    g.lineWidth = 1.2; xs.slice(1).forEach(v => { g.beginPath(); g.moveTo(v, y0); g.lineTo(v, y0 + hh + rh * 9); g.stroke(); });
    for (let r = 0; r < 9; r++) { const y = y0 + hh + r * rh; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
      g.fillStyle = '#5B6675'; g.font = `500 21px ${FONT_M}`; g.fillText(String(r + 1), xs[0] + 16, y + rh / 2 + 8);
      const it = CI_IDEAS[(r + cell) % 9]; if (!it || r > 5) continue;                                 // a few rows filled in marker, the rest left open
      g.fillStyle = '#1F3FA6'; g.font = `500 21px ${FONT_B}`; g.fillText(it[0], xs[1] + 10, y + rh / 2 + 8); g.fillText(it[1], xs[2] + 10, y + rh / 2 + 8); g.fillText(it[2], xs[3] + 10, y + rh / 2 + 8);
      g.fillText('11/' + (3 + r * 2), xs[4] + 10, y + rh / 2 + 8);
      g.fillStyle = it[3] === 'g' ? '#2E8B57' : it[3] === 'y' ? '#E3B117' : '#C9302C'; g.fillRect(xs[5] + 16, y + 10, 38, rh - 20); }
  }) });
}
const screens = {};                                                    // name -> {tex, draw}
function makeScreen(mesh, name, w, h) {
  const tex = canvasTex(w, h, g => { g.fillStyle = '#06101C'; g.fillRect(0, 0, w, h); });
  mesh.material = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }); screens[name] = tex;
}
function drawScreen(name, rows, o = {}) {
  const t = screens[name]; if (!t) return; const { g, w, h } = t.userData, s = w / 640;
  g.fillStyle = o.alarm ? '#2A0B0C' : '#06101C'; g.fillRect(0, 0, w, h);
  g.fillStyle = o.alarm ? '#F0544F' : '#FF9B4D'; g.fillRect(0, 0, w, 8 * s);
  g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = '#E9EEF4'; g.font = `700 ${34 * s}px ${FONT_D}`; g.fillText(o.title || '', 24 * s, 58 * s);
  g.textAlign = 'right'; g.font = `500 ${20 * s}px ${FONT_M}`; g.fillStyle = o.alarm ? '#FFB3AF' : '#3FB68B'; g.fillText(o.status || '', w - 24 * s, 54 * s);
  rows.forEach((r, i) => { const y = (118 + i * 62) * s; g.textAlign = 'left'; g.fillStyle = '#93A3B5'; g.font = `500 ${21 * s}px ${FONT_B}`; g.fillText(r[0], 24 * s, y);
    g.textAlign = 'right'; g.fillStyle = r[2] || '#E9EEF4'; g.font = `500 ${34 * s}px ${FONT_M}`; g.fillText(String(r[1]), w - 24 * s, y + 4 * s);
    g.fillStyle = 'rgba(160,185,212,.16)'; g.fillRect(24 * s, y + 18 * s, w - 48 * s, 1.5 * s); });
  t.needsUpdate = true;
}

/* ------------------------------------------------------------------ LEGO cars (same brick lists as the home page hero) */
const C = { RED: '#D1262C', WHT: '#F2F3F1', BLK: '#2B2E33', GRY: '#8C949E', GLS: '#9CC4DC', AMB: '#FFB060', BLU: '#2E6FC2' };
const SPEEDSTER = { r: .12, wu: .33, parts: [[0, -.52, .52, -.22, .22, .08, .14, 'BLK'], [1, -.55, .55, -.26, .26, .14, .30, 'RED'],
  [2, .14, .56, -.25, .25, .30, .36, 'RED'], [2, .14, .56, .06, .12, .36, .38, 'WHT'], [2, .14, .56, -.12, -.06, .36, .38, 'WHT'], [2, -.56, -.18, -.25, .25, .30, .38, 'RED'],
  [3, -.18, .14, -.22, .22, .30, .46, 'GLS'], [4, -.16, .08, -.21, .21, .46, .50, 'BLK'],
  [5, .55, .59, .13, .22, .22, .29, 'WHT'], [5, .55, .59, -.22, -.13, .22, .29, 'WHT'], [5, -.59, -.55, .14, .22, .23, .28, 'AMB'], [5, -.59, -.55, -.22, -.14, .23, .28, 'AMB'],
  [6, -.52, -.47, .12, .17, .38, .47, 'BLK'], [6, -.52, -.47, -.17, -.12, .38, .47, 'BLK'], [6, -.6, -.43, -.27, .27, .47, .5, 'RED']] };
const SUV = { r: .15, wu: .3, parts: [[0, -.48, .48, -.22, .22, .10, .18, 'BLK'], [1, -.5, .5, -.26, .26, .18, .22, 'BLK'], [1, -.5, .5, -.26, .26, .22, .32, 'RED'],
  [2, -.5, -.02, -.26, .26, .32, .39, 'WHT'], [2, .18, .5, -.26, .26, .32, .42, 'RED'], [2, .5, .54, -.21, .21, .2, .38, 'GRY'],
  [3, -.5, -.02, -.26, .26, .39, .6, 'RED'], [3, -.02, .18, -.24, .24, .32, .6, 'GLS'], [4, -.52, .2, -.26, .26, .6, .64, 'RED'],
  [5, .25, .38, -.08, .08, .42, .45, 'GRY'], [5, .5, .55, .21, .25, .28, .36, 'WHT'], [5, .5, .55, -.25, -.21, .28, .36, 'WHT'],
  [6, -.56, -.46, -.27, .27, .64, .68, 'BLK'], [6, -.3, -.06, -.12, .12, .64, .66, 'WHT']] };
const CAR_S = 0.17;                                                     // a touch larger than life so the cars read from across the room
const carMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .32, metalness: 0 });
const geoCache = {};
function carGeo(kind, stage) {
  const key = kind + stage; if (geoCache[key]) return geoCache[key];
  const M = kind === 'blue' ? SPEEDSTER : SUV, geos = [], col = new THREE.Color();
  const add = (g, hex) => { g = g.toNonIndexed(); col.set(hex); const n = g.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); geos.push(g); };
  M.parts.forEach(p => { if (p[0] > stage) return; let c = p[7];
    if (c === 'RED' && kind === 'white') c = 'WHT'; if (c === 'RED' && kind === 'orange' && p[0] === 3) c = 'RED';
    if (c === 'WHT' && kind === 'white') c = 'BLU';
    const g = new THREE.BoxGeometry(p[2] - p[1], p[6] - p[5], p[4] - p[3]); g.translate((p[1] + p[2]) / 2, (p[5] + p[6]) / 2, -(p[3] + p[4]) / 2); add(g, C[c]);
    if (stage >= 5 && p[6] - p[5] > .05 && c !== 'GLS') {                // studs on the bigger bricks
      const nu = Math.floor((p[2] - p[1]) / .13), nv = Math.floor((p[4] - p[3]) / .13);
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const s = new THREE.CylinderGeometry(.04, .04, .03, 8);
        s.translate((p[1] + p[2]) / 2 - (nu - 1) * .065 + i * .13, p[6] + .015, -((p[3] + p[4]) / 2 - (nv - 1) * .065 + j * .13)); add(s, C[c]); } } });
  [M.wu, -M.wu].forEach(u => [-.27, .27].forEach(v => { const w = new THREE.CylinderGeometry(M.r, M.r, .09, 14); w.rotateX(Math.PI / 2); w.translate(u, M.r, v); add(w, '#17181B');
    const hub = new THREE.CylinderGeometry(M.r * .5, M.r * .5, .1, 10); hub.rotateX(Math.PI / 2); hub.translate(u, M.r, v); add(hub, '#B7BDC5'); }));
  const g = mergeGeometries(geos); g.scale(CAR_S, CAR_S, CAR_S); return geoCache[key] = g;
}
const STAGE = [0, 0, 1, 1, 2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 6, 6];          // how far a car is built when it is AT station n
const KIND_NAME = { blue: 'Speedster (blue card)', orange: 'Trail SUV (orange card)', white: 'Special order (white card)' };

/* ------------------------------------------------------------------ load */
const L = await (await fetch('lab3d/layout.json', { cache: 'no-cache' })).json();
const gltf = await new Promise((res, rej) => new GLTFLoader().load('lab3d/lab.glb?v=' + L.version, res, e => { if (e.total) $('#loadBar').style.setProperty('--p', Math.round(e.loaded / e.total * 100) + '%'); }, rej));
const lab = gltf.scene; scene.add(lab);
const N = {};                                                            // every named object in the model, by the name it has in Blender
const own = o => (o.userData && o.userData.name) || '';
const nameOf = o => { while (o) { if (own(o)) return own(o); o = o.parent; } return ''; };
lab.traverse(o => { if (own(o)) N[own(o)] = o; });
const lamps = {};                                                        // andon_st01 -> {r,y,g}
lab.traverse(o => {
  if (!o.isMesh) return;
  const m = o.material, n = nameOf(o);
  if (m.transparent || m.opacity < 1 || /cage|glass/.test(m.name)) { m.transparent = true; m.depthWrite = false; o.castShadow = false; o.renderOrder = 2; }
  else { o.castShadow = !/^(floor|ceiling|walls_outer|floor_tape)/.test(n); o.receiveShadow = true; }
  if (/^(andon_|light_)/.test(n)) { o.material = m.clone(); o.castShadow = false; }
});
Object.keys(N).forEach(n => {
  let m = n.match(/^andon_(st\d\d)_([ryg])$/); if (m) { (lamps[m[1]] = lamps[m[1]] || {})[m[2]] = N[n]; return; }
  m = n.match(/^num_st(\d\d)$/); if (m) return paintNumber(N[n], +m[1]);
  m = n.match(/^poster_st(\d\d)_([ab])$/); if (m) return paintPoster(N[n], +m[1] * 2 + (m[2] === 'b' ? 1 : 0));
  m = n.match(/^num_cnc(\d)$/); if (m) return paintLabel(N[n], 'CNC ' + m[1], { w: 420, h: 160, bg: '#0C2340', fg: '#FFFFFF', size: 96 });
  if (n === 'label_sm1') return paintLabel(N[n], 'Supermarket 1');
  if (n === 'label_sm2') return paintLabel(N[n], 'Supermarket 2');
  if (n === 'label_fg') return paintLabel(N[n], 'Finished goods', { bg: '#1E9B55', fg: '#FFFFFF' });
  if (n === 'label_heijunka') return paintLabel(N[n], 'HEIJUNKA BOX', { w: 600, h: 90, bg: '#0C2340', fg: '#FFFFFF', size: 54 });
  if (n === 'label_plc') return paintLabel(N[n], 'PLC · LINE CONTROL', { w: 800, h: 120, bg: '#0C2340', fg: '#FFFFFF', size: 64 });
  if (n === 'label_toolarea') return paintLabel(N[n], 'TOOL AREA', { w: 900, h: 120, size: 84 });
  if (n === 'label_wareagle') return paintLabel(N[n], 'WAR EAGLE INC. · Tier 1 JIT supplier', { w: 1560, h: 204, bg: '#0C2340', fg: '#FF9B4D', size: 84 });
  if (n === 'board_sustain') return paintBoard(N[n], 'TIGER MOTORS SUSTAINMENT BOARD', ['CELL 1', 'CELL 2', 'CELL 3', 'SUPERMARKET', 'CONFERENCE RM']);
  m = n.match(/^board_ci_cell(\d)$/); if (m) return paintCI(N[n], +m[1]);
  if (/^screen_/.test(n)) return makeScreen(N[n], n, /cell/.test(n) ? 640 : 480, /cell/.test(n) ? 362 : 300);
});
if (N.floor) N.floor.traverse(o => { if (o.isMesh) { o.material.roughness = 0.2; o.material.envMapIntensity = 1.2; } });

/* the glossy epoxy floor: a faint mirror laid just above the floor, cut to the building's footprint */
let mirror = null;
try {
  const R = L.rooms, s = new THREE.Shape();
  [[R.plc.x[0], R.plc.y[0]], [R.hall.x[0], R.plc.y[0]], [R.hall.x[0], 0], [R.bay.x[0], 0], [R.bay.x[0], R.bay.y[0]], [R.wareagle.x[1], R.bay.y[0]], [R.hall.x[1], R.hall.y[1]], [R.plc.x[0], R.hall.y[1]]]
    .forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]));
  mirror = new Reflector(new THREE.ShapeGeometry(s), { textureWidth: 1024, textureHeight: 1024, color: 0xffffff, clipBias: 0.002 });
  const fs = mirror.material.fragmentShader, i = fs.lastIndexOf('gl_FragColor');
  if (i < 0) throw 0;
  mirror.material.fragmentShader = fs.slice(0, i) + 'gl_FragColor = vec4( base.rgb, 0.16 );' + fs.slice(fs.indexOf(';', i) + 1);
  mirror.material.transparent = true; mirror.material.depthWrite = false;
  mirror.rotation.x = -Math.PI / 2; mirror.position.y = 0.006; mirror.renderOrder = 1; scene.add(mirror);
} catch (e) { mirror = null; }

/* ------------------------------------------------------------------ the production system */
const ST = {};                                                           // stations 1..15
for (const [k, d] of Object.entries(L.stations)) {
  const n = +k, line = d.cell === 3;
  ST[n] = { n, d, key: 'st' + String(n).padStart(2, '0'), cell: d.cell, car: null, t: 0, state: 'idle',
    spot: line ? V(d.pos[0], L.conveyor.y, L.conveyor.belt_z) : local(d.pos, d.op, 0, -0.1, 0.94),
    yaw: line ? Math.PI : OPA[d.op] + (d.cell === 2 ? Math.PI : 0) };
}
const SM_MAX = 6, RS_MAX = 12, CT = 4.2, TAKT = 5.2, MOVE = 0.9;
const sm = {};
for (const [k, d] of Object.entries(L.supermarkets)) sm[k] = { k, d, cars: [], slot: i => local(d.pos, d.op, -0.15 + Math.floor(i / 2) * 0.15, -0.15 + (i % 2) * 0.30, 0.958), yaw: OPA[d.op] + Math.PI / 2 };   // 2 across, 3 rows, on the short table
const S = {                                                              // everything that changes
  t: 0, cars: [], fg: 0, fgCars: [], scrap: 0, rs: 9, mission: null, lastLaunch: -9, seq: 0, parts: [], jit: {}, log: [],
  mode: 'explore',
  weDelay: false, asrsDown: false, reseq: false, expedite: false, manual: false, manualT: 0, disruptAt: null,
  attack: null, found: false, attackAt: null, wrong: 0, response: 0, lineSpeed: 1, lineStop: false, manualCards: false,
};
const HEIJUNKA = ['blue', 'blue', 'orange', 'white', 'blue', 'blue', 'orange'];
const cells = { 1: [1, 2, 3, 4, 5], 2: [6, 7, 8, 9, 10], 3: [11, 12, 13, 14, 15] };
const wip = c => cells[c].filter(n => ST[n].car).length + S.cars.filter(k => k.to && cells[c].includes(k.to.n) && !ST[k.to.n].car).length;

function newCar(kind, stage) { const m = new THREE.Mesh(carGeo(kind, stage), carMat); m.castShadow = true; scene.add(m);
  const c = { mesh: m, kind, stage, move: null, to: null, defect: false, mark: null }; S.cars.push(c); return c; }
function setStage(c, stage, kind) { if (kind) c.kind = kind; c.stage = stage; c.mesh.geometry = carGeo(c.kind, stage); }
function place(c, p, yaw) { c.mesh.position.copy(p); c.mesh.rotation.y = yaw; }
function send(c, p, yaw, dur, arc, done) { c.move = { a: c.mesh.position.clone(), b: p.clone(), ya: c.mesh.rotation.y, yb: yaw, t: 0, dur, arc, done }; }
function removeCar(c) { scene.remove(c.mesh); if (c.mark) scene.remove(c.mark); S.cars.splice(S.cars.indexOf(c), 1); }
function say(text, cls) { S.log.unshift({ t: S.t, text, cls }); if (S.log.length > 40) S.log.pop(); paintLog(); }

/* what the screens and the kanban system BELIEVE. In scenario B an attacker makes one of these lie. */
const believed = {
  sm2: () => (S.attack === 'kanban' && !S.manualCards ? SM_MAX : sm[2].cars.length),
  sm1: () => sm[1].cars.length,
  speed: () => 100,
  andon: n => (S.attack === 'plc' && S.response < 3 ? 'g' : lampOf(n)),
  defects: () => (S.attack === 'plc' && S.response < 3 ? 0 : S.scrap),
};
const realSpeed = () => Math.round(S.lineSpeed * 100);

function lampOf(n) { const s = ST[n].state; return s === 'stopped' ? 'r' : (s === 'starved' || s === 'blocked') ? 'y' : 'g'; }
function setLamp(o, on, color) { if (!o) return; o.material.emissiveIntensity = on ? 4 : 0; o.material.color.set(on ? color : 0x2a2d31); }
const LAMP = { r: 0xFF3A2E, y: 0xFFC21F, g: 0x22E06A };

function tick(dt) {
  S.t += dt;
  // moving cars
  for (const c of S.cars) { const m = c.move; if (!m) continue; m.t += dt; const k = Math.min(1, m.t / m.dur), e = ease(k);
    c.mesh.position.lerpVectors(m.a, m.b, e); if (m.arc) c.mesh.position.y += Math.sin(k * Math.PI) * m.arc;
    c.mesh.rotation.y = m.ya + (m.yb - m.ya) * e; if (k >= 1) { c.move = null; m.done && m.done(); } }
  // raw material: the AS/RS crane brings totes to raw stock when the stock runs low (a kanban to the AS/RS)
  if (!S.mission && S.rs <= RS_MAX - 6 && !S.asrsDown) S.mission = { t: 0, bay: Math.random(), lvl: .25 + Math.random() * .7 };
  if (S.mission) { const m = S.mission; if (S.asrsDown) m.stalled = true; else { m.stalled = false; m.t += dt; if (m.t > 6) { S.rs = Math.min(RS_MAX, S.rs + 6); S.mission = null; } } }
  if (S.asrsDown && S.manual) { S.manualT += dt; if (S.manualT > 5.5) { S.manualT = 0; S.rs = Math.min(RS_MAX, S.rs + 2); } }   // by hand: slower, but the line keeps running
  // cell 1 starts a car when it has material and a kanban (room in supermarket 1)
  const s1 = ST[1];
  if (!s1.car && !incoming(1)) {
    if (sm[1].cars.length + wip(1) >= SM_MAX) s1.state = 'blocked';
    else if (S.rs <= 0) s1.state = 'starved';
    else { S.rs--; const c = newCar('blue', 0); place(c, s1.spot.clone().add(new THREE.Vector3(0, .25, 0)), s1.yaw); arrive(c, s1); send(c, s1.spot, s1.yaw, .5, 0, null); }
  }
  // cell 2 pulls from supermarket 1 when the kanban system says supermarket 2 has room
  const s6 = ST[6];
  if (!s6.car && !incoming(6)) {
    if (believed.sm2() + wip(2) >= SM_MAX) s6.state = 'blocked';
    else if (!sm[1].cars.length || sm[1].cars[0].move) s6.state = 'starved';
    else { const c = sm[1].cars.shift(); restack(sm[1]); c.to = s6; send(c, s6.spot, s6.yaw, MOVE, .22, () => arrive(c, s6)); }
  }
  // cell 3 (pacemaker) launches one car per takt from supermarket 2, in the Heijunka order
  const s11 = ST[11];
  if (!s11.car && !incoming(11) && !S.lineStop) {
    if (!sm[2].cars.length || sm[2].cars[0].move) { if (S.t - S.lastLaunch > TAKT) s11.state = 'starved'; }
    else if (S.t - S.lastLaunch >= TAKT / S.lineSpeed) {
      let kind = HEIJUNKA[S.seq % HEIJUNKA.length];
      if (kind === 'white' && S.reseq && S.weDelay) { kind = 'blue'; }                       // countermeasure: build standard models while the special part is late
      S.seq++; S.lastLaunch = S.t; const c = sm[2].cars.shift(); restack(sm[2]); c.to = s11; c.kind = kind;
      send(c, s11.spot, s11.yaw, MOVE, .2, () => arrive(c, s11));
    }
  }
  // work at every station, then hand the car on
  for (let n = 1; n <= 15; n++) { const s = ST[n], c = s.car; if (!c) continue;
    if (s.state === 'busy') { s.t += dt * (s.cell === 3 ? S.lineSpeed : 1) * (S.lineStop && s.cell === 3 ? 0 : 1); if (s.t >= CT) { s.state = 'done'; onWorkDone(s, c); } }
    if (s.state !== 'busy') handOn(s, c);
  }
  // special part from War Eagle: ordered when a white car reaches station 12, due when it reaches station 15
  for (const p of S.parts) { p.t += dt; const k = Math.min(1, p.t / p.dur); pathAt(p.path, ease(k), p.mesh.position); if (k >= 1 && !p.done) { p.done = true; S.jit[p.id] = true; scene.remove(p.mesh); } }
  S.parts = S.parts.filter(p => !p.done);
}
const incoming = n => S.cars.some(c => c.to === ST[n] && c.move);
function arrive(c, s) { s.car = c; c.to = null; s.t = 0; s.state = 'busy'; setStage(c, Math.max(c.stage, STAGE[s.n]), c.kind);
  if (s.n === 12 && c.kind === 'white') orderPart(c); }
function onWorkDone(s, c) { if (s.n === 13 && S.lineSpeed > 1.05 && Math.random() < .5) { c.defect = true;      // rushed work: the operator cannot keep up with the belt
    c.mark = new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 8), new THREE.MeshBasicMaterial({ color: 0xFF3A2E })); scene.add(c.mark); } }
function handOn(s, c) {
  if (c.move) return;
  if (s.n === 15) {
    if (c.kind === 'white' && !S.jit[c.id]) { if (s.state !== 'stopped') { s.state = 'stopped'; if (S.mode === 'A') say('Station 15 stopped: the special part from War Eagle Inc. has not arrived. Andon is red.', 'bad'); } return; }
    s.car = null; s.state = 'idle';
    if (c.defect) { S.scrap++; send(c, V(1.2, 1.2, .3), 0, .8, .3, () => removeCar(c)); return; }
    S.fg++; const slot = local(L.finished_goods.pos, '-y', -0.25 + (S.fgCars.length % 3) * .25, -.12 + Math.floor(S.fgCars.length / 3) * .25, .97);
    send(c, slot, Math.PI, 1, .25, () => { S.fgCars.push(c); if (S.fgCars.length > 6) { const old = S.fgCars.shift(); removeCar(old); S.fgCars.forEach((k, i) => k.mesh.position.copy(local(L.finished_goods.pos, '-y', -0.25 + (i % 3) * .25, -.12 + Math.floor(i / 3) * .25, .97))); } });
    return;
  }
  const out = s.n === 5 ? sm[1] : s.n === 10 ? sm[2] : null;
  if (out) { if (out.cars.length >= SM_MAX) { s.state = 'blocked'; return; }
    s.car = null; s.state = 'idle'; out.cars.push(c); send(c, out.slot(out.cars.length - 1), out.yaw, MOVE, .22, null); return; }
  const nx = ST[s.n + 1];
  if (nx.car || incoming(nx.n) || (S.lineStop && s.cell === 3)) { s.state = 'blocked'; return; }
  s.car = null; s.state = 'idle'; c.to = nx; send(c, nx.spot, nx.yaw, s.cell === 3 ? MOVE / S.lineSpeed : MOVE, s.cell === 3 ? 0 : .2, () => arrive(c, nx));
}
function restack(m) { m.cars.forEach((c, i) => { if (!c.move) c.mesh.position.copy(m.slot(i)); else c.move.b.copy(m.slot(i)); }); }
let carId = 0;
function orderPart(c) {
  c.id = ++carId; const late = S.weDelay && !S.expedite;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(.16, .1, .12), new THREE.MeshStandardMaterial({ color: 0xFF9B4D, roughness: .4, emissive: 0xE87722, emissiveIntensity: .5 })); mesh.castShadow = true; scene.add(mesh);
  const door = (L.wareagle.door[0] + L.wareagle.door[1]) / 2, s15 = L.stations['15'].pos;
  S.parts.push({ id: c.id, mesh, t: 0, dur: 3 * (CT + MOVE) * (late ? 4.5 : .92), path: [V(22.5, -2.6, 1), V(door, -0.6, 1), V(door, 0.9, 1), V(s15[0] + .5, 0.9, 1), V(s15[0] + .3, L.conveyor.y - .25, 1.0)] });
  if (late && S.mode === 'A') say('War Eagle Inc. is running late on the special part for the white order.', 'warn');
}
function pathAt(pts, k, out) { const segs = []; let tot = 0; for (let i = 0; i < pts.length - 1; i++) { const l = pts[i].distanceTo(pts[i + 1]); segs.push(l); tot += l; }
  let d = k * tot; for (let i = 0; i < segs.length; i++) { if (d <= segs[i] || i === segs.length - 1) return out.lerpVectors(pts[i], pts[i + 1], Math.min(1, d / segs[i])); d -= segs[i]; } }
function resetSim() {
  S.cars.slice().forEach(removeCar); S.parts.forEach(p => scene.remove(p.mesh));
  Object.assign(S, { t: 0, fg: 0, fgCars: [], scrap: 0, rs: 9, mission: null, lastLaunch: -9, seq: 0, parts: [], jit: {}, log: [],
    weDelay: false, asrsDown: false, reseq: false, expedite: false, manual: false, manualT: 0, disruptAt: null,
    attack: null, found: false, attackAt: null, wrong: 0, response: 0, lineSpeed: 1, lineStop: false, manualCards: false });
  for (const n in ST) Object.assign(ST[n], { car: null, t: 0, state: 'idle' }); for (const k in sm) sm[k].cars = [];
  // start with a healthy line: supermarkets part full, some work in progress
  for (const k of [1, 2]) for (let i = 0; i < 4; i++) { const c = newCar('blue', k === 1 ? 2 : 4); place(c, sm[k].slot(i), sm[k].yaw); sm[k].cars.push(c); }
  [2, 4, 7, 9, 12, 14].forEach(n => { const c = newCar(n > 10 ? HEIJUNKA[S.seq++ % 7] : 'blue', STAGE[n]); place(c, ST[n].spot, ST[n].yaw); arrive(c, ST[n]); ST[n].t = Math.random() * CT;
    if (c.kind === 'white') { c.id = ++carId; S.jit[c.id] = true; } });
  paintLog();
}

/* ------------------------------------------------------------------ what you see changing: lamps, crane, screens, tags */
const crane = N.asrs_crane, carriage = N.asrs_carriage, craneHome = crane ? crane.position.clone() : null;
function visuals(dt) {
  for (let n = 1; n <= 15; n++) { const l = lamps[ST[n].key]; if (!l) continue; const on = lampOf(n), blink = on !== 'g' && Math.floor(S.t * 2.5) % 2 === 0;
    for (const k of 'ryg') setLamp(l[k], k === on && !(on === 'r' && blink), LAMP[k]); }
  for (const c of S.cars) if (c.mark) c.mark.position.copy(c.mesh.position).add(new THREE.Vector3(0, .2, 0));
  if (crane) { const m = S.mission, y = L.asrs.rack_a.y; let ty = craneHome.z, tz = 1.0;
    if (m) { const k = m.t / 6, away = k < .5 ? ease(k * 2) : ease((1 - k) * 2); ty = craneHome.z - away * (m.bay * (y[1] - y[0] - 1.6)); tz = 1.0 + away * m.lvl * (L.asrs.height - 1.6); }
    crane.position.z += (ty - crane.position.z) * Math.min(1, dt * 4); if (carriage) carriage.position.y += (tz - carriage.position.y) * Math.min(1, dt * 4); }
  for (let k = 1; k <= 5; k++) { const o = N['light_cnc' + k]; if (o) setLamp(o, true, S.weDelay && !S.expedite ? LAMP.y : LAMP.g); }
  if (N.light_plc) setLamp(N.light_plc, true, S.attack === 'plc' && S.found && S.response < 3 ? LAMP.r : LAMP.g);
}
let screenT = 0;
function paintScreens() {
  const g = '#3FB68B', r = '#F0544F', a = '#F2B233';
  const cellRow = c => { const st = cells[c].map(n => believed.andon(n)); return st.includes('r') ? ['STOPPED', r] : st.includes('y') ? ['WAITING', a] : ['RUNNING', g]; };
  const target = Math.floor(S.t / TAKT);
  [1, 2, 3].forEach(c => { const cr = cellRow(c), sup = c === 1 ? ['Supermarket 1', believed.sm1() + ' / ' + SM_MAX] : c === 2 ? ['Supermarket 2', believed.sm2() + ' / ' + SM_MAX] : ['Finished goods', S.fg];
    drawScreen('screen_cell' + c, [['Line status', cr[0], cr[1]], sup, c === 3 ? ['Defects', believed.defects()] : ['Work in progress', wip(c)], c === 3 ? ['Belt speed', believed.speed() + ' %'] : ['Takt', TAKT.toFixed(1) + ' s']],
      { title: 'CELL ' + c, status: cr[0] === 'RUNNING' ? 'OK' : cr[0], alarm: cr[0] === 'STOPPED' }); });
  drawScreen('screen_asrs_hmi', [['Crane', S.asrsDown ? 'FAULT' : S.mission ? 'RETRIEVING' : 'READY', S.asrsDown ? r : g], ['Raw stock', S.rs + ' bins']], { title: 'AS/RS', status: S.asrsDown ? 'DOWN' : 'OK', alarm: S.asrsDown });
  const plcBad = S.attack === 'plc' && S.found && S.response < 3;
  drawScreen('screen_plc_panel', [['Conveyor', believed.speed() + ' %'], ['Program', plcBad ? 'CHANGED' : 'RUN', plcBad ? r : g]], { title: 'PLC-3', status: plcBad ? 'ALERT' : 'RUN', alarm: plcBad });
  [0, 1, 2].forEach(i => drawScreen('screen_plc' + i, [['Signals', '148 tags'], ['Network', S.response >= 2 && S.attack ? 'ISOLATED' : 'ONLINE']], { title: 'ENG-' + (i + 1), status: 'OK' }));
  for (let k = 1; k <= 5; k++) drawScreen('screen_cnc' + k, [['Job', S.weDelay && !S.expedite ? 'LATE' : 'ON TIME', S.weDelay && !S.expedite ? a : g]], { title: 'CNC ' + k });
}
const tagBox = $('#tags'), tags = [];
function tag(pos, fn) { const el = document.createElement('div'); el.className = 'tag'; tagBox.appendChild(el); tags.push({ el, pos, fn, last: '' }); }
tag(local(L.supermarkets['1'].pos, L.supermarkets['1'].op, 0, 0, 1.55), () => ['Supermarket 1', sm[1].cars.length + ' / ' + SM_MAX, sm[1].cars.length === 0 ? 'bad' : sm[1].cars.length <= 1 ? 'warn' : '']);
tag(local(L.supermarkets['2'].pos, L.supermarkets['2'].op, 0, 0, 1.55), () => ['Supermarket 2', sm[2].cars.length + ' / ' + SM_MAX, sm[2].cars.length === 0 ? 'bad' : sm[2].cars.length <= 1 ? 'warn' : '']);
tag(V((L.raw_stock[0].pos[0] + L.raw_stock[1].pos[0]) / 2, (L.raw_stock[0].pos[1] + L.raw_stock[1].pos[1]) / 2, 2.3), () => ['Raw stock', S.rs + ' parts bins', S.rs === 0 ? 'bad' : S.rs <= 3 ? 'warn' : '']);
tag(V(L.asrs.aisle_x, L.asrs.rack_a.y[0] - .3, 2.9), () => ['AS/RS', S.asrsDown ? (S.manual ? 'DOWN · picking by hand' : 'DOWN') : 'Running', S.asrsDown ? 'bad' : '']);
tag(V(22.9, -0.2, 3.1), () => ['War Eagle Inc.', S.weDelay && !S.expedite ? 'Special part LATE' : 'On time', S.weDelay && !S.expedite ? 'warn' : '']);
tag(V(L.finished_goods.pos[0], L.finished_goods.pos[1], 1.6), () => ['Finished goods', S.fg + ' cars', '']);
tag(V(L.heijunka.pos[0], L.heijunka.pos[1], 2.0), () => ['Heijunka box · next', KIND_NAME[HEIJUNKA[S.seq % 7] === 'white' && S.reseq && S.weDelay ? 'blue' : HEIJUNKA[S.seq % 7]].split(' (')[0], '']);
const proj = new THREE.Vector3();
function paintTags() {
  for (const t of tags) { proj.copy(t.pos).project(camera); const d = camera.position.distanceTo(t.pos), vis = proj.z < 1 && Math.abs(proj.x) < 1.05 && Math.abs(proj.y) < 1.05 && d < 34 && !walking;
    t.el.style.opacity = vis ? 1 : 0; if (!vis) continue;
    t.el.style.transform = `translate(-50%,-100%) translate(${((proj.x + 1) / 2 * innerWidth).toFixed(1)}px,${((1 - proj.y) / 2 * innerHeight).toFixed(1)}px)`;
    const v = t.fn(), key = v.join('|'); if (key !== t.last) { t.last = key; t.el.className = 'tag ' + v[2]; t.el.innerHTML = v[0] + '<b>' + v[1] + '</b>'; } }
}

/* ------------------------------------------------------------------ cameras: guided stops, orbit, walk */
const orbit = new OrbitControls(camera, canvas); orbit.enableDamping = true; orbit.dampingFactor = .08; orbit.maxPolarAngle = Math.PI * .495; orbit.minDistance = 1.2; orbit.maxDistance = 46;
const walk = new PointerLockControls(camera, document.body); let walking = false, fly = null, stopId = 'overview';
const keys = {}; addEventListener('keydown', e => { keys[e.code] = true; }); addEventListener('keyup', e => { keys[e.code] = false; });
function goTo(id, instant) { const s = L.camera_stops.find(s => s.id === id); if (!s) return; stopId = id; if (walking) walk.unlock();
  const eye = V(...s.eye), look = V(...s.look);
  if (instant || reduce) { camera.position.copy(eye); orbit.target.copy(look); orbit.update(); } else fly = { a: camera.position.clone(), b: eye, ta: orbit.target.clone(), tb: look, t: 0 };
  document.querySelectorAll('#stops button[data-stop]').forEach(b => b.setAttribute('aria-pressed', b.dataset.stop === id)); }
const stopsEl = $('#stops');
stopsEl.innerHTML = L.camera_stops.map(s => `<button type="button" data-stop="${s.id}" aria-pressed="false">${s.name}</button>`).join('') +
  '<i></i><button type="button" class="walk" id="walkBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4.5" r="1.8"/><path d="M12 7.5v6m0 0l-3 6m3-6l3 6M8 10.5l4-2 4 2"/></svg>Walk around</button>';
stopsEl.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.stop) goTo(b.dataset.stop); else startWalk(); });
function startWalk() { fly = null; orbit.enabled = false; camera.position.set(Math.min(26, Math.max(L.rooms.hall.x[0] + .6, orbit.target.x)), 1.65, Math.min(-.6, Math.max(-7, orbit.target.z + 2.5))); camera.lookAt(orbit.target.x, 1.3, orbit.target.z); walk.lock(); }
document.addEventListener('pointerlockerror', () => { orbit.enabled = true; });
walk.addEventListener('lock', () => { walking = true; orbit.enabled = false; $('#hint').classList.add('on'); document.querySelectorAll('#stops button[data-stop]').forEach(b => b.setAttribute('aria-pressed', 'false')); });
walk.addEventListener('unlock', () => { walking = false; orbit.enabled = true; $('#hint').classList.remove('on');
  const d = new THREE.Vector3(); camera.getWorldDirection(d); orbit.target.copy(camera.position).addScaledVector(d, 3); orbit.target.y = 1.1; orbit.update(); });
const inside = (x, y) => { const R = L.rooms, m = .35, r = k => x > R[k].x[0] + m && x < R[k].x[1] - m && y > R[k].y[0] + m && y < R[k].y[1] - m;
  return r('hall') || r('bay') || r('wareagle') || r('plc') || (x > 11.35 && x < 26.65 && Math.abs(y) < .4 && (x < 18.6 || (x > 19.3 && x < 20.5))) || (Math.abs(x - R.hall.x[0]) < .4 && y > L.plc.door[0] + .1 && y < L.plc.door[1] - .1); };
function walkStep(dt) { const sp = (keys.ShiftLeft || keys.ShiftRight ? 5 : 2.4) * dt, f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0), r = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  camera.position.y = 1.65; if (!f && !r) return; const p = camera.position.clone(); walk.moveForward(f * sp); walk.moveRight(r * sp); camera.position.y = 1.65;
  if (!inside(camera.position.x, -camera.position.z)) { const q = camera.position.clone(); camera.position.set(q.x, 1.65, p.z); if (!inside(q.x, -p.z)) { camera.position.set(p.x, 1.65, q.z); if (!inside(p.x, -q.z)) camera.position.copy(p); } } }

/* ------------------------------------------------------------------ clicking things: what is this / inspect */
const INFO = {
  sm1: ['Supermarket 1', 'Buffer between Cell 1 and Cell 2. Cell 2 pulls from here; an empty space is the signal for Cell 1 to build.'],
  sm2: ['Supermarket 2', 'Buffer between Cell 2 and the conveyor line. Its level is the kanban signal that tells Cell 2 when to build.'],
  heijunka: ['Heijunka box', 'Levels the mix: cards leave in a fixed pattern (2 blue, 1 orange, 1 white, 2 blue, 1 orange) and pace the whole plant.'],
  plc_cabinet: ['PLC · line control', 'The controller for the conveyor and the andon signals. It runs the program engineers load from the computer lab.'],
  conveyor: ['Conveyor · Cell 3', 'The pacemaker process. Stations 11 to 15 finish the car at takt time.'],
  asrs: ['AS/RS · Tier 1 raw material supplier', 'Automated storage and retrieval. The crane brings totes of parts to raw stock when the bins run low.'],
  rawstock: ['Raw stock', 'Flow racks of parts bins that feed Cell 1.'],
  wareagle: ['War Eagle Inc.', 'Tier 1 just-in-time supplier. Its CNC cell makes the special part for white-card orders and delivers it to station 15.'],
  screen_cell1: ['Cell 1 dashboard', 'What the plant system reports for Cell 1.'], screen_cell2: ['Cell 2 dashboard', 'What the plant system reports for Cell 2.'], screen_cell3: ['Cell 3 dashboard', 'What the plant system reports for the conveyor line.'],
  tool_area: ['Tool area', 'Shadow board and bench: every tool has a marked home (5S).'], fg: ['Finished goods', 'Completed cars leave the line here.'],
};
const keyOf = n => /^sm1|label_sm1/.test(n) ? 'sm1' : /^sm2|label_sm2/.test(n) ? 'sm2' : /heijunka/.test(n) ? 'heijunka' : /^(plc_cabinet|screen_plc_panel|label_plc|light_plc|plc_rack)/.test(n) ? 'plc_cabinet'
  : /^(conveyor|st1[1-5])/.test(n) ? 'conveyor' : /^asrs/.test(n) || n === 'screen_asrs_hmi' ? 'asrs' : /^rawstock/.test(n) ? 'rawstock' : /^(cnc|printer3d|label_wareagle|wareagle|screen_cnc|light_cnc|num_cnc)/.test(n) ? 'wareagle'
  : /^(screen_cell|tv_cell)([123])/.test(n) ? 'screen_cell' + n.slice(-1) : /^tool_area|label_toolarea/.test(n) ? 'tool_area' : /^(fg_table|label_fg)/.test(n) ? 'fg' : /^st(\d\d)/.test(n) ? 'station' + (+n.slice(2, 4)) : null;
function rows(k) {                                                       // [what, the system says, on the floor]
  const yn = v => v === 'g' ? 'running' : v === 'y' ? 'waiting' : 'stopped';
  if (k === 'sm1') return [['Sub-assemblies in the supermarket', believed.sm1(), sm[1].cars.length]];
  if (k === 'sm2') return [['Sub-assemblies in the supermarket', believed.sm2(), sm[2].cars.length], ['Kanban to Cell 2', believed.sm2() + wip(2) >= SM_MAX ? 'hold' : 'build', sm[2].cars.length + wip(2) >= SM_MAX ? 'hold' : 'build']];
  if (k === 'conveyor') return [['Belt speed', believed.speed() + ' %', realSpeed() + ' %'], ['Defects today', believed.defects(), S.scrap], ['Station 13', yn(believed.andon(13)), ST[13].car && ST[13].car.defect ? 'rushing' : yn(lampOf(13))]];
  if (k === 'plc_cabinet') { const bad = S.attack === 'plc' && S.response < 3; return [['Conveyor speed setpoint', '100 %', realSpeed() + ' %'], ['Program checksum', '4F2A-91C3', bad ? '9C71-0E55' : '4F2A-91C3'], ['Last program change', 'none scheduled', bad ? '02:14 from ENG-2' : 'none'], ['Andon signals to dashboards', 'live', bad ? 'forced green' : 'live']]; }
  if (k.startsWith('screen_cell')) { const c = +k.slice(-1), b = cells[c].map(n => believed.andon(n)), f = cells[c].map(lampOf), w = a => a.includes('r') ? 'stopped' : a.includes('y') ? 'waiting' : 'running';
    const r = [['Line status', w(b), w(f)]]; if (c === 2) r.push(['Supermarket 2 level', believed.sm2(), sm[2].cars.length]); if (c === 3) r.push(['Defects', believed.defects(), S.scrap], ['Belt speed', believed.speed() + ' %', realSpeed() + ' %']); return r; }
  if (k === 'asrs') return [['Crane', S.asrsDown ? 'fault' : 'ready', S.asrsDown ? 'not moving' : 'moving']];
  if (k === 'rawstock') return [['Parts bins in the racks', S.rs, S.rs]];
  if (k === 'heijunka') return [['Next card', HEIJUNKA[S.seq % 7], HEIJUNKA[S.seq % 7]], ['Takt time', TAKT.toFixed(1) + ' s', (TAKT / S.lineSpeed).toFixed(1) + ' s']];
  if (k === 'wareagle') return [['Special part lead time', 'on time', S.weDelay && !S.expedite ? 'late' : 'on time']];
  if (k.startsWith('station')) { const n = +k.slice(7); return [['Andon', yn(believed.andon(n)), yn(lampOf(n))]]; }
  return [];
}
const card = $('#card'), cardBody = $('#cardBody'); let cardKey = null, verdict = '';
function openCard(k) { cardKey = k; verdict = ''; card.classList.add('on'); paintCard(); }
function paintCard() {
  if (!cardKey) return; const st = cardKey.startsWith('station'), info = st ? ['Station ' + cardKey.slice(7), 'One operator, one step of the build. The stack light above it is its andon.'] : INFO[cardKey]; if (!info) return;
  const r = rows(cardKey), showDiff = S.mode === 'B' && S.found;
  cardBody.innerHTML = `<h2>${info[0]}</h2><p>${info[1]}</p>` + (r.length ? `<table><tr><th></th><th>System says</th><th>On the floor</th></tr>${r.map(x => `<tr class="${showDiff && String(x[1]) !== String(x[2]) ? 'diff' : ''}"><td>${x[0]}</td><td>${x[1]}</td><td>${x[2]}</td></tr>`).join('')}</table>` : '') +
    (S.mode === 'B' && S.attack && !S.found ? `<div class="row"><button type="button" class="flag" id="flagBtn">Flag as tampered</button></div>` : '') + (verdict ? `<div class="verdict ${verdict[0]}">${verdict[1]}</div>` : '');
  const f = $('#flagBtn'); if (f) f.onclick = flag;
}
$('#cardX').onclick = () => { card.classList.remove('on'); cardKey = null; };
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let downAt = null;
canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', e => { if (!downAt || walking || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
  ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, camera);
  for (const h of ray.intersectObject(lab, true)) { const n = nameOf(h.object);
    if (!h.object.visible || /^(glass|ceiling|asrs_cage)/.test(n)) continue;       // see-through or hidden: look behind it
    const k = keyOf(n); if (k) openCard(k); return; } });

/* ------------------------------------------------------------------ the panel: explore, scenario A, scenario B */
const panel = $('#panel'), fmt = t => String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(Math.floor(t % 60)).padStart(2, '0');
function paintLog() { const el = $('#log'); if (el) el.innerHTML = S.log.map(l => `<div class="${l.cls || ''}"><time>${fmt(l.t)}</time><span>${l.text}</span></div>`).join('') || '<div><time></time><span>Nothing to report yet.</span></div>'; }
function kpis() {
  const target = Math.max(1, Math.floor(S.t / TAKT)), adh = Math.min(100, Math.round(S.fg / target * 100)), stopped = [1, 2, 3].filter(c => cells[c].some(n => lampOf(n) === 'r')).length, waiting = [1, 2, 3].filter(c => cells[c].every(n => lampOf(n) !== 'g' || !ST[n].car) && cells[c].some(n => lampOf(n) === 'y')).length;
  const cover = Math.round((sm[2].cars.length + wip(3)) * TAKT);
  return [['Cars built', S.fg, ''], ['To plan', S.t < 20 ? '–' : adh + ' %', S.t < 20 ? '' : adh >= 90 ? 'ok' : adh >= 70 ? 'warn' : 'bad'], ['Cover left', cover + ' s', cover <= TAKT * 2 ? 'bad' : cover <= TAKT * 4 ? 'warn' : 'ok'],
    ['Supermarket 1', sm[1].cars.length + '/' + SM_MAX, ''], ['Supermarket 2', sm[2].cars.length + '/' + SM_MAX, ''], ['Raw stock', S.rs, S.rs === 0 ? 'bad' : '']];
}
const kpiHtml = () => `<div class="kpis" id="kpis">${kpis().map(k => `<div class="kpi ${k[2]}"><small>${k[0]}</small><b>${k[1]}</b></div>`).join('')}</div>`;
const btn = (id, title, sub, o = {}) => `<button type="button" class="btn ${o.cls || ''}" id="${id}" aria-pressed="${!!o.on}" ${o.off ? 'disabled' : ''}><b>${title}</b><span>${sub}</span></button>`;
const RESP = {
  kanban: ['Go and see: count Supermarket 2 by hand. The floor wins over the screen.', 'Switch Cell 2 to physical kanban cards so production follows the real count.', 'Isolate the e-kanban server from the plant network.', 'Check every signal against the floor, then bring the system back.', 'Find how the signal was changed and report it.'],
  plc: ['Pull the andon: stop the conveyor until the cause is known (jidoka).', 'Isolate the PLC network from the computer lab.', 'Restore the last known-good program from the offline backup and verify its checksum.', 'Change the passwords and turn off remote programming.', 'Restart at takt and quality-check the cars built during the attack.'],
};
function paintPanel() {
  if (S.mode === 'explore') panel.innerHTML = `<div><p class="kick">Digital twin · preview</p><h1>The Tiger Motors lab, in 3D</h1></div>
    <p>A working model of the Integrated Manufacturing Facility: three cells, two supermarkets, the AS/RS and a Tier 1 supplier, running as a pull system.</p>
    <p>Use the stops at the bottom to move through the lab, drag to look around, or walk it yourself. Click any piece of equipment to see what it does.</p>
    <p class="sec">Live</p>${kpiHtml()}
    <p class="sec">Try a scenario</p><div class="btns">${btn('goA', 'Scenario A · Supply chain disruption', 'A supplier runs late or the AS/RS goes down. Watch the pull system react, then recover.')}${btn('goB', 'Scenario B · Spot the cyber attack', 'One signal in the plant is lying. Find it before the line pays for it.')}</div>`;
  else if (S.mode === 'A') { const dis = S.weDelay || S.asrsDown;
    panel.innerHTML = `<div><p class="kick">Scenario A</p><h1>Supply chain disruption</h1></div>
    <p>Break one link in the chain and watch what a pull system does: it stops building what it cannot use, the supermarkets buy time, and the andon lights show exactly where the problem is.</p>
    <p class="sec">1 · Cause a disruption</p><div class="btns">
      ${btn('weDelay', 'War Eagle Inc. delivers late', 'The special part for white-card orders stops arriving just in time.', { on: S.weDelay })}
      ${btn('asrsDown', 'AS/RS outage', 'The crane faults. No more raw material reaches raw stock.', { on: S.asrsDown })}</div>
    <p class="sec">2 · Recover</p><div class="btns">
      ${btn('reseq', 'Re-sequence the Heijunka box', 'Build standard models while the special part is late. White orders wait, the line keeps its pace.', { cls: 'good', on: S.reseq, off: !S.weDelay })}
      ${btn('expedite', 'Expedite at the supplier', 'War Eagle moves the job to CNC 5 and the 3D printer. Lead time returns to normal.', { cls: 'good', on: S.expedite, off: !S.weDelay })}
      ${btn('manual', 'Pick by hand while the AS/RS is down', 'A material handler pulls totes manually. Slower, but Cell 1 keeps running.', { cls: 'good', on: S.manual, off: !S.asrsDown })}</div>
    <p class="sec">Plant</p>${kpiHtml()}<p class="sec">What is happening</p><div class="log" id="log"></div>
    <div class="btns">${btn('reset', 'Reset the plant', dis ? 'Clear the disruption and start again.' : 'Start again from a healthy line.')}</div>`; }
  else { const a = S.attack;
    panel.innerHTML = `<div><p class="kick">Scenario B</p><h1>Spot the cyber attack</h1></div>` + (!a ? `
    <p>A connected factory trusts its signals. An attacker does not need to break a machine, only to make one signal lie. Start an attack, then walk the floor and compare what the system says with what you can see.</p>
    <div class="btns">${btn('atkK', 'Tampered kanban signal', 'Someone changed what the plant believes about one supermarket.')}${btn('atkP', 'Compromised PLC', 'Someone changed the program that runs the line.')}${btn('atkR', 'Surprise me', 'Pick one at random and do not tell me which.', { cls: 'primary' })}</div>` : !S.found ? `
    <p><b>Something in the plant is lying.</b> Click equipment and screens to compare <i>System says</i> with <i>On the floor</i>. When you find the source, flag it.</p>
    <div class="kpis"><div class="kpi"><small>Time to detect</small><b id="ttd">${fmt(S.t - S.attackAt)}</b></div><div class="kpi ${S.wrong ? 'warn' : ''}"><small>Wrong flags</small><b>${S.wrong}</b></div><div class="kpi"><small>Cars built</small><b>${S.fg}</b></div></div>
    <div class="btns">${btn('hintB', 'Give me a hint', 'Point me at the right part of the plant.')}</div>
    <p class="sec">Plant</p>${kpiHtml()}<p class="sec">What is happening</p><div class="log" id="log"></div>
    <div class="btns">${btn('reset', 'Stop and reset', 'End this attack.')}</div>` : `
    <p><b>Found in ${fmt(S.foundAt - S.attackAt)}.</b> ${a === 'kanban' ? 'The e-kanban signal for Supermarket 2 was forced to “full”. Cell 2 obeyed the screen and stopped building while the real supermarket ran empty.' : 'The conveyor program was changed: the belt was sped up beyond takt and the andon signals were forced green, so the dashboards hid the defects.'}</p>
    <p class="sec">Response</p><ol class="steps">${RESP[a].map((s, i) => `<li class="${i < S.response ? 'done' : ''}">${s}</li>`).join('')}</ol>
    <div class="btns">${S.response < 5 ? btn('respond', S.response ? 'Next step' : 'Start the response', 'Step ' + (S.response + 1) + ' of 5', { cls: 'primary' }) : btn('reset', 'Run another attack', 'The plant is back to normal.', { cls: 'primary' })}</div>
    <p class="sec">Plant</p>${kpiHtml()}<p class="sec">What is happening</p><div class="log" id="log"></div>`); }
  paintLog();
}
function setMode(m) { S.mode = m; resetSim(); document.querySelectorAll('.modes button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m)); card.classList.remove('on'); cardKey = null; paintPanel();
  if (m === 'A') say('The plant is running to takt. Cause a disruption to begin.', ''); if (m === 'B') goTo('overview'); }
document.querySelector('.modes').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setMode(b.dataset.mode); });
function startAttack(a) { S.attack = a; S.attackAt = S.t; S.found = false; S.wrong = 0; S.response = 0; if (a === 'plc') S.lineSpeed = 1.38; say('An attack has started somewhere in the plant.', 'warn'); paintPanel(); }
function flag() {
  const k = cardKey, hit = (S.attack === 'kanban' && k === 'sm2') || (S.attack === 'plc' && k === 'plc_cabinet');
  const symptom = (S.attack === 'kanban' && k === 'screen_cell2') || (S.attack === 'plc' && (k === 'conveyor' || k === 'screen_cell3' || k === 'station13'));
  if (hit) { S.found = true; S.foundAt = S.t; verdict = ['ok', 'Correct. This is where the plant is being lied to.']; say('Attack found: ' + (S.attack === 'kanban' ? 'the Supermarket 2 kanban signal was tampered with.' : 'the conveyor PLC program was changed.'), 'ok'); paintPanel(); }
  else if (symptom) verdict = ['no', S.attack === 'plc' ? 'You found a symptom: the numbers here do not match. Ask what controls this.' : 'You found a symptom: this screen repeats a number it was given. Where does that number come from?'];
  else { S.wrong++; verdict = ['no', 'This one checks out: the system and the floor agree.']; paintPanel(); }
  paintCard();
}
function respond() { const a = S.attack; S.response++; say(RESP[a][S.response - 1], 'ok');
  if (a === 'kanban' && S.response === 2) S.manualCards = true;                    // cell 2 now follows the real count
  if (a === 'plc') { if (S.response === 1) S.lineStop = true; if (S.response === 3) S.lineSpeed = 1; if (S.response === 5) S.lineStop = false; }
  if (S.response === 5) say('The plant is back to normal and verified against the floor.', 'ok');
  paintPanel(); }
panel.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.disabled) return; const id = b.id;
  if (id === 'goA') return setMode('A'); if (id === 'goB') return setMode('B'); if (id === 'reset') return setMode(S.mode);
  if (id === 'weDelay') { S.weDelay = !S.weDelay; if (!S.weDelay) { S.reseq = S.expedite = false; S.parts.forEach(p => { p.dur = Math.min(p.dur, p.t + 3); }); say('War Eagle Inc. is delivering on time again.', 'ok'); } else { say('Disruption: War Eagle Inc. will deliver the special part late.', 'bad'); goTo('cell3'); } }
  if (id === 'asrsDown') { S.asrsDown = !S.asrsDown; if (!S.asrsDown) { S.manual = false; say('AS/RS is back online. Raw stock is being refilled.', 'ok'); } else { say('Disruption: the AS/RS crane has faulted. Raw stock will not be refilled.', 'bad'); goTo('asrs'); } }
  if (id === 'reseq') { S.reseq = !S.reseq; say(S.reseq ? 'Countermeasure: Heijunka box re-sequenced. White orders wait; blue and orange keep the line at takt.' : 'Heijunka box back to its normal pattern.', S.reseq ? 'ok' : ''); }
  if (id === 'expedite') { S.expedite = !S.expedite; if (S.expedite) { S.parts.forEach(p => { p.dur = Math.min(p.dur, p.t + 4); }); say('Countermeasure: War Eagle expedites on CNC 5 and the 3D printer. Parts are moving again.', 'ok'); goTo('wareagle'); } }
  if (id === 'manual') { S.manual = !S.manual; say(S.manual ? 'Countermeasure: totes are being picked by hand. Slower than the crane, but Cell 1 has material.' : 'Manual picking stopped.', S.manual ? 'ok' : ''); }
  if (id === 'atkK') return startAttack('kanban'); if (id === 'atkP') return startAttack('plc'); if (id === 'atkR') return startAttack(Math.random() < .5 ? 'kanban' : 'plc');
  if (id === 'hintB') { say(S.attack === 'kanban' ? 'Hint: one cell has stopped building although nothing looks wrong at its benches. What tells it when to build?' : 'Hint: watch the conveyor. Is it really running at the speed the screens show? What decides that speed?', 'warn'); goTo(S.attack === 'kanban' ? 'cell2' : 'cell3'); return; }
  if (id === 'respond') return respond();
  paintPanel(); });

$('#panelHide').onclick = () => { document.body.classList.add('nopanel'); resize(); $('#panelShow').focus(); };
$('#panelShow').onclick = () => { document.body.classList.remove('nopanel'); resize(); $('#panelHide').focus(); };

/* narration for scenario A: say what the pull system is doing, once per change */
const seen = {};
function narrate() {
  if (S.mode !== 'A') return; const note = (k, on, text, cls) => { if (on && !seen[k]) { seen[k] = 1; say(text, cls); } if (!on) seen[k] = 0; };
  note('sm2full', sm[2].cars.length >= SM_MAX && ST[15].state === 'stopped', 'Supermarket 2 is full, so Cell 2 has no kanban and stops building. No overproduction.', 'warn');
  note('sm1full', sm[1].cars.length >= SM_MAX && ST[6].state === 'blocked', 'Supermarket 1 is full too. Cell 1 stops. The whole plant is waiting on one missing part.', 'warn');
  note('rs0', S.rs === 0 && S.asrsDown, 'Raw stock is empty. Cell 1 is starved; the supermarkets are now the only cover.', 'bad');
  note('sm1e', sm[1].cars.length === 0 && S.asrsDown && S.rs === 0, 'Supermarket 1 has run out. Cell 2 is starved.', 'bad');
  note('sm2e', sm[2].cars.length === 0 && S.asrsDown && S.rs === 0, 'Supermarket 2 has run out. The pacemaker has nothing to build: output stops.', 'bad');
  if (S.weDelay || S.asrsDown) S.disruptAt = S.t;                                    // remember that something went wrong
  else if (S.disruptAt !== null && [1, 2, 3].every(c => cells[c].some(n => ST[n].state === 'busy')) && sm[1].cars.length && sm[2].cars.length) {
    S.disruptAt = null; say('All three cells are flowing again and the supermarkets are refilling.', 'ok'); }
}

/* ------------------------------------------------------------------ run */
resetSim(); paintPanel(); goTo('overview', true);
$('#loading').classList.add('gone'); $('#ver').textContent = 'model v' + L.version + ' · preview';
let last = performance.now(), uiT = 0;
function frame(now) {
  if (window.__capturing) { last = now; requestAnimationFrame(frame); return; }   // a recording drives the frames itself
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  tick(dt); visuals(dt); narrate();
  if (fly) { fly.t += dt / 1.5; const k = ease(Math.min(1, fly.t)); camera.position.lerpVectors(fly.a, fly.b, k); orbit.target.lerpVectors(fly.ta, fly.tb, k); if (fly.t >= 1) fly = null; }
  if (walking) walkStep(dt); else if (orbit.enabled) orbit.update();
  const above = camera.position.y > L.ceiling - .2;                     // looking in from above: lift the roof off
  ['ceiling', 'ceiling_lights', 'walls_outer'].forEach(n => { if (N[n]) N[n].visible = !above; });
  ['tv_cell1', 'tv_cell2', 'tv_cell3'].forEach(n => { if (N[n]) N[n].visible = true; });
  screenT += dt; if (screenT > .5) { screenT = 0; paintScreens(); }
  uiT += dt; if (uiT > .4) { uiT = 0; const k = $('#kpis'); if (k) k.outerHTML = kpiHtml(); const t = $('#ttd'); if (t) t.textContent = fmt(S.t - S.attackAt); if (cardKey) paintCard(); }
  paintTags(); renderer.render(scene, camera); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__lab = { S, ST, sm, L, goTo, setMode, startAttack, camera, orbit, N, openCard, believed, lampOf,
  step: sec => { for (let i = 0; i < sec * 20; i++) { tick(.05); narrate(); } },
  /* one frame of a recording (used to make the home page's preview clip): advance the plant by dt, put the camera at eye looking at look */
  shot: (dt, eye, look) => { window.__capturing = true; tick(dt); visuals(dt); camera.position.set(eye[0], eye[2], -eye[1]); orbit.target.set(look[0], look[2], -look[1]); camera.lookAt(orbit.target);
    const above = camera.position.y > L.ceiling - .2; ['ceiling', 'ceiling_lights', 'walls_outer'].forEach(n => { if (N[n]) N[n].visible = !above; });
    screenT += dt; if (screenT > .5) { screenT = 0; paintScreens(); } renderer.render(scene, camera); } };   // for testing
