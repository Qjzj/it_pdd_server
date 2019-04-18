let express = require('express');
let svgCaptcha = require('svg-captcha');

let CORE = require('../utill/CORE');

let router = express.Router();

let db = require('../db/db');

let data = require('../data/home_shoplist.json').data;
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/home',(req,res,next)=> {
  var tempArr = [];
  for(let i=0; i<data.length; i++) {
    let temp = [];
    let DATA = data[i];
    temp.push(DATA.goods_id);
    temp.push(DATA.goods_name);
    temp.push(DATA.short_name);
    temp.push(DATA.image_url);
    temp.push(DATA.thumb_url);
    temp.push(DATA.hd_thumb_url);
    temp.push(DATA.hd_url);
    temp.push(DATA.market_price);
    temp.push(DATA.normal_price);
    temp.push(DATA.sales_tip);
    temp.push(DATA.link_url);
    temp.push(DATA.group.price);
    tempArr.push(temp);
  }
  // res.send(tempArr);
  let str = "INSERT INTO pdd_home_shoplist(goods_id, goods_name, short_name, image_url, thumb_url, hd_thumb_url, hd_url, market_price, normal_price, sales_tip, link_url, price) values ?";
  db.query(str,[tempArr],(err,result)=> {
    if(err) {
      console.log(err.message);
      res.send({
        err_code: 0,
        message: "查询数据出错"
      })
    }else{
      res.send({
        success_code: 200,
        message: result
      })
    }

  })
  
});

// 首页轮播图
router.get('/api/homecasual',(req,res)=> {
  let str = 'SELECT * FROM pdd_homecasual';
  db.query(str,(err, result)=> {
    // errDeal(err,res);

    
    if(err) {
      console.log(err.message);
      res.json({
        err_code: 0,
        message: "查询数据出错"
      })
    }else {
      let data = JSON.parse(JSON.stringify(result));
      res.json({
        success_code: 200,
        message: data
      })
    }
  })
});

// 首页导航Nav
router.get('/api/homenav', (req, res) => {
  let sqlStr = "SELECT * FROM pdd_homenav";
  db.query(sqlStr, (err, result) => {
    let data = JSON.parse(JSON.stringify(result));
    if(err) {
      errDeal(err, res);
    }else {
      res.json({
        success_code: 200,
        message: data
      })
    }
  })
});

// 首页商品数据
router.get('/api/homeshoplist', (req, res) => {
  let current_page = req.query['current_page'] || 1;
  let count = req.query.count || 20;
  let sqlStr = 'SELECT * FROM pdd_home_shoplist LIMIT ' + (current_page - 1) * count + "," + count;

  db.query(sqlStr, (err, result) => {
    if(err) {
      errDeal(err, res);
    }else {
      let data = JSON.parse(JSON.stringify(result));
      res.json({
        success_code: 200,
        message: data
      })
    }
  })
});

// 推荐列表
router.get('/api/recommendshoplist', (req, res) => {
  let offset = req.query.offset || 0;
  let count = req.query.count || 20;

  let sqlStr = 'SELECT * FROM pdd_recommend_shoplist LIMIT ' + offset + "," + count;
  db.query(sqlStr,(err, result)=> {
    if(err) {
      console.log(err.message);
      res.json({
        err_code: 0,
        message: "请求数据错误"
      })
    }else {
      res.json({
        success_code: 200,
        message: result
      })
    }
  })
});

// 搜索列表
router.get('/api/searchlist', (req, res) => {
  let data = require('../data/search');
  res.json({
    success_code: 200,
    message: data.data
  })
});

// 获取图片验证码
router.get('/api/captcha', (req, res) => {
  const config = {
    size: 4,
    ignoreChars: 'i1lo0',
    noise: 3,
    height: 40,
    background: '#f5f5f5'
  };
  let captcha = svgCaptcha.create(config);
  // 保存验证码
  req.session.captcha = captcha.text.toLowerCase();
  res.type('svg');
  res.send(captcha.data);
});

// 获取手机验证码
router.get('/api/phonecaptcha', (req, res) => {
  let phone = req.query.phone;
  let phoneCaptcha = CORE.getCaptcha();
  // 保存验证码
  req.session.captcha = phoneCaptcha;
  req.session.phone = phone;
  console.log(req.session);
  res.json({
    success: 200,
    message: {
      captcha: phoneCaptcha
    }
  })
});

