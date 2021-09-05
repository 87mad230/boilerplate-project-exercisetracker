const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')


app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded())
app.use(express.json())
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
//----------------------------------------------------------------
mongoose.connect('mongodb+srv://test:test@cluster0.nxd1a.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  log: [Object]
})
const UserModel = mongoose.model('Users', UserSchema);

// Logs Schema and model
const LogsSchema = mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  }
})
const LogsModel = mongoose.model('Logs', LogsSchema)
//----------------------------------------------------------------------------
app.post('/api/users', function (req, res, next) { 
      let user = req.body.username ;
      UserModel.findOne({username: user}, function (err, data) {
            if (data) {
                res.json({username: data.username , _id: data._id})
            }
            else {
              let newUser = new UserModel({ username: user})
              let id = newUser._id.toString()
              newUser.save().then(() => console.log('saved')).catch((err) => console.log(err))
              res.json({ username: newUser.username, _id: id })
            }
      })
      
})

app.post('/api/users/:_id/exercises', function (req,res) {
      let id = req.params._id;
      let description = req.body.description;
      let duration = req.body.duration;
      let date = new Date(...req.body.date.split('-')).toDateString() || new Date().toDateString() ;
      let LogsCollection = new LogsModel({ 'description': description, 'duration': duration, 'date': date })
      UserModel.findOne({ _id: id }, function (err, response) {
          if (!response) res.send(`${id} is not found`)
          else {
            response.log.push(LogsCollection);
            res.json({ username: response.username, description: description, duration: duration, date: date, _id: id })
            response.save()
          }
        })
        
      console.log(id,description, duration, date);

})
app.get('/api/users/:_id/logs', function (req,res,next) {
    let id = req.params._id ;
    let from = (new Date(req.query.from) != "Invalid Date") ? new Date(req.query.from) : undefined ;
    let to = (new Date(req.query.to) != "Invalid Date") ? new Date(req.query.to) : new Date();
    let limit = parseInt(req.query.limit) || 0;
    console.log(from, to, limit);
    UserModel.findOne({'_id': id }, function (err, response) {
        if (err) console.log(err);
        //console.log(response)
        let r = response; // i truely dont know why but it 
        let exercicesArray = r.log.filter((e) => {
              let date = new Date(e.date) ;
              if (from) 
                return (date >= from && date <= to)
              return (date <= to )
        })
        exercicesArray = limit !== 0 ? exercicesArray.slice(0, limit) : exercicesArray  ;
        res.json({
          _id: id,
          username: response.username,
          count: exercicesArray.length,
          log : exercicesArray
        });
    })
    
   
})

//----------------------------------------------------------------
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
