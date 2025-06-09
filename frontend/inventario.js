document.addEventListener('DOMContentLoaded', function() {
    // --- ESTADO INICIAL Y VALIDACIÓN ---
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // --- REFERENCIAS A ELEMENTOS DEL DOM ---
    const formProducto = document.getElementById('form-producto');
    const buscadorInventario = document.getElementById('buscador-inventario');
    const tablaInventario = document.getElementById('tabla-inventario').getElementsByTagName('tbody')[0];
    const logoutButton = document.getElementById('logout-button');
    // Modal de Venta
    const modalVenta = document.getElementById('modal-venta');
    const modalProductoNombre = document.getElementById('modal-producto-nombre');
    const modalClienteSelect = document.getElementById('modal-cliente-select');
    const formVenta = document.getElementById('form-venta');
    const closeVentaBtn = modalVenta.querySelector('.close-btn');
    // Modal de Cliente
    const btnAbrirModalCliente = document.getElementById('btn-abrir-modal-cliente');
    const modalNuevoCliente = document.getElementById('modal-nuevo-cliente');
    const formNuevoCliente = document.getElementById('form-nuevo-cliente');
    const closeClienteBtn = modalNuevoCliente.querySelector('.close-btn');
    const modalErrorMessage = document.getElementById('modal-error-message');
    
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
        await Promise.all([obtenerInventario(), obtenerClientes()]);
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

    async function obtenerClientes() {
        try {
            const response = await fetch(`${apiUrl}/clientes`, { headers });
            if (!response.ok) throw new Error('Error al cargar clientes');
            const clientes = await response.json();
            renderizarClientes(clientes);
        } catch (error) {
            console.error('Error:', error);
            modalClienteSelect.innerHTML = '<option value="">Error al cargar</option>';
        }
    }

    function renderizarClientes(clientes, nuevoClienteId = null) {
        modalClienteSelect.innerHTML = '<option value="">Seleccione un cliente...</option>';
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id_cliente;
            option.textContent = cliente.Nombre_cliente;
            modalClienteSelect.appendChild(option);
        });
        if (nuevoClienteId) {
            modalClienteSelect.value = nuevoClienteId;
        }
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
        const response = await fetch(`${apiUrl}/productos`, {
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
            Swal.fire({
                title: '¿Estás seguro?',
                text: "¡No podrás revertir esta acción!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, ¡elimínalo!',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    // Si el usuario confirma, ejecutamos la lógica de eliminación
                    try {
                        await fetch(`${apiUrl}/productos/${id}`, { method: 'DELETE', headers });
                        Swal.fire(
                            '¡Eliminado!',
                            'El producto ha sido eliminado.',
                            'success'
                        );
                        await obtenerInventario();
                    } catch(error) {
                        Swal.fire('Error', 'No se pudo eliminar el producto.', 'error');
                    }
                }
            });
        }

        if (target.classList.contains('edit-btn')) {
            const fila = target.closest('tr');
            const nombreActual = fila.dataset.nombre;
            const precioActual = fila.dataset.precio;
            const stockActual = fila.dataset.stock;

            Swal.fire({
                title: 'Editar Producto',
                html: `
                    <input id="swal-nombre" class="swal2-input" value="${nombreActual}" placeholder="Nombre del producto">
                    <input id="swal-precio" type="number" class="swal2-input" value="${precioActual}" placeholder="Precio">
                    <input id="swal-stock" type="number" class="swal2-input" value="${stockActual}" placeholder="Stock">
                `,
                focusConfirm: false,
                preConfirm: () => {
                    return {
                        Nombre: document.getElementById('swal-nombre').value,
                        Precio: parseFloat(document.getElementById('swal-precio').value),
                        Stock: parseInt(document.getElementById('swal-stock').value)
                    }
                }
            }).then(async (result) => {
                if (result.isConfirmed && result.value) {
                    const productoActualizado = result.value;
                    if (productoActualizado.Nombre && !isNaN(productoActualizado.Precio) && !isNaN(productoActualizado.Stock)) {
                        try {
                            await fetch(`${apiUrl}/productos/${id}`, {
                                method: 'PUT',
                                headers,
                                body: JSON.stringify(productoActualizado)
                            });
                            Swal.fire('¡Actualizado!', 'El producto ha sido actualizado.', 'success');
                            await obtenerInventario();
                        } catch(error) {
                            Swal.fire('Error', 'No se pudo actualizar el producto.', 'error');
                        }
                    }
                }
            });
        }
    });


    // --- LÓGICA DE VENTA ---
    window.abrirModalVenta = (idProducto) => {
        const producto = inventarioCompleto.find(p => p.id_producto === idProducto);
        if (!producto) return;
        formVenta.dataset.idProducto = idProducto;
        modalProductoNombre.textContent = producto.Nombre;
        document.getElementById('modal-cantidad-venta').max = producto.Stock;
        modalVenta.style.display = 'block';
    };

    closeVentaBtn.addEventListener('click', () => { modalVenta.style.display = 'none'; });

    formVenta.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id_producto = parseInt(formVenta.dataset.idProducto);
        const cantidad = parseInt(document.getElementById('modal-cantidad-venta').value);
        const id_cliente = parseInt(modalClienteSelect.value);

        if (!id_cliente) {
            alert('Por favor, seleccione un cliente.');
            return;
        }
        const payload = { id_cliente, productos: [{ id_producto, cantidad }] };
        try {
            const response = await fetch(`${apiUrl}/ventas`, { method: 'POST', headers, body: JSON.stringify(payload) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            Swal.fire({
                title: '¡Venta Registrada!',
                text: 'La venta se ha registrado con éxito.',
                icon: 'success',
                timer: 2000, // La alerta se cierra sola después de 2 segundos
                showConfirmButton: false
            });
            modalVenta.style.display = 'none';
            await obtenerInventario();
        } catch (error) {
            console.error('Error al registrar venta:', error);
            alert(`Error: ${error.message}`);
        }
    });

    // --- LÓGICA DE LA MODAL DE CLIENTE NUEVO ---
    btnAbrirModalCliente.addEventListener('click', () => {
        modalNuevoCliente.style.display = 'block';
    });

    closeClienteBtn.addEventListener('click', () => {
        modalNuevoCliente.style.display = 'none';
    });

    formNuevoCliente.addEventListener('submit', async (e) => {
        e.preventDefault();
        modalErrorMessage.textContent = '';
        const nuevoCliente = {
            Nombre_cliente: document.getElementById('modal-nombre-cliente').value,
            Celular_cliente: document.getElementById('modal-celular-cliente').value,
            Email_cliente: document.getElementById('modal-email-cliente').value,
        };
        try {
            const response = await fetch(`${apiUrl}/clientes`, { method: 'POST', headers, body: JSON.stringify(nuevoCliente) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            alert('Cliente registrado con éxito.');
            modalNuevoCliente.style.display = 'none';
            formNuevoCliente.reset();
            
            // Refrescamos la lista de clientes y seleccionamos el nuevo
            await obtenerClientes();
            modalClienteSelect.value = data.id_cliente;
        } catch (error) {
            modalErrorMessage.textContent = error.message;
        }
    });
    
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

        // Cerrar modales si se hace clic afuera
    window.addEventListener('click', (e) => {
    // Si la modal de cliente está abierta y el clic es en su fondo, la cerramos.
    if (e.target == modalNuevoCliente) {
        modalNuevoCliente.style.display = 'none';
        return; // Detenemos para no evaluar la otra condición
    }
    // Si la modal de venta está abierta y el clic es en su fondo, la cerramos.
    if (e.target == modalVenta) {
        modalVenta.style.display = 'none';
    }
});

// --- LÓGICA DEL BUSCADOR DE INVENTARIO ---
buscadorInventario.addEventListener('keyup', () => {
    // 1. Obtenemos el texto que el usuario ha escrito, en minúsculas para no distinguir may/min.
    const terminoBusqueda = buscadorInventario.value.toLowerCase();

    // 2. Filtramos el array principal de productos.
    //    Nos quedamos solo con los productos cuyo nombre (también en minúsculas) incluya el término de búsqueda.
    const productosFiltrados = inventarioCompleto.filter(producto => {
        return producto.Nombre.toLowerCase().includes(terminoBusqueda);
    });

    // 3. Volvemos a dibujar la tabla, pero esta vez solo con los productos filtrados.
    renderizarInventario(productosFiltrados);
});

    // --- INICIALIZACIÓN ---
    inicializarPagina();
});