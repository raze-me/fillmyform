import {
  getProfiles,
  saveProfile,
  deleteProfile,
  createNewProfile,
} from '../lib/storage';
import type { Profile, ProfileField } from '../lib/schema';

function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Fill My Form: #${id} is missing from options.html`);
  return el as T;
}

const profileListEl = $<HTMLUListElement>('profileList');
const profileEditorEl = $<HTMLDivElement>('profileEditor');
const emptyStateEl = $<HTMLDivElement>('emptyState');
const currentProfileNameEl = $<HTMLHeadingElement>('currentProfileName');
const fieldsContainerEl = $<HTMLDivElement>('fieldsContainer');
const statusEl = $<HTMLParagraphElement>('status');

const newProfileBtn = $<HTMLButtonElement>('newProfileBtn');
const newProfileForm = $<HTMLFormElement>('newProfileForm');
const newProfileName = $<HTMLInputElement>('newProfileName');
const deleteProfileBtn = $<HTMLButtonElement>('deleteProfileBtn');
const importFileEl = $<HTMLInputElement>('importFile');

let currentProfile: Profile | null = null;
let allProfiles: Profile[] = [];

let statusTimer: number | undefined;

function setStatus(message: string, kind: 'ok' | 'error' | 'none' = 'none'): void {
  window.clearTimeout(statusTimer);
  statusEl.textContent = message;
  statusEl.className = kind === 'none' ? '' : kind;
  if (message) {
    statusTimer = window.setTimeout(() => setStatus(''), 3000);
  }
}


async function loadProfiles(): Promise<void> {
  allProfiles = await getProfiles();
  renderSidebar();
}

function renderSidebar(): void {
  profileListEl.innerHTML = '';

  for (const profile of allProfiles) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'profile-item';
    btn.textContent = profile.profileName;
    if (currentProfile?.profileId === profile.profileId) {
      btn.setAttribute('aria-current', 'true');
    }
    btn.addEventListener('click', () => selectProfile(profile));
    li.appendChild(btn);
    profileListEl.appendChild(li);
  }
}

function showEmpty(): void {
  currentProfile = null;
  profileEditorEl.hidden = true;
  emptyStateEl.hidden = false;
  renderSidebar();
}

function selectProfile(profile: Profile): void {
  currentProfile = JSON.parse(JSON.stringify(profile)) as Profile;
  emptyStateEl.hidden = true;
  profileEditorEl.hidden = false;
  currentProfileNameEl.textContent = currentProfile.profileName;
  disarmDelete();
  setStatus('');
  renderFields();
  renderSidebar();
}

function renderFields(): void {
  fieldsContainerEl.innerHTML = '';
  const profile = currentProfile;
  if (!profile) return;

  profile.fields.forEach((field, index) => {
    const row = document.createElement('div');
    row.className = 'field-row';

    if (field.isCustom) {
      const labelInput = document.createElement('input');
      labelInput.type = 'text';
      labelInput.value = field.label;
      labelInput.placeholder = 'Field name';
      labelInput.setAttribute('aria-label', 'Field name');
      labelInput.addEventListener('input', () => {
        field.label = labelInput.value;
      });
      row.appendChild(labelInput);
    } else {
      const label = document.createElement('span');
      label.className = 'field-label';
      label.textContent = field.label;
      row.appendChild(label);
    }

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.value = field.value || '';
    valueInput.placeholder = 'Value';
    valueInput.setAttribute('aria-label', `${field.label} value`);
    valueInput.addEventListener('input', () => {
      field.value = valueInput.value;
    });
    row.appendChild(valueInput);

    const altInput = document.createElement('input');
    altInput.type = 'text';
    altInput.value = (field.values || []).join(', ');
    altInput.placeholder = 'Other values, comma-separated';
    altInput.title = 'Extra options, like a second email. You can pick between them after filling.';
    altInput.setAttribute('aria-label', `${field.label} other values`);
    altInput.addEventListener('input', () => {
      field.values = altInput.value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    });
    row.appendChild(altInput);

    if (field.isCustom) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'remove';
      removeBtn.textContent = '\u00d7';
      removeBtn.title = 'Remove field';
      removeBtn.setAttribute('aria-label', `Remove ${field.label || 'field'}`);
      removeBtn.addEventListener('click', () => {
        profile.fields.splice(index, 1);
        renderFields();
      });
      row.appendChild(removeBtn);
    }

    fieldsContainerEl.appendChild(row);
  });
}


let deleteArmed = false;
let deleteTimer: number | undefined;

function disarmDelete(): void {
  deleteArmed = false;
  window.clearTimeout(deleteTimer);
  deleteProfileBtn.textContent = 'Delete';
  deleteProfileBtn.classList.remove('armed');
}


