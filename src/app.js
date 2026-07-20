import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, get, update, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBnmd0GcbVIFYT2aivcRpppt1h1_XX0XFY",
  authDomain: "stadtlandfluss-e5c2b.firebaseapp.com",
  projectId: "stadtlandfluss-e5c2b",
  storageBucket: "stadtlandfluss-e5c2b.firebasestorage.app",
  messagingSenderId: "84856664843",
  appId: "1:84856664843:web:47d586715de95b67a0280e",
  databaseURL: "https://stadtlandfluss-e5c2b-default-rtdb.firebaseio.com"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const GAMES = {
  slf: {
    id:"slf",
    name:"Stadt Land Fluss",
    titleHtml:'Stadt<span class="slash">/</span>Land<span class="slash">/</span>Fluss',
    enabled:true
  },
  connect4: {
    id:"connect4",
    name:"Vier gewinnt",
    titleHtml:"Vier gewinnt",
    enabled:true
  },
  battleship: {
    id:"battleship",
    name:"Schiffe versenken",
    titleHtml:"Schiffe versenken",
    enabled:true
  },
  kniffel: {
    id:"kniffel",
    name:"Kniffel",
    titleHtml:"Kniffel",
    enabled:true
  },
  drawing: {
    id:"drawing",
    name:"Montagsmaler",
    titleHtml:"Montagsmaler",
    enabled:true
  },
  maumau: {
    id:"maumau",
    name:"Mau Mau",
    titleHtml:"Mau Mau",
    enabled:true
  }
};
let selectedGame="slf";
let currentScreen="home";
const SELECTED_GAME_SESSION_KEY="slf_game";
const PLAYER_AVATAR_COLORS = [
  "#2563eb", "#dc2626", "#059669", "#7c3aed",
  "#ea580c", "#0891b2", "#be123c", "#4f46e5",
  "#0f766e", "#9333ea", "#b45309", "#64748b"
];
function validGameId(gameId){
  return (gameId&&GAMES[gameId]?.enabled)?gameId:"slf";
}

const DEFAULT_CATS = ["Stadt","Land","Fluss","Tier","Beruf"];
const CAT_SUGGESTIONS = [
  "Pflanze","Essen & Trinken","Film","Sportart","Körperteil",
  "Farbe","Auto-Marke","Kleidung","Möbelstück","Werkzeug",
  "Instrument","Videospiel","Schauspieler","Buch","Gemüse",
  "Obst","Insekt","Berühmte Person","Sportler","Marke",
  "Insel","Hobby","Schulfach","Haustier","Wildtier",
  "Kündigungsgrund","Todesursache","Outdoor Aktivität","Mag ich nicht","Name",
  "Beruf","Mädchenname","Jungenname","Urlaubsziel","Gehört in den Koffer",
  "Obst oder Gemüse","Etwas Grünes","Etwas Blaues","Schimpfwort",
];

const ALL_LETTERS = "ABCDEFGHIKLMNOPRSTW".split("");
const LETTER_REVEAL_MS = 3000;
const BATTLESHIP_SHIPS = [5,4,3,3,2];
const KNIFFEL_CATEGORIES = [
  {id:"ones", name:"Einser", section:"Oben"},
  {id:"twos", name:"Zweier", section:"Oben"},
  {id:"threes", name:"Dreier", section:"Oben"},
  {id:"fours", name:"Vierer", section:"Oben"},
  {id:"fives", name:"Fünfer", section:"Oben"},
  {id:"sixes", name:"Sechser", section:"Oben"},
  {id:"threeKind", name:"Dreierpasch", section:"Unten"},
  {id:"fourKind", name:"Viererpasch", section:"Unten"},
  {id:"fullHouse", name:"Full House", section:"Unten"},
  {id:"smallStraight", name:"Kleine Straße", section:"Unten"},
  {id:"largeStraight", name:"Große Straße", section:"Unten"},
  {id:"kniffel", name:"Kniffel", section:"Unten"},
  {id:"chance", name:"Chance", section:"Unten"}
];
const KNIFFEL_MAX_PLAYERS = 8;
const KNIFFEL_UPPER_IDS = ["ones","twos","threes","fours","fives","sixes"];
const KNIFFEL_SCORE_LIMITS = {
  ones:5, twos:10, threes:15, fours:20, fives:25, sixes:30,
  threeKind:30, fourKind:30, fullHouse:25, smallStraight:30,
  largeStraight:40, kniffel:50, chance:30
};
const KNIFFEL_SCORE_TEST_CASES = [
  {cat:"ones", dice:[1,1,1,2,3], expected:3},
  {cat:"twos", dice:[2,2,3,4,5], expected:4},
  {cat:"sixes", dice:[6,6,6,6,1], expected:24},
  {cat:"threeKind", dice:[1,1,1,2,3], expected:8},
  {cat:"threeKind", dice:[1,1,2,2,3], expected:0},
  {cat:"fourKind", dice:[2,2,2,2,5], expected:13},
  {cat:"fourKind", dice:[2,2,2,5,5], expected:0},
  {cat:"fullHouse", dice:[3,3,3,5,5], expected:25},
  {cat:"fullHouse", dice:[6,6,6,6,6], expected:0},
  {cat:"smallStraight", dice:[1,2,3,4,6], expected:30},
  {cat:"smallStraight", dice:[1,2,2,3,4], expected:30},
  {cat:"smallStraight", dice:[1,2,3,5,6], expected:0},
  {cat:"largeStraight", dice:[2,3,4,5,6], expected:40},
  {cat:"largeStraight", dice:[1,2,3,4,6], expected:0},
  {cat:"kniffel", dice:[6,6,6,6,6], expected:50},
  {cat:"kniffel", dice:[6,6,6,6,5], expected:0},
  {cat:"chance", dice:[1,3,4,5,6], expected:19},
  {cat:"chance", dice:[0,3,4,5,6], expected:0}
];
const DRAWING_MIN_PLAYERS = 2;
const DRAWING_MAX_PLAYERS = 12;
const DRAWING_DEFAULT_DURATION = 90;
const DRAWING_TIMER_PRESETS = [60,90,120,180];
const DRAWING_COLORS = [
  {name:"Schwarz", hex:"#343a40"},
  {name:"Rot", hex:"#ef4444"},
  {name:"Blau", hex:"#339af0"},
  {name:"Grün", hex:"#22c55e"},
  {name:"Gelb", hex:"#facc15"},
  {name:"Lila", hex:"#8b5cf6"}
];
const DRAWING_WIDTHS = [
  {label:"Dünn", width:3},
  {label:"Mittel", width:5},
  {label:"Dick", width:9}
];
const DRAWING_ERASER_WIDTH = 18;
const DRAWING_WORD_PACKS = {
  easy: [
    "Haus","Baum","Katze","Hund","Auto","Sonne","Mond","Stern","Pizza","Schiff",
    "Blume","Ball","Tasse","Buch","Stuhl","Tisch","Apfel","Banane","Bett","Tür",
    "Schuh","Fisch","Vogel","Herz","Kerze","Uhr","Lampe","Brille","Krone","Schlüssel",
    "Maus","Käse","Wolke","Regen","Schnee","Eis","Mütze","Hut","Jacke","Hose",
    "Löffel","Gabel","Topf","Kuchen","Brot","Milch","Ei","Biene","Schaf","Pferd"
  ],
  mixed: [
    "Fahrrad","Schule","Rakete","Regenschirm","Schneemann","Roboter","Drache","Fußball","Gitarre","Kamera",
    "Burg","Zahnbürste","Elefant","Pinguin","Torte","Flugzeug","Koffer","Feuerwehr","Krokodil","Geschenk",
    "Zirkus","Zauberer","Krankenhaus","Supermarkt","Polizei","Bahnhof","Spielplatz","Computer","Mikrofon","Schokolade",
    "Rucksack","Kopfhörer","Waschmaschine","Briefkasten","Bücherei","Schwimmbad","Dinosaurier","Hubschrauber","Kaktus","Einhorn",
    "Taschenrechner","Sonnenbrille","Handschuh","Wasserflasche","Pfannkuchen","Roller","Skateboard","Leuchtturm","Bauernhof","Aquarium"
  ],
  hard: [
    "Stromausfall","Geburtstagsfeier","Schatzkarte","Zeitmaschine","Weltreise","Hausaufgaben","Geheimagent","Drachenhöhle","Schneeballschlacht","Wasserschlacht",
    "Kopfschmerzen","Urlaubsfoto","Piratenschiff","Mondlandung","Dschungelcamp","Küchenunfall","Verkehrsstau","Lagerfeuer","Fernbedienung","Taschenlampe",
    "Zahnarztbesuch","Gewitterwolke","Flaschenpost","Klettergerüst","Eisverkäufer","Schulbus","Monstertruck","Zaubertrick","Kinoabend","Schlafwandler",
    "Schneckenrennen","Unterwasserwelt","Flughafenkontrolle","Gebrochener Arm","Verlorener Schlüssel","Spukschloss","Wackelzahn","Doppelgänger","Zeitungsartikel","Rettungsboot",
    "Drachensteigen","Müllabfuhr","Vulkanausbruch","Geisterbahn","Taucherausrüstung","Schokoladenbrunnen","Gummistiefel","Sternschnuppe","Marionette","Labyrinth"
  ]
};
const DRAWING_WORD_MODE_LABELS = { easy:"Einfach", mixed:"Gemischt", hard:"Schwer" };
const DRAWING_WORDS = [...new Set(Object.values(DRAWING_WORD_PACKS).flat())];
const MAUMAU_MIN_PLAYERS = 2;
const MAUMAU_MAX_PLAYERS = 8;
const MAUMAU_COLORS = ["red","yellow","green","blue"];
const MAUMAU_COLOR_LABELS = {red:"Rot",yellow:"Gelb",green:"Grün",blue:"Blau"};
const MAUMAU_COLOR_DOTS = {red:"🔴",yellow:"🟡",green:"🟢",blue:"🔵"};
const MAUMAU_VALUES = ["0","1","2","3","4","5","6","7","8","9","skip","reverse","draw2"];
const MAUMAU_SPECIAL_LABELS = {skip:"Aussetzen",reverse:"Richtung",draw2:"+2",wild:"Farbwahl"};
const ROOM_EXPIRY_MS = 24*60*60*1000;
const PLAYER_STALE_MS = 90*1000; // Spieler bleiben sichtbar; nur Online-Status/aktive Runden nutzen diesen Timeout
const TIMER_PRESETS = [0,60,90,120,180];
const ROUND_PRESETS = [0,3,5,8,10];
const COLLECTING_MS = 3500; // Legacy-Fallback
const STOPPING_MS = 900; // technischer Auto-Flush nach STOPP/Timer, ohne Nutzer-Bestätigung

let myName="", myRoom="";
let myId = "p_"+Math.random().toString(36).slice(2,10);
let isHost=false, gameState=null, submitted=false, submitting=false, leavingRoom=false;
let localAnswers={}, localBuzzerCountdown=null;
let liveSaveRunning=false, liveSaveQueued=false, finalFlushed=false, finalFlushPromise=null;
let resultActionMap={};
let lobbyEditorOpen=false;
let connect4LastAnimatedMoveKey=null;
let battleshipLocalRound=null, battleshipPlacedShips=[], battleshipOrientation="h", battleshipSelectedShipId="s0";
let battleshipDragging=false, battleshipDragCell=null, battleshipDragShipId=null, battleshipDragOffset=0, battleshipDragMoved=false, battleshipSuppressClickUntil=0, battleshipSuppressClickShipId=null;
let heartbeatInterval=null, roomListener=null;
let roundTimerInterval=null, roundTimerSecondsLeft=0;
let letterRevealTimer=null;
let collectingTimerInterval=null, stoppingTimerInterval=null;
let typingTimeout=null;
let prevBuzzerValue=null;
let kniffelRollTimer=null;
let drawingToolColor = DRAWING_COLORS.some(c=>c.hex===localStorage.getItem("drawing_color")) ? localStorage.getItem("drawing_color") : "#343a40";
let drawingToolWidth = DRAWING_WIDTHS.some(w=>w.width===Number(localStorage.getItem("drawing_width"))) ? Number(localStorage.getItem("drawing_width")) : 5;
let drawingToolMode = "pen";
let drawingActiveStrokeId=null, drawingActiveStroke=null, drawingPendingStrokes={}, drawingSyncTimer=null, drawingTickTimer=null, drawingTimerInterval=null;
let mauMauPendingWildIndex=null, mauMauLastAnimatedTopId=null;
let syncedPhase=null; // tracks last rendered phase to detect real transitions

let sfxVolume  = parseFloat(localStorage.getItem("slf_sfx_vol")  ?? "0.7");
let musicVolume= parseFloat(localStorage.getItem("slf_music_vol") ?? "0.45");

const roomRef   = () => ref(db,`rooms/${myRoom}`);
const playerRef = () => ref(db,`rooms/${myRoom}/players/${myId}`);

// ─── AUDIO ENGINE ───────────────────────────────────────────────
let audioCtx = null;
function getAudioCtx(){
  if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==='suspended') audioCtx.resume().catch(()=>{});
  return audioCtx;
}
function playTone(type, freq, duration, gain=0.3, delay=0){
  if(sfxVolume<=0) return;
  try{
    const ctx=getAudioCtx();
    const osc=ctx.createOscillator();
    const g=ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type=type; osc.frequency.setValueAtTime(freq, ctx.currentTime+delay);
    g.gain.setValueAtTime(0, ctx.currentTime+delay);
    g.gain.linearRampToValueAtTime(gain*sfxVolume, ctx.currentTime+delay+0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+delay+duration);
    osc.start(ctx.currentTime+delay);
    osc.stop(ctx.currentTime+delay+duration+0.05);
  }catch(e){}
}
function playSoundBuzzer(){
  playTone('square',880,0.08,0.5,0);
  playTone('square',660,0.08,0.5,0.1);
  playTone('square',440,0.18,0.55,0.2);
}
function playSoundRoundStart(){
  playTone('sine',523,0.12,0.35,0);
  playTone('sine',659,0.12,0.35,0.13);
  playTone('sine',784,0.18,0.4,0.26);
}
function playSoundSubmit(){
  playTone('sine',880,0.08,0.28,0);
  playTone('sine',1108,0.1,0.2,0.1);
}
function playSoundTimerUrgent(){
  playTone('square',330,0.06,0.2,0);
}
function playSoundGameOver(){
  const notes=[523,659,784,1047];
  notes.forEach((f,i)=>playTone('sine',f,0.3,0.4,i*0.18));
  setTimeout(()=>{
    playTone('sine',784,0.05,0.3,0);
    playTone('sine',988,0.05,0.3,0.08);
    playTone('sine',1175,0.5,0.4,0.16);
  },notes.length*180);
}

// ── MUSIC ENGINE ──
let musicGain=null, musicNodes=[], musicPlaying=false, musicPhase=null;
function getMusicGain(){
  const ctx=getAudioCtx();
  if(!musicGain){ musicGain=ctx.createGain(); musicGain.connect(ctx.destination); }
  musicGain.gain.setTargetAtTime(musicVolume, ctx.currentTime, 0.1);
  return musicGain;
}
function stopMusic(fadeSecs=1.2){
  if(!musicGain) return;
  const ctx=getAudioCtx();
  musicGain.gain.setTargetAtTime(0, ctx.currentTime, fadeSecs/4);
  setTimeout(()=>{
    musicNodes.forEach(n=>{ try{ n.stop(); }catch(e){} });
    musicNodes=[];
    musicPlaying=false;
    musicPhase=null;
  }, fadeSecs*1000+200);
}
function playLobbyMusic(){
  if(musicPhase==="lobby") return;
  stopMusic(0.6);
  musicPhase="lobby";
  if(musicVolume<=0) return;
  setTimeout(()=>{ if(musicPhase!=="lobby") return; _startLobbyLoop(); }, 700);
}
function _startLobbyLoop(){
  const ctx=getAudioCtx();
  const mg=getMusicGain();
  const BPM=108, beat=60/BPM, chord=beat*2;
  const chords=[ [261,330,392], [220,261,330], [174,220,261], [196,247,330] ];
  const totalLen=chord*chords.length;
  function loop(){
    if(musicPhase!=="lobby"||musicVolume<=0) return;
    chords.forEach((freqs,ci)=>{
      freqs.forEach(freq=>{
        const osc=ctx.createOscillator();
        const g=ctx.createGain();
        osc.connect(g); g.connect(mg);
        osc.type='triangle';
        osc.frequency.value=freq;
        const start=ctx.currentTime+ci*chord;
        g.gain.setValueAtTime(0,start);
        g.gain.linearRampToValueAtTime(0.06, start+0.04);
        g.gain.setValueAtTime(0.06, start+chord-0.08);
        g.gain.linearRampToValueAtTime(0, start+chord);
        osc.start(start); osc.stop(start+chord+0.05);
        musicNodes.push(osc);
      });
      const buf=ctx.createBuffer(1,ctx.sampleRate*0.08,ctx.sampleRate);
      const d=buf.getChannelData(0);
      for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
      const src=ctx.createBufferSource(); src.buffer=buf;
      const kg=ctx.createGain(); kg.gain.value=0.08;
      src.connect(kg); kg.connect(mg);
      src.start(ctx.currentTime+ci*chord);
      musicNodes.push(src);
    });
    setTimeout(loop, totalLen*1000-50);
  }
  loop();
  musicPlaying=true;
}
function playGameMusic(){
  if(musicPhase==="game") return;
  stopMusic(0.5);
  musicPhase="game";
  if(musicVolume<=0) return;
  setTimeout(()=>{ if(musicPhase!=="game") return; _startGameLoop(); }, 600);
}
function _startGameLoop(){
  const ctx=getAudioCtx();
  const mg=getMusicGain();
  const BPM=126, beat=60/BPM;
  const bassNotes=[110,110,130,110, 98,110,130,147];
  const stepLen=beat*0.5;
  const totalLen=stepLen*bassNotes.length;
  function makeNoise(start, dur, gainVal){
    const buf=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*dur),ctx.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
    const src=ctx.createBufferSource(); src.buffer=buf;
    const g=ctx.createGain(); g.gain.value=gainVal;
    const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=6000;
    src.connect(hp); hp.connect(g); g.connect(mg);
    src.start(start); src.stop(start+dur+0.01);
    musicNodes.push(src);
  }
  function loop(){
    if(musicPhase!=="game"||musicVolume<=0) return;
    const now=ctx.currentTime;
    bassNotes.forEach((freq,i)=>{
      const osc=ctx.createOscillator();
      const g=ctx.createGain();
      osc.connect(g); g.connect(mg);
      osc.type='sawtooth';
      osc.frequency.value=freq;
      const s=now+i*stepLen;
      g.gain.setValueAtTime(0,s);
      g.gain.linearRampToValueAtTime(0.07,s+0.02);
      g.gain.exponentialRampToValueAtTime(0.001,s+stepLen*0.85);
      osc.start(s); osc.stop(s+stepLen);
      musicNodes.push(osc);
    });
    for(let i=0;i<bassNotes.length;i++) makeNoise(now+i*stepLen, 0.05, 0.04);
    [0,2].forEach(b=>{
      const ks=ctx.createOscillator();
      const kg=ctx.createGain();
      ks.connect(kg); kg.connect(mg);
      ks.type='sine'; ks.frequency.setValueAtTime(150,now+b*beat);
      ks.frequency.exponentialRampToValueAtTime(40, now+b*beat+0.12);
      kg.gain.setValueAtTime(0.12,now+b*beat);
      kg.gain.exponentialRampToValueAtTime(0.001,now+b*beat+0.15);
      ks.start(now+b*beat); ks.stop(now+b*beat+0.2);
      musicNodes.push(ks);
    });
    [1,3].forEach(b=>makeNoise(now+b*beat, 0.1, 0.06));
    setTimeout(loop, totalLen*1000-30);
  }
  loop();
  musicPlaying=true;
}
function playResultsMusic(){
  if(musicPhase==="results") return;
  stopMusic(0.8);
  musicPhase="results";
  if(musicVolume<=0) return;
  setTimeout(()=>{ if(musicPhase!=="results") return; _startResultsLoop(); }, 900);
}
function _startResultsLoop(){
  const ctx=getAudioCtx();
  const mg=getMusicGain();
  const chord=1.8;
  const chords=[ [261,330,392,523], [220,277,330,440], [174,220,261,349], [196,247,294,392] ];
  function loop(){
    if(musicPhase!=="results"||musicVolume<=0) return;
    chords.forEach((freqs,ci)=>{
      freqs.forEach(freq=>{
        const osc=ctx.createOscillator();
        const g=ctx.createGain();
        osc.connect(g); g.connect(mg);
        osc.type='sine';
        osc.frequency.value=freq;
        const s=ctx.currentTime+ci*chord;
        g.gain.setValueAtTime(0,s);
        g.gain.linearRampToValueAtTime(0.04,s+0.15);
        g.gain.setValueAtTime(0.04,s+chord-0.3);
        g.gain.linearRampToValueAtTime(0,s+chord);
        osc.start(s); osc.stop(s+chord+0.1);
        musicNodes.push(osc);
      });
    });
    setTimeout(loop, chords.length*chord*1000-100);
  }
  loop();
  musicPlaying=true;
}
function updateMusicVolume(){
  if(musicGain){
    const ctx=getAudioCtx();
    musicGain.gain.setTargetAtTime(musicVolume, ctx.currentTime, 0.1);
  }
  if(musicVolume>0 && !musicPlaying && musicPhase){
    const p=musicPhase; musicPhase=null;
    if(p==="lobby") playLobbyMusic();
    else if(p==="game") playGameMusic();
    else if(p==="results") playResultsMusic();
  }
  if(musicVolume<=0) { musicPlaying=false; }
}

// ─── SETTINGS ────────────────────────────────────────────────────
const ACCENT_COLORS = [
  { name:"Hellgrün",   hex:"#9ce866" },
  { name:"Waldgrün",  hex:"#4a7c59" },
  { name:"Himmelblau",hex:"#3b9edd" },
  { name:"Ozean",     hex:"#0ea5a0" },
  { name:"Lila",      hex:"#8b5cf6" },
  { name:"Pink",      hex:"#e879a0" },
  { name:"Orange",    hex:"#f97316" },
  { name:"Gelb",      hex:"#eab308" },
  { name:"Rot",       hex:"#ef4444" },
  { name:"Grau",      hex:"#6b7280" },
];
const THEMES = [
  {id:"school", name:"Schulheft", accent:"#9ce866", vars:{
    "--paper":"#fdfbf7","--paper-white":"#ffffff","--paper2":"#f0ede6","--ink":"#343a40","--pencil":"#868e96","--blue":"#339af0","--highlight":"#ffec99","--line":"rgba(52,58,64,0.12)","--grid":"rgba(100,130,190,0.13)","--red":"#ef4444","--accent-text":"#2f3437"
  }},
  {id:"minimal", name:"Minimal", accent:"#5fae4a", vars:{
    "--paper":"#fbfaf6","--paper-white":"#ffffff","--paper2":"#f2f0ea","--ink":"#2f3437","--pencil":"#818891","--blue":"#2f8fd3","--highlight":"#f4ead0","--line":"rgba(47,52,55,0.12)","--grid":"transparent","--red":"#e5484d","--accent-text":"#ffffff"
  }},
  {id:"college", name:"Collegeblock", accent:"#ef476f", vars:{
    "--paper":"#fffefa","--paper-white":"#ffffff","--paper2":"#f3f4f0","--ink":"#263238","--pencil":"#7d8790","--blue":"#2867b2","--highlight":"#fff0b8","--line":"rgba(38,50,56,0.13)","--grid":"rgba(72,118,180,0.16)","--red":"#d94141","--accent-text":"#ffffff"
  }},
  {id:"exam", name:"Klausurblatt", accent:"#d94141", vars:{
    "--paper":"#fafafa","--paper-white":"#ffffff","--paper2":"#f0f0f0","--ink":"#202124","--pencil":"#777b80","--blue":"#2563eb","--highlight":"#fff3cd","--line":"rgba(0,0,0,0.10)","--grid":"rgba(0,0,0,0.045)","--red":"#d94141","--accent-text":"#ffffff"
  }},
  {id:"chalk", name:"Tafel", accent:"#f6d365", vars:{
    "--paper":"#1f332b","--paper-white":"#263f35","--paper2":"#314c40","--ink":"#f5f1e8","--pencil":"#c8d0c8","--blue":"#9dd7ff","--highlight":"#405247","--line":"rgba(245,241,232,0.18)","--grid":"rgba(255,255,255,0.055)","--red":"#ff6b6b","--accent-text":"#1f332b"
  }},
  {id:"chalkColor", name:"Kreide bunt", accent:"#ffb3c7", vars:{
    "--paper":"#20352f","--paper-white":"#28443c","--paper2":"#35584d","--ink":"#fff8e7","--pencil":"#d8dfd4","--blue":"#9bdcff","--highlight":"#4b6058","--line":"rgba(255,248,231,0.18)","--grid":"rgba(255,255,255,0.052)","--red":"#ff7a8a","--accent-text":"#20352f"
  }},
  {id:"night", name:"Nacht", accent:"#8bdcff", vars:{
    "--paper":"#121417","--paper-white":"#1b1f24","--paper2":"#252b31","--ink":"#f2f5f7","--pencil":"#a7b0ba","--blue":"#8bdcff","--highlight":"#263341","--line":"rgba(242,245,247,0.14)","--grid":"rgba(255,255,255,0.045)","--red":"#ff6b7a","--accent-text":"#121417"
  }},
  {id:"neon", name:"Neon Arcade", accent:"#00f5d4", vars:{
    "--paper":"#0b0f1a","--paper-white":"#141a2a","--paper2":"#1f293d","--ink":"#f8fbff","--pencil":"#9aa8c0","--blue":"#7dd3fc","--highlight":"#251b3d","--line":"rgba(255,255,255,0.12)","--grid":"rgba(0,245,212,0.06)","--red":"#ff5c8a","--accent-text":"#071016"
  }},
  {id:"pastel", name:"Pastell", accent:"#ff9f68", vars:{
    "--paper":"#fff9f2","--paper-white":"#ffffff","--paper2":"#f7efe6","--ink":"#36313a","--pencil":"#988f97","--blue":"#3b9edd","--highlight":"#ffe5a8","--line":"rgba(54,49,58,0.12)","--grid":"rgba(255,159,104,0.08)","--red":"#ef5d5d","--accent-text":"#2f3437"
  }},
  {id:"retro", name:"Retro 90s", accent:"#00b8a9", vars:{
    "--paper":"#fff4dc","--paper-white":"#fffaf0","--paper2":"#f3e6c8","--ink":"#2d2a32","--pencil":"#817c89","--blue":"#ff5c8a","--highlight":"#ffde7d","--line":"rgba(45,42,50,0.13)","--grid":"rgba(0,184,169,0.075)","--red":"#ff5c8a","--accent-text":"#ffffff"
  }},
  {id:"candy", name:"Candy", accent:"#ff7eb6", vars:{
    "--paper":"#fff3f8","--paper-white":"#ffffff","--paper2":"#ffe6f0","--ink":"#3d2f3a","--pencil":"#9d7f91","--blue":"#7ab7ff","--highlight":"#fff0a8","--line":"rgba(61,47,58,0.12)","--grid":"rgba(255,126,182,0.075)","--red":"#ef476f","--accent-text":"#ffffff"
  }},
  {id:"forest", name:"Wald", accent:"#7fa650", vars:{
    "--paper":"#f4f1e7","--paper-white":"#fffdf7","--paper2":"#e9e3d1","--ink":"#2e3528","--pencil":"#7b806f","--blue":"#3a82a4","--highlight":"#e8dca8","--line":"rgba(46,53,40,0.14)","--grid":"rgba(46,53,40,0.08)","--red":"#d94a4a","--accent-text":"#ffffff"
  }},
  {id:"sea", name:"Meer", accent:"#00a6a6", vars:{
    "--paper":"#eefcff","--paper-white":"#ffffff","--paper2":"#dff5f8","--ink":"#1f3a44","--pencil":"#6f8c95","--blue":"#0077b6","--highlight":"#caf0f8","--line":"rgba(31,58,68,0.13)","--grid":"rgba(0,166,166,0.09)","--red":"#ef4444","--accent-text":"#ffffff"
  }},
  {id:"sunset", name:"Sonnenuntergang", accent:"#ff8a5b", vars:{
    "--paper":"#fff3e6","--paper-white":"#fffaf4","--paper2":"#f6dfca","--ink":"#3a2d28","--pencil":"#9a8178","--blue":"#3b82c4","--highlight":"#ffd166","--line":"rgba(58,45,40,0.13)","--grid":"rgba(255,138,91,0.08)","--red":"#d94a4a","--accent-text":"#2f3437"
  }},
  {id:"lavender", name:"Lavendel", accent:"#9b5de5", vars:{
    "--paper":"#f8f3ff","--paper-white":"#ffffff","--paper2":"#eee2ff","--ink":"#30283a","--pencil":"#8d7d9d","--blue":"#6c63ff","--highlight":"#fff0b8","--line":"rgba(48,40,58,0.13)","--grid":"rgba(155,93,229,0.08)","--red":"#e5487b","--accent-text":"#ffffff"
  }},
  {id:"blueprint", name:"Blaupause", accent:"#3bb6d8", vars:{
    "--paper":"#f3fbff","--paper-white":"#ffffff","--paper2":"#e7f3f8","--ink":"#243746","--pencil":"#7891a0","--blue":"#237da5","--highlight":"#dff5ff","--line":"rgba(36,55,70,0.13)","--grid":"rgba(59,158,221,0.14)","--red":"#ef4444","--accent-text":"#ffffff"
  }},
  {id:"newspaper", name:"Zeitung", accent:"#111111", vars:{
    "--paper":"#f7f5ef","--paper-white":"#ffffff","--paper2":"#ece9df","--ink":"#111111","--pencil":"#666666","--blue":"#333333","--highlight":"#e9e2c7","--line":"rgba(17,17,17,0.15)","--grid":"rgba(17,17,17,0.045)","--red":"#b91c1c","--accent-text":"#ffffff"
  }},
  {id:"pencil", name:"Bleistift", accent:"#5f6368", vars:{
    "--paper":"#f2f1ec","--paper-white":"#fbfaf7","--paper2":"#e2e0da","--ink":"#2f3133","--pencil":"#777777","--blue":"#5a6c7a","--highlight":"#dedbd2","--line":"rgba(47,49,51,0.14)","--grid":"rgba(47,49,51,0.06)","--red":"#c24141","--accent-text":"#ffffff"
  }},
  {id:"sport", name:"Sportplatz", accent:"#2fb344", vars:{
    "--paper":"#f0faef","--paper-white":"#ffffff","--paper2":"#dff1dd","--ink":"#223326","--pencil":"#6c806f","--blue":"#237da5","--highlight":"#d8f5cb","--line":"rgba(34,51,38,0.13)","--grid":"rgba(47,179,68,0.075)","--red":"#dc2626","--accent-text":"#ffffff"
  }},
  {id:"winter", name:"Winter", accent:"#7dd3fc", vars:{
    "--paper":"#f7fcff","--paper-white":"#ffffff","--paper2":"#e8f4fb","--ink":"#22313f","--pencil":"#7b8b99","--blue":"#0284c7","--highlight":"#dbeafe","--line":"rgba(34,49,63,0.12)","--grid":"rgba(125,211,252,0.09)","--red":"#ef4444","--accent-text":"#22313f"
  }},
  {id:"halloween", name:"Halloween", accent:"#ff8c42", vars:{
    "--paper":"#1d1625","--paper-white":"#2a2035","--paper2":"#3a2a47","--ink":"#fff7ed","--pencil":"#c9b8d8","--blue":"#c084fc","--highlight":"#4b2f5f","--line":"rgba(255,255,255,0.13)","--grid":"rgba(255,255,255,0.045)","--red":"#ff6b6b","--accent-text":"#1d1625"
  }},
  {id:"christmas", name:"Weihnachten", accent:"#c1121f", vars:{
    "--paper":"#fff8ed","--paper-white":"#ffffff","--paper2":"#f3e6d1","--ink":"#2b2d22","--pencil":"#7d7a6a","--blue":"#386641","--highlight":"#ffe6a7","--line":"rgba(43,45,34,0.13)","--grid":"rgba(193,18,31,0.055)","--red":"#c1121f","--green":"#386641","--accent-text":"#ffffff"
  }},
];
let currentTheme = localStorage.getItem("slf_theme") || "school";
let currentAccent = localStorage.getItem("slf_accent") || "#9ce866";
function themeById(id){return THEMES.find(t=>t.id===id)||THEMES[0];}
function applyTheme(id,{save=true,useThemeAccent=true}={}){
  const theme=themeById(id);
  currentTheme=theme.id;
  Object.entries(theme.vars).forEach(([k,v])=>document.documentElement.style.setProperty(k,v));
  if(document.body) document.body.dataset.theme=theme.id;
  if(save) localStorage.setItem("slf_theme",theme.id);
  if(useThemeAccent) applyAccent(theme.accent,{save});
  renderThemes();
}
function applyAccent(hex,{save=true}={}){
  currentAccent = hex;
  document.documentElement.style.setProperty("--primary-accent", hex);
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  document.documentElement.style.setProperty("--margin", `rgba(${r},${g},${b},0.35)`);
  document.documentElement.style.setProperty("--stamp", hex);
  document.documentElement.style.setProperty("--green", hex);
  if(save) localStorage.setItem("slf_accent", hex);
  renderSwatches();
}
function renderThemes(){
  const el=document.getElementById("theme-grid");
  if(!el)return;
  el.innerHTML=THEMES.map(t=>
    `<button type="button" class="theme-chip ${t.id===currentTheme?"active":""}" onclick="window.pickTheme('${t.id}')">
      <span class="theme-dot" style="background:${t.accent}"></span>${t.name}
    </button>`
  ).join("");
}
function renderSwatches(){
  const el=document.getElementById("color-swatches");
  if(!el)return;
  el.innerHTML=ACCENT_COLORS.map(c=>
    `<div class="color-swatch ${c.hex===currentAccent?"active":""}"
      style="background:${c.hex}"
      title="${c.name}"
      onclick="window.pickColor('${c.hex}')"></div>`
  ).join("");
}
window.pickTheme=function(id){ applyTheme(id,{save:true,useThemeAccent:true}); };
window.pickColor=function(hex){ applyAccent(hex); };
window.openSettings=function(){
  document.getElementById("settings-overlay").classList.remove("hidden");
  renderThemes();
  renderSwatches();
  const ms=document.getElementById("music-vol-slider");
  const ss=document.getElementById("sfx-vol-slider");
  if(ms) ms.value=Math.round(musicVolume*100);
  if(ss) ss.value=Math.round(sfxVolume*100);
  updateSliderLabels();
};
window.closeSettings=function(){
  document.getElementById("settings-overlay").classList.add("hidden");
};
window.closeSettingsOutside=function(e){
  if(e.target===document.getElementById("settings-overlay")) window.closeSettings();
};
window.onMusicVol=function(v){
  musicVolume=v/100;
  localStorage.setItem("slf_music_vol", musicVolume);
  updateMusicVolume();
  updateSliderLabels();
};
window.onSfxVol=function(v){
  sfxVolume=v/100;
  localStorage.setItem("slf_sfx_vol", sfxVolume);
  updateSliderLabels();
};
function updateSliderLabels(){
  const ml=document.getElementById("music-vol-label");
  const sl=document.getElementById("sfx-vol-label");
  if(ml) ml.textContent=Math.round(musicVolume*100)+"%";
  if(sl) sl.textContent=Math.round(sfxVolume*100)+"%";
}

