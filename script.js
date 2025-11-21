// Sistema de animaciones y navegación de proyectos
// -------------------------------------------------
// Este script controla:
// 1) Animación de entrada de la página (GSAP)
// 2) Apertura/cierre del detalle de proyectos
// 3) Carga inicial basada en parámetros de URL
// Todas las funciones, variables y comentarios están en español para claridad.

// Usar gsap global directamente; el script GSAP se carga con defer antes de este módulo

let dentroProyecto = false

/**
 * Inicializa la animación de carga inicial del sitio.
 * - Marca el contenedor principal como visible.
 * - Dispara la animación de entrada de elementos al primer frame disponible.
 */
function inicializarCarga() {
  const contenedorPrincipal = document.querySelector(".contenedor-principal")
  if (contenedorPrincipal) contenedorPrincipal.classList.add("visible")
  // Iniciar animaciones al próximo frame para evitar jank
  requestAnimationFrame(() => {
    animarCargaDePagina()
  })
}

/**
 * Anima la carga inicial de la página (navegación, hero, proyectos y pie).
 * Usa un micro-stagger para dar sensación de fluidez sin demoras perceptibles.
 */
function animarCargaDePagina() {
  // Salida segura si GSAP no está disponible aún
  if (!window.gsap) return

  // Selección de elementos a animar
  const selectores = [
    "#logo > *",
    "#enlaces > *",
    ".titulo-hero > *",
    ".descripcion-hero",
    "#proyectos > a *",
    "#proyectos > div",
    "#pie > *",
    "#boton-chat"
  ]
  let elementos = selectores.flatMap((sel) => Array.from(document.querySelectorAll(sel)))
  // Excluir elementos que pertenezcan al espacio de proyecto
  elementos = elementos.filter((el) => !el.closest("#espacio-proyecto"))
  // Evitar animar elementos invisibles o no renderizados
  elementos = elementos.filter((el) => {
    const estilos = getComputedStyle(el)
    return estilos.display !== "none" && estilos.visibility !== "hidden"
  })
  if (!elementos.length) return

  // Estado inicial optimizado para animación
  gsap.set(elementos, { force3D: true, willChange: "transform, opacity, filter", opacity: 0, y: 20, filter: "blur(8px)" })

  // Animación global simultánea con micro-stagger
  gsap.to(elementos, {
    opacity: 1,
    y: 0,
    filter: "none",
    duration: 0.8,
    ease: "power2.out",
    stagger: { each: 0.02, from: 0 },
    clearProps: "transform,opacity,filter,willChange",
  })
}

// Proyectos: abrir detalle con animaciones
/**
 * Abre el detalle de un proyecto con animaciones y oculta el contenido principal.
 * @param {string} proyectoId - Identificador del proyecto (ej.: "01").
 * @param {HTMLElement} elementoProyecto - Enlace del proyecto que se clickeó.
 * @param {boolean} [desdeCarga=false] - Si viene de una carga directa por URL (omite salida).
 */
async function abrirProyecto(proyectoId, elementoProyecto, desdeCarga = false) {
  dentroProyecto = true

  // Animación de salida del contenido principal
  const tlSalida = gsap.timeline({ defaults: { ease: "power2.out" } })
  if (!desdeCarga) {
    tlSalida
      .to("#pie", { opacity: 0, y: 20, filter: "blur(1px)", duration: 0.3 })
      .to(
        "#contenido > *:not(.navegacion), #proyectos > *",
        { opacity: 0, x: -60, filter: "blur(6px)", duration: 0.4, stagger: 0.05 },
        ">",
      )
  }

  // Esperar a que termine la animación de salida antes de cambiar de vista
  if (!desdeCarga) {
    await new Promise((resolve) => {
      tlSalida.eventCallback("onComplete", resolve)
    })
  }

  // Mostrar contenedor de proyecto
  document.getElementById("contenido").style.display = "none"
  document.getElementById("espacio-proyecto").classList.remove("oculto")

  // Preparar contenido del proyecto
  const proyectoFuente = document.getElementById(`proyecto-${proyectoId}`)
  const tituloNodo = elementoProyecto.querySelector("h3, .titulo-blog, .blog-title")
  const tituloProyecto = tituloNodo ? tituloNodo.textContent : "Proyecto"
  const contenedorProyecto = document.getElementById("contenido-proyecto")

  contenedorProyecto.innerHTML = ""

  // Media principal (img/video) con carga diferida de data-src
  const media = proyectoFuente.querySelector("img, video")
  if (media) {
    const clon = media.cloneNode()
    if (clon.tagName === "IMG") {
      const diferida = clon.getAttribute("data-src") || media.getAttribute("data-src") || clon.getAttribute("src")
      if (diferida) clon.setAttribute("src", diferida)
      clon.removeAttribute("data-src")
      clon.setAttribute("loading", "eager")
      clon.setAttribute("decoding", "async")
    }
    contenedorProyecto.appendChild(clon)
  }

  // Título
  const titulo = document.createElement("h1")
  // Si el enlace del proyecto tiene data-url, el título será clickeable
  const urlProyecto = elementoProyecto && elementoProyecto.getAttribute("data-url")
  if (urlProyecto) {
    const enlaceTitulo = document.createElement("a")
    enlaceTitulo.href = urlProyecto
    enlaceTitulo.target = "_blank"
    enlaceTitulo.rel = "noopener noreferrer"
    enlaceTitulo.textContent = tituloProyecto
    titulo.appendChild(enlaceTitulo)
  } else {
    titulo.textContent = tituloProyecto
  }
  contenedorProyecto.appendChild(titulo)

  // Bloques de contenido + separadores
  const bloques = Array.from(proyectoFuente.children).filter(
    (el) => el.tagName !== "IMG" && el.tagName !== "VIDEO",
  )
  bloques.forEach((bloque, indice) => {
    const elementoParrafo = document.createElement("p")
    elementoParrafo.innerHTML = bloque.innerHTML
    contenedorProyecto.appendChild(elementoParrafo)
    if (indice < bloques.length - 1) {
      const separador = document.createElement("div")
      // Usar el contenedor de línea simple para separadores sutiles
      separador.className = "contenedor-linea"
      contenedorProyecto.appendChild(separador)
    }
  })

  // Entrada del detalle del proyecto
  gsap.fromTo(
    "#volver, #contenido-proyecto > *",
    { opacity: 0, x: -60, filter: "blur(6px)" },
    { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.5, stagger: 0.06, ease: "power2.out" },
  )
}

