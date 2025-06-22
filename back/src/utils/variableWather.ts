const EventEmitter = require('events');

export class VariableWatcher extends EventEmitter {
  constructor() {
    super();
    this.variable = null;
  }

  setVariable(value: any) {
    this.variable = value;
    this.emit('variableChanged', value);
  }
}

// const clientsWatcher = new VariableWatcher();

// clientsWatcher.on('variableChanged', (newValue: any) => {
// });
//   clientsWatcher.setVariable(42)