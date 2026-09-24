// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');
    const logoutBtn = document.getElementById('logoutBtn');

    // Basic session check
    let userStr = null;
    try {
        userStr = localStorage.getItem('cobranca_user');
    } catch (e) {
        console.warn('LocalStorage indisponível', e);
    }
    
    const isDashboard = window.location.pathname.includes('dashboard.html');
    const isLogin = window.location.pathname.includes('login.html');

    if (isDashboard && !userStr) {
        window.location.href = 'login.html';
    }
    
    if (isLogin && userStr) {
        window.location.href = 'dashboard.html';
    }

    // Inactivity timeout (10 minutes)
    if (isDashboard && userStr) {
        const setupInactivityTimer = () => {
            let timeout;
            const performLogout = async () => {
                try {
                    // S8: logout via POST + CSRF (GET antigo ainda funciona por compatibilidade)
                    await fetch('api/auth.php?action=logout', {
                        method: 'POST',
                        headers: { 'X-CSRF-Token': localStorage.getItem('cobranca_csrf') || '' }
                    });
                } catch(e) {}
                localStorage.removeItem('cobranca_user');
                localStorage.removeItem('cobranca_csrf');
                alert('Sua sessão expirou devido a 10 minutos de inatividade.');
                window.location.href = 'login.html';
            };

            const resetTimer = () => {
                clearTimeout(timeout);
                timeout = setTimeout(performLogout, 10 * 60 * 1000); // 10 minutes
            };

            window.onload = resetTimer;
            document.onmousemove = resetTimer;
            document.onkeypress = resetTimer;
            document.onclick = resetTimer;
            document.onscroll = resetTimer;
            
            resetTimer();
        };
        setupInactivityTimer();
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Trava o botão durante o envio (evita duplo clique)
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('btn-loading');
                submitBtn.innerHTML = '<span class="spin">↻</span> Entrando...';
            }

            loginMessage.className = 'message-box';
            loginMessage.style.display = 'block';
            loginMessage.textContent = 'Autenticando...';
            loginMessage.style.color = 'var(--text-muted)';
            
            try {
                const formData = new FormData();
                formData.append('email', email);
                formData.append('password', password);
                
                const res = await fetch('api/auth.php?action=login', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await res.json();
                if(data.success) {
                    localStorage.setItem('cobranca_user', JSON.stringify(data.user));
                    if (data.csrf_token) {
                        localStorage.setItem('cobranca_csrf', data.csrf_token);
                    }
                    window.location.href = 'dashboard.html';
                } else {
                    loginMessage.textContent = data.error || data.message || 'Erro no login.';
                    loginMessage.style.color = '#ef4444';
                }
            } catch (err) {
                loginMessage.textContent = 'Erro ao conectar ao servidor.';
                loginMessage.style.color = '#ef4444';
            } finally {
                // Sempre destrava no final (no sucesso a página redireciona antes)
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('btn-loading');
                    submitBtn.innerHTML = originalBtnHtml;
                }
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('api/auth.php?action=logout', {
                    method: 'POST',
                    headers: { 'X-CSRF-Token': localStorage.getItem('cobranca_csrf') || '' }
                });
            } catch(e) {
                console.warn('Backend logout failed', e);
            }
            localStorage.removeItem('cobranca_user');
            localStorage.removeItem('cobranca_csrf');
            window.location.href = 'login.html';
        });
    }
});
