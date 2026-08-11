const params =
  new URLSearchParams(
    window.location.search
  );


const CUARTEL =
  params.get("cuartel") ||
  "2";


let unidadSeleccionada =
  null;


let tipoConductorSeleccionado =
  "principal";


/* ==========================================
   TÍTULO DEL CUARTEL
=========================================== */

document
  .getElementById("titulo")
  .innerText =

  CONFIG.CUARTELES[
    CUARTEL
  ]

  ||

  "Control de Cuartel";


/* ==========================================
   LOGO DEL CUARTEL
=========================================== */

const logoCuartel =
  document
    .getElementById(
      "logoCuartel"
    );


if (
  CONFIG.LOGOS &&
  CONFIG.LOGOS[CUARTEL]
) {

  logoCuartel.src =
    CONFIG.LOGOS[
      CUARTEL
    ];


  logoCuartel.onerror =
    () => {

      logoCuartel.style.display =
        "none";

    };

} else {

  logoCuartel.style.display =
    "none";

}


/* ==========================================
   ENTER PARA REGISTRAR
=========================================== */

document
  .getElementById(
    "inputIngreso"
  )
  .addEventListener(

    "keydown",

    event => {

      if (
        event.key === "Enter"
      ) {

        registrar();

      }

    }

  );


/* ==========================================
   CARGAR PANEL
=========================================== */

async function cargarPanel() {

  try {

    const data =
      await api(

        "action=panel" +

        "&cuartel=" +

        encodeURIComponent(
          CUARTEL
        )

      );


    if (!data.ok) {

      mensaje(
        "Error al cargar panel",
        "red"
      );

      return;

    }


    document
      .getElementById(
        "contadorDisponibles"
      )
      .innerText =
      data.disponibles;


    renderUnidades(
      data.unidades || []
    );


    renderBomberos(
      data.bomberos || []
    );


  } catch (error) {

    console.error(error);

    mensaje(
      "Sin conexión con la base de datos",
      "red"
    );

  }

}


/* ==========================================
   REGISTRAR ENTRADA / SALIDA
=========================================== */

async function registrar() {

  const input =
    document
      .getElementById(
        "inputIngreso"
      );


  const valor =
    input.value.trim();


  if (!valor) {
    return;
  }


  mensaje(
    "Procesando...",
    "#444"
  );


  try {

    const data =
      await api(

        "action=registrar" +

        "&input=" +

        encodeURIComponent(
          valor
        ) +

        "&cuartel=" +

        encodeURIComponent(
          CUARTEL
        )

      );


    mensaje(

      data.mensaje,

      data.ok
        ? "green"
        : "red"

    );


    input.value =
      "";


    input.focus();


    cargarPanel();


  } catch (error) {

    console.error(error);

    mensaje(
      "Error de conexión",
      "red"
    );

  }

}


/* ==========================================
   CAMBIAR ESTADO BOMBERO
=========================================== */

async function cambiarEstadoBombero(
  registro
) {

  const card =
    document.querySelector(

      `[data-registro="${registro}"]`

    );


  if (!card) {
    return;
  }


  const estadoDiv =
    card.querySelector(
      ".estado"
    );


  const actual =
    estadoDiv
      .innerText
      .trim();


  let index =
    CONFIG
      .ESTADOS_BOMBERO
      .indexOf(
        actual
      );


  if (index === -1) {
    index = 0;
  }


  const nuevo =

    CONFIG
      .ESTADOS_BOMBERO[
        (index + 1) %
        CONFIG
          .ESTADOS_BOMBERO
          .length
      ];


  /*
   * Cambio visual inmediato.
   */

  card.className =

    "bombero " +

    claseEstadoBombero(
      nuevo
    );


  estadoDiv.innerText =
    nuevo;


  /*
   * IMPORTANTE:
   *
   * Recalculamos sin contar
   * cuarteleros.
   */

  actualizarContadorLocal();


  try {

    const data =
      await api(

        "action=cambiarEstadoBombero" +

        "&registro=" +

        encodeURIComponent(
          registro
        )

      );


    if (!data.ok) {

      mensaje(
        data.mensaje,
        "red"
      );


      cargarPanel();

      return;

    }


    mensaje(
      "Estado actualizado",
      "green"
    );


    /*
     * Al cambiar de disponible,
     * puede quitarse como conductor.
     * Recargamos las unidades.
     */

    if (
      nuevo !== "Disponible"
    ) {

      cargarPanel();

    }


  } catch (error) {

    console.error(error);

    cargarPanel();

  }

}


