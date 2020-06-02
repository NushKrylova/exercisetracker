const Users = require('../models/users');
const mongoose = require("mongoose");
const { Exercises } = require('../models/exercises');

const router = require('express').Router();

router.post("/new-user", async function (req, res, next) {
    //Users.collection.drop();
    let userRecord = new Users({
        username: req.body.username,
        log: []
    });
    try {
        let savedUser = await userRecord.save();
        res.json({ username: savedUser.username, _id: savedUser._id });
        console.log("saved record: ", savedUser);
    } catch (err) {
        if (err) {
            if (err.code == 11000) {
                // uniqueness error (no custom message)
                return next({
                    status: 400,
                    message: 'Username already taken'
                })
            } else {
                return next(err)
            }
        }
        res.json({ username: savedUser.username, _id: savedUser._id });
    }
});

router.post("/add",
    async function (req, res, next) {

        let date;
        let dateFromBody = req.body.date;
        dateFromBody ? date = new Date(dateFromBody) : date = new Date()

        const exercise = new Exercises({
            description: req.body.description,
            duration: req.body.duration,
            date: date
        })

        Users.findByIdAndUpdate(req.body.userId,
            { $push: { log: exercise } },
            { new: true, runValidators: true },
            (err, updatedRecord) => {
                if (err) return next(err)
                console.log("add", updatedRecord)

                //get only last log
                let lastLog = updatedRecord.log[updatedRecord.log.length - 1];
                return res.json({
                    username: updatedRecord.username,
                    description: lastLog.description,
                    duration: lastLog.duration,
                    _id: updatedRecord._id,
                    date: lastLog.date.toDateString()
                });
            })
    }
);

router.get("/users", async function (req, res) {
    let all = await Users.find({}, (err, result) => {
    });
    return res.json(all);
});

router.get("/log", async function (req, res, next) {
    let query
    try {
        query = Users.find({ _id: req.query.userId });
    } catch (err) {
        if (err) return next(err);
        if (!query) {
            return next({ status: 400, message: 'Unknown userId' });
        }
    }
    let limit = 10000;
    let startDate = new Date("1000-01-01T00:00:00.000Z");
    let endDate = new Date();

    if (req.query.limit) {
        limit = parseInt(req.query.limit);
    }
    if (req.query.from && req.query.to) {
        startDate = new Date(req.query.from);
        endDate = new Date(req.query.to);
    }
    let result = await Users.aggregate([
        {
            $match: {
                _id: new mongoose.mongo.ObjectId(req.query.userId),
                $and:
                [{ 'log.date': { $gte: startDate } }, { 'log.date': { $lte: endDate } }]
            }
        },
        { $unwind: '$log' },
        { $sort: { 'log.date': 1 } },
        {
            $group: {
                _id: '$_id', 
                log: {
                    $push:
                        '$log'
                },
                username: { $first: '$username' },
            }
        },
        {
            $project: {
                username: true,
                log: true,
                log: {
                    $slice: ["$log", parseInt(limit)],
                }
            }
        },
        {
            $addFields: {
                count: { $size: "$log" },
            }
        }
    ]);
    //return res.json(result);
    return res.json({
        _id: result[0]._id,
        username: result[0].username,
        count: result[0].count,
        log: result[0].log.map(exercise => ({
            description: exercise.description,
            duration: exercise.duration,
            date: exercise.date.toDateString()
        })
        )
    });
});

module.exports = router
//http://localhost:3000/api/exercise/log?userId=5ed2c6aca1872dff34474930&from=2018-01-01&to=2019-01-01
//http://localhost:3000/api/exercise/log?userId=5ec3c38cc530e526ad533782
