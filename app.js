'use strict';

const Core = window.ArevysCore;
let appState = Core.load();

const steps = [
  { eyebrow: 'AREVYS / TU SISTEMA', title: 'Tu próxima versión\ncomienza aquí.', description: 'Construyamos un plan que se adapte a tu cuerpo, tu ritmo y tu realidad.', action: 'CONFIGURAR MI PLAN' },
  { eyebrow: '01 / OBJETIVO', title: '¿Qué quieres\nconseguir?', description: 'Tu objetivo define el punto de partida de tu evolución.', options: ['Perder grasa','Ganar músculo','Aumentar fuerza','Mejorar rendimiento'] },
  { eyebrow: '02 / PUNTO DE PARTIDA', title: '¿Dónde estás\nhoy?', description: 'Así ajustamos la intensidad para que avances con confianza.', options: ['Estoy comenzando','Estoy retomando','Entreno regularmente','Nivel avanzado'] },
  { eyebrow: '03 / RUTINA', title: 'Diseñemos tu\nsemana ideal.', description: 'Elige por separado cuántos días entrenas y dónde lo harás.', groups: [{ key: 'frequency', label: 'FRECUENCIA SEMANAL', options: ['2–3 días','4 días','5+ días'] }, { key: 'location', label: 'LUGAR DE ENTRENAMIENTO', options: ['Casa','Gimnasio','Ambos'] }] },
  { eyebrow: '04 / TUS DATOS', title: 'Conozcamos tu\npunto de partida.', description: 'Estos datos permiten personalizar cargas, métricas y objetivos.', fields: true },
  { eyebrow: '05 / NUTRICIÓN', title: '¿Cómo alimentas\ntu evolución?', description: 'Tu plan debe encajar con tus hábitos y preferencias.', options: ['Sin dieta específica','Omnívora','Vegetariana','Vegana'] },
  { eyebrow: '06 / CUIDADO', title: 'Entrena fuerte.\nEntrena con inteligencia.', description: 'Cuéntanos si debemos considerar una lesión o limitación.', options: ['Lesiones','Limitaciones','Ambas','Nada que informar'], professionalAction: true },
  { eyebrow: '07 / TU AVATAR', title: 'Elige quién\nacompañará tu camino.', description: 'Tu plan ya tiene un mapa. Ahora elige quién lo hará avanzar.', avatar: true }
];

const introState = { progress: 0, target: 0, step: 0, answers: {}, avatar: appState.profile.avatar || 'Helena', raf: 0, frame: -1, startedAt: 0, stepStartedAt: 0 };
let introRenderToken = 0;
const frame = document.querySelector('#introFrame');
const copy = document.querySelector('#introCopy');
const brand = document.querySelector('#introBrand');
const rail = document.querySelector('#railFill');
const count = document.querySelector('#stepCount');
const intro = document.querySelector('#intro');
const home = document.querySelector('#home');
const hit = document.querySelector('#introHitArea');
const dashboardContent = document.querySelector('#dashboardContent');
const appNav = document.querySelector('#appNav');
const toast = document.querySelector('#toast');
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[character]);

function trackEvent(name, properties = {}) {
  console.log('[AREVYS_ANALYTICS]', name, properties);
}

const introFields = [
  { key: 'age', label: 'EDAD', unit: 'años', min: 12, max: 100, step: 1, inputmode: 'numeric', placeholder: 'Ej: 35' },
  { key: 'weight', label: 'PESO', unit: 'kg', min: 30, max: 300, step: 0.1, inputmode: 'decimal', placeholder: 'Ej: 72.5' },
  { key: 'height', label: 'ALTURA', unit: 'cm', min: 100, max: 250, step: 1, inputmode: 'numeric', placeholder: 'Ej: 175' }
];

function introFieldValue(key) {
  const legacy = { age: 'Edad', weight: 'Peso (kg)', height: 'Altura (cm)' }[key];
  return introState.answers[key] ?? introState.answers[legacy] ?? '';
}

function validIntroField(field, value) {
  const number = Number(value);
  return value !== '' && Number.isFinite(number) && number >= field.min && number <= field.max;
}

function introStepIsValid(stepIndex = introState.step) {
  const data = steps[stepIndex];
  if (data.fields) return introFields.every(field => validIntroField(field, introFieldValue(field.key)));
  if (data.groups) return data.groups.every(group => Boolean(introState.answers[group.key]));
  if (data.options) return Boolean(introState.answers[stepIndex]);
  return true;
}

function introValidationMessage() {
  const data = steps[introState.step];
  if (!data) return '';
  if (data.groups) return 'Selecciona una frecuencia y un lugar para continuar.';
  if (data.fields) return 'Completa edad, peso y altura con valores válidos para continuar.';
  if (data.options) return 'Elige una opción para continuar.';
  return '';
}

function refreshIntroValidation(message = '') {
  const next = copy.querySelector('[data-next]');
  if (next) {
    const disabled = !introStepIsValid();
    next.disabled = disabled;
    next.classList.toggle('is-disabled', disabled);
    next.setAttribute('aria-disabled', String(disabled));
  }
  const validation = copy.querySelector('[data-intro-validation]');
  if (validation) validation.textContent = message;
  copy.querySelectorAll('[data-field-input]').forEach(input => {
    const definition = introFields.find(field => field.key === input.dataset.fieldInput);
    const invalid = input.value !== '' && !validIntroField(definition, input.value);
    const item = input.closest('.field-item');
    if (item) item.classList.toggle('is-invalid', invalid);
    const error = item?.querySelector('.field-error');
    if (error) error.textContent = invalid ? `Usa ${definition.min}–${definition.max} ${definition.unit}.` : '';
  });
}

function introChoice(option, selected, key = introState.step) {
  return `<button class="option ${selected ? 'is-selected' : ''}" data-option="${esc(option)}" data-option-key="${esc(key)}" aria-pressed="${selected}">${esc(option)}${selected ? ' ✓' : ''}</button>`;
}

function renderCopy() {
  const data = steps[introState.step];
  const renderToken = ++introRenderToken;
  copy.classList.add('is-changing');
  window.setTimeout(() => {
    if (renderToken !== introRenderToken) return;
    const choices = (data.options || []).map(option => introChoice(option, introState.answers[introState.step] === option)).join('');
    const groups = (data.groups || []).map(group => `<section class="option-group" aria-labelledby="group-${esc(group.key)}"><h2 id="group-${esc(group.key)}">${esc(group.label)}</h2><div class="options">${group.options.map(option => introChoice(option, introState.answers[group.key] === option, group.key)).join('')}</div></section>`).join('');
    const fields = data.fields ? introFields.map(field => { const value = introFieldValue(field.key); const invalid = value !== '' && !validIntroField(field, value); return `<label class="field-item ${invalid ? 'is-invalid' : ''}"><span class="field-label">${field.label}</span><div><input type="number" data-field-input="${field.key}" value="${esc(value)}" min="${field.min}" max="${field.max}" step="${field.step}" inputmode="${field.inputmode}" placeholder="${field.placeholder}" aria-label="${field.label.toLowerCase()}" aria-describedby="${field.key}-error" autocomplete="off"><b>${field.unit}</b></div><small id="${field.key}-error" class="field-error">${invalid ? `Usa ${field.min}–${field.max} ${field.unit}.` : ''}</small></label>`; }).join('') : '';
    const validation = `<p class="intro-validation" data-intro-validation aria-live="polite"></p>`;
    const actions = data.avatar ? '<button class="button button--primary btn-final-plan" data-finish>VER MI PLAN</button>' : `<div class="actions">${introState.step ? '<button class="button button--ghost btn-back" data-back aria-label="Volver al paso anterior"><span aria-hidden="true">‹</span><b>ATRÁS</b></button>' : ''}<button class="button button--primary" data-next>${data.action || 'CONTINUAR →'}</button></div>${validation}`;
    if (data.avatar) {
      copy.className = 'intro__copy avatar-copy';
      copy.innerHTML = `<div class="eyebrow">${data.eyebrow}</div><h1 class="title">${data.title}</h1><p class="avatar-hint">Toca un avatar para seleccionarlo.</p><div class="avatars" data-avatar-track><img src="assets/images/avatars_arevys_v5.png" alt="Aquiles y Helena" loading="lazy"><button class="avatar-hit ${introState.avatar === 'Aquiles' ? 'is-selected--aquiles' : ''}" data-avatar="Aquiles" aria-label="Elegir Aquiles"></button><button class="avatar-hit ${introState.avatar === 'Helena' ? 'is-selected--helena' : ''}" data-avatar="Helena" aria-label="Elegir Helena"></button></div><p class="avatar-scroll-hint">Desliza para ver más opciones <span aria-hidden="true">→</span></p><div class="avatar-dots" role="tablist" aria-label="Seleccionar avatar"><button class="avatar-dot ${introState.avatar === 'Aquiles' ? 'is-active' : ''}" data-avatar-dot="Aquiles" role="tab" aria-selected="${introState.avatar === 'Aquiles'}" aria-label="Mostrar Aquiles"></button><button class="avatar-dot ${introState.avatar === 'Helena' ? 'is-active' : ''}" data-avatar-dot="Helena" role="tab" aria-selected="${introState.avatar === 'Helena'}" aria-label="Mostrar Helena"></button></div><div class="avatar-names"><button class="aquiles ${introState.avatar === 'Aquiles' ? 'is-selected' : ''}" data-avatar="Aquiles">${introState.avatar === 'Aquiles' ? '✓ ' : ''}AQUILES</button><button class="helena ${introState.avatar === 'Helena' ? 'is-selected' : ''}" data-avatar="Helena">${introState.avatar === 'Helena' ? '✓ ' : ''}HELENA</button></div>${actions}`;
    } else {
      copy.className = `intro__copy ${data.fields || data.groups ? 'intro__copy--form' : ''}`;
      copy.innerHTML = `<div class="eyebrow">${data.eyebrow}</div><h1 class="title">${data.title}</h1><p class="description">${data.description}</p>${choices ? `<div class="options">${choices}</div>` : ''}${groups}${fields ? `<div class="data-grid fields-group">${fields}</div>` : ''}${data.professionalAction ? '<p class="professional-action">¿Prefieres atención personalizada? <button type="button" data-professional-chat>Hablar con un profesional →</button></p>' : ''}${actions}`;
    }
    refreshIntroValidation();
    copy.classList.remove('is-changing');
  }, 120);
}

function updateIntro() {
  introState.progress += (introState.target - introState.progress) * 0.17;
  if (Math.abs(introState.target - introState.progress) > 0.0002) introState.raf = requestAnimationFrame(updateIntro);
  else { introState.progress = introState.target; introState.raf = 0; }
  const nextStep = Math.min(steps.length - 1, Math.floor(introState.progress * steps.length));
  const nextFrame = Math.round(introState.progress * 239);
  if (nextFrame !== introState.frame) {
    introState.frame = nextFrame;
    frame.src = `assets/intro_frames/frame_${String(nextFrame).padStart(3,'0')}.webp`;
    warmFrames(nextFrame);
  }
  rail.style.width = `${Math.max(4, introState.progress * 100)}%`;
  rail.style.height = '100%';
  rail.closest('[role="progressbar"]')?.setAttribute('aria-valuenow', String(Math.round(introState.progress * 100)));
  brand.style.opacity = Math.max(0, 1 - introState.progress * 9);
  if (nextStep !== introState.step) {
    trackEvent('onboarding_step_view', { step: nextStep + 1, total: steps.length });
    introState.step = nextStep;
    introState.stepStartedAt = Date.now();
    count.textContent = `${String(nextStep + 1).padStart(2,'0')} / 08`;
    syncUrlState();
    vibrate(10);
    renderCopy();
  }
}

function moveIntroTo(step) {
  const targetStep = Math.max(0, Math.min(steps.length - 1, step));
  if (targetStep > introState.step && !introStepIsValid()) {
    refreshIntroValidation(introValidationMessage());
    vibrate(8);
    return;
  }
  if (targetStep > introState.step) trackEvent('onboarding_continue', { fromStep: introState.step + 1, durationMs: Date.now() - introState.stepStartedAt });
  if (targetStep < introState.step) trackEvent('onboarding_back', { fromStep: introState.step + 1 });
  introState.target = Math.max(0, Math.min(0.94, (targetStep + 0.5) / steps.length));
  if (!introState.raf) introState.raf = requestAnimationFrame(updateIntro);
}

function warmFrames(center) {
  for (let offset = -4; offset < 7; offset += 1) {
    const index = Math.max(0, Math.min(239, center + offset));
    const image = new Image(); image.decoding = 'async';
    image.src = `assets/intro_frames/frame_${String(index).padStart(3,'0')}.webp`;
  }
}

copy.addEventListener('click', event => {
  const option = event.target.closest('[data-option]');
  const avatar = event.target.closest('[data-avatar]');
  const dot = event.target.closest('[data-avatar-dot]');
  if (option) {
    const key = option.dataset.optionKey || String(introState.step);
    introState.answers[key] = option.dataset.option;
    trackEvent('onboarding_option_select', { step: introState.step + 1, option: option.dataset.option });
    renderCopy();
  }
  if (avatar || dot) { introState.avatar = (avatar || dot).dataset.avatar || (avatar || dot).dataset.avatarDot; trackEvent('onboarding_avatar_select', { avatar: introState.avatar }); vibrate(15); renderCopy(); }
  if (event.target.closest('[data-professional-chat]')) { openProfessionalChat(); return; }
  if (event.target.closest('[data-next]')) moveIntroTo(Math.min(steps.length - 1, introState.step + 1));
  if (event.target.closest('[data-back]')) moveIntroTo(Math.max(0, introState.step - 1));
  if (event.target.closest('[data-finish]')) finishIntro();
});

copy.addEventListener('input', event => {
  const field = event.target.closest('[data-field-input]');
  if (!field) return;
  introState.answers[field.dataset.fieldInput] = field.value;
  refreshIntroValidation();
});

copy.addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  const field = event.target.closest('[data-field-input]');
  if (field && !introStepIsValid()) { event.preventDefault(); refreshIntroValidation(introValidationMessage()); }
});

let startY = 0;
let startTarget = 0;
hit.addEventListener('pointerdown', event => { startY = event.clientY; startTarget = introState.target; hit.setPointerCapture(event.pointerId); });
hit.addEventListener('pointermove', event => {
  if (!hit.hasPointerCapture(event.pointerId)) return;
  const proposedTarget = Math.max(0, Math.min(0.94, startTarget + (startY - event.clientY) / window.innerHeight * 0.76));
  const proposedStep = Math.min(steps.length - 1, Math.floor(proposedTarget * steps.length));
  if (proposedStep > introState.step && (!introStepIsValid() || proposedStep > introState.step + 1)) return;
  introState.target = proposedTarget;
  if (!introState.raf) introState.raf = requestAnimationFrame(updateIntro);
});
function endIntroGesture(event) {
  if (!hit.hasPointerCapture(event.pointerId)) return;
  hit.releasePointerCapture(event.pointerId);
  moveIntroTo(Math.round(introState.target * steps.length - 0.5));
}
hit.addEventListener('pointerup', endIntroGesture);
hit.addEventListener('pointercancel', endIntroGesture);
window.addEventListener('wheel', event => {
  if (intro.hidden) return;
  event.preventDefault();
  moveIntroTo(introState.step + (event.deltaY > 0 ? 1 : -1));
}, { passive: false });
hit.addEventListener('keydown', event => {
  if (event.key === 'ArrowDown' || event.key === 'PageDown') { event.preventDefault(); moveIntroTo(introState.step + 1); }
  if (event.key === 'ArrowUp' || event.key === 'PageUp') { event.preventDefault(); moveIntroTo(introState.step - 1); }
});

const ui = {
  view: appState.activeWorkout ? 'workout' : 'today',
  recoveryTab: 'general', bodyView: 'front', selectedMuscle: 'cuadriceps', resultBodyView: 'front', historyRange: 30,
  libraryFilter: 'Todos', libraryQuery: '', librarySelected: null, libraryLimit: 24,
  libraryAvatar: appState.profile.avatar === 'Aquiles' ? 'Aquiles' : 'Helena',
  nutritionTab: 'summary', nutritionSearch: '', nutritionPantryText: '', nutritionMealType: 'Almuerzo', nutritionSelectedFood: null,
  checkinOpen: false, checkinDraft: {}, aiMessages: [],
  workoutPaused: false, workoutPauseStartedAt: 0, workoutPausedTotal: 0,
  restDuration: 75, restStartedAt: 0, restRemaining: 0
};

