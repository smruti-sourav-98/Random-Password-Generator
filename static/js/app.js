// ===== Variables =====
let currentPasswordRandom = '';
let currentPasswordCustom = '';
let currentMethod = 'random';

// ===== DOM Elements =====
// Random method elements
const generateRandomBtn = document.getElementById('generateRandomBtn');
const randomLength = document.getElementById('randomLength');
const resultAreaRandom = document.getElementById('resultAreaRandom');
const generatedPasswordRandom = document.getElementById('generatedPasswordRandom');
const strengthBadgeRandom = document.getElementById('strengthBadgeRandom');
const usedForInputRandom = document.getElementById('usedForInputRandom');
const saveBtnRandom = document.getElementById('saveBtnRandom');
const saveMessageRandom = document.getElementById('saveMessageRandom');

// Custom method elements
const generateCustomBtn = document.getElementById('generateCustomBtn');
const nameInput = document.getElementById('nameInput');
const symbolInput = document.getElementById('symbolInput');
const numberInput = document.getElementById('numberInput');
const resultAreaCustom = document.getElementById('resultAreaCustom');
const generatedPasswordCustom = document.getElementById('generatedPasswordCustom');
const strengthBadgeCustom = document.getElementById('strengthBadgeCustom');
const usedForInputCustom = document.getElementById('usedForInputCustom');
const saveBtnCustom = document.getElementById('saveBtnCustom');
const saveMessageCustom = document.getElementById('saveMessageCustom');

const passwordList = document.getElementById('passwordList');

// ===== Switch Method =====
function switchMethod(method) {
    currentMethod = method;
    
    document.querySelectorAll('.method-btn').forEach(btn => btn.classList.remove('active'));
    if (method === 'random') {
        document.getElementById('methodRandom').classList.add('active');
        document.getElementById('panelRandom').classList.add('active');
        document.getElementById('panelCustom').classList.remove('active');
    } else {
        document.getElementById('methodCustom').classList.add('active');
        document.getElementById('panelCustom').classList.add('active');
        document.getElementById('panelRandom').classList.remove('active');
    }
}

// ===== Generate Random Password =====
if (generateRandomBtn) {
    generateRandomBtn.addEventListener('click', async () => {
        const length = parseInt(randomLength.value) || 12;
        
        if (length < 8 || length > 32) {
            showMessage('Please enter a length between 8 and 32', 'error', saveMessageRandom);
            return;
        }

        generateRandomBtn.disabled = true;
        generateRandomBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

        try {
            const response = await fetch('/generate/random', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ length })
            });
            const data = await response.json();

            if (data.success) {
                currentPasswordRandom = data.password;
                generatedPasswordRandom.textContent = currentPasswordRandom;
                strengthBadgeRandom.textContent = data.strength_label;
                strengthBadgeRandom.className = 'strength-badge ' + data.strength_class;
                resultAreaRandom.classList.add('show');
                hideMessage(saveMessageRandom);
            }
        } catch (error) {
            showMessage('Failed to generate password.', 'error', saveMessageRandom);
        } finally {
            generateRandomBtn.disabled = false;
            generateRandomBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Generate Random Password';
        }
    });
}

// ===== Generate Custom Password =====
if (generateCustomBtn) {
    generateCustomBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim() || 'User';
        const symbol = symbolInput.value.trim() || '@';
        const number = numberInput.value.trim() || '2024';

        generateCustomBtn.disabled = true;
        generateCustomBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

        try {
            const response = await fetch('/generate/custom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, symbol, number })
            });
            const data = await response.json();

            if (data.success) {
                currentPasswordCustom = data.password;
                generatedPasswordCustom.textContent = currentPasswordCustom;
                strengthBadgeCustom.textContent = data.strength_label;
                strengthBadgeCustom.className = 'strength-badge ' + data.strength_class;
                resultAreaCustom.classList.add('show');
                hideMessage(saveMessageCustom);
            }
        } catch (error) {
            showMessage('Failed to create password.', 'error', saveMessageCustom);
        } finally {
            generateCustomBtn.disabled = false;
            generateCustomBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Create Custom Password';
        }
    });
}

// ===== Copy Password =====
document.addEventListener('click', async (e) => {
    const copyBtn = e.target.closest('.copy-btn');
    if (!copyBtn) return;
    
    const targetId = copyBtn.dataset.target;
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;
    
    const password = targetElement.textContent;
    if (!password || password.includes('Generate')) return;
    
    try {
        await navigator.clipboard.writeText(password);
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => { copyBtn.innerHTML = originalHTML; }, 1500);
        
        const messageDiv = targetId.includes('Random') ? saveMessageRandom : saveMessageCustom;
        showMessage('✓ Password copied!', 'success', messageDiv);
    } catch (error) {
        fallbackCopy(password);
    }
});

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showMessage('✓ Password copied!', 'success', saveMessageRandom);
    } catch (err) {
        showMessage('Failed to copy.', 'error', saveMessageRandom);
    }
    document.body.removeChild(textarea);
}

