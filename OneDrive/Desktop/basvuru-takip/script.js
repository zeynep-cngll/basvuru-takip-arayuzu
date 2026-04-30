const STORAGE_SESSION = 'bt_session';
const STORAGE_TOKEN = 'bt_token';
const STORAGE_LAST_LOGIN = 'bt_last_login';

function getApiBase() {
    // When the UI is served from Live Server (e.g. :5501) or opened as file://,
    // relative "/api/*" requests will hit the wrong origin. Default backend is :3000.
    try {
        const { protocol, hostname, port } = window.location;
        if (protocol === 'file:' || port === '5501') return 'http://localhost:3000';
        // If UI is served by backend (same origin), keep relative requests.
        return '';
    } catch {
        return 'http://localhost:3000';
    }
}

const API_BASE = getApiBase();

const authRoot = document.getElementById('authRoot');
const appRoot = document.getElementById('appRoot');
const adminLoginForm = document.getElementById('adminLoginForm');
const userLoginForm = document.getElementById('userLoginForm');
const registerForm = document.getElementById('registerForm');
const registerBlock = document.getElementById('registerBlock');
const toggleRegisterBtn = document.getElementById('toggleRegisterBtn');
const authMessage = document.getElementById('authMessage');
const logoutBtn = document.getElementById('logoutBtn');
const sessionRoleLabel = document.getElementById('sessionRoleLabel');
const sessionEmailLabel = document.getElementById('sessionEmailLabel');
const panelTag = document.getElementById('panelTag');
const adminSidebarSection = document.getElementById('adminSidebarSection');
const adminUserList = document.getElementById('adminUserList');
const adminUserEmpty = document.getElementById('adminUserEmpty');
const mainListView = document.getElementById('mainListView');
const userPanelView = document.getElementById('userPanelView');
const adminPanelView = document.getElementById('adminPanelView');
const backToListFromUserBtn = document.getElementById('backToListFromUserBtn');
const backToListFromAdminBtn = document.getElementById('backToListFromAdminBtn');
const adminPanelUserTableBody = document.getElementById('adminPanelUserTableBody');
const adminPanelUserListEmpty = document.getElementById('adminPanelUserListEmpty');
const adminActionMessage = document.getElementById('adminActionMessage');
const adminClearAppsBtn = document.getElementById('adminClearAppsBtn');
const adminAppsTableBody = document.getElementById('adminAppsTableBody');
const adminAppsEmpty = document.getElementById('adminAppsEmpty');
const userPanelAppsTableBody = document.getElementById('userPanelAppsTableBody');
const userPanelAppsEmpty = document.getElementById('userPanelAppsEmpty');

const searchInput = document.getElementById('searchInput');
const statusPills = document.querySelectorAll('.status-pill');
const prioritySelect = document.getElementById('prioritySelect');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const tabs = document.querySelectorAll('.tab');

let activeStatus = 'Tümü';
let activeTab = 'tum';

function getToken() {
    return localStorage.getItem(STORAGE_TOKEN) || '';
}

function setToken(token) {
    if (token) localStorage.setItem(STORAGE_TOKEN, token);
}

function clearToken() {
    localStorage.removeItem(STORAGE_TOKEN);
}

async function apiFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const url = `${API_BASE}${path}`;
    const res = await fetch(url, { ...options, headers });
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);
    if (!res.ok) {
        const err = typeof body === 'object' && body ? body : { error: 'REQUEST_FAILED' };
        err.status = res.status;
        throw err;
    }
    return body;
}

function getRows() {
    return document.querySelectorAll('tbody tr');
}

function getSession() {
    try {
        const raw = localStorage.getItem(STORAGE_SESSION);
        if (!raw) return null;
        const s = JSON.parse(raw);
        if (!s || !s.email || !s.role) return null;
        return s;
    } catch {
        return null;
    }
}

function setSession(session) {
    localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
}

function clearSession() {
    localStorage.removeItem(STORAGE_SESSION);
}

let cachedApplications = [];

async function fetchApplications() {
    const data = await apiFetch('/api/applications');
    cachedApplications = Array.isArray(data?.items) ? data.items : [];
    return cachedApplications;
}

async function fetchAdminUsers() {
    const data = await apiFetch('/api/admin/users');
    return Array.isArray(data?.users) ? data.users : [];
}

function formatDateTr(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('tr-TR', { dateStyle: 'long' });
    } catch {
        return '—';
    }
}

function formatDateTimeTr(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('tr-TR', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return '—';
    }
}

