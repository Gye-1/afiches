/**
 * CONFIGURACIÓN INICIAL Y MAPA
 */
const map = L.map('map').setView([-2.189, -79.889], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let marker = L.marker([-2.189, -79.889], {draggable: true}).addTo(map);

// Carga de capa KML para zonas AGA
let agaLayer = omnivore.kml('AGA.kml').on('ready', function() {
    this.setStyle({ color: "#00AEEF", weight: 2, fillOpacity: 0.1 });
}).addTo(map);

// Función para actualizar coordenadas y zona
function actualizarUbicacion(latlng) {
    marker.setLatLng(latlng);
    document.getElementById('lat').value = latlng.lat;
    document.getElementById('lng').value = latlng.lng;
    
    // Detectar si el punto cae dentro de un polígono AGA
    agaLayer.eachLayer(layer => {
        if (layer.getBounds && layer.getBounds().contains(latlng)) {
            document.getElementById('aga').value = layer.feature.properties.name || "Zona Detectada";
        }
    });
}

// Evento: Clic en el mapa para mover marcador
map.on('click', (e) => actualizarUbicacion(e.latlng));

// Evento: Arrastrar el marcador
marker.on('dragend', () => actualizarUbicacion(marker.getLatLng()));

/**
 * LÓGICA DE TÉRMINOS Y CONDICIONES (BLOQUEO Y MODAL)
 */
const cruzCerrar = document.getElementById('cerrarCruz');
const checkboxTerminos = document.querySelector('input[type="checkbox"]');
const modalTerminos = document.getElementById('modalTerminos');
const modalExito = document.getElementById('modalExito');
const btnCerrarTerminos = document.getElementById('cerrarModal');
const btnCerrarExito = document.getElementById('cerrarExito');
const form = document.getElementById('registroForm');
const todosLosInputs = document.querySelectorAll('#registroForm input, #registroForm select, #registroForm textarea, #registroForm button[type="submit"]');

function activarFormulario() {
    todosLosInputs.forEach(input => input.disabled = false);
}

function desactivarFormulario() {
    todosLosInputs.forEach(input => {
        if (input !== checkboxTerminos) input.disabled = true;
    });
}

// Función unificada para cerrar el reglamento y habilitar el registro
function aceptarYCerrarTerminos() {
    modalTerminos.style.display = "none";
    checkboxTerminos.checked = true;
    activarFormulario();
}

// Bloqueo inicial del formulario
desactivarFormulario();

// Abrir modal al hacer clic en el enlace de "Términos y Condiciones"
document.querySelector('a[href="#"]').addEventListener('click', (e) => {
    e.preventDefault();
    modalTerminos.style.display = "block";
});

// Abrir modal si el usuario intenta marcar el checkbox directamente
checkboxTerminos.addEventListener('change', () => {
    if (checkboxTerminos.checked) {
        modalTerminos.style.display = "block";
    } else {
        desactivarFormulario();
    }
});

// Asignación de eventos de cierre (Botón y Cruz)
if (btnCerrarTerminos) btnCerrarTerminos.onclick = aceptarYCerrarTerminos;
if (cruzCerrar) cruzCerrar.onclick = aceptarYCerrarTerminos;

/**
 * UTILIDADES Y ENVÍO CON PROGRESO
 */
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

document.getElementById('estudios').addEventListener('change', (e) => {
    document.getElementById('seccionEstudios').style.display = e.target.value === 'SI' ? 'block' : 'none';
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const containerProgreso = document.getElementById('containerProgreso');
    const barra = document.getElementById('barra');
    const textoPorcentaje = document.getElementById('porcentaje');
    const btnSubmit = form.querySelector('button[type="submit"]');

    // Validación de archivos obligatorios antes de procesar
    const fileJpg = document.getElementById('fileJpg').files[0];
    const fileVec = document.getElementById('fileVector').files[0];
    const filePdf = document.getElementById('filePdf').files[0];

    if (!fileJpg || !fileVec || !filePdf) {
        alert("Por favor, suba todos los archivos obligatorios.");
        return;
    }

    try {
        btnSubmit.disabled = true;
        containerProgreso.style.display = 'block';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Simulación de progreso mediante procesamiento de archivos
        barra.style.width = "20%"; textoPorcentaje.innerText = "20%";
        data.fileJpg = await toBase64(fileJpg);
        
        barra.style.width = "40%"; textoPorcentaje.innerText = "40%";
        data.fileVector = await toBase64(fileVec);
        data.vectorExt = fileVec.name.split('.').pop();

        barra.style.width = "60%"; textoPorcentaje.innerText = "60%";
        data.filePdf = await toBase64(filePdf);

        barra.style.width = "80%"; textoPorcentaje.innerText = "Enviando...";

        const response = await fetch('https://script.google.com/macros/s/AKfycby9muvBY602QIlairDCmVN0jsC-RGjxq3qmbqeMG1G9azbBf0IjW-qF5465ZkQiVo-Q/exec', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (response.ok || (await response.status) === 200) {
            barra.style.width = "100%"; textoPorcentaje.innerText = "100%";
            modalExito.style.display = 'block';
        } else {
            throw new Error("Error en el servidor");
        }

    } catch (error) {
        alert("Ocurrió un error al enviar el formulario. Intente de nuevo.");
        btnSubmit.disabled = false;
        containerProgreso.style.display = 'none';
    }
});

/**
 * REINICIO POST-ENVÍO
 */
btnCerrarExito.addEventListener('click', () => {
    modalExito.style.display = 'none';
    form.reset(); 
    document.getElementById('containerProgreso').style.display = 'none';
    document.getElementById('barra').style.width = "0%";
    document.getElementById('seccionEstudios').style.display = 'none';
    desactivarFormulario(); 
});
