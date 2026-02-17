const state = {
  currentDate: new Date(),
  view: "month",
  activeTab: "calendar",
  selectedPersonId: "family",
  roomId: "",
  lastUpdatedAt: 0,
  members: [],
  events: [],
  requests: [],
  todos: [],
  chores: [],
  game: {
    scheduleWeekStart: "",
    selectedDate: "",
    choresView: "today",
    assignments: [],
    nights: [],
    activities: [],
    settings: {
      scoreByDifficulty: { 1: 1, 2: 2, 3: 3 },
      allowReroll: true,
      cutoffDow: 0,
      cutoffHour: 20,
    },
  },
  editingEventId: "",
  editingEventInvolvedIds: [],
  planner: {
    location: "",
    prefs: "",
    partnerEmail: "",
    ideas: [],
    meal: {
      people: 4,
      timeMinutes: 45,
      budget: 80,
      day: "",
      location: "",
      mode: "EITHER",
      currency: "USD",
      skillLevel: "intermediate",
      dietaryConstraints: "",
      allergies: "",
      preferredCuisines: "",
      dislikedIngredients: "",
      equipment: "",
      prefs: "",
      deals: [],
      recipes: [],
      nextDay: [],
      rawText: "",
    },
  },
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
let syncTimer = null;
let lastCriticalCelebrationKey = "";

const el = {
  label: document.getElementById("currentLabel"),
  grid: document.getElementById("calendarGrid"),
  viewBtns: document.querySelectorAll(".view-btn"),
  mainTabs: document.querySelectorAll("#mainTabs .tab-btn"),
  personTabs: document.getElementById("personTabs"),
  choresPersonTabs: document.getElementById("choresPersonTabs"),
  calendarPage: document.getElementById("calendarPage"),
  requestsPage: document.getElementById("requestsPage"),
  choreListPage: document.getElementById("choreListPage"),
  choreGamePage: document.getElementById("choreGamePage"),
  plannerPage: document.getElementById("plannerPage"),
  mealPage: document.getElementById("mealPage"),
  settingsPage: document.getElementById("settingsPage"),
  requestList: document.getElementById("requestList"),
  requestEventsList: document.getElementById("requestEventsList"),
  recurringList: document.getElementById("recurringList"),
  calendarAssignedChores: document.getElementById("calendarAssignedChores"),
  mergedSourcesList: document.getElementById("mergedSourcesList"),
  oldMergedSource: document.getElementById("oldMergedSource"),
  oldMergedBefore: document.getElementById("oldMergedBefore"),
  memberList: document.getElementById("memberList"),
  choresViews: document.getElementById("choresViews"),
  choresHero: document.getElementById("choresHero"),
  choresHeroTitle: document.getElementById("choresHeroTitle"),
  choresHeroSub: document.getElementById("choresHeroSub"),
  choresProgressBar: document.getElementById("choresProgressBar"),
  choresProgressRing: document.getElementById("choresProgressRing"),
  choresProgressLabel: document.getElementById("choresProgressLabel"),
  choresNextUp: document.getElementById("choresNextUp"),
  choresUpdatedAt: document.getElementById("choresUpdatedAt"),
  choresTodayPanel: document.getElementById("choresTodayPanel"),
  choresWeekPanel: document.getElementById("choresWeekPanel"),
  choresHistoryPanel: document.getElementById("choresHistoryPanel"),
  choresSettingsPanel: document.getElementById("choresSettingsPanel"),
  plannerIdeas: document.getElementById("plannerIdeas"),
  mealPeople: document.getElementById("mealPeople"),
  mealTime: document.getElementById("mealTime"),
  mealBudget: document.getElementById("mealBudget"),
  mealDay: document.getElementById("mealDay"),
  mealLocation: document.getElementById("mealLocation"),
  mealMode: document.getElementById("mealMode"),
  mealSkill: document.getElementById("mealSkill"),
  mealDietary: document.getElementById("mealDietary"),
  mealAllergies: document.getElementById("mealAllergies"),
  mealCuisines: document.getElementById("mealCuisines"),
  mealDisliked: document.getElementById("mealDisliked"),
  mealEquipment: document.getElementById("mealEquipment"),
  mealPrefs: document.getElementById("mealPrefs"),
  mealDealsList: document.getElementById("mealDealsList"),
  mealRecipesList: document.getElementById("mealRecipesList"),
  mealNextDayList: document.getElementById("mealNextDayList"),
  mealPlanText: document.getElementById("mealPlanText"),
  plannerLocation: document.getElementById("plannerLocation"),
  plannerPrefs: document.getElementById("plannerPrefs"),
  partnerEmail: document.getElementById("partnerEmail"),
  choreGenNote: document.getElementById("choreGenNote"),
  choreWeekStart: document.getElementById("choreWeekStart"),
  eventMember: document.getElementById("eventMember"),
  requestMember: document.getElementById("requestMember"),
  icalMember: document.getElementById("icalMember"),
  eventAllDay: document.getElementById("eventAllDay"),
  eventTimeRow: document.getElementById("eventTimeRow"),
  eventInvolved: document.getElementById("eventInvolved"),
  eventForm: document.getElementById("eventForm"),
  eventTitle: document.getElementById("eventTitle"),
  eventStartDate: document.getElementById("eventStartDate"),
  eventEndDate: document.getElementById("eventEndDate"),
  eventStart: document.getElementById("eventStart"),
  eventEnd: document.getElementById("eventEnd"),
  eventRecurring: document.getElementById("eventRecurring"),
  eventSubmitBtn: document.getElementById("eventSubmitBtn"),
  eventCancelBtn: document.getElementById("eventCancelBtn"),
  choreGameWeekStart: document.getElementById("choreGameWeekStart"),
  choreDailyMax: document.getElementById("choreDailyMax"),
  finalizeWeekBtn: document.getElementById("finalizeWeekBtn"),
  choreGameDate: document.getElementById("choreGameDate"),
  dailyAssignmentsList: document.getElementById("dailyAssignmentsList"),
  weeklyLoadList: document.getElementById("weeklyLoadList"),
  gameLeaderboardList: document.getElementById("gameLeaderboardList"),
  nightsList: document.getElementById("nightsList"),
  scoreDiff1: document.getElementById("scoreDiff1"),
  scoreDiff2: document.getElementById("scoreDiff2"),
  scoreDiff3: document.getElementById("scoreDiff3"),
  allowReroll: document.getElementById("allowReroll"),
  saveGameSettingsBtn: document.getElementById("saveGameSettingsBtn"),
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newRoomId() {
  return Math.random().toString(36).slice(2, 10);
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function addDaysIso(iso, days) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

function plusOneHour(time) {
  if (!/^\d{2}:\d{2}$/.test(String(time || ""))) return "";
  const [hh, mm] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  d.setHours(d.getHours() + 1);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function memberColor(memberName) {
  const input = (memberName || "family").toLowerCase();
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 45%)`;
}

function defaultMembers() {
  return [
    { id: uid(), name: "Adult 1", role: "adult", age: 35, gender: "woman" },
    { id: uid(), name: "Adult 2", role: "adult", age: 36, gender: "man" },
    { id: uid(), name: "Kid 1", role: "child", age: 12, gender: "non-binary" },
    { id: uid(), name: "Kid 2", role: "child", age: 10, gender: "non-binary" },
    { id: uid(), name: "Kid 3", role: "child", age: 8, gender: "non-binary" },
    { id: uid(), name: "Kid 4", role: "child", age: 6, gender: "non-binary" },
  ];
}

function normalizeMember(m) {
  return {
    id: m.id || uid(),
    name: m.name || "Unnamed",
    role: m.role === "adult" ? "adult" : "child",
    age: Number(m.age) || 0,
    gender: m.gender || "non-binary",
  };
}

function normalizeEvent(ev) {
  return {
    id: ev.id || uid(),
    title: ev.title || "Untitled",
    startDate: ev.startDate || ev.date || "",
    endDate: ev.endDate || ev.startDate || ev.date || "",
    allDay: !!ev.allDay,
    start: ev.start || "",
    end: ev.end || "",
    memberId: ev.memberId || "",
    memberName: ev.memberName || ev.member || "",
    involvedMemberIds: Array.isArray(ev.involvedMemberIds) ? ev.involvedMemberIds : [],
    importSourceId: ev.importSourceId || "",
    importSourceName: ev.importSourceName || "",
    importedAt: Number(ev.importedAt) || 0,
    recurring: ev.recurring || "none",
  };
}

function normalizeRequest(r) {
  return {
    id: r.id || uid(),
    text: r.text || "",
    requestedDate: r.requestedDate || "",
    requestedTime: r.requestedTime || "",
    memberId: r.memberId || "",
    memberName: r.memberName || r.member || "",
    status: ["pending", "approved", "disapproved"].includes(r.status) ? r.status : "pending",
    approvedAt: r.approvedAt || "",
    disapprovedAt: r.disapprovedAt || "",
    approvedEventId: r.approvedEventId || "",
  };
}

function normalizeChore(c) {
  return {
    id: c.id || uid(),
    title: c.title || "",
    frequency: c.frequency || "Daily",
    done: !!c.done,
    autogenerated: !!c.autogenerated,
    memberId: c.memberId || "",
    memberName: c.memberName || c.member || "",
  };
}

function normalizeGame(g) {
  const score = g?.settings?.scoreByDifficulty || {};
  return {
    scheduleWeekStart: g?.scheduleWeekStart || "",
    selectedDate: g?.selectedDate || "",
    choresView: ["today", "week", "history", "settings"].includes(g?.choresView) ? g.choresView : "today",
    assignments: Array.isArray(g?.assignments) ? g.assignments.map((a) => ({
      id: a.id || uid(),
      choreId: a.choreId || "",
      choreTitle: a.choreTitle || "Chore",
      userId: a.userId || "",
      userName: a.userName || "",
      scheduledDate: a.scheduledDate || "",
      status: ["assigned", "completed", "skipped", "verified"].includes(a.status) ? a.status : "assigned",
      completedAt: a.completedAt || "",
      pointsAwarded: Number(a.pointsAwarded) || 0,
      difficulty: Math.max(1, Math.min(3, Number(a.difficulty) || 1)),
      estimatedMinutes: Number(a.estimatedMinutes) || 15,
      category: a.category || "general",
      ageMin: Number(a.ageMin) || 0,
    })) : [],
    nights: Array.isArray(g?.nights) ? g.nights.map((n) => ({
      id: n.id || uid(),
      type: n.type === "funNight" ? "funNight" : "gameNight",
      scheduledDate: n.scheduledDate || "",
      winnerUserId: n.winnerUserId || "",
      winnerUserIds: Array.isArray(n.winnerUserIds) ? n.winnerUserIds : [],
      randomizerUnlocked: !!n.randomizerUnlocked,
      randomizerUsedAt: n.randomizerUsedAt || "",
      selectedActivityId: n.selectedActivityId || "",
      rerollUsed: !!n.rerollUsed,
      rerollLog: Array.isArray(n.rerollLog) ? n.rerollLog : [],
    })) : [],
    activities: Array.isArray(g?.activities) ? g.activities.map((a) => ({
      id: a.id || uid(),
      type: a.type === "funNight" ? "funNight" : "gameNight",
      title: a.title || "Activity",
      tags: Array.isArray(a.tags) ? a.tags : [],
      durationMinutes: Number(a.durationMinutes) || 60,
      active: a.active !== false,
    })) : [],
    settings: {
      scoreByDifficulty: {
        1: Number(score[1]) || 1,
        2: Number(score[2]) || 2,
        3: Number(score[3]) || 3,
      },
      allowReroll: g?.settings?.allowReroll !== false,
      cutoffDow: Number(g?.settings?.cutoffDow) || 0,
      cutoffHour: Number(g?.settings?.cutoffHour) || 20,
      celebrateCompletions: g?.settings?.celebrateCompletions !== false,
      celebrateCriticalMoment: g?.settings?.celebrateCriticalMoment !== false,
      lateHighlightHour: Number.isFinite(Number(g?.settings?.lateHighlightHour))
        ? Math.max(16, Math.min(23, Number(g?.settings?.lateHighlightHour)))
        : 19,
    },
  };
}

function normalizePayload(p) {
  return {
    members: (Array.isArray(p.members) ? p.members : []).map(normalizeMember),
    events: (Array.isArray(p.events) ? p.events : []).map(normalizeEvent),
    requests: (Array.isArray(p.requests) ? p.requests : []).map(normalizeRequest),
    chores: (Array.isArray(p.chores) ? p.chores : []).map(normalizeChore),
    selectedPersonId: typeof p.selectedPersonId === "string" ? p.selectedPersonId : "family",
    activeTab: ["calendar", "requests", "chorelist", "planner", "meal", "settings"].includes(p.activeTab)
      ? p.activeTab
      : ((p.activeTab === "chores" || p.activeTab === "choregame") ? "chorelist" : "calendar"),
    planner: {
      location: p.planner?.location || "",
      prefs: p.planner?.prefs || "",
      partnerEmail: p.planner?.partnerEmail || "",
      ideas: Array.isArray(p.planner?.ideas) ? p.planner.ideas : [],
      meal: {
        people: Number(p.planner?.meal?.people) || 4,
        timeMinutes: Number(p.planner?.meal?.timeMinutes) || 45,
        budget: Number(p.planner?.meal?.budget) || 80,
        day: p.planner?.meal?.day || "",
        location: p.planner?.meal?.location || "",
        mode: p.planner?.meal?.mode || "EITHER",
        currency: p.planner?.meal?.currency || "USD",
        skillLevel: p.planner?.meal?.skillLevel || "intermediate",
        dietaryConstraints: p.planner?.meal?.dietaryConstraints || "",
        allergies: p.planner?.meal?.allergies || "",
        preferredCuisines: p.planner?.meal?.preferredCuisines || "",
        dislikedIngredients: p.planner?.meal?.dislikedIngredients || "",
        equipment: p.planner?.meal?.equipment || "",
        prefs: p.planner?.meal?.prefs || "",
        deals: Array.isArray(p.planner?.meal?.deals) ? p.planner.meal.deals : [],
        recipes: Array.isArray(p.planner?.meal?.recipes) ? p.planner.meal.recipes : [],
        nextDay: Array.isArray(p.planner?.meal?.nextDay) ? p.planner.meal.nextDay : [],
        rawText: p.planner?.meal?.rawText || "",
      },
    },
    game: normalizeGame(p.game || {}),
    lastUpdatedAt: Number(p.lastUpdatedAt) || 0,
  };
}

function applyLoadedState(raw) {
  const p = normalizePayload(raw || {});
  state.members = p.members.length ? p.members : defaultMembers();
  state.events = p.events;
  state.requests = p.requests;
  state.chores = p.chores;
  state.selectedPersonId = p.selectedPersonId;
  state.activeTab = p.activeTab;
  state.planner = p.planner;
  state.game = p.game;
  state.lastUpdatedAt = p.lastUpdatedAt;
  backfillLinks();

  if (state.selectedPersonId !== "family" && !findMember(state.selectedPersonId)) {
    state.selectedPersonId = "family";
  }
}

function serializeState() {
  return {
    members: state.members,
    events: state.events,
    requests: state.requests,
    chores: state.chores,
    selectedPersonId: state.selectedPersonId,
    activeTab: state.activeTab,
    planner: state.planner,
    game: state.game,
    lastUpdatedAt: state.lastUpdatedAt,
  };
}

function saveLocal() {
  localStorage.setItem("familyCalendarState", JSON.stringify(serializeState()));
}

function touch() {
  state.lastUpdatedAt = Date.now();
}

async function pushRemote() {
  if (!state.roomId) return;
  try {
    await fetch(`/api/state?room=${encodeURIComponent(state.roomId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serializeState()),
    });
  } catch (_err) {}
}

async function saveState() {
  pruneExpiredDisapprovedRequests();
  touch();
  saveLocal();
  await pushRemote();
}

async function fetchRemote() {
  if (!state.roomId) return null;
  try {
    const r = await fetch(`/api/state?room=${encodeURIComponent(state.roomId)}`);
    if (!r.ok) return null;
    return await r.json();
  } catch (_err) {
    return null;
  }
}

async function mergeRemoteIfNewer() {
  const remote = await fetchRemote();
  if (!remote || Number(remote.lastUpdatedAt) <= state.lastUpdatedAt) return;
  applyLoadedState(remote);
  saveLocal();
  render();
}

function startPolling() {
  if (!state.roomId) return;
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(() => mergeRemoteIfNewer(), 5000);
}

async function loadState() {
  const url = new URL(window.location.href);
  const room = url.searchParams.get("room");
  const data = url.searchParams.get("data");
  if (room) state.roomId = room;

  if (data) {
    try { applyLoadedState(JSON.parse(decodeURIComponent(atob(data)))); } catch (_err) {}
  }

  const local = localStorage.getItem("familyCalendarState");
  if (local) {
    try {
      const parsed = JSON.parse(local);
      const n = normalizePayload(parsed);
      if (n.lastUpdatedAt >= state.lastUpdatedAt) applyLoadedState(parsed);
    } catch (_err) {}
  }

  if (state.roomId) {
    const remote = await fetchRemote();
    if (remote && Number(remote.lastUpdatedAt) > state.lastUpdatedAt) {
      applyLoadedState(remote);
    } else if (!remote && state.lastUpdatedAt) {
      await pushRemote();
    }
  }

  if (!state.members.length) state.members = defaultMembers();
  saveLocal();
  startPolling();
}

function findMember(id) {
  return state.members.find((m) => m.id === id) || null;
}

function findMemberByName(name) {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  return state.members.find((m) => m.name.trim().toLowerCase() === n) || null;
}

function findMemberByLooseName(name) {
  if (!name) return null;
  const n = String(name).trim().toLowerCase();
  const compact = n.replace(/[^a-z0-9]/g, "");
  if (!compact) return null;
  return state.members.find((m) => {
    const base = m.name.trim().toLowerCase();
    const packed = base.replace(/[^a-z0-9]/g, "");
    return packed === compact || packed.includes(compact) || compact.includes(packed);
  }) || null;
}

function displayMember(item) {
  if (item.memberId) {
    const m = findMember(item.memberId);
    if (m) return m.name;
  }
  return item.memberName || "Unassigned";
}

function backfillLinks() {
  for (const collection of [state.events, state.requests, state.chores]) {
    for (const row of collection) {
      if (!row.memberId && row.memberName) {
        const m = findMemberByName(row.memberName);
        if (m) row.memberId = m.id;
      }
      if (row.memberId && !row.memberName) {
        const m = findMember(row.memberId);
        if (m) row.memberName = m.name;
      }
    }
  }
  for (const a of state.game.assignments) {
    if (!a.userId && a.userName) {
      const m = findMemberByName(a.userName);
      if (m) a.userId = m.id;
    }
    if (a.userId && !a.userName) {
      const m = findMember(a.userId);
      if (m) a.userName = m.name;
    }
  }
}

function matchesSelected(item) {
  if (state.selectedPersonId === "family") return true;
  if (item.memberId === state.selectedPersonId) return true;
  if (Array.isArray(item.involvedMemberIds) && item.involvedMemberIds.includes(state.selectedPersonId)) return true;
  return false;
}

function visibleEvents() { return state.events.filter(matchesSelected); }
function visibleRequests() { return state.requests.filter(matchesSelected); }
function visibleChores() { return state.chores.filter(matchesSelected); }

function setMainTab(tab, save = true) {
  state.activeTab = tab;
  el.mainTabs.forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  el.calendarPage?.classList.toggle("active", tab === "calendar");
  el.requestsPage?.classList.toggle("active", tab === "requests");
  el.choreListPage?.classList.toggle("active", tab === "chorelist");
  el.choreGamePage?.classList.toggle("active", tab === "choregame");
  el.plannerPage?.classList.toggle("active", tab === "planner");
  el.mealPage?.classList.toggle("active", tab === "meal");
  el.settingsPage?.classList.toggle("active", tab === "settings");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (save) saveState();
}

function setSelectedPerson(id, save = true) {
  state.selectedPersonId = id;
  renderPersonTabs();
  renderChoresPersonTabs();
  populateMemberSelects();
  renderCalendar();
  renderRequests();
  renderRequestEventsList();
  renderRecurring();
  renderChores();
  renderCalendarAssignedChores();
  updateChoreNote();
  if (save) saveState();
}

function renderPersonTabs() {
  const items = [
    `<button class="person-tab ${state.selectedPersonId === "family" ? "active" : ""}" data-person-id="family">Family</button>`,
    ...state.members.map((m) => `<button class="person-tab ${state.selectedPersonId === m.id ? "active" : ""}" data-person-id="${m.id}">${escapeHtml(m.name)}</button>`),
  ];
  el.personTabs.innerHTML = items.join("");
}

function renderChoresPersonTabs() {
  if (!el.choresPersonTabs) return;
  const items = [
    `<button class="person-tab ${state.selectedPersonId === "family" ? "active" : ""}" data-chores-person-id="family">Family</button>`,
    ...state.members.map((m) => `
    <button class="person-tab ${state.selectedPersonId === m.id ? "active" : ""}" data-chores-person-id="${m.id}">
      ${escapeHtml(m.name)}
    </button>
  `),
  ];
  el.choresPersonTabs.innerHTML = items.join("");
}

function renderInvolvedChecklist() {
  const selected = new Set(state.editingEventInvolvedIds || []);
  el.eventInvolved.innerHTML = state.members.map((m) => `
    <label class="checkbox-row">
      <input type="checkbox" value="${m.id}" data-involved-member ${selected.has(m.id) ? "checked" : ""} />
      <span>${escapeHtml(m.name)}</span>
    </label>
  `).join("");
}

function eventActionButtons(evId) {
  return `
    <div class="row-actions">
      <button class="btn btn-secondary btn-sm" type="button" data-edit-event="${evId}">Edit</button>
      <button class="icon-btn" type="button" data-delete-event="${evId}" title="Delete event">✕</button>
    </div>
  `;
}

function updateEventFormMode() {
  const editing = Boolean(state.editingEventId);
  if (el.eventSubmitBtn) el.eventSubmitBtn.textContent = editing ? "Save Event Changes" : "Add Event";
  if (el.eventCancelBtn) el.eventCancelBtn.classList.toggle("hidden", !editing);
}

function resetEventEditor(form = el.eventForm) {
  state.editingEventId = "";
  state.editingEventInvolvedIds = [];
  if (form) form.reset();
  if (el.eventTimeRow) el.eventTimeRow.classList.remove("hidden");
  renderInvolvedChecklist();
  populateMemberSelects();
  updateEventFormMode();
}

function startEventEdit(eventId) {
  const ev = state.events.find((x) => x.id === eventId);
  if (!ev) return;
  state.editingEventId = ev.id;
  state.editingEventInvolvedIds = Array.isArray(ev.involvedMemberIds) && ev.involvedMemberIds.length
    ? [...ev.involvedMemberIds]
    : [ev.memberId].filter(Boolean);
  setMainTab("calendar");
  renderInvolvedChecklist();

  if (el.eventTitle) el.eventTitle.value = ev.title || "";
  if (el.eventStartDate) el.eventStartDate.value = ev.startDate || "";
  if (el.eventEndDate) el.eventEndDate.value = ev.endDate || ev.startDate || "";
  if (el.eventAllDay) el.eventAllDay.checked = !!ev.allDay;
  if (el.eventStart) el.eventStart.value = ev.start || "";
  if (el.eventEnd) el.eventEnd.value = ev.end || "";
  if (el.eventRecurring) el.eventRecurring.value = ev.recurring || "none";
  if (el.eventMember) el.eventMember.value = ev.memberId || state.members[0]?.id || "";

  if (el.eventTimeRow) el.eventTimeRow.classList.toggle("hidden", !!ev.allDay);
  updateEventFormMode();
  el.eventTitle?.focus();
}

async function removeEvent(eventId) {
  const before = state.events.length;
  state.events = state.events.filter((x) => x.id !== eventId);
  if (before === state.events.length) return;
  if (state.editingEventId === eventId) resetEventEditor();
  await saveState();
  renderCalendar();
  renderRecurring();
  renderPersonEvents();
  renderRequestEventsList();
}

function populateMemberSelects() {
  const selects = [el.eventMember, el.requestMember, el.icalMember];
  const selected = state.selectedPersonId !== "family" ? state.selectedPersonId : state.members[0]?.id;
  for (const s of selects) {
    if (!s) continue;
    s.innerHTML = state.members.map((m) => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join("");
    if (selected) s.value = selected;
  }
}

function setView(view) {
  state.view = view;
  el.viewBtns.forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  renderCalendar();
}

function shiftDate(direction) {
  const d = new Date(state.currentDate);
  if (state.view === "day") d.setDate(d.getDate() + direction);
  if (state.view === "week") d.setDate(d.getDate() + direction * 7);
  if (state.view === "month") d.setMonth(d.getMonth() + direction);
  if (state.view === "year") d.setFullYear(d.getFullYear() + direction);
  state.currentDate = d;
  renderCalendar();
}

function getWeekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekStartMonday(input) {
  const d = new Date(typeof input === "string" ? `${input}T00:00:00` : input);
  const day = d.getDay();
  const shift = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + shift);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekStartIso(input) {
  return formatDate(getWeekStartMonday(input || new Date()));
}

function weekDatesFrom(weekStartIsoDate) {
  return Array.from({ length: 7 }, (_, i) => addDaysIso(weekStartIsoDate, i));
}

function defaultGameActivities() {
  return [
    { id: uid(), type: "gameNight", title: "Board Game Tournament", tags: ["indoor"], durationMinutes: 90, active: true },
    { id: uid(), type: "gameNight", title: "Card Night + Snacks", tags: ["indoor"], durationMinutes: 75, active: true },
    { id: uid(), type: "funNight", title: "Family Movie Night", tags: ["indoor"], durationMinutes: 120, active: true },
    { id: uid(), type: "funNight", title: "Bowling Night", tags: ["outdoor"], durationMinutes: 120, active: true },
  ];
}

function ensureGameDefaults() {
  if (!state.game.scheduleWeekStart) state.game.scheduleWeekStart = weekStartIso(new Date());
  if (!state.game.selectedDate) state.game.selectedDate = formatDate(new Date());
  if (!["today", "week", "history", "settings"].includes(state.game.choresView)) state.game.choresView = "today";
  if (!Array.isArray(state.game.activities) || !state.game.activities.length) {
    state.game.activities = defaultGameActivities();
  }
  if (!state.game.settings) state.game.settings = {};
  if (typeof state.game.settings.celebrateCompletions !== "boolean") state.game.settings.celebrateCompletions = true;
  if (typeof state.game.settings.celebrateCriticalMoment !== "boolean") state.game.settings.celebrateCriticalMoment = true;
  if (!Number.isFinite(Number(state.game.settings.lateHighlightHour))) state.game.settings.lateHighlightHour = 19;
  ensureNightsForWeek(state.game.scheduleWeekStart);
}

function ensureNightsForWeek(weekStart) {
  const gameDate = addDaysIso(weekStart, 4);
  const funDate = addDaysIso(weekStart, 5);
  const upsert = (type, scheduledDate) => {
    let n = state.game.nights.find((x) => x.type === type && x.scheduledDate === scheduledDate);
    if (!n) {
      n = {
        id: uid(),
        type,
        scheduledDate,
        winnerUserId: "",
        winnerUserIds: [],
        randomizerUnlocked: false,
        randomizerUsedAt: "",
        selectedActivityId: "",
        rerollUsed: false,
        rerollLog: [],
      };
      state.game.nights.push(n);
    }
  };
  upsert("gameNight", gameDate);
  upsert("funNight", funDate);
}

function choreTemplates() {
  const map = new Map();
  for (const c of state.chores) {
    const key = String(c.title || "").trim().toLowerCase();
    if (!key) continue;
    const member = findMember(c.memberId);
    const difficulty = c.frequency === "Monthly" ? 3 : c.frequency === "Weekly" ? 2 : 1;
    const tpl = map.get(key) || {
      id: `ch-${key.replace(/[^a-z0-9]+/g, "-")}`,
      title: c.title,
      difficulty,
      estimatedMinutes: difficulty === 3 ? 45 : difficulty === 2 ? 30 : 20,
      ageMin: member?.role === "adult" ? 16 : Math.max(5, Number(member?.age) || 8),
      category: key.split(" ")[0] || "general",
      active: true,
    };
    if (member?.role === "adult") tpl.ageMin = Math.max(tpl.ageMin, 16);
    map.set(key, tpl);
  }
  if (!map.size) {
    return [
      { id: uid(), title: "Kitchen cleanup", difficulty: 1, estimatedMinutes: 20, ageMin: 8, category: "kitchen", active: true },
      { id: uid(), title: "Laundry sort", difficulty: 2, estimatedMinutes: 30, ageMin: 10, category: "laundry", active: true },
      { id: uid(), title: "Trash and recycling", difficulty: 2, estimatedMinutes: 20, ageMin: 10, category: "home", active: true },
      { id: uid(), title: "Vacuum common areas", difficulty: 3, estimatedMinutes: 40, ageMin: 12, category: "cleaning", active: true },
    ];
  }
  return Array.from(map.values());
}

function memberEligibleForTemplate(member, tpl) {
  return Number(member.age || 0) >= Number(tpl.ageMin || 0);
}

function generateBalancedAssignments(weekStart, dailyMaxPerPerson, targetPerPerson = 5) {
  const members = state.members.slice();
  const templates = choreTemplates().filter((t) => t.active);
  const days = weekDatesFrom(weekStart);
  const dayLoad = new Map(days.map((d) => [d, 0]));
  const perMemberDaily = new Map();
  const perMemberTotal = new Map(members.map((m) => [m.id, 0]));
  const templateUse = new Map(templates.map((t) => [t.id, 0]));
  const out = [];
  const dayCategoryCount = new Map(days.map((d) => [d, new Map()]));
  const weekSeed = Math.floor(new Date(`${weekStart}T00:00:00`).getTime() / 86400000);

  members.forEach((m) => perMemberDaily.set(m.id, new Map(days.map((d) => [d, 0]))));

  for (let pass = 0; pass < targetPerPerson; pass += 1) {
    for (let memberIndex = 0; memberIndex < members.length; memberIndex += 1) {
      const member = members[memberIndex];
      const memberDayMap = perMemberDaily.get(member.id);
      const preferred = days[(weekSeed + memberIndex + pass) % days.length];
      const candidateDays = days
        .filter((d) => (memberDayMap.get(d) || 0) < dailyMaxPerPerson)
        .sort((a, b) => {
          const loadDiff = (dayLoad.get(a) || 0) - (dayLoad.get(b) || 0);
          if (loadDiff !== 0) return loadDiff;
          if (a === preferred) return -1;
          if (b === preferred) return 1;
          return a.localeCompare(b);
        });
      const chosenDay = candidateDays[0];
      if (!chosenDay) continue;

      const eligible = templates.filter((tpl) => memberEligibleForTemplate(member, tpl));
      if (!eligible.length) continue;

      const catMap = dayCategoryCount.get(chosenDay) || new Map();
      const best = eligible
        .slice()
        .sort((a, b) => {
          const ac = catMap.get(a.category) || 0;
          const bc = catMap.get(b.category) || 0;
          if (ac !== bc) return ac - bc;
          const au = templateUse.get(a.id) || 0;
          const bu = templateUse.get(b.id) || 0;
          if (au !== bu) return au - bu;
          return a.title.localeCompare(b.title);
        })[0];

      const points = Number(state.game.settings.scoreByDifficulty[best.difficulty]) || best.difficulty;
      out.push({
        id: uid(),
        choreId: best.id,
        choreTitle: best.title,
        userId: member.id,
        userName: member.name,
        scheduledDate: chosenDay,
        status: "assigned",
        completedAt: "",
        pointsAwarded: points,
        difficulty: best.difficulty,
        estimatedMinutes: best.estimatedMinutes,
        category: best.category,
        ageMin: best.ageMin,
      });
      memberDayMap.set(chosenDay, (memberDayMap.get(chosenDay) || 0) + 1);
      dayLoad.set(chosenDay, (dayLoad.get(chosenDay) || 0) + 1);
      perMemberTotal.set(member.id, (perMemberTotal.get(member.id) || 0) + 1);
      templateUse.set(best.id, (templateUse.get(best.id) || 0) + 1);
      catMap.set(best.category, (catMap.get(best.category) || 0) + 1);
      dayCategoryCount.set(chosenDay, catMap);
    }
  }

  return out;
}

function hasWeeklyQuota(assignments, weekStart, targetPerPerson = 5) {
  const counts = new Map(state.members.map((m) => [m.id, 0]));
  for (const row of assignments) {
    if (!inWeek(row.scheduledDate, weekStart)) continue;
    counts.set(row.userId, (counts.get(row.userId) || 0) + 1);
  }
  return state.members.every((m) => (counts.get(m.id) || 0) >= targetPerPerson);
}

function hasExactDailyQuota(assignments, weekStart, dailyPerPerson = 5) {
  const weekDays = weekDatesFrom(weekStart);
  const countMap = new Map();
  for (const row of assignments) {
    if (!inWeek(row.scheduledDate, weekStart)) continue;
    const key = `${row.userId}|${row.scheduledDate}`;
    countMap.set(key, (countMap.get(key) || 0) + 1);
  }
  for (const m of state.members) {
    for (const d of weekDays) {
      if ((countMap.get(`${m.id}|${d}`) || 0) !== dailyPerPerson) return false;
    }
  }
  return true;
}

function inWeek(isoDate, weekStart) {
  return isoDate >= weekStart && isoDate <= addDaysIso(weekStart, 6);
}

function weekAssignments(weekStart) {
  return state.game.assignments.filter((a) => inWeek(a.scheduledDate, weekStart));
}

function visibleAssignments(rows) {
  if (state.selectedPersonId === "family") return rows;
  return rows.filter((a) => a.userId === state.selectedPersonId);
}

function assignmentsForDate(dateObj) {
  const iso = formatDate(dateObj);
  return visibleAssignments(state.game.assignments.filter((a) => a.scheduledDate === iso));
}

function enforceDailyAssignmentCap(rows, maxPerDayPerPerson = 5) {
  const capMap = new Map();
  const out = [];
  const sorted = rows.slice().sort((a, b) => `${a.scheduledDate}${a.userId}${a.choreTitle}`.localeCompare(`${b.scheduledDate}${b.userId}${b.choreTitle}`));
  for (const row of sorted) {
    const key = `${row.userId}|${row.scheduledDate}`;
    const used = capMap.get(key) || 0;
    if (used >= maxPerDayPerPerson) continue;
    capMap.set(key, used + 1);
    out.push(row);
  }
  return out;
}

function computeLeaderboard(weekStart) {
  const sunday = addDaysIso(weekStart, 6);
  const base = new Map(state.members.map((m) => [m.id, {
    userId: m.id,
    userName: m.name,
    points: 0,
    completed: 0,
    finalDayEarliest: "",
  }]));

  for (const a of weekAssignments(weekStart)) {
    if (a.status !== "completed" && a.status !== "verified") continue;
    const row = base.get(a.userId);
    if (!row) continue;
    row.points += Number(a.pointsAwarded) || 0;
    row.completed += 1;
    if (a.scheduledDate === sunday && a.completedAt) {
      if (!row.finalDayEarliest || a.completedAt < row.finalDayEarliest) row.finalDayEarliest = a.completedAt;
    }
  }

  const rows = Array.from(base.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.completed !== a.completed) return b.completed - a.completed;
    if (a.finalDayEarliest && b.finalDayEarliest) return a.finalDayEarliest.localeCompare(b.finalDayEarliest);
    if (a.finalDayEarliest) return -1;
    if (b.finalDayEarliest) return 1;
    return a.userName.localeCompare(b.userName);
  });

  if (!rows.length) return { rows, winners: [] };
  const topPoints = rows[0].points;
  let contenders = rows.filter((r) => r.points === topPoints);
  if (contenders.length > 1) {
    const topCompleted = Math.max(...contenders.map((r) => r.completed));
    contenders = contenders.filter((r) => r.completed === topCompleted);
  }
  if (contenders.length > 1) {
    const withFinal = contenders.filter((r) => r.finalDayEarliest);
    if (withFinal.length) {
      const earliest = withFinal.reduce((min, r) => (r.finalDayEarliest < min ? r.finalDayEarliest : min), withFinal[0].finalDayEarliest);
      contenders = withFinal.filter((r) => r.finalDayEarliest === earliest);
    }
  }

  return { rows, winners: contenders.map((x) => x.userId) };
}

