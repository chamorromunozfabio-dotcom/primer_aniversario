/* Nuestro año — el motor de los minijuegos.
   https://developer.mozilla.org/es/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes

   Este archivo es la maquinaria común: el tablero con las tarjetas, el menú
   para elegir a quién se le juega, el marcador, el reloj y el podio.

   Los seis juegos viven en juegos-lista.js y se dan de alta con registrar().
   Cada juego es un objeto con esta forma:

     {
       id, titulo, resumen, icono, teclas, tema, duracion,
       iniciar(api) {
         return {
           actualizar(dt, teclas, api, t),   // unas 60 veces por segundo
           dibujar(g, api, t),               // justo después de actualizar
           alPulsar(tecla, api),             // opcional
           alTocar(x, y, api),               // opcional, para el celular
           alDestruir()                      // opcional, para limpiar
         };
       }
     }

   Para agregar un séptimo juego: escríbelo en juegos-lista.js con un id que no
   se repita. Acá no hay que tocar nada, el tablero lo encuentra solo. */
(function () {
  "use strict";

  const NS_SVG = "http://www.w3.org/2000/svg";
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* Los otros archivos se cargan antes que este, así que ya están en la
     pantalla cuando arrancamos. Se leen una sola vez acá para no repetir
     `window.` en todo el archivo y para que quede claro qué hace falta. */
  const audio = window.AudioJuego;
  const Sprites = window.Sprites;

  const completar = (el, props, hijos) => {
    if (props) {
      Object.keys(props).forEach((clave) => {
        const valor = props[clave];
        if (valor === null || valor === undefined || valor === false) return;
        if (clave === "text") el.textContent = valor;
        else if (clave === "dataset") Object.assign(el.dataset, valor);
        else if (clave === "escuchar") el.addEventListener(props.escuchar, valor);
        else if (clave.startsWith("--")) el.style.setProperty(clave, valor);
        else el.setAttribute(clave, valor === true ? "" : valor);
      });
    }
    (hijos || []).forEach((hijo) => el.append(hijo));
    return el;
  };

  const crear = (etiqueta, props, hijos) => completar(document.createElement(etiqueta), props, hijos);

  const crearSvg = (etiqueta, props, hijos) =>
    completar(document.createElementNS(NS_SVG, etiqueta), props, hijos);

  const icono = (id, clase) =>
    crearSvg("svg", { class: clase || "", "aria-hidden": "true", focusable: "false" }, [
      crearSvg("use", { href: "#" + id })
    ]);

  /* Un emoji suelto, con la misma forma que un icono pero para el texto. */
  const glifo = (texto) => crear("span", { class: "glifo", "aria-hidden": "true", text: texto });

  const prefersMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ==========================================================
     1. Utilidades que usan los seis juegos
     ========================================================== */

  /* Un corazón con curvas, que es la moneda de varios juegos. Se usa siempre
     esta función para que todos los corazones se vean iguales. */
  function corazon(g, x, y, tam, color) {
    g.save();
    g.translate(x, y);
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(0, tam * 0.9);
    g.bezierCurveTo(-tam * 1.5, -tam * 0.1, -tam * 0.7, -tam * 1.2, 0, -tam * 0.45);
    g.bezierCurveTo(tam * 0.7, -tam * 1.2, tam * 1.5, -tam * 0.1, 0, tam * 0.9);
    g.closePath();
    g.fill();
    g.restore();
  }

  /* El fondo de todos los juegos: un cielo degradado con una luz arriba. Es
     siempre el mismo para que los seis se sientan de la misma familia. */
  function noche(g, ancho, alto, colorArriba, colorAbajo, alturaLuz) {
    const cielo = g.createLinearGradient(0, 0, 0, alto);
    cielo.addColorStop(0, colorArriba);
    cielo.addColorStop(1, colorAbajo);
    g.fillStyle = cielo;
    g.fillRect(0, 0, ancho, alto);

    const luz = g.createRadialGradient(
      ancho / 2, alto * (alturaLuz === undefined ? 0.7 : alturaLuz), 8,
      ancho / 2, alto * (alturaLuz === undefined ? 0.7 : alturaLuz), alto * 0.8
    );
    luz.addColorStop(0, "rgba(242, 221, 176, 0.22)");
    luz.addColorStop(1, "rgba(242, 221, 176, 0)");
    g.fillStyle = luz;
    g.fillRect(0, 0, ancho, alto);
  }

  /* Escribe un texto partido en varias líneas para que quepa en un ancho dado.
     Devuelve el alto que ocupó, para poder seguir escribiendo debajo. */
  function parrafo(g, texto, x, y, anchoMax, altoLinea, alineacion) {
    const palabras = String(texto).split(" ");
    const alineado = alineacion || "center";
    let linea = "";
    let cursor = y;
    let lineas = 0;

    g.textAlign = alineado;
    g.textBaseline = "alphabetic";

    const escribir = (contenido) => {
      const margen = alineado === "center" ? 0 : alineado === "right" ? x - anchoMax : x;
      g.fillText(contenido, alineado === "center" ? x : margen, cursor);
      cursor += altoLinea;
      lineas++;
    };

    for (const palabra of palabras) {
      const prueba = linea ? linea + " " + palabra : palabra;
      if (g.measureText(prueba).width > anchoMax && linea) {
        escribir(linea);
        linea = palabra;
      } else {
        linea = prueba;
      }
    }
    if (linea) escribir(linea);

    return lineas * altoLinea;
  }

  /* Baraja un array sin tocar el original (el truco de Fisher-Yates). */
  function mezclar(lista) {
    const copia = lista.slice();
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const guardado = copia[i];
      copia[i] = copia[j];
      copia[j] = guardado;
    }
    return copia;
  }

  /* Elige un objeto al azar según un peso. Se usa para que no salga siempre lo
     mismo: los corazones buenos son más comunes que los malos. */
  function alPeso(opciones) {
    const total = opciones.reduce((suma, o) => suma + o.peso, 0);
    let n = Math.random() * total;
    for (const opcion of opciones) {
      n -= opcion.peso;
      if (n <= 0) return opcion;
    }
    return opciones[opciones.length - 1];
  }

  /* Cache de imágenes. Las fotos de la galería se piden una sola vez y se
     quedan, así no se descargan de nuevo cada vez que entra al juego. */
  const imagenes = {};

  function foto(src) {
    if (!src) return null;
    if (!imagenes[src]) {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      imagenes[src] = img;
    }
    return imagenes[src];
  }

  /* Las mismas fotos que están en la galería de arriba, leídas del DOM que ya
     pintó script.js. Así la memoria de fotos nunca queda desactualizada. */
  function fotosDelSitio() {
    const vistas = $$(".galeria__item img")
      .map((img) => ({ src: img.getAttribute("src"), titulo: img.getAttribute("alt") || "" }))
      .filter((f) => f.src);

    if (vistas.length >= 4) return vistas;
    return [
      { src: "img/foto1.jpg", titulo: "" },
      { src: "img/foto2.jpg", titulo: "" },
      { src: "img/foto4.jpg", titulo: "" },
      { src: "img/foto5.jpg", titulo: "" }
    ];
  }

  /* ==========================================================
     2. El tablero de tarjetas
     ========================================================== */

  const juegos = [];

  /* Da de alta un juego. Lo llama cada objeto de juegos-lista.js al cargarse. */
  function registrar(juego) {
    juegos.push(juego);
  }

  const TINTES = [
    ["#e2688f", "#c9457a"],
    ["#c9a7f0", "#8f6fd0"],
    ["#e7c27d", "#e2688f"],
    ["#7fc4c9", "#5a9aa0"],
    ["#f2a3b5", "#c9a7f0"],
    ["#e2688f", "#e7c27d"]
  ];

  function pintarTarjetas() {
    const lista = $("#juegos-lista");
    if (!lista) return;

    const fragmento = document.createDocumentFragment();

    juegos.forEach((juego, i) => {
      const tinte = TINTES[i % TINTES.length];

      const boton = crear("button", {
        class: "juego-tarjeta__boton",
        type: "button",
        "--i": tinte[0],
        "--j": tinte[1]
      }, [
        crear("span", { class: "juego-tarjeta__icono" }, [ icono(juego.icono, "juego-tarjeta__glifo") ]),
        crear("strong", { class: "juego-tarjeta__titulo", text: juego.titulo }),
        crear("span", { class: "juego-tarjeta__resumen", text: juego.resumen }),
        crear("span", { class: "juego-tarjeta__jugar" }, [
          crear("span", { text: "Jugar" }),
          icono("i-flecha", "juego-tarjeta__flecha")
        ])
      ]);

      boton.addEventListener("click", () => abrirMenu(juego));
      fragmento.append(crear("li", { class: "juego-tarjeta" }, [ boton ]));
    });

    lista.replaceChildren(fragmento);
  }

  /* ==========================================================
     3. El menú de modo
     ========================================================== */

  let dialogo = null;
  let sesion = null;
  let scrollGuardado = 0;
  let estadoJuego = false;
  let popInstalado = false;

  function guardarPagina() {
    if (estadoJuego) return;
    estadoJuego = true;
    try { scrollGuardado = window.scrollY || 0; } catch (e) { scrollGuardado = 0; }
    try { document.body.classList.add("jugando"); } catch (e) {}
    try { history.pushState({ juego: true }, ""); } catch (e) {}
  }

  function volverAPagina() {
    if (!estadoJuego) {
      if (dialogo && dialogo.open) dialogo.close();
      return;
    }
    try { history.back(); } catch (e) {
      if (dialogo && dialogo.open) dialogo.close();
    }
  }

  function asegurarDialogo() {
    if (dialogo) return dialogo;

    dialogo = crear("dialog", { class: "modal", "aria-label": "Minijuego" });
    document.body.append(dialogo);
    dialogo.addEventListener("close", () => {
      limpiarSesion();
      try { document.body.classList.remove("jugando"); } catch (e) {}
      if (estadoJuego) {
        estadoJuego = false;
        try { window.scrollTo(0, scrollGuardado); } catch (e) {}
      }
    });

    /* El Escape cierra el diálogo. Con una partida corriendo se intercepta
       para que pase por limpiarSesion() y no deje listeners colgados. */
    dialogo.addEventListener("cancel", (evento) => {
      if (sesion) {
        evento.preventDefault();
        volverAPagina();
      }
    });

    if (!popInstalado) {
      popInstalado = true;
      window.addEventListener("popstate", () => {
        if (dialogo && dialogo.open) dialogo.close();
      });
    }

    return dialogo;
  }

  function botonCerrar() {
    const b = crear("button", { class: "modal__cerrar", type: "button", "aria-label": "Atrás" }, [ glifo("✕") ]);
    b.addEventListener("click", volverAPagina);
    return b;
  }

  function abrirMenu(juego) {
    /* Si venía de una partida a medias, se suelta antes de mostrar nada: si no,
       el bucle viejo seguía corriendo y al terminar pintaba su podio encima
       del menú. */
    limpiarSesion();
    const dlg = asegurarDialogo();
    guardarPagina();
    dlg.className = "modal modal--menu";
    dlg.replaceChildren(construirMenu(juego));
    if (!dlg.open) dlg.showModal();
    audio.despertar();
  }

  function construirMenu(juego) {
    const panel = crear("div", { class: "modal__panel" });

    panel.append(
      botonCerrar(),
      crear("p", { class: "modal__sobretitulo", text: "Minijuego" }),
      crear("h2", { class: "modal__titulo", text: juego.titulo }),
      crear("p", { class: "modal__resumen", text: juego.resumen })
    );

    const opciones = crear("div", { class: "modo" });

    const pareja = crear("button", { class: "modo__opcion", type: "button" }, [
      crear("span", { class: "modo__caras" }, [
        crear("img", { class: "modo__cara", src: Sprites.url("el", 4), alt: "" }),
        crear("img", { class: "modo__cara", src: Sprites.url("ella", 4), alt: "" })
      ]),
      crear("strong", { class: "modo__nombre", text: "En pareja" }),
      crear("span", { class: "modo__teclas", text: `${juego.teclas.el} para él · ${juego.teclas.ella} para ella` }),
      crear("span", { class: "modo__nota", text: "Los dos con el mismo teclado" })
    ]);
    pareja.addEventListener("click", () => empezar(juego, "pareja"));

    const solitario = crear("button", { class: "modo__opcion", type: "button" }, [
      crear("span", { class: "modo__caras" }, [ crear("img", { class: "modo__cara", src: Sprites.url("el", 4), alt: "" }) ]),
      crear("strong", { class: "modo__nombre", text: "Solitario" }),
      crear("span", { class: "modo__teclas", text: juego.teclas.el }),
      crear("span", { class: "modo__nota", text: "Vos contra la computadora. Sin vida: solo puntos" })
    ]);
    solitario.addEventListener("click", () => empezar(juego, "solitario"));

    opciones.append(pareja, solitario);
    panel.append(opciones);

    panel.append(crear("p", {
      class: "modal__pie",
      text: "Cada juego dura " + juego.duracion + " segundos y al final se anuncia el podio. La música se apaga con el botón del 🔊."
    }));

    return panel;
  }

  /* ==========================================================
     4. La partida
     ========================================================== */

  /* El marcador cambia de nombre según el modo: en pareja son "Él" y "Ella",
     y en solitario el primero pasa a ser "Vos" porque el otro lo maneja la
     computadora. */
  const NOMBRES = { el: "Él", ella: "Ella" };
  const nombreDe = (quien, modo) => (modo === "solitario" && quien === "el" ? "Vos" : NOMBRES[quien]);

  function empezar(juego, modo) {
    limpiarSesion();
    const dlg = asegurarDialogo();
    dlg.className = "modal modal--juego";

    const DURACION = juego.duracion;
    const puntos = { el: 0, ella: 0 };

    /* ---- El panel ---- */

    const panel = crear("div", { class: "modal__panel modal__panel--juego" });

    const puntosEl = crear("strong", { class: "marcador__puntos", text: "0" });
    const puntosElla = crear("strong", { class: "marcador__puntos", text: "0" });
    const reloj = crear("strong", { class: "marcador__reloj", text: DURACION });

    const marcador = crear("div", { class: "marcador" }, [
      crear("div", { class: "marcador__lado" }, [
        crear("img", { class: "marcador__cara", src: Sprites.url("el", 2), alt: "" }),
        crear("span", { class: "marcador__nombre", text: nombreDe("el", modo) }),
        puntosEl
      ]),
      crear("div", { class: "marcador__medio" }, [ reloj, crear("span", { class: "marcador__unidad", text: "seg" }) ]),
      crear("div", { class: "marcador__lado marcador__lado--derecha" }, [
        puntosElla,
        crear("span", { class: "marcador__nombre", text: nombreDe("ella", modo) }),
        crear("img", { class: "marcador__cara", src: Sprites.url("ella", 2), alt: "" })
      ])
    ]);

    const lienzo = crear("canvas", { class: "lienzo", width: 640, height: 320, role: "img" });
    lienzo.setAttribute("aria-label", "Tablero de " + juego.titulo);

    const aviso = crear("p", { class: "juego__aviso", "aria-live": "polite" });

    const btnReiniciar = crear("button", { class: "boton boton--suave", type: "button", text: "Reiniciar" });
    const btnSonido = crear("button", {
      class: "boton boton--suave", type: "button", "aria-pressed": "true", title: "Encender o apagar el sonido"
    }, [ glifo("Sonido") ]);
    const btnAtras = crear("button", { class: "boton boton--suave", type: "button", text: "← Atrás" });
    btnAtras.addEventListener("click", volverAPagina);

    const escenario = crear("div", { class: "juego__escenario" }, [ lienzo ]);

    panel.append(
      botonCerrar(),
      crear("p", { class: "modal__sobretitulo", text: juego.titulo }),
      marcador,
      escenario,
      aviso,
      crear("div", { class: "juego__barra" }, [ btnReiniciar, btnSonido, btnAtras ])
    );

    dlg.replaceChildren(panel);

    const turnoIndicador = crear("div", { class: "turno-indicador", "aria-live": "polite" }, [
      crear("span", { class: "turno-indicador__flecha", text: "➤" }),
      crear("span", { class: "turno-indicador__nombre", text: "" })
    ]);
    escenario.appendChild(turnoIndicador);

    /* ---- El contexto que recibe el juego ---- */

    let restante = DURACION;
    let viva = true;
    let ultimoAviso;
    const pulsadas = new Set();
    const oyentes = [];
    const oyentesToque = [];
    const temporizadores = [];

    let turnoActual = 0;
    let tiempoTurno = juego.turnoSegundos || 0;
    let restanteTurno = tiempoTurno;
    let bloqueoTurno = false;

    /* Todos los setTimeout que usa un juego se anotan acá, para poder
       cancelarlos si alguien cierra el juego a mitad de una ronda. Sin esto
       una partida abandonada seguiría moviéndose sola. */
    function despues(ms, fn) {
      const id = setTimeout(() => {
        const i = temporizadores.indexOf(id);
        if (i >= 0) temporizadores.splice(i, 1);
        if (viva) fn();
      }, ms);
      temporizadores.push(id);
      return id;
    }

    const decir = (texto) => {
      const t = texto || "";
      if (t === ultimoAviso) return;
      ultimoAviso = t;
      aviso.textContent = t;
    };

    const api = {
      modo,
      juego,
      lienzo,
      ancho: lienzo.width,
      alto: lienzo.height,

      nombre: (quien) => nombreDe(quien, modo),

      /* El sistema de puntos. Ningún juego toca el marcador: todos llaman
         acá, y por eso los seis puntúan igual. */
      sumar(quien, cantidad) {
        const clave = quien === "ella" ? "ella" : "el";
        puntos[clave] = Math.max(0, puntos[clave] + cantidad);
        (clave === "el" ? puntosEl : puntosElla).textContent = puntos[clave];
      },

      puntos: () => ({ el: puntos.el, ella: puntos.ella }),

      /* Los segundos que quedan. Los juegos lo usan para ir más rápido
         cuanto más tarde se está. */
      quedan: () => Math.max(0, restante),
      transcurrido: () => DURACION - restante,

      turno: () => turnoActual,
      setTurno(n) { turnoActual = n % 2; restanteTurno = tiempoTurno; this.actualizarTurno(); },
      siguienteTurno() { turnoActual = (turnoActual + 1) % 2; restanteTurno = tiempoTurno; this.actualizarTurno(); },
      setTiempoTurno(seg) { tiempoTurno = seg; restanteTurno = seg; },
      restanteTurno: () => Math.max(0, restanteTurno),
      bloquearTurno(v) { bloqueoTurno = !!v; },
      turnoBloqueado: () => bloqueoTurno,
      actualizarTurno() {
        if (!turnoIndicador) return;
        const quien = turnoActual === 0 ? "el" : "ella";
        const nombre = nombreDe(quien, modo);
        turnoIndicador.querySelector(".turno-indicador__nombre").textContent = nombre;
        const ladoIzq = turnoActual === 0;
        turnoIndicador.style.left = ladoIzq ? "12%" : "auto";
        turnoIndicador.style.right = ladoIzq ? "auto" : "12%";
        turnoIndicador.style.top = "10%";
      },

      /* Los juegos avisan quǸ estǭ pasando con una l��nea de texto. Como el
         runner lo llama en cada frame, se guarda la ǧltima para no tocar el
         DOM sesenta veces por segundo (eso obliga al navegador a recalcular
         la pǭgina entera sin necesidad). */
      decir,

      /* Los corazones de la fiesta que ya sueltan las otras secciones de la
         página. Se les pasan las coordenadas del canvas y se convierten a las
         de la pantalla. */
      saltar(x, y, cantidad) {
        if (prefersMotion.matches) return;
        if (!window.fondo) return;
        const caja = lienzo.getBoundingClientRect();
        window.fondo.saltar(
          caja.left + (x / lienzo.width) * caja.width,
          caja.top + (y / lienzo.height) * caja.height,
          cantidad
        );
      },

      alPulsar(fn) { oyentes.push(fn); },
      alTocar(fn) { oyentesToque.push(fn); },
      despues,

      vivo: () => viva,

      termina() {
        if (!viva) return;
        viva = false;
        mostrarPodio(juego, modo, puntos);
      },

      /* Lo usa limpiarSesion() para soltar todo lo de esta partida. */
      _limpiar() {
        viva = false;
      document.removeEventListener("keydown", alBajar);
      document.removeEventListener("keyup", alSoltar);
      lienzo.removeEventListener("pointerdown", alApoyar);
      temporizadores.forEach((id) => clearTimeout(id));
      temporizadores.length = 0;
    }
  };

    /* ---- Los listeners ---- */

    const TECLAS = {
      " ": "espacio",
      Spacebar: "espacio",
      ArrowLeft: "izquierda",
      ArrowRight: "derecha",
      ArrowUp: "arriba",
      ArrowDown: "abajo",
      Enter: "entrar"
    };
    const nombreTecla = (evento) => TECLAS[evento.key] || (evento.key.length === 1 ? evento.key.toLowerCase() : "");

    const alBajar = (evento) => {
      /* Cuando no hay nada enfocado el destino de la tecla es el document, y
         ese no tiene closest(): hay que preguntarle antes. */
      const destino = evento.target;
      if (destino && typeof destino.closest === "function" && destino.closest("input, textarea")) return;
      const t = nombreTecla(evento);
      if (!t) return;
      pulsadas.add(t);
      oyentes.forEach((fn) => fn(t, evento));
      /* Las flechas y el espacio mueven la página si no se les corta, y en un
         juego eso hace que todo salte al scrollear. */
      if (["espacio", "izquierda", "derecha", "arriba", "abajo"].includes(t)) evento.preventDefault();
    };

    const alSoltar = (evento) => {
      const t = nombreTecla(evento);
      if (t) pulsadas.delete(t);
    };

    /* En el celular se juega tocando el tablero. La posición se pasa de 0 a 1
       para que el juego no tenga que saber de qué tamaño quedó el canvas. */
    const alApoyar = (evento) => {
      const caja = lienzo.getBoundingClientRect();
      const punto = evento.changedTouches ? evento.changedTouches[0] : evento;
      const x = (punto.clientX - caja.left) / caja.width;
      const y = (punto.clientY - caja.top) / caja.height;
      oyentesToque.forEach((fn) => fn(x, y));
    };

    document.addEventListener("keydown", alBajar);
    document.addEventListener("keyup", alSoltar);
    lienzo.addEventListener("pointerdown", alApoyar);

    btnReiniciar.addEventListener("click", () => {
      limpiarSesion();
      empezar(juego, modo);
    });

    btnSonido.addEventListener("click", () => {
      const mudo = audio.silenciar();
      btnSonido.setAttribute("aria-pressed", mudo ? "false" : "true");
      btnSonido.firstChild.textContent = mudo ? "Off" : "On";
    });

    /* ---- El bucle ---- */

    const g = lienzo.getContext("2d");
    const logica = juego.iniciar(api);
    let anterior = performance.now();
    let t = 0;
    let ultimoSonido = -1;

    sesion = { logica, api, juego, modo, viva: () => viva, cerrar: limpiarSesion };

    audio.despertar();
    audio.musica(juego.tema);
    api.actualizarTurno();

    function bucle(ahora) {
      if (!viva) return;

      /* dt en segundos, recortado a 1/20: si la pestaña se congela un momento
         (o se cambia de ventana) no queremos que el juego salte de golpe
         varios segundos de una. */
      const dt = Math.min((ahora - anterior) / 1000, 0.05);
      anterior = ahora;
      t += dt;

      restante -= dt;
      const entero = Math.max(0, Math.ceil(restante));
      reloj.textContent = entero;
      reloj.classList.toggle("marcador__reloj--poco", entero <= 10);

      /* Un "plín" por segundo en los últimos diez, para que se sepa que se
         está acabando. */
      if (restante <= 10 && entero !== ultimoSonido) {
        ultimoSonido = entero;
        audio.cuenta(entero <= 3);
      }

      if (tiempoTurno > 0) {
        restanteTurno -= dt;
        if (restanteTurno <= 0) {
          api.siguienteTurno();
          if (logica.onTurnoCambio) logica.onTurnoCambio(api.turno(), api);
        }
      }

      if (restante <= 0) {
        viva = false;
        mostrarPodio(juego, modo, puntos);
        return;
      }

      if (logica.actualizar) logica.actualizar(dt, pulsadas, api, t);
      if (logica.dibujar) {
        g.clearRect(0, 0, lienzo.width, lienzo.height);
        logica.dibujar(g, api, t);
      }

      requestAnimationFrame(bucle);
    }

    requestAnimationFrame(bucle);
  }

  /* ==========================================================
     5. El podio
     ========================================================== */

  function mostrarPodio(juego, modo, puntos) {
    if (!dialogo) return;

    /* Se corta la partida antes de pintar el podio, para que el bucle no siga
       corriendo detrás del cartel. */
    limpiarSesion();
    dialogo.className = "modal modal--podio";

    const el = puntos.el;
    const ella = puntos.ella;
    const empate = el === ella;

    const panel = crear("div", { class: "modal__panel modal__panel--podio" });
    panel.append(
      botonCerrar(),
      crear("p", { class: "modal__sobretitulo", text: juego.titulo + " · podio" })
    );

    if (empate) {
      panel.append(
        crear("h2", { class: "modal__titulo", text: "¡Empate!" }),
        crear("p", { class: "modal__lema", text: `${el} puntos los dos. Nadie le gana a nadie hoy 🤍` })
      );
    } else {
      const ganaEl = el > ella;
      const nombre = nombreDe(ganaEl ? "el" : "ella", modo);
      panel.append(
        crear("h2", { class: "modal__titulo", text: "1er lugar: " + nombre }),
        crear("p", {
          class: "modal__lema",
          text: `${Math.max(el, ella)} puntos contra ${Math.min(el, ella)} 🤍`
        })
      );
    }

    /* Los peldaños van siempre del segundo al primero, para que se lean de
       izquierda a derecha como en cualquier podio. */
    const orden = empate ? ["el", "ella"] : el > ella ? ["ella", "el"] : ["el", "ella"];

    const podio = crear("div", { class: "podio" });

    orden.forEach((quien, i) => {
      const primero = i === 1 && !empate;
      const tantos = quien === "el" ? el : ella;
      podio.append(
        crear("div", { class: "podio__peldano" + (primero ? " podio__peldano--primero" : "") }, [
          crear("span", { class: "podio__lugar", text: i === 0 ? "2.º" : "1.º" }),
          crear("img", { class: "podio__cara", src: Sprites.url(quien, 4), alt: "" }),
          crear("strong", { class: "podio__nombre", text: nombreDe(quien, modo) }),
          crear("span", { class: "podio__puntos", text: tantos + (tantos === 1 ? " punto" : " puntos") })
        ])
      );
    });

    panel.append(podio);

    const acciones = crear("div", { class: "modal__acciones" });

    const otra = crear("button", { class: "boton boton--primario", type: "button", text: "Jugar de nuevo" });
    otra.addEventListener("click", () => abrirMenu(juego));

    const volver = crear("button", { class: "boton", type: "button", text: "← Atrás" });
    volver.addEventListener("click", volverAPagina);

    acciones.append(otra, volver);
    panel.append(acciones);

    dialogo.replaceChildren(panel);

    if (!empate && window.fondo) {
      const caja = panel.getBoundingClientRect();
      window.fondo.saltar(caja.left + caja.width / 2, caja.top + caja.height * 0.45, 60);
    }

    audio.reproducir("victoria");
  }

  /* ==========================================================
     6. Limpieza
     ========================================================== */

  /* Saca los listeners, cancela los temporizadores pendientes y le avisa al
     juego que se está yendo. Sin esto, al abrir el juego siguiente el
     anterior seguiría escuchando el teclado. */
  function limpiarSesion() {
    if (!sesion) return;

    sesion.api._limpiar();

    if (sesion.logica && sesion.logica.alDestruir) sesion.logica.alDestruir();

    audio.musica();
    sesion = null;
  }

  /* ==========================================================
     7. Arranque
     ========================================================== */

  function init() {
    pintarTarjetas();
  }

  /* Se expone lo que los juegos necesitan: darse de alta, el corazón, el
     fondo, el texto partido en líneas, la baraja y las fotos del sitio. */
  window.Juegos = {
    registrar,
    corazon,
    noche,
    parrafo,
    mezclar,
    alPeso,
    foto,
    fotosDelSitio
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();