const express = require('express');
const app = express();
app.use(express.static('public'));
app.listen(8080);

// https://www.npmjs.com/package/robotjs
const robot = require("robotjs");
const screenSize = robot.getScreenSize();

const calibration = {
    scalar : {yaw:10, pitch:10, roll:1},
    offset : {yaw:0, pitch:0, roll:0},
    recalibrate : true,
    calibrate({yaw, pitch, roll}) {
        if(this.recalibrate) {
            this.offset.yaw = yaw;
            this.offset.roll = roll;
            this.offset.pitch = pitch;

            this.recalibrate = false;
        }
    },
    toDegrees(radians) {
        return radians * 180 / Math.PI;
    }
}

let control = true;
let mode = 'mouse';

const io = require('socket.io')(3000);
io.on('connection', socket => {
    socket.on('accelerometer', data => {
        const {timestamp} = data;
        const {x, y, z} = data;
    });
    socket.on('gyroscope', data => {
        const {timestamp} = data;
        const {x, y, z} = data;
    });
    socket.on('rotation', data => {
        const {timestamp} = data;
        const {x, y, z, w} = data;
        const {yaw, pitch, roll} = data;
    });

    socket.on('gameRotation', data => {
        if(!control) return;

        const {timestamp} = data;
        const {x, y, z, w} = data;
        let {yaw, pitch, roll} = data;

        calibration.calibrate(data);

        yaw = ((yaw - calibration.offset.yaw) * calibration.scalar.yaw);
        pitch = ((pitch - calibration.offset.pitch) * calibration.scalar.pitch);
        roll = ((roll - calibration.offset.roll) * calibration.scalar.roll);

        yaw /= 2*Math.PI;
        pitch /= 2*Math.PI;
        roll /= 2*Math.PI;

        pitch *= -1;

        switch(mode) {
            case 'mouse':
                const screenX = screenSize.width * (0.5 + yaw);
                const screenY = screenSize.height * (0.5 + pitch);
                robot.moveMouse(screenX, screenY);
                break;
            case 'scroll':
                const scrollX = Math.floor(100*yaw);
                const scrollY = Math.floor(100*pitch);
                robot.scrollMouse(0, -scrollY);
                //robot.scrollMouse(-scrollX, 0);
                break;
        }
    });

    socket.on('singleTap', data => {
        const {timestamp} = data;
    });
    socket.on('doubleTap', data => {
        const {timestamp} = data;
        robot.mouseClick();
    });
    socket.on('headNod', data => {
        const {timestamp} = data;
        robot.keyTap('y', 'control');
    });
    socket.on('headShake', data => {
        const {timestamp} = data;
        robot.keyTap('z', 'control');
    });

    socket.on('recalibrate', () => {
        console.log('recalibrate');
        calibration.recalibrate = true;
    });

    socket.on('disabled', () => {
        console.log('disabled');
        control = false;
    });
    socket.on('enable', () => {
        console.log('enable');
        control = true;
    });

    socket.on('click', () => {
        console.log('click');
        robot.mouseClick();
    });
    socket.on('double-click', () => {
        console.log('double-click');
        robot.mouseClick('left', true);
    });
    socket.on('right click', () => {
        console.log('right click');
        robot.mouseClick('right');
    });

    socket.on('mouse down', () => {
        console.log('mouse down');
        robot.mouseToggle('down');
    });
    socket.on('mouse up', () => {
        console.log('mouse up');
        robot.mouseToggle('up');
    });

    socket.on('undo', () => {
        console.log('undo');
        robot.keyTap('z', 'control');
    });
    socket.on('redo', () => {
        console.log('redo');
        robot.keyTap('y', 'control');
    });

    socket.on('mouse', () => {
        console.log('mouse');
        calibration.recalibrate = true;
        mode = 'mouse';
    });
    socket.on('scroll', () => {
        console.log('scroll');
        calibration.recalibrate = true;
        mode = 'scroll';
    });
});