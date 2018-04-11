'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('./base'),
    BaseGuard = _require.BaseGuard;

var LedgerGuard = function (_BaseGuard) {
  _inherits(LedgerGuard, _BaseGuard);

  function LedgerGuard() {
    _classCallCheck(this, LedgerGuard);

    return _possibleConstructorReturn(this, (LedgerGuard.__proto__ || Object.getPrototypeOf(LedgerGuard)).apply(this, arguments));
  }

  return LedgerGuard;
}(BaseGuard);

module.exports = LedgerGuard;