function activityById(id) {
  return state.game.activities.find((a) => a.id === id) || null;
}

function randomActivityForType(type) {
  const active = state.game.activities.filter((a) => a.type === type && a.active);
  if (!active.length) return null;
  const previous = state.game.nights
    .filter((n) => n.type === type && n.selectedActivityId)
    .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))[0];
  const excludeId = previous?.selectedActivityId;
  const pool = active.filter((a) => a.id !== excludeId);
  const choices = pool.length ? pool : active;
  return choices[Math.floor(Math.random() * choices.length)] || null;
}

function occursOnDate(ev, dateObj, targetIso) {
  if (!ev.startDate) return false;
  const end = ev.endDate || ev.startDate;
  if (ev.recurring === "none") return targetIso >= ev.startDate && targetIso <= end;
  const origin = new Date(`${ev.startDate}T00:00:00`);
  if (dateObj < origin) return false;
  if (ev.recurring === "daily") return true;
  if (ev.recurring === "weekly") return origin.getDay() === dateObj.getDay();
  if (ev.recurring === "monthly") return origin.getDate() === dateObj.getDate();
  return false;
}

function eventsForDate(dateObj) {
  const iso = formatDate(dateObj);
  return visibleEvents().filter((ev) => occursOnDate(ev, dateObj, iso));
}

