(() => {
  'use strict';

  const STORAGE_KEY = 'arevys_v2_live_state_v20';
  const LEGACY_PROFILE_KEY = 'arevys_v2_profile';
  const VERSION = 20;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const round = value => Math.round(Number(value) || 0);
  const clone = value => JSON.parse(JSON.stringify(value));
  const now = () => Date.now();
  const uid = prefix => `${prefix}_${now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

  const MUSCLES = {
    pectorales: { name: 'PECHO', group: 'TORSO', views: { front: { side: 'left', slot: 'chest' } } },
    biceps: { name: 'BÍCEPS', group: 'BRAZOS', views: { front: { side: 'left', slot: 'arms' } } },
    cuadriceps: { name: 'CUÁDRICEPS', group: 'PIERNAS', views: { front: { side: 'left', slot: 'quads' } } },
    pantorrillas: { name: 'PANTORRILLAS', group: 'PIERNAS', views: { front: { side: 'left', slot: 'calves' }, back: { side: 'left', slot: 'calves' } } },
    deltoides: { name: 'HOMBROS', group: 'TORSO', views: { front: { side: 'right', slot: 'shoulders' }, back: { side: 'right', slot: 'shoulders' } } },
    abdominales: { name: 'CORE', group: 'CORE', views: { front: { side: 'right', slot: 'core' } } },
    isquiotibiales: { name: 'ISQUIOTIBIALES', group: 'PIERNAS', views: { back: { side: 'left', slot: 'hams' } } },
    dorsales: { name: 'DORSALES', group: 'TORSO', views: { back: { side: 'left', slot: 'back' } } },
    triceps: { name: 'TRÍCEPS', group: 'BRAZOS', views: { back: { side: 'left', slot: 'triceps' } } },
    gluteos: { name: 'GLÚTEOS', group: 'PIERNAS', views: { back: { side: 'right', slot: 'glutes' } } }
  };

  const EXERCISES = [
    { id: 'jalon', name: 'Jalón al pecho', group: 'Espalda', equipment: 'Polea', level: 'Intermedio', sets: 4, reps: '8–10', weight: 42, rest: 90, primary: ['dorsales'], secondary: ['biceps'], cue: 'Lleva los codos hacia las costillas y mantén el torso estable.' },
    { id: 'remo', name: 'Remo sentado', group: 'Espalda', equipment: 'Polea', level: 'Intermedio', sets: 4, reps: '10–12', weight: 38, rest: 90, primary: ['dorsales'], secondary: ['biceps','deltoides'], cue: 'Inicia con las escápulas y evita impulsar el tronco.' },
    { id: 'pullover', name: 'Pullover en polea', group: 'Espalda', equipment: 'Polea', level: 'Intermedio', sets: 3, reps: '12–15', weight: 24, rest: 70, primary: ['dorsales'], secondary: ['abdominales'], cue: 'Mantén los brazos largos y controla el recorrido completo.' },
    { id: 'curl', name: 'Curl con mancuernas', group: 'Brazos', equipment: 'Mancuernas', level: 'Inicial', sets: 3, reps: '10–12', weight: 10, rest: 70, primary: ['biceps'], secondary: [], cue: 'Fija los codos y evita balancear el cuerpo.' },
    { id: 'face_pull', name: 'Face pull', group: 'Hombros', equipment: 'Polea', level: 'Intermedio', sets: 3, reps: '12–15', weight: 18, rest: 60, primary: ['deltoides'], secondary: ['dorsales'], cue: 'Abre la cuerda hacia el rostro y termina con control.' },
    { id: 'press_banca', name: 'Press de banca', group: 'Pecho', equipment: 'Barra', level: 'Intermedio', sets: 4, reps: '6–8', weight: 52, rest: 120, primary: ['pectorales'], secondary: ['triceps','deltoides'], cue: 'Apoya todo el cuerpo y baja la barra de forma controlada.' },
    { id: 'press_inclinado', name: 'Press inclinado', group: 'Pecho', equipment: 'Mancuernas', level: 'Intermedio', sets: 3, reps: '8–10', weight: 18, rest: 90, primary: ['pectorales'], secondary: ['deltoides','triceps'], cue: 'Mantén las escápulas estables y no cierres los codos.' },
    { id: 'press_hombros', name: 'Press de hombros', group: 'Hombros', equipment: 'Mancuernas', level: 'Intermedio', sets: 3, reps: '8–10', weight: 14, rest: 90, primary: ['deltoides'], secondary: ['triceps'], cue: 'Empuja vertical sin perder la posición de las costillas.' },
    { id: 'elevaciones', name: 'Elevaciones laterales', group: 'Hombros', equipment: 'Mancuernas', level: 'Inicial', sets: 3, reps: '12–15', weight: 7, rest: 60, primary: ['deltoides'], secondary: [], cue: 'Eleva con suavidad y conserva tensión, sin balanceo.' },
    { id: 'triceps_polea', name: 'Extensión de tríceps', group: 'Brazos', equipment: 'Polea', level: 'Inicial', sets: 3, reps: '10–12', weight: 22, rest: 65, primary: ['triceps'], secondary: [], cue: 'Mantén los codos junto al cuerpo y extiende por completo.' },
    { id: 'sentadilla', name: 'Sentadilla', group: 'Piernas', equipment: 'Barra', level: 'Intermedio', sets: 4, reps: '6–8', weight: 62, rest: 140, primary: ['cuadriceps','gluteos'], secondary: ['isquiotibiales','abdominales'], cue: 'Mantén el apoyo completo del pie y una bajada estable.' },
    { id: 'prensa', name: 'Prensa de piernas', group: 'Piernas', equipment: 'Máquina', level: 'Inicial', sets: 4, reps: '10–12', weight: 90, rest: 110, primary: ['cuadriceps','gluteos'], secondary: ['isquiotibiales'], cue: 'Controla la profundidad y no bloquees las rodillas.' },
    { id: 'rumano', name: 'Peso muerto rumano', group: 'Piernas', equipment: 'Barra', level: 'Intermedio', sets: 4, reps: '8–10', weight: 50, rest: 120, primary: ['isquiotibiales','gluteos'], secondary: ['dorsales'], cue: 'Lleva la cadera atrás con la espalda estable.' },
    { id: 'curl_femoral', name: 'Curl femoral', group: 'Piernas', equipment: 'Máquina', level: 'Inicial', sets: 3, reps: '10–12', weight: 30, rest: 75, primary: ['isquiotibiales'], secondary: [], cue: 'Evita levantar la cadera y controla el regreso.' },
    { id: 'hip_thrust', name: 'Hip thrust', group: 'Glúteos', equipment: 'Barra', level: 'Intermedio', sets: 4, reps: '8–10', weight: 58, rest: 110, primary: ['gluteos'], secondary: ['isquiotibiales','abdominales'], cue: 'Termina con la pelvis neutra y una pausa arriba.' },
    { id: 'pantorrilla', name: 'Elevación de pantorrillas', group: 'Piernas', equipment: 'Máquina', level: 'Inicial', sets: 4, reps: '12–15', weight: 36, rest: 60, primary: ['pantorrillas'], secondary: [], cue: 'Usa el recorrido completo y pausa arriba.' },
    { id: 'goblet', name: 'Sentadilla goblet', group: 'Piernas', equipment: 'Mancuerna', level: 'Inicial', sets: 3, reps: '10–12', weight: 18, rest: 80, primary: ['cuadriceps','gluteos'], secondary: ['abdominales'], cue: 'Sostén la carga cerca del pecho y baja con control.' },
    { id: 'remo_mancuerna', name: 'Remo a una mano', group: 'Espalda', equipment: 'Mancuerna', level: 'Inicial', sets: 3, reps: '10–12', weight: 20, rest: 75, primary: ['dorsales'], secondary: ['biceps'], cue: 'Mantén la pelvis estable y lleva el codo atrás.' },
    { id: 'plancha', name: 'Plancha frontal', group: 'Core', equipment: 'Peso corporal', level: 'Inicial', sets: 3, reps: '30 s', weight: 0, rest: 50, primary: ['abdominales'], secondary: ['gluteos','deltoides'], cue: 'Alinea costillas y pelvis mientras respiras con calma.' },
    { id: 'bird_dog', name: 'Bird dog', group: 'Movilidad', equipment: 'Peso corporal', level: 'Inicial', sets: 3, reps: '8/lado', weight: 0, rest: 40, primary: ['abdominales'], secondary: ['gluteos','dorsales'], cue: 'Extiende sin rotar la pelvis y vuelve lentamente.' },
    { id: 'puente', name: 'Puente de glúteos', group: 'Movilidad', equipment: 'Peso corporal', level: 'Inicial', sets: 3, reps: '12–15', weight: 0, rest: 45, primary: ['gluteos'], secondary: ['isquiotibiales'], cue: 'Empuja desde los talones y evita arquear la espalda.' },
    { id: 'movilidad', name: 'Movilidad torácica', group: 'Movilidad', equipment: 'Peso corporal', level: 'Inicial', sets: 2, reps: '8/lado', weight: 0, rest: 30, primary: ['dorsales'], secondary: ['deltoides'], cue: 'Respira y amplía el recorrido sin forzar.' },
    { id: 'flexiones', name: 'Flexiones', group: 'Pecho', equipment: 'Peso corporal', level: 'Inicial', sets: 3, reps: '8–15', weight: 0, rest: 60, primary: ['pectorales'], secondary: ['triceps','deltoides'], cue: 'Mantén el cuerpo alineado y desciende con control.' },
    { id: 'zancada', name: 'Zancada alterna', group: 'Piernas', equipment: 'Peso corporal', level: 'Inicial', sets: 3, reps: '8/lado', weight: 0, rest: 60, primary: ['cuadriceps','gluteos'], secondary: ['isquiotibiales'], cue: 'Da un paso estable y empuja el suelo para volver.' },
    { id: 'superman', name: 'Extensión lumbar en suelo', group: 'Espalda', equipment: 'Peso corporal', level: 'Inicial', sets: 3, reps: '10–12', weight: 0, rest: 50, primary: ['dorsales'], secondary: ['gluteos'], cue: 'Eleva brazos y piernas suavemente sin comprimir el cuello.' },
    { id: 'pike_pushup', name: 'Flexión en pica', group: 'Hombros', equipment: 'Peso corporal', level: 'Inicial', sets: 3, reps: '6–10', weight: 0, rest: 60, primary: ['deltoides'], secondary: ['triceps','pectorales'], cue: 'Lleva la cabeza hacia el suelo manteniendo la cadera elevada.' },
    { id: 'pantorrilla_suelo', name: 'Elevación de pantorrillas de pie', group: 'Piernas', equipment: 'Peso corporal', level: 'Inicial', sets: 3, reps: '15–20', weight: 0, rest: 45, primary: ['pantorrillas'], secondary: [], cue: 'Sube todo lo posible y pausa arriba antes de bajar.' }
  ];

  const TEMPLATES = [
    { id: 'pull', title: 'Espalda + Bíceps', focus: ['dorsales','biceps','deltoides'], exercises: ['jalon','remo','pullover','curl','face_pull'], duration: 52, intensity: 'ALTA' },
    { id: 'push', title: 'Pecho + Hombros', focus: ['pectorales','deltoides','triceps'], exercises: ['press_banca','press_inclinado','press_hombros','elevaciones','triceps_polea'], duration: 50, intensity: 'ALTA' },
    { id: 'legs', title: 'Piernas + Glúteos', focus: ['cuadriceps','isquiotibiales','gluteos','pantorrillas'], exercises: ['sentadilla','prensa','rumano','curl_femoral','pantorrilla'], duration: 58, intensity: 'ALTA' },
    { id: 'full', title: 'Cuerpo completo', focus: ['cuadriceps','pectorales','dorsales','gluteos','abdominales'], exercises: ['goblet','press_inclinado','remo_mancuerna','hip_thrust','plancha'], duration: 44, intensity: 'MEDIA' },
    { id: 'restore', title: 'Movilidad + activación', focus: ['abdominales','gluteos','dorsales','deltoides'], exercises: ['movilidad','bird_dog','puente','plancha'], duration: 25, intensity: 'SUAVE', restorative: true }
  ];

  const EXERCISE_BY_ID = Object.fromEntries(EXERCISES.map(exercise => [exercise.id, exercise]));

  const EQUIPMENT_MODES = [
    { id: 'gym', label: 'Gimnasio completo', shortLabel: 'GIMNASIO', description: 'Máquinas, poleas, barras y mancuernas.', equipment: ['dumbbells','barbell','cable','machines','bench','bodyweight'] },
    { id: 'home', label: 'Gimnasio en casa', shortLabel: 'CASA', description: 'Equipo doméstico para entrenar con libertad.', equipment: ['dumbbells','bands','bench','mat','bodyweight'] },
    { id: 'basic', label: 'Equipo básico', shortLabel: 'BÁSICO', description: 'Mancuernas, bandas y lo esencial.', equipment: ['dumbbells','bands','mat','bodyweight'] },
    { id: 'bodyweight', label: 'Solo peso corporal', shortLabel: 'SIN EQUIPO', description: 'Movimientos sin pesas ni máquinas.', equipment: ['bodyweight','mat'] }
  ];
  const EQUIPMENT_OPTIONS = [
    { id: 'dumbbells', label: 'Mancuernas', description: 'Pesos libres' },
    { id: 'barbell', label: 'Barra y discos', description: 'Carga progresiva' },
    { id: 'cable', label: 'Polea', description: 'Tensión constante' },
    { id: 'machines', label: 'Máquinas', description: 'Recorrido guiado' },
    { id: 'bench', label: 'Banca', description: 'Apoyo y press' },
    { id: 'bands', label: 'Bandas', description: 'Resistencia elástica' },
    { id: 'mat', label: 'Colchoneta', description: 'Suelo y movilidad' },
    { id: 'bodyweight', label: 'Peso corporal', description: 'Sin equipamiento' }
  ];
  const EQUIPMENT_MODE_BY_ID = Object.fromEntries(EQUIPMENT_MODES.map(mode => [mode.id, mode]));
  const EQUIPMENT_BY_ID = Object.fromEntries(EQUIPMENT_OPTIONS.map(item => [item.id, item]));

  function equipmentModeId(profile = {}) {
    const requested = profile.equipmentMode;
    if (requested && EQUIPMENT_MODE_BY_ID[requested]) return requested;
    return profile.trainingPlace === 'Casa' ? 'home' : 'gym';
  }

  function equipmentProfile(profile = {}) {
    const modeId = equipmentModeId(profile);
    const mode = EQUIPMENT_MODE_BY_ID[modeId];
    const raw = Array.isArray(profile.equipment) ? profile.equipment : mode.equipment;
    let selected = [...new Set(raw)].filter(id => EQUIPMENT_BY_ID[id]);
    if (modeId === 'bodyweight') selected = ['bodyweight','mat'];
    else {
      if (!selected.length) selected = [...mode.equipment];
      if (!selected.includes('bodyweight')) selected.push('bodyweight');
    }
    return {
      modeId,
      mode,
      selected,
      label: mode.label,
      selectedLabels: selected.map(id => EQUIPMENT_BY_ID[id]?.label || id)
    };
  }

  function exerciseEquipmentId(exercise) {
    const equipment = String(exercise?.equipment || '').toLowerCase();
    if (equipment.includes('polea')) return 'cable';
    if (equipment.includes('máquina') || equipment.includes('maquina')) return 'machines';
    if (equipment.includes('barra')) return 'barbell';
    if (equipment.includes('mancuer')) return 'dumbbells';
    if (equipment.includes('peso corporal')) return 'bodyweight';
    if (equipment.includes('banda')) return 'bands';
    return null;
  }

  function exerciseAvailable(exercise, profile = {}) {
    const equipmentId = exerciseEquipmentId(exercise);
    return equipmentId === 'bodyweight' || (equipmentId && equipmentProfile(profile).selected.includes(equipmentId));
  }

  function templateExercises(template, state) {
    const preferred = template.exercises.map(id => EXERCISE_BY_ID[id]).filter(exercise => exercise && exerciseAvailable(exercise, state.profile));
    const preferredIds = new Set(preferred.map(exercise => exercise.id));
    const primaryFallback = EXERCISES.filter(exercise => !preferredIds.has(exercise.id) && exerciseAvailable(exercise, state.profile) && template.focus.some(id => exercise.primary.includes(id)));
    const primaryIds = new Set(primaryFallback.map(exercise => exercise.id));
    const secondaryFallback = EXERCISES.filter(exercise => !preferredIds.has(exercise.id) && !primaryIds.has(exercise.id) && exerciseAvailable(exercise, state.profile) && template.focus.some(id => exercise.secondary.includes(id)));
    return [...preferred, ...primaryFallback, ...secondaryFallback].slice(0, template.exercises.length);
  }

  function nutritionDayKey(value = now()) {
    const date = new Date(value);
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  function freshNutrition() {
    return {
      dayKey: nutritionDayKey(),
      consumed: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 },
      waterMl: 0,
      meals: [],
      pantry: [],
      updatedAt: null
    };
  }

  function nutritionTargets(state) {
    const weight = Number(state.profile?.weight) || 75;
    const goal = state.profile?.goal || 'Ganar músculo';
    const goalCalories = {
      'Perder grasa': 1950,
      'Ganar músculo': 2450,
      'Aumentar fuerza': 2350,
      'Mejorar rendimiento': 2550
    };
    const calories = clamp(round((goalCalories[goal] || 2200) + (weight - 75) * 12), 1600, 3600);
    const protein = clamp(round(weight * (goal === 'Perder grasa' ? 1.9 : 1.7)), 90, 240);
    const fats = clamp(round(calories * 0.28 / 9), 45, 110);
    const carbs = clamp(round((calories - protein * 4 - fats * 9) / 4), 100, 480);
    const waterMl = clamp(round(weight * 30), 1600, 3600);
    return { calories, protein, carbs, fats, waterMl };
  }

  function normalizeNutrition(state) {
    state.nutrition = { ...freshNutrition(), ...(state.nutrition || {}) };
    state.nutrition.consumed = { ...freshNutrition().consumed, ...(state.nutrition.consumed || {}) };
    state.nutrition.meals = Array.isArray(state.nutrition.meals) ? state.nutrition.meals : [];
    state.nutrition.pantry = Array.isArray(state.nutrition.pantry) ? state.nutrition.pantry : [];
    if (state.nutrition.dayKey !== nutritionDayKey()) {
      state.nutrition.dayKey = nutritionDayKey();
      state.nutrition.consumed = { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 };
      state.nutrition.waterMl = 0;
      state.nutrition.meals = [];
    }
    return state.nutrition;
  }

  function nutritionSummary(state) {
    const nutrition = normalizeNutrition(state), targets = nutritionTargets(state), consumed = nutrition.consumed;
    const pct = key => clamp(round((Number(consumed[key]) || 0) / Math.max(1, targets[key]) * 100), 0, 150);
    const proteinPct = pct('protein'), caloriesPct = pct('calories'), waterPct = clamp(round((nutrition.waterMl || 0) / targets.waterMl * 100), 0, 150);
    const score = clamp(round(Math.min(caloriesPct, 100) * 0.35 + Math.min(proteinPct, 100) * 0.35 + Math.min(waterPct, 100) * 0.2 + (nutrition.meals.length ? 10 : 0)), 0, 100);
    return {
      targets,
      consumed: { ...consumed },
      waterMl: nutrition.waterMl || 0,
      meals: nutrition.meals,
      pantry: nutrition.pantry,
      percentages: { calories: caloriesPct, protein: proteinPct, carbs: pct('carbs'), fats: pct('fats'), water: waterPct },
      remainingCalories: Math.max(0, targets.calories - (Number(consumed.calories) || 0)),
      score,
      adherence: nutrition.meals.length ? clamp(round((nutrition.meals.length / 4) * 100), 0, 100) : 0
    };
  }

  function recordNutritionMeal(state, meal = {}) {
    const nutrition = normalizeNutrition(state);
    const entry = {
      id: uid('meal'),
      title: String(meal.title || 'Comida registrada').trim(),
      mealType: String(meal.mealType || 'Comida'),
      calories: Math.max(0, round(meal.calories)),
      protein: Math.max(0, round(meal.protein)),
      carbs: Math.max(0, round(meal.carbs)),
      fats: Math.max(0, round(meal.fats)),
      fiber: Math.max(0, round(meal.fiber)),
      source: String(meal.source || 'manual'),
      image: meal.image || '',
      createdAt: now()
    };
    ['calories', 'protein', 'carbs', 'fats', 'fiber'].forEach(key => { nutrition.consumed[key] = round((nutrition.consumed[key] || 0) + entry[key]); });
    nutrition.meals.unshift(entry);
    nutrition.meals = nutrition.meals.slice(0, 30);
    nutrition.updatedAt = now();
    save(state);
    return entry;
  }

  function addNutritionWater(state, milliliters = 250) {
    const nutrition = normalizeNutrition(state);
    nutrition.waterMl = clamp(round((nutrition.waterMl || 0) + Number(milliliters)), 0, 10000);
    nutrition.updatedAt = now();
    save(state);
    return nutrition.waterMl;
  }

  function removeNutritionMeal(state, mealId) {
    const nutrition = normalizeNutrition(state), index = nutrition.meals.findIndex(meal => meal.id === mealId);
    if (index < 0) return null;
    const [entry] = nutrition.meals.splice(index, 1);
    ['calories', 'protein', 'carbs', 'fats', 'fiber'].forEach(key => { nutrition.consumed[key] = Math.max(0, round((nutrition.consumed[key] || 0) - (entry[key] || 0))); });
    nutrition.updatedAt = now();
    save(state);
    return entry;
  }

  function updateNutritionPantry(state, pantry = []) {
    const nutrition = normalizeNutrition(state);
    nutrition.pantry = [...new Set(pantry.map(item => String(item).trim()).filter(Boolean))].slice(0, 20);
    nutrition.updatedAt = now();
    save(state);
    return nutrition.pantry;
  }

  function freshMuscles() {
    return Object.fromEntries(Object.keys(MUSCLES).map(id => [id, {
      recovery: 100,
      fatigueAcute: 0,
      fatigueCumulative: 0,
      lastStimulus: null,
      recentLoad: 0,
      recoveryHours: 0,
      trend: 'estable',
      risk: 'bajo',
      confidence: 0.3,
      initialized: false,
      updatedAt: now()
    }]));
  }

  function defaultState(profile = {}) {
    const initialModeId = equipmentModeId(profile);
    const initialMode = EQUIPMENT_MODE_BY_ID[initialModeId];
    return {
      version: VERSION,
      onboardingComplete: false,
      profile: {
        name: profile.name || '',
        avatar: profile.avatar || 'Helena',
        goal: profile.goal || 'Ganar músculo',
        experience: profile.experience || 'Estoy comenzando',
        frequency: profile.frequency || '4 días',
        trainingPlace: profile.trainingPlace || 'Gimnasio',
        equipmentMode: initialModeId,
        equipment: Array.isArray(profile.equipment) && profile.equipment.length ? [...profile.equipment] : [...initialMode.equipment],
        age: profile.age || '',
        weight: profile.weight || '',
        height: profile.height || '',
        nutrition: profile.nutrition || 'Sin dieta específica',
        care: profile.care || 'Nada que informar'
      },
      daily: { sleep: null, energy: null, stress: null, mood: null, disposition: null, time: 45, checkedAt: null },
      nutrition: freshNutrition(),
      muscles: freshMuscles(),
      sessions: [],
      snapshots: [],
      activeWorkout: null,
      lastResult: null,
      preferences: { units: 'kg', sound: true, haptics: true },
      connections: { appleHealth: false, googleFit: false, wearable: false },
      createdAt: now(),
      updatedAt: now()
    };
  }

  function legacyProfile() {
    try {
      const raw = JSON.parse(localStorage.getItem(LEGACY_PROFILE_KEY) || 'null');
      if (!raw) return null;
      return {
        avatar: raw.avatar || 'Helena',
        goal: raw['1'], experience: raw['2'], frequency: raw['3'],
        age: raw['Edad'], weight: raw['Peso (kg)'], height: raw['Altura (cm)'],
        nutrition: raw['5'], care: raw['6']
      };
    } catch (_) { return null; }
  }

  function hydrate(raw) {
    const base = defaultState(raw?.profile || {});
    const merged = { ...base, ...(raw || {}) };
    merged.profile = { ...base.profile, ...(raw?.profile || {}) };
    merged.daily = { ...base.daily, ...(raw?.daily || {}) };
    merged.nutrition = { ...base.nutrition, ...(raw?.nutrition || {}) };
    merged.preferences = { ...base.preferences, ...(raw?.preferences || {}) };
    merged.connections = { ...base.connections, ...(raw?.connections || {}) };
    merged.muscles = Object.fromEntries(Object.keys(MUSCLES).map(id => [id, { ...base.muscles[id], ...(raw?.muscles?.[id] || {}) }]));
    const equipment = equipmentProfile(merged.profile);
    merged.profile.equipmentMode = equipment.modeId;
    merged.profile.equipment = equipment.selected;
    merged.profile.trainingPlace = equipment.modeId === 'gym' ? 'Gimnasio' : 'Casa';
    merged.sessions = Array.isArray(raw?.sessions) ? raw.sessions : [];
    merged.snapshots = Array.isArray(raw?.snapshots) ? raw.snapshots : [];
    normalizeNutrition(merged);
    merged.version = VERSION;
    return merged;
  }

  function applyPassiveRecovery(state) {
    const current = now();
    const sleepFactor = state.daily.sleep == null ? 1 : clamp(state.daily.sleep / 85, 0.75, 1.2);
    Object.values(state.muscles).forEach(muscle => {
      if (!muscle.initialized || muscle.recovery >= 100) { muscle.updatedAt = current; return; }
      const elapsedHours = clamp((current - (muscle.updatedAt || current)) / 3600000, 0, 168);
      if (elapsedHours < 0.02) return;
      const confidenceFactor = 0.88 + muscle.confidence * 0.2;
      const gain = elapsedHours * 1.42 * sleepFactor * confidenceFactor;
      muscle.recovery = clamp(Math.round((muscle.recovery + gain) * 10) / 10, 0, 100);
      muscle.fatigueAcute = clamp(100 - muscle.recovery, 0, 100);
      muscle.fatigueCumulative = clamp(muscle.fatigueCumulative - elapsedHours * 0.34, 0, 100);
      muscle.recoveryHours = Math.ceil((100 - muscle.recovery) / Math.max(0.8, 1.42 * sleepFactor));
      muscle.risk = muscle.recovery < 45 || muscle.fatigueCumulative > 62 ? 'alto' : muscle.recovery < 70 ? 'medio' : 'bajo';
      muscle.trend = gain >= 2 ? 'recuperando' : muscle.trend;
      muscle.updatedAt = current;
    });
    state.updatedAt = current;
    return state;
  }

  function load() {
    let parsed = null;
    try { parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) { parsed = null; }
    if (!parsed) {
      const legacy = legacyProfile();
      parsed = defaultState(legacy || {});
      parsed.onboardingComplete = Boolean(legacy);
    }
    const state = applyPassiveRecovery(hydrate(parsed));
    save(state);
    return state;
  }

  function save(state) {
    state.updatedAt = now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }

  function completeOnboarding(state, answers, avatar) {
    state.profile = {
      ...state.profile,
      avatar: avatar || state.profile.avatar,
      goal: answers[1] || state.profile.goal,
      experience: answers[2] || state.profile.experience,
      frequency: answers[3] || state.profile.frequency,
      trainingPlace: ['Casa','Gimnasio'].includes(answers[3]) ? answers[3] : state.profile.trainingPlace,
      equipmentMode: answers[3] === 'Casa' ? 'home' : answers[3] === 'Gimnasio' ? 'gym' : state.profile.equipmentMode,
      equipment: answers[3] === 'Casa' ? [...EQUIPMENT_MODE_BY_ID.home.equipment] : answers[3] === 'Gimnasio' ? [...EQUIPMENT_MODE_BY_ID.gym.equipment] : state.profile.equipment,
      age: answers['Edad'] || state.profile.age,
      weight: answers['Peso (kg)'] || state.profile.weight,
      height: answers['Altura (cm)'] || state.profile.height,
      nutrition: answers[5] || state.profile.nutrition,
      care: answers[6] || state.profile.care
    };
    state.onboardingComplete = true;
    save(state);
    return state;
  }

  function statusForMuscle(muscle) {
    if (!muscle?.initialized) return { key: 'neutral', label: 'SIN DATOS', color: '#7e9294', copy: 'Se activará al registrar un estímulo para este grupo.' };
    const pct = round(muscle.recovery);
    if (pct >= 75) return { key: 'optimal', label: 'ÓPTIMO', color: '#79dc59', copy: 'Buena capacidad de recuperación para continuar.' };
    if (pct >= 50) return { key: 'attention', label: 'ATENCIÓN', color: '#e7bd55', copy: 'La recuperación sigue en curso. Conviene moderar la carga.' };
    return { key: 'fatigue', label: 'FATIGA', color: '#ee554e', copy: 'Reduce la carga y prioriza la recuperación antes de volver a estimular.' };
  }

  function overallRecovery(state) {
    const initialized = Object.values(state.muscles).filter(muscle => muscle.initialized);
    if (!initialized.length) return 100;
    return round(initialized.reduce((sum, muscle) => sum + muscle.recovery, 0) / initialized.length);
  }

  function readiness(state) {
    const body = overallRecovery(state);
    if (!state.daily.checkedAt) return body;
    const sleep = state.daily.sleep == null ? body : state.daily.sleep;
    const energy = state.daily.energy == null ? body : state.daily.energy * 20;
    const stress = state.daily.stress == null ? body : (6 - state.daily.stress) * 20;
    return clamp(round(body * 0.62 + sleep * 0.16 + energy * 0.14 + stress * 0.08), 0, 100);
  }

  function stateLabel(value) {
    if (value >= 80) return { key: 'optimal', label: 'ÓPTIMO', color: '#79dc59' };
    if (value >= 58) return { key: 'attention', label: 'ATENCIÓN', color: '#e7bd55' };
    return { key: 'fatigue', label: 'FATIGA', color: '#ee554e' };
  }

  function recoveryValue(state, id) {
    const muscle = state.muscles[id];
    return muscle?.initialized ? muscle.recovery : 100;
  }

  function planForToday(state) {
    const bodyScore = overallRecovery(state);
    const lastTemplate = state.sessions[0]?.templateId;
    let candidates = TEMPLATES.filter(template => !template.restorative).map(template => {
      const average = template.focus.reduce((sum, id) => sum + recoveryValue(state, id), 0) / template.focus.length;
      const repeatPenalty = template.id === lastTemplate ? 10 : 0;
      const fitCount = templateExercises(template, state).length;
      const equipmentAdjustment = fitCount ? Math.min(8, fitCount * 1.5) : -40;
      return { template, score: average - repeatPenalty + equipmentAdjustment, fitCount };
    });
    const lowContext = (state.daily.energy != null && state.daily.energy <= 2) || (state.daily.stress != null && state.daily.stress >= 4);
    if (bodyScore < 52 || lowContext) {
      const restore = TEMPLATES.find(template => template.id === 'restore');
      candidates.push({ template: restore, score: Math.max(72, bodyScore + 18) + Math.min(8, templateExercises(restore, state).length * 1.5), fitCount: templateExercises(restore, state).length });
    }
    candidates.sort((a, b) => b.score - a.score);
    let selected = candidates[0].template;
    let plannedExercises = templateExercises(selected, state);
    if (!plannedExercises.length && selected.id !== 'restore') {
      selected = TEMPLATES.find(template => template.id === 'restore');
      plannedExercises = templateExercises(selected, state);
    }
    const contextDelta = (state.daily.energy == null ? 0 : (state.daily.energy - 3) * 2) - (state.daily.stress == null ? 0 : Math.max(0, state.daily.stress - 3) * 3);
    const compatibility = clamp(round(candidates[0].score + contextDelta), 42, 100);
    const availableTime = Number(state.daily.time) || 45;
    const maxExercises = availableTime <= 25 ? 3 : availableTime <= 40 ? 4 : 5;
    const reduceSets = lowContext || availableTime <= 25;
    const exercises = plannedExercises.slice(0, maxExercises).map(exercise => {
      return { ...exercise, sets: Math.max(2, exercise.sets - (reduceSets ? 1 : 0)) };
    });
    const duration = Math.min(selected.duration, availableTime + (availableTime < 30 ? 0 : 6));
    const equipment = equipmentProfile(state.profile);
    const reasons = [];
    if (!state.sessions.length) reasons.push('Parte de un estado basal sin fatiga registrada.');
    else reasons.push(`${selected.focus.map(id => MUSCLES[id].name).join(', ')} presentan la mejor disponibilidad combinada.`);
    if (state.daily.checkedAt) reasons.push(`Se adaptó a ${availableTime} minutos y a tu check-in de hoy.`);
    else reasons.push('Puedes completar un check-in breve para ajustar duración y exigencia.');
    if (selected.restorative) reasons.push('Hoy conviene proteger la adherencia y facilitar la recuperación.');
    if (equipment.modeId !== 'gym' || equipment.selected.length < EQUIPMENT_MODE_BY_ID.gym.equipment.length) reasons.push(`Sesión filtrada para ${equipment.label.toLowerCase()}.`);
    return { id: selected.id, title: selected.title, focus: selected.focus, compatibility, duration, intensity: selected.intensity, exercises, reasons, equipmentMode: equipment.modeId, equipmentLabel: equipment.label, equipment: equipment.selected, equipmentSummary: equipment.selectedLabels.join(' · ') };
  }

  function updateDaily(state, patch) {
    state.daily = { ...state.daily, ...patch, checkedAt: now() };
    save(state);
    return state;
  }

  function makeSet(exercise, index) {
    const firstRep = parseInt(exercise.reps, 10) || 10;
    return { id: `${exercise.id}_${index}`, weight: exercise.weight, reps: firstRep, rir: 2, done: false };
  }

  function startWorkout(state, options = {}) {
    const plan = options.plan || planForToday(state);
    const exerciseIds = options.exerciseIds;
    const suppliedExercises = Array.isArray(options.exercises) ? options.exercises.filter(Boolean) : null;
    const exercises = suppliedExercises || (exerciseIds ? exerciseIds.map(id => EXERCISE_BY_ID[id]).filter(Boolean) : plan.exercises);
    const customSelection = suppliedExercises || exerciseIds;
    const title = options.title || (customSelection ? (exercises.length === 1 ? exercises[0].name : 'Sesión personalizada') : plan.title);
    state.activeWorkout = {
      id: uid('workout'),
      templateId: options.templateId || plan.id || 'custom',
      title,
      compatibility: plan.compatibility || 100,
      startedAt: now(),
      currentExercise: 0,
      exercises: exercises.map(exercise => ({
        ...clone(exercise),
        setsData: Array.from({ length: exercise.sets || 3 }, (_, index) => makeSet(exercise, index))
      }))
    };
    save(state);
    return state.activeWorkout;
  }

  function updateWorkoutSet(state, exerciseIndex, setIndex, patch) {
    const set = state.activeWorkout?.exercises?.[exerciseIndex]?.setsData?.[setIndex];
    if (!set) return null;
    if (patch.weight != null) set.weight = clamp(Number(patch.weight) || 0, 0, 500);
    if (patch.reps != null) set.reps = clamp(round(patch.reps), 1, 100);
    if (patch.rir != null) set.rir = clamp(round(patch.rir), 0, 5);
    if (patch.done != null) set.done = Boolean(patch.done);
    save(state);
    return set;
  }

  function setCurrentExercise(state, index) {
    if (!state.activeWorkout) return;
    state.activeWorkout.currentExercise = clamp(index, 0, state.activeWorkout.exercises.length - 1);
    save(state);
  }

  function finishWorkout(state) {
    const workout = state.activeWorkout;
    if (!workout) return { error: 'No hay un entrenamiento activo.' };
    const completed = workout.exercises.flatMap(exercise => exercise.setsData.filter(set => set.done).map(set => ({ exercise, set })));
    if (!completed.length) return { error: 'Completa al menos una serie antes de finalizar.' };
    const readinessBefore = readiness(state);
    const loadByMuscle = Object.fromEntries(Object.keys(MUSCLES).map(id => [id, 0]));
    let totalVolume = 0;
    completed.forEach(({ exercise, set }) => {
      const effectiveWeight = set.weight > 0 ? set.weight : 22;
      const setVolume = effectiveWeight * set.reps;
      const effort = 2.7 + Math.log10(setVolume + 1) * 2.25 + (4 - clamp(set.rir, 0, 4)) * 0.85;
      totalVolume += setVolume;
      exercise.primary.forEach(id => { loadByMuscle[id] += effort; });
      exercise.secondary.forEach(id => { loadByMuscle[id] += effort * 0.42; });
    });
    const timestamp = now();
    const changes = {};
    Object.entries(loadByMuscle).forEach(([id, load]) => {
      if (load <= 0) return;
      const muscle = state.muscles[id];
      const before = round(muscle.recovery);
      const drop = clamp(round(load * 0.7 * (1 + muscle.fatigueCumulative / 180)), 5, 44);
      const after = clamp(before - drop, 14, 100);
      muscle.recovery = after;
      muscle.fatigueAcute = 100 - after;
      muscle.fatigueCumulative = clamp(muscle.fatigueCumulative * 0.72 + drop, 0, 100);
      muscle.lastStimulus = timestamp;
      muscle.recentLoad = round(muscle.recentLoad * 0.45 + load * 10);
      muscle.recoveryHours = Math.ceil((100 - after) / 1.42);
      muscle.trend = after < before ? 'fatiga reciente' : 'estable';
      muscle.risk = after < 45 || muscle.fatigueCumulative > 62 ? 'alto' : after < 70 ? 'medio' : 'bajo';
      muscle.confidence = clamp(Math.round((muscle.confidence + 0.08) * 100) / 100, 0.3, 0.92);
      muscle.initialized = true;
      muscle.updatedAt = timestamp;
      changes[id] = { before, after, drop, load: round(load) };
    });
    const durationMin = Math.max(1, round((timestamp - workout.startedAt) / 60000));
    const session = {
      id: workout.id,
      templateId: workout.templateId,
      title: workout.title,
      startedAt: workout.startedAt,
      endedAt: timestamp,
      durationMin,
      sets: completed.length,
      volume: round(totalVolume),
      exercises: workout.exercises.map(exercise => ({ id: exercise.id, name: exercise.name, completedSets: exercise.setsData.filter(set => set.done).length })),
      changes,
      readinessBefore
    };
    state.sessions.unshift(session);
    state.sessions = state.sessions.slice(0, 100);
    const snapshot = {
      id: uid('snapshot'),
      timestamp,
      sessionId: session.id,
      overall: overallRecovery(state),
      muscles: Object.fromEntries(Object.entries(state.muscles).map(([id, muscle]) => [id, round(muscle.recovery)]))
    };
    state.snapshots.push(snapshot);
    state.snapshots = state.snapshots.slice(-180);
    session.readinessAfter = readiness(state);
    state.lastResult = { sessionId: session.id, changes, readinessBefore, readinessAfter: session.readinessAfter, createdAt: timestamp };
    state.activeWorkout = null;
    save(state);
    return { session, changes };
  }

  function updateProfile(state, patch) {
    state.profile = { ...state.profile, ...patch };
    const equipment = equipmentProfile(state.profile);
    state.profile.equipmentMode = equipment.modeId;
    state.profile.equipment = equipment.selected;
    state.profile.trainingPlace = equipment.modeId === 'gym' ? 'Gimnasio' : 'Casa';
    save(state);
    return state;
  }

  function setEquipmentMode(state, modeId) {
    const mode = EQUIPMENT_MODE_BY_ID[modeId] || EQUIPMENT_MODE_BY_ID.gym;
    state.profile.equipmentMode = mode.id;
    state.profile.equipment = [...mode.equipment];
    state.profile.trainingPlace = mode.id === 'gym' ? 'Gimnasio' : 'Casa';
    save(state);
    return state;
  }

  function toggleEquipment(state, equipmentId) {
    if (!EQUIPMENT_BY_ID[equipmentId] || equipmentId === 'bodyweight' || equipmentModeId(state.profile) === 'bodyweight') return state;
    const current = equipmentProfile(state.profile).selected;
    const next = current.includes(equipmentId) ? current.filter(id => id !== equipmentId) : [...current, equipmentId];
    state.profile.equipment = next.length ? next : ['bodyweight'];
    save(state);
    return state;
  }

  function toggleConnection(state, key) {
    if (!(key in state.connections)) return state;
    state.connections[key] = !state.connections[key];
    save(state);
    return state;
  }

  function markLoggedOut(state) {
    state.onboardingComplete = false;
    save(state);
  }

  window.ArevysCore = {
    VERSION,
    MUSCLES,
    EXERCISES,
    TEMPLATES,
    EQUIPMENT_MODES,
    EQUIPMENT_OPTIONS,
    load,
    save,
    completeOnboarding,
    updateDaily,
    updateProfile,
    equipmentProfile,
    exerciseAvailable,
    setEquipmentMode,
    toggleEquipment,
    toggleConnection,
    statusForMuscle,
    stateLabel,
    overallRecovery,
    readiness,
    planForToday,
    startWorkout,
    updateWorkoutSet,
    setCurrentExercise,
    finishWorkout,
    applyPassiveRecovery,
    nutritionTargets,
    nutritionSummary,
    recordNutritionMeal,
    addNutritionWater,
    removeNutritionMeal,
    updateNutritionPantry,
    markLoggedOut,
    clone,
    clamp
  };
})();
