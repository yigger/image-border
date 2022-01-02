const elements = document.getElementsByClassName('image__imagewrap')
for (let i = 0; i < elements.length; i++) {
  let imageSrc = elements[i].getElementsByTagName('img')[0].getAttribute('data-origin-src')
  window.open(imageSrc)
}
