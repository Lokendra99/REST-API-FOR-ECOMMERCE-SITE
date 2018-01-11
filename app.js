var express=require('express');
var mongoose=require('mongoose');
var session = require('express-session');
var bodyParser=require('body-parser');
var fs=require('fs');
var path =require('path');
var user=require('./app/models/users');
var userModel=mongoose.model('userModel');

var app=express();

app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
  name: 'myCustomCookie',
  secret: 'keyboard cat',
  resave: true,
  httpOnly: true,
  saveUninitialized: true,
  cookie: {
    secure: false
  }
}))



//for automation of getting  JS files from models and controllers
fs.readdirSync('./app/controllers').forEach(function(file){
  if(file.indexOf('.js')){
    var route=require('./app/controllers/'+file);
    route.controller(app);
  }
})

fs.readdirSync('./app/models').forEach(function(file){
  if(file.indexOf('.js')){
    require('./app/models/'+file);
  }
})

//connection to db
var dbPath='mongodb://localhost/ecommerce';
mongoose.connect(dbPath);
mongoose.connection.once('open',function(err){
  if(err)throw err;
  console.log("successfully connected to database");
})

// setting up View Engine
app.set('view engine','jade');
app.set('views',path.join(__dirname+'/app/views'));


//setting up to use content from localfilesystem
app.use(express.static('public'));
app.use('/uploadedData', express.static(__dirname + '/uploadedData'));





// app level middleware to make sure that session stores updated results from DB
app.use(function(req,res,next){
  if(req.session && req.session.user){
    userModel.findOne({email:req.session.user.email},function(err,result){
      if(err) throw err;
      else{
        req.session.user=result;
        delete req.session.user.password;
        next();
      }
    })
  }
  else{

  }
});




//setting up port to be used for this project
var port=3000;
app.listen(port,function(err){
  if(err) throw error;
  console.log('sucessfully made connection on port'+port);
})