/**
 * Cierra el detalle de proyecto y restaura el contenido principal con animaciones.
 */
async function cerrarProyecto() {
  dentroProyecto = false

  // Salida del detalle de proyecto (en orden inverso)
  await new Promise((resolve) => {
    gsap.to("#volver, #contenido-proyecto > *", {
      opacity: 0,
      x: -50,
      filter: "blur(6px)",
      duration: 0.35,
      stagger: { each: 0.05, from: "end" },
      ease: "power2.out",
      onComplete: resolve,
    })
  })

  // Ocultar el espacio de proyecto y mostrar contenido principal
  document.getElementById("espacio-proyecto").classList.add("oculto")
  document.getElementById("contenido").style.display = "block"

  // Reaparecer contenido principal y footer simultáneamente
  gsap.fromTo(
    "#contenido > *:not(.navegacion), #proyectos > *",
    { opacity: 0, x: -50, filter: "blur(6px)" },
    { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.5, stagger: 0.05, ease: "power2.out" },
  )
  gsap.fromTo(
    "#pie",
    { opacity: 0, y: 20, filter: "blur(6px)" },
    { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power2.out" },
  )
}

// Eventos del documento y utilidades de interacción
document.addEventListener("DOMContentLoaded", () => {
  // Iniciar animaciones y preparar la interfaz
  inicializarCarga()

  // Enlaces/disparadores de proyectos
  const disparadoresProyecto = [...document.querySelectorAll("[proyecto]")]
  disparadoresProyecto.forEach((elemento) => {
    elemento.addEventListener("click", (evento) => {
      evento.preventDefault()
      const proyectoId = elemento.getAttribute("proyecto")
      if (!proyectoId) return
      abrirProyecto(proyectoId, elemento)
      history.pushState({ proyectoId }, "", `?proyecto=${proyectoId}`)
    })
  })

  // Manejador del botón "Volver"
  document.getElementById("volver").addEventListener("click", () => {
    cerrarProyecto()
    history.pushState({}, "", "/")
  })

  // Manejo del historial del navegador (atrás/adelante)
  window.addEventListener("popstate", (event) => {
    if (event.state && event.state.proyectoId) {
      const disparador = document.querySelector(`[proyecto="${event.state.proyectoId}"]`)
      if (disparador) abrirProyecto(event.state.proyectoId, disparador, true)
    } else {
      if (dentroProyecto) {
        cerrarProyecto()
      }
    }
  })

  // Desplazamiento suave para enlaces de anclaje (excluye deep links de proyectos)
  document.querySelectorAll('a[href^="#"]').forEach((enlaceAncla) => {
    enlaceAncla.addEventListener("click", function (evento) {
      const href = this.getAttribute("href") || ""
      // Evitar interferir con enlaces de proyecto del tipo #?proyecto=01
      if (href.includes("?proyecto=")) return
      // Evitar selectores inválidos
      try {
        const objetivo = document.querySelector(href)
        if (objetivo) {
          evento.preventDefault()
          objetivo.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      } catch (_) {
        // Ignorar si el selector no es válido
      }
    })
  })

  // Deep link de proyecto por URL
  const parametrosUrl = new URLSearchParams(window.location.search)
  let proyectoId = parametrosUrl.get("proyecto")
  // Fallback por hash (#?proyecto=01)
  if (!proyectoId && window.location.hash) {
    const coincidencia = window.location.hash.match(/proyecto=([\w-]+)/)
    if (coincidencia) proyectoId = coincidencia[1]
  }
  if (proyectoId) {
    const disparador = document.querySelector(`[proyecto="${proyectoId}"]`)
    if (disparador) {
      setTimeout(() => {
        abrirProyecto(proyectoId, disparador, true)
      }, 300) // Espera corta para entrada inicial
    }
  }
})

// Agregar pequeños efectos de interacción (hover) a los enlaces sociales
document.addEventListener("DOMContentLoaded", () => {
  // Efectos hover en enlaces sociales
  document.querySelectorAll(".enlace-social").forEach((link) => {
    link.addEventListener("mouseenter", () => gsap.to(link, { scale: 1.3, rotation: 5, duration: 0.1 }))
    link.addEventListener("mouseleave", () => gsap.to(link, { scale: 1, rotation: 0, duration: 0.3 }))
  })
})
