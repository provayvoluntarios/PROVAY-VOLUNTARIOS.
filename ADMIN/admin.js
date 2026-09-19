const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxhcbrNgnQHYXgxFCOIbA7ml2_DiwH0jSNpbWvYHiYY4neM0WQjGiBCl3haHVCXmSnb2Q/exec";

const NOM_MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

const DIAS_SEMANA_MAP = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado"
];

let currentDate = new Date();

let allVolunteers = [];
let allActivities = [];


document.addEventListener(
  "DOMContentLoaded",
  fetchData
);


/* =====================================================
   CARGAR DATOS
===================================================== */

async function fetchData() {
  try {

    console.log(
      "Cargando Google Sheets..."
    );

    const response =
      await fetch(
        GOOGLE_SCRIPT_URL +
        "?t=" +
        Date.now(),
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        "HTTP " +
        response.status
      );
    }

    const texto =
      await response.text();

    console.log(
      "Respuesta:",
      texto
    );

    const result =
      JSON.parse(texto);

    if (!result.success) {
      throw new Error(
        result.error ||
        "Google Apps Script devolvió error."
      );
    }

    allVolunteers =
      Array.isArray(
        result.data
      )
        ? result.data
        : [];

    allActivities =
      Array.isArray(
        result.actividades
      )
        ? result.actividades.map(
            act => ({
              nombre:
                act.nombre || "",

              fecha:
                normalizarFecha(
                  act.fecha
                ),

              horario:
                act.horario || "",

              lugar:
                act.lugar || "",

              asignados:
                act.asignados || 0
            })
          )
        : [];

    console.log(
      "VOLUNTARIOS:",
      allVolunteers
    );

    console.log(
      "ACTIVIDADES:",
      allActivities
    );

    renderVolunteers(
      allVolunteers
    );

    renderActivities(
      allActivities
    );

    renderMonthCalendar();

  } catch (error) {

    console.error(
      "ERROR:",
      error
    );

    showErrorState();
  }
}


/* =====================================================
   NORMALIZAR FECHA
===================================================== */

function normalizarFecha(fecha) {

  if (!fecha) {
    return "";
  }

  let texto =
    String(fecha)
      .trim();

  /*
   * yyyy-mm-dd
   */

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      texto
    )
  ) {

    return texto;
  }


  /*
   * yyyy-mm-ddT...
   */

  if (
    /^\d{4}-\d{2}-\d{2}T/.test(
      texto
    )
  ) {

    return texto.substring(
      0,
      10
    );
  }


  /*
   * dd/mm/yyyy
   */

  let partes =
    texto.split("/");

  if (
    partes.length === 3
  ) {

    let dia =
      partes[0].padStart(
        2,
        "0"
      );

    let mes =
      partes[1].padStart(
        2,
        "0"
      );

    let anio =
      partes[2];

    if (
      anio.length === 4
    ) {

      return (
        anio +
        "-" +
        mes +
        "-" +
        dia
      );
    }
  }


  /*
   * dd-mm-yyyy
   */

  partes =
    texto.split("-");

  if (
    partes.length === 3 &&
    partes[2].length === 4
  ) {

    return (
      partes[2] +
      "-" +
      partes[1].padStart(
        2,
        "0"
      ) +
      "-" +
      partes[0].padStart(
        2,
        "0"
      )
    );
  }


  /*
   * Formatos de fecha que pueden
   * venir directamente desde Google Sheets.
   */

  const fechaObjeto =
    new Date(texto);

  if (
    !isNaN(
      fechaObjeto.getTime()
    )
  ) {

    return (
      fechaObjeto.getFullYear() +
      "-" +
      String(
        fechaObjeto.getMonth() + 1
      ).padStart(
        2,
        "0"
      ) +
      "-" +
      String(
        fechaObjeto.getDate()
      ).padStart(
        2,
        "0"
      )
    );
  }

  return texto;
}


/* =====================================================
   ERROR
===================================================== */

function showErrorState() {

  const volunteers =
    document.getElementById(
      "volunteersList"
    );

  const events =
    document.getElementById(
      "eventsList"
    );

  if (volunteers) {

    volunteers.innerHTML = `
      <p
        style="
          color:red;
          text-align:center;
          padding:20px;
        "
      >
        Error al obtener datos de Google Sheets.
      </p>
    `;
  }

  if (events) {

    events.innerHTML = `
      <p
        style="
          color:red;
          text-align:center;
          padding:20px;
        "
      >
        Error al cargar actividades.
      </p>
    `;
  }
}


/* =====================================================
   FORMATO HORA
===================================================== */

function formatTime12h(
  time24
) {

  if (!time24) {
    return "";
  }

  const partes =
    time24.split(":");

  let hours =
    parseInt(
      partes[0],
      10
    );

  const minutes =
    partes[1] || "00";

  const suffix =
    hours >= 12
      ? "PM"
      : "AM";

  hours =
    hours % 12 || 12;

  return (
    hours +
    ":" +
    minutes +
    " " +
    suffix
  );
}


