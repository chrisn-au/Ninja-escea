var stream = require('stream')
  , escea_udp = require('./escea_udp') 
  , util = require('util');

// Give our device a stream interface
util.inherits(escea_flameeffect,stream);

// Export it
module.exports=escea_flameeffect;
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
function escea_flameeffect(serial, em, udpcomms) {

  var self = this;
  this.em = em;
  this.serial = serial;
  this.state = false; 
  this.em = em;
  this.comms = udpcomms;
  

  // This device will emit data
  this.readable = true;
  this.writeable = true; //effect will receive data
   
  this.G = "esceafire"+this.serial+"flameeffect"; // G is a string a represents the channel
  this.V = 0; // 0 is Ninja Blocks' device list
  // 238 Relay effect
  this.D = 238; 
   
   this.em.on(serial+'Flameeffect', function(temp){

          self.emit('data',temp === 1 )
          self.state  = temp;
  });

         
  this._interval = setInterval(function() {
        self.emit('data',self.state);     
   },60000);
   
};

escea_flameeffect.prototype.write = function(data) {
    var self = this;
      
     self.comms.controlfire(self.serial, 2, data);
 
};