function eventsForWeek(anchorDate) {
  const start = getWeekStart(anchorDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const x = new Date(start);
    x.setDate(start.getDate() + i);
    return x;
  });

  const rows = [];
  for (const day of days) {
    for (const ev of eventsForDate(day)) {
      rows.push({ day: new Date(day), ev });
    }
  }
  return rows;
}

function eventDateText(ev) {
  if (!ev.startDate) return "";
  if (ev.startDate === ev.endDate) return ev.startDate;
  return `${ev.startDate} to ${ev.endDate}`;
}

function eventInvolvedNames(ev) {
  const ids = Array.isArray(ev.involvedMemberIds) ? ev.involvedMemberIds : [];
  const names = ids.map((id) => findMember(id)?.name).filter(Boolean);
  return names;
}

function dateCell(date, includeDayChores = false) {
  const iso = formatDate(date);
  const rows = eventsForDate(date).map((ev) => {
    const owner = displayMember(ev);
    const involved = eventInvolvedNames(ev);
    const involvedText = involved.length ? `<div class="event-meta">Involved: ${escapeHtml(involved.join(", "))}</div>` : "";
    return `
      <li class="event-item" style="--member-color: ${memberColor(owner)}">
        <div>
          <strong>${ev.allDay ? "All Day " : (ev.start ? `${ev.start} ` : "")}${escapeHtml(ev.title)}</strong>
          <div class="event-meta">${escapeHtml(eventDateText(ev))}${ev.recurring !== "none" ? ` | ${escapeHtml(ev.recurring)}` : ""}</div>
          ${involvedText}
        </div>
        <div class="event-right">
          <span class="member-pill" style="--member-color: ${memberColor(owner)}">${escapeHtml(owner)}</span>
          ${eventActionButtons(ev.id)}
        </div>
      </li>
    `;
  }).join("");

  const choresBlock = includeDayChores
    ? `<div class="day-chores"><h4>Daily Chores</h4><ul>${assignmentsForDate(date).map((a) => `<li><label><input type="checkbox" data-toggle-assignment="${a.id}" ${a.status === "completed" || a.status === "verified" ? "checked" : ""} /><span class="${a.status === "completed" || a.status === "verified" ? "done" : ""}">${escapeHtml(a.choreTitle)}</span></label></li>`).join("") || "<li class='muted'>No chores scheduled</li>"}</ul></div>`
    : "";

  return `
    <article class="cell">
      <h4>${DAY_NAMES[date.getDay()]} ${date.getMonth() + 1}/${date.getDate()}</h4>
      <ul>${rows || "<li class='muted'>No events</li>"}</ul>
      ${choresBlock}
      <button class="link-btn" data-action="jump" data-date="${iso}">Add here</button>
    </article>
  `;
}