/* =====================================================
   VOLUNTARIOS
===================================================== */

function renderVolunteers(
  volunteers
) {

  const container =
    document.getElementById(
      "volunteersList"
    );

  if (!container) {
    return;
  }

  container.innerHTML =
    "";

  if (
    volunteers.length === 0
  ) {

    container.innerHTML = `
      <p
        style="
          color:#777;
          text-align:center;
          padding:20px;
        "
      >
        No hay voluntarios registrados.
      </p>
    `;

    return;
  }

  let activityOptionsHTML = `
    <option value="">
      -- Seleccionar Actividad --
    </option>
  `;

  allActivities.forEach(
    act => {

      activityOptionsHTML += `
        <option
          value="${escapeHTML(
            act.nombre
          )}"
        >
          ${escapeHTML(
            act.nombre
          )}
          ${
            act.fecha
              ? " (" +
                act.fecha +
                ")"
              : ""
          }
        </option>
      `;
    }
  );

  volunteers.forEach(
    (vol) => {

      const actividadAsignada =
        vol.actividadAsignada ||
        vol.area ||
        "Sin asignar";

      const estado =
        vol.estado ||
        "Pendiente";

      const asignado =
        estado
          .toLowerCase() ===
        "asignado";

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "item-row";

      row.innerHTML = `
        <div class="item-info">

          <h4>

            ${escapeHTML(
              vol.nombre ||
              "Sin Nombre"
            )}

            <span
              style="
                font-weight:normal;
                font-size:12px;
                color:#888;
              "
            >
              (${escapeHTML(
                vol.id ||
                "VOL"
              )})
            </span>

          </h4>

          <p>

            <strong>
              Asignado a:
            </strong>

            ${escapeHTML(
              actividadAsignada
            )}

            |

            ⏰

            <strong>
              Disp:
            </strong>

            ${escapeHTML(
              vol.horarios ||
              "No especificada"
            )}

            |

            ${escapeHTML(
              vol.correo ||
              "Sin correo"
            )}

            ${
              vol.celular
                ? " | " +
                  escapeHTML(
                    vol.celular
                  )
                : ""
            }

          </p>

        </div>

        <div class="actions-group">

          <select
            class="select-activity"
          >

            ${activityOptionsHTML}

          </select>

          <span
            class="badge-status"
            style="${
              asignado
                ? "background:#d1f2dd;color:#1ebc57;"
                : ""
            }"
          >

            ${escapeHTML(
              estado
            )}

          </span>

          <button
            type="button"
            class="btn-action-ws"
          >
            WhatsApp
          </button>

          <button
            type="button"
            class="btn-black"
          >

            ${
              asignado
                ? "Reasignar"
                : "Asignar"
            }

          </button>

        </div>
      `;

      container.appendChild(
        row
      );

      const select =
        row.querySelector(
          ".select-activity"
        );

      if (
        vol.actividadAsignada
      ) {

        select.value =
          vol.actividadAsignada;
      }


      const whatsapp =
        row.querySelector(
          ".btn-action-ws"
        );

      whatsapp.addEventListener(
        "click",
        function () {

          enviarWhatsApp(
            vol,
            select.value
          );

        }
      );


      const btnAsignar =
        row.querySelector(
          ".btn-black"
        );

      btnAsignar.addEventListener(
        "click",
        function () {

          asignarVoluntario(
            vol,
            select
          );

        }
      );

    }
  );
}


/* =====================================================
   WHATSAPP
===================================================== */

function enviarWhatsApp(
  vol,
  actividadSeleccionada
) {

  let telefono =
    String(
      vol.celular ||
      ""
    )
      .replace(
        /\D/g,
        ""
      );

  if (!telefono) {

    alert(
      "Este voluntario no tiene celular registrado en Google Sheets."
    );

    return;
  }

  if (
    telefono.length === 10
  ) {

    telefono =
      "52" +
      telefono;
  }

  const nombreActividad =
    actividadSeleccionada ||
    vol.actividadAsignada;

  if (
    !nombreActividad
  ) {

    alert(
      "Primero selecciona una actividad."
    );

    return;
  }

  const actividad =
    allActivities.find(
      act =>
        act.nombre ===
        nombreActividad
    );

  const fecha =
    actividad
      ? actividad.fecha
      : "Por confirmar";

  const horario =
    actividad
      ? actividad.horario
      : "Por confirmar";

  const lugar =
    actividad
      ? actividad.lugar
      : "Por confirmar";

  const mensaje =
`¡Hola ${
    vol.nombre ||
    "Voluntario"
  }! 👋

Te escribimos de PROVAY porque nos gustaría contar con tu participación en una actividad.

📌 Actividad: ${
    nombreActividad
  }

📅 Fecha: ${
    fecha
  }

⏰ Horario: ${
    horario
  }

📍 Lugar: ${
    lugar
  }

¿Te gustaría participar? Si estás disponible, confírmanos por este medio.

¡Muchas gracias por tu apoyo!`;

  const url =
    "https://wa.me/" +
    telefono +
    "?text=" +
    encodeURIComponent(
      mensaje
    );

  window.open(
    url,
    "_blank"
  );
}