// 密码登录
router.post('/api/pwdlogin', (req, res) => {
  let title = req.body.title;
  let pwd = req.body.pwd;
  let imgCaptcha = req.body.imgCaptcha;
  let newPWD = CORE.encrypt(pwd);

  // 检查验证码是否正确
  if(imgCaptcha.toLowerCase() !== req.session.captcha) {
    res.json({
      err_code: 0,
      message: "验证码错误"
    });
    return;
  }

  // 查询是否有该用户
  let searchStr = "SELECT * FROM pdd_users where title = '" + title + "' LIMIT 1";
  db.query(searchStr, (err, result) => {
    if (err) {
      console.log(err.message);
      res.json({
        err_code: 0,
        message: "数据库错误"
      })
    } else {
      let searchResult = JSON.parse(JSON.stringify(result));
      if (searchResult.length === 0) { // 没有查询到数据
        // 创建该用户
        let createStr = "INSERT INTO pdd_users (title,pwd,salt) values (?, ?, ?)";
        let createData = [title, newPWD.text, newPWD.salt];
        db.query(createStr, createData, (err, result) => {
          if (err) {
            console.log(err.message);
            res.json({
              err_code: 0,
              message: "数据库错误"
            })
          } else {  // 成功创建用户
            result = JSON.parse(JSON.stringify(result));
            // 保存用户session
            req.session.userID = result.insertId;
            // 删除验证码
            req.session.captcha = null;
            res.json({
              success_code: 200,
              message: "登陆成功",
              user_info: {id: result.insertId, phone: '', title: title}
            })
          }
        })
      } else {   // 用户已经存在
        let result = searchResult[0];

        // 判断密码是否正确
        let decryptPWD = CORE.decrypt(pwd, result.salt);
        if(result.pwd === decryptPWD) {
          // 保存用户session
          req.session.userID = result.id;
          // 删除验证码
          req.session.captcha = null;
          res.json({
            success_code: 200,
            message: "登陆成功",
            user_info: {id: result.id, phone: result.phone, title: result.title}
          })
        }else {
          res.json({
            err_code: 200,
            message: "密码错误"
          })
        }
      }
    }
  });
});

// 手机验证码登录
router.post('/api/phonelogin', (req, res) => {
  let phone = req.body.phone;
  let captcha = req.body.phoneCaptcha;

  console.log(phone);
  console.log(req.session);
  // 检测手机号是否正确
  if(phone !== req.session.phone) {
    res.json({
      err_code: 0,
      message: "手机号错误"
    });
    return;
  }

  // 检测验证码是否正确
  if(captcha !== req.session.captcha) {
    res.json({
      err_code: 0,
      message: "验证码错误"
    });
    return;
  }

  // 查询用户是否存在
  let searchStr = "SELECT * FROM pdd_users where phone = '" + phone + "' LIMIT 1";
  db.query(searchStr, (err, result) => {
    if (err) {
      console.log(err.message);
      res.json({
        err_code: 0,
        message: "数据库错误"
      })
    } else {
      let searchResult = JSON.parse(JSON.stringify(result));
      if (searchResult.length === 0) { // 没有查询到数据
        // 创建该用户
        let createStr = "INSERT INTO pdd_users (phone) values (?)";
        let createData = [phone];
        db.query(createStr, createData, (err, result) => {
          if (err) {
            console.log(err.message);
            res.json({
              err_code: 0,
              message: "数据库错误"
            })
          } else {  // 成功创建用户
            result = JSON.parse(JSON.stringify(result));
            // 保存用户session
            req.session.userID = result.insertId;
            // 删除验证码
            req.session.captcha = null;
            req.session.phone = null;
            res.json({
              success_code: 200,
              message: "登陆成功",
              user_info: {id: result.insertId, phone: phone, title: ''}
            })
          }
        })
      } else {   // 用户已经存在
        let result = searchResult[0];

        // 保存用户session
        req.session.userID = result.id;
        // 删除验证码
        req.session.captcha = null;
        req.session.phone = null;

        res.json({
          success_code: 200,
          message: "登陆成功",
          user_info: {id: result.id, phone: result.phone, title: result.title}
        })
      }
    }
  });

});

// 获取用户信息
router.get('/api/getuserinfo', (req, res) => {
   let userID = req.session.userID;
   if(userID === undefined || userID === '' || userID === null) {
     res.json({
       err_code: 0,
       message: "请先登录"
     });
     return ;
   }
   console.log(userID);
   let searchStr = "SELECT * FROM pdd_users WHERE id = " + userID + " LIMIT 1";
   console.log(searchStr);
   db.query(searchStr, (err, result) => {
     if(err) {
       console.log(err.message);
       res.json({
         err_code: 0,
         message: "数据库错误"
       });
     }else {
       result = JSON.parse(JSON.stringify(result));
       console.log(result);
       if(result.length === 0) {  // 没有该用户
         delete req.session.userID;
         res.json({
           err_code: 0,
           message: "请先登录"
         });
       }else {   // 查到该用户
         res.json({
           success_code: 200,
           user_info: {id: result[0].id, title: result[0].title}
         })
       }
     }
   })
});

// 退出登录
router.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({
    success_code: 200,
    message: "退出登录成功"
  })
});

function errDeal(err,res) {
  console.log(err.message);
  res.send({
    err_code: 0,
    message: "查询数据出错"
  })
}

module.exports = router;
