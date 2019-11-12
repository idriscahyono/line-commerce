'use strict'

const line = require('@line/bot-sdk');
const express = require('express');

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
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});


function handleEvent(event) {
    if (event.message.text == "hai") {
        const echo = {
            type: 'text',
            text: "Halo"
        };
        return client.replyMessage(event.replyToken, echo);
    }
    const echo = {
        type: 'text',
        text: "Siapa Ya?"
    };
    return client.replyMessage(event.replyToken, echo);
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});