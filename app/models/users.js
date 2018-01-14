var mongoose=require('mongoose');

var Schema=mongoose.Schema;

var userSchema=new Schema({
  'firstName'           : {type:'String',default:''},
  'lastName'            : {type:'String',default:''},
  'fullName'            : {type:'String',default:'',unique:true},
  'email'               : {type:'String',default:'',unique:true},
  'password'            : {type:'String',default:''},
  'cart'                :[],
  'cartCost'            : {type:'Number',default:0}

})

mongoose.model('userModel',userSchema);


var cartSchema=new Schema({
  productid:{type:'String',default:''},
  productName:{type:'String',default:''},
  productPrice:{type:'Number',default:''},
})

mongoose.model('cartModel',cartSchema);
