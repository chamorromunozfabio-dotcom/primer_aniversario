/* Nuestro año — los dos personajes, en pixel art.
   https://developer.mozilla.org/es/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes

   Este archivo es el mismo sprite que está en Sprites.cs (16x25 píxeles, cada
   letra es un color de la paleta y el punto es transparente), pero en
   JavaScript, porque la página no tiene compilador: así se puede dibujar
   directo en un <canvas> sin instalar nada.

   Para cambiar el pelo, la ropa o la cara de los dos, edita las filas de
   ELLA y EL de abajo. Cada fila es una línea de 16 caracteres. */
window.Sprites = (function () {
  "use strict";

  const ANCHO = 16;
  const ALTO = 25;

  /* La paleta, con los mismos valores numéricos que en Sprites.cs. */
  const PALETA = {
    O: "#2d2332", // contorno
    H: "#cd7d50", // pelo
    S: "#facdaa", // piel
    P: "#ee828c", // labios / rubor
    G: "#1e1e28", // ojos
    E: "#5a3723", // detalle del ojo
    M: "#aa4646", // boca
    W: "#ffffff", // camiseta
    B: "#3c64be", // jean
    K: "#231919", // pelo oscuro
    D: "#784b32", // piel en sombra / barba
    T: "#5f3a26", // sombra de la barba
    Y: "#190f0a" // contorno profundo
  };

  const ELLA = [
    "................",
    "....OOOOOOOO....",
    "...OHHHHHHHHO...",
    "..OHHHHHHHHHHO..",
    "..OHHHHHHHHHHO..",
    "..OHHSSSSSSHHO..",
    "..OHGGSSSSGGHO..",
    "..OGSEGSSGESGO..",
    "..OHGGSSSSGGHO..",
    "..OHPSSSSSSPHO..",
    "..OHSSMSSMSSHO..",
    "..OHOSSMMSSOHO..",
    "..OHHOOOOOOHHO..",
    "..OHWWWWWWWWHO..",
    "..OWWWWWWWWWWO..",
    "..OWWWWWWWWWWO..",
    "..OSWWWWWWWWSO..",
    "...OOWWWWWWOO...",
    "....OBBBBBBO....",
    "....OBBBBBBO....",
    "....OBBBBBBO....",
    "....OBBOOBBO....",
    "....OBBO.OBBO...",
    "...OWWWO.OWWWO..",
    "...OOOOO.OOOOO.."
  ];

  const EL = [
    "................",
    "....OOOOOOOO....",
    "...OKKKKKKKKO...",
    "...OKKKKKKKKO...",
    "...OKDDDDDDKO...",
    "...ODDDDDDDDO...",
    "...ODDYDDYDDO...",
    "...ODDDTTDDDO...",
    "...ODMDDDDMDO...",
    "....ODDMMDDO....",
    ".....OOOOOO.....",
    "....OOWWWWOO....",
    "..OOWWWWWWWWOO..",
    "..OWWWWWWWWWWO..",
    "..ODWWWWWWWWDO..",
    "..ODWWWWWWWWDO..",
    "..ODDWWWWWWDDO..",
    "...OOWWWWWWOO...",
    "....OBBBBBBO....",
    "....OBBBBBBO....",
    "....OBBBBBBO....",
    "....OBBOOBBO....",
    "....OBBO.OBBO...",
    "...OWWWO.OWWWO..",
    "..OOOOOO.OOOOOO."
  ];

  const GRILLAS = { ella: ELLA, el: EL };

  /* Cada personaje se pinta una sola vez en un lienzo propio y después solo se
     copia con drawImage. Si se pintara píxel a píxel en cada fotograma el
     navegador no daría a tiempo. */
  const texturas = {};

  function textura(quien) {
    if (texturas[quien]) return texturas[quien];

    const filas = GRILLAS[quien];
    if (!filas) return null;

    const lienzo = document.createElement("canvas");
    lienzo.width = ANCHO;
    lienzo.height = ALTO;
    const ctx = lienzo.getContext("2d");

    filas.forEach((fila, y) => {
      for (let x = 0; x < ANCHO; x++) {
        const color = PALETA[fila[x]];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    });

    texturas[quien] = lienzo;
    return lienzo;
  }

  /* Para mostrar a los dos en el menú y en el podio se usa una versión grande
     ya dibujada, porque hacerlos con <canvas> dentro de las tarjetas obliga a
     sincronizar el tamaño en cada redibujado. Esta devuelve un data-URL. */
  const urls = {};

  function url(quien, escala) {
    const s = escala || 6;
    const clave = quien + "-" + s;
    if (urls[clave]) return urls[clave];

    const origen = textura(quien);
    if (!origen) return "";

    const lienzo = document.createElement("canvas");
    lienzo.width = ANCHO * s;
    lienzo.height = ALTO * s;
    const ctx = lienzo.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(origen, 0, 0, lienzo.width, lienzo.height);

    urls[clave] = lienzo.toDataURL("image/png");
    return urls[clave];
  }

  /* Dibuja al personaje centrado en x y con los pies en y.

     Opciones:
       paso    0 quieto · 1 y 2 alternan las piernas (efecto de caminar)
       sombra  dibuja una elipse oscura bajo los pies
       invertir  lo refleja para que mire hacia el otro lado
       tinte   0..1 · le tiñe todo el cuerpo de un color (para cuando gana) */
  function dibujar(ctx, quien, x, y, escala, opciones) {
    const img = textura(quien);
    if (!img) return;

    const op = opciones || {};
    const e = escala || 1;
    const w = ANCHO * e;
    const h = ALTO * e;
    const arriba = y - h;

    ctx.save();

    if (op.sombra) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.ellipse(x, y + 1, w * 0.4, e * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    /* Sin suavizado: si no, el navegador estira los píxeles con blur y deja
       de verse pixel art. */
    ctx.imageSmoothingEnabled = false;

    /* "invertir" se aplica antes de pintar para que el reflejo también mueva
       las piernas del mismo lado que el resto del cuerpo. */
    if (op.invertir) {
      ctx.translate(x, 0);
      ctx.scale(-1, 1);
      ctx.translate(-x, 0);
    }

    /* El cuerpo se pega de un solo tiro, salvo cuando camina: en ese caso se
       parte en dos, cuerpo quieto y piernas corridas, y se pega un píxel
      Corrido cada una al revés. */
    if (op.paso) {
      const corte = 18;
      const desfase = op.paso === 1 ? e : -e;
      ctx.drawImage(img, 0, 0, ANCHO, corte, x - w / 2, arriba, w, corte * e);
      ctx.drawImage(
        img, 0, corte, ANCHO, ALTO - corte,
        x - w / 2 + desfase, arriba + corte * e, w, (ALTO - corte) * e
      );
    } else {
      ctx.drawImage(img, x - w / 2, arriba, w, h);
    }

    if (op.tinte) {
      ctx.globalCompositeOperation = "source-atop";
      ctx.globalAlpha = op.tinte;
      ctx.fillStyle = op.color || "#ffffff";
      ctx.fillRect(x - w / 2, arriba, w, h);
    }

    ctx.restore();
  }

  return { ANCHO, ALTO, PALETA, ELLA, EL, textura, url, dibujar };
})();
