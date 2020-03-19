const mongoose = require('mongoose')

const pesananSchema = mongoose.Schema({
    idUser: String,
    nama: String,
    harga: Number,
    idPembayaran: String
})

module.exports = mongoose.model('Pesanan', pesananSchema)