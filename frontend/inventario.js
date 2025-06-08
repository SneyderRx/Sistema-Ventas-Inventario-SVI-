document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    
    // --- GATEKEEPER ---
    // Si no hay token, el usuario no ha iniciado sesión.
    // Lo redirigimos a la página de login.
    if (!token) {
        window.location.href = 'login.html';
        return; // Detenemos la ejecución del script
    }

    const formProducto = document.getElementById('form-producto');
    const tablaInventario = document.getElementById('tabla-inventario').getElementsByTagName('tbody')[0];
    const logoutButton = document.getElementById('logout-button');
    const apiUrl = 'http://localhost:3000/api/inventario';

    // Creamos un objeto de cabeceras para reutilizar en cada petición
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    async function obtenerInventario() {
        try {
            const response = await fetch(apiUrl, { headers });
            if (response.status === 403 || response.status === 401) {
                // Si el token es inválido o expiró, redirigir al login
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }
            const inventario = await response.json();
            renderizarInventario(inventario);
        } catch (error) {
            console.error('Error al obtener inventario:', error);
        }
    }

    function renderizarInventario(inventario) {
        tablaInventario.innerHTML = '';
        inventario.forEach(producto => {
            let fila = tablaInventario.insertRow();
            fila.innerHTML = `
                <td>${producto.nombre}</td>
                <td>${producto.cantidad}</td>
                <td>$${parseFloat(producto.precio).toFixed(2)}</td>
                <td><button onclick="venderProducto(${producto.id})">Vender</button></td>
            `;
        });
    }

    formProducto.addEventListener('submit', async function(e) {
        e.preventDefault();
        const nuevoProducto = {
            nombre: document.getElementById('nombre-producto').value,
            cantidad: parseInt(document.getElementById('cantidad-producto').value),
            precio: parseFloat(document.getElementById('precio-producto').value)
        };

        await fetch(apiUrl, {
            method: 'POST',
            headers: headers, // Usamos las cabeceras con el token
            body: JSON.stringify(nuevoProducto)
        });
        obtenerInventario();
        formProducto.reset();
    });

    window.venderProducto = async function(id) {
        await fetch(`${apiUrl}/${id}/vender`, {
            method: 'POST',
            headers: headers // Usamos las cabeceras con el token
        });
        obtenerInventario();
    };

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token'); // Limpiamos el token
        window.location.href = 'login.html'; // Y redirigimos al login
    });

    // Cargar el inventario inicial al cargar la página
    obtenerInventario();
});