// ─── UTILS ──────────────────────────────────────────────────────
function setConnStatus(s){
  const d=document.getElementById("conn-dot"), l=document.getElementById("conn-label");
  if(!d)return; d.className="conn-dot "+s;
  l.textContent=s==="ok"?"Verbunden":s==="sync"?"Sync…":"Fehler";
}
function showScreen(id){
  currentScreen=id;
  ["home","join","lobby","playing","results"].forEach(s=>{
    const el=document.getElementById(`screen-${s}`);
    if(!el)return;
    const hide=s!==id;
    el.classList.toggle("hidden",hide);
    el.hidden=hide;
  });
  const backBtn=document.getElementById("btn-leave");
  if(backBtn){
    backBtn.textContent="← Zurück";
    backBtn.style.display=id==="home"?"none":"inline-flex";
  }
  const hb=document.getElementById("host-badge");
  if(hb) hb.style.display=(id==="lobby"&&isHost)?"block":"none";
}
function showError(msg){
  const el=document.getElementById("join-error");
  if(!el)return;
  el.textContent=msg; el.style.display=msg?"block":"none";
}
function stableHash(s){
  let h=0;
  String(s||"").split("").forEach(ch=>{ h=((h<<5)-h)+ch.charCodeAt(0); h|=0; });
  return Math.abs(h);
}
function validPlayerColor(color){
  return /^#[0-9a-f]{6}$/i.test(String(color||""));
}
function sanitizePlayerColor(color,id=""){
  const c=String(color||"").trim();
  if(validPlayerColor(c))return c;
  return PLAYER_AVATAR_COLORS[stableHash(id)%PLAYER_AVATAR_COLORS.length];
}
function preferredPlayerColor(id,players={}){
  const used=new Set(Object.entries(players||{}).filter(([pid])=>pid!==id).map(([pid,p])=>sanitizePlayerColor(p?.color,pid)));
  const start=stableHash(id)%PLAYER_AVATAR_COLORS.length;
  for(let offset=0;offset<PLAYER_AVATAR_COLORS.length;offset++){
    const color=PLAYER_AVATAR_COLORS[(start+offset)%PLAYER_AVATAR_COLORS.length];
    if(!used.has(color))return color;
  }
  return PLAYER_AVATAR_COLORS[start];
}
function playerInitial(name){
  const clean=String(name||"?").trim();
  const first=Array.from(clean)[0]||"?";
  return first.toLocaleUpperCase("de-DE");
}
function playerAvatarHtml(id,p={},extraClass=""){
  const color=sanitizePlayerColor(p?.color,id);
  return `<span class="player-avatar ${extraClass}" style="--player-color:${color}" aria-hidden="true">${escHtml(playerInitial(p?.name))}</span>`;
}
function playerRoomData(existingPlayer=null,allPlayers={}){
  const existing=existingPlayer||{};
  return {
    name:myName,
    score:Number(existing.score)||0,
    hb:Date.now(),
    color:validPlayerColor(existing.color)?String(existing.color).trim():preferredPlayerColor(myId,allPlayers)
  };
}
function scoreNameHtml(id,p={},rank="",extraHtml=""){
  return `<div class="score-name">
    ${rank?`<span class="score-rank">${escHtml(rank)}</span>`:""}
    ${playerAvatarHtml(id,p,"score-avatar")}
    <span class="score-label">${escHtml(p?.name||"?")}</span>
    ${extraHtml||""}
  </div>`;
}
function lobbyPlayerChipHtml(id,p,metaText=""){
  const online=Date.now()-(p?.hb||0)<PLAYER_STALE_MS;
  const canKick=!!(isHost&&gameState?.phase==="lobby"&&id!==myId);
  return `<div class="player-chip">
    ${playerAvatarHtml(id,p)}
    <div class="online-dot ${online?"online":"offline"}" title="${online?"online":"offline"}"></div>
    <span class="player-chip-name">${escHtml(p?.name||"?")}${id===gameState?.host?" ★":""}</span>
    ${metaText?`<span class="pts">${escHtml(metaText)}</span>`:""}
    ${canKick?`<button type="button" class="player-kick-btn" title="Spieler entfernen" aria-label="${escHtml(p?.name||"Spieler")} entfernen" onclick="window.kickPlayer('${id}')">×</button>`:""}
  </div>`;
}
function renderLobbyPlayers(metaFn=null){
  const el=document.getElementById("players-list");
  if(!el||!gameState)return;
  const players=gameState.players||{};
  el.innerHTML=Object.entries(players).map(([id,p])=>{
    const meta=typeof metaFn==="function"?metaFn(id,p):`${safeNum(p?.score)}P`;
    return lobbyPlayerChipHtml(id,p,meta);
  }).join("");
}
function updateJoinScreen(){
  const game=GAMES[selectedGame]||GAMES.slf;
  const title=document.getElementById("join-game-title");
  const blockTitle=document.getElementById("join-block-title");
  if(title) title.innerHTML=game.titleHtml;
  if(blockTitle) blockTitle.textContent=game.enabled?"Mitspielen":game.name;
  const disabled=!game.enabled;
  ["btn-create-room","btn-join-room","input-room"].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.disabled=disabled;
  });
  showError(disabled?"Dieses Spiel ist noch nicht verfügbar.":"");
}
window.selectGame=function(gameId){
  selectedGame=validGameId(gameId);
  sessionStorage.setItem(SELECTED_GAME_SESSION_KEY,selectedGame);
  updateJoinScreen();
  showScreen("join");
};
window.backToHome=function(){
  selectedGame="slf";
  sessionStorage.removeItem(SELECTED_GAME_SESSION_KEY);
  clearInviteUrl();
  setInviteFeedback("");
  showError("");
  updateJoinScreen();
  showScreen("home");
};
function sanitizeId(s){return s.replace(/[^a-zA-Z0-9]/g,"_");}
function catsToObj(a){return a.reduce((acc,c,i)=>({...acc,[String(i)]:c}),{});}
function objToCats(o){
  if(!o)return[...DEFAULT_CATS];
  if(Array.isArray(o))return o;
  return Object.keys(o).sort((a,b)=>Number(a)-Number(b)).map(k=>o[k]);
}
async function updateRoomData(patch){
  setConnStatus("sync"); await update(roomRef(),patch); setConnStatus("ok");
}
function connect4PieceCount(board){
  return normalizeConnect4Board(board).filter(Boolean).length;
}
function mergeConnect4Boards(primary, fallback){
  const board=normalizeConnect4Board(primary);
  const old=normalizeConnect4Board(fallback);
  for(let i=0;i<42;i++){
    // Vier-gewinnt-Steine verschwinden innerhalb einer laufenden Runde nie.
    // Wenn ein Firebase-Update kurzzeitig eine ältere/ausgedünnte Board-Version liefert,
    // behalten wir bekannte belegte Felder bei.
    if(!board[i]&&old[i]) board[i]=old[i];
  }
  return board;
}
function connect4BoardsEqual(a,b){
  const aa=normalizeConnect4Board(a), bb=normalizeConnect4Board(b);
  return aa.every((v,i)=>v===bb[i]);
}
function stabilizeConnect4State(newState){
  if(newState?.gameType!=="connect4"||!gameState?.connect4||!newState.connect4)return newState;
  const oldC4=gameState.connect4;
  const newC4=newState.connect4;
  const sameRound=String(oldC4.round||0)===String(newC4.round||0);
  if(newState.phase==="playing"&&gameState.phase==="playing"&&sameRound){
    const oldMove=safeNum(oldC4.moveCount), newMove=safeNum(newC4.moveCount);
    const oldBoard=normalizeConnect4Board(oldC4.board);
    const newBoard=normalizeConnect4Board(newC4.board);
    const oldCount=connect4PieceCount(oldBoard), newCount=connect4PieceCount(newBoard);
    if(newMove<oldMove){
      return {...newState, connect4:{...newC4,...oldC4,board:oldBoard}};
    }
    if(newMove===oldMove&&newCount<oldCount){
      return {...newState, connect4:{...newC4,...oldC4,board:oldBoard}};
    }
    const mergedBoard=mergeConnect4Boards(newBoard,oldBoard);
    if(!connect4BoardsEqual(mergedBoard,newBoard)){
      return {...newState, connect4:{...newC4,board:mergedBoard}};
    }
  }
  return newState;
}

// ─── INIT ────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded",()=>{
  const savedTheme=localStorage.getItem("slf_theme")||"school";
  applyTheme(savedTheme,{save:false,useThemeAccent:false});
  const savedAccent=localStorage.getItem("slf_accent");
  const theme=themeById(savedTheme);
  if(savedAccent && savedAccent!=="#6bc94e") applyAccent(savedAccent,{save:false});
  else applyAccent(theme.accent,{save:false});
  document.addEventListener("click", ()=>{ try{ getAudioCtx(); playLobbyMusic(); }catch(e){} }, {once:true});

  selectedGame=validGameId(sessionStorage.getItem(SELECTED_GAME_SESSION_KEY)||selectedGame);
  updateJoinScreen();
  const roomFromUrl=normalizeRoomCode(new URLSearchParams(location.search).get("room")||"");
  const n=sessionStorage.getItem("slf_name"),r=sessionStorage.getItem("slf_room"),i=sessionStorage.getItem("slf_id");
  const savedRoom=normalizeRoomCode(r||"");
  const targetRoom=roomFromUrl||savedRoom;
  if(targetRoom) document.getElementById("input-room").value=targetRoom;
  if(n&&targetRoom&&i){
    showScreen("join");
    document.getElementById("input-name").value=n;
    myId=i;
    window.joinExistingRoom({auto:true});
  }else if(roomFromUrl){
    showScreen("join");
    prefillGameFromRoomCode(roomFromUrl);
  }else{
    showScreen("home");
  }
});

