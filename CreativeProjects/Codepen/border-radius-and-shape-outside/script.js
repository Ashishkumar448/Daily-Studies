addEventListener('input', (event) => {
  const { type, name, value} = event.target;
  
  if (type === 'range') {
    document.body.style.setProperty(`--${name}`, `${value}em`);
  }
});