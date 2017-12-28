var fs = require('fs');

// This loads the environment variables from the .env file
require('dotenv-extended').load();

const builder = require('botbuilder');
const restify = require('restify');

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

server.post('/api/messages', connector.listen());

const bot = new builder.UniversalBot(connector, (session) => {
    session.send("Ejemplo de registro de conversaciones.");
});

const logUserConversation = (event) => {
    if(event.text){
        console.log(event.text.length);
        var registro = 'mensaje: ' + event.text + ', usuario: ' + event.address.user.name + '@' + new Date() + '\n';
        fs.appendFile('conversacion.txt', registro + '\n', function (err) {
            if (err) throw err;
            console.log('Archivo actualizado');
        });
    }
};

// Middleware para implementar el registro de conversaciones.
bot.use({
    receive: function (event, next) {
        logUserConversation(event);
        next();
    },
    send: function (event, next) {
        //logUserConversation(event);//Esta línea está comentada para no registrar las respuestas del bot
        next();
    }
});