// ─── JOIN / CREATE ROOM ──────────────────────────────────────────
const ROOM_WORDS=["WOLKE","TIGER","PAPYR","KAKTUS","WIESE","FUCHS","INSEL","PILOT","LAMPE","HONIG","KOMET","ANKER","FARBE","MOND","STIFT","KARTE","RADIO","ZEBRA","BIRKE","RIESE"];
function normalizeRoomCode(s){return String(s||"").trim().toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,10);}
async function prefillGameFromRoomCode(roomCode){
  const code=normalizeRoomCode(roomCode);
  if(!code)return;
  try{
    const snap=await get(ref(db,`rooms/${code}`));
    if(!snap.exists())return;
    const existing=snap.val();
    const roomGame=existing?.gameType||"slf";
    if(GAMES[roomGame]?.enabled){
      selectedGame=roomGame;
      sessionStorage.setItem(SELECTED_GAME_SESSION_KEY,selectedGame);
      updateJoinScreen();
    }
  }catch(e){}
}
function setJoinBusy(busy){ 
  ["btn-create-room","btn-join-room"].forEach(id=>{const b=document.getElementById(id);if(b)b.disabled=busy;});
}
function clearJoinSession(){
  ["slf_name","slf_room","slf_id","slf_local_answers",SELECTED_GAME_SESSION_KEY].forEach(k=>sessionStorage.removeItem(k));
}
function generateRoomCode(){
  const word=ROOM_WORDS[Math.floor(Math.random()*ROOM_WORDS.length)];
  const n=Math.floor(Math.random()*90)+10;
  return normalizeRoomCode(word+n);
}
function emptyConnect4Board(){
  return Array(42).fill("");
}
function normalizeConnect4Board(raw){
  const board=emptyConnect4Board();
  if(Array.isArray(raw)){
    raw.slice(0,42).forEach((v,i)=>{ board[i]=(v==="red"||v==="yellow")?v:""; });
  }else if(raw&&typeof raw==="object"){
    Object.entries(raw).forEach(([k,v])=>{
      const i=Number(k);
      if(Number.isInteger(i)&&i>=0&&i<42) board[i]=(v==="red"||v==="yellow")?v:"";
    });
  }
  return board;
}
function randomConnect4Turn(){
  return Math.random()<0.5?"red":"yellow";
}
function otherConnect4Turn(role){
  return role==="red"?"yellow":"red";
}
function isConnect4Role(role){
  return role==="red"||role==="yellow";
}
function connect4StarterForNextRound(c4={}){
  if(isConnect4Role(c4.nextStarter)) return c4.nextStarter;
  if(isConnect4Role(c4.winner)) return otherConnect4Turn(c4.winner);
  return randomConnect4Turn();
}
function initialConnect4State(){
  return {
    board:emptyConnect4Board(),
    seats:{red:myId,yellow:null},
    turn:"red",
    winner:null,
    winCells:[],
    lastMove:null,
    moveCount:0,
    round:0,
    nextStarter:null
  };
}
function reconcileConnect4SeatsPatch(state){
  if(!state||state.gameType!=="connect4")return null;
  const players=state.players||{};
  const ids=Object.keys(players);
  if(ids.length===0)return null;
  const c4=state.connect4||{};
  const seats={...(c4.seats||{})};
  let changed=false;
  let resetGame=false;

  if(!seats.red||!players[seats.red]){
    seats.red=(state.host&&players[state.host])?state.host:ids[0];
    changed=true;
    resetGame=true;
  }
  if(seats.yellow&&!players[seats.yellow]){
    seats.yellow=null;
    changed=true;
    resetGame=true;
  }
  if(seats.yellow===seats.red){
    seats.yellow=null;
    changed=true;
    resetGame=true;
  }
  if(!seats.yellow){
    const next=ids.find(id=>id!==seats.red);
    if(next){seats.yellow=next;changed=true;}
  }
  if(!changed)return null;

  const patch={"connect4/seats":seats};
  if(resetGame&&state.phase!=="lobby"){
    patch.phase="lobby";
    patch["connect4/board"]=emptyConnect4Board();
    const starter=connect4StarterForNextRound(state.connect4||{});
    patch["connect4/turn"]=starter;
    patch["connect4/winner"]=null;
    patch["connect4/winCells"]=[];
    patch["connect4/lastMove"]=null;
    patch["connect4/moveCount"]=0;
    patch["connect4/nextStarter"]=starter;
  }
  return patch;
}
function initialBattleshipState(){
  return {
    seats:{p1:myId,p2:null},
    phase:"lobby",
    turn:"p1",
    boards:{},
    ready:{},
    winner:null,
    lastShot:null,
    round:0,
    ships:BATTLESHIP_SHIPS,
    hitStreak:true
  };
}
function emptyKniffelDice(){ return [0,0,0,0,0]; }
function emptyKniffelHeld(){ return [false,false,false,false,false]; }
function emptyKniffelRollingMask(){ return [false,false,false,false,false]; }
function initialKniffelState(order=[]){
  const cleanOrder=[...new Set((order||[]).filter(Boolean))];
  return {
    phase:"lobby",
    order:cleanOrder,
    scores:{},
    dice:emptyKniffelDice(),
    held:emptyKniffelHeld(),
    rolls:0,
    round:0,
    rollingUntil:0,
    rollingNonce:0,
    rollingMask:emptyKniffelRollingMask()
  };
}
function kniffelLobbyStateForPlayers(players={}){
  return initialKniffelState(Object.keys(players||{}));
}
function normalizeKniffelDice(raw){
  const arr=Array.isArray(raw)?raw:[];
  return emptyKniffelDice().map((_,i)=>{
    const n=Number(arr[i]);
    return Number.isInteger(n)&&n>=0&&n<=6?n:0;
  });
}
function normalizeKniffelHeld(raw){
  const arr=Array.isArray(raw)?raw:[];
  return emptyKniffelHeld().map((_,i)=>!!arr[i]);
}
function normalizeKniffelRollingMask(raw){
  const arr=Array.isArray(raw)?raw:[];
  return emptyKniffelRollingMask().map((_,i)=>!!arr[i]);
}
function kniffelCategoryById(catId){
  return KNIFFEL_CATEGORIES.find(c=>c.id===catId)||null;
}
function normalizeKniffelCategoryScore(catId,value){
  const n=Number(value);
  if(!Number.isFinite(n))return null;
  const limit=KNIFFEL_SCORE_LIMITS[catId];
  if(limit==null)return null;
  const v=Math.max(0,Math.min(limit,Math.floor(n)));
  const fixed={fullHouse:[0,25],smallStraight:[0,30],largeStraight:[0,40],kniffel:[0,50]};
  if(fixed[catId]&&!fixed[catId].includes(v))return null;
  return v;
}
function normalizeKniffelScores(rawScores,order){
  const out={};
  (order||[]).forEach(id=>{
    const src=(rawScores&&typeof rawScores==="object"&&rawScores[id]&&typeof rawScores[id]==="object")?rawScores[id]:{};
    const playerScores={};
    KNIFFEL_CATEGORIES.forEach(cat=>{
      if(src[cat.id]!=null){
        const normalizedScore=normalizeKniffelCategoryScore(cat.id,src[cat.id]);
        if(normalizedScore!=null) playerScores[cat.id]=normalizedScore;
      }
    });
    if(Object.keys(playerScores).length>0) out[id]=playerScores;
  });
  return out;
}
function normalizeKniffelLastScore(raw,order){
  if(!raw||typeof raw!=="object")return null;
  const player=String(raw.player||"");
  const category=String(raw.category||"");
  if(!order.includes(player))return null;
  if(!KNIFFEL_CATEGORIES.some(c=>c.id===category))return null;
  return {player,category,score:Math.max(0,Math.floor(safeNum(raw.score)))};
}
function normalizeKniffelState(raw,players={}){
  const source=(raw&&typeof raw==="object")?raw:{};
  const playerIds=Object.keys(players||{});
  const sourceOrder=Array.isArray(source.order)?source.order.map(String):[];
  let phase=["lobby","playing","results"].includes(source.phase)?source.phase:"lobby";
  let order=[...new Set(sourceOrder.filter(id=>players[id]))];
  if(phase==="lobby"||order.length===0){
    playerIds.forEach(id=>{ if(!order.includes(id)) order.push(id); });
  }
  const scores=normalizeKniffelScores(source.scores,order);
  let dice=normalizeKniffelDice(source.dice);
  let held=normalizeKniffelHeld(source.held);
  let rolls=Math.max(0,Math.min(3,Math.floor(safeNum(source.rolls))));
  if(rolls===0||dice.some(n=>n<1||n>6)){
    rolls=0;
    dice=emptyKniffelDice();
    held=emptyKniffelHeld();
  }
  let turn=source.turn&&order.includes(source.turn)?source.turn:null;
  if(phase==="playing"){
    const active=order.filter(id=>!kniffelPlayerComplete(scores[id]||{}));
    if(active.length===0&&order.length>0){
      phase="results";
      turn=null;
    }else{
      if(!turn||kniffelPlayerComplete(scores[turn]||{})) turn=active[0]||null;
    }
  }else{
    turn=null;
  }
  if(phase==="results"){
    dice=emptyKniffelDice();
    held=emptyKniffelHeld();
    rolls=0;
  }
  let rollingUntil=Math.max(0,Math.floor(safeNum(source.rollingUntil)));
  let rollingNonce=Math.max(0,Math.floor(safeNum(source.rollingNonce)));
  let rollingMask=normalizeKniffelRollingMask(source.rollingMask);
  if(phase!=="playing"||rolls===0||rollingUntil<=Date.now()){
    rollingUntil=0;
    rollingMask=emptyKniffelRollingMask();
  }
  let winner=source.winner&&order.includes(source.winner)?source.winner:null;
  if(phase==="results"&&!winner) winner=kniffelWinnerId({players,kniffel:{phase,order,scores}})||null;
  return {
    phase,
    order,
    turn,
    scores,
    dice,
    held,
    rolls,
    round:Math.max(0,Math.floor(safeNum(source.round))),
    rollingUntil,
    rollingNonce,
    rollingMask,
    winner,
    lastScore:normalizeKniffelLastScore(source.lastScore,order)
  };
}
function reconcileKniffelStatePatch(state){
  if(!state||state.gameType!=="kniffel")return null;
  const players=state.players||{};
  const raw=state.kniffel||{};
  const normalized=normalizeKniffelState(raw,players);
  const patch={};

  // Wichtig: Firebase speichert leere Objekte und null-Felder nicht zuverlässig.
  // Deshalb nicht den kompletten normalisierten State zurückschreiben, sonst entsteht
  // in der Lobby eine Endlos-Reparatur und der Raum wird scheinbar nicht erstellt.
  if(state.phase==="lobby"){
    const desiredOrder=Object.keys(players||{});
    const rawOrder=Array.isArray(raw.order)?raw.order.filter(id=>players[id]):[];
    if(raw.phase!=="lobby") patch["kniffel/phase"]="lobby";
    if(JSON.stringify(rawOrder)!==JSON.stringify(desiredOrder)) patch["kniffel/order"]=desiredOrder;
    if(safeNum(raw.rolls)!==0) patch["kniffel/rolls"]=0;
    if(JSON.stringify(normalizeKniffelDice(raw.dice))!==JSON.stringify(emptyKniffelDice())) patch["kniffel/dice"]=emptyKniffelDice();
    if(JSON.stringify(normalizeKniffelHeld(raw.held))!==JSON.stringify(emptyKniffelHeld())) patch["kniffel/held"]=emptyKniffelHeld();
    if(raw.turn!=null) patch["kniffel/turn"]=null;
    if(safeNum(raw.rollingUntil)!==0) patch["kniffel/rollingUntil"]=0;
    if(JSON.stringify(normalizeKniffelRollingMask(raw.rollingMask))!==JSON.stringify(emptyKniffelRollingMask())) patch["kniffel/rollingMask"]=emptyKniffelRollingMask();
    if(raw.winner!=null) patch["kniffel/winner"]=null;
    if(raw.lastScore!=null) patch["kniffel/lastScore"]=null;
    return Object.keys(patch).length?patch:null;
  }

  if(state.phase!=="results"&&normalized.phase==="results"){
    patch.phase="results";
    patch["kniffel/phase"]="results";
    if(normalized.winner){
      patch["kniffel/winner"]=normalized.winner;
      if(players[normalized.winner]) patch[`players/${normalized.winner}/score`]=safeNum(players[normalized.winner].score)+1;
    }
    patch["kniffel/turn"]=null;
    patch["kniffel/dice"]=emptyKniffelDice();
    patch["kniffel/held"]=emptyKniffelHeld();
    patch["kniffel/rolls"]=0;
    patch["kniffel/rollingUntil"]=0;
    patch["kniffel/rollingMask"]=emptyKniffelRollingMask();
  }
  return Object.keys(patch).length?patch:null;
}
function initialDrawingState(order=[]){
  const cleanOrder=[...new Set((order||[]).filter(Boolean))];
  return {
    phase:"lobby",
    order:cleanOrder,
    round:0,
    drawer:null,
    word:"",
    wordIndex:0,
    wordMode:"mixed",
    usedWords:[],
    roundDuration:DRAWING_DEFAULT_DURATION,
    roundStartTs:null,
    strokes:{},
    guesses:{},
    guessed:{},
    lastCorrect:null,
    winner:null
  };
}
function drawingLobbyStateForPlayers(players={},previous={}){
  const state=initialDrawingState(Object.keys(players||{}));
  state.wordMode=drawingWordMode(previous?.wordMode||"mixed");
  state.usedWords=Array.isArray(previous?.usedWords)?previous.usedWords.slice(-drawingWordPool(state.wordMode).length):[];
  state.roundDuration=Math.max(30,Math.min(300,safeNum(previous?.roundDuration)||DRAWING_DEFAULT_DURATION));
  return state;
}
function drawingOrder(state){
  const players=state?.players||{};
  const d=state?.drawing||{};
  const existing=(Array.isArray(d.order)?d.order:[]).filter(id=>players[id]);
  const missing=Object.keys(players).filter(id=>!existing.includes(id));
  return [...existing,...missing];
}
function drawingPlayerName(id){
  return id?(gameState.players?.[id]?.name||"?"):"?";
}
function drawingGuessesArray(guesses){
  if(!guesses)return[];
  const arr=Array.isArray(guesses)?guesses.filter(Boolean):Object.values(guesses).filter(Boolean);
  return arr.sort((a,b)=>safeNum(a.ts)-safeNum(b.ts));
}
function drawingNextDrawer(order,currentDrawer){
  const clean=(order||[]).filter(Boolean);
  if(!clean.length)return null;
  const idx=clean.indexOf(currentDrawer);
  return clean[(idx>=0?idx+1:0)%clean.length];
}
function drawingWordMode(mode){
  return DRAWING_WORD_PACKS[mode]?mode:"mixed";
}
function drawingWordPool(mode){
  return DRAWING_WORD_PACKS[drawingWordMode(mode)]||DRAWING_WORD_PACKS.mixed;
}
function drawingPickWord(usedWords=[],mode="mixed"){
  const pool=drawingWordPool(mode);
  const used=new Set((usedWords||[]).map(String));
  let available=pool.filter(w=>!used.has(w));
  if(available.length===0){
    available=[...pool];
    used.clear();
  }
  const word=available[Math.floor(Math.random()*available.length)]||pool[0]||"Haus";
  return {word,usedWords:[...used,word].slice(-pool.length)};
}
function drawingRoundState(order,round,drawer=null,previous={}){
  const clean=[...new Set((order||[]).filter(Boolean))];
  const chosenDrawer=drawer&&clean.includes(drawer)?drawer:(drawingFirstDrawer(clean));
  const wordMode=drawingWordMode(previous?.wordMode||"mixed");
  const picked=drawingPickWord(previous?.usedWords||[],wordMode);
  const duration=Math.max(30,Math.min(300,safeNum(previous?.roundDuration)||DRAWING_DEFAULT_DURATION));
  return {
    ...initialDrawingState(clean),
    phase:"playing",
    order:clean,
    round:safeNum(round)+1,
    drawer:chosenDrawer,
    word:picked.word,
    wordIndex:Math.max(0,DRAWING_WORDS.indexOf(picked.word)),
    wordMode,
    usedWords:picked.usedWords,
    roundDuration:duration,
    roundStartTs:Date.now(),
    strokes:{},
    guesses:{},
    guessed:{},
    lastCorrect:null,
    winner:null
  };
}
function drawingRecentGuessesHtml(d){
  const guesses=drawingGuessesArray(d?.guesses).slice(-8).reverse();
  if(!guesses.length)return`<div class="drawing-sub" style="margin-top:12px">Noch keine Rateversuche.</div>`;
  return `<div class="drawing-guesses">${guesses.map(g=>`
    <div class="drawing-guess-chip ${g.correct?"correct":""}">
      <span class="drawing-guess-name">${escHtml(g.name||"?")}</span>
      <span class="drawing-guess-word">${escHtml(g.guess||"")}${g.correct?" ✓":""}</span>
    </div>`).join("")}</div>`;
}
function drawingEndTime(d){
  return safeNum(d?.roundStartTs)+safeNum(d?.roundDuration||DRAWING_DEFAULT_DURATION)*1000;
}
function stopDrawingTimer(){
  if(drawingTimerInterval){
    clearInterval(drawingTimerInterval);
    drawingTimerInterval=null;
  }
}
function startDrawingTimerClient(){
  if(drawingTimerInterval)return;
  drawingTimerInterval=setInterval(()=>{
    if(!gameState||gameState.gameType!=="drawing"||gameState.phase!=="playing"){
      stopDrawingTimer();
      return;
    }
    const d=gameState.drawing||{};
    if(isHost&&Date.now()>=drawingEndTime(d)){
      window.endDrawingRoundTimeout();
    }
  },500);
}
function reconcileDrawingStatePatch(state){
  if(!state||state.gameType!=="drawing")return null;
  const players=state.players||{};
  const playerIds=Object.keys(players);
  const d=state.drawing||{};
  const patch={};
  const roomPhase=state.phase||"lobby";

  if(roomPhase==="lobby"){
    const desiredOrder=playerIds;
    const rawOrder=Array.isArray(d.order)?d.order.filter(id=>players[id]):[];
    if(d.phase!=="lobby") patch["drawing/phase"]="lobby";
    if(JSON.stringify(rawOrder)!==JSON.stringify(desiredOrder)) patch["drawing/order"]=desiredOrder;
    if(!DRAWING_WORD_PACKS[d.wordMode||""]) patch["drawing/wordMode"]="mixed";
    if(d.drawer!=null) patch["drawing/drawer"]=null;
    if(d.word) patch["drawing/word"]="";
    if(d.roundStartTs!=null) patch["drawing/roundStartTs"]=null;
    if(d.strokes) patch["drawing/strokes"]=null;
    if(d.guesses) patch["drawing/guesses"]=null;
    if(d.guessed) patch["drawing/guessed"]=null;
    if(d.lastCorrect!=null) patch["drawing/lastCorrect"]=null;
    if(d.winner!=null) patch["drawing/winner"]=null;
    return Object.keys(patch).length?patch:null;
  }

  if(roomPhase==="playing"){
    if(playerIds.length<DRAWING_MIN_PLAYERS||!players[d.drawer]){
      patch.phase="lobby";
      patch["drawing/phase"]="lobby";
      patch["drawing/order"]=playerIds;
      patch["drawing/drawer"]=null;
      patch["drawing/word"]="";
      patch["drawing/roundStartTs"]=null;
      patch["drawing/strokes"]=null;
      patch["drawing/guesses"]=null;
      patch["drawing/guessed"]=null;
      patch["drawing/lastCorrect"]=null;
      patch["drawing/winner"]=null;
      return patch;
    }
    if(d.phase!=="playing") patch["drawing/phase"]="playing";
    if(!d.word){
      const mode=drawingWordMode(d.wordMode||"mixed");
      const picked=drawingPickWord(d.usedWords||[],mode);
      patch["drawing/word"]=picked.word;
      patch["drawing/wordIndex"]=Math.max(0,DRAWING_WORDS.indexOf(picked.word));
      patch["drawing/wordMode"]=mode;
      patch["drawing/usedWords"]=picked.usedWords;
    }
    if(!safeNum(d.roundStartTs)) patch["drawing/roundStartTs"]=Date.now();
    if(Date.now()>=drawingEndTime(d)){
      patch.phase="results";
      patch["drawing/phase"]="results";
      patch["drawing/lastCorrect"]=null;
      patch["drawing/winner"]=null;
    }
    return Object.keys(patch).length?patch:null;
  }

  if(roomPhase==="results"&&d.phase!=="results"){
    patch["drawing/phase"]="results";
  }
  return Object.keys(patch).length?patch:null;
}
function initialMauMauState(order=[]){
  const cleanOrder=[...new Set((order||[]).filter(Boolean))];
  return {
    phase:"lobby",
    order:cleanOrder,
    round:0,
    direction:1,
    dealer:null,
    turn:null,
    activeColor:"",
    drawnThisTurn:null,
    drawStack:0,
    mauCalled:{},
    moveCount:0,
    lastAction:""
  };
}
function mauMauLobbyStateForPlayers(players={},previous={}){
  const state=initialMauMauState(Object.keys(players||{}));
  state.round=safeNum(previous?.round)||0;
  state.direction=safeNum(previous?.direction)||1;
  return state;
}
function mauMauOrder(state){
  const players=state?.players||{};
  const m=state?.maumau||{};
  const existing=(Array.isArray(m.order)?m.order:[]).filter(id=>players[id]);
  const missing=Object.keys(players).filter(id=>!existing.includes(id));
  return [...existing,...missing];
}
function mauMauPlayerName(id){
  return id?(gameState.players?.[id]?.name||"?"):"?";
}
function mauMauCardLabel(card){
  if(!card)return"?";
  if(card.value==="wild")return"Farbwahl";
  return MAUMAU_SPECIAL_LABELS[card.value]||String(card.value||"?");
}
function mauMauCardSymbol(card){
  if(!card)return"?";
  if(card.value==="wild")return"🎨";
  if(card.value==="skip")return"🚫";
  if(card.value==="reverse")return"🔄";
  if(card.value==="draw2")return"+2";
  return String(card.value||"?");
}
function mauMauColorRank(color){
  const idx=MAUMAU_COLORS.indexOf(color);
  return idx>=0?idx:99;
}
function mauMauValueRank(value){
  if(/^\d$/.test(String(value)))return Number(value);
  const ranks={skip:10,reverse:11,draw2:12,wild:13};
  return ranks[value]??99;
}
function mauMauSortedHandEntries(hand){
  return (Array.isArray(hand)?hand:[])
    .map((card,index)=>({card,index}))
    .sort((a,b)=>{
      const colorDiff=mauMauColorRank(a.card?.color)-mauMauColorRank(b.card?.color);
      if(colorDiff!==0)return colorDiff;
      const valueDiff=mauMauValueRank(a.card?.value)-mauMauValueRank(b.card?.value);
      if(valueDiff!==0)return valueDiff;
      return String(a.card?.id||"").localeCompare(String(b.card?.id||""));
    });
}
function mauMauCardHtml(card,{back=false,className=""}={}){
  if(back){
    return `<div class="maumau-card back ${escHtml(className)}"><div class="maumau-card-symbol">🃏</div><div class="maumau-card-label">Ziehen</div></div>`;
  }
  const color=card?.color||"wild";
  const value=String(card?.value||"");
  const isNumber=/^\d$/.test(value);
  const symbol=mauMauCardSymbol(card);
  const label=isNumber?"":mauMauCardLabel(card);
  return `<div class="maumau-card ${escHtml(color)} ${escHtml(className)} ${isNumber?"number":"special"}">
    <div class="maumau-card-symbol">${escHtml(symbol)}</div>
    ${label?`<div class="maumau-card-label">${escHtml(label)}</div>`:""}
  </div>`;
}
function mauMauCreateDeck(){
  const deck=[];
  MAUMAU_COLORS.forEach(color=>{
    deck.push({id:`${color}_0_0`,color,value:"0"});
    for(let copy=0;copy<2;copy++){
      for(let n=1;n<=9;n++) deck.push({id:`${color}_${n}_${copy}`,color,value:String(n)});
      ["skip","reverse","draw2"].forEach(v=>deck.push({id:`${color}_${v}_${copy}`,color,value:v}));
    }
  });
  for(let i=0;i<4;i++) deck.push({id:`wild_${i}`,color:"wild",value:"wild"});
  return deck;
}
function mauMauShuffle(deck){
  const arr=(deck||[]).map(card=>({...card}));
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}
function mauMauIsNumberCard(card){
  return !!card&&MAUMAU_COLORS.includes(card.color)&&/^\d$/.test(String(card.value));
}
function mauMauDeal(order){
  const deck=mauMauShuffle(mauMauCreateDeck());
  const hands={};
  order.forEach(id=>{hands[id]=[];});
  for(let r=0;r<7;r++){
    order.forEach(id=>{
      const card=deck.shift();
      if(card) hands[id].push(card);
    });
  }
  let firstIndex=deck.findIndex(mauMauIsNumberCard);
  if(firstIndex<0) firstIndex=0;
  const firstCard=deck.splice(firstIndex,1)[0]||null;
  return {hands,drawPile:deck,discardPile:firstCard?[firstCard]:[],firstCard};
}
function mauMauRandomTurn(order){
  const clean=(order||[]).filter(Boolean);
  return clean.length?clean[Math.floor(Math.random()*clean.length)]:null;
}
function mauMauRoundState(order,round=0){
  const clean=[...new Set((order||[]).filter(Boolean))];
  const dealt=mauMauDeal(clean);
  return {
    ...initialMauMauState(clean),
    phase:"playing",
    order:clean,
    round:safeNum(round)+1,
    direction:1,
    dealer:null,
    turn:mauMauRandomTurn(clean),
    activeColor:dealt.firstCard?.color||"red",
    drawPile:dealt.drawPile,
    discardPile:dealt.discardPile,
    hands:dealt.hands,
    drawnThisTurn:null,
    drawStack:0,
    mauCalled:{},
    moveCount:0,
    winner:null,
    lastAction:"Karten ausgeteilt"
  };
}
function mauMauHandCount(state,pid){
  const hand=state?.maumau?.hands?.[pid];
  return Array.isArray(hand)?hand.length:0;
}
function mauMauTopCard(m){
  const pile=Array.isArray(m?.discardPile)?m.discardPile:[];
  return pile[pile.length-1]||null;
}
function mauMauCanPlay(card,m){
  if(!card||!m)return false;
  if(safeNum(m.drawStack)>0){
    return card.value==="draw2";
  }
  if(card.value==="wild")return true;
  const top=mauMauTopCard(m);
  if(!top)return true;
  return card.color===m.activeColor||card.color===top.color||card.value===top.value;
}
function mauMauHasPlayable(hand,m){
  return (hand||[]).some(card=>mauMauCanPlay(card,m));
}
function mauMauNextPlayer(order,currentId,direction=1,steps=1){
  const clean=(order||[]).filter(Boolean);
  if(!clean.length)return null;
  const idx=Math.max(0,clean.indexOf(currentId));
  const dir=direction===-1?-1:1;
  const next=(idx+(steps*dir)+clean.length*10)%clean.length;
  return clean[next];
}
function mauMauEnsurePiles(m){
  if(!Array.isArray(m.drawPile))m.drawPile=[];
  if(!Array.isArray(m.discardPile))m.discardPile=[];
  if(m.drawPile.length===0&&m.discardPile.length>1){
    const top=m.discardPile[m.discardPile.length-1];
    m.drawPile=mauMauShuffle(m.discardPile.slice(0,-1));
    m.discardPile=[top];
  }
}
function mauMauDrawCards(m,pid,count=1){
  if(!m.hands)m.hands={};
  if(!Array.isArray(m.hands[pid]))m.hands[pid]=[];
  for(let i=0;i<count;i++){
    mauMauEnsurePiles(m);
    const card=m.drawPile.shift();
    if(card)m.hands[pid].push(card);
  }
  if(m.mauCalled) delete m.mauCalled[pid];
}
function mauMauApplyCardEffect(m,playerId,card,chosenColor){
  m.drawnThisTurn=null;
  const order=(m.order||[]).filter(Boolean);
  let direction=safeNum(m.direction)===-1?-1:1;
  let steps=1;
  let action=`${mauMauPlayerName(playerId)} legt ${mauMauCardLabel(card)}`;
  if(card.value==="wild"){
    m.activeColor=MAUMAU_COLORS.includes(chosenColor)?chosenColor:"red";
    action=`${mauMauPlayerName(playerId)} wählt ${MAUMAU_COLOR_LABELS[m.activeColor]}`;
  }else{
    m.activeColor=card.color;
  }
  if(card.value==="skip"){
    steps=2;
    action=`${mauMauPlayerName(playerId)} setzt aus`;
  }else if(card.value==="reverse"){
    direction=direction===1?-1:1;
    steps=order.length===2?2:1;
    action=`${mauMauPlayerName(playerId)} wechselt die Richtung`;
  }else if(card.value==="draw2"){
    m.drawStack=safeNum(m.drawStack)+2;
    steps=1;
    action=`${mauMauPlayerName(playerId)} legt +2 · Stapel: ${m.drawStack}`;
  }else{
    m.drawStack=0;
  }
  m.direction=direction;
  m.turn=mauMauNextPlayer(order,playerId,direction,steps);
  m.lastAction=action;
}
function mauMauHandCardHtml(card,index,playable,isMyTurn,extraClass=""){
  const cls=`${playable&&isMyTurn?"playable":"unplayable"} ${extraClass}`.trim();
  return `<button type="button" class="maumau-card-btn" ${isMyTurn&&playable?`onclick="window.playMauMauCard(${index})"`:"disabled"}>${mauMauCardHtml(card,{className:cls})}</button>`;
}
function reconcileMauMauStatePatch(state){
  if(!state||state.gameType!=="maumau")return null;
  const players=state.players||{};
  const raw=state.maumau||{};
  const patch={};
  if((state.phase||"lobby")==="lobby"){
    const desiredOrder=Object.keys(players||{});
    const rawOrder=Array.isArray(raw.order)?raw.order.filter(id=>players[id]):[];
    if(raw.phase!=="lobby") patch["maumau/phase"]="lobby";
    if(JSON.stringify(rawOrder)!==JSON.stringify(desiredOrder)) patch["maumau/order"]=desiredOrder;
    if(raw.turn!=null) patch["maumau/turn"]=null;
    if(raw.activeColor) patch["maumau/activeColor"]="";
    if(raw.drawnThisTurn!=null) patch["maumau/drawnThisTurn"]=null;
    if(safeNum(raw.drawStack)!==0) patch["maumau/drawStack"]=0;
    if(raw.mauCalled!=null) patch["maumau/mauCalled"]=null;
    if(raw.drawPile!=null) patch["maumau/drawPile"]=null;
    if(raw.discardPile!=null) patch["maumau/discardPile"]=null;
    if(raw.hands!=null) patch["maumau/hands"]=null;
    if(raw.winner!=null) patch["maumau/winner"]=null;
    if(raw.lastAction) patch["maumau/lastAction"]="";
    return Object.keys(patch).length?patch:null;
  }
  return null;
}
function reconcileBattleshipSeatsPatch(state){ 
  if(!state||state.gameType!=="battleship")return null;
  const players=state.players||{};
  const ids=Object.keys(players);
  if(ids.length===0)return null;
  const bs=state.battleship||{};
  const seats={...(bs.seats||{})};
  let changed=false;
  let resetGame=false;

  if(!seats.p1||!players[seats.p1]){
    seats.p1=(state.host&&players[state.host])?state.host:ids[0];
    changed=true;
    resetGame=true;
  }
  if(seats.p2&&!players[seats.p2]){
    seats.p2=null;
    changed=true;
    resetGame=true;
  }
  if(seats.p2===seats.p1){
    seats.p2=null;
    changed=true;
    resetGame=true;
  }
  // Anders als bei Vier gewinnt bleiben freie Plätze bei Schiffe versenken frei,
  // damit Spieler bewusst einen Platz übernehmen können.
  if(!changed)return null;

  const patch={"battleship/seats":seats};
  if(resetGame&&state.phase!=="lobby"){
    patch.phase="lobby";
    patch["battleship/phase"]="lobby";
    patch["battleship/boards"]={};
    patch["battleship/ready"]={};
    patch["battleship/turn"]="p1";
    patch["battleship/winner"]=null;
    patch["battleship/lastShot"]=null;
  }
  return patch;
}
function initialRoomData(){
  selectedGame=validGameId(selectedGame);
  return {
    gameType:selectedGame,
    host:myId, hostName:myName,
    players:{[myId]:playerRoomData(null,{})},
    cats:catsToObj(DEFAULT_CATS),
    roundDuration:90,
    roundLimit:0,
    validationMode:"vote",
    validationVotes:{},
    usedLetters:[],
    typingStatus:{},
    allowBuzzer:true,
    phase:"lobby", round:0, letter:"",
    letterRevealStartTs:null, letterRevealUntil:null,
    buzzer:null, buzzerTs:null, collectUntil:null, stopRequest:null,
    roundAnswers:{}, liveAnswers:{}, finalAnswers:{}, rejections:{}, submittedStatus:{}, roundStartTs:null,
    connect4:selectedGame==="connect4"?initialConnect4State():null,
    battleship:selectedGame==="battleship"?initialBattleshipState():null,
    kniffel:selectedGame==="kniffel"?initialKniffelState():null,
    drawing:selectedGame==="drawing"?initialDrawingState():null,
    maumau:selectedGame==="maumau"?initialMauMauState():null,
    createdAt:Date.now()
  };
}
function updateInviteUrl(room){
  try{
    const url=new URL(location.href);
    url.searchParams.set("room",room);
    history.replaceState(null,"",url);
  }catch(e){}
}
function clearInviteUrl(){
  try{
    const url=new URL(location.href);
    url.searchParams.delete("room");
    history.replaceState(null,"",url);
  }catch(e){}
}
function getInviteUrl(room=myRoom){
  const code=normalizeRoomCode(room);
  try{
    const url=new URL(location.href);
    if(code) url.searchParams.set("room",code);
    else url.searchParams.delete("room");
    url.hash="";
    return url.toString();
  }catch(e){
    const base=`${location.origin||""}${location.pathname||""}`;
    return code?`${base}?room=${encodeURIComponent(code)}`:base;
  }
}
let inviteFeedbackTimer=null;
function setInviteFeedback(msg,type=""){
  const el=document.getElementById("invite-feedback");
  if(!el)return;
  if(inviteFeedbackTimer){clearTimeout(inviteFeedbackTimer);inviteFeedbackTimer=null;}
  el.textContent=msg||"";
  el.classList.toggle("good",type==="good");
  el.classList.toggle("error",type==="error");
  if(msg){
    inviteFeedbackTimer=setTimeout(()=>{
      const cur=document.getElementById("invite-feedback");
      if(cur){
        cur.textContent="";
        cur.classList.remove("good","error");
      }
      inviteFeedbackTimer=null;
    },3500);
  }
}
async function copyTextToClipboard(text){
  if(navigator.clipboard?.writeText && window.isSecureContext!==false){
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta=document.createElement("textarea");
  ta.value=text;
  ta.setAttribute("readonly","");
  ta.style.position="fixed";
  ta.style.left="-9999px";
  ta.style.top="0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  const ok=document.execCommand("copy");
  document.body.removeChild(ta);
  if(!ok)throw new Error("copy failed");
}
window.shareRoomLink=async function(){
  const code=normalizeRoomCode(myRoom||document.getElementById("display-roomcode")?.textContent||"");
  if(!code){setInviteFeedback("Noch kein Raum aktiv.","error");return;}
  const url=getInviteUrl(code);
  const gameName=GAMES[gameState?.gameType||selectedGame]?.name||"Spiel";
  const shareTitle=`${gameName} mitspielen`;
  const shareText=`Komm in meinen Raum ${code}.`;
  if(navigator.share){
    try{
      await navigator.share({title:shareTitle,text:shareText,url});
      setInviteFeedback("Teilen geöffnet.","good");
      return;
    }catch(e){
      if(e?.name==="AbortError")return;
    }
  }
  try{
    await copyTextToClipboard(url);
    setInviteFeedback("Link kopiert.","good");
  }catch(e){
    setInviteFeedback(url,"");
  }
};
async function finishRoomConnection(){
  sessionStorage.setItem("slf_name",myName);
  sessionStorage.setItem("slf_room",myRoom);
  sessionStorage.setItem("slf_id",myId);
  sessionStorage.setItem(SELECTED_GAME_SESSION_KEY,selectedGame);
  updateInviteUrl(myRoom);
  setInviteFeedback("");
  startHeartbeat();
  if(roomListener)roomListener();
  prevBuzzerValue=null;
  roomListener=onValue(roomRef(),snap=>{if(snap.exists())processStateUpdate(snap.val());});
  setJoinBusy(false);
  showError("");
}

window.createRoom=async function(){
  try { getAudioCtx(); } catch(e) {}
  selectedGame=validGameId(selectedGame);
  sessionStorage.setItem(SELECTED_GAME_SESSION_KEY,selectedGame);
  myName=document.getElementById("input-name").value.trim();
  if(!myName){
    const el=document.getElementById("join-error");
    if(el){el.textContent="Bitte zuerst deinen Namen eingeben.";el.style.display="block";}
    return;
  }
  let connected=false;
  setJoinBusy(true);
  showError("Erstelle Raum…");
  try{
    for(let attempt=0;attempt<12;attempt++){
      const code=generateRoomCode();
      const snap=await get(ref(db,`rooms/${code}`));
      let existing=snap.exists()?snap.val():null;
      if(existing?.createdAt&&Date.now()-existing.createdAt>ROOM_EXPIRY_MS)existing=null;
      if(existing)continue;
      myRoom=code;
      isHost=true;
      document.getElementById("input-room").value=code;
      await set(roomRef(),initialRoomData());
      await finishRoomConnection();
      connected=true;
      return;
    }
    showError("Konnte keinen freien Raum-Code finden. Bitte nochmal versuchen.");
  }catch(e){
    showError("Fehler: "+e.message);
  }finally{
    if(!connected){
      myRoom="";
      isHost=false;
      setJoinBusy(false);
    }
  }
};

window.joinExistingRoom=async function(opts={}){
  try { getAudioCtx(); } catch(e) {}
  myName=document.getElementById("input-name").value.trim();
  myRoom=normalizeRoomCode(document.getElementById("input-room").value);
  document.getElementById("input-room").value=myRoom;
  if(!myName||!myRoom){showError("Bitte Name und Raum-Code eingeben.");return;}
  setJoinBusy(true);
  showError(opts.auto?"Verbinde erneut…":"Trete Raum bei…");
  try{
    const snap=await get(roomRef());
    let existing=snap.exists()?snap.val():null;
    if(existing?.createdAt&&Date.now()-existing.createdAt>ROOM_EXPIRY_MS)existing=null;
    if(!existing){
      if(opts.auto){
        clearJoinSession();
        showError("Gespeicherter Raum existiert nicht mehr. Erstelle einen neuen Raum oder tritt einem bestehenden Raum bei.");
      }else{
        showError("Diesen Raum gibt es nicht. Prüfe den Code oder erstelle einen neuen Raum.");
      }
      setJoinBusy(false);
      return;
    }
    const roomGame=existing.gameType||"slf";
    if(!GAMES[roomGame]?.enabled){
      showError("Dieses Spiel wird von dieser Version nicht unterstützt.");
      setJoinBusy(false);
      return;
    }
    selectedGame=roomGame;
    sessionStorage.setItem(SELECTED_GAME_SESSION_KEY,selectedGame);
    updateJoinScreen();
    if(roomGame==="kniffel"&&!existing.players?.[myId]&&Object.keys(existing.players||{}).length>=KNIFFEL_MAX_PLAYERS){
      showError(`Kniffel ist voll (${KNIFFEL_MAX_PLAYERS} Spieler).`);
      setJoinBusy(false);
      return;
    }
    if(roomGame==="drawing"&&!existing.players?.[myId]&&Object.keys(existing.players||{}).length>=DRAWING_MAX_PLAYERS){
      showError(`Montagsmaler ist voll (${DRAWING_MAX_PLAYERS} Spieler).`);
      setJoinBusy(false);
      return;
    }
    if(roomGame==="maumau"&&!existing.players?.[myId]&&Object.keys(existing.players||{}).length>=MAUMAU_MAX_PLAYERS){
      showError(`Mau Mau ist voll (${MAUMAU_MAX_PLAYERS} Spieler).`);
      setJoinBusy(false);
      return;
    }
    isHost=existing.host===myId;
    const patch={[`players/${myId}`]:playerRoomData(existing.players?.[myId]||null,existing.players||{})};
    if(roomGame==="connect4"){
      const seats=existing.connect4?.seats||{};
      if(!seats.red) patch[`connect4/seats/red`]=existing.host||myId;
      if(myId!==seats.red && !seats.yellow) patch[`connect4/seats/yellow`]=myId;
    }
    if(roomGame==="battleship"){
      const seats=existing.battleship?.seats||{};
      if(!seats.p1) patch[`battleship/seats/p1`]=existing.host||myId;
      if(myId!==seats.p1 && !seats.p2) patch[`battleship/seats/p2`]=myId;
    }
    if(roomGame==="kniffel"&&!existing.kniffel){
      patch.kniffel=initialKniffelState();
    }
    if(roomGame==="drawing"&&!existing.drawing){
      patch.drawing=initialDrawingState();
    }
    if(roomGame==="maumau"&&!existing.maumau){
      patch.maumau=initialMauMauState();
    }
    await updateRoomData(patch);
    await finishRoomConnection();
  }catch(e){
    showError("Fehler: "+e.message);
    setJoinBusy(false);
  }
};
window.joinRoom=window.joinExistingRoom;

function remainingPlayersWithout(pid){
  const players={...(gameState?.players||{})};
  delete players[pid];
  return players;
}
function cleanupLocalRoomAfterRemoval(){
  stopRoundTimer();
  stopCollectingTimer();
  stopStoppingTimer();
  stopDrawingTimer();
  if(localBuzzerCountdown)clearInterval(localBuzzerCountdown);
  if(kniffelRollTimer){clearTimeout(kniffelRollTimer);kniffelRollTimer=null;}
  if(drawingSyncTimer){clearTimeout(drawingSyncTimer);drawingSyncTimer=null;}
  if(drawingTickTimer){clearTimeout(drawingTickTimer);drawingTickTimer=null;}
  drawingActiveStrokeId=null;
  drawingActiveStroke=null;
  drawingPendingStrokes={};
  mauMauPendingWildIndex=null;
  if(heartbeatInterval){clearInterval(heartbeatInterval);heartbeatInterval=null;}
  if(roomListener){const off=roomListener;roomListener=null;try{off();}catch(e){}}
  clearJoinSession();
  myName=""; myRoom=""; gameState=null; isHost=false; prevBuzzerValue=null;
  setJoinBusy(false);
  clearInviteUrl();
  selectedGame="slf";
  updateJoinScreen();
  showScreen("home");
}
window.kickPlayer=async function(pid){
  if(!isHost||!gameState||gameState.phase!=="lobby"||!pid||pid===myId||!gameState.players?.[pid])return;
  const patch={[`players/${pid}`]:null,[`typingStatus/${pid}`]:null};
  const type=gameState.gameType||"slf";
  const remaining=remainingPlayersWithout(pid);
  if(type==="connect4"){
    const seats=gameState.connect4?.seats||{};
    if(seats.red===pid) patch["connect4/seats/red"]=null;
    if(seats.yellow===pid) patch["connect4/seats/yellow"]=null;
  }else if(type==="battleship"){
    const seats=gameState.battleship?.seats||{};
    if(seats.p1===pid) patch["battleship/seats/p1"]=null;
    if(seats.p2===pid) patch["battleship/seats/p2"]=null;
  }else if(type==="kniffel"){
    patch.kniffel=initialKniffelState(Object.keys(remaining));
  }else if(type==="drawing"){
    patch.drawing=drawingLobbyStateForPlayers(remaining,gameState.drawing||{});
  }else if(type==="maumau"){
    patch.maumau=mauMauLobbyStateForPlayers(remaining,gameState.maumau||{});
  }
  await updateRoomData(patch);
};

window.leaveRoom=async function(){
  leavingRoom=true;
  stopRoundTimer();
  stopCollectingTimer();
  if(localBuzzerCountdown)clearInterval(localBuzzerCountdown);
  if(myRoom&&myId)try{await update(roomRef(),{[`typingStatus/${myId}`]:null});}catch(e){}
  if(myRoom&&myId)try{await update(roomRef(),{[`players/${myId}`]:null});}catch(e){}
  ["slf_name","slf_room","slf_id","slf_local_answers",SELECTED_GAME_SESSION_KEY].forEach(k=>sessionStorage.removeItem(k));
  if(heartbeatInterval)clearInterval(heartbeatInterval);
  if(roomListener)roomListener();
  myName="";myRoom="";gameState=null;prevBuzzerValue=null;
  setJoinBusy(false);
  clearInviteUrl();
  document.getElementById("join-error").style.display="none";
  selectedGame="slf";
  updateJoinScreen();
  showScreen("home");
  leavingRoom=false;
};
window.handleBackButton=async function(){
  if(currentScreen==="home") return;
  if(currentScreen==="join"){
    window.backToHome();
    return;
  }
  if(!gameState||gameState.phase==="lobby"){
    await window.leaveRoom();
    return;
  }
  stopRoundTimer();
  stopCollectingTimer();
  stopStoppingTimer();
  const type=gameState.gameType||"slf";
  if(type==="connect4"){
    const c4=gameState.connect4||initialConnect4State();
    const starter=connect4StarterForNextRound(c4);
    await updateRoomData({
      phase:"lobby",
      connect4:{...c4,board:emptyConnect4Board(),turn:starter,winner:null,winCells:[],lastMove:null,moveCount:0,nextStarter:starter}
    });
  }else if(type==="battleship"){
    const bs=gameState.battleship||initialBattleshipState();
    await updateRoomData({
      phase:"lobby",
      battleship:{...bs,phase:"lobby",boards:{},ready:{},turn:"p1",winner:null,lastShot:null,ships:BATTLESHIP_SHIPS}
    });
  }else if(type==="kniffel"){
    await updateRoomData({
      phase:"lobby",
      kniffel:kniffelLobbyStateForPlayers(gameState.players||{})
    });
  }else if(type==="maumau"){
    mauMauPendingWildIndex=null;
    await updateRoomData({
      phase:"lobby",
      maumau:mauMauLobbyStateForPlayers(gameState.players||{},gameState.maumau||{})
    });
  }else if(type==="drawing"){
    if(drawingSyncTimer){clearTimeout(drawingSyncTimer);drawingSyncTimer=null;}
    if(drawingTickTimer){clearTimeout(drawingTickTimer);drawingTickTimer=null;}
    drawingActiveStrokeId=null;
    drawingActiveStroke=null;
    if(drawingSyncTimer){clearTimeout(drawingSyncTimer);drawingSyncTimer=null;}
    if(drawingTickTimer){clearTimeout(drawingTickTimer);drawingTickTimer=null;}
    stopDrawingTimer();
    drawingActiveStrokeId=null;
    drawingActiveStroke=null;
    drawingPendingStrokes={};
    await updateRoomData({
      phase:"lobby",
      drawing:drawingLobbyStateForPlayers(gameState.players||{},gameState.drawing||{})
    });
  }else if(type==="maumau"){
    await updateRoomData({
      phase:"lobby",
      maumau:mauMauLobbyStateForPlayers(gameState.players||{},gameState.maumau||{})
    });
  }else{
    resetRoundData();
    await updateRoomData({
      phase:"lobby",
      letterRevealStartTs:null,letterRevealUntil:null,
      buzzer:null,buzzerTs:null,collectUntil:null,stopUntil:null,stopRequest:null,
      roundAnswers:{},liveAnswers:{},finalAnswers:{},rejections:{},validationVotes:{},submittedStatus:{},
      roundStartTs:null,
      typingStatus:{}
    });
  }
};

function startHeartbeat(){
  if(heartbeatInterval)clearInterval(heartbeatInterval);
  heartbeatInterval=setInterval(async()=>{
    try{await update(playerRef(),{hb:Date.now()});}catch(e){}
    await checkAndMigrateHost();
  },10000);
}

// ─── STATE PROCESSING ────────────────────────────────────────────
async function processStateUpdate(newState){
  if(leavingRoom)return;
  if(myRoom&&newState?.players&&!newState.players[myId]){
    cleanupLocalRoomAfterRemoval();
    return;
  }
  const prevPhase=gameState?.phase;
  const prevBuzzer=prevBuzzerValue;
  newState=stabilizeConnect4State(newState);
  const kniffelPatch=newState?.gameType==="kniffel"?reconcileKniffelStatePatch(newState):null;
  const drawingPatch=newState?.gameType==="drawing"?reconcileDrawingStatePatch(newState):null;
  const mauMauPatch=newState?.gameType==="maumau"?reconcileMauMauStatePatch(newState):null;
  if(newState?.gameType==="kniffel"){
    newState={...newState,kniffel:normalizeKniffelState(newState.kniffel,newState.players||{})};
  }
  gameState=newState;
  isHost=gameState.host===myId;
  if((gameState.gameType||"slf")==="slf"&&gameState.phase==="playing"){
    const req=currentStopRequest(gameState);
    if(req&&(isHost||req.by===myId)){
      await applyStopRequest(req);
      return;
    }
  }
  if(isHost&&gameState.gameType==="connect4"){
    const seatPatch=reconcileConnect4SeatsPatch(gameState);
    if(seatPatch){
      await updateRoomData(seatPatch);
      return;
    }
  }
  if(isHost&&gameState.gameType==="battleship"){
    const seatPatch=reconcileBattleshipSeatsPatch(gameState);
    if(seatPatch){
      await updateRoomData(seatPatch);
      return;
    }
  }
  if(isHost&&gameState.gameType==="kniffel"&&kniffelPatch){
    await updateRoomData(kniffelPatch);
    return;
  }
  if(isHost&&gameState.gameType==="drawing"&&drawingPatch){
    await updateRoomData(drawingPatch);
    return;
  }
  if(isHost&&gameState.gameType==="maumau"&&mauMauPatch){
    await updateRoomData(mauMauPatch);
    return;
  }
  if(isHost){
    const now=Date.now();
    const stale=Object.entries(gameState.players||{})
      .filter(([id,p])=>id!==myId&&now-(p.hb||0)>PLAYER_STALE_MS)
      .map(([id])=>id);
    if(stale.length>0){
      const patch={};
      // Spieler nicht automatisch löschen: Namen/Scores bleiben sichtbar.
      // Nur veraltete Tipp-Indikatoren entfernen.
      stale.forEach(id=>{
        if(gameState.typingStatus?.[id]) patch[`typingStatus/${id}`]=null;
      });
      if(Object.keys(patch).length>0){
        await updateRoomData(patch);
        return;
      }
    }
  }
  if(gameState.phase==="playing" && prevPhase!=="playing" && (gameState.gameType||"slf")==="slf"){
    const backup=sessionStorage.getItem("slf_local_answers");
    const rk=String(gameState.round||0);
    const remoteAnswers=gameState.liveAnswers?.[rk]?.[myId]||gameState.roundAnswers?.[myId]||{};
    localAnswers=backup?{...remoteAnswers,...JSON.parse(backup)}:{...remoteAnswers};
    finalFlushed=false;
    finalFlushPromise=null;
    stopCollectingTimer();
    startRoundTimerClient();
    playSoundRoundStart();
    animateLetterShuffle(gameState.letter);
  }
  if(gameState.phase==="collecting" && prevPhase!=="collecting"){
    stopRoundTimer();
    startCollectingTimerClient();
  }
  if(gameState.phase==="stopping" && prevPhase!=="stopping"){
    stopRoundTimer();
    flushFinalAnswersNow();
    startStoppingTimerClient();
  }
  if(gameState.phase!=="playing" && gameState.phase!=="collecting" && gameState.phase!=="stopping"){
    stopRoundTimer();
    stopCollectingTimer();
    stopStoppingTimer();
  }
  if(gameState.buzzer && gameState.buzzer!==prevBuzzer){
    prevBuzzerValue=gameState.buzzer;
    playSoundBuzzer();
    if(gameState.phase==="playing"||gameState.phase==="collecting"||gameState.phase==="stopping") triggerLocalBuzzerTicker();
  } else if(!gameState.buzzer){
    prevBuzzerValue=null;
  }
  syncUIWithPhase();
}

function syncUIWithPhase(){
  if(!gameState)return;
  const p=gameState.phase;
  const isNewPhase = p !== syncedPhase;
  syncedPhase = p;
  if(p==="lobby"){
    stopLetterRevealTimer();
    stopDrawingTimer();
    if(isNewPhase) resetRoundData(); // nur bei echtem Phasenwechsel zurücksetzen
    showScreen("lobby");
    renderLobby();
    playLobbyMusic();
  } else if(p==="playing"||p==="collecting"||p==="stopping"){
    showScreen("playing");
    renderPlaying();
    if(p==="playing") playGameMusic();
    if((gameState.gameType||"slf")==="drawing"&&p==="playing") startDrawingTimerClient();
    else stopDrawingTimer();
    if(p==="collecting"){ 
      stopRoundTimer();
      if(!submitted) submitAnswers();
      if(isNewPhase || (isHost && !collectingTimerInterval)) startCollectingTimerClient();
    }
    if(p==="stopping"){
      stopRoundTimer();
      flushFinalAnswersNow();
      if(isNewPhase || (isHost && !stoppingTimerInterval)) startStoppingTimerClient();
    }
    if(isHost&&(gameState.gameType||"slf")==="slf")checkHostRoundEnd();
  } else if(p==="results"){
    stopLetterRevealTimer();
    stopDrawingTimer();
    stopRoundTimer();
    stopCollectingTimer();
    stopStoppingTimer();
    if(localBuzzerCountdown)clearInterval(localBuzzerCountdown);
    showScreen("results");
    renderResults();
    playResultsMusic();
    const limit=gameState.roundLimit||0;
    if(limit>0&&gameState.round>=limit) setTimeout(playSoundGameOver, 600);
  }
}

function stopLetterRevealTimer(){
  if(letterRevealTimer){
    clearTimeout(letterRevealTimer);
    letterRevealTimer=null;
  }
}
function letterRevealActive(state=gameState){
  return !!((state?.gameType||"slf")==="slf"&&state?.phase==="playing"&&safeNum(state?.letterRevealUntil)>Date.now());
}
function letterRevealRemainingMs(state=gameState){
  return Math.max(0,safeNum(state?.letterRevealUntil)-Date.now());
}
function scheduleLetterRevealRender(){
  if(letterRevealTimer||!letterRevealActive())return;
  const remaining=letterRevealRemainingMs();
  letterRevealTimer=setTimeout(()=>{
    letterRevealTimer=null;
    if((gameState?.gameType||"slf")==="slf"&&gameState?.phase==="playing") renderPlaying();
  }, Math.max(35,Math.min(85,remaining+20)));
}
function renderLetterRevealOverlay(){
  const remaining=letterRevealRemainingMs();
  const showFinal=remaining<=420;
  const letter=showFinal?(gameState?.letter||""):(ALL_LETTERS[Math.floor(Math.random()*ALL_LETTERS.length)]||gameState?.letter||"A");
  return `<div class="letter-reveal-overlay">
    <div class="letter-reveal-card">
      <div class="letter-reveal-label">Buchstabe</div>
      <div class="letter-reveal-letter ${showFinal?"final":""}">${escHtml(letter)}</div>
    </div>
  </div>`;
}

function resetRoundData(){
  submitted=false;
  submitting=false;
  finalFlushed=false;
  finalFlushPromise=null;
  liveSaveQueued=false;
  liveSaveRunning=false;
  localAnswers={};
  lobbyEditorOpen=false;
  battleshipLocalRound=null;
  battleshipPlacedShips=[];
  battleshipOrientation="h";
  stopLetterRevealTimer();
  stopRoundTimer();
  stopCollectingTimer();
  stopStoppingTimer();
  sessionStorage.removeItem("slf_local_answers");
  if(localBuzzerCountdown)clearInterval(localBuzzerCountdown);
  localBuzzerCountdown=null;
  if(kniffelRollTimer){clearTimeout(kniffelRollTimer);kniffelRollTimer=null;}
  if(drawingSyncTimer){clearTimeout(drawingSyncTimer);drawingSyncTimer=null;}
  if(drawingTickTimer){clearTimeout(drawingTickTimer);drawingTickTimer=null;}
  stopDrawingTimer();
  drawingActiveStrokeId=null;
  drawingActiveStroke=null;
  drawingPendingStrokes={};
  visibleSuggestions=[];
}

// ─── TIMER ───────────────────────────────────────────────────────
function startRoundTimerClient(){
  stopRoundTimer();
  const dur=gameState?.roundDuration||0;
  if(!dur)return;
  const computeLeft=()=>{
    const startTs=safeNum(gameState?.roundStartTs)||Date.now();
    const elapsed=Math.max(0,Math.floor((Date.now()-startTs)/1000));
    return Math.max(0,dur-elapsed);
  };
  roundTimerSecondsLeft=computeLeft();
  renderTimerBar();
  roundTimerInterval=setInterval(async()=>{
    roundTimerSecondsLeft=computeLeft();
    renderTimerBar();
    if(roundTimerSecondsLeft===10) playSoundTimerUrgent();
    if(roundTimerSecondsLeft<=0){
      stopRoundTimer();
      if(isHost){
        const c=(await get(roomRef())).val();
        if(c?.phase==="playing") await enterStoppingPhase();
        else if(c?.phase==="stopping"||c?.phase==="collecting") await checkHostRoundEnd();
      } else {
        flushFinalAnswersNow();
      }
    }
  },1000);
}
function stopRoundTimer(){
  if(roundTimerInterval){clearInterval(roundTimerInterval);roundTimerInterval=null;}
  const a=document.getElementById("timer-bar-area");if(a)a.innerHTML="";
}
async function enterCollectingPhase(extraPatch={}){
  const now=Date.now();
  await updateRoomData({
    phase:"collecting",
    collectUntil:now+COLLECTING_MS,
    typingStatus:{},
    ...extraPatch
  });
}
function stopCollectingTimer(){
  if(collectingTimerInterval){clearInterval(collectingTimerInterval);collectingTimerInterval=null;}
}
async function enterStoppingPhase(extraPatch={}){
  const now=Date.now();
  await updateRoomData({
    phase:"stopping",
    stopUntil:now+STOPPING_MS,
    collectUntil:null,
    typingStatus:{},
    ...extraPatch
  });
}
function stopStoppingTimer(){
  if(stoppingTimerInterval){clearInterval(stoppingTimerInterval);stoppingTimerInterval=null;}
}
function startStoppingTimerClient(){
  stopStoppingTimer();
  if(!gameState||gameState.phase!=="stopping")return;
  flushFinalAnswersNow();
  if(!isHost)return;
  const check=async()=>{
    try{
      const cur=(await get(roomRef())).val();
      if(!cur||cur.phase!=="stopping"){stopStoppingTimer();return;}
      const active=activePlayerIds(cur);
      const rk=String(cur.round||0);
      const finals=cur.finalAnswers?.[rk]||{};
      const allFinal=active.length>0&&active.every(id=>finals[id]);
      const timedOut=Date.now()>=(cur.stopUntil||0);
      if(allFinal||timedOut){
        stopStoppingTimer();
        await forceRoundEnd(cur);
      }
    }catch(e){setConnStatus("err");}
  };
  check();
  stoppingTimerInterval=setInterval(check,150);
}
function activePlayerIds(state){
  return Object.entries(state?.players||{})
    .filter(([id,p])=>Date.now()-(p.hb||0)<PLAYER_STALE_MS)
    .map(([id])=>id);
}
function startCollectingTimerClient(){
  stopCollectingTimer();
  if(!gameState||gameState.phase!=="collecting")return;
  if(!submitted) window.submitAnswers();
  if(!isHost)return;
  const check=async()=>{
    try{
      const cur=(await get(roomRef())).val();
      if(!cur||cur.phase!=="collecting"){stopCollectingTimer();return;}
      const active=activePlayerIds(cur);
      const allSubmitted=active.length>0&&active.every(id=>cur.roundAnswers?.[id]);
      const timedOut=Date.now()>=(cur.collectUntil||0);
      if(allSubmitted||timedOut){
        stopCollectingTimer();
        await forceRoundEnd(cur);
      }
    }catch(e){setConnStatus("err");}
  };
  check();
  collectingTimerInterval=setInterval(check,400);
}
function renderTimerBar(){ 
  const a=document.getElementById("timer-bar-area");if(!a)return;
  if(letterRevealActive()){a.innerHTML="";return;}
  const dur=gameState?.roundDuration||0;if(!dur){a.innerHTML="";return;}
  const pct=Math.min(100,Math.max(0,(roundTimerSecondsLeft/dur)*100));
  const urgent=roundTimerSecondsLeft<=10;
  const m=Math.floor(roundTimerSecondsLeft/60),s=roundTimerSecondsLeft%60;
  const ts=m>0?`${m}:${String(s).padStart(2,"0")}`:`${s}s`;
  a.innerHTML=`
    <div class="timer-wrap">
      <div class="timer-head">
        <span class="timer-label">Zeit</span>
        <span class="timer-secs ${urgent?"urgent":""}">${ts}</span>
      </div>
      <div class="timer-track">
        <div class="timer-fill ${urgent?"urgent":""}" style="width:${pct}%"></div>
      </div>
    </div>`;
}

// ─── LOBBY ───────────────────────────────────────────────────────
function formatLobbyDuration(seconds){
  const dur=safeNum(seconds);
  if(!dur)return "Kein Timer";
  if(dur<60)return `${dur}s`;
  return `${Math.floor(dur/60)}:${String(dur%60).padStart(2,"0")} min`;
}
function lobbySeatCount(seats={},roles=[]){
  return roles.filter(role=>{
    const id=seats?.[role];
    return !!(id&&gameState?.players?.[id]);
  }).length;
}
function lobbyOverviewData(state=gameState){
  const type=state?.gameType||"slf";
  const players=state?.players||{};
  const count=Object.keys(players).length;
  const game=GAMES[type]||GAMES.slf;
  let status={text:`${count} Spieler`,ready:count>0};
  let pills=[];

  if(type==="slf"){
    const cats=objToCats(state.cats);
    const dur=state.roundDuration??90;
    const roundLimit=state.roundLimit??0;
    const validationMode=state.validationMode||"vote";
    const used=(state.usedLetters||[]).length;
    status={text:`${count} Spieler`,ready:count>0};
    pills=[
      `${cats.length} Kategorien`,
      formatLobbyDuration(dur),
      roundLimit===0?"∞ Runden":`${roundLimit} Runden`,
      validationMode==="vote"?"Auswertung: Abstimmung":"Auswertung: Host",
      `${used}/${ALL_LETTERS.length} Buchstaben gespielt`
    ];
  }else if(type==="connect4"){
    const seats=state.connect4?.seats||{};
    const filled=lobbySeatCount(seats,["red","yellow"]);
    status={text:`${filled}/2 Plätze`,ready:filled>=2};
    pills=["2 Spieler", "4 in einer Reihe", "Start: zuerst zufällig", "Verlierer startet nächste Runde"];
  }else if(type==="battleship"){
    const seats=state.battleship?.seats||{};
    const filled=lobbySeatCount(seats,["p1","p2"]);
    const ships=state.battleship?.ships||BATTLESHIP_SHIPS;
    status={text:`${filled}/2 Flotten`,ready:filled>=2};
    pills=["2 Spieler", `${ships.length} Schiffe`, `Flotte: ${ships.join("/")}`, "Treffer: nochmal"];
  }else if(type==="kniffel"){
    status={text:`${count}/${KNIFFEL_MAX_PLAYERS} Spieler`,ready:count>=1&&count<=KNIFFEL_MAX_PLAYERS};
    pills=["5 Würfel", "3 Würfe pro Zug", "13 Felder", "Bonus ab 63 oben"];
  }else if(type==="drawing"){
    const mode=drawingWordMode(state.drawing?.wordMode||"mixed");
    const dur=Math.max(30,Math.min(300,safeNum(state.drawing?.roundDuration)||DRAWING_DEFAULT_DURATION));
    status={text:`${count}/${DRAWING_MAX_PLAYERS} Spieler`,ready:count>=DRAWING_MIN_PLAYERS&&count<=DRAWING_MAX_PLAYERS};
    pills=[`${dur}s`, `Wörter: ${DRAWING_WORD_MODE_LABELS[mode]||"Gemischt"}`, "Zeichnen", "Raten"];
  }else if(type==="maumau"){
    status={text:`${count}/${MAUMAU_MAX_PLAYERS} Spieler`,ready:count>=MAUMAU_MIN_PLAYERS&&count<=MAUMAU_MAX_PLAYERS};
    pills=["7 Startkarten", "Zahlen 0–9", "Aussetzen", "+2 stapelbar", "Farbwahl"];
  }
  return {name:game.name,status,pills};
}
function renderLobbyGameOverview(){
  const el=document.getElementById("lobby-game-overview");
  if(!el)return;
  if(!gameState){el.innerHTML="";return;}
  const data=lobbyOverviewData(gameState);
  el.innerHTML=`
    <div class="lobby-game-overview-card">
      <div class="lobby-game-overview-top">
        <div>
          <div class="lobby-eyebrow">Aktuelles Spiel</div>
          <div class="lobby-game-overview-name">${escHtml(data.name)}</div>
        </div>
        <div class="lobby-player-pill ${data.status.ready?"ready":""}">${escHtml(data.status.text)}</div>
      </div>
      <div class="lobby-overview-pills">
        ${data.pills.map(p=>`<span class="lobby-overview-pill">${escHtml(p)}</span>`).join("")}
      </div>
    </div>`;
}
function lobbyWaitHtml(text="Warte auf den Host"){
  return `<div class="lobby-wait-card"><span class="pulse-dot"></span><span>${escHtml(text)}</span></div>`;
}
function lobbyHostPanelHtml({title="Host-Bereich",subtitle="",actions="",hint=""}={}){
  return `<div class="lobby-host-panel">
    <div class="lobby-host-head">
      <div class="lobby-section-title">Host</div>
      <div class="lobby-host-title">${escHtml(title)}</div>
      ${subtitle?`<div class="lobby-host-sub">${escHtml(subtitle)}</div>`:""}
    </div>
    <div class="lobby-host-buttons">${actions||""}</div>
    ${hint?`<div class="lobby-host-hint">${escHtml(hint)}</div>`:""}
  </div>`;
}
function renderLobby(){
  renderLobbyGameOverview();
  if(gameState?.gameType==="connect4") return renderConnect4Lobby();
  if(gameState?.gameType==="battleship") return renderBattleshipLobby();
  if(gameState?.gameType==="kniffel") return renderKniffelLobby();
  if(gameState?.gameType==="drawing") return renderDrawingLobby();
  if(gameState?.gameType==="maumau") return renderMauMauLobby();
  return renderSlfLobby();
}

function renderSlfLobby(){
  if(!gameState)return;
  document.getElementById("display-roomcode").textContent=myRoom;
  const hb=document.getElementById("host-badge");
  if(hb)hb.style.display=isHost?"block":"none";

  const now=Date.now();
  const cats=objToCats(gameState.cats);
  const dur=gameState.roundDuration??90;
  const roundLimit=gameState.roundLimit??0;
  const validationMode=gameState.validationMode||"host";
  const usedLetters=gameState.usedLetters||[];
  const available=ALL_LETTERS.filter(l=>!usedLetters.includes(l));
  renderLobbyPlayers((id,p)=>`${safeNum(p.score)}P`);

  const summary=document.getElementById("lobby-summary-area");
  if(summary){
    summary.innerHTML=`
      <div class="lobby-summary-card">
        <div class="lobby-section-title">Kategorien</div>
        <div class="lobby-cats-line">${cats.map(c=>`<div class="cat-tag">${escHtml(c)}</div>`).join("")}</div>
      </div>`;
  }

  const editor=document.getElementById("lobby-editor-area");
  if(editor){
    if(isHost&&lobbyEditorOpen){
      editor.innerHTML=`
        <div class="lobby-editor">
          <div class="lobby-editor-group">
            <div class="lobby-editor-title">Kategorien</div>
            <div id="lobby-cats-list"></div>
            <div style="display:flex;gap:10px;margin-top:12px;align-items:stretch">
              <input type="text" id="lobby-cat-input" placeholder="Neue Kategorie…" maxlength="20"
                onkeydown="if(event.key==='Enter'){event.preventDefault();window.addCat();}"/>
              <button type="button" class="btn btn-outline btn-sm" onclick="window.addCat()">+</button>
            </div>
            <div class="suggestions-label">Vorschläge</div>
            <div class="cat-suggestions" id="cat-suggestions-list"></div>
          </div>
          <div class="lobby-editor-group">
            <div class="lobby-editor-title">Timer</div>
            <div class="timer-presets">
              ${TIMER_PRESETS.map(t=>{
                const lbl=t===0?"Kein":t<60?`${t}s`:`${t/60}min`;
                return`<button type="button" class="timer-preset ${dur===t?"active":""}" onclick="window.setTimer(${t})">${lbl}</button>`;
              }).join("")}
            </div>
            <div style="display:flex;gap:10px;align-items:stretch;margin-top:10px">
              <input type="number" id="timer-custom-input" min="10" max="600" placeholder="Sekunden…"
                style="max-width:160px"
                onkeydown="if(event.key==='Enter'){event.preventDefault();window.setCustomTimer();}"
                value="${!TIMER_PRESETS.includes(dur)&&dur>0?dur:''}"/>
              <button type="button" class="btn btn-outline btn-sm" onclick="window.setCustomTimer()">OK</button>
            </div>
          </div>
          <div class="lobby-editor-group">
            <div class="lobby-editor-title">Runden</div>
            <div class="round-presets">
              ${ROUND_PRESETS.map(r=>{
                const lbl=r===0?"∞":String(r);
                return`<button type="button" class="round-preset ${roundLimit===r?"active":""}" onclick="window.setRoundLimit(${r})" title="${r===0?"Unbegrenzt":r+' Runden'}">${lbl}</button>`;
              }).join("")}
            </div>
          </div>
          <div class="lobby-editor-group">
            <div class="lobby-editor-title">Auswertung</div>
            <div class="validation-presets">
              <button type="button" class="validation-preset ${validationMode==="host"?"active":""}" onclick="window.setValidationMode('host')">Host</button>
              <button type="button" class="validation-preset ${validationMode==="vote"?"active":""}" onclick="window.setValidationMode('vote')">Abstimmung</button>
            </div>
          </div>
        </div>`;
      document.getElementById("lobby-cats-list").innerHTML=cats.map((c,i)=>
        `<div class="cat-item">
          <span>${escHtml(c)}</span>
          <button type="button" class="cat-remove" onclick="window.removeCat(${i})">✕</button>
        </div>`).join("");
      renderSuggestionChips(cats);
    }else{
      editor.innerHTML="";
    }
  }

  const leftCount=available.length;
  const slfHostActions=`
    <button type="button" class="btn" onclick="window.startRound()" ${leftCount===0?"disabled":""}>
      Runde starten${gameState.round>0?` · ${gameState.round} gespielt`:""}
    </button>
    <button type="button" class="btn btn-outline" onclick="window.toggleLobbyEditor()">
      ${lobbyEditorOpen?"Einstellungen schließen":"Einstellungen bearbeiten"}
    </button>
    ${gameState.round>0?`<button type="button" class="btn btn-outline" onclick="window.resetLetters()">Buchstaben zurücksetzen</button>`:""}`;
  document.getElementById("lobby-host-area").innerHTML=isHost
    ?lobbyHostPanelHtml({
      title:"Runde vorbereiten",
      subtitle:lobbyEditorOpen?"Einstellungen sind geöffnet.":"Kategorien, Timer und Auswertung kannst du hier ändern.",
      actions:slfHostActions,
      hint:leftCount===0?"Alle Buchstaben gespielt. Setze sie zurück, um weiterzuspielen.":""
    })
    :lobbyWaitHtml();
}

window.toggleLobbyEditor=function(){
  if(!isHost)return;
  lobbyEditorOpen=!lobbyEditorOpen;
  renderLobby();
};

function battleshipPlayerName(id){
  return id?(gameState.players?.[id]?.name||"?"):"Wartet";
}
function renderBattleshipLobby(){
  if(!gameState)return;
  document.getElementById("display-roomcode").textContent=myRoom;
  const hb=document.getElementById("host-badge");
  if(hb)hb.style.display=isHost?"block":"none";
  const now=Date.now();
  const players=gameState.players||{};
  const bs=gameState.battleship||initialBattleshipState();
  const seats=bs.seats||{};
  const p1Id=seats.p1||gameState.host;
  const p2Id=seats.p2||null;
  const hitStreak=true;
  const myRole=battleshipRoleFor(gameState,myId);
  const spectatorIds=Object.keys(players).filter(id=>id!==p1Id&&id!==p2Id);
  const p1Action=(!p1Id&&myRole!=="p2")?`<button type="button" class="seat-action" onclick="window.takeBattleshipSeat('p1')">Übernehmen</button>`:`<span class="connect4-seat-role">Flotte 1</span>`;
  const p2Action=(!p2Id&&myRole!=="p1")?`<button type="button" class="seat-action" onclick="window.takeBattleshipSeat('p2')">Übernehmen</button>`:`<span class="connect4-seat-role">Flotte 2</span>`;

  renderLobbyPlayers((id,p)=>id===p1Id?"Flotte 1":id===p2Id?"Flotte 2":"Zuschauer");

  const summary=document.getElementById("lobby-summary-area");
  if(summary){
    summary.innerHTML=`
      <div class="connect4-seats">
        <div class="connect4-seat">
          <span class="connect4-seat-left"><span class="connect4-disc sea"></span><span class="connect4-seat-name">${escHtml(battleshipPlayerName(p1Id))}</span></span>
          ${p1Action}
        </div>
        <div class="connect4-seat">
          <span class="connect4-seat-left"><span class="connect4-disc navy"></span><span class="connect4-seat-name">${escHtml(battleshipPlayerName(p2Id))}</span></span>
          ${p2Action}
        </div>
      </div>
      ${spectatorIds.length?`<div class="connect4-spectators"><div class="lobby-section-title">Zuschauer</div><div class="lobby-cats-line">${spectatorIds.map(id=>`<div class="cat-tag">${escHtml(players[id]?.name||"?")}</div>`).join("")}</div></div>`:""}`;
  }
  const editor=document.getElementById("lobby-editor-area");
  if(editor) editor.innerHTML="";
  const canPrepare=!!p1Id&&!!p2Id&&!!players[p1Id]&&!!players[p2Id];
  const battleshipHostActions=`
    <button type="button" class="btn" ${canPrepare?"":"disabled"} onclick="window.startBattleshipPlacement()">
      ${canPrepare?"Flotte platzieren":"Warte auf zweiten Spieler"}
    </button>
    ${canPrepare?`<button type="button" class="btn btn-outline" onclick="window.swapBattleshipSeats()">Flotten tauschen</button>`:""}`;
  document.getElementById("lobby-host-area").innerHTML=isHost
    ?lobbyHostPanelHtml({
      title:"Flotten vorbereiten",
      subtitle:canPrepare?"Beide Flotten sind vergeben.":"Zwei Spieler müssen eine Flotte übernehmen.",
      actions:battleshipHostActions
    })
    :lobbyWaitHtml();
}

function renderMauMauLobby(){
  if(!gameState)return;
  document.getElementById("display-roomcode").textContent=myRoom;
  const hb=document.getElementById("host-badge");
  if(hb)hb.style.display=isHost?"block":"none";
  const now=Date.now();
  const players=gameState.players||{};
  const order=mauMauOrder(gameState);
  const playerCount=Object.keys(players).length;
  const canStart=playerCount>=MAUMAU_MIN_PLAYERS&&playerCount<=MAUMAU_MAX_PLAYERS;

  renderLobbyPlayers((id,p)=>`${safeNum(p.score)} Siege`);

  const summary=document.getElementById("lobby-summary-area");
  if(summary){
    summary.innerHTML=`
      <div class="lobby-summary-card">
        <div class="lobby-section-title">Reihenfolge</div>
        <div class="lobby-cats-line">${order.map((id,i)=>`<div class="cat-tag">${i+1}. ${escHtml(players[id]?.name||"?")}</div>`).join("")}</div>
      </div>`;
  }
  const editor=document.getElementById("lobby-editor-area");
  if(editor) editor.innerHTML="";
  const mauMauStartLabel=playerCount<MAUMAU_MIN_PLAYERS?`Warte auf ${MAUMAU_MIN_PLAYERS}. Spieler`:(playerCount>MAUMAU_MAX_PLAYERS?"Zu viele Spieler":"Spiel starten");
  const mauMauHostActions=`<button type="button" class="btn" ${canStart?`onclick="window.startMauMauGame()"`:"disabled"}>${mauMauStartLabel}</button>`;
  document.getElementById("lobby-host-area").innerHTML=isHost
    ?lobbyHostPanelHtml({
      title:"Spiel starten",
      subtitle:canStart?"Alles bereit.":`Mau Mau braucht ${MAUMAU_MIN_PLAYERS} bis ${MAUMAU_MAX_PLAYERS} Spieler.`,
      actions:mauMauHostActions
    })
    :lobbyWaitHtml();
}
window.startMauMauGame=async function(){
  if(!isHost||!gameState||gameState.gameType!=="maumau")return;
  setConnStatus("sync");
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="maumau"||cur.phase!=="lobby")return;
      const order=Object.keys(cur.players||{});
      if(order.length<MAUMAU_MIN_PLAYERS||order.length>MAUMAU_MAX_PLAYERS)return;
      cur.maumau=mauMauRoundState(order,cur.maumau?.round||0);
      cur.phase="playing";
      return cur;
    });
    setConnStatus("ok");
  }catch(e){
    setConnStatus("err");
  }
};

