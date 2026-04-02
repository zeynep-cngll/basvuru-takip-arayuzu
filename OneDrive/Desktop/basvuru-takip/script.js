/** Yönetici girişi — şifreyi buradan değiştirin (üretimde sunucu tarafı doğrulama kullanın). */
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'Deneme123';

const STORAGE_SESSION = 'bt_session';
const STORAGE_USERS = 'bt_users';
const STORAGE_LAST_LOGIN = 'bt_last_login';

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

const searchInput = document.getElementById('searchInput');
const statusPills = document.querySelectorAll('.status-pill');
const prioritySelect = document.getElementById('prioritySelect');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const tabs = document.querySelectorAll('.tab');

let activeStatus = 'Tümü';
let activeTab = 'tum';

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

function getUsers() {
    try {
        const raw = localStorage.getItem(STORAGE_USERS);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function getUserByEmail(email) {
    const e = (email || '').trim().toLowerCase();
    return getUsers().find((u) => u.email === e) || null;
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

    const rec = getUserByEmail(s.email);
    if (regEl) {
        regEl.textContent = rec?.registeredAt ? formatDateTr(rec.registeredAt) : '—';
    }

    if (loginEl) {
        const last = sessionStorage.getItem(STORAGE_LAST_LOGIN);
        loginEl.textContent = last ? formatDateTimeTr(last) : '—';
    }

    let own = 0;
    getRows().forEach((row) => {
        if (row.dataset.ownerEmail === s.email) own += 1;
    });
    if (ownEl) ownEl.textContent = String(own);
    if (totalEl) totalEl.textContent = String(getRows().length);
}

function countOwnedApplications(email) {
    if (!email) return 0;
    let count = 0;
    getRows().forEach((row) => {
        if (row.dataset.ownerEmail === email) count += 1;
    });
    return count;
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
    if (ucEl) ucEl.textContent = String(getUsers().length);
    if (rcEl) rcEl.textContent = String(getRows().length);

    const users = getUsers();
    if (adminPanelUserTableBody) adminPanelUserTableBody.innerHTML = '';
    if (users.length === 0) {
        if (adminPanelUserListEmpty) adminPanelUserListEmpty.style.display = 'block';
    } else {
        if (adminPanelUserListEmpty) adminPanelUserListEmpty.style.display = 'none';
        if (adminPanelUserTableBody) {
            users.forEach((u) => {
                const tr = document.createElement('tr');
                const reg = u.registeredAt ? formatDateTr(u.registeredAt) : '—';
                const appCount = countOwnedApplications(u.email);
                tr.innerHTML = `
                    <td>${u.email}</td>
                    <td>${reg}</td>
                    <td>${appCount}</td>
                    <td><button type="button" class="admin-user-delete-btn" data-email="${u.email}">Kullanıcıyı sil</button></td>
                `;
                adminPanelUserTableBody.appendChild(tr);
            });
        }
    }
}

function removeUserAndRows(email) {
    const e = (email || '').trim().toLowerCase();
    if (!e || e === ADMIN_EMAIL.toLowerCase()) return false;
    const users = getUsers();
    const next = users.filter((u) => u.email !== e);
    if (next.length === users.length) return false;
    saveUsers(next);

    getRows().forEach((row) => {
        if (row.dataset.ownerEmail === e) row.remove();
    });
    return true;
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

    if (session.role === 'admin') {
        refreshAdminUserList();
    }
}

function refreshAdminUserList() {
    if (!adminUserList || !adminUserEmpty) return;
    const users = getUsers();
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
}

function tryLogin(email, password) {
    const e = (email || '').trim().toLowerCase();
    const p = password || '';

    if (e === ADMIN_EMAIL.toLowerCase()) {
        if (p === ADMIN_PASSWORD) {
            setSession({ email: ADMIN_EMAIL, role: 'admin' });
            return { ok: true };
        }
        return { ok: false, message: 'E-posta veya şifre hatalı.' };
    }

    const users = getUsers();
    const found = users.find((u) => u.email === e && u.password === p);
    if (found) {
        setSession({ email: e, role: 'user' });
        return { ok: true };
    }
    return { ok: false, message: 'E-posta veya şifre hatalı.' };
}

function tryAdminLogin(password) {
    const p = password || '';
    if (p === ADMIN_PASSWORD) {
        setSession({ email: ADMIN_EMAIL, role: 'admin' });
        return { ok: true };
    }
    return { ok: false, message: 'Admin şifresi hatalı.' };
}

function tryRegister(email, password, password2) {
    const e = (email || '').trim().toLowerCase();
    if (e === ADMIN_EMAIL.toLowerCase()) {
        return { ok: false, message: 'Bu e-posta yönetici hesabı için ayrılmıştır.' };
    }
    if (password !== password2) {
        return { ok: false, message: 'Şifreler eşleşmiyor.' };
    }
    const users = getUsers();
    if (users.some((u) => u.email === e)) {
        return { ok: false, message: 'Bu e-posta zaten kayıtlı.' };
    }
    users.push({
        email: e,
        password,
        registeredAt: new Date().toISOString(),
    });
    saveUsers(users);
    return { ok: true, message: 'Kayıt tamam. Giriş yapabilirsiniz.' };
}

function logout() {
    clearSession();
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

const tbody = document.querySelector('tbody');

const newAppBtn = document.getElementById('newAppBtn');
const formCard = document.getElementById('newAppForm');
const applicationForm = document.getElementById('applicationForm');
const cancelFormBtn = document.getElementById('cancelFormBtn');

function adminDeleteCellHtml() {
    return `<td class="col-admin-only"><button type="button" class="btn-row-delete" title="Sil">Sil</button></td>`;
}

if (newAppBtn && formCard) {
    newAppBtn.addEventListener('click', () => {
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

        let statusClass = 'status-applied';
        if (status.includes('İncelemede')) statusClass = 'status-review';
        if (status.includes('Mülakat')) statusClass = 'status-interview';
        if (status.includes('Teklif')) statusClass = 'status-offer';
        if (status.includes('Olumsuz')) statusClass = 'status-rejected';

        let priorityClass = '';
        if (priority === 'Yüksek') priorityClass = 'priority-high';
        else if (priority === 'Orta') priorityClass = 'priority-medium';

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
                    <span></span> ${status}
                </span>
            </td>
            <td>
                <span class="priority-pill ${priorityClass}">${priority}</span>
            </td>
            <td>
                <span class="tag-pill">${location}</span>
                <span class="tag-pill">${jobType}</span>
            </td>
            <td><span class="date-muted">${appliedAt || '-'}</span></td>
            <td><span class="date-muted">${updatedAt || '-'}</span></td>
            <td class="notes">${notes}</td>
            ${adminDeleteCellHtml()}
        `;

        const sess = getSession();
        if (sess?.role === 'user' && sess.email) {
            tr.dataset.ownerEmail = sess.email;
        }

        tbody.appendChild(tr);

        applicationForm.reset();
        formCard.classList.remove('visible');

        applyFilters();
    });
}

if (tbody) {
    tbody.addEventListener('click', (ev) => {
        const btn = ev.target.closest('.btn-row-delete');
        if (!btn) return;
        if (getSession()?.role !== 'admin') return;
        const tr = btn.closest('tr');
        if (tr) tr.remove();
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
        const ok = removeUserAndRows(email);
        if (!ok) {
            showAdminActionMessage('Kullanıcı silinemedi.', 'error');
            return;
        }
        refreshAdminUserList();
        populateAdminPanelPage();
        showAdminActionMessage(`${email} silindi.`, 'success');
    });
}

if (adminClearAppsBtn) {
    adminClearAppsBtn.addEventListener('click', () => {
        if (getSession()?.role !== 'admin') return;
        getRows().forEach((row) => row.remove());
        applyFilters();
        populateAdminPanelPage();
        showAdminActionMessage('Tüm başvurular temizlendi.', 'success');
    });
}

if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('adminPassword').value;
        const r = tryAdminLogin(password);
        if (r.ok) {
            sessionStorage.setItem(STORAGE_LAST_LOGIN, new Date().toISOString());
            showAuthMessage('', false);
            showAppView();
            showMainListView();
            applyRoleUI();
        } else {
            showAuthMessage(r.message || 'Giriş başarısız.', false);
        }
    });
}

if (userLoginForm) {
    userLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const r = tryLogin(email, password);
        if (r.ok) {
            sessionStorage.setItem(STORAGE_LAST_LOGIN, new Date().toISOString());
            showAuthMessage('', false);
            showAppView();
            showMainListView();
            applyRoleUI();
        } else {
            showAuthMessage(r.message || 'Giriş başarısız.', false);
        }
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const password2 = document.getElementById('regPassword2').value;
        const r = tryRegister(email, password, password2);
        showAuthMessage(r.message || (r.ok ? 'Tamam.' : 'Hata.'), r.ok);
        if (r.ok) {
            registerForm.reset();
            if (userLoginForm) userLoginForm.classList.remove('hidden');
            if (registerBlock) registerBlock.classList.add('hidden');
            if (toggleRegisterBtn) toggleRegisterBtn.textContent = 'Kullanıcı kaydı';
            document.getElementById('loginEmail').value = email.trim().toLowerCase();
        }
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
    const s = getSession();
    if (s) {
        showAppView();
        showMainListView();
        applyRoleUI();
    } else {
        showAuthView();
    }
})();
