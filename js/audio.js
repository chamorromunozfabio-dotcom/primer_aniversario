/* Nuestro año — música y efectos de los juegos.
   https://developer.mozilla.org/es/docs/Web/API/Web_Audio_API

   Aquí no hay ningún archivo de audio: la música se arma con la Web Audio API,
   que es un sintetizador que vive en el navegador. Se decide así a propósito:

   · No hay que subir ni un MP3 (la página pesa lo mismo y funciona sin internet).
   · Cada juego tiene su propio tema, hecho con la misma melodía romanticona
     pero a distinto tempo, así que suenan distintos sin ser otra canción.
   · Los efectos (un "plín" al acertar, un acorde al ganar) salen del mismo
     sitio y no suenan ajenos a la música.

   Chords y melodías están escritos como notas MIDI (69 = La 440 Hz), que es la
forma más fácil de leer: cada número es una tecla de piano y para cambiar la
      tonalidad solo hay que sumar o restar el mismo número a todo.

   Ojo con el nombre: esto NO es `window.Audio`, porque ese es el constructor
   `new Audio()` que usan los navegadores y hay que dejarlo en paz. */
window.AudioJuego = (function () {
  "use strict";

  /* ---------- Notas ---------- */

  /* Frecuencia en hercios de una nota MIDI. 69 es el La que suena en 440. */
  const hz = (nota) => 440 * Math.pow(2, (nota - 69) / 12);

  /* Escala de Re menor, la que usa "Melón Vino" y casi todo lo romántico.
     [0, 2, 3, 5, 7, 8, 10] son los grados: tónica, supertónica, ... */
  const ESCALA = [0, 2, 3, 5, 7, 8, 10];

  /* Un acorde es una nota base más los intervalos que se le suman. */
  const ACORDES = {
    menor: [0, 3, 7, 12],
    mayor: [0, 4, 7, 12],
    septimo: [0, 4, 7, 10],
    suspendido: [0, 5, 7, 12]
  };

  /* ---------- Motor ---------- */

  let ctx = null;
  let master = null;
  let busMusica = null;
  let efectos = null;
  let reverb = null;
  let iniciado = false;
  let silenciado = false;
  let temporizador = null;
  let temaActual = null;

  /* Los navegadores no dejan sonar nada hasta que la persona toca algo en la
     página, por eso el audio se arma en el primer clic y no antes. */
  function despertar() {
    if (iniciado) {
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      return;
    }

    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return;

    try {
      ctx = new Contexto();
    } catch (e) {
      return; /* sin audio el juego sigue funcionando igual */
    }

    /* Volumen general: bastante bajo, que esto suena de fondo mientras juegan. */
    master = ctx.createGain();
    master.gain.value = silenciado ? 0 : 0.5;
    master.connect(ctx.destination);

    /* Una reverb cortita da el aire de "sala pequeña" que hace que un acorde
       sintetizado suene a canción y no a pitido. Se arma con ruido que se
       apaga, que es el truco clásico para hacer una impulso. */
    reverb = ctx.createConvolver();
    reverb.buffer = impulso();
    const mandoReverb = ctx.createGain();
    mandoReverb.gain.value = 0.25;
    reverb.connect(mandoReverb);
    mandoReverb.connect(master);

    /* Bus de música y bus de efectos, para poder callar la música sin
       callar los pitidos de acierto. */
    busMusica = ctx.createGain();
    busMusica.gain.value = 0.55;
    busMusica.connect(master);

    efectos = ctx.createGain();
    efectos.gain.value = 0.9;
    efectos.connect(master);

    iniciado = true;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    if (temaActual) arrancarTema(temaActual);
  }

  /* Ruido blanco con apagado exponencial: es la respuesta de un ambiente. */
  function impulso() {
    const largo = Math.floor(ctx.sampleRate * 1.6);
    const buffer = ctx.createBuffer(2, largo, ctx.sampleRate);
    for (let canal = 0; canal < 2; canal++) {
      const datos = buffer.getChannelData(canal);
      for (let i = 0; i < largo; i++) {
        datos[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 2.6);
      }
    }
    return buffer;
  }

  /* ---------- Tonos ---------- */

  /* Una nota sola: onda + envolvente. "onda" puede ser sine, triangle, square o
     sawtooth; triangle es la que más se parece a un piano lento. */
  function tono(nota, duracion, opciones) {
    if (!iniciado || silenciado) return;
    const op = opciones || {};
    const ahora = ctx.currentTime + (op.espera || 0);
    const dur = duracion || 0.35;

    const osc = ctx.createOscillator();
    osc.type = op.onda || "triangle";
    osc.frequency.setValueAtTime(hz(nota), ahora);

    const ganancia = ctx.createGain();
    const pico = op.volumen === undefined ? 0.22 : op.volumen;
    ganancia.gain.setValueAtTime(0.0001, ahora);
    ganancia.gain.exponentialRampToValueAtTime(pico, ahora + 0.02);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, ahora + dur);

    let salida = efectos;
    if (op.aMusica) salida = busMusica;

    osc.connect(ganancia);
    ganancia.connect(salida);
    if (op.conEco) ganancia.connect(reverb);

    osc.start(ahora);
    osc.stop(ahora + dur + 0.05);
  }

  /* Ruido blanco corto, para el "pum" de los golpes tipo arcade. */
  function golpe(volumen, duracion) {
    if (!iniciado || silenciado) return;
    const ahora = ctx.currentTime;
    const dur = duracion || 0.16;

    const largo = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, largo, ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < largo; i++) {
      datos[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 3);
    }

    const fuente = ctx.createBufferSource();
    fuente.buffer = buffer;

    const filtro = ctx.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.value = 900;

    const ganancia = ctx.createGain();
    ganancia.gain.value = volumen === undefined ? 0.3 : volumen;

    fuente.connect(filtro);
    filtro.connect(ganancia);
    ganancia.connect(efectos);
    fuente.start(ahora);
  }

  /* ---------- Temas ---------- */

  /* Cada tema es una lista de pasos. Un paso es:
       [nota, duracion, volumen]
     y si la nota es null es un silencio. Se tocan en bucle, así que la lista
     tiene que sonar bien por los dos extremos.

     base: nota MIDI donde empieza la melodía. 62 es un Re medio.
     tempo: golpes por minuto. 76 es tranquilo, 120 es movido.
     ona: forma de onda. triangle es la más parecida a un piano. */

  const TEMAS = {
    /* El del menú: lento, con la melodía por encima de un pad suave. */
   suave: {
      tempo: 68,
      onda: "triangle",
      pasos: [
        [74, 0.9, 0.20], [null, 0.3], [77, 0.7, 0.16], [null, 0.3],
        [79, 1.1, 0.20], [null, 0.4], [77, 0.7, 0.15], [null, 0.3],
        [76, 0.9, 0.19], [null, 0.3], [72, 0.7, 0.16], [null, 0.3],
        [74, 1.4, 0.20], [null, 0.6]
      ]
    },

    /*      Corazones en el aire: va más rápido, para que dé ganas de correr. */
   corazon: {
      tempo: 104,
      onda: "square",
      pasos: [
        [74, 0.32, 0.12], [77, 0.32, 0.10], [81, 0.32, 0.12], [79, 0.32, 0.10],
        [77, 0.32, 0.10], [74, 0.32, 0.10], [76, 0.32, 0.12], [null, 0.32],
        [72, 0.32, 0.12], [76, 0.32, 0.10], [79, 0.32, 0.12], [77, 0.32, 0.10],
        [76, 0.32, 0.10], [72, 0.32, 0.10], [74, 0.64, 0.12], [null, 0.32]
      ]
    },

    /* Amor Runner: ritmo de carrera, con un bajo marcando el paso. */
    carrera: {
      tempo: 126,
      onda: "sawtooth",
      pasos: [
        [62, 0.26, 0.14], [null, 0.2], [69, 0.26, 0.10], [null, 0.2],
        [74, 0.26, 0.11], [null, 0.2], [72, 0.26, 0.10], [null, 0.2],
        [65, 0.26, 0.14], [null, 0.2], [72, 0.26, 0.10], [null, 0.2],
        [77, 0.26, 0.11], [null, 0.2], [76, 0.26, 0.10], [null, 0.2],
        [67, 0.26, 0.14], [null, 0.2], [74, 0.26, 0.10], [null, 0.2],
        [79, 0.26, 0.11], [null, 0.2], [77, 0.26, 0.10], [null, 0.2],
        [69, 0.26, 0.14], [null, 0.2], [72, 0.26, 0.10], [null, 0.2],
        [74, 0.52, 0.12], [null, 0.4]
      ]
    },

    /* Memoria del amor: campanas lentas, como las de un carrusel. */
    memoria: {
      tempo: 72,
      onda: "sine",
      pasos: [
        [81, 0.55, 0.20], [null, 0.35], [84, 0.55, 0.17], [null, 0.35],
        [86, 0.9, 0.20], [null, 0.5], [84, 0.5, 0.15], [null, 0.3],
        [79, 0.55, 0.19], [null, 0.35], [77, 0.55, 0.16], [null, 0.35],
        [74, 0.5, 0.15], [null, 0.3], [77, 1.1, 0.19], [null, 0.5]
      ]
    },

    /* Memoria de fotos: el más tranquilo de todos, para pensar. */
    fotos: {
      tempo: 60,
      onda: "sine",
      pasos: [
        [69, 1.3, 0.17], [null, 0.5], [72, 0.9, 0.14], [null, 0.4],
        [76, 1.5, 0.17], [null, 0.6], [74, 0.9, 0.13], [null, 0.4],
        [69, 1.2, 0.16], [null, 0.5], [67, 0.9, 0.14], [null, 0.4],
        [64, 1.6, 0.17], [null, 0.6]
      ]
    },

    /* Verdad o Reto: un poco nerviosa, como cuando hay que decidir. */
    reto: {
      tempo: 88,
      onda: "triangle",
      pasos: [
        [69, 0.4, 0.16], [72, 0.4, 0.14], [76, 0.4, 0.16], [74, 0.4, 0.13],
        [72, 0.4, 0.15], [69, 0.4, 0.13], [67, 0.4, 0.16], [69, 0.4, 0.12],
        [71, 0.4, 0.16], [74, 0.4, 0.14], [77, 0.4, 0.16], [76, 0.4, 0.13],
        [74, 0.4, 0.15], [72, 0.4, 0.13], [69, 0.4, 0.16], [67, 0.4, 0.12],
        [69, 0.8, 0.16], [null, 0.4]
      ]
    },

    /* Piedra, tijera, corazón: la más rápida, casi de videojuego. */
    duelo: {
      tempo: 112,
      onda: "square",
      pasos: [
        [69, 0.22, 0.11], [76, 0.22, 0.09], [81, 0.22, 0.11], [79, 0.22, 0.09],
        [77, 0.22, 0.11], [74, 0.22, 0.09], [72, 0.22, 0.11], [76, 0.22, 0.09],
        [69, 0.22, 0.11], [72, 0.22, 0.09], [76, 0.22, 0.11], [81, 0.22, 0.09],
        [79, 0.22, 0.11], [77, 0.22, 0.09], [74, 0.22, 0.11], [69, 0.44, 0.10]
      ]
    }
  };

  /* El tiempo total de un tema, para saber cuándo vuelve a empezar. */
  function duracionTema(tema) {
    return tema.pasos.reduce((total, paso) => total + paso[1], 0);
  }

  function tocarTema(índice) {
    const tema = TEMAS[temaActual];
    const paso = tema.pasos[índice % tema.pasos.length];
    if (paso[0] !== null && paso[0] !== undefined) {
      tono(paso[0], paso[1], { volumen: paso[2], onda: tema.onda, aMusica: true, conEco: true });
    }
  }

  function arrancarTema(nombre) {
    if (!TEMAS[nombre]) return;
    temaActual = nombre;
    if (!iniciado) return; /* se arrancará sola al despertar */

    clearInterval(temporizador);
    const tema = TEMAS[nombre];

    /* El ciclo es la suma de los pasos: las duraciones de cada paso ya están
       en segundos, así que el tempo no se vuelve a aplicar acá (si se
       aplicara dos veces la música iría a la mitad de velocidad). */
    const ciclo = duracionTema(tema);

    let transcurrido = 0;
    let ultimo = performance.now();
    let indice = -1;

    const paso = (ahora) => {
      /* Se usa el reloj real y no el del audio: si la pestaña se congeló un
         momento, el ciclo simplemente salta al paso que corresponde. */
      const delta = Math.min((ahora - ultimo) / 1000, 0.5);
      ultimo = ahora;
      transcurrido += delta;

      /* Los pasos van marcando el índice hasta donde llegó el tiempo. Con
         varias notas pendientes se tocan todas, así que al volver de una
         pestaña dormida no queda un atajuste de notas atrasadas. */
      let acumulado = 0;
      const nuevo = tema.pasos.findIndex((p) => {
        if (acumulado + p[1] > transcurrido) return true;
        acumulado += p[1];
        return false;
      });

      const destino = nuevo === -1 ? 0 : nuevo;

      if (destino === indice) return;
      /* Si el índice saltó más de un paso, el recorrido se da vuelta entera. */
      while (indice < destino || (indice >= tema.pasos.length && destino === 0)) {
        indice = indice < 0 ? 0 : indice + 1;
        if (indice >= tema.pasos.length) indice = 0;
        tocarTema(indice);
        if (indice === destino) break;
      }
      indice = destino;

      if (transcurrido >= ciclo) transcurrido -= ciclo;
    };

    ultimo = performance.now();
    tocarTema(0);
    indice = 0;
    temporizador = setInterval(() => paso(performance.now()), 40);
  }

  /* ---------- Efectos sueltos ---------- */

  const EFECTOS = {
    clic: () => tono(84, 0.09, { volumen: 0.12, onda: "sine" }),

    bien: () => {
      [76, 81, 84].forEach((n, i) => {
        tono(n, 0.22, { volumen: 0.18, onda: "triangle", espera: i * 0.07, conEco: true });
      });
    },

    mal: () => {
      tono(50, 0.3, { volumen: 0.16, onda: "sawtooth" });
      tono(49, 0.34, { volumen: 0.12, onda: "sawtooth", espera: 0.08 });
    },

    atrapado: () => {
      tono(81, 0.14, { volumen: 0.2, onda: "sine", conEco: true });
      tono(88, 0.2, { volumen: 0.14, onda: "sine", espera: 0.05, conEco: true });
    },

    perdio: () => {
      golpe(0.28, 0.2);
      tono(45, 0.35, { volumen: 0.16, onda: "sawtooth" });
    },

    victoria: () => {
      [69, 72, 76, 81, 84].forEach((n, i) => {
        tono(n, 0.5, { volumen: 0.19, onda: "triangle", espera: i * 0.11, conEco: true });
      });
      setTimeout(() => tono(88, 1.2, { volumen: 0.16, onda: "sine", conEco: true }), 620);
    },

    empate: () => {
      [72, 72].forEach((n, i) => {
        tono(n, 0.4, { volumen: 0.17, onda: "triangle", espera: i * 0.16, conEco: true });
      });
    },

    "cuenta-alta": () => tono(84, 0.16, { volumen: 0.16, onda: "sine", conEco: true }),
    "cuenta-baja": () => tono(74, 0.16, { volumen: 0.14, onda: "sine" }),

    pasar: () => tono(67, 0.12, { volumen: 0.1, onda: "sine" }),

    descubrir: () => {
      [76, 79, 84, 88].forEach((n, i) => {
        tono(n, 0.6, { volumen: 0.18, onda: "sine", espera: i * 0.09, conEco: true });
      });
    },
    sonar1: () => tono(72, 0.25, { volumen: 0.16, onda: "triangle", conEco: true }),
    sonar2: () => tono(74, 0.25, { volumen: 0.16, onda: "triangle", conEco: true }),
    sonar3: () => tono(76, 0.25, { volumen: 0.16, onda: "triangle", conEco: true }),
    sonar4: () => tono(77, 0.25, { volumen: 0.16, onda: "triangle", conEco: true }),
    sonar5: () => tono(79, 0.25, { volumen: 0.16, onda: "triangle", conEco: true }),
    sonar6: () => tono(81, 0.25, { volumen: 0.16, onda: "triangle", conEco: true }),
    sonar7: () => tono(83, 0.25, { volumen: 0.16, onda: "triangle", conEco: true }),
    sonar8: () => tono(84, 0.25, { volumen: 0.16, onda: "triangle", conEco: true })
  };

  /* La memoria del amor necesita un tono por botón. Se expone aparte de los
     efectos porque el juego elige la nota, no un nombre de efecto. */
  function notaDeSecuencia(nota) {
    despertar();
    tono(nota, 0.42, { volumen: 0.17, onda: "triangle", conEco: true });
  }

  /* ---------- Interfaz ---------- */

  function reproducir(nombre) {
    despertar();
    if (!iniciado) return;
    const efecto = EFECTOS[nombre];
    if (efecto) efecto();
  }

  /* Tocar un tema o, sin argumento, callar la música. Los efectos sueltos
     siguen sonando igual: son buses separados. */
  function musica(nombre) {
    if (nombre) {
      arrancarTema(nombre);
    } else {
      clearInterval(temporizador);
      temporizador = null;
    }
  }

  /* Los "cuenta regresiva" del reloj suenan distintos si la nota es alta o
     baja, así que acá se acepta un segundo argumento. */
  function cuenta(alta) {
    reproducir(alta ? "cuenta-alta" : "cuenta-baja");
  }

  function silenciar() {
    silenciado = !silenciado;
    if (master) {
      master.gain.setTargetAtTime(silenciado ? 0 : 0.5, ctx.currentTime, 0.05);
    }
    return silenciado;
  }

  return {
    despertar,
    reproducir,
    musica,
    cuenta,
    silenciar,
    notaDeSecuencia,
    get activo() {
      return iniciado && !silenciado;
    }
  };
})();