function renderDrawingLobby(){
  if(!gameState)return;
  document.getElementById("display-roomcode").textContent=myRoom;
  const hb=document.getElementById("host-badge");
  if(hb)hb.style.display=isHost?"block":"none";
  const now=Date.now();
  const players=gameState.players||{};
  const order=drawingOrder(gameState);
  const playerCount=Object.keys(players).length;
  const canStart=playerCount>=DRAWING_MIN_PLAYERS&&playerCount<=DRAWING_MAX_PLAYERS;
  const wordMode=drawingWordMode(gameState.drawing?.wordMode||"mixed");
  const drawingDuration=Math.max(30,Math.min(300,safeNum(gameState.drawing?.roundDuration)||DRAWING_DEFAULT_DURATION));

  renderLobbyPlayers((id,p)=>`${safeNum(p.score)}P`);

  const summary=document.getElementById("lobby-summary-area");
  if(summary){
    summary.innerHTML=`
      <div class="lobby-summary-card">
        <div class="lobby-section-title">Zeichner-Reihenfolge</div>
        <div class="lobby-cats-line">${order.map((id,i)=>`<div class="cat-tag">${i+1}. ${escHtml(players[id]?.name||"?")}</div>`).join("")}</div>
      </div>`;
  }
  const editor=document.getElementById("lobby-editor-area");
  if(editor){
    editor.innerHTML=isHost?`
      <div class="lobby-editor">
        <div class="lobby-editor-group">
          <div class="lobby-editor-title">Wörter</div>
          <div class="validation-presets">
            ${Object.keys(DRAWING_WORD_PACKS).map(mode=>`<button type="button" class="validation-preset ${wordMode===mode?"active":""}" onclick="window.setDrawingWordMode('${mode}')">${escHtml(DRAWING_WORD_MODE_LABELS[mode]||mode)}</button>`).join("")}
          </div>
        </div>
        <div class="lobby-editor-group">
          <div class="lobby-editor-title">Zeit</div>
          <div class="timer-presets">
            ${DRAWING_TIMER_PRESETS.map(sec=>`<button type="button" class="timer-preset ${drawingDuration===sec?"active":""}" onclick="window.setDrawingDuration(${sec})">${sec}s</button>`).join("")}
          </div>
        </div>
      </div>`:"";
  }
  const drawingStartLabel=playerCount<DRAWING_MIN_PLAYERS?`Warte auf ${DRAWING_MIN_PLAYERS}. Spieler`:(playerCount>DRAWING_MAX_PLAYERS?"Zu viele Spieler":"Spiel starten");
  const drawingHostActions=`<button type="button" class="btn" ${canStart?`onclick="window.startDrawingGame()"`:"disabled"}>${drawingStartLabel}</button>`;
  document.getElementById("lobby-host-area").innerHTML=isHost
    ?lobbyHostPanelHtml({
      title:"Runde vorbereiten",
      subtitle:canStart?"Wörterpaket und Zeit können oben geändert werden.":`Montagsmaler braucht ${DRAWING_MIN_PLAYERS} bis ${DRAWING_MAX_PLAYERS} Spieler.`,
      actions:drawingHostActions
    })
    :lobbyWaitHtml();
}
window.setDrawingWordMode=async function(mode){
  if(!isHost||!gameState||gameState.gameType!=="drawing"||gameState.phase!=="lobby")return;
  mode=drawingWordMode(mode);
  await updateRoomData({
    "drawing/wordMode":mode,
    "drawing/usedWords":[]
  });
};
window.setDrawingDuration=async function(seconds){
  if(!isHost||!gameState||gameState.gameType!=="drawing"||gameState.phase!=="lobby")return;
  seconds=Math.max(30,Math.min(300,Math.floor(safeNum(seconds))));
  if(!DRAWING_TIMER_PRESETS.includes(seconds))return;
  await updateRoomData({"drawing/roundDuration":seconds});
};
function drawingRandomWord(){
  return DRAWING_WORDS[Math.floor(Math.random()*DRAWING_WORDS.length)]||"Haus";
}
function drawingFirstDrawer(order){
  const clean=(order||[]).filter(Boolean);
  if(!clean.length)return null;
  return clean[Math.floor(Math.random()*clean.length)];
}
window.startDrawingGame=async function(){
  if(!isHost||!gameState||gameState.gameType!=="drawing")return;
  setConnStatus("sync");
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="drawing"||cur.phase!=="lobby")return;
      const order=Object.keys(cur.players||{});
      if(order.length<DRAWING_MIN_PLAYERS||order.length>DRAWING_MAX_PLAYERS)return;
      cur.drawing=drawingRoundState(order,cur.drawing?.round||0,drawingFirstDrawer(order),cur.drawing||{});
      cur.phase="playing";
      return cur;
    });
    setConnStatus("ok");
  }catch(e){
    setConnStatus("err");
  }
};

function kniffelPlayerName(id){
  return id?(gameState.players?.[id]?.name||"?"):"?";
}
function renderKniffelLobby(){
  if(!gameState)return;
  document.getElementById("display-roomcode").textContent=myRoom;
  const hb=document.getElementById("host-badge");
  if(hb)hb.style.display=isHost?"block":"none";
  const now=Date.now();
  const players=gameState.players||{};
  const order=kniffelOrder(gameState);
  const playerCount=Object.keys(players).length;
  const canStart=playerCount>=1&&playerCount<=KNIFFEL_MAX_PLAYERS;

  renderLobbyPlayers((id,p)=>`${safeNum(p.score)} Siege`);

  const summary=document.getElementById("lobby-summary-area");
  if(summary){
    summary.innerHTML=`
      <div class="lobby-summary-card">
        <div class="lobby-section-title">Reihenfolge</div>
        <div class="lobby-cats-line">${order.map((id,i)=>`<div class="cat-tag">${i+1}. ${escHtml(players[id]?.name||"?")}</div>`).join("")}</div>
      </div>`;
  }
  const editor=document.getElementById("lobby-editor-area");
  if(editor) editor.innerHTML="";
  const kniffelHostActions=`<button type="button" class="btn" ${canStart?"":"disabled"} onclick="window.startKniffelGame()">${playerCount>KNIFFEL_MAX_PLAYERS?"Zu viele Spieler":"Spiel starten"}</button>`;
  document.getElementById("lobby-host-area").innerHTML=isHost
    ?lobbyHostPanelHtml({
      title:"Spiel starten",
      subtitle:canStart?"Alle Spieler kommen in die Reihenfolge.":"Es sind zu viele Spieler im Raum.",
      actions:kniffelHostActions,
      hint:playerCount>KNIFFEL_MAX_PLAYERS?`Kniffel geht bis ${KNIFFEL_MAX_PLAYERS} Spieler.`:""
    })
    :lobbyWaitHtml();
}

window.startKniffelGame=async function(){
  if(!isHost||!gameState||gameState.gameType!=="kniffel")return;
  setConnStatus("sync");
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="kniffel"||cur.phase!=="lobby")return;
      const order=Object.keys(cur.players||{});
      if(order.length===0||order.length>KNIFFEL_MAX_PLAYERS)return;
      cur.kniffel={
        ...initialKniffelState(order),
        phase:"playing",
        turn:order[0],
        round:(cur.kniffel?.round||0)+1
      };
      cur.phase="playing";
      return cur;
    });
    setConnStatus("ok");
  }catch(e){
    setConnStatus("err");
  }
};

window.takeBattleshipSeat=async function(role){
  if(!gameState||gameState.gameType!=="battleship"||gameState.phase!=="lobby")return;
  if(!["p1","p2"].includes(role))return;
  setConnStatus("sync");
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="battleship"||cur.phase!=="lobby")return;
      if(!cur.players?.[myId])return;
      if(!cur.battleship)cur.battleship=initialBattleshipState();
      if(!cur.battleship.seats)cur.battleship.seats={};
      const seats=cur.battleship.seats;
      if(seats[role]&&seats[role]!==myId)return;
      if(role==="p1"&&seats.p2===myId)seats.p2=null;
      if(role==="p2"&&seats.p1===myId)seats.p1=null;
      seats[role]=myId;
      cur.battleship.boards={};
      cur.battleship.ready={};
      cur.battleship.phase="lobby";
      cur.battleship.turn="p1";
      cur.battleship.winner=null;
      cur.battleship.lastShot=null;
      return cur;
    });
    setConnStatus("ok");
  }catch(e){
    setConnStatus("err");
  }
};
window.swapBattleshipSeats=async function(){
  if(!isHost||!gameState||gameState.gameType!=="battleship"||gameState.phase!=="lobby")return;
  const bs=gameState.battleship||initialBattleshipState();
  const seats=bs.seats||{};
  if(!seats.p1||!seats.p2)return;
  await updateRoomData({
    "battleship/seats/p1":seats.p2,
    "battleship/seats/p2":seats.p1,
    "battleship/boards":{},
    "battleship/ready":{},
    "battleship/phase":"lobby",
    "battleship/turn":"p1",
    "battleship/winner":null,
    "battleship/lastShot":null
  });
};
window.toggleBattleshipHitRule=async function(){
  if(!isHost||!gameState||gameState.gameType!=="battleship"||gameState.phase!=="lobby")return;
  await updateRoomData({"battleship/hitStreak":true});
};
window.startBattleshipPlacement=async function(){
  if(!isHost||!gameState||gameState.gameType!=="battleship")return;
  const bs=gameState.battleship||initialBattleshipState();
  const seats=bs.seats||{};
  if(!seats.p1||!seats.p2||!gameState.players?.[seats.p1]||!gameState.players?.[seats.p2])return;
  await updateRoomData({
    phase:"playing",
    battleship:{
      ...bs,
      phase:"placing",
      boards:{},
      ready:{},
      turn:"p1",
      winner:null,
      lastShot:null,
      round:(bs.round||0)+1,
      ships:BATTLESHIP_SHIPS
    }
  });
};

