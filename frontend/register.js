document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');
    const apiUrl = 'http://localhost:3000/api/auth/register';

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evitamos que el formulario se envíe de la forma tradicional
        errorMessage.textContent = '';

        // 1. Recolectar los datos del formulario
        const Nombre = document.getElementById('Nombre').value;
        const username = document.getElementById('username').value;
        const Email = document.getElementById('Email').value;
        const Celular = document.getElementById('Celular').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // 2. Validación simple en el frontend
        if (password !== confirmPassword) {
            errorMessage.textContent = 'Las contraseñas no coinciden.';
            return; // Detenemos la ejecución si no coinciden
        }

        // 3. Crear el cuerpo (payload) de la petición
        const userData = {
            Nombre,
            username,
            Email,
            Celular,
            password,
            Rol: 'Vendedor' // Asignamos 'Vendedor' por defecto a los nuevos registros
        };

        // 4. Enviar los datos al backend
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                // Si el servidor responde con un error (ej: usuario ya existe)
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al registrar la cuenta.');
            }

            // Si todo sale bien
            alert('¡Cuenta registrada con éxito! Ahora serás redirigido para iniciar sesión.');
            window.location.href = 'login.html'; // Redirigimos al login

        } catch (error) {
            errorMessage.textContent = error.message;
        }
    });
});