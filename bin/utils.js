/* jshint esversion: 6 */

module.exports = {
  ValidURL: (str) => {
    let pattern = new RegExp('(((https|http)?)(?=://))' + // protocol
                              '(www.)?[a-zA-Z]{1,}\.[a-zA-Z]{1,8}');
    return pattern.test(str);
  },
  checkType: (val, targetType) => {
    switch (targetType) {

      case 'string':
        return (typeof val == targetType);

      case 'number':
        numVal = parseInt(val);
        if (isNaN(numVal)) return false;
        if ('' + numVal == val) return true;
        return false;

      default:
        return false;

    }
  }
};