function connect4PlayerName(id){
  return id?(gameState.players?.[id]?.name||"?"):"Wartet";
}
function renderConnect4Lobby(){
  if(!gameState)return;
  document.getElementById("display-roomcode").textContent=myRoom;
  const hb=document.getElementById("host-badge");
  if(hb)hb.style.display=isHost?"block":"none";
  const now=Date.now();
  const players=gameState.players||{};
  const c4=gameState.connect4||initialConnect4State();
  const seats=c4.seats||{};
  const redId=seats.red||gameState.host;
  const yellowId=seats.yellow||null;
  const spectatorIds=Object.keys(players).filter(id=>id!==redId&&id!==yellowId);

  renderLobbyPlayers((id,p)=>id===redId?"Rot":id===yellowId?"Gelb":"Zuschauer");

  const summary=document.getElementById("lobby-summary-area");
  if(summary){
    summary.innerHTML=`
      <div class="connect4-seats">
        <div class="connect4-seat">
          <span class="connect4-seat-left"><span class="connect4-disc red"></span><span class="connect4-seat-name">${escHtml(connect4PlayerName(redId))}</span></span>
          <span class="connect4-seat-role">Rot</span>
        </div>
        <div class="connect4-seat">
          <span class="connect4-seat-left"><span class="connect4-disc yellow"></span><span class="connect4-seat-name">${escHtml(connect4PlayerName(yellowId))}</span></span>
          <span class="connect4-seat-role">Gelb</span>
        </div>
      </div>
      ${spectatorIds.length?`<div class="connect4-spectators"><div class="lobby-section-title">Zuschauer</div><div class="lobby-cats-line">${spectatorIds.map(id=>`<div class="cat-tag">${escHtml(players[id]?.name||"?")}</div>`).join("")}</div></div>`:""}`;
  }
  const editor=document.getElementById("lobby-editor-area");
  if(editor) editor.innerHTML="";
  const canStart=!!redId&&!!yellowId&&!!players[redId]&&!!players[yellowId];
  const connect4HostActions=`
    <button type="button" class="btn" ${canStart?"":"disabled"} onclick="window.startConnect4Game()">
      ${canStart?"Spiel starten":"Warte auf zweiten Spieler"}
    </button>
    ${canStart?`<button type="button" class="btn btn-outline" onclick="window.swapConnect4Seats()">Farben tauschen</button>`:""}`;
  document.getElementById("lobby-host-area").innerHTML=isHost
    ?lobbyHostPanelHtml({
      title:"Spiel starten",
      subtitle:canStart?"Rot und Gelb sind vergeben.":"Es werden zwei Spieler gebraucht.",
      actions:connect4HostActions
    })
    :lobbyWaitHtml();
}
window.swapConnect4Seats=async function(){
  if(!isHost||!gameState||gameState.gameType!=="connect4"||gameState.phase!=="lobby")return;
  const c4=gameState.connect4||initialConnect4State();
  const seats=c4.seats||{};
  if(!seats.red||!seats.yellow)return;
  const swappedStarter=isConnect4Role(c4.nextStarter)?otherConnect4Turn(c4.nextStarter):c4.nextStarter;
  await updateRoomData({
    "connect4/seats/red":seats.yellow,
    "connect4/seats/yellow":seats.red,
    "connect4/board":emptyConnect4Board(),
    "connect4/turn":isConnect4Role(swappedStarter)?swappedStarter:"red",
    "connect4/winner":null,
    "connect4/winCells":[],
    "connect4/moveCount":0,
    "connect4/nextStarter":swappedStarter||null
  });
};
window.startConnect4Game=async function(){
  if(!isHost||!gameState||gameState.gameType!=="connect4")return;
  setConnStatus("sync");
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="connect4"||cur.phase!=="lobby")return;
      const c4=cur.connect4||{};
      const seats=c4.seats||{};
      if(!seats.red||!seats.yellow||!cur.players?.[seats.red]||!cur.players?.[seats.yellow])return;
      const starter=connect4StarterForNextRound(c4);
      cur.connect4={
        ...c4,
        board:emptyConnect4Board(),
        seats,
        turn:starter,
        winner:null,
        winCells:[],
        lastMove:null,
        moveCount:0,
        round:(c4.round||0)+1,
        nextStarter:null
      };
      cur.phase="playing";
      return cur;
    });
    setConnStatus("ok");
  }catch(e){
    setConnStatus("err");
  }
};

window.setTimer=async function(s){if(!isHost)return;await updateRoomData({roundDuration:s});};
window.setCustomTimer=async function(){
  if(!isHost)return;
  const v=parseInt(document.getElementById("timer-custom-input")?.value||"0",10);
  if(!v||v<10||v>600)return;
  await updateRoomData({roundDuration:v});
};
window.setRoundLimit=async function(r){if(!isHost)return;await updateRoomData({roundLimit:r});};
window.setValidationMode=async function(mode){
  if(!isHost||!["host","vote"].includes(mode))return;
  await updateRoomData({validationMode:mode,validationVotes:{},rejections:{}});
};
window.resetLetters=async function(){
  if(!isHost)return;
  await updateRoomData({usedLetters:[]});
};
let visibleSuggestions = [];
function fillVisibleSuggestions(usedLower){
  visibleSuggestions = visibleSuggestions.filter(s=>!usedLower.includes(s.toLowerCase()));
  const pool = CAT_SUGGESTIONS.filter(s=>
    !usedLower.includes(s.toLowerCase()) && !visibleSuggestions.includes(s)
  );
  for(let i=pool.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [pool[i],pool[j]]=[pool[j],pool[i]];
  }
  while(visibleSuggestions.length < 5 && pool.length > 0){
    visibleSuggestions.push(pool.shift());
  }
}
function renderSuggestionChips(currentCats){
  const usedLower = currentCats.map(c=>c.toLowerCase());
  fillVisibleSuggestions(usedLower);
  const sugEl = document.getElementById("cat-suggestions-list");
  if(!sugEl) return;
  const currentSpans = Array.from(sugEl.children);
  const newKeys      = visibleSuggestions;
  currentSpans.forEach(el=>{ if(!newKeys.includes(el.dataset.key)) el.remove(); });
  newKeys.forEach(s=>{
    if(!sugEl.querySelector(`[data-key="${CSS.escape(s)}"]`)){
      const span = document.createElement("span");
      span.className = "cat-suggestion";
      span.dataset.key = s;
      span.textContent = "+ " + s;
      span.onclick = ()=>window.addSuggestion(s);
      sugEl.appendChild(span);
    }
  });
  newKeys.forEach((s,i)=>{
    const el = sugEl.querySelector(`[data-key="${CSS.escape(s)}"]`);
    if(el && sugEl.children[i] !== el) sugEl.insertBefore(el, sugEl.children[i]||null);
  });

  // Hover-Bleed verhindern: nach DOM-Änderungen kurz Pointer-Events deaktivieren,
  // damit kein Hover-State auf neu positionierte Chips "übertragen" wird
  sugEl.style.pointerEvents = 'none';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    sugEl.style.pointerEvents = '';
  }));
}
window.addSuggestion=async function(s){
  if(!isHost)return;
  const cats=objToCats(gameState.cats);
  if(cats.map(c=>c.toLowerCase()).includes(s.toLowerCase()))return;
  visibleSuggestions = visibleSuggestions.filter(v=>v!==s);
  const usedLower = [...cats.map(c=>c.toLowerCase()), s.toLowerCase()];
  fillVisibleSuggestions(usedLower);
  cats.push(s);
  await updateRoomData({cats:catsToObj(cats)});
};
window.addCat=async function(){
  if(!isHost)return;
  const i=document.getElementById("lobby-cat-input");if(!i)return;
  const v=i.value.trim();i.value="";if(!v)return;
  const cats=objToCats(gameState.cats);
  if(cats.map(c=>c.toLowerCase()).includes(v.toLowerCase()))return;
  cats.push(v);await updateRoomData({cats:catsToObj(cats)});
};
window.removeCat=async function(idx){
  if(!isHost)return;
  const cats=objToCats(gameState.cats);if(cats.length<=1)return;
  cats.splice(idx,1);await updateRoomData({cats:catsToObj(cats)});
};
window.startRound=async function(){
  if(!isHost)return;
  const usedLetters=gameState.usedLetters||[];
  const available=ALL_LETTERS.filter(l=>!usedLetters.includes(l));
  if(available.length===0)return;
  const letter=available[Math.floor(Math.random()*available.length)];
  const newUsed=[...usedLetters,letter];
  const now=Date.now();
  const revealUntil=now+LETTER_REVEAL_MS;
  await updateRoomData({
    phase:"playing",
    round:(gameState.round||0)+1,
    letter,
    usedLetters:newUsed,
    letterRevealStartTs:now,
    letterRevealUntil:revealUntil,
    buzzer:null,
    buzzerTs:null,
    collectUntil:null,
    stopRequest:null,
    roundAnswers:{},
    liveAnswers:{},
    finalAnswers:{},
    rejections:{},
    validationVotes:{},
    submittedStatus:{},
    roundStartTs:revealUntil,
    typingStatus:{}
  });
};

function battleshipRoleFor(state,playerId){
  const seats=state?.battleship?.seats||{};
  if(playerId===seats.p1)return"p1";
  if(playerId===seats.p2)return"p2";
  return null;
}
function resetBattleshipLocal(round){
  battleshipLocalRound=round;
  battleshipPlacedShips=[];
  battleshipOrientation="h";
  battleshipSelectedShipId="s0";
}
function ensureBattleshipLocal(){
  const round=String(gameState?.battleship?.round||0);
  if(battleshipLocalRound!==round) resetBattleshipLocal(round);
}
function battleshipShipConfigs(){
  const sizes=gameState?.battleship?.ships||BATTLESHIP_SHIPS;
  return sizes.map((size,i)=>({id:`s${i}`,size}));
}
function battleshipSelectedConfig(){
  const configs=battleshipShipConfigs();
  return configs.find(c=>c.id===battleshipSelectedShipId)||configs[0];
}
function battleshipPlacedShip(id){
  return battleshipPlacedShips.find(s=>s.id===id)||null;
}
function battleshipShipAtCell(cell){
  return battleshipPlacedShips.find(s=>(s.cells||[]).includes(cell))||null;
}
function battleshipPlacedCells(excludeId=null){
  const taken=new Set();
  battleshipPlacedShips
    .filter(ship=>ship.id!==excludeId)
    .forEach(ship=>ship.cells.forEach(c=>taken.add(c)));
  return taken;
}
function battleshipCellsForPlacement(start,size,orientation){
  const row=Math.floor(start/10), col=start%10;
  const cells=[];
  for(let i=0;i<size;i++){
    const r=row+(orientation==="v"?i:0);
    const c=col+(orientation==="h"?i:0);
    if(r<0||r>=10||c<0||c>=10)return null;
    cells.push(r*10+c);
  }
  return cells;
}
function battleshipCanPlace(start,size,orientation,ignoreId=null){
  const cells=battleshipCellsForPlacement(start,size,orientation);
  if(!cells)return false;
  const taken=battleshipPlacedCells(ignoreId);
  return cells.every(c=>!taken.has(c));
}
function battleshipOrderedShips(ships,expectedSizes=BATTLESHIP_SHIPS){
  return expectedSizes.map((size,i)=>{
    const id=`s${i}`;
    return (ships||[]).find(s=>s?.id===id&&s.size===size)||null;
  });
}
function battleshipValidateShips(ships,expectedSizes){
  if(!Array.isArray(ships))return false;
  const ordered=battleshipOrderedShips(ships,expectedSizes);
  if(ordered.some(Boolean)===false)return false;
  const taken=new Set();
  for(let i=0;i<expectedSizes.length;i++){
    const ship=ordered[i];
    if(!ship||ship.size!==expectedSizes[i]||!Array.isArray(ship.cells)||ship.cells.length!==ship.size)return false;
    for(const c of ship.cells){
      if(!Number.isInteger(c)||c<0||c>=100||taken.has(c))return false;
      taken.add(c);
    }
  }
  return true;
}
function battleshipCellsFromShips(ships){
  const cells=new Set();
  (ships||[]).forEach(ship=>(ship.cells||[]).forEach(c=>cells.add(c)));
  return cells;
}
function battleshipShipSegmentClass(ships,cell){
  const ship=(ships||[]).find(s=>(s.cells||[]).includes(cell));
  if(!ship)return"";
  const cells=[...(ship.cells||[])].sort((a,b)=>a-b);
  if(cells.length<=1)return"ship ship-single";
  const horizontal=Math.floor(cells[0]/10)===Math.floor(cells[1]/10);
  const ordered=horizontal?cells.sort((a,b)=>(a%10)-(b%10)):cells.sort((a,b)=>Math.floor(a/10)-Math.floor(b/10));
  const idx=ordered.indexOf(cell);
  if(horizontal){
    if(idx===0)return"ship ship-h-start";
    if(idx===ordered.length-1)return"ship ship-h-end";
    return"ship ship-h-mid";
  }
  if(idx===0)return"ship ship-v-start";
  if(idx===ordered.length-1)return"ship ship-v-end";
  return"ship ship-v-mid";
}
function battleshipPreviewSegmentClass(cells,cell,orientation){
  if(!cells||!cells.includes(cell))return"";
  if(cells.length<=1)return"ship-single";
  const ordered=[...cells].sort((a,b)=>orientation==="h"?(a%10)-(b%10):Math.floor(a/10)-Math.floor(b/10));
  const idx=ordered.indexOf(cell);
  if(orientation==="h"){
    if(idx===0)return"ship-h-start";
    if(idx===ordered.length-1)return"ship-h-end";
    return"ship-h-mid";
  }
  if(idx===0)return"ship-v-start";
  if(idx===ordered.length-1)return"ship-v-end";
  return"ship-v-mid";
}
window.selectBattleshipShip=function(id){
  if(Date.now()<battleshipSuppressClickUntil&&id===battleshipSuppressClickShipId)return;
  const cfg=(battleshipShipConfigs()).find(c=>c.id===id);
  if(!cfg)return;
  if(battleshipSelectedShipId===id){
    window.rotateBattleshipShip(id);
    return;
  }
  battleshipSelectedShipId=id;
  const placed=battleshipPlacedShip(id);
  battleshipOrientation=placed?.orientation||battleshipOrientation||"h";
  renderBattleshipPlacing();
};
window.rotateBattleshipShip=function(id=battleshipSelectedShipId){
  const cfg=(battleshipShipConfigs()).find(c=>c.id===id);
  if(!cfg)return;
  battleshipSelectedShipId=id;
  const existing=battleshipPlacedShip(id);
  const currentOrientation=existing?.orientation||battleshipOrientation||"h";
  const next=currentOrientation==="h"?"v":"h";
  const warn=document.getElementById("battleship-warning");
  if(existing){
    const start=existing.start??existing.cells?.[0];
    if(battleshipCanPlace(start,cfg.size,next,id)){
      existing.orientation=next;
      existing.start=start;
      existing.cells=battleshipCellsForPlacement(start,cfg.size,next);
      battleshipOrientation=next;
      renderBattleshipPlacing();
    }else if(warn){
      warn.textContent="Drehen passt hier nicht.";
    }
  }else{
    battleshipOrientation=next;
    renderBattleshipPlacing();
  }
};
window.toggleBattleshipOrientation=function(){
  window.rotateBattleshipShip(battleshipSelectedShipId);
};
window.resetBattleshipPlacement=function(){
  resetBattleshipLocal(String(gameState?.battleship?.round||0));
  battleshipSuppressClickUntil=0;
  battleshipSuppressClickShipId=null;
  renderBattleshipPlacing();
};
window.placeBattleshipShip=function(cell){
  ensureBattleshipLocal();
  const cfg=battleshipSelectedConfig();
  const warn=document.getElementById("battleship-warning");
  if(!cfg)return;
  if(!battleshipCanPlace(cell,cfg.size,battleshipOrientation,cfg.id)){
    if(warn) warn.textContent="Passt hier nicht.";
    return;
  }
  const ship={id:cfg.id,size:cfg.size,start:cell,orientation:battleshipOrientation,cells:battleshipCellsForPlacement(cell,cfg.size,battleshipOrientation)};
  const idx=battleshipPlacedShips.findIndex(s=>s.id===cfg.id);
  if(idx>=0) battleshipPlacedShips[idx]=ship;
  else battleshipPlacedShips.push(ship);
  renderBattleshipPlacing();
};
function clearBattleshipPreview(){
  document.querySelectorAll(".battleship-cell.preview-valid,.battleship-cell.preview-invalid").forEach(el=>{
    el.classList.remove("preview-valid","preview-invalid","ship-single","ship-h-start","ship-h-mid","ship-h-end","ship-v-start","ship-v-mid","ship-v-end");
  });
}
function updateBattleshipPreview(cell, fallbackCell=cell){
  clearBattleshipPreview();
  const cfg=battleshipSelectedConfig();
  if(!cfg)return;
  const cells=battleshipCellsForPlacement(cell,cfg.size,battleshipOrientation);
  const valid=battleshipCanPlace(cell,cfg.size,battleshipOrientation,cfg.id);
  const previewCells=cells||[fallbackCell];
  previewCells.forEach(c=>{
    const el=document.querySelector(`.battleship-cell[data-cell="${c}"]`);
    if(el&&!el.classList.contains("ship")){
      const seg=cells?battleshipPreviewSegmentClass(cells,c,battleshipOrientation):"ship-single";
      el.classList.add(valid?"preview-valid":"preview-invalid",seg);
    }
  });
}
function battleshipCellFromPointer(e){
  const el=document.elementFromPoint?.(e.clientX,e.clientY)?.closest?.(".battleship-cell[data-cell]");
  if(!el||el.disabled)return null;
  const cell=Number(el.dataset.cell);
  return Number.isInteger(cell)?cell:null;
}
function battleshipDragStartCell(pointerCell){
  const delta=battleshipOrientation==="v"?10:1;
  return pointerCell-(battleshipDragOffset||0)*delta;
}
function startBattleshipShipDrag(id,e,grabCell=null){
  const cfg=(battleshipShipConfigs()).find(c=>c.id===id);
  if(!cfg)return;
  battleshipSelectedShipId=id;
  const placed=battleshipPlacedShip(id);
  battleshipOrientation=placed?.orientation||battleshipOrientation||"h";
  battleshipDragOffset=0;
  if(placed&&grabCell!=null){
    const ordered=[...(placed.cells||[])].sort((a,b)=>placed.orientation==="h"?(a%10)-(b%10):Math.floor(a/10)-Math.floor(b/10));
    battleshipDragOffset=Math.max(0,ordered.indexOf(grabCell));
  }
  battleshipDragging=true;
  battleshipDragShipId=id;
  battleshipDragCell=null;
  battleshipDragMoved=false;
  try{e.currentTarget?.setPointerCapture?.(e.pointerId);}catch(_e){}
}
function moveBattleshipShipDrag(e){
  if(!battleshipDragging||!battleshipDragShipId)return;
  const pointerCell=battleshipCellFromPointer(e);
  if(pointerCell!=null){
    const startCell=battleshipDragStartCell(pointerCell);
    battleshipDragMoved=true;
    if(startCell!==battleshipDragCell){
      battleshipDragCell=startCell;
      updateBattleshipPreview(startCell,pointerCell);
    }
  }
}
function endBattleshipShipDrag(e){
  if(!battleshipDragging||!battleshipDragShipId)return;
  const pointerCell=battleshipCellFromPointer(e);
  const cell=pointerCell!=null?battleshipDragStartCell(pointerCell):battleshipDragCell;
  const moved=battleshipDragMoved;
  battleshipDragging=false;
  battleshipDragShipId=null;
  battleshipDragCell=null;
  battleshipDragOffset=0;
  battleshipDragMoved=false;
  try{e.currentTarget?.releasePointerCapture?.(e.pointerId);}catch(_e){}
  if(moved&&cell!=null) finishBattleshipDrag(cell);
  else clearBattleshipPreview();
}
function finishBattleshipDrag(cell){
  if(cell==null)return;
  battleshipSuppressClickUntil=Date.now()+250;
  battleshipSuppressClickShipId=battleshipSelectedShipId;
  window.placeBattleshipShip(cell);
}
window.finishBattleshipPlacement=async function(){
  if(!gameState||gameState.gameType!=="battleship")return;
  ensureBattleshipLocal();
  const role=battleshipRoleFor(gameState,myId);
  const ships=gameState.battleship?.ships||BATTLESHIP_SHIPS;
  const warn=document.getElementById("battleship-warning");
  if(!role)return;
  if(!battleshipValidateShips(battleshipPlacedShips,ships)){
    if(warn) warn.textContent="Platziere zuerst alle Schiffe.";
    return;
  }
  const savedShips=battleshipOrderedShips(battleshipPlacedShips,ships).map(ship=>({id:ship.id,size:ship.size,start:ship.start,orientation:ship.orientation,cells:[...ship.cells]}));
  setConnStatus("sync");
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="battleship"||cur.phase!=="playing")return;
      if(cur.battleship?.phase!=="placing")return;
      const curRole=battleshipRoleFor(cur,myId);
      if(!curRole)return;
      const expected=cur.battleship?.ships||BATTLESHIP_SHIPS;
      if(!battleshipValidateShips(savedShips,expected))return;
      if(!cur.battleship.boards)cur.battleship.boards={};
      if(!cur.battleship.ready)cur.battleship.ready={};
      cur.battleship.boards[myId]={ships:savedShips,shotsReceived:{}};
      cur.battleship.ready[myId]=true;
      const seats=cur.battleship.seats||{};
      if(seats.p1&&seats.p2&&cur.battleship.ready[seats.p1]&&cur.battleship.ready[seats.p2]){
        cur.battleship.phase="battle";
        cur.battleship.turn="p1";
        cur.battleship.winner=null;
        cur.battleship.lastShot=null;
      }
      return cur;
    });
    setConnStatus("ok");
  }catch(e){
    setConnStatus("err");
  }
};
function battleshipShotsSet(boardData){
  const shots=boardData?.shotsReceived||{};
  if(Array.isArray(shots)) return new Set(shots.map(Number).filter(n=>Number.isInteger(n)));
  return new Set(Object.keys(shots).map(Number).filter(n=>Number.isInteger(n)&&shots[n]!==false));
}
function battleshipShipCells(boardData){
  return battleshipCellsFromShips(boardData?.ships||[]);
}
function battleshipAllShipsSunk(boardData){
  const shipCells=battleshipShipCells(boardData);
  const shots=battleshipShotsSet(boardData);
  return shipCells.size>0&&[...shipCells].every(c=>shots.has(c));
}
function battleshipSunkCells(boardData){
  const shots=battleshipShotsSet(boardData);
  const sunk=new Set();
  (boardData?.ships||[]).forEach(ship=>{
    const cells=ship.cells||[];
    if(cells.length>0&&cells.every(c=>shots.has(c))){
      cells.forEach(c=>sunk.add(c));
    }
  });
  return sunk;
}
function battleshipRemainingShips(boardData){
  const sunk=battleshipSunkCells(boardData);
  return (boardData?.ships||[]).filter(ship=>!(ship.cells||[]).every(c=>sunk.has(c))).length;
}
function battleshipGridHtml(renderCell){
  const cols=Array.from({length:10},(_,i)=>`<div class="battleship-coord">${i+1}</div>`).join("");
  const rows=Array.from({length:10},(_,r)=>`<div class="battleship-coord">${String.fromCharCode(65+r)}</div>`).join("");
  const cells=Array.from({length:100},(_,i)=>renderCell(i,Math.floor(i/10),i%10)).join("");
  return `<div class="battleship-coord-row">${cols}</div><div class="battleship-coord-col">${rows}</div><div class="battleship-grid">${cells}</div>`;
}
function battleshipBoardHtml({boardData, revealShips=false, title="", enemy=false, interactive=false}){
  const shipCells=battleshipShipCells(boardData);
  const shots=battleshipShotsSet(boardData);
  const sunkCells=battleshipSunkCells(boardData);
  return `<div class="battleship-board-wrap">
    ${title?`<div class="battleship-board-title">${escHtml(title)}</div>`:""}
    <div class="battleship-board ${enemy?"enemy":"own"}">
      ${battleshipGridHtml((i)=>{
        const isShip=shipCells.has(i);
        const wasShot=shots.has(i);
        const target=interactive&&!wasShot;
        const isSunk=sunkCells.has(i);
        const showShipShape=isShip&&(revealShips||isSunk);
        const seg=showShipShape?battleshipShipSegmentClass(boardData?.ships||[],i):"";
        const cls=wasShot?(isShip?`${seg} ${isSunk?"sunk":"hit"}`:"miss"):(revealShips&&isShip?seg:(target?"target":""));
        return `<button type="button" class="battleship-cell ${cls}" data-cell="${i}" ${target?"":"disabled"}></button>`;
      })}
    </div>
  </div>`;
}
function renderBattleshipPlaying(){
  const bs=gameState?.battleship||initialBattleshipState();
  if(bs.phase==="placing") return renderBattleshipPlacing();
  if(bs.phase==="battle") return renderBattleshipBattle();
  return renderBattleshipPlaceholder();
}
function renderBattleshipBattle(){
  const letterStage=document.querySelector(".letter-stage");
  if(letterStage) letterStage.style.display="none";
  const tiEl=document.getElementById("typing-indicators-area"); if(tiEl) tiEl.innerHTML="";
  const bEl=document.getElementById("buzzer-container"); if(bEl) bEl.innerHTML="";
  const cEl=document.getElementById("playing-content"); if(!cEl)return;
  const bs=gameState?.battleship||initialBattleshipState();
  const role=battleshipRoleFor(gameState,myId);
  const seats=bs.seats||{};
  const ownId=role?myId:null;
  const enemyId=role==="p1"?seats.p2:role==="p2"?seats.p1:null;
  const turnId=seats[bs.turn]||null;
  const turnName=battleshipPlayerName(turnId);

  if(!role){
    cEl.innerHTML=`<div class="battleship-game"><div class="battleship-panel"><div class="battleship-title">${escHtml(turnName)} ist dran</div><div class="battleship-sub">Du schaust zu</div></div></div>`;
    return;
  }

  const ownBoard=bs.boards?.[ownId]||{ships:[],shotsReceived:{}};
  const enemyBoard=bs.boards?.[enemyId]||{ships:[],shotsReceived:{}};
  const isMyTurn=turnId===myId;
  cEl.innerHTML=`
    <div class="battleship-game">
      <div class="battleship-panel">
        <div class="battleship-title">${isMyTurn?"Du bist dran":escHtml(turnName)+" ist dran"}</div>
      </div>
      ${battleshipBoardHtml({boardData:enemyBoard,revealShips:false,title:"Gegner",enemy:true,interactive:isMyTurn})}
      ${battleshipBoardHtml({boardData:ownBoard,revealShips:true,title:"Deine Flotte",enemy:false})}
    </div>`;
  cEl.querySelectorAll(".battleship-board.enemy .battleship-cell.target").forEach(btn=>{
    btn.addEventListener("click",()=>window.makeBattleshipShot(Number(btn.dataset.cell)));
  });
}
window.makeBattleshipShot=async function(cell){
  cell=Number(cell);
  if(!Number.isInteger(cell)||cell<0||cell>=100)return;
  if(!gameState||gameState.gameType!=="battleship"||gameState.phase!=="playing")return;
  setConnStatus("sync");
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="battleship"||cur.phase!=="playing")return;
      const bs=cur.battleship||{};
      if(bs.phase!=="battle")return;
      const role=battleshipRoleFor(cur,myId);
      if(!role||bs.turn!==role)return;
      const targetRole=role==="p1"?"p2":"p1";
      const targetId=bs.seats?.[targetRole];
      if(!targetId||!bs.boards?.[targetId])return;
      const targetBoard=bs.boards[targetId];
      if(!targetBoard.shotsReceived)targetBoard.shotsReceived={};
      if(targetBoard.shotsReceived[cell])return;
      const shipCells=battleshipShipCells(targetBoard);
      const hit=shipCells.has(cell);
      targetBoard.shotsReceived[cell]=hit?"hit":"miss";
      const sunkShip=hit?(targetBoard.ships||[]).find(ship=>(ship.cells||[]).includes(cell)&&(ship.cells||[]).every(c=>battleshipShotsSet(targetBoard).has(c))):null;
      const won=hit&&battleshipAllShipsSunk(targetBoard);
      bs.lastShot={by:myId,target:targetId,cell,hit,sunk:!!sunkShip,sunkSize:sunkShip?.size||0,won};
      if(won){
        bs.winner=role;
        bs.turn=role;
        cur.phase="results";
        if(cur.players?.[myId]) cur.players[myId].score=safeNum(cur.players[myId].score)+1;
      }else{
        bs.turn=hit?role:targetRole;
      }
      return cur;
    });
    setConnStatus("ok");
  }catch(e){
    setConnStatus("err");
  }
};
function renderBattleshipPlaceholder(){
  const letterStage=document.querySelector(".letter-stage");
  if(letterStage) letterStage.style.display="none";
  const tiEl=document.getElementById("typing-indicators-area"); if(tiEl) tiEl.innerHTML="";
  const bEl=document.getElementById("buzzer-container"); if(bEl) bEl.innerHTML="";
  const cEl=document.getElementById("playing-content"); if(!cEl)return;
  cEl.innerHTML=`<div class="battleship-game"><div class="battleship-panel"><div class="battleship-title">Schiffe versenken</div><div class="battleship-sub">Diese Phase kommt im nächsten Schritt.</div></div></div>`;
}
function renderBattleshipPlacing(){
  if(!gameState)return;
  ensureBattleshipLocal();
  stopRoundTimer();
  const letterStage=document.querySelector(".letter-stage");
  if(letterStage) letterStage.style.display="none";
  const tiEl=document.getElementById("typing-indicators-area"); if(tiEl) tiEl.innerHTML="";
  const bEl=document.getElementById("buzzer-container"); if(bEl) bEl.innerHTML="";
  const cEl=document.getElementById("playing-content"); if(!cEl)return;
  const role=battleshipRoleFor(gameState,myId);
  const bs=gameState.battleship||initialBattleshipState();
  const ships=bs.ships||BATTLESHIP_SHIPS;
  const seats=bs.seats||{};
  const ready=bs.ready||{};
  const boards=bs.boards||{};
  if(!role){
    cEl.innerHTML=`<div class="battleship-game"><div class="battleship-panel"><div class="battleship-title">Du schaust zu</div><div class="battleship-sub">Die Spieler platzieren ihre Flotten.</div></div></div>`;
    return;
  }
  if(ready[myId]){
    const ownShips=boards[myId]?.ships||[];
    const opponentId=role==="p1"?seats.p2:seats.p1;
    const opponentReady=!!ready[opponentId];
    cEl.innerHTML=`
      <div class="battleship-game">
        <div class="battleship-panel">
          <div class="battleship-title">Flotte bereit</div>
          <div class="battleship-sub">${opponentReady?"Beide bereit · Spielphase kommt im nächsten Schritt":"Warte auf "+escHtml(battleshipPlayerName(opponentId))}</div>
        </div>
        <div class="battleship-ships">
          ${ships.map(size=>`<span class="battleship-ship-pill done">🚢 ${size}er</span>`).join("")}
        </div>
        ${battleshipBoardHtml({boardData:{ships:ownShips,shotsReceived:{}},revealShips:true,title:"Deine Flotte",enemy:false})}
      </div>`;
    return;
  }
  const configs=battleshipShipConfigs();
  const selectedCfg=battleshipSelectedConfig();
  const selectedPlaced=battleshipPlacedShip(selectedCfg?.id);
  const currentSize=selectedCfg?.size;
  const allPlaced=configs.every(cfg=>!!battleshipPlacedShip(cfg.id));
  cEl.innerHTML=`
    <div class="battleship-game">
      <div class="battleship-panel">
        <div class="battleship-title">Flotte platzieren</div>
        <div class="battleship-sub">${selectedCfg?`${selectedCfg.size}er-Schiff ${selectedPlaced?"verschieben":"platzieren"}`:"Alle Schiffe platziert"} · Schiff antippen zum Drehen</div>
        <div class="battleship-toolbar">
          <button type="button" class="btn btn-outline" onclick="window.resetBattleshipPlacement()">Zurücksetzen</button>
        </div>
      </div>
      <div class="battleship-ships">
        ${configs.map(cfg=>{
          const placedShip=battleshipPlacedShip(cfg.id);
          const selected=cfg.id===battleshipSelectedShipId;
          const direction=(placedShip?.orientation||battleshipOrientation)==="h"?"↔":"↕";
          return `<button type="button" class="battleship-ship-pill ${placedShip?"done":""} ${selected?"current":""}" data-ship="${cfg.id}" onclick="window.selectBattleshipShip('${cfg.id}')">🚢 ${cfg.size}er ${selected?direction:""}</button>`;
        }).join("")}
      </div>
      <div class="battleship-board placing" aria-label="Schiffe platzieren">
        ${battleshipGridHtml((i)=>{
          const ship=battleshipShipAtCell(i);
          return `<button type="button" class="battleship-cell ${battleshipShipSegmentClass(battleshipPlacedShips,i)}" data-cell="${i}" ${ship?`data-ship="${ship.id}"`:""} ${currentSize?"":"disabled"}></button>`;
        })}
      </div>
      <div id="battleship-warning" class="battleship-warning"></div>
      <button type="button" class="btn" ${allPlaced?`onclick="window.finishBattleshipPlacement()"`:"disabled"}>${allPlaced?"Fertig":"Alle Schiffe platzieren"}</button>
    </div>`;
  cEl.querySelectorAll(".battleship-ship-pill[data-ship]").forEach(pill=>{
    const id=pill.dataset.ship;
    pill.addEventListener("pointerdown",e=>{
      startBattleshipShipDrag(id,e);
    });
    pill.addEventListener("pointermove",moveBattleshipShipDrag);
    pill.addEventListener("pointerup",endBattleshipShipDrag);
    pill.addEventListener("pointercancel",()=>{
      battleshipDragging=false;
      battleshipDragCell=null;
      battleshipDragShipId=null;
      battleshipDragOffset=0;
      battleshipDragMoved=false;
      clearBattleshipPreview();
    });
  });
  cEl.querySelectorAll(".battleship-cell:not(:disabled)").forEach(btn=>{
    const cell=Number(btn.dataset.cell);
    const shipId=btn.dataset.ship;
    if(shipId){
      btn.addEventListener("pointerdown",e=>{
        startBattleshipShipDrag(shipId,e,cell);
        e.preventDefault();
      });
      btn.addEventListener("pointermove",moveBattleshipShipDrag);
      btn.addEventListener("pointerup",endBattleshipShipDrag);
      btn.addEventListener("pointercancel",()=>{
        battleshipDragging=false;
        battleshipDragCell=null;
        battleshipDragShipId=null;
        battleshipDragOffset=0;
        battleshipDragMoved=false;
        clearBattleshipPreview();
      });
      btn.addEventListener("click",()=>{
        if(Date.now()<battleshipSuppressClickUntil)return;
        window.rotateBattleshipShip(shipId);
      });
      return;
    }
    btn.addEventListener("pointerenter",()=>updateBattleshipPreview(cell));
    btn.addEventListener("focus",()=>updateBattleshipPreview(cell));
    btn.addEventListener("touchstart",()=>updateBattleshipPreview(cell),{passive:true});
    btn.addEventListener("pointerdown",e=>{
      battleshipDragging=true;
      battleshipDragCell=cell;
      updateBattleshipPreview(cell);
      try{btn.setPointerCapture?.(e.pointerId);}catch(_e){}
      e.preventDefault();
    });
    btn.addEventListener("pointermove",e=>{
      if(!battleshipDragging)return;
      const next=battleshipCellFromPointer(e);
      if(next!=null&&next!==battleshipDragCell){
        battleshipDragCell=next;
        updateBattleshipPreview(next);
      }
    });
    btn.addEventListener("pointerup",e=>{
      if(!battleshipDragging)return;
      const next=battleshipCellFromPointer(e)??battleshipDragCell;
      battleshipDragging=false;
      battleshipDragCell=null;
      try{btn.releasePointerCapture?.(e.pointerId);}catch(_e){}
      finishBattleshipDrag(next);
    });
    btn.addEventListener("pointercancel",()=>{
      battleshipDragging=false;
      battleshipDragCell=null;
      battleshipDragShipId=null;
      battleshipDragOffset=0;
      battleshipDragMoved=false;
      clearBattleshipPreview();
    });
    btn.addEventListener("pointerleave",()=>{ if(!battleshipDragging) clearBattleshipPreview(); });
    btn.addEventListener("blur",clearBattleshipPreview);
    btn.addEventListener("click",()=>{
      window.placeBattleshipShip(cell);
    });
  });
}

