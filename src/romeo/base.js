const DEFAULT_OPTIONS = {
  silent: false,
  logIdent: 'BASE',
  logIdentWidth: 12,
  onLog: () => {},
  onChange: obj => {}
};

/**
 * Base class with generic functionality.
 * @class Base
 */
class Base {
  constructor(options) {
    this.opts = { ...DEFAULT_OPTIONS, ...options };
    this.onChange = this.onChange.bind(this);
  }

  log() {
    if (!this.opts || !this.opts.silent || arguments[0] === '!!') {
      const date = new Date();
      const timeString = `${date.toLocaleTimeString()}.${this.formatMilliseconds(
        date.getMilliseconds()
      )}`;
      const space =
        this.opts.logIdent.length > this.opts.logIdentWidth
          ? `\n${' '.repeat(this.opts.logIdentWidth)}`
          : ' '.repeat(this.opts.logIdentWidth - this.opts.logIdent.length);
      const logIdent = `${this.opts.logIdent}${space}`;
      console.log(`${timeString}\t${logIdent}`, ...arguments);
    }
    this.opts.onLog && this.opts.onLog(Array.from(arguments).join(' '));
  }

  formatMilliseconds(milliseconds) {
    var formatted = milliseconds / 1000;
    formatted = formatted.toFixed(3);
    formatted = formatted.toString();
    return formatted.slice(2);
  }

  onChange() {
    this.opts.onChange && this.opts.onChange(this);
  }
}

module.exports = {
  DEFAULT_OPTIONS,
  Base
};