/* ==========================================
   RENDER BOMBEROS
=========================================== */

function renderBomberos(
  bomberos
) {

  const contenedor =
    document
      .getElementById(
        "personal"
      );


  contenedor.innerHTML =
    "";


  bomberos.forEach(
    bombero => {


      const div =
        document.createElement(
          "div"
        );


      div.className =

        "bombero " +

        claseEstadoBombero(
          bombero.estado
        );


      div.dataset.registro =
        bombero.registro;


      /*
       * Guardamos si es cuartelero
       * para el contador local.
       */

      div.dataset.cuartelero =

        bombero.esCuartelero

          ? "SI"

          : "NO";


      div.onclick =
        () =>
          cambiarEstadoBombero(
            bombero.registro
          );


      div.innerHTML = `

        <img
          src="${
            bombero.foto ||
            CONFIG.FOTO_DEFAULT
          }"
          onerror="
            this.onerror=null;
            this.src='${CONFIG.FOTO_DEFAULT}'
          "
        >

        <div class="bombero-info">

          <div class="nombre">

            ${bombero.nombre}

          </div>

          <div class="cargo">

            ${bombero.cargo || ""}

          </div>


          ${
            bombero.esCuartelero

              ? `
                <div class="etiqueta-cuartelero">
                  CUARTELERO
                </div>
              `

              : ""
          }


          <div class="estado">

            ${bombero.estado}

          </div>

        </div>

      `;


      contenedor.appendChild(
        div
      );

    }

  );

}


/* ==========================================
   RENDER UNIDADES
=========================================== */

function renderUnidades(
  unidades
) {

  const contenedor =
    document
      .getElementById(
        "unidades"
      );


  contenedor.innerHTML =
    "";


  unidades.forEach(
    unidad => {


      const div =
        document.createElement(
          "div"
        );


      div.className =

        "unidad " +

        claseEstadoUnidad(
          unidad.estado
        );


      div.onclick =
        () =>
          abrirModalUnidad(
            unidad
          );


      div.innerHTML = `

        <h2>

          ${unidad.unidad}

        </h2>


        <div class="estado-unidad">

          ${unidad.estado}

        </div>


        <div class="conductores">

          <strong>
            Principal:
          </strong>

          <br>

          ${
            unidad.principalNombre ||
            "-"
          }

          <br>

          <strong>
            Secundario:
          </strong>

          <br>

          ${
            unidad.secundarioNombre ||
            "-"
          }

        </div>

      `;


      contenedor.appendChild(
        div
      );

    }

  );

}


/* ==========================================
   ABRIR MODAL UNIDAD
=========================================== */

function abrirModalUnidad(
  unidad
) {

  unidadSeleccionada =
    unidad;


  document
    .getElementById(
      "modalTitulo"
    )
    .innerText =

    unidad.unidad +

    " - " +

    unidad.estado;


  document
    .getElementById(
      "listaConductores"
    )
    .style.display =
    "none";


  document
    .getElementById(
      "listaConductores"
    )
    .innerHTML =
    "";


  document
    .getElementById(
      "modalFondo"
    )
    .style.display =
    "flex";

}


/* ==========================================
   CERRAR MODAL
=========================================== */

function cerrarModal() {

  document
    .getElementById(
      "modalFondo"
    )
    .style.display =
    "none";


  unidadSeleccionada =
    null;

}


/* ==========================================
   MOSTRAR CONDUCTORES
=========================================== */

async function mostrarConductores(
  tipo
) {

  tipoConductorSeleccionado =
    tipo;


  if (!unidadSeleccionada) {
    return;
  }


  if (
    unidadSeleccionada.estado ===
    "Fuera de servicio"
  ) {

    mensaje(
      "La unidad está fuera de servicio",
      "red"
    );

    return;

  }


  const lista =
    document
      .getElementById(
        "listaConductores"
      );


  lista.style.display =
    "block";


  lista.innerHTML =
    "Cargando conductores habilitados...";


  try {

    const data =
      await api(

        "action=conductoresDisponibles" +

        "&unidad=" +

        encodeURIComponent(
          unidadSeleccionada.unidad
        ) +

        "&cuartel=" +

        encodeURIComponent(
          CUARTEL
        )

      );


    if (
      !data.ok ||
      !data.conductores ||
      data.conductores.length === 0
    ) {

      lista.innerHTML =

        "<strong>" +

        "No hay conductores disponibles " +

        "habilitados para esta unidad." +

        "</strong>";

      return;

    }


    lista.innerHTML =
      "";


    data.conductores.forEach(
      conductor => {


        const item =
          document.createElement(
            "div"
          );


        item.className =
          "conductor-item";


        item.onclick =
          () =>
            asignarConductor(
              conductor.registro
            );


        item.innerHTML = `

          <img
            src="${
              conductor.foto ||
              CONFIG.FOTO_DEFAULT
            }"
            onerror="
              this.onerror=null;
              this.src='${CONFIG.FOTO_DEFAULT}'
            "
          >

          <div>

            <strong>

              ${conductor.nombre}

            </strong>

            <br>

            <small>

              ${conductor.cargo || ""}

            </small>

          </div>

        `;


        lista.appendChild(
          item
        );

      }

    );


  } catch (error) {

    console.error(error);

    lista.innerHTML =
      "Error cargando conductores.";

  }

}