function renderCalendar() {
  const d = new Date(state.currentDate);
  const who = state.selectedPersonId === "family" ? "Family" : (findMember(state.selectedPersonId)?.name || "Family");

  if (state.view === "day") {
    el.label.textContent = `${who} | ${d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`;
    el.grid.className = "calendar-grid day";
    el.grid.innerHTML = dateCell(d, true);
    renderCalendarAssignedChores();
    return;
  }

  if (state.view === "week") {
    const start = getWeekStart(d);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const weekly = eventsForWeek(d).sort((a, b) => {
      const dateDiff = a.day.getTime() - b.day.getTime();
      if (dateDiff !== 0) return dateDiff;
      const ta = a.ev.allDay ? "00:00" : (a.ev.start || "23:59");
      const tb = b.ev.allDay ? "00:00" : (b.ev.start || "23:59");
      return ta.localeCompare(tb);
    });
    el.label.textContent = `${who} | ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    el.grid.className = "calendar-grid week-list";
    el.grid.innerHTML = weekly.length
      ? `<article class="cell"><h4>Weekly Events</h4><ul>${weekly.map(({ day, ev }) => {
        const owner = displayMember(ev);
        const involved = eventInvolvedNames(ev);
        const involvedText = involved.length ? ` | Involved: ${escapeHtml(involved.join(", "))}` : "";
        const timeText = ev.allDay ? "All Day" : (ev.start ? `${escapeHtml(ev.start)}-${escapeHtml(ev.end || "")}` : "Time TBD");
        return `<li class="event-item" style="--member-color:${memberColor(owner)}"><div><strong>${day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} | ${timeText} | ${escapeHtml(ev.title)}</strong><div class="event-meta">${escapeHtml(owner)}${involvedText}</div></div>${eventActionButtons(ev.id)}</li>`;
      }).join("")}</ul></article>`
      : `<article class="cell"><h4>Weekly Events</h4><ul><li class='muted'>No events this week.</li></ul></article>`;
    renderCalendarAssignedChores();
    return;
  }

  if (state.view === "month") {
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const start = getWeekStart(monthStart);
    const days = Array.from({ length: 42 }, (_, i) => {
      const x = new Date(start);
      x.setDate(start.getDate() + i);
      return x;
    });
    el.label.textContent = `${who} | ${d.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`;
    el.grid.className = "calendar-grid month";
    el.grid.innerHTML = days.map((x) => `<div class="month-cell ${x.getMonth() !== d.getMonth() ? "faded" : ""}">${dateCell(x)}</div>`).join("");
    renderCalendarAssignedChores();
    return;
  }

  const year = d.getFullYear();
  el.label.textContent = `${who} | ${year}`;
  el.grid.className = "calendar-grid year";
  el.grid.innerHTML = Array.from({ length: 12 }, (_, m) => {
    const first = new Date(year, m, 1);
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    let count = 0;
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, m, day);
      count += eventsForDate(date).length;
    }
    return `<article class="cell month-summary"><h4>${first.toLocaleDateString(undefined, { month: "long" })}</h4><p>${count} event${count === 1 ? "" : "s"}</p></article>`;
  }).join("");
  renderCalendarAssignedChores();
}

function pruneExpiredDisapprovedRequests() {
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const before = state.requests.length;
  state.requests = state.requests.filter((r) => {
    if (r.status !== "disapproved") return true;
    if (!r.disapprovedAt) return true;
    const ts = Date.parse(r.disapprovedAt);
    if (!Number.isFinite(ts)) return true;
    return now - ts < weekMs;
  });
  return state.requests.length !== before;
}

async function approveRequest(requestId) {
  const req = state.requests.find((r) => r.id === requestId);
  if (!req || req.status === "approved") return;
  const owner = findMember(req.memberId) || state.members[0];
  if (!owner) return;
  const startDate = req.requestedDate || formatDate(new Date());
  const startTime = req.requestedTime || "";
  const evId = req.approvedEventId || uid();
  const exists = state.events.some((ev) => ev.id === evId);
  if (!exists) {
    state.events.push({
      id: evId,
      title: req.text || "Approved Request",
      startDate,
      endDate: startDate,
      allDay: !startTime,
      start: startTime,
      end: startTime ? plusOneHour(startTime) : "",
      memberId: owner.id,
      memberName: owner.name,
      involvedMemberIds: [owner.id],
      recurring: "none",
    });
  }
  req.status = "approved";
  req.approvedAt = new Date().toISOString();
  req.disapprovedAt = "";
  req.approvedEventId = evId;
}

function disapproveRequest(requestId) {
  const req = state.requests.find((r) => r.id === requestId);
  if (!req) return;
  req.status = "disapproved";
  req.disapprovedAt = new Date().toISOString();
}

function renderRequests() {
  const removed = pruneExpiredDisapprovedRequests();
  if (removed) saveLocal();
  const rows = visibleRequests().map((r) => {
    const who = displayMember(r);
    const reqWhen = [r.requestedDate, r.requestedTime].filter(Boolean).join(" ");
    const statusText = r.status === "approved" ? "Approved" : (r.status === "disapproved" ? "Not Approved" : "Pending");
    const actions = r.status === "pending"
      ? `<button class="btn btn-secondary btn-sm" type="button" data-approve-request="${r.id}">Approve</button><button class="btn btn-secondary btn-sm" type="button" data-disapprove-request="${r.id}">Not Approved</button>`
      : "";
    return `<li class="${r.status === "disapproved" ? "request-disapproved" : ""}"><div class="list-content"><span>${escapeHtml(r.text)}</span>${reqWhen ? `<small>Requested: ${escapeHtml(reqWhen)}</small>` : ""}<small>Status: ${statusText}</small><span class="member-pill" style="--member-color:${memberColor(who)}">${escapeHtml(who)}</span></div><div class="row-actions">${actions}<button class="icon-btn" data-delete-request="${r.id}" title="Remove request">✕</button></div></li>`;
  }).join("");
  el.requestList.innerHTML = rows || "<li class='muted'>No requests yet.</li>";
}

function renderRequestEventsList() {
  const upcoming = [...state.events]
    .sort((a, b) => {
      const da = `${a.startDate || ""}${a.start || ""}`;
      const db = `${b.startDate || ""}${b.start || ""}`;
      return da.localeCompare(db);
    })
    .slice(0, 14);

  el.requestEventsList.innerHTML = upcoming.map((ev) => {
    const who = displayMember(ev);
    const timeText = ev.allDay ? "All Day" : (ev.start ? `${ev.start}${ev.end ? `-${ev.end}` : ""}` : "Time TBD");
    return `<li><div class="list-content"><strong>${escapeHtml(ev.title)}</strong><small>${escapeHtml(ev.startDate)} ${escapeHtml(timeText)}</small></div><div class="event-right"><span class="member-pill" style="--member-color:${memberColor(who)}">${escapeHtml(who)}</span>${eventActionButtons(ev.id)}</div></li>`;
  }).join("") || "<li class='muted'>No family events scheduled.</li>";
}

function renderRecurring() {
  const rows = visibleEvents().filter((e) => e.recurring !== "none").map((ev) => {
    const who = displayMember(ev);
    return `<li><div class="list-content"><span>${escapeHtml(ev.title)} <small>(${escapeHtml(ev.recurring)})</small></span><span class="member-pill" style="--member-color:${memberColor(who)}">${escapeHtml(who)}</span></div><button class="icon-btn" data-remove-recurring="${ev.id}">✕</button></li>`;
  }).join("");
  el.recurringList.innerHTML = rows || "<li class='muted'>No recurring activities.</li>";
}

function mergedSources() {
  const map = new Map();
  for (const ev of state.events) {
    if (!ev.importSourceId) continue;
    const key = ev.importSourceId;
    if (!map.has(key)) {
      map.set(key, {
        id: ev.importSourceId,
        name: ev.importSourceName || "Imported calendar",
        count: 0,
        importedAt: ev.importedAt || 0,
      });
    }
    const row = map.get(key);
    row.count += 1;
    if ((ev.importedAt || 0) > row.importedAt) row.importedAt = ev.importedAt || 0;
  }
  return Array.from(map.values()).sort((a, b) => b.importedAt - a.importedAt);
}

function renderMergedSources() {
  const sources = mergedSources();
  el.mergedSourcesList.innerHTML = sources.length
    ? sources.map((s) => `
      <li>
        <div class="list-content">
          <strong>${escapeHtml(s.name)}</strong>
          <small>${s.count} event${s.count === 1 ? "" : "s"}</small>
        </div>
        <button class="icon-btn" data-remove-merged-source="${s.id}" title="Remove merged calendar">✕</button>
      </li>
    `).join("")
    : "<li class='muted'>No merged calendars yet.</li>";

  const options = ["<option value=\"all\">All merged calendars</option>"]
    .concat(sources.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`));
  el.oldMergedSource.innerHTML = options.join("");
}

function renderMemberList() {
  if (!el.memberList) return;
  el.memberList.innerHTML = state.members.map((m) => `
    <li>
      <div class="list-content"><strong>${escapeHtml(m.name)}</strong><small>${escapeHtml(m.role)} | age ${m.age}</small></div>
      <div class="row-actions"><button class="btn btn-secondary" data-rename-member="${m.id}">Rename</button><button class="icon-btn" data-delete-member="${m.id}">✕</button></div>
    </li>
  `).join("");
}

function renderPersonEvents() {
  if (!el.personEvents) return;
  const upcoming = visibleEvents()
    .slice()
    .sort((a, b) => `${a.startDate}${a.start}`.localeCompare(`${b.startDate}${b.start}`))
    .slice(0, 12);
  el.personEvents.innerHTML = upcoming.map((ev) => {
    const who = displayMember(ev);
    return `<li><div class="list-content"><strong>${escapeHtml(ev.title)}</strong><small>${escapeHtml(ev.startDate)}${ev.allDay ? " (All Day)" : (ev.start ? ` ${escapeHtml(ev.start)}` : "")}</small></div><span class="member-pill" style="--member-color:${memberColor(who)}">${escapeHtml(who)}</span></li>`;
  }).join("") || "<li class='muted'>No upcoming activities for this view.</li>";
}

function renderChores() {
  ensureGameDefaults();
  const view = state.game.choresView || "today";
  const weekStart = state.game.scheduleWeekStart || weekStartIso(state.currentDate);
  const today = formatDate(new Date());
  const weekRows = visibleAssignments(weekAssignments(weekStart));
  const todayRows = weekRows.filter((a) => a.scheduledDate === today);

  renderChoresPersonTabs();
  renderChoresHero(todayRows, weekRows, today);
  renderChoresViewTabs(view);
  renderChoresTodayPanel(todayRows);
  renderChoresWeekPanel(weekRows, weekStart);
  renderChoresHistoryPanel(weekRows);
  renderChoresSettingsPanel();

  if (el.choresTodayPanel) el.choresTodayPanel.classList.toggle("hidden", view !== "today");
  if (el.choresWeekPanel) el.choresWeekPanel.classList.toggle("hidden", view !== "week");
  if (el.choresHistoryPanel) el.choresHistoryPanel.classList.toggle("hidden", view !== "history");
  if (el.choresSettingsPanel) el.choresSettingsPanel.classList.toggle("hidden", view !== "settings");
}

function statusTone(status) {
  if (status === "completed") return "status-completed";
  if (status === "skipped") return "status-skipped";
  if (status === "verified") return "status-verified";
  return "status-assigned";
}

function priorityKey(a) {
  if (Number(a.difficulty) >= 3) return "critical";
  if (Number(a.difficulty) >= 2) return "regular";
  return "optional";
}

function priorityRank(a) {
  const key = priorityKey(a);
  if (key === "critical") return 0;
  if (key === "regular") return 1;
  return 2;
}

function effortPoints(a) {
  return Number(a.pointsAwarded) || Number(a.difficulty) || 1;
}

function sortAssignmentsForFlow(rows) {
  return rows.slice().sort((a, b) => {
    const doneA = a.status === "completed" || a.status === "verified" ? 1 : 0;
    const doneB = b.status === "completed" || b.status === "verified" ? 1 : 0;
    if (doneA !== doneB) return doneA - doneB;
    const skipA = a.status === "skipped" ? 1 : 0;
    const skipB = b.status === "skipped" ? 1 : 0;
    if (skipA !== skipB) return skipA - skipB;
    const pr = priorityRank(a) - priorityRank(b);
    if (pr !== 0) return pr;
    return String(a.choreTitle || "").localeCompare(String(b.choreTitle || ""));
  });
}

function agoText(ts) {
  if (!ts) return "Updated just now";
  const ms = Date.now() - Number(ts || 0);
  if (ms < 15000) return "Updated just now";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Updated less than a minute ago";
  if (mins < 60) return `Updated ${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Updated ${hours} hour${hours === 1 ? "" : "s"} ago`;
  return `Updated ${Math.floor(hours / 24)} day${Math.floor(hours / 24) === 1 ? "" : "s"} ago`;
}

function ringDash(percent) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, percent)) / 100);
  return { circumference, offset };
}

function groupedAssignmentsByPerson(rows) {
  const members = state.selectedPersonId === "family"
    ? state.members
    : state.members.filter((m) => m.id === state.selectedPersonId);
  return members
    .map((m) => ({
      member: m,
      rows: sortAssignmentsForFlow(rows.filter((a) => a.userId === m.id)),
    }))
    .filter((x) => state.selectedPersonId !== "family" || x.rows.length);
}

function renderPersonCard(member, rows, showDate = false) {
  const totalMinutes = rows.reduce((sum, a) => sum + (Number(a.estimatedMinutes) || 0), 0);
  const totalPoints = rows.reduce((sum, a) => sum + effortPoints(a), 0);
  const priorityGroups = {
    critical: rows.filter((a) => priorityKey(a) === "critical"),
    regular: rows.filter((a) => priorityKey(a) === "regular"),
    optional: rows.filter((a) => priorityKey(a) === "optional"),
  };
  const labels = [
    ["critical", "Critical"],
    ["regular", "Regular"],
    ["optional", "Optional"],
  ];
  const avatar = (member.name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
  return `
    <article class="chores-person-card">
      <header>
        <div class="chores-avatar" style="--member-color:${memberColor(member.name)}">${escapeHtml(avatar || "?")}</div>
        <div>
          <h4>${escapeHtml(member.name)}</h4>
          <p class="muted">${escapeHtml(member.role || "member")} · ${totalMinutes} min · ${totalPoints} effort</p>
        </div>
      </header>
      ${labels.map(([key, label]) => {
        const group = priorityGroups[key];
        if (!group.length) return "";
        return `
          <section class="priority-group">
            <h5>${label}</h5>
            <ul class="list chores-rows">
              ${group.map((a) => {
                const status = a.status === "verified" ? "verified" : a.status;
                const done = status === "completed" || status === "verified";
                const dateMeta = showDate ? ` · ${escapeHtml(a.scheduledDate)}` : "";
                return `
                  <li class="assignment-row chore-row ${done ? "assignment-completed" : ""} ${status === "skipped" ? "assignment-skipped" : ""}" data-assignment-id="${a.id}">
                    <details>
                      <summary>
                        <div class="chore-row-main">
                          <div class="chore-title-wrap">
                            <strong class="${done ? "done" : ""}">${escapeHtml(a.choreTitle)}</strong>
                            <small>${Number(a.estimatedMinutes) || 0} min · ${status}${dateMeta}</small>
                          </div>
                          <span class="chore-status-pill ${statusTone(status)}">${escapeHtml(status)}</span>
                        </div>
                      </summary>
                      <div class="chore-row-detail">
                        <p class="muted">Difficulty ${Number(a.difficulty) || 1} · Category ${escapeHtml(a.category || "general")} · Effort ${effortPoints(a)} pts</p>
                        <div class="row-actions">
                          <button class="btn btn-secondary btn-sm" data-chore-action="complete" data-assignment-id="${a.id}" type="button">Complete</button>
                          <button class="btn btn-secondary btn-sm" data-chore-action="skip" data-assignment-id="${a.id}" type="button">Skip</button>
                          <button class="btn btn-secondary btn-sm" data-chore-action="swap" data-assignment-id="${a.id}" type="button">Swap</button>
                          <button class="btn btn-secondary btn-sm" data-chore-action="reassign" data-assignment-id="${a.id}" type="button">Reassign</button>
                          <button class="btn btn-secondary btn-sm" data-chore-action="verify" data-assignment-id="${a.id}" type="button">Verify</button>
                        </div>
                      </div>
                    </details>
                  </li>
                `;
              }).join("")}
            </ul>
          </section>
        `;
      }).join("") || "<p class='muted'>No chores assigned.</p>"}
    </article>
  `;
}

function renderChoresHero(todayRows, weekRows, todayIso) {
  if (!el.choresHero) return;
  const totalToday = todayRows.length;
  const doneToday = todayRows.filter((a) => a.status === "completed" || a.status === "verified").length;
  const percent = totalToday ? Math.round((doneToday / totalToday) * 100) : 0;
  const critical = todayRows.filter((a) => priorityKey(a) === "critical");
  const criticalDone = critical.filter((a) => a.status === "completed" || a.status === "verified").length;
  const pending = sortAssignmentsForFlow(todayRows.filter((a) => a.status === "assigned"));
  const next = pending[0];
  const lateHour = Number(state.game.settings.lateHighlightHour) || 19;
  const now = new Date();
  const isLate = now.getHours() >= lateHour && criticalDone < critical.length;
  const weekDone = weekRows.filter((a) => a.status === "completed" || a.status === "verified").length;

  if (el.choresHeroTitle) el.choresHeroTitle.textContent = critical.length ? `${criticalDone}/${critical.length} critical done` : "Keep it tidy";
  if (el.choresHeroSub) {
    el.choresHeroSub.textContent = isLate
      ? "Critical chores are still pending tonight."
      : `${doneToday}/${totalToday || 0} chores completed today · ${weekDone}/${weekRows.length || 0} this week`;
  }
  if (el.choresProgressBar) el.choresProgressBar.style.width = `${percent}%`;
  if (el.choresProgressLabel) el.choresProgressLabel.textContent = `${percent}%`;
  if (el.choresUpdatedAt) el.choresUpdatedAt.textContent = agoText(state.lastUpdatedAt);
  if (el.choresNextUp) el.choresNextUp.textContent = `Next up: ${next ? next.choreTitle : "You are clear"}`;
  if (el.choresProgressRing) {
    const ring = ringDash(percent);
    el.choresProgressRing.style.strokeDasharray = String(ring.circumference);
    el.choresProgressRing.style.strokeDashoffset = String(ring.offset);
  }

  el.choresHero.classList.toggle("late-critical", isLate);

  if (critical.length && criticalDone === critical.length && state.game.settings.celebrateCriticalMoment) {
    const key = `${todayIso}-${state.selectedPersonId}-${critical.length}`;
    if (lastCriticalCelebrationKey !== key) {
      lastCriticalCelebrationKey = key;
      el.choresHero.classList.add("critical-complete-flash");
      setTimeout(() => el.choresHero?.classList.remove("critical-complete-flash"), 900);
    }
  }
}

function renderChoresViewTabs(view) {
  if (!el.choresViews) return;
  el.choresViews.querySelectorAll("[data-chores-view]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.choresView === view);
  });
}

