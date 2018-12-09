const express = require('express');
const app = new express.Router();
const multer = require('multer');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const probe = require('node-ffprobe');
//-----Configure S3 bucket--------------
let  s3 = new aws.S3(); 
aws.config.update({ 
    secretAccessKey: 'your aws secret access key', 
    accessKeyId: 'your aws access key id',
    region: 'provide region of bucket'
});
//-------------------------------------

//-----Initialize s3 multer for file uplaod-------
let uploads3 = multer({ storage: multerS3({      
        s3: s3,
        bucket: 'bucket name',
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            //validate here for file type
            if(file.mimetype == 'image/png' || file.mimetype == 'image/jpg' || file.mimetype == 'image/png' ||                        file.mimetype == 'image/jpeg' || file.mimetype == 'image/tiff' || file.mimetype == 'image/bmp'){
            file.originalname =  'file-'+Date.now()+'-'+file.originalname
            cb(null, file.originalname) //use Date.now() for unique file keys
            }else{   
            // if file type is audio execute here and call getDuration function 
            file.chapterName = file.originalname
            file.originalname = 'file-'+Date.now()+'-'+file.originalname
            cb(null, file.originalname); //use Date.now() for unique file keys
            }
        }
    })
});
//-------------------------------

//-----Get duration from s3 link-------
let getDuration = async (value) => {
   let temp = req.files.map((v,i)=>{
    if(v.mimetype == 'application/pdf'){
        return empty(v);
    }else{

        return getDurationFromLink(v);
    }
    })
    //-----Use of then()------
    Promise.all(temp).then((results)=>{
        results = results.filter(Boolean);
        req.files = results;
        next(null, res);
    }).catch((err)=>{
        res.send(err);
    })

    //----Use of Async await approach eliminate the callback-----
    let results = await Promise.all(temp);
        results = results.filter(Boolean);
        req.files = results;
        next(null, res);
}

let empty = (v) => {
    return new Promise((resolve, reject)=>{
        if(!v) return resolve();
        return resolve(v);
    })
}

var getDurationFromLink = (value) => {
    return new Promise((resolve,reject)=>{
        if(!value) return resolve();
        value = Object.assign({},value);
        let track = value.location;
        probe(track, function(err, probeData) {
            if(err) return reject(err);
            value.duration =  probeData.format.duration;
            return resolve(value);
        });      
    })
}


//--------------------------------------

app.post('/uploadFile', uploads3.any(), getDuration) //----Express Route---
module.exports = app;