// ─── PLAYING ─────────────────────────────────────────────────────
function renderPlaying(){
  if(gameState?.gameType==="connect4") return renderConnect4Playing();
  if(gameState?.gameType==="battleship") return renderBattleshipPlaying();
  if(gameState?.gameType==="kniffel") return renderKniffelPlaying();
  if(gameState?.gameType==="drawing") return renderDrawingPlaying();
  if(gameState?.gameType==="maumau") return renderMauMauPlaying();
  return renderSlfPlaying();
}
window.playMauMauCard=async function(index,chosenColor=null){
  index=Number(index);
  if(!Number.isInteger(index)||index<0)return;
  if(!gameState||gameState.gameType!=="maumau"||gameState.phase!=="playing")return;
  const localHand=gameState.maumau?.hands?.[myId]||[];
  const localCard=localHand[index];
  if(localCard?.value==="wild"&&!MAUMAU_COLORS.includes(chosenColor)){
    mauMauPendingWildIndex=index;
    renderPlaying();
    return;
  }
  setConnStatus("sync");
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="maumau"||cur.phase!=="playing")return;
      const m=cur.maumau||{};
      if(m.phase!=="playing"||m.turn!==myId)return;
      if(!m.hands||!Array.isArray(m.hands[myId]))return;
      const card=m.hands[myId][index];
      if(!card||!mauMauCanPlay(card,m))return;
      const pending=m.drawnThisTurn||null;
      if(pending?.player===myId&&pending.cardId&&card.id!==pending.cardId)return;
      if(card.value==="wild"&&!MAUMAU_COLORS.includes(chosenColor))return;
      m.hands[myId].splice(index,1);
      if(!Array.isArray(m.discardPile))m.discardPile=[];
      m.discardPile.push(card);
      m.moveCount=safeNum(m.moveCount)+1;
      if(!m.mauCalled)m.mauCalled={};
      delete m.mauCalled[myId];
      if(m.hands[myId].length===0){
        m.drawnThisTurn=null;
        m.winner=myId;
        m.phase="results";
        m.lastAction=`${cur.players?.[myId]?.name||myName||"?"} gewinnt`;
        cur.phase="results";
        if(cur.players?.[myId]) cur.players[myId].score=safeNum(cur.players[myId].score)+1;
      }else{
        mauMauApplyCardEffect(m,myId,card,chosenColor);
      }
      cur.maumau=m;
      return cur;
    });
    mauMauPendingWildIndex=null;
    setConnStatus("ok");
  }catch(e){setConnStatus("err");}
};
window.callMauMau=async function(){
  if(!gameState||gameState.gameType!=="maumau"||gameState.phase!=="playing")return;
  if(mauMauHandCount(gameState,myId)!==1)return;
  setConnStatus("sync");
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="maumau"||cur.phase!=="playing")return;
      const m=cur.maumau||{};
      const hand=Array.isArray(m.hands?.[myId])?m.hands[myId]:[];
      if(hand.length!==1)return;
      if(!m.mauCalled)m.mauCalled={};
      m.mauCalled[myId]=true;
      m.lastAction=`${cur.players?.[myId]?.name||myName||"?"} ruft Mau!`;
      cur.maumau=m;
      return cur;
    });
    setConnStatus("ok");
  }catch(e){setConnStatus("err");}
};
window.drawMauMauCard=async function(){
  if(!gameState||gameState.gameType!=="maumau"||gameState.phase!=="playing")return;
  setConnStatus("sync");
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="maumau"||cur.phase!=="playing")return;
      const m=cur.maumau||{};
      if(m.phase!=="playing"||m.turn!==myId||m.drawnThisTurn?.player===myId)return;
      const hand=Array.isArray(m.hands?.[myId])?m.hands[myId]:[];
      const pendingDraw=safeNum(m.drawStack);
      if(pendingDraw>0){
        mauMauDrawCards(m,myId,pendingDraw);
        m.drawStack=0;
        m.drawnThisTurn=null;
        m.turn=mauMauNextPlayer(m.order||[],myId,safeNum(m.direction)===-1?-1:1,1);
        m.lastAction=`${cur.players?.[myId]?.name||myName||"?"} zieht ${pendingDraw} Karten`;
        cur.maumau=m;
        return cur;
      }
      if(mauMauHasPlayable(hand,m))return;
      mauMauDrawCards(m,myId,1);
      const newHand=Array.isArray(m.hands?.[myId])?m.hands[myId]:[];
      const drawnCard=newHand[newHand.length-1]||null;
      if(drawnCard&&mauMauCanPlay(drawnCard,m)){
        m.drawnThisTurn={player:myId,cardId:drawnCard.id};
        m.lastAction=`${cur.players?.[myId]?.name||myName||"?"} zieht eine passende Karte`;
      }else{
        m.drawnThisTurn=null;
        m.turn=mauMauNextPlayer(m.order||[],myId,safeNum(m.direction)===-1?-1:1,1);
        m.lastAction=`${cur.players?.[myId]?.name||myName||"?"} zieht eine Karte`;
      }
      cur.maumau=m;
      return cur;
    });
    setConnStatus("ok");
  }catch(e){setConnStatus("err");}
};
window.passMauMauAfterDraw=async function(){
  if(!gameState||gameState.gameType!=="maumau"||gameState.phase!=="playing")return;
  setConnStatus("sync");
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="maumau"||cur.phase!=="playing")return;
      const m=cur.maumau||{};
      if(m.phase!=="playing"||m.turn!==myId||m.drawnThisTurn?.player!==myId)return;
      m.drawnThisTurn=null;
      m.turn=mauMauNextPlayer(m.order||[],myId,safeNum(m.direction)===-1?-1:1,1);
      m.lastAction=`${cur.players?.[myId]?.name||myName||"?"} passt`;
      cur.maumau=m;
      return cur;
    });
    setConnStatus("ok");
  }catch(e){setConnStatus("err");}
};
function renderMauMauPlaying(){
  stopRoundTimer();
  const letterStage=document.querySelector(".letter-stage");
  if(letterStage) letterStage.style.display="none";
  const tiEl=document.getElementById("typing-indicators-area"); if(tiEl) tiEl.innerHTML="";
  const bEl=document.getElementById("buzzer-container"); if(bEl) bEl.innerHTML="";
  const cEl=document.getElementById("playing-content"); if(!cEl)return;
  const m=gameState.maumau||initialMauMauState();
  const order=mauMauOrder(gameState);
  const turnName=mauMauPlayerName(m.turn);
  const isMyTurn=m.turn===myId;
  const topCard=(m.discardPile||[])[(m.discardPile||[]).length-1]||null;
  const myHand=Array.isArray(m.hands?.[myId])?m.hands[myId]:[];
  const activeColor=m.activeColor||topCard?.color||"";
  if(!isMyTurn)mauMauPendingWildIndex=null;
  const pendingDraw=m.drawnThisTurn?.player===myId?m.drawnThisTurn:null;
  const drawStack=safeNum(m.drawStack);
  const canDraw=isMyTurn&&!pendingDraw&&(drawStack>0||!mauMauHasPlayable(myHand,m));
  const pendingWild=Number.isInteger(mauMauPendingWildIndex)&&myHand[mauMauPendingWildIndex]?.value==="wild";
  const topCardKey=topCard?.id||"";
  const animateTop=!!(topCardKey&&topCardKey!==mauMauLastAnimatedTopId&&m.moveCount!==0);
  cEl.innerHTML=`
    <div class="maumau-game">
      <div class="maumau-panel">
        <div class="maumau-title">${isMyTurn?"Du bist dran":`${escHtml(turnName)} ist dran`}</div>
        <div class="maumau-sub">Runde ${safeNum(m.round)||1} · Richtung ${safeNum(m.direction)===-1?"gegen den Uhrzeigersinn":"im Uhrzeigersinn"}</div>
      </div>
      ${drawStack>0?`<div class="maumau-action-banner">+2-Stapel: ${drawStack} Karten · Lege +2 oder ziehe.</div>`:""}
      <div class="maumau-table">
        <div class="maumau-pile">
          <div class="maumau-pile-label">Ablage</div>
          ${mauMauCardHtml(topCard,{className:animateTop?"placed":""})}
        </div>
        <div class="maumau-pile">
          <div class="maumau-pile-label">Ziehstapel</div>
          ${canDraw?`<button type="button" class="maumau-pile-draw active" onclick="window.drawMauMauCard()" aria-label="Karte ziehen">${mauMauCardHtml(null,{back:true})}</button>`:mauMauCardHtml(null,{back:true})}
        </div>
      </div>
      ${myHand.length===1?`<div class="maumau-action-banner">${m.mauCalled?.[myId]?"Mau gerufen!":"Du hast nur noch eine Karte."}</div>`:""}
      <div class="maumau-panel">
        <div class="maumau-title">Deine Karten</div>
        <div class="maumau-hand">
          ${mauMauSortedHandEntries(myHand).map(({card,index})=>mauMauHandCardHtml(card,index,mauMauCanPlay(card,m)&&(!pendingDraw||pendingDraw.cardId===card.id),isMyTurn,pendingDraw?.cardId===card.id?"drawn":"")).join("")||`<div class="maumau-sub">Keine Karten.</div>`}
        </div>
        ${pendingWild?`<div class="maumau-color-choice">
          <div class="maumau-title">Farbe wählen</div>
          <div class="maumau-color-row">
            ${MAUMAU_COLORS.map(color=>`<button type="button" class="maumau-color-btn ${color}" onclick="window.playMauMauCard(${mauMauPendingWildIndex},'${color}')">${MAUMAU_COLOR_DOTS[color]} ${MAUMAU_COLOR_LABELS[color]}</button>`).join("")}
          </div>
        </div>`:""}
        ${myHand.length===1&&!m.mauCalled?.[myId]?`<div class="maumau-actions"><button type="button" class="btn" onclick="window.callMauMau()">Mau rufen</button></div>`:""}
        ${isMyTurn&&pendingDraw?`<div class="maumau-actions"><button type="button" class="btn btn-outline" onclick="window.passMauMauAfterDraw()">Passen</button></div>`:""}
      </div>
      <div class="maumau-panel">
        <div class="maumau-title">Spieler</div>
        <div class="maumau-players">
          ${order.map(id=>{
            const count=mauMauHandCount(gameState,id);
            const called=!!m.mauCalled?.[id];
            return `<div class="maumau-player-row ${id===m.turn?"active":""}">
              <span>${escHtml(gameState.players?.[id]?.name||"?")}${id===myId?" · Du":""}${count===1?`<span class="maumau-mau-badge ${called?"called":""}">${called?"Mau!":"1 Karte"}</span>`:""}</span>
              <span class="maumau-card-count ${count===1?"warn":""}">${count} Karten</span>
            </div>`;
          }).join("")}
        </div>
      </div>
    </div>`;
  if(topCardKey) mauMauLastAnimatedTopId=topCardKey;
}
function drawingHasStrokeId(strokes,id){
  if(!id||!strokes)return false;
  if(Array.isArray(strokes))return !!strokes[Number(id)];
  return typeof strokes==="object"&&!!strokes[id];
}
function drawingStrokesArray(strokes){
  let arr=[];
  if(Array.isArray(strokes)) arr=strokes.filter(Boolean);
  else if(strokes&&typeof strokes==="object") arr=Object.values(strokes).filter(Boolean);
  Object.keys(drawingPendingStrokes||{}).forEach(id=>{
    if(drawingHasStrokeId(strokes,id)) delete drawingPendingStrokes[id];
    else if(drawingPendingStrokes[id]) arr.push(drawingPendingStrokes[id]);
  });
  return arr.sort((a,b)=>safeNum(a.ts)-safeNum(b.ts));
}
function drawingPointFromEvent(canvas,e){
  const rect=canvas.getBoundingClientRect();
  const x=Math.max(0,Math.min(1000,Math.round(((e.clientX-rect.left)/Math.max(1,rect.width))*1000)));
  const y=Math.max(0,Math.min(1000,Math.round(((e.clientY-rect.top)/Math.max(1,rect.height))*1000)));
  return{x,y};
}
function drawingPointDistance(a,b){
  if(!a||!b)return Infinity;
  return Math.hypot(a.x-b.x,a.y-b.y);
}
function drawingPrepareCanvas(canvas){
  const rect=canvas.getBoundingClientRect();
  const dpr=Math.max(1,window.devicePixelRatio||1);
  const w=Math.max(1,Math.round(rect.width*dpr));
  const h=Math.max(1,Math.round(rect.height*dpr));
  if(canvas.width!==w||canvas.height!==h){
    canvas.width=w;
    canvas.height=h;
  }
  const ctx=canvas.getContext("2d");
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return{ctx,width:rect.width,height:rect.height};
}
function drawingBrushColor(){
  return drawingToolMode==="eraser"?"#ffffff":drawingToolColor;
}
function drawingBrushWidth(){
  return drawingToolMode==="eraser"?DRAWING_ERASER_WIDTH:drawingToolWidth;
}
function drawingDrawStroke(ctx,stroke,width,height){
  const pts=(stroke?.points||[]).filter(p=>p&&Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.y)));
  if(!pts.length)return;
  const isEraser=stroke.tool==="eraser"||(String(stroke.color||"").toLowerCase()==="#ffffff"&&safeNum(stroke.width)>=DRAWING_ERASER_WIDTH);
  ctx.save();
  ctx.globalCompositeOperation=isEraser?"destination-out":"source-over";
  ctx.lineCap="round";
  ctx.lineJoin="round";
  ctx.strokeStyle=isEraser?"rgba(0,0,0,1)":(stroke.color||"#343a40");
  ctx.lineWidth=Math.max(1,Number(stroke.width)||4);
  ctx.beginPath();
  pts.forEach((p,i)=>{
    const x=(Number(p.x)/1000)*width;
    const y=(Number(p.y)/1000)*height;
    if(i===0)ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });
  if(pts.length===1){
    const p=pts[0];
    const x=(Number(p.x)/1000)*width;
    const y=(Number(p.y)/1000)*height;
    ctx.lineTo(x+0.1,y+0.1);
  }
  ctx.stroke();
  ctx.restore();
}
function drawingDrawCanvas(canvas,strokes){
  if(!canvas)return;
  const {ctx,width,height}=drawingPrepareCanvas(canvas);
  ctx.clearRect(0,0,width,height);
  ctx.fillStyle="#ffffff";
  ctx.fillRect(0,0,width,height);
  drawingStrokesArray(strokes).forEach(stroke=>drawingDrawStroke(ctx,stroke,width,height));
  if(drawingActiveStroke) drawingDrawStroke(ctx,drawingActiveStroke,width,height);
}
function drawingToolsHtml(){
  return `<div class="drawing-tool-panel">
    <div class="drawing-tool-title">Werkzeuge</div>
    <div class="drawing-tool-row" aria-label="Farben">
      ${DRAWING_COLORS.map(c=>`<button type="button" class="drawing-color-btn ${drawingToolMode==="pen"&&drawingToolColor===c.hex?"active":""}" style="background:${c.hex}" title="${escHtml(c.name)}" aria-label="${escHtml(c.name)}" onclick="window.pickDrawingColor('${c.hex}')"></button>`).join("")}
    </div>
    <div class="drawing-tool-row" aria-label="Stiftdicke">
      ${DRAWING_WIDTHS.map(w=>`<button type="button" class="drawing-tool-btn ${drawingToolMode==="pen"&&drawingToolWidth===w.width?"active":""}" onclick="window.pickDrawingWidth(${w.width})">${escHtml(w.label)}</button>`).join("")}
      <button type="button" class="drawing-tool-btn ${drawingToolMode==="eraser"?"active":""}" onclick="window.toggleDrawingEraser()">Radierer</button>
      <button type="button" class="drawing-tool-btn" onclick="window.undoDrawingStroke()">Rückgängig</button>
      <button type="button" class="drawing-tool-btn" onclick="window.clearDrawingCanvas()">Alles löschen</button>
    </div>
  </div>`;
}
window.pickDrawingColor=function(hex){
  if(!DRAWING_COLORS.some(c=>c.hex===hex))return;
  drawingToolColor=hex;
  drawingToolMode="pen";
  localStorage.setItem("drawing_color",hex);
  renderPlaying();
};
window.pickDrawingWidth=function(width){
  width=Number(width);
  if(!DRAWING_WIDTHS.some(w=>w.width===width))return;
  drawingToolWidth=width;
  drawingToolMode="pen";
  localStorage.setItem("drawing_width",String(width));
  renderPlaying();
};
window.toggleDrawingEraser=function(){
  drawingToolMode=drawingToolMode==="eraser"?"pen":"eraser";
  renderPlaying();
};
function scheduleDrawingStrokeSync(){
  if(drawingSyncTimer)return;
  drawingSyncTimer=setTimeout(()=>{
    drawingSyncTimer=null;
    syncDrawingActiveStroke(false);
  },110);
}
async function syncDrawingActiveStroke(final=false){
  if(!drawingActiveStrokeId||!drawingActiveStroke||!myRoom)return;
  const id=drawingActiveStrokeId;
  const stroke={...drawingActiveStroke,points:(drawingActiveStroke.points||[]).slice(0,260)};
  if(final) drawingPendingStrokes[id]=stroke;
  try{
    await update(roomRef(),{[`drawing/strokes/${id}`]:stroke});
  }catch(e){ setConnStatus("err"); }
  if(final&&drawingActiveStrokeId===id){
    drawingActiveStrokeId=null;
    drawingActiveStroke=null;
  }
}
function setupDrawingCanvas(d,isDrawer){
  const canvas=document.getElementById("drawing-canvas");
  if(!canvas)return;
  drawingDrawCanvas(canvas,d.strokes||{});
  if(!isDrawer)return;
  canvas.onpointerdown=e=>{
    e.preventDefault();
    const p=drawingPointFromEvent(canvas,e);
    drawingActiveStrokeId=`${myId}_${Date.now()}_${Math.floor(Math.random()*10000)}`;
    drawingActiveStroke={by:myId,ts:Date.now(),color:drawingBrushColor(),width:drawingBrushWidth(),tool:drawingToolMode,points:[p]};
    try{canvas.setPointerCapture?.(e.pointerId);}catch(_e){}
    drawingDrawCanvas(canvas,d.strokes||{});
    scheduleDrawingStrokeSync();
  };
  canvas.onpointermove=e=>{
    if(!drawingActiveStroke)return;
    e.preventDefault();
    const p=drawingPointFromEvent(canvas,e);
    const pts=drawingActiveStroke.points;
    if(drawingPointDistance(pts[pts.length-1],p)<7)return;
    pts.push(p);
    if(pts.length>260) pts.splice(1,pts.length-260);
    drawingDrawCanvas(canvas,d.strokes||{});
    scheduleDrawingStrokeSync();
  };
  const end=e=>{
    if(!drawingActiveStroke)return;
    e.preventDefault();
    try{canvas.releasePointerCapture?.(e.pointerId);}catch(_e){}
    if(drawingSyncTimer){clearTimeout(drawingSyncTimer);drawingSyncTimer=null;}
    syncDrawingActiveStroke(true);
  };
  canvas.onpointerup=end;
  canvas.onpointercancel=end;
  canvas.onpointerleave=e=>{ if(e.buttons===0&&drawingActiveStroke) end(e); };
}
function updateDrawingTimerDom(remaining,timerPct){
  const timeEl=document.getElementById("drawing-time-left");
  const fillEl=document.getElementById("drawing-timer-fill");
  if(timeEl) timeEl.textContent=`${remaining}s`;
  if(fillEl){
    fillEl.style.width=`${timerPct}%`;
    fillEl.classList.toggle("urgent",remaining<=10);
  }
}
function restoreDrawingGuessFocus(value,selectionStart=null,selectionEnd=null){
  const input=document.getElementById("drawing-guess-input");
  if(!input)return;
  input.value=value||"";
  input.focus({preventScroll:true});
  try{
    const posStart=selectionStart==null?input.value.length:selectionStart;
    const posEnd=selectionEnd==null?posStart:selectionEnd;
    input.setSelectionRange(posStart,posEnd);
  }catch(e){}
}
function scheduleDrawingTick(remaining){
  if(drawingTickTimer)clearTimeout(drawingTickTimer);
  if(remaining>0&&gameState?.gameType==="drawing"&&gameState.phase==="playing"){
    drawingTickTimer=setTimeout(()=>{
      drawingTickTimer=null;
      if(!gameState||gameState.gameType!=="drawing"||gameState.phase!=="playing")return;
      const d=gameState.drawing||{};
      const elapsed=Math.max(0,Math.floor((Date.now()-(d.roundStartTs||Date.now()))/1000));
      const duration=Math.max(1,safeNum(d.roundDuration||DRAWING_DEFAULT_DURATION));
      const nextRemaining=Math.max(0,duration-elapsed);
      const timerPct=Math.max(0,Math.min(100,(nextRemaining/duration)*100));
      updateDrawingTimerDom(nextRemaining,timerPct);
      if(nextRemaining<=0&&isHost) window.endDrawingRoundTimeout();
      else scheduleDrawingTick(nextRemaining);
    },1000);
  }
}
window.clearDrawingCanvas=async function(){
  if(!gameState||gameState.gameType!=="drawing"||gameState.phase!=="playing")return;
  const d=gameState.drawing||{};
  if(d.drawer!==myId)return;
  drawingActiveStrokeId=null;
  drawingActiveStroke=null;
  drawingPendingStrokes={};
  if(drawingSyncTimer){clearTimeout(drawingSyncTimer);drawingSyncTimer=null;}
  try{await update(roomRef(),{"drawing/strokes":null});}catch(e){setConnStatus("err");}
};
window.undoDrawingStroke=async function(){
  if(!gameState||gameState.gameType!=="drawing"||gameState.phase!=="playing")return;
  const d=gameState.drawing||{};
  if(d.drawer!==myId)return;
  if(drawingActiveStroke){
    if(drawingActiveStrokeId) delete drawingPendingStrokes[drawingActiveStrokeId];
    drawingActiveStrokeId=null;
    drawingActiveStroke=null;
    if(drawingSyncTimer){clearTimeout(drawingSyncTimer);drawingSyncTimer=null;}
    renderPlaying();
    return;
  }
  const strokes=d.strokes||{};
  let entries=[];
  if(Array.isArray(strokes)) entries=strokes.map((v,i)=>[String(i),v]).filter(([,v])=>v);
  else if(strokes&&typeof strokes==="object") entries=Object.entries(strokes).filter(([,v])=>v);
  const own=entries
    .filter(([,stroke])=>!stroke.by||stroke.by===myId)
    .sort((a,b)=>safeNum(a[1]?.ts)-safeNum(b[1]?.ts));
  const last=own[own.length-1];
  if(!last)return;
  setConnStatus("sync");
  try{
    await update(roomRef(),{[`drawing/strokes/${last[0]}`]:null});
    setConnStatus("ok");
  }catch(e){setConnStatus("err");}
};
window.submitDrawingGuess=async function(){
  if(!gameState||gameState.gameType!=="drawing"||gameState.phase!=="playing")return;
  const input=document.getElementById("drawing-guess-input");
  const guess=(input?.value||"").trim();
  if(!guess)return;
  if(input) input.value="";
  const guessKey=`${myId}_${Date.now()}_${Math.floor(Math.random()*10000)}`;
  setConnStatus("sync");
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="drawing"||cur.phase!=="playing")return;
      const d=cur.drawing||{};
      if(d.phase!=="playing"||d.drawer===myId||d.guessed?.[myId])return;
      if(Date.now()>=drawingEndTime(d))return;
      const word=String(d.word||"");
      const correct=!!word&&normalizeAnswer(guess)===normalizeAnswer(word);
      if(!d.guesses)d.guesses={};
      d.guesses[guessKey]={player:myId,name:cur.players?.[myId]?.name||myName||"?",guess,correct,ts:Date.now()};
      if(correct){
        if(!d.guessed)d.guessed={};
        d.guessed[myId]=true;
        d.lastCorrect={player:myId,name:cur.players?.[myId]?.name||myName||"?",guess,word,ts:Date.now()};
        d.winner=myId;
        d.phase="results";
        cur.phase="results";
        if(cur.players?.[myId]) cur.players[myId].score=safeNum(cur.players[myId].score)+2;
        if(d.drawer&&cur.players?.[d.drawer]) cur.players[d.drawer].score=safeNum(cur.players[d.drawer].score)+1;
      }
      cur.drawing=d;
      return cur;
    });
    setConnStatus("ok");
  }catch(e){setConnStatus("err");}
};
window.endDrawingRoundTimeout=async function(){
  if(!isHost||!gameState||gameState.gameType!=="drawing"||gameState.phase!=="playing")return;
  setConnStatus("sync");
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="drawing"||cur.phase!=="playing")return;
      const d=cur.drawing||{};
      if(d.phase!=="playing")return;
      if(Date.now()<drawingEndTime(d))return;
      d.phase="results";
      d.lastCorrect=null;
      d.winner=null;
      cur.phase="results";
      cur.drawing=d;
      return cur;
    });
    setConnStatus("ok");
  }catch(e){setConnStatus("err");}
};
window.nextDrawingRound=async function(){
  if(!isHost||!gameState||gameState.gameType!=="drawing")return;
  setConnStatus("sync");
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="drawing")return;
      const order=drawingOrder(cur);
      if(order.length<DRAWING_MIN_PLAYERS||order.length>DRAWING_MAX_PLAYERS)return;
      const current=cur.drawing?.drawer||null;
      const drawer=drawingNextDrawer(order,current);
      cur.drawing=drawingRoundState(order,cur.drawing?.round||0,drawer,cur.drawing||{});
      cur.phase="playing";
      return cur;
    });
    setConnStatus("ok");
  }catch(e){setConnStatus("err");}
};
function renderDrawingPlaying(){
  stopRoundTimer();
  const letterStage=document.querySelector(".letter-stage");
  if(letterStage) letterStage.style.display="none";
  const tiEl=document.getElementById("typing-indicators-area"); if(tiEl) tiEl.innerHTML="";
  const bEl=document.getElementById("buzzer-container"); if(bEl) bEl.innerHTML="";
  const cEl=document.getElementById("playing-content"); if(!cEl)return;
  const d=gameState?.drawing||initialDrawingState();
  const drawer=d.drawer||drawingFirstDrawer(drawingOrder(gameState));
  const isDrawer=drawer===myId;
  const drawerName=drawingPlayerName(drawer);
  const elapsed=Math.max(0,Math.floor((Date.now()-(d.roundStartTs||Date.now()))/1000));
  const duration=Math.max(1,safeNum(d.roundDuration||DRAWING_DEFAULT_DURATION));
  const remaining=Math.max(0,duration-elapsed);
  const timerPct=Math.max(0,Math.min(100,(remaining/duration)*100));
  const word=(d.word||"").trim();
  if(remaining<=0&&isHost){
    window.endDrawingRoundTimeout();
  }
  const guessed=!!d.guessed?.[myId];
  const wasGuessFocused=document.activeElement?.id==="drawing-guess-input";
  const guessInputBefore=wasGuessFocused?document.getElementById("drawing-guess-input"):null;
  const guessValueBefore=guessInputBefore?.value||"";
  const guessSelectionStart=guessInputBefore?.selectionStart??null;
  const guessSelectionEnd=guessInputBefore?.selectionEnd??null;
  const existingCanvas=document.getElementById("drawing-canvas");
  if(wasGuessFocused&&existingCanvas&&!isDrawer&&!guessed){
    drawingDrawCanvas(existingCanvas,d.strokes||{});
    updateDrawingTimerDom(remaining,timerPct);
    scheduleDrawingTick(remaining);
    return;
  }
  if(drawingActiveStroke&&existingCanvas){ 
    drawingDrawCanvas(existingCanvas,d.strokes||{});
    scheduleDrawingTick(remaining);
    return;
  }
  cEl.innerHTML=`
    <div class="drawing-game">
      <div class="drawing-panel">
        <div class="drawing-title">${isDrawer?"Du malst":`${escHtml(drawerName)} malt`}</div>
        <div class="drawing-sub">Runde ${safeNum(d.round)||1} · ${remaining}s</div>
        <div class="drawing-pill-row" style="margin-top:10px">
          <span class="drawing-pill">${isDrawer?"Zeichner":"Rater"}</span>
          <span class="drawing-pill">${drawingStrokesArray(d.strokes).length} Striche</span>
          ${guessed?`<span class="drawing-pill">Richtig geraten ✓</span>`:""}
        </div>
        <div class="drawing-timer">
          <div class="drawing-timer-head"><span>Zeit</span><span id="drawing-time-left">${remaining}s</span></div>
          <div class="drawing-timer-track"><div id="drawing-timer-fill" class="drawing-timer-fill ${remaining<=10?"urgent":""}" style="width:${timerPct}%"></div></div>
        </div>
      </div>
      <div class="drawing-word-card">
        <div class="drawing-sub">${isDrawer?"Dein Wort":"Geheimes Wort"}</div>
        <div class="drawing-word">${isDrawer?escHtml(word||"?"):"••••••"}</div>
      </div>
      <div class="drawing-canvas-wrap">
        <canvas id="drawing-canvas" class="drawing-canvas ${isDrawer?"drawable":""}" aria-label="Montagsmaler Zeichenfläche"></canvas>
        ${isDrawer?`<div class="drawing-tools"><span class="drawing-sub">Mit Finger oder Maus zeichnen</span></div>${drawingToolsHtml()}`:`<div class="drawing-tools"><span class="drawing-sub">Rate unten das geheime Wort.</span></div>`}
      </div>
      ${!isDrawer?`<div class="drawing-panel">
        <div class="drawing-title">Raten</div>
        ${guessed?`<div class="drawing-sub">Du hast das Wort richtig geraten.</div>`:`<div class="drawing-guess-row">
          <input type="text" id="drawing-guess-input" placeholder="Dein Tipp…" maxlength="40" autocomplete="off" onkeydown="if(event.key==='Enter'){event.preventDefault();window.submitDrawingGuess();}"/>
          <button type="button" class="btn btn-sm" onclick="window.submitDrawingGuess()">Raten</button>
        </div>`}
        ${drawingRecentGuessesHtml(d)}
      </div>`:`<div class="drawing-panel">
        <div class="drawing-title">Rateversuche</div>
        ${drawingRecentGuessesHtml(d)}
      </div>`}
    </div>`;
  setupDrawingCanvas(d,isDrawer);
  scheduleDrawingTick(remaining);
  if(wasGuessFocused&&!isDrawer&&!guessed){
    restoreDrawingGuessFocus(guessValueBefore,guessSelectionStart,guessSelectionEnd);
  }
}
function kniffelDiceSum(dice){
  return (dice||[]).reduce((sum,n)=>sum+safeNum(n),0);
}
function kniffelCounts(dice){
  const counts={1:0,2:0,3:0,4:0,5:0,6:0};
  (dice||[]).forEach(n=>{ if(counts[n]!=null) counts[n]++; });
  return counts;
}
function kniffelSortedUniqueDice(dice){
  return [...new Set((dice||[]).map(Number))].sort((a,b)=>a-b);
}
function kniffelHasStraight(uniqueDice,sequence){
  const s=new Set(uniqueDice);
  return sequence.every(n=>s.has(n));
}
function kniffelScoreFor(catId,dice){
  if(!kniffelCategoryById(catId))return 0;
  dice=(dice||[]).map(Number);
  if(!kniffelDiceReady(dice))return 0;
  const counts=kniffelCounts(dice);
  const vals=Object.values(counts);
  const unique=kniffelSortedUniqueDice(dice);
  const sum=kniffelDiceSum(dice);
  const scoreMap={ones:counts[1]*1,twos:counts[2]*2,threes:counts[3]*3,fours:counts[4]*4,fives:counts[5]*5,sixes:counts[6]*6};
  if(scoreMap[catId]!=null)return scoreMap[catId];
  if(catId==="threeKind")return vals.some(v=>v>=3)?sum:0;
  if(catId==="fourKind")return vals.some(v=>v>=4)?sum:0;
  if(catId==="fullHouse")return (vals.includes(3)&&vals.includes(2))?25:0;
  if(catId==="smallStraight"){
    return (kniffelHasStraight(unique,[1,2,3,4])||kniffelHasStraight(unique,[2,3,4,5])||kniffelHasStraight(unique,[3,4,5,6]))?30:0;
  }
  if(catId==="largeStraight"){
    return (unique.length===5&&(kniffelHasStraight(unique,[1,2,3,4,5])||kniffelHasStraight(unique,[2,3,4,5,6])))?40:0;
  }
  if(catId==="kniffel")return vals.some(v=>v===5)?50:0;
  if(catId==="chance")return sum;
  return 0;
}
function kniffelScoresForPlayer(state,pid){
  return state?.kniffel?.scores?.[pid]||{};
}
function kniffelUpperTotal(scores){
  return KNIFFEL_UPPER_IDS.reduce((sum,id)=>sum+safeNum(scores?.[id]),0);
}
function kniffelBonus(scores){
  return kniffelUpperTotal(scores)>=63?35:0;
}
function kniffelLowerTotal(scores){
  return KNIFFEL_CATEGORIES
    .filter(c=>c.section==="Unten")
    .reduce((sum,c)=>sum+safeNum(scores?.[c.id]),0);
}
function kniffelTotal(scores){
  return KNIFFEL_CATEGORIES.reduce((sum,c)=>sum+safeNum(scores?.[c.id]),0)+kniffelBonus(scores);
}
function kniffelRankedPlayers(state){
  return kniffelOrder(state).slice().sort((a,b)=>{
    const diff=kniffelTotal(kniffelScoresForPlayer(state,b))-kniffelTotal(kniffelScoresForPlayer(state,a));
    if(diff!==0)return diff;
    return (state.players?.[a]?.name||"").localeCompare(state.players?.[b]?.name||"");
  });
}
function kniffelResultSummaryHtml(state){
  const ranked=kniffelRankedPlayers(state);
  if(!ranked.length)return"";
  return `<div class="kniffel-result-summary">
    ${ranked.map((id,i)=>{
      const scores=kniffelScoresForPlayer(state,id);
      const upper=kniffelUpperTotal(scores);
      const bonus=kniffelBonus(scores);
      const lower=kniffelLowerTotal(scores);
      const total=kniffelTotal(scores);
      return `<div class="kniffel-result-card ${i===0?"winner":""}">
        <div class="kniffel-result-main">
          <div class="kniffel-result-name">${["①","②","③"][i]||`${i+1}.`} ${escHtml(state.players?.[id]?.name||"?")}</div>
          <div class="kniffel-result-points">${total} Punkte</div>
        </div>
        <div class="kniffel-result-details">
          <span>Oben ${upper}</span>
          <span>Bonus ${bonus}</span>
          <span>Unten ${lower}</span>
        </div>
      </div>`;
    }).join("")}
  </div>`;
}
function runKniffelScoreSelfTest(){
  const failures=KNIFFEL_SCORE_TEST_CASES
    .map(t=>({...t,actual:kniffelScoreFor(t.cat,t.dice)}))
    .filter(t=>t.actual!==t.expected);
  const bonusScores={ones:3,twos:6,threes:9,fours:12,fives:15,sixes:18};
  const bonusOk=kniffelUpperTotal(bonusScores)===63&&kniffelBonus(bonusScores)===35&&kniffelTotal(bonusScores)===98;
  if(!bonusOk) failures.push({cat:"bonus",dice:[],expected:"upper=63 bonus=35 total=98",actual:`upper=${kniffelUpperTotal(bonusScores)} bonus=${kniffelBonus(bonusScores)} total=${kniffelTotal(bonusScores)}`});
  return {passed:failures.length===0,total:KNIFFEL_SCORE_TEST_CASES.length+1,failures};
}
window.runKniffelScoreTests=function(){
  const result=runKniffelScoreSelfTest();
  if(result.passed) console.info(`Kniffel-Score-Tests bestanden (${result.total}/${result.total}).`);
  else console.error("Kniffel-Score-Tests fehlgeschlagen",result.failures);
  return result;
};
function kniffelPlayerComplete(scores){
  return KNIFFEL_CATEGORIES.every(c=>scores?.[c.id]!=null);
}
function kniffelOrder(state){
  const players=state?.players||{};
  const k=state?.kniffel||{};
  const existing=(Array.isArray(k.order)?k.order:[]).filter(id=>players[id]);
  if((k.phase||"lobby")==="lobby"||existing.length===0){
    const missing=Object.keys(players).filter(id=>!existing.includes(id));
    return [...existing,...missing];
  }
  return existing;
}
function kniffelNextPlayer(state,fromId){
  const order=kniffelOrder(state).filter(id=>!kniffelPlayerComplete(kniffelScoresForPlayer(state,id)));
  if(order.length===0)return null;
  const foundIdx=order.indexOf(fromId);
  const idx=foundIdx>=0?foundIdx:-1;
  for(let step=1;step<=order.length;step++){
    const id=order[(idx+step+order.length)%order.length];
    if(id)return id;
  }
  return order[0];
}
function kniffelWinnerId(state){
  const order=kniffelOrder(state);
  return order.slice().sort((a,b)=>kniffelTotal(kniffelScoresForPlayer(state,b))-kniffelTotal(kniffelScoresForPlayer(state,a)))[0]||null;
}
function kniffelDieFace(n){
  return ["□","⚀","⚁","⚂","⚃","⚄","⚅"][Number(n)]||"□";
}
function kniffelIsRolling(k){
  return safeNum(k?.rollingUntil)>Date.now();
}
function kniffelRandomFace(){
  return kniffelDieFace(Math.floor(Math.random()*6)+1);
}
function scheduleKniffelRollRender(k){
  if(!kniffelIsRolling(k)||kniffelRollTimer)return;
  const remaining=Math.max(0,safeNum(k.rollingUntil)-Date.now());
  kniffelRollTimer=setTimeout(()=>{
    kniffelRollTimer=null;
    if(gameState?.gameType==="kniffel"&&gameState.phase==="playing") renderPlaying();
  }, Math.min(90,remaining+30));
}
function kniffelDisplayDieFace(k,dice,index){
  const mask=normalizeKniffelRollingMask(k?.rollingMask);
  return kniffelIsRolling(k)&&mask[index]?kniffelRandomFace():kniffelDieFace(dice[index]);
}
function kniffelDiceReady(dice){ 
  return Array.isArray(dice)&&dice.length===5&&dice.every(n=>Number.isInteger(Number(n))&&Number(n)>=1&&Number(n)<=6);
}
function kniffelCanRoll(k){
  const rolls=safeNum(k?.rolls);
  const held=normalizeKniffelHeld(k?.held);
  return rolls<3&&!(rolls>0&&held.every(Boolean));
}
function kniffelResetDiceTurn(k,nextTurn){
  return {
    ...k,
    turn:nextTurn||null,
    dice:emptyKniffelDice(),
    held:emptyKniffelHeld(),
    rolls:0,
    rollingUntil:0,
    rollingNonce:safeNum(k?.rollingNonce),
    rollingMask:emptyKniffelRollingMask()
  };
}
function kniffelEntryChoicesHtml(state,k){
  if(!k||kniffelIsRolling(k)||k.turn!==myId||safeNum(k.rolls)<=0||!kniffelDiceReady(k.dice))return"";
  const scores=kniffelScoresForPlayer({...state,kniffel:k},myId);
  const sections=["Oben","Unten"].map(section=>{
    const cats=KNIFFEL_CATEGORIES.filter(cat=>cat.section===section&&scores[cat.id]==null);
    if(!cats.length)return"";
    return `<div class="kniffel-entry-group">
      <div class="kniffel-entry-group-title">${escHtml(section)}</div>
      <div class="kniffel-entry-grid">
        ${cats.map(cat=>{
          const preview=kniffelScoreFor(cat.id,k.dice||[]);
          return `<button type="button" class="kniffel-entry-btn" onclick="window.pickKniffelCategory('${cat.id}')">
            <span class="kniffel-entry-label">${escHtml(cat.name)}</span>
            <span class="kniffel-entry-score ${preview===0?"zero":""}">${preview}</span>
          </button>`;
        }).join("")}
      </div>
    </div>`;
  }).join("");
  if(!sections.trim())return"";
  return `<div class="kniffel-entry-panel">
    <div class="kniffel-entry-head">
      <div class="kniffel-entry-title">Eintragen</div>
      <div class="kniffel-entry-sub">Vorschauwerte</div>
    </div>
    <div class="kniffel-entry-groups">${sections}</div>
  </div>`;
}
function kniffelScoreSheetHtml(state,{interactive=false}={}){
  const k=normalizeKniffelState(state.kniffel,state.players||{});
  const order=kniffelOrder({...state,kniffel:k});
  let lastSection="";
  const rows=[];
  KNIFFEL_CATEGORIES.forEach(cat=>{
    if(cat.section!==lastSection){
      lastSection=cat.section;
      rows.push(`<tr class="kniffel-section-row"><td colspan="${order.length+1}">${escHtml(lastSection)}</td></tr>`);
    }
    rows.push(`<tr>
      <td>${escHtml(cat.name)}</td>
      ${order.map(pid=>{
        const scores=kniffelScoresForPlayer(state,pid);
        const val=scores[cat.id];
        const canPick=interactive&&!kniffelIsRolling(k)&&pid===myId&&k.turn===myId&&k.rolls>0&&val==null;
        if(canPick){
          const preview=kniffelScoreFor(cat.id,k.dice||[]);
          return `<td class="kniffel-current-player"><button type="button" class="kniffel-score-btn" onclick="window.pickKniffelCategory('${cat.id}')">${preview}</button></td>`;
        }
        return `<td class="${pid===k.turn?"kniffel-current-player":""}">${val!=null?safeNum(val):`<span class="kniffel-empty">—</span>`}</td>`;
      }).join("")}
    </tr>`);
  });
  rows.push(`<tr class="kniffel-total-row"><td>Oben</td>${order.map(pid=>`<td>${kniffelUpperTotal(kniffelScoresForPlayer(state,pid))}</td>`).join("")}</tr>`);
  rows.push(`<tr class="kniffel-total-row"><td>Bonus</td>${order.map(pid=>`<td>${kniffelBonus(kniffelScoresForPlayer(state,pid))}</td>`).join("")}</tr>`);
  rows.push(`<tr class="kniffel-total-row"><td>Gesamt</td>${order.map(pid=>`<td>${kniffelTotal(kniffelScoresForPlayer(state,pid))}</td>`).join("")}</tr>`);
  return `<div class="kniffel-score-wrap"><table class="kniffel-sheet">
    <thead><tr><th>Feld</th>${order.map(pid=>`<th class="${pid===k.turn?"kniffel-current-player":""}">${escHtml(state.players?.[pid]?.name||"?")}</th>`).join("")}</tr></thead>
    <tbody>${rows.join("")}</tbody>
  </table></div>`;
}
function renderKniffelPlaying(){
  if(!gameState)return;
  stopRoundTimer();
  const letterStage=document.querySelector(".letter-stage");
  if(letterStage) letterStage.style.display="none";
  const tiEl=document.getElementById("typing-indicators-area"); if(tiEl) tiEl.innerHTML="";
  const bEl=document.getElementById("buzzer-container"); if(bEl) bEl.innerHTML="";
  const cEl=document.getElementById("playing-content"); if(!cEl)return;
  const k=normalizeKniffelState(gameState.kniffel,gameState.players||{});
  const turnName=kniffelPlayerName(k.turn);
  const isMyTurn=k.turn===myId;
  const dice=normalizeKniffelDice(k.dice);
  const held=normalizeKniffelHeld(k.held);
  const rolling=kniffelIsRolling(k);
  scheduleKniffelRollRender(k);
  const canRoll=isMyTurn&&!rolling&&kniffelCanRoll(k);
  const canHold=isMyTurn&&!rolling&&k.rolls>0&&kniffelDiceReady(dice);
  const rollLabel=rolling?"Würfelt…":(k.rolls===0?"Würfeln":(held.every(Boolean)?"Alle behalten":(k.rolls>=3?"Keine Würfe übrig":`Nochmal würfeln (${3-k.rolls})`)));
  const status=isMyTurn?"Du bist dran":`${turnName} ist dran`;
  const sub=rolling
    ?"Die Würfel rollen…"
    :(isMyTurn
      ?(k.rolls===0?"Würfle bis zu dreimal.":(k.rolls>=3?"Trage jetzt ein Feld ein.":`Wurf ${k.rolls} / 3 · Würfel antippen zum Behalten`))
      :"Du schaust zu");
  cEl.innerHTML=`
    <div class="kniffel-game">
      <div class="kniffel-panel">
        <div class="kniffel-title">${escHtml(status)}</div>
        <div class="kniffel-sub">${escHtml(sub)}</div>
        <div class="kniffel-dice-row">
          ${dice.map((n,i)=>{
            const dieRolling=rolling&&normalizeKniffelRollingMask(k.rollingMask)[i];
            return `<button type="button" class="kniffel-die ${held[i]?"held":""} ${dieRolling?"rolling":""} ${canHold?"clickable":""}" ${canHold?`onclick="window.toggleKniffelHold(${i})"`:"disabled"} aria-label="Würfel ${i+1}${n?`: ${n}`:""}${held[i]?", behalten":""}${dieRolling?", rollt":""}"><span class="kniffel-die-face ${dieRolling?"rolling":""}">${kniffelDisplayDieFace(k,dice,i)}</span></button>`;
          }).join("")}
        </div>
        ${isMyTurn?`<div class="kniffel-actions">
          <button type="button" class="btn" ${canRoll?`onclick="window.rollKniffelDice()"`:"disabled"}>${escHtml(rollLabel)}</button>
          ${!rolling&&k.rolls===0?`<div class="hint">Nach dem ersten Wurf kannst du Würfel behalten und unten ein Feld eintragen.</div>`:""}
          ${!rolling&&k.rolls>0?`<div class="hint">Zum Eintragen unten einen Vorschauwert antippen.</div>`:""}
        </div>`:""}
      </div>
      ${k.lastScore?`<div class="round-ended-note">${escHtml(gameState.players?.[k.lastScore.player]?.name||"?")} hat ${safeNum(k.lastScore.score)} Punkte bei ${escHtml(KNIFFEL_CATEGORIES.find(c=>c.id===k.lastScore.category)?.name||k.lastScore.category)} eingetragen.</div>`:""}
      ${kniffelEntryChoicesHtml(gameState,k)}
      ${kniffelScoreSheetHtml({...gameState,kniffel:k},{interactive:false})}
    </div>`;
}
window.toggleKniffelHold=async function(index){
  index=Number(index);
  if(!Number.isInteger(index)||index<0||index>4)return;
  if(!gameState||gameState.gameType!=="kniffel"||gameState.phase!=="playing")return;
  setConnStatus("sync");
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="kniffel"||cur.phase!=="playing")return;
      const k=normalizeKniffelState(cur.kniffel,cur.players||{});
      if(kniffelIsRolling(k)||k.phase!=="playing"||k.turn!==myId||safeNum(k.rolls)<=0||!kniffelDiceReady(k.dice))return;
      k.held=normalizeKniffelHeld(k.held);
      k.held[index]=!k.held[index];
      cur.kniffel=k;
      return cur;
    });
    setConnStatus("ok");
  }catch(e){ setConnStatus("err"); }
};
window.rollKniffelDice=async function(){
  if(!gameState||gameState.gameType!=="kniffel"||gameState.phase!=="playing")return;
  setConnStatus("sync");
  let didRoll=false;
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="kniffel"||cur.phase!=="playing")return;
      const k=normalizeKniffelState(cur.kniffel,cur.players||{});
      if(kniffelIsRolling(k)||k.phase!=="playing"||k.turn!==myId||!kniffelCanRoll(k))return;
      const dice=normalizeKniffelDice(k.dice);
      const held=k.rolls===0?emptyKniffelHeld():normalizeKniffelHeld(k.held);
      const rollingMask=emptyKniffelRollingMask();
      for(let i=0;i<5;i++){
        if(k.rolls===0||!held[i]){
          dice[i]=Math.floor(Math.random()*6)+1;
          rollingMask[i]=true;
        }
      }
      k.dice=dice;
      k.held=held;
      k.rolls=safeNum(k.rolls)+1;
      k.rollingUntil=Date.now()+850;
      k.rollingNonce=safeNum(k.rollingNonce)+1;
      k.rollingMask=rollingMask;
      cur.kniffel=k;
      didRoll=true;
      return cur;
    });
    if(didRoll) playSoundSubmit();
    setConnStatus("ok");
  }catch(e){ setConnStatus("err"); }
};
window.pickKniffelCategory=async function(catId){
  if(!KNIFFEL_CATEGORIES.some(c=>c.id===catId))return;
  if(!gameState||gameState.gameType!=="kniffel"||gameState.phase!=="playing")return;
  setConnStatus("sync");
  let didPick=false;
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="kniffel"||cur.phase!=="playing")return;
      let k=normalizeKniffelState(cur.kniffel,cur.players||{});
      if(kniffelIsRolling(k)||k.phase!=="playing"||k.turn!==myId||safeNum(k.rolls)<=0||!kniffelDiceReady(k.dice))return;
      if(!k.scores)k.scores={};
      if(!k.scores[myId])k.scores[myId]={};
      if(k.scores[myId][catId]!=null)return;
      const score=kniffelScoreFor(catId,k.dice||[]);
      k.scores[myId][catId]=score;
      k.lastScore={player:myId,category:catId,score};
      const stateForCalc={players:cur.players||{},kniffel:k};
      const order=kniffelOrder(stateForCalc);
      const allDone=order.length>0&&order.every(pid=>kniffelPlayerComplete(k.scores?.[pid]||{}));
      if(allDone){
        const winner=kniffelWinnerId(stateForCalc);
        k={...k,winner,phase:"results",turn:null,dice:emptyKniffelDice(),held:emptyKniffelHeld(),rolls:0,rollingUntil:0,rollingMask:emptyKniffelRollingMask()};
        cur.phase="results";
        if(winner&&cur.players?.[winner]) cur.players[winner].score=safeNum(cur.players[winner].score)+1;
      }else{
        const nextTurn=kniffelNextPlayer(stateForCalc,myId);
        k=kniffelResetDiceTurn(k,nextTurn);
      }
      cur.kniffel=k;
      didPick=true;
      return cur;
    });
    if(didPick) playSoundSubmit();
    setConnStatus("ok");
  }catch(e){ setConnStatus("err"); }
};

