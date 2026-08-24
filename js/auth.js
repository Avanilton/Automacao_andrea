// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');
    const logoutBtn = document.getElementById('logoutBtn');

    // Basic session check
    const userStr = localStorage.getItem('cobranca_user');
    const isDashboard = window.location.pathname.includes('dashboard.html');
    const isLogin = window.location.pathname.includes('login.html');

    if (isDashboard && !userStr) {
        window.location.href = 'login.html';
    }
    
    if (isLogin && userStr) {
        window.location.href = 'dashboard.html';
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
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
                    window.location.href = 'dashboard.html';
                } else {
                    loginMessage.textContent = data.error || data.message || 'Erro no login.';
                    loginMessage.style.color = '#ef4444';
                }
            } catch (err) {
                loginMessage.textContent = 'Erro ao conectar ao servidor.';
                loginMessage.style.color = '#ef4444';
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Em produção: fetch('api/auth.php?action=logout')
            localStorage.removeItem('cobranca_user');
            window.location.href = 'login.html';
        });
    }
});
