module.exports.generatorFn=function(err,message,status,data){
  var genratedObj={
    error:err,
    message:message,
    status:status,
    data:data
  }
  return genratedObj;
}
