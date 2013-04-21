/*
    _4WD controller platform.

    This is some base code to be used to control the DF Robot 4WD platform
    that utilises and Arduino with an Ardumotor control from Sparkfun.

    It's essentially designed to be controlled from a serial connection
    rather than autonomous though that could also be done too.
    
    Serial connection sends two bytes each time:
     Byte 1: Forward / Reverse speed 0 - 255
     Byte 2: Left / Right speed 0 - 255
     Byte 3: End \n

*/

// used to create a range for the values we pass over serial - usually 128
// but can be anything to create a workable range if you're typing commands
// in you won't have much range to work with
#define CORRECTION_VAL 64 
#define CORRECTION_MULTIPLIER (256 / CORRECTION_VAL)

// used to determine if we should just stop the motors because
// under this this there's too much friction to overcome.
#define MOTOR_THRESHOLD 45

enum DIRECTION {
    STOP,
    FORWARD,
    REVERSE,
} direction;

// this is all per ArduMotor example.
int pwm_right = 3;   //PWM control for motor outputs 1 and 2 is on digital pin 3
int pwm_left = 11;  //PWM control for motor outputs 3 and 4 is on digital pin 11
int left_motor = 13;  //direction control for motor outputs 1 and 2 is on digital pin 12
int right_motor = 12;  //direction control for motor outputs 3 and 4 is on digital pin 13

// what are we currently driving
int16_t fwd_vel = 0; // +ive is forward, -ive is reverse
int16_t turn_vel = 0; // -ive is left, +ive is right.

// what do we need to work to
int16_t next_fwd_vel = 0; // +ive is forward, -ive is reverse
int16_t next_turn_vel = 0; // -ive is left, +ive is right.

boolean message_complete = false;  // whether the string is complete
boolean values_changed = false;

void setup() {

    pinMode(pwm_right, OUTPUT);  
    pinMode(pwm_left, OUTPUT);
    pinMode(left_motor, OUTPUT);
    pinMode(right_motor, OUTPUT);

    Serial.begin(9600);
    Serial.println("Welcome to the Mobile platform. Bytes are Fwd vel, turn vel and newline to drive");
}

void loop() { 

    // check for a message and then start interpolating values.
    if (message_complete) {
        // iterate over the items and then do that action.
        Serial.println("New messages");
        Serial.print("Forward vel: ");
        Serial.print(next_fwd_vel);
        Serial.print(" Turn vel: ");
        Serial.println(next_turn_vel);
        message_complete = false;

        // TODO Interpolate values appropriately.
        fwd_vel = next_fwd_vel;
        turn_vel = next_turn_vel;
        values_changed = true;
    }
    if (values_changed) {
        set_motor_velocities(fwd_vel, turn_vel);
        values_changed = false;
    }
}

void serialEvent() {
    // uses the library serial event to execute after the main loop
    // we wait until the buffer has at least three bytes in it as we 
    // use a 3 byte message (fwd vel, turn vel and \n)
    while (Serial.available() > 2) {
        // get the new byte off the serial connection.
        uint8_t vel_byte = (uint8_t)Serial.read();
        uint8_t turn_byte = (uint8_t)Serial.read();
        char end_byte = (char)Serial.read();

        if (end_byte == '\n') {
            message_complete = true;
            next_fwd_vel = (vel_byte - CORRECTION_VAL) * CORRECTION_MULTIPLIER;
            next_turn_vel = (turn_byte - CORRECTION_VAL) * CORRECTION_MULTIPLIER;
        }
    }

    set_motor_velocities(fwd_vel, turn_vel);
}

void set_motor_velocities(int16_t fwd, int16_t turn) {
    // looks at the amounts set for the velocities and the direction and then
    // sets the left and right motors appropriately.

    // set things up for the independent wheels.
    DIRECTION l_dir = FORWARD;
    DIRECTION r_dir = FORWARD;
    int16_t l_speed = fwd;
    int16_t r_speed = fwd;

    // set master forward or back direction.
    if (fwd < 0) {
        // we're going bacwards
        l_dir = REVERSE;
        r_dir = REVERSE;
    } else if (fwd == 0) {
        l_dir = STOP;
        r_dir = STOP;
    }

    // now we calculate any left / right differential.
    // this works by calculating the speed of the wheel that should continue
    // then looking at the scale of the turn (0-255) and mapping that
    // against the wheel speed. This gives an amount that the other
    // wheel should turn (either slow down or potentially reverse)
    // resulting in a gentle turn where one just slows down a touch or
    // an agressive turn where one wheel reverses out to spin the rover on 
    // the spot
    if (abs(fwd) > MOTOR_THRESHOLD) {
        // we're moving either forward or backwards. 
        if (turn < 0) {
            // turning left
            l_speed = r_speed - (2 * map(abs(turn), 0, 255, 0, r_speed));
            if (l_speed < 0) {
                if (fwd > 0) {
                    l_dir = REVERSE;
                } else if (fwd < 0) {
                    l_dir = FORWARD;
                }
            }
        } else if (turn > 0) {
            // turning right;
            r_speed = l_speed - (2 * map(abs(turn), 0, 255, 0, l_speed));
            if (r_speed < 0) {
                if (fwd > 0) {
                    r_dir = REVERSE;
                } else if (fwd < 0) {
                    r_dir = FORWARD;
                }
            }
        }
    } else {
        // we're stationary so we should do the spin on the spot trick.


    }

    Serial.print("Fwd: ");
    Serial.print(fwd);
    Serial.print(" Turn: ");
    Serial.print(turn);
    Serial.print(" S(l): ");
    Serial.print(l_speed);
    Serial.print(" S(r): ");
    Serial.print(r_speed);
    Serial.println();

    set_motor_direction(left_motor, l_dir);
    set_motor_direction(right_motor, r_dir);

    // now set the speed.
    set_motor_speed(pwm_left, constrain(abs(l_speed), 0, 255));
    set_motor_speed(pwm_right, constrain(abs(r_speed), 0, 255));
}

void set_motor_direction(uint8_t motor, uint8_t dir) {
    // sets the motor in the direction wanted.
    bool direction = HIGH;
    if (dir == REVERSE) {
        direction = LOW;
    }
    digitalWrite(motor, direction);
}

void set_motor_speed(uint8_t motor, int8_t speed) {
    // sets the speed of the motor
    analogWrite(motor, speed);
}

