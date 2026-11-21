const { crearApp } = require('./app');

// Elastic Beanstalk entrega el puerto en la variable PORT (por defecto 8080).
const PORT = process.env.PORT || 8080;

crearApp().listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
