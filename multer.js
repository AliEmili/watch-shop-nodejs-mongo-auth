const multer = require('multer')


const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './public')
    },
    filename: (req, file, callback) => {
        callback(null, Math.random().toString(36).substr(2, 5) + file.originalname)
    }
})

const fileFilter = (req, file, callback) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
        callback(null, true)
    } else {
        callback(null, false)
    }
}


exports.Upload = multer({ storage, fileFilter });