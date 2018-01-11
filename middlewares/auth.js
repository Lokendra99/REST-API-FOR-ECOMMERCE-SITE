var mongoose=require('mongoose');

var userModel=mongoose.model('userModel');

// module.exports.setLoggedInUser=function(req,res,next){
//   if(req.session && req.session.user){
//     userModel.findOne({email:req.session.user.email},function(err,result){
//       if(err) throw err;
//       else{
//         req.session.user=result;
//         delete req.session.user.password;
//         next();
//       }
//     })
//   }
//   else{
//
//   }
// }

module.exports.settingAuthPerms=function(req,res,next){
  if(!req.session.user){
    res.redirect('/loginPage');
  }
  else{
    next();
  }
}