function connect4RoleFor(state,playerId){
  const seats=state?.connect4?.seats||{};
  if(playerId===seats.red)return"red";
  if(playerId===seats.yellow)return"yellow";
  return null;
}
function connect4ColumnFull(board,col){
  return !!board[col];
}
function connect4DropRow(board,col){
  for(let r=5;r>=0;r--){
    const idx=r*7+col;
    if(!board[idx])return r;
  }
  return -1;
}
function connect4CheckWin(board,row,col,token){
  const dirs=[[0,1],[1,0],[1,1],[1,-1]];
  for(const [dr,dc] of dirs){
    const cells=[[row,col]];
    for(const sign of [-1,1]){
      let r=row+dr*sign,c=col+dc*sign;
      while(r>=0&&r<6&&c>=0&&c<7&&board[r*7+c]===token){
        cells.push([r,c]);
        r+=dr*sign; c+=dc*sign;
      }
    }
    if(cells.length>=4){
      return cells.slice(0,4).map(([r,c])=>r*7+c);
    }
  }
  return [];
}
function connect4BoardFull(board){
  return board.every(Boolean);
}
function renderConnect4Playing(){
  if(!gameState)return;
  stopRoundTimer();
  const letterStage=document.querySelector(".letter-stage");
  if(letterStage) letterStage.style.display="none";
  const tiEl=document.getElementById("typing-indicators-area");
  if(tiEl) tiEl.innerHTML="";
  const bEl=document.getElementById("buzzer-container");
  if(bEl) bEl.innerHTML="";
  const cEl=document.getElementById("playing-content");
  if(!cEl)return;
  const c4=gameState.connect4||initialConnect4State();
  const seats=c4.seats||{};
  const redName=connect4PlayerName(seats.red);
  const yellowName=connect4PlayerName(seats.yellow);
  const turnId=seats[c4.turn]||null;
  const turnName=connect4PlayerName(turnId);
  const myRoleKey=connect4RoleFor(gameState,myId);
  const myRole=myRoleKey==="red"?"Rot":myRoleKey==="yellow"?"Gelb":"Zuschauer";
  const board=normalizeConnect4Board(c4.board);
  const isMyTurn=!!(myRoleKey&&c4.turn===myRoleKey&&!c4.winner);
  const statusText=isMyTurn?"Du bist dran":`${turnName} ist dran`;
  const statusSub=myRoleKey?`Du bist ${myRole}`:"Du schaust zu";
  const moveKey=(c4.lastMove!=null&&c4.moveCount>0)?`${c4.round||0}_${c4.moveCount}_${c4.lastMove}`:null;
  const animateMove=!!(moveKey&&moveKey!==connect4LastAnimatedMoveKey);
  cEl.innerHTML=`
    <div class="connect4-game">
      <div class="connect4-status">
        ${escHtml(statusText)}
        <div class="connect4-status-sub">${escHtml(statusSub)}</div>
      </div>
      <div class="connect4-legend">
        <div class="connect4-seat"><span class="connect4-seat-left"><span class="connect4-disc red"></span><span class="connect4-seat-name">${escHtml(redName)}</span></span><span class="connect4-seat-role">Rot</span></div>
        <div class="connect4-seat"><span class="connect4-seat-left"><span class="connect4-disc yellow"></span><span class="connect4-seat-name">${escHtml(yellowName)}</span></span><span class="connect4-seat-role">Gelb</span></div>
      </div>
      <div class="connect4-board" aria-label="Vier gewinnt Spielbrett">
        ${board.map((cell,i)=>{
          const col=i%7;
          const playable=isMyTurn&&!connect4ColumnFull(board,col);
          const win=(c4.winCells||[]).includes(i)?"win":"";
          const last=(animateMove&&c4.lastMove===i)?"last":"";
          const dropStyle=last?` style="--drop-y:${-(Math.floor(i/7)+1)*44}px"`:"";
          return`<button type="button" class="connect4-cell ${cell||""} ${playable?"playable":""} ${win} ${last}"${dropStyle}
            data-cell="${i}"
            data-col="${col}"
            aria-label="Spalte ${col+1}"
            ${playable?"":"disabled"}></button>`;
        }).join("")}
      </div>
    </div>`;
  cEl.querySelectorAll(".connect4-cell.playable").forEach(btn=>{
    btn.addEventListener("click",()=>window.makeConnect4Move(Number(btn.dataset.col)));
  });
  if(animateMove) connect4LastAnimatedMoveKey=moveKey;
}
window.abortConnect4Game=async function(){
  if(!isHost||!gameState||gameState.gameType!=="connect4"||gameState.phase!=="playing")return;
  const c4=gameState.connect4||initialConnect4State();
  const starter=connect4StarterForNextRound(c4);
  await updateRoomData({
    phase:"lobby",
    connect4:{
      ...c4,
      board:emptyConnect4Board(),
      turn:starter,
      winner:null,
      winCells:[],
      lastMove:null,
      moveCount:0,
      nextStarter:starter
    }
  });
};
window.makeConnect4Move=async function(col){
  col=Number(col);
  if(!Number.isInteger(col)||col<0||col>6)return;
  if(!gameState||gameState.gameType!=="connect4"||gameState.phase!=="playing")return;
  setConnStatus("sync");
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="connect4"||cur.phase!=="playing")return;
      const role=connect4RoleFor(cur,myId);
      const c4=cur.connect4||{};
      if(!role||c4.turn!==role||c4.winner)return;
      let board=normalizeConnect4Board(c4.board);
      const localC4=gameState?.connect4;
      if(localC4&&String(localC4.round||0)===String(c4.round||0)){
        board=mergeConnect4Boards(board,localC4.board);
      }
      const row=connect4DropRow(board,col);
      if(row<0)return;
      board[row*7+col]=role;
      const winCells=connect4CheckWin(board,row,col,role);
      const isDraw=!winCells.length&&connect4BoardFull(board);
      const nextStarter=winCells.length?otherConnect4Turn(role):(isDraw?randomConnect4Turn():(c4.nextStarter||null));
      cur.connect4={
        ...c4,
        board,
        turn:winCells.length||isDraw?role:otherConnect4Turn(role),
        winner:winCells.length?role:(isDraw?"draw":null),
        winCells,
        lastMove:row*7+col,
        moveCount:(c4.moveCount||0)+1,
        nextStarter
      };
      if(winCells.length){
        const winnerId=c4.seats?.[role];
        if(winnerId&&cur.players?.[winnerId]) cur.players[winnerId].score=safeNum(cur.players[winnerId].score)+1;
        cur.phase="results";
      }else if(isDraw){
        cur.phase="results";
      }
      return cur;
    });
    setConnStatus("ok");
  }catch(e){
    setConnStatus("err");
  }
};
function renderSlfPlaying(){
  if(!gameState)return;
  const letterStage=document.querySelector(".letter-stage");
  if(letterStage) letterStage.style.display="";
  const cats=objToCats(gameState.cats);
  const usedLetters=gameState.usedLetters||[];
  const roundLimit=gameState.roundLimit||0;

  document.getElementById("round-badge").textContent=`Runde ${gameState.round}${roundLimit>0?" / "+roundLimit:""}`;
  document.getElementById("big-letter").textContent=gameState.letter;

  const prevUsed=usedLetters.filter(l=>l!==gameState.letter);
  document.getElementById("used-letters-display").innerHTML=prevUsed.length>0
    ?prevUsed.map(l=>`<div class="used-letter-chip">${l}</div>`).join("")
    :"";

  if(roundLimit>0){
    document.getElementById("round-progress-pips").innerHTML=Array.from({length:roundLimit},(_,i)=>{
      const rn=i+1;
      const cls=rn<gameState.round?"done":rn===gameState.round?"current":"future";
      return`<div class="round-pip ${cls}"></div>`;
    }).join("");
  }else{
    document.getElementById("round-progress-pips").innerHTML="";
  }

  const typingStatus=gameState.typingStatus||{};
  const typingOthers=Object.entries(typingStatus)
    .filter(([id,ts])=>id!==myId&&Date.now()-ts<4000)
    .map(([id])=>gameState.players?.[id]?.name)
    .filter(Boolean);
  const tiEl=document.getElementById("typing-indicators-area");
  if(tiEl){
    tiEl.innerHTML=typingOthers.length>0
      ?`<div class="typing-indicators">${typingOthers.map(name=>
          `<div class="typing-chip">${escHtml(name)} <div class="typing-dots"><span></span><span></span><span></span></div></div>`
        ).join("")}</div>`
      :`<div class="typing-indicators"></div>`;
  }

  const bEl=document.getElementById("buzzer-container");
  const cEl=document.getElementById("playing-content");

  if(letterRevealActive()){
    if(letterStage) letterStage.style.display="none";
    if(tiEl) tiEl.innerHTML="";
    const timerArea=document.getElementById("timer-bar-area");
    if(timerArea) timerArea.innerHTML="";
    if(bEl) bEl.innerHTML="";
    if(cEl) cEl.innerHTML=renderLetterRevealOverlay();
    scheduleLetterRevealRender();
    return;
  }
  if(letterStage) letterStage.style.display="";
  renderTimerBar();

  if(gameState.phase==="collecting"){
    const msg=gameState.buzzer
      ?`🔔 ${escHtml(gameState.buzzer)} hat STOPP gerufen — Einsammeln!`
      :`⌛ Zeit läuft ab — Einsammeln!`;
    bEl.innerHTML=`<div class="buzzer-fired">${msg}</div>`;
    if(submitted){cEl.innerHTML=renderWaiting(); bEl.innerHTML=""; return;}
  }

  if(gameState.phase==="stopping"){
    const msg=gameState.buzzer
      ?`🔔 ${escHtml(gameState.buzzer)} hat STOPP gerufen!`
      :`⌛ Zeit abgelaufen!`;
    bEl.innerHTML=`<div class="buzzer-fired">${msg}</div>`;
    cEl.innerHTML=renderWaiting("Auswertung…");
    return;
  }

  if(gameState.phase==="playing"){ 
    const pendingStop=currentStopRequest(gameState);
    if(gameState.buzzer||pendingStop){
      const stopName=gameState.buzzer||pendingStop?.name||"Jemand";
      bEl.innerHTML=`<div class="buzzer-fired" id="buzzer-ticker">🔔 ${escHtml(stopName)} hat STOPP gerufen!</div>`;
    }else if(!submitted){
      bEl.innerHTML=`<div class="buzzer-wrap"><button type="button" class="buzzer-btn" onclick="window.triggerBuzzer()">STOPP!</button></div>`;
    }else{
      bEl.innerHTML="";
    }
  }

  if(submitted){cEl.innerHTML=renderWaiting(); bEl.innerHTML=""; return;}

  if(!cEl.querySelector(".answer-form")){
    cEl.innerHTML=`
      <div class="answer-form">
        <div class="answer-sheet-head">
          <span>Kategorie</span>
          <span>Antwort · ${escHtml(gameState.letter)}</span>
        </div>
        ${cats.map((cat,i)=>`
          <div class="answer-row">
            <span class="ans-cat">${escHtml(cat)}</span>
            <input type="text" id="ans-${i}"
              placeholder="${gameState.letter}…"
              autocomplete="off"
              inputmode="text"
              autocapitalize="words"/>
          </div>`).join("")}
      </div>`;
    cats.forEach((cat,i)=>{
      if(localAnswers[cat]){
        const e=document.getElementById(`ans-${i}`);
        if(e)e.value=localAnswers[cat];
      }
    });
    const firstEl=document.getElementById("ans-0");
    if(firstEl)setTimeout(()=>firstEl.focus(),100);
  }
}

function renderWaiting(){
  if(!gameState)return"";
  const ans=gameState.roundAnswers||{};
  const total=Object.keys(gameState.players||{}).length;
  const pending=total-Object.keys(ans).length;
  const chips=Object.entries(gameState.players||{}).map(([id,p])=>
    `<span class="wait-chip ${ans[id]?"done":"pending"}">${ans[id]?"✓":"…"} ${escHtml(p.name)}</span>`).join("");
  return`<div class="waiting-block">
    <div class="waiting-icon">✅</div>
    <div class="waiting-title">Abgegeben!</div>
    <div style="font-size:15px;color:var(--pencil);margin-bottom:12px;font-weight:600;">Noch ${Math.max(0,pending)} Spieler…</div>
    <div class="wait-players">${chips}</div>
  </div>`;
}

function collectCurrentAnswers(){
  const cats=objToCats(gameState?.cats);
  const ans={...localAnswers};
  cats.forEach((cat,i)=>{
    const e=document.getElementById(`ans-${i}`);
    if(e) ans[cat]=e.value;
    else if(ans[cat]==null) ans[cat]="";
  });
  return ans;
}
function roundKey(state=gameState){return String(state?.round||0);}
function currentStopRequest(state=gameState){
  const req=state?.stopRequest;
  if(!req||String(req.round)!==String(state?.round||0))return null;
  return req;
}
async function applyStopRequest(req){
  if(!req||!myRoom)return;
  const now=Date.now();
  await updateRoomData({
    phase:"stopping",
    buzzer:req.name||"STOPP",
    buzzerTs:safeNum(req.ts)||now,
    stopUntil:now+STOPPING_MS,
    collectUntil:null,
    typingStatus:{}
  });
}
async function saveLiveAnswersNow(){
  if(!myRoom||!myId||!gameState||gameState.phase!=="playing")return;
  const rk=roundKey();
  const ans=collectCurrentAnswers();
  await update(roomRef(),{[`liveAnswers/${rk}/${myId}`]:ans});
}
async function queueLiveSave(){
  if(!myRoom||!myId||!gameState||gameState.phase!=="playing")return;
  liveSaveQueued=true;
  if(liveSaveRunning)return;
  liveSaveRunning=true;
  try{
    while(liveSaveQueued){
      liveSaveQueued=false;
      if(!gameState||gameState.phase!=="playing")break;
      await saveLiveAnswersNow();
    }
  }catch(e){
    setConnStatus("err");
  }finally{
    liveSaveRunning=false;
  }
}
async function flushFinalAnswersNow(){
  if(finalFlushed)return;
  if(finalFlushPromise)return finalFlushPromise;
  if(!myRoom||!myId||!gameState||!["playing","stopping","collecting"].includes(gameState.phase))return;
  const rk=roundKey();
  const ans=collectCurrentAnswers();
  finalFlushPromise=Promise.resolve().then(async()=>{
    try{
      await update(roomRef(),{
        [`liveAnswers/${rk}/${myId}`]:ans,
        [`finalAnswers/${rk}/${myId}`]:ans,
        [`submittedStatus/${myId}`]:true,
        [`typingStatus/${myId}`]:null
      });
      finalFlushed=true;
      submitted=true;
      sessionStorage.removeItem("slf_local_answers");
    }catch(e){
      setConnStatus("err");
    }finally{
      finalFlushPromise=null;
    }
  });
  return finalFlushPromise;
}
window.triggerBuzzer=async function(){
  if(!gameState||gameState.phase!=="playing")return;
  const now=Date.now();
  const ownAnswers=collectCurrentAnswers();
  const rk=roundKey();
  const request={round:safeNum(gameState.round)||0,by:myId,name:myName||"STOPP",ts:now};
  setConnStatus("sync");
  try{
    const tx=await runTransaction(ref(db,`rooms/${myRoom}/stopRequest`),cur=>{
      if(cur&&String(cur.round)===String(gameState.round||0))return cur;
      return request;
    });
    const req=(tx?.snapshot?.val?.()&&String(tx.snapshot.val().round)===String(gameState.round||0))?tx.snapshot.val():request;
    await update(roomRef(),{
      [`liveAnswers/${rk}/${myId}`]:ownAnswers,
      [`finalAnswers/${rk}/${myId}`]:ownAnswers,
      [`submittedStatus/${myId}`]:true,
      phase:"stopping",
      buzzer:req.name||request.name,
      buzzerTs:safeNum(req.ts)||now,
      stopUntil:Date.now()+STOPPING_MS,
      collectUntil:null,
      stopRequest:req,
      typingStatus:{}
    });
    finalFlushed=true;
    submitted=true;
    sessionStorage.removeItem("slf_local_answers");
    setConnStatus("ok");
  }catch(e){
    // Falls nur die Phasen-Aktualisierung scheitert, hilft der kleine stopRequest-Knoten
    // dem Host/Requester beim nächsten Sync trotzdem, die Runde zu stoppen.
    try{await update(roomRef(),{stopRequest:request});}catch(_e){}
    setConnStatus("err");
  }
};
function triggerLocalBuzzerTicker(){
  if(localBuzzerCountdown)clearInterval(localBuzzerCountdown);
  if(gameState?.phase==="stopping") flushFinalAnswersNow();
}
window.submitAnswers=async function(){
  if(submitted||submitting)return;
  submitting=true;
  try{
    await flushFinalAnswersNow();
    playSoundSubmit();
    renderPlaying();
  }catch(e){
    submitted=false;
    setConnStatus("err");
  }finally{
    submitting=false;
  }
};

