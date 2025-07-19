document.addEventListener('DOMContentLoaded', () => {
    console.log('Control de Gastos: DOM cargado.');
    setupEventListeners();
    fetchGastos(); 
});

// Función para configurar los event listeners (ej. para el formulario)
function setupEventListeners() {
    const gastoForm = document.getElementById('gasto-form');
    gastoForm.addEventListener('submit', handleGastoFormSubmit);
}

// Maneja el envío del formulario de gastos
async function handleGastoFormSubmit(event) {
    event.preventDefault(); // Evitar que el formulario se recargue la página

    const formMessage = document.getElementById('form-message');
    formMessage.style.display = 'none'; // Ocultar mensajes anteriores
    formMessage.classList.remove('success', 'error');

    const formData = new FormData(event.target);
    const gastoData = Object.fromEntries(formData.entries());

    // Convertir monto a número antes de enviar
    gastoData.monto = parseFloat(gastoData.monto);

    // Asegurarse de que la fecha tiene un valor por defecto si no se selecciona
    if (!gastoData.fecha) {
        gastoData.fecha = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    }

    if (isNaN(gastoData.monto)) {
        displayMessage(formMessage, 'El monto debe ser un número válido.', 'error');
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:5000/api/gastos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gastoData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }

        const nuevoGasto = await response.json();
        console.log('Gasto añadido con éxito:', nuevoGasto);
        displayMessage(formMessage, 'Gasto añadido con éxito!', 'success');
        event.target.reset(); // Limpiar el formulario
        fetchGastos(); // Recargar la lista de gastos
    } catch (error) {
        console.error('Error al añadir el gasto:', error);
        displayMessage(formMessage, `Error al añadir el gasto: ${error.message}`, 'error');
    }
}

// Función para obtener y mostrar los gastos del backend
async function fetchGastos() {
    const gastosListDiv = document.getElementById('gastos-list');
    gastosListDiv.querySelector('.loading-message') && gastosListDiv.querySelector('.loading-message').remove();

    try {
        const response = await fetch('http://127.0.0.1:5000/api/gastos');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
        }
        const gastos = await response.json();
        console.log('Gastos recibidos del backend:', gastos);
        displayGastos(gastos);
    } catch (error) {
        console.error('Error al obtener los gastos del backend:', error);
        gastosListDiv.innerHTML = `<p style="color: red; text-align: center;">Error al cargar los gastos: ${error.message}</p>`;
    }
}

// Función para mostrar los gastos en la UI
function displayGastos(gastos) {
    const gastosListDiv = document.getElementById('gastos-list');
    gastosListDiv.innerHTML = '<h2>Mis Gastos</h2>';

    if (gastos.length === 0) {
        gastosListDiv.innerHTML += '<p style="text-align: center; color: #555;">No hay gastos registrados aún. ¡Añade uno!</p>';
        return;
    }

    // Ordenar gastos por fecha, el más reciente primero
    gastos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    gastos.forEach(gasto => {
        const gastoElement = document.createElement('div');
        gastoElement.classList.add('gasto-item');
        if (gasto.pagado) {
            gastoElement.classList.add('pagado'); // Añade clase 'pagado' si es true
        }
        gastoElement.dataset.id = gasto.id;

        const fecha = new Date(gasto.fecha).toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });

        gastoElement.innerHTML = `
            <div class="gasto-info">
                <span class="gasto-descripcion">${gasto.descripcion}</span>
                <span class="gasto-categoria">(${gasto.categoria})</span>
                <span class="gasto-monto">$${gasto.monto.toFixed(2)}</span>
                <span class="gasto-fecha">${fecha}</span>
            </div>
            <div class="gasto-actions">
                <label>
                    <input type="checkbox" ${gasto.pagado ? 'checked' : ''} 
                        onchange="toggleGastoPagado(${gasto.id}, this.checked)">
                    Pagado
                </label>
                <button class="delete-btn" onclick="deleteGasto(${gasto.id})">Eliminar</button>
            </div>
        `;

        gastosListDiv.appendChild(gastoElement);
    });
}

// Función auxiliar para mostrar mensajes de éxito/error
function displayMessage(element, message, type) {
    element.textContent = message;
    element.classList.add(type);
    element.style.display = 'block';
}

// --- Funcionalidades CRUD de Actualizar y Eliminar ---

// Función para actualizar el estado "pagado" de un gasto
async function toggleGastoPagado(id, pagado) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/gastos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pagado: pagado }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }

        console.log(`Gasto ${id} actualizado a pagado: ${pagado}`);
        fetchGastos(); // Recargar la lista para que se refleje el cambio visual (tachado)
    } catch (error) {
        console.error(`Error al actualizar el gasto ${id}:`, error);
        alert(`No se pudo actualizar el gasto: ${error.message}`); // Mostrar un alert simple
    }
}

// Función para eliminar un gasto
async function deleteGasto(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
        return; // Si el usuario cancela, no hacemos nada
    }

    try {
        const response = await fetch(`http://127.0.0.1:5000/api/gastos/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }

        console.log(`Gasto ${id} eliminado con éxito.`);
        fetchGastos(); // Recargar la lista para que el gasto eliminado desaparezca
    } catch (error) {
        console.error(`Error al eliminar el gasto ${id}:`, error);
        alert(`No se pudo eliminar el gasto: ${error.message}`); // Mostrar un alert simple
    }
}