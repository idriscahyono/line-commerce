'use strict'

const line = require('@line/bot-sdk');
const express = require('express');
const menu = require('./menu');

const defaultAccessToken = 'Upq28CGaamhChqJ9l/+F1EU3TccKCzsTMhbRP7/EqXch4nQgqsALQtdUmwA0h0DcwMk79lXWBxui3A8keQXADD1IT7XWuLF1QnEzjYwhADZu7CspRiNfJ7LWxcViJCXIbytMSNqfAkGO4U1mIJkG1gdB04t89/1O/w1cDnyilFU=';
const defaultSecret = 'c9c27ba18352f53ef13f2430c3d7b9db';

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || defaultAccessToken,
    channelSecret: process.env.CHANNEL_SECRET || defaultSecret,
};

const client = new line.Client(config);
const app = express();


app.get("/", function (req, res) {
    res.send("Hello Word");
});

app.post("/webhook", line.middleware(config), function (req, res) {
    if (!Array.isArray(req.body.events)) {
        return res.status(500).end();
    }
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});


function handleEvent(event) {

    console.log(event);
    var userId = event.source.userId;
    var replyToken = event.replyToken;
    if (!userId) {
        return menu.sendTextMessage(userId, replyToken, 'Eror : NO_USER_ID');
    }
    switch (event.type) {
        case 'message':
            const message = event.message;
            switch (message.type) {
                case 'text':
                    if (['Menu'].indexOf(message.text) > -1) {
                        return handleCommand(message, replyToken, event.source);
                    } else {
                        return menu.sendMenuMessage(userId, replyToken);
                    }
                    default:
                        return menu.sendTextMessage(userId, replyToken, 'Masih Coba Gan')
            }
            case 'follow':
                return menu.sendMenuMessage(userId, replyToken);
    }
    // if (event.message.text == "hai") {
    //     const echo = {
    //         type: 'text',
    //         text: "Halo"
    //     };
    //     return client.replyMessage(event.replyToken, echo);
    // }

    // if (event.message.text == "mana") {
    //     const echo = {
    //         type: 'bubble',
    //         body: {
    //             type: 'box',
    //             layout: 'horizontal',
    //             contents: [{
    //                     type: 'text',
    //                     text: 'Hello,'
    //                 },
    //                 {
    //                     type: 'text',
    //                     text: 'World!'
    //                 }
    //             ]
    //         }
    //     };
    //     return client.replyMessage(event.replyToken, echo);
    // }

    // if (event.message.text == "menu") {
    //     return client.replyMessage(event.replyToken, JSON.stringify({
    //         "type": "bubble",
    //         "body": {
    //             "type": "box",
    //             "layout": "horizontal",
    //             "contents": [{
    //                     "type": "text",
    //                     "text": "Hello,"
    //                 },
    //                 {
    //                     "type": "text",
    //                     "text": "World!"
    //                 }
    //             ]
    //         }
    //     }))
    // }


    // const echo = {
    //     type: 'text',
    //     text: "Siapa Ya?"
    // };
    // return client.replyMessage(event.replyToken, echo);
}

function handleCommand(message, replyToken, source) {
    switch (message.text) {
        case 'Menu':
            return menu.sendMenuMessage(source.userId, replyToken);
        default:
            return;
    }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});