// ─── HOST ROUND END ──────────────────────────────────────────────
async function checkHostRoundEnd(){
  if(!isHost)return;
  const cur=(await get(roomRef())).val();
  if(!cur||(cur.phase!=="playing"&&cur.phase!=="collecting"&&cur.phase!=="stopping"))return;
  const active=activePlayerIds(cur);
  const rk=String(cur.round||0);
  const finals=cur.finalAnswers?.[rk]||{};
  const allFinal=active.length>0&&active.every(id=>finals[id]);
  const allSubmitted=active.length>0&&active.every(id=>cur.submittedStatus?.[id]);
  if(cur.phase==="stopping"){
    if(allFinal||Date.now()>=(cur.stopUntil||0)) await forceRoundEnd(cur);
  }else if(cur.phase==="collecting"){
    if(allSubmitted||Date.now()>=(cur.collectUntil||0)) await forceRoundEnd(cur);
  }else if(allSubmitted){
    await forceRoundEnd(cur);
  }
}
function buildRoundAnswersForScoring(state){
  const cats=objToCats(state.cats);
  const pids=Object.keys(state.players||{});
  const rk=String(state.round||0);
  const finals=state.finalAnswers?.[rk]||{};
  const lives=state.liveAnswers?.[rk]||{};
  const existing=state.roundAnswers||{};
  const out={};
  pids.forEach(id=>{
    out[id]={};
    cats.forEach(cat=>{
      out[id][cat]=finals[id]?.[cat] ?? lives[id]?.[cat] ?? existing[id]?.[cat] ?? "";
    });
  });
  return out;
}
async function forceRoundEnd(cur){
  if(!cur||cur.phase==="results")return;
  cur.roundAnswers=buildRoundAnswersForScoring(cur);
  calculateBaseScores(cur);
  cur.phase="results";
  cur.collectUntil=null;
  cur.stopUntil=null;
  cur.typingStatus={};
  setConnStatus("sync");await set(roomRef(),cur);setConnStatus("ok");
}
function calculateBaseScores(state){
  const cats=objToCats(state.cats);
  const pids=Object.keys(state.players||{});
  const rejections=state.rejections||{};
  const roundScores={};
  pids.forEach(id=>{roundScores[id]=0;});
  cats.forEach(cat=>{
    const valid=pids.map(id=>{
      const raw=(state.roundAnswers?.[id]?.[cat]||"").trim();
      let v=normalizeAnswer(raw);
      if(rejections[`${id}__${cat}`])v="";
      if(v&&!v.startsWith(normalizeAnswer(state.letter)))v="";
      return{id,v};
    });
    valid.forEach(({id,v})=>{
      if(!v)return;
      const tot=valid.filter(a=>a.v!=="").length;
      const dup=valid.filter(a=>a.v===v).length;
      roundScores[id]+=(tot===1?20:dup===1?10:5);
    });
  });
  pids.forEach(id=>{
    state.players[id].score=safeNum(state.players[id].score)+roundScores[id];
  });
}
function resetScoresAndRecalculate(state){
  Object.keys(state.players||{}).forEach(id=>{
    state.players[id].score=state.preRoundScores?safeNum(state.preRoundScores[id]):0;
  });
  calculateBaseScores(state);
}
function eligibleVoterIds(state,answerPid){
  return Object.keys(state.players||{}).filter(id=>id!==answerPid);
}
function voteThreshold(state,answerPid){
  const n=eligibleVoterIds(state,answerPid).length;
  return n>0?Math.floor(n/2)+1:Infinity;
}
function voteRejectCount(state,key,answerPid){
  const votes=state.validationVotes?.[key]||{};
  return eligibleVoterIds(state,answerPid).filter(id=>votes[id]).length;
}
function recomputeVoteRejections(state){
  if((state.validationMode||"host")!=="vote")return;
  const next={};
  Object.keys(state.validationVotes||{}).forEach(key=>{
    const sep=key.indexOf("__");
    if(sep<0)return;
    const answerPid=key.slice(0,sep);
    const threshold=voteThreshold(state,answerPid);
    if(Number.isFinite(threshold)&&voteRejectCount(state,key,answerPid)>=threshold){
      next[key]=true;
    }
  });
  state.rejections=next;
}
window.toggleAnswerStrikeByKey=function(actionKey){
  const data=resultActionMap[actionKey];
  if(data) window.toggleAnswerStrike(data.pid,data.cat);
};
window.toggleVoteByKey=function(actionKey){
  const data=resultActionMap[actionKey];
  if(data) window.toggleVote(data.pid,data.cat);
};
window.toggleAnswerStrike=async function(pid,cat){
  if(!isHost||!gameState||gameState.phase!=="results"||(gameState.validationMode||"host")!=="host")return;
  const key=`${pid}__${cat}`;
  const cur=(await get(roomRef())).val();
  if(!cur||(cur.validationMode||"host")!=="host")return;
  if(!cur.rejections)cur.rejections={};
  if(cur.rejections[key]){
    delete cur.rejections[key];
  }else{
    cur.rejections[key]=true;
  }
  resetScoresAndRecalculate(cur);
  await set(roomRef(),cur);
};
window.toggleVote=async function(pid,cat){
  if(!gameState||gameState.phase!=="results"||(gameState.validationMode||"host")!=="vote"||pid===myId)return;
  const key=`${pid}__${cat}`;
  setConnStatus("sync");
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.phase!=="results"||(cur.validationMode||"host")!=="vote")return;
      if(!cur.players?.[myId]||!cur.players?.[pid]||pid===myId)return;
      const word=(cur.roundAnswers?.[pid]?.[cat]||"").trim();
      if(!word||!word.toLowerCase().startsWith(String(cur.letter||"").toLowerCase()))return;
      if(!cur.validationVotes)cur.validationVotes={};
      if(!cur.validationVotes[key])cur.validationVotes[key]={};
      if(cur.validationVotes[key][myId]) delete cur.validationVotes[key][myId];
      else cur.validationVotes[key][myId]=true;
      if(Object.keys(cur.validationVotes[key]).length===0) delete cur.validationVotes[key];
      recomputeVoteRejections(cur);
      resetScoresAndRecalculate(cur);
      return cur;
    });
    setConnStatus("ok");
  }catch(e){
    setConnStatus("err");
  }
};

// ─── RESULTS ─────────────────────────────────────────────────────
function calcRoundPoints(state){
  const cats=objToCats(state.cats);
  const pids=Object.keys(state.players||{});
  const rejections=state.rejections||{};
  const result={};
  pids.forEach(id=>{ result[id]={}; });
  cats.forEach(cat=>{
    const answers=pids.map(id=>{
      const raw=(state.roundAnswers?.[id]?.[cat]||"").trim();
      let v=normalizeAnswer(raw);
      if(rejections[`${id}__${cat}`]) v="";
      if(v&&!v.startsWith(normalizeAnswer(state.letter))) v="";
      return{id,v};
    });
    answers.forEach(({id,v})=>{
      if(!v){ result[id][cat]=0; return; }
      const tot=answers.filter(a=>a.v!=="").length;
      const dup=answers.filter(a=>a.v===v).length;
      result[id][cat]=tot===1?20:dup===1?10:5;
    });
  });
  return result;
}

function setResultsMode(mode=""){
  const screen=document.getElementById("screen-results");
  if(!screen)return;
  screen.classList.toggle("connect4-results-screen",mode==="connect4");
}
function setResultLabels(primary,secondary){
  const labels=document.querySelectorAll("#screen-results .section-label");
  if(labels[0]){ labels[0].textContent=primary; labels[0].style.display=""; }
  if(labels[1]){ labels[1].textContent=secondary; labels[1].style.display=""; }
}
function renderResults(){
  if(gameState?.gameType==="connect4") return renderConnect4Results();
  if(gameState?.gameType==="battleship") return renderBattleshipResults();
  if(gameState?.gameType==="kniffel") return renderKniffelResults();
  if(gameState?.gameType==="drawing") return renderDrawingResults();
  if(gameState?.gameType==="maumau") return renderMauMauResults();
  return renderSlfResults();
}
function renderMauMauResults(){
  setResultsMode("");
  setResultLabels("Siege","Endstand");
  const m=gameState.maumau||initialMauMauState();
  const players=gameState.players||{};
  const winner=m.winner||null;
  const winnerName=winner?(players[winner]?.name||"?"):"?";
  const goArea=document.getElementById("gameover-area");
  if(goArea){
    goArea.innerHTML=winner?`<div class="gameover-banner"><div class="gameover-title">🏆 ${escHtml(winnerName)} gewinnt!</div><div class="gameover-winner">+1 Sieg</div></div>`:"";
  }
  document.getElementById("validation-banner-area").innerHTML=m.lastAction?`<div class="round-ended-note">${escHtml(m.lastAction)}</div>`:"";
  document.getElementById("scoreboard").innerHTML=Object.entries(players).sort((a,b)=>safeNum(b[1].score)-safeNum(a[1].score)).map(([id,p],i)=>`
    <div class="score-row ${id===winner?"gold":""}">
      ${scoreNameHtml(id,p,["①","②","③"][i]||"")}
      <div class="score-pts">${safeNum(p.score)} Siege</div>
    </div>`).join("");
  const order=mauMauOrder(gameState);
  document.getElementById("results-container").innerHTML=`<div class="maumau-game"><div class="maumau-panel"><div class="maumau-title">Karten übrig</div><div class="maumau-players">${order.map(id=>`<div class="maumau-player-row ${id===winner?"active":""}"><span>${escHtml(players[id]?.name||"?")}</span><span>${mauMauHandCount(gameState,id)} Karten</span></div>`).join("")}</div></div></div>`;
  document.getElementById("results-actions").innerHTML=isHost?`<button type="button" class="btn" onclick="window.resetMauMauGame()">Nochmal spielen →</button>`:`<button type="button" class="btn btn-outline" disabled>Warte auf den Host…</button>`;
}
function renderDrawingResults(){
  setResultsMode("");
  setResultLabels("Punkte","Auflösung");
  const d=gameState.drawing||initialDrawingState();
  const correct=d.lastCorrect;
  const word=String(d.word||"?");
  const drawerName=drawingPlayerName(d.drawer);
  const winnerName=correct?(gameState.players?.[correct.player]?.name||correct.name||"?"):"";
  const goArea=document.getElementById("gameover-area");
  if(goArea){
    goArea.innerHTML=correct
      ?`<div class="gameover-banner drawing-correct-banner"><div class="gameover-title">✅ ${escHtml(winnerName)} hat es erraten!</div><div class="gameover-winner">${escHtml(drawerName)} +1 · ${escHtml(winnerName)} +2</div></div>`
      :`<div class="gameover-banner drawing-correct-banner"><div class="gameover-title">⏱️ Zeit abgelaufen</div><div class="gameover-winner">Das Wort war: ${escHtml(word)}</div></div>`;
  }
  document.getElementById("validation-banner-area").innerHTML=`<div class="round-ended-note">Wort: <strong>${escHtml(word)}</strong></div>`;
  document.getElementById("scoreboard").innerHTML=Object.entries(gameState.players||{}).sort((a,b)=>safeNum(b[1].score)-safeNum(a[1].score)).map(([id,p],i)=>`
    <div class="score-row ${i===0?"gold":""}">
      ${scoreNameHtml(id,p,["①","②","③"][i]||"")}
      <div class="score-pts">${safeNum(p.score)} Punkte</div>
    </div>`).join("");
  document.getElementById("results-container").innerHTML=`
    <div class="drawing-game">
      <div class="drawing-canvas-wrap">
        <canvas id="drawing-result-canvas" class="drawing-canvas" aria-label="Montagsmaler Ergebniszeichnung"></canvas>
      </div>
      <div class="drawing-panel">
        <div class="drawing-title">Rateversuche</div>
        ${drawingRecentGuessesHtml(d)}
      </div>
    </div>`;
  setTimeout(()=>drawingDrawCanvas(document.getElementById("drawing-result-canvas"),d.strokes||{}),0);
  document.getElementById("results-actions").innerHTML=isHost
    ?`<button type="button" class="btn" onclick="window.nextDrawingRound()">Nächste Runde →</button>`
    :`<button type="button" class="btn btn-outline" disabled>Warte auf den Host…</button>`;
}
function renderKniffelResults(){
  if(!gameState)return;
  setResultsMode("");
  setResultLabels("Endstand","Wertungsblock");
  const k=normalizeKniffelState(gameState.kniffel,gameState.players||{});
  const resultState={...gameState,kniffel:k};
  const players=resultState.players||{};
  const ranked=kniffelRankedPlayers(resultState);
  const winner=k.winner||ranked[0]||null;
  const winnerName=winner?(players[winner]?.name||"?"):"?";
  const winnerPoints=winner?kniffelTotal(kniffelScoresForPlayer(resultState,winner)):0;
  document.getElementById("results-sub").textContent=`Kniffel · Spiel ${k.round||1}`;
  const goArea=document.getElementById("gameover-area");
  if(goArea){
    goArea.innerHTML=`<div class="gameover-banner">
      <div class="gameover-title">🏆 ${escHtml(winnerName)} gewinnt!</div>
      <div class="gameover-winner">${winnerPoints} Punkte</div>
    </div>`;
  }
  const banner=document.getElementById("validation-banner-area");
  if(banner) banner.innerHTML="";
  document.getElementById("scoreboard").innerHTML=ranked.map((id,i)=>`
    <div class="score-row ${id===winner?"gold":""}">
      ${scoreNameHtml(id,players[id]||{},["①","②","③"][i]||"")}
      <div class="score-pts">${kniffelTotal(kniffelScoresForPlayer(resultState,id))} Punkte</div>
    </div>`).join("");
  document.getElementById("results-container").innerHTML=`
    <div class="kniffel-game">
      ${kniffelResultSummaryHtml(resultState)}
      ${kniffelScoreSheetHtml(resultState,{interactive:false})}
    </div>`;
  document.getElementById("results-actions").innerHTML=isHost
    ?`<button type="button" class="btn" onclick="window.resetKniffelGame()">Nochmal spielen →</button>`
    :`<button type="button" class="btn btn-outline" disabled>Warte auf den Host…</button>`;
}

function renderConnect4Results(){
  if(!gameState)return;
  setResultsMode("connect4");
  setResultLabels("Siege","");
  const labels=document.querySelectorAll("#screen-results .section-label");
  if(labels[1]) labels[1].style.display="none";
  const c4=gameState.connect4||initialConnect4State();
  const seats=c4.seats||{};
  const players=gameState.players||{};
  const redName=connect4PlayerName(seats.red);
  const yellowName=connect4PlayerName(seats.yellow);
  const winnerName=c4.winner==="draw"?"Unentschieden":connect4PlayerName(seats[c4.winner]);
  document.getElementById("results-sub").textContent=`Vier gewinnt · Runde ${c4.round||1}`;
  const board=normalizeConnect4Board(c4.board);
  if(c4.winner&&c4.winner!=="draw"){
    (c4.winCells||[]).forEach(i=>{
      if(Number.isInteger(i)&&i>=0&&i<42&&!board[i]) board[i]=c4.winner;
    });
  }
  const boardHtml=`<div class="connect4-board" aria-label="Vier gewinnt Endstand">
    ${board.map((cell,i)=>`<div class="connect4-cell ${cell||""} ${(c4.winCells||[]).includes(i)?"win":""}"></div>`).join("")}
  </div>`;
  const goArea=document.getElementById("gameover-area");
  if(goArea){
    goArea.innerHTML=`<div class="connect4-result-stage">
      <div class="connect4-status">
        ${c4.winner==="draw"?"Unentschieden":`🏆 ${escHtml(winnerName)} gewinnt!`}
        <div class="connect4-status-sub">${c4.winner==="draw"?"Keine freien Felder mehr":`${escHtml(winnerName)} hat vier in einer Reihe`}</div>
      </div>
      ${boardHtml}
    </div>`;
  }
  const banner=document.getElementById("validation-banner-area"); if(banner) banner.innerHTML="";
  document.getElementById("scoreboard").innerHTML=[
    [seats.red,redName,"Rot"],[seats.yellow,yellowName,"Gelb"]
  ].filter(([id])=>id).map(([id,name,role],i)=>`
    <div class="score-row ${c4.winner!=="draw"&&id===seats[c4.winner]?"gold":""}">
      ${scoreNameHtml(id,players[id]||{name},role==="Rot"?"🔴":"🟡")}
      <div class="score-pts">${safeNum(players[id]?.score)} Siege</div>
    </div>`).join("");
  document.getElementById("results-container").innerHTML="";
  document.getElementById("results-actions").innerHTML=isHost
    ?`<button type="button" class="btn" onclick="window.resetConnect4Game()">Nochmal spielen →</button>`
    :`<button type="button" class="btn btn-outline" disabled>Warte auf den Host…</button>`;
}
function renderBattleshipResults(){
  if(!gameState)return;
  setResultsMode("");
  setResultLabels("Siege","Flotten");
  const bs=gameState.battleship||initialBattleshipState();
  const seats=bs.seats||{};
  const players=gameState.players||{};
  const p1Name=battleshipPlayerName(seats.p1);
  const p2Name=battleshipPlayerName(seats.p2);
  const winnerName=bs.winner?battleshipPlayerName(seats[bs.winner]):"?";
  document.getElementById("results-sub").textContent=`Schiffe versenken · Runde ${bs.round||1}`;
  const goArea=document.getElementById("gameover-area");
  if(goArea){
    goArea.innerHTML=`<div class="gameover-banner">
      <div class="gameover-title">🏆 ${escHtml(winnerName)} gewinnt!</div>
      <div class="gameover-winner">+1 Punkt</div>
    </div>`;
  }
  const banner=document.getElementById("validation-banner-area");
  if(banner){
    banner.innerHTML=bs.lastShot?`<div class="round-ended-note">${bs.lastShot.sunk?`Schiff versenkt${bs.lastShot.sunkSize?` (${bs.lastShot.sunkSize}er)`:""}`:(bs.lastShot.hit?"Treffer":"Wasser")} · Spiel beendet</div>`:"";
  }
  document.getElementById("scoreboard").innerHTML=[
    [seats.p1,p1Name,"Flotte 1"],[seats.p2,p2Name,"Flotte 2"]
  ].filter(([id])=>id).map(([id,name,role])=>`
    <div class="score-row ${id===seats[bs.winner]?"gold":""}">
      ${scoreNameHtml(id,players[id]||{name},"🚢",`<span class="score-role">${escHtml(role)}</span>`)}
      <div class="score-pts">${safeNum(players[id]?.score)} Siege</div>
    </div>`).join("");
  const p1Board=bs.boards?.[seats.p1]||{ships:[],shotsReceived:{}};
  const p2Board=bs.boards?.[seats.p2]||{ships:[],shotsReceived:{}};
  document.getElementById("results-container").innerHTML=`
    <div class="battleship-game">
      ${battleshipBoardHtml({boardData:p1Board,revealShips:true,title:`Flotte 1 · ${p1Name}`,enemy:false})}
      ${battleshipBoardHtml({boardData:p2Board,revealShips:true,title:`Flotte 2 · ${p2Name}`,enemy:false})}
    </div>`;
  document.getElementById("results-actions").innerHTML=isHost
    ?`<button type="button" class="btn" onclick="window.resetBattleshipGame()">Nochmal spielen →</button>`
    :`<button type="button" class="btn btn-outline" disabled>Warte auf den Host…</button>`;
}
function renderSlfResults(){
  if(!gameState)return;
  setResultsMode("");
  setResultLabels("Punkte gesamt","Antworten dieser Runde");
  const cats=objToCats(gameState.cats);
  const rejections=gameState.rejections||{};
  const roundLimit=gameState.roundLimit||0;
  const isGameOver=roundLimit>0&&gameState.round>=roundLimit;
  const players=gameState.players||{};
  const pids=Object.keys(players);
  const validationMode=gameState.validationMode||"host";
  const roundPts=calcRoundPoints(gameState);
  resultActionMap={};

  document.getElementById("results-sub").textContent=`Runde ${gameState.round}${roundLimit>0?" / "+roundLimit:""} · Buchstabe ${gameState.letter}`;

  const goArea=document.getElementById("gameover-area");
  if(isGameOver&&goArea){
    const sorted=Object.entries(players).sort((a,b)=>safeNum(b[1].score)-safeNum(a[1].score));
    const winner=sorted[0]?.[1]?.name||"?";
    goArea.innerHTML=`<div class="gameover-banner">
      <div class="gameover-title">🏆 ${escHtml(winner)} gewinnt!</div>
      <div class="gameover-winner">${safeNum(sorted[0]?.[1]?.score)} Punkte</div>
    </div>`;
  }else if(goArea){ goArea.innerHTML=""; }

  const banner=document.getElementById("validation-banner-area");
  if(banner){
    const stopName=gameState.buzzer||currentStopRequest(gameState)?.name;
    banner.innerHTML=stopName
      ?`<div class="round-ended-note">🔔 ${escHtml(stopName)} hat STOPP gedrückt</div>`
      :"";
  }

  const sorted=Object.entries(players).sort((a,b)=>safeNum(b[1].score)-safeNum(a[1].score));
  document.getElementById("scoreboard").innerHTML=sorted.map(([id,p],i)=>`
    <div class="score-row ${i===0?"gold":""}">
      ${scoreNameHtml(id,p,["①","②","③"][i]||"")}
      <div class="score-pts">${safeNum(p.score)} Punkte</div>
    </div>`).join("");

  // Kategorie-Karten: Buchstabe vor Kategorienamen entfernt
  document.getElementById("results-container").innerHTML=cats.map(cat=>{
    const rows=pids.map(pid=>{
      const ans=gameState.roundAnswers?.[pid]||{};
      const word=(ans[cat]||"").trim();
      const wrongLetter=word&&!word.toLowerCase().startsWith(gameState.letter.toLowerCase());
      const isRejected=rejections[`${pid}__${cat}`];
      const pts=roundPts[pid]?.[cat]||0;

      let wordHtml;
      if(!word){
        wordHtml=`<span class="cat-player-word empty">—</span>`;
      }else if(wrongLetter){
        wordHtml=`<span class="cat-player-word" style="text-decoration:line-through;opacity:0.45;color:var(--pencil)">${escHtml(word)}</span>`;
      }else if(isRejected){
        wordHtml=`<span class="cat-player-word" style="text-decoration:line-through;color:var(--red);opacity:0.55">${escHtml(word)}</span>`;
      }else{
        wordHtml=`<span class="cat-player-word">${escHtml(word)}</span>`;
      }

      const ptsHtml=`<span class="cat-player-pts ${pts===0?"zero":""}">${pts>0?"+"+pts+"P":pts===0&&word?"0P":""}</span>`;
      const rejClass=isRejected?"rejected":"";
      const ownClass=pid===myId?"mine":"";
      let clickable="", clickAttr="", voteHtml="";
      const key=`${pid}__${cat}`;

      if(validationMode==="host"){
        clickable=isHost&&word&&!wrongLetter?"host-clickable":"";
        if(clickable){
          const actionKey=`a_${Object.keys(resultActionMap).length}`;
          resultActionMap[actionKey]={pid,cat};
          clickAttr=` onclick="window.toggleAnswerStrikeByKey('${actionKey}')"`;
        }
      }else if(validationMode==="vote"&&word&&!wrongLetter){
        const threshold=voteThreshold(gameState,pid);
        const rejectCount=voteRejectCount(gameState,key,pid);
        const myVote=!!gameState.validationVotes?.[key]?.[myId];
        if(pid===myId){
          voteHtml="";
        }else if(Number.isFinite(threshold)){
          const actionKey=`a_${Object.keys(resultActionMap).length}`;
          resultActionMap[actionKey]={pid,cat};
          voteHtml=`<button type="button" class="vote-btn ${myVote?"active":""} ${isRejected?"passed":""}"
            title="Antwort anzweifeln (${rejectCount}/${threshold})"
            aria-label="Antwort anzweifeln (${rejectCount}/${threshold})"
            onclick="window.toggleVoteByKey('${actionKey}')">👎</button>`;
        }
      }

      return`<div class="cat-player-row ${clickable} ${rejClass} ${ownClass}"${clickAttr}>
        <span class="cat-player-name">${escHtml(players[pid]?.name||"?")}</span>
        ${wordHtml}
        ${voteHtml}
        ${ptsHtml}
      </div>`;
    }).join("");

    return`<div class="cat-result-card">
      <div class="cat-result-header">
        <span class="cat-result-header-name">${escHtml(cat)}</span>
      </div>
      ${rows}
    </div>`;
  }).join("");

  if(isGameOver){
    document.getElementById("results-actions").innerHTML=isHost
      ?`<button type="button" class="btn" onclick="window.newGame()">Nochmal spielen →</button>`
      :`<button type="button" class="btn btn-outline" disabled>Warte auf Spielleiter…</button>`;
  }else{
    document.getElementById("results-actions").innerHTML=isHost
      ?`<button type="button" class="btn" onclick="window.nextRound()">Nächste Runde →</button>`
      :`<button type="button" class="btn btn-outline" disabled>Warte auf Spielleiter…</button>`;
  }
}

window.resetMauMauGame=async function(){
  if(!isHost||!gameState||gameState.gameType!=="maumau")return;
  setConnStatus("sync");
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="maumau")return;
      const order=Object.keys(cur.players||{});
      if(order.length<MAUMAU_MIN_PLAYERS||order.length>MAUMAU_MAX_PLAYERS)return;
      cur.maumau=mauMauRoundState(order,cur.maumau?.round||0);
      cur.phase="playing";
      return cur;
    });
    setConnStatus("ok");
  }catch(e){setConnStatus("err");}
};
window.resetKniffelGame=async function(){
  if(!isHost||!gameState||gameState.gameType!=="kniffel")return;
  setConnStatus("sync");
  try{
    await runTransaction(roomRef(),cur=>{
      if(!cur||cur.gameType!=="kniffel")return;
      const order=Object.keys(cur.players||{});
      if(order.length===0||order.length>KNIFFEL_MAX_PLAYERS)return;
      cur.kniffel={
        ...initialKniffelState(order),
        phase:"playing",
        turn:order[0],
        round:(cur.kniffel?.round||0)+1
      };
      cur.phase="playing";
      return cur;
    });
    setConnStatus("ok");
  }catch(e){ setConnStatus("err"); }
};
window.kniffelBackToLobby=async function(){
  if(!isHost||!gameState||gameState.gameType!=="kniffel")return;
  await updateRoomData({
    phase:"lobby",
    kniffel:kniffelLobbyStateForPlayers(gameState.players||{})
  });
};

window.resetBattleshipGame=async function(){
  if(!isHost||!gameState||gameState.gameType!=="battleship")return;
  const bs=gameState.battleship||initialBattleshipState();
  await updateRoomData({
    phase:"playing",
    battleship:{
      ...bs,
      phase:"placing",
      boards:{},
      ready:{},
      turn:"p1",
      winner:null,
      lastShot:null,
      round:(bs.round||0)+1,
      ships:BATTLESHIP_SHIPS
    }
  });
};
window.battleshipBackToLobby=async function(){
  if(!isHost||!gameState||gameState.gameType!=="battleship")return;
  const bs=gameState.battleship||initialBattleshipState();
  await updateRoomData({
    phase:"lobby",
    battleship:{
      ...bs,
      phase:"lobby",
      boards:{},
      ready:{},
      turn:"p1",
      winner:null,
      lastShot:null,
      ships:BATTLESHIP_SHIPS
    }
  });
};
window.resetConnect4Game=async function(){
  if(!isHost||!gameState||gameState.gameType!=="connect4")return;
  const c4=gameState.connect4||initialConnect4State();
  const starter=connect4StarterForNextRound(c4);
  await updateRoomData({
    phase:"playing",
    connect4:{
      ...c4,
      board:emptyConnect4Board(),
      turn:starter,
      winner:null,
      winCells:[],
      lastMove:null,
      moveCount:0,
      round:(c4.round||0)+1,
      nextStarter:null
    }
  });
};
window.connect4BackToLobby=async function(){
  if(!isHost||!gameState||gameState.gameType!=="connect4")return;
  const c4=gameState.connect4||initialConnect4State();
  const starter=connect4StarterForNextRound(c4);
  await updateRoomData({
    phase:"lobby",
    connect4:{
      ...c4,
      board:emptyConnect4Board(),
      turn:starter,
      winner:null,
      winCells:[],
      lastMove:null,
      moveCount:0,
      nextStarter:starter
    }
  });
};
window.backToLobby=function(){
  resetRoundData();
  showScreen("lobby");
  renderLobby();
};
window.nextRound=async function(){
  if(!isHost)return;
  const preRoundScores={};
  Object.entries(gameState.players||{}).forEach(([id,p])=>{preRoundScores[id]=safeNum(p.score);});
  resetRoundData();
  await updateRoomData({
    phase:"lobby",
    letterRevealStartTs:null,letterRevealUntil:null,
    buzzer:null,buzzerTs:null,collectUntil:null,stopRequest:null,
    roundAnswers:{},liveAnswers:{},finalAnswers:{},rejections:{},validationVotes:{},submittedStatus:{},
    roundStartTs:null,
    preRoundScores,
    typingStatus:{}
  });
};
window.newGame=async function(){
  if(!isHost)return;
  const playerReset={};
  Object.keys(gameState.players||{}).forEach(id=>{
    playerReset[`players/${id}/score`]=0;
  });
  resetRoundData();
  await updateRoomData({
    ...playerReset,
    phase:"lobby",
    round:0,
    letterRevealStartTs:null,letterRevealUntil:null,
    buzzer:null,buzzerTs:null,collectUntil:null,stopRequest:null,
    roundAnswers:{},liveAnswers:{},finalAnswers:{},rejections:{},validationVotes:{},submittedStatus:{},
    roundStartTs:null,
    usedLetters:[],
    preRoundScores:null,
    typingStatus:{}
  });
};

// ─── LETTER SHUFFLE ANIMATION ────────────────────────────────────
function animateLetterShuffle(finalLetter){
  const el=document.getElementById("big-letter");
  if(!el)return;
  const allLetters="ABCDEFGHIKLMNOPRSTW".split("");
  let count=0;
  const total=18;
  const interval=setInterval(()=>{
    count++;
    const random=allLetters[Math.floor(Math.random()*allLetters.length)];
    el.textContent=count<total?random:finalLetter;
    el.classList.remove("shuffling");
    void el.offsetWidth;
    el.classList.add("shuffling");
    if(count>=total) clearInterval(interval);
  }, count<10?50:80);
}

// ─── HOST MIGRATION ───────────────────────────────────────────────
async function checkAndMigrateHost(){
  if(!myRoom)return;
  const cur=(await get(roomRef())).val();
  if(!cur)return;
  const hostId=cur.host;
  const hostPlayer=cur.players?.[hostId];
  const hostOnline=hostPlayer&&(Date.now()-(hostPlayer.hb||0)<PLAYER_STALE_MS);
  if(!hostOnline){
    const activePlayers=Object.entries(cur.players||{})
      .filter(([id,p])=>Date.now()-(p.hb||0)<PLAYER_STALE_MS)
      .sort((a,b)=>a[0].localeCompare(b[0]));
    if(activePlayers.length>0){
      const newHostId=activePlayers[0][0];
      if(newHostId===myId){
        await updateRoomData({host:myId,hostName:myName});
        isHost=true;
      }
    }
  }
}

// ─── TYPING STATUS ────────────────────────────────────────────────
document.addEventListener("keydown",e=>{
  if(e.key==="Enter"&&e.target.matches(".answer-row input")){
    e.preventDefault();
    const cats=objToCats(gameState?.cats||{});
    const ids=cats.map((_,i)=>`ans-${i}`);
    const idx=ids.indexOf(e.target.id);
    if(idx>=0&&idx<ids.length-1){
      const next=document.getElementById(ids[idx+1]);
      if(next)next.focus();
    }
  }
});
document.addEventListener("input",e=>{
  if(e.target.matches(".answer-row input")&&gameState?.cats){
    const cats=objToCats(gameState.cats);
    const idx=Number(e.target.id.replace("ans-",""));
    const cat=Number.isInteger(idx)?cats[idx]:null;
    if(cat){
      localAnswers[cat]=e.target.value;
      sessionStorage.setItem("slf_local_answers",JSON.stringify(localAnswers));
      const val=e.target.value.trim();
      if(val.length===0){
        e.target.classList.remove("typing-ok","typing-bad");
      }else if(normalizeAnswer(val).startsWith(normalizeAnswer(gameState.letter))){
        e.target.classList.add("typing-ok");
        e.target.classList.remove("typing-bad");
      }else{
        e.target.classList.add("typing-bad");
        e.target.classList.remove("typing-ok");
      }
    }
    if(typingTimeout)clearTimeout(typingTimeout);
    if(myRoom&&myId&&gameState?.phase==="playing"){
      queueLiveSave();
      update(ref(db,`rooms/${myRoom}/typingStatus`),{[myId]:Date.now()}).catch(()=>{});
      typingTimeout=setTimeout(()=>{
        update(ref(db,`rooms/${myRoom}/typingStatus`),{[myId]:null}).catch(()=>{});
      },3000);
    }
  }
});
document.getElementById("input-room").addEventListener("input",e=>{
  e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"");
});

// ─── HELPERS ──────────────────────────────────────────────────────
function normalizeAnswer(s){
  return String(s||"")
    .trim()
    .toLowerCase()
    .replace(/ä/g,"ae")
    .replace(/ö/g,"oe")
    .replace(/ü/g,"ue")
    .replace(/ß/g,"ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]/g,"");
}
function safeNum(n){
  const v=Number(n);
  return Number.isFinite(v)?v:0;
}
function escHtml(s){
  return String(s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}
