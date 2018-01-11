var express=require('express');
var mongoose=require('mongoose');
var nodemailer=require('nodemailer');
var multer=require('multer');
var upload = multer({ dest: 'uploadedData' });
var route=express.Router();

var objGenerator=require('../../library/generator');
var auth=require('../../middlewares/auth');

var user=require('../models/users');
var product=require('../models/Products');

var userModel=mongoose.model('userModel');
var productModel=mongoose.model('productModel');
var cartModel=mongoose.model('cartModel');


 module.exports.controller=function(app){

  route.get('/signUpPage',function(req,res){
    res.render('signUp',{})
  });

  route.post('/signUpInfo',function(req,res){


    userModel.findOne({email:req.body.email},function(err,result){
      if(err){objGenerator.generatorFn(true,"error while finding",404,null);}

      else if(result==null){

        var temp=req.body.email;
        var savingIndex=null;
        for(var i=0;i<temp.length;i++){
          if(temp[i]=='.'){
            savingIndex=i;
          }
        }
        var resultantString=temp.slice(0,savingIndex);

          if(req.body.firstName!=undefined && req.body.lastName!=undefined
           &&req.body.email!=undefined && req.body.password!=undefined){

            var newUser= new userModel({
              'firstName':req.body.firstName,
              'lastName':req.body.lastName,
              'fullName':req.body.firstName+req.body.lastName+resultantString,
              'email':req.body.email,
              'password':req.body.password
            })
          }

          newUser.save(function(err,result){
            if(err){
              res.send(objGenerator.generatorFn(true,"Data could not be saved into database",404,null));
            }
            else{
              req.session.user=newUser;
              delete req.session.user.password;
              res.render('thankyou',{firstName:result.firstName})
            }
          });

      }
      else if(result!=null){
        //req.flash('success_messages', 'User with this email id already present');
        console.log("user already exists");
        res.render('userDuplicate',{})
        //res.redirect('/signUpPage');
      }
    })


  });


  route.get('/loginPage',function(req,res){
    res.render('login',{})
  })



  route.post('/loginCheck',function(req,res){
    userModel.findOne({$and:[{"email":req.body.email},{"password":req.body.password}]},function(err,result){
      if(err){
        res.send(objGenerator.generatorFn(true,"no user with given id",404,null));
      }
      else if(result==null || result==undefined){
        res.send(objGenerator.generatorFn(true,"user not available",404,null));
      }
      else{
        req.session.user=result;
        delete req.session.user.password;
        res.redirect('/listOfAllProducts');
      }
    })
  })

  route.get('/user/details',auth.settingAuthPerms,function(req,res){
    userModel.findOne({_id:req.session.user._id},function(error,result){
      if(error){res.send(objGenerator.generatorFn(true,"there is no person with the given id",404,null));}
      else{
        res.render('userDetails',{result:result})
      }
    })

  })

  route.get('/user/update',function(req,res){
    res.render('userUpdatingTemp',{result:req.session.user})
  })

  route.post('/user/userDetails/update/:id',function(req,res){
    var update=req.body;
    userModel.findOneAndUpdate({_id:req.params.id},update,function(err,result){
      if(err){res.send(objGenerator.generatorFn(true,"there is no person with the given id",404,null));}
      else{
        res.render('afterUpdationOfUserDetails',{})

      }
    })
  })
  tempAddress="unset";

  route.get('/imageUpload',auth.settingAuthPerms,function(req,res){
    res.render('imageUpload');
  })

  route.post('/productImageUpload',upload.single('photo'),function(req,res){
    console.log('req.file '+req.file);
     console.log(req.file.path);
      tempAddress='/'+req.file.path;
      res.redirect('/productDetailsUpload');
  })

  route.get('/productDetailsUpload',auth.settingAuthPerms,function(req,res){
    res.render('UploadingProductsData',{})
  })

  route.post('/productAdd',function(req,res){
    if(tempAddress=="unset"){res.redirect('/imageUpload')}

    else{
      var newProduct=new productModel({
        'productName':         req.body.productName,
        'productCategory':     req.body.productCategory,
        'productPrice':        req.body.productPrice,
        'productSellerName':   req.body.productSellerName,
        'productDescription':  req.body.productDescription,
        'productReviews':      req.body.productReviews
      })
      propertiesOfProduct={};
      propertiesOfProduct.color=req.body.productColor;
      propertiesOfProduct.material=req.body.productMaterial;
      propertiesOfProduct.quality=req.body.productQuality;

      newProduct.productProperties=propertiesOfProduct;
      newProduct.productImageAddress=tempAddress;

      var str=req.body.productDescription;
      var resultedArray=str.split(".");
      resultedArray.splice(resultedArray.length-1,1);
      newProduct.productDescription=resultedArray;


      newProduct.save(function(err,result){
        if(err){res.send(objGenerator.generatorFn(true,"there is some error while saving in database",404,null));}
        else{
          res.render('thankyouAfterProductCreation',{id:result._id});
        }
      })
    }



  })
  route.get('/displayProduct/:id',function(req,res){
    productModel.findOne({_id:req.params.id},function(err,result){
      if(err){
        res.send(objGenerator.generatorFn(true,"There is no product of the given id",404,null));
        console.log(result);
          }
      else{
        res.render('displayProductData',{

          productName:result.productName,
          productCategory:result.productCategory,
          productPrice:result.productPrice,
          productSellerName:result.productSellerName,
          imageAdd:result.productImageAddress,
          productDescription:result.productDescription,
          productReviews:result.productReviews[0],
          productProperties:result.productProperties,
          productid:result._id
        })
      }

    })
  })

  route.get('/displayProductOnTheBasisOfCategory/:category',auth.settingAuthPerms,function(req,res){
    console.log('req.params.category '+req.params.category);
    productModel.find({'productCategory':req.params.category},function(err,result){
      if(err){
        //console.log(err);
        res.send(objGenerator.generatorFn(true,"There is no product of the given id",404,null));
        //console.log(result);
          }
      else{
        console.log(result);
        res.render('productsList',{obj:result});
      }

    })
  })



  route.get('/listOfAllProducts',auth.settingAuthPerms, function(req,res){
    productModel.find({},function(err,result){
      if(err){res.send(objGenerator.generatorFn(true,"there is no product in database",404,null));}
      else{
        res.render('productsList',{obj:result});
      }
    });
  })

  route.get('/UpdatingProductById/:id',function(req,res){
    productModel.findOne({_id:req.session.user._id},function(err,result){
      if(err){res.send(objGenerator.generatorFn(true,"there is no product with given id",404,null));}
      else{
        res.render('updateProduct',{result:result})
      }
    })
  })
  route.post('/checking',function(req,res){
    console.log("yes here");
  })
  //update
  route.post('/productUpdate/:id',function(req,res){
    console.log("updating");
    var update=req.body;
    productModel.findOneAndUpdate({_id:req.params.id},update,function(err,result){
      if(err){res.send(objGenerator.generatorFn(true,"there is no product to be updated with given id",404,null));}
      else{
        res.render('afterUpdationOfProduct',{result:result})
      }

    })
  })

  // CHECK IT delete a product

  route.get('/deleteProductById/:id',function(req,res){
    res.render('deleteTemplate',{tempid:req.params.id})
  })

  route.post('/productDelete/:id',function(req,res){
    productModel.remove({_id:req.params.id},function(err,result){
      if(err){res.send(objGenerator.generatorFn(true,"Product Could not be removed",404,null));}
      if(result.n!=0)
      res.send(result);
      else {
        res.send("no product with matching id");
      }
    })
  })


  //cart
  route.get('/cart/:id',auth.settingAuthPerms,function(req,res){
    productModel.findOne({_id:req.params.id},function(err,result){
      if(err){res.send(objGenerator.generatorFn(true,"there is no product with the given id",404,null));}
      else{
        var newProductInCart=new cartModel({
          productid:result._id,
          productName:result.productName,
          productPrice:result.productPrice

        })
      }
      var flag=0;
      var flag1='emptyCart';

      userModel.findOne({_id:req.session.user._id},function(error,response){
        if(error){res.send(objGenerator.generatorFn(true,"there is no user with the given id",404,null));}
        else{
          for (var i = 0; i < response.cart.length; i++) {
            flag1='cartNotEmpty';
            if(newProductInCart.productid!=response.cart[i].productid){
              //console.log("there is already we have the product");
              flag=1;
            }
            else{
              flag=0;
              break;
            }

          }
          if(flag1=="emptyCart" || flag==1){
            response.cart.push(newProductInCart);
            response.cartCost=response.cartCost +newProductInCart.productPrice

            response.save(function(error2,finalData){
              if(error2){res.send(objGenerator.generatorFn(true,"there is error while saving the product to your cart",404,null));}
              else{
                console.log(finalData);
                //res.send(finalData);
                res.render('afterAddingtoCart');
              }

            })
          }
          else{
            //console.log("ther");
            res.render('NoDuplicateProductInCartConfirmation',{});
          }

        }

      })
    })
  })

  //viewing cartProducts
  route.get('/user/cartProduct',auth.settingAuthPerms,function(req,res){
    userModel.findOne({_id:req.session.user._id},function(err,response){
      if(err){res.send(objGenerator.generatorFn(true,"there is no product in the database",404,null));}
      else{
        res.render('viewProductsInCart',{cartData:response.cart,cartCost:response.cartCost});
      }
    })
  })

  //deleting cart product

  route.get('/user/cartProduct/:productid',auth.settingAuthPerms,function(req,res){
    userModel.findOne({_id:req.session.user._id},function(err,response){
      if(err){res.send(objGenerator.generatorFn(true,"there is no user with the given id",404,null));}
      else {

        var cartArray=response.cart;
         console.log("reaching here first");
         console.log(response.cart);
         for(var i=0;i<response.cart.length;i++){
           console.log(cartArray[i].productid);
           if(cartArray[i].productid==req.params.productid){
             console.log("reaching here");
             console.log("response.cartCost before "+response.cartCost);
             response.cartCost -= cartArray[i].productPrice;
             console.log("response.cartCost after "+response.cartCost);
             response.cart.splice(i,1);

           }
         }
        console.log(response.cart.length);

      }
      response.save(function(error,result){
        if(error){res.send(objGenerator.generatorFn(true,"there is error while saving the product after deletion from cart",404,null));}
        else{
          res.redirect('/user/cartProduct');
        }

      })
    })


  })

  route.get('/passwordReset',function(req,res){
    res.render('resettingPassword',{})
  })

  // Send Email
  route.post('/send', function(req, res, next){
      var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'your email',
          pass: 'your password'
        }
      });

      var mailOptions = {
        from: '"Lokendra Sharma" <lokssharma99@gmail.com>',
        to: 'lokssharma99@gmail.com',
        subject: 'Hello from eCart',
        text: 'As you have requested for password reset.Kindly copy paste this link '+'http://localhost:3000/password-reset/'+req.body.email

      }

      transporter.sendMail(mailOptions, function(error, info){
        if(error){
        res.send(objGenerator.generatorFn(true,"there is Error whlile sending the message to your id",404,null));
        }
        else{
          console.log('Message Sent: '+ info.response);
          res.send(objGenerator.generatorFn(false,'Successfully Sent mail to your id',200,'Details could not be disclosed'));
        }

      });

  });

  route.get('/password-reset/:email',function(req,res){
    res.render('passwordRestTemplate',{email:req.params.email})
  })

  route.post('/updatePasswordInDatabase/:email',function(req,res){
    var update=req.body;
    userModel.findOneAndUpdate({'email':req.params.email},update,function(err,response){
      if(err){res.send(objGenerator.generatorFn(true,"there is no product to be found with th given id",404,null));}
      else{
          res.redirect('/loginPage');
      }
    })
  })


  route.get('/logOut',function(req,res){
    req.session.destroy(function(err){
      if(err){res.send(objGenerator.generatorFn(true,"Session could not be destroyed",404,null));}
      else res.redirect('/loginPage');
    })
  })

  app.use('/',route);


}