function showMainListView() {
    mainListView?.classList.remove('hidden');
    userPanelView?.classList.add('hidden');
    userPanelView?.setAttribute('aria-hidden', 'true');
    adminPanelView?.classList.add('hidden');
    adminPanelView?.setAttribute('aria-hidden', 'true');
}

function openUserPanel() {
    mainListView?.classList.add('hidden');
    userPanelView?.classList.remove('hidden');
    userPanelView?.setAttribute('aria-hidden', 'false');
    adminPanelView?.classList.add('hidden');
    adminPanelView?.setAttribute('aria-hidden', 'true');
    populateUserPanel();
}

function openAdminPanel() {
    mainListView?.classList.add('hidden');
    userPanelView?.classList.add('hidden');
    userPanelView?.setAttribute('aria-hidden', 'true');
    adminPanelView?.classList.remove('hidden');
    adminPanelView?.setAttribute('aria-hidden', 'false');
    populateAdminPanelPage();
}

function populateUserPanel() {
    const s = getSession();
    if (!s || s.role !== 'user') return;

    const emailEl = document.getElementById('userPanelEmail');
    const regEl = document.getElementById('userPanelRegistered');
    const loginEl = document.getElementById('userPanelLastLogin');
    const ownEl = document.getElementById('userPanelOwnCount');
    const totalEl = document.getElementById('userPanelTotalCount');

    if (emailEl) emailEl.textContent = s.email;

    if (regEl) regEl.textContent = s.registeredAt ? formatDateTr(s.registeredAt) : '—';

    if (loginEl) {
        const last = sessionStorage.getItem(STORAGE_LAST_LOGIN);
        loginEl.textContent = last ? formatDateTimeTr(last) : '—';
    }
    apiFetch('/api/applications')
        .then((data) => {
            const items = Array.isArray(data?.items) ? data.items : [];
            if (ownEl) ownEl.textContent = String(items.length);
            if (totalEl) totalEl.textContent = String(items.length);

            if (userPanelAppsTableBody) {
                userPanelAppsTableBody.innerHTML = '';
                items.forEach((item) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${item.company || '-'} / ${item.role || '-'}</td>
                        <td>${item.status || '-'}</td>
                        <td>${item.priority || '-'}</td>
                        <td>${item.appliedAt || '-'}</td>
                        <td>${item.notes || '-'}</td>
                    `;
                    userPanelAppsTableBody.appendChild(tr);
                });
            }

            if (userPanelAppsEmpty) {
                userPanelAppsEmpty.style.display = items.length === 0 ? 'block' : 'none';
            }
        })
        .catch(() => {
            if (ownEl) ownEl.textContent = '0';
            if (totalEl) totalEl.textContent = '0';
            if (userPanelAppsEmpty) userPanelAppsEmpty.style.display = 'block';
        });
}

function showAdminActionMessage(text, type) {
    if (!adminActionMessage) return;
    adminActionMessage.textContent = text || '';
    adminActionMessage.classList.remove('success', 'error');
    if (type) adminActionMessage.classList.add(type);
}

function populateAdminPanelPage() {
    const s = getSession();
    if (!s || s.role !== 'admin') return;

    const emailEl = document.getElementById('adminPanelEmail');
    const ucEl = document.getElementById('adminPanelUserCount');
    const rcEl = document.getElementById('adminPanelRowCount');

    if (emailEl) emailEl.textContent = s.email;
    Promise.all([fetchAdminUsers(), fetchApplications()])
        .then(([users, apps]) => {
            if (ucEl) ucEl.textContent = String(users.length);
            if (rcEl) rcEl.textContent = String(apps.length);

            if (adminAppsTableBody) {
                adminAppsTableBody.innerHTML = '';
                apps.forEach((a) => {
                    const tr = document.createElement('tr');
                    const name = a.applicantName || '—';
                    const phone = a.applicantPhone || '—';
                    const li = a.applicantLinkedIn ? `<a href="${a.applicantLinkedIn}" target="_blank" rel="noreferrer">LinkedIn</a>` : '';
                    const cv = a.applicantCvUrl ? `<a href="${a.applicantCvUrl}" target="_blank" rel="noreferrer">CV</a>` : '';
                    const links = [li, cv].filter(Boolean).join(' • ') || '—';
                    tr.innerHTML = `
                        <td>
                            <div class="company-cell">
                                <span class="company-name">${name}</span>
                                <span class="company-role">${a.ownerEmail || ''}</span>
                            </div>
                        </td>
                        <td>
                            <div class="company-cell">
                                <span class="company-name">${a.company || '—'}</span>
                                <span class="company-role">${a.role || '—'}</span>
                            </div>
                        </td>
                        <td>
                            <div class="date-muted">${phone}</div>
                            <div class="date-muted" style="margin-top:6px;">${links}</div>
                        </td>
                        <td>${a.appliedAt || '-'}</td>
                        <td>${a.notes || '-'}</td>
                    `;
                    adminAppsTableBody.appendChild(tr);
                });
            }
            if (adminAppsEmpty) {
                adminAppsEmpty.style.display = apps.length === 0 ? 'block' : 'none';
            }

            if (adminPanelUserTableBody) adminPanelUserTableBody.innerHTML = '';
            if (users.length === 0) {
                if (adminPanelUserListEmpty) adminPanelUserListEmpty.style.display = 'block';
                return;
            }
            if (adminPanelUserListEmpty) adminPanelUserListEmpty.style.display = 'none';
            if (adminPanelUserTableBody) {
                users.forEach((u) => {
                    const tr = document.createElement('tr');
                    const reg = u.registeredAt ? formatDateTr(u.registeredAt) : '—';
                    const appCount = u.applicationCount ?? 0;
                    tr.innerHTML = `
                        <td>${u.email}</td>
                        <td>${reg}</td>
                        <td>${appCount}</td>
                        <td><button type="button" class="admin-user-delete-btn" data-email="${u.email}">Kullanıcıyı sil</button></td>
                    `;
                    adminPanelUserTableBody.appendChild(tr);
                });
            }
        })
        .catch(() => {
            if (ucEl) ucEl.textContent = '0';
            if (rcEl) rcEl.textContent = '0';
            if (adminPanelUserListEmpty) adminPanelUserListEmpty.style.display = 'block';
        });
}

async function removeUser(email) {
    const e = (email || '').trim().toLowerCase();
    if (!e) return false;
    const r = await apiFetch(`/api/admin/users/${encodeURIComponent(e)}`, { method: 'DELETE' });
    return !!r?.ok;
}

function showAuthMessage(text, ok) {
    if (!authMessage) return;
    authMessage.textContent = text || '';
    authMessage.classList.toggle('success', !!ok);
}

function showAuthView() {
    if (authRoot) authRoot.classList.remove('hidden');
    if (appRoot) appRoot.classList.add('hidden');
    document.body.removeAttribute('data-role');
}

function showAppView() {
    if (authRoot) authRoot.classList.add('hidden');
    if (appRoot) appRoot.classList.remove('hidden');
}

function applyRoleUI() {
    const session = getSession();
    if (!session) return;

    document.body.dataset.role = session.role;

    if (sessionRoleLabel) {
        sessionRoleLabel.textContent = session.role === 'admin' ? 'Yönetici' : 'Kullanıcı';
    }
    if (sessionEmailLabel) {
        sessionEmailLabel.textContent = session.email;
    }
    if (panelTag) {
        panelTag.textContent =
            session.role === 'admin' ? 'Yönetici paneli' : 'Kullanıcı paneli';
        panelTag.setAttribute(
            'aria-label',
            session.role === 'admin'
                ? 'Yönetici paneline git'
                : 'Kullanıcı paneline git',
        );
        panelTag.setAttribute('title', panelTag.getAttribute('aria-label') || '');
    }

    if (adminSidebarSection) {
        adminSidebarSection.classList.toggle('hidden', session.role !== 'admin');
    }

    // Kullanıcı ana sayfada sadece ilan kartlarıyla başvuru yapar.
    if (newAppBtn) {
        newAppBtn.classList.add('hidden');
    }
    if (formCard) {
        formCard.classList.remove('visible');
    }

    // Ana sayfadaki listeyi sadece admin görsün.
    if (tableCard) {
        tableCard.classList.toggle('hidden', session.role !== 'admin');
    }
    if (userJobBoard) {
        userJobBoard.classList.toggle('hidden', session.role !== 'user');
        if (session.role === 'user') {
            syncJobsToUserBoard()
                .then(() => refreshUserJobBoardButtons())
                .catch(() => refreshUserJobBoardButtons());
            const flash = sessionStorage.getItem('bt_apply_success');
            if (flash && userJobBoardMessage) {
                userJobBoardMessage.textContent = flash;
                userJobBoardMessage.classList.remove('error');
                userJobBoardMessage.classList.add('success');
                sessionStorage.removeItem('bt_apply_success');
            }
        }
    }

    if (session.role === 'admin') {
        refreshAdminUserList();
        syncJobsToAdminTable().catch(() => {});
    }
}

function refreshAdminUserList() {
    if (!adminUserList || !adminUserEmpty) return;
    fetchAdminUsers()
        .then((users) => {
            adminUserList.innerHTML = '';
            if (users.length === 0) {
                adminUserEmpty.style.display = 'block';
                return;
            }
            adminUserEmpty.style.display = 'none';
            users.forEach((u) => {
                const li = document.createElement('li');
                li.textContent = u.email;
                adminUserList.appendChild(li);
            });
        })
        .catch(() => {
            adminUserList.innerHTML = '';
            adminUserEmpty.style.display = 'block';
        });
}

async function tryLoginApi(email, password) {
    const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    if (data?.token) setToken(data.token);
    if (data?.session) setSession({ email: data.session.email, role: data.session.role, registeredAt: data.session.registeredAt });
    return { ok: true };
}

async function tryRegisterApi(email, password, password2) {
    const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, password2 }),
    });
    if (data?.token) setToken(data.token);
    if (data?.session) setSession({ email: data.session.email, role: data.session.role, registeredAt: data.session.registeredAt });
    return { ok: true, message: 'Kayıt tamamlandı.' };
}

function logout() {
    clearSession();
    clearToken();
    showMainListView();
    showAuthView();
    showAuthMessage('', false);
    if (adminLoginForm) adminLoginForm.reset();
    if (userLoginForm) userLoginForm.reset();
    if (registerForm) registerForm.reset();
}

function applyFilters() {
    const searchText = (searchInput.value || '').toLowerCase().trim();
    const selectedPriority = prioritySelect.value || 'Hepsi';

    getRows().forEach((row) => {
        const companyName = row.querySelector('.company-name')?.textContent.toLowerCase() || '';
        const roleName = row.querySelector('.company-role')?.textContent.toLowerCase() || '';
        const statusText = row.querySelector('.status-chip')?.textContent || '';
        const priorityText = row.querySelector('.priority-pill')?.textContent || '';

        const matchesSearch =
            !searchText || companyName.includes(searchText) || roleName.includes(searchText);

        const matchesStatus = activeStatus === 'Tümü' || statusText.includes(activeStatus);

        const matchesPriority =
            selectedPriority === 'Hepsi' || priorityText.includes(selectedPriority);

        let matchesTab = true;
        const statusLower = statusText.toLowerCase();

        if (activeTab === 'aktif') {
            const isRejected = statusLower.includes('olumsuz');
            const isOffer = statusLower.includes('teklif');
            matchesTab = !isRejected && !isOffer;
        } else if (activeTab === 'beklemede') {
            const isApplied = statusLower.includes('başvuruldu');
            const isReview = statusLower.includes('incelemede');
            matchesTab = isApplied || isReview;
        }

        const visible = matchesSearch && matchesStatus && matchesPriority && matchesTab;
        row.style.display = visible ? '' : 'none';
    });
}

if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
}

statusPills.forEach((pill) => {
    pill.addEventListener('click', () => {
        statusPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        activeStatus = pill.dataset.status || 'Tümü';
        applyFilters();
    });
});

if (prioritySelect) {
    prioritySelect.addEventListener('change', applyFilters);
}

if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (prioritySelect) prioritySelect.value = 'Hepsi';
        activeStatus = 'Tümü';
        activeTab = 'tum';
        statusPills.forEach((p) => {
            p.classList.toggle('active', p.dataset.status === 'Tümü');
        });
        tabs.forEach((t) => {
            t.classList.toggle('active', t.dataset.tab === 'tum');
        });
        applyFilters();
    });
}

tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        activeTab = tab.dataset.tab || 'tum';
        applyFilters();
    });
});

const tbody = document.getElementById('appsTableBody');

const newAppBtn = document.getElementById('newAppBtn');
const formCard = document.getElementById('newAppForm');
const applicationForm = document.getElementById('applicationForm');
const cancelFormBtn = document.getElementById('cancelFormBtn');
const tableCard = document.getElementById('adminApplicationsTable');
const userJobBoard = document.getElementById('userJobBoard');
const userJobBoardMessage = document.getElementById('userJobBoardMessage');
const jobBoardGrid = document.getElementById('jobBoardGrid');

const adminJobCreateForm = document.getElementById('adminJobCreateForm');
const adminJobsTableBody = document.getElementById('adminJobsTableBody');
const adminJobsEmpty = document.getElementById('adminJobsEmpty');
const adminJobsMessage = document.getElementById('adminJobsMessage');

async function fetchJobs() {
    const data = await apiFetch('/api/jobs');
    return Array.isArray(data?.items) ? data.items : [];
}

function showAdminJobsMessage(text, type = '') {
    if (!adminJobsMessage) return;
    adminJobsMessage.textContent = text || '';
    adminJobsMessage.classList.remove('success', 'error');
    if (type) adminJobsMessage.classList.add(type);
}

function adminDeleteCellHtml() {
    return `<td class="col-admin-only"><button type="button" class="btn-row-delete" title="Sil">Sil</button></td>`;
}

function getStatusClass(status) {
    let statusClass = 'status-applied';
    if (status.includes('İncelemede')) statusClass = 'status-review';
    if (status.includes('Mülakat')) statusClass = 'status-interview';
    if (status.includes('Teklif')) statusClass = 'status-offer';
    if (status.includes('Olumsuz')) statusClass = 'status-rejected';
    return statusClass;
}

function getPriorityClass(priority) {
    let priorityClass = '';
    if (priority === 'Yüksek') priorityClass = 'priority-high';
    else if (priority === 'Orta') priorityClass = 'priority-medium';
    return priorityClass;
}

function applicationExistsInRows(ownerEmail, company, role) {
    return Array.from(getRows()).some(
        (row) =>
            row.dataset.ownerEmail === ownerEmail &&
            (row.querySelector('.company-name')?.textContent || '').trim() === company &&
            (row.querySelector('.company-role')?.textContent || '').trim() === role,
    );
}

function addApplicationRow({ company, role, status, priority, location, jobType, appliedAt, updatedAt, notes, ownerEmail }) {
    if (!tbody || !company || !role) return false;
    const statusClass = getStatusClass(status || 'Başvuruldu');
    const priorityClass = getPriorityClass(priority || 'Düşük');

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>
            <div class="company-cell">
                <span class="company-name">${company}</span>
                <span class="company-role">${role}</span>
            </div>
        </td>
        <td>
            <span class="status-chip ${statusClass}">
                <span></span> ${status || 'Başvuruldu'}
            </span>
        </td>
        <td>
            <span class="priority-pill ${priorityClass}">${priority || 'Düşük'}</span>
        </td>
        <td>
            <span class="tag-pill">${location || 'Bilinmiyor'}</span>
            <span class="tag-pill">${jobType || 'Belirtilmedi'}</span>
        </td>
        <td><span class="date-muted">${appliedAt || '-'}</span></td>
        <td><span class="date-muted">${updatedAt || '-'}</span></td>
        <td class="notes">${notes || '-'}</td>
        ${adminDeleteCellHtml()}
    `;

    const sess = getSession();
    if (ownerEmail) {
        tr.dataset.ownerEmail = ownerEmail;
    } else if (sess?.role === 'user' && sess.email) {
        tr.dataset.ownerEmail = sess.email;
    }

    tbody.appendChild(tr);
    applyFilters();
    return true;
}

async function syncDbApplicationsToTable() {
    const sess = getSession();
    if (!sess || sess.role !== 'admin') return;
    if (!tbody) return;
    tbody.innerHTML = '';
    const items = await fetchApplications();
    items.forEach((item) => {
        if (!item?.company || !item?.role) return;
        const ok = addApplicationRow({
            company: item.company,
            role: item.role,
            status: item.status || 'Başvuruldu',
            priority: item.priority || 'Düşük',
            location: item.location || 'Bilinmiyor',
            jobType: item.jobType || 'Belirtilmedi',
            appliedAt: item.appliedAt || '-',
            updatedAt: item.updatedAt || '-',
            notes: item.notes || '-',
            ownerEmail: item.ownerEmail,
        });
        if (ok) {
            const lastRow = tbody.lastElementChild;
            if (lastRow && item._id) lastRow.dataset.appId = String(item._id);
        }
    });
}

function priorityPillClass(priority) {
    const p = String(priority || 'Düşük');
    if (p === 'Yüksek') return 'priority-pill priority-high';
    if (p === 'Orta') return 'priority-pill priority-medium';
    return 'priority-pill';
}

function jobCardHtml(job) {
    const company = job.company || '';
    const role = job.role || '';
    const title = `${company} - ${role}`.trim();
    const location = job.location || 'Bilinmiyor';
    const jobType = job.jobType || 'Belirtilmedi';
    const priority = job.priority || 'Düşük';
    const summary = job.summary || `${location}, ${jobType}`;
    return `
        <article class="job-posting-card">
            <h3>${title || 'İş ilanı'}</h3>
            <p>${summary}</p>
            <div class="job-posting-tags">
                <span class="tag-pill">${location}</span>
                <span class="tag-pill">${jobType}</span>
                <span class="${priorityPillClass(priority)}">${priority}</span>
            </div>
            <button
                type="button"
                class="btn btn-primary job-apply-btn"
                data-company="${company}"
                data-role="${role}"
                data-location="${location}"
                data-job-type="${jobType}"
                data-priority="${priority}"
            >Başvur</button>
        </article>
    `;
}

async function syncJobsToUserBoard() {
    const sess = getSession();
    if (!sess || sess.role !== 'user') return;
    if (!jobBoardGrid) return;
    try {
        const jobs = await fetchJobs();
        jobBoardGrid.innerHTML = jobs.map(jobCardHtml).join('');
        if (userJobBoardMessage) {
            userJobBoardMessage.textContent = jobs.length === 0 ? 'Henüz yayınlanmış iş ilanı yok.' : '';
            userJobBoardMessage.classList.remove('error');
        }
    } catch {
        jobBoardGrid.innerHTML = '';
        if (userJobBoardMessage) {
            userJobBoardMessage.textContent = 'İş ilanları yüklenemedi.';
            userJobBoardMessage.classList.add('error');
        }
    }
}

function jobRowHtml(job) {
    const priorityClass = getPriorityClass(job.priority || 'Düşük');
    const activeLabel = job.isActive === false ? 'Pasif' : 'Aktif';
    const activeClass = job.isActive === false ? 'status-rejected' : 'status-review';
    return `
        <tr data-job-id="${String(job._id || '')}">
            <td>
                <div class="company-cell">
                    <span class="company-name">${job.company || '—'}</span>
                    <span class="company-role">${job.role || '—'}</span>
                </div>
                ${job.summary ? `<div class="date-muted" style="margin-top:6px;">${job.summary}</div>` : ''}
            </td>
            <td><span class="tag-pill">${job.location || 'Bilinmiyor'}</span></td>
            <td><span class="tag-pill">${job.jobType || 'Belirtilmedi'}</span></td>
            <td><span class="priority-pill ${priorityClass}">${job.priority || 'Düşük'}</span></td>
            <td><span class="status-chip ${activeClass}"><span></span> ${activeLabel}</span></td>
            <td>
                <button type="button" class="btn-row-delete admin-job-delete-btn" title="Sil">Sil</button>
            </td>
        </tr>
    `;
}

async function syncJobsToAdminTable() {
    const sess = getSession();
    if (!sess || sess.role !== 'admin') return;
    if (!adminJobsTableBody || !adminJobsEmpty) return;
    try {
        const jobs = await fetchJobs();
        adminJobsTableBody.innerHTML = jobs.map(jobRowHtml).join('');
        adminJobsEmpty.style.display = jobs.length === 0 ? 'block' : 'none';
    } catch {
        adminJobsTableBody.innerHTML = '';
        adminJobsEmpty.style.display = 'block';
    }
}

function refreshUserJobBoardButtons() {
    const sess = getSession();
    if (!sess || sess.role !== 'user' || !userJobBoard) return;
    apiFetch('/api/applications')
        .then((data) => {
            const items = Array.isArray(data?.items) ? data.items : [];
            const appliedMap = new Set(items.map((item) => `${item.company}__${item.role}`));
            userJobBoard.querySelectorAll('.job-apply-btn').forEach((btn) => {
                const key = `${btn.dataset.company || ''}__${btn.dataset.role || ''}`;
                const isApplied = appliedMap.has(key);
                btn.textContent = isApplied ? 'Başvuruldu' : 'Başvur';
                btn.disabled = isApplied;
            });
        })
        .catch(() => {
            userJobBoard.querySelectorAll('.job-apply-btn').forEach((btn) => {
                btn.textContent = 'Başvur';
                btn.disabled = false;
            });
        });
}

if (adminJobCreateForm) {
    adminJobCreateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (getSession()?.role !== 'admin') return;
        showAdminJobsMessage('', '');

        const company = document.getElementById('jobCompany').value.trim();
        const role = document.getElementById('jobRole').value.trim();
        const location = document.getElementById('jobLocation').value.trim() || 'Bilinmiyor';
        const jobType = document.getElementById('jobType2').value.trim() || 'Belirtilmedi';
        const priority = document.getElementById('jobPriority').value || 'Düşük';
        const summary = document.getElementById('jobSummary').value.trim() || '';
        if (!company || !role) return;

        apiFetch('/api/jobs', {
            method: 'POST',
            body: JSON.stringify({ company, role, location, jobType, priority, summary, isActive: true }),
        })
            .then(() => {
                adminJobCreateForm.reset();
                showAdminJobsMessage('İlan eklendi.', 'success');
                syncJobsToAdminTable().catch(() => {});
            })
            .catch((err) => {
                if (err?.error === 'DUPLICATE_JOB') {
                    showAdminJobsMessage('Bu ilan zaten mevcut.', 'error');
                    return;
                }
                showAdminJobsMessage('İlan eklenemedi.', 'error');
            });
    });
}

if (adminJobsTableBody) {
    adminJobsTableBody.addEventListener('click', (ev) => {
        const btn = ev.target.closest('.admin-job-delete-btn');
        if (!btn) return;
        if (getSession()?.role !== 'admin') return;
        const tr = btn.closest('tr');
        const id = tr?.dataset.jobId || '';
        if (!id) return;
        apiFetch(`/api/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' })
            .then((r) => {
                if (!r?.ok) throw new Error('delete failed');
                tr.remove();
                showAdminJobsMessage('İlan silindi.', 'success');
                if (adminJobsTableBody.children.length === 0 && adminJobsEmpty) {
                    adminJobsEmpty.style.display = 'block';
                }
            })
            .catch(() => showAdminJobsMessage('İlan silinemedi.', 'error'));
    });
}

if (newAppBtn && formCard) {
    newAppBtn.addEventListener('click', () => {
        if (getSession()?.role !== 'user') return;
        formCard.classList.toggle('visible');
    });
}

if (cancelFormBtn && formCard && applicationForm) {
    cancelFormBtn.addEventListener('click', () => {
        formCard.classList.remove('visible');
        applicationForm.reset();
    });
}

if (applicationForm && tbody) {
    applicationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (getSession()?.role !== 'user') return;

        const company = document.getElementById('company').value.trim();
        const role = document.getElementById('role').value.trim();
        const status = document.getElementById('status').value;
        const priority = document.getElementById('priority').value;
        const location = document.getElementById('location').value.trim() || 'Bilinmiyor';
        const jobType = document.getElementById('jobType').value.trim() || 'Belirtilmedi';
        const appliedAt = document.getElementById('appliedAt').value || '';
        const updatedAt = document.getElementById('updatedAt').value || '';
        const notes = document.getElementById('notes').value.trim() || '-';

        if (!company || !role) return;

        apiFetch('/api/applications', {
            method: 'POST',
            body: JSON.stringify({ company, role, status, priority, location, jobType, appliedAt, updatedAt, notes }),
        })
            .then(() => {
                sessionStorage.setItem('bt_apply_success', `${company} - ${role} başvurunuz kaydedildi.`);
            })
            .catch(() => {});

        applicationForm.reset();
        formCard.classList.remove('visible');
    });
}

if (userJobBoard) {
    userJobBoard.addEventListener('click', (ev) => {
        const btn = ev.target.closest('.job-apply-btn');
        if (!btn) return;
        const sess = getSession();
        if (!sess || sess.role !== 'user') return;

        const company = btn.dataset.company || '';
        const role = btn.dataset.role || '';
        const params = new URLSearchParams({
            company,
            role,
            location: btn.dataset.location || 'Bilinmiyor',
            jobType: btn.dataset.jobType || 'Belirtilmedi',
            priority: btn.dataset.priority || 'Düşük',
        });
        window.location.href = `job-detail.html?${params.toString()}`;
    });
}

if (tbody) {
    tbody.addEventListener('click', (ev) => {
        const btn = ev.target.closest('.btn-row-delete');
        if (!btn) return;
        if (getSession()?.role !== 'admin') return;
        const tr = btn.closest('tr');
        if (tr) {
            const id = tr.dataset.appId || '';
            if (id) {
                apiFetch(`/api/applications/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
            }
            tr.remove();
        }
        applyFilters();
        populateAdminPanelPage();
    });
}

if (adminPanelUserTableBody) {
    adminPanelUserTableBody.addEventListener('click', (ev) => {
        const btn = ev.target.closest('.admin-user-delete-btn');
        if (!btn) return;
        if (getSession()?.role !== 'admin') return;
        const email = btn.dataset.email || '';
        removeUser(email)
            .then((ok) => {
                if (!ok) {
                    showAdminActionMessage('Kullanıcı silinemedi.', 'error');
                    return;
                }
                refreshAdminUserList();
                syncDbApplicationsToTable().catch(() => {});
                populateAdminPanelPage();
                showAdminActionMessage(`${email} silindi.`, 'success');
            })
            .catch(() => showAdminActionMessage('Kullanıcı silinemedi.', 'error'));
    });
}

if (adminClearAppsBtn) {
    adminClearAppsBtn.addEventListener('click', () => {
        if (getSession()?.role !== 'admin') return;
        apiFetch('/api/applications', { method: 'DELETE' }).catch(() => {});
        getRows().forEach((row) => row.remove());
        applyFilters();
        populateAdminPanelPage();
        showAdminActionMessage('Tüm başvurular temizlendi.', 'success');
    });
}

if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = 'admin@gmail.com';
        const password = document.getElementById('adminPassword').value;
        tryLoginApi(email, password)
            .then(() => {
                sessionStorage.setItem(STORAGE_LAST_LOGIN, new Date().toISOString());
                showAuthMessage('', false);
                showAppView();
                showMainListView();
                applyRoleUI();
                syncDbApplicationsToTable().catch(() => {});
            })
            .catch((err) => {
                if (err?.status === 401) {
                    showAuthMessage('E-posta veya şifre hatalı.', false);
                    return;
                }
                showAuthMessage('Sunucuya bağlanılamadı veya veritabanı hazır değil.', false);
            });
    });
}