const bodyBaseCache = new Map();
const urlViews = new Set(['today','plan','workout','result','recovery','evolution','library','nutrition','ai','more','profile']);
function syncUrlState() {
  const params = new URLSearchParams(location.search);
  if (intro.hidden) {
    params.set('view', ui.view);
    if (ui.view === 'nutrition') params.set('nutritionTab', ui.nutritionTab); else params.delete('nutritionTab');
    params.delete('introStep');
  } else {
    params.set('introStep', String(introState.step + 1));
    params.delete('view'); params.delete('nutritionTab');
  }
  history.replaceState(null, '', `${location.pathname}?${params.toString()}${location.hash}`);
}
function restoreUrlState() {
  const params = new URLSearchParams(location.search);
  if (urlViews.has(params.get('view'))) ui.view = params.get('view');
  if (ui.view === 'nutrition' && ['summary','explore','recipes','day','log'].includes(params.get('nutritionTab'))) ui.nutritionTab = params.get('nutritionTab');
}
const LOCAL_LIBRARY_PAGE_SIZE = 24;
const localLibrary = { status: 'loading', connected: false, source: '', total: 0, exercises: [], error: '' };
const nutritionRemote = { foodStatus: 'idle', foods: [], foodError: '', recipeStatus: 'idle', recipes: [], recipeError: '' };
const LOCAL_GROUPS = {
  abs: { label: 'Core', primary: ['abdominales'], secondary: [] },
  back: { label: 'Espalda', primary: ['dorsales'], secondary: ['biceps'] },
  biceps: { label: 'Bíceps', primary: ['biceps'], secondary: [] },
  calves: { label: 'Pantorrillas', primary: ['pantorrillas'], secondary: [] },
  cardio: { label: 'Cardio', primary: ['cuadriceps'], secondary: ['gluteos','pantorrillas'] },
  chest: { label: 'Pecho', primary: ['pectorales'], secondary: ['triceps','deltoides'] },
  forearms: { label: 'Antebrazos', primary: ['biceps'], secondary: ['triceps'] },
  hips: { label: 'Piernas y glúteos', primary: ['gluteos'], secondary: ['isquiotibiales','cuadriceps'] },
  mix: { label: 'Cuerpo completo', primary: ['abdominales','cuadriceps'], secondary: ['gluteos','deltoides'] },
  shoulders: { label: 'Hombros', primary: ['deltoides'], secondary: ['triceps'] },
  trapezius: { label: 'Trapecio', primary: ['dorsales'], secondary: ['deltoides'] },
  triceps: { label: 'Tríceps', primary: ['triceps'], secondary: [] }
};

function inferEquipment(name) {
  const value = name.toLowerCase();
  if (value.includes('smith')) return 'Máquina Smith';
  if (value.includes('dumbbell')) return 'Mancuernas';
  if (value.includes('barbell')) return 'Barra';
  if (value.includes('kettlebell')) return 'Kettlebell';
  if (value.includes('cable')) return 'Polea';
  if (value.includes('band')) return 'Banda elástica';
  if (value.includes('lever') || value.includes('machine')) return 'Máquina';
  if (value.includes('bench')) return 'Banco';
  if (/push-up|pull-up|sit-up|crunch|plank|bridge|stretch/.test(value)) return 'Peso corporal';
  return 'Según demostración';
}

function inferMuscles(groupKey, name) {
  const value = name.toLowerCase();
  const base = LOCAL_GROUPS[groupKey] || { primary: ['abdominales'], secondary: [] };
  let primary = [...base.primary], secondary = [...base.secondary];

  if (/calf|plantar flexion/.test(value)) { primary = ['pantorrillas']; secondary = []; }
  else if (/glute|hip thrust|hip extension|abduction/.test(value)) { primary = ['gluteos']; secondary = ['isquiotibiales']; }
  else if (/hamstring|leg curl|romanian|stiff leg/.test(value)) { primary = ['isquiotibiales']; secondary = ['gluteos','dorsales']; }
  else if (/squat|lunge|leg press|leg extension|step-up/.test(value)) { primary = ['cuadriceps','gluteos']; secondary = ['isquiotibiales']; }
  else if (/chest|bench press|push-up|fly|pec deck/.test(value)) { primary = ['pectorales']; secondary = ['triceps','deltoides']; }
  else if (/row|pulldown|pull-down|pull-up|chin-up/.test(value)) { primary = ['dorsales']; secondary = ['biceps']; }
  else if (/lateral raise|shoulder press|front raise|rear delt/.test(value)) { primary = ['deltoides']; secondary = ['triceps']; }
  else if (/triceps|pushdown|skull crusher/.test(value)) { primary = ['triceps']; secondary = []; }
  else if (/biceps|curl/.test(value) && groupKey === 'biceps') { primary = ['biceps']; secondary = []; }

  primary = [...new Set(primary)].filter(id => Core.MUSCLES[id]);
  secondary = [...new Set(secondary)].filter(id => Core.MUSCLES[id] && !primary.includes(id));
  return { primary, secondary };
}

function normalizeLocalExercise(item) {
  const groupKey = String(item.group || '').toLowerCase();
  const group = LOCAL_GROUPS[groupKey] || { label: item.group || 'Otros', primary: ['abdominales'], secondary: [] };
  const muscles = inferMuscles(groupKey,item.name || '');
  const cardio = groupKey === 'cardio';
  const equipment = inferEquipment(item.name || '');
  return {
    id: item.id,
    name: item.name || 'Ejercicio sin nombre',
    originalName: item.name || '',
    group: group.label,
    sourceGroup: item.group || '',
    equipment,
    level: 'Demostración local',
    sets: 3,
    reps: cardio ? '30 s' : '10–12',
    weight: 0,
    rest: cardio ? 45 : 75,
    primary: muscles.primary,
    secondary: muscles.secondary,
    cue: 'Observa la trayectoria completa en la demostración y registra peso, repeticiones y RIR para actualizar tu mapa corporal.',
    avatar: item.avatar === 'men' ? 'Aquiles' : 'Helena',
    mediaUrl: item.mediaUrl,
    mediaType: item.extension === '.gif' ? 'image' : 'video',
    source: 'local',
    searchText: `${item.name || ''} ${item.group || ''} ${group.label} ${equipment}`.toLowerCase()
  };
}