function renderChoresTodayPanel(todayRows) {
  if (!el.choresTodayPanel) return;
  if (!todayRows.length) {
    el.choresTodayPanel.innerHTML = `
      <div class="chores-empty">
        <h3>No chores scheduled for today</h3>
        <p class="muted">Generate this week’s schedule to instantly assign balanced daily chores.</p>
      </div>
    `;
    return;
  }
  const cards = groupedAssignmentsByPerson(todayRows)
    .map(({ member, rows }) => renderPersonCard(member, rows))
    .join("");
  el.choresTodayPanel.innerHTML = `<div class="chores-cards-grid">${cards}</div>`;
}

function renderChoresWeekPanel(weekRows, weekStart) {
  if (!el.choresWeekPanel) return;
  const days = weekDatesFrom(weekStart);
  const dayCards = days.map((dateIso) => {
    const rows = sortAssignmentsForFlow(weekRows.filter((a) => a.scheduledDate === dateIso));
    const done = rows.filter((a) => a.status === "completed" || a.status === "verified").length;
    return `
      <article class="week-day-card">
        <header>
          <h4>${escapeHtml(new Date(`${dateIso}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }))}</h4>
          <small class="muted">${done}/${rows.length} done</small>
        </header>
        <ul class="list chores-rows">
          ${rows.map((a) => `
            <li class="assignment-row chore-row ${a.status === "completed" || a.status === "verified" ? "assignment-completed" : ""} ${a.status === "skipped" ? "assignment-skipped" : ""}">
              <div class="chore-row-main">
                <div class="chore-title-wrap">
                  <strong class="${a.status === "completed" || a.status === "verified" ? "done" : ""}">${escapeHtml(a.choreTitle)}</strong>
                  <small>${escapeHtml(findMember(a.userId)?.name || a.userName || "Unknown")} · ${Number(a.estimatedMinutes) || 0} min</small>
                </div>
                <span class="chore-status-pill ${statusTone(a.status)}">${escapeHtml(a.status)}</span>
              </div>
            </li>
          `).join("") || "<li class='muted'>No chores</li>"}
        </ul>
      </article>
    `;
  }).join("");
  el.choresWeekPanel.innerHTML = `<div class="week-grid">${dayCards}</div>`;
}

function renderChoresHistoryPanel(weekRows) {
  if (!el.choresHistoryPanel) return;
  const history = weekRows
    .filter((a) => a.status === "completed" || a.status === "verified" || a.status === "skipped")
    .slice()
    .sort((a, b) => {
      const ta = a.completedAt || `${a.scheduledDate}T00:00:00`;
      const tb = b.completedAt || `${b.scheduledDate}T00:00:00`;
      return tb.localeCompare(ta);
    });

  el.choresHistoryPanel.innerHTML = `
    <h3>Recent Activity</h3>
    <ul class="list chores-rows">
      ${history.map((a) => `
        <li class="assignment-row chore-row ${a.status === "completed" || a.status === "verified" ? "assignment-completed" : ""} ${a.status === "skipped" ? "assignment-skipped" : ""}">
          <div class="chore-row-main">
            <div class="chore-title-wrap">
              <strong>${escapeHtml(a.choreTitle)}</strong>
              <small>${escapeHtml(findMember(a.userId)?.name || a.userName || "Unknown")} · ${escapeHtml(a.scheduledDate)}</small>
            </div>
            <span class="chore-status-pill ${statusTone(a.status)}">${escapeHtml(a.status)}</span>
          </div>
        </li>
      `).join("") || "<li class='muted'>No completion history yet.</li>"}
    </ul>
  `;
}

function renderChoresSettingsPanel() {
  if (!el.choresSettingsPanel) return;
  el.choresSettingsPanel.innerHTML = `
    <h3>Chores Experience Settings</h3>
    <form id="choresSettingsForm" class="stack">
      <label class="checkbox-row">
        <input type="checkbox" name="celebrateCompletions" ${state.game.settings.celebrateCompletions ? "checked" : ""} />
        <span>Completion micro-animation + haptic feedback</span>
      </label>
      <label class="checkbox-row">
        <input type="checkbox" name="celebrateCriticalMoment" ${state.game.settings.celebrateCriticalMoment ? "checked" : ""} />
        <span>Celebrate when all critical chores are finished</span>
      </label>
      <label>
        Late reminder starts at (24h)
        <input type="number" name="lateHighlightHour" min="16" max="23" value="${Number(state.game.settings.lateHighlightHour) || 19}" />
      </label>
      <button class="btn btn-primary" type="submit">Save Chores Settings</button>
    </form>
  `;
}

function renderChoreGameControls() {
  ensureGameDefaults();
  if (el.choreWeekStart) el.choreWeekStart.value = state.game.scheduleWeekStart;
  if (el.choreGameWeekStart) el.choreGameWeekStart.value = state.game.scheduleWeekStart;
  if (el.choreGameDate) el.choreGameDate.value = state.game.selectedDate || state.game.scheduleWeekStart;
  if (el.scoreDiff1) el.scoreDiff1.value = String(state.game.settings.scoreByDifficulty[1] || 1);
  if (el.scoreDiff2) el.scoreDiff2.value = String(state.game.settings.scoreByDifficulty[2] || 2);
  if (el.scoreDiff3) el.scoreDiff3.value = String(state.game.settings.scoreByDifficulty[3] || 3);
  if (el.allowReroll) el.allowReroll.checked = state.game.settings.allowReroll !== false;
}

function visibleAssignmentsForDate(isoDate) {
  const rows = state.game.assignments.filter((a) => a.scheduledDate === isoDate);
  if (state.selectedPersonId === "family") return rows;
  return rows.filter((a) => a.userId === state.selectedPersonId);
}

function renderDailyAssignments() {
  const date = state.game.selectedDate || state.game.scheduleWeekStart;
  const rows = visibleAssignmentsForDate(date);
  if (!el.dailyAssignmentsList) return;
  el.dailyAssignmentsList.innerHTML = rows.map((a) => {
    const who = findMember(a.userId)?.name || a.userName || "Unknown";
    return `<li class="assignment-row ${a.status === "completed" || a.status === "verified" ? "assignment-completed" : (a.status === "skipped" ? "assignment-skipped" : "")}"><div class="list-content"><strong>${escapeHtml(a.choreTitle)}</strong><small>${escapeHtml(date)} | ${escapeHtml(who)}</small><small>Status: ${escapeHtml(a.status)}</small></div><div class="row-actions"><button class="btn btn-secondary btn-sm" data-complete-assignment="${a.id}" type="button">Complete</button><button class="btn btn-secondary btn-sm" data-skip-assignment="${a.id}" type="button">Skip</button></div></li>`;
  }).join("") || "<li class='muted'>No assignments for this day.</li>";
}

function renderWeeklyLoad() {
  if (!el.weeklyLoadList) return;
  const days = weekDatesFrom(state.game.scheduleWeekStart);
  const rows = days.map((d) => {
    const count = state.game.assignments.filter((a) => a.scheduledDate === d).length;
    return { d, count };
  });
  const avg = rows.length ? rows.reduce((sum, r) => sum + r.count, 0) / rows.length : 0;
  el.weeklyLoadList.innerHTML = rows.map((r) => `<li><div class="list-content"><strong>${escapeHtml(r.d)}</strong><small>${r.count} chore${r.count === 1 ? "" : "s"} assigned</small></div><small class="muted">${Math.abs(r.count - avg) <= 1 ? "balanced" : "adjust"}</small></li>`).join("");
}

function renderGameLeaderboard() {
  if (!el.gameLeaderboardList) return;
  const board = computeLeaderboard(state.game.scheduleWeekStart);
  const winners = new Set(board.winners);
  el.gameLeaderboardList.innerHTML = board.rows.map((r) => {
    const winnerText = winners.has(r.userId) ? " | Winner" : "";
    const finalText = r.finalDayEarliest ? ` | Final-day tie-break: ${new Date(r.finalDayEarliest).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "";
    return `<li><div class="list-content"><strong>${escapeHtml(r.userName)}</strong><small>${r.points} points | ${r.completed} completed${winnerText}</small><small>${escapeHtml(finalText)}</small></div></li>`;
  }).join("") || "<li class='muted'>No leaderboard data this week.</li>";
}

function renderNights() {
  if (!el.nightsList) return;
  const nights = state.game.nights
    .filter((n) => inWeek(n.scheduledDate, state.game.scheduleWeekStart))
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  el.nightsList.innerHTML = nights.map((n) => {
    const winnerNames = (n.winnerUserIds || []).map((id) => findMember(id)?.name).filter(Boolean);
    const selected = activityById(n.selectedActivityId);
    return `<li><div class="list-content"><strong>${n.type === "gameNight" ? "Game Night" : "Fun Night"} - ${escapeHtml(n.scheduledDate)}</strong><small>${n.randomizerUnlocked ? "Unlocked" : "Locked"}${winnerNames.length ? ` | Winner: ${escapeHtml(winnerNames.join(", "))}` : ""}</small><small>${selected ? `Selected: ${escapeHtml(selected.title)}` : "No activity selected yet."}</small></div><div class="row-actions"><button class="btn btn-secondary btn-sm" type="button" data-randomize-night="${n.id}" ${!n.randomizerUnlocked || n.randomizerUsedAt ? "disabled" : ""}>Randomizer</button></div></li>`;
  }).join("") || "<li class='muted'>No nights set for this week.</li>";
}

function renderCalendarAssignedChores() {
  if (!el.calendarAssignedChores) return;
  const weekStart = weekStartIso(state.currentDate);
  const rows = state.game.assignments
    .filter((a) => inWeek(a.scheduledDate, weekStart))
    .filter((a) => state.selectedPersonId === "family" || a.userId === state.selectedPersonId)
    .sort((a, b) => `${a.scheduledDate}${a.userName}${a.choreTitle}`.localeCompare(`${b.scheduledDate}${b.userName}${b.choreTitle}`));

  el.calendarAssignedChores.innerHTML = rows.map((a) => {
    const who = findMember(a.userId)?.name || a.userName || "Unknown";
    return `<li class="assignment-row ${a.status === "completed" || a.status === "verified" ? "assignment-completed" : (a.status === "skipped" ? "assignment-skipped" : "")}"><div class="list-content"><strong>${escapeHtml(a.choreTitle)}</strong><small>${escapeHtml(a.scheduledDate)} | ${escapeHtml(who)}</small><small>Status: ${escapeHtml(a.status)}</small></div><div class="row-actions"><button class="btn btn-secondary btn-sm" data-complete-assignment="${a.id}" type="button">Complete</button><button class="btn btn-secondary btn-sm" data-skip-assignment="${a.id}" type="button">Skip</button></div></li>`;
  }).join("") || "<li class='muted'>No scheduled chores for this week.</li>";
}

async function generateWeeklyChoreSchedule() {
  ensureGameDefaults();
  const inputWeek = el.choreWeekStart?.value || state.game.scheduleWeekStart || weekStartIso(state.currentDate);
  const weekStart = weekStartIso(inputWeek);
  const dailyMax = 5;
  const targetPerPerson = 35;
  let source = "AI";

  let assignments = [];
  const btn = document.getElementById("generateChoresBtn");
  const prevLabel = btn?.textContent || "";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Generating...";
  }
  el.choresTodayPanel?.classList.add("chores-loading");
  try {
    const data = await requestChoreSchedule({
      weekStart,
      dailyMax,
      targetPerPerson,
      members: state.members.map((m) => ({ id: m.id, name: m.name, age: m.age, role: m.role })),
      chores: choreTemplates(),
    });
    const aiRows = Array.isArray(data.assignments) ? data.assignments : [];
    assignments = enforceDailyAssignmentCap(aiRows.map((r) => assignmentFromAiRow(r, weekStart)).filter(Boolean), dailyMax);
  } catch (_err) {
    assignments = [];
  }

  if (!assignments.length || !hasExactDailyQuota(assignments, weekStart, dailyMax)) {
    assignments = enforceDailyAssignmentCap(generateBalancedAssignments(weekStart, dailyMax, targetPerPerson), dailyMax);
    source = "Balanced local planner";
  }

  applyAssignments(assignments, weekStart);
  state.game.scheduleWeekStart = weekStart;
  if (!state.game.selectedDate || !inWeek(state.game.selectedDate, weekStart)) {
    state.game.selectedDate = weekStart;
  }

  await saveState();
  renderChoreGameControls();
  renderDailyAssignments();
  renderWeeklyLoad();
  renderGameLeaderboard();
  renderNights();
  renderCalendarAssignedChores();
  if (el.choreGenNote) {
    el.choreGenNote.textContent = `Generated weekly chores for ${weekStart}: 5 chores/day per person (35/week). Source: ${source}.`;
  }
  if (btn) {
    btn.disabled = false;
    btn.textContent = prevLabel || "Generate Weekly Schedule";
  }
  el.choresTodayPanel?.classList.remove("chores-loading");
}

