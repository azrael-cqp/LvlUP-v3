const { useState, useEffect, useRef } = React;

// ─── INDEXEDDB STORAGE ───
const DB_NAME = "SoloLevelingDB";
const STORE = "gamedata";
const DATA_KEY = "save";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function saveToIDB(data) {
  try { const db = await openDB(); return new Promise((res, rej) => { const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).put(data, DATA_KEY); tx.oncomplete = () => res(true); tx.onerror = () => rej(tx.error); }); }
  catch(e) { console.error("Save failed", e); return false; }
}
async function loadFromIDB() {
  try { const db = await openDB(); return new Promise((res, rej) => { const tx = db.transaction(STORE, "readonly"); const req = tx.objectStore(STORE).get(DATA_KEY); req.onsuccess = () => res(req.result || null); req.onerror = () => rej(req.error); }); }
  catch(e) { return null; }
}

const SAVE_FIELDS = ["level","xp","stats","done","doneEx","doneW","doneLessons","totalXp","qC","streak","wLog","weightLog","muscleXp","lastDailyReset","lastWeeklyReset","penaltyLog","dailyLessonDone","liftLog","vacation","activeBoss","bossHistory","sleepLog","workoutCalendar","exerciseSwaps","soundOn"];
const DEFAULT_STATE = {level:1,xp:0,stats:{STR:5,VIT:3,AGI:3,INT:2,PER:2},done:[],doneEx:[],doneW:[],doneLessons:[],totalXp:0,qC:0,streak:0,wLog:[],weightLog:[
  {date:"Start",weight:125,fat:null,muscle:null},
  {date:"16/04/2026",weight:114.8,fat:30.9,muscle:74.0},
  {date:"30/04/2026",weight:111.7,fat:29.4,muscle:73.6},
  {date:"11/05/2026",weight:111.05,fat:29.2,muscle:73.2},
  {date:"21/05/2026",weight:110.35,fat:27.4,muscle:74.7},
  {date:"28/05/2026",weight:108.60,fat:27.3,muscle:73.6}
],muscleXp:{chest:0,back:0,shoulders:0,biceps:0,triceps:0,quads:0,hamstrings:0,glutes:0,calves:0,core:0,cardio:0},lastDailyReset:null,lastWeeklyReset:null,penaltyLog:[],dailyLessonDone:false,liftLog:{},vacation:false,activeBoss:null,bossHistory:[],sleepLog:[],workoutCalendar:{},exerciseSwaps:{},soundOn:true};

// ─── CONSTANTS ───
const RANKS = [
  { name: "E-Rank", min: 1, max: 5, color: "#6b7280" },
  { name: "D-Rank", min: 6, max: 15, color: "#22d3ee" },
  { name: "C-Rank", min: 16, max: 30, color: "#34d399" },
  { name: "B-Rank", min: 31, max: 50, color: "#a78bfa" },
  { name: "A-Rank", min: 51, max: 75, color: "#f59e0b" },
  { name: "S-Rank", min: 76, max: 100, color: "#ef4444" },
  { name: "National", min: 101, max: 999, color: "#ec4899" },
];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const PPL = {
  1:{day:"Monday",type:"PUSH",color:"#ef4444",icon:"🔴",exercises:[
    {name:"Bench Press",sets:"4×8-10",muscle:"Chest",rest:180,desc:"Lie flat on bench, grip bar slightly wider than shoulders. Lower to chest, press up explosively. Keep shoulder blades squeezed."},
    {name:"Overhead Press",sets:"4×8-10",muscle:"Shoulders",rest:150,desc:"Stand with bar at shoulder height. Press straight overhead, locking elbows at top. Brace core throughout."},
    {name:"Incline DB Press",sets:"3×10-12",muscle:"Upper Chest",rest:120,desc:"Set bench to 30-45°. Press dumbbells up from chest level, squeezing at top. Control the negative."},
    {name:"Lateral Raises",sets:"4×12-15",muscle:"Side Delts",rest:75,desc:"Stand with dumbbells at sides. Raise arms out to sides until parallel with floor. Slight bend in elbows, control the weight."},
    {name:"Tricep Pushdowns",sets:"3×12-15",muscle:"Triceps",rest:75,desc:"Cable machine, rope or bar attachment. Push down until arms are straight, squeeze triceps. Keep elbows pinned to sides."},
    {name:"Overhead Tricep Ext.",sets:"3×12-15",muscle:"Triceps",rest:75,desc:"Hold dumbbell or rope overhead. Lower behind head by bending elbows, then extend back up. Feel the stretch at bottom."},
  ]},
  2:{day:"Tuesday",type:"PULL",color:"#3b82f6",icon:"🔵",exercises:[
    {name:"Pull-ups / Lat Pulldown",sets:"4×8-10",muscle:"Lats",rest:120,desc:"Grip bar wider than shoulders. Pull yourself up (or pull bar down) until chin clears bar. Squeeze lats at top, slow negative."},
    {name:"Barbell Rows",sets:"4×8-10",muscle:"Upper Back",rest:120,desc:"Hinge at hips ~45°, grip bar shoulder-width. Pull bar to lower chest, squeezing shoulder blades together. Keep back flat."},
    {name:"Seated Cable Row",sets:"3×10-12",muscle:"Mid Back",rest:90,desc:"Sit upright, pull handle to lower chest. Squeeze shoulder blades, then control the release. Don't lean back excessively."},
    {name:"Face Pulls",sets:"3×15-20",muscle:"Rear Delts",rest:45,desc:"Cable at face height with rope. Pull towards face, separating rope ends. Rotate externally at end. Great for shoulder health."},
    {name:"Barbell Curls",sets:"3×10-12",muscle:"Biceps",rest:75,desc:"Stand with bar, underhand grip. Curl bar up keeping elbows stationary. Squeeze at top, lower slowly. No swinging."},
    {name:"Hammer Curls",sets:"3×10-12",muscle:"Biceps",rest:60,desc:"Hold dumbbells with neutral grip (palms facing in). Curl up, squeeze. Works brachialis and forearms too."},
  ]},
  3:{day:"Wednesday",type:"LEGS",color:"#22c55e",icon:"🟢",exercises:[
    {name:"Squats",sets:"4×6-8",muscle:"Quads/Glutes",rest:180,desc:"Bar on upper back, feet shoulder-width. Sit back and down until thighs are parallel or below. Drive through heels, chest up."},
    {name:"Romanian Deadlift",sets:"4×8-10",muscle:"Hamstrings",rest:150,desc:"Hold bar at hips, slight knee bend. Hinge forward keeping back flat until stretch in hamstrings. Squeeze glutes to return."},
    {name:"Leg Press",sets:"3×10-12",muscle:"Quads",rest:120,desc:"Feet shoulder-width on platform. Lower weight until knees at ~90°. Press through full foot. Don't lock knees completely."},
    {name:"Walking Lunges",sets:"3×12 ea.",muscle:"Quads/Glutes",rest:90,desc:"Step forward into lunge, back knee nearly touching floor. Push through front heel to next step. Keep torso upright."},
    {name:"Leg Curls",sets:"3×12-15",muscle:"Hamstrings",rest:90,desc:"Lying or seated machine. Curl weight by bending knees, squeeze hamstrings at peak contraction. Slow negative."},
    {name:"Calf Raises",sets:"4×15-20",muscle:"Calves",rest:60,desc:"Stand on edge of step, heels hanging off. Rise up on toes as high as possible, hold 1 sec, lower below step level for full stretch."},
  ]},
  4:{day:"Thursday",type:"PUSH",color:"#ef4444",icon:"🔴",exercises:[
    {name:"DB Bench Press",sets:"4×10-12",muscle:"Chest",rest:120,desc:"Dumbbells allow greater range of motion than barbell. Lower deeper, press up and slightly inward. Great for chest activation."},
    {name:"Arnold Press",sets:"4×10-12",muscle:"Shoulders",rest:120,desc:"Start with palms facing you at shoulder height. Rotate palms outward as you press up. Reverse on the way down. Full shoulder activation."},
    {name:"Cable Flyes",sets:"3×12-15",muscle:"Chest",rest:90,desc:"Cables at shoulder height. Bring handles together in front of chest in hugging motion. Squeeze chest hard at center."},
    {name:"Front Raises",sets:"3×12-15",muscle:"Front Delts",rest:75,desc:"Hold dumbbells in front of thighs. Raise one or both arms to eye level, palms down. Control the movement, no swinging."},
    {name:"Close-Grip Bench Press",sets:"3×8-10",muscle:"Triceps/Chest",rest:150,desc:"Bench press with hands shoulder-width apart. Lower bar to lower chest, elbows close to body. Excellent compound for triceps mass and lockout strength."},
    {name:"Skull Crushers",sets:"3×10-12",muscle:"Triceps",rest:90,desc:"Lie on bench, hold bar/dumbbells above face. Bend only at elbows, lowering weight towards forehead. Extend back up. Keep elbows still."},
  ]},
  5:{day:"Friday",type:"PULL",color:"#3b82f6",icon:"🔵",exercises:[
    {name:"Barbell Rows",sets:"4×8-10",muscle:"Back",rest:120,desc:"Second pull day variation: try underhand grip or Pendlay rows (from floor each rep) for different angle and stimulus."},
    {name:"Single Arm DB Row",sets:"3×10-12",muscle:"Lats",rest:75,desc:"One knee on bench, row dumbbell to hip. Squeeze lat at top. Great for fixing imbalances between sides."},
    {name:"Cable Pullover",sets:"3×12-15",muscle:"Lats",rest:60,desc:"Stand facing cable machine, straight bar high. Pull bar down in arc motion to thighs, keeping arms nearly straight. Feel the lat stretch."},
    {name:"Reverse Flyes",sets:"3×15",muscle:"Rear Delts",rest:45,desc:"Bent over or on incline bench. Raise dumbbells out to sides, squeezing rear delts. Light weight, high control."},
    {name:"Incline Curls",sets:"3×10-12",muscle:"Biceps",rest:60,desc:"Sit on incline bench (~45°). Arms hang straight down. Curl up — the incline pre-stretches the bicep for greater activation."},
    {name:"Concentration Curls",sets:"3×12",muscle:"Biceps",rest:60,desc:"Sit, elbow braced against inner thigh. Curl dumbbell with full focus on the squeeze. Best isolation exercise for bicep peak."},
  ]},
  6:{day:"Saturday",type:"REST",color:"#475569",icon:"⚫",exercises:[]},
  0:{day:"Sunday",type:"REST",color:"#475569",icon:"⚫",exercises:[]},
};

const DAILY_Q = [
  {id:"sleep_log",label:"Log Sleep (hours + rating)",stat:"VIT",xp:5,icon:"😴"},
  {id:"treadmill",label:"30 Min Cardio (Zone 2)",stat:"VIT",xp:30,icon:"🏃"},
  {id:"protein_shake1",label:"Shake Whey #1 (2 scoops · 45g)",stat:"VIT",xp:5,icon:"🥤",subgroup:"protein"},
  {id:"protein_shake2",label:"Shake Whey #2 (2 scoops · 45g)",stat:"VIT",xp:5,icon:"🥤",subgroup:"protein"},
  {id:"protein_jerky",label:"Beef Jerky (50g · 22g protein)",stat:"VIT",xp:5,icon:"🥩",subgroup:"protein"},
  {id:"protein_bar",label:"Baton ASAP (50g · 25g protein)",stat:"VIT",xp:5,icon:"🍫",subgroup:"protein"},
  {id:"protein_meat",label:"Carne 280-310g gatit (~83g protein)",stat:"VIT",xp:5,icon:"🍗",subgroup:"protein"},
];

// Learning rotation: Mon=📖, Tue=🤖, Wed=rest, Thu=📖, Fri=🤖 (NO language)
const LEARNING_ROTATION = {
  1:{id:"ai_learn",label:"Claude / AI Learning (30 min)",stat:"INT",xp:40,icon:"🤖",desc:"Today's learning focus: AI & Claude"},
  2:{id:"ai_learn",label:"Claude / AI Learning (30 min)",stat:"INT",xp:40,icon:"🤖",desc:"Today's learning focus: AI & Claude"},
  4:{id:"ai_learn",label:"Claude / AI Learning (30 min)",stat:"INT",xp:40,icon:"🤖",desc:"Today's learning focus: AI & Claude"},
  5:{id:"ai_learn",label:"Claude / AI Learning (30 min)",stat:"INT",xp:40,icon:"🤖",desc:"Today's learning focus: AI & Claude"},
};

// Get today's learning quest
function getTodayLearning(){
  const dow = new Date().getDay();
  return LEARNING_ROTATION[dow] || null; // null on weekends
}

const LIFE_Q_FIXED = [
  {id:"podcast",label:"Listen to Podcast (1 ep)",stat:"PER",xp:20,icon:"🎧",desc:"See today's recommendation below"},
  {id:"meditate",label:"Meditate 15 min",stat:"PER",xp:20,icon:"🧠",desc:"Mindfulness & focus"},
  {id:"mobility",label:"Mobility Work (10 min)",stat:"AGI",xp:20,icon:"🤸",desc:"See FLEX tab for routine"},
];

const BONUS_Q = [
  {id:"farmercarry",label:"Farmer Carries 3x40m",stat:"STR",xp:35,icon:"💼",days:[2,5]},
  {id:"weightedplank",label:"Weighted Plank 3x60s",stat:"VIT",xp:30,icon:"🪨",days:[1,4]},
  {id:"calfblitz",label:"Calf Raises 100+ reps",stat:"STR",xp:25,icon:"🦶",days:[5]},
  {id:"extrardl",label:"Extra RDL Set 2x10",stat:"STR",xp:30,icon:"🦿",days:[6]},
  {id:"pushups",label:"100 Push-ups",stat:"STR",xp:30,icon:"💪",days:[2]},
  {id:"squats",label:"100 Squats (light)",stat:"STR",xp:30,icon:"🦵",days:[4]},
  {id:"situps",label:"100 Sit-ups",stat:"VIT",xp:25,icon:"🔥",days:[0,6]},
];

// Daily podcast rotation — cycles through categories
const PODCAST_SCHEDULE = [
  {day:0,cat:"💰 Business",pick:"My First Million",desc:"Sam Parr & Shaan Puri brainstorm million-dollar ideas",url:"https://www.youtube.com/@MyFirstMillionPod",alt:[
    {name:"Alex Hormozi",url:"https://www.youtube.com/@AlexHormozi"},
    {name:"Diary of a CEO",url:"https://www.youtube.com/@TheDiaryOfACEO"},
  ]},
  {day:1,cat:"📈 Investing",pick:"We Study Billionaires",desc:"World's largest stock investing podcast — how billionaires invest",url:"https://www.youtube.com/@TheInvestorsPodcastNetwork",alt:[
    {name:"All-In Podcast",url:"https://www.youtube.com/@alaboratory"},
    {name:"Motley Fool Money",url:"https://www.youtube.com/@MotleyFoolMoney"},
  ]},
  {day:2,cat:"🤖 AI & Tech",pick:"Matt Wolfe",desc:"Weekly AI tool roundups and practical trends",url:"https://www.youtube.com/@MattWolfe",alt:[
    {name:"Wes Roth",url:"https://www.youtube.com/@WesRoth"},
    {name:"Sabrina Ramonov",url:"https://www.youtube.com/@SabrinaRamonov"},
  ]},
  {day:3,cat:"🧠 Self-Improvement",pick:"Chris Williamson",desc:"Modern Wisdom — psychology, performance, becoming better",url:"https://www.youtube.com/@ChrisWillx",alt:[
    {name:"Andrew Huberman",url:"https://www.youtube.com/@hubaboratory"},
    {name:"Iman Gadzhi",url:"https://www.youtube.com/@ImanGadzhi"},
  ]},
  {day:4,cat:"🏋️ Training",pick:"Jeff Nippard",desc:"Science-based muscle building, PPL programs, form guides",url:"https://www.youtube.com/@JeffNippard",alt:[
    {name:"Dr. Mike (RP)",url:"https://www.youtube.com/@RenaissancePeriodization"},
    {name:"Greg Doucette",url:"https://www.youtube.com/@GregDoucette"},
  ]},
  {day:5,cat:"📊 Sales & Growth",pick:"Alex Hormozi",desc:"Sales tactics, scaling businesses, making more money",url:"https://www.youtube.com/@AlexHormozi",alt:[
    {name:"Valuetainment",url:"https://www.youtube.com/@valuetainment"},
    {name:"Jordan Belfort",url:"https://www.youtube.com/@JordanBelfort"},
  ]},
  {day:6,cat:"💡 Trends & Money",pick:"Diary of a CEO",desc:"Deep interviews with top performers on business & life",url:"https://www.youtube.com/@TheDiaryOfACEO",alt:[
    {name:"My First Million",url:"https://www.youtube.com/@MyFirstMillionPod"},
    {name:"All-In Podcast",url:"https://www.youtube.com/@alaboratory"},
  ]},
];

const WEEKLY_OBJ = [
  {id:"nature",label:"Outdoor Walk / Nature",icon:"🌿",xp:20,stat:"PER"},
  {id:"yogasession",label:"Yoga / Stretch Session (30 min)",icon:"🧘",xp:35,stat:"AGI"},
];

const MUSCLE_RANKS = [
  {name:"Bronze",min:0,color:"#92400e",bg:"#78350f"},
  {name:"Silver",min:10,color:"#94a3b8",bg:"#475569"},
  {name:"Gold",min:25,color:"#f59e0b",bg:"#92400e"},
  {name:"Platinum",min:50,color:"#22d3ee",bg:"#155e75"},
  {name:"Diamond",min:80,color:"#a78bfa",bg:"#5b21b6"},
  {name:"Master",min:120,color:"#f472b6",bg:"#831843"},
  {name:"Mythic",min:175,color:"#ef4444",bg:"#7f1d1d"},
  {name:"Legend",min:250,color:"#fbbf24",bg:"#451a03"},
];

const MUSCLE_GROUPS = [
  {key:"chest",name:"Chest",icon:"🫁",exercises:["Bench Press","DB Bench Press","Incline DB Press","Cable Flyes","Close-Grip Bench Press"]},
  {key:"back",name:"Back",icon:"🔙",exercises:["Pull-ups / Lat Pulldown","Barbell Rows","Seated Cable Row","Single Arm DB Row","Cable Pullover"]},
  {key:"shoulders",name:"Shoulders",icon:"🔺",exercises:["Overhead Press","Arnold Press","Lateral Raises","Front Raises","Face Pulls","Reverse Flyes"]},
  {key:"biceps",name:"Biceps",icon:"💪",exercises:["Barbell Curls","Hammer Curls","Incline Curls","Concentration Curls"]},
  {key:"triceps",name:"Triceps",icon:"🔱",exercises:["Tricep Pushdowns","Overhead Tricep Ext.","Skull Crushers","Close-Grip Bench Press"]},
  {key:"quads",name:"Quads",icon:"🦵",exercises:["Squats","Leg Press","Walking Lunges"]},
  {key:"hamstrings",name:"Hamstrings",icon:"🦿",exercises:["Romanian Deadlift","Leg Curls"]},
  {key:"glutes",name:"Glutes",icon:"🍑",exercises:["Squats","Walking Lunges","Romanian Deadlift"]},
  {key:"calves",name:"Calves",icon:"🦶",exercises:["Calf Raises"]},
  {key:"core",name:"Core",icon:"🔥",exercises:[]},
  {key:"cardio",name:"Cardio",icon:"🫀",exercises:[]},
];

// ─── EXERCISE ALTERNATIVES (swap when equipment busy) ───
const EXERCISE_ALTERNATIVES = {
  "Bench Press":[{name:"DB Bench Press",reason:"Same chest activation, more stabilization"},{name:"Push-ups Weighted",reason:"No equipment needed"},{name:"Smith Machine Press",reason:"Stabilized version"}],
  "Close-Grip Bench Press":[{name:"Skull Crushers",reason:"Direct triceps focus"},{name:"Tricep Pushdowns",reason:"Cable variation"},{name:"Diamond Push-ups",reason:"Bodyweight option"}],
  "DB Bench Press":[{name:"Bench Press (barbell)",reason:"Heavier loading"},{name:"Push-ups",reason:"Bodyweight"},{name:"Cable Chest Press",reason:"Constant tension"}],
  "Incline DB Press":[{name:"Incline Smith Press",reason:"If DBs too heavy"},{name:"Incline Push-ups",reason:"Bodyweight option"}],
  "Overhead Press":[{name:"DB Shoulder Press",reason:"Less lower back stress"},{name:"Arnold Press",reason:"Variation"}],
  "Arnold Press":[{name:"DB Shoulder Press",reason:"Standard"},{name:"Lateral Raises",reason:"Isolation focus"}],
  "Cable Flyes":[{name:"DB Flyes",reason:"On bench"},{name:"Push-ups deficit",reason:"Stretch focus"}],
  "Front Raises":[{name:"Cable Front Raise",reason:"Constant tension"},{name:"Plate Front Raise",reason:"Different feel"}],
  "Lateral Raises":[{name:"Cable Lateral",reason:"Constant tension"},{name:"Machine Lateral Raise",reason:"Strict form"}],
  "Tricep Pushdowns":[{name:"Skull Crushers",reason:"More stretch"},{name:"Diamond Push-ups",reason:"Bodyweight"},{name:"Overhead Tricep Ext.",reason:"Long head focus"}],
  "Overhead Tricep Ext.":[{name:"Tricep Pushdowns",reason:"Cables"},{name:"Skull Crushers",reason:"Compound"}],
  "Skull Crushers":[{name:"Tricep Pushdowns",reason:"Less elbow stress"},{name:"Overhead Tricep Ext.",reason:"Long head focus"}],
  "Pull-ups / Lat Pulldown":[{name:"Assisted Pull-ups",reason:"If too heavy"},{name:"Inverted Rows",reason:"Bodyweight horizontal"},{name:"Cable Pulldown",reason:"Different angle"}],
  "Barbell Rows":[{name:"DB Rows",reason:"Single arm focus"},{name:"T-Bar Rows",reason:"Different machine"},{name:"Seated Cable Row",reason:"Less back stress"}],
  "Seated Cable Row":[{name:"Barbell Rows",reason:"Compound version"},{name:"DB Rows",reason:"Unilateral"}],
  "Single Arm DB Row":[{name:"Cable Single Row",reason:"Constant tension"},{name:"Barbell Rows",reason:"Bilateral"}],
  "Cable Pullover":[{name:"DB Pullover",reason:"On bench"},{name:"Lat Pulldown",reason:"Compound"}],
  "Face Pulls":[{name:"Reverse Flyes",reason:"DB version"},{name:"Band Pull-Aparts",reason:"With band"}],
  "Reverse Flyes":[{name:"Face Pulls",reason:"Cable version"},{name:"Cable Reverse Fly",reason:"Constant tension"}],
  "Romanian Deadlift":[{name:"Single-leg RDL",reason:"Unilateral focus"},{name:"DB RDL",reason:"Lighter loading"}],
  "Squats":[{name:"Front Squats",reason:"More quad focus"},{name:"Goblet Squats",reason:"With DB"},{name:"Bulgarian Split Squats",reason:"Unilateral"}],
  "Leg Press":[{name:"Hack Squat",reason:"Different angle"},{name:"Squats",reason:"Free weight"}],
  "Walking Lunges":[{name:"Reverse Lunges",reason:"Less knee stress"},{name:"Bulgarian Split Squats",reason:"Stationary"}],
  "Leg Curls":[{name:"Romanian Deadlift",reason:"Compound version"},{name:"Glute-Ham Raise",reason:"Bodyweight"}],
  "Calf Raises":[{name:"Seated Calf Raises",reason:"Soleus focus"},{name:"Single-leg Calf Raises",reason:"Unilateral"}],
  "Barbell Curls":[{name:"DB Curls",reason:"Each arm independent"},{name:"Cable Curls",reason:"Constant tension"},{name:"EZ Bar Curls",reason:"Less wrist stress"}],
  "Hammer Curls":[{name:"Cable Hammer Curls",reason:"With rope"},{name:"Cross-body Curls",reason:"Different angle"}],
  "Incline Curls":[{name:"DB Curls",reason:"Standard"},{name:"Cable Curls",reason:"Constant tension"}],
  "Concentration Curls":[{name:"Spider Curls",reason:"On bench"},{name:"Cable Curls",reason:"Standing"}],
};

