import AppKit
let dest = CommandLine.arguments[1]
let n = 1024
let rep = NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:n,pixelsHigh:n,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
NSGraphicsContext.saveGraphicsState();NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep:rep)
NSColor(calibratedRed:0.085,green:0.12,blue:0.16,alpha:1).setFill()
NSBezierPath(roundedRect:NSRect(x:20,y:20,width:984,height:984),xRadius:220,yRadius:220).fill()
let glow = NSGradient(starting:NSColor(calibratedRed:0.2,green:0.26,blue:0.24,alpha:1),ending:NSColor(calibratedRed:0.07,green:0.1,blue:0.15,alpha:1))!
glow.draw(in:NSBezierPath(roundedRect:NSRect(x:45,y:45,width:934,height:934),xRadius:196,yRadius:196),angle:-70)
NSColor(calibratedRed:0.65,green:0.61,blue:1,alpha:1).setStroke()
let ring=NSBezierPath(ovalIn:NSRect(x:166,y:166,width:692,height:692));ring.lineWidth=36;ring.stroke()
NSColor(calibratedRed:0.85,green:0.95,blue:0.42,alpha:1).setFill()
let play=NSBezierPath();play.move(to:NSPoint(x:410,y:330));play.line(to:NSPoint(x:410,y:690));play.line(to:NSPoint(x:690,y:510));play.close();play.fill()
NSColor(calibratedRed:0.85,green:0.95,blue:0.42,alpha:1).setFill();NSBezierPath(ovalIn:NSRect(x:695,y:705,width:150,height:150)).fill()
NSGraphicsContext.restoreGraphicsState()
try rep.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:dest))