/* ==========================================
   ASIGNAR CONDUCTOR
=========================================== */

async function asignarConductor(
  registro
) {

  if (!unidadSeleccionada) {
    return;
  }


  const data =
    await api(

      "action=asignarConductor" +

      "&unidad=" +

      encodeURIComponent(
        unidadSeleccionada.unidad
      ) +

      "&registro=" +

      encodeURIComponent(
        registro
      ) +

      "&tipo=" +

      encodeURIComponent(
        tipoConductorSeleccionado
      )

    );


  mensaje(

    data.mensaje,

    data.ok
      ? "green"
      : "red"

  );


  cerrarModal();

  cargarPanel();

}


/* ==========================================
   QUITAR CONDUCTOR
=========================================== */

async function quitarConductorModal(
  tipo
) {

  if (!unidadSeleccionada) {
    return;
  }


  const data =
    await api(

      "action=quitarConductor" +

      "&unidad=" +

      encodeURIComponent(
        unidadSeleccionada.unidad
      ) +

      "&tipo=" +

      encodeURIComponent(
        tipo
      )

    );


  mensaje(

    data.mensaje,

    data.ok
      ? "green"
      : "red"

  );


  cerrarModal();

  cargarPanel();

}


/* ==========================================
   FUERA DE SERVICIO
=========================================== */

async function marcarFueraServicio() {

  if (!unidadSeleccionada) {
    return;
  }


  const confirmar =
    confirm(

      "¿Marcar " +

      unidadSeleccionada.unidad +

      " fuera de servicio?"

    );


  if (!confirmar) {
    return;
  }


  const data =
    await api(

      "action=cambiarEstadoUnidad" +

      "&unidad=" +

      encodeURIComponent(
        unidadSeleccionada.unidad
      ) +

      "&estado=" +

      encodeURIComponent(
        "Fuera de servicio"
      )

    );


  mensaje(

    data.mensaje,

    data.ok
      ? "green"
      : "red"

  );


  cerrarModal();

  cargarPanel();

}


/* ==========================================
   HABILITAR SIN CONDUCTOR
=========================================== */

async function habilitarSinConductor() {

  if (!unidadSeleccionada) {
    return;
  }


  const data =
    await api(

      "action=cambiarEstadoUnidad" +

      "&unidad=" +

      encodeURIComponent(
        unidadSeleccionada.unidad
      ) +

      "&estado=" +

      encodeURIComponent(
        "Sin conductor"
      )

    );


  mensaje(

    data.mensaje,

    data.ok
      ? "green"
      : "red"

  );


  cerrarModal();

  cargarPanel();

}


/* ==========================================
   CONTADOR LOCAL
=========================================== */

function actualizarContadorLocal() {

  const tarjetas =

    Array.from(

      document.querySelectorAll(
        ".bombero"
      )

    );


  const disponibles =

    tarjetas.filter(
      tarjeta => {


        const estado =

          tarjeta
            .querySelector(
              ".estado"
            )
            ?.innerText
            .trim();


        const cuartelero =

          tarjeta
            .dataset
            .cuartelero ===
          "SI";


        /*
         * El cuartelero NO suma.
         */

        return (

          estado ===
            "Disponible" &&

          !cuartelero

        );

      }

    ).length;


  document
    .getElementById(
      "contadorDisponibles"
    )
    .innerText =
    disponibles;

}


/* ==========================================
   INICIAR
=========================================== */

iniciarReloj();

cargarPanel();


setInterval(

  cargarPanel,

  15000

);
