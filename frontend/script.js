document.addEventListener('DOMContentLoaded', () => {
    console.log('Control de Gastos: DOM cargado.');
    // Por ahora, solo cargaremos los gastos (GET), la lógica de añadir/actualizar/eliminar vendrá después.
    fetchGastos(); 
});

// Función para obtener los gastos del backend
async function fetchGastos() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/gastos');
        if (!response.ok) {
            // Mejora de manejo de errores: más detalle
            const errorText = await response.text();
            throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
        }
        const gastos = await response.json();
        console.log('Gastos recibidos del backend:', gastos);
        displayGastos(gastos);
    } catch (error) {
        console.error('Error al obtener los gastos del backend:', error);
        // Mostrar error en la UI de manera más amigable
        document.getElementById('gastos-list').innerHTML = `<p style="color: red; text-align: center;">Error al cargar los gastos: ${error.message}</p>`;
    }
}

// Función para mostrar los gastos en la UI
function displayGastos(gastos) {
    const gastosListDiv = document.getElementById('gastos-list');
    gastosListDiv.innerHTML = ''; // Limpiar el contenido existente

    if (gastos.length === 0) {
        gastosListDiv.innerHTML = '<p style="text-align: center; color: #555;">No hay gastos registrados aún. ¡Añade uno!</p>';
        return;
    }

    gastos.forEach(gasto => {
        const gastoElement = document.createElement('div');
        gastoElement.classList.add('gasto-item');
        gastoElement.dataset.id = gasto.id;

        // Formatear la fecha para mostrarla
        const fecha = new Date(gasto.fecha).toLocaleDateString('es-AR'); // Ajusta a tu formato de fecha preferido

        gastoElement.innerHTML = `
            <div class="gasto-info">
                <span class="gasto-descripcion">${gasto.descripcion}</span>
                <span class="gasto-categoria">(${gasto.categoria})</span>
                <span class="gasto-monto">$${gasto.monto.toFixed(2)}</span>
                <span class="gasto-fecha">${fecha}</span>
            </div>
            <div class="gasto-actions">
                </div>
        `;
        // Los elementos de checkbox y botón de eliminar se añadirán aquí en la Fase 4

        gastosListDiv.appendChild(gastoElement);
    });
}

// Funciones CRUD (vacías por ahora, se completarán en Fases 3 y 4)
async function addGasto() { /* Lógica de añadir gasto */ }
async function toggleGastoPagado(id, pagado) { /* Lógica de actualizar gasto */ }
async function deleteGasto(id) { /* Lógica de eliminar gasto */ }