/* =====================================================
   ASIGNAR
===================================================== */

async function asignarVoluntario(
  vol,
  select
) {

  const actividad =
    select.value;

  if (!actividad) {

    alert(
      "Por favor selecciona una actividad antes de hacer la asignación."
    );

    return;
  }

  vol.estado =
    "Asignado";

  vol.actividadAsignada =
    actividad;

  renderVolunteers(
    allVolunteers
  );

  renderActivities(
    allActivities
  );

  renderMonthCalendar();

  try {

    await fetch(
      GOOGLE_SCRIPT_URL,
      {

        method:
          "POST",

        mode:
          "no-cors",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({

            action:
              "asignar",

            id:
              vol.id,

            nombre:
              vol.nombre,

            actividad:
              actividad

          })
      }
    );

  } catch (error) {

    console.error(
      error
    );
  }
}


/* =====================================================
   ACTIVIDADES
===================================================== */

function renderActivities(
  activities
) {

  const container =
    document.getElementById(
      "eventsList"
    );

  if (!container) {
    return;
  }

  container.innerHTML =
    "";

  if (
    activities.length === 0
  ) {

    container.innerHTML = `
      <p
        style="
          color:#777;
          text-align:center;
          padding:20px;
        "
      >
        No hay actividades registradas.
      </p>
    `;

    return;
  }

  activities.forEach(
    act => {

      const total =
        allVolunteers.filter(
          v =>
            v.actividadAsignada ===
            act.nombre
        ).length;

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "item-row";

      row.innerHTML = `
        <div class="item-info">

          <h4>
            ${escapeHTML(
              act.nombre
            )}
          </h4>

          <p>

            📅
            ${escapeHTML(
              act.fecha ||
              "Por definir"
            )}

            |

            ⏰
            ${escapeHTML(
              act.horario ||
              "Por definir"
            )}

            |

            📍
            ${escapeHTML(
              act.lugar ||
              "Por confirmar"
            )}

            |

            👥
            ${total}
            voluntarios asignados

          </p>

        </div>

        <div class="actions-group">

          <button
            class="btn-black"
            type="button"
          >
            Gestionar Voluntarios (${total})
          </button>

          <button
            class="btn-danger"
            type="button"
          >
            Eliminar Evento
          </button>

        </div>
      `;

      const botones =
        row.querySelectorAll(
          "button"
        );

      botones[0].addEventListener(
        "click",
        function () {

          openViewVolunteersModal(
            act.nombre
          );

        }
      );

      botones[1].addEventListener(
        "click",
        function () {

          eliminarActividad(
            act.nombre
          );

        }
      );

      container.appendChild(
        row
      );

    }
  );
}


/* =====================================================
   OBTENER DÍAS DE DISPONIBILIDAD
===================================================== */

