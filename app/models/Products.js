var mongoose=require('mongoose');

var Schema=mongoose.Schema;

var productSchema = new Schema({
  'productName':         {type:'String',default:'',unique:true},
  'productCategory':     {type:String,default:''},
  'productPrice':        {type:Number,default:''},
  'productSellerName':   {type:String,default:''},
  'productImageAddress': {type:String,default:'',unique:true},
  'productDescription':  [],
  'productProperties':   {}
})

mongoose.model('productModel',productSchema);
