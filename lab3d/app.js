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

function resize() { const w = innerWidth, h = innerHeight, side = w > 900 && !document.body.classList.contains('nopanel') && !document.body.classList.contains('demo') ? 396 : 0;      // keep the lab centred in the space left of the side panel
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
    if (kind === 'white') c = c === 'RED' ? 'WHT' : c === 'WHT' ? 'BLU' : c;
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
  freeze: false, lampOv: {}, rate: 1, tab: 'normal', noWhite: false, reserve15: false, cncDown: 0, isolated: false, cardsOn: false,
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

function lampOf(n) { if (S.lampOv[n]) return S.lampOv[n]; const s = ST[n].state; return s === 'stopped' ? 'r' : (s === 'starved' || s === 'blocked') ? 'y' : 'g'; }
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
  if (!S.freeze && !s1.car && !incoming(1)) {
    if (sm[1].cars.length + wip(1) >= SM_MAX) s1.state = 'blocked';
    else if (S.rs <= 0) s1.state = 'starved';
    else { S.rs--; const c = newCar('blue', 0); place(c, s1.spot.clone().add(new THREE.Vector3(0, .25, 0)), s1.yaw); arrive(c, s1); send(c, s1.spot, s1.yaw, .5, 0, null); }
  }
  // cell 2 pulls from supermarket 1 when the kanban system says supermarket 2 has room
  const s6 = ST[6];
  if (!S.freeze && !s6.car && !incoming(6)) {
    if (believed.sm2() + wip(2) >= SM_MAX) s6.state = 'blocked';
    else if (!sm[1].cars.length || sm[1].cars[0].move) s6.state = 'starved';
    else { const c = sm[1].cars.shift(); restack(sm[1]); c.to = s6; send(c, s6.spot, s6.yaw, MOVE, .22, () => arrive(c, s6)); }
  }
  // cell 3 (pacemaker) launches one car per takt from supermarket 2, in the Heijunka order
  const s11 = ST[11];
  if (!S.freeze && !s11.car && !incoming(11) && !S.lineStop) {
    if (!sm[2].cars.length || sm[2].cars[0].move) { if (S.t - S.lastLaunch > TAKT) s11.state = 'starved'; }
    else if (S.t - S.lastLaunch >= TAKT / S.lineSpeed) {
      let kind = HEIJUNKA[S.seq % HEIJUNKA.length];
      if (kind === 'white' && (S.noWhite || (S.reseq && S.weDelay))) { kind = 'blue'; }                       // countermeasure: build standard models while the special part is late
      S.seq++; S.lastLaunch = S.t; const c = sm[2].cars.shift(); restack(sm[2]); c.to = s11; c.kind = kind; if (S.cardsOn) giveCard(c);
      send(c, s11.spot, s11.yaw, MOVE, .2, () => arrive(c, s11));
    }
  }
  // work at every station, then hand the car on
  for (let n = 1; n <= 15; n++) { const s = ST[n], c = s.car; if (!c || S.freeze) continue;
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
  if (nx.car || incoming(nx.n) || (S.lineStop && s.cell === 3) || (nx.n === 15 && S.reserve15)) { s.state = 'blocked'; return; }
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
    attack: null, found: false, attackAt: null, wrong: 0, response: 0, lineSpeed: 1, lineStop: false, manualCards: false,
    freeze: false, lampOv: {}, rate: 1, tab: 'normal', noWhite: false, reserve15: false, cncDown: 0, isolated: false, cardsOn: false });
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
  for (let k = 1; k <= 5; k++) { const o = N['light_cnc' + k]; if (o) setLamp(o, !(S.cncDown === k && Math.floor(S.t * 3) % 2), S.cncDown === k ? LAMP.r : S.weDelay && !S.expedite ? LAMP.y : LAMP.g); }
  if (N.light_plc) setLamp(N.light_plc, true, S.tab === 'glitch' || (S.attack === 'plc' && S.found && S.response < 3) ? LAMP.r : S.isolated ? LAMP.y : LAMP.g);
}
let screenT = 0;
function paintScreens() {
  const g = '#3FB68B', r = '#F0544F', a = '#F2B233';
  const cellRow = c => { const st = cells[c].map(n => believed.andon(n)); return st.includes('r') ? ['STOPPED', r] : st.includes('y') ? ['WAITING', a] : ['RUNNING', g]; };
  const target = Math.floor(S.t / TAKT);
  [1, 2, 3].forEach(c => { if (S.tab === 'glitch') return drawScreen('screen_cell' + c, [['Orders', Math.floor(Math.random() * 900) + ' ???', r], ['Signal', 'INVALID', r], ['Source', 'UNKNOWN', r]], { title: 'CELL ' + c, status: 'ERROR', alarm: true });
    if (S.tab === 'cards') return drawScreen('screen_cell' + c, [['E-kanban', 'OFFLINE', a], ['Running on', 'CARDS', g]], { title: 'CELL ' + c, status: 'MANUAL' });
    const cr = cellRow(c), sup = c === 1 ? ['Supermarket 1', believed.sm1() + ' / ' + SM_MAX] : c === 2 ? ['Supermarket 2', believed.sm2() + ' / ' + SM_MAX] : ['Finished goods', S.fg];
    drawScreen('screen_cell' + c, [['Line status', cr[0], cr[1]], sup, c === 3 ? ['Defects', believed.defects()] : ['Work in progress', wip(c)], c === 3 ? ['Belt speed', believed.speed() + ' %'] : ['Takt', TAKT.toFixed(1) + ' s']],
      { title: 'CELL ' + c, status: cr[0] === 'RUNNING' ? 'OK' : cr[0], alarm: cr[0] === 'STOPPED' }); });
  drawScreen('screen_asrs_hmi', [['Crane', S.asrsDown ? 'FAULT' : S.mission ? 'RETRIEVING' : 'READY', S.asrsDown ? r : g], ['Raw stock', S.rs + ' bins']], { title: 'AS/RS', status: S.asrsDown ? 'DOWN' : 'OK', alarm: S.asrsDown });
  const plcBad = S.attack === 'plc' && S.found && S.response < 3;
  drawScreen('screen_plc_panel', [['Conveyor', believed.speed() + ' %'], ['Program', plcBad ? 'CHANGED' : 'RUN', plcBad ? r : g]], { title: 'PLC-3', status: plcBad ? 'ALERT' : 'RUN', alarm: plcBad });
  [0, 1, 2].forEach(i => drawScreen('screen_plc' + i, [['Signals', '148 tags'], ['Network', S.isolated || (S.response >= 2 && S.attack) ? 'ISOLATED' : S.tab === 'glitch' ? 'INTRUSION' : 'ONLINE', S.tab === 'glitch' ? r : undefined]], { title: 'ENG-' + (i + 1), status: 'OK' }));
  for (let k = 1; k <= 5; k++) drawScreen('screen_cnc' + k, [['Job', S.cncDown === k ? 'FAULT' : S.weDelay && !S.expedite ? 'LATE' : 'ON TIME', S.cncDown === k ? r : S.weDelay && !S.expedite ? a : g]], { title: 'CNC ' + k, alarm: S.cncDown === k });
  for (const n in tabs) drawTablet(+n);
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
  for (const t of tags) { const pos = typeof t.pos === 'function' ? t.pos() : t.pos; proj.copy(pos).project(camera); const d = camera.position.distanceTo(pos), vis = proj.z < 1 && Math.abs(proj.x) < 1.05 && Math.abs(proj.y) < 1.05 && d < 34 && !walking && (D.on ? !!t.demo : !t.demo);
    t.el.style.opacity = vis ? 1 : 0; if (!vis) continue;
    t.el.style.transform = `translate(-50%,-100%) translate(${((proj.x + 1) / 2 * innerWidth).toFixed(1)}px,${((1 - proj.y) / 2 * innerHeight).toFixed(1)}px)`;
    const v = t.fn(), key = v.join('|'); if (key !== t.last) { t.last = key; t.el.className = 'tag ' + v[2]; t.el.innerHTML = v[0] + (v[1] !== '' ? '<b>' + v[1] + '</b>' : ''); } }
}