function obtenerDiasDisponibles(
  voluntario
) {

  /*
   * Aquí buscamos diferentes nombres de campo
   * por si Google Sheets lo está enviando
   * como dias, diasDisponibles, disponibilidad,
   * etc.
   */

  const posiblesCampos = [
    "diasDisponibles",
    "dias",
    "diasDisponibilidad",
    "disponibilidad",
    "diaDisponible",
    "dias_disponibles",
    "Dia",
    "Días",
    "Días disponibles"
  ];

  let valor = "";

  for (
    let i = 0;
    i < posiblesCampos.length;
    i++
  ) {

    const campo =
      posiblesCampos[i];

    if (
      voluntario[campo] !==
      undefined &&
      voluntario[campo] !==
      null &&
      String(
        voluntario[campo]
      ).trim() !== ""
    ) {

      valor =
        String(
          voluntario[campo]
        );

      break;
    }
  }


  /*
   * Si no encontró un campo separado,
   * intentamos obtener los días desde
   * horarios.
   *
   * Ejemplo:
   * "Lunes, Miércoles y Viernes 9:00-12:00"
   */

  if (!valor) {

    valor =
      String(
        voluntario.horarios ||
        ""
      );
  }


  valor =
    valor
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );


  /*
   * Si dice "todos los dias", realmente
   * sí está disponible todos los días.
   */

  if (
    valor.includes(
      "todos los dias"
    ) ||
    valor.includes(
      "diario"
    ) ||
    valor.includes(
      "cualquier dia"
    )
  ) {

    return [
      0,
      1,
      2,
      3,
      4,
      5,
      6
    ];
  }


  const diasEncontrados =
    [];


  const nombresDias = [
    {
      numero: 0,
      nombres: [
        "domingo"
      ]
    },
    {
      numero: 1,
      nombres: [
        "lunes"
      ]
    },
    {
      numero: 2,
      nombres: [
        "martes"
      ]
    },
    {
      numero: 3,
      nombres: [
        "miercoles"
      ]
    },
    {
      numero: 4,
      nombres: [
        "jueves"
      ]
    },
    {
      numero: 5,
      nombres: [
        "viernes"
      ]
    },
    {
      numero: 6,
      nombres: [
        "sabado"
      ]
    }
  ];


  nombresDias.forEach(
    dia => {

      dia.nombres.forEach(
        nombre => {

          if (
            valor.includes(
              nombre
            )
          ) {

            if (
              !diasEncontrados.includes(
                dia.numero
              )
            ) {

              diasEncontrados.push(
                dia.numero
              );
            }
          }

        }
      );

    }
  );


  /*
   * También aceptamos abreviaciones.
   */

  const abreviaciones = [
    {
      numero: 1,
      nombres: [
        "lun",
        "lu"
      ]
    },
    {
      numero: 2,
      nombres: [
        "mar",
        "ma"
      ]
    },
    {
      numero: 3,
      nombres: [
        "mie",
        "mi"
      ]
    },
    {
      numero: 4,
      nombres: [
        "jue",
        "ju"
      ]
    },
    {
      numero: 5,
      nombres: [
        "vie",
        "vi"
      ]
    },
    {
      numero: 6,
      nombres: [
        "sab",
        "sa"
      ]
    },
    {
      numero: 0,
      nombres: [
        "dom",
        "do"
      ]
    }
  ];


  abreviaciones.forEach(
    dia => {

      dia.nombres.forEach(
        abreviacion => {

          /*
           * Solo usamos abreviaciones si aparecen
           * como palabra independiente.
           */

          const regex =
            new RegExp(
              "(^|[^a-z])" +
              abreviacion +
              "([^a-z]|$)"
            );

          if (
            regex.test(
              valor
            )
          ) {

            if (
              !diasEncontrados.includes(
                dia.numero
              )
            ) {

              diasEncontrados.push(
                dia.numero
              );
            }
          }

        }
      );

    }
  );


  return diasEncontrados;
}


/* =====================================================
   VERIFICAR SI VOLUNTARIO ESTÁ DISPONIBLE
===================================================== */

function voluntarioDisponibleEseDia(
  voluntario,
  fecha
) {

  if (
    !voluntario ||
    !fecha
  ) {

    return false;
  }


  const fechaObjeto =
    new Date(
      fecha +
      "T12:00:00"
    );

  if (
    isNaN(
      fechaObjeto.getTime()
    )
  ) {

    return false;
  }


  const diaSemana =
    fechaObjeto.getDay();


  const diasDisponibles =
    obtenerDiasDisponibles(
      voluntario
    );


  /*
   * Si encontramos días registrados,
   * solamente aparece en esos días.
   */

  if (
    diasDisponibles.length >
    0
  ) {

    return diasDisponibles.includes(
      diaSemana
    );
  }


  /*
   * IMPORTANTE:
   * Si no existe información de días,
   * NO lo mostramos todos los días.
   */

  return false;
}


/* =====================================================
   CALENDARIO
===================================================== */

