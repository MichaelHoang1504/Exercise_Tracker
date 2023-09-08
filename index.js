const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');

const mySecret = process.env['MONGO_DB'];
mongoose.connect(mySecret);


const userSchema = new mongoose.Schema({
  username:{
    type:String,
    required:true
  }
});
let User= mongoose.model('User',userSchema);
const exerciseSchema = new mongoose.Schema({
  user_id:{type:String,required:true},
  description:String,
  duration:Number,
  date:Date
  
});
const Exercise = mongoose.model('Exercise',exerciseSchema);
app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.get('/api/users', async (req,res)=>{
  try{
    const users = await User.find({}).select('username _id');
    const orderByUser = users.map(e=> ({
      username: e.username,
      _id: e._id
    }));
    !users? res.json({user:'cound not find user'})
          : res.json(orderByUser);
  } catch(err){
    console.log(err);
  }
})
app.get('/api/users/:_id/logs', async (req,res)=>{
  const {from, to, limit} = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if(!user){
    res.json({user:'cound not find users'});
    return;
  } 
  let dateObj={};
  if(from && to){
    dateObj={$gte:new Date(from), $lt:new Date(to)};
  }else{
    if(from){
      let key = "$gte";
      dateObj = {
      [key]: "the_value",
    };
    }
    if(to){
     let key = "$lte";
      dateObj = {
      [key]: "the_value",
    };
  }
}
  let filter= {
    user_id: id
  }
  if(from||to){
    filter.date=dateObj;
  }
  const exercises= await Exercise.find(filter).limit(+limit??100);
  const log = exercises.map(e=>({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }));
  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log
  })
  
});
app.post('/api/users', async (req,res)=>{
  const username= req.body.username;
  try{
    let newUser = new User({username});
  let fileSave = await newUser.save();
  res.json(fileSave);
  } catch(err){
    console.log(err);
  }
})
app.post('/api/users/:_id/exercises', async (req,res)=>{
  const id= req.params._id;
  const {description,duration,date}=req.body;
  try{
    let availableUser= await User.findById(id);
    if(!availableUser){
      res.json({user:'not available user'});
    } else{
      const newExercise = new Exercise({
        user_id: availableUser._id,
        description,
        duration,
        date: date? new Date(date)
                  : new Date()
      });
      const result = await newExercise.save();
      res.json({
        username: availableUser.username,
        description: result.description,
        duration: result.duration,
        date: result.date.toDateString(),
        _id: availableUser._id
      });
    }
  } catch(err){
     console.log(err);
  }
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