/* ------------------------------------------------------------------ cameras: guided stops, orbit, walk */
const orbit = new OrbitControls(camera, canvas); orbit.enableDamping = true; orbit.dampingFactor = .08; orbit.maxPolarAngle = Math.PI * .495; orbit.minDistance = 1.2; orbit.maxDistance = 46;
const walk = new PointerLockControls(camera, document.body); let walking = false, fly = null, stopId = 'overview';
const keys = {}; addEventListener('keydown', e => { keys[e.code] = true; }); addEventListener('keyup', e => { keys[e.code] = false; });
function goTo(id, instant) { const s = L.camera_stops.find(s => s.id === id); if (!s) return; stopId = id; auto = null; if (walking) walk.unlock();
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
let bobPh = 0, bobAmp = 0;                                               // footsteps: a small rise and fall while walking
function walkStep(dt) { const sp = (keys.ShiftLeft || keys.ShiftRight ? 4.2 : 1.9) * dt, f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0), r = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const bob = () => { camera.position.y = 1.65 + (reduce ? 0 : Math.sin(bobPh) * .032 * bobAmp); };
  camera.position.y = 1.65; if (!f && !r) { bobAmp += (0 - bobAmp) * Math.min(1, dt * 8); bob(); return; } const p = camera.position.clone(); walk.moveForward(f * sp); walk.moveRight(r * sp); camera.position.y = 1.65;
  if (!inside(camera.position.x, -camera.position.z)) { const q = camera.position.clone(); camera.position.set(q.x, 1.65, p.z); if (!inside(q.x, -p.z)) { camera.position.set(p.x, 1.65, q.z); if (!inside(p.x, -q.z)) camera.position.copy(p); } }
  const moved = Math.hypot(camera.position.x - p.x, camera.position.z - p.z); bobPh += moved * (Math.PI * 2 / .74); bobAmp += ((moved > .0005 ? 1 : 0) - bobAmp) * Math.min(1, dt * 8); bob(); }

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
canvas.addEventListener('pointerup', e => { if (!downAt || walking || D.on || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
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
    <p class="sec">Watch a scenario</p><div class="btns">${btn('goDA', 'Scenario A · Demo', 'A two-minute film: a late part stops the line, and the people who fix it.', { cls: 'primary' })}${btn('goDB', 'Scenario B · Demo', 'A two-minute film: a cyber attack on the kanban screens, and the switch to cards.', { cls: 'primary' })}</div>
    <p class="sec">Or run one yourself</p><div class="btns">${btn('goA', 'Scenario A · Supply chain disruption', 'A supplier runs late or the AS/RS goes down. Watch the pull system react, then recover.')}${btn('goB', 'Scenario B · Spot the cyber attack', 'One signal in the plant is lying. Find it before the line pays for it.')}</div>`;
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
function setMode(m) { const wasDemo = D.on; stopDemo(); auto = null; if (wasDemo && m !== 'demoA' && m !== 'demoB') goTo('overview', true); if (m === 'demoA' || m === 'demoB') { document.querySelectorAll('.modes button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m)); return startDemo(m); }
  S.mode = m; resetSim(); document.querySelectorAll('.modes button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m)); card.classList.remove('on'); cardKey = null; paintPanel();
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
  if (id === 'goA') return setMode('A'); if (id === 'goB') return setMode('B'); if (id === 'goDA') return setMode('demoA'); if (id === 'goDB') return setMode('demoB'); if (id === 'reset') return setMode(S.mode);
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

/* ------------------------------------------------------------------ people: an operator at every station, plus actors the demos bring in */
const OPV = { '-y': [0, -1], '+x': [1, 0], '+y': [0, 1], '-x': [-1, 0] };
const yawOf = (dx, dy) => Math.atan2(dx, -dy);                          // a lab direction as a turn for something that faces +Z
const pmats = {}, PM = hex => pmats[hex] || (pmats[hex] = new THREE.MeshStandardMaterial({ color: hex, roughness: .72 }));
const SKIN = ['#F1C9A5', '#D9A47A', '#B07A52', '#8A5A3C', '#F5D6BA', '#C68E63'], HAIR = ['#2A211C', '#4A3424', '#1B1B1D', '#6B4A2E', '#8C8A86'];
const people = [];
function makePerson(o = {}) {
  const g = new THREE.Group(), P = {}, sk = o.skin || SKIN[people.length % SKIN.length];
  const cap = (r, len, hex) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 12), PM(hex)); m.castShadow = true; return m; };
  const limb = (r, len, hex, x, y, end) => { const piv = new THREE.Group(); piv.position.set(x, y, 0); const m = cap(r, len, hex); m.position.y = -(len / 2 + r * .5); piv.add(m); if (end) { end.position.y = -(len + r * 1.2); piv.add(end); } g.add(piv); return piv; };
  const shoe = () => { const m = new THREE.Mesh(new THREE.BoxGeometry(.1, .07, .25), PM('#1B1C1F')); m.position.z = .05; m.castShadow = true; return m; };
  const hand = () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.052, 10, 8), PM(sk)); m.castShadow = true; return m; };
  const pants = o.pants || (people.length % 3 ? '#2B3140' : '#8E7B5C'), shirt = o.shirt || '#1D3557';
  P.legL = limb(.078, .68, pants, -.1, .82, shoe()); P.legR = limb(.078, .68, pants, .1, .82, shoe());
  P.torso = cap(.172, .36, shirt); P.torso.position.y = 1.18; P.torso.scale.set(1.04, 1, .66); g.add(P.torso);
  P.armL = limb(.052, .44, shirt, -.24, 1.45, hand()); P.armR = limb(.052, .44, shirt, .24, 1.45, hand());
  P.head = new THREE.Mesh(new THREE.SphereGeometry(.114, 18, 14), PM(sk)); P.head.position.y = 1.665; P.head.castShadow = true; g.add(P.head);
  if (o.hat) { const hat = new THREE.Mesh(new THREE.SphereGeometry(.128, 18, 10, 0, Math.PI * 2, 0, Math.PI * .52), PM(o.hat)); hat.position.y = 1.685; hat.castShadow = true; g.add(hat);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(.158, .158, .014, 20), PM(o.hat)); brim.position.set(0, 1.69, .03); g.add(brim); }
  else { const hair = new THREE.Mesh(new THREE.SphereGeometry(.121, 18, 10, 0, Math.PI * 2, 0, Math.PI * .5), PM(HAIR[(people.length * 3) % HAIR.length])); hair.position.y = 1.672; hair.rotation.x = -.25; g.add(hair); }
  if (o.vest) [1.04, 1.3].forEach(y => { const st = new THREE.Mesh(new THREE.CylinderGeometry(.176, .176, .034, 20, 1, true), PM('#E9F2A2')); st.material.side = THREE.DoubleSide; st.position.y = y; st.scale.set(1.04, 1, .66); g.add(st); });
  scene.add(g);
  const p = { g, P, state: 'work', t: Math.random() * 6, ph: Math.random() * 6, wk: 1, path: null, speed: 1.5, yaw: 0, yawTo: 0, raise: 0, raiseTo: 0, wave: false, working: null, onArrive: null, role: o.role || 'operator',
    at(x, y) { g.position.set(x, 0, -y); return p; }, face(dx, dy) { p.yawTo = yawOf(dx, dy); return p; }, snap() { p.yaw = p.yawTo; g.rotation.y = p.yaw; return p; },
    go(pts, opt = {}) { p.path = pts.map(q => V(q[0], q[1], 0)); p.speed = opt.speed || 1.6; p.onArrive = opt.then || null; p.faceEnd = opt.face || null; return p; },
    head() { return g.position.clone().add(new THREE.Vector3(0, 1.98, 0)); }, remove() { scene.remove(g); const i = people.indexOf(p); if (i >= 0) people.splice(i, 1); } };
  people.push(p); return p;
}
function updatePeople(dt) {
  if (!dt) return; const k = Math.min(1, dt * 9);
  for (const p of people) { p.t += dt; const P = p.P; let leg = 0, aL = 0, aR = 0, lean = 0, nod = 0;
    if (p.path) {                                                       // walking along a path
      const tgt = p.path[0], dx = tgt.x - p.g.position.x, dz = tgt.z - p.g.position.z, dist = Math.hypot(dx, dz), step = p.speed * dt;
      if (dist <= step) { p.g.position.x = tgt.x; p.g.position.z = tgt.z; p.path.shift();
        if (!p.path.length) { p.path = null; if (p.faceEnd) p.yawTo = yawOf(p.faceEnd[0], p.faceEnd[1]); const f = p.onArrive; p.onArrive = null; f && f(); } }
      else { p.g.position.x += dx / dist * step; p.g.position.z += dz / dist * step; p.yawTo = Math.atan2(dx, dz); }
      p.ph += dt * p.speed * 4.6; leg = Math.sin(p.ph) * .56; aL = -leg * .75; aR = leg * .75; p.g.position.y = Math.abs(Math.sin(p.ph)) * .022; lean = .06;
      if (p.carry) { aL = aR = -1.15; }
    } else { p.g.position.y += (0 - p.g.position.y) * k;
      if (p.state === 'work') { const w = p.working ? p.working() : true; p.wk += ((w ? 1 : 0) - p.wk) * Math.min(1, dt * 4);
        aL = (-.98 + Math.sin(p.t * 3.2) * .2) * p.wk; aR = (-.98 + Math.sin(p.t * 3.2 + 1.9) * .2) * p.wk; lean = .09 * p.wk; nod = .16 * p.wk; }
      else if (p.state === 'talk') { aR = -.62 + Math.sin(p.t * 2.6) * .28; aL = -.12; nod = Math.sin(p.t * 3.1) * .07; }
      else if (p.state === 'point') { aR = -1.45; aL = -.1; }
      else if (p.state === 'carry') { aL = aR = -1.15; }
    }
    p.raise += (p.raiseTo - p.raise) * Math.min(1, dt * 6);              // a raised hand: calling for help, or reaching for the andon
    if (p.raise > .01) { aR = aR * (1 - p.raise) - 2.85 * p.raise; P.armR.rotation.z = (-.12 + (p.wave ? Math.sin(p.t * 7) * .2 : 0)) * p.raise; } else P.armR.rotation.z = 0;
    P.legL.rotation.x += (leg - P.legL.rotation.x) * k; P.legR.rotation.x += (-leg - P.legR.rotation.x) * k;
    P.armL.rotation.x += (aL - P.armL.rotation.x) * k; P.armR.rotation.x += (aR - P.armR.rotation.x) * k;
    P.torso.rotation.x += (lean - P.torso.rotation.x) * k; P.head.rotation.x += (nod - P.head.rotation.x) * k;
    let dy = p.yawTo - p.yaw; dy = ((dy + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; p.yaw += dy * Math.min(1, dt * 7); p.g.rotation.y = p.yaw;
  }
}
const ops = {};                                                          // the operator at each station
for (let n = 1; n <= 15; n++) { const s = ST[n], d = s.d, o = OPV[d.op], line = d.cell === 3;
  const home = line ? [d.pos[0], L.conveyor.y - .66] : [d.pos[0] + o[0] * .66, d.pos[1] + o[1] * .66];
  const p = makePerson({ shirt: n % 4 === 0 ? '#3B5B7E' : '#1D3557' }); p.home = home; p.n = n; p.at(home[0], home[1]).face(-o[0], -o[1]).snap();
  p.working = () => s.state === 'busy' && !S.freeze && !(S.lineStop && line); ops[n] = p; }
function opsReset() { for (const n in ops) { const p = ops[n], o = OPV[ST[n].d.op]; p.path = null; p.state = 'work'; p.raiseTo = 0; p.wave = false; p.at(p.home[0], p.home[1]).face(-o[0], -o[1]).snap(); } }

/* ------------------------------------------------------------------ a digital kanban screen at every station */
const tabs = {};
for (let n = 1; n <= 15; n++) { const d = ST[n].d, o = OPV[d.op], line = d.cell === 3, lp = line ? [-.62, .52, 1.5] : [-.5, -.02, 1.07];
  const tex = canvasTex(320, 200, g => { g.fillStyle = '#071320'; g.fillRect(0, 0, 320, 200); }); tex.flipY = true;
  const g = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(.3, .2, .018), PM('#15171A')), scr = new THREE.Mesh(new THREE.PlaneGeometry(.272, .172), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  body.castShadow = true; scr.position.z = .0095; g.add(body, scr);
  if (!line) { const foot = new THREE.Mesh(new THREE.BoxGeometry(.12, .02, .12), PM('#15171A')); foot.position.set(0, -.105, -.045); g.add(foot); }
  g.position.copy(local(d.pos, d.op, lp[0], lp[1], lp[2])); g.rotation.order = 'YXZ'; g.rotation.y = yawOf(o[0], o[1]); g.rotation.x = line ? 0 : -.38; scene.add(g); tabs[n] = { tex, g, key: '' }; }
const CARD_COL = { blue: '#2E6FC2', orange: '#F08A24', white: '#F4F4F0' }, KIND_SHORT = { blue: 'Speedster', orange: 'Trail SUV', white: 'Special order' };
function drawTablet(n) {
  const t = tabs[n], s = ST[n], { g } = t.tex.userData, W = 320, H = 200, id = 'STATION ' + n; let key;
  if (S.tab === 'glitch') key = 'g' + Math.floor(S.t * 3);
  else if (S.tab === 'cards') key = 'cards';
  else key = s.state + (s.car ? s.car.kind : '-') + (s.cell === 3);
  if (key === t.key) return; t.key = key;
  if (S.tab === 'glitch') { const rnd = a => a[Math.floor(Math.random() * a.length)];
    g.fillStyle = Math.random() < .5 ? '#3A0A0C' : '#12060A'; g.fillRect(0, 0, W, H); g.fillStyle = '#F0544F'; g.fillRect(0, 0, W, 34);
    g.fillStyle = '#fff'; g.textAlign = 'left'; g.font = `600 17px ${FONT_M}`; g.fillText('E-KANBAN  ' + rnd(['??', 'ST 0', 'ERR', '#' + Math.floor(Math.random() * 99)]), 12, 23);
    g.fillStyle = '#FFB3AF'; g.font = `700 44px ${FONT_D}`; g.fillText('BUILD ' + Math.floor(Math.random() * 97 + 3), 12, 92);
    g.font = `600 24px ${FONT_M}`; g.fillText(rnd(['MODEL ???', 'ORDER #88A2', 'x x x x x', 'SEQ INVALID', 'NULL NULL']), 12, 132); g.fillStyle = '#F0544F'; g.fillText('SIGNAL ERROR', 12, 176); }
  else if (S.tab === 'cards') { g.fillStyle = '#101317'; g.fillRect(0, 0, W, H); g.fillStyle = '#3A4350'; g.fillRect(0, 0, W, 34); g.fillStyle = '#C3CEDA'; g.textAlign = 'left'; g.font = `600 17px ${FONT_M}`; g.fillText('E-KANBAN · ' + id, 12, 23);
    g.fillStyle = '#F2B233'; g.font = `700 46px ${FONT_D}`; g.fillText('OFFLINE', 12, 100); g.fillStyle = '#E9EEF4'; g.font = `600 25px ${FONT_B}`; g.fillText('Use kanban cards', 12, 150); }
  else { const kind = s.car && s.cell === 3 ? s.car.kind : null, st = s.state;
    const big = st === 'busy' ? 'BUILD' : st === 'blocked' ? 'HOLD' : st === 'starved' ? 'WAIT' : st === 'stopped' ? 'STOP' : 'READY', col = st === 'busy' ? '#3FB68B' : st === 'stopped' ? '#F0544F' : st === 'idle' || st === 'done' ? '#C3CEDA' : '#F2B233';
    g.fillStyle = '#071320'; g.fillRect(0, 0, W, H); g.fillStyle = '#FF9B4D'; g.fillRect(0, 0, W, 34); g.fillStyle = '#1A0C02'; g.textAlign = 'left'; g.font = `600 17px ${FONT_M}`; g.fillText('E-KANBAN · ' + id, 12, 23);
    g.fillStyle = col; g.font = `800 56px ${FONT_D}`; g.fillText(big, 12, 100);
    g.fillStyle = kind ? CARD_COL[kind] : '#33414F'; g.fillRect(12, 122, 30, 42); g.fillStyle = '#E9EEF4'; g.font = `600 24px ${FONT_B}`;
    g.fillText(kind ? KIND_SHORT[kind] : s.cell === 3 ? 'Next order' : st === 'blocked' ? 'Supermarket full' : st === 'starved' ? 'Waiting for parts' : 'Sub-assembly', 54, 152); }
  t.tex.needsUpdate = true;
}

/* ------------------------------------------------------------------ small things the demos use: tweens, callouts, kanban cards */
const anims = [];
function tween(dur, fn, done) { anims.push({ t: 0, dur, fn, done }); }
function animsTick(dt) { for (let i = anims.length - 1; i >= 0; i--) { const a = anims[i]; a.t += dt; const k = Math.min(1, a.t / a.dur); a.fn(ease(k), k); if (k >= 1) { anims.splice(i, 1); a.done && a.done(); } } }
function callout(pos, fn) { const el = document.createElement('div'); el.className = 'tag'; tagBox.appendChild(el); const t = { el, pos, fn, last: '', demo: true, remove() { el.remove(); const i = tags.indexOf(t); if (i >= 0) tags.splice(i, 1); } }; tags.push(t); return t; }
const cardGeo = new THREE.BoxGeometry(.085, .125, .006);
function cardMesh(kind) { const m = new THREE.Mesh(cardGeo, new THREE.MeshStandardMaterial({ color: CARD_COL[kind] || kind, roughness: .55, emissive: CARD_COL[kind] || kind, emissiveIntensity: .18 })); m.castShadow = true; return m; }
function popIn(m, delay = 0) { m.scale.setScalar(.001); setTimeout(() => { if (m.parent) tween(.45, e => m.scale.setScalar(Math.max(.001, e * (1 + .25 * Math.sin(e * Math.PI))))); }, delay * 1000 / (window.__speed || 1)); }
function giveCard(c) { if (c.card) return; const m = cardMesh(c.kind); m.rotation.x = -Math.PI / 2; m.position.set(0, .135, 0); m.scale.setScalar(.8); c.mesh.add(m); c.card = m; }
const hjPos = i => V(L.heijunka.pos[0] + .3 - i * .1, L.heijunka.pos[1] + .066, 1.45);       // the seven slots on the front of the Heijunka box
function heijunkaCards(stagger) { return HEIJUNKA.map((k, i) => { const m = cardMesh(k); m.position.copy(hjPos(i)); m.rotation.y = Math.PI; scene.add(m); if (stagger) popIn(m, i * stagger); return m; }); }
function stationCards(stagger) { const out = []; for (let n = 1; n <= 15; n++) { const d = ST[n].d, o = OPV[d.op], line = d.cell === 3, lp = line ? [-.36, .52, 1.5] : [-.26, -.02, 1.06];
    const m = cardMesh(line ? HEIJUNKA[n % 7] : n < 6 ? 'blue' : 'orange'); m.position.copy(local(d.pos, d.op, lp[0], lp[1], lp[2])); m.rotation.order = 'YXZ'; m.rotation.y = yawOf(o[0], o[1]); m.rotation.x = line ? 0 : -.38; scene.add(m); popIn(m, (n - 1) * stagger); out.push(m); }
  return out; }

/* ------------------------------------------------------------------ the director: scripted demos you watch like a film */
const D = { on: false, id: null, cues: [], i: -1, t: 0, paused: false, switching: false, tmp: [], cue: [], fired: 0, to: 0 };
const cine = $('#cine'), fadeEl = $('#fade'), keep = o => (D.tmp.push(o), o), keepCue = o => (D.cue.push(o), o);
const lerp3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
function camAt(k) { const c = D.cues[D.i].cam; if (!c) return; const e = k * k * (3 - 2 * k), eye = lerp3(c.a, c.b || c.a, e), look = c.follow ? c.follow() : lerp3(c.la, c.lb || c.la, e);
  camera.position.copy(V(eye[0], eye[1], eye[2])); orbit.target.copy(V(look[0], look[1], look[2])); camera.lookAt(orbit.target); }
function paintCap() { const c = D.cues[D.i], n = D.cues.length - 1;
  $('#capK').textContent = (D.id === 'demoA' ? 'Scenario A · Supply chain disruption' : 'Scenario B · Cyber attack') + (c.end ? '' : ' · ' + (D.i + 1) + ' of ' + n);
  $('#capT').textContent = c.title; $('#capP').textContent = c.text || ''; const cap = $('#cap'); cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in');
  $('#endCard').classList.toggle('on', !!c.end); cap.classList.toggle('hide', !!c.end);
  if (c.end) $('#endCard').innerHTML = `<p class="kick">${D.id === 'demoA' ? 'Scenario A' : 'Scenario B'} · What you just saw</p><h2>${c.title}</h2><ul>${c.points.map(p => `<li>${p}</li>`).join('')}</ul>
    <div class="endbtns"><button type="button" class="primary" data-end="replay">Watch again</button><button type="button" data-end="try">Run it yourself</button><button type="button" data-end="other">${D.id === 'demoA' ? 'Scenario B demo' : 'Scenario A demo'}</button><button type="button" data-end="exit">Back to the lab</button></div>`; }
function cueGo(i, instant) { D.switching = true; clearTimeout(D.to); fadeEl.classList.add('on');
  D.to = setTimeout(() => { D.cue.forEach(o => o.remove()); D.cue = []; D.i = i; D.t = 0; D.fired = 0; const c = D.cues[i]; c.enter && c.enter(); paintCap(); camAt(0); D.switching = false; fadeEl.classList.remove('on'); }, instant ? 0 : 280); }
function cueDone(c) { const at = c.at || []; while (D.fired < at.length) at[D.fired++][1](); c.leave && c.leave(); }
function directorTick(dt) {
  if (!D.on || D.switching || D.paused) return; const c = D.cues[D.i]; D.t += dt;
  const at = c.at || []; while (D.fired < at.length && D.t >= at[D.fired][0]) at[D.fired++][1]();
  c.tick && c.tick(dt); camAt(Math.min(1, D.t / (c.camDur || c.dur || 8)));
  $('#capProg').style.transform = 'scaleX(' + (c.end ? 1 : Math.min(1, D.t / c.dur)).toFixed(3) + ')';
  if (c.end) { const a = D.t * .05 - 1.9, R = 25, H = 13; camera.position.set(12.6 + Math.cos(a) * R, H, -1 + Math.sin(a) * R * .8); orbit.target.set(12.6, .4, -1); camera.lookAt(orbit.target); return; }
  if ((D.t >= c.dur && (!c.until || c.until())) || D.t >= c.dur + (c.max || 16)) { cueDone(c); cueGo(D.i + 1); }
}
function demoNext() { if (!D.on || D.switching) return; const c = D.cues[D.i]; if (c.end) return;
  if (c.until) for (let i = 0; i < 900 && !c.until(); i++) { tick(.05); updatePeople(.05); animsTick(.05); c.tick && c.tick(.05); }      // let the plant catch up to where the story needs it
  cueDone(c); cueGo(D.i + 1); }
function startDemo(id) {
  stopDemo(); resetSim(); opsReset(); S.mode = id; Object.assign(D, { on: true, id, i: -1, t: 0, paused: false, tmp: [] }); D.cues = (id === 'demoA' ? cuesA : cuesB)();
  document.body.classList.add('demo'); $('#dPause').textContent = 'Pause'; resize(); orbit.enabled = false; fly = null; auto = null; if (walking) walk.unlock(); card.classList.remove('on'); cardKey = null;
  cueGo(0);
}
function stopDemo() { if (!D.on) return; D.on = false; clearTimeout(D.to); D.switching = false; fadeEl.classList.remove('on'); D.tmp.forEach(o => o.remove()); D.tmp = []; D.cue.forEach(o => o.remove()); D.cue = []; anims.length = 0;
  for (const c of S.cars) if (c.card) { c.mesh.remove(c.card); c.card = null; }
  opsReset(); document.body.classList.remove('demo'); $('#endCard').classList.remove('on'); resize(); orbit.enabled = true; }
$('#dPause').onclick = () => { D.paused = !D.paused; $('#dPause').textContent = D.paused ? 'Play' : 'Pause'; };
$('#dNext').onclick = demoNext; $('#dRestart').onclick = () => startDemo(D.id); $('#dExit').onclick = () => setMode('explore');
$('#endCard').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const k = b.dataset.end, id = D.id;
  if (k === 'replay') startDemo(id); else if (k === 'try') setMode(id === 'demoA' ? 'A' : 'B'); else if (k === 'other') setMode(id === 'demoA' ? 'demoB' : 'demoA'); else setMode('explore'); });
addEventListener('keydown', e => { if (!D.on) return; if (e.code === 'Space') { e.preventDefault(); $('#dPause').click(); } else if (e.code === 'ArrowRight') demoNext(); else if (e.code === 'Escape') setMode('explore'); });
const obj = m => ({ remove() { scene.remove(m); } });
const LEADER = { shirt: '#F26A1B', pants: '#2B3140', hat: '#F4F4F0', vest: true, role: 'leader' };
const s15 = L.stations['15'].pos, DOOR = L.west_path.door_x, WALK = (L.path.y[0] + L.path.y[1]) / 2;

/* ---------------- Scenario A: a late part stops the line */
function cuesA() {
  const X = { car: null, leader: null, runner: null, hold: null, cards: null }, op = ops[15], holdAt = [s15[0] - .92, L.conveyor.y - .78];
  S.noWhite = true;                                                      // one white order only: the one this story is about
  X.cards = heijunkaCards(0); X.cards.forEach(m => keep(obj(m)));
  const stand = new THREE.Group(), post = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .86, 10), PM('#8B9299')), top = new THREE.Mesh(new THREE.BoxGeometry(.4, .03, .32), PM('#C9302C')), base = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .03, 18), PM('#8B9299'));
  post.position.y = .43; top.position.y = .875; base.position.y = .015; stand.add(post, top, base); stand.position.copy(V(holdAt[0], holdAt[1], 0)); stand.traverse(o => { o.castShadow = true; }); scene.add(stand); keep(obj(stand));
  const pickWhite = () => { for (const n of [14, 13, 12, 11]) { const c = ST[n].car; if (c && !c.move) { setStage(c, c.stage, 'white'); c.id = ++carId; X.car = c; return; } } };
  return [
    { title: 'A normal shift at Tiger Motors', text: 'Fifteen operators build cars across three cells. Every station works to the same beat: one car every 5.2 seconds.', dur: 9,
      cam: { a: [0.5, -7.5, 9.5], b: [5.5, -8.5, 8.6], la: [10.5, 2.4, .8], lb: [12, 2.2, .8] } },
    { title: 'Nothing is built ahead of need', text: 'Each cell builds only when the next one pulls. The supermarkets between the cells hold just enough to keep the line moving.', dur: 8,
      cam: { a: [13.7, 4.9, 3.5], b: [13.7, 3.9, 3.1], la: [13.7, -.4, .9] } },
    { title: 'One part comes from outside', text: 'White-card orders need a special part. War Eagle Inc., a Tier 1 supplier, machines it and delivers it just in time to station 15.', dur: 8,
      cam: { a: [24.9, -.9, 2.7], b: [24.0, -1.1, 2.4], la: [20.6, -1.7, 1.3] },
      enter() { X.tech = keep(makePerson({ shirt: '#2E7D5B', role: 'tech' })); X.tech.at(21.35, -1.4).face(-1, 0).snap(); } },
    { title: 'Then CNC 1 faults', text: 'The special part for the next white order will not ship on time. On the assembly line, nobody knows yet.', dur: 7,
      cam: { a: [23.2, -2.6, 2.1], b: [22.6, -2.2, 1.9], la: [20.5, -1.5, 1.4] },
      enter() { S.cncDown = 1; pickWhite(); S.lampOv = { 11: 'g', 12: 'g', 13: 'g', 14: 'g', 15: 'g' }; X.tech.state = 'talk'; keepCue(callout(V(20, -1.4, 2.35), () => ['CNC 1', 'Fault', 'bad'])); } },
    { title: 'The white order reaches station 15', text: 'Its special part should already be waiting at the last station.', dur: 4, max: 30, until: () => ST[15].state === 'stopped',
      cam: { a: [-.5, .55, 2.15], b: [0, .75, 2.0], la: [s15[0], 2.15, 1.2] },
      enter() { if (!X.car) pickWhite(); } },
    { title: 'The part is not there', text: 'The operator cannot finish the car. No improvising, no passing it on. A hand goes up.', dur: 7,
      cam: { a: [0, .75, 2.0], b: [.5, .95, 1.9], la: [s15[0], 2.1, 1.3] },
      enter() { op.raiseTo = 1; op.wave = true; X.alert = keep(callout(() => op.head(), () => ['Station 15', 'Missing part', 'bad'])); } },
    { title: 'The operator pulls the andon', text: 'The light turns yellow: “I have a problem and I need help.” Anyone in the plant can see where, within seconds.', dur: 7,
      cam: { a: [.5, .95, 1.95], b: [.9, 1.15, 2.15], la: [2.5, 2.5, 1.9], lb: [2.2, 2.9, 2.45] },
      enter() { op.wave = false; }, at: [[1.6, () => { S.lampOv[15] = 'y'; }], [3.2, () => { op.raiseTo = 0; }]] },
    { title: 'The cell leader responds', text: 'A yellow light is a call, and the cell leader answers it. The job is to help the operator, not to find someone to blame.', dur: 5, max: 12, until: () => X.leader && !X.leader.path,
      cam: { a: [8.6, .95, 2.7], b: [7.2, .95, 2.3], follow: () => { const p = X.leader.g.position; return [p.x, -p.z, 1.25]; } },
      enter() { X.leader = keep(makePerson(LEADER)); X.leader.at(DOOR, 6.4).face(0, -1).snap().go([[DOOR, WALK], [s15[0] + .75, WALK], [s15[0] + .85, 1.5]], { speed: 2.5, face: [-1, .35] });
        X.lt = keep(callout(() => X.leader.head(), () => ['Cell leader', '', ''])); } },
    { title: 'Go and see', text: 'What is missing, and since when? They check together: no part at the station, and none on its way. The line cannot continue, so the light goes red.', dur: 8,
      cam: { a: [4.3, .2, 1.85], b: [3.7, .22, 1.72], la: [3.35, 1.8, 1.35] },
      enter() { X.leader.state = 'talk'; op.state = 'talk'; op.face(1, -.35); X.alert.remove(); }, at: [[4.2, () => { S.lampOv = { 15: 'r' }; }]] },
    { title: 'The whole plant waits, on purpose', text: 'With the last station stopped, Supermarket 2 fills. Cell 2 has no signal to build, so it stops. Then Cell 1. No pile of unfinished cars, and no hidden problem.', dur: 8, max: 10,
      until: () => sm[2].cars.length >= SM_MAX,
      cam: { a: [13.7, 3.6, 5.6], b: [13.7, 2.6, 5.0], la: [13.7, -1.4, .8] },
      enter() { S.rate = 4; keepCue(callout(local(L.supermarkets['2'].pos, '+x', 0, 0, 1.5), () => ['Supermarket 2', sm[2].cars.length + ' / ' + SM_MAX, sm[2].cars.length >= SM_MAX ? 'warn' : '']));
        keepCue(callout(local(L.supermarkets['1'].pos, '-x', 0, 0, 1.5), () => ['Supermarket 1', sm[1].cars.length + ' / ' + SM_MAX, sm[1].cars.length >= SM_MAX ? 'warn' : ''])); },
      leave() { S.rate = 1; } },
    { title: 'Find the cause at the source', text: 'One call to War Eagle Inc. gives the answer: CNC 1 is down, and the part is at least an hour away.', dur: 8,
      cam: { a: [23.4, -3.0, 2.2], b: [22.9, -2.5, 2.0], la: [20.6, -1.5, 1.35] }, enter() { X.tech.state = 'point'; keepCue(callout(V(20, -1.4, 2.35), () => ['CNC 1', 'Fault · part delayed', 'bad'])); } },
    { title: 'Countermeasure 1: change the sequence', text: 'At the Heijunka box, the leader moves the white cards to the back. Blue and orange orders go first, so the line can run while the part is late.', dur: 6, max: 12,
      until: () => !X.leader.path,
      cam: { a: [11.7, 2.1, 2.15], b: [11.1, 1.9, 1.95], la: [L.heijunka.pos[0], .4, 1.42] },
      enter() { op.state = 'work'; op.face(0, 1); X.leader.state = 'point'; X.leader.go([[s15[0] + .75, WALK], [L.heijunka.pos[0], WALK]], { speed: 2.6, face: [0, -1],
        then: () => { const w = X.cards[3], last = X.cards[6], a = w.position.clone(), b = hjPos(6), c0 = [4, 5, 6].map(i => X.cards[i].position.clone());   // the white card goes to the back, the others move up
          tween(1.2, e => { w.position.lerpVectors(a, b, e); w.position.y = a.y + Math.sin(e * Math.PI) * .12; [4, 5, 6].forEach((i, j) => X.cards[i].position.lerpVectors(c0[j], hjPos(i - 1), e)); }); } }); } },
    { title: 'Restart the line', text: 'The white car is set aside on a marked hold spot. The andon goes back to green and the conveyor runs again on blue and orange orders.', dur: 9,
      cam: { a: [-.2, .6, 2.2], b: [.3, .8, 2.0], la: [s15[0] - .4, 2.0, 1.1] },
      enter() { const c = X.car; if (c && ST[15].car === c) { ST[15].car = null; ST[15].state = 'idle'; send(c, V(holdAt[0], holdAt[1], .9), Math.PI / 2, 1.1, .32, null); }
        op.raiseTo = 1; setTimeout(() => { op.raiseTo = 0; }, 900); S.lampOv = {};
        keep(callout(V(holdAt[0], holdAt[1], 1.25), () => ['On hold', 'Waiting for the part', 'warn'])); } },
    { title: 'Countermeasure 2: fix the supply', text: 'War Eagle Inc. moves the job to CNC 5 and walks the part over. Just in time becomes a little late, but the customer order is saved.', dur: 5, max: 14,
      until: () => X.runner && !X.runner.path,
      cam: { a: [17.5, 3.4, 5.6], b: [6.5, 3.6, 4.6], follow: () => { const p = X.runner.g.position; return [p.x, -p.z, 1.1]; } }, camDur: 7.5,
      enter() { S.cncDown = 0; S.expedite = true; const d0 = (L.wareagle.door[0] + L.wareagle.door[1]) / 2;
        X.runner = keep(makePerson({ shirt: '#2E7D5B', role: 'runner' })); X.runner.carry = true; const box = new THREE.Mesh(new THREE.BoxGeometry(.2, .13, .15), new THREE.MeshStandardMaterial({ color: 0xFF9B4D, roughness: .4, emissive: 0xE87722, emissiveIntensity: .6 })); box.position.set(0, 1.08, .34); box.castShadow = true; X.runner.g.add(box); X.box = box;
        X.runner.at(d0, -.5).face(0, 1).snap().go([[d0, WALK], [s15[0] + 1.5, WALK], [s15[0] + .15, 1.35]], { speed: 3.1, face: [-.4, 1] });
        keep(callout(() => X.runner.head(), () => ['War Eagle Inc.', 'Special part', ''])); } },
    { title: 'The white order ships', text: 'The part goes on, the car is finished, and it joins the others in finished goods. The line lost a few cars of output, not a shift.', dur: 6, max: 20,
      until: () => X.done,
      cam: { a: [-.3, .6, 2.15], b: [.3, .85, 1.95], la: [s15[0] - .7, 2.2, 1.1] },
      enter() { const c = X.car; if (X.box) X.runner.g.remove(X.box); X.runner.carry = false; X.runner.state = 'talk'; X.leader.go([[s15[0] + 1.6, WALK]], { speed: 1.8, face: [-1, .3] }); if (c) { S.jit[c.id] = true; S.reserve15 = true; } else X.done = true; },
      tick() { const c = X.car; if (!c || X.done) return;
        if (S.reserve15 && !ST[15].car && !incoming(15) && !c.move) { S.reserve15 = false; c.to = ST[15]; send(c, ST[15].spot, ST[15].yaw, .9, .3, () => arrive(c, ST[15])); }
        if (!S.reserve15 && ST[15].car !== c && !c.to && !S.cars.includes(c) || S.fgCars.includes(c)) X.done = true; },
      leave() { S.reserve15 = false; } },
    { end: true, title: 'What kept a late part from becoming a lost day', dur: 1e9,
      points: ['<b>Andon.</b> The problem was visible to everyone within seconds.', '<b>Pull.</b> The plant stopped building what it could not use.', '<b>Heijunka.</b> The sequence changed, so the line could keep running.', '<b>Supplier response.</b> The cause was fixed at its source, not worked around.'] },
  ];
}

/* ---------------- Scenario B: a cyber attack on the kanban screens */
function cuesB() {
  const X = { leaders: [], cards: [] }, it = keep(makePerson({ shirt: '#7FA8D9', role: 'it' })); it.at(L.plc.desks[1][0] + .66, L.plc.desks[1][1]).face(-1, 0).snap();
  const allOps = fn => { for (let n = 1; n <= 15; n++) fn(ops[n], n); };
  return [
    { title: 'A connected plant', text: 'Every station has a screen. An e-kanban system tells each operator what to build next, and the overhead dashboards show the whole plant.', dur: 9,
      cam: { a: [23, -7.5, 9.2], b: [18.5, -8.5, 8.6], la: [12.5, 1.6, .8], lb: [11.5, 1.8, .8] } },
    { title: 'The signal is digital', text: 'The screen at station 7 says what to build, and when. It is fast and accurate, and it is one more thing that can be attacked.', dur: 8,
      cam: { a: [14.15, -1.5, 1.72], b: [14.4, -1.7, 1.62], la: [15.42, -2.6, 1.1] } },
    { title: '2:14 pm. Someone gets in', text: 'From outside the plant, an attacker reaches the e-kanban server and starts sending orders that nobody planned.', dur: 8,
      cam: { a: [-4.1, 4.4, 2.0], b: [-3.7, 4.8, 1.85], la: [-1.9, 7.1, 1.35] }, at: [[3.4, () => { S.tab = 'glitch'; keepCue(callout(V(L.plc.cabinet[0] + 1.1, L.plc.cabinet[1] - .3, 2.1), () => ['Kanban server', 'Intrusion', 'bad'])); }]] },
    { title: 'The screens stop making sense', text: 'Build 97 of a model that does not exist. Operators are trained for this: if you cannot trust the signal, stop and call. Fifteen andons go yellow.', dur: 9,
      cam: { a: [12.9, .9, 3.5], b: [11.6, .9, 3.0], la: [6.5, 2.5, 1.35] },
      at: [[.8, () => allOps((p, n) => setTimeout(() => { if (D.on) { p.raiseTo = 1; p.wave = true; S.lampOv[n] = 'y'; } }, ((15 - n) % 15) * 170 / (window.__speed || 1)))], [2.2, () => { S.freeze = true; }]] },
    { title: 'Stop. Call. Wait.', text: 'Nobody builds from a screen they do not trust. A wrong car built fast is still a wrong car.', dur: 7,
      cam: { a: [9.2, .95, 1.95], b: [8.85, 1.1, 1.82], la: [7.8, 2.75, 1.45] },
      enter() { keepCue(callout(() => ops[12].head(), () => ['Station 12', 'Signal not trusted', 'bad'])); } },
    { title: 'Three cell leaders, one minute', text: 'The leaders arrive fast. Their first decision: the screens are off limits until someone proves they are clean.', dur: 6, max: 12, until: () => X.leaders[2] && !X.leaders[2].path,
      cam: { a: [-.55, .35, 2.5], b: [1.2, .3, 2.25], follow: () => { const q = X.leaders[2].g.position; return [q.x, -q.z, 1.3]; } },
      enter() { const dest = [[[DOOR, WALK], [13.7, WALK], [13.7, 4.5]], [[DOOR, WALK], [13.7, WALK], [13.7, -2.3]], [[DOOR, WALK], [6.6, WALK]]];
        dest.forEach((path, i) => { const p = keep(makePerson(LEADER)); p.at(DOOR, 6.9 - i * 1.0).face(0, -1).snap().go(path, { speed: 2.5, face: i === 0 ? [0, 1] : i === 1 ? [0, -1] : [0, 1] }); p.state = 'talk'; X.leaders.push(p);
          keep(callout(() => p.head(), () => ['Cell ' + (i + 1) + ' leader', '', ''])); }); } },
    { title: 'Cut the connection', text: 'IT pulls the kanban server off the plant network. The station screens go dark on purpose. The attacker is now talking to nobody.', dur: 8,
      cam: { a: [-1.5, 6.9, 2.7], b: [-1.9, 6.5, 2.45], la: [-3.5, 5.0, 1.1] }, enter() { it.state = 'work'; },
      at: [[3, () => { S.tab = 'cards'; S.isolated = true; allOps(p => { p.wave = false; }); }]] },
    { title: 'Back to cards', text: 'The plant was designed to run on paper kanban, and the cards are still in the drawer. A leader loads the Heijunka box: this is the build sequence now.', dur: 7, max: 12,
      until: () => !X.leaders[2].path && X.cards.length,
      cam: { a: [11.7, 2.1, 2.15], b: [11.1, 1.9, 1.95], la: [L.heijunka.pos[0], .4, 1.42] },
      enter() { X.leaders[2].state = 'point'; X.leaders[2].go([[L.heijunka.pos[0], WALK]], { speed: 2.4, face: [0, -1], then: () => { X.cards = heijunkaCards(.32); X.cards.forEach(m => keep(obj(m))); } }); } },
    { title: 'Every station gets its signal back', text: 'A card at each station, and an empty space in the supermarket as the order to build. Hands go down, andons go green, and the cells start again.', dur: 9,
      cam: { a: [13.7, 1.9, 4.7], b: [13.7, .9, 4.3], la: [13.7, -2.6, .9] },
      enter() { stationCards(.16).forEach(m => keep(obj(m))); },
      at: [[2.8, () => { allOps(p => { p.raiseTo = 0; }); S.lampOv = {}; S.freeze = false; S.cardsOn = true; S.manualCards = true; S.lastLaunch = S.t - TAKT; }]] },
    { title: 'Slower to manage, much harder to attack', text: 'Cards now travel with the cars, and leaders carry them back by hand. Output is close to plan, and every order is one a person can check.', dur: 9,
      cam: { a: [11.8, .9, 2.7], b: [9.0, .9, 2.45], la: [6.5, 2.45, 1.0], lb: [5.2, 2.45, 1.0] } },
    { title: 'Restore, verify, reconnect', text: 'The server is rebuilt from a clean backup and checked against the floor, station by station, before any screen is trusted again.', dur: 8,
      cam: { a: [-4.1, 4.4, 2.0], b: [-3.7, 4.8, 1.85], la: [-1.9, 7.1, 1.35] }, at: [[4, () => { S.tab = 'normal'; S.isolated = false; }]] },
    { end: true, title: 'Why the plant kept building', dur: 1e9,
      points: ['<b>People.</b> Operators were trained to stop on a signal they could not trust.', '<b>Leadership.</b> Cell leaders decided in minutes, at the line.', '<b>A manual fallback.</b> Paper kanban already existed, and everyone knew how to use it.', '<b>IT discipline.</b> Isolate first, restore second, verify against the floor before reconnecting.'] },
  ];
}

/* ------------------------------------------------------------------ the opening: a slow orbit that stops when you click */
let auto = reduce ? null : { t: 0, a0: -2.25 };
function autoTick(dt) { auto.t += dt; const k = Math.min(1, auto.t / 6.5), e = 1 - Math.pow(1 - k, 3), a = auto.a0 + auto.t * .045 + e * .35, R = 40 - 15 * e, H = 27 - 13.5 * e;
  orbit.target.set(12.6, .4, -1); camera.position.set(12.6 + Math.cos(a) * R, H, -1 + Math.sin(a) * R * .8); camera.lookAt(orbit.target); }
addEventListener('pointerdown', () => { if (auto) { auto = null; orbit.update(); } }, true);
addEventListener('wheel', () => { auto = null; }, { capture: true, passive: true });
addEventListener('keydown', () => { auto = null; });

/* ------------------------------------------------------------------ run */
resetSim(); paintPanel(); goTo('overview', true); if (!reduce) { auto = { t: 0, a0: -2.25 }; autoTick(0); }
document.body.classList.add('intro'); setTimeout(() => document.body.classList.remove('intro'), reduce ? 0 : 2600);
$('#loading').classList.add('gone'); $('#ver').textContent = 'model v' + L.version + ' · preview';
let last = performance.now(), uiT = 0;
function frame(now) {
  if (window.__capturing) { last = now; requestAnimationFrame(frame); return; }   // a recording drives the frames itself
  const sp = window.__speed || 1, dt = Math.min(.05, (now - last) / 1000) * sp; last = now;
  const sim = D.on && (D.paused || D.switching) ? 0 : dt;              // a paused demo pauses the plant and the people too
  for (let i = 0; i < S.rate; i++) tick(sim);
  visuals(dt); narrate(); updatePeople(sim); animsTick(sim);
  if (D.on) directorTick(sim);
  else if (auto) autoTick(dt);
  else { if (fly) { fly.t += dt / 1.5; const k = ease(Math.min(1, fly.t)); camera.position.lerpVectors(fly.a, fly.b, k); orbit.target.lerpVectors(fly.ta, fly.tb, k); if (fly.t >= 1) fly = null; }
    if (walking) walkStep(dt); else if (orbit.enabled) orbit.update(); }
  const above = camera.position.y > L.ceiling - .2;                     // looking in from above: lift the roof off
  ['ceiling', 'ceiling_lights', 'walls_outer'].forEach(n => { if (N[n]) N[n].visible = !above; });
  ['tv_cell1', 'tv_cell2', 'tv_cell3'].forEach(n => { if (N[n]) N[n].visible = true; });
  screenT += dt; if (screenT > .5) { screenT = 0; paintScreens(); }
  uiT += dt; if (uiT > .4) { uiT = 0; const k = $('#kpis'); if (k) k.outerHTML = kpiHtml(); const t = $('#ttd'); if (t) t.textContent = fmt(S.t - S.attackAt); if (cardKey) paintCard(); }
  paintTags(); renderer.render(scene, camera); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__lab = { S, ST, sm, L, goTo, setMode, startAttack, camera, orbit, N, openCard, believed, lampOf, D, people, ops, demoNext,
  step: sec => { for (let i = 0; i < sec * 20; i++) { tick(.05); narrate(); } },
  /* one frame of a recording (used to make the home page's preview clip): advance the plant by dt, put the camera at eye looking at look */
  shot: (dt, eye, look) => { window.__capturing = true; tick(dt); visuals(dt); camera.position.set(eye[0], eye[2], -eye[1]); orbit.target.set(look[0], look[2], -look[1]); camera.lookAt(orbit.target);
    const above = camera.position.y > L.ceiling - .2; ['ceiling', 'ceiling_lights', 'walls_outer'].forEach(n => { if (N[n]) N[n].visible = !above; });
    screenT += dt; if (screenT > .5) { screenT = 0; paintScreens(); } renderer.render(scene, camera); } };   // for testing
