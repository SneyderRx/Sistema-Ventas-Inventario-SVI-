document.addEventListener('DOMContentLoaded', function() {
    // --- ESTADO INICIAL Y VALIDACIÓN ---
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // --- REFERENCIAS A ELEMENTOS DEL DOM ---
    const formProducto = document.getElementById('form-producto');
    const tablaInventario = document.getElementById('tabla-inventario').getElementsByTagName('tbody')[0];
    const logoutButton = document.getElementById('logout-button');
    // Elementos de la nueva Modal de Venta
    const modalVenta = document.getElementById('modal-venta');
    const modalProductoNombre = document.getElementById('modal-producto-nombre');
    const modalClienteSelect = document.getElementById('modal-cliente-select');
    const formVenta = document.getElementById('form-venta');
    const closeModalBtn = modalVenta.querySelector('.close-btn');
    
    // --- URLs y HEADERS ---
    const apiUrl = 'http://localhost:3000/api';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
    let inventarioCompleto = [];

    // --- FUNCIONES DE CARGA Y RENDERIZADO ---
    
    // Función principal que se ejecuta al cargar la página
    async function inicializarPagina() {
        await obtenerInventario();
        await obtenerClientes();
    }

    async function obtenerInventario() {
        try {
            const response = await fetch(`${apiUrl}/productos`, { headers });
            if (!response.ok) throw new Error('Error al cargar inventario');
            inventarioCompleto = await response.json();
            renderizarInventario(inventarioCompleto);
        } catch (error) {
            console.error('Error:', error);
            alert('No se pudo cargar el inventario.');
        }
    }

    async function obtenerClientes() {
        try {
            const response = await fetch(`${apiUrl}/clientes`, { headers });
            if (!response.ok) throw new Error('Error al cargar clientes');
            const clientes = await response.json();
            
            modalClienteSelect.innerHTML = '<option value="">Seleccione un cliente...</option>';
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.id_cliente;
                option.textContent = cliente.Nombre_cliente;
                modalClienteSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error:', error);
            modalClienteSelect.innerHTML = '<option value="">Error al cargar clientes</option>';
        }
    }

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
                <td><button onclick="window.abrirModalVenta(${producto.id_producto})">Vender</button></td>
                <td><button class="edit-btn" data-id="${producto.id_producto}">Editar</button></td>
                <td><button class="delete-btn" data-id="${producto.id_producto}">Eliminar</button></td>
            `;
        });
    }

    // --- LÓGICA DE LA MODAL DE VENTA ---

    // Hacemos la función global para que el `onclick` del HTML la encuentre
    window.abrirModalVenta = (idProducto) => {
        const producto = inventarioCompleto.find(p => p.id_producto === idProducto);
        if (!producto) return;

        // Guardamos el ID del producto en el formulario para usarlo después
        formVenta.dataset.idProducto = idProducto;
        
        modalProductoNombre.textContent = producto.Nombre;
        document.getElementById('modal-cantidad-venta').max = producto.Stock; // Limitar cantidad al stock
        modalVenta.style.display = 'block';
    };

    // Evento para cerrar la modal
    closeModalBtn.addEventListener('click', () => {
        modalVenta.style.display = 'none';
    });
    window.addEventListener('click', (e) => {
        if (e.target == modalVenta) {
            modalVenta.style.display = 'none';
        }
    });

    // Evento para procesar el formulario de la venta
    formVenta.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id_producto = parseInt(formVenta.dataset.idProducto);
        const cantidad = parseInt(document.getElementById('modal-cantidad-venta').value);
        const id_cliente = parseInt(modalClienteSelect.value);

        if (!id_cliente) {
            alert('Por favor, seleccione un cliente.');
            return;
        }

        const payload = {
            id_cliente,
            productos: [{ id_producto, cantidad }]
        };

        try {
            const response = await fetch(`${apiUrl}/ventas`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            alert('¡Venta registrada con éxito!');
            modalVenta.style.display = 'none'; // Cerramos la modal
            await obtenerInventario(); // Refrescamos la tabla para ver el stock actualizado

        } catch (error) {
            console.error('Error al registrar venta:', error);
            alert(`Error: ${error.message}`);
        }
    });

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
    
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

    // --- INICIALIZACIÓN ---
    inicializarPagina();
});