function updateChoreNote() {
  if (!el.choreGenNote) return;
  if (String(el.choreGenNote.textContent || "").startsWith("Generated weekly chores")) return;
  el.choreGenNote.textContent = "5 chores per day per person, balanced weekly. Swipe right to complete, left to skip.";
}

function generatedChoresFor(member) {
  const base = member.role === "adult"
    ? [
        { title: "Kitchen cleanup", frequency: "Daily" },
        { title: "Laundry cycle", frequency: "Weekly" },
        { title: "Trash and recycling", frequency: "Weekly" },
      ]
    : member.age <= 8
      ? [
          { title: "Make bed", frequency: "Daily" },
          { title: "Put toys away", frequency: "Daily" },
          { title: "Sort laundry", frequency: "Weekly" },
        ]
      : [
          { title: "Tidy room", frequency: "Daily" },
          { title: "Dishwasher help", frequency: "Daily" },
          { title: "Vacuum room", frequency: "Weekly" },
        ];

  return base.map((t) => ({
    id: uid(),
    title: t.title,
    frequency: t.frequency,
    done: false,
    autogenerated: true,
    memberId: member.id,
    memberName: member.name,
  }));
}

function setPlannerInputs() {
  el.plannerLocation.value = state.planner.location || "";
  el.plannerPrefs.value = state.planner.prefs || "";
  el.partnerEmail.value = state.planner.partnerEmail || "";
  const meal = state.planner.meal || {};
  if (el.mealPeople) el.mealPeople.value = String(meal.people || 4);
  if (el.mealTime) el.mealTime.value = String(meal.timeMinutes || 45);
  if (el.mealBudget) el.mealBudget.value = String(meal.budget || 80);
  if (el.mealDay) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    el.mealDay.value = meal.day || formatDate(tomorrow);
  }
  if (el.mealLocation) el.mealLocation.value = meal.location || state.planner.location || "";
  if (el.mealMode) el.mealMode.value = meal.mode || "EITHER";
  if (el.mealSkill) el.mealSkill.value = meal.skillLevel || "intermediate";
  if (el.mealDietary) el.mealDietary.value = meal.dietaryConstraints || "";
  if (el.mealAllergies) el.mealAllergies.value = meal.allergies || "";
  if (el.mealCuisines) el.mealCuisines.value = meal.preferredCuisines || "";
  if (el.mealDisliked) el.mealDisliked.value = meal.dislikedIngredients || "";
  if (el.mealEquipment) el.mealEquipment.value = meal.equipment || "";
  if (el.mealPrefs) el.mealPrefs.value = meal.prefs || "";
}

function renderPlannerIdeas() {
  const rows = state.planner.ideas.map((idea, i) => {
    return `
      <li>
        <div class="list-content">
          <strong>${escapeHtml(idea.title || "Date Idea")}</strong>
          <small>${escapeHtml(idea.date || "")} ${escapeHtml(idea.start_time || "")} - ${escapeHtml(idea.end_time || "")}</small>
          <small>${escapeHtml(idea.place || "")}</small>
          <small>${escapeHtml(idea.notes || "")}</small>
        </div>
        <button class="btn btn-secondary" data-choose-idea="${i}">Choose</button>
      </li>
    `;
  }).join("");
  el.plannerIdeas.innerHTML = rows || "<li class='muted'>No ideas yet. Generate suggestions.</li>";
}

function renderMealSuggestions() {
  const meal = state.planner.meal || {};
  const deals = Array.isArray(meal.deals) ? meal.deals : [];
  const recipes = Array.isArray(meal.recipes) ? meal.recipes : [];
  const nextDay = Array.isArray(meal.nextDay) ? meal.nextDay : [];
  const recipeSection = extractMealSection(meal.rawText || "", "Option B (Recipe):", "Tomorrow Suggestions:");

  if (el.mealDealsList) {
    el.mealDealsList.innerHTML = deals.length
      ? deals.map((d) => `<li><div class="list-content"><strong>${escapeHtml(d.name || "Deal")}</strong><small>${escapeHtml(d.day || "")}${d.time ? ` | ${escapeHtml(d.time)}` : ""}</small><small>${escapeHtml(d.deal || "")}</small><small>${escapeHtml(d.notes || "")}</small></div></li>`).join("")
      : "<li class='muted'>No deal suggestions yet.</li>";
  }

  if (el.mealRecipesList) {
    el.mealRecipesList.innerHTML = recipes.length
      ? recipes.map((r, idx) => {
        const recipeName = r.name || "Recipe";
        const minutes = r.time_minutes ? `${escapeHtml(String(r.time_minutes))} min` : "";
        const meta = [minutes, r.cost_estimate ? escapeHtml(r.cost_estimate) : ""].filter(Boolean).join(" | ");
        const notes = String(r.notes || "").trim();
        const fallbackDetails = !notes && recipeSection && idx === 0 ? recipeSection : "";
        return `
          <li class="meal-recipe-item">
            <details class="recipe-details">
              <summary>
                <span class="list-content">
                  <strong>${escapeHtml(recipeName)}</strong>
                  ${meta ? `<small>${meta}</small>` : "<small>Tap to expand details</small>"}
                </span>
              </summary>
              <div class="recipe-body">
                ${notes ? `<p>${escapeHtml(notes)}</p>` : ""}
                ${fallbackDetails ? `<pre>${escapeHtml(fallbackDetails)}</pre>` : ""}
                <button class="btn btn-secondary" type="button" data-share-recipe="${idx}">Save to Notes (iPhone Share)</button>
              </div>
            </details>
          </li>
        `;
      }).join("")
      : "<li class='muted'>No at-home recipes yet.</li>";
  }

  if (el.mealNextDayList) {
    el.mealNextDayList.innerHTML = nextDay.length
      ? nextDay.map((n) => `<li><div class="list-content"><strong>${escapeHtml(n.title || "Next Day")}</strong><small>${escapeHtml(n.type || "")}</small><small>${escapeHtml(n.notes || "")}</small></div></li>`).join("")
      : "<li class='muted'>No next-day suggestions yet.</li>";
  }

  if (el.mealPlanText) {
    el.mealPlanText.textContent = meal.rawText || "";
    el.mealPlanText.classList.toggle("hidden", !meal.rawText);
  }
}

