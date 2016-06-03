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
    encoding: null,
    "Accept-Charset": "utf-8",
    form: {
      login: aluno.login,
      senha: aluno.senha,
      command: 'AlunoLogin'
    },
    jar: true
  };
  request(config, function (erro, resposta, corpo) {
    // utf-8
    corpo = iconv.decode(new Buffer(corpo), "ISO-8859-1");
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

/**
 * Precisa-se tratar a url de notas, portanto, esta função o faz.
 * 
 * @param {string} url Url a ser tratada.
 * @returns {string} Url final.
 */
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

/**
 * A url de notas e a url de faltas são extremamente parecidas.
 * Portanto, dada a url de notas, esta função retorna a url de faltas.
 * 
 * @param {string} url Url de notas.
 * @returns {string} Url de faltas.
 */
var getURLFaltas = function (url) {
  return url.substring(0, url.indexOf("Notas")) + "Frequencia" + url.substring(url.indexOf("&"));
};

/**
 * Dado um array em que serão guardadas as disciplinas e o json da página,
 * a função filtra o html buscando informações da disciplinas e as adiciona no
 * array.
 * 
 * @param {Array} disciplinas Array para serem guardadas as disciplinas.
 * @param {Object} json JSON do html.
 */
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

/**
 * Dado um array em que serão guardados os valores da tabela de notas e o json da página,
 * a função filtra o html buscando tais valores e os adiciona no array.
 * 
 * @param {Array} valores Array para serem guardados os valores da tabela de notas.
 * @param {Object} json JSON do html.
 */
var getValoresTabelaNotas = function (valores, json) {
  for (var i = 7; i < json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['3']['children']['1']['children'].length; i += 2) {
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

/**
 * Dado um array em que serão guardados os campos (thead) da tabela de notas e o json da página,
 * a função filtra o html buscando tais campos e os adiciona no array.
 * 
 * @param {Array} valores Array para serem guardados os campos da tabela de notas.
 * @param {Object} json JSON do html.
 */
var getCamposTabelaNotas = function (campos, json) {
  for (var i = 7; i < json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['1']['children']['1']['children'].length; i += 2) {
    var campo = {};
    campo.nome = json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['1']['children']['1']['children'][i]['children']['0']['content'].replace('\r\n', '')
      .replace("M.&nbsp;parc.", "Média Parcial").replace('E.&nbsp;final', "Exame Final").replace('M.&nbsp;final', "Média Final");
    if (!_.isUndefined(json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['1']['children']['1']['children'][i]['children']['3'])) {
      campo.peso = json['2']['children']['3']['children']['6']['children']['7']['children']['1']['children']['1']['children']['1']['children'][i]['children']['3']['children']['0']['content'].replace('(P = ', '').replace(')', '');
    }

    campos.push(campo);
  }
};

/**
 * Dada uma string que é a linha em que a disciplina está no histórico,
 * a função retorna a disciplina e suas informações se for possível. Se não,
 * retorna undefined.
 * 
 * @param {string} disciplina Linha do html na qual as informações vão ser filtradas.
 * @returns {Object} Disciplina e suas informações no histórico.
 */
var getDisciplinaHistorico = function (disciplina) {
  try {
    var disciplinaRetorno = {};

    var str = disciplina.split(' ');

    var i = 0;
    !isNaN(parseInt(str[i])) && str[i].length === 7 ? disciplinaRetorno.codigo = parseInt(str[i++]) : disciplina = undefined;
    if (_.isUndefined(disciplina)) {
      return undefined;
    }
    disciplinaRetorno.nome = str[i++];
    do {
      if (_.isEmpty(str[i])) {
        break;
      }
      disciplinaRetorno.nome += ' ' + str[i++];
    } while (i < str.length);

    while (_.isEmpty(str[i++]) && i < str.length);
    disciplinaRetorno.creditos = str[--i];
    i += 2;
    disciplinaRetorno.ch = str[i++];

    while (_.isEmpty(str[i++]) && i < str.length);
    i--;
    disciplinaRetorno.periodo = str[i] + '.' + str[i + 1];
    i += 2;
    while (_.isEmpty(str[i++]) && i < str.length);
    i--;
    disciplinaRetorno.nota = str[i++];
    disciplinaRetorno.situacao = str[i++];
    while (!_.isEmpty(str[i]) && i < str.length) {
      disciplinaRetorno.situacao += ' ' + str[i++];
    }
    return disciplinaRetorno;
  } catch (e) {
    return undefined;
  }
};

controle.login({ login: '115110563', senha: 'tacio8000' }, function (corpo) {
  
  var user = {};
  var json = himalaya.parse(corpo);
  var info = json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children']['0']['content'].split(' ');
  var i = 0;
  user.matricula = info[i++];
  i++;
  user.nome = info[i++];
  do{
    if(!_.isUndefined(info[i]))
      user.nome += ' ' + info[i++];
  }while(i < info.length);
  
  fs.writeFile('dump.json', JSON.stringify(json));
  // json['2']['children']['3']['children']['6']['children']['3']['children']['3']['children']['0']['content']
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
    user.emCurso = disciplinas;
    fs.writeFile('dump.json', JSON.stringify(json));

    controle.get('AlunoHistorico', function (corpo) {

      var json = himalaya.parse(corpo);
      var historico = [];

      for (var i = 1; i < json['2']['children']['3']['children']['6']['children']['22']['children'].length; i += 2) {
        if (!_.isUndefined(json['2']['children']['3']['children']['6']['children']['22']['children'][i]['children'])
          && !_.isUndefined(json['2']['children']['3']['children']['6']['children']['22']['children'][i]['children']['0'])) {
          var disciplinaHistorico = getDisciplinaHistorico(json['2']['children']['3']['children']['6']['children']['22']['children'][i]['children']['0']['content']);
          if (!_.isUndefined(disciplinaHistorico)) {
            historico.push(disciplinaHistorico);
          }
        }
      }

      user.historico = historico;
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

          disciplina.notas = [];
          for (var i = 0; i < campos.length; i++) {
            campos[i].value = valores[i];
            disciplina.notas.push(campos[i]);
          }
          console.log(user);
        });
      });
    });
  });
});
