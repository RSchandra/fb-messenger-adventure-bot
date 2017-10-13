var request = require('request');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var compression = require('compression');

var conf = require('./conf');

var app = express();
app.use(compression());
app.set('case sensitive routing', true);
app.use(bodyParser.json());

var httpServer = http.createServer(app);

app.get('/', function (req, res, next) {
  res.send('Welcome to Facebook Messenger Bot. This is root endpoint');
});

app.get('/webhook/', handleVerify);
app.post('/webhook/', receiveMessage);

function handleVerify(req, res, next){
	if (req.query['hub.verify_token'] === conf.VERIFY_TOKEN) {
    return res.send(req.query['hub.challenge']);
  }
  res.send('Validation failed, Verify token mismatch');
}

var oUsers = {};

function fHouseOrSpare(req, res){
	var message_instances = req.body.entry[0].messaging;
	message_instances.forEach(function(instance){
		var sender = instance.sender.id;
		if(instance.message && instance.message.text) {
			var msg_text = instance.message.text;
			var sMessage = "Good choice!";
			sendMessage(sender, sMessage, true);
		}
	});
}

function fBeginning(req, res){
	var message_instances = req.body.entry[0].messaging;
	message_instances.forEach(function(instance){
		var sender = instance.sender.id;
		if(instance.message && instance.message.text) {
			var msg_text = instance.message.text;
			var sMessage = "It is a dark and stormy night. You are driving in the car with your new fiance. All of a sudden you have a flat tire.";
			sMessage += " Do you change the tire yourself or do you both go to a nearby house?";
			sendMessage(sender, sMessage, true);
			oUsers[sender].fNext = fHouseOrSpare;
		}
	});
}

function receiveMessage(req, res){
	var message_instances = req.body.entry[0].messaging;
	message_instances.forEach(function(instance){
		var sender = instance.sender.id;
		if(!oUsers.hasOwnProperty(sender)){
			oUsers[sender] = {"fNext":fBeginning};
		}
		oUsers[sender].fNext(req, res);
	});
  res.sendStatus(200);
}

function sendMessage(receiver, data, isText){
	var payload = {};
	payload = data;
	
	if(isText) {
		payload = {
			text: data
		}
	}

	request({
    url: conf.FB_MESSAGE_URL,
    method: 'POST',
    qs: {
    	access_token: conf.PROFILE_TOKEN
    },
    json: {
      recipient: {id: receiver},
      message: payload
    }
  }, function (error, response) {
  	if(error) console.log('Error sending message: ', error);
  	if(response.body.error) console.log('Error: ', response.body.error);
  });
}

var port = conf.PORT;
httpServer.listen(port, function () {
	console.log("Express http server listening on port " + port);
});