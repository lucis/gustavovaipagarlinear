var request = require('request');
var himalaya = require('himalaya');
var htmlStr = require('html-strings');
var utf8 = require('utf8');
var _ = require('lodash');
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
      "Accept-Charset": "utf-8",
      jar: true
  };
  request(config, function (erro, resposta, corpo) {
    if (erro){
      console.log("ERRO: "+erro);
    }
    console.log(utf8.encode(corpo))
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
// prompt.start();

var properties = [
  { name: 'matricula' },
  { name: 'senha', hidden: true }
];

// prompt.get(properties, function (err, result) {
//   if (err){
//     console.log("Deu merda: "+error);
//   }
//   controle.login({login: result.matricula, senha: result.senha}, function (corpo) {
//     controle.get('AlunoTurmasListar', function (corpo) {
//       var json = himalaya.parse(corpo);
      
      
//       function search(path, obj, target) {
//           for (var k in obj) {
//               if (obj.hasOwnProperty(k))
//                   if (obj[k] === target)
//                       return path + "['" + k + "']"
//                   else if (typeof obj[k] === "object") {
//                       var result = search(path + "['" + k + "']", obj[k], target);
//                       if (result)
//                           return result;
//                   }
//           }
//           return false;
//       }

//       var path = search("json", json, "\r\nMATEM�TICA DISCRETA");
//       // CALCULO
//       //json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children']['1']['children']['5']['children']['1']['children']['0']['content']
//       // LP2
//       //json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children']['3']['children']['5']['children']['1']['children']['0']['content']
//       // DISCRETA
//       // json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children']['5']['children']['5']['children']['1']['children']['0']['content']
//       // console.log(path); //data['key1']['children']['key4']
//       for (var i = 1; i < json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children'].length; i = i + 2){
//         // NOME
//         // console.log(json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children'][i]['children']['5']['children']['1']['children']['0']['content'])
//         console.log(json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children'][i]);
//       }
//       // fs.writeFile('dump.json', JSON.stringify(json));
//     });
    
//   });
  
  
// });
controle.login({login: '115110125', senha: 'nicolas9'}, function (corpo) {
    controle.get('AlunoTurmasListar', function (corpo) {
      var json = himalaya.parse(utf8.encode(corpo));
      function search(path, obj, target) {
          for (var k in obj) {
              if (obj.hasOwnProperty(k))
                  if (obj[k] === target)
                      return path + "['" + k + "']"
                  else if (typeof obj[k] === "object") {
                      var result = search(path + "['" + k + "']", obj[k], target);
                      if (result)
                          return result;
                  }
          }
          return false;
      }

      var path = search("json", json, "04");
      // console.log(path);
      // CALCULO
      //json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children']['1']['children']['5']['children']['1']['children']['0']['content']
      // LP2
      //json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children']['3']['children']['5']['children']['1']['children']['0']['content']
      // DISCRETA
      // json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children']['5']['children']['5']['children']['1']['children']['0']['content']
      // console.log(path); //data['key1']['children']['key4']
      
      var disciplinas = [];
      for (var i = 1; i < json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children'].length; i = i + 2){
        var disciplina = {};
        disciplina.nome = json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children'][i]['children']['5']['children']['1']['children']['0']['content'];
        disciplina.url = json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children'][i]['children']['5']['children']['1']['attributes']['href'];
        disciplina.horarios = "";
        for (var j = 0; j < json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children'][i]['children']['9']['children'].length; j = j + 2){
          disciplina.horarios += json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children'][i]['children']['9']['children'][j]['content'];
        }
        disciplina.turma = json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children'][i]['children']['7']['children']['0']['content'];
        // console.log(disciplina);
      }
      fs.writeFile('dump.json', JSON.stringify(json));
    });
    
  });