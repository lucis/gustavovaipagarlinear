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
                jar: true,
                headers: 
                { 'content-type': 'application/x-www-form-urlencoded',
                  'postman-token': '42a2ce0c-350e-630f-1956-54f2da81e305',
                  'cache-control': 'no-cache' },
                  form: { login: result.matricula  , senha: result.senha, command: 'AlunoLogin' },
              };
  request(options, function (error, response, body) {
    var op = { method: 'GET',
                url: 'https://pre.ufcg.edu.br:8443/ControleAcademicoOnline/Controlador?command=AlunoTurmaNotas&codigo=1109053&turma=04&periodo=2015.2',
                jar: true,
                headers:
                {
                  'content-type': 'application/x-www-form-urlencoded',
                  'postman-token': '42a2ce0c-350e-630f-1956-54f2da81e305',
                  'cache-control': 'no-cache'
                }
              };
              var res = {};
              function checa() {
                request(op, function (erro, resposta, corpo) {
                  
                  if (res !== corpo){
                    console.log("MUDOUUUUUUUUUUUU");
                  }else{
                    console.log("mesma coisa");
                  }
                  res = corpo;
                });
              }
          setInterval(checa, 10*1000);
    
  });
});
