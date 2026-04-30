const STORAGE_SESSION = 'bt_session';
const STORAGE_TOKEN = 'bt_token';
const STORAGE_APPLY_SUCCESS = 'bt_apply_success';

function getApiBase() {
    try {
        const { protocol, port } = window.location;
        if (protocol === 'file:' || port === '5501') return 'http://localhost:3000';
        return '';
    } catch {
        return 'http://localhost:3000';
    }
}

const API_BASE = getApiBase();

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

function getToken() {
    return localStorage.getItem(STORAGE_TOKEN) || '';
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

const params = new URLSearchParams(window.location.search);
const payload = {
    company: params.get('company') || '',
    role: params.get('role') || '',
    location: params.get('location') || 'Bilinmiyor',
    jobType: params.get('jobType') || 'Belirtilmedi',
    priority: params.get('priority') || 'Düşük',
};

const detailCompany = document.getElementById('detailCompany');
const detailRole = document.getElementById('detailRole');
const detailLocation = document.getElementById('detailLocation');
const detailJobType = document.getElementById('detailJobType');
const detailPriority = document.getElementById('detailPriority');
const jobDetailForm = document.getElementById('jobDetailForm');
const backHomeBtn = document.getElementById('backHomeBtn');
const jobDetailMessage = document.getElementById('jobDetailMessage');

function goHome() {
    window.location.href = 'index.html';
}

const session = getSession();
if (!session || session.role !== 'user' || !payload.company || !payload.role) {
    goHome();
}

if (detailCompany) detailCompany.textContent = payload.company;
if (detailRole) detailRole.textContent = payload.role;
if (detailLocation) detailLocation.textContent = payload.location;
if (detailJobType) detailJobType.textContent = payload.jobType;
if (detailPriority) detailPriority.textContent = payload.priority;

if (backHomeBtn) {
    backHomeBtn.addEventListener('click', goHome);
}

if (jobDetailForm) {
    jobDetailForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const applicantName = (document.getElementById('candidateName')?.value || '').trim();
        const applicantPhone = (document.getElementById('candidatePhone')?.value || '').trim();
        const applicantLinkedIn = (document.getElementById('candidateLinkedIn')?.value || '').trim();
        const applicantCvUrl = (document.getElementById('candidateCvUrl')?.value || '').trim();
        const noteValue = (document.getElementById('candidateNote')?.value || '').trim();
        const today = new Date().toISOString().slice(0, 10);

        if (!applicantName || !applicantPhone) {
            if (jobDetailMessage) {
                jobDetailMessage.textContent = 'Lütfen ad soyad ve telefon alanlarını doldurun.';
                jobDetailMessage.classList.remove('success');
                jobDetailMessage.classList.add('error');
            }
            return;
        }

        apiFetch('/api/applications', {
            method: 'POST',
            body: JSON.stringify({
                company: payload.company,
                role: payload.role,
                applicantName,
                applicantPhone,
                applicantLinkedIn,
                applicantCvUrl,
                status: 'Başvuruldu',
                priority: payload.priority,
                location: payload.location,
                jobType: payload.jobType,
                appliedAt: today,
                updatedAt: today,
                notes: noteValue || 'Detay sayfası üzerinden başvuruldu.',
            }),
        })
            .then(() => {
                sessionStorage.setItem(
                    STORAGE_APPLY_SUCCESS,
                    `${payload.company} - ${payload.role} başvurunuz onaylandı.`,
                );
                goHome();
            })
            .catch(() => {
                if (jobDetailMessage) {
                    jobDetailMessage.textContent = 'Başvuru kaydedilemedi (daha önce başvurduysanız tekrar edemezsiniz).';
                    jobDetailMessage.classList.remove('success');
                    jobDetailMessage.classList.add('error');
                }
            });
    });
}
