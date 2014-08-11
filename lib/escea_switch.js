var stream = require('stream')
  , escea_udp = require('./escea_udp') 
  , util = require('util');

// Give our device a stream interface
util.inherits(escea_switch,stream);

// Export it
module.exports=escea_switch;
/*
 *
 * @property {Boolean} readable Whether the device emits data
 * @property {Boolean} writable Whether the data can be actuated
 *
 * @property {Number} G - the channel of this device
 * @property {Number} V - the vendor ID of this device
 * @property {Number} D - the device ID of this device
 *
 * @property {Function} write Called when data is received from the Ninja Platform
 *
 * @fires data - Emit this when you wish to send data to the Ninja Platform
 */
function escea_switch(serial,em,escea_comms) {

  var self = this;
  this.comms = escea_comms;
  this.em = em;
  this.serial = serial;
  this.state = false; 
  this.em = em;
  
   console.log("Serial # is " + serial);
 
  // This device will emit data
  this.readable = true;
  this.writeable = true; //switch will receive data
   
  this.G = "esceafire"+this.serial; // G is a string a represents the channel
  this.V = 0; // 0 is Ninja Blocks' device list
  // 238 Relay switch
  this.D = 238; 
   
   this.em.on(serial+'State', function(temp){

          self.emit('data',temp)
          self.state  = temp;
  });

         
  this._interval = setInterval(function() {
        self.comms.queryfire(self.serial);
        self.emit('data',self.state);     
   },60000);
   
};

escea_switch.prototype.write = function(data) {
    var self = this;
      
     self.comms.controlfire(self.serial, 1, data);
 
};
  
     
