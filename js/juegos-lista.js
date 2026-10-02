/* Nuestro año — los seis minijuegos.
   https://developer.mozilla.org/es/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes

   La maquinaria común (las tarjetas, el menú, el marcador, el reloj y el
   podio) está en juegos.js. Acá están solo los juegos.

   Para agregar un séptimo: escríbelo abajo y llámalo con registrar(...). No
   hay que tocar ningún otro archivo, el tablero lo encuentra solo.

   Cada juego dibuja todo en un canvas de 640x320 y tiene su propio `tema` de
   música. Los puntos nunca se escriben a mano: se suman con api.sumar(quien,
   n), y por eso los seis anotan igual. */
(function () {
  "use strict";

  const { registrar, corazon, noche, parrafo, mezclar, alPeso, foto, fotosDelSitio } = window.Juegos;
  const audio = window.AudioJuego;

  /* Un dibujito suelto para las manos del duelo. */
  function glifoDe(opcion) {
    return opcion === "piedra" ? "✊" : opcion === "tijera" ? "✌" : "♥";
  }

  /* El nombre de una tecla, para poder ponerla escrita abajo de cada botón. */
  const DIBUJO_TECLA = { izquierda: "←", derecha: "→", arriba: "↑", abajo: "↓" };
  const teclaEscrita = (t) => DIBUJO_TECLA[t] || (t || "").toUpperCase();

  /* ==========================================================
     1. CORAZONES EN EL AIRE
     Lo que cae del cielo hay que atraparlo. Cada acierto seguido sube la
     racha y la racha suma extra. Los "roto" quitan puntos y la rompen.
     ========================================================== */
  registrar({
    id: "corazones",
    titulo: "Corazones en el aire",
    resumen: "Atrapa lo que cae y esquiva los rotos. Cada acierto seguido suma más.",
    icono: "i-relleno",
    teclas: { el: "A / D", ella: "← / →" },
    tema: "corazon",
    duracion: 60,

    iniciar(api) {
      const W = api.ancho;
      const H = api.alto;
      const suelo = H - 24;

      /* Cada jugador tiene su propio carril, así los dos pueden jugar en el
         mismo teclado sin pisarse: el de la izquierda y el de la derecha.
         El hueco entre los dos es de 77 px a propósito: el radio de atrapada
         es de 30, y si los carriles se acercaran más un corazón del borde
         podría sumar para los dos. */
      const jugadores = [
        { quien: "el", x: W * 0.24, min: 34, max: W * 0.44, racha: 0 },
        { quien: "ella", x: W * 0.76, min: W * 0.56, max: W - 34, racha: 0 }
      ];

      const cayendo = [];
      const chispas = [];
      let espera = 0.4;

      /* Al principio baja lento y al final hay que reaccionar rápido. */
      api.setTiempoTurno(30);
      const velocidad = () => 120 + api.transcurrido() * 1.1;

      function soltar() {
        const tipo = alPeso([
          { clase: "rosa", valor: 10, peso: 6, tam: 15 },
          { clase: "oro", valor: 30, peso: 2, tam: 20 },
          { clase: "roto", valor: -15, peso: 3, tam: 15 }
        ]);
        const destino = jugadores[api.turno()];
        cayendo.push({
          x: destino.min + Math.random() * (destino.max - destino.min),
          y: -26,
          vy: velocidad() + Math.random() * 30,
          clase: tipo.clase,
          valor: tipo.valor,
          tam: tipo.tam,
          giro: (Math.random() - 0.5) * 2.4,
          angulo: 0
        });
      }

      function chispa(x, y, color, texto) {
        for (let i = 0; i < 12; i++) {
          chispas.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 150,
            vy: -50 - Math.random() * 130,
            vida: 0.5 + Math.random() * 0.4,
            tope: 0.9,
            color: color
          });
        }
        chispas.push({ x: x, y: y, vx: 0, vy: -58, vida: 1.1, tope: 1.1, texto: texto, color: color });
      }

      function mover(jugador, izquierda, derecha, dt) {
        const dir = (derecha ? 1 : 0) - (izquierda ? 1 : 0);
        jugador.x += dir * 250 * dt;
        jugador.x = Math.max(jugador.min, Math.min(jugador.max, jugador.x));
      }

      return {
        onTurnoCambio() {},
        actualizar(dt, teclas) {
          const turno = api.turno();
          if (api.modo === "pareja") {
            mover(jugadores[0], teclas.has("a"), teclas.has("d"), dt);
            mover(jugadores[1], teclas.has("izquierda"), teclas.has("derecha"), dt);
          } else {
            if (turno === 0) {
              const izquierda = teclas.has("a") || teclas.has("izquierda");
              const derecha = teclas.has("d") || teclas.has("derecha");
              mover(jugadores[0], izquierda, derecha, dt);
            } else {
              const suyo = jugadores[1];
              const objetivo = cayendo
                .filter((c) => c.x > suyo.min)
                .sort((a, b) => b.y - a.y)[0];
              if (objetivo && Math.random() > 0.15) {
                mover(suyo, objetivo.x < suyo.x - 5, objetivo.x > suyo.x + 5, dt);
              }
            }
          }

          espera -= dt;
          if (espera <= 0) {
            soltar();
            espera = 0.3 + Math.random() * 0.35;
          }

          for (let i = cayendo.length - 1; i >= 0; i--) {
            const c = cayendo[i];
            c.y += c.vy * dt;
            c.angulo += c.giro * dt;

            if (c.y > H + 30) {
              cayendo.splice(i, 1);
              continue;
            }

            let guardado = false;

            for (let j = 0; j < jugadores.length; j++) {
              const jugador = jugadores[j];
              if (Math.abs(c.x - jugador.x) > 30) continue;
              if (c.y < suelo - 32 || c.y > suelo + 4) continue;
              if (api.modo === "pareja" && j !== api.turno()) { break; }
              guardado = true;
              if (c.clase === "roto") {
                jugador.racha = 0;
                api.sumar(jugador.quien, c.valor);
                audio.reproducir("mal");
                chispa(c.x, suelo - 22, "#c9a7f0", "" + c.valor);
                api.decir(`${api.nombre(jugador.quien)} agarr�� un roto �� ${c.valor}`);
                if (api.modo === "pareja") api.siguienteTurno();
              } else {
                jugador.racha = Math.min(jugador.racha + 1, 10);
                const puntos = c.valor + (jugador.racha - 1) * 2;
                api.sumar(jugador.quien, puntos);
                audio.reproducir("atrapado");
                chispa(c.x, suelo - 22, c.clase === "oro" ? "#e7c27d" : "#f4a6c0", "+" + puntos);
                api.decir(
                  `${api.nombre(jugador.quien)} +${puntos}` +
                  (jugador.racha > 1 ? ` �� racha de ${jugador.racha}` : "")
                );
                if (jugador.racha === 10) {
                  audio.reproducir("descubrir");
                  api.saltar(jugador.x, suelo - 40, 34);
                }
                if (api.modo === "pareja") api.siguienteTurno();
              }
              break;
            }

            if (guardado) cayendo.splice(i, 1);
          }

          for (let i = chispas.length - 1; i >= 0; i--) {
            const p = chispas[i];
            p.vida -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 340 * dt;
            if (p.vida <= 0) chispas.splice(i, 1);
          }
        },

        dibujar(g) {
          noche(g, W, H, "#2e1e3d", "#5a2b52", 0.72);

          g.strokeStyle = "rgba(244, 166, 192, 0.22)";
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(0, suelo + 0.5);
          g.lineTo(W, suelo + 0.5);
          g.stroke();

          jugadores.forEach((jugador, i) => {
            const x = jugador.x;
            const activo = api.modo === "pareja" && api.turno() === i;
            g.fillStyle = i === 0 ? "#e2688f" : "#c9a7f0";
            g.beginPath();
            g.roundRect(x - 22, suelo - 24, 44, 24, 6);
            g.fill();
            if (activo) {
              g.strokeStyle = "#e7c27d";
              g.lineWidth = 3;
              g.stroke();
            }
            g.fillStyle = "rgba(20, 13, 28, 0.3)";
            g.beginPath();
            g.roundRect(x - 16, suelo - 18, 32, 7, 3);
            g.fill();
            corazon(g, x, suelo - 36, 8, i === 0 ? "#f4a6c0" : "#e7c27d");
            g.fillStyle = "rgba(251, 241, 244, 0.8)";
            g.font = "600 13px Outfit, system-ui, sans-serif";
            g.textAlign = "center";
            g.fillText(api.nombre(jugador.quien), x, suelo + 16);
            if (jugador.racha > 1) {
              g.fillStyle = "#e7c27d";
              g.font = "600 12px Outfit, system-ui, sans-serif";
              g.fillText("racha " + jugador.racha, x, suelo - 50);
            }
          });

          for (const c of cayendo) {
            g.save();
            g.translate(c.x, c.y);
            g.rotate(c.angulo);
            corazon(g, 0, 0, c.tam, c.clase === "oro" ? "#e7c27d" : c.clase === "roto" ? "#6f5f78" : "#f4a6c0");
            /* Al roto se le cruza una rayita, para que se entienda solo sin
               tener que acordarse de cuál es cuál. */
            if (c.clase === "roto") {
              g.strokeStyle = "#241830";
              g.lineWidth = 3;
              g.beginPath();
              g.moveTo(-c.tam, -c.tam * 0.45);
              g.lineTo(c.tam, c.tam * 0.45);
              g.moveTo(c.tam, -c.tam * 0.45);
              g.lineTo(-c.tam, c.tam * 0.45);
              g.stroke();
            }
            g.restore();
          }

          for (const p of chispas) {
            g.save();
            g.globalAlpha = Math.max(0, p.vida / p.tope);
            g.fillStyle = p.color;
            if (p.texto) {
              g.font = "700 19px Outfit, system-ui, sans-serif";
              g.textAlign = "center";
              g.fillText(p.texto, p.x, p.y);
            } else {
              g.beginPath();
              g.arc(p.x, p.y, 3.4, 0, Math.PI * 2);
              g.fill();
            }
            g.restore();
          }
        },

        alPulsar(tecla) {
          if (tecla === "a" || tecla === "d" || tecla === "izquierda" || tecla === "derecha") {
            audio.reproducir("pasar");
          }
        }
      };
    }
  });

  /* ==========================================================
     2. AMOR RUNNER
     Un solo carril y los dos corriendo. Los puntos son la distancia, y cada
     corazón de bonus los suma. Los golpes no matan: te frenan un momento y
     cuestan puntos, y se sigue.
     ========================================================== */
  registrar({
    id: "runner",
    titulo: "Amor Runner",
    resumen: "Salta y llega lo más lejos posible. Los golpes no matan, pero te frenan y te cuestan.",
    icono: "i-flecha",
    teclas: { el: "Espacio", ella: "↑" },
    tema: "carrera",
    duracion: 60,

    iniciar(api) {
      const W = api.ancho;
      const H = api.alto;
      const alturaSalto = 96;
      const gravedad = 1500;

      const sueloEl = H - 38;
      const sueloElla = H - 128;
      const jugadores = [
        { quien: "el", x: 66, y: 0, v: 0, enSuelo: true, trote: 0, aturdido: 0, distancia: 0, puntosBase: 0, carril: 0, suelo: sueloEl },
        { quien: "ella", x: 66, y: 0, v: 0, enSuelo: true, trote: 0, aturdido: 0, distancia: 0, puntosBase: 0, carril: 1, suelo: sueloElla }
      ];
      const suelo = sueloEl;
      const obstaculos = [];
      let espera = 1.1;
      const velocidad = (d) => 215 + d / 130;

      function generar() {
        const tipo = alPeso([
          { clase: "piedra", peso: 5, ancho: 26, alto: 20 },
          { clase: "caja", peso: 4, ancho: 30, alto: 32 },
          { clase: "doble", peso: 2, ancho: 24, alto: 26 }
        ]);
        obstaculos.push({
          x: W + 30,
          clase: tipo.clase,
          ancho: tipo.ancho,
          alto: tipo.alto,
          torre: 0,
          carril: Math.random() < 0.5 ? 0 : 1
        });

        /* Cada tanto viene un corazón flotando, que es lo que compensa el
           riesgo de los obstáculos. */
        if (Math.random() < 0.38) {
          obstaculos.push({
            x: W + 130,
            clase: "corazon",
            ancho: 20,
            alto: 20,
            torre: alturaSalto * 0.7,
            carril: Math.random() < 0.5 ? 0 : 1
          });
        }
      }

      function saltar(j) {
        if (!j.enSuelo || j.aturdido > 0) return;
        j.v = -Math.sqrt(2 * gravedad * alturaSalto);
        j.enSuelo = false;
      }

      /* En solitario ella salta desde la máquina, y lo hace tarde a propósito
         unas de cada tres veces, para que se la pueda alcanzar. */
      function saltoDeLaComputadora(j) {
        const peligro = obstaculos.find(
          (o) => o.clase !== "corazon" && o.carril === j.carril && o.x > j.x + 10 && o.x - j.x < 140
        );
        if (!peligro) return;
        const tarde = Math.random() < 0.34;
        if (peligro.x - j.x < (tarde ? 92 : 62)) saltar(j);
      }

      /* Un rectángulo que se pisa con otro. El corredor es una caja angosta de
         16 de ancho por 46 de alto; el obstáculo, el que se le dibuja. */
function sePisan(ax, ay, aw, ah, bx, by, bw, bh) {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    return {
        actualizar(dt, teclas) {
          if (api.modo === "pareja") {
            if (teclas.has("espacio")) saltar(jugadores[0]);
            if (teclas.has("arriba")) saltar(jugadores[1]);
          } else {
            if (teclas.has("espacio") || teclas.has("arriba")) saltar(jugadores[0]);
            saltoDeLaComputadora(jugadores[1]);
          }

          let vMax = 0;
          jugadores.forEach((j) => {
            const v = velocidad(j.distancia);
            vMax = Math.max(vMax, v);
            j.distancia += v * dt;
            const nuevos = Math.floor(j.distancia / 8);
            if (nuevos > j.puntosBase) {
              api.sumar(j.quien, nuevos - j.puntosBase);
              j.puntosBase = nuevos;
            }
            if (!j.enSuelo) {
              j.v += gravedad * dt;
              j.y += j.v * dt;
              if (j.y >= 0) { j.y = 0; j.v = 0; j.enSuelo = true; }
            } else {
              j.trote += (dt * v) / 15;
            }
            if (j.aturdido > 0) j.aturdido -= dt;
          });

          espera -= dt;
          if (espera <= 0) {
            generar();
            espera = 0.9 + Math.random() * 0.8;
          }

          for (let i = obstaculos.length - 1; i >= 0; i--) {
            const o = obstaculos[i];
            o.x -= vMax * dt;
            if (o.x < -60) { obstaculos.splice(i, 1); continue; }
            let consumido = false;
            for (const j of jugadores) {
              if (o.carril !== undefined && o.carril !== j.carril) continue;
              const cajaX = j.x - 8;
              const cajaY = j.suelo + j.y - 46;
              if (o.clase === "corazon") {
                if (sePisan(cajaX, cajaY, 16, 46, o.x - 11, j.suelo - o.torre - 11, 22, 22)) {
                  obstaculos.splice(i, 1);
                  api.sumar(j.quien, 25);
                  audio.reproducir("atrapado");
                  api.saltar(o.x, j.suelo - o.torre, 16);
                  consumido = true;
                  break;
                }
              } else {
                if (sePisan(cajaX, cajaY, 16, 46, o.x - o.ancho / 2, j.suelo - o.alto, o.ancho, o.alto)) {
                  if (j.aturdido <= 0 && !o["toc_" + j.quien]) {
                    o["toc_" + j.quien] = true;
                    j.aturdido = 0.45;
                    api.sumar(j.quien, -10);
                    audio.reproducir("perdio");
                  }
                }
              }
            }
            if (consumido) continue;
          }

          const md = Math.max(jugadores[0].distancia, jugadores[1].distancia);
          api.decir(Math.floor(md / 10) + " metros · corazones +25 · choques -10");
        },

        dibujar(g) {
          noche(g, W, H, "#241830", "#7a3a5c", 0.55);

          const v = velocidad(Math.max(jugadores[0].distancia, jugadores[1].distancia));

          /* Un carril por jugador: dos suelos, uno para cada uno. */
          const carriles = [jugadores[0].suelo, jugadores[1].suelo];
          g.fillStyle = "#1b1226";
          g.fillRect(0, jugadores[1].suelo, W, H - jugadores[1].suelo);
          carriles.forEach((s) => {
            g.strokeStyle = "rgba(231, 194, 125, 0.55)";
            g.lineWidth = 2;
            g.beginPath();
            g.moveTo(0, s + 1);
            g.lineTo(W, s + 1);
            g.stroke();
          });

          /* Las rayas del suelo que van pasando hacia la izquierda: es lo
             único que hace falta para que se note la velocidad. */
          const paso = 46;
          const desfase = Math.max(jugadores[0].distancia, jugadores[1].distancia) % paso;
          g.strokeStyle = "rgba(244, 166, 192, 0.2)";
          g.lineWidth = 4;
          for (let x = -paso + desfase; x < W + paso; x += paso) {
            g.beginPath();
            g.moveTo(x, sueloEl + 15);
            g.lineTo(x + 20, H);
            g.stroke();
          }

          const sueloDe = (o) => (o.carril === 1 ? jugadores[1].suelo : jugadores[0].suelo);
          for (const o of obstaculos) {
            if (o.clase === "corazon") {
              corazon(g, o.x, sueloDe(o) - o.torre, 12, "#e7c27d");
              continue;
            }
            g.save();
            g.translate(o.x, sueloDe(o));
            if (o.clase === "piedra") {
              g.fillStyle = "#5a3752";
              g.beginPath();
              g.ellipse(0, 0, o.ancho / 2, o.alto / 2, 0, Math.PI, 0);
              g.fill();
            } else {
              g.fillStyle = o.clase === "caja" ? "#7a4a3a" : "#4a2b52";
              g.beginPath();
              g.roundRect(-o.ancho / 2, -o.alto, o.ancho, o.alto, 5);
              g.fill();
              g.strokeStyle = "rgba(251, 241, 244, 0.22)";
              g.lineWidth = 1.5;
              g.stroke();

              if (o.clase === "doble") {
                g.fillStyle = "#4a2b52";
                g.beginPath();
                g.roundRect(-o.ancho / 2 - 28, -o.alto * 0.7, o.ancho, o.alto * 0.7, 5);
                g.fill();
                g.stroke();
              }
            }
            g.restore();
          }

          const escala = 2.1;
          const yEl = jugadores[0].suelo + jugadores[0].y;
          const yElla = jugadores[1].suelo + jugadores[1].y;
          const pasoEl = jugadores[0].enSuelo ? (Math.floor(jugadores[0].trote) % 2 === 0 ? 1 : 2) : 0;
          const pasoElla = jugadores[1].enSuelo ? (Math.floor(jugadores[1].trote) % 2 === 0 ? 1 : 2) : 0;

          Sprites.dibujar(g, "ella", jugadores[1].x, yElla, escala, {
            paso: pasoElla,
            tinte: api.modo === "solitario" ? 0.5 : 0,
            color: "#241830"
          });

          Sprites.dibujar(g, "el", jugadores[0].x, yEl, escala, {
            paso: pasoEl,
            sombra: true,
            tinte: jugadores[0].aturdido > 0 ? 0.4 : 0,
            color: "#e2688f"
          });

          if (jugadores[0].aturdido > 0 || jugadores[1].aturdido > 0) {
            g.fillStyle = "rgba(226, 104, 143, 0.22)";
            g.fillRect(0, 0, W, H);
          }

          g.fillStyle = "rgba(251, 241, 244, 0.65)";
          g.font = "600 13px Outfit, system-ui, sans-serif";
          g.textAlign = "left";
          const maxD = Math.max(jugadores[0].distancia, jugadores[1].distancia);
          g.fillText(Math.floor(maxD / 10) + " m", 12, 22);
          g.fillStyle = "#f4a6c0";
          g.fillText(api.nombre("el"), 12, jugadores[0].suelo - 52);
          g.fillStyle = "#c9a7f0";
          g.fillText(api.nombre("ella"), 12, jugadores[1].suelo - 52);
        },

        alPulsar(tecla) {
          if (tecla === "espacio" || tecla === "arriba") audio.reproducir("pasar");
        },

        alTocar(x, y) {
          if (y > 0.6) {
            if (api.modo === "pareja") {
              saltar(jugadores[x < 0.5 ? 0 : 1]);
            } else saltar(jugadores[0]);
          }
        }
      };
    }
  });

  /* ==========================================================
     3. MEMORIA DEL AMOR
     Un Simon de cuatro botones. Se enciende una secuencia y hay que
     repetirla; cada ronda tiene un paso más. En pareja se turnan para
     repetirla entera, así que acordarse es trabajo de los dos.
     ========================================================== */
  registrar({
    id: "memoria",
    titulo: "Memoria del amor",
    resumen: "Repite la secuencia de colores. Cada ronda tiene un paso más, hasta doce.",
    icono: "i-estrella",
    teclas: { el: "A / S / D / F", ella: "← / ↓ / ↑ / →" },
    tema: "memoria",
    duracion: 90,

    iniciar(api) {
      const colores = [
        { c: "#e2688f", glifo: "�T�", nota: 76, el: "a", ella: "izquierda" },
        { c: "#c9a7f0", glifo: "�o�", nota: 79, el: "s", ella: "abajo" },
        { c: "#e7c27d", glifo: "�~.", nota: 83, el: "d", ella: "arriba" },
        { c: "#7fc4c9", glifo: "�T�", nota: 88, el: "f", ella: "derecha" }
      ];
      const sonidosExtra = ["sonar1","sonar2","sonar3","sonar4","sonar5","sonar6","sonar7","sonar8"];

      /* Cuánto brilla cada botón. Baja solo, para que la luz se apague sola. */
      const brillo = [0, 0, 0, 0];

      let secuencia = [Math.floor(Math.random() * 4)];
      let mostrando = true;
      let esperando = true;
      let entrada = 0;
      let turno = 0;
      let nivel = 1;
      let lastLevelPoints = 0;

      /* En solitario, ella juega sola algunos turnos. La `dificultad` es qué
         tan seguido se equivoca: un cuarto de las veces. */
      function jugarElla() {
        const largo = secuencia.length;
        api.decir(`${api.nombre("ella")} está recordando…`);

        let aciertos = largo;
        if (Math.random() < 0.25) {
          aciertos = Math.max(0, largo - 1 - Math.floor(Math.random() * 2));
        }

        for (let i = 0; i < aciertos; i++) {
          api.despues(220 * i, () => {
            brillo[secuencia[i]] = 1;
            audio.notaDeSecuencia(colores[secuencia[i]].nota);
          });
        }

        api.despues(300 + largo * 190, () => {
          if (aciertos === largo) {
            const puntos = 10 + largo * 4;
            api.sumar("ella", puntos);
            audio.reproducir("bien");
            api.saltar(api.ancho / 2, api.alto / 2, 26);
            api.decir(`¡${api.nombre("ella")} la repitió entera! +${puntos}`);

            if (largo >= 12) {
              api.termina();
              return;
            }

            secuencia.push(Math.floor(Math.random() * 4));
            turno = 0;
            mostrar();
          } else {
            api.sumar("ella", -12);
            audio.reproducir("mal");
            api.decir(`${api.nombre("ella")} se equivocó · −12`);
            secuencia = [Math.floor(Math.random() * 4)];
            turno = 0;
            mostrar();
          }
        });
      }

      function mostrar() {
        mostrando = true;
        esperando = true;
        entrada = 0;
        api.decir(
          `Miren la secuencia · ${secuencia.length} ` +
          (secuencia.length === 1 ? "paso" : "pasos")
        );

        secuencia.forEach((indice, i) => {
          api.despues(140 + i * (520 - nivel * 60), () => {
            brillo[indice] = 1;
            audio.notaDeSecuencia(colores[indice].nota);
            if (Math.random() < 0.4) {
              const s = sonidosExtra[Math.floor(Math.random() * sonidosExtra.length)];
              audio.reproducir(s);
            }
          });
        });

        api.despues(200 + secuencia.length * 520, () => {
          mostrando = false;
          esperando = false;
          if (api.modo === "solitario" && turno === 1) {
            jugarElla();
          } else {
            api.decir(`Turno de ${api.nombre(turno === 0 ? "el" : "ella")} · repetí ${secuencia.length}`);
          }
        });
      }

      function tocar(indice) {
        if (mostrando || esperando) return;
        if (api.modo === "solitario" && turno === 1) return;

        brillo[indice] = 1;
        audio.notaDeSecuencia(colores[indice].nota);

        if (indice !== secuencia[entrada]) {
          /* Falló: la secuencia vuelve a empezar, porque si no la ronda se
             vuelve larguísima y ya no es un juego de memoria sino de paciencia. */
          audio.reproducir("mal");
          api.decir(`${api.nombre(turno === 0 ? "el" : "ella")} fall�� en el paso ${entrada + 1}`);
          entrada = 0;
          esperando = true;
          api.despues(900, () => {
            secuencia = [Math.floor(Math.random() * 4)];
            nivel = 1;
            turno = api.modo === "pareja" ? 1 - turno : 0;
            mostrar();
          });
          return;
        }

        entrada++;

        if (entrada >= secuencia.length) {
          const puntos = 10 + secuencia.length * nivel * 2;
          api.sumar(turno === 0 ? "el" : "ella", puntos);
          audio.reproducir("bien");
          api.saltar(api.ancho / 2, api.alto / 2, 26);
          api.decir(`��${api.nombre(turno === 0 ? "el" : "ella")} la repiti��! +${puntos}`);

          if (secuencia.length >= 12) {
            api.termina();
            return;
          }

          secuencia.push(Math.floor(Math.random() * 4));
          nivel = Math.min(nivel + 1, 5);
          entrada = 0;
          esperando = true;
          api.despues(1000, () => {
            turno = api.modo === "pareja" ? 1 - turno : 0;
            mostrar();
          });
        } else {
          api.decir(`${api.nombre(turno === 0 ? "el" : "ella")} · paso ${entrada} de ${secuencia.length}`);
        }
      }

      api.alPulsar((tecla) => {
        if (mostrando || esperando) return;
        if (api.modo === "solitario" && turno === 1) return;
        for (let i = 0; i < 4; i++) {
          if (colores[i].el === tecla || colores[i].ella === tecla) {
            tocar(i);
            return;
          }
        }
      });

      api.alTocar((x, y) => {
        if (mostrando || esperando) return;
        if (api.modo === "solitario" && turno === 1) return;
        /* El tablero es un 2x2: arriba izquierda, arriba derecha, abajo
           izquierda, abajo derecha. */
        tocar(y < 0.5 ? (x < 0.5 ? 0 : 1) : x < 0.5 ? 2 : 3);
      });

      mostrar();

      return {
        actualizar(dt) {
          for (let i = 0; i < 4; i++) {
            if (brillo[i] > 0) brillo[i] = Math.max(0, brillo[i] - dt * 2.6);
          }
        },

        dibujar(g) {
          const W = api.ancho;
          const H = api.alto;
          noche(g, W, H, "#241830", "#3d1f42", 0.45);

          const tam = Math.min((W - 90) / 2, (H - 120) / 2);
          const margen = Math.min(22, tam * 0.18);
          const inicioX = (W - tam * 2 - margen) / 2;
          const inicioY = (H - tam * 2 - margen) / 2 + 6;

          const lugares = [
            [inicioX, inicioY],
            [inicioX + tam + margen, inicioY],
            [inicioX, inicioY + tam + margen],
            [inicioX + tam + margen, inicioY + tam + margen]
          ];

          lugares.forEach((pos, i) => {
            const x = pos[0];
            const y = pos[1];
            const c = colores[i];
            const luz = brillo[i];

            g.save();
            g.globalAlpha = 0.3 + luz * 0.7;
            g.shadowColor = c.c;
            g.shadowBlur = luz * 36;
            g.fillStyle = c.c;
            g.beginPath();
            g.roundRect(x, y, tam, tam, 18);
            g.fill();
            g.restore();

            g.save();
            g.globalAlpha = 0.65 + luz * 0.35;
            g.fillStyle = "#1b1226";
            g.font = Math.round(tam * 0.42) + "px serif";
            g.textAlign = "center";
            g.textBaseline = "middle";
            g.fillText(c.glifo, x + tam / 2, y + tam / 2 + 2);
            g.restore();

            /* Las dos teclas de cada botón, para no tener que probarlas. */
            g.fillStyle = "rgba(251, 241, 244, 0.55)";
            g.font = "600 12px Outfit, system-ui, sans-serif";
            g.textAlign = "center";
            g.textBaseline = "alphabetic";
            g.fillText(
              c.el.toUpperCase() + " / " + teclaEscrita(c.ella),
              x + tam / 2,
              y + tam + 15
            );
          });

          g.textAlign = "center";
          g.fillStyle = "rgba(251, 241, 244, 0.85)";
          g.font = "600 15px Outfit, system-ui, sans-serif";
          g.fillText("Turno de " + api.nombre(turno === 0 ? "el" : "ella"), W / 2, inicioY - 26);
        }
      };
    }
  });

  /* ==========================================================
     4. VERDAD O RETO
     Saca una carta y cúmplela antes de que se acaben los 20 segundos. Si la
     cumples sumás; si no, perdés un poco y pasa el turno.
     ========================================================== */
  registrar({
    id: "reto",
    titulo: "Verdad o Reto",
    resumen: "Saca una carta y cúmplela en 20 segundos. Cumplir suma, no poder resta.",
    icono: "i-carta",
    teclas: { el: "E", ella: "R" },
    tema: "reto",
    duracion: 120,

    iniciar(api) {
      const W = api.ancho;
      const H = api.alto;

      const verdades = [
        "¿Qué fue lo primero que pensaste cuando me viste?",
        "¿Cuál ha sido el día más feliz de estos meses?",
        "Decime algo que nunca me hayas dicho en voz alta.",
        "¿Qué te da vergüenza de mí? (con cariño, prometido)",
        "¿Qué canción te recuerda siempre a mí?",
        "Contame nuestro día favorito hasta ahora.",
        "¿Qué te hago de más cuando no estoy?",
        "Si tuvieras que elegir una foto nuestra para tu fondo, ¿cuál?",
        "¿Qué es lo que más te gusta de nuestra relación?",
        "Contame algo que quieras que hagamos este año."
      ];

      const retos = [
        "Decime al oído tres cosas que te gustan de mí.",
        "Poné una foto vieja nuestra de fondo de pantalla y avisame.",
        "Mandame un audio de 15 segundos con una canción que te parezca de mí.",
        "Apretame un beso de diez segundos, como si estuviéramos solos.",
        "Decime en voz alta algo bonito y guardá el audio.",
        "Escribime el nombre con el dedito en la pantalla y mandame foto.",
        "Contame un chiste. Si queda mal, te reís igual.",
        "Imitame la voz hasta que me dé risa.",
        "Haceme un baile de diez segundos por mensaje.",
        "Contame algo que quieras que hagamos juntos este año."
      ];

      const mazo = mezclar(
        verdades.map((t) => ({ tipo: "Verdad", texto: t })).concat(
          retos.map((t) => ({ tipo: "Reto", texto: t }))
        )
      );

      const SEGUNDOS = 20;
      const MAX_CARTAS = 12;

      let restantes = mazo.length;
      let cartasVistas = [];

      function sacar() {
        if (!restantes) {
          /* Cuando ya no queda ninguna, se vuelve a barajar menos las cuatro
             últimas, para que nunca salga dos veces seguidas la misma. */
          const repes = cartasVistas.slice(0, Math.max(0, cartasVistas.length - 4));
          cartasVistas = [];
          return repes.length ? mezclar(repes).pop() : { tipo: "Verdad", texto: "Contame algo bonito." };
        }
        const carta = mazo[restantes - 1];
        restantes -= 1;
        cartasVistas.push(carta);
        return carta;
      }

      let carta = sacar();
      let turno = 0;
      let quedan = SEGUNDOS;
      let contestada = false;
      let jugadas = 0;

      function repartir() {
        carta = sacar();
        quedan = SEGUNDOS;
        contestada = false;
        jugadas += 1;
        audio.reproducir("pasar");
        api.decir(`Turno de ${api.nombre(turno === 0 ? "el" : "ella")} · ${carta.tipo}`);
      }

      function responder(cumplio) {
        if (contestada) return;
        contestada = true;
        const quien = turno === 0 ? "el" : "ella";

        if (cumplio) {
          const puntos = carta.tipo === "Reto" ? 18 : 12;
          api.sumar(quien, puntos);
          audio.reproducir("bien");
          api.saltar(W / 2, H / 2, 28);
          api.decir(`¡Cumplido! +${puntos}`);
        } else {
          api.sumar(quien, -8);
          audio.reproducir("mal");
          api.decir("No pudo · −8");
        }

        const siguiente = () => {
          if (jugadas >= MAX_CARTAS) {
            api.termina();
            return;
          }
          repartir();
        };

        if (api.modo === "pareja") {
          turno = 1 - turno;
          api.despues(1500, siguiente);
          return;
        }

        /* En solitario ella juega después: cumple con algo de azar, así que
           hay que apurarse a cumplir la propia para no perder. */
        api.despues(1500, () => {
          const cumple = Math.random() < 0.6;
          if (cumple) {
            const puntos = carta.tipo === "Reto" ? 18 : 12;
            api.sumar("ella", puntos);
            audio.reproducir("bien");
            api.decir(`Ella cumplió su ${carta.tipo.toLowerCase()} · +${puntos}`);
          } else {
            api.sumar("ella", -8);
            audio.reproducir("mal");
            api.decir("Ella no pudo con la suya · −8");
          }
          api.despues(1500, siguiente);
        });
      }

      repartir();

      return {
        actualizar(dt) {
          if (contestada) return;
          quedan -= dt;
          if (quedan <= 0) {
            responder(false);
          }
        },

        dibujar(g) {
          noche(g, W, H, "#2e1e3d", "#5a2b52", 0.6);

          const ancho = Math.min(W * 0.7, 420);
          const alto = Math.min(H * 0.6, 190);
          const x = (W - ancho) / 2;
          const y = (H - alto) / 2 + 8;

          /* La carta, con su lomo. */
          g.save();
          g.shadowColor = "rgba(0, 0, 0, 0.45)";
          g.shadowBlur = 22;
          g.shadowOffsetY = 9;
          const papel = g.createLinearGradient(x, y, x, y + alto);
          papel.addColorStop(0, "#fbf1f4");
          papel.addColorStop(1, "#e6d4db");
          g.fillStyle = papel;
          g.beginPath();
          g.roundRect(x, y, ancho, alto, 16);
          g.fill();
          g.restore();

          /* La etiqueta de arriba: rosa si es verdad, oro si es reto, para
             saber de qué se trata sin leer. */
          g.fillStyle = carta.tipo === "Verdad" ? "#e2688f" : "#e7c27d";
          g.beginPath();
          g.roundRect(x + 16, y + 15, 94, 28, 14);
          g.fill();
          g.fillStyle = "#1b1226";
          g.font = "700 12px Outfit, system-ui, sans-serif";
          g.textAlign = "center";
          g.fillText(carta.tipo.toUpperCase(), x + 63, y + 34);

          g.fillStyle = "#3d1f42";
          g.font = "500 17px Outfit, system-ui, sans-serif";
          parrafo(g, carta.texto, x + 24, y + 78, ancho - 48, 23, "left");

          corazon(g, x + ancho - 28, y + alto - 26, 9, "rgba(226, 104, 143, 0.35)");

          /* La barra del tiempo, que se pone roja en los últimos cinco. */
          const barraAncho = ancho;
          const barraX = x;
          const barraY = y + alto + 26;
          const proporcion = Math.max(0, quedan / SEGUNDOS);

          g.fillStyle = "rgba(251, 241, 244, 0.14)";
          g.beginPath();
          g.roundRect(barraX, barraY, barraAncho, 10, 5);
          g.fill();

          g.fillStyle = quedan < 5 ? "#e2688f" : "#c9a7f0";
          g.beginPath();
          g.roundRect(barraX, barraY, barraAncho * proporcion, 10, 5);
          g.fill();

          g.fillStyle = "rgba(251, 241, 244, 0.7)";
          g.font = "600 13px Outfit, system-ui, sans-serif";
          g.textAlign = "center";
          g.fillText(
            quedan < 5
              ? "¡Últimos segundos!"
              : "quedan " + Math.max(0, Math.ceil(quedan)) + " segundos",
            W / 2,
            barraY + 28
          );

          /* De quién es el turno, con su cara arriba de la carta. */
          const deEl = turno === 0;
          Sprites.dibujar(g, deEl ? "el" : "ella", W / 2, y - 12, 1, {});
          g.fillStyle = "rgba(251, 241, 244, 0.85)";
          g.font = "600 13px Outfit, system-ui, sans-serif";
          g.textAlign = "center";
          g.fillText("Turno de " + api.nombre(deEl ? "el" : "ella"), W / 2, y - 20);
        },

        alPulsar(tecla) {
          if (turno === 0 && tecla === "e") responder(true);
          if (turno === 1 && tecla === "r") responder(true);
        },

        alTocar(x, y) {
          /* Abajo de todo está "cumplí". */
          if (y > 0.82) responder(true);
        }
      };
    }
  });

  /* ==========================================================
     5. MEMORIA DE FOTOS
     Parejas de fotos del sitio. Se voltean de a dos; la pareja que más
     encuentra gana. En solitario ella juega algunos turnos sola.
     ========================================================== */
  registrar({
    id: "fotos",
    titulo: "Memoria de fotos",
    resumen: "Voltea las cartas y hallá las parejas de nuestras fotos. Cada pareja vale 15 puntos.",
    icono: "i-foto",
    teclas: { el: "Lado izquierdo", ella: "Lado derecho" },
    tema: "fotos",
    duracion: 120,

    iniciar(api) {
      const W = api.ancho;
      const H = api.alto;

      const fotos = fotosDelSitio();
      const totalParejas = fotos.length;

      /* Cada par es una misma foto repetida dos veces: entran todas. */
      let mazo = [];
      for (let i = 0; i < fotos.length; i++) {
        mazo.push({ par: i, dada: false });
        mazo.push({ par: i, dada: false });
      }
      mazo = mezclar(mazo);

      const MARGEN = 16;
      const SEPARACION = 20;

      let turno = 0;
      let volteadas = [];
      let bloqueado = false;
      let encontradas = 0;

      const anchoPanel = (W - MARGEN * 2 - SEPARACION) / 2;
      const altoPanel = H - MARGEN * 2 - 16;
      /* Cada lado guarda la mitad del mazo: N cartas si hay N fotos.
         La grilla se calcula para que entren todas. */
      const porPanel = totalParejas;
      let COLS = Math.ceil(Math.sqrt(porPanel * (anchoPanel / altoPanel)));
      COLS = Math.max(2, Math.min(COLS || 3, porPanel));
      let FILAS = Math.max(1, Math.ceil(porPanel / COLS));
      const anchoCarta = anchoPanel / COLS;
      const altoCarta = altoPanel / FILAS;

      function cambiarTurno(nuevo) {
        turno = nuevo;
        api.setTurno(nuevo);
        api.decir(
          `Turno de ${api.nombre(nuevo === 0 ? "el" : "ella")} · ` +
          `${encontradas} de ${totalParejas} parejas`
        );
        if (api.modo === "solitario" && turno === 1) api.despues(800, jugarElla);
      }

      /* "automatico" lo pasa la computadora: sin eso el candado de solitary
         también le impediría voltear a ella. */
      function voltear(indice, automatico) {
        if (bloqueado) return;
        if (!mazo[indice] || mazo[indice].dada) return;
        if (api.modo === "solitario" && turno === 1 && !automatico) return;

        mazo[indice].dada = true;
        volteadas.push(indice);
        audio.reproducir("pasar");

        if (volteadas.length < 2) return;

        bloqueado = true;
        const a = mazo[volteadas[0]];
        const b = mazo[volteadas[1]];
        const quien = turno === 0 ? "el" : "ella";

        if (a.par === b.par) {
          api.despues(430, () => {
            encontradas += 1;
            a.ok = true;
            b.ok = true;
            volteadas = [];
            api.sumar(quien, 15);
            audio.reproducir("bien");
            api.saltar(W / 2, H / 2, 26);
            api.decir(`¡Pareja de "${fotos[a.par].titulo || "un recuerdo"}"! +15`);

            if (encontradas >= totalParejas) {
              api.termina();
              return;
            }

            bloqueado = false;
            /* Quien halló la pareja sigue: es lo que obliga a acordarse de
               dónde estaba cada foto. Por eso, si la que sigue es la
               computadora, hay que volver a largarla a jugar. */
            api.decir(`${api.nombre(quien)} sigue · ${encontradas} de ${totalParejas}`);
            seguirTurno();
          });
          return;
        }

        api.despues(950, () => {
          
          audio.reproducir("mal");
          api.decir(`No era pareja · ${api.nombre(quien)}`);
          volteadas.forEach((i) => {
            mazo[i].dada = false;
          });
          volteadas = [];
          bloqueado = false;
          cambiarTurno(api.modo === "pareja" ? 1 - turno : 0);
        });
      }

      /* Deja que el jugador que quedó con el turno haga su próximo movimiento.
         En solitario no alcanza con mirarlo: si el turno es de la computadora
         hay que volver a largarla a jugar. */
      function seguirTurno() {
        if (api.modo === "solitario" && turno === 1) {
          api.despues(900, jugarElla);
        }
      }

      /* La computadora: primero intenta emparejar algo que ya conoce (de las
         cartas que ya vio en el tablero) y, si no, elige dos al azar. */
      function jugarElla() {
        if (bloqueado) return;
        const ocultas = [];
        for (let i = 0; i < mazo.length; i++) {
          if (!mazo[i].dada) ocultas.push(i);
        }
        if (ocultas.length < 2) return;

        bloqueado = true;
        api.decir(`${api.nombre("ella")} está buscando…`);

        const vistas = mazo.filter((c) => c.dada && !c.ok).map((c) => c.par);
        let pareja = null;
        for (let i = 0; i < vistas.length && pareja === null; i++) {
          for (let j = i + 1; j < vistas.length; j++) {
            if (vistas[i] === vistas[j]) {
              pareja = vistas[i];
              break;
            }
          }
        }

        api.despues(950, () => {
          bloqueado = false;

          if (pareja !== null && Math.random() < 0.7) {
            const dos = [];
            for (let i = 0; i < mazo.length; i++) {
              if (!mazo[i].dada && mazo[i].par === pareja) dos.push(i);
            }
            if (dos.length === 2) {
              voltear(dos[0], true);
              api.despues(340, () => voltear(dos[1], true));
              return;
            }
          }

          const dos = mezclar(ocultas).slice(0, 2);
          voltear(dos[0], true);
          api.despues(340, () => voltear(dos[1], true));
        });
      }

      api.alTocar((x, y) => {
        if (api.modo === "solitario" && turno === 1) return;
        const enIzquierda = x * W < W / 2;
        const xLocal = enIzquierda ? x * W - MARGEN : x * W - (W / 2 + SEPARACION / 2);
        const yLocal = y * H - MARGEN;

        const columna = Math.floor(xLocal / anchoCarta);
        const fila = Math.floor(yLocal / altoCarta);
        if (columna < 0 || columna >= COLS || fila < 0 || fila >= FILAS) return;

        const enPanel = fila * COLS + columna;
        const idx = (enIzquierda ? 0 : COLS * FILAS) + enPanel;
        if (api.modo === "pareja" && (enIzquierda ? 1 === turno : 0 === turno)) return;
        voltear(idx);
      });

      api.setTiempoTurno(30);
      cambiarTurno(0);

      return {
        onTurnoCambio(t) {
          if (bloqueado) return;
          if (volteadas.length) {
            volteadas.forEach((i) => { if (mazo[i] && !mazo[i].ok) mazo[i].dada = false; });
            volteadas = [];
          }
          cambiarTurno(t);
        },
        dibujar(g) {
          noche(g, W, H, "#241830", "#3d1f42", 0.45);

          const paneles = [
            { inicio: MARGEN, nombre: api.nombre("el"), color: "#f4a6c0" },
            { inicio: W / 2 + SEPARACION / 2, nombre: api.nombre("ella"), color: "#c9a7f0" }
          ];

          paneles.forEach((panel, numero) => {
            const activo = turno === numero;

            g.save();
            g.fillStyle = activo ? "rgba(244, 166, 192, 0.07)" : "rgba(251, 241, 244, 0.03)";
            g.beginPath();
            g.roundRect(panel.inicio, MARGEN, anchoPanel, altoPanel, 14);
            g.fill();
            g.strokeStyle = activo ? panel.color + "66" : "rgba(251, 241, 244, 0.1)";
            g.lineWidth = 1.5;
            g.stroke();
            g.restore();

            for (let f = 0; f < FILAS; f++) {
              for (let c = 0; c < COLS; c++) {
                const indice = numero * COLS * FILAS + f * COLS + c;
                const carta = mazo[indice];
                if (!carta) continue;

                const x = panel.inicio + c * anchoCarta + 3;
                const y = MARGEN + f * altoCarta + 3;
                const w = anchoCarta - 6;
                const h = altoCarta - 6;

                if (!carta.dada) {
                  /* Boca abajo, con un corazón. */
                  g.fillStyle = "#3d1f42";
                  g.beginPath();
                  g.roundRect(x, y, w, h, 8);
                  g.fill();
                  g.strokeStyle = "rgba(244, 166, 192, 0.3)";
                  g.lineWidth = 1.5;
                  g.stroke();
                  corazon(g, x + w / 2, y + h / 2, Math.min(w, h) * 0.2, "rgba(244, 166, 192, 0.45)");
                  continue;
                }

                /* Dada vuelta, se ve la foto. */
                g.save();
                g.beginPath();
                g.roundRect(x, y, w, h, 8);
                g.clip();
                g.fillStyle = "#1b1226";
                g.fillRect(x, y, w, h);
                const imagen = foto(fotos[carta.par].src);
                if (imagen && imagen.complete && imagen.naturalWidth) {
                  /* Se dibuja cubriendo el rectángulo entero y se deja que el
                     recorte de arriba corte lo que sobre, así no hay que
                     calcular la proporción de cada foto. */
                  const escala = Math.max(w / imagen.naturalWidth, h / imagen.naturalHeight);
                  const ancho = imagen.naturalWidth * escala;
                  const alto = imagen.naturalHeight * escala;
                  g.drawImage(imagen, x + (w - ancho) / 2, y + (h - alto) / 2, ancho, alto);
                }
                g.restore();

                g.strokeStyle = "rgba(231, 194, 125, 0.55)";
                g.lineWidth = 2;
                g.beginPath();
                g.roundRect(x, y, w, h, 8);
                g.stroke();
              }
            }

            g.textAlign = "center";
            g.font = "600 13px Outfit, system-ui, sans-serif";
            g.fillStyle = activo ? panel.color : "rgba(251, 241, 244, 0.4)";
            g.fillText(panel.nombre, panel.inicio + anchoPanel / 2, MARGEN - 5);
          });

          /* La raya del medio. */
          g.strokeStyle = "rgba(251, 241, 244, 0.12)";
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(W / 2, MARGEN);
          g.lineTo(W / 2, H - MARGEN);
          g.stroke();
        }
      };
    }
  });

  /* ==========================================================
     6. PIEDRA, TIJERA, CORAZÓN
     El de toda la vida, con el papel reemplazado por un corazón. Al mejor
     de tres rondas o de cinco jugadas.
     ========================================================== */
  registrar({
    id: "duelo",
    titulo: "Piedra, tijera, corazón",
    resumen: "Piedra le gana a tijera, tijera al corazón y el corazón a la piedra. Al mejor de cinco.",
    icono: "i-juego",
    teclas: { el: "A / S / D", ella: "← / ↓ / ↑" },
    tema: "duelo",
    duracion: 120,

    iniciar(api) {
      const W = api.ancho;
      const H = api.alto;

      /* La regla del clásico, con el corazón en lugar del papel. */
      const VENCE = { piedra: "tijera", tijera: "corazon", corazon: "piedra" };
      const OPCIONES = [
        { id: "piedra", nombre: "Piedra" },
        { id: "tijera", nombre: "Tijera" },
        { id: "corazon", nombre: "Corazón" }
      ];

      const jug = [
        { quien: "el", mano: null, puntos: 0, rondas: 0 },
        { quien: "ella", mano: null, puntos: 0, rondas: 0 }
      ];

      let esperando = false;
      let jugadas = 0;
      let ultimoGanador = "";
      let manosReveladas = false;

      function jugar(quien, opcion, automatico) {
        if (esperando) return;
        if (api.modo === "pareja" && api.turno() !== quien) return;
        if (api.modo === "solitario" && quien === 1 && !automatico) return;

        jug[quien].mano = opcion;
        audio.reproducir("pasar");
        if (api.modo === "pareja" && (!jug[0].mano || !jug[1].mano)) {
          api.siguienteTurno();
        }
        if (jug[0].mano && jug[1].mano) {
          manosReveladas = true;
          resolver();
        } else {
          manosReveladas = false;
        }
      }

      function resolver() {
        esperando = true;
        jugadas += 1;

        const a = jug[0].mano;
        const b = jug[1].mano;
        const resultado = a === b ? "empate" : VENCE[a] === b ? "el" : "ella";
        ultimoGanador = resultado;

        if (resultado === "empate") {
          audio.reproducir("empate");
          api.decir("¡Empate! Nadie suma");
        } else {
          const ganador = resultado === "el" ? 0 : 1;
          jug[ganador].puntos += 10;
          jug[ganador].rondas += 1;
          api.sumar(jug[ganador].quien, 10);
          audio.reproducir("bien");
          api.saltar(W / 2, H / 2, 32);
          api.decir("Gana " + api.nombre(jug[ganador].quien) + " · +10");
        }

        if (jugadas >= 5 || jug[0].rondas >= 3 || jug[1].rondas >= 3) {
          api.despues(1500, () => api.termina());
          return;
        }

        api.despues(1300, () => {
          jug[0].mano = null;
          jug[1].mano = null;
          ultimoGanador = "";
          manosReveladas = false;
          esperando = false;
          api.decir("Jugada " + (jugadas + 1) + " de 5");
          if (api.modo === "pareja") api.setTurno(0);
          if (api.modo === "solitario") jugarLaComputadora();
        });
      }

      /* Ella no tira siempre lo mismo: si va ganando juega lo que le gana a
         la última cosa que le jugaron, y si va perdiendo tira cualquier cosa
         para sorprender. */
      function jugarLaComputadora() {
        if (api.modo !== "solitario") return;
        let opcion;
        if (Math.random() < 0.6) {
          opcion = jug[1].puntos >= jug[0].puntos ? "corazon" : "piedra";
        } else {
          opcion = OPCIONES[Math.floor(Math.random() * 3)].id;
        }
        api.despues(600, () => jugar(1, opcion, true));
      }

      api.alPulsar((tecla) => {
        const paraEl = { a: "piedra", s: "tijera", d: "corazon" };
        const paraElla = { izquierda: "piedra", abajo: "tijera", arriba: "corazon" };
        if (paraEl[tecla]) jugar(0, paraEl[tecla]);
        else if (paraElla[tecla]) jugar(1, paraElla[tecla]);
      });

/* Abajo de todo están las tres opciones, para que también se pueda
         jugar con el dedo. La fila muestra siempre la del jugador que
         todavía no eligió mano. */
api.alTocar((x, y) => {
        if (y < 0.82) return;
        const turno = !jug[0].mano ? 0 : 1;
        if (api.modo === "solitario" && turno === 1) return;
        const nombres = ["piedra", "tijera", "corazon"];
        const columna = x < 1 / 3 ? 0 : x < 2 / 3 ? 1 : 2;
        jugar(turno, nombres[columna]);
      });

      api.decir("Elegí: A, S o D");
      jugarLaComputadora();

      /* Abajo están las tres opciones. Se dibuja solo la fila del jugador que
         todavía no eligió mano, para que no haya dos filas superpuestas ni
         que se pulse la tecla del otro. */
function dibujarOpciones(g, W, H) {
        const anchoBoton = 78;
        const altoBoton = 28;
        const total = 3 * anchoBoton + 16;
        const inicioX = (W - total) / 2;
        const yBoton = H - altoBoton - 6;

        const turno = !jug[0].mano ? 0 : 1;
        const teclas = turno === 0 ? ["A", "S", "D"] : api.modo === "pareja" ? ["←", "↓", "↑"] : ["·", "·", "·"];
        const nombres = ["piedra", "tijera", "corazon"];

        g.textAlign = "center";
        g.fillStyle = "rgba(251, 241, 244, 0.45)";
        g.font = "600 12px Outfit, system-ui, sans-serif";
        g.fillText(
          api.modo === "solitario" && turno === 1
            ? "Turno de la computadora"
            : "Elegí de " + api.nombre(turno === 0 ? "el" : "ella"),
          W / 2,
          yBoton - 8
        );

        for (let i = 0; i < 3; i++) {
          const x = inicioX + i * (anchoBoton + 8);
          const elegida = jug[turno].mano === nombres[i];

          g.fillStyle = elegida ? "rgba(244, 166, 192, 0.32)" : "rgba(251, 241, 244, 0.08)";
          g.beginPath();
          g.roundRect(x, yBoton, anchoBoton, altoBoton, 8);
          g.fill();

          g.fillStyle = elegida ? "#fbf1f4" : "rgba(251, 241, 244, 0.65)";
          g.font = "600 12px Outfit, system-ui, sans-serif";
          g.fillText(teclas[i] + "  " + glifoDe(nombres[i]), x + anchoBoton / 2, yBoton + 18);
        }
      }

      return {
        dibujar(g) {
          noche(g, W, H, "#241830", "#3d1f42", 0.45);

          const escala = 2.1;
          const pie = H * 0.6;

          jug.forEach((j, i) => {
            const x = i === 0 ? W * 0.26 : W * 0.74;

            /* La mano que sale, o un signo de pregunta si todavía no jugó. */
            g.textAlign = "center";
            if (j.mano) {
              g.fillStyle = i === 0 ? "#f4a6c0" : "#c9a7f0";
              g.font = "44px serif";
              g.fillText(glifoDe(j.mano), x, pie - Sprites.ALTO * escala - 26);
            } else {
              g.fillStyle = "rgba(244, 166, 192, 0.3)";
              g.font = "36px serif";
              g.fillText("?", x, pie - Sprites.ALTO * escala - 30);
            }

            /* La cara, teñida de oro cuando acaba de ganar. */
            Sprites.dibujar(g, j.quien, x, pie, escala, {
              sombra: true,
              invertir: i === 1,
              tinte: ultimoGanador === (i === 0 ? "el" : "ella") ? 0.35 : 0,
              color: "#e7c27d"
            });

            g.textAlign = "center";
            g.fillStyle = "rgba(251, 241, 244, 0.85)";
            g.font = "600 15px Outfit, system-ui, sans-serif";
            g.fillText(api.nombre(j.quien), x, pie + 24);

            g.fillStyle = "rgba(251, 241, 244, 0.45)";
            g.font = "12px Outfit, system-ui, sans-serif";
            g.fillText(
              i === 0 ? "A · S · D" : api.modo === "pareja" ? "← · ↓ · ↑" : "la computadora",
              x,
              pie + 42
            );
          });

          /* La raya del medio, con la cuenta de jugadas. */
          g.strokeStyle = "rgba(251, 241, 244, 0.1)";
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(W / 2, 20);
          g.lineTo(W / 2, H - 92);
          g.stroke();

          g.textAlign = "center";
          g.fillStyle = "rgba(251, 241, 244, 0.55)";
          g.font = "600 13px Outfit, system-ui, sans-serif";
          g.fillText("Jugada " + Math.min(5, jugadas + 1) + " de 5", W / 2, 34);

          dibujarOpciones(g, W, H);
        }
      };
    }
  });
})();