// ─── BOSS FIGHTS LIBRARY (12 bosses, Solo Leveling themed) ───
const BOSS_LIBRARY = [
  {id:"bench_demon",name:"The Bench Plateau Demon",emoji:"👹",theme:"Shadow Monarch's Trial",description:"Defeat the demon guarding the 92.5kg gate.",target:{type:"lift",exercise:"Bench Press",kg:92.5,reps:5},durationDays:14,reward:{xp:200,badge:"Demon Slayer"},lore:"For weeks the demon has whispered 'You cannot pass 90kg'. Today, prove it wrong."},
  {id:"squat_titan",name:"The Iron Titan",emoji:"🗿",theme:"Demon King's Challenge",description:"Conquer the 75kg squat fortress.",target:{type:"lift",exercise:"Squats",kg:75,reps:6},durationDays:21,reward:{xp:250,badge:"Titan Crusher"},lore:"The Iron Titan stands at 75kg. Push past or be crushed."},
  {id:"streak_wraith",name:"The Streak Wraith",emoji:"💀",theme:"Endurance of the Hunter",description:"Maintain 14 consecutive days of activity.",target:{type:"streak",days:14},durationDays:14,reward:{xp:300,badge:"Wraith Hunter"},lore:"Skip a day and the wraith feeds. Stay consistent and banish it."},
  {id:"core_champion",name:"Core Champion's Trial",emoji:"🛡️",theme:"Test of the Core Spirit",description:"Reach 50 Core XP through bonus quests.",target:{type:"muscleXp",muscle:"core",amount:50},durationDays:21,reward:{xp:200,badge:"Core Champion"},lore:"The weakest pillar must become the strongest. Forge your core."},
  {id:"hams_hydra",name:"Hamstring Hydra",emoji:"🐉",theme:"Posterior Chain Awakening",description:"Boost hamstring XP to 120+ with focused work.",target:{type:"muscleXp",muscle:"hamstrings",amount:120},durationDays:28,reward:{xp:250,badge:"Hydra Slayer"},lore:"Three heads of weakness: Hams, Glutes, Lower Back. Cut them all."},
  {id:"calf_kraken",name:"The Calf Kraken",emoji:"🐙",theme:"From the Depths",description:"Reach 50 Calves XP through high-rep work.",target:{type:"muscleXp",muscle:"calves",amount:50},durationDays:21,reward:{xp:180,badge:"Kraken Hunter"},lore:"Tentacles of fatigue. Every rep severs one."},
  {id:"deload_phoenix",name:"The Deload Phoenix",emoji:"🔥",theme:"Rebirth Through Recovery",description:"Complete 7 days at 70% intensity (deload week).",target:{type:"deload",days:7},durationDays:7,reward:{xp:150,badge:"Phoenix Risen"},lore:"Sometimes the strongest move is to step back. Rise renewed."},
  {id:"bench_lord",name:"The 100kg Bench Lord",emoji:"⚔️",theme:"Beyond the Plateau",description:"Smash the 3-digit bench barrier: 100kg × 3 reps.",target:{type:"lift",exercise:"Bench Press",kg:100,reps:3},durationDays:28,reward:{xp:400,badge:"Centurion"},lore:"100kg separates the casual from the committed. Cross the line."},
  {id:"squat_warlord",name:"The Squat Warlord",emoji:"⚒️",theme:"Lord of the Iron",description:"Squat 100kg × 5 reps with full depth.",target:{type:"lift",exercise:"Squats",kg:100,reps:5},durationDays:35,reward:{xp:400,badge:"Warlord"},lore:"Below parallel. No half measures. Earn the crown."},
  {id:"deadlift_dragon",name:"The Deadlift Dragon",emoji:"🐲",theme:"Awaken the Beast",description:"Romanian Deadlift 90kg × 6 reps clean.",target:{type:"lift",exercise:"Romanian Deadlift",kg:90,reps:6},durationDays:28,reward:{xp:350,badge:"Dragon Tamer"},lore:"Hams of steel, back of stone. The dragon stirs."},
  {id:"pullup_phantom",name:"The Pull-up Phantom",emoji:"👻",theme:"Vertical Ascendance",description:"Pull-ups/Lat Pulldown 95kg × 6 reps.",target:{type:"lift",exercise:"Pull-ups / Lat Pulldown",kg:95,reps:6},durationDays:28,reward:{xp:300,badge:"Phantom Slayer"},lore:"Up and over the spectral gate. Lats wide as wings."},
  {id:"row_revenant",name:"The Row Revenant",emoji:"🗡️",theme:"Back of Iron",description:"Barbell Rows 75kg × 8 reps strict form.",target:{type:"lift",exercise:"Barbell Rows",kg:75,reps:8},durationDays:28,reward:{xp:280,badge:"Revenant Crusher"},lore:"The revenant's grip is strong. Yours must be stronger."},
];

// ─── MOBILITY DATA ───
const MOBILITY_DATA = {
  morning:{title:"Morning Activation",duration:"5 min",icon:"☀️",description:"Wake up your joints and prepare your body for the day.",exercises:[
    {name:"Hip Circles",duration:"30 sec each side",emoji:"🦵",description:"Stand tall, hands on hips. Make large circles with your hips, 15 forward then 15 backward."},
    {name:"Cat-Cow Flow",duration:"1 min (10 reps)",emoji:"🐱",description:"On hands and knees. Inhale: arch back, look up (cow). Exhale: round spine, tuck chin (cat)."},
    {name:"Arm Circles",duration:"30 sec",emoji:"💪",description:"Stand with arms extended. Large circles forward 15 reps, then backward 15 reps."},
    {name:"Leg Swings",duration:"1 min (30 sec each leg)",emoji:"🤸",description:"Hold a wall for support. Swing one leg forward and backward 15 times. Switch legs."},
    {name:"Torso Twists",duration:"1 min",emoji:"🔄",description:"Feet shoulder-width apart, hands at chest. Rotate torso left and right slowly. 20 total rotations."},
    {name:"Neck Rolls",duration:"30 sec",emoji:"🦒",description:"Slow circles with the head, 5 clockwise then 5 counter-clockwise."},
  ]},
  evening:{title:"Evening Recovery",duration:"5 min",icon:"🌙",description:"Static stretches to recover and prepare for sleep.",exercises:[
    {name:"Hamstring Stretch",duration:"1 min (30 sec each leg)",emoji:"🦵",description:"Sit on floor, one leg extended, other bent. Reach toward extended foot. ⭐ PRIORITY (Hams weak)."},
    {name:"Pigeon Pose",duration:"1 min (30 sec each leg)",emoji:"🍑",description:"From plank, bring one knee forward, extend other leg behind. Lower hips, lean forward over front leg."},
    {name:"Quad Stretch",duration:"1 min (30 sec each leg)",emoji:"💺",description:"Stand tall, grab one ankle and pull heel toward butt. Keep knees together."},
    {name:"Shoulder Stretch",duration:"1 min",emoji:"🌍",description:"Bring one arm across chest, use other arm to pull it closer. Hold 30 sec each side. ⭐ Important after Push days."},
    {name:"Child's Pose",duration:"1 min",emoji:"🐱",description:"Kneel on floor, sit back on heels, arms forward, forehead to floor. Total relaxation for lower back."},
  ]},
  youtube:[
    {name:"Yoga With Adriene - Daily Mobility",url:"https://www.youtube.com/results?search_query=yoga+with+adriene+10+minute+mobility",description:"Gentle, accessible routines for every day. 10-15 min average."},
    {name:"Tom Merrick - Athlete Mobility",url:"https://www.youtube.com/results?search_query=tom+merrick+daily+stretching",description:"For athletes. Technical and effective."},
    {name:"Athlean-X - Mobility Daily",url:"https://www.youtube.com/results?search_query=athlean+x+daily+mobility",description:"No BS approach. Practical and quick."},
    {name:"GMB - Joint Mobility",url:"https://www.youtube.com/results?search_query=GMB+fitness+joint+mobility",description:"Focus on joint health and pain-free movement."},
  ],
};

// ─── SOUND FX ───
function playSound(type){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    if(type==="setLogged"){
      const o=ctx.createOscillator();const g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      o.frequency.value=800;o.type="sine";
      g.gain.setValueAtTime(0.15,ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.2);
      o.start();o.stop(ctx.currentTime+0.2);
    } else if(type==="ready"){
      if("speechSynthesis"in window){
        const u=new SpeechSynthesisUtterance("Arise!");
        u.rate=0.85;u.pitch=0.6;u.volume=1;
        const voices=window.speechSynthesis.getVoices();
        const jpVoice=voices.find(v=>v.lang.startsWith("ja"));
        if(jpVoice)u.voice=jpVoice;
        window.speechSynthesis.speak(u);
      }
      [330,415,494].forEach((freq,i)=>{
        const o=ctx.createOscillator();const g=ctx.createGain();
        o.connect(g);g.connect(ctx.destination);
        o.frequency.value=freq;o.type="sawtooth";
        g.gain.setValueAtTime(0,ctx.currentTime+i*0.05);
        g.gain.linearRampToValueAtTime(0.1,ctx.currentTime+0.05+i*0.05);
        g.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.6+i*0.05);
        o.start(ctx.currentTime+i*0.05);o.stop(ctx.currentTime+0.6+i*0.05);
      });
    } else if(type==="overdue"){
      [600,400].forEach((freq,i)=>{
        const o=ctx.createOscillator();const g=ctx.createGain();
        o.connect(g);g.connect(ctx.destination);
        o.frequency.value=freq;o.type="square";
        g.gain.setValueAtTime(0.1,ctx.currentTime+i*0.15);
        g.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.1+i*0.15);
        o.start(ctx.currentTime+i*0.15);o.stop(ctx.currentTime+0.15+i*0.15);
      });
    } else if(type==="levelUp"){
      [261,329,392,523].forEach((freq,i)=>{
        const o=ctx.createOscillator();const g=ctx.createGain();
        o.connect(g);g.connect(ctx.destination);
        o.frequency.value=freq;o.type="triangle";
        g.gain.setValueAtTime(0,ctx.currentTime+i*0.1);
        g.gain.linearRampToValueAtTime(0.15,ctx.currentTime+0.05+i*0.1);
        g.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.4+i*0.1);
        o.start(ctx.currentTime+i*0.1);o.stop(ctx.currentTime+0.4+i*0.1);
      });
    } else if(type==="bossDamage"){
      const o=ctx.createOscillator();const g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      o.frequency.setValueAtTime(800,ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(100,ctx.currentTime+0.2);
      o.type="sawtooth";
      g.gain.setValueAtTime(0.2,ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.3);
      o.start();o.stop(ctx.currentTime+0.3);
    }
  } catch(e){console.warn("Audio failed:",e);}
}

// ─── DB increment helper ───
function getKgIncrement(exName){
  const dbExercises=["DB Bench Press","DB Incline Bench Press","Incline DB Press","Arnold Press","Single Arm DB Row","Lateral Raises","Front Raises","Hammer Curls","Incline Curls","Concentration Curls","Reverse Flyes"];
  if(dbExercises.includes(exName))return 2;
  return 2.5;
}

function getMuscleRank(xp){for(let i=MUSCLE_RANKS.length-1;i>=0;i--)if(xp>=MUSCLE_RANKS[i].min)return MUSCLE_RANKS[i];return MUSCLE_RANKS[0];}
function getNextMuscleRank(xp){for(let i=0;i<MUSCLE_RANKS.length;i++)if(xp<MUSCLE_RANKS[i].min)return MUSCLE_RANKS[i];return null;}

