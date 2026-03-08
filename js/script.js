const fotos = [
{src:"img/foto1.jpg",desc:"San Valentín ❤️",fecha:"14 de febrero 2026"},
{src:"img/foto2.jpg",desc:"Acompañándote a buscar trabajo (paso por Dollar City)",fecha:"11 de febrero 2026"},
{src:"img/foto3.jpg",desc:"Paso por Dollar City",fecha:"11 de febrero 2026"},
{src:"img/foto4.jpg",desc:"Tu cumpleaños 🎂",fecha:"27 de julio 2025"},
{src:"img/foto5.jpg",desc:"Visita a tu casa",fecha:"22 de agosto 2025"},
{src:"img/foto6.jpg",desc:"Otra de tu cumpleaños",fecha:"27 de julio 2025"},
{src:"img/foto7.jpg",desc:"Salida a comer heladito 🍦",fecha:"11 diciembre 2024"},
{src:"img/foto8.jpg",desc:"Boda de tu prima (te veías hermosa)",fecha:"Diciembre 2025"},
{src:"img/foto9.jpg",desc:"Día de tu investidura 🎓",fecha:"8 noviembre 2025"},
{src:"img/foto10.jpg",desc:"Nosotros ❤️",fecha:"23 noviembre 2025"},
{src:"img/foto11.jpeg",desc:"Día de tu investidura 🎓",fecha:"8 noviembre 2025"},
{src:"img/foto12.jpg",desc:"Primer Aniversario",fecha:"22 febrero 2026"}
];

const fotosContainer = document.getElementById("fotosContainer");

fotos.forEach(f=>{
let card=document.createElement("div");
card.classList.add("card");
card.innerHTML=`
<img src="${f.src}">
<h3>${f.desc}</h3>
<p>${f.fecha}</p>
`;
fotosContainer.appendChild(card);
});

const videos=[
    {src:"videos/video1.mp4",desc:"San Valentín juntos ❤️"},
    {src:"videos/video2.mp4",desc:"Me viniste a visitar porque estaba enfermo 🤒"},
    {src:"videos/video3.mp4",desc:"Fui a verte jugar fulvito ⚽"},
    {src:"videos/video4.mp4",desc:"Despedida después de día juntos 💔"},
    {src:"videos/video6.mp4",desc:"Pasadia juntos, Primer aniversario 🏕️"},
    {src:"videos/video5.mp4",desc:"Resumen Primer aniversario 🎬"}
];

const videosContainer=document.getElementById("videosContainer");

videos.forEach(v=>{
let card=document.createElement("div");
card.classList.add("card");
card.innerHTML=`
<video controls>
<source src="${v.src}" type="video/mp4">
</video>
<p>${v.desc}</p>
`;
videosContainer.appendChild(card);
});

const canciones=[
{file:"music/asomate a la ventana.mp3",nombre:"Asómate a la ventana",artista:"Kevin Flórez",historia:"Canción que te gusta mucho"},
{file:"music/di que si.mp3",nombre:"Di que sí",artista:"L'omy",historia:"Dedicatoria"},
{file:"music/ella es mi fiesta.mp3",nombre:"Ella es mi fiesta",artista:"Carlos Vives",historia:"Dedicatoria"},
{file:"music/ella es mi todo.mp3",nombre:"Ella es mi todo",artista:"Kalet Morales",historia:"Dedicatoria"},
{file:"music/MAI.mp3",nombre:"M.A.I",artista:"Milo J",historia:"Dedicatoria"},
{file:"music/melon vino.mp3",nombre:"Melón Vino",artista:"WOS",historia:"Nuestra canción especial ❤️"},
{file:"music/obseseion.mp3",nombre:"Obseseion",artista:"Peter Manjarres",historia:"Dedicatoria"},
{file:"music/oh que sera.mp3",nombre:"Oh qué será",artista:"Willie Colón",historia:"Dedicatoria"},
{file:"music/ojitos lindos.mp3",nombre:"Ojitos Lindos",artista:"Bad Bunny",historia:"Tus ojitos preciosos"},
{file:"music/te amo.mp3",nombre:"Te amo",artista:"Paulo Londra",historia:"Dedicatoria"},
{file:"music/tragao de ti.mp3",nombre:"Tragao de ti",artista:"Peter Manjarres",historia:"Dedicatoria"},
{file:"music/tuyo.mp3",nombre:"Tuyo",artista:"Mora",historia:"Dedicatoria"},
{file:"music/Vivo en el limbo.mp3",nombre:"Vivo en el limbo",artista:"Kalet Morales",historia:"Dedicatoria"},
{file:"music/yo no se manana.mp3",nombre:"Yo no sé mañana",artista:"Luis Enrique",historia:"Dedicatoria"},
{file:"music/baile inolvidable.mp3",nombre:"Baile inolvidable",artista:"Bad Bunny",historia:"Siempre serás mi baile inolvidable ❤️"}
];

const musicList=document.getElementById("musicList");

