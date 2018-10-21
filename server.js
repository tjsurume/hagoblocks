
// server side javascript

'use strict';

var five = require("johnny-five");
var board = new five.Board({
    port : "COM8"
});

var sensor_data = {
    gyro_x: 0,
    gyro_y: 0,
    gyro_z: 0,
    gyro_pitch: 0,
    gyro_roll: 0,
    gyro_yaw: 0,
    gyro_rate: 0,
    gyro_isCalibrated: 0
};

board.on("ready", function(){
    var html = require('fs').readFileSync('tbh2018test.html');
    var http = require('http').createServer(function(req, res){
        res.writeHead(200, {
            'Context-Type' : 'text/html'
        });
        res.end(html);
    });

    var io = require('socket.io')(http);
    http.listen(3000);

    var socket;
    io.sockets.on('connection', function(s) {
         socket =s;
    });

    //const s = new five.Sensor('A0');
    /*s.on('change', v => {
        console.log(v);
        if(socket) socket.emit('sensor', {value: v});
    });*/
    var imu = new five.IMU({
        controller: "MPU6050"
    });

    imu.on("change", function() {
        sensor_data.gyro_x = this.gyro.x;
        sensor_data.gyro_y = this.gyro.y;
        sensor_data.gyro_z = this.gyro.z;
        sensor_data.gyro_pitch = this.gyro.pitch;
        sensor_data.gyro_roll = this.gyro.roll;
        sensor_data.gyro_yaw = this.gyro.yaw;
        sensor_data.gyro_rate = this.gyro.rate;
        sensor_data.gyro_isCalibrated = this.gyro.isCalibrated;
        if(socket){
            socket.emit('sensor', {value:sensor_data})

        }


    });
})