if (userLoginForm) {
    userLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        tryLoginApi(email, password)
            .then(() => {
                sessionStorage.setItem(STORAGE_LAST_LOGIN, new Date().toISOString());
                showAuthMessage('', false);
                showAppView();
                showMainListView();
                applyRoleUI();
            })
            .catch((err) => {
                if (err?.status === 401) {
                    showAuthMessage('E-posta veya şifre hatalı.', false);
                    return;
                }
                showAuthMessage('Sunucuya bağlanılamadı veya veritabanı hazır değil.', false);
            });
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const password2 = document.getElementById('regPassword2').value;
        tryRegisterApi(email, password, password2)
            .then((r) => {
                showAuthMessage(r.message || 'Kayıt tamam.', true);
                registerForm.reset();
                if (userLoginForm) userLoginForm.classList.remove('hidden');
                if (registerBlock) registerBlock.classList.add('hidden');
                if (toggleRegisterBtn) toggleRegisterBtn.textContent = 'Kullanıcı kaydı';
                document.getElementById('loginEmail').value = email.trim().toLowerCase();
            })
            .catch((err) => {
                const code = err?.error;
                if (code === 'EMAIL_EXISTS') showAuthMessage('Bu e-posta zaten kayıtlı.', false);
                else if (code === 'EMAIL_RESERVED') showAuthMessage('Bu e-posta yönetici hesabı için ayrılmıştır.', false);
                else if (code === 'PASSWORD_MISMATCH') showAuthMessage('Şifreler eşleşmiyor.', false);
                else showAuthMessage('Kayıt başarısız.', false);
            });
    });
}

