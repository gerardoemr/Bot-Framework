//Carga las variables del arhivo .env
require('dotenv-extended').load();

var mailer = require('nodemailer');
var builder = require('botbuilder');
var restify = require('restify');
var Promise = require('bluebird');
var request = require('request-promise').defaults({ encoding: null });

var transporter = mailer.createTransport({
    service: 'Outlook',//Gmail,Yahoo,...
    auth: {
         user: '',//remitente
         pass: ''//contraseña
    },
    tls:{
        rejectUnauthorized : false
    }
});

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

var connector = new builder.ChatConnector({
    appId: "",
    appPassword: "",
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, [(session,next) =>{
    var msg = "Hola, soy un bot que envía archivos adjuntos por correo.";
    session.send(msg);
    session.beginDialog('adjunto');
    }
]);
           
bot.dialog('adjunto', (session) => {
    var msg = session.message;

    if (msg.attachments.length) { //si existe el mensaje se procede a descargarlo.
        //Las URL's de archivos adjuntos de Skype & MS Teams están protegidos por un JwtToken, entonces se deben enviar las 
        //credenciales del bot para poder obtener el archivo adjunto.
        var attachment = msg.attachments[0];
        var fileDownload = checkRequiresToken(msg) ? requestWithToken(attachment.contentUrl) : request(attachment.contentUrl);

        fileDownload.then(
            function (response) {
                //Esto devuelve información sobre el tipo y tamaño del archivo adjunto.
                var reply = new builder.Message(session)
                    .text('Archivo adjunto de tipo %s y de %s bytes de tamaño recibido.', attachment.contentType, response.length);
                session.send(reply);

                // convierte la imagen a una cadena en formato base64
                var imageBase64Sting = new Buffer(response, 'binary').toString('base64');
                // envía la imagen recibida

                var echoImage = new builder.Message(session).text('Enviaste:').addAttachment({
                    contentType: attachment.contentType,
                    contentUrl: 'data:' + attachment.contentType + ';base64,' + imageBase64Sting,
                    name: 'Imagen adjunta'
                });
                session.send(echoImage);
                var datosEmail = {
                    from: 'Bot de servicio técnico.',
                    to: ``,//destinatario
                    subject: `Prueba de archivo adjunto`,
                    text: `Prueba del diálogo mail`, 
                    attachments:[{
                        filename: `Reporte Usuario.txt`,
                        content: 
                        `Reporte de error en la aplicación...\n\n`
                    },
                    {
                        path: 'data:' + attachment.contentType + ';base64,' + imageBase64Sting
                    }]
                };      
        transporter.sendMail(datosEmail);
                session.endDialog();
            }).catch(function (err) {
                console.log('Error al descargar el archivo adjunto:', { statusCode: err.statusCode, message: err.response.statusMessage });
            });
    } else {
        // No se recibió ningún archivo adjunto.
        var reply = new builder.Message(session)
            .text('Por favor, incluye el archivo ahora.');
        session.send(reply);
    }
});

// Se solicita la url al archivo a skype/msteams
var requestWithToken = function (url) {
return obtainToken().then(function (token) {
    return request({
        url: url,
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/octet-stream'
        }
    });
});
};

// Promise para obtener JWT Token (solicitada una vez)
var obtainToken = Promise.promisify(connector.getAccessToken.bind(connector));

var checkRequiresToken = function (message) {
    return message.source === 'skype' || message.source === 'msteams';
};