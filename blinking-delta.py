import time, random, sys
import RPi.GPIO as GPIO

operation = "blink"
speed = 1
ang0 = 8.27
ang90 = 6.8
ang180 = 4.7
initDC = ang0
needCycle = False

#check operation command first
argnum = len(sys.argv)
if argnum > 4 or argnum < 3:
    print "usage : %s GPIO_PIN 'blink|half|close|open'" %(sys.argv[0])
    sys.exit(-1)

GPIONum = int(sys.argv[1])
operation = sys.argv[2]

if operation == "blink" or operation == "helf":
    if argnum == 4:
        speed = int(sys.argv[3])

if speed > 3:
    speed = 3
    
if operation == "close":
    initDC = ang180
elif operation == "half":
    initDC = ang90
elif operation == "open":
    initDC = ang0
elif operation == "blink":
    needCycle = True
    
GPIO.setmode(GPIO.BCM)
GPIO.setup(GPIONum, GPIO.OUT)
p = GPIO.PWM(GPIONum, 50)  #frequency=50Hz
try:
    p.start(initDC)
    time.sleep(0.75)
    if needCycle == True:
        p.ChangeDutyCycle(ang180)
        time.sleep( (float)(speed)/10 + 0.2 )
        p.ChangeDutyCycle(ang0)
        time.sleep(1)

    p.stop()
    GPIO.cleanup()
except KeyboardInterrupt:
    p.stop()
    GPIO.cleanup()