async function requestDateIdeas() {
  const payload = {
    location: el.plannerLocation.value.trim(),
    preferences: el.plannerPrefs.value.trim(),
    existingEvents: state.events.map((e) => ({
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate,
      allDay: e.allDay,
      start: e.start,
      end: e.end,
    })),
  };

  const r = await fetch("/api/date-ideas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!r.ok) throw new Error("Date ideas request failed");
  return r.json();
}

async function requestMealPlan(payload) {
  const r = await fetch("/api/meal-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("Meal plan request failed");
  return r.json();
}

async function requestChoreSchedule(payload) {
  const r = await fetch("/api/chore-schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("Chore schedule request failed");
  return r.json();
}

function parseIcalLines(text) {
  const raw = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const lines = [];
  for (const ln of raw) {
    if ((ln.startsWith(" ") || ln.startsWith("\t")) && lines.length) lines[lines.length - 1] += ln.slice(1);
    else lines.push(ln);
  }
  return lines;
}

function parseIcalDate(value) {
  if (!/^\d{8}$/.test(value)) return "";
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function parseIcalDateTime(value) {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?Z?$/);
  if (!m) return { date: "", time: "" };
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const h = Number(m[4]);
  const mi = Number(m[5]);
  const sec = Number(m[6] || 0);
  const z = value.endsWith("Z");
  const dt = z ? new Date(Date.UTC(y, mo, d, h, mi, sec)) : new Date(y, mo, d, h, mi, sec);
  return { date: formatDate(dt), time: `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}` };
}

function parseIcal(text) {
  const lines = parseIcalLines(text);
  const out = [];
  let cur = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") { cur = {}; continue; }
    if (line === "END:VEVENT") { if (cur) out.push(cur); cur = null; continue; }
    if (!cur || !line.includes(":")) continue;
    const idx = line.indexOf(":");
    const left = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const [key, ...params] = left.split(";");
    cur[key.toUpperCase()] = { value, params: params.join(";").toUpperCase() };
  }

  return out.map((e) => {
    const summary = e.SUMMARY?.value || "Imported Event";
    const start = e.DTSTART?.value || "";
    const end = e.DTEND?.value || "";
    const startDateOnly = e.DTSTART?.params?.includes("VALUE=DATE") || /^\d{8}$/.test(start);
    const endDateOnly = e.DTEND?.params?.includes("VALUE=DATE") || /^\d{8}$/.test(end);
    const rrule = e.RRULE?.value || "";

    let startDate = "";
    let endDate = "";
    let startTime = "";
    let endTime = "";

    if (startDateOnly) {
      startDate = parseIcalDate(start);
      endDate = end ? parseIcalDate(end) : startDate;
      if (end && endDateOnly) endDate = addDaysIso(endDate, -1);
    } else {
      const s = parseIcalDateTime(start);
      const x = end ? parseIcalDateTime(end) : s;
      startDate = s.date;
      endDate = x.date || s.date;
      startTime = s.time;
      endTime = x.time;
    }

    let recurring = "none";
    const freq = rrule.match(/FREQ=([A-Z]+)/)?.[1] || "";
    if (freq === "DAILY") recurring = "daily";
    if (freq === "WEEKLY") recurring = "weekly";
    if (freq === "MONTHLY") recurring = "monthly";

    return { title: summary, startDate, endDate: endDate || startDate, start: startTime, end: endTime, recurring, allDay: !startTime && !endTime };
  }).filter((x) => x.startDate);
}

function sourceNameFromFileName(fileName) {
  const clean = String(fileName || "Imported calendar").trim();
  const stripped = clean.replace(/\.(ics|ical)$/i, "").trim();
  return stripped || "Imported calendar";
}

function sourceForImport(fileName) {
  const sourceName = sourceNameFromFileName(fileName);
  const existing = mergedSources().find((s) => s.name.toLowerCase() === sourceName.toLowerCase());
  if (existing) return { id: existing.id, name: existing.name };
  return { id: `src-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: sourceName };
}

function escapeIcal(s) {
  return String(s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function toIcalDate(iso) { return iso.replace(/-/g, ""); }
function toIcalDateTime(iso, t) {
  const hh = (t || "00:00").slice(0, 2);
  const mm = (t || "00:00").slice(3, 5);
  return `${toIcalDate(iso)}T${hh}${mm}00`;
}

function exportIcal(rows) {
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}T${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}${String(now.getUTCSeconds()).padStart(2, "0")}Z`;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//FamCal//EN", "CALSCALE:GREGORIAN"];

  for (const ev of rows) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${ev.id}@famcal.local`);
    lines.push(`DTSTAMP:${stamp}`);
    if (ev.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${toIcalDate(ev.startDate)}`);
      lines.push(`DTEND;VALUE=DATE:${toIcalDate(addDaysIso(ev.endDate || ev.startDate, 1))}`);
    } else {
      lines.push(`DTSTART:${toIcalDateTime(ev.startDate, ev.start || "09:00")}`);
      lines.push(`DTEND:${toIcalDateTime(ev.endDate || ev.startDate, ev.end || ev.start || "10:00")}`);
    }
    if (ev.recurring === "daily") lines.push("RRULE:FREQ=DAILY");
    if (ev.recurring === "weekly") lines.push("RRULE:FREQ=WEEKLY");
    if (ev.recurring === "monthly") lines.push("RRULE:FREQ=MONTHLY");
    lines.push(`SUMMARY:${escapeIcal(ev.title)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function extractMealSection(rawText, startHeading, endHeading) {
  const text = String(rawText || "");
  if (!text) return "";
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim().toLowerCase() === startHeading.trim().toLowerCase());
  if (start === -1) return "";
  let end = lines.length;
  if (endHeading) {
    const endIdx = lines.findIndex((line, idx) => idx > start && line.trim().toLowerCase() === endHeading.trim().toLowerCase());
    if (endIdx !== -1) end = endIdx;
  }
  return lines.slice(start + 1, end).join("\n").trim();
}

function recipeShareText(recipe, fallbackDetails) {
  const title = recipe?.name || "At-home recipe";
  const lines = [title];
  if (recipe?.time_minutes) lines.push(`Time: ${recipe.time_minutes} minutes`);
  if (recipe?.cost_estimate) lines.push(`Estimated cost: ${recipe.cost_estimate}`);
  if (recipe?.notes) lines.push("", String(recipe.notes));
  if (fallbackDetails) lines.push("", fallbackDetails);
  return lines.join("\n").trim();
}

async function shareRecipeToNotes(recipe, fallbackDetails) {
  const title = recipe?.name || "At-home recipe";
  const text = recipeShareText(recipe, fallbackDetails);
  if (!text) return;
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return;
    } catch (_err) {
      // User canceled share sheet or share target failed; continue to clipboard fallback.
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    alert("Recipe copied. Open iPhone Notes and paste.");
  } catch (_err) {
    prompt("Copy this recipe into Notes:", text);
  }
}

function celebrateCompletion(anchorEl) {
  if (!anchorEl || state.game?.settings?.celebrateCompletions === false) return;
  const host = anchorEl.closest("li") || anchorEl;
  host.classList.remove("completion-pop");
  // Trigger reflow so repeated completions animate again.
  void host.offsetWidth;
  host.classList.add("completion-pop");
  setTimeout(() => host.classList.remove("completion-pop"), 700);

  if (navigator?.vibrate) navigator.vibrate(16);

  const burst = document.createElement("div");
  burst.className = "completion-burst";
  const rect = host.getBoundingClientRect();
  burst.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
  burst.style.top = `${rect.top + window.scrollY + 18}px`;
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 700);
}

function showToast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.appendChild(node);
  requestAnimationFrame(() => node.classList.add("show"));
  setTimeout(() => {
    node.classList.remove("show");
    setTimeout(() => node.remove(), 220);
  }, 1700);
}

function canManageChore() {
  if (state.selectedPersonId === "family") return true;
  const person = findMember(state.selectedPersonId);
  return person?.role === "adult";
}

async function applyChoreAction(action, assignmentId, anchorEl) {
  const row = state.game.assignments.find((a) => a.id === assignmentId);
  if (!row) return;
  const previous = { ...row };

  if (action === "complete") {
    row.status = "completed";
    row.completedAt = new Date().toISOString();
  } else if (action === "skip") {
    const reason = prompt("Reason for skip (optional):", "") || "";
    row.status = "skipped";
    row.skipReason = reason.trim();
    row.completedAt = "";
  } else if (action === "swap") {
    const other = state.members.find((m) => m.id !== row.userId);
    if (!other) return;
    const name = prompt("Swap with (enter name):", other.name || "") || "";
    const target = findMemberByLooseName(name);
    if (!target || target.id === row.userId) {
      showToast("Swap canceled.");
      return;
    }
    row.userId = target.id;
    row.userName = target.name;
    row.status = "assigned";
    row.completedAt = "";
  } else if (action === "reassign") {
    if (!canManageChore()) {
      showToast("Only adults can reassign chores.");
      return;
    }
    const name = prompt("Reassign to (enter name):", "") || "";
    const target = findMemberByLooseName(name);
    if (!target) return;
    row.userId = target.id;
    row.userName = target.name;
    row.status = "assigned";
    row.completedAt = "";
  } else if (action === "verify") {
    if (!canManageChore()) {
      showToast("Only adults can verify chores.");
      return;
    }
    if (row.status !== "completed" && row.status !== "verified") {
      showToast("Complete the chore before verifying.");
      return;
    }
    row.status = "verified";
    row.verifiedBy = state.selectedPersonId;
    row.verificationAt = new Date().toISOString();
  } else {
    return;
  }

  renderChores();
  renderCalendarAssignedChores();
  renderCalendar();
  if (action === "complete") celebrateCompletion(anchorEl);

  try {
    await saveState();
    showToast("Chore updated.");
  } catch (_err) {
    Object.assign(row, previous);
    renderChores();
    renderCalendarAssignedChores();
    renderCalendar();
    showToast("Could not save. Try again.");
  }
}

function applyAssignments(assignments, weekStart) {
  const keep = state.game.assignments.filter((a) => !inWeek(a.scheduledDate, weekStart));
  state.game.assignments = keep.concat(assignments);
}

function assignmentFromAiRow(row, weekStart) {
  const byId = findMember(row.userId || "");
  const byName = findMemberByName(row.userName || row.user || "");
  const byLoose = findMemberByLooseName(row.userName || row.user || "");
  const byIndex = Number.isInteger(Number(row.memberIndex)) ? state.members[Number(row.memberIndex)] : null;
  const user = byId || byName || byLoose || byIndex;
  if (!user) return null;
  const scheduledDate = String(row.scheduledDate || "");
  if (!scheduledDate || !inWeek(scheduledDate, weekStart)) return null;
  const difficulty = Math.max(1, Math.min(3, Number(row.difficulty) || 1));
  const points = Number(state.game.settings.scoreByDifficulty[difficulty]) || difficulty;
  return {
    id: uid(),
    choreId: row.choreId || `ai-${String(row.choreTitle || row.title || "chore").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    choreTitle: row.choreTitle || row.title || "Chore",
    userId: user.id,
    userName: user.name,
    scheduledDate,
    status: "assigned",
    completedAt: "",
    pointsAwarded: points,
    difficulty,
    estimatedMinutes: Number(row.estimatedMinutes) || 20,
    category: row.category || "general",
    ageMin: Number(row.ageMin) || 0,
  };
}

function finalizeWeekAndUnlockNights() {
  const weekStart = state.game.scheduleWeekStart;
  const board = computeLeaderboard(weekStart);
  ensureNightsForWeek(weekStart);
  for (const night of state.game.nights.filter((n) => inWeek(n.scheduledDate, weekStart))) {
    night.winnerUserIds = board.winners.slice();
    night.winnerUserId = board.winners[0] || "";
    night.randomizerUnlocked = board.winners.length > 0;
  }
  return board;
}

async function runNightRandomizer(nightId) {
  const night = state.game.nights.find((n) => n.id === nightId);
  if (!night || !night.randomizerUnlocked || night.randomizerUsedAt) return;
  let winnerUserId = night.winnerUserId;
  const winners = Array.isArray(night.winnerUserIds) ? night.winnerUserIds : [];
  if (winners.length > 1) {
    winnerUserId = winners[Math.floor(Math.random() * winners.length)];
    night.winnerUserId = winnerUserId;
    const winnerName = findMember(winnerUserId)?.name || "Winner";
    alert(`Tie resolved by coin flip. ${winnerName} can use the randomizer.`);
  }
  if (!winnerUserId) return;

  const firstPick = randomActivityForType(night.type);
  if (!firstPick) {
    alert("No active activities configured for this night type.");
    return;
  }
  let chosen = firstPick;
  let rerolled = false;
  let confirmUse = window.confirm(`Randomizer picked: ${chosen.title}. Confirm this activity?`);
  if (!confirmUse && state.game.settings.allowReroll && !night.rerollUsed) {
    const rerollNow = window.confirm("Use your one reroll?");
    if (rerollNow) {
      const secondPick = randomActivityForType(night.type);
      if (secondPick) {
        chosen = secondPick;
        rerolled = true;
        confirmUse = window.confirm(`Reroll picked: ${chosen.title}. Confirm this activity?`);
      }
    }
  }
  if (!confirmUse) return;

  night.selectedActivityId = chosen.id;
  night.randomizerUsedAt = new Date().toISOString();
  if (rerolled) {
    night.rerollUsed = true;
    night.rerollLog.push({ at: night.randomizerUsedAt, activityId: chosen.id });
  }
  await saveState();
  renderNights();
}

function selectedMemberFrom(select) {
  return findMember(select.value) || state.members[0] || null;
}

document.getElementById("eventAllDay").addEventListener("change", () => {
  el.eventTimeRow.classList.toggle("hidden", el.eventAllDay.checked);
});

document.getElementById("eventForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = el.eventTitle.value.trim();
  const startDate = el.eventStartDate.value;
  const endDateRaw = el.eventEndDate.value;
  const allDay = el.eventAllDay.checked;
  const owner = selectedMemberFrom(el.eventMember);
  const involved = Array.from(document.querySelectorAll("[data-involved-member]:checked")).map((x) => x.value);
  if (!title || !startDate || !endDateRaw || !owner) return;

  const nextEvent = {
    title,
    startDate,
    endDate: endDateRaw < startDate ? startDate : endDateRaw,
    allDay,
    start: allDay ? "" : el.eventStart.value,
    end: allDay ? "" : el.eventEnd.value,
    memberId: owner.id,
    memberName: owner.name,
    involvedMemberIds: Array.from(new Set(involved.concat(owner.id))),
    recurring: el.eventRecurring.value,
  };

  if (state.editingEventId) {
    const idx = state.events.findIndex((ev) => ev.id === state.editingEventId);
    if (idx >= 0) {
      const prev = state.events[idx];
      state.events[idx] = {
        ...prev,
        ...nextEvent,
        id: prev.id,
      };
    } else {
      state.events.push({ id: uid(), ...nextEvent });
    }
  } else {
    state.events.push({ id: uid(), ...nextEvent });
  }

  resetEventEditor(e.target);
  await saveState();
  renderCalendar();
  renderRecurring();
  renderPersonEvents();
  renderRequestEventsList();
});

el.eventCancelBtn?.addEventListener("click", () => {
  resetEventEditor();
});

document.getElementById("requestForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = document.getElementById("requestInput").value.trim();
  const requestedDate = document.getElementById("requestDate").value;
  const requestedTime = document.getElementById("requestTime").value;
  const member = selectedMemberFrom(el.requestMember);
  if (!text || !member) return;
  state.requests.unshift({
    id: uid(),
    text,
    requestedDate,
    requestedTime,
    memberId: member.id,
    memberName: member.name,
    status: "pending",
    approvedAt: "",
    disapprovedAt: "",
    approvedEventId: "",
  });
  e.target.reset();
  populateMemberSelects();
  await saveState();
  renderRequests();
});

document.getElementById("memberForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("memberName").value.trim();
  const role = document.getElementById("memberRole").value;
  const age = Number(document.getElementById("memberAge").value);
  const gender = document.getElementById("memberGender").value;
  if (!name || !role || !age || !gender) return;
  state.members.push({ id: uid(), name, role, age, gender });
  e.target.reset();
  await saveState();
  renderPersonTabs();
  populateMemberSelects();
  renderInvolvedChecklist();
  renderMemberList();
});

document.getElementById("choreForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
});

document.getElementById("generateChoresBtn").addEventListener("click", async () => {
  await generateWeeklyChoreSchedule();
});

el.choreWeekStart?.addEventListener("change", async () => {
  const value = el.choreWeekStart.value;
  if (!value) return;
  state.game.scheduleWeekStart = weekStartIso(value);
  await saveState();
  renderChoreGameControls();
  renderChores();
  renderCalendar();
  renderCalendarAssignedChores();
});

el.choresViews?.addEventListener("click", async (e) => {
  const view = e.target.closest("[data-chores-view]")?.dataset.choresView;
  if (!view) return;
  state.game.choresView = view;
  renderChores();
  await saveState();
});

el.choreGameDate?.addEventListener("change", () => {
  state.game.selectedDate = el.choreGameDate.value || state.game.scheduleWeekStart;
  renderDailyAssignments();
  saveState();
});

el.choreGameWeekStart?.addEventListener("change", async () => {
  const value = el.choreGameWeekStart.value;
  if (!value) return;
  state.game.scheduleWeekStart = weekStartIso(value);
  if (!state.game.selectedDate || !inWeek(state.game.selectedDate, state.game.scheduleWeekStart)) {
    state.game.selectedDate = state.game.scheduleWeekStart;
  }
  ensureNightsForWeek(state.game.scheduleWeekStart);
  await saveState();
  renderChoreGameControls();
  renderDailyAssignments();
  renderWeeklyLoad();
  renderGameLeaderboard();
  renderNights();
});

el.finalizeWeekBtn?.addEventListener("click", async () => {
  ensureGameDefaults();
  const board = finalizeWeekAndUnlockNights();
  await saveState();
  renderGameLeaderboard();
  renderNights();
  if (!board.winners.length) {
    alert("No winner yet. Complete chores this week to unlock randomizer.");
    return;
  }
  const names = board.winners.map((id) => findMember(id)?.name || "Winner").join(", ");
  alert(`Weekly winner${board.winners.length > 1 ? "s" : ""}: ${names}. Randomizer unlocked.`);
});

el.saveGameSettingsBtn?.addEventListener("click", async () => {
  state.game.settings.scoreByDifficulty = {
    1: Math.max(1, Number(el.scoreDiff1?.value) || 1),
    2: Math.max(1, Number(el.scoreDiff2?.value) || 2),
    3: Math.max(1, Number(el.scoreDiff3?.value) || 3),
  };
  state.game.settings.allowReroll = !!el.allowReroll?.checked;
  await saveState();
  renderGameLeaderboard();
  alert("Chore game settings saved.");
});

document.getElementById("plannerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  state.planner.location = el.plannerLocation.value.trim();
  state.planner.prefs = el.plannerPrefs.value.trim();
  state.planner.partnerEmail = el.partnerEmail.value.trim();
  el.plannerIdeas.innerHTML = "<li>Generating ideas...</li>";

  try {
    const data = await requestDateIdeas();
    state.planner.ideas = Array.isArray(data.ideas) ? data.ideas : [];
  } catch (_err) {
    state.planner.ideas = [];
    el.plannerIdeas.innerHTML = "<li>Could not generate ideas right now. Check OpenAI config.</li>";
    await saveState();
    return;
  }

  await saveState();
  renderPlannerIdeas();
});

document.getElementById("mealPlannerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    people: Number(el.mealPeople?.value || 4),
    timeMinutes: Number(el.mealTime?.value || 45),
    budget: Number(el.mealBudget?.value || 80),
    day: String(el.mealDay?.value || ""),
    location: String(el.mealLocation?.value || "").trim(),
    mode: String(el.mealMode?.value || "EITHER"),
    currency: "USD",
    skillLevel: String(el.mealSkill?.value || "intermediate"),
    dietaryConstraints: String(el.mealDietary?.value || "").trim(),
    allergies: String(el.mealAllergies?.value || "").trim(),
    preferredCuisines: String(el.mealCuisines?.value || "").trim(),
    dislikedIngredients: String(el.mealDisliked?.value || "").trim(),
    equipment: String(el.mealEquipment?.value || "").trim(),
    preferences: String(el.mealPrefs?.value || "").trim(),
  };

  state.planner.meal = {
    ...state.planner.meal,
    people: payload.people,
    timeMinutes: payload.timeMinutes,
    budget: payload.budget,
    day: payload.day,
    location: payload.location,
    mode: payload.mode,
    currency: payload.currency,
    skillLevel: payload.skillLevel,
    dietaryConstraints: payload.dietaryConstraints,
    allergies: payload.allergies,
    preferredCuisines: payload.preferredCuisines,
    dislikedIngredients: payload.dislikedIngredients,
    equipment: payload.equipment,
    prefs: payload.preferences,
  };

  if (el.mealDealsList) el.mealDealsList.innerHTML = "<li>Generating local deal suggestions...</li>";
  if (el.mealRecipesList) el.mealRecipesList.innerHTML = "<li>Generating at-home recipes...</li>";
  if (el.mealNextDayList) el.mealNextDayList.innerHTML = "<li>Generating next-day ideas...</li>";

  try {
    const data = await requestMealPlan(payload);
    state.planner.meal.deals = Array.isArray(data.deals) ? data.deals : [];
    state.planner.meal.recipes = Array.isArray(data.recipes) ? data.recipes : [];
    state.planner.meal.nextDay = Array.isArray(data.nextDay) ? data.nextDay : [];
    state.planner.meal.rawText = String(data.rawText || "");
  } catch (_err) {
    state.planner.meal.deals = [];
    state.planner.meal.recipes = [];
    state.planner.meal.nextDay = [];
    state.planner.meal.rawText = "";
    if (el.mealDealsList) el.mealDealsList.innerHTML = "<li>Could not generate meal suggestions. Check OpenAI config.</li>";
    if (el.mealRecipesList) el.mealRecipesList.innerHTML = "<li class='muted'>No recipes generated.</li>";
    if (el.mealNextDayList) el.mealNextDayList.innerHTML = "<li class='muted'>No next-day ideas generated.</li>";
    await saveState();
    return;
  }

  await saveState();
  renderMealSuggestions();
});

