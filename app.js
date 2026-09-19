const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyTODI_TaLv0zWl1IMQIujEMMd5HfxeV9C5M6_5jLyZTjfFI8MFJzl7okBsbv6_SgChiw/exec";

const form = document.getElementById("volunteerForm");
const submitBtn = document.getElementById("submitBtn");
const successMessage = document.getElementById("successMessage");

function toggleDayHours(checkbox) {
  const card = checkbox.closest(".day-schedule-card");
  const hoursContainer = card.querySelector(".hours-inputs");
  const inputs = hoursContainer.querySelectorAll("input[type='time']");

  if (checkbox.checked) {
    card.classList.add("active");
    hoursContainer.classList.remove("disabled");
    inputs.forEach(input => input.disabled = false);
  } else {
    card.classList.remove("active");
    hoursContainer.classList.add("disabled");
    inputs.forEach(input => input.disabled = true);
  }
}

form.addEventListener("submit", async function(e) {
  e.preventDefault();

  const selectedSchedules = [];
  const dayCards = document.querySelectorAll(".day-schedule-card");

  dayCards.forEach(card => {
    const checkbox = card.querySelector(".day-check");
    if (checkbox.checked) {
      const dayName = checkbox.getAttribute("data-day");
      const startTime = card.querySelector(".time-start").value;
      const endTime = card.querySelector(".time-end").value;
      
      selectedSchedules.push(`${dayName}: ${startTime} - ${endTime}`);
    }
  });

  if (selectedSchedules.length === 0) {
    alert("Por favor selecciona al menos un día y su horario disponible.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Guardando registro...";

  const celValue = document.getElementById("celular").value.trim();

  const payload = {
    tipo: "voluntario",
    nombre: document.getElementById("nombre").value.trim(),
    edad: document.getElementById("edad").value.trim(),
    "NUMERO CEL.": celValue,
    celular: celValue,
    correo: document.getElementById("correo").value.trim(),
    area: document.getElementById("area").value,
    notas: document.getElementById("notas").value.trim(),
    horarios: selectedSchedules.join(" | ")
  };

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      form.style.display = "none";
      successMessage.style.display = "block";
    } else {
      alert("Hubo un error al registrar tus datos. Por favor reintenta.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Completar Mi Registro";
    }
  } catch (error) {
    console.error("Error al enviar el formulario:", error);
    alert("No se pudo conectar con el servidor. Revisa tu conexión.");
    submitBtn.disabled = false;
    submitBtn.textContent = "Completar Mi Registro";
  }
});

function resetForm() {
  form.reset();
  
  document.querySelectorAll(".day-schedule-card").forEach(card => {
    card.classList.remove("active");
    const hoursContainer = card.querySelector(".hours-inputs");
    hoursContainer.classList.add("disabled");
    hoursContainer.querySelectorAll("input[type='time']").forEach(input => input.disabled = true);
  });

  form.style.display = "block";
  successMessage.style.display = "none";
  submitBtn.disabled = false;
  submitBtn.textContent = "Completar Mi Registro";
}
