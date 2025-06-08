document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const formProducto = document.getElementById('form-producto');
    const tablaInventario = document.getElementById('tabla-inventario').getElementsByTagName('tbody')[0];
    const logoutButton = document.getElementById('logout-button');
    
    // --- CORRECCIÓN #1: URL de la API ---
    const apiUrl = 'http://localhost:3000/api/productos';

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    async function obtenerInventario() {
        try {
            const response = await fetch(apiUrl, { headers });
            if (response.status === 403 || response.status === 401) {
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

    // --- CORRECCIÓN #2: Estructura de la tabla ---
    function renderizarInventario(inventario) {
        tablaInventario.innerHTML = '';
        inventario.forEach(producto => {
            let fila = tablaInventario.insertRow();
            fila.dataset.nombre = producto.Nombre;
            fila.dataset.precio = producto.Precio;
            fila.dataset.stock = producto.Stock;

            fila.innerHTML = `
                <td>${producto.Nombre}</td>
                <td>${producto.Stock}</td>
                <td>$${parseFloat(producto.Precio).toFixed(2)}</td>
                <td><button onclick="venderProducto(${producto.id_producto})">Vender</button></td>
                <td><button class="edit-btn" data-id="${producto.id_producto}">Editar</button></td>
                <td><button class="delete-btn" data-id="${producto.id_producto}">Eliminar</button></td>
            `;
        });
    }

    // Lógica para el formulario de "Agregar Producto"
formProducto.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // El objeto nuevoProducto ahora coincide exactamente con el nuevo formulario y el backend
    const nuevoProducto = {
        Nombre: document.getElementById('nombre-producto').value,
        Distribuidor: document.getElementById('distribuidor-producto').value,
        Fecha_arribo: document.getElementById('arribo-producto').value,
        Precio: parseFloat(document.getElementById('precio-producto').value),
        Stock: parseInt(document.getElementById('cantidad-producto').value)
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(nuevoProducto)
        });

        if (!response.ok) {
            // Si el backend envía un error, lo mostramos
            const errorData = await response.json();
            throw new Error(errorData.message);
        }

        obtenerInventario(); // Refrescamos la tabla para ver el nuevo producto
        formProducto.reset(); // Limpiamos el formulario

    } catch (error) {
        console.error('Error al agregar producto:', error);
        alert(`No se pudo agregar el producto: ${error.message}`);
    }
});

    // Delegación de eventos para Editar y Eliminar
    tablaInventario.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
                await fetch(`${apiUrl}/${id}`, { method: 'DELETE', headers });
                obtenerInventario();
            }
        }

        if (e.target.classList.contains('edit-btn')) {
            const fila = e.target.closest('tr');
            const productoActualizado = {
                Nombre: prompt("Nuevo nombre:", fila.dataset.nombre),
                Precio: parseFloat(prompt("Nuevo precio:", fila.dataset.precio)),
                Stock: parseInt(prompt("Nuevo stock:", fila.dataset.stock))
            };

            if (productoActualizado.Nombre && !isNaN(productoActualizado.Precio) && !isNaN(productoActualizado.Stock)) {
                await fetch(`${apiUrl}/${id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(productoActualizado)
                });
                obtenerInventario();
            }
        }
    });

    // La función para vender sigue siendo un desafío, porque nuestro backend ahora espera una transacción compleja.
    // La dejaremos pendiente por ahora para enfocarnos en el CRUD de productos.
    window.venderProducto = function(id) {
        alert(`La función 'Vender' debe ser rediseñada para usar la nueva API de ventas. ¡Este será nuestro próximo paso! ID del producto: ${id}`);
    };
    
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

    obtenerInventario();
});