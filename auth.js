const bcrypt = require('bcrypt');
const userModel = require('./model/user');

exports.authenticate = (username, password) => {
    return new Promise(async(resolve, reject) => {
        try {
            //  Get user by username
            const user = await userModel.findOne({ username })
                // Match password
            bcrypt.compare(password, user.password, (err, isMatch) => {
                console.log(err)
                if (err) throw err
                isMatch ? resolve(user) : reject('Authentication Failed!')
            })
        } catch (err) {
            reject('Athentication Failed!(user not found)')
        }
    })
}