canciones.forEach(c=>{
let card=document.createElement("div");
card.classList.add("card");
card.innerHTML=`
<h3>${c.nombre}</h3>
<p>${c.artista}</p>
<p><em>${c.historia}</em></p>
<audio controls>
<source src="${c.file}" type="audio/mpeg">
</audio>
`;
musicList.appendChild(card);
});


const frases=[
"Amo tu sonrisa ❤️",
"Me encantan tus ojitos",
"Siempre amo cuando me abrazas",
"Amo amarte todo el tiempo",
"Eres mi princesita preciosa",
"Siempre contarás conmigo",
"Me niego a tener un futuro sin ti",
"Quiero vivir contigo por el resto de mi vida"
];

function fraseAleatoria(){
let random=Math.floor(Math.random()*frases.length);
document.getElementById("frase").innerText=frases[random];
}

setInterval(fraseAleatoria,4000);
fraseAleatoria();



// PARTICULAS
const particlesContainer = document.getElementById("particles");
for(let i=0;i<40;i++){
const particle=document.createElement("div");
particle.classList.add("particle");
particle.style.left=Math.random()*100+"vw";
particle.style.animationDuration=(6+Math.random()*6)+"s";
particlesContainer.appendChild(particle);
}

// SOBRE
function abrirCarta(element){
element.classList.toggle("open");
}

// MAQUINA DE ESCRIBIR
const textoCarta2=`
Ahora solo quería escribirte algo diferente, algo que puedas conservar y leer para recordar cuánto te amo. Nunca quiero generarte dudas sobre lo que siento por ti; mi deseo es expresarte mi amor de todas las formas posibles. A veces no cuento con mucho tiempo, pero no dudes de que quiero terminar todo lo que tengo pendiente para empezar nuestro futuro juntos.
Estoy ansioso porque llegue el momento en que te vea caminar hacia el altar y sentirme más que realizado. Ver cómo crecen nuestros hijos, regresar a casa después del trabajo y saber que tú estás ahí esperándome son cosas que pienso a diario y que quiero cumplir, pero solo contigo.
No sé qué será de mi vida el día de mañana, pero tengo claro que quiero que estés en ella. Te amo infinitamente, mi lado luminoso de la vida
`;

let i=0;
function maquinaEscribir(){
if(i<textoCarta2.length){
document.getElementById("typewriter").innerHTML+=textoCarta2.charAt(i);
i++;
setTimeout(maquinaEscribir,40);
}
}
maquinaEscribir();

// MINI JUEGO
let preguntas=[
["¿Cuál fue el día exacto en que hablamos por primera vez?","17 de octubre","Sabía que lo tenías presente ❤️","-20% de amor, sabía que yo te amaba más 😢"],
["¿Qué canción te canté por llamada?","melon vino","Te la dedico 1 y 1000 veces 🎶","-20 de amor 😭"],
["¿Título de la carta que te di?","lunedi","Siempre estaré aquí para amarte 💌","-20% de amor 💔"]
];

let actual=0;
let amor=100;

function mostrarPregunta(){
document.getElementById("pregunta").innerText=preguntas[actual][0];
document.getElementById("amor").innerText="Amor: "+amor+"%";
}
mostrarPregunta();

function verificar(){
let r=document.getElementById("respuesta").value.toLowerCase().trim();

if(r===preguntas[actual][1]){
document.getElementById("resultado").innerText=preguntas[actual][2];
}else{
if(actual===0) amor-=20;
if(actual===1) amor-=50;
if(actual===2) amor-=80;
document.getElementById("resultado").innerText=preguntas[actual][3];
}

document.getElementById("amor").innerText="Amor: "+amor+"%";
actual++;
document.getElementById("respuesta").value="";

if(actual<preguntas.length){
mostrarPregunta();
}else{
document.getElementById("pregunta").innerText="Juego terminado ❤️";
}
}

// SECRETO
function verificarClave(){
let clave=document.getElementById("clave").value.trim();

if(clave==="17102024"){
let secreto=document.getElementById("contenidoSecreto");
secreto.style.display="block";
secreto.style.animation="fadeIn 1s ease-in-out";
}else{
alert("Esa no es la fecha correcta ❤️");
}
}

// CONTADOR
const inicio=new Date("2025-02-22");
function actualizarContador(){
let hoy=new Date();
let diff=Math.floor((hoy-inicio)/(1000*60*60*24));
document.getElementById("contador").innerText=diff+" días desde que comenzó nuestra historia ❤️";
}
actualizarContador();


// MENSAJE 

function mensajeMujer(){
document.getElementById("mensajeMujer").innerText=
"Gracias por permitirme ser el novio y futuro esposo de tan maravillosa mujer. Te amo 🤍";
}

// ROSAS
const rosasContainer = document.getElementById("rosas");

for(let i=0;i<30;i++){

let rosa=document.createElement("div");

rosa.classList.add("rosa");

rosa.innerText="🌹";

rosa.style.left=Math.random()*100+"vw";

rosa.style.animationDuration=(5+Math.random()*5)+"s";

rosa.style.fontSize=(20+Math.random()*20)+"px";

rosasContainer.appendChild(rosa);

}
