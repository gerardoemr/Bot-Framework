const builder = require('botbuilder');
const restify = require('restify');

const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
   });

const express = require('express');
const app = express();
var pg = require('pg');
var format = require('pg-format');
var pguser = 'postgres';
var pgbase = 'dvdrental';
var pgcon = 'Memento1';
var llave = 7;
var config = {
    user: pguser,
    database: pgbase,  
    password: pgcon,
    max: 10,
    idleTimeoutMillis: 30000
};
var pool;
var myClient;
var query;
var cadena;

app.listen(3000, function () {
    console.log('listening on 3000')
})

const server = restify.createServer();
server.post('/api/messages', connector.listen());
server.listen(process.env.PORT || 3978,() => console.log('Server up!!'));

const bot = new builder.UniversalBot(connector,[
    (session) => {
        pool = new pg.Pool(config);
        builder.Prompts.text(session,'Hola, introduce cualquier letra:');
     }, (session,results) =>{
        var letra = results.response.charAt(0)
        var llave = "'".concat(letra.toUpperCase()).concat("%'");
        pool.connect(function (err, client, done) {
            if (err) console.log(err);
            var consulta = `Select * from actor where last_name like ${llave}`
            console.log(consulta)
            client.query(consulta,(err, result) => {
                if (err) {
                console.log(err)
                }
                var lista = []
                for (var x in result.rows){
                    var n = result.rows[x]["first_name"].concat(" ").concat(result.rows[x]["last_name"])
                    lista.push(n);
                }
                var output = []
                for(var actor in lista){
                    console.log(typeof(actor))
                    if(lista.length == 1 || actor == String(0)){
                        output[0]   = lista[actor]
                    }
                    else if( actor != lista.length - 1){
                        output[0] = String(output[0]).concat(", ").concat(String(lista[actor]))
                    }
                    else{
                        output[0] = String(output[0]).concat(" y ").concat(String(lista[actor]))
                    }
                }
                if (lista.length == 0){
                    session.endConversation("No hay actores cuyo apellido comience con esa letra")
                }
                else{
                    session.send(`Actores cuyo apellido comienza con ${letra}:`)
                    session.endConversation(output[0]);    
                }
                pool.end().then(() => console.log('pool has ended'))
            })
            })   
    }
]);