// ===== Save Password =====
function setupSaveButton(btn, messageDiv, usedForInput, method) {
    if (!btn) return;
    btn.addEventListener('click', async () => {
        const usedFor = usedForInput.value.trim();
        
        if (!usedFor) {
            showMessage('⚠️ Please specify where to use this password', 'error', messageDiv);
            usedForInput.focus();
            return;
        }

        let password;
        if (method === 'random') {
            password = currentPasswordRandom;
        } else {
            password = currentPasswordCustom;
        }

        if (!password) {
            showMessage('⚠️ Generate a password first', 'error', messageDiv);
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            const response = await fetch('/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, used_for: usedFor, method })
            });
            const data = await response.json();

            if (data.success) {
                showMessage('✓ Password saved successfully!', 'success', messageDiv);
                usedForInput.value = '';
                addPasswordToList(data.entry);
                updateStats();
                
                if (method === 'random') {
                    resultAreaRandom.classList.remove('show');
                    currentPasswordRandom = '';
                } else {
                    resultAreaCustom.classList.remove('show');
                    currentPasswordCustom = '';
                }
            } else {
                showMessage(data.message || 'Failed to save', 'error', messageDiv);
            }
        } catch (error) {
            showMessage('Network error.', 'error', messageDiv);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-database"></i> Save to Vault';
        }
    });
}

setupSaveButton(saveBtnRandom, saveMessageRandom, usedForInputRandom, 'random');
setupSaveButton(saveBtnCustom, saveMessageCustom, usedForInputCustom, 'custom');

// ===== Add Password to List =====
function addPasswordToList(entry) {
    const emptyState = passwordList.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const item = document.createElement('div');
    item.className = 'password-item';
    item.dataset.id = entry.id;
    const methodBadge = entry.method === 'random' ? '🤖 Auto' : '✏️ Manual';
    const methodClass = entry.method === 'random' ? 'random' : 'custom';
    item.innerHTML = `
        <div class="pwd-value">
            <span>${escapeHtml(entry.password)}</span>
            <div class="pwd-actions">
                <button class="btn-sm btn-sm-copy copy-history" data-password="${escapeHtml(entry.password)}">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="btn-sm btn-sm-delete delete-pwd" data-id="${entry.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
        <div class="pwd-meta">
            <span><i class="fas fa-tag"></i> ${escapeHtml(entry.used_for)}</span>
            <span class="strength-badge ${entry.strength_class}">${entry.strength_label}</span>
            <span><i class="fas fa-calendar"></i> ${entry.created_at}</span>
            <span class="method-badge ${methodClass}">${methodBadge}</span>
        </div>
    `;

    passwordList.insertBefore(item, passwordList.firstChild);

    // Copy history button
    item.querySelector('.copy-history').addEventListener('click', async (e) => {
        e.stopPropagation();
        const pwd = e.currentTarget.dataset.password;
        await navigator.clipboard.writeText(pwd);
        showMessage('✓ Password copied!', 'success', saveMessageRandom);
    });

    // Delete button
    item.querySelector('.delete-pwd').addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        if (!confirm('Delete this password?')) return;
        
        try {
            const response = await fetch(`/delete/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                item.style.transform = 'translateX(-100%)';
                item.style.opacity = '0';
                setTimeout(() => {
                    item.remove();
                    updateStats();
                    if (passwordList.children.length === 0) {
                        passwordList.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-lock"></i>
                                <p>No passwords saved yet</p>
                                <p class="sub">Generate and save your first password</p>
                            </div>
                        `;
                    }
                }, 300);
                showMessage('✓ Password deleted', 'success', saveMessageRandom);
            }
        } catch (error) {
            showMessage('Failed to delete', 'error', saveMessageRandom);
        }
    });
}

// ===== Update Stats =====
function updateStats() {
    const items = passwordList.querySelectorAll('.password-item');
    let total = items.length;
    let strong = 0;
    items.forEach(item => {
        if (item.querySelector('.strength-badge.strong')) strong++;
    });
    document.getElementById('totalPasswords').textContent = total;
    document.getElementById('strongPasswords').textContent = strong;
}

// ===== Message System =====
function showMessage(text, type = 'info', messageDiv) {
    if (!messageDiv) return;
    messageDiv.textContent = text;
    messageDiv.className = 'message show ' + type;
    setTimeout(() => hideMessage(messageDiv), 4000);
}

function hideMessage(messageDiv) {
    if (!messageDiv) return;
    messageDiv.textContent = '';
    messageDiv.className = 'message';
}

// ===== Utility =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Floating Particles =====
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 5 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = Math.random() * 20 + 10 + 's';
        container.appendChild(particle);
    }
}
createParticles();

// ===== Enter Key Support =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const active = document.activeElement;
        if (active) {
            if (active.id === 'randomLength' && generateRandomBtn) {
                generateRandomBtn.click();
            } else if (['nameInput', 'symbolInput', 'numberInput'].includes(active.id) && generateCustomBtn) {
                generateCustomBtn.click();
            } else if (active.id === 'usedForInputRandom' && saveBtnRandom) {
                saveBtnRandom.click();
            } else if (active.id === 'usedForInputCustom' && saveBtnCustom) {
                saveBtnCustom.click();
            }
        }
    }
});

console.log('🔐 SecurePass loaded successfully!');
console.log('📌 Two Methods Available:');
console.log('   🤖 Auto Generate - Random strong passwords');
console.log('   ✏️ Manual Create - Personalized passwords');
console.log('🔒 Remember: Always keep your device locked with App Lock!');