// test-script.js — archivo de prueba para CSS/JS Linker

// Prueba: getElementById
const form = document.getElementById('login-form');

// Prueba: getElementsByClassName
const buttons = document.getElementsByClassName('btn');

// Prueba: querySelector con clase
const container = document.querySelector('.container');

// Prueba: querySelector con ID
const usernameField = document.querySelector('#username');

// Prueba: classList
const submitBtn = document.querySelector('.submit-btn');
if (submitBtn) {
  submitBtn.classList.add('primary');
  submitBtn.classList.remove('primary');
}

// Prueba: querySelectorAll con clase
const inputFields = document.querySelectorAll('.input-field');
inputFields.forEach(field => {
  field.addEventListener('focus', () => {
    field.classList.add('focused');
  });
});

// Prueba: manejo de envío de formulario
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    console.log('Logging in:', username, password);
  });
}
