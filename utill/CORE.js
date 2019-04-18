const md5 = require('md5');

const character = ['a', 'b', 'c' , 'd', 'e', 'f' ,'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 'd', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const randomSalt = (length = 6) => {
    let salt = '';
    for(let i=0; i<length; i++) {
        let num = Math.floor(Math.random() * character.length);
        salt += character[num];
    }
    return salt;
};

exports.encrypt = (pwd)=> {
    let salt= randomSalt();
    let text = md5(pwd + salt);
    return {
        text,
        salt
    }
};

exports.decrypt = (pwd, salt) => {
    return md5(pwd + salt);
};

exports.getCaptcha = (length=6) => {
  let numArr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  let captcha = '';
  for(let i=0; i<length; i++) {
      let num = Math.floor(Math.random()*numArr.length); // 获取随机下标
      captcha += numArr[num];
  }
  return captcha;
};