function renderMonthCalendar() {

  const calendar =
    document.getElementById(
      "monthCalendarGrid"
    );

  if (!calendar) {
    return;
  }


  calendar.innerHTML =
    "";


  /*
   * CALENDARIO GRANDE
   */

  calendar.style.width =
    "100%";

  calendar.style.minHeight =
    "650px";

  calendar.style.display =
    "grid";

  calendar.style.gridTemplateColumns =
    "repeat(7, minmax(0, 1fr))";

  calendar.style.gridAutoRows =
    "minmax(130px, auto)";

  calendar.style.gap =
    "8px";

  calendar.style.padding =
    "10px";

  calendar.style.boxSizing =
    "border-box";


  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth();


  const firstDay =
    new Date(
      year,
      month,
      1
    );

  const lastDay =
    new Date(
      year,
      month + 1,
      0
    );


  let startDay =
    firstDay.getDay();

  startDay =
    startDay === 0
      ? 6
      : startDay - 1;


  const totalDays =
    lastDay.getDate();


  /*
   * ENCABEZADOS
   */

  const nombresDias = [
    "LUN",
    "MAR",
    "MIÉ",
    "JUE",
    "VIE",
    "SÁB",
    "DOM"
  ];


  nombresDias.forEach(
    nombre => {

      const header =
        document.createElement(
          "div"
        );

      header.className =
        "calendar-weekday";

      header.textContent =
        nombre;

      header.style.fontWeight =
        "700";

      header.style.fontSize =
        "14px";

      header.style.textAlign =
        "center";

      header.style.padding =
        "12px 5px";

      header.style.background =
        "#f4f4f4";

      header.style.borderRadius =
        "10px";

      header.style.color =
        "#333";

      calendar.appendChild(
        header
      );

    }
  );


  /*
   * DÍAS VACÍOS
   */

  for (
    let i = 0;
    i < startDay;
    i++
  ) {

    const emptyDay =
      document.createElement(
        "div"
      );

    emptyDay.className =
      "calendar-day empty";

    emptyDay.style.minHeight =
      "130px";

    emptyDay.style.background =
      "#fafafa";

    emptyDay.style.borderRadius =
      "10px";

    emptyDay.style.border =
      "1px solid #eeeeee";

    calendar.appendChild(
      emptyDay
    );
  }


  /*
   * DÍAS DEL MES
   */

  for (
    let day = 1;
    day <= totalDays;
    day++
  ) {

    const dayElement =
      document.createElement(
        "div"
      );

    dayElement.className =
      "calendar-day";

    dayElement.style.minHeight =
      "130px";

    dayElement.style.background =
      "#ffffff";

    dayElement.style.border =
      "1px solid #e5e5e5";

    dayElement.style.borderRadius =
      "10px";

    dayElement.style.padding =
      "10px";

    dayElement.style.boxSizing =
      "border-box";

    dayElement.style.overflow =
      "hidden";

    dayElement.style.display =
      "flex";

    dayElement.style.flexDirection =
      "column";

    dayElement.style.gap =
      "5px";


    /*
     * NÚMERO
     */

    const dayNumber =
      document.createElement(
        "div"
      );

    dayNumber.className =
      "calendar-day-number";

    dayNumber.textContent =
      day;

    dayNumber.style.fontSize =
      "18px";

    dayNumber.style.fontWeight =
      "700";

    dayNumber.style.marginBottom =
      "5px";


    dayElement.appendChild(
      dayNumber
    );


    /*
     * FECHA EXACTA
     */

    const fechaDia =
      year +
      "-" +
      String(
        month + 1
      ).padStart(
        2,
        "0"
      ) +
      "-" +
      String(
        day
      ).padStart(
        2,
        "0"
      );


    /* =================================================
       ACTIVIDADES
    ================================================= */


    const actividadesDia =
      (allActivities || [])
        .filter(
          function (
            actividad
          ) {

            if (
              !actividad ||
              !actividad.fecha
            ) {

              return false;
            }


            /*
             * NORMALIZAMOS LA FECHA
             * OTRA VEZ PARA ASEGURARNOS.
             */

            const fechaActividad =
              normalizarFecha(
                actividad.fecha
              );


            console.log(
              "Comparando actividad:",
              actividad.nombre,
              fechaActividad,
              "con",
              fechaDia
            );


            return (
              fechaActividad ===
              fechaDia
            );

          }
        );


    /*
     * MOSTRAR CADA ACTIVIDAD
     */

    actividadesDia.forEach(
      function (
        actividad
      ) {

        const actividadElement =
          document.createElement(
            "div"
          );

        actividadElement.className =
          "calendar-event";

        actividadElement.style.background =
          "#111";

        actividadElement.style.color =
          "#fff";

        actividadElement.style.borderRadius =
          "7px";

        actividadElement.style.padding =
          "8px";

        actividadElement.style.fontSize =
          "12px";

        actividadElement.style.fontWeight =
          "600";

        actividadElement.style.lineHeight =
          "1.3";

        actividadElement.style.cursor =
          "pointer";

        actividadElement.style.wordBreak =
          "break-word";


        /*
         * NOMBRE
         */

        const nombreEvento =
          document.createElement(
            "div"
          );

        nombreEvento.textContent =
          "📌 " +
          (
            actividad.nombre ||
            "Actividad"
          );

        nombreEvento.style.fontWeight =
          "700";

        actividadElement.appendChild(
          nombreEvento
        );


        /*
         * HORARIO
         */

        if (
          actividad.horario
        ) {

          const horarioEvento =
            document.createElement(
              "div"
            );

          horarioEvento.textContent =
            "⏰ " +
            actividad.horario;

          horarioEvento.style.fontWeight =
            "400";

          actividadElement.appendChild(
            horarioEvento
          );
        }


        /*
         * LUGAR
         */

        if (
          actividad.lugar
        ) {

          const lugarEvento =
            document.createElement(
              "div"
            );

          lugarEvento.textContent =
            "📍 " +
            actividad.lugar;

          lugarEvento.style.fontWeight =
            "400";

          actividadElement.appendChild(
            lugarEvento
          );
        }


        /*
         * TOOLTIP
         */

        actividadElement.title =
          (
            actividad.nombre ||
            "Actividad"
          ) +
          (
            actividad.horario
              ? " • " +
                actividad.horario
              : ""
          ) +
          (
            actividad.lugar
              ? " • " +
                actividad.lugar
              : ""
          );


        dayElement.appendChild(
          actividadElement
        );


        /* =============================================
           VOLUNTARIOS ASIGNADOS
        ============================================= */

        const voluntariosActividad =
          (
            allVolunteers ||
            []
          ).filter(
            function (
              voluntario
            ) {

              return (
                voluntario.actividadAsignada &&
                String(
                  voluntario.actividadAsignada
                )
                  .trim()
                  .toLowerCase() ===
                String(
                  actividad.nombre
                )
                  .trim()
                  .toLowerCase()
              );

            }
          );


        if (
          voluntariosActividad.length >
          0
        ) {

          const titulo =
            document.createElement(
              "div"
            );

          titulo.textContent =
            "👥 Voluntarios:";

          titulo.style.fontSize =
            "11px";

          titulo.style.fontWeight =
            "700";

          titulo.style.color =
            "#333";

          titulo.style.marginTop =
            "2px";

          dayElement.appendChild(
            titulo
          );
        }


        voluntariosActividad.forEach(
          function (
            voluntario
          ) {

            const voluntarioElement =
              document.createElement(
                "div"
              );

            voluntarioElement.className =
              "calendar-volunteer";

            voluntarioElement.textContent =
              "• " +
              (
                voluntario.nombre ||
                "Voluntario"
              );

            voluntarioElement.style.background =
              "#e8f7ee";

            voluntarioElement.style.color =
              "#16834b";

            voluntarioElement.style.borderRadius =
              "6px";

            voluntarioElement.style.padding =
              "5px 6px";

            voluntarioElement.style.fontSize =
              "11px";

            voluntarioElement.style.fontWeight =
              "600";

            voluntarioElement.style.wordBreak =
              "break-word";


            /*
             * MOSTRAR DISPONIBILIDAD
             * SOLO DEL VOLUNTARIO ASIGNADO
             */

            voluntarioElement.title =
              (
                voluntario.nombre ||
                "Voluntario"
              ) +
              (
                voluntario.horarios
                  ? " • Disponible: " +
                    voluntario.horarios
                  : ""
              );


            dayElement.appendChild(
              voluntarioElement
            );

          }
        );

      }
    );


    /* =================================================
       DISPONIBILIDAD DE VOLUNTARIOS
       SOLO EN SUS DÍAS REGISTRADOS
    ================================================= */


    const voluntariosDisponibles =
      (
        allVolunteers ||
        []
      ).filter(
        function (
          voluntario
        ) {

          return voluntarioDisponibleEseDia(
            voluntario,
            fechaDia
          );

        }
      );


    /*
     * Mostrar disponibilidad únicamente
     * cuando NO esté asignado a una actividad
     * en ese día.
     */

    const voluntariosLibres =
      voluntariosDisponibles.filter(
        function (
          voluntario
        ) {

          /*
           * Si está asignado a una actividad
           * que ocurre ese día, ya aparecerá
           * dentro de esa actividad.
           */

          const actividadAsignada =
            allActivities.find(
              function (
                actividad
              ) {

                return (
                  actividad.nombre ===
                  voluntario.actividadAsignada &&
                  normalizarFecha(
                    actividad.fecha
                  ) ===
                  fechaDia
                );

              }
            );


          return !actividadAsignada;
        }
      );


    /*
     * Mostrar disponibilidad
     */

    if (
      voluntariosLibres.length >
      0
    ) {

      const tituloDisponibilidad =
        document.createElement(
          "div"
        );

      tituloDisponibilidad.textContent =
        "🟢 Disponibles";

      tituloDisponibilidad.style.fontSize =
        "11px";

      tituloDisponibilidad.style.fontWeight =
        "700";

      tituloDisponibilidad.style.color =
        "#16834b";

      tituloDisponibilidad.style.marginTop =
        "4px";


      dayElement.appendChild(
        tituloDisponibilidad
      );


      /*
       * Mostrar máximo 5
       */

      voluntariosLibres
        .slice(
          0,
          5
        )
        .forEach(
          function (
            voluntario
          ) {

            const disponibilidad =
              document.createElement(
                "div"
              );

            disponibilidad.className =
              "calendar-availability";

            disponibilidad.textContent =
              "• " +
              (
                voluntario.nombre ||
                "Voluntario"
              ) +
              (
                voluntario.horarios
                  ? " · " +
                    voluntario.horarios
                  : ""
              );

            disponibilidad.style.background =
              "#f5faf7";

            disponibilidad.style.color =
              "#16834b";

            disponibilidad.style.border =
              "1px solid #dcefe4";

            disponibilidad.style.borderRadius =
              "5px";

            disponibilidad.style.padding =
              "4px 5px";

            disponibilidad.style.fontSize =
              "10px";

            disponibilidad.style.lineHeight =
              "1.2";

            disponibilidad.style.wordBreak =
              "break-word";


            disponibilidad.title =
              (
                voluntario.nombre ||
                "Voluntario"
              ) +
              " • Disponible " +
              (
                voluntario.horarios ||
                ""
              );


            dayElement.appendChild(
              disponibilidad
            );

          }
        );


      if (
        voluntariosLibres.length >
        5
      ) {

        const mas =
          document.createElement(
            "div"
          );

        mas.textContent =
          "+" +
          (
            voluntariosLibres.length -
            5
          ) +
          " voluntarios";

        mas.style.fontSize =
          "10px";

        mas.style.color =
          "#888";

        mas.style.padding =
          "3px";


        dayElement.appendChild(
          mas
        );
      }
    }


    /*
     * DESTACAR HOY
     */

    const hoy =
      new Date();

    const fechaHoy =
      hoy.getFullYear() +
      "-" +
      String(
        hoy.getMonth() + 1
      ).padStart(
        2,
        "0"
      ) +
      "-" +
      String(
        hoy.getDate()
      ).padStart(
        2,
        "0"
      );


    if (
      fechaDia ===
      fechaHoy
    ) {

      dayElement.style.border =
        "2px solid #111";

      dayNumber.style.background =
        "#111";

      dayNumber.style.color =
        "#fff";

      dayNumber.style.width =
        "30px";

      dayNumber.style.height =
        "30px";

      dayNumber.style.display =
        "flex";

      dayNumber.style.alignItems =
        "center";

      dayNumber.style.justifyContent =
        "center";

      dayNumber.style.borderRadius =
        "50%";
    }


    calendar.appendChild(
      dayElement
    );

  }


  /*
   * ESTILOS RESPONSIVOS
   */

  if (
    !document.getElementById(
      "calendarResponsiveStyles"
    )
  ) {

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "calendarResponsiveStyles";

    style.textContent = `

      #monthCalendarGrid {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }

      #monthCalendarGrid .calendar-day:hover {
        box-shadow: 0 3px 10px rgba(0,0,0,0.08);
        transform: translateY(-1px);
      }

      #monthCalendarGrid .calendar-day {
        transition: all 0.15s ease;
      }

      @media (max-width: 900px) {

        #monthCalendarGrid {
          grid-template-columns:
            repeat(7, minmax(100px, 1fr))
            !important;

          overflow-x: auto;
        }

        #monthCalendarGrid .calendar-day {
          min-width: 100px !important;
        }

      }

    `;

    document.head.appendChild(
      style
    );
  }
}


