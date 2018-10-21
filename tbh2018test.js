// client side javascript

var evt_callback;

// please delete it.
var out_device = "DAW Thru"
var out_blocks = "2- Pad Block Mini"

var target_note_diff = [0, 3, 5, 7, 10]; // minyo onkai
var prev_target_note = 0x3C;

var fx_knob1 = 65;
var fx_knob2 = 68;

// sequencer
var arp = [];
var dru = [];

var cnt_evt = 0;

function event_interval()
{
    cnt_evt++;
    
    //console.log(cnt_evt);    //cnt_evt = cnt%32;
    var prev_cnt = (cnt_evt-1)%32;
    var curr_cnt = (cnt_evt)%32;
    
    if(cnt_evt == 32) cnt_evt = 0;
    document.getElementById("curr_cnt").innerText = curr_cnt;
    //console.log(arp);
    
    if(arp[prev_cnt].note >= 0) evt_callback([0x80, arp[prev_cnt].note, 0], out_device);
    if(arp[curr_cnt].note >= 0) evt_callback([0x90, arp[curr_cnt].note, arp[curr_cnt].vel ], out_device);
    

    if(dru[prev_cnt].note >= 0) evt_callback([0x81, dru[prev_cnt].note, 0], out_device);
    if(dru[curr_cnt].note >= 0) evt_callback([0x91, dru[curr_cnt].note, dru[curr_cnt].vel ], out_device);
    
    evt_callback([0xB0, 0x14, curr_cnt], out_blocks);
    
}


function init_event_arr(){
    arp = [];
    dru = [];
    for(var i = 0; i < 32;i++)
    {
        var init_arp_event = {};
        init_arp_event.note = -1;
        init_arp_event.vel = -1;
        
        arp.push(init_arp_event);
        
        var init_dru_event = {};
        init_dru_event.note = -1;
        init_dru_event.vel = -1;
        
        dru.push(init_dru_event);
    }
    //console.log(dru);

}

function start_interval(){
    seq_play = setInterval(event_interval, 100);
    init_event_arr();
}

// socket io and handle midi
function easy_arpeggio_exec(){
    
    evt_callback([0x80, prev_target_note, 0], out_device);
    if(arp_play_cnt <= 0){
        clearInterval(arp_play);
    }else{
        arp_play_cnt -= 1;
        var target_note = 0x3C + target_note_diff[Math.floor(Math.random()*5)];
        var target_vel = 127 - ((20-arp_play_cnt) * 5);
        evt_callback([0x90, target_note, target_vel], out_device);
        prev_target_note = target_note;
    }
}

var arp_play;
var arp_play_cnt = 0;

function easy_arpeggio(){
    if(arp_play_cnt == 0){
        arp_play_cnt = 20;
        evt_callback([0x90, 0x3C, 0x7F], out_device);
        prev_target_note = 0x3C;
        arp_play = setInterval(easy_arpeggio_exec, 200);
    }
}

function trigger_arpeggio(){
//    console.log("ttt");
    evt_callback([0xB0, 0x10, 0], out_blocks);
        
    for(var i = 0; i < 20;i++){
        var target_elem = Math.floor(Math.random()*5);
        var target_note = 0x3C + target_note_diff[target_elem];            
        var arp_cnt = (cnt_evt + i)%32;
        arp[arp_cnt].note = target_note;
        arp[arp_cnt].vel = 0x7F;
        //console.log(arp_cnt);
        evt_callback([0xB0, 0x11, arp_cnt], out_blocks);
        evt_callback([0xB0, 0x12, target_elem], out_blocks);



    }
}


function taiko_sound(target_note){
    evt_callback([0x91, target_note, 0x7F], out_device);
    evt_callback([0x81, target_note, 0x00], out_device);

    dru[cnt_evt].note = target_note;
    dru[cnt_evt].vel = 0x7F;

    evt_callback([0xB0, 0x10, 1], out_blocks);
    evt_callback([0xB0, 0x11, cnt_evt], out_blocks);
    evt_callback([0xB0, 0x12, 1], out_blocks);
    //console.log(cnt_evt, dru);
}

function send_fx(x_axis, y_axis){
    //evt_callback([0x], out_device);
    console.log("FX", x_axis, y_axis);
}

var socketio = io.connect('http://localhost:3000');

