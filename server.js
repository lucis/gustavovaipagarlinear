var request = require('request');
var himalaya = require('himalaya');
var htmlStr = require('html-strings');
var fs = require('fs');
var escape = htmlStr.escape;
const URL_CONTROLE = 'https://pre.ufcg.edu.br:8443/ControleAcademicoOnline/Controlador';

// isso que faz ele nao rejeitar uma requisicao com erro de certificado
var request = request.defaults({
  strictSSL: false,
  rejectUnauthorized: false
});

var controle = {};
/**
 * Realiza requisicoes de pegar as paginas do ControleAcademicoOnline
 * Deve ser chamada apos o login ter ocorrido
 */
controle.get = function (comando, cb) {
  var config = {
      method: 'GET',
      url: URL_CONTROLE + '?command=' + comando,
      jar: true
  };
  request(config, function (erro, resposta, corpo) {
    if (erro){
      console.log("ERRO: "+erro);
    }
    return cb(corpo);
  });
};
/**
 * Realiza requisicao Inicial de Login
 */
controle.login = function (aluno, cb) {
    var config = {
        method: 'POST',
        url: URL_CONTROLE,
        form: {
          login: aluno.login,
          senha: aluno.senha,
          command: 'AlunoLogin'
        },
        jar: true
    };
    request(config, function (erro, resposta, corpo) {
        if (erro){
          console.log(erro);
        }
        cb(corpo);
    });
};

var prompt = require('prompt');
// libzinha para ler dados do console
prompt.start();

var properties = [
  { name: 'matricula' },
  { name: 'senha', hidden: true }
];

prompt.get(properties, function (err, result) {
  if (err){
    console.log("Deu merda: "+error);
  }
  controle.login({login: result.matricula, senha: result.senha}, function (corpo) {
    controle.get('AlunoTurmasListar', function (corpo) {
      var json = himalaya.parse(corpo);
      fs.writeFile('dump.json', JSON.stringify(json));
    });
    
  });
  
  
});
