var stream = require('stream')
  , dgram = require('dgram')
  , util = require('util');

// Give our device a stream interface
util.inherits(Escea_udp, stream);

// Export it
module.exports = Escea_udp;

var FIRE_CONTROL = 1
var FLAME_EFFECT_CONTROL = 2

var I_AM_A_FIRE = 0x90;
var STATUS = 0x80;
var POWER_ON_ACK = 0x8D;
var POWER_OFF_ACK = 0x8F;
var FLAME_EFFECT_ON_ACK = 0x61;
var FLAME_EFFECT_OFF_ACK = 0x60;
var NEW_SET_TEMP_ACK = 0x66;

var STATUS_PLEASE = 0x31; 
var POWER_ON = 0x39;
var POWER_OFF = 0x3A;
var SEARCH_FOR_FIRES =  0x50;
var FLAME_EFFECT_ON = 0x56;
var FLAME_EFFECT_OFF =  0x55;
var NEW_SET_TEMP = 0x57;

var ROOM_TEMP = 8
var TARGET_TEMP = 7
var FIRE_STATUS = 4
var FLAME_EFFECT_STATUS = 6
var MSG_START = 0x47
var MSG_END = 0x46 

var ON = 1
var OFF = 0
var NULL = 0x0

function Escea_udp(notify) {
  var self = this;
  this.notifier = notify
  this.client = dgram.createSocket('udp4');
  firelist = new Array();
  this.firelist = firelist;
  this.client.bind(3300, function() {

    self.client.setBroadcast(true);

    self.client.on("message", function(msg, rinfo) {
        var serial = NULL;
               
        self.firelist.forEach(function(entry) {
                if (entry.ipaddress == rinfo.address) { serial = entry.serial };
        });
        
        switch(msg[1]){
          
           case I_AM_A_FIRE:  
              var item = {ipaddress:rinfo.address , serial:msg.readUInt32BE(3,false),
                                    pin:msg.readUInt16BE(7,false) };
              if (serial == NULL) {
        	   	 firelist.push(item); 
                 self.notifier.emit("Fireplace",item.serial);     
              }
              else
              {
                   self.firelist.forEach(function(entry) {
                      if (entry.ipaddress == rinfo.address){
                            if (entry.serial != msg.readUInt32BE(3,false)){
                                 self.log.info(serial + ' changed IP address');
                                 entry.serial = msg.readUInt32BE(3,false) ;
                                 self.notifier.emit("Fireplace",item.serial);     
                            };                        
                         };
                      });
              }                   
              break;
        
          case STATUS: 
        
              self.notifier.emit(serial+"Roomtemp",msg[ROOM_TEMP]);
              self.notifier.emit(serial+"Targettemp",msg[TARGET_TEMP]); 
              self.notifier.emit(serial+"State",msg[FIRE_STATUS]); 
              self.notifier.emit(serial+"Flameeffect",msg[FLAME_EFFECT_STATUS]);  
             
              break;
              
          case POWER_ON_ACK:
          
              self.notifier.emit(serial+"State",ON);
              break;
          
           case POWER_OFF_ACK:
          
              self.notifier.emit(serial+"State",OFF );
              break;
                  
            case FLAME_EFFECT_ON_ACK:
          
              self.notifier.emit(serial+"Flameeffect",ON);
              break;
          
           case FLAME_EFFECT_OFF_ACK:
          
              self.notifier.emit(serial+"Flameeffect",OFF);
              
              break;
    
            case NEW_SET_TEMP_ACK:

    //          self.notifier.emit(serial+"Targettemp",true);
              break;
         }        

    });
  });


}

Escea_udp.prototype.processMessage = function(ipa, message) {
 
  this.client.send(message, 0, message.length, 3300, ipa, function(err, bytes) {
    if (err) throw err;
  });

};

buildmessage = function(action)
{
  var message = new Buffer(16);

  message[0] = MSG_START;
  message[1] = action;
  for (var i = 2; i < 14; i++) {
    message[i] = NULL;
  }
  message[14] = action;
  message[15] = MSG_END;
  return(message)
}

buildmessageSetTemp = function(action,temp)
{
  var message = new Buffer(16);

  message[0] = MSG_START;
  message[1] = action;
  message[2] = 1; // sizeof data
  message[3] = temp; 
  for (var i = 4; i < 14; i++) {
    message[i] = NULL;
  }
  message[14] = action+1+1;
  message[15] = MSG_END;
  return(message)
}
 
Escea_udp.prototype.discover = function() {
  var self = this;
  var broadcastip = "255.255.255.255";
  
  this.processMessage(broadcastip, buildmessage(SEARCH_FOR_FIRES));
  
};


Escea_udp.prototype.queryfire = function(fire) {
 
  var self = this;
 
  this.firelist.forEach(function(entry) {
      if (entry.serial == fire)
           { self.processMessage(entry.ipaddress, buildmessage(STATUS_PLEASE));};
   });


};

Escea_udp.prototype.controlfire = function(fire, mode, state) {

  var self = this;
  var fs;
 
  if (mode == FIRE_CONTROL && state == ON) {  fs = POWER_ON; } 
  if (mode == FIRE_CONTROL && state == OFF) {  fs = POWER_OFF; }
  if (mode == FLAME_EFFECT_CONTROL && state == ON) {  fs = FLAME_EFFECT_ON; }
  if (mode == FLAME_EFFECT_CONTROL && state == OFF) {  fs = FLAME_EFFECT_OFF; }
  
  this.firelist.forEach(function(entry) {
        if (entry.serial == fire)
                { self.processMessage(entry.ipaddress, buildmessage(fs));}
  });

};

Escea_udp.prototype.settemp = function(fire, temp) {

  var self = this;
  var fs = NEW_SET_TEMP;

  this.firelist.forEach(function(entry) {
        if (entry.serial == fire)
                { self.processMessage(entry.ipaddress, buildmessageSetTemp(fs,temp));}
  });

};