socketio.on('sensor', function(value){
    //console.log(value, value.value);
    document.getElementById("gyro_x").innerText = value.value['gyro_x'];
    document.getElementById("gyro_y").innerText = value.value['gyro_y'];
    document.getElementById("gyro_z").innerText = value.value['gyro_z'];
    document.getElementById("gyro_pitch").innerText = 
        value.value['gyro_pitch'].angle + ":" +
        value.value['gyro_pitch'].rate;
    document.getElementById("gyro_roll").innerText = 
        value.value['gyro_roll'].angle + ":" +
        value.value['gyro_roll'].rate;
    document.getElementById("gyro_yaw").innerText = 
        value.value['gyro_yaw'].angle + ":" +
        value.value['gyro_yaw'].rate;
    document.getElementById("gyro_rate").innerText = 
        value.value['gyro_rate'].x + ":" +
        value.value['gyro_rate'].y + ":" + 
        value.value['gyro_rate'].z;
    document.getElementById("gyro_isCalibrated").innerText = value.value['gyro_isCalibrated'];

    if(value.value['gyro_x'] >= 140 ||
        value.value['gyro_y'] >=140 ||
        value.value['gyro_z'] >= 140)
    {
        trigger_arpeggio();

    }
    /*if(value.value == 1023){
        easy_arpeggio();
    } */
})

var blk_x_axis;
var blk_y_axis;
var blk_pres;

var playmode = 0; // 0:push 1:fx

function sound_clear(){
    init_event_arr();


    console.log(arp);
}

function trigger_midiin(numArray){
    //if(numArray.length != 3) return;
    switch(numArray[0]){
        case 0xB0:
            switch(numArray[1]){
                case 0x3C:
                
                    blk_x_axis = numArray[2];
                    break;
                case 0x3D:
                    blk_y_axis = numArray[2];
                    break;
                case 0x3E:
                    blk_pres = numArray[2];

                    if(playmode == 0){
                        if(blk_pres < 110) return;
                        taiko_note = 0x30 + Math.round(blk_x_axis/4);
                        console.log(taiko_note);
                        taiko_sound(taiko_note);
                    }else{
                        send_fx(blk_x_axis, blk_y_axis);
                        drawpostmidi(blk_x_axis*x_scale, blk_y_axis*y_scale, blk_pres);
                    }
                    break;
                
            }
            break;
        case 0xF0:
            if(numArray.length != 16)return;
            //console.log("Bri" , numArray);
            if(numArray[10] != 0x10) return;

            console.log("Bri" , numArray[12]/4);
            playmode  = numArray[12]/4;
            disp_clear();
        
            break;
        
    }
}

function registCallBack(target_callback)
{
    evt_callback = target_callback;
}

// com_web_midi

(function () {
    var midiDevices = {
        inputs: {},
        outputs: {}
    };
    function requestSuccess(data) {
        var inputIterator = data.inputs.values();
        for (var input = inputIterator.next(); !input.done; input = inputIterator.next()) {
            var value = input.value;
            midiDevices.inputs[value.name] = value;
            value.addEventListener('midimessage', inputEvent, false);
        }

        var outputIterator = data.outputs.values();
        for (var output = outputIterator.next(); !output.done; output = outputIterator.next()) {
            var value = output.value;
            midiDevices.outputs[value.name] = value;
        }
    }
    function requestError(error) {
        console.error('error!', error);
    }
    function requestMIDI() {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess({sysex : true}).then(requestSuccess, requestError);
        } else {
            requestError();
        }
    }
    function inputEvent(e) {
        var target = e.target;
        var device = midiDevices.outputs[target.name];
        var message = '';
        var numArray = [];
        event.data.forEach(function(val) {
            numArray.push(val);
        });
        trigger_midiin(numArray);
        //console.log(numArray);
    }
    var outputEvent = function(numArray, out)
    {
        var device = midiDevices.outputs[out];
        device.send(numArray);
    }

    requestMIDI();

    registCallBack(outputEvent);


})();


// p5 user front-end

var x_scale = 6;
var y_scale = 3;

var img;
function setup() {
    
  //button.mousePressed(greet);
    
    createCanvas(128*x_scale, 128*y_scale);
    //background(102);
    img = loadImage("./face2.png"); 
    image(img,0,0);

    // count up 
    start_interval();

}
  

// var x: 0-127*x_scale var y: 0-127*y_scale
function drawpostmidi(x, y,w){

    var ww = w/4 + 10;
    strokeWeight(ww);
    //line(mouseX, mouseY, pmouseX, pmouseY);
    point(x,y);
    var x_val = Math.round(x/x_scale);
    var y_val = Math.round(y/y_scale);
    console.log("a", x_val, y_val);
    evt_callback([0xBF, fx_knob1, x_val], out_device);
    evt_callback([0xBF, fx_knob2, y_val], out_device);


    
}

function draw() {
    stroke(103);
    var drawwidth = 20;

    //image(img,0,0);

    //fill(127,0,0);
    if (mouseIsPressed === true &&
        mouseX >= 0 && mouseX <= 128*x_scale &&
        mouseY >= 0 && mouseY <= 128*y_scale) {
            drawpostmidi(mouseX,mouseY, drawwidth);
    }
}

function disp_clear(){
    //background(102);
    //img = loadImage("./face.png"); 

    playmode = !playmode;
    image(img,0,0);
    
    console.log(playmode);
    evt_callback([0xB0, 0x13, playmode], out_blocks);

    if(playmode == 0) sound_clear();
}

