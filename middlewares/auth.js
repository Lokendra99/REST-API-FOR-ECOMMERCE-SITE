var mongoose=require('mongoose');

var userModel=mongoose.model('userModel');


module.exports.settingAuthPerms=function(req,res,next){
  if(!req.session.user){
    res.redirect('/loginPage');
  }
  else{
    next();
  }
}