/* =====================================================
   CREAR ACTIVIDAD
===================================================== */

async function saveActivity() {

  const nombre =
    document.getElementById(
      "actNombre"
    ).value.trim();

  const fecha =
    document.getElementById(
      "actFecha"
    ).value;

  const inicio =
    document.getElementById(
      "actHoraInicio"
    ).value;

  const fin =
    document.getElementById(
      "actHoraFin"
    ).value;

  const lugar =
    document.getElementById(
      "actLugar"
    ).value.trim() ||
    "Por confirmar";


  if (
    !nombre ||
    !fecha ||
    !inicio ||
    !fin
  ) {

    alert(
      "Por favor completa los campos obligatorios."
    );

    return;
  }


  const horario =
    formatTime12h(
      inicio
    ) +
    " - " +
    formatTime12h(
      fin
    );


  const actividad = {

    nombre:
      nombre,

    fecha:
      fecha,

    horario:
      horario,

    lugar:
      lugar,

    asignados:
      0

  };


  allActivities.push(
    actividad
  );


  renderVolunteers(
    allVolunteers
  );

  renderActivities(
    allActivities
  );

  renderMonthCalendar();

  closeActivityModal();


  try {

    await fetch(
      GOOGLE_SCRIPT_URL,
      {

        method:
          "POST",

        mode:
          "no-cors",

        headers: {

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify({

            action:
              "crearActividad",

            actividad:
              actividad

          })

      }
    );

  } catch (error) {

    console.error(
      "Error guardando actividad:",
      error
    );
  }
}


/* =====================================================
   MODALES
===================================================== */

function openActivityModal() {

  document
    .getElementById(
      "activityModal"
    )
    .classList.add(
      "active"
    );
}


function closeActivityModal() {

  document
    .getElementById(
      "activityModal"
    )
    .classList.remove(
      "active"
    );

  document
    .getElementById(
      "activityForm"
    )
    .reset();
}


function openViewVolunteersModal(
  actividadNombre
) {

  const modal =
    document.getElementById(
      "viewVolunteersModal"
    );

  const title =
    document.getElementById(
      "viewVolModalTitle"
    );

  const list =
    document.getElementById(
      "viewVolunteersModalList"
    );

  title.innerText =
    "Voluntarios en: " +
    actividadNombre;

  list.innerHTML =
    "";


  const asignados =
    allVolunteers.filter(
      v =>
        v.actividadAsignada ===
        actividadNombre
    );


  if (
    asignados.length ===
    0
  ) {

    list.innerHTML = `
      <p
        style="
          color:#777;
          text-align:center;
          padding:20px;
        "
      >
        No hay voluntarios asignados.
      </p>
    `;

  } else {

    asignados.forEach(
      v => {

        const item =
          document.createElement(
            "div"
          );

        item.className =
          "vol-list-modal-item";

        item.innerHTML = `
          <div>

            <strong>
              ${escapeHTML(
                v.nombre
              )}
            </strong>

            <div
              style="
                font-size:11px;
                color:#666;
              "
            >

              ⏰ Disp:
              ${escapeHTML(
                v.horarios ||
                "No especificado"
              )}

            </div>

          </div>

          <button
            class="btn-danger"
          >
            Quitar
          </button>
        `;


        item
          .querySelector(
            ".btn-danger"
          )
          .addEventListener(
            "click",
            function () {

              desasignarVoluntario(
                v.id,
                v.nombre
              );

            }
          );


        list.appendChild(
          item
        );

      }
    );
  }


  modal.classList.add(
    "active"
  );
}


function closeViewVolunteersModal() {

  document
    .getElementById(
      "viewVolunteersModal"
    )
    .classList.remove(
      "active"
    );
}


/* =====================================================
   DESASIGNAR
===================================================== */

async function desasignarVoluntario(
  id,
  nombre
) {

  const vol =
    allVolunteers.find(
      v =>
        String(v.id) ===
        String(id)
        ||
        String(v.nombre) ===
        String(nombre)
    );


  if (!vol) {
    return;
  }


  const actividad =
    vol.actividadAsignada;


  vol.estado =
    "Pendiente";

  vol.actividadAsignada =
    "";


  renderVolunteers(
    allVolunteers
  );

  renderActivities(
    allActivities
  );

  renderMonthCalendar();


  openViewVolunteersModal(
    actividad
  );


  try {

    await fetch(
      GOOGLE_SCRIPT_URL,
      {

        method:
          "POST",

        mode:
          "no-cors",

        headers: {

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify({

            action:
              "desasignar",

            id:
              id,

            nombre:
              nombre

          })

      }
    );

  } catch (error) {

    console.error(
      error
    );
  }
}


/* =====================================================
   ELIMINAR ACTIVIDAD
===================================================== */

async function eliminarActividad(
  nombre
) {

  if (
    !confirm(
      '¿Eliminar la actividad "' +
      nombre +
      '"?'
    )
  ) {

    return;
  }


  allVolunteers.forEach(
    v => {

      if (
        v.actividadAsignada ===
        nombre
      ) {

        v.estado =
          "Pendiente";

        v.actividadAsignada =
          "";
      }

    }
  );


  allActivities =
    allActivities.filter(
      act =>
        act.nombre !==
        nombre
    );


  renderVolunteers(
    allVolunteers
  );

  renderActivities(
    allActivities
  );

  renderMonthCalendar();


  try {

    await fetch(
      GOOGLE_SCRIPT_URL,
      {

        method:
          "POST",

        mode:
          "no-cors",

        headers: {

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify({

            action:
              "eliminarActividad",

            nombre:
              nombre

          })

      }
    );

  } catch (error) {

    console.error(
      error
    );
  }
}


/* =====================================================
   CAMBIAR MES
===================================================== */

function changeMonth(
  direction
) {

  currentDate.setMonth(
    currentDate.getMonth() +
    direction
  );

  renderMonthCalendar();
}


/* =====================================================
   BUSCADOR
===================================================== */

function filterVolunteers() {

  const input =
    document.getElementById(
      "searchVolunteers"
    );

  const query =
    input.value
      .toLowerCase();


  const filtrados =
    allVolunteers.filter(
      vol =>
        (
          vol.nombre &&
          vol.nombre
            .toLowerCase()
            .includes(
              query
            )
        )
        ||
        (
          vol.actividadAsignada &&
          vol.actividadAsignada
            .toLowerCase()
            .includes(
              query
            )
        )
        ||
        (
          vol.horarios &&
          vol.horarios
            .toLowerCase()
            .includes(
              query
            )
        )
    );


  renderVolunteers(
    filtrados
  );
}


/* =====================================================
   SEGURIDAD
===================================================== */

function escapeHTML(
  texto
) {

  return String(
    texto || ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );
}
