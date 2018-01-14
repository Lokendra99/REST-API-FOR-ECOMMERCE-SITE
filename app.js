var express=require('express');
var mongoose=require('mongoose');
var session = require('express-session');
var bodyParser=require('body-parser');
var expressValidator=require('express-validator');
var fs=require('fs');
var path =require('path');
var user=require('./app/models/Users');
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
//connect-flash
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//express validator middleware
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));


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
var dbPath='mongodb://localhost/eCart';
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

app.listen(process.env.PORT || 3000,function(err){
  if(err) throw error;
  console.log('sucessfully made connection on port'+port);
})
