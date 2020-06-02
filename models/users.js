const mongoose = require("mongoose");
const { ExercisesSchema } = require('../models/exercises');
var Schema = mongoose.Schema;


const UsersSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        maxlength: [20, 'username too long']
    },
    log: [ExercisesSchema]
});

module.exports = mongoose.model('Users', UsersSchema);
