// scroll-anim.js
// Activa el “wipe a negro” y revela cards al entrar en viewport
const integrantes = document.querySelector('#integrantes');
const cards = document.querySelectorAll('.card');

const opts = { root: null, threshold: 0.25 };

const secObserver = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      integrantes.classList.add('in-view');
    } else {
      integrantes.classList.remove('in-view');
    }
  });
}, opts);

if(integrantes) secObserver.observe(integrantes);

const cardObserver = new IntersectionObserver((entries)=>{
  entries.forEach((e, idx)=>{
    if(e.isIntersecting){
      // escalonado fino sin CSS calc hacks
      setTimeout(()=> e.target.classList.add('in-view'), idx*90);
      cardObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

cards.forEach(c=>cardObserver.observe(c));
