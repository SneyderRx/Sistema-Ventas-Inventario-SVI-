// frontend/reportes.js

document.addEventListener('DOMContentLoaded', () => {
    // --- VALIDACIÓN DE TOKEN ---
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // --- REFERENCIAS Y CONFIGURACIÓN ---
    const reporteContainer = document.getElementById('reporte-container');
    const logoutButton = document.getElementById('logout-button');
    const apiUrl = 'http://localhost:3000/api/ventas';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // --- FUNCIONES ---

    async function cargarReportes() {
        try {
            const response = await fetch(apiUrl, { headers });
            if (!response.ok) throw new Error('No se pudo cargar el historial.');
            const ventas = await response.json();
            renderizarReportes(ventas);
        } catch (error) {
            console.error(error);
            reporteContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    function renderizarReportes(ventas) {
        if (ventas.length === 0) {
            reporteContainer.innerHTML = '<p>No hay ventas registradas todavía.</p>';
            return;
        }

        reporteContainer.innerHTML = ''; // Limpiar el contenedor
        ventas.forEach(venta => {
            const ventaCard = document.createElement('div');
            ventaCard.className = 'venta-card';
            // Formateamos la fecha para que sea más legible
            const fecha = new Date(venta.Fecha_venta).toLocaleString('es-CO');
            
            ventaCard.innerHTML = `
                <div class="venta-header">
                    <div>
                        <strong>Venta #${venta.id_venta}</strong>
                        <span>Fecha: ${fecha}</span>
                    </div>
                    <button class="btn-ver-detalle" data-id="${venta.id_venta}">Ver Detalle</button>
                </div>
                <div class="venta-body">
                    <p><strong>Cliente:</strong> ${venta.Nombre_cliente}</p>
                    <p><strong>Vendedor:</strong> ${venta.Nombre_vendedor}</p>
                    <p class="venta-total"><strong>Total:</strong> $${parseFloat(venta.Total_venta).toFixed(2)}</p>
                </div>
                <div class="venta-detalle-container" id="detalle-${venta.id_venta}"></div>
            `;
            reporteContainer.appendChild(ventaCard);
        });
    }

    async function mostrarDetalleVenta(idVenta) {
        const detalleContainer = document.getElementById(`detalle-${idVenta}`);
        
        // Si ya hemos cargado los detalles, los ocultamos/mostramos para un efecto 'acordeón'
        if (detalleContainer.innerHTML !== '') {
            detalleContainer.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/${idVenta}`, { headers });
            if (!response.ok) throw new Error('No se pudo cargar el detalle.');
            const detalles = await response.json();
            
            let htmlDetalle = '<ul>';
            detalles.forEach(item => {
                htmlDetalle += `<li>${item.Cantidad}x ${item.Nombre} (@ $${parseFloat(item.Precio_unitario).toFixed(2)} c/u)</li>`;
            });
            htmlDetalle += '</ul>';
            
            detalleContainer.innerHTML = htmlDetalle;
        } catch (error) {
            detalleContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    // --- EVENTOS ---
    reporteContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-ver-detalle')) {
            const idVenta = e.target.dataset.id;
            mostrarDetalleVenta(idVenta);
        }
    });

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

    // --- INICIALIZACIÓN ---
    cargarReportes();
});