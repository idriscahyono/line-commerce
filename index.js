const line = require("@line/bot-sdk");
const express = require("express");
const axios = require("axios");
const cp = require('child_process');
const fs = require('fs');
const path = require("path");
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || defaultAccessToken,
  channelSecret: process.env.CHANNEL_SECRET || defaultSecret
};

const client = new line.Client(config);
const app = express();
let baseURL = process.env.BASE_URL;
console.log(baseURL)
let RajaOngkir = require("rajaongkir-nodejs").Starter(process.env.RAJA_ONGKIR);

app.use('/downloaded', express.static('downloaded'));
app.get("/", function (req, res) {
  RajaOngkir.getCities()
    .then(function (result) {
      res.send(result);
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.post("/webhook", line.middleware(config), function (req, res) {
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }
  Promise.all(req.body.events.map(produk.handleEvent))
    .then(result => res.json(result))
    .catch(err => {
      console.error(err);
      res.status(500).end();
    });
});

var produk = (module.exports = {
  handleEvent: async function (event) {
    console.log(event);
    try {
      await produk.handleUser(event);
      switch (event.type) {
        case 'message':
          const message = event.message;
          switch (message.type) {
            case 'text':
              let echo = await produk.handleMessage(event);
              return client.replyMessage(event.replyToken, echo);
            case 'image':
              var userState = await axios.get(
                `https://backend-skripsi.herokuapp.com/userline/${event.source.userId}`
              );
              var userAdmin = await axios.get(`https://backend-skripsi.herokuapp.com/userline/data`);
              var itemState = userState.data[0];
              var itemAdmin = userAdmin.data[0];
              if (itemState.state == 'addToCart' || itemState.state == 'viewCart') {
                let echoImage = await produk.handleImage(message, event.replyToken, event);
                let sendImage = await produk.sendImage(message, event.replyToken, event);
                if (itemAdmin.isAdmin == true) {
                  let echoMessageId = {
                    type: 'text',
                    text: 'Bukti Pesanan: ' + message.id
                  };
                  let reply = await client.replyMessage(event.replyToken, echoImage);
                  let cartData = await produk.handleShowCartAdmin(event);
                  return client.pushMessage(itemAdmin.userId, [echoMessageId, sendImage, cartData]);
                } else {
                  return client.replyMessage(event.replyToken, echoImage);
                }
              } else {
                let echofail = {
                  type: 'text',
                  text: 'Upload Bukti Pembayaran Pada Menu Lihat Pesanan'
                };
                return client.replyMessage(event.replyToken, echofail);
              }
              default:
                throw new Error(`Unkown Message: ${JSON.stringify(message)}`);
          }
          break;
        case 'postback':
          let echoPostback = await produk.handlePostback(event);
          break;
        default:
          console.log(event);
          break;
      }
    } catch (err) {
      console.log(err);
    }
  },

  handleUser: async function (event) {
    //mengambil data user line
    let userInfo = await produk.getUserInfo(event.source.userId);
    const userId = userInfo.userId;
    const username = userInfo.displayName;
    //mengambil data user dari db userLine
    let userExist = await axios.get(`https://backend-skripsi.herokuapp.com/userline/${userId}`);
    console.log('get data db userLine', userExist.data);

    let setAdmin = await axios.get('https://backend-skripsi.herokuapp.com/userline/data');
    if (setAdmin.data.length == 0) {
      var isAdmin = true;
    } else {
      var isAdmin = false;
    }

    //jika data user kosong, data akan ditambahkan ke db userLine
    if (userExist.data.length == 0) {
      let createUser = await axios.post('https://backend-skripsi.herokuapp.com/userline', {
        userId,
        username,
        isAdmin
      });
      console.log('post data db userLine', createUser.status);
    } else {
      console.log('Data ' + userId + ' ada');
    }
  },
  getUserInfo: async function (userId) {
    try {
      //mengambil data user line
      let userInfo = client.getProfile(userId);
      return userInfo;
    } catch (err) {
      console.log(err);
    }
  },
  updateState: async function (state, userId) {
    try {
      //update state pada db userLine
      let updateState = await axios.put(`https://backend-skripsi.herokuapp.com/userline/${userId}`, {
        state: state
      });
      let userInfo = await axios.get(`https://backend-skripsi.herokuapp.com/userline/${userId}`);
      for (item of userInfo.data) {
        console.log('state saat ini-> ' + item.state);
      }
    } catch (err) {
      console.log(err);
    }
  },

  handleMessage: async function (event) {
    let echo = '';
    switch (event.message.text) {
      case 'menu':
        await produk.updateState('menu', event.source.userId);
        echo = await produk.handleMenu(event);
        return echo;
        break;

      case 'hai':
        await produk.updateState('hai', event.source.userId);
        echo = await produk.handleMenu(event);
        return echo;
        break;

      default:
        await produk.updateState('menu', event.source.userId);
        echo = await produk.handleMenu(event);
        return echo;
        break;
    }
  },
  handleMenu: async function (event) {
    let produkData = await axios.get('https://backend-skripsi.herokuapp.com/produk');

    const echo = {
      type: 'flex',
      altText: 'Daftar Menu',
      contents: {
        type: 'carousel',
        contents: []
      },
      quickReply: {
        items: [{
          type: 'action',
          action: {
            type: 'postback',
            label: 'Lihat Pesanan',
            data: 'viewCart'
          }
        }]
      }
    };
    let contentToAdd = [];
    for (item of produkData.data) {
      let soko = {
        type: 'bubble',
        hero: {
          type: 'image',
          size: 'full',
          aspectRatio: '20:13',
          aspectMode: 'cover',
          url: item.image_url
        },
        body: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [{
              type: 'text',
              text: item.nama,
              wrap: true,
              weight: 'bold',
              size: 'xl'
            },
            {
              type: 'box',
              layout: 'baseline',
              flex: 1,
              contents: [{
                type: 'text',
                text: 'Rp.' + item.harga.toString(),
                wrap: true,
                size: 'sm',
                flex: 0
              }]
            },
            {
              type: 'text',
              text: 'Stock: ' + item.stock.toString(),
              flex: 0,
              margin: 'md',
              size: 'sm',
              color: '#AAAAAA',
              wrap: true
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [{
            type: 'button',
            style: 'primary',
            action: {
              type: 'postback',
              label: 'Add to Cart',
              data: 'addToCart_' + item._id
            }
          }]
        }
      };
      contentToAdd.push(soko);
    }
    echo.contents.contents = contentToAdd;
    return echo;
  },

  handleAddToCart: async function (event, query) {
    try {
      let dataProduk = await axios.get(`https://backend-skripsi.herokuapp.com/produk/${query}`);
      let createPesanan = await axios.post('https://backend-skripsi.herokuapp.com/pesanan', {
        userId: event.source.userId,
        nama: dataProduk.data.nama,
        harga: dataProduk.data.harga,
        userBayar: false,
        adminBayar: false
      });
      let echo = await produk.handleShowCart(event);
      return echo;
    } catch (err) {
      console.log(err);
    }
  },
  handleShowCart: async function (event) {
    let listPesanan = await axios.get(`https://backend-skripsi.herokuapp.com/pesanan/${event.source.userId}`);
    let jp = listPesanan.data.length;
    let echo = {
      type: 'flex',
      altText: 'Daftar Pesanan',
      contents: {
        type: 'bubble',
        styles: {
          footer: {
            separator: true
          }
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [{
              type: 'text',
              text: 'PESANAN',
              weight: 'bold',
              color: '#12722c',
              size: 'sm'
            },
            {
              type: 'text',
              text: 'Juwalan',
              weight: 'bold',
              size: 'xxl',
              margin: 'md'
            },
            {
              type: 'text',
              text: 'Yogyakarta',
              size: 'xs',
              color: '#848484',
              wrap: true
            },
            {
              type: 'separator',
              margin: 'xxl'
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'xxl',
              spacing: 'xl',
              contents: []
            }
          ]
        }
      },
      quickReply: {
        items: [{
            type: 'action',
            action: {
              type: 'message',
              label: 'Lihat Menu',
              text: 'menu'
            }
          },
          {
            type: 'action',
            action: {
              type: 'postback',
              label: 'Hapus Pesanan',
              data: 'emptyCart'
            }
          },
          {
            type: 'action',
            action: {
              type: 'cameraRoll',
              label: 'UploadPembayaran'
            }
          }
        ]
      }
    };
    let totalHarga = 0;
    for (item of listPesanan.data) {
      let itemList = {
        type: 'box',
        layout: 'horizontal',
        contents: [{
            type: 'text',
            text: item.nama,
            size: 'sm',
            color: '#2f2f2f',
            flex: 0
          },
          {
            type: 'text',
            text: 'Rp.' + item.harga.toString(),
            size: 'sm',
            color: '#000000',
            align: 'end'
          }
        ]
      };
      totalHarga += item.harga;
      echo.contents.body.contents[4].contents.push(itemList);
    }
    let separator = {
      type: 'separator',
      margin: 'xxl'
    };

    let jumlahPesanan = {
      type: 'box',
      layout: 'horizontal',
      margin: 'xxl',
      contents: [{
          type: 'text',
          text: 'ITEMS',
          size: 'sm',
          color: '#3c3c3c'
        },
        {
          type: 'text',
          text: jp.toString(),
          size: 'sm',
          color: '#000000',
          align: 'end'
        }
      ]
    };
    let total = {
      type: 'box',
      layout: 'horizontal',
      contents: [{
          type: 'text',
          text: 'TOTAL',
          size: 'sm',
          color: '#3c3c3c'
        },
        {
          type: 'text',
          text: 'Rp.' + totalHarga.toString(),
          size: 'sm',
          color: '#000000',
          align: 'end'
        }
      ]
    };
    echo.contents.body.contents[4].contents.push(separator);
    echo.contents.body.contents[4].contents.push(jumlahPesanan);
    echo.contents.body.contents[4].contents.push(total);
    return echo;
  },
  handleEmptyCart: async function (event, query) {
    try {
      let deleteAll = await axios.delete(`https://backend-skripsi.herokuapp.com/pesanan/${event.source.userId}`);
      let echo = {
        type: 'text',
        text: 'Pesanan Berhasil Dihapus',
        quickReply: {
          items: [{
              type: 'action',
              action: {
                type: 'message',
                label: 'Lihat Menu',
                text: 'menu'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: 'Lihat Pesanan',
                data: 'viewCart'
              }
            }
          ]
        }
      };
      return echo;
    } catch (err) {
      console.log(err);
    }
  },

  handleShowCartAdmin: async function (event) {
    let listPesanan = await axios.get(`https://backend-skripsi.herokuapp.com/pesanan/admin/${event.message.id}`);
    console.log(listPesanan.data);
    let jp = listPesanan.data.length;
    let userInfo = await produk.getUserInfo(listPesanan.data[0].userId);
    let echo = {
      type: 'flex',
      altText: 'Pesanan Baru Min',
      contents: {
        type: 'bubble',
        styles: {
          footer: {
            separator: true
          }
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [{
              type: 'text',
              text: 'Kode Pesanan: ' + event.message.id,
              weight: 'bold',
              color: '#0a3e18',
              size: 'sm'
            },
            {
              type: 'text',
              text: userInfo.displayName,
              weight: 'bold',
              size: 'xxl',
              margin: 'md'
            },
            {
              type: 'separator',
              margin: 'xxl'
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'xxl',
              spacing: 'sm',
              contents: []
            }
          ]
        }
      },
      quickReply: {
        items: [{
          type: 'action',
          action: {
            type: 'message',
            label: 'Lihat Menu',
            text: 'menu'
          }
        }]
      }
    };
    let totalHarga = 0;
    for (item of listPesanan.data) {
      let itemList = {
        type: 'box',
        layout: 'horizontal',
        contents: [{
            type: 'text',
            text: item.nama,
            size: 'sm',
            color: '#2f2f2f',
            flex: 0
          },
          {
            type: 'text',
            text: 'Rp' + item.harga.toString(),
            size: 'sm',
            color: '#000000',
            align: 'end'
          }
        ]
      };
      totalHarga += item.harga;
      echo.contents.body.contents[3].contents.push(itemList);
    }
    let separator = {
      type: 'separator',
      margin: 'xxl'
    };

    let jumlahPesanan = {
      type: 'box',
      layout: 'horizontal',
      margin: 'xxl',
      contents: [{
          type: 'text',
          text: 'ITEMS',
          size: 'sm',
          color: '#3c3c3c'
        },
        {
          type: 'text',
          text: jp.toString(),
          size: 'sm',
          color: '#000000',
          align: 'end'
        }
      ]
    };
    let total = {
      type: 'box',
      layout: 'horizontal',
      contents: [{
          type: 'text',
          text: 'TOTAL',
          size: 'sm',
          color: '#3c3c3c'
        },
        {
          type: 'text',
          text: totalHarga.toString(),
          size: 'sm',
          color: '#000000',
          align: 'end'
        }
      ]
    };
    let approveButton = {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [{
        type: 'button',
        style: 'primary',
        action: {
          type: 'postback',
          label: 'Approve payment',
          data: 'approvePayment_' + event.message.id
        }
      }]
    };
    echo.contents.body.contents[3].contents.push(separator);
    echo.contents.body.contents[3].contents.push(jumlahPesanan);
    echo.contents.body.contents[3].contents.push(total);
    echo.contents.body.contents[3].contents.push(approveButton);
    return echo;
  },

  downloadContent: async function (messageId, downloadPath) {
    return client.getMessageContent(messageId).then(
      (stream) =>
      new Promise((resolve, reject) => {
        const writable = fs.createWriteStream(downloadPath);
        stream.pipe(writable);
        stream.on('end', () => resolve(downloadPath));
        stream.on('error', reject);
      })
    );
  },

  sendImage: async function (message, replyToken, event) {
    let getContent;
    if (message.contentProvider.type === 'line') {
      const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.jpg`);
      const previewPath = path.join(__dirname, 'downloaded', `${message.id}-preview.jpg`);

      getContent = produk.downloadContent(message.id, downloadPath).then((downloadPath) => {
        cp.execSync(`convert -resize 240x jpeg:${downloadPath} jpeg:${previewPath}`);

        return {
          originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
          previewImageUrl: baseURL + '/downloaded/' + path.basename(previewPath)
        };
      });
    } else if (message.contentProvider.type === 'external') {
      getContent = Promise.resolve(message.contentProvider);
    }

    return getContent.then(({
      originalContentUrl,
      previewImageUrl
    }) => {
      let echo = {
        type: 'image',
        originalContentUrl,
        previewImageUrl
      };
      return echo;
    });
  },

  handleImage: async function (message, replyToken, event) {
    await produk.updateState('paymentProof', event.source.id);
    let updatePesanan = await axios.put(
      `https://backend-skripsi.herokuapp.com/pesanan/byuserid/${event.source.userId}`, {
        userBayar: true,
        nomorBayar: message.id
      }
    );
    let echo = {
      type: 'text',
      text: 'Terimakasih Telah Upload Bukti Pembayaran, Nomor Pembayaran:' +
        message.id +
        'Pembayaran & Pesanan Anda Sedang Diperiksa Oleh Admin',
      quickReply: {
        items: [{
          type: 'action',
          action: {
            type: 'message',
            label: 'Lihat Menu',
            text: 'menu'
          }
        }]
      }
    };
    return echo;
  },

  handleApprovePayment: async function (event, query) {
    let updatePesanan = await axios.put(`https://backend-skripsi.herokuapp.com/pesanan/${query}`, {
      adminBayar: true
    });
    let userToNotify = await axios.get(`https://backend-skripsi.herokuapp.com/pesanan/bynomorbayar/${query}`);
    let userAdminToNotify = await axios.get(`https://backend-skripsi.herokuapp.com/userline/data`);
    let idToNotify = userToNotify.data[0].userId;
    let idAdminToNoify = userAdminToNotify.data[0].userId;
    let echo = {
      type: 'text',
      text: 'Pesanan dengan nomor ' + query + 'telah diverifikasi oleh admin',
      quickReply: {
        items: [{
          type: 'action',
          action: {
            type: 'message',
            label: 'Lihat Menu',
            text: 'menu'
          }
        }]
      }
    };
    return client.multicast([idToNotify, idAdminToNoify], echo);
  },

  handlePostback: async function (event) {
    let postbackData = event.postback.data.split('_', 2);
    let mode = postbackData[0];
    let query = postbackData[1];
    console.log(mode);
    console.log(query);
    let echo = '';
    switch (mode) {
      case 'addToCart':
        await produk.updateState(mode, event.source.userId);
        echo = await produk.handleAddToCart(event, query);
        return client.replyMessage(event.replyToken, echo);
        break;
      case 'viewCart':
        await produk.updateState(mode, event.source.userId);
        echo = await produk.handleShowCart(event, query);
        return client.replyMessage(event.replyToken, echo);
        break;
      case 'emptyCart':
        await produk.updateState(mode, event.source.userId);
        echo = await produk.handleEmptyCart(event, query);
        return client.replyMessage(event.replyToken, echo);
        break;
      case 'approvePayment':
        await produk.updateState(mode, event.source.userId);
        return produk.handleApprovePayment(event, query);
        break;
      case 'checkOut':
        await produk.updateState(mode, event.source.userId);
        break;
      case 'paymentProof':
        await produk.updateState(mode, event.source.userId);
        break;
    }
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});