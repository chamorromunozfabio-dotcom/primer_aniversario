/* Nuestro año — https://developer.mozilla.org/es/docs/Web/API */
(function () {
  "use strict";

  /* ==========================================================
     1. Utilidades
     ========================================================== */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const prefersMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const NS_SVG = "http://www.w3.org/2000/svg";

  /* Rellena un elemento ya creado. "class" se fija con setAttribute porque en
     los nodos SVG la propiedad className es de solo lectura y se perdería. */
  const completar = (el, props, hijos) => {
    if (props) {
      Object.keys(props).forEach((clave) => {
        const valor = props[clave];
        if (valor === null || valor === undefined || valor === false) return;
        if (clave === "text") el.textContent = valor;
        else if (clave === "dataset") Object.assign(el.dataset, valor);
        else if (clave.startsWith("--")) el.style.setProperty(clave, valor);
        else el.setAttribute(clave, valor === true ? "" : valor);
      });
    }
    (hijos || []).forEach((hijo) => el.append(hijo));
    return el;
  };

  const crear = (etiqueta, props, hijos) =>
    completar(document.createElement(etiqueta), props, hijos);

  /* Los SVG hay que crearlos en su propio espacio de nombres: con
     createElement("svg") el navegador no los dibuja y salen los círculos vacíos. */
  const crearSvg = (etiqueta, props, hijos) =>
    completar(document.createElementNS(NS_SVG, etiqueta), props, hijos);

  const icono = (id, clase) =>
    crearSvg("svg", { class: clase || "", "aria-hidden": "true", focusable: "false" }, [
      crearSvg("use", { href: "#" + id })
    ]);

  const normalizar = (texto) =>
    (texto || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9n ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const plural = (n, singular, plural) => `${n} ${n === 1 ? singular : plural}`;

  /* ==========================================================
     2. Datos
     ========================================================== */
  const fotos = [
    { src: "img/foto1.jpg", titulo: "San Valentín 🤍", fecha: "14 de febrero 2026", iso: "2026-02-14" },
    { src: "img/foto2.jpg", titulo: "Acompañándote a buscar trabajo", fecha: "11 de febrero 2026", iso: "2026-02-11" },
    { src: "img/foto3.jpg", titulo: "Paso por Dollar City", fecha: "11 de febrero 2026", iso: "2026-02-11" },
    { src: "img/foto4.jpg", titulo: "Tu cumpleaños 🎂", fecha: "27 de julio 2025", iso: "2025-07-27" },
    { src: "img/foto5.jpg", titulo: "Visita a tu casa", fecha: "22 de agosto 2025", iso: "2025-08-22", ancha: true },
    { src: "img/foto6.jpg", titulo: "Otra de tu cumpleaños", fecha: "27 de julio 2025", iso: "2025-07-27" },
    { src: "img/foto7.jpg", titulo: "Salida a comer heladito 🍦", fecha: "11 de diciembre 2024", iso: "2024-12-11" },
    { src: "img/foto8.jpg", titulo: "Boda de tu prima (te veías hermosa)", fecha: "Diciembre 2025", iso: "2025-12" },
    { src: "img/foto9.jpg", titulo: "Día de tu investidura 🎓", fecha: "8 de noviembre 2025", iso: "2025-11-08" },
    { src: "img/foto10.jpg", titulo: "Nosotros 🤍", fecha: "23 de noviembre 2025", iso: "2025-11-23" },
    { src: "img/foto11.jpeg", titulo: "Día de tu investidura 🎓", fecha: "8 de noviembre 2025", iso: "2025-11-08" },
    { src: "img/foto12.jpg", titulo: "Primer aniversario", fecha: "22 de febrero 2026", iso: "2026-02-22" },

    /* 👉 Las siguientes están sin descripción todavía. Rellena "titulo" y
       "fecha" (y "iso" con el formato AAAA-MM-DD, que es opcional) y el
       texto real reemplaza solo al marcador. */
    { src: "img/foto13.jpg", titulo: "Celebrando tu cumpleaños🎂", fecha: "26 de juliio 2026", iso: "2026-07-26" },
    { src: "img/foto14.jpg", titulo: "Te veias radiante en tu cumpleaños✨", fecha: "26 de juliio 2026", iso: "2026-07-26" },
    { src: "img/foto15.jpg", titulo: "Flores porque estabas preciosa💐", fecha: "9  de junio 2026", iso: "2026-06-09" },
    { src: "img/foto16.jpg", titulo: "Floresitas💐", fecha: "9  de junio 2026", iso: "2026-06-09" },
    { src: "img/foto17.jpg", titulo: "Sesion de fotos📷", fecha: "9  de junio 2026", iso: "2026-06-09" },
    { src: "img/foto18.jpg", titulo: "Tu hombre📷", fecha: "9  de junio 2026", iso: "2026-06-09" },
    { src: "img/foto19.jpg", titulo: "Salida  a comer por el cumple  años de mi papá🎩", fecha: "12 de abril 2026", iso: "2026-04-12" },
    { src: "img/foto20.jpeg", titulo: "Primera salida en la moto🏍", fecha: "6 de septiembre 2026", iso: "2026-09-06" },
    { src: "img/foto21.jpeg", titulo: "Fotos parque Giron🎡", fecha: "6 de septiembre 2026", iso: "2026-09-06" },
    { src: "img/foto22.jpg", titulo: "Salida a comer🍔", fecha: "2 de agosto 2026", iso: "2026-08-02" }
  ];

  const videos = [
    { src: "videos/video1.mp4", titulo: "San Valentín juntos 🤍" },
    { src: "videos/video2.mp4", titulo: "Me viniste a visitar porque estaba enfermo 🤒" },
    { src: "videos/video3.mp4", titulo: "Fui a verte jugar fulvito ⚽" },
    { src: "videos/video4.mp4", titulo: "Despedida después de un día juntos 💔" },
    { src: "videos/video6.mp4", titulo: "Pasadia juntos, primer aniversario 🏕️" },
    { src: "videos/video5.mp4", titulo: "Resumen del primer aniversario 🎬" },

    /* 👉 Igual que las fotos: pon aquí el título de cada video nuevo. */
    { src: "videos/video7.mp4", titulo: "Celebrando tu Cumpleaños🎉" },
    { src: "videos/video8.mp4", titulo: "En el cumpleaños de mi mamá🎂" },
    { src: "videos/video9.mp4", titulo: "Video de mi preciosa🤍" },
    { src: "videos/video10.mp4", titulo: "Gato🐱" },
    { src: "videos/video11.mp4", titulo: "Tarde de estilista💇‍♀️" },
    { src: "videos/video12.mp4", titulo: "Nuestro Secreto🐢" },
    { src: "videos/video13.mp4", titulo: "Primera salida en la moto🏍" },
    { src: "videos/video14.mp4", titulo: "Parque Giron🎡" },
    { src: "videos/video15.mp4", titulo: "Salida en la moto🏍" },
    { src: "videos/video16.mp4", titulo: "Besos💏" }
  ];

  /* Cada canción trae su ID de Spotify. Puedes pegar también el enlace completo
     ("https://open.spotify.com/track/ID") y el código se queda solo con el ID. */
  const canciones = [
    { spotify: "5zjUu8fZbaxFUQqlY1i37l", nombre: "Asómate a la Ventana", artista: "Kevin Florez", nota: "Canción que te gusta mucho" },
    { spotify: "5MvJALOBH7jd3O9Ym2CgTj", nombre: "Di que Sí", artista: "L'omy", nota: "Dedicatoria" },
    { spotify: "4wzTSQyCSeI7X6vAJFPk48", nombre: "Ella es mi Fiesta", artista: "Carlos Vives", nota: "Dedicatoria" },
    { spotify: "7ynTwByYTgs1UsWoQvWdvI", nombre: "Ella es mi Todo", artista: "Kalet Morales", nota: "Dedicatoria" },
    { spotify: "35ttE4t8lQZA2vuCYDg4G7", nombre: "M.A.I", artista: "Milo J", nota: "Dedicatoria" },
    { spotify: "7xQgtdHA1NHFTmomE2XHhi", nombre: "Melón Vino", artista: "WOS", nota: "Nuestra canción especial 🤍" },
    { spotify: "3AcGnc9FLIe1eLSOLYeJj2", nombre: "Obsesión", artista: "Peter Manjarres", nota: "Dedicatoria" },
    { spotify: "2Pefov61P8YV4cW5Vjq1X3", nombre: "Oh Qué Será", artista: "Willie Colón y Rubén Blades", nota: "Dedicatoria" },
    { spotify: "3k3NWokhRRkEPhCzPmV8TW", nombre: "Ojitos Lindos", artista: "Bad Bunny", nota: "Tus ojitos preciosos" },
    { spotify: "2RVrdr062uLFxXwIxwdXPH", nombre: "Te Amo", artista: "Paulo Londra", nota: "Dedicatoria" },
    { spotify: "00Zpdri9mPJL1LbwYkGmg5", nombre: "Traga'o de Ti", artista: "Peter Manjarres", nota: "Dedicatoria" },
    { spotify: "4tQofG51E0juZBBVr6pral", nombre: "Tuyo", artista: "Mora", nota: "Dedicatoria" },
    { spotify: "6qvCE9WhoF57af6boMwaOz", nombre: "Vivo en el Limbo", artista: "Kalet Morales", nota: "Dedicatoria" },
    { spotify: "54uBpRpdpMx96JAk1OyHez", nombre: "Yo No Sé Mañana", artista: "Luis Enrique", nota: "Dedicatoria" },
    { spotify: "2lTm559tuIvatlT1u0JYG2", nombre: "Baile Inolvidable", artista: "Bad Bunny", nota: "Siempre serás mi baile inolvidable 🤍" },

    { spotify: "1j6xOGusnyXq3l6IryKF3G", nombre: "Déjala que vuelva", artista: "Manuel Turizo & Piso 21", nota: "Dedicatoria" },
    { spotify: "5LlqSCrhvYm97QwfhmY7tc", nombre: "Desaparecer", artista: "Mora", nota: "Dedicatoria" },
    { spotify: "4rwZNe3ZJZbOiFMcGpYEbX", nombre: "El Avion", artista: "Koffee el Kafetero", nota: "Dedicatoria" },
    { spotify: "5lXKHJ3kYg9aM0TdBgaZBe", nombre: "Ameri", artista: "Duki", nota: "Dedicatoria" },
    { spotify: "7MmrcXVA7A5zZ2CbDuGHNa", nombre: "A Mí", artista: "Rels B", nota: "Dedicatoria" },
    { spotify: "3EK4tGkSiO5xvvB5sM4tln", nombre: "Amárrame", artista: "Mon Laferte & Juanes", nota: "Dedicatoria" }
  ];

  /* 👉 PEGA AQUÍ TUS ENLACES. Con el campo "url" vacío el logo se ve igual
     pero no lleva a ninguna parte, así que rellena los tres:
       · Playlist de Spotify → pega el enlace tal cual, ej.
         "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
       · TikTok → tu usuario sin el @, ej. "tuusuario"
       · Gmail → tu correo, ej. "tuusuario@gmail.com"  */
  const redes = [
    { icono: "i-spotify", nombre: "Spotify", url: "https://open.spotify.com/playlist/05S6Z6ytjZW61HJwQVvnhr", color: ["#1db954", "#0f7a38"], tono: "#1ed760" },
    { icono: "i-tiktok", nombre: "TikTok", url: "Chamorro_25a", color: ["#25f4ee", "#fe2c55"], tono: "#e9f6f7" },
    { icono: "i-gmail", nombre: "Gmail", url: "chamorromunozfabio@gmail.com", color: ["#ea4335", "#c5221f"], tono: "#ea4335" }
  ];

  /* Convierte lo que escribas arriba en un enlace real. Se deja tal cual si ya
     es una URL, y si no se le arma la de la red que toca. */
  function enlaceRed(red) {
    const valor = (red.url || "").trim();
    if (!valor) return "";

    if (/^(https?:|mailto:)/i.test(valor)) return valor;
    if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(valor)) return "mailto:" + valor;

    const usuario = valor.replace(/^@/, "").replace(/\/+$/, "");
    if (red.icono === "i-tiktok") return "https://www.tiktok.com/@" + usuario;
    if (red.icono === "i-spotify") return "https://open.spotify.com/user/" + usuario;
    return "https://" + usuario;
  }

  const frases = [
    "Amo tu sonrisa 🤍",
    "Me encantan tus ojitos",
    "Siempre amo cuando me abrazas",
    "Amo amarte todo el tiempo",
    "Eres mi princesita preciosa",
    "Siempre contarás conmigo",
    "Me niego a tener un futuro sin ti",
    "Quiero vivir contigo por el resto de mi vida"
  ];

  const preguntas = [
    {
      texto: "¿Cuál fue el día exacto en que hablamos por primera vez?",
      acepta: ["17 de octubre", "17 de octubre de 2024", "17102024", "17/10/2024", "17 de octubre 2024"],
      acierto: "Sabía que lo tenías presente 🤍",
      fallo: "-20% de amor, sabía que yo te amaba más 😢",
      castigo: 20
    },
    {
      texto: "¿Qué canción te canté por llamada?",
      acepta: ["melon vino", "melón vino", "melon vino de wos"],
      acierto: "Te la dedico una y mil veces 🎶",
      fallo: "-50% de amor, esa sí me dolió 😭",
      castigo: 50
    },
    {
      texto: "¿Título de la carta que te di?",
      acepta: ["lunes", "lunedi", "lunes de amor", "el lunes"],
      acierto: "Siempre estaré aquí para amarte 💌",
      fallo: "-80% de amor, esa me quitó el sueño 💔",
      castigo: 80
    }
  ];

  const CLAVE = ["17102024", "17/10/2024", "17 de octubre de 2024", "17 de octubre", "1710 2024"];
  const INICIO = new Date(2025, 1, 22);

  /* La fecha con la que se abre la dedicatoria: el 22 de febrero de 2026.
     La forma facil es 02222026 (mes/dia/anio, todo junto, sin "/" ni "-"),
     pero se aceptan las demas tambien porque no hay forma de saber como la
     va a escribir. Ojo: esto es un juego, la respuesta esta en este archivo,
     asi que cualquiera que abra la consola puede leerla. */
  const ACCESO = [
    "02222026",
    "22022026",
    "22/02/2026",
    "22-02-2026",
    "22.02.2026",
    "22 de febrero de 2026",
    "22 de febrero 2026",
    "22 febrero 2026",
    "22 de febrero",
    "22 feb 2026",
    "22febrero2026"
  ];

  const CLAVE_ACCESO = "aniversario-acceso";

  /* ==========================================================
     3. Fondo animado (canvas)
     ========================================================== */
  const fondo = (function () {
    const lienzo = $("#fondo");
    if (!lienzo || !lienzo.getContext) return { saltar() {} };

    const ctx = lienzo.getContext("2d");
    const sprites = [crearCorazon(), crearPetalo()];
    let particulas = [];
    let ancho = 0;
    let alto = 0;
    let activo = false;

    function crearCorazon() {
      const c = document.createElement("canvas");
      c.width = c.height = 40;
      const x = c.getContext("2d");
      x.fillStyle = "#ffffff";
      x.beginPath();
      x.moveTo(20, 34);
      x.bezierCurveTo(2, 22, 2, 10, 10, 7);
      x.bezierCurveTo(15, 5, 20, 10, 20, 12);
      x.bezierCurveTo(20, 10, 25, 5, 30, 7);
      x.bezierCurveTo(38, 10, 38, 22, 20, 34);
      x.closePath();
      x.fill();
      return c;
    }

    function crearPetalo() {
      const c = document.createElement("canvas");
      c.width = c.height = 40;
      const x = c.getContext("2d");
      x.fillStyle = "#ffffff";
      x.beginPath();
      x.ellipse(20, 20, 8, 17, 0, 0, Math.PI * 2);
      x.fill();
      x.globalCompositeOperation = "destination-out";
      x.beginPath();
      x.ellipse(20, 13, 4, 7, 0, 0, Math.PI * 2);
      x.fill();
      return c;
    }

    function tintar(sprite, color) {
      const c = document.createElement("canvas");
      c.width = sprite.width;
      c.height = sprite.height;
      const x = c.getContext("2d");
      x.drawImage(sprite, 0, 0);
      x.globalCompositeOperation = "source-in";
      x.fillStyle = color;
      x.fillRect(0, 0, c.width, c.height);
      return c;
    }

    const tonos = ["#f4a6c0", "#e2688f", "#e7c27d", "#c9a7f0", "#f2a3b5"];
    const pintados = tonos.map((tono) => sprites.map((s) => tintar(s, tono))).flat();

    function nueva(inicial) {
      const vida = Math.random();
      return {
        x: Math.random() * ancho,
        y: inicial ? Math.random() * alto : -30 - Math.random() * 120,
        tam: 8 + Math.random() * 20,
        vy: 0.25 + Math.random() * 0.7,
        vx: (Math.random() - 0.5) * 0.35,
        giro: Math.random() * Math.PI * 2,
        velocidadGiro: (Math.random() - 0.5) * 0.02,
        alfa: 0.12 + vida * 0.4,
        sprite: pintados[Math.floor(Math.random() * pintados.length)]
      };
    }

    function medir() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = window.innerWidth;
      alto = window.innerHeight;
      lienzo.width = Math.floor(ancho * dpr);
      lienzo.height = Math.floor(alto * dpr);
      lienzo.style.width = ancho + "px";
      lienzo.style.height = alto + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function poblar() {
      const cantidad = Math.max(14, Math.min(46, Math.round((ancho * alto) / 26000)));
      particulas = Array.from({ length: cantidad }, () => nueva(true));
    }

    function dibujar() {
      ctx.clearRect(0, 0, ancho, alto);
      particulas.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alfa;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.giro);
        ctx.drawImage(p.sprite, -p.tam / 2, -p.tam / 2, p.tam, p.tam);
        ctx.restore();
      });
    }

    function paso() {
      particulas.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx + Math.sin((p.y + p.giro) / 90) * 0.35;
        p.giro += p.velocidadGiro;
        if (p.y > alto + 40) {
          p.y = -40;
          p.x = Math.random() * ancho;
        }
        if (p.x < -60) p.x = ancho + 40;
        if (p.x > ancho + 60) p.x = -40;
      });
      dibujar();
    }

    function bucle() {
      if (!activo) return;
      paso();
      requestAnimationFrame(bucle);
    }

    function saltar(x, y, cantidad) {
      if (prefersMotion.matches) return;
      for (let i = 0; i < (cantidad || 26); i++) {
        const angulo = Math.random() * Math.PI * 2;
        const fuerza = 2 + Math.random() * 6;
        const p = nueva(false);
        p.x = x;
        p.y = y;
        p.vx = Math.cos(angulo) * fuerza;
        p.vy = Math.sin(angulo) * fuerza - 2;
        p.alfa = 0.9;
        p.tam = 10 + Math.random() * 22;
        particulas.push(p);
        if (particulas.length > 160) particulas.shift();
      }
    }

    function init() {
      medir();
      poblar();
      dibujar();

      if (prefersMotion.matches) return;

      activo = true;
      bucle();

      let temporizador;
      window.addEventListener("resize", () => {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => {
          medir();
          poblar();
        }, 220);
      });

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          activo = false;
        } else if (!activo) {
          activo = true;
          bucle();
        }
      });
    }

    return { init, saltar };
  })();

  /* ==========================================================
     4. Render de galerías con la API del DOM
     ========================================================== */
  /* Marcador que se ve en la web cuando falta el título o la fecha, para que
     se note qué fotos quedan por describir. */
  const SIN_DESCRIPCION = "✎ Escribe la descripción";
  const SIN_FECHA = "✎ Fecha";

  function pintarFotos() {
    const lista = $("#fotosContainer");
    if (!lista) return;

    const fragmento = document.createDocumentFragment();

    fotos.forEach((foto) => {
      const titulo = (foto.titulo || "").trim();
      const fecha = (foto.fecha || "").trim();

      const rotulo = titulo
        ? crear("strong", { text: foto.titulo })
        : crear("em", { class: "pendiente", text: SIN_DESCRIPCION });

      /* <time> solo si hay "iso": un datetime vacío no es HTML válido. */
      const rotuloFecha = fecha
        ? foto.iso
          ? crear("time", { class: "foto__fecha", datetime: foto.iso, text: foto.fecha })
          : crear("span", { class: "foto__fecha", text: foto.fecha })
        : crear("span", { class: "foto__fecha pendiente", text: SIN_FECHA });

      const pie = crear("figcaption", { class: "foto__pie" }, [rotulo, rotuloFecha]);

      const imagen = crear("img", {
        src: foto.src,
        alt: titulo ? [titulo, fecha].filter(Boolean).join(" — ") : `Foto sin título todavía: ${foto.src}`,
        loading: "lazy",
        decoding: "async"
      });

      const figura = crear("figure", { class: "foto" + (foto.ancha ? " foto--ancha" : "") }, [imagen, pie]);

      fragmento.append(crear("li", { class: "galeria__item" }, [figura]));
    });

    lista.append(fragmento);

    /* El número de la cabecera se solo, para que no vuelva a desactualizarse
       cuando agregues o quites fotos. */
    const subtitulo = $("#fotos-subtitulo");
    if (subtitulo) {
      const n = fotos.length;
      const palabra = n === 1 ? "recuerdo" : "recuerdos";
      subtitulo.textContent = `${n} ${palabra} que guardo siempre`;
    }
  }

  function pintarVideos() {
    const lista = $("#videosContainer");
    if (!lista) return;

    const fragmento = document.createDocumentFragment();

    videos.forEach((video) => {
      const titulo = (video.titulo || "").trim();

      const reproductor = crear("video", {
        controls: true,
        preload: "metadata",
        playsinline: true
      }, [crear("source", { src: video.src, type: "video/mp4" })]);

      const rotulo = titulo
        ? crear("strong", { text: video.titulo })
        : crear("em", { class: "pendiente", text: SIN_DESCRIPCION });

      const figura = crear("figure", { class: "foto foto--ancha" }, [
        reproductor,
        crear("figcaption", { class: "foto__pie" }, [rotulo])
      ]);

      fragmento.append(crear("li", { class: "galeria__item" }, [figura]));
    });

    lista.append(fragmento);
  }

  /* Acepta un ID suelto o cualquier enlace de Spotify y devuelve solo el ID */
  function idSpotify(valor) {
    if (!valor) return "";
    const texto = String(valor).trim();
    if (/^[A-Za-z0-9]{22}$/.test(texto)) return texto;
    const encontrado = texto.match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([A-Za-z0-9]{22})/);
    return encontrado ? encontrado[1] : "";
  }

  function pintarMusica() {
    const lista = $("#musicList");
    if (!lista) return;

    const fragmento = document.createDocumentFragment();

    canciones.forEach((cancion, indice) => {
      const id = idSpotify(cancion.spotify);
      const numero = String(indice + 1).padStart(2, "0");

      // Sin ID no hay reproductor: se avisa en vez de dejar un hueco vacío
      const Reproductor = id
        ? crearSpotify(id, cancion)
        : crear("p", { class: "pista__aviso", text: "Esta canción no se puede reproducir aquí" });

      const pista = crear("li", { class: "pista" }, [
        crear("p", { class: "pista__numero", text: numero }),
        Reproductor,
        crear("h3", { class: "pista__titulo", text: cancion.nombre }),
        crear("p", { class: "pista__artista", text: cancion.artista }),
        crear("p", { class: "pista__nota" }, [crear("em", { text: cancion.nota })]),
        id ? crear("a", {
          class: "pista__enlace",
          href: "https://open.spotify.com/track/" + id,
          target: "_blank",
          rel: "noopener noreferrer"
        }, [icono("i-spotify", "pista__marca"), "Abrir en Spotify"]) : null
      ].filter(Boolean));

      fragmento.append(pista);
    });

    lista.append(fragmento);
  }

  /* Portada con botón: el reproductor de Spotify solo se carga al pulsar,
     así la página no descarga 15 reproductores de golpe. */
  function crearSpotify(id, cancion) {
    const boton = crear("button", {
      class: "pista__portada",
      type: "button",
      "aria-label": `Reproducir ${cancion.nombre} de ${cancion.artista} en Spotify`
    }, [
      icono("i-spotify", "pista__simbolo"),
      crearSvg("svg", {
        class: "pista__reproducir",
        viewBox: "0 0 48 48",
        "aria-hidden": "true",
        focusable: "false"
      }, [
        crearSvg("circle", { cx: "24", cy: "24", r: "23", fill: "var(--rosa-fuerte)" }),
        crearSvg("path", {
          d: "M20 16.2v15.6a1 1 0 0 0 1.53.85l11.9-7.8a1 1 0 0 0 0-1.7l-11.9-7.8A1 1 0 0 0 20 16.2",
          fill: "var(--noche)"
        })
      ])
    ]);

    boton.addEventListener("click", () => {
      const marco = crear("iframe", {
        class: "pista__embed",
        title: `Spotify: ${cancion.nombre} — ${cancion.artista}`,
        src: "https://open.spotify.com/embed/track/" + id + "?utm_source=generator&theme=0",
        height: "152",
        loading: "lazy",
        allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
        allowfullscreen: "true",
        tabindex: "-1"
      });

      boton.replaceWith(marco);
      marco.focus({ preventScroll: true });
      marco.scrollIntoView({ block: "nearest" });
    });

    return boton;
  }

  function pintarRedes() {
    const lista = $("#redes-lista");
    if (!lista) return;

    redes.forEach((red) => {
      const url = enlaceRed(red);
      const props = {
        class: "redes__enlace",
        "aria-label": url ? `${red.nombre} — abrir en una pestaña nueva` : `${red.nombre} — falta poner el enlace`,
        "data-nombre": red.nombre,
        title: url ? red.nombre : `Agrega el enlace de ${red.nombre} en js/script.js`,
        "--degradado-marca": `linear-gradient(45deg, ${red.color[0]}, ${red.color[1]})`,
        "--tono-marca": red.tono
      };

      if (url) {
        props.href = url;
        props.target = red.icono === "i-gmail" ? null : "_blank";
        props.rel = "noopener noreferrer";
      } else {
        /* Sin enlace no se puede ir a ninguna parte, así que no se anuncia
           como enlace activo ni se puede enfocar con el teclado. */
        props["aria-disabled"] = "true";
        props.tabindex = "-1";
      }

      const enlace = crear("a", props, [icono(red.icono, "redes__icono")]);
      lista.append(
        crear("li", { class: "redes__item" }, [enlace, crear("span", { class: "redes__nombre", text: red.nombre })])
      );
    });
  }

  /* ==========================================================
     5. Menú
     ========================================================== */
  function initMenu() {
    const cabecera = $("#cabecera");
    const lista = $("#lista-menu");
    const alternador = $(".menu__alternador");
    if (!cabecera || !lista || !alternador) return;

    const escritorio = () => window.matchMedia("(min-width: 1024px)").matches;

    const fijarAbierto = (abierto) => {
      alternador.setAttribute("aria-expanded", abierto ? "true" : "false");
      lista.classList.toggle("abierta", abierto);
    };

    alternador.addEventListener("click", () => {
      fijarAbierto(alternador.getAttribute("aria-expanded") !== "true");
    });

    lista.addEventListener("click", (evento) => {
      if (evento.target.closest(".menu__enlace") && !escritorio()) fijarAbierto(false);
    });

    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape" && alternador.getAttribute("aria-expanded") === "true") {
        fijarAbierto(false);
        alternador.focus();
      }
    });

    document.addEventListener("click", (evento) => {
      if (alternador.getAttribute("aria-expanded") !== "true") return;
      if (!cabecera.contains(evento.target)) fijarAbierto(false);
    });

    window.addEventListener("resize", () => {
      if (escritorio()) fijarAbierto(false);
    });

    /* Sección visible = enlace destacado */
    const enlaces = $$(".menu__enlace", lista);
    const secciones = $$("main .seccion[id]");

    if ("IntersectionObserver" in window) {
      const vigilante = new IntersectionObserver(
        (entradas) => {
          entradas.forEach((entrada) => {
            if (!entrada.isIntersecting) return;
            enlaces.forEach((enlace) => {
              const activo = enlace.getAttribute("href") === "#" + entrada.target.id;
              if (activo) enlace.setAttribute("aria-current", "true");
              else enlace.removeAttribute("aria-current");
            });
          });
        },
        { rootMargin: "-45% 0px -50% 0px" }
      );
      secciones.forEach((seccion) => vigilante.observe(seccion));
    }
  }

  /* ==========================================================
     6. Revelado al hacer scroll
     ========================================================== */
  function initRevelado() {
    const objetivos = $$(
      ".seccion__encabezado, .sello, .portada__frase, .boton, .galeria__item, .pista, .sobre, .juego, .dedicatoria, .secreto, .final"
    );

    objetivos.forEach((el) => {
      el.classList.add("revelar");
      const hermanos = Array.from(el.parentElement ? el.parentElement.children : []);
      const posicion = hermanos.indexOf(el);
      el.style.setProperty("--retraso", Math.min(Math.max(posicion, 0), 6) * 70 + "ms");
    });

    if (!("IntersectionObserver" in window)) {
      objetivos.forEach((el) => el.classList.add("visible"));
      return;
    }

    const vigilante = new IntersectionObserver(
      (entradas, obs) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add("visible");
          obs.unobserve(entrada.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    objetivos.forEach((el) => vigilante.observe(el));
  }

  /* ==========================================================
     7. Contador y frases
     ========================================================== */
  function initContador() {
    const numero = $("#contador");
    const detalle = $("#contador-detalle");
    if (!numero) return;

    const pintar = () => {
      const hoy = new Date();
      const dias = Math.max(0, Math.floor((hoy - INICIO) / 86400000));
      numero.textContent = dias.toLocaleString("es-CO");

      if (!detalle) return;

      let anios = hoy.getFullYear() - INICIO.getFullYear();
      let meses = hoy.getMonth() - INICIO.getMonth();
      let diasMes = hoy.getDate() - INICIO.getDate();

      if (diasMes < 0) {
        meses -= 1;
        diasMes += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
      }
      if (meses < 0) {
        anios -= 1;
        meses += 12;
      }

      const partes = [];
      if (anios > 0) partes.push(plural(anios, "año", "años"));
      if (meses > 0) partes.push(plural(meses, "mes", "meses"));
      if (diasMes > 0 || partes.length === 0) partes.push(plural(diasMes, "día", "días"));

      detalle.textContent = partes.join(", ") + " · " + Math.floor(dias * 24).toLocaleString("es-CO") + " horas";
    };

    pintar();
    setInterval(pintar, 60000);
  }

  /* La frase de la portada se escribe, se queda un momento y se borra sola,
     en bucle y sin parar. Va con timeouts encadenados y no con setInterval
     porque cada frase tarda distinto según lo larga que sea. */
  function initFrases() {
    const contenedor = $("#frase");
    if (!contenedor) return;

    /* Con las animaciones apagadas el texto se escribe igual, pero el cursor
       no parpadea: se queda fijo al final. Sigue siendo legible sin cambios. */
    if (prefersMotion.matches) {
      contenedor.classList.add("frase-sin-blink");
    }

    const nodoTexto = document.createTextNode("");
    const cursor = crear("span", { class: "frase__cursor", "aria-hidden": "true" });
    cursor.textContent = "_";
    contenedor.replaceChildren(nodoTexto, cursor);

    const ESCRIBE = 55;   // ms entre letra y letra
    const BORRA = 30;     // ms entre letra y letra al borrar
    const MIRA = 1900;    // ms que se queda la frase ya escrita
    const PAUSA = 240;    // ms de respiro entre una frase y la siguiente

    let indice = 0;
    let letras = 0;
    let borrando = false;
    let temporizador = 0;

    const tick = () => {
      const frase = frases[indice % frases.length];

      if (!borrando) {
        letras += 1;
        nodoTexto.data = frase.slice(0, letras);

        if (letras >= frase.length) {
          borrando = true;
          temporizador = setTimeout(tick, MIRA);
          return;
        }

        /* Se hace una pausa un poco más larga tras los signos: es lo que hace
           que una máquina de escribir no parezca un texto que sale de golpe. */
        const caracter = frase[letras - 1];
        temporizador = setTimeout(tick, /[.,;:¡?…]/.test(caracter) ? 210 : 42 + Math.random() * 46);
        return;
      }

      letras -= 1;
      nodoTexto.data = frase.slice(0, letras);

      if (letras <= 0) {
        borrando = false;
        indice += 1;
        temporizador = setTimeout(tick, PAUSA);
        return;
      }

      temporizador = setTimeout(tick, BORRA);
    };

    contenedor.classList.add("frase-entrando");
    tick();

    /* Con la pestaña escondida no hace falta seguir escribiendo letra por
       letra. Al volver se retoma desde la misma letra, sin perder el sitio. */
    document.addEventListener("visibilitychange", () => {
      clearTimeout(temporizador);
      if (!document.hidden) tick();
    });
  }

  /* ==========================================================
     8. Máquina de escribir
     ========================================================== */
  function initMaquina() {
    const sobre = $("#sobre-2");
    if (!sobre) return;

    const parrafos = $$(".maquina", sobre);
    if (!parrafos.length) return;

    const textos = parrafos.map((p) => p.textContent);
    const pista = $(".sobre__pista", sobre);
    const carta = $(".carta", sobre);
    let escribiendo = false;

    const terminar = () => {
      parrafos.forEach((p, i) => {
        p.textContent = textos[i];
        p.classList.remove("ultimo");
      });
      escribiendo = false;
      if (carta) carta.classList.remove("carta--escribiendo");
      if (pista) pista.textContent = "Carta completa";
    };

    const escribir = () => {
      if (escribiendo) return;

      if (prefersMotion.matches) {
        terminar();
        return;
      }

      escribiendo = true;
      parrafos.forEach((p) => {
        p.textContent = "";
        p.classList.remove("ultimo");
      });
      if (carta) carta.classList.add("carta--escribiendo");
      if (pista) pista.textContent = "Toca la carta para completarla";

      let indice = 0;

      const paso = () => {
        if (!escribiendo) return;

        if (indice >= parrafos.length) {
          parrafos[indice - 1].classList.remove("ultimo");
          escribiendo = false;
          if (pista) pista.textContent = "Carta completa";
          return;
        }

        const parrafo = parrafos[indice];
        const texto = textos[indice];
        parrafo.textContent = texto.slice(0, parrafo.textContent.length + 1);

        if (parrafo.textContent.length >= texto.length) {
          parrafo.classList.remove("ultimo");
          indice += 1;
          setTimeout(paso, 380);
          return;
        }

        parrafo.classList.add("ultimo");
        const caracter = texto[parrafo.textContent.length - 1];
        setTimeout(paso, /[.,;:]/.test(caracter) ? 70 : 10 + Math.random() * 10);
      };

      paso();
    };

    if (carta) {
      carta.addEventListener("click", () => {
        if (escribiendo) terminar();
      });
    }

    sobre.addEventListener("toggle", () => {
      if (sobre.open) {
        if (!escribiendo) escribir();
      } else {
        // Si se cierra a media escritura, se completa: si no, la carta se
        // quedaba a medias para siempre y no volvía a escribir al reabrirla.
        if (escribiendo) terminar();
        if (pista) pista.textContent = "Abrir el sobre";
      }
    });

    if (sobre.open) escribir();
  }

  /* ==========================================================
     9. Mini juego
     ========================================================== */
  function initJuego() {
    const form = $("#game");
    const pregunta = $("#pregunta");
    const campo = $("#respuesta");
    const resultado = $("#resultado");
    const medidor = $("#amor");
    const valor = $("#amor-valor");
    const boton = $("#game button[type='submit']");
    if (!form || !pregunta || !campo || !resultado || !medidor || !valor || !boton) return;

    let indice = 0;
    let amor = 100;
    let terminado = false;
    let esperando = false;

    const pintarAmor = () => {
      medidor.value = amor;
      valor.textContent = amor + "%";
    };

    const mostrarPregunta = (conFoco) => {
      if (terminado) return;
      pregunta.textContent = `${indice + 1}. ${preguntas[indice].texto}`;
      resultado.textContent = "";
      resultado.removeAttribute("data-estado");
      /* Hay que devolver el campo a escribible en cada pregunta nueva. Antes
         quedaba bloqueado para siempre desde la primera respuesta, así que
         en la segunda y la tercera no se podía escribir nada. */
      campo.value = "";
      campo.readOnly = false;
      if (conFoco) campo.focus({ preventScroll: true });
    };

    const reiniciar = () => {
      indice = 0;
      amor = 100;
      terminado = false;
      esperando = false;
      campo.disabled = false;
      campo.readOnly = false;
      boton.textContent = "Responder";
      pintarAmor();
      mostrarPregunta(true);
    };

    const cerrar = () => {
      terminado = true;
      campo.readOnly = true;
      campo.disabled = true;
      boton.textContent = "Volver a jugar";
      const veredicto =
        amor >= 100
          ? "Amor intacto. Yo sabía que me recordabas todo 🤍"
          : amor >= 50
          ? "Terminaste con " + amor + "% de amor. Suficiente para casarnos 😌"
          : "Te quedaste con " + amor + "%… pero el mío sigue al 100% 😘";
      pregunta.textContent = "Juego terminado";
      resultado.textContent = veredicto;
      resultado.dataset.estado = amor >= 50 ? "bien" : "mal";
    };

    form.addEventListener("submit", (evento) => {
      evento.preventDefault();

      if (terminado) {
        reiniciar();
        return;
      }

      if (esperando) {
        esperando = false;
        boton.textContent = "Responder";
        indice += 1;
        if (indice >= preguntas.length) cerrar();
        else mostrarPregunta(true);
        return;
      }

      const actual = preguntas[indice];
      const respuesta = normalizar(campo.value);
      const acierto = respuesta !== "" && actual.acepta.some((opcion) => normalizar(opcion) === respuesta);

      if (acierto) {
        resultado.textContent = actual.acierto;
        resultado.dataset.estado = "bien";
        const caja = boton.getBoundingClientRect();
        fondo.saltar(caja.left + caja.width / 2, caja.top + caja.height / 2, 30);
      } else {
        amor = Math.max(0, amor - actual.castigo);
        resultado.textContent = actual.fallo;
        resultado.dataset.estado = "mal";
      }

      pintarAmor();
      /* Solo lectura, no deshabilitado: así la respuesta escrita sigue a la
         vista y se puede seguir con Enter o con el botón. */
      campo.readOnly = true;
      esperando = true;
      boton.textContent = indice === preguntas.length - 1 ? "Ver resultado" : "Siguiente";
    });

    pintarAmor();
    mostrarPregunta(false);
  }

  /* ==========================================================
     10. Zona secreta
     ========================================================== */
  function initSecreto() {
    const form = $("#formulario-secreto");
    const campo = $("#clave");
    const estado = $("#secreto-estado");
    const secreto = $("#contenidoSecreto");
    if (!form || !campo || !secreto) return;

    form.addEventListener("submit", (evento) => {
      evento.preventDefault();

      const correcta = CLAVE.some((opcion) => normalizar(opcion) === normalizar(campo.value));

      if (correcta) {
        secreto.hidden = false;
        const caja = secreto.getBoundingClientRect();
        fondo.saltar(window.innerWidth / 2, caja.top + 40, 40);
        if (estado) estado.textContent = "Secreto desbloqueado.";
        secreto.scrollIntoView({ behavior: prefersMotion.matches ? "auto" : "smooth", block: "center" });
      } else {
        if (estado) estado.textContent = "Esa no es la fecha correcta.";
        form.animate(
          [
            { transform: "translateX(0)" },
            { transform: "translateX(-8px)" },
            { transform: "translateX(8px)" },
            { transform: "translateX(0)" }
          ],
          { duration: 320, easing: "ease-in-out" }
        );
      }
    });
  }

  /* ==========================================================
     11. Barra de progreso de lectura
     ========================================================== */  function initProgreso() {
    const barra = $("#progreso");
    if (!barra) return;

    let pendiente = false;

    const medir = () => {
      pendiente = false;
      const recorrido = document.documentElement.scrollHeight - window.innerHeight;
      const avance = recorrido > 0 ? (window.scrollY / recorrido) * 100 : 0;
      barra.value = Math.min(100, Math.max(0, avance));
    };

    const pedir = () => {
      if (pendiente) return;
      pendiente = true;
      window.requestAnimationFrame(medir);
    };

    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir, { passive: true });
    window.addEventListener("load", pedir);
    medir();
  }

  /* ==========================================================
     12. Mensaje del Día de la Mujer
     ========================================================== */
  function initMujer() {
    const boton = $("#boton-mujer");
    const mensaje = $("#mensajeMujer");
    if (!boton || !mensaje) return;

    boton.addEventListener("click", () => {
      mensaje.textContent =
        "Gracias por permitirme ser el novio y futuro esposo de tan maravillosa mujer. Te amo 🤍";
      const caja = boton.getBoundingClientRect();
      fondo.saltar(caja.left + caja.width / 2, caja.top, 34);
      boton.textContent = "Gracias por leerlo 🤍";
      boton.disabled = true;
    });
  }

  /* ==========================================================
     12. Alto real de la cabecera
     ========================================================== */
  /* Los botones de salto deben dejar siempre la sección justo debajo de la
     cabecera, sin que quede más arriba o más abajo de lo normal. Se mide la
     cabecera en vez de fiarse de un valor fijo, que no cuadra en todos los
     anchos de pantalla. */
  function initAltoCabecera() {
    const cabecera = $("#cabecera");
    if (!cabecera) return;

    let pendiente = false;

    const medir = () => {
      pendiente = false;
      const alto = Math.round(cabecera.getBoundingClientRect().height);
      if (alto > 0) {
        document.documentElement.style.setProperty("--alto-cabecera", alto + "px");
      }
    };

    const pedir = () => {
      if (pendiente) return;
      pendiente = true;
      window.requestAnimationFrame(medir);
    };

    window.addEventListener("resize", pedir, { passive: true });
    window.addEventListener("orientationchange", pedir, { passive: true });
    window.addEventListener("load", pedir);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(pedir).catch(() => {});
    medir();
  }

  /* ==========================================================
     13. Instalación como app (PWA)
     ========================================================== */
  /* El service worker es lo que guarda la página en el celular para que abra
     al instante y siga funcionando sin internet. Sin él, el navegador no
     ofrece instalarla, aunque el manifest esté todo bien.

     sw.js está en la raíz del sitio (y no en js/) porque un service worker
     solo puede controlar su propia carpeta: desde js/ no llegaría al
     index.html. La ruta y el scope son relativas para que funcione igual en
     la raíz de un dominio o en una subcarpeta, como en GitHub Pages.

     Ojo: solo funciona en https:// o en localhost. Abierto como archivo
     (file://) no hay service worker, y por eso todo esto va envuelto en un
     try/catch: así, abriendo el index.html directo, no se ve ningún error. */
  function initPWA() {
    if (!("serviceWorker" in navigator)) return;

    try {
      navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(() => {});
    } catch (e) {
      /* sin service worker la página sigue funcionando igual */
    }
  }

  /* ==========================================================
     14. Acceso
     ========================================================== */
  /* Acepta la respuesta con o sin espacios y con acentos de más o de menos,
     para que dé igual si escribe 22022026, 22/02/2026 o "22 de febrero". */
  const esLaClave = (valor) => {
    const escrito = normalizar(valor);
    if (!escrito) return false;
    const joined = escrito.replace(/\s+/g, "");
    return ACCESO.some((opcion) => {
      const buena = normalizar(opcion);
      return escrito === buena || joined === buena.replace(/\s+/g, "");
    });
  };

  function initAcceso() {
    const cartel = $("#acceso");
    const form = $("#acceso-form");
    const campo = $("#acceso-clave");
    const estado = $("#acceso-estado");
    const botonPista = $("#acceso-pista");
    const ayuda = $("#acceso-ayuda");
    if (!cartel || !form || !campo) return;

    const raiz = document.documentElement;
    const recordar = () => {
      try {
        return sessionStorage.getItem(CLAVE_ACCESO) === "ok";
      } catch (e) {
        return false;
      }
    };

    const abrir = () => {
      cartel.hidden = true;
      raiz.classList.remove("acceso-cerrado");
      raiz.classList.add("acceso-listo");
      try {
        sessionStorage.setItem(CLAVE_ACCESO, "ok");
      } catch (e) { /* si no hay storage, el cartel vuelve al recargar */ }
    };

    /* Ya había entrado en esta sesión: no se vuelve a preguntar y la página
       queda lista desde el principio. */
    if (recordar()) {
      abrir();
      return;
    }

    raiz.classList.add("acceso-cerrado");
    campo.focus({ preventScroll: true });

    if (botonPista && ayuda) {
      botonPista.addEventListener("click", () => {
        ayuda.hidden = false;
        botonPista.hidden = true;
      });
    }

    form.addEventListener("submit", (evento) => {
      evento.preventDefault();

      if (esLaClave(campo.value)) {
        const caja = form.getBoundingClientRect();
        fondo.saltar(window.innerWidth / 2, caja.top + caja.height / 2, 60);
        abrir();
        return;
      }

      if (estado) {
        estado.textContent = "Esa no es. Piensa en nuestro primer aniversario 💭";
        estado.removeAttribute("data-estado");
      }
      campo.select();
      form.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-8px)" },
          { transform: "translateX(8px)" },
          { transform: "translateX(0)" }
        ],
        { duration: 320, easing: "ease-in-out" }
      );
    });
  }

  /* ==========================================================
     15. Arranque
     ========================================================== */
  function init() {
    pintarFotos();
    pintarVideos();
    pintarMusica();
    pintarRedes();

    initAltoCabecera();
    initMenu();
    initRevelado();
    initContador();
    initFrases();
    initMaquina();
    initJuego();
    initSecreto();
    initMujer();
    initProgreso();
    initAcceso();
    initPWA();
    fondo.init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
