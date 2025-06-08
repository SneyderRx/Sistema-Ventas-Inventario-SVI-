document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const apiUrl = 'http://localhost:3000/api/auth/login';

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';

        // Leemos el valor del nuevo campo genérico
        const loginIdentifier = document.getElementById('loginIdentifier').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // Enviamos el objeto con la clave 'loginIdentifier'
                body: JSON.stringify({ loginIdentifier, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al iniciar sesión');
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);
            window.location.href = 'inventario.html';

        } catch (error) {
            errorMessage.textContent = error.message;
        }
    });
});