document.addEventListener('DOMContentLoaded', ()=>{
  initFAQ();
});

function initFAQ(){
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');

    q.addEventListener('click', ()=>{
      const isOpen = item.classList.contains('open');

      items.forEach(other => {
        other.classList.remove('open');
        other.querySelector('.faq-a').style.maxHeight = null;
      });

      if(!isOpen){
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
        if(typeof SFX !== 'undefined') SFX.play('click');
      }
    });
  });
}
