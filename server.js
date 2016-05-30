var request = require('request');
// isso que faz ele nao rejeitar uma requisicao com erro de certificado
var request = request.defaults({
  strictSSL: false,
  rejectUnauthorized: false
});

var prompt = require('prompt');
// libzinha para ler dados do console
prompt.start();

  var properties = [
    {
      name: 'matricula'
    },
    {
      name: 'senha',
      hidden: true
    }
  ];
  
prompt.get(properties, function (err, result) {
  if (err){
    console.log("Deu merda: "+error);
  }
  var options = { method: 'POST',
                url: 'https://pre.ufcg.edu.br:8443/ControleAcademicoOnline/Controlador',
                headers: 
                { 'content-type': 'application/x-www-form-urlencoded',
                  'postman-token': '42a2ce0c-350e-630f-1956-54f2da81e305',
                  'cache-control': 'no-cache' },
                  form: { login: result.matricula  , senha: result.senha, command: 'AlunoLogin' },
              };
  request(options, function (error, response, body) {
    if (error){
        console.log("Deu merda: "+error);
    }
    console.log(body);
  });
});
