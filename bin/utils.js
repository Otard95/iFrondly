/* jshint esversion: 6 */

module.exports = {
  ValidURL: (str) => {
    let pattern = new RegExp('^(https?:\/\/)?'+ // protocol
      '((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|'+ // domain name
      '((\d{1,3}\.){3}\d{1,3}))'+ // OR ip (v4) address
      '(\:\d+)?(\/[-a-z\d%_.~+]*)*'+ // port and path
      '(\?[;&a-z\d%_.~+=-]*)?'+ // query string
      '(\#[-a-z\d_]*)?$','i'); // fragment locater
    if(!pattern.test(str)) {
      return false;
    } else {
      return true;
    }
  },
  checkType: (val, targetType) => {
    switch (targetType) {

      case 'string':
        console.log(typeof val == targetType, typeof val, targetType);
        return (typeof val == targetType);

      case 'number':
        numVal = parseInt(val);
        if (isNaN(numVal)) return false;
        if ('' + numVal == val) return true;
        return false;

      default:
        console.log('type check defaulted');
        return false;

    }
  }
};
