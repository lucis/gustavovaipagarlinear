var request = require("request"), iconv = require('iconv-lite');
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
    encoding: null,
    method: 'GET',
    url: URL_CONTROLE + '?command=' + comando,
    "Accept-Charset": "utf-8",
    jar: true
  };
  //console.log(URL_CONTROLE + '?command=' + comando);
  //console.log("\n\n\n\n\n\n\n\n");
  request(config, function (erro, resposta, corpo) {
    // utf-8
    corpo = iconv.decode(new Buffer(corpo), "ISO-8859-1");
    if (erro) {
      console.log("ERRO: " + erro);
    }
    //console.log(corpo)
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
    if (erro) {
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

var search = function (path, obj, target) {
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
};

var refinaURL = function (url) {
  var urlFinal = "";
  for (var j = 0; j < url.length; j++) {
    urlFinal += url[j];
    if (url[j] === '&') {
      j += 4;
    }
  }
  return urlFinal;
};

var getURLFaltas = function (url) {
  return url.substring(0, url.indexOf("Notas")) + "Frequencia" + url.substring(url.indexOf("&"));
};

var getDisciplinas = function (disciplinas, json) {
  for (var i = 1; i < json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children'].length; i = i + 2) {
    var disciplina = {};
    disciplina.nome = json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children'][i]['children']['5']['children']['1']['children']['0']['content'];
    disciplina.urlNotas = json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children'][i]['children']['5']['children']['1']['attributes']['href'].substring(20);
    disciplina.urlNotas = refinaURL(disciplina.urlNotas);
    disciplina.urlFaltas = getURLFaltas(disciplina.urlNotas);

    disciplina.horarios = "";
    for (var j = 0; j < json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children'][i]['children']['9']['children'].length; j = j + 2) {
      disciplina.horarios += json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children'][i]['children']['9']['children'][j]['content'];
    }
    disciplina.turma = json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children'][i]['children']['7']['children']['0']['content'];
    disciplinas.push(disciplina);
  }
};

var getValoresTabelaNotas = function (valores, json) {
  for (var i = 3; i < json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['3']['children']['1']['children'].length; i += 2) {
    try {
      var valor = json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['3']['children']['1']['children'][i]['children']['0']['content'];
      if (_.isUndefined(valor)) {
        valor = json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['3']['children']['1']['children'][i]['children']['0']['children']['0']['content'];
      }
      valores.push(valor);
    } catch (erro) {
      valores.push('');
    }
  }
};

var getCamposTabelaNotas = function (campos, json) {
  for (var i = 3; i < json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['1']['children']['1']['children'].length; i += 2) {
    var campo = json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['1']['children']['1']['children'][i]['children']['0']['content'];
    if (!_.isUndefined(json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['1']['children']['1']['children'][i]['children']['3'])) {
      campo += ' ' + json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['1']['children']['1']['children'][i]['children']['3']['children']['0']['content'];
    }

    campos.push(campo);
  }
};

controle.login({ login: '115110125', senha: 'nicolas9' }, function (corpo) {
  controle.get('AlunoTurmasListar', function (corpo) {
    var json = himalaya.parse(corpo);

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
    getDisciplinas(disciplinas, json);
    fs.writeFile('dump.json', JSON.stringify(json));

    _.each(disciplinas, function (disciplina) {
      controle.get(disciplina.urlNotas, function (corpo) {
        var json = himalaya.parse(corpo);

        // console.log(search("json", json, "Matrícula"));
        // json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['1']['children']['1']['children']['3']['children']['0']['content']
        // console.log(search("json", json, "Nome"));
        // json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['1']['children']['1']['children']['5']['children']['0']['content']
        // console.log(search("json", json, "\r\nNota 1"));
        // json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['1']['children']['1']['children']['7']['children']['0']['content']
        // console.log(search("json", json, "(P = 1)"));
        // json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['1']['children']['1']['children']['7']['children']['3']['children']['0']['content']
        // console.log(search("json", json, "\r\nNota 2"));
        // json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['1']['children']['1']['children']['9']['children']['0']['content']
        // console.log(search("json", json, "(P = 1)"));
        // json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['1']['children']['1']['children']['7']['children']['3']['children']['0']['content']
        // console.log(search("json", json, "\r\nNota 3"));
        // json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['1']['children']['1']['children']['11']['children']['0']['content']
        // console.log(search("json", json, "(P = 1)"));
        // json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['1']['children']['1']['children']['7']['children']['3']['children']['0']['content']

        var campos = [];
        getCamposTabelaNotas(campos, json);

        // console.log(search("json", json, "115110125"));
        // json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['3']['children']['1']['children']['3']['children']['0']['content']
        // console.log(search("json", json, "LUCIANO DE OLIVEIRA JUNIOR"));
        // json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['3']['children']['1']['children']['5']['children']['0']['content']
        // console.log(search("json", json, "5.5"));
        // json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['3']['children']['1']['children']['7']['children']['0']['content']
        // console.log(search("json", json, "5.7"));
        // json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['3']['children']['1']['children']['9']['children']['0']['content']
        // console.log(search("json", json, "8.2"));
        // json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['3']['children']['1']['children']['11']['children']['0']['content']
        // console.log(search("json", json, "6.5"));
        // json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['3']['children']['1']['children']['13']['children']['0']['children']['0']['content']
        var valores = [];
        getValoresTabelaNotas(valores, json);

        for (var i = 0; i < campos.length; i++) {
          disciplina[campos[i]] = valores[i];
        }
        console.log(disciplina);
      });
    });
  });
});