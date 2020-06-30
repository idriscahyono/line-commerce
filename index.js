const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const config = {
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || defaultAccessToken,
	channelSecret: process.env.CHANNEL_SECRET || defaultSecret
};

const geocodingClient = mbxGeocoding({
	accessToken: process.env.MAPBOX_ACCESS_TOKEN
});
const client = new line.Client(config);
const app = express();
const baseURL = process.env.BASE_URL;
const RajaOngkir = require('rajaongkir-nodejs').Starter(process.env.RAJA_ONGKIR);

app.use('/downloaded', express.static('downloaded'));
app.get('/', function(req, res) {
	res.send('404');
});

app.post('/webhook', line.middleware(config), function(req, res) {
	if (!Array.isArray(req.body.events)) {
		return res.status(500).end();
	}
	Promise.all(req.body.events.map(produk.handleEvent)).then((result) => res.json(result)).catch((err) => {
		console.error(err);
		res.status(500).end();
	});
});

var produk = (module.exports = {
	handleEvent: async function(event) {
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
							break;
						case 'image':
							let echoReplyImage = await produk.handleReplyImage(event);
							break;
						case 'location':
							let echoLocatio = await produk.handleReplyLocation(event);
							break;
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

	handleLocation: async function(message, replyToken, event) {
		const getKota = await geocodingClient
			.reverseGeocode({
				query: [ message.longitude, message.latitude ]
			})
			.send()
			.then((response) => {
				const data = response.body.features;
				for (var i = 0; i < data.length; i++) {
					if (data[i].place_type == 'place') {
						var hasil = data[i].text;
					}
				}
				return hasil;
			});

		let getDestinasi = await axios.get(`https://backend-skripsi.herokuapp.com/listKota/${getKota}`);
		let getBerat = await axios.get(`https://backend-skripsi.herokuapp.com/pesanan/${event.source.userId}`);
		let cekDestinasi = await getDestinasi.data.city_id;
		let berat = 0;
		for (item of getBerat.data) {
			berat += item.berat;
		}
		var params = {
			origin: 501,
			destination: getDestinasi.data.city_id,
			weight: berat
		};
		let getOngkir = await RajaOngkir.getJNECost(params)
			.then(function(result) {
				var data = result.rajaongkir.results[0];
				for (var i = 0; i < data.costs.length; i++) {
					if (data.costs[i].service == 'OKE') {
						var hasil = data.costs[i].cost[0].value;
					}
				}
				return hasil;
			})
			.catch(function(error) {
				console.log(error);
			});
		if (cekDestinasi == null) {
			var ongkir = 0;
			var statusOngkir = 'Mohon maaf ongkir tidak tersedia, mohon gunakan alamat lain di Indonesia';
		} else {
			var ongkir = getOngkir;
			var statusOngkir = 'Ongkir tersedia & segera upload bukti pembayaran';
		}
		let addOngkir = await axios.put(
			`https://backend-skripsi.herokuapp.com/pesanan/byuserid/${event.source.userId}`,
			{
				ongkir: ongkir,
				alamatKirim: message.address,
				statusOngkir: statusOngkir
			}
		);
		var echoCart = await produk.handleShowCartAlamat(event);
		return echoCart;
	},

	handleReplyLocation: async function(event) {
		const message = event.message;
		let getCurrentState = await axios.get(`https://backend-skripsi.herokuapp.com/userline/${event.source.userId}`);
		let current = getCurrentState.data[0];

		if (current.state == 'tampilPesanan' || current.state == 'tampilPesananStatusAlamat') {
			let echoLocation = await produk.handleLocation(message, event.replyToken, event);
			return client.replyMessage(event.replyToken, echoLocation);
		} else {
			echo = await produk.handleElseState(event);
			return client.replyMessage(event.replyToken, echo);
		}
	},

	handleUser: async function(event) {
		let userInfo = await produk.getUserInfo(event.source.userId);
		const userId = userInfo.userId;
		const username = userInfo.displayName;
		let userExist = await axios.get(`https://backend-skripsi.herokuapp.com/userline/${userId}`);
		console.log('get data db userLine', userExist.data);

		let setAdmin = await axios.get('https://backend-skripsi.herokuapp.com/userline/data');
		if (setAdmin.data.length == 0) {
			var isAdmin = true;
		} else {
			var isAdmin = false;
		}
		if (userExist.data.length == 0) {
			let createUser = await axios.post('https://backend-skripsi.herokuapp.com/userline', {
				userId,
				username,
				isAdmin,
				state: 'idle'
			});
			console.log('post data db userLine', createUser.status);
		} else {
			console.log('Data ' + userId + ' ada');
		}
	},
	getUserInfo: async function(userId) {
		try {
			let userInfo = client.getProfile(userId);
			return userInfo;
		} catch (err) {
			console.log(err);
		}
	},
	updateState: async function(state, userId) {
		try {
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

	handleMessage: async function(event) {
		let getCurrentState = await axios.get(`https://backend-skripsi.herokuapp.com/userline/${event.source.userId}`);
		let current = getCurrentState.data[0];
		console.log('State => ' + current.state);
		let echo = '';
		switch (event.message.text) {
			case 'hai':
				if (current.state == 'idle' || current.state == 'tampilJenis') {
					echo = await produk.handleJenis(event);
					return echo;
				} else {
					echo = await produk.handleElseState(event);
					return client.replyMessage(event.replyToken, echo);
				}
				break;

			default:
				if (current.state == 'idle' || current.state == 'tampilJenis') {
					echo = await produk.handleJenis(event);
					return echo;
				} else {
					echo = await produk.handleElseState(event);
					return client.replyMessage(event.replyToken, echo);
				}
				break;
		}
	},

	handleJenis: async function(event) {
		await produk.updateState('tampilJenis', event.source.userId);
		let jenisData = await axios.get(`https://backend-skripsi.herokuapp.com/jenisProduk`);
		const echo = {
			type: 'flex',
			altText: 'Daftar Jenis Produk',
			contents: {
				type: 'carousel',
				contents: []
			}
		};
		let contentToAdd = [];
		for (item of jenisData.data) {
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
					contents: [
						{
							type: 'text',
							text: item.nama,
							wrap: true,
							weight: 'bold',
							size: 'xl'
						}
					]
				},
				footer: {
					type: 'box',
					layout: 'vertical',
					spacing: 'sm',
					contents: [
						{
							type: 'button',
							style: 'primary',
							action: {
								type: 'postback',
								label: 'Tampilkan',
								data: 'tampilkan_' + item.nama
							}
						}
					]
				}
			};
			contentToAdd.push(soko);
		}
		echo.contents.contents = contentToAdd;
		return echo;
	},

	handleMenu: async function(event, query) {
		await produk.updateState('tampilMenu', event.source.userId);
		let produkData = await axios.get(`https://backend-skripsi.herokuapp.com/produk/showJenis/${query}`);
		const echo = {
			type: 'flex',
			altText: 'Daftar Menu',
			contents: {
				type: 'carousel',
				contents: []
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
					contents: [
						{
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
							contents: [
								{
									type: 'text',
									text: 'Rp.' + item.harga.toString(),
									wrap: true,
									size: 'sm',
									flex: 0
								}
							]
						},
						{
							type: 'text',
							text: 'Stock: ' + item.stock.toString(),
							flex: 0,
							margin: 'md',
							size: 'sm',
							color: '#AAAAAA',
							wrap: true
						},
						{
							type: 'text',
							text: 'Berat: ' + item.berat.toString() + ' gr',
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
					contents: [
						{
							type: 'button',
							style: 'primary',
							action: {
								type: 'postback',
								label: 'Tambah Ke keranjang',
								data: 'tambahKeKeranjang_' + item._id
							}
						}
					]
				}
			};
			contentToAdd.push(soko);
		}
		echo.contents.contents = contentToAdd;
		return echo;
	},

	handleAddToCart: async function(event, query) {
		try {
			let dataProduk = await axios.get(`https://backend-skripsi.herokuapp.com/produk/${query}`);
			let createPesanan = await axios.post('https://backend-skripsi.herokuapp.com/pesanan', {
				userId: event.source.userId,
				nama: dataProduk.data.nama,
				harga: dataProduk.data.harga,
				berat: dataProduk.data.berat,
				alamatKirim: 'Belum Di Isi',
				statusOngkir: 'Belum Input Alamat',
				ongkir: 0,
				userBayar: false,
				adminBayar: false
			});
			let echo = await produk.handleShowCart(event);
			return echo;
		} catch (err) {
			console.log(err);
		}
	},
	handleShowCartAlamat: async function(event) {
		await produk.updateState('tampilPesananStatusAlamat', event.source.userId);
		var userState = await axios.get(`https://backend-skripsi.herokuapp.com/userline/${event.source.userId}`);
		var itemState = userState.data[0];
		let listPesanan = await axios.get(`https://backend-skripsi.herokuapp.com/pesanan/${event.source.userId}`);
		let getAlamat = listPesanan.data[0].alamatKirim;
		let getOngkir = listPesanan.data[0].ongkir;
		let getStatus = listPesanan.data[0].statusOngkir;
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
					contents: [
						{
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
				items: [
					{
						type: 'action',
						action: {
							type: 'postback',
							label: 'Lihat Jenis',
							data: 'lihatJenis'
						}
					},
					{
						type: 'action',
						action: {
							type: 'postback',
							label: 'Hapus Pesanan',
							data: 'hapusPesanan'
						}
					},
					{
						type: 'action',
						action: {
							type: 'location',
							label: 'Input Alamat',
							data: 'alamat'
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
		let berat = 0;
		for (item of listPesanan.data) {
			let itemList = {
				type: 'box',
				layout: 'horizontal',
				contents: [
					{
						type: 'text',
						text: item.nama,
						size: 'sm',
						color: '#2f2f2f',
						wrap: true,
						flex: 2
					},
					{
						type: 'text',
						text: 'Rp.' + item.harga.toString(),
						size: 'sm',
						color: '#000000',
						align: 'end',
						wrap: true,
						flex: 1
					}
				]
			};
			berat += item.berat;
			totalHarga += item.harga;
			echo.contents.body.contents[4].contents.push(itemList);
		}
		let totalHargaAkhir = totalHarga + getOngkir;
		let separator = {
			type: 'separator',
			margin: 'xxl'
		};

		let jumlahPesanan = {
			type: 'box',
			layout: 'horizontal',
			margin: 'xxl',
			contents: [
				{
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
		let jumlahBerat = {
			type: 'box',
			layout: 'horizontal',
			margin: 'xxl',
			contents: [
				{
					type: 'text',
					text: 'BERAT',
					size: 'xs',
					color: '#3c3c3c'
				},
				{
					type: 'text',
					text: berat.toString() + ' gr',
					size: 'sm',
					color: '#000000',
					align: 'end'
				}
			]
		};
		let alamat = {
			type: 'box',
			layout: 'baseline',
			spacing: 'sm',
			contents: [
				{
					type: 'text',
					text: 'ALAMAT',
					flex: 0,
					size: 'xs',
					color: '#3c3c3c'
				},
				{
					type: 'text',
					text: getAlamat,
					flex: 2,
					size: 'xs',
					align: 'end',
					color: '#000000',
					wrap: true
				}
			]
		};
		let ongkir = {
			type: 'box',
			layout: 'horizontal',
			margin: 'xxl',
			contents: [
				{
					type: 'text',
					text: 'ONGKIR',
					size: 'xs',
					color: '#3c3c3c'
				},
				{
					type: 'text',
					text: 'Rp.' + getOngkir.toString(),
					size: 'sm',
					color: '#000000',
					align: 'end'
				}
			]
		};
		let total = {
			type: 'box',
			layout: 'horizontal',
			contents: [
				{
					type: 'text',
					text: 'TOTAL',
					size: 'sm',
					color: '#3c3c3c'
				},
				{
					type: 'text',
					text: 'Rp.' + totalHargaAkhir.toString(),
					size: 'sm',
					color: '#000000',
					align: 'end'
				}
			]
		};
		let status = {
			type: 'box',
			layout: 'baseline',
			spacing: 'sm',
			contents: [
				{
					type: 'text',
					text: 'STATUS',
					flex: 0,
					size: 'xs',
					color: '#3c3c3c'
				},
				{
					type: 'text',
					text: getStatus,
					flex: 2,
					size: 'xs',
					align: 'end',
					color: '#FF3333',
					wrap: true
				}
			]
		};
		echo.contents.body.contents[4].contents.push(separator);
		echo.contents.body.contents[4].contents.push(jumlahPesanan);
		echo.contents.body.contents[4].contents.push(jumlahBerat);
		echo.contents.body.contents[4].contents.push(alamat);
		echo.contents.body.contents[4].contents.push(ongkir);
		echo.contents.body.contents[4].contents.push(total);
		echo.contents.body.contents[4].contents.push(status);
		return echo;
	},
	handleShowCart: async function(event) {
		await produk.updateState('tampilPesanan', event.source.userId);
		var userState = await axios.get(`https://backend-skripsi.herokuapp.com/userline/${event.source.userId}`);
		var itemState = userState.data[0];
		let listPesanan = await axios.get(`https://backend-skripsi.herokuapp.com/pesanan/${event.source.userId}`);
		let getAlamat = listPesanan.data[0].alamatKirim;
		let getOngkir = listPesanan.data[0].ongkir;
		let getStatus = listPesanan.data[0].statusOngkir;
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
					contents: [
						{
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
				items: [
					{
						type: 'action',
						action: {
							type: 'postback',
							label: 'Lihat Jenis',
							data: 'lihatJenis'
						}
					},
					{
						type: 'action',
						action: {
							type: 'postback',
							label: 'Hapus Pesanan',
							data: 'hapusPesanan'
						}
					},
					{
						type: 'action',
						action: {
							type: 'location',
							label: 'Input Alamat',
							data: 'alamat'
						}
					}
				]
			}
		};
		let totalHarga = 0;
		let berat = 0;
		for (item of listPesanan.data) {
			let itemList = {
				type: 'box',
				layout: 'horizontal',
				contents: [
					{
						type: 'text',
						text: item.nama,
						size: 'sm',
						color: '#2f2f2f',
						wrap: true,
						flex: 2
					},
					{
						type: 'text',
						text: 'Rp.' + item.harga.toString(),
						size: 'sm',
						color: '#000000',
						align: 'end',
						wrap: true,
						flex: 1
					}
				]
			};
			berat += item.berat;
			totalHarga += item.harga;
			echo.contents.body.contents[4].contents.push(itemList);
		}
		let totalHargaAkhir = totalHarga + getOngkir;
		let separator = {
			type: 'separator',
			margin: 'xxl'
		};

		let jumlahPesanan = {
			type: 'box',
			layout: 'horizontal',
			margin: 'xxl',
			contents: [
				{
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
		let jumlahBerat = {
			type: 'box',
			layout: 'horizontal',
			margin: 'xxl',
			contents: [
				{
					type: 'text',
					text: 'BERAT',
					size: 'xs',
					color: '#3c3c3c'
				},
				{
					type: 'text',
					text: berat.toString() + ' gr',
					size: 'sm',
					color: '#000000',
					align: 'end'
				}
			]
		};
		let alamat = {
			type: 'box',
			layout: 'baseline',
			spacing: 'sm',
			contents: [
				{
					type: 'text',
					text: 'ALAMAT',
					flex: 0,
					size: 'xs',
					color: '#3c3c3c'
				},
				{
					type: 'text',
					text: getAlamat,
					flex: 2,
					size: 'xs',
					align: 'end',
					color: '#000000',
					wrap: true
				}
			]
		};
		let ongkir = {
			type: 'box',
			layout: 'horizontal',
			margin: 'xxl',
			contents: [
				{
					type: 'text',
					text: 'ONGKIR',
					size: 'xs',
					color: '#3c3c3c'
				},
				{
					type: 'text',
					text: 'Rp.' + getOngkir.toString(),
					size: 'sm',
					color: '#000000',
					align: 'end'
				}
			]
		};
		let total = {
			type: 'box',
			layout: 'horizontal',
			contents: [
				{
					type: 'text',
					text: 'TOTAL',
					size: 'sm',
					color: '#3c3c3c'
				},
				{
					type: 'text',
					text: 'Rp.' + totalHargaAkhir.toString(),
					size: 'sm',
					color: '#000000',
					align: 'end'
				}
			]
		};
		let status = {
			type: 'box',
			layout: 'baseline',
			spacing: 'sm',
			contents: [
				{
					type: 'text',
					text: 'STATUS',
					flex: 0,
					size: 'xs',
					color: '#3c3c3c'
				},
				{
					type: 'text',
					text: getStatus,
					flex: 2,
					size: 'xs',
					align: 'end',
					color: '#FF3333',
					wrap: true
				}
			]
		};
		echo.contents.body.contents[4].contents.push(separator);
		echo.contents.body.contents[4].contents.push(jumlahPesanan);
		echo.contents.body.contents[4].contents.push(jumlahBerat);
		echo.contents.body.contents[4].contents.push(alamat);
		echo.contents.body.contents[4].contents.push(ongkir);
		echo.contents.body.contents[4].contents.push(total);
		echo.contents.body.contents[4].contents.push(status);
		return echo;
	},
	handleEmptyCart: async function(event, query) {
		await produk.updateState('pesananDihapus', event.source.userId);
		try {
			let deleteAll = await axios.delete(`https://backend-skripsi.herokuapp.com/pesanan/${event.source.userId}`);
			let echo = {
				type: 'text',
				text: 'Pesanan Berhasil Dihapus',
				quickReply: {
					items: [
						{
							type: 'action',
							action: {
								type: 'postback',
								label: 'Lihat Jenis',
								data: 'lihatJenis'
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

	handleShowCartAdmin: async function(event, message) {
		await produk.updateState('menuAdmin', event.source.userId);
		let listPesanan = await axios.get(`https://backend-skripsi.herokuapp.com/pesanan/admin/${message}`);
		let getAlamat = listPesanan.data[0].alamatKirim;
		let getOngkir = listPesanan.data[0].ongkir;
		let getStatus = listPesanan.data[0].statusOngkir;
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
					contents: [
						{
							type: 'text',
							text: 'Kode Pesanan: ' + message,
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
			}
		};
		let berat = 0;
		let totalHarga = 0;
		for (item of listPesanan.data) {
			let itemList = {
				type: 'box',
				layout: 'horizontal',
				contents: [
					{
						type: 'text',
						text: item.nama,
						size: 'sm',
						color: '#2f2f2f',
						wrap: true,
						flex: 2
					},
					{
						type: 'text',
						text: 'Rp' + item.harga.toString(),
						size: 'sm',
						color: '#000000',
						align: 'end',
						wrap: true,
						flex: 1
					}
				]
			};
			berat += item.berat;
			totalHarga += item.harga;
			echo.contents.body.contents[3].contents.push(itemList);
		}
		let totalHargaAkhir = totalHarga + getOngkir;
		let separator = {
			type: 'separator',
			margin: 'xxl'
		};

		let jumlahPesanan = {
			type: 'box',
			layout: 'horizontal',
			margin: 'xxl',
			contents: [
				{
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
		let jumlahBerat = {
			type: 'box',
			layout: 'horizontal',
			margin: 'xxl',
			contents: [
				{
					type: 'text',
					text: 'BERAT',
					size: 'xs',
					color: '#3c3c3c'
				},
				{
					type: 'text',
					text: berat.toString() + ' gr',
					size: 'sm',
					color: '#000000',
					align: 'end'
				}
			]
		};
		let alamat = {
			type: 'box',
			layout: 'baseline',
			spacing: 'sm',
			contents: [
				{
					type: 'text',
					text: 'ALAMAT',
					flex: 0,
					size: 'xs',
					color: '#3c3c3c'
				},
				{
					type: 'text',
					text: getAlamat,
					flex: 2,
					size: 'xs',
					align: 'end',
					color: '#000000',
					wrap: true
				}
			]
		};
		let ongkir = {
			type: 'box',
			layout: 'horizontal',
			margin: 'xxl',
			contents: [
				{
					type: 'text',
					text: 'ONGKIR',
					size: 'xs',
					color: '#3c3c3c'
				},
				{
					type: 'text',
					text: 'Rp.' + getOngkir.toString(),
					size: 'sm',
					color: '#000000',
					align: 'end'
				}
			]
		};
		let total = {
			type: 'box',
			layout: 'horizontal',
			contents: [
				{
					type: 'text',
					text: 'TOTAL',
					size: 'sm',
					color: '#3c3c3c'
				},
				{
					type: 'text',
					text: 'Rp.' + totalHargaAkhir.toString(),
					size: 'sm',
					color: '#000000',
					align: 'end'
				}
			]
		};
		let status = {
			type: 'box',
			layout: 'baseline',
			spacing: 'sm',
			contents: [
				{
					type: 'text',
					text: 'STATUS',
					flex: 0,
					size: 'xs',
					color: '#3c3c3c'
				},
				{
					type: 'text',
					text: getStatus,
					flex: 2,
					size: 'xs',
					align: 'end',
					color: '#FF3333',
					wrap: true
				}
			]
		};
		let approveButton = {
			type: 'box',
			layout: 'vertical',
			spacing: 'sm',
			contents: [
				{
					type: 'button',
					style: 'primary',
					action: {
						type: 'postback',
						label: 'Konfirmasi Pesanan',
						data: 'konfirmasiPesanan_' + message
					}
				},
				{
					type: 'button',
					style: 'primary',
					action: {
						type: 'postback',
						label: 'Tolak Pesanan',
						data: 'tolakPesanan_' + message
					}
				}
			]
		};
		echo.contents.body.contents[3].contents.push(separator);
		echo.contents.body.contents[3].contents.push(jumlahPesanan);
		echo.contents.body.contents[3].contents.push(jumlahBerat);
		echo.contents.body.contents[3].contents.push(alamat);
		echo.contents.body.contents[3].contents.push(ongkir);
		echo.contents.body.contents[3].contents.push(total);
		echo.contents.body.contents[3].contents.push(status);
		echo.contents.body.contents[3].contents.push(approveButton);
		return echo;
	},

	downloadContent: async function(messageId, downloadPath) {
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

	sendImageToAmdin: async function(message, replyToken, event) {
		let getContent;
		const downloadPath = path.join(__dirname, 'downloaded', `${message}.jpg`);
		const previewPath = path.join(__dirname, 'downloaded', `${message}-preview.jpg`);

		getContent = produk.downloadContent(message, downloadPath).then((downloadPath) => {
			cp.execSync(`convert -resize 240x jpeg:${downloadPath} jpeg:${previewPath}`);

			return {
				originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
				previewImageUrl: baseURL + '/downloaded/' + path.basename(previewPath)
			};
		});
		return getContent.then(({ originalContentUrl, previewImageUrl }) => {
			let echo = {
				type: 'image',
				originalContentUrl,
				previewImageUrl
			};
			return echo;
		});
	},

	handleProsesPesanan: async function(event) {
		await produk.updateState('pesananDiProses', event.source.userId);
		let userAdmin = await axios.get(`https://backend-skripsi.herokuapp.com/userline/data`);
		let itemAdmin = userAdmin.data[0];
		let listPesanan = await axios.get(`https://backend-skripsi.herokuapp.com/pesanan/${event.source.userId}`);
		let id = listPesanan.data[0];
		let echo = {
			type: 'text',
			text:
				'Nomor Pembayaran:' +
				id.nomorBayar +
				'Pembayaran & Pesanan Anda Sedang Diperiksa Oleh Admin. Tunggu Status Pesanan Anda Dari Admin Untuk Melakakukan Transaksi Lain'
		};
		let replyUser = await client.replyMessage(event.replyToken, echo);
		if (itemAdmin.isAdmin == true) {
			let image = await produk.sendImageToAmdin(id.nomorBayar, event.replyToken, event);
			let echoMessageId = {
				type: 'text',
				text: 'Pesanan Baru Min!! Bukti Pesanan: ' + id.nomorBayar
			};
			let cartData = await produk.handleShowCartAdmin(event, id.nomorBayar);
			return client.pushMessage(itemAdmin.userId, [ echoMessageId, image, cartData ]);
		} else {
			return client.replyMessage(event.replyToken, echo);
		}
	},

	handleStatusUploadPembayaran: async function(message, event) {
		await produk.updateState('berhasilUploadPembayaran', event.source.userId);
		let updatePesanan = await axios.put(
			`https://backend-skripsi.herokuapp.com/pesanan/byuserid/${event.source.userId}`,
			{
				userBayar: true,
				nomorBayar: message.id
			}
		);
		let echo = {
			type: 'text',
			text:
				'Terimakasih Telah Upload Bukti Pembayaran. Klik Button "Checkout" Untuk Proses Verivikasi Admin. Klik Button "Batal" Untuk Mengganti Alamat',
			quickReply: {
				items: [
					{
						type: 'action',
						action: {
							type: 'postback',
							label: 'Checkout',
							data: 'checkOut'
						}
					},
					{
						type: 'action',
						action: {
							type: 'postback',
							label: 'Batal',
							data: 'batal'
						}
					}
				]
			}
		};
		return echo;
	},

	handleReplyImage: async function(event) {
		const message = event.message;
		var getCurrentState = await axios.get(`https://backend-skripsi.herokuapp.com/userline/${event.source.userId}`);
		var current = getCurrentState.data[0];
		if (current.state == 'tampilPesananStatusAlamat') {
			let echo = await produk.handleStatusUploadPembayaran(message, event);
			return client.replyMessage(event.replyToken, echo);
		} else {
			echo = await produk.handleElseState(event);
			return client.replyMessage(event.replyToken, echo);
		}
	},
	handleApprovePayment: async function(event, query) {
		let updatePesanan = await axios.put(`https://backend-skripsi.herokuapp.com/pesanan/${query}`, {
			adminBayar: true
		});
		let userToNotify = await axios.get(`https://backend-skripsi.herokuapp.com/pesanan/bynomorbayar/${query}`);
		let userAdminToNotify = await axios.get(`https://backend-skripsi.herokuapp.com/userline/data`);
		let idToNotify = userToNotify.data[0].userId;
		let idAdminToNoify = userAdminToNotify.data[0].userId;
		await produk.updateState('pesananDikonfirmasi', event.source.userId);
		await produk.updateState('pesananDikonfirmasi', idToNotify);
		let echo = {
			type: 'text',
			text:
				'Pesanan dengan nomor ' +
				query +
				' telah diverifikasi oleh admin, klik button "LihatJenis" untuk order lagi',
			quickReply: {
				items: [
					{
						type: 'action',
						action: {
							type: 'postback',
							label: 'Lihat Jenis',
							data: 'lihatJenis'
						}
					}
				]
			}
		};
		return client.multicast([ idToNotify, idAdminToNoify ], echo);
	},

	handleRejectPayment: async function(event, query) {
		let userToNotify = await axios.get(`https://backend-skripsi.herokuapp.com/pesanan/bynomorbayar/${query}`);
		let userAdminToNotify = await axios.get(`https://backend-skripsi.herokuapp.com/userline/data`);
		let idToNotify = userToNotify.data[0].userId;
		let idAdminToNoify = userAdminToNotify.data[0].userId;
		await produk.updateState('pesananDitolak', event.source.userId);
		await produk.updateState('pesananDitolak', idToNotify);
		let echo = {
			type: 'text',
			text:
				'Pesanan dengan nomor ' +
				query +
				' ditolak oleh admin.Mohon masukkan bukti pembayaran & alamat dengan benar',
			quickReply: {
				items: [
					{
						type: 'action',
						action: {
							type: 'postback',
							label: 'Lihat Jenis',
							data: 'lihatJenis'
						}
					}
				]
			}
		};
		return client.multicast([ idToNotify, idAdminToNoify ], echo);
	},

	handleElseState: async function(event) {
		let getCurrentState = await axios.get(`https://backend-skripsi.herokuapp.com/userline/${event.source.userId}`);
		let current = getCurrentState.data[0];
		if (current.state == 'tampilJenis') {
			let echo = {
				type: 'text',
				text:
					'Anda tidak diperbolehkan mengakses button lain pada state ini. Gunakan button "Tampilkan" untuk melanjutakn order'
			};
			return echo;
		} else if (current.state == 'tampilMenu') {
			let echo = {
				type: 'text',
				text:
					'Anda tidak diperbolehkan mengakses button lain pada state ini. Gunakan button "Tambah Ke Keranjang" untuk melanjutakn order'
			};
			return echo;
		} else if (current.state == 'tampilPesanan') {
			let echo = {
				type: 'text',
				text:
					'Anda tidak diperbolehkan mengakses button lain pada state ini. Gunakan button "Tambah Ke Keranjang" & button dibawah ini untuk melanjutakn order',
				quickReply: {
					items: [
						{
							type: 'action',
							action: {
								type: 'postback',
								label: 'Lihat Jenis',
								data: 'lihatJenis'
							}
						},
						{
							type: 'action',
							action: {
								type: 'postback',
								label: 'Hapus Pesanan',
								data: 'hapusPesanan'
							}
						},
						{
							type: 'action',
							action: {
								type: 'location',
								label: 'Input Alamat',
								data: 'alamat'
							}
						}
					]
				}
			};
			return echo;
		} else if (current.state == 'pesananDihapus') {
			let echo = {
				type: 'text',
				text:
					'Anda tidak diperbolehkan mengakses button lain pada state ini. Gunakan button "Tambah Ke Keranjang" & button dibawah ini untuk melanjutakn order',
				quickReply: {
					items: [
						{
							type: 'action',
							action: {
								type: 'postback',
								label: 'Lihat Jenis',
								data: 'lihatJenis'
							}
						}
					]
				}
			};
			return echo;
		} else if (current.state == 'tampilPesananStatusAlamat') {
			let echo = {
				type: 'text',
				text:
					'Anda tidak diperbolehkan mengakses button lain pada state ini. Gunakan button button dibawah ini untuk melanjutakn order',
				quickReply: {
					items: [
						{
							type: 'action',
							action: {
								type: 'location',
								label: 'Input Alamat',
								data: 'alamat'
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
			return echo;
		} else if (current.state == 'berhasilUploadPembayaran') {
			let echo = {
				type: 'text',
				text:
					'Anda tidak diperbolehkan mengakses button lain pada state ini. Gunakan button dibawah untuk melanjutakn order',
				quickReply: {
					items: [
						{
							type: 'action',
							action: {
								type: 'postback',
								label: 'Checkout',
								data: 'checkOut'
							}
						},
						{
							type: 'action',
							action: {
								type: 'postback',
								label: 'Batal',
								data: 'batal'
							}
						}
					]
				}
			};
			return echo;
		} else if (current.state == 'pesananDiproses') {
			let echo = {
				type: 'text',
				text:
					'Nomor Pembayaran:' +
					id.nomorBayar +
					'Pembayaran & Pesanan Anda Sedang Diperiksa Oleh Admin. Tunggu Status Pesanan Anda Dari Admin Untuk Melakakukan Transaksi Lain'
			};
			return echo;
		} else if (current.state == 'menuAdmin') {
			let echo = {
				type: 'text',
				text:
					'Anda tidak diperbolehkan mengakses button lain pada state ini. Gunakan button "Konfirmasi Pesanan" atau "Tolak Pesanan" untuk update status pesanan'
			};
			return echo;
		} else if (current.state == 'pesananDikonfirmasi') {
			let echo = {
				type: 'text',
				text:
					'Anda tidak diperbolehkan mengakses button lain pada state ini. Gunakan button "Lihat Jenis" untuk melihat jenis',
				quickReply: {
					items: [
						{
							type: 'action',
							action: {
								type: 'postback',
								label: 'Lihat Jenis',
								data: 'lihatJenis'
							}
						}
					]
				}
			};
			return echo;
		} else if (current.state == 'pesananDitolak') {
			let echo = {
				type: 'text',
				text:
					'Anda tidak diperbolehkan mengakses button lain pada state ini. Gunakan button "Lihat Jenis" untuk melihat jenis',
				quickReply: {
					items: [
						{
							type: 'action',
							action: {
								type: 'postback',
								label: 'Lihat Jenis',
								data: 'lihatJenis'
							}
						}
					]
				}
			};
			return echo;
		} else {
			let echo = {
				type: 'text',
				text: 'Anda tidak diperbolehkan mengakses button lain pada state ini'
			};
			return echo;
		}
	},

	handlePostback: async function(event) {
		let getCurrentState = await axios.get(`https://backend-skripsi.herokuapp.com/userline/${event.source.userId}`);
		let current = getCurrentState.data[0];
		let postbackData = event.postback.data.split('_', 2);
		let mode = postbackData[0];
		let query = postbackData[1];
		console.log(mode);
		console.log(query);
		console.log('State Sebelumnya => ' + current.state);
		let echo = '';
		switch (mode) {
			case 'lihatJenis':
				if (
					current.state == 'pesananDihapus' ||
					current.state == 'tampilPesanan' ||
					current.state == 'pesananDikonfirmasi' ||
					current.state == 'pesananDitolak'
				) {
					echo = await produk.handleJenis(event);
					return client.replyMessage(event.replyToken, echo);
				} else {
					echo = await produk.handleElseState(event);
					return client.replyMessage(event.replyToken, echo);
				}
				break;
			case 'tampilkan':
				if (current.state == 'tampilJenis') {
					echo = await produk.handleMenu(event, query);
					return client.replyMessage(event.replyToken, echo);
				} else {
					echo = await produk.handleElseState(event);
					return client.replyMessage(event.replyToken, echo);
				}
				break;
			case 'tambahKeKeranjang':
				if (current.state == 'tampilMenu' || current.state == 'tampilPesanan') {
					echo = await produk.handleAddToCart(event, query);
					return client.replyMessage(event.replyToken, echo);
				} else {
					echo = await produk.handleElseState(event);
					return client.replyMessage(event.replyToken, echo);
				}
				break;
			case 'lihatPesanan':
				if (current.state == 'tampilPesanan') {
					echo = await produk.handleShowCart(event, query);
					return client.replyMessage(event.replyToken, echo);
				} else {
					echo = await produk.handleElseState(event);
					return client.replyMessage(event.replyToken, echo);
				}
				break;
			case 'hapusPesanan':
				if (current.state == 'tampilPesanan') {
					echo = await produk.handleEmptyCart(event, query);
					return client.replyMessage(event.replyToken, echo);
				} else {
					echo = await produk.handleElseState(event);
					return client.replyMessage(event.replyToken, echo);
				}
				break;
			case 'konfirmasiPesanan':
				if (
					current.state == 'menuAdmin' ||
					current.state == 'pesananDikonfirmasi' ||
					current.state == 'pesananDitolak'
				) {
					return produk.handleApprovePayment(event, query);
				} else {
					echo = await produk.handleElseState(event);
					return client.replyMessage(event.replyToken, echo);
				}
				break;
			case 'tolakPesanan':
				if (
					current.state == 'menuAdmin' ||
					current.state == 'pesananDikonfirmasi' ||
					current.state == 'pesananDitolak'
				) {
					return produk.handleRejectPayment(event, query);
				} else {
					echo = await produk.handleElseState(event);
					return client.replyMessage(event.replyToken, echo);
				}
				break;
			case 'checkOut':
				if (current.state == 'berhasilUploadPembayaran') {
					await produk.handleProsesPesanan(event);
				} else {
					echo = await produk.handleElseState(event);
					return client.replyMessage(event.replyToken, echo);
				}
				break;
			case 'batal':
				if (current.state == 'berhasilUploadPembayaran') {
					echo = await produk.handleShowCartAlamat(event, query);
					return client.replyMessage(event.replyToken, echo);
				} else {
					echo = await produk.handleElseState(event);
					return client.replyMessage(event.replyToken, echo);
				}
		}
	}
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`listening on ${port}`);
});