const LP = [
  {week:1,title:"Week 1 — Foundations",color:"#6b7280",lessons:[
    {day:1,title:"What is AI?",desc:"The big picture of artificial intelligence.",
      full:"Artificial Intelligence is the broad field of making machines that can perform tasks that typically require human intelligence. Within AI, Machine Learning (ML) is the approach where systems learn from data instead of being explicitly programmed. Deep Learning is a subset of ML using neural networks with many layers. Large Language Models (LLMs) like Claude are a specific type of deep learning model trained on vast amounts of text data.\n\nKey concepts to understand:\n• AI > Machine Learning > Deep Learning > LLMs\n• LLMs predict the next most likely token (word/piece of word)\n• They're trained on internet text, books, code, and more\n• They don't 'think' like humans — they're pattern recognition at massive scale\n\nToday's task: Ask Claude to explain what it is and how it works. Compare its answer with what you learned here."},
    {day:2,title:"How Claude Works",desc:"Transformers, tokens, and text generation.",
      full:"Claude is built on the Transformer architecture, invented in 2017. Here's how it processes your messages:\n\n1. TOKENIZATION: Your text is broken into tokens (roughly 3/4 of a word each). 'Hello world' might become ['Hello', ' world'].\n\n2. CONTEXT WINDOW: Claude can 'see' up to 200K tokens at once — that's roughly 150K words or a full novel. Everything in your conversation sits in this window.\n\n3. ATTENTION: The transformer looks at relationships between ALL tokens simultaneously. This is what makes it powerful — it understands context.\n\n4. GENERATION: Claude produces one token at a time, choosing the most appropriate next token based on everything it's seen. This is why it 'streams' text.\n\n5. RLHF: Claude was fine-tuned using Reinforcement Learning from Human Feedback to be helpful, harmless, and honest.\n\nToday's task: Ask Claude 'How many tokens is this message?' and experiment with how it handles different input sizes."},
    {day:3,title:"Your First Prompts",desc:"Basic prompting patterns and practice.",
      full:"Prompting is how you communicate with Claude. Better prompts = better results. Here are 10 prompt types to practice today:\n\n1. QUESTION: 'What causes inflation?'\n2. INSTRUCTION: 'Summarize this article in 3 bullet points'\n3. BRAINSTORM: 'Give me 10 business ideas for someone who loves fitness'\n4. ANALYSIS: 'What are the pros and cons of remote work?'\n5. CREATION: 'Write a professional email declining a meeting'\n6. EXPLANATION: 'Explain quantum computing like I'm 12'\n7. TRANSLATION: 'Translate this to Spanish and explain the grammar'\n8. ROLEPLAY: 'Act as a personal trainer and create a meal plan'\n9. DEBUGGING: 'Why isn't this code working? [paste code]'\n10. COMPARISON: 'Compare React vs Vue for a beginner'\n\nNotice how each prompt type gives Claude a clear task. The more specific you are, the better Claude performs.\n\nToday's task: Try all 10 prompt types. Note which ones give you the best results and why."},
    {day:4,title:"Prompt Structure",desc:"Role, task, context, format framework.",
      full:"The RTCF framework will transform your prompts:\n\nR — ROLE: Tell Claude who to be\n'You are an experienced fitness coach specializing in strength training'\n\nT — TASK: What exactly should Claude do?\n'Create a 4-week progressive overload plan'\n\nC — CONTEXT: Give background information\n'I'm 30 years old, intermediate lifter, training 5 days/week PPL split, goal is hypertrophy'\n\nF — FORMAT: How should the output look?\n'Present as a table with Week, Exercise, Sets, Reps, Weight columns'\n\nFull example:\n'You are an experienced fitness coach. Create a 4-week progressive overload plan for bench press. I currently bench 80kg for 4×8. I want to reach 90kg. Present as a weekly table with sets, reps, and target weight.'\n\nSee how much better that is than just 'help me get stronger at bench press'?\n\nToday's task: Rewrite 5 of yesterday's prompts using RTCF. Compare the quality of responses."},
    {day:5,title:"Claude vs Other Models",desc:"Understand the AI landscape.",
      full:"The main players in 2025-2026:\n\nCLAUDE (Anthropic): Known for thoughtful, nuanced responses. Excellent at long documents, analysis, coding, and following complex instructions. Strong safety focus. Large context window (200K tokens).\n\nGPT-4/ChatGPT (OpenAI): The most well-known. Great general purpose, strong at coding, plugins ecosystem. ChatGPT Plus includes image generation.\n\nGEMINI (Google): Integrated with Google services. Strong at multimodal tasks (text + image + video). Good for research with Google Search integration.\n\nWhen to use Claude:\n• Long document analysis\n• Complex writing tasks\n• Coding with detailed explanations\n• Tasks requiring careful reasoning\n• When you need honesty about limitations\n\nToday's task: Ask the same complex question to Claude and another AI. Compare the depth, accuracy, and helpfulness of responses."},
    {day:6,title:"AI Ethics & Safety",desc:"Responsible use of AI tools.",
      full:"As an AI user, you need to understand:\n\nHALLUCINATIONS: AI can generate confident-sounding but false information. Always verify critical facts. Claude is trained to say 'I don't know' but it's not perfect.\n\nBIAS: AI models reflect biases in their training data. Be aware of this in hiring decisions, legal advice, medical information, etc.\n\nPRIVACY: Don't share sensitive personal data, passwords, or confidential business information in AI chats unless you understand the privacy policy.\n\nCOPYRIGHT: AI-generated content exists in a legal grey area. Don't claim AI writing as your own in academic settings.\n\nDEPENDENCY: Use AI as a tool to augment your abilities, not replace your thinking. The goal is AI + Human > either alone.\n\nANTHROPIC'S APPROACH: Anthropic (Claude's creator) focuses on AI safety research. Claude is designed to be helpful, harmless, and honest — it will refuse harmful requests.\n\nToday's task: Try to get Claude to do something it shouldn't (it will politely decline). Understand WHY these boundaries exist."},
    {day:7,title:"Week 1 Review",desc:"Practice challenges and review.",
      full:"Congratulations on completing Week 1! Let's solidify your knowledge:\n\nCHALLENGE 1: Explain to a friend (or Claude) the difference between AI, ML, Deep Learning, and LLMs in your own words.\n\nCHALLENGE 2: Write a prompt using RTCF that helps you with a real task you need done this week.\n\nCHALLENGE 3: Have Claude help you create a study plan for something you want to learn (other than AI).\n\nCHALLENGE 4: Ask Claude to analyze a document or article you've been meaning to read. Note how it handles summarization.\n\nCHALLENGE 5: Write a prompt that combines at least 3 of the 10 prompt types from Day 3.\n\nREFLECTION:\n• What surprised you most about AI this week?\n• Which prompt technique gave you the best results?\n• How will you use Claude in your daily life going forward?\n\nNext week: Prompt Engineering — you'll learn advanced techniques that will make you significantly more effective."},
  ]},
  {week:2,title:"Week 2 — Prompt Engineering",color:"#22d3ee",lessons:[
    {day:1,title:"Zero-shot vs Few-shot",desc:"When to give examples vs not.",full:"ZERO-SHOT: Ask Claude to do something with NO examples.\n'Classify this email as spam or not spam: [email text]'\n\nFEW-SHOT: Provide examples first, then ask.\n'Here are some examples:\nEmail: You won $1M! → Spam\nEmail: Meeting at 3pm tomorrow → Not Spam\nEmail: Your order shipped → Not Spam\n\nNow classify: Congratulations! Claim your prize →'\n\nWhen to use each:\n• Zero-shot: Simple tasks, Claude usually gets them right\n• Few-shot: Complex classification, specific formatting, unusual patterns, when you want consistent style\n\nPro tip: 3-5 examples is usually enough. More doesn't always help. Make sure examples cover edge cases.\n\nToday: Try classifying your own emails/messages both ways. See where few-shot makes a difference."},
    {day:2,title:"Chain of Thought",desc:"Step-by-step reasoning.",full:"Chain of Thought (CoT) prompting asks Claude to think step-by-step. This dramatically improves accuracy on complex tasks.\n\nWITHOUT CoT:\n'What's 15% tip on a $87.50 bill split 3 ways?'\n→ Claude might jump to answer and make errors\n\nWITH CoT:\n'Calculate the 15% tip on $87.50 split 3 ways. Show your step-by-step reasoning.'\n→ Claude: Step 1: 15% of $87.50 = $13.13... Step 2: Total = $100.63... Step 3: Split by 3 = $33.54 each\n\nMagic phrases that trigger CoT:\n• 'Think step by step'\n• 'Show your reasoning'\n• 'Walk me through your thought process'\n• 'Let's solve this systematically'\n\nCoT works best for: math, logic puzzles, debugging, complex analysis, planning, comparing options.\n\nToday: Take a complex problem and solve it with and without CoT. Compare accuracy."},
    {day:3,title:"System Prompts",desc:"Control Claude's behavior.",full:"A system prompt sets Claude's 'personality' and rules for the entire conversation. Think of it as programming Claude's behavior.\n\nExample system prompt:\n'You are a concise technical writer. Always:\n- Use bullet points\n- Include code examples\n- Keep explanations under 100 words\n- Ask clarifying questions before giving advice\nNever:\n- Use jargon without defining it\n- Give opinions, only facts'\n\nOn claude.ai, you can set this in your User Preferences. In the API, it's the system parameter.\n\nPro tips:\n• Be specific about what you want AND don't want\n• Give Claude a persona relevant to your task\n• Include formatting rules\n• Set the tone (formal, casual, technical)\n• Define how Claude should handle uncertainty\n\nToday: Create 3 different system prompts — one for coding help, one for fitness coaching, one for writing. Test each."},
    {day:4,title:"Output Formatting",desc:"Control Claude's response structure.",full:"You can control exactly how Claude formats its responses:\n\nJSON:\n'Return the result as a JSON object with fields: name, category, score'\n\nMARKDOWN TABLE:\n'Present this as a markdown table with columns: Feature, Pros, Cons'\n\nXML:\n'Wrap your analysis in <analysis> tags and your recommendation in <recommendation> tags'\n\nNUMBERED STEPS:\n'Give me exactly 5 steps, numbered 1-5, each under 20 words'\n\nSPECIFIC LENGTH:\n'Respond in exactly 3 paragraphs of 50 words each'\n\nPro tip: Combine format instructions with examples for best results. Claude is excellent at matching patterns you show it.\n\nToday: Ask Claude the same question 5 different ways, each with a different output format. See how it adapts."},
    {day:5,title:"Prompt Chaining",desc:"Multi-step workflows.",full:"Prompt chaining breaks complex tasks into sequential steps, where each output feeds into the next prompt.\n\nExample — Blog Post Pipeline:\nPrompt 1: 'Generate 5 blog post ideas about AI in fitness'\nPrompt 2: 'Take idea #3 and create a detailed outline with 5 sections'\nPrompt 3: 'Write section 1 based on this outline: [outline]'\nPrompt 4: 'Now write section 2, maintaining the same tone as section 1: [section 1]'\nPrompt 5: 'Review the full post for consistency and suggest edits'\n\nWhy chain?\n• Each step gets Claude's full attention\n• You can course-correct between steps\n• Complex tasks become manageable\n• Quality improves dramatically\n\nChaining patterns:\n• Generate → Refine → Format\n• Research → Analyze → Recommend\n• Draft → Critique → Revise\n• Plan → Execute → Review\n\nToday: Chain 3+ prompts to complete a real task. A report, meal plan, or project plan."},
    {day:6,title:"Long Documents",desc:"Working with Claude's context window.",full:"Claude can handle ~200K tokens (roughly 500 pages). Here's how to use this effectively:\n\nSUMMARIZATION:\n'Summarize this document in 3 levels:\n1. One sentence\n2. One paragraph\n3. Key points with details'\n\nEXTRACTION:\n'Extract all dates, names, and action items from this document. Present as a table.'\n\nANALYSIS:\n'Read this contract and identify: risks, unusual clauses, and missing protections.'\n\nQ&A:\n'Based on this document only, answer: [specific question]. Quote the relevant section.'\n\nTips for long documents:\n• Put the document first, instructions after\n• Be specific about what you want extracted\n• Ask Claude to cite which section it's referencing\n• For very long docs, process in sections\n\nToday: Upload a long document (PDF, article, etc.) to Claude and practice all four techniques above."},
    {day:7,title:"Week 2 Project",desc:"Build your personal prompt library.",full:"Create a prompt library — 10 reusable templates you'll actually use:\n\nBuild templates for:\n1. Email drafting (professional tone)\n2. Meeting summary / action items\n3. Code review / debugging\n4. Content creation (blog/social)\n5. Research / comparison analysis\n6. Learning / explanation\n7. Decision making framework\n8. Workout / meal planning\n9. Language learning exercises\n10. Daily planning / productivity\n\nFor each template:\n• Write the system prompt\n• Include 1-2 examples\n• Define the output format\n• Test with a real use case\n• Save the best version\n\nStore these somewhere accessible (notes app, document) so you can copy-paste them into Claude whenever needed.\n\nThis library will save you hours every week. Invest the time now.\n\nNext week: We'll use these templates for real-world productivity!"},
  ]},
  {week:3,title:"Week 3 — Productivity",color:"#34d399",lessons:[
    {day:1,title:"Writing with Claude",desc:"Master Claude as a writing partner.",full:"Claude excels at writing tasks. Here's your toolkit:\n\nDRAFTING: 'Write a [type] about [topic] in [tone] for [audience]. Length: [words].'\n\nREWRITING: 'Rewrite this to be more [concise/formal/engaging/simple]: [text]'\n\nTONE SHIFT: 'Convert this casual message into a professional email: [text]'\n\nEDITING: 'Proofread this for grammar, clarity, and flow. Explain each change.'\n\nSTYLE MATCHING: 'Write in the style of [describe style]. Here's a sample: [example]'\n\nPro workflow: Draft fast → Claude refines → You finalize. Never start from a blank page again.\n\nToday: Take something you need to write this week and use Claude as a collaborative writing partner."},
    {day:2,title:"Research & Analysis",desc:"Deep research with Claude.",full:"Turn Claude into your research assistant:\n\n1. TOPIC OVERVIEW: 'Give me a comprehensive overview of [topic]. Include key concepts, current debates, and recent developments.'\n\n2. SOURCE ANALYSIS: 'Analyze this article. What are the main claims? What evidence supports them? What's missing?'\n\n3. COMPARISON: 'Compare [A] vs [B] across these dimensions: cost, effectiveness, ease of use, scalability.'\n\n4. SYNTHESIS: 'I've read these 3 articles [summaries]. What are the common themes and contradictions?'\n\n5. FACT CHECK: 'I believe [claim]. What's the evidence for and against this?'\n\nRemember: Claude can make mistakes. For critical research, always verify key claims with primary sources.\n\nToday: Research a topic you're curious about using all 5 techniques."},
    {day:3,title:"Data Tasks",desc:"Spreadsheets, CSV, and data analysis.",full:"Claude can handle data work surprisingly well:\n\nFORMULAS: 'Write an Excel formula that [describes what you need]'\n\nDATA CLEANING: Paste messy data → 'Clean this data: fix formatting, remove duplicates, standardize dates'\n\nANALYSIS: 'Here's my sales data for 6 months [data]. What trends do you see? What should I do differently?'\n\nVISUALIZATION: 'What chart type best represents this data? Create it as a React component.' (Claude can build interactive charts!)\n\nCSV WORK: Paste CSV data → 'Add a column calculating [metric]. Sort by [field]. Filter where [condition].'\n\nToday: Take real data from your life (budget, workout log, anything) and have Claude analyze it."},
    {day:4,title:"Email & Communication",desc:"Never stare at a blank email again.",full:"Communication templates:\n\nCOLD OUTREACH: 'Write a cold email to [person/role] at [company] about [reason]. Keep under 100 words. Include a specific ask.'\n\nFOLLOW UP: 'Write a follow-up email. Original context: [what happened]. Tone: [urgent/casual/professional]. Goal: [what you want].'\n\nDIFFICULT MESSAGES: 'I need to tell [person] about [situation]. Help me communicate this clearly and empathetically.'\n\nNEGOTIATION: 'Draft a response to this offer: [details]. I want to counter with [your position]. Keep it professional.'\n\nPro tip: Always tell Claude the GOAL of the communication, not just what to write. 'I want them to schedule a call' vs 'write a nice email.'\n\nToday: Draft 3 real emails or messages you've been putting off."},
    {day:5,title:"Study Assistant",desc:"Claude as your personal tutor.",full:"Learning acceleration techniques:\n\nFEYNMAN TECHNIQUE: 'Explain [concept] as if I'm 10 years old. Then explain it at an expert level. Then help me explain it back to you.'\n\nFLASHCARDS: 'Create 20 flashcards for [topic]. Format: Q: [question] | A: [answer]'\n\nQUIZ ME: 'Ask me 10 progressively harder questions about [topic]. Wait for my answer before revealing if I'm correct.'\n\nCONNECT CONCEPTS: 'How does [new thing] relate to [thing I already know]?'\n\nSPACED REPETITION: 'I studied [topic] 3 days ago. Quiz me on the key concepts I should remember.'\n\nToday: Pick something you're learning (language, skill, etc.) and use these techniques with Claude."},
    {day:6,title:"Decision Making",desc:"Structured thinking with Claude.",full:"Decision frameworks via Claude:\n\nPROS/CONS PLUS: 'Analyze this decision: [options]. For each, list pros, cons, risks, and what I'd need to believe for this to be the right choice.'\n\nSECOND-ORDER THINKING: 'If I choose [option], what happens next? And what happens after that? Think 3 steps ahead.'\n\n10/10/10: 'How will I feel about this decision in 10 minutes, 10 months, and 10 years?'\n\nPRE-MORTEM: 'Imagine I chose [option] and it failed completely. What went wrong?'\n\nWEIGHTED MATRIX: 'Help me create a weighted decision matrix for [options] with criteria: [list criteria and importance].'\n\nToday: Use one of these frameworks on a real decision you're facing."},
    {day:7,title:"Week 3 Project",desc:"Automate 5 recurring tasks.",full:"Identify 5 things you do repeatedly and build Claude workflows:\n\nExamples:\n1. Weekly meal prep planning\n2. Meeting notes → action items → follow-up emails\n3. Social media content calendar\n4. Budget review and analysis\n5. Language learning daily exercises\n\nFor each:\n• Document the current manual process\n• Create a prompt template\n• Test it with real data\n• Refine until it saves you time\n• Save the template to your prompt library\n\nGoal: Save at least 2 hours per week through Claude workflows.\n\nNext week: We go technical — Claude API!"},
  ]},
  {week:4,title:"Week 4 — API Basics",color:"#a78bfa",lessons:[
    {day:1,title:"API Concepts",desc:"What is an API and how to get started.",full:"An API (Application Programming Interface) lets your code talk to Claude directly. Instead of typing in a chat box, your program sends messages and receives responses.\n\nWhy use the API?\n• Build custom apps powered by Claude\n• Automate workflows\n• Process data in bulk\n• Integrate Claude into existing tools\n\nGetting started:\n1. Go to console.anthropic.com\n2. Create an account\n3. Get your API key (keep it secret!)\n4. Install: pip install anthropic (Python) or npm install @anthropic-ai/sdk (Node.js)\n\nKey concepts:\n• Endpoint: The URL you send requests to\n• API Key: Your authentication credential\n• Request: What you send (your message)\n• Response: What Claude sends back\n• Tokens: How usage is measured and billed\n\nToday: Create your Anthropic account and get your API key. Read the first page of docs.anthropic.com."},
    {day:2,title:"First API Call",desc:"Send your first message to Claude via code.",full:"Python example:\n\nimport anthropic\nclient = anthropic.Anthropic()\nmessage = client.messages.create(\n    model='claude-sonnet-4-20250514',\n    max_tokens=1024,\n    messages=[{'role': 'user', 'content': 'Hello Claude!'}]\n)\nprint(message.content[0].text)\n\nThat's it! You just called Claude from code.\n\nKey parts:\n• model: Which Claude model to use\n• max_tokens: Maximum response length\n• messages: Array of conversation messages\n• role: 'user' (you) or 'assistant' (Claude)\n\nThe response object contains:\n• content: Claude's response (array of blocks)\n• usage: Token counts (input + output)\n• stop_reason: Why Claude stopped\n\nToday: Run this code. Modify the message. Try different questions. Get comfortable with the basic pattern."},
    {day:3,title:"Parameters",desc:"Control Claude's output precisely.",full:"Key parameters:\n\nMODEL: 'claude-sonnet-4-20250514' (fast, good), 'claude-opus-4-20250514' (smartest)\n\nMAX_TOKENS: Limits response length. 1 token ≈ 0.75 words. Set to 1024 for short, 4096 for long responses.\n\nTEMPERATURE (0-1): Controls randomness.\n• 0 = deterministic, same answer every time\n• 0.3 = slight variation, good for most tasks\n• 0.7+ = creative, more diverse outputs\n• Use 0 for factual/code, higher for creative writing\n\nSYSTEM: Sets Claude's behavior for the whole conversation.\nsystem='You are a helpful fitness coach'\n\nSTOP_SEQUENCES: Strings that make Claude stop generating.\nstop_sequences=['END', '---']\n\nToday: Experiment with temperature settings. Send the same creative prompt at temp 0 vs 0.7 vs 1.0. See the difference."},
    {day:4,title:"Conversations",desc:"Multi-turn conversation management.",full:"For a conversation, send the FULL history each time:\n\nmessages=[\n  {'role': 'user', 'content': 'My name is Hunter'},\n  {'role': 'assistant', 'content': 'Nice to meet you, Hunter!'},\n  {'role': 'user', 'content': 'What did I just tell you?'}\n]\n\nClaude sees the entire conversation and responds: 'You told me your name is Hunter.'\n\nKey principles:\n• Claude has NO memory between API calls\n• YOU manage the conversation history\n• Append each new exchange to the messages array\n• The context window limits total conversation length\n\nConversation management:\n• Store messages in an array\n• Append user message → call API → append assistant response\n• Trim old messages when approaching token limit\n• Summarize old context to save tokens\n\nToday: Build a simple loop that maintains conversation history across multiple exchanges."},
    {day:5,title:"Streaming",desc:"Real-time response streaming.",full:"Instead of waiting for the full response, streaming shows text as it's generated — just like the chat interface.\n\nPython streaming:\nwith client.messages.stream(\n    model='claude-sonnet-4-20250514',\n    max_tokens=1024,\n    messages=[{'role': 'user', 'content': 'Tell me a story'}]\n) as stream:\n    for text in stream.text_stream:\n        print(text, end='', flush=True)\n\nWhy stream?\n• Better user experience (no waiting)\n• Lower perceived latency\n• Can process/display partial results\n• Can cancel mid-response if needed\n\nStream events include: message_start, content_block_start, content_block_delta (the text chunks), content_block_stop, message_stop.\n\nToday: Modify yesterday's chatbot to use streaming. See how much more responsive it feels."},
    {day:6,title:"Error Handling",desc:"Production-ready patterns.",full:"Things will go wrong. Be ready:\n\nCOMMON ERRORS:\n• 400: Bad request (check your message format)\n• 401: Invalid API key\n• 429: Rate limited (too many requests)\n• 500: Server error (retry)\n• 529: Overloaded (retry with backoff)\n\nRETRY PATTERN:\nimport time\nfor attempt in range(3):\n    try:\n        response = client.messages.create(...)\n        break\n    except anthropic.RateLimitError:\n        time.sleep(2 ** attempt)  # exponential backoff\n\nCOST CONTROL:\n• Monitor token usage (response.usage)\n• Set max_tokens appropriately\n• Use cheaper models for simple tasks\n• Cache responses when possible\n\nToday: Deliberately trigger errors (wrong API key, too many requests) and handle them gracefully."},
    {day:7,title:"Week 4 Project",desc:"Build a CLI chatbot.",full:"Build a command-line chatbot that:\n\n1. Maintains conversation history\n2. Uses streaming for responses\n3. Has a system prompt (e.g., fitness coach)\n4. Handles errors gracefully\n5. Shows token usage after each response\n6. Has /clear and /quit commands\n7. Saves conversation to a file\n\nBonus features:\n• Let user change the system prompt with /persona\n• Add a /cost command showing total tokens used\n• Support pasting multi-line input\n• Add conversation memory/summarization\n\nThis is a real, useful tool you'll keep using. Take your time, make it good.\n\nNext week: Tool Use & Agents — Claude starts taking actions!"},
  ]},
  {week:5,title:"Week 5 — Tools & Agents",color:"#f59e0b",lessons:[
    {day:1,title:"AI Tools Explained",desc:"How Claude can use external tools.",full:"Tools (also called function calling) let Claude interact with the outside world. Instead of just generating text, Claude can:\n\n• Call a calculator for precise math\n• Look up real-time weather data\n• Search a database\n• Send an email\n• Create calendar events\n\nHow it works:\n1. You define tools Claude can use (name, description, parameters)\n2. Claude decides when to use a tool based on the conversation\n3. Claude outputs a 'tool use' block with the function name and arguments\n4. YOUR code executes the function and returns results\n5. Claude uses the results to form its final response\n\nClaude doesn't actually run code — it tells you WHAT to run, and you feed results back.\n\nToday: Read the tool use documentation at docs.anthropic.com. Understand the flow conceptually."},
    {day:2,title:"Tool Schemas",desc:"Defining tools for Claude.",full:"Tools are defined with JSON Schema:\n\ntools=[{\n  'name': 'get_weather',\n  'description': 'Get current weather for a location',\n  'input_schema': {\n    'type': 'object',\n    'properties': {\n      'city': {'type': 'string', 'description': 'City name'},\n      'units': {'type': 'string', 'enum': ['celsius', 'fahrenheit']}\n    },\n    'required': ['city']\n  }\n}]\n\nKey principles:\n• GOOD DESCRIPTIONS matter more than anything. Claude reads them to decide when/how to use tools.\n• Required vs optional parameters\n• Use enums to limit options\n• Keep tools focused — one clear purpose each\n\nToday: Define 3 tool schemas on paper: a calculator, a todo list manager, and a unit converter. Focus on clear descriptions."},
    {day:3,title:"First Tool",desc:"Build and connect a working tool.",full:"Complete working example:\n\n1. Define tool:\ntools = [{'name': 'calculate', 'description': 'Evaluate a math expression', 'input_schema': {'type': 'object', 'properties': {'expression': {'type': 'string'}}, 'required': ['expression']}}]\n\n2. Call Claude with tools:\nresponse = client.messages.create(model='claude-sonnet-4-20250514', max_tokens=1024, tools=tools, messages=[{'role': 'user', 'content': 'What is 15% of 847?'}])\n\n3. Check if Claude wants to use a tool:\nfor block in response.content:\n    if block.type == 'tool_use':\n        result = eval(block.input['expression'])  # Execute it\n        # Send result back to Claude\n\n4. Feed result back and get final answer.\n\nToday: Implement this calculator tool end-to-end. Then add a second tool (e.g., string length counter)."},
    {day:4,title:"Multi-Tool Workflows",desc:"Multiple tools working together.",full:"Give Claude several tools and let it orchestrate:\n\ntools = [\n  calculator_tool,    # Math\n  weather_tool,       # Weather API\n  notes_tool,         # Save/read notes\n  web_search_tool     # Search the web\n]\n\nUser: 'What's the temperature in Paris in Fahrenheit? Save it to my notes with today's date.'\n\nClaude will:\n1. Call weather_tool(city='Paris')\n2. Call calculator_tool('(celsius * 9/5) + 32')\n3. Call notes_tool(action='save', content='...')\n\nClaude intelligently chains tools based on the task. Your job is to:\n• Define tools clearly\n• Execute them when called\n• Return clean results\n• Handle errors gracefully\n\nToday: Build a system with 3+ tools. Test with complex queries that require multiple tool calls."},
    {day:5,title:"Agentic Patterns",desc:"Build AI agents that reason and act.",full:"An agent is Claude in a loop: Think → Act → Observe → Repeat.\n\nReAct Pattern:\nwhile not done:\n  response = claude.think('Given [context], what should I do next?')\n  action = extract_action(response)\n  result = execute(action)\n  context.append(result)\n  if is_complete(result): done = True\n\nKey patterns:\n\n1. PLANNING: Ask Claude to make a plan before acting\n2. REFLECTION: After each step, ask 'Did that work? What should I do differently?'\n3. TOOL SELECTION: Claude picks the right tool for each sub-task\n4. ERROR RECOVERY: When something fails, Claude tries alternative approaches\n\nImportant: Set a maximum loop count to prevent infinite loops. Always have a human-in-the-loop for important actions.\n\nToday: Build a simple agent that can research a topic using search, take notes, and produce a summary."},
    {day:6,title:"MCP Protocol",desc:"Connect Claude to any service.",full:"MCP (Model Context Protocol) is Anthropic's standard for connecting AI to external services.\n\nThink of MCP as a universal adapter. Instead of building custom integrations for every service, MCP provides a standard protocol.\n\nMCP Servers provide:\n• Tools (functions Claude can call)\n• Resources (data Claude can read)\n• Prompts (templates for common tasks)\n\nExamples of MCP servers:\n• File system access\n• Database queries\n• GitHub integration\n• Slack messaging\n• Google Drive\n• Custom business tools\n\nClaude Code (CLI tool) uses MCP extensively — it can read/write files, run commands, and interact with your dev environment.\n\nToday: Read the MCP documentation at modelcontextprotocol.io. Understand the architecture. If you have Claude Code, explore its MCP capabilities."},
    {day:7,title:"Week 5 Project",desc:"Build a personal AI agent.",full:"Build an agent that combines everything:\n\nYOUR AGENT SHOULD:\n1. Accept a natural language goal\n2. Break it into steps\n3. Use tools to accomplish each step\n4. Handle errors and retry\n5. Report back with results\n\nSuggested tools:\n• Web search (use a free API)\n• Note taking (file read/write)\n• Calculator\n• Timer/reminder\n\nExample use cases:\n• 'Research the best protein powder under $50 and summarize top 3 options'\n• 'Calculate my macros for a 2500 calorie day and save as a meal plan'\n• 'Find 5 articles about [topic] and create a summary document'\n\nThis is your first real AI agent. Take pride in it!\n\nNext week: Advanced techniques — RAG, embeddings, vision, and more."},
  ]},
  {week:6,title:"Week 6 — Advanced",color:"#ef4444",lessons:[
    {day:1,title:"RAG",desc:"Give Claude your own knowledge.",full:"RAG (Retrieval Augmented Generation) lets Claude answer questions using YOUR documents.\n\nThe flow:\n1. CHUNK: Split your documents into smaller pieces (200-500 words each)\n2. EMBED: Convert each chunk into a vector (list of numbers) using an embedding model\n3. STORE: Save vectors in a vector database\n4. QUERY: When user asks a question, embed the question too\n5. RETRIEVE: Find the most similar document chunks\n6. GENERATE: Send those chunks + question to Claude\n\nWhy RAG?\n• Claude answers from YOUR data, not just training\n• Reduces hallucination (Claude cites sources)\n• Works with private/proprietary information\n• Keeps data up-to-date without retraining\n\nSimple implementation: You can start with just text files and basic string matching before moving to proper vector search.\n\nToday: Take 5 documents you own and manually create a simple RAG system (even just copy-paste relevant sections into the prompt)."},
    {day:2,title:"Embeddings",desc:"Semantic search and similarity.",full:"Embeddings convert text into numbers that capture meaning.\n\n'I love dogs' → [0.2, -0.5, 0.8, ...]\n'I adore puppies' → [0.19, -0.48, 0.82, ...] (very similar!)\n'The stock market crashed' → [-0.7, 0.3, -0.1, ...] (very different)\n\nUse cases:\n• Semantic search (find similar documents)\n• Clustering (group similar items)\n• Recommendation (find related content)\n• Deduplication (find near-duplicates)\n\nPopular embedding models:\n• Voyage AI (recommended by Anthropic)\n• OpenAI text-embedding-3\n• Cohere embed\n\nVector databases:\n• Pinecone (managed, easy)\n• ChromaDB (local, free)\n• Weaviate (open source)\n• pgvector (PostgreSQL extension)\n\nToday: Generate embeddings for 10 sentences and calculate similarity scores between them. See which pairs are most/least similar."},
    {day:3,title:"Code Generation",desc:"Claude as a coding partner.",full:"Claude is an exceptional programmer. Use it effectively:\n\nDEBUGGING: Paste error + code → 'Explain this error and fix it'\n\nREFACTORING: 'Refactor this code to be more readable and efficient: [code]'\n\nGENERATION: 'Write a Python function that [description]. Include type hints, docstring, and error handling.'\n\nREVIEW: 'Review this code for bugs, security issues, and performance problems: [code]'\n\nTESTING: 'Write unit tests for this function: [code]'\n\nPro tips:\n• Give context: language, framework, purpose\n• Ask Claude to explain its code\n• Request multiple approaches\n• Specify coding style/conventions\n• Ask for edge case handling\n\nClaude Code (CLI) takes this further — it can read your entire codebase, run tests, and make changes directly.\n\nToday: Use Claude to write, debug, and test a small project in your preferred language."},
    {day:4,title:"Vision & Multimodal",desc:"Image analysis with Claude.",full:"Claude can see and analyze images:\n\nCAPABILITIES:\n• Describe image content in detail\n• Read text in images (OCR)\n• Analyze charts and graphs\n• Compare multiple images\n• Answer questions about images\n• Extract data from screenshots\n\nAPI usage:\nmessages=[{\n  'role': 'user',\n  'content': [\n    {'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/jpeg', 'data': base64_string}},\n    {'type': 'text', 'text': 'What do you see in this image?'}\n  ]\n}]\n\nUse cases:\n• Receipt scanning → expense tracking\n• Whiteboard photos → structured notes\n• UI screenshots → code generation\n• Document photos → text extraction\n\nToday: Send Claude 5 different types of images and explore its visual understanding capabilities."},
    {day:5,title:"Structured Output",desc:"Reliable data extraction.",full:"Getting consistent structured data from Claude:\n\nJSON MODE:\nSystem: 'Always respond with valid JSON only. No markdown, no explanation.'\nUser: 'Extract: name, date, amount from this receipt: [image]'\n\nSCHEMA ENFORCEMENT:\n'Return a JSON object matching this exact schema:\n{\n  \"items\": [{\"name\": string, \"quantity\": int, \"price\": float}],\n  \"total\": float,\n  \"date\": \"YYYY-MM-DD\"\n}'\n\nVALIDATION LOOP:\nGet response → Parse JSON → Validate against schema → If invalid, ask Claude to fix → Repeat\n\nPro tips:\n• Include the schema in the prompt\n• Give an example of valid output\n• Use try/catch for JSON parsing\n• Strip markdown code fences before parsing\n• Validate required fields exist\n\nToday: Build a pipeline that extracts structured data from 5 different text inputs with 100% valid JSON output."},
    {day:6,title:"Evaluation",desc:"Measuring AI quality.",full:"How do you know if your AI system is good? You measure it.\n\nTYPES OF EVALS:\n1. AUTOMATED: Code checks output format, accuracy against known answers\n2. HUMAN: People rate quality on a scale\n3. MODEL-BASED: Use Claude to evaluate Claude's outputs\n4. A/B TESTING: Compare two approaches on the same inputs\n\nBUILDING AN EVAL:\n1. Create a test set (50-100 examples with expected outputs)\n2. Run your prompt/system on all examples\n3. Score results (accuracy, quality, format compliance)\n4. Calculate metrics (% correct, average quality score)\n\nMODEL-AS-JUDGE:\n'Rate this response 1-5 on: accuracy, helpfulness, conciseness. Explain each rating.'\n\nThis is how professionals improve AI systems. The prompt that scores 85% gets iterated until it scores 95%.\n\nToday: Create a 10-question eval for one of your prompt templates. Score it. Improve the prompt. Score again."},
    {day:7,title:"Week 6 Project",desc:"Build a RAG knowledge base.",full:"Build a searchable knowledge base with your own documents:\n\n1. Collect 10-20 documents (notes, articles, PDFs)\n2. Chunk them into smaller pieces\n3. Create a simple search function (start with keyword matching, upgrade to embeddings later)\n4. Build a Claude-powered Q&A interface\n5. Claude answers questions using ONLY your documents\n6. Include source citations in responses\n\nBonus:\n• Add a 'I don't know' response when no relevant context is found\n• Support adding new documents dynamically\n• Create a web interface\n\nThis is a genuinely useful tool. Many companies pay thousands for exactly this capability.\n\nNext week: Building real products with AI!"},
  ]},
  {week:7,title:"Week 7 — Products",color:"#ec4899",lessons:[
    {day:1,title:"AI Product Design",desc:"When and how to use AI in products.",full:"Not everything needs AI. Good AI products follow these principles:\n\nWHEN TO USE AI:\n• Task is language-heavy (writing, analysis, conversation)\n• Input is unstructured (free text, images, audio)\n• Perfect accuracy isn't required\n• Human-in-the-loop is possible\n• The task would take a human significant time\n\nWHEN NOT TO USE AI:\n• Simple CRUD operations\n• Precise calculations\n• Real-time requirements (<100ms)\n• When wrong answers are dangerous\n\nUX PRINCIPLES:\n• Show confidence levels\n• Allow easy correction\n• Explain AI reasoning\n• Graceful degradation when AI fails\n• Set clear expectations\n\nToday: Analyze 3 AI products you use. What works? What doesn't? How would you improve them?"},
    {day:2,title:"AI Web Apps",desc:"Building React + Claude apps.",full:"Build interactive AI features for the web:\n\nStack: React frontend + Claude API backend\n\nExample architecture:\nUser → React UI → Your API server → Claude API → Response → UI update\n\nKey considerations:\n• NEVER put your API key in frontend code\n• Use a backend server to proxy Claude requests\n• Implement streaming for better UX\n• Add loading states and error handling\n• Rate limit your users\n\nSimple patterns:\n• Chat interface (most common)\n• Form → AI analysis → Results\n• Upload → Processing → Output\n• Interactive editor with AI suggestions\n\nToday: Sketch out (on paper or in a doc) an AI-powered web app you'd want to build. Define the user flow, API calls, and UI components."},
    {day:3,title:"Artifacts",desc:"Build apps inside Claude.",full:"Claude's Artifact system lets you create interactive apps right inside the conversation:\n\n• React components with full interactivity\n• HTML/CSS/JS pages\n• Data visualizations with charts\n• Games and tools\n• SVG graphics\n\nAvailable libraries: React, Tailwind CSS, Recharts, D3, Three.js, Lucide icons, shadcn/ui, Chart.js, and more.\n\nBest practices:\n• Keep state in React hooks (useState, useEffect)\n• Use Tailwind for styling\n• Make it interactive and responsive\n• Add animations for polish\n• THIS APP you're using right now is an artifact!\n\nToday: Ask Claude to build you an interactive artifact. Start simple (a calculator, quiz, or timer), then get creative."},
    {day:4,title:"Batch Processing",desc:"Process data at scale.",full:"Sometimes you need to process hundreds or thousands of items:\n\nBATCH API: Anthropic offers a batch API for large jobs:\n• Submit many messages at once\n• 50% cheaper than individual calls\n• Results delivered within 24 hours\n• Great for classification, extraction, analysis\n\nDIY BATCHING:\nresults = []\nfor item in items:\n    response = claude.create(messages=[{'role':'user','content':f'Classify: {item}'}])\n    results.append(parse(response))\n    time.sleep(0.1)  # respect rate limits\n\nPARALLEL PROCESSING:\nUse asyncio or threading to process multiple items simultaneously. Respect rate limits (check your tier).\n\nToday: Take a dataset of at least 20 items and batch-process them with Claude. Compare individual vs batch approaches."},
    {day:5,title:"Cost Optimization",desc:"Save money at scale.",full:"Real-world cost strategies:\n\nMODEL SELECTION:\n• Haiku: Fastest, cheapest. Great for simple tasks, classification.\n• Sonnet: Best balance. Most tasks.\n• Opus: Smartest. Complex reasoning only.\nRoute simple tasks to cheaper models!\n\nPROMPT CACHING:\nReuse the same system prompt/documents across calls. Anthropic caches repeated content — you pay less for cached tokens.\n\nTOKEN BUDGETING:\n• Set appropriate max_tokens\n• Ask for concise responses\n• Summarize long contexts instead of sending full text\n• Remove unnecessary instructions\n\nARCHITECTURE:\n• Cache AI responses for identical queries\n• Use traditional code for deterministic parts\n• Only call Claude when AI reasoning is needed\n\nToday: Audit one of your existing Claude workflows. Calculate cost per task. Optimize to reduce cost by 50%."},
    {day:6,title:"Safety & Moderation",desc:"Deploy AI responsibly.",full:"Before shipping AI to users:\n\nINPUT SAFETY:\n• Validate user input length and format\n• Detect and block prompt injection attempts\n• Sanitize inputs (remove malicious content)\n• Rate limit per user\n\nOUTPUT SAFETY:\n• Use Claude's built-in safety features\n• Add content filters for your specific domain\n• Review outputs before showing to other users\n• Log and monitor for concerning patterns\n\nSYSTEM PROMPT SECURITY:\n• Don't expose your system prompt\n• Test against prompt extraction attacks\n• Use separate validation layer\n\nMONITORING:\n• Track usage patterns\n• Flag unusual behavior\n• Review edge cases\n• Collect user feedback\n\nToday: Try to 'break' one of your AI systems with adversarial inputs. Fix the vulnerabilities you find."},
    {day:7,title:"Week 7 Project",desc:"Ship a real AI feature.",full:"Build and share something real:\n\nOPTION A: AI-powered tool (resume reviewer, meal planner, study quiz generator)\nOPTION B: Claude Artifact (interactive dashboard, game, utility)\nOPTION C: Automation (email processor, data pipeline, content generator)\n\nRequirements:\n• Solves a real problem\n• Has error handling\n• Looks polished\n• Someone else could use it\n\nShare it! Post on social media, show friends, or add to your portfolio.\n\nNext week: Final week — mastery, portfolios, and the future of AI."},
  ]},
  {week:8,title:"Week 8 — Mastery",color:"#f97316",lessons:[
    {day:1,title:"Claude Code",desc:"AI-powered command line development.",full:"Claude Code is a CLI tool that turns Claude into a coding agent in your terminal.\n\nInstall: npm install -g @anthropic-ai/claude-code\nRun: claude\n\nCapabilities:\n• Reads and writes files in your project\n• Runs terminal commands\n• Understands your entire codebase\n• Makes multi-file changes\n• Runs tests and fixes failures\n• Uses MCP for external integrations\n\nUse cases:\n• 'Fix the failing tests in this project'\n• 'Add user authentication to this app'\n• 'Refactor this module to use TypeScript'\n• 'Create a REST API for this data model'\n\nClaude Code is the most powerful way to code with AI — it sees your whole project, not just snippets.\n\nToday: Install Claude Code and use it on a real project. Start with small tasks, then try something ambitious."},
    {day:2,title:"Advanced Concepts",desc:"Fine-tuning and beyond.",full:"When might you go beyond prompting?\n\nFINE-TUNING: Train a model on your specific data\n• When: Consistent style/format needed, specific domain knowledge, high volume of similar tasks\n• Cost: Significant (data prep, training, hosting)\n• Alternative: Often, better prompts + RAG can achieve the same result cheaper\n\nDISTILLATION: Train a smaller model to mimic a larger one\n• Use Opus to generate training data\n• Fine-tune Haiku on that data\n• Get Opus quality at Haiku price/speed\n\nCONSTITUTIONAL AI: Anthropic's approach to safety\n• Train AI using a set of principles\n• AI critiques and revises its own outputs\n• Reduces need for human feedback\n\nToday: Evaluate whether any of your current AI workflows would benefit from fine-tuning vs better prompting."},
    {day:3,title:"Multi-Agent Systems",desc:"AI agents working together.",full:"Multiple specialized agents collaborating:\n\nPATTERNS:\n1. PIPELINE: Agent A → Agent B → Agent C (each does one task)\n2. DEBATE: Two agents argue for different approaches, a third decides\n3. HIERARCHY: Manager agent delegates to specialist agents\n4. SWARM: Many agents work in parallel on sub-tasks\n\nEXAMPLE — Research Pipeline:\nAgent 1 (Researcher): Finds relevant sources\nAgent 2 (Analyst): Evaluates source quality\nAgent 3 (Writer): Synthesizes findings\nAgent 4 (Editor): Reviews and polishes\n\nChallenges:\n• Coordination overhead\n• Error propagation\n• Cost multiplication\n• Debugging complexity\n\nStart simple: two agents is plenty for most tasks.\n\nToday: Build a 2-agent system where one creates content and another critiques/improves it."},
    {day:4,title:"Staying Current",desc:"The AI landscape changes fast.",full:"How to keep learning after this course:\n\nDAILY (5 min):\n• Follow @AnthropicAI on Twitter/X\n• Check Hacker News AI section\n\nWEEKLY (30 min):\n• Anthropic blog: anthropic.com/research\n• Read one AI paper summary (papers.cool or arxiv-sanity)\n• Try one new Claude feature or technique\n\nMONTHLY:\n• Build something new with AI\n• Attend an AI meetup or webinar\n• Review and update your prompt library\n\nCOMMUNITIES:\n• Anthropic Discord\n• r/ClaudeAI on Reddit\n• AI Twitter/X community\n• Local AI meetup groups\n\nNEWSLETTERS:\n• The Batch (Andrew Ng)\n• Ben's Bites\n• The Neuron\n\nToday: Set up your learning infrastructure. Subscribe to 2-3 sources. Schedule weekly AI learning time."},
    {day:5,title:"Portfolio",desc:"Show what you can do.",full:"Document your AI journey:\n\n1. GITHUB REPO: Collect all your projects\n   • CLI chatbot (Week 4)\n   • AI agent (Week 5)\n   • RAG system (Week 6)\n   • AI product (Week 7)\n\n2. WRITE-UPS: For each project:\n   • Problem it solves\n   • Technical approach\n   • Challenges and solutions\n   • Results and screenshots\n\n3. PROMPT LIBRARY: Your curated collection shows expertise\n\n4. BLOG POSTS: Write about what you learned\n   • 'How I built a RAG system for my personal notes'\n   • 'Prompt engineering tips that actually work'\n   • '8 weeks learning AI: what I wish I knew from day 1'\n\n5. DEMO VIDEO: Record a 2-minute walkthrough of your best project\n\nToday: Start organizing your portfolio. Pick your best 3 projects and write descriptions."},
    {day:6,title:"Future of AI",desc:"Where we're heading.",full:"What's coming in AI (and your role in it):\n\nNEAR TERM (2025-2026):\n• AI agents becoming mainstream\n• Multimodal models (text + image + audio + video)\n• AI in every software product\n• Better reasoning and planning capabilities\n• Computer use and browser automation\n\nMEDIUM TERM (2026-2028):\n• Truly autonomous AI agents\n• AI-native applications\n• Personalized AI that knows you deeply\n• Scientific discovery acceleration\n• New job categories around AI\n\nYOUR COMPETITIVE ADVANTAGE:\nMost people will use AI passively. You now understand HOW it works, can build with it, and can push its limits. This puts you ahead of 95% of people.\n\nThe people who thrive will be those who combine domain expertise + AI skills. You're building both.\n\nToday: Write down 3 ways AI will change YOUR specific field/career in the next 2 years. Start preparing."},
    {day:7,title:"Final Project",desc:"Your AI masterpiece.",full:"Build something that combines everything you've learned:\n\nIDEAS:\n• Personal AI assistant with tools, RAG, and memory\n• AI-powered app that solves a real problem for real people\n• Multi-agent system for a complex workflow\n• Open-source tool that helps others learn AI\n\nREQUIREMENTS:\n• Uses at least 3 techniques from this course\n• Solves a genuine problem\n• Is polished enough to show others\n• Includes documentation\n\nSHARE IT:\n• Post on GitHub\n• Write a blog post\n• Share on social media\n• Present to friends or colleagues\n\nYou started 8 weeks ago not knowing what a token was. Now you can build AI-powered systems. That's a massive transformation.\n\nThe System has made you stronger. Now go use this power.\n\nArise, Hunter. 🔥"},
  ]},
];

