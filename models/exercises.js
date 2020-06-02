const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ExercisesSchema = new Schema({
    description: {
        type: String,
        required: true,
        maxlength: [20, 'description too long']
      },
      duration: {
        type: Number,
        required: true,
        min: [1, 'duration too short']
      },
      date: {
        type: Date      
    },
});

exports.Exercises = mongoose.model('Exercises', ExercisesSchema);
exports.ExercisesSchema = ExercisesSchema;
