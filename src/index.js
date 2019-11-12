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
        return client.replyMessage(event.replyToken, {
            "type": "carousel",
            "contents": [{
                    "type": "bubble",
                    "hero": {
                        "type": "image",
                        "size": "full",
                        "aspectRatio": "20:13",
                        "aspectMode": "cover",
                        "url": "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_5_carousel.png"
                    },
                    "body": {
                        "type": "box",
                        "layout": "vertical",
                        "spacing": "sm",
                        "contents": [{
                                "type": "text",
                                "text": "Arm Chair, White",
                                "wrap": true,
                                "weight": "bold",
                                "size": "xl"
                            },
                            {
                                "type": "box",
                                "layout": "baseline",
                                "contents": [{
                                        "type": "text",
                                        "text": "$49",
                                        "wrap": true,
                                        "weight": "bold",
                                        "size": "xl",
                                        "flex": 0
                                    },
                                    {
                                        "type": "text",
                                        "text": ".99",
                                        "wrap": true,
                                        "weight": "bold",
                                        "size": "sm",
                                        "flex": 0
                                    }
                                ]
                            }
                        ]
                    },
                    "footer": {
                        "type": "box",
                        "layout": "vertical",
                        "spacing": "sm",
                        "contents": [{
                                "type": "button",
                                "style": "primary",
                                "action": {
                                    "type": "uri",
                                    "label": "Add to Cart",
                                    "uri": "https://linecorp.com"
                                }
                            },
                            {
                                "type": "button",
                                "action": {
                                    "type": "uri",
                                    "label": "Add to wishlist",
                                    "uri": "https://linecorp.com"
                                }
                            }
                        ]
                    }
                },
                {
                    "type": "bubble",
                    "hero": {
                        "type": "image",
                        "size": "full",
                        "aspectRatio": "20:13",
                        "aspectMode": "cover",
                        "url": "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_6_carousel.png"
                    },
                    "body": {
                        "type": "box",
                        "layout": "vertical",
                        "spacing": "sm",
                        "contents": [{
                                "type": "text",
                                "text": "Metal Desk Lamp",
                                "wrap": true,
                                "weight": "bold",
                                "size": "xl"
                            },
                            {
                                "type": "box",
                                "layout": "baseline",
                                "flex": 1,
                                "contents": [{
                                        "type": "text",
                                        "text": "$11",
                                        "wrap": true,
                                        "weight": "bold",
                                        "size": "xl",
                                        "flex": 0
                                    },
                                    {
                                        "type": "text",
                                        "text": ".99",
                                        "wrap": true,
                                        "weight": "bold",
                                        "size": "sm",
                                        "flex": 0
                                    }
                                ]
                            },
                            {
                                "type": "text",
                                "text": "Temporarily out of stock",
                                "wrap": true,
                                "size": "xxs",
                                "margin": "md",
                                "color": "#ff5551",
                                "flex": 0
                            }
                        ]
                    },
                    "footer": {
                        "type": "box",
                        "layout": "vertical",
                        "spacing": "sm",
                        "contents": [{
                                "type": "button",
                                "flex": 2,
                                "style": "primary",
                                "color": "#aaaaaa",
                                "action": {
                                    "type": "uri",
                                    "label": "Add to Cart",
                                    "uri": "https://linecorp.com"
                                }
                            },
                            {
                                "type": "button",
                                "action": {
                                    "type": "uri",
                                    "label": "Add to wish list",
                                    "uri": "https://linecorp.com"
                                }
                            }
                        ]
                    }
                },
                {
                    "type": "bubble",
                    "body": {
                        "type": "box",
                        "layout": "vertical",
                        "spacing": "sm",
                        "contents": [{
                            "type": "button",
                            "flex": 1,
                            "gravity": "center",
                            "action": {
                                "type": "uri",
                                "label": "See more",
                                "uri": "https://linecorp.com"
                            }
                        }]
                    }
                }
            ]
        });
    }
    const echo = {
        type: 'text',
        text: "Siapa Ya"
    };

    return client.replyMessage(event.replyToken, echo);
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});