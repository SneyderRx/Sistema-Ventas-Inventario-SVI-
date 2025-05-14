const loginForm = document.getElementById('loginForm');
const recoveryForm = document.getElementById('recoveryForm');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const backToLoginLink = document.getElementById('backToLoginLink');
const sendRecoveryEmailButton = document.getElementById('sendRecoveryEmail');
const errorMessageElement = document.getElementById('errorMessage'); // Obtenemos el elemento del mensaje de error

forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    recoveryForm.style.display = 'block';
    // Ocultar el mensaje de error al cambiar al formulario de recuperación
    errorMessageElement.style.display = 'none';
});

backToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    recoveryForm.style.display = 'none';
    loginForm.style.display = 'block';
    // Ocultar el mensaje de error al volver al formulario de inicio de sesión
    errorMessageElement.style.display = 'none';
});

sendRecoveryEmailButton.addEventListener('click', () => {
    const email = document.getElementById('email').value;
    // Aquí podrías agregar la lógica para enviar el correo de recuperación
    alert(`Se enviará un correo de recuperación a: ${email}`);
    // Después de enviar el correo (simulado), podrías volver al inicio de sesión automáticamente
    recoveryForm.style.display = 'none';
    loginForm.style.display = 'block';
    document.getElementById('email').value = ''; // Limpiar el campo de correo, usuario y contraseña
    document.getElementById('username').value = '';
    document.getElementById('password').value = ''; 
    // Ocultar el mensaje de error al realizar la acción de recuperación
    errorMessageElement.style.display = 'none';
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'user1' && password === 'contraseña1') {
        window.location.href = './vistas/inicio.html';
        // Ocultar el mensaje de error si el inicio de sesión es exitoso (por si acaso estaba visible)
        errorMessageElement.style.display = 'none';
    } else {
        // Mostrar el mensaje de error
        errorMessageElement.textContent = 'Credenciales incorrectas. Por favor, inténtelo de nuevo.';
        errorMessageElement.style.display = 'block';
    }
});