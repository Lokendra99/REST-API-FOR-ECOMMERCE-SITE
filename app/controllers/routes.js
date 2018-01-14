var express=require('express');
var mongoose=require('mongoose');
var nodemailer=require('nodemailer');
var multer=require('multer');
var upload = multer({ dest: 'uploadedData' });
var route=express.Router();

var objGenerator=require('../../library/generator');
var auth=require('../../middlewares/auth');

var user=require('../models/Users');
var product=require('../models/Products');

var userModel=mongoose.model('userModel');
var productModel=mongoose.model('productModel');
var cartModel=mongoose.model('cartModel');


 module.exports.controller=function(app){

  //// SIGNUP STARTS ///////
  route.get('/signUpPage',function(req,res){
    res.render('signUp',{})
  });

  route.post('/signUpInfo',function(req,res){

    req.checkBody('firstName','firstName is required').notEmpty();
    req.checkBody('lastName','lastName is required').notEmpty();
    req.checkBody('email','email is required').notEmpty();
    req.checkBody('password','password is required').notEmpty();


    var validationErrors=req.validationErrors();
    if(validationErrors){
      res.render('signUp',{validationErrors:validationErrors})
    }
    else{
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
            res.send(objGenerator.generatorFn(true,"User with this email id already exists",404,null));
          }
          else{
            req.session.user=newUser;
            delete req.session.user.password;
            req.flash('success','Signup successfull');
            res.redirect('/listOfAllProducts');
          }
        });
    }
  });

  ////Sign Up Ends/////


  ////login start/////
  route.get('/loginPage',function(req,res){
    res.render('login',{})
  })

  route.post('/loginCheck',function(req,res){
    req.checkBody('email','email is required').notEmpty();
    req.checkBody('password','password is required').notEmpty();

    var validationErrors=req.validationErrors();
    if(validationErrors){
      res.render('login',{validationErrors:validationErrors})
    } else{
      userModel.findOne({$and:[{"email":req.body.email},{"password":req.body.password}]},function(err,result){
        if(err){
          res.send(objGenerator.generatorFn(true,"no user with given id",404,null));
        }
        else if(result==null || result==undefined){
          res.send(objGenerator.generatorFn(true,"user not available",404,null));
        }
        else{
          req.flash('success','login successfull');
          req.session.user=result;
          delete req.session.user.password;
          res.redirect('/listOfAllProducts');
        }
      })
    }


  })
  ////LOGIN Ends////


  /// GET req to display user details ///
  route.get('/user/details',auth.settingAuthPerms,function(req,res){
    userModel.findOne({_id:req.session.user._id},function(error,result){
      if(error){res.send(objGenerator.generatorFn(true,"there is no person with the given id",404,null));}
      else{
        res.render('userDetails',{result:result})
      }
    })

  })

  //GET req to update user details//
  route.get('/user/update',auth.settingAuthPerms,function(req,res){
    res.render('userUpdatingTemp',{result:req.session.user})
  })

  route.post('/userDetails/update/:id',auth.settingAuthPerms,function(req,res){
    req.checkBody('firstName','firstName is required').notEmpty();
    req.checkBody('lastName','lastName is required').notEmpty();
    req.checkBody('email','email is required').notEmpty();

    var validationErrors=req.validationErrors();
    if(validationErrors){
      res.render('userUpdatingTemp',{result:req.session.user,validationErrors:validationErrors})
    }
    else{
      var update=req.body;
      userModel.findOneAndUpdate({_id:req.params.id},update,function(err,result){
        if(err){res.send(objGenerator.generatorFn(true,"there is already a person with this email",404,null));}
        else{
          req.flash('success','Details updated');
          res.redirect('/user/details')
        }
      })
    }
  })
  //user details updated//


  tempAddress="unset";

  //GET req to upload image of a product and saving the uploaded `IMAGE ADDRESS` to each product
  route.get('/imageUpload',auth.settingAuthPerms,function(req,res){
    res.render('imageUpload');
  })

  route.post('/productImageUpload',auth.settingAuthPerms,upload.single('photo'),function(req,res){
      console.log('req.file '+req.file);
       console.log(req.file.path);
        tempAddress='/'+req.file.path;
        req.flash('success','Image uploaded');
        res.redirect('/productDetailsUpload');
  })

  //GET req to add product details and saving to DB.
  route.get('/productDetailsUpload',auth.settingAuthPerms,function(req,res){
    res.render('UploadingProductsData',{})
  })

  route.post('/productAdd',auth.settingAuthPerms,function(req,res){

    req.checkBody('productName','productName is required').notEmpty();
    req.checkBody('productCategory','productCategory is required').notEmpty();
    req.checkBody('productPrice','productPrice is required').notEmpty();
    req.checkBody('productSellerName','productSellerName is required').notEmpty();
    req.checkBody('productDescription','productDescription is required').notEmpty();
    req.checkBody('productColor','productColor is required').notEmpty();
    req.checkBody('productMaterial','productMaterial is required').notEmpty();
    req.checkBody('productQuality','productQuality is required').notEmpty();

    var validationErrors=req.validationErrors();
    if(validationErrors){
      res.render('UploadingProductsData',{validationErrors:validationErrors})
    }
    else{
      //to make sure that user uploads the image of the product
      if(tempAddress=="unset"){res.redirect('/imageUpload')}
      else{
        var newProduct=new productModel({
          'productName':         req.body.productName,
          'productCategory':     req.body.productCategory,
          'productPrice':        req.body.productPrice,
          'productSellerName':   req.body.productSellerName,
          'productDescription':  req.body.productDescription
        })
        propertiesOfProduct={};
        propertiesOfProduct.color=req.body.productColor;
        propertiesOfProduct.material=req.body.productMaterial;
        propertiesOfProduct.quality=req.body.productQuality;

        newProduct.productProperties=propertiesOfProduct;
        newProduct.productImageAddress=tempAddress;

        //converting the descriptions into array form to display it better in view.
        var str=req.body.productDescription;
        var resultedArray=str.split(".");
        resultedArray.splice(resultedArray.length-1,1);
        newProduct.productDescription=resultedArray;


        newProduct.save(function(err,result){
          if(err){res.send(objGenerator.generatorFn(true,"there is alreay a product with this name ",404,null));}
          else{
            req.flash('success','your product has been created')
            res.redirect('/displayProduct/'+result._id);
          }
        })
      }
    }
  })

  //To display product on the basis of a unique id of each product
  route.get('/displayProduct/:id',function(req,res){
    productModel.findOne({_id:req.params.id},function(err,result){
      if(err){
        res.send(objGenerator.generatorFn(true,"There is no product of the given id",404,null));
        //console.log(result);
      }

      else{
        console.log(result);
        res.render('displayProductData',{result:result})
      }
    })
  })

  //to display product on the basis of category
  route.get('/displayProductOnTheBasisOfCategory/:category',function(req,res){
    productModel.find({'productCategory':req.params.category},function(err,result){
      if(err){
        res.send(objGenerator.generatorFn(true,"There is no product of the given category",404,null));
      }
      else if(result.length==0){
        res.send(objGenerator.generatorFn(true,"There is no product of the given category",404,null));
      }
      else{
        res.render('productsList',{obj:result});
      }
    })
  })


  //to display all the product present in DB
  route.get('/listOfAllProducts', function(req,res){
    productModel.find({},function(err,result){
      if(err){res.send(objGenerator.generatorFn(true,"there is no product in database",404,null));}
      else{
        res.render('productsList',{obj:result});
      }
    });
  })

  //updating a product on the basis of product id.
  route.get('/updatingProductById/:id',auth.settingAuthPerms,function(req,res){
    productModel.findOne({_id:req.params.id},function(err,result){
      if(err){res.send(objGenerator.generatorFn(true,"there is no product with given id",404,null));}
      else{
        res.render('updateProduct',{result:result})
      }
    })
  })


  route.post('/productUpdate/:id',auth.settingAuthPerms,function(req,res){
    req.checkBody('productName','productName is required').notEmpty();
    req.checkBody('productCategory','productCategory is required').notEmpty();
    req.checkBody('productPrice','productPrice is required').notEmpty();
    req.checkBody('productSellerName','productSellerName is required').notEmpty();
    req.checkBody('productDescription','productDescription is required').notEmpty();
    req.checkBody('productColor','productColor is required').notEmpty();
    req.checkBody('productMaterial','productMaterial is required').notEmpty();
    req.checkBody('productQuality','productQuality is required').notEmpty();

    var validationErrors=req.validationErrors();
    if(validationErrors){
      productModel.findOne({_id:req.params.id},function(err,result){
        if(err){res.send(objGenerator.generatorFn(true,"there is no product with given id",404,null));}
        else{
          res.render('updateProduct',{result:result,validationErrors:validationErrors})
        }
      })
    }
    else{
      var update=req.body;
      productModel.findOneAndUpdate({_id:req.params.id},update,function(err,result){
        if(err){res.send(objGenerator.generatorFn(true,"there is no product to be updated with given id",404,null));}
        else{
          req.flash('success','your product details have been updated')
          res.redirect('/displayProduct/'+result._id);
        }
      })
    }
  })

  // Deleting a product

  route.get('/deleteProductById/:id',auth.settingAuthPerms,function(req,res){
    res.render('deleteTemplate',{tempid:req.params.id})
  })

  route.post('/productDelete/:id',auth.settingAuthPerms,function(req,res){
    productModel.remove({_id:req.params.id},function(err,result){
      if(err){res.send(objGenerator.generatorFn(true,"Product Could not be removed as the given id not valid",404,null));}
      //console.log('resultOfDeletion'+result);
      if(result=undefined){
        req.flash('success','product deleted');
        res.redirect('/listOfAllProducts');
      }

      else {
        res.send("no product with matching id");
      }
    })
  })


  //to add product to the user cart
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
      if(newProductInCart!=undefined){
        console.log('newProductInCart'+newProductInCart);
        var flag=0;
        var flag1='emptyCart';

        userModel.findOne({_id:req.session.user._id},function(error,response){
          if(error){res.send(objGenerator.generatorFn(true,"there is no user with the given id",404,null));}
          else{
            for (var i = 0; i < response.cart.length; i++) {
              flag1='cartNotEmpty';
              if(newProductInCart.productid!=response.cart[i].productid){
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
                  req.flash('success','product has been added to your cart');
                  res.redirect('/listOfAllProducts');
                }
              })
            }
            else{
              req.flash('error','this product is already in your cart');
              res.redirect('/listOfAllProducts');
            }
          }
        })
      }

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
             response.cartCost -= cartArray[i].productPrice;
             response.cart.splice(i,1);
           }
         }
      }
      response.save(function(error,result){
        if(error){res.send(objGenerator.generatorFn(true,"there is error while saving the product after deletion from cart",404,null));}
        else{
          res.redirect('/user/cartProduct');
        }

      })
    })
  })

  //resetting user password
  route.get('/passwordReset',function(req,res){
    res.render('resettingPassword',{})
  })

  // Send Email
  route.post('/send', function(req, res, next){
      var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'eCartShopping398@gmail.com',
          pass: 'LOkendra99@'
        }
      });

      var mailOptions = {
        from: '"eCart" <eCartShopping398@gmail.com>',
        to: req.body.email,
        subject: 'Hello from eCart',
        text: 'As you have requested for password reset.Kindly click this link '+'http://localhost:3000/password-reset/'+req.body.email

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

    req.checkBody('password','password is required').notEmpty();

    var validationErrors=req.validationErrors();
    if(validationErrors){
      res.render('passwordRestTemplate',{email:req.params.email,validationErrors:validationErrors})
    }
    else{
      var update=req.body;
      userModel.findOneAndUpdate({'email':req.params.email},update,function(err,response){
        if(err){res.send(objGenerator.generatorFn(true,"there is no user with th given id",404,null));}
        else{
          req.flash('success','password updated');
          res.redirect('/loginPage');
        }
      })
    }
  })

  //logout request
  route.get('/logOut',function(req,res){
    req.session.destroy(function(err){
      if(err){res.send(objGenerator.generatorFn(true,"Session could not be destroyed",404,null));}
      else res.redirect('/loginPage');
    })
  })

  app.use('/',route);


}