document.getElementById("icalForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = document.getElementById("icalFile").files?.[0];
  const member = selectedMemberFrom(el.icalMember);
  if (!file || !member) return;
  const source = sourceForImport(file.name);
  const text = await file.text();
  const incoming = parseIcal(text);
  let merged = 0;

  for (const ev of incoming) {
    const exists = state.events.some((x) => x.memberId === member.id && x.title === ev.title && x.startDate === ev.startDate && (x.start || "") === (ev.start || ""));
    if (exists) continue;
    state.events.push({
      id: uid(),
      title: ev.title,
      startDate: ev.startDate,
      endDate: ev.endDate,
      allDay: ev.allDay,
      start: ev.start,
      end: ev.end,
      memberId: member.id,
      memberName: member.name,
      involvedMemberIds: [member.id],
      importSourceId: source.id,
      importSourceName: source.name,
      importedAt: Date.now(),
      recurring: ev.recurring,
    });
    merged += 1;
  }

  await saveState();
  renderCalendar();
  renderRecurring();
  renderPersonEvents();
  renderRequestEventsList();
  renderMergedSources();
  document.getElementById("icalFile").value = "";
  alert(`Merged ${merged} event${merged === 1 ? "" : "s"}.`);
});

el.mergedSourcesList.addEventListener("click", async (e) => {
  const sourceId = e.target.dataset.removeMergedSource;
  if (!sourceId) return;
  const before = state.events.length;
  state.events = state.events.filter((ev) => ev.importSourceId !== sourceId);
  const removed = before - state.events.length;
  await saveState();
  renderCalendar();
  renderRecurring();
  renderPersonEvents();
  renderRequestEventsList();
  renderMergedSources();
  alert(`Removed ${removed} imported event${removed === 1 ? "" : "s"}.`);
});

document.getElementById("removeOldMergedForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const beforeDate = el.oldMergedBefore.value;
  const sourceId = el.oldMergedSource.value;
  if (!beforeDate) return;

  const beforeCount = state.events.length;
  state.events = state.events.filter((ev) => {
    if (!ev.importSourceId) return true;
    if (sourceId !== "all" && ev.importSourceId !== sourceId) return true;
    const compareDate = ev.endDate || ev.startDate;
    if (!compareDate) return true;
    return compareDate >= beforeDate;
  });
  const removed = beforeCount - state.events.length;
  await saveState();
  renderCalendar();
  renderRecurring();
  renderPersonEvents();
  renderMergedSources();
  alert(`Removed ${removed} old imported event${removed === 1 ? "" : "s"}.`);
});

document.getElementById("exportIcalBtn").addEventListener("click", () => {
  const rows = visibleEvents();
  const text = exportIcal(rows);
  const blob = new Blob([text], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `famcal-${formatDate(new Date())}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

el.requestList.addEventListener("click", async (e) => {
  const approveId = e.target.closest("[data-approve-request]")?.dataset.approveRequest;
  if (approveId) {
    await approveRequest(approveId);
    await saveState();
    renderRequests();
    renderCalendar();
    renderRequestEventsList();
    return;
  }

  const disapproveId = e.target.closest("[data-disapprove-request]")?.dataset.disapproveRequest;
  if (disapproveId) {
    disapproveRequest(disapproveId);
    await saveState();
    renderRequests();
    return;
  }

  const id = e.target.closest("[data-delete-request]")?.dataset.deleteRequest;
  if (!id) return;
  state.requests = state.requests.filter((r) => r.id !== id);
  await saveState();
  renderRequests();
});

el.recurringList.addEventListener("click", async (e) => {
  const id = e.target.dataset.removeRecurring;
  if (!id) return;
  state.events = state.events.filter((ev) => ev.id !== id);
  await saveState();
  renderCalendar();
  renderRecurring();
  renderPersonEvents();
  renderRequestEventsList();
});

el.memberList.addEventListener("click", async (e) => {
  const renameId = e.target.dataset.renameMember;
  if (renameId) {
    const m = findMember(renameId);
    if (!m) return;
    const next = prompt("New name:", m.name);
    if (!next || !next.trim()) return;
    m.name = next.trim();
    for (const set of [state.events, state.requests, state.chores, state.game.assignments]) {
      for (const item of set) if (item.memberId === m.id) item.memberName = m.name;
      for (const item of set) if (item.userId === m.id) item.userName = m.name;
    }
    await saveState();
    render();
    return;
  }

  const deleteId = e.target.dataset.deleteMember;
  if (!deleteId) return;
  if (state.members.length <= 1) {
    alert("Keep at least one member.");
    return;
  }

  state.members = state.members.filter((m) => m.id !== deleteId);
  state.events = state.events.filter((x) => x.memberId !== deleteId).map((x) => ({ ...x, involvedMemberIds: (x.involvedMemberIds || []).filter((id) => id !== deleteId) }));
  state.requests = state.requests.filter((x) => x.memberId !== deleteId);
  state.chores = state.chores.filter((x) => x.memberId !== deleteId);
  state.game.assignments = state.game.assignments.filter((x) => x.userId !== deleteId);
  state.game.nights = state.game.nights.map((n) => ({
    ...n,
    winnerUserIds: (n.winnerUserIds || []).filter((id) => id !== deleteId),
    winnerUserId: n.winnerUserId === deleteId ? "" : n.winnerUserId,
  }));
  if (state.selectedPersonId === deleteId) state.selectedPersonId = "family";

  await saveState();
  render();
});

el.choresTodayPanel?.addEventListener("click", async (e) => {
  const button = e.target.closest("[data-chore-action]");
  if (!button) return;
  const action = button.dataset.choreAction;
  const assignmentId = button.dataset.assignmentId;
  if (!action || !assignmentId) return;
  await applyChoreAction(action, assignmentId, button);
});

let choreTouchStartX = 0;
let choreTouchId = "";
el.choresTodayPanel?.addEventListener("touchstart", (e) => {
  const row = e.target.closest("[data-assignment-id]");
  if (!row) return;
  choreTouchId = row.dataset.assignmentId || "";
  choreTouchStartX = e.changedTouches?.[0]?.clientX || 0;
}, { passive: true });

el.choresTodayPanel?.addEventListener("touchend", async (e) => {
  if (!choreTouchId) return;
  const endX = e.changedTouches?.[0]?.clientX || 0;
  const delta = endX - choreTouchStartX;
  const id = choreTouchId;
  choreTouchId = "";
  if (Math.abs(delta) < 70) return;
  if (delta > 0) {
    await applyChoreAction("complete", id, e.target);
  } else {
    await applyChoreAction("skip", id, e.target);
  }
}, { passive: true });

el.choresSettingsPanel?.addEventListener("submit", async (e) => {
  if (e.target.id !== "choresSettingsForm") return;
  e.preventDefault();
  const form = new FormData(e.target);
  state.game.settings.celebrateCompletions = form.get("celebrateCompletions") === "on";
  state.game.settings.celebrateCriticalMoment = form.get("celebrateCriticalMoment") === "on";
  state.game.settings.lateHighlightHour = Math.max(16, Math.min(23, Number(form.get("lateHighlightHour")) || 19));
  await saveState();
  renderChores();
  showToast("Chores settings saved.");
});

el.dailyAssignmentsList?.addEventListener("click", async (e) => {
  const completeId = e.target.closest("[data-complete-assignment]")?.dataset.completeAssignment;
  const skipId = e.target.closest("[data-skip-assignment]")?.dataset.skipAssignment;
  const id = completeId || skipId;
  if (!id) return;
  const row = state.game.assignments.find((a) => a.id === id);
  if (!row) return;

  if (completeId) {
    if (row.status === "completed" || row.status === "verified") return;
    row.status = "completed";
    row.completedAt = new Date().toISOString();
    celebrateCompletion(e.target);
  } else {
    row.status = "skipped";
    row.completedAt = "";
  }

  await saveState();
  renderDailyAssignments();
  renderGameLeaderboard();
  renderCalendarAssignedChores();
});

el.calendarAssignedChores?.addEventListener("click", async (e) => {
  const completeId = e.target.closest("[data-complete-assignment]")?.dataset.completeAssignment;
  const skipId = e.target.closest("[data-skip-assignment]")?.dataset.skipAssignment;
  const id = completeId || skipId;
  if (!id) return;
  const row = state.game.assignments.find((a) => a.id === id);
  if (!row) return;

  if (completeId) {
    if (row.status === "completed" || row.status === "verified") return;
    row.status = "completed";
    row.completedAt = new Date().toISOString();
    celebrateCompletion(e.target);
  } else {
    row.status = "skipped";
    row.completedAt = "";
  }

  await saveState();
  renderDailyAssignments();
  renderGameLeaderboard();
  renderCalendarAssignedChores();
});

el.nightsList?.addEventListener("click", async (e) => {
  const nightId = e.target.closest("[data-randomize-night]")?.dataset.randomizeNight;
  if (!nightId) return;
  await runNightRandomizer(nightId);
});

el.plannerIdeas.addEventListener("click", async (e) => {
  const idx = e.target.dataset.chooseIdea;
  if (idx === undefined) return;
  const idea = state.planner.ideas[Number(idx)];
  if (!idea) return;

  const owner = state.members.find((m) => m.role === "adult") || state.members[0];
  if (!owner) return;

  state.events.push({
    id: uid(),
    title: idea.title || "Date Night",
    startDate: idea.date,
    endDate: idea.date,
    allDay: false,
    start: idea.start_time || "19:00",
    end: idea.end_time || "21:00",
    memberId: owner.id,
    memberName: owner.name,
    involvedMemberIds: state.members.filter((m) => m.role === "adult").map((m) => m.id),
    recurring: "none",
  });

  await saveState();
  renderCalendar();
  renderPersonEvents();
  renderRequestEventsList();
  alert("Date added to calendar.");

  if (state.planner.partnerEmail) {
    alert("Date added to calendar. Email sending is currently disabled.");
  }
});

el.requestEventsList?.addEventListener("click", async (e) => {
  const editId = e.target.closest("[data-edit-event]")?.dataset.editEvent;
  if (editId) {
    startEventEdit(editId);
    return;
  }
  const deleteId = e.target.closest("[data-delete-event]")?.dataset.deleteEvent;
  if (!deleteId) return;
  if (!window.confirm("Delete this event?")) return;
  await removeEvent(deleteId);
});

el.mealRecipesList?.addEventListener("click", async (e) => {
  const button = e.target.closest("[data-share-recipe]");
  if (!button) return;
  const idx = Number(button.dataset.shareRecipe);
  if (Number.isNaN(idx) || idx < 0) return;
  const meal = state.planner.meal || {};
  const recipes = Array.isArray(meal.recipes) ? meal.recipes : [];
  const recipe = recipes[idx];
  if (!recipe) return;
  const fallbackDetails = !recipe.notes && idx === 0
    ? extractMealSection(meal.rawText || "", "Option B (Recipe):", "Tomorrow Suggestions:")
    : "";
  await shareRecipeToNotes(recipe, fallbackDetails);
});

el.grid.addEventListener("click", (e) => {
  const editId = e.target.closest("[data-edit-event]")?.dataset.editEvent;
  if (editId) {
    startEventEdit(editId);
    return;
  }
  const deleteId = e.target.closest("[data-delete-event]")?.dataset.deleteEvent;
  if (deleteId) {
    if (window.confirm("Delete this event?")) {
      removeEvent(deleteId);
    }
    return;
  }
  const action = e.target.dataset.action;
  if (action !== "jump") return;
  const date = e.target.dataset.date;
  if (!date) return;
  resetEventEditor();
  el.eventStartDate.value = date;
  el.eventEndDate.value = date;
  el.eventTitle.focus();
});

el.grid.addEventListener("change", async (e) => {
  const id = e.target.dataset.toggleAssignment;
  if (!id) return;
  const a = state.game.assignments.find((x) => x.id === id);
  if (!a) return;
  a.status = e.target.checked ? "completed" : "assigned";
  a.completedAt = e.target.checked ? new Date().toISOString() : "";
  await saveState();
  renderCalendar();
  renderCalendarAssignedChores();
  if (e.target.checked) celebrateCompletion(e.target);
});

el.personTabs.addEventListener("click", (e) => {
  const id = e.target.dataset.personId;
  if (!id) return;
  setSelectedPerson(id);
});

el.choresPersonTabs?.addEventListener("click", (e) => {
  const id = e.target.dataset.choresPersonId;
  if (!id) return;
  setSelectedPerson(id);
});

el.mainTabs.forEach((b) => {
  b.addEventListener("click", () => setMainTab(b.dataset.tab));
});

document.getElementById("planDateBtn")?.addEventListener("click", () => {});
document.getElementById("prevBtn").addEventListener("click", () => shiftDate(-1));
document.getElementById("nextBtn").addEventListener("click", () => shiftDate(1));
document.getElementById("todayBtn").addEventListener("click", () => {
  state.currentDate = new Date();
  renderCalendar();
});

document.getElementById("shareBtn").addEventListener("click", async () => {
  if (!state.roomId) {
    state.roomId = newRoomId();
    const url = new URL(window.location.href);
    url.searchParams.set("room", state.roomId);
    url.searchParams.delete("data");
    window.history.replaceState({}, "", url.toString());
    await saveState();
    startPolling();
  }

  const link = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(state.roomId)}`;
  try {
    await navigator.clipboard.writeText(link);
    alert("Live share link copied.");
  } catch (_err) {
    prompt("Copy this live share link:", link);
  }
});

el.viewBtns.forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));

function render() {
  ensureGameDefaults();
  setMainTab(state.activeTab, false);
  renderPersonTabs();
  renderChoresPersonTabs();
  populateMemberSelects();
  renderInvolvedChecklist();
  renderCalendar();
  renderRequests();
  renderRequestEventsList();
  renderRecurring();
  renderMergedSources();
  renderMemberList();
  renderPersonEvents();
  renderChores();
  renderChoreGameControls();
  renderCalendarAssignedChores();
  updateChoreNote();
  updateEventFormMode();
  setPlannerInputs();
  renderPlannerIdeas();
  renderMealSuggestions();
}

(async () => {
  await loadState();
  render();
})();