function getRank(l){for(let i=RANKS.length-1;i>=0;i--)if(l>=RANKS[i].min)return RANKS[i];return RANKS[0];}
function getXp(l){return Math.floor(100*Math.pow(1.15,l-1));}

function StatBar({label,value,max=100,color}){return(<div style={{marginBottom:7}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2,fontSize:11,color:"#94a3b8"}}><span>{label}</span><span style={{color}}>{value}</span></div><div style={{height:5,background:"rgba(255,255,255,0.05)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min((value/max)*100,100)}%`,background:`linear-gradient(90deg,${color},${color}88)`,borderRadius:3,boxShadow:`0 0 8px ${color}66`,transition:"width 0.6s ease"}}/></div></div>);}

function Notif({msg,onDone}){useEffect(()=>{const t=setTimeout(onDone,2500);return()=>clearTimeout(t);},[onDone]);return(<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:9999,padding:"12px 24px",background:"linear-gradient(135deg,rgba(15,23,42,0.97),rgba(30,41,59,0.97))",border:"1px solid rgba(59,130,246,0.5)",borderRadius:8,color:"#93c5fd",fontFamily:"'Courier New',monospace",fontSize:12,letterSpacing:1,boxShadow:"0 0 30px rgba(59,130,246,0.3)",animation:"notifIn 0.4s ease-out",textAlign:"center",maxWidth:"90vw"}}>{msg}</div>);}

function LvlModal({level,rank,onClose}){return(<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.88)",animation:"fadeIn 0.3s ease"}}><div onClick={e=>e.stopPropagation()} style={{textAlign:"center",animation:"levelUp 0.6s ease-out"}}><div style={{fontSize:13,letterSpacing:6,color:"#3b82f6",marginBottom:12,textTransform:"uppercase"}}>▸ SYSTEM ALERT ◂</div><div style={{fontSize:44,fontWeight:900,color:"#e2e8f0",fontFamily:"'Georgia',serif",textShadow:`0 0 40px ${rank.color}`,marginBottom:8}}>LEVEL {level}</div><div style={{fontSize:16,color:rank.color,letterSpacing:3,marginBottom:8}}>{rank.name}</div><div style={{fontSize:11,color:"#475569"}}>[ TAP TO CONTINUE ]</div></div></div>);}

// ─── XP MULTIPLIERS ───
function getRankMultiplier(level){
  if(level>=101)return 4.0;if(level>=76)return 3.0;if(level>=51)return 2.5;
  if(level>=31)return 2.0;if(level>=16)return 1.5;if(level>=6)return 1.2;return 1.0;
}
function getStreakMultiplier(streak){
  if(streak>=90)return 3.0;if(streak>=30)return 2.0;if(streak>=7)return 1.5;return 1.0;
}

// ─── MOTIVATIONAL QUOTES ───
const QUEST_QUOTES = [
  {text:"I alone level up.",color:"#3b82f6"},
  {text:"Arise.",color:"#ef4444"},
  {text:"The weak have no right to choose how they die.",color:"#a78bfa"},
  {text:"I am not the same person I was yesterday.",color:"#22c55e"},
  {text:"Every step forward is a step toward the top.",color:"#f59e0b"},
  {text:"Pain is just weakness leaving the body.",color:"#ef4444"},
  {text:"The System has acknowledged your effort.",color:"#3b82f6"},
  {text:"You have gotten stronger.",color:"#22c55e"},
  {text:"A hunter must always be prepared.",color:"#a78bfa"},
  {text:"The shadows obey the strong.",color:"#475569"},
  {text:"Your power is growing. Do not stop.",color:"#f59e0b"},
  {text:"Today's pain is tomorrow's power.",color:"#ef4444"},
  {text:"Discipline is the bridge between goals and results.",color:"#22d3ee"},
  {text:"No shortcuts. Only grinding.",color:"#f97316"},
  {text:"The dungeon awaits. Will you enter?",color:"#a78bfa"},
  {text:"Status: Getting Dangerous.",color:"#ec4899"},
  {text:"Quest complete. But the journey continues.",color:"#3b82f6"},
  {text:"Every rep. Every page. Every lesson. XP.",color:"#22c55e"},
  {text:"Rest is for the weak. Recovery is for the strong.",color:"#f59e0b"},
  {text:"The System rewards those who show up.",color:"#3b82f6"},
];

function QuestPopup({quote,xpGain,multiplier,onClose}){
  useEffect(()=>{const t=setTimeout(onClose,2200);return()=>clearTimeout(t);},[onClose]);
  return(<div onClick={onClose} style={{position:"fixed",inset:0,zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.75)",animation:"fadeIn 0.2s ease",pointerEvents:"auto"}}>
    <div style={{textAlign:"center",animation:"levelUp 0.4s ease-out",padding:"0 30px"}}>
      <div style={{fontSize:36,marginBottom:10}}>⚔️</div>
      <div style={{fontSize:14,color:quote.color,fontFamily:"'Georgia',serif",fontStyle:"italic",lineHeight:1.6,marginBottom:12,textShadow:`0 0 20px ${quote.color}44`}}>"{quote.text}"</div>
      <div style={{fontSize:18,fontWeight:900,color:"#4ade80",fontFamily:"'Courier New',monospace",textShadow:"0 0 15px rgba(74,222,128,0.4)"}}>+{xpGain} XP</div>
      {multiplier>1&&<div style={{fontSize:10,color:"#f59e0b",marginTop:4}}>✦ {multiplier}x multiplier active</div>}
    </div>
  </div>);
}

// ─── STABLE SET LOGGER (top-level to prevent re-mount/state reset bug) ───
function SetLogger({exName,numSets,lastSess,color,getRecommendation,onLog,onSetLogged}){
  const [sets,setSets]=useState(()=>{
    const arr=[];
    for(let s=0;s<numSets;s++){
      const rec=getRecommendation(exName,s);
      const last=lastSess?.sets?.[s];
      arr.push({kg:rec?String(rec.kg):last?String(last.kg):"",reps:rec?String(rec.reps):last?String(last.reps):"",logged:false});
    }
    return arr;
  });
  const [failTracker,setFailTracker]=useState(false);
  const updateSet=(si,field,val)=>{setSets(prev=>{const n=[...prev];n[si]={...n[si],[field]:val};return n;});};
  const logSingleSet=(si)=>{
    setSets(prev=>{const n=[...prev];n[si]={...n[si],logged:true};return n;});
    if(onSetLogged)onSetLogged(si+1);
  };
  return(<div style={{padding:"10px",marginBottom:4,background:`${color}08`,border:`1px solid ${color}22`,borderRadius:6}}>
    {lastSess&&<div style={{fontSize:8,color:"#22c55e",marginBottom:6,textAlign:"center"}}>📈 Recommendations based on last session</div>}
    {!lastSess&&<div style={{fontSize:8,color:"#475569",marginBottom:6,textAlign:"center"}}>First time — enter your working weights</div>}
    <div style={{display:"flex",gap:4,marginBottom:6,fontSize:8,color:"#475569",alignItems:"center"}}>
      <div style={{width:24,textAlign:"center"}}>Set</div>
      <div style={{flex:1,textAlign:"center"}}>kg</div>
      <div style={{flex:1,textAlign:"center"}}>Reps</div>
      <div style={{width:34,textAlign:"center"}}>Log</div>
      {lastSess&&<div style={{width:44,textAlign:"center"}}>Tip</div>}
    </div>
    {sets.map((s,si)=>{
      const rec=getRecommendation(exName,si);
      return(<div key={si} style={{display:"flex",gap:4,marginBottom:4,alignItems:"center"}}>
        <div style={{width:24,textAlign:"center",fontSize:10,color:color,fontWeight:700}}>{si+1}</div>
        <input type="number" inputMode="decimal" value={s.kg} placeholder="kg" onChange={e=>updateSet(si,"kg",e.target.value)}
          style={{flex:1,padding:"7px 4px",background:s.logged?"rgba(34,197,94,.1)":"rgba(0,0,0,.3)",border:`1px solid ${s.logged?"rgba(34,197,94,.4)":color+"33"}`,borderRadius:4,color:"#e2e8f0",fontSize:13,fontFamily:"'Courier New',monospace",outline:"none",textAlign:"center",boxSizing:"border-box"}}/>
        <input type="number" inputMode="numeric" value={s.reps} placeholder="reps" onChange={e=>updateSet(si,"reps",e.target.value)}
          style={{flex:1,padding:"7px 4px",background:s.logged?"rgba(34,197,94,.1)":"rgba(0,0,0,.3)",border:`1px solid ${s.logged?"rgba(34,197,94,.4)":color+"33"}`,borderRadius:4,color:"#e2e8f0",fontSize:13,fontFamily:"'Courier New',monospace",outline:"none",textAlign:"center",boxSizing:"border-box"}}/>
        <button onClick={()=>logSingleSet(si)} disabled={!s.kg||!s.reps} title="Log set + start rest timer"
          style={{width:34,padding:"7px 0",background:s.logged?"rgba(34,197,94,.2)":(s.kg&&s.reps?`${color}22`:"rgba(255,255,255,.03)"),border:`1px solid ${s.logged?"rgba(34,197,94,.4)":color+"33"}`,borderRadius:4,color:s.logged?"#4ade80":color,fontSize:12,cursor:s.kg&&s.reps?"pointer":"default",fontFamily:"inherit"}}>{s.logged?"✓":"▶"}</button>
        {lastSess&&<div style={{width:44,fontSize:7,color:rec?.note?.includes("↑")?"#22c55e":"#f59e0b",textAlign:"center"}}>{rec?.note||""}</div>}
      </div>);
    })}
    <button onClick={()=>{const valid=sets.filter(s=>s.kg&&s.reps);if(valid.length===0){return;}onLog(sets.filter(s=>s.kg&&s.reps).map(s=>({kg:parseFloat(s.kg)||0,reps:parseInt(s.reps)||0})));}}
      style={{width:"100%",marginTop:6,padding:"9px",background:`linear-gradient(135deg,${color}33,${color}18)`,border:`1px solid ${color}44`,borderRadius:5,color:color,fontSize:11,cursor:"pointer",fontFamily:"'Courier New',monospace",letterSpacing:1}}>
      ✓ SAVE TO LOG (+10 XP)
    </button>
    <div style={{fontSize:7,color:"#475569",marginTop:5,textAlign:"center"}}>Tap ▶ per set to start rest timer · SAVE TO LOG when done</div>
  </div>);
}

function App(){
  const [loaded,setLoaded]=useState(false);
  const [_v,_fv]=useState(0);
  const forceUpdate=()=>_fv(v=>v+1);
  const [dirty,setDirty]=useState(false);
  const [lastSaved,setLastSaved]=useState(null);
  const [questPopup,setQuestPopup]=useState(null);

  // ─── ALL GAME STATE LIVES IN A REF ───
  const g = useRef({...DEFAULT_STATE});
  const _weightPromptArmed = useRef(false);

  // Mutate state + save to IndexedDB + re-render
  const update = (changes) => {
    Object.assign(g.current, changes);
    setDirty(true);
    forceUpdate();
    saveToIDB(g.current).then(ok=>{if(ok){setDirty(false);setLastSaved(new Date().toLocaleTimeString());}});
  };

  // Manual save — the reliable fallback
  const manualSave = async () => {
    const ok = await saveToIDB(g.current);
    if(ok){setDirty(false);setLastSaved(new Date().toLocaleTimeString());setNotif("💾 Progress saved!");}
    else setNotif("❌ Save failed — try again");
  };

  // UI-only state (not saved)
  const [notif,setNotif]=useState(null);
  const [showLvl,setShowLvl]=useState(false);
  const [tab,setTab]=useState("quests");
  const [cEx,setCEx]=useState("");
  const [cS,setCS]=useState("");
  const [cR,setCR]=useState("");
  const [selPPL,setSelPPL]=useState(new Date().getDay());
  const [lW,setLW]=useState(0);
  const [expandedLesson,setExpandedLesson]=useState(null);
  const [newWeight,setNewWeight]=useState("");
  const [newFat,setNewFat]=useState("");
  const [newMuscle,setNewMuscle]=useState("");
  const [exportStr,setExportStr]=useState("");
  const [importStr,setImportStr]=useState("");
  const [showImportConfirm,setShowImportConfirm]=useState(false);
  const [editingEx,setEditingEx]=useState(null);
  // Rest timer state
  const [restTimer,setRestTimer]=useState(null);
  const [restElapsed,setRestElapsed]=useState(0);
  const [restHistory,setRestHistory]=useState([]);
  // Exercise pause timer
  const [exerciseRestTimer,setExerciseRestTimer]=useState(null);
  const [exerciseRestElapsed,setExerciseRestElapsed]=useState(0);
  // Swap modal
  const [swapModal,setSwapModal]=useState(null);
  // Sleep input state (parent-controlled to avoid reset bug)
  const [sleepHours,setSleepHours]=useState("");
  const [sleepRating,setSleepRating]=useState(0);
  // Daily/weekly prompts on app open
  const [showSleepPrompt,setShowSleepPrompt]=useState(false);
  const [showWeightPrompt,setShowWeightPrompt]=useState(false);

  // Shortcuts to read game state
  const S = g.current;

  const START_DATE = new Date("2026-04-13");
  const daysSinceStart = Math.max(0, Math.floor((new Date() - START_DATE) / (1000*60*60*24)));
  const todayStr = new Date().toISOString().slice(0,10);
  const getWeekId = (d) => {const dt=new Date(d);const day=dt.getDay()||7;dt.setDate(dt.getDate()+4-day);const yr=new Date(dt.getFullYear(),0,1);return dt.getFullYear()+"-W"+String(Math.ceil(((dt-yr)/86400000+1)/7)).padStart(2,"0");};
  const currentWeekId = getWeekId(new Date());

  const PENALIZABLE_DAILY = [...DAILY_Q, ...LIFE_Q_FIXED, ...(getTodayLearning()?[getTodayLearning()]:[])];
  const LIFE_Q = [...(getTodayLearning()?[getTodayLearning()]:[]), ...LIFE_Q_FIXED];
  const ALL_QUESTS = [...DAILY_Q, ...LIFE_Q, ...BONUS_Q];
  const yesterdayDow = new Date(Date.now()-86400000).getDay();
  const yesterdayPPL = PPL[yesterdayDow];
  const trainingPenaltyPerExercise = 10;
  const LEARNING_PENALTY = 45;

  // Convenience aliases from game state
  const level=S.level,xp=S.xp,stats=S.stats,done=S.done,doneEx=S.doneEx,doneW=S.doneW,doneLessons=S.doneLessons,totalXp=S.totalXp,qC=S.qC,streak=S.streak,wLog=S.wLog,weightLog=S.weightLog,muscleXp=S.muscleXp,lastDailyReset=S.lastDailyReset,lastWeeklyReset=S.lastWeeklyReset,penaltyLog=S.penaltyLog,dailyLessonDone=S.dailyLessonDone,liftLog=S.liftLog,vacation=S.vacation,activeBoss=S.activeBoss||null,bossHistory=S.bossHistory||[],sleepLog=S.sleepLog||[],workoutCalendar=S.workoutCalendar||{},exerciseSwaps=S.exerciseSwaps||{},soundOn=S.soundOn!==false;

  // Load saved data from IndexedDB on mount, then run resets
  useEffect(()=>{
    (async()=>{
      const d = await loadFromIDB();
      if(d){
        const merged = {...DEFAULT_STATE};
        for(const k of SAVE_FIELDS) if(d[k]!==undefined) merged[k]=d[k];
        // Migration: ensure full body-comp history is present (Rafa's known scans)
        const KNOWN_HISTORY=[
          {date:"Start",weight:125,fat:null,muscle:null},
          {date:"16/04/2026",weight:114.8,fat:30.9,muscle:74.0},
          {date:"30/04/2026",weight:111.7,fat:29.4,muscle:73.6},
          {date:"11/05/2026",weight:111.05,fat:29.2,muscle:73.2},
          {date:"21/05/2026",weight:110.35,fat:27.4,muscle:74.7},
          {date:"28/05/2026",weight:108.60,fat:27.3,muscle:73.6},
        ];
        const existing=merged.weightLog||[];
        const haveDates=new Set(existing.map(w=>w.date));
        const missing=KNOWN_HISTORY.filter(h=>!haveDates.has(h.date));
        if(missing.length>0){
          // Merge known history with any user-added entries, keep chronological-ish order
          merged.weightLog=[...KNOWN_HISTORY,...existing.filter(w=>!KNOWN_HISTORY.some(h=>h.date===w.date))];
        }
        g.current = merged;
      }

      // ─── AUTO DAILY RESET + PENALTY (runs after load) ───
      const S = g.current;
      const today = new Date().toISOString().slice(0,10);
      if(S.lastDailyReset && S.lastDailyReset !== today){
        // Check if yesterday was a weekend or vacation — no penalties
        const yesterdayDate = new Date(S.lastDailyReset);
        const yDay = yesterdayDate.getDay(); // 0=Sun, 6=Sat
        const wasWeekend = (yDay === 0 || yDay === 6);
        const wasVacation = S.vacation;

        const changes={done:[],doneEx:[],dailyLessonDone:false,lastDailyReset:today};

        if(wasWeekend || wasVacation){
          // No penalties on weekends/vacation — just reset tasks, keep streak
          changes.streak = S.streak + 1;
          const reason = wasVacation ? "🏖️ Vacation mode — no penalties" : "🌙 Weekend — no penalties";
          setTimeout(()=>setNotif(reason),500);
        } else {
          // Compute yesterday's penalizable quests
          const yLearning = LEARNING_ROTATION[yDay];
          const yPenalizable = [...DAILY_Q, ...LIFE_Q_FIXED, ...(yLearning?[yLearning]:[])];
          let totalPenalty=0,missedCount=0;const details=[];
          const missedQuests=yPenalizable.filter(q=>!S.done.includes(q.id));
          if(missedQuests.length>0){const p=missedQuests.reduce((s,q)=>s+q.xp,0);totalPenalty+=p;missedCount+=missedQuests.length;details.push(`${missedQuests.length} quests (-${p})`);}
          const yDow=new Date(Date.now()-86400000).getDay();const yPPL=PPL[yDow];
          if(yPPL&&yPPL.type!=="REST"){const missedEx=yPPL.exercises.filter(ex=>!S.doneEx.includes(ex.name));if(missedEx.length>0){const p=missedEx.length*10;totalPenalty+=p;missedCount+=missedEx.length;details.push(`${missedEx.length} exercises (-${p})`);}}
          if(!S.dailyLessonDone){totalPenalty+=45;missedCount+=1;details.push(`lesson (-45)`);}
          if(totalPenalty>0){
            const newXp=S.xp-totalPenalty;const newLvl=newXp<0?Math.max(1,S.level-1):S.level;
            Object.assign(changes,{xp:newXp<0?Math.max(0,getXp(newLvl)+newXp):newXp,level:newLvl,totalXp:Math.max(0,S.totalXp-totalPenalty),penaltyLog:[...S.penaltyLog,{date:S.lastDailyReset,missed:missedCount,penalty:totalPenalty,type:"daily",details:details.join(", ")}]});
            setTimeout(()=>setNotif(`⚠️ -${totalPenalty} XP! ${details.join(", ")}`),500);
          } else { changes.streak=S.streak+1; }
        }
        Object.assign(g.current, changes);
        await saveToIDB(g.current);
      } else if(!S.lastDailyReset){
        g.current.lastDailyReset = today;
        await saveToIDB(g.current);
      }

      // ─── AUTO WEEKLY RESET + PENALTY ───
      const wkId = getWeekId(new Date());
      if(g.current.lastWeeklyReset && g.current.lastWeeklyReset !== wkId){
        const changes={doneW:[],lastWeeklyReset:wkId};
        if(!g.current.vacation){
          const missed=WEEKLY_OBJ.filter(q=>!g.current.doneW.includes(q.id));
          if(missed.length>0){
            const penalty=missed.reduce((s,q)=>s+q.xp,0);
            const newXp=g.current.xp-penalty;const newLvl=newXp<0?Math.max(1,g.current.level-1):g.current.level;
            Object.assign(changes,{xp:newXp<0?Math.max(0,getXp(newLvl)+newXp):newXp,level:newLvl,totalXp:Math.max(0,g.current.totalXp-penalty),penaltyLog:[...g.current.penaltyLog,{date:g.current.lastWeeklyReset,missed:missed.length,penalty,type:"weekly"}]});
            setTimeout(()=>setNotif(`⚠️ -${penalty} XP weekly penalty!`),1500);
          }
        }
        Object.assign(g.current, changes);
        await saveToIDB(g.current);
      } else if(!g.current.lastWeeklyReset){
        g.current.lastWeeklyReset = wkId;
        await saveToIDB(g.current);
      }

      setLoaded(true);
      forceUpdate();

      // ─── DAILY SLEEP PROMPT + THURSDAY WEIGHT PROMPT (on app open) ───
      const gs=g.current;
      const todayKey=new Date().toISOString().slice(0,10);
      const sleepLoggedToday=(gs.sleepLog||[]).some(s=>s.date===todayKey);
      const isThursday=new Date().getDay()===4;
      // Weight logged this week?
      const thisWeekId=getWeekId(new Date());
      const weightLoggedThisWeek=(gs.weightLog||[]).some(w=>{
        if(!w.date||w.date==="Start")return false;
        // parse dd/mm/yyyy or locale date
        const parts=w.date.split(/[\/.\-]/);
        if(parts.length<3)return false;
        let dt;
        if(parts[2].length===4)dt=new Date(parts[2],parts[1]-1,parts[0]); // dd/mm/yyyy
        else dt=new Date(w.date);
        if(isNaN(dt))return false;
        return getWeekId(dt)===thisWeekId;
      });
      // Sleep prompt fires first (higher priority), then weight on Thursday
      setTimeout(()=>{
        if(!sleepLoggedToday){
          setShowSleepPrompt(true);
          // On Thursday, arm the weight prompt to fire after sleep prompt closes
          if(isThursday&&!weightLoggedThisWeek)_weightPromptArmed.current=true;
        } else if(isThursday&&!weightLoggedThisWeek){
          setShowWeightPrompt(true);
        }
      },800);
    })();
  },[]);

  // Chain: after sleep prompt closes on Thursday, show weight prompt if needed
  useEffect(()=>{
    if(!loaded)return;
    if(showSleepPrompt)return; // wait until sleep prompt is closed
    const isThursday=new Date().getDay()===4;
    if(!isThursday)return;
    const gs=g.current;
    const thisWeekId=getWeekId(new Date());
    const weightLoggedThisWeek=(gs.weightLog||[]).some(w=>{
      if(!w.date||w.date==="Start")return false;
      const parts=w.date.split(/[\/.\-]/);
      if(parts.length<3)return false;
      let dt;
      if(parts[2].length===4)dt=new Date(parts[2],parts[1]-1,parts[0]);
      else dt=new Date(w.date);
      if(isNaN(dt))return false;
      return getWeekId(dt)===thisWeekId;
    });
    // Only auto-trigger once sleep was just dismissed (not on every render)
    if(!weightLoggedThisWeek&&_weightPromptArmed.current){
      _weightPromptArmed.current=false;
      setShowWeightPrompt(true);
    }
  },[showSleepPrompt,loaded]);

  const rank=getRank(level);const xpN=getXp(level);const tPPL=PPL[new Date().getDay()];

  // ─── XP helpers with multipliers ───
  const getMultiplier=()=>{
    const rm=getRankMultiplier(level);
    const sm=getStreakMultiplier(streak);
    return Math.round((rm*sm)*10)/10;
  };
  const calcXpAdd=(baseAmt,stat)=>{
    const mult=getMultiplier();
    const amt=Math.round(baseAmt*mult);
    const newStats={...stats,[stat]:stats[stat]+1};const newTotal=totalXp+amt;
    const n=xp+amt;if(n>=xpN)return{xp:n-xpN,level:level+1,stats:newStats,totalXp:newTotal,_xpGain:amt,_mult:mult};
    return{xp:n,stats:newStats,totalXp:newTotal,_xpGain:amt,_mult:mult};
  };
  const calcXpRemove=(baseAmt,stat)=>{
    const mult=getMultiplier();
    const amt=Math.round(baseAmt*mult);
    const newStats={...stats,[stat]:Math.max(0,stats[stat]-1)};const newTotal=Math.max(0,totalXp-amt);
    const n=xp-amt;if(n<0)return{xp:Math.max(0,getXp(Math.max(1,level-1))+n),level:Math.max(1,level-1),stats:newStats,totalXp:newTotal,_xpGain:amt};
    return{xp:n,stats:newStats,totalXp:newTotal,_xpGain:amt};
  };

  const showQuestComplete=(xpGain,mult)=>{
    const quote=QUEST_QUOTES[Math.floor(Math.random()*QUEST_QUOTES.length)];
    setQuestPopup({quote,xpGain,multiplier:mult});
  };

  const toggleQ=(id)=>{
    const q=ALL_QUESTS.find(x=>x.id===id);if(!q)return;
    // Sleep log opens the sleep input modal instead of plain toggle
    if(id==="sleep_log"&&!done.includes(id)){setShowSleepPrompt(true);return;}
    const muscleMap={pushups:["chest","triceps","shoulders"],squats:["quads","glutes"],situps:["core"],treadmill:["cardio"],weightedplank:["core"],farmercarry:["core"],calfblitz:["calves"],extrardl:["hamstrings","glutes"]};
    if(done.includes(id)){
      const newMxp={...muscleXp};(muscleMap[id]||[]).forEach(m=>{newMxp[m]=Math.max(0,(newMxp[m]||0)-3);});
      const xpC=calcXpRemove(q.xp,q.stat);
      update({done:done.filter(x=>x!==id),qC:Math.max(0,qC-1),muscleXp:newMxp,...xpC});
      setNotif(`↩ -${xpC._xpGain} XP · ${q.stat} reverted`);
    } else {
      const newMxp={...muscleXp};(muscleMap[id]||[]).forEach(m=>{newMxp[m]=(newMxp[m]||0)+3;});
      const xpC=calcXpAdd(q.xp,q.stat);
      update({done:[...done,id],qC:qC+1,muscleXp:newMxp,...xpC});
      if(xpC.level>level)setShowLvl(true);
      showQuestComplete(xpC._xpGain,xpC._mult);
    }
  };
  const toggleEx=(n)=>{
    const newMxp={...muscleXp};
    if(doneEx.includes(n)){
      MUSCLE_GROUPS.forEach(mg=>{if(mg.exercises.includes(n))newMxp[mg.key]=Math.max(0,(newMxp[mg.key]||0)-5);});
      const xpC=calcXpRemove(10,"STR");
      update({doneEx:doneEx.filter(x=>x!==n),muscleXp:newMxp,...xpC});
      setNotif("↩ -"+xpC._xpGain+" XP · STR reverted");
    } else {
      MUSCLE_GROUPS.forEach(mg=>{if(mg.exercises.includes(n))newMxp[mg.key]=(newMxp[mg.key]||0)+5;});
      const xpC=calcXpAdd(10,"STR");
      update({doneEx:[...doneEx,n],muscleXp:newMxp,...xpC});
      if(xpC.level>level)setShowLvl(true);
      showQuestComplete(xpC._xpGain,xpC._mult);
    }
  };
  const toggleW=(id)=>{
    const q=WEEKLY_OBJ.find(x=>x.id===id);if(!q)return;
    if(doneW.includes(id)){
      const xpC=calcXpRemove(q.xp,q.stat);
      update({doneW:doneW.filter(x=>x!==id),...xpC});
      setNotif(`↩ -${xpC._xpGain} XP · Weekly reverted`);
    } else {
      const xpC=calcXpAdd(q.xp,q.stat);
      update({doneW:[...doneW,id],...xpC});
      if(xpC.level>level)setShowLvl(true);
      showQuestComplete(xpC._xpGain,xpC._mult);
    }
  };
  const completeL=(wk,dy)=>{
    const k=`${wk}-${dy}`;if(doneLessons.includes(k))return;
    const xpC=calcXpAdd(45,"INT");
    update({doneLessons:[...doneLessons,k],dailyLessonDone:true,...xpC});
    if(xpC.level>level)setShowLvl(true);
    showQuestComplete(xpC._xpGain,xpC._mult);
  };
  const addWeightEntry=()=>{if(!newWeight)return;
    update({weightLog:[...weightLog,{date:new Date().toLocaleDateString(),weight:parseFloat(newWeight),fat:newFat?parseFloat(newFat):null,muscle:newMuscle?parseFloat(newMuscle):null}]});
    setNewWeight("");setNewFat("");setNewMuscle("");setNotif("📊 Weight logged!");
  };

  // Lift logging
  const getLastSession=(exName)=>{const entries=liftLog[exName];if(!entries||entries.length===0)return null;return entries[entries.length-1];};
  const getRecommendation=(exName,setIdx)=>{
    const last=getLastSession(exName);if(!last||!last.sets||!last.sets[setIdx])return null;
    const prev=last.sets[setIdx];const prevKg=parseFloat(prev.kg)||0;const prevReps=parseInt(prev.reps)||0;
    let maxReps=12,minReps=8;
    for(const day of Object.values(PPL)){for(const ex of day.exercises||[]){if(ex.name===exName){const m=ex.sets.match(/\d+[×x](\d+)(?:-(\d+))?/);if(m){minReps=parseInt(m[1]);maxReps=parseInt(m[2]||m[1]);}break;}}}
    const inc=getKgIncrement(exName);
    if(prevReps>=maxReps)return{kg:prevKg+inc,reps:minReps,note:`↑ +${inc}kg`};
    return{kg:prevKg,reps:prevReps+1,note:"→ +1 rep"};
  };
  const logExerciseSets=(exName,sets)=>{
    const newLiftLog={...liftLog,[exName]:[...(liftLog[exName]||[]),{date:todayStr,sets}]};
    const changes={liftLog:newLiftLog};
    // Track workout calendar
    const wc={...workoutCalendar};
    wc[todayStr]=(wc[todayStr]||0)+1;
    changes.workoutCalendar=wc;
    if(!doneEx.includes(exName)){
      const newMxp={...muscleXp};MUSCLE_GROUPS.forEach(mg=>{if(mg.exercises.includes(exName))newMxp[mg.key]=(newMxp[mg.key]||0)+5;});
      const xpC=calcXpAdd(10,"STR");
      Object.assign(changes,{doneEx:[...doneEx,exName],muscleXp:newMxp,...xpC});
      showQuestComplete(xpC._xpGain,xpC._mult);
    }
    // Check active boss
    if(activeBoss&&activeBoss.target.type==="lift"&&activeBoss.target.exercise===exName){
      const winSet=sets.find(s=>s.kg>=activeBoss.target.kg&&s.reps>=activeBoss.target.reps);
      if(winSet){
        const completed={...activeBoss,completedDate:todayStr,result:"victory"};
        Object.assign(changes,{activeBoss:null,bossHistory:[...bossHistory,completed]});
        const xpReward=calcXpAdd(activeBoss.reward.xp,"STR");
        Object.assign(changes,xpReward);
        if(soundOn)playSound("levelUp");
        setNotif(`🏆 BOSS DEFEATED! +${activeBoss.reward.xp} XP · "${activeBoss.reward.badge}"`);
      } else if(soundOn)playSound("bossDamage");
    }
    update(changes);setEditingEx(null);
  };

  // Boss fight helpers
  const acceptBoss=(boss)=>{
    update({activeBoss:{...boss,acceptedDate:new Date().toISOString().slice(0,10),damageDone:0}});
    setNotif(`⚔️ Boss accepted: ${boss.name}!`);
  };
  const cancelBoss=()=>{
    if(!activeBoss)return;
    const ab={...activeBoss,result:"abandoned",completedDate:new Date().toISOString().slice(0,10)};
    update({activeBoss:null,bossHistory:[...bossHistory,ab]});
    setNotif("Boss abandoned. No penalty.");
  };
  const checkBossProgress=()=>{
    if(!activeBoss)return 0;
    if(activeBoss.target.type==="streak")return Math.min(100,(streak/activeBoss.target.days)*100);
    if(activeBoss.target.type==="muscleXp")return Math.min(100,((muscleXp[activeBoss.target.muscle]||0)/activeBoss.target.amount)*100);
    if(activeBoss.target.type==="lift"){
      const lifts=liftLog[activeBoss.target.exercise]||[];
      const lastSession=lifts[lifts.length-1];
      if(!lastSession)return 0;
      const max=Math.max(...lastSession.sets.map(s=>s.kg));
      return Math.min(100,(max/activeBoss.target.kg)*100);
    }
    return 0;
  };

  // Sleep logging
  const logSleep=()=>{
    if(!sleepHours||sleepRating===0){setNotif("Enter hours and rating");return;}
    const todayKey=new Date().toISOString().slice(0,10);
    const existing=sleepLog.filter(s=>s.date!==todayKey);
    const newLog=[...existing,{date:todayKey,hours:parseFloat(sleepHours),rating:parseInt(sleepRating)}].sort((a,b)=>a.date.localeCompare(b.date)).slice(-90);
    const changes={sleepLog:newLog};
    // Auto-complete sleep_log daily quest
    if(!done.includes("sleep_log")){
      const xpC=calcXpAdd(5,"VIT");
      Object.assign(changes,{done:[...done,"sleep_log"],...xpC});
      showQuestComplete(xpC._xpGain,xpC._mult);
    }
    update(changes);
    setSleepHours("");setSleepRating(0);
    setNotif(`😴 Sleep logged: ${sleepHours}h, ${sleepRating}/5 stars`);
  };

  // Exercise swap
  const swapExercise=(originalName,newName)=>{
    const swaps={...exerciseSwaps};
    swaps[`${todayStr}_${originalName}`]=newName;
    update({exerciseSwaps:swaps});
    setSwapModal(null);
    setNotif(`🔄 Swapped to ${newName} for today`);
  };

  // Rest timer
  useEffect(()=>{
    if(!restTimer||restTimer.paused)return;
    const interval=setInterval(()=>{
      const elapsed=Math.floor((Date.now()-restTimer.startTime)/1000);
      setRestElapsed(elapsed);
      if(elapsed===restTimer.totalSec){
        if(navigator.vibrate)navigator.vibrate([200,100,200]);
        if(soundOn)playSound("ready");
      }
      if(elapsed===restTimer.totalSec+30){
        if(navigator.vibrate)navigator.vibrate([400,100,400,100,400]);
        if(soundOn)playSound("overdue");
      }
    },200);
    return()=>clearInterval(interval);
  },[restTimer,soundOn]);

  useEffect(()=>{
    if(!exerciseRestTimer)return;
    const interval=setInterval(()=>{
      const elapsed=Math.floor((Date.now()-exerciseRestTimer.startTime)/1000);
      setExerciseRestElapsed(elapsed);
      if(elapsed===exerciseRestTimer.totalSec){
        if(navigator.vibrate)navigator.vibrate([300,100,300,100,300]);
        if(soundOn)playSound("ready");
      }
    },500);
    return()=>clearInterval(interval);
  },[exerciseRestTimer,soundOn]);

  const startRest=(exerciseName,setNum,seconds,color)=>{
    setRestTimer({totalSec:seconds,exerciseName,setNum,startTime:Date.now(),paused:false,color:color||"#3b82f6"});
    setRestElapsed(0);
    if(soundOn)playSound("setLogged");
  };
  const stopRest=()=>{
    if(restTimer){
      const actual=Math.floor((Date.now()-restTimer.startTime)/1000);
      setRestHistory(h=>[...h,{exerciseName:restTimer.exerciseName,setNum:restTimer.setNum,plannedSec:restTimer.totalSec,actualSec:actual,date:new Date().toISOString().slice(0,16)}].slice(-50));
    }
    setRestTimer(null);setRestElapsed(0);
  };
  const addTime=(seconds)=>{
    if(!restTimer)return;
    setRestTimer({...restTimer,totalSec:restTimer.totalSec+seconds});
  };
  const startExerciseRest=(nextExerciseName,seconds,color)=>{
    setExerciseRestTimer({totalSec:seconds,nextExerciseName,startTime:Date.now(),color:color||"#a855f7"});
    setExerciseRestElapsed(0);
    if(soundOn)playSound("setLogged");
  };
  const stopExerciseRest=()=>{setExerciseRestTimer(null);setExerciseRestElapsed(0);};

  const exportSave=()=>{
    const str=btoa(encodeURIComponent(JSON.stringify({...g.current,exportDate:new Date().toISOString()})));
    setExportStr(str);
    if(navigator.clipboard){navigator.clipboard.writeText(str).then(()=>setNotif("📋 Copied!")).catch(()=>setNotif("📋 Ready — long press to copy"));}
    else setNotif("📋 Ready — long press to copy");
  };

  const importSave=()=>{
    try{
      const raw=JSON.parse(decodeURIComponent(atob(importStr.trim())));
      const merged={...DEFAULT_STATE};for(const k of SAVE_FIELDS)if(raw[k]!==undefined)merged[k]=raw[k];
      update(merged);
      setImportStr("");setShowImportConfirm(false);setNotif("✅ Save imported!");
    }catch(e){setNotif("❌ Invalid save code.");}
  };

  const resetAllData=async()=>{
    try{const db=await openDB();const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).delete(DATA_KEY);}catch(e){}
    update({...DEFAULT_STATE});
    setNotif("🔄 All data reset. Fresh start, Hunter.");
  };

  const dC=DAILY_Q.filter(q=>done.includes(q.id)).length;const allD=PENALIZABLE_DAILY.every(q=>done.includes(q.id));
  const lC=LIFE_Q.filter(q=>done.includes(q.id)).length;
  const vPPL=PPL[selPPL];const wC=WEEKLY_OBJ.filter(q=>doneW.includes(q.id)).length;
  const tLC=doneLessons.length;const curWk=Math.min(Math.floor(tLC/7),7);
  const latestW=weightLog[weightLog.length-1];const goalW=105;const startW=115;
  const progress=Math.max(0,Math.min(100,((startW-latestW.weight)/(startW-goalW))*100));

  const IS={width:"100%",padding:"10px 12px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:6,color:"#e2e8f0",fontSize:13,fontFamily:"'Courier New',monospace",outline:"none",boxSizing:"border-box"};

  const tabs=[{k:"quests",i:"⚔️",l:"QUESTS"},{k:"training",i:"🏋️",l:"PPL"},{k:"boss",i:"👹",l:"BOSS"},{k:"progress",i:"📈",l:"STATS"},{k:"mobility",i:"🤸",l:"FLEX"},{k:"learn",i:"🤖",l:"LEARN"},{k:"life",i:"🧠",l:"LIFE"},{k:"health",i:"⚖️",l:"BODY"},{k:"rank",i:"📊",l:"RANK"},{k:"settings",i:"⚙️",l:"SAVE"}];

  if(!loaded)return(<div style={{minHeight:"100vh",background:"#020617",display:"flex",alignItems:"center",justifyContent:"center",color:"#3b82f6",fontFamily:"'Courier New',monospace",fontSize:14,letterSpacing:2}}>◆ LOADING SYSTEM... ◆</div>);

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#020617 0%,#0f172a 40%,#020617 100%)",color:"#e2e8f0",fontFamily:"'Courier New',monospace",position:"relative",overflow:"hidden"}}>
      <style>{`@keyframes questFlash{from{opacity:1}to{opacity:0}}@keyframes notifIn{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes levelUp{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes gridPulse{0%,100%{opacity:.03}50%{opacity:.06}}input::placeholder{color:#334155}`}</style>
      <div style={{position:"fixed",inset:0,backgroundImage:"linear-gradient(rgba(59,130,246,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.03) 1px,transparent 1px)",backgroundSize:"40px 40px",animation:"gridPulse 4s ease infinite",pointerEvents:"none"}}/>

      {notif&&<Notif msg={notif} onDone={()=>setNotif(null)}/>}
      {questPopup&&<QuestPopup quote={questPopup.quote} xpGain={questPopup.xpGain} multiplier={questPopup.multiplier} onClose={()=>setQuestPopup(null)}/>}
      {showLvl&&<LvlModal level={level} rank={rank} onClose={()=>setShowLvl(false)}/>}

      {/* SWAP EXERCISE MODAL */}
      {swapModal&&(()=>{
        const alts=EXERCISE_ALTERNATIVES[swapModal]||[];
        return(<div onClick={()=>setSwapModal(null)} style={{position:"fixed",inset:0,zIndex:10001,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.85)",animation:"fadeIn .2s ease",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:360,background:"linear-gradient(135deg,rgba(15,23,42,.98),rgba(30,41,59,.95))",border:"1px solid rgba(168,85,247,.4)",borderRadius:12,padding:18,maxHeight:"80vh",overflowY:"auto"}}>
            <div style={{fontSize:9,color:"#c084fc",letterSpacing:2,marginBottom:4}}>🔄 SWAP EXERCISE</div>
            <div style={{fontSize:14,color:"#e2e8f0",fontWeight:700,marginBottom:2}}>{swapModal}</div>
            <div style={{fontSize:9,color:"#64748b",marginBottom:14}}>Pick an alternative (same muscle group). Applies for today only.</div>
            {alts.map((alt,i)=>(<button key={i} onClick={()=>swapExercise(swapModal,alt.name)} style={{display:"block",width:"100%",textAlign:"left",padding:"11px 12px",marginBottom:6,background:"rgba(168,85,247,.08)",border:"1px solid rgba(168,85,247,.25)",borderRadius:7,cursor:"pointer",color:"inherit",fontFamily:"inherit"}}>
              <div style={{fontSize:12,color:"#e2e8f0",fontWeight:600}}>{alt.name}</div>
              <div style={{fontSize:9,color:"#94a3b8",marginTop:2}}>{alt.reason}</div>
            </button>))}
            <button onClick={()=>setSwapModal(null)} style={{width:"100%",marginTop:6,padding:"9px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.1)",borderRadius:6,color:"#94a3b8",fontSize:11,cursor:"pointer",fontFamily:"inherit",letterSpacing:1}}>CANCEL</button>
          </div>
        </div>);
      })()}

      {/* DAILY SLEEP PROMPT (on app open) */}
      {showSleepPrompt&&(<div style={{position:"fixed",inset:0,zIndex:10002,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.9)",animation:"fadeIn .3s ease",padding:20}}>
        <div style={{width:"100%",maxWidth:340,background:"linear-gradient(135deg,rgba(15,23,42,.98),rgba(49,46,129,.3))",border:"1px solid rgba(99,102,241,.5)",borderRadius:14,padding:20,textAlign:"center"}}>
          <div style={{fontSize:44,marginBottom:8}}>😴</div>
          <div style={{fontSize:9,color:"#a5b4fc",letterSpacing:2,marginBottom:4}}>▸ GOOD MORNING, HUNTER ◂</div>
          <div style={{fontSize:16,color:"#fff",fontWeight:700,marginBottom:6}}>Log Last Night's Sleep</div>
          <div style={{fontSize:10,color:"#94a3b8",marginBottom:16,lineHeight:1.5}}>Sleep is your #1 recovery lever. Quick log before you start.</div>
          <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center",justifyContent:"center"}}>
            <input type="number" inputMode="decimal" step="0.5" min="0" max="14" value={sleepHours} placeholder="Hours" onChange={e=>setSleepHours(e.target.value)}
              style={{width:90,padding:"10px 8px",background:"rgba(0,0,0,.4)",border:"1px solid rgba(99,102,241,.4)",borderRadius:7,color:"#e2e8f0",fontSize:16,fontFamily:"'Courier New',monospace",outline:"none",textAlign:"center",boxSizing:"border-box"}}/>
            <span style={{fontSize:12,color:"#64748b"}}>hours</span>
          </div>
          <div style={{display:"flex",gap:4,marginBottom:16,justifyContent:"center"}}>
            {[1,2,3,4,5].map(r=>(<button key={r} onClick={()=>setSleepRating(r)} style={{width:38,height:38,padding:0,background:r<=sleepRating?"rgba(99,102,241,.3)":"rgba(0,0,0,.3)",border:`1px solid ${r<=sleepRating?"#a5b4fc":"rgba(255,255,255,.1)"}`,borderRadius:7,color:r<=sleepRating?"#fbbf24":"#475569",fontSize:18,cursor:"pointer",fontFamily:"inherit"}}>★</button>))}
          </div>
          <button onClick={()=>{logSleep();setShowSleepPrompt(false);}} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,rgba(99,102,241,.3),rgba(168,85,247,.2))",border:"1px solid rgba(99,102,241,.5)",borderRadius:8,color:"#c7d2fe",fontSize:12,cursor:"pointer",fontFamily:"inherit",letterSpacing:1,fontWeight:700}}>💤 LOG SLEEP (+5 XP)</button>
          <button onClick={()=>setShowSleepPrompt(false)} style={{width:"100%",marginTop:8,padding:"8px",background:"none",border:"none",color:"#475569",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>Skip for now</button>
        </div>
      </div>)}

      {/* THURSDAY WEIGHT PROMPT */}
      {showWeightPrompt&&(<div style={{position:"fixed",inset:0,zIndex:10002,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.9)",animation:"fadeIn .3s ease",padding:20}}>
        <div style={{width:"100%",maxWidth:340,background:"linear-gradient(135deg,rgba(15,23,42,.98),rgba(6,78,59,.3))",border:"1px solid rgba(34,197,94,.5)",borderRadius:14,padding:20,textAlign:"center"}}>
          <div style={{fontSize:44,marginBottom:8}}>⚖️</div>
          <div style={{fontSize:9,color:"#86efac",letterSpacing:2,marginBottom:4}}>▸ THURSDAY WEIGH-IN ◂</div>
          <div style={{fontSize:16,color:"#fff",fontWeight:700,marginBottom:6}}>Weekly Body Check</div>
          <div style={{fontSize:10,color:"#94a3b8",marginBottom:16,lineHeight:1.5}}>Time for your Fitdays scan. Log your numbers to track the trend.</div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            <input type="number" inputMode="decimal" step="0.05" value={newWeight} placeholder="Weight (kg)" onChange={e=>setNewWeight(e.target.value)}
              style={{padding:"10px 12px",background:"rgba(0,0,0,.4)",border:"1px solid rgba(34,197,94,.4)",borderRadius:7,color:"#e2e8f0",fontSize:14,fontFamily:"'Courier New',monospace",outline:"none",textAlign:"center",boxSizing:"border-box"}}/>
            <div style={{display:"flex",gap:8}}>
              <input type="number" inputMode="decimal" step="0.1" value={newFat} placeholder="Body Fat %" onChange={e=>setNewFat(e.target.value)}
                style={{flex:1,padding:"10px 8px",background:"rgba(0,0,0,.4)",border:"1px solid rgba(34,197,94,.3)",borderRadius:7,color:"#e2e8f0",fontSize:13,fontFamily:"'Courier New',monospace",outline:"none",textAlign:"center",boxSizing:"border-box"}}/>
              <input type="number" inputMode="decimal" step="0.1" value={newMuscle} placeholder="Muscle (kg)" onChange={e=>setNewMuscle(e.target.value)}
                style={{flex:1,padding:"10px 8px",background:"rgba(0,0,0,.4)",border:"1px solid rgba(34,197,94,.3)",borderRadius:7,color:"#e2e8f0",fontSize:13,fontFamily:"'Courier New',monospace",outline:"none",textAlign:"center",boxSizing:"border-box"}}/>
            </div>
          </div>
          <button onClick={()=>{if(!newWeight){setNotif("Enter at least weight");return;}addWeightEntry();setShowWeightPrompt(false);}} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,rgba(34,197,94,.3),rgba(59,130,246,.2))",border:"1px solid rgba(34,197,94,.5)",borderRadius:8,color:"#bbf7d0",fontSize:12,cursor:"pointer",fontFamily:"inherit",letterSpacing:1,fontWeight:700}}>📊 LOG WEIGHT</button>
          <button onClick={()=>setShowWeightPrompt(false)} style={{width:"100%",marginTop:8,padding:"8px",background:"none",border:"none",color:"#475569",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>Remind me later</button>
        </div>
      </div>)}

      <div style={{maxWidth:440,margin:"0 auto",padding:"14px 14px 100px",position:"relative",zIndex:2}}>
        <div style={{textAlign:"center",marginBottom:14,paddingTop:6}}>
          <div style={{fontSize:9,letterSpacing:6,color:"#3b82f6",textTransform:"uppercase",animation:"pulse 3s ease infinite"}}>◆ SYSTEM INTERFACE ◆</div>
          <div style={{fontSize:8,color:"#334155",marginTop:4,letterSpacing:1}}>STARTED APR 13, 2026 · DAY {daysSinceStart + 1}</div>
        </div>

        {/* PLAYER CARD */}
        <div style={{background:"linear-gradient(135deg,rgba(15,23,42,.9),rgba(30,41,59,.6))",border:"1px solid rgba(59,130,246,.15)",borderRadius:12,padding:16,marginBottom:12,position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,width:16,height:16,borderTop:"2px solid rgba(59,130,246,.4)",borderLeft:"2px solid rgba(59,130,246,.4)"}}/>
          <div style={{position:"absolute",top:0,right:0,width:16,height:16,borderTop:"2px solid rgba(59,130,246,.4)",borderRight:"2px solid rgba(59,130,246,.4)"}}/>
          <div style={{position:"absolute",bottom:0,left:0,width:16,height:16,borderBottom:"2px solid rgba(59,130,246,.4)",borderLeft:"2px solid rgba(59,130,246,.4)"}}/>
          <div style={{position:"absolute",bottom:0,right:0,width:16,height:16,borderBottom:"2px solid rgba(59,130,246,.4)",borderRight:"2px solid rgba(59,130,246,.4)"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div><div style={{fontSize:18,fontWeight:900,fontFamily:"'Georgia',serif",color:"#f1f5f9"}}>HUNTER</div><div style={{fontSize:10,color:rank.color,letterSpacing:2,marginTop:2}}>{rank.name.toUpperCase()}</div></div>
            <div style={{fontSize:28,fontWeight:900,color:rank.color,fontFamily:"'Georgia',serif",textShadow:`0 0 20px ${rank.color}44`,animation:"float 3s ease infinite"}}>{level}</div>
          </div>
          <div style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#475569",marginBottom:3}}><span>EXP</span><span>{xp}/{xpN}</span></div><div style={{height:7,background:"rgba(255,255,255,.05)",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${(xp/xpN)*100}%`,background:"linear-gradient(90deg,#1e40af,#3b82f6)",borderRadius:4,boxShadow:"0 0 12px rgba(59,130,246,.4)",transition:"width .6s ease"}}/></div></div>
          <StatBar label="STR" value={stats.STR} color="#ef4444"/><StatBar label="VIT" value={stats.VIT} color="#22c55e"/><StatBar label="AGI" value={stats.AGI} color="#eab308"/><StatBar label="INT" value={stats.INT} color="#3b82f6"/><StatBar label="PER" value={stats.PER} color="#a855f7"/>
          <div style={{display:"flex",gap:8,marginTop:10,paddingTop:8,borderTop:"1px solid rgba(255,255,255,.04)",flexWrap:"wrap",fontSize:9,color:"#475569"}}>
            <span>🔥<span style={{color:"#f59e0b"}}>{streak}</span></span><span>⚔️<span style={{color:"#94a3b8"}}>{qC}</span></span><span>✦<span style={{color:"#93c5fd"}}>{totalXp}</span></span><span>⚖️<span style={{color:"#22c55e"}}>{latestW.weight}kg</span></span><span>📚<span style={{color:"#a78bfa"}}>W{curWk+1}</span></span><span>⚡<span style={{color:"#fbbf24"}}>{getMultiplier()}x</span></span>
          </div>
        </div>

        {/* TABS */}
        <div style={{display:"flex",gap:2,marginBottom:12,overflowX:"auto",paddingBottom:2}}>
          {tabs.map(t=>(<button key={t.k} onClick={()=>setTab(t.k)} style={{flex:"0 0 auto",padding:"6px 8px",background:tab===t.k?"rgba(59,130,246,.12)":"rgba(255,255,255,.02)",border:tab===t.k?"1px solid rgba(59,130,246,.3)":"1px solid rgba(255,255,255,.05)",borderRadius:6,color:tab===t.k?"#93c5fd":"#475569",fontSize:8,cursor:"pointer",textAlign:"center",minWidth:44}}><div style={{fontSize:14}}>{t.i}</div><div style={{marginTop:1,letterSpacing:.3}}>{t.l}</div></button>))}
        </div>

        {/* VACATION / WEEKEND BANNER */}
        {vacation&&(
          <div style={{background:"linear-gradient(135deg,rgba(245,158,11,.1),rgba(245,158,11,.04))",border:"1px solid rgba(245,158,11,.3)",borderRadius:8,padding:"10px 14px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:11,color:"#fbbf24"}}>🏖️ VACATION MODE</div><div style={{fontSize:9,color:"#92400e",marginTop:2}}>Penalties paused · Streak preserved</div></div>
            <button onClick={()=>{update({vacation:false});setNotif("⚔️ Back to the grind, Hunter!");}} style={{padding:"6px 12px",background:"rgba(34,197,94,.15)",border:"1px solid rgba(34,197,94,.3)",borderRadius:6,color:"#86efac",fontSize:9,cursor:"pointer",fontFamily:"'Courier New',monospace"}}>END</button>
          </div>
        )}
        {!vacation&&(new Date().getDay()===0||new Date().getDay()===6)&&(
          <div style={{background:"rgba(168,85,247,.06)",border:"1px solid rgba(168,85,247,.15)",borderRadius:8,padding:"8px 14px",marginBottom:10,textAlign:"center"}}>
            <div style={{fontSize:10,color:"#c084fc"}}>🌙 Weekend — no penalties today</div>
            <div style={{fontSize:8,color:"#475569",marginTop:2}}>You can still complete tasks for bonus XP</div>
          </div>
        )}
        {!vacation&&!(new Date().getDay()===0||new Date().getDay()===6)&&(
          <button onClick={()=>{update({vacation:true});setNotif("🏖️ Vacation mode ON — enjoy your rest, Hunter!");}} style={{width:"100%",padding:"6px",marginBottom:10,background:"rgba(245,158,11,.04)",border:"1px solid rgba(245,158,11,.1)",borderRadius:6,color:"#92400e",fontSize:8,cursor:"pointer",fontFamily:"'Courier New',monospace",textAlign:"center"}}>🏖️ Tap to enable vacation mode</button>
        )}

        {/* ===== QUESTS ===== */}
        {tab==="quests"&&(<div>
          {/* MORNING CHECK-IN BANNER */}
          {(()=>{
            const todayKey=new Date().toISOString().slice(0,10);
            const sleepDone=sleepLog.some(s=>s.date===todayKey);
            const isThu=new Date().getDay()===4;
            const thisWk=currentWeekId;
            const weightDone=weightLog.some(w=>{
              if(!w.date||w.date==="Start")return false;
              const parts=w.date.split(/[\/.\-]/);if(parts.length<3)return false;
              let dt;if(parts[2].length===4)dt=new Date(parts[2],parts[1]-1,parts[0]);else dt=new Date(w.date);
              if(isNaN(dt))return false;return getWeekId(dt)===thisWk;
            });
            if(sleepDone&&(!isThu||weightDone))return null;
            return(<div style={{background:"linear-gradient(135deg,rgba(99,102,241,.1),rgba(168,85,247,.05))",border:"1px solid rgba(99,102,241,.3)",borderRadius:8,padding:"10px 12px",marginBottom:12}}>
              <div style={{fontSize:9,color:"#a5b4fc",letterSpacing:2,marginBottom:8}}>▸ MORNING CHECK-IN</div>
              {!sleepDone&&<button onClick={()=>setShowSleepPrompt(true)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",marginBottom:6,background:"rgba(99,102,241,.1)",border:"1px solid rgba(99,102,241,.3)",borderRadius:7,cursor:"pointer",textAlign:"left",color:"inherit",fontFamily:"inherit"}}>
                <span style={{fontSize:20}}>😴</span>
                <div style={{flex:1}}><div style={{fontSize:12,color:"#e2e8f0",fontWeight:600}}>Log Last Night's Sleep</div><div style={{fontSize:9,color:"#a5b4fc",marginTop:1}}>Tap to log · +5 XP</div></div>
                <span style={{fontSize:16,color:"#a5b4fc"}}>›</span>
              </button>}
              {isThu&&!weightDone&&<button onClick={()=>setShowWeightPrompt(true)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.3)",borderRadius:7,cursor:"pointer",textAlign:"left",color:"inherit",fontFamily:"inherit"}}>
                <span style={{fontSize:20}}>⚖️</span>
                <div style={{flex:1}}><div style={{fontSize:12,color:"#e2e8f0",fontWeight:600}}>Thursday Weigh-In</div><div style={{fontSize:9,color:"#86efac",marginTop:1}}>Weekly Fitdays scan · tap to log</div></div>
                <span style={{fontSize:16,color:"#86efac"}}>›</span>
              </button>}
            </div>);
          })()}
          <div style={{background:allD?"linear-gradient(135deg,rgba(34,197,94,.08),rgba(34,197,94,.02))":"rgba(255,255,255,.02)",border:allD?"1px solid rgba(34,197,94,.3)":"1px solid rgba(255,255,255,.05)",borderRadius:8,padding:"10px 14px",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:10,color:"#94a3b8",letterSpacing:1}}>DAILY</div><div style={{fontSize:9,color:allD?"#22c55e":"#475569",marginTop:2}}>{allD?"✦ ALL COMPLETE":`${PENALIZABLE_DAILY.filter(q=>done.includes(q.id)).length}/${PENALIZABLE_DAILY.length} penalizable`}</div></div>
              <div style={{fontSize:8,color:"#475569",textAlign:"right"}}>Auto-reset</div>
            </div>
            {(()=>{
              const todayPPL=PPL[new Date().getDay()];
              const missedQ=PENALIZABLE_DAILY.filter(q=>!done.includes(q.id)).reduce((s,q)=>s+q.xp,0);
              const missedEx=(todayPPL&&todayPPL.type!=="REST")?todayPPL.exercises.filter(ex=>!doneEx.includes(ex.name)).length*10:0;
              const missedLesson=dailyLessonDone?0:45;
              const totalRisk=missedQ+missedEx+missedLesson;
              if(totalRisk>0)return(<div style={{marginTop:6,padding:"6px 8px",background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.12)",borderRadius:5,fontSize:8,color:"#f87171",lineHeight:1.6}}>
                ⚠️ At risk: <span style={{color:"#ef4444",fontWeight:700}}>-{totalRisk} XP</span> if not completed
                {missedQ>0&&<span> · Quests: -{missedQ}</span>}
                {missedEx>0&&<span> · Training: -{missedEx}</span>}
                {missedLesson>0&&<span> · Lesson: -{missedLesson}</span>}
              </div>);
              return null;
            })()}
          </div>
          <div style={{fontSize:9,color:"#334155",letterSpacing:2,marginBottom:6}}>▸ DAILY TRAINING</div>
          {DAILY_Q.map(q=>(<button key={q.id} onClick={()=>toggleQ(q.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",marginBottom:4,background:done.includes(q.id)?"rgba(59,130,246,.08)":"rgba(255,255,255,.02)",border:done.includes(q.id)?"1px solid rgba(59,130,246,.3)":"1px solid rgba(255,255,255,.06)",borderRadius:7,cursor:"pointer",textAlign:"left",color:"inherit",fontFamily:"inherit"}}><div style={{width:20,height:20,borderRadius:4,border:done.includes(q.id)?"2px solid #3b82f6":"2px solid rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:done.includes(q.id)?"rgba(59,130,246,.15)":"transparent"}}>{done.includes(q.id)&&<span style={{color:"#3b82f6",fontSize:12}}>✓</span>}</div><span style={{fontSize:16,flexShrink:0}}>{q.icon}</span><div style={{flex:1}}><div style={{fontSize:12,color:done.includes(q.id)?"#64748b":"#e2e8f0",textDecoration:done.includes(q.id)?"line-through":"none"}}>{q.label}</div><div style={{fontSize:9,color:"#475569",marginTop:1}}>+{q.xp}XP · {q.stat}</div></div></button>))}
          <div style={{fontSize:9,color:"#334155",letterSpacing:2,marginTop:14,marginBottom:6}}>▸ BONUS</div>
          {BONUS_Q.map(q=>(<button key={q.id} onClick={()=>toggleQ(q.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",marginBottom:4,background:done.includes(q.id)?"rgba(59,130,246,.08)":"rgba(255,255,255,.02)",border:done.includes(q.id)?"1px solid rgba(59,130,246,.3)":"1px solid rgba(255,255,255,.06)",borderRadius:7,cursor:"pointer",textAlign:"left",color:"inherit",fontFamily:"inherit"}}><div style={{width:20,height:20,borderRadius:4,border:done.includes(q.id)?"2px solid #3b82f6":"2px solid rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:done.includes(q.id)?"rgba(59,130,246,.15)":"transparent"}}>{done.includes(q.id)&&<span style={{color:"#3b82f6",fontSize:12}}>✓</span>}</div><span style={{fontSize:16,flexShrink:0}}>{q.icon}</span><div style={{flex:1}}><div style={{fontSize:12,color:done.includes(q.id)?"#64748b":"#e2e8f0",textDecoration:done.includes(q.id)?"line-through":"none"}}>{q.label}</div><div style={{fontSize:9,color:"#475569",marginTop:1}}>+{q.xp}XP · {q.stat}</div></div></button>))}
          <div style={{fontSize:9,color:"#334155",letterSpacing:2,marginTop:14,marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span>▸ WEEKLY ({wC}/{WEEKLY_OBJ.length})</span>
              <span style={{fontSize:7,color:wC===WEEKLY_OBJ.length?"#22c55e":"#ef4444"}}>{wC===WEEKLY_OBJ.length?"✓ ALL DONE":`⚠️ -${WEEKLY_OBJ.filter(q=>!doneW.includes(q.id)).reduce((s,q)=>s+q.xp,0)}XP if missed`}</span>
            </div>
            <div style={{fontSize:7,color:"#334155",marginTop:2}}>Auto-resets every Monday</div>
          </div>
          {WEEKLY_OBJ.map(q=>(<button key={q.id} onClick={()=>toggleW(q.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",marginBottom:4,background:doneW.includes(q.id)?"rgba(168,85,247,.08)":"rgba(255,255,255,.02)",border:doneW.includes(q.id)?"1px solid rgba(168,85,247,.3)":"1px solid rgba(255,255,255,.06)",borderRadius:7,cursor:"pointer",textAlign:"left",color:"inherit",fontFamily:"inherit"}}><div style={{width:20,height:20,borderRadius:4,border:doneW.includes(q.id)?"2px solid #a855f7":"2px solid rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:doneW.includes(q.id)?"rgba(168,85,247,.15)":"transparent"}}>{doneW.includes(q.id)&&<span style={{color:"#a855f7",fontSize:12}}>✓</span>}</div><span style={{fontSize:16,flexShrink:0}}>{q.icon}</span><div style={{flex:1}}><div style={{fontSize:12,color:doneW.includes(q.id)?"#64748b":"#e2e8f0",textDecoration:doneW.includes(q.id)?"line-through":"none"}}>{q.label}</div><div style={{fontSize:9,color:"#475569",marginTop:1}}>+{q.xp}XP · {q.stat} · WEEKLY</div></div></button>))}

          {/* PENALTY LOG */}
          {penaltyLog.length>0&&(<div style={{marginTop:14}}>
            <div style={{fontSize:9,color:"#ef4444",letterSpacing:2,marginBottom:6}}>▸ PENALTY HISTORY</div>
            {penaltyLog.slice().reverse().slice(0,5).map((p,i)=>(<div key={i} style={{padding:"6px 10px",marginBottom:2,background:"rgba(239,68,68,.04)",border:"1px solid rgba(239,68,68,.1)",borderRadius:4,fontSize:10}}>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"#94a3b8"}}>{p.date}</span><span style={{color:"#ef4444",fontWeight:700}}>-{p.penalty} XP</span></div>
              {p.details&&<div style={{fontSize:8,color:"#6b7280",marginTop:2}}>{p.details}</div>}
            </div>))}
          </div>)}
        </div>)}

        {/* ===== PPL ===== */}
        {tab==="training"&&(<div>
          <div style={{display:"flex",gap:3,marginBottom:14}}>
            {[1,2,3,4,5,6,0].map(d=>{const p=PPL[d];const iS=d===selPPL;const iT=d===new Date().getDay();return(<button key={d} onClick={()=>setSelPPL(d)} style={{flex:1,padding:"7px 2px",borderRadius:5,cursor:"pointer",background:iS?`${p.color}18`:"rgba(255,255,255,.02)",border:iS?`1px solid ${p.color}55`:iT?"1px solid rgba(59,130,246,.2)":"1px solid rgba(255,255,255,.04)",color:iS?p.color:"#475569",fontSize:8,textAlign:"center"}}><div>{DOW[d]}</div><div style={{fontSize:6,marginTop:1}}>{p.type}</div></button>);})}
          </div>
          <div style={{background:"linear-gradient(135deg,rgba(15,23,42,.9),rgba(30,41,59,.6))",border:`1px solid ${vPPL.color}33`,borderRadius:10,padding:14}}>
            <div style={{fontSize:16,fontWeight:900,color:vPPL.color,fontFamily:"'Georgia',serif",marginBottom:2}}>{vPPL.icon} {vPPL.type} DAY</div>
            <div style={{fontSize:9,color:"#475569",marginBottom:12}}>{vPPL.day}</div>
            {vPPL.type==="REST"?<div style={{textAlign:"center",padding:"16px 0",color:"#334155",fontSize:11}}>Recovery day. Rest well, Hunter.</div>
            :vPPL.exercises.map((origEx,i)=>{
              // Apply swap if user swapped this exercise today
              const swapKey=`${todayStr}_${origEx.name}`;
              const swappedName=exerciseSwaps[swapKey];
              const ex=swappedName?{...origEx,name:swappedName,_original:origEx.name,_swapped:true}:origEx;
              const dn=doneEx.includes(ex.name);const isExp=expandedLesson===`ex-${selPPL}-${i}`;const isEditing=editingEx===`${selPPL}-${i}`;const lastSess=getLastSession(ex.name);
              // Parse number of sets from ex.sets like "4×8-10"
              const numSets=parseInt(ex.sets.match(/(\d+)[×x]/)?.[1])||4;
              const hasAlts=EXERCISE_ALTERNATIVES[origEx.name];
              return(<div key={i}>
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 10px",marginBottom:2,background:dn?`${vPPL.color}10`:"rgba(255,255,255,.02)",border:dn?`1px solid ${vPPL.color}33`:"1px solid rgba(255,255,255,.04)",borderRadius:6}}>
                  <div style={{width:16,height:16,borderRadius:3,flexShrink:0,border:dn?`2px solid ${vPPL.color}`:"2px solid rgba(255,255,255,.12)",background:dn?`${vPPL.color}22`:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>{dn&&<span style={{color:vPPL.color,fontSize:9}}>✓</span>}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:dn?"#64748b":"#e2e8f0",textDecoration:dn?"line-through":"none"}}>{ex.name}{ex._swapped&&<span style={{fontSize:7,color:"#a78bfa",marginLeft:5}}>🔄 swapped</span>}</div>
                    <div style={{fontSize:9,color:"#334155"}}>{ex.muscle}{ex._swapped&&<span style={{color:"#475569"}}> · was {ex._original}</span>}</div>
                    {lastSess&&!isEditing&&<div style={{fontSize:8,color:"#475569",marginTop:2}}>Last: {lastSess.sets.map((s,si)=>`${s.kg}kg×${s.reps}`).join(" · ")}</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
                    <div style={{fontSize:10,color:"#475569"}}>{ex.sets}</div>
                    {!dn&&<div style={{display:"flex",gap:6}}>
                      {ex._swapped&&<button onClick={()=>{const sw={...exerciseSwaps};delete sw[swapKey];update({exerciseSwaps:sw});setNotif(`↩️ Reverted to ${origEx.name}`);}} style={{fontSize:8,color:"#64748b",background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"'Courier New',monospace"}}>↩️ Undo</button>}
                      {hasAlts&&!ex._swapped&&<button onClick={()=>setSwapModal(origEx.name)} style={{fontSize:8,color:"#a78bfa",background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"'Courier New',monospace"}}>🔄 Swap</button>}
                      <button onClick={()=>setEditingEx(isEditing?null:`${selPPL}-${i}`)} style={{fontSize:8,color:vPPL.color,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"'Courier New',monospace"}}>{isEditing?"▾ Close":"▸ Log sets"}</button>
                    </div>}
                  </div>
                </div>

                {/* SET LOGGING UI - stable component to avoid reset bug */}
                {isEditing&&<SetLogger
                  key={`setlogger-${selPPL}-${i}-${ex.name}`}
                  exName={ex.name}
                  numSets={numSets}
                  lastSess={lastSess}
                  color={vPPL.color}
                  getRecommendation={getRecommendation}
                  onLog={(setsData)=>logExerciseSets(ex.name,setsData)}
                  onSetLogged={(setNum)=>{if(ex.rest)startRest(ex.name,setNum,ex.rest,vPPL.color);}}
                />}

                <button onClick={(e)=>{e.stopPropagation();setExpandedLesson(isExp?null:`ex-${selPPL}-${i}`);}} style={{width:"100%",padding:"4px 10px",marginBottom:4,background:"none",border:"none",color:"#3b82f6",fontSize:9,cursor:"pointer",textAlign:"left",fontFamily:"'Courier New',monospace"}}>{isExp?"▾ Hide guide":"▸ How to perform"}</button>
                {isExp&&<div style={{padding:"8px 12px",marginBottom:6,background:"rgba(59,130,246,.04)",border:"1px solid rgba(59,130,246,.1)",borderRadius:6,fontSize:11,color:"#94a3b8",lineHeight:1.5}}>{ex.desc}</div>}
              </div>);})}
            {vPPL.type!=="REST"&&<div style={{marginTop:8,padding:"7px 10px",borderRadius:5,background:"rgba(59,130,246,.06)",border:"1px solid rgba(59,130,246,.1)",fontSize:9,color:"#64748b",textAlign:"center"}}>🏃 + 30 MIN CARDIO after session</div>}
          </div>

          {/* MUSCLE RANKINGS */}
          <div style={{marginTop:14}}>
            <div style={{fontSize:9,color:"#334155",letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>▸ MUSCLE RANKINGS</div>
            <div style={{background:"linear-gradient(135deg,rgba(15,23,42,.9),rgba(30,41,59,.6))",border:"1px solid rgba(255,255,255,.08)",borderRadius:10,padding:14}}>
              {MUSCLE_GROUPS.map(mg=>{
                const mxp=muscleXp[mg.key]||0;
                const rank=getMuscleRank(mxp);
                const next=getNextMuscleRank(mxp);
                const pct=next?((mxp-rank.min)/(next.min-rank.min))*100:100;
                return(<div key={mg.key} style={{marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <span style={{fontSize:14,width:20,textAlign:"center"}}>{mg.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:11,color:"#e2e8f0"}}>{mg.name}</span>
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          <span style={{fontSize:9,color:rank.color,fontWeight:700,letterSpacing:.5}}>{rank.name}</span>
                          <span style={{fontSize:8,color:"#475569"}}>{mxp}xp</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{marginLeft:28,height:4,background:"rgba(255,255,255,.05)",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${rank.color},${rank.color}88)`,borderRadius:2,transition:"width .4s ease"}}/>
                  </div>
                  {next&&<div style={{marginLeft:28,fontSize:7,color:"#334155",marginTop:2}}>Next: {next.name} at {next.min}xp</div>}
                </div>);
              })}
            </div>

            {/* RANK LEGEND */}
            <div style={{marginTop:10,padding:"8px 12px",background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.04)",borderRadius:6}}>
              <div style={{fontSize:8,color:"#334155",letterSpacing:1,marginBottom:6}}>RANK TIERS</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {MUSCLE_RANKS.map(r=>(<div key={r.name} style={{fontSize:8,color:r.color,padding:"2px 6px",background:`${r.color}12`,border:`1px solid ${r.color}33`,borderRadius:3}}>{r.name}</div>))}
              </div>
            </div>
          </div>
        </div>)}

        {/* ===== LEARN ===== */}
        {tab==="learn"&&(<div>
          <div style={{background:"linear-gradient(135deg,rgba(168,85,247,.08),rgba(59,130,246,.05))",border:"1px solid rgba(168,85,247,.2)",borderRadius:8,padding:"10px 14px",marginBottom:12}}>
            <div style={{fontSize:10,color:"#c084fc",letterSpacing:1,marginBottom:3}}>🤖 CLAUDE MASTERY PATH</div>
            <div style={{fontSize:9,color:"#475569"}}>{tLC}/56 lessons · Week {curWk+1}/8</div>
            <div style={{height:5,background:"rgba(255,255,255,.05)",borderRadius:3,marginTop:6,overflow:"hidden"}}><div style={{height:"100%",width:`${(tLC/56)*100}%`,background:"linear-gradient(90deg,#7c3aed,#3b82f6)",borderRadius:3,transition:"width .6s ease"}}/></div>
          </div>
          <div style={{display:"flex",gap:3,marginBottom:12,flexWrap:"wrap"}}>
            {LP.map((w,i)=>{const wd=w.lessons.every((_,di)=>doneLessons.includes(`${i}-${di}`));return(<button key={i} onClick={()=>setLW(i)} style={{flex:"1 0 auto",minWidth:38,padding:"5px 3px",borderRadius:5,cursor:"pointer",background:lW===i?`${w.color}18`:"rgba(255,255,255,.02)",border:lW===i?`1px solid ${w.color}55`:"1px solid rgba(255,255,255,.04)",color:lW===i?w.color:"#475569",fontSize:8,textAlign:"center"}}><div>{wd?"✓":`W${i+1}`}</div></button>);})}
          </div>
          <div style={{background:"linear-gradient(135deg,rgba(15,23,42,.9),rgba(30,41,59,.6))",border:`1px solid ${LP[lW].color}33`,borderRadius:10,padding:14}}>
            <div style={{fontSize:14,fontWeight:900,color:LP[lW].color,fontFamily:"'Georgia',serif",marginBottom:3}}>{LP[lW].title}</div>
            <div style={{fontSize:9,color:"#475569",marginBottom:12}}>{LP[lW].lessons.filter((_,di)=>doneLessons.includes(`${lW}-${di}`)).length}/7 lessons</div>
            {LP[lW].lessons.map((ls,di)=>{const k=`${lW}-${di}`;const dn=doneLessons.includes(k);const isExp=expandedLesson===k;const col=LP[lW].color;
              return(<div key={di} style={{marginBottom:4}}>
                <button onClick={()=>setExpandedLesson(isExp?null:k)} style={{display:"flex",alignItems:"flex-start",gap:8,width:"100%",padding:"10px 10px",background:dn?`${col}10`:"rgba(255,255,255,.02)",border:dn?`1px solid ${col}33`:"1px solid rgba(255,255,255,.04)",borderRadius:6,cursor:"pointer",textAlign:"left",color:"inherit",fontFamily:"inherit"}}>
                  <div style={{width:18,height:18,borderRadius:9,flexShrink:0,border:dn?`2px solid ${col}`:"2px solid rgba(255,255,255,.12)",background:dn?`${col}22`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>{dn?<span style={{color:col,fontSize:9}}>✓</span>:<span style={{color:"#334155",fontSize:8}}>{di+1}</span>}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:dn?"#64748b":"#e2e8f0",fontWeight:600}}>{ls.title}</div>
                    <div style={{fontSize:9,color:"#334155",marginTop:2}}>{ls.desc}</div>
                    <div style={{fontSize:8,color:col,marginTop:3}}>{isExp?"▾ Tap to collapse":"▸ Tap to read full lesson"} · +45 XP</div>
                  </div>
                </button>
                {isExp&&(<div style={{padding:"12px",marginTop:2,marginBottom:4,background:`${col}08`,border:`1px solid ${col}22`,borderRadius:6}}>
                  <div style={{fontSize:11,color:"#c8d6e5",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{ls.full}</div>
                  {!dn&&<button onClick={()=>completeL(lW,di)} style={{marginTop:10,width:"100%",padding:"10px",background:`${col}20`,border:`1px solid ${col}44`,borderRadius:6,color:col,fontSize:11,cursor:"pointer",fontFamily:"'Courier New',monospace",letterSpacing:1}}>✓ MARK LESSON COMPLETE (+45 XP)</button>}
                  {dn&&<div style={{marginTop:8,textAlign:"center",fontSize:10,color:"#22c55e"}}>✓ Lesson completed</div>}
                </div>)}
              </div>);
            })}
          </div>
        </div>)}

        {/* ===== LIFE ===== */}
        {tab==="life"&&(<div>
          {getTodayLearning()&&(<div>
            <div style={{fontSize:9,color:"#334155",letterSpacing:2,marginBottom:6}}>▸ TODAY'S LEARNING FOCUS</div>
            <div style={{background:"linear-gradient(135deg,rgba(59,130,246,.06),rgba(168,85,247,.04))",border:"1px solid rgba(59,130,246,.15)",borderRadius:8,padding:"8px 12px",marginBottom:10}}>
              <div style={{fontSize:8,color:"#3b82f6",marginBottom:4}}>📅 Rotation: Mon=📖 Tue=🤖 Wed=🗣️ Thu=📖 Fri=🤖</div>
            </div>
            {(()=>{const q=getTodayLearning();return(<button key={q.id} onClick={()=>toggleQ(q.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",marginBottom:4,background:done.includes(q.id)?"rgba(59,130,246,.08)":"rgba(255,255,255,.02)",border:done.includes(q.id)?"1px solid rgba(59,130,246,.3)":"1px solid rgba(255,255,255,.06)",borderRadius:7,cursor:"pointer",textAlign:"left",color:"inherit",fontFamily:"inherit"}}><div style={{width:20,height:20,borderRadius:4,border:done.includes(q.id)?"2px solid #3b82f6":"2px solid rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:done.includes(q.id)?"rgba(59,130,246,.15)":"transparent"}}>{done.includes(q.id)&&<span style={{color:"#3b82f6",fontSize:12}}>✓</span>}</div><span style={{fontSize:16,flexShrink:0}}>{q.icon}</span><div style={{flex:1}}><div style={{fontSize:12,color:done.includes(q.id)?"#64748b":"#e2e8f0",textDecoration:done.includes(q.id)?"line-through":"none"}}>{q.label}</div>{q.desc&&<div style={{fontSize:9,color:"#334155",marginTop:1}}>{q.desc}</div>}<div style={{fontSize:9,color:"#475569",marginTop:1}}>+{q.xp}XP · {q.stat} · ⚠️ PENALIZED</div></div></button>);})()}
          </div>)}
          <div style={{fontSize:9,color:"#334155",letterSpacing:2,marginTop:12,marginBottom:6}}>▸ DAILY HABITS</div>
          {LIFE_Q_FIXED.map(q=>(<button key={q.id} onClick={()=>toggleQ(q.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",marginBottom:4,background:done.includes(q.id)?"rgba(59,130,246,.08)":"rgba(255,255,255,.02)",border:done.includes(q.id)?"1px solid rgba(59,130,246,.3)":"1px solid rgba(255,255,255,.06)",borderRadius:7,cursor:"pointer",textAlign:"left",color:"inherit",fontFamily:"inherit"}}><div style={{width:20,height:20,borderRadius:4,border:done.includes(q.id)?"2px solid #3b82f6":"2px solid rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:done.includes(q.id)?"rgba(59,130,246,.15)":"transparent"}}>{done.includes(q.id)&&<span style={{color:"#3b82f6",fontSize:12}}>✓</span>}</div><span style={{fontSize:16,flexShrink:0}}>{q.icon}</span><div style={{flex:1}}><div style={{fontSize:12,color:done.includes(q.id)?"#64748b":"#e2e8f0",textDecoration:done.includes(q.id)?"line-through":"none"}}>{q.label}</div>{q.desc&&<div style={{fontSize:9,color:"#334155",marginTop:1}}>{q.desc}</div>}<div style={{fontSize:9,color:"#475569",marginTop:1}}>+{q.xp}XP · {q.stat} · ⚠️ PENALIZED</div></div></button>))}

          {/* BOOK TRACKER */}
          <div style={{fontSize:9,color:"#334155",letterSpacing:2,marginTop:16,marginBottom:8,textTransform:"uppercase"}}>▸ TODAY'S PODCAST</div>
          {(()=>{
            const todayPod = PODCAST_SCHEDULE[new Date().getDay()];
            return(<div style={{background:"linear-gradient(135deg,rgba(168,85,247,.06),rgba(59,130,246,.04))",border:"1px solid rgba(168,85,247,.15)",borderRadius:8,padding:14,marginBottom:16}}>
              <div style={{fontSize:8,color:"#a78bfa",letterSpacing:1,marginBottom:6}}>{todayPod.cat.toUpperCase()} DAY</div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{fontSize:28}}>🎧</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,color:"#e2e8f0",fontWeight:700}}>{todayPod.pick}</div>
                  <div style={{fontSize:10,color:"#94a3b8",marginTop:2,lineHeight:1.4}}>{todayPod.desc}</div>
                </div>
              </div>
              <a href={todayPod.url} target="_blank" rel="noopener noreferrer" style={{
                display:"block",width:"100%",padding:"10px",textAlign:"center",
                background:"linear-gradient(135deg,rgba(239,68,68,.15),rgba(239,68,68,.08))",
                border:"1px solid rgba(239,68,68,.3)",borderRadius:6,
                color:"#fca5a5",fontSize:11,textDecoration:"none",
                fontFamily:"'Courier New',monospace",letterSpacing:1,
              }}>▶ OPEN ON YOUTUBE</a>
              <div style={{marginTop:10}}>
                <div style={{fontSize:8,color:"#475569",marginBottom:4}}>Or try these alternatives:</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {todayPod.alt.map((a,i)=>(
                    <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" style={{
                      flex:1,padding:"7px 6px",textAlign:"center",
                      background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:5,
                      color:"#94a3b8",fontSize:9,textDecoration:"none",
                      fontFamily:"'Courier New',monospace",
                    }}>{a.name}</a>
                  ))}
                </div>
              </div>
              <div style={{marginTop:8,fontSize:7,color:"#334155",textAlign:"center"}}>
                Schedule: Mon=Investing · Tue=AI · Wed=Mindset · Thu=Training · Fri=Sales · Sat=Trends · Sun=Business
              </div>
            </div>);
          })()}

          <div style={{fontSize:9,color:"#334155",letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>▸ NOTES</div>
          <div style={{padding:"10px 12px",background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:7,fontSize:9,color:"#64748b",lineHeight:1.5}}>
            Book tracker removed in v3.1. Focus on AI lessons + Podcast + Mobility.
          </div>
        </div>)}

        {/* ===== SOCIAL ===== */}
        {/* SOCIAL tab removed in v3.1 */}

        {/* ===== BOSS FIGHTS ===== */}
        {tab==="boss"&&(<div>
          {activeBoss?(()=>{
            const progress=checkBossProgress();
            const daysLeft=Math.max(0,activeBoss.durationDays-Math.floor((Date.now()-new Date(activeBoss.acceptedDate).getTime())/86400000));
            const isWon=progress>=100;
            return(<div style={{background:`linear-gradient(135deg,rgba(168,85,247,.15),rgba(127,29,29,.1))`,border:"2px solid rgba(168,85,247,.4)",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{textAlign:"center",marginBottom:10}}>
                <div style={{fontSize:48}}>{activeBoss.emoji}</div>
                <div style={{fontSize:9,color:"#c084fc",letterSpacing:2,marginTop:4}}>⚔️ ACTIVE BOSS</div>
                <div style={{fontSize:16,color:"#fff",fontWeight:700,marginTop:2}}>{activeBoss.name}</div>
                <div style={{fontSize:9,color:"#a78bfa",marginTop:2,fontStyle:"italic"}}>"{activeBoss.theme}"</div>
              </div>
              <div style={{padding:"8px 12px",background:"rgba(0,0,0,.3)",borderRadius:6,marginBottom:10}}>
                <div style={{fontSize:9,color:"#cbd5e1"}}>{activeBoss.lore}</div>
              </div>
              <div style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#94a3b8",marginBottom:4}}>
                  <span>BOSS HP</span>
                  <span style={{color:isWon?"#22c55e":"#ef4444",fontWeight:700}}>{Math.round(100-progress)}% remaining</span>
                </div>
                <div style={{height:14,background:"rgba(0,0,0,.5)",borderRadius:7,overflow:"hidden",border:"1px solid rgba(255,255,255,.1)"}}>
                  <div style={{height:"100%",width:`${100-progress}%`,background:isWon?"linear-gradient(90deg,#22c55e,#16a34a)":"linear-gradient(90deg,#ef4444,#7f1d1d)",transition:"width .5s ease"}}/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:9}}>
                <div style={{padding:"6px 8px",background:"rgba(0,0,0,.3)",borderRadius:5}}>
                  <div style={{color:"#94a3b8",letterSpacing:1}}>OBJECTIVE</div>
                  <div style={{color:"#fff",marginTop:2,fontSize:10}}>
                    {activeBoss.target.type==="lift"&&`${activeBoss.target.exercise} ${activeBoss.target.kg}kg × ${activeBoss.target.reps}`}
                    {activeBoss.target.type==="streak"&&`${activeBoss.target.days} day streak`}
                    {activeBoss.target.type==="muscleXp"&&`${activeBoss.target.muscle} ${activeBoss.target.amount}+ XP`}
                    {activeBoss.target.type==="deload"&&`${activeBoss.target.days} deload days`}
                  </div>
                </div>
                <div style={{padding:"6px 8px",background:"rgba(0,0,0,.3)",borderRadius:5}}>
                  <div style={{color:"#94a3b8",letterSpacing:1}}>TIME LEFT</div>
                  <div style={{color:daysLeft<=3?"#ef4444":"#fff",marginTop:2,fontSize:10,fontWeight:700}}>{daysLeft} days</div>
                </div>
              </div>
              <div style={{marginTop:8,padding:"6px 8px",background:"rgba(34,197,94,.1)",borderRadius:5,fontSize:9,color:"#86efac",textAlign:"center"}}>
                🏆 Reward: +{activeBoss.reward.xp} XP · "{activeBoss.reward.badge}" badge
              </div>
              <button onClick={()=>{if(confirm("Abandon this boss? No penalty."))cancelBoss();}} style={{width:"100%",marginTop:10,padding:"8px",background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",borderRadius:6,color:"#fca5a5",fontSize:10,cursor:"pointer",fontFamily:"inherit",letterSpacing:1}}>ABANDON QUEST</button>
            </div>);
          })():(<div>
            <div style={{padding:"12px 14px",background:"linear-gradient(135deg,rgba(168,85,247,.08),rgba(59,130,246,.05))",border:"1px solid rgba(168,85,247,.2)",borderRadius:8,marginBottom:12}}>
              <div style={{fontSize:11,color:"#c4b5fd",letterSpacing:1,marginBottom:4,fontWeight:700}}>👹 BOSS FIGHTS</div>
              <div style={{fontSize:9,color:"#94a3b8",lineHeight:1.5}}>Accept a challenge to push past your limits. Win = badge + bonus XP. Lose = no penalty.</div>
            </div>
            <div style={{fontSize:9,color:"#334155",letterSpacing:2,marginBottom:8}}>▸ AVAILABLE BOSSES</div>
            {BOSS_LIBRARY.map(b=>{
              const wonBefore=bossHistory.some(h=>h.id===b.id&&h.result==="victory");
              return(<div key={b.id} style={{padding:"10px 12px",background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.08)",borderRadius:7,marginBottom:8,opacity:wonBefore?.5:1}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                  <div style={{fontSize:32}}>{b.emoji}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:"#e2e8f0",fontWeight:700}}>{b.name}{wonBefore&&<span style={{fontSize:9,color:"#22c55e",marginLeft:6}}>✓ DEFEATED</span>}</div>
                    <div style={{fontSize:8,color:"#a78bfa",fontStyle:"italic",marginTop:1}}>"{b.theme}"</div>
                    <div style={{fontSize:9,color:"#94a3b8",marginTop:4}}>{b.description}</div>
                    <div style={{display:"flex",gap:8,marginTop:6,fontSize:8,color:"#64748b"}}>
                      <span>⏰ {b.durationDays}d</span>
                      <span>🏆 +{b.reward.xp} XP</span>
                      <span>🎖️ {b.reward.badge}</span>
                    </div>
                  </div>
                </div>
                {!wonBefore&&<button onClick={()=>{if(confirm(`Accept "${b.name}"?\n\nObjective: ${b.description}\nDuration: ${b.durationDays} days\nReward: +${b.reward.xp} XP`))acceptBoss(b);}} style={{width:"100%",marginTop:8,padding:"7px",background:"linear-gradient(135deg,rgba(168,85,247,.2),rgba(59,130,246,.1))",border:"1px solid rgba(168,85,247,.4)",borderRadius:5,color:"#c4b5fd",fontSize:10,cursor:"pointer",fontFamily:"inherit",letterSpacing:1}}>⚔️ ACCEPT QUEST</button>}
              </div>);
            })}
            {bossHistory.length>0&&<>
              <div style={{fontSize:9,color:"#334155",letterSpacing:2,marginTop:14,marginBottom:8}}>▸ BATTLE HISTORY</div>
              {bossHistory.slice(-5).reverse().map((h,i)=>(<div key={i} style={{padding:"6px 10px",background:"rgba(255,255,255,.02)",borderRadius:5,marginBottom:4,fontSize:9,display:"flex",justifyContent:"space-between"}}>
                <span style={{color:"#cbd5e1"}}>{h.emoji} {h.name}</span>
                <span style={{color:h.result==="victory"?"#22c55e":"#94a3b8"}}>{h.result==="victory"?"🏆 WON":"⚪ ABANDONED"}</span>
              </div>))}
            </>}
          </div>)}
        </div>)}

        {/* ===== PROGRESS / STATS ===== */}
        {tab==="progress"&&(<div>
          <div style={{padding:"12px 14px",background:"linear-gradient(135deg,rgba(34,197,94,.08),rgba(59,130,246,.05))",border:"1px solid rgba(34,197,94,.2)",borderRadius:8,marginBottom:12}}>
            <div style={{fontSize:11,color:"#86efac",letterSpacing:1,fontWeight:700}}>📈 PROGRESS DASHBOARD</div>
            <div style={{fontSize:9,color:"#94a3b8",marginTop:2}}>Real-time charts and tracking.</div>
          </div>

          {/* WEIGHT + BODY FAT TREND */}
          {weightLog.length>1&&(()=>{
            const all=weightLog.filter(w=>w.weight);
            const weights=all.slice(-12);
            const minW=Math.floor(Math.min(...weights.map(w=>w.weight))-1);
            const maxW=Math.ceil(Math.max(...weights.map(w=>w.weight))+1);
            const range=maxW-minW||1;
            // Body fat sub-series (only where available)
            const fats=weights.map(w=>w.fat).filter(f=>f!=null);
            const minF=fats.length?Math.floor(Math.min(...fats)-1):0;
            const maxF=fats.length?Math.ceil(Math.max(...fats)+1):1;
            const rangeF=maxF-minF||1;
            const first=all[0],last=all[all.length-1];
            const totalLost=(first.weight-last.weight).toFixed(2);
            const fatChange=(first.fat!=null&&last.fat!=null)?(first.fat-last.fat).toFixed(1):null;
            const muscleChange=(first.muscle!=null&&last.muscle!=null)?(last.muscle-first.muscle).toFixed(1):null;
            return(<div style={{padding:"10px 12px",background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:7,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:9,color:"#94a3b8",letterSpacing:1}}>📉 WEIGHT & BODY FAT TREND</span>
                <span style={{fontSize:8,color:"#64748b"}}>{all.length} scans</span>
              </div>
              <div style={{position:"relative",height:130,paddingLeft:28,paddingBottom:18,paddingRight:28}}>
                <svg style={{width:"100%",height:"100%",overflow:"visible"}} viewBox="0 0 100 100" preserveAspectRatio="none">
                  {[0,25,50,75,100].map(y=>(<line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,.05)" strokeWidth="0.3"/>))}
                  {/* Weight line (green) */}
                  <polyline points={weights.map((w,i)=>`${(i/(weights.length-1||1))*100},${100-((w.weight-minW)/range)*90-5}`).join(" ")} stroke="#22c55e" strokeWidth="0.9" fill="none"/>
                  {weights.map((w,i)=>(<circle key={i} cx={(i/(weights.length-1||1))*100} cy={100-((w.weight-minW)/range)*90-5} r="1.4" fill="#22c55e"/>))}
                  {/* Body fat line (orange, dashed) */}
                  {fats.length>1&&<polyline points={weights.filter(w=>w.fat!=null).map((w,i,arr)=>{const idx=weights.indexOf(w);return `${(idx/(weights.length-1||1))*100},${100-((w.fat-minF)/rangeF)*90-5}`;}).join(" ")} stroke="#f59e0b" strokeWidth="0.7" fill="none" strokeDasharray="2,1.5"/>}
                  {weights.map((w,i)=>w.fat!=null?(<circle key={"f"+i} cx={(i/(weights.length-1||1))*100} cy={100-((w.fat-minF)/rangeF)*90-5} r="1.1" fill="#f59e0b"/>):null)}
                </svg>
                <div style={{position:"absolute",left:0,top:0,fontSize:7,color:"#22c55e"}}>{maxW}kg</div>
                <div style={{position:"absolute",left:0,bottom:18,fontSize:7,color:"#22c55e"}}>{minW}kg</div>
                {fats.length>0&&<><div style={{position:"absolute",right:0,top:0,fontSize:7,color:"#f59e0b"}}>{maxF}%</div>
                <div style={{position:"absolute",right:0,bottom:18,fontSize:7,color:"#f59e0b"}}>{minF}%</div></>}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:"#64748b",marginTop:2,marginBottom:8}}>
                <span>{weights[0].date}</span><span>{weights[weights.length-1].date}</span>
              </div>
              <div style={{display:"flex",gap:6,fontSize:8}}>
                <span style={{color:"#22c55e"}}>● Weight</span>
                {fats.length>0&&<span style={{color:"#f59e0b"}}>● Body Fat</span>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:8}}>
                <div style={{padding:"6px",background:"rgba(34,197,94,.08)",borderRadius:5,textAlign:"center"}}>
                  <div style={{fontSize:7,color:"#64748b"}}>WEIGHT</div>
                  <div style={{fontSize:13,color:"#22c55e",fontWeight:700}}>-{totalLost}</div>
                  <div style={{fontSize:7,color:"#475569"}}>kg total</div>
                </div>
                {fatChange&&<div style={{padding:"6px",background:"rgba(245,158,11,.08)",borderRadius:5,textAlign:"center"}}>
                  <div style={{fontSize:7,color:"#64748b"}}>BODY FAT</div>
                  <div style={{fontSize:13,color:"#f59e0b",fontWeight:700}}>-{fatChange}</div>
                  <div style={{fontSize:7,color:"#475569"}}>% points</div>
                </div>}
                {muscleChange&&<div style={{padding:"6px",background:"rgba(59,130,246,.08)",borderRadius:5,textAlign:"center"}}>
                  <div style={{fontSize:7,color:"#64748b"}}>MUSCLE</div>
                  <div style={{fontSize:13,color:"#3b82f6",fontWeight:700}}>{muscleChange>=0?"+":""}{muscleChange}</div>
                  <div style={{fontSize:7,color:"#475569"}}>kg lean</div>
                </div>}
              </div>
            </div>);
          })()}

          {/* MUSCLE XP DISTRIBUTION */}
          <div style={{padding:"10px 12px",background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:7,marginBottom:10}}>
            <div style={{fontSize:9,color:"#94a3b8",letterSpacing:1,marginBottom:8}}>🎯 MUSCLE XP DISTRIBUTION</div>
            {MUSCLE_GROUPS.filter(mg=>mg.key!=="cardio").sort((a,b)=>(muscleXp[b.key]||0)-(muscleXp[a.key]||0)).map(mg=>{
              const xp=muscleXp[mg.key]||0;
              const max=Math.max(...Object.values(muscleXp),50);
              const pct=(xp/max)*100;
              const isWeak=xp<50;
              return(<div key={mg.key} style={{marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:9,marginBottom:2}}>
                  <span style={{color:isWeak?"#f59e0b":"#cbd5e1"}}>{mg.icon} {mg.name}{isWeak&&<span style={{fontSize:7,marginLeft:6,color:"#f59e0b"}}>WEAK</span>}</span>
                  <span style={{color:isWeak?"#f59e0b":"#94a3b8",fontWeight:700}}>{xp} XP</span>
                </div>
                <div style={{height:6,background:"rgba(0,0,0,.3)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:isWeak?"linear-gradient(90deg,#f59e0b,#dc2626)":`linear-gradient(90deg,#3b82f6,#22c55e)`,transition:"width .4s"}}/>
                </div>
              </div>);
            })}
          </div>

          {/* HEATMAP */}
          {(()=>{
            const today=new Date();
            const cells=[];
            for(let i=29;i>=0;i--){
              const d=new Date(today);d.setDate(d.getDate()-i);
              const ks=d.toISOString().slice(0,10);
              cells.push({date:ks,count:workoutCalendar[ks]||0,dow:d.getDay(),day:d.getDate()});
            }
            const totalDays=cells.filter(c=>c.count>0).length;
            return(<div style={{padding:"10px 12px",background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:7,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:9,color:"#94a3b8",letterSpacing:1}}>📅 ACTIVITY (LAST 30 DAYS)</span>
                <span style={{fontSize:9,color:"#22c55e",fontWeight:700}}>{totalDays}/30</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(15,1fr)",gap:3}}>
                {cells.map((c,i)=>{
                  const intensity=c.count===0?(c.dow===0||c.dow===6?"rest":"miss"):c.count<=2?"light":c.count<=4?"medium":"full";
                  const bg={rest:"rgba(255,255,255,.04)",miss:"rgba(239,68,68,.2)",light:"rgba(34,197,94,.3)",medium:"rgba(34,197,94,.6)",full:"rgba(34,197,94,.9)"}[intensity];
                  return(<div key={i} title={`${c.date}: ${c.count} exercises`} style={{aspectRatio:"1",background:bg,borderRadius:2,fontSize:6,color:c.count>0?"#fff":"#475569",display:"flex",alignItems:"center",justifyContent:"center"}}>{c.day}</div>);
                })}
              </div>
            </div>);
          })()}

          {/* SLEEP TRACKER */}
          <div style={{padding:"10px 12px",background:"rgba(99,102,241,.05)",border:"1px solid rgba(99,102,241,.2)",borderRadius:7,marginBottom:10}}>
            <div style={{fontSize:9,color:"#a5b4fc",letterSpacing:1,marginBottom:8}}>😴 SLEEP TRACKER</div>
            {(()=>{
              const last7=sleepLog.slice(-7);
              const avgH=last7.length?(last7.reduce((s,x)=>s+x.hours,0)/last7.length).toFixed(1):"--";
              const avgR=last7.length?(last7.reduce((s,x)=>s+x.rating,0)/last7.length).toFixed(1):"--";
              const todayKey=new Date().toISOString().slice(0,10);
              const todayLogged=sleepLog.find(s=>s.date===todayKey);
              if(todayLogged){
                return(<div style={{padding:"8px 10px",background:"rgba(34,197,94,.1)",borderRadius:5,marginBottom:8,fontSize:10,color:"#86efac",textAlign:"center"}}>✓ Logged today: {todayLogged.hours}h · {"⭐".repeat(todayLogged.rating)}</div>);
              }
              return(<div>
                <div style={{display:"flex",gap:6,marginBottom:6,alignItems:"center"}}>
                  <input type="number" inputMode="decimal" step="0.5" min="0" max="14" value={sleepHours} placeholder="Hours" onChange={e=>setSleepHours(e.target.value)}
                    style={{flex:1,padding:"7px 8px",background:"rgba(0,0,0,.3)",border:"1px solid rgba(99,102,241,.3)",borderRadius:5,color:"#e2e8f0",fontSize:12,fontFamily:"'Courier New',monospace",outline:"none",boxSizing:"border-box"}}/>
                  <div style={{display:"flex",gap:2}}>
                    {[1,2,3,4,5].map(r=>(<button key={r} onClick={()=>setSleepRating(r)} style={{width:22,height:22,padding:0,background:r<=sleepRating?"rgba(99,102,241,.3)":"rgba(0,0,0,.3)",border:`1px solid ${r<=sleepRating?"#a5b4fc":"rgba(255,255,255,.1)"}`,borderRadius:4,color:r<=sleepRating?"#fbbf24":"#475569",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>★</button>))}
                  </div>
                </div>
                <button onClick={logSleep} style={{width:"100%",padding:"7px",background:"linear-gradient(135deg,rgba(99,102,241,.2),rgba(168,85,247,.1))",border:"1px solid rgba(99,102,241,.4)",borderRadius:5,color:"#a5b4fc",fontSize:10,cursor:"pointer",fontFamily:"inherit",letterSpacing:1}}>💤 LOG SLEEP (+5 XP)</button>
              </div>);
            })()}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
              <div style={{padding:"8px",background:"rgba(0,0,0,.3)",borderRadius:5,textAlign:"center"}}>
                <div style={{fontSize:7,color:"#64748b",letterSpacing:1}}>7-DAY AVG HOURS</div>
                <div style={{fontSize:18,color:"#a5b4fc",fontWeight:700}}>{sleepLog.length?(sleepLog.slice(-7).reduce((s,x)=>s+x.hours,0)/Math.min(sleepLog.length,7)).toFixed(1):"--"}h</div>
              </div>
              <div style={{padding:"8px",background:"rgba(0,0,0,.3)",borderRadius:5,textAlign:"center"}}>
                <div style={{fontSize:7,color:"#64748b",letterSpacing:1}}>7-DAY AVG QUALITY</div>
                <div style={{fontSize:18,color:"#a5b4fc",fontWeight:700}}>{sleepLog.length?(sleepLog.slice(-7).reduce((s,x)=>s+x.rating,0)/Math.min(sleepLog.length,7)).toFixed(1):"--"}/5</div>
              </div>
            </div>
          </div>

          {/* TOP LIFTS */}
          {(()=>{
            const topLifts=["Bench Press","Squats","Romanian Deadlift","Pull-ups / Lat Pulldown","Barbell Rows","Leg Press"];
            const lifts=topLifts.filter(n=>liftLog[n]&&liftLog[n].length>=2);
            if(lifts.length===0)return null;
            return(<div style={{padding:"10px 12px",background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:7}}>
              <div style={{fontSize:9,color:"#94a3b8",letterSpacing:1,marginBottom:8}}>⚡ KEY LIFTS PROGRESSION</div>
              {lifts.map(n=>{
                const sessions=liftLog[n];
                const maxes=sessions.map(s=>Math.max(...s.sets.map(set=>set.kg)));
                const first=maxes[0];const last=maxes[maxes.length-1];
                const delta=last-first;
                return(<div key={n} style={{padding:"6px 8px",background:"rgba(0,0,0,.2)",borderRadius:5,marginBottom:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:10,color:"#cbd5e1"}}>{n}</span>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:9,color:"#475569"}}>{first}kg → {last}kg</span>
                    <span style={{fontSize:10,color:delta>0?"#22c55e":delta<0?"#ef4444":"#64748b",fontWeight:700}}>{delta>0?"+":""}{delta}kg</span>
                  </div>
                </div>);
              })}
            </div>);
          })()}
        </div>)}

        {/* ===== MOBILITY ===== */}
        {tab==="mobility"&&(<div>
          <div style={{padding:"12px 14px",background:"linear-gradient(135deg,rgba(251,146,60,.08),rgba(99,102,241,.05))",border:"1px solid rgba(251,146,60,.2)",borderRadius:8,marginBottom:12}}>
            <div style={{fontSize:11,color:"#fdba74",letterSpacing:1,fontWeight:700}}>🤸 MOBILITY GUIDE</div>
            <div style={{fontSize:9,color:"#94a3b8",marginTop:2}}>Reference only · Track in LIFE quest (Mobility Work) for XP</div>
          </div>

          {Object.entries(MOBILITY_DATA).filter(([k])=>k!=="youtube").map(([key,section])=>(<div key={key} style={{marginBottom:14}}>
            <div style={{padding:"10px 12px",background:key==="morning"?"linear-gradient(135deg,rgba(251,191,36,.1),rgba(251,146,60,.05))":"linear-gradient(135deg,rgba(99,102,241,.1),rgba(168,85,247,.05))",border:`1px solid ${key==="morning"?"rgba(251,191,36,.3)":"rgba(99,102,241,.3)"}`,borderRadius:8,marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:14,color:"#fff",fontWeight:700}}>{section.icon} {section.title}</div>
                  <div style={{fontSize:9,color:"#94a3b8",marginTop:2}}>{section.description}</div>
                </div>
                <div style={{padding:"4px 8px",background:"rgba(0,0,0,.3)",borderRadius:5,fontSize:10,color:"#cbd5e1",letterSpacing:1}}>{section.duration}</div>
              </div>
            </div>
            {section.exercises.map((ex,i)=>(<div key={i} style={{padding:"10px 12px",background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:7,marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                <div style={{fontSize:24}}>{ex.emoji}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,color:"#e2e8f0",fontWeight:600}}>{i+1}. {ex.name}</div>
                  <div style={{fontSize:9,color:"#475569",marginTop:1,letterSpacing:1}}>{ex.duration}</div>
                </div>
              </div>
              <div style={{fontSize:9,color:"#94a3b8",lineHeight:1.5,paddingLeft:34}}>{ex.description}</div>
            </div>))}
          </div>))}

          <div style={{fontSize:9,color:"#334155",letterSpacing:2,marginTop:14,marginBottom:6}}>▸ YOUTUBE RESOURCES</div>
          {MOBILITY_DATA.youtube.map((y,i)=>(<a key={i} href={y.url} target="_blank" rel="noopener" style={{display:"block",padding:"10px 12px",background:"rgba(239,68,68,.05)",border:"1px solid rgba(239,68,68,.2)",borderRadius:7,marginBottom:6,textDecoration:"none",color:"inherit"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:20}}>🎥</div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:"#fca5a5",fontWeight:600}}>{y.name}</div>
                <div style={{fontSize:9,color:"#94a3b8",marginTop:2}}>{y.description}</div>
              </div>
              <div style={{fontSize:14,color:"#fca5a5"}}>↗</div>
            </div>
          </a>))}
        </div>)}

        {/* ===== HEALTH ===== */}
        {tab==="health"&&(<div>
          <div style={{background:"linear-gradient(135deg,rgba(34,197,94,.08),rgba(59,130,246,.05))",border:"1px solid rgba(34,197,94,.2)",borderRadius:8,padding:"12px 14px",marginBottom:12}}>
            <div style={{fontSize:10,color:"#4ade80",letterSpacing:1,marginBottom:6}}>⚖️ WEIGHT GOAL</div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:8}}>
              <span style={{color:"#94a3b8"}}>{latestW.weight}kg</span>
              <span style={{color:"#475569"}}>→</span>
              <span style={{color:"#22c55e"}}>{goalW}kg goal</span>
            </div>
            <div style={{height:8,background:"rgba(255,255,255,.05)",borderRadius:4,overflow:"hidden",marginBottom:4}}>
              <div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#16a34a,#4ade80)",borderRadius:4,transition:"width .6s ease"}}/>
            </div>
            <div style={{fontSize:9,color:"#475569",textAlign:"center"}}>{progress.toFixed(0)}% to goal · {(latestW.weight-goalW).toFixed(1)}kg remaining</div>
          </div>

          <div style={{fontSize:9,color:"#334155",letterSpacing:2,marginBottom:8}}>▸ LOG ENTRY</div>
          <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:8,padding:12,marginBottom:14}}>
            <div style={{display:"flex",gap:6,marginBottom:8}}>
              <div style={{flex:1}}><div style={{fontSize:8,color:"#475569",marginBottom:3}}>Weight (kg)*</div><input type="number" placeholder="kg" value={newWeight} onChange={e=>setNewWeight(e.target.value)} style={{...IS}}/></div>
              <div style={{flex:1}}><div style={{fontSize:8,color:"#475569",marginBottom:3}}>Body Fat %</div><input type="number" placeholder="%" value={newFat} onChange={e=>setNewFat(e.target.value)} style={{...IS}}/></div>
              <div style={{flex:1}}><div style={{fontSize:8,color:"#475569",marginBottom:3}}>Muscle kg</div><input type="number" placeholder="kg" value={newMuscle} onChange={e=>setNewMuscle(e.target.value)} style={{...IS}}/></div>
            </div>
            <button onClick={addWeightEntry} style={{width:"100%",padding:"9px",background:"linear-gradient(135deg,rgba(34,197,94,.2),rgba(34,197,94,.1))",border:"1px solid rgba(34,197,94,.3)",borderRadius:5,color:"#86efac",fontSize:11,cursor:"pointer",letterSpacing:1}}>📊 LOG WEIGHT</button>
          </div>

          {weightLog.length>1&&(<div>
            <div style={{fontSize:9,color:"#334155",letterSpacing:2,marginBottom:6}}>▸ HISTORY</div>
            <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",borderRadius:8,padding:12,marginBottom:12}}>
              {/* Simple visual chart */}
              <div style={{display:"flex",alignItems:"flex-end",gap:3,height:80,marginBottom:8}}>
                {weightLog.slice(-14).map((w,i)=>{const min=Math.min(goalW-2,...weightLog.map(x=>x.weight));const max=Math.max(...weightLog.map(x=>x.weight));const h=((w.weight-min)/(max-min))*100;return(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><div style={{fontSize:7,color:"#475569"}}>{w.weight}</div><div style={{width:"100%",height:`${h}%`,minHeight:4,background:w.weight<=goalW?"#22c55e":"linear-gradient(180deg,#3b82f6,#1e40af)",borderRadius:2}}/></div>);})}
              </div>
              <div style={{height:1,background:`rgba(34,197,94,.3)`,marginBottom:4}}/>
              <div style={{fontSize:8,color:"#22c55e",textAlign:"center"}}>Goal: {goalW}kg</div>
            </div>

            {weightLog.slice().reverse().map((w,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",marginBottom:3,background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.04)",borderRadius:5,fontSize:11}}>
              <span style={{color:"#475569"}}>{w.date}</span>
              <div style={{display:"flex",gap:10}}>
                <span style={{color:"#e2e8f0"}}>{w.weight}kg</span>
                {w.fat&&<span style={{color:"#f59e0b"}}>{w.fat}%bf</span>}
                {w.muscle&&<span style={{color:"#ef4444"}}>{w.muscle}kg💪</span>}
              </div>
            </div>))}
          </div>)}
        </div>)}

        {/* ===== RANK ===== */}
        {tab==="rank"&&(<div>
          {RANKS.map(r=>{const cur=r.name===rank.name;const ach=level>=r.min;return(<div key={r.name} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",marginBottom:3,background:cur?"rgba(59,130,246,.08)":"rgba(255,255,255,.01)",border:cur?`1px solid ${r.color}44`:"1px solid rgba(255,255,255,.03)",borderRadius:7,opacity:ach?1:.35}}><div style={{width:10,height:10,borderRadius:"50%",background:ach?r.color:"transparent",border:`2px solid ${r.color}`,boxShadow:cur?`0 0 10px ${r.color}66`:"none"}}/><div style={{flex:1}}><div style={{fontSize:13,color:ach?r.color:"#475569",fontWeight:cur?700:400}}>{r.name}</div><div style={{fontSize:9,color:"#334155"}}>Lv {r.min}{r.max<999?`–${r.max}`:"+"}</div></div>{cur&&<div style={{fontSize:9,color:r.color}}>◀ YOU</div>}{ach&&!cur&&<div style={{fontSize:9,color:"#22c55e"}}>✓</div>}</div>);})}
          <div style={{marginTop:16,padding:14,background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",borderRadius:8,textAlign:"center"}}><div style={{fontSize:11,color:"#64748b",lineHeight:1.6,fontStyle:"italic"}}>"Complete your quests. Grow stronger.<br/><span style={{color:"#3b82f6"}}>Arise.</span>"</div></div>
        </div>)}

        {/* ===== SETTINGS / BACKUP ===== */}
        {tab==="settings"&&(<div>
          <div style={{fontSize:9,color:"#334155",letterSpacing:2,marginBottom:10,textTransform:"uppercase"}}>▸ BACKUP & TRANSFER</div>

          {/* EXPORT */}
          <div style={{background:"linear-gradient(135deg,rgba(34,197,94,.06),rgba(59,130,246,.04))",border:"1px solid rgba(34,197,94,.2)",borderRadius:8,padding:14,marginBottom:12}}>
            <div style={{fontSize:11,color:"#4ade80",letterSpacing:1,marginBottom:4}}>📤 EXPORT SAVE</div>
            <div style={{fontSize:10,color:"#475569",marginBottom:10,lineHeight:1.5}}>
              Generate a save code containing all your progress. Copy it and keep it safe — you can use it to restore on any account.
            </div>
            <button onClick={exportSave} style={{width:"100%",padding:"10px",background:"linear-gradient(135deg,rgba(34,197,94,.2),rgba(34,197,94,.1))",border:"1px solid rgba(34,197,94,.3)",borderRadius:6,color:"#86efac",fontSize:11,cursor:"pointer",fontFamily:"'Courier New',monospace",letterSpacing:1,marginBottom:8}}>⚡ GENERATE SAVE CODE</button>
            {exportStr&&(<div>
              <textarea readOnly value={exportStr} style={{width:"100%",height:80,padding:10,background:"rgba(0,0,0,.4)",border:"1px solid rgba(34,197,94,.2)",borderRadius:6,color:"#86efac",fontSize:9,fontFamily:"'Courier New',monospace",resize:"none",outline:"none",boxSizing:"border-box",wordBreak:"break-all"}}/>
              <div style={{fontSize:9,color:"#22c55e",marginTop:4,textAlign:"center"}}>✓ Long press the text above to select & copy</div>
            </div>)}
          </div>

          {/* IMPORT */}
          <div style={{background:"linear-gradient(135deg,rgba(59,130,246,.06),rgba(168,85,247,.04))",border:"1px solid rgba(59,130,246,.2)",borderRadius:8,padding:14,marginBottom:12}}>
            <div style={{fontSize:11,color:"#93c5fd",letterSpacing:1,marginBottom:4}}>📥 IMPORT SAVE</div>
            <div style={{fontSize:10,color:"#475569",marginBottom:10,lineHeight:1.5}}>
              Paste a save code from another account to restore all your progress here.
            </div>
            <textarea placeholder="Paste your save code here..." value={importStr} onChange={e=>setImportStr(e.target.value)} style={{width:"100%",height:80,padding:10,background:"rgba(0,0,0,.4)",border:"1px solid rgba(59,130,246,.15)",borderRadius:6,color:"#e2e8f0",fontSize:10,fontFamily:"'Courier New',monospace",resize:"none",outline:"none",boxSizing:"border-box",marginBottom:8}}/>
            {!showImportConfirm?(
              <button onClick={()=>{if(importStr.trim())setShowImportConfirm(true);else setNotif("Paste a save code first");}} style={{width:"100%",padding:"10px",background:"linear-gradient(135deg,rgba(59,130,246,.2),rgba(59,130,246,.1))",border:"1px solid rgba(59,130,246,.3)",borderRadius:6,color:"#93c5fd",fontSize:11,cursor:"pointer",fontFamily:"'Courier New',monospace",letterSpacing:1}}>📥 IMPORT SAVE</button>
            ):(
              <div>
                <div style={{fontSize:10,color:"#f59e0b",marginBottom:8,textAlign:"center",lineHeight:1.4}}>⚠️ This will REPLACE all current data. Are you sure?</div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={importSave} style={{flex:1,padding:"10px",background:"linear-gradient(135deg,rgba(34,197,94,.2),rgba(34,197,94,.1))",border:"1px solid rgba(34,197,94,.3)",borderRadius:6,color:"#86efac",fontSize:11,cursor:"pointer",fontFamily:"'Courier New',monospace"}}>✓ YES, IMPORT</button>
                  <button onClick={()=>setShowImportConfirm(false)} style={{flex:1,padding:"10px",background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",borderRadius:6,color:"#f87171",fontSize:11,cursor:"pointer",fontFamily:"'Courier New',monospace"}}>✗ CANCEL</button>
                </div>
              </div>
            )}
          </div>

          {/* STATS SUMMARY */}
          <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",borderRadius:8,padding:14,marginBottom:12}}>
            <div style={{fontSize:9,color:"#334155",letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>▸ SAVE DATA SUMMARY</div>
            <div style={{fontSize:10,color:"#94a3b8",lineHeight:1.8}}>
              <div>Level: <span style={{color:"#e2e8f0"}}>{level}</span> ({rank.name})</div>
              <div>Total XP: <span style={{color:"#93c5fd"}}>{totalXp}</span></div>
              <div>Quests Completed: <span style={{color:"#e2e8f0"}}>{qC}</span></div>
              <div>Lessons Done: <span style={{color:"#a78bfa"}}>{doneLessons.length}/56</span></div>
              <div>Streak: <span style={{color:"#f59e0b"}}>{streak}</span> days</div>
              <div>Weight Entries: <span style={{color:"#22c55e"}}>{weightLog.length}</span></div>
              <div>Workout Logs: <span style={{color:"#e2e8f0"}}>{wLog.length}</span></div>
              <div>Workouts Logged: <span style={{color:"#a78bfa"}}>{wLog.length}</span></div>
            </div>
          </div>

          {/* DANGER ZONE */}
          <div style={{background:"rgba(239,68,68,.04)",border:"1px solid rgba(239,68,68,.15)",borderRadius:8,padding:14}}>
            <div style={{fontSize:9,color:"#ef4444",letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>▸ DANGER ZONE</div>
            <div style={{fontSize:10,color:"#475569",marginBottom:10,lineHeight:1.5}}>
              Reset all progress and start fresh. This cannot be undone — export your save first if you want to keep it.
            </div>
            <button onClick={()=>{if(confirm("This will DELETE all your progress permanently. Are you absolutely sure?"))resetAllData();}} style={{width:"100%",padding:"10px",background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.25)",borderRadius:6,color:"#f87171",fontSize:11,cursor:"pointer",fontFamily:"'Courier New',monospace",letterSpacing:1}}>🗑️ RESET ALL DATA</button>
          </div>
        </div>)}

      </div>

      {/* FLOATING SAVE BUTTON */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,padding:"8px 14px 14px",background:"linear-gradient(0deg,rgba(2,6,23,0.98) 60%,transparent)",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
        <button onClick={manualSave} style={{
          flex:1,maxWidth:440,padding:"12px 20px",
          background:dirty?"linear-gradient(135deg,rgba(245,158,11,.25),rgba(245,158,11,.12))":"linear-gradient(135deg,rgba(34,197,94,.15),rgba(34,197,94,.06))",
          border:dirty?"1px solid rgba(245,158,11,.4)":"1px solid rgba(34,197,94,.3)",
          borderRadius:8,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",gap:8,
          fontFamily:"'Courier New',monospace",
        }}>
          <span style={{fontSize:16}}>{dirty?"⚠️":"💾"}</span>
          <span style={{fontSize:12,color:dirty?"#fbbf24":"#86efac",letterSpacing:1,fontWeight:700}}>
            {dirty?"UNSAVED — TAP TO SAVE":"SAVE PROGRESS"}
          </span>
        </button>
      </div>
      {lastSaved&&<div style={{position:"fixed",bottom:56,left:0,right:0,textAlign:"center",fontSize:8,color:"#334155",zIndex:99,pointerEvents:"none"}}>Last saved: {lastSaved}</div>}
    </div>
  );
}
