//
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
var pgbase = 'Pruebas';
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
        builder.Prompts.text(session,'Hola, introduce el tour id:');
     }, (session,results) =>{
        var llave = results.response;
        pool.connect(function (err, client, done) {
            if (err) console.log(err);
            var consulta = `Select * from distribucion where tour_id =${llave}`
            client.query(consulta,  (err, result) => {
                if (err) {
                console.log(err)
                }
                query = result.rows[0]['estado'];
                console.log(query);
                cadena = query;
                session.send(`Tour id: ${llave}`);
                session.endConversation(`Estado: ${cadena}`);
                pool.end().then(() => console.log('pool has ended'))
            })
            })   
    }
]);
