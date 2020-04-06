const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios')
const url = require("url");
const RajaOngkir = require('rajaongkir-nodejs').Starter('79640cf487715ef8fa59f81cf2aaadc3')
const path = require('path')
const defaultAccessToken = 'Upq28CGaamhChqJ9l/+F1EU3TccKCzsTMhbRP7/EqXch4nQgqsALQtdUmwA0h0DcwMk79lXWBxui3A8keQXADD1IT7XWuLF1QnEzjYwhADZu7CspRiNfJ7LWxcViJCXIbytMSNqfAkGO4U1mIJkG1gdB04t89/1O/w1cDnyilFU=';
const defaultSecret = 'c9c27ba18352f53ef13f2430c3d7b9db';
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || defaultAccessToken,
    channelSecret: process.env.CHANNEL_SECRET || defaultSecret,
};

const client = new line.Client(config);
const app = express();

app.get("/", function (req, res) {
    RajaOngkir.getCities().then(function (result) {
        res.send(result)
    }).catch(function (error) {
        console.log(error)
    });
});

app.post("/webhook", line.middleware(config), function (req, res) {
    if (!Array.isArray(req.body.events)) {
        return res.status(500).end();
    }
    Promise
        .all(req.body.events.map(produk.handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});

var produk = (module.exports = {
    handleEvent: async function (event) {
        try {
            await produk.handleUser(event)
            switch (event.type) {
                case "message":
                    const message = event.message
                    switch (message.type) {
                        case "text":
                            let echo = await produk.handleMessage(event)
                            return client.replyMessage(event.replyToken, echo)
                        case "image":
                            var userState = await userLine.findOne({
                                userId: event.source.userId
                            })
                            if (userState.state == "addToCart" || userLine.State == "viewCart") {
                                let echoImage = await produk.handleImage(
                                    message,
                                    event.replyToken,
                                    event
                                )
                                if (userState.isAdmin == true) {
                                    let reply = await client.replyMessage(
                                        event.replyToken,
                                        echoImage
                                    )
                                    let cartData = await produk.handleShowCartAdmin(event)
                                    return client.pushMessage(userState.userId, cartData)
                                } else {
                                    return client.replyMessage(
                                        event.replyToken,
                                        echoImage
                                    )
                                }
                            } else {
                                let echofail = {
                                    type: "text",
                                    text: "Upload Bukti Pembayaran Pada Menu Lihat Pesanan"
                                }
                                return client.replyMessage(event.replyToken, echofail)
                            }
                            default:
                                throw new Error(`Unkown Message: ${JSON.stringify(message)}`)
                    }
                    break
                case "postback":
                    let echoPostback = await produk.handlePostback(event)
                    break
                default:
                    console.log(event)
                    break
            }
        } catch (err) {
            console.log(err)
        }
    },
    handleUser: async function (event) {
        //mengambil data user line
        let userInfo = await produk.getUserInfo(event.source.userId)
        const userId = userInfo.userId
        const username = userInfo.displayName
        //mengambil data user dari db userLine
        let userExist = await axios.get(`https://backend-skripsi.herokuapp.com/userline/${userId}`)
        console.log('get data db userLine', userExist.data)
        //jika data user kosong, data akan ditambahkan ke db userLine
        if ((userExist.data).length == 0) {
            let createUser = await axios.post('https://backend-skripsi.herokuapp.com/userline', {
                userId,
                username
            })
            console.log('post data db userLine', createUser.status)
        } else {
            console.log("Data " + userId + " ada")
        }
    },
    getUserInfo: async function (userId) {
        try {
            //mengambil data user line
            let userInfo = client.getProfile(userId)
            return userInfo
        } catch (err) {
            console.log(err)
        }
    },

    handleImage: async function (message, replyToken, event) {
        const downloadPath = path.join(__dirname, "downloaded", `${message.id}.jpg`)
        await produk.updateState("paymentProof", event.source.id)
        let uploadData = await produk.downloadContent(messageId, downloadPath)
        let updatePesanan = await axios.put(`https://backend-skripsi.herokuapp.com/pesanan/${event.source.userId}`, {
            userId: event.source.userId,
            userBayar: false
        }, {
            userBayar: true,
            nomorBayar: message.id
        })
        let echo = {
            type: "text",
            text: "Terimakasih Telah Upload Bukti Pembayaran, Nomor Pembayaran:" + message.id +
                "Pembayaran & Pesanan Anda Sedang Diperiksa Oleh Admin",
            quickReply: {
                items: [{
                    type: "action",
                    action: {
                        type: "message",
                        label: "Lihat Menu",
                        text: "menu"
                    }
                }]
            }
        }
        return echo
    },
    downloadContent: async function (messageId, downloadPath) {
        return client.getMessageContent(messageId).then(
            stream =>
            new Promise((resolve, reject) => {
                var streamCloudinary = cloudinary.v2.uploader.upload_stream({
                        public_id: "produk_data/" + messageId
                    },
                    function (eror, result) {
                        if (!eror) {
                            resolve(result)
                        }
                    }
                )
                stream.pipe(streamCloudinary)
                stream.on("error", reject)
            })
        )
    },

    updateState: async function (state, userId) {
        try {
            //update state pada db userLine
            let updateState = await axios.put(`https://backend-skripsi.herokuapp.com/userline/${userId}`, {
                state: state
            })
            let userInfo = await axios.get(`https://backend-skripsi.herokuapp.com/userline/${userId}`)
            for (item of userInfo.data) {
                console.log("state saat ini-> " + item.state)
            }

        } catch (err) {
            console.log(err)
        }
    },
    handleMessage: async function (event) {
        let echo = ""
        switch (event.message.text) {
            case "menu":
                await produk.updateState("menu", event.source.userId)
                echo = await produk.handleMenu(event)
                return echo
                break

            default:
                await produk.updateState("menu", event.source.userId)
                echo = await produk.handleMenu(event)
                return echo
                break
        }
    },
    handleMenu: async function (event) {
        let produkData = await axios.get('https://backend-skripsi.herokuapp.com/produk')
        const echo = {
            type: 'template',
            altText: 'Daftar Menu',
            template: {
                type: 'carousel',
                columns: [],
                imageAspectRatio: 'rectangle',
                'imageSize': 'cover'
            }
            // ,
            // quickReply: {
            //     items: [{
            //         type: "action",
            //         action: {
            //             type: "postback",
            //             label: "Lihat Pesanan",
            //             data: "action=viewCart"
            //         }
            //     }]
            // }
        }
        let contentToAdd = [];
        for (item of produkData.data) {
            let soko = {
                thumbnailImageUrl: item.image_url,
                imageBackgroundColor: '#FFFFFF',
                title: item.nama,
                text: item.harga.toString(),
                actions: [{
                    type: 'postback',
                    label: 'Add To Cart',
                    data: 'action=addToCart&idMenu=' + item._id
                }]
            }
            contentToAdd.push(soko)
        }
        echo.template.columns = contentToAdd
        return echo
    },
    handleAddToCart: async function (event, query) {
        try {
            await produk.updateState("addToCart", event.source.userId)
            let dataProduk = await axios.get(`https://backend-skripsi.herokuapp.com/pesanan/${query.idMenu}`)
            let createPesanan = await axios.post('https://backend-skripsi.herokuapp.com/pesanan', {
                userId: event.source.userId,
                nama: produk.nama,
                harga: produk.harga,
                userBayar: false,
                adminBayar: false
            })
            let echo = await produk.handleShowCart(event)
            return echo
        } catch (err) {
            console.log(err)
        }
    },
    handleApprovePayment: async function (event, query) {
        let updatePesanan = await axios.put(`https://backend-skripsi.herokuapp.com/pesanan/${query.idPesanan}`, {
            nomorBayar: query.idPesanan
        }, {
            adminBayar: true
        })

        let userToNotify = await axios.get(`https://backend-skripsi.herokuapp.com/pesanan/${query.idPesanan}`, {
            nomorBayar: query.idPesanan
        })
        let idToNotify = userToNotify.userId
        let echo = {
            type: "text",
            text: "Pesanan dengan nomor " + query.idPesanan + "telah diverifikasi oleh admin",
            quickReply: {
                items: [{
                    type: "action",
                    action: {
                        type: "message",
                        label: "Lihat Menu",
                        text: "menu"
                    }
                }]
            }
        }
        return client.pushMessage(idToNotify, echo)
    },
    handleEmptyCart: async function (event, query) {
        try {
            let deleteAll = await axios.delete('https://backend-skripsi.herokuapp.com/pesanan', {
                userId: event.source.userId,
                userBayar: false
            })
            let echo = {
                type: "text",
                text: "Pesanan Berhasil Dihapus",
                quickReply: {
                    items: [{
                            type: "action",
                            action: {
                                type: "message",
                                label: "Lihat Menu",
                                text: "Menu"
                            },
                        },
                        {
                            type: "action",
                            action: {
                                type: "postback",
                                label: "Lihat Pesanan",
                                data: "action=viewCart"
                            }
                        }
                    ]
                }
            }
            return echo
        } catch (err) {
            console.log(err)
        }
    },
    handleShowCartAdmin: async function (event) {
        let listPesanan = await axios.get('https://backend-skripsi.herokuapp.com/pesanan', {
            userBayar: true,
            adminBayar: false,
            nomorBayar: event.message.id
        })

        let jp = listPesanan.length
        let userInfo = await produk.getUserInfo(listPesanan[0].userId)
        let echo = {
            type: "flex",
            altText: "Pesanan Baru Min",
            contents: {
                type: "bubble",
                styles: {
                    footer: {
                        separator: true
                    }
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [{
                            type: "text",
                            text: "Kode Pesanan" + event.message.id,
                            weight: "bold",
                            color: "#0a3e18",
                            size: "sm"
                        },
                        {
                            type: "text",
                            text: userInfo.displayName,
                            weight: "bold",
                            size: "xxl",
                            margin: "md"
                        },
                        {
                            type: "separator",
                            margin: "xxl"
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            margin: "xxl",
                            spacing: "sm",
                            contents: []
                        }
                    ]
                }
            },
            quickReply: {
                items: [{
                    type: "action",
                    action: {
                        type: "message",
                        label: "Lihat Menu",
                        text: "menu"
                    }
                }]
            }
        }
        let totalHarga = 0;
        for (item of listPesanan) {
            let itemList = {
                type: "box",
                layout: "horizontal",
                contents: [{
                        type: "text",
                        text: item.nama,
                        size: "sm",
                        color: "#2f2f2f",
                        flex: 0
                    },
                    {
                        type: "text",
                        text: "Rp" + item.harga.toString(),
                        size: "sm",
                        color: "#000000",
                        align: "end"
                    }
                ]
            }
            totalHarga += item.harga
            echo.contents.body.contents[4].contents.push(itemList)
        }
        let separator = {
            type: "separator",
            margin: "xxl"
        }

        let jumlahPesanan = {
            type: "box",
            layout: "horizontal",
            margin: "xxl",
            contents: [{
                    type: "text",
                    text: "ITEMS",
                    size: "sm",
                    color: "#3c3c3c"
                },
                {
                    type: "text",
                    text: jp.toString(),
                    size: "sm",
                    color: "#000000",
                    align: "end"
                }
            ]
        }
        let total = {
            type: "box",
            layout: "horizontal",
            contents: [{
                    type: "text",
                    text: "TOTAL",
                    size: "sm",
                    color: "#3c3c3c"
                },
                {
                    type: "text",
                    text: totalHarga.toString(),
                    size: "sm",
                    color: "#000000",
                    align: "end"
                }
            ]
        }
        let approveButton = {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [{
                type: "button",
                style: "primary",
                action: {
                    type: "postback",
                    label: "Approve payment",
                    data: "action=approvePayment&idPesanan=" + event.message.id
                }
            }]
        }
        echo.contents.body.contents[3].contents.push(separator)
        echo.contents.body.contents[3].contents.push(jumlahPesanan)
        echo.contents.body.contents[3].contents.push(total)
        echo.contents.body.contents[3].contents.push(approveButton)
        return echo
    },
    handleShowCart: async function (event) {
        let listPesanan = await axios.get('https://backend-skripsi.herokuapp.com/pesanan', {
            userId: event.source.userId,
            userBayar: false,
            adminBayar: false
        })

        let jp = listPesanan.length
        let echo = {
            type: "flex",
            altText: "Daftar Pesanan",
            contents: {
                type: "bubble",
                styles: {
                    footer: {
                        separator: true
                    }
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [{
                            type: "text",
                            text: "PESANAN",
                            weight: "bold",
                            color: "#12722c",
                            size: "sm"
                        },
                        {
                            type: "text",
                            text: "Juwalan",
                            weight: "bold",
                            size: "xxl",
                            margin: "md"
                        },
                        {
                            type: "text",
                            text: "Yogyakarta",
                            size: "xs",
                            color: "#848484",
                            wrap: true
                        },
                        {
                            type: "separator",
                            margin: "xxl"
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            margin: "xxl",
                            spacing: "xl",
                            contents: []
                        }
                    ]
                }
            },
            quickReply: {
                items: [{
                        type: "action",
                        action: {
                            type: "message",
                            label: "Lihat Menu",
                            text: "meni"
                        }
                    },
                    {
                        type: "action",
                        action: {
                            type: "postback",
                            label: "Hapus Pesanan",
                            data: "action=emptyCart"
                        }
                    },
                    {
                        type: "action",
                        action: {
                            type: "cameraRoll",
                            label: "Upload Pembayaran"
                        }
                    }
                ]
            }
        }
        let totalHarga = 0;
        for (item of listPesanan) {
            let itemList = {
                type: "box",
                layout: "horizontal",
                contents: [{
                        type: "text",
                        text: item.nama,
                        size: "sm",
                        color: "#2f2f2f",
                        flex: 0
                    },
                    {
                        type: "text",
                        text: "Rp" + item.harga.toString(),
                        size: "sm",
                        color: "#000000",
                        align: "end"
                    }
                ]
            }
            totalHarga += item.harga
            echo.contents.body.contents[4].contents.push(itemList)
        }
        let separator = {
            type: "separator",
            margin: "xxl"
        }

        let jumlahPesanan = {
            type: "box",
            layout: "horizontal",
            margin: "xxl",
            contents: [{
                    type: "text",
                    text: "ITEMS",
                    size: "sm",
                    color: "#3c3c3c"
                },
                {
                    type: "text",
                    text: jp.toString(),
                    size: "sm",
                    color: "#000000",
                    align: "end"
                }
            ]
        }
        let total = {
            type: "box",
            layout: "horizontal",
            contents: [{
                    type: "text",
                    text: "TOTAL",
                    size: "sm",
                    color: "#3c3c3c"
                },
                {
                    type: "text",
                    text: totalHarga.toString(),
                    size: "sm",
                    color: "#000000",
                    align: "end"
                }
            ]
        }
        echo.contents.body.contents[4].contents.push(separator)
        echo.contents.body.contents[4].contents.push(jumlahPesanan)
        echo.contents.body.contents[4].contents.push(total)
        return echo
    },

    handlePostback: async function (event) {
        var url_parts = url.parse("?", +event.postback.data, true)
        var query = url_parts.query
        let echo = ""
        switch (query.action) {
            case "addToCart":
                echo = await produk.handleAddToCart(event, query)
                return client.replyMessage(event.replyToken, echo)
                break
            case "viewCart":
                await produk.updateState("viewCart", event.source.userId)
                echo = await produk.handleShowCart(event, query)
                return client.replyMessage(event.replyToken, echo)
                break
            case "approvePayment":
                await martabak.updateState(query.action, event.source.userId)
                return martabak.handleApprovePayment(event, query)
                break
            case "checkOut":
                await martabak.updateState(query.action, event.source.userId)
                break
            case "paymentProof":
                await martabak.updateState(query.action, event.source.userId)
                break
            case "emptyCart":
                await martabak.updateState(query.action, event.source.userId)
                echo = martabak.handleEmptyCart(event, query)
                return echo;
                break
            default:
                break

        }
    },
})

// const replyText = (token, texts) => {
//     texts = Array.isArray(texts) ? texts : [texts];
//     return client.replyMessage(
//         token,
//         texts.map((text) => ({
//             type: 'text',
//             text
//         }))
//     );
// };

// function handleEvent(event) {

//     console.log(event);
//     var userId = event.source.userId;
//     var replyToken = event.replyToken;
//     if (!userId) {
//         return menu.sendTextMessage(userId, replyToken, 'Eror : NO_USER_ID');
//     }
//     switch (event.type) {
//         case 'message':
//             const message = event.message;
//             switch (message.type) {
//                 case 'text':
//                     return handleText(message, event.replyToken, event.source);
//                 default:
//                     return menu.sendTextMessage(userId, replyToken, 'Masih Coba Gan')
//             }

//             case 'postback':
//                 let postbackData = event.postback.data.split("_", 2);
//                 let mode = postbackData[0];
//                 switch (mode) {
//                     case 'BUY':
//                         return client.replyMessage(
//                             replyToken, {
//                                 type: 'template',
//                                 altText: 'Recipe',
//                                 template: {
//                                     type: 'confirm',
//                                     text: 'Do it?',
//                                     actions: [{
//                                             label: 'Yes',
//                                             type: 'message',
//                                             text: 'Yes!'
//                                         },
//                                         {
//                                             label: 'No',
//                                             type: 'message',
//                                             text: 'No!'
//                                         },
//                                     ],
//                                 },
//                             }
//                         )
//                 }
//                 default:
//                     throw new Error(`Unknown event: ${JSON.stringify(event)}`);
//     }
// }

// function handleText(message, replyToken, source) {
//     switch (message.text) {
//         case 'profile':
//             if (source.userId) {
//                 return client.getProfile(source.userId)
//                     .then((profile) => replyText(
//                         replyToken,
//                         [
//                             `Display name: ${profile.displayName}`,
//                             `Status message: ${profile.statusMessage}`,
//                         ]
//                     ));
//             } else {
//                 return replyText(replyToken, 'Bot cant use profile API without user ID');
//             }
//             case 'list':
//                 return client.replyMessage(
//                     replyToken, {
//                         type: 'template',
//                         altText: 'List Menu',
//                         template: {
//                             type: 'image_carousel',
//                             columns: [{
//                                     imageUrl: 'https://toko.sentratani.com/image/cache/catalog/produk/Benih-Panah-Merah-Melon-Gracia-F1-500-Butir-500x500.png',
//                                     action: {
//                                         type: 'postback',
//                                         label: 'Buy',
//                                         data: 'action=buy&itemid=111'
//                                     }
//                                 },
//                                 {
//                                     imageUrl: 'https://toko.sentratani.com/image/cache/catalog/Benih%20Cabe%20Rawit%20Hibrida%20F1%20SONAR%20-10%20Gr-500x500.png',
//                                     action: {
//                                         type: 'postback',
//                                         label: 'Buy',
//                                         data: 'action=buy&itemid=111'
//                                     }
//                                 },
//                             ],
//                         },
//                     }
//                 )
//             case 'hai':
//                 return client.replyMessage(
//                     replyToken, {
//                         type: 'template',
//                         altText: 'Daftar Menu',
//                         template: {
//                             type: 'carousel',
//                             columns: [{
//                                     thumbnailImageUrl: 'https://toko.sentratani.com/image/cache/catalog/produk/Benih-Panah-Merah-Melon-Gracia-F1-500-Butir-500x500.png',
//                                     imageBackgroundColor: '#FFFFFF',
//                                     title: 'Benih Melon',
//                                     text: 'Berkualitas',
//                                     defaultAction: {
//                                         type: 'uri',
//                                         label: 'View detail',
//                                         uri: 'http://example.com/page/123'
//                                     },
//                                     actions: [{
//                                             type: 'postback',
//                                             label: 'Buy',
//                                             data: 'BUY'
//                                         },
//                                         {
//                                             type: 'postback',
//                                             label: 'Add to cart',
//                                             data: 'action=add&itemid=111'
//                                         },
//                                         {
//                                             type: 'uri',
//                                             label: 'View detail',
//                                             uri: 'http://example.com/page/111'
//                                         }
//                                     ]
//                                 },
//                                 {
//                                     thumbnailImageUrl: 'https://toko.sentratani.com/image/cache/catalog/Benih%20Cabe%20Rawit%20Hibrida%20F1%20SONAR%20-10%20Gr-500x500.png',
//                                     imageBackgroundColor: '#FFFFFF',
//                                     title: 'Benih Cabai',
//                                     text: 'Berkualitas',
//                                     defaultAction: {
//                                         type: 'uri',
//                                         label: 'View detail',
//                                         uri: 'http://example.com/page/123'
//                                     },
//                                     actions: [{
//                                             type: 'postback',
//                                             label: 'Buy',
//                                             data: 'BUY'
//                                         },
//                                         {
//                                             type: 'postback',
//                                             label: 'Add to cart',
//                                             data: 'action=add&itemid=111'
//                                         },
//                                         {
//                                             type: 'uri',
//                                             label: 'View detail',
//                                             uri: 'http://example.com/page/111'
//                                         }
//                                     ]
//                                 },
//                             ],
//                             imageAspectRatio: 'rectangle',
//                             'imageSize': 'cover'
//                         }
//                     }
//                 )

//             case 'menu':
//                 return client.replyMessage(
//                     replyToken, {
//                         type: 'carousel',
//                         contents: [{
//                             type: 'bubble',
//                             hero: {
//                                 type: 'image',
//                                 size: 'full',
//                                 aspectRatio: '20:13',
//                                 aspectMode: 'cover',
//                                 url: 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_5_carousel.png'
//                             },
//                             body: {
//                                 type: 'box',
//                                 layout: 'vertical',
//                                 spacing: 'sm',
//                                 contents: [{
//                                         type: 'text',
//                                         text: 'Arm Chair, White',
//                                         wrap: true,
//                                         weight: 'bold',
//                                         size: 'xl'
//                                     },
//                                     {
//                                         type: 'box',
//                                         layout: 'baseline',
//                                         contents: [{
//                                                 type: 'text',
//                                                 text: '$49',
//                                                 wrap: true,
//                                                 weight: 'bold',
//                                                 size: 'xl',
//                                                 flex: 0
//                                             },
//                                             {
//                                                 type: 'text',
//                                                 text: '.99',
//                                                 wrap: true,
//                                                 weight: 'bold',
//                                                 size: 'sm',
//                                                 flex: 0
//                                             }
//                                         ]
//                                     }
//                                 ]
//                             },
//                             footer: {
//                                 type: 'box',
//                                 layout: 'vertical',
//                                 spacing: 'sm',
//                                 contents: [{
//                                         type: 'button',
//                                         style: 'primary',
//                                         action: {
//                                             type: 'uri',
//                                             label: 'Add to Cart',
//                                             uri: 'https://linecorp.com'
//                                         }
//                                     },
//                                     {
//                                         type: 'button',
//                                         action: {
//                                             type: 'uri',
//                                             label: 'Add to wishlist',
//                                             uri: 'https://linecorp.com'
//                                         }
//                                     }
//                                 ]
//                             }
//                         }]
//                     }
//                 )
//             case 'datetime':
//                 return client.replyMessage(
//                     replyToken, {
//                         type: 'template',
//                         altText: 'Datetime pickers alt text',
//                         template: {
//                             type: 'buttons',
//                             text: 'Select date / time !',
//                             actions: [{
//                                     type: 'datetimepicker',
//                                     label: 'date',
//                                     data: 'DATE',
//                                     mode: 'date'
//                                 },
//                                 {
//                                     type: 'datetimepicker',
//                                     label: 'time',
//                                     data: 'TIME',
//                                     mode: 'time'
//                                 },
//                                 {
//                                     type: 'datetimepicker',
//                                     label: 'datetime',
//                                     data: 'DATETIME',
//                                     mode: 'datetime'
//                                 },
//                             ],
//                         },
//                     }
//                 );
//             case 'confirm':
//                 return client.replyMessage(
//                     replyToken, {
//                         type: 'template',
//                         altText: 'Confirm alt text',
//                         template: {
//                             type: 'confirm',
//                             text: 'Do it?',
//                             actions: [{
//                                     label: 'Yes',
//                                     type: 'message',
//                                     text: 'Yes!'
//                                 },
//                                 {
//                                     label: 'No',
//                                     type: 'message',
//                                     text: 'No!'
//                                 },
//                             ],
//                         },
//                     }
//                 )
//             default:
//                 console.log(`Echo message to ${replyToken}: ${message.text}`);
//                 return replyText(replyToken, message.text);
//     }
// }

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});