async function loadLocalExerciseLibrary() {
  localLibrary.status = 'loading';
  try {
    const response = await fetch('/api/exercise-library',{ cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    localLibrary.connected = Boolean(payload.connected);
    localLibrary.source = payload.source || '';
    localLibrary.total = Number(payload.count) || 0;
    localLibrary.exercises = (payload.exercises || []).map(normalizeLocalExercise);
    localLibrary.status = localLibrary.connected ? 'ready' : 'missing';
    localLibrary.error = payload.message || '';
  } catch (error) {
    localLibrary.connected = false;
    localLibrary.status = 'error';
    localLibrary.error = 'La biblioteca local no está disponible. Inicia AREVYS desde su servidor local.';
  }
  if (!home.hidden && ui.view === 'library') renderDashboard();
}

function libraryExercisesForAvatar() {
  if (localLibrary.status === 'ready' && localLibrary.exercises.length) {
    return localLibrary.exercises.filter(exercise => exercise.avatar === ui.libraryAvatar);
  }
  return Core.EXERCISES;
}

function findLibraryExercise(id) {
  return localLibrary.exercises.find(exercise => exercise.id === id) || Core.EXERCISES.find(exercise => exercise.id === id);
}

function vibrate(pattern) { if (appState.preferences?.haptics && navigator.vibrate) navigator.vibrate(pattern); }
function showToast(message) {
  toast.textContent = message; toast.classList.add('is-visible');
  window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

function icon(name) {
  const paths = {
    today: '<path d="M4 12a8 8 0 1 0 16 0 8 8 0 1 0-16 0Z"/><path d="M8 12h8M12 8v8"/>',
    plan: '<path d="M4 18V7l8-3 8 3v11l-8 3-8-3Z"/><path d="m8 12 2.2 2.2L16 8.8"/>',
    body: '<path d="M9 4c0 2 1 3 3 3s3-1 3-3M8 8c-2 3-2 7-1 12M16 8c2 3 2 7 1 12M12 7v13M7 12h10"/>',
    evolution: '<path d="M4 18V6M4 18h16"/><path d="m7 15 4-4 3 2 5-6"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    spark: '<path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z"/><path d="m18 16 .7 2.3L21 19l-2.3.7L18 22l-.7-2.3L15 19l2.3-.7L18 16Z"/>',
    sleep: '<path d="M19 15.5A8 8 0 0 1 8.5 5 7.5 7.5 0 1 0 19 15.5Z"/>',
    recovery: '<path d="M12 3a9 9 0 1 0 8.5 6M12 7v5l3 2"/><path d="M17 3h4v4"/>',
    energy: '<path d="m13 2-7 12h6l-1 8 7-12h-6l1-8Z"/>',
    nutrition: '<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/><path d="M16 2v4"/>',
    stress: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
    time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    home: '<path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10M9 20v-6h6v6"/>',
    dumbbells: '<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10M3 10h2M3 14h2M19 10h2M19 14h2"/>',
    barbell: '<path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12M2 10h4M2 14h4M18 10h4M18 14h4"/>',
    machine: '<path d="M7 4h5v5H7zM9 9v6M6 20h12M12 15h5v5M5 12h8"/>',
    bands: '<path d="M6 4c6 3 6 13 12 16M18 4C12 7 12 17 6 20"/><circle cx="6" cy="4" r="2"/><circle cx="18" cy="20" r="2"/>',
    mat: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
    library: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z"/><path d="M8 16h11M9 8h6M9 11h6"/>',
    profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-5 3.5-7 8-7s7.2 2 8 7"/>',
    link: '<path d="M10 13a4 4 0 0 0 5.7 0l2.5-2.5a4 4 0 0 0-5.7-5.7L11 6.3"/><path d="M14 11a4 4 0 0 0-5.7 0l-2.5 2.5a4 4 0 0 0 5.7 5.7l1.5-1.5"/>',
    check: '<path d="m5 12 4 4L19 6"/>', play: '<path d="m8 5 11 7-11 7V5Z"/>', close: '<path d="m6 6 12 12M18 6 6 18"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.spark}</svg>`;
}

function aquilesVisual(context = 'today') {
  const upper = context === 'today' || context === 'decision';
  const decision = context === 'decision';
  const src = decision
     ? 'assets/images/coach/aquiles-shirtless-decision-v1-cutout.png?v=65'
    : upper
       ? 'assets/images/coach/aquiles-shirtless-upper-v1-cutout.png?v=65'
       : 'assets/images/coach/aquiles-shirtless-front-v1-cutout.png?v=65';
  const variant = decision ? 'aquiles-photo--decision' : upper ? 'aquiles-photo--upper' : '';
  return `<img class="aquiles-photo ${variant}" src="${src}" alt="Aquiles, coach sin polera y con pantalón corto" loading="lazy">`;
}
function aquilesPresence(context = 'today') {
  const copy = context === 'workout'
    ? ['AQUILES / GUÍA DE SESIÓN','Mira la técnica antes de comenzar.','La demostración de este ejercicio te acompaña en cada serie.']
    : context === 'library'
      ? ['AQUILES EN ACCIÓN','Demostraciones con criterio.','Explora los ejercicios que Aquiles mostrará en tus rutinas.']
      : context === 'nutrition'
        ? ['AQUILES / COACH NUTRICIONAL','Tu alimentación también entrena.','Elige una comida que ayude a sostener tu energía y recuperación.']
        : ['AQUILES / ENTRENADOR','Tu técnica, más clara.','Las demostraciones de tus ejercicios estarán guiadas por Aquiles.'];
  return `<aside class="aquiles-presence aquiles-presence--${context}" aria-label="${copy[0]}"><div class="aquiles-presence__visual">${aquilesVisual(context)}</div><div class="aquiles-presence__copy"><span class="micro-label">${copy[0]}</span><strong>${copy[1]}</strong><p>${copy[2]}</p><small>SIN POLERA · PANTALÓN CORTO</small></div></aside>`;
}
function aquilesDecisionNote() {
  return `<aside class="aquiles-decision-note" aria-label="Consejo de Aquiles"><div class="aquiles-decision-note__coach">${aquilesVisual('decision')}</div><div class="aquiles-decision-note__speech"><span class="micro-label">AQUILES / CONSEJO</span><p>Elegí este plan porque hoy tu cuerpo tiene mejor disponibilidad aquí.</p><small>ENTRENA CON CONTROL</small></div></aside>`;
}

function muscleIcon(id) {
  const paths = {
    pectorales: '<path d="M12 6v12M11.3 8C8 5.8 4.2 6.8 3.8 11c-.3 3.2 2.7 5.2 7.5 5.4M12.7 8c3.3-2.2 7.1-1.2 7.5 3 .3 3.2-2.7 5.2-7.5 5.4M4.2 10.5c2.1 1.4 4.4 1.8 6.4 1.5M19.8 10.5c-2.1 1.4-4.4 1.8-6.4 1.5"/>',
    deltoides: '<path d="M3.7 14.8c.2-4.3 2.3-7.5 6.1-8.2 1.1 2.6.9 5.7-.6 8.8-1.5 2.9-3.5 3.3-5.5-.6ZM20.3 14.8c-.2-4.3-2.3-7.5-6.1-8.2-1.1 2.6-.9 5.7.6 8.8 1.5 2.9 3.5 3.3 5.5-.6Z"/>',
    biceps: '<path d="M8.2 5.2c2.7.4 4.5 2.2 4.4 4.8-.1 1.8-1.3 3.1-2.8 4.2l2.7 2.7c2.4.1 4.4-1.1 5.2-3.5M9.4 14.4 6.1 18.8M12.5 16.8l3.4 1.7M8.2 5.2 6.7 8.7"/>',
    triceps: '<path d="M8.2 5.2c2.8.5 4.3 2.8 4.2 5.5-.1 2.8-1.9 5-3.6 6.8M8.2 5.2 6 9.1M12.4 10.7l3.2 4.7M8.8 17.5 6.3 20M15.6 15.2l2.2 3.7"/>',
    abdominales: '<path d="M8.3 4.8c2.5-1.1 4.9-1.1 7.4 0l1 14.1c-3.1 1.5-6.1 1.5-9.2 0l.8-14.1ZM12 5v14M8 8.7h8M8 12.3h8M8.3 15.8h7.4"/>',
    cuadriceps: '<path d="M8.5 4.2c2.1 2.5 2.8 5.6 2.1 9.1L9.3 20M15.5 4.2c-2.1 2.5-2.8 5.6-2.1 9.1l1.3 6.7M11.5 4v8M12.5 4v8M7.7 8.2h3.1M13.2 8.2h3.1"/>',
    pantorrillas: '<path d="M8.4 4.2c-1.5 3.5-1.7 7.2-.6 10.3.7 2 1 3.6.2 5.5M15.6 4.2c1.5 3.5 1.7 7.2.6 10.3-.7 2-1 3.6-.2 5.5M8.1 10.2h3M12.9 10.2h3"/>',
    isquiotibiales: '<path d="M8.3 4.2c-1.2 4.2-1 8.3.5 11.8l1.4 4M15.7 4.2c1.2 4.2 1 8.3-.5 11.8l-1.4 4M8.1 11.7c1.1 1 2.3 1.4 3.6 1.2M15.9 11.7c-1.1 1-2.3 1.4-3.6 1.2"/>',
    dorsales: '<path d="M12 3.8v16.4M11.3 6.3C8.1 6.6 4.8 9 4.1 13.2c-.5 3.2 1.5 5.2 4.8 4.1l3.1-3.8M12.7 6.3c3.2.3 6.5 2.7 7.2 6.9.5 3.2-1.5 5.2-4.8 4.1L12 13.5M6.2 9.2l4.6 2.8M17.8 9.2l-4.6 2.8"/>',
    gluteos: '<path d="M12 5v14M11.5 7.2C8.2 5.9 5.5 7.9 5.8 11.5c.3 3.3 2.2 5.1 5.6 5.2 1-.9 1.3-2.2.1-3.8M12.5 7.2c3.3-1.3 6 .7 5.7 4.3-.3 3.3-2.2 5.1-5.6 5.2-1-.9-1.3-2.2-.1-3.8"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">${paths[id] || paths.abdominales}</svg>`;
}

function navGroup(view) {
  if (['plan','workout','result','library'].includes(view)) return 'plan';
  if (view === 'nutrition') return 'nutrition';
  if (view === 'recovery') return 'recovery';
  if (view === 'evolution') return 'evolution';
  if (['more','ai','profile'].includes(view)) return 'more';
  return 'today';
}
function renderNav() {
  const active = navGroup(ui.view);
  const items = [['today','today','Hoy'],['plan','plan','Entrenar'],['nutrition','nutrition','Nutrición'],['recovery','body','Cuerpo'],['evolution','evolution','Evolución'],['more','more','Más']];
  appNav.innerHTML = items.map(([view,symbol,label]) => `<button class="app-nav__item ${active === view ? 'is-active' : ''}" data-dashboard="${view}" aria-current="${active === view ? 'page' : 'false'}" aria-label="Abrir ${label}"><i aria-hidden="true">${icon(symbol)}</i><span>${label}</span></button>`).join('');
}
function dashboardHeader(back = null) {
  const avatar = appState.profile.avatar === 'Aquiles' ? 'is-aquiles' : 'is-helena';
  return `<header class="dashboard__topbar">${back ? `<button class="dashboard__back btn-back" data-dashboard="${back}" aria-label="Volver">‹</button>` : '<span class="dashboard__spacer"></span>'}<img src="assets/images/arevys_intro_logo.png" alt="AREVYS"><button class="dashboard__avatar ${avatar}" data-dashboard="profile" aria-label="Abrir perfil"><span></span></button></header>`;
}
function profileName() { return appState.profile.name?.trim() || appState.profile.avatar || 'Atleta'; }
function formatDate(timestamp, options = {}) { return new Intl.DateTimeFormat('es-CL', { day:'numeric', month:'short', ...options }).format(new Date(timestamp)); }
function formatDuration(minutes) { return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`; }
function screenTitle(eyebrow,title,subtitle) { return `<p class="dashboard__eyebrow">${eyebrow}</p><h1 class="dashboard__title">${title}</h1>${subtitle ? `<p class="dashboard__subtitle">${subtitle}</p>` : ''}`; }
function signalCard(iconName,label,value,note,status='neutral') {
  const empty = value === '—' || note === 'Sin dato' || note === 'Sin check-in';
  return `<article class="signal-card ${empty ? 'is-empty' : ''}" data-state="${status}"><i>${icon(iconName)}</i><div><span>${label}</span>${empty ? '<strong>Sin registro</strong><small>Completa tu check-in para darle contexto a tu día.</small><button class="empty-action" data-open-checkin>HACER CHECK-IN</button>' : `<strong>${value}</strong><small>${note}</small>`}</div></article>`;
}
function todayMetric(iconName,label,value,note,status='neutral') { return `<div class="today-metric" data-state="${status}"><i>${icon(iconName)}</i><span><b>${label}</b><strong>${value}</strong><small>${note}</small></span><em></em></div>`; }

const NUTRITION_FALLBACK_FOODS = [
  { id:'food-oats', name:'Avena con yogur y frutos rojos', brand:'AREVYS BASE', mealType:'Desayuno', calories:420, protein:25, carbs:58, fats:10, fiber:8, source:'local' },
  { id:'food-chicken', name:'Pechuga de pollo a la plancha', brand:'AREVYS BASE', mealType:'Almuerzo', calories:280, protein:52, carbs:0, fats:6, fiber:0, source:'local' },
  { id:'food-rice', name:'Arroz cocido, porción', brand:'AREVYS BASE', mealType:'Almuerzo', calories:205, protein:4, carbs:45, fats:0, fiber:1, source:'local' },
  { id:'food-eggs', name:'Huevos enteros, dos unidades', brand:'AREVYS BASE', mealType:'Desayuno', calories:144, protein:13, carbs:1, fats:10, fiber:0, source:'local' },
  { id:'food-protein-yogurt', name:'Yogur alto en proteína', brand:'AREVYS BASE', mealType:'Colación', calories:160, protein:20, carbs:12, fats:3, fiber:0, source:'local' },
  { id:'food-banana', name:'Plátano mediano', brand:'AREVYS BASE', mealType:'Colación', calories:105, protein:1, carbs:27, fats:0, fiber:3, source:'local' },
  { id:'food-tuna', name:'Atún al agua, lata', brand:'AREVYS BASE', mealType:'Almuerzo', calories:132, protein:29, carbs:0, fats:1, fiber:0, source:'local' },
  { id:'food-potato', name:'Papa cocida, porción', brand:'AREVYS BASE', mealType:'Almuerzo', calories:161, protein:4, carbs:37, fats:0, fiber:4, source:'local' },
  { id:'food-avocado', name:'Palta, media unidad', brand:'AREVYS BASE', mealType:'Desayuno', calories:160, protein:2, carbs:9, fats:15, fiber:7, source:'local' },
  { id:'food-bread', name:'Pan integral, dos rebanadas', brand:'AREVYS BASE', mealType:'Desayuno', calories:180, protein:8, carbs:32, fats:3, fiber:5, source:'local' },
  { id:'food-milk', name:'Leche descremada, vaso', brand:'AREVYS BASE', mealType:'Desayuno', calories:90, protein:9, carbs:13, fats:0, fiber:0, source:'local' },
  { id:'food-beef', name:'Carne magra a la plancha', brand:'AREVYS BASE', mealType:'Almuerzo', calories:310, protein:42, carbs:0, fats:15, fiber:0, source:'local' },
  { id:'food-salmon', name:'Salmón al horno', brand:'AREVYS BASE', mealType:'Cena', calories:280, protein:30, carbs:0, fats:17, fiber:0, source:'local' },
  { id:'food-lentils', name:'Lentejas cocidas, porción', brand:'AREVYS BASE', mealType:'Almuerzo', calories:230, protein:18, carbs:40, fats:1, fiber:16, source:'local' },
  { id:'food-chickpeas', name:'Garbanzos cocidos, porción', brand:'AREVYS BASE', mealType:'Cena', calories:269, protein:15, carbs:45, fats:4, fiber:12, source:'local' },
  { id:'food-peanut', name:'Mantequilla de maní, cucharada', brand:'AREVYS BASE', mealType:'Colación', calories:95, protein:4, carbs:3, fats:8, fiber:1, source:'local' },
  { id:'food-apple', name:'Manzana mediana', brand:'AREVYS BASE', mealType:'Colación', calories:95, protein:0, carbs:25, fats:0, fiber:4, source:'local' },
  { id:'food-whey', name:'Proteína en polvo, porción', brand:'AREVYS BASE', mealType:'Colación', calories:120, protein:24, carbs:4, fats:2, fiber:1, source:'local' },
  { id:'food-salad', name:'Ensalada de hojas y tomate', brand:'AREVYS BASE', mealType:'Cena', calories:75, protein:3, carbs:12, fats:2, fiber:4, source:'local' },
  { id:'food-olive-oil', name:'Aceite de oliva, cucharada', brand:'AREVYS BASE', mealType:'Cena', calories:119, protein:0, carbs:0, fats:14, fiber:0, source:'local' }
];

const NUTRITION_FALLBACK_RECIPES = [
  { id:'recipe-pasta-proteica', name:'Pasta proteica post-entreno', category:'Recuperación', calories:642, protein:41, carbs:78, fats:18, time:'30 min', difficulty:'Fácil', tags:['Proteína','Energía'], description:'Una comida completa para recuperar después de entrenar.', ingredients:['Pasta integral','Pechuga de pollo','Tomate','Espinaca','Aceite de oliva'], source:'local' },
  { id:'recipe-quinoa-pollo', name:'Bowl de quinoa y pollo', category:'Equilibrio', calories:560, protein:44, carbs:58, fats:16, time:'25 min', difficulty:'Fácil', tags:['Proteína','Fibra'], description:'Proteína y carbohidratos medidos para sostener tu día.', ingredients:['Quinoa','Pollo','Palta','Zanahoria','Hojas verdes'], source:'local' },
  { id:'recipe-yogur-avena', name:'Yogur, avena y frutos rojos', category:'Desayuno', calories:390, protein:27, carbs:49, fats:9, time:'8 min', difficulty:'Fácil', tags:['Rápido','Proteína'], description:'Una opción simple cuando necesitas empezar con energía.', ingredients:['Yogur alto en proteína','Avena','Frutos rojos','Semillas'], source:'local' },
  { id:'recipe-tostada-atun', name:'Tostadas de atún y palta', category:'Cena', calories:470, protein:35, carbs:36, fats:20, time:'12 min', difficulty:'Fácil', tags:['Saciadora','Rápido'], description:'Una cena práctica con grasas y proteína de buena densidad.', ingredients:['Pan integral','Atún','Palta','Limón','Tomate'], source:'local' }
];

function nutritionRecipes() { return [...NUTRITION_FALLBACK_RECIPES, ...nutritionRemote.recipes.filter(remote => !NUTRITION_FALLBACK_RECIPES.some(local => local.name.toLowerCase() === String(remote.name || '').toLowerCase()))].slice(0,8); }
function nutritionFoods() { return nutritionRemote.foods.length ? nutritionRemote.foods : NUTRITION_FALLBACK_FOODS; }
function nutritionFindFood(id) { return nutritionFoods().find(food => food.id === id) || NUTRITION_FALLBACK_FOODS.find(food => food.id === id); }
function nutritionFindRecipe(id) { return nutritionRecipes().find(recipe => recipe.id === id) || NUTRITION_FALLBACK_RECIPES.find(recipe => recipe.id === id); }
function nutritionImage(recipe) { return recipe.image ? `<img src="${esc(recipe.image)}" alt="Vista previa de ${esc(recipe.name)}" loading="lazy">` : `<i>${icon('nutrition')}</i>`; }
function nutritionPercent(value,target) { return Math.min(100, Math.max(0, Math.round((Number(value) || 0) / Math.max(1,Number(target) || 1) * 100))); }
function nutritionApiStrip() { return `<div class="nutrition-api-strip"><span><i>${icon('link')}</i><b>FUENTES NUTRICIONALES CONECTADAS</b><small>USDA FoodData · Open Food Facts · TheMealDB</small></span><em>LOCAL + API</em></div>`; }
function nutritionTabs() { return `<nav class="nutrition-tabs" aria-label="Secciones de nutrición">${[['summary','Resumen'],['explore','Explorar'],['recipes','Recetas'],['day','Estado'],['log','Registrar']].map(([key,label]) => `<button class="${ui.nutritionTab === key ? 'is-active' : ''}" data-nutrition-tab="${key}">${label}</button>`).join('')}</nav>`; }
function nutritionMacro(key,label,value,target,unit,color) { const pct = nutritionPercent(value,target); return `<article class="nutrition-macro" style="--macro-color:${color}"><div><span>${label}</span><strong>${Math.round(value || 0)}<small>${unit}</small></strong></div><i><b style="width:${pct}%"></b></i><em>${pct}% del objetivo</em></article>`; }
function nutritionRecipeCard(recipe, featured = false) { return `<article class="nutrition-recipe-card ${featured ? 'is-featured' : ''}"><button data-nutrition-select-recipe="${esc(recipe.id)}"><div class="nutrition-recipe-card__visual">${nutritionImage(recipe)}<span>${esc(recipe.category || 'AREVYS')}</span></div><div class="nutrition-recipe-card__copy"><span class="micro-label">${recipe.source === 'themealdb' ? 'THEMEALDB · RECETA' : 'AREVYS · RECETA'}</span><h3>${esc(recipe.name)}</h3><p>${esc(recipe.description || 'Una opción alineada con tu estado y disponibilidad de hoy.')}</p><div><b>${recipe.calories} kcal</b><span>${recipe.protein} g proteína</span><span>${recipe.time || '15 min'}</span></div></div></button></article>`; }
function nutritionFoodResult(food) { return `<article class="nutrition-food-result"><i>${icon('nutrition')}</i><div><span>${esc(food.brand || food.source || 'FUENTE ABIERTA')}</span><h3>${esc(food.name)}</h3><p>${food.calories} kcal · ${food.protein} g proteína · ${food.carbs} g carbohidratos</p></div><button data-nutrition-select-food="${esc(food.id)}">AGREGAR</button></article>`; }
function nutritionContextCard(summary, plan) { return `<section class="nutrition-context-card"><header><div><span class="micro-label">CONEXIÓN CON TU GEMELO DIGITAL</span><h2>Lo que tu cuerpo necesita hoy</h2></div><span class="nutrition-context-score">${summary.score}<small>/100</small></span></header><div class="nutrition-context-grid"><div><i>${icon('energy')}</i><b>ENERGÍA DISPONIBLE</b><strong>${summary.percentages.calories}%</strong><small>del objetivo diario</small></div><div><i>${icon('body')}</i><b>COBERTURA PROTEICA</b><strong>${summary.percentages.protein}%</strong><small>${summary.consumed.protein}/${summary.targets.protein} g</small></div><div><i>${icon('recovery')}</i><b>RECUPERACIÓN</b><strong>${Core.readiness(appState)}%</strong><small>estado corporal</small></div><div><i>${icon('check')}</i><b>ADHERENCIA</b><strong>${summary.adherence}%</strong><small>${summary.meals.length} registros hoy</small></div></div><p>El plan ${esc(plan.title)} y estas recomendaciones comparten el mismo estado vivo de AREVYS.</p></section>`; }
function nutritionSummaryPanel(summary, plan) { const recipes = nutritionRecipes().slice(0,3); const waterPct = nutritionPercent(summary.waterMl,summary.targets.waterMl); return `<button class="nutrition-pantry-cta" data-nutrition-tab="explore"><i>${icon('nutrition')}</i><span><b>¿Qué tienes disponible?</b><small>Busca un alimento o escanea tu despensa para generar opciones.</small></span><strong>→</strong></button><section class="nutrition-water-card"><div><span class="micro-label">HIDRATACIÓN</span><h2>${(summary.waterMl / 1000).toFixed(1)} <small>/ ${(summary.targets.waterMl / 1000).toFixed(1)} L</small></h2><p>Una señal simple para acompañar la recuperación.</p></div><div class="nutrition-water-ring" style="--water-progress:${waterPct * 3.6}deg"><strong>${waterPct}%</strong></div><button data-nutrition-water="250">+250 ml</button></section><div class="nutrition-section-heading"><h2>Sugerencias para ti</h2><button data-nutrition-tab="recipes">VER RECETAS →</button></div><section class="nutrition-recipe-grid">${recipes.map((recipe,index) => nutritionRecipeCard(recipe,index === 0)).join('')}</section>${nutritionContextCard(summary,plan)}${aquilesPresence('nutrition')}<section class="nutrition-meals"><header><h2>Registro de hoy</h2><button data-nutrition-tab="log">AÑADIR</button></header>${summary.meals.length ? summary.meals.slice(0,3).map(meal => `<article><i>${icon('nutrition')}</i><div><b>${esc(meal.title)}</b><span>${esc(meal.mealType)} · ${meal.calories} kcal · ${meal.protein} g proteína</span></div><button class="nutrition-meal-remove" data-nutrition-remove-meal="${esc(meal.id)}" aria-label="Eliminar ${esc(meal.title)}">×</button></article>`).join('') : '<p class="nutrition-empty">Todavía no hay comidas registradas. Comienza con una opción de la biblioteca o agrega lo que tienes en casa.</p>'}</section>`; }
function nutritionExplorePanel() { const summary = Core.nutritionSummary(appState), query = ui.nutritionSearch.trim().toLowerCase(); const results = nutritionFoods().filter(food => !query || `${food.name} ${food.brand || ''}`.toLowerCase().includes(query)); const visible = results.slice(0,8); const pantry = summary.pantry.map(item => `<span>${esc(item)}</span>`).join(''); return `<section class="nutrition-pantry-editor"><header><div><span class="micro-label">DISPONIBILIDAD REAL</span><h2>¿Qué tienes en casa?</h2></div><i>${icon('nutrition')}</i></header><div class="nutrition-pantry-input"><input data-nutrition-pantry-input value="${esc(ui.nutritionPantryText)}" placeholder="Ej: pollo, arroz, huevos" aria-label="Alimentos disponibles"><button data-nutrition-pantry-add>AÑADIR</button></div>${pantry ? `<div class="nutrition-pantry-chips">${pantry}</div>` : '<p>Agrega ingredientes para que el motor pueda cruzar tus opciones con tu entrenamiento de hoy.</p>'}</section><section class="nutrition-search-card"><div class="nutrition-search-row"><i>${icon('library')}</i><input data-nutrition-search value="${esc(ui.nutritionSearch)}" placeholder="Buscar alimento, marca o ingrediente" aria-label="Buscar alimento"><button data-nutrition-search-submit>${icon('arrow')}</button></div><div class="nutrition-filter-chips"><button data-nutrition-query="pollo">Proteína</button><button data-nutrition-query="avena">Desayuno</button><button data-nutrition-query="arroz">Carbohidratos</button><button data-nutrition-query="yogur">Rápido</button></div></section><div class="nutrition-results-heading"><span>${nutritionRemote.foodStatus === 'loading' ? 'CONSULTANDO FUENTES…' : `${visible.length} RESULTADOS`}</span><small>USDA + Open Food Facts + base AREVYS</small></div><section class="nutrition-food-list">${visible.length ? visible.map(nutritionFoodResult).join('') : '<p class="nutrition-empty">No encontramos coincidencias. Prueba con otro ingrediente.</p>'}</section>`; }
function nutritionRecipesPanel() { const recipes = nutritionRecipes(); return `<section class="nutrition-recipes-intro"><span class="micro-label">MOTOR DE RECETAS AREVYS</span><h2>Comidas compatibles con tu día</h2><p>El motor cruza tu objetivo, el entrenamiento previsto y lo que llevas registrado. Son opciones editables, no una dieta rígida.</p></section><section class="nutrition-recipe-stack">${recipes.map((recipe,index) => nutritionRecipeCard(recipe,index === 0)).join('')}</section>`; }
function nutritionLogPanel() { const selected = ui.nutritionSelectedFood; return `<section class="nutrition-log-card"><span class="micro-label">REGISTRO INTELIGENTE</span><h2>${selected ? 'Confirma esta comida' : 'Añade lo que comiste'}</h2><p>${selected ? 'La entrada alimentará el resumen de hoy y la explicación de AREVYS.' : 'El registro no busca perfección: busca contexto útil para tomar mejores decisiones.'}</p><div class="nutrition-meal-types">${['Desayuno','Almuerzo','Cena','Colación'].map(type => `<button class="${ui.nutritionMealType === type ? 'is-active' : ''}" data-nutrition-meal-type="${type}">${type}</button>`).join('')}</div>${selected ? `<article class="nutrition-selected-food"><i>${icon('nutrition')}</i><div><b>${esc(selected.name)}</b><span>${selected.calories} kcal · ${selected.protein} g proteína · ${selected.carbs} g carbohidratos · ${selected.fats} g grasas</span></div></article><button class="primary-cta" data-nutrition-register-selected>${icon('check')} REGISTRAR ${ui.nutritionMealType.toUpperCase()}</button><button class="secondary-cta" data-nutrition-clear-selection>CAMBIAR ALIMENTO</button>` : `<button class="nutrition-pantry-cta" data-nutrition-tab="explore"><i>${icon('library')}</i><span><b>Buscar en las fuentes</b><small>USDA FoodData, Open Food Facts y la base local AREVYS.</small></span><strong>→</strong></button><div class="nutrition-quick-log"><span class="micro-label">OPCIONES RÁPIDAS</span>${NUTRITION_FALLBACK_FOODS.slice(0,3).map(food => `<button data-nutrition-select-food="${food.id}"><b>${esc(food.name)}</b><small>${food.calories} kcal · ${food.protein} g proteína</small></button>`).join('')}</div>`}</section>`; }
function nutritionDayPanel(summary) { return `<section class="nutrition-day-card"><header><div><span class="micro-label">ESTADO NUTRICIONAL DEL DÍA</span><h2>${summary.score}% de cobertura útil</h2></div><span>${summary.meals.length} comidas</span></header><div class="nutrition-day-bars">${[['calories','Calorías','kcal'],['protein','Proteína','g'],['carbs','Carbohidratos','g'],['fats','Grasas','g']].map(([key,label,unit]) => `<div><span>${label}</span><b>${summary.consumed[key] || 0} ${unit}</b><i><em style="width:${summary.percentages[key]}%"></em></i></div>`).join('')}</div><div class="nutrition-water-line"><span>Agua</span><b>${(summary.waterMl / 1000).toFixed(1)} L / ${(summary.targets.waterMl / 1000).toFixed(1)} L</b><i><em style="width:${summary.percentages.water}%"></em></i></div></section><section class="nutrition-explanation"><i>${icon('spark')}</i><div><span class="micro-label">LECTURA AREVYS</span><p>${summary.percentages.protein < 45 ? 'Tu cobertura proteica todavía es baja para el objetivo del día. Una comida con proteína completa puede mejorar la recuperación sin complicar tu rutina.' : 'Tu registro ya da contexto suficiente para ajustar energía, proteína e hidratación junto con tu estado corporal.'}</p></div></section>`; }
function nutritionLayout() { const summary = Core.nutritionSummary(appState), plan = Core.planForToday(appState), target = summary.targets; return `<article class="dashboard nutrition-screen">${dashboardHeader()}${screenTitle('NUTRICIÓN / GEMELO DIGITAL','Decisiones que alimentan tu evolución.','El motor cruza tu objetivo, tu entrenamiento y lo que tienes disponible hoy.')}${nutritionApiStrip()}<section class="nutrition-hero"><div><span class="micro-label">RESUMEN DEL DÍA</span><h2>${summary.consumed.calories} <small>/ ${target.calories} kcal</small></h2><strong>${summary.score}% <span>PUNTAJE AREVYS</span></strong><p>${summary.remainingCalories ? `Te quedan ${summary.remainingCalories} kcal estimadas para completar tu objetivo.` : 'Tu registro ya cubre el objetivo energético estimado.'}</p></div><div class="nutrition-score-ring" style="--nutrition-progress:${summary.score * 3.6}deg"><strong>${summary.score}</strong><span>/100</span><small>ESTADO</small></div></section><section class="nutrition-macro-grid">${nutritionMacro('protein','PROTEÍNA',summary.consumed.protein,target.protein,'g','#79dc59')}${nutritionMacro('carbs','CARBOHIDRATOS',summary.consumed.carbs,target.carbs,'g','#80e3f1')}${nutritionMacro('fats','GRASAS',summary.consumed.fats,target.fats,'g','#e7bd55')}${nutritionMacro('fiber','FIBRA',summary.consumed.fiber,30,'g','#c99cff')}</section>${nutritionTabs()}${ui.nutritionTab === 'summary' ? nutritionSummaryPanel(summary,plan) : ui.nutritionTab === 'explore' ? nutritionExplorePanel() : ui.nutritionTab === 'recipes' ? nutritionRecipesPanel() : ui.nutritionTab === 'day' ? nutritionDayPanel(summary) : nutritionLogPanel()}</article>`; }

async function loadNutritionRecipes() {
  if (nutritionRemote.recipeStatus !== 'idle') return;
  nutritionRemote.recipeStatus = 'loading';
  try {
    const response = await fetch('/api/nutrition/recipes?query=chicken', { cache:'no-store' });
    const payload = await response.json();
    nutritionRemote.recipes = Array.isArray(payload.recipes) ? payload.recipes : [];
    nutritionRemote.recipeStatus = nutritionRemote.recipes.length ? 'ready' : 'empty';
  } catch (_) { nutritionRemote.recipeStatus = 'error'; }
  if (!home.hidden && ui.view === 'nutrition') renderDashboard();
}

async function searchNutritionFoods(query) {
  const clean = String(query || '').trim();
  ui.nutritionSearch = clean; ui.nutritionTab = 'explore';
  if (!clean) { nutritionRemote.foodStatus = 'idle'; nutritionRemote.foods = []; renderDashboard(); return; }
  nutritionRemote.foodStatus = 'loading'; nutritionRemote.foods = []; renderDashboard();
  try {
    const response = await fetch(`/api/nutrition/search?query=${encodeURIComponent(clean)}`, { cache:'no-store' });
    const payload = await response.json();
    nutritionRemote.foods = Array.isArray(payload.results) ? payload.results : [];
    nutritionRemote.foodStatus = nutritionRemote.foods.length ? 'ready' : 'empty';
  } catch (_) { nutritionRemote.foodStatus = 'error'; }
  if (!home.hidden && ui.view === 'nutrition') renderDashboard();
}

function todayLayout() {
  const ready = Core.readiness(appState), readyState = Core.stateLabel(ready), plan = Core.planForToday(appState);
  const hasBodyData = Object.values(appState.muscles).some(muscle => muscle.initialized);
  const initialized = Object.values(appState.muscles).filter(muscle => muscle.initialized);
  const muscularRecovery = initialized.length ? Math.round(initialized.reduce((sum,muscle) => sum + muscle.recovery,0) / initialized.length) : 100;
  const fatigue = 100 - muscularRecovery, recoveryState = Core.stateLabel(muscularRecovery), fatigueState = Core.stateLabel(100 - fatigue);
  const recommendationState = Core.stateLabel(plan.compatibility);
  const sleep = appState.daily.sleep == null ? '—' : `${appState.daily.sleep}%`;
  const energy = appState.daily.energy == null ? '—' : `${appState.daily.energy}/5`;
  const stress = appState.daily.stress == null ? '—' : `${appState.daily.stress}/5`;
  const recent = appState.sessions[0];
  return `<article class="dashboard today-screen">${dashboardHeader()}<div class="today-greeting"><span>${new Date().getHours() < 12 ? 'BUENOS DÍAS' : new Date().getHours() < 20 ? 'BUENAS TARDES' : 'BUENAS NOCHES'}</span><h1>${esc(profileName())}, esto es lo mejor<br>que puede hacer<br>tu cuerpo hoy.</h1></div><section class="state-hero" data-state="${readyState.key}"><div class="state-hero__copy"><span class="micro-label">PREPARACIÓN DE HOY</span><strong>${ready}%</strong><em>● ${hasBodyData ? readyState.label : 'PUNTO DE PARTIDA'}</em><p>${hasBodyData ? 'Calculado desde tu carga muscular, recuperación y contexto diario.' : 'Tu gemelo está neutro. El primer entrenamiento activará su estado muscular.'}</p></div><div class="today-metrics">${todayMetric('recovery','RECUPERACIÓN MUSCULAR',`${muscularRecovery}%`,muscularRecovery >= 70 ? 'Buena disponibilidad' : 'Necesita descanso',recoveryState.key)}${todayMetric('time','FATIGA',`${fatigue}%`,fatigue <= 30 ? 'Niveles bajos' : 'Carga elevada',fatigueState.key)}${todayMetric('energy','RECOMENDACIONES',plan.focus.slice(0,2).map(id => Core.MUSCLES[id]?.name || id).join(' · '),'Hidratación y descanso',recommendationState.key)}</div><canvas class="state-hero__body" width="400" height="800" data-body-canvas data-body-view="front" aria-label="Gemelo digital frontal"></canvas><span class="live-chip">ESTADO VIVO</span></section><button class="daily-checkin" data-open-checkin><span><i>${icon('spark')}</i><b>¿Cómo llegas hoy?</b><small>${appState.daily.checkedAt ? 'Actualizar cómo llegas hoy' : 'Completar check-in de 20 segundos'}</small></span><strong>→</strong></button>${aquilesPresence('today')}<section class="signal-grid">${signalCard('sleep','SUEÑO',sleep,appState.daily.sleep == null ? 'Sin dato' : 'Calidad estimada',appState.daily.sleep == null ? 'neutral' : Core.stateLabel(appState.daily.sleep).key)}${signalCard('energy','ENERGÍA',energy,appState.daily.energy == null ? 'Sin check-in' : 'Percibida',appState.daily.energy == null ? 'neutral' : Core.stateLabel(appState.daily.energy * 20).key)}${signalCard('stress','ESTRÉS',stress,appState.daily.stress == null ? 'Sin check-in' : 'Carga percibida',appState.daily.stress == null ? 'neutral' : Core.stateLabel((6 - appState.daily.stress) * 20).key)}</section><section class="opportunity-v2"><div class="opportunity-v2__head"><span class="micro-label">✦ MEJOR OPORTUNIDAD</span><strong>${plan.compatibility}% compatible</strong></div><h2>${plan.title}</h2><p>${plan.reasons[0]}</p><div class="opportunity-v2__meta"><span>${plan.duration} MIN</span><span>${plan.exercises.length} EJERCICIOS</span><span>${plan.intensity}</span></div><button class="primary-cta" data-start-workout>${icon('play')} COMENZAR ENTRENAMIENTO</button><button class="text-action" data-dashboard="plan">Ver decisión y ajustar plan →</button></section>${recent ? `<section class="recent-session"><span class="micro-label">ÚLTIMO REGISTRO · ${formatDate(recent.endedAt)}</span><div><strong>${esc(recent.title)}</strong><b>${recent.sets} series · ${recent.volume.toLocaleString('es-CL')} kg</b></div></section>` : ''}<section class="quick-grid"><button data-dashboard="recovery"><i>${icon('body')}</i><span><b>Mapa corporal</b><small>Estado por músculo</small></span></button><button data-dashboard="nutrition"><i>${icon('nutrition')}</i><span><b>Nutrición</b><small>Decisiones y recetas</small></span></button><button data-dashboard="ai"><i>${icon('spark')}</i><span><b>AREVYS AI</b><small>Entiende la decisión</small></span></button></section>${checkinLayout()}</article>`;
}

function checkinLayout() {
  if (!ui.checkinOpen) return '';
  const draft = ui.checkinDraft;
  const scale = (key,labels) => `<div class="checkin-question"><span>${labels.title}</span><div>${labels.values.map((label,index) => `<button class="${Number(draft[key]) === index + 1 ? 'is-active' : ''}" data-checkin-key="${key}" data-checkin-value="${index + 1}">${label}</button>`).join('')}</div></div>`;
  return `<div class="sheet-backdrop" data-close-checkin></div><section class="bottom-sheet checkin-sheet"><header><div><span class="micro-label">CONTEXTO DE HOY</span><h2>¿Cómo llegas?</h2></div><button data-close-checkin aria-label="Cerrar">${icon('close')}</button></header><p>Esto adapta la sesión; no altera artificialmente tu recuperación muscular.</p>${scale('energy',{title:'ENERGÍA',values:['Muy baja','Baja','Media','Buena','Alta']})}${scale('stress',{title:'ESTRÉS',values:['Muy bajo','Bajo','Medio','Alto','Muy alto']})}${scale('mood',{title:'ÁNIMO',values:['Bajo','Frágil','Neutro','Bueno','Muy bueno']})}<div class="checkin-question"><span>TIEMPO DISPONIBLE</span><div>${[20,30,45,60].map(value => `<button class="${Number(draft.time) === value ? 'is-active' : ''}" data-checkin-key="time" data-checkin-value="${value}">${value} min</button>`).join('')}</div></div><button class="primary-cta" data-save-checkin>ADAPTAR MI DÍA</button></section>`;
}

function muscleAvailability(id) {
  const muscle = appState.muscles[id], status = Core.statusForMuscle(muscle), value = muscle.initialized ? Math.round(muscle.recovery) : 100;
  return `<div class="availability-row" data-state="${status.key}"><span class="availability-row__icon">${muscleIcon(id)}</span><div><b>${Core.MUSCLES[id].name}</b><i><em style="width:${value}%"></em></i></div><strong>${muscle.initialized ? `${value}%` : 'BASE'}</strong><small>${status.label}</small></div>`;
}

function planLayout() {
  const plan = Core.planForToday(appState);
  return `<article class="dashboard plan-screen">${dashboardHeader('today')}${screenTitle('DECISIÓN AREVYS / HOY','Tu mejor oportunidad.','Una propuesta dinámica basada en el estado real de tu cuerpo.')}<section class="decision-card"><div class="decision-score"><strong>${plan.compatibility}</strong><span>%</span><small>COMPATIBILIDAD</small></div><div><span class="micro-label">PLAN INTELIGENTE</span><h2>${plan.title}</h2><p>${plan.reasons[0]}</p></div></section>${planEquipmentContext(plan)}<section class="why-card"><span class="micro-label">POR QUÉ ESTA DECISIÓN</span>${plan.reasons.map(reason => `<p>${icon('check')}<span>${esc(reason)}</span></p>`).join('')}${aquilesDecisionNote()}</section><div class="section-heading"><span>DISPONIBILIDAD MUSCULAR</span><button data-dashboard="recovery">VER MAPA</button></div><section class="availability-list">${plan.focus.map(muscleAvailability).join('')}</section><div class="section-heading"><span>TIEMPO DISPONIBLE</span><small>El plan se recalcula al instante</small></div><div class="time-selector">${[20,30,45,60].map(value => `<button class="${Number(appState.daily.time) === value ? 'is-active' : ''}" data-plan-time="${value}">${value}<small>MIN</small></button>`).join('')}</div><div class="section-heading"><span>ENTRENAMIENTO PROPUESTO</span><small>${plan.exercises.length} ejercicios · ${plan.duration} min</small></div><section class="exercise-plan-list">${plan.exercises.map((exercise,index) => `<article><span class="exercise-index">${String(index + 1).padStart(2,'0')}</span><div><b>${exercise.name}</b><small>${exercise.group} · ${exercise.equipment}</small></div><strong>${exercise.sets} × ${exercise.reps}</strong></article>`).join('')}</section><button class="primary-cta sticky-cta" data-start-workout>${icon('play')} COMENZAR SESIÓN</button><button class="secondary-cta" data-dashboard="library">CAMBIAR O VER EJERCICIOS</button></article>`;
}

function workoutLayout() {
  const workout = appState.activeWorkout;
  if (!workout) return planLayout();
  const index = workout.currentExercise || 0;
  const exercise = workout.exercises[index];
  const doneSets = workout.exercises.reduce((sum,item) => sum + item.setsData.filter(set => set.done).length,0);
  const totalSets = workout.exercises.reduce((sum,item) => sum + item.setsData.length,0);
  const muscles = [...exercise.primary,...exercise.secondary];
  const demonstration = exercise.mediaUrl
    ? (exercise.mediaType === 'image' ? `<img src="${esc(exercise.mediaUrl)}" alt="Demostración de ${esc(exercise.name)}">` : `<video src="${esc(exercise.mediaUrl)}" muted loop autoplay playsinline controls preload="metadata" aria-label="Demostración de ${esc(exercise.name)}"></video>`)
    : `${muscleIcon(exercise.primary[0])}<span>${exercise.group.toUpperCase()}</span>`;
  const restActive = ui.restRemaining > 0;
  return `<article class="dashboard workout-screen">${dashboardHeader('plan')}<header class="workout-status"><div><span class="micro-label">ENTRENAMIENTO ACTIVO</span><h1>${esc(workout.title)}</h1></div><div><strong id="workoutTimer">00:00</strong><small>${doneSets}/${totalSets} SERIES</small></div></header><section class="workout-timers"><article class="session-clock ${ui.workoutPaused ? 'is-paused' : ''}"><div><span>TIEMPO DE SESIÓN</span><strong id="workoutTimerLarge">00:00</strong></div><button data-workout-toggle>${ui.workoutPaused ? 'REANUDAR' : 'PAUSAR'}</button></article><article class="rest-clock ${restActive ? 'is-active' : ''}"><div><span>DESCANSO ENTRE SERIES</span><strong id="restTimer">${formatClock(ui.restRemaining)}</strong></div><div class="rest-clock__actions"><button data-rest-start>${restActive ? 'CONTINUAR' : 'INICIAR DESCANSO'}</button><button data-rest-reset aria-label="Reiniciar descanso">↺</button></div><nav>${[45,60,75,90].map(seconds => `<button class="${ui.restDuration === seconds ? 'is-selected' : ''}" data-rest-duration="${seconds}">${seconds}s</button>`).join('')}</nav></article></section><div class="workout-progress"><i style="width:${((index + 1) / workout.exercises.length) * 100}%"></i></div><nav class="exercise-rail">${workout.exercises.map((item,itemIndex) => `<button class="${itemIndex === index ? 'is-active' : ''} ${item.setsData.every(set => set.done) ? 'is-done' : ''}" data-workout-exercise="${itemIndex}"><span>${String(itemIndex + 1).padStart(2,'0')}</span>${esc(item.name)}</button>`).join('')}</nav><section class="exercise-focus"><div class="exercise-focus__visual ${exercise.mediaUrl ? 'has-media' : ''}">${demonstration}</div><div><span class="micro-label">EJERCICIO ${index + 1} DE ${workout.exercises.length}</span><h2>${esc(exercise.name)}</h2><p>${esc(exercise.cue)}</p><div class="muscle-tags">${muscles.map(id => `<span>${Core.MUSCLES[id].name}</span>`).join('')}</div></div></section>${aquilesPresence('workout')}<div class="set-head"><span>SERIE</span><span>KG</span><span>REPS</span><span>RIR</span><span>LISTA</span></div><section class="set-list">${exercise.setsData.map((set,setIndex) => `<div class="set-row ${set.done ? 'is-done' : ''}"><strong>${setIndex + 1}</strong><input inputmode="decimal" type="number" min="0" value="${set.weight}" data-set-field="weight" data-exercise-index="${index}" data-set-index="${setIndex}" aria-label="Peso serie ${setIndex + 1}"><input inputmode="numeric" type="number" min="1" value="${set.reps}" data-set-field="reps" data-exercise-index="${index}" data-set-index="${setIndex}" aria-label="Repeticiones serie ${setIndex + 1}"><input inputmode="numeric" type="number" min="0" max="5" value="${set.rir}" data-set-field="rir" data-exercise-index="${index}" data-set-index="${setIndex}" aria-label="RIR serie ${setIndex + 1}"><button class="set-check" data-set-done data-exercise-index="${index}" data-set-index="${setIndex}" aria-label="Completar serie">${icon('check')}</button></div>`).join('')}</section><section class="workout-note"><i>${icon('spark')}</i><p><b>Impacto en tiempo real</b>Las series completadas se convertirán en carga muscular al finalizar la sesión.</p></section><div class="workout-navigation"><button class="secondary-cta" data-exercise-step="-1" ${index === 0 ? 'disabled' : ''}>ANTERIOR</button>${index < workout.exercises.length - 1 ? '<button class="primary-cta" data-exercise-step="1">SIGUIENTE →</button>' : '<button class="primary-cta" data-finish-workout>FINALIZAR SESIÓN</button>'}</div>${index < workout.exercises.length - 1 ? '<button class="finish-link" data-finish-workout>Finalizar entrenamiento ahora</button>' : ''}</article>`;
}

function resultLayout() {
  const result = appState.lastResult;
  const session = result && appState.sessions.find(item => item.id === result.sessionId);
  if (!result || !session) return todayLayout();
  const changes = Object.entries(result.changes).sort((a,b) => b[1].drop - a[1].drop);
  const next = Core.planForToday(appState);
  return `<article class="dashboard result-screen">${dashboardHeader('today')}${screenTitle('SESIÓN REGISTRADA','Tu entrenamiento ya vive en tu cuerpo.','El gemelo digital y el siguiente plan se actualizaron con la carga real.')}<section class="result-body-card"><div class="body-switch"><button data-result-view="front" class="${ui.resultBodyView === 'front' ? 'is-active' : ''}">FRONTAL</button><button data-result-view="back" class="${ui.resultBodyView === 'back' ? 'is-active' : ''}">POSTERIOR</button></div><canvas width="400" height="800" data-body-canvas data-body-view="${ui.resultBodyView}" aria-label="Resultado corporal"></canvas><span class="result-readiness"><small>PREPARACIÓN</small><strong>${result.readinessAfter}%</strong><em>ANTES ${result.readinessBefore}%</em></span></section><section class="result-kpis"><div><strong>${session.sets}</strong><span>SERIES</span></div><div><strong>${session.volume.toLocaleString('es-CL')}</strong><span>KG MOVIDOS</span></div><div><strong>${formatDuration(session.durationMin)}</strong><span>DURACIÓN</span></div></section><div class="section-heading"><span>IMPACTO MUSCULAR</span><small>antes → ahora</small></div><section class="impact-list">${changes.map(([id,change]) => { const status = Core.statusForMuscle(appState.muscles[id]); return `<article data-state="${status.key}"><i>${muscleIcon(id)}</i><div><b>${Core.MUSCLES[id].name}</b><span>${status.label} · ${appState.muscles[id].recoveryHours} h estimadas</span></div><strong>${change.before}% <em>→</em> ${change.after}%</strong></article>`; }).join('')}</section><section class="next-decision"><span class="micro-label">SIGUIENTE DECISIÓN</span><h2>${next.title}</h2><p>${next.reasons[0]}</p><span>${next.compatibility}% compatible con tu nuevo estado</span></section><button class="primary-cta" data-dashboard="recovery">VER MI CUERPO ACTUALIZADO</button><button class="secondary-cta" data-dashboard="today">VOLVER A HOY</button></article>`;
}

function visibleMuscles(view = ui.bodyView) { return Object.keys(Core.MUSCLES).filter(id => Core.MUSCLES[id].views[view]); }
function recoveryNode(id) {
  const muscle = appState.muscles[id], meta = Core.MUSCLES[id], placement = meta.views[ui.bodyView], status = Core.statusForMuscle(muscle);
  const pct = muscle.initialized ? `${Math.round(muscle.recovery)}%` : '—';
  return `<button class="body-node body-node--${placement.side} node-${placement.slot} ${ui.selectedMuscle === id ? 'is-selected' : ''}" data-muscle="${id}" data-state="${status.key}"><i class="body-node__icon">${muscleIcon(id)}</i><span class="body-node__text"><b>${meta.name}</b><span>${status.label}<br>${pct}</span></span></button>`;
}
function signalStatus(value,invert=false) {
  if (value == null) return { key:'neutral',label:'SIN DATOS',color:'#7e9294' };
  return Core.stateLabel(invert ? (6 - value) * 20 : value);
}
function signalNode(kind,label,value,position,invert=false) {
  const status = signalStatus(value,invert);
  const shown = value == null ? '—' : kind === 'sleep' || kind === 'recovery' ? `${Math.round(value)}%` : kind === 'stress' ? `${value}/5` : `${Math.round(value)}%`;
  return `<button class="signal-node signal-node--${position}" data-state="${status.key}" style="--signal-color:${status.color}"><i>${icon(kind === 'activity' ? 'energy' : kind)}</i><span>${label}<em>${status.label} · ${shown}</em></span></button>`;
}
function statusLegend() { return '<section class="status-legend"><b>ESTADO DE CARGA</b><span><i></i>ÓPTIMO</span><span><i class="attention"></i>ATENCIÓN</span><span><i class="fatigue"></i>FATIGA</span><span><i class="neutral"></i>SIN DATOS</span></section>'; }
function recoveryTabs() { return `<div class="recovery-switch"><button data-recovery-tab="general" class="${ui.recoveryTab === 'general' ? 'is-active' : ''}">GENERAL</button><button data-recovery-tab="muscles" class="${ui.recoveryTab === 'muscles' ? 'is-active' : ''}">MÚSCULOS</button><button data-recovery-tab="history" class="${ui.recoveryTab === 'history' ? 'is-active' : ''}">HISTORIAL</button></div>`; }
function bodySwitch() { return `<div class="body-switch"><button data-body-view="front" class="${ui.bodyView === 'front' ? 'is-active' : ''}">FRONTAL</button><button data-body-view="back" class="${ui.bodyView === 'back' ? 'is-active' : ''}">POSTERIOR</button></div>`; }

function recoveryLayout() {
  if (ui.recoveryTab === 'history') return recoveryHistoryLayout();
  const selected = appState.muscles[ui.selectedMuscle], selectedMeta = Core.MUSCLES[ui.selectedMuscle], selectedStatus = Core.statusForMuscle(selected);
  const overall = Core.overallRecovery(appState);
  const hasData = Object.values(appState.muscles).some(muscle => muscle.initialized);
  const overallStatus = hasData ? Core.stateLabel(overall) : { key:'neutral',label:'PUNTO DE PARTIDA',color:'#7e9294' };
  const title = ui.recoveryTab === 'general' ? 'MAPA DE RECUPERACIÓN 2D' : 'RECUPERACIÓN POR MÚSCULO';
  const subtitle = ui.recoveryTab === 'general' ? 'Tu cuerpo hoy' : 'Selecciona un grupo muscular';
  const energyValue = appState.daily.energy == null ? null : appState.daily.energy * 20;
  const nodes = ui.recoveryTab === 'general'
    ? `${signalNode('sleep','SUEÑO',appState.daily.sleep,'sleep')}${signalNode('recovery','RECUPERACIÓN',hasData ? overall : null,'recovery')}${signalNode('stress','ESTRÉS',appState.daily.stress,'stress',true)}${signalNode('activity','ENERGÍA',energyValue,'activity')}${signalNode('energy','ADHERENCIA',appState.sessions.length ? Math.min(100,65 + appState.sessions.length * 5) : null,'nutrition')}`
    : visibleMuscles().map(recoveryNode).join('');
  const detail = ui.recoveryTab === 'general'
    ? `<aside class="recovery-detail recovery-detail--overall" data-state="${overallStatus.key}"><b>RECUPERACIÓN</b><span>${overallStatus.label}</span><strong>${hasData ? `${overall}%` : '—'}</strong><p>${appState.sessions.length ? 'Estado calculado con tus sesiones y recuperación transcurrida.' : 'El cuerpo permanece neutro hasta registrar actividad.'}</p></aside>`
    : `<aside class="recovery-detail" data-state="${selectedStatus.key}"><b>${selectedMeta.name}</b><span>${selectedStatus.label}</span><strong>${selected.initialized ? `${Math.round(selected.recovery)}%` : '—'}</strong><p>${selectedStatus.copy}</p>${selected.initialized ? `<small>${selected.recoveryHours} h estimadas · confianza ${Math.round(selected.confidence * 100)}%</small>` : ''}</aside>`;
  return `<article class="dashboard recovery-screen">${dashboardHeader('today')}${screenTitle('GEMELO DIGITAL / ESTADO VIVO',title,subtitle)}${recoveryTabs()}${ui.recoveryTab === 'muscles' ? bodySwitch() : ''}<section class="recovery-map recovery-map--${ui.recoveryTab}"><canvas class="anatomy-canvas" width="400" height="800" data-body-canvas data-body-view="${ui.bodyView}" aria-label="Mapa muscular interactivo"></canvas>${nodes}${detail}</section>${ui.recoveryTab === 'general' ? `<div class="recovery-score"><strong>${Core.readiness(appState)}</strong><span>PUNTAJE DE PREPARACIÓN</span><p>${appState.sessions.length ? 'Se actualiza con cada entrenamiento y hora de recuperación.' : 'Estado basal: aún no existe carga muscular registrada.'}</p></div>` : ''}${statusLegend()}<div class="recovery-actions"><button class="button button--ghost" data-dashboard="plan">VER PLAN</button><button class="compact-button" data-dashboard="library">REGISTRAR ACTIVIDAD</button></div></article>`;
}

function chartPoints(values,width=300,height=100) {
  if (!values.length) values = [100,100];
  if (values.length === 1) values = [values[0],values[0]];
  return values.map((value,index) => `${Math.round(index * width / (values.length - 1))},${Math.round(height - Core.clamp(value,0,100) / 100 * (height - 8))}`).join(' ');
}
function recoveryHistoryLayout() {
  const sessions = appState.sessions.filter(session => Date.now() - session.endedAt <= ui.historyRange * 86400000);
  const snapshots = appState.snapshots.filter(snapshot => Date.now() - snapshot.timestamp <= ui.historyRange * 86400000);
  const values = snapshots.map(snapshot => snapshot.overall), current = Core.overallRecovery(appState), first = values[0] ?? current, improvement = current - first;
  const rows = Object.keys(Core.MUSCLES).map(id => {
    const muscle = appState.muscles[id], status = Core.statusForMuscle(muscle), pct = muscle.initialized ? Math.round(muscle.recovery) : 100;
    return `<button class="history-row" data-muscle="${id}" data-state="${status.key}"><span class="history-row__dot"></span><b>${Core.MUSCLES[id].name}</b><i><em style="width:${pct}%"></em></i><strong>${muscle.initialized ? `${pct}%` : '—'}</strong><small>${status.label}</small></button>`;
  }).join('');
  return `<article class="dashboard recovery-screen history-screen">${dashboardHeader('today')}${screenTitle('GEMELO DIGITAL / TENDENCIA','HISTORIAL DE RECUPERACIÓN','Evolución real de tus grupos musculares')}${recoveryTabs()}<div class="history-range">${[7,30,90].map(value => `<button class="${ui.historyRange === value ? 'is-active' : ''}" data-history-range="${value}">${value} DÍAS</button>`).join('')}</div><section class="history-kpis"><div><span>RECUPERACIÓN MEDIA</span><strong>${current}%</strong></div><div><span>CAMBIO</span><strong>${improvement >= 0 ? '+' : ''}${improvement}%</strong></div><div><span>SESIONES</span><strong>${sessions.length}</strong></div></section><section class="history-chart"><b>Tendencia de recuperación</b><svg viewBox="0 0 300 110" preserveAspectRatio="none" aria-label="Tendencia de recuperación"><path d="M0 82H300M0 55H300M0 28H300"/><polyline points="${chartPoints(values,300,105)}"/></svg><span>${snapshots.length ? formatDate(snapshots[0].timestamp) : 'SIN REGISTROS'}</span><span>HOY</span></section><p class="section-label">HISTORIAL POR MÚSCULO</p><section class="history-list">${rows}</section>${statusLegend()}</article>`;
}

function evolutionLayout() {
  const sessions = [...appState.sessions].reverse(), readinessValues = sessions.map(session => session.readinessAfter ?? 100);
  const totalSets = sessions.reduce((sum,session) => sum + session.sets,0), totalVolume = sessions.reduce((sum,session) => sum + session.volume,0);
  const uniqueDays = new Set(sessions.map(session => new Date(session.endedAt).toDateString())).size;
  const lastVolume = sessions.at(-1)?.volume || 0, firstVolume = sessions[0]?.volume || lastVolume;
  const volumeChange = firstVolume ? Math.round((lastVolume - firstVolume) / firstVolume * 100) : 0, current = Core.readiness(appState);
  const timeline = appState.sessions.slice(0,5).map(session => `<article class="timeline-item"><i></i><div><span>${formatDate(session.endedAt,{weekday:'short'})}</span><b>${esc(session.title)}</b><small>${session.sets} series · ${session.volume.toLocaleString('es-CL')} kg · preparación ${session.readinessAfter}%</small></div></article>`).join('');
  return `<article class="dashboard evolution-screen">${dashboardHeader('today')}${screenTitle('EVOLUCIÓN / GEMELO DIGITAL','Tu progreso tiene memoria.','Observa cómo cambian fuerza, constancia y recuperación.')}<section class="evolution-hero"><canvas width="400" height="800" data-body-canvas data-body-view="front" aria-label="Gemelo digital de evolución"></canvas><div><span class="micro-label">ESTADO ACTUAL</span><strong>${current}</strong><em>/100</em><p>${sessions.length ? 'Cada sesión mejora la confianza de las estimaciones.' : 'Tu línea de tiempo comenzará con el primer entrenamiento.'}</p></div></section><section class="evolution-kpis"><article><i>${icon('evolution')}</i><span>FUERZA / CARGA</span><strong>${volumeChange >= 0 ? '+' : ''}${volumeChange}%</strong><small>${totalVolume.toLocaleString('es-CL')} kg acumulados</small></article><article><i>${icon('check')}</i><span>CONSTANCIA</span><strong>${uniqueDays}</strong><small>días con actividad</small></article><article><i>${icon('body')}</i><span>VOLUMEN</span><strong>${totalSets}</strong><small>series registradas</small></article></section><section class="evolution-chart"><header><div><span class="micro-label">TENDENCIA</span><h2>Preparación después de entrenar</h2></div><strong>${current}%</strong></header><svg viewBox="0 0 320 130" preserveAspectRatio="none"><defs><linearGradient id="evoFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#68d7e8" stop-opacity=".28"/><stop offset="1" stop-color="#68d7e8" stop-opacity="0"/></linearGradient></defs><path d="M0 30H320M0 65H320M0 100H320"/><polyline points="${chartPoints(readinessValues,320,120)}"/></svg></section><div class="section-heading"><span>ESCENARIOS ESTIMADOS · 8 SEMANAS</span><small>No son promesas</small></div><section class="scenario-grid"><article><span>SI SIGUES IGUAL</span><strong>${Math.min(100,current + Math.max(2,uniqueDays))}%</strong><p>Proyección con tu ritmo reciente.</p></article><article class="is-recommended"><span>SIGUIENDO AREVYS</span><strong>${Math.min(100,current + Math.max(7,uniqueDays * 2))}%</strong><p>Más consistencia y carga ajustada.</p></article></section><div class="section-heading"><span>LÍNEA DE TIEMPO</span><small>${sessions.length} sesiones</small></div><section class="timeline">${timeline || '<p class="empty-state">Aún no hay entrenamientos. Tu primera sesión creará el inicio de esta historia.</p>'}</section></article>`;
}

function libraryLayout() {
  const available = libraryExercisesForAvatar();
  const groups = ['Todos',...new Set(available.map(exercise => exercise.group))];
  const query = ui.libraryQuery.toLowerCase().trim();
  const filtered = available.filter(exercise => {
    const matchesGroup = ui.libraryFilter === 'Todos' || exercise.group === ui.libraryFilter;
    const haystack = exercise.searchText || `${exercise.name} ${exercise.group} ${exercise.equipment}`.toLowerCase();
    return matchesGroup && (!query || haystack.includes(query));
  });
  const exercises = filtered.slice(0,ui.libraryLimit);
  const connected = localLibrary.status === 'ready';
  const sourceState = connected ? 'ready' : localLibrary.status;
  const sourceTitle = connected ? 'BIBLIOTECA LOCAL CONECTADA' : localLibrary.status === 'loading' ? 'CONECTANDO BIBLIOTECA…' : 'CATÁLOGO AREVYS DE RESPALDO';
  const sourceCopy = connected
    ? `${localLibrary.total} videos disponibles · mostrando la versión de ${ui.libraryAvatar}`
    : (localLibrary.error || 'Usando el catálogo integrado mientras conectamos la carpeta local.');
  const avatarSwitch = connected ? `<nav class="library-avatar-switch" aria-label="Avatar de la demostración"><button class="${ui.libraryAvatar === 'Helena' ? 'is-active' : ''}" data-library-avatar="Helena"><span>H</span> HELENA</button><button class="${ui.libraryAvatar === 'Aquiles' ? 'is-active' : ''}" data-library-avatar="Aquiles"><span>A</span> AQUILES</button></nav>` : '';
  const cards = exercises.map(exercise => {
    const expanded = ui.librarySelected === exercise.id;
    const media = exercise.mediaUrl
      ? (exercise.mediaType === 'image' ? `<img src="${esc(exercise.mediaUrl)}" alt="Demostración de ${esc(exercise.name)}" loading="lazy" decoding="async">` : `<video src="${esc(exercise.mediaUrl)}" muted loop autoplay playsinline controls preload="metadata" aria-label="Demostración de ${esc(exercise.name)}"></video>`)
      : '';
    return `<article class="library-card ${expanded ? 'is-expanded' : ''}"><button class="library-card__main" data-library-select="${exercise.id}"><i>${muscleIcon(exercise.primary[0])}</i><div><span>${exercise.group.toUpperCase()} · ${exercise.source === 'local' ? 'VIDEO LOCAL' : exercise.level.toUpperCase()}</span><h2>${esc(exercise.name)}</h2><p>${exercise.sets} series · ${exercise.reps} · ${exercise.equipment}</p></div><strong>${expanded ? '−' : '+'}</strong></button>${expanded ? `<div class="library-card__detail">${media ? `<div class="library-card__media">${media}<span>DEMOSTRACIÓN · ${exercise.avatar.toUpperCase()}</span></div>` : ''}<p><b>CONEXIÓN CON TU CUERPO</b>${esc(exercise.cue)}</p><div class="muscle-tags">${[...exercise.primary,...exercise.secondary].map(id => `<span>${Core.MUSCLES[id].name}</span>`).join('')}</div><button class="primary-cta" data-start-exercise="${exercise.id}">${icon('play')} ENTRENAR ESTE EJERCICIO</button></div>` : ''}</article>`;
  }).join('');
  const loading = localLibrary.status === 'loading' ? '<div class="library-loading"><i></i><span>Indexando los videos de tu PC…</span></div>' : '';
  const more = filtered.length > exercises.length ? `<button class="library-more" data-library-more>VER ${Math.min(LOCAL_LIBRARY_PAGE_SIZE,filtered.length - exercises.length)} EJERCICIOS MÁS</button>` : '';

  return `<article class="dashboard library-screen">${dashboardHeader('more')}${screenTitle('CONOCIMIENTO / EJERCICIOS','Biblioteca AREVYS.','Demostraciones reales conectadas con tu registro y mapa corporal.')}<section class="library-source" data-status="${sourceState}"><i>${icon(connected ? 'link' : 'library')}</i><div><b>${sourceTitle}</b><span>${esc(sourceCopy)}</span></div><strong>${connected ? localLibrary.total : Core.EXERCISES.length}</strong></section>${avatarSwitch}<label class="library-search">${icon('library')}<input type="search" placeholder="Buscar ejercicio, músculo o equipo" value="${esc(ui.libraryQuery)}" data-library-search></label><nav class="filter-rail">${groups.map(group => `<button class="${ui.libraryFilter === group ? 'is-active' : ''}" data-library-filter="${esc(group)}">${esc(group)}</button>`).join('')}</nav><div class="library-results"><span>${filtered.length} RESULTADOS</span><small>${connected ? `Fuente local · ${ui.libraryAvatar}` : 'Catálogo de respaldo'}</small></div>${loading}<section class="library-list">${cards || '<p class="empty-state">No encontramos ejercicios con ese filtro.</p>'}</section>${more}</article>`;
}

function aiAnswer(question) {
  const plan = Core.planForToday(appState), ready = Core.readiness(appState);
  const nutrition = Core.nutritionSummary(appState);
  const initialized = Object.entries(appState.muscles).filter(([,muscle]) => muscle.initialized).sort((a,b) => a[1].recovery - b[1].recovery);
  const lowest = initialized[0], lower = question.toLowerCase();
  if (lower.includes('nutric') || lower.includes('comer') || lower.includes('proteína') || lower.includes('proteina') || lower.includes('calor')) return `Hoy llevas ${nutrition.consumed.calories} kcal y ${nutrition.consumed.protein} g de proteína. Tu objetivo estimado es ${nutrition.targets.calories} kcal y ${nutrition.targets.protein} g de proteína. Puedes abrir Nutrición para explorar una opción compatible con ${plan.title} y registrarla en tu Gemelo Digital.`;
  if (lower.includes('por qué') || lower.includes('recom')) return `Te propongo ${plan.title} con ${plan.compatibility}% de compatibilidad. ${plan.reasons.join(' ')} La decisión se recalcula si registras carga o actualizas tu check-in.`;
  if (lower.includes('fatig') || lower.includes('recuper')) return lowest ? `${Core.MUSCLES[lowest[0]].name} es hoy el grupo con menor recuperación: ${Math.round(lowest[1].recovery)}%. Su estimación es de ${lowest[1].recoveryHours} horas y su nivel de confianza es ${Math.round(lowest[1].confidence * 100)}%.` : 'Tu cuerpo sigue en estado basal: todavía no hay músculos fatigados porque no has registrado una sesión.';
  if (lower.includes('entreno') || lower.includes('hacer hoy')) return `Hoy tu preparación es ${ready}%. La mejor oportunidad es ${plan.title}, con ${plan.exercises.length} ejercicios y una duración estimada de ${plan.duration} minutos.`;
  if (lower.includes('descans')) return ready < 58 ? 'Tu preparación está baja. Conviene proteger la recuperación con movilidad o descanso activo y evitar estimular los músculos en rojo.' : `No necesitas un descanso total según los datos actuales. La opción ${plan.title} mantiene el estímulo en los grupos con mejor disponibilidad.`;
  return `Tu preparación actual es ${ready}% y tu mejor oportunidad es ${plan.title}. Puedo explicarte la recuperación de un músculo, la razón del plan o cómo cambia el cuerpo después de entrenar.`;
}

function aiLayout() {
  if (!ui.aiMessages.length) ui.aiMessages.push({ role:'assistant',text:`Veo tu estado corporal completo. Hoy puedo ayudarte a entender por qué AREVYS recomienda ${Core.planForToday(appState).title}.` });
  const presets = ['¿Qué entreno hoy?','¿Por qué esta recomendación?','¿Qué como hoy?','¿Qué músculo necesita recuperar?','¿Me conviene descansar?'];
  return `<article class="dashboard ai-screen">${dashboardHeader('more')}${screenTitle('AREVYS AI / CONTEXTO VIVO','Entiende la decisión.','La conversación interpreta el estado; los porcentajes vienen del motor corporal.')}<section class="ai-orb"><i>${icon('spark')}</i><div><span>LECTURA ACTIVA</span><strong>${Core.readiness(appState)}% preparación</strong></div></section><nav class="ai-presets">${presets.map(question => `<button data-ai-question="${esc(question)}">${esc(question)}</button>`).join('')}</nav><section class="ai-thread">${ui.aiMessages.map(message => `<article class="ai-message ai-message--${message.role}">${message.role === 'assistant' ? `<i>${icon('spark')}</i>` : ''}<p>${esc(message.text)}</p></article>`).join('')}</section><div class="ai-composer"><input id="aiInput" placeholder="Pregúntale a AREVYS…" autocomplete="off"><button data-ai-send aria-label="Enviar">${icon('arrow')}</button></div><p class="ai-note">Orientación contextual, no diagnóstico médico. Las estimaciones mejoran con tus registros.</p></article>`;
}

function moreLayout() {
  return `<article class="dashboard more-screen">${dashboardHeader('today')}${screenTitle('AREVYS / TU SISTEMA','Todo conectado.','Conocimiento, acompañamiento y configuración sin competir con tu cuerpo.')}<section class="system-pulse"><i>${icon('spark')}</i><div><span class="micro-label">SISTEMA CORPORAL</span><h2>${Core.readiness(appState)}% de preparación</h2><p>${appState.sessions.length} sesiones alimentan hoy tu gemelo digital.</p></div></section><section class="more-grid"><button data-dashboard="library"><i>${icon('library')}</i><div><b>Biblioteca</b><small>Ejercicios y técnica</small></div><strong>→</strong></button><button data-dashboard="ai"><i>${icon('spark')}</i><div><b>AREVYS AI</b><small>Explica tus decisiones</small></div><strong>→</strong></button><button data-dashboard="profile"><i>${icon('profile')}</i><div><b>Perfil y objetivos</b><small>Datos, preferencias y avatar</small></div><strong>→</strong></button><button data-dashboard="evolution"><i>${icon('evolution')}</i><div><b>Evolución</b><small>Progreso y escenarios</small></div><strong>→</strong></button></section><section class="principle-card"><span class="micro-label">PRINCIPIO AREVYS</span><blockquote>“¿Qué es lo mejor que puede hacer mi cuerpo hoy para acercarse a mi objetivo?”</blockquote><p>Cada módulo responde esa pregunta desde el mismo estado vivo.</p></section></article>`;
}

function equipmentIcon(id) {
  const names = { gym:'dumbbells', home:'home', basic:'bands', bodyweight:'body', dumbbells:'dumbbells', barbell:'barbell', cable:'link', machines:'machine', bench:'plan', bands:'bands', mat:'mat', body:'body' };
  return icon(names[id] || 'body');
}

function equipmentPreferenceSection(profile) {
  const context = Core.equipmentProfile(profile);
  const modeCards = Core.EQUIPMENT_MODES.map(mode => `<button class="equipment-mode-card ${context.modeId === mode.id ? 'is-active' : ''}" data-equipment-mode="${mode.id}" aria-pressed="${context.modeId === mode.id}"><i>${equipmentIcon(mode.id)}</i><span><b>${mode.label}</b><small>${mode.description}</small></span><em>${context.modeId === mode.id ? icon('check') : '＋'}</em></button>`).join('');
  const items = Core.EQUIPMENT_OPTIONS.map(item => {
    const selected = context.selected.includes(item.id);
    const locked = context.modeId === 'bodyweight' && !['bodyweight','mat'].includes(item.id);
    return `<button class="equipment-chip ${selected ? 'is-selected' : ''} ${locked ? 'is-locked' : ''}" data-equipment-item="${item.id}" aria-pressed="${selected}" ${locked ? 'disabled' : ''}><i>${equipmentIcon(item.id)}</i><span><b>${item.label}</b><small>${item.description}</small></span><strong>${selected ? icon('check') : ''}</strong></button>`;
  }).join('');
  return `<section class="equipment-preferences" aria-labelledby="equipment-title"><header class="equipment-preferences__header"><div><span class="micro-label">ENTORNO DE ENTRENAMIENTO</span><h2 id="equipment-title">¿Con qué entrenas?</h2><p>Elige tu realidad para que el plan inteligente recomiende ejercicios que sí puedes hacer.</p></div><i>${icon('body')}</i></header><div class="equipment-mode-grid">${modeCards}</div><div class="equipment-detail"><div><span class="micro-label">EQUIPO DISPONIBLE</span><p>También puedes ajustar cada elemento manualmente.</p></div><div class="equipment-chip-grid">${items}</div></div><p class="equipment-feedback"><i>${icon('spark')}</i><span><b>Plan adaptado:</b> ${context.label} · ${context.selectedLabels.join(' · ')}</span></p></section>`;
}

function planEquipmentContext(plan) {
  const context = Core.equipmentProfile(appState.profile);
  return `<section class="plan-equipment-context"><i>${equipmentIcon(context.modeId)}</i><div><span class="micro-label">CONTEXTO DEL PLAN</span><strong>${esc(context.label)}</strong><small>${esc(context.selectedLabels.slice(0,5).join(' · '))}</small></div><button data-dashboard="profile">EDITAR</button></section>`;
}

function onboardingSettingsSection(profile) {
  const location = profile.trainingPlace || 'Gimnasio';
  const care = ['Lesiones','Limitaciones','Ambas','Nada que informar'].includes(profile.care) ? profile.care : 'Nada que informar';
  const items = [
    ['1', 'OBJETIVO', profile.goal, 'Objetivo principal'],
    ['2', 'EXPERIENCIA', profile.experience, 'Punto de partida'],
    ['3', 'RUTINA', `${profile.frequency} · ${location}`, 'Frecuencia y lugar'],
    ['4', 'DATOS', `${profile.age || '—'} años · ${profile.weight || '—'} kg · ${profile.height || '—'} cm`, 'Medidas de referencia'],
    ['5', 'NUTRICIÓN', profile.nutrition, 'Preferencia alimentaria'],
    ['6', 'CUIDADO', care, 'Lesiones o limitaciones']
  ];
  return `<section class="onboarding-settings" aria-labelledby="onboarding-settings-title"><header><div><span class="micro-label">CONFIGURACIÓN PERSONAL</span><h2 id="onboarding-settings-title">Perfil y objetivos</h2><p>Puedes revisar cualquier respuesta del inicio sin perder tu historial.</p></div><i>${icon('plan')}</i></header><div class="onboarding-settings__list">${items.map(([step,label,value,copy]) => `<button data-edit-onboarding="${step}" aria-label="Editar ${label.toLowerCase()}"><span class="onboarding-settings__index">${step}</span><span><b>${label}</b><strong>${esc(value)}</strong><small>${copy}</small></span><em>EDITAR&nbsp; →</em></button>`).join('')}</div><button class="secondary-cta" data-replay-intro>VOLVER A HACER LA CONFIGURACIÓN COMPLETA</button></section>`;
}

function profileLayout() {
  const profile = appState.profile;
  const connections = [['appleHealth','Apple Health'],['googleFit','Google Fit'],['wearable','Reloj / wearable']];
  return `<article class="dashboard profile-screen">${dashboardHeader('more')}${screenTitle('PERFIL / PUNTO DE PARTIDA','Tu sistema personal.','Objetivos y preferencias que contextualizan las decisiones.')}<section class="profile-identity"><div class="profile-avatar ${profile.avatar === 'Aquiles' ? 'is-aquiles' : 'is-helena'}"><span></span></div><div><span>GEMELO DIGITAL</span><h2>${profile.avatar}</h2><p>${profile.goal}</p></div></section><div class="section-heading"><span>DATOS PRINCIPALES</span><small>Editables</small></div><section class="profile-form"><label><span>NOMBRE</span><input value="${esc(profile.name)}" placeholder="Tu nombre" data-profile-field="name"></label><label><span>OBJETIVO</span><select data-profile-field="goal">${['Perder grasa','Ganar músculo','Aumentar fuerza','Mejorar rendimiento'].map(value => `<option ${profile.goal === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label><span>FRECUENCIA</span><select data-profile-field="frequency">${['2–3 días','4 días','5+ días'].map(value => `<option ${profile.frequency === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label><span>EXPERIENCIA</span><select data-profile-field="experience">${['Estoy comenzando','Estoy retomando','Entreno regularmente','Nivel avanzado'].map(value => `<option ${profile.experience === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label></section>${equipmentPreferenceSection(profile)}${onboardingSettingsSection(profile)}<div class="section-heading"><span>CONEXIONES</span><small>Preparadas para la siguiente etapa</small></div><section class="connections">${connections.map(([key,label]) => `<button data-connection="${key}"><i>${icon('link')}</i><span><b>${label}</b><small>${appState.connections[key] ? 'Conectado' : 'No conectado'}</small></span><em class="${appState.connections[key] ? 'is-on' : ''}"></em></button>`).join('')}</section><section class="profile-actions"><button class="danger-link" data-logout>CERRAR SESIÓN LOCAL</button></section><p class="version-note">AREVYS V2 · MOTOR LOCAL ${Core.VERSION} · Los datos permanecen en este dispositivo.</p></article>`;
}

function libraryGallery(exercises) {
  const picks = exercises.filter(exercise => exercise.mediaUrl).slice(0,5);
  if (!picks.length) return '';
  const media = exercise => exercise.mediaType === 'image'
    ? `<img src="${esc(exercise.mediaUrl)}" alt="Vista previa de ${esc(exercise.name)}" loading="lazy" decoding="async">`
    : `<video src="${esc(exercise.mediaUrl)}" muted loop autoplay playsinline preload="metadata" aria-label="Vista previa de ${esc(exercise.name)}"></video>`;
  return `<section class="exercise-gallery"><header><div><span class="micro-label">VISTA RÁPIDA</span><h2>Explora tu entrenamiento</h2></div><small>${picks.length} previews</small></header><article class="gallery-feature"><button data-library-select="${picks[0].id}">${media(picks[0])}<span><b>${esc(picks[0].name)}</b><small>${picks[0].group} · VER DETALLE →</small></span></button></article><div class="gallery-grid">${picks.slice(1).map(exercise => `<article class="gallery-tile"><button data-library-select="${exercise.id}">${media(exercise)}<span><b>${esc(exercise.name)}</b><small>${exercise.group}</small></span></button></article>`).join('')}</div></section>`;
}

function renderDashboard() {
  appState = Core.applyPassiveRecovery(appState);
  const layouts = { today:todayLayout,plan:planLayout,workout:workoutLayout,result:resultLayout,recovery:recoveryLayout,evolution:evolutionLayout,library:libraryLayout,nutrition:nutritionLayout,ai:aiLayout,more:moreLayout,profile:profileLayout };
  dashboardContent.innerHTML = (layouts[ui.view] || todayLayout)();
  if (ui.view === 'today') {
    const plan = Core.planForToday(appState), head = dashboardContent.querySelector('.opportunity-v2__head');
    if (head) head.insertAdjacentHTML('afterend', `<div class="opportunity-v2__muscles">${plan.focus.slice(0,4).map(id => { const state = Core.statusForMuscle(appState.muscles[id]); return `<span data-state="${state.key}"><i>${muscleIcon(id)}</i><b>${Core.MUSCLES[id].name}</b></span>`; }).join('')}</div>`);
  }
  if (ui.view === 'plan') {
    const plan = Core.planForToday(appState), card = dashboardContent.querySelector('.decision-card');
    if (card) card.insertAdjacentHTML('afterend', `<button class="plan-library-entry plan-library-entry--visual" data-dashboard="library"><span class="plan-library-entry__icon"><i>${icon('library')}</i></span><span class="plan-library-entry__copy"><b>BIBLIOTECA DE EJERCICIOS</b><small>Explora la técnica y el video de cada movimiento</small></span><span class="plan-library-entry__stat"><strong>${plan.exercises.length}</strong><small>EN ESTA SESIÓN</small></span><strong class="plan-library-entry__arrow">→</strong></button>`);
  }
  if (ui.view === 'library') {
    const source = dashboardContent.querySelector('.library-source');
    if (source) source.insertAdjacentHTML('afterend', libraryGallery(libraryExercisesForAvatar()) + aquilesPresence('library'));
  }
  if (ui.view === 'nutrition' && ui.nutritionTab === 'summary') {
    const tabs = dashboardContent.querySelector('.nutrition-tabs');
    if (tabs) tabs.insertAdjacentHTML('afterend', `<section class="nutrition-quick-meals"><header><div><span class="micro-label">REGISTRO DE HOY</span><h2>¿Qué comiste?</h2></div><button data-nutrition-tab="log">VER TODO →</button></header><div>${['Desayuno','Almuerzo','Cena','Colación'].map(type => `<button data-nutrition-meal-type="${type}" data-nutrition-tab="log"><i>${icon('nutrition')}</i><b>${type}</b><small>+ Añadir</small></button>`).join('')}</div></section>`);
  }
  if (ui.view === 'nutrition' && nutritionRemote.recipeStatus === 'idle') loadNutritionRecipes();
  renderNav(); paintAllBodies(); updateWorkoutTimer();
}
function navigate(view,scroll=true) {
  ui.view = view; trackEvent('dashboard_tab_view', { tab: view }); renderDashboard(); syncUrlState();
  if (scroll) home.scrollTo({top:0,behavior:'smooth'});
}
function openCheckin() {
  ui.checkinDraft = { energy:appState.daily.energy ?? 4,stress:appState.daily.stress ?? 2,mood:appState.daily.mood ?? 4,time:appState.daily.time ?? 45 };
  ui.checkinOpen = true; renderDashboard();
}

function openProfessionalChat() {
  if (intro.hidden) navigate('ai');
  else showToast('Te conectaremos con un profesional cuando esta opción esté disponible.');
}

home.addEventListener('click',event => {
  const dashboardTarget = event.target.closest('[data-dashboard]');
  if (dashboardTarget) { navigate(dashboardTarget.dataset.dashboard); return; }
  const nutritionTab = event.target.closest('[data-nutrition-tab]');
  if (nutritionTab) { ui.nutritionTab = nutritionTab.dataset.nutritionTab; if (ui.nutritionTab !== 'log') ui.nutritionSelectedFood = null; renderDashboard(); syncUrlState(); return; }
  const nutritionQuery = event.target.closest('[data-nutrition-query]');
  if (nutritionQuery) { searchNutritionFoods(nutritionQuery.dataset.nutritionQuery); return; }
  if (event.target.closest('[data-nutrition-search-submit]')) { searchNutritionFoods(document.querySelector('[data-nutrition-search]')?.value); return; }
  if (event.target.closest('[data-nutrition-pantry-add]')) {
    const input = document.querySelector('[data-nutrition-pantry-input]'), item = String(input?.value || '').trim();
    if (!item) { showToast('Escribe un alimento para añadirlo.'); return; }
    const pantry = Core.nutritionSummary(appState).pantry;
    Core.updateNutritionPantry(appState, [...pantry, item]); ui.nutritionPantryText = ''; showToast('Disponibilidad actualizada.'); renderDashboard(); return;
  }
  const mealType = event.target.closest('[data-nutrition-meal-type]');
  if (mealType) { ui.nutritionMealType = mealType.dataset.nutritionMealType; renderDashboard(); return; }
  const selectFood = event.target.closest('[data-nutrition-select-food]');
  if (selectFood) { const food = nutritionFindFood(selectFood.dataset.nutritionSelectFood); if (food) { ui.nutritionSelectedFood = food; ui.nutritionTab = 'log'; renderDashboard(); } return; }
  const selectRecipe = event.target.closest('[data-nutrition-select-recipe]');
  if (selectRecipe) { const recipe = nutritionFindRecipe(selectRecipe.dataset.nutritionSelectRecipe); if (recipe) { ui.nutritionSelectedFood = { ...recipe, title:recipe.name, name:recipe.name, source:recipe.source || 'recipe' }; ui.nutritionTab = 'log'; renderDashboard(); } return; }
  if (event.target.closest('[data-nutrition-register-selected]')) {
    if (ui.nutritionSelectedFood) Core.recordNutritionMeal(appState,{ ...ui.nutritionSelectedFood, title:ui.nutritionSelectedFood.name || ui.nutritionSelectedFood.title, mealType:ui.nutritionMealType });
    ui.nutritionSelectedFood = null; ui.nutritionTab = 'summary'; vibrate([10,20,10]); showToast('Comida registrada. Tu estado nutricional fue actualizado.'); renderDashboard(); return;
  }
  if (event.target.closest('[data-nutrition-clear-selection]')) { ui.nutritionSelectedFood = null; ui.nutritionTab = 'explore'; renderDashboard(); return; }
  const removeMeal = event.target.closest('[data-nutrition-remove-meal]');
  if (removeMeal) { const removed = Core.removeNutritionMeal(appState, removeMeal.dataset.nutritionRemoveMeal); if (removed) { showToast('Registro eliminado.'); renderDashboard(); } return; }
  const nutritionWater = event.target.closest('[data-nutrition-water]');
  if (nutritionWater) { Core.addNutritionWater(appState,Number(nutritionWater.dataset.nutritionWater)); showToast('Hidratación actualizada.'); renderDashboard(); return; }
  const tab = event.target.closest('[data-recovery-tab]');
  if (tab) { ui.recoveryTab = tab.dataset.recoveryTab; renderDashboard(); return; }
  const bodyView = event.target.closest('[data-body-view]');
  if (bodyView) {
    ui.bodyView = bodyView.dataset.bodyView;
    const available = visibleMuscles(); if (!available.includes(ui.selectedMuscle)) ui.selectedMuscle = available[0];
    renderDashboard(); return;
  }
  const resultView = event.target.closest('[data-result-view]');
  if (resultView) { ui.resultBodyView = resultView.dataset.resultView; renderDashboard(); return; }
  const muscle = event.target.closest('[data-muscle]');
  if (muscle) {
    ui.selectedMuscle = muscle.dataset.muscle;
    if (ui.recoveryTab === 'history') {
      ui.recoveryTab = 'muscles'; const views = Core.MUSCLES[ui.selectedMuscle].views; ui.bodyView = views.front ? 'front' : 'back';
    }
    vibrate(10); renderDashboard(); return;
  }
  const range = event.target.closest('[data-history-range]');
  if (range) { ui.historyRange = Number(range.dataset.historyRange); renderDashboard(); return; }
  if (event.target.closest('[data-open-checkin]')) { openCheckin(); return; }
  if (event.target.closest('[data-close-checkin]')) { ui.checkinOpen = false; renderDashboard(); return; }
  const checkin = event.target.closest('[data-checkin-key]');
  if (checkin) { ui.checkinDraft[checkin.dataset.checkinKey] = Number(checkin.dataset.checkinValue); renderDashboard(); return; }
  if (event.target.closest('[data-save-checkin]')) {
    Core.updateDaily(appState,ui.checkinDraft); ui.checkinOpen = false; vibrate([12,30,12]); showToast('Tu día y el plan fueron recalculados.'); renderDashboard(); return;
  }
  const planTime = event.target.closest('[data-plan-time]');
  if (planTime) { Core.updateDaily(appState,{time:Number(planTime.dataset.planTime)}); renderDashboard(); return; }
  if (event.target.closest('[data-start-workout]')) {
    if (!appState.activeWorkout) Core.startWorkout(appState,{plan:Core.planForToday(appState)});
    trackEvent('workout_start', { source: ui.view, title: Core.planForToday(appState).title });
    ui.workoutPaused = false; ui.workoutPauseStartedAt = 0; ui.workoutPausedTotal = 0; ui.restRemaining = 0; ui.restStartedAt = 0;
    navigate('workout'); vibrate(18); return;
  }
  if (event.target.closest('[data-workout-toggle]')) {
    if (ui.workoutPaused) {
      const pausedFor = ui.workoutPauseStartedAt ? Date.now() - ui.workoutPauseStartedAt : 0;
      ui.workoutPausedTotal += pausedFor; if (ui.restStartedAt) ui.restStartedAt += pausedFor;
      ui.workoutPaused = false; ui.workoutPauseStartedAt = 0;
    } else { ui.workoutPaused = true; ui.workoutPauseStartedAt = Date.now(); }
    renderDashboard(); return;
  }
  const restDuration = event.target.closest('[data-rest-duration]');
  if (restDuration) { ui.restDuration = Number(restDuration.dataset.restDuration); if (ui.restRemaining) startRestTimer(ui.restDuration); renderDashboard(); return; }
  if (event.target.closest('[data-rest-start]')) { startRestTimer(ui.restDuration); renderDashboard(); return; }
  if (event.target.closest('[data-rest-reset]')) { ui.restRemaining = 0; ui.restStartedAt = 0; renderDashboard(); return; }
  const workoutExercise = event.target.closest('[data-workout-exercise]');
  if (workoutExercise) { Core.setCurrentExercise(appState,Number(workoutExercise.dataset.workoutExercise)); renderDashboard(); return; }
  const setDone = event.target.closest('[data-set-done]');
  if (setDone) {
    const exerciseIndex = Number(setDone.dataset.exerciseIndex), setIndex = Number(setDone.dataset.setIndex);
    const set = appState.activeWorkout.exercises[exerciseIndex].setsData[setIndex];
    const nextDone = !set.done; Core.updateWorkoutSet(appState,exerciseIndex,setIndex,{done:nextDone}); vibrate(set.done ? 8 : [10,20,10]);
    if (nextDone) startRestTimer(appState.activeWorkout.exercises[exerciseIndex].rest || ui.restDuration); else { ui.restRemaining = 0; ui.restStartedAt = 0; }
    renderDashboard(); return;
  }
  const step = event.target.closest('[data-exercise-step]');
  if (step) { Core.setCurrentExercise(appState,appState.activeWorkout.currentExercise + Number(step.dataset.exerciseStep)); renderDashboard(); home.scrollTo({top:0,behavior:'smooth'}); return; }
  if (event.target.closest('[data-finish-workout]')) {
    const result = Core.finishWorkout(appState);
    if (result.error) { showToast(result.error); return; }
    trackEvent('workout_complete', { sets: result.session?.sets || 0, durationMin: result.session?.durationMin || 0 });
    const principalMuscle = Object.entries(result.changes).sort((a,b) => b[1].drop - a[1].drop)[0]?.[0];
    ui.resultBodyView = principalMuscle && Core.MUSCLES[principalMuscle].views.front ? 'front' : 'back';
    navigate('result'); vibrate([20,35,20]); return;
  }
  const libraryFilter = event.target.closest('[data-library-filter]');
  if (libraryFilter) { ui.libraryFilter = libraryFilter.dataset.libraryFilter; ui.libraryLimit = LOCAL_LIBRARY_PAGE_SIZE; ui.librarySelected = null; renderDashboard(); return; }
  const libraryAvatar = event.target.closest('[data-library-avatar]');
  if (libraryAvatar) { ui.libraryAvatar = libraryAvatar.dataset.libraryAvatar; ui.libraryFilter = 'Todos'; ui.libraryLimit = LOCAL_LIBRARY_PAGE_SIZE; ui.librarySelected = null; renderDashboard(); return; }
  const librarySelect = event.target.closest('[data-library-select]');
  if (librarySelect) { ui.librarySelected = ui.librarySelected === librarySelect.dataset.librarySelect ? null : librarySelect.dataset.librarySelect; renderDashboard(); return; }
  if (event.target.closest('[data-library-more]')) { ui.libraryLimit += LOCAL_LIBRARY_PAGE_SIZE; renderDashboard(); return; }
  const startExercise = event.target.closest('[data-start-exercise]');
  if (startExercise) {
    const exercise = findLibraryExercise(startExercise.dataset.startExercise);
    if (!exercise) { showToast('No pudimos abrir ese ejercicio.'); return; }
    Core.startWorkout(appState,{exercises:[exercise],title:exercise.name,templateId:'local-library'});
    trackEvent('workout_start', { source: 'library', exercise: exercise.name });
    ui.workoutPaused = false; ui.workoutPauseStartedAt = 0; ui.workoutPausedTotal = 0; ui.restRemaining = 0; ui.restStartedAt = 0;
    navigate('workout'); return;
  }
  const aiQuestion = event.target.closest('[data-ai-question]');
  if (aiQuestion) { sendAiMessage(aiQuestion.dataset.aiQuestion); return; }
  if (event.target.closest('[data-ai-send]')) { sendAiMessage(document.querySelector('#aiInput')?.value); return; }
  const connection = event.target.closest('[data-connection]');
  const equipmentMode = event.target.closest('[data-equipment-mode]');
  if (equipmentMode) { Core.setEquipmentMode(appState,equipmentMode.dataset.equipmentMode); showToast('Contexto guardado. El plan se adaptó a tu equipo.'); renderDashboard(); return; }
  const equipmentItem = event.target.closest('[data-equipment-item]');
  if (equipmentItem) { Core.toggleEquipment(appState,equipmentItem.dataset.equipmentItem); showToast('Equipo actualizado.'); renderDashboard(); return; }
  if (connection) { Core.toggleConnection(appState,connection.dataset.connection); showToast(appState.connections[connection.dataset.connection] ? 'Conexión marcada como activa para el prototipo.' : 'Conexión desactivada.'); renderDashboard(); return; }
  const editOnboarding = event.target.closest('[data-edit-onboarding]');
  if (editOnboarding) { showIntro(false, Number(editOnboarding.dataset.editOnboarding)); return; }
  if (event.target.closest('[data-replay-intro]')) { showIntro(false, 0); return; }
  if (event.target.closest('[data-logout]')) { Core.markLoggedOut(appState); showIntro(true); }
});

home.addEventListener('change',event => {
  const setField = event.target.closest('[data-set-field]');
  if (setField) { Core.updateWorkoutSet(appState,Number(setField.dataset.exerciseIndex),Number(setField.dataset.setIndex),{[setField.dataset.setField]:Number(setField.value)}); return; }
  const profileField = event.target.closest('[data-profile-field]');
  if (profileField) { Core.updateProfile(appState,{[profileField.dataset.profileField]:profileField.value}); showToast('Perfil actualizado.'); renderDashboard(); }
});
home.addEventListener('input',event => {
  if (event.target.matches('[data-nutrition-search]')) { ui.nutritionSearch = event.target.value; return; }
  if (event.target.matches('[data-nutrition-pantry-input]')) { ui.nutritionPantryText = event.target.value; return; }
  if (event.target.matches('[data-library-search]')) {
    ui.libraryQuery = event.target.value; ui.libraryLimit = LOCAL_LIBRARY_PAGE_SIZE; ui.librarySelected = null;
    const caret = event.target.selectionStart;
    window.clearTimeout(home.searchTimer);
    home.searchTimer = window.setTimeout(() => {
      renderDashboard();
      const nextSearch = document.querySelector('[data-library-search]');
      if (nextSearch) { nextSearch.focus(); nextSearch.setSelectionRange(caret,caret); }
    },160);
  }
});
home.addEventListener('keydown',event => {
  if (event.key === 'Enter' && event.target.matches('[data-nutrition-search]')) { event.preventDefault(); searchNutritionFoods(event.target.value); return; }
  if (event.key === 'Enter' && event.target.matches('[data-nutrition-pantry-input]')) { event.preventDefault(); document.querySelector('[data-nutrition-pantry-add]')?.click(); return; }
  if (event.key === 'Enter' && event.target.id === 'aiInput') { event.preventDefault(); sendAiMessage(event.target.value); }
});

function sendAiMessage(question) {
  const value = String(question || '').trim(); if (!value) return;
  ui.aiMessages.push({role:'user',text:value},{role:'assistant',text:aiAnswer(value)}); renderDashboard();
  requestAnimationFrame(() => home.scrollTo({top:home.scrollHeight,behavior:'smooth'}));
}
function finishIntro() {
  Core.completeOnboarding(appState,introState.answers,introState.avatar);
  trackEvent('onboarding_complete', { avatar: introState.avatar, durationMs: introState.startedAt ? Date.now() - introState.startedAt : 0 });
  ui.libraryAvatar = introState.avatar === 'Aquiles' ? 'Aquiles' : 'Helena';
  intro.hidden = true; home.hidden = false; ui.view = 'today'; renderDashboard(); syncUrlState();
}
function introAnswersFromProfile() {
  const profile = appState.profile || {};
  return { 1:profile.goal, 2:profile.experience, frequency:profile.frequency, location:profile.trainingPlace, age:profile.age, weight:profile.weight, height:profile.height, 5:profile.nutrition, 6:['Lesiones','Limitaciones','Ambas','Nada que informar'].includes(profile.care) ? profile.care : 'Nada que informar' };
}
function showIntro(loggedOut = false, startStep = 0) {
  home.hidden = true; intro.hidden = false;
  introState.answers = loggedOut ? {} : introAnswersFromProfile();
  introState.progress = 0; introState.target = 0; introState.step = 0; introState.frame = -1;
  introState.startedAt = Date.now(); introState.stepStartedAt = Date.now();
  const safeStep = Math.max(0, Math.min(steps.length - 1, Number(startStep) || 0));
  if (safeStep) { introState.step = safeStep; introState.progress = introState.target = Math.min(0.94, (safeStep + 0.5) / steps.length); }
  count.textContent = `${String(safeStep + 1).padStart(2,'0')} / 08`;
  trackEvent('onboarding_start', { mode: loggedOut ? 'new' : safeStep ? 'edit' : 'review', step: safeStep + 1 });
  renderCopy(); updateIntro(); syncUrlState();
}
function formatClock(seconds) { const safe = Math.max(0,Math.floor(Number(seconds) || 0)); return `${String(Math.floor(safe / 60)).padStart(2,'0')}:${String(safe % 60).padStart(2,'0')}`; }
function workoutElapsedSeconds() {
  const workout = appState.activeWorkout; if (!workout) return 0;
  const now = Date.now(), pausedNow = ui.workoutPaused && ui.workoutPauseStartedAt ? now - ui.workoutPauseStartedAt : 0;
  return Math.max(0,Math.floor((now - workout.startedAt - ui.workoutPausedTotal - pausedNow) / 1000));
}
function startRestTimer(seconds = ui.restDuration) { ui.restDuration = Number(seconds) || 75; ui.restStartedAt = Date.now(); ui.restRemaining = ui.restDuration; vibrate(12); }
function updateWorkoutTimer() {
  const workout = appState.activeWorkout; if (!workout) return;
  const elapsed = workoutElapsedSeconds();
  const session = formatClock(elapsed);
  ['#workoutTimer','#workoutTimerLarge'].forEach(selector => { const element = document.querySelector(selector); if (element) element.textContent = session; });
  if (ui.restRemaining > 0 && ui.restStartedAt && !ui.workoutPaused) {
    ui.restRemaining = Math.max(0, ui.restDuration - Math.floor((Date.now() - ui.restStartedAt) / 1000));
    const rest = document.querySelector('#restTimer'); if (rest) rest.textContent = formatClock(ui.restRemaining);
    if (!ui.restRemaining) { showToast('Descanso terminado. Puedes continuar con la siguiente serie.'); vibrate([18,30,18]); }
  }
}
window.setInterval(updateWorkoutTimer,1000);

function loadImage(path) {
  return new Promise(resolve => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = () => resolve(null); image.src = path;
  });
}
const bodyFrameCache = new Map();
async function cleanBodyBase(view) {
  if (bodyBaseCache.has(view)) return bodyBaseCache.get(view);
  const promise = (async () => {
    const path = view === 'front' ? 'assets/images/arevys-anatomy-premium-front-v4.png' : 'assets/images/arevys-anatomy-premium-back-v4.png';
    const image = await loadImage(path); if (!image) return null;
    const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 800;
    const context = canvas.getContext('2d',{willReadFrequently:true});
    // The base image is never stretched. The exact source proportion becomes
    // the shared coordinate system for body and muscle contours.
    const scale = Math.min(400 / image.width,800 / image.height);
    const drawWidth = image.width * scale, drawHeight = image.height * scale;
    const drawX = (400 - drawWidth) / 2, drawY = (800 - drawHeight) / 2;
    bodyFrameCache.set(view,{ x:drawX, y:drawY, width:drawWidth, height:drawHeight, scaleX:drawWidth / 400, scaleY:drawHeight / 800 });
    context.drawImage(image,drawX,drawY,drawWidth,drawHeight);
    const pixels = context.getImageData(0,0,400,800);
    const width = 400, height = 800, data = pixels.data, visited = new Uint8Array(width * height), queue = new Int32Array(width * height);
    const isBackground = index => {
      const offset = index * 4, red = data[offset], green = data[offset + 1], blue = data[offset + 2];
      return Math.max(red,green,blue) - Math.min(red,green,blue) < 18 && Math.min(red,green,blue) > 142;
    };
    let head = 0, tail = 0;
    const enqueue = index => { if (index < 0 || index >= width * height || visited[index] || !isBackground(index)) return; visited[index] = 1; queue[tail++] = index; };
    for (let x = 0; x < width; x++) { enqueue(x); enqueue((height - 1) * width + x); }
    for (let y = 0; y < height; y++) { enqueue(y * width); enqueue(y * width + width - 1); }
    while (head < tail) {
      const index = queue[head++], x = index % width;
      data[index * 4 + 3] = 0;
      if (x > 0) enqueue(index - 1); if (x < width - 1) enqueue(index + 1);
      if (index >= width) enqueue(index - width); if (index < width * (height - 1)) enqueue(index + width);
    }
    context.putImageData(pixels,0,0); return canvas;
  })();
  bodyBaseCache.set(view,promise); return promise;
}

// Atlas anatómico trazado contra el MISMO modelo AREVYS de 400 × 800.
// Cada entrada tiene varios vientres musculares independientes: esto conserva
// los surcos, separaciones y fibras del modelo al colorear una carga. Nunca se
// escala una máscara ajena; paintMuscleGlow aplica exactamente el encuadre con
// que cleanBodyBase dibuja la imagen de origen.
const ANATOMY_MASKS = {
  front: {
    pectorales: [
      'M196 175 C181 167 160 168 141 175 C124 181 114 193 116 206 C120 219 137 228 156 230 C174 230 188 222 196 211 Z',
      'M204 175 C219 167 240 168 259 175 C276 181 286 193 284 206 C280 219 263 228 244 230 C226 230 212 222 204 211 Z'
    ],
    deltoides: [
      'M111 158 C94 161 78 173 70 190 C65 205 67 220 76 231 C83 239 92 242 100 238 C112 230 119 214 119 198 C118 180 116 166 111 158 Z',
      'M289 158 C306 161 322 173 330 190 C335 205 333 220 324 231 C317 239 308 242 300 238 C288 230 281 214 281 198 C282 180 284 166 289 158 Z'
    ],
    biceps: [
      'M103 220 C113 224 120 239 121 257 C121 278 115 301 107 318 C101 314 97 303 97 287 C98 265 99 238 103 220 Z',
      'M297 220 C287 224 280 239 279 257 C279 278 285 301 293 318 C299 314 303 303 303 287 C302 265 301 238 297 220 Z'
    ],
    abdominales: [
      'M164 231 C173 226 185 227 194 232 L193 253 C184 258 173 258 164 252 Z','M206 232 C215 227 227 226 236 231 L236 252 C227 258 216 258 207 253 Z',
      'M163 260 C173 255 184 256 194 262 L193 285 C184 291 173 291 163 285 Z','M206 262 C216 256 227 255 237 260 L237 285 C227 291 216 291 207 285 Z',
      'M163 292 C173 287 184 288 193 294 L192 318 C183 324 173 324 163 318 Z','M207 294 C216 288 227 287 237 292 L237 318 C227 324 217 324 208 318 Z',
      'M165 325 C174 320 184 321 192 327 L188 350 C180 356 172 354 165 346 Z','M208 327 C216 321 226 320 235 325 L235 346 C228 354 220 356 212 350 Z'
    ],
    cuadriceps: [
      'M125 382 C115 400 112 428 116 458 C119 491 127 522 138 540 C144 549 151 551 156 544 C158 529 152 499 148 468 C145 433 143 402 137 383 Z',
      'M150 381 C144 407 144 441 147 476 C150 508 155 529 163 538 C171 528 175 503 174 473 C172 436 168 404 162 382 C158 379 153 379 150 381 Z',
      'M168 386 C170 415 177 448 179 480 C181 510 177 535 168 548 C163 551 158 547 157 540 C162 513 161 482 159 451 C158 418 159 395 163 383 Z',
      'M275 382 C285 400 288 428 284 458 C281 491 273 522 262 540 C256 549 249 551 244 544 C242 529 248 499 252 468 C255 433 257 402 263 383 Z',
      'M250 381 C256 407 256 441 253 476 C250 508 245 529 237 538 C229 528 225 503 226 473 C228 436 232 404 238 382 C242 379 247 379 250 381 Z',
      'M232 386 C230 415 223 448 221 480 C219 510 223 535 232 548 C237 551 242 547 243 540 C238 513 239 482 241 451 C242 418 241 395 237 383 Z'
    ],
    pantorrillas: [
      'M137 556 C128 579 128 613 135 641 C140 663 149 678 157 675 C164 663 164 638 159 614 C155 586 149 564 143 556 Z',
      'M158 558 C166 577 173 604 174 630 C175 655 171 681 163 704 C159 714 153 714 150 705 C153 679 151 652 146 628 C143 601 145 575 150 558 Z',
      'M263 556 C272 579 272 613 265 641 C260 663 251 678 243 675 C236 663 236 638 241 614 C245 586 251 564 257 556 Z',
      'M242 558 C234 577 227 604 226 630 C225 655 229 681 237 704 C241 714 247 714 250 705 C247 679 249 652 254 628 C257 601 255 575 250 558 Z'
    ]
  },
  back: {
    dorsales: [
      'M173 190 C152 198 135 215 127 238 C122 263 130 291 141 315 C148 329 159 337 171 337 C181 328 185 313 185 296 L184 222 C181 206 178 196 173 190 Z',
      'M227 190 C248 198 265 215 273 238 C278 263 270 291 259 315 C252 329 241 337 229 337 C219 328 215 313 215 296 L216 222 C219 206 222 196 227 190 Z'
    ],
    deltoides: [
      'M109 159 C93 162 78 174 70 190 C65 205 67 221 76 233 C84 241 93 243 101 238 C112 229 118 213 118 197 C117 179 114 166 109 159 Z',
      'M291 159 C307 162 322 174 330 190 C335 205 333 221 324 233 C316 241 307 243 299 238 C288 229 282 213 282 197 C283 179 286 166 291 159 Z'
    ],
    triceps: [
      'M84 224 C73 244 72 275 78 302 C83 322 91 332 100 328 C108 310 108 279 102 251 C98 234 92 224 84 224 Z',
      'M316 224 C327 244 328 275 322 302 C317 322 309 332 300 328 C292 310 292 279 298 251 C302 234 308 224 316 224 Z'
    ],
    gluteos: [
      'M128 358 C116 372 115 394 120 413 C126 431 144 440 163 436 C179 432 188 417 187 400 C184 378 170 362 151 357 C142 356 134 356 128 358 Z',
      'M272 358 C284 372 285 394 280 413 C274 431 256 440 237 436 C221 432 212 417 213 400 C216 378 230 362 249 357 C258 356 266 356 272 358 Z'
    ],
    isquiotibiales: [
      'M129 430 C120 455 120 489 126 520 C132 551 141 574 151 581 C158 575 160 557 157 537 C152 502 149 460 145 435 C140 430 134 428 129 430 Z',
      'M151 431 C149 462 154 495 161 527 C166 551 169 569 166 585 C176 580 182 560 182 535 C181 498 174 456 164 432 C160 429 155 429 151 431 Z',
      'M271 430 C280 455 280 489 274 520 C268 551 259 574 249 581 C242 575 240 557 243 537 C248 502 251 460 255 435 C260 430 266 428 271 430 Z',
      'M249 431 C251 462 246 495 239 527 C234 551 231 569 234 585 C224 580 218 560 218 535 C219 498 226 456 236 432 C240 429 245 429 249 431 Z'
    ],
    pantorrillas: [
      'M137 588 C127 614 128 648 135 674 C141 697 150 710 158 705 C165 691 164 667 159 644 C154 617 148 596 142 588 Z',
      'M158 590 C167 609 173 636 173 661 C174 683 169 706 162 720 C156 721 153 710 153 697 C156 671 153 645 148 623 C145 608 148 596 151 590 Z',
      'M263 588 C273 614 272 648 265 674 C259 697 250 710 242 705 C235 691 236 667 241 644 C246 617 252 596 258 588 Z',
      'M242 590 C233 609 227 636 227 661 C226 683 231 706 238 720 C244 721 247 710 247 697 C244 671 247 645 252 623 C255 608 252 596 249 590 Z'
    ]
  }
};

// Runtime uses only these two hand-authored anatomy atlases. They share the
// tracing canvas with the source but are drawn inside the exact native frame
// of each body image, eliminating independent transforms per muscle.
const MANUAL_ATLAS_PALETTE = {
  front: { pectorales:'#f23a89', deltoides:'#f2ad35', biceps:'#c48cff', abdominales:'#ff604e', cuadriceps:'#ff3158', pantorrillas:'#46d5b5' },
  back: { dorsales:'#36d98e', deltoides:'#f2ad35', triceps:'#9e72ff', gluteos:'#ff4f6f', isquiotibiales:'#e6b03d', pantorrillas:'#46d5b5' }
};
const manualAtlasRasterCache = new Map();
const rgb = hex => ({ red:parseInt(hex.slice(1,3),16), green:parseInt(hex.slice(3,5),16), blue:parseInt(hex.slice(5,7),16) });

async function manualAtlasRaster(view) {
  if (manualAtlasRasterCache.has(view)) return manualAtlasRasterCache.get(view);
  const promise = (async () => {
    const atlas = await loadImage(`assets/anatomy-atlas/${view}.svg?v=65`);
    if (!atlas) return null;
    const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 800;
    const atlasContext = canvas.getContext('2d',{willReadFrequently:true});
    // Both the source image and these manual traces use the final 400 × 800
    // canvas coordinates. Fitting this SVG into `bodyFrameCache` a second
    // time compressed and shifted every contour horizontally. Draw it at its
    // native canvas size so the trace sits exactly on the body it was made for.
    atlasContext.drawImage(atlas,0,0,400,800);
    return atlasContext.getImageData(0,0,400,800).data;
  })();
  manualAtlasRasterCache.set(view,promise); return promise;
}

async function paintMuscleGlow(context,id,color,view,selected=false) {
  const atlasColor = MANUAL_ATLAS_PALETTE[view]?.[id]; if (!atlasColor) return;
  const source = await manualAtlasRaster(view); if (!source) return;
  const atlasRgb = rgb(atlasColor), target = rgb(color);
  const layer = document.createElement('canvas'); layer.width = 400; layer.height = 800;
  const layerContext = layer.getContext('2d'); const pixels = layerContext.createImageData(400,800);
  const strength = selected ? .44 : .25;
  for (let index = 0; index < source.length; index += 4) {
    const isMuscle = source[index + 3] && Math.abs(source[index] - atlasRgb.red) < 4 && Math.abs(source[index + 1] - atlasRgb.green) < 4 && Math.abs(source[index + 2] - atlasRgb.blue) < 4;
    if (!isMuscle) continue;
    pixels.data[index] = target.red; pixels.data[index + 1] = target.green; pixels.data[index + 2] = target.blue;
    pixels.data[index + 3] = Math.round(source[index + 3] * strength);
  }
  layerContext.putImageData(pixels,0,0);
  context.save(); context.globalCompositeOperation = 'source-atop';
  context.shadowColor = color; context.shadowBlur = selected ? 12 : 6;
  context.drawImage(layer,0,0); context.restore();
}

async function paintBody(canvas) {
  const view = canvas.dataset.bodyView || 'front', base = await cleanBodyBase(view); if (!base || !document.body.contains(canvas)) return;
  const context = canvas.getContext('2d'); context.clearRect(0,0,400,800); context.drawImage(base,0,0,400,800);
  // Private visual QA mode. It never writes state and is only available by
  // URL while the anatomy atlas is being calibrated.
  const previewAtlas = new URLSearchParams(location.search).get('maskPreview') === '1';
  const previewRecovery = { pectorales:88, deltoides:64, biceps:72, abdominales:43, cuadriceps:38, pantorrillas:91, dorsales:82, triceps:58, gluteos:41, isquiotibiales:54 };
  const active = previewAtlas
    ? Object.keys(MANUAL_ATLAS_PALETTE[view] || {}).map(id => [id,{ initialized:true, recovery:previewRecovery[id] ?? 82 }])
    : Object.entries(appState.muscles).filter(([id,muscle]) => muscle.initialized && MANUAL_ATLAS_PALETTE[view]?.[id]);
  for (const [id,muscle] of active) {
    const status = Core.statusForMuscle(muscle);
    await paintMuscleGlow(context,id,status.color,view,ui.view === 'recovery' && ui.selectedMuscle === id);
  }
}
function paintAllBodies() { document.querySelectorAll('[data-body-canvas]').forEach(canvas => paintBody(canvas)); }

function boot() {
  renderCopy(); updateIntro(); warmFrames(0);
  loadLocalExerciseLibrary();
  const urlParams = new URLSearchParams(location.search);
  const forceIntro = urlParams.get('intro') === '1' || urlParams.has('introStep');
  if (forceIntro && (appState.onboardingComplete || appState.onboardingCompleted)) introState.answers = introAnswersFromProfile();
  if ((appState.onboardingComplete || appState.onboardingCompleted) && !forceIntro) { intro.hidden = true; home.hidden = false; restoreUrlState(); renderDashboard(); syncUrlState(); }
  else {
    intro.hidden = false; home.hidden = true;
    const requestedIntroStep = Math.max(0, Math.min(steps.length - 1, (Number(new URLSearchParams(location.search).get('introStep')) || 1) - 1));
    if (requestedIntroStep) { introState.step = requestedIntroStep; introState.progress = introState.target = Math.min(0.94, (requestedIntroStep + 0.5) / steps.length); count.textContent = `${String(requestedIntroStep + 1).padStart(2,'0')} / 08`; renderCopy(); updateIntro(); }
  }
  if (!intro.hidden) { introState.startedAt = Date.now(); introState.stepStartedAt = Date.now(); trackEvent('onboarding_start', { mode: 'new', step: 1 }); }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js?v=71',{updateViaCache:'none'}).then(registration => registration.update()).catch(() => {});
}

boot();