function normalizeImported(raw: unknown): Profile | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Partial<Profile>;
  if (typeof data.profileName !== 'string' || !Array.isArray(data.fields)) return null;

  const fields: ProfileField[] = [];
  for (const f of data.fields as Partial<ProfileField>[]) {
    if (!f || typeof f.fieldId !== 'string' || typeof f.label !== 'string') return null;
    fields.push({
      fieldId: f.fieldId,
      label: f.label,
      synonyms: Array.isArray(f.synonyms) ? f.synonyms.map(String) : [],
      value: typeof f.value === 'string' ? f.value : '',
      values: Array.isArray(f.values) ? f.values.map(String) : [],
      type: typeof f.type === 'string' ? f.type : 'text',
      isCustom: Boolean(f.isCustom),
    });
  }

  let profileId = typeof data.profileId === 'string' ? data.profileId : crypto.randomUUID();
  let profileName = data.profileName;

  if (allProfiles.some((p) => p.profileId === profileId)) {
    profileId = crypto.randomUUID();
    profileName = `${profileName} (copy)`;
  }

  return {
    profileId,
    profileName,
    lastUpdated: new Date().toISOString(),
    fields,
  };
}


function setupEventListeners(): void {
  newProfileBtn.addEventListener('click', () => {
    newProfileForm.hidden = false;
    newProfileBtn.hidden = true;
    newProfileName.value = '';
    newProfileName.focus();
  });

  const closeNewProfileForm = () => {
    newProfileForm.hidden = true;
    newProfileBtn.hidden = false;
    newProfileName.value = '';
  };

  newProfileName.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNewProfileForm();
  });
  newProfileName.addEventListener('blur', () => {
    if (!newProfileName.value.trim()) closeNewProfileForm();
  });

  newProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = newProfileName.value.trim();
    if (!name) return;

    const profile = createNewProfile(name);
    await saveProfile(profile);
    await loadProfiles();
    closeNewProfileForm();
    selectProfile(profile);
  });
  $<HTMLButtonElement>('saveProfileBtn').addEventListener('click', async () => {
    if (!currentProfile) return;
    currentProfile.lastUpdated = new Date().toISOString();
    try {
      await saveProfile(currentProfile);
      await loadProfiles();
      setStatus('Saved', 'ok');
    } catch (err) {
      console.error('Fill My Form: save failed', err);
      setStatus('Could not save. Try again.', 'error');
    }
  });

  deleteProfileBtn.addEventListener('click', async () => {
    if (!currentProfile) return;

    if (!deleteArmed) {
      deleteArmed = true;
      deleteProfileBtn.textContent = 'Click again to delete';
      deleteProfileBtn.classList.add('armed');
      deleteTimer = window.setTimeout(disarmDelete, 3000);
      return;
    }

    const id = currentProfile.profileId;
    disarmDelete();
    await deleteProfile(id);
    await loadProfiles();
    if (allProfiles.length > 0) selectProfile(allProfiles[0]);
    else showEmpty();
  });

  $<HTMLButtonElement>('addFieldBtn').addEventListener('click', () => {
    if (!currentProfile) return;
    currentProfile.fields.push({
      fieldId: 'custom_' + Date.now(),
      label: '',
      synonyms: [],
      value: '',
      type: 'text',
      isCustom: true,
    });
    renderFields();
    const newLabel = fieldsContainerEl.querySelector<HTMLInputElement>(
      '.field-row:last-child input',
    );
    newLabel?.focus();
  });

  // Export
  $<HTMLButtonElement>('exportBtn').addEventListener('click', () => {
    if (!currentProfile) return;
    const blob = new Blob([JSON.stringify(currentProfile, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProfile.profileName.replace(/[^\w-]+/g, '_')}_profile.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import
  $<HTMLButtonElement>('importBtn').addEventListener('click', () => {
    importFileEl.click();
  });

  importFileEl.addEventListener('change', async () => {
    const file = importFileEl.files?.[0];
    importFileEl.value = '';
    if (!file) return;

    try {
      const imported = normalizeImported(JSON.parse(await file.text()));
      if (!imported) {
        setStatus('That file is not a Fill My Form profile.', 'error');
        return;
      }
      await saveProfile(imported);
      await loadProfiles();
      selectProfile(imported);
      setStatus('Imported', 'ok');
    } catch {
      setStatus('Could not read that file. Choose a .json profile export.', 'error');
    }
  });

  $<HTMLButtonElement>('testFormBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('test-form.html') });
  });
}

async function init(): Promise<void> {
  setupEventListeners();
  await loadProfiles();
  if (allProfiles.length > 0) selectProfile(allProfiles[0]);
  else showEmpty();
}

init();