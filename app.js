'use strict';
const express = require('express'),
  app = express(),
  nodemailer = require('nodemailer'),      
  bodyParser = require('body-parser'),
  pgp = require('pg-promise')(),      
  port = process.env.PORT || 3000,   
  jwt = require('jsonwebtoken'), 
  cookieParser = require('cookie-parser'),
  db = pgp({
    host: 'ec2-23-21-85-76.compute-1.amazonaws.com',
    port: 5432,
    database: 'detamp7dm7n5kt',
    user: process.env.SERVICE_DB_USER || 'smdtzebruscqxv',
    password: process.env.SERVICE_DB_PASS || 'b988acabcae53edc03642deec8eabbbd891f2c549a02100e9f5b134c624ea4cd',    
    ssl: true,
    sslfactory: 'org.postgresql.ssl.NonValidatingFactory'
  }),
  // безопасность gmail  не дает мне отправлять письма :((

   transporter = nodemailer.createTransport({
     service: 'gmail',
     auth: {
       user: process.env.SERVICE_EMAIL || 'gamekh009@gmail.com',
       pass: process.env.SERVICE_EMAIL_PASS || 'SoftServe'
     }
   });

app.set('view engine', 'ejs');

//middlewares
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
   extended: true 
}));
app.use(bodyParser.json());
app.use(cookieParser());

//ROUTES

app.get('/', (req, res) => {
  res.render('login');    
});

app.post("/login", (req, res, next) => { 
    var email = req.body['log-email'];
    var password = req.body['log-pass'];

  db.one(`SELECT * FROM users
    WHERE email = '${email}';`)
  .then(data => {   
    if (!data.password) {
    res.status(401).json({message:"no such user found"});
    }
    if(data.password === password) {    
    // create a token
      var token = jwt.sign(data, 'secret', {
        expiresIn: 60*60*24        
      });
      // return the information including token as JSON
      res.cookie('auth',token); 
      res.redirect('/map');
      // res.json({
      //   success: true,
      //   message: `hello ${data.name}`,
      //   token:token
      // });
    } else {
      res.status(401).json({message:"passwords did not match"});
    }  
  }).catch(err => {     
      res.send('Something went wrong:' + err.message);
  });  
});

app.post('/register', (req, res) => {
  const name = req.body['reg-name'],
        email = req.body['reg-email'],
        pass = req.body['reg-pass'],
        passCheck = req.body['reg-pass-repeat'];  
  if (pass !== passCheck) {
    res.send('Passwords didn\'t match.');
  }
  
  db.none(`insert into users(email, password, reg_date, cash, name)` +
      `values('${email}', '${pass}', '${new Date().toISOString()}', 150, '${name}')`,
    req.body)
    .then(function () {
      var letter = createLetter(email);
       sendMail(letter);
      res.status(200)
        .json({
          status: 'success',
          message: 'Inserted one user'
        });        
    })
    .catch(err => {     
      res.send('Something went wrong:' + err.message);
    });

});

app.use(function(req, res, next){
    var token = req.cookies || req.body.token || req.query.token || req.headers['x-access-token'];    
    if(token.auth){
    jwt.verify(token.auth, 'secret', function(err, decoded){        
       if(err){
       res.json({"message": "Failed to authenticate user", 'error': err.message});
       }
       else{
       req.decoded = decoded;
       next();
       }
       });
    }
    else{
       res.redirect('/'); 
    }
    });
app.get('/map', (req, res) => {
  res.send('hello, it\'s map page');    
});

function createLetter(userEmail){
  return{
    from: '"Game team" <gamekh009@gmail.com>', // sender address
    to: userEmail, // receivers
    subject: 'Hello! new user! ✔', // Subject line
    text: 'Hello! We are glad that you joined our game', // plain text body
    html: '<b>Hello! We are glad that you joined our game!</b>' // html body
  }
}

function sendMail(letter) {
  transporter.sendMail(letter, (error, info) => {
    if (error) {
      console.log(error.message);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

app.listen(port, () => {
  console.log('Listen on port: ' + port);
})
