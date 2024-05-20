function openPopup() {
  document.getElementById('popup').style.display = 'flex';
}

function closePopup() {
  submitName();  // Call submitName when the popup is closed
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateVisitorName() {
  const visitorNumber = getRandomInt(101, 999);
  document.getElementById('Welcomming').innerHTML = 'Bienvenido,<br>Visitor #' + visitorNumber + '!';
}

function submitName() {
  var name = document.getElementById('nameInput').value;
  if (name !== '') {
    document.getElementById('Welcomming').innerHTML = 'Bienvenido,<br>' + name + '!';
  } else {
    generateVisitorName();
  }
  document.getElementById('popup').style.display = 'none';
  loadGameScript();
}

function loadGameScript() {
  var script = document.createElement('script');
  script.src = 'script.js';
  document.body.appendChild(script);
}

window.onload = openPopup;