if (toggleRegisterBtn && userLoginForm && registerBlock) {
    toggleRegisterBtn.addEventListener('click', () => {
        const showingRegister = !registerBlock.classList.contains('hidden');
        if (showingRegister) {
            registerBlock.classList.add('hidden');
            userLoginForm.classList.remove('hidden');
            toggleRegisterBtn.textContent = 'Kullanıcı kaydı';
        } else {
            registerBlock.classList.remove('hidden');
            userLoginForm.classList.add('hidden');
            toggleRegisterBtn.textContent = 'Girişe dön';
        }
        showAuthMessage('', false);
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

if (panelTag) {
    panelTag.addEventListener('click', () => {
        const s = getSession();
        if (!s) return;
        if (s.role === 'user') {
            openUserPanel();
        } else if (s.role === 'admin') {
            openAdminPanel();
        }
    });
}

if (backToListFromUserBtn) {
    backToListFromUserBtn.addEventListener('click', showMainListView);
}

if (backToListFromAdminBtn) {
    backToListFromAdminBtn.addEventListener('click', showMainListView);
}

(function initAuth() {
    const token = getToken();
    if (!token) {
        showAuthView();
        return;
    }
    apiFetch('/api/auth/me')
        .then((data) => {
            if (!data?.session) throw new Error('no session');
            setSession({
                email: data.session.email,
                role: data.session.role,
                registeredAt: data.session.registeredAt,
            });
            showAppView();
            showMainListView();
            applyRoleUI();
            if (data.session.role === 'admin') {
                syncDbApplicationsToTable().catch(() => {});
            }
        })
        .catch(() => {
            clearToken();
            clearSession();
            showAuthView();
        });
})();
